# `@bun-win32/terminal` — Engine Design Spec

Date: 2026-06-03 · Author: PHOSPHOR (Claude Opus 4.8, ultracode) · Status: approved-direction, autonomous build

> The definitive, extreme-performance terminal-rendering engine for Bun on Windows.
> One package, four first-class personas (GAME · CLI/TUI · VIDEO · PLATFORM), an
> extensible plugin model, an AI-first doc/manifest, and a verified ≥10-round
> optimization loop that beats the existing `_term` baselines on every config.

---

## 0. Decisions locked with the user

1. **No shims, clean break.** `_term.ts` and `_textterm.ts` are *deleted*. The engine
   lives in `@bun-win32/terminal`. All ~30 dependent demos + tests import the package.
2. **Self-contained.** The package depends only on other `@bun-win32` packages
   (`@bun-win32/core`, `@bun-win32/kernel32`). No reverse dependency on `packages/all`.
   Anything that isn't genuinely terminal-domain is removed from the engine.
3. **Unified shared core.** Pixel `Term` and char `CharTerm` layer on one shared core
   (console session, byte sink, SGR emitter, PNG, pacing, input) — no copy-paste.
4. **Fully autonomous, end-to-end.** Build + migrate + all capabilities + ≥10 verified
   optimization rounds + `FINDINGS.md`, then report against the Definition of Done.

### Non-engine code relocated (not deleted, moved)
The demos import scene-math from the engine today. These are NOT terminal-domain and
move to a demo-local module `packages/all/example/_kit.ts` (the engine never exports them):
`clamp, clamp01, lerp, smoothstep, fract, TAU, aces, hsv, mulberry32, hash2`.
The engine retains and exports only terminal-domain helpers: `encodePNG` (PNG export),
`createFrameWaiter` (pacing), the `RGB` type, `BOX`/`BLOCK`/`BoxStyle`, and color packing.

---

## 1. Package identity

| Field | Value |
|---|---|
| name | `@bun-win32/terminal` |
| version | `1.0.0` |
| dependencies | `@bun-win32/core: workspace:*`, `@bun-win32/kernel32: workspace:*` |
| devDependencies | `@types/bun: latest` |
| peerDependencies | `typescript: ^5` |
| type / module / main | `module` / `index.ts` / `./index.ts` |
| exports | `{ ".": "./index.ts" }` (TS source; Bun consumes directly, no build) |
| files | `["AI.md","README.md","index.ts","src/**/*.ts"]` |
| sideEffects | `false` |
| engines | `{ "bun": ">=1.1.0" }` |
| tsconfig | `extends ../../tsconfig.json`, `paths: { "@types/*": ["./types/*"] }` if needed |

`@bun-win32/all` adds `@bun-win32/terminal: workspace:*` to its deps and (optionally)
re-exports it. The published tarball contains only `files[]` (no `example/`, no tests).

Publish: `bun publish --access public`, batched OTP. **Do not publish/push unless told.**

---

## 2. Architecture

