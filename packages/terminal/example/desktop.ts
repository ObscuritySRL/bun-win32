/**
 * desktop — a windowing desktop environment rendered entirely in the terminal on
 * the `_textterm` character-grid engine. A real compositor: overlapping draggable
 * windows with title bars, traffic-light buttons, box-drawing borders, soft drop
 * shadows (bg blended toward black behind/below-right), a z-order stack and a
 * focus glow, over an animated gradient wallpaper, with a bottom dock carrying a
 * live clock and app launchers.
 *
 * Three live apps: a Notepad with a real blinking caret and full text editing
 * (printable insert, backspace, enter, arrows, home/end, soft word-wrap); a Video
 * player streaming a chromascii-style shaded plasma "clip" behind a transport bar
 * (play/pause, advancing scrubber, elapsed/total); and an analog+digital Clock.
 *
 * Mouse drags title bars, clicks raise/focus, clicks buttons close/minimise, the
 * dock launches/restores apps; the keyboard routes to the focused Notepad. With no
 * input the demo runs a scripted attract performance — a synthetic cursor glides
 * in, drags the Notepad, focuses it and types a sentence character by character
 * (caret visible), while the video plays and scrubs — then loops. All motion is
 * derived from `time`; all randomness from `mulberry32`, so captures reproduce.
 */
import { CharTerm, runText } from '@bun-win32/terminal';
import type { RGB } from '@bun-win32/terminal';

import { clamp, clamp01, lerp, smoothstep, fract, TAU, hsv, mulberry32 } from './_kit';

// ── Palette ───────────────────────────────────────────────────────────────────
const INK: RGB = [228, 230, 240];
const DIM: RGB = [120, 124, 144];
const FAINT: RGB = [78, 82, 100];
const ACCENT: RGB = [90, 170, 255]; // crisp blue accent
const TITLE_ACTIVE: RGB = [40, 44, 60];
const TITLE_IDLE: RGB = [26, 28, 40];
const PANEL: RGB = [22, 24, 34];
const PANEL_HI: RGB = [30, 33, 46];
const LIGHT_RED: RGB = [255, 95, 86];
const LIGHT_YEL: RGB = [255, 189, 46];
const LIGHT_GRN: RGB = [40, 200, 64];

const AppId = { NOTEPAD: 0, VIDEO: 1, CLOCK: 2 } as const;
type AppId = (typeof AppId)[keyof typeof AppId];

interface Win {
  app: AppId;
  title: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minimized: boolean;
  // fractional spawn/restore animation (0..1)
  appear: number;
  // base position as a fraction of the desktop, for reflow on resize
  fx: number;
  fy: number;
}

// ── Notepad document model (independent of terminal size) ───────────────────────
// Stored as a single string with explicit '\n' breaks; soft-wrap done at render.
let docText = '';
let caret = 0; // index into docText
let caretSolid = false; // true while text is actively being entered (no blink)

// ── Compositor state ────────────────────────────────────────────────────────────
let wins: Win[] = [];
let zorder: number[] = []; // indices into wins, back→front
let cols = 0;
let rows = 0;
let deskH = 0; // rows above the dock
const DOCK_H = 3;

// Interaction state (live mode).
let dragWin = -1;
let dragDX = 0;
let dragDY = 0;
let lastSeq = -1;
let lastInputTime = -1e9;
let caretBlinkBase = 0;

// Attract cursor (also the live cursor sprite position, smoothed).
let curX = 0;
let curY = 0;
let curDown = false;

// Plasma LUT for the video player.
let sinLUT: Float32Array = new Float32Array(0);
const LUT_N = 2048;
const rnd = mulberry32(0x5eed1234);
// Per-cell static texture jitter for the wallpaper (precomputed, no hot alloc).
let wallJit: Float32Array = new Float32Array(0);

const FOCUS = (): number => (zorder.length ? zorder[zorder.length - 1] : -1);

const sinT = (x: number): number => {
  const i = ((x * (LUT_N / TAU)) | 0) & (LUT_N - 1);
  return sinLUT[i < 0 ? i + LUT_N : i];
};

// ── Layout ──────────────────────────────────────────────────────────────────────
const layout = (t: CharTerm): void => {
  cols = t.columns;
  rows = t.rows;
  deskH = rows - DOCK_H;
  for (const wn of wins) {
    wn.x = Math.round(wn.fx * cols);
    wn.y = Math.round(wn.fy * deskH);
    wn.x = clamp(wn.x, 0, Math.max(0, cols - wn.w));
    wn.y = clamp(wn.y, 1, Math.max(1, deskH - wn.h));
  }
};

const init = (t: CharTerm): void => {
  cols = t.columns;
  rows = t.rows;
  deskH = rows - DOCK_H;

  sinLUT = new Float32Array(LUT_N);
  for (let i = 0; i < LUT_N; i++) sinLUT[i] = Math.sin((i / LUT_N) * TAU);

  wallJit = new Float32Array(cols * rows);
  for (let i = 0; i < wallJit.length; i++) wallJit[i] = rnd();

  // Window sizes scale gently with the grid but stay legible.
  const npW = clamp(Math.round(cols * 0.34), 34, 56);
  const npH = clamp(Math.round(deskH * 0.52), 14, 22);
  const vdW = clamp(Math.round(cols * 0.32), 34, 52);
  const vdH = clamp(Math.round(deskH * 0.5), 13, 20);
  const ckW = 26;
  const ckH = 13;

  wins = [
    { app: AppId.NOTEPAD, title: 'Notepad — untitled.txt', x: 0, y: 0, w: npW, h: npH, minimized: false, appear: 0, fx: 0.06, fy: 0.16 },
    { app: AppId.VIDEO, title: 'Player — render.mov', x: 0, y: 0, w: vdW, h: vdH, minimized: false, appear: 0, fx: 0.5, fy: 0.1 },
    { app: AppId.CLOCK, title: 'Clock', x: 0, y: 0, w: ckW, h: ckH, minimized: false, appear: 0, fx: 0.42, fy: 0.55 },
  ];
  // Back→front: clock, video, notepad (notepad focused).
  zorder = [AppId.CLOCK, AppId.VIDEO, AppId.NOTEPAD];

  docText = '';
  caret = 0;
  dragWin = -1;
  lastSeq = -1;
  lastInputTime = -1e9;
  curX = Math.round(cols * 0.5);
  curY = Math.round(deskH * 0.5);

  layout(t);
};

// ── z-order helpers ──────────────────────────────────────────────────────────────
const raise = (app: number): void => {
  const k = zorder.indexOf(app);
  if (k >= 0) zorder.splice(k, 1);
  zorder.push(app);
};

// ── Notepad editing ──────────────────────────────────────────────────────────────
// Soft-wrap the document into display lines for a given inner width. Returns the
// wrapped lines and, for caret routing, the (line,col) the caret maps to. To avoid
// per-frame allocation we keep scratch arrays module-scoped and reuse them.
const wrapLines: string[] = [];
const wrapStart: number[] = []; // doc index at the start of each wrapped line
let caretLine = 0;
let caretCol = 0;

