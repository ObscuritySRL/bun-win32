/**
 * Mmdevapi Factory Probe
 *
 * Exercises every named entry point exported by `mmdevapi.dll` and reports a
 * diagnostic matrix describing which factory paths succeed on this machine.
 * Initializes COM as multithreaded (`ActivateAudioInterfaceAsync` rejects STA
 * callers with `E_ILLEGAL_METHOD_CALL`), probes `DllCanUnloadNow` before and
 * after live objects exist, resolves the `MMDeviceEnumerator` class factory
 * via `DllGetClassObject`, materializes an `IMMDeviceEnumerator` through
 * `IClassFactory::CreateInstance`, and calls `ActivateAudioInterfaceAsync`
 * with a synthesized in-process `IActivateAudioInterfaceCompletionHandler`
 * whose vtable is built from `JSCallback`s (driving the async activation to
 * completion and capturing the resulting HRESULT + `IUnknown*` via
 * `IActivateAudioInterfaceAsyncOperation::GetActivateResult`).
 * `DllRegisterServer` / `DllUnregisterServer` are bound but not invoked
 * (they mutate the system registry and require elevation — the probe
 * reports them as available but intentionally uninvoked).
 *
 * APIs demonstrated:
 *   - Mmdevapi.ActivateAudioInterfaceAsync          (async IAudioClient activation)
 *   - Mmdevapi.DllCanUnloadNow                      (COM unload probe)
 *   - Mmdevapi.DllGetClassObject                    (resolve class factory)
 *   - Mmdevapi.DllRegisterServer                    (bound; reported, not invoked)
 *   - Mmdevapi.DllUnregisterServer                  (bound; reported, not invoked)
 *   - IClassFactory::CreateInstance                 (instantiate IMMDeviceEnumerator)
 *   - IMMDeviceEnumerator::GetDefaultAudioEndpoint  (locate a render endpoint)
 *   - IMMDevice::GetId                              (resolve endpoint device path)
 *   - IActivateAudioInterfaceAsyncOperation::GetActivateResult (read async result)
 *   - IUnknown::Release                             (full release chain)
 *   - JSCallback                                    (build a COM vtable in JS)
 *   - ole32!CoInitializeEx / CoTaskMemFree / CoUninitialize (COM lifecycle)
 *
 * Run: bun run example:mmdevapi-factory-probe
 */

import { FFIType, JSCallback, dlopen, linkSymbols, ptr } from 'bun:ffi';

import Mmdevapi, { CLSID_MMDeviceEnumerator, EDataFlow, ERole, IID_IAudioClient, IID_IMMDeviceEnumerator } from '..';

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

const COINIT_MULTITHREADED = 0x0;
const CREATE_INSTANCE_OFFSET = 0x18;
const E_NOINTERFACE = 0x8000_4002 | 0;
const GET_ACTIVATE_RESULT_OFFSET = 0x18;
const GET_DEFAULT_AUDIO_ENDPOINT_OFFSET = 0x20;
const GET_ID_OFFSET = 0x28;
const IID_IACTIVATE_COMPLETION_HANDLER = '41d949ab-9862-444a-80f6-c261334da5eb';
const IID_IAGILE_OBJECT = '94ea2b94-e9cc-49e0-c0ff-ee64ca8f5b90';
const IID_ICLASSFACTORY = '00000001-0000-0000-c000-000000000046';
const IID_IUNKNOWN = '00000000-0000-0000-c000-000000000046';
const KSCATEGORY_RENDER = '{E6327CAD-DCEC-4949-AE8A-991E976A79D2}';
const POINTER_SIZE = 8;
const RELEASE_METHOD_OFFSET = 0x10;
const RPC_E_CHANGED_MODE = 0x8001_0106 >>> 0;
const S_FALSE = 0x0000_0001;

const kernel32 = dlopen('kernel32.dll', {
  GetCurrentProcess: { args: [], returns: FFIType.u64 },
  ReadProcessMemory: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
  RtlMoveMemory: { args: [FFIType.u64, FFIType.u64, FFIType.u64], returns: FFIType.void },
});

const ole32 = dlopen('ole32.dll', {
  CoInitializeEx: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
  CoTaskMemFree: { args: [FFIType.u64], returns: FFIType.void },
  CoUninitialize: { args: [], returns: FFIType.void },
});

