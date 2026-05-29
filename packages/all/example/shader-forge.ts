/**
 * Shader Forge — compile an HLSL ray-marcher at runtime and run it on your real GPU, from TypeScript.
 *
 * A borderless 1280x720 window fills with a living, breathing ray-marched scene: a glowing
 * rounded-box fractal floating in a hazy palette-cycling void, lit with a soft key light and
 * cheap soft shadows, fog that fades to a warm horizon, and a vignette that pulses with time.
 * Drag the mouse and the camera leans toward the cursor. None of this is precomputed — at
 * startup the program hands raw HLSL **source** to `d3dcompiler_47!D3DCompile`, which JITs it
 * to DXBC bytecode; that bytecode is uploaded straight into a real hardware `ID3D11Device`,
 * and every frame the GPU executes the shader over a single full-screen triangle, fed time +
 * resolution + mouse through a constant buffer and Present()ed via the DXGI swap chain. A GDI
 * HUD overlays "HLSL compiled at runtime · <ms> · <fps> fps · <GPU name>".
 *
 * Pipeline (each step):
 *   1. User32 RegisterClassExW + JSCallback WndProc + CreateWindowExW (WS_POPUP borderless)
 *   2. D3D11CreateDeviceAndSwapChain against the real HWND (HARDWARE, WARP fallback)
 *   3. D3DCompile the fullscreen-triangle VS (SV_VertexID, no vertex buffer) → DXBC
 *   4. D3DCompile the ray-marching PS (cbuffer b0) → DXBC  (compile timed for the HUD)
 *   5. ID3D11Device::CreateVertexShader / CreatePixelShader / CreateBuffer (constant buffer)
 *   6. IDXGISwapChain::GetBuffer(0) → ID3D11Device::CreateRenderTargetView
 *   7. per frame: UpdateSubresource(cb) → OMSetRenderTargets → RSSetViewports →
 *      ClearRenderTargetView → IASetPrimitiveTopology → VSSetShader → PSSetShader →
 *      PSSetConstantBuffers → Draw(3) → Present(0,0); GDI HUD on top
 *   8. release every COM object, DestroyWindow, free GDI on exit
 *
 * APIs demonstrated:
 *   - D3dcompiler_47.D3DCompile           (runtime HLSL → DXBC, both stages)
 *   - ID3DBlob vtable                     (GetBufferPointer s3, GetBufferSize s4, Release s2)
 *   - D3d11.D3D11CreateDeviceAndSwapChain (real device + DXGI swap chain on a real HWND)
 *   - ID3D11Device vtable                 (CreateBuffer, CreateVertexShader, CreatePixelShader,
 *                                          CreateRenderTargetView)
 *   - ID3D11DeviceContext vtable          (UpdateSubresource, OMSetRenderTargets, RSSetViewports,
 *                                          ClearRenderTargetView, IASetPrimitiveTopology,
 *                                          VSSetShader, PSSetShader, PSSetConstantBuffers, Draw)
 *   - IDXGISwapChain vtable               (GetBuffer, Present)
 *   - IDXGIDevice / IDXGIAdapter vtable   (GetAdapter, GetDesc → GPU name)
 *   - IUnknown::Release                   (clean COM teardown)
 *   - User32  RegisterClassExW, CreateWindowExW, PeekMessageW, GetClientRect, GetAsyncKeyState,
 *             GetSystemMetrics, GetDC/ReleaseDC, ShowWindow, DestroyWindow
 *   - GDI32   CreateFontW, SelectObject, SetTextColor, SetBkMode, TextOutW, DeleteObject
 *
 * Run: bun run packages/all/example/shader-forge.ts
 */

import { CFunction, FFIType, JSCallback, read, type Pointer } from 'bun:ffi';

import { D3d11, D3dcompiler_47, GDI32, User32 } from '../index';
import { D3DCOMPILE_ENABLE_STRICTNESS, D3DCOMPILE_OPTIMIZATION_LEVEL3 } from '@bun-win32/d3dcompiler_47';
import { D3D11_SDK_VERSION, D3D_DRIVER_TYPE } from '@bun-win32/d3d11';
import { ShowWindowCommand, SystemMetric, VirtualKey, WindowStyles } from '@bun-win32/user32';

