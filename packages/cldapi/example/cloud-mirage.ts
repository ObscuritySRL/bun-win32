/**
 * Cloud Mirage
 *
 * Conjures a phantom cloud drive entirely from FFI. It registers a real Cloud
 * Files sync root in a throwaway temp directory, then projects a catalog of
 * multi-gigabyte "star survey" placeholder files. Each file shows its full
 * logical size and timestamps in Explorer and `dir`, yet occupies ZERO bytes
 * on disk — the data only exists in the sync provider's imagination until a
 * hydration is requested. The reveal is animated in truecolor ANSI, every
 * placeholder's CF_PLACEHOLDER_STATE is decoded straight from its directory
 * entry, and the on-disk-vs-logical gap is measured per file. No OneDrive, no
 * provider process, no background service — just cldapi.dll.
 *
 * APIs demonstrated (Cldapi):
 *   - CfGetPlatformInfo                  (platform build / integration number)
 *   - CfRegisterSyncRoot                 (claim a directory tree as a sync root)
 *   - CfCreatePlaceholders               (project zero-byte phantom files)
 *   - CfGetPlaceholderStateFromFindData  (decode state from a WIN32_FIND_DATAW)
 *   - CfGetPlaceholderInfo               (on-disk vs logical size, pin state)
 *   - CfUnregisterSyncRoot               (release the sync root)
 *
 * APIs demonstrated (Kernel32, cross-package):
 *   - GetStdHandle / GetConsoleMode / SetConsoleMode  (enable ANSI VT)
 *   - CreateFileW / CloseHandle          (open a placeholder for inspection)
 *   - FindFirstFileW / FindNextFileW / FindClose      (enumerate the mirage)
 *
 * Run: bun run example/cloud-mirage.ts
 */
import { mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import Cldapi, {
  CF_HARDLINK_POLICY,
  CF_HYDRATION_POLICY_MODIFIER,
  CF_HYDRATION_POLICY_PRIMARY,
  CF_PIN_STATE,
  CF_PLACEHOLDER_CREATE_FLAGS,
  CF_PLACEHOLDER_INFO_CLASS,
  CF_PLACEHOLDER_MANAGEMENT_POLICY,
  CF_PLACEHOLDER_STATE,
  CF_POPULATION_POLICY_PRIMARY,
  CF_REGISTER_FLAGS,
} from '../index';
import Kernel32, { ConsoleMode, FileAccess, FileCreationDisposition, FileShareMode, STD_HANDLE } from '@bun-win32/kernel32';

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const CYAN = '\x1b[96m';
const GREEN = '\x1b[92m';
const YELLOW = '\x1b[93m';
const MAGENTA = '\x1b[95m';
const GRAY = '\x1b[90m';
const fg = (r: number, g: number, b: number) => `\x1b[38;2;${r};${g};${b}m`;

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

function formatBytes(bytes: bigint): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = Number(bytes);
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(value >= 100 || unit === 0 ? 0 : 2)} ${units[unit]}`;
}

function decodeState(state: number): string {
  if (state === CF_PLACEHOLDER_STATE.CF_PLACEHOLDER_STATE_INVALID) return `${YELLOW}INVALID${RESET}`;
  const parts: string[] = [];
  if (state & CF_PLACEHOLDER_STATE.CF_PLACEHOLDER_STATE_PLACEHOLDER) parts.push('PLACEHOLDER');
  if (state & CF_PLACEHOLDER_STATE.CF_PLACEHOLDER_STATE_SYNC_ROOT) parts.push('SYNC_ROOT');
  if (state & CF_PLACEHOLDER_STATE.CF_PLACEHOLDER_STATE_ESSENTIAL_PROP_PRESENT) parts.push('ESSENTIAL_PROP');
  if (state & CF_PLACEHOLDER_STATE.CF_PLACEHOLDER_STATE_IN_SYNC) parts.push('IN_SYNC');
  if (state & CF_PLACEHOLDER_STATE.CF_PLACEHOLDER_STATE_PARTIAL) parts.push('PARTIAL');
  if (state & CF_PLACEHOLDER_STATE.CF_PLACEHOLDER_STATE_PARTIALLY_ON_DISK) parts.push('PARTIALLY_ON_DISK');
  return parts.length ? `${GREEN}${parts.join('|')}${RESET}` : `${GRAY}NO_STATES${RESET}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// A fake deep-sky survey: name + logical size. None of these bytes will exist.
