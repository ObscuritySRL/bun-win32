/**
 * _gpu.ts — a reusable, pure-TypeScript Direct3D 11 GPU engine over Bun FFI.
 *
 * This module is the shared substrate for the showcase's GPU demos. It wraps the
 * real Windows graphics stack — `d3d11.dll` (device, swap chain, resources),
 * `d3dcompiler_47.dll` (runtime HLSL → DXBC), `dxgi` (Present/back buffer),
 * `user32.dll` (window + input) — entirely from TypeScript. There is no native
 * shim, no C glue, no precompiled bytecode: HLSL is compiled at runtime and run
 * on the actual hardware ID3D11Device, and COM interfaces are invoked by walking
 * their vtables by hand through Bun FFI.
 *
 * ── How COM calls work here ───────────────────────────────────────────────────
 * Every D3D11 object is a COM interface: a pointer whose first 8 bytes point at a
 * vtable (an array of function pointers). `vcall(thisPtr, slot, argTypes, args,
 * returns)` reads `*thisPtr` to get the vtable, reads `vtable[slot]` to get the
 * method, then calls it with `thisPtr` prepended as the implicit `this`. Invokers
 * are memoized per (method, signature). The slot numbers below are DERIVED from
 * the declaration order in the Windows 10 SDK `d3d11.h` interface vtables and
 * VERIFIED BY RUNNING (a wrong slot segfaults) — see the self-test at the bottom.
 *
 * ── Verified vtable offsets (slot index; byte offset = slot * 8) ──────────────
 *   ID3D11Device (d3d11.h ID3D11DeviceVtbl order):
 *     3  CreateBuffer              7  CreateShaderResourceView
 *     5  CreateTexture2D           8  CreateUnorderedAccessView
 *     9  CreateRenderTargetView   12  CreateVertexShader
 *    15  CreatePixelShader        18  CreateComputeShader
 *    23  CreateSamplerState
 *   ID3D11DeviceContext (d3d11.h ID3D11DeviceContextVtbl order):
 *     8  PSSetShaderResources      9  PSSetShader        10 PSSetSamplers
 *    11  VSSetShader              13  Draw               14 Map        15 Unmap
 *    16  PSSetConstantBuffers     24  IASetPrimitiveTopology
 *    33  OMSetRenderTargets       41  Dispatch           44 RSSetViewports
 *    47  CopyResource             48  UpdateSubresource  50 ClearRenderTargetView
 *    54  GenerateMips             67  CSSetShaderResources
 *    68  CSSetUnorderedAccessViews 69 CSSetShader        71 CSSetConstantBuffers
 *   IDXGISwapChain: 2 Release, 8 Present, 9 GetBuffer
 *   ID3DBlob: 2 Release, 3 GetBufferPointer, 4 GetBufferSize
 *   IUnknown: 0 QueryInterface, 2 Release; IDXGIDevice 7 GetAdapter; IDXGIAdapter 8 GetDesc
 *
 * ── Exported API ──────────────────────────────────────────────────────────────
 *   createWindow({ title, width, height, borderless? }) → Win
 *     .hwnd .wndProc .getMouse() .keyDown(vk) .pump() .shouldClose()
 *     .clientSize() .destroy()
 *   createDevice(hwnd, { width, height }) → Gpu
 *     .device .context .swapChain .backBufferRTV .gpuName .driver
 *     .present(vsync?) .recreateRTV()
 *   vcall(thisPtr, slot, argTypes, args, returns?)        — raw vtable invoker
 *   compile(hlsl, entry, target) → { ptr, size, blob }    — D3DCompile (throws on error)
 *   makeVertexShader(code) / makePixelShader(code) / makeComputeShader(code) → bigint
 *   makeConstantBuffer(byteSize) → bigint;  updateConstantBuffer(buf, Buffer)
 *   makeStructuredBuffer({ stride, count, uav?, srv?, cpuWritable?, initialData? })
 *       → { buffer, uav?, srv? }
 *   makeTexture({ w, h, format?, rtv?, srv?, uav?, staging? }) → { tex, rtv?, srv?, uav? }
 *   makeSampler({ filter?, address? }) → bigint
 *   setRenderTargets([rtv]) / setViewport(w,h) / clear(rtv,[r,g,b,a])
 *   drawFullscreenTriangle()                              — 3 verts, SV_VertexID, no IA
 *   vsSet(shader,[cb]) / psSet(shader,{cb?,srv?,samp?}) / csSet(shader,{cb?,uav?,srv?})
 *   dispatch(x,y,z) / copyResource(dst,src) / readbackBuffer(buf) → ArrayBuffer
 *   comRelease(ptr) / blobRelease(ptr)                    — teardown helpers
 *
 * The window helper applies the mandatory visibility fix (ShowWindow + SetWindowPos
 * HWND_TOPMOST + SetForegroundWindow) so demo windows always appear on top.
 *
 * Self-test: `GPU_SELFTEST=1 bun run packages/all/example/_gpu.ts` runs three
 * checks (compute readback, animated fullscreen render, RTV→texture + SRV/sampler
 * ping-pong). Importing the module does NOT run the test.
 *
 * Run: import from a demo, e.g. `import * as gpu from './_gpu';`
 */

import { CFunction, FFIType, JSCallback, read, toArrayBuffer, type Pointer } from 'bun:ffi';

import { D3d11, D3dcompiler_47, User32 } from '../index';
import { D3DCOMPILE_ENABLE_STRICTNESS, D3DCOMPILE_OPTIMIZATION_LEVEL3 } from '@bun-win32/d3dcompiler_47';
import { D3D11_SDK_VERSION, D3D_DRIVER_TYPE } from '@bun-win32/d3d11';
import { ShowWindowCommand, SystemMetric, WindowStyles } from '@bun-win32/user32';

// ── Window messages / class style / PeekMessage flags ─────────────────────────
const WM_DESTROY = 0x0002;
const WM_CLOSE = 0x0010;
const WM_KEYDOWN = 0x0100;
const WM_KEYUP = 0x0101;
const WM_MOUSEMOVE = 0x0200;
const WM_LBUTTONDOWN = 0x0201;
const WM_LBUTTONUP = 0x0202;
const WM_RBUTTONDOWN = 0x0204;
const WM_RBUTTONUP = 0x0205;
const WM_MOUSEWHEEL = 0x020a;
const CS_HREDRAW = 0x0002;
const CS_VREDRAW = 0x0001;
const PM_REMOVE = 0x0001;
const VK_ESCAPE = 0x1b;

// ── DXGI / D3D11 enum values not surfaced by the package types ────────────────
export const DXGI_FORMAT_UNKNOWN = 0;
export const DXGI_FORMAT_R32G32B32A32_FLOAT = 2;
export const DXGI_FORMAT_R16G16B16A16_FLOAT = 10;
export const DXGI_FORMAT_R32_FLOAT = 41;
export const DXGI_FORMAT_R32_UINT = 42;
export const DXGI_FORMAT_R8G8B8A8_UNORM = 28;
export const DXGI_FORMAT_B8G8R8A8_UNORM = 87;

const DXGI_USAGE_RENDER_TARGET_OUTPUT = 0x20;
const DXGI_SWAP_EFFECT_DISCARD = 0;

const D3D11_CREATE_DEVICE_BGRA_SUPPORT = 0x20;
const D3D_FEATURE_LEVEL_11_0 = 0xb000;

const D3D11_USAGE_DEFAULT = 0;
const D3D11_USAGE_DYNAMIC = 2;
const D3D11_USAGE_STAGING = 3;

const D3D11_BIND_SHADER_RESOURCE = 0x8;
const D3D11_BIND_RENDER_TARGET = 0x20;
const D3D11_BIND_UNORDERED_ACCESS = 0x80;
const D3D11_BIND_CONSTANT_BUFFER = 0x4;

const D3D11_CPU_ACCESS_WRITE = 0x10000;
const D3D11_CPU_ACCESS_READ = 0x20000;

