/**
 * Driver Deck
 *
 * Scans present Plug and Play devices, picks a handful of representative
 * hardware-backed entries, then opens the SetupAPI driver lists Windows builds
 * for them. The report shows the selected driver, alternate candidates, and
 * the provider/date/version data that SetupAPI exposes for each deck.
 *
 * APIs demonstrated:
 *   - SetupDiGetClassDevsW (open the present-device set)
 *   - SetupDiEnumDeviceInfo (walk each device node)
 *   - SetupDiGetDeviceInstanceIdW (stable hardware identifier)
 *   - SetupDiGetDeviceRegistryPropertyW (class, manufacturer, service, display)
 *   - SetupDiBuildDriverInfoList (materialize compatible/class driver decks)
 *   - SetupDiGetSelectedDriverW (read the currently selected driver)
 *   - SetupDiEnumDriverInfoW (enumerate alternate driver candidates)
 *   - SetupDiDestroyDriverInfoList (release per-device driver decks)
 *   - SetupDiDestroyDeviceInfoList (release the device set)
 *   - GetLastError (detect enumeration completion and failures)
 *
 * Struct layouts:
 *   SP_DEVINFO_DATA (32 bytes on x64):
 *     +0x00  cbSize (DWORD) = 32
 *     +0x04  ClassGuid (GUID, 16 bytes)
 *     +0x14  DevInst (DWORD)
 *     +0x18  Reserved (ULONG_PTR, 8 bytes)
 *
 *   SP_DRVINFO_DATA_W / V2 (1568 bytes on x64):
 *     +0x00  cbSize (DWORD) = 1568
 *     +0x04  DriverType (DWORD)
 *     +0x08  Reserved (ULONG_PTR)
 *     +0x10  Description[256] (WCHAR)
 *     +0x210 MfgName[256] (WCHAR)
 *     +0x410 ProviderName[256] (WCHAR)
 *     +0x610 DriverDate (FILETIME, 8 bytes)
 *     +0x618 DriverVersion (DWORDLONG, 8 bytes)
 *
 * Run: bun run example:device-constellation
 */

import Kernel32 from '@bun-win32/kernel32';

import Setupapi, { DIGCF, INVALID_HANDLE_VALUE, SPDRP } from '../index';

