// In-process D3D11 back-buffer capture + pixel analysis — the AI-verification primitive.
//
// CRITICAL: call captureBackBuffer AFTER drawing the final frame to the back buffer
// but BEFORE present() — with DXGI_SWAP_EFFECT_DISCARD the back-buffer contents are
// undefined after Present. The swap chain is created B8G8R8A8_UNORM (see device.ts
// buildSwapChainDesc), so the staging texture mirrors that format.

import { FFIType, toArrayBuffer, type Pointer } from 'bun:ffi';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

import { comRelease, guidBytes, vcall } from './com';
import { CTX_COPY_RESOURCE, CTX_MAP, CTX_UNMAP, D3D11_MAP_READ, DXGI_FORMAT_B8G8R8A8_UNORM, IID_ID3D11TEXTURE2D, SWAP_GET_BUFFER, TEX2D_GET_DESC } from './constants';
import type { Gpu } from './device';
import { encodePNGFromBGRA } from './png';
import { acquireTextureStaging } from './texture';

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

  const tex2dIid = guidBytes(IID_ID3D11TEXTURE2D);
  const ppBackBuffer = Buffer.alloc(8);
  if (vcall(gpu.swapChain, SWAP_GET_BUFFER, [FFIType.u32, FFIType.ptr, FFIType.ptr], [0, tex2dIid.ptr!, ppBackBuffer.ptr!]) !== 0) {
    return fail('IDXGISwapChain::GetBuffer(0) failed');
  }
  const backBuffer = ppBackBuffer.readBigUInt64LE(0);

  // Read the back-buffer dimensions from its texture desc.
  const desc = Buffer.alloc(44);
  vcall(backBuffer, TEX2D_GET_DESC, [FFIType.ptr], [desc.ptr!], FFIType.void);
  const width = desc.readUInt32LE(0);
  const height = desc.readUInt32LE(4);
  if (width === 0 || height === 0) {
    comRelease(backBuffer);
    return fail('back buffer reported 0 dimensions');
  }

  // Pooled staging (shared with readbackTextureInto) — a per-frame capture loop
  // creates zero GPU resources. acquireTextureStaging throws; this function never does.
  let staging: bigint;
  try {
    staging = acquireTextureStaging(gpu.device, width, height, DXGI_FORMAT_B8G8R8A8_UNORM);
  } catch (error) {
    comRelease(backBuffer);
    return fail(error instanceof Error ? error.message : String(error), width, height);
  }

  vcall(gpu.context, CTX_COPY_RESOURCE, [FFIType.u64, FFIType.u64], [staging, backBuffer], FFIType.void);

  const mapped = Buffer.alloc(16);
  if (vcall(gpu.context, CTX_MAP, [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], [staging, 0, D3D11_MAP_READ, 0, mapped.ptr!]) !== 0) {
    comRelease(backBuffer); // the pooled staging stays alive in the pool
    return fail('Map(staging) failed', width, height);
  }
  const dataPtr = Number(mapped.readBigUInt64LE(0)) as Pointer;
  const rowPitch = mapped.readUInt32LE(8);

  // Pack a tightly-strided top-down BGRA buffer.
  const dstStride = width * 4;
  const pixels = Buffer.allocUnsafeSlow(dstStride * height); // every byte is overwritten by the row-pack loop
  const src = new Uint8Array(toArrayBuffer(dataPtr, 0, rowPitch * height));
  for (let y = 0; y < height; y += 1) {
    pixels.set(src.subarray(y * rowPitch, y * rowPitch + dstStride), y * dstStride);
  }

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

  let ok = false;
  let note = '';
  try {
    // Bun-on-Windows mkdirSync('.', { recursive: true }) throws EEXIST — bare
    // filenames (dirname '.') need no directory creation at all.
    const directory = dirname(outPath);
    if (directory !== '.') mkdirSync(directory, { recursive: true });
    writeFileSync(outPath, encodePNGFromBGRA(pixels, width, height, dstStride));
    ok = true;
  } catch (error) {
    note = `PNG write failed: ${error instanceof Error ? error.message : String(error)}`;
  }

  comRelease(backBuffer); // staging is pooled — not released per call

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
