/**
 * claude-spark — the Claude logo, alive and reaching for your cursor.
 *
 * The Claude "spark" mark (the radial sunburst) rendered as twelve living
 * TENTACLES. Their rest pose is taken from the real logo: the SVG path was parsed
 * and each spike's true angle + relative length baked in (see SPIKES), so at rest
 * it reads as the genuine, slightly-irregular Claude burst in clay-orange on a
 * deep warm stage.
 *
 * Then it becomes INTERACTIVE: move your mouse and the spark reaches for it. Each
 * tentacle that faces the cursor stretches and curls toward it (a tapered Bézier
 * stroke with a springy follow so they trail and settle organically); tentacles
 * facing away rest. CLICK to make the whole spark surge toward the pointer. With
 * no mouse — or in a headless capture — a virtual cursor roams on an eased orbit
 * so the spark is always alive. Mouse tracking is real xterm SGR reporting parsed
 * off stdin by the ./_term engine (terminal mouse, in pure TypeScript).
 *
 * Scales to any terminal size; carries a live FPS counter.
 *
 * Run: bun run packages/all/example/claude-spark.ts   (move/click the mouse · ESC/q quit)
 */
import { run } from '@bun-win32/terminal';

import { clamp, clamp01, smoothstep, lerp, mulberry32, TAU } from './_kit';

// Twelve spikes parsed from Anthropic's claude-logo.svg: {degrees, length 0..1}.
const SPIKES = [
  { deg: -178.9, len: 0.91 },
  { deg: -146.2, len: 0.927 },
  { deg: -115.7, len: 1.0 },
  { deg: -80.1, len: 0.898 },
  { deg: -49.1, len: 0.935 },
  { deg: -8.6, len: 0.914 },
  { deg: 13.7, len: 0.931 },
  { deg: 42.1, len: 0.935 },
  { deg: 57.1, len: 0.9 },
  { deg: 93.0, len: 0.912 },
  { deg: 124.2, len: 0.904 },
  { deg: 146.6, len: 0.861 },
];
const N = SPIKES.length;

const CLAY: [number, number, number] = [217, 119, 87]; // body clay at the tips
const CLAY_HOT: [number, number, number] = [240, 158, 110]; // brighter clay nearer the core (light from within)
const CLAY_GLOW: [number, number, number] = [150, 70, 44]; // dim additive halo (stays clay in overlaps)
const CLAY_RIM: [number, number, number] = [255, 196, 150]; // warm rim/sheen highlight
const CORE: [number, number, number] = [255, 210, 162]; // hot centre highlight
const BG: [number, number, number] = [16, 13, 12];

// Per-tentacle springy tip state (allocated to size in init).
let tipX = new Float64Array(N);
let tipY = new Float64Array(N);
const phase = new Float64Array(N);
let inited = false;

// Background radial profile LUT (the stage is rotationally symmetric about the
// centre, so vignette + warm glow depend only on distance). Rebuilt on resize.
let bgLut: Float64Array | null = null; // [r0,g0,b0, r1,g1,b1, …] by integer distance
let bgLutR = 0; // L_/maxDist scale baked into the table
const buildBgLut = (R: number, maxR: number): void => {
  const n = (Math.ceil(maxR) + 2) | 0;
  const lut = new Float64Array(n * 3);
  const invR2 = 1 / (R * R * 1.3);
  const invMaxR = 1 / maxR;
  for (let d = 0; d < n; d++) {
    const vig = 1 - 0.5 * (d * invMaxR);
    const glow = Math.exp(-(d * d) * invR2); // tight warm pool behind the spark
    const halo = Math.exp(-(d * d) * invR2 * 0.22) * 0.5; // broad soft bloom
    lut[d * 3] = clamp(BG[0] * vig + glow * 78 + halo * 34, 0, 255);
    lut[d * 3 + 1] = clamp(BG[1] * vig + glow * 40 + halo * 16, 0, 255);
    lut[d * 3 + 2] = clamp(BG[2] * vig + glow * 27 + halo * 11, 0, 255);
  }
  bgLut = lut;
  bgLutR = n;
};

// Control state. spin/reachScale persist across resizes; kb target re-seeds on init.
// Initial values may be set from the env (SPARK_SPIN radians, SPARK_REACH 0.2..2).
let spin = Number(process.env.SPARK_SPIN) || 0; // Q/E rotate the whole spark
let reachScale = process.env.SPARK_REACH ? Math.max(0.2, Math.min(2, Number(process.env.SPARK_REACH))) : 1; // [ ] reach
let kbX = 0,
  kbY = 0; // WASD / arrow aim target (pixels)
