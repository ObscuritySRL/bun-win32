// 2D texture creation with RTV/SRV/UAV views, plus RowPitch-correct CPU readback.

import { FFIType, toArrayBuffer, type Pointer } from 'bun:ffi';

import { comRelease, vcall } from './com';
import {
  CTX_COPY_RESOURCE,
  CTX_COPY_SUBRESOURCE_REGION,
  CTX_FLUSH,
  CTX_MAP,
  CTX_UNMAP,
  CTX_UPDATE_SUBRESOURCE,
  D3D11_BIND_RENDER_TARGET,
  D3D11_BIND_SHADER_RESOURCE,
  D3D11_BIND_UNORDERED_ACCESS,
  D3D11_CPU_ACCESS_READ,
  D3D11_MAP_READ,
  D3D11_SRV_DIMENSION_TEXTURE2D,
  D3D11_USAGE_DEFAULT,
  D3D11_USAGE_STAGING,
  DEV_CREATE_RENDER_TARGET_VIEW,
  DEV_CREATE_SHADER_RESOURCE_VIEW,
  DEV_CREATE_TEXTURE_2D,
  DEV_CREATE_UNORDERED_ACCESS_VIEW,
  DXGI_FORMAT_R16G16B16A16_FLOAT,
  DXGI_FORMAT_R32G32B32A32_FLOAT,
  DXGI_FORMAT_R8G8B8A8_UNORM,
} from './constants';
import { describeDeviceError, requireGpu } from './device';
import { trackResource } from './memory';

/** Result of {@link makeTexture}: the texture plus optional RTV/SRV/UAV views. */
export interface TextureResult {
  tex: bigint;
  rtv?: bigint;
  srv?: bigint;
  uav?: bigint;
}

export interface TextureOptions {
  w: number;
  h: number;
  /** DXGI format; defaults to R8G8B8A8_UNORM. */
  format?: number;
  rtv?: boolean;
  srv?: boolean;
  uav?: boolean;
  /** Create a STAGING (CPU-readable) texture instead of a GPU-bound one. */
  staging?: boolean;
}

