/**
 * dualsense-taskbar — live PS5 DualSense + WH-1000XM5 headset battery meter pinned to the Windows taskbar.
 *
 * Renders your DualSense controller's battery level as a compact widget sitting on
 * the taskbar, by default immediately right of the claude-usage-taskbar widget (so
 * the two sit side by side; move it with DUALSENSE_X). It finds the pad
 * via HID device enumeration — no XInput, no driver — reads its input report on
 * demand, and decodes the battery byte: level 0..100% plus charge state. It borrows
 * the claude-usage-taskbar bar styling exactly (same height, pill radius, quarter
 * ticks, gloss): a color-coded pill (green high, amber mid, red low) with a game-pad
 * icon on the left and the percent centered in the bar. While charging, the fill
 * turns gold with a sweeping shimmer behind the percent, so the charge is
 * unmistakable. A sampled taskbar color is keyed away so the meters float on a
 * transparent surface.
 *
 * Zero configuration and zero interference: the device handle is opened only for
 * the split second each poll takes to read the report, then closed, so it never
 * fights a running game for the controller. When no pad is connected the widget
 * hides itself entirely and keeps scanning; it reappears the moment one connects.
 * Left-click refreshes immediately; right-click quits. Works with the standard
 * DualSense and the DualSense Edge, over both USB and Bluetooth.
 *
 * APIs demonstrated:
 * - setupapi (SetupDiGetClassDevsW + SetupDiEnumDeviceInterfaces +
 *   SetupDiGetDeviceInterfaceDetailW + SetupDiDestroyDeviceInfoList to enumerate
 *   the HID device interfaces and resolve each device path; and, for the headset,
 *   SetupDiEnumDeviceInfo + SetupDiGetDevicePropertyW to read DEVPKEY_Bluetooth_Battery
 *   and DEVPKEY_Device_FriendlyName off each present Bluetooth device node — the
 *   WH-1000XM5 is Bluetooth Classic audio with no HID battery report, so its charge
 *   is a device property, not an input report)
 * - hid (HidD_GetHidGuid for the HID interface class, HidD_GetAttributes to match
 *   the DualSense by VID:PID, HidD_GetProductString for the product name, and
 *   HidD_GetInputReport to read the current battery byte — the device path identifies
 *   USB report 0x01 versus Bluetooth report 0x31 without HidP preparsed data)
 * - kernel32 (CreateFileW / CloseHandle to open and release the device, opened
 *   read-only and only transiently so games keep exclusive-free access)
 * - user32 (SetProcessDPIAware, FindWindowW + GetWindowRect to locate Shell_TrayWnd,
 *   RegisterClassExW + CreateWindowExW for a layered tool window, then
 *   SetWindowLongPtrW(GWL_STYLE → WS_CHILD) + SetParent + MoveWindow to reparent it
 *   INSIDE Shell_TrayWnd, with ShowWindow show/hide, color-key transparency, a
 *   PeekMessageW/TranslateMessage/DispatchMessageW pump, GetDC/ReleaseDC, and
 *   SetWindowPos HWND_TOP reassertion)
 * - gdi32 (GetPixel taskbar color sampling, SetDIBitsToDevice single-blit software
 *   compositing — antialiased rounded pill, gradient fill, lightning-bolt polygon,
 *   charging shimmer — CreateFontW + SetTextAlign + TextOutW ClearType text, BitBlt +
 *   CreateCompatibleBitmap + GetDIBits screenshot verify)
 * - terminal (encodePNG for the CAPTURE_PNG verification screenshot)
 *
 * Env: DUALSENSE_X / DUALSENSE_WIDTH (pixel overrides), DUALSENSE_POLL_MS
 * (device poll interval, default 2000), DUALSENSE_FAKE=level:state (inject a battery
 * state for headless capture with no hardware — e.g. 75:charging, 20:discharging,
 * 100:full, 10:error), XM5_FAKE=level (inject a headset battery level for headless
 * capture, e.g. 100), XM5_NAME (override the headset friendly-name match, default
 * "WH-1000XM5"), CAPTURE_PNG=path (write a taskbar screenshot after first draw),
 * RENDER_PNG=path (dump the widget's own composited frame — screen-independent, works
 * even with the display locked), DEMO_DURATION_MS (self-exit for headless runs).
 *
 * Run: bun run example/dualsense-taskbar.ts
 */
