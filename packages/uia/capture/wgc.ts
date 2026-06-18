// Windows.Graphics.Capture (WGC) — read the LIVE pixels of a specific window even when it is occluded,
// in the background, or GPU/DWM-composited (hardware-accel Chromium/Edge/Electron, games, WinUI) — the
// content PrintWindow returns blank for. This is the same DWM-composited surface Alt+Tab / taskbar previews
// read. Pure bun:ffi: WinRT activation via combase (the same Co* path automation.ts uses — apartment-agnostic,
// works under the package's STA), a D3D11 device, a Direct3D11CaptureFramePool created FREE-THREADED, and the
// frame drained by POLLING TryGetNextFrame on our own thread — NO FrameArrived handler, so the foreign-thread
// JSCallback dead-end (UIA events / SetWinEventHook) is structurally avoided. Every COM/WinRT slot below is
// header-confirmed against winrt/windows.graphics.capture.h and live-proven before shipping (a wrong slot
// segfaults). Minimized windows have no composed surface; a locked/disconnected session stops compositing;
// DRM content renders black — those degrade to null/blank by design, never a bypass claim.

import { CFunction, dlopen, FFIType, type Pointer, read, toArrayBuffer } from 'bun:ffi';

import Combase from '@bun-win32/combase';
import D3d11 from '@bun-win32/d3d11';
import User32 from '@bun-win32/user32';

import { initialize, setWgcBundleDisposer } from '../com/automation';
import type { Bitmap } from './screen';

const S_OK = 0;
const D3D_FEATURE_LEVEL_11_0 = 0xb000;
const D3D11_CREATE_DEVICE_BGRA_SUPPORT = 0x0000_0020;
const D3D11_SDK_VERSION = 7;
const D3D11_USAGE_STAGING = 3;
const D3D11_CPU_ACCESS_READ = 0x0002_0000;
const D3D11_MAP_READ = 1;
const DXGI_FORMAT_B8G8R8A8_UNORM = 87;
const RPC_E_CHANGED_MODE = 0x8001_0106 | 0;

// WinRT runtime-class names + interface IIDs (header-confirmed, 10.0.22000.0).
const RC_GraphicsCaptureItem = 'Windows.Graphics.Capture.GraphicsCaptureItem';
const RC_FramePool = 'Windows.Graphics.Capture.Direct3D11CaptureFramePool';
const IID_IGraphicsCaptureItemInterop = '3628E81B-3CAC-4C60-B7F4-23CE0E0C3356';
const IID_IGraphicsCaptureItem = '79C3F95B-31F7-4EC2-A464-632EF5D30760';
const IID_IDXGIDevice = '54ec77fa-1377-44e6-8c32-88fd5f44c84c';
const IID_IDirect3DDevice = 'A37624AB-8D5F-4650-9D3E-9EAE3D9BC670';
const IID_IDirect3D11CaptureFramePoolStatics2 = '589b103f-6bbc-5df5-a991-02e28b3b66d5';
const IID_IDirect3DDxgiInterfaceAccess = 'A9B3D012-3DF2-4EE3-B8D1-8695F457D3C1';
const IID_ID3D11Texture2D = '6f15aaf2-d208-4e89-9ab4-489535d34f9c';

// vtable slots (0-based). IUnknown 0-2 on every interface; the rest header declaration order.
const QUERY_INTERFACE = 0;
const RELEASE = 2;
const ITEM_GET_SIZE = 7;
const INTEROP_CREATE_FOR_WINDOW = 3;
const FRAMEPOOL_CREATE_FREE_THREADED = 6;
const FRAMEPOOL_TRY_GET_NEXT_FRAME = 7;
const FRAMEPOOL_CREATE_CAPTURE_SESSION = 10;
const SESSION_START_CAPTURE = 6;
const FRAME_GET_SURFACE = 6;
const DXGI_ACCESS_GET_INTERFACE = 3;
const TEX2D_GET_DESC = 10;
const DEV_CREATE_TEXTURE_2D = 5;
const CTX_COPY_RESOURCE = 47;
const CTX_MAP = 14;
const CTX_UNMAP = 15;

// CreateDirect3D11DeviceFromDXGIDevice takes the IDXGIDevice* as a pointer-sized arg; the @bun-win32/d3d11
// binding types it as `ptr`, which will not accept a bigint COM pointer — bind it locally with a u64 arg.
const { symbols: D3D11Interop } = dlopen('d3d11.dll', { CreateDirect3D11DeviceFromDXGIDevice: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 } });

