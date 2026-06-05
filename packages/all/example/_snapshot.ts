/**
 * _snapshot.ts — in-process Direct3D11 BACK-BUFFER capture + pixel analysis for the
 * showcase's self-verification. NOT a user-facing demo.
 *
 * Every GPU demo here presents to a DXGI swap chain. To prove a demo actually
 * renders something (and not a black/collapsed frame) WITHOUT fighting over the
 * single global DXGI Desktop Duplication (which _capture.ts uses and which only
 * one process may hold at a time), this reads the demo's OWN swap-chain back
 * buffer directly: IDXGISwapChain::GetBuffer(0) → ID3D11Texture2D, CopyResource
 * into a STAGING texture, Map READ, repack BGRA honoring RowPitch, encode a 32bpp
 * ARGB PNG via Gdiplus, and compute screen-space pixel statistics (non-black
 * fraction, mean luma, and a coarse luminance grid) so a verifying agent can both
 * SEE the PNG and reason about its 2D structure.
 *
 * CRITICAL: call this AFTER drawing the final frame to the back buffer but BEFORE
 * present() — with DXGI_SWAP_EFFECT_DISCARD the back-buffer contents are undefined
 * after Present. The swap chain is created B8G8R8A8_UNORM (see _gpu.ts
 * buildSwapChainDesc), so the staging texture mirrors that format.
 *
 * Exported API:
 *   captureBackBuffer(gpu, outPath, opts?) → SnapshotStats
 *     gpu       — a windowed Gpu from createDevice() (swapChain must be non-zero)
 *     outPath   — absolute .png path (directory is created)
 *     opts.gridW/gridH — coarse luminance grid dims for the textual preview (default 32×18)
 *   formatGrid(stats) → string   — a printable ASCII luminance preview of the frame
 *
 * Self-test: `bun run packages/all/example/_snapshot.ts` renders an animated
 * gradient to a real swap chain, captures it, writes ./screenshots/_snapshot-selftest.png,
 * and asserts the frame is non-black with visible horizontal/vertical variation.
 * Importing the module never runs the test.
 */

import { FFIType, read, toArrayBuffer, type Pointer } from 'bun:ffi';

import { Gdiplus } from '../index';
import { Status } from '@bun-win32/gdiplus';
import { CTX_COPY_RESOURCE, CTX_MAP, CTX_UNMAP, DEV_CREATE_TEXTURE_2D, DXGI_FORMAT_B8G8R8A8_UNORM, SWAP_GET_BUFFER, comRelease, vcall, type Gpu } from './_gpu';

const IID_ID3D11TEXTURE2D = '6f15aaf2-d208-4e89-9ab4-489535d34f9c';
const D3D11_USAGE_STAGING = 3;
const D3D11_CPU_ACCESS_READ = 0x20000;
const D3D11_MAP_READ = 1;
const PixelFormat32bppARGB = 0x0026200a;
const IUNKNOWN_QUERY_INTERFACE = 0;

let gdiplusReady = false;

function guidBytes(value: string): Buffer {
  const m = /^([0-9a-f]{8})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{12})$/i.exec(value);
  if (m === null) throw new Error(`Invalid GUID: ${value}`);
  const [, d1, d2, d3, d4High, d4Low] = m;
  const b = Buffer.alloc(16);
  b.writeUInt32LE(parseInt(d1!, 16), 0);
  b.writeUInt16LE(parseInt(d2!, 16), 4);
  b.writeUInt16LE(parseInt(d3!, 16), 6);
  const data4 = `${d4High}${d4Low}`;
  for (let i = 0; i < 8; i += 1) b[8 + i] = parseInt(data4.slice(i * 2, i * 2 + 2), 16);
  return b;
}

/** Screen-space statistics for a captured back-buffer frame. */
export interface SnapshotStats {
  /** PNG written successfully. */
  ok: boolean;
  width: number;
  height: number;
  /** Fraction of sampled pixels whose RGB is not (near) black, 0..1. */
  nonBlackFrac: number;
  /** Mean luma over sampled pixels, 0..1. */
  meanLuma: number;
  /** Coarse per-cell average luma (gridH rows × gridW cols), 0..1, row-major. */
  grid: number[];
  gridW: number;
  gridH: number;
  /** Where the PNG was written (or the attempted path). */
  path: string;
  /** Non-fatal note (e.g. why ok is false). */
  note: string;
}