// ── Win32 / DXGI / D3D11 constants not surfaced by the package enums ──────────
const WM_DESTROY = 0x0002;
const WM_CLOSE = 0x0010;
const WM_KEYDOWN = 0x0100;
const WM_MOUSEMOVE = 0x0200;
const CS_HREDRAW = 0x0002;
const CS_VREDRAW = 0x0001;
const PM_REMOVE = 0x0001;

const DXGI_FORMAT_B8G8R8A8_UNORM = 87;
const DXGI_USAGE_RENDER_TARGET_OUTPUT = 0x20;
const DXGI_SWAP_EFFECT_DISCARD = 0;
const D3D11_CREATE_DEVICE_BGRA_SUPPORT = 0x20;
const D3D11_BIND_CONSTANT_BUFFER = 0x4;
const D3D11_USAGE_DEFAULT = 0;
const D3D11_PRIMITIVE_TOPOLOGY_TRIANGLELIST = 4;

// ── ID3D11Device vtable slots (d3d11.h declaration order; CreateTexture2D@5 anchor) ──
const DEV_CREATE_BUFFER = 3;
const DEV_CREATE_RENDER_TARGET_VIEW = 9;
const DEV_CREATE_VERTEX_SHADER = 12;
const DEV_CREATE_PIXEL_SHADER = 15;

// ── ID3D11DeviceContext vtable slots ─────────────────────────────────────────
const CTX_PS_SET_SHADER = 9;
const CTX_VS_SET_SHADER = 11;
const CTX_DRAW = 13;
const CTX_PS_SET_CONSTANT_BUFFERS = 16;
const CTX_IA_SET_PRIMITIVE_TOPOLOGY = 24;
const CTX_OM_SET_RENDER_TARGETS = 33;
const CTX_RS_SET_VIEWPORTS = 44;
const CTX_UPDATE_SUBRESOURCE = 48;
const CTX_CLEAR_RENDER_TARGET_VIEW = 50;

// ── IDXGISwapChain / IDXGIDevice / IDXGIAdapter vtable slots ──────────────────
const SWAP_RELEASE = 2;
const SWAP_PRESENT = 8;
const SWAP_GET_BUFFER = 9;
const IUNKNOWN_QUERY_INTERFACE = 0;
const IUNKNOWN_RELEASE = 2;
const DXGIDEVICE_GET_ADAPTER = 7;
const DXGIADAPTER_GET_DESC = 8;

// ── ID3DBlob slots (IUnknown + GetBufferPointer s3 / GetBufferSize s4) ────────
const BLOB_RELEASE = 2;
const BLOB_GET_BUFFER_POINTER = 3;
const BLOB_GET_BUFFER_SIZE = 4;

const IID_ID3D11TEXTURE2D = '6f15aaf2-d208-4e89-9ab4-489535d34f9c';
const IID_IDXGIDEVICE = '54ec77fa-1377-44e6-8c32-88fd5f44c84c';

const NULL_PTR = null as unknown as Pointer;
const encode = (str: string): Buffer => Buffer.from(`${str}\0`, 'utf16le');
const encodeAscii = (str: string): Buffer => Buffer.from(`${str}\0`, 'utf8');
const hex = (hr: number): string => `0x${(hr >>> 0).toString(16).padStart(8, '0')}`;

D3d11.Preload(['D3D11CreateDeviceAndSwapChain']);
D3dcompiler_47.Preload(['D3DCompile']);

// ── Memoized COM vtable invoker (the implicit `this` u64 is prepended) ────────
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

