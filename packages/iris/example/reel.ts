/**
 * Iris — reel: records the promotional footage on a staged, privacy-safe desktop.
 *
 * Opens a handful of neutral windows (two local pages in Edge InPrivate, Windows Terminal, File Explorer, Paint,
 * Calculator, Character Map, and the live aurora shader from live-sky.ts), arranges them inside a 16:9 region of the
 * screen, then drives Iris through a scripted session restricted to exactly those windows — writing H.264 clips and
 * full-resolution PNG stills from the GPU back buffer. Every window it opened is closed again at the end.
 *
 * APIs demonstrated:
 * - @bun-win32/user32 — SetWindowPos (frame-exact placement), ShowWindow (minimize), PostMessageW (WM_CLOSE)
 * - @bun-win32/dwmapi — DwmGetWindowAttribute (DWMWA_EXTENDED_FRAME_BOUNDS, to cancel the invisible resize border)
 * - Iris itself (index.ts) — IRIS_SCRIPT / IRIS_ONLY_HWNDS / IRIS_MONITOR / IRIS_RECORD / IRIS_CLEAN_UNDERLAY
 *
 * Run: bun run packages/iris/example/reel.ts   (writes .scratch/iris-media/reel)
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import Combase from '@bun-win32/combase';
import Dwmapi from '@bun-win32/dwmapi';
import Shcore from '@bun-win32/shcore';
import User32 from '@bun-win32/user32';

import { encodePNGFromBGRA } from '@bun-win32/gpu';

import { decodeImage } from '../wallpaper';
import { enumerateWindows, type WindowInfo } from '../windows';

Shcore.SetProcessDpiAwareness(2);
Combase.CoInitializeEx(null, 0);

const root = join(import.meta.dir, '..', '..', '..');
const output = Bun.env.IRIS_REEL_OUTPUT ?? join(root, '.scratch', 'iris-media', 'reel');
const scratch = join(tmpdir(), 'iris-reel');
mkdirSync(scratch, { recursive: true });
mkdirSync(output, { recursive: true });

const screenWidth = User32.GetSystemMetrics(0);
const screenHeight = User32.GetSystemMetrics(1);
const region = { height: 1440, width: 2560, x: Math.max(0, Math.round((screenWidth - 2560) / 2)), y: 0 };
const taskbar = 48;

const aurora = `<!doctype html><html><head><meta charset="utf-8"><title>Aurora — Field Notes</title><style>
body{margin:0;font:18px/1.65 Georgia,serif;color:#1d232b;background:#f6f3ee}
header{padding:64px 72px 24px;background:linear-gradient(135deg,#0b1d2a,#0f3b3a 55%,#2f6b4f);color:#e9fff5}
h1{font:600 52px/1.1 "Segoe UI Variable Display",sans-serif;margin:0 0 10px;letter-spacing:-1px}
.kicker{font:600 13px "Segoe UI",sans-serif;letter-spacing:3px;text-transform:uppercase;color:#7dffc6}
main{padding:32px 72px;max-width:760px}h2{font:600 24px "Segoe UI Variable Display",sans-serif;margin-top:36px}
.note{border-left:4px solid #2f6b4f;padding:6px 18px;background:#ebf3ee;font-style:italic}
</style></head><body><header><div class="kicker">Field notes · Tromsø, 69° N</div><h1>The aurora at 557.7 nanometres</h1>
<p>Three nights above the Arctic Circle, chasing a sky that glows green.</p></header><main>
<p>The aurora borealis is the solar wind made visible. Charged particles stream along Earth's magnetic field lines and
collide with oxygen and nitrogen a hundred kilometres up. Oxygen answers in the famous green line at 557.7 nm; higher
still, rarer collisions paint the crimson fringe at 630 nm.</p>
<h2>Night two — Kp index 6</h2><p>At 23:40 the corona opened directly overhead, a pulsing crown that turned the snow
pale emerald. The forecast had promised a quiet magnetosphere. Forecasts are suggestions.</p>
<p class="note">Camera: 14 mm, f/1.8, ISO 3200, four-second exposures. Keep batteries warm inside your jacket.</p>
<h2>What to pack</h2><p>Thermal layers, a headlamp with a red mode, a thermos of cocoa, and patience.</p></main></body></html>`;

const checklist = `<!doctype html><html><head><meta charset="utf-8"><title>Launch checklist — Iris 1.0</title><style>
body{margin:0;font:16px/1.6 "Segoe UI Variable Text","Segoe UI",sans-serif;color:#e7e9ee;background:#14161c}
.wrap{padding:48px 56px}h1{font:600 38px "Segoe UI Variable Display",sans-serif;margin:0 0 6px}
.sub{color:#8b93a7;margin-bottom:28px}.item{display:flex;gap:14px;align-items:center;padding:12px 16px;border-radius:10px;background:#1c1f27;margin:8px 0}
.box{width:20px;height:20px;border-radius:6px;border:2px solid #4b5266;flex:none}.done .box{background:#6aa8ff;border-color:#6aa8ff}
.done span{color:#8b93a7;text-decoration:line-through}.tag{margin-left:auto;font-size:12px;color:#6aa8ff;background:#1e2c45;padding:2px 10px;border-radius:99px}
</style></head><body><div class="wrap"><h1>Launch checklist</h1><div class="sub">Iris 1.0 · ship date Friday</div>
<div class="item done"><div class="box"></div><span>Live capture for every window</span><div class="tag">engine</div></div>
<div class="item done"><div class="box"></div><span>Read text inside windows with OCR</span><div class="tag">search</div></div>
<div class="item done"><div class="box"></div><span>Minimized windows through DWM thumbnails</span><div class="tag">engine</div></div>
<div class="item"><div class="box"></div><span>Send invoice 4471 to Northwind Traders</span><div class="tag">finance</div></div>
<div class="item"><div class="box"></div><span>Record the promotional reel</span><div class="tag">marketing</div></div>
<div class="item"><div class="box"></div><span>Book the Friday demo with the design team</span><div class="tag">people</div></div>
</div></body></html>`;

const reading = `<!doctype html><html><head><meta charset="utf-8"><title>Reading list</title><style>
body{margin:0;font:17px/1.7 Georgia,serif;color:#2b2622;background:#fbf7ef}.wrap{padding:52px 64px}
h1{font:600 40px "Segoe UI Variable Display",sans-serif;margin:0 0 24px}li{margin:10px 0}em{color:#8a5a2b}
</style></head><body><div class="wrap"><h1>Reading list</h1><ol>
<li><em>The Design of Everyday Things</em> — Don Norman</li><li><em>Thinking with Type</em> — Ellen Lupton</li>
<li><em>The Elements of Typographic Style</em> — Robert Bringhurst</li><li><em>Grid Systems in Graphic Design</em> — Josef Müller-Brockmann</li>
<li><em>A Pattern Language</em> — Christopher Alexander</li></ol></div></body></html>`;

const pages = { aurora, checklist, reading } as const;
for (const [name, html] of Object.entries(pages)) writeFileSync(join(scratch, `${name}.html`), html);
writeFileSync(
  join(scratch, 'wallpapers.ps1'),
  "$Host.UI.RawUI.WindowTitle = 'Wallpapers'\nGet-ChildItem C:\\Windows\\Web\\Wallpaper -Recurse -File | Sort-Object Length -Descending | Select-Object -First 16 Name, @{ Name = 'KB'; Expression = { [int]($_.Length / 1KB) } }, @{ Name = 'Folder'; Expression = { $_.Directory.Name } } | Format-Table -AutoSize\n",
);
// Paint opens images at 100%: hand it a copy that fits its canvas.
const bloom = decodeImage('C:\\Windows\\Web\\Wallpaper\\ThemeA\\img20.jpg', 760, 428);
if (bloom !== null) {
  const cropped = Buffer.alloc(760 * 428 * 4);
  const offsetX = Math.floor((bloom.width - 760) / 2);
  const offsetY = Math.floor((bloom.height - 428) / 2);
  for (let row = 0; row < 428; row += 1) bloom.pixels.copy(cropped, row * 760 * 4, ((row + offsetY) * bloom.width + offsetX) * 4, ((row + offsetY) * bloom.width + offsetX + 760) * 4);
  writeFileSync(join(scratch, 'bloom.png'), encodePNGFromBGRA(cropped, 760, 428));
}
const pageUrl = (name: keyof typeof pages): string => `file:///${join(scratch, `${name}.html`).replaceAll('\\', '/')}`;

const edge = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const opened: { hwnd: bigint; label: string }[] = [];
const spawned: ReturnType<typeof Bun.spawn>[] = [];

function placeWindow(hwnd: bigint, x: number, y: number, width: number, height: number): void {
  User32.ShowWindow(hwnd, 9 /* SW_RESTORE */);
  const windowRect = Buffer.alloc(16);
  const frame = Buffer.alloc(16);
  User32.GetWindowRect(hwnd, windowRect.ptr);
  Dwmapi.DwmGetWindowAttribute(hwnd, 9 /* DWMWA_EXTENDED_FRAME_BOUNDS */, frame.ptr, 16);
  const left = frame.readInt32LE(0) - windowRect.readInt32LE(0);
  const top = frame.readInt32LE(4) - windowRect.readInt32LE(4);
  const right = windowRect.readInt32LE(8) - frame.readInt32LE(8);
  const bottom = windowRect.readInt32LE(12) - frame.readInt32LE(12);
  User32.SetWindowPos(hwnd, 0n, region.x + x - left, region.y + y - top, width + left + right, height + top + bottom, 0x0014 /* SWP_NOZORDER | SWP_NOACTIVATE */);
}

