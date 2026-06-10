// Runtime HLSL toolchain: FXC compile with trap guardrails, TS-side #include preprocessing, DXBC disassembly, and shader-object creation.

import { CFunction, FFIType, read, toArrayBuffer, type Pointer } from 'bun:ffi';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

import D3dcompiler_47 from '@bun-win32/d3dcompiler_47';
import { D3DCOMPILE_ENABLE_STRICTNESS, D3DCOMPILE_OPTIMIZATION_LEVEL3, D3D_DISASM_ENABLE_INSTRUCTION_NUMBERING } from '@bun-win32/d3dcompiler_47';

import { blobRelease, hex, vcall } from './com';
import { BLOB_GET_BUFFER_POINTER, BLOB_GET_BUFFER_SIZE, DEV_CREATE_COMPUTE_SHADER, DEV_CREATE_PIXEL_SHADER, DEV_CREATE_VERTEX_SHADER } from './constants';
import { describeDeviceError, requireGpu } from './device';

/** A compiled DXBC blob: a pointer/size view into the blob plus the blob handle. */
export interface CompiledShader {
  ptr: bigint;
  size: number;
  blob: bigint;
  /** Cache hits carry the DXBC bytes here — consumers re-read `bytes.ptr` at call time (a Buffer's backing store can relocate; `ptr` is a creation-time snapshot). */
  bytes?: Buffer;
}

export interface CompileOptions {
  /** Permit the HLSL noise() intrinsic alongside [unroll] (FXC can hang for minutes — repo ground truth). */
  allowNoise?: boolean;
  /** Compile-time constants, injected as `#define NAME value` lines ahead of the source (followed by `#line 1` so FXC errors keep the caller's line numbers). */
  defines?: Record<string, string | number>;
  /** Override compile flags (default D3DCOMPILE_ENABLE_STRICTNESS | D3DCOMPILE_OPTIMIZATION_LEVEL3). */
  flags?: number;
  /** Named include sources, resolved TS-side. `#include "name"` is replaced textually. */
  includes?: Record<string, string>;
}

export interface CachedShader extends CompiledShader {
  fromCache: boolean;
}

// Cache hits hold the DXBC in a JS Buffer whose backing store CAN relocate —
// read the pointer at the FFI call, never trust the creation-time snapshot.
function shaderPointer(code: CompiledShader): bigint {
  return code.bytes !== undefined ? BigInt(code.bytes.ptr!) : code.ptr;
}

const INCLUDE_PATTERN = /^[ \t]*#include[ \t]+"([^"]+)"[ \t]*$/gm;

const encodeAscii = (str: string): Buffer => Buffer.from(`${str}\0`, 'utf8');

function blobAsString(blob: bigint): string {
  const dataAddr = blobBufferPointer(blob);
  const size = Number(blobBufferSize(blob));
  const bytes: number[] = [];
  for (let i = 0; i < size; i += 1) {
    const b = read.u8(Number(dataAddr) as Pointer, i);
    if (b === 0) break;
    bytes.push(b);
  }
  return new TextDecoder('utf-8').decode(new Uint8Array(bytes));
}

// Memoized per resolved method pointer — CFunction creation builds a native
// trampoline (~246 µs, never freed); vcall is unusable here (it coerces the
// u64 return to number). Both blob methods share the ([u64]) → u64 signature.
const blobInvokers = new Map<number, ReturnType<typeof CFunction>>();

function blobMethod(blob: bigint, slot: number): ReturnType<typeof CFunction> {
  const vtable = read.ptr(Number(blob) as Pointer, 0);
  const method = read.ptr(vtable as Pointer, slot * 8);
  let invoke = blobInvokers.get(method);
  if (invoke === undefined) {
    invoke = CFunction({ ptr: method as Pointer, args: [FFIType.u64], returns: FFIType.u64 });
    blobInvokers.set(method, invoke);
  }
  return invoke;
}

