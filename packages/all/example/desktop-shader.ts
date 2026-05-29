/**
 * desktop-shader — run live GPU shaders on your actual Windows desktop.
 *
 * Opens a borderless fullscreen window and feeds it your REAL, scanned-out
 * desktop: the DXGI Desktop Duplication API hands us each presented frame as an
 * ID3D11Texture2D, we CopyResource it into a shader-resource texture on the same
 * D3D11 device, then run a fullscreen pixel shader that post-processes the whole
 * screen in real time before presenting. Five hand-written HLSL effects cycle
 * every ~5 s (or on SPACE / number keys 1-5): a CRT monitor with barrel
 * distortion + RGB aperture-grille + scanlines + chromatic aberration + glow; an
 * underwater pass with animated refraction ripples and a caustic teal tint; an
 * ASCII / Sobel edge-glow over a dark field; a thermal "predator" palette mapped
 * from luminance; and a datamosh chromatic-pulse with block jitter. Whatever is
 * on your screen — windows, video, this very terminal — is warped live on the GPU.
 *
 * Pipeline (per frame): IDXGIOutputDuplication::AcquireNextFrame → QueryInterface
 * the frame to ID3D11Texture2D → ID3D11DeviceContext::CopyResource into a
 * SRV-backed B8G8R8A8 texture → ReleaseFrame → bind that SRV + a constant buffer
 * (resolution, time, effect id, mouse) → drawFullscreenTriangle through the active
 * pixel shader → IDXGISwapChain::Present. DXGI_ERROR_WAIT_TIMEOUT reuses the last
 * captured frame; E_ACCESSDENIED (another capture owns duplication) prints a clear
 * message and exits cleanly.
 *
 * Engine/APIs: _gpu.ts (createWindow, createDevice, compile, makePixelShader/
 * makeVertexShader, makeTexture, makeSampler, makeConstantBuffer,
 * updateConstantBuffer, setRenderTargets/setViewport/clear, psSet/vsSet,
 * drawFullscreenTriangle, copyResource, vcall, comRelease) + @bun-win32 d3d11 /
 * dxgi (Desktop Duplication) / user32 / gdi32 (HUD).
 *
 * Run: bun run packages/all/example/desktop-shader.ts
 */

import { CFunction, FFIType, read, type Pointer } from 'bun:ffi';

import { GDI32, User32 } from '../index';
import { SystemMetric } from '@bun-win32/user32';
import * as gpu from './_gpu';

// ── HRESULTs ──────────────────────────────────────────────────────────────────
const S_OK = 0;
const DXGI_ERROR_NOT_FOUND = 0x887a_0002 >>> 0;
const DXGI_ERROR_WAIT_TIMEOUT = 0x887a_0027 >>> 0;
const DXGI_ERROR_ACCESS_LOST = 0x887a_0026 >>> 0;
const E_ACCESSDENIED = 0x8007_0005 >>> 0;

// ── IIDs + extra DXGI vtable slots (derived from dxgi1_2.h declaration order) ──
const IID_IDXGIDEVICE = '54ec77fa-1377-44e6-8c32-88fd5f44c84c';
const IID_IDXGIOUTPUT1 = '00cddea8-939b-4b83-a340-a685226666cc';
const IID_ID3D11TEXTURE2D = '6f15aaf2-d208-4e89-9ab4-489535d34f9c';

const DXGIDEVICE_GET_ADAPTER = 7;
const DXGIADAPTER_ENUM_OUTPUTS = 7;
const DXGIOUTPUT1_DUPLICATE_OUTPUT = 22;
const DUPL_ACQUIRE_NEXT_FRAME = 8;
const DUPL_RELEASE_FRAME = 14;

const VK_SPACE = 0x20;
const NUM_EFFECTS = 5;
const CYCLE_MS = 5000;

const hex = (hr: number): string => `0x${(hr >>> 0).toString(16).padStart(8, '0')}`;
const encodeWide = (str: string): Buffer => Buffer.from(`${str}\0`, 'utf16le');

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

// ── Shared HLSL preamble: a Texture2D of the live desktop + per-frame params ──
const COMMON_HLSL = /* hlsl */ `
cbuffer C : register(b0) {
  float2 iRes;   // backbuffer resolution in pixels
  float  iTime;  // seconds since start
  float  iEffect;// active effect id (unused per-shader but kept for layout)
};
Texture2D Desk : register(t0);
SamplerState Smp : register(s0);

float luma(float3 c) { return dot(c, float3(0.299, 0.587, 0.114)); }

float hash(float2 p) {
  p = frac(p * float2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return frac(p.x * p.y);
}

struct VSOut { float4 pos : SV_Position; float2 uv : TEXCOORD0; };
`;

