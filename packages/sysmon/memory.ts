import Kernel32 from '@bun-win32/kernel32';
import Psapi from '@bun-win32/psapi';
import { preloadPending } from './preload';
import { type MemoryStatus, type PerformanceCounts, parseMemoryStatusEx, parsePerformanceInfo } from './structs';

preloadPending(Kernel32, ['GlobalMemoryStatusEx']);
preloadPending(Psapi, ['GetPerformanceInfo']);
const { GlobalMemoryStatusEx } = Kernel32;
const { GetPerformanceInfo } = Psapi;

export interface PerformanceInfo {
  /** Commit charge limit in bytes — Task Manager's "Committed" denominator (physical RAM + page files). */
  commitLimitBytes: number;
  commitPeakBytes: number;
  /** Current commit charge in bytes — Task Manager's "Committed" numerator. */
  commitTotalBytes: number;
  handleCount: number;
  kernelNonpagedBytes: number;
  kernelPagedBytes: number;
  pageSizeBytes: number;
  physicalAvailableBytes: number;
  physicalTotalBytes: number;
  processCount: number;
  /** System cache + standby list in bytes — the "Cached" number systeminformation hard-zeros on Windows. */
  systemCacheBytes: number;
  threadCount: number;
}

const memoryStatusBuffer = Buffer.alloc(64);
const performanceInfoBuffer = Buffer.alloc(104);

/**
 * RAM/commit snapshot (GlobalMemoryStatusEx, 64 B, dwLength preset 64).
 * Field ↔ Task Manager mapping: `totalPhysicalBytes` = "Total", `availablePhysicalBytes` = "Available"
 * (free + standby — NOT just free), `memoryLoadPercent` = the memory gauge,
 * `totalPageFileBytes`/`availablePageFileBytes` = the commit limit/headroom ("Committed" x/y),
 * virtual fields describe THIS process's address space. Per-process numbers (working set vs
 * private bytes) live on the process snapshot, not here.
 */
export function memory(): MemoryStatus {
  memoryStatusBuffer.writeUInt32LE(64, 0); // dwLength preset — the call fails without it
  if (GlobalMemoryStatusEx(memoryStatusBuffer.ptr) === 0) throw new Error('GlobalMemoryStatusEx failed');
  return parseMemoryStatusEx(memoryStatusBuffer);
}

/** System-wide commit/cache/kernel-pool/object counts (psapi GetPerformanceInfo, 104 B, cb preset) — includes the standby/commit numbers systeminformation hard-zeros on Windows. */
export function performanceInfo(): PerformanceInfo {
  performanceInfoBuffer.writeUInt32LE(104, 0); // cb preset
  if (GetPerformanceInfo(performanceInfoBuffer.ptr, 104) === 0) throw new Error('GetPerformanceInfo failed');
  const counts: PerformanceCounts = parsePerformanceInfo(performanceInfoBuffer);
  const pageSize = counts.pageSizeBytes;
  return {
    commitLimitBytes: counts.commitLimitPages * pageSize,
    commitPeakBytes: counts.commitPeakPages * pageSize,
    commitTotalBytes: counts.commitTotalPages * pageSize,
    handleCount: counts.handleCount,
    kernelNonpagedBytes: counts.kernelNonpagedPages * pageSize,
    kernelPagedBytes: counts.kernelPagedPages * pageSize,
    pageSizeBytes: pageSize,
    physicalAvailableBytes: counts.physicalAvailablePages * pageSize,
    physicalTotalBytes: counts.physicalTotalPages * pageSize,
    processCount: counts.processCount,
    systemCacheBytes: counts.systemCachePages * pageSize,
    threadCount: counts.threadCount,
  };
}
