/**
 * Full Bluetooth radio and device audit.
 *
 * Enumerates every Bluetooth radio on the system, retrieves detailed radio
 * info (name, address, class of device, LMP subversion, manufacturer), and
 * queries discoverable/connectable state. For each radio, enumerates all
 * paired, remembered, connected, and unknown devices, showing name, address,
 * major device class, connection/authentication state, and last-seen/last-used
 * timestamps parsed from SYSTEMTIME.
 *
 * APIs demonstrated:
 *   - BluetoothFindFirstRadio / BluetoothFindNextRadio / BluetoothFindRadioClose
 *   - BluetoothGetRadioInfo (BLUETOOTH_RADIO_INFO, 520 bytes)
 *   - BluetoothIsDiscoverable / BluetoothIsConnectable
 *   - BluetoothFindFirstDevice / BluetoothFindNextDevice / BluetoothFindDeviceClose
 *   - BLUETOOTH_DEVICE_SEARCH_PARAMS (40 bytes x64)
 *   - BLUETOOTH_DEVICE_INFO (560 bytes) with SYSTEMTIME parsing
 *
 * Struct layouts:
 *   BLUETOOTH_FIND_RADIO_PARAMS (4 bytes):
 *     +0x00  dwSize (DWORD)
 *
 *   BLUETOOTH_RADIO_INFO (520 bytes):
 *     +0x00  dwSize (DWORD + 4 pad)
 *     +0x08  address (BLUETOOTH_ADDRESS, 8 bytes; first 6 = MAC)
 *     +0x10  szName (WCHAR[248] = 496 bytes)
 *     +0x200 ulClassofDevice (DWORD)
 *     +0x204 lmpSubversion (USHORT)
 *     +0x206 manufacturer (USHORT)
 *
 *   BLUETOOTH_DEVICE_SEARCH_PARAMS (40 bytes on x64):
 *     +0x00  dwSize (DWORD + 4 pad)
 *     +0x08  fReturnAuthenticated (BOOL)
 *     +0x0C  fReturnRemembered (BOOL)
 *     +0x10  fReturnUnknown (BOOL)
 *     +0x14  fReturnConnected (BOOL)
 *     +0x18  fIssueInquiry (BOOL)
 *     +0x1C  cTimeoutMultiplier (UCHAR + 3 pad)
 *     +0x20  hRadio (HANDLE, 8 bytes)
 *
 *   BLUETOOTH_DEVICE_INFO (560 bytes):
 *     +0x00  dwSize (DWORD + 4 pad)
 *     +0x08  Address (BLUETOOTH_ADDRESS, 8 bytes)
 *     +0x10  ulClassofDevice (DWORD)
 *     +0x14  fConnected (BOOL)
 *     +0x18  fRemembered (BOOL)
 *     +0x1C  fAuthenticated (BOOL)
 *     +0x20  stLastSeen (SYSTEMTIME, 16 bytes)
 *     +0x30  stLastUsed (SYSTEMTIME, 16 bytes)
 *     +0x40  szName (WCHAR[248] = 496 bytes)
 *
 * Run: bun run example/radio-inspector.ts
 */

import BluetoothApis from '../index';

const MAJOR_CLASSES: Record<number, string> = {
  0: 'Miscellaneous',
  1: 'Computer',
  2: 'Phone',
  3: 'LAN/Network Access Point',
  4: 'Audio/Video',
  5: 'Peripheral',
  6: 'Imaging',
  7: 'Wearable',
  8: 'Toy',
  9: 'Health',
  31: 'Uncategorized',
};

const MANUFACTURERS: Record<number, string> = {
  0: 'Ericsson',
  1: 'Nokia',
  2: 'Intel',
  3: 'IBM',
  4: 'Toshiba',
  5: 'Sagem',
  6: 'TI',
  9: 'Infineon',
  10: 'Cambridge Silicon Radio',
  13: 'Qualcomm',
  15: 'Broadcom',
  18: 'Marvell',
  29: 'Atheros',
  48: 'Apple',
  69: 'MediaTek',
  72: 'Realtek',
};

function formatAddress(buf: Buffer, offset: number): string {
  return Array.from(buf.subarray(offset, offset + 6))
    .reverse()
    .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
    .join(':');
}

function readWideName(buf: Buffer, offset: number, maxChars: number): string {
  return buf.toString('utf16le', offset, offset + maxChars * 2).replace(/\0.*$/, '');
}

function decodeMajorClass(classOfDevice: number): string {
  const major = (classOfDevice >> 8) & 0x1f;
  return MAJOR_CLASSES[major] ?? `Unknown (${major})`;
}

function readSystemTime(buf: Buffer, offset: number): string {
  const year = buf.readUInt16LE(offset);
  const month = buf.readUInt16LE(offset + 2);
  const day = buf.readUInt16LE(offset + 6);
  const hour = buf.readUInt16LE(offset + 8);
  const minute = buf.readUInt16LE(offset + 10);
  const second = buf.readUInt16LE(offset + 12);

  if (year === 0 && month === 0 && day === 0) return '(never)';

  return (
    `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} ` +
    `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`
  );
}

console.log();
console.log('=== Bluetooth Radio Inspector ===');
console.log();

const findRadioParams = Buffer.alloc(4);
findRadioParams.writeUInt32LE(4, 0);
const hRadioOut = Buffer.alloc(8);

const hFind = BluetoothApis.BluetoothFindFirstRadio(findRadioParams.ptr, hRadioOut.ptr);

