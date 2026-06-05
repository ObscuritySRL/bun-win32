/**
 * Audio Visualizer — a MilkDrop-grade music visualizer reacting to your mic, in pure TypeScript.
 *
 * Speak, sing, or play music and the whole window comes alive: a radial spectrum
 * analyzer fans 128 bands out from center, a waveform ring breathes around it, and
 * every bass beat fires an expanding shockwave that ripples through a classic
 * MilkDrop FEEDBACK field — each frame samples the PREVIOUS frame slightly zoomed,
 * rotated and warped, darkened a touch, so motion smears into luminous trails that
 * spiral inward forever. A bright-pass + bloom pass blooms the hot cores into soft
 * HDR-ish halos, and a slow evolving palette drifts the hue with the music. In a
 * silent room it still mesmerizes: a synthetic beat (or auto-gained idle motion)
 * keeps the field pulsing. Bass shifts the palette and warp strength, treble
 * sharpens the sparkle.
 *
 * Pipeline (per frame):
 *   1. _audio.createMicAnalyser → live Hann-windowed FFT magnitudes + bass/mid/
 *      treble band energies + waveform (or a synthetic beat when no mic exists).
 *   2. Resample the FFT into 128 log-spaced bands + 128 waveform taps, auto-gained,
 *      packed into a 16-byte-aligned constant buffer (float4[] arrays) + params.
 *   3. FEEDBACK pass (ping-pong A↔B): sample the previous color texture zoomed/
 *      rotated/warped + darkened, then composite NEW spectrum geometry on top —
 *      radial analyzer petals, a waveform ring, and bass shockwave rings.
 *   4. BLOOM + present pass: bright-pass + radial blur of the feedback texture,
 *      evolving palette tint, tone-map, draw to the swap-chain back buffer.
 *   5. GDI HUD (TextOutW) overlays the demo name + bass/mid/treble bars + fps.
 *
 * @bun-win32 / engine APIs used: _gpu createWindow / createDevice / makePixelShader
 *   / makeVertexShader / makeTexture (RTV+SRV ping-pong) / makeSampler /
 *   makeConstantBuffer / updateConstantBuffer / setRenderTargets / setViewport /
 *   clear / vsSet / psSet / drawFullscreenTriangle / present / comRelease; _audio
 *   createMicAnalyser; GDI32 CreateFontW/SelectObject/SetTextColor/SetBkMode/
 *   TextOutW/DeleteObject for the HUD.
 *
 * Run: bun run packages/all/example/audio-visualizer.ts   (sing / play music; ESC to quit)
 */

import { FFIType } from 'bun:ffi';

import { GDI32, User32 } from '../index';
import { createMicAnalyser } from './_audio';
import * as hud from './_hud';
import {
  type Gpu,
  type Win,
  blobRelease,
  clear,
  comRelease,
  compile,
  createDevice,
  createWindow,
  drawFullscreenTriangle,
  makeConstantBuffer,
  makePixelShader,
  makeSampler,
  makeTexture,
  makeVertexShader,
  psSet,
  setRenderTargets,
  setViewport,
  updateConstantBuffer,
  vsSet,
  DXGI_FORMAT_R16G16B16A16_FLOAT,
  D3D11_FILTER_MIN_MAG_MIP_LINEAR,
  D3D11_TEXTURE_ADDRESS_CLAMP,
  D3D11_TEXTURE_ADDRESS_WRAP,
} from './_gpu';

const VK_ESCAPE = 0x1b;
const TRANSPARENT_BK = 1;
const encode = (str: string): Buffer => Buffer.from(`${str}\0`, 'utf16le');

// ── Spectrum / waveform resolution fed to the GPU ─────────────────────────────
const BANDS = 128; // log-spaced spectrum bands (radial petals)
const WAVE_TAPS = 128; // waveform ring samples
const BAND_VEC4 = BANDS / 4; // packed as float4[]
const WAVE_VEC4 = WAVE_TAPS / 4;