/** Create a 2D texture with the requested bind flags and views. */
export function makeTexture(options: TextureOptions): TextureResult {
  const { device } = requireGpu();
  const { w, h, format = DXGI_FORMAT_R8G8B8A8_UNORM, rtv = false, srv = false, uav = false, staging = false } = options;
  if (staging && (rtv || srv || uav)) {
    throw new Error('makeTexture: a staging texture cannot have rtv/srv/uav views (D3D11 forbids bind flags on USAGE_STAGING). Drop staging, or drop the view flags — readbackTexture creates its own staging copy internally.');
  }

  let bindFlags = 0;
  if (rtv) bindFlags |= D3D11_BIND_RENDER_TARGET;
  if (srv) bindFlags |= D3D11_BIND_SHADER_RESOURCE;
  if (uav) bindFlags |= D3D11_BIND_UNORDERED_ACCESS;

  // D3D11_TEXTURE2D_DESC: 44 bytes. Width@0 Height@4 MipLevels@8 ArraySize@12
  // Format@16 SampleDesc.Count@20 SampleDesc.Quality@24 Usage@28 BindFlags@32
  // CPUAccessFlags@36 MiscFlags@40.
  const desc = Buffer.alloc(44);
  desc.writeUInt32LE(w, 0);
  desc.writeUInt32LE(h, 4);
  desc.writeUInt32LE(1, 8); // MipLevels
  desc.writeUInt32LE(1, 12); // ArraySize
  desc.writeUInt32LE(format, 16);
  desc.writeUInt32LE(1, 20); // SampleDesc.Count
  desc.writeUInt32LE(0, 24); // SampleDesc.Quality
  desc.writeUInt32LE(staging ? D3D11_USAGE_STAGING : D3D11_USAGE_DEFAULT, 28);
  desc.writeUInt32LE(staging ? 0 : bindFlags, 32);
  desc.writeUInt32LE(staging ? D3D11_CPU_ACCESS_READ : 0, 36);
  desc.writeUInt32LE(0, 40); // MiscFlags

  const pp = Buffer.alloc(8);
  const texHr = vcall(device, DEV_CREATE_TEXTURE_2D, [FFIType.ptr, FFIType.ptr, FFIType.ptr], [desc.ptr!, null, pp.ptr!]);
  if (texHr !== 0) throw new Error(`CreateTexture2D failed: ${describeDeviceError(texHr)}`);
  const tex = pp.readBigUInt64LE(0);
  // 4 bytes/pixel covers every format this module creates by default; wide formats
  // (R32G32B32A32 16 B, R16G16B16A16 8 B) adjust the accounting only.
  const bytesPerPixel = format === DXGI_FORMAT_R32G32B32A32_FLOAT ? 16 : format === DXGI_FORMAT_R16G16B16A16_FLOAT ? 8 : 4;
  trackResource(tex, w * h * bytesPerPixel, 'texture');
  const result: TextureResult = { tex };
  if (staging) return result;

  if (rtv) {
    const ppRtv = Buffer.alloc(8);
    const rtvHr = vcall(device, DEV_CREATE_RENDER_TARGET_VIEW, [FFIType.u64, FFIType.ptr, FFIType.ptr], [tex, null, ppRtv.ptr!]);
    if (rtvHr !== 0) {
      comRelease(tex);
      throw new Error(`CreateRenderTargetView (texture) failed: ${describeDeviceError(rtvHr)}`);
    }
    result.rtv = ppRtv.readBigUInt64LE(0);
  }
  if (srv) {
    // SRV desc: Format@0, ViewDimension@4 (TEXTURE2D=4), Texture2D{MostDetailedMip@8, MipLevels@12}.
    const srvDesc = Buffer.alloc(28);
    srvDesc.writeUInt32LE(format, 0);
    srvDesc.writeUInt32LE(D3D11_SRV_DIMENSION_TEXTURE2D, 4);
    srvDesc.writeUInt32LE(0, 8); // MostDetailedMip
    srvDesc.writeUInt32LE(1, 12); // MipLevels
    const ppSrv = Buffer.alloc(8);
    const srvHr = vcall(device, DEV_CREATE_SHADER_RESOURCE_VIEW, [FFIType.u64, FFIType.ptr, FFIType.ptr], [tex, srvDesc.ptr!, ppSrv.ptr!]);
    if (srvHr !== 0) {
      comRelease(result.rtv ?? 0n);
      comRelease(tex);
      throw new Error(`CreateShaderResourceView (texture) failed: ${describeDeviceError(srvHr)}`);
    }
    result.srv = ppSrv.readBigUInt64LE(0);
  }
  if (uav) {
    // UAV desc: Format@0, ViewDimension@4 (TEXTURE2D=4), Texture2D{MipSlice@8}.
    const uavDesc = Buffer.alloc(28);
    uavDesc.writeUInt32LE(format, 0);
    uavDesc.writeUInt32LE(4, 4); // D3D11_UAV_DIMENSION_TEXTURE2D
    uavDesc.writeUInt32LE(0, 8); // MipSlice
    const ppUav = Buffer.alloc(8);
    const uavHr = vcall(device, DEV_CREATE_UNORDERED_ACCESS_VIEW, [FFIType.u64, FFIType.ptr, FFIType.ptr], [tex, uavDesc.ptr!, ppUav.ptr!]);
    if (uavHr !== 0) {
      comRelease(result.srv ?? 0n);
      comRelease(result.rtv ?? 0n);
      comRelease(tex);
      throw new Error(`CreateUnorderedAccessView (texture) failed: ${describeDeviceError(uavHr)}`);
    }
    result.uav = ppUav.readBigUInt64LE(0);
  }
  return result;
}

