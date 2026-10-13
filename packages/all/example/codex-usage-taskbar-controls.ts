/**
 * codex-usage-taskbar-controls — Codex quota rendered by native Windows controls.
 *
 * Displays one or two Codex rate-limit windows as compact segmented meters over
 * the Windows taskbar. The labels are top-level, non-activating STATIC controls
 * because Windows 11's composed taskbar hides foreign child windows. Codex owns
 * authentication and token refresh through its documented app-server interface.
 * Left-click refreshes immediately; right-click quits.
 *
 * APIs demonstrated:
 * - Codex app-server (initialize + account/rateLimits/read over JSONL stdio)
 * - user32 (CreateWindowExW native STATIC controls, FindWindowW + GetWindowRect,
 *   SetWindowTextW + SetWindowPos, global pointer input, and message dispatch)
 *
 * Env: CODEX_USAGE_X / CODEX_USAGE_WIDTH (pixel overrides), CODEX_USAGE_POLL_MS
 * (default 60000), CODEX_USAGE_LIMIT_ID (select a quota bucket), and CODEX_BIN
 * (CLI executable override).
 *
 * Run: bun run example/codex-usage-taskbar-controls.ts
 */
import User32, { ExtendedWindowStyles, ShowWindowCommand, WindowStyles } from '@bun-win32/user32';
import { CodexUsageClient, formatCodexWindow, type CodexRateWindow } from './_codex-usage';

User32.Preload([
  'CreateWindowExW',
  'DestroyWindow',
  'DispatchMessageW',
  'FindWindowW',
  'GetAsyncKeyState',
  'GetCursorPos',
  'GetWindowRect',
  'IsWindow',
  'PeekMessageW',
  'SetProcessDPIAware',
  'SetWindowPos',
  'SetWindowTextW',
  'ShowWindow',
  'TranslateMessage',
]);

const HWND_TOPMOST = 0xffff_ffff_ffff_ffffn;
const METER_SEGMENTS = 8;
const PM_REMOVE = 0x0001;
const SS_CENTER = 0x0001;
const SS_CENTERIMAGE = 0x0200;
const SS_NOPREFIX = 0x0080;
const SWP_NOACTIVATE_SHOWWINDOW = 0x0050;
const VK_LBUTTON = 0x0001;
const VK_RBUTTON = 0x0002;

const POLL_INTERVAL_MS = Number(Bun.env.CODEX_USAGE_POLL_MS ?? 60_000);

const wide = (text: string): Buffer => Buffer.from(`${text}\0`, 'utf16le');
const formatMeter = (rateWindow: CodexRateWindow): string => {
  const filledSegments = Math.round((rateWindow.utilization * METER_SEGMENTS) / 100);
  return `${formatCodexWindow(rateWindow.windowDurationMinutes)} ${'■'.repeat(filledSegments)}${'□'.repeat(METER_SEGMENTS - filledSegments)} ${Math.round(rateWindow.utilization)}%`;
};

if (User32.SetProcessDPIAware() === 0) console.error('SetProcessDPIAware failed — taskbar coordinates may be DPI-virtualized.');

const taskbarClassName = wide('Shell_TrayWnd');
const taskbarHandle = User32.FindWindowW(taskbarClassName.ptr!, null);
if (taskbarHandle === 0n) throw new Error('Shell_TrayWnd not found — no taskbar in this session.');

const taskbarRect = Buffer.alloc(16);
if (User32.GetWindowRect(taskbarHandle, taskbarRect.ptr!) === 0) throw new Error('GetWindowRect(Shell_TrayWnd) failed.');
const taskbarLeft = taskbarRect.readInt32LE(0);
const taskbarTop = taskbarRect.readInt32LE(4);
const taskbarHeight = taskbarRect.readInt32LE(12) - taskbarTop;
const scale = taskbarHeight / 48;
const widgetWidth = Number(Bun.env.CODEX_USAGE_WIDTH ?? Math.round(236 * scale));
const widgetX = taskbarLeft + Number(Bun.env.CODEX_USAGE_X ?? Math.round(218 * scale));
const singleHeight = Math.min(taskbarHeight, Math.max(24, Math.round(30 * scale)));
const dualHeight = Math.min(taskbarHeight, Math.max(36, Math.round(44 * scale)));

const extendedStyle = ExtendedWindowStyles.WS_EX_NOACTIVATE + ExtendedWindowStyles.WS_EX_TOOLWINDOW + ExtendedWindowStyles.WS_EX_TOPMOST;
const staticStyle = WindowStyles.WS_BORDER + WindowStyles.WS_POPUP + SS_CENTER + SS_CENTERIMAGE + SS_NOPREFIX;
const staticClassName = wide('STATIC');
const primaryHandle = User32.CreateWindowExW(extendedStyle, staticClassName.ptr!, wide('Codex usage loading…').ptr!, staticStyle, 0, 0, 0, 0, 0n, 0n, 0n, null);
if (primaryHandle === 0n) throw new Error('CreateWindowExW(STATIC) failed — likely no interactive desktop.');
const secondaryHandle = User32.CreateWindowExW(extendedStyle, staticClassName.ptr!, null, staticStyle, 0, 0, 0, 0, 0n, 0n, 0n, null);
if (secondaryHandle === 0n) {
  User32.DestroyWindow(primaryHandle);
  throw new Error('CreateWindowExW(STATIC) failed for the secondary meter.');
}

