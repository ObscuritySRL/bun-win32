/**
 * System Internals
 *
 * Deep dive into NT kernel system information using undocumented and
 * semi-documented Ntdll APIs. Retrieves the true OS version (bypassing
 * compatibility shims), hardware basics, processor details, and system
 * performance counters straight from the kernel.
 *
 * APIs demonstrated:
 *   - RtlGetVersion                (true OS version, ignores manifests)
 *   - NtQuerySystemInformation     (kernel system info classes)
 *     - SystemBasicInformation          (class 0)
 *     - SystemProcessorInformation      (class 1)
 *     - SystemPerformanceInformation    (class 2)
 *     - SystemTimeOfDayInformation      (class 3)
 *   - NtQuerySystemTime            (current system time in 100ns ticks)
 *   - NtQueryTimerResolution       (timer granularity bounds)
 *
 * Run: bun run example/system-internals.ts
 */
import { ptr } from 'bun:ffi';
import Ntdll, { STATUS_SUCCESS, SystemInformationClass } from '../index';

Ntdll.Preload([
  'RtlGetVersion',
  'NtQuerySystemInformation',
  'NtQuerySystemTime',
  'NtQueryTimerResolution',
]);

const W = 72;

function heading(title: string): void {
  console.log(`\n  ${'─'.repeat(W - 4)}`);
  console.log(`  ${title}`);
  console.log(`  ${'─'.repeat(W - 4)}`);
}

function row(label: string, value: string): void {
  console.log(`    ${label.padEnd(32)} ${value}`);
}

// Map Windows build numbers to marketing names
function windowsName(major: number, minor: number, build: number): string {
  if (major === 10 && minor === 0) {
    if (build >= 22000) return 'Windows 11';
    return 'Windows 10';
  }
  if (major === 6 && minor === 3) return 'Windows 8.1';
  if (major === 6 && minor === 2) return 'Windows 8';
  if (major === 6 && minor === 1) return 'Windows 7';
  if (major === 6 && minor === 0) return 'Windows Vista';
  return `Windows NT ${major}.${minor}`;
}

console.log(`\n${'='.repeat(W)}`);
console.log('             NT SYSTEM INTERNALS');
console.log('             powered by @bun-win32/ntdll');
console.log(`${'='.repeat(W)}`);

// 1. RtlGetVersion - True OS version
heading('OS VERSION (RtlGetVersion)');

const RTL_OSVERSIONINFOW_SIZE = 0x11c; // 284 bytes
const versionBuf = Buffer.alloc(RTL_OSVERSIONINFOW_SIZE);
versionBuf.writeUInt32LE(RTL_OSVERSIONINFOW_SIZE, 0); // dwOSVersionInfoSize

const versionStatus = Ntdll.RtlGetVersion(versionBuf.ptr);
if (versionStatus === STATUS_SUCCESS) {
  const major = versionBuf.readUInt32LE(4);
  const minor = versionBuf.readUInt32LE(8);
  const build = versionBuf.readUInt32LE(12);
  const platformId = versionBuf.readUInt32LE(16);
  // Service pack string starts at offset 20, 128 WCHARs (256 bytes)
  const spStr = versionBuf.subarray(20, 20 + 256).toString('utf16le').replace(/\0.*$/, '');

  const marketingName = windowsName(major, minor, build);

  row('Marketing Name:', marketingName);
  row('NT Version:', `${major}.${minor}.${build}`);
  row('Major:', `${major}`);
  row('Minor:', `${minor}`);
  row('Build Number:', `${build}`);
  row('Platform ID:', `${platformId} (VER_PLATFORM_WIN32_NT)`);
  row('Service Pack:', spStr || '(none)');
} else {
  console.log(`    RtlGetVersion failed: NTSTATUS 0x${(versionStatus >>> 0).toString(16)}`);
}

// 2. SystemBasicInformation (class 0)
heading('SYSTEM BASIC INFORMATION (class 0)');

// SYSTEM_BASIC_INFORMATION: 64 bytes on x64
const basicBuf = Buffer.alloc(64);
const retLenBuf = Buffer.alloc(4);

const basicStatus = Ntdll.NtQuerySystemInformation(
  SystemInformationClass.SystemBasicInformation,
  basicBuf.ptr,
  basicBuf.byteLength,
  retLenBuf.ptr,
);

