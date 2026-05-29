/**
 * _hud.ts — flicker-free GDI HUD for the showcase.
 *
 * Demos used to draw their HUD with GDI on the WINDOW DC (GetDC(hwnd) + TextOutW)
 * AFTER present(). On the engine's uncapped blt-model swap chain that paints the
 * front buffer, which the next Present (~1000 fps) immediately blits over — so the
 * text strobes while the GPU scene (in the back buffer) stays rock-solid.
 *
 * This composites the HUD INTO the back buffer instead: draw the GDI HUD onto an
 * offscreen top-down 32-bpp DIB, upload it to a BGRA texture, and alpha-blend it
 * over the scene with a fullscreen pass — BEFORE present(). The text becomes part
 * of the presented frame, so it never flickers (and it shows up in back-buffer
 * captures). GDI leaves alpha=0, so the pixel shader keys alpha on luminance.
 *
 * Usage (replace `const dc = User32.GetDC(win.hwnd); …; User32.ReleaseDC(…)` and
 * call it BEFORE g.present()):
 *   hud.draw(g, clientW, clientH, (dc) => {
 *     GDI32.SetBkMode(dc, 1);
 *     GDI32.SelectObject(dc, font);
 *     GDI32.SetTextColor(dc, 0x00f0d8b0);
 *     GDI32.TextOutW(dc, 18, 18, text.ptr!, text.length);
 *   });
 *   g.present(false);
 *
 * `dc` is a memory DC sized to the back buffer, so absolute window pixel
 * coordinates are unchanged. Call hud.release() in teardown (optional).
 */
import { FFIType, toArrayBuffer, type Pointer } from 'bun:ffi';

import * as gpu from './_gpu';
import { GDI32 } from '../index';

const VS_SRC = `
struct VSOut { float4 pos : SV_Position; float2 uv : TEXCOORD0; };
VSOut main(uint vid : SV_VertexID) {
  VSOut o;
  float2 p = float2((vid << 1) & 2, vid & 2);
  o.uv = p;
  o.pos = float4(p * float2(2.0, -2.0) + float2(-1.0, 1.0), 0.0, 1.0);
  return o;
}`;

// GDI leaves alpha=0 in the DIB, so derive coverage from the brightest channel.
const PS_SRC = `
Texture2D Tex : register(t0);
SamplerState Smp : register(s0);
float4 main(float4 pos : SV_Position, float2 uv : TEXCOORD0) : SV_Target {
  float4 c = Tex.Sample(Smp, uv);
  float a = saturate(max(c.r, max(c.g, c.b)) * 2.2);
  return float4(c.rgb, a);
}`;

interface HudState {
  g: gpu.Gpu;
  w: number;
  h: number;
  memDC: bigint;
  dib: bigint;
  view: Buffer; // shares the DIB pixel memory (BGRA, top-down)
  tex: { tex: bigint; srv?: bigint };
  sampler: bigint;
  vs: bigint;
  ps: bigint;
  blend: bigint;
}

let st: HudState | null = null;

// Standard alpha-OVER blend: SRC_ALPHA·src + INV_SRC_ALPHA·dst.
function makeAlphaOverBlend(device: bigint): bigint {
  const SRC_ALPHA = 5;
  const INV_SRC_ALPHA = 6;
  const ONE = 2;
  const OP_ADD = 1;
  const desc = Buffer.alloc(8 + 32 * 8);
  const rt = 8; // RenderTarget[0]
  desc.writeUInt32LE(1, rt + 0); // BlendEnable
  desc.writeUInt32LE(SRC_ALPHA, rt + 4); // SrcBlend
  desc.writeUInt32LE(INV_SRC_ALPHA, rt + 8); // DestBlend
  desc.writeUInt32LE(OP_ADD, rt + 12); // BlendOp
  desc.writeUInt32LE(ONE, rt + 16); // SrcBlendAlpha
  desc.writeUInt32LE(INV_SRC_ALPHA, rt + 20); // DestBlendAlpha
  desc.writeUInt32LE(OP_ADD, rt + 24); // BlendOpAlpha
  desc.writeUInt32LE(0x0f, rt + 28); // RenderTargetWriteMask = ALL
  const pp = Buffer.alloc(8);
  if (gpu.vcall(device, gpu.DEV_CREATE_BLEND_STATE, [FFIType.ptr, FFIType.ptr], [desc.ptr!, pp.ptr!]) !== 0) {
    throw new Error('CreateBlendState (alpha-over) failed.');
  }
  return pp.readBigUInt64LE(0);
}

