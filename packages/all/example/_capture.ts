/**
 * Internal composited-desktop capture utility for the showcase. NOT a user-facing demo.
 *
 * Usage: bun ./example/_capture.ts <demo-name> [<delay-ms>] [<extra-ms>]
 *
 * Unlike _screenshot.ts (GDI BitBlt of GetDC(NULL)), this reads the TRUE
 * scanned-out desktop frame via the DXGI Desktop Duplication API. DWM composites
 * per-pixel-alpha layered (UpdateLayeredWindow) overlays and the Magnification
 * fullscreen color/transform effect at scan-out, so GDI cannot see them — but
 * Desktop Duplication captures the actual presented frame and therefore catches
 * everything (e.g. sound-bloom's click-through overlay, event-horizon's warp).
 *
 * It launches `bun run example/<demo-name>.ts` with DEMO_DURATION_MS set so the
 * demo SELF-EXITS cleanly (critical: demos like event-horizon restore global
 * desktop state in their exit handlers, so they must never be hard-killed),
 * waits delay-ms for it to render, acquires a few duplicated frames to land
 * mid-animation, encodes the last one to a 32bpp ARGB Gdiplus PNG, then waits
 * for the child to self-exit.
 *
 * Output: ./screenshots/<demo-name>.png
 */

import { spawn } from 'bun';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { CFunction, FFIType, read, type Pointer } from 'bun:ffi';

import { D3d11, Gdiplus } from '../index';
import { D3D11_SDK_VERSION, D3D_DRIVER_TYPE } from '@bun-win32/d3d11';
import { Status } from '@bun-win32/gdiplus';

// ── HRESULTs ──────────────────────────────────────────────────────────────────
const S_OK = 0;
const DXGI_ERROR_NOT_FOUND = 0x887a_0002 >>> 0;
const DXGI_ERROR_WAIT_TIMEOUT = 0x887a_0027 >>> 0;
const E_ACCESSDENIED = 0x8007_0005 >>> 0;

// ── D3D11 / DXGI constants ────────────────────────────────────────────────────
const D3D11_CREATE_DEVICE_BGRA_SUPPORT = 0x20;
const D3D_FEATURE_LEVEL_11_0 = 0xb000;
const D3D11_USAGE_STAGING = 3;
const D3D11_CPU_ACCESS_READ = 0x20000;
const D3D11_MAP_READ = 1;
// Desktop Duplication surfaces are DXGI_FORMAT_B8G8R8A8_UNORM (87); the staging
// texture mirrors whatever format GetDesc reports, so it is read dynamically.

// ── Gdiplus PixelFormat ───────────────────────────────────────────────────────
const PixelFormat32bppARGB = 0x0026200a;

// ── vtable slots (0-based; offset = slot * 8) — derived from dxgi.h / dxgi1_2.h /
//    d3d11.h declaration order in the Windows 10 SDK and verified by running. ───
const IUNKNOWN_QUERY_INTERFACE = 0; // 0x00
const IUNKNOWN_RELEASE = 2; // 0x10
const DXGIDEVICE_GET_ADAPTER = 7; // 0x38
const DXGIADAPTER_ENUM_OUTPUTS = 7; // 0x38
const DXGIOUTPUT1_DUPLICATE_OUTPUT = 22; // 0xB0  (after the 19 IDXGIOutput methods + GetDisplayModeList1/FindClosestMatchingMode1/GetDisplaySurfaceData1)
const DUPL_ACQUIRE_NEXT_FRAME = 8; // 0x40
const DUPL_RELEASE_FRAME = 14; // 0x70
const TEX2D_GET_DESC = 10; // 0x50
const DEV_CREATE_TEXTURE_2D = 5; // 0x28
const CTX_COPY_RESOURCE = 47; // 0x178
const CTX_MAP = 14; // 0x70
const CTX_UNMAP = 15; // 0x78

// ── IIDs ──────────────────────────────────────────────────────────────────────
const IID_IDXGIDEVICE = '54ec77fa-1377-44e6-8c32-88fd5f44c84c';
const IID_IDXGIOUTPUT1 = '00cddea8-939b-4b83-a340-a685226666cc';
const IID_ID3D11TEXTURE2D = '6f15aaf2-d208-4e89-9ab4-489535d34f9c';

const hex = (hr: number): string => `0x${(hr >>> 0).toString(16).padStart(8, '0')}`;

D3d11.Preload(['D3D11CreateDevice']);
Gdiplus.Preload();

