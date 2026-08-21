/**
 * codex-usage-taskbar — live Codex rate-limit meter pinned to the Windows taskbar.
 *
 * Renders the active Codex subscription rate-limit windows, each with its used
 * percent and time until reset, as a compact widget in the bottom-left taskbar.
 * It launches the documented `codex app-server` interface and asks
 * `account/rateLimits/read`, so Codex owns authentication and token refresh; this
 * script never reads, copies, or sends credentials itself. A ChatGPT-backed Codex
 * login and the `codex` CLI on PATH are required. The widget supports one or two
 * windows and labels them from the server-provided duration. A sampled taskbar
 * color is keyed away so the meters float on a transparent surface. Left-click
 * refreshes immediately; right-click quits.
 *
 * APIs demonstrated:
 * - Codex app-server (initialize + account/rateLimits/read over JSONL stdio)
 * - user32 (SetProcessDPIAware, FindWindowW + GetWindowRect to locate Shell_TrayWnd,
 *   RegisterClassExW + CreateWindowExW, SetWindowLongPtrW + SetParent + MoveWindow
 *   to reparent the widget into the taskbar, ShowWindow + color-key transparency,
 *   PeekMessageW/TranslateMessage/DispatchMessageW, GetDC/ReleaseDC, and SetWindowPos)
 * - gdi32 (GetPixel taskbar color sampling, SetDIBitsToDevice software compositing,
 *   CreateFontW + TextOutW text, BitBlt + CreateCompatibleBitmap + GetDIBits verification)
 * - terminal (encodePNG for CAPTURE_PNG and RENDER_PNG verification images)
 *
 * Env: CODEX_USAGE_X / CODEX_USAGE_WIDTH (pixel overrides), CODEX_USAGE_POLL_MS
 * (default 60000), CODEX_USAGE_LIMIT_ID (select a model-specific quota bucket),
 * CODEX_USAGE_FAKE=24,67 (offline 5-hour/7-day visual fixture), CODEX_BIN (CLI
 * executable override), CAPTURE_PNG=path (taskbar screenshot), RENDER_PNG=path
 * (widget-only render), DEMO_DURATION_MS (self-exit).
 *
 * Run: bun run example/codex-usage-taskbar.ts
 */
import { JSCallback } from 'bun:ffi';

import { encodePNG } from '@bun-win32/terminal';
import { ShowWindowCommand, WindowStyles } from '@bun-win32/user32';
import { GDI32, User32 } from '../index';

User32.Preload([
  'CreateWindowExW',
  'DefWindowProcW',
  'DestroyWindow',
  'DispatchMessageW',
  'FindWindowW',
  'GetDC',
  'GetWindowRect',
  'MoveWindow',
  'PeekMessageW',
  'PostQuitMessage',
  'RegisterClassExW',
  'ReleaseDC',
  'SetLayeredWindowAttributes',
  'SetParent',
  'SetProcessDPIAware',
  'SetWindowLongPtrW',
  'SetWindowPos',
  'ShowWindow',
  'TranslateMessage',
  'UnregisterClassW',
]);
GDI32.Preload([
  'BitBlt',
  'CreateCompatibleBitmap',
  'CreateCompatibleDC',
  'CreateFontW',
  'DeleteDC',
  'DeleteObject',
  'GetDIBits',
  'GetPixel',
  'GetTextMetricsW',
  'IntersectClipRect',
  'RestoreDC',
  'SaveDC',
  'SelectObject',
  'SetBkMode',
  'SetDIBitsToDevice',
  'SetTextAlign',
  'SetTextColor',
  'TextOutW',
]);

const WM_DESTROY = 0x0002;
const WM_PAINT = 0x000f;
const WM_LBUTTONDOWN = 0x0201;
const WM_RBUTTONDOWN = 0x0204;
const PM_REMOVE = 0x0001;
const LWA_COLORKEY = 0x0000_0001;
const CAPTUREBLT = 0x4000_0000;
const SRCCOPY = 0x00cc_0020;
const SWP_NOSIZE_NOMOVE_NOACTIVATE = 0x0000_0013;

const POLL_INTERVAL_MS = Number(Bun.env.CODEX_USAGE_POLL_MS ?? 60_000);
const REQUEST_TIMEOUT_MS = 15_000;
const CODEX_BIN = Bun.env.CODEX_BIN ?? 'codex';

const wide = (text: string): Buffer => Buffer.from(`${text}\0`, 'utf16le');

interface RateWindow {
  resetsAt: number | null;
  utilization: number;
  windowDurationMinutes: number;
}

