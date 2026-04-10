/**
 * Device Census
 *
 * Enumerates every present Plug and Play device, reads its friendly name,
 * class, manufacturer, service, enumerator, and instance ID, then prints a
 * compact operations-style report with totals, ranked class counts, and a
 * full device table.
 *
 * APIs demonstrated:
 *   - SetupDiGetClassDevsW (open the present-device set)
 *   - SetupDiEnumDeviceInfo (walk each device node)
 *   - SetupDiGetDeviceInstanceIdW (read the stable instance identifier)
 *   - SetupDiGetDeviceRegistryPropertyW (friendly names and metadata)
 *   - SetupDiDestroyDeviceInfoList (release the device set)
 *   - GetLastError (detect end-of-enumeration cleanly)
 *
 * Run: bun run example:device-census
 */

import Kernel32 from '@bun-win32/kernel32';

import Setupapi, { DIGCF, INVALID_HANDLE_VALUE, SPDRP } from '../index';

const ANSI = {
  bold: '\x1b[1m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  reset: '\x1b[0m',
  yellow: '\x1b[33m',
} as const;

const ERROR_NO_MORE_ITEMS = 259;
const REG_MULTI_SZ = 7;
const SP_DEVINFO_DATA_SIZE = 32;
const WCHAR_BYTES = 2;

interface DeviceRecord {
  className: string;
  displayName: string;
  enumeratorName: string;
  instanceId: string;
  manufacturer: string;
  service: string;
}

Setupapi.Preload(['SetupDiDestroyDeviceInfoList', 'SetupDiEnumDeviceInfo', 'SetupDiGetClassDevsW', 'SetupDiGetDeviceInstanceIdW', 'SetupDiGetDeviceRegistryPropertyW']);
Kernel32.Preload(['GetLastError']);

function createDeviceInfoDataBuffer(): Buffer {
  const deviceInfoDataBuffer = Buffer.alloc(SP_DEVINFO_DATA_SIZE);

  // SP_DEVINFO_DATA is 32 bytes on x64:
  // DWORD cbSize, GUID ClassGuid, DWORD DevInst, ULONG_PTR Reserved.
  deviceInfoDataBuffer.writeUInt32LE(SP_DEVINFO_DATA_SIZE, 0);
  return deviceInfoDataBuffer;
}

function readWideString(valueBuffer: Buffer, byteLength: number): string {
  if (byteLength <= 0) {
    return '';
  }

  return valueBuffer.toString('utf16le', 0, byteLength).replace(/\0.*$/, '').trim();
}

function readWideMultiString(valueBuffer: Buffer, byteLength: number): string {
  if (byteLength <= 0) {
    return '';
  }

  return valueBuffer
    .toString('utf16le', 0, byteLength)
    .split('\0')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .join('; ');
}

function readDeviceInstanceId(deviceInfoSet: bigint, deviceInfoDataBuffer: Buffer): string {
  const instanceIdCapacity = 1_024;
  const instanceIdBuffer = Buffer.alloc(instanceIdCapacity * WCHAR_BYTES);
  const requiredSizeBuffer = Buffer.alloc(4);
  const success = Setupapi.SetupDiGetDeviceInstanceIdW(deviceInfoSet, deviceInfoDataBuffer.ptr!, instanceIdBuffer.ptr!, instanceIdCapacity, requiredSizeBuffer.ptr!);

  if (!success) {
    return '(instance id unavailable)';
  }

  return readWideString(instanceIdBuffer, requiredSizeBuffer.readUInt32LE(0) * WCHAR_BYTES);
}

function readRegistryProperty(deviceInfoSet: bigint, deviceInfoDataBuffer: Buffer, property: SPDRP): string {
  const propertyBuffer = Buffer.alloc(4_096);
  const propertyTypeBuffer = Buffer.alloc(4);
  const requiredSizeBuffer = Buffer.alloc(4);
  const success = Setupapi.SetupDiGetDeviceRegistryPropertyW(deviceInfoSet, deviceInfoDataBuffer.ptr!, property, propertyTypeBuffer.ptr!, propertyBuffer.ptr!, propertyBuffer.length, requiredSizeBuffer.ptr!);

  if (!success) {
    return '';
  }

  const requiredSize = requiredSizeBuffer.readUInt32LE(0);
  const propertyType = propertyTypeBuffer.readUInt32LE(0);

  if (propertyType === REG_MULTI_SZ) {
    return readWideMultiString(propertyBuffer, requiredSize);
  }

  return readWideString(propertyBuffer, requiredSize);
}

function truncate(value: string, width: number): string {
  if (width <= 0) {
    return '';
  }

  if (value.length <= width) {
    return value.padEnd(width, ' ');
  }

  if (width <= 3) {
    return value.slice(0, width);
  }

  return `${value.slice(0, width - 3)}...`;
}

function renderBar(value: number, maxValue: number, width: number): string {
  if (value <= 0 || width <= 0 || maxValue <= 0) {
    return ''.padEnd(width, ' ');
  }

  const filledWidth = Math.max(1, Math.round((value / maxValue) * width));
  return `${'#'.repeat(filledWidth)}${' '.repeat(Math.max(0, width - filledWidth))}`;
}

const deviceInfoSet = Setupapi.SetupDiGetClassDevsW(null, null, 0n, DIGCF.ALLCLASSES | DIGCF.PRESENT);
if (deviceInfoSet === INVALID_HANDLE_VALUE) {
  throw new Error(`SetupDiGetClassDevsW failed with Win32 error ${Kernel32.GetLastError()}`);
}

const deviceRecords: DeviceRecord[] = [];

try {
  for (let deviceIndex = 0; ; deviceIndex += 1) {
    const deviceInfoDataBuffer = createDeviceInfoDataBuffer();
    const success = Setupapi.SetupDiEnumDeviceInfo(deviceInfoSet, deviceIndex, deviceInfoDataBuffer.ptr!);

    if (!success) {
      const lastError = Kernel32.GetLastError();
      if (lastError === ERROR_NO_MORE_ITEMS) {
        break;
      }

      throw new Error(`SetupDiEnumDeviceInfo failed at index ${deviceIndex} with Win32 error ${lastError}`);
    }

    const displayName = readRegistryProperty(deviceInfoSet, deviceInfoDataBuffer, SPDRP.FRIENDLYNAME) || readRegistryProperty(deviceInfoSet, deviceInfoDataBuffer, SPDRP.DEVICEDESC) || '(unnamed device)';
    const className = readRegistryProperty(deviceInfoSet, deviceInfoDataBuffer, SPDRP.CLASS) || '(no class)';
    const enumeratorName = readRegistryProperty(deviceInfoSet, deviceInfoDataBuffer, SPDRP.ENUMERATOR_NAME) || '(unknown enumerator)';
    const manufacturer = readRegistryProperty(deviceInfoSet, deviceInfoDataBuffer, SPDRP.MFG) || '(unknown manufacturer)';
    const service = readRegistryProperty(deviceInfoSet, deviceInfoDataBuffer, SPDRP.SERVICE) || '(no service)';
    const instanceId = readDeviceInstanceId(deviceInfoSet, deviceInfoDataBuffer);

    deviceRecords.push({
      className,
      displayName,
      enumeratorName,
      instanceId,
      manufacturer,
      service,
    });
  }
} finally {
  void Setupapi.SetupDiDestroyDeviceInfoList(deviceInfoSet);
}

deviceRecords.sort((left, right) => {
  if (left.className !== right.className) {
    return left.className.localeCompare(right.className);
  }

  return left.displayName.localeCompare(right.displayName);
});

const classCounts = new Map<string, number>();
const enumeratorCounts = new Map<string, number>();
const manufacturerCounts = new Map<string, number>();

for (const deviceRecord of deviceRecords) {
  classCounts.set(deviceRecord.className, (classCounts.get(deviceRecord.className) ?? 0) + 1);
  enumeratorCounts.set(deviceRecord.enumeratorName, (enumeratorCounts.get(deviceRecord.enumeratorName) ?? 0) + 1);
  manufacturerCounts.set(deviceRecord.manufacturer, (manufacturerCounts.get(deviceRecord.manufacturer) ?? 0) + 1);
}

const rankedClasses = [...classCounts.entries()].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));
const rankedEnumerators = [...enumeratorCounts.entries()].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));
const rankedManufacturers = [...manufacturerCounts.entries()].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));

