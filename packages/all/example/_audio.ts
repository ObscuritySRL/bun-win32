/**
 * _audio.ts — a reusable, pure-TypeScript real-time audio engine over Bun FFI
 * (Windows), powering the audio-reactive GPU demos in this package. Importing the
 * module does NOT touch any hardware; you opt into a capability by calling its
 * factory, and every factory degrades gracefully to a silent no-op when the
 * corresponding device is absent (so demos still run on a headless box).
 *
 * Two capabilities:
 *
 *   1. createMicAnalyser — live MICROPHONE capture + a Hann-windowed radix-2
 *      Cooley-Tukey FFT. Capture uses WinMM (waveInOpen / a ring of WAVEHDRs
 *      prepared with waveInPrepareHeader + waveInAddBuffer / waveInStart), then
 *      the main thread POLLS the WHDR_DONE flag and re-arms each buffer. A WinMM
 *      callback is intentionally NOT used: Bun cannot run JS on the audio driver
 *      thread ("This thread lacks a Bun VM"), so we drain synchronously from poll().
 *
 *   2. createPcmOutput — low-latency 16-bit PCM OUTPUT streaming via XAudio2.
 *      Ole32.CoInitialize(null) FIRST (else CreateMasteringVoice returns
 *      CO_E_NOTINITIALIZED), then XAudio2Create → CreateMasteringVoice →
 *      CreateSourceVoice, and a ring of long-lived PCM Buffers (kept referenced so
 *      GC cannot free a block XAudio2 is still reading) submitted via
 *      SubmitSourceBuffer, with BuffersQueued read back from GetState.
 *
 * NOTE: WASAPI loopback (capturing system playback) is intentionally NOT offered
 * here. The IAudioClient handed back by IMMDevice::Activate is a cross-process RPC
 * proxy to audiodg.exe; invoking its methods through Bun's FFI trampoline segfaults
 * inside AUDIOSES.DLL / RPCRT4 — an unrecoverable crash, not a catchable HRESULT.
 * The WinMM microphone is the proven, crash-free capture path.
 *
 * ── Exported API ──────────────────────────────────────────────────────────────
 *
 *   createMicAnalyser({ fftSize?, sampleRate?, onSamples?, captureSamples?, bufferCount? }) -> MicAnalyser
 *     poll(): void          // drain WHDR_DONE buffers into the rolling window + recompute FFT
 *     magnitudes: Float32Array  // fftSize/2 bins, normalized
 *     waveform:   Float32Array  // latest time-domain window, -1..1
 *     level:  number         // RMS of the current window
 *     bass / mid / treble: number  // smoothed band energies
 *     available: boolean     // false (and poll() is a harmless no-op) if no mic
 *     close(): void
 *
 *   createPcmOutput({ sampleRate?, channels? }) -> PcmOutput
 *     start(): void
 *     submit(block: Int16Array): void  // queue one PCM block into the ring
 *     queued(): number                 // BuffersQueued from GetState
 *     setVolume(v: number): void
 *     available: boolean               // false + no-op if no endpoint
 *     close(): void
 *
 * Self-test: guarded behind AUDIO_SELFTEST=1, so importing this module never runs
 * it. `AUDIO_SELFTEST=1 bun run packages/all/example/_audio.ts`.
 */

import { CFunction, FFIType, type Pointer, read } from 'bun:ffi';

import { Ole32, Winmm, Xaudio2_9 } from '../index';
import { CallbackFlag, WAVE_MAPPER } from '@bun-win32/winmm';
import { S_OK, XAUDIO2_USE_DEFAULT_PROCESSOR } from '@bun-win32/xaudio2_9';

const NULL = 0n;
const NULL_PTR = null as unknown as Pointer;

// ── COM vtable invoker (proven pattern from oscilloscope-music.ts) ────────────
// The implicit `this` u64 is PREPENDED by the helper, so the argTypes passed in
// EXCLUDE `this`. Each (method, signature) pair memoizes its bound CFunction.

