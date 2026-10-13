/**
 * codex-usage-appbar — reserve a thin desktop-edge rail for live Codex quota usage.
 *
 * Registers a bottom application desktop toolbar immediately above the Windows
 * taskbar. The shorter quota window occupies the upper rail and the weekly window
 * occupies the lower rail; each fills from left to right as utilization rises.
 * Left-click refreshes immediately and right-click quits.
 *
 * APIs demonstrated:
 * - shell32 (SHAppBarMessage to register, position, notify, and remove an application
 *   desktop toolbar while coordinating its reserved work area with the Windows shell)
 * - user32 (RegisterWindowMessageW for appbar callbacks, RegisterClassExW +
 *   CreateWindowExW for the toolbar, SetWindowPos for shell-negotiated placement,
 *   and a PeekMessageW/TranslateMessage/DispatchMessageW event loop)
 * - gdi32 (SetDIBitsToDevice to upload the complete quota-rail framebuffer in one call)
 *
 * Run: bun run example/codex-usage-appbar.ts
 */
import { JSCallback } from 'bun:ffi';

import GDI32 from '@bun-win32/gdi32';
import Shell32, { AppBarEdge, AppBarMessage } from '@bun-win32/shell32';
import User32, { ShowWindowCommand, WindowStyles } from '@bun-win32/user32';
import { CodexUsageClient, type CodexRateWindow } from './_codex-usage';

GDI32.Preload(['SetDIBitsToDevice']);
Shell32.Preload(['SHAppBarMessage']);
User32.Preload([
  'CreateWindowExW',
  'DefWindowProcW',
  'DestroyWindow',
  'DispatchMessageW',
  'GetDC',
  'GetSystemMetrics',
  'PeekMessageW',
  'PostQuitMessage',
  'RegisterClassExW',
  'RegisterWindowMessageW',
  'ReleaseDC',
  'SetProcessDPIAware',
  'SetWindowPos',
  'ShowWindow',
  'TranslateMessage',
  'UnregisterClassW',
]);

const ABN_POSCHANGED = 0x0000_0001;
const APPBAR_DATA_SIZE = 48;
const PM_REMOVE = 0x0001;
const POLL_INTERVAL_MS = 60_000;
const RAIL_HEIGHT = 6;
const SM_CXSCREEN = 0;
const SM_CYSCREEN = 1;
const SWP_NOACTIVATE_SHOWWINDOW = 0x0000_0050;
const WM_DESTROY = 0x0002;
const WM_DISPLAYCHANGE = 0x007e;
const WM_LBUTTONDOWN = 0x0201;
const WM_PAINT = 0x000f;
const WM_RBUTTONDOWN = 0x0204;
const WM_WINDOWPOSCHANGED = 0x0047;

interface Tint {
  blue: number;
  green: number;
  red: number;
}

const wide = (text: string): Buffer => Buffer.from(`${text}\0`, 'utf16le');
const trackTint: Tint = { blue: 24, green: 20, red: 17 };
const normalTints: Tint[] = [
  { blue: 244, green: 156, red: 51 },
  { blue: 231, green: 105, red: 139 },
];
const warningTint: Tint = { blue: 52, green: 171, red: 244 };
const criticalTint: Tint = { blue: 71, green: 73, red: 239 };
const tintFor = (window: CodexRateWindow, rowIndex: number): Tint => (window.utilization >= 90 ? criticalTint : window.utilization >= 75 ? warningTint : normalTints[rowIndex]);

if (User32.SetProcessDPIAware() === 0) console.error('SetProcessDPIAware failed — appbar coordinates may be DPI-virtualized.');

const callbackMessage = User32.RegisterWindowMessageW(wide('bun-win32.CodexUsageAppBar.PositionChanged').ptr!);
if (callbackMessage === 0) throw new Error('RegisterWindowMessageW failed.');

let closing = false;
let positionRequested = false;
let refreshRequested = true;
let repaintRequested = true;
let windowPositionChanged = false;