import { JSCallback } from 'bun:ffi';

import { ShowWindowCommand, WindowStyles } from '@bun-win32/user32';
import { encodePNG } from '@bun-win32/terminal';
import { GDI32, Hid, Kernel32, Setupapi, User32 } from '../index';

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
Hid.Preload(['HidD_GetAttributes', 'HidD_GetHidGuid', 'HidD_GetInputReport', 'HidD_GetProductString']);
Kernel32.Preload(['CloseHandle', 'CreateFileW']);
Setupapi.Preload(['SetupDiDestroyDeviceInfoList', 'SetupDiEnumDeviceInfo', 'SetupDiEnumDeviceInterfaces', 'SetupDiGetClassDevsW', 'SetupDiGetDeviceInterfaceDetailW', 'SetupDiGetDevicePropertyW']);

const WM_DESTROY = 0x0002;
const WM_PAINT = 0x000f;
const WM_LBUTTONDOWN = 0x0201;
const WM_RBUTTONDOWN = 0x0204;
const PM_REMOVE = 0x0001;
const LWA_COLORKEY = 0x0000_0001;
const CAPTUREBLT = 0x4000_0000;
const SRCCOPY = 0x00cc_0020;
const SWP_NOSIZE_NOMOVE_NOACTIVATE = 0x0000_0013;

const DIGCF_PRESENT = 0x0000_0002;
const DIGCF_ALLCLASSES = 0x0000_0004;
const DIGCF_DEVICEINTERFACE = 0x0000_0010;
const FILE_SHARE_READ = 0x0000_0001;
const FILE_SHARE_WRITE = 0x0000_0002;
const GENERIC_READ = 0x8000_0000;
const OPEN_EXISTING = 3;
const INVALID_HANDLE_VALUE = 0xffff_ffff_ffff_ffffn;

const SONY_VID = 0x054c;
const DUALSENSE_PIDS = [0x0ce6, 0x0df2]; // Standard, Edge
const POLL_INTERVAL_MS = Number(Bun.env.DUALSENSE_POLL_MS ?? 2_000);

const wide = (text: string): Buffer => Buffer.from(`${text}\0`, 'utf16le');
const readWideString = (buffer: Buffer, offset: number, maxBytes: number): string => buffer.toString('utf16le', offset, offset + maxBytes).replace(/\0.*$/, '');

// A GUID / DEVPROPKEY assembled by hand from raw bytes is one transposed digit away from a
// segfault, so parse the canonical string form: Data1 (u32 LE), Data2/Data3 (u16 LE), Data4 (8 bytes in order).
const guidBuffer = (guid: string): Buffer => {
  const hex = guid.replace(/[{}-]/g, '');
  const bytes = Buffer.alloc(16);
  bytes.writeUInt32LE(Number.parseInt(hex.slice(0, 8), 16), 0);
  bytes.writeUInt16LE(Number.parseInt(hex.slice(8, 12), 16), 4);
  bytes.writeUInt16LE(Number.parseInt(hex.slice(12, 16), 16), 6);
  for (let index = 0; index < 8; index++) bytes.writeUInt8(Number.parseInt(hex.slice(16 + index * 2, 18 + index * 2), 16), 8 + index);
  return bytes;
};
// DEVPROPKEY { DEVPROPGUID fmtid; DEVPROPID pid; } — 16-byte GUID + a u32 property id, 20 bytes total.
const devpropkeyBuffer = (guid: string, propertyId: number): Buffer => {
  const key = Buffer.alloc(20);
  guidBuffer(guid).copy(key, 0);
  key.writeUInt32LE(propertyId, 16);
  return key;
};

