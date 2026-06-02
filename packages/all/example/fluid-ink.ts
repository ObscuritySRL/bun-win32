/**
 * Fluid Ink — luminous colored ink folding and swirling in dark water.
 *
 * A real-time 2D STABLE-FLUIDS solver (Jos Stam, "Stable Fluids", SIGGRAPH 1999)
 * in pure TypeScript on the CPU. A FIXED internal grid (decoupled from the
 * terminal size) carries a velocity field that is advected SEMI-LAGRANGIANLY
 * (trace each cell backward along the flow, bilinearly sample the source —
 * unconditionally stable for any timestep), made incompressible by a sweep of
 * red-black GAUSS-SEIDEL pressure-projection iterations (∇·u → solve ∇²p = ∇·u →
 * u -= ∇p), and used to transport three continuous colored DYE fields. Strong
 * VORTICITY CONFINEMENT re-injects the curl that numerical diffusion eats, so the
 * ink keeps rolling into vortices and folding into sheets instead of dissolving
 * into cloud; a buoyancy term lets bright dye rise like smoke. A deterministic
 * timeline of slow Lissajous EMITTERS injects thin dye streams + swirling force
 * impulses, with the occasional vortex burst — so the piece is alive with no
 * input. The grid is BILINEARLY upsampled to the full pixel buffer and mapped
 * density→luminous HDR color: a designed indigo→magenta→amber palette that MIXES
 * in the flow, an additive glow core on dense ink, edge light from the dye
 * gradient for filament depth, and an ACES tonemap. All randomness is
 * mulberry32-seeded, so captures are deterministic.
 *
 * Technique: semi-Lagrangian advection · red-black Gauss-Seidel pressure
 * projection · vorticity confinement · buoyancy · bilinear dye upsample · HDR
 * additive glow + gradient edge-light + ACES grade.
 *
 * Run: bun run packages/all/example/fluid-ink.ts
 */
import { runDemo, Term, clamp01, lerp, mulberry32, TAU } from './_term';

// ── Fixed internal simulation grid ─────────────────────────────────────────────
// The solver always runs at this resolution (plus a 1-cell border) regardless of
// the terminal size, then is bilinearly sampled to the screen each frame. This
// keeps filament detail constant on any window and the cost predictable. Tuned so
// the full pipeline benches comfortably above 120fps.
const GW = 150; // interior cells across
const GH = 88;  // interior cells down
const NX = GW + 2;
const NY = GH + 2;
const N = NX * NY;

// ── Solver tuning ───────────────────────────────────────────────────────────────
const PRESSURE_ITERS = 24; // red-black Gauss-Seidel sweeps → a smooth, divergence-free field
const VORT_EPS = 2.2;      // vorticity confinement — restores the curl that keeps sheets folding (slightly raised → finer filaments)
const BUOYANCY = 0.92;     // bright dye rises (negative-y = up)
const AMBIENT_COOL = 0.22; // average density pulls down (so the tank circulates)
const DYE_DECAY = 0.9968;  // ink slowly dissolves; water returns to dark (slightly slower → structure persists + fills the frame)
const DYE_FLOOR = 0.0024;  // subtractive floor — crushes faint stray dye → clean dark water
const VEL_DAMP = 0.9978;   // gentle velocity bleed so energy doesn't blow up
const FLOW_SCALE = 0.85;   // global flow speed
const DYE_DIFFUSE = 0.17;  // light diffusion — keeps filaments crisp, not blurred to cloud (lowered → finer threads)

// ── Field storage ───────────────────────────────────────────────────────────────
const u = new Float32Array(N);
const v = new Float32Array(N);
const u0 = new Float32Array(N);
const v0 = new Float32Array(N);
const dr = new Float32Array(N);
const dg = new Float32Array(N);
const db = new Float32Array(N);
const s0 = new Float32Array(N); // scratch for advection / diffusion
const s1 = new Float32Array(N);
const s2 = new Float32Array(N);
const p = new Float32Array(N);
const div = new Float32Array(N);
const curl = new Float32Array(N);
const aCurl = new Float32Array(N); // |curl|

