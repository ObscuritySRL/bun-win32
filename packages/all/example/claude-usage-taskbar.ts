/**
 * claude-usage-taskbar — live Claude rate-limit meter pinned to the Windows taskbar.
 *
 * Renders your Claude subscription usage (the 5-hour window and the weekly window,
 * each with its utilization percent and time until reset) as a compact two-line widget
 * sitting on the taskbar, right of the Windows weather widget in the bottom-left
 * corner. Zero configuration: it authenticates by reading the OAuth access token
 * Claude Code already keeps at ~/.claude/.credentials.json and polling the same
 * usage endpoint Claude Code's /usage screen uses. No API key, no login. The
 * background color is sampled from the taskbar itself so the widget blends in.
 * Left-click refreshes immediately; right-click quits. If the token has expired
 * (Claude Code not opened for many hours) the widget shows a stale marker until
 * Claude Code refreshes the token on its next run — it deliberately never uses
 * the refresh token itself, so it can never invalidate Claude Code's session.
 *
 * APIs demonstrated:
 * - user32 (SetProcessDPIAware, FindWindowW + GetWindowRect to locate Shell_TrayWnd,
 *   RegisterClassExW + CreateWindowExW for a layered tool window, then
 *   SetWindowLongPtrW(GWL_STYLE → WS_CHILD) + SetParent + MoveWindow to reparent
 *   it INSIDE Shell_TrayWnd — so the taskbar can never raise itself over the
 *   widget — with ShowWindow + SetLayeredWindowAttributes, a PeekMessageW/
 *   TranslateMessage/DispatchMessageW message pump, FillRect, GetDC/ReleaseDC,
 *   and SetWindowPos HWND_TOP reassertion each poll)
 * - gdi32 (GetPixel taskbar color sampling, CreateFontW + TextOutW ClearType text,
 *   CreateSolidBrush, BitBlt + CreateCompatibleBitmap + GetDIBits screenshot verify)
 * - terminal (encodePNG for the CAPTURE_PNG verification screenshot)
 *
 * Env: CLAUDE_USAGE_X / CLAUDE_USAGE_WIDTH (pixel overrides), CLAUDE_USAGE_POLL_MS
 * (default 60000), CAPTURE_PNG=path (write a taskbar screenshot after first draw),
 * DEMO_DURATION_MS (self-exit for headless runs).
 *
 * Run: bun run example/claude-usage-taskbar.ts
 */
import { JSCallback } from 'bun:ffi';

import { ShowWindowCommand, WindowStyles } from '@bun-win32/user32';
import { encodePNG } from '@bun-win32/terminal';
import { GDI32, User32 } from '../index';