if (basicStatus === STATUS_SUCCESS) {
  const view = new DataView(basicBuf.buffer);
  // SYSTEM_BASIC_INFORMATION layout (x64):
  // 0x00: ULONG Reserved
  // 0x04: ULONG TimerResolution (100ns units)
  // 0x08: ULONG PageSize
  // 0x0C: ULONG NumberOfPhysicalPages
  // 0x10: ULONG LowestPhysicalPageNumber
  // 0x14: ULONG HighestPhysicalPageNumber
  // 0x18: ULONG AllocationGranularity
  // 0x1C: ULONG_PTR MinimumUserModeAddress (8 bytes on x64)
  // 0x24: ULONG_PTR MaximumUserModeAddress (8 bytes on x64)
  // 0x2C: ULONG_PTR ActiveProcessorsAffinityMask (8 bytes on x64)
  // 0x34: CCHAR NumberOfProcessors
  const timerRes = view.getUint32(0x04, true);
  const pageSize = view.getUint32(0x08, true);
  const physPages = view.getUint32(0x0c, true);
  const lowestPage = view.getUint32(0x10, true);
  const highestPage = view.getUint32(0x14, true);
  const allocGranularity = view.getUint32(0x18, true);
  const minUserAddr = view.getBigUint64(0x1c, true);
  const maxUserAddr = view.getBigUint64(0x24, true);
  const affinityMask = view.getBigUint64(0x2c, true);
  const numProcessors = view.getUint8(0x34);

  const totalMemBytes = BigInt(physPages) * BigInt(pageSize);

  row('Timer Resolution:', `${timerRes} x 100ns (${(timerRes / 10).toLocaleString()} us)`);
  row('Page Size:', `${pageSize.toLocaleString()} bytes`);
  row('Physical Pages:', `${physPages.toLocaleString()}`);
  row('Total Physical Mem:', `${(Number(totalMemBytes) / (1024 ** 3)).toFixed(2)} GB`);
  row('Lowest Phys Page:', `${lowestPage}`);
  row('Highest Phys Page:', `${highestPage.toLocaleString()}`);
  row('Alloc Granularity:', `${allocGranularity.toLocaleString()} bytes`);
  row('Min User Address:', `0x${minUserAddr.toString(16)}`);
  row('Max User Address:', `0x${maxUserAddr.toString(16)}`);
  row('Affinity Mask:', `0x${affinityMask.toString(16)}`);
  row('Processor Count:', `${numProcessors}`);
  row('Return Length:', `${retLenBuf.readUInt32LE(0)} bytes`);
} else {
  console.log(`    NtQuerySystemInformation(Basic) failed: 0x${(basicStatus >>> 0).toString(16)}`);
}

// 3. SystemProcessorInformation (class 1)
heading('PROCESSOR INFORMATION (class 1)');

// SYSTEM_PROCESSOR_INFORMATION: 12 bytes
const procInfoBuf = Buffer.alloc(12);
const procRetLen = Buffer.alloc(4);

const procStatus = Ntdll.NtQuerySystemInformation(
  SystemInformationClass.SystemProcessorInformation,
  procInfoBuf.ptr,
  procInfoBuf.byteLength,
  procRetLen.ptr,
);

if (procStatus === STATUS_SUCCESS) {
  const view = new DataView(procInfoBuf.buffer);
  // SYSTEM_PROCESSOR_INFORMATION:
  // 0x00: USHORT ProcessorArchitecture
  // 0x02: USHORT ProcessorLevel
  // 0x04: USHORT ProcessorRevision
  // 0x06: USHORT MaximumProcessors (or Reserved)
  // 0x08: ULONG ProcessorFeatureBits
  const arch = view.getUint16(0x00, true);
  const level = view.getUint16(0x02, true);
  const revision = view.getUint16(0x04, true);
  const maxProcs = view.getUint16(0x06, true);
  const featureBits = view.getUint32(0x08, true);

  const archNames: Record<number, string> = {
    0: 'PROCESSOR_ARCHITECTURE_INTEL (x86)',
    5: 'PROCESSOR_ARCHITECTURE_ARM',
    6: 'PROCESSOR_ARCHITECTURE_IA64',
    9: 'PROCESSOR_ARCHITECTURE_AMD64 (x64)',
    12: 'PROCESSOR_ARCHITECTURE_ARM64',
  };

  row('Architecture:', archNames[arch] ?? `Unknown (${arch})`);
  row('Level:', `${level}`);
  row('Revision:', `0x${revision.toString(16).padStart(4, '0')}`);
  row('Max Processors:', `${maxProcs}`);
  row('Feature Bits:', `0x${featureBits.toString(16).padStart(8, '0')}`);
  row('Return Length:', `${procRetLen.readUInt32LE(0)} bytes`);
} else {
  console.log(`    NtQuerySystemInformation(Processor) failed: 0x${(procStatus >>> 0).toString(16)}`);
}

