/**
 * Sound Bloom — your music, painted in light across your entire desktop.
 *
 * A click-through, always-on-top, per-pixel-alpha overlay that stretches across
 * every monitor and paints whatever is currently playing on the system — Spotify,
 * a YouTube tab, a game — as a living field of light. WASAPI loopback taps the
 * default render endpoint's mix, a 4096-point Hann-windowed Cooley-Tukey FFT
 * resolves it into 2048 magnitude bins, and those bins drive a radial equalizer:
 * 96 spectral petals fan out from screen center, each one a smooth premultiplied
 * glow that swells on its band and decays gracefully, while bass beats fire soft
 * bloom rings that ripple outward through the whole composition. Because the
 * window is WS_EX_LAYERED | WS_EX_TRANSPARENT you keep clicking straight through
 * it into your apps; the light just floats over everything, breathing with the
 * beat. Every visible pixel is composed in TypeScript into a top-down 32-bit
 * premultiplied-ARGB DIB and blitted with UpdateLayeredWindow — no GPU, no
 * shaders, no native addon.
 *
 * Pipeline (capture is polled from the timer — a JSCallback cannot run on the
 * audio driver thread, so loopback is drained synchronously each frame):
 *
 *   1. Ole32.CoInitializeEx(NULL, COINIT_MULTITHREADED)        — MTA for loopback
 *   2. Mmdevapi.DllGetClassObject(CLSID_MMDeviceEnumerator)    — class factory
 *   3. IClassFactory::CreateInstance → IMMDeviceEnumerator      (vtable slot 3)
 *   4. IMMDeviceEnumerator::GetDefaultAudioEndpoint(eRender)    (slot 4)
 *   5. IMMDevice::Activate(IID_IAudioClient, CLSCTX_ALL)        (slot 3)
 *   6. IAudioClient::GetMixFormat / Initialize(LOOPBACK) /      (slots 7/9/11/12)
 *        GetService(IID_IAudioCaptureClient) / Start
 *   7. per tick: IAudioCaptureClient::GetNextPacketSize /       (slots 5/3/4)
 *        GetBuffer / ReleaseBuffer → downmix float frames → rolling 4096 window
 *   8. Hann FFT → radial-equalizer + bloom render → UpdateLayeredWindow
 *
 * Capture path: the full WASAPI loopback COM chain is implemented and activates
 * cleanly (every HRESULT is S_OK through IMMDevice::Activate → IAudioClient), but
 * the IAudioClient handed back is a cross-process RPC proxy to audiodg.exe, and
 * invoking its methods through Bun's FFI trampoline segfaults inside AUDIOSES.DLL
 * / RPCRT4 on this runtime — an unrecoverable crash, not a catchable HRESULT.
 * (In-process COM such as XAudio2 and IMMDevice itself works fine over the same
 * invoker; only the audiodg proxy is incompatible.) So loopback is opt-in via
 * SOUND_BLOOM_LOOPBACK=1, and the overlay otherwise reacts to WinMM microphone
 * capture — which fft-constellation.ts proves end-to-end. The live capture path
 * is logged at startup, and the identical gorgeous overlay renders either way.
 *
 * APIs demonstrated:
 *   Ole32     CoInitializeEx, CoTaskMemFree, CoUninitialize
 *   Mmdevapi  DllGetClassObject (CLSID_MMDeviceEnumerator) + the full WASAPI
 *               loopback COM chain over the vtable: IClassFactory::CreateInstance,
 *               IMMDeviceEnumerator::GetDefaultAudioEndpoint, IMMDevice::Activate,
 *               IAudioClient::GetMixFormat/Initialize/GetService/Start/Stop,
 *               IAudioCaptureClient::GetNextPacketSize/GetBuffer/ReleaseBuffer,
 *               IUnknown::Release
 *   Winmm     waveInOpen/PrepareHeader/AddBuffer/Start/Stop/Reset/Unprepare/Close
 *               (fallback mic capture path)
 *   User32    RegisterClassExW, CreateWindowExW (WS_POPUP + WS_EX_LAYERED |
 *               TOPMOST | TRANSPARENT | TOOLWINDOW | NOACTIVATE),
 *               UpdateLayeredWindow, SetTimer/KillTimer, GetSystemMetrics,
 *               GetAsyncKeyState, GetDC/ReleaseDC, DefWindowProcW + JSCallback,
 *               GetMessageW/TranslateMessage/DispatchMessageW, PostQuitMessage,
 *               DestroyWindow, UnregisterClassW, PostMessageW, IsWindow
 *   GDI32     CreateCompatibleDC, CreateDIBSection (top-down 32-bit premultiplied
 *               ARGB), SelectObject, DeleteObject, DeleteDC
 *   Kernel32  SetConsoleCtrlHandler, Sleep
 *
 * Run: bun run example/sound-bloom.ts        (Press ESC or Ctrl+C to quit.)
 */

import { CFunction, FFIType, JSCallback, type Pointer, dlopen, read, toArrayBuffer } from 'bun:ffi';

import { GDI32, Gdiplus, Kernel32, Mmdevapi, User32, Winmm } from '../index';
import { CLSID_MMDeviceEnumerator, IID_IAudioClient, IID_IMMDeviceEnumerator } from '@bun-win32/mmdevapi';
import { Status } from '@bun-win32/gdiplus';
import { ExtendedWindowStyles, ShowWindowCommand, SystemMetric, VirtualKey, WindowStyles } from '@bun-win32/user32';
import { CallbackFlag, WAVE_MAPPER } from '@bun-win32/winmm';

// ── Win32 / COM constants the binding enums don't cover ───────────────────────

const NULL = 0n;
const NULL_PTR = null as unknown as Pointer;

const WM_DESTROY = 0x0002;
const WM_CLOSE = 0x0010;
const WM_TIMER = 0x0113;

const ULW_ALPHA = 0x02; // UpdateLayeredWindow: honor the BLENDFUNCTION.
const BI_RGB = 0; // Uncompressed 32-bit ARGB DIB.
const DIB_RGB_COLORS = 0;

const COINIT_MULTITHREADED = 0x0;
const RPC_E_CHANGED_MODE = 0x8001_0106 >>> 0;
const CLSCTX_ALL = 0x17;

// IClassFactory::CreateInstance — IUnknown(0/1/2), then 3.
const SLOT_CREATE_INSTANCE = 3;
// IMMDeviceEnumerator: 0/1/2 IUnknown, 3 EnumAudioEndpoints, 4 GetDefaultAudioEndpoint.
const SLOT_GET_DEFAULT_ENDPOINT = 4;
// IMMDevice: 0/1/2 IUnknown, 3 Activate.
const SLOT_ACTIVATE = 3;
// IAudioClient (audioclient.h order): 3 GetBufferSize, 7 GetMixFormat, 9 Initialize,
// 11 GetService, 12 Start, 13 Stop, 14 Reset.
const SLOT_GET_MIX_FORMAT = 7;
const SLOT_AC_INITIALIZE = 9;
const SLOT_GET_SERVICE = 11;
const SLOT_AC_START = 12;
const SLOT_AC_STOP = 13;
// IAudioCaptureClient: 3 GetBuffer, 4 ReleaseBuffer, 5 GetNextPacketSize.
const SLOT_GET_BUFFER = 3;
const SLOT_RELEASE_BUFFER = 4;
const SLOT_GET_NEXT_PACKET_SIZE = 5;
// IUnknown::Release.
const SLOT_RELEASE = 2;

const IID_ICLASSFACTORY = '00000001-0000-0000-c000-000000000046';
const IID_IAudioCaptureClient = 'c8adbd64-e71e-48a0-a4de-185c395cd317';

const AUDCLNT_SHAREMODE_SHARED = 0;
const AUDCLNT_STREAMFLAGS_LOOPBACK = 0x0002_0000;
const AUDCLNT_BUFFERFLAGS_SILENT = 0x2;
const AUDCLNT_S_BUFFER_EMPTY = 0x0889_0001 >>> 0;
const REFTIMES_PER_SEC_1S = 10_000_000n; // 1 s in REFERENCE_TIME (100-ns units).

const WAVE_FORMAT_PCM = 0x0001;
const WAVE_FORMAT_IEEE_FLOAT = 0x0003;
const WAVE_FORMAT_EXTENSIBLE = 0xfffe;

