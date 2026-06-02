/**
 * clawd — Anthropic's pixel mascot "Claw'd", alive in your terminal.
 *
 * A faithful, deliberately BLOCKY pixel sprite of Claw'd: a chunky terracotta
 * creature — square head with two black eyes, a wider shoulder band, a torso and
 * four stubby legs — exactly as he appears on Anthropic's "Welcome, Claw'd" card,
 * rendered flat on warm cream paper. The palette is taken straight from the real
 * artwork: clay rgb(218,119,88) (#DA7758), cream rgb(242,243,238), ink eyes.
 *
 * He is not a static logo here — he's animated with real character-animation
 * juice: a springy squash-&-stretch HOP (anticipation crouch → launch → airborne
 * stretch → landing squash), legs that tuck mid-air, a flat drop-shadow that
 * widens and darkens as he lands, periodic eased BLINKS, and a slow hop across the
 * cream stage with his gaze leading the way. Everything is eased; the look stays
 * true to the flat, minimal brand (no glow, no gradients) — just a crisp pixel
 * critter with personality, captioned "WELCOME, CLAW'D".
 *
 * Pure TypeScript on the ./_term half-block terminal engine. Scales to any
 * terminal size (the sprite re-fits every frame) and carries a live FPS counter.
 *
 * Run: bun run packages/all/example/clawd.ts   (ESC/q quit · SPACE pause)
 */
import { runDemo, clamp, clamp01, lerp, smoothstep } from './_term';

// ── Palette (sampled from the real "Welcome, Claw'd" artwork) ──────────────────
const CLAY: [number, number, number] = [218, 119, 88];
const CLAY_HI: [number, number, number] = [232, 142, 110]; // faint top bevel (1px), keeps it flat-ish
const CREAM: [number, number, number] = [242, 243, 238];
const INK: [number, number, number] = [38, 33, 29];
const CAPTION: [number, number, number] = [74, 66, 58];
const SHADOW: [number, number, number] = [206, 201, 188];

// Sprite is authored in abstract "units"; 18 wide × 16 tall (13 body + 3 legs).
const UNITS_W = 18;
const UNITS_H = 16;
const BODY_BOTTOM = 13; // legs hang below this
const HEAD_L = 3, HEAD_R = 15; // narrow head/torso span (cols 3..15 → width 12)

