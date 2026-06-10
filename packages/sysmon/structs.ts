/** Pure struct decoders over kernel-filled Buffers — no FFI imports, unit-testable with byte fixtures (structs.test.ts). */

const FILETIME_EPOCH_OFFSET_MS = 11_644_473_600_000; // 1601-01-01 → 1970-01-01

export interface MemoryStatus {
  availablePageFileBytes: bigint;
  availablePhysicalBytes: bigint;
  availableVirtualBytes: bigint;
  memoryLoadPercent: number;
  totalPageFileBytes: bigint;
  totalPhysicalBytes: bigint;
  totalVirtualBytes: bigint;
}

export interface PerformanceCounts {
  commitLimitPages: number;
  commitPeakPages: number;
  commitTotalPages: number;
  handleCount: number;
  kernelNonpagedPages: number;
  kernelPagedPages: number;
  kernelTotalPages: number;
  pageSizeBytes: number;
  physicalAvailablePages: number;
  physicalTotalPages: number;
  processCount: number;
  systemCachePages: number;
  threadCount: number;
}

/** UTF-16LE bytes at [offset, offset + byteLength) → string (Bun's TextDecoder rejects 'utf-16le'; Buffer.toString is the repo convention). */
export function decodeUnicodeString(buffer: Buffer, offset: number, byteLength: number): string {
  return buffer.subarray(offset, offset + byteLength).toString('utf16le');
}

/** Difference of two FILETIME/100 ns tick counters in milliseconds. Only the DELTA fits Number space — absolute FILETIME exceeds 2^53. */
export function filetimeDeltaMs(a: bigint, b: bigint): number {
  return Number(a - b) / 10_000;
}

/** FILETIME split into two u32 halves (100 ns ticks since 1601-01-01) → Date. */
export function filetimeToDate(low: number, high: number): Date {
  return new Date((high * 4_294_967_296 + low) / 10_000 - FILETIME_EPOCH_OFFSET_MS);
}

/** MEMORYSTATUSEX (64 B): dwLength u32@0 (preset 64), MemoryLoad u32@4, TotalPhys u64@8, AvailPhys u64@16, TotalPageFile u64@24, AvailPageFile u64@32, TotalVirtual u64@40, AvailVirtual u64@48. */
export function parseMemoryStatusEx(buffer: Buffer): MemoryStatus {
  return {
    availablePageFileBytes: buffer.readBigUInt64LE(32),
    availablePhysicalBytes: buffer.readBigUInt64LE(16),
    availableVirtualBytes: buffer.readBigUInt64LE(48),
    memoryLoadPercent: buffer.readUInt32LE(4),
    totalPageFileBytes: buffer.readBigUInt64LE(24),
    totalPhysicalBytes: buffer.readBigUInt64LE(8),
    totalVirtualBytes: buffer.readBigUInt64LE(40),
  };
}

/** Double-NUL-terminated UTF-16LE string array (PDH enumerations, GetLogicalDriveStringsW, REG_MULTI_SZ). */
export function parseMultiSz(buffer: Buffer, maxChars: number): string[] {
  const results: string[] = [];
  let current = '';
  for (let i = 0; i < maxChars; i += 1) {
    const code = buffer.readUInt16LE(i * 2);
    if (code === 0) {
      if (current.length > 0) {
        results.push(current);
        current = '';
      } else {
        break;
      }
    } else {
      current += String.fromCharCode(code);
    }
  }
  return results;
}

/** PERFORMANCE_INFORMATION (104 B): cb u32@0, CommitTotal/CommitLimit/CommitPeak/PhysicalTotal/PhysicalAvailable/SystemCache/KernelTotal/KernelPaged/KernelNonpaged/PageSize SIZE_T@8..80, HandleCount u32@88, ProcessCount u32@92, ThreadCount u32@96. SIZE_T fields are page counts except PageSize (bytes). */
export function parsePerformanceInfo(buffer: Buffer): PerformanceCounts {
  return {
    commitLimitPages: Number(buffer.readBigUInt64LE(16)),
    commitPeakPages: Number(buffer.readBigUInt64LE(24)),
    commitTotalPages: Number(buffer.readBigUInt64LE(8)),
    handleCount: buffer.readUInt32LE(88),
    kernelNonpagedPages: Number(buffer.readBigUInt64LE(72)),
    kernelPagedPages: Number(buffer.readBigUInt64LE(64)),
    kernelTotalPages: Number(buffer.readBigUInt64LE(56)),
    pageSizeBytes: Number(buffer.readBigUInt64LE(80)),
    physicalAvailablePages: Number(buffer.readBigUInt64LE(40)),
    physicalTotalPages: Number(buffer.readBigUInt64LE(32)),
    processCount: buffer.readUInt32LE(92),
    systemCachePages: Number(buffer.readBigUInt64LE(48)),
    threadCount: buffer.readUInt32LE(96),
  };
}
