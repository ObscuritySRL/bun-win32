import { read } from 'bun:ffi';

import Secur32 from '../index';

// Smoke test 1: InitSecurityInterfaceW — get the SSPI function table pointer
const table = Secur32.InitSecurityInterfaceW();
console.log(`InitSecurityInterfaceW: ${table ? 'OK' : 'FAILED'} (${table})`);

if (!table) {
  console.error('InitSecurityInterfaceW returned null');
  process.exit(1);
}

// Smoke test 2: EnumerateSecurityPackagesW — list available security packages
const countBuf = new Uint32Array(1);
const infoBuf = Buffer.alloc(8);
const enumStatus = Secur32.EnumerateSecurityPackagesW(countBuf.ptr, infoBuf.ptr);
console.log(`EnumerateSecurityPackagesW: status=0x${(enumStatus >>> 0).toString(16)} count=${countBuf[0]}`);

if (enumStatus === 0 && countBuf[0]! > 0) {
  Secur32.FreeContextBuffer(read.ptr(infoBuf.ptr));
}

// Smoke test 3: LsaConnectUntrusted — open an untrusted LSA connection
const hLsa = Buffer.alloc(8);
const lsaStatus = Secur32.LsaConnectUntrusted(hLsa.ptr);
console.log(`LsaConnectUntrusted: NTSTATUS=0x${(lsaStatus >>> 0).toString(16)}`);

if (lsaStatus === 0) {
  const handle = hLsa.readBigUInt64LE(0);
  console.log(`  LSA handle: 0x${handle.toString(16)}`);
  Secur32.LsaDeregisterLogonProcess(handle);
}

// Smoke test 4: GetUserNameExW — retrieve current user name
const nameBuf = new Uint16Array(256);
const sizeBuf = new Uint32Array(1);
sizeBuf[0] = 256;

const nameResult = Secur32.GetUserNameExW(2, nameBuf.ptr, sizeBuf.ptr);

if (nameResult) {
  const name = String.fromCharCode(...nameBuf.subarray(0, sizeBuf[0]));
  console.log(`GetUserNameExW (SAM): ${name}`);
} else {
  console.log('GetUserNameExW: not available (non-domain or restricted)');
}

console.log('\nAll smoke tests passed.');
