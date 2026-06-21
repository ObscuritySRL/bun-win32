/**
 * Accessibility Radar
 *
 * A live, animated radar sweep of every top-level window on the desktop, rendered with
 * pure ANSI escape codes. Each window is a blip placed by a stable hash of its HWND; a
 * rotating phosphor beam lights blips as it passes, leaving a fading trail. Windows owned
 * by a Java VM (detected through the Access Bridge's `isJavaWindow`) glow green and flash
 * their title as the beam crosses them — turning "is this app accessible to Java AT?" into
 * something you can watch in real time. Windows are re-scanned continuously, so opening or
 * closing apps changes the scope live.
 *
 * Honors DEMO_DURATION_MS for headless/self-exit runs.
 *
 * APIs demonstrated (WindowsAccessBridge):
 *   - Windows_run         (initialize the Access Bridge)
 *   - isJavaWindow        (classify each blip as Java / non-Java)
 *
 * APIs demonstrated (User32, cross-package):
 *   - EnumWindows         (discover top-level windows via JSCallback)
 *   - IsWindowVisible / GetWindowTextW (filter + label blips)
 *   - PeekMessageW / TranslateMessage / DispatchMessageW (pump the JVM registration handshake)
 *
 * APIs demonstrated (Kernel32, cross-package):
 *   - GetStdHandle / GetConsoleMode / SetConsoleMode (enable ANSI VT output)
 *
 * Run: bun run example/accessibility-radar.ts
 */

import { JSCallback } from 'bun:ffi';

import Kernel32 from '@bun-win32/kernel32';
import User32 from '@bun-win32/user32';
import WindowsAccessBridge from '@bun-win32/windowsaccessbridge-64';

Kernel32.Preload(['GetStdHandle', 'GetConsoleMode', 'SetConsoleMode']);
User32.Preload(['DispatchMessageW', 'EnumWindows', 'GetWindowTextW', 'IsWindowVisible', 'PeekMessageW', 'TranslateMessage']);
WindowsAccessBridge.Preload(['Windows_run', 'isJavaWindow']);

const PM_REMOVE = 0x0001;
const MSG_SIZE = 48; // sizeof(MSG) on x64
const pumpBuffer = Buffer.alloc(MSG_SIZE);

// Drain pending messages so each Java VM completes its registration handshake with this
// process (triggered by Windows_run); without it isJavaWindow never reports a Java window.
function drainMessages(): void {
  while (User32.PeekMessageW(pumpBuffer.ptr, 0n, 0, 0, PM_REMOVE)) {
    User32.TranslateMessage(pumpBuffer.ptr);
    User32.DispatchMessageW(pumpBuffer.ptr);
  }
}

const STD_OUTPUT_HANDLE = -11;
const ENABLE_VIRTUAL_TERMINAL_PROCESSING = 0x0004;
const hStdout = Kernel32.GetStdHandle(STD_OUTPUT_HANDLE);
const modeBuffer = Buffer.alloc(4);
if (Kernel32.GetConsoleMode(hStdout, modeBuffer.ptr)) {
  Kernel32.SetConsoleMode(hStdout, modeBuffer.readUInt32LE(0) | ENABLE_VIRTUAL_TERMINAL_PROCESSING);
}

const WIDTH = 61;
const HEIGHT = 29;
const CENTER_X = 30;
const CENTER_Y = 14;
const RADIUS_X = 28;
const RADIUS_Y = 13;
const TWO_PI = Math.PI * 2;

const durationMs = Number(Bun.env.DEMO_DURATION_MS ?? 0);
const frameMs = 33;

interface Blip {
  angle: number;
  radius: number;
  title: string;
  isJava: boolean;
}

function scanWindows(): Blip[] {
  const blips: Blip[] = [];
  const titleBuffer = Buffer.alloc(1024);
  const callback = new JSCallback(
    (hwnd: bigint): number => {
      if (User32.IsWindowVisible(hwnd)) {
        const length = User32.GetWindowTextW(hwnd, titleBuffer.ptr, 512);
        const title = titleBuffer.toString('utf16le', 0, length * 2);
        if (title.length > 0) {
          // Stable hash of the HWND → polar position, so blips hold still between scans.
          const hash = Number(hwnd >> 4n) >>> 0;
          blips.push({
            angle: ((hash % 3600) / 3600) * TWO_PI,
            radius: 0.28 + (((hash >>> 7) % 1000) / 1000) * 0.66,
            title,
            isJava: WindowsAccessBridge.isJavaWindow(hwnd) !== 0,
          });
        }
      }
      return 1;
    },
    { args: ['u64', 'i64'], returns: 'i32' },
  );
  User32.EnumWindows(callback.ptr!, 0n);
  callback.close();
  return blips;
}