const invokers = new Map<string, ReturnType<typeof CFunction>>();
/** Cast-free COM vtable invoker with an explicit return type (the D3D11 readback needs void/u32 returns). */
function vcall(thisPtr: bigint, slot: number, argTypes: readonly FFIType[], args: readonly unknown[], returns: FFIType = FFIType.i32): number {
  if (thisPtr === 0n) throw new Error(`vcall: null interface pointer (slot ${slot})`); // predicted-not-taken; turns a segfault into a catchable error
  const vtable = read.u64(Number(thisPtr) as Pointer, 0);
  if (vtable === 0n) throw new Error(`vcall: null vtable at interface 0x${thisPtr.toString(16)} (slot ${slot}) — use-after-free or invalid interface pointer`); // a freed/zeroed object reads vtable 0; without this the next read segfaults uncatchably
  const method = read.u64(Number(vtable) as Pointer, slot * 8);
  if (method === 0n) throw new Error(`vcall: null method pointer at slot ${slot} (vtable 0x${vtable.toString(16)})`); // a corrupt/short vtable yields a null method; calling it would crash
  const key = `${method}|${returns}|${argTypes.join(',')}`;
  let invoke = invokers.get(key);
  if (invoke === undefined) {
    invoke = CFunction({ ptr: Number(method) as Pointer, args: [FFIType.u64, ...argTypes], returns });
    invokers.set(key, invoke);
  }
  return invoke(thisPtr, ...args) as number;
}

function release(ptr: bigint): void {
  if (ptr !== 0n) vcall(ptr, RELEASE, [], [], FFIType.u32);
}

function guidBytes(value: string): Buffer {
  const match = /^([0-9a-f]{8})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{12})$/i.exec(value)!;
  const [, d1, d2, d3, d4High, d4Low] = match;
  const buffer = Buffer.alloc(16);
  buffer.writeUInt32LE(parseInt(d1!, 16), 0);
  buffer.writeUInt16LE(parseInt(d2!, 16), 4);
  buffer.writeUInt16LE(parseInt(d3!, 16), 6);
  const data4 = `${d4High}${d4Low}`;
  for (let index = 0; index < 8; index += 1) buffer[8 + index] = parseInt(data4.slice(index * 2, index * 2 + 2), 16);
  return buffer;
}

function hstring(text: string): bigint {
  const source = Buffer.from(`${text}\0`, 'utf16le');
  const out = Buffer.alloc(8);
  if (Combase.WindowsCreateString(source.ptr!, text.length, out.ptr!) !== S_OK) throw new Error(`WindowsCreateString(${text}) failed`);
  return out.readBigUInt64LE(0);
}

function activationFactory(runtimeClass: string, iid: string): bigint {
  const out = Buffer.alloc(8);
  const handle = hstring(runtimeClass);
  const hr = Combase.RoGetActivationFactory(handle, guidBytes(iid).ptr!, out.ptr!);
  Combase.WindowsDeleteString(handle);
  const factory = out.readBigUInt64LE(0);
  if (hr !== S_OK || factory === 0n) throw new Error(`RoGetActivationFactory(${runtimeClass}) failed: 0x${(hr >>> 0).toString(16)}`);
  return factory;
}

function queryInterface(unknown: bigint, iid: string): bigint {
  const out = Buffer.alloc(8);
  if (vcall(unknown, QUERY_INTERFACE, [FFIType.ptr, FFIType.ptr], [guidBytes(iid).ptr!, out.ptr!]) !== S_OK) return 0n;
  return out.readBigUInt64LE(0);
}

// The D3D11 device + WinRT device wrapper + activation factories are reusable across captures; the per-window
// GraphicsCaptureItem / frame pool / session are created per call. The device is the expensive part — cache it.
interface DeviceBundle {
  device: bigint;
  context: bigint;
  winrtDevice: bigint;
  interop: bigint;
  framePoolStatics: bigint;
}
let bundle: DeviceBundle | null = null;
let roInitialized = false; // whether RoInitialize succeeded (so dispose pairs RoUninitialize 1:1, never over-decrementing)

function createDevice(driverType: number): { device: bigint; context: bigint } | null {
  const featureLevels = Buffer.alloc(4);
  featureLevels.writeUInt32LE(D3D_FEATURE_LEVEL_11_0, 0);
  const ppDevice = Buffer.alloc(8);
  const pFeatureLevel = Buffer.alloc(4);
  const ppContext = Buffer.alloc(8);
  if (D3d11.D3D11CreateDevice(null, driverType, 0n, D3D11_CREATE_DEVICE_BGRA_SUPPORT, featureLevels.ptr!, 1, D3D11_SDK_VERSION, ppDevice.ptr!, pFeatureLevel.ptr!, ppContext.ptr!) !== S_OK) return null;
  return { device: ppDevice.readBigUInt64LE(0), context: ppContext.readBigUInt64LE(0) };
}

