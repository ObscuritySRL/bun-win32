/**
 * AppContainer Isolation X-Ray
 *
 * A live, animated X-ray of every AppContainer the Windows Firewall knows
 * about — entirely over FFI. NetworkIsolationEnumAppContainers hands back a
 * DLL-allocated array of INET_FIREWALL_APP_CONTAINER structs; this example
 * walks that native memory by hand with Kernel32.ReadProcessMemory, decodes
 * each struct field-by-field (display name, package identity, binary count,
 * capability count, working directory), and renders each container as a
 * pulsing "isolation chamber" with a capability bar that fills in as the
 * reveal scans down the list. The DLL-owned array is then handed straight
 * back to NetworkIsolationFreeAppContainers.
 *
 * APIs demonstrated (FirewallApi):
 *   - NetworkIsolationEnumAppContainers   (enumerate every AppContainer)
 *   - NetworkIsolationFreeAppContainers   (release the DLL-allocated array)
 *
 * APIs demonstrated (cross-package):
 *   - Kernel32.GetCurrentProcess/ReadProcessMemory (walk the native struct array)
 *   - Kernel32.GetStdHandle/Get|SetConsoleMode     (enable ANSI VT processing)
 *
 * Run: bun run example/firewall-x-ray.ts
 */

import FirewallApi, { NETISO_FLAG } from '../index';
import Kernel32 from '@bun-win32/kernel32';

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const CYAN = '\x1b[96m';
const GREEN = '\x1b[92m';
const YELLOW = '\x1b[93m';
const RED = '\x1b[91m';
const MAGENTA = '\x1b[95m';
const BLUE = '\x1b[94m';

const ERROR_SUCCESS = 0;

// INET_FIREWALL_APP_CONTAINER field offsets (x64, 88-byte struct).
const STRUCT_SIZE = 88;
const OFF_APPCONTAINER_NAME = 16; // LPWSTR
const OFF_DISPLAY_NAME = 24; // LPWSTR
const OFF_DESCRIPTION = 32; // LPWSTR
const OFF_CAP_COUNT = 40; // DWORD  (INET_FIREWALL_AC_CAPABILITIES.count)
const OFF_BIN_COUNT = 56; // DWORD  (INET_FIREWALL_AC_BINARIES.count)
const OFF_WORKING_DIR = 72; // LPWSTR
const OFF_PACKAGE_FULL_NAME = 80; // LPWSTR

const sleep = (ms: number) => Bun.sleep(ms);

function enableVirtualTerminal(): void {
  const STD_OUTPUT_HANDLE = 0xffff_fff5;
  const ENABLE_VIRTUAL_TERMINAL_PROCESSING = 0x0004;
  const handle = Kernel32.GetStdHandle(STD_OUTPUT_HANDLE);
  const mode = Buffer.alloc(4);
  if (Kernel32.GetConsoleMode(handle, mode.ptr!)) {
    Kernel32.SetConsoleMode(handle, mode.readUInt32LE(0) | ENABLE_VIRTUAL_TERMINAL_PROCESSING);
  }
}

/** Reads `size` bytes from this process's address space at `address`. */
function readMemory(address: bigint, size: number): Buffer {
  const out = Buffer.alloc(size);
  Kernel32.ReadProcessMemory(Kernel32.GetCurrentProcess(), address, out.ptr!, BigInt(size), 0n);
  return out;
}

/** Follows a LPWSTR pointer stored at `structAddr + offset` and decodes it. */
function readWideStringField(structBuf: Buffer, offset: number): string {
  const addr = structBuf.readBigUInt64LE(offset);
  if (addr === 0n) return '';
  // Pull a generous window, then trim at the first NUL.
  const raw = readMemory(addr, 1024);
  let end = 0;
  while (end + 1 < raw.length && raw.readUInt16LE(end) !== 0) end += 2;
  return raw.toString('utf16le', 0, end);
}

function capabilityBar(count: number, max: number): string {
  const width = 24;
  const filled = max === 0 ? 0 : Math.min(width, Math.round((count / max) * width));
  const color = count === 0 ? DIM : count > 6 ? RED : count > 2 ? YELLOW : GREEN;
  return `${color}${'█'.repeat(filled)}${DIM}${'░'.repeat(width - filled)}${RESET}`;
}

