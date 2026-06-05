/**
 * Firmware Inventory — the machine's TRUE hardware identity, straight from firmware.
 *
 * There is no Win32 "give me the CPU model" call. The only authoritative source is
 * the raw SMBIOS (DMI) blob the BIOS hands to the OS. This reads that blob byte-for-byte
 * via GetSystemFirmwareTable('RSMB'), then hand-parses the SMBIOS structure stream the
 * way the spec defines it — walking variable-length structures, decoding the trailing
 * NUL-terminated string table with 1-based index references, and stopping at the Type 127
 * end-of-table marker. It decodes the headline structures:
 *
 *   Type 0  (BIOS)            -> vendor, version, release date
 *   Type 1  (System)          -> manufacturer, product, serial, 16-byte UUID
 *   Type 2  (Baseboard)       -> manufacturer, product (the motherboard model)
 *   Type 4  (Processor)       -> socket, manufacturer, model string, max speed (MHz)
 *   Type 17 (Memory Device)   -> per-DIMM size, speed, locator, manufacturer
 *
 * It then calls EnumSystemFirmwareTables('ACPI') to list every ACPI table the platform
 * publishes (FACP, APIC, DMAR, HPET, TPM2, ...) by their raw 4-character signatures.
 *
 * This is a thing you "can't do in TypeScript": parsing the platform's firmware tables
 * is normally the domain of dmidecode / WMIC / the kernel. Here it's pure Bun FFI +
 * DataView, and every value printed is the literal contents of this machine's firmware.
 *
 * Native pipeline:
 *   GetSystemFirmwareTable(RSMB,0,probe,0) -> required byte count (size-probe)
 *   GetSystemFirmwareTable(RSMB,0,buf,n)   -> RawSMBIOSData (8-byte header + table stream)
 *   walk SMBIOS structures, decode string tables, render
 *   EnumSystemFirmwareTables(ACPI,...)     -> array of 4-char DWORD table tags
 *
 * APIs: Kernel32.GetSystemFirmwareTable, Kernel32.EnumSystemFirmwareTables,
 *       Kernel32.GetStdHandle, Kernel32.GetConsoleMode, Kernel32.SetConsoleMode.
 *
 * Run: bun run packages/all/example/firmware-inventory.ts
 */
import { ptr } from 'bun:ffi';
import { Kernel32 } from '../index';
import { STD_HANDLE, ConsoleMode } from '@bun-win32/kernel32';

// ---- ANSI / truecolor console UI ------------------------------------------------------

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';

function fg(r: number, g: number, b: number): string {
  return `\x1b[38;2;${r};${g};${b}m`;
}

const C_FRAME = fg(80, 90, 120);
const C_TITLE = fg(120, 220, 255);
const C_LABEL = fg(150, 160, 185);
const C_VALUE = fg(235, 240, 250);
const C_ACCENT = fg(255, 200, 90);
const C_GOOD = fg(120, 230, 150);
const C_TAG = fg(180, 160, 255);

const W = 78;
const HR = '═'.repeat(W - 2);

