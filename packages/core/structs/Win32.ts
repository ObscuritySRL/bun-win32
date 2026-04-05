import { type FFIFunction, dlopen } from 'bun:ffi';

/**
 * Abstract base class for lazy-loaded Win32 DLL FFI bindings.
 *
 * Subclasses set `name` and `Symbols`, then call `Load` in their public
 * methods to bind individual exports on first use. For bulk, up-front binding
 * use `Preload`.
 *
 * @example
 * ```ts
 * class Kernel32 extends Win32 {
 *   protected static override name = 'kernel32.dll';
 *   protected static override readonly Symbols = {
 *     GetTickCount64: { args: [], returns: FFIType.u64 },
 *   } as const satisfies Record<string, FFIFunction>;
 *
 *   public static GetTickCount64(): bigint {
 *     return Kernel32.Load('GetTickCount64')();
 *   }
 * }
 * ```
 */
export class Win32 {
  protected static readonly Symbols: Record<string, FFIFunction> = {};
  protected static name: string;

  /**
   * Lazily binds a single DLL export and memoizes it on the subclass.
   *
   * If the symbol has already been bound (property is non-configurable), this is a no-op.
   * Subsequent calls go directly through the memoized native function.
   *
   * @param method Exact export name from `Symbols`.
   * @returns The bound native function.
   */
  protected static Load(method: string) {
    if (Object.getOwnPropertyDescriptor(this, method)?.configurable === false) {
      return (this as any)[method];
    }

    const library = dlopen(this.name, { [method]: this.Symbols[method]! });
    const propertyDescriptor = {
      configurable: false,
      value: library.symbols[method],
    };

    Object.defineProperty(this, method, propertyDescriptor);

    return (this as any)[method];
  }

  /**
   * Eagerly binds multiple DLL exports at once.
   *
   * Pass a subset of method names to bind only what you need for hot paths; when omitted,
   * all symbols declared in `Symbols` are bound. Already-bound symbols are skipped.
   *
   * @param methods Optional list of export names to bind.
   */
  public static Preload(methods?: string[]): void {
    methods ??= Object.keys(this.Symbols);

    const symbols = Object.fromEntries(
      methods.filter((method) => Object.getOwnPropertyDescriptor(this, method)?.configurable !== false).map((method) => [method, this.Symbols[method]!]), //
    );

    const library = dlopen(this.name, symbols);

    const propertyDescriptorMap = Object.fromEntries(
      Object.entries(library.symbols).map(([key, value]) => [key, { configurable: false, value }]), //
    );

    Object.defineProperties(this, propertyDescriptorMap);

    return;
  }
}