const rateWindowFrom = (value: unknown): RateWindow | null => {
  if (typeof value !== 'object' || value === null) return null;
  const utilization = 'usedPercent' in value && typeof value.usedPercent === 'number' ? value.usedPercent : null;
  const windowDurationMinutes = 'windowDurationMins' in value && typeof value.windowDurationMins === 'number' ? value.windowDurationMins : null;
  const resetsAt = 'resetsAt' in value && typeof value.resetsAt === 'number' ? value.resetsAt : null;
  if (utilization === null || !Number.isFinite(utilization) || windowDurationMinutes === null || !Number.isFinite(windowDurationMinutes) || windowDurationMinutes <= 0) return null;
  return { resetsAt: resetsAt !== null && Number.isFinite(resetsAt) ? resetsAt : null, utilization: Math.max(0, Math.min(100, utilization)), windowDurationMinutes };
};

const rateLimitBucketFrom = (value: unknown): unknown => {
  if (typeof value !== 'object' || value === null) return null;
  const requestedLimitIdentifier = Bun.env.CODEX_USAGE_LIMIT_ID;
  const rateLimitsByIdentifier = 'rateLimitsByLimitId' in value ? value.rateLimitsByLimitId : null;
  if (requestedLimitIdentifier) {
    if (typeof rateLimitsByIdentifier !== 'object' || rateLimitsByIdentifier === null) return null;
    return Reflect.get(rateLimitsByIdentifier, requestedLimitIdentifier);
  }
  if ('rateLimits' in value && value.rateLimits !== null) return value.rateLimits;
  if (typeof rateLimitsByIdentifier !== 'object' || rateLimitsByIdentifier === null) return null;
  const codexRateLimits: unknown = Reflect.get(rateLimitsByIdentifier, 'codex');
  if (codexRateLimits !== undefined) return codexRateLimits;
  const firstIdentifier = Object.keys(rateLimitsByIdentifier)[0];
  return firstIdentifier ? Reflect.get(rateLimitsByIdentifier, firstIdentifier) : null;
};

const rateWindowsFrom = (value: unknown): RateWindow[] => {
  const rateLimits = rateLimitBucketFrom(value);
  if (typeof rateLimits !== 'object' || rateLimits === null) return [];
  const windows: RateWindow[] = [];
  if ('primary' in rateLimits) {
    const primary = rateWindowFrom(rateLimits.primary);
    if (primary) windows.push(primary);
  }
  if ('secondary' in rateLimits) {
    const secondary = rateWindowFrom(rateLimits.secondary);
    if (secondary) windows.push(secondary);
  }
  return windows.sort((left, right) => left.windowDurationMinutes - right.windowDurationMinutes);
};

const fakeRateWindows = (): RateWindow[] | null => {
  const fixture = Bun.env.CODEX_USAGE_FAKE;
  if (!fixture) return null;
  const percentages = fixture.split(',').map((value) => Number(value.trim()));
  if (percentages.length < 1 || percentages.length > 2 || percentages.some((value) => !Number.isFinite(value) || value < 0 || value > 100)) {
    throw new Error('CODEX_USAGE_FAKE must contain one or two percentages from 0 to 100, for example 24,67.');
  }
  const nowSeconds = Math.floor(Date.now() / 1000);
  const durations = [300, 10_080];
  return percentages.map((utilization, index) => ({ resetsAt: nowSeconds + durations[index] * 60, utilization, windowDurationMinutes: durations[index] }));
};

interface PendingRequest {
  child: CodexProcess;
  reject: (reason: Error) => void;
  resolve: (value: unknown) => void;
  timeout: ReturnType<typeof setTimeout>;
}

type CodexProcess = Bun.Subprocess<'pipe', 'pipe', 'ignore'>;

const pendingRequests = new Map<number, PendingRequest>();
let appServer: CodexProcess | null = null;
let appServerStart: Promise<CodexProcess> | null = null;
let nextRequestIdentifier = 1;

const protocolErrorMessage = (value: unknown): string => {
  if (typeof value === 'object' && value !== null && 'message' in value && typeof value.message === 'string') return value.message;
  return 'Codex app-server returned an unknown error.';
};

const handleAppServerLine = (line: string): void => {
  if (!line.trim()) return;
  let message: unknown;
  try {
    message = JSON.parse(line);
  } catch {
    return;
  }
  if (typeof message !== 'object' || message === null || 'method' in message || !('id' in message) || typeof message.id !== 'number' || (!('result' in message) && !('error' in message))) return;
  const pending = pendingRequests.get(message.id);
  if (!pending) return;
  pendingRequests.delete(message.id);
  clearTimeout(pending.timeout);
  if ('error' in message) {
    pending.reject(new Error(protocolErrorMessage(message.error)));
    return;
  }
  pending.resolve(message.result);
};