User32.Preload([
  'CreateWindowExW',
  'DefWindowProcW',
  'DestroyWindow',
  'DispatchMessageW',
  'FillRect',
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
GDI32.Preload(['BitBlt', 'CreateCompatibleBitmap', 'CreateCompatibleDC', 'CreateFontW', 'CreateSolidBrush', 'DeleteDC', 'DeleteObject', 'GetDIBits', 'GetPixel', 'SelectObject', 'SetBkMode', 'SetTextColor', 'TextOutW']);

const WM_DESTROY = 0x0002;
const WM_PAINT = 0x000f;
const WM_LBUTTONDOWN = 0x0201;
const WM_RBUTTONDOWN = 0x0204;
const PM_REMOVE = 0x0001;
const LWA_ALPHA = 0x0000_0002;
const SRCCOPY = 0x00cc_0020;
const SWP_NOSIZE_NOMOVE_NOACTIVATE = 0x0000_0013;

const USAGE_URL = 'https://api.anthropic.com/api/oauth/usage';
const CREDENTIALS_PATH = `${Bun.env.USERPROFILE}/.claude/.credentials.json`;
const POLL_INTERVAL_MS = Number(Bun.env.CLAUDE_USAGE_POLL_MS ?? 60_000);

const wide = (text: string): Buffer => Buffer.from(`${text}\0`, 'utf16le');

interface RateWindow {
  resetsAt: string | null;
  utilization: number | null;
}

let fiveHour: RateWindow = { resetsAt: null, utilization: null };
let sevenDay: RateWindow = { resetsAt: null, utilization: null };
let connectionState: 'ok' | 'stale' | 'error' | 'starting' = 'starting';
let haveData = false;

const rateWindowFrom = (value: unknown): RateWindow => {
  const result: RateWindow = { resetsAt: null, utilization: null };
  if (typeof value !== 'object' || value === null) return result;
  if ('utilization' in value && typeof value.utilization === 'number') result.utilization = value.utilization;
  if ('resets_at' in value && typeof value.resets_at === 'string') result.resetsAt = value.resets_at;
  return result;
};

let consecutiveFailures = 0;
let nextFetchNotBefore = 0;
const recordFailure = (state: 'stale' | 'error', reason: string): void => {
  connectionState = state;
  consecutiveFailures += 1;
  console.error(`usage fetch failed (${consecutiveFailures} in a row): ${reason}`);
};

const refreshUsage = async (): Promise<void> => {
  try {
    const credentialsFile = Bun.file(CREDENTIALS_PATH);
    if (!(await credentialsFile.exists())) {
      recordFailure('error', `${CREDENTIALS_PATH} not found — is Claude Code installed and logged in?`);
      return;
    }
    const { claudeAiOauth } = await credentialsFile.json();
    if (!claudeAiOauth?.accessToken) {
      recordFailure('error', 'credentials file has no claudeAiOauth.accessToken');
      return;
    }
    const response = await fetch(USAGE_URL, { headers: { Authorization: `Bearer ${claudeAiOauth.accessToken}`, 'anthropic-beta': 'oauth-2025-04-20' }, signal: AbortSignal.timeout(10_000) });
    if (!response.ok) {
      const stale = response.status === 401 || response.status === 403;
      if (response.status === 429) {
        const retryAfterSeconds = Number(response.headers.get('retry-after') ?? 0);
        const backoffMs = Math.max(retryAfterSeconds * 1000, 30_000);
        nextFetchNotBefore = Date.now() + backoffMs;
        recordFailure('error', `HTTP 429 (rate limited — backing off ${Math.round(backoffMs / 1000)}s)`);
        return;
      }
      recordFailure(stale ? 'stale' : 'error', `HTTP ${response.status}${stale ? ' (token expired — open Claude Code to refresh it)' : ''}`);
      return;
    }
    const usage: unknown = await response.json();
    if (typeof usage !== 'object' || usage === null) {
      recordFailure('error', 'response body is not a JSON object');
      return;
    }
    fiveHour = rateWindowFrom('five_hour' in usage ? usage.five_hour : null);
    sevenDay = rateWindowFrom('seven_day' in usage ? usage.seven_day : null);
    connectionState = 'ok';
    consecutiveFailures = 0;
    haveData = true;
  } catch (error) {
    recordFailure('error', String(error));
  }
};

const formatPercent = (utilization: number | null): string => (utilization === null ? '—' : `${Math.round(utilization)}%`);

const formatReset = (resetsAt: string | null): string => {
  if (!resetsAt) return '';
  const totalMinutes = Math.ceil((new Date(resetsAt).getTime() - Date.now()) / 60_000);
  if (totalMinutes <= 0) return 'now';
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (totalMinutes < 60) return `${minutes}m`;
  if (totalMinutes < 2880) return `${days * 24 + hours}h ${minutes}m`;
  return `${days}d ${hours}h`;
};

const utilizationColor = (utilization: number | null): number => {
  if (utilization === null) return 0x0080_8080;
  if (utilization >= 90) return 0x005a_50f0;
  if (utilization >= 70) return 0x003c_bef5;
  return 0x0078_c850;
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
const widgetWidth = Number(Bun.env.CLAUDE_USAGE_WIDTH ?? Math.round(236 * scale));
const widgetX = taskbarLeft + Number(Bun.env.CLAUDE_USAGE_X ?? Math.round(218 * scale));
const widgetY = taskbarTop;

const screenSampleDC = User32.GetDC(0n);
const sampledColor = GDI32.GetPixel(screenSampleDC, widgetX + widgetWidth + Math.round(24 * scale), widgetY + (taskbarHeight >> 1));
void User32.ReleaseDC(0n, screenSampleDC);
const backgroundColor = sampledColor === 0xffff_ffff ? 0x0026_1820 : sampledColor;
const lift = (color: number, amount: number): number => {
  const channel = (shift: number): number => Math.min(0xff, Math.round(((color >> shift) & 0xff) + (0xff - ((color >> shift) & 0xff)) * amount));
  return (channel(16) << 16) | (channel(8) << 8) | channel(0);
};
const trackColor = lift(backgroundColor, 0.16);
const textColor = 0x00ff_ffff;
const dimTextColor = lift(backgroundColor, 0.78);

let closing = false;
let refreshRequested = false;
let repaintRequested = false;

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

const className = wide(`ClaudeUsageTaskbar_${process.pid}`);
const windowClass = Buffer.alloc(80);
windowClass.writeUInt32LE(80, 0);
windowClass.writeBigUInt64LE(BigInt(wndProc.ptr!), 8);
windowClass.writeBigUInt64LE(BigInt(className.ptr!), 64);
if (!User32.RegisterClassExW(windowClass.ptr!)) {
  wndProc.close();
  throw new Error('RegisterClassExW failed.');
}

const exStyle = 0x0008_0000 /* WS_EX_LAYERED */ | 0x0000_0080 /* WS_EX_TOOLWINDOW */ | 0x0800_0000; /* WS_EX_NOACTIVATE */
const hwnd = User32.CreateWindowExW(exStyle, className.ptr!, wide('Claude usage').ptr!, WindowStyles.WS_POPUP, widgetX, widgetY, widgetWidth, widgetHeight, 0n, 0n, 0n, null);
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
if (User32.SetLayeredWindowAttributes(hwnd, 0, 0xff, LWA_ALPHA) === 0) console.error('SetLayeredWindowAttributes failed — widget may stay invisible.');
User32.MoveWindow(hwnd, parentedToTaskbar ? widgetX - taskbarLeft : widgetX, parentedToTaskbar ? 0 : widgetY, widgetWidth, widgetHeight, 1);
User32.ShowWindow(hwnd, ShowWindowCommand.SW_SHOWNOACTIVATE);
const zOrderAnchor = parentedToTaskbar ? 0n /* HWND_TOP */ : 0xffff_ffff_ffff_ffffn; /* HWND_TOPMOST */
User32.SetWindowPos(hwnd, zOrderAnchor, 0, 0, 0, 0, parentedToTaskbar ? SWP_NOSIZE_NOMOVE_NOACTIVATE : SWP_NOSIZE_NOMOVE_NOACTIVATE | 0x0020 /* SWP_FRAMECHANGED */);

const primaryFont = GDI32.CreateFontW(-Math.round(12 * scale), 0, 0, 0, 600, 0, 0, 0, 0, 0, 0, 5 /* CLEARTYPE_QUALITY */, 0, wide('Segoe UI').ptr!);
const percentFont = GDI32.CreateFontW(-Math.round(11 * scale), 0, 0, 0, 700, 0, 0, 0, 0, 0, 0, 5 /* CLEARTYPE_QUALITY */, 0, wide('Segoe UI').ptr!);

const rectBuffer = Buffer.alloc(16);
const fillRectangle = (deviceContext: bigint, left: number, top: number, right: number, bottom: number, color: number): void => {
  rectBuffer.writeInt32LE(left, 0);
  rectBuffer.writeInt32LE(top, 4);
  rectBuffer.writeInt32LE(right, 8);
  rectBuffer.writeInt32LE(bottom, 12);
  const brush = GDI32.CreateSolidBrush(color);
  void User32.FillRect(deviceContext, rectBuffer.ptr!, brush);
  void GDI32.DeleteObject(brush);
};

let hasDrawn = false;
const draw = (): void => {
  const deviceContext = User32.GetDC(hwnd);
  if (deviceContext === 0n) return;
  hasDrawn = true;
  fillRectangle(deviceContext, 0, 0, widgetWidth, widgetHeight, backgroundColor);
  GDI32.SetBkMode(deviceContext, 1 /* TRANSPARENT */);
  GDI32.SelectObject(deviceContext, primaryFont);
  const textOut = (x: number, y: number, text: string, color: number): void => {
    GDI32.SetTextColor(deviceContext, color);
    void GDI32.TextOutW(deviceContext, x, y, wide(text).ptr!, text.length);
  };
  const textY1 = Math.round(6 * scale);
  const textY2 = Math.round(26 * scale);
  if (haveData) {
    const barLeft = Math.round(30 * scale);
    const barRight = widgetWidth - Math.round(64 * scale);
    const barHeight = Math.round(16 * scale);
    const drawRow = (rowTop: number, label: string, rateWindow: RateWindow): void => {
      GDI32.SelectObject(deviceContext, primaryFont);
      textOut(Math.round(8 * scale), rowTop, label, dimTextColor);
      textOut(barRight + Math.round(7 * scale), rowTop, formatReset(rateWindow.resetsAt), dimTextColor);
      fillRectangle(deviceContext, barLeft, rowTop, barRight, rowTop + barHeight, trackColor);
      if (rateWindow.utilization !== null) {
        const filledRight = barLeft + Math.round(((barRight - barLeft) * Math.min(100, rateWindow.utilization)) / 100);
        if (filledRight > barLeft) fillRectangle(deviceContext, barLeft, rowTop, filledRight, rowTop + barHeight, utilizationColor(rateWindow.utilization));
      }
      GDI32.SelectObject(deviceContext, percentFont);
      const percentText = formatPercent(rateWindow.utilization);
      const approximatePercentWidth = Math.round(percentText.length * 6 * scale);
      textOut(((barLeft + barRight) >> 1) - (approximatePercentWidth >> 1), rowTop + Math.round(1 * scale), percentText, textColor);
    };
    drawRow(textY1, '5h', fiveHour);
    drawRow(textY2, 'wk', sevenDay);
    if (connectionState !== 'ok' && consecutiveFailures >= 3) fillRectangle(deviceContext, Math.round(3 * scale), Math.round(3 * scale), Math.round(7 * scale), Math.round(7 * scale), 0x003c_bef5);
  } else {
    textOut(Math.round(10 * scale), textY1, 'Claude usage', textColor);
    const message = connectionState === 'stale' ? 'token expired — open Claude Code' : connectionState === 'error' ? 'usage fetch failed' : 'loading…';
    textOut(Math.round(10 * scale), textY2, message, dimTextColor);
  }
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
  void GDI32.BitBlt(memoryDC, 0, 0, captureWidth, taskbarHeight, screenDC, captureX, widgetY, SRCCOPY);
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

console.log(`Claude usage widget at (${widgetX}, ${widgetY}) ${widgetWidth}×${widgetHeight} — polling every ${POLL_INTERVAL_MS / 1000}s. Left-click = refresh, right-click = quit.`);

const startedAt = Date.now();
const demoDurationMs = Number(Bun.env.DEMO_DURATION_MS ?? 0);
let lastFetchAt = 0;
let fetchInFlight = false;
let captured = false;
while (!closing) {
  pump();
  const now = Date.now();
  if (!fetchInFlight && now >= nextFetchNotBefore && ((refreshRequested && now - lastFetchAt >= 3_000) || now - lastFetchAt >= POLL_INTERVAL_MS)) {
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
  if (demoDurationMs > 0 && now - startedAt >= demoDurationMs) closing = true;
  await Bun.sleep(100);
}

void GDI32.DeleteObject(percentFont);
void GDI32.DeleteObject(primaryFont);
User32.DestroyWindow(hwnd);
User32.UnregisterClassW(className.ptr!, 0n);
wndProc.close();
