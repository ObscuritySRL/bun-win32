/**
 * Event log channel inventory report.
 *
 * Enumerates every registered Windows Event Log channel, reads configuration
 * properties and live log statistics, and prints a ranked report with human-
 * readable sizes, retention flags, and channel types.
 *
 * APIs demonstrated:
 *   - EvtOpenChannelEnum / EvtNextChannelPath (enumerate channel paths)
 *   - EvtOpenChannelConfig (open per-channel configuration handles)
 *   - EvtGetChannelConfigProperty (read channel settings via EVT_VARIANT)
 *   - EvtOpenLog / EvtGetLogInfo (read live log statistics)
 *   - EvtClose (release channel enumerator, config, and log handles)
 *
 * APIs demonstrated (Kernel32, cross-package):
 *   - GetCurrentProcess / ReadProcessMemory (read pointed-to UTF-16 strings from EVT_VARIANT values)
 *
 * Run: bun run example/channel-report.ts
 */

import Wevtapi, { EVT_VARIANT_TYPE_MASK, EvtChannelConfigPropertyId, EvtChannelType, EvtLogPropertyId, EvtOpenLogFlags, EvtVariantType } from '../index';
import Kernel32 from '@bun-win32/kernel32';

const FALSE = 0;
const MAX_DISPLAY_ROWS = Number(Bun.env.WEVTAPI_CHANNEL_LIMIT ?? '20');
const TRUE = 1;
const CURRENT_PROCESS_HANDLE = Kernel32.GetCurrentProcess();

Wevtapi.Preload(['EvtClose', 'EvtGetChannelConfigProperty', 'EvtGetLogInfo', 'EvtNextChannelPath', 'EvtOpenChannelConfig', 'EvtOpenChannelEnum', 'EvtOpenLog']);
Kernel32.Preload(['GetCurrentProcess', 'ReadProcessMemory']);

type ChannelReportRow = {
  autoBackup: boolean;
  enabled: boolean;
  filePath: string;
  fileSize: bigint;
  isFull: boolean;
  maxSize: bigint;
  name: string;
  oldestRecord: bigint;
  recordCount: bigint;
  retention: boolean;
  typeName: string;
};