function blobBufferPointer(blob: bigint): bigint {
  return blobMethod(blob, BLOB_GET_BUFFER_POINTER)(blob) as bigint;
}

function blobBufferSize(blob: bigint): bigint {
  return blobMethod(blob, BLOB_GET_BUFFER_SIZE)(blob) as bigint;
}

const NOISE_INTRINSIC_PATTERN = /\bnoise\s*\(/;

function guardSource(source: string, options: CompileOptions): void {
  if (source.includes('`')) {
    throw new Error('HLSL source contains a backtick. If this shader lives in a JS template literal, the literal terminated early and FXC is seeing truncated source (repo ground truth: this is the #1 demo-author trap).');
  }
  // Strip comments (prose like "fit noise (scene…)" must not trip the guard), then
  // match with a word boundary so user helpers like vnoise()/snoise() pass too.
  const stripped = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  if (options.allowNoise !== true && NOISE_INTRINSIC_PATTERN.test(stripped) && stripped.includes('[unroll')) {
    throw new Error('HLSL source combines noise() with [unroll] — FXC can hang for minutes compiling this (repo ground truth). Replace noise() with a hash function, or pass { allowNoise: true } to proceed anyway.');
  }
}

/**
 * Compile HLSL `source` (`entry`, e.g. "main"; `target`, e.g. "ps_5_0"). Resolves
 * #include via options.includes, injects options.defines, and guards against the
 * known FXC traps. Throws with the full compiler error text on failure.
 */
export function compile(source: string, entry: string, target: string, options: CompileOptions = {}): CompiledShader {
  let hlsl = source;
  if (options.defines !== undefined) {
    const defineLines = Object.entries(options.defines).map(([name, value]) => `#define ${name} ${value}`);
    if (defineLines.length > 0) hlsl = `${defineLines.join('\n')}\n#line 1\n${hlsl}`;
  }
  hlsl = preprocessHLSL(hlsl, options.includes ?? {});
  guardSource(hlsl, options);
  const src = encodeAscii(hlsl);
  const entryBuf = encodeAscii(entry);
  const targetBuf = encodeAscii(target);
  const ppCode = Buffer.alloc(8);
  const ppErr = Buffer.alloc(8);
  const hr = D3dcompiler_47.D3DCompile(src.ptr!, BigInt(src.byteLength - 1), null, null, null, entryBuf.ptr!, targetBuf.ptr!, options.flags ?? D3DCOMPILE_ENABLE_STRICTNESS | D3DCOMPILE_OPTIMIZATION_LEVEL3, 0, ppCode.ptr!, ppErr.ptr!);
  if (hr !== 0) {
    const errPtr = ppErr.readBigUInt64LE(0);
    const msg = errPtr !== 0n ? blobAsString(errPtr) : '(no error blob)';
    blobRelease(errPtr);
    throw new Error(`D3DCompile(${target}) failed ${hex(hr)}:\n${msg}`);
  }
  const blob = ppCode.readBigUInt64LE(0);
  return { blob, ptr: blobBufferPointer(blob), size: Number(blobBufferSize(blob)) };
}

/**
 * compile() with a DXBC disk cache keyed by Bun.hash over every codegen input.
 * Warm hits skip FXC entirely (blob is 0n; the returned object owns the bytes).
 * Corrupt cache entries (bad DXBC magic) silently recompile and repair the file.
 */
export function compileCached(source: string, entry: string, target: string, options: CompileOptions = {}, cacheDirectory = '.gpu-cache'): CachedShader {
  const flags = options.flags ?? D3DCOMPILE_ENABLE_STRICTNESS | D3DCOMPILE_OPTIMIZATION_LEVEL3;
  const definesKey = options.defines === undefined ? '' : JSON.stringify(options.defines);
  const includesKey = options.includes === undefined ? '' : JSON.stringify(options.includes);
  const key = Bun.hash(`${source}|${entry}|${target}|${flags}|${definesKey}|${includesKey}`).toString(16);
  const cachePath = `${cacheDirectory}/${key}.dxbc`;
  try {
    const bytes = readFileSync(cachePath);
    if (bytes.byteLength > 4 && bytes.toString('latin1', 0, 4) === 'DXBC') {
      return { blob: 0n, bytes, fromCache: true, ptr: BigInt(bytes.ptr!), size: bytes.byteLength };
    }
  } catch {}
  const code = compile(source, entry, target, options);
  const bytes = Buffer.from(toArrayBuffer(Number(code.ptr) as Pointer, 0, code.size).slice(0));
  try {
    mkdirSync(cacheDirectory, { recursive: true });
    writeFileSync(cachePath, bytes);
  } catch {}
  return { blob: code.blob, fromCache: false, ptr: code.ptr, size: code.size };
}

/** Disassemble compiled DXBC to numbered shader assembly text (D3DDisassemble). */
export function disassemble(code: CompiledShader): string {
  const ppDisassembly = Buffer.alloc(8);
  const hr = D3dcompiler_47.D3DDisassemble(Number(shaderPointer(code)) as Pointer, BigInt(code.size), D3D_DISASM_ENABLE_INSTRUCTION_NUMBERING, null, ppDisassembly.ptr!);
  if (hr !== 0) throw new Error(`D3DDisassemble failed ${hex(hr)}.`);
  const blob = ppDisassembly.readBigUInt64LE(0);
  const text = blobAsString(blob);
  blobRelease(blob);
  return text;
}

/** Create an ID3D11ComputeShader from compiled DXBC. Returns the shader handle. */
export function makeComputeShader(code: CompiledShader): bigint {
  const { device } = requireGpu();
  const pp = Buffer.alloc(8);
  const hr = vcall(device, DEV_CREATE_COMPUTE_SHADER, [FFIType.u64, FFIType.u64, FFIType.u64, FFIType.ptr], [shaderPointer(code), BigInt(code.size), 0n, pp.ptr!]);
  if (hr !== 0) throw new Error(`CreateComputeShader failed: ${describeDeviceError(hr)}`);
  return pp.readBigUInt64LE(0);
}

/** Create an ID3D11PixelShader from compiled DXBC. Returns the shader handle. */
export function makePixelShader(code: CompiledShader): bigint {
  const { device } = requireGpu();
  const pp = Buffer.alloc(8);
  const hr = vcall(device, DEV_CREATE_PIXEL_SHADER, [FFIType.u64, FFIType.u64, FFIType.u64, FFIType.ptr], [shaderPointer(code), BigInt(code.size), 0n, pp.ptr!]);
  if (hr !== 0) throw new Error(`CreatePixelShader failed: ${describeDeviceError(hr)}`);
  return pp.readBigUInt64LE(0);
}

/** Create an ID3D11VertexShader from compiled DXBC. Returns the shader handle. */
export function makeVertexShader(code: CompiledShader): bigint {
  const { device } = requireGpu();
  const pp = Buffer.alloc(8);
  const hr = vcall(device, DEV_CREATE_VERTEX_SHADER, [FFIType.u64, FFIType.u64, FFIType.u64, FFIType.ptr], [shaderPointer(code), BigInt(code.size), 0n, pp.ptr!]);
  if (hr !== 0) throw new Error(`CreateVertexShader failed: ${describeDeviceError(hr)}`);
  return pp.readBigUInt64LE(0);
}

/** Resolve #include directives textually (no ID3DInclude callback — foreign-thread COM hazard, repo rule). */
export function preprocessHLSL(source: string, includes: Record<string, string> = {}, depth = 0): string {
  if (depth > 8) throw new Error('preprocessHLSL: #include nesting exceeds 8 levels (cycle?).');
  return source.replace(INCLUDE_PATTERN, (line, name: string) => {
    const body = includes[name];
    if (body === undefined) throw new Error(`preprocessHLSL: unresolved #include "${name}". Pass it via CompileOptions.includes — file-system includes are not resolved.`);
    return preprocessHLSL(body, includes, depth + 1);
  });
}
