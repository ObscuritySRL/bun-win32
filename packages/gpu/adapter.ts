// DXGI adapter enumeration — the "what hardware am I on" census.

import { FFIType } from 'bun:ffi';

import Dxgi from '@bun-win32/dxgi';

import { comRelease, guidBytes, hex, vcall } from './com';
import { DXGIADAPTER1_GET_DESC1, DXGIFACTORY1_ENUM_ADAPTERS1, DXGI_ADAPTER_FLAG_SOFTWARE, DXGI_ERROR_NOT_FOUND, IID_IDXGIFACTORY1 } from './constants';

export interface AdapterInfo {
  dedicatedSystemMemory: bigint;
  dedicatedVideoMemory: bigint;
  description: string;
  deviceId: number;
  isSoftware: boolean;
  /** AdapterLuid HighPart (signed) — pairs with luidLowPart to identify the adapter device-wide. */
  luidHighPart: number;
  luidLowPart: number;
  sharedSystemMemory: bigint;
  vendorId: number;
}

/** Open IDXGIAdapter1 #index (EnumAdapters1 order — match against listAdapters()). Caller owns the returned COM pointer: comRelease it. */
export function openAdapter(index: number): bigint {
  const iid = guidBytes(IID_IDXGIFACTORY1);
  const ppFactory = Buffer.alloc(8);
  const hr = Dxgi.CreateDXGIFactory1(iid.ptr!, ppFactory.ptr!);
  if (hr !== 0) throw new Error(`CreateDXGIFactory1 failed ${hex(hr)}.`);
  const factory = ppFactory.readBigUInt64LE(0);
  const ppAdapter = Buffer.alloc(8);
  const enumHr = vcall(factory, DXGIFACTORY1_ENUM_ADAPTERS1, [FFIType.u32, FFIType.ptr], [index, ppAdapter.ptr!]);
  comRelease(factory);
  if (enumHr !== 0) throw new Error(`EnumAdapters1(${index}) failed ${hex(enumHr)} — run listAdapters() to see the valid indices.`);
  return ppAdapter.readBigUInt64LE(0);
}

/**
 * Enumerate DXGI adapters in DXGI order (hardware first, WARP — "Microsoft Basic
 * Render Driver" — last). https://learn.microsoft.com/en-us/windows/win32/api/dxgi/nf-dxgi-idxgifactory1-enumadapters1
 */
export function listAdapters(): AdapterInfo[] {
  const iid = guidBytes(IID_IDXGIFACTORY1);
  const ppFactory = Buffer.alloc(8);
  const hr = Dxgi.CreateDXGIFactory1(iid.ptr!, ppFactory.ptr!);
  if (hr !== 0) throw new Error(`CreateDXGIFactory1 failed ${hex(hr)}.`);
  const factory = ppFactory.readBigUInt64LE(0);

  const adapters: AdapterInfo[] = [];
  try {
    for (let index = 0; index < 16; index += 1) {
      const ppAdapter = Buffer.alloc(8);
      const enumHr = vcall(factory, DXGIFACTORY1_ENUM_ADAPTERS1, [FFIType.u32, FFIType.ptr], [index, ppAdapter.ptr!]);
      if (enumHr >>> 0 === DXGI_ERROR_NOT_FOUND || enumHr !== 0) break;
      const adapter = ppAdapter.readBigUInt64LE(0);

      // DXGI_ADAPTER_DESC1 (312 bytes): Description WCHAR[128]@0, VendorId@256,
      // DeviceId@260, SubSysId@264, Revision@268, DedicatedVideoMemory@272,
      // DedicatedSystemMemory@280, SharedSystemMemory@288, AdapterLuid{Low@296, High@300}, Flags@304.
      const desc = Buffer.alloc(312);
      if (vcall(adapter, DXGIADAPTER1_GET_DESC1, [FFIType.ptr], [desc.ptr!]) === 0) {
        let end = 0;
        while (end < 256 && desc.readUInt16LE(end) !== 0) end += 2;
        adapters.push({
          dedicatedSystemMemory: desc.readBigUInt64LE(280),
          dedicatedVideoMemory: desc.readBigUInt64LE(272),
          description: desc.subarray(0, end).toString('utf16le'),
          deviceId: desc.readUInt32LE(260),
          isSoftware: (desc.readUInt32LE(304) & DXGI_ADAPTER_FLAG_SOFTWARE) !== 0,
          luidHighPart: desc.readInt32LE(300),
          luidLowPart: desc.readUInt32LE(296),
          sharedSystemMemory: desc.readBigUInt64LE(288),
          vendorId: desc.readUInt32LE(256),
        });
      }
      comRelease(adapter);
    }
  } finally {
    comRelease(factory);
  }
  return adapters;
}