// Constant-buffer layout (16-byte aligned, all sizes multiples of 16):
//   params : float4 iRes_time(x,y,time,dt)        @0
//            float4 bands_xyz (bass,mid,treble,level) @16
//            float4 fx (beat, warp, hue, gain)     @32   (48 bytes total)
//   spectrum cbuffer : float4 spec[BAND_VEC4]            (128 floats)
//   waveform cbuffer : float4 wave[WAVE_VEC4]            (128 floats)
const PARAMS_SIZE = 48;
const SPEC_SIZE = BAND_VEC4 * 16;
const WAVE_SIZE = WAVE_VEC4 * 16;

// ── HLSL: shared fullscreen-triangle vertex shader ────────────────────────────
const VS_FULLSCREEN = `
struct VSOut { float4 pos : SV_Position; float2 uv : TEXCOORD0; };
VSOut main(uint vid : SV_VertexID) {
  VSOut o;
  float2 p = float2((vid << 1) & 2, vid & 2);
  o.uv = p;                                   // 0..2
  o.pos = float4(p * float2(2,-2) + float2(-1,1), 0, 1);
  return o;
}`;

// ── HLSL: shared cbuffer declarations ─────────────────────────────────────────
const CB_DECL = `
cbuffer Params : register(b0) {
  float4 iResTime;   // x,y = resolution, z = time, w = dt
  float4 iBands;     // bass, mid, treble, level
  float4 iFx;        // beat, warp, hue, gain
};
cbuffer Spectrum : register(b1) { float4 gSpec[${BAND_VEC4}]; };
cbuffer Waveform : register(b2) { float4 gWave[${WAVE_VEC4}]; };
float spec(int i) { return gSpec[i >> 2][i & 3]; }
float wave(int i) { return gWave[i >> 2][i & 3]; }`;

// HSV → RGB, classic palette helper.
const HSV = `
float3 hsv2rgb(float3 c) {
  float4 K = float4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
  float3 p = abs(frac(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * lerp(K.xxx, saturate(p - K.xxx), c.y);
}`;