```
packages/terminal/
  package.json  index.ts  AI.md  README.md  tsconfig.json
  src/
    index-internal.ts          # internal wiring (optional)
    types.ts                   # public types: TermMode, TermDiff, TermDepth, TermOptions,
                               #   RGB, AppSpec, TextAppSpec, KeyEvent, MouseState, Capabilities, plugin types
    core/
      console.ts               # ConsoleSession: VT/CP/raw/alt-screen/cursor, crash-safe restore,
                               #   signal + exit guards. Consumes @bun-win32/kernel32.
      input.ts                 # unified InputManager: backend interface + auto-select
      input.stdin.ts           # ANSI/SGR backend over process.stdin (key-down, mouse 1003/1006/1016, paste, focus)
      input.console.ts         # kernel32 ReadConsoleInputW backend (key up/down/repeat/mods, resize, mouse, focus)
      bytes.ts                 # ByteSink: growable out buffer, putByte/putUint/putDec/putBytes, DEC[256] LUT, SGR const arrays
      sgr.ts                   # SGR pen + combined fg/bg emit + cursor-move suppression helpers
      png.ts                   # encodePNG (filter-0 scanlines + zlib-wrapped RAW deflate + adler32/crc32)
      pacing.ts                # createFrameWaiter (CreateWaitableTimerExW hi-res) + loop pacing helpers
      sync.ts                  # DEC synchronized output (mode 2026) begin/end; feature-detect, no-op fallback
      capabilities.ts          # detectCapabilities() + CAPABILITIES manifest (modes, diffs, depths, input backends, options)
    surface/
      surface.ts               # shared Surface base (console session, byte sink binding, present/frameBytes/toPNG plumbing)
      pixel.ts                 # class Term (pixel framebuffer)
      char.ts                  # class CharTerm (TUI cell grid)
    modes/
      registry.ts              # render-mode plugin registry; built-ins register here
      half.ts quad.ts sextant.ts braille.ts ascii.ts
      ramps.ts                 # ASCII/Unicode ramps (pluggable)
    diff/
      registry.ts              # diff/emit strategy registry
      exact.ts threshold.ts none.ts
    color/
      quant.ts                 # 15-bit LUT256/LUT16, CH6, PAL16
      pack.ts                  # rgb pack/unpack, clamp8, hsv->rgb (engine-internal color)
    glyphs/
      font5x7.ts               # pixel-surface bitmap font (Term.text)
      font6x10.ts              # char-surface raster font (CharTerm.rasterize / headless PNG)
      box.ts block.ts          # BOX / BLOCK constants
    app/
      loop.ts                  # run(spec) / runText(spec): live / CAPTURE_PNG / BENCH modes on a shared runLoop
      hud.ts                   # FPS/HUD overlays (pixel + char variants)
    draw/
      pixel-ops.ts             # setPixel/add/blend/plate/text + NEW line/rect/circle/blit/clip + dirty-rect
      char-ops.ts              # put/text/fillRect/shadeRect/hline/vline/box
  example/
    game.ts                    # GAME persona: 60fps loop, real key up/down (FFI), mouse, tear-free (sync)
    tui.ts                     # CLI/TUI persona: event-driven, widgets, resize-safe
    video.ts                   # VIDEO persona: full-frame motion at thousands of fps production
    plugin.ts                  # PLATFORM persona: register a custom mode + ramp + input handler
    *.test.ts                  # co-located unit tests
  terminal.modes.test.ts       # byte-stream decode contract (ported + extended from _term.modes.test.ts)
  terminal.bench.ts            # full mode×diff×depth × size × content baseline+after matrix
```

### Hot-path discipline (preserved + extended from the 21 existing techniques)
Zero per-frame allocation in steady state; module-level scratch; precomputed
decimal-byte LUT, static SGR const arrays, combined fg+bg SGR, persistent SGR pen,
15-bit (32³) quant LUTs, specialised fast half-block path, reused doubling out-buffer,
`continue`-based diff skips, branchless clamps/floors, cursor-move suppression with
autowrap-off, hoisted destructured locals. The refactor into `ByteSink`/`sgr`/`modes`
**must remain byte-identical** on the paths pinned by `terminal.modes.test.ts`.

---

## 3. Capabilities to ship (spec §3 mapped; ✓=harden existing, ✗=build new)

**Rendering**
- ✓ Modes half/quad/sextant/braille/ascii → made **pluggable** via `modes/registry`.
- ✓ Diff exact/threshold/none → add **dirty-rect / scissor** (region-bounded redraw).
- ✓ Depth truecolor/256/16 → add **runtime capability detection** (`detectCapabilities`).
- ✓ Draw setPixel/add/blend/plate/text/clear → add **line/rect/circle/blit + clip**.
- ✗ **SYNC**: DEC synchronized output (mode 2026) wraps each `present()` → atomic frame
  swap, no tearing at high fps. Feature-detect; graceful no-op. (Prior art: gameboy/gba.)

**Input** (the "@bun-win32" payoff — beyond ANSI/stdin)
- ~ Mouse SGR 1003/1006 exists → add **SGR-pixel (1016)** sub-cell precision.
- ~ `onKey` (stdin key-down) → add **kernel32 `ReadConsoleInputW` backend**: real
  KEY_DOWN/KEY_UP/repeat + modifier state (games need key-up). Also **Kitty keyboard
  protocol** where available; **auto-select** best backend. Unify into `KeyEvent`.
- ✗ **Resize** via `WINDOW_BUFFER_SIZE_EVENT` (FFI backend) → race-free; fall back to
  polling `GetConsoleScreenBufferInfo`.
- ✗ **Focus in/out + bracketed paste** events.

**Loop / lifecycle**
- ✓ Hi-res pacing → keep; expose target-fps + uncapped.
- ✓ Alt-screen/raw/cursor/restore-on-exit → keep; guarantee restore on crash/signal.
- ✗ Double/triple buffering toggle; explicit **damage API**.

