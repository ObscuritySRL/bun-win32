/**
 * Fineprint — a resolution test-card for the terminal renderer's sub-cell modes.
 *
 * This scene exists to make ONE thing visible: how much sharper the same picture
 * gets as you climb the sub-cell ladder. The engine packs each character cell into
 * a tiny pixel block — half (1×2) · quad (2×2) · sextant (2×3) · braille (2×4) —
 * so for a fixed terminal size the higher modes hand you 2×/3×/4× more pixels. The
 * frame() below draws at the FULL active pixel resolution (t.W × t.H), so running
 * the identical file with TERM_MODE=half|quad|sextant|braille renders progressively
 * finer detail. Nothing else changes; only the pixel budget does.
 *
 * Every element here is deliberately HIGH-FREQUENCY — the kind of content that
 * looks chunky at 1×2 and crisp at 2×4, so the difference reads at a glance:
 *
 *   1. JULIA FRACTAL BACKGROUND. A slowly-rotating Julia set c = 0.7885·e^{iθ}
 *      whose escape-time filaments are sharpened (not smoothed) by a stepped
 *      iteration palette — the boundary is a lacework of thread-thin tendrils that
 *      coarse modes can only approximate and braille resolves cleanly.
 *
 *   2. THIN VECTOR LINE-ART. A rotating wireframe icosahedron-ish star plus a fan
 *      of 1px-thin radial spokes and concentric rings, all rasterised with a DDA
 *      line into setPixel. One-pixel strokes are the single most mode-sensitive
 *      feature there is — they alias hard at half and stay hairline at braille.
 *
 *   3. A FINE CHECKERBOARD + MOIRÉ. A high-frequency checker on the left and a
 *      concentric-ring moiré on the right — classic Nyquist torture patterns that
 *      shimmer into mud at low resolution and stay legible as you climb.
 *
 *   4. SMALL RENDERED TEXT at scale 1. A multi-line caption (the 5×7 bitmap font)
 *      naming the live mode and pixel dimensions, plus tiny corner labels. Text
 *      legibility is the most honest resolution demo of all: the same paragraph is
 *      barely readable at half and clean at braille.
 *
 * The whole card animates slowly (the Julia parameter and the wireframe rotate,
 * the checker phase drifts) so it's alive but never loses detail. All motion is a
 * pure function of the sim clock, jitter is mulberry32-seeded, and the layout is
 * rederived from t.W/t.H every frame, so it's deterministic and resize-safe.
 *
 * Compare the four:
 *   for m in half quad sextant braille; do \
 *     TERM_MODE=$m CAPTURE_PNG=/tmp/fp_$m.png TERM_COLS=120 TERM_ROWS=40 \
 *     CAPTURE_T=2 bun run packages/all/example/fineprint.ts; done
 *
 * Run live: bun run packages/all/example/fineprint.ts   (ESC / q quits)
 * Try:      TERM_MODE=braille bun run packages/all/example/fineprint.ts
 */

import { Term, run } from '@bun-win32/terminal';
import { TAU, clamp01, fract, hsv } from './_kit';

// ── Julia constant orbit. c = R·e^{iθ}; R sits just inside the boundary of the
// connected locus so the set is a dense filigree (the most detail-rich regime).
const JULIA_R = 0.7885;
const JULIA_ITER = 96; // escape-time budget — high enough for thread-thin tendrils

// ── A small star/wireframe defined as a ring of points; we connect every Kth one
// to draw a stellated polygon (a rotating "compass rose" of 1px chords). ─────────
const STAR_POINTS = 11; // odd → connecting every 4th makes a continuous star
const STAR_STEP = 4;

