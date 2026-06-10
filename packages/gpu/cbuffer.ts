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
}

function writeFieldValues(fields: Record<string, CBufferFieldType>, offsets: Record<string, number>, values: { readonly [key: string]: number | readonly number[] }, out: Buffer): Buffer {
  for (const [name, type] of Object.entries(fields)) {
    const offset = offsets[name]!;
    const value = values[name]!;
    const integer = type.startsWith('int') ? 'int' : type.startsWith('uint') ? 'uint' : 'float';
    if (typeof value === 'number') {
      if (integer === 'int') out.writeInt32LE(value, offset);
      else if (integer === 'uint') out.writeUInt32LE(value, offset);
      else out.writeFloatLE(value, offset);
    } else {
      value.forEach((component, index) => {
        if (integer === 'int') out.writeInt32LE(component, offset + index * 4);
        else if (integer === 'uint') out.writeUInt32LE(component, offset + index * 4);
        else out.writeFloatLE(component, offset + index * 4);
      });
    }
  }
  return out;
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
  let cursor = 0;
  for (const [name, type] of Object.entries(fields)) {
    const bytes = FIELD_BYTES[type];
    if (type === 'float4x4') cursor = Math.ceil(cursor / 16) * 16;
    else if (Math.floor(cursor / 16) !== Math.floor((cursor + bytes - 1) / 16)) cursor = Math.ceil(cursor / 16) * 16;
    offsets[name] = cursor;
    cursor += bytes;
  }
  const byteSize = Math.ceil(cursor / 16) * 16;
  return {
    byteSize,
    offsets,
    write(values) {
      return writeFieldValues(fields, offsets, values, Buffer.alloc(byteSize));
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
  let cursor = 0;
  for (const [name, type] of Object.entries(fields)) {
    offsets[name] = cursor;
    cursor += FIELD_BYTES[type];
  }
  const byteSize = cursor;
  return {
    byteSize,
    offsets,
    write(values) {
      return writeFieldValues(fields, offsets, values, Buffer.alloc(byteSize));
    },
  };
}
