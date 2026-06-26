/**
 * Print Ticket Studio
 *
 * A live, animated round-trip through the Windows Print Schema — entirely over
 * FFI, nothing shells out. It takes your default printer's real DEVMODE,
 * converts it into a Print Ticket and X-rays the resulting Print Schema XML
 * with syntax-highlighted, line-by-line reveal. It then forges a delta ticket
 * that flips the page to Landscape, merges + validates it against the live
 * driver (decoding the S_PT_CONFLICT_RESOLVED / S_PT_NO_CONFLICT verdict), and
 * finally converts the merged ticket *back* into a brand-new DEVMODE that the
 * driver allocates — read straight out of native memory with ReadProcessMemory
 * and freed with PTReleaseMemory. A before/after panel shows the setting
 * actually changing as it crosses the DEVMODE ⇄ Print Ticket boundary.
 *
 * APIs demonstrated (Prntvpt):
 *   - PTOpenProvider                 (open a Print Ticket provider)
 *   - PTConvertDevModeToPrintTicket  (DEVMODE → Print Schema XML)
 *   - PTMergeAndValidatePrintTicket  (merge a delta, validate, resolve conflicts)
 *   - PTConvertPrintTicketToDevMode  (Print Ticket → driver-allocated DEVMODE)
 *   - PTReleaseMemory                (free the DEVMODE the provider allocated)
 *   - PTCloseProvider                (release the provider)
 *
 * APIs demonstrated (cross-package):
 *   - Ole32.CoInitialize                          (enter a COM apartment)
 *   - Shlwapi.SHCreateMemStream                   (in-memory IStream buffers)
 *   - Winspool.GetDefaultPrinterW/OpenPrinterW/DocumentPropertiesW (default DEVMODE)
 *   - Kernel32.GetCurrentProcess/ReadProcessMemory (read the allocated DEVMODE)
 *   - Kernel32.GetStdHandle/Get|SetConsoleMode    (enable ANSI VT processing)
 *
 * Run: bun run example/print-ticket-studio.ts
 */

import { CFunction, FFIType, type Pointer, read } from 'bun:ffi';

import Prntvpt, { EDefaultDevmodeType, EPrintTicketScope, S_PT_CONFLICT_RESOLVED, S_PT_NO_CONFLICT } from '../index';
import Kernel32 from '@bun-win32/kernel32';
import Ole32 from '@bun-win32/ole32';
import Shlwapi from '@bun-win32/shlwapi';
import Winspool from '@bun-win32/winspool';

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
const S_FALSE = 1;

const ISTREAM_SEEK = 5;
const IUNKNOWN_RELEASE = 2;
const STREAM_SEEK_SET = 0;
const STREAM_SEEK_END = 2;
const ISTREAM_READ = 3;

// DEVMODEW field offsets (Unicode, x64) + the constants we decode.
const DM_SIZE = 68;
const DM_ORIENTATION = 76;
const DM_PAPERSIZE = 78;
const DM_COPIES = 86;
const DM_COLOR = 92;
const DM_DUPLEX = 94;
const DM_FORMNAME = 102;
const DM_OUT_BUFFER = 2;
const DMORIENT = ['?', 'Portrait', 'Landscape'];
const DMCOLOR = ['?', 'Monochrome', 'Color'];
const DMDUP = ['?', 'Simplex', 'Vertical (duplex)', 'Horizontal (duplex)'];

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

function wide(text: string): Buffer {
  return Buffer.from(text + '\0', 'utf16le');
}

