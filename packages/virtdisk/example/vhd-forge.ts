/**
 * VHD Forge
 *
 * Creates a VHDX virtual hard disk from scratch using pure TypeScript FFI,
 * queries its properties (size, identifier, storage type), and cleans up.
 * No PowerShell. No diskpart. No C#.
 *
 * APIs demonstrated:
 *   - CreateVirtualDisk           (forge a new VHDX on disk)
 *   - GetVirtualDiskInformation   (query virtual/physical size and disk identifier)
 *
 * Run: bun run example/vhd-forge.ts
 */
import { rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import Kernel32 from '@bun-win32/kernel32';

import Virtdisk, {
  CREATE_VIRTUAL_DISK_FLAG,
  CREATE_VIRTUAL_DISK_VERSION,
  GET_VIRTUAL_DISK_INFO_VERSION,
  VIRTUAL_DISK_ACCESS_MASK,
  VIRTUAL_STORAGE_TYPE_DEVICE_VHDX,
} from '../index';

const ERROR_SUCCESS = 0;
const RESET = '\x1b[0m';

function color(code: number, text: string): string {
  return `\x1b[38;5;${code}m${text}${RESET}`;
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

/**
 * Build a VIRTUAL_STORAGE_TYPE struct for VHDX with the Microsoft vendor GUID.
 *
 * Layout (20 bytes):
 *   0: DeviceId     (ULONG)  — VIRTUAL_STORAGE_TYPE_DEVICE_VHDX = 3
 *   4: VendorId     (GUID)   — VIRTUAL_STORAGE_TYPE_VENDOR_MICROSOFT
 */
function buildStorageType(): Buffer {
  const buf = Buffer.alloc(20);
  buf.writeUInt32LE(VIRTUAL_STORAGE_TYPE_DEVICE_VHDX, 0);
  buf.writeUInt32LE(0xec984aec, 4);
  buf.writeUInt16LE(0xa0f9, 8);
  buf.writeUInt16LE(0x47e9, 10);
  buf.set([0x90, 0x1f, 0x71, 0x41, 0x5a, 0x66, 0x34, 0x5b], 12);
  return buf;
}

/**
 * Build a CREATE_VIRTUAL_DISK_PARAMETERS Version1 struct.
 *
 * Layout (56 bytes on x64):
 *   0:  Version            (u32)
 *   4:  padding
 *   8:  UniqueId           (GUID, 16 bytes — all-zero = system-generated)
 *  24:  MaximumSize        (u64)
 *  32:  BlockSizeInBytes   (u32, 0 = default)
 *  36:  SectorSizeInBytes  (u32, 0 = default 512)
 *  40:  ParentPath         (ptr, null)
 *  48:  SourcePath         (ptr, null)
 */
function buildCreateParams(maxSizeBytes: bigint): Buffer {
  const buf = Buffer.alloc(56);
  buf.writeUInt32LE(CREATE_VIRTUAL_DISK_VERSION.CREATE_VIRTUAL_DISK_VERSION_1, 0);
  buf.writeBigUInt64LE(maxSizeBytes, 24);
  return buf;
}

Virtdisk.Preload(['CreateVirtualDisk', 'GetVirtualDiskInformation']);
Kernel32.Preload(['CloseHandle']);

const vhdxPath = join(tmpdir(), `bun-win32-virtdisk-forge-${Date.now()}.vhdx`);
const pathBuf = Buffer.from(`${vhdxPath}\0`, 'utf16le');
const storageType = buildStorageType();
const maxSize = 64n * 1024n * 1024n;
const createParams = buildCreateParams(maxSize);
const handleBuf = Buffer.alloc(8);

console.log(color(45, 'VHD FORGE'));
console.log('');

const result = Virtdisk.CreateVirtualDisk(
  storageType.ptr!,
  pathBuf.ptr!,
  VIRTUAL_DISK_ACCESS_MASK.VIRTUAL_DISK_ACCESS_CREATE | VIRTUAL_DISK_ACCESS_MASK.VIRTUAL_DISK_ACCESS_GET_INFO,
  null,
  CREATE_VIRTUAL_DISK_FLAG.CREATE_VIRTUAL_DISK_FLAG_NONE,
  0,
  createParams.ptr!,
  null,
  handleBuf.ptr!,
);

if (result !== ERROR_SUCCESS) {
  console.error(`CreateVirtualDisk failed: error ${result}`);
  process.exit(1);
}

const diskHandle = handleBuf.readBigUInt64LE(0);
console.log(`${color(82, 'Created')}  ${vhdxPath}`);
console.log(`Handle   : 0x${diskHandle.toString(16)}`);

// Query size info (GET_VIRTUAL_DISK_INFO_SIZE)
const sizeInfo = Buffer.alloc(256);
sizeInfo.writeUInt32LE(GET_VIRTUAL_DISK_INFO_VERSION.GET_VIRTUAL_DISK_INFO_SIZE, 0);
const sizeInfoLen = Buffer.alloc(4);
sizeInfoLen.writeUInt32LE(256, 0);

let status = Virtdisk.GetVirtualDiskInformation(diskHandle, sizeInfoLen.ptr!, sizeInfo.ptr!, null);

if (status === ERROR_SUCCESS) {
  const virtualSize = sizeInfo.readBigUInt64LE(8);
  const physicalSize = sizeInfo.readBigUInt64LE(16);
  const blockSize = sizeInfo.readUInt32LE(24);
  const sectorSize = sizeInfo.readUInt32LE(28);

  console.log('');
  console.log(color(123, 'Disk Properties'));
  console.log(`Virtual  : ${formatBytes(virtualSize)}`);
  console.log(`Physical : ${formatBytes(physicalSize)}`);
  console.log(`Block    : ${blockSize} bytes`);
  console.log(`Sector   : ${sectorSize} bytes`);
}

// Query identifier (GET_VIRTUAL_DISK_INFO_IDENTIFIER)
const idInfo = Buffer.alloc(256);
idInfo.writeUInt32LE(GET_VIRTUAL_DISK_INFO_VERSION.GET_VIRTUAL_DISK_INFO_IDENTIFIER, 0);
const idInfoLen = Buffer.alloc(4);
idInfoLen.writeUInt32LE(256, 0);

status = Virtdisk.GetVirtualDiskInformation(diskHandle, idInfoLen.ptr!, idInfo.ptr!, null);

if (status === ERROR_SUCCESS) {
  console.log(`ID       : ${formatGuid(idInfo, 8)}`);
}

Kernel32.CloseHandle(diskHandle);
rmSync(vhdxPath, { force: true });

console.log('');
console.log(color(208, 'Forged and dismantled. Pure TypeScript, zero dependencies.'));
