/**
 * codex-usage-tray — Codex rate-limit meters in the Windows notification area.
 *
 * Keeps a native tray icon updated with the active Codex subscription windows.
 * The outer and inner rings show utilization; the tooltip gives exact percentages
 * and reset times. Left-click refreshes, while right-click opens a native menu.
 *
 * APIs demonstrated:
 * - shell32 (Shell_NotifyIconW notification-icon add, modify, version, and delete)
 * - user32 (CreateIcon from raw AND/XOR buffers, a hidden message window,
 *   registered Explorer restart messages, and native popup-menu interaction)
 *
 * Run: bun run example/codex-usage-tray.ts
 */
import { JSCallback } from 'bun:ffi';

import Shell32, { NotifyIconFlags, NotifyIconMessage } from '@bun-win32/shell32';
import User32, { PeekMessageRemoveFlag } from '@bun-win32/user32';
import { CodexUsageClient, type CodexRateWindow, formatCodexReset, formatCodexWindow } from './_codex-usage';

Shell32.Preload(['Shell_NotifyIconW']);
User32.Preload([
  'AppendMenuW',
  'CreateIcon',
  'CreatePopupMenu',
  'CreateWindowExW',
  'DefWindowProcW',
  'DestroyIcon',
  'DestroyMenu',
  'DestroyWindow',
  'DispatchMessageW',
  'GetCursorPos',
  'PeekMessageW',
  'PostMessageW',
  'PostQuitMessage',
  'RegisterClassExW',
  'RegisterWindowMessageW',
  'SetForegroundWindow',
  'TrackPopupMenu',
  'TranslateMessage',
  'UnregisterClassW',
]);

const COMMAND_QUIT = 2;
const COMMAND_REFRESH = 1;
const ICON_SIZE = 32;
const MF_SEPARATOR = 0x0000_0800;
const MF_STRING = 0x0000_0000;
const NOTIFY_ICON_DATA_SIZE = 976;
const NOTIFY_ICON_VERSION_4 = 4;
const POLL_INTERVAL_MS = 60_000;
const TPM_NONOTIFY = 0x0000_0080;
const TPM_RETURNCMD = 0x0000_0100;
const TPM_RIGHTBUTTON = 0x0000_0002;
const TRAY_CALLBACK_MESSAGE = 0x8001;
const TRAY_ICON_ID = 1;
const WM_CONTEXTMENU = 0x007b;
const WM_DESTROY = 0x0002;
const WM_LBUTTONUP = 0x0202;
const WM_NULL = 0x0000;
const WM_RBUTTONUP = 0x0205;
const NIN_SELECT = 0x0400;

interface IconTint {
  blue: number;
  green: number;
  red: number;
}

const TRACK_TINT: IconTint = { blue: 82, green: 75, red: 70 };
const GOOD_TINT: IconTint = { blue: 129, green: 185, red: 16 };
const WARNING_TINT: IconTint = { blue: 11, green: 158, red: 245 };
const CRITICAL_TINT: IconTint = { blue: 68, green: 68, red: 239 };
const SUBPIXEL_OFFSETS = [0.125, 0.375, 0.625, 0.875];
const TAU = Math.PI * 2;

const wide = (text: string): Buffer => Buffer.from(`${text}\0`, 'utf16le');

const taskbarCreatedMessage = User32.RegisterWindowMessageW(wide('TaskbarCreated').ptr!);
if (taskbarCreatedMessage === 0) throw new Error('RegisterWindowMessageW(TaskbarCreated) failed.');

let closing = false;
let currentIcon = 0n;
let currentTooltip = 'Codex usage\nLoading…';
let hwnd = 0n;
let iconAdded = false;
let rateWindows: CodexRateWindow[] = [];
let refreshRequested = true;

const utilizationTint = (utilization: number): IconTint => {
  if (utilization >= 90) return CRITICAL_TINT;
  if (utilization >= 70) return WARNING_TINT;
  return GOOD_TINT;
};

const ringTintAt = (x: number, y: number, radius: number, thickness: number, utilization: number | null): IconTint | null => {
  const offsetX = x - ICON_SIZE / 2;
  const offsetY = y - ICON_SIZE / 2;
  if (Math.abs(Math.hypot(offsetX, offsetY) - radius) > thickness / 2) return null;
  if (utilization === null) return TRACK_TINT;
  const angle = (Math.atan2(offsetY, offsetX) + Math.PI / 2 + TAU) % TAU;
  return angle <= (Math.min(100, utilization) / 100) * TAU ? utilizationTint(utilization) : TRACK_TINT;
};

