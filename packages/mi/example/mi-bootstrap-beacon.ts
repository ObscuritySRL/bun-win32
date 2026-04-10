/**
 * MI Bootstrap Beacon
 *
 * Boots the MI client, opens a real local CIM session against `root/cimv2`,
 * queries `Win32_OperatingSystem` and `Win32_Process`, and renders a live
 * system-memory board driven entirely by the MI application, session,
 * operation, and instance function tables.
 *
 * APIs demonstrated:
 *   - Mi.MI_Application_InitializeV1 (initialize the MI client runtime)
 *   - MI_Application.ft->NewSession  (open a local CIM session)
 *   - MI_Session.ft->QueryInstances  (run synchronous WQL queries)
 *   - MI_Operation.ft->GetInstance   (pull result instances synchronously)
 *   - MI_Operation.ft->Close         (close completed query operations)
 *   - MI_Session.ft->Close           (close the CIM session)
 *   - MI_Application.ft->Close       (shut the MI runtime down)
 *   - MI_Instance.ft->GetElement     (read typed properties from returned instances)
 *   - Kernel32.GetCurrentProcess     (obtain a pseudo-handle for local memory reads)
 *   - Kernel32.GetLastError          (diagnose failed local pointer reads)
 *   - Kernel32.ReadProcessMemory     (read MI function-table slots and string pointers)
 *
 * Run: bun run example/mi-bootstrap-beacon.ts
 */

import { FFIType, linkSymbols, type Pointer } from 'bun:ffi';

import Mi, { MI_Result } from '../index';
import Kernel32 from '@bun-win32/kernel32';

const ANSI = {
  bold: '\x1b[1m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
  white: '\x1b[97m',
  yellow: '\x1b[33m',
} as const;

const MI_APPLICATION_CLOSE_OFFSET = 0x00;
const MI_APPLICATION_NEW_SESSION_OFFSET = 0x08;
const MI_FLAG_NULL = 1 << 29;
const MI_FUNCTION_TABLE_OFFSET = 0x10;
const MI_INSTANCE_FT_OFFSET = 0x00;
const MI_INSTANCE_GET_ELEMENT_OFFSET = 0x58;
const MI_OBJECT_SIZE = 0x18;
const MI_OPERATION_CLOSE_OFFSET = 0x00;
const MI_OPERATION_GET_INSTANCE_OFFSET = 0x18;
const MI_SESSION_CLOSE_OFFSET = 0x00;
const MI_SESSION_QUERY_INSTANCES_OFFSET = 0x40;
const MI_TYPE_STRING = 13;
const MI_TYPE_UINT32 = 5;
const MI_TYPE_UINT64 = 7;
const MI_VALUE_BUFFER_SIZE = 0x40;
const PROCESS_BAR_WIDTH = 24;
const PROCESS_ROW_LIMIT = 10;
const POINTER_SIZE = 0x08;
const QUERY_DIALECT = 'WQL';
const SYSTEM_NAMESPACE = 'root/cimv2';

const currentProcessHandle = Kernel32.GetCurrentProcess();

interface InstanceProperty {
  flags: number;
  type: number;
  valueBuffer: Buffer;
}

type PointerArgument = Buffer | Pointer | null;

interface ApplicationCloseLibrary {
  close(): void;
  symbols: {
    Close(application: PointerArgument): number;
  };
}

interface ApplicationNewSessionLibrary {
  close(): void;
  symbols: {
    NewSession(
      application: PointerArgument,
      protocol: PointerArgument,
      destination: PointerArgument,
      options: PointerArgument,
      callbacks: PointerArgument,
      extendedError: PointerArgument,
      session: PointerArgument,
    ): number;
  };
}

interface InstanceGetElementLibrary {
  close(): void;
  symbols: {
    GetElement(
      self: bigint,
      name: PointerArgument,
      value: PointerArgument,
      type: PointerArgument,
      flags: PointerArgument,
      index: PointerArgument,
    ): number;
  };
}

interface OperationCloseLibrary {
  close(): void;
  symbols: {
    Close(operation: PointerArgument): number;
  };
}

interface OperationGetInstanceLibrary {
  close(): void;
  symbols: {
    GetInstance(
      operation: PointerArgument,
      instance: PointerArgument,
      moreResults: PointerArgument,
      result: PointerArgument,
      errorMessage: PointerArgument,
      completionDetails: PointerArgument,
    ): number;
  };
}