const rng = mulberry32(0x10e1d);

// ── Boundaries: free-slip walls (flow slides along edges, scalars copy inward). ──
const setVelBounds = (): void => {
  for (let x = 1; x < NX - 1; x++) {
    u[x] = u[NX + x]; v[x] = -v[NX + x];
    const b = (NY - 1) * NX, b1 = (NY - 2) * NX;
    u[b + x] = u[b1 + x]; v[b + x] = -v[b1 + x];
  }
  for (let y = 1; y < NY - 1; y++) {
    const r = y * NX;
    u[r] = -u[r + 1]; v[r] = v[r + 1];
    u[r + NX - 1] = -u[r + NX - 2]; v[r + NX - 1] = v[r + NX - 2];
  }
};

const setScalarBounds = (sc: Float32Array): void => {
  for (let x = 1; x < NX - 1; x++) {
    sc[x] = sc[NX + x];
    sc[(NY - 1) * NX + x] = sc[(NY - 2) * NX + x];
  }
  for (let y = 1; y < NY - 1; y++) {
    const r = y * NX;
    sc[r] = sc[r + 1];
    sc[r + NX - 1] = sc[r + NX - 2];
  }
};

// ── Semi-Lagrangian advection (unconditionally stable). ─────────────────────────
const advect = (dst: Float32Array, src: Float32Array, dt: number): void => {
  const maxX = NX - 1.001;
  const maxY = NY - 1.001;
  for (let y = 1; y < NY - 1; y++) {
    const row = y * NX;
    for (let x = 1; x < NX - 1; x++) {
      const i = row + x;
      let px = x - dt * u[i];
      let py = y - dt * v[i];
      if (px < 0.5) px = 0.5; else if (px > maxX) px = maxX;
      if (py < 0.5) py = 0.5; else if (py > maxY) py = maxY;
      const x0 = px | 0, y0 = py | 0;
      const sx = px - x0, sy = py - y0;
      const b = y0 * NX, tt = b + NX;
      const a00 = src[b + x0], a10 = src[b + x0 + 1];
      const a01 = src[tt + x0], a11 = src[tt + x0 + 1];
      const top = a00 + (a10 - a00) * sx;
      const bot = a01 + (a11 - a01) * sx;
      dst[i] = top + (bot - top) * sy;
    }
  }
};

// ── Pressure projection (red-black Gauss-Seidel — faster-converging than Jacobi). ─
const project = (iters: number): void => {
  p.fill(0); // native zero of the whole field (incl. borders) — cheaper than a JS loop
  for (let y = 1; y < NY - 1; y++) {
    const row = y * NX;
    for (let x = 1; x < NX - 1; x++) {
      const i = row + x;
      div[i] = -0.5 * (u[i + 1] - u[i - 1] + v[i + NX] - v[i - NX]);
    }
  }
  setScalarBounds(div);
  const xMax = NX - 1, yMax = NY - 1;
  for (let k = 0; k < iters; k++) {
    for (let pass = 0; pass < 2; pass++) {
      for (let y = 1; y < yMax; y++) {
        const row = y * NX;
        // checkerboard: start column alternates with row parity and pass
        const start = 1 + ((y + pass) & 1);
        for (let x = start; x < xMax; x += 2) {
          const i = row + x;
          p[i] = (div[i] + p[i - 1] + p[i + 1] + p[i - NX] + p[i + NX]) * 0.25;
        }
      }
    }
    // inlined scalar boundary for `p` (free-slip copy-inward) — avoids 24×/frame
    // function-call + array-param indirection that blocks JIT specialization.
    for (let x = 1; x < xMax; x++) {
      p[x] = p[NX + x];
      p[(NY - 1) * NX + x] = p[(NY - 2) * NX + x];
    }
    for (let y = 1; y < yMax; y++) {
      const r = y * NX;
      p[r] = p[r + 1];
      p[r + NX - 1] = p[r + NX - 2];
    }
  }
  for (let y = 1; y < NY - 1; y++) {
    const row = y * NX;
    for (let x = 1; x < NX - 1; x++) {
      const i = row + x;
      u[i] -= 0.5 * (p[i + 1] - p[i - 1]);
      v[i] -= 0.5 * (p[i + NX] - p[i - NX]);
    }
  }
  setVelBounds();
};

