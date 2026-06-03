# @bun-win32/terminal Engine — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: execute via ultracode Workflow orchestration (the parallel form of superpowers:subagent-driven-development). Steps use checkbox (`- [ ]`) syntax. Executors are fresh Opus-4.8 ultracode subagents WITH repo access — port tasks reference the existing engine source as the byte-identical oracle instead of re-transcribing it.

**Goal:** Ship `@bun-win32/terminal`, a self-contained extreme-performance terminal engine (pixel + char surfaces, FFI input with key-up/resize, DEC sync, plugin model, AI-first docs), migrate all ~30 demos to it, delete `_term.ts`/`_textterm.ts`, and beat every existing perf baseline across ≥10 verified optimization rounds.

**Architecture:** One shared core (`ConsoleSession`, `ByteSink`, `sgr`, `png`, `pacing`, `sync`, `capabilities`, unified `input`) with two surfaces (`Term` pixel framebuffer, `CharTerm` TUI grid) and four plugin registries (modes, ramps, input backends, diff strategies). Built-ins dogfood the registries. Input gains a kernel32 `ReadConsoleInputW` backend for real KEY_DOWN/UP/repeat/modifiers + `WINDOW_BUFFER_SIZE` resize, auto-selected against the stdin/ANSI backend.

**Tech Stack:** Bun + TypeScript (ESM, `.ts` source, no build), `bun:ffi` via `@bun-win32/core` + `@bun-win32/kernel32`, Windows console VT.

**Reference oracle:** `packages/all/example/_term.ts` (1530 LOC pixel engine), `_textterm.ts` (1066 LOC char engine), `_term.modes.test.ts` (byte-stream contract), `_term.bench.ts` (perf harness). Survey briefs: `.scratch/survey/01..07-*.md`. Spec: `docs/superpowers/specs/2026-06-03-bun-win32-terminal-engine-design.md`.