// ── FFT + audio constants (shared by both capture paths) ──────────────────────

const FFT_SIZE = 4_096; // power of two → 12 butterfly stages
const FFT_LOG2 = 12;
const FFT_BINS = FFT_SIZE / 2; // 2048 useful magnitude bins
const MIC_SAMPLE_RATE = 44_100; // fallback mic capture rate

// ── Render constants ──────────────────────────────────────────────────────────

const TIMER_ID = 1n;
const FRAME_INTERVAL_MS = 16; // ~60 fps
const PETAL_COUNT = 96; // radial equalizer spokes
const RING_LIMIT = 6; // simultaneous bass bloom rings

// ── Debug DIB dump (SOUND_BLOOM_DUMP=1) ───────────────────────────────────────
// One-shot encode of the rendered DIB straight to PNG, bypassing the screen — so
// we can tell whether the renderer produces a bright bloom (the DIB is good and
// any invisibility is a compositing bug) or a near-black field (a renderer bug).
const dumpEnabled = process.env.SOUND_BLOOM_DUMP === '1';
const DUMP_AT_FRAME = 40;
const PixelFormat32bppARGB = 0x0026200a;

const hex = (value: number): string => `0x${(value >>> 0).toString(16).padStart(8, '0')}`;
const encode = (text: string): Buffer => Buffer.from(`${text}\0`, 'utf16le');

function guidBytes(value: string): Buffer {
  const match = /^([0-9a-f]{8})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{12})$/i.exec(value);
  if (match === null) throw new Error(`Invalid GUID: ${value}`);
  const [, d1, d2, d3, d4High, d4Low] = match;
  const buffer = Buffer.alloc(16);
  buffer.writeUInt32LE(parseInt(d1, 16), 0);
  buffer.writeUInt16LE(parseInt(d2, 16), 4);
  buffer.writeUInt16LE(parseInt(d3, 16), 6);
  const data4 = `${d4High}${d4Low}`;
  for (let i = 0; i < 8; i += 1) buffer[8 + i] = parseInt(data4.slice(i * 2, i * 2 + 2), 16);
  return buffer;
}

// ── COM vtable invoker (copied verbatim from xaudio2_9-fm-synth.ts) ────────────

const invokers = new Map<string, ReturnType<typeof CFunction>>();

/**
 * Invokes COM vtable slot `slot` on interface pointer `thisPtr`. The implicit
 * `this` is prepended; the bound CFunction is memoized per (method, signature)
 * so the per-frame capture drain stays cheap.
 */
function vcall(thisPtr: bigint, slot: number, argTypes: readonly FFIType[], args: readonly unknown[], returns: FFIType = FFIType.i32): number {
  const vtable = read.u64(Number(thisPtr) as Pointer, 0);
  const method = read.u64(Number(vtable) as Pointer, slot * 8);
  const key = `${method}|${returns}|${argTypes.join(',')}`;
  let invoke = invokers.get(key);
  if (invoke === undefined) {
    invoke = CFunction({ ptr: Number(method) as Pointer, args: [FFIType.u64, ...argTypes], returns });
    invokers.set(key, invoke);
  }
  return invoke(thisPtr, ...args);
}

function comRelease(thisPtr: bigint): void {
  if (thisPtr !== 0n) vcall(thisPtr, SLOT_RELEASE, [], [], FFIType.u32);
}

// COM lifecycle from ole32.dll directly — the @bun-win32/ole32 binding exposes
// CoInitialize (STA only) but not CoInitializeEx/CoUninitialize, and WASAPI
// loopback requires an MTA apartment (COINIT_MULTITHREADED).
const ole32 = dlopen('ole32.dll', {
  CoInitializeEx: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
  CoTaskMemFree: { args: [FFIType.u64], returns: FFIType.void },
  CoUninitialize: { args: [], returns: FFIType.void },
});

// ── FFT (in-place Cooley-Tukey, radix-2; verbatim from fft-constellation.ts) ──

const hannWindow = new Float32Array(FFT_SIZE);
for (let i = 0; i < FFT_SIZE; i += 1) {
  hannWindow[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (FFT_SIZE - 1)));
}

const bitReversalIndex = new Uint16Array(FFT_SIZE);
for (let i = 0; i < FFT_SIZE; i += 1) {
  let reversed = 0;
  let value = i;
  for (let bit = 0; bit < FFT_LOG2; bit += 1) {
    reversed = (reversed << 1) | (value & 1);
    value >>>= 1;
  }
  bitReversalIndex[i] = reversed;
}

const twiddleCos: Float32Array[] = [];
const twiddleSin: Float32Array[] = [];
for (let stage = 0; stage < FFT_LOG2; stage += 1) {
  const half = 1 << stage;
  const cos = new Float32Array(half);
  const sin = new Float32Array(half);
  for (let k = 0; k < half; k += 1) {
    const theta = (-Math.PI * k) / half;
    cos[k] = Math.cos(theta);
    sin[k] = Math.sin(theta);
  }
  twiddleCos.push(cos);
  twiddleSin.push(sin);
}

const fftReal = new Float32Array(FFT_SIZE);
const fftImag = new Float32Array(FFT_SIZE);
const magnitudes = new Float32Array(FFT_BINS);

/** In-place radix-2 FFT over (fftReal, fftImag); fills `magnitudes`. */
function runFftInPlace(): void {
  for (let i = 0; i < FFT_SIZE; i += 1) {
    const j = bitReversalIndex[i]!;
    if (j > i) {
      const tmpRe = fftReal[i]!;
      fftReal[i] = fftReal[j]!;
      fftReal[j] = tmpRe;
      const tmpIm = fftImag[i]!;
      fftImag[i] = fftImag[j]!;
      fftImag[j] = tmpIm;
    }
  }
  for (let stage = 0; stage < FFT_LOG2; stage += 1) {
    const half = 1 << stage;
    const blockSize = half << 1;
    const cosTable = twiddleCos[stage]!;
    const sinTable = twiddleSin[stage]!;
    for (let start = 0; start < FFT_SIZE; start += blockSize) {
      for (let k = 0; k < half; k += 1) {
        const evenIndex = start + k;
        const oddIndex = evenIndex + half;
        const evenRe = fftReal[evenIndex]!;
        const evenIm = fftImag[evenIndex]!;
        const oddRe = fftReal[oddIndex]!;
        const oddIm = fftImag[oddIndex]!;
        const wCos = cosTable[k]!;
        const wSin = sinTable[k]!;
        const tRe = wCos * oddRe - wSin * oddIm;
        const tIm = wCos * oddIm + wSin * oddRe;
        fftReal[evenIndex] = evenRe + tRe;
        fftImag[evenIndex] = evenIm + tIm;
        fftReal[oddIndex] = evenRe - tRe;
        fftImag[oddIndex] = evenIm - tIm;
      }
    }
  }
  const norm = 1 / (FFT_SIZE * 0.5);
  for (let k = 0; k < FFT_BINS; k += 1) {
    const re = fftReal[k]!;
    const im = fftImag[k]!;
    magnitudes[k] = Math.sqrt(re * re + im * im) * norm;
  }
}

// ── Rolling sample window shared by whichever capture path is live ────────────

// Most-recent FFT_SIZE mono samples in [-1, 1]. The capture drain shifts new
// frames in at the tail; the renderer reads the whole window each frame.
const sampleWindow = new Float32Array(FFT_SIZE);
let captureSampleRate = MIC_SAMPLE_RATE;
let totalFramesCaptured = 0;

/** Append `count` mono samples from `src` to the rolling window (shift-in). */
function pushMonoSamples(src: Float32Array, count: number): void {
  if (count <= 0) return;
  if (count >= FFT_SIZE) {
    sampleWindow.set(src.subarray(count - FFT_SIZE, count));
  } else {
    sampleWindow.copyWithin(0, count, FFT_SIZE);
    sampleWindow.set(src.subarray(0, count), FFT_SIZE - count);
  }
  totalFramesCaptured += count;
}

// ── WASAPI loopback capture (primary path) ────────────────────────────────────

interface LoopbackChain {
  audioClient: bigint;
  captureClient: bigint;
  channels: number;
  isFloat: boolean;
  bytesPerSample: number; // per single channel
  blockAlign: number; // bytes per frame (all channels)
}