let meterCount = 1;
let widgetHeight = singleHeight;
let widgetY = taskbarTop + Math.round((taskbarHeight - widgetHeight) / 2);

const layoutMeters = (): void => {
  widgetHeight = meterCount === 1 ? singleHeight : dualHeight;
  widgetY = taskbarTop + Math.round((taskbarHeight - widgetHeight) / 2);
  if (meterCount === 1) {
    void User32.SetWindowPos(primaryHandle, HWND_TOPMOST, widgetX, widgetY, widgetWidth, widgetHeight, SWP_NOACTIVATE_SHOWWINDOW);
    void User32.ShowWindow(secondaryHandle, ShowWindowCommand.SW_HIDE);
    return;
  }
  const primaryHeight = Math.floor(widgetHeight / 2);
  void User32.SetWindowPos(primaryHandle, HWND_TOPMOST, widgetX, widgetY, widgetWidth, primaryHeight, SWP_NOACTIVATE_SHOWWINDOW);
  void User32.SetWindowPos(secondaryHandle, HWND_TOPMOST, widgetX, widgetY + primaryHeight, widgetWidth, widgetHeight - primaryHeight, SWP_NOACTIVATE_SHOWWINDOW);
};

const setLabel = (handle: bigint, text: string): void => {
  if (User32.SetWindowTextW(handle, wide(text).ptr!) === 0) console.error(`SetWindowTextW failed for: ${text}`);
};

const presentUsage = (rateWindows: CodexRateWindow[]): void => {
  meterCount = Math.min(2, rateWindows.length);
  setLabel(primaryHandle, formatMeter(rateWindows[0]));
  if (meterCount === 2) setLabel(secondaryHandle, formatMeter(rateWindows[1]));
  layoutMeters();
};

const presentFailure = (): void => {
  meterCount = 1;
  setLabel(primaryHandle, 'Codex usage unavailable');
  layoutMeters();
};

const messageBuffer = Buffer.alloc(48);
const pumpMessages = (): void => {
  while (User32.PeekMessageW(messageBuffer.ptr!, 0n, 0, 0, PM_REMOVE) !== 0) {
    User32.TranslateMessage(messageBuffer.ptr!);
    User32.DispatchMessageW(messageBuffer.ptr!);
  }
};

const cursorPoint = Buffer.alloc(8);
const pointerIsInsideWidget = (): boolean => {
  if (User32.GetCursorPos(cursorPoint.ptr!) === 0) return false;
  const cursorX = cursorPoint.readInt32LE(0);
  const cursorY = cursorPoint.readInt32LE(4);
  return cursorX >= widgetX && cursorX < widgetX + widgetWidth && cursorY >= widgetY && cursorY < widgetY + widgetHeight;
};

layoutMeters();
console.log(`Codex native-controls widget at taskbar x=${widgetX}, ${widgetWidth}×${widgetHeight} — polling every ${POLL_INTERVAL_MS / 1000}s. Left-click = refresh, right-click = quit.`);

const usageClient = new CodexUsageClient();
let closing = false;
let fetchInFlight = false;
let lastFetchAt = 0;
let lastLayoutAt = 0;
let leftButtonWasDown = false;
let refreshRequested = false;
let rightButtonWasDown = false;

while (!closing && User32.IsWindow(primaryHandle) !== 0) {
  pumpMessages();
  const leftButtonIsDown = (User32.GetAsyncKeyState(VK_LBUTTON) & 0x8000) !== 0;
  const rightButtonIsDown = (User32.GetAsyncKeyState(VK_RBUTTON) & 0x8000) !== 0;
  if (leftButtonIsDown && !leftButtonWasDown && pointerIsInsideWidget()) refreshRequested = true;
  if (rightButtonIsDown && !rightButtonWasDown && pointerIsInsideWidget()) closing = true;
  leftButtonWasDown = leftButtonIsDown;
  rightButtonWasDown = rightButtonIsDown;

  const now = Date.now();
  if (!fetchInFlight && (refreshRequested || now - lastFetchAt >= POLL_INTERVAL_MS)) {
    refreshRequested = false;
    lastFetchAt = now;
    fetchInFlight = true;
    void usageClient
      .read()
      .then(presentUsage)
      .catch((error: unknown) => {
        console.error(`usage fetch failed: ${String(error)}`);
        presentFailure();
      })
      .finally(() => {
        fetchInFlight = false;
      });
  }
  if (now - lastLayoutAt >= 1_000) {
    lastLayoutAt = now;
    layoutMeters();
  }
  await Bun.sleep(50);
}

usageClient.close();
User32.DestroyWindow(secondaryHandle);
User32.DestroyWindow(primaryHandle);
