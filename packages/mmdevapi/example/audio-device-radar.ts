/**
 * Audio Device Radar
 *
 * Builds a live inventory of every audio endpoint on this system by driving
 * `mmdevapi.dll` end-to-end — resolves the `MMDeviceEnumerator` class factory
 * via `Mmdevapi.DllGetClassObject`, materializes an `IMMDeviceEnumerator`
 * through `IClassFactory::CreateInstance`, queries the default render and
 * capture endpoints per role (console/multimedia/communications), enumerates
 * every render + capture endpoint across every state (active, disabled,
 * unplugged, not-present), and walks each endpoint through `IMMDevice::GetId`,
 * `IMMDevice::GetState`, `IMMDevice::OpenPropertyStore`, and
 * `IPropertyStore::GetValue(PKEY_Device_FriendlyName / PKEY_DeviceInterface_FriendlyName)`
 * to pull real friendly names off the system. Renders the result as a colored
 * ANSI dashboard with default-endpoint badges, a state legend, and a per-flow
 * summary. Releases every COM object it touches.
 *
 * APIs demonstrated:
 *   - Mmdevapi.DllGetClassObject                      (resolve MMDevice class factory)
 *   - IClassFactory::CreateInstance                   (create IMMDeviceEnumerator)
 *   - IMMDeviceEnumerator::EnumAudioEndpoints         (enumerate all endpoints)
 *   - IMMDeviceEnumerator::GetDefaultAudioEndpoint    (per-role defaults)
 *   - IMMDeviceCollection::GetCount / Item            (walk the collection)
 *   - IMMDevice::GetId / GetState / OpenPropertyStore (per-endpoint metadata)
 *   - IPropertyStore::GetValue                        (PKEY_Device_FriendlyName)
 *   - IUnknown::Release                               (full release chain)
 *   - ole32!CoInitializeEx / CoTaskMemFree / CoUninitialize (COM lifecycle)
 *
 * Run: bun run example:audio-device-radar
 */

import { FFIType, dlopen, linkSymbols } from 'bun:ffi';

import Mmdevapi, {
  CLSID_MMDeviceEnumerator,
  DEVICE_STATE,
  EDataFlow,
  ERole,
  IID_IMMDeviceEnumerator,
} from '..';

const ANSI = {
  bold: '\x1b[1m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  magenta: '\x1b[35m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
  yellow: '\x1b[33m',
} as const;

const COINIT_APARTMENTTHREADED = 0x2;
const CREATE_INSTANCE_OFFSET = 0x18;
const DEVPROPKEY_SIZE = 20;
const ENUM_AUDIO_ENDPOINTS_OFFSET = 0x18;
const GET_COUNT_OFFSET_COLLECTION = 0x18;
const GET_DEFAULT_AUDIO_ENDPOINT_OFFSET = 0x20;
const GET_ID_OFFSET = 0x28;
const GET_STATE_OFFSET = 0x30;
const GET_VALUE_OFFSET = 0x28;
const IID_ICLASSFACTORY = '00000001-0000-0000-c000-000000000046';
const ITEM_OFFSET = 0x20;
const OPEN_PROPERTY_STORE_OFFSET = 0x20;
const POINTER_SIZE = 8;
const PROPVARIANT_SIZE = 24;
const RELEASE_METHOD_OFFSET = 0x10;
const RPC_E_CHANGED_MODE = 0x8001_0106 >>> 0;
const STGM_READ = 0x0;
const VT_LPWSTR = 31;

const kernel32 = dlopen('kernel32.dll', {
  GetCurrentProcess: { args: [], returns: FFIType.u64 },
  ReadProcessMemory: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
});

const ole32 = dlopen('ole32.dll', {
  CoInitializeEx: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
  CoTaskMemFree: { args: [FFIType.u64], returns: FFIType.void },
  CoUninitialize: { args: [], returns: FFIType.void },
});

const currentProcess = kernel32.symbols.GetCurrentProcess();

Mmdevapi.Preload(['DllGetClassObject']);

interface EndpointRecord {
  dataFlow: 'Render' | 'Capture';
  defaults: string[];
  endpointId: string;
  friendlyName: string;
  interfaceName: string;
  state: number;
}

function buildPropertyKey(fmtid: string, pid: number): Buffer {
  const buffer = Buffer.alloc(DEVPROPKEY_SIZE);
  guidBytes(fmtid).copy(buffer, 0);
  buffer.writeUInt32LE(pid, 16);
  return buffer;
}

function describeState(state: number): { color: string; label: string } {
  if ((state & DEVICE_STATE.DEVICE_STATE_ACTIVE) !== 0) return { color: ANSI.green, label: 'active' };
  if ((state & DEVICE_STATE.DEVICE_STATE_DISABLED) !== 0) return { color: ANSI.yellow, label: 'disabled' };
  if ((state & DEVICE_STATE.DEVICE_STATE_UNPLUGGED) !== 0) return { color: ANSI.magenta, label: 'unplugged' };
  if ((state & DEVICE_STATE.DEVICE_STATE_NOTPRESENT) !== 0) return { color: ANSI.dim, label: 'not-present' };
  return { color: ANSI.dim, label: 'unknown' };
}

function formatHResult(value: number): string {
  return `0x${(value >>> 0).toString(16).padStart(8, '0')}`;
}

function guidBytes(value: string): Buffer {
  const match = /^([0-9a-f]{8})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{12})$/i.exec(value);
  if (match === null) throw new Error(`Invalid GUID: ${value}`);
  const [, d1, d2, d3, d4High, d4Low] = match;
  const buffer = Buffer.alloc(16);
  buffer.writeUInt32LE(parseInt(d1, 16), 0);
  buffer.writeUInt16LE(parseInt(d2, 16), 4);
  buffer.writeUInt16LE(parseInt(d3, 16), 6);
  const data4 = `${d4High}${d4Low}`;
  for (let i = 0; i < 8; i += 1) buffer[8 + i] = parseInt(data4.slice(i * 2, i * 2 + 2), 16);
  return buffer;
}