// ── Memoized COM vtable invoker (the implicit `this` u64 is prepended) ─────────
const invokers = new Map<string, ReturnType<typeof CFunction>>();
function vcall(thisPtr: bigint, slot: number, argTypes: readonly FFIType[], args: readonly unknown[], returns: FFIType = FFIType.i32): number {
  const vtable = read.u64(Number(thisPtr) as Pointer, 0);
  const method = read.u64(Number(vtable) as Pointer, slot * 8);
  const key = `${method}|${returns}|${argTypes.join(',')}`;
  let invoke = invokers.get(key);
  if (invoke === undefined) {
    invoke = CFunction({ ptr: Number(method) as Pointer, args: [FFIType.u64, ...argTypes], returns });
    invokers.set(key, invoke);
  }
  return invoke(thisPtr, ...args) as number;
}

function comRelease(thisPtr: bigint): void {
  if (thisPtr !== 0n) vcall(thisPtr, IUNKNOWN_RELEASE, [], [], FFIType.u32);
}

function guidBytes(value: string): Buffer {
  const match = /^([0-9a-f]{8})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{12})$/i.exec(value);
  if (match === null) throw new Error(`Invalid GUID: ${value}`);
  const [, d1, d2, d3, d4High, d4Low] = match;
  const buffer = Buffer.alloc(16);
  buffer.writeUInt32LE(parseInt(d1!, 16), 0);
  buffer.writeUInt16LE(parseInt(d2!, 16), 4);
  buffer.writeUInt16LE(parseInt(d3!, 16), 6);
  const data4 = `${d4High}${d4Low}`;
  for (let i = 0; i < 8; i += 1) buffer[8 + i] = parseInt(data4.slice(i * 2, i * 2 + 2), 16);
  return buffer;
}

// ── CLI ───────────────────────────────────────────────────────────────────────
const demoName = process.argv[2];
const delayMs = Number.parseInt(process.argv[3] ?? '4000', 10);
const extraMs = Number.parseInt(process.argv[4] ?? '2000', 10);
if (!demoName) {
  console.error('usage: bun ./example/_capture.ts <demo-name> [delay-ms=4000] [extra-ms=2000]');
  process.exit(1);
}

const screenshotsDir = resolve(import.meta.dir, '..', 'screenshots');
mkdirSync(screenshotsDir, { recursive: true });
const outputPath = resolve(screenshotsDir, `${demoName}.png`);
const demoPath = resolve(import.meta.dir, `${demoName}.ts`);
const durationMs = delayMs + extraMs;

console.log(`[capture] launching ${demoName} (DEMO_DURATION_MS=${durationMs})…`);
const child = spawn({
  cmd: ['bun', 'run', demoPath],
  cwd: resolve(import.meta.dir, '..'),
  env: { ...process.env, DEMO_DURATION_MS: String(durationMs) },
  stdout: 'ignore',
  stderr: 'ignore',
  stdin: 'ignore',
});

console.log(`[capture] waiting ${delayMs} ms for render…`);
await Bun.sleep(delayMs);

// ── Bring up a D3D11 device (HARDWARE, WARP fallback) ─────────────────────────
interface Device {
  device: bigint;
  context: bigint;
  label: string;
}
function createDevice(driverType: D3D_DRIVER_TYPE): Device | null {
  const featureLevels = Buffer.alloc(4);
  featureLevels.writeUInt32LE(D3D_FEATURE_LEVEL_11_0, 0);
  const ppDevice = Buffer.alloc(8);
  const pFeatureLevel = Buffer.alloc(4);
  const ppContext = Buffer.alloc(8);
  const hr = D3d11.D3D11CreateDevice(
    null,
    driverType,
    0n,
    D3D11_CREATE_DEVICE_BGRA_SUPPORT,
    featureLevels.ptr!,
    1,
    D3D11_SDK_VERSION,
    ppDevice.ptr!,
    pFeatureLevel.ptr!,
    ppContext.ptr!,
  );
  if (hr !== S_OK) return null;
  return {
    device: ppDevice.readBigUInt64LE(0),
    context: ppContext.readBigUInt64LE(0),
    label: driverType === D3D_DRIVER_TYPE.D3D_DRIVER_TYPE_HARDWARE ? 'hardware' : 'WARP',
  };
}

let dev = createDevice(D3D_DRIVER_TYPE.D3D_DRIVER_TYPE_HARDWARE);
if (dev === null) dev = createDevice(D3D_DRIVER_TYPE.D3D_DRIVER_TYPE_WARP);

function bail(code: number, message: string): never {
  console.error(`[capture] ${message}`);
  // Let the child self-exit via DEMO_DURATION_MS — never hard-kill (global-state demos).
  process.exit(code);
}

