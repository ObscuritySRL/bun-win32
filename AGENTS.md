# AGENTS

Rules for working in **bun-win32** — a monorepo of zero-dependency Win32 FFI bindings for [Bun](https://bun.sh) on Windows. Follow them exactly.

Every system DLL is its own `@bun-win32/{name}` package (`packages/{name}/`) that binds the DLL's exports through `bun:ffi`. There is no marshaling layer: after the first call resolves a symbol via `dlopen`, every subsequent call is a direct native pointer invocation.

> **The deep playbook is [`PROMPT.md`](./PROMPT.md).** It is the authoritative, step-by-step guide for generating and completing a package (FFI type mapping, nullability, examples, audits). This file is the day-to-day operating manual: the rules, the layout, the toolchain, and the gates. When the two overlap, they agree; when you need detail, read `PROMPT.md`. Each package also ships an `AI.md` documenting its own binding contract.

---

## Core Principles

- **Plan before implementing.** Read and understand the problem, the existing code, and the surrounding context before writing anything. Do not guess at what code does — read it.
- **No fabrication — verify every claim.** This repo binds a real OS. Never guess a signature, type, nullability, or export. Verify against `dumpbin` (the source of truth for what exists), the Microsoft Learn docs page, and the Windows SDK header. Incorrect bindings segfault; incorrect information is worse than none. If you do not know, say so.
- **Minimal, surgical diffs.** Change only what the task requires. Do not "clean up," reformat, or refactor code you were not asked to touch. Do not mutate already-shipped bindings on a hunch.
- **No premature abstraction.** No helpers, wrappers, or utilities unless explicitly requested. Three similar lines beat a clever abstraction. Public method bodies are deliberately one line each.
- **Verify at every step.** After every meaningful change, prove it works: run the file (`bun run …`), type-check (`bunx tsc --noEmit`), and run the relevant audit. Do not pile changes on a broken state. Do not move on until the current step is verified.

---

## Repository Layout

```
packages/
  core/          @bun-win32/core      — the only non-binding package: Win32 base class,
                                         shared types (DWORD, HANDLE, …), runtime/extensions.ts
  template/      @bun-win32/template  — scaffold; WIN32_CLASS placeholders, no example/ dir
  all/           @bun-win32/all       — aggregator: depends on every package, re-exports each
                                         PascalCase class; home of the flagship example/ demos
  bun-win32/     bun-win32            — unscoped alias; `export * from '@bun-win32/all'`
  terminal/      @bun-win32/terminal  — high-performance terminal rendering engine (binds kernel32)
  {name}/        @bun-win32/{name}    — one package per system DLL (advapi32, kernel32, user32, …)
scripts/         repo automation (see Commands) — run with `bun run scripts/{name}.ts`
PROMPT.md        the package-generation playbook
biome.json       formatter config (Biome is the formatter; linter & assist are off)
bunfig.toml      pins linker = "hoisted"
tsconfig.json    strict; shared by every package
```

There are 117 packages. Class names are PascalCase; a few preserve native DLL casing — `OpenGL32`, `GLU32`, `Ws2_32`, `Xaudio2_9`, `Xinput1_4`, `Xinput9_1_0` — and `opengl32`/`glu32` keep native function names (`glBegin`, `gluSphere`).

### Per-package file layout

```
packages/{name}/
  index.ts                 default-import the class, re-export types — e.g. for psapi:
                             import Psapi from './structs/Psapi'; export * from './types/Psapi'; export default Psapi;
  structs/{Class}.ts       Symbols (FFI decls) + public static methods
  types/{Class}.ts         type aliases, enums, constants (re-export shared types from core)
  example/                 runnable demos (≥ 2: one creative, one professional)
  AI.md  README.md  package.json  tsconfig.json
```

No other files or directories in a package. `core` exports `{ Win32 }` (named) instead of a default.

---

## Architecture: the `Win32` Base Class

Every package subclass extends `Win32` from `@bun-win32/core`. You do **not** call `dlopen` yourself.

1. `protected static override readonly name = '{name}.dll';`
2. Override `Symbols` with the FFI declarations: `as const satisfies Record<string, FFIFunction>`.
3. Expose `public static` methods whose body is always one line: `return {Class}.Load('ExportName')(args);`

- **`Load(method)`** — lazy. On first call, `dlopen`s **only that one export**, then memoizes the native function with `Object.defineProperty` (non-configurable). Zero startup cost; each export binds at most once.
- **`Preload(methods?)`** — eager. Binds all (or a named subset of) symbols up front for hot paths; skips already-bound ones. Destructure **after** `Preload`, or you capture the lazy wrapper instead of the native function.
- **`core/runtime/extensions.ts`** is imported for its side effect: it adds a non-enumerable `.ptr` getter to `ArrayBuffer`, `Buffer`, `DataView`, and the `TypedArray`s. That is why examples write `buffer.ptr`.

---

## Toolchain

- **Runtime: Bun.** Default to Bun in everything. Use Bun-native APIs (`Bun.file`, `Bun.write`, `Bun.env`, `Bun.argv`, `Bun.sleep`, `bun:test`) over the `process.*`/Node equivalents. Never use `npm`, `yarn`, or `npx`.
- **Formatter: Biome** (`@biomejs/biome`, formatter only — linter and assist are disabled). Settings are fixed in `biome.json`: 2-space indent, **line width 240**, LF line endings; JS uses **single quotes**, **always semicolons**, **all** trailing commas, **always** arrow parens. Prettier has been removed — do not reintroduce it or any other formatter/linter.
- **TypeScript: strict**, shared `tsconfig.json`: `strict`, `verbatimModuleSyntax`, `noImplicitOverride`, `moduleResolution: "bundler"`, `allowImportingTsExtensions`, `types: ["bun"]`, `skipLibCheck`. (`noUncheckedIndexedAccess` is intentionally `false`.)
- **`bunfig.toml` pins `linker = "hoisted"`** so the IDE's TS server sees `@types/bun`, `@types/node`, and `bun-types` hoisted at the repo root. Do not change the linker.
- **No root `package.json` scripts.** Everything runs directly via `bun run` / `bunx`. Versions are pinned at the root and inherited by every package (packages declare only `peerDependencies: { typescript: "^5" }`).

### Commands

```bash
# Verify (run constantly)
bun run packages/{name}/index.ts          # smoke-test a package loads
bun run packages/{name}/example/foo.ts    # run a demo
bunx tsc --noEmit                          # type-check
bunx biome format --write packages/{name}  # format

# Type gates — must report zero problems before anything ships
bun run scripts/audit.ts {name}            # FFI symbol ↔ TS type ↔ SDK-header consistency (--all, --fix)
bun run scripts/nullcheck.ts {name}        # SAL-driven | NULL / | 0n nullability (--all, --fix, --strict)
bun run scripts/preflight.ts               # pre-publish lockfile-staleness gate

# Generating / completing a package
bun run scripts/doctor.ts                  # check prerequisites (platform, Bun, ripgrep, SDK, dumpbin)
bun run scripts/bootstrap.ts {name}        # orchestrates: doctor → scaffold → install → catalog → ffi-runtime → stub
bun run scripts/scaffold.ts {name}         # copy template → packages/{name}, substitute placeholders
bun run scripts/catalog.ts {name} --json   # DLL exports ∩ SDK-header C prototypes
bun run scripts/stub.ts {name}             # catalog JSON → paste-ready Symbols + method stubs
bun run scripts/ffi-runtime.ts             # probe Bun FFI return-value shapes (kernel32/normaliz)

# Dump exports (the source of truth for what may be bound)
./bin/dumpbin.exe //EXPORTS 'C:\Windows\System32\{name}.dll'
```

---

## FFI Binding Rules

The full treatment is `PROMPT.md` §5–§9. The non-negotiables:

- **`FFIType.u64` (TS `bigint`)** for **all** handles (`HANDLE`, `HWND`, `HKEY`, …), **all** pointer-sized integers (`SIZE_T`, `*_PTR`, `WPARAM`/`LPARAM`/`LRESULT`, `LARGE_INTEGER`), and **remote/opaque pointers** (addresses in another process — never dereferenced locally). A name containing `PTR` does **not** make it a pointer.
- **`FFIType.ptr` (TS `Pointer`)** for **local** data the caller allocates — `LP*`/`P*` buffers, strings, by-ref structs — and for **callback pointers** the caller builds with `CFunction`/`JSCallback`.
- **Decision rule:** "Does the caller pass `.ptr` from a `Buffer`/`TypedArray` they allocated?" Yes → `ptr`. No → `u64`.
- **Dual-representation types — pin with a generic.** **When** one Microsoft type legitimately reaches the binding as a *local* `Pointer` in some exports and a *remote / by-value 64-bit address* (`bigint`) in others, neither single TS type fits: a bare `bigint` rejects the local `Pointer`, and a bare `Pointer` can't hold all 64 bits **and** `FFIType.ptr` throws on a non-zero `bigint` (`FFIType.u64` accepts both a number and a bigint). Don't force one; make the alias generic over its representation and pin it per call site — the FFI symbol slot still differs per use (`ptr` vs `u64`), and the bare alias keeps the union default:

  ```ts
  export type LPTHREAD_START_ROUTINE<T extends Pointer | bigint = Pointer | bigint> = T;
  // CreateThread          (same-process JSCallback/GetProcAddress pointer): lpStartAddress: LPTHREAD_START_ROUTINE<Pointer>  + FFIType.ptr
  // CreateRemoteThread/Ex (remote start address, e.g. a VirtualAllocEx result): lpStartAddress: LPTHREAD_START_ROUTINE<bigint>   + FFIType.u64
  ```

  **Where** to use it: any MS type that is a local pointer in some functions and a remote/opaque address in others. Concretely: `LPTHREAD_START_ROUTINE` (`CreateThread` ⟶ `<Pointer>` vs `CreateRemoteThread`/`…Ex` ⟶ `<bigint>`); and the `LPVOID` / `LPCVOID` / `PVOID` **address** params and returns (`lpAddress`, `lpBaseAddress`, `VirtualAddress`, the alloc/map return values — `<bigint>` + `u64`) versus those **same** aliases used for genuine **local buffers** (`lpBuffer` etc. — `<Pointer>` + `ptr`, the default). This keeps the real Microsoft type name on every wrapper while each function accepts exactly the representation it can use, cast-free. **Don't** reach for it when a type is always one representation (handles, `SIZE_T`, plain buffers) — a non-generic alias is clearer.
- **By-value small structs** (e.g. 8-byte `POINT`) are packed into a `bigint` and passed as `u64` (see `packPOINT` in `user32`).
- **NULL-return representation follows the FFI type:** `u64 → 0n`, `ptr → null`, `u32 → 0`. A function that "returns NULL on success" with an `HLOCAL` return type returns `0n`, not `null`; the caller checks `=== 0n`.
- **SAL is encoded by what kind of fact it is: nullability in the TYPE, direction in the NAME.** This is SAL-header-first and changes **only the TS signature — never the FFI `Symbols` map or the base Microsoft type.** Cross-check the docs page (C prototype, Parameters, Remarks). Run `nullcheck.ts` to audit. Full rules in **SAL semantics** below; in brief:
  - **Nullability → the type**, via two representation-aware markers from `@bun-win32/core` (the null sentinel is derived from `T`: `0n` for bigint-based types — `HANDLE`, by-value addresses, `*_PTR`; `null` for `Pointer`-based `LP*`/`P*` buffers): `OPTIONAL<T>` for a formally optional param (SAL `_*opt_` / `[*, optional]`), `NULLABLE<T>` for a plain `[in]`/`[out]` param the docs say "can be NULL" / "Specify NULL to …". Required params are bare; a `_Reserved_` param documented "must be NULL/zero" is typed `NULL` (only the rare reserved-but-takes-a-value is `OPTIONAL`).
  - **Direction → the name**, by suffixing the exact Win32 parameter name: `_Out_`/`[out]` → `name_out`, `_Inout_`/`[in, out]` → `name_in_out`, `_In_` → bare. (Direction is usage metadata, not a value-contract fact, so it does not belong in the type.)
  - Compose them independently: an optional out-param is `lpcbNeeded_out: OPTIONAL<LPDWORD>`.
- **No type casts. Ever.** No `as any`, no `as unknown as T`, no forced casts — in structs, types, examples, or tests. If the types disagree, the FFI mapping or the alias is wrong; fix the root cause. The only allowed narrowing is `!` (non-null assertion), `BigInt()` (number → handle), and explicit annotations to break circular inference. Prefer `satisfies` over `as`; `as const` only for literal narrowing.

### SAL semantics — nullability in the type, direction in the name

Bindings faithfully mirror each function's Microsoft SAL contract, encoded by **what kind of information it is**. Neither marker ever touches the FFI `Symbols` map, the base Microsoft type, or the return type — they change only the parameter's TS signature, and they compose independently.

**Nullability is a value-contract fact (it changes which values are valid) → it lives in the TYPE.** Two markers in `@bun-win32/core`, both representation-aware (the null sentinel is resolved from `T`, so you never write it and can never mismatch it):

```ts
export type OPTIONAL<T> = [T] extends [bigint] ? T | 0n : T | null;
export type NULLABLE<T> = [T] extends [bigint] ? T | 0n : T | null;
```

`[T] extends [bigint]` (non-distributive) yields `T | 0n` for bigint-based types (`HANDLE`, `HMODULE`, by-value addresses, `LPVOID<bigint>`, `*_PTR`) and `T | null` for `Pointer`-based buffers (`LP*` / `P*`). Choose between the two by the SAL/prose, and they resolve identically — the **name carries the Microsoft intent**:

- **`OPTIONAL<T>`** — the parameter is formally optional: SAL `_In_opt_` / `_Out_opt_` / `[in, optional]` / `[out, optional]`. "You may omit it." (A `_Reserved_` param documented "must be NULL/zero" is **not** this — it is typed `NULL`; see below.)
- **`NULLABLE<T>`** — SAL is plain `[in]` / `[out]` but the docs say the value may be NULL: "This parameter can be NULL", "may be NULL", "Specify NULL to …" (defaults, system-chosen addresses, sizing calls).
- A **required** param is bare (`HANDLE`, `LPDWORD`). A **must-be-null reserved** param stays `NULL` (it is only ever null — not "T or null").
- `OPTIONAL` / `NULLABLE` apply **only to types that have a null sentinel** — pointers (`LP*` / `P*` → `null`) and handles / by-value addresses (→ `0n`). A **by-value scalar** (`DWORD`, `ULONG`, `UINT`, `BOOL`, `INT`) marked `_*opt_` stays **bare**: its "optional" means *pass 0 / a default value*, not null — there is no null to represent, and `T | null` on a `u32`/`i32` arg is wrong.
- When the SAL annotation and the prose disagree, the **SAL annotation governs** the optional-vs-required decision; "can be NULL" prose on a non-`_opt_` param is what makes it `NULLABLE` rather than `OPTIONAL`.

**Direction is usage metadata (it does not change the type) → it lives in the NAME.** Suffix the exact Win32 parameter name so the MSDN lookup survives (`lpcbNeeded` stays recognizable inside `lpcbNeeded_out`):

- `_Out_` / `[out]` → **`name_out`**
- `_Inout_` / `[in, out]` → **`name_in_out`** (spelled out, not `_inout`, so it reads as "in and out" without SAL jargon)
- `_In_` → **bare** (the default — mark the exceptions, not the norm). Returns are never suffixed.

**Composition** — the two are orthogonal (type = *what can I pass*, name = *does the function write here*):

```ts
// EnumProcessModules: _In_ HANDLE, _Out_ HMODULE*, _In_ DWORD, _Out_ LPDWORD
public static EnumProcessModules(hProcess: HANDLE, lphModule_out: LPHMODULE, cb: DWORD, lpcbNeeded_out: LPDWORD): BOOL
// GetModuleBaseNameW: _In_opt_ hModule, _Out_ buffer
public static GetModuleBaseNameW(hProcess: HANDLE, hModule: OPTIONAL<HMODULE>, lpBaseName_out: LPWSTR, nSize: DWORD): DWORD
// QueryWorkingSetEx: _Inout_ pv ;  EnumPageFilesW: _In_ pContext "can be NULL"
public static QueryWorkingSetEx(hProcess: HANDLE, pv_in_out: PVOID, cb: DWORD): BOOL
public static EnumPageFilesW(pCallBackRoutine: PENUM_PAGE_FILE_CALLBACKW, pContext: NULLABLE<LPVOID>): BOOL
```

Reference implementation: `packages/psapi/structs/Psapi.ts`.

### Symbols, methods, and types

- **Bind only `dumpbin`-confirmed exports.** Bind both A and W variants. Never bind forwarded functions or undocumented internals. Use the exact export name (capitalization matters).
- **One Microsoft Learn URL comment** above each public method.
- **Exact Win32 parameter names** — `hWnd`, `lpBuffer`, `dwSize`. This is the **one** exception to the no-abbreviations rule; everywhere else use full words (`processIdentifier`, not `procId`).
- **Alphabetize everything** ASCIIbetically (uppercase before lowercase): symbols, methods, type aliases, enums, enum members — unless order is semantically meaningful.
- **Hex literals with numeric separators** for sizes, offsets, flags, and constants (`0x0000_0001`, `0x238`).
- **`types/{Class}.ts`** re-exports shared types from `@bun-win32/core` (`export type { … } from …`); defines only types this DLL actually uses; ordering is imports → core re-exports → constants → enums → aliases, interleaved in one alphabetized block.

---

## TypeScript Conventions

- Separate type-only imports with `import type`.
- Prefer `#privateField` syntax over the `private` keyword.
- Use explicit `void` when deliberately discarding a return value; honor `noImplicitOverride` with `override`.
- Never weaken type safety to make code compile. Prefer `unknown` + type guards over `any`.

---

## Comments & Documentation

- **`/** @inheritdoc */`** on the `Symbols` block — nothing more verbose.
- **No section comment blocks or decorative headers** (`// ====`, `// ----`, `// Scalar types`). Keep comments terse and value-add: non-obvious struct layouts, buffer offsets, bit manipulation only. Do not restate code, and do not add comments to lines you did not change.
- **Do not create new top-level docs** (`README`, `CHANGELOG`, `PROGRESS.md`, `TODO.md`) unless explicitly requested. Per-package `README.md` and `AI.md` follow the templates; keep `AI.md` generic (substitute only class/DLL/package/path names).

---

## Examples / Demos

Each binding package ships **at least two** examples in `example/`: one **creative** (a "you can do that with just FFI?" demo) and one **professional** (an exhaustive, richly formatted diagnostic). The `all` package is the showcase: GPU, audio, terminal, and hardware demos.

- **JSDoc header is mandatory** on every example: Title, Description, **APIs demonstrated** (bulleted, with a short parenthetical each, grouped by package when cross-package), and a `Run: bun run example/{file}.ts` line.
- **`Preload` the APIs at the top.** Clear variable names, no abbreviations, no comment blocks. Check return values where failure would produce confusing output. Cross-package imports are encouraged where natural.
- **Console rendering uses ANSI escape codes** via `console.log` / `process.stdout` — **not `WriteConsoleW`**, which fails silently in ConPTY (Windows Terminal, VS Code) and pipes. Kernel32 console-setup APIs (`GetStdHandle`, `Get`/`SetConsoleMode` for VT, `SetConsoleCursorInfo`, `SetConsoleTitleW`) are fine.
- **Verify visual demos visually, not numerically.** A world-space or pixel-count check is easily fooled. Capture the rendered output (back-buffer / PNG) and look at it. Demos honor headless env vars — `DEMO_DURATION_MS` (self-exit), plus capture/validation hooks like `CAPTURE_PNG` / `BENCH` / `SELFSHOT` on the demos that support them.
- **Shared helpers** live in `packages/all/example/` with a `_` prefix: `_capture.ts` (DXGI desktop duplication), `_gpu.ts` (D3D11 COM-vtable invoker), `_gpu3d.ts` (depth buffer + mesh), `_audio.ts` (WinMM capture + XAudio2 output), `_snapshot.ts` (back-buffer → PNG), `_hud.ts` (GDI HUD composite). The `terminal` package is the dedicated TTY engine (`pixel`, `char`, `glyphs`, `png`, `input`, `loop`, `pacing`, …).
- **Tests live in-example** — `example/{name}.test.ts`, or the example *is* the test. Never a separate `test/` directory. Use `bun:test`; add no other test framework.
- **`package.json` scripts:** binding packages name examples `example:{name}`; the `all` showcase uses bare demo names (`event-horizon`, `blackhole`, …).

---

## Releasing

After bumping versions, **regenerate the lockfile first**. Plain `bun install` does **not** rewrite `bun.lock`'s workspace version records, so `bun publish` would pin the **old** exact versions into dependents (`@bun-win32/all`, …) that reference them via `workspace:*`.

```bash
rm bun.lock && bun install                                          # refresh workspace version records
bun run scripts/preflight.ts                                        # gate: fail if lockfile is stale
bun run scripts/nullcheck.ts --all && bun run scripts/audit.ts --all # type gates: zero problems
# publish each package on ONE OTP — scoped @bun-win32 is private-by-default:
cd packages/{name} && bun publish --access public --otp <code>
```

- **Always `bun publish`, never `npm publish`** — only Bun resolves the `workspace:*` references.
- **Always `--access public`** — `@bun-win32` is private-by-default on npm. Pass the flag on every publish; most packages have no `publishConfig`, so do not rely on it.
- **Batch the whole release on a single OTP.** Loop every package's `bun publish` on one code; never prompt per package.

---

## Commits

[Conventional Commits](https://www.conventionalcommits.org/): `type(scope): description` — lowercase, imperative, no trailing period. `type` ∈ `feat fix refactor docs test chore perf ci build style`. Real examples from this repo:

```
feat(scripts): add nullcheck (SAL nullability/type auditor) + preflight (lockfile gate)
fix(types): add missing nullable unions + correct param types across 25 packages
chore(release): terminal 1.1.1 — pull in kernel32 1.0.25 (nullable/param-type fixes)
```

Commit or push only when asked.

---

## Repository Hygiene — Never Commit These

`.gitignore` excludes disk-only working files; do not `git add` them or rely on them being present for other agents:

- **`.scratch/`** (root and per-package), **`DISCORD_POST.md`**, **`MISSING_APIS.md`**, **`TODO.md`**, `.claude/`, `node_modules`.
- **Screenshots** under `packages/all/screenshots/` are ignored except the curated hero shots whitelisted with `!`. To commit a new showcase capture, add a matching `!packages/all/screenshots/{name}.png` line.
- **`AGENTS.*.md`** (local variants) is ignored; this `AGENTS.md` and the root `CLAUDE.md` are tracked.

---

## Things to Never Do

- Add helpers/utilities, abstractions, or polyfills that were not requested.
- Reformat broadly, or change formatting on lines you are not already editing.
- Use `as any` / `as unknown as T` or any cast that bypasses the type system — fix the types instead.
- Use shortform variable names (the sole exception is preserved Win32 parameter names in bindings).
- Mutate shipped bindings to silence an audit hint; `audit.ts`/`nullcheck.ts` emit accepted-convention notices (`SPURIOUS`, SDK suggestions) that are usually correct per MSDN — verify, don't blindly "fix."
- Add licenses, headers, new linters, or new tooling.
- Change public API (export shape, signatures, type contracts) without explicit request.
- Leave the codebase in a broken or unverified state.
