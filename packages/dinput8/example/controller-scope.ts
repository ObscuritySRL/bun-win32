/**
 * Controller Scope
 *
 * A live oscilloscope-style visualizer for any DirectInput game controller —
 * the controllers XInput cannot see (racing wheels, flight sticks / HOTAS,
 * generic USB pads, retro adapters). It creates a real `IDirectInput8` object
 * through the single `DirectInput8Create` flat export, enumerates attached
 * game controllers over the COM vtable, binds the predefined joystick data
 * format returned by `GetdfDIJoystick`, acquires the device, and then polls
 * `IDirectInputDevice8::GetDeviceState` ~30x/sec — rendering every axis as a
 * centered ANSI meter, the POV hats as compass arrows, and all 32 buttons as
 * a live-lit grid, redrawn in place with cursor-home escapes.
 *
 * With no controller attached it still proves the pure-FFI pipeline
 * (DirectInput8Create + EnumDevices succeed) and exits cleanly.
 *
 * APIs demonstrated:
 *   - Dinput8.DirectInput8Create        (create the IDirectInput8 COM object)
 *   - Dinput8.GetdfDIJoystick           (predefined DIJOYSTATE data format)
 *   - IDirectInput8::EnumDevices        (walk attached game controllers, COM vtable)
 *   - IDirectInput8::CreateDevice       (open a device → IDirectInputDevice8)
 *   - IDirectInputDevice8::SetDataFormat / SetCooperativeLevel / SetProperty
 *   - IDirectInputDevice8::Acquire / Poll / GetDeviceState / Unacquire
 *   - IUnknown::Release                 (release every COM object)
 *
 * APIs demonstrated (kernel32, cross-package):
 *   - GetModuleHandleW                  (module handle for DirectInput8Create)
 *   - GetConsoleWindow                  (cooperative-level window)
 *   - GetStdHandle / GetConsoleMode / SetConsoleMode (enable ANSI VT)
 *   - GetCurrentProcess / ReadProcessMemory          (walk native vtables / structs)
 *
 * APIs demonstrated (user32, cross-package):
 *   - GetDesktopWindow                  (fallback cooperative-level window)
 *
 * Run: bun run example:controller-scope
 */

import { FFIType, JSCallback, linkSymbols } from 'bun:ffi';

import Dinput8, { DI8DEVCLASS, DIEDFL, DIPH, DIPROP_RANGE, DIRECTINPUT_VERSION, DISCL, IID_IDirectInput8W } from '..';
import Kernel32, { STD_HANDLE, ConsoleMode } from '@bun-win32/kernel32';
import User32 from '@bun-win32/user32';

const ANSI = {
  bold: '\x1b[1m',
  cyan: '\x1b[96m',
  dim: '\x1b[2m',
  green: '\x1b[92m',
  magenta: '\x1b[95m',
  red: '\x1b[91m',
  reset: '\x1b[0m',
  white: '\x1b[97m',
  yellow: '\x1b[93m',
} as const;

const DIDEVICEINSTANCEW_SIZE = 1100;
const DIJOYSTATE_SIZE = 80;
const POINTER_SIZE = 8;

// IDirectInput8W vtable byte offsets (index * 8 on x64).
const IDI8_RELEASE = 0x10;
const IDI8_CREATEDEVICE = 0x18;
const IDI8_ENUMDEVICES = 0x20;

// IDirectInputDevice8W vtable byte offsets.
const DEV_RELEASE = 0x10;
const DEV_SETPROPERTY = 0x30;
const DEV_ACQUIRE = 0x38;
const DEV_UNACQUIRE = 0x40;
const DEV_GETDEVICESTATE = 0x48;
const DEV_SETDATAFORMAT = 0x58;
const DEV_SETCOOPERATIVELEVEL = 0x68;
const DEV_POLL = 0xc8;

Dinput8.Preload(['DirectInput8Create', 'GetdfDIJoystick']);

const currentProcess = Kernel32.GetCurrentProcess();

function readPointerAt(address: bigint): bigint {
  const buffer = Buffer.alloc(POINTER_SIZE);
  const ok = Kernel32.ReadProcessMemory(currentProcess, address, buffer.ptr!, BigInt(POINTER_SIZE), null);
  if (ok === 0) throw new Error(`ReadProcessMemory failed at 0x${address.toString(16)}`);
  return buffer.readBigUInt64LE(0);
}

