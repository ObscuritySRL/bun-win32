/**
 * Controller Audit
 *
 * Scans all four XInput user indices and produces a detailed report for
 * every connected controller: device type and subtype, capability flags,
 * supported gamepad features, battery information, and audio device IDs.
 * Designed for hardware diagnostics, QA validation, and input system
 * debugging.
 *
 * APIs demonstrated:
 *   - Xinput1_4.XInputGetState              (detect connected controllers)
 *   - Xinput1_4.XInputGetCapabilities         (query device capabilities)
 *   - Xinput1_4.XInputGetBatteryInformation  (query battery status)
 *   - Xinput1_4.XInputGetAudioDeviceIds       (query audio endpoints)
 *
 * Run: bun run example/controller-audit.ts
 */

import Xinput1_4, {
  BatteryDevType,
  BatteryLevel,
  BatteryType,
  XUSER_MAX_COUNT,
  XInputCapsFlags,
  XInputDevSubType,
  XInputDevType,
  XInputGamepadButtons,
  XInputGetCapabilitiesFlags,
} from '../index';

Xinput1_4.Preload(['XInputGetState', 'XInputGetCapabilities', 'XInputGetBatteryInformation', 'XInputGetAudioDeviceIds']);

const ANSI = {
  bold: '\x1b[1m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
  white: '\x1b[97m',
  yellow: '\x1b[33m',
} as const;

const ERROR_SUCCESS = 0;

function enumName(enumObj: Record<string, string | number>, value: number): string {
  for (const [key, val] of Object.entries(enumObj)) {
    if (val === value && typeof val === 'number') return key;
  }
  return `0x${value.toString(16).padStart(2, '0')}`;
}

function flagNames(enumObj: Record<string, string | number>, value: number): string[] {
  const flags: string[] = [];
  for (const [key, val] of Object.entries(enumObj)) {
    if (typeof val === 'number' && val !== 0 && (value & val) === val) {
      flags.push(key);
    }
  }
  return flags;
}

function printRow(label: string, value: string, indent = 2): void {
  console.log(`${' '.repeat(indent)}${ANSI.dim}${label.padEnd(24)}${ANSI.reset}${value}`);
}

function readWideString(buf: Buffer): string {
  return buf.toString('utf16le').replace(/\0.*$/, '');
}