// ── Five effect bodies — each is a full HLSL `float4 main(...)` ────────────────

// (1) CRT: barrel distortion, aperture-grille RGB mask, scanlines, chromatic
//     aberration, vignette + bloom.
const PS_CRT = /* hlsl */ `${COMMON_HLSL}
float4 main(VSOut i) : SV_Target {
  float2 uv = i.uv;
  // Barrel distortion around centre.
  float2 c = uv * 2.0 - 1.0;
  float r2 = dot(c, c);
  c *= 1.0 + 0.12 * r2;
  uv = c * 0.5 + 0.5;
  if (uv.x < 0 || uv.x > 1 || uv.y < 0 || uv.y > 1) return float4(0,0,0,1);

  // Chromatic aberration: split RGB sample offsets radially.
  float2 dir = (uv - 0.5);
  float ca = 0.0035 * (0.5 + r2);
  float3 col;
  col.r = Desk.Sample(Smp, uv + dir * ca).r;
  col.g = Desk.Sample(Smp, uv).g;
  col.b = Desk.Sample(Smp, uv - dir * ca).b;

  // Glow / bloom: cheap 4-tap blur added back.
  float3 glow = 0;
  float2 px = 2.5 / iRes;
  glow += Desk.Sample(Smp, uv + float2( px.x, 0)).rgb;
  glow += Desk.Sample(Smp, uv + float2(-px.x, 0)).rgb;
  glow += Desk.Sample(Smp, uv + float2(0,  px.y)).rgb;
  glow += Desk.Sample(Smp, uv + float2(0, -px.y)).rgb;
  col += pow(saturate(glow * 0.25), 2.4) * 0.35;

  // Aperture-grille RGB mask (sub-pixel triads).
  float gx = frac(uv.x * iRes.x / 3.0);
  float3 mask = float3(gx < 0.333, gx >= 0.333 && gx < 0.666, gx >= 0.666);
  mask = lerp(float3(1,1,1), mask * 1.6, 0.55);
  col *= mask;

  // Scanlines + slow vertical roll.
  float scan = 0.85 + 0.15 * sin((uv.y * iRes.y + iTime * 30.0) * 3.14159);
  col *= scan;

  // Vignette.
  float vig = smoothstep(1.25, 0.35, r2);
  col *= vig;

  return float4(saturate(col * 1.12), 1);
}`;

// (2) Underwater: animated refraction ripples + caustic teal tint + light shafts.
const PS_WATER = /* hlsl */ `${COMMON_HLSL}
float4 main(VSOut i) : SV_Target {
  float2 uv = i.uv;
  float t = iTime;
  // Stacked sine ripples warp the sample coordinate.
  float2 w;
  w.x = sin(uv.y * 22.0 + t * 1.8) * 0.0035 + sin(uv.y * 7.0 - t * 1.1) * 0.006;
  w.y = sin(uv.x * 18.0 - t * 1.5) * 0.0035 + cos(uv.x * 9.0 + t * 0.9) * 0.005;
  float2 suv = uv + w;
  float3 col = Desk.Sample(Smp, suv).rgb;

  // Caustic field: overlapping moving cells brighten the image in webs.
  float2 cp = uv * 9.0;
  float caustic = 0;
  caustic += sin(cp.x + t * 1.3) * sin(cp.y + t * 1.1);
  caustic += sin(cp.x * 1.7 - t) * sin(cp.y * 1.3 + t * 0.7);
  caustic = pow(saturate(caustic * 0.5 + 0.5), 4.0);
  col += caustic * float3(0.25, 0.5, 0.55);

  // Depth tint: push toward teal, attenuate red with vertical "depth".
  float depth = uv.y;
  float3 deep = float3(0.05, 0.30, 0.45);
  col = lerp(col * float3(0.6, 0.95, 1.05), deep, depth * 0.45);

  // God-ray shafts sweeping from the top.
  float shaft = pow(saturate(sin(uv.x * 6.0 + t * 0.4) * 0.5 + 0.5), 8.0) * (1.0 - uv.y) * 0.4;
  col += shaft * float3(0.4, 0.8, 0.9);

  return float4(saturate(col), 1);
}`;

