/**
 * DualSense Radar
 *
 * Finds a PS5 DualSense controller via HID device enumeration (no XInput
 * emulation required), then polls its raw input report at ~30 fps and
 * renders a live ASCII radar showing stick positions as XY crosshairs,
 * trigger levels as horizontal bars, active buttons as highlighted labels,
 * and a decoded D-pad direction. Works with both the standard DualSense
 * and DualSense Edge over USB.
 *
 * APIs demonstrated:
 *   - Hid.HidD_GetHidGuid            (obtain HID interface GUID)
 *   - Hid.HidD_GetAttributes         (match DualSense by VID:PID)
 *   - Hid.HidD_GetProductString      (read product name from device)
 *   - Hid.HidD_GetPreparsedData      (retrieve preparsed data handle)
 *   - Hid.HidP_GetCaps               (determine input report length)
 *   - Hid.HidD_FreePreparsedData     (release preparsed data)
 *   - Hid.HidD_GetInputReport        (read current input state)
 *   - Hid.HidD_SetOutputReport       (send vibration output report)
 *   - Kernel32.CreateFileW / CloseHandle (open and release device handle)
 *   - SetupDi* via dlopen             (enumerate HID device interfaces)
 *
 * DualSense USB input report layout (Report ID 0x01, 64 bytes):
 *   [0]    Report ID (0x01)
 *   [1]    Left stick X   (0x00=left, 0x80=center, 0xFF=right)
 *   [2]    Left stick Y   (0x00=up,   0x80=center, 0xFF=down)
 *   [3]    Right stick X
 *   [4]    Right stick Y
 *   [5]    L2 trigger     (0x00..0xFF)
 *   [6]    R2 trigger     (0x00..0xFF)
 *   [7]    Sequence counter
 *   [8]    D-pad (bits 0-3), Square (4), Cross (5), Circle (6), Triangle (7)
 *   [9]    L1 (0), R1 (1), L2 btn (2), R2 btn (3), Create (4), Options (5),
 *          L3 (6), R3 (7)
 *   [10]   PS (0), Touchpad (1), Mute (2)
 *
 * Run: bun run example/dualsense-radar.ts
 */

import { dlopen, FFIType, type Pointer } from 'bun:ffi';
import Hid, { HIDP_STATUS_SUCCESS } from '../index';
import Kernel32 from '@bun-win32/kernel32';

Hid.Preload(['HidD_GetHidGuid', 'HidD_GetAttributes', 'HidD_GetProductString', 'HidD_GetPreparsedData', 'HidP_GetCaps', 'HidD_FreePreparsedData', 'HidD_GetInputReport', 'HidD_SetOutputReport']);
Kernel32.Preload(['CreateFileW', 'CloseHandle']);

