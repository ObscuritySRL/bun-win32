// The live app: one instance in the notification area. It wires the overlay window, the swap
// chain, the global hotkey, the tray and its menu around the Eye, and runs the render loop —
// asleep while closed, paced by the display while open.

import { ptr } from 'bun:ffi';

import Dwmapi from '@bun-win32/dwmapi';
import { DXGI_FORMAT_B8G8R8A8_UNORM, encodePNGFromBGRA, readbackTexture } from '@bun-win32/gpu';
import Shcore from '@bun-win32/shcore';
import User32 from '@bun-win32/user32';

import type { DisplayInfo, WorkerOptions } from '../shared/protocol';
import { copyImage, readText } from './clipboard';
import { copy, formatSpan } from './copy';
import { Eye, type Presenter, startMemory } from './eye';
import { createIcon, renderMark } from './icon';
import type { Surface } from './renderer';
import { loadSettings, saveSettings, setStartWithWindows, startsWithWindows } from './settings';
import { SwapChain } from './swapchain';
import { Tray } from './tray';
import { type InputEvent, OverlayWindow, openMessage } from './window';

const commands = { budget: 0x40, forget: 0x3, look: 0x1, pause: 0x2, quit: 0x5, startup: 0x4 } as const;
const budgets = [0x1000_0000, 0x2000_0000, 0x4000_0000, 0x8000_0000];
const hotkeys = [
  { label: 'Win+Shift+Z', modifiers: 0x8 | 0x4 | 0x4000 },
  { label: 'Ctrl+Alt+Z', modifiers: 0x2 | 0x1 | 0x4000 },
] as const;
const perMonitorAware = 0x2;

class WindowPresenter implements Presenter {
  /** Autopilot: write the next presented frame (read from the back buffer) to this PNG path. */
  snapshot: string | null = null;
  #swapChain: SwapChain | null = null;
  readonly #eye: () => Eye;
  readonly #window: OverlayWindow;

  constructor(window: OverlayWindow, eye: () => Eye) {
    this.#window = window;
    this.#eye = eye;
  }

  hide(): void {
    this.#window.hide();
  }

  prepare(display: DisplayInfo): void {
    this.#window.prepare(display.left, display.top, display.width, display.height, true);
  }

  present(): void {
    const swapChain = this.#swapChain;
    if (swapChain === null) return;
    if (this.snapshot !== null) {
      const pixels = readbackTexture(swapChain.texture, swapChain.width, swapChain.height, 4, DXGI_FORMAT_B8G8R8A8_UNORM);
      void Bun.write(this.snapshot, encodePNGFromBGRA(pixels, swapChain.width, swapChain.height));
      this.snapshot = null;
    }
    swapChain.present();
  }

  /** Wait for DWM to compose the presented first frame, then uncloak: no flash, no empty frame. */
  reveal(): void {
    Dwmapi.DwmFlush();
    this.#window.reveal();
  }

