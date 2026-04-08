/**
 * Full SSPI client diagnostics report.
 *
 * Systematically tests all available SspiCli functions with various inputs:
 * - GetUserNameExW: retrieves the user identity in every EXTENDED_NAME_FORMAT
 * - SspiGetTargetHostName: resolves multiple server name formats (FQDN, NetBIOS,
 *   IP addresses, UNC paths)
 * - InitSecurityInterfaceW: validates the SSPI function table pointer
 * - EnumerateSecurityPackagesW: lists all registered packages with metadata
 * - LsaConnectUntrusted + LsaLookupAuthenticationPackage: discovers auth package IDs
 *
 * Cross-references with Secur32 for package details (capabilities, max token size).
 * Formats output as a comprehensive diagnostic report.
 *
 * APIs demonstrated: SspiCli.GetUserNameExW, SspiCli.SspiGetTargetHostName,
 *   SspiCli.InitSecurityInterfaceW, SspiCli.EnumerateSecurityPackagesW,
 *   SspiCli.FreeContextBuffer, SspiCli.LsaConnectUntrusted,
 *   SspiCli.LsaLookupAuthenticationPackage, SspiCli.LsaDeregisterLogonProcess,
 *   SspiCli.SspiLocalFree, Secur32.EnumerateSecurityPackagesW
 *
 * Run: bun run example/sspi-diagnostics.ts
 */

import { read, toArrayBuffer, type Pointer } from 'bun:ffi';

import SspiCli from '../index';
import Secur32 from '@bun-win32/secur32';

function readWideString(ptr: Pointer | number, maxBytes = 512): string {
  if (!ptr || ptr === 0) return '(null)';
  const buf = Buffer.from(toArrayBuffer(ptr as Pointer, 0, maxBytes));
  return buf.toString('utf16le').replace(/\0.*$/, '');
}

function statusHex(s: number): string {
  return '0x' + (s >>> 0).toString(16).padStart(8, '0');
}

console.log('');
console.log('================================================================');
console.log('              SSPI CLIENT DIAGNOSTICS REPORT');
console.log(`              ${new Date().toLocaleString()}`);
console.log('================================================================');

// Section 1: User Identity Enumeration
console.log('\n1. USER IDENTITY FORMATS\n');

const nameFormats: Array<{ id: number; label: string }> = [
  { id: 0, label: 'NameUnknown' },
  { id: 1, label: 'NameFullyQualifiedDN' },
  { id: 2, label: 'NameSamCompatible' },
  { id: 3, label: 'NameDisplay' },
  { id: 6, label: 'NameUniqueId' },
  { id: 7, label: 'NameCanonical' },
  { id: 8, label: 'NameUserPrincipal' },
  { id: 9, label: 'NameCanonicalEx' },
  { id: 10, label: 'NameServicePrincipal' },
  { id: 12, label: 'NameDnsDomain' },
  { id: 13, label: 'NameGivenName' },
  { id: 14, label: 'NameSurname' },
];

let identitySuccessCount = 0;

for (const fmt of nameFormats) {
  const sizeBuf = Buffer.alloc(4);
  sizeBuf.writeUInt32LE(0);
  SspiCli.GetUserNameExW(fmt.id, null, sizeBuf.ptr);
  const charsNeeded = sizeBuf.readUInt32LE(0);

  if (charsNeeded > 0) {
    const nameBuf = Buffer.alloc(charsNeeded * 2);
    sizeBuf.writeUInt32LE(charsNeeded);
    const ok = SspiCli.GetUserNameExW(fmt.id, nameBuf.ptr, sizeBuf.ptr);
    if (ok) {
      const name = nameBuf.subarray(0, sizeBuf.readUInt32LE(0) * 2).toString('utf16le');
      console.log(`   [OK]   ${fmt.label.padEnd(26)} = ${name}`);
      identitySuccessCount++;
    } else {
      console.log(`   [--]   ${fmt.label.padEnd(26)} = (call failed)`);
    }
  } else {
    console.log(`   [--]   ${fmt.label.padEnd(26)} = (not available)`);
  }
}

console.log(`\n   Resolved ${identitySuccessCount} of ${nameFormats.length} format(s)`);

// Section 2: Target Host Name Resolution
console.log('\n2. TARGET HOST NAME RESOLUTION\n');

const machineName = process.env.COMPUTERNAME || 'UNKNOWN';
const domainName = process.env.USERDNSDOMAIN || null;

const targetNames = [
  'localhost',
  machineName,
  '127.0.0.1',
  '::1',
  `\\\\${machineName}`,
  `${machineName}.local`,
  'example.com',
  'dc.contoso.com',
];

if (domainName) {
  targetNames.push(`${machineName}.${domainName}`);
}

let resolveSuccessCount = 0;

for (const target of targetNames) {
  const targetWide = Buffer.from(target + '\0', 'utf16le');
  const hostPtrBuf = Buffer.alloc(8);

  const status = SspiCli.SspiGetTargetHostName(targetWide.ptr, hostPtrBuf.ptr);

  if (status === 0) {
    const hostPtr = read.ptr(hostPtrBuf.ptr);
    if (hostPtr) {
      const resolved = readWideString(hostPtr as Pointer);
      console.log(`   [OK]   ${target.padEnd(30)} -> ${resolved}`);
      SspiCli.SspiLocalFree(hostPtr as Pointer);
      resolveSuccessCount++;
    } else {
      console.log(`   [--]   ${target.padEnd(30)} -> (null pointer)`);
    }
  } else {
    console.log(`   [--]   ${target.padEnd(30)} -> ${statusHex(status)}`);
  }
}

console.log(`\n   Resolved ${resolveSuccessCount} of ${targetNames.length} target(s)`);

