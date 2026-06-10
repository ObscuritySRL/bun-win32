import Kernel32, { ProcessAccessRights } from '@bun-win32/kernel32';
import User32 from '@bun-win32/user32';
import Ntdll, { STATUS_SUCCESS, SystemInformationClass } from '@bun-win32/ntdll';
import { cpuLayout } from './system';
import { monotonicMicroseconds } from './sampler';
import { preloadPending } from './preload';
import { type ProcessInfo, decodeUnicodeString, parseProcessSnapshot } from './structs';

preloadPending(Kernel32, ['CloseHandle', 'GetProcessHandleCount', 'GetProcessIoCounters', 'OpenProcess', 'QueryFullProcessImageNameW']);
preloadPending(User32, ['GetGuiResources']);
preloadPending(Ntdll, ['NtQuerySystemInformation']);
const { CloseHandle, GetProcessHandleCount, GetProcessIoCounters, OpenProcess, QueryFullProcessImageNameW } = Kernel32;
const { GetGuiResources } = User32;
const { NtQuerySystemInformation } = Ntdll;

const STATUS_INFO_LENGTH_MISMATCH = 0xc000_0004 | 0;

export interface PidStats {
  /** CPU%% since the previous `pidStats` call for this pid (first call: since process start), normalized by logical core count — Task Manager's definition, so a single-threaded spin on a 24-core box reads ~4.2, not 100. */
  cpu: number;
  /** Total CPU time (kernel + user) in milliseconds — pidusage's `ctime`. */
  ctime: number;
  /** Milliseconds since the process started — pidusage's `elapsed`. */
  elapsed: number;
  /** Working-set bytes — pidusage's `memory`. */
  memory: number;
  pid: number;
  ppid: number;
  /** `Date.now()` at sample time — pidusage's `timestamp`. */
  timestamp: number;
}

export interface ProcessSample {
  cpuPercent: number;
  name: string;
  pid: number;
  workingSetBytes: number;
}

export interface ProcessTreeNode {
  children: ProcessTreeNode[];
  process: ProcessInfo;
}

let snapshotBuffer = Buffer.alloc(2 * 1024 * 1024);
const returnLength = Buffer.alloc(4);

// One NtQuerySystemInformation(class 5) call with the STATUS_INFO_LENGTH_MISMATCH grow-retry.
// The buffer is module-lived and grow-only; .ptr is read per call (Buffer stores can relocate under GC).
function fetchProcessSnapshot(): number {
  for (;;) {
    const snapshotPointer = snapshotBuffer.ptr;
    const status = NtQuerySystemInformation(SystemInformationClass.SystemProcessInformation, snapshotPointer, snapshotBuffer.byteLength, returnLength.ptr);
    if (status === STATUS_SUCCESS) return snapshotPointer;
    if (status !== STATUS_INFO_LENGTH_MISMATCH) throw new Error(`NtQuerySystemInformation(SystemProcessInformation) failed: NTSTATUS 0x${(status >>> 0).toString(16)}`);
    snapshotBuffer = Buffer.alloc(Math.max(returnLength.readUInt32LE(0) + 65_536, snapshotBuffer.byteLength * 2));
  }
}

/** The entire process list — pid, ppid, name, threads, handles, CPU times, working set, private bytes, IO counters, createTime — from ONE syscall (no per-PID spawns, no WMI). */
export function processes(): ProcessInfo[] {
  return parseProcessSnapshot(snapshotBuffer, fetchProcessSnapshot());
}

const previousPidTimes = new Map<number, number>();
const previousPidWall = new Map<number, number>();

