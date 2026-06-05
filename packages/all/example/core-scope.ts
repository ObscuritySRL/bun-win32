/**
 * core-scope — a live per-CPU-core scheduler X-ray rendered on the GPU.
 *
 * Every ~100 ms it asks the NT kernel directly — Ntdll.NtQuerySystemInformation
 * with SystemProcessorPerformanceInformation (class 8) — for the raw Idle / Kernel
 * / User 100ns tick counters of EVERY logical processor, exactly the way Task
 * Manager and Process Explorer do it, no admin rights required. It deltas the
 * counters between polls to derive per-core busy% (split into user vs kernel
 * load), pushes one new colored row per tick into a ring-buffer waterfall texture
 * (UpdateSubresource into a single-row D3D11_BOX), and a fullscreen pixel shader
 * scrolls it top-to-bottom — one column per core, newest activity at the top.
 * At startup the ENTIRE history ring is back-filled with a tight burst of real
 * samples (genuine deltas over short intervals) so the waterfall fills the whole
 * frame on the very first rendered frame instead of growing one row at a time.
 * Below the waterfall a live per-core %-bar strip is computed in-shader from a
 * small constant buffer. A GDI HUD overlays the busiest processes (from
 * SystemProcessInformation, class 5) as large labeled load blocks plus aggregate
 * stats and a heat legend.
 *
 * No counters libs, no perfmon, no native addon — just hand-written Win32 FFI:
 * NtQuerySystemInformation on the main Bun thread (a synchronous exported call,
 * never a callback / worker — so there is zero foreign-thread hazard).
 *
 * Engine/APIs: _gpu.ts (createWindow, createDevice, compile, makeVertexShader/
 * makePixelShader, makeTexture, makeSampler, makeConstantBuffer/
 * updateConstantBuffer, setRenderTargets/setViewport/clear, vsSet/psSet,
 * drawFullscreenTriangle, vcall+CTX_UPDATE_SUBRESOURCE, comRelease/blobRelease)
 * + @bun-win32 ntdll (NtQuerySystemInformation) / kernel32 (GetActiveProcessorCount)
 * / gdi32 + user32 (HUD + screen metrics).
 *
 * Honors DEMO_DURATION_MS + ESC; full teardown. SELFCHECK=1 reads back the own
 * swapchain back buffer and prints SELFCHECK_STATS pixel statistics; SELFSHOT=1
 * captures the final frame to screenshots/core-scope.selfcheck.png via _snapshot.
 *
 * Run: bun run packages/all/example/core-scope.ts
 */

import { resolve } from 'node:path';
import { mkdirSync } from 'node:fs';

import { FFIType, read, type Pointer } from 'bun:ffi';

import { GDI32, Kernel32, Ntdll, User32 } from '../index';
import { SystemInformationClass, STATUS_SUCCESS } from '@bun-win32/ntdll';
import { SystemMetric } from '@bun-win32/user32';
import * as gpu from './_gpu';
import * as hud from './_hud';
import { captureBackBuffer, formatGrid } from './_snapshot';

// ── Layout / tuning ───────────────────────────────────────────────────────────
const HISTORY = 256; // waterfall rows (time depth)
const MAX_CORES = 64; // single processor-group cap (see limitation note)
const PERF_STRIDE = 48; // sizeof(SYSTEM_PROCESSOR_PERFORMANCE_INFORMATION) on x64
const SAMPLE_MS = 100; // ~10 Hz poll cadence
const PROC_EVERY = 4; // refresh the top-process table every Nth sample tick

const durationMs = process.env.DEMO_DURATION_MS ? Number(process.env.DEMO_DURATION_MS) : 0;
const selfCheck = process.env.SELFCHECK === '1';
const selfShot = process.env.SELFSHOT === '1';

const encodeWide = (s: string): Buffer => Buffer.from(`${s}\0`, 'utf16le');

// 16-byte little-endian GUID (mixed-endian layout) — _gpu.ts keeps its own private.
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

// ── Core count: SystemBasicInformation (class 0), cross-checked vs kernel32 ────
function detectCoreCount(): number {
  const basic = Buffer.alloc(64);
  const retLen = Buffer.alloc(4);
  let n = 0;
  if (Ntdll.NtQuerySystemInformation(SystemInformationClass.SystemBasicInformation, basic.ptr, basic.byteLength, retLen.ptr) === STATUS_SUCCESS) {
    n = basic.readUInt8(0x34); // CCHAR NumberOfProcessors @ 0x34
  }
  // ALL_PROCESSOR_GROUPS = 0xFFFF; on a single-group box equals the per-core array length.
  const k = Kernel32.GetActiveProcessorCount(0xffff);
  if (k > 0 && (n === 0 || k < n)) n = k;
  if (n <= 0) n = 1;
  return Math.min(n, MAX_CORES);
}

const cores = detectCoreCount();