// Section 3: SSPI Function Table
console.log('\n3. SSPI FUNCTION TABLE\n');

const tablePtr = SspiCli.InitSecurityInterfaceW();
console.log(`   InitSecurityInterfaceW: ${tablePtr ? `OK (0x${Number(tablePtr).toString(16)})` : 'FAILED (null)'}`);

const tablePtrA = SspiCli.InitSecurityInterfaceA();
console.log(`   InitSecurityInterfaceA: ${tablePtrA ? `OK (0x${Number(tablePtrA).toString(16)})` : 'FAILED (null)'}`);

// Section 4: Security Package Enumeration (detailed)
console.log('\n4. SECURITY PACKAGE ENUMERATION\n');

const SEC_PKG_INFO_SIZE = 32;
const countBuf = Buffer.alloc(4);
const arrayPtrBuf = Buffer.alloc(8);

const enumStatus = Secur32.EnumerateSecurityPackagesW(countBuf.ptr, arrayPtrBuf.ptr);

if (enumStatus === 0) {
  const packageCount = countBuf.readUInt32LE(0);
  const arrayBasePtr = read.ptr(arrayPtrBuf.ptr);

  console.log(`   Total registered packages: ${packageCount}\n`);

  for (let i = 0; i < packageCount; i++) {
    const entryBuf = Buffer.from(
      toArrayBuffer((Number(arrayBasePtr) + i * SEC_PKG_INFO_SIZE) as unknown as Pointer, 0, SEC_PKG_INFO_SIZE)
    );

    const fCapabilities = entryBuf.readUInt32LE(0);
    const wVersion = entryBuf.readUInt16LE(4);
    const wRPCID = entryBuf.readUInt16LE(6);
    const cbMaxToken = entryBuf.readUInt32LE(8);
    const namePtr = Number(entryBuf.readBigUInt64LE(16));
    const commentPtr = Number(entryBuf.readBigUInt64LE(24));

    const name = readWideString(namePtr as unknown as Pointer);
    const comment = readWideString(commentPtr as unknown as Pointer);

    // Decode key capability flags
    const caps: string[] = [];
    if (fCapabilities & 0x01) caps.push('INTEGRITY');
    if (fCapabilities & 0x02) caps.push('PRIVACY');
    if (fCapabilities & 0x10) caps.push('CONNECTION');
    if (fCapabilities & 0x08) caps.push('DATAGRAM');
    if (fCapabilities & 0x0400) caps.push('STREAM');
    if (fCapabilities & 0x0100) caps.push('IMPERSONATION');
    if (fCapabilities & 0x0800) caps.push('NEGOTIABLE');
    if (fCapabilities & 0x20000) caps.push('DELEGATION');
    if (fCapabilities & 0x40) caps.push('CLIENT_ONLY');

    console.log(`   Package ${(i + 1).toString().padStart(2)}: ${name}`);
    console.log(`      Comment:      ${comment || '(none)'}`);
    console.log(`      Version:      ${wVersion}`);
    console.log(`      RPC ID:       ${wRPCID === 0xFFFF ? '(none)' : wRPCID.toString()}`);
    console.log(`      Max Token:    ${cbMaxToken.toLocaleString()} bytes`);
    console.log(`      Capabilities: ${statusHex(fCapabilities)} [${caps.join(', ') || 'none'}]`);
    console.log('');
  }

  Secur32.FreeContextBuffer(arrayBasePtr as unknown as Pointer);
} else {
  console.log(`   EnumerateSecurityPackagesW failed: ${statusHex(enumStatus)}`);
}

// Section 5: LSA Authentication Package IDs
console.log('5. LSA AUTHENTICATION PACKAGES\n');

const hLsaBuf = Buffer.alloc(8);
const lsaStatus = SspiCli.LsaConnectUntrusted(hLsaBuf.ptr);

if (lsaStatus === 0) {
  const lsaHandle = hLsaBuf.readBigUInt64LE(0);
  console.log(`   LSA handle: 0x${lsaHandle.toString(16)}\n`);

  const authPackages = [
    'MICROSOFT_AUTHENTICATION_PACKAGE_V1_0',
    'Kerberos',
    'Negotiate',
    'WDigest',
    'Schannel',
    'Microsoft Unified Security Protocol Provider',
    'Default TLS SSP',
    'CREDSSP',
    'TSSSP',
    'pku2u',
    'CloudAP',
  ];

  for (const pkgName of authPackages) {
    // Build LSA_STRING: Length(u16) + MaxLen(u16) + pad(4) + Buffer(ptr) = 16 bytes
    const textBuf = Buffer.from(pkgName, 'ascii');
    const lsaString = Buffer.alloc(16);
    lsaString.writeUInt16LE(textBuf.byteLength, 0);
    lsaString.writeUInt16LE(textBuf.byteLength, 2);
    lsaString.writeBigUInt64LE(BigInt(textBuf.ptr), 8);

    const idBuf = Buffer.alloc(4);
    const lookupStatus = SspiCli.LsaLookupAuthenticationPackage(lsaHandle, lsaString.ptr, idBuf.ptr);

    if (lookupStatus === 0) {
      console.log(`   [OK]   ${pkgName.padEnd(50)} ID = ${idBuf.readUInt32LE(0)}`);
    } else {
      console.log(`   [--]   ${pkgName.padEnd(50)} ${statusHex(lookupStatus)}`);
    }
  }

  SspiCli.LsaDeregisterLogonProcess(lsaHandle);
  console.log('\n   LSA connection closed.');
} else {
  console.log(`   LsaConnectUntrusted failed: ${statusHex(lsaStatus)}`);
}

console.log('\n================================================================');
console.log('              DIAGNOSTICS COMPLETE');
console.log('================================================================');