const D3D11_RESOURCE_MISC_BUFFER_STRUCTURED = 0x40;

const D3D11_MAP_READ = 1;
const D3D11_MAP_WRITE_DISCARD = 4;

const D3D11_UAV_DIMENSION_BUFFER = 1;
const D3D11_SRV_DIMENSION_BUFFER = 1;
const D3D11_SRV_DIMENSION_TEXTURE2D = 4;

const D3D11_PRIMITIVE_TOPOLOGY_TRIANGLELIST = 4;
const D3D11_PRIMITIVE_TOPOLOGY_POINTLIST = 1;

// Sampler filter / address modes.
export const D3D11_FILTER_MIN_MAG_MIP_POINT = 0;
export const D3D11_FILTER_MIN_MAG_MIP_LINEAR = 0x15;
export const D3D11_TEXTURE_ADDRESS_WRAP = 1;
export const D3D11_TEXTURE_ADDRESS_CLAMP = 3;

// ── ID3D11Device vtable slots (d3d11.h ID3D11DeviceVtbl declaration order) ────
export const DEV_CREATE_BUFFER = 3;
export const DEV_CREATE_TEXTURE_2D = 5;
export const DEV_CREATE_SHADER_RESOURCE_VIEW = 7;
export const DEV_CREATE_UNORDERED_ACCESS_VIEW = 8;
export const DEV_CREATE_RENDER_TARGET_VIEW = 9;
export const DEV_CREATE_VERTEX_SHADER = 12;
export const DEV_CREATE_PIXEL_SHADER = 15;
export const DEV_CREATE_COMPUTE_SHADER = 18;
export const DEV_CREATE_SAMPLER_STATE = 23;

// ── ID3D11DeviceContext vtable slots (d3d11.h ID3D11DeviceContextVtbl order) ──
export const CTX_PS_SET_SHADER_RESOURCES = 8;
export const CTX_PS_SET_SHADER = 9;
export const CTX_PS_SET_SAMPLERS = 10;
export const CTX_VS_SET_SHADER = 11;
export const CTX_DRAW = 13;
export const CTX_MAP = 14;
export const CTX_UNMAP = 15;
export const CTX_PS_SET_CONSTANT_BUFFERS = 16;
export const CTX_IA_SET_PRIMITIVE_TOPOLOGY = 24;
export const CTX_OM_SET_RENDER_TARGETS = 33;
export const CTX_DISPATCH = 41;
export const CTX_RS_SET_VIEWPORTS = 44;
export const CTX_COPY_RESOURCE = 47;
export const CTX_UPDATE_SUBRESOURCE = 48;
export const CTX_CLEAR_RENDER_TARGET_VIEW = 50;
export const CTX_GENERATE_MIPS = 54;
export const CTX_CS_SET_SHADER_RESOURCES = 67;
export const CTX_CS_SET_UNORDERED_ACCESS_VIEWS = 68;
export const CTX_CS_SET_SHADER = 69;
export const CTX_CS_SET_CONSTANT_BUFFERS = 71;
export const CTX_VS_SET_SHADER_RESOURCES = 25;
export const CTX_OM_SET_BLEND_STATE = 35;
export const DEV_CREATE_BLEND_STATE = 20;

// ── IDXGISwapChain / IDXGIDevice / IDXGIAdapter vtable slots ──────────────────
export const SWAP_RELEASE = 2;
export const SWAP_PRESENT = 8;
export const SWAP_GET_BUFFER = 9;
export const IUNKNOWN_QUERY_INTERFACE = 0;
export const IUNKNOWN_RELEASE = 2;
export const DXGIDEVICE_GET_ADAPTER = 7;
export const DXGIADAPTER_GET_DESC = 8;

// ── ID3DBlob slots (IUnknown + GetBufferPointer s3 / GetBufferSize s4) ────────
const BLOB_RELEASE = 2;
const BLOB_GET_BUFFER_POINTER = 3;
const BLOB_GET_BUFFER_SIZE = 4;

const IID_ID3D11TEXTURE2D = '6f15aaf2-d208-4e89-9ab4-489535d34f9c';
const IID_IDXGIDEVICE = '54ec77fa-1377-44e6-8c32-88fd5f44c84c';

const encodeWide = (str: string): Buffer => Buffer.from(`${str}\0`, 'utf16le');
const encodeAscii = (str: string): Buffer => Buffer.from(`${str}\0`, 'utf8');
const hex = (hr: number): string => `0x${(hr >>> 0).toString(16).padStart(8, '0')}`;

D3d11.Preload(['D3D11CreateDevice', 'D3D11CreateDeviceAndSwapChain']);
D3dcompiler_47.Preload(['D3DCompile']);

// ── Memoized COM vtable invoker (the implicit `this` u64 is prepended) ────────
const invokers = new Map<string, ReturnType<typeof CFunction>>();

