// D3D11 device + DXGI swap-chain creation with hardware → WARP fallback, and the engine's active-device state.

import { FFIType, type Pointer } from 'bun:ffi';

import D3d11 from '@bun-win32/d3d11';
import { D3D11_SDK_VERSION, D3D_DRIVER_TYPE } from '@bun-win32/d3d11';

import { openAdapter } from './adapter';
import { comRelease, guidBytes, hex, vcall } from './com';
import { reportLeaksAndReset } from './memory';
import {
  D3D11_CREATE_DEVICE_BGRA_SUPPORT,
  D3D_FEATURE_LEVEL_11_0,
  DEV_CREATE_RENDER_TARGET_VIEW,
  DEV_GET_DEVICE_REMOVED_REASON,
  DXGIADAPTER_GET_DESC,
  DXGIDEVICE_GET_ADAPTER,
  DXGI_ERROR_DEVICE_HUNG,
  DXGI_ERROR_DEVICE_REMOVED,
  DXGI_ERROR_DEVICE_RESET,
  DXGI_ERROR_DRIVER_INTERNAL_ERROR,
  DXGI_ERROR_INVALID_CALL,
  DXGI_FORMAT_B8G8R8A8_UNORM,
  DXGI_SWAP_EFFECT_DISCARD,
  DXGI_USAGE_RENDER_TARGET_OUTPUT,
  IID_ID3D11TEXTURE2D,
  IID_IDXGIDEVICE,
  IUNKNOWN_QUERY_INTERFACE,
  SWAP_GET_BUFFER,
  SWAP_PRESENT,
} from './constants';

/**
 * A live D3D11 device, immediate context, and DXGI swap chain bound to a window,
 * with the back-buffer render-target view and convenience present/recreate.
 */
export interface Gpu {
  device: bigint;
  context: bigint;
  swapChain: bigint;
  backBufferRTV: bigint;
  gpuName: string;
  driver: 'hardware' | 'WARP';
  present(vsync?: boolean): void;
  recreateRTV(): void;
}

export interface CreateDeviceOptions {
  /** Pin device creation to a specific DXGI adapter (listAdapters() index). Takes precedence over `driver` — D3D11 requires DRIVER_TYPE_UNKNOWN with an explicit adapter. */
  adapter?: number;
  /** Pin the driver type; default tries hardware first, then falls back to WARP. */
  driver?: 'hardware' | 'warp';
}

function buildSwapChainDesc(window: bigint, w: number, h: number): Buffer {
  const b = Buffer.alloc(72);
  b.writeUInt32LE(w, 0); // BufferDesc.Width
  b.writeUInt32LE(h, 4); // BufferDesc.Height
  b.writeUInt32LE(60, 8); // RefreshRate.Numerator
  b.writeUInt32LE(1, 12); // RefreshRate.Denominator
  b.writeUInt32LE(DXGI_FORMAT_B8G8R8A8_UNORM, 16); // Format
  b.writeUInt32LE(0, 20); // ScanlineOrdering
  b.writeUInt32LE(0, 24); // Scaling
  b.writeUInt32LE(1, 28); // SampleDesc.Count
  b.writeUInt32LE(0, 32); // SampleDesc.Quality
  b.writeUInt32LE(DXGI_USAGE_RENDER_TARGET_OUTPUT, 36); // BufferUsage
  b.writeUInt32LE(2, 40); // BufferCount
  b.writeBigUInt64LE(window, 48); // OutputWindow
  b.writeUInt32LE(1, 56); // Windowed
  b.writeUInt32LE(DXGI_SWAP_EFFECT_DISCARD, 60); // SwapEffect
  b.writeUInt32LE(0, 64); // Flags
  return b;
}

