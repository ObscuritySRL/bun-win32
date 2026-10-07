// Local FFI shims for the few calls whose shipped binding types do not fit Iris: COM interface pointers are held as
// bigint (FFIType.u64), and raw native addresses (mapped GPU memory, DIB bits, WinRT buffers) are copied with a native
// memmove instead of being re-branded as `Pointer`s — which keeps every module in this package cast-free.

import { dlopen, FFIType } from 'bun:ffi';

export const { symbols: Native } = dlopen('d3d11.dll', {
  CreateDirect3D11DeviceFromDXGIDevice: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
});

export const { symbols: Composition } = dlopen('dcomp.dll', {
  DCompositionCreateDevice: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
});

export const { symbols: Memory } = dlopen('ntdll.dll', {
  RtlMoveMemory: { args: [FFIType.u64, FFIType.u64, FFIType.u64], returns: FFIType.void },
});

export const { symbols: Shell } = dlopen('shell32.dll', {
  SHCreateItemFromParsingName: { args: [FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
});

export const { symbols: Cursor } = dlopen('user32.dll', {
  LoadCursorW: { args: [FFIType.u64, FFIType.u64], returns: FFIType.u64 },
});

export const { symbols: Strings } = dlopen('oleaut32.dll', {
  SysFreeString: { args: [FFIType.u64], returns: FFIType.void },
  SysStringLen: { args: [FFIType.u64], returns: FFIType.u32 },
});

/** memmove between two native addresses (either may be a Buffer's `.ptr` widened with BigInt). */
export function copyMemory(destination: bigint, source: bigint, byteLength: number): void {
  Memory.RtlMoveMemory(destination, source, BigInt(byteLength));
}

/** Copy `byteLength` bytes from a native address into a fresh Buffer. */
export function readMemory(source: bigint, byteLength: number): Buffer {
  const target = Buffer.alloc(byteLength);
  Memory.RtlMoveMemory(BigInt(target.ptr), source, BigInt(byteLength));
  return target;
}