function ensureBundle(): DeviceBundle {
  if (bundle !== null) return bundle;
  initialize(); // ensure COM is initialized (uia's STA is fine — WGC activation is apartment-agnostic)
  roInitialized = Combase.RoInitialize(1) === S_OK; // RO_INIT_MULTITHREADED; RPC_E_CHANGED_MODE under the existing STA is expected (then no RoUninitialize)
  const device = createDevice(1 /* HARDWARE */) ?? createDevice(5 /* WARP */);
  if (device === null) throw new Error('WGC: D3D11CreateDevice failed (HARDWARE and WARP)');
  const dxgiDevice = queryInterface(device.device, IID_IDXGIDevice);
  const inspectableOut = Buffer.alloc(8);
  if (D3D11Interop.CreateDirect3D11DeviceFromDXGIDevice(dxgiDevice, inspectableOut.ptr!) !== S_OK) throw new Error('WGC: CreateDirect3D11DeviceFromDXGIDevice failed');
  const inspectable = inspectableOut.readBigUInt64LE(0);
  const winrtDevice = queryInterface(inspectable, IID_IDirect3DDevice);
  release(inspectable);
  release(dxgiDevice);
  bundle = {
    device: device.device,
    context: device.context,
    winrtDevice,
    interop: activationFactory(RC_GraphicsCaptureItem, IID_IGraphicsCaptureItemInterop),
    framePoolStatics: activationFactory(RC_FramePool, IID_IDirect3D11CaptureFramePoolStatics2),
  };
  setWgcBundleDisposer(dispose); // let automation.uninitialize() free this bundle before CoUninitialize (no static automation→wgc dep)
  return bundle;
}

/**
 * Release the cached D3D11 + WinRT bundle and pair the RoInitialize. Self-guarded (no bundle → no-op),
 * so safe when WGC was never used or already disposed. Called by automation.uninitialize() (registered
 * via setWgcBundleDisposer) so a later captureWindowLive rebuilds the bundle instead of vcalling freed
 * interfaces; also exported for callers that use captureWindowLive directly.
 */
export function dispose(): void {
  if (bundle === null) return;
  release(bundle.framePoolStatics);
  release(bundle.interop);
  release(bundle.winrtDevice);
  release(bundle.context); // the immediate context holds a device ref — release it before the device
  release(bundle.device);
  bundle = null;
  if (roInitialized) {
    Combase.RoUninitialize();
    roInitialized = false;
  }
}

/** Whether WGC is usable on this OS (Windows 10 1809+; the env on test boxes is 26200). Best-effort — a
 *  failed device/activation throws from captureWindowLive, which the caller treats as "fall back to PrintWindow". */
export function wgcAvailable(): boolean {
  try {
    ensureBundle();
    return true;
  } catch {
    return false;
  }
}

/**
 * Capture the live pixels of a window via Windows.Graphics.Capture — even occluded / background / GPU-composited.
 * Returns a tightly-packed RGB `Bitmap` (origin = the window's top-left in screen pixels), or null if the window
 * cannot be captured (invalid handle, minimized with no surface, protected content, or WGC unavailable). The
 * frame is drained by polling (no event handler); `timeoutMs` bounds the wait for the first frame.
 */
