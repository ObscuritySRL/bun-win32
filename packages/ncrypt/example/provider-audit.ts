/**
 * CNG Key Storage Provider Audit
 *
 * A full enumeration of every Cryptography Next Generation (CNG) key storage
 * provider registered on the system. For each KSP the script opens a handle,
 * enumerates the algorithms it advertises (cipher, hash, asymmetric encryption,
 * secret agreement, signature, RNG, key derivation), and reports each algorithm
 * together with its class flags. Every value comes directly from `ncrypt.dll` —
 * the output is the system's authoritative view of installed crypto capability.
 *
 * APIs demonstrated:
 *   - NCryptEnumStorageProviders   (system-wide KSP roster)
 *   - NCryptOpenStorageProvider    (open a KSP by name)
 *   - NCryptEnumAlgorithms         (enumerate algorithms the KSP exposes)
 *   - NCryptIsAlgSupported         (probe a specific algorithm)
 *   - NCryptFreeBuffer             (release enumerator-allocated buffers)
 *   - NCryptFreeObject             (release the provider handle)
 *
 * Run: bun run example/provider-audit.ts
 */

import { type Pointer, read } from 'bun:ffi';

import Ncrypt, { NCryptAlgClass, NCryptFlags, NCRYPT_RSA_ALGORITHM, type NCRYPT_PROV_HANDLE } from '../index';

Ncrypt.Preload(['NCryptEnumAlgorithms', 'NCryptEnumStorageProviders', 'NCryptFreeBuffer', 'NCryptFreeObject', 'NCryptIsAlgSupported', 'NCryptOpenStorageProvider']);

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
  gray: '\x1b[90m',
} as const;

// dwClass on NCryptAlgorithmName is the CNG interface ID (BCRYPT_*_INTERFACE), 1..7.
const INTERFACE_LABELS: Record<number, string> = {
  1: 'cipher',
  2: 'hash',
  3: 'asymmetric',
  4: 'agreement',
  5: 'signature',
  6: 'rng',
  7: 'kdf',
};

const INTERFACE_COLOR: Record<number, string> = {
  1: ANSI.cyan,
  2: ANSI.yellow,
  3: ANSI.magenta,
  4: ANSI.blue,
  5: ANSI.green,
  6: ANSI.gray,
  7: ANSI.cyan,
};

// dwAlgOperations is a bitmask of NCryptAlgClass values describing what the algorithm can do.
const OPERATION_LABELS: { bit: number; label: string }[] = [
  { bit: NCryptAlgClass.NCRYPT_CIPHER_OPERATION, label: 'cipher' },
  { bit: NCryptAlgClass.NCRYPT_HASH_OPERATION, label: 'hash' },
  { bit: NCryptAlgClass.NCRYPT_ASYMMETRIC_ENCRYPTION_OPERATION, label: 'asymmetric' },
  { bit: NCryptAlgClass.NCRYPT_SECRET_AGREEMENT_OPERATION, label: 'agreement' },
  { bit: NCryptAlgClass.NCRYPT_SIGNATURE_OPERATION, label: 'signature' },
  { bit: NCryptAlgClass.NCRYPT_RNG_OPERATION, label: 'rng' },
  { bit: NCryptAlgClass.NCRYPT_KEY_DERIVATION_OPERATION, label: 'kdf' },
];

function wide(value: string): Buffer {
  return Buffer.from(value + '\0', 'utf16le');
}

function readWideString(addr: Pointer): string {
  // Walk the wide-string buffer one UInt16 at a time until we hit the terminating null.
  let end = 0;
  while (read.u16(addr, end) !== 0) {
    end += 2;
  }
  const bytes = Buffer.alloc(end);
  for (let i = 0; i < end; i++) {
    bytes[i] = read.u8(addr, i);
  }
  return bytes.toString('utf16le');
}

function statusHex(status: number): string {
  return '0x' + (status >>> 0).toString(16).padStart(8, '0');
}

