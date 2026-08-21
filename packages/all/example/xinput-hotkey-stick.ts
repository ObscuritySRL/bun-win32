/**
 * xinput-hotkey-stick — hold a hotkey, a virtual Xbox 360 controller pushes its right stick 50% backward.
 *
 * XInput itself cannot inject input — XInputGetState/XInputSetState only read a pad
 * and set its rumble motors. Windows has no user-mode API for synthesizing gamepad
 * input at all (SendInput covers keyboard/mouse only). The one way to make a pad that
 * games genuinely see as an Xbox controller is a bus driver that enumerates a virtual
 * XUSB device: ViGEmBus. This demo skips the usual ViGEmClient.dll wrapper and speaks
 * to the driver directly over DeviceIoControl, so the entire virtual controller —
 * plug, report, unplug — is pure Bun FFI.
 *
 * It plugs a virtual Xbox 360 pad (VID 045E / PID 028E) into the ViGEm bus, then polls
 * the hotkey. While the key is held, it submits an XUSB report with sThumbRY at -50%
 * (backward / toward you); on release it submits a neutral report. Reports are sent only
 * when the state changes — the bus holds the last one. The real @bun-win32/xinput1_4
 * bindings read the pad back so you can see the injected axis land on a live XInput slot.
 *
 * Requires ViGEmBus (https://github.com/nefarius/ViGEmBus). Run as a normal user.
 *
 * APIs demonstrated:
 * - kernel32 (CreateFileW to open the ViGEm bus device, DeviceIoControl to issue
 *   IOCTL_VIGEM_CHECK_VERSION / PLUGIN_TARGET / WAIT_DEVICE_READY / XUSB_GET_USER_INDEX /
 *   XUSB_SUBMIT_REPORT / UNPLUG_TARGET, CloseHandle to release the bus)
 * - setupapi (SetupDiGetClassDevsW + SetupDiEnumDeviceInterfaces +
 *   SetupDiGetDeviceInterfaceDetailW + SetupDiDestroyDeviceInfoList to resolve the
 *   ViGEmBus device interface path from its class GUID)
 * - user32 (GetAsyncKeyState to detect the held hotkey without a window or message pump)
 * - xinput1_4 (XInputGetState to read the injected stick back off a live XInput slot)
 *
 * Env: HOTKEY_VK (virtual-key code to hold, default 0x77 = F8), INJECT (right-stick,
 * left-stick, or button-a), STICK_PERCENT (backward deflection, default 50),
 * DEMO_DURATION_MS (self-exit for headless runs).
 *
 * Run: bun run example/xinput-hotkey-stick.ts
 */
import { Kernel32, Setupapi, User32, Xinput1_4 } from '../index';

Kernel32.Preload(['CloseHandle', 'CreateFileW', 'DeviceIoControl']);
Setupapi.Preload(['SetupDiDestroyDeviceInfoList', 'SetupDiEnumDeviceInterfaces', 'SetupDiGetClassDevsW', 'SetupDiGetDeviceInterfaceDetailW']);
User32.Preload(['GetAsyncKeyState']);
Xinput1_4.Preload(['XInputGetState']);

const DIGCF_PRESENT = 0x0000_0002;
const DIGCF_DEVICEINTERFACE = 0x0000_0010;
const FILE_SHARE_READ = 0x0000_0001;
const FILE_SHARE_WRITE = 0x0000_0002;
const GENERIC_READ_WRITE = 0xc000_0000; // GENERIC_READ | GENERIC_WRITE — ORed in JS this would go negative (int32), and the bus would open with no access, so the IOCTLs would be denied.
const OPEN_EXISTING = 3;
const INVALID_HANDLE_VALUE = 0xffff_ffff_ffff_ffffn;

// ViGEmBus device interface class {96E42B22-F5E9-42F8-B043-ED0F932F014F}.
const VIGEM_INTERFACE_GUID = '{96E42B22-F5E9-42F8-B043-ED0F932F014F}';
// ViGEmBus BusShared.h: CTL_CODE(FILE_DEVICE_BUSENUM = 0x2a, function, METHOD_BUFFERED, access)
// = (0x2a << 16) | (access << 14) | (function << 2), with access FILE_WRITE_DATA (2), or
// FILE_READ_DATA | FILE_WRITE_DATA (3) for the calls that read a value back. Function codes are
// IOCTL_VIGEM_BASE (0x801) + an index — note the XUSB reports start at index 0x200, not 0x004.
const IOCTL_VIGEM_PLUGIN_TARGET = 0x002a_a004; // function 0x801
const IOCTL_VIGEM_UNPLUG_TARGET = 0x002a_a008; // function 0x802
const IOCTL_VIGEM_CHECK_VERSION = 0x002a_a00c; // function 0x803
const IOCTL_VIGEM_WAIT_DEVICE_READY = 0x002a_a010; // function 0x804
const IOCTL_XUSB_SUBMIT_REPORT = 0x002a_a808; // function 0xa02
const IOCTL_XUSB_GET_USER_INDEX = 0x002a_e81c; // function 0xa07

