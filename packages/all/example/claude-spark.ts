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
import { runDemo, clamp, clamp01, smoothstep, lerp, mulberry32, TAU } from './_term';

// Twelve spikes parsed from Anthropic's claude-logo.svg: {degrees, length 0..1}.
const SPIKES = [
  { deg: -178.9, len: 0.91 }, { deg: -146.2, len: 0.927 }, { deg: -115.7, len: 1.0 },
  { deg: -80.1, len: 0.898 }, { deg: -49.1, len: 0.935 }, { deg: -8.6, len: 0.914 },
  { deg: 13.7, len: 0.931 }, { deg: 42.1, len: 0.935 }, { deg: 57.1, len: 0.9 },
  { deg: 93.0, len: 0.912 }, { deg: 124.2, len: 0.904 }, { deg: 146.6, len: 0.861 },
];
const N = SPIKES.length;

const CLAY: [number, number, number] = [217, 119, 87];
const CLAY_GLOW: [number, number, number] = [150, 70, 44]; // dim additive halo (stays clay in overlaps)
const CORE: [number, number, number] = [255, 198, 150]; // hot centre highlight
const BG: [number, number, number] = [16, 13, 12];

// Per-tentacle springy tip state (allocated to size in init).
let tipX = new Float64Array(N);
let tipY = new Float64Array(N);
const phase = new Float64Array(N);
let inited = false;

const restPos = (i: number, cx: number, cy: number, R: number): [number, number] => {
  const a = (SPIKES[i].deg * Math.PI) / 180;
  return [cx + Math.cos(a) * R * SPIKES[i].len, cy + Math.sin(a) * R * SPIKES[i].len];
};