const invokers = new Map<string, ReturnType<typeof CFunction>>();

/** Invokes COM vtable slot `slot` on interface pointer `thisPtr`; `this` is prepended. */
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

// ── Shared audio format constants ─────────────────────────────────────────────

const WAVE_FORMAT_PCM = 0x0001;

// ──────────────────────────────────────────────────────────────────────────────
// FFT — in-place Hann-windowed radix-2 Cooley-Tukey, parameterized by size.
// ──────────────────────────────────────────────────────────────────────────────

interface FftEngine {
  /** Window applied before the transform; index i in [0, size). */
  readonly window: Float32Array;
  /** Transform `real` (length size) in place, writing `magnitudes` (size/2). */
  transform(real: Float32Array, magnitudes: Float32Array): void;
}

/** Build an FFT engine for a power-of-two `size`; precomputes window + twiddles. */
function createFft(size: number): FftEngine {
  const log2 = Math.round(Math.log2(size));
  if (1 << log2 !== size) throw new Error(`FFT size must be a power of two, got ${size}`);

  const window = new Float32Array(size);
  for (let i = 0; i < size; i += 1) {
    window[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (size - 1)));
  }

  const bitReversal = new Uint32Array(size);
  for (let i = 0; i < size; i += 1) {
    let reversed = 0;
    let value = i;
    for (let bit = 0; bit < log2; bit += 1) {
      reversed = (reversed << 1) | (value & 1);
      value >>>= 1;
    }
    bitReversal[i] = reversed >>> 0;
  }

  const twiddleCos: Float32Array[] = [];
  const twiddleSin: Float32Array[] = [];
  for (let stage = 0; stage < log2; stage += 1) {
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

  const realScratch = new Float32Array(size);
  const imagScratch = new Float32Array(size);
  const bins = size / 2;

  const transform = (real: Float32Array, magnitudes: Float32Array): void => {
    // Copy the windowed time-domain signal into the scratch buffers (imag = 0).
    for (let i = 0; i < size; i += 1) {
      realScratch[i] = real[i]! * window[i]!;
      imagScratch[i] = 0;
    }
    // Bit-reversal permutation.
    for (let i = 0; i < size; i += 1) {
      const j = bitReversal[i]!;
      if (j > i) {
        const tmpRe = realScratch[i]!;
        realScratch[i] = realScratch[j]!;
        realScratch[j] = tmpRe;
        const tmpIm = imagScratch[i]!;
        imagScratch[i] = imagScratch[j]!;
        imagScratch[j] = tmpIm;
      }
    }
    // Butterfly stages.
    for (let stage = 0; stage < log2; stage += 1) {
      const half = 1 << stage;
      const blockSize = half << 1;
      const cosTable = twiddleCos[stage]!;
      const sinTable = twiddleSin[stage]!;
      for (let start = 0; start < size; start += blockSize) {
        for (let k = 0; k < half; k += 1) {
          const evenIndex = start + k;
          const oddIndex = evenIndex + half;
          const evenRe = realScratch[evenIndex]!;
          const evenIm = imagScratch[evenIndex]!;
          const oddRe = realScratch[oddIndex]!;
          const oddIm = imagScratch[oddIndex]!;
          const wCos = cosTable[k]!;
          const wSin = sinTable[k]!;
          const tRe = wCos * oddRe - wSin * oddIm;
          const tIm = wCos * oddIm + wSin * oddRe;
          realScratch[evenIndex] = evenRe + tRe;
          imagScratch[evenIndex] = evenIm + tIm;
          realScratch[oddIndex] = evenRe - tRe;
          imagScratch[oddIndex] = evenIm - tIm;
        }
      }
    }
    // Magnitudes (one-sided), normalized by N/2.
    const norm = 1 / (size * 0.5);
    for (let k = 0; k < bins; k += 1) {
      const re = realScratch[k]!;
      const im = imagScratch[k]!;
      magnitudes[k] = Math.sqrt(re * re + im * im) * norm;
    }
  };

  return { window, transform };
}

