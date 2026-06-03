/**
 * term-dashboard — a live, fully-interactive COMMAND CENTER in your terminal.
 *
 * Proof that the ./_term half-block TRUECOLOR engine is a real TUI toolkit, not
 * just an animation surface. The whole console becomes a modern dark dashboard:
 * a HEADER bar with a live clock, uptime, a colour-coded FPS / frame-cost readout
 * and ticking system gauges (CPU / MEM / NET, each a little sparkline + bar); a
 * big LIVE TELEMETRY chart that scrolls
 * left every frame, plotting three sine+noise streams as crisp anti-aliased
 * polylines over a soft gradient fill and a faint grid; a navigable SERVICE
 * MENU on the left where the arrow keys move the selection, the mouse HOVERS to
 * highlight the row under the cursor, a CLICK selects it and the WHEEL scrolls
 * the list — selection and hover are painted as bright accent bars so the focus
 * is never in doubt; and a streaming LOG console that appends timestamped
 * "[ok]/[warn]" task lines as time passes and auto-scrolls. A soft additive
 * GLOW ripples under the cursor wherever it goes, so the surface feels alive to
 * the touch.
 *
 * Every panel is a rounded plate with a soft drop-shadow (t.plate) and a 1px
 * accent rule, every label is the crisp 5×7 bitmap font, and the layout is
 * recomputed from t.W/t.H each frame so it reflows on resize. The palette is a
 * cohesive cool slate with a warm clay accent and cyan/lime/violet data hues.
 *
 * ATTRACT MODE (headless capture / no input): when no mouse or key has been
 * seen, the dashboard AUTO-DRIVES itself — a synthetic cursor sweeps a Lissajous
 * path (feeding the very same hover + glow logic an operator's mouse would),
 * the menu selection slowly cycles, and the chart and log keep streaming — so a
 * CAPTURE_PNG shows a fully-populated, lively command center rather than an
 * empty shell. The instant a real event arrives, control hands over seamlessly.
 *
 * Technique: per-frame reflowed panel layout · ring-buffer telemetry streams
 * (sine + value-noise) with gradient-fill polylines · mouseSeq edge-detected
 * clicks + wheel scrolling + hover hit-testing · additive cursor glow · 5×7
 * font chrome · deterministic attract-mode auto-pilot for headless capture.
 *
 * Run:  bun run packages/all/example/term-dashboard.ts
 *       (↑/↓ select · click a row · wheel scrolls · SPACE pause · q/ESC quit)
 */
import { Term, run } from '@bun-win32/terminal';

import { clamp, clamp01, lerp, smoothstep, fract, TAU, hsv, mulberry32 } from './_kit';

// ── Palette (cohesive cool slate + warm clay accent) ────────────────────────────
const BG0: [number, number, number] = [13, 16, 24]; // deepest backdrop
const BG1: [number, number, number] = [19, 24, 35]; // panel fill
const BG2: [number, number, number] = [27, 34, 48]; // raised header / rows
const RULE: [number, number, number] = [46, 58, 80]; // hairline rules
const INK: [number, number, number] = [150, 165, 190]; // body text
const INK_DIM: [number, number, number] = [92, 104, 128]; // secondary text
const INK_HI: [number, number, number] = [226, 234, 246]; // headings / values
const CLAY: [number, number, number] = [235, 130, 90]; // brand accent
const CYAN: [number, number, number] = [78, 206, 230]; // data stream A
const LIME: [number, number, number] = [150, 226, 122]; // data stream B / ok
const VIOLET: [number, number, number] = [176, 142, 248]; // data stream C
const AMBER: [number, number, number] = [248, 196, 96]; // warn
const ACCENT: [number, number, number] = [86, 196, 232]; // selection accent (cyan)

// ── Telemetry streams (ring buffers, scroll left each frame) ─────────────────────
const STREAMS = 3;
const HIST = 320; // samples kept per stream (more than any width, so we just sample)
const series: Float32Array[] = Array.from({ length: STREAMS }, () => new Float32Array(HIST));
let head = 0; // write cursor into the ring
let filled = 0; // how many samples are valid
let chartAccum = 0; // seconds since last sample push
const SAMPLE_DT = 1 / 45; // push a new chart sample at ~45 Hz regardless of fps
const noise = mulberry32(0xc0ffee);
// smoothed value-noise state per stream
const nState = new Float32Array(STREAMS);
const nTarget = new Float32Array(STREAMS);
let nClock = 0;

