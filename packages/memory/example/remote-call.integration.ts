/**
 * Remote-call integration tests against a separate x64 Windows process.
 *
 * APIs demonstrated:
 * - Process.call (registers, stack slots, return widths, and thread completion)
 * - Process.alloc / write / read / free (remote code and data lifetime)
 *
 * Run: bun test example/remote-call.integration.ts
 */
import { FFIType } from 'bun:ffi';
import { afterAll, beforeAll, describe, expect, expectTypeOf, test } from 'bun:test';

import { MemoryProtection } from '@bun-win32/kernel32';

import Process from '../index.ts';

const subprocess = Bun.spawn(['C:/Windows/System32/ping.exe', '-t', '127.0.0.1'], { stderr: 'ignore', stdin: 'ignore', stdout: 'ignore' });
let target: Process;
let codeAddress: bigint;
let dataAddress: bigint;

beforeAll(async () => {
  for (let attempt = 0; attempt < 0x28; attempt++) {
    try {
      target = new Process(subprocess.pid);

      break;
    } catch (error) {
      if (attempt === 0x27) {
        throw error;
      }

      await Bun.sleep(0x19);
    }
  }

  expect(target.is32Bit).toBe(false);
  codeAddress = target.alloc(0x1000, MemoryProtection.PAGE_EXECUTE_READWRITE);
  dataAddress = target.alloc(0x1000);
});

afterAll(async () => {
  try {
    if (dataAddress !== undefined) {
      target.free(dataAddress);
    }

    if (codeAddress !== undefined) {
      target.free(codeAddress);
    }
  } finally {
    target?.close();
    subprocess.kill();
    await subprocess.exited;
  }
});

