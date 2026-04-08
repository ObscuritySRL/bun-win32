/**
 * Comprehensive HID device audit with full capability reporting.
 *
 * Enumerates all HID device interfaces via setupapi.dll, opens each device,
 * and retrieves not only product/manufacturer/VID:PID but also the full HID
 * capabilities via HidP_GetCaps (preparsed data). Reports usage page, usage,
 * report byte lengths, and button/value capability counts for every device.
 *
 * APIs demonstrated:
 *   - HidD_GetHidGuid (hid.dll)
 *   - SetupDiGetClassDevsW, SetupDiEnumDeviceInterfaces,
 *     SetupDiGetDeviceInterfaceDetailW, SetupDiDestroyDeviceInfoList (setupapi.dll)
 *   - CreateFileW, CloseHandle (kernel32.dll via @bun-win32/kernel32)
 *   - HidD_GetProductString, HidD_GetManufacturerString, HidD_GetAttributes
 *   - HidD_GetPreparsedData, HidP_GetCaps, HidD_FreePreparsedData
 *
 * Struct layouts:
 *   SP_DEVICE_INTERFACE_DATA (32 bytes on x64):
 *     +0x00  cbSize (DWORD) = 32
 *     +0x04  InterfaceClassGuid (16 bytes)
 *     +0x14  Flags (DWORD)
 *     +0x18  Reserved (ULONG_PTR, 8 bytes)
 *
 *   SP_DEVICE_INTERFACE_DETAIL_DATA_W (variable):
 *     +0x00  cbSize (DWORD) = 8 on x64
 *     +0x04  DevicePath (WCHAR[])
 *
 *   HIDD_ATTRIBUTES (12 bytes):
 *     +0x00  Size (ULONG) = 12
 *     +0x04  VendorID (USHORT)
 *     +0x06  ProductID (USHORT)
 *     +0x08  VersionNumber (USHORT)
 *
 *   HIDP_CAPS (64 bytes):
 *     +0x00  Usage (USHORT)
 *     +0x02  UsagePage (USHORT)
 *     +0x04  InputReportByteLength (USHORT)
 *     +0x06  OutputReportByteLength (USHORT)
 *     +0x08  FeatureReportByteLength (USHORT)
 *     +0x0A  Reserved[17] (USHORT x17 = 34 bytes)
 *     +0x2C  NumberLinkCollectionNodes (USHORT)
 *     +0x2E  NumberInputButtonCaps (USHORT)
 *     +0x30  NumberInputValueCaps (USHORT)
 *     +0x32  NumberInputDataIndices (USHORT)
 *     +0x34  NumberOutputButtonCaps (USHORT)
 *     +0x36  NumberOutputValueCaps (USHORT)
 *     +0x38  NumberOutputDataIndices (USHORT)
 *     +0x3A  NumberFeatureButtonCaps (USHORT)
 *     +0x3C  NumberFeatureValueCaps (USHORT)
 *     +0x3E  NumberFeatureDataIndices (USHORT)
 *
 * Run: bun run example/hid-audit.ts
 */

import { dlopen, FFIType, read, toArrayBuffer, type Pointer } from 'bun:ffi';
import Hid, { HIDP_STATUS_SUCCESS } from '../index';
import Kernel32 from '@bun-win32/kernel32';

const DIGCF_PRESENT = 0x00000002;
const DIGCF_DEVICEINTERFACE = 0x00000010;
const FILE_SHARE_READ = 0x00000001;
const FILE_SHARE_WRITE = 0x00000002;
const OPEN_EXISTING = 3;
const INVALID_HANDLE_VALUE = 0xffffffff_ffffffffn;

const USAGE_PAGES: Record<number, string> = {
  0x01: 'Generic Desktop Controls',
  0x02: 'Simulation Controls',
  0x03: 'VR Controls',
  0x04: 'Sport Controls',
  0x05: 'Game Controls',
  0x06: 'Generic Device Controls',
  0x07: 'Keyboard/Keypad',
  0x08: 'LED',
  0x09: 'Button',
  0x0a: 'Ordinal',
  0x0b: 'Telephony Device',
  0x0c: 'Consumer',
  0x0d: 'Digitizer',
  0x0e: 'Haptics',
  0x0f: 'Physical Input Device',
  0x10: 'Unicode',
  0x12: 'Eye and Head Trackers',
  0x14: 'Auxiliary Display',
  0x20: 'Sensors',
  0x40: 'Medical Instrument',
  0x80: 'Monitor',
  0x84: 'Power',
  0x8c: 'Bar Code Scanner',
  0x8d: 'Scale',
  0x8e: 'Magnetic Stripe Reader',
  0xf1d0: 'FIDO Alliance',
};

const GENERIC_DESKTOP_USAGES: Record<number, string> = {
  0x01: 'Pointer',
  0x02: 'Mouse',
  0x04: 'Joystick',
  0x05: 'Gamepad',
  0x06: 'Keyboard',
  0x07: 'Keypad',
  0x08: 'Multi-axis Controller',
  0x09: 'Tablet PC Controls',
  0x0a: 'Water Cooling Device',
  0x0b: 'Computer Chassis Device',
  0x0c: 'Wireless Radio Controls',
  0x0d: 'Portable Device Control',
  0x0e: 'System Multi-Axis Controller',
  0x0f: 'Spatial Controller',
  0x10: 'Assistive Control',
  0x11: 'Device Dock',
  0x12: 'Dockable Device',
};