const STREAM_COL = [CYAN, LIME, VIOLET];
const STREAM_PHASE = [0, 1.9, 3.7];
const STREAM_FREQ = [0.55, 0.31, 0.78];
const STREAM_BASE = [0.62, 0.45, 0.5];
const STREAM_AMP = [0.26, 0.34, 0.22];

const pushSamples = (time: number): void => {
  // advance smoothed value-noise targets a few times a second
  nClock += SAMPLE_DT;
  if (nClock >= 0.16) {
    nClock = 0;
    for (let s = 0; s < STREAMS; s++) nTarget[s] = noise() - 0.5;
  }
  for (let s = 0; s < STREAMS; s++) {
    nState[s] = lerp(nState[s], nTarget[s], 0.22);
    const v =
      STREAM_BASE[s] +
      Math.sin(time * STREAM_FREQ[s] * TAU + STREAM_PHASE[s]) * STREAM_AMP[s] +
      Math.sin(time * STREAM_FREQ[s] * 2.7 * TAU + s) * STREAM_AMP[s] * 0.28 +
      nState[s] * 0.18;
    series[s][head] = clamp01(v);
  }
  head = (head + 1) % HIST;
  if (filled < HIST) filled++;
};
// read the sample `agoFromNewest` steps back from the newest (0 = newest)
const sampleAt = (s: number, agoFromNewest: number): number => {
  const idx = ((head - 1 - agoFromNewest) % HIST + HIST) % HIST;
  return series[s][idx];
};

// ── Service menu (navigable list) ────────────────────────────────────────────────
interface Row {
  name: string;
  region: string;
  hue: number;
}
const ROWS: Row[] = [
  { name: 'API GATEWAY', region: 'US-EAST', hue: 0.55 },
  { name: 'INFERENCE POOL', region: 'US-WEST', hue: 0.32 },
  { name: 'VECTOR STORE', region: 'EU-CENTRAL', hue: 0.74 },
  { name: 'STREAM RELAY', region: 'AP-SOUTH', hue: 0.5 },
  { name: 'AUTH SERVICE', region: 'US-EAST', hue: 0.08 },
  { name: 'EDGE CACHE', region: 'GLOBAL', hue: 0.92 },
  { name: 'BATCH WORKER', region: 'US-WEST', hue: 0.42 },
  { name: 'WEBHOOK BUS', region: 'EU-WEST', hue: 0.62 },
  { name: 'OBJECT STORE', region: 'US-CENTRAL', hue: 0.16 },
  { name: 'METRICS SINK', region: 'GLOBAL', hue: 0.8 },
];
let selected = 0; // selected row index
let scroll = 0; // first visible row
let hover = -1; // row under the cursor (or -1)

// ── Log console (streaming lines) ─────────────────────────────────────────────────
interface LogLine {
  t: number; // sim time it was emitted
  level: 'ok' | 'warn' | 'info';
  msg: string;
}
const LOG: LogLine[] = [];
const LOG_MAX = 200;
let logAccum = 0;
let logSeq = 0;
const LOG_DT = 0.62; // a new line ~ every 0.62 s
const VERBS = ['SYNCED', 'FLUSHED', 'INDEXED', 'REPLICATED', 'SCALED', 'DRAINED', 'PROBED', 'COMPACTED'];
const pushLog = (time: number): void => {
  logSeq++;
  const r = ROWS[logSeq % ROWS.length];
  const verb = VERBS[logSeq % VERBS.length];
  // mostly ok, an occasional warn/info for colour
  const level: LogLine['level'] = logSeq % 11 === 0 ? 'warn' : logSeq % 7 === 0 ? 'info' : 'ok';
  const n = 100 + ((logSeq * 37) % 900);
  LOG.push({ t: time, level, msg: `${r.name} ${verb} (${n}MS)` });
  if (LOG.length > LOG_MAX) LOG.shift();
};

// ── Input edge-detection state ─────────────────────────────────────────────────────
let lastSeq = -1; // last mouse sequence we processed
let lastDown = false; // previous mouseDown (for click edge)
let lastInputTime = 0; // sim time of last REAL input (mouse or key)
let everInteracted = false; // has a real key/mouse event ever arrived
let selCycleAccum = 0; // attract-mode selection cycling clock

// resettable "selection flash" — brightens the bar briefly when selection changes
let selFlash = 0;

// FPS counter + per-frame DRAW cost, both EMA-smoothed. drawMsEma is finalised at
// the end of frame() and therefore displayed one frame late.
let fpsEma = 60;
let drawMsEma = 0;

const onKey = (key: string, _t: Term): void => {
  everInteracted = true;
  selFlash = 1;
  if (key === 'up') selected = (selected - 1 + ROWS.length) % ROWS.length;
  else if (key === 'down') selected = (selected + 1) % ROWS.length;
};

