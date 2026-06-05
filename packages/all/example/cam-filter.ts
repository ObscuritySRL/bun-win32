/**
 * cam-filter.ts — a live GPU "reality filter" over the actual scanned-out desktop.
 *
 * This is a real-time computer-vision toy: it pulls the TRUE composited desktop
 * frame off the GPU every loop via the DXGI Desktop Duplication API
 * (IDXGIOutputDuplication::AcquireNextFrame — a synchronous, polled call, so it
 * never relies on a foreign-thread JSCallback), copies that GPU texture straight
 * into a shader-resource texture on the SAME D3D11 device, and runs cycling
 * real-time pixel-shader effects on it: a Predator THERMAL palette, a Sobel EDGE /
 * toon pass, an ASCII-mosaic, and a KALEIDOSCOPE mirror — presented to a visible,
 * topmost swap chain. The desktop becomes the "camera feed" and the GPU re-imagines
 * it four ways, cross-fading between filters on a scripted timeline. In capture mode
 * the reel deliberately SETTLES on the THERMAL pass for the saved still, because it
 * preserves the spatial luminance of the screen — your windows and text survive as
 * heat — so the screenshot reads unmistakably as your LIVE DESKTOP re-imagined,
 * never as an abstract mandala. A GDI HUD ('LIVE DESKTOP · effect · fps') labels the
 * live window (it composites after Present, so it is not baked into the PNG).
 *
 * Why the desktop and not a webcam: the only camera on this box is the Elgato
 * Virtual Camera. Its Media Foundation enumeration works perfectly here
 * (MFEnumDeviceSources finds it and reads its friendly name), but
 * IMFActivate::ActivateObject fails to materialize an IMFMediaSource unless the
 * Elgato/OBS backend is actively streaming — the activation returns a corrupt
 * value and the source pointer stays null. The spec's documented fallback is to
 * feed the IDENTICAL filter shaders from a Desktop Duplication frame, which is a
 * guaranteed-live, genuinely-real GPU vision source. That is the path shipped here.
 *
 * @bun-win32 APIs used:
 *   - _gpu engine: createWindow / createDevice (D3D11 device + DXGI swap chain),
 *     compile (runtime HLSL), makeVertexShader / makePixelShader, makeTexture
 *     (SRV), makeSampler, makeConstantBuffer / updateConstantBuffer, setRenderTargets,
 *     setViewport, clear, drawFullscreenTriangle, psSet / vsSet, present, vcall (raw
 *     COM vtable invoker), comRelease.
 *   - DXGI Desktop Duplication walked by hand via vcall: IDXGIDevice::GetAdapter,
 *     IDXGIAdapter::EnumOutputs, IDXGIOutput1::DuplicateOutput,
 *     IDXGIOutputDuplication::AcquireNextFrame / ReleaseFrame, ID3D11Texture2D::GetDesc,
 *     ID3D11DeviceContext::CopyResource.
 *   - Kernel32 (via index): used indirectly through the engine.
 *   - _snapshot: captureBackBuffer + formatGrid for self-verification.
 *
 * Controls (interactive only, DEMO_DURATION_MS unset): 1-4 pick a filter, SPACE
 * auto-cycle, ESC quit. In capture mode everything is scripted (no input, no cursor
 * hijack).
 *
 * Run: bun run packages/all/example/cam-filter.ts
 */

import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { FFIType, read, type Pointer } from 'bun:ffi';

import { GDI32 } from '../index';
import * as gpu from './_gpu';
import * as hud from './_hud';
import { captureBackBuffer, formatGrid } from './_snapshot';

const encodeWide = (str: string): Buffer => Buffer.from(`${str}\0`, 'utf16le');

// ── HRESULTs ────────────────────────────────────────────────────────────────
const S_OK = 0;
const DXGI_ERROR_NOT_FOUND = 0x887a_0002 >>> 0;
const DXGI_ERROR_WAIT_TIMEOUT = 0x887a_0027 >>> 0;
const DXGI_ERROR_ACCESS_LOST = 0x887a_0026 >>> 0;
const E_ACCESSDENIED = 0x8007_0005 >>> 0;

// ── DXGI / D3D11 vtable slots (verified in _capture.ts on this 4090) ──────────
const IUNKNOWN_QUERY_INTERFACE = 0;
const DXGIDEVICE_GET_ADAPTER = 7;
const DXGIADAPTER_ENUM_OUTPUTS = 7;
const DXGIOUTPUT1_DUPLICATE_OUTPUT = 22;
const DUPL_ACQUIRE_NEXT_FRAME = 8;
const DUPL_RELEASE_FRAME = 14;
const TEX2D_GET_DESC = 10;