const rejectPendingRequests = (child: CodexProcess, reason: Error): void => {
  for (const [identifier, pending] of pendingRequests) {
    if (pending.child !== child) continue;
    pendingRequests.delete(identifier);
    clearTimeout(pending.timeout);
    pending.reject(reason);
  }
};

const consumeAppServerOutput = async (child: CodexProcess): Promise<void> => {
  const reader = child.stdout.getReader();
  const decoder = new TextDecoder();
  let buffered = '';
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      buffered += decoder.decode(chunk.value, { stream: true });
      let newlineIndex = buffered.indexOf('\n');
      while (newlineIndex >= 0) {
        handleAppServerLine(buffered.slice(0, newlineIndex).replace(/\r$/, ''));
        buffered = buffered.slice(newlineIndex + 1);
        newlineIndex = buffered.indexOf('\n');
      }
    }
    buffered += decoder.decode();
    handleAppServerLine(buffered.replace(/\r$/, ''));
  } catch (error) {
    if (appServer === child) console.error(`Codex app-server output failed: ${String(error)}`);
  } finally {
    if (appServer === child) appServer = null;
    rejectPendingRequests(child, new Error('Codex app-server exited.'));
  }
};

const writeMessage = (child: CodexProcess, message: unknown): void => {
  child.stdin.write(`${JSON.stringify(message)}\n`);
  child.stdin.flush();
};

const requestAppServer = (child: CodexProcess, method: string, params?: unknown): Promise<unknown> => {
  const id = nextRequestIdentifier++;
  const response = new Promise<unknown>((resolve, reject) => {
    const timeout = setTimeout(() => {
      pendingRequests.delete(id);
      reject(new Error(`${method} timed out after ${REQUEST_TIMEOUT_MS / 1000}s.`));
    }, REQUEST_TIMEOUT_MS);
    pendingRequests.set(id, { child, reject, resolve, timeout });
  });
  try {
    writeMessage(child, params === undefined ? { id, method } : { id, method, params });
  } catch (error) {
    const pending = pendingRequests.get(id);
    if (pending) {
      pendingRequests.delete(id);
      clearTimeout(pending.timeout);
      pending.reject(new Error(`Could not write to Codex app-server: ${String(error)}`));
    }
  }
  return response;
};

const startAppServer = async (): Promise<CodexProcess> => {
  const child = Bun.spawn({ cmd: [CODEX_BIN, 'app-server', '-c', 'model_reasoning_effort=xhigh'], stdin: 'pipe', stdout: 'pipe', stderr: 'ignore', windowsHide: true });
  appServer = child;
  void consumeAppServerOutput(child);
  try {
    await requestAppServer(child, 'initialize', { clientInfo: { name: 'bun_win32_codex_usage_taskbar', title: 'bun-win32 Codex usage taskbar', version: '1.0.0' } });
    writeMessage(child, { method: 'initialized', params: {} });
    return child;
  } catch (error) {
    if (appServer === child) appServer = null;
    child.kill();
    throw error;
  }
};

const ensureAppServer = async (): Promise<CodexProcess> => {
  if (appServerStart) return appServerStart;
  if (appServer && appServer.exitCode === null) return appServer;
  appServerStart = startAppServer();
  try {
    return await appServerStart;
  } finally {
    appServerStart = null;
  }
};

const fixtureWindows = fakeRateWindows();
let rateWindows: RateWindow[] = fixtureWindows ?? [];
let connectionState: 'error' | 'ok' | 'starting' = fixtureWindows ? 'ok' : 'starting';
let haveData = rateWindows.length > 0;
let consecutiveFailures = 0;

const recordFailure = (reason: string): void => {
  connectionState = 'error';
  consecutiveFailures += 1;
  console.error(`usage fetch failed (${consecutiveFailures} in a row): ${reason}`);
};

const refreshUsage = async (): Promise<void> => {
  if (fixtureWindows) {
    rateWindows = fixtureWindows;
    connectionState = 'ok';
    haveData = true;
    return;
  }
  try {
    const child = await ensureAppServer();
    const result = await requestAppServer(child, 'account/rateLimits/read');
    const nextRateWindows = rateWindowsFrom(result);
    if (nextRateWindows.length === 0) {
      const selection = Bun.env.CODEX_USAGE_LIMIT_ID ? ` for limit ID ${Bun.env.CODEX_USAGE_LIMIT_ID}` : '';
      throw new Error(`No ChatGPT rate-limit windows were returned${selection}. Sign in to Codex with ChatGPT; API-key accounts do not expose subscription limits.`);
    }
    rateWindows = nextRateWindows.slice(0, 2);
    connectionState = 'ok';
    consecutiveFailures = 0;
    haveData = true;
  } catch (error) {
    recordFailure(String(error));
  }
};

