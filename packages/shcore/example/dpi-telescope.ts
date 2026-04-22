/**
 * DPI Telescope - Survey the display universe through Windows' scaling lens.
 *
 * A stargazing tour across the DPI and scaling functions of shcore.dll. The
 * telescope first checks the current process's DPI awareness, then reads the
 * preferred device scale factor for the primary and immersive displays, then
 * asks the shell for the DPI of its three UI surfaces (taskbar, notification
 * area, deskband). Finally it queries a handful of IsOS constants to identify
 * the host OS's capabilities. All calls are read-only — no process state is
 * changed.
 *
 * Demonstrates:
 * - GetProcessDpiAwareness (ProcessDpiAwareness enum)
 * - GetScaleFactorForDevice (DisplayDeviceType enum)
 * - GetDpiForShellUIComponent (ShellUiComponent enum)
 * - IsOS (OsValue enum)
 *
 * Run: bun run example/dpi-telescope.ts
 */

import Shcore, { DeviceScaleFactor, DisplayDeviceType, OsValue, ProcessDpiAwareness, ShellUiComponent } from '../index';

const divider = '-'.repeat(70);
const awarenessLabel: Record<number, string> = {
  [ProcessDpiAwareness.PROCESS_DPI_UNAWARE]: 'Unaware (virtualized to 96 DPI)',
  [ProcessDpiAwareness.PROCESS_SYSTEM_DPI_AWARE]: 'System DPI-aware',
  [ProcessDpiAwareness.PROCESS_PER_MONITOR_DPI_AWARE]: 'Per-monitor DPI-aware',
};

console.log('');
console.log('  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
console.log('  ~            THE DPI TELESCOPE OBSERVATORY               ~');
console.log('  ~    "The pixels are strange and the scale is stranger"  ~');
console.log('  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
console.log('');

// Station 1: Process DPI awareness
console.log('  Station 1: Charting this process\'s own DPI awareness');
console.log('  ' + divider);

const awarenessBuf = Buffer.alloc(4);
const gpdaHr = Shcore.GetProcessDpiAwareness(0n, awarenessBuf.ptr);
if (gpdaHr === 0) {
  const awareness = awarenessBuf.readInt32LE(0);
  console.log(`    Current process awareness: ${awarenessLabel[awareness] ?? `unknown (${awareness})`}`);
} else {
  console.log(`    GetProcessDpiAwareness failed: 0x${(gpdaHr >>> 0).toString(16)}`);
}
console.log('');

// Station 2: Device scale factors
console.log('  Station 2: Preferred scale factor per device class');
console.log('  ' + divider);

const devices: Array<[DisplayDeviceType, string]> = [
  [DisplayDeviceType.DEVICE_PRIMARY, 'Primary display (the desktop monitor)'],
  [DisplayDeviceType.DEVICE_IMMERSIVE, 'Immersive display (tablet / tablet-mode)'],
];

for (const [device, description] of devices) {
  const scale = Shcore.GetScaleFactorForDevice(device);
  const label = DeviceScaleFactor[scale] ?? `SCALE_${scale}_PERCENT`;
  console.log(`    ${description}`);
  console.log(`      -> ${scale}% (${label})`);
  console.log('');
}

// Station 3: Shell UI DPI
console.log('  Station 3: DPI of the shell\'s own surfaces');
console.log('  ' + divider);

const components: Array<[ShellUiComponent, string]> = [
  [ShellUiComponent.SHELL_UI_COMPONENT_TASKBARS, 'Taskbars'],
  [ShellUiComponent.SHELL_UI_COMPONENT_NOTIFICATIONAREA, 'Notification area (system tray)'],
  [ShellUiComponent.SHELL_UI_COMPONENT_DESKBAND, 'Deskband'],
];

for (const [component, label] of components) {
  const dpi = Shcore.GetDpiForShellUIComponent(component);
  const percent = Math.round((dpi / 96) * 100);
  console.log(`    ${label.padEnd(35)} ${dpi} DPI (${percent}%)`);
}
console.log('');

// Station 4: IsOS constellation
console.log('  Station 4: Identifying the host constellation via IsOS');
console.log('  ' + divider);

const osQueries: Array<[OsValue, string]> = [
  [OsValue.OS_WINDOWS, 'Any Windows'],
  [OsValue.OS_NTWORKSTATION, 'NT-family workstation'],
  [OsValue.OS_NTSERVER, 'NT-family server'],
  [OsValue.OS_PROFESSIONAL, 'Professional SKU'],
  [OsValue.OS_DOMAINMEMBER, 'Joined to a domain'],
  [OsValue.OS_TERMINALCLIENT, 'Running inside a Terminal Services session'],
  [OsValue.OS_TABLETPC, 'Tablet PC edition'],
  [OsValue.OS_WOW6432, 'Running under WOW64'],
  [OsValue.OS_XPORGREATER, 'Windows XP or greater'],
  [OsValue.OS_WIN2000ORGREATER, 'Windows 2000 or greater'],
];

for (const [value, description] of osQueries) {
  const is = Shcore.IsOS(value);
  const marker = is ? '[YES]' : '[ -- ]';
  console.log(`    ${marker} ${description}`);
}
console.log('');

console.log('  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
console.log('  ~  The observatory has logged all 4 stations.           ~');
console.log('  ~  May your pixels always measure true.                 ~');
console.log('  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
console.log('');