function visibleLen(s: string): number {
  return s.replace(/\x1b\[[0-9;]*m/g, '').length;
}
function boxTop(): string {
  return `${C_FRAME}╔${HR}╗${RESET}`;
}
function boxBottom(): string {
  return `${C_FRAME}╚${HR}╝${RESET}`;
}
function boxSep(): string {
  return `${C_FRAME}╠${HR}╣${RESET}`;
}
function boxLine(content: string): string {
  const pad = W - 2 - visibleLen(content) - 1;
  return `${C_FRAME}║${RESET} ${content}${' '.repeat(Math.max(0, pad))}${C_FRAME}║${RESET}`;
}
function boxTitle(title: string): string {
  return boxLine(`${C_TITLE}${BOLD}${title}${RESET}`);
}
function boxRow(label: string, value: string): string {
  const lbl = `${C_LABEL}${label}${RESET}`;
  const padded = label.padEnd(18);
  return boxLine(`  ${C_LABEL}${padded}${RESET} ${C_VALUE}${value}${RESET}`);
}

function enableVT(): void {
  const hStdout = Kernel32.GetStdHandle(STD_HANDLE.OUTPUT);
  const modeBuf = new ArrayBuffer(4);
  if (Kernel32.GetConsoleMode(hStdout, ptr(modeBuf))) {
    const mode = new DataView(modeBuf).getUint32(0, true);
    Kernel32.SetConsoleMode(hStdout, mode | ConsoleMode.ENABLE_VIRTUAL_TERMINAL_PROCESSING);
  }
}

// ---- SMBIOS structure-stream parser ---------------------------------------------------

interface SmbiosStructure {
  type: number;
  length: number;
  handle: number;
  /** offset into the blob where the formatted (fixed) area begins */
  formattedOffset: number;
  /** the NUL-terminated string table that trails this structure (1-based when referenced) */
  strings: string[];
}

interface SmbiosBlob {
  major: number;
  minor: number;
  structures: SmbiosStructure[];
}

function readSmbios(): SmbiosBlob | null {
  const RSMB = 0x52534d42; // 'RSMB'
  // Size-probe: a BufferSize of 0 makes the call return only the required byte count.
  // The binding types the buffer pointer as non-null, so pass a 1-byte probe buffer.
  const probe = new ArrayBuffer(1);
  const need = Kernel32.GetSystemFirmwareTable(RSMB, 0, ptr(probe), 0);
  if (need === 0) return null;

  const buf = new ArrayBuffer(need);
  const got = Kernel32.GetSystemFirmwareTable(RSMB, 0, ptr(buf), need);
  if (got === 0 || got > need) return null;

  const dv = new DataView(buf);
  const bytes = new Uint8Array(buf);
  const major = dv.getUint8(1);
  const minor = dv.getUint8(2);

  const structures: SmbiosStructure[] = [];
  let off = 8; // RawSMBIOSData header is 8 bytes; the table stream starts here

  while (off + 4 <= buf.byteLength) {
    const type = dv.getUint8(off);
    const length = dv.getUint8(off + 1);
    const handle = dv.getUint16(off + 2, true);
    if (length < 4) break; // malformed; structures are at least the 4-byte header

    // Decode the trailing string table: NUL-terminated ASCII strings starting at
    // off+length, terminated by a double-NUL (an empty string-set is one extra NUL).
    const strings: string[] = [];
    let p = off + length;
    let cur = '';
    while (p < buf.byteLength) {
      const c = bytes[p] ?? 0;
      if (c === 0) {
        if (cur.length === 0) {
          // empty string here means we hit the terminating double-NUL
          break;
        }
        strings.push(cur);
        cur = '';
        if ((bytes[p + 1] ?? 0) === 0) {
          p++;
          break;
        }
      } else {
        cur += String.fromCharCode(c);
      }
      p++;
    }

    structures.push({ type, length, handle, formattedOffset: off, strings });

    if (type === 127) break; // end-of-table marker

    // Advance past the formatted area and the entire string table to the next structure.
    let scan = off + length;
    while (scan + 1 < buf.byteLength && !((bytes[scan] ?? 1) === 0 && (bytes[scan + 1] ?? 1) === 0)) {
      scan++;
    }
    off = scan + 2;
  }

  // Publish the blob's DataView so the field decoders below can read formatted-area
  // bytes by absolute offset without threading the view through every call.
  parseContext.dv = dv;
  parseContext.byteLength = buf.byteLength;
  return { major, minor, structures };
}

// A tiny module-local context so field decoders can read the formatted area by offset
// without threading the DataView through every call. Populated immediately by readSmbios().
const parseContext: { dv: DataView | null; byteLength: number } = { dv: null, byteLength: 0 };

function strRef(s: SmbiosStructure, fieldOffset: number): string {
  const dv = parseContext.dv;
  if (!dv) return 'Not specified';
  const abs = s.formattedOffset + fieldOffset;
  if (abs >= s.formattedOffset + s.length) return 'Not specified';
  const idx = dv.getUint8(abs);
  if (idx === 0) return 'Not specified';
  const v = s.strings[idx - 1];
  return v && v.trim().length > 0 ? v : 'Not specified';
}

function hasField(s: SmbiosStructure, fieldOffset: number, size: number): boolean {
  return s.length >= fieldOffset + size;
}

function u8(s: SmbiosStructure, fieldOffset: number): number {
  const dv = parseContext.dv;
  if (!dv || !hasField(s, fieldOffset, 1)) return 0;
  return dv.getUint8(s.formattedOffset + fieldOffset);
}
function u16(s: SmbiosStructure, fieldOffset: number): number {
  const dv = parseContext.dv;
  if (!dv || !hasField(s, fieldOffset, 2)) return 0;
  return dv.getUint16(s.formattedOffset + fieldOffset, true);
}
function u32(s: SmbiosStructure, fieldOffset: number): number {
  const dv = parseContext.dv;
  if (!dv || !hasField(s, fieldOffset, 4)) return 0;
  return dv.getUint32(s.formattedOffset + fieldOffset, true);
}

/** SMBIOS Type 1 UUID: first three fields are little-endian, last two big-endian. */
function decodeUuid(s: SmbiosStructure): string {
  const dv = parseContext.dv;
  if (!dv || !hasField(s, 8, 16)) return 'Not present';
  const b: number[] = [];
  for (let i = 0; i < 16; i++) b.push(dv.getUint8(s.formattedOffset + 8 + i));
  // All-FF / all-00 means the firmware did not populate a UUID.
  const allSame = (v: number): boolean => b.every((x) => x === v);
  if (allSame(0x00) || allSame(0xff)) return 'Not present';
  const hex = (n: number): string => n.toString(16).padStart(2, '0');
  const le = (i0: number, i1: number, i2: number, i3: number): string => hex(b[i3]!) + hex(b[i2]!) + hex(b[i1]!) + hex(b[i0]!);
  const f1 = le(0, 1, 2, 3);
  const f2 = hex(b[5]!) + hex(b[4]!);
  const f3 = hex(b[7]!) + hex(b[6]!);
  const f4 = hex(b[8]!) + hex(b[9]!);
  const f5 = b.slice(10, 16).map(hex).join('');
  return `${f1}-${f2}-${f3}-${f4}-${f5}`.toUpperCase();
}

interface MemModule {
  locator: string;
  manufacturer: string;
  sizeMB: number; // 0 means empty slot
  speed: number; // MT/s, 0 unknown
}

function decodeMemory(s: SmbiosStructure): MemModule {
  // Type 17: Size u16 @0x0C. 0 = empty. 0x7FFF = use extended Size u32 @0x1C (mask 0x7FFFFFFF).
  // Bit 15 of the 16-bit size selects KB (1) vs MB (0).
  let sizeMB = 0;
  const rawSize = u16(s, 0x0c);
  if (rawSize !== 0) {
    if (rawSize === 0x7fff) {
      sizeMB = u32(s, 0x1c) & 0x7fffffff;
    } else if (rawSize & 0x8000) {
      sizeMB = Math.round((rawSize & 0x7fff) / 1024); // value is in KB
    } else {
      sizeMB = rawSize; // value is in MB
    }
  }
  return {
    locator: strRef(s, 0x10),
    manufacturer: strRef(s, 0x17),
    sizeMB,
    speed: u16(s, 0x15),
  };
}

function formatMemSize(mb: number): string {
  if (mb === 0) return '(empty)';
  if (mb >= 1024 && mb % 1024 === 0) return `${mb / 1024} GB`;
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${mb} MB`;
}

// ---- ACPI table inventory -------------------------------------------------------------

function readAcpiTags(): string[] {
  const ACPI = 0x41435049; // 'ACPI'
  const probe = new ArrayBuffer(1);
  const need = Kernel32.EnumSystemFirmwareTables(ACPI, ptr(probe), 0);
  if (need === 0) return [];
  const buf = new ArrayBuffer(need);
  const got = Kernel32.EnumSystemFirmwareTables(ACPI, ptr(buf), need);
  if (got === 0) return [];
  const bytes = new Uint8Array(buf, 0, Math.min(got, need));
  const tags: string[] = [];
  for (let i = 0; i + 4 <= bytes.length; i += 4) {
    let tag = '';
    for (let j = 0; j < 4; j++) {
      const c = bytes[i + j] ?? 0;
      tag += c >= 32 && c < 127 ? String.fromCharCode(c) : '.';
    }
    tags.push(tag);
  }
  return tags;
}

// ---- Main -----------------------------------------------------------------------------

function main(): void {
  enableVT();
  Kernel32.Preload(['GetSystemFirmwareTable', 'EnumSystemFirmwareTables']);

  const blob = readSmbios();
  const lines: string[] = [];

  lines.push(boxTop());
  lines.push(boxLine(`${C_TITLE}${BOLD}        FIRMWARE INVENTORY${RESET}${DIM}  —  this machine's hardware identity, from the BIOS${RESET}`));
  lines.push(boxLine(`${DIM}        SMBIOS via Kernel32.GetSystemFirmwareTable('RSMB'), parsed by hand${RESET}`));

  if (!blob || blob.structures.length === 0) {
    // Graceful degradation: virtualized / locked-down platforms may expose no SMBIOS.
    lines.push(boxSep());
    lines.push(boxLine(`${C_ACCENT}No SMBIOS firmware table is available on this system.${RESET}`));
    lines.push(boxLine(`${DIM}This is expected on some virtual machines and hardened platforms.${RESET}`));
    lines.push(boxBottom());
    console.log(lines.join('\n'));
    return;
  }

  const byType = (t: number): SmbiosStructure[] => blob.structures.filter((s) => s.type === t);
  const first = (t: number): SmbiosStructure | undefined => byType(t)[0];

  lines.push(boxSep());
  lines.push(boxTitle('SMBIOS'));
  lines.push(boxRow('Spec version:', `${blob.major}.${blob.minor}`));
  lines.push(boxRow('Structures:', `${C_GOOD}${blob.structures.length}${RESET}${C_VALUE} parsed from the structure stream`));

  const bios = first(0);
  if (bios) {
    lines.push(boxSep());
    lines.push(boxTitle('BIOS  (Type 0)'));
    lines.push(boxRow('Vendor:', strRef(bios, 0x04)));
    lines.push(boxRow('Version:', strRef(bios, 0x05)));
    lines.push(boxRow('Release date:', strRef(bios, 0x08)));
  }

  const sys = first(1);
  if (sys) {
    lines.push(boxSep());
    lines.push(boxTitle('SYSTEM  (Type 1)'));
    lines.push(boxRow('Manufacturer:', strRef(sys, 0x04)));
    lines.push(boxRow('Product:', strRef(sys, 0x05)));
    lines.push(boxRow('Serial:', strRef(sys, 0x07)));
    lines.push(boxRow('UUID:', `${C_ACCENT}${decodeUuid(sys)}${RESET}`));
  }

  const board = first(2);
  if (board) {
    lines.push(boxSep());
    lines.push(boxTitle('BASEBOARD  (Type 2)'));
    lines.push(boxRow('Manufacturer:', strRef(board, 0x04)));
    lines.push(boxRow('Model:', `${C_ACCENT}${strRef(board, 0x05)}${RESET}`));
  }

  const cpus = byType(4);
  if (cpus.length > 0) {
    lines.push(boxSep());
    lines.push(boxTitle(`PROCESSOR  (Type 4)${cpus.length > 1 ? ` — ${cpus.length} sockets` : ''}`));
    for (const cpu of cpus) {
      lines.push(boxRow('Model:', `${C_ACCENT}${strRef(cpu, 0x10)}${RESET}`));
      lines.push(boxRow('Manufacturer:', strRef(cpu, 0x07)));
      lines.push(boxRow('Socket:', strRef(cpu, 0x04)));
      const maxSpeed = u16(cpu, 0x16);
      lines.push(boxRow('Max speed:', maxSpeed > 0 ? `${maxSpeed} MHz` : 'Unknown'));
    }
  }

  const dimms = byType(17);
  if (dimms.length > 0) {
    const modules = dimms.map(decodeMemory);
    const populated = modules.filter((m) => m.sizeMB > 0);
    const totalMB = populated.reduce((acc, m) => acc + m.sizeMB, 0);
    lines.push(boxSep());
    lines.push(boxTitle(`MEMORY  (Type 17) — ${populated.length}/${modules.length} slots populated, ${formatMemSize(totalMB)} total`));
    for (const m of modules) {
      if (m.sizeMB === 0) {
        lines.push(boxRow(m.locator, `${DIM}(empty)${RESET}`));
      } else {
        const speed = m.speed > 0 ? `${m.speed} MT/s` : 'speed unknown';
        lines.push(boxRow(m.locator, `${C_GOOD}${formatMemSize(m.sizeMB)}${RESET}${C_VALUE} @ ${speed}  ${DIM}(${m.manufacturer})${RESET}`));
      }
    }
  }

  // ACPI table inventory — proves the firmware-table API beyond just RSMB.
  const acpi = readAcpiTags();
  lines.push(boxSep());
  lines.push(boxTitle(`ACPI TABLES  (${acpi.length} published)`));
  if (acpi.length === 0) {
    lines.push(boxRow('', `${DIM}none enumerated${RESET}`));
  } else {
    // Pack the 4-char tags into rows.
    const perRow = 12;
    for (let i = 0; i < acpi.length; i += perRow) {
      const chunk = acpi.slice(i, i + perRow).map((t) => `${C_TAG}${t}${RESET}`);
      lines.push(boxLine(`  ${chunk.join(`${DIM} ${RESET}`)}`));
    }
  }

  lines.push(boxBottom());
  console.log(lines.join('\n'));
}

main();
