/**
 * Registry Explorer - Deep dive into the Windows Registry.
 *
 * Opens several interesting registry keys and reads their values to produce
 * a comprehensive system information report. Uses RegOpenKeyExW to open keys,
 * RegQueryValueExW to read string (REG_SZ) and DWORD (REG_DWORD) values,
 * RegEnumKeyExW to list subkeys, RegEnumValueW to enumerate all values in
 * a key, and RegCloseKey for proper cleanup.
 *
 * Registry keys explored:
 * - HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion (OS info)
 * - HKLM\HARDWARE\DESCRIPTION\System\CentralProcessor\0 (CPU info)
 * - HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer (Explorer settings)
 *
 * Demonstrates:
 * - RegOpenKeyExW, RegCloseKey
 * - RegQueryValueExW (REG_SZ, REG_DWORD)
 * - RegEnumKeyExW (subkey enumeration)
 * - RegEnumValueW (value enumeration)
 * - HKEY_LOCAL_MACHINE, HKEY_CURRENT_USER constants
 * - RegKeyAccessRights, RegType enums
 *
 * Run: bun run example/registry-explorer.ts
 */

import Advapi32, {
  HKEY_LOCAL_MACHINE,
  HKEY_CURRENT_USER,
  RegKeyAccessRights,
  RegType,
} from '../index';

const encode = (str: string) => Buffer.from(`${str}\0`, 'utf16le');

// Read a wide string from a buffer until the null terminator
function readWideStringBuf(buf: Buffer): string {
  let end = 0;
  while (end < buf.length - 1) {
    if (buf[end] === 0 && buf[end + 1] === 0) break;
    end += 2;
  }
  return buf.subarray(0, end).toString('utf16le');
}

// RegType to human-readable name
function regTypeName(type: number): string {
  const names: Record<number, string> = {
    [RegType.REG_NONE]: 'REG_NONE',
    [RegType.REG_SZ]: 'REG_SZ',
    [RegType.REG_EXPAND_SZ]: 'REG_EXPAND_SZ',
    [RegType.REG_BINARY]: 'REG_BINARY',
    [RegType.REG_DWORD]: 'REG_DWORD',
    [RegType.REG_DWORD_BIG_ENDIAN]: 'REG_DWORD_BIG_ENDIAN',
    [RegType.REG_LINK]: 'REG_LINK',
    [RegType.REG_MULTI_SZ]: 'REG_MULTI_SZ',
    [RegType.REG_RESOURCE_LIST]: 'REG_RESOURCE_LIST',
    [RegType.REG_FULL_RESOURCE_DESCRIPTOR]: 'REG_FULL_RESOURCE_DESCRIPTOR',
    [RegType.REG_RESOURCE_REQUIREMENTS_LIST]: 'REG_RESOURCE_REQUIREMENTS_LIST',
    [RegType.REG_QWORD]: 'REG_QWORD',
  };
  return names[type] || `UNKNOWN(${type})`;
}

// Open a registry key, returning the handle or null on failure
function openKey(rootKey: bigint, subKeyPath: string): bigint | null {
  const hKeyBuf = Buffer.alloc(8);
  const result = Advapi32.RegOpenKeyExW(
    rootKey,
    encode(subKeyPath).ptr,
    0,
    RegKeyAccessRights.KEY_READ,
    hKeyBuf.ptr,
  );
  if (result !== 0) return null;
  return hKeyBuf.readBigUInt64LE(0);
}

// Read a string value from an open key
function readStringValue(hKey: bigint, valueName: string): string | null {
  const typeBuf = Buffer.alloc(4);
  const dataBuf = Buffer.alloc(2048);
  const sizeBuf = Buffer.alloc(4);
  sizeBuf.writeUInt32LE(2048, 0);

  const result = Advapi32.RegQueryValueExW(
    hKey,
    encode(valueName).ptr,
    null,
    typeBuf.ptr,
    dataBuf.ptr,
    sizeBuf.ptr,
  );
  if (result !== 0) return null;

  const type = typeBuf.readUInt32LE(0);
  if (type !== RegType.REG_SZ && type !== RegType.REG_EXPAND_SZ) return null;

  const dataSize = sizeBuf.readUInt32LE(0);
  if (dataSize <= 2) return '';
  // dataSize includes the null terminator bytes
  return dataBuf.subarray(0, dataSize - 2).toString('utf16le');
}