let lastMouseT = -99,
  lastKeyT = -99,
  prevSeq = 0;
let keyDirty = false;

const restPos = (i: number, cx: number, cy: number, R: number): [number, number] => {
  const a = (SPIKES[i].deg * Math.PI) / 180;
  return [cx + Math.cos(a) * R * SPIKES[i].len, cy + Math.sin(a) * R * SPIKES[i].len];
};

run({
  title: 'CLAUDE SPARK',
  hud: 'WASD/ARROWS AIM - QE SPIN - [ ] REACH - CLICK SURGE - ESC QUIT',
  mouse: true,
  quitOnQ: false, // Q is a control key here (spin) — ESC / Ctrl-C still quit
  captureT: 5,
  onKey: (k, t) => {
    const step = Math.min(t.width, t.height) * 0.06;
    if (k === 'w' || k === 'up') kbY -= step;
    else if (k === 's' || k === 'down') kbY += step;
    else if (k === 'a' || k === 'left') kbX -= step;
    else if (k === 'd' || k === 'right') kbX += step;
    else if (k === 'q') spin -= 0.13;
    else if (k === 'e') spin += 0.13;
    else if (k === '[') reachScale = Math.max(0.2, reachScale - 0.1);
    else if (k === ']') reachScale = Math.min(2.0, reachScale + 0.1);
    else if (k === 'r') {
      spin = 0;
      reachScale = 1;
      kbX = t.width / 2 + Math.min(t.width, t.height) * 0.25;
      kbY = t.height / 2;
    } else return;
    kbX = Math.max(0, Math.min(t.width - 1, kbX));
    kbY = Math.max(0, Math.min(t.height - 1, kbY));
    keyDirty = true;
  },
  init: (t) => {
    const cx = t.width / 2,
      cy = t.height / 2,
      R = Math.min(t.width, t.height) * 0.42;
    buildBgLut(R, Math.hypot(t.width, t.height) * 0.5);
    const rng = mulberry32(0x5afe);
    for (let i = 0; i < N; i++) {
      const [rx, ry] = restPos(i, cx, cy, R);
      tipX[i] = rx;
      tipY[i] = ry;
      phase[i] = rng() * TAU;
    }
    kbX = cx + R * 0.6; // default aim
    kbY = cy;
    prevSeq = t.mouse.sequence;
    inited = true;
  },
  frame: (t, time, dt) => {
    const { width: W, height: H } = t;
    const cx = W / 2,
      cy = H / 2;
    const R = Math.min(W, H) * 0.42;
    if (!inited) return;

    // ── Background: deep warm stage + a soft central glow + vignette ──────────
    // Rotationally symmetric → read a precomputed radial profile by distance
    // (no per-pixel sqrt/exp). LUT is rebuilt in init/resize for the current R.
    const maxR = Math.hypot(W, H) * 0.5;
    if (!bgLut) buildBgLut(R, maxR);
    const lut = bgLut!,
      lutMax = bgLutR - 1,
      buf = t.pixels;
    for (let y = 0; y < H; y++) {
      const dy = y - cy,
        dy2 = dy * dy;
      let i = y * W * 3;
      for (let x = 0; x < W; x++) {
        const dx = x - cx;
        let d = Math.sqrt(dx * dx + dy2) | 0;
        if (d > lutMax) d = lutMax;
        const li = d * 3;
        buf[i] = lut[li];
        buf[i + 1] = lut[li + 1];
        buf[i + 2] = lut[li + 2];
        i += 3;
      }
    }

    // ── Input mode: most-recently-used of mouse / keyboard wins, else orbit ───
    if (t.mouse.active && t.mouse.sequence !== prevSeq) {
      prevSeq = t.mouse.sequence;
      lastMouseT = time;
    }
    if (keyDirty) {
      lastKeyT = time;
      keyDirty = false;
    }
    const useMouse = t.mouse.active && time - lastMouseT < 1.5;
    const useKeys = time - lastKeyT < 4.0;
    let mx: number, my: number, mode: number; // 0 auto · 1 mouse · 2 keys
    if (useMouse && (!useKeys || lastMouseT >= lastKeyT)) {
      mx = t.mouse.x;
      my = t.mouse.y;
      mode = 1;
    } else if (useKeys) {
      mx = kbX;
      my = kbY;
      mode = 2;
    } else {
      mx = cx + Math.cos(time * 0.5) * R * 0.82;
      my = cy + Math.sin(time * 0.7) * R * 0.66;
      mode = 0;
    } // eased idle orbit
    const surge = t.mouse.down ? 1 : 0; // click = stronger reach
    const reachK = (0.5 + 0.4 * surge) * reachScale;

    let tdx = mx - cx,
      tdy = my - cy;
    const md = Math.max(1e-3, Math.hypot(tdx, tdy));
    const mnx = tdx / md,
      mny = tdy / md;
    const springK = 1 - Math.exp(-dt * (9 + 6 * surge)); // follow rate (snappier on click)

    // helper: additive radial-falloff disc (soft glow / bloom).
    const glowDisc = (x: number, y: number, r: number, c: [number, number, number], k = 1): void => {
      const r2 = r * r,
        invR2 = 1 / r2;
      const x0 = Math.max(0, Math.floor(x - r)),
        x1 = Math.min(W - 1, Math.ceil(x + r));
      const y0 = Math.max(0, Math.floor(y - r)),
        y1 = Math.min(H - 1, Math.ceil(y + r));
      const cr = c[0] * k,
        cg = c[1] * k,
        cb = c[2] * k;
      for (let py = y0; py <= y1; py++) {
        const dy = py - y,
          dy2 = dy * dy;
        for (let px = x0; px <= x1; px++) {
          const dx = px - x;
          const d2 = dx * dx + dy2;
          if (d2 > r2) continue;
          const f = 1 - d2 * invR2;
          t.addPixel(px, py, cr * f, cg * f, cb * f);
        }
      }
    };

    // helper: anti-aliased SOLID disc — opaque core, ~1px feathered rim. Optional
    // [rim,g,b] sheen blended on the outer shell to give the clay a lit edge.
    const bodyDisc = (x: number, y: number, r: number, cr: number, cg: number, cb: number, rim?: [number, number, number]): void => {
      const r2 = r * r;
      const inner = Math.max(0, r - 1),
        inner2 = inner * inner;
      const x0 = Math.max(0, Math.floor(x - r)),
        x1 = Math.min(W - 1, Math.ceil(x + r));
      const y0 = Math.max(0, Math.floor(y - r)),
        y1 = Math.min(H - 1, Math.ceil(y + r));
      for (let py = y0; py <= y1; py++) {
        const dy = py - y,
          dy2 = dy * dy;
        for (let px = x0; px <= x1; px++) {
          const dx = px - x;
          const d2 = dx * dx + dy2;
          if (d2 > r2) continue;
          if (d2 <= inner2) {
            t.setPixel(px, py, cr, cg, cb);
          } else {
            // feathered shell: coverage by distance from the true edge, and a
            // touch of warm rim sheen right at the silhouette.
            const d = Math.sqrt(d2);
            const cov = clamp01(r - d);
            if (rim) {
              const s = d - inner; // 0 at inner shell → 1 at edge
              t.blendPixel(px, py, lerp(cr, rim[0], s * 0.6), lerp(cg, rim[1], s * 0.6), lerp(cb, rim[2], s * 0.6), cov);
            } else {
              t.blendPixel(px, py, cr, cg, cb, cov);
            }
          }
        }
      }
    };

    const baseW = Math.max(1.8, R * 0.058); // wedge base → reads as the Claude burst, not a thin star
    const tipW = Math.max(0.4, R * 0.008);

    // ── Each tentacle: spring its tip toward (rest blended with reach) ────────
    for (let i = 0; i < N; i++) {
      const a = (SPIKES[i].deg * Math.PI) / 180 + spin; // Q/E rotate the whole burst
      const dirx = Math.cos(a),
        diry = Math.sin(a);
      const breath = 1 + 0.05 * Math.sin(time * 1.2 + phase[i]);
      const rx = cx + dirx * R * SPIKES[i].len * breath;
      const ry = cy + diry * R * SPIKES[i].len * breath;

      // alignment of this spike with the cursor direction → how much it reaches
      const align = clamp(dirx * mnx + diry * mny, -1, 1);
      const w = smoothstep(0.18, 1.0, align) * reachK; // only well-aligned arms reach
      // desired tip: rest, pulled toward the cursor for facing spikes (and a faint
      // global lean when the cursor is close)
      const near = smoothstep(R * 2.0, R * 0.5, md);
      const dx = lerp(rx, mx, w) - rx + (mx - rx) * 0.03 * near;
      const dy = lerp(ry, my, w) - ry + (my - ry) * 0.03 * near;
      let destX = rx + dx,
        destY = ry + dy;
      // clamp how far a tentacle can stretch from the centre (keeps it a logo, not a flail)
      const ex = destX - cx,
        ey = destY - cy,
        el = Math.hypot(ex, ey);
      const cap = R * 1.4;
      if (el > cap) {
        destX = cx + (ex / el) * cap;
        destY = cy + (ey / el) * cap;
      }
      // spring follow (organic trail + settle)
      tipX[i] += (destX - tipX[i]) * springK;
      tipY[i] += (destY - tipY[i]) * springK;

      // draw a tapered, gently-curved Bézier stroke center → ctrl → tip
      const tx = tipX[i],
        ty = tipY[i];
      const vx = tx - cx,
        vy = ty - cy;
      const vlen = Math.max(1e-3, Math.hypot(vx, vy));
      const ux = vx / vlen,
        uy = vy / vlen;
      const perpx = -uy,
        perpy = ux;
      const sway = vlen * (0.12 * Math.sin(time * 1.4 + phase[i]) + 0.14 * w);
      const ctrlX = cx + vx * 0.5 + perpx * sway;
      const ctrlY = cy + vy * 0.5 + perpy * sway;

      const steps = Math.max(10, Math.ceil(vlen / 1.1));
      const invSteps = 1 / steps;
      for (let s = 0; s <= steps; s++) {
        const u = s * invSteps,
          m = 1 - u;
        const bx = m * m * cx + 2 * m * u * ctrlX + u * u * tx;
        const by = m * m * cy + 2 * m * u * ctrlY + u * u * ty;
        // Wedge profile: a confident tapered spike (full near the hub, steadily
        // converging to a real point) — the Claude mark, not a thin needle or a paddle.
        const taper = m * (0.55 + 0.45 * m); // ≈ quadratic ease to a sharp tip
        const wid = baseW * taper + tipW;
        // Light from within: hotter clay near the hub, settling to body clay at the tip.
        const heat = 1 - smoothstep(0.0, 0.55, u);
        const cr = lerp(CLAY[0], CLAY_HOT[0], heat);
        const cg = lerp(CLAY[1], CLAY_HOT[1], heat);
        const cb = lerp(CLAY[2], CLAY_HOT[2], heat);
        glowDisc(bx, by, wid * 1.7 + 1, CLAY_GLOW, 0.16); // faint clay bloom behind the body
        bodyDisc(bx, by, wid, cr, cg, cb, CLAY_RIM); // shaded solid clay with a lit rim
      }
    }

    // ── Centre hub where the tentacles fuse + a hot, clean core ───────────────
    glowDisc(cx, cy, R * 0.3, CLAY_GLOW, 0.4); // warm seat under the hub
    bodyDisc(cx, cy, R * 0.15, CLAY_HOT[0], CLAY_HOT[1], CLAY_HOT[2], CLAY_RIM);
    bodyDisc(cx, cy, R * 0.075, CORE[0], CORE[1], CORE[2]); // hot inner disc
    glowDisc(cx, cy, R * 0.05, [255, 240, 218], 0.7); // crisp bright pip
    glowDisc(cx, cy, R * 0.2, CORE, 0.16); // gentle radiant halo off the core

    // ── Pointer reticle so you can see what it's reaching for ─────────────────
    {
      const rr = Math.max(2, R * 0.05);
      const col: [number, number, number] = mode === 1 ? [255, 230, 205] : mode === 2 ? [235, 200, 165] : [150, 120, 100];
      const ringA = mode === 0 ? 0.4 : 0.9;
      for (let k = 0; k < 48; k++) {
        const ang = (k / 48) * TAU;
        t.blendPixel(Math.round(mx + Math.cos(ang) * rr), Math.round(my + Math.sin(ang) * rr), col[0], col[1], col[2], ringA);
      }
      if (mode === 1 && surge) glowDisc(mx, my, rr * 0.6, CORE, 0.5);
    }
  },
});