function ensureState(g: gpu.Gpu, w: number, h: number): HudState {
  if (st && st.g === g && st.w === w && st.h === h) return st;
  if (st) release();

  const memDC = GDI32.CreateCompatibleDC(0n);
  // BITMAPINFOHEADER (40B): top-down (negative height), 32bpp, BI_RGB.
  const bmi = Buffer.alloc(40);
  bmi.writeUInt32LE(40, 0); // biSize
  bmi.writeInt32LE(w, 4); // biWidth
  bmi.writeInt32LE(-h, 8); // biHeight (negative → top-down)
  bmi.writeUInt16LE(1, 12); // biPlanes
  bmi.writeUInt16LE(32, 14); // biBitCount
  bmi.writeUInt32LE(0, 16); // biCompression = BI_RGB
  const ppv = Buffer.alloc(8);
  const dib = GDI32.CreateDIBSection(memDC, bmi.ptr!, 0 /* DIB_RGB_COLORS */, ppv.ptr!, 0n, 0);
  if (dib === 0n) throw new Error('CreateDIBSection failed.');
  GDI32.SelectObject(memDC, dib);
  const bitsAddr = Number(ppv.readBigUInt64LE(0)) as Pointer;
  const view = Buffer.from(toArrayBuffer(bitsAddr, 0, w * h * 4));

  const vsCode = gpu.compile(VS_SRC, 'main', 'vs_5_0');
  const vs = gpu.makeVertexShader(vsCode);
  gpu.blobRelease(vsCode.blob);
  const psCode = gpu.compile(PS_SRC, 'main', 'ps_5_0');
  const ps = gpu.makePixelShader(psCode);
  gpu.blobRelease(psCode.blob);

  st = {
    g,
    w,
    h,
    memDC,
    dib,
    view,
    tex: gpu.makeTexture({ w, h, format: gpu.DXGI_FORMAT_B8G8R8A8_UNORM, srv: true }),
    sampler: gpu.makeSampler({ filter: gpu.D3D11_FILTER_MIN_MAG_MIP_LINEAR, address: gpu.D3D11_TEXTURE_ADDRESS_CLAMP }),
    vs,
    ps,
    blend: makeAlphaOverBlend(g.device),
  };
  return st;
}

/**
 * Composite a GDI HUD into the back buffer (call BEFORE g.present()). `drawFn`
 * receives a memory DC sized to (w,h) — draw GDI on it exactly as before.
 */
export function draw(g: gpu.Gpu, w: number, h: number, drawFn: (dc: bigint, w: number, h: number) => void): void {
  const s = ensureState(g, w, h);
  s.view.fill(0); // transparent black
  drawFn(s.memDC, s.w, s.h);
  GDI32.GdiFlush(); // flush GDI batch so the DIB bits are final before upload
  gpu.vcall(
    s.g.context,
    gpu.CTX_UPDATE_SUBRESOURCE,
    [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32],
    [s.tex.tex, 0, null, s.view.ptr!, s.w * 4, 0],
    FFIType.void,
  );
  gpu.setRenderTargets([s.g.backBufferRTV]);
  gpu.setViewport(s.w, s.h);
  gpu.setBlendState(s.blend);
  gpu.vsSet(s.vs);
  gpu.psSet(s.ps, { srv: [s.tex.srv!], samp: [s.sampler] });
  gpu.drawFullscreenTriangle();
  gpu.psSet(s.ps, { srv: [0n] });
  gpu.setBlendState(0n);
}

export function release(): void {
  if (!st) return;
  gpu.comRelease(st.blend);
  gpu.comRelease(st.sampler);
  gpu.comRelease(st.vs);
  gpu.comRelease(st.ps);
  gpu.comRelease(st.tex.srv ?? 0n);
  gpu.comRelease(st.tex.tex);
  GDI32.DeleteObject(st.dib);
  GDI32.DeleteDC(st.memDC);
  st = null;
}

// ── Self-test ─────────────────────────────────────────────────────────────────
if (import.meta.main) {
  const { captureBackBuffer } = await import('./_snapshot');
  const W = 900;
  const H = 320;
  const wide = (s: string) => Buffer.from(s + '\0', 'utf16le');
  const win = gpu.createWindow({ title: 'hud-selftest', width: W, height: H, borderless: true });
  const g = gpu.createDevice(win.hwnd, { width: W, height: H });
  const font = GDI32.CreateFontW(-56, 0, 0, 0, 800, 0, 0, 0, 0, 0, 0, 4, 0, wide('Consolas').ptr!);

  gpu.setRenderTargets([g.backBufferRTV]);
  gpu.setViewport(W, H);
  gpu.clear(g.backBufferRTV, [0.0, 0.28, 0.42, 1]); // teal scene
  draw(g, W, H, (dc) => {
    GDI32.SetBkMode(dc, 1);
    GDI32.SelectObject(dc, font);
    GDI32.SetTextColor(dc, 0x0000ffff); // yellow (BGR)
    const t1 = 'FLICKER FIX OK';
    GDI32.TextOutW(dc, 40, 60, wide(t1).ptr!, t1.length);
    GDI32.SetTextColor(dc, 0x00ffffff);
    const t2 = 'GDI in the back buffer 0123';
    GDI32.TextOutW(dc, 40, 170, wide(t2).ptr!, t2.length);
  });
  const stats = captureBackBuffer(g, 'D:/Projects/bun-win32/packages/all/screenshots/_hud-selftest.png');
  console.log('HUD_SELFTEST ' + JSON.stringify(stats));
  g.present(false);
  process.exit(0);
}
