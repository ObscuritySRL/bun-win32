/** Pure struct decoders over kernel-filled Buffers — no FFI imports, unit-testable with byte fixtures (structs.test.ts). */

const FILETIME_EPOCH_OFFSET_MS = 11_644_473_600_000; // 1601-01-01 → 1970-01-01

export interface CpuTime {
  /** 100 ns ticks spent idle. */
  idle: bigint;
  /** 100 ns ticks in kernel mode — INCLUDES idle (NT convention). */
  kernel: bigint;
  /** 100 ns ticks in user mode. */
  user: bigint;
}

export interface InterfaceCounter {
  alias: string;
  description: string;
  inDiscards: number;
  inErrors: number;
  inOctets: number;
  inUcastPackets: number;
  interfaceIndex: number;
  interfaceLuid: bigint;
  mediaConnectState: number;
  mtu: number;
  /** IF_OPER_STATUS: 1 = up, 2 = down, 3 = testing, … */
  operStatus: number;
  outDiscards: number;
  outErrors: number;
  outOctets: number;
  outUcastPackets: number;
  /** Colon-separated MAC, empty when the interface has none. */
  physicalAddress: string;
  /** Bits per second. */
  receiveLinkSpeed: number;
  /** Bits per second. */
  transmitLinkSpeed: number;
  type: number;
}

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

export interface TcpSocket {
  family: 4 | 6;
  localAddress: string;
  localPort: number;
  pid: number;
  remoteAddress: string;
  remotePort: number;
  /** MIB_TCP_STATE 1–12 (2 = LISTEN, 5 = ESTABLISHED). */
  state: number;
  stateName: string;
}

export interface UdpSocket {
  family: 4 | 6;
  localAddress: string;
  localPort: number;
  pid: number;
}

export const TCP_STATE_NAMES = ['', 'CLOSED', 'LISTEN', 'SYN_SENT', 'SYN_RCVD', 'ESTABLISHED', 'FIN_WAIT1', 'FIN_WAIT2', 'CLOSE_WAIT', 'CLOSING', 'LAST_ACK', 'TIME_WAIT', 'DELETE_TCB'] as const;