function readLpwstrFromPropVariant(pv: Buffer): string {
  if (pv.readUInt16LE(0) !== VT_LPWSTR) return '';
  const address = pv.readBigUInt64LE(8);
  if (address === 0n) return '';
  const text = readWideStringAt(address);
  ole32.symbols.CoTaskMemFree(address);
  return text;
}

function readPointerAt(address: bigint): bigint {
  const buffer = Buffer.alloc(POINTER_SIZE);
  const ok = kernel32.symbols.ReadProcessMemory(currentProcess, address, buffer.ptr, BigInt(POINTER_SIZE), null);
  if (ok === 0) throw new Error(`ReadProcessMemory failed at 0x${address.toString(16)}`);
  return buffer.readBigUInt64LE(0);
}

function readVtableMethod(objectAddress: bigint, methodOffset: number): bigint {
  const vtableAddress = readPointerAt(objectAddress);
  return readPointerAt(vtableAddress + BigInt(methodOffset));
}

function readWideStringAt(address: bigint): string {
  if (address === 0n) return '';
  const MAX_WCHARS = 512;
  const buffer = Buffer.alloc(MAX_WCHARS * 2);
  const ok = kernel32.symbols.ReadProcessMemory(currentProcess, address, buffer.ptr, BigInt(buffer.length), null);
  if (ok === 0) return '';
  let end = 0;
  while (end < MAX_WCHARS) {
    if (buffer.readUInt16LE(end * 2) === 0) break;
    end += 1;
  }
  return new TextDecoder('utf-16').decode(buffer.subarray(0, end * 2));
}

function truncate(text: string, width: number): string {
  if (text.length <= width) return text;
  return `${text.slice(0, width - 1)}…`;
}

const PKEY_DEVICE_FRIENDLY_NAME = buildPropertyKey('a45c254e-df1c-4efd-8020-67d146a850e0', 14);
const PKEY_DEVICEINTERFACE_FRIENDLY_NAME = buildPropertyKey('026e516e-b814-414b-83cd-856d6fef4822', 2);

const coInitHr = ole32.symbols.CoInitializeEx(null, COINIT_APARTMENTTHREADED);
const shouldUninitialize = coInitHr >= 0;
if (coInitHr < 0 && (coInitHr >>> 0) !== RPC_E_CHANGED_MODE) {
  console.error(`${ANSI.red}CoInitializeEx failed: ${formatHResult(coInitHr)}${ANSI.reset}`);
  process.exit(1);
}

const clsidEnumerator = guidBytes(CLSID_MMDeviceEnumerator);
const iidEnumerator = guidBytes(IID_IMMDeviceEnumerator);
const iidClassFactory = guidBytes(IID_ICLASSFACTORY);

const factoryOut = Buffer.alloc(POINTER_SIZE);
const factoryHr = Mmdevapi.DllGetClassObject(clsidEnumerator.ptr, iidClassFactory.ptr, factoryOut.ptr);
if (factoryHr !== 0) {
  console.error(`${ANSI.red}DllGetClassObject failed: ${formatHResult(factoryHr)}${ANSI.reset}`);
  if (shouldUninitialize) ole32.symbols.CoUninitialize();
  process.exit(1);
}
const factoryAddress = factoryOut.readBigUInt64LE(0);