// ── HLSL: FEEDBACK pass ───────────────────────────────────────────────────────
// Sample the previous frame zoomed + rotated + warped, darken it, then composite
// new spectrum-driven geometry (radial analyzer, waveform ring, bass shockwaves).
const PS_FEEDBACK = `
${CB_DECL}
${HSV}
Texture2D Prev : register(t0);
SamplerState Smp : register(s0);

float4 main(float4 fp : SV_Position, float2 uv : TEXCOORD0) : SV_Target {
  float2 res  = iResTime.xy;
  float  time = iResTime.z;
  float  bass = iBands.x, mid = iBands.y, treble = iBands.z;
  float  beat = iFx.x, warp = iFx.y, hueBase = iFx.z;

  // Centered coords, square aspect (so the field stays circular).
  float2 p = (uv - 0.5);
  p.x *= res.x / res.y;

  // ── Feedback warp: rotate + zoom toward center + radial wobble ──────────────
  float ang  = (0.06 + 0.18 * mid + 0.10 * sin(time * 0.3)) * 0.02;
  float zoom = 1.0 - (0.012 + 0.020 * bass);            // pull inward (spiral)
  float s = sin(ang), c = cos(ang);
  float2 rp = float2(p.x * c - p.y * s, p.x * s + p.y * c) * zoom;
  // Warp displacement — turbulent, scaled by bass/warp.
  float r = length(rp);
  float a = atan2(rp.y, rp.x);
  float2 disp = float2(
    sin(a * 3.0 + time * 0.9) * 0.5 + sin(rp.y * 9.0 + time),
    cos(a * 2.0 - time * 0.7) * 0.5 + cos(rp.x * 9.0 - time)
  ) * (0.0035 + warp * 0.010);
  float2 sp = rp + disp;
  // Back to UV space.
  sp.x /= res.x / res.y;
  float2 prevUv = sp + 0.5;
  float3 col = Prev.Sample(Smp, prevUv).rgb;

  // Decay: darken + slight desaturation so trails fade instead of saturating.
  col *= 0.945 - 0.02 * (1.0 - bass);
  col = lerp(col, dot(col, float3(0.33,0.34,0.33)).xxx, 0.04);

  // ── New geometry in polar space ────────────────────────────────────────────
  // Radial spectrum analyzer: BANDS petals around the ring.
  float ringR = 0.30 + 0.05 * sin(time * 0.5);
  // Band index from angle.
  float ang01 = (a / 6.2831853 + 0.5);           // 0..1
  float bf = ang01 * ${BANDS}.0;
  int   bi = (int)bf % ${BANDS};
  float amp = spec(bi);
  // Petal: a glowing wedge whose length tracks the band amplitude.
  float petalLen = ringR + amp * 0.42;
  float wedge = smoothstep(0.020, 0.0, abs(frac(bf) - 0.5) * 0.018);  // thin spokes
  float along = smoothstep(petalLen, petalLen - 0.015, r) * step(ringR - 0.02, r);
  float petal = wedge * along * (0.5 + amp * 4.0);
  float hueP = frac(hueBase + ang01 * 0.6 + amp * 0.15);
  col += hsv2rgb(float3(hueP, 0.75, 1.0)) * petal * 0.9;

  // Inner waveform ring: displaces a circle by the time-domain signal.
  int   wi = (int)(ang01 * ${WAVE_TAPS}.0) % ${WAVE_TAPS};
  float w  = wave(wi);
  float waveR = 0.17 + w * 0.07;
  float wline = smoothstep(0.010, 0.0, abs(r - waveR));
  float hueW = frac(hueBase + 0.5 + ang01 * 0.3);
  col += hsv2rgb(float3(hueW, 0.55, 1.0)) * wline * (0.6 + treble * 3.0);

  // Bright core that swells with overall level.
  float core = smoothstep(0.12, 0.0, r) * (0.15 + bass * 0.9);
  col += hsv2rgb(float3(frac(hueBase + 0.1), 0.5, 1.0)) * core;

  // Bass shockwave rings: up to 4 expanding rings keyed to recent beats.
  [unroll] for (int k = 0; k < 4; k++) {
    float phase = frac(time * 0.55 + k * 0.25);          // 0..1 lifetime
    float seed  = iFx.w;                                 // gain reused as jitter seed (cheap)
    float ringRad = phase * 0.65;
    float strength = (1.0 - phase) * beat * smoothstep(0.0, 0.15, phase);
    float ring = smoothstep(0.018, 0.0, abs(r - ringRad)) * strength;
    col += hsv2rgb(float3(frac(hueBase + 0.3 + k * 0.07), 0.6, 1.0)) * ring * 1.2;
  }

  return float4(max(col, 0.0), 1.0);
}`;

// ── HLSL: BLOOM + present pass ────────────────────────────────────────────────
// Bright-pass + radial blur of the feedback texture, palette tint, tone-map.
const PS_BLOOM = `
${CB_DECL}
${HSV}
Texture2D Src : register(t0);
SamplerState Smp : register(s0);

float3 sampleAt(float2 uv) { return Src.Sample(Smp, uv).rgb; }

float4 main(float4 fp : SV_Position, float2 uv : TEXCOORD0) : SV_Target {
  float2 res = iResTime.xy;
  float3 base = sampleAt(uv);

  // Radial bloom: 16 taps along the line from center, bright-passed.
  float2 dir = uv - 0.5;
  float3 bloom = 0.0;
  const int TAPS = 16;
  [unroll] for (int i = 1; i <= TAPS; i++) {
    float t = (float)i / TAPS;
    float2 suv = 0.5 + dir * (1.0 - t * 0.18);
    float3 s = sampleAt(suv);
    float3 bright = max(s - 0.35, 0.0);               // bright-pass
    bloom += bright * (1.0 - t);
  }
  bloom /= TAPS;

  // Small box blur for a softer halo.
  float2 px = 1.5 / res;
  float3 soft = 0.0;
  [unroll] for (int dy = -1; dy <= 1; dy++)
    [unroll] for (int dx = -1; dx <= 1; dx++)
      soft += max(sampleAt(uv + float2(dx, dy) * px) - 0.3, 0.0);
  soft /= 9.0;

  float3 hdr = base + bloom * 2.4 + soft * 1.1;

  // Evolving palette tint pushed by bass/treble.
  float hue = iFx.z;
  float3 tint = hsv2rgb(float3(frac(hue + 0.08), 0.25, 1.0));
  hdr *= lerp(1.0.xxx, tint, 0.20 + 0.15 * iBands.x);

  // Vignette + tone-map (Reinhard-ish) for HDR-ish rolloff.
  float2 vp = (uv - 0.5); vp.x *= res.x / res.y;
  float vig = smoothstep(0.95, 0.25, length(vp));
  hdr *= vig;
  float3 mapped = hdr / (1.0 + hdr);
  mapped = pow(saturate(mapped), 0.85);                // gentle gamma lift
  return float4(mapped, 1.0);
}`;