// Read a DWORD value from an open key
function readDwordValue(hKey: bigint, valueName: string): number | null {
  const typeBuf = Buffer.alloc(4);
  const dataBuf = Buffer.alloc(4);
  const sizeBuf = Buffer.alloc(4);
  sizeBuf.writeUInt32LE(4, 0);

  const result = Advapi32.RegQueryValueExW(
    hKey,
    encode(valueName).ptr,
    null,
    typeBuf.ptr,
    dataBuf.ptr,
    sizeBuf.ptr,
  );
  if (result !== 0) return null;
  if (typeBuf.readUInt32LE(0) !== RegType.REG_DWORD) return null;
  return dataBuf.readUInt32LE(0);
}

// Read any value and format it based on type
function readAnyValue(hKey: bigint, valueName: string): { type: number; display: string } | null {
  const typeBuf = Buffer.alloc(4);
  const dataBuf = Buffer.alloc(4096);
  const sizeBuf = Buffer.alloc(4);
  sizeBuf.writeUInt32LE(4096, 0);

  const result = Advapi32.RegQueryValueExW(
    hKey,
    encode(valueName).ptr,
    null,
    typeBuf.ptr,
    dataBuf.ptr,
    sizeBuf.ptr,
  );
  if (result !== 0) return null;

  const type = typeBuf.readUInt32LE(0);
  const dataSize = sizeBuf.readUInt32LE(0);

  let display = '';

  switch (type) {
    case RegType.REG_SZ:
    case RegType.REG_EXPAND_SZ:
      display = dataSize > 2 ? dataBuf.subarray(0, dataSize - 2).toString('utf16le') : '';
      break;
    case RegType.REG_DWORD:
      display = String(dataBuf.readUInt32LE(0));
      break;
    case RegType.REG_QWORD:
      display = String(dataBuf.readBigUInt64LE(0));
      break;
    case RegType.REG_BINARY: {
      const bytes = dataBuf.subarray(0, Math.min(dataSize, 32));
      display = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join(' ');
      if (dataSize > 32) display += ` ... (${dataSize} bytes total)`;
      break;
    }
    case RegType.REG_MULTI_SZ: {
      const raw = dataBuf.subarray(0, dataSize).toString('utf16le');
      display = raw.split('\0').filter((s) => s.length > 0).join('; ');
      break;
    }
    default:
      display = `(${dataSize} bytes)`;
      break;
  }

  return { type, display };
}

// Enumerate subkeys under a key
function enumSubKeys(hKey: bigint, maxKeys: number = 50): string[] {
  const subkeys: string[] = [];
  const nameBuf = Buffer.alloc(512);

  for (let i = 0; i < maxKeys; i++) {
    const nameSizeBuf = Buffer.alloc(4);
    nameSizeBuf.writeUInt32LE(256, 0);

    const result = Advapi32.RegEnumKeyExW(hKey, i, nameBuf.ptr, nameSizeBuf.ptr, null, null, null, null);
    if (result !== 0) break; // ERROR_NO_MORE_ITEMS = 259 or other error

    const nameLen = nameSizeBuf.readUInt32LE(0);
    const name = nameBuf.subarray(0, nameLen * 2).toString('utf16le');
    subkeys.push(name);
  }

  return subkeys;
}