// ── Vorticity confinement: restore the small curls numerical diffusion erases,
// so filaments keep rolling. CRITICAL: normalize the curl-gradient with a real
// floor (not 1e-5) — otherwise flat regions divide tiny rounding by tiny length
// and explode into per-cell velocity noise → confetti. We also 4-neighbour smooth
// |curl| first so the confinement force is low-frequency (coherent curl, not dots).
const VORT_FLOOR = 0.02;
const vorticityConfine = (eps: number, dt: number): void => {
  for (let y = 1; y < NY - 1; y++) {
    const row = y * NX;
    for (let x = 1; x < NX - 1; x++) {
      const i = row + x;
      const c = (v[i + 1] - v[i - 1]) * 0.5 - (u[i + NX] - u[i - NX]) * 0.5;
      curl[i] = c;
      aCurl[i] = c < 0 ? -c : c;
    }
  }
  // smooth |curl| into s0 (reuse scratch) so its gradient is well-behaved
  for (let y = 2; y < NY - 2; y++) {
    const row = y * NX;
    for (let x = 2; x < NX - 2; x++) {
      const i = row + x;
      s0[i] = (aCurl[i] * 4 + aCurl[i - 1] + aCurl[i + 1] + aCurl[i - NX] + aCurl[i + NX]) * 0.125;
    }
  }
  for (let y = 2; y < NY - 2; y++) {
    const row = y * NX;
    for (let x = 2; x < NX - 2; x++) {
      const i = row + x;
      const gx = (s0[i + 1] - s0[i - 1]) * 0.5;
      const gy = (s0[i + NX] - s0[i - NX]) * 0.5;
      const len = Math.sqrt(gx * gx + gy * gy);
      if (len < VORT_FLOOR) continue; // flat curl → no force (kills the noise term)
      const w = curl[i];
      const s = (eps * dt) / len;
      u[i] += s * gy * w;
      v[i] -= s * gx * w;
    }
  }
};

// ── Soft radial splat of dye + force. ───────────────────────────────────────────
const splat = (
  cx: number, cy: number, radius: number,
  fx: number, fy: number, cr: number, cg: number, cb: number, amt: number,
): void => {
  const r2 = radius * radius;
  const inv = 1 / (r2 * 0.55);
  const x0 = Math.max(1, (cx - radius) | 0), x1 = Math.min(NX - 2, (cx + radius + 1) | 0);
  const y0 = Math.max(1, (cy - radius) | 0), y1 = Math.min(NY - 2, (cy + radius + 1) | 0);
  for (let y = y0; y <= y1; y++) {
    const row = y * NX;
    const ddy = y - cy;
    for (let x = x0; x <= x1; x++) {
      const ddx = x - cx;
      const d2 = ddx * ddx + ddy * ddy;
      if (d2 > r2) continue;
      const g = Math.exp(-d2 * inv);
      const i = row + x;
      u[i] += fx * g;
      v[i] += fy * g;
      const a = g * amt;
      dr[i] += cr * a;
      dg[i] += cg * a;
      db[i] += cb * a;
    }
  }
};

// ── Tangential vortex impulse. ──────────────────────────────────────────────────
const vortex = (cx: number, cy: number, radius: number, strength: number): void => {
  const r2 = radius * radius;
  const inv = 1 / (r2 * 0.5);
  const x0 = Math.max(1, (cx - radius) | 0), x1 = Math.min(NX - 2, (cx + radius + 1) | 0);
  const y0 = Math.max(1, (cy - radius) | 0), y1 = Math.min(NY - 2, (cy + radius + 1) | 0);
  for (let y = y0; y <= y1; y++) {
    const row = y * NX;
    const ddy = y - cy;
    for (let x = x0; x <= x1; x++) {
      const ddx = x - cx;
      const d2 = ddx * ddx + ddy * ddy;
      if (d2 > r2) continue;
      const g = Math.exp(-d2 * inv);
      const i = row + x;
      u[i] += -ddy * strength * g;
      v[i] += ddx * strength * g;
    }
  }
};

