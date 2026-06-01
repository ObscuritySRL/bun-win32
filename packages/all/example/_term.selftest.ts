/**
 * _term.selftest — exercises the terminal engine headlessly and proves it by
 * writing a PNG you can look at. Renders a full font atlas, a colour gradient,
 * additive glow blobs and an HSV ring, plus the standard HUD. Not a shipped demo.
 *
 *   CAPTURE_PNG=out.png TERM_COLS=200 TERM_ROWS=60 bun run _term.selftest.ts
 *   BENCH=1 bun run _term.selftest.ts
 */
import { runDemo, hsv, TAU } from './_term';

const ATLAS = ' 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ.,:;!?-+=/*%()[]<>|_#@&';

runDemo({
  title: 'Term Engine Selftest',
  hud: 'half-block truecolor · pure typescript',
  captureT: 2,
  frame: (t, time) => {
    // Background gradient.
    for (let y = 0; y < t.H; y++) {
      for (let x = 0; x < t.W; x++) {
        const r = (x / t.W) * 40;
        const g = (y / t.H) * 30;
        t.setPixel(x, y, r, g, 30 + 20 * Math.sin(time));
      }
    }
    // Additive moving glow blobs.
    for (let b = 0; b < 5; b++) {
      const cx = t.W * (0.5 + 0.32 * Math.cos(time * 0.7 + b));
      const cy = t.H * (0.5 + 0.32 * Math.sin(time * 0.9 + b * 1.3));
      const [cr, cg, cb] = hsv(b / 5 + time * 0.05, 0.8, 1);
      for (let dy = -14; dy <= 14; dy++) {
        for (let dx = -14; dx <= 14; dx++) {
          const d2 = dx * dx + dy * dy;
          const a = Math.exp(-d2 / 40);
          t.addPixel((cx + dx) | 0, (cy + dy) | 0, cr * a, cg * a, cb * a);
        }
      }
    }
    // HSV ring.
    const rx = t.W * 0.5, ry = t.H * 0.5, rad = Math.min(t.W, t.H) * 0.32;
    for (let i = 0; i < 360; i++) {
      const a = (i / 360) * TAU + time;
      const [r, g, b] = hsv(i / 360, 1, 1);
      t.setPixel((rx + Math.cos(a) * rad) | 0, (ry + Math.sin(a) * rad) | 0, r, g, b);
    }
    // Font atlas — verify every glyph renders correctly.
    t.text(6, t.H - 28, ATLAS, 230, 230, 240, 1);
    t.text(6, t.H - 18, 'THE QUICK BROWN FOX 0123456789 +-*/=', 120, 220, 255, 1);
    t.text(6, t.H - 8, 'MADE WITH PURE TYPESCRIPT @ 60+ FPS', 255, 180, 120, 1);
  },
});
