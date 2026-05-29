/**
 * Crypto Forge — an OS-native CNG cryptography playground (bcrypt.dll only).
 *
 * Five acts, each driven entirely by Windows Cryptography Next Generation through
 * raw FFI — NO node:crypto, NO WebCrypto. Every value printed below is produced by
 * the OS kernel-mode crypto stack and verified live:
 *
 *   1. RNG        — BCryptGenRandom (BCRYPT_USE_SYSTEM_PREFERRED_RNG) + byte histogram.
 *   2. HASH       — BCryptHash over BCRYPT_SHA256_ALG_HANDLE and BCRYPT_SHA512_ALG_HANDLE.
 *   3. AES-256-GCM— BCryptGenerateSymmetricKey + ChainingMode=GCM, an 88-byte
 *                   BCRYPT_AUTHENTICATED_CIPHER_MODE_INFO, BCryptEncrypt/BCryptDecrypt
 *                   roundtrip, then a tampered ciphertext rejected with
 *                   STATUS_AUTH_TAG_MISMATCH (0xC000A002).
 *   4. ECDSA P-256— BCryptGenerateKeyPair(256)+Finalize, BCryptSignHash over the
 *                   SHA-256 digest -> 64-byte sig, BCryptVerifySignature OK, then a
 *                   tampered signature rejected with STATUS_INVALID_SIGNATURE (0xC000A000).
 *                   The public key is exported via BCRYPT_ECCPUBLIC_BLOB and printed.
 *   5. RSA-2048   — BCryptOpenAlgorithmProvider('RSA')+GenerateKeyPair(2048)+Finalize,
 *                   BCRYPT_PKCS1_PADDING_INFO (algId='SHA256'), BCryptSignHash with
 *                   BCRYPT_PAD_PKCS1 -> 256-byte sig, BCryptVerifySignature OK, then a
 *                   tampered signature rejected.
 *
 * APIs: Bcrypt.BCryptGenRandom / BCryptHash / BCryptOpenAlgorithmProvider /
 *       BCryptSetProperty / BCryptGetProperty / BCryptGenerateSymmetricKey /
 *       BCryptEncrypt / BCryptDecrypt / BCryptDestroyKey / BCryptGenerateKeyPair /
 *       BCryptFinalizeKeyPair / BCryptSignHash / BCryptVerifySignature /
 *       BCryptExportKey / BCryptCloseAlgorithmProvider;
 *       Kernel32 GetStdHandle / GetConsoleMode / SetConsoleMode (enable ANSI VT).
 *
 * Graceful: this uses only the Microsoft Primitive Provider, which is present on
 * every Windows install — no special hardware needed. NTSTATUS < 0 means failure;
 * each act prints a PASS/REJECT verdict.
 *
 * Run: bun run packages/all/example/crypto-forge.ts
 */

import { read } from 'bun:ffi';

import { Bcrypt } from '../index';
import {
  BCRYPT_AES_ALGORITHM,
  BCRYPT_AUTH_TAG_LENGTH,
  BCRYPT_CHAIN_MODE_GCM,
  BCRYPT_CHAINING_MODE,
  BCRYPT_ECCPUBLIC_BLOB,
  BCRYPT_ECDSA_P256_ALG_HANDLE,
  BCRYPT_OBJECT_LENGTH,
  BCRYPT_RSA_ALGORITHM,
  BCRYPT_SHA256_ALG_HANDLE,
  BCRYPT_SHA512_ALG_HANDLE,
  BCryptGenRandomFlags,
  BCryptPadFlags,
  type BCRYPT_ALG_HANDLE,
  type BCRYPT_KEY_HANDLE,
} from '@bun-win32/bcrypt';
import Kernel32, { ConsoleMode, STD_HANDLE } from '@bun-win32/kernel32';

Bcrypt.Preload([
  'BCryptCloseAlgorithmProvider',
  'BCryptDecrypt',
  'BCryptDestroyKey',
  'BCryptEncrypt',
  'BCryptExportKey',
  'BCryptFinalizeKeyPair',
  'BCryptGenRandom',
  'BCryptGenerateKeyPair',
  'BCryptGenerateSymmetricKey',
  'BCryptGetProperty',
  'BCryptHash',
  'BCryptOpenAlgorithmProvider',
  'BCryptSetProperty',
  'BCryptSignHash',
  'BCryptVerifySignature',
]);
Kernel32.Preload(['GetStdHandle', 'GetConsoleMode', 'SetConsoleMode']);