interface ProviderName {
  name: string;
  comment: string;
}

function enumerateProviders(): ProviderName[] {
  const countBuf = Buffer.alloc(4);
  const listBuf = Buffer.alloc(8);
  const status = Ncrypt.NCryptEnumStorageProviders(countBuf.ptr!, listBuf.ptr!, 0);
  if (status !== 0) {
    throw new Error(`NCryptEnumStorageProviders failed: ${statusHex(status)}`);
  }
  const count = countBuf.readUInt32LE(0);
  const listAddr = read.ptr(listBuf.ptr!, 0) as Pointer;
  // NCryptProviderName { LPWSTR pszName; LPWSTR pszComment; } — two pointers, 16 bytes on x64.
  const STRIDE = 16;
  const items: ProviderName[] = [];
  if (listAddr) {
    for (let i = 0; i < count; i++) {
      const namePtr = read.ptr(listAddr, i * STRIDE) as Pointer;
      const commentPtr = read.ptr(listAddr, i * STRIDE + 8) as Pointer;
      items.push({
        name: namePtr ? readWideString(namePtr) : '',
        comment: commentPtr ? readWideString(commentPtr) : '',
      });
    }
    Ncrypt.NCryptFreeBuffer(listAddr);
  }
  return items;
}

interface AlgorithmEntry {
  name: string;
  interfaceId: number;
  operations: number;
  flags: number;
}

function enumerateAlgorithms(hProvider: NCRYPT_PROV_HANDLE): AlgorithmEntry[] {
  // Pass 0 for dwAlgOperations to enumerate every algorithm class the KSP knows about,
  // and NCRYPT_SILENT_FLAG so we never trigger UI on smart-card style providers.
  const countBuf = Buffer.alloc(4);
  const listBuf = Buffer.alloc(8);
  const status = Ncrypt.NCryptEnumAlgorithms(hProvider, 0, countBuf.ptr!, listBuf.ptr!, NCryptFlags.NCRYPT_SILENT_FLAG);
  if (status !== 0) {
    return [];
  }
  const count = countBuf.readUInt32LE(0);
  const listAddr = read.ptr(listBuf.ptr!, 0) as Pointer;
  if (!listAddr) return [];
  // NCryptAlgorithmName layout on x64:
  //   LPWSTR  pszName;        // offset 0, 8 bytes
  //   DWORD   dwClass;        // offset 8, 4 bytes  (CNG interface 1..7)
  //   DWORD   dwAlgOperations;// offset 12, 4 bytes (NCryptAlgClass bitmask)
  //   DWORD   dwFlags;        // offset 16, 4 bytes
  //   DWORD   _padding;       // 4 bytes trailing alignment
  // Total: 24 bytes per entry.
  const STRIDE = 24;
  const algorithms: AlgorithmEntry[] = [];
  for (let i = 0; i < count; i++) {
    const base = i * STRIDE;
    const namePtr = read.ptr(listAddr, base) as Pointer;
    algorithms.push({
      name: namePtr ? readWideString(namePtr) : '',
      interfaceId: read.u32(listAddr, base + 8),
      operations: read.u32(listAddr, base + 12),
      flags: read.u32(listAddr, base + 16),
    });
  }
  Ncrypt.NCryptFreeBuffer(listAddr);
  return algorithms;
}

function formatOperations(opsMask: number): string {
  const parts: string[] = [];
  for (const { bit, label } of OPERATION_LABELS) {
    if (opsMask & bit) parts.push(label);
  }
  return parts.join('|') || 'none';
}

function probeRsa(hProvider: NCRYPT_PROV_HANDLE): { supported: boolean; status: number } {
  const algBuf = wide(NCRYPT_RSA_ALGORITHM);
  const status = Ncrypt.NCryptIsAlgSupported(hProvider, algBuf.ptr!, NCryptFlags.NCRYPT_SILENT_FLAG);
  return { supported: status === 0, status };
}

