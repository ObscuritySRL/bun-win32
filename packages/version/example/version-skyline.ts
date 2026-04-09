/**
 * Version Skyline
 *
 * Opens a curated set of Windows binaries, loads their version resources
 * through handle-based queries, and renders a colorful ANSI skyline where each
 * tower height is derived from the file's build number. The scan animates as
 * files are processed, then prints a legend with the exact version metadata.
 *
 * APIs demonstrated:
 *   - Version.GetFileVersionInfoByHandle (load version info from an open handle)
 *   - Version.VerQueryValueW             (extract fixed info and string values)
 *   - Kernel32.CreateFileW              (open binaries for handle-based queries)
 *   - Kernel32.CloseHandle              (release file handles)
 *   - Kernel32.LocalFree                (free version.dll-allocated buffers)
 *
 * Run: bun run example/version-skyline.ts
 */

import { read, type Pointer } from 'bun:ffi';
import { basename } from 'node:path';

import Version, { FileVersionGetFlags, VersionFileType } from '../index';
import Kernel32, { FileAccess, FileAttributes, FileCreationDisposition, FileShareMode, INVALID_HANDLE_VALUE } from '@bun-win32/kernel32';

Version.Preload(['GetFileVersionInfoByHandle', 'VerQueryValueW']);
Kernel32.Preload(['CloseHandle', 'CreateFileW', 'GetCurrentProcess', 'GetLastError', 'LocalFree', 'ReadProcessMemory']);

const ANSI = {
  blue: '\x1b[94m',
  cyan: '\x1b[96m',
  dim: '\x1b[2m',
  green: '\x1b[92m',
  magenta: '\x1b[95m',
  red: '\x1b[91m',
  reset: '\x1b[0m',
  white: '\x1b[97m',
  yellow: '\x1b[93m',
} as const;

const DEFAULT_TARGET_PATHS = [
  process.execPath,
  'C:\\Windows\\System32\\kernel32.dll',
  'C:\\Windows\\System32\\user32.dll',
  'C:\\Windows\\System32\\gdi32.dll',
  'C:\\Windows\\System32\\version.dll',
  'C:\\Windows\\System32\\ntdll.dll',
  'C:\\Windows\\System32\\cmd.exe',
  'C:\\Windows\\System32\\notepad.exe',
];

const COLOR_PALETTE = [ANSI.blue, ANSI.cyan, ANSI.green, ANSI.magenta, ANSI.red, ANSI.white, ANSI.yellow] as const;
const FIXED_FILE_INFO_SIZE_BYTES = 52;
const CURRENT_PROCESS_HANDLE = Kernel32.GetCurrentProcess();

interface SkylineEntry {
  buildNumber: number;
  color: string;
  companyName: string;
  fileName: string;
  fileType: string;
  productName: string;
  version: string;
}

function createWideStringBuffer(value: string): Buffer {
  return Buffer.from(value + '\0', 'utf16le');
}

function formatHex16(value: number): string {
  return value.toString(16).padStart(4, '0');
}

function formatVersion(msValue: number, lsValue: number): string {
  return `${msValue >>> 16}.${msValue & 0xffff}.${lsValue >>> 16}.${lsValue & 0xffff}`;
}

function readMemory(pointerAddress: number, byteCount: number): Buffer {
  const outputBuffer = Buffer.alloc(byteCount);
  const readResult = Kernel32.ReadProcessMemory(CURRENT_PROCESS_HANDLE, BigInt(pointerAddress), outputBuffer.ptr, BigInt(byteCount), 0n);

  if (readResult === 0) {
    throw new Error(`ReadProcessMemory failed with ${Kernel32.GetLastError()}`);
  }

  return outputBuffer;
}

function queryValueAddress(versionBlockPointer: Pointer, subBlock: string): { address: number; length: number } | null {
  const subBlockBuffer = createWideStringBuffer(subBlock);
  const valueLengthBuffer = Buffer.alloc(4);
  const valuePointerBuffer = Buffer.alloc(8);
  const queryResult = Version.VerQueryValueW(versionBlockPointer, subBlockBuffer.ptr, valuePointerBuffer.ptr, valueLengthBuffer.ptr);

  if (queryResult === 0) {
    return null;
  }

  const valuePointerAddress = read.ptr(valuePointerBuffer.ptr);

  if (valuePointerAddress === 0) {
    return null;
  }

  return {
    address: valuePointerAddress,
    length: valueLengthBuffer.readUInt32LE(0),
  };
}

