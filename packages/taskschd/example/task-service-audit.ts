/**
 * Task Service Audit
 *
 * Initializes COM for Task Scheduler, resolves `CLSID_TaskScheduler`
 * through `taskschd.dll!DllGetClassObject`, creates a live `ITaskService`
 * instance, connects to the local scheduler, and prints the resulting COM
 * addresses, version information, root folder path, and unload-state probes.
 *
 * APIs demonstrated:
 *   - Taskschd.DllCanUnloadNow       (probe COM server unload state)
 *   - Taskschd.DllGetClassObject     (resolve the task scheduler class factory)
 *   - IClassFactory::CreateInstance  (create `ITaskService`)
 *   - IClassFactory::Release         (release the class factory)
 *   - ITaskService::Connect          (connect to the local scheduler)
 *   - ITaskService::GetFolder        (open the root task folder)
 *   - ITaskService::get_HighestVersion (read the scheduler version)
 *   - ITaskService::Release          (release the task service)
 *   - ITaskFolder::get_Path          (read the root folder path)
 *   - ITaskFolder::Release           (release the root folder)
 *   - CoInitializeEx                 (initialize COM on the current thread)
 *   - CoInitializeSecurity           (set COM security for Task Scheduler)
 *   - CoUninitialize                 (tear COM down)
 *   - SysAllocString                 (allocate BSTR input strings)
 *   - SysFreeString                  (free returned BSTR values)
 *   - GetCurrentProcess              (obtain a pseudo-handle for local reads)
 *   - GetLastError                   (diagnose local memory-read failures)
 *   - ReadProcessMemory              (read COM vtable and BSTR metadata)
 *
 * Run: bun run example:task-service-audit
 */

import { FFIType, dlopen, linkSymbols, type Pointer } from 'bun:ffi';

import Taskschd from '../index';

const ANSI = {
  bold: '\x1b[1m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
  yellow: '\x1b[33m',
} as const;

const CLASS_FACTORY_CREATE_INSTANCE_OFFSET = 0x18n;
const CLSID_TASK_SCHEDULER = '0f87369f-a4e5-4cfc-bd3e-73e6154572dd';
const COINIT_MULTITHREADED = 0x0000_0000;
const GUID_DATA4_END = 16;
const GUID_DATA4_START = 8;
const IID_I_CLASS_FACTORY = '00000001-0000-0000-c000-000000000046';
const IID_I_TASK_SERVICE = '2faba4c7-4da9-4013-9697-20cc3fd40f85';
const POINTER_SIZE = 0x08;
const ROOT_FOLDER_PATH = '\\';
const RPC_C_AUTHN_LEVEL_PKT_PRIVACY = 0x0000_0006;
const RPC_C_IMP_LEVEL_IMPERSONATE = 0x0000_0003;
const RPC_E_CHANGED_MODE = 0x8001_0106;
const RPC_E_TOO_LATE = 0x8001_0119;
const S_FALSE = 0x0000_0001;
const TASK_FOLDER_GET_PATH_OFFSET = 0x40n;
const TASK_SERVICE_CONNECT_OFFSET = 0x50n;
const TASK_SERVICE_GET_FOLDER_OFFSET = 0x38n;
const TASK_SERVICE_GET_HIGHEST_VERSION_OFFSET = 0x78n;
const UNKNOWN_RELEASE_OFFSET = 0x10n;
const VARIANT_SIZE = 0x18;

type PointerArgument = Pointer | null;

interface ClassFactoryLibrary {
  close(): void;
  symbols: {
    CreateInstance(classFactory: bigint, pUnkOuter: bigint, riid: PointerArgument, ppvObject: PointerArgument): number;
    Release(classFactory: bigint): number;
  };
}

interface TaskFolderLibrary {
  close(): void;
  symbols: {
    Release(taskFolder: bigint): number;
    get_Path(taskFolder: bigint, path: PointerArgument): number;
  };
}