/**
 * Create a texture from tightly packed CPU pixels (UpdateSubresource upload with
 * SrcRowPitch = w × bytesPerPixel). Defaults to an SRV-bound R8G8B8A8 texture —
 * the image-processing input. Re-uploading while the SRV is bound to a shader
 * stage is invalid; unbind first.
 */
export function textureFromPixels(pixels: Uint8Array, w: number, h: number, options: { format?: number; srv?: boolean; uav?: boolean; bytesPerPixel?: number } = {}): TextureResult {
  const { context } = requireGpu();
  const { format = DXGI_FORMAT_R8G8B8A8_UNORM, srv = true, uav = false, bytesPerPixel = 4 } = options;
  if (pixels.byteLength !== w * h * bytesPerPixel) {
    throw new Error(`textureFromPixels: pixels is ${pixels.byteLength} bytes but ${w}×${h}×${bytesPerPixel} requires ${w * h * bytesPerPixel}.`);
  }
  const result = makeTexture({ w, h, format, srv, uav });
  const source = Buffer.from(pixels.buffer, pixels.byteOffset, pixels.byteLength);
  vcall(context, CTX_UPDATE_SUBRESOURCE, [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], [result.tex, 0, null, source.ptr!, w * bytesPerPixel, 0], FFIType.void);
  return result;
}

// Pooled readback staging texture (single entry keyed by device/w/h/format) plus a
// mapped-info scratch, mirroring buffer.ts's readback pool — a per-frame readback
// creates zero GPU resources. Created UNTRACKED (engine-owned, like the buffer
// staging pool) so destroyDevice's leak warning stays clean. `.ptr` is read at call
// time, never cached.
const textureMappedScratch = Buffer.alloc(16); // pData@0, RowPitch u32@8, DepthPitch u32@12
let textureStaging = 0n;
let textureStagingKey = '';
// Banded readback for ≥16 MiB textures: 4 row-band stagings, each copied via
// CopySubresourceRegion + Flush, then mapped in order — the GPU still copies later
// bands while the CPU drains earlier ones (1.3× measured at 4K RGBA, both drivers).
const TEXTURE_BAND_COUNT = 4;
const TEXTURE_BAND_THRESHOLD = 16 * 1024 * 1024;
const textureBandBox = Buffer.alloc(24); // D3D11_BOX { left, top, front, right, bottom, back }
let textureBands: bigint[] = [];
let textureBandsKey = '';

/** Internal: pooled staging texture acquisition (snapshot.ts shares it; not re-exported from index.ts). */
export function acquireTextureStaging(device: bigint, w: number, h: number, format: number): bigint {
  const key = `${device}|${w}|${h}|${format}`;
  if (textureStaging !== 0n && textureStagingKey === key) return textureStaging;
  comRelease(textureStaging);
  // Zero BEFORE attempting creation — a failed create must leave the pool empty,
  // not caching a freed handle under the old key (use-after-free on the next call).
  textureStaging = 0n;
  textureStagingKey = '';
  const desc = Buffer.alloc(44);
  desc.writeUInt32LE(w, 0);
  desc.writeUInt32LE(h, 4);
  desc.writeUInt32LE(1, 8); // MipLevels
  desc.writeUInt32LE(1, 12); // ArraySize
  desc.writeUInt32LE(format, 16);
  desc.writeUInt32LE(1, 20); // SampleDesc.Count
  desc.writeUInt32LE(0, 24); // SampleDesc.Quality
  desc.writeUInt32LE(D3D11_USAGE_STAGING, 28);
  desc.writeUInt32LE(0, 32); // BindFlags
  desc.writeUInt32LE(D3D11_CPU_ACCESS_READ, 36);
  desc.writeUInt32LE(0, 40); // MiscFlags
  const pp = Buffer.alloc(8);
  const hr = vcall(device, DEV_CREATE_TEXTURE_2D, [FFIType.ptr, FFIType.ptr, FFIType.ptr], [desc.ptr!, null, pp.ptr!]);
  if (hr !== 0) throw new Error(`CreateTexture2D (readback staging) failed: ${describeDeviceError(hr)}`);
  textureStaging = pp.readBigUInt64LE(0);
  textureStagingKey = key;
  return textureStaging;
}