let loopback: LoopbackChain | null = null;
let loopbackEnumerator = 0n;
let loopbackDevice = 0n;
let comInitialized = false;
let loopbackMixSummary = '';

// Scratch decoded into mono before pushing to the window (sized to a generous
// single packet; WASAPI shared-mode packets are well under this).
const loopbackMono = new Float32Array(FFT_SIZE * 2);

/**
 * Bring up the full WASAPI loopback COM chain on the default render endpoint.
 * Returns true on success; on any failure it releases whatever it built and
 * returns false so the caller can fall back to mic capture.
 */
function startLoopbackCapture(): boolean {
  const coHr = ole32.symbols.CoInitializeEx(null, COINIT_MULTITHREADED);
  if (coHr < 0 && coHr >>> 0 !== RPC_E_CHANGED_MODE) {
    console.warn(`  loopback: CoInitializeEx → ${hex(coHr)}`);
    return false;
  }
  comInitialized = coHr >= 0;

  const clsidEnumerator = guidBytes(CLSID_MMDeviceEnumerator);
  const iidClassFactory = guidBytes(IID_ICLASSFACTORY);
  const iidEnumerator = guidBytes(IID_IMMDeviceEnumerator);
  const iidAudioClient = guidBytes(IID_IAudioClient);
  const iidCaptureClient = guidBytes(IID_IAudioCaptureClient);

  const factoryOut = Buffer.alloc(8);
  const factoryHr = Mmdevapi.DllGetClassObject(clsidEnumerator.ptr!, iidClassFactory.ptr!, factoryOut.ptr!);
  const factory = factoryHr === 0 ? factoryOut.readBigUInt64LE(0) : 0n;
  if (factory === 0n) {
    console.warn(`  loopback: DllGetClassObject → ${hex(factoryHr)}`);
    return false;
  }

  // IClassFactory::CreateInstance(pUnkOuter=NULL, IID_IMMDeviceEnumerator, &enum)
  const enumOut = Buffer.alloc(8);
  const createHr = vcall(factory, SLOT_CREATE_INSTANCE, [FFIType.u64, FFIType.ptr, FFIType.ptr], [0n, iidEnumerator.ptr!, enumOut.ptr!]);
  comRelease(factory);
  loopbackEnumerator = createHr === 0 ? enumOut.readBigUInt64LE(0) : 0n;
  if (loopbackEnumerator === 0n) {
    console.warn(`  loopback: CreateInstance(IMMDeviceEnumerator) → ${hex(createHr)}`);
    return false;
  }

  // IMMDeviceEnumerator::GetDefaultAudioEndpoint(eRender=0, eConsole=0, &device)
  const deviceOut = Buffer.alloc(8);
  const endpointHr = vcall(loopbackEnumerator, SLOT_GET_DEFAULT_ENDPOINT, [FFIType.u32, FFIType.u32, FFIType.ptr], [0, 0, deviceOut.ptr!]);
  loopbackDevice = endpointHr === 0 ? deviceOut.readBigUInt64LE(0) : 0n;
  if (loopbackDevice === 0n) {
    console.warn(`  loopback: GetDefaultAudioEndpoint(eRender) → ${hex(endpointHr)} (no render endpoint?)`);
    return false;
  }

  // IMMDevice::Activate(IID_IAudioClient, CLSCTX_ALL, NULL, &audioClient)
  const audioClientOut = Buffer.alloc(8);
  const activateHr = vcall(loopbackDevice, SLOT_ACTIVATE, [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], [iidAudioClient.ptr!, CLSCTX_ALL, null, audioClientOut.ptr!]);
  const audioClient = activateHr === 0 ? audioClientOut.readBigUInt64LE(0) : 0n;
  if (audioClient === 0n) {
    console.warn(`  loopback: IMMDevice::Activate(IAudioClient) → ${hex(activateHr)}`);
    return false;
  }

  // IAudioClient::GetMixFormat(&pWaveFormatEx)
  const mixFormatOut = Buffer.alloc(8);
  const mixHr = vcall(audioClient, SLOT_GET_MIX_FORMAT, [FFIType.ptr], [mixFormatOut.ptr!]);
  const mixFormatAddr = mixHr === 0 ? mixFormatOut.readBigUInt64LE(0) : 0n;
  if (mixFormatAddr === 0n) {
    console.warn(`  loopback: GetMixFormat → ${hex(mixHr)}`);
    comRelease(audioClient);
    return false;
  }

  // Decode the mix WAVEFORMATEX (read 40 bytes — covers WAVEFORMATEXTENSIBLE).
  const wfxBytes = new Uint8Array(toArrayBuffer(Number(mixFormatAddr) as Pointer, 0, 40));
  const wfxView = new DataView(wfxBytes.buffer);
  let formatTag = wfxView.getUint16(0, true);
  const channels = wfxView.getUint16(2, true);
  const sampleRate = wfxView.getUint32(4, true);
  const blockAlign = wfxView.getUint16(12, true);
  const bitsPerSample = wfxView.getUint16(14, true);
  if (formatTag === WAVE_FORMAT_EXTENSIBLE) {
    // SubFormat GUID Data1 (offset 26) carries the real tag for EXTENSIBLE.
    formatTag = wfxView.getUint16(26, true) === WAVE_FORMAT_IEEE_FLOAT ? WAVE_FORMAT_IEEE_FLOAT : WAVE_FORMAT_PCM;
  }
  const isFloat = formatTag === WAVE_FORMAT_IEEE_FLOAT;
  const bytesPerSample = Math.max(1, Math.floor(bitsPerSample / 8));

  // IAudioClient::Initialize(SHARED, LOOPBACK, hnsBufferDuration=1s, 0, pWfx, NULL)
  // The format Buffer's pointer must stay valid across the call — pass the
  // DLL-owned mix-format address directly (it lives until CoTaskMemFree below).
  const initHr = vcall(audioClient, SLOT_AC_INITIALIZE, [FFIType.u32, FFIType.u32, FFIType.i64, FFIType.i64, FFIType.u64, FFIType.ptr], [AUDCLNT_SHAREMODE_SHARED, AUDCLNT_STREAMFLAGS_LOOPBACK, REFTIMES_PER_SEC_1S, 0n, mixFormatAddr, null]);
  ole32.symbols.CoTaskMemFree(mixFormatAddr);
  if (initHr !== 0) {
    console.warn(`  loopback: IAudioClient::Initialize(LOOPBACK) → ${hex(initHr)}`);
    comRelease(audioClient);
    return false;
  }

  // IAudioClient::GetService(IID_IAudioCaptureClient, &captureClient)
  const captureOut = Buffer.alloc(8);
  const serviceHr = vcall(audioClient, SLOT_GET_SERVICE, [FFIType.ptr, FFIType.ptr], [iidCaptureClient.ptr!, captureOut.ptr!]);
  const captureClient = serviceHr === 0 ? captureOut.readBigUInt64LE(0) : 0n;
  if (captureClient === 0n) {
    console.warn(`  loopback: GetService(IAudioCaptureClient) → ${hex(serviceHr)}`);
    comRelease(audioClient);
    return false;
  }

  // IAudioClient::Start
  const startHr = vcall(audioClient, SLOT_AC_START, [], []);
  if (startHr !== 0) {
    console.warn(`  loopback: IAudioClient::Start → ${hex(startHr)}`);
    comRelease(captureClient);
    comRelease(audioClient);
    return false;
  }

  loopback = { audioClient, captureClient, channels: Math.max(1, channels), isFloat, bytesPerSample, blockAlign: Math.max(1, blockAlign) };
  captureSampleRate = sampleRate || MIC_SAMPLE_RATE;
  loopbackMixSummary = `${captureSampleRate} Hz · ${Math.max(1, channels)} ch · ${isFloat ? 'float32' : `int${bitsPerSample}`} mix`;
  return true;
}

// Reusable out-params for the per-frame drain (GetBuffer fills these).
const lbDataPtrOut = Buffer.alloc(8);
const lbNumFramesOut = Buffer.alloc(4);
const lbFlagsOut = Buffer.alloc(4);
const lbPacketOut = Buffer.alloc(4);