// (3) ASCII / edge: Sobel edge magnitude → glowing wireframe; luminance quantised
//     into a character-cell brightness ramp over a near-black field.
const PS_ASCII = /* hlsl */ `${COMMON_HLSL}
float sampLuma(float2 uv) { return luma(Desk.Sample(Smp, uv).rgb); }
float4 main(VSOut i) : SV_Target {
  float2 uv = i.uv;
  float2 cell = 8.0 / iRes;            // ~8px character cells
  float2 px = 1.0 / iRes;

  // Sobel on luminance.
  float tl = sampLuma(uv + float2(-px.x, -px.y));
  float  l = sampLuma(uv + float2(-px.x, 0));
  float bl = sampLuma(uv + float2(-px.x,  px.y));
  float  t = sampLuma(uv + float2(0, -px.y));
  float  b = sampLuma(uv + float2(0,  px.y));
  float tr = sampLuma(uv + float2( px.x, -px.y));
  float  r = sampLuma(uv + float2( px.x, 0));
  float br = sampLuma(uv + float2( px.x,  px.y));
  float gx = -tl - 2*l - bl + tr + 2*r + br;
  float gy = -tl - 2*t - tr + bl + 2*b + br;
  float edge = saturate(sqrt(gx*gx + gy*gy) * 1.4);

  // Snap luminance to a cell and quantise into a ramp (the "character density").
  float2 cellUV = (floor(uv / cell) + 0.5) * cell;
  float cl = sampLuma(cellUV);
  float ramp = floor(cl * 6.0) / 6.0;

  // Dot-matrix within the cell so it reads like glyphs.
  float2 f = frac(uv / cell);
  float dotMask = smoothstep(0.5, 0.15, length(f - 0.5)) * step(0.12, ramp);

  float3 phosphor = float3(0.2, 1.0, 0.45);   // green terminal
  float3 col = phosphor * (ramp * dotMask * 0.9);
  col += phosphor * edge * 1.2;               // glowing edges
  col += phosphor * 0.02;                      // faint scan field
  // Subtle flicker.
  col *= 0.92 + 0.08 * sin(iTime * 8.0 + uv.y * 40.0);
  return float4(saturate(col), 1);
}`;

// (4) Thermal / predator: luminance mapped through a heat palette.
const PS_THERMAL = /* hlsl */ `${COMMON_HLSL}
float3 heat(float x) {
  // Black → blue → magenta → red → orange → yellow → white.
  x = saturate(x);
  float3 c = float3(0,0,0);
  c = lerp(c, float3(0.0, 0.0, 0.45), smoothstep(0.0, 0.2, x));
  c = lerp(c, float3(0.55, 0.0, 0.55), smoothstep(0.2, 0.4, x));
  c = lerp(c, float3(0.9, 0.05, 0.1),  smoothstep(0.4, 0.6, x));
  c = lerp(c, float3(1.0, 0.55, 0.0),  smoothstep(0.6, 0.78, x));
  c = lerp(c, float3(1.0, 0.95, 0.3),  smoothstep(0.78, 0.92, x));
  c = lerp(c, float3(1.0, 1.0, 1.0),   smoothstep(0.92, 1.0, x));
  return c;
}
float4 main(VSOut i) : SV_Target {
  float2 uv = i.uv;
  // Slight bloom of luminance so hot regions blossom.
  float2 px = 1.5 / iRes;
  float lum = luma(Desk.Sample(Smp, uv).rgb);
  lum += luma(Desk.Sample(Smp, uv + px).rgb) * 0.5;
  lum += luma(Desk.Sample(Smp, uv - px).rgb) * 0.5;
  lum /= 2.0;
  // Gamma + breathing gain to feel "live sensor".
  lum = pow(lum, 0.8) * (0.95 + 0.05 * sin(iTime * 2.0));
  float3 col = heat(lum);
  // Sensor scanline + faint noise grain.
  col *= 0.93 + 0.07 * sin(uv.y * iRes.y * 0.7 + iTime * 12.0);
  col += (hash(uv * iRes + iTime) - 0.5) * 0.04;
  return float4(saturate(col), 1);
}`;