// ──────────────────────────────────────────────────────────────────────────────
// Microphone analyser (WinMM capture → FFT + band energies).
// ──────────────────────────────────────────────────────────────────────────────

export interface MicAnalyserOptions {
  /** FFT size (power of two). Default 2048. */
  fftSize?: number;
  /** Capture sample rate in Hz. Default 44100. */
  sampleRate?: number;
  /**
   * Optional raw-sample tap. Invoked inside poll() the moment a WinMM buffer's
   * mono 16-bit PCM has been decoded to floats, delivering the contiguous samples
   * BEFORE the lossy rolling-window collapse (which only keeps the last fftSize).
   * `frame` is a shared scratch view — copy what you need before returning. Use
   * this for gap-free streaming DSP (e.g. an overlap-add phase vocoder); the
   * FFT/band readouts are unaffected.
   */
  onSamples?: (frame: Float32Array, count: number) => void;
  /**
   * WinMM capture buffer size in mono samples. Smaller = lower latency and more
   * frequent onSamples callbacks. Default = fftSize (the legacy behaviour).
   */
  captureSamples?: number;
  /**
   * Number of WinMM capture buffers in the ring. More buffers let poll() drain
   * gap-free between calls. Default 4.
   */
  bufferCount?: number;
}

export interface MicAnalyser {
  /** Drain any completed WinMM buffers into the rolling window and recompute the FFT. No-op if no mic. */
  poll(): void;
  /** fftSize/2 normalized magnitude bins, recomputed by poll(). */
  readonly magnitudes: Float32Array;
  /** Latest fftSize time-domain samples in [-1, 1]. */
  readonly waveform: Float32Array;
  /** RMS level of the current window (0..~1). */
  readonly level: number;
  /** Smoothed low-band energy. */
  readonly bass: number;
  /** Smoothed mid-band energy. */
  readonly mid: number;
  /** Smoothed high-band energy. */
  readonly treble: number;
  /** True if a microphone was opened; if false, poll() is a harmless no-op. */
  readonly available: boolean;
  /** Stop + release the device and its buffers. Idempotent. */
  close(): void;
}

const MIC_BUFFER_COUNT = 4;
const WAVEHDR_BYTES = 48;
const WHDR_DONE = 0x0000_0001;
const MIC_BITS = 16;
const MIC_BLOCK_ALIGN = MIC_BITS / 8; // mono 16-bit
const BAND_SMOOTHING = 0.8; // EMA factor for band energies

/**
 * Open the default microphone via WinMM and expose a live FFT + band energies.
 * If no capture device is present (waveInOpen fails), returns an analyser whose
 * `available` is false and whose poll() does nothing, so callers need no guards.
 */
