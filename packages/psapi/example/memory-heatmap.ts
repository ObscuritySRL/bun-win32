/**
 * Memory Heatmap
 *
 * Enumerates all running processes, measures their memory usage, and renders
 * a colorful ASCII bar chart in the console. Bars are colored by memory
 * intensity: red for heavy consumers, yellow for medium, and green for light.
 *
 * APIs demonstrated (Psapi):
 *   - EnumProcesses             (get all process IDs)
 *   - GetProcessMemoryInfo      (working set, page file usage)
 *   - GetProcessImageFileNameW  (NT device path of executable)
 *
 * APIs demonstrated (Kernel32, cross-package):
 *   - OpenProcess               (obtain process handle)
 *   - CloseHandle               (release handle)
 *
 * PROCESS_MEMORY_COUNTERS layout (72 bytes on x64):
 *   +0x00: DWORD  cb                        (struct size)
 *   +0x04: DWORD  PageFaultCount
 *   +0x08: SIZE_T PeakWorkingSetSize
 *   +0x10: SIZE_T WorkingSetSize
 *   +0x18: SIZE_T QuotaPeakPagedPoolUsage
 *   +0x20: SIZE_T QuotaPagedPoolUsage
 *   +0x28: SIZE_T QuotaPeakNonPagedPoolUsage
 *   +0x30: SIZE_T QuotaNonPagedPoolUsage
 *   +0x38: SIZE_T PagefileUsage
 *   +0x40: SIZE_T PeakPagefileUsage
 *
 * Run: bun run example/memory-heatmap.ts
 */

import Psapi from '../index';
import Kernel32, { ProcessAccessRights } from '@bun-win32/kernel32';

Psapi.Preload(['EnumProcesses', 'GetProcessMemoryInfo', 'GetProcessImageFileNameW']);
Kernel32.Preload(['OpenProcess', 'CloseHandle']);

// ANSI color helpers
const RED = '\x1b[91m';
const YELLOW = '\x1b[93m';
const GREEN = '\x1b[92m';
const CYAN = '\x1b[96m';
const WHITE = '\x1b[97m';
const DIM = '\x1b[2m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

// Enumerate all process IDs into a 64 KB buffer (room for ~16,000 PIDs)
const pidBuf = Buffer.alloc(65536);
const sizeNeeded = Buffer.alloc(4);
const ok = Psapi.EnumProcesses(pidBuf.ptr, pidBuf.byteLength, sizeNeeded.ptr);

if (!ok) {
  console.error('EnumProcesses failed');
  process.exit(1);
}

const pidCount = sizeNeeded.readUInt32LE(0) / 4;
const pidView = new DataView(pidBuf.buffer);

interface ProcessMemory {
  pid: number;
  name: string;
  workingSetMB: number;
  pagefileUsageMB: number;
}

const processes: ProcessMemory[] = [];
const PROCESS_MEMORY_COUNTERS_SIZE = 72;
const PROCESS_QUERY_INFORMATION = ProcessAccessRights.PROCESS_QUERY_INFORMATION;
const PROCESS_VM_READ = ProcessAccessRights.PROCESS_VM_READ;