const factoryVtable = linkSymbols({
  CreateInstance: {
    args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr],
    ptr: readVtableMethod(factoryAddress, CREATE_INSTANCE_OFFSET),
    returns: FFIType.i32,
  },
  Release: {
    args: [FFIType.u64],
    ptr: readVtableMethod(factoryAddress, RELEASE_METHOD_OFFSET),
    returns: FFIType.u32,
  },
});

const enumeratorOut = Buffer.alloc(POINTER_SIZE);
const createHr = factoryVtable.symbols.CreateInstance(factoryAddress, 0n, iidEnumerator.ptr, enumeratorOut.ptr);
if (createHr !== 0) {
  console.error(`${ANSI.red}IClassFactory::CreateInstance failed: ${formatHResult(createHr)}${ANSI.reset}`);
  factoryVtable.symbols.Release(factoryAddress);
  factoryVtable.close();
  if (shouldUninitialize) ole32.symbols.CoUninitialize();
  process.exit(1);
}
const enumeratorAddress = enumeratorOut.readBigUInt64LE(0);

const enumeratorVtable = linkSymbols({
  EnumAudioEndpoints: {
    args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr],
    ptr: readVtableMethod(enumeratorAddress, ENUM_AUDIO_ENDPOINTS_OFFSET),
    returns: FFIType.i32,
  },
  GetDefaultAudioEndpoint: {
    args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr],
    ptr: readVtableMethod(enumeratorAddress, GET_DEFAULT_AUDIO_ENDPOINT_OFFSET),
    returns: FFIType.i32,
  },
  Release: {
    args: [FFIType.u64],
    ptr: readVtableMethod(enumeratorAddress, RELEASE_METHOD_OFFSET),
    returns: FFIType.u32,
  },
});

const defaultsById = new Map<string, string[]>();

function tagDefault(flow: EDataFlow, role: ERole, tag: string): void {
  const out = Buffer.alloc(POINTER_SIZE);
  const hr = enumeratorVtable.symbols.GetDefaultAudioEndpoint(enumeratorAddress, flow, role, out.ptr);
  if (hr !== 0) return;
  const address = out.readBigUInt64LE(0);
  if (address === 0n) return;
  const deviceLib = linkSymbols({
    GetId: { args: [FFIType.u64, FFIType.ptr], ptr: readVtableMethod(address, GET_ID_OFFSET), returns: FFIType.i32 },
    Release: { args: [FFIType.u64], ptr: readVtableMethod(address, RELEASE_METHOD_OFFSET), returns: FFIType.u32 },
  });
  try {
    const idOut = Buffer.alloc(POINTER_SIZE);
    if (deviceLib.symbols.GetId(address, idOut.ptr) === 0) {
      const idAddress = idOut.readBigUInt64LE(0);
      const id = readWideStringAt(idAddress);
      if (idAddress !== 0n) ole32.symbols.CoTaskMemFree(idAddress);
      const existing = defaultsById.get(id) ?? [];
      defaultsById.set(id, [...existing, tag]);
    }
  } finally {
    deviceLib.symbols.Release(address);
    deviceLib.close();
  }
}

tagDefault(EDataFlow.eRender, ERole.eConsole, 'render·console');
tagDefault(EDataFlow.eRender, ERole.eMultimedia, 'render·multimedia');
tagDefault(EDataFlow.eRender, ERole.eCommunications, 'render·communications');
tagDefault(EDataFlow.eCapture, ERole.eConsole, 'capture·console');
tagDefault(EDataFlow.eCapture, ERole.eMultimedia, 'capture·multimedia');
tagDefault(EDataFlow.eCapture, ERole.eCommunications, 'capture·communications');

const records: EndpointRecord[] = [];