// ── Boot ──────────────────────────────────────────────────────────────────────
const WIDTH = 1280;
const HEIGHT = 720;

console.log('Audio Visualizer — a MilkDrop-grade music visualizer reacting to your mic, in pure TypeScript.');

const win: Win = createWindow({ title: 'Audio Visualizer · pure TypeScript', width: WIDTH, height: HEIGHT, borderless: false });
const { w: clientW, h: clientH } = win.clientSize();
const gpu: Gpu = createDevice(win.hwnd, { width: clientW, height: clientH });
console.log(`  GPU      : ${gpu.driver} · ${gpu.gpuName}`);

// ── Microphone analyser (graceful no-op + synthetic beat fallback) ────────────
const mic = createMicAnalyser({ fftSize: 2048 });
console.log(`  Mic      : ${mic.available ? 'live capture' : 'no mic — driving from a synthetic beat'}`);
console.log('  Sing or play music. ESC to quit.');

// ── Shaders ───────────────────────────────────────────────────────────────────
const vsCode = compile(VS_FULLSCREEN, 'main', 'vs_5_0');
const vs = makeVertexShader(vsCode);
const psFeedbackCode = compile(PS_FEEDBACK, 'main', 'ps_5_0');
const psFeedback = makePixelShader(psFeedbackCode);
const psBloomCode = compile(PS_BLOOM, 'main', 'ps_5_0');
const psBloom = makePixelShader(psBloomCode);

// ── Ping-pong feedback textures (HDR-ish R16G16B16A16) ────────────────────────
const fmt = DXGI_FORMAT_R16G16B16A16_FLOAT;
let texA = makeTexture({ w: clientW, h: clientH, format: fmt, rtv: true, srv: true });
let texB = makeTexture({ w: clientW, h: clientH, format: fmt, rtv: true, srv: true });

const sampWrap = makeSampler({ filter: D3D11_FILTER_MIN_MAG_MIP_LINEAR, address: D3D11_TEXTURE_ADDRESS_WRAP });
const sampClamp = makeSampler({ filter: D3D11_FILTER_MIN_MAG_MIP_LINEAR, address: D3D11_TEXTURE_ADDRESS_CLAMP });

// ── Constant buffers ──────────────────────────────────────────────────────────
const cbParams = makeConstantBuffer(PARAMS_SIZE);
const cbSpec = makeConstantBuffer(SPEC_SIZE);
const cbWave = makeConstantBuffer(WAVE_SIZE);

const paramsBuf = Buffer.alloc(PARAMS_SIZE);
const specBuf = Buffer.alloc(SPEC_SIZE);
const waveBuf = Buffer.alloc(WAVE_SIZE);

// Clear both textures to black once so the first feedback read is defined.
setRenderTargets([texA.rtv!]);
setViewport(clientW, clientH);
clear(texA.rtv!, [0, 0, 0, 1]);
setRenderTargets([texB.rtv!]);
clear(texB.rtv!, [0, 0, 0, 1]);
setRenderTargets([]);

// ── HUD font ──────────────────────────────────────────────────────────────────
const hudFont = GDI32.CreateFontW(-17, 0, 0, 0, 600, 0, 0, 0, 0, 0, 0, 4 /* ANTIALIASED_QUALITY */, 0, encode('Consolas').ptr!);
const barFont = GDI32.CreateFontW(-15, 0, 0, 0, 700, 0, 0, 0, 0, 0, 0, 4, 0, encode('Consolas').ptr!);