function tryCreateDeviceAndSwapChain(hwnd: bigint, w: number, h: number, driverType: D3D_DRIVER_TYPE): { swap: bigint; device: bigint; context: bigint } | null {
  const desc = buildSwapChainDesc(hwnd, w, h);
  const featureLevels = Buffer.alloc(4);
  featureLevels.writeUInt32LE(D3D_FEATURE_LEVEL_11_0, 0);
  const ppSwap = Buffer.alloc(8);
  const ppDevice = Buffer.alloc(8);
  const pFeatureLevel = Buffer.alloc(4);
  const ppContext = Buffer.alloc(8);
  const hr = D3d11.D3D11CreateDeviceAndSwapChain(null, driverType, 0n, D3D11_CREATE_DEVICE_BGRA_SUPPORT, featureLevels.ptr!, 1, D3D11_SDK_VERSION, desc.ptr!, ppSwap.ptr!, ppDevice.ptr!, pFeatureLevel.ptr!, ppContext.ptr!);
  if (hr !== 0) return null;
  return { swap: ppSwap.readBigUInt64LE(0), device: ppDevice.readBigUInt64LE(0), context: ppContext.readBigUInt64LE(0) };
}

let activeGpu: Gpu | null = null;

/**
 * Create a D3D11 device + DXGI swap chain on `hwnd` (hardware first, WARP fallback,
 * or pinned via options.driver). Throws when no device is available. The returned
 * Gpu becomes the engine's active target for all helper functions.
 */
export function createDevice(hwnd: bigint, size: { width: number; height: number }, options: CreateDeviceOptions = {}): Gpu {
  const order: readonly D3D_DRIVER_TYPE[] =
    options.driver === 'warp' ? [D3D_DRIVER_TYPE.D3D_DRIVER_TYPE_WARP] : options.driver === 'hardware' ? [D3D_DRIVER_TYPE.D3D_DRIVER_TYPE_HARDWARE] : [D3D_DRIVER_TYPE.D3D_DRIVER_TYPE_HARDWARE, D3D_DRIVER_TYPE.D3D_DRIVER_TYPE_WARP];
  let created: { swap: bigint; device: bigint; context: bigint } | null = null;
  let driver: 'hardware' | 'WARP' = 'hardware';
  for (const driverType of order) {
    created = tryCreateDeviceAndSwapChain(hwnd, size.width, size.height, driverType);
    if (created !== null) {
      driver = driverType === D3D_DRIVER_TYPE.D3D_DRIVER_TYPE_WARP ? 'WARP' : 'hardware';
      break;
    }
  }
  if (created === null) {
    throw new Error('No D3D11 device available (HARDWARE and WARP both failed). This machine cannot run @bun-win32/gpu.');
  }
  const { swap, device, context } = created;

  const gpu: Gpu = {
    device,
    context,
    swapChain: swap,
    backBufferRTV: 0n,
    gpuName: readGpuName(device, driver),
    driver,
    present(vsync = false) {
      vcall(swap, SWAP_PRESENT, [FFIType.u32, FFIType.u32], [vsync ? 1 : 0, 0]);
    },
    recreateRTV() {
      if (gpu.backBufferRTV !== 0n) {
        comRelease(gpu.backBufferRTV);
        gpu.backBufferRTV = 0n;
      }
      const ppBackBuffer = Buffer.alloc(8);
      const tex2dIid = guidBytes(IID_ID3D11TEXTURE2D);
      if (vcall(swap, SWAP_GET_BUFFER, [FFIType.u32, FFIType.ptr, FFIType.ptr], [0, tex2dIid.ptr!, ppBackBuffer.ptr!]) !== 0) {
        throw new Error('IDXGISwapChain::GetBuffer failed.');
      }
      const backBuffer = ppBackBuffer.readBigUInt64LE(0);
      const ppRtv = Buffer.alloc(8);
      if (vcall(device, DEV_CREATE_RENDER_TARGET_VIEW, [FFIType.u64, FFIType.ptr, FFIType.ptr], [backBuffer, null, ppRtv.ptr!]) !== 0) {
        throw new Error('CreateRenderTargetView (back buffer) failed.');
      }
      gpu.backBufferRTV = ppRtv.readBigUInt64LE(0);
      comRelease(backBuffer); // the RTV holds its own reference
    },
  };
  gpu.recreateRTV();
  activeGpu = gpu;
  return gpu;
}