describe('remote x64 calls', () => {
  test('mixed registers and stack arguments preserve values and stack alignment', () => {
    target.write(
      codeAddress,
      Buffer.from([
        0x48,
        0x89,
        0x11, // mov [rcx], rdx
        0xf3,
        0x0f,
        0x11,
        0x51,
        0x08, // movss [rcx + 8], xmm2
        0xf2,
        0x0f,
        0x11,
        0x59,
        0x10, // movsd [rcx + 16], xmm3
        0x48,
        0x8b,
        0x44,
        0x24,
        0x28,
        0x48,
        0x89,
        0x41,
        0x18,
        0x48,
        0x8b,
        0x44,
        0x24,
        0x30,
        0x48,
        0x89,
        0x41,
        0x20,
        0x48,
        0x8b,
        0x44,
        0x24,
        0x38,
        0x48,
        0x89,
        0x41,
        0x28,
        0x48,
        0x89,
        0xe0,
        0x83,
        0xe0,
        0x0f,
        0xc3, // return rsp & 15
      ]),
    );

    const alignment = target.call(
      codeAddress,
      { args: [FFIType.ptr, FFIType.u64, FFIType.f32, FFIType.f64, FFIType.i32, FFIType.f64, FFIType.u64], returns: FFIType.u32 },
      dataAddress,
      0xfedc_ba98_7654_3210n,
      -1.5,
      9.25,
      -42,
      -7.125,
      0xdead_beef_cafe_baben,
    );
    const data = target.buffer(dataAddress, 0x30);

    expect(alignment).toBe(0x08);
    expect(data.readBigUInt64LE(0x00)).toBe(0xfedc_ba98_7654_3210n);
    expect(data.readFloatLE(0x08)).toBe(-1.5);
    expect(data.readDoubleLE(0x10)).toBe(9.25);
    expect(data.readInt32LE(0x18)).toBe(-42);
    expect(data.readDoubleLE(0x20)).toBe(-7.125);
    expect(data.readBigUInt64LE(0x28)).toBe(0xdead_beef_cafe_baben);
  });

  test('the fifth argument fits an odd stack argument count', () => {
    target.write(codeAddress, Buffer.from([0x48, 0x8b, 0x44, 0x24, 0x28, 0xc3]));

    expect(target.call(codeAddress, { args: [FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u64], returns: FFIType.u64 }, 1, 2, 3, 4, 0xffff_ffff_ffff_ffffn)).toBe(0xffff_ffff_ffff_ffffn);
  });

  test('the sixth argument fits an even stack argument count', () => {
    target.write(codeAddress, Buffer.from([0x48, 0x8b, 0x44, 0x24, 0x30, 0xc3]));

    expect(target.call(codeAddress, { args: [FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.i64], returns: FFIType.i64 }, 1, 2, 3, 4, 5, -0x1234_5678_9abcn)).toBe(-0x1234_5678_9abcn);
  });

  test('all four floating-point register positions use their argument position', () => {
    const signature = { args: [FFIType.f64, FFIType.f64, FFIType.f64, FFIType.f64], returns: FFIType.f64 } as const;

    for (let index = 0; index < 0x04; index++) {
      target.write(codeAddress, Buffer.from([0x66, 0x0f, 0x28, 0xc0 + index, 0xc3]));

      expect(target.call(codeAddress, signature, 1.5, -2.25, 3.125, 4.5)).toBe([1.5, -2.25, 3.125, 4.5][index]!);
    }
  });

  test('all four integer register positions use their argument position', () => {
    const instructions = [
      [0x48, 0x89, 0xc8],
      [0x48, 0x89, 0xd0],
      [0x4c, 0x89, 0xc0],
      [0x4c, 0x89, 0xc8],
    ];
    const signature = { args: [FFIType.u64, FFIType.u64, FFIType.u64, FFIType.u64], returns: FFIType.u64 } as const;

    for (let index = 0; index < instructions.length; index++) {
      target.write(codeAddress, Buffer.from([...instructions[index]!, 0xc3]));

      expect(target.call(codeAddress, signature, 11n, 22n, 33n, 44n)).toBe([11n, 22n, 33n, 44n][index]!);
    }
  });

  test('the 64th argument reaches its stack slot and larger signatures are rejected', () => {
    target.write(codeAddress, Buffer.from([0x48, 0x8b, 0x84, 0x24, 0x00, 0x02, 0x00, 0x00, 0xc3]));
    const args = Array.from({ length: 0x40 }, () => FFIType.u64);
    const values = Array.from({ length: 0x40 }, (_, index) => BigInt(index));

    expect(target.call(codeAddress, { args, returns: FFIType.u64 }, ...values)).toBe(0x3fn);
    args.push(FFIType.u64);
    values.push(0x40n);
    expect(() => target.call(codeAddress, { args, returns: FFIType.u64 }, ...values)).toThrow('64 arguments');
  });

  test('f32 returns round to single precision and preserve non-finite values', () => {
    target.write(codeAddress, Buffer.from([0xc3]));

    expect(target.call(codeAddress, { args: ['float'], returns: 'f32' }, 1 / 3)).toBe(Math.fround(1 / 3));
    expect(target.call(codeAddress, { args: [FFIType.f32], returns: FFIType.f32 }, Infinity)).toBe(Infinity);
    expect(target.call(codeAddress, { args: [FFIType.f32], returns: FFIType.f32 }, NaN)).toBeNaN();
    expect(Object.is(target.call(codeAddress, { args: [FFIType.f32], returns: FFIType.f32 }, -0), -0)).toBe(true);
  });

  test('small signed returns decode only their declared width', () => {
    const code = Buffer.from([0x48, 0xb8, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xc3]);
    target.write(codeAddress, code);

    expect(target.call(codeAddress, { args: [], returns: FFIType.i8 })).toBe(-1);
    expect(target.call(codeAddress, { args: [], returns: FFIType.i16 })).toBe(-1);
    expect(target.call(codeAddress, { args: [], returns: FFIType.i32 })).toBe(-1);
    expect(target.call(codeAddress, { args: [], returns: FFIType.u8 })).toBe(0xff);
    expect(target.call(codeAddress, { args: [], returns: FFIType.u16 })).toBe(0xffff);
    expect(target.call(codeAddress, { args: [], returns: FFIType.u32 })).toBe(0xffff_ffff);
    expect(target.call(codeAddress, { args: [], returns: FFIType.i64_fast })).toBe(-1);
    expect(target.call(codeAddress, { args: [], returns: FFIType.u64_fast })).toBe(0xffff_ffff_ffff_ffffn);
  });

  test('bool uses AL even if the upper bits of RAX are non-zero', () => {
    target.write(codeAddress, Buffer.from([0x48, 0xb8, 0x00, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xc3]));

    expect(target.call(codeAddress, { args: [], returns: FFIType.bool })).toBe(false);
    expect(target.call(codeAddress, { args: [], returns: FFIType.void })).toBeUndefined();
  });

  test('integer, boolean, and null pointer arguments reach the target', () => {
    target.write(codeAddress, Buffer.from([0x48, 0x89, 0xc8, 0xc3]));

    expect(target.call(codeAddress, { args: [FFIType.bool], returns: FFIType.bool }, true)).toBe(true);
    expect(target.call(codeAddress, { args: [FFIType.ptr], returns: FFIType.ptr }, null)).toBe(0n);
    expect(target.call(codeAddress, { args: [FFIType.ptr], returns: FFIType.ptr }, dataAddress)).toBe(dataAddress);
    expect(target.call(codeAddress, { args: ['int32_t'], returns: 'int32_t' }, -123)).toBe(-123);
  });

  test('procedure resolves exports in the target, including a kernel32 forwarder', () => {
    const address = target.procedure('KERNEL32.DLL', 'GetCurrentProcessId');

    expect(target.call(address, { args: [], returns: FFIType.u32 })).toBe(subprocess.pid);
    expect(target.procedure('kernel32.dll', 'AcquireSRWLockExclusive')).toBe(target.procedure('ntdll.dll', 'RtlAcquireSRWLockExclusive'));
    expect(() => target.procedure('missing.dll', 'GetCurrentProcessId')).toThrow('Module not found');
    expect(() => target.procedure('kernel32.dll', 'MissingExport')).toThrow('Export not found');
    expect(() => target.procedure('kernel32.dll', -1)).toThrow('Export not found');
  });

  test('procedure resolves a named export and its ordinal to the same address', () => {
    const module = target.modules['ntdll.dll']!;
    const headerOffset = target.u32(module.modBaseAddr + 0x3cn);
    const exportOffset = target.u32(module.modBaseAddr + BigInt(headerOffset) + 0x88n);
    const directory = target.buffer(module.modBaseAddr + BigInt(exportOffset), 0x28);
    const ordinalBase = directory.readUInt32LE(0x10);
    const nameOffset = target.u32(module.modBaseAddr + BigInt(directory.readUInt32LE(0x20)));
    const ordinal = target.u16(module.modBaseAddr + BigInt(directory.readUInt32LE(0x24))) + ordinalBase;
    const name = target.string(module.modBaseAddr + BigInt(nameOffset), 0x100);

    expect(target.procedure('ntdll.dll', ordinal)).toBe(target.procedure('ntdll.dll', name));
  });

  test('procedure resolves API-set forwarders through the target loader', () => {
    expect(target.procedure('kernel32.dll', 'AddDllDirectory')).toBe(target.procedure('kernelbase.dll', 'AddDllDirectory'));
  });

  test('link creates typed named functions and snapshots the supplied signature', () => {
    target.write(codeAddress, Buffer.from([0x48, 0x89, 0xc8, 0xc3]));

    const functions = target.link({
      Echo: { args: [FFIType.ptr], ptr: codeAddress, returns: FFIType.ptr },
      GetCurrentProcessId: { args: [], ptr: target.procedure('kernel32.dll', 'GetCurrentProcessId'), returns: FFIType.u32 },
    });

    expectTypeOf(functions.Echo).returns.toEqualTypeOf<bigint>();
    expectTypeOf(functions.GetCurrentProcessId).returns.toEqualTypeOf<number>();
    expect(functions.Echo(dataAddress)).toBe(dataAddress);
    expect(functions.GetCurrentProcessId()).toBe(subprocess.pid);
    expect(Object.isFrozen(functions)).toBe(true);

    const args = [FFIType.u32];
    const signature = { args, ptr: codeAddress, returns: FFIType.u32 };
    const snapshot = target.link({ Echo: signature });
    args.push(FFIType.u32);
    signature.ptr = 0n;

    expect(snapshot.Echo(42)).toBe(42);
  });

  test('invalid signatures and integer values fail before starting a thread', () => {
    expect(() => target.call(0n, { args: [], returns: FFIType.void })).toThrow('non-zero');
    expect(() => target.call(codeAddress, { args: [FFIType.u32], returns: FFIType.u32 }, 1.5)).toThrow('safe integers');
    expect(() => target.call(codeAddress, { args: [FFIType.u64], returns: FFIType.u64 }, Number.MAX_SAFE_INTEGER + 1)).toThrow('safe integers');
    expect(() => target.call(codeAddress, { args: [FFIType.void], returns: FFIType.void }, undefined)).toThrow('argument type');
    expect(() => target.call(codeAddress, { args: [], returns: FFIType.buffer })).toThrow('return type');
  });

  test('a function that exits its thread cannot produce an uninitialized result', () => {
    expect(() => target.call(target.procedure('kernel32.dll', 'ExitThread'), { args: [FFIType.u32], returns: FFIType.void }, 0)).toThrow('without returning');
    expect(target.call(target.procedure('kernel32.dll', 'GetCurrentProcessId'), { args: [], returns: FFIType.u32 })).toBe(subprocess.pid);
  });

  test('repeated calls release their temporary remote allocations', () => {
    target.write(codeAddress, Buffer.from([0x48, 0x89, 0xc8, 0xc3]));
    const signature = { args: [FFIType.u32], returns: FFIType.u32 } as const;
    expect(target.call(codeAddress, signature, 1)).toBe(1);

    const committedBefore = target
      .query()
      .filter((region) => region.State === 0x1000 && region.Type === 0x20000)
      .reduce((size, region) => size + region.RegionSize, 0n);

    for (let index = 0; index < 0x20; index++) {
      expect(target.call(codeAddress, signature, index)).toBe(index);
    }

    const committedAfter = target
      .query()
      .filter((region) => region.State === 0x1000 && region.Type === 0x20000)
      .reduce((size, region) => size + region.RegionSize, 0n);

    expect(committedAfter).toBe(committedBefore);
  });
});