const ANSI = {
  blue: '\x1b[94m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  reset: '\x1b[0m',
  yellow: '\x1b[33m',
} as const;

const DRIVER_TYPE = {
  CLASS: 0x0000_0001,
  COMPAT: 0x0000_0002,
} as const;

const ERROR_NO_MORE_ITEMS = 259;
const MAX_SHOWCASE_DEVICES = 8;
const MAX_VISIBLE_CANDIDATES = 5;
const REG_MULTI_SZ = 7;
const SP_DEVINFO_DATA_SIZE = 32;
const SP_DRVINFO_DATA_W_SIZE = 0x0620;
const WCHAR_BYTES = 2;
const WINDOWS_EPOCH_OFFSET_100NS = 116_444_736_000_000_000n;

const PREFERRED_CLASSES = new Set([
  'Bluetooth',
  'DiskDrive',
  'Display',
  'HDC',
  'HIDClass',
  'MEDIA',
  'Monitor',
  'Mouse',
  'Net',
  'USB',
  'USBDevice',
]);

interface DeviceMetadata {
  className: string;
  deviceInfoDataBuffer: Buffer;
  displayName: string;
  instanceId: string;
  manufacturer: string;
  service: string;
}

interface DriverCandidate {
  description: string;
  driverDate: string;
  driverKey: string;
  manufacturer: string;
  providerName: string;
  version: string;
}

interface DriverDeck {
  className: string;
  displayName: string;
  driverListType: 'class' | 'compatible';
  instanceId: string;
  manufacturer: string;
  service: string;
  selectedDriverKey: string | null;
  totalCandidates: number;
  visibleCandidates: DriverCandidate[];
}

Setupapi.Preload([
  'SetupDiBuildDriverInfoList',
  'SetupDiDestroyDeviceInfoList',
  'SetupDiDestroyDriverInfoList',
  'SetupDiEnumDeviceInfo',
  'SetupDiEnumDriverInfoW',
  'SetupDiGetClassDevsW',
  'SetupDiGetDeviceInstanceIdW',
  'SetupDiGetDeviceRegistryPropertyW',
  'SetupDiGetSelectedDriverW',
]);
Kernel32.Preload(['GetLastError']);

function createDeviceInfoDataBuffer(): Buffer {
  const deviceInfoDataBuffer = Buffer.alloc(SP_DEVINFO_DATA_SIZE);
  deviceInfoDataBuffer.writeUInt32LE(SP_DEVINFO_DATA_SIZE, 0);
  return deviceInfoDataBuffer;
}

function createDriverInfoDataBuffer(): Buffer {
  const driverInfoDataBuffer = Buffer.alloc(SP_DRVINFO_DATA_W_SIZE);
  driverInfoDataBuffer.writeUInt32LE(SP_DRVINFO_DATA_W_SIZE, 0);
  return driverInfoDataBuffer;
}

function readWideString(valueBuffer: Buffer, byteLength: number): string {
  if (byteLength <= 0) {
    return '';
  }

  return valueBuffer.toString('utf16le', 0, byteLength).replace(/\0.*$/, '').trim();
}

function readWideFixedString(valueBuffer: Buffer, offset: number, characterCount: number): string {
  return valueBuffer.toString('utf16le', offset, offset + characterCount * WCHAR_BYTES).replace(/\0.*$/, '').trim();
}

function readRegistryProperty(deviceInfoSet: bigint, deviceInfoDataBuffer: Buffer, property: SPDRP): string {
  const propertyBuffer = Buffer.alloc(2_048);
  const propertyTypeBuffer = Buffer.alloc(4);
  const requiredSizeBuffer = Buffer.alloc(4);
  const success = Setupapi.SetupDiGetDeviceRegistryPropertyW(
    deviceInfoSet,
    deviceInfoDataBuffer.ptr!,
    property,
    propertyTypeBuffer.ptr!,
    propertyBuffer.ptr!,
    propertyBuffer.length,
    requiredSizeBuffer.ptr!,
  );

  if (!success) {
    return '';
  }

  const requiredSize = requiredSizeBuffer.readUInt32LE(0);
  const propertyType = propertyTypeBuffer.readUInt32LE(0);
  if (propertyType === REG_MULTI_SZ) {
    return propertyBuffer
      .toString('utf16le', 0, requiredSize)
      .split('\0')
      .map((segment) => segment.trim())
      .filter(Boolean)
      .join('; ');
  }

  return readWideString(propertyBuffer, requiredSize);
}

function readDeviceInstanceId(deviceInfoSet: bigint, deviceInfoDataBuffer: Buffer): string {
  const instanceIdCapacity = 1_024;
  const instanceIdBuffer = Buffer.alloc(instanceIdCapacity * WCHAR_BYTES);
  const requiredSizeBuffer = Buffer.alloc(4);
  const success = Setupapi.SetupDiGetDeviceInstanceIdW(
    deviceInfoSet,
    deviceInfoDataBuffer.ptr!,
    instanceIdBuffer.ptr!,
    instanceIdCapacity,
    requiredSizeBuffer.ptr!,
  );

  if (!success) {
    return '(instance id unavailable)';
  }

  return readWideString(instanceIdBuffer, requiredSizeBuffer.readUInt32LE(0) * WCHAR_BYTES);
}

function formatDriverDate(fileTimeValue: bigint): string {
  if (fileTimeValue === 0n || fileTimeValue <= WINDOWS_EPOCH_OFFSET_100NS) {
    return '(unknown date)';
  }

  const unixMilliseconds = Number((fileTimeValue - WINDOWS_EPOCH_OFFSET_100NS) / 10_000n);
  return new Date(unixMilliseconds).toISOString().slice(0, 10);
}

function formatDriverVersion(versionValue: bigint): string {
  return [
    Number((versionValue >> 48n) & 0xffffn),
    Number((versionValue >> 32n) & 0xffffn),
    Number((versionValue >> 16n) & 0xffffn),
    Number(versionValue & 0xffffn),
  ].join('.');
}

function parseDriverCandidate(driverInfoDataBuffer: Buffer): DriverCandidate {
  const description = readWideFixedString(driverInfoDataBuffer, 0x0010, 256) || '(unnamed driver)';
  const manufacturer = readWideFixedString(driverInfoDataBuffer, 0x0210, 256) || '(unknown manufacturer)';
  const providerName = readWideFixedString(driverInfoDataBuffer, 0x0410, 256) || '(unknown provider)';
  const driverDate = formatDriverDate(driverInfoDataBuffer.readBigUInt64LE(0x0610));
  const version = formatDriverVersion(driverInfoDataBuffer.readBigUInt64LE(0x0618));
  const driverKey = `${description}\u0000${providerName}\u0000${manufacturer}\u0000${version}\u0000${driverDate}`;

  return {
    description,
    driverDate,
    driverKey,
    manufacturer,
    providerName,
    version,
  };
}

function truncate(value: string, width: number): string {
  if (value.length <= width) {
    return value;
  }

  if (width <= 3) {
    return value.slice(0, width);
  }

  return `${value.slice(0, width - 3)}...`;
}

function compareDriverDecks(left: DriverDeck, right: DriverDeck): number {
  const leftSelected = left.selectedDriverKey === null ? 0 : 1;
  const rightSelected = right.selectedDriverKey === null ? 0 : 1;
  if (leftSelected !== rightSelected) {
    return rightSelected - leftSelected;
  }

  if (left.totalCandidates !== right.totalCandidates) {
    return right.totalCandidates - left.totalCandidates;
  }

  if (left.visibleCandidates.length !== right.visibleCandidates.length) {
    return right.visibleCandidates.length - left.visibleCandidates.length;
  }

  if (left.driverListType !== right.driverListType) {
    return left.driverListType === 'compatible' ? -1 : 1;
  }

  return left.displayName.localeCompare(right.displayName);
}

function collectDriverDeckForType(deviceInfoSet: bigint, deviceMetadata: DeviceMetadata, driverType: number, driverListType: 'class' | 'compatible'): DriverDeck | null {
  const built = Setupapi.SetupDiBuildDriverInfoList(deviceInfoSet, deviceMetadata.deviceInfoDataBuffer.ptr!, driverType);
  if (!built) {
    return null;
  }

  try {
    const selectedDriverBuffer = createDriverInfoDataBuffer();
    const selectedDriverPresent = Setupapi.SetupDiGetSelectedDriverW(deviceInfoSet, deviceMetadata.deviceInfoDataBuffer.ptr!, selectedDriverBuffer.ptr!);
    const selectedDriverKey = selectedDriverPresent ? parseDriverCandidate(selectedDriverBuffer).driverKey : null;

    const visibleCandidates: DriverCandidate[] = [];
    let totalCandidates = 0;

    for (let memberIndex = 0; ; memberIndex += 1) {
      const driverInfoDataBuffer = createDriverInfoDataBuffer();
      const enumerated = Setupapi.SetupDiEnumDriverInfoW(deviceInfoSet, deviceMetadata.deviceInfoDataBuffer.ptr!, driverType, memberIndex, driverInfoDataBuffer.ptr!);

      if (!enumerated) {
        const lastError = Kernel32.GetLastError();
        if (lastError === ERROR_NO_MORE_ITEMS) {
          break;
        }

        throw new Error(`SetupDiEnumDriverInfoW failed for ${deviceMetadata.displayName} with Win32 error ${lastError}`);
      }

      totalCandidates += 1;
      if (visibleCandidates.length < MAX_VISIBLE_CANDIDATES) {
        visibleCandidates.push(parseDriverCandidate(driverInfoDataBuffer));
      }
    }

    if (totalCandidates === 0 && selectedDriverKey === null) {
      return null;
    }

    return {
      className: deviceMetadata.className,
      displayName: deviceMetadata.displayName,
      driverListType,
      instanceId: deviceMetadata.instanceId,
      manufacturer: deviceMetadata.manufacturer,
      service: deviceMetadata.service,
      selectedDriverKey,
      totalCandidates,
      visibleCandidates,
    };
  } finally {
    void Setupapi.SetupDiDestroyDriverInfoList(deviceInfoSet, deviceMetadata.deviceInfoDataBuffer.ptr!, driverType);
  }
}

function collectDriverDeck(deviceInfoSet: bigint, deviceMetadata: DeviceMetadata): DriverDeck | null {
  const compatibleDeck = collectDriverDeckForType(deviceInfoSet, deviceMetadata, DRIVER_TYPE.COMPAT, 'compatible');
  const classDeck = collectDriverDeckForType(deviceInfoSet, deviceMetadata, DRIVER_TYPE.CLASS, 'class');

  if (compatibleDeck && classDeck) {
    return compareDriverDecks(compatibleDeck, classDeck) <= 0 ? compatibleDeck : classDeck;
  }

  return compatibleDeck ?? classDeck;
}

const deviceInfoSet = Setupapi.SetupDiGetClassDevsW(null, null, 0n, DIGCF.ALLCLASSES | DIGCF.PRESENT);
if (deviceInfoSet === INVALID_HANDLE_VALUE) {
  throw new Error(`SetupDiGetClassDevsW failed with Win32 error ${Kernel32.GetLastError()}`);
}

const enumeratedDevices: DeviceMetadata[] = [];

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

    const className = readRegistryProperty(deviceInfoSet, deviceInfoDataBuffer, SPDRP.CLASS) || '(no class)';
    const displayName =
      readRegistryProperty(deviceInfoSet, deviceInfoDataBuffer, SPDRP.FRIENDLYNAME) ||
      readRegistryProperty(deviceInfoSet, deviceInfoDataBuffer, SPDRP.DEVICEDESC) ||
      '(unnamed device)';
    const manufacturer = readRegistryProperty(deviceInfoSet, deviceInfoDataBuffer, SPDRP.MFG) || '(unknown manufacturer)';
    const service = readRegistryProperty(deviceInfoSet, deviceInfoDataBuffer, SPDRP.SERVICE) || '(no service)';
    const instanceId = readDeviceInstanceId(deviceInfoSet, deviceInfoDataBuffer);

    enumeratedDevices.push({
      className,
      deviceInfoDataBuffer: Buffer.from(deviceInfoDataBuffer),
      displayName,
      instanceId,
      manufacturer,
      service,
    });
  }

  const orderedDevices = enumeratedDevices
    .filter((deviceMetadata) => deviceMetadata.service !== '(no service)')
    .sort((left, right) => {
      const leftPreferred = PREFERRED_CLASSES.has(left.className) ? 1 : 0;
      const rightPreferred = PREFERRED_CLASSES.has(right.className) ? 1 : 0;
      if (leftPreferred !== rightPreferred) {
        return rightPreferred - leftPreferred;
      }

      if (left.className !== right.className) {
        return left.className.localeCompare(right.className);
      }

      return left.displayName.localeCompare(right.displayName);
    });

  const devicesByClass = new Map<string, DeviceMetadata[]>();
  for (const deviceMetadata of orderedDevices) {
    const existingDevices = devicesByClass.get(deviceMetadata.className);
    if (existingDevices) {
      existingDevices.push(deviceMetadata);
      continue;
    }

    devicesByClass.set(deviceMetadata.className, [deviceMetadata]);
  }

  const rankedClasses = [...devicesByClass.keys()].sort((left, right) => {
    const leftPreferred = PREFERRED_CLASSES.has(left) ? 1 : 0;
    const rightPreferred = PREFERRED_CLASSES.has(right) ? 1 : 0;
    if (leftPreferred !== rightPreferred) {
      return rightPreferred - leftPreferred;
    }

    return left.localeCompare(right);
  });

  const driverDecks: DriverDeck[] = [];
  const seenDeckKeys = new Set<string>();

  for (let classOffset = 0; classOffset < orderedDevices.length; classOffset += 1) {
    let discoveredDeviceInPass = false;

    for (const className of rankedClasses) {
      if (driverDecks.length >= MAX_SHOWCASE_DEVICES) {
        break;
      }

      const classDevices = devicesByClass.get(className);
      const deviceMetadata = classDevices?.[classOffset];
      if (!deviceMetadata) {
        continue;
      }

      discoveredDeviceInPass = true;
      const dedupeKey = `${deviceMetadata.className}\u0000${deviceMetadata.displayName}\u0000${deviceMetadata.service}`;
      if (seenDeckKeys.has(dedupeKey)) {
        continue;
      }

      seenDeckKeys.add(dedupeKey);
      const driverDeck = collectDriverDeck(deviceInfoSet, deviceMetadata);
      if (!driverDeck) {
        continue;
      }

      driverDecks.push(driverDeck);
    }

    if (driverDecks.length >= MAX_SHOWCASE_DEVICES) {
      break;
    }

    if (!discoveredDeviceInPass) {
      break;
    }
  }

  if (driverDecks.length < MAX_SHOWCASE_DEVICES) {
    for (const deviceMetadata of orderedDevices) {
      if (driverDecks.length >= MAX_SHOWCASE_DEVICES) {
        break;
      }

      const dedupeKey = `${deviceMetadata.className}\u0000${deviceMetadata.displayName}\u0000${deviceMetadata.service}`;
      if (seenDeckKeys.has(dedupeKey)) {
        continue;
      }

      seenDeckKeys.add(dedupeKey);
      const driverDeck = collectDriverDeck(deviceInfoSet, deviceMetadata);
      if (!driverDeck) {
        continue;
      }

      driverDecks.push(driverDeck);
    }
  }

  console.log();
  console.log(`${ANSI.bold}${ANSI.blue}SetupAPI Driver Deck${ANSI.reset}`);
  console.log(`${ANSI.dim}${enumeratedDevices.length} present devices scanned; showing ${driverDecks.length} driver decks with real candidate lists.${ANSI.reset}`);
  console.log();

  if (driverDecks.length === 0) {
    console.log('No driver decks were available for the scanned devices.');
    console.log();
    process.exit(0);
  }

  const selectedDriverReported = driverDecks.some((driverDeck) => driverDeck.selectedDriverKey !== null);

  for (let deckIndex = 0; deckIndex < driverDecks.length; deckIndex += 1) {
    const driverDeck = driverDecks[deckIndex];
    console.log(`${ANSI.bold}[${deckIndex + 1}] ${driverDeck.displayName}${ANSI.reset}`);
    console.log(`  Class:         ${driverDeck.className}`);
    console.log(`  Manufacturer:  ${driverDeck.manufacturer}`);
    console.log(`  Service:       ${driverDeck.service}`);
    console.log(`  Driver list:   ${driverDeck.driverListType} (${driverDeck.totalCandidates} candidate${driverDeck.totalCandidates === 1 ? '' : 's'})`);
    console.log(`  Instance ID:   ${truncate(driverDeck.instanceId, 110)}`);
    console.log(`  Candidates:`);

    for (const candidate of driverDeck.visibleCandidates) {
      const isSelected = driverDeck.selectedDriverKey === candidate.driverKey;
      const marker = isSelected ? `${ANSI.green}*${ANSI.reset}` : ' ';
      const summary = `${truncate(candidate.description, 42).padEnd(42, ' ')}  ${truncate(candidate.providerName, 24).padEnd(24, ' ')}  ${candidate.driverDate}  ${candidate.version}`;
      console.log(`    ${marker} ${summary}`);
    }

    if (driverDeck.totalCandidates > driverDeck.visibleCandidates.length) {
      console.log(`    ${ANSI.dim}... ${driverDeck.totalCandidates - driverDeck.visibleCandidates.length} more candidate(s) omitted ...${ANSI.reset}`);
    }

    if (driverDeck.selectedDriverKey !== null) {
      console.log(`  ${ANSI.green}* marks the driver SetupAPI reports as selected.${ANSI.reset}`);
    }

    console.log();
  }

  console.log(`${ANSI.bold}Legend${ANSI.reset}`);
  console.log(`${ANSI.dim}Each card is a present device. The candidate rows come from SetupDiBuildDriverInfoList + SetupDiEnumDriverInfoW.${ANSI.reset}`);
  console.log(`${ANSI.dim}This is the package showing Windows' actual compatible/class driver deck, not a synthetic summary.${ANSI.reset}`);
  if (!selectedDriverReported) {
    console.log(`${ANSI.dim}${ANSI.yellow}SetupDiGetSelectedDriverW did not report a selected entry for these decks on this machine.${ANSI.reset}`);
  }
  console.log();
} finally {
  void Setupapi.SetupDiDestroyDeviceInfoList(deviceInfoSet);
}