interface SessionCloseLibrary {
  close(): void;
  symbols: {
    Close(session: PointerArgument, completionContext: PointerArgument, completionCallback: PointerArgument): number;
  };
}

interface SessionQueryInstancesLibrary {
  close(): void;
  symbols: {
    QueryInstances(
      session: PointerArgument,
      flags: number,
      options: PointerArgument,
      namespaceName: PointerArgument,
      queryDialect: PointerArgument,
      queryExpression: PointerArgument,
      callbacks: PointerArgument,
      operation: PointerArgument,
    ): void;
  };
}

interface OperatingSystemSnapshot {
  caption: string;
  computerSystemName: string;
  freePhysicalMemoryKilobytes: bigint;
  totalVisibleMemoryKilobytes: bigint;
  version: string;
}

interface ProcessSnapshot {
  name: string;
  processId: number;
  threadCount: number;
  workingSetSize: bigint;
}

Mi.Preload('MI_Application_InitializeV1');
Kernel32.Preload(['GetCurrentProcess', 'GetLastError', 'ReadProcessMemory']);

function createApplicationCloseLibrary(procedureAddress: bigint): ApplicationCloseLibrary {
  return linkSymbols({
    Close: {
      ptr: procedureAddress,
      args: [FFIType.ptr],
      returns: FFIType.u32,
    },
  });
}

function createApplicationNewSessionLibrary(procedureAddress: bigint): ApplicationNewSessionLibrary {
  return linkSymbols({
    NewSession: {
      ptr: procedureAddress,
      args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr],
      returns: FFIType.u32,
    },
  });
}

function createInstanceGetElementLibrary(procedureAddress: bigint): InstanceGetElementLibrary {
  return linkSymbols({
    GetElement: {
      ptr: procedureAddress,
      args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr],
      returns: FFIType.u32,
    },
  });
}

function createOperationCloseLibrary(procedureAddress: bigint): OperationCloseLibrary {
  return linkSymbols({
    Close: {
      ptr: procedureAddress,
      args: [FFIType.ptr],
      returns: FFIType.u32,
    },
  });
}

function createOperationGetInstanceLibrary(procedureAddress: bigint): OperationGetInstanceLibrary {
  return linkSymbols({
    GetInstance: {
      ptr: procedureAddress,
      args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr],
      returns: FFIType.u32,
    },
  });
}

function createSessionCloseLibrary(procedureAddress: bigint): SessionCloseLibrary {
  return linkSymbols({
    Close: {
      ptr: procedureAddress,
      args: [FFIType.ptr, FFIType.ptr, FFIType.ptr],
      returns: FFIType.u32,
    },
  });
}

function createSessionQueryInstancesLibrary(procedureAddress: bigint): SessionQueryInstancesLibrary {
  return linkSymbols({
    QueryInstances: {
      ptr: procedureAddress,
      args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr],
      returns: FFIType.void,
    },
  });
}

function createWideStringBuffer(value: string): Buffer {
  return Buffer.from(value + '\0', 'utf16le');
}

function formatBytes(value: bigint): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let scaledValue = Number(value);
  let unitIndex = 0;

  if (!Number.isFinite(scaledValue) || scaledValue <= 0) {
    return '0 B';
  }

  while (scaledValue >= 1024 && unitIndex < units.length - 1) {
    scaledValue /= 1024;
    unitIndex += 1;
  }

  const precision = scaledValue >= 10 || unitIndex === 0 ? 0 : 1;
  return `${scaledValue.toFixed(precision)} ${units[unitIndex]}`;
}

function formatMiResult(result: number): string {
  return MI_Result[result] ?? `MI_Result(${result})`;
}

function formatStatus(result: MI_Result | null): string {
  if (result === null) {
    return `${ANSI.dim}(not reached)${ANSI.reset}`;
  }

  const color = result === MI_Result.MI_RESULT_OK ? ANSI.green : ANSI.red;
  return `${color}${formatMiResult(result)}${ANSI.reset}`;
}

function formatPercentage(ratio: number): string {
  return `${(ratio * 100).toFixed(1)}%`;
}

function getPressureColor(ratio: number): string {
  if (ratio >= 0.85) {
    return ANSI.red;
  }

  if (ratio >= 0.70) {
    return ANSI.yellow;
  }

  return ANSI.green;
}

