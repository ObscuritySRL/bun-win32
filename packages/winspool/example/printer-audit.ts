/**
 * Comprehensive local printer audit with full attribute and status decoding.
 *
 * Enumerates all local printers using EnumPrintersW at level 2 and identifies
 * the default via GetDefaultPrinterW. For every printer, reports all available
 * PRINTER_INFO_2W fields including server, share name, port, driver, comment,
 * location, separator file, print processor, data type, decoded attribute
 * flags, priority, default priority, decoded status flags, and active jobs.
 *
 * APIs demonstrated:
 *   - EnumPrintersW (PRINTER_ENUM_LOCAL, level 2, double-call pattern)
 *   - GetDefaultPrinterW (double-call pattern)
 *
 * Struct layout for PRINTER_INFO_2W on x64:
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
 * Run: bun run example/printer-audit.ts
 */

import { toArrayBuffer, type Pointer } from 'bun:ffi';
import Winspool from '../index';

const PRINTER_ENUM_LOCAL = 2;
const PRINTER_INFO_2_SIZE = 0x88; // 136 bytes on x64

const ATTRIBUTE_FLAGS: [number, string][] = [
  [0x00000001, 'QUEUED'],
  [0x00000002, 'DIRECT'],
  [0x00000004, 'DEFAULT'],
  [0x00000008, 'SHARED'],
  [0x00000010, 'NETWORK'],
  [0x00000020, 'HIDDEN'],
  [0x00000040, 'LOCAL'],
  [0x00000080, 'ENABLE_DEVQ'],
  [0x00000100, 'KEEPPRINTEDJOBS'],
  [0x00000200, 'DO_COMPLETE_FIRST'],
  [0x00000400, 'WORK_OFFLINE'],
  [0x00000800, 'ENABLE_BIDI'],
  [0x00001000, 'RAW_ONLY'],
  [0x00002000, 'PUBLISHED'],
  [0x00004000, 'FAX'],
  [0x00008000, 'TS'],
  [0x00020000, 'PUSHED_USER'],
  [0x00040000, 'PUSHED_MACHINE'],
  [0x00080000, 'MACHINE'],
  [0x00100000, 'FRIENDLY_NAME'],
  [0x00200000, 'TS_GENERIC_DRIVER'],
  [0x00400000, 'PER_USER'],
  [0x00800000, 'ENTERPRISE_CLOUD'],
];

const STATUS_FLAGS: [number, string][] = [
  [0x00000001, 'PAUSED'],
  [0x00000002, 'ERROR'],
  [0x00000004, 'PENDING_DELETION'],
  [0x00000008, 'PAPER_JAM'],
  [0x00000010, 'PAPER_OUT'],
  [0x00000020, 'MANUAL_FEED'],
  [0x00000040, 'PAPER_PROBLEM'],
  [0x00000080, 'OFFLINE'],
  [0x00000100, 'IO_ACTIVE'],
  [0x00000200, 'BUSY'],
  [0x00000400, 'PRINTING'],
  [0x00000800, 'OUTPUT_BIN_FULL'],
  [0x00001000, 'NOT_AVAILABLE'],
  [0x00002000, 'WAITING'],
  [0x00004000, 'PROCESSING'],
  [0x00008000, 'INITIALIZING'],
  [0x00010000, 'WARMING_UP'],
  [0x00020000, 'TONER_LOW'],
  [0x00040000, 'NO_TONER'],
  [0x00080000, 'PAGE_PUNT'],
  [0x00100000, 'USER_INTERVENTION'],
  [0x00200000, 'OUT_OF_MEMORY'],
  [0x00400000, 'DOOR_OPEN'],
  [0x00800000, 'SERVER_UNKNOWN'],
  [0x01000000, 'POWER_SAVE'],
];

function readPtrString(buf: Buffer, ptrOffset: number): string {
  const low = buf.readUInt32LE(ptrOffset);
  const high = buf.readUInt32LE(ptrOffset + 4);
  if (low === 0 && high === 0) return '(none)';
  const ptr = (BigInt(high) << 32n) | BigInt(low);
  const raw = Buffer.from(toArrayBuffer(Number(ptr) as unknown as Pointer, 0, 512));
  return raw.toString('utf16le').replace(/\0.*$/, '') || '(none)';
}

function decodeFlags(value: number, table: [number, string][]): string {
  if (value === 0) return '(none)';
  const matched: string[] = [];
  for (const [bit, label] of table) {
    if (value & bit) matched.push(label);
  }
  return matched.length > 0
    ? matched.join(', ')
    : `Unknown (0x${(value >>> 0).toString(16)})`;
}

