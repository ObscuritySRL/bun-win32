/**
 * USB Device Detective - find and identify all HID devices on the system.
 *
 * Uses Hid.HidD_GetHidGuid to obtain the HID device interface GUID, then
 * enumerates device interfaces via setupapi.dll (loaded dynamically with
 * bun:ffi dlopen). For each interface, opens the device with Kernel32's
 * CreateFileW and queries product name, manufacturer, and VID/PID attributes.
 *
 * APIs demonstrated:
 *   - HidD_GetHidGuid (hid.dll)
 *   - SetupDiGetClassDevsW, SetupDiEnumDeviceInterfaces,
 *     SetupDiGetDeviceInterfaceDetailW, SetupDiDestroyDeviceInfoList (setupapi.dll)
 *   - CreateFileW, CloseHandle (kernel32.dll via @bun-win32/kernel32)
 *   - HidD_GetManufacturerString, HidD_GetProductString, HidD_GetAttributes
 *
 * Struct layouts:
 *   SP_DEVICE_INTERFACE_DATA (32 bytes on x64):
 *     +0x00  cbSize (DWORD) = 32
 *     +0x04  InterfaceClassGuid (16 bytes)
 *     +0x14  Flags (DWORD)
 *     +0x18  Reserved (ULONG_PTR, 8 bytes)
 *
 *   SP_DEVICE_INTERFACE_DETAIL_DATA_W (variable):
 *     +0x00  cbSize (DWORD) = 8 on x64 (fixed)
 *     +0x04  DevicePath (WCHAR[])
 *
 *   HIDD_ATTRIBUTES (12 bytes):
 *     +0x00  Size (ULONG) = 12
 *     +0x04  VendorID (USHORT)
 *     +0x06  ProductID (USHORT)
 *     +0x08  VersionNumber (USHORT)
 *
 * Run: bun run example/device-detective.ts
 */

import { dlopen, FFIType, read, toArrayBuffer } from 'bun:ffi';
import Hid from '../index';
import Kernel32 from '@bun-win32/kernel32';

const DIGCF_PRESENT = 0x00000002;
const DIGCF_DEVICEINTERFACE = 0x00000010;
const FILE_SHARE_READ = 0x00000001;
const FILE_SHARE_WRITE = 0x00000002;
const OPEN_EXISTING = 3;
const INVALID_HANDLE_VALUE = 0xffffffff_ffffffffn;

const setupapi = dlopen('setupapi.dll', {
  SetupDiGetClassDevsW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
  SetupDiEnumDeviceInterfaces: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
  SetupDiGetDeviceInterfaceDetailW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
  SetupDiDestroyDeviceInfoList: { args: [FFIType.u64], returns: FFIType.i32 },
});

function readWideString(buf: Buffer, offset: number, maxBytes: number): string {
  return buf.toString('utf16le', offset, offset + maxBytes).replace(/\0.*$/, '');
}

console.log();
console.log('  \x1b[1;33m\x1b[0m \x1b[1;33mUSB Device Detective\x1b[0m');
console.log('  \x1b[2mInterrogating every HID device on this machine...\x1b[0m');
console.log();

// Step 1: Get the HID GUID
const guidBuf = Buffer.alloc(16);
Hid.HidD_GetHidGuid(guidBuf.ptr);

// Step 2: Get device info set for all present HID interfaces
const hDevInfo = setupapi.symbols.SetupDiGetClassDevsW(
  guidBuf.ptr,
  null,
  null,
  DIGCF_PRESENT | DIGCF_DEVICEINTERFACE,
);

if (hDevInfo === INVALID_HANDLE_VALUE) {
  console.log('  \x1b[31mFailed to query HID device interfaces.\x1b[0m');
  process.exit(1);
}

const devices: Array<{
  product: string;
  manufacturer: string;
  vid: number;
  pid: number;
  version: number;
  path: string;
}> = [];