function readMemory(address: bigint, byteCount: number): Buffer {
  const outputBuffer = Buffer.alloc(byteCount);
  const readResult = Kernel32.ReadProcessMemory(currentProcessHandle, address, outputBuffer.ptr, BigInt(byteCount), 0n);

  if (readResult === 0) {
    throw new Error(`ReadProcessMemory failed with ${Kernel32.GetLastError()}`);
  }

  return outputBuffer;
}

function readPointerValue(address: bigint): bigint {
  return readMemory(address, POINTER_SIZE).readBigUInt64LE(0);
}

function readWideString(address: bigint, maximumCharacters = 2048): string {
  const charactersPerChunk = 128;
  let value = '';

  for (let characterOffset = 0; characterOffset < maximumCharacters; characterOffset += charactersPerChunk) {
    const chunk = readMemory(address + BigInt(characterOffset * 2), charactersPerChunk * 2).toString('utf16le');
    const terminatorIndex = chunk.indexOf('\0');

    if (terminatorIndex >= 0) {
      return value + chunk.slice(0, terminatorIndex);
    }

    value += chunk;
  }

  return value;
}

function renderMeter(ratio: number, width: number): string {
  const filled = Math.max(0, Math.min(width, Math.round(ratio * width)));
  return `[${'#'.repeat(filled)}${'.'.repeat(width - filled)}]`;
}

function toError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value));
}

function truncate(value: string, width: number): string {
  if (value.length <= width) {
    return value.padEnd(width, ' ');
  }

  if (width <= 3) {
    return value.slice(0, width);
  }

  return `${value.slice(0, width - 3)}...`;
}

let instanceGetElementLibrary: InstanceGetElementLibrary | null = null;
let instanceGetElementProcedureAddress = 0n;

function ensureInstanceGetElementLibrary(instanceAddress: bigint): InstanceGetElementLibrary {
  const instanceFunctionTableAddress = readPointerValue(instanceAddress + BigInt(MI_INSTANCE_FT_OFFSET));

  if (instanceFunctionTableAddress === 0n) {
    throw new Error('MI_Instance.ft is null');
  }

  const procedureAddress = readPointerValue(instanceFunctionTableAddress + BigInt(MI_INSTANCE_GET_ELEMENT_OFFSET));

  if (procedureAddress === 0n) {
    throw new Error('MI_Instance.ft->GetElement is null');
  }

  if (instanceGetElementLibrary === null || instanceGetElementProcedureAddress !== procedureAddress) {
    instanceGetElementLibrary?.close();
    instanceGetElementLibrary = createInstanceGetElementLibrary(procedureAddress);
    instanceGetElementProcedureAddress = procedureAddress;
  }

  return instanceGetElementLibrary;
}

function closeCachedInstanceGetElementLibrary(): void {
  if (instanceGetElementLibrary !== null) {
    instanceGetElementLibrary.close();
    instanceGetElementLibrary = null;
  }
}

function readInstanceProperty(instanceAddress: bigint, propertyName: string): InstanceProperty {
  const propertyNameBuffer = createWideStringBuffer(propertyName);
  const valueBuffer = Buffer.alloc(MI_VALUE_BUFFER_SIZE);
  const typeBuffer = Buffer.alloc(4);
  const flagsBuffer = Buffer.alloc(4);
  const indexBuffer = Buffer.alloc(4);
  const getElementLibrary = ensureInstanceGetElementLibrary(instanceAddress);
  const propertyStatus = getElementLibrary.symbols.GetElement(
    instanceAddress,
    propertyNameBuffer.ptr,
    valueBuffer.ptr,
    typeBuffer.ptr,
    flagsBuffer.ptr,
    indexBuffer.ptr,
  );

  if (propertyStatus !== MI_Result.MI_RESULT_OK) {
    throw new Error(`MI_Instance_GetElement(${propertyName}) failed with ${formatMiResult(propertyStatus)}`);
  }

  return {
    flags: flagsBuffer.readUInt32LE(0),
    type: typeBuffer.readUInt32LE(0),
    valueBuffer,
  };
}