run({
  title: 'Fineprint',
  hud: 'RESOLUTION TEST-CARD - RUN WITH TERM_MODE=half|quad|sextant|braille TO SEE IT SHARPEN',
  captureT: 2,
  frame: (t: Term, time: number) => {
    const W = t.width;
    const H = t.height;
    const buf = t.pixels;

    // ── DDA line into setPixel — the 1px-thin primitive the whole demo leans on. ─
    const line = (x0: number, y0: number, x1: number, y1: number, r: number, g: number, b: number): void => {
      const dx = x1 - x0;
      const dy = y1 - y0;
      const steps = Math.max(Math.abs(dx), Math.abs(dy)) | 0;
      if (steps === 0) { t.setPixel(x0, y0, r, g, b); return; }
      const sx = dx / steps;
      const sy = dy / steps;
      let x = x0;
      let y = y0;
      for (let i = 0; i <= steps; i++) {
        t.setPixel(x, y, r, g, b);
        x += sx;
        y += sy;
      }
    };

    // ── Layout. The Julia panel is the full frame; overlays are positioned in
    // pixel space derived from W/H so everything reflows on resize. ─────────────
    const cx = W * 0.5;
    const cy = H * 0.5;
    const aspect = t.aspect;

    // Julia parameter rotates slowly through its orbit; the view also turns a hair
    // so the filaments sweep — keeps motion alive without smearing detail.
    const theta = time * 0.07;
    const jcr = JULIA_R * Math.cos(theta);
    const jci = JULIA_R * Math.sin(theta);
    const viewRot = time * 0.015;
    const cosV = Math.cos(viewRot);
    const sinV = Math.sin(viewRot);

    // Complex view extents (centred, square in true units via aspect).
    const halfX = 1.55;
    const halfY = halfX / aspect;
    const invW = 1 / W;
    const invH = 1 / H;
    const invLog2 = 1 / Math.LN2;
    const BAILOUT2 = 1 << 16;

    // ── 1. Julia fractal background, drawn straight into buf for speed. ──────────
    // Stepped (NOT smoothed) palette: we quantise the smooth iteration count into
    // hard bands so the boundary is a stack of crisp contour lines — high-contrast
    // edges that expose every bit of sub-cell resolution. Interior is near-black so
    // the overlays read; exterior bands are a cohesive twilight ramp.
    let o = 0;
    for (let py = 0; py < H; py++) {
      // map pixel → complex, with the slow view rotation applied about centre
      const vy = (py * invH * 2 - 1) * halfY;
      for (let px = 0; px < W; px++) {
        const vx = (px * invW * 2 - 1) * halfX;
        // rotate the sample point
        const zr0 = vx * cosV - vy * sinV;
        const zi0 = vx * sinV + vy * cosV;
        let zr = zr0;
        let zi = zi0;
        let n = 0;
        let zr2 = zr * zr;
        let zi2 = zi * zi;
        while (n < JULIA_ITER) {
          zi = (zr + zr) * zi + jci;
          zr = zr2 - zi2 + jcr;
          zr2 = zr * zr;
          zi2 = zi * zi;
          if (zr2 + zi2 > BAILOUT2) break;
          n++;
        }

        let R: number, G: number, B: number;
        if (n >= JULIA_ITER) {
          // Interior — deep cold near-black so vector overlay + text pop.
          R = 4; G = 5; B = 10;
        } else {
          // smooth iteration, then HARD-quantise into contour bands.
          const m2 = zr2 + zi2;
          const nu = Math.log(Math.log(m2) * 0.5 * invLog2) * invLog2;
          const mu = n + 1 - nu;
          // band index — crisp stepped contours (the sharp-edge feature)
          const band = Math.floor(mu * 0.6);
          const inBand = fract(mu * 0.6); // 0..1 across a band
          // base band colour: a cool→warm twilight ramp, alternating value per band
          // so adjacent contour bands contrast — the stepped look that exposes edges.
          const hue = 0.58 + band * 0.018 + time * 0.01;
          const [hr, hg, hb] = hsv(fract(hue), 0.55, 0.40 + 0.14 * (band & 1));
          R = hr; G = hg; B = hb;
          // a thin bright GOLD thread right at each band boundary (inBand≈0 or ≈1).
          // The falloff is STEEP (×14) so the thread is a genuine 1px hairline — the
          // most mode-sensitive feature possible: a stack of crisp contour lines that
          // read chunky/aliased at half and razor-sharp at braille.
          const glow = clamp01(1 - inBand * 14) + clamp01(1 - (1 - inBand) * 14);
          R += glow * 170;
          G += glow * 135;
          B += glow * 70;
        }

        buf[o] = R > 255 ? 255 : R < 0 ? 0 : R;
        buf[o + 1] = G > 255 ? 255 : G < 0 ? 0 : G;
        buf[o + 2] = B > 255 ? 255 : B < 0 ? 0 : B;
        o += 3;
      }
    }

    // ── 2. Fine checkerboard (left strip) + ring moiré (right strip). ────────────
    // Both are blended at low alpha over the fractal so they overlay rather than
    // erase it — high-frequency Nyquist torture patterns. The checker cell size is
    // ONE pixel so it's pure alternating dots: the ultimate resolution stress test.
    const stripW = Math.max(10, (W * 0.16) | 0);
    const checkPhase = (time * 6) | 0; // slow crawl so it twinkles, stays crisp
    for (let py = 0; py < H; py++) {
      for (let px = 0; px < stripW; px++) {
        const on = ((px + py + checkPhase) & 1) === 0;
        const v = on ? 235 : 25;
        t.blendPixel(px, py, v, v, v, 0.46);
      }
    }
    // right strip: concentric-ring moiré centred just off the right edge
    const mcx = W - 4;
    const mcy = cy;
    const ringFreq = 0.9 + 0.15 * Math.sin(time * 0.5);
    for (let py = 0; py < H; py++) {
      const dyy = py - mcy;
      for (let px = W - stripW; px < W; px++) {
        const dxx = px - mcx;
        const rr = Math.sqrt(dxx * dxx + dyy * dyy);
        const ring = Math.sin(rr * ringFreq) > 0 ? 225 : 30;
        t.blendPixel(px, py, ring, ring, ring, 0.42);
      }
    }

    // ── 3. Thin vector overlay: concentric rings + rotating stellated star + a
    // fan of radial spokes. All 1px strokes — the most mode-sensitive feature. ───
    const overlayR = Math.min(W, H) * 0.36;

    // concentric rings (thin circles via parametric points connected by DDA)
    for (let ring = 1; ring <= 5; ring++) {
      const rad = overlayR * (ring / 5);
      const segs = Math.max(24, (rad * 0.9) | 0);
      let pxA = cx + rad;
      let pyA = cy;
      const tint = 60 + ring * 12;
      for (let s = 1; s <= segs; s++) {
        const a = (s / segs) * TAU;
        const pxB = cx + Math.cos(a) * rad;
        const pyB = cy + Math.sin(a) * rad;
        line(pxA, pyA, pxB, pyB, tint, tint + 30, 110);
        pxA = pxB;
        pyA = pyB;
      }
    }

    // radial spokes — a fine sunburst (thin lines from centre outward)
    const SPOKES = 36;
    for (let s = 0; s < SPOKES; s++) {
      const a = (s / SPOKES) * TAU + time * 0.05;
      const x1 = cx + Math.cos(a) * overlayR;
      const y1 = cy + Math.sin(a) * overlayR;
      // alternate brightness so adjacent spokes contrast hard
      const c = (s & 1) ? 90 : 200;
      line(cx, cy, x1, y1, c, c, (s & 1) ? 200 : 90);
    }

    // rotating stellated polygon (compass rose) — bright 1px chords
    const starR = overlayR * 0.92;
    const starRot = time * 0.25;
    const pts: Array<[number, number]> = [];
    for (let i = 0; i < STAR_POINTS; i++) {
      const a = (i / STAR_POINTS) * TAU + starRot;
      pts.push([cx + Math.cos(a) * starR, cy + Math.sin(a) * starR]);
    }
    for (let i = 0; i < STAR_POINTS; i++) {
      const [ax, ay] = pts[i];
      const [bx, by] = pts[(i * STAR_STEP) % STAR_POINTS];
      line(ax, ay, bx, by, 255, 230, 140);
    }

    // crosshair through the exact centre — perfectly straight 1px H/V lines
    line(0, cy | 0, W - 1, cy | 0, 120, 200, 255);
    line(cx | 0, 0, cx | 0, H - 1, 120, 200, 255);

    // ── 4. Small rendered text — the legibility demo. ───────────────────────────
    // A caption naming the LIVE mode + pixel dims, plus tiny corner tick labels.
    // Drawn at scale 1 (5×7 px glyphs) so legibility tracks the sub-cell budget.
    const modeName = t.mode.toUpperCase();
    const capLine1 = `MODE ${modeName}  ${W}x${H} PX`;
    const capLine2 = 'FINE DETAIL - 1PX STROKES - JULIA CONTOURS - 5X7 TEXT';
    const capLine3 = 'half 1x2  quad 2x2  sextant 2x3  braille 2x4';
    const capW = Math.max(
      Term.textWidth(capLine1),
      Term.textWidth(capLine2),
      Term.textWidth(capLine3),
    ) + 6;
    const capX = ((W - capW) / 2) | 0;
    const capY = (H - 30) | 0;
    t.plate(capX - 2, capY - 2, capW, 28, 0.6);
    t.text(capX, capY, capLine1, 255, 235, 150, 1);
    t.text(capX, capY + 9, capLine2, 150, 220, 255, 1);
    t.text(capX, capY + 18, capLine3, 170, 170, 185, 1);

    // tiny corner labels — stress the font at the frame edges
    t.text(2, 2, 'TL', 255, 120, 120, 1);
    t.text(W - 16, 2, 'TR', 120, 255, 120, 1);
    t.text(2, H - 9, 'BL', 120, 120, 255, 1);

    // a ruler of single-pixel tick marks along the top edge — 1px features at a
    // known pitch make the resolution ladder measurable at a glance.
    for (let x = 0; x < W; x += 4) {
      const tall = (x % 20) === 0;
      const h = tall ? 5 : 2;
      for (let y = 0; y < h; y++) t.setPixel(x, 11 + y, 255, 255, 255);
    }
  },
});
