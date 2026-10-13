/**
 * codex-usage-taskbar — live Codex rate-limit meter pinned to the Windows taskbar.
 *
 * Renders the active Codex subscription rate-limit windows, each with its used
 * percent and time until reset, as a compact widget in the bottom-left taskbar.
 * It asks the documented `codex app-server` interface for
 * `account/rateLimits/read`, so Codex owns authentication and token refresh. A ChatGPT-backed Codex
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
 *   CreateFontW + TextOutW text)
 *
 * Env: CODEX_USAGE_X / CODEX_USAGE_WIDTH (pixel overrides), CODEX_USAGE_POLL_MS
 * (default 60000), CODEX_USAGE_LIMIT_ID (select a model-specific quota bucket),
 * and CODEX_BIN (CLI executable override).
 *
 * Run: bun run example/codex-usage-taskbar.ts
 */
import { JSCallback } from 'bun:ffi';

import GDI32 from '@bun-win32/gdi32';
import User32, { ShowWindowCommand, WindowStyles } from '@bun-win32/user32';
import { CodexUsageClient, formatCodexReset, formatCodexWindow, type CodexRateWindow } from './_codex-usage';

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
GDI32.Preload(['CreateFontW', 'DeleteObject', 'GetPixel', 'GetTextMetricsW', 'IntersectClipRect', 'RestoreDC', 'SaveDC', 'SelectObject', 'SetBkMode', 'SetDIBitsToDevice', 'SetTextAlign', 'SetTextColor', 'TextOutW']);

const WM_DESTROY = 0x0002;
const WM_PAINT = 0x000f;
const WM_LBUTTONDOWN = 0x0201;
const WM_RBUTTONDOWN = 0x0204;
const PM_REMOVE = 0x0001;
const LWA_COLORKEY = 0x0000_0001;
const SWP_NOSIZE_NOMOVE_NOACTIVATE = 0x0000_0013;

const POLL_INTERVAL_MS = Number(Bun.env.CODEX_USAGE_POLL_MS ?? 60_000);

const wide = (text: string): Buffer => Buffer.from(`${text}\0`, 'utf16le');
const usageClient = new CodexUsageClient();
let rateWindows: CodexRateWindow[] = [];
let connectionState: 'error' | 'ok' | 'starting' = 'starting';
let haveData = false;
let consecutiveFailures = 0;

const recordFailure = (reason: string): void => {
  connectionState = 'error';
  consecutiveFailures += 1;
  console.error(`usage fetch failed (${consecutiveFailures} in a row): ${reason}`);
};

const refreshUsage = async (): Promise<void> => {
  try {
    rateWindows = await usageClient.read();
    connectionState = 'ok';
    consecutiveFailures = 0;
    haveData = true;
  } catch (error) {
    recordFailure(String(error));
  }
};

const formatPercent = (utilization: number): string => `${Math.round(utilization)}%`;

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

const fillRightOf = (rateWindow: CodexRateWindow): number => (rateWindow.utilization <= 0 ? barLeft : Math.max(barLeft + barHeight, barLeft + ((barRight - barLeft) * Math.min(100, rateWindow.utilization)) / 100));

const composeBar = (rowTop: number, rateWindow: CodexRateWindow): void => {
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

const paint = (deviceContext: bigint): void => {
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
      textOut(barLeft - Math.round(6 * scale), rowTop + primaryTextOffsetY, formatCodexWindow(rateWindow.windowDurationMinutes), dimTextColor, 2 /* TA_RIGHT */);
      textOut(barRight + Math.round(8 * scale), rowTop + primaryTextOffsetY, formatCodexReset(rateWindow.resetsAt), dimTextColor, 0 /* TA_LEFT */);
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

console.log(`Codex usage widget at (${widgetX}, ${widgetY}) ${widgetWidth}×${widgetHeight} — polling every ${POLL_INTERVAL_MS / 1000}s. Left-click = refresh, right-click = quit.`);

let lastFetchAt = 0;
let fetchInFlight = false;
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
  await Bun.sleep(100);
}

usageClient.close();
void GDI32.DeleteObject(percentFont);
void GDI32.DeleteObject(primaryFont);
User32.DestroyWindow(hwnd);
User32.UnregisterClassW(className.ptr!, 0n);
wndProc.close();