// ── Audio analysis state (resampling + auto-gain + synthetic fallback) ────────
const bands = new Float32Array(BANDS);
const waveTaps = new Float32Array(WAVE_TAPS);
let bassSmooth = 0;
let midSmooth = 0;
let trebleSmooth = 0;
let levelSmooth = 0;
let autoGain = 4; // adaptive normaliser
let prevBass = 0;
let beatEnv = 0; // decaying beat envelope
let hue = 0.58;

// Log-spaced bin ranges over the mic's magnitude bins.
const binCount = mic.magnitudes.length;
const bandBinLo = new Int32Array(BANDS);
const bandBinHi = new Int32Array(BANDS);
{
  const minBin = 2;
  const maxBin = Math.max(minBin + 1, binCount - 1);
  const logMin = Math.log(minBin);
  const logMax = Math.log(maxBin);
  for (let b = 0; b < BANDS; b += 1) {
    const lo = Math.exp(logMin + ((logMax - logMin) * b) / BANDS);
    const hi = Math.exp(logMin + ((logMax - logMin) * (b + 1)) / BANDS);
    bandBinLo[b] = Math.max(minBin, Math.floor(lo));
    bandBinHi[b] = Math.max(bandBinLo[b]! + 1, Math.floor(hi));
  }
}

/** Fill bands/waveTaps + smoothed band energies from the mic, or synthesize. */
function analyze(time: number): void {
  if (mic.available && mic.level > 0.0006) {
    // Resample FFT magnitudes into log-spaced bands.
    let peak = 0.0008;
    for (let b = 0; b < BANDS; b += 1) {
      const lo = bandBinLo[b]!;
      const hi = bandBinHi[b]!;
      let sum = 0;
      for (let k = lo; k < hi; k += 1) sum += mic.magnitudes[k]!;
      const v = sum / (hi - lo);
      bands[b] = v;
      if (v > peak) peak = v;
    }
    // Adaptive auto-gain: track a running peak so quiet input still fills the ring.
    autoGain = autoGain * 0.96 + (1 / Math.max(0.0008, peak)) * 0.04;
    autoGain = Math.min(autoGain, 1200);
    for (let b = 0; b < BANDS; b += 1) {
      bands[b] = Math.min(1, Math.sqrt(bands[b]! * autoGain) * 0.55);
    }
    // Waveform taps (decimate the time-domain window).
    const wf = mic.waveform;
    const step = wf.length / WAVE_TAPS;
    for (let i = 0; i < WAVE_TAPS; i += 1) {
      waveTaps[i] = Math.max(-1, Math.min(1, wf[Math.floor(i * step)]! * 2.2));
    }
    bassSmooth = bassSmooth * 0.7 + Math.min(1, mic.bass * autoGain * 0.5) * 0.3;
    midSmooth = midSmooth * 0.7 + Math.min(1, mic.mid * autoGain * 0.5) * 0.3;
    trebleSmooth = trebleSmooth * 0.7 + Math.min(1, mic.treble * autoGain * 0.6) * 0.3;
    levelSmooth = levelSmooth * 0.8 + Math.min(1, mic.level * 6) * 0.2;
  } else {
    // ── Synthetic beat: a 2 Hz kick + drifting harmonics so a quiet room glows ──
    const beatPhase = (time * 2.0) % 1.0;
    const kick = Math.pow(1 - beatPhase, 6) * 1.0; // sharp decaying kick
    const swell = 0.35 + 0.25 * Math.sin(time * 0.7);
    for (let b = 0; b < BANDS; b += 1) {
      const f = b / BANDS;
      const tone = 0.5 * Math.sin(time * (1.2 + f * 5) + f * 18) + 0.5 * Math.sin(time * (0.6 + f * 3) - f * 9);
      const lowBoost = Math.exp(-f * 4) * kick; // bass-weighted kick
      bands[b] = Math.max(0, (0.18 + 0.18 * tone) * swell + lowBoost) * (1 - f * 0.4);
      bands[b] = Math.min(1, bands[b]!);
    }
    for (let i = 0; i < WAVE_TAPS; i += 1) {
      const t = i / WAVE_TAPS;
      waveTaps[i] = 0.6 * Math.sin(t * 12 + time * 3) * (0.5 + 0.5 * kick) + 0.3 * Math.sin(t * 31 - time * 5);
    }
    bassSmooth = bassSmooth * 0.6 + (0.25 + 0.6 * kick) * 0.4;
    midSmooth = midSmooth * 0.7 + (0.3 + 0.2 * Math.sin(time * 1.3)) * 0.3;
    trebleSmooth = trebleSmooth * 0.7 + (0.25 + 0.2 * Math.abs(Math.sin(time * 4))) * 0.3;
    levelSmooth = levelSmooth * 0.8 + (0.4 + 0.4 * kick) * 0.2;
  }

  // Beat detection: rising bass edge fires the shockwave envelope.
  const rise = bassSmooth - prevBass;
  if (rise > 0.06) beatEnv = Math.min(1, beatEnv + rise * 4);
  beatEnv *= 0.9;
  prevBass = bassSmooth;

  // Evolving palette: hue drifts with time and jumps on strong beats.
  hue = (hue + 0.0006 + bassSmooth * 0.004 + beatEnv * 0.01) % 1.0;
}