const formatPercent = (utilization: number): string => `${Math.round(utilization)}%`;

const formatReset = (resetsAt: number | null): string => {
  if (resetsAt === null) return '';
  const totalMinutes = Math.ceil((resetsAt * 1000 - Date.now()) / 60_000);
  if (totalMinutes <= 0) return 'now';
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (totalMinutes < 60) return `${minutes}m`;
  if (totalMinutes < 2880) return `${days * 24 + hours}h ${minutes}m`;
  return `${days}d ${hours}h`;
};

const formatWindowDuration = (minutes: number): string => {
  if (minutes >= 1440 && minutes % 1440 === 0) return `${minutes / 1440}d`;
  if (minutes >= 60 && minutes % 60 === 0) return `${minutes / 60}h`;
  return `${minutes}m`;
};

interface Tint {
  blue: number;
  green: number;
  red: number;
}

const tintFrom = (rgb: number): Tint => ({ blue: rgb & 0xff, green: (rgb >> 8) & 0xff, red: (rgb >> 16) & 0xff });
const mixTint = (from: Tint, to: Tint, amount: number): Tint => ({ blue: from.blue + (to.blue - from.blue) * amount, green: from.green + (to.green - from.green) * amount, red: from.red + (to.red - from.red) * amount });

const WHITE_TINT = tintFrom(0xff_ff_ff);
const CODEX_TINT = tintFrom(0x10_a3_7f);

const utilizationGradient = (utilization: number): [Tint, Tint] => {
  if (utilization >= 90) return [tintFrom(0xc8_3a_36), tintFrom(0xff_7a_59)];
  if (utilization >= 70) return [tintFrom(0xc8_82_1e), tintFrom(0xf7_c5_48)];
  return [tintFrom(0x1f_9d_5b), tintFrom(0x43_d1_7c)];
};

if (User32.SetProcessDPIAware() === 0) console.error('SetProcessDPIAware failed — taskbar coordinates may be DPI-virtualized.');

const taskbarHandle = User32.FindWindowW(wide('Shell_TrayWnd').ptr!, null);
if (taskbarHandle === 0n) throw new Error('Shell_TrayWnd not found — no taskbar in this session.');
const taskbarRect = Buffer.alloc(16);
if (User32.GetWindowRect(taskbarHandle, taskbarRect.ptr!) === 0) throw new Error('GetWindowRect(Shell_TrayWnd) failed.');
const taskbarLeft = taskbarRect.readInt32LE(0);
const taskbarTop = taskbarRect.readInt32LE(4);
const taskbarHeight = taskbarRect.readInt32LE(12) - taskbarTop;
const scale = taskbarHeight / 48;

const widgetHeight = taskbarHeight;
const widgetWidth = Number(Bun.env.CODEX_USAGE_WIDTH ?? Math.round(236 * scale));
const widgetX = taskbarLeft + Number(Bun.env.CODEX_USAGE_X ?? Math.round(218 * scale));
const widgetY = taskbarTop;

const taskbarSampleDC = User32.GetDC(0n);
const sampledTaskbarColor = GDI32.GetPixel(taskbarSampleDC, taskbarLeft + Math.round(2 * scale), widgetY + (taskbarHeight >> 1));
void User32.ReleaseDC(0n, taskbarSampleDC);
const backgroundColor = sampledTaskbarColor === 0xffff_ffff ? 0x0026_1820 : sampledTaskbarColor;
const backgroundTint: Tint = { blue: (backgroundColor >> 16) & 0xff, green: (backgroundColor >> 8) & 0xff, red: backgroundColor & 0xff };
const trackTint = mixTint(backgroundTint, WHITE_TINT, 0.13);
const colorrefOf = (tint: Tint): number => (Math.round(tint.blue) << 16) | (Math.round(tint.green) << 8) | Math.round(tint.red);
const textColor = 0x00ff_ffff;
const dimTextColor = colorrefOf(mixTint(backgroundTint, WHITE_TINT, 0.66));

let closing = false;
let refreshRequested = false;
let repaintRequested = true;

const wndProc = new JSCallback(
  (hWnd: bigint, msg: number, wParam: bigint, lParam: bigint): bigint => {
    switch (msg) {
      case WM_LBUTTONDOWN:
        refreshRequested = true;
        return 0n;
      case WM_RBUTTONDOWN:
        closing = true;
        return 0n;
      case WM_PAINT:
        repaintRequested = true;
        return BigInt(User32.DefWindowProcW(hWnd, msg, wParam, lParam));
      case WM_DESTROY:
        closing = true;
        User32.PostQuitMessage(0);
        return 0n;
      default:
        return BigInt(User32.DefWindowProcW(hWnd, msg, wParam, lParam));
    }
  },
  { args: ['u64', 'u32', 'u64', 'i64'], returns: 'i64' },
);