function readStringProperty(instanceAddress: bigint, propertyName: string): string {
  const property = readInstanceProperty(instanceAddress, propertyName);

  if ((property.flags & MI_FLAG_NULL) !== 0) {
    return '';
  }

  if (property.type !== MI_TYPE_STRING) {
    throw new Error(`MI_Instance_GetElement(${propertyName}) returned type ${property.type}, expected ${MI_TYPE_STRING}`);
  }

  const stringAddress = property.valueBuffer.readBigUInt64LE(0);
  return stringAddress === 0n ? '' : readWideString(stringAddress);
}

function readUint32Property(instanceAddress: bigint, propertyName: string): number {
  const property = readInstanceProperty(instanceAddress, propertyName);

  if ((property.flags & MI_FLAG_NULL) !== 0) {
    return 0;
  }

  if (property.type !== MI_TYPE_UINT32) {
    throw new Error(`MI_Instance_GetElement(${propertyName}) returned type ${property.type}, expected ${MI_TYPE_UINT32}`);
  }

  return property.valueBuffer.readUInt32LE(0);
}

function readUint64Property(instanceAddress: bigint, propertyName: string): bigint {
  const property = readInstanceProperty(instanceAddress, propertyName);

  if ((property.flags & MI_FLAG_NULL) !== 0) {
    return 0n;
  }

  if (property.type !== MI_TYPE_UINT64) {
    throw new Error(`MI_Instance_GetElement(${propertyName}) returned type ${property.type}, expected ${MI_TYPE_UINT64}`);
  }

  return property.valueBuffer.readBigUInt64LE(0);
}

function decodeOperatingSystemSnapshot(instanceAddress: bigint): OperatingSystemSnapshot {
  return {
    caption: readStringProperty(instanceAddress, 'Caption'),
    computerSystemName: readStringProperty(instanceAddress, 'CSName'),
    freePhysicalMemoryKilobytes: readUint64Property(instanceAddress, 'FreePhysicalMemory'),
    totalVisibleMemoryKilobytes: readUint64Property(instanceAddress, 'TotalVisibleMemorySize'),
    version: readStringProperty(instanceAddress, 'Version'),
  };
}

function decodeProcessSnapshot(instanceAddress: bigint): ProcessSnapshot {
  return {
    name: readStringProperty(instanceAddress, 'Name'),
    processId: readUint32Property(instanceAddress, 'ProcessId'),
    threadCount: readUint32Property(instanceAddress, 'ThreadCount'),
    workingSetSize: readUint64Property(instanceAddress, 'WorkingSetSize'),
  };
}