const currentProcess = kernel32.symbols.GetCurrentProcess();

Mmdevapi.Preload();

type CheckStatus = 'ok' | 'fail' | 'info' | 'skip';

interface Check {
  detail: string;
  hr: number | null;
  name: string;
  status: CheckStatus;
}

const checks: Check[] = [];

function describeHResult(hr: number): string {
  if (hr === 0) return `${ANSI.green}S_OK${ANSI.reset}`;
  if (hr === S_FALSE) return `${ANSI.yellow}S_FALSE${ANSI.reset}`;
  return `${ANSI.red}${formatHResult(hr)}${ANSI.reset}`;
}

function formatAddress(value: bigint): string {
  return `0x${value.toString(16).padStart(16, '0')}`;
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

function guidBytesEqual(a: Buffer, b: Buffer): boolean {
  if (a.length !== 16 || b.length !== 16) return false;
  for (let i = 0; i < 16; i += 1) if (a[i] !== b[i]) return false;
  return true;
}

function readPointerAt(address: bigint): bigint {
  const buffer = Buffer.alloc(POINTER_SIZE);
  if (kernel32.symbols.ReadProcessMemory(currentProcess, address, buffer.ptr, BigInt(POINTER_SIZE), null) === 0) {
    throw new Error(`ReadProcessMemory failed at 0x${address.toString(16)}`);
  }
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
  if (kernel32.symbols.ReadProcessMemory(currentProcess, address, buffer.ptr, BigInt(buffer.length), null) === 0) return '';
  let end = 0;
  while (end < MAX_WCHARS) {
    if (buffer.readUInt16LE(end * 2) === 0) break;
    end += 1;
  }
  return new TextDecoder('utf-16').decode(buffer.subarray(0, end * 2));
}

function recordCheck(name: string, status: CheckStatus, hr: number | null, detail: string): void {
  checks.push({ detail, hr, name, status });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function writePointerAt(destAddress: bigint, value: bigint): void {
  const buf = Buffer.alloc(POINTER_SIZE);
  buf.writeBigUInt64LE(value, 0);
  kernel32.symbols.RtlMoveMemory(destAddress, BigInt(ptr(buf)), BigInt(POINTER_SIZE));
}

const coInitHr = ole32.symbols.CoInitializeEx(null, COINIT_MULTITHREADED);
const shouldUninitialize = coInitHr >= 0;
if (coInitHr < 0 && (coInitHr >>> 0) !== RPC_E_CHANGED_MODE) {
  console.error(`${ANSI.red}CoInitializeEx failed: ${formatHResult(coInitHr)}${ANSI.reset}`);
  process.exit(1);
}
recordCheck(
  'CoInitializeEx',
  coInitHr >= 0 || (coInitHr >>> 0) === RPC_E_CHANGED_MODE ? 'ok' : 'fail',
  coInitHr,
  (coInitHr >>> 0) === RPC_E_CHANGED_MODE ? 'apartment = MTA (already STA on this thread)' : 'apartment = MTA',
);

const unloadBaseline = Mmdevapi.DllCanUnloadNow();
recordCheck(
  'DllCanUnloadNow (baseline)',
  unloadBaseline === 0 || unloadBaseline === S_FALSE ? 'ok' : 'fail',
  unloadBaseline,
  unloadBaseline === S_FALSE ? 'server holds live refs' : 'server reports unloadable',
);

const clsidEnumerator = guidBytes(CLSID_MMDeviceEnumerator);
const iidEnumerator = guidBytes(IID_IMMDeviceEnumerator);
const iidClassFactory = guidBytes(IID_ICLASSFACTORY);
const iidAudioClient = guidBytes(IID_IAudioClient);
const iidUnknown = guidBytes(IID_IUNKNOWN);
const iidAgileObject = guidBytes(IID_IAGILE_OBJECT);
const iidCompletionHandler = guidBytes(IID_IACTIVATE_COMPLETION_HANDLER);

const factoryOut = Buffer.alloc(POINTER_SIZE);
const factoryHr = Mmdevapi.DllGetClassObject(clsidEnumerator.ptr, iidClassFactory.ptr, factoryOut.ptr);
const factoryAddress = factoryHr === 0 ? factoryOut.readBigUInt64LE(0) : 0n;
recordCheck(
  'DllGetClassObject · CLSID_MMDeviceEnumerator',
  factoryHr === 0 && factoryAddress !== 0n ? 'ok' : 'fail',
  factoryHr,
  factoryHr === 0 && factoryAddress !== 0n ? `IClassFactory @ ${formatAddress(factoryAddress)}` : 'no class factory',
);

let enumeratorAddress = 0n;
let renderEndpointId = '';

if (factoryAddress !== 0n) {
  const factoryVtable = linkSymbols({
    CreateInstance: {
      args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr],
      ptr: readVtableMethod(factoryAddress, CREATE_INSTANCE_OFFSET),
      returns: FFIType.i32,
    },
    Release: { args: [FFIType.u64], ptr: readVtableMethod(factoryAddress, RELEASE_METHOD_OFFSET), returns: FFIType.u32 },
  });

  const enumeratorOut = Buffer.alloc(POINTER_SIZE);
  const createHr = factoryVtable.symbols.CreateInstance(factoryAddress, 0n, iidEnumerator.ptr, enumeratorOut.ptr);
  if (createHr === 0) enumeratorAddress = enumeratorOut.readBigUInt64LE(0);
  recordCheck(
    'IClassFactory::CreateInstance · IMMDeviceEnumerator',
    createHr === 0 && enumeratorAddress !== 0n ? 'ok' : 'fail',
    createHr,
    createHr === 0 && enumeratorAddress !== 0n ? `IMMDeviceEnumerator @ ${formatAddress(enumeratorAddress)}` : 'creation failed',
  );

  if (enumeratorAddress !== 0n) {
    const enumeratorVtable = linkSymbols({
      GetDefaultAudioEndpoint: {
        args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr],
        ptr: readVtableMethod(enumeratorAddress, GET_DEFAULT_AUDIO_ENDPOINT_OFFSET),
        returns: FFIType.i32,
      },
      Release: { args: [FFIType.u64], ptr: readVtableMethod(enumeratorAddress, RELEASE_METHOD_OFFSET), returns: FFIType.u32 },
    });

    const deviceOut = Buffer.alloc(POINTER_SIZE);
    const defHr = enumeratorVtable.symbols.GetDefaultAudioEndpoint(enumeratorAddress, EDataFlow.eRender, ERole.eMultimedia, deviceOut.ptr);
    if (defHr === 0) {
      const deviceAddress = deviceOut.readBigUInt64LE(0);
      if (deviceAddress !== 0n) {
        const deviceVtable = linkSymbols({
          GetId: { args: [FFIType.u64, FFIType.ptr], ptr: readVtableMethod(deviceAddress, GET_ID_OFFSET), returns: FFIType.i32 },
          Release: { args: [FFIType.u64], ptr: readVtableMethod(deviceAddress, RELEASE_METHOD_OFFSET), returns: FFIType.u32 },
        });
        try {
          const idOut = Buffer.alloc(POINTER_SIZE);
          if (deviceVtable.symbols.GetId(deviceAddress, idOut.ptr) === 0) {
            const idAddress = idOut.readBigUInt64LE(0);
            renderEndpointId = readWideStringAt(idAddress);
            if (idAddress !== 0n) ole32.symbols.CoTaskMemFree(idAddress);
          }
        } finally {
          deviceVtable.symbols.Release(deviceAddress);
          deviceVtable.close();
        }
      }
    }
    recordCheck(
      'IMMDeviceEnumerator::GetDefaultAudioEndpoint · eRender/eMultimedia',
      defHr === 0 && renderEndpointId !== '' ? 'ok' : 'fail',
      defHr,
      renderEndpointId === '' ? 'no default render endpoint' : renderEndpointId,
    );

    enumeratorVtable.symbols.Release(enumeratorAddress);
    enumeratorVtable.close();
  }

  factoryVtable.symbols.Release(factoryAddress);
  factoryVtable.close();
}