const VIGEM_COMMON_VERSION = 0x0001;
const VIGEM_TARGET_XBOX360_WIRED = 0;
const XBOX360_VENDOR_ID = 0x045e;
const XBOX360_PRODUCT_ID = 0x028e;
const VIGEM_TARGETS_MAX = 16;

const HOTKEY_VK = Number(Bun.env.HOTKEY_VK ?? 0x77);
const INJECT = Bun.env.INJECT ?? 'right-stick'; // right-stick (the camera axis) | left-stick | button-a
const STICK_PERCENT = Math.max(0, Math.min(100, Number(Bun.env.STICK_PERCENT ?? 50)));
// XInput thumb axes are SHORT: +32767 forward, -32768 backward. 50% backward = -16384.
const STICK_BACKWARD = -Math.round((32_768 * STICK_PERCENT) / 100);

const readWideString = (buffer: Buffer, offset: number, maxBytes: number): string => buffer.toString('utf16le', offset, offset + maxBytes).replace(/\0.*$/, '');

const guidBuffer = (guid: string): Buffer => {
  const hex = guid.replace(/[{}-]/g, '');
  const bytes = Buffer.alloc(16);
  bytes.writeUInt32LE(Number.parseInt(hex.slice(0, 8), 16), 0);
  bytes.writeUInt16LE(Number.parseInt(hex.slice(8, 12), 16), 4);
  bytes.writeUInt16LE(Number.parseInt(hex.slice(12, 16), 16), 6);
  for (let index = 0; index < 8; index++) bytes.writeUInt8(Number.parseInt(hex.slice(16 + index * 2, 18 + index * 2), 16), 8 + index);
  return bytes;
};

const findViGEmBusPath = (): string | null => {
  const interfaceGuid = guidBuffer(VIGEM_INTERFACE_GUID);
  const deviceInfoSet = Setupapi.SetupDiGetClassDevsW(interfaceGuid.ptr!, null, 0n, DIGCF_PRESENT | DIGCF_DEVICEINTERFACE);
  if (deviceInfoSet === INVALID_HANDLE_VALUE) return null;

  let devicePath: string | null = null;
  try {
    for (let index = 0; ; index++) {
      const interfaceData = Buffer.alloc(32);
      interfaceData.writeUInt32LE(32, 0);
      if (Setupapi.SetupDiEnumDeviceInterfaces(deviceInfoSet, null, interfaceGuid.ptr!, index, interfaceData.ptr!) === 0) break;

      const requiredSize = Buffer.alloc(4);
      Setupapi.SetupDiGetDeviceInterfaceDetailW(deviceInfoSet, interfaceData.ptr!, null, 0, requiredSize.ptr!, null);
      const detailSize = requiredSize.readUInt32LE(0);
      if (detailSize === 0) continue;

      const detailData = Buffer.alloc(detailSize);
      detailData.writeUInt32LE(8, 0); // SP_DEVICE_INTERFACE_DETAIL_DATA_W.cbSize on x64
      if (Setupapi.SetupDiGetDeviceInterfaceDetailW(deviceInfoSet, interfaceData.ptr!, detailData.ptr!, detailSize, null, null) === 0) continue;
      devicePath = readWideString(detailData, 4, detailSize - 4);
      if (devicePath) break;
    }
  } finally {
    Setupapi.SetupDiDestroyDeviceInfoList(deviceInfoSet);
  }
  return devicePath;
};

const busPath = findViGEmBusPath();
if (!busPath) throw new Error('ViGEmBus device interface not found — install ViGEmBus (https://github.com/nefarius/ViGEmBus) and reboot.');

const busPathBuffer = Buffer.from(`${busPath}\0`, 'utf16le');
const bus = Kernel32.CreateFileW(busPathBuffer.ptr!, GENERIC_READ_WRITE, FILE_SHARE_READ | FILE_SHARE_WRITE, null, OPEN_EXISTING, 0, 0n);
if (bus === INVALID_HANDLE_VALUE) throw new Error('CreateFileW on the ViGEmBus device failed — the driver is present but not accepting connections.');

