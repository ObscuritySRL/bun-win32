/**
 * tpm-oracle.ts — a truecolor "silicon oracle" that hand-crafts RAW TPM 2.0 command
 * bytes and submits them straight to the hardware Trusted Platform Module via TBS,
 * then parses the wire responses live. No TPM library — just the raw TCG byte protocol.
 *
 * What you cannot do in TypeScript without this: speak the TPM 2.0 wire protocol to
 * real cryptographic silicon. This builds each command buffer by hand (every field
 * BIG-endian per the TCG spec), pushes it through Tbsip_Submit_Command, and decodes
 * the response stream byte-by-byte:
 *   • TPM2_GetRandom    (0x17B) — true hardware entropy straight from the RNG
 *   • TPM2_PCR_Read     (0x17E) — the live SHA-256 boot-attestation PCR banks (0,1,2,3,7)
 *   • TPM2_GetCapability(0x17A) — manufacturer (4 BE-ASCII) + firmware version
 *
 * Native pipeline:
 *   1. Tbsi_Context_Create with TBS_CONTEXT_PARAMS2 { version=2, includeTpm20 } → TBS_HCONTEXT
 *   2. submit(): Tbsip_Submit_Command(hContext, locality 0, priority NORMAL, cmd, resp) ;
 *      verify TBS_SUCCESS, then the 10-byte TPM response header's responseCode (offset 6, BE)
 *   3. parse the response bodies per their TCG structures and render a live oracle UI
 *   4. Tbsip_Context_Close in finally; cursor restored; ANSI VT enabled via Kernel32
 *
 * APIs: Tbs.Tbsi_Context_Create / Tbsip_Submit_Command / Tbsip_Context_Close ;
 *       Kernel32.GetStdHandle / GetConsoleMode / SetConsoleMode (enable ANSI VT)
 *
 * Graceful: if there is no TPM (TBS_E_TPM_NOT_FOUND) or the service is off, it decodes
 * the TBS error, prints a friendly note, and exits 0. Honors DEMO_DURATION_MS for the
 * animated entropy ticker (default ~6s). ESC / Ctrl-C exit cleanly.
 *
 * Run: bun run packages/all/example/tpm-oracle.ts
 */
import { Tbs } from '../index';
import { Kernel32 } from '../index';
import {
  TBS_COMMAND_LOCALITY_ZERO,
  TBS_COMMAND_PRIORITY_NORMAL,
  TBS_CONTEXT_VERSION_TWO,
  TBS_SUCCESS,
} from '@bun-win32/tbs';

Tbs.Preload(['Tbsi_Context_Create', 'Tbsip_Submit_Command', 'Tbsip_Context_Close']);
Kernel32.Preload(['GetStdHandle', 'GetConsoleMode', 'SetConsoleMode']);

// ── ANSI / VT setup ─────────────────────────────────────────────────────────
const STD_OUTPUT_HANDLE = -11;
const ENABLE_VIRTUAL_TERMINAL_PROCESSING = 0x0004;
const hStdout = Kernel32.GetStdHandle(STD_OUTPUT_HANDLE);
const savedMode = Buffer.alloc(4);
let modeRestored = false;
if (Kernel32.GetConsoleMode(hStdout, savedMode.ptr)) {
  Kernel32.SetConsoleMode(hStdout, savedMode.readUInt32LE(0) | ENABLE_VIRTUAL_TERMINAL_PROCESSING);
}

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const HIDE_CURSOR = '\x1b[?25l';
const SHOW_CURSOR = '\x1b[?25h';
const CLEAR = '\x1b[2J\x1b[H';
const fg = (r: number, g: number, b: number): string => `\x1b[38;2;${r};${g};${b}m`;
const bg = (r: number, g: number, b: number): string => `\x1b[48;2;${r};${g};${b}m`;

const GOLD = fg(235, 200, 110);
const CYAN = fg(120, 205, 255);
const VIOLET = fg(180, 140, 255);
const GREEN = fg(120, 230, 150);
const RED = fg(245, 100, 100);
const GREY = fg(150, 160, 175);
const WHITE = fg(235, 240, 248);

