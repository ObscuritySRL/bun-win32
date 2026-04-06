import Iphlpapi from '../index';

// Get the number of network interfaces
const countBuf = Buffer.alloc(4);
const result = Iphlpapi.GetNumberOfInterfaces(countBuf.ptr);

if (result !== 0) {
  console.error('GetNumberOfInterfaces failed with error: %d', result);
  process.exit(1);
}

const interfaceCount = countBuf.readUInt32LE(0);
console.log(`Network interfaces: ${interfaceCount}`);

// Get adapter info using GetAdaptersInfo
// First call to get required buffer size
const sizeBuf = Buffer.alloc(4);
sizeBuf.writeUInt32LE(0, 0);

let err = Iphlpapi.GetAdaptersInfo(null, sizeBuf.ptr);

// ERROR_BUFFER_OVERFLOW = 111
if (err === 111) {
  const size = sizeBuf.readUInt32LE(0);
  const infoBuf = Buffer.alloc(size);
  sizeBuf.writeUInt32LE(size, 0);

  err = Iphlpapi.GetAdaptersInfo(infoBuf.ptr, sizeBuf.ptr);

  if (err === 0) {
    // IP_ADAPTER_INFO structure offsets (x64):
    // +0x008: ComboIndex (DWORD)
    // +0x00C: AdapterName (char[260])
    // +0x110: Description (char[132])
    // +0x194: AddressLength (UINT)
    // +0x198: Address (BYTE[8])
    // +0x1A0: Index (DWORD)

    let offset = 0;
    let adapterIndex = 0;

    while (offset < size) {
      const next = Number(infoBuf.readBigUInt64LE(offset));
      const name = infoBuf.toString('ascii', offset + 0x00c, offset + 0x00c + 260).replace(/\0.*/, '');
      const desc = infoBuf.toString('ascii', offset + 0x110, offset + 0x110 + 132).replace(/\0.*/, '');
      const addrLen = infoBuf.readUInt32LE(offset + 0x194);

      const macBytes: string[] = [];

      for (let i = 0; i < addrLen; i++) {
        macBytes.push(infoBuf.readUInt8(offset + 0x198 + i).toString(16).padStart(2, '0'));
      }

      console.log(`\nAdapter ${adapterIndex}:`);
      console.log(`  Name:    ${name}`);
      console.log(`  Desc:    ${desc}`);
      console.log(`  MAC:     ${macBytes.join(':')}`);

      adapterIndex++;

      if (next === 0) break;
      offset = next - Number(infoBuf.ptr);
    }
  } else {
    console.error('GetAdaptersInfo failed with error: %d', err);
  }
} else if (err !== 0) {
  console.error('GetAdaptersInfo sizing call failed with error: %d', err);
}