**Output / interop**
- ✓ `frameBytes()`/`toPNG()` → keep; add a **pipe/record sink** (write the diffed stream
  to a file/socket for headless or remote rendering).

---

## 4. Public API surface (the consumed contract, renamed for a real engine)

- `class Term` — pixel framebuffer. `new Term(cols, rows, opts?: TermOptions)`. Fields
  `cols/rows/W/H/aspect/buf/mode/diff/depth/threshold` + mouse state. Methods
  `clear/setPixel/addPixel/blendPixel/plate/text` + NEW `line/rect/circle/blit/clip`,
  `buildFrame/frameBytes/present/invalidate/reconfigure/toPNG`, static `textWidth`.
- `class CharTerm` — TUI cell grid. `new CharTerm(cols, rows)`. Cell arrays `ch/fg/bg/bold`;
  `clear/put/text/fillRect/shadeRect/hline/vline/box`, `buildFrame/present/invalidate/rasterize/toPNG`.
- `run(spec: AppSpec): Promise<void>` / `runText(spec: TextAppSpec): Promise<void>` —
  shared live/CAPTURE_PNG/BENCH loop. (was `runDemo`/`runTextDemo`.)
- `encodePNG`, `createFrameWaiter` (was `makeFrameWaiter`).
- Types: `TermMode`, `TermDiff`, `TermDepth`, `TermOptions`, `AppSpec`, `TextAppSpec`,
  `RGB`, `BoxStyle`, `KeyEvent`, `MouseState`, `Capabilities`, plugin types.
- Consts: `BOX`, `BLOCK`, `CAPABILITIES`.
- Plugin API: `registerMode`, `registerRamp`, `registerInputBackend`, `registerDiff`
  (+ `getModes`/etc. for enumeration). Built-ins registered through it.
- `detectCapabilities()`, sync controls (`beginSync`/`endSync` or `present({sync})`).

### Behavioural invariants to preserve (so migrated demos are byte-identical)
- `Term` mouse coords = **pixels**; `CharTerm` mouse coords = **cells**.
- `run` (pixel) default `targetFps: 0` (uncapped); `runText` default `60`.
- `onKey` for pixel surface lowercases + limited set; char surface case-preserving + rich
  special keys (esc/enter/backspace/tab/home/end/delete/pageup/pagedown). The new unified
  `KeyEvent` carries raw key + modifiers; legacy `onKey(key,t)` string behavior preserved
  per surface.
- Capture defaults 160×50 cells, `CAPTURE_T=4`, `CAPTURE_FPS=60`; env knobs
  `TERM_COLS/ROWS/MODE/DIFF/DEPTH/THRESHOLD`, `BENCH`, `BENCH_FRAMES`, `CAPTURE_PNG/FRAMES`,
  `DEMO_DURATION_MS` — all preserved.
- PNG = zlib-wrapped RAW deflate (`0x78 0x01` + data + adler32), color type 2, depth 8.

---

## 5. Plugin model (spec §4)

A small typed registry, dogfooded by built-ins:
- **Render mode**: `{ name, pxW, pxH, bitLayout, glyphFor(mask), quantize?(...) }` + a
  per-cell sub-pixel→(fg,bg,glyph) chooser. Registered into `modes/registry`.
- **Ramp**: `{ name, glyphs: string }` for ascii/unicode ramps.
- **Input backend**: `{ name, available(), start(emit), stop() }` emitting unified events.
- **Diff/emit strategy**: `{ name, shouldEmit(prev,next,thr), cache(...) }`.
Plugins must not regress the hot path when unused (registry lookup hoisted out of the
inner loop; built-in modes resolved to a monomorphic emit function at configure time).

---

## 6. Migration plan (delete originals, re-point everything)

1. **Capture the regression oracle FIRST** (before any change): run every dependent demo
   under `CAPTURE_PNG` at fixed seeds/sizes → store baseline PNGs; run `_term.bench.ts`
   and per-demo `BENCH` → store baseline numbers; keep `_term.modes.test.ts` output.
2. Build `@bun-win32/terminal` (the unified engine) to byte-parity with `_term`/`_textterm`.
3. Create `packages/all/example/_kit.ts` with the relocated scene-math helpers.
4. Re-point all ~30 dependents: engine symbols ← `@bun-win32/terminal`, scene-math ← `./_kit`.
   - Includes `gameboy-tty.ts`/`gba-tty.ts`: replace their ad-hoc `dlopen` console-input
     blocks with the package's input/console layer (the §9 win). Keep their custom loop or
     move to `run` as appropriate; must stay byte-identical.
   - `video-term.ts`: the live `reconfigure` + mode/diff/depth type consumer — verify.