const IID_IDXGIDEVICE = '54ec77fa-1377-44e6-8c32-88fd5f44c84c';
const IID_IDXGIOUTPUT1 = '00cddea8-939b-4b83-a340-a685226666cc';
const IID_ID3D11TEXTURE2D = '6f15aaf2-d208-4e89-9ab4-489535d34f9c';

const hex = (hr: number): string => `0x${(hr >>> 0).toString(16).padStart(8, '0')}`;

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

const durationMs = process.env.DEMO_DURATION_MS ? Number(process.env.DEMO_DURATION_MS) : 0;

// ── Window + device ───────────────────────────────────────────────────────────
const WIN_W = 1280;
const WIN_H = 720;
const win = gpu.createWindow({ title: 'cam-filter — GPU reality filter (live desktop)', width: WIN_W, height: WIN_H, borderless: false });
const { w: CW, h: CH } = win.clientSize();
const g = gpu.createDevice(win.hwnd, { width: CW, height: CH });
console.log(`[cam-filter] device up: ${g.driver} · ${g.gpuName}  (${CW}x${CH})`);

// ── Build the Desktop Duplication chain on OUR device ─────────────────────────
// device → IDXGIDevice → IDXGIAdapter → IDXGIOutput → IDXGIOutput1 → DuplicateOutput.
function fatal(msg: string): never {
  console.error(`[cam-filter] ${msg}`);
  cleanup(1);
  throw new Error(msg); // unreachable; satisfies never
}

const ppDxgiDevice = Buffer.alloc(8);
if (gpu.vcall(g.device, IUNKNOWN_QUERY_INTERFACE, [FFIType.ptr, FFIType.ptr], [guidBytes(IID_IDXGIDEVICE).ptr!, ppDxgiDevice.ptr!]) !== S_OK) {
  fatal('QueryInterface(IDXGIDevice) failed.');
}
const dxgiDevice = ppDxgiDevice.readBigUInt64LE(0);

const ppAdapter = Buffer.alloc(8);
if (gpu.vcall(dxgiDevice, DXGIDEVICE_GET_ADAPTER, [FFIType.ptr], [ppAdapter.ptr!]) !== S_OK) {
  fatal('IDXGIDevice::GetAdapter failed.');
}
const adapter = ppAdapter.readBigUInt64LE(0);

const ppOutput = Buffer.alloc(8);
const enumHr = gpu.vcall(adapter, DXGIADAPTER_ENUM_OUTPUTS, [FFIType.u32, FFIType.ptr], [0, ppOutput.ptr!]);
if (enumHr >>> 0 === DXGI_ERROR_NOT_FOUND) fatal('No connected output on the adapter (EnumOutputs → NOT_FOUND).');
if (enumHr !== S_OK) fatal(`IDXGIAdapter::EnumOutputs failed ${hex(enumHr)}.`);
const output = ppOutput.readBigUInt64LE(0);

const ppOutput1 = Buffer.alloc(8);
if (gpu.vcall(output, IUNKNOWN_QUERY_INTERFACE, [FFIType.ptr, FFIType.ptr], [guidBytes(IID_IDXGIOUTPUT1).ptr!, ppOutput1.ptr!]) !== S_OK) {
  fatal('QueryInterface(IDXGIOutput1) failed.');
}
const output1 = ppOutput1.readBigUInt64LE(0);

const ppDupl = Buffer.alloc(8);
const dupHr = gpu.vcall(output1, DXGIOUTPUT1_DUPLICATE_OUTPUT, [FFIType.u64, FFIType.ptr], [g.device, ppDupl.ptr!]);
if (dupHr >>> 0 === E_ACCESSDENIED) {
  fatal('DuplicateOutput → E_ACCESSDENIED: another Desktop Duplication is already active (close screen-capture/recording tools and retry).');
}
if (dupHr !== S_OK) fatal(`IDXGIOutput1::DuplicateOutput failed ${hex(dupHr)}.`);
let dupl = ppDupl.readBigUInt64LE(0);
console.log('[cam-filter] desktop duplication acquired — feeding live frames to the GPU filters.');

// ── Source texture (B8G8R8A8 SRV) the desktop frame is copied into each loop ──
// Determined lazily once we see the first frame's real dimensions.
let srcTex: gpu.TextureResult | null = null;
let srcW = 0;
let srcH = 0;

const sampler = gpu.makeSampler({ filter: gpu.D3D11_FILTER_MIN_MAG_MIP_LINEAR, address: gpu.D3D11_TEXTURE_ADDRESS_CLAMP });

