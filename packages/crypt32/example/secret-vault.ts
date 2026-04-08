/**
 * Secret Vault — DPAPI encryption/decryption demo with Base64 encoding.
 *
 * Demonstrates the complete lifecycle of protecting secret data with Windows DPAPI:
 * 1. Create a plaintext secret message
 * 2. Encrypt it with CryptProtectData (DPAPI)
 * 3. Display the encrypted blob as hex
 * 4. Encode the encrypted blob to Base64 with CryptBinaryToStringW
 * 5. Decode the Base64 back to binary with CryptStringToBinaryW
 * 6. Decrypt with CryptUnprotectData and verify the original message
 *
 * Uses Kernel32.LocalFree to clean up DPAPI-allocated output buffers.
 *
 * DATA_BLOB struct (x64): cbData (u32) at offset 0, padding at offset 4,
 * pbData (ptr) at offset 8. Total: 16 bytes.
 *
 * APIs demonstrated: Crypt32.CryptProtectData, Crypt32.CryptUnprotectData,
 *   Crypt32.CryptBinaryToStringW, Crypt32.CryptStringToBinaryW,
 *   Kernel32.LocalFree
 *
 * Run: bun run example/secret-vault.ts
 */

import { toArrayBuffer, type Pointer } from 'bun:ffi';

import Crypt32 from '../index';
import Kernel32 from '@bun-win32/kernel32';

// DATA_BLOB helper: cbData (u32) at 0, pbData (ptr) at 8
function makeDataBlob(data: Buffer): Buffer {
  const blob = Buffer.alloc(16);
  blob.writeUInt32LE(data.byteLength, 0);
  blob.writeBigUInt64LE(BigInt(data.ptr), 8);
  return blob;
}

function readDataBlob(blob: Buffer): { cbData: number; pbData: bigint } {
  return {
    cbData: blob.readUInt32LE(0),
    pbData: blob.readBigUInt64LE(8),
  };
}

const SECRET_MESSAGE = 'The treasure is buried under the old oak tree at midnight.';
const CRYPT_STRING_BASE64 = 0x00000001;

console.log('');
console.log('+------------------------------------------------------------+');
console.log('|                   SECRET VAULT                             |');
console.log('|             DPAPI Encryption Workflow                      |');
console.log('+------------------------------------------------------------+');

// Step 1: The plaintext secret
console.log('\n--- Step 1: Original Secret ---\n');
console.log(`  "${SECRET_MESSAGE}"`);
console.log(`  Length: ${SECRET_MESSAGE.length} characters`);

const plaintextBuf = Buffer.from(SECRET_MESSAGE, 'utf8');
console.log(`  Bytes:  ${plaintextBuf.byteLength}`);

// Step 2: Encrypt with CryptProtectData
console.log('\n--- Step 2: Encrypting with DPAPI ---\n');

const inputBlob = makeDataBlob(plaintextBuf);
const descriptionWide = Buffer.from('Secret Vault Demo\0', 'utf16le');
const encryptedBlob = Buffer.alloc(16); // output DATA_BLOB

const encryptOk = Crypt32.CryptProtectData(
  inputBlob.ptr,
  descriptionWide.ptr,
  null,  // no optional entropy
  null,  // reserved
  null,  // no prompt struct
  0,     // no flags
  encryptedBlob.ptr,
);

if (!encryptOk) {
  console.error('  CryptProtectData FAILED');
  process.exit(1);
}

const encrypted = readDataBlob(encryptedBlob);
const encryptedBytes = Buffer.from(toArrayBuffer(encrypted.pbData as unknown as Pointer, 0, encrypted.cbData));

console.log(`  Encrypted blob size: ${encrypted.cbData} bytes`);
console.log(`  First 64 bytes (hex):`);
const hexPreview = encryptedBytes.subarray(0, 64).toString('hex').match(/.{1,32}/g) || [];
for (const line of hexPreview) {
  console.log(`    ${line}`);
}

// Step 3: Base64 encode the encrypted blob
console.log('\n--- Step 3: Base64 Encoding ---\n');

const b64SizeBuf = Buffer.alloc(4);
// First call to get required size
Crypt32.CryptBinaryToStringW(encryptedBytes.ptr, encrypted.cbData, CRYPT_STRING_BASE64, null, b64SizeBuf.ptr);
const b64CharsNeeded = b64SizeBuf.readUInt32LE(0);