function formatBytes(value: bigint): string {
  const valueAsNumber = Number(value);

  if (!Number.isFinite(valueAsNumber) || valueAsNumber <= 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let unitIndex = 0;
  let scaledValue = valueAsNumber;

  while (scaledValue >= 1024 && unitIndex < units.length - 1) {
    scaledValue /= 1024;
    unitIndex++;
  }

  const display = scaledValue >= 10 || unitIndex === 0 ? scaledValue.toFixed(0) : scaledValue.toFixed(1);

  return `${display} ${units[unitIndex]}`;
}

function formatCount(value: bigint): string {
  return Number(value).toLocaleString();
}

function readWidePointer(pointerAddress: number, byteCount: number): string {
  const readBuffer = Buffer.alloc(byteCount);
  const status = Kernel32.ReadProcessMemory(CURRENT_PROCESS_HANDLE, BigInt(pointerAddress), readBuffer.ptr, BigInt(byteCount), 0n);

  if (status === FALSE) {
    return '';
  }

  return readBuffer.toString('utf16le').split('\0')[0] ?? '';
}

function parseVariantValue(variantBuffer: Buffer): bigint | boolean | number | string | null {
  const variantType = variantBuffer.readUInt32LE(12) & EVT_VARIANT_TYPE_MASK;

  if (variantType === EvtVariantType.EvtVarTypeNull) return null;
  if (variantType === EvtVariantType.EvtVarTypeBoolean) return variantBuffer.readInt32LE(0) !== 0;
  if (variantType === EvtVariantType.EvtVarTypeUInt32 || variantType === EvtVariantType.EvtVarTypeHexInt32) return variantBuffer.readUInt32LE(0);
  if (variantType === EvtVariantType.EvtVarTypeUInt64 || variantType === EvtVariantType.EvtVarTypeHexInt64 || variantType === EvtVariantType.EvtVarTypeFileTime) return variantBuffer.readBigUInt64LE(0);

  if (variantType === EvtVariantType.EvtVarTypeString || variantType === EvtVariantType.EvtVarTypeEvtXml) {
    const stringPointerAddress = Number(variantBuffer.readBigUInt64LE(0));

    if (stringPointerAddress === 0) {
      return '';
    }

    return readWidePointer(stringPointerAddress, 4096);
  }

  return null;
}

function readChannelPath(channelEnumHandle: bigint): string | null {
  const bufferUsedBuffer = Buffer.alloc(4);
  void Wevtapi.EvtNextChannelPath(channelEnumHandle, 0, null, bufferUsedBuffer.ptr);

  const requiredCharacters = bufferUsedBuffer.readUInt32LE(0);

  if (requiredCharacters === 0) {
    return null;
  }

  const channelPathBuffer = Buffer.alloc(requiredCharacters * 2);
  const status = Wevtapi.EvtNextChannelPath(channelEnumHandle, requiredCharacters, channelPathBuffer.ptr, bufferUsedBuffer.ptr);

  if (status === FALSE) {
    return null;
  }

  return channelPathBuffer.toString('utf16le').replace(/\0.*$/, '');
}

function readVariantProperty(invoke: (bufferSize: number, propertyBuffer: Buffer | null, usedBuffer: Buffer) => number): bigint | boolean | number | string | null {
  const usedBuffer = Buffer.alloc(4);
  void invoke(0, null, usedBuffer);

  const requiredBytes = usedBuffer.readUInt32LE(0);

  if (requiredBytes === 0) {
    return null;
  }

  const propertyBuffer = Buffer.alloc(requiredBytes);
  const status = invoke(requiredBytes, propertyBuffer, usedBuffer);

  if (status === FALSE) {
    return null;
  }

  return parseVariantValue(propertyBuffer);
}

function toBoolean(value: bigint | boolean | number | string | null): boolean {
  return value === true || value === TRUE;
}

function toBigInt(value: bigint | boolean | number | string | null): bigint {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number') return BigInt(value);
  return 0n;
}

function toStringValue(value: bigint | boolean | number | string | null): string {
  return typeof value === 'string' ? value : '';
}

function typeName(value: bigint | boolean | number | string | null): string {
  if (value === EvtChannelType.EvtChannelTypeAdmin) return 'Admin';
  if (value === EvtChannelType.EvtChannelTypeOperational) return 'Operational';
  if (value === EvtChannelType.EvtChannelTypeAnalytic) return 'Analytic';
  if (value === EvtChannelType.EvtChannelTypeDebug) return 'Debug';
  return 'Unknown';
}

const channelEnumHandle = Wevtapi.EvtOpenChannelEnum(0n, 0);

if (channelEnumHandle === 0n) {
  console.error('EvtOpenChannelEnum failed.');
  process.exit(1);
}

const rows: ChannelReportRow[] = [];

try {
  while (true) {
    const channelPath = readChannelPath(channelEnumHandle);

    if (!channelPath) {
      break;
    }

    const channelPathBuffer = Buffer.from(`${channelPath}\0`, 'utf16le');
    const channelConfigHandle = Wevtapi.EvtOpenChannelConfig(0n, channelPathBuffer.ptr, 0);
    const logHandle = Wevtapi.EvtOpenLog(0n, channelPathBuffer.ptr, EvtOpenLogFlags.EvtOpenChannelPath);

    let autoBackup = false;
    let enabled = false;
    let filePath = '';
    let fileSize = 0n;
    let isFull = false;
    let maxSize = 0n;
    let oldestRecord = 0n;
    let recordCount = 0n;
    let retention = false;
    let typeLabel = 'Unknown';

    try {
      if (channelConfigHandle !== 0n) {
        enabled = toBoolean(
          readVariantProperty((bufferSize, propertyBuffer, usedBuffer) =>
            Wevtapi.EvtGetChannelConfigProperty(channelConfigHandle, EvtChannelConfigPropertyId.EvtChannelConfigEnabled, 0, bufferSize, propertyBuffer?.ptr ?? null, usedBuffer.ptr),
          ),
        );
        autoBackup = toBoolean(
          readVariantProperty((bufferSize, propertyBuffer, usedBuffer) =>
            Wevtapi.EvtGetChannelConfigProperty(channelConfigHandle, EvtChannelConfigPropertyId.EvtChannelLoggingConfigAutoBackup, 0, bufferSize, propertyBuffer?.ptr ?? null, usedBuffer.ptr),
          ),
        );
        filePath = toStringValue(
          readVariantProperty((bufferSize, propertyBuffer, usedBuffer) =>
            Wevtapi.EvtGetChannelConfigProperty(channelConfigHandle, EvtChannelConfigPropertyId.EvtChannelLoggingConfigLogFilePath, 0, bufferSize, propertyBuffer?.ptr ?? null, usedBuffer.ptr),
          ),
        );
        maxSize = toBigInt(
          readVariantProperty((bufferSize, propertyBuffer, usedBuffer) =>
            Wevtapi.EvtGetChannelConfigProperty(channelConfigHandle, EvtChannelConfigPropertyId.EvtChannelLoggingConfigMaxSize, 0, bufferSize, propertyBuffer?.ptr ?? null, usedBuffer.ptr),
          ),
        );
        retention = toBoolean(
          readVariantProperty((bufferSize, propertyBuffer, usedBuffer) =>
            Wevtapi.EvtGetChannelConfigProperty(channelConfigHandle, EvtChannelConfigPropertyId.EvtChannelLoggingConfigRetention, 0, bufferSize, propertyBuffer?.ptr ?? null, usedBuffer.ptr),
          ),
        );
        typeLabel = typeName(
          readVariantProperty((bufferSize, propertyBuffer, usedBuffer) =>
            Wevtapi.EvtGetChannelConfigProperty(channelConfigHandle, EvtChannelConfigPropertyId.EvtChannelConfigType, 0, bufferSize, propertyBuffer?.ptr ?? null, usedBuffer.ptr),
          ),
        );
      }

      if (logHandle !== 0n) {
        fileSize = toBigInt(readVariantProperty((bufferSize, propertyBuffer, usedBuffer) => Wevtapi.EvtGetLogInfo(logHandle, EvtLogPropertyId.EvtLogFileSize, bufferSize, propertyBuffer?.ptr ?? null, usedBuffer.ptr)));
        isFull = toBoolean(readVariantProperty((bufferSize, propertyBuffer, usedBuffer) => Wevtapi.EvtGetLogInfo(logHandle, EvtLogPropertyId.EvtLogFull, bufferSize, propertyBuffer?.ptr ?? null, usedBuffer.ptr)));
        oldestRecord = toBigInt(readVariantProperty((bufferSize, propertyBuffer, usedBuffer) => Wevtapi.EvtGetLogInfo(logHandle, EvtLogPropertyId.EvtLogOldestRecordNumber, bufferSize, propertyBuffer?.ptr ?? null, usedBuffer.ptr)));
        recordCount = toBigInt(readVariantProperty((bufferSize, propertyBuffer, usedBuffer) => Wevtapi.EvtGetLogInfo(logHandle, EvtLogPropertyId.EvtLogNumberOfLogRecords, bufferSize, propertyBuffer?.ptr ?? null, usedBuffer.ptr)));
      }
    } finally {
      if (channelConfigHandle !== 0n) {
        void Wevtapi.EvtClose(channelConfigHandle);
      }

      if (logHandle !== 0n) {
        void Wevtapi.EvtClose(logHandle);
      }
    }

    rows.push({
      autoBackup,
      enabled,
      filePath,
      fileSize,
      isFull,
      maxSize,
      name: channelPath,
      oldestRecord,
      recordCount,
      retention,
      typeName: typeLabel,
    });
  }
} finally {
  void Wevtapi.EvtClose(channelEnumHandle);
}

rows.sort((left, right) => {
  if (left.fileSize === right.fileSize) {
    return left.name.localeCompare(right.name);
  }

  return left.fileSize > right.fileSize ? -1 : 1;
});

const enabledCount = rows.filter((row) => row.enabled).length;
const analyticCount = rows.filter((row) => row.typeName === 'Analytic').length;
const autoBackupCount = rows.filter((row) => row.autoBackup).length;
const debugCount = rows.filter((row) => row.typeName === 'Debug').length;
const totalSize = rows.reduce((sum, row) => sum + row.fileSize, 0n);
const totalRecords = rows.reduce((sum, row) => sum + row.recordCount, 0n);

console.log('\x1b[1;96mWindows Event Log Channel Report\x1b[0m');
console.log(`Generated: ${new Date().toLocaleString()}`);
console.log();
console.log(`Channels discovered : ${rows.length.toLocaleString()}`);
console.log(`Enabled channels   : ${enabledCount.toLocaleString()}`);
console.log(`Analytic channels  : ${analyticCount.toLocaleString()}`);
console.log(`Debug channels     : ${debugCount.toLocaleString()}`);
console.log(`Auto-backup        : ${autoBackupCount.toLocaleString()}`);
console.log(`Total records      : ${formatCount(totalRecords)}`);
console.log(`Total on-disk size : ${formatBytes(totalSize)}`);
console.log();
console.log(`Top ${Math.min(MAX_DISPLAY_ROWS, rows.length)} channels by log size`);
console.log(`  ${'Channel'.padEnd(38)} ${'State'.padEnd(8)} ${'Type'.padEnd(12)} ${'Records'.padStart(12)} ${'Size'.padStart(10)} ${'Max'.padStart(10)} ${'Flags'.padEnd(12)} File`);
console.log(`  ${''.padEnd(38, '-')} ${''.padEnd(8, '-')} ${''.padEnd(12, '-')} ${''.padEnd(12, '-')} ${''.padEnd(10, '-')} ${''.padEnd(10, '-')} ${''.padEnd(12, '-')} ${''.padEnd(40, '-')}`);

for (const row of rows.slice(0, MAX_DISPLAY_ROWS)) {
  const channelLabel = row.name.length > 38 ? `${row.name.slice(0, 37)}…` : row.name;
  const flagLabel = `${row.retention ? 'RET' : '   '} ${row.autoBackup ? 'ABK' : '   '} ${row.isFull ? 'FULL' : '    '}`.trimEnd();
  const fileLabel = row.filePath ? (row.filePath.split('\0')[0] ?? '(default)') : '(default)';

  console.log(
    `  ${channelLabel.padEnd(38)} ${`${row.enabled ? '\x1b[32menabled\x1b[0m' : '\x1b[2mdisabled\x1b[0m'}`.padEnd(17)} ${row.typeName.padEnd(12)} ${formatCount(row.recordCount).padStart(12)} ${formatBytes(row.fileSize).padStart(10)} ${formatBytes(row.maxSize).padStart(10)} ${flagLabel.padEnd(12)} ${fileLabel}`,
  );
}

console.log();
console.log('\x1b[2mSet WEVTAPI_CHANNEL_LIMIT to adjust the number of rows shown during testing.\x1b[0m');
