# PROMPT_NEW.md - Generate a Win32 DLL Package

You are generating `@bun-win32/{name}` for `{name}.dll`.

This repo values correctness over speed. Use the repo scripts first, keep a resumable log, and never guess a signature from prose alone.

## 1. Start Here

Run these commands in order:

```sh
bun run scripts/scaffold.ts {name}
bun install
bun run scripts/catalog.ts {name} --log
bun run scripts/ffi-runtime.ts {name} --log
```

Notes:

- Run `bun install` at the repo root, not only inside `packages/{name}`. This repo uses workspace links.
- `packages/{name}/.generation-log.md` is mandatory while the package is in progress.
- Update the log after every meaningful step so another model can resume without redoing work.
- Delete the log only after every test passes and the package is finished.

## 2. Read Only What You Need

Read:

- Every file in `packages/template/`
- The generated `packages/{name}/.generation-log.md`
- One small reference package that is close to the target
- One additional reference package only if you need a specific pattern

Examples:

- `packages/version` for a small, clean package
- `packages/user32` for `| 0n` and `| NULL`
- `packages/kernel32` for pointer-heavy patterns and normalization functions

Do not read giant packages exhaustively unless the target truly requires it.

## 3. Sources Of Truth

Use these in order:

1. `scripts/catalog.ts` output
2. Windows SDK headers
3. Microsoft Learn
4. `scripts/ffi-runtime.ts`

What each source is for:

- `scripts/catalog.ts`: exact exports, forwarded targets, header names, C prototypes, SAL optionality
- SDK headers: exact parameter names, C types, enum types, `_opt_` annotations
- Microsoft Learn: docs URL for method comment, sizing-call behavior, remarks, requirements
- `scripts/ffi-runtime.ts`: Bun's actual JS return shapes for `u64`, `ptr`, and `void`

If these sources disagree, stop and resolve the disagreement. Do not average them together.

## 4. Forwarded Exports

Do not discard forwarded exports by reflex.

If `dumpbin` shows an export and you can map it to a real SDK prototype and Microsoft Learn page, bind it. The loader can resolve forwarded exports. `scripts/ffi-runtime.ts` proves this with `normaliz.dll`.

Only skip exports that are:

- undocumented
- internal-only
- not recoverable to a reliable header/doc pair

If the DLL is entirely undocumented/internal, stop and explain why instead of fabricating a package.

Fallback `dumpbin` command if the script is unavailable:

```sh
./bin/dumpbin.exe /EXPORTS 'C:\Windows\System32\{name}.dll'
```

Use `/EXPORTS`, not `//EXPORTS`.

## 5. FFI Mapping Rules

Choose the FFI type from the real C type and how the value is used.

### Use `FFIType.ptr` for:

- local buffers
- local strings
- local structs passed by reference
- out-parameters
- callback pointers created in this process

Ask: "Will the caller pass `buffer.ptr!` or `callback.ptr!` from local memory?"

- yes -> `FFIType.ptr`
- no -> it is probably not `FFIType.ptr`

### Use `FFIType.u64` for:

- `HANDLE`, `HWND`, `HMODULE`, `HLOCAL`, `HGLOBAL`, and other `H*` handle types
- pointer-sized unsigned integers such as `SIZE_T`, `DWORD_PTR`, `UINT_PTR`, `ULONG_PTR`
- opaque numeric tokens
- remote addresses that must not be dereferenced locally

### Use `FFIType.i64` for:

- signed pointer-sized integers such as `INT_PTR`, `LONG_PTR`, `LPARAM`, and `LRESULT`

### Use `FFIType.u32`, `i32`, `u16`, `i16`, `u8`, etc. for:

- normal scalar C types, exactly as declared

Important:

- The English word "pointer" in docs prose is not enough to justify `FFIType.ptr`.
- Read the actual typedef and the actual C prototype.
- If the caller will not pass local memory, do not use `FFIType.ptr`.

## 6. Bun Return Semantics

JS return shape follows the FFI type, not the docs wording.

- `FFIType.u64` -> `bigint`; null/zero returns become `0n`
- `FFIType.ptr` -> `Pointer | null`; null returns become `null`
- `FFIType.void` -> `undefined`

Example:

- `LocalFree` returns `HLOCAL`
- docs say it returns `NULL` on success
- Bun sees `0n`, because the binding returns `FFIType.u64`

Use `scripts/ffi-runtime.ts` as the reference for this, not memory.

## 7. Nullability

Determine nullability from the header first.

If SAL or the header marks a parameter as optional, reserved, or nullable:

- pointer-like parameter -> add `| NULL`
- handle-like parameter -> add `| 0n`

Treat these as nullable:

- `_In_opt_`
- `_Out_opt_`
- `_Inout_opt_`
- `_Outptr_opt_`
- `_Reserved_`
- `OPTIONAL`

Do not change the FFI type because a parameter is nullable. Only change the TypeScript signature.

Then check Microsoft Learn for:

- buffer-sizing patterns
- explicit "can be NULL" notes
- special return behavior

Known gotcha:

- `NormalizeString(..., null, 0)` returns an estimate, not necessarily the final written length
- allocate from the estimate
- trust the second call's written length

## 8. File Rules

### `types/{Class}.ts`

- Re-export core types instead of redefining them
- Add only DLL-specific enums/types/constants that the bindings actually use
- Keep the file clean and alphabetized

### `structs/{Class}.ts`

- Alphabetize `Symbols`
- Alphabetize public methods
- Add one Microsoft Learn URL comment above each method
- Use exact Win32 parameter names
- Each method body is one line: `return {Class}.Load('ExportName')(...)`

### `AI.md`

- Keep it generic
- Replace package/class names and example identifiers as needed
- Do not turn it into a package-specific essay

### `README.md`

- Fill the template cleanly
- Keep the quick start real and runnable

### `example/`

Minimum: 2 real examples

- 1 creative / wow example
- 1 professional / diagnostic example

Both examples must:

- start with the required JSDoc block
- list all APIs demonstrated
- include the `Run:` command
- use ANSI output for terminal rendering
- pass `tsc`

Do not change this requirement.

### `package.json`

- Add named `example:*` scripts for both examples

## 9. Implementation Workflow

Follow this order.

1. Scaffold with `scripts/scaffold.ts`
2. Run root `bun install`
3. Capture exports/prototypes with `scripts/catalog.ts {name} --log`
4. Capture Bun runtime semantics with `scripts/ffi-runtime.ts {name} --log`
5. Read the log, template files, and only the reference packages you actually need
6. Write `types/{Class}.ts`
7. Write `structs/{Class}.ts`
8. Smoke test:

   ```sh
   bun run packages/{name}/index.ts
   cd packages/{name} && bunx tsc --noEmit
   ```

9. Run the audit:

   ```sh
   bun run scripts/audit.ts {name}
   ```

10. Fix every audit issue before moving on
11. Write `AI.md`, `README.md`, examples, and `package.json` scripts
12. Run both examples for real
13. Final verification:

```sh
bun run packages/{name}/index.ts
cd packages/{name} && bunx tsc --noEmit
bun run scripts/audit.ts {name}
bun run example:<creative-script>
bun run example:<professional-script>
```

14. Update the root `README.md` only after the package itself is correct
15. Delete `.generation-log.md` only at the very end

## 10. What The Audit Does And Does Not Catch

`scripts/audit.ts` is mandatory, but it is not magic.

It catches:

- FFI type vs TS type mismatches
- many header-to-binding mismatches
- parameter count problems

It does not guarantee correctness if both your FFI type and TS type are wrong in the same direction.

You still must verify the header prototype while writing the package.

## 11. Hard Rules

- Never fabricate a docs URL
- Never guess a C type from the English description
- Never use `as any` or `as unknown as`
- Never widen types just to make `tsc` pass
- Never skip the log while the package is in progress
- Never skip real example runs

## 12. Completion Checklist

- Every export from `dumpbin` is accounted for
- Forwarded exports were handled intentionally
- Every method uses exact Win32 parameter names
- Every signature matches the header prototype
- Nullable pointers use `| NULL`
- Nullable handles use `| 0n`
- `bun run scripts/audit.ts {name}` reports zero issues
- Both examples run successfully
- `AI.md` stayed generic
- The root `README.md` was updated after the package passed

If any item is not true, the package is not done.
