/**
 * Process X-Ray — a live, cross-process inspector that opens ANOTHER running
 * process and reconstructs its inner anatomy entirely from native kernel calls:
 *
 *   1. MODULES        every loaded DLL with its base address, image size and
 *                     entry point  (Psapi.EnumProcessModules + GetModuleBaseNameW
 *                     + GetModuleInformation -> MODULEINFO).
 *   2. THREADS        each thread id and its base priority, recovered from a
 *                     system-wide thread snapshot
 *                     (Kernel32.CreateToolhelp32Snapshot(TH32CS_SNAPTHREAD) +
 *                     Thread32First/Next, filtered by owner PID).
 *   3. ADDRESS SPACE  the complete virtual-address-space map, walked region by
 *                     region with Kernel32.VirtualQueryEx -> MEMORY_BASIC_INFORMATION,
 *                     bucketed into committed / reserved / free and decoded into
 *                     PAGE_* protection names, then drawn as a colored heatmap.
 *   4. COUNTERS       working set, pagefile and pool quotas
 *                     (Psapi.GetProcessMemoryInfo -> PROCESS_MEMORY_COUNTERS).
 *   5. HEX DUMP       a real cross-process Kernel32.ReadProcessMemory of the first
 *                     committed, readable, non-guard region — rendered offset|hex|ASCII.
 *
 * You cannot do THIS in plain TypeScript: it reaches across the process boundary
 * with the Win32 debugging/inspection ABI and shows you the actual bytes living in
 * another program's memory. RECON-VERIFIED LIVE on every step.
 *
 * Target selection (argv):
 *   bun run example/process-xray.ts            -> inspects this very bun process (always works)
 *   bun run example/process-xray.ts 1234       -> inspects PID 1234
 *   bun run example/process-xray.ts notepad    -> inspects the first matching image name
 *
 * Graceful degradation: if OpenProcess is denied (protected / other-user / needs
 * elevation) it prints a friendly explanation and falls back to its own PID so the
 * demo always produces a real result without crashing.
 *
 * APIs (Kernel32): GetCurrentProcessId, OpenProcess, VirtualQueryEx,
 *   ReadProcessMemory, CreateToolhelp32Snapshot, Thread32First/Next, CloseHandle,
 *   GetStdHandle, GetConsoleMode, SetConsoleMode.
 * APIs (Psapi): EnumProcesses, GetProcessImageFileNameW, EnumProcessModules,
 *   GetModuleBaseNameW, GetModuleInformation, GetProcessMemoryInfo.
 *
 * Run: bun run example/process-xray.ts [pid|name]
 */

import Kernel32, { ProcessAccessRights, STD_HANDLE } from '@bun-win32/kernel32';
import Psapi from '@bun-win32/psapi';

// ---------------------------------------------------------------------------
// ANSI / truecolor console UI helpers
// ---------------------------------------------------------------------------
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const RED = '\x1b[91m';
const GREEN = '\x1b[92m';
const YELLOW = '\x1b[93m';
const BLUE = '\x1b[94m';
const MAGENTA = '\x1b[95m';
const CYAN = '\x1b[96m';
const WHITE = '\x1b[97m';
const GREY = '\x1b[90m';

function rgb(r: number, g: number, b: number): string {
  return `\x1b[38;2;${r};${g};${b}m`;
}

const ENABLE_VIRTUAL_TERMINAL_PROCESSING = 0x0004;

function enableVirtualTerminal(): void {
  const hStdout = Kernel32.GetStdHandle(STD_HANDLE.OUTPUT);
  if (!hStdout || hStdout === 0n) return;
  const modeBuf = Buffer.alloc(4);
  if (Kernel32.GetConsoleMode(hStdout, modeBuf.ptr)) {
    const mode = modeBuf.readUInt32LE(0);
    Kernel32.SetConsoleMode(hStdout, mode | ENABLE_VIRTUAL_TERMINAL_PROCESSING);
  }
}