const setupapi = dlopen('setupapi.dll', {
  SetupDiGetClassDevsW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
  SetupDiEnumDeviceInterfaces: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
  SetupDiGetDeviceInterfaceDetailW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
  SetupDiDestroyDeviceInfoList: { args: [FFIType.u64], returns: FFIType.i32 },
});

function readWideString(buf: Buffer, offset: number, maxBytes: number): string {
  return buf.toString('utf16le', offset, offset + maxBytes).replace(/\0.*$/, '');
}

function decodeUsagePage(page: number): string {
  return USAGE_PAGES[page] ?? `Vendor-Defined (0x${page.toString(16)})`;
}

function decodeUsage(page: number, usage: number): string {
  if (page === 0x01) {
    return GENERIC_DESKTOP_USAGES[usage] ?? `0x${usage.toString(16).padStart(2, '0')}`;
  }
  return `0x${usage.toString(16).padStart(2, '0')}`;
}

console.log();
console.log('=== HID Device Audit ===');
console.log();

const guidBuf = Buffer.alloc(16);
Hid.HidD_GetHidGuid(guidBuf.ptr);

const hDevInfo = setupapi.symbols.SetupDiGetClassDevsW(
  guidBuf.ptr,
  null,
  null,
  DIGCF_PRESENT | DIGCF_DEVICEINTERFACE,
);

if (hDevInfo === INVALID_HANDLE_VALUE) {
  console.log('  Failed to query HID device interfaces.');
  process.exit(1);
}

interface DeviceReport {
  path: string;
  product: string;
  manufacturer: string;
  vid: number;
  pid: number;
  version: number;
  capsOk: boolean;
  usage: number;
  usagePage: number;
  inputReportLen: number;
  outputReportLen: number;
  featureReportLen: number;
  linkCollections: number;
  inputButtonCaps: number;
  inputValueCaps: number;
  inputDataIndices: number;
  outputButtonCaps: number;
  outputValueCaps: number;
  outputDataIndices: number;
  featureButtonCaps: number;
  featureValueCaps: number;
  featureDataIndices: number;
}

const devices: DeviceReport[] = [];

for (let index = 0; ; index++) {
  const interfaceData = Buffer.alloc(32);
  interfaceData.writeUInt32LE(32, 0);

  const enumOk = setupapi.symbols.SetupDiEnumDeviceInterfaces(
    hDevInfo,
    null,
    guidBuf.ptr,
    index,
    interfaceData.ptr,
  );
  if (!enumOk) break;

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

  const detailData = Buffer.alloc(detailSize);
  detailData.writeUInt32LE(8, 0); // cbSize = 8 on x64

  const detailOk = setupapi.symbols.SetupDiGetDeviceInterfaceDetailW(
    hDevInfo,
    interfaceData.ptr,
    detailData.ptr,
    detailSize,
    null,
    null,
  );
  if (!detailOk) continue;

  const devicePath = readWideString(detailData, 4, detailSize - 4);
  if (!devicePath) continue;

  const pathBuf = Buffer.from(devicePath + '\0', 'utf16le');
  const hDevice = Kernel32.CreateFileW(
    pathBuf.ptr,
    0,
    FILE_SHARE_READ | FILE_SHARE_WRITE,
    null!,
    OPEN_EXISTING,
    0,
    0n,
  );

  if (hDevice === INVALID_HANDLE_VALUE) continue;

  // Basic info
  const nameBuf = Buffer.alloc(512);
  const mfgBuf = Buffer.alloc(512);
  const gotProduct = Hid.HidD_GetProductString(hDevice, nameBuf.ptr, 512);
  const gotMfg = Hid.HidD_GetManufacturerString(hDevice, mfgBuf.ptr, 512);
  const product = gotProduct ? readWideString(nameBuf, 0, 512) : '(unknown)';
  const manufacturer = gotMfg ? readWideString(mfgBuf, 0, 512) : '(unknown)';

  const attrBuf = Buffer.alloc(12);
  attrBuf.writeUInt32LE(12, 0);
  let vid = 0, pid = 0, version = 0;
  if (Hid.HidD_GetAttributes(hDevice, attrBuf.ptr)) {
    vid = attrBuf.readUInt16LE(4);
    pid = attrBuf.readUInt16LE(6);
    version = attrBuf.readUInt16LE(8);
  }

  // Get preparsed data and capabilities
  const report: DeviceReport = {
    path: devicePath,
    product,
    manufacturer,
    vid,
    pid,
    version,
    capsOk: false,
    usage: 0,
    usagePage: 0,
    inputReportLen: 0,
    outputReportLen: 0,
    featureReportLen: 0,
    linkCollections: 0,
    inputButtonCaps: 0,
    inputValueCaps: 0,
    inputDataIndices: 0,
    outputButtonCaps: 0,
    outputValueCaps: 0,
    outputDataIndices: 0,
    featureButtonCaps: 0,
    featureValueCaps: 0,
    featureDataIndices: 0,
  };

  const ppDataPtr = Buffer.alloc(8); // pointer to preparsed data
  if (Hid.HidD_GetPreparsedData(hDevice, ppDataPtr.ptr)) {
    const preparsedPtr = ppDataPtr.readBigUInt64LE(0);

    if (preparsedPtr !== 0n) {
      const capsBuf = Buffer.alloc(64);
      const status = Hid.HidP_GetCaps(Number(preparsedPtr) as unknown as Pointer, capsBuf.ptr);

      if (status === HIDP_STATUS_SUCCESS) {
        report.capsOk = true;
        report.usage = capsBuf.readUInt16LE(0);
        report.usagePage = capsBuf.readUInt16LE(2);
        report.inputReportLen = capsBuf.readUInt16LE(4);
        report.outputReportLen = capsBuf.readUInt16LE(6);
        report.featureReportLen = capsBuf.readUInt16LE(8);
        report.linkCollections = capsBuf.readUInt16LE(0x2c);
        report.inputButtonCaps = capsBuf.readUInt16LE(0x2e);
        report.inputValueCaps = capsBuf.readUInt16LE(0x30);
        report.inputDataIndices = capsBuf.readUInt16LE(0x32);
        report.outputButtonCaps = capsBuf.readUInt16LE(0x34);
        report.outputValueCaps = capsBuf.readUInt16LE(0x36);
        report.outputDataIndices = capsBuf.readUInt16LE(0x38);
        report.featureButtonCaps = capsBuf.readUInt16LE(0x3a);
        report.featureValueCaps = capsBuf.readUInt16LE(0x3c);
        report.featureDataIndices = capsBuf.readUInt16LE(0x3e);
      }

      Hid.HidD_FreePreparsedData(Number(preparsedPtr) as unknown as Pointer);
    }
  }

  Kernel32.CloseHandle(hDevice);
  devices.push(report);
}