// ── Render loop ───────────────────────────────────────────────────────────────
const startTime = performance.now();
const durationMs = process.env.DEMO_DURATION_MS ? Number(process.env.DEMO_DURATION_MS) : 0;
let lastFrame = startTime;
let frames = 0;
let fps = 0;
let fpsWindowStart = startTime;
let totalFrames = 0;

let cleanedUp = false;
function cleanup(code: number): never {
  if (!cleanedUp) {
    cleanedUp = true;
    try {
      mic.close();
    } catch {
      /* ignore */
    }
    hud.release();
    GDI32.DeleteObject(hudFont);
    GDI32.DeleteObject(barFont);
    comRelease(sampWrap);
    comRelease(sampClamp);
    comRelease(cbParams);
    comRelease(cbSpec);
    comRelease(cbWave);
    comRelease(texA.srv!);
    comRelease(texA.rtv!);
    comRelease(texA.tex);
    comRelease(texB.srv!);
    comRelease(texB.rtv!);
    comRelease(texB.tex);
    comRelease(psBloom);
    comRelease(psFeedback);
    comRelease(vs);
    blobRelease(psBloomCode.blob);
    blobRelease(psFeedbackCode.blob);
    blobRelease(vsCode.blob);
    comRelease(gpu.backBufferRTV);
    comRelease(gpu.swapChain);
    comRelease(gpu.context);
    comRelease(gpu.device);
    win.destroy();
  }
  process.exit(code);
}
process.on('SIGINT', () => cleanup(0));

/** GDI HUD: name + bass/mid/treble bars + fps, composited into the back buffer. */
function drawHud(): void {
  hud.draw(gpu, clientW, clientH, (dc) => {
    GDI32.SetBkMode(dc, TRANSPARENT_BK);

    const prevFont = GDI32.SelectObject(dc, hudFont);
    const title = `Audio reactive · ${mic.available ? 'mic FFT' : 'synthetic beat'} · feedback bloom · ${fps} fps`;
    const tw = encode(title);
    GDI32.SetTextColor(dc, 0x000000);
    GDI32.TextOutW(dc, 17, 15, tw.ptr!, title.length);
    GDI32.SetTextColor(dc, 0x00f5ead0); // BGR warm white
    GDI32.TextOutW(dc, 16, 14, tw.ptr!, title.length);

    // bass/mid/treble bars rendered as block text.
    GDI32.SelectObject(dc, barFont);
    const blocks = (v: number): string => {
      const n = Math.max(0, Math.min(20, Math.round(v * 20)));
      return '#'.repeat(n) + '.'.repeat(20 - n);
    };
    const lines: [string, number][] = [
      [`bass   [${blocks(bassSmooth)}]`, 0x004060ff], // BGR: orange-red
      [`mid    [${blocks(midSmooth)}]`, 0x0040ff60], // green
      [`treble [${blocks(trebleSmooth)}]`, 0x00ffd040], // cyan-blue
    ];
    for (let i = 0; i < lines.length; i += 1) {
      const [text, color] = lines[i]!;
      const tb = encode(text);
      const y = 40 + i * 20;
      GDI32.SetTextColor(dc, 0x000000);
      GDI32.TextOutW(dc, 17, y + 1, tb.ptr!, text.length);
      GDI32.SetTextColor(dc, color);
      GDI32.TextOutW(dc, 16, y, tb.ptr!, text.length);
    }

    GDI32.SelectObject(dc, prevFont);
  });
}