function executeSynchronousQuery<T>(
  sessionBuffer: Buffer,
  queryInstancesLibrary: SessionQueryInstancesLibrary,
  queryExpression: string,
  decodeInstance: (instanceAddress: bigint) => T,
): { closeStatus: MI_Result; rows: T[] } {
  const namespaceBuffer = createWideStringBuffer(SYSTEM_NAMESPACE);
  const queryDialectBuffer = createWideStringBuffer(QUERY_DIALECT);
  const queryExpressionBuffer = createWideStringBuffer(queryExpression);
  const operationBuffer = Buffer.alloc(MI_OBJECT_SIZE);
  const rows: T[] = [];
  let closeStatus = MI_Result.MI_RESULT_FAILED;
  let failure: Error | null = null;

  queryInstancesLibrary.symbols.QueryInstances(
    sessionBuffer.ptr,
    0,
    null,
    namespaceBuffer.ptr,
    queryDialectBuffer.ptr,
    queryExpressionBuffer.ptr,
    null,
    operationBuffer.ptr,
  );

  const operationFunctionTableAddress = operationBuffer.readBigUInt64LE(MI_FUNCTION_TABLE_OFFSET);

  if (operationFunctionTableAddress === 0n) {
    throw new Error(`MI_Session_QueryInstances did not initialize MI_Operation for query: ${queryExpression}`);
  }

  const getInstanceLibrary = createOperationGetInstanceLibrary(readPointerValue(operationFunctionTableAddress + BigInt(MI_OPERATION_GET_INSTANCE_OFFSET)));
  const closeOperationLibrary = createOperationCloseLibrary(readPointerValue(operationFunctionTableAddress + BigInt(MI_OPERATION_CLOSE_OFFSET)));

  try {
    while (true) {
      const instanceBuffer = Buffer.alloc(POINTER_SIZE);
      const moreResultsBuffer = Buffer.alloc(1);
      const resultBuffer = Buffer.alloc(4);
      const errorMessageBuffer = Buffer.alloc(POINTER_SIZE);
      const completionDetailsBuffer = Buffer.alloc(POINTER_SIZE);
      const getInstanceStatus = getInstanceLibrary.symbols.GetInstance(
        operationBuffer.ptr,
        instanceBuffer.ptr,
        moreResultsBuffer.ptr,
        resultBuffer.ptr,
        errorMessageBuffer.ptr,
        completionDetailsBuffer.ptr,
      );

      if (getInstanceStatus !== MI_Result.MI_RESULT_OK) {
        throw new Error(`MI_Operation_GetInstance failed with ${formatMiResult(getInstanceStatus)} for query: ${queryExpression}`);
      }

      const instanceAddress = instanceBuffer.readBigUInt64LE(0);
      const moreResults = moreResultsBuffer.readUInt8(0) !== 0;
      const operationResult = resultBuffer.readUInt32LE(0);
      const errorMessageAddress = errorMessageBuffer.readBigUInt64LE(0);

      if (instanceAddress !== 0n) {
        rows.push(decodeInstance(instanceAddress));
      }

      if (!moreResults) {
        if (operationResult !== MI_Result.MI_RESULT_OK) {
          const errorMessage = errorMessageAddress === 0n ? '' : `: ${readWideString(errorMessageAddress)}`;
          throw new Error(`Query "${queryExpression}" completed with ${formatMiResult(operationResult)}${errorMessage}`);
        }

        break;
      }
    }
  } catch (error) {
    failure = toError(error);
  } finally {
    closeStatus = closeOperationLibrary.symbols.Close(operationBuffer.ptr);
    getInstanceLibrary.close();
    closeOperationLibrary.close();

    if (closeStatus !== MI_Result.MI_RESULT_OK && failure === null) {
      failure = new Error(`MI_Operation_Close failed with ${formatMiResult(closeStatus)} for query: ${queryExpression}`);
    }
  }

  if (failure !== null) {
    throw failure;
  }

  return { closeStatus, rows };
}

const applicationIDBuffer = createWideStringBuffer(`bun-win32/mi/bootstrap-beacon/${process.pid}`);
const applicationBuffer = Buffer.alloc(MI_OBJECT_SIZE);
const initializeExtendedErrorBuffer = Buffer.alloc(POINTER_SIZE);
const initializeStatus = Mi.MI_Application_InitializeV1(0, applicationIDBuffer.ptr, initializeExtendedErrorBuffer.ptr, applicationBuffer.ptr);
const collectionStart = performance.now();

let applicationCloseLibrary: ApplicationCloseLibrary | null = null;
let applicationCloseStatus: MI_Result | null = null;
let newSessionLibrary: ApplicationNewSessionLibrary | null = null;
let operatingSystemQueryCloseStatus: MI_Result | null = null;
let processQueryCloseStatus: MI_Result | null = null;
let queryInstancesLibrary: SessionQueryInstancesLibrary | null = null;
let sessionBuffer: Buffer | null = null;
let sessionCloseLibrary: SessionCloseLibrary | null = null;
let sessionCloseStatus: MI_Result | null = null;
let operatingSystemSnapshot: OperatingSystemSnapshot | null = null;
let processSnapshots: ProcessSnapshot[] = [];
let failure: Error | null = null;

