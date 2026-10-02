import '../runtime/extensions';

import { CString, FFIType, ptr, read } from 'bun:ffi';

import Kernel32, { MemoryAllocationType, MemoryProtection, ProcessAccessRights, ToolhelpSnapshotFlags } from '@bun-win32/kernel32';

import type { BufferLike, CallArguments, CallFunctions, CallPointer, CallReturn, CallSignature, CallSymbol, Point, QAngle, Quaternion, RGB, RGBA, UPtr, UPtrArray, Vector2, Vector3, Vector4 } from '../types/Process';
import MemoryBasicInformation from './MemoryBasicInformation';
import Module from './Module';
import Scratch from './Scratch';
import Win32Error from './Win32Error';

// Preload FFI symbols to avoid lazy-loading overhead during hot paths
Kernel32.Preload([
  'CloseHandle',
  'CreateRemoteThread',
  'CreateToolhelp32Snapshot',
  'FlushInstructionCache',
  'GetLastError',
  'IsWow64Process2',
  'Module32FirstW',
  'Module32NextW',
  'OpenProcess',
  'Process32FirstW',
  'Process32NextW',
  'ReadProcessMemory',
  'VirtualAllocEx',
  'VirtualFreeEx',
  'VirtualProtectEx',
  'VirtualQueryEx',
  'WaitForSingleObject',
  'WriteProcessMemory',
]);

const {
  CloseHandle,
  CreateRemoteThread,
  CreateToolhelp32Snapshot,
  FlushInstructionCache,
  GetLastError,
  IsWow64Process2,
  Module32FirstW,
  Module32NextW,
  OpenProcess,
  Process32FirstW,
  Process32NextW,
  ReadProcessMemory,
  VirtualAllocEx,
  VirtualFreeEx,
  VirtualProtectEx,
  VirtualQueryEx,
  WaitForSingleObject,
  WriteProcessMemory,
} = Kernel32;

const FFITypeByName: Readonly<Record<string, FFIType>> = {
  bool: FFIType.bool,
  buffer: FFIType.buffer,
  c_int: FFIType.i32,
  c_uint: FFIType.u32,
  callback: FFIType.function,
  char: FFIType.char,
  'char*': FFIType.ptr,
  cstring: FFIType.cstring,
  double: FFIType.f64,
  f32: FFIType.f32,
  f64: FFIType.f64,
  float: FFIType.f32,
  fn: FFIType.function,
  function: FFIType.function,
  i16: FFIType.i16,
  i32: FFIType.i32,
  i64: FFIType.i64,
  i64_fast: FFIType.i64_fast,
  i8: FFIType.i8,
  int: FFIType.i32,
  int16_t: FFIType.i16,
  int32_t: FFIType.i32,
  int64_t: FFIType.i64,
  int8_t: FFIType.i8,
  isize: FFIType.i64,
  napi_env: FFIType.napi_env,
  napi_value: FFIType.napi_value,
  pointer: FFIType.ptr,
  ptr: FFIType.ptr,
  u16: FFIType.u16,
  u32: FFIType.u32,
  u64: FFIType.u64,
  u64_fast: FFIType.u64_fast,
  u8: FFIType.u8,
  uint16_t: FFIType.u16,
  uint32_t: FFIType.u32,
  uint64_t: FFIType.u64,
  uint8_t: FFIType.u8,
  usize: FFIType.u64,
  void: FFIType.void,
  'void*': FFIType.ptr,
};

const INFINITE = 0xffff_ffff;
const INVALID_HANDLE_VALUE = 0xffff_ffff_ffff_ffffn;
const WAIT_FAILED = 0xffff_ffff;
const WAIT_OBJECT_0 = 0x0000_0000;

/**
 * Provides cross-process memory manipulation for native applications.
 *
 * Use this class to read and write memory, access modules, and work with common data structures in external processes.
 *
 * Number-returning scalar reads decode through a `TypedArray` scratch view, which beats a second
 * `bun:ffi.read.*` FFI hop. The 64-bit BigInt reads (`u64`/`i64`, and `follow`/`vFunction`) instead use
 * `bun:ffi.read.u64`/`read.i64`, which is faster than the BigInt-lane view's boxing.
 *
 * The target architecture is detected once at attach via IsWow64Process2 and exposed as `is32Bit`.
 * The pointer primitives (`uPtr`, `uPtrArray`, `follow`, `vTable`, `vFunction`) and the engine
 * containers (`tArray*`, `utlVectorRaw`/`utlVectorU32`/`utlVectorU64`) are width-corrected for 32-bit
 * (WOW64) targets — x86 `TArray` reads its header at `{Data@0x00 (4B); ArrayNum@0x04}` and x86
 * `CUtlVector` at `{Size@0x00; Elements@0x04 (4B)}`, with the x64 path byte-identical.
 * @todo `utlLinkedListU64` and `call()` remain 64-bit only — the x86 CUtlLinkedList header is not
 *   derivable without a real 32-bit Source target, and `call()` needs an x86 shellcode emitter.
 *
 * @example
 * ```ts
 * import Process from 'bun-memory';
 * const cs2 = new Process('cs2.exe');
 * const myFloat = cs2.f32(0x12345678n);
 * cs2.close();
 * ```
 */
class Process {
  /**
   * Opens a process by PID or executable name.
   * @param identifier Process ID or executable name.
   * @throws If the process cannot be found or opened.
   * @example
   * ```ts
   * const cs2 = new Process('cs2.exe');
   * ```
   */
  constructor(identifier: number | string) {
    const dwFlags = ToolhelpSnapshotFlags.TH32CS_SNAPPROCESS;

    const hSnapshot = CreateToolhelp32Snapshot(dwFlags, 0);

    if (hSnapshot === INVALID_HANDLE_VALUE) {
      throw new Win32Error('CreateToolhelp32Snapshot', GetLastError());
    }

    using snapshot = { handle: hSnapshot, [Symbol.dispose]: () => CloseHandle(hSnapshot) };

    const lppeBuffer = Buffer.allocUnsafe(0x238 /* sizeof(PROCESSENTRY32W) */);
    /* */ lppeBuffer.writeUInt32LE(0x238 /* sizeof(PROCESSENTRY32W) */);

    const lppe = lppeBuffer.ptr;

    const bProcess32FirstW = Process32FirstW(snapshot.handle, lppe);

    if (!bProcess32FirstW) {
      throw new Win32Error('Process32FirstW', GetLastError());
    }

    do {
      const szExeFile = lppeBuffer.toString('utf16le', 0x2c, 0x234).replace(Process.#Patterns.ReplaceTrailingNull, '');
      const th32ProcessID = lppeBuffer.readUInt32LE(0x08);

      if (
        (typeof identifier === 'number' && identifier !== th32ProcessID) || //
        (typeof identifier === 'string' && identifier !== szExeFile)
      ) {
        continue;
      }

      const desiredAccess = ProcessAccessRights.PROCESS_ALL_ACCESS;
      const inheritHandle = 0;

      const hProcess = OpenProcess(desiredAccess, inheritHandle, th32ProcessID);

      if (hProcess === 0n) {
        throw new Win32Error('OpenProcess', GetLastError());
      }

      this.#modules = {};

      this.cntThreads = lppeBuffer.readUInt32LE(0x1c);
      this.hProcess = hProcess;
      this.pcPriClassBase = lppeBuffer.readInt32LE(0x24);
      this.szExeFile = szExeFile;
      this.th32ParentProcessID = lppeBuffer.readUInt32LE(0x20);
      this.th32ProcessID = th32ProcessID;

      const machineBuffer = Buffer.allocUnsafe(0x04);
      const bIsWow64Process2 = IsWow64Process2(hProcess, ptr(machineBuffer), ptr(machineBuffer, 0x02));

      if (!bIsWow64Process2) {
        const lastError = GetLastError();

        CloseHandle(hProcess);

        throw new Win32Error('IsWow64Process2', lastError);
      }

      // pProcessMachine is IMAGE_FILE_MACHINE_UNKNOWN (0) for a native process; a non-zero
      // WOW64 machine (e.g. IMAGE_FILE_MACHINE_I386) means a 32-bit target with 32-bit pointers.
      this.is32Bit = machineBuffer.readUInt16LE(0x00) !== 0x0000;

      try {
        this.refresh();
      } catch (error) {
        CloseHandle(hProcess);

        throw error;
      }

      return;
    } while (Process32NextW(snapshot.handle, lppe));

    throw new Error(`Process not found: ${identifier}.`);
  }

  /**
   * Creates a Process instance from a process identifier.
   * @param identifier Process ID or executable name.
   * @returns A new Process instance.
   * @throws If the process cannot be found or opened.
   * @example
   * ```ts
   * const cs2 = Process.from('cs2.exe');
   * const byPid = Process.from(1234);
   * ```
   */
  public static from(identifier: number | string): Process {
    return new Process(identifier);
  }

  /**
   * Regex patterns for matching hex strings and wildcards in memory scans.
   */
  static readonly #Patterns = {
    PatternMatchAll: /(?:[0-9A-Fa-f]{2})+/g,
    PatternTest: /^(?=.*[0-9A-Fa-f]{2})(?:\*{2}|\?{2}|[0-9A-Fa-f]{2})+$/,
    ReplaceTrailingNull: /\0+$/,
  };

  /**
   * Whether close() has already released the process handle.
   */
  #closed = false;

  /**
   * Map of loaded modules in the process, keyed by module name.
   */
  #modules: Readonly<Record<string, Module>>;

  /**
   * Scratch buffers for temporary FFI reads/writes.
   */
  readonly #Scratch1 = new Scratch(0x01);
  readonly #Scratch2 = new Scratch(0x02);
  readonly #Scratch3 = new Scratch(0x03);
  readonly #Scratch4 = new Scratch(0x04);
  readonly #Scratch8 = new Scratch(0x08);
  readonly #Scratch12 = new Scratch(0x0c);
  readonly #Scratch16 = new Scratch(0x10);

  readonly #Scratch1080 = new Scratch(0x438);

  /**
   * Reusable, grow-on-demand haystack buffer for indexOf() reads.
   */
  #indexOfHaystack = Buffer.allocUnsafe(0x1000);

