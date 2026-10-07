#!/usr/bin/env bun
// Iris — every window, every word.
//
//   bun run packages/iris/index.ts            open now, then stay resident: Alt+` summons, Ctrl+C quits
//
// Scripted runs (verification and real-footage capture; the overlay stays hidden unless IRIS_VISIBLE=1):
//   IRIS_SCRIPT="open; wait 1.5; shot grid; type invoice; wait 1; shot search; quit"   bun run packages/iris/index.ts
//   IRIS_RECORD=.scratch/iris-media   — where shots/clips go (clips need ffmpeg)
//   IRIS_ONLY_PIDS=1234,5678          — only show these processes' windows
//   IRIS_ONLY_HWNDS=0x1a2b,…          — only show these windows (the privacy-safe staged demo in example/reel.ts)
//   IRIS_MONITOR=x,y,width,height     — treat a region as the monitor (16:9 footage from an ultrawide)
//   IRIS_CLEAN_UNDERLAY=48            — footage underlay = wallpaper + the real taskbar strip (this many pixels tall)
//   IRIS_WALLPAPER=C:\path\image.jpg   — backdrop image instead of the desktop wallpaper
//   IRIS_NO_INDEX=1                   — skip OCR / accessibility reading
//   DEMO_DURATION_MS=8000             — quit after this long (repo-wide headless convention)

import Combase from '@bun-win32/combase';
import Shcore from '@bun-win32/shcore';

import { Iris } from './app';
import { Indexer } from './indexer';
import { Recorder } from './recorder';
import { Tray } from './tray';
import type { InputEvent } from './window';

const bootStarted = performance.now();
Shcore.SetProcessDpiAwareness(2);
Combase.RoInitialize(1);

const script = Bun.env.IRIS_SCRIPT ?? '';
const scripted = script.length > 0;
const headless = scripted && Bun.env.IRIS_VISIBLE !== '1';
const recordDirectory = Bun.env.IRIS_RECORD ?? (scripted ? '.scratch/iris-media' : '');
const recorder = recordDirectory.length > 0 ? new Recorder(recordDirectory, Number(Bun.env.IRIS_RECORD_SCALE ?? 1)) : null;
if (recorder !== null && Bun.env.IRIS_CLEAN_UNDERLAY) {
  recorder.clean = true;
  recorder.taskbarHeight = Number(Bun.env.IRIS_CLEAN_UNDERLAY);
}
const onlyProcesses = Bun.env.IRIS_ONLY_PIDS ? new Set(Bun.env.IRIS_ONLY_PIDS.split(',').map((value) => Number(value.trim()))) : null;
const onlyWindows = Bun.env.IRIS_ONLY_HWNDS ? new Set(Bun.env.IRIS_ONLY_HWNDS.split(',').map((value) => BigInt(value.trim()))) : null;
const indexer = Bun.env.IRIS_NO_INDEX === '1' ? null : new Indexer();
const monitorOverride = Bun.env.IRIS_MONITOR ? Bun.env.IRIS_MONITOR.split(',').map(Number) : null;
const monitor = monitorOverride === null ? null : { height: monitorOverride[3]!, width: monitorOverride[2]!, x: monitorOverride[0]!, y: monitorOverride[1]! };
const iris = new Iris({ headless, indexer, monitor, onlyProcesses, onlyWindows, recorder, wallpaper: Bun.env.IRIS_WALLPAPER ?? null });

const yieldToEventLoop = (): Promise<void> => new Promise((resolve) => setImmediate(resolve));

iris.refreshWindows();
const warmDeadline = performance.now() + 260;
while (performance.now() < warmDeadline && iris.cards.some((card) => !card.window.minimized && !card.hasPixels)) {
  iris.pollCaptures();
  await Bun.sleep(4);
}
iris.bootMilliseconds = performance.now() - bootStarted;

let quitting = false;
function shutdown(): void {
  if (quitting) return;
  quitting = true;
  iris.running = false;
}
process.on('SIGINT', shutdown);

const virtualKeys: Record<string, number> = { back: 0x08, delete: 0x2e, down: 0x28, end: 0x23, enter: 0x0d, escape: 0x1b, f1: 0x70, home: 0x24, left: 0x25, right: 0x27, tab: 0x09, up: 0x26 };

