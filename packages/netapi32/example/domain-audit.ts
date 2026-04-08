/**
 * Full domain/workstation audit.
 *
 * Queries workstation info, enumerates local users, local groups, and network
 * shares. Decodes share types and presents all data in a structured report.
 *
 * APIs demonstrated:
 *   - NetWkstaGetInfo (workstation name, domain, OS version)
 *   - NetUserEnum (local user accounts)
 *   - NetLocalGroupEnum (local security groups)
 *   - NetShareEnum (shared resources with paths and types)
 *   - NetApiBufferFree (release each result buffer)
 *
 * Struct layouts (x64):
 *   WKSTA_INFO_100 (40 bytes):
 *     +0x00: wki100_platform_id (DWORD + 4 pad)
 *     +0x08: wki100_computername (LPWSTR)
 *     +0x10: wki100_langroup (LPWSTR)
 *     +0x18: wki100_ver_major (DWORD)
 *     +0x1C: wki100_ver_minor (DWORD)
 *
 *   USER_INFO_0 (8 bytes):
 *     +0x00: usri0_name (LPWSTR)
 *
 *   LOCALGROUP_INFO_0 (8 bytes):
 *     +0x00: lgrpi0_name (LPWSTR)
 *
 *   SHARE_INFO_2 (64 bytes on x64):
 *     +0x00: shi2_netname (LPWSTR)
 *     +0x08: shi2_type (DWORD + 4 pad)
 *     +0x10: shi2_remark (LPWSTR)
 *     +0x18: shi2_permissions (DWORD + 4 pad)
 *     +0x20: shi2_max_uses (DWORD)
 *     +0x24: shi2_current_uses (DWORD)
 *     +0x28: shi2_path (LPWSTR)
 *     +0x30: shi2_passwd (LPWSTR)
 *
 * Run: bun run example/domain-audit.ts
 */

import { type Pointer, read, toArrayBuffer } from 'bun:ffi';

import Netapi32, { MAX_PREFERRED_LENGTH } from '../index';

const STYPE_DISKTREE = 0x00000000;
const STYPE_PRINTQ = 0x00000001;
const STYPE_DEVICE = 0x00000002;
const STYPE_IPC = 0x00000003;
const STYPE_MASK = 0x000000ff;
const STYPE_SPECIAL = 0x80000000;

function readWideStringFromPtr(ptr: Pointer): string {
  const strBuf = Buffer.from(toArrayBuffer(ptr, 0, 512));
  return strBuf.toString('utf16le').replace(/\0.*$/, '');
}

function readPtrAt(buf: Buffer, offset: number): Pointer | null {
  const val = Number(buf.readBigUInt64LE(offset));
  return val !== 0 ? (val as Pointer) : null;
}

function decodeShareType(typeVal: number): string {
  const baseType = typeVal & STYPE_MASK;
  const isSpecial = (typeVal & STYPE_SPECIAL) !== 0;

  let typeName: string;
  switch (baseType) {
    case STYPE_DISKTREE:
      typeName = 'Disk';
      break;
    case STYPE_PRINTQ:
      typeName = 'Print Queue';
      break;
    case STYPE_DEVICE:
      typeName = 'Device';
      break;
    case STYPE_IPC:
      typeName = 'IPC';
      break;
    default:
      typeName = `Unknown (${baseType})`;
  }

  if (isSpecial) typeName += ' (Administrative/Hidden)';
  return typeName;
}

console.log('=== Domain/Workstation Audit ===');
console.log(`Timestamp: ${new Date().toISOString()}\n`);

// --- Section 1: Workstation Info ---
console.log('--- Workstation Info ---');
{
  const bufPtrBuf = Buffer.alloc(8);
  const status = Netapi32.NetWkstaGetInfo(null, 100, bufPtrBuf.ptr);

  if (status === 0) {
    const bufPtr = read.ptr(bufPtrBuf.ptr) as Pointer;

    if (bufPtr) {
      try {
        const wkstaBuf = Buffer.from(toArrayBuffer(bufPtr, 0, 40));
        const platformId = wkstaBuf.readUInt32LE(0);
        const namePtr = readPtrAt(wkstaBuf, 8);
        const domainPtr = readPtrAt(wkstaBuf, 16);
        const verMajor = wkstaBuf.readUInt32LE(24);
        const verMinor = wkstaBuf.readUInt32LE(28);

        const computerName = namePtr ? readWideStringFromPtr(namePtr) : '(unknown)';
        const domainName = domainPtr ? readWideStringFromPtr(domainPtr) : '(none)';

        console.log(`  Computer name:  ${computerName}`);
        console.log(`  Domain/Group:   ${domainName}`);
        console.log(`  Platform ID:    ${platformId}`);
        console.log(`  OS version:     ${verMajor}.${verMinor}`);
      } finally {
        Netapi32.NetApiBufferFree(bufPtr);
      }
    }
  } else {
    console.log(`  NetWkstaGetInfo failed (error ${status}).`);
  }
}