if (hFind === 0n) {
  console.log('  No Bluetooth adapter detected.');
  console.log();
  console.log('  Possible reasons:');
  console.log('    - No Bluetooth hardware installed');
  console.log('    - Bluetooth adapter is disabled in Device Manager');
  console.log('    - Bluetooth Support Service is not running');
  console.log('      (run: sc query bthserv)');
  process.exit(0);
}

const radios: bigint[] = [];
radios.push(hRadioOut.readBigUInt64LE(0));

while (BluetoothApis.BluetoothFindNextRadio(hFind, hRadioOut.ptr)) {
  radios.push(hRadioOut.readBigUInt64LE(0));
}
BluetoothApis.BluetoothFindRadioClose(hFind);

console.log(`  Found ${radios.length} Bluetooth radio(s)`);
console.log();

let totalDevices = 0;

for (let ri = 0; ri < radios.length; ri++) {
  const hRadio = radios[ri];

  console.log(`--- Radio ${ri + 1} ---`);

  const radioInfo = Buffer.alloc(520);
  radioInfo.writeUInt32LE(520, 0);

  const err = BluetoothApis.BluetoothGetRadioInfo(hRadio, radioInfo.ptr);
  if (err !== 0) {
    console.log(`  Error reading radio info: 0x${(err >>> 0).toString(16)}`);
    console.log();
    continue;
  }

  const radioAddr = formatAddress(radioInfo, 8);
  const radioName = readWideName(radioInfo, 16, 248);
  const classOfDevice = radioInfo.readUInt32LE(0x200);
  const lmpSubversion = radioInfo.readUInt16LE(0x204);
  const manufacturerId = radioInfo.readUInt16LE(0x206);
  const manufacturerName = MANUFACTURERS[manufacturerId] ?? `ID ${manufacturerId}`;

  const discoverable = BluetoothApis.BluetoothIsDiscoverable(hRadio) !== 0;
  const connectable = BluetoothApis.BluetoothIsConnectable(hRadio) !== 0;

  console.log(`  Name:           ${radioName || '(unnamed)'}`);
  console.log(`  Address:        ${radioAddr}`);
  console.log(`  Class:          0x${classOfDevice.toString(16).padStart(6, '0')} (${decodeMajorClass(classOfDevice)})`);
  console.log(`  Manufacturer:   ${manufacturerName} (${manufacturerId})`);
  console.log(`  LMP Subver.:    ${lmpSubversion}`);
  console.log(`  Discoverable:   ${discoverable ? 'Yes' : 'No'}`);
  console.log(`  Connectable:    ${connectable ? 'Yes' : 'No'}`);
  console.log();

  // Enumerate devices for this radio
  const searchParams = Buffer.alloc(40);
  searchParams.writeUInt32LE(40, 0);        // dwSize
  searchParams.writeInt32LE(1, 8);           // fReturnAuthenticated
  searchParams.writeInt32LE(1, 12);          // fReturnRemembered
  searchParams.writeInt32LE(1, 16);          // fReturnUnknown
  searchParams.writeInt32LE(1, 20);          // fReturnConnected
  searchParams.writeInt32LE(0, 24);          // fIssueInquiry (skip live scan)
  searchParams.writeUInt8(0, 28);            // cTimeoutMultiplier
  searchParams.writeBigUInt64LE(hRadio, 32); // hRadio

  const deviceInfo = Buffer.alloc(560);
  deviceInfo.writeUInt32LE(560, 0);

  const hDevFind = BluetoothApis.BluetoothFindFirstDevice(searchParams.ptr, deviceInfo.ptr);

  if (hDevFind === 0n) {
    console.log('  Paired Devices: (none)');
    console.log();
    continue;
  }

  console.log('  Paired/Remembered Devices:');
  console.log();

  let deviceIndex = 0;

  do {
    deviceIndex++;
    totalDevices++;

    const devAddr = formatAddress(deviceInfo, 8);
    const devClass = deviceInfo.readUInt32LE(16);
    const connected = deviceInfo.readInt32LE(0x14) !== 0;
    const remembered = deviceInfo.readInt32LE(0x18) !== 0;
    const authenticated = deviceInfo.readInt32LE(0x1c) !== 0;
    const lastSeen = readSystemTime(deviceInfo, 0x20);
    const lastUsed = readSystemTime(deviceInfo, 0x30);
    const devName = readWideName(deviceInfo, 0x40, 248);

    const majorClassName = decodeMajorClass(devClass);

    const flags: string[] = [];
    if (connected) flags.push('Connected');
    if (remembered) flags.push('Remembered');
    if (authenticated) flags.push('Authenticated');

    console.log(`    Device ${deviceIndex}: ${devName || '(unnamed)'}`);
    console.log(`      Address:        ${devAddr}`);
    console.log(`      Class:          0x${devClass.toString(16).padStart(6, '0')} (${majorClassName})`);
    console.log(`      Status:         ${flags.length > 0 ? flags.join(', ') : '(none)'}`);
    console.log(`      Last Seen:      ${lastSeen}`);
    console.log(`      Last Used:      ${lastUsed}`);
    console.log();

    deviceInfo.writeUInt32LE(560, 0); // reset dwSize for next iteration
  } while (BluetoothApis.BluetoothFindNextDevice(hDevFind, deviceInfo.ptr));

  BluetoothApis.BluetoothFindDeviceClose(hDevFind);

  console.log(`  (${deviceIndex} device(s) for this radio)`);
  console.log();
}

console.log('--- Summary ---');
console.log(`  Radios:  ${radios.length}`);
console.log(`  Devices: ${totalDevices}`);
console.log();