// ── Per-core sample buffers (reused; decoded with a DataView) ──────────────────
const perfBuf = Buffer.alloc(MAX_CORES * PERF_STRIDE);
const perfRet = Buffer.alloc(4);
const perfView = new DataView(perfBuf.buffer);

interface Sample {
  idle: bigint;
  kernel: bigint; // INCLUDES idle
  user: bigint;
}

function readPerf(out: Sample[]): boolean {
  // Assemble + call immediately (no await between): the kernel writes one
  // SYSTEM_PROCESSOR_PERFORMANCE_INFORMATION per logical core.
  const st = Ntdll.NtQuerySystemInformation(SystemInformationClass.SystemProcessorPerformanceInformation, perfBuf.ptr, cores * PERF_STRIDE, perfRet.ptr);
  if (st !== STATUS_SUCCESS) return false;
  for (let i = 0; i < cores; i += 1) {
    const o = i * PERF_STRIDE;
    out[i] = {
      idle: perfView.getBigInt64(o + 0x00, true),
      kernel: perfView.getBigInt64(o + 0x08, true),
      user: perfView.getBigInt64(o + 0x10, true),
    };
  }
  return true;
}

const prev: Sample[] = new Array(cores);
const cur: Sample[] = new Array(cores);
const busy = new Float32Array(cores); // 0..1 total busy
const userPct = new Float32Array(cores); // 0..1 user component

function deriveBusy(): void {
  for (let i = 0; i < cores; i += 1) {
    const p = prev[i]!;
    const c = cur[i]!;
    const dIdle = Number(c.idle - p.idle);
    const dKernel = Number(c.kernel - p.kernel);
    const dUser = Number(c.user - p.user);
    const total = dKernel + dUser; // kernel already contains idle
    if (total <= 0) {
      busy[i] = 0;
      userPct[i] = 0;
      continue;
    }
    busy[i] = Math.max(0, Math.min(1, 1 - dIdle / total));
    userPct[i] = Math.max(0, Math.min(1, dUser / total));
  }
}

// ── Top-process table: SystemProcessInformation (class 5) ──────────────────────
// SYSTEM_PROCESS_INFORMATION (x64): NextEntryOffset u32@0x00, NumberOfThreads@0x04,
// ImageName UNICODE_STRING{Length u16@0x38, Buffer ptr@0x40}, UniqueProcessId ptr@0x50,
// KernelTime i64@0x110, UserTime i64@0x118.
let procBuf = Buffer.alloc(512 * 1024);
const procRet = Buffer.alloc(4);
const STATUS_INFO_LENGTH_MISMATCH = 0xc0000004 | 0;

interface ProcRow {
  name: string;
  pct: number;
}
const prevProcTime = new Map<number, bigint>();
let topProcs: ProcRow[] = [];

function sampleProcesses(): void {
  let st = Ntdll.NtQuerySystemInformation(SystemInformationClass.SystemProcessInformation, procBuf.ptr, procBuf.byteLength, procRet.ptr);
  if (st === STATUS_INFO_LENGTH_MISMATCH) {
    const need = procRet.readUInt32LE(0);
    procBuf = Buffer.alloc(Math.max(need + 65536, procBuf.byteLength * 2));
    st = Ntdll.NtQuerySystemInformation(SystemInformationClass.SystemProcessInformation, procBuf.ptr, procBuf.byteLength, procRet.ptr);
  }
  if (st !== STATUS_SUCCESS) return;

  const view = new DataView(procBuf.buffer);
  // The kernel embeds ImageName.Buffer as a VA into THIS returned buffer. Resolve
  // it as an offset relative to our buffer's own base address.
  const bufBase = procBuf.ptr ? BigInt(procBuf.ptr) : 0n;
  const rows: { pid: number; name: string; cpu: bigint }[] = [];
  let off = 0;
  let guard = 0;
  const seen = new Set<number>();
  while (guard++ < 100000 && off + 0x120 <= procBuf.byteLength) {
    const next = view.getUint32(off + 0x00, true);
    const kernelT = view.getBigInt64(off + 0x110, true);
    const userT = view.getBigInt64(off + 0x118, true);
    const pidPtr = view.getBigUint64(off + 0x50, true);
    const pid = Number(pidPtr & 0xffffffffn);
    const nameLen = view.getUint16(off + 0x38, true);
    const nameVA = view.getBigUint64(off + 0x40, true);
    let name = pid === 0 ? 'Idle' : `pid ${pid}`;
    if (nameLen > 0 && nameLen < 1024 && nameVA !== 0n && bufBase !== 0n) {
      const rel = Number(nameVA - bufBase);
      if (rel > 0 && rel + nameLen <= procBuf.byteLength) {
        name = procBuf.subarray(rel, rel + nameLen).toString('utf16le');
      }
    }
    if (!seen.has(pid)) {
      seen.add(pid);
      rows.push({ pid, name, cpu: kernelT + userT });
    }
    if (next === 0) break;
    off += next;
  }

  // Delta each PID's total CPU time; rank.
  const ranked: ProcRow[] = [];
  let totalDelta = 0;
  for (const r of rows) {
    const before = prevProcTime.get(r.pid);
    const d = before === undefined ? 0 : Number(r.cpu - before);
    prevProcTime.set(r.pid, r.cpu);
    if (d > 0) {
      ranked.push({ name: r.name, pct: d });
      totalDelta += d;
    }
  }
  // Normalize to % of one core-tick-window across all cores.
  const denom = totalDelta > 0 ? totalDelta : 1;
  ranked.sort((a, b) => b.pct - a.pct);
  topProcs = ranked.slice(0, 8).map((r) => ({ name: r.name, pct: (r.pct / denom) * 100 }));
}

