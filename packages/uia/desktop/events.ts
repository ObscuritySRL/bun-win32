// Window + process event hooks. SetWinEventHook (WINEVENT_OUTOFCONTEXT) delivers events as posted messages;
// pumped on the MAIN thread, the callback fires synchronously on the pumping thread — no foreign-thread hazard
// under Bun. Process creation has no WinEvent, so it is polled via a toolhelp32 snapshot diff. The pump yields
// with `await Bun.sleep`, so timers and the rest of the event loop keep running while a watcher is active.
//
// UIA property/structure event SUBSCRIPTION (IUIAutomation::AddPropertyChangedEventHandler / AddStructureChanged-
// EventHandler / AddAutomationEventHandler) is deliberately NOT bound: UIA invokes those COM callbacks on its own
// internal worker thread, not the STA thread that registered them, and a Bun JSCallback trampoline driven from a
// foreign native thread segfaults (the repo-wide foreign-thread hazard). That is exactly why WINEVENT_OUTOFCONTEXT
// is safe here — it POSTS messages back to the registering thread instead of calling a callback on a foreign one.
// The supported substitute for "notice a property/subtree change" is polling: waitFor (element.ts) / waitForIdle
// (idle.ts) sample one cached round-trip per interval on this same STA thread. This is a settled design choice,
// not an unfinished feature.

import { FFIType, JSCallback } from 'bun:ffi';

import Kernel32 from '@bun-win32/kernel32';
import User32 from '@bun-win32/user32';

import { listWindows, type WindowInfo } from '../element/window';

const EVENT_SYSTEM_FOREGROUND = 0x0000_0003;
const EVENT_SYSTEM_MINIMIZESTART = 0x0000_0016;
const EVENT_SYSTEM_MINIMIZEEND = 0x0000_0017;
const EVENT_OBJECT_DESTROY = 0x0000_8001;
const EVENT_OBJECT_SHOW = 0x0000_8002;
const EVENT_OBJECT_NAMECHANGE = 0x0000_800c;
const WINEVENT_OUTOFCONTEXT = 0x0000_0000;
const WINEVENT_SKIPOWNPROCESS = 0x0000_0002;
const PM_REMOVE = 0x0000_0001;
const OBJID_WINDOW = 0;
const CHILDID_SELF = 0;
const GA_ROOT = 2;
const TH32CS_SNAPPROCESS = 0x0000_0002;
const INVALID_HANDLE = 0xffff_ffff_ffff_ffffn;

export type WindowEventType = 'appear' | 'close' | 'focus' | 'minimize' | 'restore' | 'rename';

export interface WindowEvent {
  type: WindowEventType;
  hWnd: bigint;
  title: string;
  className: string;
  processId: number;
}

export interface WindowWatcher {
  stop(): void;
}

/** A window match: an exact/partial title, a class name, or an owning process id. A bare string is a title substring. */
export type WindowMatch = string | { title?: string | RegExp; className?: string; process?: number };

function windowTitle(hWnd: bigint): string {
  const buffer = Buffer.alloc(1024);
  const length = User32.GetWindowTextW(hWnd, buffer.ptr!, 512);
  return length > 0 ? buffer.subarray(0, length * 2).toString('utf16le') : '';
}

function windowClassName(hWnd: bigint): string {
  const buffer = Buffer.alloc(512);
  const length = User32.GetClassNameW(hWnd, buffer.ptr!, 256);
  return length > 0 ? buffer.subarray(0, length * 2).toString('utf16le') : '';
}

function windowProcessId(hWnd: bigint): number {
  const out = Buffer.alloc(4);
  User32.GetWindowThreadProcessId(hWnd, out.ptr!);
  return out.readUInt32LE(0);
}

/** A real top-level application window: visible, titled, and its own root (filters tooltips, IME, message-only). */
function isAppWindow(hWnd: bigint): boolean {
  return User32.IsWindowVisible(hWnd) !== 0 && User32.GetAncestor(hWnd, GA_ROOT) === hWnd && windowTitle(hWnd).length > 0;
}

function toPredicate(match: WindowMatch): (window: WindowInfo) => boolean {
  // String/title substring matches CASE-INSENSITIVELY, mirroring attach (mcp.ts) — a differently-cased title
  // (waiting on 'Save As' for the actual 'Save as', or a lowercased app name) must not silently time out. className
  // stays exact (class names are case-sensitive identifiers); a RegExp carries its own case flags.
  if (typeof match === 'string') {
    const lower = match.toLowerCase();
    return (window) => window.title.toLowerCase().includes(lower);
  }
  return (window) => {
    if (match.process !== undefined && window.processId !== match.process) return false;
    if (match.className !== undefined && window.className !== match.className) return false;
    if (match.title !== undefined) {
      if (match.title instanceof RegExp) return match.title.test(window.title);
      return window.title.toLowerCase().includes(match.title.toLowerCase());
    }
    return true;
  };
}

