/**
 * Shadow Copy Inspector
 *
 * A thorough, read-only Volume Shadow Copy diagnostic. It enumerates every
 * logical drive on the system, then for each volume asks the VSS engine two
 * questions through the documented flat vssapi.dll entry points:
 *
 *   1. IsVolumeSnapshotted — does this volume currently have any shadow
 *      copies, and if so which volume-control / file-I/O operations are
 *      disabled (decoded from the VSS_SNAPSHOT_COMPATIBILITY bitmask)?
 *   2. ShouldBlockRevert — is any registered writer flagged in the registry
 *      as one that should block revert operations on this volume?
 *
 * Every HRESULT is decoded by name, and the common unelevated-process result
 * (E_ACCESSDENIED) is reported cleanly rather than as a raw hex code. Nothing
 * is created, mounted, or deleted — this only reads status.
 *
 * APIs demonstrated (Vssapi):
 *   - IsVolumeSnapshotted          (shadow-copy presence + compatibility mask)
 *   - ShouldBlockRevert            (registry revert-block policy per volume)
 *
 * APIs demonstrated (cross-package):
 *   - Ole32.CoInitialize                       (enter a COM apartment — required by VSS)
 *   - Kernel32.GetLogicalDriveStringsW         (enumerate drive letters)
 *   - Kernel32.GetDriveTypeW                   (filter to fixed volumes)
 *   - Kernel32.GetStdHandle/Get|SetConsoleMode (enable ANSI VT processing)
 *
 * Run: bun run example/shadow-copy-inspector.ts
 */

import Vssapi, { VSS_SNAPSHOT_COMPATIBILITY } from '../index';
import Kernel32 from '@bun-win32/kernel32';
import Ole32 from '@bun-win32/ole32';

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const CYAN = '\x1b[96m';
const GREEN = '\x1b[92m';
const YELLOW = '\x1b[93m';
const RED = '\x1b[91m';
const MAGENTA = '\x1b[95m';
const BLUE = '\x1b[94m';

const S_OK = 0;
const DRIVE_FIXED = 3;
const STD_OUTPUT_HANDLE = 0xffff_fff5;
const ENABLE_VIRTUAL_TERMINAL_PROCESSING = 0x0004;

function enableVirtualTerminal(): void {
  const handle = Kernel32.GetStdHandle(STD_OUTPUT_HANDLE);
  const mode = Buffer.alloc(4);
  if (Kernel32.GetConsoleMode(handle, mode.ptr!)) {
    Kernel32.SetConsoleMode(handle, mode.readUInt32LE(0) | ENABLE_VIRTUAL_TERMINAL_PROCESSING);
  }
}

function wide(text: string): Buffer {
  return Buffer.from(text + '\0', 'utf16le');
}

function hresultName(hr: number): string {
  const u = hr >>> 0;
  if (hr === S_OK) return 'S_OK';
  if (u === 0x8007_0005) return 'E_ACCESSDENIED';
  if (u === 0x8007_0057) return 'E_INVALIDARG';
  if (u === 0x8007_000e) return 'E_OUTOFMEMORY';
  if (u === 0x8004_2308) return 'VSS_E_OBJECT_NOT_FOUND';
  if (u === 0x8004_2306) return 'VSS_E_PROVIDER_VETO';
  if (u === 0x8000_ffff) return 'E_UNEXPECTED';
  if (u === 0x8004_230f) return 'VSS_E_UNEXPECTED_PROVIDER_ERROR';
  return `0x${u.toString(16).padStart(8, '0')}`;
}

function decodeCompatibility(mask: number): string {
  if (mask === 0) return `${DIM}none (no operations disabled)${RESET}`;
  const parts: string[] = [];
  if (mask & VSS_SNAPSHOT_COMPATIBILITY.VSS_SC_DISABLE_DEFRAG) parts.push('DISABLE_DEFRAG');
  if (mask & VSS_SNAPSHOT_COMPATIBILITY.VSS_SC_DISABLE_CONTENTINDEX) parts.push('DISABLE_CONTENTINDEX');
  const known = VSS_SNAPSHOT_COMPATIBILITY.VSS_SC_DISABLE_DEFRAG | VSS_SNAPSHOT_COMPATIBILITY.VSS_SC_DISABLE_CONTENTINDEX;
  if (mask & ~known) parts.push(`0x${(mask & ~known).toString(16)}`);
  return parts.join(' | ');
}