// ── Window + device ────────────────────────────────────────────────────────────
const screenW = User32.GetSystemMetrics(SystemMetric.SM_CXSCREEN) || 1920;
const screenH = User32.GetSystemMetrics(SystemMetric.SM_CYSCREEN) || 1080;
const WIN_H = Math.min(1000, Math.floor(screenH * 0.72));
const WIN_W = Math.min(Math.floor(screenW * 0.9), Math.round((WIN_H * 16) / 9));
const win = gpu.createWindow({ title: 'core-scope · live per-core scheduler X-ray', width: WIN_W, height: WIN_H, borderless: true });
const { w: BBW, h: BBH } = win.clientSize();
const g = gpu.createDevice(win.hwnd, { width: BBW, height: BBH });

// ── Waterfall ring texture (R8G8B8A8, w=cores, h=HISTORY) ──────────────────────
const waterfall = gpu.makeTexture({ w: cores, h: HISTORY, format: gpu.DXGI_FORMAT_R8G8B8A8_UNORM, srv: true });
const sampler = gpu.makeSampler({ filter: gpu.D3D11_FILTER_MIN_MAG_MIP_POINT, address: gpu.D3D11_TEXTURE_ADDRESS_CLAMP });

// One-row scratch (RGBA, cores wide) reused every tick.
const rowPixels = Buffer.alloc(cores * 4);
// D3D11_BOX (24 bytes): left,top,front,right,bottom,back — all u32.
const box = Buffer.alloc(24);

// Heat ramp: idle=deep navy, low=blue→teal/cyan, rising user=green→yellow→red,
// kernel/interrupt component pushes toward magenta. Idle stays dark so the bright
// scheduler activity pops; the ramp climbs through a full thermal spectrum.
function heat(b: number, u: number, dst: Buffer, px: number): void {
  // b in 0..1 total busy; u in 0..1 user fraction of busy.
  const kernelFrac = Math.max(0, b - u); // kernel/interrupt component
  // Gamma-lift the busy value so small loads register, but keep idle dark.
  const t = Math.pow(Math.min(1, b), 0.55);
  // Dark deep-navy idle floor; warms quickly as load rises.
  let r = 0.02 + t * t * (0.6 + 0.9 * u); // reds bloom in the upper range
  let gr = 0.03 + t * (0.35 + 0.85 * u); // greens carry the mid-band
  let bl = 0.14 + (1 - t) * 0.22 - t * 0.1; // navy at idle, recedes when hot
  // Kernel/interrupt time tints magenta (classic Task-Manager "kernel" overlay).
  r += kernelFrac * 0.85;
  bl += kernelFrac * 0.65;
  dst[px + 0] = Math.round(Math.max(0, Math.min(1, r)) * 255);
  dst[px + 1] = Math.round(Math.max(0, Math.min(1, gr)) * 255);
  dst[px + 2] = Math.round(Math.max(0, Math.min(1, bl)) * 255);
  dst[px + 3] = 255;
}

// Initialize every waterfall row to a defined dark idle color so unwritten rows
// render as the idle floor, not garbage (a fallback in case backfill is short).
function primeWaterfall(): void {
  const full = Buffer.alloc(cores * HISTORY * 4);
  for (let p = 0; p < cores * HISTORY; p += 1) {
    full[p * 4 + 0] = 6;
    full[p * 4 + 1] = 8;
    full[p * 4 + 2] = 18;
    full[p * 4 + 3] = 255;
  }
  gpu.vcall(g.context, gpu.CTX_UPDATE_SUBRESOURCE, [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], [waterfall.tex, 0, null, full.ptr!, cores * 4, 0], FFIType.void);
}

// Busy-spin for a short, real interval so successive perf deltas cover genuine
// scheduler time (no await — we must not yield while the warmup samples run).
function spin(ms: number): void {
  const until = performance.now() + ms;
  while (performance.now() < until) {
    /* tight spin: forces the kernel to attribute real idle/kernel/user ticks */
  }
}