const createUsageIcon = (windows: CodexRateWindow[]): bigint => {
  const andBits = Buffer.alloc((ICON_SIZE * ICON_SIZE) / 8, 0xff);
  const xorBits = Buffer.alloc(ICON_SIZE * ICON_SIZE * 4);
  const outerUtilization = windows[0]?.utilization ?? null;
  const innerUtilization = windows[1]?.utilization ?? null;
  for (let y = 0; y < ICON_SIZE; y++) {
    for (let x = 0; x < ICON_SIZE; x++) {
      let alphaSamples = 0;
      let blue = 0;
      let green = 0;
      let red = 0;
      for (const sampleY of SUBPIXEL_OFFSETS) {
        for (const sampleX of SUBPIXEL_OFFSETS) {
          const tint = ringTintAt(x + sampleX, y + sampleY, 12.5, 3, outerUtilization) ?? ringTintAt(x + sampleX, y + sampleY, 7.5, 3, innerUtilization);
          if (!tint) continue;
          alphaSamples += 1;
          blue += tint.blue;
          green += tint.green;
          red += tint.red;
        }
      }
      if (alphaSamples === 0) continue;
      const bitmapY = ICON_SIZE - 1 - y;
      const pixelOffset = (bitmapY * ICON_SIZE + x) * 4;
      xorBits[pixelOffset] = Math.round(blue / alphaSamples);
      xorBits[pixelOffset + 1] = Math.round(green / alphaSamples);
      xorBits[pixelOffset + 2] = Math.round(red / alphaSamples);
      xorBits[pixelOffset + 3] = Math.round((alphaSamples / (SUBPIXEL_OFFSETS.length * SUBPIXEL_OFFSETS.length)) * 255);
      const maskOffset = bitmapY * (ICON_SIZE / 8) + (x >> 3);
      andBits[maskOffset] &= ~(0x80 >> (x & 7));
    }
  }
  const icon = User32.CreateIcon(0n, ICON_SIZE, ICON_SIZE, 1, 32, andBits.ptr!, xorBits.ptr!);
  if (icon === 0n) throw new Error('CreateIcon failed.');
  return icon;
};

const writeWideField = (buffer: Buffer, offset: number, maximumCharacters: number, text: string): void => {
  buffer.fill(0, offset, offset + maximumCharacters * 2);
  Buffer.from(text.slice(0, maximumCharacters - 1), 'utf16le').copy(buffer, offset);
};

const notifyIconData = (flags: number): Buffer => {
  const data = Buffer.alloc(NOTIFY_ICON_DATA_SIZE);
  data.writeUInt32LE(NOTIFY_ICON_DATA_SIZE, 0);
  data.writeBigUInt64LE(hwnd, 8);
  data.writeUInt32LE(TRAY_ICON_ID, 16);
  data.writeUInt32LE(flags, 20);
  data.writeUInt32LE(TRAY_CALLBACK_MESSAGE, 24);
  data.writeBigUInt64LE(currentIcon, 32);
  writeWideField(data, 40, 128, currentTooltip);
  return data;
};

function addTrayIcon(): void {
  const flags = NotifyIconFlags.NIF_ICON | NotifyIconFlags.NIF_MESSAGE | NotifyIconFlags.NIF_SHOWTIP | NotifyIconFlags.NIF_TIP;
  iconAdded = Shell32.Shell_NotifyIconW(NotifyIconMessage.NIM_ADD, notifyIconData(flags).ptr!) !== 0;
  if (!iconAdded) {
    console.error('Shell_NotifyIconW(NIM_ADD) failed.');
    return;
  }
  const versionData = notifyIconData(0);
  versionData.writeUInt32LE(NOTIFY_ICON_VERSION_4, 816);
  void Shell32.Shell_NotifyIconW(NotifyIconMessage.NIM_SETVERSION, versionData.ptr!);
}

const updateTrayIcon = (): void => {
  const previousIcon = currentIcon;
  currentIcon = createUsageIcon(rateWindows);
  if (iconAdded) {
    const flags = NotifyIconFlags.NIF_ICON | NotifyIconFlags.NIF_SHOWTIP | NotifyIconFlags.NIF_TIP;
    if (Shell32.Shell_NotifyIconW(NotifyIconMessage.NIM_MODIFY, notifyIconData(flags).ptr!) === 0) iconAdded = false;
  }
  if (!iconAdded) addTrayIcon();
  if (previousIcon !== 0n) void User32.DestroyIcon(previousIcon);
};

const tooltipFrom = (windows: CodexRateWindow[]): string => {
  if (windows.length === 0) return 'Codex usage\nUnavailable';
  return [
    'Codex usage',
    ...windows.map((window) => {
      const reset = formatCodexReset(window.resetsAt);
      return `${formatCodexWindow(window.windowDurationMinutes)}: ${Math.round(window.utilization)}% · reset ${reset || 'unknown'}`;
    }),
  ].join('\n');
};