function pidStatsFromRows(rows: ProcessInfo[], pid: number, coreCount: number, timestamp: number, nowMicroseconds: number): PidStats | null {
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i]!;
    if (row.pid !== pid) continue;
    const cpuTicks = Number(row.kernelTime + row.userTime); // CPU time fits 2^53 (28+ years of CPU)
    const ctime = cpuTicks / 10_000;
    const elapsed = timestamp - row.createTime.getTime();
    const previousTicks = previousPidTimes.get(pid);
    const previousWall = previousPidWall.get(pid);
    previousPidTimes.set(pid, cpuTicks);
    previousPidWall.set(pid, nowMicroseconds);
    let cpu: number;
    if (previousTicks === undefined || previousWall === undefined || cpuTicks < previousTicks) {
      cpu = elapsed > 0 ? (ctime / elapsed / coreCount) * 100 : 0; // first call: average since process start (pidusage semantics)
    } else {
      const wallTicks = (nowMicroseconds - previousWall) * 10; // µs → 100 ns
      cpu = wallTicks > 0 ? ((cpuTicks - previousTicks) / wallTicks / coreCount) * 100 : 0;
    }
    return { cpu, ctime, elapsed, memory: row.workingSetBytes, pid, ppid: row.ppid, timestamp };
  }
  return null;
}

/** pidusage-shaped per-PID stats (`{cpu, memory, ppid, pid, ctime, elapsed, timestamp}`) from the snapshot — zero per-PID process spawns. Throws for a pid that is not running. */
export function pidStats(pid: number): PidStats;
export function pidStats(pids: number[]): Record<number, PidStats>;
export function pidStats(pidOrPids: number | number[]): PidStats | Record<number, PidStats> {
  const rows = processes();
  const coreCount = cpuLayout().logicalProcessorCount;
  const timestamp = Date.now();
  const nowMicroseconds = monotonicMicroseconds();
  if (typeof pidOrPids === 'number') {
    const stats = pidStatsFromRows(rows, pidOrPids, coreCount, timestamp, nowMicroseconds);
    if (stats === null) throw new Error(`pidStats: no process with pid ${pidOrPids}`);
    return stats;
  }
  const results: Record<number, PidStats> = {};
  for (const pid of pidOrPids) {
    const stats = pidStatsFromRows(rows, pid, coreCount, timestamp, nowMicroseconds);
    if (stats !== null) results[pid] = stats;
  }
  return results;
}

/** Full executable path of a process (QueryFullProcessImageNameW via PROCESS_QUERY_LIMITED_INFORMATION); null when access is denied or the pid is gone. */
export function processImagePath(pid: number): string | null {
  const processHandle = OpenProcess(ProcessAccessRights.PROCESS_QUERY_LIMITED_INFORMATION, 0, pid);
  if (processHandle === 0n) return null;
  const pathBuffer = Buffer.alloc(1040);
  const sizeBuffer = Buffer.alloc(4);
  sizeBuffer.writeUInt32LE(520, 0);
  const succeeded = QueryFullProcessImageNameW(processHandle, 0, pathBuffer.ptr, sizeBuffer.ptr);
  void CloseHandle(processHandle);
  if (succeeded === 0) return null;
  return decodeUnicodeString(pathBuffer, 0, sizeBuffer.readUInt32LE(0) * 2);
}

/**
 * Parent→children process tree from one snapshot's ppid edges — the ps-tree/pidtree capability
 * with zero spawns, working on wmic-less Windows (11 24H2+/Server 2025). With no argument the
 * virtual root (pid −1, name '') parents every top-level chain; node count then equals the
 * snapshot length. Orphans (ppid no longer running) and pid-reuse cycles become roots.
 */