/** Drain every queued loopback packet into the rolling window. */
function pollLoopbackCapture(): void {
  const chain = loopback;
  if (chain === null) return;
  const { captureClient, channels, isFloat, bytesPerSample, blockAlign } = chain;

  // GetNextPacketSize → while a packet is ready, GetBuffer / decode / ReleaseBuffer.
  for (let guard = 0; guard < 64; guard += 1) {
    const sizeHr = vcall(captureClient, SLOT_GET_NEXT_PACKET_SIZE, [FFIType.ptr], [lbPacketOut.ptr!]);
    if (sizeHr !== 0) {
      if (sizeHr >>> 0 !== AUDCLNT_S_BUFFER_EMPTY) loopback = null; // hard error → stop draining
      return;
    }
    if (lbPacketOut.readUInt32LE(0) === 0) return; // nothing pending

    const getHr = vcall(captureClient, SLOT_GET_BUFFER, [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], [lbDataPtrOut.ptr!, lbNumFramesOut.ptr!, lbFlagsOut.ptr!, null, null]);
    if (getHr !== 0) return;
    const numFrames = lbNumFramesOut.readUInt32LE(0);
    const flags = lbFlagsOut.readUInt32LE(0);
    const dataAddr = lbDataPtrOut.readBigUInt64LE(0);

    if (numFrames > 0 && dataAddr !== 0n && (flags & AUDCLNT_BUFFERFLAGS_SILENT) === 0) {
      const frames = Math.min(numFrames, loopbackMono.length);
      const bytes = new Uint8Array(toArrayBuffer(Number(dataAddr) as Pointer, 0, numFrames * blockAlign));
      const view = new DataView(bytes.buffer);
      for (let f = 0; f < frames; f += 1) {
        const base = f * blockAlign;
        let sum = 0;
        for (let c = 0; c < channels; c += 1) {
          const off = base + c * bytesPerSample;
          if (isFloat) sum += view.getFloat32(off, true);
          else if (bytesPerSample === 2) sum += view.getInt16(off, true) / 32_768;
          else sum += view.getInt32(off, true) / 2_147_483_648;
        }
        loopbackMono[f] = sum / channels;
      }
      pushMonoSamples(loopbackMono, frames);
    } else if (numFrames > 0 && (flags & AUDCLNT_BUFFERFLAGS_SILENT) !== 0) {
      // Driver reports silence — shift in zeros so the bloom decays naturally.
      for (let f = 0; f < Math.min(numFrames, loopbackMono.length); f += 1) loopbackMono[f] = 0;
      pushMonoSamples(loopbackMono, Math.min(numFrames, loopbackMono.length));
    }

    vcall(captureClient, SLOT_RELEASE_BUFFER, [FFIType.u32], [numFrames], FFIType.i32);
  }
}

function stopLoopbackCapture(): void {
  if (loopback !== null) {
    vcall(loopback.audioClient, SLOT_AC_STOP, [], []);
    comRelease(loopback.captureClient);
    comRelease(loopback.audioClient);
    loopback = null;
  }
  comRelease(loopbackDevice);
  loopbackDevice = 0n;
  comRelease(loopbackEnumerator);
  loopbackEnumerator = 0n;
  if (comInitialized) {
    ole32.symbols.CoUninitialize();
    comInitialized = false;
  }
}

// ── WinMM microphone capture (fallback path) ──────────────────────────────────

const MIC_BUFFER_COUNT = 4;
const WAVEHDR_BYTES = 48;
const WHDR_DONE = 0x0000_0001;
const MIC_BLOCK_ALIGN = 2; // mono 16-bit

let micHandle = 0n;
let micPreparedCount = 0;
const micPcmBuffers: Buffer[] = [];
const micHeaderBuffers: Buffer[] = [];
const micDecoded = new Float32Array(FFT_SIZE);
for (let i = 0; i < MIC_BUFFER_COUNT; i += 1) {
  micPcmBuffers.push(Buffer.alloc(FFT_SIZE * MIC_BLOCK_ALIGN));
  micHeaderBuffers.push(Buffer.alloc(WAVEHDR_BYTES));
}

function buildMicFormat(): Buffer {
  const wfx = Buffer.alloc(18);
  wfx.writeUInt16LE(WAVE_FORMAT_PCM, 0);
  wfx.writeUInt16LE(1, 2); // mono
  wfx.writeUInt32LE(MIC_SAMPLE_RATE, 4);
  wfx.writeUInt32LE(MIC_SAMPLE_RATE * MIC_BLOCK_ALIGN, 8);
  wfx.writeUInt16LE(MIC_BLOCK_ALIGN, 12);
  wfx.writeUInt16LE(16, 14);
  wfx.writeUInt16LE(0, 16);
  return wfx;
}

function initMicHeader(index: number): void {
  const header = micHeaderBuffers[index]!;
  const samples = micPcmBuffers[index]!;
  header.writeBigUInt64LE(BigInt(samples.ptr!), 0);
  header.writeUInt32LE(samples.byteLength, 8);
  header.writeUInt32LE(0, 12);
  header.writeBigUInt64LE(0n, 16);
  header.writeUInt32LE(0, 24);
  header.writeUInt32LE(0, 28);
  header.writeBigUInt64LE(0n, 32);
  header.writeBigUInt64LE(0n, 40);
}

function startMicCapture(): boolean {
  const handleOut = Buffer.alloc(8);
  const format = buildMicFormat();
  const openStatus = Winmm.waveInOpen(handleOut.ptr!, WAVE_MAPPER, format.ptr!, 0n, 0n, CallbackFlag.CALLBACK_NULL);
  if (openStatus !== 0) {
    console.warn(`  mic fallback: waveInOpen → status ${openStatus}`);
    return false;
  }
  micHandle = handleOut.readBigUInt64LE(0);
  for (let i = 0; i < MIC_BUFFER_COUNT; i += 1) {
    initMicHeader(i);
    const header = micHeaderBuffers[i]!;
    if (Winmm.waveInPrepareHeader(micHandle, header.ptr!, header.byteLength) !== 0) return false;
    micPreparedCount += 1;
    if (Winmm.waveInAddBuffer(micHandle, header.ptr!, header.byteLength) !== 0) return false;
  }
  if (Winmm.waveInStart(micHandle) !== 0) return false;
  captureSampleRate = MIC_SAMPLE_RATE;
  return true;
}

function pollMicCapture(): void {
  if (micHandle === 0n) return;
  for (let i = 0; i < MIC_BUFFER_COUNT; i += 1) {
    const header = micHeaderBuffers[i]!;
    const flags = header.readUInt32LE(24);
    if ((flags & WHDR_DONE) === 0) continue;
    const bytesRecorded = header.readUInt32LE(12);
    const sampleCount = Math.min(FFT_SIZE, Math.floor(bytesRecorded / MIC_BLOCK_ALIGN));
    const pcm = micPcmBuffers[i]!;
    for (let s = 0; s < sampleCount; s += 1) micDecoded[s] = pcm.readInt16LE(s * 2) / 32_768;
    if (sampleCount > 0) pushMonoSamples(micDecoded, sampleCount);
    // Re-arm: clear WHDR_DONE, preserve WHDR_PREPARED, re-queue.
    header.writeUInt32LE(0, 12);
    header.writeUInt32LE(flags & ~WHDR_DONE, 24);
    Winmm.waveInAddBuffer(micHandle, header.ptr!, header.byteLength);
  }
}

function stopMicCapture(): void {
  if (micHandle === 0n) return;
  Winmm.waveInStop(micHandle);
  Winmm.waveInReset(micHandle);
  for (let i = 0; i < micPreparedCount; i += 1) {
    Winmm.waveInUnprepareHeader(micHandle, micHeaderBuffers[i]!.ptr!, micHeaderBuffers[i]!.byteLength);
  }
  Winmm.waveInClose(micHandle);
  micHandle = 0n;
}

// ── Capture path selection ────────────────────────────────────────────────────

type CapturePath = 'loopback' | 'mic' | 'none';
let capturePath: CapturePath = 'none';