export interface CaptureOptions {
  gridW?: number;
  gridH?: number;
}

/**
 * Capture the current swap-chain back buffer to a PNG and return pixel statistics.
 * Must be called after the final draw and before present(). Never throws — on any
 * failure it returns ok:false with a note, so verification code stays simple.
 */
export function captureBackBuffer(gpu: Gpu, outPath: string, opts: CaptureOptions = {}): SnapshotStats {
  const gridW = Math.max(1, opts.gridW ?? 32);
  const gridH = Math.max(1, opts.gridH ?? 18);
  const fail = (note: string, w = 0, h = 0): SnapshotStats => ({
    ok: false,
    width: w,
    height: h,
    nonBlackFrac: 0,
    meanLuma: 0,
    grid: [],
    gridW,
    gridH,
    path: outPath,
    note,
  });

  if (gpu.swapChain === 0n) return fail('no swap chain (compute-only device)');

  // ── back buffer → ID3D11Texture2D ───────────────────────────────────────────
  const tex2dIid = guidBytes(IID_ID3D11TEXTURE2D);
  const ppBackBuffer = Buffer.alloc(8);
  if (vcall(gpu.swapChain, SWAP_GET_BUFFER, [FFIType.u32, FFIType.ptr, FFIType.ptr], [0, tex2dIid.ptr!, ppBackBuffer.ptr!]) !== 0) {
    return fail('IDXGISwapChain::GetBuffer(0) failed');
  }
  const backBuffer = ppBackBuffer.readBigUInt64LE(0);

  // Read the back-buffer dimensions from its texture desc (slot 10 = GetDesc).
  const desc = Buffer.alloc(44);
  vcall(backBuffer, 10 /* ID3D11Texture2D::GetDesc */, [FFIType.ptr], [desc.ptr!], FFIType.void);
  const width = desc.readUInt32LE(0);
  const height = desc.readUInt32LE(4);
  if (width === 0 || height === 0) {
    comRelease(backBuffer);
    return fail('back buffer reported 0 dimensions');
  }

  // ── staging copy (B8G8R8A8_UNORM, CPU-readable) ─────────────────────────────
  const sdesc = Buffer.alloc(44);
  sdesc.writeUInt32LE(width, 0);
  sdesc.writeUInt32LE(height, 4);
  sdesc.writeUInt32LE(1, 8); // MipLevels
  sdesc.writeUInt32LE(1, 12); // ArraySize
  sdesc.writeUInt32LE(DXGI_FORMAT_B8G8R8A8_UNORM, 16);
  sdesc.writeUInt32LE(1, 20); // SampleDesc.Count
  sdesc.writeUInt32LE(0, 24);
  sdesc.writeUInt32LE(D3D11_USAGE_STAGING, 28);
  sdesc.writeUInt32LE(0, 32); // BindFlags
  sdesc.writeUInt32LE(D3D11_CPU_ACCESS_READ, 36);
  sdesc.writeUInt32LE(0, 40);
  const ppStaging = Buffer.alloc(8);
  if (vcall(gpu.device, DEV_CREATE_TEXTURE_2D, [FFIType.ptr, FFIType.ptr, FFIType.ptr], [sdesc.ptr!, null, ppStaging.ptr!]) !== 0) {
    comRelease(backBuffer);
    return fail('CreateTexture2D (staging) failed', width, height);
  }
  const staging = ppStaging.readBigUInt64LE(0);

  vcall(gpu.context, CTX_COPY_RESOURCE, [FFIType.u64, FFIType.u64], [staging, backBuffer], FFIType.void);

  const mapped = Buffer.alloc(16);
  if (vcall(gpu.context, CTX_MAP, [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], [staging, 0, D3D11_MAP_READ, 0, mapped.ptr!]) !== 0) {
    comRelease(staging);
    comRelease(backBuffer);
    return fail('Map(staging) failed', width, height);
  }
  const dataPtr = Number(mapped.readBigUInt64LE(0)) as Pointer;
  const rowPitch = mapped.readUInt32LE(8);

  // Pack a tightly-strided top-down BGRA buffer (Format32bppARGB consumes BGRA).
  const dstStride = width * 4;
  const pixels = Buffer.alloc(dstStride * height);
  const src = new Uint8Array(toArrayBuffer(dataPtr, 0, rowPitch * height));
  for (let y = 0; y < height; y += 1) {
    pixels.set(src.subarray(y * rowPitch, y * rowPitch + dstStride), y * dstStride);
  }

  // ── pixel statistics + coarse luminance grid ────────────────────────────────
  let nonBlack = 0;
  let lumaSum = 0;
  let sampled = 0;
  const grid = new Array<number>(gridW * gridH).fill(0);
  const gridCount = new Array<number>(gridW * gridH).fill(0);
  const stepX = Math.max(1, Math.floor(width / 256));
  const stepY = Math.max(1, Math.floor(height / 256));
  for (let y = 0; y < height; y += stepY) {
    const gy = Math.min(gridH - 1, Math.floor((y / height) * gridH));
    for (let x = 0; x < width; x += stepX) {
      const o = y * dstStride + x * 4;
      const b = pixels[o]!;
      const g = pixels[o + 1]!;
      const r = pixels[o + 2]!;
      const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      if (r > 10 || g > 10 || b > 10) nonBlack += 1;
      lumaSum += luma;
      sampled += 1;
      const gx = Math.min(gridW - 1, Math.floor((x / width) * gridW));
      const cell = gy * gridW + gx;
      grid[cell]! += luma;
      gridCount[cell]! += 1;
    }
  }
  for (let i = 0; i < grid.length; i += 1) grid[i] = gridCount[i]! > 0 ? grid[i]! / gridCount[i]! : 0;

  vcall(gpu.context, CTX_UNMAP, [FFIType.u64, FFIType.u32], [staging, 0], FFIType.void);

  // ── encode PNG via Gdiplus ──────────────────────────────────────────────────
  let ok = false;
  let note = '';
  if (!gdiplusReady) {
    Gdiplus.Preload();
    gdiplusReady = true;
  }
  const tokenBuf = Buffer.alloc(8);
  const startupInput = Buffer.alloc(24);
  startupInput.writeUInt32LE(1, 0);
  if (Gdiplus.GdiplusStartup(tokenBuf.ptr!, startupInput.ptr!, null) === Status.Ok) {
    const token = tokenBuf.readBigUInt64LE(0);
    const bmpBuf = Buffer.alloc(8);
    if (Gdiplus.GdipCreateBitmapFromScan0(width, height, dstStride, PixelFormat32bppARGB, pixels.ptr!, bmpBuf.ptr!) === Status.Ok) {
      const bmp = bmpBuf.readBigUInt64LE(0);
      const clsid = Buffer.alloc(16);
      clsid.writeUInt32LE(0x557cf406, 0);
      clsid.writeUInt16LE(0x1a04, 4);
      clsid.writeUInt16LE(0x11d3, 6);
      clsid.set([0x9a, 0x73, 0x00, 0x00, 0xf8, 0x1e, 0xf3, 0x2e], 8);
      const wpath = Buffer.from(`${outPath}\0`, 'utf16le');
      ok = Gdiplus.GdipSaveImageToFile(bmp, wpath.ptr!, clsid.ptr!, null) === Status.Ok;
      if (!ok) note = 'GdipSaveImageToFile failed';
      Gdiplus.GdipDisposeImage(bmp);
    } else {
      note = 'GdipCreateBitmapFromScan0 failed';
    }
    Gdiplus.GdiplusShutdown(token);
  } else {
    note = 'GdiplusStartup failed';
  }

  comRelease(staging);
  comRelease(backBuffer);

  return {
    ok,
    width,
    height,
    nonBlackFrac: sampled > 0 ? nonBlack / sampled : 0,
    meanLuma: sampled > 0 ? lumaSum / sampled : 0,
    grid,
    gridW,
    gridH,
    path: outPath,
    note,
  };
}