const topBarWidth = Math.min(32, Math.max(12, (process.stdout.columns ?? 120) - 38));
const maxClassCount = rankedClasses[0]?.[1] ?? 0;

console.log();
console.log(`${ANSI.bold}${ANSI.cyan}SetupAPI Device Census${ANSI.reset}`);
console.log(`${ANSI.dim}Present Plug and Play devices discovered through setupapi.dll${ANSI.reset}`);
console.log();

console.log(`${ANSI.bold}Summary${ANSI.reset}`);
console.log(`  Devices:        ${ANSI.green}${deviceRecords.length}${ANSI.reset}`);
console.log(`  Classes:        ${rankedClasses.length}`);
console.log(`  Enumerators:    ${rankedEnumerators.length}`);
console.log(`  Manufacturers:  ${rankedManufacturers.length}`);
console.log();

console.log(`${ANSI.bold}Top Classes${ANSI.reset}`);
for (const [className, count] of rankedClasses.slice(0, 10)) {
  console.log(`  ${truncate(className, 20)} ${ANSI.yellow}${renderBar(count, maxClassCount, topBarWidth)}${ANSI.reset} ${count}`);
}
console.log();

console.log(`${ANSI.bold}Top Enumerators${ANSI.reset}`);
for (const [enumeratorName, count] of rankedEnumerators.slice(0, 8)) {
  console.log(`  ${truncate(enumeratorName, 20)} ${count}`);
}
console.log();

console.log(`${ANSI.bold}Top Manufacturers${ANSI.reset}`);
for (const [manufacturer, count] of rankedManufacturers.slice(0, 8)) {
  console.log(`  ${truncate(manufacturer, 32)} ${count}`);
}
console.log();

const classWidth = 22;
const enumeratorWidth = 14;
const serviceWidth = 18;
const remainingWidth = Math.max(30, (process.stdout.columns ?? 140) - (classWidth + enumeratorWidth + serviceWidth + 14));

console.log(`${ANSI.bold}Devices${ANSI.reset}`);
console.log(`${truncate('#', 4)} ${truncate('Class', classWidth)} ${truncate('Enumerator', enumeratorWidth)} ${truncate('Service', serviceWidth)} ${truncate('Name / Instance ID', remainingWidth)}`);
console.log(`${ANSI.dim}${'-'.repeat(Math.max(80, process.stdout.columns ?? 140))}${ANSI.reset}`);

for (let deviceIndex = 0; deviceIndex < deviceRecords.length; deviceIndex += 1) {
  const deviceRecord = deviceRecords[deviceIndex];
  const combinedDetail = `${deviceRecord.displayName}  ${ANSI.dim}[${deviceRecord.instanceId}]${ANSI.reset}`;
  console.log(
    `${truncate(String(deviceIndex + 1), 4)} ${truncate(deviceRecord.className, classWidth)} ${truncate(deviceRecord.enumeratorName, enumeratorWidth)} ${truncate(deviceRecord.service, serviceWidth)} ${truncate(combinedDetail, remainingWidth)}`,
  );
}

console.log();