// WASAPI loopback is fully implemented below: the COM chain resolves the
// MMDeviceEnumerator factory, creates IMMDeviceEnumerator, gets the default
// render endpoint, and activates IAudioClient — all succeeding (HRESULT S_OK).
// However, the IAudioClient returned by IMMDevice::Activate is a cross-process
// RPC proxy to audiodg.exe, and invoking ANY of its methods (GetMixFormat,
// GetBufferSize, …) through Bun's FFI trampoline segfaults inside AUDIOSES.DLL /
// RPCRT4 — an unrecoverable crash (not a catchable HRESULT) caused by the COM
// call-context the marshaler expects on the calling thread not being present.
// In-process COM (XAudio2, IMMDevice itself) works fine over the same vcall;
// only the audiodg proxy is incompatible. We therefore keep loopback opt-in via
// SOUND_BLOOM_LOOPBACK=1 (so the demo defaults to the proven, crash-free mic
// path) and degrade to mic if the loopback bring-up returns a soft failure.
const loopbackOptIn = process.env.SOUND_BLOOM_LOOPBACK === '1';

/** Pick a capture path: opt-in loopback first, else mic, else silence. */
function startCapture(): CapturePath {
  if (loopbackOptIn) {
    console.warn('  SOUND_BLOOM_LOOPBACK=1 — attempting WASAPI loopback (system playback).');
    console.warn('  Note: invoking the audiodg IAudioClient proxy via FFI may crash on this runtime.');
    if (startLoopbackCapture()) return 'loopback';
    console.warn('  loopback bring-up failed — falling back to microphone capture.');
    stopLoopbackCapture(); // unwind partial loopback init + CoUninitialize
  } else {
    console.warn('  Using microphone capture (default). Set SOUND_BLOOM_LOOPBACK=1 to try system loopback.');
  }
  if (startMicCapture()) return 'mic';
  console.warn('  microphone capture unavailable too — the bloom will idle silently.');
  return 'none';
}

function pollCapture(): void {
  if (capturePath === 'loopback') pollLoopbackCapture();
  else if (capturePath === 'mic') pollMicCapture();
}

function stopCapture(): void {
  if (capturePath === 'loopback') stopLoopbackCapture();
  else if (capturePath === 'mic') stopMicCapture();
}

// ── Overlay geometry: the full virtual desktop ────────────────────────────────

const originX = User32.GetSystemMetrics(SystemMetric.SM_XVIRTUALSCREEN);
const originY = User32.GetSystemMetrics(SystemMetric.SM_YVIRTUALSCREEN);
const overlayWidth = User32.GetSystemMetrics(SystemMetric.SM_CXVIRTUALSCREEN);
const overlayHeight = User32.GetSystemMetrics(SystemMetric.SM_CYVIRTUALSCREEN);
const isRemoteSession = User32.GetSystemMetrics(SystemMetric.SM_REMOTESESSION) !== 0;

// The overlay window spans the WHOLE virtual desktop (so the bloom floats over
// every monitor and stays click-through everywhere), but the bloom itself is
// centered and bounded. Compositing the entire multi-monitor framebuffer in JS
// every frame would cap us well under 60 fps, so the per-frame float accumulators
// + tone-map cover only a centered ACTIVE region; pixels outside it are written
// transparent once and left alone. The region is a generous square sized to the
// shorter desktop axis, capped so the work stays cheap on ultrawide / multi-mon.
const ACTIVE_MAX = 1200;
const activeW = Math.min(overlayWidth, ACTIVE_MAX);
const activeH = Math.min(overlayHeight, ACTIVE_MAX);
const activeLeft = Math.floor((overlayWidth - activeW) / 2);
const activeTop = Math.floor((overlayHeight - activeH) / 2);

// ── Color helpers ─────────────────────────────────────────────────────────────

interface Color {
  red: number;
  green: number;
  blue: number;
}

/** HSL→RGB. hue ∈ [0,1), saturation/lightness ∈ [0,1]. */
function hslToRgb(hue: number, saturation: number, lightness: number): Color {
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const sextant = (hue - Math.floor(hue)) * 6;
  const x = chroma * (1 - Math.abs((sextant % 2) - 1));
  let r1 = 0,
    g1 = 0,
    b1 = 0;
  if (sextant < 1) {
    r1 = chroma;
    g1 = x;
  } else if (sextant < 2) {
    r1 = x;
    g1 = chroma;
  } else if (sextant < 3) {
    g1 = chroma;
    b1 = x;
  } else if (sextant < 4) {
    g1 = x;
    b1 = chroma;
  } else if (sextant < 5) {
    r1 = x;
    b1 = chroma;
  } else {
    r1 = chroma;
    b1 = x;
  }
  const m = lightness - chroma / 2;
  return { red: Math.round((r1 + m) * 255), green: Math.round((g1 + m) * 255), blue: Math.round((b1 + m) * 255) };
}

// ── Window class + click-through layered overlay ──────────────────────────────

const className = encode('BunWin32SoundBloomOverlay');
let overlayHwnd = NULL;
let shouldExit = false;

const wndProc = new JSCallback(
  (hWnd: bigint, msg: number, wParam: bigint, lParam: bigint): bigint => {
    if (msg === WM_TIMER) return 0n; // tick work runs after DispatchMessageW
    if (msg === WM_CLOSE) {
      User32.DestroyWindow(hWnd);
      return 0n;
    }
    if (msg === WM_DESTROY) {
      User32.PostQuitMessage(0);
      return 0n;
    }
    return BigInt(User32.DefWindowProcW(hWnd, msg, wParam, lParam));
  },
  { args: ['u64', 'u32', 'u64', 'i64'], returns: 'i64' },
);

// ── Boot banner ───────────────────────────────────────────────────────────────

console.log('Sound Bloom — your music, painted in light across your entire desktop.');
console.log(`  Overlay  : ${overlayWidth}×${overlayHeight} @ (${originX}, ${originY})  (full virtual desktop)`);
console.log(`  Bloom    : ${activeW}×${activeH} centered active region @ (${activeLeft}, ${activeTop})`);
console.log(`  Render   : ${PETAL_COUNT}-petal radial equalizer + bass bloom, premultiplied ARGB @ ~60 fps`);
console.log(`  FFT      : ${FFT_SIZE}-sample Hann Cooley-Tukey → ${FFT_BINS} bins`);
console.log('');

if (isRemoteSession) {
  console.log('  Remote session detected (SM_REMOTESESSION) — layered overlays and');
  console.log('  audio loopback are unreliable over RDP. Exiting cleanly.');
  process.exit(0);
}

capturePath = startCapture();
console.log(`  Capture  : ${capturePath === 'loopback' ? 'WASAPI loopback (system playback)' : capturePath === 'mic' ? 'WinMM microphone (fallback)' : 'none (silent)'}`);
if (capturePath === 'loopback') console.log(`             ${loopbackMixSummary}`);
console.log('  Move/click through it freely. Press ESC or Ctrl+C to quit.');
console.log('');

// WNDCLASSEXW is 80 bytes on x64.
const wndClassBuf = Buffer.alloc(80);
new DataView(wndClassBuf.buffer).setUint32(0, 80, true); // cbSize
wndClassBuf.writeBigUInt64LE(BigInt(wndProc.ptr!), 8); // lpfnWndProc
wndClassBuf.writeBigUInt64LE(BigInt(className.ptr!), 64); // lpszClassName

if (!User32.RegisterClassExW(wndClassBuf.ptr!)) {
  console.error('RegisterClassExW failed');
  stopCapture();
  process.exit(1);
}

overlayHwnd = User32.CreateWindowExW(
  ExtendedWindowStyles.WS_EX_TOPMOST | ExtendedWindowStyles.WS_EX_LAYERED | ExtendedWindowStyles.WS_EX_TRANSPARENT | ExtendedWindowStyles.WS_EX_TOOLWINDOW | ExtendedWindowStyles.WS_EX_NOACTIVATE,
  className.ptr!,
  encode('Sound Bloom').ptr!,
  WindowStyles.WS_POPUP | WindowStyles.WS_VISIBLE,
  originX,
  originY,
  overlayWidth,
  overlayHeight,
  NULL,
  NULL,
  NULL,
  NULL_PTR,
);
if (!overlayHwnd) {
  console.error('CreateWindowExW failed');
  stopCapture();
  process.exit(1);
}
// WS_VISIBLE alone does not reliably show a layered WS_EX_NOACTIVATE overlay — show it
// explicitly (without activating, since it is click-through / no-activate).
User32.ShowWindow(overlayHwnd, ShowWindowCommand.SW_SHOWNA);

// ── 32-bit ARGB DIB section ───────────────────────────────────────────────────

const screenDC = User32.GetDC(NULL);
const memoryDC = GDI32.CreateCompatibleDC(screenDC);