const ANSI = {
  bold: '\x1b[1m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  magenta: '\x1b[35m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
  white: '\x1b[97m',
  yellow: '\x1b[33m',
} as const;

const DIGCF_PRESENT = 0x0000_0002;
const DIGCF_DEVICEINTERFACE = 0x0000_0010;
const FILE_SHARE_READ = 0x0000_0001;
const FILE_SHARE_WRITE = 0x0000_0002;
const OPEN_EXISTING = 3;
const INVALID_HANDLE_VALUE = 0xffff_ffff_ffff_ffffn;

const SONY_VID = 0x054c;
const DUALSENSE_PIDS = [0x0ce6, 0x0df2]; // Standard, Edge

const DPAD_DIRECTIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', '--'] as const;

const RADAR_SIZE = 9;
const RADAR_CENTER = Math.floor(RADAR_SIZE / 2);

const setupapi = dlopen('setupapi.dll', {
  SetupDiGetClassDevsW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
  SetupDiEnumDeviceInterfaces: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
  SetupDiGetDeviceInterfaceDetailW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
  SetupDiDestroyDeviceInfoList: { args: [FFIType.u64], returns: FFIType.i32 },
});

function readWideString(buf: Buffer, offset: number, maxBytes: number): string {
  return buf.toString('utf16le', offset, offset + maxBytes).replace(/\0.*$/, '');
}

const GENERIC_READ = 0x8000_0000;
const GENERIC_WRITE = 0x4000_0000;

function findDualSense(): { handle: bigint; productName: string; inputReportLength: number; isBluetooth: boolean } | null {
  const guidBuf = Buffer.alloc(16);
  Hid.HidD_GetHidGuid(guidBuf.ptr);

  const hDevInfo = setupapi.symbols.SetupDiGetClassDevsW(guidBuf.ptr, null, null, DIGCF_PRESENT | DIGCF_DEVICEINTERFACE);
  if (hDevInfo === INVALID_HANDLE_VALUE) return null;

  let foundPath = '';
  let foundName = 'DualSense';
  let foundReportLen = 0;

  try {
    for (let index = 0; ; index++) {
      const interfaceData = Buffer.alloc(32);
      interfaceData.writeUInt32LE(32, 0);

      if (!setupapi.symbols.SetupDiEnumDeviceInterfaces(hDevInfo, null, guidBuf.ptr, index, interfaceData.ptr)) break;

      const requiredSize = Buffer.alloc(4);
      setupapi.symbols.SetupDiGetDeviceInterfaceDetailW(hDevInfo, interfaceData.ptr, null, 0, requiredSize.ptr, null);
      const detailSize = requiredSize.readUInt32LE(0);
      if (detailSize === 0) continue;

      const detailData = Buffer.alloc(detailSize);
      detailData.writeUInt32LE(8, 0);
      if (!setupapi.symbols.SetupDiGetDeviceInterfaceDetailW(hDevInfo, interfaceData.ptr, detailData.ptr, detailSize, null, null)) continue;

      const devicePath = readWideString(detailData, 4, detailSize - 4);
      if (!devicePath) continue;

      // Open with no access for attribute queries
      const pathBuf = Buffer.from(devicePath + '\0', 'utf16le');
      const hDevice = Kernel32.CreateFileW(pathBuf.ptr, 0, FILE_SHARE_READ | FILE_SHARE_WRITE, null!, OPEN_EXISTING, 0, 0n);
      if (hDevice === INVALID_HANDLE_VALUE) continue;

      const attrBuf = Buffer.alloc(12);
      attrBuf.writeUInt32LE(12, 0);
      if (!Hid.HidD_GetAttributes(hDevice, attrBuf.ptr)) {
        Kernel32.CloseHandle(hDevice);
        continue;
      }

      const vid = attrBuf.readUInt16LE(4);
      const pid = attrBuf.readUInt16LE(6);

      if (vid !== SONY_VID || !DUALSENSE_PIDS.includes(pid)) {
        Kernel32.CloseHandle(hDevice);
        continue;
      }

      // Check if this is the gamepad interface (usage page 0x01, usage 0x05)
      const ppDataPtr = Buffer.alloc(8);
      if (!Hid.HidD_GetPreparsedData(hDevice, ppDataPtr.ptr)) {
        Kernel32.CloseHandle(hDevice);
        continue;
      }

      const preparsedPtr = ppDataPtr.readBigUInt64LE(0);
      if (preparsedPtr === 0n) {
        Kernel32.CloseHandle(hDevice);
        continue;
      }

      const capsBuf = Buffer.alloc(64);
      const status = Hid.HidP_GetCaps(Number(preparsedPtr) as unknown as Pointer, capsBuf.ptr);
      Hid.HidD_FreePreparsedData(Number(preparsedPtr) as unknown as Pointer);

      if (status !== HIDP_STATUS_SUCCESS) {
        Kernel32.CloseHandle(hDevice);
        continue;
      }

      const usagePage = capsBuf.readUInt16LE(2);
      const usage = capsBuf.readUInt16LE(0);
      const inputReportLength = capsBuf.readUInt16LE(4);

      // Usage page 0x01 (Generic Desktop), Usage 0x05 (Gamepad)
      if (usagePage !== 0x01 || usage !== 0x05) {
        Kernel32.CloseHandle(hDevice);
        continue;
      }

      const nameBuf = Buffer.alloc(512);
      const gotName = Hid.HidD_GetProductString(hDevice, nameBuf.ptr, 512);
      foundName = gotName ? readWideString(nameBuf, 0, 512) : 'DualSense';
      foundPath = devicePath;
      foundReportLen = inputReportLength;

      Kernel32.CloseHandle(hDevice);
      break;
    }
  } finally {
    setupapi.symbols.SetupDiDestroyDeviceInfoList(hDevInfo);
  }

  if (!foundPath) return null;

  // Re-open with read/write access for input reports and vibration output
  const pathBuf = Buffer.from(foundPath + '\0', 'utf16le');
  const hDevice = Kernel32.CreateFileW(pathBuf.ptr, GENERIC_READ | GENERIC_WRITE, FILE_SHARE_READ | FILE_SHARE_WRITE, null!, OPEN_EXISTING, 0, 0n);
  if (hDevice === INVALID_HANDLE_VALUE) return null;

  // USB = 64 bytes, Bluetooth = 78 bytes
  const isBluetooth = foundReportLen === 78;
  return { handle: hDevice, productName: foundName, inputReportLength: foundReportLen, isBluetooth };
}

function renderRadar(stickX: number, stickY: number): string[] {
  const grid: string[][] = Array.from({ length: RADAR_SIZE }, () => Array(RADAR_SIZE).fill(' '));
  for (let i = 0; i < RADAR_SIZE; i++) {
    grid[RADAR_CENTER][i] = `${ANSI.dim}-${ANSI.reset}`;
    grid[i][RADAR_CENTER] = `${ANSI.dim}|${ANSI.reset}`;
  }
  grid[RADAR_CENTER][RADAR_CENTER] = `${ANSI.dim}+${ANSI.reset}`;
  const px = Math.round((stickX / 255) * (RADAR_SIZE - 1));
  const py = Math.round((stickY / 255) * (RADAR_SIZE - 1));
  const cx = Math.max(0, Math.min(RADAR_SIZE - 1, px));
  const cy = Math.max(0, Math.min(RADAR_SIZE - 1, py));
  grid[cy][cx] = `${ANSI.cyan}*${ANSI.reset}`;
  return grid.map((row) => row.join(''));
}

function triggerBar(value: number, label: string): string {
  const width = 10;
  const filled = Math.round((value / 255) * width);
  const bar = `${'#'.repeat(filled)}${ANSI.dim}${'.'.repeat(width - filled)}${ANSI.reset}`;
  return `${label} [${bar}] ${value.toString().padStart(3)}`;
}

console.log(`${ANSI.bold}${ANSI.cyan}DualSense Radar${ANSI.reset}`);
console.log(`${ANSI.dim}Searching for PS5 DualSense controller...${ANSI.reset}`);

const device = findDualSense();

if (!device) {
  console.log('');
  console.log(`${ANSI.yellow}No DualSense controller found.${ANSI.reset}`);
  console.log(`${ANSI.dim}Connect a PS5 DualSense or DualSense Edge via USB or Bluetooth and try again.${ANSI.reset}`);
  process.exit(0);
}

const connectionType = device.isBluetooth ? 'Bluetooth' : 'USB';
console.log(`${ANSI.green}Found: ${device.productName}${ANSI.reset}  ${ANSI.dim}(${connectionType}, ${device.inputReportLength} bytes)${ANSI.reset}`);

// USB report: ID 0x01 (64 B), sticks at bytes 1-4, triggers at 5-6, buttons at 8-10
// BT report:  ID 0x31 (78 B), byte 1 is a BT header, then same layout shifted by 1
const reportId = device.isBluetooth ? 0x31 : 0x01;
const off = device.isBluetooth ? 1 : 0;

const reportBuf = Buffer.alloc(device.inputReportLength);
const outputBuf = Buffer.alloc(device.isBluetooth ? 78 : 48);

function sendVibration(leftMotor: number, rightMotor: number): void {
  outputBuf.fill(0);
  if (device!.isBluetooth) {
    outputBuf[0] = 0x31;
    outputBuf[1] = 0x02;
    outputBuf[2] = 0x01;
    outputBuf[4] = rightMotor;
    outputBuf[5] = leftMotor;
    const crcInput = Buffer.alloc(75);
    crcInput[0] = 0xa2;
    outputBuf.copy(crcInput, 1, 0, 74);
    outputBuf.writeUInt32LE(Bun.hash.crc32(crcInput), 74);
  } else {
    outputBuf[0] = 0x02;
    outputBuf[1] = 0x01;
    outputBuf[3] = rightMotor;
    outputBuf[4] = leftMotor;
  }
  Hid.HidD_SetOutputReport(device!.handle, outputBuf.ptr, outputBuf.length);
}

process.stdout.write('\x1b[?25l');
process.on('SIGINT', () => {
  sendVibration(0, 0);
  Kernel32.CloseHandle(device!.handle);
  process.stdout.write('\x1b[?25h\n');
  process.exit(0);
});

let frames = 0;

while (true) {
  reportBuf.fill(0);
  reportBuf.writeUInt8(reportId, 0);

  const ok = Hid.HidD_GetInputReport(device.handle, reportBuf.ptr, device.inputReportLength);
  if (!ok) {
    process.stdout.write(`\x1b[2J\x1b[H${ANSI.red}Lost connection to DualSense.${ANSI.reset}\n`);
    break;
  }

  const lx = reportBuf.readUInt8(1 + off);
  const ly = reportBuf.readUInt8(2 + off);
  const rx = reportBuf.readUInt8(3 + off);
  const ry = reportBuf.readUInt8(4 + off);
  const l2 = reportBuf.readUInt8(5 + off);
  const r2 = reportBuf.readUInt8(6 + off);

  sendVibration(l2, r2);
  const buttons1 = reportBuf.readUInt8(8 + off);
  const buttons2 = reportBuf.readUInt8(9 + off);
  const buttons3 = reportBuf.readUInt8(10 + off);

  const dpadIndex = buttons1 & 0x0f;
  const dpad = dpadIndex < DPAD_DIRECTIONS.length ? DPAD_DIRECTIONS[dpadIndex] : '--';

  const activeButtons: string[] = [];
  if (buttons1 & 0x10) activeButtons.push('Square');
  if (buttons1 & 0x20) activeButtons.push('Cross');
  if (buttons1 & 0x40) activeButtons.push('Circle');
  if (buttons1 & 0x80) activeButtons.push('Triangle');
  if (buttons2 & 0x01) activeButtons.push('L1');
  if (buttons2 & 0x02) activeButtons.push('R1');
  if (buttons2 & 0x04) activeButtons.push('L2');
  if (buttons2 & 0x08) activeButtons.push('R2');
  if (buttons2 & 0x10) activeButtons.push('Create');
  if (buttons2 & 0x20) activeButtons.push('Options');
  if (buttons2 & 0x40) activeButtons.push('L3');
  if (buttons2 & 0x80) activeButtons.push('R3');
  if (buttons3 & 0x01) activeButtons.push('PS');
  if (buttons3 & 0x02) activeButtons.push('Touch');
  if (buttons3 & 0x04) activeButtons.push('Mute');

  const leftRadar = renderRadar(lx, ly);
  const rightRadar = renderRadar(rx, ry);

  const output: string[] = [];
  output.push(`${ANSI.bold}${ANSI.cyan}DualSense Radar${ANSI.reset}  ${ANSI.dim}${device.productName} (${connectionType})  Frame ${frames}  Ctrl+C to exit${ANSI.reset}`);
  output.push('');
  output.push(`  ${ANSI.dim}Left Stick${ANSI.reset}        ${ANSI.dim}Right Stick${ANSI.reset}`);
  for (let i = 0; i < RADAR_SIZE; i++) {
    output.push(`  ${leftRadar[i]}        ${rightRadar[i]}`);
  }
  output.push('');
  output.push(`  ${triggerBar(l2, 'L2')}    ${triggerBar(r2, 'R2')}`);
  output.push(`  D-pad: ${dpad === '--' ? `${ANSI.dim}${dpad}${ANSI.reset}` : `${ANSI.magenta}${dpad}${ANSI.reset}`}`);
  output.push(`  Buttons: ${activeButtons.length > 0 ? activeButtons.map((b) => `${ANSI.green}${b}${ANSI.reset}`).join(' ') : `${ANSI.dim}(none)${ANSI.reset}`}`);
  const lVib = Math.round((l2 / 255) * 100);
  const rVib = Math.round((r2 / 255) * 100);
  output.push(`  Vibration: L ${lVib > 0 ? `${ANSI.yellow}${lVib}%${ANSI.reset}` : `${ANSI.dim}0%${ANSI.reset}`}  R ${rVib > 0 ? `${ANSI.yellow}${rVib}%${ANSI.reset}` : `${ANSI.dim}0%${ANSI.reset}`}`);

  process.stdout.write(`\x1b[2J\x1b[H${output.join('\n')}\n`);
  frames++;
  await Bun.sleep(33);
}

sendVibration(0, 0);
Kernel32.CloseHandle(device.handle);