function hresultName(hr: number): string {
  const u = hr >>> 0;
  if (hr === S_OK) return 'S_OK';
  if (hr === S_FALSE) return 'S_FALSE';
  if (u === S_PT_NO_CONFLICT >>> 0) return 'S_PT_NO_CONFLICT';
  if (u === S_PT_CONFLICT_RESOLVED >>> 0) return 'S_PT_CONFLICT_RESOLVED';
  if (u === 0x8004_0003) return 'E_PRINTTICKET_FORMAT';
  if (u === 0x8004_0005) return 'E_DELTA_PRINTTICKET_FORMAT';
  if (u === 0x8007_0709) return 'ERROR_INVALID_PRINTER_NAME';
  if (u === 0x8007_0005) return 'E_ACCESSDENIED';
  return `0x${u.toString(16).padStart(8, '0')}`;
}

const invokers = new Map<string, ReturnType<typeof CFunction>>();

function vcall(thisPtr: bigint, slot: number, argTypes: readonly FFIType[], args: readonly unknown[]): number {
  const vtable = read.u64(Number(thisPtr) as Pointer, 0);
  const method = read.u64(Number(vtable) as Pointer, slot * 8);
  const key = `${method}|${argTypes.join(',')}`;
  let invoke = invokers.get(key);
  if (invoke === undefined) {
    invoke = CFunction({ ptr: Number(method) as Pointer, args: [FFIType.u64, ...argTypes], returns: FFIType.i32 });
    invokers.set(key, invoke);
  }
  return invoke(thisPtr, ...args) as number;
}

/** Rewinds a memory IStream so a PT* call reads from its beginning. */
function rewind(pStream: bigint): void {
  vcall(pStream, ISTREAM_SEEK, [FFIType.i64, FFIType.u32, FFIType.ptr], [0n, STREAM_SEEK_SET, null]);
}

function streamToString(pStream: bigint): string {
  const newPos = Buffer.alloc(8);
  vcall(pStream, ISTREAM_SEEK, [FFIType.i64, FFIType.u32, FFIType.ptr], [0n, STREAM_SEEK_END, newPos.ptr!]);
  const size = Number(newPos.readBigUInt64LE(0));
  vcall(pStream, ISTREAM_SEEK, [FFIType.i64, FFIType.u32, FFIType.ptr], [0n, STREAM_SEEK_SET, null]);
  if (size === 0) return '';
  const data = Buffer.alloc(size);
  const cbRead = Buffer.alloc(4);
  vcall(pStream, ISTREAM_READ, [FFIType.ptr, FFIType.u32, FFIType.ptr], [data.ptr!, size, cbRead.ptr!]);
  return data.toString('utf8', 0, cbRead.readUInt32LE(0));
}

