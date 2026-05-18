import type { Pointer } from 'bun:ffi';

export type { DWORD, HANDLE, HRESULT, LPCVOID, LPCWSTR, LPDWORD, LPHANDLE, LPSECURITY_ATTRIBUTES, LPVOID, LPWSTR, NULL, PHANDLE, WORD } from '@bun-win32/core';

export const FLT_PORT_FLAG_SYNC_HANDLE = 0x0000_0001;

export enum FILTER_INFORMATION_CLASS {
  FilterAggregateBasicInformation = 1,
  FilterAggregateStandardInformation = 2,
  FilterFullInformation = 0,
}

export enum FILTER_VOLUME_INFORMATION_CLASS {
  FilterVolumeBasicInformation = 0,
  FilterVolumeStandardInformation = 1,
}

export enum INSTANCE_INFORMATION_CLASS {
  InstanceAggregateStandardInformation = 3,
  InstanceBasicInformation = 0,
  InstanceFullInformation = 2,
  InstancePartialInformation = 1,
}

export type HFILTER = bigint;
export type HFILTER_INSTANCE = bigint;
export type LPOVERLAPPED = Pointer;
export type PFILTER_MESSAGE_HEADER = Pointer;
export type PFILTER_REPLY_HEADER = Pointer;
export type PHFILTER = Pointer;
export type PHFILTER_INSTANCE = Pointer;