export function processTree(rootPid?: number): ProcessTreeNode {
  const rows = processes();
  const nodesByPid = new Map<number, ProcessTreeNode>();
  for (let i = 0; i < rows.length; i += 1) nodesByPid.set(rows[i]!.pid, { children: [], process: rows[i]! });
  const roots: ProcessTreeNode[] = [];
  for (const node of nodesByPid.values()) {
    const parent = nodesByPid.get(node.process.ppid);
    if (parent === undefined || parent === node) {
      roots.push(node);
    } else {
      parent.children.push(node);
    }
  }
  // pid-reuse can fabricate ppid cycles unreachable from any root — surface them as roots so no process is dropped
  const reachable = new Set<ProcessTreeNode>();
  const stack = [...roots];
  while (stack.length > 0) {
    const node = stack.pop()!;
    if (reachable.has(node)) continue;
    reachable.add(node);
    for (let i = 0; i < node.children.length; i += 1) stack.push(node.children[i]!);
  }
  for (const node of nodesByPid.values()) {
    if (!reachable.has(node)) {
      roots.push(node);
      reachable.add(node);
      for (let i = 0; i < node.children.length; i += 1) stack.push(node.children[i]!);
      while (stack.length > 0) {
        const child = stack.pop()!;
        if (reachable.has(child)) continue;
        reachable.add(child);
        for (let i = 0; i < child.children.length; i += 1) stack.push(child.children[i]!);
      }
    }
  }
  if (rootPid !== undefined) {
    const node = nodesByPid.get(rootPid);
    if (node === undefined) throw new Error(`processTree: no process with pid ${rootPid}`);
    return node;
  }
  const virtualProcess: ProcessInfo = {
    basePriority: 0,
    createTime: new Date(0),
    handleCount: 0,
    ioOtherBytes: 0,
    ioOtherOperations: 0,
    ioReadBytes: 0,
    ioReadOperations: 0,
    ioWriteBytes: 0,
    ioWriteOperations: 0,
    kernelTime: 0n,
    name: '',
    pageFaultCount: 0,
    peakWorkingSetBytes: 0,
    pid: -1,
    ppid: -1,
    privateBytes: 0,
    sessionId: 0,
    threadCount: 0,
    userTime: 0n,
    virtualBytes: 0,
    workingSetBytes: 0,
  };
  return { children: roots, process: virtualProcess };
}

/**
 * Repeated-sampling engine for live dashboards: holds the previous per-PID CPU times and ranks
 * by CPU%% between calls. The hot walk reads the raw snapshot with a cached DataView and pure
 * Number math (no bigint, no ProcessInfo allocation); names decode only for returned rows.
 */
export class ProcessSampler {
  #coreCount: number;
  #currentTimes = new Map<number, number>();
  #previousTimes = new Map<number, number>();
  #previousWall = -1;
  #view = new DataView(snapshotBuffer.buffer, snapshotBuffer.byteOffset, snapshotBuffer.byteLength);
  #viewBuffer = snapshotBuffer;

  constructor() {
    this.#coreCount = cpuLayout().logicalProcessorCount;
  }

