/**
 * Secret Capsule
 *
 * Encrypts a plaintext secret into a self-contained, password-protected capsule
 * using AES-256-GCM with a PBKDF2-derived key, then verifies the roundtrip by
 * decrypting it back. Every value in the capsule (salt, nonce, tag, ciphertext,
 * iteration count) is produced by Windows CNG. The result is a single
 * base64-encoded string that carries everything needed to decrypt it — only the
 * password is held out-of-band.
 *
 * APIs demonstrated:
 *   - Bcrypt.BCryptOpenAlgorithmProvider   (AES provider)
 *   - Bcrypt.BCryptCloseAlgorithmProvider  (provider teardown)
 *   - Bcrypt.BCryptGenRandom               (salt, nonce)
 *   - Bcrypt.BCryptDeriveKeyPBKDF2         (password → 256-bit key)
 *   - Bcrypt.BCryptGenerateSymmetricKey    (AES key handle)
 *   - Bcrypt.BCryptSetProperty             (GCM chain mode)
 *   - Bcrypt.BCryptGetProperty             (auth tag length, key object length)
 *   - Bcrypt.BCryptEncrypt                 (AES-256-GCM with AAD)
 *   - Bcrypt.BCryptDecrypt                 (AES-256-GCM with tag verify)
 *   - Bcrypt.BCryptDestroyKey              (secure teardown)
 *
 * Run: bun run example/secret-capsule.ts "my secret text" "my-password"
 */

import { read } from 'bun:ffi';

import Bcrypt, {
  BCRYPT_AES_ALGORITHM,
  BCRYPT_AUTH_TAG_LENGTH,
  BCRYPT_CHAIN_MODE_GCM,
  BCRYPT_CHAINING_MODE,
  BCRYPT_HMAC_SHA256_ALG_HANDLE,
  BCRYPT_OBJECT_LENGTH,
  BCryptGenRandomFlags,
  type BCRYPT_ALG_HANDLE,
  type BCRYPT_KEY_HANDLE,
} from '../index';

Bcrypt.Preload([
  'BCryptCloseAlgorithmProvider',
  'BCryptDecrypt',
  'BCryptDeriveKeyPBKDF2',
  'BCryptDestroyKey',
  'BCryptEncrypt',
  'BCryptGenRandom',
  'BCryptGenerateSymmetricKey',
  'BCryptGetProperty',
  'BCryptOpenAlgorithmProvider',
  'BCryptSetProperty',
]);

