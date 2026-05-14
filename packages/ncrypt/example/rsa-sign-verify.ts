/**
 * RSA Sign · Verify · Tamper
 *
 * Spins up an ephemeral RSA-2048 key inside the Microsoft Software KSP, hashes
 * a message with SHA-256, signs the hash with NCryptSignHash (PKCS#1 v1.5),
 * verifies the signature with NCryptVerifySignature, then deliberately flips
 * a single byte in the signature and re-verifies — proving the tamper detection
 * works end-to-end. The signature is rendered as a colored hex grid so the bit
 * that gets flipped is visible at a glance.
 *
 * APIs demonstrated:
 *   - NCryptOpenStorageProvider    (open Microsoft Software KSP)
 *   - NCryptCreatePersistedKey     (create an ephemeral RSA key — pszKeyName=NULL)
 *   - NCryptSetProperty            (override default key length)
 *   - NCryptGetProperty            (read back algorithm group, key length)
 *   - NCryptFinalizeKey            (lock the key — required before use)
 *   - NCryptSignHash               (sign a SHA-256 hash with PKCS#1 padding)
 *   - NCryptVerifySignature        (verify the signature, then re-verify after tampering)
 *   - NCryptFreeObject             (release key + provider handles)
 *
 * Run: bun run example/rsa-sign-verify.ts "your message here"
 */

import { createHash } from 'node:crypto';

import { type Pointer, read } from 'bun:ffi';

import Ncrypt, { MS_KEY_STORAGE_PROVIDER, NCryptPaddingFlags, NCRYPT_ALGORITHM_GROUP_PROPERTY, NCRYPT_LENGTH_PROPERTY, NCRYPT_RSA_ALGORITHM, NCRYPT_SHA256_ALGORITHM } from '../index';

Ncrypt.Preload(['NCryptCreatePersistedKey', 'NCryptFinalizeKey', 'NCryptFreeObject', 'NCryptGetProperty', 'NCryptOpenStorageProvider', 'NCryptSetProperty', 'NCryptSignHash', 'NCryptVerifySignature']);