if (renderEndpointId !== '') {
  let completionCount = 0;
  let queryHitCount = 0;
  let queryMatchCount = 0;

  const queryInterfaceCb = new JSCallback(
    (thisPtr: bigint, riidPtr: bigint, ppvObject: bigint): number => {
      queryHitCount += 1;
      const iidBuf = Buffer.alloc(16);
      kernel32.symbols.ReadProcessMemory(currentProcess, riidPtr, iidBuf.ptr, 16n, null);
      const matches =
        guidBytesEqual(iidBuf, iidUnknown) ||
        guidBytesEqual(iidBuf, iidCompletionHandler) ||
        guidBytesEqual(iidBuf, iidAgileObject);
      if (matches) {
        writePointerAt(ppvObject, thisPtr);
        queryMatchCount += 1;
        return 0;
      }
      writePointerAt(ppvObject, 0n);
      return E_NOINTERFACE;
    },
    { args: [FFIType.u64, FFIType.u64, FFIType.u64], returns: FFIType.i32 },
  );
  const addRefCb = new JSCallback(() => 1, { args: [FFIType.u64], returns: FFIType.u32 });
  const releaseCb = new JSCallback(() => 1, { args: [FFIType.u64], returns: FFIType.u32 });
  const activateCompletedCb = new JSCallback(
    () => {
      completionCount += 1;
      return 0;
    },
    { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32, threadsafe: true },
  );

  const vtable = Buffer.alloc(POINTER_SIZE * 4);
  vtable.writeBigUInt64LE(BigInt(queryInterfaceCb.ptr ?? 0), 0);
  vtable.writeBigUInt64LE(BigInt(addRefCb.ptr ?? 0), POINTER_SIZE);
  vtable.writeBigUInt64LE(BigInt(releaseCb.ptr ?? 0), POINTER_SIZE * 2);
  vtable.writeBigUInt64LE(BigInt(activateCompletedCb.ptr ?? 0), POINTER_SIZE * 3);

  const handlerObject = Buffer.alloc(POINTER_SIZE);
  handlerObject.writeBigUInt64LE(BigInt(ptr(vtable)), 0);

  const interfacePathStr = `\\\\?\\SWD#MMDEVAPI#${renderEndpointId}#${KSCATEGORY_RENDER}`;
  const deviceInterfacePath = Buffer.from(`${interfacePathStr}\0`, 'utf16le');
  const operationOut = Buffer.alloc(POINTER_SIZE);
  const activateHr = Mmdevapi.ActivateAudioInterfaceAsync(
    deviceInterfacePath.ptr,
    iidAudioClient.ptr,
    null,
    ptr(handlerObject),
    operationOut.ptr,
  );

  let activateResultHr: number | null = null;
  let activatedInterfaceAddress = 0n;

  if (activateHr === 0) {
    for (let i = 0; i < 150 && completionCount === 0; i += 1) {
      await sleep(20);
    }

    const operationAddress = operationOut.readBigUInt64LE(0);
    if (operationAddress !== 0n) {
      const opVtable = linkSymbols({
        GetActivateResult: {
          args: [FFIType.u64, FFIType.ptr, FFIType.ptr],
          ptr: readVtableMethod(operationAddress, GET_ACTIVATE_RESULT_OFFSET),
          returns: FFIType.i32,
        },
        Release: { args: [FFIType.u64], ptr: readVtableMethod(operationAddress, RELEASE_METHOD_OFFSET), returns: FFIType.u32 },
      });
      try {
        const resultHrBuf = Buffer.alloc(4);
        const interfaceOut = Buffer.alloc(POINTER_SIZE);
        const gaHr = opVtable.symbols.GetActivateResult(operationAddress, resultHrBuf.ptr, interfaceOut.ptr);
        if (gaHr === 0) {
          activateResultHr = resultHrBuf.readInt32LE(0);
          activatedInterfaceAddress = interfaceOut.readBigUInt64LE(0);
        }
      } finally {
        opVtable.symbols.Release(operationAddress);
        opVtable.close();
      }
    }
  }

  const activated = activateHr === 0 && activateResultHr === 0 && activatedInterfaceAddress !== 0n;
  recordCheck(
    'ActivateAudioInterfaceAsync · IAudioClient on default render',
    activated ? 'ok' : 'fail',
    activateHr !== 0 ? activateHr : activateResultHr,
    activated
      ? `IAudioClient @ ${formatAddress(activatedInterfaceAddress)} · completion=${completionCount} · QI=${queryMatchCount}/${queryHitCount}`
      : activateHr !== 0
        ? 'synchronous failure'
        : completionCount === 0
          ? 'async completion did not fire within 3s'
          : 'async result unavailable',
  );

  if (activatedInterfaceAddress !== 0n) {
    const audioClient = linkSymbols({
      Release: { args: [FFIType.u64], ptr: readVtableMethod(activatedInterfaceAddress, RELEASE_METHOD_OFFSET), returns: FFIType.u32 },
    });
    audioClient.symbols.Release(activatedInterfaceAddress);
    audioClient.close();
  }

  queryInterfaceCb.close();
  addRefCb.close();
  releaseCb.close();
  activateCompletedCb.close();
} else {
  recordCheck('ActivateAudioInterfaceAsync · IAudioClient on default render', 'skip', null, 'no default render endpoint to activate against');
}

