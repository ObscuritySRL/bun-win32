/**
 * Gamepad Radar
 *
 * Polls all four XInput controller slots in real time and renders a live
 * ASCII radar showing each connected controller's stick positions as XY
 * crosshairs, trigger levels as horizontal bars, and active buttons as
 * highlighted labels. Battery status is shown alongside each controller.
 * The display refreshes at ~30 fps and exits on Ctrl+C.
 *
 * APIs demonstrated:
 *   - Xinput1_4.XInputGetState              (poll gamepad state)
 *   - Xinput1_4.XInputGetBatteryInformation  (query battery level)
 *   - Xinput1_4.XInputGetCapabilities         (query device subtype)
 *
 * Run: bun run example/gamepad-radar.ts
 */

import Xinput1_4, {
  BatteryDevType,
  BatteryLevel,
  BatteryType,
  XUSER_MAX_COUNT,
  XInputDevSubType,
  XInputGamepadButtons,
  XInputGetCapabilitiesFlags,
} from '../index';

Xinput1_4.Preload(['XInputGetState', 'XInputGetBatteryInformation', 'XInputGetCapabilities']);

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

const ERROR_SUCCESS = 0;
const ERROR_DEVICE_NOT_CONNECTED = 1167;

const RADAR_SIZE = 9;
const RADAR_CENTER = Math.floor(RADAR_SIZE / 2);

const BUTTON_LABELS: [number, string][] = [
  [XInputGamepadButtons.XINPUT_GAMEPAD_A, 'A'],
  [XInputGamepadButtons.XINPUT_GAMEPAD_B, 'B'],
  [XInputGamepadButtons.XINPUT_GAMEPAD_X, 'X'],
  [XInputGamepadButtons.XINPUT_GAMEPAD_Y, 'Y'],
  [XInputGamepadButtons.XINPUT_GAMEPAD_LEFT_SHOULDER, 'LB'],
  [XInputGamepadButtons.XINPUT_GAMEPAD_RIGHT_SHOULDER, 'RB'],
  [XInputGamepadButtons.XINPUT_GAMEPAD_START, 'ST'],
  [XInputGamepadButtons.XINPUT_GAMEPAD_BACK, 'BK'],
  [XInputGamepadButtons.XINPUT_GAMEPAD_DPAD_UP, 'DU'],
  [XInputGamepadButtons.XINPUT_GAMEPAD_DPAD_DOWN, 'DD'],
  [XInputGamepadButtons.XINPUT_GAMEPAD_DPAD_LEFT, 'DL'],
  [XInputGamepadButtons.XINPUT_GAMEPAD_DPAD_RIGHT, 'DR'],
  [XInputGamepadButtons.XINPUT_GAMEPAD_LEFT_THUMB, 'LS'],
  [XInputGamepadButtons.XINPUT_GAMEPAD_RIGHT_THUMB, 'RS'],
];

function batteryLabel(batteryType: number, batteryLevel: number): string {
  const typeName = BatteryType[batteryType] ?? 'UNKNOWN';
  if (batteryType === BatteryType.BATTERY_TYPE_WIRED) return `${ANSI.green}Wired${ANSI.reset}`;
  if (batteryType === BatteryType.BATTERY_TYPE_DISCONNECTED) return `${ANSI.dim}N/A${ANSI.reset}`;
  const levelName = BatteryLevel[batteryLevel] ?? '?';
  const color = batteryLevel <= BatteryLevel.BATTERY_LEVEL_LOW ? ANSI.red : batteryLevel === BatteryLevel.BATTERY_LEVEL_MEDIUM ? ANSI.yellow : ANSI.green;
  return `${color}${levelName.replace('BATTERY_LEVEL_', '')}${ANSI.reset} (${typeName.replace('BATTERY_TYPE_', '')})`;
}

function subtypeName(subType: number): string {
  return (XInputDevSubType[subType] ?? 'UNKNOWN').replace('XINPUT_DEVSUBTYPE_', '');
}