async function runScript(): Promise<void> {
  const step = 1 / (recorder?.fps ?? 60);
  const advance = async (seconds: number): Promise<void> => {
    const frames = Math.max(1, Math.round(seconds / step));
    for (let index = 0; index < frames; index += 1) {
      iris.window.pump();
      iris.frame(step);
      await recorder?.drain();
      await yieldToEventLoop();
    }
  };
  const inject = (event: InputEvent): void => {
    iris.window.events.push(event);
  };
  for (const raw of script.split(';')) {
    const command = raw.trim();
    if (command.length === 0) continue;
    const [verb = '', ...rest] = command.split(/\s+/);
    const argument = rest.join(' ');
    switch (verb) {
      case 'open':
        if (recorder !== null) recorder.captureDesktop(iris.renderer, iris.monitorForPointer());
        iris.open();
        break;
      case 'close':
        iris.close(null);
        break;
      case 'choose':
        iris.close(iris.cards.find((card) => card.window.title.toLowerCase().includes(argument.toLowerCase())) ?? null);
        break;
      case 'wait':
        await advance(Number(argument));
        break;
      case 'settle': {
        const deadline = performance.now() + Number(argument || 20) * 1000;
        while ((indexer?.pending ?? 0) > 0 && performance.now() < deadline) {
          iris.window.pump();
          iris.frame(step);
          await Bun.sleep(5);
        }
        break;
      }
      case 'type':
        for (const character of argument.replaceAll('_', ' ')) {
          inject({ kind: 'character', text: character });
          await advance(0.09);
        }
        break;
      case 'key':
        inject({ alt: false, control: argument.startsWith('ctrl+'), kind: 'key', shift: argument.startsWith('shift+'), virtualKey: virtualKeys[argument.replace(/^(ctrl|shift)\+/, '')] ?? argument.toUpperCase().charCodeAt(0) });
        break;
      case 'move': {
        const [x = '0', y = '0'] = argument.split(/\s+/);
        inject({ kind: 'pointer-move', x: Number(x), y: Number(y) });
        break;
      }
      case 'glide': {
        const [fromX = 0, fromY = 0, toX = 0, toY = 0, seconds = 1] = argument.split(/\s+/).map(Number);
        const frames = Math.max(1, Math.round(seconds / step));
        for (let frame = 1; frame <= frames; frame += 1) {
          const progress = frame / frames;
          const eased = progress * progress * (3 - 2 * progress);
          inject({ kind: 'pointer-move', x: fromX + (toX - fromX) * eased, y: fromY + (toY - fromY) * eased });
          iris.window.pump();
          iris.frame(step);
          await recorder?.drain();
          await yieldToEventLoop();
        }
        break;
      }
      case 'hover': {
        const card = iris.cards.find((candidate) => candidate.window.title.toLowerCase().includes(argument.toLowerCase()));
        if (card !== undefined) inject({ kind: 'pointer-move', x: card.placement.x.value + 40, y: card.placement.y.value - 30 });
        break;
      }
      case 'shot':
        recorder?.shot(argument, '');
        await advance(step);
        break;
      case 'record': {
        const [name = 'clip', ...note] = argument.split(/\s+/);
        recorder?.startClip(name, note.join(' '), iris.surface.width, iris.surface.height);
        break;
      }
      case 'stop':
        await recorder?.stopClip();
        break;
      case 'log':
        console.log(`[script] ${argument}`);
        break;
      case 'quit':
        return;
      default:
        console.warn(`[script] unknown command: ${command}`);
    }
  }
}

function banner(): void {
  const minimized = iris.cards.filter((card) => card.window.minimized).length;
  console.log('');
  console.log('  \x1b[1mIris\x1b[0m \x1b[2m— every window, every word\x1b[0m');
  console.log(`  \x1b[2mbooted in ${iris.bootMilliseconds.toFixed(0)} ms on ${iris.device.adapterName} · ${iris.cards.length - minimized} live windows · ${minimized} minimized, seen through DWM\x1b[0m`);
  console.log('  \x1b[2mAlt+` summon · type to search · Tab layout · Enter go · Esc back · F1 under the hood · Ctrl+C quit\x1b[0m');
  console.log('');
}

if (scripted) {
  await runScript();
  await recorder?.stopClip();
  await recorder?.writeManifest({ adapter: iris.device.adapterName, bootMilliseconds: iris.bootMilliseconds, indexLog: indexer?.log ?? [], script });
} else {
  banner();
  iris.tray = new Tray(iris.window.hwnd, 'Iris — every window, every word (Alt+`)');
  iris.tray.notify(
    'Iris is running',
    iris.hotkeyAvailable ? 'Press Alt+` anytime to see every window. Right-click this icon to quit.' : 'Alt+` is already taken (is another Iris running?) — click this icon to open Iris, right-click to quit.',
  );
  iris.open();
  const deadline = Bun.env.DEMO_DURATION_MS ? performance.now() + Number(Bun.env.DEMO_DURATION_MS) : Infinity;
  while (iris.running && performance.now() < deadline) {
    iris.window.pump();
    if (iris.state === 'hidden') {
      iris.frame();
      iris.backgroundTick();
      iris.window.waitForMessage(40);
    } else {
      iris.surface.waitForFrame();
      iris.frame();
    }
    await yieldToEventLoop();
  }
}

iris.tray?.remove();
indexer?.terminate();
recorder?.release();
process.exit(0);
