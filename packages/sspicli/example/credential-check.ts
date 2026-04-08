/**
 * SSPI Client Security Checkpoint — probes the system's SSPI client capabilities.
 *
 * Uses SspiGetTargetHostName to resolve target host names for various server name
 * formats ("localhost", the machine's NETBIOS name). Cross-references with Secur32's
 * EnumerateSecurityPackagesW to show which security packages are available for
 * establishing authenticated connections.
 *
 * Presents results as a "Security Checkpoint" report with pass/fail indicators.
 *
 * APIs demonstrated: SspiCli.SspiGetTargetHostName, SspiCli.GetUserNameExW,
 *   Secur32.EnumerateSecurityPackagesW, Secur32.FreeContextBuffer
 *
 * Run: bun run example/credential-check.ts
 */

import { read, toArrayBuffer, type Pointer } from 'bun:ffi';

import SspiCli from '../index';
import Secur32 from '@bun-win32/secur32';

const PASS = '[PASS]';
const FAIL = '[FAIL]';
const INFO = '[INFO]';

console.log('');
console.log('+------------------------------------------------------+');
console.log('|            SSPI CLIENT SECURITY CHECKPOINT            |');
console.log('+------------------------------------------------------+');
console.log('');

// Step 1: Verify current user identity via SspiCli
console.log('--- Identity Verification ---\n');

const identityFormats: Array<{ id: number; label: string }> = [
  { id: 2, label: 'SAM-Compatible' },
  { id: 3, label: 'Display Name' },
  { id: 8, label: 'User Principal' },
];

for (const fmt of identityFormats) {
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
      console.log(`  ${PASS} ${fmt.label}: ${name}`);
    } else {
      console.log(`  ${FAIL} ${fmt.label}: call returned false`);
    }
  } else {
    console.log(`  ${FAIL} ${fmt.label}: not available on this system`);
  }
}

// Step 2: Target host name resolution via SspiGetTargetHostName
console.log('\n--- Target Host Resolution ---\n');

// Get machine name from environment
const machineName = process.env.COMPUTERNAME || 'UNKNOWN';

const targets = ['localhost', machineName, '127.0.0.1', 'example.com'];

for (const target of targets) {
  const targetWide = Buffer.from(target + '\0', 'utf16le');
  const hostPtrBuf = Buffer.alloc(8); // out pointer to resolved host name

  const status = SspiCli.SspiGetTargetHostName(targetWide.ptr, hostPtrBuf.ptr);

  if (status === 0) {
    const hostPtr = read.ptr(hostPtrBuf.ptr);
    if (hostPtr) {
      const resolved = Buffer.from(toArrayBuffer(hostPtr as Pointer, 0, 512))
        .toString('utf16le')
        .replace(/\0.*$/, '');
      console.log(`  ${PASS} "${target}" -> "${resolved}"`);
      SspiCli.SspiLocalFree(hostPtr as Pointer);
    } else {
      console.log(`  ${FAIL} "${target}" -> resolved to null pointer`);
    }
  } else {
    console.log(`  ${FAIL} "${target}" -> SECURITY_STATUS 0x${(status >>> 0).toString(16)}`);
  }
}

// Step 3: Available security packages via Secur32 (cross-package)
console.log('\n--- Available Security Packages ---\n');

const countBuf = Buffer.alloc(4);
const arrayPtrBuf = Buffer.alloc(8);
const enumStatus = Secur32.EnumerateSecurityPackagesW(countBuf.ptr, arrayPtrBuf.ptr);

if (enumStatus === 0) {
  const packageCount = countBuf.readUInt32LE(0);
  const arrayBasePtr = read.ptr(arrayPtrBuf.ptr);

  // SecPkgInfoW: 32 bytes per entry on x64
  const criticalPackages = ['Negotiate', 'Kerberos', 'NTLM', 'Schannel', 'CredSSP'];
  const foundPackages: string[] = [];

  for (let i = 0; i < packageCount; i++) {
    const namePtr = Number(
      Buffer.from(toArrayBuffer((Number(arrayBasePtr) + i * 32 + 16) as unknown as Pointer, 0, 8))
        .readBigUInt64LE(0)
    );
    if (namePtr) {
      const name = Buffer.from(toArrayBuffer(namePtr as unknown as Pointer, 0, 256))
        .toString('utf16le')
        .replace(/\0.*$/, '');
      foundPackages.push(name);
    }
  }

  for (const critical of criticalPackages) {
    const found = foundPackages.some(p => p.toLowerCase() === critical.toLowerCase());
    console.log(`  ${found ? PASS : FAIL} ${critical}`);
  }

  const otherPackages = foundPackages.filter(
    p => !criticalPackages.some(c => c.toLowerCase() === p.toLowerCase())
  );
  if (otherPackages.length > 0) {
    console.log(`\n  ${INFO} ${otherPackages.length} additional package(s): ${otherPackages.join(', ')}`);
  }

  Secur32.FreeContextBuffer(arrayBasePtr as unknown as Pointer);
} else {
  console.log(`  ${FAIL} Could not enumerate packages: 0x${(enumStatus >>> 0).toString(16)}`);
}

// Step 4: SSPI function table availability
console.log('\n--- SSPI Function Table ---\n');

const tablePtr = SspiCli.InitSecurityInterfaceW();
if (tablePtr) {
  console.log(`  ${PASS} InitSecurityInterfaceW returned valid table`);
} else {
  console.log(`  ${FAIL} InitSecurityInterfaceW returned null`);
}

console.log('');
console.log('+------------------------------------------------------+');
console.log('|              CHECKPOINT COMPLETE                      |');
console.log('+------------------------------------------------------+');