if (dev === null) bail(2, 'D3D11CreateDevice failed (HARDWARE and WARP).');
const { device, context, label: driverLabel } = dev;
console.log(`[capture] D3D11 device up (${driverLabel}).`);

// ── device → IDXGIDevice → IDXGIAdapter → IDXGIOutput → IDXGIOutput1 ──────────
const ppDxgiDevice = Buffer.alloc(8);
if (vcall(device, IUNKNOWN_QUERY_INTERFACE, [FFIType.ptr, FFIType.ptr], [guidBytes(IID_IDXGIDEVICE).ptr!, ppDxgiDevice.ptr!]) !== S_OK) {
  bail(3, 'QueryInterface(IDXGIDevice) failed.');
}
const dxgiDevice = ppDxgiDevice.readBigUInt64LE(0);

const ppAdapter = Buffer.alloc(8);
if (vcall(dxgiDevice, DXGIDEVICE_GET_ADAPTER, [FFIType.ptr], [ppAdapter.ptr!]) !== S_OK) {
  bail(3, 'IDXGIDevice::GetAdapter failed.');
}
const adapter = ppAdapter.readBigUInt64LE(0);

const ppOutput = Buffer.alloc(8);
const enumHr = vcall(adapter, DXGIADAPTER_ENUM_OUTPUTS, [FFIType.u32, FFIType.ptr], [0, ppOutput.ptr!]);
if ((enumHr >>> 0) === DXGI_ERROR_NOT_FOUND) bail(3, 'No connected output on the adapter (EnumOutputs → NOT_FOUND).');
if (enumHr !== S_OK) bail(3, `IDXGIAdapter::EnumOutputs failed ${hex(enumHr)}.`);
const output = ppOutput.readBigUInt64LE(0);

const ppOutput1 = Buffer.alloc(8);
if (vcall(output, IUNKNOWN_QUERY_INTERFACE, [FFIType.ptr, FFIType.ptr], [guidBytes(IID_IDXGIOUTPUT1).ptr!, ppOutput1.ptr!]) !== S_OK) {
  bail(3, 'QueryInterface(IDXGIOutput1) failed.');
}
const output1 = ppOutput1.readBigUInt64LE(0);

// ── IDXGIOutput1::DuplicateOutput(device) ─────────────────────────────────────
const ppDupl = Buffer.alloc(8);
const dupHr = vcall(output1, DXGIOUTPUT1_DUPLICATE_OUTPUT, [FFIType.u64, FFIType.ptr], [device, ppDupl.ptr!]);
if ((dupHr >>> 0) === E_ACCESSDENIED) {
  bail(4, 'DuplicateOutput → E_ACCESSDENIED: another Desktop Duplication is already active (close other capture/recording tools and retry).');
}
if (dupHr !== S_OK) bail(4, `IDXGIOutput1::DuplicateOutput failed ${hex(dupHr)}.`);
const dupl = ppDupl.readBigUInt64LE(0);
console.log('[capture] desktop duplication acquired.');

// ── Acquire frames, copying into staging WHILE each frame is still held ────────
// CRITICAL: the duplicated texture's pixels are only valid between AcquireNextFrame
// and ReleaseFrame, so CopyResource must run before ReleaseFrame. The first frame
// after DuplicateOutput is often metadata-only (AccumulatedFrames==0, blank image),
// so we drain several frames and keep the LAST one that actually carried pixels —
// which also lands us mid-animation.
// DXGI_OUTDUPL_FRAME_INFO: AccumulatedFrames @16, LastPresentTime @0.
const frameInfo = Buffer.alloc(64);
const ppResource = Buffer.alloc(8);
const ppTex = Buffer.alloc(8);
const desc = Buffer.alloc(44); // D3D11_TEXTURE2D_DESC
const tex2dIid = guidBytes(IID_ID3D11TEXTURE2D);

let staging = 0n;
let captureW = 0;
let captureH = 0;
let captureFormat = 0;
let captured = false;

