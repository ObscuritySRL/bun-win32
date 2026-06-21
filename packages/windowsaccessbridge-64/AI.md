# AI Guide for @bun-win32/windowsaccessbridge-64

How to use this package, not what the API does.

## Usage

```ts
import WindowsAccessBridge, { AccessibleInterface } from '@bun-win32/windowsaccessbridge-64';

// Methods bind lazily on first call
const result = WindowsAccessBridge.isJavaWindow(hWnd);

// Preload: array, single string, or no args (all symbols)
WindowsAccessBridge.Preload(['Windows_run', 'getAccessibleContextInfo']);
WindowsAccessBridge.Preload('Windows_run');
WindowsAccessBridge.Preload();
```

## Where To Look

| Need                                | Read                            |
| ----------------------------------- | ------------------------------- |
| Find a method or its upstream link  | `structs/WindowsAccessBridge.ts` |
| Find types, enums, constants        | `types/WindowsAccessBridge.ts`   |
| Quick examples                      | `README.md`                     |

`index.ts` re-exports the class and all types — import from `@bun-win32/windowsaccessbridge-64` directly.

## Calling Convention

All documented `WindowsAccessBridge-64.dll` exports are bound. Each method maps 1:1 to its DLL export. Names, parameter names, and order match the upstream OpenJDK Java Access Bridge headers (`AccessBridgeCalls.h`, `AccessBridgePackages.h`). The DLL exports use the lower-camelCase internal names (`getAccessibleContextInfo`, `setFocusGainedFP`), which is what the methods are named.

### Strings

The Java Access Bridge is wide-only: text is UTF-16LE. Out-parameters that receive text take a caller-allocated buffer pointer; `const wchar_t *` inputs take a NUL-terminated UTF-16LE buffer.

```ts
const role = Buffer.from('push button\0', 'utf16le'); // LPCWSTR
WindowsAccessBridge.getParentWithRole(vmID, ac, role.ptr);

// Reading a wide string back from a buffer:
const text = buf.toString('utf16le').replace(/\0.*$/s, '');
```

### Return types

- `HWND`, `AccessibleContext`, `JOBJECT64`, etc. → `bigint`
- `BOOL`, `INT`, `JINT` → `number`
- Pointer/out-parameters → `Pointer`
- Win32 `BOOL` is `number` (0 or non-zero), **not** JS `boolean`. Do not compare with `=== true`.

### Pointers, handles, out-parameters

- **Pointer** params (struct/buffer out-params, `wchar_t *`, callback FPs): pass `buffer.ptr` from a caller-allocated `Buffer`.
- **Handle/object** params (`HWND`, `AccessibleContext`, `JOBJECT64`, …): pass a `bigint` value.
- **Out-parameters**: allocate a `Buffer`, pass `.ptr`, read the result after the call.

```ts
const out = Buffer.alloc(8);
WindowsAccessBridge.getAccessibleContextFromHWND(hWnd, vmID.ptr, out.ptr);
const accessibleContext = out.readBigUInt64LE(0);
```

## Errors and Cleanup

Return values are raw. `Windows_run` must be called once to initialize the bridge, and the calling process must pump the Windows message queue so each Java VM can register its windows; most query functions then round-trip to the JVM and need a live Java application to return data. Java object handles obtained from the bridge are your responsibility — release them with `releaseJavaObject`.