// PRE-SEED the ENTIRE history texture with REAL samples before the first frame,
// so the waterfall FILLS THE WHOLE FRAME immediately (instead of growing one row
// every ~100 ms and leaving the rest black). Each warmup sample spans a short but
// genuine interval (WARMUP_SPIN ms) — these are true NtQuerySystemInformation
// deltas, not fabricated data, just sampled faster than the live cadence.
const WARMUP_SPIN = 5; // ms per backfill row (HISTORY rows ≈ 1.3 s of warmup)
function backfillWaterfall(): void {
  for (let r = 0; r < HISTORY; r += 1) {
    spin(WARMUP_SPIN);
    if (!readPerf(cur)) break;
    deriveBusy();
    pushRow();
    for (let i = 0; i < cores; i += 1) prev[i] = cur[i]!;
  }
}

let ringY = 0; // next row to write
function pushRow(): void {
  for (let i = 0; i < cores; i += 1) heat(busy[i]!, userPct[i]!, rowPixels, i * 4);
  // Assemble the destination BOX immediately before the call (no await).
  box.writeUInt32LE(0, 0); // left
  box.writeUInt32LE(ringY, 4); // top
  box.writeUInt32LE(0, 8); // front
  box.writeUInt32LE(cores, 12); // right
  box.writeUInt32LE(ringY + 1, 16); // bottom
  box.writeUInt32LE(1, 20); // back
  gpu.vcall(g.context, gpu.CTX_UPDATE_SUBRESOURCE, [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], [waterfall.tex, 0, box.ptr!, rowPixels.ptr!, cores * 4, 0], FFIType.void);
  ringY = (ringY + 1) % HISTORY;
}

// ── Shaders ────────────────────────────────────────────────────────────────────
const vsCode = gpu.compile(
  /* hlsl */ `struct VSOut { float4 pos : SV_Position; float2 uv : TEXCOORD0; };
   VSOut main(uint vid : SV_VertexID) {
     VSOut o; float2 p = float2((vid << 1) & 2, vid & 2);
     o.uv = p; o.pos = float4(p * float2(2,-2) + float2(-1,1), 0, 1); return o; }`,
  'main',
  'vs_5_0',
);
const vs = gpu.makeVertexShader(vsCode);

// cbuffer: iRes(2) iCores iHistory | ringHead waterTop barTop pad | busy[64] (as 16 float4)
const PS_SRC = /* hlsl */ `
cbuffer C : register(b0) {
  float2 iRes;
  float  iCores;
  float  iHistory;
  float  ringHead;   // newest row index in the ring (0..HISTORY-1), exclusive top
  float  waterTop;   // UV.y where the waterfall begins
  float  waterBot;   // UV.y where the waterfall ends (bar strip below)
  float  pad0;
  float4 busy[16];   // 64 packed busy% (one float per core)
};
Texture2D Wf : register(t0);
SamplerState Smp : register(s0);

float coreBusy(int i) {
  if (i < 0 || i >= 64) return 0.0;
  return busy[i / 4][i % 4];
}

struct VSOut { float4 pos : SV_Position; float2 uv : TEXCOORD0; };

float4 main(VSOut inp) : SV_Target {
  float2 uv = inp.uv;
  float3 col = float3(0.02, 0.025, 0.045);

  int coreCount = (int)(iCores + 0.5);
  float colF = uv.x * iCores;
  int coreIdx = (int)colF;
  float cf = frac(colF);
  // Strong per-core column separators — visible from across the room.
  float sep = smoothstep(0.0, 0.018, cf) * smoothstep(0.0, 0.018, 1.0 - cf);

  if (uv.y >= waterTop && uv.y < waterBot) {
    // Waterfall region — fills almost the whole frame. Newest row at the TOP;
    // older activity flows down. Screen-top = ring row (ringHead-1), back in time.
    float yNorm = (uv.y - waterTop) / (waterBot - waterTop); // 0=top(newest) .. 1=bottom(oldest)
    float age = yNorm * (iHistory - 1.0);                    // rows back in time
    float ringRow = ringHead - 1.0 - age;
    ringRow = ringRow - floor(ringRow / iHistory) * iHistory; // wrap into [0,HISTORY)
    float sampU = (float(coreIdx) + 0.5) / iCores;
    float sampV = (ringRow + 0.5) / iHistory;
    col = Wf.SampleLevel(Smp, float2(sampU, sampV), 0).rgb;

    // Per-core column gutters + a subtle vignette so columns read as discrete.
    col *= 0.28 + 0.72 * sep;
    // Faint horizontal scanline gives the waterfall a live-monitor texture.
    col *= 0.9 + 0.1 * (0.5 + 0.5 * cos(inp.pos.y * 1.6));
    // Bright live front along the very top edge.
    col += saturate(1.0 - yNorm * 60.0) * float3(0.35, 0.45, 0.6);
  } else if (uv.y >= waterBot) {
    // Live per-core %-bar strip beneath the waterfall (current instantaneous load).
    float stripH = 1.0 - waterBot;
    float local = (uv.y - waterBot) / stripH; // 0 top .. 1 bottom of strip
    float v = clamp(coreBusy(coreIdx), 0.0, 1.0);
    float fill = 1.0 - local;                  // bar grows upward from the bottom
    float on = smoothstep(0.012, 0.0, fill - v);
    float gap = smoothstep(0.0, 0.03, cf) * smoothstep(0.0, 0.03, 1.0 - cf);
    float3 barCol = lerp(float3(0.12, 0.95, 0.55), float3(1.0, 0.32, 0.18), v);
    float3 bg = float3(0.05, 0.06, 0.09);
    col = lerp(bg, barCol, on * gap);
    // Every core shows a dim baseline cap so the strip reads as a full row of bars.
    float baseFloor = smoothstep(0.06, 0.0, fill);
    col = lerp(col, float3(0.12, 0.22, 0.4), baseFloor * gap * (1.0 - on));
    // Faint quarter-load gridlines across the strip (25/50/75%).
    float grid = step(0.985, 1.0 - abs(frac(local * 4.0 + 0.5) - 0.5) * 2.0);
    col += grid * 0.06;
    // Bright divider line between waterfall and strip.
    col += smoothstep(0.04, 0.0, local) * float3(0.15, 0.2, 0.3);
  } else {
    // Thin header band above the waterfall (kept dark for HUD legibility).
    float t = uv.y / waterTop;
    col = lerp(float3(0.04, 0.06, 0.11), float3(0.02, 0.03, 0.06), t);
    col *= 0.45 + 0.55 * sep;
  }

  if (coreIdx >= coreCount) col *= 0.12; // dim unused columns (cores < grid)
  return float4(saturate(col), 1.0);
}`;
const psCode = gpu.compile(PS_SRC, 'main', 'ps_5_0');
const ps = gpu.makePixelShader(psCode);