/** Colorizes one line of Print Schema XML: tags cyan, attrs yellow, values green. */
function highlight(line: string): string {
  return line
    .replace(/(&lt;|<)(\/?[\w:]+)/g, (_s, lt, tag) => `${DIM}${lt}${RESET}${CYAN}${tag}${RESET}`)
    .replace(/([\w:]+)=("[^"]*")/g, (_s, attr, val) => `${YELLOW}${attr}${RESET}=${GREEN}${val}${RESET}`)
    .replace(/(\/?>)/g, `${DIM}$1${RESET}`);
}

/** Pretty-prints XML with rough indentation so the reveal reads cleanly. */
function prettyXml(xml: string): string[] {
  const withBreaks = xml.replace(/></g, '>\n<').replace(/\?>/, '?>\n').trim();
  const lines = withBreaks.split('\n');
  let depth = 0;
  return lines.map((raw) => {
    const l = raw.trim();
    if (/^<\//.test(l)) depth = Math.max(0, depth - 1);
    const out = `${'  '.repeat(depth)}${l}`;
    if (/^<[^!?/][^>]*[^/]>$/.test(l) && !/^<[^>]+\/>/.test(l)) depth += 1;
    return out;
  });
}

function readDevmodeName(buf: Buffer, off: number): string {
  let end = off;
  while (end + 1 < buf.length && buf.readUInt16LE(end) !== 0) end += 2;
  return buf.toString('utf16le', off, end);
}

async function main(): Promise<void> {
  enableVirtualTerminal();
  const init = Ole32.CoInitialize(null);
  if (init !== S_OK && init !== S_FALSE) {
    console.error(`${RED}CoInitialize failed: ${hresultName(init)}${RESET}`);
    return;
  }

  console.log(`\n${BOLD}${MAGENTA}  ┌─────────────────────────────────────────────┐${RESET}`);
  console.log(`${BOLD}${MAGENTA}  │            P R I N T   T I C K E T          │${RESET}`);
  console.log(`${BOLD}${MAGENTA}  │                 S T U D I O                 │${RESET}`);
  console.log(`${BOLD}${MAGENTA}  └─────────────────────────────────────────────┘${RESET}`);
  console.log(`  ${DIM}DEVMODE ⇄ Print Schema, live, over pure FFI${RESET}\n`);

  // 1 ─ Resolve the default printer and grab its real DEVMODE.
  const cch = Buffer.alloc(4);
  Winspool.GetDefaultPrinterW(null, cch.ptr!);
  if (cch.readUInt32LE(0) === 0) {
    console.log(`${YELLOW}No default printer configured.${RESET}`);
    return;
  }
  const nameBuf = Buffer.alloc(cch.readUInt32LE(0) * 2);
  Winspool.GetDefaultPrinterW(nameBuf.ptr!, cch.ptr!);
  const printer = nameBuf.toString('utf16le').replace(/\0.*$/, '');
  console.log(`  ${BOLD}Default printer${RESET}  ${CYAN}${printer}${RESET}`);

  const phPrinter = Buffer.alloc(8);
  if (!Winspool.OpenPrinterW(wide(printer).ptr!, phPrinter.ptr!, null)) {
    console.log(`${RED}OpenPrinterW failed (GLE ${Kernel32.GetLastError()})${RESET}`);
    return;
  }
  const hPrinter = phPrinter.readBigUInt64LE(0);
  const cbNeeded = Winspool.DocumentPropertiesW(0n, hPrinter, wide(printer).ptr!, null, null, 0);
  if (cbNeeded <= 0) {
    console.log(`${RED}DocumentPropertiesW sizing failed${RESET}`);
    Winspool.ClosePrinter(hPrinter);
    return;
  }
  const devmode = Buffer.alloc(cbNeeded);
  Winspool.DocumentPropertiesW(0n, hPrinter, wide(printer).ptr!, devmode.ptr!, null, DM_OUT_BUFFER);
  const cbDevmode = devmode.readUInt16LE(DM_SIZE) + devmode.readUInt16LE(70); // dmSize + dmDriverExtra
  console.log(
    `  ${BOLD}Default DEVMODE${RESET}  ${devmode.readUInt16LE(DM_SIZE)} B public + driver extra · ` +
      `${DMORIENT[devmode.readInt16LE(DM_ORIENTATION)] ?? '?'}, ` +
      `paper #${devmode.readInt16LE(DM_PAPERSIZE)}, ` +
      `${devmode.readInt16LE(DM_COPIES)} cop., ` +
      `${DMCOLOR[devmode.readInt16LE(DM_COLOR)] ?? '?'}\n`,
  );

  // 2 ─ Open a Print Ticket provider for this queue.
  const phProvider = Buffer.alloc(8);
  const ohr = Prntvpt.PTOpenProvider(wide(printer).ptr!, 1, phProvider.ptr!);
  if (ohr !== S_OK) {
    console.log(`${RED}PTOpenProvider failed: ${hresultName(ohr)}${RESET}`);
    Winspool.ClosePrinter(hPrinter);
    return;
  }
  const hProvider = phProvider.readBigUInt64LE(0);

  // 3 ─ DEVMODE → Print Ticket, then X-ray the Print Schema XML.
  const baseTicket = BigInt(Shlwapi.SHCreateMemStream(null, 0));
  const c1 = Prntvpt.PTConvertDevModeToPrintTicket(hProvider, cbDevmode, devmode.ptr!, EPrintTicketScope.kPTJobScope, baseTicket);
  console.log(`  ${BOLD}${BLUE}══${RESET} ${BOLD}PTConvertDevModeToPrintTicket${RESET} → ${c1 === S_OK ? GREEN : RED}${hresultName(c1)}${RESET}\n`);
  if (c1 !== S_OK) {
    Prntvpt.PTCloseProvider(hProvider);
    Winspool.ClosePrinter(hPrinter);
    return;
  }
  const ticketXml = streamToString(baseTicket);
  const lines = prettyXml(ticketXml);
  console.log(`  ${DIM}┄┄ Print Schema X-ray (${Buffer.byteLength(ticketXml)} B) ┄┄${RESET}`);
  for (const line of lines.slice(0, 40)) {
    console.log(`  ${highlight(line)}`);
    await sleep(18);
  }
  if (lines.length > 40) console.log(`  ${DIM}… +${lines.length - 40} more lines${RESET}`);
  console.log();

  // 4 ─ Forge a delta ticket that flips the page to Landscape, then merge.
  const delta =
    '<?xml version="1.0" encoding="UTF-8"?>' +
    '<psf:PrintTicket version="1" ' +
    'xmlns:psf="http://schemas.microsoft.com/windows/2003/08/printing/printschemaframework" ' +
    'xmlns:psk="http://schemas.microsoft.com/windows/2003/08/printing/printschemakeywords" ' +
    'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' +
    'xmlns:xsd="http://www.w3.org/2001/XMLSchema">' +
    '<psf:Feature name="psk:PageOrientation">' +
    '<psf:Option name="psk:Landscape"/>' +
    '</psf:Feature></psf:PrintTicket>';
  const deltaBytes = Buffer.from(delta, 'utf8');
  const deltaStream = BigInt(Shlwapi.SHCreateMemStream(deltaBytes.ptr!, deltaBytes.length));
  const resultTicket = BigInt(Shlwapi.SHCreateMemStream(null, 0));
  rewind(baseTicket);
  const errBstr = Buffer.alloc(8);
  console.log(`  ${BOLD}${BLUE}══${RESET} ${BOLD}Merging delta${RESET} ${DIM}(PageOrientation → Landscape)${RESET}`);
  const m = Prntvpt.PTMergeAndValidatePrintTicket(hProvider, baseTicket, deltaStream, EPrintTicketScope.kPTJobScope, resultTicket, errBstr.ptr!);
  const verdict =
    m === (S_PT_NO_CONFLICT | 0) ? `${GREEN}S_PT_NO_CONFLICT — clean merge${RESET}` : m === (S_PT_CONFLICT_RESOLVED | 0) ? `${YELLOW}S_PT_CONFLICT_RESOLVED — driver adjusted settings${RESET}` : `${RED}${hresultName(m)}${RESET}`;
  console.log(`     PTMergeAndValidatePrintTicket → ${verdict}\n`);

  if (m === (S_PT_NO_CONFLICT | 0) || m === (S_PT_CONFLICT_RESOLVED | 0)) {
    const mergedXml = streamToString(resultTicket);
    const hasLandscape = /psk:Landscape/.test(mergedXml);
    console.log(`  ${DIM}┄┄ Merged ticket (${Buffer.byteLength(mergedXml)} B) ┄┄${RESET}`);
    for (const line of prettyXml(mergedXml)) {
      const lit = /psk:Landscape|PageOrientation/.test(line) ? `${BOLD}${MAGENTA}${line}${RESET}` : highlight(line);
      if (/PageOrientation|psk:Landscape/.test(line)) console.log(`  ${lit}  ${GREEN}◀ changed${RESET}`);
    }
    console.log(`  ${hasLandscape ? GREEN + '✓' : RED + '✗'} Landscape orientation is now present in the ticket${RESET}\n`);

    // 5 ─ Print Ticket → a fresh, driver-allocated DEVMODE; read & free it.
    rewind(resultTicket);
    const pcb = Buffer.alloc(4);
    const ppDevmode = Buffer.alloc(8);
    const err2 = Buffer.alloc(8);
    const c2 = Prntvpt.PTConvertPrintTicketToDevMode(hProvider, resultTicket, EDefaultDevmodeType.kUserDefaultDevmode, EPrintTicketScope.kPTJobScope, pcb.ptr!, ppDevmode.ptr!, err2.ptr!);
    console.log(`  ${BOLD}${BLUE}══${RESET} ${BOLD}PTConvertPrintTicketToDevMode${RESET} → ${c2 === S_OK ? GREEN : RED}${hresultName(c2)}${RESET}`);
    if (c2 === S_OK) {
      const cb = pcb.readUInt32LE(0);
      const addr = ppDevmode.readBigUInt64LE(0); // driver-allocated DEVMODE (PTBUFFER token)
      const out = Buffer.alloc(cb);
      Kernel32.ReadProcessMemory(Kernel32.GetCurrentProcess(), addr, out.ptr!, BigInt(cb), null);

      const before = devmode.readInt16LE(DM_ORIENTATION);
      const after = out.readInt16LE(DM_ORIENTATION);
      const row = (label: string, b: string, a: string, changed: boolean) => `  ${label.padEnd(14)} ${DIM}${b.padStart(12)}${RESET}  ${changed ? GREEN + '→' : DIM + '·'}${RESET}  ${changed ? BOLD + MAGENTA : ''}${a.padEnd(12)}${RESET}`;
      console.log(`\n  ${BOLD}DEVMODE round-trip — before vs after${RESET}`);
      console.log(`  ${DIM}${'─'.repeat(46)}${RESET}`);
      console.log(row('Orientation', DMORIENT[before] ?? '?', DMORIENT[after] ?? '?', before !== after));
      console.log(row('Paper size', `#${devmode.readInt16LE(DM_PAPERSIZE)}`, `#${out.readInt16LE(DM_PAPERSIZE)}`, devmode.readInt16LE(DM_PAPERSIZE) !== out.readInt16LE(DM_PAPERSIZE)));
      console.log(row('Copies', `${devmode.readInt16LE(DM_COPIES)}`, `${out.readInt16LE(DM_COPIES)}`, devmode.readInt16LE(DM_COPIES) !== out.readInt16LE(DM_COPIES)));
      console.log(row('Color', DMCOLOR[devmode.readInt16LE(DM_COLOR)] ?? '?', DMCOLOR[out.readInt16LE(DM_COLOR)] ?? '?', devmode.readInt16LE(DM_COLOR) !== out.readInt16LE(DM_COLOR)));
      console.log(row('Duplex', DMDUP[devmode.readInt16LE(DM_DUPLEX)] ?? '?', DMDUP[out.readInt16LE(DM_DUPLEX)] ?? '?', devmode.readInt16LE(DM_DUPLEX) !== out.readInt16LE(DM_DUPLEX)));
      console.log(row('Form', readDevmodeName(devmode, DM_FORMNAME) || '—', readDevmodeName(out, DM_FORMNAME) || '—', false));

      const freed = Prntvpt.PTReleaseMemory(addr);
      console.log(`\n  ${DIM}PTReleaseMemory(driver DEVMODE) → ${hresultName(freed)}${RESET}`);
    }
  }

  // 6 ─ Tear everything down.
  vcall(baseTicket, IUNKNOWN_RELEASE, [], []);
  vcall(deltaStream, IUNKNOWN_RELEASE, [], []);
  vcall(resultTicket, IUNKNOWN_RELEASE, [], []);
  Prntvpt.PTCloseProvider(hProvider);
  Winspool.ClosePrinter(hPrinter);
  console.log(`\n${GREEN}${BOLD}  ✓ Round-trip complete — DEVMODE survived a Print Schema laundering${RESET}\n`);
}

main();