runDemo({
  title: "CLAW'D",
  hud: 'ANTHROPICS PIXEL MASCOT - PURE TYPESCRIPT',
  captureT: 3.2,
  drawHud: true,
  frame: (t, time) => {
    const { W, H } = t;
    // Flat cream stage.
    t.clear(CREAM[0], CREAM[1], CREAM[2]);

    // Fit the sprite to the current terminal. The vertical budget reserves room
    // for the HUD up top, the full hop-apex height, and the caption below — so the
    // creature never clips the top of the frame at the peak of a jump, at any size.
    const topMargin = 28; // clears the FPS HUD + leaves headroom for the apex
    const S = Math.max(2, Math.min(W / 24, (H - topMargin - 2) / 28));
    const apexLift = S * 5.2; // peak airborne height in px

    // ── Hop cycle: parabolic arc + springy squash/stretch ─────────────────────
    const HOP = 1.45; // seconds per hop
    const hp = (time / HOP) % 1; // 0..1 within a hop
    const arc = Math.sin(Math.PI * clamp01(hp)); // 0 (ground) → 1 (apex) → 0
    const lift = arc * apexLift; // airborne height in px
    // Feet rest at ~62% down, but pushed up if needed so the stretched apex clears
    // the HUD and pulled up so the caption still fits at the bottom.
    const capH = Math.max(1, Math.round(S * 0.5)) * 8;
    const groundY = Math.round(clamp(H * 0.62, topMargin + UNITS_H * S * 1.06 + apexLift, H - capH - S));
    const ground = Math.pow(1 - arc, 3); // ≈1 near the ground, 0 mid-air
    const squashY = 1 - 0.14 * ground + 0.06 * arc; // <1 grounded (squash), >1 airborne (stretch)
    const squashX = 1 + 0.16 * ground - 0.05 * arc;

    // ── Slow hop ACROSS the stage; gaze leads the direction of travel ─────────
    const drift = Math.sin(time * 0.27) * W * 0.16;
    const dir = Math.cos(time * 0.27); // velocity sign
    const cx = W / 2 + drift;
    const gaze = clamp(dir * 1.6, -1.2, 1.2) * S * 0.18; // px the eyes shift toward travel

    // ── Blink: quick eased close roughly every 3.3s (occasional double) ───────
    const bt = time % 3.3;
    const blink =
      bt < 0.16 ? 1 - Math.abs(bt - 0.08) / 0.08 : bt > 0.3 && bt < 0.42 ? 1 - Math.abs(bt - 0.36) / 0.06 : 0;
    const eyeOpen = 1 - clamp01(blink); // 1 open, 0 shut

    // Sprite→pixel transform. Feet anchored at groundY (squash pivots on the feet);
    // the whole creature lifts by `lift`. Horizontal centred on cx.
    const px = (u: number): number => cx + (u - UNITS_W / 2) * S * squashX;
    const py = (v: number): number => groundY - lift - (UNITS_H - v) * S * squashY;

    const fillRect = (x0: number, y0: number, x1: number, y1: number, c: [number, number, number]): void => {
      const ax = Math.round(Math.min(x0, x1)), bx = Math.round(Math.max(x0, x1));
      const ay = Math.round(Math.min(y0, y1)), by = Math.round(Math.max(y0, y1));
      for (let y = ay; y < by; y++) for (let x = ax; x < bx; x++) t.setPixel(x, y, c[0], c[1], c[2]);
    };

    // ── Flat drop-shadow on the cream, widening as he lands ───────────────────
    {
      const rx = (HEAD_R - HEAD_L + 5) * S * (0.5 + 0.42 * ground); // wider when grounded
      const ry = Math.max(1.5, S * (0.7 + 0.5 * ground));
      const scy = groundY + S * 0.6;
      const a = 0.3 * (0.35 + 0.65 * ground); // softer in the air
      for (let y = -Math.ceil(ry); y <= Math.ceil(ry); y++) {
        for (let x = -Math.ceil(rx); x <= Math.ceil(rx); x++) {
          const d = (x * x) / (rx * rx) + (y * y) / (ry * ry);
          if (d <= 1) t.blendPixel(Math.round(cx + x), Math.round(scy + y), SHADOW[0], SHADOW[1], SHADOW[2], a * (1 - d) * 1.4);
        }
      }
    }

    // ── Body: head + wide shoulder band + torso (contiguous rectangles) ───────
    fillRect(px(HEAD_L), py(0), px(HEAD_R), py(5), CLAY); // head
    fillRect(px(0), py(5), px(UNITS_W), py(8), CLAY); // shoulders (wide)
    fillRect(px(HEAD_L), py(8), px(HEAD_R), py(BODY_BOTTOM), CLAY); // torso
    // a 1px warmer top edge reads as a tiny bevel without breaking the flat look
    fillRect(px(HEAD_L), py(0), px(HEAD_R), py(0) + Math.max(1, S * 0.5), CLAY_HI);

    // ── Legs: 4 stubby legs, tucking up mid-hop ───────────────────────────────
    const legLen = 3.0 - 1.6 * arc; // units; shorter in the air (tucked)
    const legW = 1.7;
    for (let i = 0; i < 4; i++) {
      const c = HEAD_L + ((i + 0.5) / 4) * (HEAD_R - HEAD_L); // centre column of leg i
      fillRect(px(c - legW / 2), py(BODY_BOTTOM), px(c + legW / 2), py(BODY_BOTTOM + legLen), CLAY);
    }

    // ── Eyes: two ink squares high on the head; blink shrinks them to a line ──
    const eyeW = 2.6, eyeFull = 2.4;
    const eh = Math.max(0.5, eyeFull * eyeOpen);
    const eyeMidV = 2.6; // vertical centre on the head
    const eyeGx = gaze / S; // shift in units toward travel
    for (const ev of [HEAD_L + 2.2, HEAD_R - 2.2]) {
      const ecx = ev + eyeGx;
      fillRect(px(ecx - eyeW / 2), py(eyeMidV - eh / 2), px(ecx + eyeW / 2), py(eyeMidV + eh / 2), INK);
    }

    // ── Caption, like the card: "WELCOME, CLAW'D" centred below ───────────────
    const cap = "WELCOME, CLAW'D";
    const capScale = Math.max(1, Math.round(S * 0.5));
    const capW = (cap.length * 6 - 1) * capScale;
    const fadeIn = smoothstep(0.2, 1.1, time);
    const cr = lerp(CREAM[0], CAPTION[0], fadeIn) | 0;
    const cg = lerp(CREAM[1], CAPTION[1], fadeIn) | 0;
    const cb = lerp(CREAM[2], CAPTION[2], fadeIn) | 0;
    t.text(Math.round(cx - capW / 2), Math.round(groundY + S * 2.0), cap, cr, cg, cb, capScale, false);
  },
});