const ANSI = {
  bold: '\x1b[1m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  magenta: '\x1b[35m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
  yellow: '\x1b[33m',
} as const;

const CAPSULE_MAGIC = Buffer.from('BCAP', 'ascii');
const CAPSULE_VERSION = 1;
const PBKDF2_ITERATIONS = 600_000n;
const SALT_BYTES = 16;
const NONCE_BYTES = 12;
const KEY_BYTES = 32;

function wideString(value: string): Buffer {
  return Buffer.from(value + '\0', 'utf16le');
}

function requireSuccess(label: string, status: number): void {
  if (status < 0) {
    throw new Error(`${label} failed with NTSTATUS 0x${(status >>> 0).toString(16).padStart(8, '0')}`);
  }
}

function getUint32Property(handle: BCRYPT_ALG_HANDLE | BCRYPT_KEY_HANDLE, name: string): number {
  const nameBuf = wideString(name);
  const out = Buffer.alloc(4);
  const written = Buffer.alloc(4);
  requireSuccess(`BCryptGetProperty(${name})`, Bcrypt.BCryptGetProperty(handle, nameBuf.ptr!, out.ptr!, out.byteLength, written.ptr!, 0));
  return out.readUInt32LE(0);
}

function openAesAlgorithm(): { close(): void; handle: BCRYPT_ALG_HANDLE } {
  const algIdBuf = wideString(BCRYPT_AES_ALGORITHM);
  const handleOut = Buffer.alloc(8);
  requireSuccess('BCryptOpenAlgorithmProvider(AES)', Bcrypt.BCryptOpenAlgorithmProvider(handleOut.ptr!, algIdBuf.ptr!, null, 0));
  const handle = BigInt(read.u64(handleOut.ptr!, 0));

  const modeBuffer = wideString(BCRYPT_CHAIN_MODE_GCM);
  const modeName = wideString(BCRYPT_CHAINING_MODE);
  requireSuccess('BCryptSetProperty(ChainingMode=GCM)', Bcrypt.BCryptSetProperty(handle, modeName.ptr!, modeBuffer.ptr!, modeBuffer.byteLength, 0));

  return {
    close: () => {
      Bcrypt.BCryptCloseAlgorithmProvider(handle, 0);
    },
    handle,
  };
}

function randomBytes(byteCount: number): Buffer {
  const buffer = Buffer.alloc(byteCount);
  requireSuccess('BCryptGenRandom', Bcrypt.BCryptGenRandom(0n, buffer.ptr!, buffer.byteLength, BCryptGenRandomFlags.BCRYPT_USE_SYSTEM_PREFERRED_RNG));
  return buffer;
}

function derivePassphraseKey(password: string, salt: Buffer, iterations: bigint): Buffer {
  const passwordBuffer = Buffer.from(password, 'utf8');
  const derivedKey = Buffer.alloc(KEY_BYTES);
  requireSuccess('BCryptDeriveKeyPBKDF2', Bcrypt.BCryptDeriveKeyPBKDF2(BCRYPT_HMAC_SHA256_ALG_HANDLE, passwordBuffer.ptr!, passwordBuffer.byteLength, salt.ptr!, salt.byteLength, iterations, derivedKey.ptr!, derivedKey.byteLength, 0));
  return derivedKey;
}

function openAesGcmKey(algHandle: BCRYPT_ALG_HANDLE, keyMaterial: Buffer): { destroy(): void; handle: BCRYPT_KEY_HANDLE; tagLength: number } {
  const keyObjectSize = getUint32Property(algHandle, BCRYPT_OBJECT_LENGTH);
  const keyObject = Buffer.alloc(keyObjectSize);
  const handleOut = Buffer.alloc(8);
  requireSuccess('BCryptGenerateSymmetricKey', Bcrypt.BCryptGenerateSymmetricKey(algHandle, handleOut.ptr!, keyObject.ptr!, keyObject.byteLength, keyMaterial.ptr!, keyMaterial.byteLength, 0));
  const handle = BigInt(read.u64(handleOut.ptr!, 0));

  const tagLengthsBuffer = Buffer.alloc(12);
  const tagInfoName = wideString(BCRYPT_AUTH_TAG_LENGTH);
  const written = Buffer.alloc(4);
  requireSuccess('BCryptGetProperty(AuthTagLength)', Bcrypt.BCryptGetProperty(algHandle, tagInfoName.ptr!, tagLengthsBuffer.ptr!, tagLengthsBuffer.byteLength, written.ptr!, 0));
  const tagLength = tagLengthsBuffer.readUInt32LE(4);

  return {
    destroy: () => {
      Bcrypt.BCryptDestroyKey(handle);
      keyObject.fill(0);
    },
    handle,
    tagLength,
  };
}

function buildAuthInfo(nonce: Buffer, tag: Buffer, authData: Buffer): Buffer {
  const authInfo = Buffer.alloc(88);
  authInfo.writeUInt32LE(88, 0);
  authInfo.writeUInt32LE(1, 4);
  authInfo.writeBigUInt64LE(BigInt(nonce.ptr as number), 8);
  authInfo.writeUInt32LE(nonce.byteLength, 16);
  authInfo.writeBigUInt64LE(BigInt(authData.ptr as number), 24);
  authInfo.writeUInt32LE(authData.byteLength, 32);
  authInfo.writeBigUInt64LE(BigInt(tag.ptr as number), 40);
  authInfo.writeUInt32LE(tag.byteLength, 48);
  return authInfo;
}

function encryptCapsule(plaintext: string, password: string): string {
  const salt = randomBytes(SALT_BYTES);
  const nonce = randomBytes(NONCE_BYTES);
  const plaintextBuffer = Buffer.from(plaintext, 'utf8');
  const keyMaterial = derivePassphraseKey(password, salt, PBKDF2_ITERATIONS);
  const provider = openAesAlgorithm();
  const { destroy, handle, tagLength } = openAesGcmKey(provider.handle, keyMaterial);

  try {
    const ciphertext = Buffer.alloc(plaintextBuffer.byteLength);
    const tag = Buffer.alloc(tagLength);
    const aad = Buffer.concat([CAPSULE_MAGIC, Buffer.from([CAPSULE_VERSION]), salt, nonce]);
    const authInfo = buildAuthInfo(nonce, tag, aad);
    const written = Buffer.alloc(4);
    requireSuccess('BCryptEncrypt', Bcrypt.BCryptEncrypt(handle, plaintextBuffer.ptr!, plaintextBuffer.byteLength, authInfo.ptr!, null, 0, ciphertext.ptr!, ciphertext.byteLength, written.ptr!, 0));

    const iterationBytes = Buffer.alloc(8);
    iterationBytes.writeBigUInt64LE(PBKDF2_ITERATIONS, 0);
    const payload = Buffer.concat([CAPSULE_MAGIC, Buffer.from([CAPSULE_VERSION, tagLength]), iterationBytes, salt, nonce, tag, ciphertext]);
    return payload.toString('base64');
  } finally {
    destroy();
    provider.close();
    keyMaterial.fill(0);
  }
}

function decryptCapsule(capsule: string, password: string): string {
  const payload = Buffer.from(capsule, 'base64');
  if (!payload.subarray(0, 4).equals(CAPSULE_MAGIC)) {
    throw new Error('Capsule magic mismatch — not a valid BCAP capsule.');
  }

  const version = payload.readUInt8(4);
  if (version !== CAPSULE_VERSION) {
    throw new Error(`Unsupported capsule version ${version}.`);
  }

  const tagLength = payload.readUInt8(5);
  const iterations = payload.readBigUInt64LE(6);
  let offset = 14;
  const salt = payload.subarray(offset, offset + SALT_BYTES);
  offset += SALT_BYTES;
  const nonce = payload.subarray(offset, offset + NONCE_BYTES);
  offset += NONCE_BYTES;
  const tag = payload.subarray(offset, offset + tagLength);
  offset += tagLength;
  const ciphertext = payload.subarray(offset);

  const saltCopy = Buffer.from(salt);
  const nonceCopy = Buffer.from(nonce);
  const tagCopy = Buffer.from(tag);
  const ciphertextCopy = Buffer.from(ciphertext);

  const keyMaterial = derivePassphraseKey(password, saltCopy, iterations);
  const provider = openAesAlgorithm();
  const { destroy, handle } = openAesGcmKey(provider.handle, keyMaterial);

  try {
    const plaintext = Buffer.alloc(ciphertextCopy.byteLength);
    const aad = Buffer.concat([CAPSULE_MAGIC, Buffer.from([CAPSULE_VERSION]), saltCopy, nonceCopy]);
    const authInfo = buildAuthInfo(nonceCopy, tagCopy, aad);
    const written = Buffer.alloc(4);
    const status = Bcrypt.BCryptDecrypt(handle, ciphertextCopy.ptr!, ciphertextCopy.byteLength, authInfo.ptr!, null, 0, plaintext.ptr!, plaintext.byteLength, written.ptr!, 0);
    if (status < 0) {
      throw new Error(`BCryptDecrypt failed — auth tag mismatch or wrong password (NTSTATUS 0x${(status >>> 0).toString(16).padStart(8, '0')}).`);
    }
    return plaintext.subarray(0, written.readUInt32LE(0)).toString('utf8');
  } finally {
    destroy();
    provider.close();
    keyMaterial.fill(0);
  }
}

function formatDuration(millis: number): string {
  if (millis < 1000) return `${millis.toFixed(1)} ms`;
  return `${(millis / 1000).toFixed(2)} s`;
}

const args = Bun.argv.slice(2);
const plaintext = args[0] ?? 'The quick brown fox jumps over the lazy dog. 🦊';
const password = args[1] ?? 'correct-horse-battery-staple';

console.log(`${ANSI.bold}${ANSI.cyan}Secret Capsule${ANSI.reset}`);
console.log(`${ANSI.dim}AES-256-GCM · PBKDF2(${PBKDF2_ITERATIONS}) · CNG${ANSI.reset}`);
console.log('');

console.log(`${ANSI.bold}Plaintext${ANSI.reset}`);
console.log(`  ${ANSI.yellow}${plaintext}${ANSI.reset}`);
console.log(`  ${ANSI.dim}${Buffer.byteLength(plaintext, 'utf8')} bytes${ANSI.reset}`);
console.log('');

const encryptStart = performance.now();
const capsule = encryptCapsule(plaintext, password);
const encryptMillis = performance.now() - encryptStart;

console.log(`${ANSI.bold}Capsule${ANSI.reset} ${ANSI.dim}(encrypted in ${formatDuration(encryptMillis)})${ANSI.reset}`);
const lineLength = 64;
for (let i = 0; i < capsule.length; i += lineLength) {
  console.log(`  ${ANSI.magenta}${capsule.slice(i, i + lineLength)}${ANSI.reset}`);
}
console.log('');

const decryptStart = performance.now();
const recovered = decryptCapsule(capsule, password);
const decryptMillis = performance.now() - decryptStart;

console.log(`${ANSI.bold}Decrypted${ANSI.reset} ${ANSI.dim}(decrypted in ${formatDuration(decryptMillis)})${ANSI.reset}`);
console.log(`  ${ANSI.green}${recovered}${ANSI.reset}`);
console.log('');

const roundtripMatches = recovered === plaintext;
console.log(`${ANSI.bold}Roundtrip${ANSI.reset}  ${roundtripMatches ? `${ANSI.green}ok${ANSI.reset}` : `${ANSI.red}mismatch${ANSI.reset}`}`);

console.log('');
console.log(`${ANSI.bold}Tamper check${ANSI.reset}`);
const tampered = Buffer.from(capsule, 'base64');
tampered[tampered.byteLength - 1] ^= 0x01;
try {
  decryptCapsule(tampered.toString('base64'), password);
  console.log(`  ${ANSI.red}unexpected: tampered capsule decrypted${ANSI.reset}`);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.log(`  ${ANSI.green}rejected:${ANSI.reset} ${ANSI.dim}${message}${ANSI.reset}`);
}