function enumerateFixedDrives(): string[] {
  const cch = Kernel32.GetLogicalDriveStringsW(0, null!);
  if (cch === 0) return [];
  const buf = Buffer.alloc(cch * 2);
  Kernel32.GetLogicalDriveStringsW(cch, buf.ptr!);
  const raw = buf.toString('utf16le');
  const drives: string[] = [];
  for (const entry of raw.split('\0')) {
    if (entry.length === 0) continue;
    if (Kernel32.GetDriveTypeW(wide(entry).ptr!) === DRIVE_FIXED) drives.push(entry);
  }
  return drives;
}

function main(): void {
  enableVirtualTerminal();

  const init = Ole32.CoInitialize(null);
  if (init !== S_OK && init !== 1) {
    console.error(`${RED}CoInitialize failed: ${hresultName(init)}${RESET}`);
    return;
  }

  console.log(`\n${BOLD}${MAGENTA}  ┌────────────────────────────────────────────────┐${RESET}`);
  console.log(`${BOLD}${MAGENTA}  │          S H A D O W   C O P Y                 │${RESET}`);
  console.log(`${BOLD}${MAGENTA}  │             I N S P E C T O R                  │${RESET}`);
  console.log(`${BOLD}${MAGENTA}  └────────────────────────────────────────────────┘${RESET}`);
  console.log(`  ${DIM}Read-only VSS volume status, over pure FFI${RESET}\n`);

  const drives = enumerateFixedDrives();
  if (drives.length === 0) {
    console.log(`${YELLOW}No fixed volumes found.${RESET}`);
    return;
  }
  console.log(`  ${BOLD}Fixed volumes${RESET}  ${CYAN}${drives.join('  ')}${RESET}\n`);

  let accessDenied = false;

  for (const drive of drives) {
    console.log(`  ${BOLD}${BLUE}══${RESET} ${BOLD}${drive}${RESET}`);

    // IsVolumeSnapshotted wants a trailing backslash; drive strings already have one.
    const volume = wide(drive);
    const present = Buffer.alloc(4);
    const capability = Buffer.alloc(4);
    const hr = Vssapi.IsVolumeSnapshotted(volume.ptr!, present.ptr!, capability.ptr!);

    if (hr === S_OK) {
      const has = present.readInt32LE(0) !== 0;
      const cap = capability.readInt32LE(0);
      console.log(`     ${'Shadow copies'.padEnd(22)} ${has ? GREEN + 'PRESENT' : DIM + 'none'}${RESET}`);
      console.log(`     ${'Snapshot compat mask'.padEnd(22)} 0x${(cap >>> 0).toString(16).padStart(8, '0')} ${DIM}(${decodeCompatibility(cap)})${RESET}`);
    } else {
      if (hresultName(hr) === 'E_ACCESSDENIED') accessDenied = true;
      console.log(`     ${'IsVolumeSnapshotted'.padEnd(22)} ${RED}${hresultName(hr)}${RESET}`);
    }

    const block = Buffer.alloc(4);
    const rb = Vssapi.ShouldBlockRevert(wide(drive).ptr!, block.ptr!);
    if (rb === S_OK) {
      const blocked = block.readUInt8(0) !== 0;
      console.log(`     ${'Revert blocked'.padEnd(22)} ${blocked ? YELLOW + 'YES — a writer blocks revert' : GREEN + 'no'}${RESET}`);
    } else {
      const name = hresultName(rb);
      if (name === 'E_ACCESSDENIED') accessDenied = true;
      // ShouldBlockRevert is Server-only; client SKUs commonly return E_NOTIMPL-ish codes.
      console.log(`     ${'ShouldBlockRevert'.padEnd(22)} ${DIM}${name}${RESET}`);
    }
    console.log();
  }

  if (accessDenied) {
    console.log(`  ${YELLOW}${BOLD}Note:${RESET} ${YELLOW}some calls returned E_ACCESSDENIED — VSS requires an${RESET}`);
    console.log(`  ${YELLOW}elevated (Administrator) process with backup privileges.${RESET}`);
    console.log(`  ${DIM}Re-run from an elevated terminal for full results.${RESET}\n`);
  }

  console.log(`${GREEN}${BOLD}  ✓ Inspection complete — no volume was modified${RESET}\n`);
}

main();