setupapi.symbols.SetupDiDestroyDeviceInfoList(hDevInfo);

if (devices.length === 0) {
  console.log('  No HID devices found.');
  console.log('  This is unusual - most systems have at least a keyboard or mouse.');
  console.log();
  process.exit(0);
}

console.log(`  Found ${devices.length} HID device(s)`);
console.log();

for (let i = 0; i < devices.length; i++) {
  const dev = devices[i];
  const vidStr = dev.vid.toString(16).padStart(4, '0').toUpperCase();
  const pidStr = dev.pid.toString(16).padStart(4, '0').toUpperCase();

  console.log(`--- Device ${i + 1} of ${devices.length} ---`);
  console.log(`  Product:            ${dev.product}`);
  console.log(`  Manufacturer:       ${dev.manufacturer}`);
  console.log(`  VID:PID:            ${vidStr}:${pidStr}`);
  console.log(`  Version:            ${dev.version}`);
  console.log(`  Path:               ${dev.path}`);

  if (dev.capsOk) {
    const usagePageName = decodeUsagePage(dev.usagePage);
    const usageName = decodeUsage(dev.usagePage, dev.usage);

    console.log(`  Usage Page:         0x${dev.usagePage.toString(16).padStart(2, '0')} (${usagePageName})`);
    console.log(`  Usage:              0x${dev.usage.toString(16).padStart(2, '0')} (${usageName})`);
    console.log(`  Report Lengths:     input=${dev.inputReportLen} bytes, output=${dev.outputReportLen} bytes, feature=${dev.featureReportLen} bytes`);
    console.log(`  Link Collections:   ${dev.linkCollections}`);
    console.log(`  Input Caps:         ${dev.inputButtonCaps} button(s), ${dev.inputValueCaps} value(s), ${dev.inputDataIndices} data index(es)`);
    console.log(`  Output Caps:        ${dev.outputButtonCaps} button(s), ${dev.outputValueCaps} value(s), ${dev.outputDataIndices} data index(es)`);
    console.log(`  Feature Caps:       ${dev.featureButtonCaps} button(s), ${dev.featureValueCaps} value(s), ${dev.featureDataIndices} data index(es)`);
  } else {
    console.log(`  Capabilities:       (could not retrieve preparsed data)`);
  }

  console.log();
}

// Summary by usage page
const usagePageCounts = new Map<string, number>();
for (const dev of devices) {
  if (!dev.capsOk) continue;
  const label = decodeUsagePage(dev.usagePage);
  usagePageCounts.set(label, (usagePageCounts.get(label) ?? 0) + 1);
}

console.log('--- Summary ---');
console.log(`  Total devices:      ${devices.length}`);
console.log(`  With capabilities:  ${devices.filter((d) => d.capsOk).length}`);

if (usagePageCounts.size > 0) {
  console.log('  By usage page:');
  for (const [page, count] of [...usagePageCounts.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`    ${page}: ${count}`);
  }
}

console.log();