const bmi = Buffer.alloc(40);
bmi.writeUInt32LE(40, 0); // biSize
bmi.writeInt32LE(overlayWidth, 4); // biWidth
bmi.writeInt32LE(-overlayHeight, 8); // biHeight (negative = top-down)
bmi.writeUInt16LE(1, 12); // biPlanes
bmi.writeUInt16LE(32, 14); // biBitCount
bmi.writeUInt32LE(BI_RGB, 16); // biCompression

const ppvBits = Buffer.alloc(8);
const dibBitmap = GDI32.CreateDIBSection(memoryDC, bmi.ptr!, DIB_RGB_COLORS, ppvBits.ptr!, NULL, 0);
if (!dibBitmap) {
  console.error('CreateDIBSection failed');
  stopCapture();
  process.exit(1);
}
GDI32.SelectObject(memoryDC, dibBitmap);

const pixelByteCount = overlayWidth * overlayHeight * 4;
const pixelAddress = Number(ppvBits.readBigUInt64LE(0)) as Pointer;
const pixelView = new Uint32Array(toArrayBuffer(pixelAddress, 0, pixelByteCount));
// The DIB starts fully transparent (CreateDIBSection zero-fills); we only ever
// touch the centered active region, so the rest stays transparent forever.
// Float accumulators (active-region sized) for premultiplied R/G/B with smooth
// temporal decay — this is what produces the luminous bloom after-glow.
const accumR = new Float32Array(activeW * activeH);
const accumG = new Float32Array(activeW * activeH);
const accumB = new Float32Array(activeW * activeH);

// ── Persistent UpdateLayeredWindow parameter blocks ───────────────────────────

const dstPoint = Buffer.alloc(8);
dstPoint.writeInt32LE(originX, 0);
dstPoint.writeInt32LE(originY, 4);
const sizeBuf = Buffer.alloc(8);
sizeBuf.writeInt32LE(overlayWidth, 0);
sizeBuf.writeInt32LE(overlayHeight, 4);
const srcPoint = Buffer.alloc(8);

const blendFunction = Buffer.alloc(4);
blendFunction.writeUInt8(0, 0); // AC_SRC_OVER
blendFunction.writeUInt8(0, 1); // BlendFlags
blendFunction.writeUInt8(255, 2); // SourceConstantAlpha
blendFunction.writeUInt8(1, 3); // AC_SRC_ALPHA

// ── Radial equalizer state ────────────────────────────────────────────────────

// All bloom geometry is expressed in ACTIVE-region coordinates (origin at the
// active region's top-left), so the heavy per-pixel loops never exceed it.
const centerX = activeW / 2;
const centerY = activeH / 2;
const maxRadius = Math.min(centerX, centerY) * 0.96;
const innerRadius = Math.min(centerX, centerY) * 0.12;

// Per-petal smoothed energy + base hue.
const petalEnergy = new Float32Array(PETAL_COUNT);
const petalHue = new Float32Array(PETAL_COUNT);
for (let p = 0; p < PETAL_COUNT; p += 1) petalHue[p] = (p / PETAL_COUNT) * 0.85 + 0.55;

// Log-spaced bin ranges so bass and treble each get fair petal coverage.
const petalBinStart = new Int32Array(PETAL_COUNT);
const petalBinEnd = new Int32Array(PETAL_COUNT);
{
  const minBin = 2;
  const maxBin = FFT_BINS - 1;
  const logMin = Math.log(minBin);
  const logMax = Math.log(maxBin);
  for (let p = 0; p < PETAL_COUNT; p += 1) {
    const lo = Math.exp(logMin + ((logMax - logMin) * p) / PETAL_COUNT);
    const hi = Math.exp(logMin + ((logMax - logMin) * (p + 1)) / PETAL_COUNT);
    petalBinStart[p] = Math.max(minBin, Math.floor(lo));
    petalBinEnd[p] = Math.max(petalBinStart[p]! + 1, Math.floor(hi));
  }
}

interface BloomRing {
  radius: number;
  strength: number;
  hue: number;
}
const bloomRings: BloomRing[] = [];
let beatEnvelope = 0;
let bassPrev = 0;
let phase = 0; // slow global rotation of the whole bloom

// ── Idle animation + microphone auto-gain ─────────────────────────────────────
// The overlay must look gorgeous with ZERO audio. We track a running peak of the
// captured signal and normalize the FFT magnitudes so even a near-silent mic
// drives a lively bloom; an input-energy envelope crossfades between a fully
// procedural IDLE aurora (layered sines, no audio needed) and the live-reactive
// equalizer, so there is no hard switch between "silent" and "loud".
let micPeak = 0.02; // running signal peak (auto-gain denominator), floored
let inputEnvelope = 0; // 0 = pure idle, →1 = strongly reactive
let idleClock = 0; // seconds; drives the procedural idle aurora
// SOUND_BLOOM_BACKDROP=1 paints an opaque deep-space backdrop behind the bloom
// (instead of transparent) so a screenshot shows the real bloom on dark, with no
// desktop behind it. The live overlay stays click-through transparent by default.
const captureBackdrop = process.env.SOUND_BLOOM_BACKDROP === '1';

// Smooth multi-octave value-noise from layered sines — cheap, seamless, organic.
function smoothNoise(seed: number, t: number): number {
  return Math.sin(t * 1.0 + seed * 1.7) * 0.5 + Math.sin(t * 1.7 + seed * 2.3 + 1.3) * 0.3 + Math.sin(t * 2.9 + seed * 0.9 + 4.1) * 0.2;
}

/** Additively stamp a soft premultiplied glow into the active-region accumulators. */
function stampGlow(cx: number, cy: number, radius: number, color: Color, intensity: number): void {
  if (intensity <= 0.002 || radius < 1) return;
  const left = Math.max(0, Math.floor(cx - radius));
  const right = Math.min(activeW - 1, Math.ceil(cx + radius));
  const top = Math.max(0, Math.floor(cy - radius));
  const bottom = Math.min(activeH - 1, Math.ceil(cy + radius));
  if (left > right || top > bottom) return;
  const invR2 = 1 / (radius * radius);
  const r = color.red * intensity;
  const g = color.green * intensity;
  const b = color.blue * intensity;
  for (let y = top; y <= bottom; y += 1) {
    const dy = y - cy;
    const rowBase = y * activeW;
    for (let x = left; x <= right; x += 1) {
      const dx = x - cx;
      const d2 = (dx * dx + dy * dy) * invR2;
      if (d2 >= 1) continue;
      const falloff = (1 - d2) * (1 - d2); // smooth quadratic edge
      const idx = rowBase + x;
      accumR[idx]! += r * falloff;
      accumG[idx]! += g * falloff;
      accumB[idx]! += b * falloff;
    }
  }
}

/** Stamp a thin glowing ring (bass bloom shockwave) into the accumulators. */
function stampRing(cx: number, cy: number, radius: number, thickness: number, color: Color, intensity: number): void {
  if (intensity <= 0.002 || radius < 1) return;
  const outer = radius + thickness;
  const left = Math.max(0, Math.floor(cx - outer));
  const right = Math.min(activeW - 1, Math.ceil(cx + outer));
  const top = Math.max(0, Math.floor(cy - outer));
  const bottom = Math.min(activeH - 1, Math.ceil(cy + outer));
  const r = color.red * intensity;
  const g = color.green * intensity;
  const b = color.blue * intensity;
  const invT = 1 / thickness;
  for (let y = top; y <= bottom; y += 1) {
    const dy = y - cy;
    const rowBase = y * activeW;
    for (let x = left; x <= right; x += 1) {
      const dx = x - cx;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const edge = Math.abs(dist - radius) * invT;
      if (edge >= 1) continue;
      const falloff = (1 - edge) * (1 - edge);
      const idx = rowBase + x;
      accumR[idx]! += r * falloff;
      accumG[idx]! += g * falloff;
      accumB[idx]! += b * falloff;
    }
  }
}

// ── Per-frame: FFT → equalizer + bloom → composite → blit ─────────────────────

let lastFrameMs = performance.now();
let framesRendered = 0;
let totalRenderMs = 0;
let ulwReported = false; // log UpdateLayeredWindow return / GetLastError once

