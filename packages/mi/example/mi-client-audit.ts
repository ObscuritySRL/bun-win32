/**
 * MI Client Audit
 *
 * Performs a diagnostic bootstrap of the Windows Management Infrastructure
 * client API, then prints the exact addresses involved in the lifecycle:
 * the exported `mi_clientFT_V1` data symbol, the returned `MI_Application.ft`
 * pointer, the individual `MI_ClientFT_V1` member slots, and the inline
 * `MI_Application_Close` procedure pointer used for shutdown.
 *
 * APIs demonstrated:
 *   - Mi.MI_Application_InitializeV1 (initialize MI client infrastructure)
 *   - Kernel32.GetCurrentProcess     (obtain a pseudo-handle for local memory reads)
 *   - Kernel32.GetModuleHandleW      (resolve the loaded `mi.dll` module)
 *   - Kernel32.GetProcAddress        (resolve the exported `mi_clientFT_V1` data symbol)
 *   - Kernel32.ReadProcessMemory     (read exported tables and close pointers from the current process)
 *
 * Run: bun run example/mi-client-audit.ts
 */

import { FFIType, linkSymbols } from 'bun:ffi';

import Mi, { MI_Result } from '../index';
import Kernel32 from '@bun-win32/kernel32';

const ANSI = {
  bold: '\x1b[1m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
  yellow: '\x1b[33m',
} as const;

const CLIENT_FUNCTION_TABLE_MEMBER_NAMES = [
  'applicationFT',
  'sessionFT',
  'operationFT',
  'hostedProviderFT',
  'serializerFT',
  'deserializerFT',
  'subscribeDeliveryOptionsFT',
  'destinationOptionsFT',
  'operationOptionsFT',
  'utilitiesFT',
] as const;

const MI_APPLICATION_FUNCTION_TABLE_OFFSET = 0x10;
const MI_APPLICATION_SIZE = 0x18;
const POINTER_SIZE = 0x08;
const currentProcessHandle = Kernel32.GetCurrentProcess();

Mi.Preload('MI_Application_InitializeV1');
Kernel32.Preload(['GetCurrentProcess', 'GetLastError', 'GetModuleHandleW', 'GetProcAddress', 'ReadProcessMemory']);

function createWideStringBuffer(value: string): Buffer {
  return Buffer.from(value + '\0', 'utf16le');
}

function createAnsiStringBuffer(value: string): Buffer {
  return Buffer.from(value + '\0', 'utf8');
}

function formatAddress(address: bigint | number): string {
  const normalizedAddress = typeof address === 'bigint' ? address : BigInt(address);
  return `0x${normalizedAddress.toString(16).padStart(16, '0')}`;
}

function formatMiResult(result: MI_Result): string {
  return MI_Result[result] ?? `MI_Result(${result})`;
}

function printDetailRows(rows: readonly [string, string][]): void {
  const longestLabelLength = Math.max(...rows.map(([label]) => label.length));

  for (const [label, value] of rows) {
    console.log(`  ${ANSI.dim}${label.padEnd(longestLabelLength, ' ')}${ANSI.reset}  ${value}`);
  }
}

function readPointerValue(address: bigint): bigint {
  const valueBuffer = Buffer.alloc(POINTER_SIZE);
  const readResult = Kernel32.ReadProcessMemory(currentProcessHandle, address, valueBuffer.ptr, BigInt(valueBuffer.length), 0n);

  if (readResult === 0) {
    throw new Error(`ReadProcessMemory failed with ${Kernel32.GetLastError()}`);
  }

  return valueBuffer.readBigUInt64LE(0);
}

function resolveClientFunctionTableExportAddress(): number {
  const moduleNameBuffer = createWideStringBuffer('mi.dll');
  const moduleHandle = Kernel32.GetModuleHandleW(moduleNameBuffer.ptr);

  if (moduleHandle === 0n) {
    throw new Error(`GetModuleHandleW(mi.dll) failed with ${Kernel32.GetLastError()}`);
  }

  const exportNameBuffer = createAnsiStringBuffer('mi_clientFT_V1');
  const exportAddress = Kernel32.GetProcAddress(moduleHandle, exportNameBuffer.ptr);

  if (exportAddress === null) {
    throw new Error(`GetProcAddress(mi_clientFT_V1) failed with ${Kernel32.GetLastError()}`);
  }

  return exportAddress;
}