// ── Designed palette ────────────────────────────────────────────────────────────
// Three cohesive inks: deep indigo, hot magenta, warm amber. A scalar "tint"
// 0..1 carried per emitter picks a position on the ramp; the three dye channels
// then mix freely as the inks fold together. Values are linear-ish HDR.
type RGB = [number, number, number];
const INK_INDIGO: RGB = [0.10, 0.30, 1.15];
const INK_MAGENTA: RGB = [1.20, 0.16, 0.78];
const INK_AMBER: RGB = [1.30, 0.62, 0.12];
const inkColor = (tint: number): RGB => {
  // 0 → indigo, 0.5 → magenta, 1 → amber
  if (tint < 0.5) {
    const k = tint * 2;
    return [
      lerp(INK_INDIGO[0], INK_MAGENTA[0], k),
      lerp(INK_INDIGO[1], INK_MAGENTA[1], k),
      lerp(INK_INDIGO[2], INK_MAGENTA[2], k),
    ];
  }
  const k = (tint - 0.5) * 2;
  return [
    lerp(INK_MAGENTA[0], INK_AMBER[0], k),
    lerp(INK_MAGENTA[1], INK_AMBER[1], k),
    lerp(INK_MAGENTA[2], INK_AMBER[2], k),
  ];
};

// ── Emitters: slow Lissajous sources tracing the tank, drifting their tint. ─────
interface Emitter {
  tint: number;     // palette position
  tintDrift: number;
  cx: number; cy: number;   // path centre (fraction of grid) — spread across the tank
  ax: number; ay: number;
  fx: number; fy: number;
  phx: number; phy: number;
  speed: number;
  radius: number;
  swirl: number;    // self-swirl handedness
}
let emitters: Emitter[] = [];
const buildEmitters = (): void => {
  emitters = [];
  // Bias tints toward the indigo/magenta/amber anchors so the palette stays read-
  // able rather than a continuous rainbow. Spread the path centres EVENLY across
  // the full width (edges included) so ink fills the whole frame — not a cluster
  // floating in a void; bias the centres low so plumes rise. Six sources weave
  // the three inks together for richer mixing without becoming a rainbow.
  const anchors = [0.03, 0.5, 0.97, 0.24, 0.74, 0.46];
  const centresX = [0.12, 0.30, 0.50, 0.70, 0.88, 0.42];
  for (let k = 0; k < anchors.length; k++) {
    emitters.push({
      tint: anchors[k],
      tintDrift: (rng() - 0.5) * 0.05,
      cx: centresX[k],
      cy: 0.60 + rng() * 0.22,        // lower band — plumes rise through the frame
      ax: 0.17 + rng() * 0.16,        // wide Lissajous reach → streams criss-cross + cross hues
      ay: 0.13 + rng() * 0.14,
      fx: 0.05 + rng() * 0.11,
      fy: 0.06 + rng() * 0.12,
      phx: rng() * TAU,
      phy: rng() * TAU,
      speed: 1.0 + rng() * 0.55,
      radius: 1.7 + rng() * 1.0,      // thin nibs → fine streams that fold, not fat plumes
      swirl: (rng() < 0.5 ? 1 : -1) * (0.7 + rng() * 0.8),
    });
  }
};

// ── Explicit diffusion, a few small sub-steps for an unconditionally smooth field
// (each sub-step uses k≤0.2 per axis so it never rings). Keeps the dye continuous
// — folding sheets and filaments rather than per-cell speckle. ──────────────────
const DIFFUSE_SUBSTEPS = 2;
const diffuse = (sc: Float32Array, tmp: Float32Array, k: number): void => {
  const kk = (k / DIFFUSE_SUBSTEPS) * 0.25;
  for (let s = 0; s < DIFFUSE_SUBSTEPS; s++) {
    tmp.set(sc);
    for (let y = 1; y < NY - 1; y++) {
      const row = y * NX;
      for (let x = 1; x < NX - 1; x++) {
        const i = row + x;
        sc[i] = tmp[i] + kk * (tmp[i - 1] + tmp[i + 1] + tmp[i - NX] + tmp[i + NX] - 4 * tmp[i]);
      }
    }
  }
};

