/**
 * Gamepad Monitor
 *
 * Polls all four XInput controller slots in real time using the legacy
 * xinput9_1_0.dll and renders a live dashboard showing stick positions,
 * trigger levels, and active button state. Demonstrates that the older
 * XInput 9.1.0 API still works for basic controller input on modern
 * Windows without requiring xinput1_4.dll.
 *
 * APIs demonstrated:
 *   - Xinput9_1_0.XInputGetState        (poll gamepad state)
 *   - Xinput9_1_0.XInputGetCapabilities  (query device capabilities)
 *   - Xinput9_1_0.XInputSetState          (set controller vibration)
 *
 * Run: bun run example/gamepad-monitor.ts
 */

import Xinput9_1_0, {
  XUSER_MAX_COUNT,
  XInputDevSubType,
  XInputGamepadButtons,
  XInputGetCapabilitiesFlags,
} from '../index';

Xinput9_1_0.Preload(['XInputGetState', 'XInputGetCapabilities', 'XInputSetState']);

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

function stickBar(value: number, label: string): string {
  const normalized = (value + 32768) / 65535;
  const width = 16;
  const pos = Math.round(normalized * (width - 1));
  const bar = Array(width).fill(`${ANSI.dim}.${ANSI.reset}`);
  bar[Math.floor(width / 2)] = `${ANSI.dim}|${ANSI.reset}`;
  bar[pos] = `${ANSI.cyan}#${ANSI.reset}`;
  return `${label} [${bar.join('')}] ${value.toString().padStart(6)}`;
}

function triggerBar(value: number, label: string): string {
  const width = 10;
  const filled = Math.round((value / 255) * width);
  const bar = `${'#'.repeat(filled)}${ANSI.dim}${'.'.repeat(width - filled)}${ANSI.reset}`;
  return `${label} [${bar}] ${value.toString().padStart(3)}`;
}

function subtypeName(subType: number): string {
  return (XInputDevSubType[subType] ?? 'UNKNOWN').replace('XINPUT_DEVSUBTYPE_', '');
}

const stateBuffers = Array.from({ length: XUSER_MAX_COUNT }, () => Buffer.alloc(16));
const capsBuffers = Array.from({ length: XUSER_MAX_COUNT }, () => Buffer.alloc(20));
const vibrationBuffer = Buffer.alloc(4); // XINPUT_VIBRATION: wLeftMotorSpeed + wRightMotorSpeed
const connected = new Array<boolean>(XUSER_MAX_COUNT).fill(false);

for (let i = 0; i < XUSER_MAX_COUNT; i++) {
  const result = Xinput9_1_0.XInputGetCapabilities(i, XInputGetCapabilitiesFlags.XINPUT_FLAG_GAMEPAD, capsBuffers[i].ptr);
  connected[i] = result === ERROR_SUCCESS;
}

function stopAllVibration(): void {
  vibrationBuffer.writeUInt16LE(0, 0);
  vibrationBuffer.writeUInt16LE(0, 2);
  for (let i = 0; i < XUSER_MAX_COUNT; i++) {
    if (connected[i]) Xinput9_1_0.XInputSetState(i, vibrationBuffer.ptr);
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
  output.push(`${ANSI.bold}${ANSI.cyan}Gamepad Monitor${ANSI.reset}  ${ANSI.dim}(xinput9_1_0)  Frame ${frames}  Ctrl+C to exit${ANSI.reset}`);
  output.push('');

  let anyConnected = false;

  for (let i = 0; i < XUSER_MAX_COUNT; i++) {
    const result = Xinput9_1_0.XInputGetState(i, stateBuffers[i].ptr);
    if (result !== ERROR_SUCCESS) {
      connected[i] = false;
      continue;
    }

    if (!connected[i]) {
      connected[i] = true;
      Xinput9_1_0.XInputGetCapabilities(i, XInputGetCapabilitiesFlags.XINPUT_FLAG_GAMEPAD, capsBuffers[i].ptr);
    }

    const state = stateBuffers[i];
    const subType = capsBuffers[i].readUInt8(1);
    const wButtons = state.readUInt16LE(4);
    const bLeftTrigger = state.readUInt8(6);
    const bRightTrigger = state.readUInt8(7);
    const sThumbLX = state.readInt16LE(8);
    const sThumbLY = state.readInt16LE(10);
    const sThumbRX = state.readInt16LE(12);
    const sThumbRY = state.readInt16LE(14);

    // Vibration: left trigger → left motor, right trigger → right motor
    vibrationBuffer.writeUInt16LE(Math.round((bLeftTrigger / 255) * 65535), 0);
    vibrationBuffer.writeUInt16LE(Math.round((bRightTrigger / 255) * 65535), 2);
    Xinput9_1_0.XInputSetState(i, vibrationBuffer.ptr);

    const activeButtons = BUTTON_LABELS.filter(([mask]) => (wButtons & mask) !== 0)
      .map(([, label]) => `${ANSI.green}${label}${ANSI.reset}`)
      .join(' ');

    output.push(`${ANSI.bold}${ANSI.white}Controller ${i}${ANSI.reset}  ${ANSI.dim}${subtypeName(subType)}${ANSI.reset}  Pkt: ${state.readUInt32LE(0)}`);
    output.push(`  ${stickBar(sThumbLX, 'LX')}`);
    output.push(`  ${stickBar(sThumbLY, 'LY')}`);
    output.push(`  ${stickBar(sThumbRX, 'RX')}`);
    output.push(`  ${stickBar(sThumbRY, 'RY')}`);
    output.push(`  ${triggerBar(bLeftTrigger, 'LT')}    ${triggerBar(bRightTrigger, 'RT')}`);
    output.push(`  Buttons: ${activeButtons || `${ANSI.dim}(none)${ANSI.reset}`}`);
    const lVib = Math.round((bLeftTrigger / 255) * 100);
    const rVib = Math.round((bRightTrigger / 255) * 100);
    output.push(`  Vibration: L ${lVib > 0 ? `${ANSI.yellow}${lVib}%${ANSI.reset}` : `${ANSI.dim}0%${ANSI.reset}`}  R ${rVib > 0 ? `${ANSI.yellow}${rVib}%${ANSI.reset}` : `${ANSI.dim}0%${ANSI.reset}`}`);
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
