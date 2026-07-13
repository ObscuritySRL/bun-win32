---
name: bun-win32
description: >
  Win32 FFI binding lifecycle for @bun-win32/* packages (Win32 DLL bindings
  via bun:ffi on Windows). Use when generating a new package from a DLL,
  auditing FFI↔TS↔header consistency, applying the SAL vocabulary
  (Optional<T> / Nullable<T>, name_out / name_in_out), or understanding the
  bootstrap→catalog→stub→audit→nullcheck pipeline.
  Strict TypeScript; Bun runtime; Biome formatting.
engines:
  - claude-code
  - opencode
---

# bun-win32 Skill

Win32 FFI binding development lifecycle for the `bun-win32` monorepo.

## Repository Context

```
WORKING_DIR (repo root)
  packages/       one @bun-win32/* package per system DLL
  scripts/        repo automation scripts
  PROMPT.md       authoritative playbook (FFI rules, nullability, audits)
  AGENTS.md       operating rules — read before touching bindings
  skill/bun-win32/SKILL.md  ← this file
```

**All commands run from WORKING_DIR** (the repo root).

## Lifecycle Commands

```bash
# 1. Check prerequisites (platform Windows, Bun ≥1.1, ripgrep, SDK, dumpbin)
bun run scripts/doctor.ts

# 2. Full pipeline: doctor → scaffold → install → catalog → ffi-runtime → stub
bun run scripts/bootstrap.ts {name} [--skip-doctor] [--skip-install] [--rg=<path>] [--dll=<path>]

# 3. Individual steps
bun run scripts/scaffold.ts {name}               # template → packages/{name}
bun run scripts/catalog.ts {name} --json         # DLL∩SDK symbols
bun run scripts/ffi-runtime.ts                   # FFI return shapes
bun run scripts/stub.ts {name} [--class=C]       # paste-ready stubs

# 4. Auditing (run after writing bindings)
bun run scripts/audit.ts {name}                  # FFI↔TS↔header consistency (--all, --fix)
bun run scripts/nullcheck.ts {name}              # SAL nullability (--all, --fix, --strict)
bunx tsc --noEmit                                # type-check the package
```

## Release

```bash
rm bun.lock && bun install
bun run scripts/preflight.ts
bun run scripts/nullcheck.ts --all && bun run scripts/audit.ts --all
cd packages/{name} && bun publish --access public --otp <code>
```

## Scripts Reference

| Script | What it does |
|---|---|
| `scripts/doctor.ts` | Prerequisites checker |
| `scripts/bootstrap.ts` | Orchestrated full pipeline |
| `scripts/catalog.ts` | dumpbin exports ∩ SDK headers → JSON |
| `scripts/scaffold.ts` | Template → package skeleton |
| `scripts/ffi-runtime.ts` | Probe FFI return-value shapes |
| `scripts/stub.ts` | catalog JSON → Symbols + method stubs |
| `scripts/audit.ts` | FFI↔TS↔header consistency auditor |
| `scripts/nullcheck.ts` | SAL-driven nullability auditor |
| `scripts/preflight.ts` | Lockfile staleness gate |

## Key Reference Files

- `AGENTS.md` — binding rules, toolchain, FFI rules, prohibitions
- `PROMPT.md` — deep playbook for FFI type mapping, nullability, audits
- `packages/core/AI.md` — `@bun-win32/core` contract (Win32 base class, `.ptr` extension, types)
- `packages/all/AI.md` — `@bun-win32/all` contract (re-export aggregator, when to use)

## FFI Type Quick Reference

| Win32 type | FFI | TS |
|---|---|---|
| `HANDLE`, `HWND`, `HKEY`, `HMODULE`… | `FFIType.u64` | `bigint` |
| `SIZE_T`, `*_PTR`, `LPARAM`, `LRESULT`, `WPARAM`, `LARGE_INTEGER` | `FFIType.u64` | `bigint` |
| `DWORD`, `UINT`, `BOOL`, `HRESULT`, `INT`, `LONG`, `WORD`, `BYTE` | `FFIType.u32` / `i32` | `number` |
| `LPCWSTR`, `LPSTR`, `LPDWORD`, `LPBYTE`, `PLARGE_INTEGER`… | `FFIType.ptr` | `Pointer` |
| `void` | `FFIType.void` | `void` |

**Decision rule:** Does the caller pass `.ptr` from a `Buffer`/`TypedArray` they allocated? Yes → `ptr`. No → `u64`. A name containing `PTR` does **not** make it a pointer.

**NULL:** `u64 → 0n`, `ptr → null`, `u32 → 0`.

**Dual-representation types.** When one Microsoft type arrives as a *local* `Pointer` in some exports and a *remote / by-value 64-bit address* in others, make the alias generic and pin it per call site — the FFI slot differs per use:

```ts
export type LPTHREAD_START_ROUTINE<T extends Pointer | bigint = Pointer | bigint> = T;
// CreateThread       → LPTHREAD_START_ROUTINE<Pointer> + FFIType.ptr
// CreateRemoteThread → LPTHREAD_START_ROUTINE<bigint>  + FFIType.u64
```

This applies to `LPVOID` / `LPCVOID` / `PVOID`: a genuine local buffer (`lpBuffer`) is `<Pointer>` + `ptr`, while an **address** (`lpAddress`, `lpBaseAddress`, alloc/map return values) is `<bigint>` + `u64`. Do not reach for it when a type is always one representation.

## SAL Conventions

Nullability is a value-contract fact → it lives in the **type**. Direction is usage metadata → it lives in the **name**. Neither ever touches the FFI `Symbols` map, the base Microsoft type, or the return type; they compose independently. Both markers come from `@bun-win32/core` and resolve their own null sentinel from `T` (`0n` for bigint-based types, `null` for `Pointer`-based buffers):

| SAL / docs | Encoding |
|---|---|
| `_In_opt_`, `_Out_opt_`, `[in, optional]`, `[out, optional]` | `Optional<T>` |
| plain `[in]` / `[out]` + docs say "can be NULL" / "Specify NULL to …" | `Nullable<T>` |
| required param | bare (`HANDLE`, `LPDWORD`) |
| `_Reserved_`, documented "must be NULL/zero" | `NULL` |
| by-value scalar (`DWORD`, `BOOL`, `UINT`…) marked `_*opt_` | **bare** — "optional" means pass 0, there is no null |
| `_Out_` / `[out]` | name suffix `name_out` |
| `_Inout_` / `[in, out]` | name suffix `name_in_out` |
| `_In_` | bare name (mark the exceptions, not the norm) |

```ts
public static GetModuleBaseNameW(hProcess: HANDLE, hModule: Optional<HMODULE>, lpBaseName_out: LPWSTR, nSize: DWORD): DWORD
public static EnumPageFilesW(pCallBackRoutine: PENUM_PAGE_FILE_CALLBACKW, pContext: Nullable<LPVOID>): BOOL
public static QueryWorkingSetEx(hProcess: HANDLE, pv_in_out: PVOID, cb: DWORD): BOOL
```

When SAL and prose disagree, the **SAL annotation governs** optional-vs-required; "can be NULL" prose on a non-`_opt_` param is what makes it `Nullable` rather than `Optional`. Reference implementation: `packages/psapi/structs/Psapi.ts`. Audit with `nullcheck.ts`.

## Prohibited

- Bind exports not confirmed by `dumpbin //EXPORTS`
- Guess types/nullability — always verify vs SDK header + MS Learn
- Use `as any` / forced casts — fix the FFI mapping instead
- Reformat untouched files
- Mutate a shipped binding to silence an audit hint — `audit.ts` / `nullcheck.ts` emit accepted-convention notices (`SPURIOUS`, SDK suggestions) that are usually correct per MSDN; verify, don't blindly "fix"
- Ship without a clean `bunx tsc --noEmit` and a reviewed `audit.ts --all` / `nullcheck.ts --all`