// The WH-1000XM5 is Bluetooth Classic audio, not an HID device — it exposes no battery input
// report. Windows instead surfaces its HFP battery level as DEVPKEY_Bluetooth_Battery, read here via
// SetupDiGetDevicePropertyW. The battery-bearing node is the hidden "Hands-Free AG" device, which is
// NOT in the Bluetooth device-interface class — so we scan every present device (DIGCF_ALLCLASSES)
// and keep the first with the property whose friendly name matches (override XM5_NAME).
const DEVPKEY_Bluetooth_Battery = devpropkeyBuffer('{104EA319-6EE2-4701-BD47-8DDBF425BBE5}', 2);
const DEVPKEY_Device_FriendlyName = devpropkeyBuffer('{a45c254e-df1c-4efd-8020-67d146a850e0}', 14);
const HEADSET_MATCH = (Bun.env.XM5_NAME ?? 'WH-1000XM5').toLowerCase();

type ChargeState = 'discharging' | 'charging' | 'error';
interface Battery {
  chargeState: ChargeState;
  percent: number;
}
interface DualSense {
  devicePath: string;
  inputReportLength: number;
  productName: string;
  reportId: number;
  statusOffset: number;
}

const decodeBattery = (statusByte: number): Battery => {
  const level = statusByte & 0x0f;
  const chargeNibble = (statusByte >> 4) & 0x0f;
  // Verified against real DualSense hardware: the low nibble is the true level in every state,
  // and this controller reports charge nibble 0x2 (not the textbook 0x1) while actively charging
  // — so treat both 0x1 and 0x2 as "charging/plugged" and always read the level from the low
  // nibble. Never force 100 on the charge nibble; a genuinely full pad reads low nibble 10.
  const chargeState: ChargeState = chargeNibble === 0x0 ? 'discharging' : chargeNibble === 0x1 || chargeNibble === 0x2 ? 'charging' : 'error';
  const percent = Math.min(level, 10) * 10;
  return { chargeState, percent };
};

// Open transiently, read one input report, decode the battery byte, close. Returns
// null on any failure so the poll loop treats it as a disconnect and re-enumerates.
const readBattery = (device: DualSense): Battery | null => {
  const pathBuffer = Buffer.from(`${device.devicePath}\0`, 'utf16le');
  const handle = Kernel32.CreateFileW(pathBuffer.ptr!, GENERIC_READ, FILE_SHARE_READ | FILE_SHARE_WRITE, null, OPEN_EXISTING, 0, 0n);
  if (handle === INVALID_HANDLE_VALUE) return null;
  const reportBuffer = Buffer.alloc(device.inputReportLength);
  reportBuffer.writeUInt8(device.reportId, 0);
  const ok = Hid.HidD_GetInputReport(handle, reportBuffer.ptr!, device.inputReportLength) !== 0;
  const battery = ok ? decodeBattery(reportBuffer.readUInt8(device.statusOffset)) : null;
  Kernel32.CloseHandle(handle);
  return battery;
};

// Connection type comes from the device path, not from probing report IDs: over
// Bluetooth the OS also answers the USB report 0x01 with a synthesized, truncated
// compatibility report (battery byte zeroed), so probing 0x01 first misreads a
// Bluetooth pad as USB. The Bluetooth-HID class GUID (or the `vid&` bus form) in
// the path is unambiguous. USB → report 0x01 / 64 B / battery at [53]; Bluetooth →
// report 0x31 / 78 B / battery at [54] (the whole payload is shifted one byte).
const connectionOf = (devicePath: string): { inputReportLength: number; reportId: number; statusOffset: number } => {
  const lower = devicePath.toLowerCase();
  const bluetooth = lower.includes('{00001124-0000-1000-8000-00805f9b34fb}') || lower.includes('vid&');
  return bluetooth ? { inputReportLength: 78, reportId: 0x31, statusOffset: 54 } : { inputReportLength: 64, reportId: 0x01, statusOffset: 53 };
};