while (!win.shouldClose()) {
  win.pump();
  if (win.shouldClose()) break;
  if (win.keyDown(VK_ESCAPE) || (User32.GetAsyncKeyState(VK_ESCAPE) & 0x8000) !== 0) break;

  mic.poll();

  const now = performance.now();
  const dt = Math.min(0.05, (now - lastFrame) / 1000);
  lastFrame = now;
  const time = (now - startTime) / 1000;

  analyze(time);

  // ── Pack constant buffers (assembled immediately before the consuming call) ──
  paramsBuf.writeFloatLE(clientW, 0);
  paramsBuf.writeFloatLE(clientH, 4);
  paramsBuf.writeFloatLE(time, 8);
  paramsBuf.writeFloatLE(dt, 12);
  paramsBuf.writeFloatLE(bassSmooth, 16);
  paramsBuf.writeFloatLE(midSmooth, 20);
  paramsBuf.writeFloatLE(trebleSmooth, 24);
  paramsBuf.writeFloatLE(levelSmooth, 28);
  paramsBuf.writeFloatLE(beatEnv, 32);
  paramsBuf.writeFloatLE(0.4 + bassSmooth, 36); // warp
  paramsBuf.writeFloatLE(hue, 40); // palette hue
  paramsBuf.writeFloatLE((time * 0.37) % 1.0, 44); // jitter seed
  for (let b = 0; b < BANDS; b += 1) specBuf.writeFloatLE(bands[b]!, b * 4);
  for (let i = 0; i < WAVE_TAPS; i += 1) waveBuf.writeFloatLE(waveTaps[i]!, i * 4);

  updateConstantBuffer(cbParams, paramsBuf);
  updateConstantBuffer(cbSpec, specBuf);
  updateConstantBuffer(cbWave, waveBuf);

  // ── Pass 1: FEEDBACK — read texA (prev), draw new geometry, write texB ──────
  setRenderTargets([texB.rtv!]);
  setViewport(clientW, clientH);
  vsSet(vs);
  psSet(psFeedback, { cb: [cbParams, cbSpec, cbWave], srv: [texA.srv!], samp: [sampWrap] });
  drawFullscreenTriangle();
  setRenderTargets([]); // unbind texB as RTV before sampling it

  // ── Pass 2: BLOOM + present — sample texB, bloom, tone-map → back buffer ─────
  setRenderTargets([gpu.backBufferRTV]);
  setViewport(clientW, clientH);
  clear(gpu.backBufferRTV, [0, 0, 0, 1]);
  vsSet(vs);
  psSet(psBloom, { cb: [cbParams, cbSpec, cbWave], srv: [texB.srv!], samp: [sampClamp] });
  drawFullscreenTriangle();
  setRenderTargets([]); // unbind so texB can be the SRV again next frame

  drawHud();
  gpu.present(false);

  // Swap ping-pong: texB becomes the "previous" frame for the next feedback pass.
  const tmp = texA;
  texA = texB;
  texB = tmp;

  // FPS accounting.
  frames += 1;
  totalFrames += 1;
  if (now - fpsWindowStart >= 500) {
    fps = Math.round((frames * 1000) / (now - fpsWindowStart));
    frames = 0;
    fpsWindowStart = now;
  }

  if (durationMs > 0 && now - startTime >= durationMs) break;
}

console.log(`  Presented ${totalFrames} frames over ${((performance.now() - startTime) / 1000).toFixed(1)}s · last ${fps} fps.`);
cleanup(0);
