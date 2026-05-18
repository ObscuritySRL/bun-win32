/**
 * DirectInput Device Census
 *
 * A thorough diagnostic of every attached DirectInput device — the full
 * input topology XInput cannot describe. It creates a real `IDirectInput8`
 * object via the single `DirectInput8Create` flat export, walks
 * `IDirectInput8::EnumDevices` over the COM vtable for every device class,
 * and for each device opens it with `CreateDevice`, reads its `DIDEVCAPS`
 * through `GetCapabilities`, and enumerates every hardware object
 * (axes / buttons / POV hats) with `EnumObjects` — emitting an aligned,
 * fully-labelled report: instance / product GUIDs, decoded device type,
 * HID flag, capability counts, force-feedback timing, and a per-object
 * inventory with each object's authored name and type.
 *
 * APIs demonstrated:
 *   - Dinput8.DirectInput8Create        (create the IDirectInput8 COM object)
 *   - IDirectInput8::EnumDevices        (enumerate all device classes, COM vtable)
 *   - IDirectInput8::CreateDevice       (open a device → IDirectInputDevice8)
 *   - IDirectInputDevice8::GetCapabilities (read DIDEVCAPS)
 *   - IDirectInputDevice8::EnumObjects  (axis / button / POV inventory)
 *   - IUnknown::Release                 (release every COM object)
 *
 * APIs demonstrated (kernel32, cross-package):
 *   - GetModuleHandleW                  (module handle for DirectInput8Create)
 *   - GetCurrentProcess / ReadProcessMemory (walk native vtables / structs)
 *
 * Run: bun run example:device-census
 */

import { FFIType, JSCallback, linkSymbols } from 'bun:ffi';

import Dinput8, { DI8DEVCLASS, DIDEVTYPE_HID, DIEDFL, DIRECTINPUT_VERSION, IID_IDirectInput8W } from '..';
import Kernel32 from '@bun-win32/kernel32';

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

const DIDEVCAPS_SIZE = 44;
const DIDEVICEINSTANCEW_SIZE = 1100;
const DIDEVICEOBJECTINSTANCEW_SIZE = 576;
const POINTER_SIZE = 8;

const IDI8_RELEASE = 0x10;
const IDI8_CREATEDEVICE = 0x18;
const IDI8_ENUMDEVICES = 0x20;

const DEV_RELEASE = 0x10;
const DEV_GETCAPABILITIES = 0x18;
const DEV_ENUMOBJECTS = 0x20;

const DEVICE_TYPE_NAMES: Record<number, string> = {
  0x11: 'Device',
  0x12: 'Mouse',
  0x13: 'Keyboard',
  0x14: 'Joystick',
  0x15: 'Gamepad',
  0x16: 'Driving / Wheel',
  0x17: 'Flight Stick',
  0x18: 'First-Person',
  0x19: 'Device Control',
  0x1a: 'Screen Pointer',
  0x1b: 'Remote',
  0x1c: 'Supplemental',
};

Dinput8.Preload(['DirectInput8Create']);

const currentProcess = Kernel32.GetCurrentProcess();

function readPointerAt(address: bigint): bigint {
  const buffer = Buffer.alloc(POINTER_SIZE);
  const ok = Kernel32.ReadProcessMemory(currentProcess, address, buffer.ptr!, BigInt(POINTER_SIZE), 0n);
  if (ok === 0) throw new Error(`ReadProcessMemory failed at 0x${address.toString(16)}`);
  return buffer.readBigUInt64LE(0);
}