interface TaskServiceLibrary {
  close(): void;
  symbols: {
    Connect(taskService: bigint, serverName: PointerArgument, user: PointerArgument, domain: PointerArgument, password: PointerArgument): number;
    GetFolder(taskService: bigint, path: bigint, taskFolder: PointerArgument): number;
    Release(taskService: bigint): number;
    get_HighestVersion(taskService: bigint, version: PointerArgument): number;
  };
}

const kernel32 = dlopen('kernel32.dll', {
  GetCurrentProcess: { args: [], returns: FFIType.u64 },
  GetLastError: { args: [], returns: FFIType.u32 },
  ReadProcessMemory: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
});

const ole32 = dlopen('ole32.dll', {
  CoInitializeEx: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
  CoInitializeSecurity: { args: [FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
  CoUninitialize: { args: [], returns: FFIType.void },
});

const oleAut32 = dlopen('oleaut32.dll', {
  SysAllocString: { args: [FFIType.ptr], returns: FFIType.u64 },
  SysFreeString: { args: [FFIType.u64], returns: FFIType.void },
});

const currentProcessHandle = kernel32.symbols.GetCurrentProcess();
const clsidTaskSchedulerBuffer = createGuidBuffer(CLSID_TASK_SCHEDULER);
const iidIClassFactoryBuffer = createGuidBuffer(IID_I_CLASS_FACTORY);
const iidITaskServiceBuffer = createGuidBuffer(IID_I_TASK_SERVICE);

Taskschd.Preload(['DllCanUnloadNow', 'DllGetClassObject']);

function createClassFactoryLibrary(classFactoryAddress: bigint): ClassFactoryLibrary {
  const vtableAddress = readPointerValue(classFactoryAddress);

  return linkSymbols({
    CreateInstance: {
      ptr: readPointerValue(vtableAddress + CLASS_FACTORY_CREATE_INSTANCE_OFFSET),
      args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr],
      returns: FFIType.i32,
    },
    Release: {
      ptr: readPointerValue(vtableAddress + UNKNOWN_RELEASE_OFFSET),
      args: [FFIType.u64],
      returns: FFIType.u32,
    },
  });
}

function createGuidBuffer(value: string): Buffer {
  const match = /^([0-9a-fA-F]{8})-([0-9a-fA-F]{4})-([0-9a-fA-F]{4})-([0-9a-fA-F]{4})-([0-9a-fA-F]{12})$/.exec(value);

  if (match === null) {
    throw new Error(`Invalid GUID: ${value}`);
  }

  const [, data1Hex, data2Hex, data3Hex, data4HighHex, data4LowHex] = match;
  const guidBuffer = Buffer.alloc(16);

  guidBuffer.writeUInt32LE(parseInt(data1Hex, 16), 0);
  guidBuffer.writeUInt16LE(parseInt(data2Hex, 16), 4);
  guidBuffer.writeUInt16LE(parseInt(data3Hex, 16), 6);

  const data4Hex = `${data4HighHex}${data4LowHex}`;

  for (let byteIndex = GUID_DATA4_START; byteIndex < GUID_DATA4_END; byteIndex += 1) {
    const hexOffset = (byteIndex - GUID_DATA4_START) * 2;
    guidBuffer[byteIndex] = parseInt(data4Hex.slice(hexOffset, hexOffset + 2), 16);
  }

  return guidBuffer;
}

function createTaskFolderLibrary(taskFolderAddress: bigint): TaskFolderLibrary {
  const vtableAddress = readPointerValue(taskFolderAddress);

  return linkSymbols({
    Release: {
      ptr: readPointerValue(vtableAddress + UNKNOWN_RELEASE_OFFSET),
      args: [FFIType.u64],
      returns: FFIType.u32,
    },
    get_Path: {
      ptr: readPointerValue(vtableAddress + TASK_FOLDER_GET_PATH_OFFSET),
      args: [FFIType.u64, FFIType.ptr],
      returns: FFIType.i32,
    },
  });
}

function createTaskServiceLibrary(taskServiceAddress: bigint): TaskServiceLibrary {
  const vtableAddress = readPointerValue(taskServiceAddress);

  return linkSymbols({
    Connect: {
      ptr: readPointerValue(vtableAddress + TASK_SERVICE_CONNECT_OFFSET),
      args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr],
      returns: FFIType.i32,
    },
    GetFolder: {
      ptr: readPointerValue(vtableAddress + TASK_SERVICE_GET_FOLDER_OFFSET),
      args: [FFIType.u64, FFIType.u64, FFIType.ptr],
      returns: FFIType.i32,
    },
    Release: {
      ptr: readPointerValue(vtableAddress + UNKNOWN_RELEASE_OFFSET),
      args: [FFIType.u64],
      returns: FFIType.u32,
    },
    get_HighestVersion: {
      ptr: readPointerValue(vtableAddress + TASK_SERVICE_GET_HIGHEST_VERSION_OFFSET),
      args: [FFIType.u64, FFIType.ptr],
      returns: FFIType.i32,
    },
  });
}

