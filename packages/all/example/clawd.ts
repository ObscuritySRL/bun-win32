/**
 * Clawd — the Claude mascot, alive in your terminal, in pure TypeScript.
 *
 * A deliberately SIMPLE, DESIGNED character — a cozy rounded clay-orange creature in
 * Anthropic's brand palette (terracotta #D97757 hero, warm-cream #F0EEE6 highlight,
 * near-black ink eyes, deep warm-charcoal stage). Not a photoreal blob: Clawd is built
 * from clean signed-distance shapes — a soft squircle body with two little ear-bumps —
 * shaded with flat-ish bands, a gentle directional light and a soft cream rim light, so
 * he reads like a refined logo-creature, premium and friendly. Two dark oval eyes with a
 * single catch-light and a small, subtle smile.
 *
 * He's ALIVE, and every bit of motion is EASED (nothing linear, nothing jittery): a slow
 * breathing squash & stretch, a soft eased bob, an occasional quick blink (and a rare
 * double-blink), and now and then a small friendly wave of one rounded paw. Behind him
 * turns the signature Claude SUNBURST — twelve clean tapered spokes of clay-orange that
 * rotate slowly and pulse with a tasteful additive bloom, framed by a soft warm vignette
 * and a few drifting additive dust motes. A single small "CLAWD" wordmark fades in and
 * out beneath him — minimal typography, no clutter.
 *
 * Technique: per-pixel SDF compositing for the body (directional + rim + occlusion bands,
 * cream specular, ink face), an analytic twelve-spoke tapered sunburst accumulated additively
 * with a central halo and ACES tonemapping, an eased "director" loop driving breath / bob /
 * blink / wave / sunburst flare, a seeded (mulberry32) drifting dust field, a soft radial
 * vignette, and a fading 5x7-bitmap wordmark. Sim is normalized to t.W/t.H so it reflows on
 * resize; every pixel is math over the seconds-clock, so the deterministic PNG capture matches
 * the live run exactly. No deps, no native addon.
 *
 * Run: bun run packages/all/example/clawd.ts
 */
import { runDemo, Term, clamp, clamp01, lerp, smoothstep, fract, aces, mulberry32, TAU } from './_term';

// ── Anthropic brand palette (linear-ish 0..255) ────────────────────────────────
const CLAY: [number, number, number] = [217, 119, 87];    // #D97757 hero terracotta
const CLAY_HI: [number, number, number] = [236, 168, 124]; // sunlit clay
const CLAY_LO: [number, number, number] = [156, 78, 58];   // shaded clay (core/AO)
const CREAM: [number, number, number] = [240, 238, 230];   // #F0EEE6 paper highlight
const RIM: [number, number, number] = [255, 232, 198];     // warm golden-cream rim light
const INK: [number, number, number] = [31, 30, 29];        // near-black eyes
const BG_TOP: [number, number, number] = [30, 23, 20];     // deep warm charcoal (top)
const BG_BOT: [number, number, number] = [16, 12, 11];     // darker warm (bottom)

const N_SPOKES = 12;
const N_DUST = 120;

interface Mote { x: number; y: number; spd: number; phase: number; size: number; bri: number; kern: Float64Array; }
let dust: Mote[] = [];

// A soft 0→1→0 bell over a window [a,b] (eased ends via sine).
const bell = (x: number, a: number, b: number): number => {
  const t = clamp01((x - a) / (b - a || 1e-9));
  return Math.sin(t * Math.PI);
};
// Smoothed sine — softens the turns so bobbing never feels mechanical.
const softSin = (x: number): number => {
  const s = Math.sin(x);
  return Math.sign(s) * smoothstep(0, 1, Math.abs(s));
};