  #patternCache?: {
    anchor: { buffer: Buffer; index: number; length: number };
    needle: string;
    tokens: { buffer: Buffer; index: number; length: number }[];
  };

  /**
   * Reusable, grow-on-demand haystack buffer for pattern() region scans.
   */
  #patternHaystack = Buffer.allocUnsafe(0x1000);

  static #TextDecoderUTF8 = new TextDecoder('utf-8');
  static #TextEncoderUTF8 = new TextEncoder();

  public readonly cntThreads: number;
  public readonly hProcess: bigint;
  public readonly is32Bit: boolean;
  public readonly pcPriClassBase: number;
  public readonly szExeFile: string;
  public readonly th32ParentProcessID: number;
  public readonly th32ProcessID: number;

  /**
   * Gets all loaded modules in the process.
   * @example
   * ```ts
   * const cs2 = new Process('cs2.exe');
   * const client = cs2.modules['client.dll'];
   * ```
   */
  public get modules(): Readonly<Record<string, Module>> {
    return this.#modules;
  }

  /**
   * Disposes resources held by this Process instance.
   * Called automatically when using `using` blocks.
   * @example
   * ```ts
   * using mem = new Process('cs2.exe');
   * // mem is disposed at the end of the block
   * ```
   */
  public [Symbol.dispose](): void {
    this.close();

    return;
  }

  /**
   * Asynchronously disposes resources held by this Process instance.
   * Use in `await using` blocks for async cleanup.
   * @example
   * ```ts
   * await using mem = new Process('cs2.exe');
   * // mem is disposed asynchronously at the end of the block
   * ```
   */
  public [Symbol.asyncDispose](): Promise<void> {
    this.close();

    return Promise.resolve();
  }

  /**
   * Allocates memory in the remote process.
   * @param length Bytes to allocate.
   * @param protect Page protection (defaults to PAGE_READWRITE).
   * @returns Base address of the allocation.
   * @example
   * ```ts
   * const ptr = cs2.alloc(0x100);
   * ```
   */
  public alloc(length: number, protect: number = MemoryProtection.PAGE_READWRITE): bigint {
    const { hProcess } = this;

    if (length <= 0) {
      throw new RangeError('length must be greater than 0.');
    }

    const dwSize = BigInt(length);
    const flAllocationType = MemoryAllocationType.MEM_COMMIT | MemoryAllocationType.MEM_RESERVE;
    const flProtect = protect;
    const lpAddress = 0n;

    const lpBaseAddress = VirtualAllocEx(hProcess, lpAddress, dwSize, flAllocationType, flProtect);

    if (lpBaseAddress === 0n) {
      throw new Win32Error('VirtualAllocEx', GetLastError());
    }

    return lpBaseAddress;
  }

  /**
   * Calls a native function pointer inside the remote process using a Bun FFI-style signature.
   * @param address Function pointer to call.
   * @param signature Fixed Windows x64 argument and return signature, up to 64 arguments.
   * @param args Arguments matching the signature.
   * @returns The function result.
   * @example
   * ```ts
   * import { FFIType } from 'bun:ffi';
   * import Process from '@bun-win32/memory';
   *
   * using target = new Process(process.pid);
   * const address = target.procedure('kernel32.dll', 'GetCurrentProcessId');
   * console.log(target.call(address, { args: [], returns: FFIType.u32 }));
   * ```
   */
  public call<const Signature extends CallSignature>(address: CallPointer, signature: Signature, ...args: CallArguments<Signature>): CallReturn<Signature>;
  public call(address: CallPointer, signature: CallSignature, ...args: unknown[]): bigint | boolean | number | undefined {
    if (this.#closed) {
      throw new Error('Process is closed.');
    }

    if (this.is32Bit) {
      throw new Error('Remote call() is not supported on 32-bit (WOW64) targets.');
    }

    if (process.arch !== 'x64') {
      throw new Error('Remote call() requires an x64 Bun runtime.');
    }

    if (signature.args.length !== args.length) {
      throw new RangeError(`Expected ${signature.args.length} arguments, received ${args.length}.`);
    }

    if (args.length > 0x40) {
      throw new RangeError('Remote calls support up to 64 arguments.');
    }

    const returns = typeof signature.returns === 'number' ? signature.returns : FFITypeByName[signature.returns];

    switch (returns) {
      case FFIType.bool:
      case FFIType.char:
      case FFIType.cstring:
      case FFIType.f32:
      case FFIType.f64:
      case FFIType.function:
      case FFIType.i16:
      case FFIType.i32:
      case FFIType.i64:
      case FFIType.i64_fast:
      case FFIType.i8:
      case FFIType.ptr:
      case FFIType.u16:
      case FFIType.u32:
      case FFIType.u64:
      case FFIType.u64_fast:
      case FFIType.u8:
      case FFIType.void:
        break;

      default:
        throw new TypeError(`Unsupported remote call return type: ${signature.returns}.`);
    }

    let functionAddress: bigint;

    if (typeof address === 'bigint') {
      functionAddress = address;
    } else if (!Number.isFinite(address)) {
      throw new TypeError('Function address must be a finite pointer.');
    } else if (Number.isInteger(address)) {
      functionAddress = BigInt(address);
    } else {
      this.#Scratch8.buffer.writeDoubleLE(address, 0x00);
      functionAddress = this.#Scratch8.buffer.readBigUInt64LE(0x00);
    }

    if (functionAddress <= 0n || functionAddress > 0xffff_ffff_ffff_ffffn) {
      throw new RangeError('Function address must be a non-zero 64-bit pointer.');
    }

    // Entry RSP is 8 modulo 16; reserve shadow space, stack arguments, and alignment.
    const stackSize = 0x28 + Math.floor(Math.max(0, args.length - 0x04) / 0x02) * 0x10;
    const shellcode = Buffer.alloc(0x40 + args.length * 0x12);
    let offset = 0x00;

    shellcode.set([0x48, 0x81, 0xec], offset); // sub rsp, stackSize
    offset += 0x03;
    shellcode.writeUInt32LE(stackSize, offset);
    offset += 0x04;

    for (let index = 0; index < args.length; index++) {
      const signatureArgument = signature.args[index]!;
      const argumentType = typeof signatureArgument === 'number' ? signatureArgument : FFITypeByName[signatureArgument];
      const argument = args[index];
      let value: bigint;

      switch (argumentType) {
        case FFIType.bool:
          if (typeof argument !== 'boolean') {
            throw new TypeError('Boolean arguments must be boolean values.');
          }

          value = argument ? 1n : 0n;
          break;

        case FFIType.cstring:
        case FFIType.function:
        case FFIType.ptr:
          if (argument === null) {
            value = 0n;
          } else if (typeof argument === 'bigint') {
            value = argument;
          } else if (typeof argument === 'number' && Number.isFinite(argument)) {
            if (Number.isInteger(argument)) {
              value = BigInt(argument);
            } else {
              this.#Scratch8.buffer.writeDoubleLE(argument, 0x00);
              value = this.#Scratch8.buffer.readBigUInt64LE(0x00);
            }
          } else {
            throw new TypeError('Pointer arguments must be pointers, bigint, or null.');
          }

          if (value < 0n || value > 0xffff_ffff_ffff_ffffn) {
            throw new RangeError('Pointer arguments must fit in 64 bits.');
          }

          break;

        case FFIType.f32:
        case FFIType.f64:
          if (typeof argument !== 'number') {
            throw new TypeError('Floating-point arguments must be numbers.');
          }

          this.#Scratch8.buffer.writeBigUInt64LE(0n, 0x00);

          if (argumentType === FFIType.f32) {
            this.#Scratch8.buffer.writeFloatLE(argument, 0x00);
          } else {
            this.#Scratch8.buffer.writeDoubleLE(argument, 0x00);
          }

          value = this.#Scratch8.buffer.readBigUInt64LE(0x00);
          break;

        case FFIType.char:
        case FFIType.i16:
        case FFIType.i32:
        case FFIType.i64:
        case FFIType.i64_fast:
        case FFIType.i8:
        case FFIType.u16:
        case FFIType.u32:
        case FFIType.u64:
        case FFIType.u64_fast:
        case FFIType.u8:
          if (typeof argument === 'bigint' && (argumentType === FFIType.i64 || argumentType === FFIType.i64_fast || argumentType === FFIType.u64 || argumentType === FFIType.u64_fast)) {
            value = argument;
          } else if (typeof argument === 'number' && Number.isSafeInteger(argument)) {
            value = BigInt(argument);
          } else {
            throw new TypeError('Integer arguments must be safe integers, or bigint for 64-bit types.');
          }

          break;

        default:
          throw new TypeError(`Unsupported remote call argument type: ${signatureArgument}.`);
      }

      if (index < 0x04 && argumentType !== FFIType.f32 && argumentType !== FFIType.f64) {
        shellcode.set([index < 0x02 ? 0x48 : 0x49, index < 0x02 ? 0xb9 + index : 0xb8 + index - 0x02], offset);
        offset += 0x02;
        shellcode.writeBigUInt64LE(BigInt.asUintN(0x40, value), offset);
        offset += 0x08;

        continue;
      }

      shellcode.set([0x48, 0xb8], offset); // mov rax, value
      offset += 0x02;
      shellcode.writeBigUInt64LE(BigInt.asUintN(0x40, value), offset);
      offset += 0x08;

      if (index < 0x04) {
        shellcode.set([0x66, 0x48, 0x0f, 0x6e, 0xc0 + index * 0x08], offset); // movq xmm[index], rax
        offset += 0x05;
      } else {
        shellcode.set([0x48, 0x89, 0x84, 0x24], offset); // mov [rsp + stackOffset], rax
        offset += 0x04;
        shellcode.writeUInt32LE(0x20 + (index - 0x04) * 0x08, offset);
        offset += 0x04;
      }
    }

    shellcode.set([0x48, 0xb8], offset);
    offset += 0x02;
    shellcode.writeBigUInt64LE(functionAddress, offset);
    offset += 0x08;
    shellcode.set([0xff, 0xd0, 0x49, 0xbb], offset); // call rax; mov r11, resultAddress
    offset += 0x04;

    const resultAddressOffset = offset;
    offset += 0x08;

    if (returns === FFIType.f32 || returns === FFIType.f64) {
      shellcode.set([returns === FFIType.f32 ? 0xf3 : 0xf2, 0x41, 0x0f, 0x11, 0x03], offset); // movss/movsd [r11], xmm0
      offset += 0x05;
    } else {
      shellcode.set([0x49, 0x89, 0x03], offset); // mov [r11], rax
      offset += 0x03;
    }

    shellcode.set([0x41, 0xc7, 0x43, 0x08, 0x01, 0x00, 0x00, 0x00, 0x31, 0xc0, 0x48, 0x81, 0xc4], offset);
    offset += 0x0d;
    shellcode.writeUInt32LE(stackSize, offset);
    offset += 0x04;
    shellcode[offset++] = 0xc3;

    // Keep code on an RX page and results on a separate RW page.
    const remoteCallAddress = this.alloc(0x2000);
    const resultAddress = remoteCallAddress + 0x1000n;
    let release = true;

    try {
      shellcode.writeBigUInt64LE(resultAddress, resultAddressOffset);
      this.write(remoteCallAddress, shellcode.subarray(0x00, offset));
      this.protection(remoteCallAddress, 0x1000, MemoryProtection.PAGE_EXECUTE_READ);

      if (!FlushInstructionCache(this.hProcess, remoteCallAddress, BigInt(offset))) {
        throw new Win32Error('FlushInstructionCache', GetLastError());
      }

      const hThread = CreateRemoteThread(this.hProcess, null, 0n, remoteCallAddress, 0n, 0x00, null);

      if (hThread === 0n) {
        throw new Win32Error('CreateRemoteThread', GetLastError());
      }

      using thread = { handle: hThread, [Symbol.dispose]: () => CloseHandle(hThread) };

      release = false;

      const waitResult = WaitForSingleObject(thread.handle, INFINITE);

      if (waitResult === WAIT_FAILED) {
        throw new Win32Error('WaitForSingleObject', GetLastError());
      }

      if (waitResult !== WAIT_OBJECT_0) {
        throw new Error(`WaitForSingleObject returned ${waitResult}.`);
      }

      release = true;

      this.read(resultAddress, this.#Scratch12.buffer);

      if (this.#Scratch12.u32[0x02] !== 0x01) {
        throw new Error('Remote thread exited without returning from the function.');
      }

      const result = this.#Scratch12.buffer.readBigUInt64LE(0x00);

      switch (returns) {
        case FFIType.bool:
          return (result & 0xffn) !== 0n;

        case FFIType.char:
        case FFIType.i8:
          return Number(BigInt.asIntN(0x08, result));

        case FFIType.cstring:
        case FFIType.function:
        case FFIType.ptr:
        case FFIType.u64:
          return result;

        case FFIType.f32:
          return this.#Scratch12.buffer.readFloatLE(0x00);

        case FFIType.f64:
          return this.#Scratch12.buffer.readDoubleLE(0x00);

        case FFIType.i16:
          return Number(BigInt.asIntN(0x10, result));

        case FFIType.i32:
          return Number(BigInt.asIntN(0x20, result));

        case FFIType.i64:
          return BigInt.asIntN(0x40, result);

        case FFIType.i64_fast: {
          const signed = BigInt.asIntN(0x40, result);

          return signed >= BigInt(Number.MIN_SAFE_INTEGER) && signed <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(signed) : signed;
        }

        case FFIType.u16:
          return Number(BigInt.asUintN(0x10, result));

        case FFIType.u32:
          return Number(BigInt.asUintN(0x20, result));

        case FFIType.u64_fast:
          return result <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(result) : result;

        case FFIType.u8:
          return Number(BigInt.asUintN(0x08, result));

        case FFIType.void:
          return undefined;
      }
    } finally {
      // A failed wait cannot prove the thread stopped using its code page.
      if (release) {
        this.free(remoteCallAddress);
      }
    }
  }

  /**
   * Closes the process handle.
   * @example
   * ```ts
   * const cs2 = new Process('cs2.exe');
   * cs2.close();
   * ```
   */
  public close(): void {
    if (this.#closed) {
      return;
    }

    this.#closed = true;

    CloseHandle(this.hProcess);

    return;
  }

  /**
   * Frees memory allocated in the remote process.
   * @param address Allocation base address.
   * @example
   * ```ts
   * const ptr = cs2.alloc(0x100);
   * cs2.free(ptr);
   * ```
   */
  public free(address: bigint): void {
    const { hProcess } = this;

    const dwFreeType = MemoryAllocationType.MEM_RELEASE;
    const dwSize = 0x00n;
    const lpAddress = address;

    const bVirtualFreeEx = !!VirtualFreeEx(hProcess, lpAddress, dwSize, dwFreeType);

    if (!bVirtualFreeEx) {
      throw new Win32Error('VirtualFreeEx', GetLastError());
    }

    return;
  }

  /**
   * Binds named remote function pointers using Bun FFI-style symbols.
   * @param symbols Named argument, pointer, and return signatures.
   * @returns Typed functions bound to this process.
   * @example
   * ```ts
   * import { FFIType } from 'bun:ffi';
   * import Process from '@bun-win32/memory';
   * using target = new Process(process.pid);
   * const functions = target.link({ GetCurrentProcessId: { args: [], ptr: target.procedure('kernel32.dll', 'GetCurrentProcessId'), returns: FFIType.u32 } });
   * console.log(functions.GetCurrentProcessId());
   * ```
   */
  public link<const Symbols extends Readonly<Record<string, CallSymbol>>>(symbols: Symbols): CallFunctions<Symbols>;
  public link(symbols: Readonly<Record<string, CallSymbol>>): Readonly<Record<string, (...args: never[]) => bigint | boolean | number | undefined>> {
    const functions: Record<string, (...args: never[]) => bigint | boolean | number | undefined> = {};

    for (const [name, signature] of Object.entries(symbols)) {
      const args = Object.freeze([...signature.args]);
      const { ptr, returns } = signature;
      const boundSignature = Object.freeze({ args, returns });

      Object.defineProperty(functions, name, { enumerable: true, value: (...values: CallArguments<CallSignature>) => this.call(ptr, boundSignature, ...values) });
    }

    return Object.freeze(functions);
  }

  /**
   * Resolves an export from a module loaded in the target process.
   * @param moduleName Module name, including its extension.
   * @param name Export name or ordinal.
   * @returns Function address in the target process.
   * @example
   * ```ts
   * import Process from '@bun-win32/memory';
   * using target = new Process(process.pid);
   * console.log(target.procedure('kernel32.dll', 'GetCurrentProcessId'));
   * ```
   */
  public procedure(moduleName: string, name: number | string): bigint {
    if (this.#closed) {
      throw new Error('Process is closed.');
    }

    const originalName = name;
    let originalModuleAddress = 0n;

    for (let depth = 0; depth < 0x10; depth++) {
      const moduleKey = moduleName.toLowerCase();
      let module: Module | undefined;

      for (const key in this.#modules) {
        if (key.toLowerCase() === moduleKey) {
          module = this.#modules[key];

          break;
        }
      }

      if (module === undefined) {
        if (!this.is32Bit && originalModuleAddress !== 0n && originalName !== 'GetProcAddress' && (moduleKey.startsWith('api-') || moduleKey.startsWith('ext-'))) {
          // API-set contracts are resolved by the target loader, not by local DLL addresses.
          const resolver = this.procedure('kernel32.dll', 'GetProcAddress');
          let allocation = 0n;

          try {
            let argument: bigint;

            if (typeof originalName === 'number') {
              if (originalName < 0 || originalName > 0xffff) {
                throw new RangeError('Forwarded export ordinals must fit in 16 bits.');
              }

              argument = BigInt(originalName);
            } else {
              const buffer = Buffer.from(`${originalName}\0`, 'utf8');
              allocation = this.alloc(buffer.byteLength);
              this.write(allocation, buffer);
              argument = allocation;
            }

            const result = this.call(resolver, { args: [FFIType.u64, FFIType.ptr], returns: FFIType.ptr }, originalModuleAddress, argument);

            if (result === 0n) {
              throw new Error(`Export not found: ${moduleName}!${name}.`);
            }

            return result;
          } finally {
            if (allocation !== 0n) {
              this.free(allocation);
            }
          }
        }

        throw new Error(`Module not found: ${moduleName}.`);
      }

      const { modBaseAddr, modBaseSize } = module;

      if (depth === 0) {
        originalModuleAddress = modBaseAddr;
      }

      if (modBaseSize < 0x40) {
        throw new RangeError('Module is too small for a PE header.');
      }

      const dosHeader = this.buffer(modBaseAddr, 0x40);
      const headerOffset = dosHeader.readUInt32LE(0x3c);

      if (dosHeader.readUInt16LE(0x00) !== 0x5a4d || headerOffset > modBaseSize - 0x18) {
        throw new Error('Invalid PE DOS header.');
      }

      const header = this.buffer(modBaseAddr + BigInt(headerOffset), 0x18);
      const optionalSize = header.readUInt16LE(0x14);
      const optionalOffset = headerOffset + 0x18;

      if (header.readUInt32LE(0x00) !== 0x0000_4550 || optionalSize < 0x68 || optionalSize > modBaseSize - optionalOffset) {
        throw new Error('Invalid PE NT header.');
      }

      const optionalHeader = this.buffer(modBaseAddr + BigInt(optionalOffset), optionalSize);
      const magic = optionalHeader.readUInt16LE(0x00);
      const directoryOffset = magic === 0x010b ? 0x60 : magic === 0x020b ? 0x70 : -1;

      if (directoryOffset === -1 || optionalSize < directoryOffset + 0x08) {
        throw new Error('Unsupported PE optional header.');
      }

      const exportOffset = optionalHeader.readUInt32LE(directoryOffset);
      const exportSize = optionalHeader.readUInt32LE(directoryOffset + 0x04);

      if (optionalHeader.readUInt32LE(directoryOffset - 0x04) === 0 || exportOffset === 0 || exportSize < 0x28) {
        throw new Error(`Export not found: ${moduleName}!${name}.`);
      }

      if (exportOffset > modBaseSize - exportSize) {
        throw new RangeError('PE export directory exceeds the module.');
      }

      const directory = this.buffer(modBaseAddr + BigInt(exportOffset), 0x28);
      const ordinalBase = directory.readUInt32LE(0x10);
      const functionCount = directory.readUInt32LE(0x14);
      const nameCount = directory.readUInt32LE(0x18);
      const functionsOffset = directory.readUInt32LE(0x1c);
      const namesOffset = directory.readUInt32LE(0x20);
      const ordinalsOffset = directory.readUInt32LE(0x24);

      if (functionsOffset > modBaseSize - functionCount * 0x04 || namesOffset > modBaseSize - nameCount * 0x04 || ordinalsOffset > modBaseSize - nameCount * 0x02) {
        throw new RangeError('PE export tables exceed the module.');
      }

      let functionIndex = typeof name === 'number' ? name - ordinalBase : -1;

      if (typeof name === 'string' && nameCount !== 0) {
        const names = this.u32Array(modBaseAddr + BigInt(namesOffset), nameCount);
        let lower = 0;
        let upper = nameCount - 1;

        // PE export names are sorted lexically; bound each string to its mapped page.
        while (lower <= upper) {
          const index = Math.floor((lower + upper) / 0x02);
          const nameOffset = names[index]!;

          if (nameOffset >= modBaseSize) {
            throw new RangeError('PE export name exceeds the module.');
          }

          const exportName = this.string(modBaseAddr + BigInt(nameOffset), Math.min(modBaseSize - nameOffset, 0x1000 - (nameOffset % 0x1000)));

          if (exportName === name) {
            functionIndex = this.u16(modBaseAddr + BigInt(ordinalsOffset + index * 0x02));

            break;
          }

          if (exportName < name) {
            lower = index + 1;
          } else {
            upper = index - 1;
          }
        }
      }

      if (!Number.isInteger(functionIndex) || functionIndex < 0 || functionIndex >= functionCount) {
        throw new Error(`Export not found: ${moduleName}!${name}.`);
      }

      const functionOffset = this.u32(modBaseAddr + BigInt(functionsOffset + functionIndex * 0x04));

      if (functionOffset === 0 || functionOffset >= modBaseSize) {
        throw new Error(`Invalid export address: ${moduleName}!${name}.`);
      }

      if (functionOffset < exportOffset || functionOffset >= exportOffset + exportSize) {
        return modBaseAddr + BigInt(functionOffset);
      }

      const forwarder = this.string(modBaseAddr + BigInt(functionOffset), exportOffset + exportSize - functionOffset);
      const separator = forwarder.lastIndexOf('.');

      if (separator <= 0 || separator === forwarder.length - 1) {
        throw new Error(`Invalid PE forwarder: ${forwarder}.`);
      }

      moduleName = forwarder.slice(0, separator);
      moduleName = moduleName.toLowerCase().endsWith('.dll') ? moduleName : `${moduleName}.dll`;
      const forwardedName = forwarder.slice(separator + 1);
      name = forwardedName.startsWith('#') ? Number(forwardedName.slice(1)) : forwardedName;
    }

    throw new Error('PE export forwarder chain exceeds 16 modules.');
  }

  /**
   * Changes the page protection of a region.
   * @param address Base address to protect.
   * @param length Bytes to protect.
   * @param protect New protection flags.
   * @returns Previous protection flags.
   * @example
   * ```ts
   * const cs2 = new Process('cs2.exe');
   * const previous = cs2.protection(0x12345678n, 0x1000, 0x40);
   * ```
   */
  public protection(address: bigint, length: number, protect: number): number {
    const { hProcess } = this;

    if (length <= 0) {
      throw new RangeError('length must be greater than 0.');
    }

    const dwSize = BigInt(length);
    const flNewProtect = protect;
    const lpAddress = address;
    const lpflOldProtect = this.#Scratch4.ptr;

    const bVirtualProtectEx = VirtualProtectEx(hProcess, lpAddress, dwSize, flNewProtect, lpflOldProtect);

    if (!bVirtualProtectEx) {
      throw new Win32Error('VirtualProtectEx', GetLastError());
    }

    return this.#Scratch4.u32[0x00]!;
  }

  /**
   * Reads memory into a buffer.
   * @param address Address to read from.
   * @param scratch Buffer to fill.
   * @returns The filled buffer.
   * @example
   * ```ts
   * const cs2 = new Process('cs2.exe');
   * const myBuffer = cs2.read(0x12345678n, new Uint8Array(4));
   * ```
   */
  public read<T extends BufferLike>(address: bigint, scratch: T): T {
    const { hProcess } = this;

    const lpBaseAddress = address;
    const lpBuffer = ptr(scratch);
    const nSize = BigInt(scratch.byteLength);
    const numberOfBytesRead = null;

    const bReadProcessMemory = ReadProcessMemory(hProcess, lpBaseAddress, lpBuffer, nSize, numberOfBytesRead);

    if (!bReadProcessMemory) {
      throw new Win32Error('ReadProcessMemory', GetLastError());
    }

    return scratch;
  }

  /**
   * Refreshes the module list for the process.
   * @example
   * ```ts
   * const cs2 = new Process('cs2.exe');
   * cs2.refresh();
   * ```
   */
  public refresh(): void {
    const { th32ProcessID } = this;

    const dwFlags = ToolhelpSnapshotFlags.TH32CS_SNAPMODULE | ToolhelpSnapshotFlags.TH32CS_SNAPMODULE32;

    const hSnapshot = CreateToolhelp32Snapshot(dwFlags, th32ProcessID)!;

    if (hSnapshot === INVALID_HANDLE_VALUE) {
      throw new Win32Error('CreateToolhelp32Snapshot', GetLastError());
    }

    using snapshot = { handle: hSnapshot, [Symbol.dispose]: () => CloseHandle(hSnapshot) };

    const lpme = this.#Scratch1080;
    const lpmeBuffer = lpme.buffer;
    /* */ lpmeBuffer.writeUInt32LE(0x438 /* sizeof(MODULEENTRY32W) */);

    const bModule32FirstW = Module32FirstW(snapshot.handle, lpme.ptr);

    if (!bModule32FirstW) {
      throw new Win32Error('Module32FirstW', GetLastError());
    }

    const modules: Record<string, Module> = {};

    do {
      const buffer = Buffer.allocUnsafe(0x438);
      lpmeBuffer.copy(buffer);

      const module = new Module(buffer);
      const szModule = module.szModule;

      modules[szModule] = module;
    } while (Module32NextW(snapshot.handle, lpme.ptr));

    this.#modules = Object.freeze(modules);

    return;
  }

  /**
   * Writes a buffer to memory.
   * @param address Address to write to.
   * @param scratch Buffer to write.
   * @param force When writing, if true temporarily changes page protection to allow the write.
   * @returns This instance.
   * @example
   * ```ts
   * const cs2 = new Process('cs2.exe');
   * cs2.write(0x12345678n, new Uint8Array([1,2,3,4]));
   * // Force a write by temporarily changing memory protection
   * cs2.write(0x12345678n, new Uint8Array([1,2,3,4]), true);
   * ```
   */
  public write(address: bigint, scratch: BufferLike, force: boolean = false): this {
    const { hProcess } = this;

    const lpBaseAddress = address;
    const lpBuffer = ptr(scratch);
    const nSize = BigInt(scratch.byteLength);
    const numberOfBytesWritten = null;

    if (!force) {
      const bWriteProcessMemory = WriteProcessMemory(hProcess, lpBaseAddress, lpBuffer, nSize, numberOfBytesWritten);

      if (!bWriteProcessMemory) {
        throw new Win32Error('WriteProcessMemory', GetLastError());
      }

      return this;
    }

    const dwSize = nSize;
    const flNewProtect = MemoryProtection.PAGE_EXECUTE_READWRITE;
    const lpflOldProtect = Buffer.allocUnsafe(0x04);

    const bVirtualProtectEx = VirtualProtectEx(hProcess, lpBaseAddress, dwSize, flNewProtect, lpflOldProtect.ptr);

    if (!bVirtualProtectEx) {
      throw new Win32Error('VirtualProtectEx', GetLastError());
    }

    try {
      const bWriteProcessMemory = WriteProcessMemory(hProcess, lpBaseAddress, lpBuffer, nSize, numberOfBytesWritten);

      if (!bWriteProcessMemory) {
        throw new Win32Error('WriteProcessMemory', GetLastError());
      }
    } finally {
      const flNewProtect2 = lpflOldProtect.readUInt32LE(0x00);

      const bVirtualProtectEx2 = VirtualProtectEx(hProcess, lpBaseAddress, dwSize, flNewProtect2, lpflOldProtect.ptr);

      if (!bVirtualProtectEx2) {
        throw new Win32Error('VirtualProtectEx', GetLastError());
      }
    }

    return this;
  }

  /**
   * Reads or writes a boolean value.
   * @param address Address to access.
   * @param value Optional value to write.
   * @param force When writing, if true temporarily changes page protection to allow the write.
   * @returns The boolean at address, or this instance if writing.
   * @example
   * ```ts
   * const cs2 = new Process('cs2.exe');
   * const myBool = cs2.bool(0x12345678n);
   * cs2.bool(0x12345678n, true);
   * ```
   */
  public bool(address: bigint): boolean;
  public bool(address: bigint, value: boolean, force?: boolean): this;
  public bool(address: bigint, value?: boolean, force?: boolean): boolean | this {
    const { hProcess } = this;

    if (value === undefined) {
      const bReadProcessMemory = !!ReadProcessMemory(hProcess, address, this.#Scratch1.ptr, 0x01n, null);

      if (!bReadProcessMemory) {
        throw new Win32Error('ReadProcessMemory', GetLastError());
      }

      return this.#Scratch1.u8[0x00]! !== 0;
    }

    this.#Scratch1.u8[0x00] = value ? 0x01 : 0x00;

    this.write(address, this.#Scratch1.u8, force);

    return this;
  }

  /**
   * Reads specific bits from a 32-bit value.
   * @param address Address to read from.
   * @param startBit Starting bit position (0-31).
   * @param bitCount Number of bits to read (1-31).
   * @returns The extracted bits as a number.
   * @example
   * ```ts
   * const cs2 = new Process('cs2.exe');
   * const flags = cs2.bits(0x12345678n, 4, 8); // Read 8 bits starting at bit 4
   * ```
   */
  public bits(address: bigint, startBit: number, bitCount: number): number {
    const { hProcess } = this;

    const bReadProcessMemory = !!ReadProcessMemory(hProcess, address, this.#Scratch4.ptr, 0x04n, null);

    if (!bReadProcessMemory) {
      throw new Win32Error('ReadProcessMemory', GetLastError());
    }

    const mask = (1 << bitCount) - 1,
      value = this.#Scratch4.u32[0x00]!;

    return (value >> startBit) & mask;
  }

  /**
   * Reads or writes a Buffer.
   * @param address Address to access.
   * @param lengthOrValue Length to read or Buffer to write.
   * @param force When writing, if true temporarily changes page protection to allow the write.
   * @returns Buffer read or this instance if writing.
   * @example
   * ```ts
   * const cs2 = new Process('cs2.exe');
   * const myBuffer = cs2.buffer(0x12345678n, 8);
   * cs2.buffer(0x12345678n, Buffer.from([1,2,3,4]));
   * ```
   */
  public buffer(address: bigint, length: number): Buffer;
  public buffer(address: bigint, value: Buffer, force?: boolean): this;
  public buffer(address: bigint, lengthOrValue: number | Buffer, force?: boolean): Buffer | this {
    if (typeof lengthOrValue === 'number') {
      const length = lengthOrValue;
      const scratch = Buffer.allocUnsafe(length);

      return this.read(address, scratch);
    }

    const value = lengthOrValue;

    this.write(address, value, force);

    return this;
  }

  /**
   * Reads or writes a C-style string.
   * @param address Address to access.
   * @param lengthOrValue Length to read or CString to write.
   * @param force When writing, if true temporarily changes page protection to allow the write.
   * @returns CString read or this instance if writing.
   * @example
   * ```ts
   * const cs2 = new Process('cs2.exe');
   * const myCString = cs2.cString(0x12345678n, 16);
   * cs2.cString(0x12345678n, new CString('hello'));
   * ```
   */
  public cString(address: bigint, length: number): CString;
  public cString(address: bigint, value: CString, force?: boolean): this;
  public cString(address: bigint, lengthOrValue: number | CString, force?: boolean): CString | this {
    if (typeof lengthOrValue === 'number') {
      const scratch = new Uint8Array(lengthOrValue);

      this.read(address, scratch);

      const indexOf = scratch.indexOf(0x00);

      if (indexOf === -1) {
        scratch[lengthOrValue - 1] = 0x00;
      }

      return new CString(scratch.ptr);
    }

    const scratch = Buffer.from(lengthOrValue);

    this.write(address, scratch, force);

    return this;
  }

  /**
   * Reads or writes a 16-bit float (half precision).
   * @param address Address to access.
   * @param value Optional value to write.
   * @param force When writing, if true temporarily changes page protection to allow the write.
   * @returns The half at address, or this instance if writing.
   * @example
   * ```ts
   * const cs2 = new Process('cs2.exe');
   * const myHalf = cs2.f16(0x12345678n);
   * cs2.f16(0x12345678n, 1.5);
   * ```
   */
  public f16(address: bigint): number;
  public f16(address: bigint, value: number, force?: boolean): this;
  public f16(address: bigint, value?: number, force?: boolean): number | this {
    const { hProcess } = this;

    if (value === undefined) {
      const bReadProcessMemory = !!ReadProcessMemory(hProcess, address, this.#Scratch2.ptr, 0x02n, null);

      if (!bReadProcessMemory) {
        throw new Win32Error('ReadProcessMemory', GetLastError());
      }

      return this.#Scratch2.f16[0x00]!;
    }

    this.#Scratch2.f16[0x00] = value;

    this.write(address, this.#Scratch2.f16, force);

    return this;
  }

  /**
   * Reads or writes a Float16Array.
   * @param address Address to access.
   * @param lengthOrValues Length to read or Float16Array to write.
   * @param force When writing, if true temporarily changes page protection to allow the write.
   * @returns Float16Array read or this instance if writing.
   * @example
   * ```ts
   * const cs2 = new Process('cs2.exe');
   * const myArray = cs2.f16Array(0x12345678n, 3);
   * cs2.f16Array(0x12345678n, new Float16Array([1, 2, 3]));
   * ```
   */
  public f16Array(address: bigint, length: number): Float16Array;
  public f16Array(address: bigint, values: Float16Array, force?: boolean): this;
  public f16Array(address: bigint, lengthOrValues: Float16Array | number, force?: boolean): Float16Array | this {
    if (typeof lengthOrValues === 'number') {
      const length = lengthOrValues;
      const scratch = new Float16Array(length);

      this.read(address, scratch);

      return scratch;
    }

    const values = lengthOrValues;

    this.write(address, values, force);

    return this;
  }

  /**
   * Reads or writes a 32-bit float.
   * @param address Address to access.
   * @param value Optional value to write.
   * @param force When writing, if true temporarily changes page protection to allow the write.
   * @returns The float at address, or this instance if writing.
   * @example
   * ```ts
   * const cs2 = new Process('cs2.exe');
   * const myFloat = cs2.f32(0x12345678n);
   * cs2.f32(0x12345678n, 1.23);
   * ```
   */
  public f32(address: bigint): number;
  public f32(address: bigint, value: number, force?: boolean): this;
  public f32(address: bigint, value?: number, force?: boolean): number | this {
    const { hProcess } = this;

    if (value === undefined) {
      const bReadProcessMemory = !!ReadProcessMemory(hProcess, address, this.#Scratch4.ptr, 0x04n, null);

      if (!bReadProcessMemory) {
        throw new Win32Error('ReadProcessMemory', GetLastError());
      }

      return this.#Scratch4.f32[0x00]!;
    }

    this.#Scratch4.f32[0x00] = value;

    this.write(address, this.#Scratch4.f32, force);

    return this;
  }

  /**
   * Reads or writes a Float32Array.
   * @param address Address to access.
   * @param lengthOrValues Length to read or Float32Array to write.
   * @param force When writing, if true temporarily changes page protection to allow the write.
   * @returns Float32Array read or this instance if writing.
   * @example
   * ```ts
   * const cs2 = new Process('cs2.exe');
   * const myArray = cs2.f32Array(0x12345678n, 3);
   * cs2.f32Array(0x12345678n, new Float32Array([1,2,3]));
   * ```
   */
  public f32Array(address: bigint, length: number): Float32Array;
  public f32Array(address: bigint, values: Float32Array, force?: boolean): this;
  public f32Array(address: bigint, lengthOrValues: Float32Array | number, force?: boolean): Float32Array | this {
    if (typeof lengthOrValues === 'number') {
      const length = lengthOrValues;
      const scratch = new Float32Array(length);

      this.read(address, scratch);

      return scratch;
    }

    const values = lengthOrValues;

    this.write(address, values, force);

    return this;
  }

  /**
   * Reads or writes a 64-bit float.
   * @param address Address to access.
   * @param value Optional value to write.
   * @param force When writing, if true temporarily changes page protection to allow the write.
   * @returns The float at address, or this instance if writing.
   * @example
   * ```ts
   * const cs2 = new Process('cs2.exe');
   * const myFloat = cs2.f64(0x12345678n);
   * cs2.f64(0x12345678n, 1.23);
   * ```
   */
  public f64(address: bigint): number;
  public f64(address: bigint, value: number, force?: boolean): this;
  public f64(address: bigint, value?: number, force?: boolean): number | this {
    const { hProcess } = this;

    if (value === undefined) {
      const bReadProcessMemory = !!ReadProcessMemory(hProcess, address, this.#Scratch8.ptr, 0x08n, null);

      if (!bReadProcessMemory) {
        throw new Win32Error('ReadProcessMemory', GetLastError());
      }

      return this.#Scratch8.f64[0x00]!;
    }

    this.#Scratch8.f64[0x00] = value;

    this.write(address, this.#Scratch8.f64, force);

    return this;
  }

  /**
   * Reads or writes a Float64Array.
   * @param address Address to access.
   * @param lengthOrValues Length to read or Float64Array to write.
   * @param force When writing, if true temporarily changes page protection to allow the write.
   * @returns Float64Array read or this instance if writing.
   * @example
   * ```ts
   * const cs2 = new Process('cs2.exe');
   * const myArray = cs2.f64Array(0x12345678n, 2);
   * cs2.f64Array(0x12345678n, new Float64Array([1,2]));
   * ```
   */
  public f64Array(address: bigint, length: number): Float64Array;
  public f64Array(address: bigint, values: Float64Array, force?: boolean): this;
  public f64Array(address: bigint, lengthOrValues: Float64Array | number, force?: boolean): Float64Array | this {
    if (typeof lengthOrValues === 'number') {
      const length = lengthOrValues;
      const scratch = new Float64Array(length);

      this.read(address, scratch);

      return scratch;
    }

    const values = lengthOrValues;

    this.write(address, values, force);

    return this;
  }

  /**
   * Reads or writes a 16-bit integer.
   * @param address Address to access.
   * @param value Optional value to write.
   * @param force When writing, if true temporarily changes page protection to allow the write.
   * @returns The int at address, or this instance if writing.
   * @example
   * ```ts
   * const cs2 = new Process('cs2.exe');
   * const myInt = cs2.i16(0x12345678n);
   * cs2.i16(0x12345678n, 42);
   * ```
   */
  public i16(address: bigint): number;
  public i16(address: bigint, value: number, force?: boolean): this;
  public i16(address: bigint, value?: number, force?: boolean): number | this {
    const { hProcess } = this;

    if (value === undefined) {
      const bReadProcessMemory = !!ReadProcessMemory(hProcess, address, this.#Scratch2.ptr, 0x02n, null);

      if (!bReadProcessMemory) {
        throw new Win32Error('ReadProcessMemory', GetLastError());
      }

      return this.#Scratch2.i16[0x00]!;
    }

    this.#Scratch2.i16[0x00] = value;

    this.write(address, this.#Scratch2.i16, force);

    return this;
  }

  /**
   * Reads or writes an Int16Array.
   * @param address Address to access.
   * @param lengthOrValues Length to read or Int16Array to write.
   * @param force When writing, if true temporarily changes page protection to allow the write.
   * @returns Int16Array read or this instance if writing.
   * @example
   * ```ts
   * const cs2 = new Process('cs2.exe');
   * const myArray = cs2.i16Array(0x12345678n, 2);
   * cs2.i16Array(0x12345678n, new Int16Array([1,2]));
   * ```
   */
  public i16Array(address: bigint, length: number): Int16Array;
  public i16Array(address: bigint, values: Int16Array, force?: boolean): this;
  public i16Array(address: bigint, lengthOrValues: Int16Array | number, force?: boolean): Int16Array | this {
    if (typeof lengthOrValues === 'number') {
      const length = lengthOrValues;
      const scratch = new Int16Array(length);

      this.read(address, scratch);

      return scratch;
    }

    const values = lengthOrValues;

    this.write(address, values, force);

    return this;
  }

  /**
   * Reads or writes a 32-bit integer.
   * @param address Address to access.
   * @param value Optional value to write.
   * @param force When writing, if true temporarily changes page protection to allow the write.
   * @returns The int at address, or this instance if writing.
   * @example
   * ```ts
   * const cs2 = new Process('cs2.exe');
   * const myInt = cs2.i32(0x12345678n);
   * cs2.i32(0x12345678n, 42);
   * ```
   */
  public i32(address: bigint): number;
  public i32(address: bigint, value: number, force?: boolean): this;
  public i32(address: bigint, value?: number, force?: boolean): number | this {
    const { hProcess } = this;

    if (value === undefined) {
      const bReadProcessMemory = !!ReadProcessMemory(hProcess, address, this.#Scratch4.ptr, 0x04n, null);

      if (!bReadProcessMemory) {
        throw new Win32Error('ReadProcessMemory', GetLastError());
      }

      return this.#Scratch4.i32[0x00]!;
    }

    this.#Scratch4.i32[0x00] = value;

    this.write(address, this.#Scratch4.i32, force);

    return this;
  }

  /**
   * Reads or writes an Int32Array.
   * @param address Address to access.
   * @param lengthOrValues Length to read or Int32Array to write.
   * @param force When writing, if true temporarily changes page protection to allow the write.
   * @returns Int32Array read or this instance if writing.
   * @example
   * ```ts
   * const cs2 = new Process('cs2.exe');
   * const myArray = cs2.i32Array(0x12345678n, 2);
   * cs2.i32Array(0x12345678n, new Int32Array([1,2]));
   * ```
   */
  public i32Array(address: bigint, length: number): Int32Array;
  public i32Array(address: bigint, values: Int32Array, force?: boolean): this;
  public i32Array(address: bigint, lengthOrValues: Int32Array | number, force?: boolean): Int32Array | this {
    if (typeof lengthOrValues === 'number') {
      const length = lengthOrValues;
      const scratch = new Int32Array(length);

      this.read(address, scratch);

      return scratch;
    }

    const values = lengthOrValues;

    this.write(address, values, force);

    return this;
  }

  /**
   * Reads or writes a 64-bit integer.
   * @param address Address to access.
   * @param value Optional value to write.
   * @param force When writing, if true temporarily changes page protection to allow the write.
   * @returns The bigint at address, or this instance if writing.
   * @example
   * ```ts
   * const cs2 = new Process('cs2.exe');
   * const myBigInt = cs2.i64(0x12345678n);
   * cs2.i64(0x12345678n, 123n);
   * ```
   */
  public i64(address: bigint): bigint;
  public i64(address: bigint, value: bigint, force?: boolean): this;
  public i64(address: bigint, value?: bigint, force?: boolean): bigint | this {
    const { hProcess } = this;

    if (value === undefined) {
      const bReadProcessMemory = !!ReadProcessMemory(hProcess, address, this.#Scratch8.ptr, 0x08n, null);

      if (!bReadProcessMemory) {
        throw new Win32Error('ReadProcessMemory', GetLastError());
      }

      return read.i64(this.#Scratch8.ptr, 0x00);
    }

    this.#Scratch8.i64[0x00] = value;

    this.write(address, this.#Scratch8.i64, force);

    return this;
  }

  /**
   * Reads or writes a BigInt64Array.
   * @param address Address to access.
   * @param lengthOrValues Length to read or BigInt64Array to write.
   * @param force When writing, if true temporarily changes page protection to allow the write.
   * @returns BigInt64Array read or this instance if writing.
   * @example
   * ```ts
   * const cs2 = new Process('cs2.exe');
   * const myArray = cs2.i64Array(0x12345678n, 2);
   * cs2.i64Array(0x12345678n, new BigInt64Array([1n,2n]));
   * ```
   */
  public i64Array(address: bigint, length: number): BigInt64Array;
  public i64Array(address: bigint, values: BigInt64Array, force?: boolean): this;
  public i64Array(address: bigint, lengthOrValues: BigInt64Array | number, force?: boolean): BigInt64Array | this {
    if (typeof lengthOrValues === 'number') {
      const length = lengthOrValues;
      const scratch = new BigInt64Array(length);

      this.read(address, scratch);

      return scratch;
    }

    const values = lengthOrValues;

    this.write(address, values, force);

    return this;
  }

  /**
   * Reads or writes an 8-bit integer.
   * @param address Address to access.
   * @param value Optional value to write.
   * @param force When writing, if true temporarily changes page protection to allow the write.
   * @returns The int at address, or this instance if writing.
   * @example
   * ```ts
   * const cs2 = new Process('cs2.exe');
   * const myInt = cs2.i8(0x12345678n);
   * cs2.i8(0x12345678n, 7);
   * ```
   */
  public i8(address: bigint): number;
  public i8(address: bigint, value: number, force?: boolean): this;
  public i8(address: bigint, value?: number, force?: boolean): number | this {
    const { hProcess } = this;

    if (value === undefined) {
      const bReadProcessMemory = !!ReadProcessMemory(hProcess, address, this.#Scratch1.ptr, 0x01n, null);

      if (!bReadProcessMemory) {
        throw new Win32Error('ReadProcessMemory', GetLastError());
      }

      return this.#Scratch1.i8[0x00]!;
    }

    this.#Scratch1.i8[0x00] = value;

    this.write(address, this.#Scratch1.i8, force);

    return this;
  }

  /**
   * Reads or writes an Int8Array.
   * @param address Address to access.
   * @param lengthOrValues Length to read or Int8Array to write.
   * @param force When writing, if true temporarily changes page protection to allow the write.
   * @returns Int8Array read or this instance if writing.
   * @example
   * ```ts
   * const cs2 = new Process('cs2.exe');
   * const myArray = cs2.i8Array(0x12345678n, 2);
   * cs2.i8Array(0x12345678n, new Int8Array([1,2]));
   * ```
   */
  public i8Array(address: bigint, length: number): Int8Array;
  public i8Array(address: bigint, values: Int8Array, force?: boolean): this;
  public i8Array(address: bigint, lengthOrValues: Int8Array | number, force?: boolean): Int8Array | this {
    if (typeof lengthOrValues === 'number') {
      const length = lengthOrValues;
      const scratch = new Int8Array(length);

      this.read(address, scratch);

      return scratch;
    }

    const values = lengthOrValues;

    this.write(address, values, force);

    return this;
  }

  /**
   * Reads or writes a 3x3 matrix (Float32Array of length 9).
   * @param address Address to access.
   * @param values Optional Float32Array to write.
   * @param force When writing, if true temporarily changes page protection to allow the write.
   * @returns The matrix at address, or this instance if writing.
   * @example
   * ```ts
   * const cs2 = new Process('cs2.exe');
   * const myMatrix = cs2.matrix3x3(0x12345678n);
   * cs2.matrix3x3(0x12345678n, new Float32Array(9));
   * ```
   */
  public matrix3x3(address: bigint): Float32Array;
  public matrix3x3(address: bigint, values: Float32Array, force?: boolean): this;
  public matrix3x3(address: bigint, values?: Float32Array, force?: boolean): Float32Array | this {
    if (values === undefined) {
      const scratch = new Float32Array(0x09);

      this.read(address, scratch);

      return scratch;
    }

    if (values.length !== 0x09) {
      throw new RangeError('values.length must be 9.');
    }

    this.write(address, values, force);

    return this;
  }

  /**
   * Reads or writes a 3x4 matrix (Float32Array of length 12).
   * @param address Address to access.
   * @param values Optional Float32Array to write.
   * @param force When writing, if true temporarily changes page protection to allow the write.
   * @returns The matrix at address, or this instance if writing.
   * @example
   * ```ts
   * const cs2 = new Process('cs2.exe');
   * const myMatrix = cs2.matrix3x4(0x12345678n);
   * cs2.matrix3x4(0x12345678n, new Float32Array(12));
   * ```
   */
  public matrix3x4(address: bigint): Float32Array;
  public matrix3x4(address: bigint, values: Float32Array, force?: boolean): this;
  public matrix3x4(address: bigint, values?: Float32Array, force?: boolean): Float32Array | this {
    if (values === undefined) {
      const scratch = new Float32Array(0x0c);

      this.read(address, scratch);

      return scratch;
    }

    if (values.length !== 0x0c) {
      throw new RangeError('values.length must be 12.');
    }

    this.write(address, values, force);

    return this;
  }

  /**
   * Reads or writes a 4x4 matrix (Float32Array of length 16).
   * @param address Address to access.
   * @param values Optional Float32Array to write.
   * @param force When writing, if true temporarily changes page protection to allow the write.
   * @returns The matrix at address, or this instance if writing.
   * @example
   * ```ts
   * const cs2 = new Process('cs2.exe');
   * const myMatrix = cs2.matrix4x4(0x12345678n);
   * cs2.matrix4x4(0x12345678n, new Float32Array(16));
   * ```
   */
  public matrix4x4(address: bigint): Float32Array;
  public matrix4x4(address: bigint, values: Float32Array, force?: boolean): this;
  public matrix4x4(address: bigint, values?: Float32Array, force?: boolean): Float32Array | this {
    if (values === undefined) {
      const scratch = new Float32Array(0x10);

      this.read(address, scratch);

      return scratch;
    }

    if (values.length !== 0x10) {
      throw new RangeError('values.length must be 16.');
    }

    this.write(address, values, force);

    return this;
  }

  /**
   * Reads or writes a Point (object with x, y).
   * @param address Address to access.
   * @param value Optional Point to write.
   * @param force When writing, if true temporarily changes page protection to allow the write.
   * @returns The point at address, or this instance if writing.
   * @example
   * ```ts
   * const cs2 = new Process('cs2.exe');
   * const myPoint = cs2.point(0x12345678n);
   * cs2.point(0x12345678n, { x: 1, y: 2 });
   * ```
   */
  public point(address: bigint): Point;
  public point(address: bigint, value: Point, force?: boolean): this;
  public point(address: bigint, value?: Point, force?: boolean): Point | this {
    const { hProcess } = this;

    if (value === undefined) {
      const bReadProcessMemory = !!ReadProcessMemory(hProcess, address, this.#Scratch8.ptr, 0x08n, null);

      if (!bReadProcessMemory) {
        throw new Win32Error('ReadProcessMemory', GetLastError());
      }

      const x = this.#Scratch8.f32[0x00]!,
        y = this.#Scratch8.f32[0x01]!;

      return { x, y };
    }

    this.#Scratch8.f32[0x00] = value.x;
    this.#Scratch8.f32[0x01] = value.y;

    this.write(address, this.#Scratch8.f32, force);

    return this;
  }

  /**
   * Reads or writes an array of Points.
   * @param address Address to access.
   * @param lengthOrValues Length to read or array to write.
   * @param force When writing, if true temporarily changes page protection to allow the write.
   * @returns Array of points read or this instance if writing.
   * @example
   * ```ts
   * const cs2 = new Process('cs2.exe');
   * const myPoints = cs2.pointArray(0x12345678n, 2);
   * cs2.pointArray(0x12345678n, [{ x: 1, y: 2 }, { x: 3, y: 4 }]);
   * ```
   */
  public pointArray(address: bigint, length: number): Point[];
  public pointArray(address: bigint, value: Point[], force?: boolean): this;
  public pointArray(address: bigint, lengthOrValues: number | Point[], force?: boolean): Point[] | this {
    if (typeof lengthOrValues === 'number') {
      const length = lengthOrValues;
      const scratch = new Float32Array(length * 2);

      this.read(address, scratch);

      const result = new Array<Vector2>(length);

      for (let i = 0, j = 0; i < length; i++, j += 0x02) {
        const x = scratch[j]!,
          y = scratch[j + 0x01]!;

        result[i] = { x, y };
      }

      return result;
    }

    const values = lengthOrValues;
    const scratch = new Float32Array(values.length * 0x02);

    for (let i = 0, j = 0; i < values.length; i++, j += 0x02) {
      const vector2 = values[i]!;

      scratch[j] = vector2.x;
      scratch[j + 0x01] = vector2.y;
    }

    this.write(address, scratch, force);

    return this;
  }

  /**
   * Reads or writes a raw Point (two Float32 values) as a Float32Array.
   * @param address Address to access.
   * @param values Optional Float32Array of length 2 to write.
   * @param force When writing, if true temporarily changes page protection to allow the write.
   * @returns Float32Array read or this instance if writing.
   * @example
   * ```ts
   * const cs2 = new Process('cs2.exe');
   * const myPoint = cs2.pointRaw(0x12345678n);
   * cs2.pointRaw(0x12345678n, new Float32Array([1, 2]));
   * ```
   */
  public pointRaw(address: bigint): Float32Array;
  public pointRaw(address: bigint, values: Float32Array, force?: boolean): this;
  public pointRaw(address: bigint, values?: Float32Array, force?: boolean): Float32Array | this {
    if (values === undefined) {
      return this.f32Array(address, 0x02);
    }

    if (values.length !== 0x02) {
      throw new RangeError('values.length must be 2.');
    }

    this.write(address, values, force);

    return this;
  }

  /**
   * Reads or writes a QAngle (object with pitch, yaw, roll).
   * @param address Address to access.
   * @param value Optional QAngle to write.
   * @param force When writing, if true temporarily changes page protection to allow the write.
   * @returns The QAngle at address, or this instance if writing.
   * @example
   * ```ts
   * const cs2 = new Process('cs2.exe');
   * const myQAngle = cs2.qAngle(0x12345678n);
   * cs2.qAngle(0x12345678n, { pitch: 1, yaw: 2, roll: 3 });
   * ```
   */
  public qAngle(address: bigint): QAngle;
  public qAngle(address: bigint, value: QAngle, force?: boolean): this;
  public qAngle(address: bigint, value?: QAngle, force?: boolean): QAngle | this {
    const { hProcess } = this;

    if (value === undefined) {
      const bReadProcessMemory = !!ReadProcessMemory(hProcess, address, this.#Scratch12.ptr, 0x0cn, null);

      if (!bReadProcessMemory) {
        throw new Win32Error('ReadProcessMemory', GetLastError());
      }

      const pitch = this.#Scratch12.f32[0x00]!,
        roll = this.#Scratch12.f32[0x02]!,
        yaw = this.#Scratch12.f32[0x01]!;

      return { pitch, roll, yaw };
    }

    this.#Scratch12.f32[0x00] = value.pitch;
    this.#Scratch12.f32[0x02] = value.roll;
    this.#Scratch12.f32[0x01] = value.yaw;

    this.write(address, this.#Scratch12.f32, force);

    return this;
  }

  /**
   * Reads or writes an array of QAngles.
   * @param address Address to access.
   * @param lengthOrValues Length to read or array to write.
   * @param force When writing, if true temporarily changes page protection to allow the write.
   * @returns Array of QAngles read or this instance if writing.
   * @example
   * ```ts
   * const cs2 = new Process('cs2.exe');
   * const myQAngles = cs2.qAngleArray(0x12345678n, 2);
   * cs2.qAngleArray(0x12345678n, [{ pitch: 1, yaw: 2, roll: 3 }]);
   * ```
   */
  public qAngleArray(address: bigint, length: number): QAngle[];
  public qAngleArray(address: bigint, values: QAngle[], force?: boolean): this;
  public qAngleArray(address: bigint, lengthOrValues: QAngle[] | number, force?: boolean): QAngle[] | this {
    if (typeof lengthOrValues === 'number') {
      const length = lengthOrValues;
      const scratch = new Float32Array(length * 0x03);

      this.read(address, scratch);

      const result = new Array<QAngle>(length);

      for (let i = 0, j = 0; i < length; i++, j += 0x03) {
        const pitch = scratch[j]!,
          yaw = scratch[j + 0x01]!,
          roll = scratch[j + 0x02]!;

        result[i] = { pitch, yaw, roll };
      }

      return result;
    }

    const values = lengthOrValues;
    const scratch = new Float32Array(values.length * 0x03);

    for (let i = 0, j = 0; i < values.length; i++, j += 0x03) {
      const qAngle = values[i]!;

      scratch[j] = qAngle.pitch;
      scratch[j + 0x02] = qAngle.roll;
      scratch[j + 0x01] = qAngle.yaw;
    }

    this.write(address, scratch, force);

    return this;
  }

  /**
   * Reads or writes a raw QAngle as a Float32Array.
   * @param address Address to access.
   * @param values Optional Float32Array to write.
   * @param force When writing, if true temporarily changes page protection to allow the write.
   * @returns Float32Array read or this instance if writing.
   * @example
   * ```ts
   * const cs2 = new Process('cs2.exe');
   * const raw = cs2.qAngleRaw(0x12345678n);
   * cs2.qAngleRaw(0x12345678n, new Float32Array([1,2,3]));
   * ```
   */
  public qAngleRaw(address: bigint): Float32Array;
  public qAngleRaw(address: bigint, values: Float32Array, force?: boolean): this;
  public qAngleRaw(address: bigint, values?: Float32Array, force?: boolean): Float32Array | this {
    if (values === undefined) {
      return this.f32Array(address, 0x03);
    }

    if (values.length !== 0x03) {
      throw new RangeError('values.length must be 3.');
    }

    this.write(address, values, force);

    return this;
  }

  /**
   * Reads or writes a Quaternion (object with w, x, y, z).
   * @param address Address to access.
   * @param value Optional Quaternion to write.
   * @param force When writing, if true temporarily changes page protection to allow the write.
   * @returns The Quaternion at address, or this instance if writing.
   * @example
   * ```ts
   * const cs2 = new Process('cs2.exe');
   * const myQuaternion = cs2.quaternion(0x12345678n);
   * cs2.quaternion(0x12345678n, { w: 1, x: 0, y: 0, z: 0 });
   * ```
   */
  public quaternion(address: bigint): Quaternion;
  public quaternion(address: bigint, value: Quaternion, force?: boolean): this;
  public quaternion(address: bigint, value?: Quaternion, force?: boolean): Quaternion | this {
    const { hProcess } = this;

    if (value === undefined) {
      const bReadProcessMemory = !!ReadProcessMemory(hProcess, address, this.#Scratch16.ptr, 0x10n, null);

      if (!bReadProcessMemory) {
        throw new Win32Error('ReadProcessMemory', GetLastError());
      }

      const w = this.#Scratch16.f32[0x03]!,
        x = this.#Scratch16.f32[0x00]!,
        y = this.#Scratch16.f32[0x01]!,
        z = this.#Scratch16.f32[0x02]!;

      return { w, x, y, z };
    }

    this.#Scratch16.f32[0x03] = value.w;
    this.#Scratch16.f32[0x00] = value.x;
    this.#Scratch16.f32[0x01] = value.y;
    this.#Scratch16.f32[0x02] = value.z;

    this.write(address, this.#Scratch16.f32, force);

    return this;
  }

  /**
   * Reads or writes an array of Quaternions.
   * @param address Address to access.
   * @param lengthOrValues Length to read or array to write.
   * @param force When writing, if true temporarily changes page protection to allow the write.
   * @returns Array of Quaternions read or this instance if writing.
   * @example
   * ```ts
   * const cs2 = new Process('cs2.exe');
   * const myQuaternions = cs2.quaternionArray(0x12345678n, 2);
   * cs2.quaternionArray(0x12345678n, [{ w: 1, x: 0, y: 0, z: 0 }]);
   * ```
   */
  public quaternionArray(address: bigint, length: number): Quaternion[];
  public quaternionArray(address: bigint, values: Quaternion[], force?: boolean): this;
  public quaternionArray(address: bigint, lengthOrValues: Quaternion[] | number, force?: boolean): Quaternion[] | this {
    if (typeof lengthOrValues === 'number') {
      const length = lengthOrValues;
      const scratch = new Float32Array(length * 0x04); // 4 * f32 per Quaternion

      this.read(address, scratch);

      const result = new Array<Quaternion>(length);

      for (let i = 0, j = 0; i < length; i++, j += 0x04) {
        const w = scratch[j + 0x03]!;
        const x = scratch[j]!;
        const y = scratch[j + 0x01]!;
        const z = scratch[j + 0x02]!;

        result[i] = { w, x, y, z };
      }

      return result;
    }

    const values = lengthOrValues;
    const scratch = new Float32Array(values.length * 0x04);

    for (let i = 0, j = 0; i < values.length; i++, j += 0x04) {
      const quaternion = values[i]!;

      scratch[j + 0x03] = quaternion.w;
      scratch[j] = quaternion.x;
      scratch[j + 0x01] = quaternion.y;
      scratch[j + 0x02] = quaternion.z;
    }

    this.write(address, scratch, force);

    return this;
  }

  /**
   * Reads or writes a raw Quaternion as a Float32Array.
   * @param address Address to access.
   * @param values Optional Float32Array to write.
   * @param force When writing, if true temporarily changes page protection to allow the write.
   * @returns Float32Array read or this instance if writing.
   * @example
   * ```ts
   * const cs2 = new Process('cs2.exe');
   * const raw = cs2.quaternionRaw(0x12345678n);
   * cs2.quaternionRaw(0x12345678n, new Float32Array([1,0,0,0]));
   * ```
   */
  public quaternionRaw(address: bigint): Float32Array;
  public quaternionRaw(address: bigint, values: Float32Array, force?: boolean): this;
  public quaternionRaw(address: bigint, values?: Float32Array, force?: boolean): Float32Array | this {
    if (values === undefined) {
      return this.f32Array(address, 0x04);
    }

    if (values.length !== 0x04) {
      throw new RangeError('values.length must be 4.');
    }

    this.write(address, values, force);

    return this;
  }

  /**
   * Reads or writes an RGB color (object with r, g, b).
   * @param address Address to access.
   * @param value Optional RGB to write.
   * @param force When writing, if true temporarily changes page protection to allow the write.
   * @returns The RGB at address, or this instance if writing.
   * @example
   * ```ts
   * const cs2 = new Process('cs2.exe');
   * const myRGB = cs2.rgb(0x12345678n);
   * cs2.rgb(0x12345678n, { r: 255, g: 0, b: 0 });
   * ```
   */
  public rgb(address: bigint): RGB;
  public rgb(address: bigint, value: RGB, force?: boolean): this;
  public rgb(address: bigint, value?: RGB, force?: boolean): RGB | this {
    const { hProcess } = this;

    if (value === undefined) {
      const bReadProcessMemory = !!ReadProcessMemory(hProcess, address, this.#Scratch3.ptr, 0x03n, null);

      if (!bReadProcessMemory) {
        throw new Win32Error('ReadProcessMemory', GetLastError());
      }

      const r = this.#Scratch3.u8[0x00]!,
        g = this.#Scratch3.u8[0x01]!,
        b = this.#Scratch3.u8[0x02]!;

      return { r, g, b };
    }

    this.#Scratch3.u8[0x00] = value.r;
    this.#Scratch3.u8[0x01] = value.g;
    this.#Scratch3.u8[0x02] = value.b;

    this.write(address, this.#Scratch3.u8, force);

    return this;
  }

  /**
   * Reads or writes a raw RGB value as a Uint8Array.
   * @param address Address to access.
   * @param values Optional buffer to write.
   * @param force When writing, if true temporarily changes page protection to allow the write.
   * @returns Uint8Array read or this instance if writing.
   * @example
   * ```ts
   * const cs2 = new Process('cs2.exe');
   * const raw = cs2.rgbRaw(0x12345678n);
   * cs2.rgbRaw(0x12345678n, new Uint8Array([255,0,0]));
   * ```
   */
  public rgbRaw(address: bigint): Uint8Array;
  public rgbRaw(address: bigint, values: Buffer | Uint8Array | Uint8ClampedArray, force?: boolean): this;
  public rgbRaw(address: bigint, values?: Buffer | Uint8Array | Uint8ClampedArray, force?: boolean): Uint8Array | this {
    if (values === undefined) {
      return this.u8Array(address, 0x03);
    }

    if (values.length !== 0x03) {
      throw new RangeError('values.length must be 3.');
    }

    this.write(address, values, force);

    return this;
  }

  /**
   * Reads or writes an RGBA color (object with r, g, b, a).
   * @param address Address to access.
   * @param value Optional RGBA to write.
   * @param force When writing, if true temporarily changes page protection to allow the write.
   * @returns The RGBA at address, or this instance if writing.
   * @example
   * ```ts
   * const cs2 = new Process('cs2.exe');
   * const myRGBA = cs2.rgba(0x12345678n);
   * cs2.rgba(0x12345678n, { r: 255, g: 0, b: 0, a: 255 });
   * ```
   */
  public rgba(address: bigint): RGBA;
  public rgba(address: bigint, value: RGBA, force?: boolean): this;
  public rgba(address: bigint, value?: RGBA, force?: boolean): RGBA | this {
    const { hProcess } = this;

    if (value === undefined) {
      const bReadProcessMemory = !!ReadProcessMemory(hProcess, address, this.#Scratch4.ptr, 0x04n, null);

      if (!bReadProcessMemory) {
        throw new Win32Error('ReadProcessMemory', GetLastError());
      }

      const r = this.#Scratch4.u8[0x00]!,
        g = this.#Scratch4.u8[0x01]!,
        b = this.#Scratch4.u8[0x02]!,
        a = this.#Scratch4.u8[0x03]!;

      return { r, g, b, a };
    }

    this.#Scratch4.u8[0x00] = value.r;
    this.#Scratch4.u8[0x01] = value.g;
    this.#Scratch4.u8[0x02] = value.b;
    this.#Scratch4.u8[0x03] = value.a;

    this.write(address, this.#Scratch4.u8, force);

    return this;
  }

  /**
   * Reads or writes a raw RGBA value as a Uint8Array.
   * @param address Address to access.
   * @param values Optional buffer to write.
   * @param force When writing, if true temporarily changes page protection to allow the write.
   * @returns Uint8Array read or this instance if writing.
   * @example
   * ```ts
   * const cs2 = new Process('cs2.exe');
   * const raw = cs2.rgbaRaw(0x12345678n);
   * cs2.rgbaRaw(0x12345678n, new Uint8Array([255,0,0,255]));
   * ```
   */
  public rgbaRaw(address: bigint): Uint8Array;
  public rgbaRaw(address: bigint, values: Buffer | Uint8Array | Uint8ClampedArray, force?: boolean): this;
  public rgbaRaw(address: bigint, values?: Buffer | Uint8Array | Uint8ClampedArray, force?: boolean): Uint8Array | this {
    if (values === undefined) {
      return this.u8Array(address, 0x04);
    }

    if (values.length !== 0x04) {
      throw new RangeError('values.length must be 4.');
    }

    this.write(address, values, force);

    return this;
  }

  /**
   * Reads or writes a UTF-8 string.
   * @param address Address to access.
   * @param lengthOrValue Length to read or string to write.
   * @param force When writing, if true temporarily changes page protection to allow the write.
   * @returns The string at address, or this instance if writing.
   * @notice When writing, remember to null-terminate your string (e.g., 'hello\0').
   * @example
   * ```ts
   * const cs2 = new Process('cs2.exe');
   * const myString = cs2.string(0x12345678n, 16);
   * cs2.string(0x12345678n, 'hello\0');
   * ```
   */
  public string(address: bigint, length: number): string;
  public string(address: bigint, value: string, force?: boolean): this;
  public string(address: bigint, lengthOrValue: number | string, force?: boolean): string | this {
    if (typeof lengthOrValue === 'number') {
      const scratch = new Uint8Array(lengthOrValue);

      this.read(address, scratch);

      const indexOf = scratch.indexOf(0x00);

      return Process.#TextDecoderUTF8.decode(
        scratch.subarray(0, indexOf !== -1 ? indexOf : lengthOrValue), //
      );
    }

    const scratch = Process.#TextEncoderUTF8.encode(lengthOrValue);

    this.write(address, scratch, force);

    return this;
  }

  /**
   * Reads or writes a TArray (Data at 0x00, Count at 0x08, Max at 0x0c) as a UTF-8 string.
   * @param address Address of the TArray structure.
   * @param value Optional string to write.
   * @param force When writing, if true temporarily changes page protection to allow the write.
   * @returns The string, or this instance if writing.
   * @example
   * ```ts
   * const rl = new Process('RocketLeague.exe');
   * const myString = rl.tArrayChar(0x12345678n);
   * rl.tArrayChar(0x12345678n, 'hello');
   * ```
   */
  public tArrayChar(address: bigint): string;
  public tArrayChar(address: bigint, value: string, force?: boolean): this;
  public tArrayChar(address: bigint, value?: string, force?: boolean): string | this {
    let count: number;
    let dataPtr: bigint;

    if (this.is32Bit) {
      // x86 TArray<T>: { Data ptr@0x00 (4B); int ArrayNum@0x04; int ArrayMax@0x08 } (12 bytes).
      this.read(address, this.#Scratch12.u8);
      count = this.#Scratch12.u32[0x01]!;
      dataPtr = BigInt(this.#Scratch12.u32[0x00]!);
    } else {
      this.read(address, this.#Scratch16.u8);
      count = this.#Scratch16.u32[0x02]!;
      dataPtr = read.u64(this.#Scratch16.ptr, 0x00);
    }

    if (value === undefined) {
      if (count === 0x00) {
        return '';
      }

      const scratch = Buffer.allocUnsafe(count - 0x01);

      this.read(dataPtr, scratch);

      return scratch.toString('utf8');
    }

    const bytes = Buffer.from(value, 'utf8');
    const scratch = Buffer.allocUnsafe(bytes.length + 0x01);

    bytes.copy(scratch);
    scratch[bytes.length] = 0x00;

    this.u32(address + (this.is32Bit ? 0x04n : 0x08n), scratch.length, force);

    this.write(dataPtr, scratch, force);

    return this;
  }

  /**
   * Reads or writes a TArray (Data at 0x00, Count at 0x08, Max at 0x0c) as a Float32Array.
   * @param address Address of the TArray structure.
   * @param values Optional Float32Array to write.
   * @param force When writing, if true temporarily changes page protection to allow the write.
   * @returns A Float32Array containing the elements, or this instance if writing.
   * @example
   * ```ts
   * const rl = new Process('RocketLeague.exe');
   * const myArray = rl.tArrayF32(0x12345678n);
   * rl.tArrayF32(0x12345678n, new Float32Array([1.0, 2.0, 3.0]));
   * ```
   */
  public tArrayF32(address: bigint): Float32Array;
  public tArrayF32(address: bigint, values: Float32Array, force?: boolean): this;
  public tArrayF32(address: bigint, values?: Float32Array, force?: boolean): Float32Array | this {
    let count: number;
    let dataPtr: bigint;

    if (this.is32Bit) {
      // x86 TArray<T>: { Data ptr@0x00 (4B); int ArrayNum@0x04; int ArrayMax@0x08 } (12 bytes).
      this.read(address, this.#Scratch12.u8);
      count = this.#Scratch12.u32[0x01]!;
      dataPtr = BigInt(this.#Scratch12.u32[0x00]!);
    } else {
      this.read(address, this.#Scratch16.u8);
      count = this.#Scratch16.u32[0x02]!;
      dataPtr = read.u64(this.#Scratch16.ptr, 0x00);
    }

    if (values === undefined) {
      const scratch = new Float32Array(count);

      if (count === 0) {
        return scratch;
      }

      this.read(dataPtr, scratch);

      return scratch;
    }

    this.u32(address + (this.is32Bit ? 0x04n : 0x08n), values.length, force);

    this.write(dataPtr, values, force);

    return this;
  }

  /**
   * Reads or writes a TArray (Data at 0x00, Count at 0x08, Max at 0x0c) as a Float64Array.
   * @param address Address of the TArray structure.
   * @param values Optional Float64Array to write.
   * @param force When writing, if true temporarily changes page protection to allow the write.
   * @returns A Float64Array containing the elements, or this instance if writing.
   * @example
   * ```ts
   * const rl = new Process('RocketLeague.exe');
   * const myArray = rl.tArrayF64(0x12345678n);
   * rl.tArrayF64(0x12345678n, new Float64Array([1.0, 2.0, 3.0]));
   * ```
   */
  public tArrayF64(address: bigint): Float64Array;
  public tArrayF64(address: bigint, values: Float64Array, force?: boolean): this;
  public tArrayF64(address: bigint, values?: Float64Array, force?: boolean): Float64Array | this {
    let count: number;
    let dataPtr: bigint;

    if (this.is32Bit) {
      // x86 TArray<T>: { Data ptr@0x00 (4B); int ArrayNum@0x04; int ArrayMax@0x08 } (12 bytes).
      this.read(address, this.#Scratch12.u8);
      count = this.#Scratch12.u32[0x01]!;
      dataPtr = BigInt(this.#Scratch12.u32[0x00]!);
    } else {
      this.read(address, this.#Scratch16.u8);
      count = this.#Scratch16.u32[0x02]!;
      dataPtr = read.u64(this.#Scratch16.ptr, 0x00);
    }

    if (values === undefined) {
      const scratch = new Float64Array(count);

      if (count === 0) {
        return scratch;
      }

      this.read(dataPtr, scratch);

      return scratch;
    }

    this.u32(address + (this.is32Bit ? 0x04n : 0x08n), values.length, force);

    this.write(dataPtr, values, force);

    return this;
  }

  /**
   * Reads or writes a TArray (Data at 0x00, Count at 0x08, Max at 0x0c) as an Int16Array.
   * @param address Address of the TArray structure.
   * @param values Optional Int16Array to write.
   * @param force When writing, if true temporarily changes page protection to allow the write.
   * @returns An Int16Array containing the elements, or this instance if writing.
   * @example
   * ```ts
   * const rl = new Process('RocketLeague.exe');
   * const myArray = rl.tArrayI16(0x12345678n);
   * rl.tArrayI16(0x12345678n, new Int16Array([1, 2, 3]));
   * ```
   */
  public tArrayI16(address: bigint): Int16Array;
  public tArrayI16(address: bigint, values: Int16Array, force?: boolean): this;
  public tArrayI16(address: bigint, values?: Int16Array, force?: boolean): Int16Array | this {
    let count: number;
    let dataPtr: bigint;

    if (this.is32Bit) {
      // x86 TArray<T>: { Data ptr@0x00 (4B); int ArrayNum@0x04; int ArrayMax@0x08 } (12 bytes).
      this.read(address, this.#Scratch12.u8);
      count = this.#Scratch12.u32[0x01]!;
      dataPtr = BigInt(this.#Scratch12.u32[0x00]!);
    } else {
      this.read(address, this.#Scratch16.u8);
      count = this.#Scratch16.u32[0x02]!;
      dataPtr = read.u64(this.#Scratch16.ptr, 0x00);
    }

    if (values === undefined) {
      const scratch = new Int16Array(count);

      if (count === 0) {
        return scratch;
      }

      this.read(dataPtr, scratch);

      return scratch;
    }

    this.u32(address + (this.is32Bit ? 0x04n : 0x08n), values.length, force);

    this.write(dataPtr, values, force);

    return this;
  }

  /**
   * Reads or writes a TArray (Data at 0x00, Count at 0x08, Max at 0x0c) as an Int32Array.
   * @param address Address of the TArray structure.
   * @param values Optional Int32Array to write.
   * @param force When writing, if true temporarily changes page protection to allow the write.
   * @returns An Int32Array containing the elements, or this instance if writing.
   * @example
   * ```ts
   * const rl = new Process('RocketLeague.exe');
   * const myArray = rl.tArrayI32(0x12345678n);
   * rl.tArrayI32(0x12345678n, new Int32Array([1, 2, 3]));
   * ```
   */
  public tArrayI32(address: bigint): Int32Array;
  public tArrayI32(address: bigint, values: Int32Array, force?: boolean): this;
  public tArrayI32(address: bigint, values?: Int32Array, force?: boolean): Int32Array | this {
    let count: number;
    let dataPtr: bigint;

    if (this.is32Bit) {
      // x86 TArray<T>: { Data ptr@0x00 (4B); int ArrayNum@0x04; int ArrayMax@0x08 } (12 bytes).
      this.read(address, this.#Scratch12.u8);
      count = this.#Scratch12.u32[0x01]!;
      dataPtr = BigInt(this.#Scratch12.u32[0x00]!);
    } else {
      this.read(address, this.#Scratch16.u8);
      count = this.#Scratch16.u32[0x02]!;
      dataPtr = read.u64(this.#Scratch16.ptr, 0x00);
    }

    if (values === undefined) {
      const scratch = new Int32Array(count);

      if (count === 0) {
        return scratch;
      }

      this.read(dataPtr, scratch);

      return scratch;
    }

    this.u32(address + (this.is32Bit ? 0x04n : 0x08n), values.length, force);

    this.write(dataPtr, values, force);

    return this;
  }

  /**
   * Reads or writes a TArray (Data at 0x00, Count at 0x08, Max at 0x0c) as a BigInt64Array.
   * @param address Address of the TArray structure.
   * @param values Optional BigInt64Array to write.
   * @param force When writing, if true temporarily changes page protection to allow the write.
   * @returns A BigInt64Array containing the elements, or this instance if writing.
   * @example
   * ```ts
   * const rl = new Process('RocketLeague.exe');
   * const myArray = rl.tArrayI64(0x12345678n);
   * rl.tArrayI64(0x12345678n, new BigInt64Array([1n, 2n, 3n]));
   * ```
   */
  public tArrayI64(address: bigint): BigInt64Array;
  public tArrayI64(address: bigint, values: BigInt64Array, force?: boolean): this;
  public tArrayI64(address: bigint, values?: BigInt64Array, force?: boolean): BigInt64Array | this {
    let count: number;
    let dataPtr: bigint;

    if (this.is32Bit) {
      // x86 TArray<T>: { Data ptr@0x00 (4B); int ArrayNum@0x04; int ArrayMax@0x08 } (12 bytes).
      this.read(address, this.#Scratch12.u8);
      count = this.#Scratch12.u32[0x01]!;
      dataPtr = BigInt(this.#Scratch12.u32[0x00]!);
    } else {
      this.read(address, this.#Scratch16.u8);
      count = this.#Scratch16.u32[0x02]!;
      dataPtr = read.u64(this.#Scratch16.ptr, 0x00);
    }

    if (values === undefined) {
      const scratch = new BigInt64Array(count);

      if (count === 0) {
        return scratch;
      }

      this.read(dataPtr, scratch);

      return scratch;
    }

    this.u32(address + (this.is32Bit ? 0x04n : 0x08n), values.length, force);

    this.write(dataPtr, values, force);

    return this;
  }

  /**
   * Reads or writes a TArray (Data at 0x00, Count at 0x08, Max at 0x0c) as an Int8Array.
   * @param address Address of the TArray structure.
   * @param values Optional Int8Array to write.
   * @param force When writing, if true temporarily changes page protection to allow the write.
   * @returns An Int8Array containing the elements, or this instance if writing.
   * @example
   * ```ts
   * const rl = new Process('RocketLeague.exe');
   * const myArray = rl.tArrayI8(0x12345678n);
   * rl.tArrayI8(0x12345678n, new Int8Array([1, 2, 3]));
   * ```
   */
  public tArrayI8(address: bigint): Int8Array;
  public tArrayI8(address: bigint, values: Int8Array, force?: boolean): this;
  public tArrayI8(address: bigint, values?: Int8Array, force?: boolean): Int8Array | this {
    let count: number;
    let dataPtr: bigint;

    if (this.is32Bit) {
      // x86 TArray<T>: { Data ptr@0x00 (4B); int ArrayNum@0x04; int ArrayMax@0x08 } (12 bytes).
      this.read(address, this.#Scratch12.u8);
      count = this.#Scratch12.u32[0x01]!;
      dataPtr = BigInt(this.#Scratch12.u32[0x00]!);
    } else {
      this.read(address, this.#Scratch16.u8);
      count = this.#Scratch16.u32[0x02]!;
      dataPtr = read.u64(this.#Scratch16.ptr, 0x00);
    }

    if (values === undefined) {
      const scratch = new Int8Array(count);

      if (count === 0) {
        return scratch;
      }

      this.read(dataPtr, scratch);

      return scratch;
    }

    this.u32(address + (this.is32Bit ? 0x04n : 0x08n), values.length, force);

    this.write(dataPtr, values, force);

    return this;
  }

  /**
   * Reads or writes a TArray (Data at 0x00, Count at 0x08, Max at 0x0c) as an array of raw buffers.
   * Useful for reading/writing arrays of structs or custom-sized elements.
   * @param address Address of the TArray structure.
   * @param dataSize Size in bytes of each element.
   * @param values Optional array of Buffers to write.
   * @param force When writing, if true temporarily changes page protection to allow the write.
   * @returns An array of Buffers, one per element, or this instance if writing.
   * @example
   * ```ts
   * const rl = new Process('RocketLeague.exe');
   * const structs = rl.tArrayRaw(0x12345678n, 0x18); // Array of 0x18-byte buffers
   * rl.tArrayRaw(0x12345678n, [buffer1, buffer2]);
   * ```
   */
  public tArrayRaw(address: bigint, dataSize: number): Buffer[];
  public tArrayRaw(address: bigint, values: Buffer[], force?: boolean): this;
  public tArrayRaw(address: bigint, dataSizeOrValues: number | Buffer[], force?: boolean): Buffer[] | this {
    let count: number;
    let dataPtr: bigint;

    if (this.is32Bit) {
      // x86 TArray<T>: { Data ptr@0x00 (4B); int ArrayNum@0x04; int ArrayMax@0x08 } (12 bytes).
      this.read(address, this.#Scratch12.u8);
      count = this.#Scratch12.u32[0x01]!;
      dataPtr = BigInt(this.#Scratch12.u32[0x00]!);
    } else {
      this.read(address, this.#Scratch16.u8);
      count = this.#Scratch16.u32[0x02]!;
      dataPtr = read.u64(this.#Scratch16.ptr, 0x00);
    }

    if (typeof dataSizeOrValues === 'number') {
      const dataSize = dataSizeOrValues;

      if (count === 0) {
        return [];
      }

      const scratch = Buffer.allocUnsafe(count * dataSize);

      this.read(dataPtr, scratch);

      const result: Buffer[] = new Array(count);

      for (let i = 0; i < count; i++) {
        result[i] = scratch.subarray(i * dataSize, (i + 1) * dataSize);
      }

      return result;
    }

    const values = dataSizeOrValues;

    if (values.length === 0) {
      this.u32(address + (this.is32Bit ? 0x04n : 0x08n), 0, force);
      return this;
    }

    const dataSize = values[0]!.length;
    const scratch = Buffer.allocUnsafe(values.length * dataSize);

    for (let i = 0; i < values.length; i++) {
      values[i]!.copy(scratch, i * dataSize);
    }

    this.u32(address + (this.is32Bit ? 0x04n : 0x08n), values.length, force);

    this.write(dataPtr, scratch, force);

    return this;
  }

  /**
   * Reads or writes a TArray (Data at 0x00, Count at 0x08, Max at 0x0c) as a Uint16Array.
   * @param address Address of the TArray structure.
   * @param values Optional Uint16Array to write.
   * @param force When writing, if true temporarily changes page protection to allow the write.
   * @returns A Uint16Array containing the elements, or this instance if writing.
   * @example
   * ```ts
   * const rl = new Process('RocketLeague.exe');
   * const myArray = rl.tArrayU16(0x12345678n);
   * rl.tArrayU16(0x12345678n, new Uint16Array([1, 2, 3]));
   * ```
   */
  public tArrayU16(address: bigint): Uint16Array;
  public tArrayU16(address: bigint, values: Uint16Array, force?: boolean): this;
  public tArrayU16(address: bigint, values?: Uint16Array, force?: boolean): Uint16Array | this {
    let count: number;
    let dataPtr: bigint;

    if (this.is32Bit) {
      // x86 TArray<T>: { Data ptr@0x00 (4B); int ArrayNum@0x04; int ArrayMax@0x08 } (12 bytes).
      this.read(address, this.#Scratch12.u8);
      count = this.#Scratch12.u32[0x01]!;
      dataPtr = BigInt(this.#Scratch12.u32[0x00]!);
    } else {
      this.read(address, this.#Scratch16.u8);
      count = this.#Scratch16.u32[0x02]!;
      dataPtr = read.u64(this.#Scratch16.ptr, 0x00);
    }

    if (values === undefined) {
      const scratch = new Uint16Array(count);

      if (count === 0) {
        return scratch;
      }

      this.read(dataPtr, scratch);

      return scratch;
    }

    this.u32(address + (this.is32Bit ? 0x04n : 0x08n), values.length, force);

    this.write(dataPtr, values, force);

    return this;
  }

  /**
   * Reads or writes a TArray (Data at 0x00, Count at 0x08, Max at 0x0c) as a Uint32Array.
   * @param address Address of the TArray structure.
   * @param values Optional Uint32Array to write.
   * @param force When writing, if true temporarily changes page protection to allow the write.
   * @returns A Uint32Array containing the elements, or this instance if writing.
   * @example
   * ```ts
   * const rl = new Process('RocketLeague.exe');
   * const myArray = rl.tArrayU32(0x12345678n);
   * rl.tArrayU32(0x12345678n, new Uint32Array([1, 2, 3]));
   * ```
   */
  public tArrayU32(address: bigint): Uint32Array;
  public tArrayU32(address: bigint, values: Uint32Array, force?: boolean): this;
  public tArrayU32(address: bigint, values?: Uint32Array, force?: boolean): Uint32Array | this {
    let count: number;
    let dataPtr: bigint;

    if (this.is32Bit) {
      // x86 TArray<T>: { Data ptr@0x00 (4B); int ArrayNum@0x04; int ArrayMax@0x08 } (12 bytes).
      this.read(address, this.#Scratch12.u8);
      count = this.#Scratch12.u32[0x01]!;
      dataPtr = BigInt(this.#Scratch12.u32[0x00]!);
    } else {
      this.read(address, this.#Scratch16.u8);
      count = this.#Scratch16.u32[0x02]!;
      dataPtr = read.u64(this.#Scratch16.ptr, 0x00);
    }

    if (values === undefined) {
      const scratch = new Uint32Array(count);

      if (count === 0) {
        return scratch;
      }

      this.read(dataPtr, scratch);

      return scratch;
    }

    this.u32(address + (this.is32Bit ? 0x04n : 0x08n), values.length, force);

    this.write(dataPtr, values, force);

    return this;
  }

  /**
   * Reads or writes a TArray (Data at 0x00, Count at 0x08, Max at 0x0c) as a BigUint64Array.
   * @param address Address of the TArray structure.
   * @param values Optional BigUint64Array to write.
   * @param force When writing, if true temporarily changes page protection to allow the write.
   * @returns A BigUint64Array containing the elements, or this instance if writing.
   * @example
   * ```ts
   * const rl = new Process('RocketLeague.exe');
   * const myArray = rl.tArrayU64(0x12345678n);
   * rl.tArrayU64(0x12345678n, new BigUint64Array([1n, 2n, 3n]));
   * ```
   */
  public tArrayU64(address: bigint): BigUint64Array;
  public tArrayU64(address: bigint, values: BigUint64Array, force?: boolean): this;
  public tArrayU64(address: bigint, values?: BigUint64Array, force?: boolean): BigUint64Array | this {
    let count: number;
    let dataPtr: bigint;

    if (this.is32Bit) {
      // x86 TArray<T>: { Data ptr@0x00 (4B); int ArrayNum@0x04; int ArrayMax@0x08 } (12 bytes).
      this.read(address, this.#Scratch12.u8);
      count = this.#Scratch12.u32[0x01]!;
      dataPtr = BigInt(this.#Scratch12.u32[0x00]!);
    } else {
      this.read(address, this.#Scratch16.u8);
      count = this.#Scratch16.u32[0x02]!;
      dataPtr = read.u64(this.#Scratch16.ptr, 0x00);
    }

    if (values === undefined) {
      const scratch = new BigUint64Array(count);

      if (count === 0) {
        return scratch;
      }

      this.read(dataPtr, scratch);

      return scratch;
    }

    this.u32(address + (this.is32Bit ? 0x04n : 0x08n), values.length, force);

    this.write(dataPtr, values, force);

    return this;
  }

  /**
   * Reads or writes a TArray (Data at 0x00, Count at 0x08, Max at 0x0c) as a Uint8Array.
   * @param address Address of the TArray structure.
   * @param values Optional Uint8Array to write.
   * @param force When writing, if true temporarily changes page protection to allow the write.
   * @returns A Uint8Array containing the elements, or this instance if writing.
   * @example
   * ```ts
   * const rl = new Process('RocketLeague.exe');
   * const myArray = rl.tArrayU8(0x12345678n);
   * rl.tArrayU8(0x12345678n, new Uint8Array([1, 2, 3]));
   * ```
   */
  public tArrayU8(address: bigint): Uint8Array;
  public tArrayU8(address: bigint, values: Uint8Array, force?: boolean): this;
  public tArrayU8(address: bigint, values?: Uint8Array, force?: boolean): Uint8Array | this {
    let count: number;
    let dataPtr: bigint;

    if (this.is32Bit) {
      // x86 TArray<T>: { Data ptr@0x00 (4B); int ArrayNum@0x04; int ArrayMax@0x08 } (12 bytes).
      this.read(address, this.#Scratch12.u8);
      count = this.#Scratch12.u32[0x01]!;
      dataPtr = BigInt(this.#Scratch12.u32[0x00]!);
    } else {
      this.read(address, this.#Scratch16.u8);
      count = this.#Scratch16.u32[0x02]!;
      dataPtr = read.u64(this.#Scratch16.ptr, 0x00);
    }

    if (values === undefined) {
      const scratch = new Uint8Array(count);

      if (count === 0) {
        return scratch;
      }

      this.read(dataPtr, scratch);

      return scratch;
    }

    this.u32(address + (this.is32Bit ? 0x04n : 0x08n), values.length, force);

    this.write(dataPtr, values, force);

    return this;
  }

  /**
   * Reads or writes a TArray (Data at 0x00, Count at 0x08, Max at 0x0c) as a BigUint64Array.
   * @param address Address of the TArray structure.
   * @param values Optional BigUint64Array to write.
   * @param force When writing, if true temporarily changes page protection to allow the write.
   * @returns A BigUint64Array containing the elements, or this instance if writing.
   * @example
   * ```ts
   * const rl = new Process('RocketLeague.exe');
   * const myArray = rl.tArrayUPtr(0x12345678n);
   * rl.tArrayUPtr(0x12345678n, new BigUint64Array([1n, 2n, 3n]));
   * ```
   */
  public tArrayUPtr(address: bigint): BigUint64Array;
  public tArrayUPtr(address: bigint, values: BigUint64Array, force?: boolean): this;
  public tArrayUPtr(address: bigint, values?: BigUint64Array, force?: boolean): BigUint64Array | this {
    if (this.is32Bit) {
      // x86 TArray<T*>: 12-byte header + 4-byte element pointers; widen into the BigUint64Array.
      this.read(address, this.#Scratch12.u8);
      const count = this.#Scratch12.u32[0x01]!;
      const dataPtr = BigInt(this.#Scratch12.u32[0x00]!);

      if (values === undefined) {
        const result = new BigUint64Array(count);

        if (count === 0) {
          return result;
        }

        const scratch = this.u32Array(dataPtr, count);

        for (let index = 0; index < count; index++) {
          result[index] = BigInt(scratch[index]!);
        }

        return result;
      }

      const scratch = new Uint32Array(values.length);

      for (let index = 0; index < values.length; index++) {
        scratch[index] = Number(BigInt.asUintN(0x20, values[index]!));
      }

      this.u32(address + 0x04n, values.length, force);

      this.u32Array(dataPtr, scratch, force);

      return this;
    }

    if (values === undefined) {
      return this.tArrayU64(address);
    }

    return this.tArrayU64(address, values, force);
  }

  /**
   * Reads or writes a TArray (Data at 0x00, Count at 0x08, Max at 0x0c) as a UTF-16LE string.
   * This is the format used by FName/FString in Unreal Engine.
   * @param address Address of the TArray structure.
   * @param value Optional string to write.
   * @param force When writing, if true temporarily changes page protection to allow the write.
   * @returns The string, or this instance if writing.
   * @example
   * ```ts
   * const rl = new Process('RocketLeague.exe');
   * const myString = rl.tArrayWChar(0x12345678n);
   * rl.tArrayWChar(0x12345678n, 'hello');
   * ```
   */
  public tArrayWChar(address: bigint): string;
  public tArrayWChar(address: bigint, value: string, force?: boolean): this;
  public tArrayWChar(address: bigint, value?: string, force?: boolean): string | this {
    let count: number;
    let dataPtr: bigint;

    if (this.is32Bit) {
      // x86 TArray<T>: { Data ptr@0x00 (4B); int ArrayNum@0x04; int ArrayMax@0x08 } (12 bytes).
      this.read(address, this.#Scratch12.u8);
      count = this.#Scratch12.u32[0x01]!;
      dataPtr = BigInt(this.#Scratch12.u32[0x00]!);
    } else {
      this.read(address, this.#Scratch16.u8);
      count = this.#Scratch16.u32[0x02]!;
      dataPtr = read.u64(this.#Scratch16.ptr, 0x00);
    }

    if (value === undefined) {
      if (count === 0) {
        return '';
      }

      const scratch = Buffer.allocUnsafe((count - 0x01) * 0x02);

      this.read(dataPtr, scratch);

      return scratch.toString('utf16le');
    }

    const scratch = Buffer.allocUnsafe((value.length + 0x01) * 0x02);

    scratch.write(value, 0, 'utf16le');
    scratch.writeUInt16LE(0x0000, value.length * 0x02);

    this.u32(address + (this.is32Bit ? 0x04n : 0x08n), value.length + 0x01, force);

    this.write(dataPtr, scratch, force);

    return this;
  }

  /**
   * Reads or writes a 16-bit unsigned integer.
   * @param address Address to access.
   * @param value Optional value to write.
   * @param force When writing, if true temporarily changes page protection to allow the write.
   * @returns The value at address, or this instance if writing.
   * @example
   * ```ts
   * const cs2 = new Process('cs2.exe');
   * const myInt = cs2.u16(0x12345678n);
   * cs2.u16(0x12345678n, 42);
   * ```
   */
  public u16(address: bigint): number;
  public u16(address: bigint, value: number, force?: boolean): this;
  public u16(address: bigint, value?: number, force?: boolean): number | this {
    const { hProcess } = this;

    if (value === undefined) {
      const bReadProcessMemory = !!ReadProcessMemory(hProcess, address, this.#Scratch2.ptr, 0x02n, null);

      if (!bReadProcessMemory) {
        throw new Win32Error('ReadProcessMemory', GetLastError());
      }

      return this.#Scratch2.u16[0x00]!;
    }

    this.#Scratch2.u16[0x00] = value;

    this.write(address, this.#Scratch2.u16, force);

    return this;
  }

  /**
   * Reads or writes a Uint16Array.
   * @param address Address to access.
   * @param lengthOrValues Length to read or Uint16Array to write.
   * @param force When writing, if true temporarily changes page protection to allow the write.
   * @returns Uint16Array read or this instance if writing.
   * @example
   * ```ts
   * const cs2 = new Process('cs2.exe');
   * const myArray = cs2.u16Array(0x12345678n, 2);
   * cs2.u16Array(0x12345678n, new Uint16Array([1,2]));
   * ```
   */
  public u16Array(address: bigint, length: number): Uint16Array;
  public u16Array(address: bigint, values: Uint16Array, force?: boolean): this;
  public u16Array(address: bigint, lengthOrValues: Uint16Array | number, force?: boolean): Uint16Array | this {
    if (typeof lengthOrValues === 'number') {
      const length = lengthOrValues;
      const scratch = new Uint16Array(length);

      this.read(address, scratch);

      return scratch;
    }

    const values = lengthOrValues;

    this.write(address, values, force);

    return this;
  }

  /**
   * Reads or writes a 32-bit unsigned integer.
   * @param address Address to access.
   * @param value Optional value to write.
   * @param force When writing, if true temporarily changes page protection to allow the write.
   * @returns The value at address, or this instance if writing.
   * @example
   * ```ts
   * const cs2 = new Process('cs2.exe');
   * const myInt = cs2.u32(0x12345678n);
   * cs2.u32(0x12345678n, 42);
   * ```
   */
  public u32(address: bigint): number;
  public u32(address: bigint, value: number, force?: boolean): this;
  public u32(address: bigint, value?: number, force?: boolean): number | this {
    const { hProcess } = this;

    if (value === undefined) {
      const bReadProcessMemory = !!ReadProcessMemory(hProcess, address, this.#Scratch4.ptr, 0x04n, null);

      if (!bReadProcessMemory) {
        throw new Win32Error('ReadProcessMemory', GetLastError());
      }

      return this.#Scratch4.u32[0x00]!;
    }

    this.#Scratch4.u32[0x00] = value;

    this.write(address, this.#Scratch4.u32, force);

    return this;
  }

  /**
   * Reads or writes a Uint32Array.
   * @param address Address to access.
   * @param lengthOrValues Length to read or Uint32Array to write.
   * @param force When writing, if true temporarily changes page protection to allow the write.
   * @returns Uint32Array read or this instance if writing.
   * @example
   * ```ts
   * const cs2 = new Process('cs2.exe');
   * const myArray = cs2.u32Array(0x12345678n, 2);
   * cs2.u32Array(0x12345678n, new Uint32Array([1,2]));
   * ```
   */
  public u32Array(address: bigint, length: number): Uint32Array;
  public u32Array(address: bigint, values: Uint32Array, force?: boolean): this;
  public u32Array(address: bigint, lengthOrValues: Uint32Array | number, force?: boolean): Uint32Array | this {
    if (typeof lengthOrValues === 'number') {
      const length = lengthOrValues;
      const scratch = new Uint32Array(length);

      this.read(address, scratch);

      return scratch;
    }

    const values = lengthOrValues;

    this.write(address, values, force);

    return this;
  }

  /**
   * Reads or writes a 64-bit unsigned integer.
   * @param address Address to access.
   * @param value Optional value to write.
   * @param force When writing, if true temporarily changes page protection to allow the write.
   * @returns The bigint at address, or this instance if writing.
   * @example
   * ```ts
   * const cs2 = new Process('cs2.exe');
   * const myBigInt = cs2.u64(0x12345678n);
   * cs2.u64(0x12345678n, 123n);
   * ```
   */
  public u64(address: bigint): bigint;
  public u64(address: bigint, value: bigint, force?: boolean): this;
  public u64(address: bigint, value?: bigint, force?: boolean): bigint | this {
    const { hProcess } = this;

    if (value === undefined) {
      const bReadProcessMemory = !!ReadProcessMemory(hProcess, address, this.#Scratch8.ptr, 0x08n, null);

      if (!bReadProcessMemory) {
        throw new Win32Error('ReadProcessMemory', GetLastError());
      }

      return read.u64(this.#Scratch8.ptr, 0x00);
    }

    this.#Scratch8.u64[0x00] = value;

    this.write(address, this.#Scratch8.u64, force);

    return this;
  }

  /**
   * Reads or writes a BigUint64Array.
   * @param address Address to access.
   * @param lengthOrValues Length to read or BigUint64Array to write.
   * @param force When writing, if true temporarily changes page protection to allow the write.
   * @returns BigUint64Array read or this instance if writing.
   * @example
   * ```ts
   * const cs2 = new Process('cs2.exe');
   * const myArray = cs2.u64Array(0x12345678n, 2);
   * cs2.u64Array(0x12345678n, new BigUint64Array([1n,2n]));
   * ```
   */
  public u64Array(address: bigint, length: number): BigUint64Array;
  public u64Array(address: bigint, values: BigUint64Array, force?: boolean): this;
  public u64Array(address: bigint, lengthOrValues: BigUint64Array | number, force?: boolean): BigUint64Array | this {
    if (typeof lengthOrValues === 'number') {
      const length = lengthOrValues;
      const scratch = new BigUint64Array(length);

      this.read(address, scratch);

      return scratch;
    }

    const values = lengthOrValues;

    this.write(address, values, force);

    return this;
  }

  /**
   * Reads or writes an 8-bit unsigned integer.
   * @param address Address to access.
   * @param value Optional value to write.
   * @param force When writing, if true temporarily changes page protection to allow the write.
   * @returns The value at address, or this instance if writing.
   * @example
   * ```ts
   * const cs2 = new Process('cs2.exe');
   * const myInt = cs2.u8(0x12345678n);
   * cs2.u8(0x12345678n, 7);
   * ```
   */
  public u8(address: bigint): number;
  public u8(address: bigint, value: number, force?: boolean): this;
  public u8(address: bigint, value?: number, force?: boolean): number | this {
    const { hProcess } = this;

    if (value === undefined) {
      const bReadProcessMemory = !!ReadProcessMemory(hProcess, address, this.#Scratch1.ptr, 0x01n, null);

      if (!bReadProcessMemory) {
        throw new Win32Error('ReadProcessMemory', GetLastError());
      }

      return this.#Scratch1.u8[0x00]!;
    }

    this.#Scratch1.u8[0x00] = value;

    this.write(address, this.#Scratch1.u8, force);

    return this;
  }

  /**
   * Reads or writes a Uint8Array.
   * @param address Address to access.
   * @param lengthOrValues Length to read or Uint8Array to write.
   * @param force When writing, if true temporarily changes page protection to allow the write.
   * @returns Uint8Array read or this instance if writing.
   * @example
   * ```ts
   * const cs2 = new Process('cs2.exe');
   * const myArray = cs2.u8Array(0x12345678n, 2);
   * cs2.u8Array(0x12345678n, new Uint8Array([1,2]));
   * ```
   */
  public u8Array(address: bigint, length: number): Uint8Array;
  public u8Array(address: bigint, values: Uint8Array, force?: boolean): this;
  public u8Array(address: bigint, lengthOrValues: Uint8Array | number, force?: boolean): Uint8Array | this {
    if (typeof lengthOrValues === 'number') {
      const length = lengthOrValues;
      const scratch = new Uint8Array(length);

      this.read(address, scratch);

      return scratch;
    }

    const values = lengthOrValues;

    this.write(address, values, force);

    return this;
  }

  /**
   * Reads or writes a pointer-sized unsigned integer.
   * @param address Address to access.
   * @param value Optional value to write.
   * @param force When writing, if true temporarily changes page protection to allow the write.
   * @returns The value at address, or this instance if writing.
   * @example
   * ```ts
   * const cs2 = new Process('cs2.exe');
   * const myPtr = cs2.uPtr(0x12345678n);
   * cs2.uPtr(0x12345678n, 123n);
   * ```
   */
  public uPtr(address: bigint): UPtr;
  public uPtr(address: bigint, value: UPtr, force?: boolean): this;
  public uPtr(address: bigint, value?: UPtr, force?: boolean): UPtr | this {
    if (value === undefined) {
      if (this.is32Bit) {
        return BigInt(this.u32(address));
      }

      return this.u64(address);
    }

    if (this.is32Bit) {
      return this.u32(address, Number(BigInt.asUintN(0x20, value)), force);
    }

    return this.u64(address, value, force);
  }

  /**
   * Reads or writes an array of pointer-sized unsigned integers.
   * @param address Address to access.
   * @param lengthOrValues Length to read or array to write.
   * @param force When writing, if true temporarily changes page protection to allow the write.
   * @returns Array read or this instance if writing.
   * @example
   * ```ts
   * const cs2 = new Process('cs2.exe');
   * const myPtrs = cs2.uPtrArray(0x12345678n, 2);
   * cs2.uPtrArray(0x12345678n, new BigUint64Array([1n,2n]));
   * ```
   */
  public uPtrArray(address: bigint, length: number): UPtrArray;
  public uPtrArray(address: bigint, values: UPtrArray, force?: boolean): this;
  public uPtrArray(address: bigint, lengthOrValues: UPtrArray | number, force?: boolean): UPtrArray | this {
    if (typeof lengthOrValues === 'number') {
      if (this.is32Bit) {
        const length = lengthOrValues;
        const scratch = this.u32Array(address, length);
        const result = new BigUint64Array(length);

        for (let index = 0; index < length; index++) {
          result[index] = BigInt(scratch[index]!);
        }

        return result;
      }

      return this.u64Array(address, lengthOrValues);
    }

    if (this.is32Bit) {
      const values = lengthOrValues;
      const scratch = new Uint32Array(values.length);

      for (let index = 0; index < values.length; index++) {
        scratch[index] = Number(BigInt.asUintN(0x20, values[index]!));
      }

      return this.u32Array(address, scratch, force);
    }

    return this.u64Array(address, lengthOrValues, force);
  }

  /**
   * Reads a UtlLinkedList of 64-bit unsigned integers and returns its elements as a BigUint64Array.
   *
   * This helper reads the list header at `address`, validates the capacity and element pointer,
   * reads the elements table, and walks the internal linked indices to produce a compact
   * BigUint64Array of present elements. If the list is empty or invalid an empty array is
   * returned.
   *
   * @param address Address of the UtlLinkedList header in the remote process.
   * @returns BigUint64Array containing the list elements (empty if the list is invalid or empty).
   * @example
   * ```ts
   * const cs2 = new Process('cs2.exe');
   * const myList = cs2.utlLinkedListU64(0x12345678n);
   * ```
   */
  public utlLinkedListU64(address: bigint): BigUint64Array {
    const header = new Uint8Array(0x18);
    const headerUint16Array = new Uint16Array(header.buffer, header.byteOffset);
    const headerBigUint64Array = new BigUint64Array(header.buffer, header.byteOffset + 0x08, 2);

    this.read(address, header);

    const capacity = headerUint16Array[0x01]! & 0x7fff;
    const elementsPtr = headerBigUint64Array[0x00]!;
    let index = headerUint16Array[0x08]!;

    if (capacity === 0 || capacity <= index || elementsPtr === 0n || index === 0xffff) {
      return new BigUint64Array(0);
    }

    const scratch = new Uint8Array(capacity << 0x04);
    const scratchBigUint64Array = new BigUint64Array(scratch.buffer, scratch.byteOffset);
    const scratchUint16Array = new Uint16Array(scratch.buffer, scratch.byteOffset);

    this.read(elementsPtr, scratch);

    let count = 0;
    const result = new BigUint64Array(capacity);

    while (count < capacity && capacity > index && index !== 0xffff) {
      result[count++] = scratchBigUint64Array[index * 0x02]!;

      const next = scratchUint16Array[0x05 + index * 0x08]!;

      if (index === next || next === 0xffff) {
        break;
      }

      index = next;
    }

    return capacity === count ? result : result.subarray(0, count);
  }

  /**
   * Reads or writes a generic UtlVector as raw bytes (no typing).
   * Pass elementSize (bytes per element) so we can set/read the header count.
   * @param address Address to access.
   * @param elementSize Bytes per element.
   * @param values Optional Uint8Array to write.
   * @param force When writing, if true temporarily changes page protection to allow the write.
   * @returns The bytes at address, or this instance if writing.
   * @example
   * ```ts
   * const cs2 = new Process('cs2.exe');
   * const bytes = cs2.utlVectorRaw(0x1234n, 0x14); // read size*elementSize bytes
   * cs2.utlVectorRaw(0x1234n, 0x14, new Uint8Array([1, 2, 3, 4])); // write
   * ```
   */
  public utlVectorRaw(address: bigint, elementSize: number): Uint8Array;
  public utlVectorRaw(address: bigint, elementSize: number, values: Uint8Array, force?: boolean): this;
  public utlVectorRaw(address: bigint, elementSize: number, values?: Uint8Array, force?: boolean): Uint8Array | this {
    let elementsPtr: bigint;
    let size: number;

    if (this.is32Bit) {
      // x86 CUtlVector: { int Size@0x00; T* Elements@0x04 (4B) } (8 bytes).
      this.read(address, this.#Scratch8.u8);
      elementsPtr = BigInt(this.#Scratch8.u32[0x01]!);
      size = this.#Scratch8.u32[0x00]!;
    } else {
      this.read(address, this.#Scratch16.u8);
      elementsPtr = read.u64(this.#Scratch16.ptr, 0x08);
      size = this.#Scratch16.u32[0x00]!;
    }

    if (values === undefined) {
      const count = size;

      if (count === 0 || elementsPtr === 0n) {
        return new Uint8Array(0);
      }

      const byteLength = count * elementSize;
      const scratch = new Uint8Array(byteLength);

      this.read(elementsPtr, scratch);

      return scratch;
    }

    if (values.byteLength % elementSize !== 0) {
      throw new RangeError('values length must be a multiple of elementSize');
    }

    const count = values.byteLength / elementSize;

    this.u32(address, count, force);

    if (count === 0) {
      return this;
    }

    this.write(elementsPtr, values, force);

    return this;
  }

  /**
   * Reads or writes a UtlVectorU32 (Uint32Array).
   * @param address Address to access.
   * @param values Optional Uint32Array to write.
   * @param force When writing, if true temporarily changes page protection to allow the write.
   * @returns The vector at address, or this instance if writing.
   * @example
   * ```ts
   * const cs2 = new Process('cs2.exe');
   * const myVector = cs2.utlVectorU32(0x12345678n);
   * cs2.utlVectorU32(0x12345678n, new Uint32Array([1,2,3]));
   * ```
   */
  public utlVectorU32(address: bigint): Uint32Array;
  public utlVectorU32(address: bigint, values: Uint32Array, force?: boolean): this;
  public utlVectorU32(address: bigint, values?: Uint32Array, force?: boolean): Uint32Array | this {
    let elementsPtr: bigint;
    let size: number;

    if (this.is32Bit) {
      // x86 CUtlVector: { int Size@0x00; T* Elements@0x04 (4B) } (8 bytes).
      this.read(address, this.#Scratch8.u8);
      elementsPtr = BigInt(this.#Scratch8.u32[0x01]!);
      size = this.#Scratch8.u32[0x00]!;
    } else {
      this.read(address, this.#Scratch16.u8);
      elementsPtr = read.u64(this.#Scratch16.ptr, 0x08);
      size = this.#Scratch16.u32[0x00]!;
    }

    if (values === undefined) {
      if (size === 0 || elementsPtr === 0n) {
        return new Uint32Array(0);
      }

      const scratch = new Uint32Array(size);

      this.read(elementsPtr, scratch);

      return scratch;
    }

    this.u32(address, values.length, force);

    if (values.length === 0) {
      return this;
    }

    this.write(elementsPtr, values, force);

    return this;
  }

  /**
   * Reads or writes a UtlVectorU64 (BigUint64Array).
   * @param address Address to access.
   * @param values Optional BigUint64Array to write.
   * @param force When writing, if true temporarily changes page protection to allow the write.
   * @returns The vector at address, or this instance if writing.
   * @example
   * ```ts
   * const cs2 = new Process('cs2.exe');
   * const myVector = cs2.utlVectorU64(0x12345678n);
   * cs2.utlVectorU64(0x12345678n, new BigUint64Array([1n,2n,3n]));
   * ```
   */
  public utlVectorU64(address: bigint): BigUint64Array;
  public utlVectorU64(address: bigint, values: BigUint64Array, force?: boolean): this;
  public utlVectorU64(address: bigint, values?: BigUint64Array, force?: boolean): BigUint64Array | this {
    let elementsPtr: bigint;
    let size: number;

    if (this.is32Bit) {
      // x86 CUtlVector: { int Size@0x00; T* Elements@0x04 (4B) } (8 bytes).
      this.read(address, this.#Scratch8.u8);
      elementsPtr = BigInt(this.#Scratch8.u32[0x01]!);
      size = this.#Scratch8.u32[0x00]!;
    } else {
      this.read(address, this.#Scratch16.u8);
      elementsPtr = read.u64(this.#Scratch16.ptr, 0x08);
      size = this.#Scratch16.u32[0x00]!;
    }

    if (values === undefined) {
      if (size === 0 || elementsPtr === 0n) {
        return new BigUint64Array(0);
      }

      const scratch = new BigUint64Array(size);

      this.read(elementsPtr, scratch);

      return scratch;
    }

    this.u32(address, values.length, force);

    if (values.length === 0) {
      return this;
    }

    this.write(elementsPtr, values, force);

    return this;
  }

  /**
   * Reads a virtual function pointer from an object's vtable.
   * @param address Address of the object (pointer to vtable).
   * @param index Index of the virtual function in the vtable.
   * @returns The virtual function pointer.
   * @example
   * ```ts
   * const cs2 = new Process('cs2.exe');
   * const vfunc = cs2.vFunction(0x12345678n, 5); // Get 6th virtual function
   * ```
   */
  public vFunction(address: bigint, index: number): bigint {
    if (this.is32Bit) {
      const vtablePointer = BigInt(this.u32(address));

      return BigInt(this.u32(vtablePointer + BigInt(index * 0x04)));
    }

    const { hProcess } = this;

    const bReadProcessMemory = !!ReadProcessMemory(hProcess, address, this.#Scratch8.ptr, 0x08n, null);

    if (!bReadProcessMemory) {
      throw new Win32Error('ReadProcessMemory', GetLastError());
    }

    const vtablePtr = read.u64(this.#Scratch8.ptr, 0x00);

    const bReadProcessMemory2 = !!ReadProcessMemory(hProcess, vtablePtr + BigInt(index * 0x08), this.#Scratch8.ptr, 0x08n, null);

    if (!bReadProcessMemory2) {
      throw new Win32Error('ReadProcessMemory', GetLastError());
    }

    return read.u64(this.#Scratch8.ptr, 0x00);
  }

  /**
   * Reads the vtable pointer from an object.
   * @param address Address of the object.
   * @returns The vtable pointer.
   * @example
   * ```ts
   * const cs2 = new Process('cs2.exe');
   * const vtable = cs2.vTable(0x12345678n);
   * ```
   */
  public vTable(address: bigint): bigint {
    if (this.is32Bit) {
      return BigInt(this.u32(address));
    }

    return this.u64(address);
  }

  /**
   * Reads or writes a Vector2 (object with x, y).
   * @param address Address to access.
   * @param value Optional Vector2 to write.
   * @param force When writing, if true temporarily changes page protection to allow the write.
   * @returns The Vector2 at address, or this instance if writing.
   * @example
   * ```ts
   * const cs2 = new Process('cs2.exe');
   * const myVector2 = cs2.vector2(0x12345678n);
   * cs2.vector2(0x12345678n, { x: 1, y: 2 });
   * ```
   */
  public vector2(address: bigint): Vector2;
  public vector2(address: bigint, value: Vector2, force?: boolean): this;
  public vector2(address: bigint, value?: Vector2, force?: boolean): Vector2 | this {
    if (value === undefined) {
      return this.point(address);
    }

    return this.point(address, value, force);
  }

  /**
   * Reads or writes an array of Vector2.
   * @param address Address to access.
   * @param lengthOrValues Length to read or array to write.
   * @param force When writing, if true temporarily changes page protection to allow the write.
   * @returns Array of Vector2 read or this instance if writing.
   * @example
   * ```ts
   * const cs2 = new Process('cs2.exe');
   * const myVector2s = cs2.vector2Array(0x12345678n, 2);
   * cs2.vector2Array(0x12345678n, [{ x: 1, y: 2 }, { x: 3, y: 4 }]);
   * ```
   */
  public vector2Array(address: bigint, length: number): Vector2[];
  public vector2Array(address: bigint, values: Vector2[], force?: boolean): this;
  public vector2Array(address: bigint, lengthOrValues: Vector2[] | number, force?: boolean): Vector2[] | this {
    if (typeof lengthOrValues === 'number') {
      return this.pointArray(address, lengthOrValues);
    }

    return this.pointArray(address, lengthOrValues, force);
  }

  /**
   * Reads an array of Vector2 as a raw Float32Array (SIMD-friendly).
   * @param address Address to read from.
   * @param length Number of Vector2 elements to read.
   * @returns Float32Array of length * 2 floats.
   * @example
   * ```ts
   * const cs2 = new Process('cs2.exe');
   * const raw = cs2.vector2ArrayRaw(0x12345678n, 100); // 200 floats
   * ```
   */
  public vector2ArrayRaw(address: bigint, length: number): Float32Array {
    return this.f32Array(address, length * 0x02);
  }

  /**
   * Reads or writes a raw Vector2 as a Float32Array.
   * @param address Address to access.
   * @param values Optional Float32Array to write.
   * @param force When writing, if true temporarily changes page protection to allow the write.
   * @returns Float32Array read or this instance if writing.
   * @example
   * ```ts
   * const cs2 = new Process('cs2.exe');
   * const myVector2 = cs2.vector2Raw(0x12345678n);
   * cs2.vector2Raw(0x12345678n, new Float32Array([1, 2]));
   * ```
   */
  public vector2Raw(address: bigint): Float32Array;
  public vector2Raw(address: bigint, values: Float32Array, force?: boolean): this;
  public vector2Raw(address: bigint, values?: Float32Array, force?: boolean): Float32Array | this {
    if (values === undefined) {
      return this.f32Array(address, 0x02);
    }

    if (values.length !== 0x02) {
      throw new RangeError('values.length must be 2.');
    }

    this.write(address, values, force);

    return this;
  }

  /**
   * Reads or writes a Vector3 (object with x, y, z).
   * @param address Address to access.
   * @param value Optional Vector3 to write.
   * @param force When writing, if true temporarily changes page protection to allow the write.
   * @returns The Vector3 at address, or this instance if writing.
   * @example
   * ```ts
   * const cs2 = new Process('cs2.exe');
   * const myVector3 = cs2.vector3(0x12345678n);
   * cs2.vector3(0x12345678n, { x: 1, y: 2, z: 3 });
   * ```
   */
  public vector3(address: bigint): Vector3;
  public vector3(address: bigint, value: Vector3, force?: boolean): this;
  public vector3(address: bigint, value?: Vector3, force?: boolean): Vector3 | this {
    const { hProcess } = this;

    if (value === undefined) {
      const bReadProcessMemory = !!ReadProcessMemory(hProcess, address, this.#Scratch12.ptr, 0x0cn, null);

      if (!bReadProcessMemory) {
        throw new Win32Error('ReadProcessMemory', GetLastError());
      }

      const x = this.#Scratch12.f32[0x00]!,
        y = this.#Scratch12.f32[0x01]!,
        z = this.#Scratch12.f32[0x02]!;

      return { x, y, z };
    }

    this.#Scratch12.f32[0x00] = value.x;
    this.#Scratch12.f32[0x01] = value.y;
    this.#Scratch12.f32[0x02] = value.z;

    this.write(address, this.#Scratch12.f32, force);

    return this;
  }

  /**
   * Reads or writes an array of Vector3.
   * @param address Address to access.
   * @param lengthOrValues Length to read or array to write.
   * @param force When writing, if true temporarily changes page protection to allow the write.
   * @returns Array of Vector3 read or this instance if writing.
   * @example
   * ```ts
   * const cs2 = new Process('cs2.exe');
   * const myVector3s = cs2.vector3Array(0x12345678n, 2);
   * cs2.vector3Array(0x12345678n, [{ x: 1, y: 2, z: 3 }]);
   * ```
   */
  public vector3Array(address: bigint, length: number): Vector3[];
  public vector3Array(address: bigint, values: Vector3[], force?: boolean): this;
  public vector3Array(address: bigint, lengthOrValues: Vector3[] | number, force?: boolean): Vector3[] | this {
    if (typeof lengthOrValues === 'number') {
      const length = lengthOrValues;
      const scratch = new Float32Array(length * 0x03);

      this.read(address, scratch);

      const result = new Array<Vector3>(length);

      for (let i = 0, j = 0; i < length; i++, j += 0x03) {
        const x = scratch[j]!;
        const y = scratch[j + 0x01]!;
        const z = scratch[j + 0x02]!;

        result[i] = { x, y, z };
      }

      return result;
    }

    const values = lengthOrValues;
    const scratch = new Float32Array(values.length * 0x03);

    for (let i = 0, j = 0; i < values.length; i++, j += 0x03) {
      const vector3 = values[i]!;

      scratch[j] = vector3.x;
      scratch[j + 0x01] = vector3.y;
      scratch[j + 0x02] = vector3.z;
    }

    this.write(address, scratch, force);

    return this;
  }

  /**
   * Reads an array of Vector3 as a raw Float32Array (SIMD-friendly).
   * @param address Address to read from.
   * @param length Number of Vector3 elements to read.
   * @returns Float32Array of length * 3 floats.
   * @example
   * ```ts
   * const cs2 = new Process('cs2.exe');
   * const raw = cs2.vector3ArrayRaw(0x12345678n, 100); // 300 floats
   * ```
   */
  public vector3ArrayRaw(address: bigint, length: number): Float32Array {
    return this.f32Array(address, length * 0x03);
  }

  /**
   * Reads or writes a raw Vector3 as a Float32Array.
   * @param address Address to access.
   * @param values Optional Float32Array to write.
   * @param force When writing, if true temporarily changes page protection to allow the write.
   * @returns Float32Array read or this instance if writing.
   * @example
   * ```ts
   * const cs2 = new Process('cs2.exe');
   * const myVector3 = cs2.vector3Raw(0x12345678n);
   * cs2.vector3Raw(0x12345678n, new Float32Array([1, 2, 3]));
   * ```
   */
  public vector3Raw(address: bigint): Float32Array;
  public vector3Raw(address: bigint, values: Float32Array, force?: boolean): this;
  public vector3Raw(address: bigint, values?: Float32Array, force?: boolean): Float32Array | this {
    if (values === undefined) {
      return this.f32Array(address, 0x03);
    }

    if (values.length !== 0x03) {
      throw new RangeError('values.length must be 3.');
    }

    this.write(address, values, force);

    return this;
  }

  /**
   * Reads or writes a Vector4 (object with w, x, y, z).
   * @param address Address to access.
   * @param value Optional Vector4 to write.
   * @param force When writing, if true temporarily changes page protection to allow the write.
   * @returns The Vector4 at address, or this instance if writing.
   * @example
   * ```ts
   * const cs2 = new Process('cs2.exe');
   * const myVector4 = cs2.vector4(0x12345678n);
   * cs2.vector4(0x12345678n, { w: 1, x: 0, y: 0, z: 0 });
   * ```
   */
  public vector4(address: bigint): Vector4;
  public vector4(address: bigint, value: Vector4, force?: boolean): this;
  public vector4(address: bigint, value?: Vector4, force?: boolean): Vector4 | this {
    if (value === undefined) {
      return this.quaternion(address);
    }

    return this.quaternion(address, value, force);
  }

  /**
   * Reads or writes an array of Vector4.
   * @param address Address to access.
   * @param lengthOrValues Length to read or array to write.
   * @param force When writing, if true temporarily changes page protection to allow the write.
   * @returns Array of Vector4 read or this instance if writing.
   * @example
   * ```ts
   * const cs2 = new Process('cs2.exe');
   * const myVector4s = cs2.vector4Array(0x12345678n, 2);
   * cs2.vector4Array(0x12345678n, [{ w: 1, x: 0, y: 0, z: 0 }]);
   * ```
   */
  public vector4Array(address: bigint, length: number): Vector4[];
  public vector4Array(address: bigint, values: Vector4[], force?: boolean): this;
  public vector4Array(address: bigint, lengthOrValues: Vector4[] | number, force?: boolean): Vector4[] | this {
    if (typeof lengthOrValues === 'number') {
      return this.quaternionArray(address, lengthOrValues);
    }

    return this.quaternionArray(address, lengthOrValues, force);
  }

  /**
   * Reads an array of Vector4 as a raw Float32Array (SIMD-friendly).
   * @param address Address to read from.
   * @param length Number of Vector4 elements to read.
   * @returns Float32Array of length * 4 floats.
   * @example
   * ```ts
   * const cs2 = new Process('cs2.exe');
   * const raw = cs2.vector4ArrayRaw(0x12345678n, 100); // 400 floats
   * ```
   */
  public vector4ArrayRaw(address: bigint, length: number): Float32Array {
    return this.f32Array(address, length * 0x04);
  }

  /**
   * Reads or writes a raw Vector4 as a Float32Array.
   * @param address Address to access.
   * @param values Optional Float32Array to write.
   * @param force When writing, if true temporarily changes page protection to allow the write.
   * @returns Float32Array read or this instance if writing.
   * @example
   * ```ts
   * const cs2 = new Process('cs2.exe');
   * const myVector4 = cs2.vector4Raw(0x12345678n);
   * cs2.vector4Raw(0x12345678n, new Float32Array([1, 0, 0, 0]));
   * ```
   */
  public vector4Raw(address: bigint): Float32Array;
  public vector4Raw(address: bigint, values: Float32Array, force?: boolean): this;
  public vector4Raw(address: bigint, values?: Float32Array, force?: boolean): Float32Array | this {
    if (values === undefined) {
      return this.f32Array(address, 0x04);
    }

    if (values.length !== 0x04) {
      throw new RangeError('values.length must be 4.');
    }

    this.write(address, values, force);

    return this;
  }

  /**
   * Reads or writes a 4x4 view matrix (Float32Array of length 16).
   * @param address Address to access.
   * @param values Optional Float32Array to write.
   * @param force When writing, if true temporarily changes page protection to allow the write.
   * @returns The matrix at address, or this instance if writing.
   * @example
   * ```ts
   * const cs2 = new Process('cs2.exe');
   * const viewMatrix = cs2.viewMatrix(0x12345678n);
   * cs2.viewMatrix(0x12345678n, new Float32Array(16));
   * ```
   */
  public viewMatrix(address: bigint): Float32Array;
  public viewMatrix(address: bigint, values: Float32Array, force?: boolean): this;
  public viewMatrix(address: bigint, values?: Float32Array, force?: boolean): Float32Array | this {
    if (values === undefined) {
      return this.matrix4x4(address);
    }

    return this.matrix4x4(address, values, force);
  }

  /**
   * Reads or writes a wide (UTF-16LE) string.
   * @param address Address to access.
   * @param lengthOrValue Length in characters to read or string to write.
   * @param force When writing, if true temporarily changes page protection to allow the write.
   * @returns The string at address, or this instance if writing.
   * @notice When writing, remember to null-terminate your string (e.g., 'hello\0').
   * @example
   * ```ts
   * const cs2 = new Process('cs2.exe');
   * const myWideString = cs2.wideString(0x12345678n, 16);
   * cs2.wideString(0x12345678n, 'hello\0');
   * ```
   */
  public wideString(address: bigint, length: number): string;
  public wideString(address: bigint, value: string, force?: boolean): this;
  public wideString(address: bigint, lengthOrValue: number | string, force?: boolean): string | this {
    if (typeof lengthOrValue === 'number') {
      const scratch = Buffer.allocUnsafe(lengthOrValue * 2);

      this.read(address, scratch);

      let indexOf = lengthOrValue;

      for (let index = 0; index < lengthOrValue; index++) {
        if (scratch.readUInt16LE(index * 0x02) === 0x0000) {
          indexOf = index;
          break;
        }
      }

      return scratch.toString('utf16le', 0, indexOf * 2);
    }

    const scratch = Buffer.allocUnsafe(lengthOrValue.length * 2);

    scratch.write(lengthOrValue, 0, 'utf16le');

    this.write(address, scratch, force);

    return this;
  }

  // Public utility methods…

  /**
   * Follows a pointer chain with offsets.
   * @param address Base address.
   * @param offsets Array of pointer offsets.
   * @returns Final address after following the chain, or -1n if any pointer is null.
   * @example
   * ```ts
   * const cs2 = new Process('cs2.exe');
   * const myAddress = cs2.follow(0x10000000n, [0x10n, 0x20n]);
   * ```
   */
  public follow(address: bigint, offsets: readonly bigint[]): bigint {
    const length = offsets.length;

    if (length === 0) {
      return address;
    }

    const last = length - 1;

    if (this.is32Bit) {
      for (let i = 0; i < last; i++) {
        address = BigInt(this.u32(address + offsets[i]!));

        if (address === 0n) {
          return -1n;
        }
      }

      return address + offsets[last]!;
    }

    const { hProcess } = this;

    for (let i = 0; i < last; i++) {
      const bReadProcessMemory = !!ReadProcessMemory(hProcess, address + offsets[i]!, this.#Scratch8.ptr, 0x08n, null);

      if (!bReadProcessMemory) {
        throw new Win32Error('ReadProcessMemory', GetLastError());
      }

      address = read.u64(this.#Scratch8.ptr, 0x00);

      if (address === 0n) {
        return -1n;
      }
    }

    return address + offsets[last]!;
  }

  /**
   * Finds the address of a buffer within a memory region.
   * @param needle Buffer or typed array to search for.
   * @param address Start address.
   * @param length Number of bytes to search.
   * @param all If true, returns all matches as an array. If false or omitted, returns the first match or -1n.
   * @returns Address of the buffer if found, or -1n. If all is true, returns an array of addresses.
   * @example
   * ```ts
   * const cs2 = new Process('cs2.exe');
   * const needle = Buffer.from('Hello world!');
   * // const needle = Buffer.from([0x01, 0x02, 0x03]);
   * // const needle = new Uint8Array([0x01, 0x02, 0x03]);
   * // const needle = new Float32Array([0x01, 0x02, 0x03]);
   * // Find first match
   * const address = cs2.indexOf(needle, 0x10000000n, 100);
   * // Find all matches
   * const allAddressess = cs2.indexOf(needle, 0x10000000n, 100, true);
   * ```
   */
  public indexOf(needle: BufferLike, address: bigint, length: number): bigint;
  public indexOf(needle: BufferLike, address: bigint, length: number, all: false): bigint;
  public indexOf(needle: BufferLike, address: bigint, length: number, all: true): bigint[];
  public indexOf(needle: BufferLike, address: bigint, length: number, all: boolean = false): bigint | bigint[] {
    if (length > this.#indexOfHaystack.byteLength) {
      this.#indexOfHaystack = Buffer.allocUnsafe(length);
    }

    const haystack = this.#indexOfHaystack.subarray(0, length);

    const needleBuffer = ArrayBuffer.isView(needle) //
      ? Buffer.from(needle.buffer, needle.byteOffset, needle.byteLength)
      : Buffer.from(needle);

    this.read(address, haystack);

    if (!all) {
      const indexOf = haystack.indexOf(needleBuffer);

      return indexOf !== -1 ? BigInt(indexOf) + address : -1n;
    }

    const results: bigint[] = [];

    let start = haystack.indexOf(needleBuffer);

    if (start === -1) {
      return results;
    }

    do {
      results.push(address + BigInt(start));
    } while ((start = haystack.indexOf(needleBuffer, start + 0x01)) !== -1);

    return results;
  }

  /**
   * Finds the address of a byte pattern in memory. `**` and `??` match any byte.
   * @param needle Hex string pattern to search for (e.g., 'deadbeed', 'dead**ef', 'dead??ef').
   * @param address Start address to search.
   * @param length Number of bytes to search.
   * @param all If true, returns all matches as an array. If false or omitted, returns the first match or -1n.
   * @returns Address of the pattern if found, or -1n. If all is true, returns an array of addresses.
   * @example
   * ```ts
   * const cs2 = new Process('cs2.exe');
   * // Find first match
   * const address = cs2.pattern('dead**ef', 0x10000000n, 0x1000);
   * // Find all matches
   * const allAddresses = cs2.pattern('dead**ef', 0x10000000n, 0x1000, true);
   * ```
   */
  public pattern(needle: string, address: bigint, length: number): bigint;
  public pattern(needle: string, address: bigint, length: number, all: false): bigint;
  public pattern(needle: string, address: bigint, length: number, all: true): bigint[];
  public pattern(needle: string, address: bigint, length: number, all: boolean = false): bigint | bigint[] {
    if (!Number.isSafeInteger(length) || length < 0) {
      throw new RangeError('length must be a non-negative safe integer.');
    }

    let cache = this.#patternCache;

    if (cache?.needle !== needle) {
      const test = Process.#Patterns.PatternTest.test(needle);

      if (!test) {
        return !all ? -1n : [];
      }

      const tokens = [...needle.matchAll(Process.#Patterns.PatternMatchAll)]
        .map((match) => ({ buffer: Buffer.from(match[0], 'hex'), index: match.index / 0x02, length: match[0].length / 0x02 })) //
        .sort(({ length: first }, { length: second }) => second - first);

      const anchor = tokens.shift()!;

      cache = this.#patternCache = { anchor, needle, tokens };
    }

    const { anchor, tokens } = cache;
    const { hProcess } = this;

    const information = new MemoryBasicInformation();
    const dwLength = 0x30n; /* sizeof(MEMORY_BASIC_INFORMATION) */
    const patternLength = needle.length / 0x02;
    const readableProtection =
      MemoryProtection.PAGE_READONLY | MemoryProtection.PAGE_READWRITE | MemoryProtection.PAGE_WRITECOPY | MemoryProtection.PAGE_EXECUTE_READ | MemoryProtection.PAGE_EXECUTE_READWRITE | MemoryProtection.PAGE_EXECUTE_WRITECOPY;
    const end = address + BigInt(length);
    const results: bigint[] = [];

    let carried = 0;
    let lpAddress = address;
    let previousEnd = address;

    while (lpAddress < end && VirtualQueryEx(hProcess, lpAddress, ptr(information.buffer), dwLength) === dwLength) {
      const base = information.BaseAddress;
      const next = base + information.RegionSize;

      if (next <= lpAddress) {
        throw new Error('VirtualQueryEx returned a non-advancing region.');
      }

      lpAddress = next;

      if (information.State !== MemoryAllocationType.MEM_COMMIT || (information.Protect & MemoryProtection.PAGE_GUARD) !== 0 || (information.Protect & readableProtection) === 0) {
        carried = 0;

        continue;
      }

      const regionStart = base > address ? base : address;
      const regionEnd = next < end ? next : end;

      if (regionStart !== previousEnd) {
        carried = 0;
      }

      let position = regionStart;

      while (position < regionEnd) {
        const chunkLength = Number(regionEnd - position > 0x10_0000n ? 0x10_0000n : regionEnd - position);
        const haystackLength = carried + chunkLength;

        if (haystackLength > this.#patternHaystack.byteLength) {
          const haystack = Buffer.allocUnsafe(haystackLength);
          this.#patternHaystack.copy(haystack, 0x00, 0x00, carried);
          this.#patternHaystack = haystack;
        }

        const haystack = this.#patternHaystack.subarray(0x00, haystackLength);
        const chunkAddress = position - BigInt(carried);
        const last = haystackLength - patternLength;

        this.read(position, carried === 0 ? haystack : haystack.subarray(carried));

        let start = haystack.indexOf(anchor.buffer);

        if (start !== -1) {
          outer: do {
            const matchOffset = start - anchor.index;

            if (matchOffset < 0) {
              continue;
            }

            if (matchOffset > last) {
              break;
            }

            for (const { buffer, index, length } of tokens) {
              const sourceEnd = matchOffset + index + length,
                sourceStart = matchOffset + index,
                target = buffer,
                targetEnd = length,
                targetStart = 0;

              const compare = haystack.compare(target, targetStart, targetEnd, sourceStart, sourceEnd);

              if (compare !== 0) {
                continue outer;
              }
            }

            const matchAddress = chunkAddress + BigInt(matchOffset);

            if (!all) {
              return matchAddress;
            }

            results.push(matchAddress);
          } while ((start = haystack.indexOf(anchor.buffer, start + 0x01)) !== -1);
        }

        // Retain only bytes that could begin a match in the next readable chunk.
        carried = Math.min(patternLength - 1, haystackLength);
        haystack.copy(this.#patternHaystack, 0x00, haystackLength - carried);
        position += BigInt(chunkLength);
      }

      previousEnd = regionEnd;
    }

    return !all ? -1n : results;
  }

  /**
   * Enumerates all memory regions in the process.
   * @returns Array of memory regions.
   * @example
   * ```ts
   * const cs2 = new Process('cs2.exe');
   * const regions = cs2.query();
   * ```
   */
  public query(): MemoryBasicInformation[] {
    const { hProcess } = this;

    const lpBufferBuffer = Buffer.allocUnsafe(0x30);

    const dwLength = 0x30n; /* sizeof(MEMORY_BASIC_INFORMATION) */

    const query: ReturnType<Process['query']> = [];

    let lpAddress = 0n;

    // Re-pin ptr(lpBufferBuffer) every call: the GC can relocate the buffer between iterations, so a
    // cached pointer would go stale (see pattern()) and corrupt the walk.
    const bVirtualQueryEx = VirtualQueryEx(hProcess, lpAddress, ptr(lpBufferBuffer), dwLength);

    if (!bVirtualQueryEx) {
      throw new Win32Error('VirtualQueryEx', GetLastError());
    }

    do {
      const memoryBasicInformation = new MemoryBasicInformation(Buffer.from(lpBufferBuffer));

      query.push(memoryBasicInformation);

      lpAddress = memoryBasicInformation.BaseAddress + memoryBasicInformation.RegionSize;
    } while (!!VirtualQueryEx(hProcess, lpAddress, ptr(lpBufferBuffer), dwLength));

    return query;
  }
}

export default Process;
export { Process };