const rewrap = (innerW: number): void => {
  wrapLines.length = 0;
  wrapStart.length = 0;
  caretLine = 0;
  caretCol = 0;
  const W = Math.max(1, innerW);
  // Split on explicit newlines first.
  let lineStart = 0;
  const pushWrapped = (segStart: number, seg: string): void => {
    // Greedy soft word-wrap of one logical line.
    if (seg.length === 0) {
      wrapStart.push(segStart);
      wrapLines.push('');
      return;
    }
    let i = 0;
    while (i < seg.length) {
      let end = Math.min(seg.length, i + W);
      if (end < seg.length) {
        // try to break at the last space within [i,end]
        let brk = -1;
        for (let j = end; j > i; j--) {
          if (seg[j - 1] === ' ') {
            brk = j;
            break;
          }
        }
        if (brk > i) end = brk;
      }
      wrapStart.push(segStart + i);
      wrapLines.push(seg.slice(i, end));
      i = end;
    }
  };
  for (let i = 0; i <= docText.length; i++) {
    if (i === docText.length || docText[i] === '\n') {
      pushWrapped(lineStart, docText.slice(lineStart, i));
      lineStart = i + 1;
    }
  }
  if (wrapLines.length === 0) {
    wrapLines.push('');
    wrapStart.push(0);
  }
  // Locate caret in wrapped coordinates.
  for (let l = 0; l < wrapLines.length; l++) {
    const s = wrapStart[l];
    const e = s + wrapLines[l].length;
    const isLast = l === wrapLines.length - 1;
    if (caret >= s && (caret <= e || isLast) && (caret <= e || caret < (wrapStart[l + 1] ?? Infinity))) {
      if (caret <= e) {
        caretLine = l;
        caretCol = caret - s;
        return;
      }
    }
  }
  caretLine = wrapLines.length - 1;
  caretCol = wrapLines[caretLine].length;
};

const insertText = (s: string): void => {
  docText = docText.slice(0, caret) + s + docText.slice(caret);
  caret += s.length;
};

const onKey = (key: string, t: CharTerm): void => {
  // Wake the user out of attract mode and route to the focused window.
  lastInputTime = liveTime;
  caretBlinkBase = liveTime;
  lastTypeTime = liveTime;
  const focus = FOCUS();
  if (focus !== AppId.NOTEPAD) {
    // Tab cycles focus; otherwise typing focuses Notepad so keys land somewhere.
    if (key === 'tab') {
      raise(zorder[0]);
      return;
    }
    raise(AppId.NOTEPAD);
  }
  // Notepad is focused now.
  if (key.length === 1 && key >= ' ') {
    insertText(key);
  } else if (key === 'space') {
    insertText(' ');
  } else if (key === 'enter') {
    insertText('\n');
  } else if (key === 'tab') {
    insertText('  ');
  } else if (key === 'backspace') {
    if (caret > 0) {
      docText = docText.slice(0, caret - 1) + docText.slice(caret);
      caret--;
    }
  } else if (key === 'delete') {
    if (caret < docText.length) docText = docText.slice(0, caret) + docText.slice(caret + 1);
  } else if (key === 'left') {
    if (caret > 0) caret--;
  } else if (key === 'right') {
    if (caret < docText.length) caret++;
  } else if (key === 'home') {
    while (caret > 0 && docText[caret - 1] !== '\n') caret--;
  } else if (key === 'end') {
    while (caret < docText.length && docText[caret] !== '\n') caret++;
  } else if (key === 'up' || key === 'down') {
    moveCaretVertical(key === 'up' ? -1 : 1, t);
  }
};

// Vertical caret movement across wrapped lines (uses the focused notepad width).
const moveCaretVertical = (dir: number, _t: CharTerm): void => {
  const wn = wins[AppId.NOTEPAD];
  const innerW = wn.w - 4;
  rewrap(innerW);
  const target = caretLine + dir;
  if (target < 0 || target >= wrapLines.length) return;
  const col = Math.min(caretCol, wrapLines[target].length);
  caret = wrapStart[target] + col;
};

// ── Mouse handling (live) ────────────────────────────────────────────────────────
// Title-bar hit test → returns a button id (-1 none, 0 close, 1 min, 2 fill) or
// -2 for "draggable title body".
const titleButtonAt = (wn: Win, mx: number, my: number): number => {
  if (my !== wn.y) return -3; // not on title row
  // Traffic lights sit at x+2, x+4, x+6.
  if (mx === wn.x + 2) return 0;
  if (mx === wn.x + 4) return 1;
  if (mx === wn.x + 6) return 2;
  if (mx >= wn.x && mx < wn.x + wn.w) return -2;
  return -3;
};

const handleMouse = (t: CharTerm): void => {
  if (t.mouse.sequence === lastSeq) return;
  lastSeq = t.mouse.sequence;
  lastInputTime = liveTime;
  const mx = t.mouse.x;
  const my = t.mouse.y;
  curDown = t.mouse.down;

  // Dock hit test (bottom strip): launcher icons restore/raise apps.
  if (my >= deskH) {
    if (t.mouse.down) {
      const dockApp = dockIconAt(mx);
      if (dockApp >= 0) {
        const wn = wins[dockApp];
        wn.minimized = false;
        if (wn.appear < 1) wn.appear = 1;
        raise(dockApp);
      }
    }
    return;
  }

  if (t.mouse.down && dragWin < 0) {
    // Press: find topmost window under cursor.
    for (let z = zorder.length - 1; z >= 0; z--) {
      const app = zorder[z];
      const wn = wins[app];
      if (wn.minimized) continue;
      if (mx >= wn.x && mx < wn.x + wn.w && my >= wn.y && my < wn.y + wn.h) {
        raise(app);
        const btn = titleButtonAt(wn, mx, my);
        if (btn === 0) {
          wn.minimized = true; // "close" → send to dock (restorable)
        } else if (btn === 1) {
          wn.minimized = true;
        } else if (btn === -2) {
          dragWin = app;
          dragDX = mx - wn.x;
          dragDY = my - wn.y;
        }
        break;
      }
    }
  } else if (t.mouse.down && dragWin >= 0) {
    const wn = wins[dragWin];
    wn.x = clamp(mx - dragDX, -wn.w + 6, cols - 6);
    wn.y = clamp(my - dragDY, 1, deskH - 2);
    wn.fx = wn.x / cols;
    wn.fy = wn.y / deskH;
  } else if (!t.mouse.down) {
    dragWin = -1;
  }
};

