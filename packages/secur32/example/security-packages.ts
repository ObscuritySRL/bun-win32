/**
 * SSPI security package enumeration and LSA authentication package lookup.
 *
 * Enumerates all registered SSPI security packages via EnumerateSecurityPackagesW
 * and decodes the SecPkgInfoW structures to display name, comment, max token size,
 * version, RPC ID, and decoded capability flags. Frees the array with FreeContextBuffer.
 *
 * Also opens an untrusted LSA connection with LsaConnectUntrusted, then looks up
 * the NTLM and Kerberos authentication package IDs via LsaLookupAuthenticationPackage.
 * Cleans up with LsaDeregisterLogonProcess.
 *
 * APIs demonstrated: EnumerateSecurityPackagesW, FreeContextBuffer,
 *   LsaConnectUntrusted, LsaLookupAuthenticationPackage, LsaDeregisterLogonProcess
 *
 * Run: bun run example/security-packages.ts
 */

import { read, toArrayBuffer, type Pointer } from 'bun:ffi';

import Secur32 from '../index';

const CAPABILITY_FLAGS: Array<{ bit: number; name: string }> = [
  { bit: 0x00000001, name: 'INTEGRITY' },
  { bit: 0x00000002, name: 'PRIVACY' },
  { bit: 0x00000004, name: 'TOKEN_ONLY' },
  { bit: 0x00000008, name: 'DATAGRAM' },
  { bit: 0x00000010, name: 'CONNECTION' },
  { bit: 0x00000020, name: 'MULTI_REQUIRED' },
  { bit: 0x00000040, name: 'CLIENT_ONLY' },
  { bit: 0x00000080, name: 'EXTENDED_ERROR' },
  { bit: 0x00000100, name: 'IMPERSONATION' },
  { bit: 0x00000200, name: 'ACCEPT_WIN32_NAME' },
  { bit: 0x00000400, name: 'STREAM' },
  { bit: 0x00000800, name: 'NEGOTIABLE' },
  { bit: 0x00001000, name: 'GSS_COMPATIBLE' },
  { bit: 0x00002000, name: 'LOGON' },
  { bit: 0x00004000, name: 'ASCII_BUFFERS' },
  { bit: 0x00008000, name: 'FRAGMENT' },
  { bit: 0x00010000, name: 'MUTUAL_AUTH' },
  { bit: 0x00020000, name: 'DELEGATION' },
  { bit: 0x00040000, name: 'READONLY_WITH_CHECKSUM' },
  { bit: 0x00080000, name: 'RESTRICTED_TOKENS' },
  { bit: 0x00100000, name: 'NEGO_EXTENDER' },
  { bit: 0x00200000, name: 'NEGOTIABLE2' },
  { bit: 0x00400000, name: 'APPCONTAINER_PASSTHROUGH' },
  { bit: 0x00800000, name: 'APPCONTAINER_CHECKS' },
  { bit: 0x01000000, name: 'CREDENTIAL_ISOLATION_ENABLED' },
  { bit: 0x02000000, name: 'APPLY_LOOPBACK' },
];

function decodeCapabilities(flags: number): string[] {
  const active: string[] = [];
  for (const flag of CAPABILITY_FLAGS) {
    if (flags & flag.bit) active.push(flag.name);
  }
  return active;
}

function readWideStringFromPointer(ptr: Pointer | number): string {
  if (!ptr || ptr === 0) return '(null)';
  // Read up to 512 bytes (256 wide chars) from the pointer
  const buf = Buffer.from(toArrayBuffer(ptr as Pointer, 0, 512));
  return buf.toString('utf16le').replace(/\0.*$/, '');
}

// SecPkgInfoW layout on x64:
// offset 0:  fCapabilities  (u32)
// offset 4:  wVersion       (u16)
// offset 6:  wRPCID         (u16)
// offset 8:  cbMaxToken     (u32)
// offset 12: padding        (4 bytes)
// offset 16: Name           (ptr, 8 bytes)
// offset 24: Comment        (ptr, 8 bytes)
// Total: 32 bytes per entry
const SEC_PKG_INFO_SIZE = 32;

console.log('=== SSPI Security Package Enumeration ===\n');

const countBuf = Buffer.alloc(4);
const arrayPtrBuf = Buffer.alloc(8);

const enumStatus = Secur32.EnumerateSecurityPackagesW(countBuf.ptr, arrayPtrBuf.ptr);

