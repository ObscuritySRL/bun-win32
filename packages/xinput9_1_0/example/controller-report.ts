/**
 * Controller Report
 *
 * Scans all four XInput user indices using the legacy xinput9_1_0.dll and
 * produces a capability and state report for every connected controller.
 * Also queries DirectSound audio device GUIDs (the legacy audio endpoint
 * mechanism). Useful for verifying basic XInput availability through the
 * older API surface.
 *
 * APIs demonstrated:
 *   - Xinput9_1_0.XInputGetState                     (detect and read state)
 *   - Xinput9_1_0.XInputGetCapabilities                (query capabilities)
 *   - Xinput9_1_0.XInputGetDSoundAudioDeviceGuids     (query DSound GUIDs)
 *
 * Run: bun run example/controller-report.ts
 */

import Xinput9_1_0, {
  XUSER_MAX_COUNT,
  XInputCapsFlags,
  XInputDevSubType,
  XInputDevType,
  XInputGamepadButtons,
  XInputGetCapabilitiesFlags,
} from '../index';

Xinput9_1_0.Preload(['XInputGetState', 'XInputGetCapabilities', 'XInputGetDSoundAudioDeviceGuids']);

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
const GUID_SIZE = 16;
const GUID_NULL = '00000000-0000-0000-0000-000000000000';

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

function formatGuid(buf: Buffer, offset: number): string {
  const data1 = buf.readUInt32LE(offset).toString(16).padStart(8, '0');
  const data2 = buf.readUInt16LE(offset + 4).toString(16).padStart(4, '0');
  const data3 = buf.readUInt16LE(offset + 6).toString(16).padStart(4, '0');
  const data4High = buf.subarray(offset + 8, offset + 10).toString('hex');
  const data4Low = buf.subarray(offset + 10, offset + 16).toString('hex');
  return `${data1}-${data2}-${data3}-${data4High}-${data4Low}`;
}

function printRow(label: string, value: string): void {
  console.log(`  ${ANSI.dim}${label.padEnd(24)}${ANSI.reset}${value}`);
}

function reportController(index: number): boolean {
  const stateBuffer = Buffer.alloc(16);
  const stateResult = Xinput9_1_0.XInputGetState(index, stateBuffer.ptr);

  if (stateResult !== ERROR_SUCCESS) return false;

  console.log(`${ANSI.bold}${ANSI.white}Controller ${index}${ANSI.reset}`);

  const capsBuffer = Buffer.alloc(20);
  const capsResult = Xinput9_1_0.XInputGetCapabilities(index, XInputGetCapabilitiesFlags.XINPUT_FLAG_GAMEPAD, capsBuffer.ptr);

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
    printRow('Supported Buttons', `${buttonList.length} buttons`);

    const hasLeftMotor = capsBuffer.readUInt16LE(16) > 0;
    const hasRightMotor = capsBuffer.readUInt16LE(18) > 0;
    printRow('Left Vibration Motor', hasLeftMotor ? `${ANSI.green}Yes${ANSI.reset}` : `${ANSI.dim}No${ANSI.reset}`);
    printRow('Right Vibration Motor', hasRightMotor ? `${ANSI.green}Yes${ANSI.reset}` : `${ANSI.dim}No${ANSI.reset}`);
  }

  const renderGuid = Buffer.alloc(GUID_SIZE);
  const captureGuid = Buffer.alloc(GUID_SIZE);
  const dsoundResult = Xinput9_1_0.XInputGetDSoundAudioDeviceGuids(index, renderGuid.ptr, captureGuid.ptr);

  if (dsoundResult === ERROR_SUCCESS) {
    const renderStr = formatGuid(renderGuid, 0);
    const captureStr = formatGuid(captureGuid, 0);
    printRow('DSound Render GUID', renderStr === GUID_NULL ? `${ANSI.dim}(null GUID)${ANSI.reset}` : renderStr);
    printRow('DSound Capture GUID', captureStr === GUID_NULL ? `${ANSI.dim}(null GUID)${ANSI.reset}` : captureStr);
  }

  printRow('Packet Number', stateBuffer.readUInt32LE(0).toString());

  const wButtons = stateBuffer.readUInt16LE(4);
  const activeButtons = flagNames(XInputGamepadButtons, wButtons);
  printRow('Active Buttons', activeButtons.length > 0 ? activeButtons.join(', ') : `${ANSI.dim}(none)${ANSI.reset}`);

  console.log('');
  return true;
}

console.log(`${ANSI.bold}${ANSI.cyan}XInput Controller Report${ANSI.reset}`);
console.log(`${ANSI.dim}Scanning ${XUSER_MAX_COUNT} user indices via xinput9_1_0.dll${ANSI.reset}`);
console.log('');

let found = 0;
for (let i = 0; i < XUSER_MAX_COUNT; i++) {
  if (reportController(i)) found++;
}

if (found === 0) {
  console.log(`${ANSI.yellow}No controllers connected.${ANSI.reset}`);
  console.log(`${ANSI.dim}Connect an Xbox controller and run again.${ANSI.reset}`);
} else {
  console.log(`${ANSI.green}${found} controller(s) found.${ANSI.reset}`);
}