/** Invoke COM method `slot` on `thisPtr`; argTypes/args exclude the implicit `this`. */
export function vcall(
  thisPtr: bigint,
  slot: number,
  argTypes: readonly FFIType[],
  args: readonly unknown[],
  returns: FFIType = FFIType.i32,
): number {
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

/** Release a COM interface (IUnknown::Release). No-op on a null handle. */
export function comRelease(thisPtr: bigint): void {
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

// ── ID3DBlob helpers ──────────────────────────────────────────────────────────
function blobBufferPointer(blob: bigint): bigint {
  const vtable = read.u64(Number(blob) as Pointer, 0);
  const fn = read.u64(Number(vtable) as Pointer, BLOB_GET_BUFFER_POINTER * 8);
  return CFunction({ ptr: Number(fn) as Pointer, args: [FFIType.u64], returns: FFIType.u64 })(blob) as bigint;
}
function blobBufferSize(blob: bigint): bigint {
  const vtable = read.u64(Number(blob) as Pointer, 0);
  const fn = read.u64(Number(vtable) as Pointer, BLOB_GET_BUFFER_SIZE * 8);
  return CFunction({ ptr: Number(fn) as Pointer, args: [FFIType.u64], returns: FFIType.u64 })(blob) as bigint;
}

/** Release an ID3DBlob. No-op on a null handle. */
export function blobRelease(blob: bigint): void {
  if (blob === 0n) return;
  const vtable = read.u64(Number(blob) as Pointer, 0);
  const fn = read.u64(Number(vtable) as Pointer, BLOB_RELEASE * 8);
  CFunction({ ptr: Number(fn) as Pointer, args: [FFIType.u64], returns: FFIType.u32 })(blob);
}
function blobAsString(blob: bigint): string {
  const dataAddr = blobBufferPointer(blob);
  const size = Number(blobBufferSize(blob));
  const bytes: number[] = [];
  for (let i = 0; i < size; i += 1) {
    const b = read.u8(Number(dataAddr) as Pointer, i);
    if (b === 0) break;
    bytes.push(b);
  }
  return new TextDecoder('utf-8').decode(new Uint8Array(bytes));
}

// ── Window ────────────────────────────────────────────────────────────────────
/** Live keyboard/mouse state and message-pump handle for a created window. */
export interface Win {
  hwnd: bigint;
  wndProc: JSCallback;
  getMouse(): { x: number; y: number; down: boolean; rightDown: boolean };
  /** Accumulated mouse-wheel delta since the last call (positive = forward); reset on read. */
  getWheel(): number;
  keyDown(vk: number): boolean;
  pump(): void;
  shouldClose(): boolean;
  clientSize(): { w: number; h: number };
  destroy(): void;
}

export interface CreateWindowOptions {
  title: string;
  width: number;
  height: number;
  /** WS_POPUP borderless when true; a normal framed window otherwise. */
  borderless?: boolean;
}

let windowClassCounter = 0;

/**
 * Register a window class, create a window, and apply the mandatory visibility
 * fix (ShowWindow → SetWindowPos HWND_TOPMOST → SetForegroundWindow). The WndProc
 * captures mouse move / left button, key down/up (tracking ESC), and close.
 */
export function createWindow(options: CreateWindowOptions): Win {
  const { title, width, height, borderless = true } = options;

  let mouseX = width / 2;
  let mouseY = height / 2;
  let mouseDown = false;
  let mouseRightDown = false;
  let wheelAccum = 0;
  let closing = false;
  const keys = new Set<number>();
  let hwnd = 0n;

  const wndProc = new JSCallback(
    (hWnd: bigint, msg: number, wParam: bigint, lParam: bigint): bigint => {
      switch (msg) {
        case WM_MOUSEMOVE: {
          const lp = lParam & 0xffffffffn;
          mouseX = Number(lp & 0xffffn);
          mouseY = Number((lp >> 16n) & 0xffffn);
          return 0n;
        }
        case WM_LBUTTONDOWN:
          mouseDown = true;
          return 0n;
        case WM_LBUTTONUP:
          mouseDown = false;
          return 0n;
        case WM_RBUTTONDOWN:
          mouseRightDown = true;
          return 0n;
        case WM_RBUTTONUP:
          mouseRightDown = false;
          return 0n;
        case WM_MOUSEWHEEL: {
          // HIWORD(wParam) is a signed short wheel delta in multiples of 120.
          let delta = Number((wParam >> 16n) & 0xffffn);
          if (delta >= 0x8000) delta -= 0x10000;
          wheelAccum += delta / 120;
          return 0n;
        }
        case WM_KEYDOWN:
          keys.add(Number(wParam));
          if (Number(wParam) === VK_ESCAPE) {
            closing = true;
            User32.DestroyWindow(hWnd);
          }
          return 0n;
        case WM_KEYUP:
          keys.delete(Number(wParam));
          return 0n;
        case WM_CLOSE:
          closing = true;
          User32.DestroyWindow(hWnd);
          return 0n;
        case WM_DESTROY:
          closing = true;
          User32.PostQuitMessage(0);
          return 0n;
        default:
          return BigInt(User32.DefWindowProcW(hWnd, msg, wParam, lParam));
      }
    },
    { args: ['u64', 'u32', 'u64', 'i64'], returns: 'i64' },
  );

  windowClassCounter += 1;
  const className = encodeWide(`BunGpuEngine_${process.pid}_${windowClassCounter}`);
  const wndClass = Buffer.alloc(80);
  const view = new DataView(wndClass.buffer);
  view.setUint32(0, 80, true); // cbSize
  view.setUint32(4, CS_HREDRAW | CS_VREDRAW, true); // style
  wndClass.writeBigUInt64LE(BigInt(wndProc.ptr!), 8); // lpfnWndProc
  wndClass.writeBigUInt64LE(BigInt(className.ptr!), 64); // lpszClassName

  if (!User32.RegisterClassExW(wndClass.ptr!)) {
    wndProc.close();
    throw new Error('RegisterClassExW failed.');
  }

  const screenW = User32.GetSystemMetrics(SystemMetric.SM_CXSCREEN);
  const screenH = User32.GetSystemMetrics(SystemMetric.SM_CYSCREEN);
  const startX = Math.max(0, Math.floor((screenW - width) / 2));
  const startY = Math.max(0, Math.floor((screenH - height) / 2));
  const style = borderless
    ? WindowStyles.WS_POPUP | WindowStyles.WS_VISIBLE
    : WindowStyles.WS_OVERLAPPEDWINDOW | WindowStyles.WS_VISIBLE;

  hwnd = User32.CreateWindowExW(
    0,
    className.ptr!,
    encodeWide(title).ptr!,
    style,
    startX,
    startY,
    width,
    height,
    0n,
    0n,
    0n,
    null as unknown as Pointer,
  );
  if (!hwnd) {
    User32.UnregisterClassW(className.ptr!, 0n);
    wndProc.close();
    throw new Error('CreateWindowExW failed.');
  }

  // Mandatory visibility fix: WS_VISIBLE alone is not enough — a prior batch
  // shipped windows that opened hidden. Show, force topmost, then foreground.
  User32.ShowWindow(hwnd, ShowWindowCommand.SW_SHOW);
  User32.UpdateWindow(hwnd);
  User32.SetWindowPos(hwnd, 0xffffffffffffffffn /* HWND_TOPMOST */, 0, 0, 0, 0, 0x0043 /* SWP_NOMOVE|SWP_NOSIZE|SWP_SHOWWINDOW */);
  User32.SetForegroundWindow(hwnd);

  const msgBuffer = Buffer.alloc(48);
  const clientRect = Buffer.alloc(16);
  let destroyed = false;

  return {
    hwnd,
    wndProc,
    getMouse: () => ({ x: mouseX, y: mouseY, down: mouseDown, rightDown: mouseRightDown }),
    getWheel: () => {
      const d = wheelAccum;
      wheelAccum = 0;
      return d;
    },
    keyDown: (vk: number) => keys.has(vk),
    pump: () => {
      while (User32.PeekMessageW(msgBuffer.ptr!, 0n, 0, 0, PM_REMOVE) !== 0) {
        User32.TranslateMessage(msgBuffer.ptr!);
        User32.DispatchMessageW(msgBuffer.ptr!);
      }
    },
    shouldClose: () => closing || (User32.GetAsyncKeyState(VK_ESCAPE) & 0x8000) !== 0,
    clientSize: () => {
      User32.GetClientRect(hwnd, clientRect.ptr!);
      const w = Math.max(1, clientRect.readInt32LE(8) - clientRect.readInt32LE(0)) || width;
      const h = Math.max(1, clientRect.readInt32LE(12) - clientRect.readInt32LE(4)) || height;
      return { w, h };
    },
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      if (hwnd) User32.DestroyWindow(hwnd);
      User32.UnregisterClassW(className.ptr!, 0n);
      wndProc.close();
    },
  };
}

// ── Device + swap chain ────────────────────────────────────────────────────────
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

function tryCreateDeviceAndSwapChain(
  hwnd: bigint,
  w: number,
  h: number,
  driverType: D3D_DRIVER_TYPE,
): { swap: bigint; device: bigint; context: bigint } | null {
  const desc = buildSwapChainDesc(hwnd, w, h);
  const featureLevels = Buffer.alloc(4);
  featureLevels.writeUInt32LE(D3D_FEATURE_LEVEL_11_0, 0);
  const ppSwap = Buffer.alloc(8);
  const ppDevice = Buffer.alloc(8);
  const pFeatureLevel = Buffer.alloc(4);
  const ppContext = Buffer.alloc(8);
  const hr = D3d11.D3D11CreateDeviceAndSwapChain(
    null,
    driverType,
    0n,
    D3D11_CREATE_DEVICE_BGRA_SUPPORT,
    featureLevels.ptr!,
    1,
    D3D11_SDK_VERSION,
    desc.ptr!,
    ppSwap.ptr!,
    ppDevice.ptr!,
    pFeatureLevel.ptr!,
    ppContext.ptr!,
  );
  if (hr !== 0) return null;
  return { swap: ppSwap.readBigUInt64LE(0), device: ppDevice.readBigUInt64LE(0), context: ppContext.readBigUInt64LE(0) };
}

let activeGpu: Gpu | null = null;

/**
 * Create a hardware D3D11 device + DXGI swap chain on `hwnd` (WARP fallback). If
 * neither is available, prints a clear message and exits the process with code 0.
 * The returned Gpu becomes the engine's active target for all helper functions.
 */
export function createDevice(hwnd: bigint, size: { width: number; height: number }): Gpu {
  let created = tryCreateDeviceAndSwapChain(hwnd, size.width, size.height, D3D_DRIVER_TYPE.D3D_DRIVER_TYPE_HARDWARE);
  let driver: 'hardware' | 'WARP' = 'hardware';
  if (created === null) {
    created = tryCreateDeviceAndSwapChain(hwnd, size.width, size.height, D3D_DRIVER_TYPE.D3D_DRIVER_TYPE_WARP);
    driver = 'WARP';
  }
  if (created === null) {
    console.log('No D3D11 device available on this machine (HARDWARE and WARP both failed). Exiting.');
    process.exit(0);
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
export function createComputeDevice(): Gpu {
  const featureLevels = Buffer.alloc(4);
  featureLevels.writeUInt32LE(D3D_FEATURE_LEVEL_11_0, 0);

  function tryCreate(driverType: D3D_DRIVER_TYPE): { device: bigint; context: bigint } | null {
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
    if (hr !== 0) return null;
    return { device: ppDevice.readBigUInt64LE(0), context: ppContext.readBigUInt64LE(0) };
  }

  let created = tryCreate(D3D_DRIVER_TYPE.D3D_DRIVER_TYPE_HARDWARE);
  let driver: 'hardware' | 'WARP' = 'hardware';
  if (created === null) {
    created = tryCreate(D3D_DRIVER_TYPE.D3D_DRIVER_TYPE_WARP);
    driver = 'WARP';
  }
  if (created === null) {
    console.log('No D3D11 device available on this machine (HARDWARE and WARP both failed). Exiting.');
    process.exit(0);
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

function requireGpu(): Gpu {
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

// ── HLSL compilation ────────────────────────────────────────────────────────────
/** A compiled DXBC blob: a pointer/size view into the blob plus the blob handle. */
export interface CompiledShader {
  ptr: bigint;
  size: number;
  blob: bigint;
}

/** Compile HLSL `source` (`entry`, e.g. "main"; `target`, e.g. "ps_5_0"). Throws with the compiler error text on failure. */
export function compile(source: string, entry: string, target: string): CompiledShader {
  const src = encodeAscii(source);
  const entryBuf = encodeAscii(entry);
  const targetBuf = encodeAscii(target);
  const ppCode = Buffer.alloc(8);
  const ppErr = Buffer.alloc(8);
  const hr = D3dcompiler_47.D3DCompile(
    src.ptr!,
    BigInt(src.byteLength - 1),
    null,
    null,
    null,
    entryBuf.ptr!,
    targetBuf.ptr!,
    D3DCOMPILE_ENABLE_STRICTNESS | D3DCOMPILE_OPTIMIZATION_LEVEL3,
    0,
    ppCode.ptr!,
    ppErr.ptr!,
  );
  if (hr !== 0) {
    const errPtr = ppErr.readBigUInt64LE(0);
    const msg = errPtr !== 0n ? blobAsString(errPtr) : '(no error blob)';
    blobRelease(errPtr);
    throw new Error(`D3DCompile(${target}) failed ${hex(hr)}:\n${msg}`);
  }
  const blob = ppCode.readBigUInt64LE(0);
  return { blob, ptr: blobBufferPointer(blob), size: Number(blobBufferSize(blob)) };
}

/** Compile a vertex shader and create the ID3D11VertexShader. Returns the shader handle. */
export function makeVertexShader(code: CompiledShader): bigint {
  const { device } = requireGpu();
  const pp = Buffer.alloc(8);
  if (vcall(device, DEV_CREATE_VERTEX_SHADER, [FFIType.u64, FFIType.u64, FFIType.u64, FFIType.ptr], [code.ptr, BigInt(code.size), 0n, pp.ptr!]) !== 0) {
    throw new Error('CreateVertexShader failed.');
  }
  return pp.readBigUInt64LE(0);
}

/** Compile a pixel shader and create the ID3D11PixelShader. Returns the shader handle. */
export function makePixelShader(code: CompiledShader): bigint {
  const { device } = requireGpu();
  const pp = Buffer.alloc(8);
  if (vcall(device, DEV_CREATE_PIXEL_SHADER, [FFIType.u64, FFIType.u64, FFIType.u64, FFIType.ptr], [code.ptr, BigInt(code.size), 0n, pp.ptr!]) !== 0) {
    throw new Error('CreatePixelShader failed.');
  }
  return pp.readBigUInt64LE(0);
}

/** Compile a compute shader and create the ID3D11ComputeShader. Returns the shader handle. */
export function makeComputeShader(code: CompiledShader): bigint {
  const { device } = requireGpu();
  const pp = Buffer.alloc(8);
  if (vcall(device, DEV_CREATE_COMPUTE_SHADER, [FFIType.u64, FFIType.u64, FFIType.u64, FFIType.ptr], [code.ptr, BigInt(code.size), 0n, pp.ptr!]) !== 0) {
    throw new Error('CreateComputeShader failed.');
  }
  return pp.readBigUInt64LE(0);
}

// ── Buffers ────────────────────────────────────────────────────────────────────
/** Create a DEFAULT-usage constant buffer of `byteSize` bytes (rounded up to 16). */
export function makeConstantBuffer(byteSize: number): bigint {
  const { device } = requireGpu();
  const size = Math.ceil(byteSize / 16) * 16;
  const desc = Buffer.alloc(24);
  desc.writeUInt32LE(size, 0); // ByteWidth
  desc.writeUInt32LE(D3D11_USAGE_DEFAULT, 4); // Usage
  desc.writeUInt32LE(D3D11_BIND_CONSTANT_BUFFER, 8); // BindFlags
  desc.writeUInt32LE(0, 12); // CPUAccessFlags
  desc.writeUInt32LE(0, 16); // MiscFlags
  desc.writeUInt32LE(0, 20); // StructureByteStride
  const pp = Buffer.alloc(8);
  if (vcall(device, DEV_CREATE_BUFFER, [FFIType.ptr, FFIType.ptr, FFIType.ptr], [desc.ptr!, null, pp.ptr!]) !== 0) {
    throw new Error('CreateBuffer (constant buffer) failed.');
  }
  return pp.readBigUInt64LE(0);
}

/** Upload `data` into a DEFAULT-usage constant buffer via UpdateSubresource. */
export function updateConstantBuffer(buffer: bigint, data: Buffer): void {
  const { context } = requireGpu();
  vcall(
    context,
    CTX_UPDATE_SUBRESOURCE,
    [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32],
    [buffer, 0, null, data.ptr!, 0, 0],
    FFIType.void,
  );
}

/** Result of {@link makeStructuredBuffer}: the buffer plus optional UAV/SRV views. */
export interface StructuredBuffer {
  buffer: bigint;
  uav?: bigint;
  srv?: bigint;
}

export interface StructuredBufferOptions {
  stride: number;
  count: number;
  uav?: boolean;
  srv?: boolean;
  cpuWritable?: boolean;
  initialData?: Buffer;
}

/**
 * Create a STRUCTURED buffer (MiscFlags STRUCTURED) of `count` × `stride` bytes,
 * optionally with a UAV (RWStructuredBuffer) and/or SRV (StructuredBuffer<>).
 */
export function makeStructuredBuffer(options: StructuredBufferOptions): StructuredBuffer {
  const { device } = requireGpu();
  const { stride, count, uav = false, srv = false, cpuWritable = false, initialData } = options;
  const byteWidth = stride * count;

  let bindFlags = 0;
  if (uav) bindFlags |= D3D11_BIND_UNORDERED_ACCESS;
  if (srv) bindFlags |= D3D11_BIND_SHADER_RESOURCE;
  if (bindFlags === 0) bindFlags = D3D11_BIND_SHADER_RESOURCE;

  const desc = Buffer.alloc(24);
  desc.writeUInt32LE(byteWidth, 0); // ByteWidth
  desc.writeUInt32LE(cpuWritable ? D3D11_USAGE_DYNAMIC : D3D11_USAGE_DEFAULT, 4); // Usage
  desc.writeUInt32LE(bindFlags, 8); // BindFlags
  desc.writeUInt32LE(cpuWritable ? D3D11_CPU_ACCESS_WRITE : 0, 12); // CPUAccessFlags
  desc.writeUInt32LE(D3D11_RESOURCE_MISC_BUFFER_STRUCTURED, 16); // MiscFlags
  desc.writeUInt32LE(stride, 20); // StructureByteStride

  // D3D11_SUBRESOURCE_DATA { pSysMem, SysMemPitch, SysMemSlicePitch } — 16 bytes.
  let initBuf: Buffer | null = null;
  if (initialData !== undefined) {
    initBuf = Buffer.alloc(16);
    initBuf.writeBigUInt64LE(BigInt(initialData.ptr!), 0);
  }
  const pp = Buffer.alloc(8);
  if (vcall(device, DEV_CREATE_BUFFER, [FFIType.ptr, FFIType.ptr, FFIType.ptr], [desc.ptr!, initBuf === null ? null : initBuf.ptr!, pp.ptr!]) !== 0) {
    throw new Error('CreateBuffer (structured buffer) failed.');
  }
  const buffer = pp.readBigUInt64LE(0);

  const result: StructuredBuffer = { buffer };

  if (uav) {
    // D3D11_UNORDERED_ACCESS_VIEW_DESC: Format u32@0, ViewDimension u32@4, Buffer{FirstElement@8, NumElements@12, Flags@16}.
    const uavDesc = Buffer.alloc(28);
    uavDesc.writeUInt32LE(DXGI_FORMAT_UNKNOWN, 0);
    uavDesc.writeUInt32LE(D3D11_UAV_DIMENSION_BUFFER, 4);
    uavDesc.writeUInt32LE(0, 8); // FirstElement
    uavDesc.writeUInt32LE(count, 12); // NumElements
    uavDesc.writeUInt32LE(0, 16); // Flags
    const ppUav = Buffer.alloc(8);
    if (vcall(device, DEV_CREATE_UNORDERED_ACCESS_VIEW, [FFIType.u64, FFIType.ptr, FFIType.ptr], [buffer, uavDesc.ptr!, ppUav.ptr!]) !== 0) {
      throw new Error('CreateUnorderedAccessView (structured buffer) failed.');
    }
    result.uav = ppUav.readBigUInt64LE(0);
  }

  if (srv) {
    // D3D11_SHADER_RESOURCE_VIEW_DESC: Format u32@0, ViewDimension u32@4, Buffer{FirstElement@8, NumElements@12}.
    const srvDesc = Buffer.alloc(28);
    srvDesc.writeUInt32LE(DXGI_FORMAT_UNKNOWN, 0);
    srvDesc.writeUInt32LE(D3D11_SRV_DIMENSION_BUFFER, 4);
    srvDesc.writeUInt32LE(0, 8); // FirstElement
    srvDesc.writeUInt32LE(count, 12); // NumElements
    const ppSrv = Buffer.alloc(8);
    if (vcall(device, DEV_CREATE_SHADER_RESOURCE_VIEW, [FFIType.u64, FFIType.ptr, FFIType.ptr], [buffer, srvDesc.ptr!, ppSrv.ptr!]) !== 0) {
      throw new Error('CreateShaderResourceView (structured buffer) failed.');
    }
    result.srv = ppSrv.readBigUInt64LE(0);
  }

  return result;
}

// ── Textures ──────────────────────────────────────────────────────────────────
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
  if (vcall(device, DEV_CREATE_TEXTURE_2D, [FFIType.ptr, FFIType.ptr, FFIType.ptr], [desc.ptr!, null, pp.ptr!]) !== 0) {
    throw new Error('CreateTexture2D failed.');
  }
  const tex = pp.readBigUInt64LE(0);
  const result: TextureResult = { tex };
  if (staging) return result;

  if (rtv) {
    const ppRtv = Buffer.alloc(8);
    if (vcall(device, DEV_CREATE_RENDER_TARGET_VIEW, [FFIType.u64, FFIType.ptr, FFIType.ptr], [tex, null, ppRtv.ptr!]) !== 0) {
      throw new Error('CreateRenderTargetView (texture) failed.');
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
    if (vcall(device, DEV_CREATE_SHADER_RESOURCE_VIEW, [FFIType.u64, FFIType.ptr, FFIType.ptr], [tex, srvDesc.ptr!, ppSrv.ptr!]) !== 0) {
      throw new Error('CreateShaderResourceView (texture) failed.');
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
    if (vcall(device, DEV_CREATE_UNORDERED_ACCESS_VIEW, [FFIType.u64, FFIType.ptr, FFIType.ptr], [tex, uavDesc.ptr!, ppUav.ptr!]) !== 0) {
      throw new Error('CreateUnorderedAccessView (texture) failed.');
    }
    result.uav = ppUav.readBigUInt64LE(0);
  }
  return result;
}

export interface SamplerOptions {
  /** D3D11_FILTER value; defaults to MIN_MAG_MIP_LINEAR. */
  filter?: number;
  /** D3D11_TEXTURE_ADDRESS_MODE for U/V/W; defaults to CLAMP. */
  address?: number;
}

/** Create an ID3D11SamplerState. */
export function makeSampler(options: SamplerOptions = {}): bigint {
  const { device } = requireGpu();
  const { filter = D3D11_FILTER_MIN_MAG_MIP_LINEAR, address = D3D11_TEXTURE_ADDRESS_CLAMP } = options;
  // D3D11_SAMPLER_DESC: Filter@0 AddressU@4 AddressV@8 AddressW@12 MipLODBias@16
  // MaxAnisotropy@20 ComparisonFunc@24 BorderColor[4]@28 MinLOD@44 MaxLOD@48. (52 bytes)
  const desc = Buffer.alloc(52);
  desc.writeUInt32LE(filter, 0);
  desc.writeUInt32LE(address, 4);
  desc.writeUInt32LE(address, 8);
  desc.writeUInt32LE(address, 12);
  desc.writeFloatLE(0, 16); // MipLODBias
  desc.writeUInt32LE(1, 20); // MaxAnisotropy
  desc.writeUInt32LE(0, 24); // ComparisonFunc (NEVER)
  desc.writeFloatLE(0, 28); // BorderColor
  desc.writeFloatLE(0, 32);
  desc.writeFloatLE(0, 36);
  desc.writeFloatLE(0, 40);
  desc.writeFloatLE(-3.4e38, 44); // MinLOD
  desc.writeFloatLE(3.4e38, 48); // MaxLOD
  const pp = Buffer.alloc(8);
  if (vcall(device, DEV_CREATE_SAMPLER_STATE, [FFIType.ptr, FFIType.ptr], [desc.ptr!, pp.ptr!]) !== 0) {
    throw new Error('CreateSamplerState failed.');
  }
  return pp.readBigUInt64LE(0);
}

// ── Binding / exec helpers ──────────────────────────────────────────────────────
/** Bind render targets (OMSetRenderTargets). Pass [] to unbind. */
export function setRenderTargets(rtvs: readonly bigint[]): void {
  const { context } = requireGpu();
  if (rtvs.length === 0) {
    vcall(context, CTX_OM_SET_RENDER_TARGETS, [FFIType.u32, FFIType.ptr, FFIType.u64], [0, null, 0n], FFIType.void);
    return;
  }
  const arr = Buffer.alloc(8 * rtvs.length);
  rtvs.forEach((r, i) => arr.writeBigUInt64LE(r, i * 8));
  vcall(context, CTX_OM_SET_RENDER_TARGETS, [FFIType.u32, FFIType.ptr, FFIType.u64], [rtvs.length, arr.ptr!, 0n], FFIType.void);
}

/** Set a single full-size viewport (RSSetViewports). */
export function setViewport(w: number, h: number): void {
  const { context } = requireGpu();
  const vp = Buffer.alloc(24); // 6 floats
  vp.writeFloatLE(0, 0);
  vp.writeFloatLE(0, 4);
  vp.writeFloatLE(w, 8);
  vp.writeFloatLE(h, 12);
  vp.writeFloatLE(0, 16);
  vp.writeFloatLE(1, 20);
  vcall(context, CTX_RS_SET_VIEWPORTS, [FFIType.u32, FFIType.ptr], [1, vp.ptr!], FFIType.void);
}

/** Clear a render-target view to the given RGBA color. */
export function clear(rtv: bigint, color: readonly [number, number, number, number]): void {
  const { context } = requireGpu();
  const c = Buffer.alloc(16);
  c.writeFloatLE(color[0], 0);
  c.writeFloatLE(color[1], 4);
  c.writeFloatLE(color[2], 8);
  c.writeFloatLE(color[3], 12);
  vcall(context, CTX_CLEAR_RENDER_TARGET_VIEW, [FFIType.u64, FFIType.ptr], [rtv, c.ptr!], FFIType.void);
}

/** Draw a single full-screen triangle (3 verts, SV_VertexID, no IA buffers). */
export function drawFullscreenTriangle(): void {
  const { context } = requireGpu();
  vcall(context, CTX_IA_SET_PRIMITIVE_TOPOLOGY, [FFIType.u32], [D3D11_PRIMITIVE_TOPOLOGY_TRIANGLELIST], FFIType.void);
  vcall(context, CTX_DRAW, [FFIType.u32, FFIType.u32], [3, 0], FFIType.void);
}

/** Draw `count` point primitives (POINTLIST topology, no IA buffers — the VS fetches from a bound SRV via SV_VertexID). */
export function drawPoints(count: number): void {
  const { context } = requireGpu();
  vcall(context, CTX_IA_SET_PRIMITIVE_TOPOLOGY, [FFIType.u32], [D3D11_PRIMITIVE_TOPOLOGY_POINTLIST], FFIType.void);
  vcall(context, CTX_DRAW, [FFIType.u32, FFIType.u32], [count, 0], FFIType.void);
}

/** Bind shader-resource views to the vertex shader (VSSetShaderResources). */
export function vsSetShaderResources(srvs: readonly bigint[], startSlot = 0): void {
  const { context } = requireGpu();
  const arr = Buffer.alloc(8 * srvs.length);
  srvs.forEach((s, i) => arr.writeBigUInt64LE(s, i * 8));
  vcall(context, CTX_VS_SET_SHADER_RESOURCES, [FFIType.u32, FFIType.u32, FFIType.ptr], [startSlot, srvs.length, arr.ptr!], FFIType.void);
}

/**
 * Create an additive blend state (ID3D11Device::CreateBlendState, slot 20). With
 * `premultiplied` false the blend is SRC_ALPHA·src + ONE·dst; with it true the
 * blend is ONE·src + ONE·dst (pure additive). RGB and alpha both add.
 */
export function makeAdditiveBlendState(premultiplied = true): bigint {
  const { device } = requireGpu();
  // D3D11_BLEND_DESC: AlphaToCoverageEnable BOOL@0, IndependentBlendEnable BOOL@4,
  // then RenderTarget[8] of D3D11_RENDER_TARGET_BLEND_DESC (8 × u32 each = 32 bytes).
  // RT desc: BlendEnable@0, SrcBlend@4, DestBlend@8, BlendOp@12, SrcBlendAlpha@16,
  //          DestBlendAlpha@20, BlendOpAlpha@24, RenderTargetWriteMask@28.
  const D3D11_BLEND_ONE = 2;
  const D3D11_BLEND_SRC_ALPHA = 5;
  const D3D11_BLEND_OP_ADD = 1;
  const desc = Buffer.alloc(8 + 32 * 8);
  desc.writeUInt32LE(0, 0); // AlphaToCoverageEnable
  desc.writeUInt32LE(0, 4); // IndependentBlendEnable
  const rt = 8; // RenderTarget[0]
  desc.writeUInt32LE(1, rt + 0); // BlendEnable
  desc.writeUInt32LE(premultiplied ? D3D11_BLEND_ONE : D3D11_BLEND_SRC_ALPHA, rt + 4); // SrcBlend
  desc.writeUInt32LE(D3D11_BLEND_ONE, rt + 8); // DestBlend
  desc.writeUInt32LE(D3D11_BLEND_OP_ADD, rt + 12); // BlendOp
  desc.writeUInt32LE(D3D11_BLEND_ONE, rt + 16); // SrcBlendAlpha
  desc.writeUInt32LE(D3D11_BLEND_ONE, rt + 20); // DestBlendAlpha
  desc.writeUInt32LE(D3D11_BLEND_OP_ADD, rt + 24); // BlendOpAlpha
  desc.writeUInt32LE(0x0f, rt + 28); // RenderTargetWriteMask = ALL
  const pp = Buffer.alloc(8);
  if (vcall(device, DEV_CREATE_BLEND_STATE, [FFIType.ptr, FFIType.ptr], [desc.ptr!, pp.ptr!]) !== 0) {
    throw new Error('CreateBlendState failed.');
  }
  return pp.readBigUInt64LE(0);
}

/** Bind a blend state (OMSetBlendState, slot 35). Pass 0n to restore the default opaque blend. */
export function setBlendState(blendState: bigint, blendFactor: readonly [number, number, number, number] = [0, 0, 0, 0], sampleMask = 0xffffffff): void {
  const { context } = requireGpu();
  const factor = Buffer.alloc(16);
  factor.writeFloatLE(blendFactor[0], 0);
  factor.writeFloatLE(blendFactor[1], 4);
  factor.writeFloatLE(blendFactor[2], 8);
  factor.writeFloatLE(blendFactor[3], 12);
  vcall(context, CTX_OM_SET_BLEND_STATE, [FFIType.u64, FFIType.ptr, FFIType.u32], [blendState, blendState === 0n ? null : factor.ptr!, sampleMask], FFIType.void);
}

/** Bind the vertex shader and its constant buffers (VSSetShader + VSSetConstantBuffers via PSSet path is separate). */
export function vsSet(shader: bigint, cbs: readonly bigint[] = []): void {
  const { context } = requireGpu();
  vcall(context, CTX_VS_SET_SHADER, [FFIType.u64, FFIType.ptr, FFIType.u32], [shader, null, 0], FFIType.void);
  if (cbs.length > 0) {
    const arr = Buffer.alloc(8 * cbs.length);
    cbs.forEach((c, i) => arr.writeBigUInt64LE(c, i * 8));
    // VSSetConstantBuffers is slot 7; bind to register b0..bN.
    vcall(context, 7, [FFIType.u32, FFIType.u32, FFIType.ptr], [0, cbs.length, arr.ptr!], FFIType.void);
  }
}

export interface PsBindings {
  cb?: readonly bigint[];
  srv?: readonly bigint[];
  samp?: readonly bigint[];
}

/** Bind the pixel shader plus optional constant buffers, SRVs, and samplers. */
export function psSet(shader: bigint, bindings: PsBindings = {}): void {
  const { context } = requireGpu();
  vcall(context, CTX_PS_SET_SHADER, [FFIType.u64, FFIType.ptr, FFIType.u32], [shader, null, 0], FFIType.void);
  if (bindings.cb && bindings.cb.length > 0) {
    const arr = Buffer.alloc(8 * bindings.cb.length);
    bindings.cb.forEach((c, i) => arr.writeBigUInt64LE(c, i * 8));
    vcall(context, CTX_PS_SET_CONSTANT_BUFFERS, [FFIType.u32, FFIType.u32, FFIType.ptr], [0, bindings.cb.length, arr.ptr!], FFIType.void);
  }
  if (bindings.srv && bindings.srv.length > 0) {
    const arr = Buffer.alloc(8 * bindings.srv.length);
    bindings.srv.forEach((s, i) => arr.writeBigUInt64LE(s, i * 8));
    vcall(context, CTX_PS_SET_SHADER_RESOURCES, [FFIType.u32, FFIType.u32, FFIType.ptr], [0, bindings.srv.length, arr.ptr!], FFIType.void);
  }
  if (bindings.samp && bindings.samp.length > 0) {
    const arr = Buffer.alloc(8 * bindings.samp.length);
    bindings.samp.forEach((s, i) => arr.writeBigUInt64LE(s, i * 8));
    vcall(context, CTX_PS_SET_SAMPLERS, [FFIType.u32, FFIType.u32, FFIType.ptr], [0, bindings.samp.length, arr.ptr!], FFIType.void);
  }
}

export interface CsBindings {
  cb?: readonly bigint[];
  uav?: readonly bigint[];
  srv?: readonly bigint[];
}

/** Bind the compute shader plus optional constant buffers, UAVs, and SRVs. */
export function csSet(shader: bigint, bindings: CsBindings = {}): void {
  const { context } = requireGpu();
  vcall(context, CTX_CS_SET_SHADER, [FFIType.u64, FFIType.ptr, FFIType.u32], [shader, null, 0], FFIType.void);
  if (bindings.cb && bindings.cb.length > 0) {
    const arr = Buffer.alloc(8 * bindings.cb.length);
    bindings.cb.forEach((c, i) => arr.writeBigUInt64LE(c, i * 8));
    vcall(context, CTX_CS_SET_CONSTANT_BUFFERS, [FFIType.u32, FFIType.u32, FFIType.ptr], [0, bindings.cb.length, arr.ptr!], FFIType.void);
  }
  if (bindings.uav && bindings.uav.length > 0) {
    const arr = Buffer.alloc(8 * bindings.uav.length);
    bindings.uav.forEach((u, i) => arr.writeBigUInt64LE(u, i * 8));
    // CSSetUnorderedAccessViews: StartSlot, NumUAVs, ppUAVs, pUAVInitialCounts.
    vcall(
      context,
      CTX_CS_SET_UNORDERED_ACCESS_VIEWS,
      [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr],
      [0, bindings.uav.length, arr.ptr!, null],
      FFIType.void,
    );
  }
  if (bindings.srv && bindings.srv.length > 0) {
    const arr = Buffer.alloc(8 * bindings.srv.length);
    bindings.srv.forEach((s, i) => arr.writeBigUInt64LE(s, i * 8));
    vcall(context, CTX_CS_SET_SHADER_RESOURCES, [FFIType.u32, FFIType.u32, FFIType.ptr], [0, bindings.srv.length, arr.ptr!], FFIType.void);
  }
}

/** Dispatch a compute workload of the given thread-group counts. */
export function dispatch(x: number, y = 1, z = 1): void {
  const { context } = requireGpu();
  vcall(context, CTX_DISPATCH, [FFIType.u32, FFIType.u32, FFIType.u32], [x, y, z], FFIType.void);
}

/** Copy an entire resource (CopyResource). */
export function copyResource(dst: bigint, src: bigint): void {
  const { context } = requireGpu();
  vcall(context, CTX_COPY_RESOURCE, [FFIType.u64, FFIType.u64], [dst, src], FFIType.void);
}

/** Generate mip levels for a SRV-bound texture (texture must have GENERATE_MIPS misc + a SRV). */
export function generateMips(srv: bigint): void {
  const { context } = requireGpu();
  vcall(context, CTX_GENERATE_MIPS, [FFIType.u64], [srv], FFIType.void);
}

/**
 * Read back a GPU buffer to host memory: create a STAGING copy, CopyResource into
 * it, Map READ, copy `byteSize` bytes, Unmap. Returns a detached ArrayBuffer.
 */
export function readbackBuffer(buffer: bigint, byteSize: number): ArrayBuffer {
  const { device, context } = requireGpu();
  // Staging buffer: same ByteWidth, USAGE_STAGING, CPU_ACCESS_READ, no bind flags.
  const desc = Buffer.alloc(24);
  desc.writeUInt32LE(byteSize, 0);
  desc.writeUInt32LE(D3D11_USAGE_STAGING, 4);
  desc.writeUInt32LE(0, 8); // BindFlags
  desc.writeUInt32LE(D3D11_CPU_ACCESS_READ, 12);
  desc.writeUInt32LE(0, 16); // MiscFlags
  desc.writeUInt32LE(0, 20); // StructureByteStride
  const pp = Buffer.alloc(8);
  if (vcall(device, DEV_CREATE_BUFFER, [FFIType.ptr, FFIType.ptr, FFIType.ptr], [desc.ptr!, null, pp.ptr!]) !== 0) {
    throw new Error('CreateBuffer (readback staging) failed.');
  }
  const staging = pp.readBigUInt64LE(0);

  vcall(context, CTX_COPY_RESOURCE, [FFIType.u64, FFIType.u64], [staging, buffer], FFIType.void);

  const mapped = Buffer.alloc(16); // pData@0, RowPitch u32@8, DepthPitch u32@12
  const hr = vcall(context, CTX_MAP, [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], [staging, 0, D3D11_MAP_READ, 0, mapped.ptr!]);
  if (hr !== 0) {
    comRelease(staging);
    throw new Error(`ID3D11DeviceContext::Map (readback) failed ${hex(hr)}.`);
  }
  const dataPtr = mapped.readBigUInt64LE(0);
  const out = new Uint8Array(byteSize);
  for (let i = 0; i < byteSize; i += 1) out[i] = read.u8(Number(dataPtr) as Pointer, i);
  vcall(context, CTX_UNMAP, [FFIType.u64, FFIType.u32], [staging, 0], FFIType.void);
  comRelease(staging);
  return out.buffer;
}

/** Upload `data` into a DYNAMIC (cpuWritable) buffer via Map WRITE_DISCARD. */
export function updateDynamicBuffer(buffer: bigint, data: Buffer): void {
  const { context } = requireGpu();
  const mapped = Buffer.alloc(16); // pData@0, RowPitch u32@8, DepthPitch u32@12
  const hr = vcall(context, CTX_MAP, [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], [buffer, 0, D3D11_MAP_WRITE_DISCARD, 0, mapped.ptr!]);
  if (hr !== 0) throw new Error(`Map (WRITE_DISCARD) failed ${hex(hr)}.`);
  const dataPtr = Number(mapped.readBigUInt64LE(0)) as Pointer;
  new Uint8Array(toArrayBuffer(dataPtr, 0, data.byteLength)).set(data);
  vcall(context, CTX_UNMAP, [FFIType.u64, FFIType.u32], [buffer, 0], FFIType.void);
}

// ──────────────────────────────────────────────────────────────────────────────
// Self-test — only runs under GPU_SELFTEST=1 (importing the module is a no-op).
// ──────────────────────────────────────────────────────────────────────────────
async function selfTest(): Promise<void> {
  const results: { name: string; pass: boolean; detail: string }[] = [];

  // ── Test A: COMPUTE — RWStructuredBuffer<uint> out; out[id] = id*2+1 ──────────
  {
    const gpu = createComputeDevice();
    const N = 256;
    const csCode = compile(
      `RWStructuredBuffer<uint> Out : register(u0);
       [numthreads(64,1,1)]
       void main(uint3 id : SV_DispatchThreadID) { Out[id.x] = id.x * 2 + 1; }`,
      'main',
      'cs_5_0',
    );
    const cs = makeComputeShader(csCode);
    const sb = makeStructuredBuffer({ stride: 4, count: N, uav: true });
    csSet(cs, { uav: [sb.uav!] });
    dispatch(N / 64, 1, 1);
    const ab = readbackBuffer(sb.buffer, N * 4);
    const view = new Uint32Array(ab);
    let ok = true;
    let firstBad = -1;
    for (let i = 0; i < N; i += 1) {
      if (view[i] !== i * 2 + 1) {
        ok = false;
        firstBad = i;
        break;
      }
    }
    const sample = [view[0], view[1], view[2], view[255]].join(', ');
    results.push({
      name: 'A COMPUTE (RWStructuredBuffer + Dispatch + readback)',
      pass: ok,
      detail: ok ? `out[0..2,255] = [${sample}] (expected 1, 3, 5, 511) — all ${N} verified` : `mismatch at i=${firstBad}: got ${view[firstBad]}, expected ${firstBad * 2 + 1}`,
    });

    comRelease(sb.uav!);
    comRelease(sb.buffer);
    comRelease(cs);
    blobRelease(csCode.blob);
    comRelease(gpu.context);
    comRelease(gpu.device);
    activeGpu = null;
  }

  // ── Tests B + C: RENDER + TEXTURE PING-PONG (need a window + swap chain) ──────
  {
    const W = 960;
    const H = 540;
    const win = createWindow({ title: 'GPU engine self-test', width: W, height: H, borderless: true });
    const { w: cw, h: ch } = win.clientSize();
    const gpu = createDevice(win.hwnd, { width: cw, height: ch });

    const vsCode = compile(
      `struct VSOut { float4 pos : SV_Position; float2 uv : TEXCOORD0; };
       VSOut main(uint vid : SV_VertexID) {
         VSOut o; float2 p = float2((vid << 1) & 2, vid & 2);
         o.uv = p; o.pos = float4(p * float2(2,-2) + float2(-1,1), 0, 1); return o; }`,
      'main',
      'vs_5_0',
    );
    const vs = makeVertexShader(vsCode);

    // ── Test C first: render a source texture, then sample it through a SRV ──────
    // Pass 1: write an animated checker/gradient into a render-target texture.
    const srcTex = makeTexture({ w: cw, h: ch, format: DXGI_FORMAT_R8G8B8A8_UNORM, rtv: true, srv: true });
    const cbWrite = makeConstantBuffer(16);
    const psWriteCode = compile(
      `cbuffer C : register(b0) { float2 iRes; float iTime; float pad; };
       float4 main(float4 fp : SV_Position, float2 uv : TEXCOORD0) : SV_Target {
         float2 g = uv;
         float c = step(0.5, frac(g.x * 8 + iTime)) * step(0.5, frac(g.y * 8));
         return float4(g.x, g.y, c, 1); }`,
      'main',
      'ps_5_0',
    );
    const psWrite = makePixelShader(psWriteCode);

    // Pass 2: sample srcTex via SRV+sampler, tint, and present to the back buffer.
    const samp = makeSampler({ filter: D3D11_FILTER_MIN_MAG_MIP_LINEAR, address: D3D11_TEXTURE_ADDRESS_CLAMP });
    const cbView = makeConstantBuffer(16);
    const psViewCode = compile(
      `cbuffer C : register(b0) { float2 iRes; float iTime; float pad; };
       Texture2D Src : register(t0); SamplerState Smp : register(s0);
       float4 main(float4 fp : SV_Position, float2 uv : TEXCOORD0) : SV_Target {
         float2 w = uv + 0.02 * sin(uv.yx * 12 + iTime * 2);
         float4 s = Src.Sample(Smp, w);
         return float4(s.rgb * float3(1.0, 0.85, 0.7) + 0.05, 1); }`,
      'main',
      'ps_5_0',
    );
    const psView = makePixelShader(psViewCode);

    const cbBuf = Buffer.alloc(16);
    const start = performance.now();
    const durationMs = process.env.DEMO_DURATION_MS ? Number(process.env.DEMO_DURATION_MS) : 1500;
    let frames = 0;
    let cTextureOk = false;

    while (!win.shouldClose()) {
      win.pump();
      if (win.shouldClose()) break;
      const now = performance.now();
      const t = (now - start) / 1000;

      cbBuf.writeFloatLE(cw, 0);
      cbBuf.writeFloatLE(ch, 4);
      cbBuf.writeFloatLE(t, 8);
      cbBuf.writeFloatLE(0, 12);

      // Pass 1 → render into srcTex.
      updateConstantBuffer(cbWrite, cbBuf);
      setRenderTargets([srcTex.rtv!]);
      setViewport(cw, ch);
      clear(srcTex.rtv!, [0, 0, 0, 1]);
      vsSet(vs);
      psSet(psWrite, { cb: [cbWrite] });
      drawFullscreenTriangle();

      // Unbind the texture as a render target before binding it as a SRV.
      setRenderTargets([]);

      // Pass 2 → sample srcTex into the back buffer.
      updateConstantBuffer(cbView, cbBuf);
      setRenderTargets([gpu.backBufferRTV]);
      setViewport(cw, ch);
      clear(gpu.backBufferRTV, [0.02, 0.02, 0.04, 1]);
      vsSet(vs);
      psSet(psView, { cb: [cbView], srv: [srcTex.srv!], samp: [samp] });
      drawFullscreenTriangle();

      gpu.present(false);
      frames += 1;
      cTextureOk = true; // survived a full RTV→texture→SRV→sampler→present cycle

      if (durationMs > 0 && now - start >= durationMs) break;
    }

    // Read back one pixel of the source texture to prove pass 1 actually drew.
    const stagingTex = makeTexture({ w: cw, h: ch, staging: true });
    copyResource(stagingTex.tex, srcTex.tex);
    const mapped = Buffer.alloc(16);
    let texPixelOk = false;
    if (vcall(gpu.context, CTX_MAP, [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], [stagingTex.tex, 0, D3D11_MAP_READ, 0, mapped.ptr!]) === 0) {
      const dataPtr = Number(mapped.readBigUInt64LE(0)) as Pointer;
      // Sample a pixel that the gradient makes clearly non-zero (bottom-right region).
      const px = Math.floor(cw * 0.75);
      const py = Math.floor(ch * 0.75);
      const rowPitch = mapped.readUInt32LE(8);
      const r = read.u8(dataPtr, py * rowPitch + px * 4 + 0);
      const g = read.u8(dataPtr, py * rowPitch + px * 4 + 1);
      texPixelOk = r > 0 || g > 0;
      vcall(gpu.context, CTX_UNMAP, [FFIType.u64, FFIType.u32], [stagingTex.tex, 0], FFIType.void);
    }

    results.push({
      name: 'B RENDER (animated fullscreen PS, swap-chain present)',
      pass: frames > 0,
      detail: `presented ${frames} frames over ${((performance.now() - start) / 1000).toFixed(2)}s on ${gpu.driver} (${gpu.gpuName})`,
    });
    results.push({
      name: 'C TEXTURE PING-PONG (RTV→texture, SRV+sampler sample, present)',
      pass: cTextureOk && texPixelOk,
      detail: cTextureOk ? (texPixelOk ? 'rendered to texture then sampled via SRV+sampler; readback of source pixel is non-zero' : 'cycle ran but source-texture readback pixel was zero') : 'no frame completed',
    });

    // Teardown.
    comRelease(stagingTex.tex);
    comRelease(samp);
    comRelease(cbView);
    comRelease(cbWrite);
    comRelease(psView);
    comRelease(psWrite);
    comRelease(srcTex.srv!);
    comRelease(srcTex.rtv!);
    comRelease(srcTex.tex);
    comRelease(vs);
    blobRelease(psViewCode.blob);
    blobRelease(psWriteCode.blob);
    blobRelease(vsCode.blob);
    comRelease(gpu.backBufferRTV);
    comRelease(gpu.swapChain);
    comRelease(gpu.context);
    comRelease(gpu.device);
    win.destroy();
    activeGpu = null;
  }

  console.log('\n── GPU engine self-test ──');
  let allPass = true;
  for (const r of results) {
    console.log(`  ${r.pass ? 'PASS' : 'FAIL'}  ${r.name}\n        ${r.detail}`);
    if (!r.pass) allPass = false;
  }
  console.log(allPass ? '\nAll self-tests PASSED.' : '\nSome self-tests FAILED.');
  process.exit(allPass ? 0 : 1);
}

if (import.meta.main || process.env.GPU_SELFTEST === '1') {
  await selfTest();
}