// ── One simulation step. ────────────────────────────────────────────────────────
const step = (time: number, dt: number): void => {
  const sdt = Math.min(dt, 1 / 60) * 60 * FLOW_SCALE;

  // — Moving emitters inject thin dye streams + drag the fluid along their path —
  for (let k = 0; k < emitters.length; k++) {
    const e = emitters[k];
    const ang = time * TAU;
    const px = Math.cos(ang * e.fx + e.phx);
    const py = Math.sin(ang * e.fy + e.phy);
    const ex = (e.cx + e.ax * px) * GW + 1;
    const ey = (e.cy + e.ay * py) * GH + 1;
    // path-tangent velocity (drag the fluid with the source)
    const vx = -e.ax * Math.sin(ang * e.fx + e.phx) * e.fx * TAU * GW;
    const vy = e.ay * Math.cos(ang * e.fy + e.phy) * e.fy * TAU * GH;
    const tint = clamp01(e.tint + e.tintDrift * Math.sin(time * 0.13 + k));
    const [cr, cg, cb] = inkColor(tint);
    const pulse = 0.78 + 0.22 * Math.sin(time * 1.3 + k * 1.7);
    // fade the emitters in over the first ~0.6s so the t=0 opening frame is the
    // clean designed seed-stroke, not peppered with bright emitter specks
    const fade = time < 0.6 ? time / 0.6 : 1;
    splat(
      ex, ey, e.radius,
      vx * 0.05 - e.swirl * vy * 0.055,
      vy * 0.05 + e.swirl * vx * 0.055 - 0.95, // path drag + handed swirl + buoyant kick
      cr, cg, cb,
      e.speed * pulse * 0.34 * fade,
    );
  }

  // — Deterministic vortex bursts: a slow heartbeat of large-scale swirl —
  const vt = time * 0.42;
  if (vt - Math.floor(vt) < 0.05 && time > 0.3) {
    const burst = Math.floor(vt);
    const s = mulberry32(0x5eed ^ burst);
    const cx = (0.18 + s() * 0.64) * GW + 1;
    const cy = (0.30 + s() * 0.5) * GH + 1;
    const dir = s() < 0.5 ? 1 : -1;
    vortex(cx, cy, 11 + s() * 7, dir * 1.1);
  }

  // — Buoyancy: bright ink rises, mean density gently sinks (closes the loop) —
  let mean = 0;
  for (let i = 0; i < N; i++) mean += dr[i] + dg[i] + db[i];
  mean /= N;
  for (let y = 1; y < NY - 1; y++) {
    const row = y * NX;
    for (let x = 1; x < NX - 1; x++) {
      const i = row + x;
      const dens = dr[i] + dg[i] + db[i];
      v[i] -= (BUOYANCY * dens - AMBIENT_COOL * mean) * sdt * 0.02;
    }
  }

  // — Vorticity confinement keeps the curls alive —
  vorticityConfine(VORT_EPS, sdt);
  setVelBounds();

  // — Velocity self-advection —
  u0.set(u); v0.set(v);
  advect(u, u0, sdt);
  advect(v, v0, sdt);
  for (let i = 0; i < N; i++) { u[i] *= VEL_DAMP; v[i] *= VEL_DAMP; }
  setVelBounds();

  // — Incompressibility —
  project(PRESSURE_ITERS);

  // — Advect the three dye fields through the divergence-free flow —
  s0.set(dr); s1.set(dg); s2.set(db);
  advect(dr, s0, sdt);
  advect(dg, s1, sdt);
  advect(db, s2, sdt);
  // Decay toward dark water, with a soft floor: very faint dye is pulled to zero
  // a little extra so stray scattered ink dissolves instead of lingering as a
  // uniform haze / confetti. (Subtract a tiny constant, clamp at 0.)
  for (let i = 0; i < N; i++) {
    let a = dr[i] * DYE_DECAY - DYE_FLOOR; dr[i] = a > 0 ? a : 0;
    a = dg[i] * DYE_DECAY - DYE_FLOOR; dg[i] = a > 0 ? a : 0;
    a = db[i] * DYE_DECAY - DYE_FLOOR; db[i] = a > 0 ? a : 0;
  }
  diffuse(dr, s0, DYE_DIFFUSE); diffuse(dg, s1, DYE_DIFFUSE); diffuse(db, s2, DYE_DIFFUSE);
  setScalarBounds(dr); setScalarBounds(dg); setScalarBounds(db);
};