// Enumerate all values under a key
function enumValues(hKey: bigint, maxValues: number = 100): Array<{ name: string; type: number; display: string }> {
  const values: Array<{ name: string; type: number; display: string }> = [];
  const nameBuf = Buffer.alloc(512);
  const dataBuf = Buffer.alloc(4096);

  for (let i = 0; i < maxValues; i++) {
    const nameSizeBuf = Buffer.alloc(4);
    nameSizeBuf.writeUInt32LE(256, 0);
    const typeBuf = Buffer.alloc(4);
    const dataSizeBuf = Buffer.alloc(4);
    dataSizeBuf.writeUInt32LE(4096, 0);

    const result = Advapi32.RegEnumValueW(hKey, i, nameBuf.ptr, nameSizeBuf.ptr, null, typeBuf.ptr, dataBuf.ptr, dataSizeBuf.ptr);
    if (result !== 0) break;

    const nameLen = nameSizeBuf.readUInt32LE(0);
    const name = nameBuf.subarray(0, nameLen * 2).toString('utf16le') || '(Default)';
    const type = typeBuf.readUInt32LE(0);
    const dataSize = dataSizeBuf.readUInt32LE(0);

    let display = '';
    switch (type) {
      case RegType.REG_SZ:
      case RegType.REG_EXPAND_SZ:
        display = dataSize > 2 ? dataBuf.subarray(0, dataSize - 2).toString('utf16le') : '';
        break;
      case RegType.REG_DWORD:
        display = String(dataBuf.readUInt32LE(0));
        break;
      case RegType.REG_QWORD:
        display = String(dataBuf.readBigUInt64LE(0));
        break;
      case RegType.REG_BINARY: {
        const bytes = dataBuf.subarray(0, Math.min(dataSize, 16));
        display = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join(' ');
        if (dataSize > 16) display += ` ... (${dataSize} bytes)`;
        break;
      }
      case RegType.REG_MULTI_SZ: {
        const raw = dataBuf.subarray(0, dataSize).toString('utf16le');
        display = raw.split('\0').filter((s) => s.length > 0).join('; ');
        break;
      }
      default:
        display = `(${dataSize} bytes)`;
        break;
    }

    values.push({ name, type, display });
  }

  return values;
}

const divider = '-'.repeat(90);

console.log('WINDOWS REGISTRY EXPLORER');
console.log(`Generated: ${new Date().toLocaleString()}`);
console.log('');

// Key 1: Windows version info
console.log('1. OPERATING SYSTEM INFORMATION');
console.log(`   Key: HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion`);
console.log(divider);

const osKey = openKey(HKEY_LOCAL_MACHINE, 'SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion');
if (!osKey) {
  console.log('   Failed to open key (access denied or key not found)');
} else {
  const productName = readStringValue(osKey, 'ProductName');
  const displayVersion = readStringValue(osKey, 'DisplayVersion');
  const currentBuild = readStringValue(osKey, 'CurrentBuild');
  const editionId = readStringValue(osKey, 'EditionID');
  const installationType = readStringValue(osKey, 'InstallationType');
  const registeredOwner = readStringValue(osKey, 'RegisteredOwner');
  const buildLabEx = readStringValue(osKey, 'BuildLabEx');
  const ubr = readDwordValue(osKey, 'UBR');
  const installDate = readDwordValue(osKey, 'InstallDate');

  console.log(`   Product Name:       ${productName || '(not found)'}`);
  console.log(`   Display Version:    ${displayVersion || '(not found)'}`);
  console.log(`   Current Build:      ${currentBuild || '(not found)'}${ubr !== null ? `.${ubr}` : ''}`);
  console.log(`   Edition ID:         ${editionId || '(not found)'}`);
  console.log(`   Installation Type:  ${installationType || '(not found)'}`);
  console.log(`   Registered Owner:   ${registeredOwner || '(not found)'}`);
  console.log(`   Build Lab:          ${buildLabEx || '(not found)'}`);
  if (installDate !== null) {
    const date = new Date(installDate * 1000);
    console.log(`   Install Date:       ${date.toLocaleString()} (epoch: ${installDate})`);
  }

  // Enumerate subkeys
  const subkeys = enumSubKeys(osKey);
  if (subkeys.length > 0) {
    console.log(`   Subkeys (${subkeys.length}):`);
    for (const sk of subkeys.slice(0, 15)) {
      console.log(`     ${sk}`);
    }
    if (subkeys.length > 15) {
      console.log(`     ... and ${subkeys.length - 15} more`);
    }
  }

  Advapi32.RegCloseKey(osKey);
}

console.log('');

// Key 2: CPU information
console.log('2. PROCESSOR INFORMATION');
console.log(`   Key: HKLM\\HARDWARE\\DESCRIPTION\\System\\CentralProcessor\\0`);
console.log(divider);