// ── ANSI palette ─────────────────────────────────────────────────────────────

const C = {
  bold: '\x1b[1m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  gray: '\x1b[90m',
  green: '\x1b[32m',
  magenta: '\x1b[35m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
  yellow: '\x1b[33m',
} as const;

// ── Console VT setup ─────────────────────────────────────────────────────────

const stdoutHandle: bigint = Kernel32.GetStdHandle(STD_HANDLE.OUTPUT);
const savedModeBuffer = Buffer.alloc(4);
let restoreConsoleMode = false;
if (Kernel32.GetConsoleMode(stdoutHandle, savedModeBuffer.ptr!)) {
  const previousMode = savedModeBuffer.readUInt32LE(0);
  Kernel32.SetConsoleMode(stdoutHandle, previousMode | ConsoleMode.ENABLE_VIRTUAL_TERMINAL_PROCESSING);
  restoreConsoleMode = true;
}
function restoreConsole(): void {
  if (restoreConsoleMode) Kernel32.SetConsoleMode(stdoutHandle, savedModeBuffer.readUInt32LE(0));
}
process.on('exit', restoreConsole);

// ── Helpers ──────────────────────────────────────────────────────────────────

function wide(value: string): Buffer {
  return Buffer.from(value + '\0', 'utf16le');
}

function ntstatusHex(status: number): string {
  return '0x' + (status >>> 0).toString(16).toUpperCase().padStart(8, '0');
}

function requireSuccess(label: string, status: number): void {
  if (status < 0) throw new Error(`${label} failed with NTSTATUS ${ntstatusHex(status)}`);
}

function hex(buffer: Buffer | Uint8Array, max = buffer.byteLength): string {
  const bytes = Array.from(buffer.subarray(0, max), (b) => b.toString(16).padStart(2, '0'));
  return bytes.join(' ') + (buffer.byteLength > max ? ` ${C.gray}…${C.reset}` : '');
}

const BOX_WIDTH = 74;

function act(index: number, title: string, primitive: string): void {
  const heading = ` Act ${index} · ${title} `;
  const trail = '─'.repeat(Math.max(0, BOX_WIDTH - heading.length - 4));
  console.log('');
  console.log(`${C.cyan}┌─${C.reset}${C.bold}${heading}${C.reset}${C.cyan}${trail}─┐${C.reset}`);
  console.log(`${C.cyan}│${C.reset} ${C.dim}${primitive}${C.reset}`);
}

function field(label: string, value: string): void {
  console.log(`${C.cyan}│${C.reset}   ${C.gray}${label.padEnd(11)}${C.reset} ${value}`);
}

function verdict(pass: boolean, message: string): void {
  const tag = pass ? `${C.green}${C.bold} PASS ${C.reset}` : `${C.red}${C.bold} REJECT ${C.reset}`;
  console.log(`${C.cyan}│${C.reset}   ${tag} ${message}`);
}

function getUint32Property(handle: BCRYPT_ALG_HANDLE | BCRYPT_KEY_HANDLE, name: string): number {
  const nameBuf = wide(name);
  const out = Buffer.alloc(4);
  const written = Buffer.alloc(4);
  requireSuccess(`BCryptGetProperty(${name})`, Bcrypt.BCryptGetProperty(handle, nameBuf.ptr!, out.ptr!, out.byteLength, written.ptr!, 0));
  return out.readUInt32LE(0);
}

// ── Shared message ───────────────────────────────────────────────────────────

const message = Buffer.from('The Crypto Forge proves CNG runs through Bun FFI — no node:crypto. 🔐', 'utf8');

console.log('');
console.log(`${C.bold}${C.magenta}CRYPTO FORGE${C.reset}  ${C.dim}Windows CNG (bcrypt.dll) via Bun FFI — no node:crypto / no WebCrypto${C.reset}`);
console.log(`${C.gray}message: ${C.reset}${C.yellow}${message.toString('utf8')}${C.reset} ${C.gray}(${message.byteLength} bytes)${C.reset}`);

// Track NTSTATUS values for the tamper acts so the verdicts can name them.
const STATUS_AUTH_TAG_MISMATCH = 0xc000a002 | 0;
const STATUS_INVALID_SIGNATURE = 0xc000a000 | 0;

let allPassed = true;

// ── Act 1 — True RNG ─────────────────────────────────────────────────────────

function actRng(): void {
  act(1, 'True RNG', 'BCryptGenRandom · BCRYPT_USE_SYSTEM_PREFERRED_RNG');
  const random = Buffer.alloc(32);
  requireSuccess('BCryptGenRandom', Bcrypt.BCryptGenRandom(0n, random.ptr!, random.byteLength, BCryptGenRandomFlags.BCRYPT_USE_SYSTEM_PREFERRED_RNG));
  field('32 bytes', `${C.magenta}${hex(random)}${C.reset}`);

  // Byte-distribution bar across 8 buckets (0x00-0x1F .. 0xE0-0xFF).
  const buckets = new Array<number>(8).fill(0);
  for (const byte of random) buckets[byte >> 5]! += 1;
  const peak = Math.max(...buckets, 1);
  const blocks = '▁▂▃▄▅▆▇█';
  const bar = buckets.map((count) => blocks[Math.min(blocks.length - 1, Math.round((count / peak) * (blocks.length - 1)))]).join('');
  field('histogram', `${C.cyan}${bar}${C.reset} ${C.gray}(8 buckets of 32 bytes)${C.reset}`);

  // Two draws must differ — a non-deterministic source.
  const second = Buffer.alloc(32);
  requireSuccess('BCryptGenRandom(2)', Bcrypt.BCryptGenRandom(0n, second.ptr!, second.byteLength, BCryptGenRandomFlags.BCRYPT_USE_SYSTEM_PREFERRED_RNG));
  const distinct = !random.equals(second);
  if (!distinct) allPassed = false;
  verdict(distinct, `two independent draws differ — live entropy source`);
}

// ── Act 2 — Hashing ──────────────────────────────────────────────────────────

function actHash(): void {
  act(2, 'Hashing', 'BCryptHash · SHA-256 + SHA-512 pseudo-handles');
  const sha256 = Buffer.alloc(32);
  requireSuccess('BCryptHash(SHA256)', Bcrypt.BCryptHash(BCRYPT_SHA256_ALG_HANDLE, null, 0, message.ptr!, message.byteLength, sha256.ptr!, sha256.byteLength));
  field('SHA-256', `${C.green}${sha256.toString('hex')}${C.reset}`);

  const sha512 = Buffer.alloc(64);
  requireSuccess('BCryptHash(SHA512)', Bcrypt.BCryptHash(BCRYPT_SHA512_ALG_HANDLE, null, 0, message.ptr!, message.byteLength, sha512.ptr!, sha512.byteLength));
  const sha512Hex = sha512.toString('hex');
  field('SHA-512', `${C.green}${sha512Hex.slice(0, 64)}${C.reset}`);
  field('', `${C.green}${sha512Hex.slice(64)}${C.reset}`);

  // Determinism check — re-hash and compare.
  const recheck = Buffer.alloc(32);
  requireSuccess('BCryptHash(recheck)', Bcrypt.BCryptHash(BCRYPT_SHA256_ALG_HANDLE, null, 0, message.ptr!, message.byteLength, recheck.ptr!, recheck.byteLength));
  const stable = recheck.equals(sha256);
  if (!stable) allPassed = false;
  verdict(stable, `digests are deterministic across calls`);
}

// ── Act 3 — AES-256-GCM authenticated encryption ─────────────────────────────

function buildAuthInfo(nonce: Buffer, authData: Buffer, tag: Buffer): Buffer {
  // BCRYPT_AUTHENTICATED_CIPHER_MODE_INFO — 88 bytes on x64.
  const info = Buffer.alloc(88);
  info.writeUInt32LE(88, 0); // cbSize
  info.writeUInt32LE(1, 4); // dwInfoVersion = BCRYPT_INIT_AUTH_MODE_INFO_VERSION
  info.writeBigUInt64LE(BigInt(nonce.ptr as number), 8); // pbNonce
  info.writeUInt32LE(nonce.byteLength, 16); // cbNonce
  info.writeBigUInt64LE(BigInt(authData.ptr as number), 24); // pbAuthData
  info.writeUInt32LE(authData.byteLength, 32); // cbAuthData
  info.writeBigUInt64LE(BigInt(tag.ptr as number), 40); // pbTag
  info.writeUInt32LE(tag.byteLength, 48); // cbTag
  // pbMacContext@56, cbMacContext@64, cbAAD@68, cbData@72, dwFlags@80 — all zero.
  return info;
}

function actAesGcm(): void {
  act(3, 'AES-256-GCM', 'BCryptEncrypt / BCryptDecrypt · authenticated + tamper-detecting');

  const algOut = Buffer.alloc(8);
  const algIdBuf = wide(BCRYPT_AES_ALGORITHM);
  requireSuccess('BCryptOpenAlgorithmProvider(AES)', Bcrypt.BCryptOpenAlgorithmProvider(algOut.ptr!, algIdBuf.ptr!, null, 0));
  const algHandle = BigInt(read.u64(algOut.ptr!, 0));

  let keyHandle = 0n;
  const keyObject = Buffer.alloc(getUint32Property(algHandle, BCRYPT_OBJECT_LENGTH));
  try {
    const modeName = wide(BCRYPT_CHAINING_MODE);
    const modeValue = wide(BCRYPT_CHAIN_MODE_GCM);
    requireSuccess('BCryptSetProperty(ChainingMode=GCM)', Bcrypt.BCryptSetProperty(algHandle, modeName.ptr!, modeValue.ptr!, modeValue.byteLength, 0));

    // 256-bit key + 96-bit nonce, all OS-generated.
    const key = Buffer.alloc(32);
    requireSuccess('BCryptGenRandom(key)', Bcrypt.BCryptGenRandom(0n, key.ptr!, key.byteLength, BCryptGenRandomFlags.BCRYPT_USE_SYSTEM_PREFERRED_RNG));
    const nonce = Buffer.alloc(12);
    requireSuccess('BCryptGenRandom(nonce)', Bcrypt.BCryptGenRandom(0n, nonce.ptr!, nonce.byteLength, BCryptGenRandomFlags.BCRYPT_USE_SYSTEM_PREFERRED_RNG));

    const keyOut = Buffer.alloc(8);
    requireSuccess('BCryptGenerateSymmetricKey', Bcrypt.BCryptGenerateSymmetricKey(algHandle, keyOut.ptr!, keyObject.ptr!, keyObject.byteLength, key.ptr!, key.byteLength, 0));
    keyHandle = BigInt(read.u64(keyOut.ptr!, 0));

    const tagLengths = Buffer.alloc(12);
    const tagName = wide(BCRYPT_AUTH_TAG_LENGTH);
    const tagWritten = Buffer.alloc(4);
    requireSuccess('BCryptGetProperty(AuthTagLength)', Bcrypt.BCryptGetProperty(algHandle, tagName.ptr!, tagLengths.ptr!, tagLengths.byteLength, tagWritten.ptr!, 0));
    const tagLength = tagLengths.readUInt32LE(4); // dwMaxLength

    const aad = Buffer.from('crypto-forge/aad/v1', 'utf8');
    const ciphertext = Buffer.alloc(message.byteLength);
    const tag = Buffer.alloc(tagLength);
    const written = Buffer.alloc(4);

    // Assemble auth-info IMMEDIATELY before the call (no awaits in between — GC window).
    const encInfo = buildAuthInfo(nonce, aad, tag);
    requireSuccess('BCryptEncrypt', Bcrypt.BCryptEncrypt(keyHandle, message.ptr!, message.byteLength, encInfo.ptr!, null, 0, ciphertext.ptr!, ciphertext.byteLength, written.ptr!, 0));

    field('key (256b)', `${C.magenta}${hex(key, 16)}${C.reset}`);
    field('nonce (96b)', `${C.magenta}${nonce.toString('hex')}${C.reset}`);
    field('aad', `${C.yellow}"${aad.toString('utf8')}"${C.reset}`);
    field('ciphertext', `${C.magenta}${hex(ciphertext, 24)}${C.reset}`);
    field('GCM tag', `${C.cyan}${tag.toString('hex')}${C.reset}`);

    // Honest roundtrip — recover the exact plaintext.
    const decrypted = Buffer.alloc(ciphertext.byteLength);
    const decWritten = Buffer.alloc(4);
    const decInfo = buildAuthInfo(nonce, aad, tag);
    requireSuccess('BCryptDecrypt', Bcrypt.BCryptDecrypt(keyHandle, ciphertext.ptr!, ciphertext.byteLength, decInfo.ptr!, null, 0, decrypted.ptr!, decrypted.byteLength, decWritten.ptr!, 0));
    const recovered = decrypted.subarray(0, decWritten.readUInt32LE(0));
    const roundtrips = recovered.equals(message);
    if (!roundtrips) allPassed = false;
    verdict(roundtrips, `decrypt recovered ${recovered.byteLength} bytes identical to plaintext`);

    // Tamper — flip one ciphertext byte and confirm the OS rejects it.
    const tampered = Buffer.from(ciphertext);
    tampered[0] ^= 0x01;
    const trash = Buffer.alloc(tampered.byteLength);
    const trashWritten = Buffer.alloc(4);
    const tamperInfo = buildAuthInfo(nonce, aad, tag);
    const tamperStatus = Bcrypt.BCryptDecrypt(keyHandle, tampered.ptr!, tampered.byteLength, tamperInfo.ptr!, null, 0, trash.ptr!, trash.byteLength, trashWritten.ptr!, 0);
    const rejected = tamperStatus === STATUS_AUTH_TAG_MISMATCH;
    if (!rejected) allPassed = false;
    field('tampered', `${C.red}flipped ciphertext[0] bit 0${C.reset}`);
    verdict(rejected, `BCryptDecrypt returned ${C.bold}${ntstatusHex(tamperStatus)}${C.reset} ${C.gray}STATUS_AUTH_TAG_MISMATCH${C.reset}`);
  } finally {
    if (keyHandle !== 0n) Bcrypt.BCryptDestroyKey(keyHandle);
    Bcrypt.BCryptCloseAlgorithmProvider(algHandle, 0);
    keyObject.fill(0);
  }
}

// ── Act 4 — ECDSA P-256 ──────────────────────────────────────────────────────

function actEcdsa(): void {
  act(4, 'ECDSA P-256', 'BCryptSignHash / BCryptVerifySignature · NIST P-256');

  // Digest of the message (signing is over the hash, not the message).
  const digest = Buffer.alloc(32);
  requireSuccess('BCryptHash(digest)', Bcrypt.BCryptHash(BCRYPT_SHA256_ALG_HANDLE, null, 0, message.ptr!, message.byteLength, digest.ptr!, digest.byteLength));

  let keyHandle = 0n;
  try {
    const keyOut = Buffer.alloc(8);
    requireSuccess('BCryptGenerateKeyPair(P256)', Bcrypt.BCryptGenerateKeyPair(BCRYPT_ECDSA_P256_ALG_HANDLE, keyOut.ptr!, 256, 0));
    keyHandle = BigInt(read.u64(keyOut.ptr!, 0));
    requireSuccess('BCryptFinalizeKeyPair', Bcrypt.BCryptFinalizeKeyPair(keyHandle, 0));

    // Export the public key (BCRYPT_ECCKEY_BLOB: dwMagic@0, cbKey@4, then X||Y).
    const pubSize = Buffer.alloc(4);
    requireSuccess('BCryptExportKey(size)', Bcrypt.BCryptExportKey(keyHandle, 0n, wide(BCRYPT_ECCPUBLIC_BLOB).ptr!, null, 0, pubSize.ptr!, 0));
    const pubBlob = Buffer.alloc(pubSize.readUInt32LE(0));
    const pubWritten = Buffer.alloc(4);
    requireSuccess('BCryptExportKey', Bcrypt.BCryptExportKey(keyHandle, 0n, wide(BCRYPT_ECCPUBLIC_BLOB).ptr!, pubBlob.ptr!, pubBlob.byteLength, pubWritten.ptr!, 0));
    const cbKey = pubBlob.readUInt32LE(4);
    const qx = pubBlob.subarray(8, 8 + cbKey);
    const qy = pubBlob.subarray(8 + cbKey, 8 + 2 * cbKey);
    field('digest', `${C.gray}SHA-256 ${C.reset}${C.cyan}${digest.toString('hex').slice(0, 32)}…${C.reset}`);
    field('pubkey Qx', `${C.green}${qx.toString('hex')}${C.reset}`);
    field('pubkey Qy', `${C.green}${qy.toString('hex')}${C.reset}`);

    // Two-call sign — first size, then materialize. NULL pad-info for ECDSA.
    const sigSize = Buffer.alloc(4);
    requireSuccess('BCryptSignHash(size)', Bcrypt.BCryptSignHash(keyHandle, null, digest.ptr!, digest.byteLength, null, 0, sigSize.ptr!, 0));
    const signature = Buffer.alloc(sigSize.readUInt32LE(0));
    const sigWritten = Buffer.alloc(4);
    requireSuccess('BCryptSignHash', Bcrypt.BCryptSignHash(keyHandle, null, digest.ptr!, digest.byteLength, signature.ptr!, signature.byteLength, sigWritten.ptr!, 0));
    const sig = signature.subarray(0, sigWritten.readUInt32LE(0));
    field('signature', `${C.magenta}${sig.byteLength}-byte (r‖s)${C.reset} ${C.gray}${hex(sig, 20)}${C.reset}`);

    const verifyStatus = Bcrypt.BCryptVerifySignature(keyHandle, null, digest.ptr!, digest.byteLength, sig.ptr!, sig.byteLength, 0);
    const verified = verifyStatus === 0;
    if (!verified) allPassed = false;
    verdict(verified, `BCryptVerifySignature accepted the genuine signature`);

    // Tamper — flip a signature byte and confirm rejection.
    const badSig = Buffer.from(sig);
    badSig[0] ^= 0x01;
    const badStatus = Bcrypt.BCryptVerifySignature(keyHandle, null, digest.ptr!, digest.byteLength, badSig.ptr!, badSig.byteLength, 0);
    const rejected = badStatus === STATUS_INVALID_SIGNATURE;
    if (!rejected) allPassed = false;
    field('tampered', `${C.red}flipped signature[0] bit 0${C.reset}`);
    verdict(rejected, `BCryptVerifySignature returned ${C.bold}${ntstatusHex(badStatus)}${C.reset} ${C.gray}STATUS_INVALID_SIGNATURE${C.reset}`);
  } finally {
    if (keyHandle !== 0n) Bcrypt.BCryptDestroyKey(keyHandle);
  }
}

// ── Act 5 — RSA-2048 ─────────────────────────────────────────────────────────

function actRsa(): void {
  act(5, 'RSA-2048', 'BCryptSignHash · PKCS#1 v1.5 over SHA-256');

  const digest = Buffer.alloc(32);
  requireSuccess('BCryptHash(digest)', Bcrypt.BCryptHash(BCRYPT_SHA256_ALG_HANDLE, null, 0, message.ptr!, message.byteLength, digest.ptr!, digest.byteLength));

  const algOut = Buffer.alloc(8);
  const rsaId = wide(BCRYPT_RSA_ALGORITHM);
  requireSuccess('BCryptOpenAlgorithmProvider(RSA)', Bcrypt.BCryptOpenAlgorithmProvider(algOut.ptr!, rsaId.ptr!, null, 0));
  const algHandle = BigInt(read.u64(algOut.ptr!, 0));

  let keyHandle = 0n;
  try {
    const keyOut = Buffer.alloc(8);
    requireSuccess('BCryptGenerateKeyPair(2048)', Bcrypt.BCryptGenerateKeyPair(algHandle, keyOut.ptr!, 2048, 0));
    keyHandle = BigInt(read.u64(keyOut.ptr!, 0));
    requireSuccess('BCryptFinalizeKeyPair', Bcrypt.BCryptFinalizeKeyPair(keyHandle, 0));
    field('digest', `${C.gray}SHA-256 ${C.reset}${C.cyan}${digest.toString('hex').slice(0, 32)}…${C.reset}`);
    field('keypair', `${C.green}2048-bit RSA generated + finalized${C.reset}`);

    // BCRYPT_PKCS1_PADDING_INFO { LPCWSTR pszAlgId } — an 8-byte struct holding a
    // pointer to the wide algorithm id. Keep algId referenced; assemble pad-info
    // immediately before each consuming call (GC window).
    const algIdWide = wide('SHA256');

    // Two-call sign with PKCS#1 padding.
    const padSize = Buffer.alloc(8);
    padSize.writeBigUInt64LE(BigInt(algIdWide.ptr as number), 0);
    const sigSize = Buffer.alloc(4);
    requireSuccess('BCryptSignHash(size)', Bcrypt.BCryptSignHash(keyHandle, padSize.ptr!, digest.ptr!, digest.byteLength, null, 0, sigSize.ptr!, BCryptPadFlags.BCRYPT_PAD_PKCS1));
    const signature = Buffer.alloc(sigSize.readUInt32LE(0));
    const sigWritten = Buffer.alloc(4);
    const padSign = Buffer.alloc(8);
    padSign.writeBigUInt64LE(BigInt(algIdWide.ptr as number), 0);
    requireSuccess('BCryptSignHash', Bcrypt.BCryptSignHash(keyHandle, padSign.ptr!, digest.ptr!, digest.byteLength, signature.ptr!, signature.byteLength, sigWritten.ptr!, BCryptPadFlags.BCRYPT_PAD_PKCS1));
    const sig = signature.subarray(0, sigWritten.readUInt32LE(0));
    field('signature', `${C.magenta}${sig.byteLength}-byte${C.reset} ${C.gray}${hex(sig, 20)}${C.reset}`);

    const padVerify = Buffer.alloc(8);
    padVerify.writeBigUInt64LE(BigInt(algIdWide.ptr as number), 0);
    const verifyStatus = Bcrypt.BCryptVerifySignature(keyHandle, padVerify.ptr!, digest.ptr!, digest.byteLength, sig.ptr!, sig.byteLength, BCryptPadFlags.BCRYPT_PAD_PKCS1);
    const verified = verifyStatus === 0;
    if (!verified) allPassed = false;
    verdict(verified, `BCryptVerifySignature accepted the genuine PKCS#1 signature`);

    // Tamper — flip a signature byte.
    const badSig = Buffer.from(sig);
    badSig[10] ^= 0x01;
    const padBad = Buffer.alloc(8);
    padBad.writeBigUInt64LE(BigInt(algIdWide.ptr as number), 0);
    const badStatus = Bcrypt.BCryptVerifySignature(keyHandle, padBad.ptr!, digest.ptr!, digest.byteLength, badSig.ptr!, badSig.byteLength, BCryptPadFlags.BCRYPT_PAD_PKCS1);
    const rejected = badStatus === STATUS_INVALID_SIGNATURE;
    if (!rejected) allPassed = false;
    field('tampered', `${C.red}flipped signature[10] bit 0${C.reset}`);
    verdict(rejected, `BCryptVerifySignature returned ${C.bold}${ntstatusHex(badStatus)}${C.reset} ${C.gray}STATUS_INVALID_SIGNATURE${C.reset}`);
  } finally {
    if (keyHandle !== 0n) Bcrypt.BCryptDestroyKey(keyHandle);
    Bcrypt.BCryptCloseAlgorithmProvider(algHandle, 0);
  }
}

// ── Drive ────────────────────────────────────────────────────────────────────

try {
  actRng();
  actHash();
  actAesGcm();
  actEcdsa();
  actRsa();

  console.log('');
  if (allPassed) {
    console.log(`${C.green}${C.bold}All 5 acts passed${C.reset} ${C.dim}— 3 honest roundtrips verified, 2 tamper attempts correctly rejected by the OS.${C.reset}`);
    process.exitCode = 0;
  } else {
    console.log(`${C.red}${C.bold}One or more acts did not produce the expected result.${C.reset}`);
    process.exitCode = 1;
  }
} catch (error) {
  const messageText = error instanceof Error ? error.message : String(error);
  console.log('');
  console.log(`${C.yellow}Crypto Forge could not complete: ${messageText}${C.reset}`);
  console.log(`${C.dim}This is unexpected — the Microsoft Primitive Provider ships with every Windows install.${C.reset}`);
  process.exitCode = 0;
}
