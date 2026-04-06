/**
 * Process Explorer
 *
 * Demonstrates using Kernel32's Toolhelp32 snapshot APIs to enumerate
 * running processes on the system, similar to Task Manager.
 */
import { ptr } from 'bun:ffi';
import Kernel32, { ToolhelpSnapshotFlags, INVALID_HANDLE_VALUE } from '@bun-win32/kernel32';

// Preload required APIs
Kernel32.Preload(['CreateToolhelp32Snapshot', 'Process32FirstW', 'Process32NextW', 'CloseHandle', 'OpenProcess', 'GetProcessTimes', 'GetCurrentProcessId', 'GetLastError']);

// ─────────────────────────────────────────────────────────────────────────────
// PROCESSENTRY32W struct layout (568 bytes on Windows)
// ─────────────────────────────────────────────────────────────────────────────

const PROCESSENTRY32W_SIZE = 568;
const MAX_PATH = 260;

interface ProcessInfo {
  pid: number;
  parentPid: number;
  threadCount: number;
  basePriority: number;
  exeName: string;
}

function readProcessEntry(buffer: ArrayBuffer): ProcessInfo {
  const view = new DataView(buffer);

  // PROCESSENTRY32W layout:
  // 0x00: DWORD dwSize
  // 0x04: DWORD cntUsage
  // 0x08: DWORD th32ProcessID
  // 0x0C: ULONG_PTR th32DefaultHeapID (8 bytes on x64)
  // 0x14: DWORD th32ModuleID
  // 0x18: DWORD cntThreads
  // 0x1C: DWORD th32ParentProcessID
  // 0x20: LONG  pcPriClassBase
  // 0x24: DWORD dwFlags
  // 0x28: WCHAR szExeFile[MAX_PATH] (520 bytes)

  const pid = view.getUint32(0x08, true);
  const threadCount = view.getUint32(0x18, true);
  const parentPid = view.getUint32(0x1c, true);
  const basePriority = view.getInt32(0x20, true);

  // Read exe name (wide string at offset 0x28 on x64, 0x24 on x86)
  // On x64, th32DefaultHeapID is 8 bytes, so offset is 0x2C
  const exeOffset = 0x2c;
  const exeBytes = new Uint8Array(buffer, exeOffset, MAX_PATH * 2);
  let exeName = '';
  for (let i = 0; i < MAX_PATH; i++) {
    const code = (exeBytes[i * 2] ?? 0) | ((exeBytes[i * 2 + 1] ?? 0) << 8);
    if (code === 0) break;
    exeName += String.fromCharCode(code);
  }

  return { pid, parentPid, threadCount, basePriority, exeName };
}

// ─────────────────────────────────────────────────────────────────────────────
// Enumerate processes
// ─────────────────────────────────────────────────────────────────────────────

function enumerateProcesses(): ProcessInfo[] {
  const processes: ProcessInfo[] = [];

  // Create a snapshot of all processes
  const hSnapshot = Kernel32.CreateToolhelp32Snapshot(ToolhelpSnapshotFlags.TH32CS_SNAPPROCESS, 0);

  if (hSnapshot === INVALID_HANDLE_VALUE || hSnapshot === null) {
    console.error(`Failed to create snapshot. Error: ${Kernel32.GetLastError()}`);
    return processes;
  }

  // Prepare PROCESSENTRY32W buffer
  const entryBuffer = new ArrayBuffer(PROCESSENTRY32W_SIZE);
  const entryView = new DataView(entryBuffer);
  entryView.setUint32(0, PROCESSENTRY32W_SIZE, true); // dwSize

  // Get first process
  if (Kernel32.Process32FirstW(hSnapshot, ptr(entryBuffer))) {
    do {
      processes.push(readProcessEntry(entryBuffer));
      // Reset dwSize for next call
      entryView.setUint32(0, PROCESSENTRY32W_SIZE, true);
    } while (Kernel32.Process32NextW(hSnapshot, ptr(entryBuffer)));
  }

  // Cleanup
  Kernel32.CloseHandle(hSnapshot);

  return processes;
}

// ─────────────────────────────────────────────────────────────────────────────
// Display functions
// ─────────────────────────────────────────────────────────────────────────────

function truncate(str: string, maxLen: number): string {
  return str.length > maxLen ? str.substring(0, maxLen - 3) + '...' : str;
}

function displayProcesses(processes: ProcessInfo[]) {
  const currentPid = Kernel32.GetCurrentProcessId();

  // Sort by PID
  processes.sort((a, b) => a.pid - b.pid);

  console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                           PROCESS EXPLORER                                   ║
║                         powered by bun-kernel32                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Total Processes: ${processes.length.toString().padEnd(57)}║
║  Current Process: ${currentPid.toString().padEnd(57)}║
╠══════════════════════════════════════════════════════════════════════════════╣
║  PID       PPID      THREADS  PRI  PROCESS NAME                              ║
║  ────────  ────────  ───────  ───  ────────────────────────────────────────  ║`);

  for (const proc of processes) {
    const marker = proc.pid === currentPid ? '►' : ' ';
    const pidStr = proc.pid.toString().padStart(7);
    const ppidStr = proc.parentPid.toString().padStart(7);
    const threadStr = proc.threadCount.toString().padStart(6);
    const priStr = proc.basePriority.toString().padStart(3);
    const nameStr = truncate(proc.exeName, 40).padEnd(40);

    console.log(`║${marker} ${pidStr}   ${ppidStr}   ${threadStr}   ${priStr}  ${nameStr} ║`);
  }

  console.log(`╚══════════════════════════════════════════════════════════════════════════════╝`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Build process tree
// ─────────────────────────────────────────────────────────────────────────────

function buildProcessTree(processes: ProcessInfo[]): void {
  const byPid = new Map<number, ProcessInfo>();
  const children = new Map<number, ProcessInfo[]>();

  // Index processes
  for (const proc of processes) {
    byPid.set(proc.pid, proc);
    if (!children.has(proc.parentPid)) {
      children.set(proc.parentPid, []);
    }
    children.get(proc.parentPid)!.push(proc);
  }

  // Find root processes (parent not in list)
  const roots = processes.filter((p) => !byPid.has(p.parentPid));

  console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                            PROCESS TREE                                      ║
╠══════════════════════════════════════════════════════════════════════════════╣`);

  function printTree(proc: ProcessInfo, prefix: string, isLast: boolean) {
    const connector = isLast ? '└─' : '├─';
    const line = `${prefix}${connector} [${proc.pid}] ${proc.exeName}`;
    console.log(`║  ${line.padEnd(74)}║`);

    const kids = children.get(proc.pid) || [];
    kids.forEach((child, i) => {
      const newPrefix = prefix + (isLast ? '   ' : '│  ');
      printTree(child, newPrefix, i === kids.length - 1);
    });
  }

  // Print each root tree (limit to first 5 for readability)
  roots.slice(0, 5).forEach((root, i) => {
    printTree(root, '', i === Math.min(roots.length, 5) - 1);
  });

  if (roots.length > 5) {
    console.log(`║  ... and ${roots.length - 5} more root processes`.padEnd(77) + '║');
  }

  console.log(`╚══════════════════════════════════════════════════════════════════════════════╝`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

const mode = process.argv[2] || 'list';
const processes = enumerateProcesses();

if (mode === 'tree') {
  buildProcessTree(processes);
} else {
  displayProcesses(processes);
}
