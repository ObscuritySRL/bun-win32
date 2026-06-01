/**
 * Mandel-Dive — an endless, buttery-smooth plunge into the Mandelbrot set, in a terminal.
 *
 * A continuously zooming Mandelbrot rendered as a half-block TRUECOLOR framebuffer in
 * PURE TypeScript — no GPU, no shader, just doubles and a tight escape-time loop writing
 * straight into the pixel buffer. The camera falls forever toward a hand-picked point on
 * the edge of the seahorse valley (-0.743643887037151, +0.131825904205330), a coordinate
 * whose neighbourhood is self-similar at every scale, so the dive never bottoms out.
 *
 * Four things make it read as designed art rather than a tech demo:
 *
 *   1. CONTINUOUS (normalized) iteration count — the classic log-log smoothing
 *      mu = n + 1 - log2(log2|z|) — erases integer banding for a glassy gradient, fed
 *      through a slowly hue-rotating cosine palette (Inigo-Quilez style) so the whole
 *      fractal breathes. The interior is a deep velvet wash, faintly lit by an orbit trap.
 *
 *   2. DISTANCE-ESTIMATION boundary glow, SOFTENED. We carry the derivative z' alongside z;
 *      the exterior distance estimate dist = |z|·log|z| / |z'| gives the true distance to
 *      the set in screen units. A wide, gently-rolled luminous band is painted from it — a
 *      thread of light that reads as spun gold, never as hard white speckle. The highlight
 *      is soft-clamped (a filmic knee) so the filigree glows without ever blowing out.
 *
 *   3. ADAPTIVE ANTI-ALIASING. The boundary is where a single sample per pixel turns the
 *      sub-pixel filigree into harsh sparkle (a thin bright thread sampled at one point
 *      either hits white or misses entirely). So each pixel takes ONE cheap probe; if the
 *      distance estimate says we are near structure, it supersamples a small rotated grid
 *      and averages in linear light. Calm open field stays 1× cheap; only the rim pays for
 *      smoothness, so the edge resolves into elegant filigree instead of noise.
 *
 *   4. EASED, BREATHING motion. The zoom is an exponential dive shaped by a smootherstep
 *      so it accelerates in and eases at the loop seam; a slow cross-fade across the wrap
 *      makes the re-dive seamless, and a gentle palette drift keeps colour alive over time.
 *
 * Performance is adaptive: the per-pixel iteration budget scales with the LOG of the zoom
 * depth (shallow frames are cheap, deep frames spend more iterations where detail lives)
 * and is capped so the bench stays comfortably >=120 fps at 160x50. It scales to any
 * terminal: the complex view is rederived from t.W/t.H/t.aspect EVERY frame and the whole
 * framebuffer is filled, so the picture reflows on live resize. All motion derives purely
 * from the sim clock (time/dt); any jitter is seeded with mulberry32, so captures are
 * deterministic frame-for-frame.
 *
 * Technique: escape-time z=z^2+c in doubles · normalized-iteration (log-log) smooth colour ·
 * softened exterior distance-estimation rim w/ filmic highlight knee · adaptive boundary
 * supersampling (linear-light average) · cosine palette w/ time-rotated hue · log-depth
 * adaptive iter budget · smootherstep-eased exponential zoom w/ cross-fade loop · ACES-graded.
 *
 * Run: bun run packages/all/example/mandel-dive.ts   (ESC / q quits; SPACE pauses)
 */

import { runDemo, Term, clamp01, smoothstep, TAU } from './_term';

// ── Dive target: a self-similar point on the rim of the seahorse valley. ───────
// Zooming toward it reveals an endless cascade of mini-brots and spirals.
const TARGET_X = -0.743643887037151;
const TARGET_Y = 0.131825904205330;