// ── Drawing helpers ────────────────────────────────────────────────────────────────
/** Soft rounded panel: drop shadow plate, fill, 1px accent top rule + hairline frame. */
const panel = (
  t: Term,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: [number, number, number],
  accent: [number, number, number],
): void => {
  // drop shadow (offset, soft)
  t.plate(x + 2, y + 2, w, h, 0.42);
  // fill
  for (let j = 0; j < h; j++) {
    const fy = j / Math.max(1, h - 1);
    // subtle top→bottom darkening for depth
    const k = lerp(1.06, 0.9, fy);
    for (let i = 0; i < w; i++) t.setPixel(x + i, y + j, fill[0] * k, fill[1] * k, fill[2] * k);
  }
  // hairline frame
  for (let i = 0; i < w; i++) {
    t.blendPixel(x + i, y, RULE[0], RULE[1], RULE[2], 0.55);
    t.blendPixel(x + i, y + h - 1, 0, 0, 0, 0.4);
  }
  for (let j = 0; j < h; j++) {
    t.blendPixel(x, y + j, RULE[0], RULE[1], RULE[2], 0.45);
    t.blendPixel(x + w - 1, y + j, 0, 0, 0, 0.32);
  }
  // accent top rule (2px) — the brand "shelf" along the panel header
  for (let i = 1; i < w - 1; i++) {
    t.setPixel(x + i, y + 1, accent[0], accent[1], accent[2]);
    t.blendPixel(x + i, y + 2, accent[0], accent[1], accent[2], 0.4);
  }
};

/** Horizontal filled bar with track + value fill (0..1). */
const bar = (
  t: Term,
  x: number,
  y: number,
  w: number,
  h: number,
  v: number,
  col: [number, number, number],
): void => {
  for (let j = 0; j < h; j++)
    for (let i = 0; i < w; i++) t.setPixel(x + i, y + j, BG0[0] + 6, BG0[1] + 8, BG0[2] + 12);
  const fw = Math.round(clamp01(v) * (w - 2));
  for (let j = 1; j < h - 1; j++)
    for (let i = 0; i < fw; i++) {
      const g = i / Math.max(1, w - 2);
      t.setPixel(x + 1 + i, y + j, col[0] * (0.65 + 0.35 * g), col[1] * (0.65 + 0.35 * g), col[2] * (0.65 + 0.35 * g));
    }
};

/** Truncate `str` (with a trailing '.') so its rendered width fits `maxPx`. */
const fitText = (str: string, maxPx: number, scale = 1): string => {
  if (Term.textWidth(str, scale) <= maxPx) return str;
  const per = (5 + 1) * scale;
  const n = Math.max(0, Math.floor(maxPx / per) - 1);
  return n <= 0 ? '' : str.slice(0, n) + '.';
};

/** Soft additive glow centred at (cx,cy) — the cursor flourish. */
const glow = (t: Term, cx: number, cy: number, radius: number, col: [number, number, number], strength: number): void => {
  const r = Math.ceil(radius);
  const x0 = Math.max(0, (cx - r) | 0), x1 = Math.min(t.width - 1, (cx + r) | 0);
  const y0 = Math.max(0, (cy - r) | 0), y1 = Math.min(t.height - 1, (cy + r) | 0);
  const inv = 1 / (radius * radius);
  for (let y = y0; y <= y1; y++) {
    const dy = y - cy;
    for (let x = x0; x <= x1; x++) {
      const dx = x - cx;
      const d2 = dx * dx + dy * dy;
      let f = 1 - d2 * inv;
      if (f <= 0) continue;
      f = f * f * strength;
      t.addPixel(x, y, col[0] * f, col[1] * f, col[2] * f);
    }
  }
};

// ── Clock / fake stats ──────────────────────────────────────────────────────────────
const pad2 = (n: number): string => (n < 10 ? '0' + n : '' + n);
const clockStr = (time: number): string => {
  // a deterministic wall-ish clock anchored at 09:41:00, advancing with sim time
  const total = 9 * 3600 + 41 * 60 + Math.floor(time);
  const hh = Math.floor(total / 3600) % 24;
  const mm = Math.floor(total / 60) % 60;
  const ss = total % 60;
  return `${pad2(hh)}:${pad2(mm)}:${pad2(ss)}`;
};
const uptimeStr = (time: number): string => {
  const tot = Math.floor(time) + 4 * 3600 + 17 * 60; // pretend we've been up a while
  const hh = Math.floor(tot / 3600);
  const mm = Math.floor(tot / 60) % 60;
  const ss = tot % 60;
  return `${hh}H ${pad2(mm)}M ${pad2(ss)}S`;
};