// Step 3: Enumerate each device interface
for (let index = 0; ; index++) {
  const interfaceData = Buffer.alloc(32);
  interfaceData.writeUInt32LE(32, 0); // cbSize = 32 on x64

  const enumOk = setupapi.symbols.SetupDiEnumDeviceInterfaces(
    hDevInfo,
    null,
    guidBuf.ptr,
    index,
    interfaceData.ptr,
  );
  if (!enumOk) break;

  // First call: get required buffer size for detail data
  const requiredSize = Buffer.alloc(4);
  setupapi.symbols.SetupDiGetDeviceInterfaceDetailW(
    hDevInfo,
    interfaceData.ptr,
    null,
    0,
    requiredSize.ptr,
    null,
  );

  const detailSize = requiredSize.readUInt32LE(0);
  if (detailSize === 0) continue;

  // Second call: get the actual detail data with device path
  const detailData = Buffer.alloc(detailSize);
  detailData.writeUInt32LE(8, 0); // cbSize = 8 on x64 (fixed for DETAIL_DATA_W)

  const detailOk = setupapi.symbols.SetupDiGetDeviceInterfaceDetailW(
    hDevInfo,
    interfaceData.ptr,
    detailData.ptr,
    detailSize,
    null,
    null,
  );
  if (!detailOk) continue;

  // Device path starts at offset 4 (wide string, null-terminated)
  const devicePath = readWideString(detailData, 4, detailSize - 4);
  if (!devicePath) continue;

  // Step 4: Open the device (read-only, shared)
  const pathBuf = Buffer.from(devicePath + '\0', 'utf16le');
  const hDevice = Kernel32.CreateFileW(
    pathBuf.ptr,
    0, // no access needed for HidD queries
    FILE_SHARE_READ | FILE_SHARE_WRITE,
    null!,
    OPEN_EXISTING,
    0,
    0n,
  );

  if (hDevice === INVALID_HANDLE_VALUE) continue; // access denied, skip

  // Step 5: Query product and manufacturer strings
  const nameBuf = Buffer.alloc(512);
  const mfgBuf = Buffer.alloc(512);

  const gotProduct = Hid.HidD_GetProductString(hDevice, nameBuf.ptr, 512);
  const gotMfg = Hid.HidD_GetManufacturerString(hDevice, mfgBuf.ptr, 512);

  const product = gotProduct ? readWideString(nameBuf, 0, 512) : '(unknown)';
  const manufacturer = gotMfg ? readWideString(mfgBuf, 0, 512) : '(unknown)';

  // Step 6: Query attributes (VID, PID, version)
  const attrBuf = Buffer.alloc(12);
  attrBuf.writeUInt32LE(12, 0); // Size field
  let vid = 0, pid = 0, version = 0;

  if (Hid.HidD_GetAttributes(hDevice, attrBuf.ptr)) {
    vid = attrBuf.readUInt16LE(4);
    pid = attrBuf.readUInt16LE(6);
    version = attrBuf.readUInt16LE(8);
  }

  Kernel32.CloseHandle(hDevice);

  devices.push({ product, manufacturer, vid, pid, version, path: devicePath });
}

setupapi.symbols.SetupDiDestroyDeviceInfoList(hDevInfo);

if (devices.length === 0) {
  console.log('  \x1b[33mNo HID devices found.\x1b[0m');
  console.log('  This is unusual - most systems have at least a keyboard or mouse.');
  console.log();
  process.exit(0);
}

// Group devices by manufacturer for visual impact
const byManufacturer = new Map<string, typeof devices>();
for (const dev of devices) {
  const key = dev.manufacturer;
  if (!byManufacturer.has(key)) byManufacturer.set(key, []);
  byManufacturer.get(key)!.push(dev);
}

console.log(`  \x1b[32m${devices.length} HID device(s) detected\x1b[0m`);
console.log();

let deviceNum = 0;
for (const [mfg, devs] of byManufacturer) {
  console.log(`  \x1b[1;36m[ ${mfg} ]\x1b[0m`);

  for (const dev of devs) {
    deviceNum++;
    const vidStr = dev.vid.toString(16).padStart(4, '0').toUpperCase();
    const pidStr = dev.pid.toString(16).padStart(4, '0').toUpperCase();

    console.log(`    #${String(deviceNum).padStart(2, ' ')}  \x1b[1m${dev.product}\x1b[0m`);
    console.log(`         ID: ${vidStr}:${pidStr}  ver ${dev.version}`);
  }

  console.log();
}

console.log(`  \x1b[2mCase closed. ${devices.length} device(s) identified across ${byManufacturer.size} manufacturer(s).\x1b[0m`);
console.log();