const className = wide(`CodexUsageTaskbar_${process.pid}`);
const windowClass = Buffer.alloc(80);
windowClass.writeUInt32LE(80, 0);
windowClass.writeBigUInt64LE(BigInt(wndProc.ptr!), 8);
windowClass.writeBigUInt64LE(BigInt(className.ptr!), 64);
if (!User32.RegisterClassExW(windowClass.ptr!)) {
  wndProc.close();
  throw new Error('RegisterClassExW failed.');
}

const exStyle = 0x0008_0000 /* WS_EX_LAYERED */ | 0x0000_0080 /* WS_EX_TOOLWINDOW */ | 0x0800_0000; /* WS_EX_NOACTIVATE */
const hwnd = User32.CreateWindowExW(exStyle, className.ptr!, wide('Codex usage').ptr!, WindowStyles.WS_POPUP, widgetX, widgetY, widgetWidth, widgetHeight, 0n, 0n, 0n, null);
if (hwnd === 0n) {
  User32.UnregisterClassW(className.ptr!, 0n);
  wndProc.close();
  throw new Error('CreateWindowExW failed — likely no interactive desktop.');
}
void User32.SetWindowLongPtrW(hwnd, -16 /* GWL_STYLE */, BigInt(WindowStyles.WS_CHILD | WindowStyles.WS_VISIBLE));
const parentedToTaskbar = User32.SetParent(hwnd, taskbarHandle) !== 0n;
if (!parentedToTaskbar) {
  console.error('SetParent(Shell_TrayWnd) failed — falling back to a plain topmost overlay (the taskbar can cover it when activated).');
  void User32.SetWindowLongPtrW(hwnd, -16 /* GWL_STYLE */, BigInt(WindowStyles.WS_POPUP | WindowStyles.WS_VISIBLE));
}
if (User32.SetLayeredWindowAttributes(hwnd, backgroundColor, 0xff, LWA_COLORKEY) === 0) console.error('SetLayeredWindowAttributes failed — transparent background may be unavailable.');
User32.MoveWindow(hwnd, parentedToTaskbar ? widgetX - taskbarLeft : widgetX, parentedToTaskbar ? 0 : widgetY, widgetWidth, widgetHeight, 1);
User32.ShowWindow(hwnd, ShowWindowCommand.SW_SHOWNOACTIVATE);
const zOrderAnchor = parentedToTaskbar ? 0n /* HWND_TOP */ : 0xffff_ffff_ffff_ffffn; /* HWND_TOPMOST */
User32.SetWindowPos(hwnd, zOrderAnchor, 0, 0, 0, 0, SWP_NOSIZE_NOMOVE_NOACTIVATE);

const primaryFont = GDI32.CreateFontW(-Math.round(12 * scale), 0, 0, 0, 600, 0, 0, 0, 0, 0, 0, 5 /* CLEARTYPE_QUALITY */, 0, wide('Segoe UI').ptr!);
const percentFont = GDI32.CreateFontW(-Math.round(11 * scale), 0, 0, 0, 700, 0, 0, 0, 0, 0, 0, 5 /* CLEARTYPE_QUALITY */, 0, wide('Segoe UI').ptr!);

const frame = Buffer.alloc(widgetWidth * widgetHeight * 4);
const frameInfo = Buffer.alloc(40);
frameInfo.writeUInt32LE(40, 0);
frameInfo.writeInt32LE(widgetWidth, 4);
frameInfo.writeInt32LE(-widgetHeight, 8);
frameInfo.writeUInt16LE(1, 12);
frameInfo.writeUInt16LE(32, 14);

const clamp01 = (value: number): number => (value < 0 ? 0 : value > 1 ? 1 : value);
const blendPixel = (x: number, y: number, tint: Tint, alpha: number): void => {
  if (x < 0 || y < 0 || x >= widgetWidth || y >= widgetHeight) return;
  const index = (y * widgetWidth + x) * 4;
  frame[index] = Math.round(frame[index] + (tint.blue - frame[index]) * alpha);
  frame[index + 1] = Math.round(frame[index + 1] + (tint.green - frame[index + 1]) * alpha);
  frame[index + 2] = Math.round(frame[index + 2] + (tint.red - frame[index + 2]) * alpha);
};

