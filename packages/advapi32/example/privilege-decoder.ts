/**
 * Privilege Decoder - Your process's security clearance badge.
 *
 * Retrieves the current user name with GetUserNameW. Opens the process token
 * with Kernel32.GetCurrentProcess + Advapi32.OpenProcessToken. Calls
 * GetTokenInformation with TokenPrivileges to enumerate all privileges held
 * by the current process token. For each privilege LUID, uses
 * LookupPrivilegeNameW to decode the human-readable name and checks the
 * attributes to determine if each privilege is enabled or disabled.
 * Presents the results as a "SECURITY CLEARANCE BADGE" with the user's
 * name and a full privilege roster.
 *
 * Demonstrates:
 * - GetUserNameW (current user)
 * - OpenProcessToken (access the process security token)
 * - GetTokenInformation with TokenPrivileges
 * - LookupPrivilegeNameW (LUID to privilege name)
 * - PrivilegeAttributes enum (SE_PRIVILEGE_ENABLED, etc.)
 * - Cross-package: Kernel32.GetCurrentProcess, Kernel32.CloseHandle
 *
 * Run: bun run example/privilege-decoder.ts
 */

import Advapi32, { TokenAccessRights, TokenInformationClass, PrivilegeAttributes } from '../index';
import Kernel32 from '@bun-win32/kernel32';

const encode = (str: string) => Buffer.from(`${str}\0`, 'utf16le');

// Read a wide string from a buffer
function readWideStringBuf(buf: Buffer, maxChars?: number): string {
  const limit = maxChars ? maxChars * 2 : buf.length;
  let end = 0;
  while (end < limit - 1 && end < buf.length - 1) {
    if (buf[end] === 0 && buf[end + 1] === 0) break;
    end += 2;
  }
  return buf.subarray(0, end).toString('utf16le');
}

console.log('');
console.log('  +======================================================+');
console.log('  |           SECURITY CLEARANCE BADGE                    |');
console.log('  |       Process Privilege Enumeration Report            |');
console.log('  +======================================================+');
console.log('');

// Step 1: Get the current user name
const userNameBuf = Buffer.alloc(512);
const userNameSizeBuf = Buffer.alloc(4);
userNameSizeBuf.writeUInt32LE(256, 0);

const userResult = Advapi32.GetUserNameW(userNameBuf.ptr, userNameSizeBuf.ptr);
const userName = userResult ? readWideStringBuf(userNameBuf) : '(unknown)';

console.log(`  Badge Holder:    ${userName}`);
console.log(`  Issued:          ${new Date().toLocaleString()}`);
console.log(`  Process ID:      ${process.pid}`);
console.log('');

// Step 2: Open the process token
const processHandle = Kernel32.GetCurrentProcess();
const tokenHandleBuf = Buffer.alloc(8);

const tokenAccess = TokenAccessRights.TOKEN_QUERY;
const openResult = Advapi32.OpenProcessToken(processHandle, tokenAccess, tokenHandleBuf.ptr);

if (!openResult) {
  console.log('  ACCESS DENIED: Could not open process token');
  console.log(`  GetLastError: ${Kernel32.GetLastError()}`);
  process.exit(1);
}

const tokenHandle = tokenHandleBuf.readBigUInt64LE(0);
console.log(`  Token Handle:    0x${tokenHandle.toString(16)}`);
console.log('');

// Step 3: Query token privileges
// First call to get the required buffer size
const returnLengthBuf = Buffer.alloc(4);
Advapi32.GetTokenInformation(tokenHandle, TokenInformationClass.TokenPrivileges, null as any, 0, returnLengthBuf.ptr);
const requiredSize = returnLengthBuf.readUInt32LE(0);

if (requiredSize === 0) {
  console.log('  Could not determine token information size');
  Kernel32.CloseHandle(tokenHandle);
  process.exit(1);
}

// Second call with properly sized buffer
const tokenInfoBuf = Buffer.alloc(requiredSize);
const infoResult = Advapi32.GetTokenInformation(tokenHandle, TokenInformationClass.TokenPrivileges, tokenInfoBuf.ptr, requiredSize, returnLengthBuf.ptr);

if (!infoResult) {
  console.log(`  Failed to get token information. GetLastError: ${Kernel32.GetLastError()}`);
  Kernel32.CloseHandle(tokenHandle);
  process.exit(1);
}

// TOKEN_PRIVILEGES structure:
// PrivilegeCount: DWORD (4 bytes)
// Privileges[]: array of LUID_AND_ATTRIBUTES
//   Each LUID_AND_ATTRIBUTES:
//     Luid: LUID (8 bytes: LowPart u32 + HighPart i32)
//     Attributes: DWORD (4 bytes)
//   Total per entry: 12 bytes
const privilegeCount = tokenInfoBuf.readUInt32LE(0);