/**
 * Watch top-level window lifecycle and focus changes via SetWinEventHook, delivering each as a `WindowEvent`:
 * `appear` (a new app window shown), `close` (one we'd announced is destroyed), `focus` (foreground change),
 * `minimize`/`restore`, and `rename` (title change). Returns a handle whose `stop()` unhooks and ends the pump.
 * The handler runs on the main thread. Windows already open when the watcher starts are seeded, so `appear`
 * fires only for genuinely new ones.
 */
export function watchWindows(handler: (event: WindowEvent) => void, options: { pollMs?: number } = {}): WindowWatcher {
  const known = new Map<bigint, { title: string; className: string; processId: number }>();
  for (const window of listWindows()) known.set(window.hWnd, { title: window.title, className: window.className, processId: window.processId });

  const callback = new JSCallback(
    (_hook: bigint, event: number, hWnd: bigint, idObject: number, idChild: number) => {
      if (idObject !== OBJID_WINDOW || idChild !== CHILDID_SELF || hWnd === 0n) return;
      if (event === EVENT_OBJECT_DESTROY) {
        const prior = known.get(hWnd);
        if (prior !== undefined) {
          known.delete(hWnd);
          handler({ type: 'close', hWnd, title: prior.title, className: prior.className, processId: prior.processId });
        }
        return;
      }
      if (event === EVENT_OBJECT_SHOW || event === EVENT_SYSTEM_FOREGROUND) {
        if (!isAppWindow(hWnd)) return;
        const title = windowTitle(hWnd);
        const className = windowClassName(hWnd);
        const processId = windowProcessId(hWnd);
        const isNew = !known.has(hWnd);
        known.set(hWnd, { title, className, processId });
        handler({ type: isNew ? 'appear' : 'focus', hWnd, title, className, processId });
        return;
      }
      if (event === EVENT_SYSTEM_MINIMIZESTART || event === EVENT_SYSTEM_MINIMIZEEND) {
        if (!known.has(hWnd) && !isAppWindow(hWnd)) return;
        handler({ type: event === EVENT_SYSTEM_MINIMIZESTART ? 'minimize' : 'restore', hWnd, title: windowTitle(hWnd), className: windowClassName(hWnd), processId: windowProcessId(hWnd) });
        return;
      }
      if (event === EVENT_OBJECT_NAMECHANGE) {
        const prior = known.get(hWnd);
        if (prior === undefined || !isAppWindow(hWnd)) return;
        const title = windowTitle(hWnd);
        if (title === prior.title) return;
        known.set(hWnd, { ...prior, title });
        handler({ type: 'rename', hWnd, title, className: prior.className, processId: prior.processId });
      }
    },
    { args: [FFIType.u64, FFIType.u32, FFIType.u64, FFIType.i32, FFIType.i32, FFIType.u32, FFIType.u32], returns: FFIType.void },
  );

  const flags = (WINEVENT_OUTOFCONTEXT | WINEVENT_SKIPOWNPROCESS) >>> 0;
  const systemHook = User32.SetWinEventHook(EVENT_SYSTEM_FOREGROUND, EVENT_SYSTEM_MINIMIZEEND, 0n, callback.ptr!, 0, 0, flags);
  const objectHook = User32.SetWinEventHook(EVENT_OBJECT_DESTROY, EVENT_OBJECT_NAMECHANGE, 0n, callback.ptr!, 0, 0, flags);

  let running = true;
  const message = Buffer.alloc(48); // MSG (x64)
  void (async () => {
    while (running) {
      while (User32.PeekMessageW(message.ptr!, 0n, 0, 0, PM_REMOVE) !== 0) {
        User32.TranslateMessage(message.ptr!);
        User32.DispatchMessageW(message.ptr!);
      }
      await Bun.sleep(options.pollMs ?? 15);
    }
  })();

  return {
    stop(): void {
      if (!running) return;
      running = false;
      User32.UnhookWinEvent(systemHook);
      User32.UnhookWinEvent(objectHook);
      callback.close();
    },
  };
}

/**
 * Resolve when a window matching `match` exists — immediately if one is already open, otherwise on the first
 * matching `appear`/`focus`/`rename` event. Rejects after `timeout` ms (default 30s). Use it to gate an action
 * on a window the agent is waiting for (a dialog, an app it just launched, a page that finished navigating).
 */