export async function captureWindowLive(hWnd: bigint, options: { timeoutMs?: number } = {}): Promise<Bitmap | null> {
  let item = 0n;
  let pool = 0n;
  let session = 0n;
  let frame = 0n;
  let surface = 0n;
  let access = 0n;
  let texture = 0n;
  let staging = 0n;
  try {
    const owned = ensureBundle();

    const itemOut = Buffer.alloc(8);
    if (vcall(owned.interop, INTEROP_CREATE_FOR_WINDOW, [FFIType.u64, FFIType.ptr, FFIType.ptr], [hWnd, guidBytes(IID_IGraphicsCaptureItem).ptr!, itemOut.ptr!]) !== S_OK) return null;
    item = itemOut.readBigUInt64LE(0);
    if (item === 0n) return null;

    const sizeOut = Buffer.alloc(8);
    vcall(item, ITEM_GET_SIZE, [FFIType.ptr], [sizeOut.ptr!]);
    const width = sizeOut.readInt32LE(0);
    const height = sizeOut.readInt32LE(4);
    if (width <= 0 || height <= 0) return null;

    // SizeInt32 {INT32 Width@0, INT32 Height@4} is passed by value in one register — pack it inline, no await before the call.
    const packedSize = (BigInt(height >>> 0) << 32n) | BigInt(width >>> 0);
    const poolOut = Buffer.alloc(8);
    if (vcall(owned.framePoolStatics, FRAMEPOOL_CREATE_FREE_THREADED, [FFIType.u64, FFIType.u32, FFIType.i32, FFIType.u64, FFIType.ptr], [owned.winrtDevice, DXGI_FORMAT_B8G8R8A8_UNORM, 2, packedSize, poolOut.ptr!]) !== S_OK) return null;
    pool = poolOut.readBigUInt64LE(0);

    const sessionOut = Buffer.alloc(8);
    if (vcall(pool, FRAMEPOOL_CREATE_CAPTURE_SESSION, [FFIType.u64, FFIType.ptr], [item, sessionOut.ptr!]) !== S_OK) return null;
    session = sessionOut.readBigUInt64LE(0);
    vcall(session, SESSION_START_CAPTURE, [], []);

    const deadline = Bun.nanoseconds() + (options.timeoutMs ?? 500) * 1e6;
    while (frame === 0n && Bun.nanoseconds() < deadline) {
      const frameOut = Buffer.alloc(8);
      vcall(pool, FRAMEPOOL_TRY_GET_NEXT_FRAME, [FFIType.ptr], [frameOut.ptr!]);
      frame = frameOut.readBigUInt64LE(0);
      if (frame === 0n) await Bun.sleep(8);
    }
    if (frame === 0n) return null;

    const surfaceOut = Buffer.alloc(8);
    vcall(frame, FRAME_GET_SURFACE, [FFIType.ptr], [surfaceOut.ptr!]);
    surface = surfaceOut.readBigUInt64LE(0);
    access = queryInterface(surface, IID_IDirect3DDxgiInterfaceAccess);
    if (access === 0n) return null;
    const textureOut = Buffer.alloc(8);
    if (vcall(access, DXGI_ACCESS_GET_INTERFACE, [FFIType.ptr, FFIType.ptr], [guidBytes(IID_ID3D11Texture2D).ptr!, textureOut.ptr!]) !== S_OK) return null;
    texture = textureOut.readBigUInt64LE(0);

    const desc = Buffer.alloc(44); // D3D11_TEXTURE2D_DESC
    vcall(texture, TEX2D_GET_DESC, [FFIType.ptr], [desc.ptr!], FFIType.void);
    const textureWidth = desc.readUInt32LE(0);
    const textureHeight = desc.readUInt32LE(4);
    const stagingDesc = Buffer.alloc(44);
    stagingDesc.writeUInt32LE(textureWidth, 0);
    stagingDesc.writeUInt32LE(textureHeight, 4);
    stagingDesc.writeUInt32LE(1, 8); // MipLevels
    stagingDesc.writeUInt32LE(1, 12); // ArraySize
    stagingDesc.writeUInt32LE(DXGI_FORMAT_B8G8R8A8_UNORM, 16);
    stagingDesc.writeUInt32LE(1, 20); // SampleDesc.Count
    stagingDesc.writeUInt32LE(D3D11_USAGE_STAGING, 28);
    stagingDesc.writeUInt32LE(D3D11_CPU_ACCESS_READ, 36);
    const stagingOut = Buffer.alloc(8);
    if (vcall(owned.device, DEV_CREATE_TEXTURE_2D, [FFIType.ptr, FFIType.ptr, FFIType.ptr], [stagingDesc.ptr!, null, stagingOut.ptr!]) !== S_OK) return null;
    staging = stagingOut.readBigUInt64LE(0);
    vcall(owned.context, CTX_COPY_RESOURCE, [FFIType.u64, FFIType.u64], [staging, texture], FFIType.void);

    const mapped = Buffer.alloc(16); // D3D11_MAPPED_SUBRESOURCE: pData@0, RowPitch u32@8
    if (vcall(owned.context, CTX_MAP, [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], [staging, 0, D3D11_MAP_READ, 0, mapped.ptr!]) !== S_OK) return null;
    const dataPointer = mapped.readBigUInt64LE(0);
    const rowPitch = mapped.readUInt32LE(8);
    const source = new Uint8Array(toArrayBuffer(Number(dataPointer) as Pointer, 0, rowPitch * textureHeight));
    const rgb = new Uint8Array(textureWidth * textureHeight * 3);
    let target = 0; // contiguous output; only the source carries row pitch — incrementing target beats targetRow+x*3 (~8% measured)
    for (let y = 0; y < textureHeight; y += 1) {
      const sourceRow = y * rowPitch;
      for (let x = 0; x < textureWidth; x += 1) {
        const s = sourceRow + x * 4;
        rgb[target] = source[s + 2]!; // R ← BGRA
        rgb[target + 1] = source[s + 1]!;
        rgb[target + 2] = source[s]!;
        target += 3;
      }
    }
    vcall(owned.context, CTX_UNMAP, [FFIType.u64, FFIType.u32], [staging, 0], FFIType.void);

    const rect = Buffer.alloc(16);
    const haveRect = User32.GetWindowRect(hWnd, rect.ptr!) !== 0;
    return { rgb, width: textureWidth, height: textureHeight, originX: haveRect ? rect.readInt32LE(0) : 0, originY: haveRect ? rect.readInt32LE(4) : 0 };
  } finally {
    release(staging);
    release(texture);
    release(access);
    release(surface);
    release(frame);
    release(session);
    release(pool);
    release(item);
  }
}