function decodeTbs(code: number): string {
  const map: Record<number, string> = {
    0: 'TBS_SUCCESS',
    [0x80284001]: 'TBS_E_INTERNAL_ERROR',
    [0x80284002]: 'TBS_E_BAD_PARAMETER',
    [0x80284003]: 'TBS_E_INVALID_OUTPUT_POINTER',
    [0x80284004]: 'TBS_E_INVALID_CONTEXT',
    [0x80284005]: 'TBS_E_INSUFFICIENT_BUFFER',
    [0x80284006]: 'TBS_E_IOERROR',
    [0x80284008]: 'TBS_E_SERVICE_NOT_RUNNING',
    [0x8028400f]: 'TBS_E_TPM_NOT_FOUND',
    [0x80284010]: 'TBS_E_SERVICE_DISABLED',
    [0x80284013]: 'TBS_E_DEVICE_NOT_READY',
  };
  return map[code >>> 0] ?? `0x${(code >>> 0).toString(16).toUpperCase()}`;
}

// 4 big-endian ASCII bytes → string (TPM manufacturer / vendor encoding)
function asciiOf(value: number): string {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(value >>> 0, 0);
  return [...b].map((c) => (c >= 0x20 && c < 0x7f ? String.fromCharCode(c) : '')).join('');
}

function box(title: string, lines: string[], color: string): string {
  const inner = lines.reduce((m, l) => Math.max(m, visibleLen(l)), visibleLen(title) + 2);
  const width = Math.min(Math.max(inner + 2, 50), 78);
  const top = `${color}╭─ ${BOLD}${title}${RESET}${color} ${'─'.repeat(Math.max(0, width - visibleLen(title) - 4))}╮${RESET}`;
  const body = lines
    .map((l) => `${color}│${RESET} ${l}${' '.repeat(Math.max(0, width - visibleLen(l) - 2))} ${color}│${RESET}`)
    .join('\n');
  const bot = `${color}╰${'─'.repeat(width)}╯${RESET}`;
  return `${top}\n${body}\n${bot}`;
}

