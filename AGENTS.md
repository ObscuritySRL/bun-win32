# AGENTS

Rules for working in this repository. Follow them exactly.

---

## Core Principles

- **Plan before implementing.** Read and understand the problem, the existing code, and the surrounding context before writing anything. Do not guess at what code does — read it.
- **Minimal, surgical diffs.** Change only what is necessary to accomplish the task. Do not "clean up," reformat, or refactor code you were not asked to touch.
- **No fabrication.** Never guess, hallucinate, or fabricate information. If you do not know something, say so. Incorrect information is worse than no information.
- **No fluff.** No unnecessary abstractions, helpers, utilities, or wrapper functions unless explicitly requested. Three similar lines are better than a premature abstraction.
- **Test at every step.** After every meaningful change, verify it works. Run the full test suite when one exists. When no tests exist, smoke-test: run the program, call the function, type-check (`tsc --noEmit`), or otherwise prove the change does not break anything. Do not move on until the current step is verified. Do not leave the codebase in a broken state.

---

## Style and Formatting

- **Mirror the repo.** Match the language, formatting, naming conventions, and patterns already established in the project. When in doubt, look at neighboring code.
- **Respect tooling config.** Follow whatever Prettier, ESLint, Biome, or other formatter/linter configs exist. Honor inline ignore directives.
- **Alphabetize unordered things.** Sort imports, exports, object keys, enum members, type fields, union members, switch cases, class names, and map/set initializers in ASCIIbetical order (case-sensitive ascending sort where uppercase letters precede lowercase, e.g., `Z` before `a`) — unless order is semantically meaningful.
- **Naming: full words, no abbreviations.** Write `address`, not `addr`. Write `processIdentifier`, not `procId`. Write `modulePath`, not `modPath`. Names must be immediately understandable without surrounding context.
- **Strings and formatting.** Follow the repo's existing convention (single vs. double quotes, semicolons, trailing commas, etc.). Use numeric separators where they improve readability (e.g., `1_000_000`).
- **Comments.** Terse, value-add only. Do not add comments that restate what code already says. Do not add docstrings, comments, or type annotations to code you did not change.

---

## Public API

- **Do not change public API** (export shape, entry points, function signatures, type contracts) without explicit request.
- When adding new API surface:
  - Provide precise TypeScript typings with overloads where appropriate.
  - Keep names stable, descriptive, and consistent with existing conventions.
  - Include one short, runnable example in the JSDoc.

---

## Performance

Profile first; optimize proven hot paths. Do not optimize speculatively.

- Prefer iteration over intermediate collection creation (avoid unnecessary `.map().filter()` chains that create throwaway arrays).
- Hoist constants and invariants out of loops.
- Avoid implicit copies, JSON roundtrips, and large-array spreads inside loops.
- Use bitwise operations only when they demonstrably reduce work _and_ remain correct (respect 32-bit limits, signedness, readability).
- Minimize allocations in measured hot paths. Pool objects when profiling justifies it.
- Do not claim "faster" or "more performant" without benchmarks to back it up.

### When the project uses Bun FFI (`bun:ffi`)

- Reuse `Buffer` / `TypedArray` / `DataView` instances in hot paths.
- Prefer `Buffer.allocUnsafe` where the buffer will be fully written before any read; use zero-filled `Buffer.alloc` when uninitialized memory could be observed (returned, logged, thrown, or shared).
- Never expose uninitialized memory outside the function that allocated it.

---

## Error Handling

- Use the error types already established in the repo. Do not invent new error hierarchies without reason.
- Keep error messages concise and actionable. Include the root cause, not apology prose.
- Do not swallow errors silently. If an error is caught, it must be handled, re-thrown, or explicitly logged.

---

## Documentation

- **JSDoc:** Compact. Include `@param`, `@returns`, and a single runnable `@example` on public methods. Skip JSDoc on private/internal code unless the logic is non-obvious.
- **README examples:** Short, practical, and representative of real usage. Prefer showing the common case.
- Do not create new documentation files (README, CHANGELOG, etc.) unless explicitly requested.

---

## Testing

- **Test at every step — this is non-negotiable.**
  - **Real tests first:** If the project has a test suite, run it after every change. All tests must pass before moving on.
  - **Smoke tests when no tests exist:** Run the program, invoke the changed function, execute the build, or type-check (`tsc --noEmit`) — whatever is the fastest way to prove the change works. A smoke test is the minimum bar; never skip it.
  - **Do not batch changes.** Verify each step individually before starting the next one. If something breaks, fix it immediately — do not pile more changes on top of a broken state.
- Do not add testing frameworks or dependencies the project does not already use.
- Keep test fixtures and example files in whatever directory the project already uses (`test/`, `example/`, `__tests__/`, etc.).
- Remove temporary benchmarks, diagnostic logs, and debugging artifacts before finishing.

### When the project uses Bun

- Use `bun:test` for tests and `bun` to run them.
- Do not add Node-only tooling or test runners.

---

## Benchmarking

- Benchmark when comparing approaches or making performance claims.
- Measure multiple iterations; report median and p99.
- Compare against the existing implementation, not just in isolation.
- Include memory/allocation metrics when relevant.

### When the project uses Bun