const ANSI = {
  bold: '\x1b[1m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  magenta: '\x1b[35m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
} as const;

function wide(value: string): Buffer {
  return Buffer.from(value + '\0', 'utf16le');
}

function statusHex(status: number): string {
  return '0x' + (status >>> 0).toString(16).padStart(8, '0');
}

function checkStatus(label: string, status: number): void {
  if (status !== 0) {
    throw new Error(`${label} failed with ${statusHex(status)}`);
  }
}

function readWideString(addr: Pointer, byteLength: number): string {
  // Read up to byteLength bytes, then strip the trailing NUL pair.
  const bytes = Buffer.alloc(byteLength);
  for (let i = 0; i < byteLength; i++) {
    bytes[i] = read.u8(addr, i);
  }
  return bytes.toString('utf16le').replace(/\0+$/, '');
}

// BCRYPT_PKCS1_PADDING_INFO { LPCWSTR pszAlgId; } — single 8-byte pointer on x64.
function buildPkcs1PaddingInfo(hashAlgorithm: string): { struct: Buffer; algBuf: Buffer } {
  const algBuf = wide(hashAlgorithm);
  const struct = Buffer.alloc(8);
  struct.writeBigUInt64LE(BigInt(algBuf.ptr as number), 0);
  return { struct, algBuf };
}

function colorByte(byte: number): string {
  // Map each byte to a soft palette gradient (cyan → magenta → yellow → green)
  // so the hex dump has visual texture and tampering jumps out.
  const palette = [ANSI.cyan, ANSI.magenta, ANSI.yellow, ANSI.green, ANSI.blue];
  return palette[byte % palette.length] ?? ANSI.reset;
}

function renderHexGrid(label: string, bytes: Buffer, highlightIndex?: number): void {
  const width = 32;
  console.log(`${ANSI.bold}${label}${ANSI.reset} ${ANSI.dim}(${bytes.byteLength} bytes)${ANSI.reset}`);
  for (let row = 0; row < bytes.byteLength; row += width) {
    const offsetLabel = `${ANSI.dim}${row.toString(16).padStart(4, '0')}${ANSI.reset}`;
    const parts: string[] = [offsetLabel, ' '];
    for (let col = 0; col < width; col++) {
      const i = row + col;
      if (i >= bytes.byteLength) break;
      const byte = bytes[i] ?? 0;
      const hex = byte.toString(16).padStart(2, '0');
      if (i === highlightIndex) {
        parts.push(`${ANSI.bgRed}${ANSI.bold}${hex}${ANSI.reset}`);
      } else {
        parts.push(`${colorByte(byte)}${hex}${ANSI.reset}`);
      }
    }
    console.log(parts.join(''));
  }
}

const message = Bun.argv[2] ?? 'Trust, but verify.';
console.log(`${ANSI.bold}${ANSI.cyan}RSA Sign · Verify · Tamper${ANSI.reset}`);
console.log(`${ANSI.dim}ncrypt.dll · RSA-2048 · SHA-256 · PKCS#1 v1.5${ANSI.reset}`);
console.log('');

console.log(`${ANSI.bold}Message${ANSI.reset}`);
console.log(`  ${ANSI.yellow}${message}${ANSI.reset}`);
console.log(`  ${ANSI.dim}${Buffer.byteLength(message, 'utf8')} bytes${ANSI.reset}`);
console.log('');

// 1. Open the Microsoft Software KSP.
const providerName = wide(MS_KEY_STORAGE_PROVIDER);
const provHandleOut = Buffer.alloc(8);
checkStatus('NCryptOpenStorageProvider', Ncrypt.NCryptOpenStorageProvider(provHandleOut.ptr!, providerName.ptr!, 0));
const hProv = BigInt(read.u64(provHandleOut.ptr!, 0));
console.log(`${ANSI.green}✓${ANSI.reset} provider opened   ${ANSI.dim}handle 0x${hProv.toString(16)}${ANSI.reset}`);

try {
  // 2. Create an ephemeral RSA key — pszKeyName=NULL means it lives only in memory and dies with the process.
  const algId = wide(NCRYPT_RSA_ALGORITHM);
  const keyHandleOut = Buffer.alloc(8);
  checkStatus('NCryptCreatePersistedKey', Ncrypt.NCryptCreatePersistedKey(hProv, keyHandleOut.ptr!, algId.ptr!, null, 0, 0));
  const hKey = BigInt(read.u64(keyHandleOut.ptr!, 0));
  console.log(`${ANSI.green}✓${ANSI.reset} key created      ${ANSI.dim}handle 0x${hKey.toString(16)}${ANSI.reset}`);

  try {
    // 3. Set length to 2048 bits, then finalize.
    const keyLength = Buffer.alloc(4);
    keyLength.writeUInt32LE(2048, 0);
    const lengthProp = wide(NCRYPT_LENGTH_PROPERTY);
    checkStatus('NCryptSetProperty(length=2048)', Ncrypt.NCryptSetProperty(hKey, lengthProp.ptr!, keyLength.ptr!, keyLength.byteLength, 0));
    console.log(`${ANSI.green}✓${ANSI.reset} length set       ${ANSI.dim}2048 bits${ANSI.reset}`);

    const finalizeStart = performance.now();
    checkStatus('NCryptFinalizeKey', Ncrypt.NCryptFinalizeKey(hKey, 0));
    const finalizeMillis = performance.now() - finalizeStart;
    console.log(`${ANSI.green}✓${ANSI.reset} key finalized    ${ANSI.dim}${finalizeMillis.toFixed(1)} ms${ANSI.reset}`);

    // 4. Read back two properties to prove the key is real.
    const groupProp = wide(NCRYPT_ALGORITHM_GROUP_PROPERTY);
    const groupBuf = Buffer.alloc(128);
    const written = Buffer.alloc(4);
    checkStatus('NCryptGetProperty(group)', Ncrypt.NCryptGetProperty(hKey, groupProp.ptr!, groupBuf.ptr!, groupBuf.byteLength, written.ptr!, 0));
    const group = readWideString(groupBuf.ptr!, written.readUInt32LE(0));
    const lengthOut = Buffer.alloc(4);
    checkStatus('NCryptGetProperty(length)', Ncrypt.NCryptGetProperty(hKey, lengthProp.ptr!, lengthOut.ptr!, lengthOut.byteLength, written.ptr!, 0));
    console.log(`${ANSI.green}✓${ANSI.reset} key inspected    ${ANSI.dim}group=${group} length=${lengthOut.readUInt32LE(0)}${ANSI.reset}`);
    console.log('');

    // 5. Hash the message with SHA-256 (any well-known hash is fine; we just need a 32-byte digest).
    const digest = createHash('sha256').update(message).digest();
    renderHexGrid('SHA-256 digest', digest);
    console.log('');

    // 6. Sign the digest. First call: pbSignature=NULL to ask for the signature size.
    const padding = buildPkcs1PaddingInfo(NCRYPT_SHA256_ALGORITHM);
    const sigSize = Buffer.alloc(4);
    checkStatus('NCryptSignHash(size)', Ncrypt.NCryptSignHash(hKey, padding.struct.ptr!, digest.ptr!, digest.byteLength, null, 0, sigSize.ptr!, NCryptPaddingFlags.NCRYPT_PAD_PKCS1_FLAG));
    const signature = Buffer.alloc(sigSize.readUInt32LE(0));
    const signStart = performance.now();
    checkStatus('NCryptSignHash', Ncrypt.NCryptSignHash(hKey, padding.struct.ptr!, digest.ptr!, digest.byteLength, signature.ptr!, signature.byteLength, sigSize.ptr!, NCryptPaddingFlags.NCRYPT_PAD_PKCS1_FLAG));
    const signMillis = performance.now() - signStart;
    console.log(`${ANSI.green}✓${ANSI.reset} signed           ${ANSI.dim}${signature.byteLength} bytes in ${signMillis.toFixed(1)} ms${ANSI.reset}`);
    console.log('');
    renderHexGrid('Signature', signature);
    console.log('');

    // 7. Verify the signature — should succeed.
    const verifyStart = performance.now();
    const verifyStatus = Ncrypt.NCryptVerifySignature(hKey, padding.struct.ptr!, digest.ptr!, digest.byteLength, signature.ptr!, signature.byteLength, NCryptPaddingFlags.NCRYPT_PAD_PKCS1_FLAG);
    const verifyMillis = performance.now() - verifyStart;
    if (verifyStatus === 0) {
      console.log(`  ${ANSI.bgGreen}${ANSI.bold} VERIFIED ${ANSI.reset}  ${ANSI.dim}NCryptVerifySignature returned 0 in ${verifyMillis.toFixed(1)} ms${ANSI.reset}`);
    } else {
      console.log(`  ${ANSI.red}${ANSI.bold}UNEXPECTED:${ANSI.reset} verification failed (${statusHex(verifyStatus)})`);
    }
    console.log('');

    // 8. Tamper with the signature. Flip the LSB of a byte roughly in the middle so a viewer can see it.
    const tamperIndex = Math.floor(signature.byteLength / 2);
    const tampered = Buffer.from(signature);
    const originalByte = tampered[tamperIndex];
    tampered[tamperIndex] = originalByte === undefined ? 0 : originalByte ^ 0x01;
    console.log(
      `${ANSI.bold}Tampered signature${ANSI.reset} ${ANSI.dim}(flipped byte at offset 0x${tamperIndex.toString(16)}: 0x${originalByte!.toString(16).padStart(2, '0')} → 0x${tampered[tamperIndex]!.toString(16).padStart(2, '0')})${ANSI.reset}`,
    );
    renderHexGrid('Tampered signature', tampered, tamperIndex);
    console.log('');

    const tamperStart = performance.now();
    const tamperedStatus = Ncrypt.NCryptVerifySignature(hKey, padding.struct.ptr!, digest.ptr!, digest.byteLength, tampered.ptr!, tampered.byteLength, NCryptPaddingFlags.NCRYPT_PAD_PKCS1_FLAG);
    const tamperMillis = performance.now() - tamperStart;
    if (tamperedStatus !== 0) {
      console.log(`  ${ANSI.bgRed}${ANSI.bold} REJECTED ${ANSI.reset}  ${ANSI.dim}NCryptVerifySignature returned ${statusHex(tamperedStatus)} in ${tamperMillis.toFixed(1)} ms${ANSI.reset}`);
      console.log(`  ${ANSI.dim}A single bit flip breaks the entire signature — exactly what RSA-PKCS1 guarantees.${ANSI.reset}`);
    } else {
      console.log(`  ${ANSI.red}${ANSI.bold}UNEXPECTED:${ANSI.reset} tampered signature was accepted`);
    }
  } finally {
    Ncrypt.NCryptFreeObject(hKey);
  }
} finally {
  Ncrypt.NCryptFreeObject(hProv);
}