const CATALOG: Array<[string, bigint]> = [
  ['Betelgeuse.fits', 4_731_174_912n],
  ['Rigel.fits', 2_147_483_648n],
  ['Sirius-A.fits', 922_746_880n],
  ['Vega.fits', 1_395_864_371n],
  ['Antares.fits', 3_972_844_748n],
  ['Polaris.fits', 641_728_512n],
  ['Aldebaran.fits', 2_899_102_925n],
  ['Canopus.fits', 5_368_709_120n],
];

const STAR = fg(255, 214, 102);

const root = join(tmpdir(), `bun-cldapi-mirage-${process.pid}`);
let registered = false;

Cldapi.Preload(['CfGetPlatformInfo', 'CfRegisterSyncRoot', 'CfCreatePlaceholders', 'CfGetPlaceholderStateFromFindData', 'CfGetPlaceholderInfo', 'CfUnregisterSyncRoot']);
Kernel32.Preload(['GetStdHandle', 'GetConsoleMode', 'SetConsoleMode', 'CreateFileW', 'CloseHandle', 'FindFirstFileW', 'FindNextFileW', 'FindClose']);

enableAnsi();

const INVALID_HANDLE = 0xffff_ffff_ffff_ffffn;

try {
  console.log(`\n${BOLD}${MAGENTA}╔══════════════════════════════════════════════════════════════════╗${RESET}`);
  console.log(`${BOLD}${MAGENTA}║${RESET}  ${STAR}✦${RESET} ${BOLD}CLOUD MIRAGE${RESET} — a phantom drive projected through cldapi.dll  ${BOLD}${MAGENTA}║${RESET}`);
  console.log(`${BOLD}${MAGENTA}╚══════════════════════════════════════════════════════════════════╝${RESET}\n`);

  // ── Platform info ────────────────────────────────────────────────────────
  const platform = Buffer.alloc(12);
  if (Cldapi.CfGetPlatformInfo(platform.ptr!) !== 0) {
    console.log(`${YELLOW}CfGetPlatformInfo failed — Cloud Files platform unavailable.${RESET}`);
    process.exit(1);
  }
  console.log(`  ${DIM}platform${RESET}  build ${CYAN}${platform.readUInt32LE(0)}${RESET}` + `  revision ${CYAN}${platform.readUInt32LE(4)}${RESET}` + `  integration ${CYAN}0x${platform.readUInt32LE(8).toString(16)}${RESET}\n`);

  // ── Register the sync root ───────────────────────────────────────────────
  mkdirSync(root, { recursive: true });

  const providerName = wide('BunCloudMirage');
  const providerVersion = wide('1.0.0');

  // CF_SYNC_REGISTRATION (x64, 72 bytes)
  const reg = Buffer.alloc(72);
  reg.writeUInt32LE(72, 0); // StructSize
  reg.writeBigUInt64LE(BigInt(providerName.ptr!), 8); // ProviderName
  reg.writeBigUInt64LE(BigInt(providerVersion.ptr!), 16); // ProviderVersion
  // SyncRootIdentity NULL / len 0, FileIdentity NULL / len 0, ProviderId zeroed

  // CF_SYNC_POLICIES (x64, 24 bytes)
  const pol = Buffer.alloc(24);
  pol.writeUInt32LE(24, 0); // StructSize
  pol.writeUInt16LE(CF_HYDRATION_POLICY_PRIMARY.CF_HYDRATION_POLICY_FULL, 4); // Hydration.Primary
  pol.writeUInt16LE(CF_HYDRATION_POLICY_MODIFIER.CF_HYDRATION_POLICY_MODIFIER_NONE, 6); // Hydration.Modifier
  pol.writeUInt16LE(CF_POPULATION_POLICY_PRIMARY.CF_POPULATION_POLICY_FULL, 8); // Population.Primary
  pol.writeUInt16LE(0, 10); // Population.Modifier
  pol.writeUInt32LE(0, 12); // InSync = CF_INSYNC_POLICY_NONE
  pol.writeUInt32LE(CF_HARDLINK_POLICY.CF_HARDLINK_POLICY_NONE, 16);
  pol.writeUInt32LE(CF_PLACEHOLDER_MANAGEMENT_POLICY.CF_PLACEHOLDER_MANAGEMENT_POLICY_DEFAULT, 20);

  const rootPath = wide(root);
  const hrReg = Cldapi.CfRegisterSyncRoot(rootPath.ptr!, reg.ptr!, pol.ptr!, CF_REGISTER_FLAGS.CF_REGISTER_FLAG_NONE);
  if (hrReg !== 0) {
    console.log(`${YELLOW}CfRegisterSyncRoot failed: 0x${(hrReg >>> 0).toString(16)}${RESET}`);
    console.log(`${GRAY}(the temp directory may itself be inside another sync root)${RESET}`);
    process.exit(1);
  }
  registered = true;
  console.log(`  ${GREEN}✓${RESET} sync root claimed  ${GRAY}${root}${RESET}\n`);

  // ── Project the placeholders ─────────────────────────────────────────────
  // CF_PLACEHOLDER_CREATE_INFO is 88 bytes on x64. We build a contiguous array.
  const ENTRY = 88;
  const now = BigInt(Date.now()) * 10_000n + 116_444_736_000_000_000n; // FILETIME
  const array = Buffer.alloc(ENTRY * CATALOG.length);
  // Names and identities must outlive the call — keep references alive.
  const nameBufs: Buffer[] = [];
  const idBufs: Buffer[] = [];

  CATALOG.forEach(([name, size], i) => {
    const base = i * ENTRY;
    const nameBuf = wide(name);
    const idBuf = Buffer.from(`mirage:${name}`, 'utf16le');
    nameBufs.push(nameBuf);
    idBufs.push(idBuf);

    array.writeBigUInt64LE(BigInt(nameBuf.ptr!), base + 0); // RelativeFileName
    // FsMetadata.BasicInfo (offset +8): four FILETIMEs then FileAttributes
    array.writeBigUInt64LE(now, base + 8); // CreationTime
    array.writeBigUInt64LE(now, base + 16); // LastAccessTime
    array.writeBigUInt64LE(now, base + 24); // LastWriteTime
    array.writeBigUInt64LE(now, base + 32); // ChangeTime
    array.writeUInt32LE(0x0000_0080, base + 40); // FileAttributes = FILE_ATTRIBUTE_NORMAL
    array.writeBigInt64LE(size, base + 48); // FsMetadata.FileSize (logical)
    array.writeBigUInt64LE(BigInt(idBuf.ptr!), base + 56); // FileIdentity
    array.writeUInt32LE(idBuf.byteLength, base + 64); // FileIdentityLength
    array.writeUInt32LE(CF_PLACEHOLDER_CREATE_FLAGS.CF_PLACEHOLDER_CREATE_FLAG_MARK_IN_SYNC | CF_PLACEHOLDER_CREATE_FLAGS.CF_PLACEHOLDER_CREATE_FLAG_DISABLE_ON_DEMAND_POPULATION, base + 68); // Flags
  });

  const processed = Buffer.alloc(4);
  const hrCreate = Cldapi.CfCreatePlaceholders(
    rootPath.ptr!,
    array.ptr!,
    CATALOG.length,
    0, // CF_CREATE_FLAGS_NONE
    processed.ptr!,
  );
  if (hrCreate !== 0) {
    console.log(`${YELLOW}CfCreatePlaceholders failed: 0x${(hrCreate >>> 0).toString(16)}${RESET}`);
    process.exit(1);
  }

  console.log(`  ${BOLD}materializing ${CATALOG.length} phantom files…${RESET}\n`);
  const spinner = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  for (let i = 0; i < CATALOG.length; i++) {
    const [name, size] = CATALOG[i]!;
    const perEntryResult = array.readInt32LE(i * ENTRY + 72); // CF_PLACEHOLDER_CREATE_INFO.Result
    const ok = perEntryResult === 0;
    for (let f = 0; f < 8; f++) {
      const bar = '█'.repeat(f + 1) + '░'.repeat(11 - f);
      process.stdout.write(`\r   ${STAR}${spinner[f % spinner.length]}${RESET} ${name.padEnd(18)} ${fg(120, 170, 255)}${bar}${RESET} ${DIM}${formatBytes(size)}${RESET}   `);
      await sleep(28);
    }
    const mark = ok ? `${GREEN}✓${RESET}` : `${YELLOW}✗ 0x${(perEntryResult >>> 0).toString(16)}${RESET}`;
    process.stdout.write(`\r   ${mark} ${BOLD}${name.padEnd(18)}${RESET} ${fg(120, 170, 255)}████████████${RESET} ${formatBytes(size)}            \n`);
  }

  // ── Walk the mirage and decode every placeholder ─────────────────────────
  console.log(`\n  ${BOLD}the directory now reports:${RESET}\n`);
  console.log(`  ${DIM}${'NAME'.padEnd(18)}${'LOGICAL'.padStart(12)}${'ON-DISK'.padStart(12)}   PLACEHOLDER STATE${RESET}`);
  console.log(`  ${GRAY}${'─'.repeat(66)}${RESET}`);

  const findData = Buffer.alloc(592); // WIN32_FIND_DATAW (x64)
  const hFind = Kernel32.FindFirstFileW(wide(join(root, '*')).ptr!, findData.ptr!);
  let totalLogical = 0n;
  let totalOnDisk = 0n;
  let count = 0;

  if (hFind !== 0n && hFind !== INVALID_HANDLE) {
    do {
      const attrs = findData.readUInt32LE(0);
      const nameStart = 44; // WIN32_FIND_DATAW.cFileName
      let fileName = '';
      for (let o = nameStart; o < nameStart + 520; o += 2) {
        const code = findData.readUInt16LE(o);
        if (code === 0) break;
        fileName += String.fromCharCode(code);
      }
      if (fileName === '.' || fileName === '..') continue;
      if (attrs & 0x10) continue; // skip directories

      // The directory-entry quick-classifier (works off the WIN32_FIND_DATAW).
      const findState = Cldapi.CfGetPlaceholderStateFromFindData(findData.ptr!);

      const logical = (BigInt(findData.readUInt32LE(28)) << 32n) | BigInt(findData.readUInt32LE(32));
      totalLogical += logical;

      // The authoritative source: open the placeholder and read its STANDARD info.
      let onDisk = 0n;
      let infoOk = false;
      let inSync = false;
      let pin = '';
      const hFile = Kernel32.CreateFileW(
        wide(join(root, fileName)).ptr!,
        FileAccess.GENERIC_READ,
        FileShareMode.FILE_SHARE_READ | FileShareMode.FILE_SHARE_WRITE | FileShareMode.FILE_SHARE_DELETE,
        null!,
        FileCreationDisposition.OPEN_EXISTING,
        0,
        0n,
      );
      if (hFile !== 0n && hFile !== INVALID_HANDLE) {
        const std = Buffer.alloc(256);
        const ret = Buffer.alloc(4);
        if (Cldapi.CfGetPlaceholderInfo(hFile, CF_PLACEHOLDER_INFO_CLASS.CF_PLACEHOLDER_INFO_STANDARD, std.ptr!, std.byteLength, ret.ptr!) === 0) {
          infoOk = true;
          onDisk = std.readBigInt64LE(0); // CF_PLACEHOLDER_STANDARD_INFO.OnDiskDataSize
          const pinState = std.readUInt32LE(32); // PinState
          inSync = std.readUInt32LE(36) === 1; // InSyncState == CF_IN_SYNC_STATE_IN_SYNC
          pin = (CF_PIN_STATE[pinState] ?? `PIN_${pinState}`).replace('CF_PIN_STATE_', '');
        }
        Kernel32.CloseHandle(hFile);
      }
      totalOnDisk += onDisk;
      count++;

      // Authoritative state from CfGetPlaceholderInfo; the raw find-data view is
      // shown alongside it (a full in-sync placeholder isn't a reparse point, so
      // the directory-entry classifier reports nothing — that contrast is real).
      const stateText = infoOk ? `${GREEN}PLACEHOLDER${inSync ? '|IN_SYNC' : ''}${RESET}` : decodeState(findState);

      console.log(
        `  ${BOLD}${fileName.padEnd(18)}${RESET}` +
          `${CYAN}${formatBytes(logical).padStart(12)}${RESET}` +
          `${onDisk === 0n ? GREEN : YELLOW}${formatBytes(onDisk).padStart(12)}${RESET}` +
          `   ${stateText} ${GRAY}${pin} · find=0x${(findState >>> 0).toString(16)}${RESET}`,
      );
    } while (Kernel32.FindNextFileW(hFind, findData.ptr!));
    Kernel32.FindClose(hFind);
  }

  console.log(`  ${GRAY}${'─'.repeat(66)}${RESET}`);
  console.log(`  ${BOLD}${`${count} files`.padEnd(18)}${RESET}` + `${CYAN}${formatBytes(totalLogical).padStart(12)}${RESET}` + `${GREEN}${formatBytes(totalOnDisk).padStart(12)}${RESET}\n`);
  console.log(`  ${STAR}✦${RESET} ${BOLD}${formatBytes(totalLogical)}${RESET} of files exist in the namespace — ` + `${GREEN}${formatBytes(totalOnDisk)}${RESET} of bytes exist on disk.`);
  console.log(`  ${DIM}every byte was projected by cldapi.dll through pure FFI.${RESET}\n`);
} finally {
  // ── Tear down the mirage ─────────────────────────────────────────────────
  if (registered) {
    const hrUnreg = Cldapi.CfUnregisterSyncRoot(wide(root).ptr!);
    console.log(`  ${GRAY}cleanup: CfUnregisterSyncRoot → 0x${(hrUnreg >>> 0).toString(16)}${RESET}`);
  }
  try {
    rmSync(root, { recursive: true, force: true });
    console.log(`  ${GRAY}cleanup: removed ${root}${RESET}\n`);
  } catch {
    /* best effort */
  }
}