const BOX_W = 78;
function rule(ch = '─', color = GREY): string {
  return `${color}${ch.repeat(BOX_W)}${RESET}`;
}
function header(title: string, color: string): void {
  console.log();
  console.log(`${color}${BOLD}┏${'━'.repeat(BOX_W - 2)}┓${RESET}`);
  const pad = BOX_W - 4 - title.length;
  console.log(`${color}${BOLD}┃ ${WHITE}${title}${color}${' '.repeat(Math.max(0, pad))} ┃${RESET}`);
  console.log(`${color}${BOLD}┗${'━'.repeat(BOX_W - 2)}┛${RESET}`);
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  let size = bytes;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(size < 10 && i > 0 ? 2 : 1)} ${units[i]}`;
}

function hex64(v: bigint): string {
  return '0x' + v.toString(16).padStart(12, '0');
}

function readWide(buf: Buffer, maxChars: number): string {
  return buf
    .subarray(0, maxChars * 2)
    .toString('utf16le')
    .replace(/\0.*$/, '');
}

// ---------------------------------------------------------------------------
// Win32 constants
// ---------------------------------------------------------------------------
const TH32CS_SNAPTHREAD = 0x00000004;

const MEM_COMMIT = 0x1000;
const MEM_RESERVE = 0x2000;
const MEM_FREE = 0x10000;

const MEM_IMAGE = 0x1000000;
const MEM_MAPPED = 0x40000;
const MEM_PRIVATE = 0x20000;

const PAGE_NOACCESS = 0x01;
const PAGE_READONLY = 0x02;
const PAGE_READWRITE = 0x04;
const PAGE_WRITECOPY = 0x08;
const PAGE_EXECUTE = 0x10;
const PAGE_EXECUTE_READ = 0x20;
const PAGE_EXECUTE_READWRITE = 0x40;
const PAGE_EXECUTE_WRITECOPY = 0x80;
const PAGE_GUARD = 0x100;
// Mask of "currently readable via ReadProcessMemory" protections.
const PAGE_READABLE_MASK =
  PAGE_READONLY |
  PAGE_READWRITE |
  PAGE_WRITECOPY |
  PAGE_EXECUTE_READ |
  PAGE_EXECUTE_READWRITE |
  PAGE_EXECUTE_WRITECOPY;

function protectName(p: number): string {
  const base = p & 0xff;
  let name: string;
  switch (base) {
    case PAGE_NOACCESS:
      name = 'NOACCESS';
      break;
    case PAGE_READONLY:
      name = 'READONLY';
      break;
    case PAGE_READWRITE:
      name = 'READWRITE';
      break;
    case PAGE_WRITECOPY:
      name = 'WRITECOPY';
      break;
    case PAGE_EXECUTE:
      name = 'EXECUTE';
      break;
    case PAGE_EXECUTE_READ:
      name = 'EXECUTE_READ';
      break;
    case PAGE_EXECUTE_READWRITE:
      name = 'EXECUTE_RW';
      break;
    case PAGE_EXECUTE_WRITECOPY:
      name = 'EXECUTE_WC';
      break;
    case 0:
      name = '-';
      break;
    default:
      name = `0x${base.toString(16)}`;
      break;
  }
  if (p & PAGE_GUARD) name += '+GUARD';
  return name;
}

function typeName(t: number): string {
  switch (t) {
    case MEM_IMAGE:
      return 'IMAGE';
    case MEM_MAPPED:
      return 'MAPPED';
    case MEM_PRIVATE:
      return 'PRIVATE';
    default:
      return '-';
  }
}

// Color a memory region by state/protection for the heatmap.
function regionColor(state: number, protect: number): string {
  if (state === MEM_FREE) return GREY;
  if (state === MEM_RESERVE) return BLUE;
  // committed:
  const base = protect & 0xff;
  if (base & (PAGE_EXECUTE | PAGE_EXECUTE_READ | PAGE_EXECUTE_READWRITE | PAGE_EXECUTE_WRITECOPY))
    return RED; // executable code
  if (base & (PAGE_READWRITE | PAGE_WRITECOPY)) return GREEN; // writable data
  if (base === PAGE_READONLY) return CYAN; // read-only data
  if (base === PAGE_NOACCESS || protect & PAGE_GUARD) return MAGENTA; // guard / no-access
  return YELLOW;
}

// ---------------------------------------------------------------------------
// Target resolution
// ---------------------------------------------------------------------------
const PROCESS_QUERY_LIMITED_INFORMATION =
  ProcessAccessRights.PROCESS_QUERY_LIMITED_INFORMATION;
const PROCESS_VM_READ = ProcessAccessRights.PROCESS_VM_READ;
const DESIRED_ACCESS = PROCESS_QUERY_LIMITED_INFORMATION | PROCESS_VM_READ;

interface Target {
  pid: number;
  handle: bigint;
  selfFallback: boolean;
}

/** Enumerate PIDs and return the first whose image base name matches (case-insensitive substring). */
function findPidByName(needle: string): number | null {
  const pidBuf = Buffer.alloc(65536);
  const sizeNeeded = Buffer.alloc(4);
  if (!Psapi.EnumProcesses(pidBuf.ptr, pidBuf.byteLength, sizeNeeded.ptr)) return null;
  const count = sizeNeeded.readUInt32LE(0) / 4;
  const view = new DataView(pidBuf.buffer);
  const want = needle.toLowerCase();
  for (let i = 0; i < count; i++) {
    const pid = view.getUint32(i * 4, true);
    if (pid === 0) continue;
    const h = Kernel32.OpenProcess(DESIRED_ACCESS, 0, pid);
    if (!h || h === 0n) continue;
    try {
      const nameBuf = Buffer.alloc(520);
      const len = Psapi.GetProcessImageFileNameW(h, nameBuf.ptr, 260);
      if (len > 0) {
        const path = readWide(nameBuf, len);
        const base = (path.split('\\').pop() ?? path).toLowerCase();
        if (base.includes(want)) return pid;
      }
    } finally {
      Kernel32.CloseHandle(h);
    }
  }
  return null;
}

function resolveTarget(): Target {
  const ownPid = Kernel32.GetCurrentProcessId();
  const arg = process.argv[2];

  let requestedPid: number | null = null;
  if (arg) {
    if (/^\d+$/.test(arg)) {
      requestedPid = Number(arg);
    } else {
      const found = findPidByName(arg);
      if (found === null) {
        console.log(
          `${YELLOW}No running process matched name "${arg}". ` +
            `Falling back to this bun process (PID ${ownPid}).${RESET}`,
        );
      } else {
        requestedPid = found;
      }
    }
  }

  const targetPid = requestedPid ?? ownPid;
  let handle = Kernel32.OpenProcess(DESIRED_ACCESS, 0, targetPid);

  if (!handle || handle === 0n) {
    console.log(
      `${YELLOW}OpenProcess(PID ${targetPid}) was denied — this is expected for ` +
        `protected, other-user, or elevated processes.${RESET}`,
    );
    console.log(
      `${DIM}Try a same-user process, run this terminal elevated, or omit the argument. ` +
        `Falling back to this bun process (PID ${ownPid}).${RESET}`,
    );
    handle = Kernel32.OpenProcess(DESIRED_ACCESS, 0, ownPid);
    if (!handle || handle === 0n) {
      // Should never happen for our own PID, but degrade cleanly.
      console.log(`${RED}Could not open even our own process. Exiting.${RESET}`);
      process.exit(0);
    }
    return { pid: ownPid, handle, selfFallback: true };
  }

  return { pid: targetPid, handle, selfFallback: requestedPid === null };
}

// ---------------------------------------------------------------------------
// MODULES — Psapi.EnumProcessModules + GetModuleBaseNameW + GetModuleInformation
// MODULEINFO (24 bytes on x64): base u64@0, SizeOfImage u32@8, EntryPoint u64@16
// ---------------------------------------------------------------------------
interface ModuleRecord {
  name: string;
  base: bigint;
  size: number;
  entry: bigint;
}

function inspectModules(h: bigint): ModuleRecord[] {
  const records: ModuleRecord[] = [];
  const handleBuf = Buffer.alloc(8 * 1024); // up to 1024 HMODULEs
  const cbNeeded = Buffer.alloc(4);
  if (!Psapi.EnumProcessModules(h, handleBuf.ptr, handleBuf.byteLength, cbNeeded.ptr)) {
    return records;
  }
  const moduleCount = Math.min(cbNeeded.readUInt32LE(0) / 8, 1024);
  const view = new DataView(handleBuf.buffer);

  for (let i = 0; i < moduleCount; i++) {
    const hModule = view.getBigUint64(i * 8, true);

    const nameBuf = Buffer.alloc(520);
    const nameLen = Psapi.GetModuleBaseNameW(h, hModule, nameBuf.ptr, 260);
    const name = nameLen > 0 ? readWide(nameBuf, nameLen) : '(unknown)';

    // Assemble the MODULEINFO out-buffer immediately before the call.
    const miBuf = Buffer.alloc(24);
    let base = hModule;
    let size = 0;
    let entry = 0n;
    if (Psapi.GetModuleInformation(h, hModule, miBuf.ptr, 24)) {
      const mv = new DataView(miBuf.buffer);
      base = mv.getBigUint64(0, true);
      size = mv.getUint32(8, true);
      entry = mv.getBigUint64(16, true);
    }
    records.push({ name, base, size, entry });
  }
  return records;
}

// ---------------------------------------------------------------------------
// THREADS — Toolhelp thread snapshot
// THREADENTRY32 (28 bytes): dwSize@0, cntUsage@4, th32ThreadID@8,
//   th32OwnerProcessID@0x0C, tpBasePri i32@0x10, tpDeltaPri@0x14, dwFlags@0x18
// ---------------------------------------------------------------------------
interface ThreadRecord {
  tid: number;
  basePriority: number;
}

const INVALID_HANDLE_VALUE = 0xffffffffffffffffn;

function inspectThreads(pid: number): ThreadRecord[] {
  const records: ThreadRecord[] = [];
  const snap = Kernel32.CreateToolhelp32Snapshot(TH32CS_SNAPTHREAD, 0);
  if (!snap || snap === 0n || snap === INVALID_HANDLE_VALUE) return records;

  try {
    const TE_SIZE = 28;
    const te = Buffer.alloc(TE_SIZE);
    new DataView(te.buffer).setUint32(0, TE_SIZE, true); // dwSize

    let ok = Kernel32.Thread32First(snap, te.ptr);
    while (ok) {
      const tv = new DataView(te.buffer);
      const owner = tv.getUint32(0x0c, true);
      if (owner === pid) {
        records.push({
          tid: tv.getUint32(0x08, true),
          basePriority: tv.getInt32(0x10, true),
        });
      }
      // dwSize must be reset before each Next call.
      tv.setUint32(0, TE_SIZE, true);
      ok = Kernel32.Thread32Next(snap, te.ptr);
    }
  } finally {
    Kernel32.CloseHandle(snap);
  }
  return records;
}

// ---------------------------------------------------------------------------
// ADDRESS SPACE — VirtualQueryEx walk
// MEMORY_BASIC_INFORMATION x64 (48 bytes):
//   BaseAddress u64@0, AllocationBase u64@8, AllocationProtect u32@0x10,
//   (pad u32@0x14), RegionSize u64@0x18, State u32@0x20, Protect u32@0x24, Type u32@0x28
// ---------------------------------------------------------------------------
interface Region {
  base: bigint;
  size: bigint;
  state: number;
  protect: number;
  type: number;
}

function walkAddressSpace(h: bigint): Region[] {
  const regions: Region[] = [];
  const MBI_SIZE = 48n;
  let addr = 0n;
  let guard = 0;

  while (guard++ < 200000) {
    const mbi = Buffer.alloc(48);
    const ret = Kernel32.VirtualQueryEx(h, addr, mbi.ptr, MBI_SIZE);
    if (ret === 0n) break; // walked off the end of the address space (or error)

    const mv = new DataView(mbi.buffer);
    const base = mv.getBigUint64(0, true);
    const size = mv.getBigUint64(0x18, true);
    const state = mv.getUint32(0x20, true);
    const protect = mv.getUint32(0x24, true);
    const type = mv.getUint32(0x28, true);

    regions.push({ base, size, state, protect, type });

    const next = base + size;
    if (size === 0n || next <= addr) break; // safety against non-advancing walk
    addr = next;
  }
  return regions;
}

// ---------------------------------------------------------------------------
// HEX DUMP — cross-process ReadProcessMemory of the first readable committed region
// ---------------------------------------------------------------------------
function hexDump(h: bigint, regions: Region[], wantBytes: number): void {
  const target = regions.find(
    (r) =>
      r.state === MEM_COMMIT &&
      r.protect & PAGE_READABLE_MASK &&
      !(r.protect & PAGE_GUARD) &&
      r.size > 0n,
  );

  if (!target) {
    console.log(`  ${YELLOW}No readable committed region found to dump.${RESET}`);
    return;
  }

  // n is bounded to the region size, so a successful ReadProcessMemory copies all
  // n bytes (partial reads only happen across an unreadable region boundary).
  const n = Math.min(wantBytes, Number(target.size > 4096n ? 4096n : target.size));
  const buf = Buffer.alloc(n);
  // Assemble + call immediately; base + buffer ptr live here with no awaits.
  // lpNumberOfBytesRead is optional; pass NULL (0n) per the repo's FFI convention
  // (Bun marshals 0n as a null pointer; a non-zero bigint is rejected by the ptr arg).
  const ok = Kernel32.ReadProcessMemory(h, target.base, buf.ptr, BigInt(n), 0n);
  const got = ok ? n : 0;

  console.log(
    `  ${DIM}region ${hex64(target.base)}  ${protectName(target.protect)}  ` +
      `${typeName(target.type)}  size ${formatBytes(Number(target.size))}${RESET}`,
  );
  console.log(
    `  ${WHITE}ReadProcessMemory returned ${ok ? 'TRUE' : 'FALSE'}, ` +
      `${got} bytes copied across the process boundary.${RESET}`,
  );

  if (!ok || got === 0) {
    console.log(`  ${YELLOW}(no bytes copied — region became unreadable)${RESET}`);
    return;
  }

  const rows = Math.min(16, Math.ceil(got / 16));
  console.log();
  console.log(`  ${GREY}offset        00 01 02 03 04 05 06 07  08 09 0a 0b 0c 0d 0e 0f   ascii${RESET}`);
  for (let row = 0; row < rows; row++) {
    const off = row * 16;
    let hexPart = '';
    let asc = '';
    for (let c = 0; c < 16; c++) {
      const idx = off + c;
      if (idx < got) {
        const b = buf[idx] ?? 0;
        hexPart += b.toString(16).padStart(2, '0') + ' ';
        asc += b >= 0x20 && b < 0x7f ? String.fromCharCode(b) : '.';
      } else {
        hexPart += '   ';
        asc += ' ';
      }
      if (c === 7) hexPart += ' ';
    }
    const absOff = target.base + BigInt(off);
    console.log(
      `  ${CYAN}${hex64(absOff)}${RESET}  ${WHITE}${hexPart}${RESET}  ${GREEN}${asc}${RESET}`,
    );
  }
}

// ---------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------
function main(): void {
  Kernel32.Preload([
    'GetCurrentProcessId',
    'OpenProcess',
    'CloseHandle',
    'VirtualQueryEx',
    'ReadProcessMemory',
    'CreateToolhelp32Snapshot',
    'Thread32First',
    'Thread32Next',
    'GetStdHandle',
    'GetConsoleMode',
    'SetConsoleMode',
  ]);
  Psapi.Preload([
    'EnumProcesses',
    'GetProcessImageFileNameW',
    'EnumProcessModules',
    'GetModuleBaseNameW',
    'GetModuleInformation',
    'GetProcessMemoryInfo',
  ]);

  enableVirtualTerminal();

  const target = resolveTarget();
  const { pid, handle } = target;

  try {
    // Resolve a friendly image name for the banner.
    const nameBuf = Buffer.alloc(520);
    const nameLen = Psapi.GetProcessImageFileNameW(handle, nameBuf.ptr, 260);
    const exeName =
      nameLen > 0 ? (readWide(nameBuf, nameLen).split('\\').pop() ?? '(unknown)') : '(unknown)';

    console.log();
    console.log(
      `${MAGENTA}${BOLD}  ╔═══════════════════════════════════════════════════════════════════════╗${RESET}`,
    );
    console.log(
      `${MAGENTA}${BOLD}  ║   PROCESS X-RAY  —  cross-process inspection via raw Win32 FFI         ║${RESET}`,
    );
    console.log(
      `${MAGENTA}${BOLD}  ╚═══════════════════════════════════════════════════════════════════════╝${RESET}`,
    );
    console.log(
      `  ${WHITE}Target: ${BOLD}${exeName}${RESET}  ${DIM}PID ${pid}` +
        `  handle ${hex64(handle)}${target.selfFallback ? '  (own bun process)' : ''}${RESET}`,
    );

    // --- MODULES ---
    header('MODULES — loaded DLLs (base / size / entry point)', BLUE);
    const modules = inspectModules(handle);
    if (modules.length === 0) {
      console.log(`  ${YELLOW}(no modules enumerable — access limited)${RESET}`);
    } else {
      console.log(
        `  ${BOLD}${'MODULE'.padEnd(26)}${'BASE'.padEnd(16)}${'SIZE'.padStart(11)}   ENTRY POINT${RESET}`,
      );
      console.log(`  ${rule()}`);
      const show = modules.slice(0, 18);
      for (const m of show) {
        const nm = m.name.length > 25 ? m.name.slice(0, 22) + '...' : m.name;
        console.log(
          `  ${WHITE}${nm.padEnd(26)}${RESET}${CYAN}${hex64(m.base).slice(2).padEnd(16)}${RESET}` +
            `${YELLOW}${formatBytes(m.size).padStart(11)}${RESET}   ${GREY}${hex64(m.entry)}${RESET}`,
        );
      }
      if (modules.length > show.length) {
        console.log(`  ${DIM}... and ${modules.length - show.length} more modules${RESET}`);
      }
      console.log(`  ${DIM}${modules.length} modules total${RESET}`);
    }

    // --- THREADS ---
    header('THREADS — snapshot of this process (id / base priority)', GREEN);
    const threads = inspectThreads(pid);
    if (threads.length === 0) {
      console.log(`  ${YELLOW}(no threads found in snapshot)${RESET}`);
    } else {
      const PRIO: Record<number, string> = {
        0: 'IDLE',
        1: 'LOWEST',
        2: 'BELOW',
        8: 'NORMAL',
        9: 'ABOVE',
        10: 'HIGH',
        15: 'TIME-CRITICAL',
        31: 'REALTIME',
      };
      const cols = 4;
      for (let i = 0; i < threads.length; i += cols) {
        const cells: string[] = [];
        for (let j = i; j < Math.min(i + cols, threads.length); j++) {
          const t = threads[j]!;
          const label = PRIO[t.basePriority] ?? `pri ${t.basePriority}`;
          cells.push(
            `${CYAN}tid ${t.tid.toString().padStart(6)}${RESET} ${DIM}${label.padEnd(13)}${RESET}`,
          );
        }
        console.log('  ' + cells.join('  '));
      }
      console.log(`  ${DIM}${threads.length} threads owned by PID ${pid}${RESET}`);
    }

    // --- ADDRESS SPACE ---
    header('VIRTUAL ADDRESS SPACE — VirtualQueryEx region walk', RED);
    const regions = walkAddressSpace(handle);
    let committed = 0n;
    let reserved = 0n;
    let free = 0n;
    let imageBytes = 0n;
    let privateBytes = 0n;
    let mappedBytes = 0n;
    for (const r of regions) {
      if (r.state === MEM_COMMIT) {
        committed += r.size;
        if (r.type === MEM_IMAGE) imageBytes += r.size;
        else if (r.type === MEM_PRIVATE) privateBytes += r.size;
        else if (r.type === MEM_MAPPED) mappedBytes += r.size;
      } else if (r.state === MEM_RESERVE) {
        reserved += r.size;
      } else if (r.state === MEM_FREE) {
        free += r.size;
      }
    }

    // Heatmap: one block per region, colored by state/protection.
    let line = '  ';
    let onLine = 0;
    for (const r of regions) {
      if (r.state === MEM_FREE && r.size < 0x100000n) continue; // hide tiny free gaps for clarity
      line += `${regionColor(r.state, r.protect)}█${RESET}`;
      if (++onLine >= BOX_W - 2) {
        console.log(line);
        line = '  ';
        onLine = 0;
      }
    }
    if (onLine > 0) console.log(line);
    console.log();
    console.log(
      `  Legend  ${RED}█ exec${RESET}  ${GREEN}█ read/write${RESET}  ${CYAN}█ read-only${RESET}  ` +
        `${MAGENTA}█ guard/no-access${RESET}  ${BLUE}█ reserved${RESET}  ${GREY}█ free${RESET}`,
    );
    console.log(`  ${rule()}`);
    console.log(
      `  ${WHITE}Committed ${BOLD}${formatBytes(Number(committed)).padStart(10)}${RESET}` +
        `   ${BLUE}Reserved ${formatBytes(Number(reserved)).padStart(10)}${RESET}` +
        `   ${GREY}Free ${formatBytes(Number(free)).padStart(10)}${RESET}`,
    );
    console.log(
      `  ${DIM}committed breakdown — image ${formatBytes(Number(imageBytes))}, ` +
        `private ${formatBytes(Number(privateBytes))}, mapped ${formatBytes(Number(mappedBytes))}${RESET}`,
    );
    console.log(`  ${DIM}${regions.length} regions walked${RESET}`);

    // A few representative committed regions with full decode.
    console.log();
    console.log(
      `  ${BOLD}${'BASE'.padEnd(16)}${'SIZE'.padStart(11)}  ${'STATE'.padEnd(10)}${'PROTECT'.padEnd(16)}TYPE${RESET}`,
    );
    const interesting = regions
      .filter((r) => r.state === MEM_COMMIT)
      .sort((a, b) => Number(b.size - a.size))
      .slice(0, 8);
    for (const r of interesting) {
      const stateName = r.state === MEM_COMMIT ? 'COMMIT' : r.state === MEM_RESERVE ? 'RESERVE' : 'FREE';
      console.log(
        `  ${CYAN}${hex64(r.base).slice(2).padEnd(16)}${RESET}` +
          `${YELLOW}${formatBytes(Number(r.size)).padStart(11)}${RESET}  ` +
          `${WHITE}${stateName.padEnd(10)}${RESET}${regionColor(r.state, r.protect)}${protectName(r.protect).padEnd(16)}${RESET}` +
          `${GREY}${typeName(r.type)}${RESET}`,
      );
    }

    // --- COUNTERS ---
    header('MEMORY COUNTERS — GetProcessMemoryInfo', YELLOW);
    const PMC_SIZE = 72;
    const memBuf = Buffer.alloc(PMC_SIZE);
    new DataView(memBuf.buffer).setUint32(0, PMC_SIZE, true); // cb
    if (Psapi.GetProcessMemoryInfo(handle, memBuf.ptr, PMC_SIZE)) {
      const mv = new DataView(memBuf.buffer);
      const pageFaults = mv.getUint32(0x04, true);
      const peakWorkingSet = Number(mv.getBigUint64(0x08, true));
      const workingSet = Number(mv.getBigUint64(0x10, true));
      const quotaPaged = Number(mv.getBigUint64(0x20, true));
      const quotaNonPaged = Number(mv.getBigUint64(0x30, true));
      const pagefileUsage = Number(mv.getBigUint64(0x38, true));
      const peakPagefileUsage = Number(mv.getBigUint64(0x40, true));
      const pair = (label: string, v: string): string =>
        `  ${WHITE}${label.padEnd(22)}${BOLD}${CYAN}${v.padStart(14)}${RESET}`;
      console.log(pair('Working Set', formatBytes(workingSet)));
      console.log(pair('Peak Working Set', formatBytes(peakWorkingSet)));
      console.log(pair('Pagefile Usage', formatBytes(pagefileUsage)));
      console.log(pair('Peak Pagefile Usage', formatBytes(peakPagefileUsage)));
      console.log(pair('Paged Pool Quota', formatBytes(quotaPaged)));
      console.log(pair('NonPaged Pool Quota', formatBytes(quotaNonPaged)));
      console.log(pair('Page Faults', pageFaults.toLocaleString()));
    } else {
      console.log(`  ${YELLOW}(memory counters unavailable)${RESET}`);
    }

    // --- HEX DUMP ---
    header('CROSS-PROCESS HEX DUMP — ReadProcessMemory', MAGENTA);
    hexDump(handle, regions, 256);

    console.log();
    console.log(
      `${GREEN}${BOLD}  ✓ X-ray complete — every value above was read live from the kernel.${RESET}`,
    );
    console.log();
  } finally {
    Kernel32.CloseHandle(handle);
  }
}

main();
