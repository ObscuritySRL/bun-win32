/**
 * Placeholder Diagnostic
 *
 * A thorough Cloud Files report. It prints the platform build/revision and
 * decodes the integration-number capability gates, then fully diagnoses a
 * directory: sync-root provider + policy record (queried both by path and by
 * handle), and a per-entry walk that classifies every file — placeholder state
 * decoded two independent ways (attribute/tag and find-data), pin state,
 * in-sync state, and the on-disk-vs-logical byte gap. Every HRESULT is decoded.
 *
 * Pass a directory as the first argument to diagnose it as-is (your OneDrive
 * folder, a network share, anything). With no argument, the example stands up
 * an ephemeral demo sync root with mixed pin states, runs the full diagnostic
 * against it, and tears it down — so the complete decode path is exercised on
 * any machine.
 *
 * APIs demonstrated (Cldapi):
 *   - CfGetPlatformInfo                       (build / revision / integration)
 *   - CfRegisterSyncRoot / CfUnregisterSyncRoot      (ephemeral demo root)
 *   - CfCreatePlaceholders                    (seed mixed placeholders)
 *   - CfSetPinState                           (PINNED / UNPINNED intent)
 *   - CfGetSyncRootInfoByPath                 (provider + policy by path)
 *   - CfGetSyncRootInfoByHandle               (same, via an open handle)
 *   - CfGetPlaceholderStateFromAttributeTag   (state from attributes + tag)
 *   - CfGetPlaceholderStateFromFindData       (state from a WIN32_FIND_DATAW)
 *   - CfGetPlaceholderInfo                    (on-disk size, pin, in-sync)
 *
 * APIs demonstrated (Kernel32, cross-package):
 *   - GetStdHandle / GetConsoleMode / SetConsoleMode  (enable ANSI VT)
 *   - CreateFileW / CloseHandle               (open dir / placeholder handles)
 *   - FindFirstFileW / FindNextFileW / FindClose      (enumerate the tree)
 *
 * Run: bun run example/placeholder-diagnostic.ts [directory]
 */
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';

import Cldapi, {
  CF_HARDLINK_POLICY,
  CF_HYDRATION_POLICY_MODIFIER,
  CF_HYDRATION_POLICY_PRIMARY,
  CF_IN_SYNC_STATE,
  CF_PIN_STATE,
  CF_PLACEHOLDER_CREATE_FLAGS,
  CF_PLACEHOLDER_INFO_CLASS,
  CF_PLACEHOLDER_MANAGEMENT_POLICY,
  CF_PLACEHOLDER_STATE,
  CF_POPULATION_POLICY_PRIMARY,
  CF_REGISTER_FLAGS,
  CF_SET_PIN_FLAGS,
  CF_SYNC_PROVIDER_STATUS,
  CF_SYNC_ROOT_INFO_CLASS,
} from '../index';
import Kernel32, { ConsoleMode, FileAccess, FileCreationDisposition, FileFlags, FileShareMode, STD_HANDLE } from '@bun-win32/kernel32';

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const CYAN = '\x1b[96m';
const GREEN = '\x1b[92m';
const YELLOW = '\x1b[93m';
const RED = '\x1b[91m';
const BLUE = '\x1b[94m';
const GRAY = '\x1b[90m';

const INVALID_HANDLE = 0xffff_ffff_ffff_ffffn;
const W = 78;

function enableAnsi(): void {
  const hStdout = Kernel32.GetStdHandle(STD_HANDLE.OUTPUT);
  const modeBuf = Buffer.alloc(4);
  if (Kernel32.GetConsoleMode(hStdout, modeBuf.ptr!)) {
    Kernel32.SetConsoleMode(hStdout, modeBuf.readUInt32LE(0) | ConsoleMode.ENABLE_VIRTUAL_TERMINAL_PROCESSING);
  }
}

function wide(text: string): Buffer {
  return Buffer.from(text + '\0', 'utf16le');
}

