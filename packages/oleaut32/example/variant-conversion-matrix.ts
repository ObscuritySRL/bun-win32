/**
 * Variant Conversion Matrix
 *
 * Renders a live, color-coded grid showing the result of converting a single
 * source value through every Var-From-X-To-Y route that OLE Automation exposes.
 * Each cell shows the converted value (or the HRESULT if conversion fails),
 * so you can watch the lattice of representable types light up as the source
 * cycles through I4, R8, BSTR, CY, DEC, and DATE.
 *
 * APIs demonstrated (Oleaut32):
 *   - SysAllocStringLen / SysStringByteLen / SysFreeString
 *                                  (BSTR allocation, sizing, and lifetime)
 *   - VarI4FromR8, VarI4FromStr, VarI4FromCy, VarI4FromDec
 *                                  (typed conversion routes into I4)
 *   - VarR8FromI4, VarR8FromStr, VarR8FromCy, VarR8FromDec
 *                                  (typed conversion routes into R8)
 *   - VarBstrFromI4, VarBstrFromR8, VarBstrFromCy, VarBstrFromDec
 *                                  (BSTR formatters)
 *   - VarCyFromI4 / VarCyFromR8 / VarCyFromStr
 *                                  (currency materializers)
 *   - VarDecFromR8 / VarDecFromStr / VarBstrFromDec
 *                                  (decimal materializers and printer)
 *   - VarDateFromStr               (date parser)
 *
 * Run: bun run example/variant-conversion-matrix.ts
 */

import { read, toArrayBuffer, type Pointer } from 'bun:ffi';

import Oleaut32 from '../index';

Oleaut32.Preload([
  'SysFreeString',
  'SysStringByteLen',
  'VarBstrFromCy',
  'VarBstrFromDec',
  'VarBstrFromI4',
  'VarBstrFromR8',
  'VarCyFromI4',
  'VarCyFromR8',
  'VarCyFromStr',
  'VarDateFromStr',
  'VarDecFromR8',
  'VarDecFromStr',
  'VarI4FromR8',
  'VarI4FromStr',
  'VarR8FromI4',
  'VarR8FromStr',
]);

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const CYAN = '\x1b[96m';
const MAGENTA = '\x1b[95m';
const GREEN = '\x1b[92m';
const YELLOW = '\x1b[93m';
const RED = '\x1b[91m';
const BLUE = '\x1b[94m';
const WHITE = '\x1b[97m';
const HIDE_CURSOR = '\x1b[?25l';
const SHOW_CURSOR = '\x1b[?25h';

const LCID_INVARIANT = 0x007f;

// Decode a BSTR pointer back to a JavaScript string. BSTR points at the first
// OLECHAR of UTF-16LE text. SysStringByteLen returns the size in bytes.
function readBstr(bstr: Pointer): string {
  const byteLen = Oleaut32.SysStringByteLen(bstr);
  if (byteLen === 0) return '""';
  const decoded = Buffer.from(toArrayBuffer(bstr, 0, byteLen)).toString('utf16le');
  return JSON.stringify(decoded);
}

// Decode a DECIMAL by printing it through VarBstrFromDec, then freeing the BSTR.
function decimalToString(decBuf: Buffer): string {
  const pbstrOut = Buffer.alloc(8);
  const hr = Oleaut32.VarBstrFromDec(decBuf.ptr!, LCID_INVARIANT, 0, pbstrOut.ptr!);
  if (hr !== 0) return `HRESULT 0x${(hr >>> 0).toString(16)}`;
  const bstr = read.ptr(pbstrOut.ptr!, 0) as Pointer;
  const s = readBstr(bstr).replace(/^"|"$/g, '');
  Oleaut32.SysFreeString(bstr);
  return s;
}

interface CellResult {
  ok: boolean;
  v: string;
  c: string;
  hr?: number;
}

function err(hr: number): CellResult {
  return { ok: false, v: `0x${(hr >>> 0).toString(16).padStart(8, '0')}`, c: RED, hr };
}

// ── Conversion routines: each returns a printable CellResult ───────────────

