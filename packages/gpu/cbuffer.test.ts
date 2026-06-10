import { describe, expect, test } from 'bun:test';

import { cbufferLayout, structLayout } from './cbuffer';

describe('cbufferLayout packing rules', () => {
  test('four scalars pack tightly into one register', () => {
    const layout = cbufferLayout({ a: 'float', b: 'float', c: 'float', d: 'float' });
    expect(layout.offsets).toEqual({ a: 0, b: 4, c: 8, d: 12 });
    expect(layout.byteSize).toBe(16);
  });
  test('a scalar fits the tail of a float3 register', () => {
    const layout = cbufferLayout({ direction: 'float3', intensity: 'float' });
    expect(layout.offsets).toEqual({ direction: 0, intensity: 12 });
    expect(layout.byteSize).toBe(16);
  });
  test('a float2 that would straddle starts a new register', () => {
    const layout = cbufferLayout({ position: 'float3', velocity: 'float2' });
    expect(layout.offsets).toEqual({ position: 0, velocity: 16 });
    expect(layout.byteSize).toBe(32);
  });
  test('a float4 after a scalar starts a new register', () => {
    const layout = cbufferLayout({ time: 'float', color: 'float4' });
    expect(layout.offsets).toEqual({ time: 0, color: 16 });
    expect(layout.byteSize).toBe(32);
  });
  test('two float2s share a register; the next scalar opens a new one', () => {
    const layout = cbufferLayout({ a: 'float2', b: 'float2', c: 'float' });
    expect(layout.offsets).toEqual({ a: 0, b: 8, c: 16 });
    expect(layout.byteSize).toBe(32);
  });
  test('float4x4 starts on a register boundary and spans four', () => {
    const layout = cbufferLayout({ time: 'float', transform: 'float4x4' });
    expect(layout.offsets).toEqual({ time: 0, transform: 16 });
    expect(layout.byteSize).toBe(80);
  });
  test('an int3 fits after a uint in the same register', () => {
    const layout = cbufferLayout({ count: 'uint', offsets: 'int3' });
    expect(layout.offsets).toEqual({ count: 0, offsets: 4 });
    expect(layout.byteSize).toBe(16);
  });
});

describe('cbufferLayout write()', () => {
  test('float round-trips via readFloatLE', () => {
    const layout = cbufferLayout({ scale: 'float' });
    const bytes = layout.write({ scale: 1.25 });
    expect(bytes.byteLength).toBe(16);
    expect(bytes.readFloatLE(0)).toBe(1.25);
  });
  test('int -1 stores as 0xFFFF_FFFF', () => {
    const layout = cbufferLayout({ delta: 'int' });
    const bytes = layout.write({ delta: -1 });
    expect(bytes.readUInt32LE(0)).toBe(0xffff_ffff);
  });
  test('uint stores unsigned', () => {
    const layout = cbufferLayout({ mask: 'uint' });
    const bytes = layout.write({ mask: 0xdead_beef });
    expect(bytes.readUInt32LE(0)).toBe(0xdead_beef);
  });
  test('vector components land at offset + 4*i', () => {
    const layout = cbufferLayout({ position: 'float3', intensity: 'float' });
    const bytes = layout.write({ position: [1, 2, 3], intensity: 4 });
    expect(bytes.readFloatLE(0)).toBe(1);
    expect(bytes.readFloatLE(4)).toBe(2);
    expect(bytes.readFloatLE(8)).toBe(3);
    expect(bytes.readFloatLE(12)).toBe(4);
  });
  test('int vector components write signed', () => {
    const layout = cbufferLayout({ values: 'int2' });
    const bytes = layout.write({ values: [-2, 7] });
    expect(bytes.readInt32LE(0)).toBe(-2);
    expect(bytes.readInt32LE(4)).toBe(7);
  });
});

describe('structLayout (StructuredBuffer tight packing — no 16-byte register rule)', () => {
  test('float3 then float2 packs tightly where cbuffer would split registers', () => {
    const layout = structLayout({ position: 'float3', velocity: 'float2' });
    expect(layout.offsets).toEqual({ position: 0, velocity: 12 });
    expect(layout.byteSize).toBe(20);
  });
  test('float then float4 stays sequential', () => {
    const layout = structLayout({ time: 'float', color: 'float4' });
    expect(layout.offsets).toEqual({ time: 0, color: 4 });
    expect(layout.byteSize).toBe(20);
  });
  test('mixed scalar/vector struct stride', () => {
    const layout = structLayout({ a: 'float', b: 'float3', c: 'uint' });
    expect(layout.offsets).toEqual({ a: 0, b: 4, c: 16 });
    expect(layout.byteSize).toBe(20);
  });
  test('float4x4 occupies 64 contiguous bytes', () => {
    const layout = structLayout({ scale: 'float', transform: 'float4x4' });
    expect(layout.offsets).toEqual({ scale: 0, transform: 4 });
    expect(layout.byteSize).toBe(68);
  });
  test('write() lands components at offset + 4*i with no padding', () => {
    const layout = structLayout({ a: 'float', b: 'float3', c: 'uint' });
    const bytes = layout.write({ a: 1.5, b: [2, 3, 4], c: 9 });
    expect(bytes.byteLength).toBe(20);
    expect(bytes.readFloatLE(0)).toBe(1.5);
    expect(bytes.readFloatLE(4)).toBe(2);
    expect(bytes.readFloatLE(8)).toBe(3);
    expect(bytes.readFloatLE(12)).toBe(4);
    expect(bytes.readUInt32LE(16)).toBe(9);
  });
});