runDemo({
  title: 'CLAUDE SPARK',
  hud: 'MOVE THE MOUSE - THE SPARK REACHES - CLICK TO SURGE',
  mouse: true,
  captureT: 5,
  init: (t) => {
    const cx = t.W / 2, cy = t.H / 2, R = Math.min(t.W, t.H) * 0.42;
    const rng = mulberry32(0x5afe);
    for (let i = 0; i < N; i++) {
      const [rx, ry] = restPos(i, cx, cy, R);
      tipX[i] = rx;
      tipY[i] = ry;
      phase[i] = rng() * TAU;
    }
    inited = true;
  },
  frame: (t, time, dt) => {
    const { W, H } = t;
    const cx = W / 2, cy = H / 2;
    const R = Math.min(W, H) * 0.42;
    if (!inited) return;

    // ── Background: deep warm stage + a soft central glow + vignette ──────────
    const maxR = Math.hypot(W, H) * 0.5;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const dx = (x - cx), dy = (y - cy);
        const d = Math.sqrt(dx * dx + dy * dy);
        const vig = 1 - 0.55 * (d / maxR);
        const glow = Math.exp(-(d * d) / (R * R * 1.3)) * 0.5; // warm pool behind the spark
        const i = (y * W + x) * 3;
        t.buf[i] = clamp(BG[0] * vig + glow * 60, 0, 255);
        t.buf[i + 1] = clamp(BG[1] * vig + glow * 32, 0, 255);
        t.buf[i + 2] = clamp(BG[2] * vig + glow * 22, 0, 255);
      }
    }

    // ── Where the spark reaches: the real mouse, or a roaming virtual cursor ──
    const live = t.mouseActive && t.mouseX >= 0;
    let mx: number, my: number;
    if (live) {
      mx = t.mouseX;
      my = t.mouseY;
    } else {
      // eased Lissajous orbit so it's alive headlessly and before the first move
      mx = cx + Math.cos(time * 0.55) * R * 1.15;
      my = cy + Math.sin(time * 0.8) * R * 0.95;
    }
    const surge = t.mouseDown ? 1 : 0; // click = stronger reach
    const reachK = 0.82 + 0.5 * surge;

    let tdx = mx - cx, tdy = my - cy;
    const md = Math.max(1e-3, Math.hypot(tdx, tdy));
    const mnx = tdx / md, mny = tdy / md;
    const springK = 1 - Math.exp(-dt * (9 + 6 * surge)); // follow rate (snappier on click)

    // helper: tapered clay disc (glow pass additive, body pass solid)
    const disc = (x: number, y: number, r: number, c: [number, number, number], add: boolean, k = 1): void => {
      const r2 = r * r;
      const x0 = Math.max(0, Math.floor(x - r)), x1 = Math.min(W - 1, Math.ceil(x + r));
      const y0 = Math.max(0, Math.floor(y - r)), y1 = Math.min(H - 1, Math.ceil(y + r));
      for (let py = y0; py <= y1; py++) {
        for (let px = x0; px <= x1; px++) {
          const dx = px - x, dy = py - y;
          const d2 = dx * dx + dy * dy;
          if (d2 > r2) continue;
          if (add) {
            const f = (1 - d2 / r2) * k;
            t.addPixel(px, py, c[0] * f, c[1] * f, c[2] * f);
          } else {
            t.setPixel(px, py, c[0], c[1], c[2]);
          }
        }
      }
    };

    const baseW = Math.max(1.6, R * 0.05);
    const tipW = Math.max(0.5, R * 0.012);

    // ── Each tentacle: spring its tip toward (rest blended with reach) ────────
    for (let i = 0; i < N; i++) {
      const a = (SPIKES[i].deg * Math.PI) / 180;
      const dirx = Math.cos(a), diry = Math.sin(a);
      const breath = 1 + 0.05 * Math.sin(time * 1.2 + phase[i]);
      const rx = cx + dirx * R * SPIKES[i].len * breath;
      const ry = cy + diry * R * SPIKES[i].len * breath;

      // alignment of this spike with the cursor direction → how much it reaches
      const align = clamp(dirx * mnx + diry * mny, -1, 1);
      const w = smoothstep(0.05, 1.0, align) * reachK;
      // desired tip: rest, pulled toward the cursor for facing spikes (and a touch
      // of global lean when the cursor is close)
      const near = smoothstep(R * 2.2, R * 0.4, md);
      let dx = lerp(rx, mx, w) - rx + (mx - rx) * 0.06 * near;
      let dy = lerp(ry, my, w) - ry + (my - ry) * 0.06 * near;
      let destX = rx + dx, destY = ry + dy;
      // clamp how far a tentacle can stretch from the centre
      const ex = destX - cx, ey = destY - cy, el = Math.hypot(ex, ey);
      const cap = R * 1.85;
      if (el > cap) {
        destX = cx + (ex / el) * cap;
        destY = cy + (ey / el) * cap;
      }
      // spring follow (organic trail + settle)
      tipX[i] += (destX - tipX[i]) * springK;
      tipY[i] += (destY - tipY[i]) * springK;

      // draw a tapered, gently-curved Bézier stroke center → ctrl → tip
      const tx = tipX[i], ty = tipY[i];
      const vx = tx - cx, vy = ty - cy;
      const vlen = Math.max(1e-3, Math.hypot(vx, vy));
      const ux = vx / vlen, uy = vy / vlen;
      const perpx = -uy, perpy = ux;
      const sway = vlen * (0.12 * Math.sin(time * 1.4 + phase[i]) + 0.14 * w);
      const ctrlX = cx + vx * 0.5 + perpx * sway;
      const ctrlY = cy + vy * 0.5 + perpy * sway;

      const steps = Math.max(8, Math.ceil(vlen / 1.4));
      for (let s = 0; s <= steps; s++) {
        const u = s / steps, m = 1 - u;
        const bx = m * m * cx + 2 * m * u * ctrlX + u * u * tx;
        const by = m * m * cy + 2 * m * u * ctrlY + u * u * ty;
        const wid = baseW * Math.pow(m, 0.6) + tipW; // thick base → pointed tip
        disc(bx, by, wid * 2.0, CLAY_GLOW, true, 0.5); // glow halo
        disc(bx, by, wid, CLAY, false); // solid clay body
      }
    }

    // ── Centre hub where the tentacles fuse + a hot core ──────────────────────
    disc(cx, cy, R * 0.2, CLAY_GLOW, true, 0.7);
    disc(cx, cy, R * 0.135, CLAY, false);
    disc(cx, cy, R * 0.06, CORE, false);
    disc(cx, cy, R * 0.13, CORE, true, 0.35);

    // ── Pointer reticle so you can see what it's reaching for ─────────────────
    {
      const rr = Math.max(2, R * 0.05);
      const col: [number, number, number] = live ? [255, 230, 205] : [150, 120, 100];
      const ringA = live ? 0.9 : 0.4;
      for (let k = 0; k < 48; k++) {
        const ang = (k / 48) * TAU;
        t.blendPixel(Math.round(mx + Math.cos(ang) * rr), Math.round(my + Math.sin(ang) * rr), col[0], col[1], col[2], ringA);
      }
      if (live && surge) disc(mx, my, rr * 0.6, CORE, true, 0.5);
    }

    void clamp01;
  },
});