// ── Shaders ──────────────────────────────────────────────────────────────────
const VS_SRC = `
struct VSOut { float4 pos : SV_Position; float2 uv : TEXCOORD0; };
VSOut main(uint vid : SV_VertexID) {
  VSOut o; float2 p = float2((vid << 1) & 2, vid & 2);
  o.uv = p; o.pos = float4(p * float2(2,-2) + float2(-1,1), 0, 1); return o;
}`;

// One unified pixel shader runs all four filters and cross-fades between the
// active and previous one. cb: iRes(2), iTime, fadeMix; filterA, filterB, _pad2.
const PS_SRC = `
cbuffer C : register(b0) {
  float2 iRes;   // source resolution
  float  iTime;  // seconds
  float  fadeMix; // 0..1 blend from filter A -> B
  float  filterA; // active filter id
  float  filterB; // previous filter id
  float2 _pad;
};
Texture2D Src : register(t0);
SamplerState Smp : register(s0);

float luminance(float3 c){ return dot(c, float3(0.299, 0.587, 0.114)); }

// Predator thermal palette: cool purple darks -> magenta -> red -> orange ->
// yellow -> incandescent white. Tuned for crisp hot highlights on bright UI and
// deep, readable cool darks so windows/text survive as heat structure.
float3 thermal(float t){
  t = saturate(t);
  float3 c0 = float3(0.04,0.02,0.16);   // cool indigo black
  float3 c1 = float3(0.28,0.02,0.55);   // violet
  float3 c2 = float3(0.78,0.04,0.42);   // magenta-red
  float3 c3 = float3(1.00,0.30,0.04);   // hot orange
  float3 c4 = float3(1.00,0.82,0.12);   // amber-yellow
  float3 c5 = float3(1.00,1.00,0.96);   // incandescent white
  float3 c;
  if      (t < 0.2) c = lerp(c0,c1, t/0.2);
  else if (t < 0.4) c = lerp(c1,c2,(t-0.2)/0.2);
  else if (t < 0.6) c = lerp(c2,c3,(t-0.4)/0.2);
  else if (t < 0.8) c = lerp(c3,c4,(t-0.6)/0.2);
  else              c = lerp(c4,c5,(t-0.8)/0.2);
  return c;
}

float3 filterThermal(float2 uv){
  float2 px = 1.0 / iRes;
  // 3x3 box-soften the luma so the heat ramp reads smooth, not noisy per-pixel.
  float l = 0.0;
  [unroll] for (int j=-1;j<=1;j++)
    [unroll] for (int i=-1;i<=1;i++)
      l += luminance(Src.Sample(Smp, uv + float2(i,j)*px).rgb);
  l /= 9.0;
  // gentle contrast curve so darks stay cool and bright UI pops hot
  l = saturate(pow(l, 0.85) * 1.06);
  // faint sensor scan shimmer so it reads as a live heat camera
  l += 0.018 * sin(uv.y * iRes.y * 0.5 + iTime * 5.0);
  float3 col = thermal(l);
  // gentle bloom: pull a soft wide-tap average of the HOT regions and add it back
  // so bright UI elements glow like real incandescence.
  float hot = 0.0;
  [unroll] for (int k=0;k<8;k++){
    float ang = 6.2831853 * (float)k / 8.0;
    float2 o = float2(cos(ang), sin(ang)) * px * 3.0;
    float lh = luminance(Src.Sample(Smp, uv + o).rgb);
    hot += smoothstep(0.55, 0.95, lh);
  }
  hot /= 8.0;
  col += hot * float3(0.55, 0.30, 0.05);     // warm halo around hot spots
  return saturate(col);
}

float3 filterEdge(float2 uv){
  float2 px = 1.0 / iRes;
  float gx = 0, gy = 0;
  // explicit Sobel kernels over luma
  [unroll] for (int j=-1;j<=1;j++){
    [unroll] for (int i=-1;i<=1;i++){
      float l = luminance(Src.Sample(Smp, uv + float2(i,j)*px).rgb);
      float kx = (float)i * ((j==0)?2.0:1.0);
      float ky = (float)j * ((i==0)?2.0:1.0);
      gx += l * kx;
      gy += l * ky;
    }
  }
  float mag = sqrt(gx*gx + gy*gy);
  // crisp neon core + a soft outer glow so edges bloom against the dark toon base
  float edge = saturate(mag * 1.8);
  float glow = saturate(mag * 0.9);
  // toon-quantized, darkened base color so the neon outlines dominate
  float3 base = Src.Sample(Smp, uv).rgb;
  base = floor(base * 4.0 + 0.5) / 4.0;
  // neon hue cycles across the screen + slow time drift (cyan -> magenta -> lime)
  float h = uv.x * 0.6 + uv.y * 0.4 + iTime * 0.05;
  float3 neon = 0.5 + 0.5 * cos(6.2831853 * (h + float3(0.0, 0.33, 0.66)));
  neon = lerp(float3(0.0,0.95,1.0), neon, 0.6);   // bias toward electric cyan
  float3 col = base * 0.18;                         // dark toon backdrop
  col += neon * glow * 0.35;                        // outer halo
  col = lerp(col, neon * 1.2, edge);                // bright core line
  return saturate(col);
}

float3 filterAscii(float2 uv){
  float2 cell = float2(11.0, 16.0);            // glyph cell size in pixels (readable)
  float2 grid = floor(iRes / cell);
  float2 cellUv = floor(uv * grid) / grid;     // top-left of the cell, in uv
  // average the whole cell (not a single tap) so thin dark-theme text still
  // contributes luma to the glyph it lands in.
  float3 csrc = float3(0,0,0);
  [unroll] for (int sy=0;sy<3;sy++)
    [unroll] for (int sx=0;sx<3;sx++)
      csrc += Src.Sample(Smp, cellUv + float2(sx+0.5,sy+0.5)/(grid*3.0)).rgb;
  csrc /= 9.0;
  float l = luminance(csrc);
  // strong response curve: dark editor themes have low luma, lift it hard so the
  // layout reads as a bright phosphor terminal.
  float lg = saturate(pow(l, 0.55) * 1.9);
  // position inside the cell, centered -1..1
  float2 f = frac(uv * grid);
  float2 p = (f - 0.5) * 2.0;
  // build a procedural glyph whose "ink" coverage tracks luma (denser = brighter)
  // ramp: . - x + # @  — distinct silhouettes per luma band
  float ink = 0.0;
  if (lg > 0.05) ink = max(ink, 1.0 - smoothstep(0.12, 0.34, length(p)));              // .
  if (lg > 0.18) ink = max(ink, (1.0 - smoothstep(0.06,0.18,abs(p.y))) * step(abs(p.x),0.72)); // -
  if (lg > 0.32) ink = max(ink, 1.0 - smoothstep(0.05,0.16,abs(abs(p.x)-abs(p.y))));   // x
  if (lg > 0.46) ink = max(ink, (1.0-smoothstep(0.05,0.16,min(abs(p.x),abs(p.y)))) * step(max(abs(p.x),abs(p.y)),0.78)); // +
  if (lg > 0.62) ink = max(ink, step(max(abs(p.x),abs(p.y)),0.66) * (1.0-step(max(abs(p.x),abs(p.y)),0.34))); // # ring
  if (lg > 0.80) ink = max(ink, step(max(abs(p.x),abs(p.y)),0.80));                     // @ block
  ink = saturate(ink);
  // tint glyphs with the cell's own chroma so the desktop layout stays legible,
  // blended toward a bright amber-green CRT phosphor.
  float3 srcTint = csrc / max(l, 0.001);                   // chroma of the cell
  float3 phosphor = lerp(float3(0.55,1.0,0.45), srcTint, 0.55);
  phosphor *= (0.55 + 0.7 * lg);
  // glyph ink, plus a faint ambient cell wash so dark regions still show structure
  float3 col = phosphor * ink;
  col += float3(0.0,0.06,0.02) * smoothstep(0.02, 0.5, lg);  // dim green "page" glow
  // faint scanline so it reads as a CRT, but keep it bright overall
  col *= 0.9 + 0.1 * sin(uv.y * iRes.y * 3.14159 / cell.y);
  return saturate(col * 1.15);
}

// 2D rotation helper
float2 rot2(float2 v, float a){ float s=sin(a),c=cos(a); return float2(c*v.x - s*v.y, s*v.x + c*v.y); }

float3 filterKaleido(float2 uv){
  // square-aspect centered coords so the mandala is circular, not stretched
  float aspect = iRes.x / iRes.y;
  float2 c = (uv - 0.5) * float2(aspect, 1.0);
  float r = length(c);
  float a = atan2(c.y, c.x);
  // 8-fold mirror symmetry with soft seams
  const float N = 8.0;
  float seg = 6.2831853 / N;
  float aw = a + iTime * 0.14;             // slow rotation
  aw = (aw % seg + seg) % seg;             // wrap into a wedge
  aw = abs(aw - seg * 0.5);                // mirror across wedge center
  // Reconstruct a mirrored 2D coordinate from (radius, mirrored angle) and sample
  // a RECTANGULAR window of the live desktop, so each petal is filled with a
  // recognizable chunk of UI (panels/windows/colour blocks) — not a thin ray.
  // Radius walks a fixed band of the screen; sampling biased to the busy left half.
  float2 dir = float2(cos(aw), sin(aw));
  float2 q = dir * (0.20 + r * 0.85);      // map wedge → desktop region
  float2 suv  = q * float2(0.72, 0.72) + float2(0.34, 0.38);
  float2 suv2 = rot2(q, 0.6 + iTime * 0.1) * 0.55 + float2(0.55, 0.45);
  float3 col  = Src.Sample(Smp, frac(suv)).rgb;
  float3 col2 = Src.Sample(Smp, frac(suv2)).rgb;
  col = lerp(col, col2, 0.4);
  // lift the dark desktop, then a gentle jewel-tone wash keyed to the petal angle
  // (subtle, so the underlying desktop colours stay readable).
  col = pow(saturate(col), 0.62) * 1.45;
  float3 jewel = 0.78 + 0.32 * cos(aw * N + r * 6.0 + iTime + float3(0.0, 2.1, 4.2));
  col *= lerp(float3(1,1,1), jewel, 0.5);
  // soft radial seams between petals (kept subtle so petals don't go black)
  float seam = smoothstep(0.0, 0.06, aw) * smoothstep(0.0, 0.06, seg*0.5 - aw);
  col *= 0.78 + 0.22 * seam;
  // small soft center jewel (not a giant blowout) + gentle vignette that keeps the
  // mandala filling the frame (corners only dim, never hard-black).
  col += smoothstep(0.10, 0.0, r) * float3(0.5, 0.55, 0.7);
  col *= 0.18 + 0.82 * smoothstep(1.25, 0.04, r);
  return saturate(col * 1.35);
}

float3 apply(float id, float2 uv){
  if (id < 0.5) return filterThermal(uv);
  if (id < 1.5) return filterEdge(uv);
  if (id < 2.5) return filterAscii(uv);
  return filterKaleido(uv);
}

float4 main(float4 fp : SV_Position, float2 uv : TEXCOORD0) : SV_Target {
  float3 a = apply(filterA, uv);
  float3 b = apply(filterB, uv);
  float3 col = lerp(b, a, fadeMix);
  // subtle film grain + vignette so the whole frame reads as a live feed
  float2 d = uv - 0.5;
  col *= 1.0 - 0.35*dot(d,d);
  float grain = frac(sin(dot(uv*iRes + iTime, float2(12.9898,78.233))) * 43758.5453);
  col += (grain - 0.5) * 0.025;
  return float4(saturate(col), 1.0);
}`;