// ── Drop shadow ─────────────────────────────────────────────────────────────────
// A genuinely soft shadow: a penumbra band that wraps the window, with alpha that
// falls off with distance from the window edge and biases down-right (light from
// upper-left). Cells inside the window are skipped. Cheap: one shadeRect per cell.
const SHADOW_PAD = 3;
const dropShadow = (t: CharTerm, wn: Win): void => {
  const x0 = wn.x;
  const y0 = wn.y;
  const x1 = wn.x + wn.w; // exclusive
  const y1 = wn.y + wn.h; // exclusive
  const sx0 = Math.max(0, x0 - 1);
  const sy0 = Math.max(0, y0 - 1);
  const sx1 = Math.min(cols, x1 + SHADOW_PAD + 1);
  const sy1 = Math.min(deskH, y1 + SHADOW_PAD + 1);
  for (let sy = sy0; sy < sy1; sy++) {
    for (let sx = sx0; sx < sx1; sx++) {
      // Skip cells under the window itself.
      if (sx >= x0 && sx < x1 && sy >= y0 && sy < y1) continue;
      // Signed distance outside the window rectangle (in cells), y weighted for aspect.
      const ddx = sx < x0 ? x0 - sx : sx >= x1 ? sx - x1 + 1 : 0;
      const ddy = sy < y0 ? y0 - sy : sy >= y1 ? sy - y1 + 1 : 0;
      // Bias: light from upper-left → cast longer down & right, shorter up & left.
      const offx = sx >= x1 ? 0 : sx < x0 ? 1.6 : 0;
      const offy = sy >= y1 ? 0 : sy < y0 ? 1.6 : 0;
      const dist = Math.sqrt(ddx * ddx * 0.55 + ddy * ddy * 1.1) + offx + offy;
      const a = (1 - dist / (SHADOW_PAD + 1.2)) * 0.5;
      if (a > 0.02) t.shadeRect(sx, sy, 1, 1, 0, 0, 0, a);
    }
  }
};

// ── Window chrome ───────────────────────────────────────────────────────────────
const drawTitleBar = (t: CharTerm, wn: Win, focused: boolean): void => {
  const barBg = focused ? TITLE_ACTIVE : TITLE_IDLE;
  t.fillRect(wn.x, wn.y, wn.w, 1, barBg);
  // Focused bar gets a left→right accent wash (brighter at the lights) so the
  // active window clearly pops; idle bars stay flat and recessed.
  if (focused) {
    const grad = wn.w;
    for (let i = 0; i < grad; i++) {
      const k = 1 - i / grad;
      t.shadeRect(wn.x + i, wn.y, 1, 1, 46, 86, 152, 0.10 + 0.16 * k);
    }
  }
  // Rounded lit corners frame the bar.
  t.put(wn.x, wn.y, '╭', focused ? [110, 140, 190] : [54, 58, 76], undefined);
  // Traffic lights (rim-lit when focused; a halo cell under each sells the glow).
  if (focused) t.shadeRect(wn.x + 1, wn.y, 7, 1, 60, 70, 90, 0.25);
  t.put(wn.x + 2, wn.y, '●', focused ? LIGHT_RED : FAINT, undefined, focused);
  t.put(wn.x + 4, wn.y, '●', focused ? LIGHT_YEL : FAINT, undefined, focused);
  t.put(wn.x + 6, wn.y, '●', focused ? LIGHT_GRN : FAINT, undefined, focused);
  // Centered-ish title.
  const tcol: RGB = focused ? INK : DIM;
  const maxTitle = wn.w - 10;
  let title = wn.title;
  if (title.length > maxTitle) title = title.slice(0, Math.max(0, maxTitle - 1)) + '…';
  const tx = wn.x + 9;
  t.text(tx, wn.y, title, tcol, undefined, focused);
  // Focus accent on the title row's far edges (clear "active" framing).
  if (focused) {
    t.put(wn.x + wn.w - 1, wn.y, '╮', ACCENT, undefined);
    t.put(wn.x + 8, wn.y, '▏', [80, 130, 200], undefined);
  }
};

const drawWindowFrame = (t: CharTerm, wn: Win, focused: boolean): void => {
  // Content panel fill.
  const body: RGB = focused ? PANEL : [18, 19, 27];
  t.fillRect(wn.x, wn.y + 1, wn.w, wn.h - 1, body);
  // Border (skip the title row top edge; draw sides + bottom + a divider).
  const bcol: RGB = focused ? [70, 96, 140] : [44, 48, 62];
  // bottom + sides
  t.box(wn.x, wn.y + 1, wn.w, wn.h - 1, 'rounded', bcol, body);
  // Title bar last so it sits above the border top.
  drawTitleBar(t, wn, focused);
};

// ── App: Notepad ─────────────────────────────────────────────────────────────────
const drawNotepad = (t: CharTerm, wn: Win, focused: boolean, time: number): void => {
  const innerX = wn.x + 2;
  const innerY = wn.y + 2;
  const innerW = wn.w - 4;
  const innerH = wn.h - 4;
  rewrap(innerW);

  // Scroll so the caret line stays visible.
  let top = 0;
  if (caretLine >= innerH) top = caretLine - innerH + 1;

  const body: RGB = focused ? [24, 26, 36] : [18, 19, 27];
  // Paper region with a subtle left gutter rule and a faint margin guide.
  t.fillRect(innerX - 1, innerY, innerW + 2, innerH, body);
  // Soft horizontal ruling across the whole page so the void reads as paper.
  const rule: RGB = focused ? [30, 33, 46] : [22, 24, 33];
  for (let row = 0; row < innerH; row++) t.hline(innerX + 3, innerY + row, innerW - 3, '┄', rule, body);
  // Coloured gutter rule + a vertical margin guide a few cols in.
  t.vline(innerX - 1, innerY, innerH, '▏', [70, 120, 190], body);
  t.vline(innerX + 2, innerY, innerH, '▕', focused ? [44, 50, 70] : [32, 36, 50], body);

  const curRow = caretLine - top;
  for (let row = 0; row < innerH; row++) {
    const l = top + row;
    // Highlight the active line softly (a current-line band, like real editors).
    if (focused && row === curRow) t.shadeRect(innerX - 1, innerY + row, innerW + 2, 1, 60, 90, 150, 0.14);
    if (l >= wrapLines.length) continue;
    const lineNo = (l + 1).toString().padStart(2);
    const onCur = focused && row === curRow;
    t.text(innerX, innerY + row, lineNo, onCur ? [120, 160, 215] : FAINT, undefined, onCur);
    t.text(innerX + 3, innerY + row, wrapLines[l], INK, undefined);
  }

  // Placeholder hint while the page is empty — keeps the window from reading dead.
  if (docText.length === 0 && innerH >= 3) {
    const hint = 'start typing…';
    const hx = innerX + 3 + Math.max(0, ((innerW - 3 - hint.length) >> 1));
    const hy = innerY + (innerH >> 1);
    t.text(hx, hy, hint, focused ? [70, 80, 104] : [50, 56, 74], undefined);
  }

  // Caret: a real block caret — solid while actively typing, blinking when idle.
  const blink = Math.floor((time - caretBlinkBase) * 2.2) % 2 === 0;
  if (focused && (caretSolid || blink)) {
    const cl = caretLine - top;
    if (cl >= 0 && cl < innerH) {
      const cx = innerX + 3 + caretCol;
      if (cx < wn.x + wn.w - 1) {
        const under = caretCol < wrapLines[caretLine].length ? wrapLines[caretLine][caretCol] : ' ';
        t.put(cx, innerY + cl, under === ' ' ? '█' : under, [12, 14, 20], ACCENT, true);
      }
    }
  }

  // Status line at the bottom of the window.
  const stY = wn.y + wn.h - 1;
  const words = docText.trim().length ? docText.trim().split(/\s+/).length : 0;
  const status = ` Ln ${caretLine + 1}  Col ${caretCol + 1}  ${docText.length} chars  ${words} words `;
  t.fillRect(wn.x + 1, stY, wn.w - 2, 1, [16, 17, 24]);
  t.text(wn.x + 2, stY, status.length > wn.w - 4 ? status.slice(0, wn.w - 4) : status, DIM, [16, 17, 24]);
};