run({
  title: 'COMMAND CENTER',
  hud: '',
  mouse: true,
  targetFps: 0, // uncapped
  drawHud: false,
  captureT: 6,
  quitOnQ: true,
  pauseOnSpace: true,
  onKey,
  init: (t) => {
    // prime the chart so it is never empty even at t=0
    for (let i = 0; i < HIST; i++) pushSamples(i * SAMPLE_DT);
    LOG.length = 0;
    logSeq = 0;
    for (let i = 0; i < 8; i++) pushLog(i * LOG_DT);
  },
  frame: (t, time, dt) => {
    const frameStart = performance.now();
    const { width: W, height: H } = t;
    if (dt > 0) fpsEma = fpsEma * 0.9 + (1 / dt) * 0.1;

    // ── advance streams + log on a fixed cadence (independent of fps) ───────────
    chartAccum += dt;
    while (chartAccum >= SAMPLE_DT) {
      chartAccum -= SAMPLE_DT;
      pushSamples(time);
    }
    logAccum += dt;
    while (logAccum >= LOG_DT) {
      logAccum -= LOG_DT;
      pushLog(time);
    }
    selFlash = Math.max(0, selFlash - dt * 3.2);

    // ── detect real input (mouse moved/clicked/wheel) ───────────────────────────
    if (t.mouse.sequence !== lastSeq) {
      lastSeq = t.mouse.sequence;
      if (t.mouse.active) {
        everInteracted = true;
        lastInputTime = time;
      }
    }
    const realInputRecent = everInteracted && time - lastInputTime < 4.0;

    // ── cursor: real mouse if recently active, else attract Lissajous ───────────
    let curX: number, curY: number, curDown: boolean, autoPilot: boolean;
    if (realInputRecent && t.mouse.inside) {
      curX = t.mouse.x;
      curY = t.mouse.y;
      curDown = t.mouse.down;
      autoPilot = false;
    } else {
      autoPilot = true;
      curDown = false;
      // Lissajous sweep across the interior, easing in from centre
      const cx = W * 0.5, cy = H * 0.52;
      const ax = W * 0.34, ay = H * 0.32;
      curX = cx + Math.sin(time * 0.83) * ax;
      curY = cy + Math.sin(time * 1.17 + 1.1) * ay;
    }

    // ── layout (reflows on resize) ───────────────────────────────────────────────
    // Sizes are PROPORTIONAL to the canvas with floors small enough to stay sane on
    // a tiny capture grid (170×100px), so nothing collides at any size.
    const PAD = Math.max(3, Math.round(W * 0.012));
    const headerH = clamp(Math.round(H * 0.16), 18, 40);
    const top = headerH + PAD;
    const menuW = clamp(Math.round(W * 0.32), 66, 240);
    const colX = PAD + menuW + PAD; // chart column starts here
    const chartW = W - colX - PAD;
    const logH = clamp(Math.round(H * 0.3), 34, 140);
    const chartY = top;
    const chartH = H - top - logH - PAD * 2;
    const logY = chartY + chartH + PAD;
    const menuY = top;
    const menuH = H - top - PAD;
    const wide = W >= 220; // only the roomy layouts get the inline header gauges

    // ── background: soft vertical gradient + faint vignette ─────────────────────
    for (let y = 0; y < H; y++) {
      const fy = y / (H - 1);
      const k = lerp(1.0, 0.62, fy);
      const r = BG0[0] * k, g = BG0[1] * k, b = BG0[2] * k;
      for (let x = 0; x < W; x++) t.setPixel(x, y, r, g, b);
    }

    // ══ HEADER BAR ══════════════════════════════════════════════════════════════
    const headW = W - PAD * 2;
    panel(t, PAD, PAD, headW, headerH, BG2, CLAY);
    const headTop = PAD + 4; // first text baseline inside the header
    // brand mark: a clay diamond
    {
      const mx = PAD + 9, my = PAD + Math.round(headerH * 0.5);
      for (let dy = -4; dy <= 4; dy++)
        for (let dx = -4; dx <= 4; dx++)
          if (Math.abs(dx) + Math.abs(dy) <= 4) t.setPixel(mx + dx, my + dy, CLAY[0], CLAY[1], CLAY[2]);
      for (let dy = -2; dy <= 2; dy++)
        for (let dx = -2; dx <= 2; dx++)
          if (Math.abs(dx) + Math.abs(dy) <= 2) t.setPixel(mx + dx, my + dy, 255, 200, 170);
    }
    const titleX = PAD + 18;
    t.text(titleX, headTop, 'COMMAND CENTER', INK_HI[0], INK_HI[1], INK_HI[2], 1);
    t.text(titleX, headTop + 9, 'CLUSTER OPS', INK_DIM[0], INK_DIM[1], INK_DIM[2], 1);

    // live clock + uptime (top-right, scale 1 so it never collides on narrow grids)
    const clk = clockStr(time);
    const clkW = Term.textWidth(clk, 1);
    const clkRight = PAD + headW - 6;
    const up = uptimeStr(time);
    const upW = Term.textWidth(up, 1);
    t.text(clkRight - clkW, headTop, clk, INK_HI[0], INK_HI[1], INK_HI[2], 1);
    t.text(clkRight - upW, headTop + 9, up, INK_DIM[0], INK_DIM[1], INK_DIM[2], 1);

    // system gauges CPU / MEM / NET — inline in the header on WIDE grids, otherwise
    // a compact triple of mini-bars centred between the title and the clock so they
    // never overlap text.
    {
      const stats: Array<[string, number, [number, number, number]]> = [
        ['CPU', clamp01(0.42 + sampleAt(0, 0) * 0.4), CYAN],
        ['MEM', clamp01(0.55 + (sampleAt(1, 0) - 0.45) * 0.5), LIME],
        ['NET', clamp01(0.3 + sampleAt(2, 0) * 0.45), VIOLET],
      ];
      const zoneL = titleX + Term.textWidth('COMMAND CENTER', 1) + 10;
      const zoneR = clkRight - Math.max(clkW, upW) - 10;
      const zoneW = zoneR - zoneL;
      if (wide && zoneW > 150) {
        // three stacked labelled bars across the header centre
        const rowH = Math.max(5, Math.floor((headerH - 8) / 3));
        const gw = Math.min(zoneW, 200);
        const gx = zoneL + ((zoneW - gw) >> 1);
        for (let i = 0; i < stats.length; i++) {
          const [label, v, col] = stats[i];
          const yy = PAD + 4 + i * rowH;
          t.text(gx, yy + Math.max(0, (rowH - 7) >> 1), label, INK_DIM[0], INK_DIM[1], INK_DIM[2], 1);
          const bx = gx + 22, bw = gw - 22 - 28;
          bar(t, bx, yy + Math.max(0, (rowH - 4) >> 1), Math.max(8, bw), 4, v, col);
          t.text(bx + Math.max(8, bw) + 4, yy + Math.max(0, (rowH - 7) >> 1), Math.round(v * 100) + '%', INK[0], INK[1], INK[2], 1);
        }
      } else if (zoneW > 54) {
        // compact: three little vertical meters with a label under each
        const slot = Math.floor(zoneW / 3);
        const mh = headerH - 10;
        const my = PAD + 3;
        for (let i = 0; i < stats.length; i++) {
          const [label, v, col] = stats[i];
          const sx = zoneL + i * slot + (slot >> 1) - 8;
          // track
          for (let j = 0; j < mh; j++) for (let k = 0; k < 16; k++) t.setPixel(sx + k, my + j, BG0[0] + 6, BG0[1] + 8, BG0[2] + 12);
          const fh = Math.round(clamp01(v) * (mh - 2));
          for (let j = 0; j < fh; j++) {
            const g = j / Math.max(1, mh - 2);
            const yy = my + mh - 2 - j;
            for (let k = 1; k < 15; k++) t.setPixel(sx + k, yy, col[0] * (0.6 + 0.4 * g), col[1] * (0.6 + 0.4 * g), col[2] * (0.6 + 0.4 * g));
          }
          t.text(sx, my + mh - 6, label, INK_DIM[0], INK_DIM[1], INK_DIM[2], 1);
        }
      }
    }

    // ══ CHART PANEL ═════════════════════════════════════════════════════════════
    panel(t, colX, chartY, chartW, chartH, BG1, CYAN);
    t.text(colX + 6, chartY + 5, 'TELEMETRY', INK_HI[0], INK_HI[1], INK_HI[2], 1);
    // FPS counter + per-frame DRAW cost, right-aligned in the chart's title row so
    // it is ALWAYS visible (the header gets too cramped at normal widths). FPS is
    // colour-coded (green at the 60fps target); the MS readout shows how much
    // headroom the engine leaves under the cap.
    const fpsStr = `FPS ${Math.round(fpsEma)}`;
    const msStr = `${drawMsEma.toFixed(2)}MS`;
    const fpsW = Term.textWidth(fpsStr, 1);
    const msW = Term.textWidth(msStr, 1);
    const fc: [number, number, number] = fpsEma >= 55 ? LIME : fpsEma >= 30 ? AMBER : [255, 110, 110];
    const fpsRight = colX + chartW - 6;
    t.text(fpsRight - fpsW, chartY + 5, fpsStr, fc[0], fc[1], fc[2], 1);
    let fpsBlockW = fpsW;
    if (chartW > 150) {
      // room for the MS readout too — place it just left of the FPS number
      t.text(fpsRight - fpsW - 8 - msW, chartY + 5, msStr, INK_DIM[0], INK_DIM[1], INK_DIM[2], 1);
      fpsBlockW = fpsW + 8 + msW;
    }
    // legend — drawn right-to-left, starting LEFT of the FPS block; falls back to
    // bare swatches when narrow, and is skipped if it would collide with the title.
    {
      const titleRight = colX + 6 + Term.textWidth('TELEMETRY', 1) + 8;
      const labels = ['REQ/S', 'LATENCY', 'ERRORS'];
      const labelled = chartW > 260; // room for text labels alongside the FPS block?
      let lx = colX + chartW - 6 - fpsBlockW - 12;
      for (let s = STREAMS - 1; s >= 0; s--) {
        if (labelled) {
          lx -= Term.textWidth(labels[s], 1);
          if (lx < titleRight) break;
          t.text(lx, chartY + 5, labels[s], STREAM_COL[s][0], STREAM_COL[s][1], STREAM_COL[s][2], 1);
          lx -= 5;
        }
        lx -= 4;
        if (lx < titleRight) break;
        for (let dy = 0; dy < 5; dy++) for (let dx = 0; dx < 4; dx++) t.setPixel(lx + dx, chartY + 5 + dy, STREAM_COL[s][0], STREAM_COL[s][1], STREAM_COL[s][2]);
        lx -= 8;
      }
    }
    // plot region inside the panel
    const plX = colX + 6;
    const plY = chartY + 16;
    const plW = chartW - 12;
    const plH = chartH - 16 - 6;
    if (plW > 8 && plH > 8) {
      // grid
      for (let gi = 0; gi <= 4; gi++) {
        const yy = plY + Math.round((plH - 1) * (gi / 4));
        for (let x = 0; x < plW; x += 2) t.blendPixel(plX + x, yy, RULE[0], RULE[1], RULE[2], 0.3);
      }
      for (let gi = 0; gi <= 6; gi++) {
        const xx = plX + Math.round((plW - 1) * (gi / 6));
        for (let y = 0; y < plH; y += 2) t.blendPixel(xx, plY + y, RULE[0], RULE[1], RULE[2], 0.22);
      }
      // each stream: gradient fill under the polyline + bright line on top
      for (let s = 0; s < STREAMS; s++) {
        const col = STREAM_COL[s];
        // precompute y per column
        let prevPy = -1;
        for (let i = 0; i < plW; i++) {
          const ago = Math.round((plW - 1 - i));
          const v = sampleAt(s, ago);
          const py = plY + Math.round((plH - 1) * (1 - v));
          // gradient fill down from the line (faint, additive so overlaps blend)
          for (let y = py; y < plY + plH; y++) {
            const depth = (y - py) / Math.max(1, plY + plH - py);
            const a = (1 - depth) * 0.16;
            t.blendPixel(plX + i, y, col[0], col[1], col[2], a);
          }
          // line (thicken by connecting to previous column)
          if (prevPy >= 0) {
            const a = Math.min(py, prevPy), b = Math.max(py, prevPy);
            for (let yy = a; yy <= b; yy++) {
              t.setPixel(plX + i, yy, col[0], col[1], col[2]);
              t.blendPixel(plX + i, yy + 1, col[0], col[1], col[2], 0.4);
            }
          } else t.setPixel(plX + i, py, col[0], col[1], col[2]);
          prevPy = py;
          // a soft leading dot at the newest sample
          if (i === plW - 1) glow(t, plX + i, py, 4, col, 0.7);
        }
      }
    }

    // ══ MENU / SERVICE LIST PANEL ════════════════════════════════════════════════
    panel(t, PAD, menuY, menuW, menuH, BG1, ACCENT);
    t.text(PAD + 6, menuY + 5, 'SERVICES', INK_HI[0], INK_HI[1], INK_HI[2], 1);
    {
      const listX = PAD + 4;
      const listY = menuY + 16;
      const listW = menuW - 8;
      const rowH = 14;
      const footerH = 12; // reserved bottom strip for the AUTO/LIVE indicator
      const visible = Math.max(1, Math.floor((menuH - 16 - footerH) / rowH));

      // ── apply wheel scroll (real input) ───────────────────────────────────────
      if (t.mouse.wheel !== 0) {
        everInteracted = true;
        lastInputTime = time;
        scroll = clamp(scroll - Math.sign(t.mouse.wheel) * 1, 0, Math.max(0, ROWS.length - visible));
        t.mouse.wheel = 0;
      }

      // ── hover hit-test against the cursor (real OR auto-pilot) ─────────────────
      hover = -1;
      if (curX >= listX && curX < listX + listW) {
        const rel = Math.floor((curY - listY) / rowH);
        if (rel >= 0 && rel < visible) {
          const idx = scroll + rel;
          if (idx >= 0 && idx < ROWS.length) hover = idx;
        }
      }

      // ── click edge-detect (real mouse only) → select hovered row ──────────────
      if (!autoPilot) {
        if (curDown && !lastDown && hover >= 0) {
          selected = hover;
          selFlash = 1;
          everInteracted = true;
          lastInputTime = time;
        }
        lastDown = curDown;
      } else {
        lastDown = false;
        // attract: slowly cycle the selection so the highlight visibly travels,
        // and let the synthetic cursor drive the hover (already set above).
        selCycleAccum += dt;
        if (selCycleAccum >= 1.7) {
          selCycleAccum -= 1.7;
          selected = (selected + 1) % ROWS.length;
          selFlash = 1;
        }
      }

      // ── keep selection in view ────────────────────────────────────────────────
      if (selected < scroll) scroll = selected;
      else if (selected >= scroll + visible) scroll = selected - visible + 1;
      scroll = clamp(scroll, 0, Math.max(0, ROWS.length - visible));

      // ── draw rows ─────────────────────────────────────────────────────────────
      for (let v = 0; v < visible; v++) {
        const idx = scroll + v;
        if (idx >= ROWS.length) break;
        const row = ROWS[idx];
        const ry = listY + v * rowH;
        const isSel = idx === selected;
        const isHover = idx === hover;
        // row background
        if (isSel) {
          // bright accent bar with a left edge marker + flash brighten
          const fl = 0.5 + selFlash * 0.5;
          for (let j = 0; j < rowH - 2; j++)
            for (let i = 0; i < listW; i++) {
              const g = i / listW;
              t.blendPixel(listX + i, ry + j, ACCENT[0], ACCENT[1], ACCENT[2], (0.26 + 0.16 * (1 - g)) * fl + 0.12);
            }
          for (let j = 0; j < rowH - 2; j++)
            for (let i = 0; i < 2; i++) t.setPixel(listX + i, ry + j, CLAY[0], CLAY[1], CLAY[2]);
        } else if (isHover) {
          for (let j = 0; j < rowH - 2; j++)
            for (let i = 0; i < listW; i++) t.blendPixel(listX + i, ry + j, ACCENT[0], ACCENT[1], ACCENT[2], 0.12);
        }
        // status dot (hue → colour) — a tiny health LED
        const [dr, dg, db] = hsv(row.hue, 0.7, 1);
        for (let dy = 0; dy < 3; dy++) for (let dx = 0; dx < 3; dx++) t.setPixel(listX + 4 + dx, ry + 4 + dy, dr, dg, db);
        glow(t, listX + 5, ry + 5, 3, [dr, dg, db], 0.4);
        // name (left, truncated to fit) + region (right, only if it fits cleanly)
        const nameX = listX + 11;
        const indent = nameX - listX;
        const regW = Term.textWidth(row.region, 1);
        const showReg = listW - indent - 4 - regW - 6 >= Term.textWidth('APIX', 1); // keep a min name width
        const nameMax = (showReg ? listW - indent - 4 - regW - 6 : listW - indent - 6);
        const nameCol = isSel ? INK_HI : isHover ? [200, 214, 232] as [number, number, number] : INK;
        t.text(nameX, ry + 2, fitText(row.name, nameMax, 1), nameCol[0], nameCol[1], nameCol[2], 1);
        if (showReg) {
          const regCol = isSel ? [210, 196, 180] as [number, number, number] : INK_DIM;
          t.text(listX + listW - regW - 4, ry + 2, row.region, regCol[0], regCol[1], regCol[2], 1);
        }
      }

      // ── scrollbar (if list overflows) ─────────────────────────────────────────
      if (ROWS.length > visible) {
        const sbX = PAD + menuW - 4;
        const sbY = listY;
        const sbH = visible * rowH;
        for (let j = 0; j < sbH; j++) t.setPixel(sbX, sbY + j, RULE[0], RULE[1], RULE[2]);
        const thumbH = Math.max(4, Math.round((visible / ROWS.length) * sbH));
        const thumbY = sbY + Math.round((scroll / Math.max(1, ROWS.length - visible)) * (sbH - thumbH));
        for (let j = 0; j < thumbH; j++) {
          t.setPixel(sbX, thumbY + j, ACCENT[0], ACCENT[1], ACCENT[2]);
          t.setPixel(sbX - 1, thumbY + j, ACCENT[0], ACCENT[1], ACCENT[2]);
        }
      }
    }

    // ══ LOG / CONSOLE PANEL ══════════════════════════════════════════════════════
    panel(t, colX, logY, chartW, logH, BG1, LIME);
    t.text(colX + 6, logY + 5, 'EVENT LOG', INK_HI[0], INK_HI[1], INK_HI[2], 1);
    {
      const lx = colX + 6;
      const ly0 = logY + 16;
      const lineH = 9;
      const rows = Math.max(1, Math.floor((logH - 16 - 4) / lineH));
      const start = Math.max(0, LOG.length - rows);
      for (let i = 0; i < rows; i++) {
        const entry = LOG[start + i];
        if (!entry) continue;
        const yy = ly0 + i * lineH;
        // age-based fade (older lines dimmer toward the top)
        const age = (rows - 1 - i) / rows;
        const dim = lerp(1, 0.55, age);
        const ts = clockStr(entry.t);
        let x = lx;
        t.text(x, yy, ts, INK_DIM[0] * dim, INK_DIM[1] * dim, INK_DIM[2] * dim, 1);
        x += Term.textWidth(ts, 1) + 6;
        const tag = entry.level === 'ok' ? '[OK]' : entry.level === 'warn' ? '[WARN]' : '[INFO]';
        const tc = entry.level === 'ok' ? LIME : entry.level === 'warn' ? AMBER : CYAN;
        t.text(x, yy, tag, tc[0] * dim, tc[1] * dim, tc[2] * dim, 1);
        x += Term.textWidth(tag, 1) + 6;
        const msgMax = colX + chartW - 6 - x;
        t.text(x, yy, fitText(entry.msg, msgMax, 1), INK[0] * dim, INK[1] * dim, INK[2] * dim, 1);
      }
      // newest line gets a faint lime pulse on the left margin
      const pulse = 0.5 + 0.5 * Math.sin(time * 5);
      for (let j = 0; j < lineH; j++)
        t.blendPixel(lx - 3, ly0 + (rows - 1) * lineH + j, LIME[0], LIME[1], LIME[2], 0.5 * pulse);
    }

    // ══ CURSOR GLOW FLOURISH ══════════════════════════════════════════════════════
    // ripple radius pulses gently; warm when a button is held
    const ripple = 9 + 2.5 * Math.sin(time * 4.2);
    const gcol: [number, number, number] = curDown ? [255, 180, 120] : [150, 210, 240];
    glow(t, curX, curY, ripple + 5, gcol, 0.5);
    glow(t, curX, curY, ripple, gcol, 0.9);
    // crisp cursor reticle (crosshair)
    for (let d = -3; d <= 3; d++) {
      t.addPixel(curX + d, curY, gcol[0] * 0.7, gcol[1] * 0.7, gcol[2] * 0.7);
      t.addPixel(curX, curY + d, gcol[0] * 0.7, gcol[1] * 0.7, gcol[2] * 0.7);
    }
    t.setPixel(curX, curY, 255, 255, 255);

    // status footer — mode indicator (AUTO vs LIVE), bottom-left inside the menu.
    {
      const full = autoPilot ? 'AUTO-PILOT' : 'LIVE INPUT';
      const short = autoPilot ? 'AUTO' : 'LIVE';
      const mc = autoPilot ? AMBER : LIME;
      const fy = menuY + menuH - 10;
      const dotX = PAD + 6;
      const pp = 0.5 + 0.5 * Math.sin(time * 3); // pulsing status dot
      for (let dy = 0; dy < 3; dy++)
        for (let dx = 0; dx < 3; dx++) t.setPixel(dotX + dx, fy + 2 + dy, mc[0] * pp, mc[1] * pp, mc[2] * pp);
      const textX = dotX + 6;
      const avail = PAD + menuW - 4 - textX;
      const label = Term.textWidth(full, 1) <= avail ? full : short;
      t.text(textX, fy, label, mc[0], mc[1], mc[2], 1);
    }

    // record this frame's draw cost (EMA); shown one frame later as the MS readout
    // so the headroom under the 60fps cap is visible at a glance.
    drawMsEma = drawMsEma * 0.9 + (performance.now() - frameStart) * 0.1;
  },
});
