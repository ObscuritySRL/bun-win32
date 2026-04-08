import BluetoothApis from '../index';

// Enumerate Bluetooth radios
// BLUETOOTH_FIND_RADIO_PARAMS: { dwSize: DWORD }
const params = Buffer.alloc(4);
params.writeUInt32LE(4, 0);

const hRadioOut = Buffer.alloc(8);
const hFind = BluetoothApis.BluetoothFindFirstRadio(params.ptr, hRadioOut.ptr);

if (hFind === 0n) {
  console.log('No Bluetooth radios found (or Bluetooth is disabled).');
  process.exit(0);
}

const radios: bigint[] = [];
radios.push(hRadioOut.readBigUInt64LE(0));

while (BluetoothApis.BluetoothFindNextRadio(hFind, hRadioOut.ptr)) {
  radios.push(hRadioOut.readBigUInt64LE(0));
}
BluetoothApis.BluetoothFindRadioClose(hFind);

console.log(`Found ${radios.length} Bluetooth radio(s):\n`);

for (const hRadio of radios) {
  // BLUETOOTH_RADIO_INFO: dwSize (4) + padding (4) + address (8) + szName (248*2) + ulClassofDevice (4) + ...
  const radioInfo = Buffer.alloc(520);
  radioInfo.writeUInt32LE(520, 0); // dwSize

  const err = BluetoothApis.BluetoothGetRadioInfo(hRadio, radioInfo.ptr);
  if (err === 0) {
    // Address is at offset 8, 6 bytes
    const addr = radioInfo.subarray(8, 14);
    const addrStr = [...addr]
      .reverse()
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(':');

    // Name is at offset 16 (after dwSize + padding + address), UTF-16LE, up to 248 chars
    const name = radioInfo
      .subarray(16, 16 + 248 * 2)
      .toString('utf16le')
      .replace(/\0.*$/, '');

    console.log(`  Radio: ${name}`);
    console.log(`  Address: ${addrStr}`);
  } else {
    console.log(`  BluetoothGetRadioInfo failed with error ${err}`);
  }

  // Check radio state
  const discoverable = BluetoothApis.BluetoothIsDiscoverable(hRadio);
  const connectable = BluetoothApis.BluetoothIsConnectable(hRadio);
  console.log(`  Discoverable: ${discoverable !== 0}`);
  console.log(`  Connectable: ${connectable !== 0}`);

  // Check Bluetooth version
  const v21 = BluetoothApis.BluetoothIsVersionAvailable(2, 1);
  console.log(`  Bluetooth 2.1+: ${v21 !== 0}`);
  console.log();

  // Note: hRadio should be closed with Kernel32.CloseHandle(hRadio) when done
}