recordCheck('DllRegisterServer', 'skip', null, 'bound but not invoked — writes COM registrations into HKLM and requires elevation');
recordCheck('DllUnregisterServer', 'skip', null, 'bound but not invoked — tears down COM registrations and requires elevation');

const unloadAfterRelease = Mmdevapi.DllCanUnloadNow();
recordCheck(
  'DllCanUnloadNow (after Release chain)',
  unloadAfterRelease === 0 || unloadAfterRelease === S_FALSE ? 'ok' : 'fail',
  unloadAfterRelease,
  unloadAfterRelease === S_FALSE ? 'server still retains refs' : 'server reports unloadable',
);

if (shouldUninitialize) ole32.symbols.CoUninitialize();
ole32.close();
kernel32.close();

const NAME_WIDTH = Math.max(...checks.map((c) => c.name.length));
const HR_WIDTH = 10;

console.log();
console.log(`${ANSI.bold}${ANSI.cyan}mmdevapi.dll${ANSI.reset}  ${ANSI.dim}factory probe${ANSI.reset}`);
console.log();
console.log(`  ${ANSI.dim}${'Check'.padEnd(NAME_WIDTH)}  ${'HRESULT'.padEnd(HR_WIDTH)}  Detail${ANSI.reset}`);
console.log(`  ${ANSI.dim}${'─'.repeat(NAME_WIDTH + 2 + HR_WIDTH + 2 + 80)}${ANSI.reset}`);

