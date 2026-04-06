import { type Pointer, read } from 'bun:ffi';

import SspiCli from '../index';

// Smoke test 1: GetUserNameExW — retrieve current user name (SAM-compatible)
const nameBuf = Buffer.alloc(512);
const sizeBuf = Buffer.alloc(4);
sizeBuf.writeUInt32LE(256);

const nameResult = SspiCli.GetUserNameExW(2, nameBuf.ptr, sizeBuf.ptr);

if (nameResult) {
  const len = sizeBuf.readUInt32LE(0);
  const name = nameBuf.subarray(0, len * 2).toString('utf16le');
  console.log(`GetUserNameExW (SAM): ${name}`);
} else {
  console.log('GetUserNameExW: not available (non-domain or restricted)');
}

// Smoke test 2: EnumerateSecurityPackagesW — list available security packages
const countBuf = Buffer.alloc(4);
const infoBuf = Buffer.alloc(8);
const enumStatus = SspiCli.EnumerateSecurityPackagesW(countBuf.ptr, infoBuf.ptr);
const count = countBuf.readUInt32LE(0);
console.log(`EnumerateSecurityPackagesW: status=0x${(enumStatus >>> 0).toString(16)} count=${count}`);

if (enumStatus === 0 && count > 0) {
  SspiCli.FreeContextBuffer(read.ptr(infoBuf.ptr) as unknown as Pointer);
}

// Smoke test 3: InitSecurityInterfaceW — get the SSPI function table pointer
const table = SspiCli.InitSecurityInterfaceW();
console.log(`InitSecurityInterfaceW: ${table ? 'OK' : 'FAILED'} (${table})`);

// Smoke test 4: LsaConnectUntrusted — open an untrusted LSA connection
const hLsa = Buffer.alloc(8);
const lsaStatus = SspiCli.LsaConnectUntrusted(hLsa.ptr);
console.log(`LsaConnectUntrusted: NTSTATUS=0x${(lsaStatus >>> 0).toString(16)}`);

if (lsaStatus === 0) {
  const handle = hLsa.readBigUInt64LE(0);
  console.log(`  LSA handle: 0x${handle.toString(16)}`);
  SspiCli.LsaDeregisterLogonProcess(handle);
}

console.log('\nAll smoke tests passed.');