// ── App: Video player (a real "clip" — a sun setting over a rippling sea) ──────────
// The screen plays a legible SCENE rather than plasma noise: a graded twilight sky,
// a CLEAR round sun with a contained bloom, a crisp horizon line, and a single bright
// reflection column shimmering on near-black water. The glyph chosen per cell is
// driven by the FINAL shaded value, so dark cells stay genuinely empty and the bright
// sun + glittering reflection read as the subject. Warm gold sun, cool indigo sky/sea.
const RAMP = ' .·:-=+*#%@';
let videoTime = 0; // elapsed seconds in the clip
let videoPlaying = true;
const VIDEO_TOTAL = 24; // total clip length (s)

const drawVideo = (t: CharTerm, wn: Win, focused: boolean, time: number): void => {
  const innerX = wn.x + 1;
  const innerY = wn.y + 2;
  const innerW = wn.w - 2;
  const innerH = wn.h - 5; // leave 2 rows for transport
  // Letterboxed black screen.
  t.fillRect(innerX, innerY, innerW, innerH, [5, 5, 10]);

  const ph = videoTime;
  // The sun sweeps left→right and SETS into the sea over the loop, so the horizon
  // line stays put while the sun dips through it — a real, readable sunset.
  const horizon = Math.round(innerH * 0.50); // integer row → a crisp seam
  const arc = fract(ph / VIDEO_TOTAL); // 0..1 across the clip
  const sunX = innerW * (0.18 + 0.64 * arc); // glides across
  // Rises a touch then settles onto/just below the horizon by clip end.
  const sunY = horizon - innerH * (0.26 * Math.sin(arc * Math.PI) - 0.02);
  const sunR = Math.max(2.4, innerW * 0.10); // sun radius in screen-x cells
  const aspY = 1.6; // cells are ~1.6:1 tall → stretch dy so the disc reads round
  const invW = 1 / Math.max(1, innerW);
  const RN = RAMP.length - 1;
  // Palette anchors blended in RGB so the sky never crosses the green/cyan zone
  // that a raw HSV hue-lerp would pass through. warm 0→1 = cool indigo → hot gold.
  // [deep indigo] → [violet dusk] → [amber] → [white-gold sun core]
  const SKY_DARK = [10, 14, 40]; // upper sky / away from sun
  const SKY_DUSK = [60, 34, 78]; // mid violet
  const SKY_WARM = [235, 138, 56]; // amber near horizon/sun
  const SUN_CORE = [255, 234, 168]; // hot white-gold disc
  const skyCol = (warm: number, out: number[]): void => {
    // Two-segment RGB ramp: dark→dusk for the cool half, dusk→warm→core for the hot.
    if (warm < 0.5) {
      const k = warm * 2;
      out[0] = SKY_DARK[0] + (SKY_DUSK[0] - SKY_DARK[0]) * k;
      out[1] = SKY_DARK[1] + (SKY_DUSK[1] - SKY_DARK[1]) * k;
      out[2] = SKY_DARK[2] + (SKY_DUSK[2] - SKY_DARK[2]) * k;
    } else {
      const k = (warm - 0.5) * 2;
      const a = k < 0.6 ? SKY_DUSK : SKY_WARM;
      const b = k < 0.6 ? SKY_WARM : SUN_CORE;
      const kk = k < 0.6 ? k / 0.6 : (k - 0.6) / 0.4;
      out[0] = a[0] + (b[0] - a[0]) * kk;
      out[1] = a[1] + (b[1] - a[1]) * kk;
      out[2] = a[2] + (b[2] - a[2]) * kk;
    }
  };
  const SEA_DARK = [8, 12, 34]; // near-black indigo water
  const SEA_GLINT = [255, 196, 96]; // warm gold glitter
  const col: number[] = [0, 0, 0];

  for (let y = 0; y < innerH; y++) {
    const sky = y < horizon;
    // Faint scanline darkening on alternate rows → reads as a real display.
    const scan = (y & 1) ? 0.92 : 1.0;
    // Vertical position normalised within sky / sea band.
    const vSky = horizon > 0 ? y / horizon : 0; // 0 top → 1 horizon
    const seaH = Math.max(1, innerH - horizon);
    const vSea = (y - horizon) / seaH; // 0 at horizon → 1 bottom
    // Distance of this whole row from the sun centre (vertical part, squashed).
    const dyS = (y - sunY) * aspY;
    for (let x = 0; x < innerW; x++) {
      let lum: number;
      let warm: number;
      if (sky) {
        // Graded twilight that warms toward the horizon.
        const grad = vSky * vSky; // glow pools toward the horizon
        // Tight round sun + a CONTAINED bloom (falls to ~0 within a few radii).
        const dxs = (x - sunX) / sunR;
        const dd = dxs * dxs + (dyS / sunR) * (dyS / sunR);
        const disc = dd < 1.0 ? smoothstep(1.0, 0.55, dd) : 0; // round soft-edged disc
        const halo = Math.exp(-dd * 1.1); // bloom contained to a few radii
        // Slow horizontal cloud band streaks near the sun (subtracts light → silhouette).
        const cloud = smoothstep(0.6, 0.95, 0.5 + 0.5 * sinT(y * 1.5 - ph * 0.5)) * 0.4 * halo;
        lum = clamp01(0.04 + 0.16 * grad + 1.0 * disc + 0.55 * halo - cloud);
        warm = clamp01(disc + halo * 0.85 + grad * 0.45);
        skyCol(warm, col);
      } else {
        // Sea: near-black water with ONE bright reflection column under the sun that
        // shimmers in horizontal dashes, plus a faint distant swell.
        const reflectX = Math.abs(x - sunX);
        const colW = sunR * (0.5 + 0.85 * vSea);
        const inCol = reflectX < colW ? 1 - reflectX / colW : 0;
        // Ripple chops the column into traveling dashes scrolling toward the viewer.
        const ripple = 0.5 + 0.5 * sinT(y * 2.0 - ph * 3.0 + sinT(x * 0.5) * 1.6);
        const glint = inCol * inCol * (0.3 + 0.7 * ripple) * (1 - vSea * 0.3);
        // Sparse far swell — keeps open water alive without lighting it up.
        const swell = 0.5 + 0.5 * sinT(x * 0.45 + y * 0.9 - ph * 1.8);
        const water = 0.035 * swell * (1 - vSea * 0.6);
        lum = clamp01(water + 0.95 * glint);
        warm = clamp01(glint * 2);
        col[0] = SEA_DARK[0] + (SEA_GLINT[0] - SEA_DARK[0]) * warm;
        col[1] = SEA_DARK[1] + (SEA_GLINT[1] - SEA_DARK[1]) * warm;
        col[2] = SEA_DARK[2] + (SEA_GLINT[2] - SEA_DARK[2]) * warm;
      }
      // Edge vignette so the panel has depth.
      const u = (x - innerW * 0.5) * invW;
      const vig = 1 - 0.42 * (u * u * 2.0 + (sky ? 0 : 0.10));
      const val = clamp01(lum * vig) * scan;
      const ri = (val * RN + 0.5) | 0;
      const ch = RAMP[ri > RN ? RN : ri];
      // Glyph carries the lit colour; a much dimmer hue-matched backing fills the cell.
      const fgv = 0.45 + 0.55 * val;
      t.put(
        innerX + x, innerY + y, ch,
        [col[0] * fgv, col[1] * fgv, col[2] * fgv],
        [col[0] * 0.16 + 3, col[1] * 0.16 + 3, col[2] * 0.16 + 6],
      );
    }
  }
  // A crisp glowing horizon seam where sky meets sea — brightest under the sun.
  if (horizon > 0 && horizon < innerH) {
    for (let x = 0; x < innerW; x++) {
      const near = clamp01(1 - Math.abs(x - sunX) / (sunR * 2.4));
      const r = lerp(40, 255, near), g = lerp(46, 188, near), b = lerp(86, 110, near);
      t.put(innerX + x, innerY + horizon, near > 0.35 ? '━' : '─', [r, g, b], undefined, near > 0.5);
    }
  }

  // Transport bar.
  const tbY = wn.y + wn.h - 2;
  const barBg: RGB = focused ? [20, 22, 32] : [16, 17, 24];
  t.fillRect(wn.x + 1, tbY, wn.w - 2, 2, barBg);
  // Play / pause glyph.
  t.put(wn.x + 2, tbY, videoPlaying ? '▶' : '⏸', ACCENT, barBg, true);
  // Time stamps.
  const elapsed = fmtTime(videoTime);
  const total = fmtTime(VIDEO_TOTAL);
  t.text(wn.x + 4, tbY, elapsed, INK, barBg);
  const totX = wn.x + wn.w - 2 - total.length;
  t.text(totX, tbY, total, DIM, barBg);
  // Scrubber track + filled portion + knob.
  const trkX = wn.x + 4 + elapsed.length + 1;
  const trkW = Math.max(2, totX - 1 - trkX);
  t.hline(trkX, tbY + 1, trkW, '─', FAINT, barBg);
  const frac = clamp01(videoTime / VIDEO_TOTAL);
  const fillW = Math.round(trkW * frac);
  for (let i = 0; i < fillW; i++) t.put(trkX + i, tbY + 1, '━', ACCENT, barBg);
  const knob = trkX + Math.min(trkW - 1, fillW);
  t.put(knob, tbY + 1, '●', [255, 255, 255], barBg, true);
  void time;
};