// (5) Datamosh / chromatic pulse: blocky displacement, RGB channel splitting that
//     pulses with time, and scanline tears.
const PS_DATAMOSH = /* hlsl */ `${COMMON_HLSL}
float4 main(VSOut i) : SV_Target {
  float2 uv = i.uv;
  float t = iTime;

  // Quantise into macroblocks and jitter blocks pseudo-randomly over time.
  float2 blocks = floor(uv * float2(48, 27));
  float n = hash(blocks + floor(t * 6.0));
  float glitch = step(0.82, n);                     // ~18% of blocks tear
  float2 tear = float2((hash(blocks + t) - 0.5) * 0.06, 0) * glitch;

  // Horizontal scanline slip bands.
  float band = step(0.7, frac(uv.y * 14.0 + t * 1.7));
  tear.x += band * (hash(float2(floor(uv.y * 14.0), floor(t * 4.0))) - 0.5) * 0.04;

  float2 suv = uv + tear;

  // Chromatic split that pulses; widens on glitched blocks.
  float pulse = (0.004 + 0.004 * sin(t * 3.0)) + glitch * 0.02;
  float3 col;
  col.r = Desk.Sample(Smp, suv + float2(pulse, 0)).r;
  col.g = Desk.Sample(Smp, suv).g;
  col.b = Desk.Sample(Smp, suv - float2(pulse, 0)).b;

  // Occasional inverted / oversaturated block flashes.
  if (glitch > 0.5 && n > 0.93) col = 1.0 - col;
  col = saturate(lerp(col, col * float3(1.2, 1.0, 1.3), 0.4));

  // Compression-style banding + bright row sparks.
  col = floor(col * 24.0) / 24.0;
  col += band * glitch * float3(0.1, 0.0, 0.15);
  return float4(saturate(col), 1);
}`;

const EFFECT_NAMES = ['CRT', 'underwater', 'ASCII edge', 'thermal', 'datamosh'] as const;
const EFFECT_SRC = [PS_CRT, PS_WATER, PS_ASCII, PS_THERMAL, PS_DATAMOSH] as const;

// ── Boot ──────────────────────────────────────────────────────────────────────
const durationMs = process.env.DEMO_DURATION_MS ? Number(process.env.DEMO_DURATION_MS) : 0;

const screenW = User32.GetSystemMetrics(SystemMetric.SM_CXSCREEN);
const screenH = User32.GetSystemMetrics(SystemMetric.SM_CYSCREEN);

const win = gpu.createWindow({ title: 'desktop-shader · live GPU desktop', width: screenW, height: screenH, borderless: true });

// Exclude OUR OWN fullscreen window from DXGI Output Duplication. Without this the
// borderless window covers the whole screen and gets captured by the very duplication
// we then post-process and present back into it — a capture→present feedback loop that
// degenerates to black. WDA_EXCLUDEFROMCAPTURE (0x11) makes the desktop compositor skip
// this window in all screen capture (DXGI duplication, PrintScreen, recorders), so
// duplication sees the REAL desktop BEHIND it (the user's apps) instead of itself.
// Expected side effect: the shaded result will not appear in external screen recordings.
const WDA_EXCLUDEFROMCAPTURE = 0x11;
User32.SetWindowDisplayAffinity(win.hwnd, WDA_EXCLUDEFROMCAPTURE);

const { w: BBW, h: BBH } = win.clientSize();
const g = gpu.createDevice(win.hwnd, { width: BBW, height: BBH });

