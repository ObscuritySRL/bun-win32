import type { Pointer } from 'bun:ffi';

export type { HRESULT, LPCWSTR, NULL } from '@bun-win32/core';

export type IMFAttributes = Pointer;
export type IMFByteStream = Pointer;
export type IMFMediaSink = Pointer;
export type IMFMediaSource = Pointer;
export type IMFSinkWriter = Pointer;
export type IMFSourceReader = Pointer;
export type LPLPVOID = Pointer;
export type PIMFSinkWriter = Pointer;
export type PIMFSourceReader = Pointer;
export type REFCLSID = Pointer;
export type REFIID = Pointer;