function fromI4(value: number, dst: 'I4' | 'R8' | 'BSTR' | 'CY' | 'DEC'): CellResult {
  switch (dst) {
    case 'I4':
      return { ok: true, v: value.toString(), c: CYAN };
    case 'R8': {
      const out = Buffer.alloc(8);
      const hr = Oleaut32.VarR8FromI4(value, out.ptr!);
      return hr !== 0 ? err(hr) : { ok: true, v: out.readDoubleLE(0).toString(), c: GREEN };
    }
    case 'BSTR': {
      const outBstr = Buffer.alloc(8);
      const hr = Oleaut32.VarBstrFromI4(value, LCID_INVARIANT, 0, outBstr.ptr!);
      if (hr !== 0) return err(hr);
      const bstr = read.ptr(outBstr.ptr!, 0) as Pointer;
      const s = readBstr(bstr);
      Oleaut32.SysFreeString(bstr);
      return { ok: true, v: s, c: YELLOW };
    }
    case 'CY': {
      const out = Buffer.alloc(8);
      const hr = Oleaut32.VarCyFromI4(value, out.ptr!);
      if (hr !== 0) return err(hr);
      // CY is fixed-point with 4 implied decimal places (10000 units = 1.0)
      const cy = out.readBigInt64LE(0);
      return { ok: true, v: (Number(cy) / 10000).toFixed(4), c: MAGENTA };
    }
    case 'DEC': {
      // No direct VarDecFromI4 — convert via R8 first
      const tmpR8 = Buffer.alloc(8);
      Oleaut32.VarR8FromI4(value, tmpR8.ptr!);
      const dec = Buffer.alloc(16);
      const hr = Oleaut32.VarDecFromR8(tmpR8.readDoubleLE(0), dec.ptr!);
      return hr !== 0 ? err(hr) : { ok: true, v: decimalToString(dec), c: BLUE };
    }
  }
}

function fromR8(value: number, dst: 'I4' | 'R8' | 'BSTR' | 'CY' | 'DEC'): CellResult {
  switch (dst) {
    case 'R8':
      return { ok: true, v: value.toString(), c: GREEN };
    case 'I4': {
      const out = Buffer.alloc(4);
      const hr = Oleaut32.VarI4FromR8(value, out.ptr!);
      return hr !== 0 ? err(hr) : { ok: true, v: out.readInt32LE(0).toString(), c: CYAN };
    }
    case 'BSTR': {
      const outBstr = Buffer.alloc(8);
      const hr = Oleaut32.VarBstrFromR8(value, LCID_INVARIANT, 0, outBstr.ptr!);
      if (hr !== 0) return err(hr);
      const bstr = read.ptr(outBstr.ptr!, 0) as Pointer;
      const s = readBstr(bstr);
      Oleaut32.SysFreeString(bstr);
      return { ok: true, v: s, c: YELLOW };
    }
    case 'CY': {
      const out = Buffer.alloc(8);
      const hr = Oleaut32.VarCyFromR8(value, out.ptr!);
      if (hr !== 0) return err(hr);
      const cy = out.readBigInt64LE(0);
      return { ok: true, v: (Number(cy) / 10000).toFixed(4), c: MAGENTA };
    }
    case 'DEC': {
      const dec = Buffer.alloc(16);
      const hr = Oleaut32.VarDecFromR8(value, dec.ptr!);
      return hr !== 0 ? err(hr) : { ok: true, v: decimalToString(dec), c: BLUE };
    }
  }
}

function fromStr(text: string, dst: 'I4' | 'R8' | 'BSTR' | 'CY' | 'DEC' | 'DATE'): CellResult {
  const wide = Buffer.from(text + '\0', 'utf16le');
  switch (dst) {
    case 'BSTR':
      return { ok: true, v: JSON.stringify(text), c: YELLOW };
    case 'I4': {
      const out = Buffer.alloc(4);
      const hr = Oleaut32.VarI4FromStr(wide.ptr!, LCID_INVARIANT, 0, out.ptr!);
      return hr !== 0 ? err(hr) : { ok: true, v: out.readInt32LE(0).toString(), c: CYAN };
    }
    case 'R8': {
      const out = Buffer.alloc(8);
      const hr = Oleaut32.VarR8FromStr(wide.ptr!, LCID_INVARIANT, 0, out.ptr!);
      return hr !== 0 ? err(hr) : { ok: true, v: out.readDoubleLE(0).toString(), c: GREEN };
    }
    case 'CY': {
      const out = Buffer.alloc(8);
      const hr = Oleaut32.VarCyFromStr(wide.ptr!, LCID_INVARIANT, 0, out.ptr!);
      if (hr !== 0) return err(hr);
      const cy = out.readBigInt64LE(0);
      return { ok: true, v: (Number(cy) / 10000).toFixed(4), c: MAGENTA };
    }
    case 'DEC': {
      const dec = Buffer.alloc(16);
      const hr = Oleaut32.VarDecFromStr(wide.ptr!, LCID_INVARIANT, 0, dec.ptr!);
      return hr !== 0 ? err(hr) : { ok: true, v: decimalToString(dec), c: BLUE };
    }
    case 'DATE': {
      const out = Buffer.alloc(8);
      const hr = Oleaut32.VarDateFromStr(wide.ptr!, LCID_INVARIANT, 0, out.ptr!);
      if (hr !== 0) return err(hr);
      const date = out.readDoubleLE(0);
      // VARIANT DATE is days since 1899-12-30
      const jsDate = new Date(Date.UTC(1899, 11, 30) + date * 86400000);
      return { ok: true, v: jsDate.toISOString().slice(0, 10), c: MAGENTA };
    }
  }
}