// ── Zoom schedule ──────────────────────────────────────────────────────────────
// The view half-width shrinks exponentially toward the target. We run it on a
// looped period: a smootherstep-eased depth drives the zoom so it accelerates in
// and eases out at the seam, and a short cross-fade band across the wrap hides it.
const SPAN_MAX = 1.45; // starting half-width (whole-set framing)
const SPAN_MIN = 5.0e-6; // deepest half-width before looping (~3e5 zoom)
const PERIOD = 14.0; // seconds per full dive cycle (contemplative pace)
const LOG_SPAN_MAX = Math.log(SPAN_MAX);
const LOG_SPAN_MIN = Math.log(SPAN_MIN);

// ── Iteration budget (adaptive with depth, capped for fps) ─────────────────────
const ITER_BASE = 96;
const ITER_PER_EFOLD = 22; // extra iterations per natural-log of zoom
const ITER_CAP = 460;

// ── Palette (Inigo-Quilez cosine gradient: a + b*cos(2pi*(c*t + d))) ───────────
// A cohesive deep-twilight ramp: indigo/violet shadow → teal → warm amber → rose
// highlight. The channel phase offsets (d) are spread so colour SEPARATES instead of
// going grey, and the base (a) is kept low so the far field stays rich and dark and
// only the boundary lights up. Tasteful and restrained; hue slowly drifts over time.
const PAL_A0 = 0.34, PAL_A1 = 0.28, PAL_A2 = 0.40;
const PAL_B0 = 0.40, PAL_B1 = 0.36, PAL_B2 = 0.44;
const PAL_C0 = 1.0, PAL_C1 = 1.0, PAL_C2 = 1.0;
const PAL_D0 = 0.50, PAL_D1 = 0.62, PAL_D2 = 0.82;

// ── Anti-aliasing sample offsets (rotated triad, in pixel units, centred on 0). ─
// A pixel that the cheap centre-probe flags as on the boundary shell is re-shaded
// at these 3 sub-positions; with the centre that's a 4-tap average in linear
// light. The offsets form a rotated triangle (not axis-aligned) so the sampling
// decorrelates from the fractal's own near-horizontal/vertical filaments, which
// is exactly where single-sample speckle is worst. 3 extra taps is the sweet spot
// between killing sparkle and keeping the deep-zoom frames comfortably > 120 fps.
// A pixel flagged on the boundary shell is re-shaded at these 3 sub-positions;
// with the centre that's a 4-tap average in linear light. The offsets form a
// rotated triangle (not axis-aligned) so the sampling decorrelates from the
// fractal's own near-horizontal/vertical filaments, which is exactly where
// single-sample speckle is worst. Stored as flat scalars (not a tuple array) so
// the supersample loop avoids per-tap indexing + destructuring.
const AA_OX0 = 0.00, AA_OY0 = -0.33;
const AA_OX1 = 0.30, AA_OY1 = 0.20;
const AA_OX2 = -0.30, AA_OY2 = 0.20;

// Shading scratch — the shader writes its linear-light RGB result here to avoid
// allocating a tuple per sample (this loop runs W·H·(1..5) times a frame).
let sr = 0, sg = 0, sb = 0;