// ── Render: bilinear-upsample dye to pixels, HDR glow + filament edge-light + ACES.
// Deep-water base tint and exposure as linear HDR.
const BASE_R = 0.006, BASE_G = 0.013, BASE_B = 0.034;
const EXPOSURE = 1.5;
// ACES tonemap constants (must match _term `aces` exactly) — inlined per pixel.
const ACES_A = 2.51, ACES_B = 0.03, ACES_C = 2.43, ACES_D = 0.59, ACES_E = 0.14;

// Per-cell density magnitude — recomputed once per step into `mag` so the render
// can read a smooth field and take a clean gradient for the filament edge-light.
const mag = new Float32Array(N);
const buildMag = (): void => {
  for (let i = 0; i < N; i++) {
    const d = dr[i] + dg[i] + db[i];
    mag[i] = d;
  }
  setScalarBounds(mag);
};

// Per-axis bilinear lookup tables — the source grid index and fractional weight
// for each screen column/row depend ONLY on the axis position, not the other
// axis, so they are identical for every row/column. Rebuilt only when the screen
// size changes (cheap O(W+H)) instead of O(W·H) every frame.
let lutW = -1, lutH = -1;
let xi = new Int32Array(0);   // base grid x0 per screen column
let xf = new Float32Array(0); // fractional fx per screen column
let yi = new Int32Array(0);
let yf = new Float32Array(0);
const buildBilinearLUT = (W: number, H: number): void => {
  if (W === lutW && H === lutH) return;
  lutW = W; lutH = H;
  xi = new Int32Array(W); xf = new Float32Array(W);
  yi = new Int32Array(H); yf = new Float32Array(H);
  const sx = GW / W, sy = GH / H;
  for (let x = 0; x < W; x++) {
    const gx = 1 + (x + 0.5) * sx - 0.5;
    let x0 = gx | 0;
    if (x0 < 1) x0 = 1; else if (x0 > NX - 3) x0 = NX - 3;
    xi[x] = x0; xf[x] = gx - x0;
  }
  for (let y = 0; y < H; y++) {
    const gy = 1 + (y + 0.5) * sy - 0.5;
    let y0 = gy | 0;
    if (y0 < 1) y0 = 1; else if (y0 > NY - 3) y0 = NY - 3;
    yi[y] = y0; yf[y] = gy - y0;
  }
};