  /** Take a snapshot and return rows ranked by CPU%% since the previous call (first call ranks everything at 0). */
  sample(limit = 25): ProcessSample[] {
    const bufferBase = fetchProcessSnapshot();
    if (this.#viewBuffer !== snapshotBuffer) {
      this.#view = new DataView(snapshotBuffer.buffer, snapshotBuffer.byteOffset, snapshotBuffer.byteLength); // re-wrap only after a grow-retry swap
      this.#viewBuffer = snapshotBuffer;
    }
    const view = this.#view;
    const nowMicroseconds = monotonicMicroseconds();
    const wallTicks = this.#previousWall < 0 ? 0 : (nowMicroseconds - this.#previousWall) * 10;
    const denominator = wallTicks * this.#coreCount;
    const previousTimes = this.#previousTimes;
    const currentTimes = this.#currentTimes;
    currentTimes.clear();
    const offsets: number[] = [];
    const percents: number[] = [];
    let offset = 0;
    for (let guard = 0; guard < 200_000 && offset + 0x100 <= this.#viewBuffer.byteLength; guard += 1) {
      const pid = view.getUint32(offset + 0x50, true);
      const kernelLow = view.getUint32(offset + 0x30, true);
      const kernelHigh = view.getUint32(offset + 0x34, true);
      const userLow = view.getUint32(offset + 0x28, true);
      const userHigh = view.getUint32(offset + 0x2c, true);
      const cpuTicks = (kernelHigh + userHigh) * 4_294_967_296 + kernelLow + userLow;
      currentTimes.set(pid, cpuTicks);
      const previousTicks = previousTimes.get(pid);
      if (pid !== 0 && previousTicks !== undefined && cpuTicks >= previousTicks && denominator > 0) {
        const percent = ((cpuTicks - previousTicks) / denominator) * 100;
        if (percent > 0) {
          offsets.push(offset);
          percents.push(percent);
        }
      }
      const next = view.getUint32(offset, true);
      if (next === 0) break;
      offset += next;
    }
    this.#previousTimes = currentTimes;
    this.#currentTimes = previousTimes;
    this.#previousWall = nowMicroseconds;
    const order = percents.map((_, index) => index).sort((a, b) => percents[b]! - percents[a]!);
    const rowCount = Math.min(limit, order.length);
    const rows: ProcessSample[] = new Array(rowCount);
    for (let rank = 0; rank < rowCount; rank += 1) {
      const rowOffset = offsets[order[rank]!]!;
      const pid = view.getUint32(rowOffset + 0x50, true);
      const nameLength = view.getUint16(rowOffset + 0x38, true);
      let name = pid === 0 ? 'Idle' : pid === 4 ? 'System' : '';
      if (nameLength > 0 && nameLength < 1024) {
        const nameAddress = view.getUint32(rowOffset + 0x40, true) + view.getUint32(rowOffset + 0x44, true) * 4_294_967_296;
        const relative = nameAddress - bufferBase;
        if (relative > 0 && relative + nameLength <= this.#viewBuffer.byteLength) name = decodeUnicodeString(this.#viewBuffer, relative, nameLength);
      }
      rows[rank] = {
        cpuPercent: percents[order[rank]!]!,
        name,
        pid,
        workingSetBytes: view.getUint32(rowOffset + 0x90, true) + view.getUint32(rowOffset + 0x94, true) * 4_294_967_296,
      };
    }
    return rows;
  }
}

export interface ProcessIoCounters {
  otherBytes: number;
  otherOperations: number;
  readBytes: number;
  readOperations: number;
  writeBytes: number;
  writeOperations: number;
}

export interface ProcessObjectCounts {
  /** GDI objects (GetGuiResources flag 0) — the classic GDI-leak metric. */
  gdiObjects: number;
  handleCount: number;
  /** USER objects (GetGuiResources flag 1). */
  userObjects: number;
}

/** Cumulative I/O for one process (GetProcessIoCounters; IO_COUNTERS 48 B = six u64) — per-process disk/IO attribution systeminformation's disksIO() null-stubs on Windows (si#274). Null when access is denied. */
export function processIoCounters(pid: number): ProcessIoCounters | null {
  const processHandle = OpenProcess(ProcessAccessRights.PROCESS_QUERY_LIMITED_INFORMATION, 0, pid);
  if (processHandle === 0n) return null;
  const ioBuffer = Buffer.alloc(48);
  const succeeded = GetProcessIoCounters(processHandle, ioBuffer.ptr);
  void CloseHandle(processHandle);
  if (succeeded === 0) return null;
  return {
    otherBytes: Number(ioBuffer.readBigUInt64LE(40)),
    otherOperations: Number(ioBuffer.readBigUInt64LE(16)),
    readBytes: Number(ioBuffer.readBigUInt64LE(24)),
    readOperations: Number(ioBuffer.readBigUInt64LE(0)),
    writeBytes: Number(ioBuffer.readBigUInt64LE(32)),
    writeOperations: Number(ioBuffer.readBigUInt64LE(8)),
  };
}

/** Handle/GDI/USER object counts for one process (GetProcessHandleCount + user32 GetGuiResources) — the leak-hunting trio no JS package exposes. Null when access is denied. */
export function processObjectCounts(pid: number): ProcessObjectCounts | null {
  const processHandle = OpenProcess(ProcessAccessRights.PROCESS_QUERY_LIMITED_INFORMATION, 0, pid);
  if (processHandle === 0n) return null;
  const handleCountBuffer = Buffer.alloc(4);
  const succeeded = GetProcessHandleCount(processHandle, handleCountBuffer.ptr);
  const gdiObjects = GetGuiResources(processHandle, 0);
  const userObjects = GetGuiResources(processHandle, 1);
  void CloseHandle(processHandle);
  if (succeeded === 0) return null;
  return { gdiObjects, handleCount: handleCountBuffer.readUInt32LE(0), userObjects };
}
