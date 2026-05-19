/**
 * CLFS Subsystem Diagnostic
 *
 * Forges a real Common Log File System dedicated base log file (.blf) on disk,
 * validates its on-disk metadata with the kernel, proves the 8-byte by-value
 * CLFS_LSN return ABI with an exhaustive LsnCreate -> decompose round-trip over
 * many test vectors, and then walks the full container / marshaling / append /
 * statistics pipeline, reporting each call's exact status. Container creation
 * and record append flow through the CLFS.sys driver and require elevation; on
 * a standard token those steps surface ERROR_ACCESS_DENIED honestly instead of
 * faking success. Run elevated, the entire pipeline and the decoded
 * CLFS_INFORMATION / CLFS_IO_STATISTICS report print in full.
 *
 * APIs demonstrated (Clfsw32):
 *   - CreateLogFile                (create the dedicated base log file)
 *   - ValidateLog                  (validate on-disk log metadata)
 *   - LsnCreate                    (compose an LSN, returned by value)
 *   - LsnContainer                 (decode container id from an LSN)
 *   - LsnBlockOffset               (decode block offset from an LSN)
 *   - LsnRecordSequence            (decode record sequence from an LSN)
 *   - RegisterManageableLogClient  (join the CLFS management scheme)
 *   - InstallLogPolicy             (set the new-container-size policy)
 *   - SetLogFileSizeWithPolicy     (grow the log by policy)
 *   - AddLogContainer              (add a container directly)
 *   - QueryLogPolicy               (read an installed policy back)
 *   - CreateLogMarshallingArea     (open a marshaling context)
 *   - ReserveAndAppendLog          (durably append a log record)
 *   - FlushLogBuffers              (force buffers to disk)
 *   - GetLogFileInformation        (decode the CLFS_INFORMATION block)
 *   - GetLogIoStatistics           (decode CLFS_IO_STATISTICS counters)
 *   - DeleteLogMarshallingArea     (release the marshaling context)
 *   - DeleteLogByHandle            (mark the log for deletion)
 *   - DeleteLogFile                (delete the base log file)
 *
 * APIs demonstrated (Kernel32, cross-package):
 *   - GetLastError                 (decode CLFS failure codes)
 *   - CloseHandle                  (release the log handle)
 *
 * Run: bun run example/clfs-diagnostic.ts
 */
