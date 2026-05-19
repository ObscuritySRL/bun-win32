/**
 * Write-Ahead Log Cartographer
 *
 * A live, animated terminal map of a Common Log File System write-ahead log.
 * It forges a real on-disk .blf base log file, validates its kernel metadata,
 * then streams thousands of synthetic transactions across a simulated container
 * grid. The catch: every single log-sequence-number on screen is computed by
 * clfsw32.dll itself — LsnCreate composes each record's real 64-bit LSN, and
 * LsnContainer / LsnBlockOffset / LsnRecordSequence decode it back live for the
 * HUD. The "log tape" lights up block-by-block, containers recycle as the tail
 * advances, and a throughput sparkline tracks commit rate. Pure FFI, zero
 * native dependencies — the Windows kernel's own log address arithmetic,
 * animated in your terminal.
 *
 * APIs demonstrated (Clfsw32):
 *   - CreateLogFile        (forge the real on-disk .blf backing store)
 *   - ValidateLog          (validate the log's on-disk metadata)
 *   - LsnCreate            (compose each record's real LSN, by value)
 *   - LsnContainer         (decode the container id from a live LSN)
 *   - LsnBlockOffset       (decode the block offset from a live LSN)
 *   - LsnRecordSequence    (decode the record sequence from a live LSN)
 *   - AddLogContainer      (attempt the durable-commit finale)
 *   - DeleteLogByHandle    (mark the forged log for deletion)
 *   - DeleteLogFile        (delete the base log file)
 *
 * APIs demonstrated (Kernel32, cross-package):
 *   - GetStdHandle         (obtain the console output handle)
 *   - GetConsoleMode       (read the console mode)
 *   - SetConsoleMode       (enable ANSI/VT escape processing)
 *   - GetLastError         (decode the durable-commit status)
 *   - CloseHandle          (release the log handle)
 *
 * Run: bun run example/transaction-ledger.ts
 */
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import Kernel32 from '@bun-win32/kernel32';

import Clfsw32, { GENERIC_READ, GENERIC_WRITE, INVALID_HANDLE_VALUE, OPEN_ALWAYS } from '../index';

Clfsw32.Preload(['CreateLogFile', 'ValidateLog', 'LsnCreate', 'LsnContainer', 'LsnBlockOffset', 'LsnRecordSequence', 'AddLogContainer', 'DeleteLogByHandle', 'DeleteLogFile']);
Kernel32.Preload(['GetStdHandle', 'GetConsoleMode', 'SetConsoleMode', 'GetLastError', 'CloseHandle']);

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const HIDE = '\x1b[?25l';
const SHOW = '\x1b[?25h';

function fg(r: number, g: number, b: number): string {
  return `\x1b[38;2;${r};${g};${b}m`;
}

function wide(text: string): Buffer {
  return Buffer.from(text + '\0', 'utf16le');
}

// Enable ANSI/VT processing on the console output handle (no-op in pipes).
const STD_OUTPUT_HANDLE = 0xfffffff5; // (DWORD)-11
const hStdout = Kernel32.GetStdHandle(STD_OUTPUT_HANDLE);
const modeBuf = Buffer.alloc(4);
if (Kernel32.GetConsoleMode(hStdout, modeBuf.ptr)) {
  Kernel32.SetConsoleMode(hStdout, modeBuf.readUInt32LE(0) | 0x0004); // ENABLE_VIRTUAL_TERMINAL_PROCESSING
}

const CONTAINERS = 10; // grid columns
const BLOCKS = 14; // grid rows (blocks per container in the active region)
const RECORDS_PER_BLOCK = 4; // records before a block rolls over
const SECTOR = 512; // block offset granularity (bytes)
const REGION = CONTAINERS * BLOCKS * RECORDS_PER_BLOCK; // active log region capacity
const PASSES = 4; // times the tail advances and the region recycles
const TOTAL_RECORDS = REGION * PASSES;
const RECORDS_PER_FRAME = 10;

// heat[c][b] = how many records have landed in container c, block b
const heat: number[][] = Array.from({ length: CONTAINERS }, () => new Array<number>(BLOCKS).fill(0));
const throughput: number[] = [];
const SPARK = '▁▂▃▄▅▆▇█';

let exitCode = 0;
let hLog = INVALID_HANDLE_VALUE;

// ── Forge the real on-disk backing store ──────────────────────────────────
const workDir = join(tmpdir(), `bun-clfs-ledger-${process.pid}`);
mkdirSync(workDir, { recursive: true });
const logBasePath = join(workDir, 'ledger');
const logName = wide(`LOG:${logBasePath}`);

process.stdout.write('\x1b[2J\x1b[H' + HIDE);

