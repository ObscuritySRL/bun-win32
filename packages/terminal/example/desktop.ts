/**
 * desktop — a complete windowing desktop environment ("TermOS") rendered entirely in
 * the terminal on the `_textterm` character-grid engine. A real compositor: overlapping
 * draggable, resizable, maximizable windows with title bars, traffic-light buttons,
 * box-drawing borders, soft drop shadows and a focus glow, floating as translucent
 * "glass" over an animated aurora wallpaper (light rays + parallax bokeh + starfield),
 * under a top menu bar and above a magnifying dock with a live clock and app launchers.
 *
 * Seven live apps, each drawn per-cell every frame and reflowing to its window rect:
 *   • Browser   — tabs, address bar, a scrollable rendered "homepage" with block-art.
 *   • Terminal  — a real interactive Windows-style shell: type commands (dir, ver, echo,
 *                 ipconfig, neofetch, cmatrix, …) with history; the attract loop drives
 *                 the same model through an auto-typer.
 *   • Monitor   — CPU/GPU/MEM scrolling sparkline graphs + a tidy per-core meter strip.
 *   • Scene     — a real-time shaded, rotating 3D torus (per-pixel depth + lighting).
 *   • Notepad   — a real blinking caret and full text editing with soft word-wrap.
 *   • Video     — a shaded sunset "clip" behind a transport bar.
 *   • Clock     — an analog face + digital readout.
 *
 * Window management: drag the title bar to move; the bottom-right grip (◢) to resize;
 * the green light or a title double-click to maximize/restore; red sends to the dock,
 * yellow minimizes. The mouse wheel scrolls the focused browser; Tab cycles focus; the
 * keyboard routes to the focused window (the shell or the Notepad); the dock launches.
 *
 * With no input the demo runs a scripted attract performance — a synthetic cursor glides
 * in, opens and drives the browser (navigate, resize, maximize, restore), focuses the
 * terminal, drags a window and types into the Notepad — while every widget animates,
 * then loops. All motion derives from `time`; all randomness from `mulberry32`, so
 * headless `CAPTURE_PNG` captures reproduce exactly.
 */
import { CharTerm, runText } from '@bun-win32/terminal';
import type { RGB } from '@bun-win32/terminal';

import { clamp, clamp01, lerp, smoothstep, fract, TAU, hsv, mulberry32 } from './_kit';

const { abs, atan2, cos, exp, floor, hypot, max, min, round, sin, sqrt } = Math;

// ── Palette ───────────────────────────────────────────────────────────────────
const INK: RGB = [228, 230, 240];
const DIM: RGB = [120, 124, 144];
const FAINT: RGB = [78, 82, 100];
const ACCENT: RGB = [90, 170, 255]; // crisp blue accent
const ACCENT2: RGB = [196, 130, 255]; // violet secondary accent
const TITLE_ACTIVE: RGB = [40, 44, 60];
const TITLE_IDLE: RGB = [26, 28, 40];
const PANEL: RGB = [22, 24, 34];
const LIGHT_RED: RGB = [255, 95, 86];
const LIGHT_YEL: RGB = [255, 189, 46];
const LIGHT_GRN: RGB = [40, 200, 64];

// Vertical eighth-block ramp for bars, meters and graphs.
const VBLOCK = ' ▁▂▃▄▅▆▇█';

const AppId = { NOTEPAD: 0, VIDEO: 1, CLOCK: 2, BROWSER: 3, TERMINAL: 4, MONITOR: 5, SCENE: 6 } as const;
type AppId = (typeof AppId)[keyof typeof AppId];

interface Win {
  app: AppId;
  title: string;
  // Effective on-screen rect (recomputed each frame from the restore rect + maximize anim).
  x: number;
  y: number;
  w: number;
  h: number;
  // Restore rect: base position as a fraction of the desktop (for reflow on resize) plus
  // an explicit restore width/height in cells. Maximize lerps the effective rect toward full.
  fx: number;
  fy: number;
  rw: number;
  rh: number;
  minW: number;
  minH: number;
  minimized: boolean;
  maximized: boolean;
  maxAnim: number; // 0 = restored, 1 = full screen (animated)
  appear: number; // spawn / restore animation (0..1)
  scroll: number; // app-local scroll offset (browser page)
}

// ── Notepad document model (independent of terminal size) ───────────────────────
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
const MENU_H = 1; // top menu-bar row

// Interaction state (live mode).
let dragWin = -1;
let dragDX = 0;
let dragDY = 0;
let resizeWin = -1;
let lastSeq = -1;
let lastWheel = 0;
let lastClickTime = -1e9;
let lastClickApp = -1;
let lastInputTime = -1e9;
let caretBlinkBase = 0;

// Attract cursor (also the live cursor sprite position, smoothed).
let curX = 0;
let curY = 0;
let curDown = false;

// Plasma LUT (sine) shared by several widgets.
let sinLUT: Float32Array = new Float32Array(0);
const LUT_N = 2048;
const rnd = mulberry32(0x5eed1234);
let wallJit: Float32Array = new Float32Array(0);

const FOCUS = (): number => (zorder.length ? zorder[zorder.length - 1] : -1);

const sinT = (x: number): number => {
  const i = ((x * (LUT_N / TAU)) | 0) & (LUT_N - 1);
  return sinLUT[i < 0 ? i + LUT_N : i];
};

// ── Layout ──────────────────────────────────────────────────────────────────────
// Apply the restore rect (fx/fy + rw/rh) and the maximize animation to the effective
// on-screen rect. Called for every window every frame so resize / maximize reflow live.
const applyRect = (wn: Win): void => {
  const bw = clamp(wn.rw, wn.minW, max(wn.minW, cols));
  const bh = clamp(wn.rh, wn.minH, max(wn.minH, deskH - MENU_H));
  let bx = round(wn.fx * cols);
  let by = round(wn.fy * deskH);
  bx = clamp(bx, 0, max(0, cols - bw));
  by = clamp(by, MENU_H, max(MENU_H, deskH - bh));
  // Maximize target fills the desktop band between menu bar and dock.
  const fullX = 0;
  const fullY = MENU_H;
  const fullW = cols;
  const fullH = deskH - MENU_H;
  const e = smoothstep(0, 1, wn.maxAnim);
  wn.x = round(lerp(bx, fullX, e));
  wn.y = round(lerp(by, fullY, e));
  wn.w = max(wn.minW, round(lerp(bw, fullW, e)));
  wn.h = max(wn.minH, round(lerp(bh, fullH, e)));
};

const layout = (t: CharTerm): void => {
  cols = t.columns;
  rows = t.rows;
  deskH = rows - DOCK_H;
  for (const wn of wins) applyRect(wn);
};

const init = (t: CharTerm): void => {
  cols = t.columns;
  rows = t.rows;
  deskH = rows - DOCK_H;

  sinLUT = new Float32Array(LUT_N);
  for (let i = 0; i < LUT_N; i++) sinLUT[i] = Math.sin((i / LUT_N) * TAU);

  wallJit = new Float32Array(cols * rows);
  for (let i = 0; i < wallJit.length; i++) wallJit[i] = rnd();

  // Window sizes scale gently with the grid but stay legible. Each app declares a
  // floor so resize / small terminals can never break its internal layout.
  const W = (frac: number, lo: number, hi: number): number => clamp(round(cols * frac), lo, hi);
  const H = (frac: number, lo: number, hi: number): number => clamp(round(deskH * frac), lo, hi);

  const def = (app: AppId, title: string, fx: number, fy: number, rw: number, rh: number, minW: number, minH: number): Win => ({
    app,
    title,
    x: 0,
    y: 0,
    w: rw,
    h: rh,
    fx,
    fy,
    rw,
    rh,
    minW,
    minH,
    minimized: false,
    maximized: false,
    maxAnim: 0,
    appear: 0,
    scroll: 0,
  });

  // Tiled-with-overlap arrangement so the t≈9 hero frame shows every window:
  // browser top-centre, notepad/terminal down the left, video/monitor down the right,
  // the 3D torus in the bottom-centre trough, and a small clock floating top-right.
  wins = [
    def(AppId.NOTEPAD, 'Notepad — untitled.txt', 0.015, 0.04, W(0.26, 30, 44), H(0.42, 13, 19), 26, 9),
    def(AppId.VIDEO, 'Player — sunset.mov', 0.745, 0.05, W(0.24, 30, 42), H(0.36, 12, 17), 26, 9),
    def(AppId.CLOCK, 'Clock', 0.6, 0.66, 22, 12, 18, 9),
    def(AppId.BROWSER, 'TermOS Browser', 0.28, 0.04, W(0.38, 48, 66), H(0.6, 22, 30), 40, 16),
    def(AppId.TERMINAL, 'charsh — ~/termos', 0.015, 0.46, W(0.34, 42, 62), H(0.46, 14, 22), 34, 11),
    def(AppId.MONITOR, 'System Monitor', 0.745, 0.45, W(0.24, 32, 42), H(0.46, 16, 22), 28, 13),
    def(AppId.SCENE, 'Scene — torus.obj', 0.36, 0.66, W(0.24, 30, 40), H(0.3, 11, 15), 26, 11),
  ];
  // Back→front; Scene sits above the Browser's footer so the torus is never occluded,
  // the Clock floats on top, and the Browser stays the focused hero window.
  zorder = [AppId.VIDEO, AppId.MONITOR, AppId.NOTEPAD, AppId.TERMINAL, AppId.SCENE, AppId.CLOCK, AppId.BROWSER];

  docText = '';
  caret = 0;
  dragWin = -1;
  resizeWin = -1;
  lastSeq = -1;
  lastWheel = 0;
  lastInputTime = -1e9;
  curX = round(cols * 0.5);
  curY = round(deskH * 0.5);

  resetWidgets();
  layout(t);
};

// ── z-order helpers ──────────────────────────────────────────────────────────────
const raise = (app: number): void => {
  const k = zorder.indexOf(app);
  if (k >= 0) zorder.splice(k, 1);
  zorder.push(app);
};

const toggleMaximize = (wn: Win): void => {
  wn.maximized = !wn.maximized;
};

// ── Notepad editing ──────────────────────────────────────────────────────────────
const wrapLines: string[] = [];
const wrapStart: number[] = [];
let caretLine = 0;
let caretCol = 0;