try {
  if (initializeStatus !== MI_Result.MI_RESULT_OK) {
    throw new Error(`MI_Application_InitializeV1 failed with ${formatMiResult(initializeStatus)}`);
  }

  const applicationFunctionTableAddress = applicationBuffer.readBigUInt64LE(MI_FUNCTION_TABLE_OFFSET);

  if (applicationFunctionTableAddress === 0n) {
    throw new Error('MI_Application.ft is null after initialization');
  }

  applicationCloseLibrary = createApplicationCloseLibrary(readPointerValue(applicationFunctionTableAddress + BigInt(MI_APPLICATION_CLOSE_OFFSET)));
  newSessionLibrary = createApplicationNewSessionLibrary(readPointerValue(applicationFunctionTableAddress + BigInt(MI_APPLICATION_NEW_SESSION_OFFSET)));
  sessionBuffer = Buffer.alloc(MI_OBJECT_SIZE);

  const newSessionExtendedErrorBuffer = Buffer.alloc(POINTER_SIZE);
  const newSessionStatus = newSessionLibrary.symbols.NewSession(
    applicationBuffer.ptr,
    null,
    null,
    null,
    null,
    newSessionExtendedErrorBuffer.ptr,
    sessionBuffer.ptr,
  );

  if (newSessionStatus !== MI_Result.MI_RESULT_OK) {
    throw new Error(`MI_Application_NewSession failed with ${formatMiResult(newSessionStatus)}`);
  }

  const sessionFunctionTableAddress = sessionBuffer.readBigUInt64LE(MI_FUNCTION_TABLE_OFFSET);

  if (sessionFunctionTableAddress === 0n) {
    throw new Error('MI_Session.ft is null after NewSession');
  }

  sessionCloseLibrary = createSessionCloseLibrary(readPointerValue(sessionFunctionTableAddress + BigInt(MI_SESSION_CLOSE_OFFSET)));
  queryInstancesLibrary = createSessionQueryInstancesLibrary(readPointerValue(sessionFunctionTableAddress + BigInt(MI_SESSION_QUERY_INSTANCES_OFFSET)));

  const operatingSystemQuery = executeSynchronousQuery(
    sessionBuffer,
    queryInstancesLibrary,
    'SELECT CSName,Caption,Version,FreePhysicalMemory,TotalVisibleMemorySize FROM Win32_OperatingSystem',
    decodeOperatingSystemSnapshot,
  );

  operatingSystemQueryCloseStatus = operatingSystemQuery.closeStatus;
  operatingSystemSnapshot = operatingSystemQuery.rows[0] ?? null;

  if (operatingSystemSnapshot === null) {
    throw new Error('Win32_OperatingSystem query returned no rows');
  }

  const processQuery = executeSynchronousQuery(
    sessionBuffer,
    queryInstancesLibrary,
    'SELECT Name,ProcessId,ThreadCount,WorkingSetSize FROM Win32_Process',
    decodeProcessSnapshot,
  );

  processQueryCloseStatus = processQuery.closeStatus;
  processSnapshots = processQuery.rows;

  if (processSnapshots.length === 0) {
    throw new Error('Win32_Process query returned no rows');
  }
} catch (error) {
  failure = toError(error);
} finally {
  if (sessionBuffer !== null && sessionCloseLibrary !== null && sessionBuffer.readBigUInt64LE(MI_FUNCTION_TABLE_OFFSET) !== 0n) {
    sessionCloseStatus = sessionCloseLibrary.symbols.Close(sessionBuffer.ptr, null, null);
  }

  if (applicationCloseLibrary !== null && initializeStatus === MI_Result.MI_RESULT_OK) {
    applicationCloseStatus = applicationCloseLibrary.symbols.Close(applicationBuffer.ptr);
  }

  closeCachedInstanceGetElementLibrary();

  if (queryInstancesLibrary !== null) {
    queryInstancesLibrary.close();
  }

  if (sessionCloseLibrary !== null) {
    sessionCloseLibrary.close();
  }

  if (newSessionLibrary !== null) {
    newSessionLibrary.close();
  }

  if (applicationCloseLibrary !== null) {
    applicationCloseLibrary.close();
  }
}

const collectionDurationMilliseconds = performance.now() - collectionStart;
const shutdownStatuses = [operatingSystemQueryCloseStatus, processQueryCloseStatus, sessionCloseStatus, applicationCloseStatus];
const hasShutdownFailure = shutdownStatuses.some((status) => status !== null && status !== MI_Result.MI_RESULT_OK);