runDemo({
  title: 'Clawd',
  hud: 'THE CLAUDE MASCOT - PURE TYPESCRIPT IN A TERMINAL',
  captureT: 5,
  init: (t) => {
    const rnd = mulberry32(0x1eaf);
    dust = [];
    for (let i = 0; i < N_DUST; i++) {
      // RNG consumed in the exact original order (x, y, spd, phase, size, bri) → determinism.
      const x = rnd();                    // 0..1 across width  (normalized → reflows on resize)
      const y = rnd();                    // 0..1 down height
      const spd = 0.010 + rnd() * 0.040;  // gentle upward drift (frac of height / sec)
      const phase = rnd() * TAU;          // twinkle + sway phase
      const size = 0.55 + rnd() * 1.4;
      const bri = 0.30 + rnd() * 0.80;
      // Precompute the 5×5 Gaussian falloff (depends only on size — constant per mote).
      const kern = new Float64Array(25);
      const denom = size * size + 0.4;
      for (let dy = -2, kk = 0; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++, kk++) {
          kern[kk] = Math.exp(-(dx * dx + dy * dy) / denom);
        }
      }
      dust.push({ x, y, spd, phase, size, bri, kern });
    }
  },
  frame: (t, time) => {
    const { W, H, buf } = t;
    const aspect = t.aspect; // W/H — pixels are square; corrects circle/SDF math at any size

    // Hoist hot math into locals (lets JSC inline aggressively in the per-pixel loop).
    const mSqrt = Math.sqrt, mExp = Math.exp, mAbs = Math.abs, mAtan2 = Math.atan2, mFloor = Math.floor;

    // ── Director (continuous, gently eased; a slow ambient loop with rare events) ──
    // Breathing: slow squash & stretch, roughly volume-preserving.
    const breath = Math.sin(time * 1.55);
    const squash = 1 + 0.045 * breath;     // vertical
    const stretch = 1 - 0.040 * breath;    // horizontal

    // Bob: eased vertical float.
    const bob = softSin(time * 0.95);

    // Blink: a quick eased lid with a tiny ANTICIPATION (eyes widen a hair, then
    // the lid drops fast and eases open) — recurs ~3.4s, with a rare double-blink.
    const blinkClock = fract(time / 3.4);
    // anticipation window just before the close: a small negative "blink" = eyes open wider
    let antic = blinkClock > 0.86 && blinkClock < 0.97
      ? Math.sin(((blinkClock - 0.86) / 0.11) * Math.PI) : 0;
    let blink = blinkClock < 0.085
      ? smoothstep(0, 1, Math.sin((blinkClock / 0.085) * Math.PI)) : 0;
    const dbl = fract((time + 1.9) / 7.1);
    if (dbl < 0.055) blink = Math.max(blink, smoothstep(0, 1, Math.sin((dbl / 0.055) * Math.PI)));
    blink = clamp01(blink);
    antic = clamp01(antic) * (1 - blink);   // suppress widen once the lid is moving

    // Wave: a friendly wave every ~8s — eased in with a touch of ANTICIPATION (the
    // arm dips down a hair before it swings up), an overshoot/settle on the rise,
    // and a lively wiggle that decays as the wave finishes.
    const waveClock = fract(time / 8.0) * 8.0;
    const rawWave = bell(waveClock, 2.0, 3.5);
    // overshoot easing: an eased "elastic" settle so the lift feels alive, not linear
    const ovr = 1 + 0.12 * Math.sin(rawWave * Math.PI) * smoothstep(0.0, 0.4, rawWave);
    const waveAmt = clamp01(rawWave * ovr);
    // small downward anticipation crouch just before the wave begins
    const anticArm = bell(waveClock, 1.55, 2.05) * 0.5;
    // Sunburst flare: a tasteful bloom swell synced to the wave's peak.
    const flare = bell(waveClock, 2.2, 3.9) * 0.95;
    // Wordmark: fades in, holds, fades out, once per ~8s loop.
    const wordA = smoothstep(4.4, 5.0, waveClock) * (1 - smoothstep(6.8, 7.4, waveClock));

    // ── Stage geometry ───────────────────────────────────────────────────────────
    const cx = W * 0.5;
    const cy = H * 0.50 - bob * H * 0.020;          // Clawd's center (bobs)
    const baseR = Math.min(W / aspect, H) * 0.215;  // body radius in vertical px
    const rx = baseR * stretch;                     // body half-width  (vertical px units)
    const ry = baseR * squash;                      // body half-height

    const sunRot = time * 0.18;                     // slow rotation
    const sunPulse = 0.5 + 0.5 * Math.sin(time * 0.9);

    const invW = 1 / W, invH = 1 / H;
    const minWH = Math.min(W / aspect, H);

    // Sunburst loop-invariants (hoisted out of the per-pixel loop).
    const invSun = 1 / (minWH * 0.72);            // radN = dist * invSun
    const spokeScale = N_SPOKES / TAU;            // ang * spokeScale = ang / TAU * N_SPOKES
    const sunIScale = (0.42 + 0.85 * sunPulse) * (1.0 + 2.4 * flare);
    const haloScale = (0.30 + 0.45 * sunPulse) * (1 + 1.4 * flare);

    // Pre-resolve wave kinematics once (independent of pixel).
    const lift = waveAmt;
    const armBaseX = 0.82, armBaseY = 0.20;
    // a lively side-to-side wiggle that's strongest mid-wave and decays toward the end
    const wigEnv = Math.sin(clamp01(lift) * Math.PI);
    const wiggle = Math.sin(time * 9.0) * 0.24 * wigEnv;
    // anticipation: before lifting, the paw dips down & in a touch (anticArm), then swings up
    const tipX = armBaseX + (0.46 + wiggle) * lift - 0.10 * anticArm;
    const tipY = armBaseY - 1.02 * lift + 0.18 * anticArm;
    const armHalf0 = 0.155, armHalf1 = 0.10, pawR = 0.185;
    const armBax = tipX - armBaseX, armBay = tipY - armBaseY;
    const armLen2 = armBax * armBax + armBay * armBay + 1e-6;

    for (let y = 0; y < H; y++) {
      const ny = y * invH;
      // background: warm charcoal vertical gradient
      const bgr0 = lerp(BG_TOP[0], BG_BOT[0], ny);
      const bgg0 = lerp(BG_TOP[1], BG_BOT[1], ny);
      const bgb0 = lerp(BG_TOP[2], BG_BOT[2], ny);
      const dyB = y - cy;
      const rowBase = y * W * 3;
      // Clawd-local Y (per row — cheap to hoist out of x loop)
      const ly = (y - cy) / ry;
      // Per-row ly-only invariants (hoisted out of the inner x loop).
      const ayRow = (ly < 0 ? -ly : ly) * 1.02;          // |ly·1.02|
      const ayRow4 = ayRow * ayRow * ayRow * ayRow;       // ay^4 term of the squircle
      const earYt = (ly + 0.95) * 2.3; const earYexp = earYt * earYt;   // shared ear y-exponent
      const specYt = (ly + 0.42) * 1.6; const specYexp = specYt * specYt;
      const aoRow = smoothstep(0.25, 1.05, ly);          // belly occlusion (ly-only)

      for (let x = 0; x < W; x++) {
        const dxB = (x - cx) * aspect;
        const dist = mSqrt(dxB * dxB + dyB * dyB);
        let r = bgr0, g = bgg0, b = bgb0;

        // ── Sunburst: 12 clean tapered spokes, additive HDR ──────────────────────
        const radN = dist * invSun;                      // 0 center → ~1 edge
        // The spoke beam vanishes for radN ≥ 1.05 (radialFall → 0), so skip the costly
        // atan2 + wedge/core there. The halo below is the only contribution past that.
        if (radN < 1.05) {
          const ang = mAtan2(dyB, dxB) - sunRot;
          const spokeF = fract(ang * spokeScale);
          const spokeC = mAbs(spokeF - 0.5) * 2;         // 0 at spoke center → 1 in the gap
          const halfWidth = 0.46 - radN * 0.30;          // taper: narrows with radius
          const wedge = smoothstep(clamp(halfWidth, 0.05, 0.46), 0.0, spokeC);
          const core = smoothstep(0.16, 0.0, spokeC) * 0.55;
          const radialFall = smoothstep(1.05, 0.05, radN) * (0.08 + 0.92 * smoothstep(0.0, 0.16, radN));
          const beam = (wedge + core) * radialFall;
          const sunI = beam * sunIScale;
          if (sunI > 0.0015) {
            r += CLAY[0] * sunI * 0.80;
            g += CLAY[1] * sunI * 0.78;
            b += CLAY[2] * sunI * 0.62;
          }
        }
        // soft central halo behind Clawd
        const halo = mExp(-radN * radN * 5.5) * haloScale;
        r += CLAY_HI[0] * halo * 0.20;
        g += CLAY_HI[1] * halo * 0.18;
        b += CLAY_HI[2] * halo * 0.14;

        // ── Clawd body (SDF squircle with two ear-bumps) ─────────────────────────
        const lx = (x - cx) * aspect / rx;
        // squircle: |x|^n + |y|^n = 1, n≈4 → soft rounded rectangle (a designed shape)
        const ax = Math.abs(lx);
        const sq = ax * ax * ax * ax + ayRow4;              // n=4 squircle (ay^4 hoisted per row)
        // ear-bumps: two soft humps lifting the silhouette at the top
        const exLe = (lx + 0.50) * 2.7, exRe = (lx - 0.50) * 2.7;
        const earL = mExp(-(exLe * exLe + earYexp));
        const earR = mExp(-(exRe * exRe + earYexp));
        const ears = (earL + earR) * 0.38;
        const bodyD = sq - 1.0 - ears;                      // <0 inside
        const bodyA = smoothstep(0.10, -0.06, bodyD);       // soft AA edge

        if (bodyA > 0.003) {
          // directional light from upper-left → flat-ish shading bands (designed look)
          const ndl = clamp01((-lx * 0.50 - ly * 0.82) * 0.5 + 0.52);
          // base clay, lifted toward sunlit clay by light; core stays in shadow clay
          const sh = smoothstep(0.10, 0.62, ndl);
          let cr = lerp(CLAY_LO[0], CLAY[0], sh);
          let cg = lerp(CLAY_LO[1], CLAY[1], sh);
          let cb = lerp(CLAY_LO[2], CLAY[2], sh);
          const hi = smoothstep(0.62, 0.96, ndl);
          cr = lerp(cr, CLAY_HI[0], hi);
          cg = lerp(cg, CLAY_HI[1], hi);
          cb = lerp(cb, CLAY_HI[2], hi);
          // soft cream specular highlight, upper-left
          const specXt = (lx + 0.36) * 1.6;
          const spec = mExp(-(specXt * specXt + specYexp));
          cr = lerp(cr, CREAM[0], spec * 0.42);
          cg = lerp(cg, CREAM[1], spec * 0.42);
          cb = lerp(cb, CREAM[2], spec * 0.42);
          // belly occlusion (gentle, ly-only → hoisted per row)
          const ao = aoRow;
          cr *= 1 - ao * 0.24; cg *= 1 - ao * 0.26; cb *= 1 - ao * 0.28;

          // soft warm rim light along the lit edge (cream, nudged a touch golden)
          const sqrt = Math.sqrt(sq);
          const rim = smoothstep(0.80, 1.0, sqrt) * (1 - smoothstep(1.0, 1.20, sqrt));
          const rimDir = clamp01((-lx * 0.55 - ly * 0.72) * 0.5 + 0.5);
          const rimI = rim * (0.22 + 1.05 * rimDir);
          cr += RIM[0] * rimI * 0.92;
          cg += RIM[1] * rimI * 0.86;
          cb += RIM[2] * rimI * 0.70;
          // subtle warm back-rim on the sunburst (lower-right) side — a kiss of clay glow
          const backDir = clamp01((lx * 0.62 + ly * 0.50) * 0.5 + 0.42);
          const backI = rim * backDir * (0.34 + 0.30 * sunPulse);
          cr += CLAY_HI[0] * backI * 0.50;
          cg += CLAY_HI[1] * backI * 0.40;
          cb += CLAY_HI[2] * backI * 0.30;

          // ── Face: two ink eyes (+ catch-light) and a small smile ───────────────
          const eyeY = -0.06;
          const eyeX = 0.32;
          // anticipation widens the eyes a hair just before the blink; the lid then closes
          const eyeOpen = clamp01((1 - blink) * (1 + 0.16 * antic));
          const exL = lx + eyeX, exR = lx - eyeX;
          const eyeRX = 0.125 * (1 + 0.05 * antic), eyeRY = 0.165 * (0.10 + 0.90 * eyeOpen);
          const dL = Math.sqrt((exL / eyeRX) ** 2 + ((ly - eyeY) / eyeRY) ** 2);
          const dR = Math.sqrt((exR / eyeRX) ** 2 + ((ly - eyeY) / eyeRY) ** 2);
          const eyeM = Math.max(smoothstep(1.06, 0.86, dL), smoothstep(1.06, 0.86, dR));
          if (eyeM > 0) {
            cr = lerp(cr, INK[0], eyeM);
            cg = lerp(cg, INK[1], eyeM);
            cb = lerp(cb, INK[2], eyeM);
            // a single small catch-light, upper-left of each pupil, fades on blink
            const cl = Math.max(
              Math.exp(-(((exL + 0.045) * 26) ** 2 + ((ly - eyeY + 0.055) * 17) ** 2)),
              Math.exp(-(((exR + 0.045) * 26) ** 2 + ((ly - eyeY + 0.055) * 17) ** 2)),
            ) * eyeOpen * eyeM;
            cr = lerp(cr, CREAM[0], cl);
            cg = lerp(cg, CREAM[1], cl);
            cb = lerp(cb, CREAM[2], cl);
          }
          // small subtle smile: a soft upward arc that lifts at the corners
          const smileBase = 0.26 - 0.44 * (lx * lx);        // up at the edges → a happy curve
          const smArc = Math.abs(ly - smileBase);
          const sm = smoothstep(0.058, 0.014, smArc) * smoothstep(0.30, 0.16, Math.abs(lx)) * (1 - eyeM);
          cr = lerp(cr, INK[0], sm * 0.85);
          cg = lerp(cg, INK[1], sm * 0.85);
          cb = lerp(cb, INK[2], sm * 0.85);
          // faint warm cheeks for charm
          const chk = Math.max(
            Math.exp(-(((lx + 0.52) * 2.7) ** 2 + ((ly - 0.20) * 3.0) ** 2)),
            Math.exp(-(((lx - 0.52) * 2.7) ** 2 + ((ly - 0.20) * 3.0) ** 2)),
          ) * (1 - eyeM);
          cr = lerp(cr, 240, chk * 0.16);
          cg = lerp(cg, 162, chk * 0.16);
          cb = lerp(cb, 140, chk * 0.16);

          r = lerp(r, cr, bodyA);
          g = lerp(g, cg, bodyA);
          b = lerp(b, cb, bodyA);
        }

        // ── Waving paw: a soft capsule forearm + round paw at the tip ─────────────
        if (lift > 0.02) {
          const pax = lx - armBaseX, pay = ly - armBaseY;
          const hcap = clamp01((pax * armBax + pay * armBay) / armLen2);
          const ddx = pax - armBax * hcap, ddy = pay - armBay * hcap;
          const armD = Math.sqrt(ddx * ddx + ddy * ddy) - lerp(armHalf0, armHalf1, hcap);
          const pawD = Math.sqrt((lx - tipX) ** 2 + (ly - tipY) ** 2) - pawR;
          const limbD = Math.min(armD, pawD);
          const armA = smoothstep(0.06, -0.03, limbD) * smoothstep(0.0, 0.14, lift);
          if (armA > 0.003) {
            const ndl = clamp01((-(lx - tipX) * 0.5 - (ly - tipY) * 0.8) * 0.5 + 0.58);
            let ar = lerp(CLAY[0], CLAY_HI[0], ndl);
            let ag = lerp(CLAY[1], CLAY_HI[1], ndl);
            let ab = lerp(CLAY[2], CLAY_HI[2], ndl);
            const pr = smoothstep(0.0, -0.07, pawD) * 0.30;
            ar = lerp(ar, CREAM[0], pr); ag = lerp(ag, CREAM[1], pr); ab = lerp(ab, CREAM[2], pr);
            r = lerp(r, ar, armA);
            g = lerp(g, ag, armA);
            b = lerp(b, ab, armA);
          }
        }

        // ── Vignette (soft warm corner falloff) ──────────────────────────────────
        const vdx = x * invW - 0.5, vdy = ny - 0.5;
        const vig = 1 - smoothstep(0.42, 0.92, Math.sqrt(vdx * vdx + vdy * vdy) * 1.16);
        const vg = 0.46 + 0.54 * vig;
        r *= vg; g *= vg; b *= vg;

        // ACES tonemap the HDR accumulation (inlined: a=2.51,b=0.03,c=2.43,d=0.59,e=0.14)
        const i = rowBase + x * 3;
        const tr = r / 255, tg = g / 255, tb = b / 255;
        let or = (tr * (2.51 * tr + 0.03)) / (tr * (2.43 * tr + 0.59) + 0.14);
        let og = (tg * (2.51 * tg + 0.03)) / (tg * (2.43 * tg + 0.59) + 0.14);
        let ob = (tb * (2.51 * tb + 0.03)) / (tb * (2.43 * tb + 0.59) + 0.14);
        buf[i] = ((or < 0 ? 0 : or > 1 ? 1 : or) * 255) | 0;
        buf[i + 1] = ((og < 0 ? 0 : og > 1 ? 1 : og) * 255) | 0;
        buf[i + 2] = ((ob < 0 ? 0 : ob > 1 ? 1 : ob) * 255) | 0;
      }
    }

    // ── Floating dust motes (additive, deterministic drift) ────────────────────────
    for (let k = 0; k < dust.length; k++) {
      const m = dust[k];
      const yy = fract(m.y - time * m.spd);
      const sway = Math.sin(time * 0.6 + m.phase) * 0.016;
      const xx = fract(m.x + sway);
      const px = (xx * W) | 0;
      const py = (yy * H) | 0;
      const tw = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(time * 2.0 + m.phase));
      const bri = (m.bri * tw * 105) / 255;
      const kern = m.kern;             // precomputed 5×5 Gaussian falloff (size-only)
      for (let dy = -2, kk = 0; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++, kk++) {
          const a = kern[kk];
          if (a < 0.03) continue;
          const f = a * bri;
          t.addPixel(px + dx, py + dy, CREAM[0] * f, CLAY_HI[1] * f, CLAY[2] * f * 0.7);
        }
      }
    }

    // ── Wordmark: a single small "CLAWD" line, lower-center, gently fading. ─────────
    // Anchored to the lower third and clamped to stay clear of Clawd AND the top FPS
    // HUD band, so it NEVER collides with the HUD at any terminal size.
    if (wordA > 0.01) {
      const a = smoothstep(0, 1, wordA);
      const scale = Math.max(1, Math.round(minWH / 130));
      const msg = 'CLAWD';
      const tw = Term.textWidth(msg, scale);
      const glyphH = 7 * scale;
      const wx = ((W - tw) / 2) | 0;
      // place in the lower third, just below the creature; never above the HUD-safe line
      const HUD_SAFE = 34;                                   // px reserved for the top HUD
      const belowClawd = (cy + ry * 1.30) | 0;
      const lowerThird = (H * 0.80) | 0;
      // Only render once there's clean vertical room BELOW the HUD-safe line — at
      // micro terminal sizes we simply drop the wordmark rather than crowd the HUD.
      if (H - glyphH - 2 >= HUD_SAFE) {
        let wy = Math.max(belowClawd, lowerThird);
        wy = clamp(wy, HUD_SAFE, H - glyphH - 2);
        // a whisper-soft plate keeps it legible over the sunburst; warm cream ink fades in
        t.plate(wx - 4, wy - 3, tw + 8, glyphH + 6, 0.18 * a);
        t.text(wx, wy, msg, lerp(150, CREAM[0], a), lerp(120, CREAM[1], a), lerp(110, CREAM[2], a), scale, true);
      }
    }
  },
});