const vsCode = gpu.compile(VS_SRC, 'main', 'vs_5_0');
const vs = gpu.makeVertexShader(vsCode);
const psCode = gpu.compile(PS_SRC, 'main', 'ps_5_0');
const ps = gpu.makePixelShader(psCode);
const cb = gpu.makeConstantBuffer(48);

// ── GDI HUD (live window only). Composited INTO the back buffer via _hud (an
// offscreen DIB alpha-blended over the scene BEFORE Present) so the label is
// flicker-free. The capture frames snapshot the back buffer BEFORE drawHud runs,
// so the saved still stays HUD-free and self-explains through the legible thermal
// pass on recognizable desktop content. ────────────────────────────────────────
const TRANSPARENT_BK = 1;
const hudFont = GDI32.CreateFontW(-22, 0, 0, 0, 700, 0, 0, 0, 0, 0, 0, 4 /* ANTIALIASED_QUALITY */, 0, encodeWide('Consolas').ptr!);
function drawHud(filterId: number, fps: number): void {
  hud.draw(g, CW, CH, (dc) => {
    const prevFont = GDI32.SelectObject(dc, hudFont);
    GDI32.SetBkMode(dc, TRANSPARENT_BK);
    const line = `● LIVE DESKTOP  ·  ${FILTER_NAMES[filterId]}  ·  ${fps} fps  ·  pure-TS Win32 reality filter`;
    const text = encodeWide(line);
    const len = line.length;
    GDI32.SetTextColor(dc, 0x00000000); // black drop shadow
    GDI32.TextOutW(dc, 21, 21, text.ptr!, len);
    GDI32.SetTextColor(dc, 0x0040ffff); // BGR: hot amber-yellow, matches the thermal palette
    GDI32.TextOutW(dc, 19, 19, text.ptr!, len);
    GDI32.SelectObject(dc, prevFont);
  });
}