function ramp(channel: [number, number, number], intensity: number): string {
  const r = Math.round(channel[0] * intensity);
  const g = Math.round(channel[1] * intensity);
  const b = Math.round(channel[2] * intensity);
  return `\x1b[38;2;${r};${g};${b}m`;
}

const cursorHide = '\x1b[?25l';
const cursorShow = '\x1b[?25h';
process.stdout.write(`\x1b[2J${cursorHide}`);

function restore(): void {
  process.stdout.write(`${cursorShow}\x1b[0m\n`);
}
process.on('exit', restore);
process.on('SIGINT', () => process.exit(0));

WindowsAccessBridge.Windows_run();

let sweep = 0;
let frame = 0;
let blips = scanWindows();
const startedAt = performance.now();

const timer = setInterval(() => {
  drainMessages();
  if (frame % 30 === 0) blips = scanWindows();
  sweep = (sweep + 0.12) % TWO_PI;

  const glyph: string[][] = Array.from({ length: HEIGHT }, () => Array(WIDTH).fill(' '));
  const color: string[][] = Array.from({ length: HEIGHT }, () => Array(WIDTH).fill(''));

  // Radar rings + crosshair.
  for (let angle = 0; angle < TWO_PI; angle += 0.03) {
    for (const ring of [0.4, 0.7, 1.0]) {
      const cx = CENTER_X + Math.round(Math.cos(angle) * RADIUS_X * ring);
      const cy = CENTER_Y + Math.round(Math.sin(angle) * RADIUS_Y * ring);
      if (cy >= 0 && cy < HEIGHT && cx >= 0 && cx < WIDTH && glyph[cy][cx] === ' ') {
        glyph[cy][cx] = '·';
        color[cy][cx] = '\x1b[38;2;0;60;0m';
      }
    }
  }

  // Rotating sweep beam, drawn as a fading line from the center.
  for (let step = 0; step <= RADIUS_X; step++) {
    const t = step / RADIUS_X;
    const bx = CENTER_X + Math.round(Math.cos(sweep) * RADIUS_X * t);
    const by = CENTER_Y + Math.round(Math.sin(sweep) * RADIUS_Y * t);
    if (by >= 0 && by < HEIGHT && bx >= 0 && bx < WIDTH) {
      glyph[by][bx] = '─';
      color[by][bx] = ramp([0, 255, 120], 0.5 + 0.5 * (1 - t));
    }
  }

  // Blips, lit by the beam with a phosphor trail.
  let flashTitle = '';
  for (const blip of blips) {
    const bx = CENTER_X + Math.round(Math.cos(blip.angle) * RADIUS_X * blip.radius);
    const by = CENTER_Y + Math.round(Math.sin(blip.angle) * RADIUS_Y * blip.radius);
    if (by < 0 || by >= HEIGHT || bx < 0 || bx >= WIDTH) continue;

    // Trail: brightness decays with how long ago the beam swept this angle.
    let behind = (sweep - blip.angle) % TWO_PI;
    if (behind < 0) behind += TWO_PI;
    const intensity = Math.max(0.18, 1 - behind / TWO_PI);
    const swept = behind < 0.16;

    if (blip.isJava) {
      glyph[by][bx] = swept ? '◆' : '◇';
      color[by][bx] = ramp([60, 255, 90], intensity);
      if (swept) flashTitle = `JAVA  ${blip.title}`;
    } else {
      glyph[by][bx] = swept ? '●' : '∙';
      color[by][bx] = ramp([120, 170, 255], intensity * 0.9);
    }
  }

  const javaCount = blips.filter((blip) => blip.isJava).length;
  const lines: string[] = [];
  lines.push(`\x1b[H\x1b[1m\x1b[96m  ACCESSIBILITY RADAR\x1b[0m  \x1b[90m— Java Access Bridge window sweep\x1b[0m`);
  for (let row = 0; row < HEIGHT; row++) {
    let line = '  ';
    let last = '';
    for (let col = 0; col < WIDTH; col++) {
      const c = color[row][col];
      if (c !== last) {
        line += c;
        last = c;
      }
      line += glyph[row][col];
    }
    lines.push(`${line}\x1b[0m`);
  }
  lines.push(`  \x1b[92m◆ java: ${javaCount}\x1b[0m   \x1b[94m● other: ${blips.length - javaCount}\x1b[0m   \x1b[90mtotal: ${blips.length}\x1b[0m`);
  lines.push(`  \x1b[92m${flashTitle.slice(0, 56).padEnd(56)}\x1b[0m`);
  process.stdout.write(lines.join('\n'));

  frame++;
  if (durationMs > 0 && performance.now() - startedAt >= durationMs) {
    clearInterval(timer);
    process.exit(0);
  }
}, frameMs);