function getDefaultPrinter(): string {
  const sizeBuf = Buffer.alloc(4);
  sizeBuf.writeUInt32LE(0, 0);
  Winspool.GetDefaultPrinterW(null, sizeBuf.ptr);
  const charCount = sizeBuf.readUInt32LE(0);
  if (charCount === 0) return '';

  const nameBuf = Buffer.alloc(charCount * 2);
  const ok = Winspool.GetDefaultPrinterW(nameBuf.ptr, sizeBuf.ptr);
  if (!ok) return '';
  return nameBuf.toString('utf16le').replace(/\0.*$/, '');
}

console.log();
console.log('=== Printer Audit ===');
console.log();

const defaultPrinter = getDefaultPrinter();

// Enumerate local printers (double-call pattern)
const cbNeeded = Buffer.alloc(4);
const cReturned = Buffer.alloc(4);

Winspool.EnumPrintersW(PRINTER_ENUM_LOCAL, null, 2, null, 0, cbNeeded.ptr, cReturned.ptr);

const bufSize = cbNeeded.readUInt32LE(0);
if (bufSize === 0) {
  console.log('  No local printers found.');
  console.log();
  console.log('  Possible reasons:');
  console.log('    - No printers are installed');
  console.log('    - Print Spooler service is not running');
  console.log('      (run: sc query spooler)');
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
  console.log('  EnumPrintersW failed on second call.');
  process.exit(1);
}

const count = cReturned.readUInt32LE(0);
if (count === 0) {
  console.log('  No local printers found.');
  console.log();
  process.exit(0);
}

console.log(`  Default Printer:  ${defaultPrinter || '(not configured)'}`);
console.log(`  Local Printers:   ${count}`);
console.log();

let totalJobs = 0;
let offlineCount = 0;
let sharedCount = 0;

for (let i = 0; i < count; i++) {
  const base = i * PRINTER_INFO_2_SIZE;

  const server = readPtrString(printerBuf, base + 0x00);
  const name = readPtrString(printerBuf, base + 0x08);
  const shareName = readPtrString(printerBuf, base + 0x10);
  const port = readPtrString(printerBuf, base + 0x18);
  const driver = readPtrString(printerBuf, base + 0x20);
  const comment = readPtrString(printerBuf, base + 0x28);
  const location = readPtrString(printerBuf, base + 0x30);
  const sepFile = readPtrString(printerBuf, base + 0x40);
  const printProcessor = readPtrString(printerBuf, base + 0x48);
  const datatype = readPtrString(printerBuf, base + 0x50);
  const parameters = readPtrString(printerBuf, base + 0x58);

  const attributes = printerBuf.readUInt32LE(base + 0x68);
  const priority = printerBuf.readUInt32LE(base + 0x70);
  const defaultPriority = printerBuf.readUInt32LE(base + 0x74);
  const jobs = printerBuf.readUInt32LE(base + 0x78);
  const status = printerBuf.readUInt32LE(base + 0x7c);

  totalJobs += jobs;
  if (attributes & 0x00000400) offlineCount++;
  if (attributes & 0x00000008) sharedCount++;

  const isDefault = name === defaultPrinter;

  console.log(`--- Printer ${i + 1} of ${count}${isDefault ? ' [DEFAULT]' : ''} ---`);
  console.log(`  Name:               ${name}`);
  console.log(`  Server:             ${server}`);
  console.log(`  Share Name:         ${shareName}`);
  console.log(`  Port:               ${port}`);
  console.log(`  Driver:             ${driver}`);
  console.log(`  Comment:            ${comment}`);
  console.log(`  Location:           ${location}`);
  console.log(`  Sep. File:          ${sepFile}`);
  console.log(`  Print Processor:    ${printProcessor}`);
  console.log(`  Datatype:           ${datatype}`);
  console.log(`  Parameters:         ${parameters}`);
  console.log(`  Attributes:         0x${(attributes >>> 0).toString(16).padStart(8, '0')} (${decodeFlags(attributes, ATTRIBUTE_FLAGS)})`);
  console.log(`  Priority:           ${priority}`);
  console.log(`  Default Priority:   ${defaultPriority}`);
  console.log(`  Status:             0x${(status >>> 0).toString(16).padStart(8, '0')} (${decodeFlags(status, STATUS_FLAGS)})`);
  console.log(`  Active Jobs:        ${jobs}`);
  console.log();
}

console.log('--- Summary ---');
console.log(`  Total printers:     ${count}`);
console.log(`  Shared:             ${sharedCount}`);
console.log(`  Offline:            ${offlineCount}`);
console.log(`  Total active jobs:  ${totalJobs}`);
console.log();