const b64Buf = Buffer.alloc(b64CharsNeeded * 2);
b64SizeBuf.writeUInt32LE(b64CharsNeeded);
const b64Ok = Crypt32.CryptBinaryToStringW(
  encryptedBytes.ptr, encrypted.cbData, CRYPT_STRING_BASE64, b64Buf.ptr, b64SizeBuf.ptr,
);

if (b64Ok) {
  const b64String = b64Buf.toString('utf16le').replace(/\0.*$/, '').trim();
  console.log('  Base64-encoded ciphertext:');
  const b64Lines = b64String.split('\n');
  for (const line of b64Lines) {
    if (line.trim()) console.log(`    ${line.trim()}`);
  }

  // Step 4: Decode Base64 back to binary
  console.log('\n--- Step 4: Base64 Decoding ---\n');

  const b64Wide = Buffer.from(b64String + '\0', 'utf16le');
  const decodeSizeBuf = Buffer.alloc(4);
  // First call: get required binary size
  Crypt32.CryptStringToBinaryW(b64Wide.ptr, 0, CRYPT_STRING_BASE64, null, decodeSizeBuf.ptr, null, null);
  const decodeBytesNeeded = decodeSizeBuf.readUInt32LE(0);

  const decodedBinaryBuf = Buffer.alloc(decodeBytesNeeded);
  decodeSizeBuf.writeUInt32LE(decodeBytesNeeded);
  const decodeOk = Crypt32.CryptStringToBinaryW(
    b64Wide.ptr, 0, CRYPT_STRING_BASE64, decodedBinaryBuf.ptr, decodeSizeBuf.ptr, null, null,
  );

  if (decodeOk) {
    const actualDecoded = decodeSizeBuf.readUInt32LE(0);
    console.log(`  Decoded ${actualDecoded} bytes from Base64`);

    // Verify the decoded bytes match the original encrypted blob
    const match = actualDecoded === encrypted.cbData &&
      decodedBinaryBuf.subarray(0, actualDecoded).equals(encryptedBytes.subarray(0, encrypted.cbData));
    console.log(`  Matches original encrypted blob: ${match ? 'YES' : 'NO'}`);
  } else {
    console.log('  CryptStringToBinaryW FAILED');
  }
} else {
  console.log('  CryptBinaryToStringW FAILED');
}

// Step 5: Decrypt with CryptUnprotectData
console.log('\n--- Step 5: Decrypting with DPAPI ---\n');

const ciphertextBlob = makeDataBlob(encryptedBytes);
const decryptedBlob = Buffer.alloc(16); // output DATA_BLOB
const descPtrBuf = Buffer.alloc(8);     // output description pointer

const decryptOk = Crypt32.CryptUnprotectData(
  ciphertextBlob.ptr,
  descPtrBuf.ptr,
  null,  // no entropy
  null,  // reserved
  null,  // no prompt struct
  0,     // no flags
  decryptedBlob.ptr,
);

if (!decryptOk) {
  console.error('  CryptUnprotectData FAILED');
  process.exit(1);
}

const decrypted = readDataBlob(decryptedBlob);
const decryptedBytes = Buffer.from(toArrayBuffer(decrypted.pbData as unknown as Pointer, 0, decrypted.cbData));
const recoveredMessage = decryptedBytes.toString('utf8');

console.log(`  Decrypted ${decrypted.cbData} bytes`);
console.log(`  Recovered: "${recoveredMessage}"`);

// Step 6: Verification
console.log('\n--- Step 6: Verification ---\n');

const verified = recoveredMessage === SECRET_MESSAGE;
console.log(`  Original:  "${SECRET_MESSAGE}"`);
console.log(`  Recovered: "${recoveredMessage}"`);
console.log(`  Match:     ${verified ? 'PERFECT MATCH' : 'MISMATCH!'}`);

// Cleanup: free DPAPI-allocated buffers
Kernel32.LocalFree(encrypted.pbData);
Kernel32.LocalFree(decrypted.pbData);

console.log('\n+------------------------------------------------------------+');
console.log(`|  VAULT STATUS: ${verified ? 'SECURE - All operations verified' : 'COMPROMISED - Verification failed!'}     |`);
console.log('+------------------------------------------------------------+');