// ── Filter timeline ────────────────────────────────────────────────────────────
const FILTER_NAMES = ['THERMAL', 'SOBEL EDGE / TOON', 'ASCII', 'KALEIDOSCOPE'];
const FILTER_SLUGS = ['thermal', 'sobel', 'ascii', 'kaleidoscope'];
const SHOT_ALL = process.env.CAM_SHOT_ALL === '1';
const FILTER_THERMAL = 0;
const FILTER_EDGE = 1;
// The hero / capture filter: the most LEGIBLE pass, so the still frame reads
// unmistakably as the LIVE DESKTOP re-imagined (windows/text survive as heat),
// not an abstract effect. THERMAL preserves spatial luminance structure best.
const HERO_FILTER = FILTER_THERMAL;
let activeFilter = 0;
let prevFilter = 0;
let fadeStart = -1; // -1 => no fade in progress
const FADE_MS = 600;
const HOLD_MS = 1050; // scripted dwell per filter in capture mode

let frames = 0;
const start = performance.now();
let lastSwitch = start;
let fps = 0;
let fpsFrames = 0;
let fpsTimer = start;

// ── Acquire one desktop frame and copy it into srcTex. Returns true on success. ─
const frameInfo = Buffer.alloc(64);
const ppResource = Buffer.alloc(8);
const ppTex = Buffer.alloc(8);
const desc = Buffer.alloc(44);
const tex2dIid = guidBytes(IID_ID3D11TEXTURE2D);