const fmtTime = (s: number): string => {
  const m = Math.floor(s / 60);
  const ss = Math.floor(s % 60);
  return `${m}:${ss.toString().padStart(2, '0')}`;
};

// ── App: Clock (analog + digital) ────────────────────────────────────────────────
// A faux time driven by sim time so it animates in capture (not wall-clock).
// Shared start offset so the dock clock and the analog face agree.
const CLOCK_START = 10 * 3600 + 8 * 60 + 30; // 10:08:30
const drawClock = (t: CharTerm, wn: Win, focused: boolean, time: number): void => {
  const innerX = wn.x + 1;
  const innerY = wn.y + 2;
  const innerW = wn.w - 2;
  const innerH = wn.h - 4;
  const body: RGB = focused ? [20, 22, 32] : [16, 17, 24];
  t.fillRect(innerX, innerY, innerW, innerH, body);

  // Synthetic clock: the second hand sweeps once per real minute. We start at a
  // pose where hour and minute hands sit at clearly DIFFERENT angles (10:08) so the
  // short-thick hour vs long-thin minute distinction is obvious from any frame.
  const clk = CLOCK_START + time * 60; // second hand visibly sweeps
  const secAng = (clk % 60) / 60;
  const minAng = ((clk / 60) % 60) / 60;
  const hourAng = ((clk / 3600) % 12) / 12;

  // Centre the dial in the band BETWEEN the title bar and the digital readout (which
  // occupies the bottom row of the window), not in the raw content rect — otherwise
  // the face rides up against the title and its lower ticks collide with the digits.
  const faceY0 = innerY; // first usable row under the title
  const faceY1 = wn.y + wn.h - 2; // exclusive: the digital row
  const cxp = innerX + innerW * 0.5;
  const cyp = (faceY0 + faceY1) * 0.5 - 0.5;
  const asp = 0.5; // vertical squash for cell aspect (cells are ~2:1)
  // Fit the dial inside the usable band with a little breathing room top & bottom.
  const rad = Math.min(innerW * 0.5 - 1.0, ((faceY1 - faceY0) * 0.5 - 0.5) / asp) - 0.2;

  // Face: a soft radial dial — a recessed disc that brightens toward the centre,
  // with a cool steel-blue tint so it reads as glass, not a flat hole. A gentle
  // diagonal sheen (upper-left brighter) gives it a convex feel without a hard bar.
  for (let yy = innerY; yy < innerY + innerH; yy++) {
    for (let xx = innerX; xx < innerX + innerW; xx++) {
      const dx = (xx - cxp) / rad;
      const dy = (yy - cyp) / (rad * asp);
      const rr = Math.sqrt(dx * dx + dy * dy);
      if (rr > 1.02) continue;
      const lift = (1 - rr) * (1 - rr); // convex centre lift
      const sheen = clamp01(0.5 - (dx + dy) * 0.5); // smooth UL→LR sheen, no edges
      t.shadeRect(xx, yy, 1, 1, 30, 42, 70, 0.10 + 0.20 * lift + 0.10 * sheen * lift);
    }
  }
  // Minute pips + bold hour ticks around the face (continuous, reads as a ring).
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * TAU - TAU / 4;
    const hour = i % 5 === 0;
    const tr = rad * (hour ? 0.96 : 0.99);
    const tx = Math.round(cxp + Math.cos(a) * tr);
    const ty = Math.round(cyp + Math.sin(a) * tr * asp);
    if (hour) {
      t.put(tx, ty, i % 15 === 0 ? '◆' : '•', i % 15 === 0 ? ACCENT : [150, 175, 215], undefined, true);
    } else {
      t.put(tx, ty, '·', focused ? [62, 78, 110] : [46, 54, 74], undefined);
    }
  }
  // Hands: aspect-correct strokes whose glyph follows the on-SCREEN slope so a
  // near-horizontal hand draws '─' and a near-vertical one '│' — no smear. Each
  // hand has a distinct WEIGHT so they can never be confused:
  //   • hour   — SHORT + HEAVY: a bright bold stroke, fattened one cell on each side
  //              over its inner length so it reads as a tapered wedge (not a block).
  //   • minute — LONG + THIN: a single fine stroke.
  //   • second — LONGEST + finest: a dim tapering red sweep.
  // Heavy glyphs trace the slope too, so the wedge stays a clean diagonal — never a
  // blocky 'T'. Box-drawing heavies: ━ │ (vertical stays single-weight, still bold).
  const slopeGlyph = (dx: number, dy: number, heavy: boolean): string => {
    const ax = Math.abs(dx);
    const ay = Math.abs(dy) * 2; // un-squash to screen space for slope test
    if (ax > ay * 2.2) return heavy ? '━' : '─';
    if (ay > ax * 2.2) return '│';
    return dx * dy < 0 ? '/' : '\\';
  };
  const drawHand = (
    frac: number,
    len: number,
    col: RGB,
    opts: { bold?: boolean; taper?: boolean; thick?: boolean } = {},
  ): void => {
    const { bold = false, taper = false, thick = false } = opts;
    const a = frac * TAU - TAU / 4;
    const ex = Math.cos(a);
    const ey = Math.sin(a);
    const g = slopeGlyph(ex, ey, thick);
    // Perpendicular (screen-space) unit, used to fatten the heavy hour hand by one
    // cell on EACH side over its inner length so it reads as a solid tapered wedge.
    const plen = Math.hypot(ex, ey * asp) || 1;
    const pxn = (-ey * asp) / plen;
    const pyn = ex / plen;
    const steps = Math.max(3, Math.round(len * 2.4));
    let lpx = -999, lpy = -999;
    // Start one step out from the hub so the hand grows FROM the centre, contiguous.
    for (let s = 1; s <= steps; s++) {
      const rr = (s / steps) * len;
      const hx = Math.round(cxp + ex * rr);
      const hy = Math.round(cyp + ey * rr * asp);
      if (hx === lpx && hy === lpy) continue; // de-dup overlapping cells
      lpx = hx;
      lpy = hy;
      const k = taper ? 0.62 + 0.38 * (1 - s / steps) : 1;
      t.put(hx, hy, g, [col[0] * k, col[1] * k, col[2] * k], undefined, bold);
      if (thick && s < steps * 0.7) {
        // Fatten symmetrically over the inner portion → a solid wedge that narrows to
        // a single-cell tip. Both flanks use the SAME slope glyph so the heavy hour
        // hand stays a clean diagonal bar, never a blocky T.
        const ox1 = Math.round(cxp + ex * rr + pxn);
        const oy1 = Math.round(cyp + ey * rr * asp + pyn * asp);
        const ox2 = Math.round(cxp + ex * rr - pxn);
        const oy2 = Math.round(cyp + ey * rr * asp - pyn * asp);
        const fc: RGB = [col[0] * 0.82, col[1] * 0.82, col[2] * 0.82];
        if (ox1 !== hx || oy1 !== hy) t.put(ox1, oy1, g, fc, undefined, bold);
        if (ox2 !== hx || oy2 !== hy) t.put(ox2, oy2, g, fc, undefined, bold);
      }
    }
  };
  // Hour: SHORT + THICK + bright, drawn first so the thinner hands lie over its hub.
  drawHand(hourAng, rad * 0.45, [238, 242, 255], { bold: true, thick: true });
  // Minute: LONG + THIN, cool blue.
  drawHand(minAng, rad * 0.92, [150, 190, 250], { bold: true });
  // Second: longest, finest, dim red sweep.
  drawHand(secAng, rad * 1.0, LIGHT_RED, { taper: true });
  // Glowing centre hub.
  const cix = Math.round(cxp);
  const ciy = Math.round(cyp);
  t.put(cix, ciy, '◉', ACCENT, undefined, true);

  // Digital readout under the face.
  const hh = Math.floor((clk / 3600) % 12) || 12;
  const mm = Math.floor((clk / 60) % 60);
  const sscc = Math.floor(clk % 60);
  const digital = `${hh.toString().padStart(2)}:${mm.toString().padStart(2, '0')}:${sscc.toString().padStart(2, '0')}`;
  const dY = wn.y + wn.h - 2;
  const dx = wn.x + ((wn.w - digital.length) >> 1);
  t.text(dx, dY, digital, ACCENT, body, true);
};