function createWideStringBuffer(value: string): Buffer {
  return Buffer.from(value + '\0', 'utf16le');
}

function describeHResult(result: number): string {
  if (result === 0) {
    return 'S_OK';
  }

  if (result === S_FALSE) {
    return 'S_FALSE';
  }

  if ((result >>> 0) === RPC_E_CHANGED_MODE) {
    return 'RPC_E_CHANGED_MODE';
  }

  if ((result >>> 0) === RPC_E_TOO_LATE) {
    return 'RPC_E_TOO_LATE';
  }

  return formatHResult(result);
}

function formatAddress(value: bigint): string {
  return `0x${value.toString(16).padStart(16, '0')}`;
}

function formatHResult(value: number): string {
  return `0x${(value >>> 0).toString(16).padStart(8, '0')}`;
}

function formatVersion(value: number): string {
  const majorVersion = value >>> 16;
  const minorVersion = value & 0xffff;
  return `${majorVersion}.${minorVersion} (${formatHResult(value)})`;
}

function isSuccessful(result: number): boolean {
  return result >= 0;
}

function readBStringValue(bStringAddress: bigint): string {
  if (bStringAddress === 0n) {
    return '';
  }

  const byteCount = readMemory(bStringAddress - 4n, 4).readUInt32LE(0);

  if (byteCount === 0) {
    return '';
  }

  return readMemory(bStringAddress, byteCount).toString('utf16le');
}

function readMemory(address: bigint, byteCount: number): Buffer {
  const valueBuffer = Buffer.alloc(byteCount);
  const readResult = kernel32.symbols.ReadProcessMemory(currentProcessHandle, address, valueBuffer.ptr, BigInt(byteCount), null);

  if (readResult === 0) {
    throw new Error(`ReadProcessMemory failed with ${kernel32.symbols.GetLastError()}`);
  }

  return valueBuffer;
}

function readPointerValue(address: bigint): bigint {
  return readMemory(address, POINTER_SIZE).readBigUInt64LE(0);
}

const baselineUnloadStatus = Taskschd.DllCanUnloadNow();
const initializeStatus = ole32.symbols.CoInitializeEx(null, COINIT_MULTITHREADED);
const shouldUninitialize = isSuccessful(initializeStatus);
const initializeSecurityStatus = isSuccessful(initializeStatus)
  ? ole32.symbols.CoInitializeSecurity(null, -1, null, null, RPC_C_AUTHN_LEVEL_PKT_PRIVACY, RPC_C_IMP_LEVEL_IMPERSONATE, null, 0, null)
  : initializeStatus;

const emptyDomainVariantBuffer = Buffer.alloc(VARIANT_SIZE);
const emptyPasswordVariantBuffer = Buffer.alloc(VARIANT_SIZE);
const emptyServerVariantBuffer = Buffer.alloc(VARIANT_SIZE);
const emptyUserVariantBuffer = Buffer.alloc(VARIANT_SIZE);
const classFactoryBuffer = Buffer.alloc(POINTER_SIZE);
const classObjectStatus = isSuccessful(initializeStatus)
  ? Taskschd.DllGetClassObject(clsidTaskSchedulerBuffer.ptr, iidIClassFactoryBuffer.ptr, classFactoryBuffer.ptr)
  : initializeStatus;