const CB_BYTES = 16 + 16 + 16 * 16; // header(32) + busy[16] float4 (256) -> 288, rounds to 288
const cb = gpu.makeConstantBuffer(CB_BYTES);
const cbBuf = Buffer.alloc(Math.ceil(CB_BYTES / 16) * 16);

const WATER_TOP = 0.055; // thin dark header band for the HUD title
const WATER_BOT = 0.88; // waterfall fills ~83% of the frame; bar strip is the bottom 12%

function updateCb(): void {
  cbBuf.writeFloatLE(BBW, 0);
  cbBuf.writeFloatLE(BBH, 4);
  cbBuf.writeFloatLE(cores, 8);
  cbBuf.writeFloatLE(HISTORY, 12);
  cbBuf.writeFloatLE(ringY, 16); // ringHead = next-write index (newest written is ringY-1)
  cbBuf.writeFloatLE(WATER_TOP, 20);
  cbBuf.writeFloatLE(WATER_BOT, 24);
  cbBuf.writeFloatLE(0, 28);
  for (let i = 0; i < 64; i += 1) cbBuf.writeFloatLE(i < cores ? busy[i]! : 0, 32 + i * 4);
  gpu.updateConstantBuffer(cb, cbBuf);
}

// ── GDI HUD ─────────────────────────────────────────────────────────────────────
const titleFont = GDI32.CreateFontW(-26, 0, 0, 0, 800, 0, 0, 0, 0, 0, 0, 4, 0, encodeWide('Consolas').ptr!);
const hudFont = GDI32.CreateFontW(-19, 0, 0, 0, 600, 0, 0, 0, 0, 0, 0, 4, 0, encodeWide('Consolas').ptr!);
const smallFont = GDI32.CreateFontW(-16, 0, 0, 0, 600, 0, 0, 0, 0, 0, 0, 4, 0, encodeWide('Consolas').ptr!);
const TRANSPARENT_BK = 1;
const NULL_PEN = 8; // GetStockObject(NULL_PEN) — borderless filled rects

const rgb = (r: number, g: number, b: number): number => (b << 16) | (g << 8) | r; // COLORREF 0x00BBGGRR

// Long-lived HUD brushes (released in teardown).
const panelBrush = GDI32.CreateSolidBrush(rgb(16, 22, 38));
const barBrush = GDI32.CreateSolidBrush(rgb(30, 150, 90));
const barHotBrush = GDI32.CreateSolidBrush(rgb(220, 80, 50));

function out(dc: bigint, x: number, y: number, text: string, color = 0x00e8f0ff): void {
  const w = encodeWide(text);
  GDI32.SetTextColor(dc, 0x00000000);
  GDI32.TextOutW(dc, x + 1, y + 1, w.ptr!, text.length);
  GDI32.SetTextColor(dc, color);
  GDI32.TextOutW(dc, x, y, w.ptr!, text.length);
}