function readBytesAt(address: bigint, size: number): Buffer {
  const buffer = Buffer.alloc(size);
  const ok = Kernel32.ReadProcessMemory(currentProcess, address, buffer.ptr!, BigInt(size), null);
  if (ok === 0) throw new Error(`ReadProcessMemory failed at 0x${address.toString(16)}`);
  return buffer;
}

function guidBytes(value: string): Buffer {
  const match = /^([0-9a-f]{8})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{12})$/i.exec(value);
  if (match === null) throw new Error(`Invalid GUID: ${value}`);
  const [, d1, d2, d3, d4High, d4Low] = match;
  const buffer = Buffer.alloc(16);
  buffer.writeUInt32LE(parseInt(d1, 16), 0);
  buffer.writeUInt16LE(parseInt(d2, 16), 4);
  buffer.writeUInt16LE(parseInt(d3, 16), 6);
  const data4 = `${d4High}${d4Low}`;
  for (let i = 0; i < 8; i += 1) buffer[8 + i] = parseInt(data4.slice(i * 2, i * 2 + 2), 16);
  return buffer;
}

function decodeWide(buffer: Buffer, offset: number, maxChars: number): string {
  const end = offset + maxChars * 2;
  let termAt = end;
  for (let i = offset; i < end; i += 2) {
    if (buffer.readUInt16LE(i) === 0) {
      termAt = i;
      break;
    }
  }
  return buffer.subarray(offset, termAt).toString('utf16le');
}

// ── Create the IDirectInput8 object ────────────────────────────────────────

const hinst = Kernel32.GetModuleHandleW(null!);
const iid = guidBytes(IID_IDirectInput8W);
const ppDI = Buffer.alloc(POINTER_SIZE);

const createHr = Dinput8.DirectInput8Create(hinst, DIRECTINPUT_VERSION, iid.ptr!, ppDI.ptr!, null);
if (createHr !== 0) {
  console.error(`${ANSI.red}DirectInput8Create failed: 0x${(createHr >>> 0).toString(16).padStart(8, '0')}${ANSI.reset}`);
  process.exit(1);
}

const di8Address = ppDI.readBigUInt64LE(0);
const di8Vtable = readPointerAt(di8Address);

const di8 = linkSymbols({
  CreateDevice: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], ptr: readPointerAt(di8Vtable + BigInt(IDI8_CREATEDEVICE)), returns: FFIType.i32 },
  EnumDevices: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32], ptr: readPointerAt(di8Vtable + BigInt(IDI8_ENUMDEVICES)), returns: FFIType.i32 },
  Release: { args: [FFIType.u64], ptr: readPointerAt(di8Vtable + BigInt(IDI8_RELEASE)), returns: FFIType.u32 },
});

// ── Enumerate attached game controllers ────────────────────────────────────

interface Controller {
  guid: Buffer;
  instanceName: string;
  productName: string;
}

const controllers: Controller[] = [];