let afterFactoryUnloadStatus: number | null = null;
let afterServiceUnloadStatus: number | null = null;
let afterReleaseUnloadStatus: number | null = null;
let classFactoryAddress = 0n;
let classFactoryLibrary: ClassFactoryLibrary | null = null;
let classFactoryReleaseCount: number | null = null;
let createInstanceStatus: number | null = null;
let rootFolderAddress = 0n;
let rootFolderLibrary: TaskFolderLibrary | null = null;
let rootFolderPath = '';
let rootFolderReleaseCount: number | null = null;
let rootFolderStatus: number | null = null;
let rootPathStatus: number | null = null;
let taskServiceAddress = 0n;
let taskServiceLibrary: TaskServiceLibrary | null = null;
let taskServiceReleaseCount: number | null = null;
let taskServiceVersion = 0;
let versionStatus: number | null = null;
let connectStatus: number | null = null;
let failure: Error | null = null;

try {
  if (!isSuccessful(initializeStatus) && (initializeStatus >>> 0) !== RPC_E_CHANGED_MODE) {
    throw new Error(`CoInitializeEx failed with ${formatHResult(initializeStatus)}`);
  }

  if (!isSuccessful(initializeSecurityStatus) && (initializeSecurityStatus >>> 0) !== RPC_E_TOO_LATE) {
    throw new Error(`CoInitializeSecurity failed with ${formatHResult(initializeSecurityStatus)}`);
  }

  if (!isSuccessful(classObjectStatus)) {
    throw new Error(`DllGetClassObject failed with ${formatHResult(classObjectStatus)}`);
  }

  afterFactoryUnloadStatus = Taskschd.DllCanUnloadNow();
  classFactoryAddress = classFactoryBuffer.readBigUInt64LE(0);

  if (classFactoryAddress === 0n) {
    throw new Error('DllGetClassObject returned a null class factory pointer');
  }

  classFactoryLibrary = createClassFactoryLibrary(classFactoryAddress);

  const taskServiceBuffer = Buffer.alloc(POINTER_SIZE);
  createInstanceStatus = classFactoryLibrary.symbols.CreateInstance(classFactoryAddress, 0n, iidITaskServiceBuffer.ptr, taskServiceBuffer.ptr);

  if (!isSuccessful(createInstanceStatus)) {
    throw new Error(`IClassFactory::CreateInstance failed with ${formatHResult(createInstanceStatus)}`);
  }

  afterServiceUnloadStatus = Taskschd.DllCanUnloadNow();
  taskServiceAddress = taskServiceBuffer.readBigUInt64LE(0);

  if (taskServiceAddress === 0n) {
    throw new Error('IClassFactory::CreateInstance returned a null task service pointer');
  }

  taskServiceLibrary = createTaskServiceLibrary(taskServiceAddress);
  connectStatus = taskServiceLibrary.symbols.Connect(
    taskServiceAddress,
    emptyServerVariantBuffer.ptr,
    emptyUserVariantBuffer.ptr,
    emptyDomainVariantBuffer.ptr,
    emptyPasswordVariantBuffer.ptr,
  );

  if (!isSuccessful(connectStatus)) {
    throw new Error(`ITaskService::Connect failed with ${formatHResult(connectStatus)}`);
  }

  const versionBuffer = Buffer.alloc(4);
  versionStatus = taskServiceLibrary.symbols.get_HighestVersion(taskServiceAddress, versionBuffer.ptr);

  if (!isSuccessful(versionStatus)) {
    throw new Error(`ITaskService::get_HighestVersion failed with ${formatHResult(versionStatus)}`);
  }

  taskServiceVersion = versionBuffer.readUInt32LE(0);

  const rootFolderBString = oleAut32.symbols.SysAllocString(createWideStringBuffer(ROOT_FOLDER_PATH).ptr);

  if (rootFolderBString === 0n) {
    throw new Error('SysAllocString failed for the root folder path');
  }

  try {
    const rootFolderBuffer = Buffer.alloc(POINTER_SIZE);
    rootFolderStatus = taskServiceLibrary.symbols.GetFolder(taskServiceAddress, rootFolderBString, rootFolderBuffer.ptr);

    if (!isSuccessful(rootFolderStatus)) {
      throw new Error(`ITaskService::GetFolder failed with ${formatHResult(rootFolderStatus)}`);
    }

    rootFolderAddress = rootFolderBuffer.readBigUInt64LE(0);

    if (rootFolderAddress === 0n) {
      throw new Error('ITaskService::GetFolder returned a null folder pointer');
    }
  } finally {
    oleAut32.symbols.SysFreeString(rootFolderBString);
  }

  rootFolderLibrary = createTaskFolderLibrary(rootFolderAddress);

  const rootPathBuffer = Buffer.alloc(POINTER_SIZE);
  rootPathStatus = rootFolderLibrary.symbols.get_Path(rootFolderAddress, rootPathBuffer.ptr);

  if (!isSuccessful(rootPathStatus)) {
    throw new Error(`ITaskFolder::get_Path failed with ${formatHResult(rootPathStatus)}`);
  }

  const rootPathAddress = rootPathBuffer.readBigUInt64LE(0);
  rootFolderPath = readBStringValue(rootPathAddress);
  oleAut32.symbols.SysFreeString(rootPathAddress);
} catch (error) {
  failure = error instanceof Error ? error : new Error(String(error));
} finally {
  if (rootFolderLibrary !== null && rootFolderAddress !== 0n) {
    rootFolderReleaseCount = rootFolderLibrary.symbols.Release(rootFolderAddress);
  }

  if (taskServiceLibrary !== null && taskServiceAddress !== 0n) {
    taskServiceReleaseCount = taskServiceLibrary.symbols.Release(taskServiceAddress);
  }

  if (classFactoryLibrary !== null && classFactoryAddress !== 0n) {
    classFactoryReleaseCount = classFactoryLibrary.symbols.Release(classFactoryAddress);
  }

  if (classFactoryAddress !== 0n || taskServiceAddress !== 0n) {
    afterReleaseUnloadStatus = Taskschd.DllCanUnloadNow();
  }

  classFactoryLibrary?.close();
  rootFolderLibrary?.close();
  taskServiceLibrary?.close();

  if (shouldUninitialize) {
    ole32.symbols.CoUninitialize();
  }

  kernel32.close();
  ole32.close();
  oleAut32.close();
}

