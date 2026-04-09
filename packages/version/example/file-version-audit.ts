/**
 * File Version Audit
 *
 * Audits one or more EXE and DLL files and prints a detailed version-resource
 * report: fixed file info, translation table entries, common string-table
 * fields, and decoded file flags/types. The report is designed for diagnostics,
 * release forensics, and installer validation work.
 *
 * APIs demonstrated:
 *   - Version.GetFileVersionInfoSizeExW (size a version-resource block)
 *   - Version.GetFileVersionInfoExW     (load a version-resource block)
 *   - Version.VerQueryValueW            (query fixed info, strings, translations)
 *   - Kernel32.GetLastError             (surface Win32 failure details)
 *   - Kernel32.VerLanguageNameW         (expand language identifiers)
 *
 * Run: bun run example/file-version-audit.ts
 */

import { read, type Pointer } from 'bun:ffi';
import { basename } from 'node:path';

import Version, { FileVersionGetFlags, VersionFileDriverSubtype, VersionFileFlags, VersionFileFontSubtype, VersionFileOS, VersionFileType } from '../index';
import Kernel32 from '@bun-win32/kernel32';

Version.Preload(['GetFileVersionInfoExW', 'GetFileVersionInfoSizeExW', 'VerQueryValueW']);
Kernel32.Preload(['GetCurrentProcess', 'GetLastError', 'ReadProcessMemory', 'VerLanguageNameW']);

const ANSI = {
  bold: '\x1b[1m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
  yellow: '\x1b[33m',
} as const;

const DEFAULT_TARGET_PATHS = [process.execPath, 'C:\\Windows\\System32\\kernel32.dll', 'C:\\Windows\\System32\\user32.dll', 'C:\\Windows\\System32\\version.dll', 'C:\\Windows\\explorer.exe', 'C:\\Windows\\System32\\notepad.exe'];

const COMMON_STRING_KEYS = ['CompanyName', 'FileDescription', 'FileVersion', 'InternalName', 'OriginalFilename', 'ProductName', 'ProductVersion'] as const;

const FIXED_FILE_INFO_SIZE_BYTES = 52;
const CURRENT_PROCESS_HANDLE = Kernel32.GetCurrentProcess();

function createWideStringBuffer(value: string): Buffer {
  return Buffer.from(value + '\0', 'utf16le');
}

function formatHex16(value: number): string {
  return value.toString(16).padStart(4, '0');
}

function formatVersion(msValue: number, lsValue: number): string {
  return `${msValue >>> 16}.${msValue & 0xffff}.${lsValue >>> 16}.${lsValue & 0xffff}`;
}

