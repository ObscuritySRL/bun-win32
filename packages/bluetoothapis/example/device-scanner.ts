/**
 * Bluetooth device discovery with radar-style visualization.
 *
 * Enumerates Bluetooth radios, retrieves radio info, then searches for
 * paired/remembered devices. Presents results as a "Bluetooth Radar Scan"
 * with animated-style formatting showing device class icons.
 *
 * APIs demonstrated:
 *   - BluetoothFindFirstRadio / BluetoothFindNextRadio / BluetoothFindRadioClose
 *   - BluetoothGetRadioInfo (BLUETOOTH_RADIO_INFO)
 *   - BluetoothFindFirstDevice / BluetoothFindNextDevice / BluetoothFindDeviceClose
 *   - BluetoothIsDiscoverable / BluetoothIsConnectable
 *
 * Struct layouts:
 *   BLUETOOTH_FIND_RADIO_PARAMS (4 bytes):
 *     +0x00: dwSize (DWORD)
 *
 *   BLUETOOTH_RADIO_INFO (520 bytes):
 *     +0x00: dwSize (DWORD + 4 pad)
 *     +0x08: address (BLUETOOTH_ADDRESS, 8 bytes; first 6 are the MAC)
 *     +0x10: szName (WCHAR[248] = 496 bytes)
 *     +0x200: ulClassofDevice (DWORD)
 *     +0x204: lmpSubversion (USHORT)
 *     +0x206: manufacturer (USHORT)
 *
 *   BLUETOOTH_DEVICE_SEARCH_PARAMS (40 bytes on x64):
 *     +0x00: dwSize (DWORD + 4 pad)
 *     +0x08: fReturnAuthenticated (BOOL)
 *     +0x0C: fReturnRemembered (BOOL)
 *     +0x10: fReturnUnknown (BOOL)
 *     +0x14: fReturnConnected (BOOL)
 *     +0x18: fIssueInquiry (BOOL)
 *     +0x1C: cTimeoutMultiplier (UCHAR + 3 pad)
 *     +0x20: hRadio (HANDLE, 8 bytes)
 *
 *   BLUETOOTH_DEVICE_INFO (560 bytes):
 *     +0x00: dwSize (DWORD + 4 pad)
 *     +0x08: Address (BLUETOOTH_ADDRESS, 8 bytes)
 *     +0x10: ulClassofDevice (DWORD)
 *     +0x14: fConnected (BOOL)
 *     +0x18: fRemembered (BOOL)
 *     +0x1C: fAuthenticated (BOOL)
 *     +0x20: stLastSeen (SYSTEMTIME, 16 bytes)
 *     +0x30: stLastUsed (SYSTEMTIME, 16 bytes)
 *     +0x40: szName (WCHAR[248] = 496 bytes)
 *
 * Run: bun run example/device-scanner.ts
 */

import BluetoothApis from '../index';

const majorDeviceClasses = new Map<number, [string, string]>([
  [0, ['Miscellaneous', '\uD83D\uDD35']],
  [1, ['Computer', '\uD83D\uDCBB']],
  [2, ['Phone', '\uD83D\uDCF1']],
  [3, ['LAN/Network', '\uD83C\uDF10']],
  [4, ['Audio/Video', '\uD83C\uDFA7']],
  [5, ['Peripheral', '\uD83D\uDDB1\uFE0F']],
  [6, ['Imaging', '\uD83D\uDDA8\uFE0F']],
  [7, ['Wearable', '\u231A']],
  [8, ['Toy', '\uD83E\uDDF8']],
  [9, ['Health', '\u2764\uFE0F']],
  [31, ['Uncategorized', '\u2753']],
]);

function formatAddress(buf: Buffer, offset: number): string {
  return Array.from(buf.subarray(offset, offset + 6))
    .reverse()
    .map((b) => b.toString(16).padStart(2, '0'))
    .join(':');
}

function readDeviceName(buf: Buffer, offset: number): string {
  return buf.toString('utf16le', offset, offset + 248 * 2).replace(/\0.*$/, '');
}

function getMajorDeviceClass(classOfDevice: number): [string, string] {
  const majorClass = (classOfDevice >> 8) & 0x1f;
  return majorDeviceClasses.get(majorClass) ?? ['Unknown', '\u2753'];
}

console.log('\n\x1b[1;35m  Bluetooth Radar Scan\x1b[0m\n');

// Step 1: Find radios
const findRadioParams = Buffer.alloc(4);
findRadioParams.writeUInt32LE(4, 0);
const hRadioOut = Buffer.alloc(8);

const hFind = BluetoothApis.BluetoothFindFirstRadio(findRadioParams.ptr, hRadioOut.ptr);