function closeApplication(applicationBuffer: Buffer): { closeProcedureAddress: bigint; result: MI_Result } {
  const applicationFunctionTableAddress = applicationBuffer.readBigUInt64LE(MI_APPLICATION_FUNCTION_TABLE_OFFSET);
  const closeProcedureAddress = readPointerValue(applicationFunctionTableAddress);
  const closeLibrary = linkSymbols({
    Close: {
      ptr: closeProcedureAddress,
      args: [FFIType.ptr],
      returns: FFIType.u32,
    },
  });

  try {
    return {
      closeProcedureAddress,
      result: closeLibrary.symbols.Close(applicationBuffer.ptr),
    };
  } finally {
    closeLibrary.close();
  }
}

const applicationIDBuffer = createWideStringBuffer(`bun-win32/mi/client-audit/${process.pid}`);
const applicationBuffer = Buffer.alloc(MI_APPLICATION_SIZE);
const extendedErrorBuffer = Buffer.alloc(POINTER_SIZE);
const initializeStatus = Mi.MI_Application_InitializeV1(0, applicationIDBuffer.ptr, extendedErrorBuffer.ptr, applicationBuffer.ptr);
let closeProcedureAddress = 0n;
let closeStatus: MI_Result | null = null;

try {
  console.log(`${ANSI.bold}${ANSI.cyan}MI Client Audit${ANSI.reset}`);

  if (initializeStatus !== MI_Result.MI_RESULT_OK) {
    printDetailRows([
      ['Initialize', formatMiResult(initializeStatus)],
      ['Extended error pointer', formatAddress(extendedErrorBuffer.readBigUInt64LE(0))],
    ]);
    process.exitCode = 1;
  } else {
    const clientFunctionTableExportAddress = resolveClientFunctionTableExportAddress();
    const clientFunctionTableAddress = readPointerValue(BigInt(clientFunctionTableExportAddress));
    const applicationFunctionTableAddress = applicationBuffer.readBigUInt64LE(MI_APPLICATION_FUNCTION_TABLE_OFFSET);
    const clientFunctionTableEntries = CLIENT_FUNCTION_TABLE_MEMBER_NAMES.map((memberName, index) => ({
      memberName,
      value: readPointerValue(clientFunctionTableAddress + BigInt(index * POINTER_SIZE)),
    }));

    printDetailRows([
      ['Initialize', formatMiResult(initializeStatus)],
      ['Extended error pointer', formatAddress(extendedErrorBuffer.readBigUInt64LE(0))],
      ['MI_Application buffer', formatAddress(BigInt(applicationBuffer.ptr))],
      ['MI_Application.ft', formatAddress(applicationFunctionTableAddress)],
      ['mi_clientFT_V1 export', formatAddress(clientFunctionTableExportAddress)],
      ['MI_ClientFT_V1 table', formatAddress(clientFunctionTableAddress)],
    ]);

    console.log('');
    console.log(`${ANSI.bold}MI_ClientFT_V1 members${ANSI.reset}`);

    for (const entry of clientFunctionTableEntries) {
      console.log(`  ${entry.memberName.padEnd(28, ' ')} ${entry.value === 0n ? `${ANSI.red}(null)${ANSI.reset}` : `${ANSI.green}${formatAddress(entry.value)}${ANSI.reset}`}`);
    }
  }
} finally {
  if (initializeStatus === MI_Result.MI_RESULT_OK) {
    const closeOutcome = closeApplication(applicationBuffer);
    closeProcedureAddress = closeOutcome.closeProcedureAddress;
    closeStatus = closeOutcome.result;

    console.log('');
    console.log(`${ANSI.bold}Shutdown${ANSI.reset}`);
    printDetailRows([
      ['Close procedure', formatAddress(closeProcedureAddress)],
      ['Close result', formatMiResult(closeStatus)],
    ]);

    if (closeStatus !== MI_Result.MI_RESULT_OK) {
      process.exitCode = 1;
    }
  }
}