const drawRoundedRect = (left: number, top: number, right: number, bottom: number, radius: number, tintAt: (x: number, y: number) => Tint, alpha: number, borderTint?: Tint, borderAlpha?: number): void => {
  const centerX = (left + right) / 2;
  const centerY = (top + bottom) / 2;
  const halfWidth = (right - left) / 2 - radius;
  const halfHeight = (bottom - top) / 2 - radius;
  for (let y = Math.floor(top) - 1; y <= Math.ceil(bottom) + 1; y++) {
    for (let x = Math.floor(left) - 1; x <= Math.ceil(right) + 1; x++) {
      const offsetX = Math.max(Math.abs(x + 0.5 - centerX) - halfWidth, 0);
      const offsetY = Math.max(Math.abs(y + 0.5 - centerY) - halfHeight, 0);
      const distance = Math.hypot(offsetX, offsetY) - radius;
      const coverage = clamp01(0.5 - distance);
      if (coverage > 0) blendPixel(x, y, tintAt(x + 0.5, y + 0.5), alpha * coverage);
      if (borderTint && borderAlpha) {
        const ring = clamp01(1.1 - Math.abs(distance)) * clamp01(0.5 + distance);
        if (ring > 0) blendPixel(x, y, borderTint, borderAlpha * ring);
      }
    }
  }
};

const barLeft = Math.round(34 * scale);
const barRight = widgetWidth - Math.round(62 * scale);
const barHeight = Math.round(15 * scale);

const cellHeightOf = (font: bigint): number => {
  const metricsDC = User32.GetDC(0n);
  const previousFont = GDI32.SelectObject(metricsDC, font);
  const textMetrics = Buffer.alloc(64);
  void GDI32.GetTextMetricsW(metricsDC, textMetrics.ptr!);
  GDI32.SelectObject(metricsDC, previousFont);
  void User32.ReleaseDC(0n, metricsDC);
  return textMetrics.readInt32LE(0);
};
const primaryTextOffsetY = Math.round((barHeight - cellHeightOf(primaryFont)) / 2);
const percentTextOffsetY = Math.round((barHeight - cellHeightOf(percentFont)) / 2);

const rowTops = (): number[] => (rateWindows.length === 1 ? [Math.round((widgetHeight - barHeight) / 2)] : [Math.round(6 * scale), Math.round(26 * scale)]);

const fillRightOf = (rateWindow: RateWindow): number => (rateWindow.utilization <= 0 ? barLeft : Math.max(barLeft + barHeight, barLeft + ((barRight - barLeft) * Math.min(100, rateWindow.utilization)) / 100));

const composeBar = (rowTop: number, rateWindow: RateWindow): void => {
  const rowBottom = rowTop + barHeight;
  const pillRadius = barHeight / 2;
  drawRoundedRect(barLeft, rowTop, barRight, rowBottom, pillRadius, () => trackTint, 1);
  for (const quarter of [0.25, 0.5, 0.75]) {
    const tickX = Math.round(barLeft + (barRight - barLeft) * quarter);
    for (let tickY = rowTop + Math.round(3 * scale); tickY < rowBottom - Math.round(3 * scale); tickY++) blendPixel(tickX, tickY, backgroundTint, 0.45);
  }
  if (rateWindow.utilization > 0) {
    const fillRight = fillRightOf(rateWindow);
    const [darkTint, brightTint] = utilizationGradient(rateWindow.utilization);
    const glossBottom = rowTop + barHeight * 0.45;
    const fillTintAt = (x: number, y: number): Tint => {
      const gradient = mixTint(darkTint, brightTint, clamp01((x - barLeft) / (fillRight - barLeft)));
      return y < glossBottom ? mixTint(gradient, WHITE_TINT, 0.16) : gradient;
    };
    drawRoundedRect(barLeft, rowTop, fillRight, rowBottom, pillRadius, fillTintAt, 1);
  }
};

