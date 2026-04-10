/**
 * Schedule Constellation
 *
 * Walks the live Task Scheduler folder tree through `taskschd.dll`,
 * includes hidden tasks, classifies every discovered task by state, and
 * renders a compact ANSI map of the busiest folders plus the next scheduled
 * launches across the machine.
 *
 * APIs demonstrated:
 *   - Taskschd.DllGetClassObject               (resolve the task scheduler class factory)
 *   - IClassFactory::CreateInstance            (create `ITaskService`)
 *   - IClassFactory::Release                   (release the class factory)
 *   - ITaskService::Connect                    (connect to the local scheduler)
 *   - ITaskService::GetFolder                  (open the root task folder)
 *   - ITaskService::Release                    (release the task service)
 *   - ITaskFolder::GetFolders                  (enumerate subfolders)
 *   - ITaskFolder::GetTasks                    (enumerate tasks in each folder)
 *   - ITaskFolder::Release                     (release folder objects)
 *   - ITaskFolder::get_Path                    (read folder paths)
 *   - ITaskFolderCollection::get_Count         (count folder items)
 *   - ITaskFolderCollection::get_Item          (fetch a folder by ordinal)
 *   - ITaskFolderCollection::Release           (release folder collections)
 *   - IRegisteredTaskCollection::get_Count     (count task items)
 *   - IRegisteredTaskCollection::get_Item      (fetch a task by ordinal)
 *   - IRegisteredTaskCollection::Release       (release task collections)
 *   - IRegisteredTask::Release                 (release task objects)
 *   - IRegisteredTask::get_Enabled             (read whether a task is enabled)
 *   - IRegisteredTask::get_LastTaskResult      (read the last result code)
 *   - IRegisteredTask::get_Name                (read the task name)
 *   - IRegisteredTask::get_NextRunTime         (read the next scheduled run)
 *   - IRegisteredTask::get_Path                (read the task path)
 *   - IRegisteredTask::get_State               (read the task state)
 *   - CoInitializeEx                           (initialize COM on the current thread)
 *   - CoInitializeSecurity                     (set COM security for Task Scheduler)
 *   - CoUninitialize                           (tear COM down)
 *   - SysAllocString                           (allocate BSTR input strings)
 *   - SysFreeString                            (free returned BSTR values)
 *   - VariantTimeToSystemTime                  (convert automation dates for display)
 *   - GetCurrentProcess                        (obtain a pseudo-handle for local reads)
 *   - GetLastError                             (diagnose local memory-read failures)
 *   - ReadProcessMemory                        (read COM vtable and BSTR metadata)
 *
 * Run: bun run example:schedule-constellation
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
const SYSTEM_TIME_SIZE = 0x10;
const TASK_ENUM_HIDDEN = 0x0000_0001;
const TASK_FOLDER_COLLECTION_GET_COUNT_OFFSET = 0x38n;
const TASK_FOLDER_COLLECTION_GET_ITEM_OFFSET = 0x40n;
const TASK_FOLDER_GET_FOLDERS_OFFSET = 0x50n;
const TASK_FOLDER_GET_PATH_OFFSET = 0x40n;
const TASK_FOLDER_GET_TASKS_OFFSET = 0x70n;
const TASK_REGISTERED_COLLECTION_GET_COUNT_OFFSET = 0x38n;
const TASK_REGISTERED_COLLECTION_GET_ITEM_OFFSET = 0x40n;
const TASK_SERVICE_CONNECT_OFFSET = 0x50n;
const TASK_SERVICE_GET_FOLDER_OFFSET = 0x38n;
const TASK_STATE_DISABLED = 1;
const TASK_STATE_QUEUED = 2;
const TASK_STATE_READY = 3;
const TASK_STATE_RUNNING = 4;
const UNKNOWN_RELEASE_OFFSET = 0x10n;
const VARIANT_SIZE = 0x18;
const VARIANT_TYPE_I4 = 0x0003;

type PointerArgument = Pointer | null;

interface FolderScanError {
  folderPath: string;
  operationName: string;
  status: number;
}

interface FolderSummary {
  disabledTaskCount: number;
  enabledTaskCount: number;
  folderPath: string;
  queuedTaskCount: number;
  readyTaskCount: number;
  runningTaskCount: number;
  taskCount: number;
  unknownTaskCount: number;
}

interface TaskInfo {
  enabled: boolean;
  folderPath: string;
  lastTaskResult: number;
  name: string;
  nextRunLabel: string | null;
  nextRunSortKey: number | null;
  path: string;
  state: number;
}

interface ClassFactoryLibrary {
  close(): void;
  symbols: {
    CreateInstance(classFactory: bigint, pUnkOuter: bigint, riid: PointerArgument, ppvObject: PointerArgument): number;
    Release(classFactory: bigint): number;
  };
}

interface RegisteredTaskCollectionLibrary {
  close(): void;
  symbols: {
    Release(collection: bigint): number;
    get_Count(collection: bigint, count: PointerArgument): number;
    get_Item(collection: bigint, index: PointerArgument, task: PointerArgument): number;
  };
}

interface RegisteredTaskLibrary {
  close(): void;
  symbols: {
    Release(task: bigint): number;
    get_Enabled(task: bigint, enabled: PointerArgument): number;
    get_LastTaskResult(task: bigint, lastTaskResult: PointerArgument): number;
    get_Name(task: bigint, name: PointerArgument): number;
    get_NextRunTime(task: bigint, nextRunTime: PointerArgument): number;
    get_Path(task: bigint, path: PointerArgument): number;
    get_State(task: bigint, state: PointerArgument): number;
  };
}

interface TaskFolderCollectionLibrary {
  close(): void;
  symbols: {
    Release(collection: bigint): number;
    get_Count(collection: bigint, count: PointerArgument): number;
    get_Item(collection: bigint, index: PointerArgument, folder: PointerArgument): number;
  };
}

interface TaskFolderLibrary {
  close(): void;
  symbols: {
    GetFolders(taskFolder: bigint, flags: number, folderCollection: PointerArgument): number;
    GetTasks(taskFolder: bigint, flags: number, taskCollection: PointerArgument): number;
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
  VariantTimeToSystemTime: { args: [FFIType.f64, FFIType.ptr], returns: FFIType.i32 },
});

const currentProcessHandle = kernel32.symbols.GetCurrentProcess();
const clsidTaskSchedulerBuffer = createGuidBuffer(CLSID_TASK_SCHEDULER);
const iidIClassFactoryBuffer = createGuidBuffer(IID_I_CLASS_FACTORY);
const iidITaskServiceBuffer = createGuidBuffer(IID_I_TASK_SERVICE);

Taskschd.Preload('DllGetClassObject');

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

function createIndexVariantBuffer(value: number): Buffer {
  const variantBuffer = Buffer.alloc(VARIANT_SIZE);
  variantBuffer.writeUInt16LE(VARIANT_TYPE_I4, 0);
  variantBuffer.writeInt32LE(value, 8);
  return variantBuffer;
}

function createWideStringBuffer(value: string): Buffer {
  return Buffer.from(value + '\0', 'utf16le');
}

function formatFolderError(folderScanError: FolderScanError): string {
  return `${folderScanError.folderPath} :: ${folderScanError.operationName} -> ${formatHResult(folderScanError.status)}`;
}

function formatHResult(value: number): string {
  return `0x${(value >>> 0).toString(16).padStart(8, '0')}`;
}

function formatStateLabel(value: number): string {
  switch (value) {
    case TASK_STATE_DISABLED:
      return 'disabled';
    case TASK_STATE_QUEUED:
      return 'queued';
    case TASK_STATE_READY:
      return 'ready';
    case TASK_STATE_RUNNING:
      return 'running';
    default:
      return 'unknown';
  }
}

function formatSystemTime(systemTimeBuffer: Buffer): { label: string; sortKey: number } {
  const year = systemTimeBuffer.readUInt16LE(0);
  const month = systemTimeBuffer.readUInt16LE(2);
  const day = systemTimeBuffer.readUInt16LE(6);
  const hour = systemTimeBuffer.readUInt16LE(8);
  const minute = systemTimeBuffer.readUInt16LE(10);
  const second = systemTimeBuffer.readUInt16LE(12);
  const sortKey = Date.UTC(year, month - 1, day, hour, minute, second);
  const label = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;

  return { label, sortKey };
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

function truncate(value: string, width: number): string {
  if (value.length <= width) {
    return value.padEnd(width, ' ');
  }

  if (width <= 3) {
    return value.slice(0, width);
  }

  return `${value.slice(0, width - 3)}...`;
}

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

function createRegisteredTaskCollectionLibrary(collectionAddress: bigint): RegisteredTaskCollectionLibrary {
  const vtableAddress = readPointerValue(collectionAddress);

  return linkSymbols({
    Release: {
      ptr: readPointerValue(vtableAddress + UNKNOWN_RELEASE_OFFSET),
      args: [FFIType.u64],
      returns: FFIType.u32,
    },
    get_Count: {
      ptr: readPointerValue(vtableAddress + TASK_REGISTERED_COLLECTION_GET_COUNT_OFFSET),
      args: [FFIType.u64, FFIType.ptr],
      returns: FFIType.i32,
    },
    get_Item: {
      ptr: readPointerValue(vtableAddress + TASK_REGISTERED_COLLECTION_GET_ITEM_OFFSET),
      args: [FFIType.u64, FFIType.ptr, FFIType.ptr],
      returns: FFIType.i32,
    },
  });
}

function createRegisteredTaskLibrary(taskAddress: bigint): RegisteredTaskLibrary {
  const vtableAddress = readPointerValue(taskAddress);

  return linkSymbols({
    Release: {
      ptr: readPointerValue(vtableAddress + UNKNOWN_RELEASE_OFFSET),
      args: [FFIType.u64],
      returns: FFIType.u32,
    },
    get_Enabled: {
      ptr: readPointerValue(vtableAddress + 0x50n),
      args: [FFIType.u64, FFIType.ptr],
      returns: FFIType.i32,
    },
    get_LastTaskResult: {
      ptr: readPointerValue(vtableAddress + 0x80n),
      args: [FFIType.u64, FFIType.ptr],
      returns: FFIType.i32,
    },
    get_Name: {
      ptr: readPointerValue(vtableAddress + 0x38n),
      args: [FFIType.u64, FFIType.ptr],
      returns: FFIType.i32,
    },
    get_NextRunTime: {
      ptr: readPointerValue(vtableAddress + 0x90n),
      args: [FFIType.u64, FFIType.ptr],
      returns: FFIType.i32,
    },
    get_Path: {
      ptr: readPointerValue(vtableAddress + 0x40n),
      args: [FFIType.u64, FFIType.ptr],
      returns: FFIType.i32,
    },
    get_State: {
      ptr: readPointerValue(vtableAddress + 0x48n),
      args: [FFIType.u64, FFIType.ptr],
      returns: FFIType.i32,
    },
  });
}

function createTaskFolderCollectionLibrary(collectionAddress: bigint): TaskFolderCollectionLibrary {
  const vtableAddress = readPointerValue(collectionAddress);

  return linkSymbols({
    Release: {
      ptr: readPointerValue(vtableAddress + UNKNOWN_RELEASE_OFFSET),
      args: [FFIType.u64],
      returns: FFIType.u32,
    },
    get_Count: {
      ptr: readPointerValue(vtableAddress + TASK_FOLDER_COLLECTION_GET_COUNT_OFFSET),
      args: [FFIType.u64, FFIType.ptr],
      returns: FFIType.i32,
    },
    get_Item: {
      ptr: readPointerValue(vtableAddress + TASK_FOLDER_COLLECTION_GET_ITEM_OFFSET),
      args: [FFIType.u64, FFIType.ptr, FFIType.ptr],
      returns: FFIType.i32,
    },
  });
}

function createTaskFolderLibrary(taskFolderAddress: bigint): TaskFolderLibrary {
  const vtableAddress = readPointerValue(taskFolderAddress);

  return linkSymbols({
    GetFolders: {
      ptr: readPointerValue(vtableAddress + TASK_FOLDER_GET_FOLDERS_OFFSET),
      args: [FFIType.u64, FFIType.i32, FFIType.ptr],
      returns: FFIType.i32,
    },
    GetTasks: {
      ptr: readPointerValue(vtableAddress + TASK_FOLDER_GET_TASKS_OFFSET),
      args: [FFIType.u64, FFIType.i32, FFIType.ptr],
      returns: FFIType.i32,
    },
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
  });
}

let registeredTaskCollectionLibrary: RegisteredTaskCollectionLibrary | null = null;
let registeredTaskCollectionVtableAddress = 0n;
let registeredTaskLibrary: RegisteredTaskLibrary | null = null;
let registeredTaskVtableAddress = 0n;
let taskFolderCollectionLibrary: TaskFolderCollectionLibrary | null = null;
let taskFolderCollectionVtableAddress = 0n;
let taskFolderLibrary: TaskFolderLibrary | null = null;
let taskFolderVtableAddress = 0n;

function ensureRegisteredTaskCollectionLibrary(collectionAddress: bigint) {
  const vtableAddress = readPointerValue(collectionAddress);

  if (registeredTaskCollectionLibrary === null || registeredTaskCollectionVtableAddress !== vtableAddress) {
    registeredTaskCollectionLibrary?.close();
    registeredTaskCollectionLibrary = createRegisteredTaskCollectionLibrary(collectionAddress);
    registeredTaskCollectionVtableAddress = vtableAddress;
  }

  return registeredTaskCollectionLibrary;
}

function ensureRegisteredTaskLibrary(taskAddress: bigint) {
  const vtableAddress = readPointerValue(taskAddress);

  if (registeredTaskLibrary === null || registeredTaskVtableAddress !== vtableAddress) {
    registeredTaskLibrary?.close();
    registeredTaskLibrary = createRegisteredTaskLibrary(taskAddress);
    registeredTaskVtableAddress = vtableAddress;
  }

  return registeredTaskLibrary;
}

function ensureTaskFolderCollectionLibrary(collectionAddress: bigint) {
  const vtableAddress = readPointerValue(collectionAddress);

  if (taskFolderCollectionLibrary === null || taskFolderCollectionVtableAddress !== vtableAddress) {
    taskFolderCollectionLibrary?.close();
    taskFolderCollectionLibrary = createTaskFolderCollectionLibrary(collectionAddress);
    taskFolderCollectionVtableAddress = vtableAddress;
  }

  return taskFolderCollectionLibrary;
}

function ensureTaskFolderLibrary(taskFolderAddress: bigint) {
  const vtableAddress = readPointerValue(taskFolderAddress);

  if (taskFolderLibrary === null || taskFolderVtableAddress !== vtableAddress) {
    taskFolderLibrary?.close();
    taskFolderLibrary = createTaskFolderLibrary(taskFolderAddress);
    taskFolderVtableAddress = vtableAddress;
  }

  return taskFolderLibrary;
}

function readTaskFolderPath(taskFolderAddress: bigint): string {
  const currentTaskFolderLibrary = ensureTaskFolderLibrary(taskFolderAddress);
  const pathBuffer = Buffer.alloc(POINTER_SIZE);
  const pathStatus = currentTaskFolderLibrary.symbols.get_Path(taskFolderAddress, pathBuffer.ptr);

  if (!isSuccessful(pathStatus)) {
    throw new Error(`ITaskFolder::get_Path failed with ${formatHResult(pathStatus)}`);
  }

  const pathAddress = pathBuffer.readBigUInt64LE(0);
  const path = readBStringValue(pathAddress);
  oleAut32.symbols.SysFreeString(pathAddress);
  return path;
}

function readTaskInfo(taskAddress: bigint, folderPath: string): TaskInfo {
  const currentRegisteredTaskLibrary = ensureRegisteredTaskLibrary(taskAddress);
  const enabledBuffer = Buffer.alloc(2);
  const enabledStatus = currentRegisteredTaskLibrary.symbols.get_Enabled(taskAddress, enabledBuffer.ptr);

  if (!isSuccessful(enabledStatus)) {
    throw new Error(`IRegisteredTask::get_Enabled failed with ${formatHResult(enabledStatus)}`);
  }

  const lastTaskResultBuffer = Buffer.alloc(4);
  const lastTaskResultStatus = currentRegisteredTaskLibrary.symbols.get_LastTaskResult(taskAddress, lastTaskResultBuffer.ptr);

  if (!isSuccessful(lastTaskResultStatus)) {
    throw new Error(`IRegisteredTask::get_LastTaskResult failed with ${formatHResult(lastTaskResultStatus)}`);
  }

  const nameBuffer = Buffer.alloc(POINTER_SIZE);
  const nameStatus = currentRegisteredTaskLibrary.symbols.get_Name(taskAddress, nameBuffer.ptr);

  if (!isSuccessful(nameStatus)) {
    throw new Error(`IRegisteredTask::get_Name failed with ${formatHResult(nameStatus)}`);
  }

  const nameAddress = nameBuffer.readBigUInt64LE(0);
  const name = readBStringValue(nameAddress);
  oleAut32.symbols.SysFreeString(nameAddress);

  const nextRunTimeBuffer = Buffer.alloc(8);
  const nextRunTimeStatus = currentRegisteredTaskLibrary.symbols.get_NextRunTime(taskAddress, nextRunTimeBuffer.ptr);

  if (!isSuccessful(nextRunTimeStatus)) {
    throw new Error(`IRegisteredTask::get_NextRunTime failed with ${formatHResult(nextRunTimeStatus)}`);
  }

  const nextRunTimeValue = nextRunTimeBuffer.readDoubleLE(0);
  let nextRunLabel: string | null = null;
  let nextRunSortKey: number | null = null;

  if (nextRunTimeValue > 0) {
    const systemTimeBuffer = Buffer.alloc(SYSTEM_TIME_SIZE);
    const variantTimeStatus = oleAut32.symbols.VariantTimeToSystemTime(nextRunTimeValue, systemTimeBuffer.ptr);

    if (variantTimeStatus !== 0) {
      const formattedSystemTime = formatSystemTime(systemTimeBuffer);
      nextRunLabel = formattedSystemTime.label;
      nextRunSortKey = formattedSystemTime.sortKey;
    }
  }

  const pathBuffer = Buffer.alloc(POINTER_SIZE);
  const pathStatus = currentRegisteredTaskLibrary.symbols.get_Path(taskAddress, pathBuffer.ptr);

  if (!isSuccessful(pathStatus)) {
    throw new Error(`IRegisteredTask::get_Path failed with ${formatHResult(pathStatus)}`);
  }

  const pathAddress = pathBuffer.readBigUInt64LE(0);
  const path = readBStringValue(pathAddress);
  oleAut32.symbols.SysFreeString(pathAddress);

  const stateBuffer = Buffer.alloc(4);
  const stateStatus = currentRegisteredTaskLibrary.symbols.get_State(taskAddress, stateBuffer.ptr);

  if (!isSuccessful(stateStatus)) {
    throw new Error(`IRegisteredTask::get_State failed with ${formatHResult(stateStatus)}`);
  }

  return {
    enabled: enabledBuffer.readInt16LE(0) !== 0,
    folderPath,
    lastTaskResult: lastTaskResultBuffer.readInt32LE(0),
    name,
    nextRunLabel,
    nextRunSortKey,
    path,
    state: stateBuffer.readInt32LE(0),
  };
}

const emptyDomainVariantBuffer = Buffer.alloc(VARIANT_SIZE);
const emptyPasswordVariantBuffer = Buffer.alloc(VARIANT_SIZE);
const emptyServerVariantBuffer = Buffer.alloc(VARIANT_SIZE);
const emptyUserVariantBuffer = Buffer.alloc(VARIANT_SIZE);
const initializeStatus = ole32.symbols.CoInitializeEx(null, COINIT_MULTITHREADED);
const shouldUninitialize = isSuccessful(initializeStatus);
const initializeSecurityStatus = isSuccessful(initializeStatus)
  ? ole32.symbols.CoInitializeSecurity(null, -1, null, null, RPC_C_AUTHN_LEVEL_PKT_PRIVACY, RPC_C_IMP_LEVEL_IMPERSONATE, null, 0, null)
  : initializeStatus;
const classFactoryBuffer = Buffer.alloc(POINTER_SIZE);
const classObjectStatus = isSuccessful(initializeStatus)
  ? Taskschd.DllGetClassObject(clsidTaskSchedulerBuffer.ptr, iidIClassFactoryBuffer.ptr, classFactoryBuffer.ptr)
  : initializeStatus;

let classFactoryAddress = 0n;
let classFactoryLibrary: ClassFactoryLibrary | null = null;
let classFactoryReleaseCount: number | null = null;
let createInstanceStatus: number | null = null;
let taskServiceAddress = 0n;
let taskServiceLibrary: TaskServiceLibrary | null = null;
let taskServiceReleaseCount: number | null = null;
let rootFolderAddress = 0n;
let rootFolderReleaseCount: number | null = null;
let connectStatus: number | null = null;
let failure: Error | null = null;
let folderScanErrors: FolderScanError[] = [];
let folderSummaries: FolderSummary[] = [];
let taskInfos: TaskInfo[] = [];
const scanStartedAt = performance.now();

function scanFolder(taskFolderAddress: bigint): void {
  const folderPath = readTaskFolderPath(taskFolderAddress);
  const currentTaskFolderLibrary = ensureTaskFolderLibrary(taskFolderAddress);
  const folderSummary: FolderSummary = {
    disabledTaskCount: 0,
    enabledTaskCount: 0,
    folderPath,
    queuedTaskCount: 0,
    readyTaskCount: 0,
    runningTaskCount: 0,
    taskCount: 0,
    unknownTaskCount: 0,
  };

  const taskCollectionBuffer = Buffer.alloc(POINTER_SIZE);
  const getTasksStatus = currentTaskFolderLibrary.symbols.GetTasks(taskFolderAddress, TASK_ENUM_HIDDEN, taskCollectionBuffer.ptr);

  if (!isSuccessful(getTasksStatus)) {
    folderScanErrors.push({ folderPath, operationName: 'ITaskFolder::GetTasks', status: getTasksStatus });
  } else {
    const taskCollectionAddress = taskCollectionBuffer.readBigUInt64LE(0);

    if (taskCollectionAddress !== 0n) {
      const currentRegisteredTaskCollectionLibrary = ensureRegisteredTaskCollectionLibrary(taskCollectionAddress);
      const taskCountBuffer = Buffer.alloc(4);
      const taskCountStatus = currentRegisteredTaskCollectionLibrary.symbols.get_Count(taskCollectionAddress, taskCountBuffer.ptr);

      if (!isSuccessful(taskCountStatus)) {
        folderScanErrors.push({ folderPath, operationName: 'IRegisteredTaskCollection::get_Count', status: taskCountStatus });
      } else {
        const taskCount = taskCountBuffer.readInt32LE(0);

        for (let taskIndex = 1; taskIndex <= taskCount; taskIndex += 1) {
          const taskBuffer = Buffer.alloc(POINTER_SIZE);
          const itemVariantBuffer = createIndexVariantBuffer(taskIndex);
          const taskItemStatus = currentRegisteredTaskCollectionLibrary.symbols.get_Item(taskCollectionAddress, itemVariantBuffer.ptr, taskBuffer.ptr);

          if (!isSuccessful(taskItemStatus)) {
            folderScanErrors.push({ folderPath, operationName: `IRegisteredTaskCollection::get_Item(${taskIndex})`, status: taskItemStatus });
            continue;
          }

          const taskAddress = taskBuffer.readBigUInt64LE(0);

          if (taskAddress === 0n) {
            folderScanErrors.push({ folderPath, operationName: `IRegisteredTaskCollection::get_Item(${taskIndex})`, status: -1 });
            continue;
          }

          try {
            const taskInfo = readTaskInfo(taskAddress, folderPath);
            taskInfos.push(taskInfo);
            folderSummary.taskCount += 1;

            if (taskInfo.enabled) {
              folderSummary.enabledTaskCount += 1;
            }

            switch (taskInfo.state) {
              case TASK_STATE_DISABLED:
                folderSummary.disabledTaskCount += 1;
                break;
              case TASK_STATE_QUEUED:
                folderSummary.queuedTaskCount += 1;
                break;
              case TASK_STATE_READY:
                folderSummary.readyTaskCount += 1;
                break;
              case TASK_STATE_RUNNING:
                folderSummary.runningTaskCount += 1;
                break;
              default:
                folderSummary.unknownTaskCount += 1;
                break;
            }
          } catch (error) {
            const taskError = error instanceof Error ? error.message : String(error);
            folderScanErrors.push({ folderPath, operationName: `IRegisteredTask::read(${taskIndex}) ${taskError}`, status: -1 });
          } finally {
            const currentRegisteredTaskLibrary = ensureRegisteredTaskLibrary(taskAddress);
            void currentRegisteredTaskLibrary.symbols.Release(taskAddress);
          }
        }
      }

      void currentRegisteredTaskCollectionLibrary.symbols.Release(taskCollectionAddress);
    }
  }

  const folderCollectionBuffer = Buffer.alloc(POINTER_SIZE);
  const getFoldersStatus = currentTaskFolderLibrary.symbols.GetFolders(taskFolderAddress, 0, folderCollectionBuffer.ptr);

  if (!isSuccessful(getFoldersStatus)) {
    folderScanErrors.push({ folderPath, operationName: 'ITaskFolder::GetFolders', status: getFoldersStatus });
  } else {
    const folderCollectionAddress = folderCollectionBuffer.readBigUInt64LE(0);

    if (folderCollectionAddress !== 0n) {
      const currentTaskFolderCollectionLibrary = ensureTaskFolderCollectionLibrary(folderCollectionAddress);
      const folderCountBuffer = Buffer.alloc(4);
      const folderCountStatus = currentTaskFolderCollectionLibrary.symbols.get_Count(folderCollectionAddress, folderCountBuffer.ptr);

      if (!isSuccessful(folderCountStatus)) {
        folderScanErrors.push({ folderPath, operationName: 'ITaskFolderCollection::get_Count', status: folderCountStatus });
      } else {
        const folderCount = folderCountBuffer.readInt32LE(0);

        for (let folderIndex = 1; folderIndex <= folderCount; folderIndex += 1) {
          const childFolderBuffer = Buffer.alloc(POINTER_SIZE);
          const itemVariantBuffer = createIndexVariantBuffer(folderIndex);
          const childFolderStatus = currentTaskFolderCollectionLibrary.symbols.get_Item(folderCollectionAddress, itemVariantBuffer.ptr, childFolderBuffer.ptr);

          if (!isSuccessful(childFolderStatus)) {
            folderScanErrors.push({ folderPath, operationName: `ITaskFolderCollection::get_Item(${folderIndex})`, status: childFolderStatus });
            continue;
          }

          const childFolderAddress = childFolderBuffer.readBigUInt64LE(0);

          if (childFolderAddress === 0n) {
            folderScanErrors.push({ folderPath, operationName: `ITaskFolderCollection::get_Item(${folderIndex})`, status: -1 });
            continue;
          }

          try {
            scanFolder(childFolderAddress);
          } finally {
            const currentTaskFolderLibraryToRelease = ensureTaskFolderLibrary(childFolderAddress);
            void currentTaskFolderLibraryToRelease.symbols.Release(childFolderAddress);
          }
        }
      }

      void currentTaskFolderCollectionLibrary.symbols.Release(folderCollectionAddress);
    }
  }

  folderSummaries.push(folderSummary);
}

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

  const rootFolderBString = oleAut32.symbols.SysAllocString(createWideStringBuffer(ROOT_FOLDER_PATH).ptr);

  if (rootFolderBString === 0n) {
    throw new Error('SysAllocString failed for the root folder path');
  }

  try {
    const rootFolderBuffer = Buffer.alloc(POINTER_SIZE);
    const rootFolderStatus = taskServiceLibrary.symbols.GetFolder(taskServiceAddress, rootFolderBString, rootFolderBuffer.ptr);

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

  scanFolder(rootFolderAddress);
} catch (error) {
  failure = error instanceof Error ? error : new Error(String(error));
} finally {
  if (rootFolderAddress !== 0n) {
    const currentTaskFolderLibrary = ensureTaskFolderLibrary(rootFolderAddress);
    rootFolderReleaseCount = currentTaskFolderLibrary.symbols.Release(rootFolderAddress);
  }

  if (taskServiceLibrary !== null && taskServiceAddress !== 0n) {
    taskServiceReleaseCount = taskServiceLibrary.symbols.Release(taskServiceAddress);
  }

  if (classFactoryLibrary !== null && classFactoryAddress !== 0n) {
    classFactoryReleaseCount = classFactoryLibrary.symbols.Release(classFactoryAddress);
  }

  classFactoryLibrary?.close();
  taskServiceLibrary?.close();

  if (shouldUninitialize) {
    ole32.symbols.CoUninitialize();
  }

  kernel32.close();
  ole32.close();
  oleAut32.close();
}

const scanDurationMilliseconds = performance.now() - scanStartedAt;

if (failure !== null) {
  console.error(`${ANSI.bold}${ANSI.red}Schedule Constellation${ANSI.reset}`);
  console.error(`${ANSI.red}${failure.message}${ANSI.reset}`);
  process.exitCode = 1;
} else {
  const totalTaskCount = taskInfos.length;
  const totalFolderCount = folderSummaries.length;
  const enabledTaskCount = taskInfos.filter(({ enabled }) => enabled).length;
  const runningTaskCount = taskInfos.filter(({ state }) => state === TASK_STATE_RUNNING).length;
  const readyTaskCount = taskInfos.filter(({ state }) => state === TASK_STATE_READY).length;
  const queuedTaskCount = taskInfos.filter(({ state }) => state === TASK_STATE_QUEUED).length;
  const disabledTaskCount = taskInfos.filter(({ state }) => state === TASK_STATE_DISABLED).length;
  const unknownTaskCount = taskInfos.filter(({ state }) => state !== TASK_STATE_DISABLED && state !== TASK_STATE_QUEUED && state !== TASK_STATE_READY && state !== TASK_STATE_RUNNING).length;
  const busiestFolders = [...folderSummaries]
    .sort((left, right) => {
      if (left.taskCount === right.taskCount) {
        if (left.runningTaskCount === right.runningTaskCount) {
          return left.folderPath.localeCompare(right.folderPath);
        }

        return right.runningTaskCount - left.runningTaskCount;
      }

      return right.taskCount - left.taskCount;
    })
    .slice(0, 8);
  const upcomingTasks = [...taskInfos]
    .filter(({ nextRunSortKey }) => nextRunSortKey !== null)
    .sort((left, right) => {
      if (left.nextRunSortKey === right.nextRunSortKey) {
        return left.path.localeCompare(right.path);
      }

      if (left.nextRunSortKey === null) {
        return 1;
      }

      if (right.nextRunSortKey === null) {
        return -1;
      }

      return left.nextRunSortKey - right.nextRunSortKey;
    })
    .slice(0, 10);

  console.log(`${ANSI.bold}${ANSI.cyan}Schedule Constellation${ANSI.reset}`);
  console.log(`${ANSI.dim}Full Task Scheduler tree scan through taskschd.dll, hidden tasks included${ANSI.reset}`);
  console.log('');
  console.log(`${ANSI.bold}Scan Summary${ANSI.reset}`);
  console.log(`  ${ANSI.dim}Folders scanned  ${ANSI.reset} ${totalFolderCount}`);
  console.log(`  ${ANSI.dim}Tasks discovered ${ANSI.reset} ${totalTaskCount}`);
  console.log(`  ${ANSI.dim}Enabled tasks   ${ANSI.reset} ${enabledTaskCount}`);
  console.log(`  ${ANSI.dim}Scan duration   ${ANSI.reset} ${scanDurationMilliseconds.toFixed(0)} ms`);
  console.log(`  ${ANSI.dim}Scan warnings   ${ANSI.reset} ${folderScanErrors.length}`);
  console.log('');
  console.log(`${ANSI.bold}State Mix${ANSI.reset}`);

  const stateRows: Array<[string, number, string]> = [
    ['Running', runningTaskCount, ANSI.green],
    ['Ready', readyTaskCount, ANSI.cyan],
    ['Queued', queuedTaskCount, ANSI.yellow],
    ['Disabled', disabledTaskCount, ANSI.dim],
    ['Unknown', unknownTaskCount, ANSI.red],
  ];
  const highestStateCount = Math.max(1, ...stateRows.map(([, value]) => value));

  for (const [label, count, color] of stateRows) {
    const filledCount = totalTaskCount === 0 ? 0 : Math.max(0, Math.round((count / highestStateCount) * 28));
    const bar = `${'#'.repeat(filledCount)}${'.'.repeat(28 - filledCount)}`;
    console.log(`  ${label.padEnd(8, ' ')} ${String(count).padStart(4, ' ')}  ${color}${bar}${ANSI.reset}`);
  }

  console.log('');
  console.log(`${ANSI.bold}Busiest Folders${ANSI.reset}`);
  console.log(`  ${truncate('Folder', 54)} ${'Tasks'.padStart(5, ' ')} ${'Enabled'.padStart(7, ' ')} ${'Run'.padStart(5, ' ')}`);

  for (const folderSummary of busiestFolders) {
    console.log(
      `  ${truncate(folderSummary.folderPath, 54)} ${String(folderSummary.taskCount).padStart(5, ' ')} ${String(folderSummary.enabledTaskCount).padStart(7, ' ')} ${String(folderSummary.runningTaskCount).padStart(5, ' ')}`,
    );
  }

  console.log('');
  console.log(`${ANSI.bold}Next Launches${ANSI.reset}`);
  console.log(`  ${truncate('Next run', 19)} ${truncate('State', 9)} ${truncate('Result', 10)} ${truncate('Task', 62)}`);

  if (upcomingTasks.length === 0) {
    console.log(`  ${ANSI.dim}(no scheduled future runs reported)${ANSI.reset}`);
  } else {
    for (const taskInfo of upcomingTasks) {
      console.log(
        `  ${truncate(taskInfo.nextRunLabel ?? 'n/a', 19)} ${truncate(formatStateLabel(taskInfo.state), 9)} ${truncate(formatHResult(taskInfo.lastTaskResult), 10)} ${truncate(taskInfo.path, 62)}`,
      );
    }
  }

  if (folderScanErrors.length > 0) {
    console.log('');
    console.log(`${ANSI.bold}Warnings${ANSI.reset}`);

    for (const folderScanError of folderScanErrors.slice(0, 8)) {
      console.log(`  ${ANSI.yellow}${truncate(formatFolderError(folderScanError), 108)}${ANSI.reset}`);
    }

    if (folderScanErrors.length > 8) {
      console.log(`  ${ANSI.dim}... ${folderScanErrors.length - 8} more warnings omitted${ANSI.reset}`);
    }
  }

  console.log('');
  console.log(`${ANSI.bold}Release Counts${ANSI.reset}`);
  console.log(`  ${ANSI.dim}Class factory${ANSI.reset} ${classFactoryReleaseCount ?? 0}`);
  console.log(`  ${ANSI.dim}Task service ${ANSI.reset} ${taskServiceReleaseCount ?? 0}`);
  console.log(`  ${ANSI.dim}Root folder  ${ANSI.reset} ${rootFolderReleaseCount ?? 0}`);
}