- Use `bun` for benchmarks. Prefer `Bun.bench` or `bun:test`'s built-in benchmarking where available.

---

## Commits

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description
```

- **type**: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`, `build`, `style`
- **scope**: optional, the affected area in parentheses
- **description**: lowercase, imperative mood, no trailing period

Examples:

- `feat(auth): add token refresh`
- `fix: resolve memory leak in parser`
- `perf(cache): reduce allocations in hot path`

---

## Things to Never Do

- **Do not add helpers/utilities** unless explicitly requested.
- **Do not reformat broadly.** Only change formatting on lines you are already modifying.
- **Do not add licenses, headers, or new linters/tooling.**
- **Do not broaden platform support** or add polyfills without request.
- **Do not assume the user is wrong.** Suggest better approaches when you see them, but respect the user's final decision.
- **Do not create `PROGRESS.md`, `TODO.md`, or tracking files** unless explicitly requested.
- **No hacky type casts.** Never use `as unknown as T`, `as any`, or any other cast that bypasses the type system instead of fixing the actual types. If the types do not align, fix the types — add overloads, use generics, narrow with type guards, or restructure. Casting is not a shortcut. _(TypeScript projects)_
- **Do not use shortform variable names** in any circumstance. Every name must be self-documenting.

---

## Language and Runtime Conventions

### TypeScript (all projects)

- Separate type imports with `import type`.
- Prefer `#privateField` syntax over `private` keyword for class fields.
- Use explicit `void` when deliberately discarding a return value.
- Strict mode (`"strict": true`) is expected. Do not weaken type safety to make code compile.
- Never use `any` without justification. Prefer `unknown` and narrow with type guards.
- **Never use `as unknown as T` or `as any`.** These are not acceptable under any circumstance. Fix the underlying types instead — add overloads, use generics, narrow with type guards, or restructure the code.
- Prefer `satisfies` over `as` where possible. Use `as const` only for literal narrowing, not as a workaround for bad types.

### Bun (when the project uses Bun as its runtime)

- **Default to Bun.** Do not assume Node.js unless the repo explicitly uses Node.
- Use Bun-native APIs where they exist: `Bun.file`, `Bun.write`, `Bun.serve`, `Bun.argv`, `Bun.env`, `Bun.sleep`, `bun:test`, etc.
- Import order: `bun:*` first, then `node:*` standard library, then third-party, then relative imports. Blank line between groups.
- Use `bun` for running scripts, tests, and installs. Do not use `npm`, `yarn`, or `npx` in Bun projects.

### Bun FFI (`bun:ffi`) — Win32 / native interop projects

- Open DLLs with `dlopen` and declare typed symbols. Verify each FFI declaration individually before building on top of it.
- Use `FFIType.u64` for handles/pointers (returned as `bigint`), `FFIType.u32` for `DWORD`, `FFIType.i32` for `BOOL`, `FFIType.ptr` for buffer pointers.
- Preserve Win32 parameter names as-is in FFI declarations (`hProcess`, `lpBuffer`, `dwSize`, `lpAddress`, etc.) — this is the one exception to the "no abbreviations" rule.
- Windows APIs use UTF-16LE. Encode strings with `Buffer.from(str + '\0', 'utf16le')`. Do not use `CString` from `bun:ffi` for wide strings — it is UTF-8 only.
- `GetProcAddress` takes ANSI (not wide) strings for the function name parameter.
- Handle lifetime is critical: every `OpenProcess`, `CreateToolhelp32Snapshot`, or `CreateRemoteThread` must have a matching `CloseHandle` in a `finally` block. Every `VirtualAllocEx` must have a matching `VirtualFreeEx`.
- Remote pointers from `VirtualAllocEx` are `bigint` values in the target process's address space — never dereference them locally.
- Use hex literals for byte sizes, struct offsets, flags, and Win32 constants (e.g., `0x238`, `0x1000`, `0x0400`).
- Check Bun's GitHub issues if an FFI type combination does not work as expected on the current Bun version.

### React / Frontend (when the project uses React)

- Prefer functional components with hooks over class components.
- Use the existing state management solution in the project (Redux, Zustand, Context, etc.) — do not introduce a new one.
- Keep components small and focused. Extract logic into custom hooks when it improves testability.
- Follow the project's existing file/folder structure for components, hooks, and utilities.
- Respect the project's CSS approach (CSS Modules, Tailwind, styled-components, etc.).

### C / C++ (when the project uses C or C++)

- Follow the existing code style (brace placement, indent width, naming convention).
- Use RAII for resource management. Every allocation must have a corresponding deallocation.
- Prefer the project's existing build system. Do not add CMake to a Makefile project or vice versa.
- Use the project's existing error handling pattern (return codes, exceptions, etc.).

---

## Workflow

1. **Read first.** Understand the existing code, structure, and conventions before making changes.
2. **Plan the change.** Identify which files need to be modified and what the minimal diff looks like.
3. **Implement.** Make the smallest change that accomplishes the goal.
4. **Verify.** Run tests, type-check, and manually verify the change works as intended.
5. **Clean up.** Remove any temporary code, ensure no unrelated changes snuck in.

Ship small, surgical, correct changes.