let hasDrawn = false;
const paint = (deviceContext: bigint): void => {
  hasDrawn = true;
  for (let index = 0; index < frame.length; index += 4) {
    frame[index] = backgroundTint.blue;
    frame[index + 1] = backgroundTint.green;
    frame[index + 2] = backgroundTint.red;
  }
  drawRoundedRect(5 * scale, 9 * scale, 7.5 * scale, widgetHeight - 9 * scale, 1.25 * scale, () => CODEX_TINT, 1);
  const rows = rowTops();
  if (haveData) {
    for (let index = 0; index < rateWindows.length; index++) composeBar(rows[index], rateWindows[index]);
    if (connectionState !== 'ok' && consecutiveFailures >= 3) {
      const dotRadius = 2.5 * scale;
      const dotCenterX = widgetWidth - 9 * scale;
      drawRoundedRect(dotCenterX - dotRadius, rows[0] + barHeight / 2 - dotRadius, dotCenterX + dotRadius, rows[0] + barHeight / 2 + dotRadius, dotRadius, () => CODEX_TINT, 1);
    }
  }
  void GDI32.SetDIBitsToDevice(deviceContext, 0, 0, widgetWidth, widgetHeight, 0, 0, 0, widgetHeight, frame.ptr!, frameInfo.ptr!, 0);
  GDI32.SetBkMode(deviceContext, 1 /* TRANSPARENT */);
  const textOut = (x: number, y: number, text: string, color: number, align: number): void => {
    void GDI32.SetTextAlign(deviceContext, align);
    GDI32.SetTextColor(deviceContext, color);
    void GDI32.TextOutW(deviceContext, x, y, wide(text).ptr!, text.length);
  };
  if (haveData) {
    for (let index = 0; index < rateWindows.length; index++) {
      const rowTop = rows[index];
      const rateWindow = rateWindows[index];
      GDI32.SelectObject(deviceContext, primaryFont);
      textOut(barLeft - Math.round(6 * scale), rowTop + primaryTextOffsetY, formatWindowDuration(rateWindow.windowDurationMinutes), dimTextColor, 2 /* TA_RIGHT */);
      textOut(barRight + Math.round(8 * scale), rowTop + primaryTextOffsetY, formatReset(rateWindow.resetsAt), dimTextColor, 0 /* TA_LEFT */);
      GDI32.SelectObject(deviceContext, percentFont);
      const percentText = formatPercent(rateWindow.utilization);
      const percentCenterX = (barLeft + barRight) >> 1;
      const fillRight = Math.round(fillRightOf(rateWindow));
      void GDI32.SaveDC(deviceContext);
      void GDI32.IntersectClipRect(deviceContext, barLeft, rowTop, fillRight, rowTop + barHeight);
      textOut(percentCenterX, rowTop + percentTextOffsetY, percentText, textColor, 6 /* TA_CENTER */);
      void GDI32.RestoreDC(deviceContext, -1);
      void GDI32.SaveDC(deviceContext);
      void GDI32.IntersectClipRect(deviceContext, fillRight, rowTop, barRight, rowTop + barHeight);
      textOut(percentCenterX, rowTop + percentTextOffsetY, percentText, dimTextColor, 6 /* TA_CENTER */);
      void GDI32.RestoreDC(deviceContext, -1);
    }
  } else {
    GDI32.SelectObject(deviceContext, primaryFont);
    textOut(Math.round(12 * scale), Math.round(7 * scale), 'Codex usage', textColor, 0 /* TA_LEFT */);
    const message = connectionState === 'error' ? 'unavailable — see console' : 'starting app-server…';
    textOut(Math.round(12 * scale), Math.round(27 * scale), message, dimTextColor, 0 /* TA_LEFT */);
  }
};

const draw = (): void => {
  const deviceContext = User32.GetDC(hwnd);
  if (deviceContext === 0n) return;
  paint(deviceContext);
  void User32.ReleaseDC(hwnd, deviceContext);
};

const messageBuffer = Buffer.alloc(48);
const pump = (): void => {
  while (User32.PeekMessageW(messageBuffer.ptr!, 0n, 0, 0, PM_REMOVE) !== 0) {
    User32.TranslateMessage(messageBuffer.ptr!);
    User32.DispatchMessageW(messageBuffer.ptr!);
  }
};

const captureTaskbarRegion = async (path: string): Promise<void> => {
  const captureX = Math.max(taskbarLeft, widgetX - Math.round(220 * scale));
  const captureWidth = widgetX - captureX + widgetWidth + Math.round(120 * scale);
  const screenDC = User32.GetDC(0n);
  const memoryDC = GDI32.CreateCompatibleDC(screenDC);
  const bitmap = GDI32.CreateCompatibleBitmap(screenDC, captureWidth, taskbarHeight);
  GDI32.SelectObject(memoryDC, bitmap);
  void GDI32.BitBlt(memoryDC, 0, 0, captureWidth, taskbarHeight, screenDC, captureX, widgetY, SRCCOPY | CAPTUREBLT);
  const bitmapInfo = Buffer.alloc(40);
  bitmapInfo.writeUInt32LE(40, 0);
  bitmapInfo.writeInt32LE(captureWidth, 4);
  bitmapInfo.writeInt32LE(-taskbarHeight, 8);
  bitmapInfo.writeUInt16LE(1, 12);
  bitmapInfo.writeUInt16LE(32, 14);
  const bgraPixels = Buffer.alloc(captureWidth * taskbarHeight * 4);
  void GDI32.GetDIBits(memoryDC, bitmap, 0, taskbarHeight, bgraPixels.ptr!, bitmapInfo.ptr!, 0);
  void GDI32.DeleteObject(bitmap);
  void GDI32.DeleteDC(memoryDC);
  void User32.ReleaseDC(0n, screenDC);
  const rgbPixels = new Uint8Array(captureWidth * taskbarHeight * 3);
  for (let pixelIndex = 0; pixelIndex < captureWidth * taskbarHeight; pixelIndex++) {
    rgbPixels[pixelIndex * 3] = bgraPixels[pixelIndex * 4 + 2];
    rgbPixels[pixelIndex * 3 + 1] = bgraPixels[pixelIndex * 4 + 1];
    rgbPixels[pixelIndex * 3 + 2] = bgraPixels[pixelIndex * 4];
  }
  await Bun.write(path, encodePNG(rgbPixels, captureWidth, taskbarHeight));
  console.log(`[shot] ${path}`);
};

