/**
 * Disk Inspector
 *
 * Creates a temporary VHDX, closes the creation handle, then reopens it
 * read-only with OpenVirtualDisk to perform a multi-class property audit.
 * Demonstrates the open-then-inspect workflow used by support tooling and
 * compliance checks.
 *
 * APIs demonstrated:
 *   - CreateVirtualDisk           (create a sample disk to inspect)
 *   - OpenVirtualDisk             (reopen for read-only inspection)
 *   - GetVirtualDiskInformation   (size, identifier, storage type, provider subtype,
 *                                  4K alignment, VHD physical sector size, fragmentation)
 *
 * Run: bun run example/disk-inspector.ts
 */
import { rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import Kernel32 from '@bun-win32/kernel32';

import Virtdisk, {
  CREATE_VIRTUAL_DISK_FLAG,
  CREATE_VIRTUAL_DISK_VERSION,
  GET_VIRTUAL_DISK_INFO_VERSION,
  OPEN_VIRTUAL_DISK_FLAG,
  OPEN_VIRTUAL_DISK_VERSION,
  VIRTUAL_DISK_ACCESS_MASK,
  VIRTUAL_STORAGE_TYPE_DEVICE_VHDX,
} from '../index';

const ERROR_SUCCESS = 0;
const RESET = '\x1b[0m';

function color(code: number, text: string): string {
  return `\x1b[38;5;${code}m${text}${RESET}`;
}

function label(name: string, value: string): void {
  console.log(`  ${color(244, name.padEnd(24))} ${value}`);
}

function formatBytes(bytes: bigint): string {
  if (bytes >= 1_073_741_824n) return `${Number(bytes / 1_073_741_824n)} GB`;
  if (bytes >= 1_048_576n) return `${Number(bytes / 1_048_576n)} MB`;
  if (bytes >= 1024n) return `${Number(bytes / 1024n)} KB`;
  return `${bytes} B`;
}

function formatGuid(buf: Buffer, offset: number): string {
  const d1 = buf.readUInt32LE(offset).toString(16).padStart(8, '0');
  const d2 = buf.readUInt16LE(offset + 4).toString(16).padStart(4, '0');
  const d3 = buf.readUInt16LE(offset + 6).toString(16).padStart(4, '0');
  const d4hi = buf.subarray(offset + 8, offset + 10).toString('hex');
  const d4lo = buf.subarray(offset + 10, offset + 16).toString('hex');
  return `{${d1}-${d2}-${d3}-${d4hi}-${d4lo}}`.toUpperCase();
}

function deviceName(id: number): string {
  switch (id) {
    case 0: return 'Unknown';
    case 1: return 'ISO';
    case 2: return 'VHD';
    case 3: return 'VHDX';
    case 4: return 'VHD Set';
    default: return `Device(${id})`;
  }
}

function buildStorageType(): Buffer {
  const buf = Buffer.alloc(20);
  buf.writeUInt32LE(VIRTUAL_STORAGE_TYPE_DEVICE_VHDX, 0);
  buf.writeUInt32LE(0xec984aec, 4);
  buf.writeUInt16LE(0xa0f9, 8);
  buf.writeUInt16LE(0x47e9, 10);
  buf.set([0x90, 0x1f, 0x71, 0x41, 0x5a, 0x66, 0x34, 0x5b], 12);
  return buf;
}

function queryInfo(handle: bigint, version: number): { status: number; buf: Buffer } {
  const buf = Buffer.alloc(256);
  buf.writeUInt32LE(version, 0);
  const len = Buffer.alloc(4);
  len.writeUInt32LE(256, 0);
  const status = Virtdisk.GetVirtualDiskInformation(handle, len.ptr!, buf.ptr!, null);
  return { status, buf };
}

Virtdisk.Preload(['CreateVirtualDisk', 'GetVirtualDiskInformation', 'OpenVirtualDisk']);
Kernel32.Preload(['CloseHandle']);

// --- Create a temporary VHDX to inspect ---
const vhdxPath = join(tmpdir(), `bun-win32-virtdisk-inspector-${Date.now()}.vhdx`);
const pathBuf = Buffer.from(`${vhdxPath}\0`, 'utf16le');
const storageType = buildStorageType();

const createParams = Buffer.alloc(56);
createParams.writeUInt32LE(CREATE_VIRTUAL_DISK_VERSION.CREATE_VIRTUAL_DISK_VERSION_1, 0);
createParams.writeBigUInt64LE(128n * 1024n * 1024n, 24); // 128 MB

const createHandle = Buffer.alloc(8);

let status = Virtdisk.CreateVirtualDisk(
  storageType.ptr!,
  pathBuf.ptr!,
  VIRTUAL_DISK_ACCESS_MASK.VIRTUAL_DISK_ACCESS_CREATE,
  null,
  CREATE_VIRTUAL_DISK_FLAG.CREATE_VIRTUAL_DISK_FLAG_NONE,
  0,
  createParams.ptr!,
  null,
  createHandle.ptr!,
);

if (status !== ERROR_SUCCESS) {
  console.error(`CreateVirtualDisk failed: error ${status}`);
  process.exit(1);
}

// Close the creation handle — we will reopen it for inspection
Kernel32.CloseHandle(createHandle.readBigUInt64LE(0));

// --- Reopen with OpenVirtualDisk (read-only, info-only) ---

/**
 * OPEN_VIRTUAL_DISK_PARAMETERS Version2 (28 bytes on x64):
 *   0:  Version          (u32) = 2
 *   4:  GetInfoOnly      (BOOL) = 1
 *   8:  ReadOnly         (BOOL) = 1
 *  12:  ResiliencyGuid   (GUID, 16 bytes — all zeros)
 */
const openParams = Buffer.alloc(28);
openParams.writeUInt32LE(OPEN_VIRTUAL_DISK_VERSION.OPEN_VIRTUAL_DISK_VERSION_2, 0);
openParams.writeInt32LE(1, 4);  // GetInfoOnly = TRUE
openParams.writeInt32LE(1, 8);  // ReadOnly = TRUE

const openHandle = Buffer.alloc(8);
const openPath = Buffer.from(`${vhdxPath}\0`, 'utf16le');

status = Virtdisk.OpenVirtualDisk(
  storageType.ptr!,
  openPath.ptr!,
  VIRTUAL_DISK_ACCESS_MASK.VIRTUAL_DISK_ACCESS_NONE,
  OPEN_VIRTUAL_DISK_FLAG.OPEN_VIRTUAL_DISK_FLAG_NONE,
  openParams.ptr!,
  openHandle.ptr!,
);

if (status !== ERROR_SUCCESS) {
  console.error(`OpenVirtualDisk failed: error ${status}`);
  rmSync(vhdxPath, { force: true });
  process.exit(1);
}

const diskHandle = openHandle.readBigUInt64LE(0);

console.log(color(45, 'DISK INSPECTOR'));
console.log('');
console.log(`  ${color(244, 'Path')}                     ${vhdxPath}`);
console.log('');

// --- Query multiple info classes ---

// Size
const sizeQuery = queryInfo(diskHandle, GET_VIRTUAL_DISK_INFO_VERSION.GET_VIRTUAL_DISK_INFO_SIZE);
if (sizeQuery.status === ERROR_SUCCESS) {
  console.log(color(123, '  Geometry'));
  label('Virtual size', formatBytes(sizeQuery.buf.readBigUInt64LE(8)));
  label('Physical size', formatBytes(sizeQuery.buf.readBigUInt64LE(16)));
  label('Block size', `${sizeQuery.buf.readUInt32LE(24)} bytes`);
  label('Sector size', `${sizeQuery.buf.readUInt32LE(28)} bytes`);
  console.log('');
}

// Identifier
const idQuery = queryInfo(diskHandle, GET_VIRTUAL_DISK_INFO_VERSION.GET_VIRTUAL_DISK_INFO_IDENTIFIER);
if (idQuery.status === ERROR_SUCCESS) {
  console.log(color(123, '  Identity'));
  label('Disk identifier', formatGuid(idQuery.buf, 8));
}

// Virtual storage type
const typeQuery = queryInfo(diskHandle, GET_VIRTUAL_DISK_INFO_VERSION.GET_VIRTUAL_DISK_INFO_VIRTUAL_STORAGE_TYPE);
if (typeQuery.status === ERROR_SUCCESS) {
  const devId = typeQuery.buf.readUInt32LE(8);
  label('Device type', `${deviceName(devId)} (${devId})`);
  label('Vendor GUID', formatGuid(typeQuery.buf, 12));
  console.log('');
}

// Provider subtype
const providerQuery = queryInfo(diskHandle, GET_VIRTUAL_DISK_INFO_VERSION.GET_VIRTUAL_DISK_INFO_PROVIDER_SUBTYPE);
if (providerQuery.status === ERROR_SUCCESS) {
  console.log(color(123, '  Provider'));
  label('Provider subtype', `${providerQuery.buf.readUInt32LE(8)}`);
}

// 4K alignment
const alignQuery = queryInfo(diskHandle, GET_VIRTUAL_DISK_INFO_VERSION.GET_VIRTUAL_DISK_INFO_IS_4K_ALIGNED);
if (alignQuery.status === ERROR_SUCCESS) {
  label('4K aligned', alignQuery.buf.readInt32LE(8) !== 0 ? 'Yes' : 'No');
}

// VHD physical sector size
const sectorQuery = queryInfo(diskHandle, GET_VIRTUAL_DISK_INFO_VERSION.GET_VIRTUAL_DISK_INFO_VHD_PHYSICAL_SECTOR_SIZE);
if (sectorQuery.status === ERROR_SUCCESS) {
  label('Physical sector', `${sectorQuery.buf.readUInt32LE(8)} bytes`);
}

// Fragmentation
const fragQuery = queryInfo(diskHandle, GET_VIRTUAL_DISK_INFO_VERSION.GET_VIRTUAL_DISK_INFO_FRAGMENTATION);
if (fragQuery.status === ERROR_SUCCESS) {
  label('Fragmentation', `${fragQuery.buf.readUInt32LE(8)}%`);
}

console.log('');

Kernel32.CloseHandle(diskHandle);
rmSync(vhdxPath, { force: true });

console.log(color(82, '  Inspection complete. Temporary disk cleaned up.'));