// --- Section 2: Local Users ---
console.log('\n--- Local User Accounts ---');
{
  const bufPtrBuf = Buffer.alloc(8);
  const entriesReadBuf = Buffer.alloc(4);
  const totalEntriesBuf = Buffer.alloc(4);

  const status = Netapi32.NetUserEnum(null, 0, 0, bufPtrBuf.ptr, MAX_PREFERRED_LENGTH, entriesReadBuf.ptr, totalEntriesBuf.ptr, null);

  if (status === 0 || status === 234) {
    const bufPtr = read.ptr(bufPtrBuf.ptr) as Pointer;
    const entriesRead = entriesReadBuf.readUInt32LE(0);
    const totalEntries = totalEntriesBuf.readUInt32LE(0);

    console.log(`  Total accounts: ${totalEntries} (read: ${entriesRead})`);

    if (bufPtr && entriesRead > 0) {
      try {
        for (let i = 0; i < entriesRead; i++) {
          // USER_INFO_0 is just a pointer (8 bytes)
          const entryPtr = (Number(bufPtr) + i * 8) as Pointer;
          const entryBuf = Buffer.from(toArrayBuffer(entryPtr, 0, 8));
          const namePtr = readPtrAt(entryBuf, 0);
          const userName = namePtr ? readWideStringFromPtr(namePtr) : '(unknown)';
          console.log(`    ${i + 1}. ${userName}`);
        }
      } finally {
        Netapi32.NetApiBufferFree(bufPtr);
      }
    }
  } else {
    console.log(`  NetUserEnum failed (error ${status}).`);
    if (status === 5) console.log('  Access denied. Try running as administrator.');
  }
}

// --- Section 3: Local Groups ---
console.log('\n--- Local Groups ---');
{
  const bufPtrBuf = Buffer.alloc(8);
  const entriesReadBuf = Buffer.alloc(4);
  const totalEntriesBuf = Buffer.alloc(4);

  const status = Netapi32.NetLocalGroupEnum(null, 0, bufPtrBuf.ptr, MAX_PREFERRED_LENGTH, entriesReadBuf.ptr, totalEntriesBuf.ptr, null);

  if (status === 0 || status === 234) {
    const bufPtr = read.ptr(bufPtrBuf.ptr) as Pointer;
    const entriesRead = entriesReadBuf.readUInt32LE(0);
    const totalEntries = totalEntriesBuf.readUInt32LE(0);

    console.log(`  Total groups: ${totalEntries} (read: ${entriesRead})`);

    if (bufPtr && entriesRead > 0) {
      try {
        for (let i = 0; i < entriesRead; i++) {
          // LOCALGROUP_INFO_0 is just a pointer (8 bytes)
          const entryPtr = (Number(bufPtr) + i * 8) as Pointer;
          const entryBuf = Buffer.from(toArrayBuffer(entryPtr, 0, 8));
          const namePtr = readPtrAt(entryBuf, 0);
          const groupName = namePtr ? readWideStringFromPtr(namePtr) : '(unknown)';
          console.log(`    ${i + 1}. ${groupName}`);
        }
      } finally {
        Netapi32.NetApiBufferFree(bufPtr);
      }
    }
  } else {
    console.log(`  NetLocalGroupEnum failed (error ${status}).`);
    if (status === 5) console.log('  Access denied. Try running as administrator.');
  }
}

// --- Section 4: Network Shares ---
console.log('\n--- Network Shares ---');
{
  const bufPtrBuf = Buffer.alloc(8);
  const entriesReadBuf = Buffer.alloc(4);
  const totalEntriesBuf = Buffer.alloc(4);

  const status = Netapi32.NetShareEnum(null, 2, bufPtrBuf.ptr, MAX_PREFERRED_LENGTH, entriesReadBuf.ptr, totalEntriesBuf.ptr, null);

  if (status === 0 || status === 234) {
    const bufPtr = read.ptr(bufPtrBuf.ptr) as Pointer;
    const entriesRead = entriesReadBuf.readUInt32LE(0);
    const totalEntries = totalEntriesBuf.readUInt32LE(0);

    console.log(`  Total shares: ${totalEntries} (read: ${entriesRead})`);

    if (bufPtr && entriesRead > 0) {
      try {
        const SHARE_INFO_2_SIZE = 56; // 7 fields * 8 bytes each on x64

        for (let i = 0; i < entriesRead; i++) {
          const entryPtr = (Number(bufPtr) + i * SHARE_INFO_2_SIZE) as Pointer;
          const entryBuf = Buffer.from(toArrayBuffer(entryPtr, 0, SHARE_INFO_2_SIZE));

          const namePtr = readPtrAt(entryBuf, 0);
          const shareType = entryBuf.readUInt32LE(8);
          const remarkPtr = readPtrAt(entryBuf, 16);
          const permissions = entryBuf.readUInt32LE(24);
          const maxUses = entryBuf.readUInt32LE(32);
          const currentUses = entryBuf.readUInt32LE(36);
          const pathPtr = readPtrAt(entryBuf, 40);

          const shareName = namePtr ? readWideStringFromPtr(namePtr) : '(unknown)';
          const remark = remarkPtr ? readWideStringFromPtr(remarkPtr) : '';
          const path = pathPtr ? readWideStringFromPtr(pathPtr) : '(none)';

          console.log(`\n    ${i + 1}. ${shareName}`);
          console.log(`       Type:         ${decodeShareType(shareType)}`);
          console.log(`       Path:         ${path}`);
          console.log(`       Remark:       ${remark || '(none)'}`);
          console.log(`       Permissions:  0x${permissions.toString(16)}`);
          console.log(`       Max uses:     ${maxUses === 0xffffffff ? 'unlimited' : maxUses}`);
          console.log(`       Current uses: ${currentUses}`);
        }
      } finally {
        Netapi32.NetApiBufferFree(bufPtr);
      }
    }
  } else {
    console.log(`  NetShareEnum failed (error ${status}).`);
    if (status === 5) console.log('  Access denied. Try running as administrator.');
  }
}

console.log('\nAudit complete.');