function hr(value: number): string {
  const u = value >>> 0;
  if (u === 0) return `${GREEN}S_OK${RESET}`;
  if ((u & 0xffff_0000) === 0x8007_0000) return `${YELLOW}0x${u.toString(16)} (win32 ${u & 0xffff})${RESET}`;
  return `${RED}0x${u.toString(16)}${RESET}`;
}

function formatBytes(bytes: bigint): string {
  if (bytes < 0n) return '—';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = Number(bytes);
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(value >= 100 || unit === 0 ? 0 : 1)} ${units[unit]}`;
}

function decodeProviderStatus(status: number): string {
  return CF_SYNC_PROVIDER_STATUS[status]?.replace('CF_PROVIDER_STATUS_', '') ?? `0x${(status >>> 0).toString(16)}`;
}

function decodeState(state: number): string {
  if (state === CF_PLACEHOLDER_STATE.CF_PLACEHOLDER_STATE_INVALID) return `${GRAY}—${RESET}`;
  const parts: string[] = [];
  if (state & CF_PLACEHOLDER_STATE.CF_PLACEHOLDER_STATE_PLACEHOLDER) parts.push('PLACEHOLDER');
  if (state & CF_PLACEHOLDER_STATE.CF_PLACEHOLDER_STATE_SYNC_ROOT) parts.push('SYNC_ROOT');
  if (state & CF_PLACEHOLDER_STATE.CF_PLACEHOLDER_STATE_ESSENTIAL_PROP_PRESENT) parts.push('ESSENTIAL');
  if (state & CF_PLACEHOLDER_STATE.CF_PLACEHOLDER_STATE_IN_SYNC) parts.push('IN_SYNC');
  if (state & CF_PLACEHOLDER_STATE.CF_PLACEHOLDER_STATE_PARTIAL) parts.push('PARTIAL');
  if (state & CF_PLACEHOLDER_STATE.CF_PLACEHOLDER_STATE_PARTIALLY_ON_DISK) parts.push('PART_ON_DISK');
  return parts.length ? `${GREEN}${parts.join('|')}${RESET}` : `${GRAY}none${RESET}`;
}

function readWide(buf: Buffer, byteOffset: number, maxChars: number): string {
  let out = '';
  for (let i = 0; i < maxChars; i++) {
    const code = buf.readUInt16LE(byteOffset + i * 2);
    if (code === 0) break;
    out += String.fromCharCode(code);
  }
  return out;
}

// Build an ephemeral sync root with a few mixed-pin-state placeholders so the
// full decode path is demonstrated even on a machine with no real provider.
function buildDemoRoot(): string {
  const root = join(tmpdir(), `bun-cldapi-diag-${process.pid}`);
  mkdirSync(root, { recursive: true });

  const providerName = wide('BunDiagnosticProvider');
  const providerVersion = wide('1.0.0');
  const reg = Buffer.alloc(72);
  reg.writeUInt32LE(72, 0);
  reg.writeBigUInt64LE(BigInt(providerName.ptr!), 8);
  reg.writeBigUInt64LE(BigInt(providerVersion.ptr!), 16);

  const pol = Buffer.alloc(24);
  pol.writeUInt32LE(24, 0);
  pol.writeUInt16LE(CF_HYDRATION_POLICY_PRIMARY.CF_HYDRATION_POLICY_PROGRESSIVE, 4);
  pol.writeUInt16LE(CF_HYDRATION_POLICY_MODIFIER.CF_HYDRATION_POLICY_MODIFIER_STREAMING_ALLOWED, 6);
  pol.writeUInt16LE(CF_POPULATION_POLICY_PRIMARY.CF_POPULATION_POLICY_FULL, 8);
  pol.writeUInt32LE(0, 12);
  pol.writeUInt32LE(CF_HARDLINK_POLICY.CF_HARDLINK_POLICY_NONE, 16);
  pol.writeUInt32LE(CF_PLACEHOLDER_MANAGEMENT_POLICY.CF_PLACEHOLDER_MANAGEMENT_POLICY_DEFAULT, 20);

  const rootW = wide(root);
  if (Cldapi.CfRegisterSyncRoot(rootW.ptr!, reg.ptr!, pol.ptr!, CF_REGISTER_FLAGS.CF_REGISTER_FLAG_NONE) !== 0) {
    return root; // registration failed; caller still gets a (plain) directory
  }

  const seed: Array<[string, bigint]> = [
    ['quarterly-report.pdf', 18_874_368n],
    ['training-set.tar', 7_516_192_768n],
    ['backup-2026.img', 53_687_091_200n],
    ['notes.txt', 4_096n],
  ];
  const ENTRY = 88;
  const now = BigInt(Date.now()) * 10_000n + 116_444_736_000_000_000n;
  const array = Buffer.alloc(ENTRY * seed.length);
  const keep: Buffer[] = [];
  seed.forEach(([name, size], i) => {
    const base = i * ENTRY;
    const nb = wide(name);
    const ib = Buffer.from(`diag:${name}`, 'utf16le');
    keep.push(nb, ib);
    array.writeBigUInt64LE(BigInt(nb.ptr!), base + 0);
    array.writeBigUInt64LE(now, base + 8);
    array.writeBigUInt64LE(now, base + 16);
    array.writeBigUInt64LE(now, base + 24);
    array.writeBigUInt64LE(now, base + 32);
    array.writeUInt32LE(0x0000_0080, base + 40);
    array.writeBigInt64LE(size, base + 48);
    array.writeBigUInt64LE(BigInt(ib.ptr!), base + 56);
    array.writeUInt32LE(ib.byteLength, base + 64);
    array.writeUInt32LE(CF_PLACEHOLDER_CREATE_FLAGS.CF_PLACEHOLDER_CREATE_FLAG_MARK_IN_SYNC | CF_PLACEHOLDER_CREATE_FLAGS.CF_PLACEHOLDER_CREATE_FLAG_DISABLE_ON_DEMAND_POPULATION, base + 68);
  });
  Cldapi.CfCreatePlaceholders(rootW.ptr!, array.ptr!, seed.length, 0, null!);

  // Express differing user intent via CfSetPinState on two of the placeholders.
  for (const [name, pin] of [
    ['quarterly-report.pdf', CF_PIN_STATE.CF_PIN_STATE_PINNED],
    ['backup-2026.img', CF_PIN_STATE.CF_PIN_STATE_UNPINNED],
  ] as Array<[string, CF_PIN_STATE]>) {
    const h = Kernel32.CreateFileW(wide(join(root, name)).ptr!, FileAccess.GENERIC_READ | FileAccess.GENERIC_WRITE, FileShareMode.FILE_SHARE_READ, null!, FileCreationDisposition.OPEN_EXISTING, 0, 0n);
    if (h !== 0n && h !== INVALID_HANDLE) {
      Cldapi.CfSetPinState(h, pin, CF_SET_PIN_FLAGS.CF_SET_PIN_FLAG_NONE, null);
      Kernel32.CloseHandle(h);
    }
  }
  return root;
}

function diagnose(target: string): void {
  // ── Sync root (queried by path, then re-queried by handle) ───────────────
  console.log(`\n${BOLD}Sync Root${RESET}  ${GRAY}${target}${RESET}`);
  const provBuf = Buffer.alloc(2048);
  const provRet = Buffer.alloc(4);
  const hrProv = Cldapi.CfGetSyncRootInfoByPath(wide(target).ptr!, CF_SYNC_ROOT_INFO_CLASS.CF_SYNC_ROOT_INFO_PROVIDER, provBuf.ptr!, provBuf.byteLength, provRet.ptr!);
  if (hrProv === 0) {
    const status = provBuf.readUInt32LE(0);
    console.log(`  Provider ........... ${GREEN}${readWide(provBuf, 4, 256) || '(unnamed)'}${RESET}`);
    console.log(`  Version ............ ${CYAN}${readWide(provBuf, 4 + 512, 256) || '—'}${RESET}`);
    console.log(`  Status ............. ${CYAN}${decodeProviderStatus(status)}${RESET}`);

    const stdBuf = Buffer.alloc(2048);
    const stdRet = Buffer.alloc(4);
    if (Cldapi.CfGetSyncRootInfoByPath(wide(target).ptr!, CF_SYNC_ROOT_INFO_CLASS.CF_SYNC_ROOT_INFO_STANDARD, stdBuf.ptr!, stdBuf.byteLength, stdRet.ptr!) === 0) {
      // CF_SYNC_ROOT_STANDARD_INFO: SyncRootFileId(8) Hydration(4) Population(4) InSync(4) HardLink(4) Status(4) ...
      console.log(`  SyncRootFileId ..... ${GRAY}0x${stdBuf.readBigUInt64LE(0).toString(16)}${RESET}`);
      console.log(`  Hydration .......... ${CYAN}${CF_HYDRATION_POLICY_PRIMARY[stdBuf.readUInt16LE(8)] ?? stdBuf.readUInt16LE(8)}${RESET} ${DIM}mod=0x${stdBuf.readUInt16LE(10).toString(16)}${RESET}`);
      console.log(`  Population ......... ${CYAN}${CF_POPULATION_POLICY_PRIMARY[stdBuf.readUInt16LE(12)] ?? stdBuf.readUInt16LE(12)}${RESET}`);
      console.log(`  HardLink ........... ${CYAN}${CF_HARDLINK_POLICY[stdBuf.readUInt32LE(20)] ?? stdBuf.readUInt32LE(20)}${RESET}`);
    }

    // Same record, but resolved through an open directory handle.
    const hDir = Kernel32.CreateFileW(wide(target).ptr!, FileAccess.GENERIC_READ, FileShareMode.FILE_SHARE_READ | FileShareMode.FILE_SHARE_WRITE, null!, FileCreationDisposition.OPEN_EXISTING, FileFlags.FILE_FLAG_BACKUP_SEMANTICS, 0n);
    if (hDir !== 0n && hDir !== INVALID_HANDLE) {
      const byH = Buffer.alloc(2048);
      const byHRet = Buffer.alloc(4);
      const hrByHandle = Cldapi.CfGetSyncRootInfoByHandle(hDir, CF_SYNC_ROOT_INFO_CLASS.CF_SYNC_ROOT_INFO_PROVIDER, byH.ptr!, byH.byteLength, byHRet.ptr!);
      console.log(`  ByHandle parity .... ${hrByHandle === 0 && readWide(byH, 4, 256) === readWide(provBuf, 4, 256) ? `${GREEN}match${RESET}` : hr(hrByHandle)}`);
      Kernel32.CloseHandle(hDir);
    }
  } else {
    console.log(`  ${YELLOW}Not under a cloud sync root${RESET}  ${DIM}CfGetSyncRootInfoByPath → ${hr(hrProv)}${RESET}`);
    console.log(`  ${DIM}(placeholder classification below still works on plain files)${RESET}`);
  }

  // ── Walk the directory ───────────────────────────────────────────────────
  console.log(`\n${BOLD}Entries${RESET}  ${GRAY}${target}${RESET}\n`);
  console.log(`  ${DIM}${'NAME'.padEnd(26)}${'LOGICAL'.padStart(10)}${'ON-DISK'.padStart(10)}  PIN          STATE${RESET}`);
  console.log(`  ${GRAY}${'─'.repeat(W - 2)}${RESET}`);

  const findData = Buffer.alloc(592);
  const hFind = Kernel32.FindFirstFileW(wide(join(target, '*')).ptr!, findData.ptr!);
  let files = 0;
  let placeholders = 0;
  let shown = 0;
  let totalLogical = 0n;
  let totalOnDisk = 0n;
  const MAX_ROWS = 40;

  if (hFind !== 0n && hFind !== INVALID_HANDLE) {
    do {
      const attrs = findData.readUInt32LE(0);
      if (attrs & 0x10) continue; // FILE_ATTRIBUTE_DIRECTORY
      let fileName = readWide(findData, 44, 260);
      if (!fileName || fileName === '.' || fileName === '..') continue;
      files++;

      const reparseTag = attrs & 0x0000_0400 ? findData.readUInt32LE(36) : 0; // dwReserved0 holds the tag for reparse points
      const stateByTag = Cldapi.CfGetPlaceholderStateFromAttributeTag(attrs, reparseTag);
      const stateByFind = Cldapi.CfGetPlaceholderStateFromFindData(findData.ptr!);
      const logical = (BigInt(findData.readUInt32LE(28)) << 32n) | BigInt(findData.readUInt32LE(32));
      totalLogical += logical;

      let onDisk = -1n;
      let pin = '—';
      let isPlaceholder = false;
      const hFile = Kernel32.CreateFileW(
        wide(join(target, fileName)).ptr!,
        FileAccess.GENERIC_READ,
        FileShareMode.FILE_SHARE_READ | FileShareMode.FILE_SHARE_WRITE | FileShareMode.FILE_SHARE_DELETE,
        null!,
        FileCreationDisposition.OPEN_EXISTING,
        FileFlags.FILE_FLAG_BACKUP_SEMANTICS,
        0n,
      );
      if (hFile !== 0n && hFile !== INVALID_HANDLE) {
        const std = Buffer.alloc(512);
        const ret = Buffer.alloc(4);
        if (Cldapi.CfGetPlaceholderInfo(hFile, CF_PLACEHOLDER_INFO_CLASS.CF_PLACEHOLDER_INFO_STANDARD, std.ptr!, std.byteLength, ret.ptr!) === 0) {
          isPlaceholder = true;
          onDisk = std.readBigInt64LE(0); // OnDiskDataSize
          const pinState = std.readUInt32LE(32);
          const inSync = std.readUInt32LE(36) === CF_IN_SYNC_STATE.CF_IN_SYNC_STATE_IN_SYNC;
          pin = `${CF_PIN_STATE[pinState]?.replace('CF_PIN_STATE_', '') ?? pinState}${inSync ? '' : '*'}`;
        }
        Kernel32.CloseHandle(hFile);
      }
      if (isPlaceholder) {
        placeholders++;
        totalOnDisk += onDisk < 0n ? 0n : onDisk;
      } else {
        onDisk = logical;
        totalOnDisk += logical;
      }

      if (shown < MAX_ROWS) {
        if (fileName.length > 25) fileName = fileName.slice(0, 24) + '…';
        const stateText = isPlaceholder ? decodeState(stateByFind === CF_PLACEHOLDER_STATE.CF_PLACEHOLDER_STATE_NO_STATES ? CF_PLACEHOLDER_STATE.CF_PLACEHOLDER_STATE_PLACEHOLDER : stateByFind) : decodeState(stateByFind);
        const tagMark = stateByTag === stateByFind ? '' : ` ${DIM}(tag=0x${(stateByTag >>> 0).toString(16)})${RESET}`;
        console.log(
          `  ${fileName.padEnd(26)}` +
            `${CYAN}${formatBytes(logical).padStart(10)}${RESET}` +
            `${(isPlaceholder && onDisk === 0n ? GREEN : '') + formatBytes(onDisk < 0n ? 0n : onDisk).padStart(10)}${RESET}` +
            `  ${pin.padEnd(11)}  ${stateText}${tagMark}`,
        );
        shown++;
      }
    } while (Kernel32.FindNextFileW(hFind, findData.ptr!));
    Kernel32.FindClose(hFind);
  }

  if (files > shown) console.log(`  ${DIM}… and ${files - shown} more file(s)${RESET}`);
  console.log(`  ${GRAY}${'─'.repeat(W - 2)}${RESET}`);
  console.log(`\n${BOLD}Summary${RESET}`);
  console.log(`  Files .............. ${CYAN}${files}${RESET}`);
  console.log(`  Placeholders ....... ${CYAN}${placeholders}${RESET}  ${DIM}(${files - placeholders} fully on disk)${RESET}`);
  console.log(`  Logical total ...... ${CYAN}${formatBytes(totalLogical)}${RESET}`);
  console.log(`  On-disk total ...... ${GREEN}${formatBytes(totalOnDisk)}${RESET}`);
  const saved = totalLogical - totalOnDisk;
  console.log(`  Reclaimed by cloud . ${saved > 0n ? GREEN : GRAY}${formatBytes(saved > 0n ? saved : 0n)}${RESET}`);
}

Cldapi.Preload();
Kernel32.Preload(['GetStdHandle', 'GetConsoleMode', 'SetConsoleMode', 'CreateFileW', 'CloseHandle', 'FindFirstFileW', 'FindNextFileW', 'FindClose']);
enableAnsi();

console.log(`\n${BOLD}${BLUE}${'═'.repeat(W)}${RESET}`);
console.log(`${BOLD}            CLOUD FILES PLACEHOLDER DIAGNOSTIC${RESET}`);
console.log(`${DIM}                 powered by @bun-win32/cldapi${RESET}`);
console.log(`${BOLD}${BLUE}${'═'.repeat(W)}${RESET}`);

// ── Platform ───────────────────────────────────────────────────────────────
const platform = Buffer.alloc(12);
const hrPlat = Cldapi.CfGetPlatformInfo(platform.ptr!);
console.log(`\n${BOLD}Platform${RESET}`);
if (hrPlat !== 0) {
  console.log(`  ${RED}CfGetPlatformInfo → ${hr(hrPlat)} — Cloud Files unavailable${RESET}`);
  process.exit(1);
}
const integration = platform.readUInt32LE(8);
console.log(`  Build .............. ${CYAN}${platform.readUInt32LE(0)}${RESET}`);
console.log(`  Revision ........... ${CYAN}${platform.readUInt32LE(4)}${RESET}`);
console.log(`  Integration ........ ${CYAN}0x${integration.toString(16)}${RESET} ${DIM}(${integration})${RESET}`);
for (const [need, label] of [
  [0x310, 'unrestricted placeholder management policies'],
  [0x600, 'CfGetPlaceholderRangeInfoForHydration'],
] as Array<[number, string]>) {
  const ok = integration >= need;
  console.log(`    ${ok ? `${GREEN}✓${RESET}` : `${RED}✗${RESET}`} 0x${need.toString(16).padStart(3, '0')}  ${DIM}${label}${RESET}`);
}

const arg = process.argv[2];
const oneDrive = process.env.OneDrive ?? process.env.OneDriveConsumer ?? '';

if (arg) {
  diagnose(arg);
} else if (oneDrive && existsSync(oneDrive) && Cldapi.CfGetSyncRootInfoByPath(wide(oneDrive).ptr!, CF_SYNC_ROOT_INFO_CLASS.CF_SYNC_ROOT_INFO_BASIC, Buffer.alloc(16).ptr!, 16, null!) === 0) {
  diagnose(oneDrive);
} else {
  console.log(`\n${DIM}No directory argument and no live sync root detected — standing up an ephemeral demo root.${RESET}`);
  const demo = buildDemoRoot();
  try {
    diagnose(demo);
  } finally {
    const hrUn = Cldapi.CfUnregisterSyncRoot(wide(demo).ptr!);
    console.log(`\n  ${GRAY}cleanup: CfUnregisterSyncRoot → 0x${(hrUn >>> 0).toString(16)} · removed ${demo}${RESET}`);
    try {
      rmSync(demo, { recursive: true, force: true });
    } catch {
      /* best effort */
    }
  }
}

console.log(`\n${BOLD}${BLUE}${'═'.repeat(W)}${RESET}\n`);