const MAX_ATTEMPTS = 40;
const TARGET_GOOD = 5; // keep advancing through this many real frames to land mid-animation
let good = 0;
for (let i = 0; i < MAX_ATTEMPTS && good < TARGET_GOOD; i += 1) {
  ppResource.writeBigUInt64LE(0n, 0);
  const hr = vcall(dupl, DUPL_ACQUIRE_NEXT_FRAME, [FFIType.u32, FFIType.ptr, FFIType.ptr], [500, frameInfo.ptr!, ppResource.ptr!]);
  if ((hr >>> 0) === DXGI_ERROR_WAIT_TIMEOUT) {
    await Bun.sleep(40);
    continue;
  }
  if (hr !== S_OK) {
    console.error(`[capture] AcquireNextFrame → ${hex(hr)}`);
    break;
  }
  const resource = ppResource.readBigUInt64LE(0);
  const accumulated = frameInfo.readUInt32LE(16);
  const lastPresent = frameInfo.readBigInt64LE(0);
  // A frame that carried no new desktop image (no present) is blank — skip its pixels.
  if (resource === 0n || (accumulated === 0 && lastPresent === 0n)) {
    if (resource !== 0n) comRelease(resource);
    vcall(dupl, DUPL_RELEASE_FRAME, [], [], FFIType.i32);
    await Bun.sleep(40);
    continue;
  }

  if (vcall(resource, IUNKNOWN_QUERY_INTERFACE, [FFIType.ptr, FFIType.ptr], [tex2dIid.ptr!, ppTex.ptr!]) !== S_OK) {
    comRelease(resource);
    vcall(dupl, DUPL_RELEASE_FRAME, [], [], FFIType.i32);
    await Bun.sleep(40);
    continue;
  }
  const tex = ppTex.readBigUInt64LE(0);
  vcall(tex, TEX2D_GET_DESC, [FFIType.ptr], [desc.ptr!], FFIType.void);
  const w = desc.readUInt32LE(0);
  const h = desc.readUInt32LE(4);
  const fmt = desc.readUInt32LE(16);

  // Lazily create the staging texture once we know the dimensions/format.
  if (staging === 0n) {
    const stagingDesc = Buffer.alloc(44);
    stagingDesc.writeUInt32LE(w, 0); // Width
    stagingDesc.writeUInt32LE(h, 4); // Height
    stagingDesc.writeUInt32LE(1, 8); // MipLevels
    stagingDesc.writeUInt32LE(1, 12); // ArraySize
    stagingDesc.writeUInt32LE(fmt, 16); // Format
    stagingDesc.writeUInt32LE(1, 20); // SampleDesc.Count
    stagingDesc.writeUInt32LE(0, 24); // SampleDesc.Quality
    stagingDesc.writeUInt32LE(D3D11_USAGE_STAGING, 28); // Usage
    stagingDesc.writeUInt32LE(0, 32); // BindFlags
    stagingDesc.writeUInt32LE(D3D11_CPU_ACCESS_READ, 36); // CPUAccessFlags
    stagingDesc.writeUInt32LE(0, 40); // MiscFlags
    const ppStaging = Buffer.alloc(8);
    if (vcall(device, DEV_CREATE_TEXTURE_2D, [FFIType.ptr, FFIType.ptr, FFIType.ptr], [stagingDesc.ptr!, null, ppStaging.ptr!]) !== S_OK) {
      comRelease(tex);
      comRelease(resource);
      vcall(dupl, DUPL_RELEASE_FRAME, [], [], FFIType.i32);
      bail(6, 'CreateTexture2D (staging) failed.');
    }
    staging = ppStaging.readBigUInt64LE(0);
  }

  // Copy WHILE the frame is held — these pixels are only valid before ReleaseFrame.
  vcall(context, CTX_COPY_RESOURCE, [FFIType.u64, FFIType.u64], [staging, tex], FFIType.void);
  captureW = w;
  captureH = h;
  captureFormat = fmt;
  captured = true;
  good += 1;

  comRelease(tex);
  comRelease(resource);
  vcall(dupl, DUPL_RELEASE_FRAME, [], [], FFIType.i32);
  await Bun.sleep(80); // let the demo advance a frame before grabbing the next
}

if (!captured) bail(5, 'Never acquired a desktop frame with pixels (all attempts were blank or timed out).');
const acquired = { width: captureW, height: captureH, format: captureFormat };
console.log(`[capture] captured frame ${acquired.width}x${acquired.height} (DXGI format ${acquired.format}).`);

// ── Map the staging texture and read BGRA pixels honoring RowPitch ────────────
const mapped = Buffer.alloc(16); // D3D11_MAPPED_SUBRESOURCE: pData ptr@0, RowPitch u32@8, DepthPitch u32@12
const mapHr = vcall(context, CTX_MAP, [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], [staging, 0, D3D11_MAP_READ, 0, mapped.ptr!]);
if (mapHr !== S_OK) bail(7, `ID3D11DeviceContext::Map failed ${hex(mapHr)}.`);

const dataPtr = mapped.readBigUInt64LE(0);
const rowPitch = mapped.readUInt32LE(8);
const width = acquired.width;
const height = acquired.height;