const findDualSense = (): DualSense | null => {
  const hidGuid = Buffer.alloc(16);
  Hid.HidD_GetHidGuid(hidGuid.ptr!);
  const deviceInfoSet = Setupapi.SetupDiGetClassDevsW(hidGuid.ptr!, null, 0n, DIGCF_PRESENT | DIGCF_DEVICEINTERFACE);
  if (deviceInfoSet === INVALID_HANDLE_VALUE) return null;

  let found: DualSense | null = null;
  try {
    for (let index = 0; ; index++) {
      const interfaceData = Buffer.alloc(32);
      interfaceData.writeUInt32LE(32, 0);
      if (Setupapi.SetupDiEnumDeviceInterfaces(deviceInfoSet, null, hidGuid.ptr!, index, interfaceData.ptr!) === 0) break;

      const requiredSize = Buffer.alloc(4);
      Setupapi.SetupDiGetDeviceInterfaceDetailW(deviceInfoSet, interfaceData.ptr!, null, 0, requiredSize.ptr!, null);
      const detailSize = requiredSize.readUInt32LE(0);
      if (detailSize === 0) continue;

      const detailData = Buffer.alloc(detailSize);
      detailData.writeUInt32LE(8, 0);
      if (Setupapi.SetupDiGetDeviceInterfaceDetailW(deviceInfoSet, interfaceData.ptr!, detailData.ptr!, detailSize, null, null) === 0) continue;
      const devicePath = readWideString(detailData, 4, detailSize - 4);
      if (!devicePath) continue;

      const pathBuffer = Buffer.from(`${devicePath}\0`, 'utf16le');
      const attributeHandle = Kernel32.CreateFileW(pathBuffer.ptr!, 0, FILE_SHARE_READ | FILE_SHARE_WRITE, null, OPEN_EXISTING, 0, 0n);
      if (attributeHandle === INVALID_HANDLE_VALUE) continue;
      const attributes = Buffer.alloc(12);
      attributes.writeUInt32LE(12, 0);
      const matched = Hid.HidD_GetAttributes(attributeHandle, attributes.ptr!) !== 0 && attributes.readUInt16LE(4) === SONY_VID && DUALSENSE_PIDS.includes(attributes.readUInt16LE(6));
      const nameBuffer = Buffer.alloc(512);
      const productName = matched && Hid.HidD_GetProductString(attributeHandle, nameBuffer.ptr!, 512) !== 0 ? readWideString(nameBuffer, 0, 512) : 'DualSense';
      Kernel32.CloseHandle(attributeHandle);
      if (!matched) continue;

      const connection = connectionOf(devicePath);
      const confirmHandle = Kernel32.CreateFileW(pathBuffer.ptr!, GENERIC_READ, FILE_SHARE_READ | FILE_SHARE_WRITE, null, OPEN_EXISTING, 0, 0n);
      if (confirmHandle === INVALID_HANDLE_VALUE) continue;
      const confirm = Buffer.alloc(connection.inputReportLength);
      confirm.writeUInt8(connection.reportId, 0);
      const responds = Hid.HidD_GetInputReport(confirmHandle, confirm.ptr!, connection.inputReportLength) !== 0 && confirm.readUInt8(0) === connection.reportId;
      Kernel32.CloseHandle(confirmHandle);
      if (!responds) continue;

      found = { devicePath, inputReportLength: connection.inputReportLength, productName, reportId: connection.reportId, statusOffset: connection.statusOffset };
      break;
    }
  } finally {
    Setupapi.SetupDiDestroyDeviceInfoList(deviceInfoSet);
  }
  return found;
};

// Enumerate present Bluetooth device nodes and return the battery of the first whose friendly
// name matches HEADSET_MATCH. DEVPKEY_Bluetooth_Battery is a single DEVPROP_TYPE_BYTE (0..100);
// absence of the property (device off / not a battery-reporting peripheral) fails the read and is skipped.
const readHeadsetBattery = (): Battery | null => {
  const deviceInfoSet = Setupapi.SetupDiGetClassDevsW(null, null, 0n, DIGCF_PRESENT | DIGCF_ALLCLASSES);
  if (deviceInfoSet === INVALID_HANDLE_VALUE) return null;

  let found: Battery | null = null;
  try {
    const deviceInfoData = Buffer.alloc(32); // SP_DEVINFO_DATA on x64: cbSize + GUID + DevInst + ULONG_PTR
    for (let index = 0; ; index++) {
      deviceInfoData.writeUInt32LE(32, 0);
      if (Setupapi.SetupDiEnumDeviceInfo(deviceInfoSet, index, deviceInfoData.ptr!) === 0) break;

      const propertyType = Buffer.alloc(4);
      const batteryValue = Buffer.alloc(4);
      if (Setupapi.SetupDiGetDevicePropertyW(deviceInfoSet, deviceInfoData.ptr!, DEVPKEY_Bluetooth_Battery.ptr!, propertyType.ptr!, batteryValue.ptr!, 4, null, 0) === 0) continue;
      const percent = batteryValue.readUInt8(0);
      if (percent > 100) continue;

      const nameType = Buffer.alloc(4);
      const nameBuffer = Buffer.alloc(256);
      const nameLength = Setupapi.SetupDiGetDevicePropertyW(deviceInfoSet, deviceInfoData.ptr!, DEVPKEY_Device_FriendlyName.ptr!, nameType.ptr!, nameBuffer.ptr!, 256, null, 0) !== 0 ? 256 : 0;
      if (!readWideString(nameBuffer, 0, nameLength).toLowerCase().includes(HEADSET_MATCH)) continue;

      // HFP battery carries no charge-state nibble, so the headset row always renders as a plain level.
      found = { chargeState: 'discharging', percent };
      break;
    }
  } finally {
    Setupapi.SetupDiDestroyDeviceInfoList(deviceInfoSet);
  }
  return found;
};