// ── ID3DBlob helpers ─────────────────────────────────────────────────────────
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
function blobRelease(blob: bigint): void {
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

// ── HLSL source ──────────────────────────────────────────────────────────────
// Vertex shader: a single full-screen triangle from SV_VertexID — no vertex
// buffer, no input layout. uv is carried to the pixel stage.
const VS_SOURCE = `
struct VSOut { float4 pos : SV_Position; float2 uv : TEXCOORD0; };
VSOut main(uint vid : SV_VertexID) {
  VSOut o;
  float2 p = float2((vid << 1) & 2, vid & 2);
  o.uv = p;
  o.pos = float4(p * float2(2.0, -2.0) + float2(-1.0, 1.0), 0.0, 1.0);
  return o;
}
`;

// Pixel shader: a palette-cycling ray-marched rounded-box fractal with cheap
// soft shadows, fog and a breathing vignette. Reads time/resolution/mouse from b0.
const PS_SOURCE = `
cbuffer Frame : register(b0) {
  float2 iResolution;
  float  iTime;
  float  pad0;
  float2 iMouse;
  float2 pad1;
};

float3 palette(float t) {
  float3 a = float3(0.55, 0.45, 0.55);
  float3 b = float3(0.45, 0.40, 0.45);
  float3 c = float3(1.0, 1.0, 1.0);
  float3 d = float3(0.10, 0.33, 0.67);
  return a + b * cos(6.28318 * (c * t + d));
}

float sdRoundBox(float3 p, float3 b, float r) {
  float3 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r;
}

float3x3 rotY(float a) {
  float s = sin(a); float c = cos(a);
  return float3x3(c, 0, s, 0, 1, 0, -s, 0, c);
}
float3x3 rotX(float a) {
  float s = sin(a); float c = cos(a);
  return float3x3(1, 0, 0, 0, c, -s, 0, s, c);
}

// Folded, animated rounded-box fractal — distance to the nearest surface.
float map(float3 p) {
  p = mul(rotY(iTime * 0.25), p);
  p = mul(rotX(iTime * 0.17), p);
  float scale = 1.0;
  float d = 1e9;
  [unroll]
  for (int i = 0; i < 4; i++) {
    p = abs(p) - float3(1.05, 1.05, 1.05);
    float dd = sdRoundBox(p, float3(0.62, 0.62, 0.62), 0.08) / scale;
    d = min(d, dd);
    p *= 1.7;
    scale *= 1.7;
    p = mul(rotY(0.5 + iTime * 0.05), p);
  }
  return d;
}

float3 calcNormal(float3 p) {
  float2 e = float2(0.0012, 0.0);
  return normalize(float3(
    map(p + e.xyy) - map(p - e.xyy),
    map(p + e.yxy) - map(p - e.yxy),
    map(p + e.yyx) - map(p - e.yyx)));
}

// Cheap soft shadow by tracking the closest approach to the surface.
float softShadow(float3 ro, float3 rd) {
  float res = 1.0;
  float t = 0.04;
  [loop]
  for (int i = 0; i < 28; i++) {
    float h = map(ro + rd * t);
    if (h < 0.0015) return 0.0;
    res = min(res, 9.0 * h / t);
    t += clamp(h, 0.02, 0.25);
    if (t > 9.0) break;
  }
  return clamp(res, 0.0, 1.0);
}

float4 main(float4 fragPos : SV_Position, float2 uv : TEXCOORD0) : SV_Target {
  float2 res = max(iResolution, float2(1.0, 1.0));
  float2 p = (fragPos.xy * 2.0 - res) / res.y;
  p.y = -p.y;

  // Mouse drives a gentle camera lean.
  float2 m = (iMouse / res - 0.5) * 2.0;
  float yaw = m.x * 0.6 + iTime * 0.06;
  float pitch = m.y * 0.4 - 0.15;

  float3 ro = float3(0.0, 0.0, 5.2);
  ro = mul(rotY(yaw), ro);
  ro = mul(rotX(pitch), ro);
  float3 ww = normalize(-ro);
  float3 uu = normalize(cross(float3(0.0, 1.0, 0.0), ww));
  float3 vv = cross(ww, uu);
  float3 rd = normalize(p.x * uu + p.y * vv + 1.7 * ww);

  // March.
  float t = 0.0;
  float glow = 0.0;
  bool hit = false;
  [loop]
  for (int i = 0; i < 96; i++) {
    float3 pos = ro + rd * t;
    float d = map(pos);
    glow += 0.012 / (0.04 + d * d);
    if (d < 0.0015) { hit = true; break; }
    t += d;
    if (t > 14.0) break;
  }

  float3 sky = lerp(float3(0.02, 0.03, 0.06), float3(0.18, 0.10, 0.22), saturate(p.y * 0.5 + 0.5));
  sky += float3(0.35, 0.18, 0.08) * pow(saturate(1.0 - abs(p.y + 0.15)), 6.0); // warm horizon
  float3 col = sky;

  if (hit) {
    float3 pos = ro + rd * t;
    float3 n = calcNormal(pos);
    float3 lightDir = normalize(float3(0.6, 0.7, 0.4));
    float diff = saturate(dot(n, lightDir));
    float sh = softShadow(pos + n * 0.004, lightDir);
    float fres = pow(saturate(1.0 + dot(rd, n)), 3.0);
    float ao = saturate(1.0 - float(0) - t * 0.02);

    float3 base = palette(0.5 + 0.18 * length(pos) + iTime * 0.05);
    float3 lit = base * (0.18 + 0.9 * diff * sh);
    lit += fres * palette(iTime * 0.1 + 0.3) * 0.6;
    lit += base * pow(saturate(dot(reflect(rd, n), lightDir)), 32.0) * sh; // spec
    float fog = 1.0 - exp(-t * 0.10);
    col = lerp(lit, sky, fog);
  }

  // Volumetric glow halo.
  col += palette(iTime * 0.08 + 0.6) * glow * 0.5;

  // Breathing vignette + tone curve.
  float2 q = fragPos.xy / res;
  float vig = pow(16.0 * q.x * q.y * (1.0 - q.x) * (1.0 - q.y), 0.25 + 0.05 * sin(iTime));
  col *= lerp(0.6, 1.05, vig);
  col = col / (col + 1.0);                 // Reinhard tonemap
  col = pow(col, 1.0 / 2.2);               // gamma
  return float4(col, 1.0);
}
`;

interface Compiled {
  blob: bigint;
  dataPtr: bigint;
  size: number;
  ms: number;
}

function compile(source: string, entry: string, target: string): Compiled {
  const src = encodeAscii(source);
  const entryBuf = encodeAscii(entry);
  const targetBuf = encodeAscii(target);
  const ppCode = Buffer.alloc(8);
  const ppErr = Buffer.alloc(8);
  const t0 = performance.now();
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
  const ms = performance.now() - t0;
  if (hr !== 0) {
    const errPtr = ppErr.readBigUInt64LE(0);
    const msg = errPtr !== 0n ? blobAsString(errPtr) : '(no error blob)';
    blobRelease(errPtr);
    throw new Error(`D3DCompile(${target}) failed ${hex(hr)}:\n${msg}`);
  }
  const blob = ppCode.readBigUInt64LE(0);
  return { blob, dataPtr: blobBufferPointer(blob), size: Number(blobBufferSize(blob)), ms };
}

// ── Window plumbing ──────────────────────────────────────────────────────────
const WIDTH = 1280;
const HEIGHT = 720;
let mouseX = WIDTH / 2;
let mouseY = HEIGHT / 2;
let running = true;

const wndProc = new JSCallback(
  (hWnd: bigint, msg: number, wParam: bigint, lParam: bigint): bigint => {
    switch (msg) {
      case WM_MOUSEMOVE: {
        const lp = lParam & 0xffffffffn;
        mouseX = Number(lp & 0xffffn);
        mouseY = Number((lp >> 16n) & 0xffffn);
        return 0n;
      }
      case WM_KEYDOWN:
        if (wParam === BigInt(VirtualKey.VK_ESCAPE)) {
          running = false;
          User32.DestroyWindow(hWnd);
        }
        return 0n;
      case WM_CLOSE:
        running = false;
        User32.DestroyWindow(hWnd);
        return 0n;
      case WM_DESTROY:
        running = false;
        User32.PostQuitMessage(0);
        return 0n;
      default:
        return BigInt(User32.DefWindowProcW(hWnd, msg, wParam, lParam));
    }
  },
  { args: ['u64', 'u32', 'u64', 'i64'], returns: 'i64' },
);

const className = encode('BunShaderForge');
const wndClass = Buffer.alloc(80);
const wndClassView = new DataView(wndClass.buffer);
wndClassView.setUint32(0, 80, true); // cbSize
wndClassView.setUint32(4, CS_HREDRAW | CS_VREDRAW, true); // style
wndClass.writeBigUInt64LE(BigInt(wndProc.ptr!), 8); // lpfnWndProc
wndClassView.setInt32(16, 0, true);
wndClassView.setInt32(20, 0, true);
wndClass.writeBigUInt64LE(0n, 24); // hInstance
wndClass.writeBigUInt64LE(0n, 32); // hIcon
wndClass.writeBigUInt64LE(0n, 40); // hCursor (Windows supplies the arrow by default)
wndClass.writeBigUInt64LE(0n, 48); // hbrBackground
wndClass.writeBigUInt64LE(0n, 56);
wndClass.writeBigUInt64LE(BigInt(className.ptr!), 64); // lpszClassName
wndClass.writeBigUInt64LE(0n, 72);

if (!User32.RegisterClassExW(wndClass.ptr!)) {
  console.error('Failed to register window class.');
  process.exit(1);
}

const screenW = User32.GetSystemMetrics(SystemMetric.SM_CXSCREEN);
const screenH = User32.GetSystemMetrics(SystemMetric.SM_CYSCREEN);
const startX = Math.max(0, Math.floor((screenW - WIDTH) / 2));
const startY = Math.max(0, Math.floor((screenH - HEIGHT) / 2));

const hwnd = User32.CreateWindowExW(
  0,
  className.ptr!,
  encode('Shader Forge — runtime HLSL on the GPU').ptr!,
  WindowStyles.WS_POPUP | WindowStyles.WS_VISIBLE,
  startX,
  startY,
  WIDTH,
  HEIGHT,
  0n,
  0n,
  0n,
  NULL_PTR,
);
if (!hwnd) {
  console.error('Failed to create window.');
  process.exit(1);
}
User32.ShowWindow(hwnd, ShowWindowCommand.SW_SHOW);
User32.UpdateWindow(hwnd);
// Force the window above everything (incl. a maximized editor/terminal it was
// launched from) so it is never hidden behind the foreground window.
// HWND_TOPMOST (-1), SWP_NOMOVE | SWP_NOSIZE | SWP_SHOWWINDOW (0x43).
User32.SetWindowPos(hwnd, 0xffffffffffffffffn, 0, 0, 0, 0, 0x0043);
User32.SetForegroundWindow(hwnd);

// Real client size (WS_POPUP has no frame, but read it to be exact).
const clientRect = Buffer.alloc(16);
User32.GetClientRect(hwnd, clientRect.ptr!);
const clientW = Math.max(1, clientRect.readInt32LE(8) - clientRect.readInt32LE(0)) || WIDTH;
const clientH = Math.max(1, clientRect.readInt32LE(12) - clientRect.readInt32LE(4)) || HEIGHT;

// ── Device + swap chain ──────────────────────────────────────────────────────
function buildSwapChainDesc(window: bigint, w: number, h: number): Buffer {
  const buffer = Buffer.alloc(72);
  buffer.writeUInt32LE(w, 0); // BufferDesc.Width
  buffer.writeUInt32LE(h, 4); // BufferDesc.Height
  buffer.writeUInt32LE(60, 8); // RefreshRate.Numerator
  buffer.writeUInt32LE(1, 12); // RefreshRate.Denominator
  buffer.writeUInt32LE(DXGI_FORMAT_B8G8R8A8_UNORM, 16); // BufferDesc.Format
  buffer.writeUInt32LE(0, 20); // ScanlineOrdering
  buffer.writeUInt32LE(0, 24); // Scaling
  buffer.writeUInt32LE(1, 28); // SampleDesc.Count
  buffer.writeUInt32LE(0, 32); // SampleDesc.Quality
  buffer.writeUInt32LE(DXGI_USAGE_RENDER_TARGET_OUTPUT, 36); // BufferUsage
  buffer.writeUInt32LE(2, 40); // BufferCount
  buffer.writeBigUInt64LE(window, 48); // OutputWindow
  buffer.writeUInt32LE(1, 56); // Windowed
  buffer.writeUInt32LE(DXGI_SWAP_EFFECT_DISCARD, 60); // SwapEffect
  buffer.writeUInt32LE(0, 64); // Flags
  return buffer;
}

function createDeviceAndSwapChain(driverType: D3D_DRIVER_TYPE): { swap: bigint; device: bigint; context: bigint } | null {
  const desc = buildSwapChainDesc(hwnd, clientW, clientH);
  const ppSwap = Buffer.alloc(8);
  const ppDevice = Buffer.alloc(8);
  const pFeatureLevel = Buffer.alloc(4);
  const ppContext = Buffer.alloc(8);
  const hr = D3d11.D3D11CreateDeviceAndSwapChain(
    null,
    driverType,
    0n,
    D3D11_CREATE_DEVICE_BGRA_SUPPORT,
    null,
    0,
    D3D11_SDK_VERSION,
    desc.ptr!,
    ppSwap.ptr!,
    ppDevice.ptr!,
    pFeatureLevel.ptr!,
    ppContext.ptr!,
  );
  if (hr !== 0) return null;
  return {
    swap: ppSwap.readBigUInt64LE(0),
    device: ppDevice.readBigUInt64LE(0),
    context: ppContext.readBigUInt64LE(0),
  };
}

let gpu = createDeviceAndSwapChain(D3D_DRIVER_TYPE.D3D_DRIVER_TYPE_HARDWARE);
let driverLabel = 'hardware';
if (gpu === null) {
  gpu = createDeviceAndSwapChain(D3D_DRIVER_TYPE.D3D_DRIVER_TYPE_WARP);
  driverLabel = 'WARP';
}
if (gpu === null) {
  console.log('No D3D11 device available on this machine (HARDWARE and WARP both failed).');
  User32.DestroyWindow(hwnd);
  User32.UnregisterClassW(className.ptr!, 0n);
  wndProc.close();
  process.exit(0);
}
const { swap, device, context } = gpu;

// ── GPU name via IDXGIDevice → IDXGIAdapter → GetDesc ─────────────────────────
function readGpuName(): string {
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
const gpuName = readGpuName();

// ── Compile both stages (timed for the HUD) ──────────────────────────────────
let vsCompiled: Compiled;
let psCompiled: Compiled;
try {
  vsCompiled = compile(VS_SOURCE, 'main', 'vs_5_0');
  psCompiled = compile(PS_SOURCE, 'main', 'ps_5_0');
} catch (err) {
  console.error(String((err as Error).message));
  comRelease(context);
  comRelease(swap);
  comRelease(device);
  User32.DestroyWindow(hwnd);
  User32.UnregisterClassW(className.ptr!, 0n);
  wndProc.close();
  process.exit(1);
}
const compileMs = vsCompiled.ms + psCompiled.ms;

// ── Create shaders, constant buffer, render-target view ──────────────────────
const ppVS = Buffer.alloc(8);
if (vcall(device, DEV_CREATE_VERTEX_SHADER, [FFIType.u64, FFIType.u64, FFIType.u64, FFIType.ptr], [vsCompiled.dataPtr, BigInt(vsCompiled.size), 0n, ppVS.ptr!]) !== 0) {
  throw new Error('CreateVertexShader failed');
}
const vertexShader = ppVS.readBigUInt64LE(0);

const ppPS = Buffer.alloc(8);
if (vcall(device, DEV_CREATE_PIXEL_SHADER, [FFIType.u64, FFIType.u64, FFIType.u64, FFIType.ptr], [psCompiled.dataPtr, BigInt(psCompiled.size), 0n, ppPS.ptr!]) !== 0) {
  throw new Error('CreatePixelShader failed');
}
const pixelShader = ppPS.readBigUInt64LE(0);

// Constant buffer: 32 bytes (float2 res, float time, float pad, float2 mouse, float2 pad2) — 16-byte multiple.
const CB_SIZE = 32;
const cbDesc = Buffer.alloc(24); // D3D11_BUFFER_DESC
cbDesc.writeUInt32LE(CB_SIZE, 0); // ByteWidth
cbDesc.writeUInt32LE(D3D11_USAGE_DEFAULT, 4); // Usage
cbDesc.writeUInt32LE(D3D11_BIND_CONSTANT_BUFFER, 8); // BindFlags
cbDesc.writeUInt32LE(0, 12); // CPUAccessFlags
cbDesc.writeUInt32LE(0, 16); // MiscFlags
cbDesc.writeUInt32LE(0, 20); // StructureByteStride
const ppCB = Buffer.alloc(8);
if (vcall(device, DEV_CREATE_BUFFER, [FFIType.ptr, FFIType.ptr, FFIType.ptr], [cbDesc.ptr!, null, ppCB.ptr!]) !== 0) {
  throw new Error('CreateBuffer (constant buffer) failed');
}
const constantBuffer = ppCB.readBigUInt64LE(0);

// Back buffer → render-target view.
const ppBackBuffer = Buffer.alloc(8);
const tex2dIid = guidBytes(IID_ID3D11TEXTURE2D);
if (vcall(swap, SWAP_GET_BUFFER, [FFIType.u32, FFIType.ptr, FFIType.ptr], [0, tex2dIid.ptr!, ppBackBuffer.ptr!]) !== 0) {
  throw new Error('IDXGISwapChain::GetBuffer failed');
}
const backBuffer = ppBackBuffer.readBigUInt64LE(0);
const ppRtv = Buffer.alloc(8);
if (vcall(device, DEV_CREATE_RENDER_TARGET_VIEW, [FFIType.u64, FFIType.ptr, FFIType.ptr], [backBuffer, null, ppRtv.ptr!]) !== 0) {
  throw new Error('CreateRenderTargetView failed');
}
const rtv = ppRtv.readBigUInt64LE(0);
comRelease(backBuffer); // RTV keeps its own reference

// Persistent per-frame argument buffers (kept alive for the lifetime of the loop).
const rtvArray = Buffer.alloc(8);
rtvArray.writeBigUInt64LE(rtv, 0);
const cbArray = Buffer.alloc(8);
cbArray.writeBigUInt64LE(constantBuffer, 0);
const viewport = Buffer.alloc(24); // D3D11_VIEWPORT: 6 floats
viewport.writeFloatLE(0, 0); // TopLeftX
viewport.writeFloatLE(0, 4); // TopLeftY
viewport.writeFloatLE(clientW, 8); // Width
viewport.writeFloatLE(clientH, 12); // Height
viewport.writeFloatLE(0, 16); // MinDepth
viewport.writeFloatLE(1, 20); // MaxDepth
const clearColor = Buffer.alloc(16);
clearColor.writeFloatLE(0.015, 0);
clearColor.writeFloatLE(0.02, 4);
clearColor.writeFloatLE(0.05, 8);
clearColor.writeFloatLE(1.0, 12);

// ── GDI HUD font ─────────────────────────────────────────────────────────────
const hudFont = GDI32.CreateFontW(-18, 0, 0, 0, 600, 0, 0, 0, 0, 0, 0, 4 /* ANTIALIASED_QUALITY */, 0, encode('Consolas').ptr!);
const TRANSPARENT_BK = 1;

console.log('Shader Forge — runtime-compiled HLSL ray-marcher running on the GPU.');
console.log(`  HLSL compiled in ${compileMs.toFixed(2)} ms · ${driverLabel} · ${gpuName}`);
console.log('  Move the mouse to lean the camera · ESC to exit.');

// ── Render loop ──────────────────────────────────────────────────────────────
const startTime = performance.now();
const durationMs = process.env.DEMO_DURATION_MS ? Number(process.env.DEMO_DURATION_MS) : 0;
const msgBuffer = Buffer.alloc(48);
let frames = 0;
let fps = 0;
let fpsWindowStart = startTime;
const cbData = Buffer.alloc(CB_SIZE);

let cleanedUp = false;
function cleanup(code: number): never {
  if (!cleanedUp) {
    cleanedUp = true;
    GDI32.DeleteObject(hudFont);
    comRelease(rtv);
    comRelease(constantBuffer);
    comRelease(pixelShader);
    comRelease(vertexShader);
    blobRelease(vsCompiled.blob);
    blobRelease(psCompiled.blob);
    comRelease(context);
    comRelease(swap);
    comRelease(device);
    if (hwnd) User32.DestroyWindow(hwnd);
    User32.UnregisterClassW(className.ptr!, 0n);
    wndProc.close();
  }
  process.exit(code);
}
process.on('SIGINT', () => cleanup(0));
process.on('exit', () => {
  if (!cleanedUp) {
    cleanedUp = true;
    GDI32.DeleteObject(hudFont);
    comRelease(rtv);
    comRelease(constantBuffer);
    comRelease(pixelShader);
    comRelease(vertexShader);
    comRelease(context);
    comRelease(swap);
    comRelease(device);
    wndProc.close();
  }
});

function drawHud(): void {
  const dc = User32.GetDC(hwnd);
  if (!dc) return;
  const prevFont = GDI32.SelectObject(dc, hudFont);
  GDI32.SetBkMode(dc, TRANSPARENT_BK);
  const line = `HLSL compiled at runtime · ${compileMs.toFixed(1)} ms · ${fps} fps · ${gpuName}`;
  const text = encode(line);
  const len = line.length;
  // Soft shadow then bright text for legibility over any frame.
  GDI32.SetTextColor(dc, 0x000000);
  GDI32.TextOutW(dc, 17, 17, text.ptr!, len);
  GDI32.SetTextColor(dc, 0x00f0e0c0); // BGR: warm cyan-white
  GDI32.TextOutW(dc, 16, 16, text.ptr!, len);
  GDI32.SelectObject(dc, prevFont);
  User32.ReleaseDC(hwnd, dc);
}

while (running) {
  // Non-blocking message pump.
  while (User32.PeekMessageW(msgBuffer.ptr!, 0n, 0, 0, PM_REMOVE) !== 0) {
    User32.TranslateMessage(msgBuffer.ptr!);
    User32.DispatchMessageW(msgBuffer.ptr!);
  }
  if (!running) break;

  // ESC via async key (covers focus edge cases).
  if ((User32.GetAsyncKeyState(VirtualKey.VK_ESCAPE) & 0x8000) !== 0) break;

  const now = performance.now();
  const elapsed = (now - startTime) / 1000;

  // Build the constant buffer immediately before the call that consumes it.
  cbData.writeFloatLE(clientW, 0); // iResolution.x
  cbData.writeFloatLE(clientH, 4); // iResolution.y
  cbData.writeFloatLE(elapsed, 8); // iTime
  cbData.writeFloatLE(0, 12); // pad
  cbData.writeFloatLE(mouseX, 16); // iMouse.x
  cbData.writeFloatLE(clientH - mouseY, 20); // iMouse.y (flip to GL-style)
  cbData.writeFloatLE(0, 24);
  cbData.writeFloatLE(0, 28);
  vcall(context, CTX_UPDATE_SUBRESOURCE, [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], [constantBuffer, 0, null, cbData.ptr!, 0, 0], FFIType.void);

  vcall(context, CTX_OM_SET_RENDER_TARGETS, [FFIType.u32, FFIType.ptr, FFIType.u64], [1, rtvArray.ptr!, 0n], FFIType.void);
  vcall(context, CTX_RS_SET_VIEWPORTS, [FFIType.u32, FFIType.ptr], [1, viewport.ptr!], FFIType.void);
  vcall(context, CTX_CLEAR_RENDER_TARGET_VIEW, [FFIType.u64, FFIType.ptr], [rtv, clearColor.ptr!], FFIType.void);
  vcall(context, CTX_IA_SET_PRIMITIVE_TOPOLOGY, [FFIType.u32], [D3D11_PRIMITIVE_TOPOLOGY_TRIANGLELIST], FFIType.void);
  vcall(context, CTX_VS_SET_SHADER, [FFIType.u64, FFIType.ptr, FFIType.u32], [vertexShader, null, 0], FFIType.void);
  vcall(context, CTX_PS_SET_SHADER, [FFIType.u64, FFIType.ptr, FFIType.u32], [pixelShader, null, 0], FFIType.void);
  vcall(context, CTX_PS_SET_CONSTANT_BUFFERS, [FFIType.u32, FFIType.u32, FFIType.ptr], [0, 1, cbArray.ptr!], FFIType.void);
  vcall(context, CTX_DRAW, [FFIType.u32, FFIType.u32], [3, 0], FFIType.void);

  vcall(swap, SWAP_PRESENT, [FFIType.u32, FFIType.u32], [0, 0]);

  drawHud();

  // FPS accounting.
  frames += 1;
  if (now - fpsWindowStart >= 500) {
    fps = Math.round((frames * 1000) / (now - fpsWindowStart));
    frames = 0;
    fpsWindowStart = now;
  }

  if (durationMs > 0 && now - startTime >= durationMs) break;
}

cleanup(0);