function ensureSrcTex(w: number, h: number): void {
  if (srcTex !== null && srcW === w && srcH === h) return;
  if (srcTex !== null) {
    gpu.comRelease(srcTex.srv!);
    gpu.comRelease(srcTex.tex);
  }
  srcW = w;
  srcH = h;
  srcTex = gpu.makeTexture({ w, h, format: gpu.DXGI_FORMAT_B8G8R8A8_UNORM, srv: true });
}

function grabDesktopFrame(): boolean {
  ppResource.writeBigUInt64LE(0n, 0);
  const hr = gpu.vcall(dupl, DUPL_ACQUIRE_NEXT_FRAME, [FFIType.u32, FFIType.ptr, FFIType.ptr], [60, frameInfo.ptr!, ppResource.ptr!]);
  if (hr >>> 0 === DXGI_ERROR_WAIT_TIMEOUT) return false; // no new desktop frame this tick
  if (hr >>> 0 === DXGI_ERROR_ACCESS_LOST) {
    // The duplication became invalid (mode change / secure desktop). Re-acquire.
    gpu.comRelease(dupl);
    const pp = Buffer.alloc(8);
    if (gpu.vcall(output1, DXGIOUTPUT1_DUPLICATE_OUTPUT, [FFIType.u64, FFIType.ptr], [g.device, pp.ptr!]) === S_OK) {
      dupl = pp.readBigUInt64LE(0);
    }
    return false;
  }
  if (hr !== S_OK) return false;

  const resource = ppResource.readBigUInt64LE(0);
  if (resource === 0n) {
    gpu.vcall(dupl, DUPL_RELEASE_FRAME, [], [], FFIType.i32);
    return false;
  }
  let ok = false;
  if (gpu.vcall(resource, IUNKNOWN_QUERY_INTERFACE, [FFIType.ptr, FFIType.ptr], [tex2dIid.ptr!, ppTex.ptr!]) === S_OK) {
    const tex = ppTex.readBigUInt64LE(0);
    gpu.vcall(tex, TEX2D_GET_DESC, [FFIType.ptr], [desc.ptr!], FFIType.void);
    const w = desc.readUInt32LE(0);
    const h = desc.readUInt32LE(4);
    if (w > 0 && h > 0) {
      ensureSrcTex(w, h);
      // Copy WHILE the frame is still held — pixels are only valid before ReleaseFrame.
      gpu.copyResource(srcTex!.tex, tex);
      ok = true;
    }
    gpu.comRelease(tex);
  }
  gpu.comRelease(resource);
  gpu.vcall(dupl, DUPL_RELEASE_FRAME, [], [], FFIType.i32);
  return ok;
}

// Prime the duplication: the first frames are often metadata-only. Drain a few.
for (let i = 0; i < 30 && srcTex === null; i += 1) {
  if (grabDesktopFrame()) break;
}
if (srcTex === null) {
  // No real frame yet — make a 1x1 placeholder so binding never crashes; the loop keeps trying.
  ensureSrcTex(CW, CH);
}