  surface(display: DisplayInfo): { scale: number; surface: Surface } {
    if (this.#swapChain === null) this.#swapChain = new SwapChain(this.#window.hwnd, display.width, display.height, this.#eye().painter);
    else this.#swapChain.resize(display.width, display.height);
    return { scale: monitorScale(display), surface: this.#swapChain };
  }

  wait(): void {
    this.#swapChain?.wait();
  }
}

function displayUnderPointer(displays: readonly DisplayInfo[]): number {
  const point = new Int32Array(new ArrayBuffer(8));
  User32.GetCursorPos(ptr(point));
  const index = displays.findIndex((display) => point[0]! >= display.left && point[0]! < display.left + display.width && point[1]! >= display.top && point[1]! < display.top + display.height);
  return Math.max(0, index);
}

function monitorScale(display: DisplayInfo): number {
  const center = BigInt(Math.round(display.left + display.width / 2)) & 0xffff_ffffn;
  const middle = BigInt(Math.round(display.top + display.height / 2)) & 0xffff_ffffn;
  const monitor = User32.MonitorFromPoint((middle << 32n) | center, 2);
  const dpiX = new Uint32Array(new ArrayBuffer(4));
  const dpiY = new Uint32Array(new ArrayBuffer(4));
  if (Shcore.GetDpiForMonitor(monitor, 0, ptr(dpiX), ptr(dpiY)) !== 0) return 1;
  return dpiX[0]! / 96;
}

export async function runShell(): Promise<void> {
  const existing = User32.FindWindowW(ptr(Buffer.from('AfterimageOverlay\0', 'utf16le')), null);
  if (existing !== 0n) {
    User32.PostMessageW(existing, openMessage, 0n, 0n);
    return;
  }
  Shcore.SetProcessDpiAwareness(perMonitorAware);
  const settings = await loadSettings();
  const window = new OverlayWindow();
  const worker = startMemory();
  const options: WorkerOptions = { budgetBytes: settings.budgetBytes, captureHertz: 20, source: 'screen', stageEpoch: 0, stageHeight: 0, stageScale: 1, stageScenario: '', stageWidth: 0 };
  let tray: Tray | null = null;
  const clock = { epoch: () => Date.now(), now: () => performance.now() };
  const presenter = new WindowPresenter(window, () => eye);
  const eye: Eye = new Eye(worker, options, presenter, clock, {
    copyImage: (dib) => copyImage(window.hwnd, dib),
    readClipboardText: () => readText(window.hwnd),
    recording: (state) => tray?.setTooltip(state === 'paused' ? copy.tooltipPaused : state === 'unavailable' ? copy.unavailable : 'Afterimage'),
    unavailable: () => tray?.notify(copy.unavailable, copy.unavailableDetail),
  });
  const hotkey = hotkeys.find((candidate) => User32.RegisterHotKey(window.hwnd, 1, candidate.modifiers, 0x5a)) ?? hotkeys[0];
  await eye.ready;
  for (const display of eye.displays) {
    eye.warm(display);
    window.warm(display.left, display.top, display.width, display.height);
  }
  tray = new Tray(window.hwnd, createIcon(renderMark(eye.painter, Math.round(16 * monitorScale(eye.displays[0]!))), Math.round(16 * monitorScale(eye.displays[0]!))));
  tray.add();
  if (!settings.welcomed) {
    tray.notify(copy.firstRun, copy.firstRunDetail(hotkey.label));
    settings.welcomed = true;
    await saveSettings(settings);
  }
  const executable = process.execPath;
  const compiled = !/[\\/]bun(\.exe)?$/i.test(executable);
  let running = true;

  const menu = async (): Promise<void> => {
    if (tray === null) return;
    const chosen = tray.showMenu([
      { default: true, id: commands.look, label: `Look back\t${hotkey.label}` },
      { id: commands.pause, label: eye.paused ? 'Resume recording' : 'Pause recording' },
      {
        children: budgets.map((bytes, index) => ({ checked: settings.budgetBytes === bytes, id: commands.budget + index, label: bytes >= 0x4000_0000 ? `${bytes / 0x4000_0000} GB` : `${bytes / 0x10_0000} MB` })),
        id: 0,
        label: 'Remember up to',
      },
      { id: commands.forget, label: 'Forget everything' },
      { id: 0, label: '' },
      { checked: compiled && startsWithWindows(), disabled: !compiled, id: commands.startup, label: 'Start with Windows' },
      { id: 0, label: '' },
      { id: commands.quit, label: 'Quit Afterimage' },
    ]);
    if (chosen === commands.look) eye.open(displayUnderPointer(eye.displays));
    else if (chosen === commands.pause) eye.send({ type: eye.paused ? 'resume' : 'pause' });
    else if (chosen === commands.forget) eye.send({ type: 'forget' });
    else if (chosen === commands.startup) setStartWithWindows(!startsWithWindows(), executable);
    else if (chosen === commands.quit) running = false;
    else if (chosen >= commands.budget && chosen < commands.budget + budgets.length) {
      settings.budgetBytes = budgets[chosen - commands.budget]!;
      eye.send({ bytes: settings.budgetBytes, type: 'budget' });
      await saveSettings(settings);
    }
  };

  // AFTERIMAGE_AUTOPILOT="1500:open 2600:key Left 12 4200:key Escape 6000:quit" drives the live app
  // on the real desktop for testing: timed actions, measured results printed at the end.
  const autopilot = (Bun.env.AFTERIMAGE_AUTOPILOT ?? '')
    .split(/\s+(?=\d+:)/)
    .filter((step) => step.length > 0)
    .map((step) => {
      const [at, ...action] = step.split(/[:\s]+/);
      return { action, at: Number(at) };
    });
  const startedAt = performance.now();
  const cpuStart = process.cpuUsage();
  let lastTooltip = 0;
  while (running) {
    window.pump();
    const events = window.drain();
    const forView: InputEvent[] = [];
    for (const event of events) {
      if (event.type === 'hotkey') eye.toggle(displayUnderPointer(eye.displays));
      else if (event.type === 'tray') {
        if (event.lParam === 0x400 || event.lParam === 0x202) eye.open(displayUnderPointer(eye.displays));
        else if (event.lParam === 0x7b || event.lParam === 0x205) await menu();
      } else if (event.type === 'taskbarCreated') tray.add();
      else if (event.type === 'openRequested') eye.open(displayUnderPointer(eye.displays));
      else forView.push(event);
    }
    while (autopilot.length > 0 && performance.now() - startedAt >= autopilot[0]!.at) {
      const [verb, argument, count] = autopilot.shift()!.action;
      if (verb === 'open') eye.open(displayUnderPointer(eye.displays));
      else if (verb === 'quit') running = false;
      else if (verb === 'snap') presenter.snapshot = `${Bun.env.AFTERIMAGE_SHOTS ?? '.'}/${argument}.png`;
      else if (verb === 'wheel') forView.push({ delta: Number(argument), horizontal: false, type: 'wheel' });
      else if (verb === 'key') {
        const key = { Escape: 0x1b, Left: 0x25, Right: 0x27, Space: 0x20 }[argument ?? ''] ?? 0;
        for (let times = 0; times < Number(count ?? 1); times += 1) {
          forView.push({ alt: false, control: false, down: true, key, repeat: false, shift: false, type: 'key' });
          forView.push({ alt: false, control: false, down: false, key, repeat: false, shift: false, type: 'key' });
        }
      }
    }
    const drew = eye.step(forView);
    const now = performance.now();
    if (now - lastTooltip > 5_000 && eye.diagnostics.stats !== null) {
      lastTooltip = now;
      if (!eye.paused) tray.setTooltip(copy.tooltip(formatSpan(Date.now() - eye.diagnostics.stats.oldestEpoch)));
    }
    if (eye.visible) {
      if (!drew) User32.MsgWaitForMultipleObjectsEx(0, null, 8, 0x4ff, 0x4);
      await new Promise((resolve) => setImmediate(resolve));
    } else {
      // Closed: sleep on the message queue, so the hotkey wakes us at once (Bun.sleep would add up to 25 ms).
      User32.MsgWaitForMultipleObjectsEx(0, null, 25, 0x4ff, 0x4);
      await new Promise((resolve) => setImmediate(resolve));
    }
  }
  if (autopilot.length > 0 || Bun.env.AFTERIMAGE_AUTOPILOT !== undefined) {
    const cpu = process.cpuUsage(cpuStart);
    const { diagnostics, frames } = eye;
    console.log(
      JSON.stringify({
        bootMilliseconds: diagnostics.bootMilliseconds,
        composeMilliseconds: diagnostics.composeMilliseconds,
        cpuPercent: ((cpu.user + cpu.system) / 1_000 / (performance.now() - startedAt)) * 100,
        frameMedian: frames.median,
        frameWorst: frames.worstEver,
        openMilliseconds: diagnostics.openMilliseconds,
        stats: diagnostics.stats,
      }),
    );
  }
  tray.remove();
  User32.UnregisterHotKey(window.hwnd, 1);
  eye.send({ type: 'quit' });
  await Bun.sleep(150);
  window.dispose();
}