function getLanguageName(languageIdentifier: number): string {
  const languageBuffer = Buffer.alloc(256);
  const languageLength = Kernel32.VerLanguageNameW(languageIdentifier, languageBuffer.ptr, languageBuffer.byteLength / 2);

  if (languageLength === 0) {
    return `0x${formatHex16(languageIdentifier)}`;
  }

  return languageBuffer.toString('utf16le').replace(/\0.*$/, '');
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

  return {
    fileFlags: fixedFileInfoBuffer.readUInt32LE(28),
    fileFlagsMask: fixedFileInfoBuffer.readUInt32LE(24),
    fileOS: fixedFileInfoBuffer.readUInt32LE(32),
    fileSubtype: fixedFileInfoBuffer.readUInt32LE(40),
    fileType: fixedFileInfoBuffer.readUInt32LE(36),
    fileVersion: formatVersion(fixedFileInfoBuffer.readUInt32LE(8), fixedFileInfoBuffer.readUInt32LE(12)),
    productVersion: formatVersion(fixedFileInfoBuffer.readUInt32LE(16), fixedFileInfoBuffer.readUInt32LE(20)),
    signature: fixedFileInfoBuffer.readUInt32LE(0),
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

function describeFileFlags(fileFlags: number): string {
  const activeFlags = [
    [VersionFileFlags.VS_FF_DEBUG, 'DEBUG'],
    [VersionFileFlags.VS_FF_INFOINFERRED, 'INFOINFERRED'],
    [VersionFileFlags.VS_FF_PATCHED, 'PATCHED'],
    [VersionFileFlags.VS_FF_PRERELEASE, 'PRERELEASE'],
    [VersionFileFlags.VS_FF_PRIVATEBUILD, 'PRIVATEBUILD'],
    [VersionFileFlags.VS_FF_SPECIALBUILD, 'SPECIALBUILD'],
  ].filter(([flagValue]) => (fileFlags & Number(flagValue)) !== 0);

  if (activeFlags.length === 0) {
    return 'None';
  }

  return activeFlags.map(([, label]) => label).join(', ');
}

function describeFileOS(fileOS: number): string {
  const description = VersionFileOS[fileOS];
  return description ?? `0x${fileOS.toString(16).padStart(8, '0')}`;
}

function describeFileType(fileType: number, fileSubtype: number): string {
  const fileTypeName = VersionFileType[fileType] ?? `0x${fileType.toString(16).padStart(8, '0')}`;

  if (fileType === VersionFileType.VFT_DRV) {
    const driverSubtypeName = VersionFileDriverSubtype[fileSubtype] ?? `0x${fileSubtype.toString(16).padStart(8, '0')}`;
    return `${fileTypeName} (${driverSubtypeName})`;
  }

  if (fileType === VersionFileType.VFT_FONT) {
    const fontSubtypeName = VersionFileFontSubtype[fileSubtype] ?? `0x${fileSubtype.toString(16).padStart(8, '0')}`;
    return `${fileTypeName} (${fontSubtypeName})`;
  }

  return fileTypeName;
}

function printDetailRows(rows: readonly [string, string][]): void {
  const longestLabelLength = Math.max(...rows.map(([label]) => label.length));

  for (const [label, value] of rows) {
    const paddedLabel = label.padEnd(longestLabelLength, ' ');
    console.log(`  ${ANSI.dim}${paddedLabel}${ANSI.reset}  ${value}`);
  }
}

function loadVersionBlock(filePath: string): { pointer: Pointer; versionBlockBuffer: Buffer } {
  const filePathBuffer = createWideStringBuffer(filePath);
  const sizeHintBuffer = Buffer.alloc(4);
  const versionBlockSize = Version.GetFileVersionInfoSizeExW(FileVersionGetFlags.FILE_VER_GET_NEUTRAL, filePathBuffer.ptr, sizeHintBuffer.ptr);

  if (versionBlockSize === 0) {
    throw new Error(`GetFileVersionInfoSizeExW failed with ${Kernel32.GetLastError()}`);
  }

  const versionBlockBuffer = Buffer.alloc(versionBlockSize);
  const loadResult = Version.GetFileVersionInfoExW(FileVersionGetFlags.FILE_VER_GET_NEUTRAL, filePathBuffer.ptr, 0, versionBlockSize, versionBlockBuffer.ptr);

  if (loadResult === 0) {
    throw new Error(`GetFileVersionInfoExW failed with ${Kernel32.GetLastError()}`);
  }

  return {
    pointer: versionBlockBuffer.ptr,
    versionBlockBuffer,
  };
}

const requestedTargetPaths = Bun.argv.slice(2);
const targetPaths = [...new Set(requestedTargetPaths.length > 0 ? requestedTargetPaths : DEFAULT_TARGET_PATHS)];

console.log(`${ANSI.bold}${ANSI.cyan}File Version Audit${ANSI.reset}`);
console.log(`${ANSI.dim}Inspecting ${targetPaths.length} file(s) through version.dll${ANSI.reset}`);
console.log('');

for (const filePath of targetPaths) {
  console.log(`${ANSI.bold}${basename(filePath)}${ANSI.reset}`);
  console.log(`  ${ANSI.dim}${filePath}${ANSI.reset}`);

  try {
    const { pointer: versionBlockPointer } = loadVersionBlock(filePath);
    const fixedFileInfo = readFixedFileInfo(versionBlockPointer);

    if (fixedFileInfo === null) {
      throw new Error('root VS_FIXEDFILEINFO block is missing');
    }

    const discoveredTranslations = readTranslationEntries(versionBlockPointer);
    const translationCandidates = discoveredTranslations.length > 0 ? discoveredTranslations : [{ codePage: 0x04b0, languageId: 0x0409 }];
    const stringValues = new Map<string, string>();

    for (const key of COMMON_STRING_KEYS) {
      for (const translation of translationCandidates) {
        const queriedValue = queryStringValue(versionBlockPointer, translation.languageId, translation.codePage, key);

        if (queriedValue !== null && queriedValue.length > 0) {
          stringValues.set(key, queriedValue);
          break;
        }
      }
    }

    const translationSummary = translationCandidates.map((translation) => `${getLanguageName(translation.languageId)} (${formatHex16(translation.languageId)}/${formatHex16(translation.codePage)})`).join('; ');

    printDetailRows([
      ['File Version', `${ANSI.green}${fixedFileInfo.fileVersion}${ANSI.reset}`],
      ['Product Version', fixedFileInfo.productVersion],
      ['File Type', describeFileType(fixedFileInfo.fileType, fixedFileInfo.fileSubtype)],
      ['File OS', describeFileOS(fixedFileInfo.fileOS)],
      ['File Flags', describeFileFlags(fixedFileInfo.fileFlags)],
      ['Flags Mask', `0x${fixedFileInfo.fileFlagsMask.toString(16).padStart(8, '0')}`],
      ['Signature', `0x${fixedFileInfo.signature.toString(16).padStart(8, '0')}`],
      ['Translations', translationSummary],
      ['Company Name', stringValues.get('CompanyName') ?? '(not present)'],
      ['File Description', stringValues.get('FileDescription') ?? '(not present)'],
      ['FileVersion String', stringValues.get('FileVersion') ?? '(not present)'],
      ['Internal Name', stringValues.get('InternalName') ?? '(not present)'],
      ['Original Filename', stringValues.get('OriginalFilename') ?? '(not present)'],
      ['Product Name', stringValues.get('ProductName') ?? '(not present)'],
      ['ProductVersion String', stringValues.get('ProductVersion') ?? '(not present)'],
    ]);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`  ${ANSI.red}Audit failed:${ANSI.reset} ${message}`);
  }

  console.log('');
}