if (hFind === 0n) {
  console.log('  \x1b[33mNo Bluetooth adapter found.\x1b[0m');
  console.log();
  console.log('  \x1b[2mPossible reasons:');
  console.log('    - No Bluetooth hardware installed');
  console.log('    - Bluetooth adapter is disabled');
  console.log('    - Bluetooth service is not running\x1b[0m');
  process.exit(0);
}

const radios: bigint[] = [];
radios.push(hRadioOut.readBigUInt64LE(0));

while (BluetoothApis.BluetoothFindNextRadio(hFind, hRadioOut.ptr)) {
  radios.push(hRadioOut.readBigUInt64LE(0));
}
BluetoothApis.BluetoothFindRadioClose(hFind);

console.log(`  \x1b[2mScanning... found ${radios.length} radio(s)\x1b[0m\n`);

for (let ri = 0; ri < radios.length; ri++) {
  const hRadio = radios[ri];

  // Get radio info
  const radioInfoBuf = Buffer.alloc(520);
  radioInfoBuf.writeUInt32LE(520, 0);

  const radioErr = BluetoothApis.BluetoothGetRadioInfo(hRadio, radioInfoBuf.ptr);

  if (radioErr !== 0) {
    console.log(`  \x1b[31mRadio ${ri + 1}: Failed to read info (error ${radioErr})\x1b[0m`);
    continue;
  }

  const radioAddr = formatAddress(radioInfoBuf, 8);
  const radioName = readDeviceName(radioInfoBuf, 16);
  const discoverable = BluetoothApis.BluetoothIsDiscoverable(hRadio) !== 0;
  const connectable = BluetoothApis.BluetoothIsConnectable(hRadio) !== 0;

  console.log(`  \x1b[1;36m\uD83D\uDCE1 Radio: ${radioName}\x1b[0m (${radioAddr})`);
  console.log(`     ${discoverable ? '\x1b[32m\u25CF Discoverable\x1b[0m' : '\x1b[31m\u25CB Not discoverable\x1b[0m'}  ${connectable ? '\x1b[32m\u25CF Connectable\x1b[0m' : '\x1b[31m\u25CB Not connectable\x1b[0m'}`);
  console.log();

  // Step 2: Find paired/remembered devices
  const searchParams = Buffer.alloc(40);
  searchParams.writeUInt32LE(40, 0);        // dwSize
  searchParams.writeInt32LE(1, 8);           // fReturnAuthenticated
  searchParams.writeInt32LE(1, 12);          // fReturnRemembered
  searchParams.writeInt32LE(1, 16);          // fReturnUnknown
  searchParams.writeInt32LE(1, 20);          // fReturnConnected
  searchParams.writeInt32LE(0, 24);          // fIssueInquiry (skip live scan for speed)
  searchParams.writeUInt8(0, 28);            // cTimeoutMultiplier
  searchParams.writeBigUInt64LE(hRadio, 32); // hRadio

  const deviceInfoBuf = Buffer.alloc(560);
  deviceInfoBuf.writeUInt32LE(560, 0);

  const hDevFind = BluetoothApis.BluetoothFindFirstDevice(searchParams.ptr, deviceInfoBuf.ptr);

  if (hDevFind === 0n) {
    console.log('     \x1b[2mNo paired or remembered devices found.\x1b[0m\n');
    continue;
  }

  let deviceCount = 0;

  do {
    const devAddr = formatAddress(deviceInfoBuf, 8);
    const devClass = deviceInfoBuf.readUInt32LE(16);
    const connected = deviceInfoBuf.readInt32LE(20) !== 0;
    const remembered = deviceInfoBuf.readInt32LE(24) !== 0;
    const authenticated = deviceInfoBuf.readInt32LE(28) !== 0;
    const devName = readDeviceName(deviceInfoBuf, 64);
    const [className, icon] = getMajorDeviceClass(devClass);

    const statusParts: string[] = [];
    if (connected) statusParts.push('\x1b[32mconnected\x1b[0m');
    if (remembered) statusParts.push('remembered');
    if (authenticated) statusParts.push('authenticated');

    console.log(`     ${icon} \x1b[1m${devName || '(unnamed)'}\x1b[0m`);
    console.log(`        Address: ${devAddr}`);
    console.log(`        Class:   ${className} (0x${devClass.toString(16)})`);
    console.log(`        Status:  ${statusParts.join(', ') || 'none'}`);
    console.log();

    deviceCount++;
    deviceInfoBuf.writeUInt32LE(560, 0);
  } while (BluetoothApis.BluetoothFindNextDevice(hDevFind, deviceInfoBuf.ptr));

  BluetoothApis.BluetoothFindDeviceClose(hDevFind);

  console.log(`     \x1b[2m${deviceCount} device(s) found for this radio.\x1b[0m\n`);
}

console.log('  Scan complete.');