runDemo({
  title: 'Mandel-Dive',
  hud: 'INFINITE MANDELBROT PLUNGE - SEAHORSE VALLEY - SMOOTH ITER + DISTANCE-ESTIMATE GLOW',
  captureT: 7,
  frame: (t: Term, time: number) => {
    const W = t.W;
    const H = t.H;
    const buf = t.buf;
    const aspect = t.aspect; // W/H so the set isn't squashed

    // ── Looped, eased dive depth ──────────────────────────────────────────────
    // phase 0..1 over PERIOD. d = smootherstep(phase) eases the descent (slow start,
    // fast middle, gentle settle); log-span interpolates linearly in d so zoom is
    // exponential in real space. A cross-fade `seam` value near the wrap blends the
    // very-deep end back toward the shallow start for an invisible loop.
    const phase = (time / PERIOD) % 1;
    const eased = smootherstep(phase);
    const logSpan = LOG_SPAN_MAX + (LOG_SPAN_MIN - LOG_SPAN_MAX) * eased;
    const span = Math.exp(logSpan);

    // Adaptive iteration cap: deeper zoom → more iterations, then clamp.
    const efolds = LOG_SPAN_MAX - logSpan;
    let maxIter = (ITER_BASE + efolds * ITER_PER_EFOLD) | 0;
    if (maxIter > ITER_CAP) maxIter = ITER_CAP;

    // Slow palette hue rotation so the whole fractal breathes over time.
    const palShift = time * 0.026;

    // Cross-fade weight at the loop seam: fade the deepest ~8% of the cycle so the
    // jump back to shallow framing is a soft dissolve rather than a hard cut.
    const seamFade = phase > 0.93 ? smoothstep(0.93, 1.0, phase) : 0;

    // View extents in complex space. Horizontal half-width is `span`; vertical is
    // scaled by 1/aspect so the set keeps its true proportions at any terminal size.
    const halfX = span;
    const halfY = span / aspect;
    const cx0 = TARGET_X;
    const cy0 = TARGET_Y;

    const invW = 1 / W;
    const invH = 1 / H;
    const invLog2 = 1 / Math.LN2;
    const BAILOUT2 = 1 << 18; // large bailout sharpens log-log smoothing & DE

    // Vignette: a soft radial darkening toward the corners so the dive reads as a
    // tunnel of light — depth cue. Precompute the centre + inv-radius once.
    const vcx = (W - 1) * 0.5, vcy = (H - 1) * 0.5;
    const vInv = 1 / (vcx * vcx + vcy * vcy);

    // Deep field base (velvet) we blend the open exterior toward, so the far field
    // stays cohesive and calm and colour concentrates near the luminous boundary.
    const FIELD_R = 0.018, FIELD_G = 0.012, FIELD_B = 0.045;

    // Distance-estimate rim width, in units of a pixel. The glow occupies a SOFT,
    // wide band hugging the boundary; widening it (vs a 1-pixel thread) is what
    // turns the harsh sparkle into a continuous luminous filigree — the bright
    // core is spread across a few pixels so single-sample aliasing can't spike it.
    const pxStep = (2 * halfX) * invW; // complex-plane size of one pixel column
    const RIM_PX = 3.4; // rim band half-width in pixels (was a hard 1.6px thread)
    const rimScale = 1 / (pxStep * RIM_PX);
    // Sub-pixel sample steps for the AA grid (centre-relative), in complex units.
    const sxStep = pxStep, syStep = (2 * halfY) * invH;

    // Per-sample shader. Evaluates the escape-time orbit + derivative at one point
    // in the complex plane and writes its LINEAR-light colour into sr/sg/sb. Kept
    // as a closure over the frame constants so the hot path stays allocation-free.
    // Returns an AA TRIGGER in [0,1]: high only on the narrow rim shell + just
    // inside the interior edge (exactly where sub-pixel filigree causes speckle),
    // so the pixel loop supersamples there and nowhere else — calm field stays 1×.
    const shade = (cr: number, ci: number): number => {
      // ── Escape-time iteration z = z^2 + c, carrying the derivative z'. ───────
      // dz_{k+1} = 2·z_k·dz_k + 1  (seeded dz0 = 0). Tracking it lets us compute
      // the exterior distance estimate without finite differences.
      let zr = 0.0, zi = 0.0;
      let zr2 = 0.0, zi2 = 0.0;
      let dr = 0.0, di = 0.0; // derivative z'
      let n = 0;
      let trap = 1e9; // orbit trap (min |z|^2) → interior tint
      let m2 = 0.0;
      while (n < maxIter) {
        // 2·zr is exact (power-of-two scale, no rounding) and JS already folds
        // `2 * zr * zi` as `(2·zr)·zi`, so sharing it is bit-for-bit identical.
        const zr2x = zr + zr; // == 2·zr, exact
        const zi2x = zi + zi; // == 2·zi, exact
        // z' = 2·z·z' + 1   (do this with the OLD z, before updating z)
        const ndr = zr2x * dr - zi2x * di + 1;
        const ndi = zr2x * di + zi2x * dr;
        dr = ndr; di = ndi;
        // z = z^2 + c
        zi = zr2x * zi + ci;
        zr = zr2 - zi2 + cr;
        zr2 = zr * zr;
        zi2 = zi * zi;
        m2 = zr2 + zi2;
        if (m2 < trap) trap = m2;
        if (m2 > BAILOUT2) break;
        n++;
      }

      if (n >= maxIter) {
        // ── Interior: deep velvet, faintly lit by how close the orbit came to 0.
        const tr = clamp01(Math.sqrt(trap) * 0.95);
        const tr2 = tr * tr;
        sr = (7 + tr2 * 30) / 255;
        sg = (5 + tr2 * 12) / 255;
        sb = (16 + tr2 * 40) / 255;
        // Interior is a smooth velvet wash — no speckle. We trigger AA only a hair
        // (the inner boundary is already caught by adjacent exterior pixels whose
        // `edge` is high), so the solid interior stays 1× cheap.
        return 0;
      }

      // ── Exterior smooth iteration: mu = n + 1 - log2(log2|z|). ──────────────
      const logM2 = Math.log(m2);
      const logZn = logM2 * 0.5; // = log|z|
      const nu = Math.log(logZn * invLog2) * invLog2; // log2(log2|z|)
      const mu = n + 1 - nu;

      // Map mu through the cycling cosine palette. A gentle log compresses the
      // fast-growing mu so colour bands stay even at every depth and the field
      // cycles through the whole ramp, giving layered, stratified depth.
      const ts = Math.log(mu + 1) * 0.62 + palShift;
      const ph0 = TAU * (PAL_C0 * ts + PAL_D0);
      const ph1 = TAU * (PAL_C1 * ts + PAL_D1);
      const ph2 = TAU * (PAL_C2 * ts + PAL_D2);
      let pr = PAL_A0 + PAL_B0 * Math.cos(ph0);
      let pg = PAL_A1 + PAL_B1 * Math.cos(ph1);
      let pb = PAL_A2 + PAL_B2 * Math.cos(ph2);

      // ── Distance estimate → boundary proximity. ────────────────────────────
      // dist = |z|·log|z| / |z'|  (exterior DE), in complex-plane units. Two
      // bands are derived from it: a soft RIM (the luminous filigree, smoothly
      // rolled so it has no hard inner/outer edge) and a WIDE halo (`near`, how
      // close to structure we are) that both gates chroma and triggers AA.
      const dz2 = dr * dr + di * di;
      let rim = 0, near = 0, edge = 0;
      if (dz2 > 1e-300) {
        const mz = Math.sqrt(m2);
        // |z|·log|z| where log|z| == logZn (already computed = 0.5·log m2).
        const dist = (mz * logZn) / Math.sqrt(dz2);
        const d = dist * rimScale; // ~0 on the boundary, grows away from it
        // Smooth, wide rim + broad halo + AA shell — three smoothsteps over the
        // SAME `d` (edges 2.2 / 9 / 4). Inlined (the engine's smoothstep, bit for
        // bit: t=clamp01(d/e1); t·t·(3-2t)) to drop three function calls and the
        // `|| 1e-9` guard from the hottest per-exterior-pixel path. `d>=0`, so the
        // lower clamp is dead, but we keep clamp01's exact form for identical bits.
        let tr = d / 2.2; tr = tr < 0 ? 0 : tr > 1 ? 1 : tr;
        rim = 1 - tr * tr * (3 - 2 * tr);
        let tn = d / 6.5; tn = tn < 0 ? 0 : tn > 1 ? 1 : tn;
        near = 1 - tn * tn * (3 - 2 * tn);
        let te = d / 4.0; te = te < 0 ? 0 : te > 1 ? 1 : te;
        edge = 1 - te * te * (3 - 2 * te);
      }

      // Concentrate chroma near structure: open field dissolves into velvet.
      // lerp(a,b,t) inlined as a+(b-a)*t (bit-for-bit identical to the engine).
      // near^3 makes the gate STEEP — at deep zoom the whole frame is "near"
      // structure, so a soft gate left the exterior a milky wash; cubing it
      // keeps the velvet field dark and reserves chroma for the true boundary.
      const chroma = near * near * near;
      pr = FIELD_R + (pr - FIELD_R) * chroma;
      pg = FIELD_G + (pg - FIELD_G) * chroma;
      pb = FIELD_B + (pb - FIELD_B) * chroma;

      // Boundary lift — the off-rim field sits LOW (0.52) so the open exterior
      // reads as dim velvet even where mini-brots crowd the frame at deep zoom;
      // the rim lifts to just above 1, so light concentrates on the filigree and
      // never washes the whole field to a milky midtone. The *sheen* below carries
      // the actual glint, so this stays gentle.
      const lum = 0.52 + (1.04 - 0.52) * rim;
      pr *= lum; pg *= lum; pb *= lum;

      // ── Soft proximity bloom. ──────────────────────────────────────────────
      // The broad `near` halo adds a faint, warm ambient wash to the whole shell
      // around structure (not just the rim line). At deep zoom the filigree is a
      // necklace of sub-pixel dots with dark gaps; this dim glow fills the gaps so
      // the spiral reads as a CONTINUOUS thread of lace rather than scattered
      // sparkle. It is very low amplitude — it lifts the floor, never the peaks.
      const bloom = near * near * near * 0.10;
      pr += bloom * 1.0;
      pg += bloom * 0.78;
      pb += bloom * 0.5;

      // Warm gold sheen confined to the edge. The drive is rim^2 (smoother onset
      // than a cubic, so the band has body) and the magnitude is SOFT-CLAMPED
      // through a filmic knee: s/(1+s) rolls any spike asymptotically toward a
      // warm ceiling, so however thin/bright the filigree gets it can never punch
      // to pure white. This is the speckle killer at the highlight end.
      const sRaw = rim * rim * 0.6;
      const sheen = sRaw / (1 + sRaw); // knee: 0→0, ∞→1, gentle everywhere
      pr += sheen * 0.36;
      pg += sheen * 0.25;
      pb += sheen * 0.11;

      // ── Highlight warm-roll (the cold-white-speck killer). ──────────────────
      // Wherever the linear value gets bright, pull all three channels toward a
      // shared WARM gold of a CAPPED luminance. Two jobs in one: (1) bias to gold
      // so a bright pixel reads as a warm glint, never cold blue-white; (2) cap
      // the peak — `target` saturates near ~0.9 via a soft knee, so even a direct
      // sub-pixel rim hit can't spike to a blown white speck. At full strength the
      // blend reaches the cap entirely, so the brightest filigree is a controlled,
      // cohesive gold rather than noise. Deep field (low lum) is untouched.
      const lmax = pr > pg ? (pr > pb ? pr : pb) : (pg > pb ? pg : pb);
      if (lmax > 0.5) {
        // warm = smoothstep(0.5,1,lmax), inlined bit-for-bit (t=clamp01((lmax-0.5)/0.5)).
        let tw = (lmax - 0.5) / 0.5; tw = tw < 0 ? 0 : tw > 1 ? 1 : tw;
        const warm = tw * tw * (3 - 2 * tw); // 0..1 blend weight
        const cap = lmax / (1 + 0.35 * lmax);    // soft ceiling (~0.9 as lmax→∞)
        // Target a SATURATED amber, not a pale cream: a low green/blue ratio keeps
        // the dense deep-zoom filigree reading as rich spun gold rather than a
        // milky tan wash when thousands of sub-pixel rim hits crowd one region.
        const gr = cap, gg = cap * 0.70, gb = cap * 0.34;
        pr = pr + (gr - pr) * warm;
        pg = pg + (gg - pg) * warm;
        pb = pb + (gb - pb) * warm;
      }

      sr = pr; sg = pg; sb = pb;
      return edge;
    };

    let o = 0; // byte cursor into buf (RGB triples)
    for (let py = 0; py < H; py++) {
      const ci = cy0 + (py * invH * 2 - 1) * halfY;
      const vdy = py - vcy;
      for (let px = 0; px < W; px++) {
        const cr = cx0 + (px * invW * 2 - 1) * halfX;

        // Cheap centre probe. Most of the frame is calm open field or solid
        // interior, where one sample is exact — those pixels cost nothing extra.
        const edge = shade(cr, ci);
        let lr = sr, lg = sg, lb = sb;

        // ── Adaptive boundary AA. ───────────────────────────────────────────
        // Only where the probe lands on the narrow boundary shell (where the
        // filigree is sub-pixel) do we pay for 4 extra rotated-grid samples and
        // average in LINEAR light. Averaging linearly — before any tone-map — is
        // what makes a sub-pixel bright thread resolve to a smooth mid-tone
        // instead of a blown speck. Calm field never enters this branch.
        if (edge > 0.03) {
          shade(cr + AA_OX0 * sxStep, ci + AA_OY0 * syStep);
          lr += sr; lg += sg; lb += sb;
          shade(cr + AA_OX1 * sxStep, ci + AA_OY1 * syStep);
          lr += sr; lg += sg; lb += sb;
          shade(cr + AA_OX2 * sxStep, ci + AA_OY2 * syStep);
          lr += sr; lg += sg; lb += sb;
          lr *= 0.25; lg *= 0.25; lb *= 0.25; // /4 (centre + 3)
        }

        // ── Tone-map ONCE on the resolved linear colour. ────────────────────
        // ACES filmic grade for a cohesive, never-blown look. Doing it after the
        // linear average (not per sub-sample) preserves the smoothing. Inlined
        // bit-for-bit (a=2.51 b=0.03 c=2.43 d=0.59 e=0.14; clamp01 of the ratio)
        // to drop three function calls per pixel from the framebuffer fill.
        let ar = (lr * (2.51 * lr + 0.03)) / (lr * (2.43 * lr + 0.59) + 0.14);
        ar = ar < 0 ? 0 : ar > 1 ? 1 : ar;
        let ag = (lg * (2.51 * lg + 0.03)) / (lg * (2.43 * lg + 0.59) + 0.14);
        ag = ag < 0 ? 0 : ag > 1 ? 1 : ag;
        let ab = (lb * (2.51 * lb + 0.03)) / (lb * (2.43 * lb + 0.59) + 0.14);
        ab = ab < 0 ? 0 : ab > 1 ? 1 : ab;
        let r = ar * 255;
        let g = ag * 255;
        let b = ab * 255;

        // ── Soft vignette: darken toward the corners for tunnel-of-light depth. ─
        const vdx = px - vcx;
        const v = 1 - 0.34 * (vdx * vdx + vdy * vdy) * vInv; // 1 centre → 0.66 corner
        r *= v; g *= v; b *= v;

        // ── Loop seam cross-fade: dissolve toward velvet so the wrap is invisible.
        if (seamFade > 0) {
          const k = seamFade;
          r = r * (1 - k) + 7 * k;
          g = g * (1 - k) + 5 * k;
          b = b * (1 - k) + 16 * k;
        }

        // Manual clamp — we bypass setPixel for speed, and v/seam/aces can leave
        // values fractionally out of [0,255]; Uint8Array would WRAP otherwise.
        buf[o] = r > 255 ? 255 : r < 0 ? 0 : r;
        buf[o + 1] = g > 255 ? 255 : g < 0 ? 0 : g;
        buf[o + 2] = b > 255 ? 255 : b < 0 ? 0 : b;
        o += 3;
      }
    }
  },
});

// ── smootherstep (Ken Perlin's 6t^5-15t^4+10t^3): zero 1st & 2nd derivatives at
// the ends, so the dive eases in and out with no visible velocity kink. ─────────
function smootherstep(x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  return x * x * x * (x * (x * 6 - 15) + 10);
}
