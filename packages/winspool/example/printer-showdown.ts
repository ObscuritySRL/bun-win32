/**
 * Printer Showdown - a visual comparison of all local printers.
 *
 * Enumerates local printers using EnumPrintersW at level 2 (PRINTER_INFO_2W)
 * and identifies the default printer with GetDefaultPrinterW. Presents each
 * printer as a contender with name, port, driver, status, and active jobs,
 * crowning the default printer.
 *
 * APIs demonstrated:
 *   - EnumPrintersW (PRINTER_ENUM_LOCAL, level 2)
 *   - GetDefaultPrinterW (double-call pattern for buffer size)
 *
 * Struct layout for PRINTER_INFO_2W on x64 (pointers are 8 bytes):
 *     +0x00  pServerName (ptr, 8)
 *     +0x08  pPrinterName (ptr, 8)
 *     +0x10  pShareName (ptr, 8)
 *     +0x18  pPortName (ptr, 8)
 *     +0x20  pDriverName (ptr, 8)
 *     +0x28  pComment (ptr, 8)
 *     +0x30  pLocation (ptr, 8)
 *     +0x38  pDevMode (ptr, 8)
 *     +0x40  pSepFile (ptr, 8)
 *     +0x48  pPrintProcessor (ptr, 8)
 *     +0x50  pDatatype (ptr, 8)
 *     +0x58  pParameters (ptr, 8)
 *     +0x60  pSecurityDescriptor (ptr, 8)
 *     +0x68  Attributes (DWORD, 4)
 *     +0x6C  (4 pad)
 *     +0x70  Priority (DWORD, 4)
 *     +0x74  DefaultPriority (DWORD, 4)
 *     +0x78  cJobs (DWORD, 4)
 *     +0x7C  Status (DWORD, 4)
 *     +0x80  ... (more fields follow)
 *
 *   Total size per struct: 136 bytes (0x88) on x64
 *
 * Run: bun run example/printer-showdown.ts
 */

import { read, toArrayBuffer, type Pointer } from 'bun:ffi';
import Winspool from '../index';

const PRINTER_ENUM_LOCAL = 2;
const PRINTER_INFO_2_SIZE = 0x88; // 136 bytes on x64

const STATUS_FLAGS: Record<number, string> = {
  0x00000001: 'Paused',
  0x00000002: 'Error',
  0x00000004: 'Pending Deletion',
  0x00000008: 'Paper Jam',
  0x00000010: 'Paper Out',
  0x00000020: 'Manual Feed',
  0x00000040: 'Paper Problem',
  0x00000080: 'Offline',
  0x00000100: 'I/O Active',
  0x00000200: 'Busy',
  0x00000400: 'Printing',
  0x00000800: 'Output Bin Full',
  0x00001000: 'Not Available',
  0x00002000: 'Waiting',
  0x00004000: 'Processing',
  0x00008000: 'Initializing',
  0x00010000: 'Warming Up',
  0x00020000: 'Toner Low',
  0x00040000: 'No Toner',
  0x00080000: 'Page Punt',
  0x00100000: 'User Intervention',
  0x00200000: 'Out of Memory',
  0x00400000: 'Door Open',
  0x00800000: 'Server Unknown',
  0x01000000: 'Power Save',
};

function readPtrString(buf: Buffer, ptrOffset: number): string {
  const low = buf.readUInt32LE(ptrOffset);
  const high = buf.readUInt32LE(ptrOffset + 4);
  if (low === 0 && high === 0) return '(none)';
  const ptr = (BigInt(high) << 32n) | BigInt(low);
  const raw = Buffer.from(toArrayBuffer(Number(ptr) as unknown as Pointer, 0, 512));
  return raw.toString('utf16le').replace(/\0.*$/, '') || '(none)';
}

function decodeStatus(status: number): string {
  if (status === 0) return 'Ready';
  const parts: string[] = [];
  for (const [bit, label] of Object.entries(STATUS_FLAGS)) {
    if (status & Number(bit)) parts.push(label);
  }
  return parts.length > 0 ? parts.join(', ') : `Unknown (0x${status.toString(16)})`;
}

function getDefaultPrinter(): string {
  const sizeBuf = Buffer.alloc(4);
  sizeBuf.writeUInt32LE(0, 0);

  // First call: get required buffer size
  Winspool.GetDefaultPrinterW(null, sizeBuf.ptr);
  const charCount = sizeBuf.readUInt32LE(0);
  if (charCount === 0) return '';

  const nameBuf = Buffer.alloc(charCount * 2);
  const ok = Winspool.GetDefaultPrinterW(nameBuf.ptr, sizeBuf.ptr);
  if (!ok) return '';

  return nameBuf.toString('utf16le').replace(/\0.*$/, '');
}

console.log();
console.log('  \x1b[1;33m\x1b[0m \x1b[1;33mPrinter Showdown\x1b[0m');
console.log('  \x1b[2mWho will be crowned the default?\x1b[0m');
console.log();

const defaultPrinter = getDefaultPrinter();

// Enumerate local printers at level 2 (double-call pattern)
const cbNeeded = Buffer.alloc(4);
const cReturned = Buffer.alloc(4);

Winspool.EnumPrintersW(PRINTER_ENUM_LOCAL, null, 2, null, 0, cbNeeded.ptr, cReturned.ptr);

const bufSize = cbNeeded.readUInt32LE(0);
if (bufSize === 0) {
  console.log('  \x1b[33mNo local printers found.\x1b[0m');
  console.log('  Install a printer or check the Print Spooler service.');
  console.log();
  process.exit(0);
}

const printerBuf = Buffer.alloc(bufSize);
const ok = Winspool.EnumPrintersW(
  PRINTER_ENUM_LOCAL,
  null,
  2,
  printerBuf.ptr,
  bufSize,
  cbNeeded.ptr,
  cReturned.ptr,
);

if (!ok) {
  console.log('  \x1b[31mEnumPrintersW failed.\x1b[0m');
  process.exit(1);
}

const count = cReturned.readUInt32LE(0);
if (count === 0) {
  console.log('  \x1b[33mNo local printers found.\x1b[0m');
  console.log();
  process.exit(0);
}

console.log(`  \x1b[2m${count} contender(s) entering the ring...\x1b[0m`);
console.log();

for (let i = 0; i < count; i++) {
  const base = i * PRINTER_INFO_2_SIZE;

  const name = readPtrString(printerBuf, base + 0x08);
  const port = readPtrString(printerBuf, base + 0x18);
  const driver = readPtrString(printerBuf, base + 0x20);
  const status = printerBuf.readUInt32LE(base + 0x7c);
  const jobs = printerBuf.readUInt32LE(base + 0x78);

  const isDefault = name === defaultPrinter;
  const crown = isDefault ? ' \x1b[33m<-- DEFAULT\x1b[0m' : '';
  const nameColor = isDefault ? '\x1b[1;33m' : '\x1b[1;37m';

  console.log(`  ${nameColor}${name}\x1b[0m${crown}`);
  console.log(`    Port:    ${port}`);
  console.log(`    Driver:  ${driver}`);
  console.log(`    Status:  ${decodeStatus(status)}`);
  console.log(`    Jobs:    ${jobs}`);
  console.log();
}

if (defaultPrinter) {
  console.log(`  \x1b[1;33mThe reigning champion: ${defaultPrinter}\x1b[0m`);
} else {
  console.log('  \x1b[2mNo default printer is configured.\x1b[0m');
}

console.log();
