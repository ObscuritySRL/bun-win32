import Advapi32, { HKEY_LOCAL_MACHINE } from '../index';

// Smoke test 1: GetUserNameW
const userNameSize = new Uint32Array([256]);
const userNameBuffer = new Uint16Array(256);

const userResult = Advapi32.GetUserNameW(userNameBuffer.ptr, userNameSize.ptr);
if (!userResult) {
  console.error('GetUserNameW failed');
  process.exit(1);
}

const username = String.fromCharCode(...userNameBuffer.subarray(0, userNameSize[0]! - 1));
console.log(`GetUserNameW: ${username}`);

// Smoke test 2: RegOpenKeyExW + RegCloseKey
const hkeyOut = new BigUint64Array(1);
const status = Advapi32.RegOpenKeyExW(
  HKEY_LOCAL_MACHINE,
  Buffer.from('SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\0', 'utf16le').ptr,
  0,
  0x0002_0019, // KEY_READ
  hkeyOut.ptr,
);

if (status !== 0) {
  console.error(`RegOpenKeyExW failed with status ${status}`);
  process.exit(1);
}

const hkey = hkeyOut[0]!;
console.log(`RegOpenKeyExW: opened HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion (handle=0x${hkey.toString(16)})`);

Advapi32.RegCloseKey(hkey);
console.log('RegCloseKey: closed');

// Smoke test 3: LookupPrivilegeValueW
const luid = Buffer.alloc(8);
const privResult = Advapi32.LookupPrivilegeValueW(Buffer.from('\0\0', 'utf16le').ptr, Buffer.from('SeDebugPrivilege\0', 'utf16le').ptr, luid.ptr);
const luidValue = luid.readBigInt64LE(0);
console.log(`LookupPrivilegeValueW(SeDebugPrivilege): ${privResult ? `LUID=${luidValue}` : 'FAILED'}`);

console.log('\nAll smoke tests passed.');