const detailRows: Array<[string, string]> = [
  ['CoInitializeEx', `${describeHResult(initializeStatus)} (${formatHResult(initializeStatus)})`],
  ['CoInitializeSecurity', `${describeHResult(initializeSecurityStatus)} (${formatHResult(initializeSecurityStatus)})`],
  ['DllGetClassObject', `${describeHResult(classObjectStatus)} (${formatHResult(classObjectStatus)})`],
  ['CreateInstance', createInstanceStatus === null ? `${ANSI.dim}(not reached)${ANSI.reset}` : `${describeHResult(createInstanceStatus)} (${formatHResult(createInstanceStatus)})`],
  ['Connect', connectStatus === null ? `${ANSI.dim}(not reached)${ANSI.reset}` : `${describeHResult(connectStatus)} (${formatHResult(connectStatus)})`],
  ['HighestVersion', versionStatus === null ? `${ANSI.dim}(not reached)${ANSI.reset}` : `${describeHResult(versionStatus)} (${formatHResult(versionStatus)})`],
  ['Root path', rootFolderPath === '' ? `${ANSI.dim}(not reached)${ANSI.reset}` : rootFolderPath],
  ['Task Scheduler version', versionStatus === null ? `${ANSI.dim}(not reached)${ANSI.reset}` : formatVersion(taskServiceVersion)],
];