// ── Wallpaper ────────────────────────────────────────────────────────────────────
// An elegant night-sky desktop: deep indigo→twilight gradient, a soft top-left
// light bloom, slow flowing aurora bands (pure sine fields, no speckle noise), and
// a sparse deterministic twinkling starfield. All smooth — no dithered grain.
const drawWallpaper = (t: CharTerm, time: number): void => {
  const invH = 1 / Math.max(1, deskH);
  const invW = 1 / cols;
  // Light source for the bloom, drifting slowly across the upper-left.
  const lx = cols * (0.22 + 0.05 * sinT(time * 0.12));
  const ly = deskH * 0.06;
  const bloomR2 = (cols * 0.62) * (cols * 0.62);
  for (let y = 0; y < deskH; y++) {
    const v = y * invH;
    const dy = (y - ly) * 1.9; // cell aspect compensation for round bloom
    for (let x = 0; x < cols; x++) {
      const u = x * invW;
      // Base diagonal gradient: deep indigo (top) → twilight blue (bottom).
      let r = 8 + 14 * v;
      let g = 10 + 12 * v;
      let b = 26 + 34 * (1 - v);
      // Flowing aurora: ridged sine bands of teal→violet that drift and breathe.
      // Two interfering bands plus a slow swell give visible, curtain-like sheets.
      const b1 = sinT(u * 2.4 - v * 3.0 + time * 0.20);
      const b2 = sinT(u * 1.3 + v * 4.2 - time * 0.13);
      const b3 = sinT(u * 4.1 + v * 1.6 + time * 0.07);
      const band = b1 * 0.5 + b2 * 0.35 + b3 * 0.15;
      const aur = clamp01(band * 0.5 + 0.5);
      // Sharpen the ridges into filaments, then hue-shift teal→violet for depth.
      // Pool the curtain toward the lower-middle (where open desktop shows it off).
      // A faint vertical striation breaks the sheet into hanging curtains of light.
      const ridge = aur * aur * (0.65 + 0.35 * aur);
      const curtain = 0.7 + 0.3 * (0.5 + 0.5 * sinT(u * 9.0 + b2 * 1.4 + time * 0.05));
      const horizon = smoothstep(0.0, 0.45, v) * smoothstep(1.1, 0.5, v);
      const amp = ridge * curtain * (0.5 + 0.6 * horizon);
      const vio = smoothstep(0.2, 0.9, v); // top→violet, bottom→teal
      r += amp * (22 + 40 * vio);
      g += amp * (74 - 22 * vio);
      b += amp * (58 + 34 * vio);
      // Soft top-left light bloom (radial falloff, no hard edge).
      const dx = x - lx;
      const d2 = dx * dx + dy * dy;
      const glow = d2 < bloomR2 ? 1 - d2 / bloomR2 : 0;
      const gl = glow * glow * 26;
      r += gl;
      g += gl * 1.05;
      b += gl * 1.25;
      // Gentle edge vignette so the corners settle into the dark.
      const vig = 1 - 0.32 * ((u - 0.5) * (u - 0.5) + (v - 0.5) * (v - 0.5)) * 3.4;
      r *= vig;
      g *= vig;
      b *= vig;
      t.put(x, y, ' ', INK, [r, g, b]);
    }
  }
  // Sparse twinkling starfield — deterministic positions from wallJit, slow phase.
  // Only the foreground glyph changes; the gradient bg shows through (no boxes).
  const wlen = wallJit.length || 1;
  const starN = Math.min((cols * deskH) >> 6, 130);
  for (let s = 0; s < starN; s++) {
    const j = wallJit[(s * 13) % wlen];
    const j2 = wallJit[(s * 29 + 7) % wlen];
    const sx = (j * cols) | 0;
    const sy = (j2 * deskH * 0.82) | 0; // keep stars out of the very bottom
    const tw = 0.5 + 0.5 * sinT(time * 1.1 + s * 1.7);
    if (tw < 0.5) continue;
    const i = sy * cols + sx;
    // Read back the current bg so the star's colour is lifted off the gradient.
    const cur = t.background[i];
    const k = 90 + tw * 110;
    const cr = ((cur >> 16) & 255) + k;
    const cg = ((cur >> 8) & 255) + k;
    const cb = (cur & 255) + k * 1.1;
    t.put(sx, sy, tw > 0.86 ? '✦' : tw > 0.7 ? '·' : '∙', [cr, cg, cb], undefined, tw > 0.86);
  }
};