try {
  hLog = Clfsw32.CreateLogFile(logName.ptr, GENERIC_READ | GENERIC_WRITE, 0, null, OPEN_ALWAYS, 0);
  const forged = hLog !== INVALID_HANDLE_VALUE && hLog !== 0n;
  const validated = forged && Clfsw32.ValidateLog(logName.ptr, null, null, Buffer.alloc(4).ptr) !== 0;
  const blfReady = forged && existsSync(`${logBasePath}.blf`);

  const lsnBuf = Buffer.alloc(8);
  let committed = 0;
  let recycles = 0;
  let lastLsn = 0n;
  let dCid = 0;
  let dBlock = 0;
  let dSeq = 0;
  let lsnOk = true;

  function paint(): void {
    const lines: string[] = [];
    lines.push(`${BOLD}  WRITE-AHEAD LOG CARTOGRAPHER  ${DIM}— LSNs computed live by clfsw32.dll${RESET}`);
    lines.push('');
    // Grid: one column per container, one row per block.
    for (let b = 0; b < BLOCKS; b++) {
      let line = '   ';
      for (let c = 0; c < CONTAINERS; c++) {
        const h = heat[c][b];
        if (h === 0) {
          line += DIM + ' ·' + RESET;
        } else {
          const t = h / RECORDS_PER_BLOCK;
          const r = Math.round(40 + 215 * Math.min(1, t));
          const g = Math.round(220 - 150 * Math.min(1, t));
          line += fg(r, g, 90) + ' █' + RESET;
        }
      }
      lines.push(line);
    }
    lines.push('');
    const pct = ((committed / TOTAL_RECORDS) * 100).toFixed(1);
    const spark = throughput
      .slice(-32)
      .map((v) => SPARK[Math.max(0, Math.min(7, v - 1))])
      .join('');
    lines.push(`  ${BOLD}committed${RESET} ${committed.toString().padStart(5)} / ${TOTAL_RECORDS}  ${DIM}(${pct}%)${RESET}   ${BOLD}tail recycles${RESET} ${recycles}`);
    lines.push(`  ${BOLD}live LSN ${RESET} ${fg(120, 220, 255)}0x${lastLsn.toString(16).padStart(16, '0')}${RESET}`);
    lines.push(
      `  ${BOLD}decoded  ${RESET} container ${fg(120, 255, 160)}${dCid}${RESET}  block ${fg(120, 255, 160)}0x${dBlock.toString(16)}${RESET}  seq ${fg(120, 255, 160)}${dSeq}${RESET}  ${lsnOk ? fg(120, 255, 160) + '✓ kernel round-trip' : '\x1b[91m✗ mismatch'}${RESET}`,
    );
    lines.push(`  ${BOLD}commit/s ${RESET} ${fg(255, 200, 90)}${spark || ' '}${RESET}`);
    lines.push('');
    lines.push(`  ${DIM}backing store${RESET}  ${blfReady ? fg(120, 255, 160) + '●' + RESET : '\x1b[91m○' + RESET} real .blf forged   ${validated ? fg(120, 255, 160) + '●' + RESET : '\x1b[91m○' + RESET} ValidateLog: metadata consistent`);
    process.stdout.write('\x1b[H' + lines.join('\x1b[K\n') + '\x1b[K');
  }

  // ── Stream the transaction log across the container grid ────────────────
  for (let i = 0; i < TOTAL_RECORDS; i += RECORDS_PER_FRAME) {
    const burst = Math.min(RECORDS_PER_FRAME, TOTAL_RECORDS - i);
    for (let k = 0; k < burst; k++) {
      const n = i + k;
      if (n > 0 && n % REGION === 0) {
        recycles += 1;
        for (const col of heat) col.fill(0); // tail advanced — active region recycled
      }
      const m = n % REGION; // position within the active region
      const containerId = Math.floor(m / (BLOCKS * RECORDS_PER_BLOCK)) % CONTAINERS;
      const blockIndex = Math.floor(m / RECORDS_PER_BLOCK) % BLOCKS;
      const recordSeq = m % RECORDS_PER_BLOCK;
      const blockOffset = blockIndex * SECTOR;

      // The real Windows kernel composes this record's 64-bit LSN.
      const lsn = Clfsw32.LsnCreate(containerId, blockOffset, recordSeq);
      lsnBuf.writeBigUInt64LE(lsn, 0);
      dCid = Clfsw32.LsnContainer(lsnBuf.ptr);
      dBlock = Clfsw32.LsnBlockOffset(lsnBuf.ptr);
      dSeq = Clfsw32.LsnRecordSequence(lsnBuf.ptr);
      lsnOk = dCid === containerId && dBlock === blockOffset && dSeq === recordSeq;
      lastLsn = lsn;

      heat[containerId][blockIndex] += 1;
      committed += 1;
    }
    throughput.push(burst);
    paint();
    await Bun.sleep(22);
  }

  paint();
  process.stdout.write('\n\n');

  // ── Durable-commit finale (flows through CLFS.sys; needs elevation) ─────
  const cb = Buffer.alloc(8);
  cb.writeBigUInt64LE(BigInt(512 * 1024), 0);
  const containerPath = wide(join(workDir, 'ledger.container0'));
  const durable = Clfsw32.AddLogContainer(hLog, cb.ptr, containerPath.ptr, null) !== 0;
  if (durable) {
    process.stdout.write(`  ${fg(120, 255, 160)}● durable commit path live${RESET} — running elevated; CLFS.sys accepted the container.\n`);
  } else {
    const code = Kernel32.GetLastError();
    process.stdout.write(`  ${DIM}○ durable commit path: AddLogContainer → GetLastError ${code}${code === 5 ? ' (ERROR_ACCESS_DENIED — re-run elevated to durably persist)' : ''}.${RESET}\n`);
    process.stdout.write(`  ${DIM}  The map above is real regardless: every LSN was computed by clfsw32.dll.${RESET}\n`);
  }
  if (!lsnOk) exitCode = 1;
} finally {
  process.stdout.write(SHOW);
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

process.stdout.write('\n');
process.exit(exitCode);