const enumCallback = new JSCallback(
  (lpddi: number | null): number => {
    if (lpddi === null) return 0;
    const ddi = readBytesAt(BigInt(lpddi), DIDEVICEINSTANCEW_SIZE);
    controllers.push({
      guid: Buffer.from(ddi.subarray(4, 20)),
      instanceName: decodeWide(ddi, 40, 260).trim(),
      productName: decodeWide(ddi, 560, 260).trim(),
    });
    return 1; // DIENUM_CONTINUE
  },
  { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
);

di8.symbols.EnumDevices(di8Address, DI8DEVCLASS.DI8DEVCLASS_GAMECTRL, enumCallback.ptr!, null, DIEDFL.DIEDFL_ATTACHEDONLY);
enumCallback.close();

console.log();
console.log(`${ANSI.bold}${ANSI.magenta}◼ Controller Scope${ANSI.reset}  ${ANSI.dim}— live DirectInput visualizer${ANSI.reset}`);

if (controllers.length === 0) {
  di8.symbols.Release(di8Address);
  di8.close();
  console.log();
  console.log(`  ${ANSI.yellow}No DirectInput game controller attached.${ANSI.reset}`);
  console.log(`  ${ANSI.dim}Plug in a gamepad / wheel / stick and re-run to see the live scope.${ANSI.reset}`);
  console.log(`  ${ANSI.dim}(DirectInput8Create + EnumDevices succeeded — the pure-FFI pipeline works.)${ANSI.reset}`);
  console.log();
  process.exit(0);
}

const target = controllers[0];
console.log(`  ${ANSI.dim}using${ANSI.reset} ${ANSI.white}${target.productName || target.instanceName}${ANSI.reset}  ${ANSI.dim}(${controllers.length} controller${controllers.length === 1 ? '' : 's'} found)${ANSI.reset}`);

// ── Open the device ────────────────────────────────────────────────────────

const ppDevice = Buffer.alloc(POINTER_SIZE);
const createDevHr = di8.symbols.CreateDevice(di8Address, target.guid.ptr!, ppDevice.ptr!, null);
if (createDevHr !== 0) {
  di8.symbols.Release(di8Address);
  di8.close();
  console.error(`${ANSI.red}CreateDevice failed: 0x${(createDevHr >>> 0).toString(16).padStart(8, '0')}${ANSI.reset}`);
  process.exit(1);
}

const devAddress = ppDevice.readBigUInt64LE(0);
const devVtable = readPointerAt(devAddress);

const dev = linkSymbols({
  Acquire: { args: [FFIType.u64], ptr: readPointerAt(devVtable + BigInt(DEV_ACQUIRE)), returns: FFIType.i32 },
  GetDeviceState: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], ptr: readPointerAt(devVtable + BigInt(DEV_GETDEVICESTATE)), returns: FFIType.i32 },
  Poll: { args: [FFIType.u64], ptr: readPointerAt(devVtable + BigInt(DEV_POLL)), returns: FFIType.i32 },
  Release: { args: [FFIType.u64], ptr: readPointerAt(devVtable + BigInt(DEV_RELEASE)), returns: FFIType.u32 },
  SetCooperativeLevel: { args: [FFIType.u64, FFIType.u64, FFIType.u32], ptr: readPointerAt(devVtable + BigInt(DEV_SETCOOPERATIVELEVEL)), returns: FFIType.i32 },
  SetDataFormat: { args: [FFIType.u64, FFIType.ptr], ptr: readPointerAt(devVtable + BigInt(DEV_SETDATAFORMAT)), returns: FFIType.i32 },
  SetProperty: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], ptr: readPointerAt(devVtable + BigInt(DEV_SETPROPERTY)), returns: FFIType.i32 },
  Unacquire: { args: [FFIType.u64], ptr: readPointerAt(devVtable + BigInt(DEV_UNACQUIRE)), returns: FFIType.i32 },
});

// Bind the predefined joystick data format from our flat export.
dev.symbols.SetDataFormat(devAddress, Dinput8.GetdfDIJoystick()!);

const coopWindow = Kernel32.GetConsoleWindow() || User32.GetDesktopWindow();
dev.symbols.SetCooperativeLevel(devAddress, coopWindow, DISCL.DISCL_BACKGROUND | DISCL.DISCL_NONEXCLUSIVE);

// Normalize every axis to [-1000, 1000] via a device-wide DIPROPRANGE.
const range = Buffer.alloc(24);
range.writeUInt32LE(24, 0); // diph.dwSize
range.writeUInt32LE(16, 4); // diph.dwHeaderSize
range.writeUInt32LE(0, 8); // diph.dwObj
range.writeUInt32LE(DIPH.DIPH_DEVICE, 12); // diph.dwHow
range.writeInt32LE(-1000, 16); // lMin
range.writeInt32LE(1000, 20); // lMax
const rangeHr = dev.symbols.SetProperty(devAddress, DIPROP_RANGE, range.ptr!);
const axisScale = rangeHr === 0 ? 1000 : 32768; // raw 0..65535 when range unsupported
const axisBias = rangeHr === 0 ? 0 : 32768;

dev.symbols.Acquire(devAddress);

// ── Render loop ────────────────────────────────────────────────────────────

const stdout = Kernel32.GetStdHandle(STD_HANDLE.OUTPUT);
const modeBuf = Buffer.alloc(4);
if (Kernel32.GetConsoleMode(stdout, modeBuf.ptr!) !== 0) {
  Kernel32.SetConsoleMode(stdout, modeBuf.readUInt32LE(0) | ConsoleMode.ENABLE_VIRTUAL_TERMINAL_PROCESSING);
}