// ── Dock ─────────────────────────────────────────────────────────────────────────
const DOCK_APPS: Array<{ app: AppId; glyph: string; name: string }> = [
  { app: AppId.NOTEPAD, glyph: '✎', name: 'Notes' },
  { app: AppId.VIDEO, glyph: '▶', name: 'Player' },
  { app: AppId.CLOCK, glyph: '◷', name: 'Clock' },
];
let dockX0 = 0;
const DOCK_SLOT = 8;

const dockIconAt = (mx: number): number => {
  for (let i = 0; i < DOCK_APPS.length; i++) {
    const x = dockX0 + i * DOCK_SLOT;
    if (mx >= x && mx < x + DOCK_SLOT - 1) return DOCK_APPS[i].app;
  }
  return -1;
};

const drawDock = (t: CharTerm, time: number): void => {
  const dy = deskH;
  // Glassy dock bar.
  t.fillRect(0, dy, cols, DOCK_H, [14, 15, 22]);
  t.shadeRect(0, dy, cols, 1, 90, 130, 200, 0.12);
  t.hline(0, dy, cols, '─', [40, 46, 64], [14, 15, 22]);

  const dockW = DOCK_APPS.length * DOCK_SLOT;
  dockX0 = ((cols - dockW) >> 1) + 1;
  for (let i = 0; i < DOCK_APPS.length; i++) {
    const a = DOCK_APPS[i];
    const x = dockX0 + i * DOCK_SLOT;
    const wn = wins[a.app];
    const open = !wn.minimized && wn.appear > 0.5;
    const focused = FOCUS() === a.app && open;
    const slotBg: RGB = focused ? [34, 40, 58] : [20, 22, 32];
    t.fillRect(x, dy + 1, DOCK_SLOT - 1, 1, slotBg);
    const ic: RGB = focused ? ACCENT : open ? INK : DIM;
    t.put(x + 1, dy + 1, a.glyph, ic, slotBg, focused);
    t.text(x + 3, dy + 1, a.name, focused ? INK : DIM, slotBg);
    // running indicator dot
    if (open) t.put(x, dy + 1, '▍', focused ? ACCENT : FAINT, slotBg);
  }

  // Live clock + brand on the right of the dock (leave top-right row for FPS HUD).
  const clk = CLOCK_START + time * 60;
  const hh = Math.floor((clk / 3600) % 12) || 12;
  const mm = Math.floor((clk / 60) % 60);
  const clkStr = `${hh}:${mm.toString().padStart(2, '0')}`;
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][Math.floor((clk / 86400) % 7)];
  const right = `${day}  ${clkStr}`;
  t.text(cols - right.length - 2, dy + 1, right, INK, [14, 15, 22], true);

  // Brand on the left.
  t.text(2, dy + 1, '◉ TermOS', ACCENT, [14, 15, 22], true);
};

// ── Cursor sprite ────────────────────────────────────────────────────────────────
const drawCursor = (t: CharTerm, x: number, y: number, down: boolean): void => {
  const cx = clamp(Math.round(x), 0, cols - 1);
  const cy = clamp(Math.round(y), 0, rows - 1);
  // A soft drop-shadow under-and-right keeps the pointer legible on any background.
  // The dark backing under the glyph is adaptive: over a LIGHT surface (e.g. the
  // Notepad paper) a full-strength black backing reads as an ugly smudge, so we
  // sample the cell's current bg luminance and fade the backing toward zero as the
  // surface brightens — the white pointer still pops, without the dark hole.
  const cur = t.background[cy * cols + cx];
  const lum = (((cur >> 16) & 255) * 0.299 + ((cur >> 8) & 255) * 0.587 + (cur & 255) * 0.114) / 255;
  const back = lerp(0.45, 0.1, smoothstep(0.12, 0.42, lum));
  const side = lerp(0.22, 0.06, smoothstep(0.12, 0.42, lum));
  t.shadeRect(cx, cy, 1, 1, 0, 0, 0, back);
  if (cx + 1 < cols) t.shadeRect(cx + 1, cy, 1, 1, 0, 0, 0, side);
  if (cy + 1 < rows) t.shadeRect(cx, cy + 1, 1, 1, 0, 0, 0, side);
  t.put(cx, cy, down ? '◆' : '▶', down ? ACCENT : [255, 255, 255], undefined, true);
};

// ── Attract performance ──────────────────────────────────────────────────────────
// A scripted, looping ~22s show. All positions/typing derived from `time`.
const ATTRACT_SENTENCE =
  'Welcome to TermOS. A whole desktop, drawn in characters: draggable windows, soft shadows, a blinking caret, and a video that plays. Type anything to take control.';
const LOOP = 23.0;