const statusBadge: Record<CheckStatus, string> = {
  fail: `${ANSI.red}✗${ANSI.reset}`,
  info: `${ANSI.cyan}ℹ${ANSI.reset}`,
  ok: `${ANSI.green}✓${ANSI.reset}`,
  skip: `${ANSI.dim}·${ANSI.reset}`,
};

for (const check of checks) {
  const badge = statusBadge[check.status];
  const hrText = check.hr === null ? `${ANSI.dim}${'(n/a)'.padEnd(HR_WIDTH)}${ANSI.reset}` : describeHResult(check.hr).padEnd(HR_WIDTH + 9);
  const detail = check.status === 'skip' || check.status === 'info' ? `${ANSI.dim}${check.detail}${ANSI.reset}` : check.detail;
  console.log(`  ${badge} ${ANSI.yellow}${check.name.padEnd(NAME_WIDTH)}${ANSI.reset}  ${hrText}  ${detail}`);
}

const okCount = checks.filter((c) => c.status === 'ok').length;
const failCount = checks.filter((c) => c.status === 'fail').length;
const infoCount = checks.filter((c) => c.status === 'info').length;
const skipCount = checks.filter((c) => c.status === 'skip').length;

console.log();
console.log(
  `  ${ANSI.bold}${okCount}${ANSI.reset} ${ANSI.green}ok${ANSI.reset}  ${ANSI.dim}•${ANSI.reset}  ${ANSI.bold}${failCount}${ANSI.reset} ${ANSI.red}fail${ANSI.reset}  ${ANSI.dim}•${ANSI.reset}  ${ANSI.bold}${infoCount}${ANSI.reset} ${ANSI.cyan}info${ANSI.reset}  ${ANSI.dim}•${ANSI.reset}  ${ANSI.bold}${skipCount}${ANSI.reset} ${ANSI.dim}skip${ANSI.reset}`,
);
console.log();

process.exit(failCount > 0 ? 1 : 0);