**Global gates (every phase must keep these green):**
- `bunx tsc --noEmit -p packages/all/tsconfig.json` → 0 errors (and the new package's tsconfig).
- `bun run packages/terminal/terminal.modes.test.ts` → all pass (byte-stream decode contract).
- Byte-identical PNGs for every migrated demo vs. the P0 oracle.
- kernel32 changes pass `scripts/audit.ts`.

---

## Phase P0 — Capture the regression oracle (BEFORE any change)

### Task 0.1: Inventory + freeze the dependent demo set
**Files:** Create `.scratch/oracle/MANIFEST.json`
- [ ] List every `example/*.ts` importing `./_term` or `./_textterm` (32 files; see `.scratch/survey/05-dependents.md`). Record per demo: engine family, whether it uses `runDemo`/`runTextDemo` or a custom loop (`gameboy-tty`, `gba-tty`), and any spec render-options.
- [ ] Record the canonical capture config per demo: `TERM_COLS`/`TERM_ROWS` (default 160×50; GB 160×72; GBA 240×80), `CAPTURE_T`, `CAPTURE_FPS=60`, fixed seed (demos already use `mulberry32`/`hash2` so capture is deterministic).

### Task 0.2: Render baseline PNGs from the CURRENT engine
**Files:** Create `.scratch/oracle/png/<demo>.png` (+ `.N.png` for multi-frame)
- [ ] For each demo run `CAPTURE_PNG=.scratch/oracle/png/<demo>.png CAPTURE_FPS=60 TERM_COLS=<c> TERM_ROWS=<r> bun run packages/all/example/<demo>.ts`. Capture a deterministic mid-run frame (`CAPTURE_T` per manifest). For `gameboy-tty`/`gba-tty` use their own capture path (they call `encodePNG(t.buf,...)`).
- [ ] Store the sha256 of each PNG in `.scratch/oracle/HASHES.txt`. This is the non-regression oracle.
- [ ] Verify visually: spot-check 5 PNGs render real content (not blank). Note any demo that fails to capture (record as pre-existing-broken, exclude from gate).

### Task 0.3: Capture baseline benchmarks
**Files:** Create `.scratch/oracle/bench-baseline.md`
- [ ] Run `bun run packages/all/example/_term.bench.ts` → save full output (Part 1 sizes × scenarios; Part 2 matrix × 2 content tables).
- [ ] Run `BENCH=1 bun run packages/all/example/video-term.ts` and the 4 persona exemplars → save JSON lines.
- [ ] Record the canonical numbers-to-beat table (spec §9) as the baseline header.

### Task 0.4: Freeze the modes contract
- [ ] Run `bun run packages/all/example/_term.modes.test.ts` → confirm "N pass / 0 fail"; copy the file to `.scratch/oracle/modes.test.reference.ts` as the contract source.
- [ ] **Commit:** `git add .scratch/oracle docs/superpowers/plans && git commit -m "test(terminal): capture pre-migration regression oracle (PNG hashes + bench + modes)"`. (`.scratch/oracle` is committed deliberately so parallel agents can't git-clean the oracle.)

---

## Phase P1 — Upstream: `@bun-win32/kernel32` console struct decoders (spec §9)

### Task 1.1: Verify the existing console + timer binding surface
**Files:** Read `packages/kernel32/structs/Kernel32.ts`, `types/Kernel32.ts`
- [ ] Confirm bound: `GetStdHandle, Get/SetConsoleMode, GetConsoleScreenBufferInfo, GetNumberOfConsoleInputEvents, ReadConsoleInputW, PeekConsoleInputW, FlushConsoleInputBuffer, WriteConsoleW, SetConsoleTitleW, Get/SetConsoleOutputCP` (all confirmed in `.scratch/survey/07`).
- [ ] Check whether `CreateWaitableTimerExW`, `SetWaitableTimer`, `WaitForSingleObject`, `CloseHandle` are bound. If any are missing, add them to `Symbols` (alphabetized) + typed static methods per kernel32 convention (these are kernel32.dll exports). Gate: `scripts/audit.ts` clean.

### Task 1.2: Add console struct layouts + decoders (TDD)
**Files:** Modify `packages/kernel32/types/Kernel32.ts`; Create `packages/kernel32/example/console-input.test.ts`
- [ ] **Write failing test** asserting decode/encode round-trips against documented byte layouts:

```ts
import { decodeInputRecord, INPUT_RECORD_SIZE, EventType, decodeCSBI, packCOORD } from '@bun-win32/kernel32';
// INPUT_RECORD x64 stride = 20 bytes
if (INPUT_RECORD_SIZE !== 20) throw new Error('stride');
// KEY_EVENT: EventType@0=1, bKeyDown@4=1, wRepeatCount@8, wVirtualKeyCode@10, uChar@14, ctrl@16
const b = Buffer.alloc(20);
b.writeUInt16LE(EventType.KEY_EVENT, 0);
b.writeInt32LE(1, 4); b.writeUInt16LE(2, 8); b.writeUInt16LE(0x41, 10); b.writeUInt16LE(0x61, 14);
const r = decodeInputRecord(b, 0);
if (r.type !== EventType.KEY_EVENT || !r.keyDown || r.virtualKeyCode !== 0x41 || r.char !== 0x61) throw new Error('key decode');
// packCOORD(x,y) low16=x high16=y
if (packCOORD(3, 5) !== ((5<<16)|3)) throw new Error('coord');
console.log('console-input decoders: pass');
```

- [ ] Run: `bun run packages/kernel32/example/console-input.test.ts` → Expected FAIL (symbols undefined).
- [ ] **Implement** in `types/Kernel32.ts` (keep `Pointer` aliases; add offset consts + pure decode/encode helpers, audit-clean). Layouts from `.scratch/survey/07` §4:
  - `COORD` (X@0,Y@2 SHORT), `SMALL_RECT` (L@0,T@2,R@4,B@6), `CONSOLE_SCREEN_BUFFER_INFO` (22B), `CONSOLE_CURSOR_INFO` (8B).
  - `INPUT_RECORD` stride 20: `EventType@0` WORD; union @4. `KEY_EVENT_RECORD`: bKeyDown@4 BOOL, wRepeatCount@8 WORD, wVirtualKeyCode@10 WORD, wVirtualScanCode@12 WORD, uChar@14 WCHAR, dwControlKeyState@16 DWORD. `MOUSE_EVENT_RECORD`: dwMousePosition(COORD)@4, dwButtonState@8, dwControlKeyState@12, dwEventFlags@16. `WINDOW_BUFFER_SIZE_RECORD`: dwSize(COORD)@4.
  - `enum EventType { KEY_EVENT=1, MOUSE_EVENT=2, WINDOW_BUFFER_SIZE_EVENT=4, MENU_EVENT=8, FOCUS_EVENT=16 }`.
  - `decodeInputRecord(buf, byteOffset)`, `decodeCSBI(buf)` (→ {cols,rows,cursorX,cursorY,...}), `packCOORD(x,y)`.
- [ ] Run test → Expected PASS. Run `bun scripts/audit.ts kernel32` (or repo audit invocation) → no NEW mismatches beyond accepted noise.
- [ ] Bump `packages/kernel32/package.json` version (patch). **Commit:** `feat(kernel32): console INPUT_RECORD/CSBI/COORD struct decoders + EventType`.

---

## Phase P2 — Package skeleton + shared core

### Task 2.1: Scaffold the package
**Files:** Create `packages/terminal/{package.json,index.ts,tsconfig.json,AI.md,README.md}` (AI.md/README stubs filled in P8)
- [ ] `package.json` per spec §1 (deps core+kernel32 `workspace:*`, `files:["AI.md","README.md","index.ts","src/**/*.ts"]`, `exports:{".":"./index.ts"}`, `sideEffects:false`, v1.0.0). `tsconfig.json` extends `../../tsconfig.json`.
- [ ] Add `@bun-win32/terminal: workspace:*` to `packages/all/package.json` deps. Run `bun install` (hoisted linker).
- [ ] **Commit early** (repo memory: parallel agents git-clean untracked): `chore(terminal): scaffold @bun-win32/terminal package`.

### Task 2.2: Port the leaf utilities (byte-identical)
**Files:** Create `src/core/png.ts`, `src/core/pacing.ts`, `src/color/quant.ts`, `src/color/pack.ts`, `src/glyphs/{font5x7,font6x10,box,block}.ts`
- [ ] Port `encodePNG` + crc32/adler32/pngChunk from `_term.ts:235-289` verbatim → `png.ts`. Port `makeFrameWaiter`→`createFrameWaiter` from `_term.ts:1188-1209` (consume kernel32 timer symbols from P1.1 if bound; else keep its local dlopen but prefer the package binding). Port quant LUTs (`LUT256/LUT16/CH6/PAL16/quant256/quant16/quant256Exact/chDelta`) from `_term.ts:401-481` → `quant.ts`. Port `hsv`/clamp8/rgb pack → `pack.ts`. Port fonts/`BOX`/`BLOCK` from `_term.ts` (5×7) and `_textterm.ts` (6×10, BOX/BLOCK) → `glyphs/`.
- [ ] Unit test `png.ts`: encode a known 2×2 RGB buffer, assert PNG signature + IHDR + zlib header `0x78 0x01` bytes. Test `quant.ts`: assert `quant256(255,0,0)` and `quant16(255,0,0)` indices match `_term` output. **Commit:** `feat(terminal): port png/pacing/quant/glyph leaf utilities`.

### Task 2.3: ByteSink + SGR emitter (the hot path, byte-identical)
**Files:** Create `src/core/bytes.ts`, `src/core/sgr.ts`
- [ ] `ByteSink`: growable `out=Uint8Array(1<<18)`, `outPos`, `ensure/putByte/putAscii/putUint/putBytes/putDec`, `DEC[256]` LUT, `B_CSI/HOME_BYTES/B_FG_TC/...` const arrays (from `_term.ts:337-351,700-744`). Zero-alloc.
- [ ] `sgr.ts`: pen state (`penFg/penBg`), `putColor(sink,fg,bg,depth)` combined fg+bg emit (from `_term.ts:761-809`), `emitCursor` (748-754). Truecolor + palette paths.
- [ ] Unit test: feed a scripted sequence, assert exact emitted bytes match a hand-computed expected (mirror a slice of `_term.modes.test.ts`'s decode). **Commit:** `feat(terminal): zero-alloc ByteSink + SGR pen emitter`.

### Task 2.4: ConsoleSession (lifecycle, crash-safe)
**Files:** Create `src/core/console.ts`
- [ ] Port `setupConsole/restoreConsole/detectSize` from `_term.ts:1137-1178` consuming `@bun-win32/kernel32` (`STD_HANDLE`, `ConsoleMode`, `decodeCSBI` from P1). Enable VT processing + UTF-8 CP; alt-screen/hide-cursor/autowrap-off; restore on `exit`/`SIGINT`/`uncaughtException` (idempotent). Add focus/paste enable sequences (`?1004h`, `?2004h`) gated by option.
- [ ] Test: construct a `ConsoleSession` in a non-TTY harness (mock handle) — assert the setup byte sequence equals the documented order; assert restore reverses it. **Commit:** `feat(terminal): crash-safe ConsoleSession on kernel32`.

---

## Phase P3 — Surfaces (Term + CharTerm) to byte-parity + registries

### Task 3.1: Mode + diff registries (built-ins dogfood)
**Files:** Create `src/modes/{registry,half,quad,sextant,braille,ascii,ramps}.ts`, `src/diff/{registry,exact,threshold,none}.ts`, `src/types.ts`
- [ ] `types.ts`: `TermMode/TermDiff/TermDepth/TermOptions/RGB/AppSpec/TextAppSpec/KeyEvent/MouseState/Capabilities` + plugin interfaces (`RenderMode`, `Ramp`, `InputBackend`, `DiffStrategy`).
- [ ] Mode registry: each built-in mode = `{name,pxW,pxH,bitLayout,glyphBytesFor(mask)|emit}`; glyph tables (`QUAD_CP/SEXT_BYTES/BRAILLE_BYTES/HALF_GLYPH/RAMP`) from `_term.ts:362-396`. `registerMode/getMode`. Resolve to a monomorphic emit fn at configure-time (no registry lookup in per-cell loop).
- [ ] Diff registry: exact/threshold/none `shouldEmit`/cache semantics from `_term.ts:856-861,958-964,1072-1080`.
- [ ] Test: `getMode('sextant').pxW===2 && pxH===3`; registering a custom mode then `getMode` returns it; built-ins are present. **Commit:** `feat(terminal): pluggable mode + diff registries (built-ins dogfood)`.

### Task 3.2: `class Term` (pixel surface) — byte-identical port
**Files:** Create `src/surface/surface.ts`, `src/surface/pixel.ts`, `src/draw/pixel-ops.ts`
- [ ] Port the `Term` class from `_term.ts:491-1135` onto `ByteSink`+`sgr`+mode/diff registries: fields `cols/rows/W/H/aspect/buf/mode/diff/depth/threshold`+mouse; `clear/setPixel/addPixel/blendPixel/plate/text`, `buildFrame/frameBytes/present/invalidate/reconfigure/toPNG`, static `textWidth`. Emit paths (`emitHalfFast/emitHalfGeneral/emitMulti/emitAscii`) preserved byte-for-byte.
- [ ] **Gate (TDD):** create `packages/terminal/terminal.modes.test.ts` = the ported `_term.modes.test.ts` importing `Term` from the package. Run → must be all-pass (this is the byte contract). Do NOT proceed until green.
- [ ] **Commit:** `feat(terminal): Term pixel surface (byte-identical, modes.test green)`.

### Task 3.3: `class CharTerm` (char surface) — byte-identical port
**Files:** Create `src/surface/char.ts`, `src/draw/char-ops.ts`
- [ ] Port `CharTerm` from `_textterm.ts:219-712` onto the shared core (reuse `ByteSink`/`sgr`/`ConsoleSession`/`png`): cell arrays `ch/fg/bg/bold`; `clear/put/text/fillRect/shadeRect/hline/vline/box`, `buildFrame/present/invalidate/rasterize/toPNG`; `putCodepoint` general UTF-8; procedural-glyph rasteriser + 6×10 font.
- [ ] Test: a small `CharTerm(4,2)` scripted frame → assert emitted bytes + a `rasterize()` PNG signature. **Commit:** `feat(terminal): CharTerm TUI surface on shared core`.

---

## Phase P4 — Unified input (the @bun-win32 payoff)

### Task 4.1: Input backend interface + stdin/ANSI backend
**Files:** Create `src/core/input.ts`, `src/core/input.stdin.ts`
- [ ] `InputManager` with `InputBackend` interface `{name,available(),start(emit),stop()}` emitting unified events: `{type:'key',key,down,repeat,mods}`, `{type:'mouse',x,y,button,down,wheel,motion,pixel?}`, `{type:'resize',cols,rows}`, `{type:'focus',in}`, `{type:'paste',text}`.
- [ ] stdin backend: port `_term.ts:1396-1446` ANSI/SGR parsing (CSI arrows, SGR mouse 1003/1006) + **add SGR-pixel 1016** decode + bracketed-paste (`ESC[200~`..`ESC[201~`) + focus (`ESC[I`/`ESC[O`). Key-down only (ANSI limitation). Preserve legacy `onKey(key,t)` string mapping per surface (pixel lowercases; char case-preserving rich keys).
- [ ] Test (`input.stdin.test.ts`): feed byte buffers, assert decoded events (arrow, SGR press/release/wheel, 1016 pixel coords, paste payload, focus). **Commit:** `feat(terminal): unified input + stdin/ANSI backend (mouse 1016, paste, focus)`.

### Task 4.2: kernel32 ReadConsoleInputW backend (real key up/down/resize)
**Files:** Create `src/core/input.console.ts`
- [ ] Console backend: set `ENABLE_WINDOW_INPUT|ENABLE_MOUSE_INPUT|ENABLE_VIRTUAL_TERMINAL_INPUT|ENABLE_EXTENDED_FLAGS` (drop line/echo/processed), poll `GetNumberOfConsoleInputEvents`+`ReadConsoleInputW` into a reused `Buffer`, `decodeInputRecord` (from P1) per record → emit KEY_DOWN/KEY_UP/repeat + modifier state, MOUSE, **WINDOW_BUFFER_SIZE_EVENT** → resize, FOCUS. Polled on the main loop (no foreign-thread JSCallback — the segfault-safe pattern proven by `gameboy-tty`/`gba-tty`). Map Windows VK codes → unified key names.
- [ ] Auto-select: `InputManager` picks the console backend when `stdin.isTTY` on Windows and FFI available (gives key-up); else stdin backend. Expose `inputBackend` option to force.
- [ ] Test (`input.console.test.ts`, gated to run only where a console exists; otherwise a pure decode unit test over synthetic INPUT_RECORD buffers asserting KEY_UP + repeat + modifiers + resize). **Commit:** `feat(terminal): kernel32 console-input backend (key up/down/repeat/resize)`.

### Task 4.3: Kitty keyboard protocol (where available)
**Files:** Modify `src/core/input.stdin.ts` (+ capabilities)
- [ ] Detect Kitty support (query `ESC[?u`); when present, enable progressive enhancement flags and parse Kitty key events (modifiers + up/down) over the stdin backend. Fall back silently.
- [ ] Test: feed Kitty-encoded key sequences → assert up/down + mods decode. **Commit:** `feat(terminal): Kitty keyboard protocol support`.

---

## Phase P5 — Drawing, damage, output sinks, SYNC

### Task 5.1: Extended pixel drawing ops (TDD)
**Files:** Modify `src/draw/pixel-ops.ts`
- [ ] Add `line(x0,y0,x1,y1,r,g,b)` (Bresenham), `rect`/`fillRect`, `circle`/`fillCircle` (midpoint), `blit(srcRGB,sw,sh,dx,dy[,clip])`, and a clip-rect on the surface (`clip(x,y,w,h)`/`noClip()`); all bounds+clip aware, zero-alloc.
- [ ] **Write failing tests** first: e.g. `line(0,0,3,0)` sets 4 pixels; `circle` sets the 8 octant symmetric points; `blit` respects clip. Run → fail → implement → pass. **Commit:** `feat(terminal): line/rect/circle/blit + clip-rect`.

### Task 5.2: Dirty-rect / scissor diff + double buffer + damage API
**Files:** Modify `src/surface/pixel.ts`, `src/diff/registry.ts`
- [ ] Add `damage(x,y,w,h)` / `damageAll()`; `buildFrame` restricts cell iteration to the union of damaged regions when scissor mode is on (otherwise full-grid as today). Default OFF (preserves byte-identity); opt-in via option.
- [ ] Add `present({sync,buffers})`: double/triple buffer toggle (swap prev-cache sets). Test: damaged region emits only those cells; full mode unchanged (byte-identical to baseline). **Commit:** `feat(terminal): dirty-rect scissor + double-buffer + damage API`.

### Task 5.3: DEC synchronized output (mode 2026)
**Files:** Create `src/core/sync.ts`; Modify `src/app/loop.ts`, surfaces
- [ ] `beginSync()`=`ESC[?2026h`, `endSync()`=`ESC[?2026l`; `present({sync:true})` wraps the single stdout write so the frame swaps atomically. Feature-detect via DECRQM (`ESC[?2026$p`) in capabilities; no-op when unsupported. (Prior art: `gameboy-tty`/`gba-tty` `SYNC_BEGIN/END`.)
- [ ] Test: `present({sync:true})` output starts with `?2026h` and ends with `?2026l` when supported; identical-minus-wrapper when not. **Commit:** `feat(terminal): DEC synchronized output (2026) atomic present`.

### Task 5.4: Pipe/record sink
**Files:** Create `src/core/sink.ts`; Modify surfaces
- [ ] A `FrameSink` interface; built-ins: stdout (default), file, and writable stream/socket. `surface.present({sink})` writes the diffed byte stream to the sink (for headless/remote rendering). Records the raw escape stream replayable into a terminal.
- [ ] Test: present to an in-memory sink, assert it receives the same bytes `frameBytes()` returns. **Commit:** `feat(terminal): pluggable frame pipe/record sink`.

---

## Phase P6 — Unified loop + capability detection + plugin polish

### Task 6.1: `run` / `runText` on a shared runLoop
**Files:** Create `src/app/loop.ts`, `src/app/hud.ts`
- [ ] Port `runDemo`→`run` (`_term.ts:1287-1522`) and `runTextDemo`→`runText` (`_textterm.ts:799-1066`) onto ONE internal `runLoop` (live/CAPTURE_PNG/BENCH branches, fixed-timestep capture, EMA fps, hi-res pacing, snapshot-overlay-restore PNG, resize-rebuild). Preserve: pixel default `targetFps:0`, char default `60`; env knobs; HUD variants. Wire the unified `InputManager` (resize now event-driven via console backend, fallback poll).
- [ ] Gate: re-run a couple of migrated demos under CAPTURE_PNG → byte-identical to oracle. **Commit:** `feat(terminal): unified run/runText app loop`.

### Task 6.2: Capability detection + CAPABILITIES manifest
**Files:** Create `src/core/capabilities.ts`
- [ ] `detectCapabilities()`: probe truecolor/256 (env `COLORTERM`, `TERM`), DEC 2026 (DECRQM), Kitty (`?u`), SGR-pixel, mouse. `CAPABILITIES` const = static manifest `{modes:[...],diffs:[...],depths:[...],inputBackends:[...],features:[sync,kitty,paste,focus,sgrPixel,dirtyRect,doubleBuffer,sink],options:{...}}` for agent enumeration.
- [ ] Test: `CAPABILITIES.modes` includes the 5 built-ins; `detectCapabilities()` returns a typed object. **Commit:** `feat(terminal): runtime capability detection + CAPABILITIES manifest`.

### Task 6.3: Plugin registry polish + hot-path guard
**Files:** `src/modes/registry.ts`, `src/diff/registry.ts`, `src/core/input.ts`, `src/modes/ramps.ts`
- [ ] Finalize `registerMode/registerRamp/registerInputBackend/registerDiff` + enumerators. Confirm built-ins are registered THROUGH these APIs at module load. Bench guard: a frame with only built-ins must match the pre-plugin byte output and fps (no per-cell registry lookup). **Commit:** `feat(terminal): finalize plugin registration API`.

### Task 6.4: `index.ts` public barrel + tsc gate
**Files:** `packages/terminal/index.ts`
- [ ] Re-export the full public surface (spec §4). `bunx tsc --noEmit -p packages/terminal/tsconfig.json` AND `-p packages/all/tsconfig.json` → 0 errors. **Commit:** `feat(terminal): public barrel; tsc clean`.

---

## Phase P7 — Migration: relocate scene-math, re-point demos, delete originals

### Task 7.1: Create the demo `_kit.ts`
**Files:** Create `packages/all/example/_kit.ts`
- [ ] Move `clamp,clamp01,lerp,smoothstep,fract,TAU,aces,hsv,mulberry32,hash2` verbatim from `_term.ts:87-140` into `_kit.ts` (exported). Unit-equivalence: identical numeric output. **Commit:** `feat(example): demo-local _kit.ts (scene-math relocated)`.

### Task 7.2: Re-point all `./_term` consumers (19 runDemo demos + bench/tests)
**Files:** Modify each `./_term` consumer (see `.scratch/survey/05` §A)
- [ ] Rewrite imports: engine symbols (`Term,run`(was runDemo)`,encodePNG,createFrameWaiter,TermMode/Diff/Depth`) ← `@bun-win32/terminal`; scene-math (`clamp,hsv,...`) ← `./_kit`. Update `runDemo(`→`run(` call sites. Per-demo: regenerate PNG, assert byte-identical to oracle (`.scratch/oracle/png/<demo>.png`).
- [ ] Migrate `gameboy-tty.ts`/`gba-tty.ts`: replace their ad-hoc `dlopen('kernel32.dll',{...})` console-input blocks with the package input/console backend (or `@bun-win32/kernel32` + P1 decoders); keep their custom loop; byte-identical PNG gate. Keep `Kernel32`/`Xinput1_4` from `../index` (orthogonal).
- [ ] Migrate `video-term.ts` (reconfigure + type aliases) carefully; verify live mode-cycling still works (manual/headless).
- [ ] Do this in parallelizable batches (one agent per demo) with the byte-identical gate per demo. **Commit per batch:** `refactor(example): re-point <demos> to @bun-win32/terminal`.

### Task 7.3: Re-point `./_textterm` consumers
**Files:** Modify `claude-tui.ts,desktop.ts,chromascii.ts,video.ts`
- [ ] Engine (`CharTerm,runText`(was runTextDemo)`,RGB,BOX,BLOCK,BoxStyle`) ← `@bun-win32/terminal`; scene-math ← `./_kit`. Byte-identical gate each. **Commit:** `refactor(example): re-point textterm demos to @bun-win32/terminal`.

### Task 7.4: Port test/bench harnesses + delete originals
**Files:** Create `packages/terminal/terminal.bench.ts`; Modify `gameboy-tty.logic.test.ts`; Delete `_term.ts,_textterm.ts,_term.selftest.ts,_textterm.selftest.ts,_term.modes.test.ts,_term.bench.ts`
- [ ] `terminal.bench.ts` = ported `_term.bench.ts` extended to the FULL matrix (5 modes incl. ascii × {exact,threshold,256,16,none} × {120×40,200×60,320×100} × {static,sparse-3%,coherent}).
- [ ] Re-point `gameboy-tty.logic.test.ts` (`Term` ← package). Convert selftests into package `example/` persona demos or delete if superseded.
- [ ] Delete the 6 original engine/test/bench files. Update `packages/all/package.json` scripts (drop `_term`/`_textterm` refs) and `packages/all/index.ts` if it referenced them.
- [ ] **Full gate:** `bunx tsc --noEmit -p packages/all/tsconfig.json` 0 errors; every demo PNG byte-identical; `terminal.modes.test.ts` green. **Commit:** `refactor(terminal): delete _term/_textterm; demos consume the package`.

---

## Phase P8 — AI-first docs + manifest + acceptance test

### Task 8.1: AI.md + README + TSDoc
**Files:** `packages/terminal/AI.md`, `README.md`; TSDoc across `src/` public surface
- [ ] AI.md (repo "how to use" style, a few KB): capability→API table, "Where to look" table, copy-paste RECIPES for game loop / TUI / play video / write plugin. README human quick-start.
- [ ] Exhaustive TSDoc on public API (`/** @inheritdoc */` on overrides; no comment-block headers). **Commit:** `docs(terminal): AI.md + README + TSDoc`.

### Task 8.2: Fresh-agent acceptance test (spec §5)
- [ ] Dispatch a fresh subagent given ONLY `packages/terminal/AI.md` + `index.ts` types (engine `src/` withheld) tasked to write: a game loop, a TUI, a plugin. Each must tsc-clean + run under CAPTURE_PNG. If it fails, fix AI.md/types (not the test) and repeat. Record the produced files under `packages/terminal/example/acceptance/`. **Commit:** `test(terminal): fresh-agent doc acceptance (game/TUI/plugin)`.

---

## Phase P9 — Full baseline + beat-the-baseline bench

### Task 9.1: Establish the complete baseline matrix
**Files:** `packages/terminal/FINDINGS.md`
- [ ] Run `terminal.bench.ts` → record the FULL matrix as the "post-migration baseline" (and confirm ≥ the `.scratch/oracle/bench-baseline.md` numbers on overlapping cells; any regression here is a migration bug to fix before P10). **Commit:** `bench(terminal): full baseline matrix in FINDINGS.md`.

---

## Phase P10 — Optimization loop (≥10 verified rounds, spec §8/§11)

### Task 10.x (repeat ≥10 rounds; continue until 2 empty rounds)
- [ ] **Round R:** dispatch parallel ultracode agents on lenses {hot-path · bytes/frame · visual fidelity · input latency · API ergonomics · AI-doc clarity · plugin overhead}. Each returns a MEASURED finding (number + repro + diff).
- [ ] **Adversarially verify** each finding with an independent agent (require a measurement; reject vibes). 
- [ ] Implement confirmed wins; re-run full bench matrix + byte-identical gate + modes.test. Reject any change that regresses another config or breaks a gate.
- [ ] Log before→after deltas in `FINDINGS.md`. **Commit per round:** `perf(terminal): round R — <wins> (Δ recorded)`.
- [ ] Stop after two consecutive rounds with no surviving verified win. Write the cumulative `FINDINGS.md` summary.

---

## Phase P11 — Definition-of-Done sweep

### Task 11.1: Final verification against spec §12
- [ ] tsc 0 errors (package + all); `terminal.modes.test.ts` green; all demos byte-identical or justified; 4 personas run from `example/`; all §3 capabilities present + tested; plugin built-ins dogfood; AI.md acceptance passed; bench ≥ baseline everywhere + flagship improved; kernel32 audit clean + versioned; FINDINGS.md complete.
- [ ] Produce a final report mapping each DoD checkbox to evidence. Do NOT publish/push. **Commit:** `chore(terminal): DoD verification report`.

---

## File Structure (created/modified summary)
- **New package:** `packages/terminal/**` (src/core, src/surface, src/modes, src/diff, src/color, src/glyphs, src/draw, src/app, example, index.ts, AI.md, README.md, package.json, tsconfig.json, terminal.modes.test.ts, terminal.bench.ts, FINDINGS.md).
- **Upstream:** `packages/kernel32/types/Kernel32.ts` (+ maybe structs/Symbols), version bump, `packages/kernel32/example/console-input.test.ts`.
- **Migration:** `packages/all/example/_kit.ts` (new); ~30 demos re-pointed; `packages/all/package.json` (deps+scripts), `packages/all/index.ts`; DELETE `_term.ts,_textterm.ts,_term.selftest.ts,_textterm.selftest.ts,_term.modes.test.ts,_term.bench.ts`.
- **Oracle/scratch:** `.scratch/oracle/**` (committed).

## Self-review notes
- Spec coverage: every spec §3 capability → a P3/P4/P5/P6 task; §4 plugins → P3.1/P6.3; §5 AI → P8; §6/§9 perf → P0.3/P9/P10; §7 tests → gates in every phase; §9 upstream → P1; §10 DoD → P11. ✓
- Behavioural invariants (mouse units, targetFps defaults, onKey semantics, capture defaults, PNG framing) called out in P3/P6/P7 gates. ✓
- Naming consistency: `run`/`runText`, `Term`/`CharTerm`, `createFrameWaiter`, `decodeInputRecord`/`decodeCSBI`/`packCOORD`, `registerMode/Ramp/InputBackend/Diff`, `detectCapabilities`/`CAPABILITIES` used consistently across tasks. ✓