const attract = (t: CharTerm, time: number): void => {
  const p = time % LOOP; // phase within the loop

  // Reset doc + windows at the start of each loop so it always types fresh.
  if (p < 0.05) {
    docText = '';
    caret = 0;
    wins[AppId.NOTEPAD].fx = 0.06;
    wins[AppId.NOTEPAD].fy = 0.16;
    layout(t);
    raise(AppId.CLOCK);
    raise(AppId.VIDEO);
    raise(AppId.NOTEPAD);
  }

  // Window appear (scale/fade) staggered in the first ~2s.
  wins[AppId.CLOCK].appear = smoothstep(0.1, 1.0, p);
  wins[AppId.VIDEO].appear = smoothstep(0.5, 1.4, p);
  wins[AppId.NOTEPAD].appear = smoothstep(0.9, 1.9, p);

  // Cursor choreography keyframes (col,row in desk space).
  type Key = { tt: number; x: number; y: number; down: boolean };
  const np = wins[AppId.NOTEPAD];
  const vd = wins[AppId.VIDEO];
  // Drag target: move notepad from start toward a tidy spot.
  const dragFromX = Math.round(0.06 * cols);
  const dragToX = Math.round(0.04 * cols);
  const npTitleY = np.y;

  const keys: Key[] = [
    { tt: 1.6, x: cols * 0.5, y: deskH * 0.5, down: false },
    { tt: 2.4, x: vd.x + 6, y: vd.y, down: false }, // glide to video title
    { tt: 2.8, x: vd.x + 6, y: vd.y, down: true }, // click to focus video
    { tt: 3.1, x: vd.x + 6, y: vd.y, down: false },
    { tt: 4.0, x: np.x + 14, y: npTitleY, down: false }, // glide to notepad title
    { tt: 4.4, x: np.x + 14, y: npTitleY, down: true }, // grab title
    { tt: 5.4, x: dragToX + 14, y: npTitleY + 2, down: true }, // drag it
    { tt: 5.7, x: dragToX + 14, y: npTitleY + 2, down: false }, // release
    { tt: 6.1, x: dragToX + 6, y: npTitleY + 4, down: false }, // into the body
    { tt: 6.4, x: dragToX + 6, y: npTitleY + 4, down: true }, // click to ensure focus
    { tt: 6.6, x: dragToX + 6, y: npTitleY + 4, down: false },
  ];

  // Find current cursor pos by interpolating keyframes.
  let kx = keys[0].x;
  let ky = keys[0].y;
  let kd = false;
  if (p <= keys[0].tt) {
    // ease in from off-screen
    const a = clamp01(p / keys[0].tt);
    kx = lerp(cols + 4, keys[0].x, smoothstep(0, 1, a));
    ky = lerp(-2, keys[0].y, smoothstep(0, 1, a));
  } else {
    for (let i = 0; i < keys.length - 1; i++) {
      const k0 = keys[i];
      const k1 = keys[i + 1];
      if (p >= k0.tt && p < k1.tt) {
        const a = smoothstep(0, 1, (p - k0.tt) / (k1.tt - k0.tt));
        kx = lerp(k0.x, k1.x, a);
        ky = lerp(k0.y, k1.y, a);
        kd = k0.down;
        break;
      }
      if (p >= keys[keys.length - 1].tt) {
        kx = keys[keys.length - 1].x;
        ky = keys[keys.length - 1].y;
        kd = false;
      }
    }
  }

  // Apply the scripted notepad drag during its window.
  if (p >= keys[5].tt && p < keys[7].tt) {
    raise(AppId.NOTEPAD);
    const a = smoothstep(0, 1, (p - keys[5].tt) / (keys[7].tt - keys[5].tt));
    np.fx = lerp(dragFromX, dragToX, a) / cols;
    np.fy = lerp(0.16, (npTitleY + 2) / deskH, a * 0.4);
    layout(t);
  }
  // Focus video briefly mid-show.
  if (p >= keys[2].tt && p < keys[4].tt) raise(AppId.VIDEO);
  if (p >= keys[9].tt) raise(AppId.NOTEPAD);

  // Smooth the visible cursor.
  curX = kx;
  curY = ky;
  curDown = kd;

  // Typing: reveal the sentence char-by-char after the drag completes.
  const typeStart = 6.8;
  const cps = 19; // chars per second
  if (p >= typeStart) {
    const n = clamp(Math.floor((p - typeStart) * cps), 0, ATTRACT_SENTENCE.length);
    docText = ATTRACT_SENTENCE.slice(0, n);
    caret = docText.length;
    // Solid caret while still typing; blink once the sentence is complete.
    caretSolid = n < ATTRACT_SENTENCE.length;
  }
};

// ── Frame ────────────────────────────────────────────────────────────────────────
let liveTime = 0;
let lastTypeTime = -1e9;
const IDLE_RESUME = 3.5; // seconds of no input → resume attract

const frame = (t: CharTerm, time: number, dt: number, _frame: number): void => {
  liveTime = time;
  if (cols !== t.columns || rows !== t.rows) layout(t);

  // Advance video clip.
  if (videoPlaying) {
    videoTime += dt;
    if (videoTime >= VIDEO_TOTAL) videoTime -= VIDEO_TOTAL;
  }

  // Input vs attract arbitration.
  handleMouse(t);
  const interacted = t.mouse.active || lastInputTime > -1e8;
  const idle = time - lastInputTime;
  const inAttract = !interacted || idle > IDLE_RESUME;

  if (inAttract) {
    attract(t, time);
  } else {
    // Live: cursor follows the real mouse.
    curX = t.mouse.x;
    curY = t.mouse.y;
    curDown = t.mouse.down;
    // Keep the caret solid for a moment after each keystroke, then blink.
    caretSolid = time - lastTypeTime < 0.5;
    // Ensure windows are fully present once the user is driving.
    for (const wn of wins) if (wn.appear < 1) wn.appear = 1;
  }

  // ── Render ──
  drawWallpaper(t, time);

  // Draw windows back→front: shadow, then frame, then app content.
  for (const app of zorder) {
    const wn = wins[app];
    if (wn.minimized || wn.appear <= 0.02) continue;
    const focused = FOCUS() === app;

    // Appear animation: a vertical "scale-in" by clipping height + fade via shade.
    const ap = clamp01(wn.appear);
    const ease = smoothstep(0, 1, ap);

    dropShadow(t, wn);
    drawWindowFrame(t, wn, focused);
    if (app === AppId.NOTEPAD) drawNotepad(t, wn, focused, time);
    else if (app === AppId.VIDEO) drawVideo(t, wn, focused, time);
    else drawClock(t, wn, focused, time);

    // Fade the whole window toward the wallpaper while it is still appearing.
    if (ease < 1) t.shadeRect(wn.x, wn.y, wn.w, wn.h, 14, 16, 34, (1 - ease) * 0.8);
  }

  drawDock(t, time);

  // Cursor on top (also in live mode for a polished pointer).
  drawCursor(t, curX, curY, curDown);
};

runText({
  title: 'TermOS — Desktop',
  hud: 'DRAG TITLE · CLICK FOCUS · TYPE IN NOTEPAD · DOCK LAUNCH',
  captureT: 9,
  targetFps: 0, // uncapped
  mouse: true,
  init,
  resize: init,
  onKey,
  frame,
});