if (failure !== null) {
  console.error(`${ANSI.bold}${ANSI.red}MI Bootstrap Beacon${ANSI.reset}`);
  console.error(`${ANSI.red}${failure.message}${ANSI.reset}`);
  console.error('');
  console.error(`${ANSI.bold}Shutdown${ANSI.reset}`);
  console.error(`  OS query close:       ${formatStatus(operatingSystemQueryCloseStatus)}`);
  console.error(`  Process query close:  ${formatStatus(processQueryCloseStatus)}`);
  console.error(`  Session close:        ${formatStatus(sessionCloseStatus)}`);
  console.error(`  Application close:    ${formatStatus(applicationCloseStatus)}`);
  process.exitCode = 1;
} else if (operatingSystemSnapshot !== null) {
  const totalVisibleMemoryBytes = operatingSystemSnapshot.totalVisibleMemoryKilobytes * 1024n;
  const freePhysicalMemoryBytes = operatingSystemSnapshot.freePhysicalMemoryKilobytes * 1024n;
  const usedPhysicalMemoryBytes = totalVisibleMemoryBytes > freePhysicalMemoryBytes ? totalVisibleMemoryBytes - freePhysicalMemoryBytes : 0n;
  const memoryPressureRatio = totalVisibleMemoryBytes === 0n ? 0 : Number(usedPhysicalMemoryBytes) / Number(totalVisibleMemoryBytes);
  const pressureColor = getPressureColor(memoryPressureRatio);

  processSnapshots.sort((left, right) => {
    if (left.workingSetSize === right.workingSetSize) {
      if (left.threadCount === right.threadCount) {
        if (left.name === right.name) {
          return left.processId - right.processId;
        }

        return left.name.localeCompare(right.name);
      }

      return right.threadCount - left.threadCount;
    }

    return left.workingSetSize > right.workingSetSize ? -1 : 1;
  });

  const topProcessSnapshots = processSnapshots.slice(0, PROCESS_ROW_LIMIT);
  const highestWorkingSetSize = topProcessSnapshots[0]?.workingSetSize ?? 1n;

  console.log(`${ANSI.bold}${ANSI.cyan}MI Bootstrap Beacon${ANSI.reset}`);
  console.log(`${ANSI.dim}Live local CIM telemetry through mi.dll function tables${ANSI.reset}`);
  console.log('');
  console.log(`${ANSI.bold}Machine${ANSI.reset}`);
  console.log(`  Host:                 ${operatingSystemSnapshot.computerSystemName}`);
  console.log(`  OS:                   ${operatingSystemSnapshot.caption}`);
  console.log(`  Version:              ${operatingSystemSnapshot.version}`);
  console.log(`  Memory used:          ${formatBytes(usedPhysicalMemoryBytes)} / ${formatBytes(totalVisibleMemoryBytes)}`);
  console.log(`  Memory available:     ${formatBytes(freePhysicalMemoryBytes)}`);
  console.log(`  Pressure:             ${pressureColor}${renderMeter(memoryPressureRatio, PROCESS_BAR_WIDTH)}${ANSI.reset} ${formatPercentage(memoryPressureRatio)}`);
  console.log(`  Processes sampled:    ${processSnapshots.length}`);
  console.log(`  Query path:           ${SYSTEM_NAMESPACE} via ${QUERY_DIALECT}`);
  console.log(`  Collection time:      ${collectionDurationMilliseconds.toFixed(0)} ms`);
  console.log('');
  console.log(`${ANSI.bold}Top Working Sets${ANSI.reset}`);
  console.log(`  ${truncate('Process', 28)} ${'PID'.padStart(6, ' ')} ${'Threads'.padStart(7, ' ')} ${'Working Set'.padStart(12, ' ')}  Footprint`);

  for (const processSnapshot of topProcessSnapshots) {
    const barRatio = highestWorkingSetSize === 0n ? 0 : Number(processSnapshot.workingSetSize) / Number(highestWorkingSetSize);
    const barColor = barRatio >= 0.80 ? ANSI.red : barRatio >= 0.50 ? ANSI.yellow : ANSI.cyan;
    console.log(
      `  ${truncate(processSnapshot.name, 28)} ${String(processSnapshot.processId).padStart(6, ' ')} ${String(processSnapshot.threadCount).padStart(7, ' ')} ${formatBytes(processSnapshot.workingSetSize).padStart(12, ' ')}  ${barColor}${renderMeter(barRatio, PROCESS_BAR_WIDTH)}${ANSI.reset}`,
    );
  }

  console.log('');
  console.log(`${ANSI.bold}Shutdown${ANSI.reset}`);
  console.log(`  OS query close:       ${formatStatus(operatingSystemQueryCloseStatus)}`);
  console.log(`  Process query close:  ${formatStatus(processQueryCloseStatus)}`);
  console.log(`  Session close:        ${formatStatus(sessionCloseStatus)}`);
  console.log(`  Application close:    ${formatStatus(applicationCloseStatus)}`);

  if (hasShutdownFailure) {
    process.exitCode = 1;
  }
}