const render = (t: Term): void => {
  buildMag();
  const buf = t.buf;
  const W = t.W, H = t.H;
  buildBilinearLUT(W, H);
  for (let y = 0; y < H; y++) {
    const y0 = yi[y];
    const fy = yf[y];
    const fy1 = 1 - fy;
    const r0 = y0 * NX;
    const r1 = r0 + NX;
    let o = y * W * 3;
    for (let x = 0; x < W; x++) {
      const x0 = xi[x];
      const fx = xf[x];
      const fx1 = 1 - fx;
      const i00 = r0 + x0, i10 = i00 + 1, i01 = r1 + x0, i11 = i01 + 1;
      const w00 = fx1 * fy1, w10 = fx * fy1, w01 = fx1 * fy, w11 = fx * fy;

      let R = dr[i00] * w00 + dr[i10] * w10 + dr[i01] * w01 + dr[i11] * w11;
      let G = dg[i00] * w00 + dg[i10] * w10 + dg[i01] * w01 + dg[i11] * w11;
      let B = db[i00] * w00 + db[i10] * w10 + db[i01] * w01 + db[i11] * w11;

      let dens = R + G + B;

      // — Clean-water rolloff: faint, smeared low-density dye is what reads as a
      // muddy haze pooling in the tank. A smooth cubic gate around a low knee fades
      // that wash toward black while leaving real filaments and cores (which carry
      // genuine density) at full strength — so the water stays a clean deep dark and
      // only structured ink lights up. Applied as a multiplier on all channels. —
      if (dens < 0.16) {
        const tg = dens * 6.25;            // 0..1 across the knee
        const gate = tg * tg * (3 - 2 * tg); // smoothstep
        R *= gate; G *= gate; B *= gate;
        dens *= gate;
      }

      // — Chroma lift: pull each channel away from the luminance mean so mixed
      // regions keep their hue instead of greying toward pink-white. The lift is
      // strongest at mid density (where inks overlap) and fades on faint wisps,
      // so it sharpens colour separation without crushing the dark water. —
      if (dens > 1e-4) {
        const m = dens * (1 / 3);
        const sat = dens < 1.15 ? dens * 0.36 : 0.41; // richer hue separation, still capped
        R += (R - m) * sat;
        G += (G - m) * sat;
        B += (B - m) * sat;
        if (R < 0) R = 0; if (G < 0) G = 0; if (B < 0) B = 0;
      }

      // — Filament edge-light: the gradient of the density field around this grid
      // cell. Folded sheets and vortex filaments have steep boundaries; lighting
      // those rims (tinted by the local ink) carves crisp, luminous edges out of
      // what would otherwise be soft cloud — the signature of ink in water. A
      // centred 2-cell stencil catches even thin filaments without aliasing. —
      const cgx = mag[i10] - mag[i00] + mag[i11] - mag[i01];
      const cgy = mag[i01] - mag[i00] + mag[i11] - mag[i10];
      let grad = cgx < 0 ? -cgx : cgx;
      const ay = cgy < 0 ? -cgy : cgy;
      grad += ay; // |∂x|+|∂y| — cheap gradient magnitude
      // weight rims by their own density so edges in the dark water stay dark
      const rim = grad * (dens < 1 ? dens : 1) * 1.35;
      if (dens > 1e-4 && rim > 0) {
        const inv = rim / dens; // distribute rim energy along the local hue
        R += R * inv;
        G += G * inv;
        B += B * inv;
      }

      // Glow core: dense ink blooms above a soft knee (additive HDR), tinted by
      // the local hue so bright hearts bloom in their own COLOUR — almost no white
      // is added, so a dense heart reads as a saturated luminous core (amber stays
      // amber, magenta stays magenta) instead of clipping to a featureless white
      // puffball. The knee is raised so only genuinely dense ink blooms.
      const core = dens - 1.05;
      if (core > 0) {
        const glow = core * core * 0.34;
        const inv = dens > 1e-4 ? glow / dens : 0;
        // Bloom mostly along the local hue; only a whisper of cool-white floor so a
        // dense heart reads as a saturated luminous core (amber stays amber) rather
        // than clipping to a featureless white puffball.
        R += R * inv * 2.0 + glow * 0.018;
        G += G * inv * 2.0 + glow * 0.016;
        B += B * inv * 2.0 + glow * 0.030;
      }

      R = R * EXPOSURE + BASE_R;
      G = G * EXPOSURE + BASE_G;
      B = B * EXPOSURE + BASE_B;

      // Inlined ACES tonemap (matches helper `aces` exactly): clamp01((x(ax+b))/(x(cx+d)+e))·255
      let tR = (R * (ACES_A * R + ACES_B)) / (R * (ACES_C * R + ACES_D) + ACES_E);
      let tG = (G * (ACES_A * G + ACES_B)) / (G * (ACES_C * G + ACES_D) + ACES_E);
      let tB = (B * (ACES_A * B + ACES_B)) / (B * (ACES_C * B + ACES_D) + ACES_E);
      tR = tR < 0 ? 0 : tR > 1 ? 1 : tR;
      tG = tG < 0 ? 0 : tG > 1 ? 1 : tG;
      tB = tB < 0 ? 0 : tB > 1 ? 1 : tB;
      buf[o] = (tR * 255) | 0;
      buf[o + 1] = (tG * 255) | 0;
      buf[o + 2] = (tB * 255) | 0;
      o += 3;
    }
  }
};