function readWideString(pointerAddress: number, characterCount: number): string {
  const byteCount = Math.max(characterCount, 1) * 2;
  const raw = readMemory(pointerAddress, byteCount);
  return raw.toString('utf16le').replace(/\0.*$/, '');
}

function readFixedFileInfo(versionBlockPointer: Pointer) {
  const fixedFileInfo = queryValueAddress(versionBlockPointer, '\\');

  if (fixedFileInfo === null || fixedFileInfo.length < FIXED_FILE_INFO_SIZE_BYTES) {
    return null;
  }

  const fixedFileInfoBuffer = readMemory(fixedFileInfo.address, fixedFileInfo.length);
  const fileVersionMs = fixedFileInfoBuffer.readUInt32LE(8);
  const fileVersionLs = fixedFileInfoBuffer.readUInt32LE(12);

  return {
    buildNumber: fileVersionLs >>> 16,
    fileType: fixedFileInfoBuffer.readUInt32LE(36),
    version: formatVersion(fileVersionMs, fileVersionLs),
  };
}

function readTranslationEntries(versionBlockPointer: Pointer): { codePage: number; languageId: number }[] {
  const translationBlock = queryValueAddress(versionBlockPointer, '\\VarFileInfo\\Translation');

  if (translationBlock === null || translationBlock.length < 4) {
    return [];
  }

  const translationBuffer = readMemory(translationBlock.address, translationBlock.length);
  const translationEntries: { codePage: number; languageId: number }[] = [];

  for (let offset = 0; offset + 4 <= translationBuffer.byteLength; offset += 4) {
    translationEntries.push({
      codePage: translationBuffer.readUInt16LE(offset + 2),
      languageId: translationBuffer.readUInt16LE(offset),
    });
  }

  return translationEntries;
}

function queryStringValue(versionBlockPointer: Pointer, languageId: number, codePage: number, key: string): string | null {
  const queryPath = `\\StringFileInfo\\${formatHex16(languageId)}${formatHex16(codePage)}\\${key}`;
  const valueResult = queryValueAddress(versionBlockPointer, queryPath);

  if (valueResult === null || valueResult.length === 0) {
    return null;
  }

  return readWideString(valueResult.address, valueResult.length);
}

function shortenLabel(fileName: string): string {
  const fileStem = fileName.replace(/\.[^.]+$/, '');
  return fileStem.length >= 4 ? fileStem.slice(0, 4) : fileStem.padEnd(4, ' ');
}

function renderSkyline(entries: SkylineEntry[], statusLine: string): void {
  const chartHeight = 12;
  const maximumBuildNumber = Math.max(...entries.map((entry) => entry.buildNumber), 1);

  process.stdout.write('\x1b[2J\x1b[H');
  console.log(`${ANSI.white}Version Skyline${ANSI.reset}`);
  console.log(`${ANSI.dim}${statusLine}${ANSI.reset}`);
  console.log('');

  for (let currentRow = chartHeight; currentRow >= 1; currentRow--) {
    let row = '  ';

    for (const entry of entries) {
      const barHeight = Math.max(1, Math.round((entry.buildNumber / maximumBuildNumber) * chartHeight));
      row += barHeight >= currentRow ? `${entry.color}██${ANSI.reset}  ` : '    ';
    }

    console.log(row);
  }

  let labelRow = '  ';

  for (const entry of entries) {
    labelRow += `${shortenLabel(entry.fileName)} `;
  }

  console.log(labelRow);
  console.log('');

  for (const entry of entries) {
    console.log(
      `  ${entry.color}██${ANSI.reset} ${entry.fileName.padEnd(16, ' ')} ${ANSI.white}${entry.version.padEnd(18, ' ')}${ANSI.reset} ${entry.fileType.padEnd(12, ' ')} ${entry.companyName || entry.productName || '(no string data)'}`,
    );
  }
}