const bytesReturned = Buffer.alloc(4);

// VIGEM_CHECK_VERSION { ULONG Size; ULONG Version; }
const versionRequest = Buffer.alloc(8);
versionRequest.writeUInt32LE(8, 0);
versionRequest.writeUInt32LE(VIGEM_COMMON_VERSION, 4);
if (Kernel32.DeviceIoControl(bus, IOCTL_VIGEM_CHECK_VERSION, versionRequest.ptr!, 8, null, 0, bytesReturned.ptr!, null) === 0) {
  Kernel32.CloseHandle(bus);
  throw new Error('IOCTL_VIGEM_CHECK_VERSION failed — this ViGEmBus build speaks a different protocol version.');
}

// VIGEM_PLUGIN_TARGET { ULONG Size; ULONG SerialNo; VIGEM_TARGET_TYPE Type; USHORT VendorId; USHORT ProductId; }
// The bus assigns serials; walk 1..VIGEM_TARGETS_MAX until one is free, exactly as ViGEmClient does.
const plugRequest = Buffer.alloc(16);
let serialNumber = 0;
for (let candidate = 1; candidate <= VIGEM_TARGETS_MAX; candidate++) {
  plugRequest.writeUInt32LE(16, 0);
  plugRequest.writeUInt32LE(candidate, 4);
  plugRequest.writeUInt32LE(VIGEM_TARGET_XBOX360_WIRED, 8);
  plugRequest.writeUInt16LE(XBOX360_VENDOR_ID, 12);
  plugRequest.writeUInt16LE(XBOX360_PRODUCT_ID, 14);
  if (Kernel32.DeviceIoControl(bus, IOCTL_VIGEM_PLUGIN_TARGET, plugRequest.ptr!, 16, null, 0, bytesReturned.ptr!, null) !== 0) {
    serialNumber = candidate;
    break;
  }
}
if (serialNumber === 0) {
  Kernel32.CloseHandle(bus);
  throw new Error('IOCTL_VIGEM_PLUGIN_TARGET failed for every serial — no free slot on the ViGEm bus.');
}

// XUSB_SUBMIT_REPORT { ULONG Size; ULONG SerialNo; XUSB_REPORT { USHORT wButtons; BYTE bLeftTrigger;
// BYTE bRightTrigger; SHORT sThumbLX; SHORT sThumbLY; SHORT sThumbRX; SHORT sThumbRY; } } — 20 bytes.
const reportRequest = Buffer.alloc(20);
reportRequest.writeUInt32LE(20, 0);
reportRequest.writeUInt32LE(serialNumber, 4);
// INJECT selects what the held hotkey sends. The camera axis (right-stick-back) is silent if the game
// ignores that axis, which is indistinguishable from the game ignoring the pad entirely — so the other
// modes send something unmistakable (the car drives, or the A button fires) to tell those two apart.
const submitReport = (amount: number): boolean => {
  reportRequest.fill(0, 8);
  switch (INJECT) {
    case 'left-stick':
      reportRequest.writeInt16LE(amount, 14); // sThumbLY — throttle/steer: the car visibly moves
      break;
    case 'button-a':
      reportRequest.writeUInt16LE(amount === 0 ? 0 : 0x1000, 8); // wButtons XINPUT_GAMEPAD_A — jump
      break;
    default:
      reportRequest.writeInt16LE(amount, 18); // sThumbRY — the camera axis
      break;
  }
  return Kernel32.DeviceIoControl(bus, IOCTL_XUSB_SUBMIT_REPORT, reportRequest.ptr!, 20, null, 0, bytesReturned.ptr!, null) !== 0;
};

const unplug = (): void => {
  const unplugRequest = Buffer.alloc(8);
  unplugRequest.writeUInt32LE(8, 0);
  unplugRequest.writeUInt32LE(serialNumber, 4);
  void Kernel32.DeviceIoControl(bus, IOCTL_VIGEM_UNPLUG_TARGET, unplugRequest.ptr!, 8, null, 0, bytesReturned.ptr!, null);
  Kernel32.CloseHandle(bus);
};
process.on('SIGINT', () => {
  unplug();
  process.exit(0);
});

