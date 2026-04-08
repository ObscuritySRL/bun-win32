/**
 * Process Forensics
 *
 * Full process enumeration and inspection tool. For each accessible process,
 * retrieves the executable path, loaded modules (first 5 DLLs), and detailed
 * memory counters. Handles access-denied errors gracefully and formats output
 * as a multi-line report per process.
 *
 * APIs demonstrated (Psapi):
 *   - EnumProcesses              (list all PIDs on the system)
 *   - GetProcessImageFileNameW   (NT device path of executable)
 *   - EnumProcessModules         (list loaded module handles)
 *   - GetModuleFileNameExW       (full path of a loaded module)
 *   - GetProcessMemoryInfo       (working set, page file, peak values)
 *
 * APIs demonstrated (Kernel32, cross-package):
 *   - OpenProcess                (open a process for inspection)
 *   - CloseHandle                (release the process handle)
 *
 * Run: bun run example/process-forensics.ts
 */
import { ptr } from 'bun:ffi';
import Psapi from '../index';
import Kernel32, { ProcessAccessRights } from '@bun-win32/kernel32';

Psapi.Preload([
  'EnumProcesses',
  'GetProcessImageFileNameW',
  'EnumProcessModules',
  'GetModuleFileNameExW',
  'GetProcessMemoryInfo',
]);
Kernel32.Preload(['OpenProcess', 'CloseHandle']);

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  let size = bytes;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(2)} ${units[i]}`;
}

function readWideString(buf: Buffer, maxChars: number): string {
  let result = '';
  for (let i = 0; i < maxChars; i++) {
    const code = buf.readUInt16LE(i * 2);
    if (code === 0) break;
    result += String.fromCharCode(code);
  }
  return result;
}

// Enumerate all PIDs
const pidBuf = Buffer.alloc(65536);
const sizeNeeded = Buffer.alloc(4);

if (!Psapi.EnumProcesses(pidBuf.ptr, pidBuf.byteLength, sizeNeeded.ptr)) {
  console.error('EnumProcesses failed');
  process.exit(1);
}

const pidCount = sizeNeeded.readUInt32LE(0) / 4;
const pidView = new DataView(pidBuf.buffer);

const PROCESS_QUERY_INFORMATION = ProcessAccessRights.PROCESS_QUERY_INFORMATION;
const PROCESS_VM_READ = ProcessAccessRights.PROCESS_VM_READ;

// PROCESS_MEMORY_COUNTERS layout on x64 (72 bytes):
const PMC_SIZE = 72;

const W = 76;
console.log(`\n${'='.repeat(W)}`);
console.log('                    PROCESS FORENSICS REPORT');
console.log('                    powered by @bun-win32/psapi');
console.log(`${'='.repeat(W)}`);
console.log(`  Total PIDs found: ${pidCount}\n`);

let accessibleCount = 0;
let deniedCount = 0;

for (let i = 0; i < pidCount; i++) {
  const pid = pidView.getUint32(i * 4, true);
  if (pid === 0) continue; // Skip System Idle Process

  const hProcess = Kernel32.OpenProcess(PROCESS_QUERY_INFORMATION | PROCESS_VM_READ, 0, pid);
  if (!hProcess || hProcess === 0n) {
    deniedCount++;
    continue;
  }

  accessibleCount++;

  try {
    // Get executable path
    const pathBuf = Buffer.alloc(520);
    const pathLen = Psapi.GetProcessImageFileNameW(hProcess, pathBuf.ptr, 260);
    let exePath = '(unknown)';
    let exeName = '(unknown)';
    if (pathLen > 0) {
      exePath = readWideString(pathBuf, pathLen);
      const parts = exePath.split('\\');
      exeName = parts[parts.length - 1] ?? exePath;
    }

    console.log(`  ${'─'.repeat(W - 4)}`);
    console.log(`  [PID ${pid}] ${exeName}`);
    console.log(`    Path: ${exePath}`);

    // Enumerate loaded modules (first 5)
    const moduleHandleBuf = Buffer.alloc(8 * 256); // up to 256 module handles (HMODULE = 8 bytes on x64)
    const cbNeeded = Buffer.alloc(4);

    const modsOk = Psapi.EnumProcessModules(
      hProcess,
      moduleHandleBuf.ptr,
      moduleHandleBuf.byteLength,
      cbNeeded.ptr,
    );

    if (modsOk) {
      const moduleCount = cbNeeded.readUInt32LE(0) / 8;
      const displayCount = Math.min(moduleCount, 5);
      console.log(`    Loaded Modules: ${moduleCount} total (showing first ${displayCount})`);

      const modView = new DataView(moduleHandleBuf.buffer);

      for (let m = 0; m < displayCount; m++) {
        const hModule = modView.getBigUint64(m * 8, true);
        const modNameBuf = Buffer.alloc(520);
        const modNameLen = Psapi.GetModuleFileNameExW(hProcess, hModule, modNameBuf.ptr, 260);

        if (modNameLen > 0) {
          const modPath = readWideString(modNameBuf, modNameLen);
          const modParts = modPath.split('\\');
          const modName = modParts[modParts.length - 1] ?? modPath;
          console.log(`      [${m}] ${modName}`);
          console.log(`          ${modPath}`);
        } else {
          console.log(`      [${m}] (could not read name)`);
        }
      }

      if (moduleCount > 5) {
        console.log(`      ... and ${moduleCount - 5} more modules`);
      }
    } else {
      console.log(`    Loaded Modules: (access denied or unavailable)`);
    }

    // Get memory info
    const memBuf = Buffer.alloc(PMC_SIZE);
    new DataView(memBuf.buffer).setUint32(0, PMC_SIZE, true);
    const memOk = Psapi.GetProcessMemoryInfo(hProcess, memBuf.ptr, PMC_SIZE);

    if (memOk) {
      const mv = new DataView(memBuf.buffer);
      const pageFaults = mv.getUint32(0x04, true);
      const peakWorkingSet = Number(mv.getBigUint64(0x08, true));
      const workingSet = Number(mv.getBigUint64(0x10, true));
      const quotaPeakPaged = Number(mv.getBigUint64(0x18, true));
      const quotaPaged = Number(mv.getBigUint64(0x20, true));
      const quotaPeakNonPaged = Number(mv.getBigUint64(0x28, true));
      const quotaNonPaged = Number(mv.getBigUint64(0x30, true));
      const pagefileUsage = Number(mv.getBigUint64(0x38, true));
      const peakPagefileUsage = Number(mv.getBigUint64(0x40, true));

      console.log(`    Memory Info:`);
      console.log(`      Working Set:          ${formatBytes(workingSet).padStart(14)}`);
      console.log(`      Peak Working Set:     ${formatBytes(peakWorkingSet).padStart(14)}`);
      console.log(`      Pagefile Usage:       ${formatBytes(pagefileUsage).padStart(14)}`);
      console.log(`      Peak Pagefile Usage:  ${formatBytes(peakPagefileUsage).padStart(14)}`);
      console.log(`      Paged Pool Quota:     ${formatBytes(quotaPaged).padStart(14)}`);
      console.log(`      Peak Paged Pool:      ${formatBytes(quotaPeakPaged).padStart(14)}`);
      console.log(`      NonPaged Pool Quota:  ${formatBytes(quotaNonPaged).padStart(14)}`);
      console.log(`      Peak NonPaged Pool:   ${formatBytes(quotaPeakNonPaged).padStart(14)}`);
      console.log(`      Page Faults:          ${pageFaults.toLocaleString().padStart(14)}`);
    } else {
      console.log(`    Memory Info: (unavailable)`);
    }
  } finally {
    Kernel32.CloseHandle(hProcess);
  }
}

console.log(`\n${'='.repeat(W)}`);
console.log(`  Summary`);
console.log(`    Accessible processes:  ${accessibleCount}`);
console.log(`    Access denied:         ${deniedCount}`);
console.log(`    Total PIDs:            ${pidCount}`);
console.log(`${'='.repeat(W)}\n`);