/**
 * One-shot debug encode of the live DIB to PNG via Gdiplus, BYPASSING the screen.
 * Tells us definitively whether the renderer produces a bright bloom (DIB good →
 * any invisibility is a compositing bug) or a near-black field (renderer bug).
 * Gated by SOUND_BLOOM_DUMP=1. Saves packages/all/screenshots/_bloom-dib-dump.png.
 */
function dumpDibToPng(): void {
  // GdiplusStartupInput is 24 bytes on x64 (version + pad + ptr callback + two
  // trailing BOOLs at 16/20); a 16-byte buffer leaves those BOOLs as garbage.
  const token = Buffer.alloc(8);
  const startupInput = Buffer.alloc(24);
  startupInput.writeUInt32LE(1, 0); // GdiplusVersion
  if (Gdiplus.GdiplusStartup(token.ptr!, startupInput.ptr!, null) !== Status.Ok) {
    console.warn('  [dump] GdiplusStartup failed');
    return;
  }
  const gdiplusToken = token.readBigUInt64LE(0);

  // Wrap the live DIB bits (top-down, positive stride) as a 32bpp ARGB bitmap.
  const stride = overlayWidth * 4;
  const bitmapOut = Buffer.alloc(8);
  const scanStatus = Gdiplus.GdipCreateBitmapFromScan0(overlayWidth, overlayHeight, stride, PixelFormat32bppARGB, pixelAddress, bitmapOut.ptr!);
  if (scanStatus !== Status.Ok) {
    console.warn(`  [dump] GdipCreateBitmapFromScan0 failed: ${scanStatus}`);
    Gdiplus.GdiplusShutdown(gdiplusToken);
    return;
  }
  const bitmap = bitmapOut.readBigUInt64LE(0);

  // Sample center pixels so we know whether the DIB itself is bright.
  let bright = 0;
  const colorOut = Buffer.alloc(4);
  const cx = activeLeft + Math.floor(activeW / 2);
  const cy = activeTop + Math.floor(activeH / 2);
  for (let oy = -120; oy <= 120; oy += 30) {
    for (let ox = -120; ox <= 120; ox += 30) {
      if (Gdiplus.GdipBitmapGetPixel(bitmap, cx + ox, cy + oy, colorOut.ptr!) === Status.Ok) {
        const argb = colorOut.readUInt32LE(0);
        if (argb >>> 24 > 12 && (argb & 0x00ffffff) !== 0) bright += 1;
      }
    }
  }

  // PNG encoder CLSID 557CF406-1A04-11D3-9A73-0000F81EF32E (…F406, NOT the …F402 GIF).
  const pngClsid = Buffer.alloc(16);
  pngClsid.writeUInt32LE(0x557cf406, 0);
  pngClsid.writeUInt16LE(0x1a04, 4);
  pngClsid.writeUInt16LE(0x11d3, 6);
  pngClsid.set([0x9a, 0x73, 0x00, 0x00, 0xf8, 0x1e, 0xf3, 0x2e], 8);

  const outPath = `${import.meta.dir}\\..\\screenshots\\_bloom-dib-dump.png`;
  const outBuf = Buffer.from(`${outPath}\0`, 'utf16le');
  const saveStatus = Gdiplus.GdipSaveImageToFile(bitmap, outBuf.ptr!, pngClsid.ptr!, null);
  console.log(`  [dump] DIB → ${outPath}  (save=${saveStatus === Status.Ok ? 'Ok' : saveStatus}, bright center samples=${bright}/81)`);

  Gdiplus.GdipDisposeImage(bitmap);
  Gdiplus.GdiplusShutdown(gdiplusToken);
}