console.log('  +------------------------------------------------------+');
console.log('  |           PRIVILEGE ROSTER                            |');
console.log('  +------------------------------------------------------+');
console.log(`  Total privileges: ${privilegeCount}`);
console.log('');

interface PrivilegeInfo {
  name: string;
  luidLow: number;
  luidHigh: number;
  attributes: number;
  enabled: boolean;
  enabledByDefault: boolean;
}

const privileges: PrivilegeInfo[] = [];

for (let i = 0; i < privilegeCount; i++) {
  const offset = 4 + i * 12; // 4 bytes for PrivilegeCount, then 12 bytes per entry
  const luidLow = tokenInfoBuf.readUInt32LE(offset);
  const luidHigh = tokenInfoBuf.readInt32LE(offset + 4);
  const attributes = tokenInfoBuf.readUInt32LE(offset + 8);

  // Look up the privilege name from the LUID
  const luidBuf = Buffer.alloc(8);
  luidBuf.writeUInt32LE(luidLow, 0);
  luidBuf.writeInt32LE(luidHigh, 4);

  const nameBuf = Buffer.alloc(512);
  const nameSizeBuf = Buffer.alloc(4);
  nameSizeBuf.writeUInt32LE(256, 0);

  const lookupResult = Advapi32.LookupPrivilegeNameW(null as any, luidBuf.ptr, nameBuf.ptr, nameSizeBuf.ptr);
  const name = lookupResult ? readWideStringBuf(nameBuf) : `LUID(${luidLow}:${luidHigh})`;

  const enabled = (attributes & PrivilegeAttributes.SE_PRIVILEGE_ENABLED) !== 0;
  const enabledByDefault = (attributes & PrivilegeAttributes.SE_PRIVILEGE_ENABLED_BY_DEFAULT) !== 0;

  privileges.push({ name, luidLow, luidHigh, attributes, enabled, enabledByDefault });
}

// Sort: enabled first, then by name
privileges.sort((a, b) => {
  if (a.enabled !== b.enabled) return a.enabled ? -1 : 1;
  return a.name.localeCompare(b.name);
});

// Print the roster
const enabledPrivileges = privileges.filter((p) => p.enabled);
const disabledPrivileges = privileges.filter((p) => !p.enabled);

if (enabledPrivileges.length > 0) {
  console.log('  ACTIVE PRIVILEGES (currently enabled):');
  console.log('');
  for (const priv of enabledPrivileges) {
    const defaultTag = priv.enabledByDefault ? ' [default]' : ' [elevated]';
    console.log(`    [ON]  ${priv.name}${defaultTag}`);
  }
  console.log('');
}

if (disabledPrivileges.length > 0) {
  console.log('  INACTIVE PRIVILEGES (present but disabled):');
  console.log('');
  for (const priv of disabledPrivileges) {
    console.log(`    [--]  ${priv.name}`);
  }
  console.log('');
}

// Summary
console.log('  +------------------------------------------------------+');
console.log('  |           CLEARANCE SUMMARY                          |');
console.log('  +------------------------------------------------------+');
console.log(`  User:                   ${userName}`);
console.log(`  Total Privileges:       ${privilegeCount}`);
console.log(`  Currently Enabled:      ${enabledPrivileges.length}`);
console.log(`  Currently Disabled:     ${disabledPrivileges.length}`);

// Check for notable privileges
const notable = ['SeDebugPrivilege', 'SeBackupPrivilege', 'SeRestorePrivilege', 'SeTakeOwnershipPrivilege', 'SeImpersonatePrivilege', 'SeLoadDriverPrivilege'];

const foundNotable = privileges.filter((p) => notable.some((n) => p.name.includes(n)));
if (foundNotable.length > 0) {
  console.log('');
  console.log('  Notable privileges detected:');
  for (const priv of foundNotable) {
    const status = priv.enabled ? 'ACTIVE' : 'inactive';
    console.log(`    ${priv.name} (${status})`);
  }
}

// Determine the "clearance level"
console.log('');
const hasDebug = privileges.some((p) => p.name.includes('SeDebugPrivilege') && p.enabled);
const hasTakeOwnership = privileges.some((p) => p.name.includes('SeTakeOwnershipPrivilege') && p.enabled);

if (hasDebug && hasTakeOwnership) {
  console.log('  Clearance Level:        MAXIMUM (elevated administrator)');
} else if (enabledPrivileges.length > 10) {
  console.log('  Clearance Level:        HIGH (administrator-level)');
} else if (enabledPrivileges.length > 3) {
  console.log('  Clearance Level:        STANDARD (normal user)');
} else {
  console.log('  Clearance Level:        RESTRICTED (limited privileges)');
}

console.log('');
console.log('  +======================================================+');
console.log('  |         Badge verification complete.                  |');
console.log('  +======================================================+');
console.log('');

// Cleanup
Kernel32.CloseHandle(tokenHandle);