export function createMicAnalyser(options: MicAnalyserOptions = {}): MicAnalyser {
  const fftSize = options.fftSize ?? 2048;
  const sampleRate = options.sampleRate ?? 44_100;
  const bins = fftSize / 2;
  const onSamples = options.onSamples;
  // Per-buffer capture size (samples). Smaller hop → lower latency, more callbacks.
  const captureSamples = Math.max(1, options.captureSamples ?? fftSize);
  const micBufferCount = Math.max(2, options.bufferCount ?? MIC_BUFFER_COUNT);

  const fft = createFft(fftSize);
  const magnitudes = new Float32Array(bins);
  const waveform = new Float32Array(fftSize);
  // Decode scratch must hold a whole capture buffer.
  const decoded = new Float32Array(Math.max(fftSize, captureSamples));

  // Mutable readouts (exposed via getters on the returned object).
  let level = 0;
  let bass = 0;
  let mid = 0;
  let treble = 0;

  // Band bin ranges. Map Hz → bin: bin = f * fftSize / sampleRate.
  const hzToBin = (hz: number): number => Math.max(1, Math.min(bins - 1, Math.round((hz * fftSize) / sampleRate)));
  const bassLo = hzToBin(20);
  const bassHi = hzToBin(250);
  const midHi = hzToBin(2_000);
  const trebleHi = bins - 1;

  // Try to open the device.
  const handleOut = Buffer.alloc(8);
  const wfx = Buffer.alloc(18);
  wfx.writeUInt16LE(WAVE_FORMAT_PCM, 0);
  wfx.writeUInt16LE(1, 2); // mono
  wfx.writeUInt32LE(sampleRate, 4);
  wfx.writeUInt32LE(sampleRate * MIC_BLOCK_ALIGN, 8); // nAvgBytesPerSec
  wfx.writeUInt16LE(MIC_BLOCK_ALIGN, 12);
  wfx.writeUInt16LE(MIC_BITS, 14);
  wfx.writeUInt16LE(0, 16);

  const openStatus = Winmm.waveInOpen(handleOut.ptr!, WAVE_MAPPER, wfx.ptr!, NULL, NULL, CallbackFlag.CALLBACK_NULL);
  if (openStatus !== 0) {
    // No microphone (or device busy). Degrade to a silent, crash-free no-op.
    return {
      poll: () => undefined,
      magnitudes,
      waveform,
      get level() { return 0; },
      get bass() { return 0; },
      get mid() { return 0; },
      get treble() { return 0; },
      available: false,
      close: () => undefined,
    };
  }

  const handle = handleOut.readBigUInt64LE(0);

  // Ring of long-lived PCM buffers + their WAVEHDRs. Kept referenced for the whole
  // session so GC cannot free a buffer the capture driver is still writing.
  const pcmBuffers: Buffer[] = [];
  const headerBuffers: Buffer[] = [];
  for (let i = 0; i < micBufferCount; i += 1) {
    pcmBuffers.push(Buffer.alloc(captureSamples * MIC_BLOCK_ALIGN));
    headerBuffers.push(Buffer.alloc(WAVEHDR_BYTES));
  }

  let preparedCount = 0;
  let started = false;
  let closed = false;

  // WAVEHDR layout (x64): lpData@0 (ptr), dwBufferLength@8, dwBytesRecorded@12,
  // dwUser@16, dwFlags@24, dwLoops@28, lpNext@32, reserved@40.
  const initHeader = (index: number): void => {
    const header = headerBuffers[index]!;
    const samples = pcmBuffers[index]!;
    header.writeBigUInt64LE(BigInt(samples.ptr!), 0);
    header.writeUInt32LE(samples.byteLength, 8);
    header.writeUInt32LE(0, 12);
    header.writeBigUInt64LE(0n, 16);
    header.writeUInt32LE(0, 24);
    header.writeUInt32LE(0, 28);
    header.writeBigUInt64LE(0n, 32);
    header.writeBigUInt64LE(0n, 40);
  };

  for (let i = 0; i < micBufferCount; i += 1) {
    initHeader(i);
    const header = headerBuffers[i]!;
    if (Winmm.waveInPrepareHeader(handle, header.ptr!, header.byteLength) !== 0) break;
    preparedCount += 1;
    if (Winmm.waveInAddBuffer(handle, header.ptr!, header.byteLength) !== 0) break;
  }
  started = preparedCount === micBufferCount && Winmm.waveInStart(handle) === 0;

  /** Shift `count` mono samples from `src` into the rolling window (tail-append). */
  const pushSamples = (src: Float32Array, count: number): void => {
    if (count <= 0) return;
    if (count >= fftSize) {
      waveform.set(src.subarray(count - fftSize, count));
    } else {
      waveform.copyWithin(0, count, fftSize);
      waveform.set(src.subarray(0, count), fftSize - count);
    }
  };

  const recompute = (): void => {
    fft.transform(waveform, magnitudes);

    // RMS over the window.
    let sumSquares = 0;
    for (let i = 0; i < fftSize; i += 1) sumSquares += waveform[i]! * waveform[i]!;
    level = Math.sqrt(sumSquares / fftSize);

    // Band energies = mean magnitude across each bin range.
    const meanRange = (lo: number, hi: number): number => {
      let sum = 0;
      const span = Math.max(1, hi - lo);
      for (let k = lo; k < hi; k += 1) sum += magnitudes[k]!;
      return sum / span;
    };
    const bassNow = meanRange(bassLo, bassHi);
    const midNow = meanRange(bassHi, midHi);
    const trebleNow = meanRange(midHi, trebleHi);
    bass = bass * BAND_SMOOTHING + bassNow * (1 - BAND_SMOOTHING);
    mid = mid * BAND_SMOOTHING + midNow * (1 - BAND_SMOOTHING);
    treble = treble * BAND_SMOOTHING + trebleNow * (1 - BAND_SMOOTHING);
  };

  const poll = (): void => {
    if (closed || !started) return;
    let drained = false;
    for (let i = 0; i < micBufferCount; i += 1) {
      const header = headerBuffers[i]!;
      const flags = header.readUInt32LE(24);
      if ((flags & WHDR_DONE) === 0) continue;
      const bytesRecorded = header.readUInt32LE(12);
      const sampleCount = Math.min(captureSamples, Math.floor(bytesRecorded / MIC_BLOCK_ALIGN));
      const pcm = pcmBuffers[i]!;
      for (let s = 0; s < sampleCount; s += 1) decoded[s] = pcm.readInt16LE(s * 2) / 32_768;
      if (sampleCount > 0) {
        // Raw contiguous-sample tap BEFORE the lossy rolling-window collapse, so a
        // downstream overlap-add DSP stage sees every sample gap-free.
        if (onSamples !== undefined) onSamples(decoded, sampleCount);
        pushSamples(decoded, sampleCount);
        drained = true;
      }
      // Re-arm: clear WHDR_DONE + dwBytesRecorded, preserve WHDR_PREPARED, re-queue.
      header.writeUInt32LE(0, 12);
      header.writeUInt32LE(flags & ~WHDR_DONE, 24);
      Winmm.waveInAddBuffer(handle, header.ptr!, header.byteLength);
    }
    if (drained) recompute();
  };

  const close = (): void => {
    if (closed) return;
    closed = true;
    if (started) {
      Winmm.waveInStop(handle);
      Winmm.waveInReset(handle);
    }
    for (let i = 0; i < preparedCount; i += 1) {
      const header = headerBuffers[i]!;
      Winmm.waveInUnprepareHeader(handle, header.ptr!, header.byteLength);
    }
    Winmm.waveInClose(handle);
  };

  return {
    poll,
    magnitudes,
    waveform,
    get level() { return level; },
    get bass() { return bass; },
    get mid() { return mid; },
    get treble() { return treble; },
    available: started,
    close,
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// PCM output (XAudio2 source-voice streaming).
// ──────────────────────────────────────────────────────────────────────────────

export interface PcmOutputOptions {
  /** Output sample rate in Hz. Default 48000. */
  sampleRate?: number;
  /** Channel count (1 = mono, 2 = stereo interleaved). Default 1. */
  channels?: number;
}

export interface PcmOutput {
  /** Start the source voice playing. No-op if unavailable. */
  start(): void;
  /** Queue one block of interleaved 16-bit PCM into the ring. No-op if unavailable or the ring is full. */
  submit(block: Int16Array): void;
  /** BuffersQueued reported by IXAudio2SourceVoice::GetState (0 if unavailable). */
  queued(): number;
  /** Set the source-voice volume (0 = silent, 1 = unity). No-op if unavailable. */
  setVolume(v: number): void;
  /** True if an XAudio2 engine + endpoint were created; if false, all methods are no-ops. */
  readonly available: boolean;
  /** Destroy the voices + release the engine. Idempotent. */
  close(): void;
}

// XAudio2 vtable slots (xaudio2.h declaration order; confirmed by the shipped demos).
const IUNKNOWN_RELEASE = 2;
const IXAUDIO2_CREATESOURCEVOICE = 5;
const IXAUDIO2_CREATEMASTERINGVOICE = 7;
const IXAUDIO2VOICE_SETVOLUME = 12;
const IXAUDIO2VOICE_DESTROYVOICE = 18;
const IXAUDIO2SOURCEVOICE_START = 19;
const IXAUDIO2SOURCEVOICE_SUBMITSOURCEBUFFER = 21;
const IXAUDIO2SOURCEVOICE_GETSTATE = 25;

const XAUDIO2_DEFAULT_FREQ_RATIO = 2.0;
const AUDIO_CATEGORY_GAME_EFFECTS = 6;
const PCM_RING_COUNT = 8; // long-lived buffers kept queued so the stream never starves

const NOOP_OUTPUT: PcmOutput = {
  start: () => undefined,
  submit: () => undefined,
  queued: () => 0,
  setVolume: () => undefined,
  available: false,
  close: () => undefined,
};

/**
 * Boot an XAudio2 engine + mastering voice + 16-bit PCM source voice for
 * low-latency streaming. CoInitialize is called first (XAudio2's mastering voice
 * is COM-backed). If there is no audio endpoint, returns a no-op output whose
 * `available` is false so demos run silently without guards.
 */
export function createPcmOutput(options: PcmOutputOptions = {}): PcmOutput {
  const sampleRate = options.sampleRate ?? 48_000;
  const channels = options.channels ?? 1;
  const bits = 16;
  const blockAlign = (channels * bits) / 8;

  // STA init — required before CreateMasteringVoice (else CO_E_NOTINITIALIZED).
  Ole32.CoInitialize(NULL_PTR);

  const ppEngine = Buffer.alloc(8);
  const createHr = Xaudio2_9.XAudio2Create(ppEngine.ptr!, 0, XAUDIO2_USE_DEFAULT_PROCESSOR);
  if (createHr !== S_OK) {
    return NOOP_OUTPUT;
  }
  const engine = ppEngine.readBigUInt64LE(0);

  const ppMaster = Buffer.alloc(8);
  const masterHr = vcall(
    engine,
    IXAUDIO2_CREATEMASTERINGVOICE,
    [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.i32],
    [ppMaster.ptr!, 0, 0, 0, null, null, AUDIO_CATEGORY_GAME_EFFECTS],
  );
  if (masterHr !== S_OK) {
    // No endpoint — release the engine and degrade silently.
    vcall(engine, IUNKNOWN_RELEASE, [], [], FFIType.u32);
    return NOOP_OUTPUT;
  }
  const master = ppMaster.readBigUInt64LE(0);

  // WAVEFORMATEX (18 bytes; cbSize = 0 for PCM). Kept alive for the voice's life.
  const wfx = Buffer.alloc(18);
  wfx.writeUInt16LE(WAVE_FORMAT_PCM, 0);
  wfx.writeUInt16LE(channels, 2);
  wfx.writeUInt32LE(sampleRate, 4);
  wfx.writeUInt32LE(sampleRate * blockAlign, 8); // nAvgBytesPerSec
  wfx.writeUInt16LE(blockAlign, 12);
  wfx.writeUInt16LE(bits, 14);
  wfx.writeUInt16LE(0, 16);

  const ppSource = Buffer.alloc(8);
  const srcHr = vcall(
    engine,
    IXAUDIO2_CREATESOURCEVOICE,
    [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.f32, FFIType.ptr, FFIType.ptr, FFIType.ptr],
    [ppSource.ptr!, wfx.ptr!, 0, XAUDIO2_DEFAULT_FREQ_RATIO, null, null, null],
  );
  if (srcHr !== S_OK) {
    vcall(master, IXAUDIO2VOICE_DESTROYVOICE, [], [], FFIType.void);
    vcall(engine, IUNKNOWN_RELEASE, [], [], FFIType.u32);
    return NOOP_OUTPUT;
  }
  const source = ppSource.readBigUInt64LE(0);

  // Ring of long-lived PCM byte buffers + their XAUDIO2_BUFFER descriptors. Both
  // are kept referenced for the whole run so GC cannot free a buffer the mixer is
  // still reading. submit() copies the caller's Int16Array into the next slot.
  const ringPcm: Buffer[] = [];
  const ringDesc: Buffer[] = [];
  for (let i = 0; i < PCM_RING_COUNT; i += 1) {
    ringPcm.push(Buffer.alloc(0));
    ringDesc.push(Buffer.alloc(48)); // XAUDIO2_BUFFER
  }
  let ringCursor = 0;
  let started = false;
  let closed = false;

  const voiceState = Buffer.alloc(24); // XAUDIO2_VOICE_STATE: ctx@0, BuffersQueued u32@8, SamplesPlayed@16

  const queued = (): number => {
    if (closed) return 0;
    vcall(source, IXAUDIO2SOURCEVOICE_GETSTATE, [FFIType.ptr, FFIType.u32], [voiceState.ptr!, 0], FFIType.void);
    return voiceState.readUInt32LE(8);
  };

  const start = (): void => {
    if (closed || started) return;
    vcall(source, IXAUDIO2SOURCEVOICE_START, [FFIType.u32, FFIType.u32], [0, 0]);
    started = true;
  };

  const submit = (block: Int16Array): void => {
    if (closed) return;
    if (block.length === 0) return;
    // Never queue past the ring; XAudio2 keeps reading the oldest until it drains.
    if (queued() >= PCM_RING_COUNT) return;

    const slot = ringCursor;
    const byteLength = block.length * 2;
    // Reuse the slot's Buffer when it already fits; the previous occupant of this
    // slot is guaranteed drained because we never exceed PCM_RING_COUNT queued.
    let pcm = ringPcm[slot]!;
    if (pcm.length < byteLength) {
      pcm = Buffer.alloc(byteLength);
      ringPcm[slot] = pcm;
    }
    // Copy the int16 samples into the long-lived byte buffer (little-endian host).
    new Int16Array(pcm.buffer, pcm.byteOffset, block.length).set(block);

    const desc = ringDesc[slot]!;
    desc.writeUInt32LE(0, 0); // Flags — NOT end-of-stream
    desc.writeUInt32LE(byteLength, 4); // AudioBytes
    desc.writeBigUInt64LE(BigInt(pcm.ptr!), 8); // pAudioData (kept alive in ringPcm)
    desc.writeUInt32LE(0, 36); // LoopCount
    const hr = vcall(source, IXAUDIO2SOURCEVOICE_SUBMITSOURCEBUFFER, [FFIType.ptr, FFIType.ptr], [desc.ptr!, null]);
    if (hr === S_OK) ringCursor = (ringCursor + 1) % PCM_RING_COUNT;
  };

  const setVolume = (v: number): void => {
    if (closed) return;
    vcall(source, IXAUDIO2VOICE_SETVOLUME, [FFIType.f32, FFIType.u32], [v, 0], FFIType.i32);
  };

  const close = (): void => {
    if (closed) return;
    closed = true;
    vcall(source, IXAUDIO2VOICE_DESTROYVOICE, [], [], FFIType.void);
    vcall(master, IXAUDIO2VOICE_DESTROYVOICE, [], [], FFIType.void);
    vcall(engine, IUNKNOWN_RELEASE, [], [], FFIType.u32);
  };

  return {
    start,
    submit,
    queued,
    setVolume,
    available: true,
    close,
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Self-test — only runs under AUDIO_SELFTEST=1, so importing the module is inert.
// ──────────────────────────────────────────────────────────────────────────────

async function selfTest(): Promise<void> {
  const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

  console.log('── _audio.ts self-test ──────────────────────────────────────────');

  // (a) Microphone analyser: poll for ~1.5 s, print level/bands a few times.
  console.log('\n[mic] creating analyser (fftSize=2048)…');
  const mic = createMicAnalyser({ fftSize: 2048 });
  console.log(`[mic] available = ${mic.available} (false is fine on a box with no mic)`);
  console.log(`[mic] magnitudes length = ${mic.magnitudes.length}, waveform length = ${mic.waveform.length}`);

  const micStart = performance.now();
  let micPrints = 0;
  while (performance.now() - micStart < 1_500) {
    mic.poll();
    if (micPrints < 6 && (performance.now() - micStart) > micPrints * 250) {
      console.log(
        `[mic] t=${((performance.now() - micStart) / 1000).toFixed(2)}s  ` +
        `level=${mic.level.toFixed(5)}  bass=${mic.bass.toFixed(5)}  mid=${mic.mid.toFixed(5)}  treble=${mic.treble.toFixed(5)}`,
      );
      micPrints += 1;
    }
    await sleep(40);
  }
  let nonZeroBins = 0;
  for (let i = 0; i < mic.magnitudes.length; i += 1) if (mic.magnitudes[i]! !== 0) nonZeroBins += 1;
  console.log(`[mic] magnitudes populated: ${nonZeroBins}/${mic.magnitudes.length} non-zero bins`);
  mic.close();
  console.log('[mic] closed cleanly.');

  // (b) PCM output: stream ~1 s of a 220 Hz sine, keeping the ring fed.
  console.log('\n[out] creating PCM output (48 kHz mono)…');
  const sampleRate = 48_000;
  const out = createPcmOutput({ sampleRate, channels: 1 });
  console.log(`[out] available = ${out.available} (false is fine on a headless endpoint)`);

  if (out.available) {
    out.setVolume(0.4);
    out.start();

    const blockFrames = 2_400; // 50 ms blocks
    const totalFrames = sampleRate; // ~1 second
    let phase = 0;
    const phaseStep = (2 * Math.PI * 220) / sampleRate;

    const synth = (): Int16Array => {
      const block = new Int16Array(blockFrames);
      for (let i = 0; i < blockFrames; i += 1) {
        block[i] = Math.round(Math.sin(phase) * 12_000);
        phase += phaseStep;
        if (phase > 2 * Math.PI) phase -= 2 * Math.PI;
      }
      return block;
    };

    // Prime the ring, then keep it topped up while the ~1 s of audio plays out.
    let framesSubmitted = 0;
    let minQueued = Number.POSITIVE_INFINITY;
    let starved = false;
    const reports: number[] = [];

    while (framesSubmitted < totalFrames || out.queued() > 0) {
      const q = out.queued();
      minQueued = Math.min(minQueued, q);
      // Only count starvation while we still owe audio (queue draining to 0 at the
      // very end is the normal tail, not starvation).
      if (q === 0 && framesSubmitted < totalFrames && framesSubmitted > 0) starved = true;
      while (framesSubmitted < totalFrames && out.queued() < 4) {
        out.submit(synth());
        framesSubmitted += blockFrames;
      }
      if (reports.length < 6) reports.push(q);
      await sleep(20);
    }

    console.log(`[out] queued() samples over the run: ${reports.join(', ')}  (min while owing audio: ${minQueued === Number.POSITIVE_INFINITY ? 'n/a' : minQueued})`);
    console.log(`[out] starvation while audio owed: ${starved ? 'YES (FAIL)' : 'no'}`);
    out.setVolume(0);
    out.close();
    console.log('[out] closed cleanly.');
  } else {
    // Exercise the no-op surface to prove it never crashes on a headless endpoint.
    out.start();
    out.submit(new Int16Array(480));
    out.setVolume(0.5);
    console.log(`[out] no endpoint — queued()=${out.queued()} (no-op surface exercised, no crash).`);
    out.close();
  }

  console.log('\n── self-test complete: no segfault, no unhandled error ───────────');
}

if (process.env.AUDIO_SELFTEST === '1') {
  selfTest().then(
    () => process.exit(0),
    (err: unknown) => {
      console.error('self-test failed:', err);
      process.exit(1);
    },
  );
}