const rewrap = (innerW: number): void => {
  wrapLines.length = 0;
  wrapStart.length = 0;
  caretLine = 0;
  caretCol = 0;
  const W = max(1, innerW);
  let lineStart = 0;
  const pushWrapped = (segStart: number, seg: string): void => {
    if (seg.length === 0) {
      wrapStart.push(segStart);
      wrapLines.push('');
      return;
    }
    let i = 0;
    while (i < seg.length) {
      let end = min(seg.length, i + W);
      if (end < seg.length) {
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

const onKey = (key: string, _t: CharTerm): void => {
  lastInputTime = liveTime;
  caretBlinkBase = liveTime;
  lastTypeTime = liveTime;
  // Tab cycles window focus from anywhere (so the keyboard can reach the terminal).
  if (key === 'tab') {
    raise(zorder[0]);
    return;
  }
  const focus = FOCUS();
  // Focused terminal gets the keystroke as shell input.
  if (focus === AppId.TERMINAL && !wins[AppId.TERMINAL].minimized) {
    termKey(key);
    return;
  }
  // Otherwise the keyboard drives the Notepad (typing focuses it).
  if (focus !== AppId.NOTEPAD) {
    wins[AppId.NOTEPAD].minimized = false;
    if (wins[AppId.NOTEPAD].appear < 1) wins[AppId.NOTEPAD].appear = 1;
    raise(AppId.NOTEPAD);
  }
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
    moveCaretVertical(key === 'up' ? -1 : 1);
  }
};

const moveCaretVertical = (dir: number): void => {
  const wn = wins[AppId.NOTEPAD];
  const innerW = wn.w - 4;
  rewrap(innerW);
  const target = caretLine + dir;
  if (target < 0 || target >= wrapLines.length) return;
  const col = min(caretCol, wrapLines[target].length);
  caret = wrapStart[target] + col;
};

// ── Mouse handling (live) ────────────────────────────────────────────────────────
// Title-bar hit test → button id (0 close, 1 min, 2 maximize), -2 draggable body, -3 none.
const titleButtonAt = (wn: Win, mx: number, my: number): number => {
  if (my !== wn.y) return -3;
  if (mx === wn.x + 2) return 0;
  if (mx === wn.x + 4) return 1;
  if (mx === wn.x + 6) return 2;
  if (mx >= wn.x && mx < wn.x + wn.w) return -2;
  return -3;
};

const cornerAt = (wn: Win, mx: number, my: number): boolean => mx >= wn.x + wn.w - 2 && mx < wn.x + wn.w && my === wn.y + wn.h - 1;

const handleMouse = (t: CharTerm): void => {
  // Mouse wheel scrolls the focused browser page (independent of click sequence).
  if (t.mouse.wheel !== lastWheel) {
    const delta = t.mouse.wheel - lastWheel;
    lastWheel = t.mouse.wheel;
    lastInputTime = liveTime;
    if (FOCUS() === AppId.BROWSER) wins[AppId.BROWSER].scroll = max(0, wins[AppId.BROWSER].scroll - delta * 2);
  }
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

  if (t.mouse.down && dragWin < 0 && resizeWin < 0) {
    for (let z = zorder.length - 1; z >= 0; z--) {
      const app = zorder[z];
      const wn = wins[app];
      if (wn.minimized) continue;
      if (mx >= wn.x && mx < wn.x + wn.w && my >= wn.y && my < wn.y + wn.h) {
        raise(app);
        // Resize grip in the bottom-right corner.
        if (!wn.maximized && cornerAt(wn, mx, my)) {
          resizeWin = app;
          break;
        }
        const btn = titleButtonAt(wn, mx, my);
        if (btn === 0) {
          wn.minimized = true; // close → dock (restorable)
        } else if (btn === 1) {
          wn.minimized = true; // minimize
        } else if (btn === 2) {
          toggleMaximize(wn); // green → maximize / restore
        } else if (btn === -2) {
          // Double-click the title bar also maximizes.
          if (lastClickApp === app && liveTime - lastClickTime < 0.4) {
            toggleMaximize(wn);
          } else if (!wn.maximized) {
            dragWin = app;
            dragDX = mx - wn.x;
            dragDY = my - wn.y;
          }
          lastClickTime = liveTime;
          lastClickApp = app;
        }
        break;
      }
    }
  } else if (t.mouse.down && resizeWin >= 0) {
    const wn = wins[resizeWin];
    wn.rw = clamp(mx - wn.x + 1, wn.minW, cols);
    wn.rh = clamp(my - wn.y + 1, wn.minH, deskH - wn.y);
  } else if (t.mouse.down && dragWin >= 0) {
    const wn = wins[dragWin];
    const nx = clamp(mx - dragDX, 0, max(0, cols - wn.w));
    const ny = clamp(my - dragDY, MENU_H, deskH - 2);
    wn.fx = nx / cols;
    wn.fy = ny / deskH;
  } else if (!t.mouse.down) {
    dragWin = -1;
    resizeWin = -1;
  }
};

// ── Drop shadow ─────────────────────────────────────────────────────────────────
const SHADOW_PAD = 3;
const dropShadow = (t: CharTerm, wn: Win): void => {
  const x0 = wn.x;
  const y0 = wn.y;
  const x1 = wn.x + wn.w;
  const y1 = wn.y + wn.h;
  const sx0 = max(0, x0 - 1);
  const sy0 = max(MENU_H, y0 - 1);
  const sx1 = min(cols, x1 + SHADOW_PAD + 1);
  const sy1 = min(deskH, y1 + SHADOW_PAD + 1);
  for (let sy = sy0; sy < sy1; sy++) {
    for (let sx = sx0; sx < sx1; sx++) {
      if (sx >= x0 && sx < x1 && sy >= y0 && sy < y1) continue;
      const ddx = sx < x0 ? x0 - sx : sx >= x1 ? sx - x1 + 1 : 0;
      const ddy = sy < y0 ? y0 - sy : sy >= y1 ? sy - y1 + 1 : 0;
      const offx = sx >= x1 ? 0 : sx < x0 ? 1.6 : 0;
      const offy = sy >= y1 ? 0 : sy < y0 ? 1.6 : 0;
      const dist = sqrt(ddx * ddx * 0.55 + ddy * ddy * 1.1) + offx + offy;
      const a = (1 - dist / (SHADOW_PAD + 1.2)) * 0.5;
      if (a > 0.02) t.shadeRect(sx, sy, 1, 1, 0, 0, 0, a);
    }
  }
};

// ── Window chrome ───────────────────────────────────────────────────────────────
// Translucent "glass" body: blend the live wallpaper behind the window toward a dark
// tint so the aurora faintly bleeds through. Opaque-screen apps paint over this later.
const glassBody = (t: CharTerm, wn: Win, focused: boolean): void => {
  const r = focused ? 24 : 17;
  const g = focused ? 26 : 18;
  const b = focused ? 38 : 26;
  t.shadeRect(wn.x, wn.y + 1, wn.w, wn.h - 1, r, g, b, focused ? 0.82 : 0.88);
};

const drawTitleBar = (t: CharTerm, wn: Win, focused: boolean): void => {
  const barBg = focused ? TITLE_ACTIVE : TITLE_IDLE;
  t.fillRect(wn.x, wn.y, wn.w, 1, barBg);
  if (focused) {
    const grad = wn.w;
    for (let i = 0; i < grad; i++) {
      const k = 1 - i / grad;
      t.shadeRect(wn.x + i, wn.y, 1, 1, 46, 86, 152, 0.1 + 0.16 * k);
    }
  }
  t.put(wn.x, wn.y, '╭', focused ? [110, 140, 190] : [54, 58, 76], undefined);
  if (focused) t.shadeRect(wn.x + 1, wn.y, 7, 1, 60, 70, 90, 0.25);
  t.put(wn.x + 2, wn.y, '●', focused ? LIGHT_RED : FAINT, undefined, focused);
  t.put(wn.x + 4, wn.y, '●', focused ? LIGHT_YEL : FAINT, undefined, focused);
  t.put(wn.x + 6, wn.y, wn.maximized ? '◉' : '●', focused ? LIGHT_GRN : FAINT, undefined, focused);
  const tcol: RGB = focused ? INK : DIM;
  const maxTitle = wn.w - 10;
  let title = wn.title;
  if (title.length > maxTitle) title = title.slice(0, max(0, maxTitle - 1)) + '…';
  t.text(wn.x + 9, wn.y, title, tcol, undefined, focused);
  if (focused) {
    t.put(wn.x + wn.w - 1, wn.y, '╮', ACCENT, undefined);
    t.put(wn.x + 8, wn.y, '▏', [80, 130, 200], undefined);
  }
};

const drawWindowFrame = (t: CharTerm, wn: Win, focused: boolean): void => {
  glassBody(t, wn, focused);
  const bcol: RGB = focused ? [70, 96, 140] : [44, 48, 62];
  // Border sides + bottom, drawn without a fill so the glass shows through.
  const bottom = wn.y + wn.h - 1;
  t.vline(wn.x, wn.y + 1, wn.h - 1, '│', bcol);
  t.vline(wn.x + wn.w - 1, wn.y + 1, wn.h - 1, '│', bcol);
  t.hline(wn.x, bottom, wn.w, '─', bcol);
  t.put(wn.x, bottom, '╰', bcol);
  t.put(wn.x + wn.w - 1, bottom, '╯', bcol);
  drawTitleBar(t, wn, focused);
  // Resize grip in the bottom-right corner (focused windows only, not maximized).
  if (focused && !wn.maximized) t.put(wn.x + wn.w - 1, bottom, '◢', [120, 150, 200], undefined, true);
};

// ── App: Notepad ─────────────────────────────────────────────────────────────────
const drawNotepad = (t: CharTerm, wn: Win, focused: boolean, time: number): void => {
  const innerX = wn.x + 2;
  const innerY = wn.y + 2;
  const innerW = wn.w - 4;
  const innerH = wn.h - 4;
  rewrap(innerW);

  let top = 0;
  if (caretLine >= innerH) top = caretLine - innerH + 1;

  const body: RGB = focused ? [24, 26, 36] : [18, 19, 27];
  t.fillRect(innerX - 1, innerY, innerW + 2, innerH, body);
  const rule: RGB = focused ? [30, 33, 46] : [22, 24, 33];
  for (let row = 0; row < innerH; row++) t.hline(innerX + 3, innerY + row, innerW - 3, '┄', rule, body);
  t.vline(innerX - 1, innerY, innerH, '▏', [70, 120, 190], body);
  t.vline(innerX + 2, innerY, innerH, '▕', focused ? [44, 50, 70] : [32, 36, 50], body);

  const curRow = caretLine - top;
  for (let row = 0; row < innerH; row++) {
    const l = top + row;
    if (focused && row === curRow) t.shadeRect(innerX - 1, innerY + row, innerW + 2, 1, 60, 90, 150, 0.14);
    if (l >= wrapLines.length) continue;
    const lineNo = (l + 1).toString().padStart(2);
    const onCur = focused && row === curRow;
    t.text(innerX, innerY + row, lineNo, onCur ? [120, 160, 215] : FAINT, undefined, onCur);
    t.text(innerX + 3, innerY + row, wrapLines[l], INK, undefined);
  }

  if (docText.length === 0 && innerH >= 3) {
    const hint = 'start typing…';
    const hx = innerX + 3 + max(0, (innerW - 3 - hint.length) >> 1);
    const hy = innerY + (innerH >> 1);
    t.text(hx, hy, hint, focused ? [70, 80, 104] : [50, 56, 74], undefined);
  }

  const blink = floor((time - caretBlinkBase) * 2.2) % 2 === 0;
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

  const stY = wn.y + wn.h - 1;
  const words = docText.trim().length ? docText.trim().split(/\s+/).length : 0;
  const status = ` Ln ${caretLine + 1}  Col ${caretCol + 1}  ${docText.length} chars  ${words} words `;
  t.fillRect(wn.x + 1, stY, wn.w - 2, 1, [16, 17, 24]);
  t.text(wn.x + 2, stY, status.length > wn.w - 4 ? status.slice(0, wn.w - 4) : status, DIM, [16, 17, 24]);
};

// ── App: Video player (a shaded sunset "clip") ────────────────────────────────────
const RAMP = ' .·:-=+*#%@';
let videoTime = 0;
let videoPlaying = true;
const VIDEO_TOTAL = 24;

const drawVideo = (t: CharTerm, wn: Win, focused: boolean): void => {
  const innerX = wn.x + 1;
  const innerY = wn.y + 2;
  const innerW = wn.w - 2;
  const innerH = wn.h - 5;
  t.fillRect(innerX, innerY, innerW, innerH, [5, 5, 10]);

  const ph = videoTime;
  const horizon = round(innerH * 0.5);
  const arc = fract(ph / VIDEO_TOTAL);
  const sunX = innerW * (0.18 + 0.64 * arc);
  const sunY = horizon - innerH * (0.26 * sin(arc * Math.PI) - 0.02);
  const sunR = max(2.4, innerW * 0.1);
  const aspY = 1.6;
  const invW = 1 / max(1, innerW);
  const RN = RAMP.length - 1;
  const SKY_DARK = [10, 14, 40];
  const SKY_DUSK = [60, 34, 78];
  const SKY_WARM = [235, 138, 56];
  const SUN_CORE = [255, 234, 168];
  const skyCol = (warm: number, out: number[]): void => {
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
  const SEA_DARK = [8, 12, 34];
  const SEA_GLINT = [255, 196, 96];
  const col: number[] = [0, 0, 0];

  for (let y = 0; y < innerH; y++) {
    const sky = y < horizon;
    const scan = y & 1 ? 0.92 : 1.0;
    const vSky = horizon > 0 ? y / horizon : 0;
    const seaH = max(1, innerH - horizon);
    const vSea = (y - horizon) / seaH;
    const dyS = (y - sunY) * aspY;
    for (let x = 0; x < innerW; x++) {
      let lum: number;
      let warm: number;
      if (sky) {
        const grad = vSky * vSky;
        const dxs = (x - sunX) / sunR;
        const dd = dxs * dxs + (dyS / sunR) * (dyS / sunR);
        const disc = dd < 1.0 ? smoothstep(1.0, 0.55, dd) : 0;
        const halo = exp(-dd * 1.1);
        const cloud = smoothstep(0.6, 0.95, 0.5 + 0.5 * sinT(y * 1.5 - ph * 0.5)) * 0.4 * halo;
        lum = clamp01(0.04 + 0.16 * grad + 1.0 * disc + 0.55 * halo - cloud);
        warm = clamp01(disc + halo * 0.85 + grad * 0.45);
        skyCol(warm, col);
      } else {
        const reflectX = abs(x - sunX);
        const colW = sunR * (0.5 + 0.85 * vSea);
        const inCol = reflectX < colW ? 1 - reflectX / colW : 0;
        const ripple = 0.5 + 0.5 * sinT(y * 2.0 - ph * 3.0 + sinT(x * 0.5) * 1.6);
        const glint = inCol * inCol * (0.3 + 0.7 * ripple) * (1 - vSea * 0.3);
        const swell = 0.5 + 0.5 * sinT(x * 0.45 + y * 0.9 - ph * 1.8);
        const water = 0.035 * swell * (1 - vSea * 0.6);
        lum = clamp01(water + 0.95 * glint);
        warm = clamp01(glint * 2);
        col[0] = SEA_DARK[0] + (SEA_GLINT[0] - SEA_DARK[0]) * warm;
        col[1] = SEA_DARK[1] + (SEA_GLINT[1] - SEA_DARK[1]) * warm;
        col[2] = SEA_DARK[2] + (SEA_GLINT[2] - SEA_DARK[2]) * warm;
      }
      const u = (x - innerW * 0.5) * invW;
      const vig = 1 - 0.42 * (u * u * 2.0 + (sky ? 0 : 0.1));
      const val = clamp01(lum * vig) * scan;
      const ri = (val * RN + 0.5) | 0;
      const ch = RAMP[ri > RN ? RN : ri];
      const fgv = 0.45 + 0.55 * val;
      t.put(innerX + x, innerY + y, ch, [col[0] * fgv, col[1] * fgv, col[2] * fgv], [col[0] * 0.16 + 3, col[1] * 0.16 + 3, col[2] * 0.16 + 6]);
    }
  }
  if (horizon > 0 && horizon < innerH) {
    for (let x = 0; x < innerW; x++) {
      const near = clamp01(1 - abs(x - sunX) / (sunR * 2.4));
      t.put(innerX + x, innerY + horizon, near > 0.35 ? '━' : '─', [lerp(40, 255, near), lerp(46, 188, near), lerp(86, 110, near)], undefined, near > 0.5);
    }
  }

  const tbY = wn.y + wn.h - 2;
  const barBg: RGB = focused ? [20, 22, 32] : [16, 17, 24];
  t.fillRect(wn.x + 1, tbY, wn.w - 2, 2, barBg);
  t.put(wn.x + 2, tbY, videoPlaying ? '▶' : '⏸', ACCENT, barBg, true);
  const elapsed = fmtTime(videoTime);
  const total = fmtTime(VIDEO_TOTAL);
  t.text(wn.x + 4, tbY, elapsed, INK, barBg);
  const totX = wn.x + wn.w - 2 - total.length;
  t.text(totX, tbY, total, DIM, barBg);
  const trkX = wn.x + 4 + elapsed.length + 1;
  const trkW = max(2, totX - 1 - trkX);
  t.hline(trkX, tbY + 1, trkW, '─', FAINT, barBg);
  const frac = clamp01(videoTime / VIDEO_TOTAL);
  const fillW = round(trkW * frac);
  for (let i = 0; i < fillW; i++) t.put(trkX + i, tbY + 1, '━', ACCENT, barBg);
  t.put(trkX + min(trkW - 1, fillW), tbY + 1, '●', [255, 255, 255], barBg, true);
};

const fmtTime = (s: number): string => {
  const m = floor(s / 60);
  const ss = floor(s % 60);
  return `${m}:${ss.toString().padStart(2, '0')}`;
};

// ── App: Clock (analog + digital) ────────────────────────────────────────────────
const CLOCK_START = 10 * 3600 + 8 * 60 + 30; // 10:08:30
const drawClock = (t: CharTerm, wn: Win, focused: boolean, time: number): void => {
  const innerX = wn.x + 1;
  const innerY = wn.y + 2;
  const innerW = wn.w - 2;
  const innerH = wn.h - 4;
  const body: RGB = focused ? [20, 22, 32] : [16, 17, 24];
  t.fillRect(innerX, innerY, innerW, innerH, body);

  const clk = CLOCK_START + time * 60;
  const secAng = (clk % 60) / 60;
  const minAng = ((clk / 60) % 60) / 60;
  const hourAng = ((clk / 3600) % 12) / 12;

  const faceY0 = innerY;
  const faceY1 = wn.y + wn.h - 2;
  const cxp = innerX + innerW * 0.5;
  const cyp = (faceY0 + faceY1) * 0.5 - 0.5;
  const asp = 0.5;
  const rad = min(innerW * 0.5 - 1.0, ((faceY1 - faceY0) * 0.5 - 0.5) / asp) - 0.2;

  for (let yy = innerY; yy < innerY + innerH; yy++) {
    for (let xx = innerX; xx < innerX + innerW; xx++) {
      const dx = (xx - cxp) / rad;
      const dy = (yy - cyp) / (rad * asp);
      const rr = sqrt(dx * dx + dy * dy);
      if (rr > 1.02) continue;
      const lift = (1 - rr) * (1 - rr);
      const sheen = clamp01(0.5 - (dx + dy) * 0.5);
      t.shadeRect(xx, yy, 1, 1, 30, 42, 70, 0.1 + 0.2 * lift + 0.1 * sheen * lift);
    }
  }
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * TAU - TAU / 4;
    const hour = i % 5 === 0;
    const tr = rad * (hour ? 0.96 : 0.99);
    const tx = round(cxp + cos(a) * tr);
    const ty = round(cyp + sin(a) * tr * asp);
    if (hour) t.put(tx, ty, i % 15 === 0 ? '◆' : '•', i % 15 === 0 ? ACCENT : [150, 175, 215], undefined, true);
    else t.put(tx, ty, '·', focused ? [62, 78, 110] : [46, 54, 74], undefined);
  }
  const slopeGlyph = (dx: number, dy: number, heavy: boolean): string => {
    const ax = abs(dx);
    const ay = abs(dy) * 2;
    if (ax > ay * 2.2) return heavy ? '━' : '─';
    if (ay > ax * 2.2) return '│';
    return dx * dy < 0 ? '/' : '\\';
  };
  const drawHand = (frac: number, len: number, hcol: RGB, opts: { bold?: boolean; taper?: boolean; thick?: boolean } = {}): void => {
    const { bold = false, taper = false, thick = false } = opts;
    const a = frac * TAU - TAU / 4;
    const ex = cos(a);
    const ey = sin(a);
    const g = slopeGlyph(ex, ey, thick);
    const plen = hypot(ex, ey * asp) || 1;
    const pxn = (-ey * asp) / plen;
    const pyn = ex / plen;
    const steps = max(3, round(len * 2.4));
    let lpx = -999;
    let lpy = -999;
    for (let s = 1; s <= steps; s++) {
      const rr = (s / steps) * len;
      const hx = round(cxp + ex * rr);
      const hy = round(cyp + ey * rr * asp);
      if (hx === lpx && hy === lpy) continue;
      lpx = hx;
      lpy = hy;
      const k = taper ? 0.62 + 0.38 * (1 - s / steps) : 1;
      t.put(hx, hy, g, [hcol[0] * k, hcol[1] * k, hcol[2] * k], undefined, bold);
      if (thick && s < steps * 0.7) {
        const ox1 = round(cxp + ex * rr + pxn);
        const oy1 = round(cyp + ey * rr * asp + pyn * asp);
        const ox2 = round(cxp + ex * rr - pxn);
        const oy2 = round(cyp + ey * rr * asp - pyn * asp);
        const fc: RGB = [hcol[0] * 0.82, hcol[1] * 0.82, hcol[2] * 0.82];
        if (ox1 !== hx || oy1 !== hy) t.put(ox1, oy1, g, fc, undefined, bold);
        if (ox2 !== hx || oy2 !== hy) t.put(ox2, oy2, g, fc, undefined, bold);
      }
    }
  };
  drawHand(hourAng, rad * 0.45, [238, 242, 255], { bold: true, thick: true });
  drawHand(minAng, rad * 0.92, [150, 190, 250], { bold: true });
  drawHand(secAng, rad * 1.0, LIGHT_RED, { taper: true });
  t.put(round(cxp), round(cyp), '◉', ACCENT, undefined, true);

  const hh = floor((clk / 3600) % 12) || 12;
  const mm = floor((clk / 60) % 60);
  const sscc = floor(clk % 60);
  const digital = `${hh.toString().padStart(2)}:${mm.toString().padStart(2, '0')}:${sscc.toString().padStart(2, '0')}`;
  const dY = wn.y + wn.h - 2;
  const dx = wn.x + ((wn.w - digital.length) >> 1);
  t.text(dx, dY, digital, ACCENT, body, true);
};

// ── App: Browser (the centerpiece) ────────────────────────────────────────────────
// A faux browser with chrome (tabs + toolbar + address bar) and a scrollable rendered
// "homepage" drawn block by block. The page is taller than the viewport; `wn.scroll`
// (auto-advanced in attract, wheel-driven live) pans it. Everything reflows to width.
let browserNav = 1e9; // time the current navigation started (for the progress sweep)
const BROWSER_TABS = ['● TermOS', 'Gallery', 'Docs'];

const drawBrowser = (t: CharTerm, wn: Win, focused: boolean, time: number): void => {
  const x = wn.x;
  const top = wn.y + 1;
  const w = wn.w;
  // Chrome rows: tab strip (1), toolbar (1), then the page viewport.
  const tabsY = top;
  const barY = top + 1;
  const vpX = x + 1;
  const vpY = barY + 1;
  const vpW = w - 2;
  const vpH = wn.y + wn.h - 1 - vpY;

  // Tab strip.
  t.fillRect(x, tabsY, w, 1, [18, 20, 30]);
  let tx = x + 1;
  for (let i = 0; i < BROWSER_TABS.length; i++) {
    const active = i === 0;
    const label = ` ${BROWSER_TABS[i]} `;
    const tw = label.length + 2;
    if (tx + tw > x + w - 3) break;
    t.fillRect(tx, tabsY, tw, 1, active ? [30, 33, 48] : [20, 22, 32]);
    t.text(tx + 1, tabsY, label, active ? INK : DIM, active ? [30, 33, 48] : [20, 22, 32], active);
    if (active) t.put(tx, tabsY, '▏', ACCENT, [30, 33, 48]);
    t.put(tx + tw - 1, tabsY, '×', FAINT, active ? [30, 33, 48] : [20, 22, 32]);
    tx += tw;
  }
  t.put(x + w - 2, tabsY, '+', DIM, [18, 20, 30]);

  // Toolbar: back / forward / reload + address pill + star / menu.
  t.fillRect(x, barY, w, 1, [26, 28, 40]);
  t.text(x + 1, barY, '◀ ▶ ⟳', [150, 165, 200], [26, 28, 40]);
  const pillX = x + 8;
  const pillW = w - 8 - 6;
  t.fillRect(pillX, barY, pillW, 1, [16, 18, 28]);
  t.put(pillX + 1, barY, '⌐', [120, 220, 150], [16, 18, 28]);
  const navAge = time - browserNav;
  const url = navAge < 0.6 ? 'https://termos.dev/home' : 'https://termos.dev';
  t.text(pillX + 3, barY, url, navAge < 0.6 ? [150, 160, 180] : INK, [16, 18, 28]);
  t.text(x + w - 5, barY, '☆ ⋮', DIM, [26, 28, 40]);

  // The page viewport itself (opaque off-white-on-dark "render surface").
  t.fillRect(vpX, vpY, vpW, vpH, [16, 17, 26]);

  // Navigation progress sweep across the top of the viewport.
  if (navAge >= 0 && navAge < 1.0) {
    const prog = navAge / 1.0;
    const fillW = round(vpW * prog);
    for (let i = 0; i < fillW; i++) {
      const k = 1 - i / max(1, fillW);
      t.put(vpX + i, vpY, '▁', [lerp(60, 120, k), lerp(140, 200, k), 255], [16, 17, 26]);
    }
  }

  // ── Page content. Draw with a page-space cursor `py`; only rows inside the viewport
  // are emitted (clipped + scrolled by wn.scroll).
  const scroll = floor(wn.scroll);
  const innerW = vpW - 2;
  const px = vpX + 1;
  const rowVisible = (py: number): boolean => py - scroll >= 0 && py - scroll < vpH;
  const sy = (py: number): number => vpY + (py - scroll);
  const ptext = (py: number, cx: number, s: string, fg: RGB, bold = false): void => {
    if (rowVisible(py)) t.text(px + cx, sy(py), s, fg, undefined, bold);
  };
  const pfill = (py: number, cx: number, ww: number, c: RGB): void => {
    if (rowVisible(py)) t.fillRect(px + cx, sy(py), ww, 1, c);
  };

  let py = 0;
  // Hero banner: a horizontal gradient block with the wordmark + tagline overlaid.
  const heroH = 5;
  for (let r = 0; r < heroH; r++) {
    if (!rowVisible(py + r)) continue;
    for (let cx = 0; cx < innerW; cx++) {
      const u = cx / max(1, innerW - 1);
      const v = r / max(1, heroH - 1);
      const wave = 0.5 + 0.5 * sinT(u * 4 + v * 2 + time * 0.6);
      const rr = lerp(28, 90, u) + wave * 26;
      const gg = lerp(30, 60, 1 - u) + wave * 20;
      const bb = lerp(70, 150, u) + wave * 40;
      t.put(px + cx, sy(py + r), ' ', INK, [rr, gg, bb]);
    }
  }
  if (rowVisible(py + 1)) t.text(px + 2, sy(py + 1), 'TermOS', [255, 255, 255], undefined, true);
  if (rowVisible(py + 2)) t.text(px + 2, sy(py + 2), 'the desktop that lives in your terminal', [225, 230, 245]);
  if (rowVisible(py + 3)) t.text(px + 2, sy(py + 3), '▔▔▔▔▔▔', ACCENT);
  py += heroH + 1;

  ptext(py, 1, 'A whole compositor — windows, shadows, glass — in pure', [205, 210, 225]);
  py += 1;
  ptext(py, 1, 'TypeScript, drawn one character cell at a time.', [205, 210, 225]);
  py += 2;

  // Link row.
  const links = ['Download', 'Docs', 'GitHub', 'Gallery'];
  let lx = 1;
  for (const link of links) {
    ptext(py, lx, link, ACCENT, true);
    lx += link.length + 3;
  }
  // underline the links
  if (rowVisible(py + 1)) {
    let ux = 1;
    for (const link of links) {
      t.text(px + ux, sy(py + 1), '‾'.repeat(link.length), [60, 110, 170]);
      ux += link.length + 3;
    }
  }
  py += 3;

  // Pill buttons.
  const btnA = ' Get TermOS ';
  const btnB = ' Live Demo ';
  pfill(py, 1, btnA.length, ACCENT);
  ptext(py, 1, btnA, [10, 14, 24], true);
  pfill(py, btnA.length + 2, btnB.length, [30, 34, 50]);
  ptext(py, btnA.length + 2, btnB, INK);
  py += 2;

  // Card row: three feature cards.
  const cards: Array<[string, string]> = [
    ['Truecolor', '24-bit per cell'],
    ['60+ FPS', 'diffed frames'],
    ['Zero deps', 'just Bun + FFI'],
  ];
  const cardW = floor((innerW - 2) / 3);
  const cardH = 4;
  for (let r = 0; r < cardH; r++) {
    if (!rowVisible(py + r)) continue;
    for (let c = 0; c < 3; c++) {
      const cx0 = 1 + c * (cardW + 1);
      t.fillRect(px + cx0, sy(py + r), cardW, 1, [24, 27, 40]);
      if (r === 0) {
        t.put(px + cx0, sy(py + r), '╭', [60, 80, 120], [24, 27, 40]);
        t.put(px + cx0 + cardW - 1, sy(py + r), '╮', [60, 80, 120], [24, 27, 40]);
      } else if (r === cardH - 1) {
        t.put(px + cx0, sy(py + r), '╰', [60, 80, 120], [24, 27, 40]);
        t.put(px + cx0 + cardW - 1, sy(py + r), '╯', [60, 80, 120], [24, 27, 40]);
      }
      if (r === 1) t.text(px + cx0 + 2, sy(py + r), cards[c][0], INK, [24, 27, 40], true);
      if (r === 2) t.text(px + cx0 + 2, sy(py + r), cards[c][1], DIM, [24, 27, 40]);
    }
  }
  py += cardH + 1;

  // Inline "image": a block-art ridge-line landscape under a gradient sky.
  ptext(py, 1, 'Featured render', [150, 160, 180]);
  py += 1;
  const imgH = 6;
  for (let r = 0; r < imgH; r++) {
    if (!rowVisible(py + r)) continue;
    for (let cx = 0; cx < innerW; cx++) {
      const u = cx / max(1, innerW - 1);
      const ridge = 0.55 + 0.32 * sinT(u * 7 + 1.3) + 0.12 * sinT(u * 19 + 4.1);
      const horizonR = ridge * imgH;
      const below = r >= imgH - horizonR;
      if (below) {
        const k = (r - (imgH - horizonR)) / max(1, horizonR);
        t.put(px + cx, sy(py + r), '█', [lerp(20, 8, k), lerp(40, 16, k), lerp(70, 30, k)]);
      } else {
        const v = r / imgH;
        const sun = clamp01(1 - hypot((u - 0.7) * innerW * 0.12, (v - 0.2) * 3));
        const rr = lerp(40, 250, v) + sun * 120;
        const gg = lerp(36, 150, v) + sun * 90;
        const bb = lerp(90, 120, v) + sun * 40;
        t.put(px + cx, sy(py + r), ' ', INK, [rr, gg, bb]);
      }
    }
  }
  py += imgH + 1;

  // Code snippet block — "it really is just TypeScript".
  ptext(py, 1, 'Two lines to a 60fps frame:', [150, 160, 180]);
  py += 1;
  const code: Array<[string, RGB]> = [
    ['  const t = new CharTerm(160, 50);', [150, 200, 240]],
    ['  t.put(x, y, "█", [r, g, b]); t.present();', [190, 220, 250]],
  ];
  for (const [c, col] of code) {
    pfill(py, 1, innerW - 2, [12, 14, 22]);
    ptext(py, 2, c, col);
    py += 1;
  }
  py += 1;

  // Stats band: three big numbers across a tinted strip.
  const stats: Array<[string, string]> = [
    ['7', 'live apps'],
    ['100%', 'TypeScript'],
    ['0', 'dependencies'],
  ];
  const bandH = 3;
  for (let r = 0; r < bandH; r++) pfill(py + r, 1, innerW - 2, [20, 24, 40]);
  const colW = floor((innerW - 2) / 3);
  for (let s2 = 0; s2 < 3; s2++) {
    const cx0 = 1 + s2 * colW + ((colW - stats[s2][0].length) >> 1);
    ptext(py, cx0, stats[s2][0], ACCENT, true);
    const lx2 = 1 + s2 * colW + ((colW - stats[s2][1].length) >> 1);
    ptext(py + 1, lx2, stats[s2][1], DIM);
  }
  py += bandH + 1;

  ptext(py, 1, '© 2026 TermOS · made of characters', FAINT);
  py += 2;

  const pageH = py;

  // Auto-advance the scroll target in attract (handled in attract()), clamp here.
  wn.scroll = clamp(wn.scroll, 0, max(0, pageH - vpH));

  // Scrollbar.
  if (pageH > vpH) {
    const trackH = vpH;
    const thumb = max(1, round((vpH / pageH) * trackH));
    const ty = round((wn.scroll / max(1, pageH - vpH)) * (trackH - thumb));
    for (let i = 0; i < trackH; i++) {
      const on = i >= ty && i < ty + thumb;
      t.put(vpX + vpW - 1, vpY + i, on ? '█' : '│', on ? [80, 110, 160] : [40, 44, 60], [16, 17, 26]);
    }
  }
  void focused;
};

// ── App: Terminal (a real interactive Windows-style shell) ─────────────────────────
// A live command line: keystrokes route here when the window is focused; Enter runs the
// command against a small built-in executor that appends styled lines to a scrollback
// buffer. Up/Down recall history. The attract loop drives the very same model through an
// auto-typer, so the scripted demo and the interactive shell share one code path.
const TERM_LOGO = ['  ╺┳╸┏━┓┏━┓┏┳┓┏━┓┏━┓', '   ┃ ┣╸ ┣┳┛┃┃┃┃ ┃┗━┓', '   ╹ ┗━┛╹┗╸╹ ╹┗━┛┗━┛'];
const T_GRN: RGB = [90, 230, 140];
const T_DGRN: RGB = [38, 120, 74];
const T_CYAN: RGB = [120, 210, 235];
const T_GREY: RGB = [150, 156, 172];
const T_WARN: RGB = [255, 150, 90];
const T_PROMPT: RGB = [120, 170, 225];

interface Span {
  s: string;
  c: RGB;
  b: boolean;
}
const sp = (s: string, c: RGB, b = false): Span => ({ s, c, b });

let termLines: Span[][] = [];
let termInput = '';
let termCwd = 'C:\\Users\\termos';
let termHistory: string[] = [];
let termHistPos = 0;
let matrixUntil = -1; // liveTime until which the cmatrix rain plays
// Attract auto-typer state.
const ATTRACT_SCRIPT = ['neofetch', 'ver', 'dir', 'echo hello from TypeScript', 'cmatrix'];
let autoIdx = 0;
let autoChars = 0;
let autoWait = 0;
let autoDone = false;

const termPush = (spans: Span[]): void => {
  termLines.push(spans);
  if (termLines.length > 400) termLines.splice(0, termLines.length - 400);
};
const termOut = (s: string, c: RGB = INK, b = false): void => termPush([sp(s, c, b)]);

const termTimeStr = (): string => {
  const clk = CLOCK_START + liveTime * 60;
  const hh = floor((clk / 3600) % 24);
  const mm = floor((clk / 60) % 60);
  const ss = floor(clk % 60);
  return `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}.00`;
};

const termNeofetch = (): void => {
  const info: Array<[string, string]> = [
    ['OS', 'TermOS x86_64'],
    ['Host', 'CharTerm Grid'],
    ['Kernel', 'bun-win32 1.0'],
    ['Shell', 'charsh 1.0'],
    ['CPU', 'Bun + Zig FFI'],
    ['Resolution', `${cols}x${rows} cells`],
    ['Terminal', 'CharTerm'],
    ['Uptime', `${floor(liveTime)}s`],
  ];
  termOut('');
  const n = max(TERM_LOGO.length, info.length);
  for (let i = 0; i < n; i++) {
    const logo = (TERM_LOGO[i] ?? '').padEnd(22);
    const spans: Span[] = [sp(logo, i === 1 ? ACCENT2 : ACCENT, true)];
    if (i < info.length) {
      spans.push(sp(info[i][0].padEnd(12), ACCENT2, true));
      spans.push(sp(info[i][1], INK));
    }
    termPush(spans);
  }
  const pal: Span[] = [sp('  ', INK)];
  for (let i = 0; i < 8; i++) pal.push(sp('██', hsv(i / 8, 0.7, 1)));
  termPush(pal);
  termOut('');
};

const termDir = (): void => {
  termOut('');
  termOut(' Volume in drive C is TermOS', T_GREY);
  termOut(' Volume Serial Number is 0CDE-7A31', T_GREY);
  termOut('');
  termOut(` Directory of ${termCwd}`, T_GREY);
  termOut('');
  const dir = (name: string): void => termPush([sp('2026-06-03  09:14    ', T_GREY), sp('<DIR>          ', T_DGRN), sp(name, T_CYAN, true)]);
  const file = (size: string, name: string): void => termPush([sp('2026-06-02  21:40    ', T_GREY), sp(size.padStart(14) + ' ', T_GREY), sp(name, INK)]);
  dir('.');
  dir('..');
  dir('Documents');
  dir('Downloads');
  dir('Projects');
  file('4,096', 'readme.md');
  file('28,672', 'desktop.ts');
  file('1,204', 'notes.txt');
  termOut('               3 File(s)         33,972 bytes', T_GREY);
  termOut('               5 Dir(s)  68,719,476,736 bytes free', T_GREY);
  termOut('');
};

const termRun = (raw: string): void => {
  termPush([sp(termCwd + '>', T_PROMPT), sp(' ' + raw, INK)]);
  const trimmed = raw.trim();
  if (!trimmed) return;
  const space = trimmed.indexOf(' ');
  const cmd = (space < 0 ? trimmed : trimmed.slice(0, space)).toLowerCase();
  const arg = space < 0 ? '' : trimmed.slice(space + 1).trim();
  switch (cmd) {
    case 'help':
      termOut('');
      termOut('For more information on a specific command, type the name.', T_GREY);
      termOut('  help   ver    cls    echo   dir    cd     tree', INK);
      termOut('  whoami hostname  date  time  ipconfig  color', INK);
      termOut('  neofetch   cmatrix   exit', INK);
      termOut('');
      break;
    case 'cls':
    case 'clear':
      termLines = [];
      break;
    case 'ver':
      termOut('');
      termOut('TermOS [Version 10.0.26200.1000]', INK);
      termOut('');
      break;
    case 'echo':
      termOut(arg.length ? arg : 'ECHO is on.', INK);
      break;
    case 'whoami':
      termOut('termos\\user', INK);
      break;
    case 'hostname':
      termOut('TERMOS', INK);
      break;
    case 'cd':
    case 'chdir':
      if (!arg) {
        termOut(termCwd, INK);
      } else if (arg === '..') {
        const cut = termCwd.lastIndexOf('\\');
        if (cut > 2) termCwd = termCwd.slice(0, cut);
      } else if (arg.includes(':')) {
        termCwd = arg;
      } else {
        termCwd = termCwd + '\\' + arg;
      }
      break;
    case 'dir':
    case 'ls':
      termDir();
      break;
    case 'tree':
      termOut('');
      termOut(`Folder PATH listing for volume TermOS`, T_GREY);
      termOut(`${termCwd.split('\\')[0]}.`, T_GREY);
      termPush([sp('├───', T_GREY), sp('Documents', T_CYAN)]);
      termPush([sp('├───', T_GREY), sp('Downloads', T_CYAN)]);
      termPush([sp('└───', T_GREY), sp('Projects', T_CYAN)]);
      termPush([sp('    └───', T_GREY), sp('bun-win32', T_CYAN)]);
      termOut('');
      break;
    case 'date':
      termOut(`The current date is: Wed 06/03/2026`, INK);
      break;
    case 'time':
      termOut(`The current time is: ${termTimeStr()}`, INK);
      break;
    case 'ipconfig':
      termOut('');
      termOut('Windows IP Configuration', INK, true);
      termOut('');
      termOut('Ethernet adapter Ethernet:', INK);
      termOut('');
      termOut('   Connection-specific DNS Suffix  . : termos.local', T_GREY);
      termOut('   IPv4 Address. . . . . . . . . . . : 192.168.1.42', T_GREY);
      termOut('   Subnet Mask . . . . . . . . . . . : 255.255.255.0', T_GREY);
      termOut('   Default Gateway . . . . . . . . . : 192.168.1.1', T_GREY);
      termOut('');
      break;
    case 'neofetch':
      termNeofetch();
      break;
    case 'cmatrix':
      matrixUntil = liveTime + 6;
      termOut('Entering the Matrix — press any key to exit…', T_GRN);
      break;
    case 'color':
      termOut('', INK);
      break;
    case 'title':
      break;
    case 'exit':
      wins[AppId.TERMINAL].minimized = true;
      break;
    default:
      termOut(`'${cmd}' is not recognized as an internal or external command,`, T_WARN);
      termOut('operable program or batch file.', T_WARN);
      termOut('');
      break;
  }
};

const termExec = (): void => {
  const cmd = termInput;
  termInput = '';
  if (cmd.trim()) termHistory.push(cmd);
  termHistPos = termHistory.length;
  termRun(cmd);
};

const termKey = (key: string): void => {
  // Any key cancels the cmatrix rain.
  if (matrixUntil > liveTime) {
    matrixUntil = -1;
    return;
  }
  if (key === 'enter') return termExec();
  if (key === 'backspace') {
    termInput = termInput.slice(0, -1);
    return;
  }
  if (key === 'space') {
    termInput += ' ';
    return;
  }
  if (key === 'up') {
    if (termHistory.length) {
      termHistPos = max(0, termHistPos - 1);
      termInput = termHistory[termHistPos] ?? '';
    }
    return;
  }
  if (key === 'down') {
    if (termHistory.length) {
      termHistPos = min(termHistory.length, termHistPos + 1);
      termInput = termHistory[termHistPos] ?? '';
    }
    return;
  }
  if (key.length === 1 && key >= ' ') termInput += key;
};

const termReset = (): void => {
  termLines = [];
  termInput = '';
  termCwd = 'C:\\Users\\termos';
  termHistory = [];
  termHistPos = 0;
  matrixUntil = -1;
  autoIdx = 0;
  autoChars = 0;
  autoWait = 0.8;
  autoDone = false;
  termOut('TermOS [Version 10.0.26200.1000]', T_GREY);
  termOut('(c) TermOS Corporation. All rights reserved.', T_GREY);
  termOut('');
};

// Drives the attract demo by feeding the scripted commands into the live model.
const attractTerminal = (dt: number): void => {
  if (autoDone || matrixUntil > liveTime) return;
  if (autoWait > 0) {
    autoWait -= dt;
    return;
  }
  const cmd = ATTRACT_SCRIPT[autoIdx];
  if (autoChars < cmd.length) {
    autoChars += dt * 16;
    termInput = cmd.slice(0, min(cmd.length, floor(autoChars)));
    return;
  }
  termInput = cmd;
  termExec();
  autoIdx++;
  autoChars = 0;
  if (autoIdx >= ATTRACT_SCRIPT.length) {
    autoDone = true;
    termInput = '';
  } else {
    autoWait = cmd === 'neofetch' || cmd === 'dir' ? 2.6 : 1.6;
  }
};

const renderSpans = (t: CharTerm, x: number, y: number, maxW: number, spans: Span[]): void => {
  let cx = x;
  for (const span of spans) {
    const used = cx - x;
    if (used >= maxW) break;
    const str = used + span.s.length > maxW ? span.s.slice(0, maxW - used) : span.s;
    t.text(cx, y, str, span.c, undefined, span.b);
    cx += span.s.length;
  }
};

const drawMatrix = (t: CharTerm, x: number, y: number, w: number, h: number): void => {
  const glyphs = 'ｱｲｳｴｵｶｷｸ0123456789ABCDEF$#%&@';
  for (let cx = 0; cx < w; cx++) {
    const seed = (cx * 2654435761) >>> 0;
    const speed = 4 + (seed % 100) / 14;
    const lenCol = 4 + (seed % 6);
    const headF = (liveTime * speed + (seed % 23)) % (h + lenCol);
    for (let k = 0; k < lenCol; k++) {
      const rr = floor(headF) - k;
      if (rr < 0 || rr >= h) continue;
      const g = glyphs[(seed + rr * 7 + floor(liveTime * 8)) % glyphs.length];
      const intensity = k === 0 ? 1 : 1 - k / lenCol;
      const fg: RGB = k === 0 ? [205, 255, 215] : [lerp(T_DGRN[0], T_GRN[0], intensity), lerp(T_DGRN[1], T_GRN[1], intensity), lerp(T_DGRN[2], T_GRN[2], intensity)];
      t.put(x + cx, y + rr, g, fg, undefined, k === 0);
    }
  }
};

const drawTerminal = (t: CharTerm, wn: Win, focused: boolean, time: number): void => {
  const innerX = wn.x + 1;
  const innerY = wn.y + 2;
  const innerW = wn.w - 2;
  const innerH = wn.h - 3;
  t.fillRect(innerX, innerY, innerW, innerH, [8, 10, 16]);
  for (let r = 0; r < innerH; r += 2) t.shadeRect(innerX, innerY + r, innerW, 1, 0, 0, 0, 0.12);

  if (matrixUntil > liveTime) {
    drawMatrix(t, innerX, innerY, innerW, innerH);
    return;
  }

  // The live input line is the last "row" after the scrollback.
  const promptStr = termCwd + '>';
  const inputLine: Span[] = [sp(promptStr, T_PROMPT, true), sp(' ' + termInput, INK)];
  const total = termLines.length + 1;
  const startIdx = max(0, total - innerH);
  let rrow = 0;
  for (let i = startIdx; i < total && rrow < innerH; i++, rrow++) {
    const spans = i < termLines.length ? termLines[i] : inputLine;
    renderSpans(t, innerX + 1, innerY + rrow, innerW - 2, spans);
  }

  // Caret on the input line — solid while actively typing, blinking when idle.
  const showCaret = focused || attractActive;
  const inputRowIndex = total - 1 - startIdx;
  if (showCaret && inputRowIndex >= 0 && inputRowIndex < innerH) {
    const cx = innerX + 1 + promptStr.length + 1 + termInput.length;
    const typing = liveTime - lastInputTime < 0.6 || (attractActive && !autoDone && autoIdx < ATTRACT_SCRIPT.length);
    const blink = floor(time * 2.4) % 2 === 0;
    if ((typing || blink) && cx < innerX + innerW - 1) t.put(cx, innerY + inputRowIndex, '█', T_GRN, undefined, true);
  }
};

// ── App: System monitor (scrolling sparklines + core grid) ────────────────────────
interface Metric {
  label: string;
  hue: number;
  hist: Float32Array;
  head: number;
  value: number;
}
let metrics: Metric[] = [];
const HIST_N = 96;
const NCORES = 8;
let coreLoads: Float32Array = new Float32Array(NCORES);

const loadColor = (val: number, hue: number): RGB => (val > 0.82 ? [255, 90, 90] : val > 0.58 ? [255, 190, 80] : hsv(hue, 0.6, 1));

const initMetrics = (): void => {
  const mk = (label: string, hue: number): Metric => ({ label, hue, hist: new Float32Array(HIST_N), head: 0, value: 0 });
  metrics = [mk('CPU', 0.33), mk('GPU', 0.55), mk('MEM', 0.78)];
  coreLoads = new Float32Array(NCORES);
};

const drawMonitor = (t: CharTerm, wn: Win, focused: boolean, time: number, dt: number): void => {
  const innerX = wn.x + 1;
  const innerY = wn.y + 2;
  const innerW = wn.w - 2;
  const innerH = wn.h - 3;
  t.fillRect(innerX, innerY, innerW, innerH, [16, 18, 26]);

  // Reserve a tidy two-row strip at the bottom for the core meters — but only when the
  // window is tall enough that the three graphs still get real height. The cores strip
  // is its own band, so it never overlaps a graph (the old version's "funky" bug).
  const coresH = innerH >= 12 ? 2 : 0;
  const graphArea = max(3, innerH - coresH);
  const panelH = max(2, floor(graphArea / metrics.length));

  for (let m = 0; m < metrics.length; m++) {
    const met = metrics[m];
    // Smooth deterministic load: layered sines per metric, clamped 0..1.
    const target = clamp01(0.45 + 0.32 * sinT(time * (0.7 + m * 0.3) + m * 2) + 0.16 * sinT(time * (2.3 + m) + m) + 0.08 * sinT(time * 7 + m * 5));
    met.value += (target - met.value) * min(1, dt * 4);
    met.hist[met.head] = met.value;
    met.head = (met.head + 1) % HIST_N;

    const py0 = innerY + m * panelH;
    const graphH = panelH - 2;
    const val = met.value;
    const loadCol = loadColor(val, met.hue);

    // header: label + big percentage
    t.text(innerX + 1, py0, met.label, INK, undefined, true);
    const pct = `${round(val * 100)}%`;
    t.text(innerX + innerW - 1 - pct.length, py0, pct, loadCol, undefined, true);

    // filled sparkline graph
    const gW = min(innerW - 2, HIST_N);
    for (let cx = 0; cx < gW; cx++) {
      const sample = met.hist[(met.head - gW + cx + HIST_N * 2) % HIST_N];
      const h = sample * graphH;
      const full = floor(h);
      for (let r = 0; r < graphH; r++) {
        const yy = py0 + 1 + (graphH - 1 - r);
        if (r < full) {
          const k = r / max(1, graphH);
          t.put(innerX + 1 + cx, yy, '█', [loadCol[0] * (0.35 + 0.65 * k), loadCol[1] * (0.35 + 0.65 * k), loadCol[2] * (0.35 + 0.65 * k)]);
        } else if (r === full) {
          const fr = h - full;
          if (fr > 0.05) t.put(innerX + 1 + cx, yy, VBLOCK[clamp(round(fr * 8), 1, 8)], loadCol);
        } else {
          t.put(innerX + 1 + cx, yy, ' ', INK, [20, 22, 32]);
        }
      }
    }
    // baseline rule
    t.hline(innerX + 1, py0 + panelH - 1, gW, '─', [40, 44, 60], [16, 18, 26]);
  }

  // ── Core meters: a row of evenly-spaced "LED" cells, one per logical core, each lit
  // by its smoothed load (dim→bright, green→amber→red). Full-block glyphs so the meters
  // read identically in the live terminal and in a rasterised PNG capture.
  if (coresH > 0) {
    const labelY = innerY + innerH - 2;
    const barY = innerY + innerH - 1;
    t.fillRect(innerX, labelY, innerW, 2, [13, 15, 22]);
    t.text(innerX + 1, labelY, 'CORES', FAINT, [13, 15, 22], true);
    const startX = innerX + 7;
    const avail = innerW - 8;
    const slot = max(2, floor(avail / NCORES));
    for (let c = 0; c < NCORES; c++) {
      const cx = startX + c * slot;
      if (cx + 1 >= innerX + innerW) break;
      // Smoothed per-core load (deterministic), independent phase per core.
      const target = clamp01(0.5 + 0.4 * sinT(time * (1.5 + c * 0.6) + c * 1.7) + 0.1 * sinT(time * 9 + c * 3));
      coreLoads[c] += (target - coreLoads[c]) * min(1, dt * 5);
      const load = coreLoads[c];
      const col = loadColor(load, 0.36 - load * 0.2);
      const k = 0.28 + 0.72 * load;
      t.put(cx, labelY, String((c + 1) % 10), FAINT, [13, 15, 22]);
      t.put(cx, barY, '█', [col[0] * k, col[1] * k, col[2] * k], [13, 15, 22]);
      if (slot >= 3) t.put(cx + 1, barY, '█', [col[0] * k, col[1] * k, col[2] * k], [13, 15, 22]);
    }
  }
  void focused;
};

// ── App: Scene (real-time shaded rotating 3D torus) ───────────────────────────────
// The classic spinning-donut math, but truecolor: a per-cell depth buffer collects the
// brightest torus sample, Lambert + a tight specular highlight shade an iridescent base,
// over a faint receding grid floor. Cheap — a few thousand surface samples per frame.
let zbuf: Float32Array = new Float32Array(0);
let lumBuf: Float32Array = new Float32Array(0);
let hueBuf: Float32Array = new Float32Array(0);
let sceneW = 0;
let sceneH = 0;

const drawScene = (t: CharTerm, wn: Win, focused: boolean, time: number): void => {
  const innerX = wn.x + 1;
  const innerY = wn.y + 2;
  const innerW = wn.w - 2;
  const innerH = wn.h - 3;
  if (innerW <= 0 || innerH <= 0) return;
  if (sceneW !== innerW || sceneH !== innerH) {
    sceneW = innerW;
    sceneH = innerH;
    zbuf = new Float32Array(innerW * innerH);
    lumBuf = new Float32Array(innerW * innerH);
    hueBuf = new Float32Array(innerW * innerH);
  }
  zbuf.fill(0);
  lumBuf.fill(0);
  hueBuf.fill(0);

  // background: dark vertical gradient + a receding grid floor.
  for (let y = 0; y < innerH; y++) {
    const v = y / innerH;
    for (let x = 0; x < innerW; x++) {
      t.put(innerX + x, innerY + y, ' ', INK, [6 + 6 * v, 7 + 6 * v, 14 + 14 * v]);
    }
  }
  for (let y = floor(innerH * 0.62); y < innerH; y++) {
    const depth = (y - innerH * 0.62) / max(1, innerH * 0.38);
    for (let x = 0; x < innerW; x++) {
      const u = (x / innerW - 0.5) / max(0.2, 1 - depth * 0.8) + 0.5;
      const gx = fract(u * 10) < 0.08;
      const gy = fract(depth * 6 - time * 0.4) < 0.1;
      if (gx || gy) t.shadeRect(innerX + x, innerY + y, 1, 1, 60, 90, 150, 0.18 * (1 - depth));
    }
  }

  const A = time * 0.9;
  const B = time * 0.5;
  const cA = cos(A);
  const sA = sin(A);
  const cB = cos(B);
  const sB = sin(B);
  const R1 = 1; // tube radius
  const R2 = 2.2; // torus radius
  const K2 = 6.5; // viewer distance
  // Projection gain sized so the torus fills the window — height-limited (cells are
  // ~2:1, hence the y·0.5 squash) so it never spills past the top/bottom edges.
  const K1 = min(innerW * 0.92, innerH * 1.85);
  // light direction
  const lx = 0;
  const ly = 0.7;
  const lz = -0.7;

  const dTheta = 0.1;
  const dPhi = 0.03;
  for (let theta = 0; theta < TAU; theta += dTheta) {
    const ct = cos(theta);
    const st = sin(theta);
    for (let phi = 0; phi < TAU; phi += dPhi) {
      const cp = cos(phi);
      const sp = sin(phi);
      const circleX = R2 + R1 * ct;
      const circleY = R1 * st;
      // rotate around Y (B) then X (A)
      const x = circleX * (cB * cp + sA * sB * sp) - circleY * cA * sB;
      const y = circleX * (cp * sB - cB * sA * sp) + circleY * cA * cB;
      const z = K2 + cA * circleX * sp + circleY * sA;
      const ooz = 1 / z;
      const sx = floor(innerW / 2 + K1 * ooz * x);
      const sy = floor(innerH / 2 - K1 * ooz * y * 0.5);
      if (sx < 0 || sx >= innerW || sy < 0 || sy >= innerH) continue;
      // surface normal
      const nx = ct * (cB * cp + sA * sB * sp) - st * cA * sB;
      const ny = ct * (cp * sB - cB * sA * sp) + st * cA * cB;
      const nz = cA * ct * sp + st * sA;
      let lum = nx * lx + ny * ly + nz * lz;
      if (lum < 0) lum = 0;
      const idx = sy * innerW + sx;
      if (ooz > zbuf[idx]) {
        zbuf[idx] = ooz;
        // specular term
        const spec = Math.pow(lum, 6);
        lumBuf[idx] = clamp01(0.12 + 0.7 * lum + 0.5 * spec);
        hueBuf[idx] = fract(0.58 + (theta / TAU) * 0.5 + time * 0.05);
      }
    }
  }

  const SRAMP = ' .:-=+*#%@█';
  for (let i = 0; i < zbuf.length; i++) {
    if (zbuf[i] <= 0) continue;
    const lum = lumBuf[i];
    const c = hsv(hueBuf[i], 0.55, clamp01(0.35 + 0.65 * lum));
    const x = i % innerW;
    const y = (i / innerW) | 0;
    const ri = clamp(round(lum * (SRAMP.length - 1)), 1, SRAMP.length - 1);
    t.put(innerX + x, innerY + y, SRAMP[ri], c, undefined, lum > 0.7);
  }

  // little HUD
  t.text(innerX + 1, innerY + innerH - 1, `pts ~${floor((TAU / dTheta) * (TAU / dPhi))}`, FAINT);
  void focused;
};

// ── Wallpaper (aurora + light rays + parallax bokeh + starfield) ───────────────────
let bokeh: Array<{ x: number; y: number; r: number; sp: number; hue: number; ph: number }> = [];
const initBokeh = (): void => {
  bokeh = [];
  const brnd = mulberry32(0xb0fe77);
  for (let i = 0; i < 14; i++) bokeh.push({ x: brnd(), y: brnd(), r: 2 + brnd() * 5, sp: 0.01 + brnd() * 0.03, hue: 0.55 + brnd() * 0.25, ph: brnd() * TAU });
};

const drawWallpaper = (t: CharTerm, time: number): void => {
  const invH = 1 / max(1, deskH);
  const invW = 1 / cols;
  const lx = cols * (0.22 + 0.05 * sinT(time * 0.12));
  const ly = deskH * 0.06;
  const bloomR2 = cols * 0.62 * (cols * 0.62);
  for (let y = 0; y < deskH; y++) {
    const v = y * invH;
    const dyl = (y - ly) * 1.9;
    for (let x = 0; x < cols; x++) {
      const u = x * invW;
      let r = 8 + 14 * v;
      let g = 10 + 12 * v;
      let b = 26 + 34 * (1 - v);
      const b1 = sinT(u * 2.4 - v * 3.0 + time * 0.2);
      const b2 = sinT(u * 1.3 + v * 4.2 - time * 0.13);
      const b3 = sinT(u * 4.1 + v * 1.6 + time * 0.07);
      const band = b1 * 0.5 + b2 * 0.35 + b3 * 0.15;
      const aur = clamp01(band * 0.5 + 0.5);
      const ridge = aur * aur * (0.65 + 0.35 * aur);
      const curtain = 0.7 + 0.3 * (0.5 + 0.5 * sinT(u * 9.0 + b2 * 1.4 + time * 0.05));
      const horizon = smoothstep(0.0, 0.45, v) * smoothstep(1.1, 0.5, v);
      const amp = ridge * curtain * (0.5 + 0.6 * horizon);
      const vio = smoothstep(0.2, 0.9, v);
      r += amp * (22 + 40 * vio);
      g += amp * (74 - 22 * vio);
      b += amp * (58 + 34 * vio);
      // top-left bloom + volumetric rays radiating from the light source
      const dx = x - lx;
      const d2 = dx * dx + dyl * dyl;
      const glow = d2 < bloomR2 ? 1 - d2 / bloomR2 : 0;
      const ang = atan2(dyl, dx);
      const ray = 0.5 + 0.5 * sinT(ang * 7 + time * 0.15);
      const gl = glow * glow * (20 + 14 * ray);
      r += gl;
      g += gl * 1.05;
      b += gl * 1.25;
      const vig = 1 - 0.32 * ((u - 0.5) * (u - 0.5) + (v - 0.5) * (v - 0.5)) * 3.4;
      r *= vig;
      g *= vig;
      b *= vig;
      t.put(x, y, ' ', INK, [r, g, b]);
    }
  }

  // Parallax bokeh: soft glowing discs drifting upward, blended additively.
  for (const bk of bokeh) {
    const bx = (bk.x + sinT(time * bk.sp * 6 + bk.ph) * 0.04) * cols;
    const by = ((((bk.y - time * bk.sp) % 1) + 1) % 1) * deskH;
    const col = hsv(bk.hue, 0.5, 1);
    const rad = bk.r;
    const x0 = max(0, floor(bx - rad * 2));
    const x1 = min(cols, ceilN(bx + rad * 2));
    const y0 = max(0, floor(by - rad));
    const y1 = min(deskH, ceilN(by + rad));
    for (let yy = y0; yy < y1; yy++) {
      for (let xx = x0; xx < x1; xx++) {
        const ddx = (xx - bx) / 2;
        const ddy = yy - by;
        const dd = (ddx * ddx + ddy * ddy) / (rad * rad);
        if (dd > 1) continue;
        const a = (1 - dd) * (1 - dd) * 0.14;
        t.shadeRect(xx, yy, 1, 1, col[0], col[1], col[2], a);
      }
    }
  }

  // Sparse twinkling starfield.
  const wlen = wallJit.length || 1;
  const starN = min((cols * deskH) >> 6, 130);
  for (let s = 0; s < starN; s++) {
    const j = wallJit[(s * 13) % wlen];
    const j2 = wallJit[(s * 29 + 7) % wlen];
    const sx = (j * cols) | 0;
    const sy = (j2 * deskH * 0.82) | 0;
    const tw = 0.5 + 0.5 * sinT(time * 1.1 + s * 1.7);
    if (tw < 0.5) continue;
    const i = sy * cols + sx;
    const cur = t.background[i];
    const k = 90 + tw * 110;
    t.put(sx, sy, tw > 0.86 ? '✦' : tw > 0.7 ? '·' : '∙', [((cur >> 16) & 255) + k, ((cur >> 8) & 255) + k, (cur & 255) + k * 1.1], undefined, tw > 0.86);
  }
};

const ceilN = (x: number): number => (x === (x | 0) ? x : (x | 0) + 1);

// ── Menu bar ──────────────────────────────────────────────────────────────────────
const drawMenuBar = (t: CharTerm, time: number): void => {
  t.fillRect(0, 0, cols, 1, [12, 13, 20]);
  t.shadeRect(0, 0, cols, 1, 90, 130, 200, 0.08);
  t.put(1, 0, '◉', ACCENT, [12, 13, 20], true);
  t.text(3, 0, 'TermOS', INK, [12, 13, 20], true);
  const menus = ['File', 'Edit', 'View', 'Window', 'Help'];
  let mx = 11;
  for (const m of menus) {
    t.text(mx, 0, m, [170, 175, 195], [12, 13, 20]);
    mx += m.length + 2;
  }
  // right side: wifi / battery / clock glyphs
  const clk = CLOCK_START + time * 60;
  const hh = floor((clk / 3600) % 12) || 12;
  const mm = floor((clk / 60) % 60);
  const right = `▂▄▆█ wifi   ▰▰▰▰ 96%   ${hh}:${mm.toString().padStart(2, '0')}`;
  const rx = cols - right.length - 8;
  if (rx > mx) t.text(rx, 0, right, [180, 190, 210], [12, 13, 20]);
};

// ── Dock ─────────────────────────────────────────────────────────────────────────
const DOCK_APPS: Array<{ app: AppId; glyph: string; name: string }> = [
  { app: AppId.BROWSER, glyph: '◍', name: 'Web' },
  { app: AppId.NOTEPAD, glyph: '✎', name: 'Notes' },
  { app: AppId.TERMINAL, glyph: '❯', name: 'Shell' },
  { app: AppId.MONITOR, glyph: '☷', name: 'Stats' },
  { app: AppId.SCENE, glyph: '◈', name: 'Scene' },
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
    // Hover-magnify: brighten the slot whose icon is nearest the cursor.
    const cxIcon = x + 2;
    const mdist = abs(curX - cxIcon);
    const mag = clamp01(1 - mdist / 6);
    const slotBg: RGB = focused ? [34, 40, 58] : [20 + mag * 14, 22 + mag * 14, 32 + mag * 18];
    t.fillRect(x, dy + 1, DOCK_SLOT - 1, 1, slotBg);
    const ic: RGB = focused ? ACCENT : open ? [INK[0], INK[1], INK[2]] : [DIM[0] + mag * 60, DIM[1] + mag * 60, DIM[2] + mag * 60];
    t.put(x + 1, dy + 1, a.glyph, ic, slotBg, focused || mag > 0.5);
    t.text(x + 3, dy + 1, a.name, focused ? INK : DIM, slotBg);
    if (open) t.put(x, dy + 1, '▍', focused ? ACCENT : FAINT, slotBg);
    // reflection of the icon in the bottom dock row
    if (dy + 2 < rows) t.put(x + 1, dy + 2, a.glyph, [ic[0] * 0.22, ic[1] * 0.22, ic[2] * 0.26], [14, 15, 22]);
  }

  const clk = CLOCK_START + time * 60;
  const hh = floor((clk / 3600) % 12) || 12;
  const mm = floor((clk / 60) % 60);
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][floor((clk / 86400) % 7)];
  const right = `${day}  ${hh}:${mm.toString().padStart(2, '0')}`;
  t.text(cols - right.length - 2, dy + 1, right, INK, [14, 15, 22], true);
  t.text(2, dy + 1, '◉ TermOS', ACCENT, [14, 15, 22], true);
};

// ── Cursor sprite ────────────────────────────────────────────────────────────────
const drawCursor = (t: CharTerm, x: number, y: number, down: boolean): void => {
  const cx = clamp(round(x), 0, cols - 1);
  const cy = clamp(round(y), 0, rows - 1);
  const cur = t.background[cy * cols + cx];
  const lum = (((cur >> 16) & 255) * 0.299 + ((cur >> 8) & 255) * 0.587 + (cur & 255) * 0.114) / 255;
  const back = lerp(0.45, 0.1, smoothstep(0.12, 0.42, lum));
  const side = lerp(0.22, 0.06, smoothstep(0.12, 0.42, lum));
  t.shadeRect(cx, cy, 1, 1, 0, 0, 0, back);
  if (cx + 1 < cols) t.shadeRect(cx + 1, cy, 1, 1, 0, 0, 0, side);
  if (cy + 1 < rows) t.shadeRect(cx, cy + 1, 1, 1, 0, 0, 0, side);
  t.put(cx, cy, down ? '◆' : '▶', down ? ACCENT : [255, 255, 255], undefined, true);
};

// ── Widget reset (deterministic capture) ───────────────────────────────────────────
const resetWidgets = (): void => {
  initMetrics();
  initBokeh();
  termReset();
  sceneW = 0;
  sceneH = 0;
  videoTime = 0;
  browserNav = 1e9;
};

// ── Attract performance ────────────────────────────────────────────────────────────
const ATTRACT_SENTENCE =
  'Welcome to TermOS. A whole desktop in characters: a browser, a real interactive shell, live system graphs, a video player, and a spinning 3D torus — all pure TypeScript. Click the shell and type, or take control of anything.';
const LOOP = 34.0;

const attract = (t: CharTerm, time: number): void => {
  const p = time % LOOP;

  if (p < 0.05) {
    docText = '';
    caret = 0;
    wins[AppId.NOTEPAD].fx = 0.015;
    wins[AppId.NOTEPAD].fy = 0.08;
    for (const wn of wins) {
      wn.maximized = false;
      wn.maxAnim = 0;
      wn.scroll = 0;
    }
    wins[AppId.BROWSER].rw = clamp(round(cols * 0.44), 48, 78);
    wins[AppId.BROWSER].rh = clamp(round(deskH * 0.66), 22, 34);
    layout(t);
    raise(AppId.CLOCK);
    raise(AppId.MONITOR);
    raise(AppId.SCENE);
    raise(AppId.VIDEO);
    raise(AppId.TERMINAL);
    raise(AppId.NOTEPAD);
    raise(AppId.BROWSER);
    termReset();
    browserNav = 1e9;
  }

  // Staggered spawn waves so the t≈9 capture is a rich, arranged multi-window shot.
  wins[AppId.CLOCK].appear = smoothstep(0.1, 1.0, p);
  wins[AppId.MONITOR].appear = smoothstep(0.3, 1.2, p);
  wins[AppId.SCENE].appear = smoothstep(0.5, 1.4, p);
  wins[AppId.VIDEO].appear = smoothstep(1.1, 2.0, p);
  wins[AppId.TERMINAL].appear = smoothstep(1.4, 2.3, p);
  wins[AppId.NOTEPAD].appear = smoothstep(3.0, 3.9, p);
  wins[AppId.BROWSER].appear = smoothstep(2.0, 2.9, p);
  if (browserNav > 1e8 && p > 2.1) browserNav = time - (p - 2.1);

  // Browser page auto-scroll (slow pan after it loads), then resize + maximize beat.
  const br = wins[AppId.BROWSER];
  if (p > 3.5 && p < 13) {
    br.scroll = (p - 3.5) * 1.9; // slow pan down the page
  } else if (p >= 15.5 && p < 21) {
    br.scroll = lerp((13 - 3.5) * 1.9, 0, smoothstep(0, 1, (p - 15.5) / 1.5)); // pan back to the hero while maximized
  }
  // resize the browser by dragging its corner (the cursor rides the grip).
  if (p >= 13 && p < 15) {
    const a = smoothstep(0, 1, (p - 13) / 2);
    br.rw = clamp(round(lerp(cols * 0.38, cols * 0.46, a)), 48, 78);
    br.rh = clamp(round(lerp(deskH * 0.6, deskH * 0.74, a)), 22, 32);
  }
  // maximize to read, then restore
  br.maximized = p >= 15.5 && p < 21;

  type Key = { tt: number; x: number; y: number; down: boolean };
  const np = wins[AppId.NOTEPAD];
  const tm = wins[AppId.TERMINAL];
  const dragToX = round(0.03 * cols);
  const npTitleY = np.y;

  const keys: Key[] = [
    { tt: 1.6, x: cols * 0.5, y: deskH * 0.45, down: false },
    { tt: 3.0, x: br.x + 10, y: br.y + 1, down: false }, // to browser address bar
    { tt: 3.3, x: br.x + 10, y: br.y + 1, down: true }, // click (focus)
    { tt: 3.6, x: br.x + 10, y: br.y + 1, down: false },
    { tt: 12.5, x: br.x + br.w - 1, y: br.y + br.h - 1, down: false }, // to corner
    { tt: 13.0, x: br.x + br.w - 1, y: br.y + br.h - 1, down: true }, // grab corner
    { tt: 15.0, x: br.x + br.w - 1, y: br.y + br.h - 1, down: false }, // release (resized)
    { tt: 15.4, x: br.x + 6, y: br.y, down: false }, // to green light
    { tt: 15.6, x: br.x + 6, y: br.y, down: true }, // maximize
    { tt: 15.8, x: br.x + 6, y: br.y, down: false },
    { tt: 21.5, x: tm.x + 16, y: tm.y + 4, down: false }, // to terminal
    { tt: 23.5, x: np.x + 14, y: npTitleY, down: false }, // to notepad title
    { tt: 24.0, x: np.x + 14, y: npTitleY, down: true }, // grab
    { tt: 25.0, x: dragToX + 14, y: npTitleY + 2, down: true }, // drag
    { tt: 25.3, x: dragToX + 14, y: npTitleY + 2, down: false }, // release
    { tt: 25.8, x: dragToX + 6, y: npTitleY + 4, down: false },
    { tt: 26.1, x: dragToX + 6, y: npTitleY + 4, down: true }, // focus click
    { tt: 26.3, x: dragToX + 6, y: npTitleY + 4, down: false },
  ];

  let kx = keys[0].x;
  let ky = keys[0].y;
  let kd = false;
  if (p <= keys[0].tt) {
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

  // Focus arbitration to match the cursor's tour.
  if (p >= keys[2].tt && p < 13) raise(AppId.BROWSER);
  if (p >= 21.5 && p < 23.5) raise(AppId.TERMINAL);

  // Notepad drag.
  if (p >= keys[12].tt && p < keys[14].tt) {
    raise(AppId.NOTEPAD);
    const a = smoothstep(0, 1, (p - keys[12].tt) / (keys[14].tt - keys[12].tt));
    np.fx = lerp(0.015, dragToX / cols, a);
    np.fy = lerp(0.08, (npTitleY + 2) / deskH, a * 0.4);
    layout(t);
  }
  if (p >= keys[16].tt) raise(AppId.NOTEPAD);

  curX = kx;
  curY = ky;
  curDown = kd;

  // Typing into the notepad after the drag.
  const typeStart = 26.5;
  const cps = 21;
  if (p >= typeStart) {
    const n = clamp(floor((p - typeStart) * cps), 0, ATTRACT_SENTENCE.length);
    docText = ATTRACT_SENTENCE.slice(0, n);
    caret = docText.length;
    caretSolid = n < ATTRACT_SENTENCE.length;
  }
};

// ── Frame ────────────────────────────────────────────────────────────────────────
let liveTime = 0;
let lastTypeTime = -1e9;
let attractActive = false;
const IDLE_RESUME = 3.5;

const frame = (t: CharTerm, time: number, dt: number, _frame: number): void => {
  liveTime = time;
  if (cols !== t.columns || rows !== t.rows) layout(t);

  if (videoPlaying) {
    videoTime += dt;
    if (videoTime >= VIDEO_TOTAL) videoTime -= VIDEO_TOTAL;
  }

  handleMouse(t);
  const interacted = t.mouse.active || lastInputTime > -1e8;
  const idle = time - lastInputTime;
  const inAttract = !interacted || idle > IDLE_RESUME;
  attractActive = inAttract;

  if (inAttract) {
    attract(t, time);
    attractTerminal(dt);
    if (browserNav > 1e8) browserNav = time;
  } else {
    curX = t.mouse.x;
    curY = t.mouse.y;
    curDown = t.mouse.down;
    caretSolid = time - lastTypeTime < 0.5;
    for (const wn of wins) if (wn.appear < 1) wn.appear = 1;
    if (browserNav > 1e8) browserNav = time;
  }

  // Animate maximize toward its target for every window, then resolve effective rects.
  for (const wn of wins) {
    const target = wn.maximized ? 1 : 0;
    wn.maxAnim += (target - wn.maxAnim) * min(1, dt * 9);
    if (abs(wn.maxAnim - target) < 0.002) wn.maxAnim = target;
  }
  layout(t);

  // ── Render ──
  drawWallpaper(t, time);

  for (const app of zorder) {
    const wn = wins[app];
    if (wn.minimized || wn.appear <= 0.02) continue;
    const focused = FOCUS() === app;
    const ease = smoothstep(0, 1, clamp01(wn.appear));

    dropShadow(t, wn);
    drawWindowFrame(t, wn, focused);
    if (app === AppId.NOTEPAD) drawNotepad(t, wn, focused, time);
    else if (app === AppId.VIDEO) drawVideo(t, wn, focused);
    else if (app === AppId.CLOCK) drawClock(t, wn, focused, time);
    else if (app === AppId.BROWSER) drawBrowser(t, wn, focused, time);
    else if (app === AppId.TERMINAL) drawTerminal(t, wn, focused, time);
    else if (app === AppId.MONITOR) drawMonitor(t, wn, focused, time, dt);
    else drawScene(t, wn, focused, time);

    if (ease < 1) t.shadeRect(wn.x, wn.y, wn.w, wn.h, 14, 16, 34, (1 - ease) * 0.8);
  }

  drawMenuBar(t, time);
  drawDock(t, time);
  drawCursor(t, curX, curY, curDown);
};

runText({
  title: 'TermOS — Desktop',
  hud: 'DRAG · RESIZE ◢ · GREEN=MAX · WHEEL=SCROLL · TYPE IN NOTEPAD · DOCK LAUNCH',
  captureT: 9,
  targetFps: Infinity,
  mouse: true,
  init,
  resize: init,
  onKey,
  frame,
});
