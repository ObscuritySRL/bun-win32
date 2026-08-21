/**
 * claude-usage-taskbar — live Claude rate-limit meter pinned to the Windows taskbar.
 *
 * Renders your Claude subscription usage (the 5-hour window and the weekly window,
 * each with its utilization percent and time until reset) as a compact two-line widget
 * sitting on the taskbar, right of the Windows weather widget in the bottom-left
 * corner. Zero configuration: it authenticates by reading the OAuth access token
 * Claude Code already keeps at ~/.claude/.credentials.json and polling the same
 * usage endpoint Claude Code's /usage screen uses. No API key, no login. A sampled
 * taskbar color is keyed away so the meters float on a transparent surface.
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
 *   widget — with ShowWindow + color-key transparency, a PeekMessageW/
 *   TranslateMessage/DispatchMessageW message pump, GetDC/ReleaseDC,
 *   and SetWindowPos HWND_TOP reassertion each poll)
 * - gdi32 (GetPixel taskbar color sampling, SetDIBitsToDevice single-blit software
 *   compositing — antialiased rounded bars, gradients, gloss — CreateFontW +
 *   SetTextAlign + TextOutW ClearType text, BitBlt + CreateCompatibleBitmap +
 *   GetDIBits screenshot verify)
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
        const backoffMs = Math.max(retryAfterSeconds * 1000, 90_000);
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

interface Tint {
  blue: number;
  green: number;
  red: number;
}

const tintFrom = (rgb: number): Tint => ({ blue: rgb & 0xff, green: (rgb >> 8) & 0xff, red: (rgb >> 16) & 0xff });
const mixTint = (from: Tint, to: Tint, amount: number): Tint => ({ blue: from.blue + (to.blue - from.blue) * amount, green: from.green + (to.green - from.green) * amount, red: from.red + (to.red - from.red) * amount });

const WHITE_TINT = tintFrom(0xff_ff_ff);
const CLAY_TINT = tintFrom(0xd9_77_57);

const utilizationGradient = (utilization: number | null): [Tint, Tint] => {
  if (utilization === null) return [tintFrom(0x5a_5a_64), tintFrom(0x78_78_82)];
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
const widgetWidth = Number(Bun.env.CLAUDE_USAGE_WIDTH ?? Math.round(236 * scale));
const widgetX = taskbarLeft + Number(Bun.env.CLAUDE_USAGE_X ?? Math.round(218 * scale));
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
if (User32.SetLayeredWindowAttributes(hwnd, backgroundColor, 0xff, LWA_COLORKEY) === 0) console.error('SetLayeredWindowAttributes failed — transparent background may be unavailable.');
User32.MoveWindow(hwnd, parentedToTaskbar ? widgetX - taskbarLeft : widgetX, parentedToTaskbar ? 0 : widgetY, widgetWidth, widgetHeight, 1);
User32.ShowWindow(hwnd, ShowWindowCommand.SW_SHOWNOACTIVATE);
const zOrderAnchor = parentedToTaskbar ? 0n /* HWND_TOP */ : 0xffff_ffff_ffff_ffffn; /* HWND_TOPMOST */
User32.SetWindowPos(hwnd, zOrderAnchor, 0, 0, 0, 0, parentedToTaskbar ? SWP_NOSIZE_NOMOVE_NOACTIVATE : SWP_NOSIZE_NOMOVE_NOACTIVATE | 0x0020 /* SWP_FRAMECHANGED */);

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
const textY1 = Math.round(6 * scale);
const textY2 = Math.round(26 * scale);

const fillRightOf = (rateWindow: RateWindow): number =>
  rateWindow.utilization === null || rateWindow.utilization <= 0 ? barLeft : Math.max(barLeft + barHeight, barLeft + ((barRight - barLeft) * Math.min(100, rateWindow.utilization)) / 100);

const composeBar = (rowTop: number, rateWindow: RateWindow): void => {
  const rowBottom = rowTop + barHeight;
  const pillRadius = barHeight / 2;
  drawRoundedRect(barLeft, rowTop, barRight, rowBottom, pillRadius, () => trackTint, 1);
  for (const quarter of [0.25, 0.5, 0.75]) {
    const tickX = Math.round(barLeft + (barRight - barLeft) * quarter);
    for (let tickY = rowTop + Math.round(3 * scale); tickY < rowBottom - Math.round(3 * scale); tickY++) blendPixel(tickX, tickY, backgroundTint, 0.45);
  }
  if (rateWindow.utilization !== null && rateWindow.utilization > 0) {
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
const draw = (): void => {
  const deviceContext = User32.GetDC(hwnd);
  if (deviceContext === 0n) return;
  hasDrawn = true;
  for (let index = 0; index < frame.length; index += 4) {
    frame[index] = backgroundTint.blue;
    frame[index + 1] = backgroundTint.green;
    frame[index + 2] = backgroundTint.red;
  }
  drawRoundedRect(5 * scale, 9 * scale, 7.5 * scale, widgetHeight - 9 * scale, 1.25 * scale, () => CLAY_TINT, 1);
  if (haveData) {
    composeBar(textY1, fiveHour);
    composeBar(textY2, sevenDay);
    if (connectionState !== 'ok' && consecutiveFailures >= 3) {
      const dotRadius = 2.5 * scale;
      const dotCenterX = widgetWidth - 9 * scale;
      drawRoundedRect(dotCenterX - dotRadius, textY1 + barHeight / 2 - dotRadius, dotCenterX + dotRadius, textY1 + barHeight / 2 + dotRadius, dotRadius, () => CLAY_TINT, 1);
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
    const drawRowText = (rowTop: number, label: string, rateWindow: RateWindow): void => {
      GDI32.SelectObject(deviceContext, primaryFont);
      textOut(barLeft - Math.round(6 * scale), rowTop + primaryTextOffsetY, label, dimTextColor, 2 /* TA_RIGHT */);
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
    };
    drawRowText(textY1, '5h', fiveHour);
    drawRowText(textY2, '7d', sevenDay);
  } else {
    GDI32.SelectObject(deviceContext, primaryFont);
    textOut(Math.round(12 * scale), textY1, 'Claude usage', textColor, 0 /* TA_LEFT */);
    const message = connectionState === 'stale' ? 'token expired — open Claude Code' : connectionState === 'error' ? 'usage fetch failed' : 'loading…';
    textOut(Math.round(12 * scale), textY2, message, dimTextColor, 0 /* TA_LEFT */);
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