// ── Acquire Desktop Duplication on the SAME device used for rendering ─────────
function setupDuplication(device: bigint): bigint | { error: 'denied' | string } {
  const ppDxgiDevice = Buffer.alloc(8);
  if (gpu.vcall(device, gpu.IUNKNOWN_QUERY_INTERFACE, [FFIType.ptr, FFIType.ptr], [guidBytes(IID_IDXGIDEVICE).ptr!, ppDxgiDevice.ptr!]) !== S_OK) {
    return { error: 'QueryInterface(IDXGIDevice) failed.' };
  }
  const dxgiDevice = ppDxgiDevice.readBigUInt64LE(0);

  const ppAdapter = Buffer.alloc(8);
  if (gpu.vcall(dxgiDevice, DXGIDEVICE_GET_ADAPTER, [FFIType.ptr], [ppAdapter.ptr!]) !== S_OK) {
    gpu.comRelease(dxgiDevice);
    return { error: 'IDXGIDevice::GetAdapter failed.' };
  }
  const adapter = ppAdapter.readBigUInt64LE(0);

  const ppOutput = Buffer.alloc(8);
  const enumHr = gpu.vcall(adapter, DXGIADAPTER_ENUM_OUTPUTS, [FFIType.u32, FFIType.ptr], [0, ppOutput.ptr!]);
  if ((enumHr >>> 0) === DXGI_ERROR_NOT_FOUND) {
    gpu.comRelease(adapter);
    gpu.comRelease(dxgiDevice);
    return { error: 'No connected output (EnumOutputs → NOT_FOUND).' };
  }
  if (enumHr !== S_OK) {
    gpu.comRelease(adapter);
    gpu.comRelease(dxgiDevice);
    return { error: `IDXGIAdapter::EnumOutputs failed ${hex(enumHr)}.` };
  }
  const output = ppOutput.readBigUInt64LE(0);

  const ppOutput1 = Buffer.alloc(8);
  if (gpu.vcall(output, gpu.IUNKNOWN_QUERY_INTERFACE, [FFIType.ptr, FFIType.ptr], [guidBytes(IID_IDXGIOUTPUT1).ptr!, ppOutput1.ptr!]) !== S_OK) {
    gpu.comRelease(output);
    gpu.comRelease(adapter);
    gpu.comRelease(dxgiDevice);
    return { error: 'QueryInterface(IDXGIOutput1) failed.' };
  }
  const output1 = ppOutput1.readBigUInt64LE(0);

  const ppDupl = Buffer.alloc(8);
  const dupHr = gpu.vcall(output1, DXGIOUTPUT1_DUPLICATE_OUTPUT, [FFIType.u64, FFIType.ptr], [device, ppDupl.ptr!]);
  // Release the chain links we no longer need; the duplication holds its own refs.
  gpu.comRelease(output1);
  gpu.comRelease(output);
  gpu.comRelease(adapter);
  gpu.comRelease(dxgiDevice);
  if ((dupHr >>> 0) === E_ACCESSDENIED) return { error: 'denied' };
  if (dupHr !== S_OK) return { error: `IDXGIOutput1::DuplicateOutput failed ${hex(dupHr)}.` };
  return ppDupl.readBigUInt64LE(0);
}

let dupl = setupDuplication(g.device);
if (typeof dupl !== 'bigint') {
  if (dupl.error === 'denied') {
    console.log('DuplicateOutput → E_ACCESSDENIED: another desktop-capture/recording tool already owns duplication.');
    console.log('Close it and retry. Exiting cleanly.');
  } else {
    console.log(`Desktop Duplication unavailable: ${dupl.error}`);
    console.log('Exiting cleanly.');
  }
  gpu.comRelease(g.backBufferRTV);
  gpu.comRelease(g.swapChain);
  gpu.comRelease(g.context);
  gpu.comRelease(g.device);
  win.destroy();
  process.exit(0);
}
let duplication: bigint = dupl;

// ── Compile the fullscreen pass-through VS + one PS per effect ────────────────
const vsCode = gpu.compile(
  /* hlsl */ `struct VSOut { float4 pos : SV_Position; float2 uv : TEXCOORD0; };
   VSOut main(uint vid : SV_VertexID) {
     VSOut o; float2 p = float2((vid << 1) & 2, vid & 2);
     o.uv = p; o.pos = float4(p * float2(2,-2) + float2(-1,1), 0, 1); return o; }`,
  'main',
  'vs_5_0',
);
const vs = gpu.makeVertexShader(vsCode);

const pixelShaders: bigint[] = [];
const psBlobs: bigint[] = [];
for (let e = 0; e < NUM_EFFECTS; e += 1) {
  const code = gpu.compile(EFFECT_SRC[e]!, 'main', 'ps_5_0');
  pixelShaders.push(gpu.makePixelShader(code));
  psBlobs.push(code.blob);
}

const sampler = gpu.makeSampler({ filter: gpu.D3D11_FILTER_MIN_MAG_MIP_LINEAR, address: gpu.D3D11_TEXTURE_ADDRESS_CLAMP });
const cb = gpu.makeConstantBuffer(16);
const cbBuf = Buffer.alloc(16);

// The desktop SRV texture is created lazily once we know the duplicated size.
// Assigned inside captureFrame(); the explicit annotation keeps TS from narrowing
// it to `never` in the teardown block (the only assignment is inside a closure).
let deskTex: gpu.TextureResult | null = null as gpu.TextureResult | null;
let deskW = 0;
let deskH = 0;

