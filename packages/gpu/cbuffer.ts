// HLSL layout calculators — cbufferLayout (16-byte register rules) and structLayout
// (StructuredBuffer tight packing) — so TS write offsets always byte-match the
// shader (the bug class that burned demos; a wrong stride fails silently).

export type CBufferFieldType = 'float' | 'float2' | 'float3' | 'float4' | 'float4x4' | 'int' | 'int2' | 'int3' | 'int4' | 'uint' | 'uint2' | 'uint3' | 'uint4';

type CBufferValue<F extends CBufferFieldType> = F extends 'float' | 'int' | 'uint' ? number : readonly number[];

const FIELD_BYTES: Record<CBufferFieldType, number> = { float: 4, float2: 8, float3: 12, float4: 16, float4x4: 64, int: 4, int2: 8, int3: 12, int4: 16, uint: 4, uint2: 8, uint3: 12, uint4: 16 };

export interface CBufferLayout<T extends Record<string, CBufferFieldType>> {
  byteSize: number;
  offsets: { readonly [K in keyof T]: number };
  write(values: { readonly [K in keyof T]: CBufferValue<T[K]> }): Buffer;
  /** Like write(), but into a caller-owned Buffer (returned) — the zero-alloc per-dispatch path (~8× faster; uniform consumers copy synchronously, so reuse is safe). Callers that retain results must use write(). */
  writeInto(values: { readonly [K in keyof T]: CBufferValue<T[K]> }, target: Buffer): Buffer;
}

// Precompiled per-layout write plan — names/offsets/kinds resolved once at layout
// build, so write() is an index loop (no Object.entries/startsWith/forEach per call).
interface WritePlan {
  kinds: Uint8Array; // 0 = int, 1 = uint, 2 = float
  names: string[];
  offsets: number[];
}

function writePlanned(plan: WritePlan, values: { readonly [key: string]: number | readonly number[] }, out: Buffer): Buffer {
  const { kinds, names, offsets } = plan;
  for (let index = 0; index < names.length; index += 1) {
    const value = values[names[index]!]!;
    const offset = offsets[index]!;
    const kind = kinds[index];
    if (typeof value === 'number') {
      if (kind === 0) out.writeInt32LE(value, offset);
      else if (kind === 1) out.writeUInt32LE(value, offset);
      else out.writeFloatLE(value, offset);
    } else {
      for (let component = 0; component < value.length; component += 1) {
        if (kind === 0) out.writeInt32LE(value[component]!, offset + component * 4);
        else if (kind === 1) out.writeUInt32LE(value[component]!, offset + component * 4);
        else out.writeFloatLE(value[component]!, offset + component * 4);
      }
    }
  }
  return out;
}

function planKind(type: CBufferFieldType): number {
  return type.startsWith('int') ? 0 : type.startsWith('uint') ? 1 : 2;
}

/**
 * Compute HLSL cbuffer packing for `fields` (declaration order): fields align to
 * 4 bytes but never straddle a 16-byte register; float4x4 starts on a register
 * boundary and spans 4; total size rounds up to 16.
 * Matrices: HLSL defaults to column-major — pass transposed data or declare row_major in the shader.
 * https://learn.microsoft.com/en-us/windows/win32/direct3dhlsl/dx-graphics-hlsl-packing-rules
 */
export function cbufferLayout<T extends Record<string, CBufferFieldType>>(fields: T): CBufferLayout<T>;
export function cbufferLayout(fields: Record<string, CBufferFieldType>): CBufferLayout<Record<string, CBufferFieldType>> {
  const offsets: Record<string, number> = {};
  const plan: WritePlan = { kinds: new Uint8Array(Object.keys(fields).length), names: [], offsets: [] };
  let cursor = 0;
  for (const [name, type] of Object.entries(fields)) {
    const bytes = FIELD_BYTES[type];
    if (type === 'float4x4') cursor = Math.ceil(cursor / 16) * 16;
    else if (Math.floor(cursor / 16) !== Math.floor((cursor + bytes - 1) / 16)) cursor = Math.ceil(cursor / 16) * 16;
    offsets[name] = cursor;
    plan.kinds[plan.names.length] = planKind(type);
    plan.names.push(name);
    plan.offsets.push(cursor);
    cursor += bytes;
  }
  const byteSize = Math.ceil(cursor / 16) * 16;
  return {
    byteSize,
    offsets,
    write(values) {
      return writePlanned(plan, values, Buffer.alloc(byteSize));
    },
    writeInto(values, target) {
      return writePlanned(plan, values, target);
    },
  };
}

/**
 * Compute StructuredBuffer element packing for `fields` (declaration order):
 * members pack tightly on 4-byte alignment with NO 16-byte register rule —
 * float3 followed by float2 is offsets 0, 12 and a 20-byte stride. byteSize is
 * the stride for makeStructuredBuffer. GPU-validated against FXC in the selftest.
 */
export function structLayout<T extends Record<string, CBufferFieldType>>(fields: T): CBufferLayout<T>;
export function structLayout(fields: Record<string, CBufferFieldType>): CBufferLayout<Record<string, CBufferFieldType>> {
  const offsets: Record<string, number> = {};
  const plan: WritePlan = { kinds: new Uint8Array(Object.keys(fields).length), names: [], offsets: [] };
  let cursor = 0;
  for (const [name, type] of Object.entries(fields)) {
    offsets[name] = cursor;
    plan.kinds[plan.names.length] = planKind(type);
    plan.names.push(name);
    plan.offsets.push(cursor);
    cursor += FIELD_BYTES[type];
  }
  const byteSize = cursor;
  return {
    byteSize,
    offsets,
    write(values) {
      return writePlanned(plan, values, Buffer.alloc(byteSize));
    },
    writeInto(values, target) {
      return writePlanned(plan, values, target);
    },
  };
}