function renderRadar(stickX: number, stickY: number): string[] {
  const grid: string[][] = Array.from({ length: RADAR_SIZE }, () => Array(RADAR_SIZE).fill(' '));
  for (let i = 0; i < RADAR_SIZE; i++) {
    grid[RADAR_CENTER][i] = `${ANSI.dim}-${ANSI.reset}`;
    grid[i][RADAR_CENTER] = `${ANSI.dim}|${ANSI.reset}`;
  }
  grid[RADAR_CENTER][RADAR_CENTER] = `${ANSI.dim}+${ANSI.reset}`;
  const px = Math.round(((stickX + 32768) / 65535) * (RADAR_SIZE - 1));
  const py = RADAR_SIZE - 1 - Math.round(((stickY + 32768) / 65535) * (RADAR_SIZE - 1));
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

function renderController(index: number, state: Buffer, caps: Buffer, battery: Buffer): string[] {
  const dwPacketNumber = state.readUInt32LE(0);
  const wButtons = state.readUInt16LE(4);
  const bLeftTrigger = state.readUInt8(6);
  const bRightTrigger = state.readUInt8(7);
  const sThumbLX = state.readInt16LE(8);
  const sThumbLY = state.readInt16LE(10);
  const sThumbRX = state.readInt16LE(12);
  const sThumbRY = state.readInt16LE(14);

  const subType = caps.readUInt8(1);
  const batteryType = battery.readUInt8(0);
  const batteryLevel = battery.readUInt8(1);

  const leftRadar = renderRadar(sThumbLX, sThumbLY);
  const rightRadar = renderRadar(sThumbRX, sThumbRY);

  const activeButtons = BUTTON_LABELS.filter(([mask]) => (wButtons & mask) !== 0)
    .map(([, label]) => `${ANSI.green}${label}${ANSI.reset}`)
    .join(' ');

  const lines: string[] = [];
  lines.push(`${ANSI.bold}${ANSI.white}Controller ${index}${ANSI.reset}  ${ANSI.dim}${subtypeName(subType)}${ANSI.reset}  Pkt: ${dwPacketNumber}  Bat: ${batteryLabel(batteryType, batteryLevel)}`);
  lines.push('');
  lines.push(`  ${ANSI.dim}Left Stick${ANSI.reset}        ${ANSI.dim}Right Stick${ANSI.reset}`);
  for (let i = 0; i < RADAR_SIZE; i++) {
    lines.push(`  ${leftRadar[i]}        ${rightRadar[i]}`);
  }
  lines.push('');
  lines.push(`  ${triggerBar(bLeftTrigger, 'LT')}    ${triggerBar(bRightTrigger, 'RT')}`);
  const lVib = Math.round((bLeftTrigger / 255) * 100);
  const rVib = Math.round((bRightTrigger / 255) * 100);
  lines.push(`  Vibration: L ${lVib > 0 ? `${ANSI.yellow}${lVib}%${ANSI.reset}` : `${ANSI.dim}0%${ANSI.reset}`}  R ${rVib > 0 ? `${ANSI.yellow}${rVib}%${ANSI.reset}` : `${ANSI.dim}0%${ANSI.reset}`}`);
  lines.push(`  Buttons: ${activeButtons || `${ANSI.dim}(none)${ANSI.reset}`}`);
  return lines;
}

const stateBuffers = Array.from({ length: XUSER_MAX_COUNT }, () => Buffer.alloc(16));
const capsBuffers = Array.from({ length: XUSER_MAX_COUNT }, () => Buffer.alloc(20));
const batteryBuffers = Array.from({ length: XUSER_MAX_COUNT }, () => Buffer.alloc(2));
const vibrationBuffer = Buffer.alloc(4); // XINPUT_VIBRATION: wLeftMotorSpeed + wRightMotorSpeed
const connected = new Array<boolean>(XUSER_MAX_COUNT).fill(false);

for (let i = 0; i < XUSER_MAX_COUNT; i++) {
  const capResult = Xinput1_4.XInputGetCapabilities(i, XInputGetCapabilitiesFlags.XINPUT_FLAG_GAMEPAD, capsBuffers[i].ptr);
  connected[i] = capResult === ERROR_SUCCESS;
}

function stopAllVibration(): void {
  vibrationBuffer.writeUInt16LE(0, 0);
  vibrationBuffer.writeUInt16LE(0, 2);
  for (let i = 0; i < XUSER_MAX_COUNT; i++) {
    if (connected[i]) Xinput1_4.XInputSetState(i, vibrationBuffer.ptr);
  }
}

process.stdout.write('\x1b[?25l');
process.on('SIGINT', () => {
  stopAllVibration();
  process.stdout.write('\x1b[?25h\n');
  process.exit(0);
});

let frames = 0;

while (true) {
  const output: string[] = [];
  output.push(`${ANSI.bold}${ANSI.cyan}Gamepad Radar${ANSI.reset}  ${ANSI.dim}Frame ${frames}  Ctrl+C to exit${ANSI.reset}`);
  output.push('');

  let anyConnected = false;

  for (let i = 0; i < XUSER_MAX_COUNT; i++) {
    const result = Xinput1_4.XInputGetState(i, stateBuffers[i].ptr);
    if (result === ERROR_DEVICE_NOT_CONNECTED) {
      if (connected[i]) {
        connected[i] = false;
      }
      continue;
    }
    if (result !== ERROR_SUCCESS) continue;

    if (!connected[i]) {
      connected[i] = true;
      Xinput1_4.XInputGetCapabilities(i, XInputGetCapabilitiesFlags.XINPUT_FLAG_GAMEPAD, capsBuffers[i].ptr);
    }

    Xinput1_4.XInputGetBatteryInformation(i, BatteryDevType.BATTERY_DEVTYPE_GAMEPAD, batteryBuffers[i].ptr);

    // Vibration: left trigger → left motor, right trigger → right motor
    const lt = stateBuffers[i].readUInt8(6);
    const rt = stateBuffers[i].readUInt8(7);
    vibrationBuffer.writeUInt16LE(Math.round((lt / 255) * 65535), 0);
    vibrationBuffer.writeUInt16LE(Math.round((rt / 255) * 65535), 2);
    Xinput1_4.XInputSetState(i, vibrationBuffer.ptr);

    output.push(...renderController(i, stateBuffers[i], capsBuffers[i], batteryBuffers[i]));
    output.push('');
    anyConnected = true;
  }

  if (!anyConnected) {
    output.push(`${ANSI.yellow}No controllers detected. Connect an Xbox controller and try again.${ANSI.reset}`);
  }

  process.stdout.write(`\x1b[2J\x1b[H${output.join('\n')}\n`);
  frames++;
  await Bun.sleep(33);
}