5. Port `_term.modes.test.ts` → `packages/terminal/terminal.modes.test.ts` (engine import).
   Port `_term.bench.ts` → `packages/terminal/terminal.bench.ts` and extend to the FULL matrix.
6. **Delete** `_term.ts`, `_textterm.ts`, `_term.selftest.ts`, `_textterm.selftest.ts`
   (selftests become package `example/` persona demos or package tests). Update
   `packages/all/package.json` scripts + deps; update `packages/all/index.ts` if it references them.
7. Regenerate every demo's PNG and **diff byte-for-byte** against the oracle. Any
   intentional diff (e.g. a demo that used a relocated helper differently) is justified in writing.

---

## 7. Upstream `@bun-win32/kernel32` work (spec §9)

No new FFI `Symbols` needed (all console fns already bound). Add typed **struct layouts +
decode/encode helpers** to `packages/kernel32/types/Kernel32.ts` (Pointer-alias + DataView
convention, audit-clean):
- `COORD` (4B), `SMALL_RECT` (8B), `CONSOLE_SCREEN_BUFFER_INFO` (22B), `CONSOLE_CURSOR_INFO` (8B).
- `INPUT_RECORD` (x64 stride 20B), `KEY_EVENT_RECORD`, `MOUSE_EVENT_RECORD`,
  `WINDOW_BUFFER_SIZE_RECORD`, `FOCUS_EVENT_RECORD`, `MENU_EVENT_RECORD`.
- `enum EventType { KEY_EVENT=1, MOUSE_EVENT=2, WINDOW_BUFFER_SIZE_EVENT=4, MENU_EVENT=8, FOCUS_EVENT=16 }`.
- COORD-pack helper for by-value `u32` cursor/size args.
- If `CreateWaitableTimerExW`/`SetWaitableTimer`/`WaitForSingleObject` are not already
  bound in kernel32, add them (kernel32.dll exports) so the pacer consumes a real binding
  too. Verify first.
Run the nullable/FFI audit (`scripts/audit.ts`) on all kernel32 changes. Bump kernel32 version.

---

## 8. AI-first deliverables (spec §5)

- **AI.md** (repo "how to use, not what it does" style, a few KB): capability→API table,
  "Where to look" table, copy-paste RECIPES for each persona (game loop, TUI app, play a
  video, write a plugin). Adapted from the DLL AI.md template (it's an engine, not a 1:1 DLL
  binding, so the Calling Convention section is replaced by engine usage).
- **`CAPABILITIES` manifest** export: machine-readable {modes, diffs, depths, inputBackends,
  options, features} so an agent enumerates features at runtime.
- **Exhaustive TSDoc** on the public surface (`/** @inheritdoc */` on overrides, no verbose
  comment-block headers — repo norm).
- **Acceptance test**: a fresh agent, given ONLY AI.md + types (engine source withheld),
  writes a working game loop + TUI + plugin on the first try. Run as a verification gate.

---

## 9. Performance plan (spec §6)

1. **Establish the full baseline** the existing doc lacks: mode×diff×depth matrix ×
   {120×40, 200×60, 320×100} × {static, sparse-3%, full-frame coherent}, frame-production
   fps + KB/frame + end-to-end bytes. Record in `FINDINGS.md` as the baseline table.
2. **Beat it**: every config ≥ baseline; flagship configs (half/exact/16; half/threshold;
   real-video) improve materially. Numbers-to-beat anchors (200×60 coherent): half/exact/tc
   1,957 fps·397 KB; half/thr18 4,331·78; half/256 6,047·41; half/16 11,103·10; sextant/thr18
   1,533·91; braille/16 1,677·22. Real-video peak 18,441 fps (80×24 half/16).
3. Hot-path rules: zero per-frame alloc; LUTs over branches; minimize bytes the terminal
   must consume (fewer bytes = faster picture); never let a win silently regress another config.

---

## 10. Testing & verification (spec §7, TDD)

- **Tests first** for new behavior (input parsing incl. key-up/repeat/mods, draw ops
  line/rect/circle/blit/clip, plugin registration, SYNC wrapping, capability detection,
  dirty-rect, pipe sink).
- **Byte-stream decode** test ported + extended (`terminal.modes.test.ts`) — the per-mode
  glyph/SGR contract.
