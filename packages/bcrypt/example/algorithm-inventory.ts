/**
 * CNG Algorithm Inventory
 *
 * Enumerates every cryptographic algorithm the current Windows CNG router
 * advertises, grouped by operation class (cipher, hash, asymmetric encryption,
 * key agreement, signature, RNG). For hash algorithms, also queries digest
 * length and block size from a live provider handle.
 *
 * Useful for:
 *   - auditing what primitives are available on a machine before committing to one
 *   - verifying provider configuration after FIPS or CNG policy changes
 *   - sanity-checking that bcrypt.dll is wired up correctly on a target host
 *
 * APIs demonstrated:
 *   - Bcrypt.BCryptEnumAlgorithms      (walk the algorithm registry by class)
 *   - Bcrypt.BCryptFreeBuffer          (release BCrypt-allocated output)
 *   - Bcrypt.BCryptOpenAlgorithmProvider / BCryptCloseAlgorithmProvider
 *   - Bcrypt.BCryptGetProperty         (HashLength, BlockLength)
 *
 * Run: bun run example/algorithm-inventory.ts
 */

import { read, type Pointer } from 'bun:ffi';

import Bcrypt, {
  BCRYPT_HASH_BLOCK_LENGTH,
  BCRYPT_HASH_LENGTH,
  BCryptAlgOperationFlags,
  type BCRYPT_ALG_HANDLE,
} from '../index';

Bcrypt.Preload([
  'BCryptCloseAlgorithmProvider',
  'BCryptEnumAlgorithms',
  'BCryptFreeBuffer',
  'BCryptGetProperty',
  'BCryptOpenAlgorithmProvider',
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

const CLASSES: Array<{ flag: BCryptAlgOperationFlags; label: string }> = [
  { flag: BCryptAlgOperationFlags.BCRYPT_CIPHER_OPERATION, label: 'Cipher' },
  { flag: BCryptAlgOperationFlags.BCRYPT_HASH_OPERATION, label: 'Hash' },
  { flag: BCryptAlgOperationFlags.BCRYPT_ASYMMETRIC_ENCRYPTION_OPERATION, label: 'Asymmetric encryption' },
  { flag: BCryptAlgOperationFlags.BCRYPT_SECRET_AGREEMENT_OPERATION, label: 'Key agreement' },
  { flag: BCryptAlgOperationFlags.BCRYPT_SIGNATURE_OPERATION, label: 'Signature' },
  { flag: BCryptAlgOperationFlags.BCRYPT_RNG_OPERATION, label: 'Random number generation' },
];

function requireSuccess(label: string, status: number): void {
  if (status < 0) {
    throw new Error(`${label} failed with NTSTATUS 0x${(status >>> 0).toString(16).padStart(8, '0')}`);
  }
}

function wideString(value: string): Buffer {
  return Buffer.from(value + '\0', 'utf16le');
}

function readWideStringAt(address: bigint): string {
  if (address === 0n) return '';
  const ptr = Number(address) as unknown as Pointer;
  let offset = 0;
  const chars: number[] = [];
  while (true) {
    const word = read.u16(ptr, offset);
    if (word === 0) break;
    chars.push(word);
    offset += 2;
    if (offset > 512) break;
  }
  return String.fromCharCode(...chars);
}

function enumerateAlgorithms(flag: BCryptAlgOperationFlags): string[] {
  const countBuffer = Buffer.alloc(4);
  const listBuffer = Buffer.alloc(8);
  requireSuccess('BCryptEnumAlgorithms', Bcrypt.BCryptEnumAlgorithms(flag, countBuffer.ptr!, listBuffer.ptr!, 0));

  const count = countBuffer.readUInt32LE(0);
  const listAddress = listBuffer.readBigUInt64LE(0);
  const names: string[] = [];

  for (let i = 0; i < count; i++) {
    const entryAddress = listAddress + BigInt(i * 16);
    const namePointer = read.u64(Number(entryAddress) as unknown as Pointer, 0);
    names.push(readWideStringAt(BigInt(namePointer)));
  }

  Bcrypt.BCryptFreeBuffer(Number(listAddress) as unknown as Pointer);
  return names.sort((a, b) => a.localeCompare(b));
}

function getUint32Property(handle: BCRYPT_ALG_HANDLE, name: string): number {
  const nameBuf = wideString(name);
  const out = Buffer.alloc(4);
  const written = Buffer.alloc(4);
  requireSuccess(`BCryptGetProperty(${name})`, Bcrypt.BCryptGetProperty(handle, nameBuf.ptr!, out.ptr!, out.byteLength, written.ptr!, 0));
  return out.readUInt32LE(0);
}

function describeHash(name: string): string {
  const algIdBuf = wideString(name);
  const handleOut = Buffer.alloc(8);
  const status = Bcrypt.BCryptOpenAlgorithmProvider(handleOut.ptr!, algIdBuf.ptr!, null, 0);
  if (status < 0) {
    return `${ANSI.dim}(provider failed 0x${(status >>> 0).toString(16)})${ANSI.reset}`;
  }
  const handle = BigInt(read.u64(handleOut.ptr!, 0));
  try {
    const hashLength = getUint32Property(handle, BCRYPT_HASH_LENGTH);
    const blockLength = getUint32Either(handle, BCRYPT_HASH_BLOCK_LENGTH);
    const digestBits = hashLength * 8;
    return blockLength > 0
      ? `${ANSI.dim}digest ${digestBits}b · block ${blockLength}B${ANSI.reset}`
      : `${ANSI.dim}digest ${digestBits}b${ANSI.reset}`;
  } finally {
    Bcrypt.BCryptCloseAlgorithmProvider(handle, 0);
  }
}

function getUint32Either(handle: BCRYPT_ALG_HANDLE, name: string): number {
  try {
    return getUint32Property(handle, name);
  } catch {
    return 0;
  }
}

console.log(`${ANSI.bold}${ANSI.cyan}Windows CNG Algorithm Inventory${ANSI.reset}`);
console.log(`${ANSI.dim}via bcrypt.dll · BCryptEnumAlgorithms${ANSI.reset}`);
console.log('');

let total = 0;
for (const { flag, label } of CLASSES) {
  const names = enumerateAlgorithms(flag);
  total += names.length;
  console.log(`${ANSI.bold}${ANSI.magenta}${label}${ANSI.reset} ${ANSI.dim}(${names.length})${ANSI.reset}`);
  for (const name of names) {
    if (flag === BCryptAlgOperationFlags.BCRYPT_HASH_OPERATION) {
      const props = describeHash(name);
      console.log(`  ${ANSI.yellow}${name.padEnd(24)}${ANSI.reset} ${props}`);
    } else {
      console.log(`  ${ANSI.yellow}${name}${ANSI.reset}`);
    }
  }
  console.log('');
}

console.log(`${ANSI.bold}${ANSI.green}${total}${ANSI.reset} ${ANSI.dim}total algorithms across ${CLASSES.length} operation classes${ANSI.reset}`);