// Pack a tightly-strided (width*4) top-down BGRA buffer from the mapped rows.
const dstStride = width * 4;
const pixels = Buffer.alloc(dstStride * height);
for (let y = 0; y < height; y += 1) {
  for (let x = 0; x < dstStride; x += 1) {
    pixels[y * dstStride + x] = read.u8(Number(dataPtr) as Pointer, y * rowPitch + x);
  }
}
vcall(context, CTX_UNMAP, [FFIType.u64, FFIType.u32], [staging, 0], FFIType.void);

// ── Encode to PNG via Gdiplus (32bpp ARGB top-down bitmap) ────────────────────
const gdiplusTokenBuffer = Buffer.alloc(8);
// GdiplusStartupInput is 24 bytes on x64 (UINT32 version + pad, ptr callback,
// BOOL SuppressBackgroundThread, BOOL SuppressExternalCodecs). Allocate the full
// zeroed struct so the two trailing BOOLs are definitively 0 — leaving them as
// out-of-bounds garbage can read non-zero and yield InvalidParameter.
const gdiplusStartupInput = Buffer.alloc(24);
gdiplusStartupInput.writeUInt32LE(1, 0); // GdiplusVersion
const startupStatus = Gdiplus.GdiplusStartup(gdiplusTokenBuffer.ptr!, gdiplusStartupInput.ptr!, null);
if (startupStatus !== Status.Ok) {
  bail(8, `GdiplusStartup failed: ${startupStatus}`);
}
const gdiplusToken = gdiplusTokenBuffer.readBigUInt64LE(0);

const bitmapBuffer = Buffer.alloc(8);
// Positive stride → top-down. Format32bppARGB consumes the BGRA byte order natively.
const scanStatus = Gdiplus.GdipCreateBitmapFromScan0(width, height, dstStride, PixelFormat32bppARGB, pixels.ptr!, bitmapBuffer.ptr!);
if (scanStatus !== Status.Ok) {
  Gdiplus.GdiplusShutdown(gdiplusToken);
  bail(8, `GdipCreateBitmapFromScan0 failed: ${scanStatus}`);
}
const gdiplusBitmap = bitmapBuffer.readBigUInt64LE(0);

// Sample pixels to confirm the captured frame is NOT all-black.
let nonZero = 0;
const samples = 64;
const colorOut = Buffer.alloc(4);
for (let i = 0; i < samples; i += 1) {
  const sx = Math.floor((i % 8) * (width / 8)) + Math.floor(width / 16);
  const sy = Math.floor(Math.floor(i / 8) * (height / 8)) + Math.floor(height / 16);
  if (Gdiplus.GdipBitmapGetPixel(gdiplusBitmap, sx, sy, colorOut.ptr!) === Status.Ok) {
    if ((colorOut.readUInt32LE(0) & 0x00ffffff) !== 0) nonZero += 1;
  }
}

// PNG encoder CLSID: 557CF406-1A04-11D3-9A73-0000F81EF32E
// (…F402 is the GIF encoder; the PNG encoder ends in …F406.)
const pngClsid = Buffer.alloc(16);
pngClsid.writeUInt32LE(0x557cf406, 0);
pngClsid.writeUInt16LE(0x1a04, 4);
pngClsid.writeUInt16LE(0x11d3, 6);
pngClsid.set([0x9a, 0x73, 0x00, 0x00, 0xf8, 0x1e, 0xf3, 0x2e], 8);

const outputBuffer = Buffer.from(`${outputPath}\0`, 'utf16le');
const saveStatus = Gdiplus.GdipSaveImageToFile(gdiplusBitmap, outputBuffer.ptr!, pngClsid.ptr!, null);

// ── Teardown (release every COM object; let the demo self-exit) ───────────────
Gdiplus.GdipDisposeImage(gdiplusBitmap);
Gdiplus.GdiplusShutdown(gdiplusToken);
comRelease(staging);
comRelease(dupl);
comRelease(output1);
comRelease(output);
comRelease(adapter);
comRelease(dxgiDevice);
comRelease(context);
comRelease(device);

if (saveStatus !== Status.Ok) {
  console.error(`[capture] GdipSaveImageToFile failed: ${saveStatus}`);
} else {
  console.log(`[capture] saved → ${outputPath}  (${width}x${height})`);
  console.log(`[capture] non-black check: ${nonZero}/${samples} sampled pixels have non-zero color${nonZero === 0 ? '  ⚠ ALL BLACK' : ''}`);
}

// Wait for the child to self-exit cleanly via DEMO_DURATION_MS — do NOT kill it.
console.log('[capture] waiting for demo to self-exit (DEMO_DURATION_MS)…');
await child.exited;
console.log('[capture] demo exited.');

process.exit(saveStatus === Status.Ok && nonZero > 0 ? 0 : 9);