/**
 * Create a device with no window/swap chain — for headless compute. Returns a
 * partial Gpu (swapChain/backBufferRTV are 0; present/recreateRTV throw).
 */
export function createComputeDevice(options: CreateDeviceOptions = {}): Gpu {
  const featureLevels = Buffer.alloc(4);
  featureLevels.writeUInt32LE(D3D_FEATURE_LEVEL_11_0, 0);

  function tryCreate(driverType: D3D_DRIVER_TYPE, adapterPointer = 0n): { device: bigint; context: bigint } | null {
    const ppDevice = Buffer.alloc(8);
    const pFeatureLevel = Buffer.alloc(4);
    const ppContext = Buffer.alloc(8);
    const hr = D3d11.D3D11CreateDevice(
      adapterPointer === 0n ? null : (Number(adapterPointer) as Pointer),
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
    if (hr !== 0) return null;
    return { device: ppDevice.readBigUInt64LE(0), context: ppContext.readBigUInt64LE(0) };
  }

  let created: { device: bigint; context: bigint } | null = null;
  let driver: 'hardware' | 'WARP' = 'hardware';
  if (options.adapter !== undefined) {
    const adapterPointer = openAdapter(options.adapter);
    created = tryCreate(D3D_DRIVER_TYPE.D3D_DRIVER_TYPE_UNKNOWN, adapterPointer);
    comRelease(adapterPointer);
    if (created === null) throw new Error(`D3D11CreateDevice failed on adapter ${options.adapter} (DRIVER_TYPE_UNKNOWN).`);
    const name = readGpuName(created.device, 'adapter');
    driver = name.includes('Basic Render Driver') ? 'WARP' : 'hardware';
  } else {
    const order: readonly D3D_DRIVER_TYPE[] =
      options.driver === 'warp' ? [D3D_DRIVER_TYPE.D3D_DRIVER_TYPE_WARP] : options.driver === 'hardware' ? [D3D_DRIVER_TYPE.D3D_DRIVER_TYPE_HARDWARE] : [D3D_DRIVER_TYPE.D3D_DRIVER_TYPE_HARDWARE, D3D_DRIVER_TYPE.D3D_DRIVER_TYPE_WARP];
    for (const driverType of order) {
      created = tryCreate(driverType);
      if (created !== null) {
        driver = driverType === D3D_DRIVER_TYPE.D3D_DRIVER_TYPE_WARP ? 'WARP' : 'hardware';
        break;
      }
    }
  }
  if (created === null) {
    throw new Error('No D3D11 device available (HARDWARE and WARP both failed). This machine cannot run @bun-win32/gpu.');
  }
  const { device, context } = created;
  const gpu: Gpu = {
    device,
    context,
    swapChain: 0n,
    backBufferRTV: 0n,
    gpuName: readGpuName(device, driver),
    driver,
    present() {
      throw new Error('present() is unavailable on a compute-only device.');
    },
    recreateRTV() {
      throw new Error('recreateRTV() is unavailable on a compute-only device.');
    },
  };
  activeGpu = gpu;
  return gpu;
}

/**
 * Format a D3D11/DXGI HRESULT for humans. Device-loss codes get the removed
 * reason (when a device is active) plus the TDR-watchdog explanation — Windows
 * kills any GPU kernel that runs longer than ~2 s and resets the driver.
 */
export function describeDeviceError(hr: number): string {
  const code = hr >>> 0;
  if (code === DXGI_ERROR_DEVICE_REMOVED || code === DXGI_ERROR_DEVICE_RESET || code === DXGI_ERROR_DEVICE_HUNG) {
    const name = code === DXGI_ERROR_DEVICE_REMOVED ? 'DXGI_ERROR_DEVICE_REMOVED' : code === DXGI_ERROR_DEVICE_RESET ? 'DXGI_ERROR_DEVICE_RESET' : 'DXGI_ERROR_DEVICE_HUNG';
    const reason = activeGpu === null ? '' : ` GetDeviceRemovedReason=${hex(getDeviceRemovedReason())}.`;
    return `${hex(code)} ${name}.${reason} The GPU device was removed or reset — on Windows this is usually the TDR watchdog killing a kernel that ran longer than ~2 s. Split long dispatches into smaller chunks, or reduce the per-dispatch workload.`;
  }
  if (code === DXGI_ERROR_INVALID_CALL) return `${hex(code)} DXGI_ERROR_INVALID_CALL. A parameter or call ordering is invalid — enable the D3D11 debug layer to see the validation message.`;
  if (code === DXGI_ERROR_DRIVER_INTERNAL_ERROR) return `${hex(code)} DXGI_ERROR_DRIVER_INTERNAL_ERROR. The driver hit an internal error — usually recoverable only by recreating the device.`;
  return hex(code);
}

/** Release the active device's RTV/swap chain/context/device (reverse creation order) and clear the active state. Warns when tracked resources are still alive. */
export function destroyDevice(): void {
  if (activeGpu === null) return;
  reportLeaksAndReset();
  comRelease(activeGpu.backBufferRTV);
  comRelease(activeGpu.swapChain);
  comRelease(activeGpu.context);
  comRelease(activeGpu.device);
  activeGpu = null;
}

/** ID3D11Device::GetDeviceRemovedReason on the active device — 0 while healthy, a DXGI_ERROR_* code after device loss. */
export function getDeviceRemovedReason(): number {
  return vcall(requireGpu().device, DEV_GET_DEVICE_REMOVED_REASON, [], []);
}

/** True when an active device exists (createDevice/createComputeDevice succeeded and destroyDevice has not run). */
export function hasDevice(): boolean {
  return activeGpu !== null;
}

/** The active Gpu every helper targets. Throws when none exists. */
export function requireGpu(): Gpu {
  if (activeGpu === null) throw new Error('No active GPU device. Call createDevice() or createComputeDevice() first.');
  return activeGpu;
}

/** GPU name via IDXGIDevice → IDXGIAdapter → GetDesc; falls back to the driver label. */
function readGpuName(device: bigint, driverLabel: string): string {
  try {
    const ppDxgiDevice = Buffer.alloc(8);
    const iid = guidBytes(IID_IDXGIDEVICE);
    if (vcall(device, IUNKNOWN_QUERY_INTERFACE, [FFIType.ptr, FFIType.ptr], [iid.ptr!, ppDxgiDevice.ptr!]) !== 0) return driverLabel;
    const dxgiDevice = ppDxgiDevice.readBigUInt64LE(0);
    const ppAdapter = Buffer.alloc(8);
    if (vcall(dxgiDevice, DXGIDEVICE_GET_ADAPTER, [FFIType.ptr], [ppAdapter.ptr!]) !== 0) {
      comRelease(dxgiDevice);
      return driverLabel;
    }
    const adapter = ppAdapter.readBigUInt64LE(0);
    const adapterDesc = Buffer.alloc(312);
    let name = driverLabel;
    if (vcall(adapter, DXGIADAPTER_GET_DESC, [FFIType.ptr], [adapterDesc.ptr!]) === 0) {
      let end = 0;
      while (end < 256 && adapterDesc.readUInt16LE(end) !== 0) end += 2;
      name = adapterDesc.subarray(0, end).toString('utf16le') || driverLabel;
    }
    comRelease(adapter);
    comRelease(dxgiDevice);
    return name;
  } catch {
    return driverLabel;
  }
}
