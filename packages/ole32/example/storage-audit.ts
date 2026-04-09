/**
 * Storage Audit
 *
 * Runs a structured-storage diagnostic sweep over OLE build values, property-set
 * stream-name round-trips, DOS timestamp normalization, and representative file
 * paths in this package. The output is aligned for quick inspection and keeps
 * every status in raw Win32 form.
 *
 * APIs demonstrated:
 *   - CoBuildVersion          (report the packed COM build version)
 *   - CoDosDateTimeToFileTime (convert DOS date/time words into FILETIME)
 *   - CoFileTimeToDosDateTime (round-trip FILETIME back into DOS date/time words)
 *   - FmtIdToPropStgName      (convert an FMTID into a property-set stream name)
 *   - OleBuildVersion         (report the packed OLE build version)
 *   - PropStgNameToFmtId      (round-trip a property-set stream name back into an FMTID)
 *   - StgIsStorageFile        (classify paths as compound-storage files or not)
 *
 * Run: bun run example/storage-audit.ts
 */

import { unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import Ole32, { CCH_MAX_PROPSTG_NAME } from '../index';

Ole32.Preload(['CoBuildVersion', 'CoDosDateTimeToFileTime', 'CoFileTimeToDosDateTime', 'FmtIdToPropStgName', 'OleBuildVersion', 'PropStgNameToFmtId', 'StgIsStorageFile']);

const BOLD = '\x1b[1m';
const CYAN = '\x1b[96m';
const DIM = '\x1b[2m';
const GREEN = '\x1b[92m';
const RED = '\x1b[91m';
const RESET = '\x1b[0m';
const YELLOW = '\x1b[93m';

const propertySetSamples = [
  { guid: 'F29F85E0-4FF9-1068-AB91-08002B27B3D9', label: 'SummaryInformation' },
  { guid: '7E57A1D0-CAFE-4BAD-BEEF-001122334455', label: 'Synthetic Echo' },
  { guid: 'FEEDC0DE-1357-2468-ACE0-02468ACE1357', label: 'Synthetic Lumen' },
];

const dosTimestampSamples = [
  { day: 1, hour: 0, label: 'DOS epoch', minute: 0, month: 1, second: 0, year: 1980 },
  { day: 31, hour: 23, label: 'Quarter close', minute: 58, month: 12, second: 58, year: 2024 },
  { day: 9, hour: 9, label: 'Today sample', minute: 30, month: 4, second: 0, year: 2026 },
];

function decodeDosDate(dateWord: number): string {
  const year = 1980 + ((dateWord >> 9) & 0x7f);
  const month = (dateWord >> 5) & 0x0f;
  const day = dateWord & 0x1f;

  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function decodeDosTime(timeWord: number): string {
  const hour = (timeWord >> 11) & 0x1f;
  const minute = (timeWord >> 5) & 0x3f;
  const second = (timeWord & 0x1f) * 2;

  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
}

function decodeFmtid(buffer: Buffer): string {
  const partOne = buffer.readUInt32LE(0).toString(16).padStart(8, '0').toUpperCase();
  const partTwo = buffer.readUInt16LE(4).toString(16).padStart(4, '0').toUpperCase();
  const partThree = buffer.readUInt16LE(6).toString(16).padStart(4, '0').toUpperCase();
  const partFour = buffer.subarray(8, 10).toString('hex').toUpperCase();
  const partFive = buffer.subarray(10, 16).toString('hex').toUpperCase();

  return `${partOne}-${partTwo}-${partThree}-${partFour}-${partFive}`;
}

function encodeDosDate(year: number, month: number, day: number): number {
  return ((year - 1980) << 9) | (month << 5) | day;
}

function encodeDosTime(hour: number, minute: number, second: number): number {
  return (hour << 11) | (minute << 5) | Math.floor(second / 2);
}

function encodeFmtid(guid: string): Buffer {
  const match = /^([0-9A-Fa-f]{8})-([0-9A-Fa-f]{4})-([0-9A-Fa-f]{4})-([0-9A-Fa-f]{4})-([0-9A-Fa-f]{12})$/.exec(guid);

  if (!match) {
    throw new Error(`Invalid FMTID: ${guid}`);
  }

  const buffer = Buffer.alloc(16);
  buffer.writeUInt32LE(Number.parseInt(match[1], 16), 0);
  buffer.writeUInt16LE(Number.parseInt(match[2], 16), 4);
  buffer.writeUInt16LE(Number.parseInt(match[3], 16), 6);
  Buffer.from(`${match[4]}${match[5]}`, 'hex').copy(buffer, 8);

  return buffer;
}

function encodeWide(value: string): Buffer {
  return Buffer.from(`${value}\0`, 'utf16le');
}

function escapePropertyStorageName(value: string): string {
  let escaped = '';

  for (const character of value) {
    const codePoint = character.charCodeAt(0);

    if (codePoint >= 0x20 && codePoint <= 0x7e) {
      escaped += character;
      continue;
    }

    escaped += `\\u${codePoint.toString(16).padStart(4, '0')}`;
  }

  return escaped;
}

function formatFileTime(buffer: Buffer): string {
  return `0x${buffer.readBigUInt64LE(0).toString(16).padStart(16, '0').toUpperCase()}`;
}

function formatHRESULT(value: number): string {
  return `0x${(value >>> 0).toString(16).padStart(8, '0')}`;
}

function readWide(buffer: Buffer): string {
  return buffer.toString('utf16le').replace(/\0.*$/, '');
}

const propertySetRows = propertySetSamples.map((sample) => {
  const fmtidBuffer = encodeFmtid(sample.guid);
  const propertyNameBuffer = Buffer.alloc((CCH_MAX_PROPSTG_NAME + 1) * 2);
  const propertyNameStatus = Ole32.FmtIdToPropStgName(fmtidBuffer.ptr, propertyNameBuffer.ptr);

  if (propertyNameStatus !== 0) {
    throw new Error(`FmtIdToPropStgName failed for ${sample.guid}: ${formatHRESULT(propertyNameStatus)}`);
  }

  const roundTripBuffer = Buffer.alloc(16);
  const roundTripStatus = Ole32.PropStgNameToFmtId(propertyNameBuffer.ptr, roundTripBuffer.ptr);

  if (roundTripStatus !== 0) {
    throw new Error(`PropStgNameToFmtId failed for ${sample.guid}: ${formatHRESULT(roundTripStatus)}`);
  }

  return {
    guid: sample.guid,
    label: sample.label,
    propertyStorageName: escapePropertyStorageName(readWide(propertyNameBuffer)),
    roundTripGuid: decodeFmtid(roundTripBuffer),
  };
});

const timestampRows = dosTimestampSamples.map((sample) => {
  const dateWord = encodeDosDate(sample.year, sample.month, sample.day);
  const timeWord = encodeDosTime(sample.hour, sample.minute, sample.second);
  const fileTimeBuffer = Buffer.alloc(8);
  const dosToFileTime = Ole32.CoDosDateTimeToFileTime(dateWord, timeWord, fileTimeBuffer.ptr);

  if (!dosToFileTime) {
    throw new Error(`CoDosDateTimeToFileTime failed for ${sample.label}.`);
  }

  const roundTripDateBuffer = Buffer.alloc(2);
  const roundTripTimeBuffer = Buffer.alloc(2);
  const fileTimeToDos = Ole32.CoFileTimeToDosDateTime(fileTimeBuffer.ptr, roundTripDateBuffer.ptr, roundTripTimeBuffer.ptr);

  if (!fileTimeToDos) {
    throw new Error(`CoFileTimeToDosDateTime failed for ${sample.label}.`);
  }

  const roundTripDate = roundTripDateBuffer.readUInt16LE(0);
  const roundTripTime = roundTripTimeBuffer.readUInt16LE(0);

  return {
    dateWord,
    decodedDate: decodeDosDate(roundTripDate),
    decodedTime: decodeDosTime(roundTripTime),
    fileTime: formatFileTime(fileTimeBuffer),
    label: sample.label,
    roundTripOk: roundTripDate === dateWord && roundTripTime === timeWord,
    timeWord,
  };
});

const tempDirectory = Bun.env.TEMP ?? Bun.env.TMP ?? process.cwd();
const tempFilePath = join(tempDirectory, `bun-win32-ole32-storage-audit-${process.pid}.txt`);

await Bun.write(tempFilePath, 'This file is intentionally plain text and should not classify as compound storage.\n');

const pathSamples = [
  { label: 'package README', path: fileURLToPath(new URL('../README.md', import.meta.url)) },
  { label: 'this script', path: fileURLToPath(import.meta.url) },
  { label: 'temp text file', path: tempFilePath },
];

const pathRows = pathSamples.map((sample) => {
  const status = Ole32.StgIsStorageFile(encodeWide(sample.path).ptr);

  return {
    label: sample.label,
    path: sample.path,
    status,
  };
});

await unlink(tempFilePath).catch(() => undefined);

console.log('');
console.log(`${BOLD}${CYAN}OLE32 Storage Audit${RESET}`);
console.log(`${DIM}Packed version values, property-set stream names, DOS timestamp normalization, and path classification.${RESET}`);
console.log('');

console.log(`${BOLD}Build Values${RESET}`);
console.log(`  CoBuildVersion   ${formatHRESULT(Ole32.CoBuildVersion())}`);
console.log(`  OleBuildVersion  ${formatHRESULT(Ole32.OleBuildVersion())}`);
console.log('');

console.log(`${BOLD}Property Set Round-Trips${RESET}`);
for (const row of propertySetRows) {
  const status = row.roundTripGuid === row.guid.toUpperCase() ? `${GREEN}ok${RESET}` : `${RED}mismatch${RESET}`;
  console.log(`  ${CYAN}${row.label.padEnd(20)}${RESET} ${status}`);
  console.log(`    FMTID        ${row.guid}`);
  console.log(`    Stream name  ${row.propertyStorageName}`);
  console.log(`    Round-trip   ${row.roundTripGuid}`);
}
console.log('');

console.log(`${BOLD}DOS Timestamp Normalization${RESET}`);
for (const row of timestampRows) {
  const status = row.roundTripOk ? `${GREEN}ok${RESET}` : `${RED}mismatch${RESET}`;
  console.log(`  ${CYAN}${row.label.padEnd(20)}${RESET} ${status}`);
  console.log(`    DOS words    date=${formatHRESULT(row.dateWord).slice(-6)}  time=${formatHRESULT(row.timeWord).slice(-6)}`);
  console.log(`    FILETIME     ${row.fileTime}`);
  console.log(`    Decoded      ${row.decodedDate} ${row.decodedTime}`);
}
console.log('');

console.log(`${BOLD}Path Classification${RESET}`);
for (const row of pathRows) {
  const indicator = row.status === 0 ? `${GREEN}storage${RESET}` : `${YELLOW}not storage${RESET}`;
  console.log(`  ${CYAN}${row.label.padEnd(20)}${RESET} ${indicator}  ${formatHRESULT(row.status)}`);
  console.log(`    ${DIM}${row.path}${RESET}`);
}
console.log('');