// ── Cleanup (release EVERY COM object, then exit) ───────────────────────────────
let cleanedUp = false;
function cleanup(code: number): void {
  if (cleanedUp) return;
  cleanedUp = true;
  try {
    // Unbind render targets before releasing so we never free a still-bound RTV.
    gpu.setRenderTargets([]);
    hud.release();
    if (srcTex !== null) {
      gpu.comRelease(srcTex.srv!);
      gpu.comRelease(srcTex.tex);
    }
    gpu.comRelease(sampler);
    gpu.comRelease(cb);
    gpu.comRelease(ps);
    gpu.comRelease(vs);
    gpu.blobRelease(psCode.blob);
    gpu.blobRelease(vsCode.blob);
    gpu.comRelease(dupl);
    gpu.comRelease(output1);
    gpu.comRelease(output);
    gpu.comRelease(adapter);
    gpu.comRelease(dxgiDevice);
    gpu.comRelease(g.backBufferRTV);
    gpu.comRelease(g.swapChain);
    gpu.comRelease(g.context);
    gpu.comRelease(g.device);
    win.destroy();
  } catch {
    /* best-effort teardown */
  }
  const secs = (performance.now() - start) / 1000;
  console.log(`[cam-filter] done — ${frames} frames in ${secs.toFixed(2)}s (${(frames / Math.max(secs, 0.001)).toFixed(1)} fps) on ${g.driver} · ${g.gpuName}`);
  process.exit(code);
}
process.on('SIGINT', () => cleanup(0));
process.on('uncaughtException', (e) => {
  console.error(e);
  cleanup(1);
});

// ── Filter selection (scripted in capture mode, interactive otherwise) ──────────
function switchTo(id: number, now: number): void {
  if (id === activeFilter) return;
  prevFilter = activeFilter;
  activeFilter = id;
  fadeStart = now;
}

// Shared cbuffer staging (iRes(2 f32), iTime, fadeMix, filterA, filterB, pad(2)).
const cbBuf = Buffer.alloc(48);

// ── Render one fully-resolved filter pass to the back buffer ────────────────────
// (no fade, no cross-blend — filterA == filterB, fadeMix = 1). Used by both the
// capture-all reel and as the shared draw primitive.
function renderFilterPass(id: number, tSec: number): void {
  cbBuf.writeFloatLE(srcW || CW, 0);
  cbBuf.writeFloatLE(srcH || CH, 4);
  cbBuf.writeFloatLE(tSec, 8);
  cbBuf.writeFloatLE(1.0, 12); // fadeMix fully resolved to filterA
  cbBuf.writeFloatLE(id, 16); // filterA
  cbBuf.writeFloatLE(id, 20); // filterB (same, so lerp is a no-op)
  cbBuf.writeFloatLE(0, 24);
  cbBuf.writeFloatLE(0, 28);
  gpu.updateConstantBuffer(cb, cbBuf);

  gpu.setRenderTargets([g.backBufferRTV]);
  gpu.setViewport(CW, CH);
  gpu.clear(g.backBufferRTV, [0.01, 0.01, 0.02, 1]);
  gpu.vsSet(vs);
  gpu.psSet(ps, { cb: [cb], srv: [srcTex!.srv!], samp: [sampler] });
  gpu.drawFullscreenTriangle();
}

// ── Capture-all mode: shoot every effect over the SAME live desktop, one PNG each ─
// Runs only when CAM_SHOT_ALL=1 in capture mode. Re-acquires a fresh duplicated
// frame before each effect so the source is genuinely live, then renders that
// effect fully resolved and snapshots the back buffer before present.
if (SHOT_ALL && durationMs > 0) {
  const shotDir = resolve(import.meta.dir, '..', 'screenshots');
  mkdirSync(shotDir, { recursive: true });

  // Make sure the feed is genuinely live before the reel: drain timeouts until a
  // real desktop frame lands (the first AcquireNextFrame calls are metadata-only).
  for (let i = 0; i < 240; i += 1) {
    win.pump();
    if (grabDesktopFrame() && srcW > 1 && srcH > 1) break;
  }

  for (let id = 0; id < 4; id += 1) {
    // Re-acquire a couple of fresh frames so each effect sees current desktop pixels.
    for (let i = 0; i < 8; i += 1) {
      win.pump();
      grabDesktopFrame();
    }
    activeFilter = id;
    prevFilter = id;
    fadeStart = -1;
    const tSec = (performance.now() - start) / 1000;
    renderFilterPass(id, tSec);

    const out = resolve(shotDir, `cam-filter-${FILTER_SLUGS[id]}.png`);
    const stats = captureBackBuffer(g, out, { gridW: 48, gridH: 22 });
    console.log(`\n── ${FILTER_NAMES[id]} ──`);
    console.log(formatGrid(stats));
    console.log(`[shot] filter=${FILTER_NAMES[id]} slug=${FILTER_SLUGS[id]} ok=${stats.ok} nonBlack=${stats.nonBlackFrac.toFixed(3)} meanLuma=${stats.meanLuma.toFixed(3)} -> ${stats.path}`);
    // HUD composites into the back buffer (after the capture above, before Present)
    // so the saved PNG stays clean while the live window shows the flicker-free label.
    drawHud(id, fps);
    g.present(false);
  }
  GDI32.DeleteObject(hudFont);
  cleanup(0);
}