async function waitForWindow(label: string, known: Set<bigint>, matches: (window: WindowInfo) => boolean, timeoutMilliseconds = 20_000): Promise<bigint> {
  const deadline = performance.now() + timeoutMilliseconds;
  while (performance.now() < deadline) {
    for (const window of enumerateWindows(new Set())) {
      if (known.has(window.hwnd) || !matches(window)) continue;
      known.add(window.hwnd);
      opened.push({ hwnd: window.hwnd, label });
      console.log(`  ✓ ${label} — ${window.title}`);
      return window.hwnd;
    }
    await Bun.sleep(120);
  }
  throw new Error(`timed out waiting for ${label}`);
}

function launch(command: string[], environment: Record<string, string> = {}): void {
  spawned.push(Bun.spawn(command, { env: { ...Bun.env, ...environment }, stderr: 'ignore', stdout: 'ignore' }));
}

async function stage(): Promise<Map<string, bigint>> {
  const known = new Set(enumerateWindows(new Set()).map((window) => window.hwnd));
  const windows = new Map<string, bigint>();
  console.log('Staging the desktop…');
  // Calculator first: it reacts to stray keys, so it should not be the focused window for long.
  launch(['calc.exe']);
  windows.set('calculator', await waitForWindow('Calculator', known, (window) => window.title === 'Calculator'));
  launch([edge, '--inprivate', '--new-window', pageUrl('aurora')]);
  windows.set('aurora', await waitForWindow('Aurora page', known, (window) => window.title.startsWith('Aurora')));
  launch([edge, '--inprivate', '--new-window', pageUrl('checklist')]);
  windows.set('checklist', await waitForWindow('Checklist page', known, (window) => window.title.startsWith('Launch checklist')));
  launch([edge, '--inprivate', '--new-window', pageUrl('reading')]);
  windows.set('reading', await waitForWindow('Reading list', known, (window) => window.title.startsWith('Reading list')));
  launch(['wt.exe', '-w', 'new', 'powershell', '-NoLogo', '-NoExit', '-ExecutionPolicy', 'Bypass', '-File', join(scratch, 'wallpapers.ps1')]);
  windows.set('terminal', await waitForWindow('Terminal', known, (window) => window.className === 'CASCADIA_HOSTING_WINDOW_CLASS'));
  launch(['explorer.exe', 'C:\\Windows\\Web\\Wallpaper\\ThemeA']);
  windows.set('explorer', await waitForWindow('Explorer', known, (window) => window.className === 'CabinetWClass'));
  launch(['mspaint.exe', join(scratch, 'bloom.png')]);
  windows.set('paint', await waitForWindow('Paint', known, (window) => window.title.includes('bloom')));
  launch(['charmap.exe']);
  windows.set('charmap', await waitForWindow('Character Map', known, (window) => window.title === 'Character Map'));
  launch([process.execPath, 'run', join(import.meta.dir, 'live-sky.ts')], { DEMO_DURATION_MS: '300000' });
  windows.set('sky', await waitForWindow('Live sky', known, (window) => window.title.startsWith('Live sky')));

  // A believable, overlapping desktop inside the 16:9 region (work area = region minus the taskbar).
  User32.SetWindowPos(windows.get('sky')!, 0xffff_ffff_ffff_fffen /* HWND_NOTOPMOST */, 0, 0, 0, 0, 0x0013);
  placeWindow(windows.get('aurora')!, 36, 34, 1180, 930);
  placeWindow(windows.get('checklist')!, 1030, 120, 860, 760);
  placeWindow(windows.get('terminal')!, 1620, 40, 900, 560);
  placeWindow(windows.get('sky')!, 1640, 470, 880, 600);
  placeWindow(windows.get('explorer')!, 90, 700, 1040, 640);
  placeWindow(windows.get('paint')!, 960, 690, 940, 660);
  placeWindow(windows.get('calculator')!, 2150, 830, 360, 520);
  placeWindow(windows.get('reading')!, 300, 220, 980, 800);
  placeWindow(windows.get('charmap')!, 1400, 300, 640, 560);
  // Stack order, bottom to top.
  for (const name of ['aurora', 'explorer', 'checklist', 'paint', 'terminal', 'sky', 'calculator']) User32.SetWindowPos(windows.get(name)!, 0n /* HWND_TOP */, 0, 0, 0, 0, 0x0013);
  await Bun.sleep(2500); // let every window paint (and the fractal zoom) before its DWM surface is kept for minimize
  User32.ShowWindow(windows.get('reading')!, 6 /* SW_MINIMIZE */);
  User32.ShowWindow(windows.get('charmap')!, 6 /* SW_MINIMIZE */);
  await Bun.sleep(800);
  // Leave a static page focused so a stray key press cannot change any staged window.
  User32.SetForegroundWindow(windows.get('aurora')!);
  return windows;
}

