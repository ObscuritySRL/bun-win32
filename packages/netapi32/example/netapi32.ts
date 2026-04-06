import { type Pointer, toArrayBuffer } from 'bun:ffi';

import Netapi32, { NERR_Success } from '../index';

// TODO: Replace toArrayBuffer + manual UTF-16LE decode with CString once Bun CString support is fixed.
function readWideString(addr: number, maxBytes = 512): string {
  const bytes = new Uint8Array(toArrayBuffer(addr as unknown as Pointer, 0, maxBytes));

  let end = bytes.length;

  for (let i = 0; i < bytes.length - 1; i += 2) {
    if (bytes[i] === 0 && bytes[i + 1] === 0) {
      end = i;
      break;
    }
  }

  return Buffer.from(bytes.buffer, bytes.byteOffset, end).toString('utf16le');
}

// Query workstation info (level 100)
const wkstaBuffer = Buffer.alloc(8);
const wkstaStatus = Netapi32.NetWkstaGetInfo(null, 100, wkstaBuffer.ptr);

if (wkstaStatus !== NERR_Success) {
  console.error(`NetWkstaGetInfo failed with status ${wkstaStatus}.`);
  process.exit(1);
}

const infoPtr = Number(new DataView(wkstaBuffer.buffer).getBigUint64(0, true));

if (infoPtr === 0) {
  console.error('NetWkstaGetInfo returned a null buffer.');
  process.exit(1);
}

// WKSTA_INFO_100 layout (x64):
//   0x00  DWORD  wki100_platform_id
//   0x08  LPWSTR wki100_computername
//   0x10  LPWSTR wki100_langroup
//   0x18  DWORD  wki100_ver_major
//   0x1c  DWORD  wki100_ver_minor
const info = new DataView(toArrayBuffer(infoPtr as unknown as Pointer, 0, 0x20));
const platformId = info.getUint32(0x00, true);
const computerNamePtr = Number(info.getBigUint64(0x08, true));
const lanGroupPtr = Number(info.getBigUint64(0x10, true));
const verMajor = info.getUint32(0x18, true);
const verMinor = info.getUint32(0x1c, true);

console.log('Workstation Info (level 100):');
console.log(`  Platform ID:    ${platformId}`);
console.log(`  Computer Name:  ${computerNamePtr ? readWideString(computerNamePtr) : '(null)'}`);
console.log(`  LAN Group:      ${lanGroupPtr ? readWideString(lanGroupPtr) : '(null)'}`);
console.log(`  Version:        ${verMajor}.${verMinor}`);

// Free the OS-allocated buffer (the pointer stored in wkstaBuffer, not wkstaBuffer itself)
Netapi32.NetApiBufferFree(infoPtr as unknown as Pointer);

// Enumerate local users (level 0)
const userBuffer = Buffer.alloc(8);
const entriesRead = Buffer.alloc(4);
const totalEntries = Buffer.alloc(4);
const resumeHandle = Buffer.alloc(4);

const userStatus = Netapi32.NetUserEnum(null, 0, 0, userBuffer.ptr, 0xffff_ffff, entriesRead.ptr, totalEntries.ptr, resumeHandle.ptr);

if (userStatus !== NERR_Success) {
  console.error(`\nNetUserEnum failed with status ${userStatus}.`);
  process.exit(1);
}

const count = entriesRead.readUInt32LE(0);
const total = totalEntries.readUInt32LE(0);

console.log(`\nLocal Users (${count} of ${total}):`);

const userBufPtr = Number(new DataView(userBuffer.buffer).getBigUint64(0, true));

if (userBufPtr !== 0) {
  for (let index = 0; index < Math.min(count, 10); index++) {
    // USER_INFO_0: single LPWSTR field (8 bytes on x64)
    const namePtr = Number(new DataView(toArrayBuffer((userBufPtr + index * 8) as unknown as Pointer, 0, 8)).getBigUint64(0, true));

    if (namePtr !== 0) {
      console.log(`  ${readWideString(namePtr)}`);
    }
  }

  // Free the OS-allocated user buffer
  Netapi32.NetApiBufferFree(userBufPtr as unknown as Pointer);
}