- **Non-regression gate**: all dependent demos render byte-identical PNGs vs. the §6 oracle.
- **Headless**: every package `example/` runs clean under CAPTURE_PNG and BENCH.
- `bunx tsc --noEmit` across the workspace → 0 errors. Nullable/FFI audit on kernel32 changes.
- **Visual** verification where it matters — look at the rendered PNG, not just numbers.

---

## 11. Optimization loop (spec §8) — ≥10 verified rounds

Each round: dispatch parallel fresh Opus-4.8 (ultracode) agents on distinct lenses
(perf/hot-path · bytes-per-frame · visual fidelity · input latency · API ergonomics ·
AI-doc clarity · plugin overhead). Each returns a measured finding (number/repo/diff).
**Adversarially verify** each finding with an independent agent before implementing
(reject plausible-but-wrong; require a measurement). Implement confirmed wins; re-run the
full bench matrix + regression gate; log before→after deltas. ≥10 rounds; continue while a
round yields a verified non-regressing win; stop after two consecutive empty rounds.
Write `FINDINGS.md` with cumulative deltas.

---

## 12. Definition of Done (spec §10)

- [ ] `@bun-win32/terminal` builds, tsc clean, follows template conventions, self-contained.
- [ ] All four personas demoable from the package's own `example/`.
- [ ] All §3 capabilities shipped (SYNC, FFI key-up/resize, plugins, drawing, cap-detect, sink).
- [ ] Plugin API works; built-ins registered through it; no hot-path regression.
- [ ] AI.md + typed manifest pass the "fresh agent, no source" usability test.
- [ ] Bench matrix ≥ baseline everywhere; flagship configs improved; numbers recorded.
- [ ] All ~30 dependent demos byte-identical (or justified) + run under CAPTURE_PNG/BENCH.
- [ ] `_term.ts`/`_textterm.ts` deleted; demos import `@bun-win32/terminal`; scene-math in `_kit.ts`.
- [ ] ≥10 verified optimization rounds done; `FINDINGS.md` written.
- [ ] kernel32 upstream changes follow its conventions + pass audit; version bumped.
- [ ] Not published / not pushed unless explicitly told.

---

## 13. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Byte-identity drift during core refactor | Capture oracle first; port `modes.test` early (TDD red→green); diff every PNG. |
| FFI input backend instability (foreign-thread JSCallback, segfaults) | `ReadConsoleInputW` is a polled read on the main loop (proven by gameboy/gba) — no foreign-thread callbacks; PeekConsoleInput to avoid blocking. |
| `noUncheckedIndexedAccess:false` + strict + verbatimModuleSyntax | Follow repo tsconfig exactly; `import type`; `override` on base members. |
| Teardown segfault on heavy demos (known Bun bug) | Verify via the `[shot]`/captured-frame line, not exit code (per repo memory). |
| Plugin indirection slows hot path | Resolve mode/diff to a monomorphic emit fn at configure-time; registry lookups never in the per-cell loop. |
| `gameboy-tty`/`gba-tty` custom loops | Migrate input/console only; keep their loop; byte-identical PNG gate guards correctness. |
| Concurrent build agents git-clean untracked files | Commit package skeleton + scaffolding to the branch early (repo memory). |

---

## 14. Execution phasing (internal; autonomous)

- **P0 Oracle**: capture baseline PNGs + bench + modes output from current engine.
- **P1 Upstream**: kernel32 struct decoders + (if needed) waitable-timer symbols; audit.
- **P2 Core**: ConsoleSession, ByteSink, sgr, png, pacing, sync, capabilities, color.
- **P3 Surfaces**: `Term` + `CharTerm` on the core to byte-parity; modes/diff registries.
- **P4 Input**: stdin + console FFI backends, unified KeyEvent, mouse 1016, resize, focus, paste.
- **P5 Drawing+output**: line/rect/circle/blit/clip, dirty-rect, double-buffer, pipe sink.
- **P6 Loop+plugins**: `run`/`runText` unified; plugin registry dogfooded.
- **P7 Migration**: `_kit.ts`, re-point 30 demos + gameboy/gba, delete originals, byte-diff gate.
- **P8 Docs/manifest**: AI.md, README, CAPABILITIES, TSDoc; fresh-agent acceptance test.
- **P9 Baseline+bench**: full matrix; tsc/audit/test green.
- **P10 Optimization loop**: ≥10 verified rounds; FINDINGS.md.
- **P11 DoD sweep**: final verification against §12.