const wndProc = new JSCallback(
  (hWnd: bigint, msg: number, wParam: bigint, lParam: bigint): bigint => {
    if (msg === callbackMessage) {
      if (Number(wParam) === ABN_POSCHANGED) positionRequested = true;
      return 0n;
    }
    switch (msg) {
      case WM_DESTROY:
        closing = true;
        User32.PostQuitMessage(0);
        return 0n;
      case WM_DISPLAYCHANGE:
        positionRequested = true;
        return 0n;
      case WM_LBUTTONDOWN:
        refreshRequested = true;
        return 0n;
      case WM_PAINT:
        repaintRequested = true;
        return BigInt(User32.DefWindowProcW(hWnd, msg, wParam, lParam));
      case WM_RBUTTONDOWN:
        closing = true;
        return 0n;
      case WM_WINDOWPOSCHANGED:
        windowPositionChanged = true;
        return BigInt(User32.DefWindowProcW(hWnd, msg, wParam, lParam));
      default:
        return BigInt(User32.DefWindowProcW(hWnd, msg, wParam, lParam));
    }
  },
  { args: ['u64', 'u32', 'u64', 'i64'], returns: 'i64' },
);

const className = wide(`CodexUsageAppBar_${process.pid}`);
const windowClass = Buffer.alloc(80);
windowClass.writeUInt32LE(80, 0);
windowClass.writeBigUInt64LE(BigInt(wndProc.ptr!), 8);
windowClass.writeBigUInt64LE(BigInt(className.ptr!), 64);
if (!User32.RegisterClassExW(windowClass.ptr!)) {
  wndProc.close();
  throw new Error('RegisterClassExW failed.');
}

const screenWidth = User32.GetSystemMetrics(SM_CXSCREEN);
const screenHeight = User32.GetSystemMetrics(SM_CYSCREEN);
const exStyle = 0x0000_0080 /* WS_EX_TOOLWINDOW */ | 0x0800_0000; /* WS_EX_NOACTIVATE */
const hwnd = User32.CreateWindowExW(exStyle, className.ptr!, wide('Codex usage appbar').ptr!, WindowStyles.WS_POPUP, 0, screenHeight - RAIL_HEIGHT, screenWidth, RAIL_HEIGHT, 0n, 0n, 0n, null);
if (hwnd === 0n) {
  User32.UnregisterClassW(className.ptr!, 0n);
  wndProc.close();
  throw new Error('CreateWindowExW failed — likely no interactive desktop.');
}

const appBarData = Buffer.alloc(APPBAR_DATA_SIZE);
appBarData.writeUInt32LE(APPBAR_DATA_SIZE, 0);
appBarData.writeBigUInt64LE(hwnd, 8);
appBarData.writeUInt32LE(callbackMessage, 16);
appBarData.writeUInt32LE(AppBarEdge.ABE_BOTTOM, 20);

let appBarRegistered = false;
let frame = Buffer.alloc(screenWidth * RAIL_HEIGHT * 4);
const frameInfo = Buffer.alloc(40);
let toolbarWidth = screenWidth;
let toolbarHeight = RAIL_HEIGHT;
let usageWindows: CodexRateWindow[] = [];

const configureFrame = (): void => {
  frame = Buffer.alloc(toolbarWidth * toolbarHeight * 4);
  frameInfo.fill(0);
  frameInfo.writeUInt32LE(40, 0);
  frameInfo.writeInt32LE(toolbarWidth, 4);
  frameInfo.writeInt32LE(-toolbarHeight, 8);
  frameInfo.writeUInt16LE(1, 12);
  frameInfo.writeUInt16LE(32, 14);
};

const positionAppBar = (): void => {
  const currentScreenWidth = User32.GetSystemMetrics(SM_CXSCREEN);
  const currentScreenHeight = User32.GetSystemMetrics(SM_CYSCREEN);
  appBarData.writeInt32LE(0, 24);
  appBarData.writeInt32LE(0, 28);
  appBarData.writeInt32LE(currentScreenWidth, 32);
  appBarData.writeInt32LE(currentScreenHeight, 36);
  void Shell32.SHAppBarMessage(AppBarMessage.ABM_QUERYPOS, appBarData.ptr!);
  appBarData.writeInt32LE(appBarData.readInt32LE(36) - RAIL_HEIGHT, 28);
  void Shell32.SHAppBarMessage(AppBarMessage.ABM_SETPOS, appBarData.ptr!);
  const left = appBarData.readInt32LE(24);
  const top = appBarData.readInt32LE(28);
  const right = appBarData.readInt32LE(32);
  const bottom = appBarData.readInt32LE(36);
  const nextWidth = right - left;
  const nextHeight = bottom - top;
  if (nextWidth !== toolbarWidth || nextHeight !== toolbarHeight) {
    toolbarWidth = nextWidth;
    toolbarHeight = nextHeight;
    configureFrame();
  }
  User32.SetWindowPos(hwnd, 0n, left, top, toolbarWidth, toolbarHeight, SWP_NOACTIVATE_SHOWWINDOW);
  repaintRequested = true;
};