function avgBusy(): number {
  let s = 0;
  for (let i = 0; i < cores; i += 1) s += busy[i]!;
  return cores > 0 ? s / cores : 0;
}

// Filled rounded block (current pen/brush must already be selected).
function block(dc: bigint, x: number, y: number, w: number, h: number, brush: bigint): void {
  const prev = GDI32.SelectObject(dc, brush);
  GDI32.RoundRect(dc, x, y, x + w, y + h, 8, 8);
  GDI32.SelectObject(dc, prev);
}

function drawHud(fps: number): void {
  hud.draw(g, BBW, BBH, (dc) => {
    GDI32.SetBkMode(dc, TRANSPARENT_BK);
    // Borderless fills: select the stock NULL_PEN so RoundRect has no outline.
    const nullPen = GDI32.GetStockObject(NULL_PEN);
    const prevPen = nullPen ? GDI32.SelectObject(dc, nullPen) : 0n;

    const prevFont = GDI32.SelectObject(dc, titleFont);
    out(dc, 22, 8, 'core-scope', 0x00ffffff);
    GDI32.SelectObject(dc, hudFont);
    out(dc, 190, 14, `live per-core scheduler X-ray · ${cores} logical cores · avg ${(avgBusy() * 100).toFixed(0)}% · ${fps} fps · ${g.gpuName} · NtQuerySystemInformation · ESC`, 0x00bfe0ff);

    // ── Top-process panel (large labeled blocks) ─────────────────────────────────
    const panelW = 420;
    const px = BBW - panelW - 24;
    let py = Math.floor(BBH * 0.1);
    out(dc, px, py, 'TOP CPU CONSUMERS  (Δ user+kernel)', 0x0080ffff);
    py += 30;
    const rowH = 40;
    const maxPct = Math.max(1, topProcs.length > 0 ? topProcs[0]!.pct : 1);
    for (let i = 0; i < topProcs.length; i += 1) {
      const p = topProcs[i]!;
      const y = py + i * rowH;
      // panel backing
      block(dc, px, y, panelW, rowH - 6, panelBrush);
      // proportional load bar inside the block
      const frac = Math.min(1, p.pct / maxPct);
      const barW = Math.max(2, Math.floor((panelW - 8) * frac));
      const hot = p.pct / Math.max(1, avgBusy() * 100 * cores);
      block(dc, px + 4, y + 4, barW, rowH - 14, hot > 0.5 ? barHotBrush : barBrush);
      const nm = p.name.length > 24 ? p.name.slice(0, 23) + '…' : p.name;
      out(dc, px + 12, y + 7, nm, 0x00ffffff);
      out(dc, px + panelW - 78, y + 7, `${p.pct.toFixed(1).padStart(5)}%`, 0x00d8ffff);
    }

    // ── Legend (bottom-left, over the bar strip) ─────────────────────────────────
    GDI32.SelectObject(dc, smallFont);
    const ly = BBH - 26;
    out(dc, 24, ly, 'idle', 0x00ffb060);
    out(dc, 90, ly, 'low', 0x00b0ff80);
    out(dc, 150, ly, 'user', 0x0030ffff);
    out(dc, 220, ly, 'kernel/interrupt', 0x00ff60ff);
    out(dc, 430, ly, '◀ per-core instantaneous load', 0x00c0d8ff);

    GDI32.SelectObject(dc, prevFont);
    if (nullPen) GDI32.SelectObject(dc, prevPen);
  });
}

// ── Self-verify: read own back buffer → staging → pixel stats ──────────────────
const IID_ID3D11TEXTURE2D = '6f15aaf2-d208-4e89-9ab4-489535d34f9c';