async function main(): Promise<void> {
  enableVirtualTerminal();

  console.log(`\n${BOLD}${MAGENTA}  ┌──────────────────────────────────────────────────┐${RESET}`);
  console.log(`${BOLD}${MAGENTA}  │      A P P C O N T A I N E R   I S O L A T I O N │${RESET}`);
  console.log(`${BOLD}${MAGENTA}  │                  X - R A Y                       │${RESET}`);
  console.log(`${BOLD}${MAGENTA}  └──────────────────────────────────────────────────┘${RESET}`);
  console.log(`  ${DIM}Native INET_FIREWALL_APP_CONTAINER array, walked over pure FFI${RESET}\n`);

  // 1 ─ Ask the firewall for every AppContainer (force binary computation).
  const count = Buffer.alloc(4);
  const ppList = Buffer.alloc(8); // receives PINET_FIREWALL_APP_CONTAINER
  const status = FirewallApi.NetworkIsolationEnumAppContainers(NETISO_FLAG.NETISO_FLAG_FORCE_COMPUTE_BINARIES, count.ptr!, ppList.ptr!);

  if (status !== ERROR_SUCCESS) {
    console.error(`${RED}NetworkIsolationEnumAppContainers failed (error ${status >>> 0})${RESET}`);
    return;
  }

  const total = count.readUInt32LE(0);
  const baseAddress = ppList.readBigUInt64LE(0);
  console.log(`  ${BOLD}${BLUE}══${RESET} ${BOLD}${total}${RESET} AppContainer(s) registered  ${DIM}(array @ 0x${baseAddress.toString(16)})${RESET}\n`);

  if (total === 0 || baseAddress === 0n) {
    console.log(`  ${YELLOW}No AppContainers installed — nothing to X-ray.${RESET}\n`);
    return;
  }

  // 2 ─ First pass: decode every struct so we can scale the capability bars.
  interface Container {
    displayName: string;
    name: string;
    description: string;
    packageFullName: string;
    workingDir: string;
    capCount: number;
    binCount: number;
  }
  const containers: Container[] = [];
  let maxCaps = 1;
  for (let i = 0; i < total; i++) {
    const structAddr = baseAddress + BigInt(i * STRUCT_SIZE);
    const s = readMemory(structAddr, STRUCT_SIZE);
    const capCount = s.readUInt32LE(OFF_CAP_COUNT);
    const binCount = s.readUInt32LE(OFF_BIN_COUNT);
    if (capCount > maxCaps) maxCaps = capCount;
    containers.push({
      displayName: readWideStringField(s, OFF_DISPLAY_NAME),
      name: readWideStringField(s, OFF_APPCONTAINER_NAME),
      description: readWideStringField(s, OFF_DESCRIPTION),
      packageFullName: readWideStringField(s, OFF_PACKAGE_FULL_NAME),
      workingDir: readWideStringField(s, OFF_WORKING_DIR),
      capCount,
      binCount,
    });
  }

  // 3 ─ Animated reveal: one isolation chamber per container.
  const shown = Math.min(containers.length, 24);
  let totalCaps = 0;
  let totalBins = 0;
  for (let i = 0; i < shown; i++) {
    const c = containers[i]!;
    totalCaps += c.capCount;
    totalBins += c.binCount;

    const title = c.displayName || c.name || '(unnamed)';
    const idx = `${DIM}#${String(i + 1).padStart(3, '0')}${RESET}`;
    console.log(`  ${idx}  ${BOLD}${CYAN}${title.slice(0, 52)}${RESET}`);
    if (c.packageFullName) console.log(`        ${DIM}pkg${RESET}  ${MAGENTA}${c.packageFullName.slice(0, 60)}${RESET}`);
    if (c.workingDir) console.log(`        ${DIM}dir${RESET}  ${DIM}${c.workingDir.slice(0, 60)}${RESET}`);
    console.log(`        ${DIM}caps${RESET} ${capabilityBar(c.capCount, maxCaps)} ${BOLD}${c.capCount}${RESET} capability(ies), ${BOLD}${c.binCount}${RESET} binary(ies)`);
    console.log();
    await sleep(45);
  }

  if (containers.length > shown) {
    console.log(`  ${DIM}… +${containers.length - shown} more AppContainer(s) not shown${RESET}\n`);
  }

  // 4 ─ Hand the DLL-owned array back to the firewall, then summarize.
  const freed = FirewallApi.NetworkIsolationFreeAppContainers(baseAddress);
  const grandCaps = containers.reduce((a, c) => a + c.capCount, 0);
  const grandBins = containers.reduce((a, c) => a + c.binCount, 0);

  console.log(`  ${BOLD}${BLUE}══ Summary${RESET}`);
  console.log(`  ${DIM}${'─'.repeat(52)}${RESET}`);
  console.log(`  ${'AppContainers'.padEnd(22)} ${BOLD}${containers.length}${RESET}`);
  console.log(`  ${'Total capabilities'.padEnd(22)} ${BOLD}${grandCaps}${RESET}`);
  console.log(`  ${'Total binaries'.padEnd(22)} ${BOLD}${grandBins}${RESET}`);
  console.log(`  ${'Shown / scanned caps'.padEnd(22)} ${DIM}${totalCaps} caps, ${totalBins} bins in first ${shown}${RESET}`);
  console.log(`  ${'NetworkIsolationFree'.padEnd(22)} ${freed === ERROR_SUCCESS ? GREEN + 'released ✓' : RED + 'error ' + (freed >>> 0)}${RESET}`);
  console.log(`\n  ${GREEN}${BOLD}✓ X-ray complete — every chamber decoded from raw native memory.${RESET}\n`);
}

main();