function showContextMenu(): void {
  const menu = User32.CreatePopupMenu();
  if (menu === 0n) return;
  const refreshLabel = wide('Refresh');
  const quitLabel = wide('Quit');
  if (User32.AppendMenuW(menu, MF_STRING, BigInt(COMMAND_REFRESH), refreshLabel.ptr!) === 0 || User32.AppendMenuW(menu, MF_SEPARATOR, 0n, null) === 0 || User32.AppendMenuW(menu, MF_STRING, BigInt(COMMAND_QUIT), quitLabel.ptr!) === 0) {
    void User32.DestroyMenu(menu);
    return;
  }
  const cursor = Buffer.alloc(8);
  if (User32.GetCursorPos(cursor.ptr!) === 0) {
    void User32.DestroyMenu(menu);
    return;
  }
  void User32.SetForegroundWindow(hwnd);
  const command = User32.TrackPopupMenu(menu, TPM_NONOTIFY | TPM_RETURNCMD | TPM_RIGHTBUTTON, cursor.readInt32LE(0), cursor.readInt32LE(4), 0, hwnd, null);
  void User32.PostMessageW(hwnd, WM_NULL, 0n, 0n);
  void User32.DestroyMenu(menu);
  if (command === COMMAND_REFRESH) refreshRequested = true;
  if (command === COMMAND_QUIT) closing = true;
}

const wndProc = new JSCallback(
  (windowHandle: bigint, message: number, wParam: bigint, lParam: bigint): bigint => {
    if (message === taskbarCreatedMessage) {
      iconAdded = false;
      addTrayIcon();
      return 0n;
    }
    if (message === TRAY_CALLBACK_MESSAGE) {
      const event = Number(lParam & 0xffffn);
      if (event === NIN_SELECT || event === WM_LBUTTONUP) refreshRequested = true;
      if (event === WM_CONTEXTMENU || event === WM_RBUTTONUP) showContextMenu();
      return 0n;
    }
    if (message === WM_DESTROY) {
      closing = true;
      User32.PostQuitMessage(0);
      return 0n;
    }
    return BigInt(User32.DefWindowProcW(windowHandle, message, wParam, lParam));
  },
  { args: ['u64', 'u32', 'u64', 'i64'], returns: 'i64' },
);

const className = wide(`CodexUsageTray_${process.pid}`);
const windowClass = Buffer.alloc(80);
windowClass.writeUInt32LE(80, 0);
windowClass.writeBigUInt64LE(BigInt(wndProc.ptr!), 8);
windowClass.writeBigUInt64LE(BigInt(className.ptr!), 64);
if (User32.RegisterClassExW(windowClass.ptr!) === 0) {
  wndProc.close();
  throw new Error('RegisterClassExW failed.');
}

const exStyle = 0x0000_0080 /* WS_EX_TOOLWINDOW */ | 0x0800_0000; /* WS_EX_NOACTIVATE */
hwnd = User32.CreateWindowExW(exStyle, className.ptr!, null, 0, 0, 0, 0, 0, 0n, 0n, 0n, null);
if (hwnd === 0n) {
  User32.UnregisterClassW(className.ptr!, 0n);
  wndProc.close();
  throw new Error('CreateWindowExW failed.');
}

currentIcon = createUsageIcon(rateWindows);
addTrayIcon();
console.log('Codex usage tray icon is running — left-click to refresh, right-click for menu.');

const usageClient = new CodexUsageClient();
const messageBuffer = Buffer.alloc(48);
let fetchInFlight = false;
let lastFetchAt = 0;
while (!closing) {
  while (User32.PeekMessageW(messageBuffer.ptr!, 0n, 0, 0, PeekMessageRemoveFlag.PM_REMOVE) !== 0) {
    User32.TranslateMessage(messageBuffer.ptr!);
    User32.DispatchMessageW(messageBuffer.ptr!);
  }
  const now = Date.now();
  if (!fetchInFlight && (refreshRequested || now - lastFetchAt >= POLL_INTERVAL_MS)) {
    refreshRequested = false;
    fetchInFlight = true;
    lastFetchAt = now;
    void usageClient.read().then(
      (windows) => {
        fetchInFlight = false;
        if (closing) return;
        rateWindows = windows;
        currentTooltip = tooltipFrom(rateWindows);
        updateTrayIcon();
      },
      (error) => {
        fetchInFlight = false;
        if (closing) return;
        currentTooltip = rateWindows.length > 0 ? `${tooltipFrom(rateWindows)}\nStale` : 'Codex usage\nUnavailable';
        updateTrayIcon();
        console.error(`usage fetch failed: ${String(error)}`);
      },
    );
  }
  await Bun.sleep(50);
}

usageClient.close();
if (iconAdded) void Shell32.Shell_NotifyIconW(NotifyIconMessage.NIM_DELETE, notifyIconData(0).ptr!);
if (currentIcon !== 0n) void User32.DestroyIcon(currentIcon);
User32.DestroyWindow(hwnd);
User32.UnregisterClassW(className.ptr!, 0n);
wndProc.close();