// The pad enumerates asynchronously — block until the bus says it is ready, then ask the bus which
// XInput slot it landed on. Scanning XInputGetState for the first connected pad would be a guess:
// it would just as happily find a physical controller that was already plugged in.
const readyRequest = Buffer.alloc(8);
readyRequest.writeUInt32LE(8, 0);
readyRequest.writeUInt32LE(serialNumber, 4);
if (Kernel32.DeviceIoControl(bus, IOCTL_VIGEM_WAIT_DEVICE_READY, readyRequest.ptr!, 8, null, 0, bytesReturned.ptr!, null) === 0) {
  unplug();
  throw new Error('IOCTL_VIGEM_WAIT_DEVICE_READY failed — the virtual pad never finished enumerating.');
}

const state = Buffer.alloc(16); // XINPUT_STATE { DWORD dwPacketNumber; XINPUT_GAMEPAD Gamepad; }
if (!submitReport(0)) {
  unplug();
  throw new Error('IOCTL_XUSB_SUBMIT_REPORT failed — the virtual pad is plugged but rejects reports.');
}

// XUSB_GET_USER_INDEX { ULONG Size; ULONG SerialNo; ULONG UserIndex; } — UserIndex is written back.
// The bus only knows the index once an XInput client has polled the pad, so it can legitimately
// fail here; when it does, identify the slot instead by pushing a distinctive probe report and
// finding the slot that echoes it. Scanning for the first *connected* pad would be a guess — it
// would just as happily find a physical controller that was already plugged in.
const slotFromBus = (): number => {
  const userIndexRequest = Buffer.alloc(12);
  userIndexRequest.writeUInt32LE(12, 0);
  userIndexRequest.writeUInt32LE(serialNumber, 4);
  if (Kernel32.DeviceIoControl(bus, IOCTL_XUSB_GET_USER_INDEX, userIndexRequest.ptr!, 12, userIndexRequest.ptr!, 12, bytesReturned.ptr!, null) === 0) return -1;
  return userIndexRequest.readUInt32LE(8);
};

const PROBE_THUMB_RY = 31_337; // A value no physical stick would rest at, so the echo is unambiguous.
const slotFromProbe = async (): Promise<number> => {
  // The probe reads sThumbRY back, so it always writes sThumbRY — independent of what INJECT sends.
  reportRequest.fill(0, 8);
  reportRequest.writeInt16LE(PROBE_THUMB_RY, 18);
  if (Kernel32.DeviceIoControl(bus, IOCTL_XUSB_SUBMIT_REPORT, reportRequest.ptr!, 20, null, 0, bytesReturned.ptr!, null) === 0) return -1;
  for (let attempt = 0; attempt < 40; attempt++) {
    for (let userIndex = 0; userIndex < 4; userIndex++) {
      if (Xinput1_4.XInputGetState(userIndex, state.ptr!) !== 0) continue;
      if (state.readInt16LE(14) === PROBE_THUMB_RY) return userIndex;
    }
    await Bun.sleep(50);
  }
  return -1;
};

const busSlot = slotFromBus();
const slot = busSlot >= 0 ? busSlot : await slotFromProbe();
if (slot < 0) {
  unplug();
  throw new Error('The virtual pad plugged in and accepts reports, but no XInput slot echoed them back.');
}
submitReport(0);

console.log(`Virtual Xbox 360 pad plugged on ViGEm serial ${serialNumber}, live on XInput slot ${slot}.`);
console.log(`Hold VK 0x${HOTKEY_VK.toString(16)} to inject ${INJECT} (${STICK_PERCENT}% backward, value ${STICK_BACKWARD}). Ctrl+C to unplug.`);

const startedAt = Date.now();
const demoDurationMs = Number(Bun.env.DEMO_DURATION_MS ?? 0);
let held = false;
try {
  while (demoDurationMs === 0 || Date.now() - startedAt < demoDurationMs) {
    const down = (User32.GetAsyncKeyState(HOTKEY_VK) & 0x8000) !== 0;
    if (down !== held) {
      held = down;
      if (!submitReport(held ? STICK_BACKWARD : 0)) console.error('IOCTL_XUSB_SUBMIT_REPORT failed — the bus dropped the virtual pad.');
      // Read the whole gamepad straight back off XInput to prove the pad is real to any game.
      Xinput1_4.XInputGetState(slot, state.ptr!);
      console.log(`${held ? 'HELD ' : 'idle '} wButtons=0x${state.readUInt16LE(4).toString(16).padStart(4, '0')} sThumbLY=${state.readInt16LE(10)} sThumbRY=${state.readInt16LE(14)}`);
    }
    await Bun.sleep(4);
  }
} finally {
  unplug();
}