// ── Animation: cycle through a series of source values ────────────────────

interface SourceFrame {
  label: string;
  kind: 'I4' | 'R8' | 'STR';
  i4?: number;
  r8?: number;
  str?: string;
}

const frames: SourceFrame[] = [
  { label: 'I4 ⇒ 42', kind: 'I4', i4: 42 },
  { label: 'I4 ⇒ -2147483648', kind: 'I4', i4: -2147483648 },
  { label: 'R8 ⇒ 3.14159265358979', kind: 'R8', r8: 3.14159265358979 },
  { label: 'R8 ⇒ 1.0e20  (overflows I4 and CY)', kind: 'R8', r8: 1e20 },
  { label: 'STR ⇒ "1234.5678"', kind: 'STR', str: '1234.5678' },
  { label: 'STR ⇒ "$1,234.56"', kind: 'STR', str: '$1,234.56' },
  { label: 'STR ⇒ "2026-05-13"', kind: 'STR', str: '2026-05-13' },
  { label: 'STR ⇒ "not a number"', kind: 'STR', str: 'not a number' },
];

const COL_WIDTH = 22;
const COLS: Array<'I4' | 'R8' | 'BSTR' | 'CY' | 'DEC' | 'DATE'> = ['I4', 'R8', 'BSTR', 'CY', 'DEC', 'DATE'];

function fmtCell(label: string, result: CellResult, width: number): string {
  const value = result.v;
  const trimmed = value.length > width - 4 ? value.substring(0, width - 5) + '…' : value;
  const padded = trimmed.padEnd(width - 4, ' ');
  return `${result.c}${BOLD}${padded}${RESET} ${DIM}${label.padEnd(3)}${RESET}`;
}

function renderFrame(frame: SourceFrame): string[] {
  const lines: string[] = [];
  const header = COLS.map((c) => `${BOLD}${WHITE}${c.padEnd(COL_WIDTH - 4)}${RESET}    `).join('');
  lines.push('  ' + header);
  lines.push('  ' + DIM + '─'.repeat(COLS.length * COL_WIDTH) + RESET);

  const row: string[] = [];
  for (const dst of COLS) {
    let result: CellResult;
    if (frame.kind === 'I4' && dst !== 'DATE') {
      result = fromI4(frame.i4!, dst);
    } else if (frame.kind === 'R8' && dst !== 'DATE') {
      result = fromR8(frame.r8!, dst);
    } else if (frame.kind === 'STR') {
      result = fromStr(frame.str!, dst);
    } else {
      result = err(0x80020005); // DISP_E_TYPEMISMATCH
    }
    row.push(fmtCell(dst.toLowerCase(), result, COL_WIDTH));
  }
  lines.push('  ' + row.join(''));
  lines.push('');
  return lines;
}

async function main(): Promise<void> {
  process.stdout.write(HIDE_CURSOR);
  console.log();
  console.log(`  ${BOLD}${MAGENTA}VARIANT CONVERSION MATRIX${RESET}`);
  console.log(`  ${WHITE}Every supported Var-From-X-To-Y route, fired live through oleaut32.dll${RESET}`);
  console.log();

  try {
    let lastLineCount = 0;
    for (let pass = 0; pass < 2; pass++) {
      for (const frame of frames) {
        // Move cursor up to overwrite previous frame
        if (lastLineCount > 0) process.stdout.write(`\x1b[${lastLineCount}A`);

        const lines = renderFrame(frame);
        const banner = `  ${BOLD}${CYAN}┃${RESET} ${BOLD}${WHITE}${frame.label}${RESET}`;
        process.stdout.write(`\x1b[2K\r${banner}\n`);
        for (const line of lines) {
          process.stdout.write(`\x1b[2K\r${line}\n`);
        }
        lastLineCount = lines.length + 1;
        await new Promise((r) => setTimeout(r, 650));
      }
    }

    console.log(`  ${DIM}Color key:${RESET}  ${CYAN}I4${RESET}  ${GREEN}R8${RESET}  ${YELLOW}BSTR${RESET}  ${MAGENTA}CY/DATE${RESET}  ${BLUE}DEC${RESET}  ${RED}HRESULT failure${RESET}`);
    console.log();
  } finally {
    process.stdout.write(SHOW_CURSOR);
  }
}

await main();
