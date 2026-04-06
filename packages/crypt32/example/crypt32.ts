import { toArrayBuffer } from 'bun:ffi';

import Crypt32, { CertNameType, CryptBinaryToStringFlags, CryptProtectFlags } from '../index';

// Smoke test 1: Open the current user's personal certificate store and enumerate certs
const store = Crypt32.CertOpenSystemStoreW(0n, Buffer.from('MY\0', 'utf16le').ptr);

if (store === 0n) {
  console.error('CertOpenSystemStoreW failed');
  process.exit(1);
}

let cert = Crypt32.CertEnumCertificatesInStore(store, null);
let count = 0;

while (cert !== null) {
  count++;

  const nameBuf = new Uint16Array(256);
  const nameLen = Crypt32.CertGetNameStringW(
    cert,
    CertNameType.CERT_NAME_SIMPLE_DISPLAY_TYPE,
    0,
    null,
    nameBuf.ptr,
    256,
  );

  if (nameLen > 1) {
    const name = String.fromCharCode(...nameBuf.subarray(0, nameLen - 1));
    console.log(`  [${count}] ${name}`);
  }

  cert = Crypt32.CertEnumCertificatesInStore(store, cert);
}

console.log(`CertOpenSystemStoreW + CertEnumCertificatesInStore: found ${count} certificate(s) in MY store`);
Crypt32.CertCloseStore(store, 0);

// Smoke test 2: CryptBinaryToStringW (base64 encoding)
const data = Buffer.from('Hello, Crypt32!');
const sizeOut = new Uint32Array(1);

Crypt32.CryptBinaryToStringW(data.ptr, data.byteLength, CryptBinaryToStringFlags.CRYPT_STRING_BASE64 | CryptBinaryToStringFlags.CRYPT_STRING_NOCRLF, null, sizeOut.ptr);

const base64Buf = new Uint16Array(sizeOut[0]!);
const b64Result = Crypt32.CryptBinaryToStringW(data.ptr, data.byteLength, CryptBinaryToStringFlags.CRYPT_STRING_BASE64 | CryptBinaryToStringFlags.CRYPT_STRING_NOCRLF, base64Buf.ptr, sizeOut.ptr);

if (!b64Result) {
  console.error('CryptBinaryToStringW failed');
  process.exit(1);
}

const base64 = String.fromCharCode(...base64Buf.subarray(0, sizeOut[0]! - 1));
console.log(`CryptBinaryToStringW: "${data.toString()}" -> ${base64}`);

// Smoke test 3: CryptProtectData / CryptUnprotectData (DPAPI)
// DATA_BLOB layout: { cbData: DWORD (4 bytes + 4 padding), pbData: pointer (8 bytes) }
const secret = Buffer.from('Win32 DPAPI secret');
const dataIn = Buffer.alloc(16);
dataIn.writeUInt32LE(secret.byteLength, 0);
dataIn.writeBigUInt64LE(BigInt(secret.ptr), 8);

const dataOut = Buffer.alloc(16);

const protectResult = Crypt32.CryptProtectData(
  dataIn.ptr,
  Buffer.from('Test\0', 'utf16le').ptr,
  null,
  null,
  null,
  CryptProtectFlags.CRYPTPROTECT_UI_FORBIDDEN,
  dataOut.ptr,
);

if (!protectResult) {
  console.error('CryptProtectData failed');
  process.exit(1);
}

const encryptedSize = dataOut.readUInt32LE(0);
console.log(`CryptProtectData: ${secret.byteLength} bytes -> ${encryptedSize} bytes encrypted`);

// Decrypt it back
const decryptOut = Buffer.alloc(16);

const unprotectResult = Crypt32.CryptUnprotectData(dataOut.ptr, null, null, null, null, CryptProtectFlags.CRYPTPROTECT_UI_FORBIDDEN, decryptOut.ptr);

if (!unprotectResult) {
  console.error('CryptUnprotectData failed');
  process.exit(1);
}

const decryptedSize = decryptOut.readUInt32LE(0);
const ptrValue = decryptOut.readBigUInt64LE(8);
const decryptedBytes = Buffer.from(toArrayBuffer(Number(ptrValue), 0, decryptedSize));
console.log(`CryptUnprotectData: ${encryptedSize} bytes -> "${decryptedBytes.toString()}" (${decryptedSize} bytes)`);

console.log('\nAll smoke tests passed.');