const renderFramePNG = async (path: string): Promise<void> => {
  const screenDC = User32.GetDC(0n);
  const memoryDC = GDI32.CreateCompatibleDC(screenDC);
  const bitmap = GDI32.CreateCompatibleBitmap(screenDC, widgetWidth, widgetHeight);
  GDI32.SelectObject(memoryDC, bitmap);
  paint(memoryDC);
  const bitmapInfo = Buffer.alloc(40);
  bitmapInfo.writeUInt32LE(40, 0);
  bitmapInfo.writeInt32LE(widgetWidth, 4);
  bitmapInfo.writeInt32LE(-widgetHeight, 8);
  bitmapInfo.writeUInt16LE(1, 12);
  bitmapInfo.writeUInt16LE(32, 14);
  const bgraPixels = Buffer.alloc(widgetWidth * widgetHeight * 4);
  void GDI32.GetDIBits(memoryDC, bitmap, 0, widgetHeight, bgraPixels.ptr!, bitmapInfo.ptr!, 0);
  void GDI32.DeleteObject(bitmap);
  void GDI32.DeleteDC(memoryDC);
  void User32.ReleaseDC(0n, screenDC);
  const rgbPixels = new Uint8Array(widgetWidth * widgetHeight * 3);
  for (let pixelIndex = 0; pixelIndex < widgetWidth * widgetHeight; pixelIndex++) {
    rgbPixels[pixelIndex * 3] = bgraPixels[pixelIndex * 4 + 2];
    rgbPixels[pixelIndex * 3 + 1] = bgraPixels[pixelIndex * 4 + 1];
    rgbPixels[pixelIndex * 3 + 2] = bgraPixels[pixelIndex * 4];
  }
  await Bun.write(path, encodePNG(rgbPixels, widgetWidth, widgetHeight));
  console.log(`[render] ${path}`);
};

console.log(`Codex usage widget at (${widgetX}, ${widgetY}) ${widgetWidth}×${widgetHeight} — polling every ${POLL_INTERVAL_MS / 1000}s. Left-click = refresh, right-click = quit.`);

const startedAt = Date.now();
const demoDurationMs = Number(Bun.env.DEMO_DURATION_MS ?? 0);
let lastFetchAt = 0;
let fetchInFlight = false;
let captured = false;
let rendered = false;
while (!closing) {
  pump();
  const now = Date.now();
  if (!fetchInFlight && ((refreshRequested && now - lastFetchAt >= 3_000) || now - lastFetchAt >= POLL_INTERVAL_MS)) {
    refreshRequested = false;
    lastFetchAt = now;
    fetchInFlight = true;
    void refreshUsage().then(() => {
      fetchInFlight = false;
      repaintRequested = true;
    });
  }
  if (repaintRequested) {
    repaintRequested = false;
    draw();
    User32.SetWindowPos(hwnd, zOrderAnchor, 0, 0, 0, 0, SWP_NOSIZE_NOMOVE_NOACTIVATE);
  }
  if (!captured && hasDrawn && haveData && Bun.env.CAPTURE_PNG) {
    captured = true;
    await captureTaskbarRegion(Bun.env.CAPTURE_PNG);
  }
  if (!rendered && hasDrawn && haveData && Bun.env.RENDER_PNG) {
    rendered = true;
    await renderFramePNG(Bun.env.RENDER_PNG);
  }
  if (demoDurationMs > 0 && now - startedAt >= demoDurationMs) closing = true;
  await Bun.sleep(100);
}

const stopAppServer = (): void => {
  if (!appServer) return;
  appServer.stdin.end();
  appServer.kill();
  appServer = null;
};
stopAppServer();
void GDI32.DeleteObject(percentFont);
void GDI32.DeleteObject(primaryFont);
User32.DestroyWindow(hwnd);
User32.UnregisterClassW(className.ptr!, 0n);
wndProc.close();