function selfVerify(): void {
  const ppBack = Buffer.alloc(8);
  const iid = guidBytes(IID_ID3D11TEXTURE2D);
  if (gpu.vcall(g.swapChain, gpu.SWAP_GET_BUFFER, [FFIType.u32, FFIType.ptr, FFIType.ptr], [0, iid.ptr!, ppBack.ptr!]) !== 0) {
    console.log('SELFCHECK_STATS ' + JSON.stringify({ error: 'GetBuffer failed' }));
    return;
  }
  const backTex = ppBack.readBigUInt64LE(0);
  const staging = gpu.makeTexture({ w: BBW, h: BBH, format: gpu.DXGI_FORMAT_B8G8R8A8_UNORM, staging: true });
  gpu.copyResource(staging.tex, backTex);

  const mapped = Buffer.alloc(16);
  const hr = gpu.vcall(g.context, gpu.CTX_MAP, [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], [staging.tex, 0, 1 /* D3D11_MAP_READ */, 0, mapped.ptr!]);
  if (hr !== 0) {
    gpu.comRelease(staging.tex);
    gpu.comRelease(backTex);
    console.log('SELFCHECK_STATS ' + JSON.stringify({ error: 'Map failed', hr }));
    return;
  }
  const dataPtr = Number(mapped.readBigUInt64LE(0)) as Pointer;
  const rowPitch = mapped.readUInt32LE(8);

  let nonBlack = 0;
  let lumaSum = 0;
  const colorBuckets = new Set<number>();
  const total = BBW * BBH;

  // Grid-cell variance (8x8) proves structure.
  const GRID = 8;
  const cellLuma: number[] = new Array(GRID * GRID).fill(0);
  const cellCount: number[] = new Array(GRID * GRID).fill(0);

  // Probe within the POPULATED top band of the waterfall (newest rows are at the
  // top; only ~sampleCount of HISTORY rows have been written). Keep probes inside
  // that filled fraction so the column structure / scrolling is actually present.
  const filledFrac = Math.min(0.9, Math.max(0.04, (sampleCount / HISTORY) * 0.9));
  const wfBandH = (WATER_BOT - WATER_TOP) * filledFrac;
  const wfY = Math.floor(BBH * (WATER_TOP + wfBandH * 0.5));
  let scanlineTransitions = 0;
  let prevLuma = -1;

  // Two waterfall rows several sample-ticks apart, same column band — must differ.
  const colX = Math.floor(BBW * 0.5);
  const yTopBand = Math.floor(BBH * (WATER_TOP + wfBandH * 0.1));
  const yMidBand = Math.floor(BBH * (WATER_TOP + wfBandH * 0.85));
  const lumaAt = (px: number, py: number): number => {
    const base = py * rowPitch + px * 4;
    const b = read.u8(dataPtr, base + 0);
    const gg = read.u8(dataPtr, base + 1);
    const r = read.u8(dataPtr, base + 2);
    return 0.299 * r + 0.587 * gg + 0.114 * b;
  };

  // Sample on a stride to keep it fast.
  const STEP = 3;
  for (let y = 0; y < BBH; y += STEP) {
    const rowBase = y * rowPitch;
    for (let x = 0; x < BBW; x += STEP) {
      const base = rowBase + x * 4;
      const b = read.u8(dataPtr, base + 0);
      const gg = read.u8(dataPtr, base + 1);
      const r = read.u8(dataPtr, base + 2);
      const lum = 0.299 * r + 0.587 * gg + 0.114 * b;
      lumaSum += lum;
      if (r + gg + b > 36) nonBlack += 1;
      colorBuckets.add(((r >> 5) << 6) | ((gg >> 5) << 3) | (b >> 5));
      const cx = Math.min(GRID - 1, Math.floor((x / BBW) * GRID));
      const cy = Math.min(GRID - 1, Math.floor((y / BBH) * GRID));
      const ci = cy * GRID + cx;
      cellLuma[ci]! += lum;
      cellCount[ci]! += 1;
    }
  }
  const sampled = Math.ceil(BBH / STEP) * Math.ceil(BBW / STEP);

  // Scanline transitions across the waterfall (column structure: per-core color
  // steps + the thin column separators both register as luma jumps).
  for (let x = 0; x < BBW; x += 2) {
    const lum = lumaAt(x, wfY);
    if (prevLuma >= 0 && Math.abs(lum - prevLuma) > 8) scanlineTransitions += 1;
    prevLuma = lum;
  }

  // Bar-strip energy (green/red channels in the bottom strip).
  const stripY = Math.floor(BBH * (WATER_BOT + (1 - WATER_BOT) * 0.5));
  let stripEnergy = 0;
  for (let x = 0; x < BBW; x += 2) {
    const base = stripY * rowPitch + x * 4;
    const gg = read.u8(dataPtr, base + 1);
    const r = read.u8(dataPtr, base + 2);
    stripEnergy += Math.max(r, gg);
  }

  // Cell-luma variance.
  const means: number[] = [];
  for (let i = 0; i < GRID * GRID; i += 1) means.push(cellCount[i]! > 0 ? cellLuma[i]! / cellCount[i]! : 0);
  const gm = means.reduce((a, b) => a + b, 0) / means.length;
  const gridVar = means.reduce((a, b) => a + (b - gm) * (b - gm), 0) / means.length;

  // Temporal change between two waterfall bands (proves scrolling/structure).
  let bandDiff = 0;
  for (let x = colX - 60; x < colX + 60; x += 2) {
    if (x < 0 || x >= BBW) continue;
    bandDiff += Math.abs(lumaAt(x, yTopBand) - lumaAt(x, yMidBand));
  }

  gpu.vcall(g.context, gpu.CTX_UNMAP, [FFIType.u64, FFIType.u32], [staging.tex, 0], FFIType.void);
  gpu.comRelease(staging.tex);
  gpu.comRelease(backTex);

  const stats = {
    cores,
    w: BBW,
    h: BBH,
    nonBlackPct: +((nonBlack / sampled) * 100).toFixed(2),
    meanLuma: +(lumaSum / sampled).toFixed(2),
    distinctColors: colorBuckets.size,
    gridVar: +gridVar.toFixed(2),
    scanlineTransitions,
    stripEnergy,
    bandDiff: +bandDiff.toFixed(1),
    coreBusyPct: Array.from(busy).map((b) => +(b * 100).toFixed(1)),
  };
  console.log('SELFCHECK_STATS ' + JSON.stringify(stats));
}