function acquireTextureBands(device: bigint, w: number, h: number, format: number, bandRows: number): bigint[] {
  const key = `${device}|${w}|${h}|${format}`;
  if (textureBands.length === TEXTURE_BAND_COUNT && textureBandsKey === key) return textureBands;
  for (const band of textureBands) comRelease(band);
  // Zero BEFORE attempting creation — a failed create must leave the pool empty.
  textureBands = [];
  textureBandsKey = '';
  const bands: bigint[] = [];
  const desc = Buffer.alloc(44);
  desc.writeUInt32LE(w, 0);
  desc.writeUInt32LE(bandRows, 4);
  desc.writeUInt32LE(1, 8); // MipLevels
  desc.writeUInt32LE(1, 12); // ArraySize
  desc.writeUInt32LE(format, 16);
  desc.writeUInt32LE(1, 20); // SampleDesc.Count
  desc.writeUInt32LE(0, 24); // SampleDesc.Quality
  desc.writeUInt32LE(D3D11_USAGE_STAGING, 28);
  desc.writeUInt32LE(0, 32); // BindFlags
  desc.writeUInt32LE(D3D11_CPU_ACCESS_READ, 36);
  desc.writeUInt32LE(0, 40); // MiscFlags
  for (let band = 0; band < TEXTURE_BAND_COUNT; band += 1) {
    const pp = Buffer.alloc(8);
    const hr = vcall(device, DEV_CREATE_TEXTURE_2D, [FFIType.ptr, FFIType.ptr, FFIType.ptr], [desc.ptr!, null, pp.ptr!]);
    if (hr !== 0) {
      for (const created of bands) comRelease(created);
      throw new Error(`CreateTexture2D (banded readback staging) failed: ${describeDeviceError(hr)}`);
    }
    bands.push(pp.readBigUInt64LE(0));
  }
  textureBands = bands;
  textureBandsKey = key;
  return bands;
}

function readbackTextureBanded(device: bigint, context: bigint, tex: bigint, w: number, h: number, target: Uint8Array, rowBytes: number, format: number): void {
  const bandRows = Math.ceil(h / TEXTURE_BAND_COUNT);
  const bands = acquireTextureBands(device, w, h, format, bandRows);
  for (let band = 0; band < TEXTURE_BAND_COUNT; band += 1) {
    const top = band * bandRows;
    const bottom = Math.min(h, top + bandRows);
    if (top >= bottom) break;
    textureBandBox.writeUInt32LE(0, 0); // left
    textureBandBox.writeUInt32LE(top, 4); // top
    textureBandBox.writeUInt32LE(0, 8); // front
    textureBandBox.writeUInt32LE(w, 12); // right
    textureBandBox.writeUInt32LE(bottom, 16); // bottom
    textureBandBox.writeUInt32LE(1, 20); // back
    vcall(context, CTX_COPY_SUBRESOURCE_REGION, [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u64, FFIType.u32, FFIType.ptr], [bands[band]!, 0, 0, 0, 0, tex, 0, textureBandBox.ptr!], FFIType.void);
    vcall(context, CTX_FLUSH, [], [], FFIType.void);
  }
  for (let band = 0; band < TEXTURE_BAND_COUNT; band += 1) {
    const top = band * bandRows;
    const bottom = Math.min(h, top + bandRows);
    if (top >= bottom) break;
    const rows = bottom - top;
    const hr = vcall(context, CTX_MAP, [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], [bands[band]!, 0, D3D11_MAP_READ, 0, textureMappedScratch.ptr!]);
    if (hr !== 0) throw new Error(`ID3D11DeviceContext::Map (banded texture readback) failed: ${describeDeviceError(hr)}`);
    const dataPtr = textureMappedScratch.readBigUInt64LE(0);
    const rowPitch = textureMappedScratch.readUInt32LE(8);
    if (rowPitch === rowBytes) {
      target.set(new Uint8Array(toArrayBuffer(Number(dataPtr) as Pointer, 0, rowBytes * rows)), top * rowBytes);
    } else {
      const source = Buffer.from(toArrayBuffer(Number(dataPtr) as Pointer, 0, rowPitch * rows));
      const destination = Buffer.from(target.buffer, target.byteOffset, rowBytes * h);
      for (let y = 0; y < rows; y += 1) source.copy(destination, (top + y) * rowBytes, y * rowPitch, y * rowPitch + rowBytes);
    }
    vcall(context, CTX_UNMAP, [FFIType.u64, FFIType.u32], [bands[band]!, 0], FFIType.void);
  }
}