function loadSkylineEntry(filePath: string, colorIndex: number): SkylineEntry {
  const filePathBuffer = createWideStringBuffer(filePath);
  const versionBlockLengthBuffer = Buffer.alloc(4);
  const versionBlockPointerBuffer = Buffer.alloc(8);
  let versionBlockAddress = 0;
  const fileHandle = Kernel32.CreateFileW(
    filePathBuffer.ptr,
    FileAccess.GENERIC_READ,
    FileShareMode.FILE_SHARE_DELETE | FileShareMode.FILE_SHARE_READ | FileShareMode.FILE_SHARE_WRITE,
    null!,
    FileCreationDisposition.OPEN_EXISTING,
    FileAttributes.FILE_ATTRIBUTE_NORMAL,
    0n,
  );

  if (fileHandle === INVALID_HANDLE_VALUE) {
    throw new Error(`CreateFileW failed with ${Kernel32.GetLastError()}`);
  }

  try {
    const loadResult = Version.GetFileVersionInfoByHandle(FileVersionGetFlags.FILE_VER_GET_NEUTRAL, fileHandle, versionBlockPointerBuffer.ptr, versionBlockLengthBuffer.ptr);

    versionBlockAddress = read.ptr(versionBlockPointerBuffer.ptr);

    if (loadResult === 0) {
      const errorCode = Kernel32.GetLastError();

      if (versionBlockAddress !== 0) {
        void Kernel32.LocalFree(BigInt(versionBlockAddress));
        versionBlockAddress = 0;
      }

      throw new Error(`GetFileVersionInfoByHandle failed with ${errorCode}`);
    }

    if (versionBlockAddress === 0) {
      throw new Error('GetFileVersionInfoByHandle returned a null version block');
    }

    const versionBlockBuffer = readMemory(versionBlockAddress, versionBlockLengthBuffer.readUInt32LE(0));
    const versionBlockPointer = versionBlockBuffer.ptr;
    const fixedFileInfo = readFixedFileInfo(versionBlockPointer);

    if (fixedFileInfo === null) {
      throw new Error('VS_FIXEDFILEINFO is missing');
    }

    const translationEntries = readTranslationEntries(versionBlockPointer);
    const translationCandidates = translationEntries.length > 0 ? translationEntries : [{ codePage: 0x04b0, languageId: 0x0409 }];
    let companyName = '';
    let productName = '';

    for (const translation of translationCandidates) {
      if (companyName.length === 0) {
        companyName = queryStringValue(versionBlockPointer, translation.languageId, translation.codePage, 'CompanyName') ?? '';
      }

      if (productName.length === 0) {
        productName = queryStringValue(versionBlockPointer, translation.languageId, translation.codePage, 'ProductName') ?? '';
      }
    }

    return {
      buildNumber: fixedFileInfo.buildNumber,
      color: COLOR_PALETTE[colorIndex % COLOR_PALETTE.length],
      companyName,
      fileName: basename(filePath),
      fileType: VersionFileType[fixedFileInfo.fileType] ?? `0x${fixedFileInfo.fileType.toString(16).padStart(8, '0')}`,
      productName,
      version: fixedFileInfo.version,
    };
  } finally {
    void Kernel32.CloseHandle(fileHandle);

    if (versionBlockAddress !== 0) {
      void Kernel32.LocalFree(BigInt(versionBlockAddress));
    }
  }
}

const requestedTargetPaths = Bun.argv.slice(2);
const targetPaths = [...new Set(requestedTargetPaths.length > 0 ? requestedTargetPaths : DEFAULT_TARGET_PATHS)];
const skylineEntries: SkylineEntry[] = [];
const failedPaths: string[] = [];

renderSkyline([], `Preparing to scan ${targetPaths.length} file(s)...`);
await Bun.sleep(120);

for (let index = 0; index < targetPaths.length; index++) {
  const filePath = targetPaths[index];

  try {
    skylineEntries.push(loadSkylineEntry(filePath, index));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    failedPaths.push(`${basename(filePath)}: ${message}`);
  }

  renderSkyline(skylineEntries, `Scanned ${index + 1}/${targetPaths.length}: ${basename(filePath)}`);
  await Bun.sleep(120);
}

renderSkyline(skylineEntries, `Completed skyline from ${skylineEntries.length} successful scan(s)`);

if (failedPaths.length > 0) {
  console.log('');
  console.log(`${ANSI.red}Failures${ANSI.reset}`);

  for (const failedPath of failedPaths) {
    console.log(`  ${failedPath}`);
  }
}