// 4. SystemPerformanceInformation (class 2)
heading('PERFORMANCE INFORMATION (class 2)');

// SYSTEM_PERFORMANCE_INFORMATION is large (~344 bytes on x64)
const perfBuf = Buffer.alloc(512);
const perfRetLen = Buffer.alloc(4);

const perfStatus = Ntdll.NtQuerySystemInformation(
  SystemInformationClass.SystemPerformanceInformation,
  perfBuf.ptr,
  perfBuf.byteLength,
  perfRetLen.ptr,
);

if (perfStatus === STATUS_SUCCESS) {
  const view = new DataView(perfBuf.buffer);
  // SYSTEM_PERFORMANCE_INFORMATION (partial):
  // 0x00: LARGE_INTEGER IdleProcessTime
  // 0x08: LARGE_INTEGER IoReadTransferCount
  // 0x10: LARGE_INTEGER IoWriteTransferCount
  // 0x18: LARGE_INTEGER IoOtherTransferCount
  // 0x20: ULONG IoReadOperationCount
  // 0x24: ULONG IoWriteOperationCount
  // 0x28: ULONG IoOtherOperationCount
  // 0x2C: ULONG AvailablePages
  // 0x30: ULONG CommittedPages
  // 0x34: ULONG CommitLimit
  // 0x38: ULONG PeakCommitment
  // 0x3C: ULONG PageFaultCount
  // 0x40: ULONG CopyOnWriteCount
  // 0x44: ULONG TransitionCount
  // 0x48: ULONG CacheTransitionCount
  // 0x4C: ULONG DemandZeroCount
  // 0x50: ULONG PageReadCount
  // 0x54: ULONG PageReadIoCount
  const idleTime = view.getBigInt64(0x00, true);
  const ioReadBytes = view.getBigInt64(0x08, true);
  const ioWriteBytes = view.getBigInt64(0x10, true);
  const ioOtherBytes = view.getBigInt64(0x18, true);
  const ioReadOps = view.getUint32(0x20, true);
  const ioWriteOps = view.getUint32(0x24, true);
  const ioOtherOps = view.getUint32(0x28, true);
  const availPages = view.getUint32(0x2c, true);
  const committedPages = view.getUint32(0x30, true);
  const commitLimit = view.getUint32(0x34, true);
  const peakCommitment = view.getUint32(0x38, true);
  const pageFaults = view.getUint32(0x3c, true);
  const cowCount = view.getUint32(0x40, true);
  const transitionCount = view.getUint32(0x44, true);
  const pageReadCount = view.getUint32(0x50, true);

  const formatBigBytes = (b: bigint): string => {
    const n = Number(b);
    if (n < 1024) return `${n} B`;
    if (n < 1024 ** 2) return `${(n / 1024).toFixed(2)} KB`;
    if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(2)} MB`;
    return `${(n / 1024 ** 3).toFixed(2)} GB`;
  };

  // Idle time is in 100ns ticks
  const idleSec = Number(idleTime) / 10_000_000;

  row('Idle Process Time:', `${idleSec.toFixed(1)} sec (100ns ticks: ${idleTime})`);
  row('I/O Read Bytes:', formatBigBytes(ioReadBytes));
  row('I/O Write Bytes:', formatBigBytes(ioWriteBytes));
  row('I/O Other Bytes:', formatBigBytes(ioOtherBytes));
  row('I/O Read Ops:', ioReadOps.toLocaleString());
  row('I/O Write Ops:', ioWriteOps.toLocaleString());
  row('I/O Other Ops:', ioOtherOps.toLocaleString());
  row('Available Pages:', availPages.toLocaleString());
  row('Committed Pages:', committedPages.toLocaleString());
  row('Commit Limit:', commitLimit.toLocaleString());
  row('Peak Commitment:', peakCommitment.toLocaleString());
  row('Page Faults:', pageFaults.toLocaleString());
  row('Copy-on-Write Count:', cowCount.toLocaleString());
  row('Transition Count:', transitionCount.toLocaleString());
  row('Page Read Count:', pageReadCount.toLocaleString());
  row('Return Length:', `${perfRetLen.readUInt32LE(0)} bytes`);
} else {
  console.log(`    NtQuerySystemInformation(Perf) failed: 0x${(perfStatus >>> 0).toString(16)}`);
}

// 5. SystemTimeOfDayInformation (class 3)
heading('TIME-OF-DAY INFORMATION (class 3)');

const todBuf = Buffer.alloc(48);
const todRetLen = Buffer.alloc(4);

const todStatus = Ntdll.NtQuerySystemInformation(
  SystemInformationClass.SystemTimeOfDayInformation,
  todBuf.ptr,
  todBuf.byteLength,
  todRetLen.ptr,
);

if (todStatus === STATUS_SUCCESS) {
  const view = new DataView(todBuf.buffer);
  // SYSTEM_TIMEOFDAY_INFORMATION:
  // 0x00: LARGE_INTEGER BootTime
  // 0x08: LARGE_INTEGER CurrentTime
  // 0x10: LARGE_INTEGER TimeZoneBias
  // 0x18: ULONG TimeZoneId
  // 0x1C: ULONG Reserved
  // 0x20: ULONGLONG BootTimeBias
  // 0x28: ULONGLONG SleepTimeBias
  const bootTime = view.getBigInt64(0x00, true);
  const currentTime = view.getBigInt64(0x08, true);
  const timeZoneBias = view.getBigInt64(0x10, true);
  const timeZoneId = view.getUint32(0x18, true);

  const fileTimeToDate = (ft: bigint): string => {
    const ms = Number(ft / 10_000n) - 11_644_473_600_000;
    return new Date(ms).toISOString();
  };

  const biasMinutes = Number(timeZoneBias / 600_000_000n);

  row('Boot Time:', fileTimeToDate(bootTime));
  row('Current Time:', fileTimeToDate(currentTime));
  row('Time Zone Bias:', `${biasMinutes} min (UTC${biasMinutes <= 0 ? '+' : '-'}${Math.abs(biasMinutes / 60)})`);
  row('Time Zone ID:', `${timeZoneId}`);

  if (todRetLen.readUInt32LE(0) >= 0x30) {
    const bootTimeBias = view.getBigUint64(0x20, true);
    const sleepTimeBias = view.getBigUint64(0x28, true);
    row('Boot Time Bias:', `${bootTimeBias} (100ns ticks)`);
    row('Sleep Time Bias:', `${sleepTimeBias} (100ns ticks)`);
  }
  row('Return Length:', `${todRetLen.readUInt32LE(0)} bytes`);
} else {
  console.log(`    NtQuerySystemInformation(TimeOfDay) failed: 0x${(todStatus >>> 0).toString(16)}`);
}

// 6. Current system time
heading('SYSTEM TIME (NtQuerySystemTime)');

const sysTimeBuf = Buffer.alloc(8);
const sysTimeStatus = Ntdll.NtQuerySystemTime(sysTimeBuf.ptr);

if (sysTimeStatus === STATUS_SUCCESS) {
  const ticks = sysTimeBuf.readBigInt64LE(0);
  const ms = Number(ticks / 10_000n) - 11_644_473_600_000;
  row('Raw Ticks:', ticks.toString());
  row('ISO 8601:', new Date(ms).toISOString());
  row('Epoch (ms):', ms.toLocaleString());
} else {
  console.log(`    NtQuerySystemTime failed: 0x${(sysTimeStatus >>> 0).toString(16)}`);
}

// 7. Timer resolution
heading('TIMER RESOLUTION (NtQueryTimerResolution)');

const maxResBuf = Buffer.alloc(4);
const minResBuf = Buffer.alloc(4);
const curResBuf = Buffer.alloc(4);

const timerStatus = Ntdll.NtQueryTimerResolution(maxResBuf.ptr, minResBuf.ptr, curResBuf.ptr);

if (timerStatus === STATUS_SUCCESS) {
  const max100ns = maxResBuf.readUInt32LE(0);
  const min100ns = minResBuf.readUInt32LE(0);
  const cur100ns = curResBuf.readUInt32LE(0);

  row('Maximum (coarsest):', `${(max100ns / 10000).toFixed(1)} ms (${max100ns} x 100ns)`);
  row('Minimum (finest):', `${(min100ns / 10000).toFixed(4)} ms (${min100ns} x 100ns)`);
  row('Current:', `${(cur100ns / 10000).toFixed(4)} ms (${cur100ns} x 100ns)`);
} else {
  console.log(`    NtQueryTimerResolution failed: 0x${(timerStatus >>> 0).toString(16)}`);
}

console.log(`\n${'='.repeat(W)}\n`);