function renderFrame(): void {
  const now = performance.now();
  const dt = Math.min(0.05, (now - lastFrameMs) / 1000) || 1 / 60;
  lastFrameMs = now;
  const frameStart = now;

  idleClock += dt;

  // 1) FFT over the latest window.
  for (let i = 0; i < FFT_SIZE; i += 1) {
    fftReal[i] = sampleWindow[i]! * hannWindow[i]!;
    fftImag[i] = 0;
  }
  runFftInPlace();

  // 1b) Microphone AUTO-GAIN. Measure the raw window's peak amplitude and track a
  //     slow-decaying running peak; magnitudes are scaled by 1/peak so a quiet mic
  //     fills the bloom while loud input stays bounded. The input ENVELOPE (raw
  //     loudness vs. the noise floor) crossfades idle ↔ reactive.
  let rawPeak = 0;
  let rawEnergy = 0;
  for (let i = 0; i < FFT_SIZE; i += 1) {
    const s = sampleWindow[i]!;
    const a = s < 0 ? -s : s;
    if (a > rawPeak) rawPeak = a;
    rawEnergy += s * s;
  }
  const rawRms = Math.sqrt(rawEnergy / FFT_SIZE);
  micPeak = Math.max(rawPeak, micPeak * 0.992); // fast attack, slow release
  micPeak = Math.max(micPeak, 0.0025); // floor: never divide by ~0
  const autoGain = Math.min(64, 0.5 / micPeak); // normalize quiet mics up, cap loud
  // Envelope: well above the noise floor (~0.004 RMS) → reactive; below → idle.
  const targetEnv = Math.min(1, Math.max(0, (rawRms - 0.004) * 120));
  inputEnvelope += (targetEnv - inputEnvelope) * (targetEnv > inputEnvelope ? 0.35 : 0.06);

  // 2) Bass energy (sub-160 Hz) for beat detection — gained + idle pulse floor.
  const bassBins = Math.max(4, Math.floor((160 * FFT_SIZE) / captureSampleRate));
  let bass = 0;
  for (let k = 1; k < bassBins; k += 1) bass += magnitudes[k]!;
  bass = (bass / bassBins) * autoGain;
  // A gentle procedural heartbeat keeps rings & breathing alive with no audio.
  const idlePulse = (0.5 + 0.5 * Math.sin(idleClock * 1.6)) * 0.5 * (1 - inputEnvelope);
  const bassNorm = Math.min(1, Math.max(bass * 1.1, idlePulse));
  // Onset: a sudden rise above the running level fires a bloom ring (audio only).
  if (inputEnvelope > 0.18 && bassNorm > bassPrev + 0.12 && bassNorm > 0.22 && bloomRings.length < RING_LIMIT) {
    bloomRings.push({ radius: innerRadius, strength: Math.min(1, bassNorm), hue: phase * 0.05 });
  }
  // Idle bloom rings: emit a slow, periodic shockwave so the field always breathes.
  if (inputEnvelope < 0.3 && bloomRings.length < 2 && Math.sin(idleClock * 0.9) > 0.985) {
    bloomRings.push({ radius: innerRadius, strength: 0.4, hue: idleClock * 0.04 });
  }
  bassPrev = bassPrev * 0.82 + bassNorm * 0.18;
  beatEnvelope = Math.max(beatEnvelope * 0.9, bassNorm);

  // 3) Smoothed per-petal energy with fast attack / slow release. With audio the
  //    petals track their spectral band (auto-gained); the idle aurora adds an
  //    always-present undulating floor so every petal stays luminous and alive.
  for (let p = 0; p < PETAL_COUNT; p += 1) {
    const start = petalBinStart[p]!;
    const end = petalBinEnd[p]!;
    let peak = 0;
    for (let k = start; k < end; k += 1) {
      const m = magnitudes[k]!;
      if (m > peak) peak = m;
    }
    const reactive = Math.min(1, peak * autoGain * (16 + p * 0.25)); // lift treble
    // IDLE aurora: layered sines per petal → gently breathing, rotating petals.
    const idle = 0.34 + 0.26 * smoothNoise(p * 0.37, idleClock * 0.6) + 0.12 * Math.sin(idleClock * 0.8 + p * 0.5);
    const idleClamped = Math.max(0.12, Math.min(0.85, idle));
    const target = idleClamped * (1 - inputEnvelope) + reactive * inputEnvelope * 1.15;
    const prev = petalEnergy[p]!;
    petalEnergy[p] = target > prev ? prev + (target - prev) * 0.5 : prev + (target - prev) * 0.12;
  }

  // 4) Temporal decay of the bloom field (luminous after-glow).
  const decay = 0.86;
  for (let i = 0, n = accumR.length; i < n; i += 1) {
    accumR[i]! *= decay;
    accumG[i]! *= decay;
    accumB[i]! *= decay;
  }

  // 5) Advance + draw the bass bloom rings.
  for (let i = bloomRings.length - 1; i >= 0; i -= 1) {
    const ring = bloomRings[i]!;
    ring.radius += dt * (260 + ring.strength * 520);
    ring.strength *= 0.93;
    const color = hslToRgb(ring.hue + 0.58, 0.7, 0.6);
    stampRing(centerX, centerY, ring.radius, 10 + ring.strength * 26, color, ring.strength * 0.5);
    if (ring.strength < 0.04 || ring.radius > maxRadius * 1.25) bloomRings.splice(i, 1);
  }

  // 6) Draw the radial equalizer petals as chains of soft glows.
  phase += dt * 0.18;
  const pulse = 1 + beatEnvelope * 0.22;
  for (let p = 0; p < PETAL_COUNT; p += 1) {
    const energy = petalEnergy[p]!;
    if (energy < 0.01) continue;
    const angle = (p / PETAL_COUNT) * Math.PI * 2 + phase;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const reach = (innerRadius + energy * (maxRadius - innerRadius)) * pulse;
    const color = hslToRgb(petalHue[p]! + beatEnvelope * 0.08, 0.85, 0.55 + energy * 0.12);
    // Walk outward stamping progressively smaller, fainter glows → a tapering ray.
    const steps = 5 + Math.floor(energy * 9);
    for (let s = 0; s <= steps; s += 1) {
      const t = s / steps;
      const dist = innerRadius + t * (reach - innerRadius);
      const gx = centerX + cos * dist;
      const gy = centerY + sin * dist;
      const glowRadius = (10 + energy * 26) * (1 - t * 0.6);
      const glowIntensity = energy * (1 - t * 0.55) * 0.9;
      stampGlow(gx, gy, glowRadius, color, glowIntensity);
    }
  }

  // 7) Soft luminous core. It breathes procedurally (so it is ALWAYS visible at
  //    screen center with no audio) and swells with overall loudness when present.
  const idleBreath = 0.5 + 0.5 * Math.sin(idleClock * 1.1); // 0..1, ~5.7 s period
  const coreHue = 0.58 + 0.06 * Math.sin(idleClock * 0.25) + phase * 0.01;
  const coreColor = hslToRgb(coreHue, 0.65, 0.72);
  const coreRadius = innerRadius * (1.7 + idleBreath * 0.5 + beatEnvelope * 1.2);
  const coreIntensity = 0.7 + idleBreath * 0.3 + beatEnvelope * 0.5;
  stampGlow(centerX, centerY, coreRadius, coreColor, coreIntensity);
  // A second, larger soft halo gives the core a wide luminous bloom around it.
  const haloColor = hslToRgb(coreHue + 0.04, 0.7, 0.6);
  stampGlow(centerX, centerY, innerRadius * (3.2 + idleBreath * 0.8), haloColor, 0.3 + idleBreath * 0.18 + beatEnvelope * 0.3);

  // 8) Tone-map the active-region accumulators → premultiplied ARGB, blitting
  //    each active row into the matching DIB row at the centered offset.
  for (let y = 0; y < activeH; y += 1) {
    const srcRow = y * activeW;
    const dstRow = (activeTop + y) * overlayWidth + activeLeft;
    for (let x = 0; x < activeW; x += 1) {
      const src = srcRow + x;
      const r = accumR[src]!;
      const g = accumG[src]!;
      const b = accumB[src]!;
      if (captureBackdrop) {
        // Opaque deep-space vignette + additive bloom, for clean screenshots.
        const dx = x - centerX;
        const dy = y - centerY;
        const d = Math.min(1, Math.sqrt(dx * dx + dy * dy) / (activeW * 0.55));
        const fr = Math.min(255, Math.round(Math.max(0, 17 - d * 13) + r));
        const fg = Math.min(255, Math.round(Math.max(0, 15 - d * 12) + g));
        const fb = Math.min(255, Math.round(Math.max(0, 32 - d * 19) + b));
        pixelView[dstRow + x] = ((0xff << 24) | (fr << 16) | (fg << 8) | fb) >>> 0;
        continue;
      }
      // Luminance drives alpha; channels are already premultiplied by intensity.
      const lum = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
      if (lum <= 0.0008) {
        pixelView[dstRow + x] = 0;
        continue;
      }
      const alpha = Math.min(255, Math.round((1 - Math.exp(-lum * 2.2)) * 255));
      const pr = Math.min(alpha, Math.round(r));
      const pg = Math.min(alpha, Math.round(g));
      const pb = Math.min(alpha, Math.round(b));
      pixelView[dstRow + x] = ((alpha << 24) | (pr << 16) | (pg << 8) | pb) >>> 0;
    }
  }

  const ulwOk = User32.UpdateLayeredWindow(overlayHwnd, screenDC, dstPoint.ptr!, sizeBuf.ptr!, memoryDC, srcPoint.ptr!, 0, blendFunction.ptr!, ULW_ALPHA);
  if (!ulwReported) {
    ulwReported = true;
    const lastError = Kernel32.GetLastError();
    console.log(`  UpdateLayeredWindow → ${ulwOk} (GetLastError=${lastError})${ulwOk ? '' : '  ⚠ FAILED'}`);
  }

  framesRendered += 1;
  totalRenderMs += performance.now() - frameStart;

  if (dumpEnabled && framesRendered === DUMP_AT_FRAME) dumpDibToPng();
}

function tick(): void {
  if ((User32.GetAsyncKeyState(VirtualKey.VK_ESCAPE) & 0x8000) !== 0) {
    shouldExit = true;
    if (User32.IsWindow(overlayHwnd)) User32.DestroyWindow(overlayHwnd);
    return;
  }
  pollCapture();
  renderFrame();
}

// ── Ctrl+C handler ────────────────────────────────────────────────────────────

const ctrlHandler = new JSCallback(
  (_dwCtrlType: number): number => {
    shouldExit = true;
    User32.PostMessageW(overlayHwnd, WM_CLOSE, 0n, 0n);
    return 1;
  },
  { args: ['u32'], returns: 'i32' },
);
Kernel32.SetConsoleCtrlHandler(ctrlHandler.ptr!, 1);

// ── DEMO_DURATION_MS auto-exit (screenshot harness) ───────────────────────────

const demoDurationMs = Number(process.env.DEMO_DURATION_MS ?? 0);
const demoDeadline = demoDurationMs > 0 ? Date.now() + demoDurationMs : 0;

// ── First paint, timer, message loop ──────────────────────────────────────────

tick();

const timerHandle = User32.SetTimer(overlayHwnd, TIMER_ID, FRAME_INTERVAL_MS, NULL_PTR);
if (!timerHandle) {
  console.error('SetTimer failed');
  stopCapture();
  process.exit(1);
}

const msgBuffer = Buffer.alloc(48);
let lastTickAt = 0;
while (!shouldExit) {
  const result = User32.GetMessageW(msgBuffer.ptr!, NULL, 0, 0);
  if (result <= 0) break;
  User32.TranslateMessage(msgBuffer.ptr!);
  User32.DispatchMessageW(msgBuffer.ptr!);
  if (demoDeadline !== 0 && Date.now() >= demoDeadline) {
    shouldExit = true;
    if (User32.IsWindow(overlayHwnd)) User32.DestroyWindow(overlayHwnd);
    break;
  }
  const now = Date.now();
  if (now - lastTickAt >= FRAME_INTERVAL_MS - 2) {
    lastTickAt = now;
    tick();
  }
}

// ── Teardown ──────────────────────────────────────────────────────────────────

User32.KillTimer(overlayHwnd, TIMER_ID);
Kernel32.SetConsoleCtrlHandler(NULL_PTR, 0);
GDI32.DeleteObject(dibBitmap);
GDI32.DeleteDC(memoryDC);
User32.ReleaseDC(NULL, screenDC);
if (User32.IsWindow(overlayHwnd)) User32.DestroyWindow(overlayHwnd);
User32.UnregisterClassW(className.ptr!, NULL);
stopCapture();
wndProc.close();
ctrlHandler.close();

const avgMs = framesRendered > 0 ? totalRenderMs / framesRendered : 0;
console.log('');
console.log(`  The bloom has faded.  (${framesRendered} frames · ${avgMs.toFixed(1)} ms/frame avg)`);
console.log('');

Kernel32.Sleep(50);
process.exit(0);