// ── Per-frame duplication buffers (reused; assembled right before the call) ───
const frameInfo = Buffer.alloc(64);
const ppResource = Buffer.alloc(8);
const ppTex = Buffer.alloc(8);
const descBuf = Buffer.alloc(44);
const tex2dIid = guidBytes(IID_ID3D11TEXTURE2D);

/**
 * Acquire one duplicated desktop frame and CopyResource it into the SRV texture.
 * Returns 'ok' if a fresh frame landed, 'reuse' on timeout / metadata-only frame
 * (keep last image), or 'lost' if duplication broke (caller re-acquires).
 */
function captureFrame(): 'ok' | 'reuse' | 'lost' {
  ppResource.writeBigUInt64LE(0n, 0);
  const hr = gpu.vcall(duplication, DUPL_ACQUIRE_NEXT_FRAME, [FFIType.u32, FFIType.ptr, FFIType.ptr], [12, frameInfo.ptr!, ppResource.ptr!]);
  if ((hr >>> 0) === DXGI_ERROR_WAIT_TIMEOUT) return 'reuse';
  if ((hr >>> 0) === DXGI_ERROR_ACCESS_LOST) return 'lost';
  if (hr !== S_OK) return 'reuse';

  const resource = ppResource.readBigUInt64LE(0);
  if (resource === 0n) {
    gpu.vcall(duplication, DUPL_RELEASE_FRAME, [], [], FFIType.i32);
    return 'reuse';
  }
  const accumulated = frameInfo.readUInt32LE(16);
  const lastPresent = frameInfo.readBigInt64LE(0);
  if (accumulated === 0 && lastPresent === 0n) {
    gpu.comRelease(resource);
    gpu.vcall(duplication, DUPL_RELEASE_FRAME, [], [], FFIType.i32);
    return 'reuse';
  }

  if (gpu.vcall(resource, gpu.IUNKNOWN_QUERY_INTERFACE, [FFIType.ptr, FFIType.ptr], [tex2dIid.ptr!, ppTex.ptr!]) !== S_OK) {
    gpu.comRelease(resource);
    gpu.vcall(duplication, DUPL_RELEASE_FRAME, [], [], FFIType.i32);
    return 'reuse';
  }
  const srcTex = ppTex.readBigUInt64LE(0);

  // Lazily build the SRV texture mirroring the duplicated frame's size/format.
  if (deskTex === null) {
    gpu.vcall(srcTex, 10 /* ID3D11Texture2D::GetDesc */, [FFIType.ptr], [descBuf.ptr!], FFIType.void);
    deskW = descBuf.readUInt32LE(0);
    deskH = descBuf.readUInt32LE(4);
    const fmt = descBuf.readUInt32LE(16) || gpu.DXGI_FORMAT_B8G8R8A8_UNORM;
    deskTex = gpu.makeTexture({ w: deskW, h: deskH, format: fmt, srv: true });
  }

  // Copy WHILE the frame is held — its pixels are only valid before ReleaseFrame.
  gpu.copyResource(deskTex.tex, srcTex);

  gpu.comRelease(srcTex);
  gpu.comRelease(resource);
  gpu.vcall(duplication, DUPL_RELEASE_FRAME, [], [], FFIType.i32);
  return 'ok';
}

// ── GDI HUD ───────────────────────────────────────────────────────────────────
const hudFont = GDI32.CreateFontW(-20, 0, 0, 0, 600, 0, 0, 0, 0, 0, 0, 4 /* ANTIALIASED_QUALITY */, 0, encodeWide('Consolas').ptr!);
const TRANSPARENT_BK = 1;

function drawHud(effect: number, fps: number): void {
  const dc = User32.GetDC(win.hwnd);
  if (!dc) return;
  const prevFont = GDI32.SelectObject(dc, hudFont);
  GDI32.SetBkMode(dc, TRANSPARENT_BK);
  const line = `Live desktop · ${EFFECT_NAMES[effect]} · ${fps} fps · ${g.gpuName} · SPACE / 1-5 to cycle · ESC to quit`;
  const text = encodeWide(line);
  const len = line.length;
  GDI32.SetTextColor(dc, 0x00000000);
  GDI32.TextOutW(dc, 19, 19, text.ptr!, len);
  GDI32.SetTextColor(dc, 0x00f5e6c8); // BGR: warm white-cyan
  GDI32.TextOutW(dc, 18, 18, text.ptr!, len);
  GDI32.SelectObject(dc, prevFont);
  User32.ReleaseDC(win.hwnd, dc);
}