/** Internal: drop the pooled texture-readback staging (destroyDevice calls this). */
export function releaseTextureReadbackStaging(): void {
  comRelease(textureStaging);
  textureStaging = 0n;
  textureStagingKey = '';
  for (const band of textureBands) comRelease(band);
  textureBands = [];
  textureBandsKey = '';
}

/**
 * Read a GPU texture back to tightly packed CPU pixels: pooled staging copy, Map
 * READ, then a RowPitch-honoring copy (RowPitch ≠ w×bpp on many GPUs — naive
 * tight-packing reads garbage). `format` must match the source texture.
 */
export function readbackTexture(tex: bigint, w: number, h: number, bytesPerPixel = 4, format = DXGI_FORMAT_R8G8B8A8_UNORM): Uint8Array {
  const tight = Buffer.allocUnsafeSlow(w * bytesPerPixel * h); // every byte is overwritten
  return readbackTextureInto(tex, w, h, tight, bytesPerPixel, format);
}

/**
 * Like {@link readbackTexture}, but into a caller-owned array — zero per-call
 * allocation (the per-frame variant). `target` must hold at least w×h×bytesPerPixel
 * bytes; the same array is returned.
 */
export function readbackTextureInto(tex: bigint, w: number, h: number, target: Uint8Array, bytesPerPixel = 4, format = DXGI_FORMAT_R8G8B8A8_UNORM): Uint8Array {
  const { device, context } = requireGpu();
  const rowBytes = w * bytesPerPixel;
  if (target.byteLength < rowBytes * h) throw new Error(`readbackTextureInto: target holds ${target.byteLength} bytes but ${w}×${h}×${bytesPerPixel} needs ${rowBytes * h}.`);
  if (rowBytes * h >= TEXTURE_BAND_THRESHOLD) {
    readbackTextureBanded(device, context, tex, w, h, target, rowBytes, format);
    return target;
  }
  const staging = acquireTextureStaging(device, w, h, format);

  vcall(context, CTX_COPY_RESOURCE, [FFIType.u64, FFIType.u64], [staging, tex], FFIType.void);

  const hr = vcall(context, CTX_MAP, [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], [staging, 0, D3D11_MAP_READ, 0, textureMappedScratch.ptr!]);
  if (hr !== 0) throw new Error(`ID3D11DeviceContext::Map (texture readback) failed: ${describeDeviceError(hr)}`);
  const dataPtr = textureMappedScratch.readBigUInt64LE(0);
  const rowPitch = textureMappedScratch.readUInt32LE(8);
  if (rowPitch === rowBytes) {
    target.set(new Uint8Array(toArrayBuffer(Number(dataPtr) as Pointer, 0, rowBytes * h)));
  } else {
    // Buffer.copy allocates nothing — wrap source and destination once, walk rows.
    const source = Buffer.from(toArrayBuffer(Number(dataPtr) as Pointer, 0, rowPitch * h));
    const destination = Buffer.from(target.buffer, target.byteOffset, rowBytes * h);
    for (let y = 0; y < h; y += 1) source.copy(destination, y * rowBytes, y * rowPitch, y * rowPitch + rowBytes);
  }
  vcall(context, CTX_UNMAP, [FFIType.u64, FFIType.u32], [staging, 0], FFIType.void);
  return target;
}