function readBytesAt(address: bigint, size: number): Buffer {
  const buffer = Buffer.alloc(size);
  const ok = Kernel32.ReadProcessMemory(currentProcess, address, buffer.ptr!, BigInt(size), 0n);
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

function guidString(buffer: Buffer, offset: number): string {
  const d1 = buffer.readUInt32LE(offset).toString(16).padStart(8, '0');
  const d2 = buffer
    .readUInt16LE(offset + 4)
    .toString(16)
    .padStart(4, '0');
  const d3 = buffer
    .readUInt16LE(offset + 6)
    .toString(16)
    .padStart(4, '0');
  const d4 = buffer.subarray(offset + 8, offset + 16);
  const d4a = d4.subarray(0, 2).toString('hex');
  const d4b = d4.subarray(2, 8).toString('hex');
  return `${d1}-${d2}-${d3}-${d4a}-${d4b}`;
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

// ── Enumerate every attached device ────────────────────────────────────────

interface DeviceObject {
  kind: 'axis' | 'button' | 'pov' | 'other';
  name: string;
}

interface Device {
  axes: number;
  buttons: number;
  ffSamplePeriod: number;
  firmwareRevision: number;
  flags: number;
  guid: Buffer;
  guidInstance: string;
  guidProduct: string;
  hardwareRevision: number;
  hid: boolean;
  instanceName: string;
  objects: DeviceObject[];
  povs: number;
  productName: string;
  type: number;
}

const devices: Device[] = [];

const enumCallback = new JSCallback(
  (lpddi: number | null): number => {
    if (lpddi === null) return 0;
    const ddi = readBytesAt(BigInt(lpddi), DIDEVICEINSTANCEW_SIZE);
    const dwDevType = ddi.readUInt32LE(36);
    devices.push({
      axes: 0,
      buttons: 0,
      ffSamplePeriod: 0,
      firmwareRevision: 0,
      flags: 0,
      guid: Buffer.from(ddi.subarray(4, 20)),
      guidInstance: guidString(ddi, 4),
      guidProduct: guidString(ddi, 20),
      hardwareRevision: 0,
      hid: (dwDevType & DIDEVTYPE_HID) !== 0,
      instanceName: decodeWide(ddi, 40, 260).trim(),
      objects: [],
      povs: 0,
      productName: decodeWide(ddi, 560, 260).trim(),
      type: dwDevType & 0xff,
    });
    return 1; // DIENUM_CONTINUE
  },
  { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
);

di8.symbols.EnumDevices(di8Address, DI8DEVCLASS.DI8DEVCLASS_ALL, enumCallback.ptr!, null, DIEDFL.DIEDFL_ATTACHEDONLY);
enumCallback.close();

// ── Open each device for caps + object inventory ───────────────────────────

let inventoryTarget: Device | null = null;

const objectCallback = new JSCallback(
  (lpddoi: number | null): number => {
    if (lpddoi === null || inventoryTarget === null) return 0;
    const obj = readBytesAt(BigInt(lpddoi), DIDEVICEOBJECTINSTANCEW_SIZE);
    const dwType = obj.readUInt32LE(24);
    const low = dwType & 0xff;
    const kind = (low & 0x03) !== 0 ? 'axis' : (low & 0x0c) !== 0 ? 'button' : (low & 0x10) !== 0 ? 'pov' : 'other';
    inventoryTarget.objects.push({ kind, name: decodeWide(obj, 32, 260).trim() });
    return 1; // DIENUM_CONTINUE
  },
  { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
);

for (const device of devices) {
  const ppDevice = Buffer.alloc(POINTER_SIZE);
  if (di8.symbols.CreateDevice(di8Address, device.guid.ptr!, ppDevice.ptr!, null) !== 0) continue;

  const devAddress = ppDevice.readBigUInt64LE(0);
  const devVtable = readPointerAt(devAddress);
  const dev = linkSymbols({
    EnumObjects: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], ptr: readPointerAt(devVtable + BigInt(DEV_ENUMOBJECTS)), returns: FFIType.i32 },
    GetCapabilities: { args: [FFIType.u64, FFIType.ptr], ptr: readPointerAt(devVtable + BigInt(DEV_GETCAPABILITIES)), returns: FFIType.i32 },
    Release: { args: [FFIType.u64], ptr: readPointerAt(devVtable + BigInt(DEV_RELEASE)), returns: FFIType.u32 },
  });

  const caps = Buffer.alloc(DIDEVCAPS_SIZE);
  caps.writeUInt32LE(DIDEVCAPS_SIZE, 0); // dwSize
  if (dev.symbols.GetCapabilities(devAddress, caps.ptr!) === 0) {
    device.flags = caps.readUInt32LE(4);
    device.axes = caps.readUInt32LE(12);
    device.buttons = caps.readUInt32LE(16);
    device.povs = caps.readUInt32LE(20);
    device.ffSamplePeriod = caps.readUInt32LE(24);
    device.firmwareRevision = caps.readUInt32LE(32);
    device.hardwareRevision = caps.readUInt32LE(36);
  }

  inventoryTarget = device;
  dev.symbols.EnumObjects(devAddress, objectCallback.ptr!, null, 0); // DIDFT_ALL
  inventoryTarget = null;

  dev.symbols.Release(devAddress);
  dev.close();
}

objectCallback.close();
di8.symbols.Release(di8Address);
di8.close();

// ── Render report ──────────────────────────────────────────────────────────

const gameControllers = devices.filter((d) => d.type === 0x14 || d.type === 0x15 || d.type === 0x16 || d.type === 0x17);

console.log();
console.log(`${ANSI.bold}${ANSI.magenta}◼ DirectInput Device Census${ANSI.reset}  ${ANSI.dim}— full input topology over pure FFI${ANSI.reset}`);
console.log(`${ANSI.dim}  ${devices.length} attached device${devices.length === 1 ? '' : 's'} · ${gameControllers.length} game controller${gameControllers.length === 1 ? '' : 's'}${ANSI.reset}`);
console.log();

for (let i = 0; i < devices.length; i += 1) {
  const d = devices[i];
  const typeName = DEVICE_TYPE_NAMES[d.type] ?? `0x${d.type.toString(16)}`;
  const isGameCtrl = gameControllers.includes(d);
  const tag = isGameCtrl ? `${ANSI.green}${typeName}${ANSI.reset}` : `${ANSI.cyan}${typeName}${ANSI.reset}`;

  console.log(`  ${ANSI.bold}${ANSI.white}[${i}] ${(d.productName || d.instanceName || '(unnamed)').slice(0, 52)}${ANSI.reset}  ${tag}${d.hid ? ` ${ANSI.dim}HID${ANSI.reset}` : ''}`);
  console.log(`      ${ANSI.dim}instance${ANSI.reset} ${ANSI.magenta}${d.guidInstance}${ANSI.reset}`);
  console.log(`      ${ANSI.dim}product ${ANSI.reset} ${ANSI.magenta}${d.guidProduct}${ANSI.reset}`);

  if (d.axes || d.buttons || d.povs) {
    console.log(
      `      ${ANSI.yellow}${String(d.axes).padStart(2)}${ANSI.reset} ${ANSI.dim}axes${ANSI.reset}   ${ANSI.yellow}${String(d.buttons).padStart(3)}${ANSI.reset} ${ANSI.dim}buttons${ANSI.reset}   ${ANSI.yellow}${String(d.povs).padStart(2)}${ANSI.reset} ${ANSI.dim}POV${ANSI.reset}` +
        `   ${ANSI.dim}fw${ANSI.reset} ${d.firmwareRevision}  ${ANSI.dim}hw${ANSI.reset} ${d.hardwareRevision}` +
        (d.ffSamplePeriod ? `  ${ANSI.dim}ff-period${ANSI.reset} ${d.ffSamplePeriod}µs` : ''),
    );
  }

  if (d.objects.length > 0) {
    const axes = d.objects.filter((o) => o.kind === 'axis').map((o) => o.name);
    const povs = d.objects.filter((o) => o.kind === 'pov').map((o) => o.name);
    const buttons = d.objects.filter((o) => o.kind === 'button');
    if (axes.length > 0) console.log(`      ${ANSI.dim}axes:${ANSI.reset} ${axes.slice(0, 10).join(`${ANSI.dim},${ANSI.reset} `)}`);
    if (povs.length > 0) console.log(`      ${ANSI.dim}povs:${ANSI.reset} ${povs.join(`${ANSI.dim},${ANSI.reset} `)}`);
    if (buttons.length > 0) console.log(`      ${ANSI.dim}buttons:${ANSI.reset} ${buttons.length} ${ANSI.dim}(${buttons[0].name}…)${ANSI.reset}`);
  }
  console.log();
}

const totalAxes = devices.reduce((s, d) => s + d.axes, 0);
const totalButtons = devices.reduce((s, d) => s + d.buttons, 0);
const totalPovs = devices.reduce((s, d) => s + d.povs, 0);

console.log(`${ANSI.dim}  ─ totals ─${ANSI.reset}`);
console.log(
  `  ${ANSI.dim}devices${ANSI.reset} ${ANSI.yellow}${devices.length}${ANSI.reset}   ${ANSI.dim}axes${ANSI.reset} ${ANSI.yellow}${totalAxes}${ANSI.reset}   ${ANSI.dim}buttons${ANSI.reset} ${ANSI.yellow}${totalButtons}${ANSI.reset}   ${ANSI.dim}POV hats${ANSI.reset} ${ANSI.yellow}${totalPovs}${ANSI.reset}`,
);
console.log();

process.exit(0);