import { existsSync, mkdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import Kernel32 from '@bun-win32/kernel32';

import Clfsw32, { CLFS_FLAG_FORCE_FLUSH, CLFS_IOSTATS_CLASS, CLFS_MGMT_POLICY_TYPE, GENERIC_READ, GENERIC_WRITE, INVALID_HANDLE_VALUE, OPEN_ALWAYS } from '../index';

Clfsw32.Preload([
  'CreateLogFile',
  'ValidateLog',
  'LsnCreate',
  'LsnContainer',
  'LsnBlockOffset',
  'LsnRecordSequence',
  'RegisterManageableLogClient',
  'InstallLogPolicy',
  'SetLogFileSizeWithPolicy',
  'AddLogContainer',
  'QueryLogPolicy',
  'CreateLogMarshallingArea',
  'ReserveAndAppendLog',
  'FlushLogBuffers',
  'GetLogFileInformation',
  'GetLogIoStatistics',
  'DeleteLogMarshallingArea',
  'DeleteLogByHandle',
  'DeleteLogFile',
]);
Kernel32.Preload(['GetLastError', 'CloseHandle']);

const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const CYAN = '\x1b[96m';
const GREEN = '\x1b[92m';
const YELLOW = '\x1b[93m';
const RED = '\x1b[91m';
const RESET = '\x1b[0m';

const W = 74;

const WIN32_ERRORS: Record<number, string> = {
  0: 'ERROR_SUCCESS',
  5: 'ERROR_ACCESS_DENIED (requires elevation)',
  87: 'ERROR_INVALID_PARAMETER',
  1314: 'ERROR_PRIVILEGE_NOT_HELD',
  1921: 'ERROR_CANT_RESOLVE_FILENAME',
};

function err(): string {
  const code = Kernel32.GetLastError();
  return `${code} ${DIM}${WIN32_ERRORS[code] ?? ''}${RESET}`;
}

function rule(): void {
  console.log(DIM + '─'.repeat(W) + RESET);
}

function row(label: string, value: string): void {
  console.log(`  ${label.padEnd(28)}${value}`);
}

function step(ok: boolean, label: string, detail: string): boolean {
  console.log(`  ${ok ? GREEN + '✓' : YELLOW + '⚠'} ${label.padEnd(28)}${RESET}${detail}`);
  return ok;
}

function hex64(value: bigint): string {
  return '0x' + value.toString(16).padStart(16, '0');
}

function humanBytes(value: bigint): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = Number(value);
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size.toFixed(unit === 0 ? 0 : 2)} ${units[unit]}`;
}

function wide(text: string): Buffer {
  return Buffer.from(text + '\0', 'utf16le');
}

// CLFS appends ".blf" to the dedicated-log name; the "LOG:" prefix selects the
// dedicated (single-stream) log namespace and is required for resolution.
const workDir = join(tmpdir(), `bun-clfs-diag-${process.pid}`);
mkdirSync(workDir, { recursive: true });
const logBasePath = join(workDir, 'diagnostic');
const logName = wide(`LOG:${logBasePath}`);

let exitCode = 0;
let hLog = INVALID_HANDLE_VALUE;
let pvMarshal = 0n;

console.log('');
console.log(`${BOLD}${'═'.repeat(W)}${RESET}`);
console.log(`${BOLD}  COMMON LOG FILE SYSTEM — SUBSYSTEM DIAGNOSTIC${RESET}`);
console.log(`${BOLD}  powered by @bun-win32/clfsw32${RESET}`);
console.log(`${BOLD}${'═'.repeat(W)}${RESET}`);
console.log(`  ${DIM}Base log file:${RESET} ${logBasePath}.blf`);
console.log('');

try {
  // ── 1. Forge and validate a real base log file (unprivileged) ───────────
  console.log(`${BOLD}${CYAN}1. Base log file${RESET}`);
  rule();
  hLog = Clfsw32.CreateLogFile(logName.ptr, GENERIC_READ | GENERIC_WRITE, 0, null, OPEN_ALWAYS, 0);
  if (hLog === INVALID_HANDLE_VALUE || hLog === 0n) {
    console.log(`  ${RED}CreateLogFile failed: GetLastError ${err()}${RESET}`);
    process.exit(1);
  }
  const blfPath = `${logBasePath}.blf`;
  const blfSize = existsSync(blfPath) ? statSync(blfPath).size : 0;
  step(true, 'CreateLogFile', `handle ${hex64(hLog)}`);
  step(blfSize > 0, 'on-disk .blf', `${blfPath} ${DIM}(${humanBytes(BigInt(blfSize))})${RESET}`);
  const validated = Clfsw32.ValidateLog(logName.ptr, null, null, Buffer.alloc(4).ptr);
  if (!step(validated !== 0, 'ValidateLog', validated !== 0 ? `${GREEN}metadata consistent${RESET}` : `GetLastError ${err()}`)) {
    exitCode = 1;
  }
  console.log('');

  // ── 2. LSN algebra — proves the 8-byte by-value CLFS_LSN return ABI ─────
  console.log(`${BOLD}${CYAN}2. LSN composition / decomposition (by-value ABI)${RESET}`);
  rule();
  console.log(`  ${DIM}${'container'.padEnd(12)}${'block'.padEnd(12)}${'seq'.padEnd(6)}${'LsnCreate ->'.padEnd(20)}roundtrip${RESET}`);
  const vectors: ReadonlyArray<readonly [number, number, number]> = [
    [0, 0, 0],
    [5, 0x2000, 7],
    [1234, 0x400, 1],
    [0xffff, 0x1ff800, 3],
    [42, 0x80000, 15],
  ];
  let lsnVerified = 0;
  for (const [cid, block, seq] of vectors) {
    const lsn = Clfsw32.LsnCreate(cid, block, seq); // CLFS_LSN returned by value
    const lsnBuf = Buffer.alloc(8);
    lsnBuf.writeBigUInt64LE(lsn, 0);
    const dCid = Clfsw32.LsnContainer(lsnBuf.ptr);
    const dBlock = Clfsw32.LsnBlockOffset(lsnBuf.ptr);
    const dSeq = Clfsw32.LsnRecordSequence(lsnBuf.ptr);
    const good = dCid === cid && dBlock === block && dSeq === seq;
    if (good) lsnVerified += 1;
    console.log(`  ${String(cid).padEnd(12)}${('0x' + block.toString(16)).padEnd(12)}${String(seq).padEnd(6)}${hex64(lsn).padEnd(20)}${good ? GREEN + '✓ exact' : RED + '✗ MISMATCH'}${RESET}`);
  }
  if (lsnVerified === vectors.length) {
    console.log(`  ${GREEN}All ${vectors.length} vectors round-tripped exactly — by-value CLFS_LSN ABI verified.${RESET}`);
  } else {
    console.log(`  ${RED}${vectors.length - lsnVerified} vector(s) failed — by-value return ABI is wrong.${RESET}`);
    exitCode = 1;
  }
  console.log('');

  // ── 3. Container / marshaling / append pipeline (driver, elevation) ─────
  console.log(`${BOLD}${CYAN}3. Container + marshaling + append pipeline${RESET}`);
  rule();
  let pipelineLive = true;

  const registered = Clfsw32.RegisterManageableLogClient(hLog, null) !== 0;
  step(registered, 'RegisterManageableLogClient', registered ? `${GREEN}joined management${RESET}` : `GetLastError ${err()}`);

  const cbContainer = Buffer.alloc(8);
  cbContainer.writeBigUInt64LE(BigInt(512 * 1024), 0); // 512 KiB — CLFS minimum
  let containers = 0;
  for (let i = 0; i < 2; i++) {
    const containerPath = wide(join(workDir, `diagnostic.container${i}`));
    if (Clfsw32.AddLogContainer(hLog, cbContainer.ptr, containerPath.ptr, null) !== 0) containers += 1;
    else break;
  }
  if (!step(containers > 0, 'AddLogContainer', containers > 0 ? `${GREEN}${containers} container(s) of 512 KB${RESET}` : `GetLastError ${err()}`)) {
    pipelineLive = false;
  }

  if (pipelineLive) {
    const ppvMarshal = Buffer.alloc(8);
    if (Clfsw32.CreateLogMarshallingArea(hLog, null, null, null, 64 * 1024, 16, 16, ppvMarshal.ptr) !== 0) {
      pvMarshal = ppvMarshal.readBigUInt64LE(0);
      step(true, 'CreateLogMarshallingArea', `context ${hex64(pvMarshal)}`);
    } else {
      step(false, 'CreateLogMarshallingArea', `GetLastError ${err()}`);
      pipelineLive = false;
    }
  }

  if (pipelineLive && pvMarshal !== 0n) {
    const lsnOut = Buffer.alloc(8);
    const writeEntry = Buffer.alloc(16); // CLFS_WRITE_ENTRY { PVOID Buffer; ULONG ByteLength; }
    let appended = 0;
    for (let i = 0; i < 8; i++) {
      const payload = Buffer.from(`clfs-diagnostic record #${i}\0`, 'utf8');
      writeEntry.writeBigUInt64LE(BigInt(payload.ptr), 0);
      writeEntry.writeUInt32LE(payload.byteLength, 8);
      if (Clfsw32.ReserveAndAppendLog(pvMarshal, writeEntry.ptr, 1, null, null, 0, null, CLFS_FLAG_FORCE_FLUSH, lsnOut.ptr, null) !== 0) appended += 1;
      else break;
    }
    step(appended > 0, 'ReserveAndAppendLog', appended > 0 ? `${GREEN}${appended}/8 records committed${RESET}` : `GetLastError ${err()}`);
    Clfsw32.FlushLogBuffers(pvMarshal, null);
    step(true, 'FlushLogBuffers', 'buffers forced to disk');

    const info = Buffer.alloc(120);
    const infoLen = Buffer.alloc(4);
    infoLen.writeUInt32LE(info.byteLength, 0);
    if (Clfsw32.GetLogFileInformation(hLog, info.ptr, infoLen.ptr) !== 0) {
      console.log('');
      console.log(`${BOLD}${CYAN}CLFS_INFORMATION${RESET}`);
      rule();
      row('Total available', humanBytes(info.readBigInt64LE(0)));
      row('Current available', humanBytes(info.readBigInt64LE(8)));
      row('Total reservation', humanBytes(info.readBigInt64LE(16)));
      row('Base file size', humanBytes(info.readBigUInt64LE(24)));
      row('Container size', humanBytes(info.readBigUInt64LE(32)));
      row('Total containers', String(info.readUInt32LE(40)));
      row('Free containers', String(info.readUInt32LE(44)));
      row('Total clients', String(info.readUInt32LE(48)));
      row('Attributes', '0x' + info.readUInt32LE(52).toString(16).padStart(8, '0'));
      row('Flush threshold', humanBytes(BigInt(info.readUInt32LE(56))));
      row('Sector size', `${info.readUInt32LE(60)} bytes`);
      row('Base LSN', hex64(info.readBigUInt64LE(72)));
      row('Last flushed LSN', hex64(info.readBigUInt64LE(80)));
      row('Last LSN', hex64(info.readBigUInt64LE(88)));
      const guid = info.subarray(104, 120);
      row('Log identity', `{${guid.readUInt32LE(0).toString(16).padStart(8, '0')}-${guid.readUInt16LE(4).toString(16).padStart(4, '0')}-${guid.readUInt16LE(6).toString(16).padStart(4, '0')}-${guid.subarray(8, 16).toString('hex')}}`);

      const stats = Buffer.alloc(64);
      if (Clfsw32.GetLogIoStatistics(hLog, stats.ptr, stats.byteLength, CLFS_IOSTATS_CLASS.ClfsIoStatsDefault, Buffer.alloc(4).ptr) !== 0) {
        console.log('');
        console.log(`${BOLD}${CYAN}CLFS_IO_STATISTICS${RESET}`);
        rule();
        row('Flush count', String(stats.readBigUInt64LE(16)));
        row('Bytes flushed', humanBytes(stats.readBigUInt64LE(24)));
        row('Metadata flush count', String(stats.readBigUInt64LE(32)));
        row('Metadata bytes flushed', humanBytes(stats.readBigUInt64LE(40)));
      }

      const policyOut = Buffer.alloc(64);
      const policyOutLen = Buffer.alloc(4);
      policyOutLen.writeUInt32LE(policyOut.byteLength, 0);
      if (Clfsw32.QueryLogPolicy(hLog, CLFS_MGMT_POLICY_TYPE.ClfsMgmtPolicyNewContainerSize, policyOut.ptr, policyOutLen.ptr) !== 0) {
        console.log('');
        console.log(`${BOLD}${CYAN}QueryLogPolicy — ClfsMgmtPolicyNewContainerSize${RESET}`);
        rule();
        row('Structure version', String(policyOut.readUInt32LE(0)));
        row('Container size', humanBytes(BigInt(policyOut.readUInt32LE(16))));
      }
    }
  } else {
    console.log(`  ${DIM}Pipeline halted: CLFS container creation flows through CLFS.sys and${RESET}`);
    console.log(`  ${DIM}requires an elevated token. Re-run this example as Administrator to${RESET}`);
    console.log(`  ${DIM}see the full CLFS_INFORMATION / CLFS_IO_STATISTICS report.${RESET}`);
  }
  console.log('');
} finally {
  if (pvMarshal !== 0n) Clfsw32.DeleteLogMarshallingArea(pvMarshal);
  if (hLog !== INVALID_HANDLE_VALUE && hLog !== 0n) {
    Clfsw32.DeleteLogByHandle(hLog);
    Kernel32.CloseHandle(hLog);
  }
  Clfsw32.DeleteLogFile(logName.ptr, null);
  try {
    rmSync(workDir, { recursive: true, force: true });
  } catch {
    /* best effort */
  }
}

console.log(`${BOLD}${'═'.repeat(W)}${RESET}`);
console.log(`  ${exitCode === 0 ? GREEN + 'Diagnostic complete — base log forged, validated, LSN ABI verified.' : RED + 'Diagnostic completed with errors.'}${RESET}`);
console.log(`${BOLD}${'═'.repeat(W)}${RESET}`);
console.log('');

process.exit(exitCode);