if (enumStatus !== 0) {
  console.error(`EnumerateSecurityPackagesW failed: SECURITY_STATUS = 0x${(enumStatus >>> 0).toString(16)}`);
  process.exit(1);
}

const packageCount = countBuf.readUInt32LE(0);
const arrayBasePtr = read.ptr(arrayPtrBuf.ptr);

console.log(`Found ${packageCount} registered security package(s):\n`);

for (let i = 0; i < packageCount; i++) {
  const entryBase = Number(arrayBasePtr) + i * SEC_PKG_INFO_SIZE;
  const entryBuf = Buffer.from(toArrayBuffer(entryBase as unknown as Pointer, 0, SEC_PKG_INFO_SIZE));

  const fCapabilities = entryBuf.readUInt32LE(0);
  const wVersion = entryBuf.readUInt16LE(4);
  const wRPCID = entryBuf.readUInt16LE(6);
  const cbMaxToken = entryBuf.readUInt32LE(8);

  const namePtr = Number(entryBuf.readBigUInt64LE(16));
  const commentPtr = Number(entryBuf.readBigUInt64LE(24));

  const name = readWideStringFromPointer(namePtr as unknown as Pointer);
  const comment = readWideStringFromPointer(commentPtr as unknown as Pointer);

  const caps = decodeCapabilities(fCapabilities);

  console.log(`  [${i + 1}] ${name}`);
  console.log(`      Comment:       ${comment || '(none)'}`);
  console.log(`      Version:       ${wVersion}`);
  console.log(`      RPC ID:        ${wRPCID}`);
  console.log(`      Max Token:     ${cbMaxToken} bytes`);
  console.log(`      Capabilities:  0x${(fCapabilities >>> 0).toString(16).padStart(8, '0')}`);
  if (caps.length > 0) {
    console.log(`      Flags:         ${caps.join(', ')}`);
  }
  console.log('');
}

// Free the array returned by EnumerateSecurityPackagesW
Secur32.FreeContextBuffer(arrayBasePtr as unknown as Pointer);

console.log('=== LSA Authentication Package Lookup ===\n');

const hLsaBuf = Buffer.alloc(8);
const lsaConnectStatus = Secur32.LsaConnectUntrusted(hLsaBuf.ptr);

if (lsaConnectStatus !== 0) {
  console.error(`LsaConnectUntrusted failed: NTSTATUS = 0x${(lsaConnectStatus >>> 0).toString(16)}`);
  process.exit(0);
}

const lsaHandle = hLsaBuf.readBigUInt64LE(0);
console.log(`LSA handle acquired: 0x${lsaHandle.toString(16)}\n`);

// LSA_STRING struct: Length (u16), MaximumLength (u16), Buffer (ptr)
// On x64 with alignment: u16 + u16 + 4 pad + ptr = 16 bytes
function makeLsaString(text: string): Buffer {
  const textBuf = Buffer.from(text, 'ascii');
  const lsaString = Buffer.alloc(16);
  lsaString.writeUInt16LE(textBuf.byteLength, 0);       // Length (excluding null)
  lsaString.writeUInt16LE(textBuf.byteLength, 2);       // MaximumLength
  lsaString.writeBigUInt64LE(BigInt(textBuf.ptr), 8);    // Buffer pointer at offset 8
  return lsaString;
}

const authPackages = [
  { name: 'MICROSOFT_AUTHENTICATION_PACKAGE_V1_0', label: 'NTLM' },
  { name: 'Kerberos', label: 'Kerberos' },
  { name: 'Negotiate', label: 'Negotiate' },
];

for (const pkg of authPackages) {
  const lsaName = makeLsaString(pkg.name);
  const packageIdBuf = Buffer.alloc(4);

  const lookupStatus = Secur32.LsaLookupAuthenticationPackage(lsaHandle, lsaName.ptr, packageIdBuf.ptr);

  if (lookupStatus === 0) {
    const packageId = packageIdBuf.readUInt32LE(0);
    console.log(`  ${pkg.label} (${pkg.name})`);
    console.log(`      Package ID: ${packageId}`);
  } else {
    console.log(`  ${pkg.label} (${pkg.name})`);
    console.log(`      Lookup failed: NTSTATUS = 0x${(lookupStatus >>> 0).toString(16)}`);
  }
  console.log('');
}

Secur32.LsaDeregisterLogonProcess(lsaHandle);
console.log('LSA connection closed.');
