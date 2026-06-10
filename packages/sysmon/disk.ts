import Kernel32 from '@bun-win32/kernel32';
import { CounterSet, expandCounterPath } from './counters';
import { parseMultiSz } from './structs';
import { preloadPending } from './preload';

preloadPending(Kernel32, ['GetDiskFreeSpaceExW', 'GetDriveTypeW', 'GetLogicalDriveStringsW', 'GetVolumeInformationW']);
const { GetDiskFreeSpaceExW, GetDriveTypeW, GetLogicalDriveStringsW, GetVolumeInformationW } = Kernel32;

const DRIVE_TYPE_NAMES = ['unknown', 'no_root_dir', 'removable', 'fixed', 'remote', 'cdrom', 'ramdisk'] as const;

export interface DiskSpace {
  /** Bytes available to the CALLER — quota-aware, can be less than `freeBytes` (the split `fs.statfs` cannot give on Windows). */
  availableBytes: number;
  freeBytes: number;
  totalBytes: number;
}

export interface DriveInfo extends DiskSpace {
  driveType: number;
  driveTypeName: (typeof DRIVE_TYPE_NAMES)[number];
  filesystem: string;
  label: string;
  /** Root path with trailing backslash, e.g. `C:\`. */
  path: string;
  serialNumber: number;
}

/**
 * Free/total/available bytes for any path — including UNC shares (`\\server\share`), which
 * check-disk-space rejects by design. Root paths get the required trailing backslash; the
 * wide string is assembled immediately before the call (GC-window rule).
 */
export function diskSpace(path: string): DiskSpace {
  const normalized = path.endsWith('\\') || path.endsWith('/') ? path : `${path}\\`;
  const widePath = Buffer.from(`${normalized}\0`, 'utf16le');
  const availableBuffer = Buffer.alloc(8);
  const totalBuffer = Buffer.alloc(8);
  const freeBuffer = Buffer.alloc(8);
  if (GetDiskFreeSpaceExW(widePath.ptr, availableBuffer.ptr, totalBuffer.ptr, freeBuffer.ptr) === 0) throw new Error(`GetDiskFreeSpaceExW failed for '${normalized}'`);
  return {
    availableBytes: Number(availableBuffer.readBigUInt64LE(0)),
    freeBytes: Number(freeBuffer.readBigUInt64LE(0)),
    totalBytes: Number(totalBuffer.readBigUInt64LE(0)),
  };
}

/** Every mounted volume with type, label, filesystem, serial, and the quota-aware space split. Unready drives (empty card reader/CD) report zero sizes instead of throwing. */
export function drives(): DriveInfo[] {
  const rootsBuffer = Buffer.alloc(1024);
  const written = GetLogicalDriveStringsW(511, rootsBuffer.ptr);
  if (written === 0) throw new Error('GetLogicalDriveStringsW failed');
  const roots = parseMultiSz(rootsBuffer, Math.min(written + 1, 511));
  const driveInfos: DriveInfo[] = [];
  for (const root of roots) {
    const widePath = Buffer.from(`${root}\0`, 'utf16le');
    const driveType = GetDriveTypeW(widePath.ptr);
    const labelBuffer = Buffer.alloc(522);
    const serialBuffer = Buffer.alloc(4);
    const maximumComponentBuffer = Buffer.alloc(4);
    const flagsBuffer = Buffer.alloc(4);
    const filesystemBuffer = Buffer.alloc(522);
    const volumeReady = GetVolumeInformationW(widePath.ptr, labelBuffer.ptr, 261, serialBuffer.ptr, maximumComponentBuffer.ptr, flagsBuffer.ptr, filesystemBuffer.ptr, 261) !== 0;
    const availableBuffer = Buffer.alloc(8);
    const totalBuffer = Buffer.alloc(8);
    const freeBuffer = Buffer.alloc(8);
    const spaceReady = GetDiskFreeSpaceExW(widePath.ptr, availableBuffer.ptr, totalBuffer.ptr, freeBuffer.ptr) !== 0;
    driveInfos.push({
      availableBytes: spaceReady ? Number(availableBuffer.readBigUInt64LE(0)) : 0,
      driveType,
      driveTypeName: DRIVE_TYPE_NAMES[driveType] ?? 'unknown',
      filesystem: volumeReady ? decodeFirstString(filesystemBuffer) : '',
      freeBytes: spaceReady ? Number(freeBuffer.readBigUInt64LE(0)) : 0,
      label: volumeReady ? decodeFirstString(labelBuffer) : '',
      path: root,
      serialNumber: volumeReady ? serialBuffer.readUInt32LE(0) : 0,
      totalBytes: spaceReady ? Number(totalBuffer.readBigUInt64LE(0)) : 0,
    });
  }
  return driveInfos;
}

function decodeFirstString(buffer: Buffer): string {
  let length = 0;
  while (length * 2 < buffer.byteLength && buffer.readUInt16LE(length * 2) !== 0) length += 1;
  return buffer.subarray(0, length * 2).toString('utf16le');
}

export interface DiskIoRate {
  /** PhysicalDisk instance name, e.g. `0 C:` or `_Total`. */
  instance: string;
  readBytesPerSecond: number;
  writeBytesPerSecond: number;
}

/** Per-physical-disk I/O throughput via PDH `\PhysicalDisk(*)\Disk Read|Write Bytes/sec`, sampled over `sampleMs` — the system-wide numbers systeminformation's disksIO() null-stubs on Windows (si#274). Pair with `processIoCounters` for per-process attribution. */
export function diskIoCounters(sampleMs = 200): DiskIoRate[] {
  const readPaths = expandCounterPath('\\PhysicalDisk(*)\\Disk Read Bytes/sec');
  if (readPaths.length === 0) return [];
  const counterSet = new CounterSet();
  try {
    const instances = readPaths.map((path) => {
      const instance = /\(([^)]+)\)/.exec(path)?.[1] ?? path;
      const local = path.replace(/^\\\\[^\\]+/, ''); // expanded paths carry \\MACHINE — strip to the local form
      return { instance, read: counterSet.add(local), write: counterSet.add(local.replace('Disk Read Bytes/sec', 'Disk Write Bytes/sec')) };
    });
    counterSet.collect();
    Bun.sleepSync(sampleMs);
    counterSet.collect();
    return instances.map((entry) => ({ instance: entry.instance, readBytesPerSecond: counterSet.value(entry.read), writeBytesPerSecond: counterSet.value(entry.write) }));
  } finally {
    counterSet.dispose();
  }
}