const RAMP = ' .:-=+*#%@';
/** Render a captured frame's coarse luminance grid as printable ASCII. */
export function formatGrid(stats: SnapshotStats): string {
  if (stats.grid.length === 0) return '(no grid)';
  const lines: string[] = [];
  for (let y = 0; y < stats.gridH; y += 1) {
    let row = '';
    for (let x = 0; x < stats.gridW; x += 1) {
      const v = stats.grid[y * stats.gridW + x]!;
      row += RAMP[Math.min(RAMP.length - 1, Math.max(0, Math.floor(v * RAMP.length)))];
    }
    lines.push(row);
  }
  return lines.join('\n');
}

// ──────────────────────────────────────────────────────────────────────────────
// Self-test — renders an animated gradient and verifies the captured frame.
// ──────────────────────────────────────────────────────────────────────────────
if (import.meta.main) {
  const { resolve } = await import('node:path');
  const { mkdirSync } = await import('node:fs');
  const gpu = await import('./_gpu');

  const W = 960;
  const H = 540;
  const win = gpu.createWindow({ title: '_snapshot self-test', width: W, height: H, borderless: true });
  const { w: cw, h: ch } = win.clientSize();
  const dev = gpu.createDevice(win.hwnd, { width: cw, height: ch });

  const vs = gpu.makeVertexShader(
    gpu.compile(
      `struct VSOut { float4 pos : SV_Position; float2 uv : TEXCOORD0; };
     VSOut main(uint vid : SV_VertexID) {
       VSOut o; float2 p = float2((vid << 1) & 2, vid & 2);
       o.uv = p; o.pos = float4(p * float2(2,-2) + float2(-1,1), 0, 1); return o; }`,
      'main',
      'vs_5_0',
    ),
  );
  const ps = gpu.makePixelShader(
    gpu.compile(
      `float4 main(float4 fp : SV_Position, float2 uv : TEXCOORD0) : SV_Target {
       float3 c = float3(uv.x, uv.y, 0.5 + 0.5 * sin(uv.x * 18.0));
       return float4(c, 1); }`,
      'main',
      'ps_5_0',
    ),
  );

  win.pump();
  gpu.setRenderTargets([dev.backBufferRTV]);
  gpu.setViewport(cw, ch);
  gpu.clear(dev.backBufferRTV, [0, 0, 0, 1]);
  gpu.vsSet(vs);
  gpu.psSet(ps);
  gpu.drawFullscreenTriangle();

  const dir = resolve(import.meta.dir, '..', 'screenshots');
  mkdirSync(dir, { recursive: true });
  const out = resolve(dir, '_snapshot-selftest.png');
  const stats = captureBackBuffer(dev, out, { gridW: 48, gridH: 20 });
  dev.present(false);

  console.log(`\n── _snapshot self-test ──  (${dev.driver} · ${dev.gpuName})`);
  console.log(formatGrid(stats));
  console.log(`\n  ok=${stats.ok}  ${stats.width}x${stats.height}  nonBlackFrac=${stats.nonBlackFrac.toFixed(3)}  meanLuma=${stats.meanLuma.toFixed(3)}`);
  console.log(`  png → ${stats.path}`);

  // The gradient must be non-black, mid-bright, and vary left→right (uv.x) AND top→bottom (uv.y).
  const left = stats.grid[Math.floor(stats.gridH / 2) * stats.gridW + 2]!;
  const right = stats.grid[Math.floor(stats.gridH / 2) * stats.gridW + (stats.gridW - 3)]!;
  const top = stats.grid[2 * stats.gridW + Math.floor(stats.gridW / 2)]!;
  const bottom = stats.grid[(stats.gridH - 3) * stats.gridW + Math.floor(stats.gridW / 2)]!;
  const horizVary = Math.abs(right - left) > 0.05;
  const vertVary = Math.abs(bottom - top) > 0.05;
  const pass = stats.ok && stats.nonBlackFrac > 0.9 && stats.meanLuma > 0.1 && horizVary && vertVary;
  console.log(`  horizVary=${horizVary} (L=${left.toFixed(2)} R=${right.toFixed(2)})  vertVary=${vertVary} (T=${top.toFixed(2)} B=${bottom.toFixed(2)})`);
  console.log(pass ? '\n  PASS — back-buffer capture works.\n' : '\n  FAIL — capture did not reflect the rendered gradient.\n');

  gpu.comRelease(ps);
  gpu.comRelease(vs);
  gpu.comRelease(dev.backBufferRTV);
  gpu.comRelease(dev.swapChain);
  gpu.comRelease(dev.context);
  gpu.comRelease(dev.device);
  win.destroy();
  process.exit(pass ? 0 : 1);
}