const paint = (): void => {
  const rows = Math.max(1, usageWindows.length);
  for (let y = 0; y < toolbarHeight; y++) {
    const rowIndex = Math.min(usageWindows.length - 1, Math.floor((y * rows) / toolbarHeight));
    const usageWindow = usageWindows[rowIndex];
    const fillWidth = usageWindow ? Math.round((toolbarWidth * usageWindow.utilization) / 100) : 0;
    const fillTint = usageWindow ? tintFor(usageWindow, rowIndex) : trackTint;
    for (let x = 0; x < toolbarWidth; x++) {
      const tint = x < fillWidth ? fillTint : trackTint;
      const offset = (y * toolbarWidth + x) * 4;
      frame[offset] = tint.blue;
      frame[offset + 1] = tint.green;
      frame[offset + 2] = tint.red;
      frame[offset + 3] = 0xff;
    }
  }
  const deviceContext = User32.GetDC(hwnd);
  if (deviceContext === 0n) return;
  void GDI32.SetDIBitsToDevice(deviceContext, 0, 0, toolbarWidth, toolbarHeight, 0, 0, 0, toolbarHeight, frame.ptr!, frameInfo.ptr!, 0);
  void User32.ReleaseDC(hwnd, deviceContext);
};

const messageBuffer = Buffer.alloc(48);
const pump = (): void => {
  while (User32.PeekMessageW(messageBuffer.ptr!, 0n, 0, 0, PM_REMOVE) !== 0) {
    User32.TranslateMessage(messageBuffer.ptr!);
    User32.DispatchMessageW(messageBuffer.ptr!);
  }
};

const usageClient = new CodexUsageClient();
let lastPollAt = 0;
let readInFlight: Promise<void> | null = null;
const startRefresh = (): void => {
  refreshRequested = false;
  lastPollAt = Date.now();
  readInFlight = usageClient
    .read()
    .then((windows) => {
      usageWindows = windows;
      repaintRequested = true;
    })
    .catch((error: unknown) => console.error(`Codex usage refresh failed: ${String(error)}`))
    .finally(() => {
      readInFlight = null;
    });
};

try {
  if (Shell32.SHAppBarMessage(AppBarMessage.ABM_NEW, appBarData.ptr!) === 0n) throw new Error('SHAppBarMessage(ABM_NEW) failed.');
  appBarRegistered = true;
  configureFrame();
  positionAppBar();
  User32.ShowWindow(hwnd, ShowWindowCommand.SW_SHOWNOACTIVATE);
  console.log('Codex usage appbar active — polling every 60s. Left-click = refresh, right-click = quit.');

  while (!closing) {
    pump();
    const now = Date.now();
    if (positionRequested) {
      positionRequested = false;
      positionAppBar();
    }
    if (windowPositionChanged) {
      windowPositionChanged = false;
      void Shell32.SHAppBarMessage(AppBarMessage.ABM_WINDOWPOSCHANGED, appBarData.ptr!);
    }
    if (!readInFlight && (refreshRequested || now - lastPollAt >= POLL_INTERVAL_MS)) startRefresh();
    if (repaintRequested) {
      repaintRequested = false;
      paint();
    }
    await Bun.sleep(50);
  }
} finally {
  usageClient.close();
  if (appBarRegistered) void Shell32.SHAppBarMessage(AppBarMessage.ABM_REMOVE, appBarData.ptr!);
  User32.DestroyWindow(hwnd);
  User32.UnregisterClassW(className.ptr!, 0n);
  wndProc.close();
}