// ── Seed a starter so even frame 0 (dt=0, no flow yet) already reads as ink
// ribbons, not bare dots. Each ink is laid down as a short curved STROKE — a row
// of overlapping splats along a sine-bent path, the dye tapering at the ends — so
// the opening frame shows folding sheets. Counter-rotating vortices + crossing
// velocities prime the field to keep shearing them once the sim starts. ─────────
const stroke = (
  x0: number, y0: number, dx: number, dy: number, bend: number,
  rad: number, tint: number, amt: number,
): void => {
  const [cr, cg, cb] = inkColor(tint);
  const steps = 22;
  // unit normal to the stroke for the sine bend
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len;
  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    const taper = Math.sin(t * Math.PI);       // fade in/out at the ends
    const off = Math.sin(t * Math.PI * 1.5) * bend; // gentle S-curve
    const px = x0 + dx * t + nx * off;
    const py = y0 + dy * t + ny * off;
    // tangent → tiny velocity so the ribbon starts drifting along itself
    splat(px, py, rad * (0.6 + 0.4 * taper), dx * 0.012, dy * 0.012 - 0.4,
      cr, cg, cb, amt * taper);
  }
};
const seed = (): void => {
  u.fill(0); v.fill(0); dr.fill(0); dg.fill(0); db.fill(0);
  const cy = GH * 0.58 + 1;
  // A composed sweep that spans the FULL width so the opening frame is a balanced
  // picture, not a cluster in a void: the palette reads left→right indigo → magenta
  // → amber, three long thin ribbons that arc up and cross at centre (where the
  // hues mix), bracketed by two short accent strokes near the edges. Finer nibs
  // than before so frame 0 already shows threadwork, not fat plumes.
  const left = GW * 0.16 + 1, mid = GW * 0.50 + 1, right = GW * 0.84 + 1;
  stroke(left,        cy + 10, GW * 0.30, -16,  11, 2.2, 0.03, 0.30);  // indigo, low-left → up-right
  stroke(mid - 10,    cy + 14, GW * 0.16, -26, -13, 2.0, 0.50, 0.32);  // magenta, sweeping up through centre
  stroke(right,       cy + 8,  -GW * 0.30, -14, -11, 2.2, 0.96, 0.30); // amber, low-right → up-left (crosses the indigo)
  stroke(left * 0.6,  cy - 6,  GW * 0.12, -8,    7, 1.7, 0.20, 0.24);  // indigo/violet edge accent
  stroke(right + 14,  cy - 2,  -GW * 0.10, -9,  -7, 1.7, 0.78, 0.24);  // warm edge accent
  // counter-rotating vortices distributed across the width keep the crossing
  // ribbons shearing into sheets the instant the sim starts.
  vortex(mid - 16, cy + 2, 12, 0.95);
  vortex(mid + 16, cy - 4, 12, -0.95);
  vortex(left + 6, cy - 2, 9, -0.8);
  vortex(right - 6, cy + 2, 9, 0.8);
};

// ── Demo wiring ────────────────────────────────────────────────────────────────
let inited = false;
const ensure = (): void => {
  if (inited) return;
  buildEmitters();
  seed();
  inited = true;
};

runDemo({
  title: 'Fluid Ink',
  hud: 'STABLE FLUIDS  -  SEMILAGRANGIAN ADVECTION  +  PRESSURE PROJECTION  +  VORTICITY CONFINEMENT',
  captureT: 7,
  init: () => { inited = false; ensure(); },
  frame: (t, time, dt) => {
    ensure();
    // Sub-step large frames so fast paths advect cleanly; cap the work.
    const sub = dt > 0 ? Math.min(2, Math.max(1, Math.round(dt / (1 / 80)))) : 1;
    const sdt = dt / sub;
    for (let s = 0; s < sub; s++) step(time + s * sdt, sdt > 0 ? sdt : 1 / 60);
    render(t);
  },
});