const parseFakeBattery = (): Battery | null => {
  const raw = Bun.env.DUALSENSE_FAKE;
  if (!raw) return null;
  const [levelText, stateText] = raw.split(':');
  const percent = Math.max(0, Math.min(100, Number(levelText) || 0));
  const chargeState: ChargeState = stateText === 'charging' || stateText === 'error' ? stateText : 'discharging';
  return { chargeState, percent };
};

const parseFakeHeadset = (): Battery | null => {
  const raw = Bun.env.XM5_FAKE;
  if (!raw) return null;
  return { chargeState: 'discharging', percent: Math.max(0, Math.min(100, Number(raw) || 0)) };
};

interface Tint {
  blue: number;
  green: number;
  red: number;
}
const tintFrom = (rgb: number): Tint => ({ blue: rgb & 0xff, green: (rgb >> 8) & 0xff, red: (rgb >> 16) & 0xff });
const mixTint = (from: Tint, to: Tint, amount: number): Tint => ({ blue: from.blue + (to.blue - from.blue) * amount, green: from.green + (to.green - from.green) * amount, red: from.red + (to.red - from.red) * amount });
const WHITE_TINT = tintFrom(0xff_ff_ff);
const PS_BLUE_TINT = tintFrom(0x2e_8b_ff);

// Green high, amber mid, red low — inverted from a utilization meter: for a battery,
// full is good and empty is bad.
const batteryGradient = (percent: number): [Tint, Tint] => {
  if (percent >= 50) return [tintFrom(0x1f_9d_5b), tintFrom(0x43_d1_7c)];
  if (percent >= 20) return [tintFrom(0xc8_82_1e), tintFrom(0xf7_c5_48)];
  return [tintFrom(0xc8_3a_36), tintFrom(0xff_7a_59)];
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
const widgetWidth = Number(Bun.env.DUALSENSE_WIDTH ?? Math.round(220 * scale));
// Sit immediately right of the claude-usage-taskbar widget (its defaults: X 218, width 236, + an 8px gap) so the two never overlap.
const widgetX = taskbarLeft + Number(Bun.env.DUALSENSE_X ?? Math.round((218 + 236 + 8) * scale));
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

let battery: Battery | null = parseFakeBattery();
let headset: Battery | null = parseFakeHeadset();
let connected = battery !== null || headset !== null;

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

const className = wide(`DualSenseTaskbar_${process.pid}`);
const windowClass = Buffer.alloc(80);
windowClass.writeUInt32LE(80, 0);
windowClass.writeBigUInt64LE(BigInt(wndProc.ptr!), 8);
windowClass.writeBigUInt64LE(BigInt(className.ptr!), 64);
if (!User32.RegisterClassExW(windowClass.ptr!)) {
  wndProc.close();
  throw new Error('RegisterClassExW failed.');
}

const exStyle = 0x0008_0000 /* WS_EX_LAYERED */ | 0x0000_0080 /* WS_EX_TOOLWINDOW */ | 0x0800_0000; /* WS_EX_NOACTIVATE */
const hwnd = User32.CreateWindowExW(exStyle, className.ptr!, wide('DualSense battery').ptr!, WindowStyles.WS_POPUP, widgetX, widgetY, widgetWidth, widgetHeight, 0n, 0n, 0n, null);
if (hwnd === 0n) {
  User32.UnregisterClassW(className.ptr!, 0n);
  wndProc.close();
  throw new Error('CreateWindowExW failed — likely no interactive desktop.');
}
void User32.SetWindowLongPtrW(hwnd, -16 /* GWL_STYLE */, BigInt(WindowStyles.WS_CHILD));
const parentedToTaskbar = User32.SetParent(hwnd, taskbarHandle) !== 0n;
if (!parentedToTaskbar) {
  console.error('SetParent(Shell_TrayWnd) failed — falling back to a plain topmost overlay (the taskbar can cover it when activated).');
  void User32.SetWindowLongPtrW(hwnd, -16 /* GWL_STYLE */, BigInt(WindowStyles.WS_POPUP));
}
if (User32.SetLayeredWindowAttributes(hwnd, backgroundColor, 0xff, LWA_COLORKEY) === 0) console.error('SetLayeredWindowAttributes failed — transparent background may be unavailable.');
User32.MoveWindow(hwnd, parentedToTaskbar ? widgetX - taskbarLeft : widgetX, parentedToTaskbar ? 0 : widgetY, widgetWidth, widgetHeight, 1);
const zOrderAnchor = parentedToTaskbar ? 0n /* HWND_TOP */ : 0xffff_ffff_ffff_ffffn; /* HWND_TOPMOST */

// Segoe MDL2 Assets glyph E7FC is the native Windows game-controller icon — crisp
// at any size via GDI TextOutW and tintable, unlike the color emoji 🎮 which GDI
// renders as monochrome tofu. The percent font mirrors claude-usage-taskbar.
const iconFont = GDI32.CreateFontW(-Math.round(18 * scale), 0, 0, 0, 400, 0, 0, 0, 0, 0, 0, 5 /* CLEARTYPE_QUALITY */, 0, wide('Segoe MDL2 Assets').ptr!);
const iconFontSmall = GDI32.CreateFontW(-Math.round(15 * scale), 0, 0, 0, 400, 0, 0, 0, 0, 0, 0, 5 /* CLEARTYPE_QUALITY */, 0, wide('Segoe MDL2 Assets').ptr!);
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

// Same bar metrics as claude-usage-taskbar: barLeft 34, pill radius = height/2, quarter ticks,
// top-45% gloss, bar stretched to the right edge (minus card spacing). One device fills the widget
// with a single 15px bar; two devices split it into stacked half-height bands, each a 13px bar.
// Segoe MDL2 Assets: E7FC game controller (DualSense), E7F6 headphone (WH-1000XM5).
const barLeft = Math.round(34 * scale);
const barRight = widgetWidth - Math.round(12 * scale);
const CONTROLLER_GLYPH = '';
const HEADSET_GLYPH = '';

interface DeviceRow {
  battery: Battery;
  glyph: string;
}
const activeRows = (): DeviceRow[] => {
  const rows: DeviceRow[] = [];
  if (battery) rows.push({ battery, glyph: CONTROLLER_GLYPH });
  if (headset) rows.push({ battery: headset, glyph: HEADSET_GLYPH });
  return rows;
};

const cellHeightOf = (font: bigint): number => {
  const metricsDC = User32.GetDC(0n);
  const previousFont = GDI32.SelectObject(metricsDC, font);
  const textMetrics = Buffer.alloc(64);
  void GDI32.GetTextMetricsW(metricsDC, textMetrics.ptr!);
  GDI32.SelectObject(metricsDC, previousFont);
  void User32.ReleaseDC(0n, metricsDC);
  return textMetrics.readInt32LE(0);
};
const iconCellLarge = cellHeightOf(iconFont);
const iconCellSmall = cellHeightOf(iconFontSmall);
const percentCell = cellHeightOf(percentFont);

const fillRightOf = (percent: number, barHeight: number): number => (percent <= 0 ? barLeft : Math.max(barLeft + barHeight, barLeft + ((barRight - barLeft) * Math.min(100, percent)) / 100));

let shimmerPhase = 0;
const composeRow = (rowBattery: Battery, rowTop: number, barHeight: number): void => {
  const rowBottom = rowTop + barHeight;
  const pillRadius = barHeight / 2;
  drawRoundedRect(barLeft, rowTop, barRight, rowBottom, pillRadius, () => trackTint, 1);
  for (const quarter of [0.25, 0.5, 0.75]) {
    const tickX = Math.round(barLeft + (barRight - barLeft) * quarter);
    for (let tickY = rowTop + Math.round(3 * scale); tickY < rowBottom - Math.round(3 * scale); tickY++) blendPixel(tickX, tickY, backgroundTint, 0.45);
  }
  if (rowBattery.percent > 0) {
    const fillRight = fillRightOf(rowBattery.percent, barHeight);
    const charging = rowBattery.chargeState === 'charging';
    const [darkTint, brightTint] = charging ? [tintFrom(0xb8_7a_12), tintFrom(0xff_d4_4a)] : batteryGradient(rowBattery.percent);
    const glossBottom = rowTop + barHeight * 0.45;
    const sweepX = barLeft + (((shimmerPhase % 1) + 1) % 1) * (fillRight - barLeft);
    const fillTintAt = (x: number, y: number): Tint => {
      const gradient = mixTint(darkTint, brightTint, clamp01((x - barLeft) / (fillRight - barLeft)));
      const glossed = y < glossBottom ? mixTint(gradient, WHITE_TINT, 0.16) : gradient;
      if (!charging) return glossed;
      const shimmer = clamp01(1 - Math.abs(x - sweepX) / (barHeight * 0.9));
      return mixTint(glossed, WHITE_TINT, 0.28 * shimmer);
    };
    drawRoundedRect(barLeft, rowTop, fillRight, rowBottom, pillRadius, fillTintAt, 1);
  }
};

let hasDrawn = false;
const paint = (deviceContext: bigint): void => {
  for (let index = 0; index < frame.length; index += 4) {
    frame[index] = backgroundTint.blue;
    frame[index + 1] = backgroundTint.green;
    frame[index + 2] = backgroundTint.red;
  }
  drawRoundedRect(5 * scale, 9 * scale, 7.5 * scale, widgetHeight - 9 * scale, 1.25 * scale, () => PS_BLUE_TINT, 1);
  const rows = activeRows();
  const twoRows = rows.length >= 2;
  const barHeight = Math.round((twoRows ? 13 : 15) * scale);
  const bandHeight = widgetHeight / Math.max(1, rows.length); // one row → full-height band, i.e. centered
  const rowTopAt = (rowIndex: number): number => Math.round(bandHeight * (rowIndex + 0.5) - barHeight / 2);
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) composeRow(rows[rowIndex].battery, rowTopAt(rowIndex), barHeight);
  void GDI32.SetDIBitsToDevice(deviceContext, 0, 0, widgetWidth, widgetHeight, 0, 0, 0, widgetHeight, frame.ptr!, frameInfo.ptr!, 0);
  GDI32.SetBkMode(deviceContext, 1 /* TRANSPARENT */);
  const textOut = (x: number, y: number, text: string, color: number, align: number): void => {
    void GDI32.SetTextAlign(deviceContext, align);
    GDI32.SetTextColor(deviceContext, color);
    void GDI32.TextOutW(deviceContext, x, y, wide(text).ptr!, text.length);
  };
  const iconCell = twoRows ? iconCellSmall : iconCellLarge;
  const percentCenterX = (barLeft + barRight) >> 1;
  // The percent shows in every state; while a controller charges the gold sweeping shimmer behind it signals the charge.
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const bandCenterY = bandHeight * (rowIndex + 0.5);
    const rowTop = rowTopAt(rowIndex);
    const rowBattery = rows[rowIndex].battery;
    GDI32.SelectObject(deviceContext, twoRows ? iconFontSmall : iconFont);
    textOut(Math.round(11 * scale), Math.round(bandCenterY - iconCell / 2), rows[rowIndex].glyph, textColor, 0 /* TA_LEFT */);
    GDI32.SelectObject(deviceContext, percentFont);
    const percentText = `${rowBattery.percent}%`;
    const percentTextOffsetY = Math.round(bandCenterY - percentCell / 2);
    const fillRight = Math.round(fillRightOf(rowBattery.percent, barHeight));
    void GDI32.SaveDC(deviceContext);
    void GDI32.IntersectClipRect(deviceContext, barLeft, rowTop, fillRight, rowTop + barHeight);
    textOut(percentCenterX, percentTextOffsetY, percentText, textColor, 6 /* TA_CENTER */);
    void GDI32.RestoreDC(deviceContext, -1);
    void GDI32.SaveDC(deviceContext);
    void GDI32.IntersectClipRect(deviceContext, fillRight, rowTop, barRight, rowTop + barHeight);
    textOut(percentCenterX, percentTextOffsetY, percentText, dimTextColor, 6 /* TA_CENTER */);
    void GDI32.RestoreDC(deviceContext, -1);
  }
};
const draw = (): void => {
  const deviceContext = User32.GetDC(hwnd);
  if (deviceContext === 0n) return;
  hasDrawn = true;
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

let visible = false;
const setVisible = (next: boolean): void => {
  if (next === visible) return;
  visible = next;
  User32.ShowWindow(hwnd, next ? ShowWindowCommand.SW_SHOWNOACTIVATE : 0 /* SW_HIDE */);
  if (next) User32.SetWindowPos(hwnd, zOrderAnchor, 0, 0, 0, 0, SWP_NOSIZE_NOMOVE_NOACTIVATE);
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

// Dump the widget's own composited BGRA frame straight to PNG — screen-independent
// (unlike the BitBlt screenshot, this works even when the display is locked or off).
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

const fakeMode = parseFakeBattery() !== null || parseFakeHeadset() !== null;
console.log(`DualSense + headset battery widget at (${widgetX}, ${widgetY}) ${widgetWidth}×${widgetHeight} — polling every ${POLL_INTERVAL_MS / 1000}s. Left-click = refresh, right-click = quit.`);

const startedAt = Date.now();
const demoDurationMs = Number(Bun.env.DEMO_DURATION_MS ?? 0);
let cachedDevice: DualSense | null = null;
let lastPollAt = 0;
let captured = false;
let rendered = false;

const poll = (): void => {
  if (fakeMode) {
    connected = battery !== null || headset !== null;
    return;
  }
  if (!cachedDevice) cachedDevice = findDualSense();
  if (cachedDevice) {
    const reading = readBattery(cachedDevice);
    if (reading) {
      battery = reading;
    } else {
      cachedDevice = null;
      battery = null;
    }
  } else {
    battery = null;
  }
  headset = readHeadsetBattery();
  connected = battery !== null || headset !== null;
};

while (!closing) {
  pump();
  const now = Date.now();
  if ((refreshRequested && now - lastPollAt >= 500) || now - lastPollAt >= POLL_INTERVAL_MS) {
    refreshRequested = false;
    lastPollAt = now;
    poll();
    repaintRequested = true;
  }
  const animating = connected && battery?.chargeState === 'charging';
  if (animating) {
    shimmerPhase += 0.08;
    repaintRequested = true;
  }
  setVisible(connected);
  if (visible && repaintRequested) {
    repaintRequested = false;
    draw();
    User32.SetWindowPos(hwnd, zOrderAnchor, 0, 0, 0, 0, SWP_NOSIZE_NOMOVE_NOACTIVATE);
  }
  if (!captured && hasDrawn && Bun.env.CAPTURE_PNG) {
    captured = true;
    await captureTaskbarRegion(Bun.env.CAPTURE_PNG);
  }
  if (!rendered && hasDrawn && Bun.env.RENDER_PNG) {
    rendered = true;
    await renderFramePNG(Bun.env.RENDER_PNG);
  }
  if (demoDurationMs > 0 && now - startedAt >= demoDurationMs) closing = true;
  await Bun.sleep(animating ? 80 : 100);
}

void GDI32.DeleteObject(iconFont);
void GDI32.DeleteObject(iconFontSmall);
void GDI32.DeleteObject(percentFont);
User32.DestroyWindow(hwnd);
User32.UnregisterClassW(className.ptr!, 0n);
wndProc.close();