console.log(`${ANSI.bold}${ANSI.cyan}CNG Key Storage Provider Audit${ANSI.reset}`);
console.log(`${ANSI.dim}ncrypt.dll · ${process.platform} ${process.arch}${ANSI.reset}`);
console.log('');

const providers = enumerateProviders();
console.log(`${ANSI.bold}Registered KSPs${ANSI.reset}  ${ANSI.dim}(${providers.length})${ANSI.reset}`);
for (const provider of providers) {
  console.log(`  ${ANSI.green}•${ANSI.reset} ${provider.name}`);
  if (provider.comment) {
    console.log(`    ${ANSI.dim}${provider.comment}${ANSI.reset}`);
  }
}
console.log('');

let totalAlgorithms = 0;
let totalRsaCapable = 0;

for (const provider of providers) {
  const providerNameBuf = wide(provider.name);
  const provBuf = Buffer.alloc(8);

  console.log(`${ANSI.bold}${ANSI.blue}▌ ${provider.name}${ANSI.reset}`);
  const openStatus = Ncrypt.NCryptOpenStorageProvider(provBuf.ptr!, providerNameBuf.ptr!, 0);
  if (openStatus !== 0) {
    console.log(`  ${ANSI.red}open failed${ANSI.reset} ${ANSI.dim}(${statusHex(openStatus)})${ANSI.reset}`);
    console.log('');
    continue;
  }

  const hProv = BigInt(read.u64(provBuf.ptr!, 0));
  const algorithms = enumerateAlgorithms(hProv);
  totalAlgorithms += algorithms.length;
  const rsa = probeRsa(hProv);
  if (rsa.supported) totalRsaCapable += 1;

  console.log(`  ${ANSI.dim}handle:${ANSI.reset}        0x${hProv.toString(16)}`);
  console.log(`  ${ANSI.dim}algorithms:${ANSI.reset}    ${algorithms.length}`);
  const rsaDisplay = rsa.supported ? `${ANSI.green}yes${ANSI.reset}` : `${ANSI.red}no${ANSI.reset} ${ANSI.dim}(${statusHex(rsa.status)})${ANSI.reset}`;
  console.log(`  ${ANSI.dim}RSA supported:${ANSI.reset} ${rsaDisplay}`);

  // Group by CNG interface (dwClass = 1..7) and print each group.
  const grouped = new Map<number, AlgorithmEntry[]>();
  for (const alg of algorithms) {
    const bucket = grouped.get(alg.interfaceId) ?? [];
    bucket.push(alg);
    grouped.set(alg.interfaceId, bucket);
  }

  for (let interfaceId = 1; interfaceId <= 7; interfaceId++) {
    const algs = grouped.get(interfaceId);
    if (!algs || algs.length === 0) continue;
    const label = `${INTERFACE_COLOR[interfaceId] ?? ''}${INTERFACE_LABELS[interfaceId]}${ANSI.reset}`;
    console.log(`  ${ANSI.dim}┝╴${ANSI.reset} ${label}  ${ANSI.dim}×${algs.length}${ANSI.reset}`);
    for (const alg of algs) {
      const opsLabel = formatOperations(alg.operations);
      const namePadded = alg.name.padEnd(20);
      console.log(`     ${ANSI.bold}${namePadded}${ANSI.reset} ${ANSI.dim}ops=${opsLabel}  flags=0x${alg.flags.toString(16).padStart(8, '0')}${ANSI.reset}`);
    }
  }

  Ncrypt.NCryptFreeObject(hProv);
  console.log('');
}

console.log(`${ANSI.bold}Summary${ANSI.reset}`);
console.log(`  ${ANSI.dim}providers:${ANSI.reset}   ${providers.length}`);
console.log(`  ${ANSI.dim}algorithms:${ANSI.reset}  ${totalAlgorithms}  ${ANSI.dim}(across all KSPs)${ANSI.reset}`);
console.log(`  ${ANSI.dim}RSA capable:${ANSI.reset} ${totalRsaCapable} / ${providers.length}`);