function auditController(index: number): boolean {
  const stateBuffer = Buffer.alloc(16);
  const stateResult = Xinput1_4.XInputGetState(index, stateBuffer.ptr);

  if (stateResult !== ERROR_SUCCESS) return false;

  console.log(`${ANSI.bold}${ANSI.white}Controller ${index}${ANSI.reset}`);

  const capsBuffer = Buffer.alloc(20);
  const capsResult = Xinput1_4.XInputGetCapabilities(index, XInputGetCapabilitiesFlags.XINPUT_FLAG_GAMEPAD, capsBuffer.ptr);

  if (capsResult === ERROR_SUCCESS) {
    const type = capsBuffer.readUInt8(0);
    const subType = capsBuffer.readUInt8(1);
    const capsFlags = capsBuffer.readUInt16LE(2);

    printRow('Device Type', enumName(XInputDevType, type));
    printRow('Device SubType', enumName(XInputDevSubType, subType));

    const activeFlags = flagNames(XInputCapsFlags, capsFlags);
    printRow('Capability Flags', activeFlags.length > 0 ? activeFlags.join(', ') : '(none)');

    const supportedButtons = capsBuffer.readUInt16LE(4);
    const buttonList = flagNames(XInputGamepadButtons, supportedButtons);
    printRow('Supported Buttons', buttonList.length > 0 ? `${buttonList.length} buttons` : '(none)');

    const hasLeftTrigger = capsBuffer.readUInt8(6) > 0;
    const hasRightTrigger = capsBuffer.readUInt8(7) > 0;
    printRow('Left Trigger', hasLeftTrigger ? `${ANSI.green}Yes${ANSI.reset}` : `${ANSI.dim}No${ANSI.reset}`);
    printRow('Right Trigger', hasRightTrigger ? `${ANSI.green}Yes${ANSI.reset}` : `${ANSI.dim}No${ANSI.reset}`);

    const hasLeftMotor = capsBuffer.readUInt16LE(16) > 0;
    const hasRightMotor = capsBuffer.readUInt16LE(18) > 0;
    printRow('Left Vibration Motor', hasLeftMotor ? `${ANSI.green}Yes${ANSI.reset}` : `${ANSI.dim}No${ANSI.reset}`);
    printRow('Right Vibration Motor', hasRightMotor ? `${ANSI.green}Yes${ANSI.reset}` : `${ANSI.dim}No${ANSI.reset}`);
  }

  const gamepadBattery = Buffer.alloc(2);
  const gamepadBatteryResult = Xinput1_4.XInputGetBatteryInformation(index, BatteryDevType.BATTERY_DEVTYPE_GAMEPAD, gamepadBattery.ptr);

  if (gamepadBatteryResult === ERROR_SUCCESS) {
    const batteryType = gamepadBattery.readUInt8(0);
    const batteryLevel = gamepadBattery.readUInt8(1);
    const typeName = enumName(BatteryType, batteryType);
    const color = batteryType === BatteryType.BATTERY_TYPE_WIRED ? ANSI.green : batteryLevel <= BatteryLevel.BATTERY_LEVEL_LOW ? ANSI.red : batteryLevel === BatteryLevel.BATTERY_LEVEL_MEDIUM ? ANSI.yellow : ANSI.green;
    printRow('Gamepad Battery Type', typeName);
    printRow('Gamepad Battery Level', batteryType === BatteryType.BATTERY_TYPE_WIRED ? `${ANSI.green}Wired${ANSI.reset}` : `${color}${enumName(BatteryLevel, batteryLevel)}${ANSI.reset}`);
  }

  const headsetBattery = Buffer.alloc(2);
  const headsetBatteryResult = Xinput1_4.XInputGetBatteryInformation(index, BatteryDevType.BATTERY_DEVTYPE_HEADSET, headsetBattery.ptr);

  if (headsetBatteryResult === ERROR_SUCCESS) {
    const batteryType = headsetBattery.readUInt8(0);
    const typeName = enumName(BatteryType, batteryType);
    printRow('Headset Battery Type', batteryType === BatteryType.BATTERY_TYPE_DISCONNECTED ? `${ANSI.dim}Not connected${ANSI.reset}` : typeName);
  }

  const renderIdBuffer = Buffer.alloc(512);
  const renderCountBuffer = Buffer.alloc(4);
  renderCountBuffer.writeUInt32LE(256, 0);
  const captureIdBuffer = Buffer.alloc(512);
  const captureCountBuffer = Buffer.alloc(4);
  captureCountBuffer.writeUInt32LE(256, 0);

  const audioResult = Xinput1_4.XInputGetAudioDeviceIds(index, renderIdBuffer.ptr, renderCountBuffer.ptr, captureIdBuffer.ptr, captureCountBuffer.ptr);

  if (audioResult === ERROR_SUCCESS) {
    const renderId = readWideString(renderIdBuffer);
    const captureId = readWideString(captureIdBuffer);
    printRow('Audio Render Device', renderId.length > 0 ? renderId : `${ANSI.dim}(none)${ANSI.reset}`);
    printRow('Audio Capture Device', captureId.length > 0 ? captureId : `${ANSI.dim}(none)${ANSI.reset}`);
  }

  const dwPacketNumber = stateBuffer.readUInt32LE(0);
  printRow('Packet Number', dwPacketNumber.toString());
  console.log('');

  return true;
}

console.log(`${ANSI.bold}${ANSI.cyan}XInput Controller Audit${ANSI.reset}`);
console.log(`${ANSI.dim}Scanning ${XUSER_MAX_COUNT} user indices via xinput1_4.dll${ANSI.reset}`);
console.log('');

let found = 0;
for (let i = 0; i < XUSER_MAX_COUNT; i++) {
  if (auditController(i)) found++;
}

if (found === 0) {
  console.log(`${ANSI.yellow}No controllers connected.${ANSI.reset}`);
  console.log(`${ANSI.dim}Connect an Xbox controller and run again.${ANSI.reset}`);
} else {
  console.log(`${ANSI.green}${found} controller(s) found.${ANSI.reset}`);
}
