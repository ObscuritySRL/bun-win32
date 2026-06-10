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

export interface ProcessInfo {
  basePriority: number;
  createTime: Date;
  handleCount: number;
  ioOtherBytes: number;
  ioOtherOperations: number;
  ioReadBytes: number;
  ioReadOperations: number;
  ioWriteBytes: number;
  ioWriteOperations: number;
  /** CPU time in kernel mode, 100 ns units. */
  kernelTime: bigint;
  name: string;
  pageFaultCount: number;
  peakWorkingSetBytes: number;
  pid: number;
  ppid: number;
  /** Committed private bytes (PagefileUsage) — Task Manager's "Commit size". */
  privateBytes: number;
  sessionId: number;
  threadCount: number;
  /** CPU time in user mode, 100 ns units. */
  userTime: bigint;
  virtualBytes: number;
  /** Physical RAM in the working set — Task Manager's default "Memory" comparison point. */
  workingSetBytes: number;
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

/**
 * SYSTEM_PROCESS_INFORMATION (x64) walker over an NtQuerySystemInformation(class 5) buffer.
 * Offsets are SDK-header-derived (winternl.h) and referee-verified against
 * GetProcessTimes/GetProcessMemoryInfo/GetProcessHandleCount/GetProcessIoCounters:
 * NextEntryOffset u32@0x00 (0 terminates), NumberOfThreads u32@0x04, CreateTime FILETIME@0x20,
 * UserTime i64@0x28, KernelTime i64@0x30, ImageName{Length u16@0x38, Buffer VA@0x40},
 * BasePriority i32@0x48, UniqueProcessId@0x50, InheritedFromUniqueProcessId@0x58,
 * HandleCount u32@0x60, SessionId u32@0x64, VirtualSize@0x78, PageFaultCount u32@0x80,
 * PeakWorkingSetSize@0x88, WorkingSetSize@0x90, PagefileUsage@0xB8, IO counters@0xD0..0xF8.
 * (NOT 0x110/0x118 — those land inside Threads[0].) ImageName.Buffer is a VA into this same
 * buffer; pass the buffer's own base address (`buffer.ptr`) for the relative resolve.
 */
export function parseProcessSnapshot(buffer: Buffer, bufferBase: number): ProcessInfo[] {
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength); // once per syscall, never per row
  const rows: ProcessInfo[] = [];
  let offset = 0;
  for (let guard = 0; guard < 200_000 && offset + 0x100 <= buffer.byteLength; guard += 1) {
    const pid = view.getUint32(offset + 0x50, true);
    const nameLength = view.getUint16(offset + 0x38, true);
    let name = pid === 0 ? 'Idle' : pid === 4 ? 'System' : '';
    if (nameLength > 0 && nameLength < 1024) {
      const nameAddress = view.getUint32(offset + 0x40, true) + view.getUint32(offset + 0x44, true) * 4_294_967_296;
      const relative = nameAddress - bufferBase;
      if (relative > 0 && relative + nameLength <= buffer.byteLength) name = decodeUnicodeString(buffer, relative, nameLength);
    }
    rows.push({
      basePriority: view.getInt32(offset + 0x48, true),
      createTime: filetimeToDate(view.getUint32(offset + 0x20, true), view.getUint32(offset + 0x24, true)),
      handleCount: view.getUint32(offset + 0x60, true),
      ioOtherBytes: view.getUint32(offset + 0xf8, true) + view.getUint32(offset + 0xfc, true) * 4_294_967_296,
      ioOtherOperations: view.getUint32(offset + 0xe0, true) + view.getUint32(offset + 0xe4, true) * 4_294_967_296,
      ioReadBytes: view.getUint32(offset + 0xe8, true) + view.getUint32(offset + 0xec, true) * 4_294_967_296,
      ioReadOperations: view.getUint32(offset + 0xd0, true) + view.getUint32(offset + 0xd4, true) * 4_294_967_296,
      ioWriteBytes: view.getUint32(offset + 0xf0, true) + view.getUint32(offset + 0xf4, true) * 4_294_967_296,
      ioWriteOperations: view.getUint32(offset + 0xd8, true) + view.getUint32(offset + 0xdc, true) * 4_294_967_296,
      kernelTime: view.getBigUint64(offset + 0x30, true),
      name,
      pageFaultCount: view.getUint32(offset + 0x80, true),
      peakWorkingSetBytes: view.getUint32(offset + 0x88, true) + view.getUint32(offset + 0x8c, true) * 4_294_967_296,
      pid,
      ppid: view.getUint32(offset + 0x58, true),
      privateBytes: view.getUint32(offset + 0xb8, true) + view.getUint32(offset + 0xbc, true) * 4_294_967_296,
      sessionId: view.getUint32(offset + 0x64, true),
      threadCount: view.getUint32(offset + 0x04, true),
      userTime: view.getBigUint64(offset + 0x28, true),
      virtualBytes: view.getUint32(offset + 0x78, true) + view.getUint32(offset + 0x7c, true) * 4_294_967_296,
      workingSetBytes: view.getUint32(offset + 0x90, true) + view.getUint32(offset + 0x94, true) * 4_294_967_296,
    });
    const next = view.getUint32(offset, true);
    if (next === 0) break;
    offset += next;
  }
  return rows;
}