const AXES = [
  ['X', 0],
  ['Y', 4],
  ['Z', 8],
  ['Rx', 12],
  ['Ry', 16],
  ['Rz', 20],
  ['S1', 24],
  ['S2', 28],
] as const;
const POV_ARROWS = ['↑', '↗', '→', '↘', '↓', '↙', '←', '↖'];
const BAR_HALF = 24;

function axisMeter(value: number): string {
  const norm = Math.max(-1, Math.min(1, (value - axisBias) / axisScale));
  const filled = Math.round(Math.abs(norm) * BAR_HALF);
  const left = norm < 0 ? `${ANSI.cyan}${'█'.repeat(filled)}${ANSI.reset}${' '.repeat(BAR_HALF - filled)}` : ' '.repeat(BAR_HALF);
  const right = norm > 0 ? `${ANSI.green}${'█'.repeat(filled)}${ANSI.reset}${ANSI.dim}${'░'.repeat(BAR_HALF - filled)}${ANSI.reset}` : `${ANSI.dim}${'░'.repeat(BAR_HALF)}${ANSI.reset}`;
  return `${left}${ANSI.dim}│${ANSI.reset}${right}`;
}

const state = Buffer.alloc(DIJOYSTATE_SIZE);
const FRAMES = 200;
const lostHr = 0x80070015 >>> 0; // DIERR_NOTACQUIRED / INPUTLOST family

process.stdout.write('\x1b[?25l\x1b[2J');

for (let frame = 0; frame < FRAMES; frame += 1) {
  dev.symbols.Poll(devAddress);
  const stHr = dev.symbols.GetDeviceState(devAddress, DIJOYSTATE_SIZE, state.ptr!);
  if (stHr >>> 0 === lostHr || stHr !== 0) dev.symbols.Acquire(devAddress);

  const lines: string[] = [];
  lines.push(`${ANSI.bold}${ANSI.magenta}◼ Controller Scope${ANSI.reset}  ${ANSI.white}${(target.productName || target.instanceName).slice(0, 48)}${ANSI.reset}`);
  lines.push(`${ANSI.dim}  frame ${String(frame + 1).padStart(3)}/${FRAMES} · axes normalized ${rangeHr === 0 ? '[-1000,1000]' : '[raw]'}${ANSI.reset}`);
  lines.push('');

  for (const [label, offset] of AXES) {
    const v = state.readInt32LE(offset);
    lines.push(`  ${ANSI.yellow}${label.padEnd(3)}${ANSI.reset} ${axisMeter(v)} ${ANSI.dim}${String(v).padStart(7)}${ANSI.reset}`);
  }

  lines.push('');
  const povCells: string[] = [];
  for (let p = 0; p < 4; p += 1) {
    const pov = state.readUInt32LE(32 + p * 4);
    if ((pov & 0xffff) === 0xffff) {
      povCells.push(`${ANSI.dim}·${ANSI.reset}`);
    } else {
      povCells.push(`${ANSI.cyan}${POV_ARROWS[Math.round(pov / 4500) % 8]}${ANSI.reset}`);
    }
  }
  lines.push(`  ${ANSI.yellow}POV${ANSI.reset} ${povCells.join(' ')}`);

  lines.push('');
  lines.push(`  ${ANSI.yellow}BTN${ANSI.reset}`);
  let row = '   ';
  for (let b = 0; b < 32; b += 1) {
    const down = (state.readUInt8(48 + b) & 0x80) !== 0;
    row += down ? `${ANSI.bold}${ANSI.green}●${ANSI.reset}` : `${ANSI.dim}○${ANSI.reset}`;
    row += ' ';
    if ((b + 1) % 16 === 0) {
      lines.push(row);
      row = '   ';
    }
  }
  lines.push('');
  lines.push(`${ANSI.dim}  Move sticks / press buttons — live. Ctrl+C to stop.${ANSI.reset}`);

  process.stdout.write(`\x1b[H${lines.join('\x1b[K\n')}\x1b[K`);
  await Bun.sleep(33);
}

// ── Teardown ───────────────────────────────────────────────────────────────

dev.symbols.Unacquire(devAddress);
dev.symbols.Release(devAddress);
dev.close();
di8.symbols.Release(di8Address);
di8.close();

process.stdout.write('\x1b[?25h\n');
console.log(`${ANSI.dim}  scope closed — device released.${ANSI.reset}\n`);
process.exit(0);