for (let i = 0; i < pidCount; i++) {
  const pid = pidView.getUint32(i * 4, true);
  if (pid === 0) continue; // Skip System Idle Process

  // Open the process with query + VM read access (needed for memory info and image name)
  const hProcess = Kernel32.OpenProcess(PROCESS_QUERY_INFORMATION | PROCESS_VM_READ, 0, pid);
  if (!hProcess || hProcess === 0n) continue;

  try {
    // Retrieve the NT device path of the executable
    const nameBuf = Buffer.alloc(520);
    const nameLen = Psapi.GetProcessImageFileNameW(hProcess, nameBuf.ptr, 260);

    let name = 'Unknown';
    if (nameLen > 0) {
      const fullPath = nameBuf.subarray(0, nameLen * 2).toString('utf16le');
      const parts = fullPath.split('\\');
      name = parts[parts.length - 1] ?? fullPath;
    }

    // Read the process memory counters struct
    const memBuf = Buffer.alloc(PROCESS_MEMORY_COUNTERS_SIZE);
    new DataView(memBuf.buffer).setUint32(0, PROCESS_MEMORY_COUNTERS_SIZE, true); // cb field
    const memOk = Psapi.GetProcessMemoryInfo(hProcess, memBuf.ptr, PROCESS_MEMORY_COUNTERS_SIZE);

    if (memOk) {
      const memView = new DataView(memBuf.buffer);
      const workingSet = Number(memView.getBigUint64(0x10, true));    // WorkingSetSize
      const pagefileUsage = Number(memView.getBigUint64(0x38, true)); // PagefileUsage

      processes.push({
        pid,
        name,
        workingSetMB: workingSet / (1024 * 1024),
        pagefileUsageMB: pagefileUsage / (1024 * 1024),
      });
    }
  } finally {
    Kernel32.CloseHandle(hProcess);
  }
}

// Sort by working set descending, take top 25
processes.sort((a, b) => b.workingSetMB - a.workingSetMB);
const top = processes.slice(0, 25);
const maxMem = top[0]?.workingSetMB ?? 1;

// Render the heatmap
const BAR_WIDTH = 35;
const NAME_WIDTH = 22;

console.log();
console.log(`  ${CYAN}${BOLD}PROCESS MEMORY HEATMAP${RESET}`);
console.log(`  ${WHITE}Top ${top.length} processes by working set (of ${processes.length} accessible)${RESET}`);
console.log();
console.log(
  `  ${BOLD}${'PROCESS'.padEnd(NAME_WIDTH)} ${'PID'.padStart(7)}  ${'WORKING SET'.padStart(10)}  BAR${RESET}`,
);
console.log(`  ${DIM}${'─'.repeat(NAME_WIDTH + 7 + 10 + BAR_WIDTH + 8)}${RESET}`);

for (const proc of top) {
  const pct = maxMem > 0 ? proc.workingSetMB / maxMem : 0;
  const barLen = Math.max(1, Math.round(pct * BAR_WIDTH));
  const bar = '\u2588'.repeat(barLen);

  // Color intensity: red for heavy, yellow for medium, green for light
  let barColor: string;
  if (pct > 0.6) {
    barColor = RED;
  } else if (pct > 0.25) {
    barColor = YELLOW;
  } else {
    barColor = GREEN;
  }

  // Truncate long process names
  const truncName =
    proc.name.length > NAME_WIDTH ? proc.name.substring(0, NAME_WIDTH - 3) + '...' : proc.name;

  // Format the memory value as GB or MB
  const memStr =
    proc.workingSetMB >= 1024
      ? `${(proc.workingSetMB / 1024).toFixed(1)} GB`
      : `${proc.workingSetMB.toFixed(1)} MB`;

  console.log(
    `  ${WHITE}${truncName.padEnd(NAME_WIDTH)} ${proc.pid.toString().padStart(7)}  ${BOLD}${memStr.padStart(10)}${RESET}  ${barColor}${bar}${RESET}`,
  );
}

// Summary
const totalMB = processes.reduce((s, p) => s + p.workingSetMB, 0);
const totalStr = totalMB >= 1024 ? `${(totalMB / 1024).toFixed(2)} GB` : `${totalMB.toFixed(1)} MB`;

console.log(`  ${DIM}${'─'.repeat(NAME_WIDTH + 7 + 10 + BAR_WIDTH + 8)}${RESET}`);
console.log(`  Total accessible memory: ${CYAN}${BOLD}${totalStr}${RESET} across ${processes.length} processes`);
console.log();
console.log(
  `  Legend: ${RED}\u2588 Heavy (>60%)${RESET}  ${YELLOW}\u2588 Medium (25-60%)${RESET}  ${GREEN}\u2588 Light (<25%)${RESET}`,
);
console.log();