const addressRows: Array<[string, string]> = [
  ['Class factory', classFactoryAddress === 0n ? `${ANSI.dim}(null)${ANSI.reset}` : formatAddress(classFactoryAddress)],
  ['Task service', taskServiceAddress === 0n ? `${ANSI.dim}(null)${ANSI.reset}` : formatAddress(taskServiceAddress)],
  ['Root folder', rootFolderAddress === 0n ? `${ANSI.dim}(null)${ANSI.reset}` : formatAddress(rootFolderAddress)],
];

const unloadRows: Array<[string, string]> = [
  ['Baseline', `${describeHResult(baselineUnloadStatus)} (${formatHResult(baselineUnloadStatus)})`],
  ['After class factory', afterFactoryUnloadStatus === null ? `${ANSI.dim}(not reached)${ANSI.reset}` : `${describeHResult(afterFactoryUnloadStatus)} (${formatHResult(afterFactoryUnloadStatus)})`],
  ['After service creation', afterServiceUnloadStatus === null ? `${ANSI.dim}(not reached)${ANSI.reset}` : `${describeHResult(afterServiceUnloadStatus)} (${formatHResult(afterServiceUnloadStatus)})`],
  ['After releases', afterReleaseUnloadStatus === null ? `${ANSI.dim}(not reached)${ANSI.reset}` : `${describeHResult(afterReleaseUnloadStatus)} (${formatHResult(afterReleaseUnloadStatus)})`],
];

const releaseRows: Array<[string, string]> = [
  ['Class factory Release', classFactoryReleaseCount === null ? `${ANSI.dim}(not reached)${ANSI.reset}` : String(classFactoryReleaseCount)],
  ['Task service Release', taskServiceReleaseCount === null ? `${ANSI.dim}(not reached)${ANSI.reset}` : String(taskServiceReleaseCount)],
  ['Root folder Release', rootFolderReleaseCount === null ? `${ANSI.dim}(not reached)${ANSI.reset}` : String(rootFolderReleaseCount)],
];

function printRows(rows: Array<[string, string]>): void {
  const longestLabelLength = Math.max(...rows.map(([label]) => label.length));

  for (const [label, value] of rows) {
    console.log(`  ${ANSI.dim}${label.padEnd(longestLabelLength, ' ')}${ANSI.reset}  ${value}`);
  }
}

if (failure !== null) {
  console.error(`${ANSI.bold}${ANSI.red}Task Service Audit${ANSI.reset}`);
  console.error(`${ANSI.red}${failure.message}${ANSI.reset}`);
  console.error('');
  console.error(`${ANSI.bold}Progress${ANSI.reset}`);
  printRows(detailRows);
  console.error('');
  console.error(`${ANSI.bold}Addresses${ANSI.reset}`);
  printRows(addressRows);
  console.error('');
  console.error(`${ANSI.bold}Unload Probes${ANSI.reset}`);
  printRows(unloadRows);
  console.error('');
  console.error(`${ANSI.bold}Release Counts${ANSI.reset}`);
  printRows(releaseRows);
  process.exitCode = 1;
} else {
  console.log(`${ANSI.bold}${ANSI.cyan}Task Service Audit${ANSI.reset}`);
  console.log(`${ANSI.dim}COM activation of Task Scheduler through taskschd.dll${ANSI.reset}`);
  console.log('');
  console.log(`${ANSI.bold}Progress${ANSI.reset}`);
  printRows(detailRows);
  console.log('');
  console.log(`${ANSI.bold}Addresses${ANSI.reset}`);
  printRows(addressRows);
  console.log('');
  console.log(`${ANSI.bold}Unload Probes${ANSI.reset}`);
  printRows(unloadRows);
  console.log('');
  console.log(`${ANSI.bold}Release Counts${ANSI.reset}`);
  printRows(releaseRows);
}