export function waitForWindow(match: WindowMatch, options: { timeout?: number } = {}): Promise<WindowInfo> {
  const timeout = options.timeout ?? 30000;
  const predicate = toPredicate(match);
  const existing = listWindows().find(predicate);
  if (existing !== undefined) return Promise.resolve(existing);
  return new Promise<WindowInfo>((resolve, reject) => {
    const watcher = watchWindows((event) => {
      if (event.type !== 'appear' && event.type !== 'focus' && event.type !== 'rename') return;
      const info: WindowInfo = { hWnd: event.hWnd, title: event.title, className: event.className, processId: event.processId };
      if (predicate(info)) {
        clearTimeout(timer);
        resolve(info);
        // Defer stop() OUT of this synchronous frame: we are inside the SetWinEventHook JSCallback's own native
        // invocation, and stop()→callback.close() frees that trampoline while it is still on the stack — a
        // use-after-free that segfaults the process the instant the awaited window appears. resolve() is idempotent
        // and stop() guards on `running`, so the deferred (possibly double) stop is harmless.
        queueMicrotask(() => watcher.stop());
      }
    });
    const timer = setTimeout(() => {
      watcher.stop();
      reject(new Error(`waitForWindow: no window matched ${JSON.stringify(match)} within ${timeout}ms`));
    }, timeout);
  });
}

/**
 * Resolve when a window matching `match` is GONE — immediately if none is currently open, otherwise on the first
 * matching `close` event (the close event carries the window's LAST-KNOWN title/className/processId, since the hWnd is
 * already dead). Rejects after `timeout` ms (default 30s). The mirror of waitForWindow: gate an action on a window
 * DISAPPEARING — a dialog dismissed, a splash/progress window finishing, an app exiting.
 */
export function waitForWindowGone(match: WindowMatch, options: { timeout?: number } = {}): Promise<void> {
  const timeout = options.timeout ?? 30000;
  const predicate = toPredicate(match);
  if (listWindows().find(predicate) === undefined) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const watcher = watchWindows((event) => {
      if (event.type !== 'close') return;
      const info: WindowInfo = { hWnd: event.hWnd, title: event.title, className: event.className, processId: event.processId };
      if (predicate(info)) {
        clearTimeout(timer);
        resolve();
        // Defer stop() out of the JSCallback's own native frame — same use-after-free guard as waitForWindow's appear path.
        queueMicrotask(() => watcher.stop());
      }
    });
    const timer = setTimeout(() => {
      watcher.stop();
      reject(new Error(`waitForWindowGone: a window matching ${JSON.stringify(match)} was still open after ${timeout}ms`));
    }, timeout);
  });
}

/** Every running process as `{ processId, name }` (toolhelp32 snapshot). The image name is the bare exe (e.g. `notepad.exe`). */
export function listProcesses(): { processId: number; name: string }[] {
  const snapshot = Kernel32.CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
  if (snapshot === INVALID_HANDLE || snapshot === 0n) return [];
  try {
    const entry = Buffer.alloc(568); // PROCESSENTRY32W (x64): th32ProcessID @8, szExeFile @44 (260 WCHAR)
    entry.writeUInt32LE(568, 0); // dwSize
    const processes: { processId: number; name: string }[] = [];
    let ok = Kernel32.Process32FirstW(snapshot, entry.ptr!);
    while (ok !== 0) {
      processes.push({ processId: entry.readUInt32LE(8), name: entry.subarray(44, 564).toString('utf16le').split('\0')[0]! });
      ok = Kernel32.Process32NextW(snapshot, entry.ptr!);
    }
    return processes;
  } finally {
    Kernel32.CloseHandle(snapshot);
  }
}

/**
 * Resolve with the process id when a process whose image name contains `imageName` (case-insensitive) is
 * running — immediately if already present, otherwise polled until it starts. Rejects after `timeout` ms. Use it
 * to trigger work the moment a process the agent is waiting on spawns (a build, an installer, a launched app).
 */
export async function waitForProcess(imageName: string, options: { timeout?: number; interval?: number } = {}): Promise<number> {
  const timeout = options.timeout ?? 30000;
  const interval = options.interval ?? 200;
  const needle = imageName.toLowerCase();
  const start = Bun.nanoseconds();
  for (;;) {
    const hit = listProcesses().find((process) => process.name.toLowerCase().includes(needle));
    if (hit !== undefined) return hit.processId;
    if ((Bun.nanoseconds() - start) / 1e6 >= timeout) throw new Error(`waitForProcess: "${imageName}" did not start within ${timeout}ms`);
    await Bun.sleep(interval);
  }
}