const cpuKey = openKey(HKEY_LOCAL_MACHINE, 'HARDWARE\\DESCRIPTION\\System\\CentralProcessor\\0');
if (!cpuKey) {
  console.log('   Failed to open key');
} else {
  const cpuName = readStringValue(cpuKey, 'ProcessorNameString');
  const identifier = readStringValue(cpuKey, 'Identifier');
  const vendorId = readStringValue(cpuKey, 'VendorIdentifier');
  const mhz = readDwordValue(cpuKey, '~MHz');

  console.log(`   Processor Name:     ${cpuName || '(not found)'}`);
  console.log(`   Identifier:         ${identifier || '(not found)'}`);
  console.log(`   Vendor:             ${vendorId || '(not found)'}`);
  if (mhz !== null) {
    console.log(`   Clock Speed:        ${mhz} MHz (${(mhz / 1000).toFixed(2)} GHz)`);
  }

  // Show all values in this key
  const allValues = enumValues(cpuKey);
  if (allValues.length > 0) {
    console.log(`   All values (${allValues.length}):`);
    console.log('   ' + 'Name'.padEnd(30) + 'Type'.padEnd(18) + 'Data');
    console.log('   ' + '-'.repeat(80));
    for (const v of allValues) {
      const displayData = v.display.length > 40 ? v.display.substring(0, 37) + '...' : v.display;
      console.log('   ' + v.name.padEnd(30) + regTypeName(v.type).padEnd(18) + displayData);
    }
  }

  Advapi32.RegCloseKey(cpuKey);
}

console.log('');

// Key 3: Explorer settings
console.log('3. EXPLORER SETTINGS');
console.log(`   Key: HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer`);
console.log(divider);

const explorerKey = openKey(HKEY_CURRENT_USER, 'SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer');
if (!explorerKey) {
  console.log('   Failed to open key');
} else {
  // Enumerate values in this key
  const allValues = enumValues(explorerKey, 30);
  if (allValues.length > 0) {
    console.log(`   Values (${allValues.length}):`);
    console.log('   ' + 'Name'.padEnd(35) + 'Type'.padEnd(18) + 'Data');
    console.log('   ' + '-'.repeat(80));
    for (const v of allValues) {
      const displayData = v.display.length > 35 ? v.display.substring(0, 32) + '...' : v.display;
      console.log('   ' + v.name.padEnd(35) + regTypeName(v.type).padEnd(18) + displayData);
    }
  }

  // Enumerate subkeys
  const subkeys = enumSubKeys(explorerKey);
  if (subkeys.length > 0) {
    console.log('');
    console.log(`   Subkeys (${subkeys.length}):`);
    for (const sk of subkeys.slice(0, 20)) {
      console.log(`     ${sk}`);
    }
    if (subkeys.length > 20) {
      console.log(`     ... and ${subkeys.length - 20} more`);
    }
  }

  Advapi32.RegCloseKey(explorerKey);
}

console.log('');

// Key 4: Read a few more interesting values across the registry
console.log('4. ADDITIONAL SYSTEM DETAILS');
console.log(divider);

// Computer name from registry
const computerNameKey = openKey(HKEY_LOCAL_MACHINE, 'SYSTEM\\CurrentControlSet\\Control\\ComputerName\\ComputerName');
if (computerNameKey) {
  const computerName = readStringValue(computerNameKey, 'ComputerName');
  console.log(`   Computer Name:      ${computerName || '(not found)'}`);
  Advapi32.RegCloseKey(computerNameKey);
}

// Time zone
const tzKey = openKey(HKEY_LOCAL_MACHINE, 'SYSTEM\\CurrentControlSet\\Control\\TimeZoneInformation');
if (tzKey) {
  const tzName = readStringValue(tzKey, 'TimeZoneKeyName');
  const bias = readDwordValue(tzKey, 'ActiveTimeBias');
  console.log(`   Time Zone:          ${tzName || '(not found)'}`);
  if (bias !== null) {
    const hours = Math.floor(Math.abs(bias) / 60);
    const mins = Math.abs(bias) % 60;
    const sign = bias <= 0 ? '+' : '-';
    console.log(`   UTC Offset:         ${sign}${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`);
  }
  Advapi32.RegCloseKey(tzKey);
}

// Environment variables from registry
const envKey = openKey(HKEY_LOCAL_MACHINE, 'SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Environment');
if (envKey) {
  const numProcs = readStringValue(envKey, 'NUMBER_OF_PROCESSORS');
  const procArch = readStringValue(envKey, 'PROCESSOR_ARCHITECTURE');
  const procId = readStringValue(envKey, 'PROCESSOR_IDENTIFIER');
  console.log(`   Processor Count:    ${numProcs || '(not found)'}`);
  console.log(`   Processor Arch:     ${procArch || '(not found)'}`);
  console.log(`   Processor ID:       ${procId || '(not found)'}`);
  Advapi32.RegCloseKey(envKey);
}

console.log('');
console.log(divider);
console.log('Registry exploration complete.');