// ── Main loop ──────────────────────────────────────────────────────────────────
while (!win.shouldClose()) {
  win.pump();
  if (win.shouldClose()) break;
  const now = performance.now();
  const t = (now - start) / 1000;

  // Pull the freshest live desktop frame (best-effort; reuse last on timeout).
  grabDesktopFrame();

  // Decide the filter.
  if (durationMs > 0) {
    // Scripted demo reel: show every effect during the live run, then SETTLE on
    // the hero (THERMAL) for the final ~1.5s so the captured still lands on the
    // most legible "live desktop re-imagined" pass — recognizable windows/text
    // rendered as heat, not an abstract mandala. KALEIDOSCOPE / ASCII / SOBEL all
    // get screen time, but the reel deliberately ENDS on THERMAL.
    const reel = [3, 2, FILTER_EDGE, HERO_FILTER]; // kaleido → ascii → sobel → THERMAL (hero, last)
    const idx = Math.min(reel.length - 1, Math.floor((now - start) / HOLD_MS));
    switchTo(reel[idx]!, now);
  } else {
    if (win.keyDown(0x31)) switchTo(0, now); // '1'
    if (win.keyDown(0x32)) switchTo(1, now); // '2'
    if (win.keyDown(0x33)) switchTo(2, now); // '3'
    if (win.keyDown(0x34)) switchTo(3, now); // '4'
    if (now - lastSwitch > 4000) {
      switchTo((activeFilter + 1) % 4, now);
      lastSwitch = now;
    }
  }
  // On the actual capture frame, hard-pin the hero filter fully resolved so the
  // saved still is ALWAYS the legible "live desktop as heat" shot — never caught
  // mid cross-fade or on an abstract effect, no matter how the priming/timing drifts.
  const isCaptureFrame = durationMs > 0 && now - start >= durationMs;
  if (isCaptureFrame) {
    prevFilter = HERO_FILTER;
    activeFilter = HERO_FILTER;
    fadeStart = -1;
  }
  const fadeMix = fadeStart < 0 ? 1.0 : Math.min(1.0, (now - fadeStart) / FADE_MS);

  // cbuffer: iRes(2 f32), iTime, fadeMix, filterA, filterB, pad(2)
  cbBuf.writeFloatLE(srcW || CW, 0);
  cbBuf.writeFloatLE(srcH || CH, 4);
  cbBuf.writeFloatLE(t, 8);
  cbBuf.writeFloatLE(fadeMix, 12);
  cbBuf.writeFloatLE(activeFilter, 16);
  cbBuf.writeFloatLE(prevFilter, 20);
  cbBuf.writeFloatLE(0, 24);
  cbBuf.writeFloatLE(0, 28);
  gpu.updateConstantBuffer(cb, cbBuf);

  gpu.setRenderTargets([g.backBufferRTV]);
  gpu.setViewport(CW, CH);
  gpu.clear(g.backBufferRTV, [0.01, 0.01, 0.02, 1]);
  gpu.vsSet(vs);
  gpu.psSet(ps, { cb: [cb], srv: [srcTex!.srv!], samp: [sampler] });
  gpu.drawFullscreenTriangle();

  frames += 1;

  // Capture-mode: on the final frame, snapshot the back buffer BEFORE present.
  if (isCaptureFrame) {
    const shotDir = resolve(import.meta.dir, '..', 'screenshots');
    mkdirSync(shotDir, { recursive: true });
    const stats = captureBackBuffer(g, resolve(shotDir, 'cam-filter.png'), { gridW: 48, gridH: 22 });
    console.log(formatGrid(stats));
    console.log(`[shot] filter=${FILTER_NAMES[activeFilter]} (hero) fadeMix=${fadeMix.toFixed(2)} ok=${stats.ok} nonBlack=${stats.nonBlackFrac.toFixed(3)} meanLuma=${stats.meanLuma.toFixed(3)} -> ${stats.path}`);
    g.present(false);
    break;
  }

  fpsFrames += 1;
  if (now - fpsTimer >= 1000) {
    fps = Math.round((fpsFrames * 1000) / (now - fpsTimer));
    fpsFrames = 0;
    fpsTimer = now;
  }

  // GDI HUD composited INTO the back buffer (before Present) so the label is
  // flicker-free. The capture frame above snapshots & breaks before reaching here,
  // so the saved PNG stays HUD-free.
  drawHud(activeFilter, fps);

  g.present(false);
}

GDI32.DeleteObject(hudFont);
cleanup(0);