// ── Main loop ───────────────────────────────────────────────────────────────────
let effect = 0;
let lastCycle = performance.now();
const start = performance.now();
let frames = 0;
let captured = 0;
let fps = 0;
let fpsFrames = 0;
let fpsTimer = start;

// SPACE / number-key edge detection (key state is level-triggered).
let spacePrev = false;
const numPrev = [false, false, false, false, false];

while (!win.shouldClose()) {
  win.pump();
  if (win.shouldClose()) break;
  const now = performance.now();
  const t = (now - start) / 1000;

  // Effect cycling: SPACE (next), number keys 1-5 (jump), or auto every CYCLE_MS.
  const spaceNow = win.keyDown(VK_SPACE);
  if (spaceNow && !spacePrev) {
    effect = (effect + 1) % NUM_EFFECTS;
    lastCycle = now;
  }
  spacePrev = spaceNow;
  for (let k = 0; k < NUM_EFFECTS; k += 1) {
    const keyNow = win.keyDown(0x31 + k); // VK_1 .. VK_5
    if (keyNow && !numPrev[k]) {
      effect = k;
      lastCycle = now;
    }
    numPrev[k] = keyNow;
  }
  if (now - lastCycle >= CYCLE_MS) {
    effect = (effect + 1) % NUM_EFFECTS;
    lastCycle = now;
  }

  // Grab the live desktop into the SRV texture.
  const status = captureFrame();
  if (status === 'lost') {
    gpu.comRelease(duplication);
    const re = setupDuplication(g.device);
    if (typeof re === 'bigint') duplication = re;
    // If re-acquire fails this frame, just reuse the last image and try next frame.
  } else if (status === 'ok') {
    captured += 1;
  }

  // Render the post-fx pass (skip until the first real frame defines the texture).
  if (deskTex !== null) {
    cbBuf.writeFloatLE(BBW, 0);
    cbBuf.writeFloatLE(BBH, 4);
    cbBuf.writeFloatLE(t, 8);
    cbBuf.writeFloatLE(effect, 12);
    gpu.updateConstantBuffer(cb, cbBuf);

    gpu.setRenderTargets([g.backBufferRTV]);
    gpu.setViewport(BBW, BBH);
    gpu.clear(g.backBufferRTV, [0, 0, 0, 1]);
    gpu.vsSet(vs);
    gpu.psSet(pixelShaders[effect]!, { cb: [cb], srv: [deskTex.srv!], samp: [sampler] });
    gpu.drawFullscreenTriangle();
    // Unbind the SRV so next capture's CopyResource into the same texture is legal.
    gpu.psSet(pixelShaders[effect]!, { srv: [0n] });

    g.present(false);
    frames += 1;
  }

  drawHud(effect, fps);

  // FPS accounting (once per second).
  fpsFrames += 1;
  if (now - fpsTimer >= 1000) {
    fps = Math.round((fpsFrames * 1000) / (now - fpsTimer));
    fpsFrames = 0;
    fpsTimer = now;
  }

  if (durationMs > 0 && now - start >= durationMs) break;
}

// ── Teardown ────────────────────────────────────────────────────────────────────
const elapsed = (performance.now() - start) / 1000;
console.log(`desktop-shader: presented ${frames} frames (${captured} live desktop captures) over ${elapsed.toFixed(2)}s on ${g.driver} (${g.gpuName}).`);

GDI32.DeleteObject(hudFont);
gpu.comRelease(sampler);
gpu.comRelease(cb);
for (const ps of pixelShaders) gpu.comRelease(ps);
for (const blob of psBlobs) gpu.blobRelease(blob);
gpu.comRelease(vs);
gpu.blobRelease(vsCode.blob);
if (deskTex !== null) {
  gpu.comRelease(deskTex.srv!);
  gpu.comRelease(deskTex.tex);
}
gpu.comRelease(duplication);
gpu.comRelease(g.backBufferRTV);
gpu.comRelease(g.swapChain);
gpu.comRelease(g.context);
gpu.comRelease(g.device);
win.destroy();
process.exit(0);