function cleanup(): void {
  for (const { hwnd } of opened) User32.PostMessageW(hwnd, 0x0010 /* WM_CLOSE */, 0n, 0n);
  for (const process of spawned) process.kill();
}

const script = [
  'open',
  'record 01-open The desktop lifts into Iris — every window live, read as it lands',
  'wait 3.2',
  'stop',
  'settle 30',
  'wait 0.4',
  'shot hero-grid',
  'record 02-hover Hover: parallax tilt, glare, and an accent ring follow the pointer',
  'glide 1500 900 900 520 1.2',
  'glide 900 520 1250 560 0.8',
  'wait 0.6',
  'stop',
  'shot hover',
  'record 03-search-aurora Type a word that only exists inside a window — Iris finds it on screen',
  'type aurora',
  'wait 1.6',
  'stop',
  'shot search-aurora',
  'key escape',
  'wait 0.7',
  'record 04-search-invoice Search reads every window: titles, apps, and the words inside them',
  'type invoice',
  'wait 1.6',
  'stop',
  'shot search-invoice',
  'key escape',
  'wait 0.7',
  'record 05-search-minimized Minimized windows are searchable too — seen through DWM, read with OCR',
  'type typographic',
  'wait 1.8',
  'stop',
  'shot search-minimized',
  'key escape',
  'wait 0.7',
  'key home',
  'wait 0.3',
  'record 06-flow Tab: the same windows become Cover Flow on a reflective floor',
  'key tab',
  'wait 1.3',
  'key right',
  'wait 0.45',
  'key right',
  'wait 0.45',
  'key right',
  'wait 1.0',
  'stop',
  'shot flow',
  'key home',
  'wait 0.6',
  'record 07-stack Tab again: Stack — your session receding through time',
  'key tab',
  'wait 1.3',
  'key down',
  'wait 0.6',
  'key down',
  'wait 1.0',
  'stop',
  'shot stack',
  'key tab',
  'wait 1.2',
  'record 08-colophon F1: under the hood, measured live',
  'key f1',
  'wait 2.4',
  'stop',
  'shot colophon',
  'key f1',
  'wait 1.0',
  'record 09-choose Enter: the chosen window flies home and takes focus',
  'type sky',
  'wait 0.9',
  'key enter',
  'wait 1.4',
  'stop',
  'quit',
].join('; ');

let exitCode = 0;
try {
  const windows = await stage();
  const hwnds = [...windows.values()].map((hwnd) => `0x${hwnd.toString(16)}`).join(',');
  console.log(`Recording into ${output} …`);
  const iris = Bun.spawn([process.execPath, 'run', join(root, 'packages', 'iris', 'index.ts')], {
    env: {
      ...Bun.env,
      IRIS_WALLPAPER: 'C:\\Windows\\Web\\Wallpaper\\ThemeA\\img21.jpg',
      IRIS_CLEAN_UNDERLAY: String(taskbar),
      IRIS_MONITOR: `${region.x},${region.y},${region.width},${region.height}`,
      IRIS_ONLY_HWNDS: hwnds,
      IRIS_RECORD: output,
      IRIS_SCRIPT: script,
    },
    stderr: 'inherit',
    stdout: 'inherit',
  });
  exitCode = await iris.exited;
  console.log(`Iris exited with ${exitCode}; ${screenWidth}x${screenHeight} screen, region ${region.width}x${region.height} at x=${region.x}`);
} finally {
  cleanup();
}
process.exit(exitCode);