function walkCollection(flow: EDataFlow, flowLabel: 'Render' | 'Capture'): void {
  const collectionOut = Buffer.alloc(POINTER_SIZE);
  if (enumeratorVtable.symbols.EnumAudioEndpoints(enumeratorAddress, flow, DEVICE_STATE.DEVICE_STATEMASK_ALL, collectionOut.ptr) !== 0) return;
  const collectionAddress = collectionOut.readBigUInt64LE(0);
  if (collectionAddress === 0n) return;

  const collectionVtable = linkSymbols({
    GetCount: {
      args: [FFIType.u64, FFIType.ptr],
      ptr: readVtableMethod(collectionAddress, GET_COUNT_OFFSET_COLLECTION),
      returns: FFIType.i32,
    },
    Item: {
      args: [FFIType.u64, FFIType.u32, FFIType.ptr],
      ptr: readVtableMethod(collectionAddress, ITEM_OFFSET),
      returns: FFIType.i32,
    },
    Release: {
      args: [FFIType.u64],
      ptr: readVtableMethod(collectionAddress, RELEASE_METHOD_OFFSET),
      returns: FFIType.u32,
    },
  });

  try {
    const countOut = Buffer.alloc(4);
    if (collectionVtable.symbols.GetCount(collectionAddress, countOut.ptr) !== 0) return;
    const count = countOut.readUInt32LE(0);
    for (let i = 0; i < count; i += 1) {
      const deviceOut = Buffer.alloc(POINTER_SIZE);
      if (collectionVtable.symbols.Item(collectionAddress, i, deviceOut.ptr) !== 0) continue;
      const deviceAddress = deviceOut.readBigUInt64LE(0);
      if (deviceAddress === 0n) continue;

      const deviceVtable = linkSymbols({
        GetId: {
          args: [FFIType.u64, FFIType.ptr],
          ptr: readVtableMethod(deviceAddress, GET_ID_OFFSET),
          returns: FFIType.i32,
        },
        GetState: {
          args: [FFIType.u64, FFIType.ptr],
          ptr: readVtableMethod(deviceAddress, GET_STATE_OFFSET),
          returns: FFIType.i32,
        },
        OpenPropertyStore: {
          args: [FFIType.u64, FFIType.u32, FFIType.ptr],
          ptr: readVtableMethod(deviceAddress, OPEN_PROPERTY_STORE_OFFSET),
          returns: FFIType.i32,
        },
        Release: {
          args: [FFIType.u64],
          ptr: readVtableMethod(deviceAddress, RELEASE_METHOD_OFFSET),
          returns: FFIType.u32,
        },
      });

      let endpointId = '';
      let friendlyName = '';
      let interfaceName = '';
      let state = 0;

      try {
        const idOut = Buffer.alloc(POINTER_SIZE);
        if (deviceVtable.symbols.GetId(deviceAddress, idOut.ptr) === 0) {
          const idAddress = idOut.readBigUInt64LE(0);
          endpointId = readWideStringAt(idAddress);
          if (idAddress !== 0n) ole32.symbols.CoTaskMemFree(idAddress);
        }
        const stateOut = Buffer.alloc(4);
        if (deviceVtable.symbols.GetState(deviceAddress, stateOut.ptr) === 0) {
          state = stateOut.readUInt32LE(0);
        }
        const propStoreOut = Buffer.alloc(POINTER_SIZE);
        if (deviceVtable.symbols.OpenPropertyStore(deviceAddress, STGM_READ, propStoreOut.ptr) === 0) {
          const propStoreAddress = propStoreOut.readBigUInt64LE(0);
          if (propStoreAddress !== 0n) {
            const propStoreVtable = linkSymbols({
              GetValue: {
                args: [FFIType.u64, FFIType.ptr, FFIType.ptr],
                ptr: readVtableMethod(propStoreAddress, GET_VALUE_OFFSET),
                returns: FFIType.i32,
              },
              Release: {
                args: [FFIType.u64],
                ptr: readVtableMethod(propStoreAddress, RELEASE_METHOD_OFFSET),
                returns: FFIType.u32,
              },
            });
            try {
              const friendlyPv = Buffer.alloc(PROPVARIANT_SIZE);
              if (propStoreVtable.symbols.GetValue(propStoreAddress, PKEY_DEVICE_FRIENDLY_NAME.ptr, friendlyPv.ptr) === 0) {
                friendlyName = readLpwstrFromPropVariant(friendlyPv);
              }
              const interfacePv = Buffer.alloc(PROPVARIANT_SIZE);
              if (propStoreVtable.symbols.GetValue(propStoreAddress, PKEY_DEVICEINTERFACE_FRIENDLY_NAME.ptr, interfacePv.ptr) === 0) {
                interfaceName = readLpwstrFromPropVariant(interfacePv);
              }
            } finally {
              propStoreVtable.symbols.Release(propStoreAddress);
              propStoreVtable.close();
            }
          }
        }
      } finally {
        records.push({
          dataFlow: flowLabel,
          defaults: defaultsById.get(endpointId) ?? [],
          endpointId,
          friendlyName: friendlyName || '(unnamed)',
          interfaceName,
          state,
        });
        deviceVtable.symbols.Release(deviceAddress);
        deviceVtable.close();
      }
    }
  } finally {
    collectionVtable.symbols.Release(collectionAddress);
    collectionVtable.close();
  }
}