// ── Baseline sample (first deltas are bogus without a previous reading) ─────────
if (!readPerf(prev)) {
  for (let i = 0; i < cores; i += 1) prev[i] = { idle: 0n, kernel: 0n, user: 0n };
}
primeWaterfall(); // idle-floor fallback under the backfill
backfillWaterfall(); // FILL all HISTORY rows with real samples → full-frame on frame 1
// After backfill the ring is full; treat every row as live history.

// ── Main loop ────────────────────────────────────────────────────────────────────
const start = performance.now();
let lastSample = 0;
let sampleCount = 0;
let frames = 0;
let fps = 0;
let fpsFrames = 0;
let fpsTimer = start;
let selfChecked = false;

while (!win.shouldClose()) {
  win.pump();
  if (win.shouldClose()) break;
  const now = performance.now();

  // Gate the row-advance on the sample tick (not per frame) so the waterfall
  // scrolls one row per ~100 ms, not once per rendered frame.
  if (now - lastSample >= SAMPLE_MS) {
    lastSample = now;
    if (readPerf(cur)) {
      deriveBusy();
      pushRow();
      for (let i = 0; i < cores; i += 1) prev[i] = cur[i]!;
    }
    if (sampleCount % PROC_EVERY === 0) sampleProcesses();
    sampleCount += 1;
  }

  updateCb();
  gpu.setRenderTargets([g.backBufferRTV]);
  gpu.setViewport(BBW, BBH);
  gpu.clear(g.backBufferRTV, [0.02, 0.025, 0.045, 1]);
  gpu.vsSet(vs);
  gpu.psSet(ps, { cb: [cb], srv: [waterfall.srv!], samp: [sampler] });
  gpu.drawFullscreenTriangle();
  // Unbind the SRV so the next UpdateSubresource into the waterfall is legal.
  gpu.psSet(ps, { srv: [0n] });

  // Composite the GDI HUD INTO the back buffer (before present) so the text is
  // part of the presented frame and never strobes — and shows up in captures.
  drawHud(fps);

  // Capture the GPU-rendered frame (with the composited HUD) BEFORE present()
  // (DISCARD makes the back buffer undefined afterwards).
  const lastFrame = durationMs > 0 && now - start >= durationMs;
  if (selfShot && lastFrame) {
    const shotDir = resolve(import.meta.dir, '..', 'screenshots');
    mkdirSync(shotDir, { recursive: true });
    const stats = captureBackBuffer(g, resolve(shotDir, 'core-scope.selfcheck.png'), { gridW: 48, gridH: 24 });
    console.log(formatGrid(stats));
    console.log(`[shot] ok=${stats.ok} nonBlack=${(stats.nonBlackFrac * 100).toFixed(1)}% meanLuma=${stats.meanLuma.toFixed(3)} -> ${stats.path}`);
  }

  g.present(false);
  frames += 1;

  fpsFrames += 1;
  if (now - fpsTimer >= 1000) {
    fps = Math.round((fpsFrames * 1000) / (now - fpsTimer));
    fpsFrames = 0;
    fpsTimer = now;
  }

  if (selfCheck && !selfChecked && sampleCount >= 20) {
    selfChecked = true;
    selfVerify();
  }
  if (durationMs > 0 && now - start >= durationMs) break;
}

// ── Teardown ─────────────────────────────────────────────────────────────────────
const elapsed = (performance.now() - start) / 1000;
console.log(`core-scope: ${frames} frames, ${sampleCount} samples over ${elapsed.toFixed(2)}s on ${g.driver} (${g.gpuName}), ${cores} cores.`);

GDI32.DeleteObject(titleFont);
GDI32.DeleteObject(hudFont);
GDI32.DeleteObject(smallFont);
GDI32.DeleteObject(panelBrush);
GDI32.DeleteObject(barBrush);
GDI32.DeleteObject(barHotBrush);
hud.release();
gpu.comRelease(sampler);
gpu.comRelease(cb);
gpu.comRelease(ps);
gpu.blobRelease(psCode.blob);
gpu.comRelease(vs);
gpu.blobRelease(vsCode.blob);
gpu.comRelease(waterfall.srv!);
gpu.comRelease(waterfall.tex);
gpu.comRelease(g.backBufferRTV);
gpu.comRelease(g.swapChain);
gpu.comRelease(g.context);
gpu.comRelease(g.device);
win.destroy();
process.exit(0);