// length of a string ignoring ANSI escape sequences
function visibleLen(s: string): number {
  // eslint-disable-next-line no-control-regex
  return s.replace(/\x1b\[[0-9;?]*[A-Za-z]/g, '').length;
}

// ── State that needs teardown ───────────────────────────────────────────────
let hContext: bigint | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
let exiting = false;

function teardown(code: number): never {
  if (exiting) process.exit(code);
  exiting = true;
  if (timer) clearInterval(timer);
  if (hContext !== null) {
    try {
      Tbs.Tbsip_Context_Close(hContext);
    } catch {
      /* best effort */
    }
    hContext = null;
  }
  process.stdout.write(SHOW_CURSOR + RESET + '\n');
  if (!modeRestored) {
    modeRestored = true;
    Kernel32.SetConsoleMode(hStdout, savedMode.readUInt32LE(0));
  }
  process.exit(code);
}

// ── TPM submit helper: returns the response header rc + the full body ────────
interface TpmResponse {
  rc: number;
  body: Buffer;
}

function submit(cmd: Buffer): TpmResponse | null {
  if (hContext === null) return null;
  const resp = Buffer.alloc(4096);
  const respLen = Buffer.alloc(4);
  respLen.writeUInt32LE(resp.byteLength, 0);
  const r = Tbs.Tbsip_Submit_Command(
    hContext,
    TBS_COMMAND_LOCALITY_ZERO,
    TBS_COMMAND_PRIORITY_NORMAL,
    cmd.ptr,
    cmd.byteLength,
    resp.ptr,
    respLen.ptr,
  );
  if (r !== TBS_SUCCESS) return null;
  // TPM response header: tag u16, responseSize u32, responseCode u32 — all BE
  const size = resp.readUInt32BE(2);
  return { rc: resp.readUInt32BE(6), body: resp.subarray(0, size) };
}

// ── RAW command builders (every field BIG-endian per the TCG TPM 2.0 spec) ───
const TPM_ST_NO_SESSIONS = 0x8001;

function buildGetRandom(bytesRequested: number): Buffer {
  const cmd = Buffer.alloc(12);
  cmd.writeUInt16BE(TPM_ST_NO_SESSIONS, 0);
  cmd.writeUInt32BE(12, 2); // commandSize
  cmd.writeUInt32BE(0x0000017b, 6); // TPM_CC_GetRandom
  cmd.writeUInt16BE(bytesRequested, 10); // UINT16 bytesRequested
  return cmd;
}

function buildGetCapability(): Buffer {
  const cmd = Buffer.alloc(22);
  cmd.writeUInt16BE(TPM_ST_NO_SESSIONS, 0);
  cmd.writeUInt32BE(22, 2);
  cmd.writeUInt32BE(0x0000017a, 6); // TPM_CC_GetCapability
  cmd.writeUInt32BE(0x00000006, 10); // TPM_CAP_TPM_PROPERTIES
  cmd.writeUInt32BE(0x00000100, 14); // PT_FIXED group start property
  cmd.writeUInt32BE(0x40, 18); // propertyCount
  return cmd;
}

function buildPcrRead(): Buffer {
  // 10B header + TPML_PCR_SELECTION { count u32; [ hash u16, sizeofSelect u8, select[3] ] }
  const cmd = Buffer.alloc(20);
  cmd.writeUInt16BE(TPM_ST_NO_SESSIONS, 0);
  cmd.writeUInt32BE(20, 2);
  cmd.writeUInt32BE(0x0000017e, 6); // TPM_CC_PCR_Read
  cmd.writeUInt32BE(1, 10); // TPML_PCR_SELECTION.count = 1 bank
  cmd.writeUInt16BE(0x000b, 14); // TPM_ALG_SHA256
  cmd.writeUInt8(3, 16); // sizeofSelect = 3 bytes (24 PCRs)
  // pcrSelect bitmap, LSB-first per byte: select PCR 0,1,2,3,7 → bits 0,1,2,3,7
  cmd.writeUInt8(0b10001111, 17); // byte0: PCR 0,1,2,3 (+7)
  cmd.writeUInt8(0x00, 18); // byte1: PCR 8..15
  cmd.writeUInt8(0x00, 19); // byte2: PCR 16..23
  return cmd;
}

// ── Open the TBS context ─────────────────────────────────────────────────────
function openContext(): number {
  const params = Buffer.alloc(8); // TBS_CONTEXT_PARAMS2 { version u32; flags u32 }
  params.writeUInt32LE(TBS_CONTEXT_VERSION_TWO, 0);
  params.writeUInt32LE(0b100, 4); // includeTpm20 bit
  const ctxBuf = Buffer.alloc(8);
  const rc = Tbs.Tbsi_Context_Create(params.ptr, ctxBuf.ptr);
  if (rc === TBS_SUCCESS) hContext = ctxBuf.readBigUInt64LE(0);
  return rc;
}

// ── Parsers ─────────────────────────────────────────────────────────────────
function parseCapability(resp: TpmResponse): { manufacturer: string; vendor: string; firmware: string; family: string } | null {
  if (resp.rc !== 0) return null;
  // body: header(10) moreData u8 (@10) capability u32 (@11) count u32 (@15)
  const count = resp.body.readUInt32BE(15);
  const props = new Map<number, number>();
  for (let i = 0; i < count; i++) {
    const off = 19 + i * 8;
    if (off + 8 > resp.body.length) break;
    props.set(resp.body.readUInt32BE(off), resp.body.readUInt32BE(off + 4));
  }
  const vendor = [0x106, 0x107, 0x108, 0x109]
    .map((p) => asciiOf(props.get(p) ?? 0))
    .join('')
    .replace(/\0+/g, '')
    .trim();
  const fw1 = props.get(0x10b) ?? 0;
  const fw2 = props.get(0x10c) ?? 0;
  return {
    manufacturer: asciiOf(props.get(0x105) ?? 0).trim() || '(unknown)',
    vendor: vendor || '(none)',
    firmware: `${(fw1 >>> 16) & 0xffff}.${fw1 & 0xffff}.${(fw2 >>> 16) & 0xffff}.${fw2 & 0xffff}`,
    family: asciiOf(props.get(0x100) ?? 0).trim() || '?',
  };
}

interface PcrEntry {
  index: number;
  digest: string;
}

function parsePcrRead(resp: TpmResponse, selectedPcrs: number[]): { updateCounter: number; entries: PcrEntry[] } | null {
  if (resp.rc !== 0) return null;
  // body: header(10) pcrUpdateCounter u32 (@10)
  let off = 10;
  const updateCounter = resp.body.readUInt32BE(off);
  off += 4;
  // echoed TPML_PCR_SELECTION: count u32, then count*(hash u16, sizeofSelect u8, select[sizeofSelect])
  const selCount = resp.body.readUInt32BE(off);
  off += 4;
  for (let i = 0; i < selCount; i++) {
    off += 2; // hash u16
    const sizeofSelect = resp.body.readUInt8(off);
    off += 1 + sizeofSelect;
  }
  // TPML_DIGEST: count u32, then count*(size u16, digest[size])
  const digestCount = resp.body.readUInt32BE(off);
  off += 4;
  const entries: PcrEntry[] = [];
  for (let i = 0; i < digestCount; i++) {
    if (off + 2 > resp.body.length) break;
    const size = resp.body.readUInt16BE(off);
    off += 2;
    const digest = resp.body.subarray(off, off + size).toString('hex');
    off += size;
    entries.push({ index: selectedPcrs[i] ?? -1, digest });
  }
  return { updateCounter, entries };
}

// PCR meaning labels (TCG PC Client measured-boot conventions)
const PCR_LABELS: Record<number, string> = {
  0: 'CRTM / BIOS / firmware',
  1: 'Host platform config',
  2: 'Option ROM code',
  3: 'Option ROM config',
  7: 'Secure Boot policy',
};

// ── Main ─────────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  process.stdout.write(CLEAR + HIDE_CURSOR);
  const header = `${GOLD}${BOLD}  ◈ THE SILICON ORACLE ◈${RESET}  ${DIM}raw TPM 2.0 wire protocol over TBS${RESET}`;
  console.log(`\n${header}\n`);

  const ccRes = openContext();
  if (ccRes !== TBS_SUCCESS || hContext === null) {
    const friendly =
      (ccRes >>> 0) === 0x8028400f
        ? 'No TPM was found on this machine. This demo needs a TPM 2.0 chip (or Intel/AMD firmware TPM).'
        : (ccRes >>> 0) === 0x80284008 || (ccRes >>> 0) === 0x80284010
          ? 'The TPM Base Services are not running / disabled. Enable the TPM in firmware to run this demo.'
          : 'Could not open a TBS context to the TPM.';
    console.log(box('TPM unavailable', [`${GREY}${friendly}${RESET}`, `${DIM}Tbsi_Context_Create → ${decodeTbs(ccRes)}${RESET}`], RED));
    console.log(`\n${DIM}This is expected on hardware without a TPM — exiting cleanly.${RESET}`);
    teardown(0);
  }
  console.log(`${GREEN}● TBS context open${RESET}  ${DIM}TBS_HCONTEXT 0x${hContext.toString(16)}${RESET}\n`);

  // ── Manufacturer / firmware plaque (TPM2_GetCapability) ────────────────────
  const capResp = submit(buildGetCapability());
  if (capResp) {
    const cap = parseCapability(capResp);
    if (cap) {
      console.log(
        box(
          'ORACLE IDENTITY · TPM2_GetCapability(0x17A)',
          [
            `${GREY}Manufacturer${RESET}   ${WHITE}${BOLD}${cap.manufacturer}${RESET}   ${GREY}Vendor${RESET} ${CYAN}${cap.vendor}${RESET}`,
            `${GREY}Family${RESET}         ${CYAN}TPM ${cap.family}${RESET}    ${GREY}Firmware${RESET} ${CYAN}${cap.firmware}${RESET}`,
          ],
          VIOLET,
        ),
      );
    } else {
      console.log(box('ORACLE IDENTITY', [`${RED}responseCode 0x${capResp.rc.toString(16)}${RESET}`], VIOLET));
    }
  } else {
    console.log(box('ORACLE IDENTITY', [`${RED}command submission failed${RESET}`], VIOLET));
  }
  console.log('');

  // ── PCR bank table (TPM2_PCR_Read) ─────────────────────────────────────────
  const selectedPcrs = [0, 1, 2, 3, 7];
  const pcrResp = submit(buildPcrRead());
  if (pcrResp) {
    const parsed = parsePcrRead(pcrResp, selectedPcrs);
    if (parsed) {
      const rows: string[] = [
        `${DIM}PCR  meaning                    SHA-256 boot measurement${RESET}`,
      ];
      for (const e of parsed.entries) {
        const label = (PCR_LABELS[e.index] ?? '').padEnd(25);
        const idx = String(e.index).padStart(2, '0');
        const half = e.digest.slice(0, 32);
        const tail = e.digest.slice(32);
        rows.push(`${GOLD}${idx}${RESET}   ${GREY}${label}${RESET} ${GREEN}${half}${RESET}`);
        rows.push(`     ${' '.repeat(25)} ${GREEN}${tail}${RESET}`);
      }
      rows.push(`${DIM}pcrUpdateCounter ${parsed.updateCounter} · digests echoed straight off the silicon${RESET}`);
      console.log(box('BOOT ATTESTATION · TPM2_PCR_Read(0x17E) SHA-256 bank', rows, CYAN));
    } else {
      console.log(box('BOOT ATTESTATION', [`${RED}responseCode 0x${pcrResp.rc.toString(16)}${RESET}`], CYAN));
    }
  } else {
    console.log(box('BOOT ATTESTATION', [`${RED}command submission failed${RESET}`], CYAN));
  }
  console.log('');

  // ── Animated true-entropy ticker (TPM2_GetRandom) ──────────────────────────
  const duration = Math.max(1000, Number(process.env.DEMO_DURATION_MS ?? 6000) | 0);
  const start = Date.now();
  let frame = 0;
  let totalBytes = 0;
  const SAVE = '\x1b7'; // DECSC — save cursor position
  const RESTORE = '\x1b8'; // DECRC — restore to saved position
  const ERASE_LINE = '\x1b[2K'; // clear entire line
  process.stdout.write(`${GOLD}╭─ ${BOLD}HARDWARE ENTROPY${RESET}${GOLD} · TPM2_GetRandom(0x17B) live silicon RNG ${'─'.repeat(12)}╮${RESET}\n`);
  process.stdout.write(`${GOLD}│${RESET}\n`);
  process.stdout.write(`${GOLD}│${RESET}\n`);
  process.stdout.write(`${GOLD}╰${'─'.repeat(64)}╯${RESET}\n`);
  // Move cursor up to the top interior line and remember it; we redraw two lines in place.
  process.stdout.write('\x1b[3A');
  process.stdout.write(SAVE);

  await new Promise<void>((resolve) => {
    timer = setInterval(() => {
      const rndResp = submit(buildGetRandom(24));
      let hex = '(rng error)';
      let n = 0;
      if (rndResp && rndResp.rc === 0) {
        n = rndResp.body.readUInt16BE(10);
        hex = rndResp.body.subarray(12, 12 + n).toString('hex');
        totalBytes += n;
      }
      frame++;
      // colorize entropy in nibble-keyed truecolor so it shimmers
      let colored = '';
      for (let i = 0; i < hex.length; i++) {
        const v = parseInt(hex[i] ?? '0', 16);
        const r = 120 + ((v * 9 + frame * 7) % 135);
        const g = 200 - ((v * 5) % 90);
        const b = 140 + ((v * 11 + frame * 13) % 115);
        colored += `${fg(r, g, b)}${hex[i]}`;
      }
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      const line1 = ` ${colored}${RESET}`;
      const line2 = ` ${DIM}draw #${frame}  ·  ${totalBytes} bytes of true entropy  ·  ${elapsed}s${RESET}`;
      process.stdout.write(RESTORE); // jump back to the top interior line
      process.stdout.write(`${ERASE_LINE}${GOLD}│${RESET}${line1}${' '.repeat(Math.max(0, 60 - visibleLen(line1)))}${GOLD}│${RESET}\n`);
      process.stdout.write(`${ERASE_LINE}${GOLD}│${RESET}${line2}${' '.repeat(Math.max(0, 60 - visibleLen(line2)))}${GOLD}│${RESET}`);
      if (Date.now() - start >= duration) {
        if (timer) clearInterval(timer);
        timer = null;
        resolve();
      }
    }, 120);
  });

  // move cursor below the box
  process.stdout.write('\x1b[2B\n');
  console.log(`${GREEN}✔ ${totalBytes} bytes of genuine hardware randomness pulled across ${frame} TPM2_GetRandom calls.${RESET}`);
  console.log(`${DIM}Every byte above is the real TCG wire protocol — hand-built command buffers, parsed responses.${RESET}`);
  teardown(0);
}

// ── Signals ───────────────────────────────────────────────────────────────────
process.on('SIGINT', () => teardown(0));
process.on('SIGTERM', () => teardown(0));
// ESC to quit during the ticker
if (process.stdin.isTTY) {
  process.stdin.setRawMode?.(true);
  process.stdin.resume();
  process.stdin.on('data', (d: Buffer) => {
    if (d.includes(0x1b) || d.includes(0x03)) teardown(0);
  });
}

main().catch((err: unknown) => {
  process.stdout.write(SHOW_CURSOR + RESET);
  console.error(`${RED}Unexpected error: ${String(err)}${RESET}`);
  teardown(1);
});