walkCollection(EDataFlow.eRender, 'Render');
walkCollection(EDataFlow.eCapture, 'Capture');

enumeratorVtable.symbols.Release(enumeratorAddress);
enumeratorVtable.close();
factoryVtable.symbols.Release(factoryAddress);
factoryVtable.close();
if (shouldUninitialize) ole32.symbols.CoUninitialize();
ole32.close();
kernel32.close();

records.sort((a, b) => {
  if (a.dataFlow !== b.dataFlow) return a.dataFlow === 'Render' ? -1 : 1;
  return a.friendlyName.localeCompare(b.friendlyName);
});

const NAME_WIDTH = Math.min(44, Math.max(20, ...records.map((r) => r.friendlyName.length)));
const INTERFACE_WIDTH = Math.min(34, Math.max(10, ...records.map((r) => r.interfaceName.length)));

console.log();
console.log(`${ANSI.bold}${ANSI.cyan}mmdevapi.dll${ANSI.reset}  ${ANSI.dim}audio endpoint radar${ANSI.reset}`);
console.log(`${ANSI.dim}enumerator  ${ANSI.reset}IMMDeviceEnumerator @ 0x${enumeratorAddress.toString(16).padStart(16, '0')}`);
console.log(`${ANSI.dim}scope       ${ANSI.reset}eRender + eCapture, DEVICE_STATEMASK_ALL`);
console.log();
console.log(
  `  ${ANSI.dim}${'Flow'.padEnd(7)}  ${'State'.padEnd(12)}  ${'Friendly name'.padEnd(NAME_WIDTH)}  ${'Controller'.padEnd(INTERFACE_WIDTH)}  Default roles${ANSI.reset}`,
);
console.log(`  ${ANSI.dim}${'─'.repeat(7 + 2 + 12 + 2 + NAME_WIDTH + 2 + INTERFACE_WIDTH + 2 + 40)}${ANSI.reset}`);

for (const record of records) {
  const state = describeState(record.state);
  const flowColor = record.dataFlow === 'Render' ? ANSI.cyan : ANSI.magenta;
  const flowTag = `${flowColor}${record.dataFlow.padEnd(7)}${ANSI.reset}`;
  const stateTag = `${state.color}${state.label.padEnd(12)}${ANSI.reset}`;
  const nameTag = `${ANSI.yellow}${truncate(record.friendlyName, NAME_WIDTH).padEnd(NAME_WIDTH)}${ANSI.reset}`;
  const interfaceTag = `${ANSI.dim}${truncate(record.interfaceName, INTERFACE_WIDTH).padEnd(INTERFACE_WIDTH)}${ANSI.reset}`;
  const defaultTag =
    record.defaults.length > 0 ? `${ANSI.bold}${ANSI.green}${record.defaults.join(' • ')}${ANSI.reset}` : `${ANSI.dim}·${ANSI.reset}`;
  console.log(`  ${flowTag}  ${stateTag}  ${nameTag}  ${interfaceTag}  ${defaultTag}`);
}

const renderCount = records.filter((r) => r.dataFlow === 'Render').length;
const captureCount = records.filter((r) => r.dataFlow === 'Capture').length;
const activeCount = records.filter((r) => (r.state & DEVICE_STATE.DEVICE_STATE_ACTIVE) !== 0).length;
const unpluggedCount = records.filter((r) => (r.state & DEVICE_STATE.DEVICE_STATE_UNPLUGGED) !== 0).length;
const disabledCount = records.filter((r) => (r.state & DEVICE_STATE.DEVICE_STATE_DISABLED) !== 0).length;
const notPresentCount = records.filter((r) => (r.state & DEVICE_STATE.DEVICE_STATE_NOTPRESENT) !== 0).length;

console.log();
console.log(
  `  ${ANSI.bold}${records.length}${ANSI.reset} endpoints  ${ANSI.dim}•${ANSI.reset}  ${ANSI.cyan}${renderCount} render${ANSI.reset}  ${ANSI.dim}•${ANSI.reset}  ${ANSI.magenta}${captureCount} capture${ANSI.reset}`,
);
console.log(
  `  ${ANSI.green}${activeCount} active${ANSI.reset}  ${ANSI.dim}•${ANSI.reset}  ${ANSI.yellow}${disabledCount} disabled${ANSI.reset}  ${ANSI.dim}•${ANSI.reset}  ${ANSI.magenta}${unpluggedCount} unplugged${ANSI.reset}  ${ANSI.dim}•${ANSI.reset}  ${ANSI.dim}${notPresentCount} not-present${ANSI.reset}`,
);
console.log();