/** NUL-terminated UTF-16LE string within a fixed-size WCHAR field. */
export function decodeNulTerminatedUnicodeString(buffer: Buffer, offset: number, maxChars: number): string {
  let length = 0;
  while (length < maxChars && buffer.readUInt16LE(offset + length * 2) !== 0) length += 1;
  return buffer.subarray(offset, offset + length * 2).toString('utf16le');
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

/** Memory-order IPv4 bytes of a MIB row's u32 → dotted quad. */
export function formatIpv4Address(value: number): string {
  return `${value & 0xff}.${(value >>> 8) & 0xff}.${(value >>> 16) & 0xff}.${(value >>> 24) & 0xff}`;
}

/** 16 raw bytes → RFC 5952-style IPv6 string (longest zero run compressed). */
export function formatIpv6Address(buffer: Buffer, offset: number): string {
  const hextets: number[] = new Array(8);
  for (let i = 0; i < 8; i += 1) hextets[i] = buffer.readUInt16BE(offset + i * 2);
  let runStart = -1;
  let runLength = 0;
  let bestStart = -1;
  let bestLength = 0;
  for (let i = 0; i <= 8; i += 1) {
    if (i < 8 && hextets[i] === 0) {
      if (runStart < 0) runStart = i;
      runLength += 1;
    } else {
      if (runLength > bestLength) {
        bestStart = runStart;
        bestLength = runLength;
      }
      runStart = -1;
      runLength = 0;
    }
  }
  if (bestLength < 2) return hextets.map((hextet) => hextet.toString(16)).join(':');
  const head = hextets
    .slice(0, bestStart)
    .map((hextet) => hextet.toString(16))
    .join(':');
  const tail = hextets
    .slice(bestStart + bestLength)
    .map((hextet) => hextet.toString(16))
    .join(':');
  return `${head}::${tail}`;
}

/** Network-byte-order port stored in a MIB row's u32 → host order. */
export function formatNetworkPort(value: number): number {
  return (((value & 0xff) << 8) | ((value >>> 8) & 0xff)) & 0xffff;
}

/**
 * MIB_IF_TABLE2 (netioapi.h): NumEntries u32@0, MIB_IF_ROW2 rows @8 at stride 0x548 (1352 B).
 * Per row: InterfaceLuid u64@0x00, InterfaceIndex u32@0x08, Alias WCHAR[257]@0x1C,
 * Description WCHAR[257]@0x21E, PhysicalAddressLength u32@0x420, PhysicalAddress@0x424,
 * Mtu u32@0x464, Type u32@0x468, OperStatus u32@0x484, MediaConnectState u32@0x48C,
 * TransmitLinkSpeed u64@0x4A8, ReceiveLinkSpeed u64@0x4B0, then the In/Out stat u64 block:
 * InOctets@0x4B8, InUcastPkts@0x4C0, InNUcastPkts@0x4C8, InDiscards@0x4D0, InErrors@0x4D8,
 * InUnknownProtos@0x4E0 … OutOctets@0x500, OutUcastPkts@0x508, OutNUcastPkts@0x510,
 * OutDiscards@0x518, OutErrors@0x520. Offsets derived from the SDK header (IF_MAX_STRING_SIZE
 * 256, IF_MAX_PHYS_ADDRESS_LENGTH 32) and runtime-verified (alias readable, octets monotonic).
 */
export function parseInterfaceTable(buffer: Buffer): InterfaceCounter[] {
  const count = buffer.readUInt32LE(0);
  const rows: InterfaceCounter[] = new Array(count);
  for (let i = 0; i < count; i += 1) {
    const offset = 8 + i * 0x548;
    const physicalAddressLength = Math.min(buffer.readUInt32LE(offset + 0x420), 32);
    let physicalAddress = '';
    for (let b = 0; b < physicalAddressLength; b += 1) physicalAddress += `${b > 0 ? ':' : ''}${buffer[offset + 0x424 + b]!.toString(16).padStart(2, '0')}`;
    rows[i] = {
      alias: decodeNulTerminatedUnicodeString(buffer, offset + 0x1c, 257),
      description: decodeNulTerminatedUnicodeString(buffer, offset + 0x21e, 257),
      inDiscards: buffer.readUInt32LE(offset + 0x4d0) + buffer.readUInt32LE(offset + 0x4d4) * 4_294_967_296,
      inErrors: buffer.readUInt32LE(offset + 0x4d8) + buffer.readUInt32LE(offset + 0x4dc) * 4_294_967_296,
      inOctets: buffer.readUInt32LE(offset + 0x4b8) + buffer.readUInt32LE(offset + 0x4bc) * 4_294_967_296,
      inUcastPackets: buffer.readUInt32LE(offset + 0x4c0) + buffer.readUInt32LE(offset + 0x4c4) * 4_294_967_296,
      interfaceIndex: buffer.readUInt32LE(offset + 0x08),
      interfaceLuid: buffer.readBigUInt64LE(offset),
      mediaConnectState: buffer.readUInt32LE(offset + 0x48c),
      mtu: buffer.readUInt32LE(offset + 0x464),
      operStatus: buffer.readUInt32LE(offset + 0x484),
      outDiscards: buffer.readUInt32LE(offset + 0x518) + buffer.readUInt32LE(offset + 0x51c) * 4_294_967_296,
      outErrors: buffer.readUInt32LE(offset + 0x520) + buffer.readUInt32LE(offset + 0x524) * 4_294_967_296,
      outOctets: buffer.readUInt32LE(offset + 0x500) + buffer.readUInt32LE(offset + 0x504) * 4_294_967_296,
      outUcastPackets: buffer.readUInt32LE(offset + 0x508) + buffer.readUInt32LE(offset + 0x50c) * 4_294_967_296,
      physicalAddress,
      receiveLinkSpeed: buffer.readUInt32LE(offset + 0x4b0) + buffer.readUInt32LE(offset + 0x4b4) * 4_294_967_296,
      transmitLinkSpeed: buffer.readUInt32LE(offset + 0x4a8) + buffer.readUInt32LE(offset + 0x4ac) * 4_294_967_296,
      type: buffer.readUInt32LE(offset + 0x468),
    };
  }
  return rows;
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

/** SYSTEM_PROCESSOR_PERFORMANCE_INFORMATION array (48 B per core): IdleTime i64@0x00, KernelTime i64@0x08 (INCLUDES idle), UserTime i64@0x10; Dpc/Interrupt/InterruptCount fill the rest of the stride. */
export function parseProcessorTimes(buffer: Buffer, coreCount: number): CpuTime[] {
  const times: CpuTime[] = new Array(coreCount);
  for (let core = 0; core < coreCount; core += 1) {
    const offset = core * 48;
    times[core] = {
      idle: buffer.readBigInt64LE(offset),
      kernel: buffer.readBigInt64LE(offset + 8),
      user: buffer.readBigInt64LE(offset + 16),
    };
  }
  return times;
}

/** MIB_TCP6TABLE_OWNER_PID: dwNumEntries u32@0, 56 B rows @4 — ucLocalAddr[16]@0, dwLocalScopeId@16, dwLocalPort@20 (network order), ucRemoteAddr[16]@24, dwRemoteScopeId@40, dwRemotePort@44, dwState@48, dwOwningPid@52. */
export function parseTcp6Table(buffer: Buffer): TcpSocket[] {
  const count = buffer.readUInt32LE(0);
  const rows: TcpSocket[] = new Array(count);
  for (let i = 0; i < count; i += 1) {
    const offset = 4 + i * 56;
    const state = buffer.readUInt32LE(offset + 48);
    rows[i] = {
      family: 6,
      localAddress: formatIpv6Address(buffer, offset),
      localPort: formatNetworkPort(buffer.readUInt32LE(offset + 20)),
      pid: buffer.readUInt32LE(offset + 52),
      remoteAddress: formatIpv6Address(buffer, offset + 24),
      remotePort: formatNetworkPort(buffer.readUInt32LE(offset + 44)),
      state,
      stateName: TCP_STATE_NAMES[state] ?? `STATE_${state}`,
    };
  }
  return rows;
}

/** MIB_TCPTABLE_OWNER_PID: dwNumEntries u32@0, 24 B rows @4 — dwState@0, dwLocalAddr@4, dwLocalPort@8 (network order), dwRemoteAddr@12, dwRemotePort@16, dwOwningPid@20. */
export function parseTcpTable(buffer: Buffer): TcpSocket[] {
  const count = buffer.readUInt32LE(0);
  const rows: TcpSocket[] = new Array(count);
  for (let i = 0; i < count; i += 1) {
    const offset = 4 + i * 24;
    const state = buffer.readUInt32LE(offset);
    rows[i] = {
      family: 4,
      localAddress: formatIpv4Address(buffer.readUInt32LE(offset + 4)),
      localPort: formatNetworkPort(buffer.readUInt32LE(offset + 8)),
      pid: buffer.readUInt32LE(offset + 20),
      remoteAddress: formatIpv4Address(buffer.readUInt32LE(offset + 12)),
      remotePort: formatNetworkPort(buffer.readUInt32LE(offset + 16)),
      state,
      stateName: TCP_STATE_NAMES[state] ?? `STATE_${state}`,
    };
  }
  return rows;
}

/** MIB_UDP6TABLE_OWNER_PID: dwNumEntries u32@0, 28 B rows @4 — ucLocalAddr[16]@0, dwLocalScopeId@16, dwLocalPort@20 (network order), dwOwningPid@24. */
export function parseUdp6Table(buffer: Buffer): UdpSocket[] {
  const count = buffer.readUInt32LE(0);
  const rows: UdpSocket[] = new Array(count);
  for (let i = 0; i < count; i += 1) {
    const offset = 4 + i * 28;
    rows[i] = {
      family: 6,
      localAddress: formatIpv6Address(buffer, offset),
      localPort: formatNetworkPort(buffer.readUInt32LE(offset + 20)),
      pid: buffer.readUInt32LE(offset + 24),
    };
  }
  return rows;
}

/** MIB_UDPTABLE_OWNER_PID: dwNumEntries u32@0, 12 B rows @4 — dwLocalAddr@0, dwLocalPort@4 (network order), dwOwningPid@8. */
export function parseUdpTable(buffer: Buffer): UdpSocket[] {
  const count = buffer.readUInt32LE(0);
  const rows: UdpSocket[] = new Array(count);
  for (let i = 0; i < count; i += 1) {
    const offset = 4 + i * 12;
    rows[i] = {
      family: 4,
      localAddress: formatIpv4Address(buffer.readUInt32LE(offset)),
      localPort: formatNetworkPort(buffer.readUInt32LE(offset + 4)),
      pid: buffer.readUInt32LE(offset + 8),
    };
  }
  return rows;
}
