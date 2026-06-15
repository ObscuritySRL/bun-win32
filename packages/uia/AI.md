# AI Guide for @bun-win32/uia

Everything below is reachable from `@bun-win32/uia` (or its unscoped alias `bun-uia`) alone. **Bun + Windows only.** This file is the complete surface — an agent should not need to read the source. When it must, the "Where to look" section says exactly which one file to open.

## What it is

Playwright for Windows desktop apps. Query the live UI Automation (accessibility) tree by name / control-type / automationId, invoke controls, type, read values, wait for elements to appear, and serialize a window's tree to JSON for an LLM agent. Three engines behind one facade:

1. **IUIAutomation COM client** (the spine) — driven through a cast-free vtable invoker. Query + invoke + patterns + cache.
2. **Flat `uiautomationcore` C-API** — a VARIANT-free fast path (secondary; the COM path is the default).
3. **`oleacc` MSAA fallback** — for legacy / owner-draw windows that expose no useful UIA tree.

Escalation rule: stay on the `uia` facade. Drop to a lower engine (`msaaTree`, the raw `vcall`) only when you need something the facade lacks.

**More than accessibility.** The same facade drives synthetic input (`type`/`click`/`sendKeys` + raw mouse/keyboard helpers), cursor-free interaction (`invoke`/`setValue`/`postClick` — no real-cursor movement, works locked), full-screen + per-window capture, image **template matching** for surfaces with no a11y tree, native **HWND introspection** (Spy++/Winspector-style), an LLM **computer-use** adapter (Anthropic/OpenAI action sets), and a zero-dep **MCP server** — one package covering the a11y (FlaUI), pixel (nut.js/robotjs), and window-spy (Spy++) niches at once.

## Mental model (read this first)

- **UIA is cross-process.** Every property read and `find` marshals into the target app. `initialize()` once (it sets up a single-threaded COM apartment + makes the process DPI-aware); `uninitialize()` at the end, or `using app = uia.attach(...)`.
- **Selectors are hybrid.** Exact scalars (`controlType`, `name` string, `automationId`, `className`) compile to a **server-side** UIA condition — the target app filters in-process and only matches come back. Rich predicates (`name` RegExp, `nameContains`) are matched **client-side** on the (already-narrowed) results. Always scope a search to a window (`attach`), **never** `findAll` from the desktop root.
- **CacheRequest batches.** Naive walks pay N cross-process round-trips; `findAllCached` / `tree()` prefetch a whole subtree in one. The cache wins more the larger the tree.
- **Only the listed patterns are proven.** `invoke`, `value`/`setValue`, `text`, `toggle`, `expand`/`collapse`, `select`, `rangeValue`/`setRangeValue`, container `scroll`/`setScrollPercent`/`scrollInfo` (ScrollPattern — proven on File Explorer's items view, 0%→100%), window `close`/`setVisualState` are each proven against a real control. `scrollIntoView` (ScrollItemPattern) is implemented.
- **Synthetic input needs an unlocked, interactive desktop.** `type`, `sendKeys`, `click` go through `SendInput` — they are silently dropped on a locked session. UIA queries, `invoke`, `setValue`, and `screenshot` all work locked. Prefer `setValue` / `invoke` over `type` / `click` when a pattern exists.
- **Element pointers have apartment affinity.** Keep them on the creating thread; tolerate `UIA_E_ELEMENTNOTAVAILABLE (0x80040201)` if a window closes mid-walk. Window/process lifecycle **events ship** (`waitForWindow` via `SetWinEventHook`; `waitForProcess` polls a toolhelp32 snapshot); UIA property/structure event SUBSCRIPTION is out of scope (MTA) — poll control state with `waitFor`.

## Capability → API

| I want to … | call |
| --- | --- |
| attach to an app | `uia.attach('Calculator')` · `uia.attach({ className })` · `uia.attach({ process: pid })` · `uia.attach(hWnd)` |
| spawn + wait for an app | `await uia.launch(['notepad.exe'], { className: 'Notepad' })` |
| find by name/type/automationId | `app.find({ controlType: ControlType.Button, name: 'Five' })` |
| find all matches | `app.findAll({ controlType: ControlType.Button })` |
| wait for a control (auto-retry) | `await app.waitFor(selector, { timeout: 5000 })` |
| click / press | `el.invoke()` (UIA) · `el.click()` (bbox + SendInput fallback) |
| type | `el.type('text')` (Unicode keystrokes) · `uia.sendKeys('Control+S')` |
| set / read a value | `el.setValue('text')` · `el.value` · `el.text()` (TextPattern) |
| find + select text by content (getByText) | `el.selectText('foo', { ignoreCase })` → matched text or null · `el.getSelectedText()` |
| read a data grid / list / table | `el.readTable()` → `{ headers, rows, totalRows }` (GridPattern, cell-by-cell) |
| read any property / hidden state | `el.getProperty(PropertyId.IsOffscreen)` · `PropertyId.HelpText` · `PropertyId.FrameworkId` · `PropertyId.ItemStatus` |
| toggle / expand / select / slider | `el.toggle()` · `el.expand()`/`el.collapse()` · `el.select()` · `el.setRangeValue(n)` |
| select / multi-select / deselect (cursor-free) | `el.select()` (replace) · `el.addToSelection()` · `el.removeFromSelection()` · `el.getSelection()` · `el.canSelectMultiple` |
| scroll a container (cursor-free, works locked) | `el.scroll(ScrollAmount.NoAmount, ScrollAmount.LargeIncrement)` · `el.setScrollPercent(NoScroll, 50)` · `el.scrollInfo` · `uia.scrollAt(x, y, 'down', 3)` |
| a guaranteed-hittable point inside a control | `el.clickablePoint` → `{ x, y } | null` (UIA GetClickablePoint; `click()` uses it) |
| read state | `el.name` `el.controlType` `el.controlTypeName` `el.automationId` `el.className` `el.isEnabled` `el.boundingRectangle` |
| serialize the tree for an LLM | `uia.tree(app, { agentProfile: true })` |
| run a JSON action list (agent) | `uia.execute(app, [{ find: {...}, do: 'invoke' }, …])` |
| snapshot with stable `[ref=eN]` ids | `const s = uia.snapshot(app); s.resolve('e12')?.invoke(); s.dispose()` |
| Set-of-Marks screenshot | `screenshotWithMarks(app, uia.snapshot(app))` → `{ png, marks }` |
| what changed after an action | `uia.diff(before, after)` → `{ appeared, disappeared, renamed }` |
| wait for the UI to settle | `await uia.waitForIdle(app, { quietMs: 400 })` |
| resolve a pixel to an element | `uia.elementAt(x, y)` → `{ role, name, automationId, bounds }` |
| click WITHOUT moving the cursor | `el.invoke()` (UIA) · `uia.postClick(x, y)` (posted `WM_*`) |
| computer-use action (Anthropic/CUA) | `await dispatch(app, { action: 'left_click', coordinate: [x, y] })` |
| gated / auditable actions | `safeExecute(app, actions, { dryRun, allow, confirm, onAction })` |
| run as an MCP server for Claude | `bunx bun-uia` · `claude mcp add uia -- bunx bun-uia` |
| capture the whole screen / a region | `uia.screenshotScreen()` · `uia.captureScreen({ x, y, width, height })` |
| see a SPECIFIC window even occluded / background / GPU | `await uia.captureWindowLive(hWnd)` (Windows.Graphics.Capture) |
| list the physical monitors | `uia.listMonitors()` → `{ bounds, workArea, primary }[]` |
| move / min / max / restore / close a window (no foreground) | `moveWindow(hWnd,…)` · `minimizeWindow` · `maximizeWindow` · `restoreWindow` · `raiseWindow` · `closeWindow` |
| the exe + state of every window | `uia.windows()` + `processImagePath(pid)` · `isMinimized(hWnd)` · `isMaximized(hWnd)` · `foregroundWindow()` |
| find an image on screen (no a11y) | `uia.locateOnScreen(needle)` → `{ x, y, score }` · `findImage(haystack, needle)` |
| read a pixel color | `uia.pixelColor(x, y)` → `{ r, g, b }` |
| clipboard read / write / paste / copy | `uia.readClipboard()` · `uia.writeClipboard(text)` · `uia.paste(text)` · `await uia.copy()` |
| inspect native window controls (Spy++) | `uia.windowTree(hWnd)` · `renderWindowTree(tree)` · `windowStyles(hWnd)` |
| screenshot a window | `app.screenshot()` → PNG bytes |
| list / target windows | `uia.windows()` · `findWindow({ title })` · `windowForProcess(pid)` |
| fall back to MSAA | `uia.msaaTree(hWnd)` |

## Full API

### `uia` — the facade object
`attach(target)`, `launch(command, target, timeout?)`, `focused()`, `fromPoint(x, y)`, `elementAt(x, y)`, `root()`, `windows()`, `tree(element, options?)`, `snapshot(window, options?)`, `diff(before, after)`, `waitForIdle(element, options?)`, `execute(element, actions)`, `msaaTree(hWnd, maxDepth?)`, `windowTree(hWnd, maxDepth?)`, `click(x, y)`, `postClick(x, y, button?)`, `scrollAt(x, y, dir, amount?)`, `sendKeys(combo)`, `type(text)`, `captureScreen(region?)`, `screenshotScreen(region?)`, `captureWindowLive(hWnd, options?)`, `pixelColor(x, y)`, `listMonitors()`, `locateOnScreen(needle, options?)`, `readClipboard()`, `writeClipboard(text)`, `paste(text)`, `copy()`, `initialize()`, `uninitialize()`.

**Drive in the dark (the doctrine):** an AI is not a human at a screen — it does not need a window foregrounded, visible, under a cursor, or on the active desktop. Cursor-free / no-foreground is the **default**: `invoke` / `setValue` / `toggle` / `scroll` and `postClick` act on a minimized, background, occluded, or locked window with no focus theft and no real cursor; `captureWindowLive` SEES such a window; the whole UIA/native/MSAA tree of a background window is readable untouched. SendInput (`type` / `click` / `sendKeys` / `drag`) and `PrintWindow` are only for (a) a human watching or (b) a pixel-only surface with no semantic layer.

### `class Element`
- Live properties (getters): `name`, `controlType`, `controlTypeName`, `automationId`, `className`, `isEnabled`, `boundingRectangle: Rect`, `nativeWindowHandle: bigint`, `clickablePoint: {x,y} | null` (UIA GetClickablePoint), `value`, `toggleState`, `expandCollapseState`, `isSelected`, `isOffscreen` (scrolled/clipped out of view), `rangeValue`, `scrollInfo: ScrollInfo | null`.
- Tree: `find(selector, scope?)`, `findAll(selector, scope?)`, `findAllCached(selector, request, scope?)`, `children`, `parent`, `await waitFor(selector, { timeout?, interval? })`, `reveal(selector, { container?, maxSteps?, fromTop? })` (scroll a virtualized / off-screen item into the tree), `describeNoMatch(selector)`, `buildUpdatedCache(request)`, `cachedChildren`, `cached{Name,ControlType,AutomationId,ClassName,BoundingRectangle,IsEnabled}`.
- Reads (return null/empty if unsupported): `readTable(maxRows?)` → `TableData { headers, rows, totalRows } | null` (GridPattern data grids / details lists / tables, cell-by-cell, column headers via TablePattern); `cell(row, column)` → the cell Element of a Grid (compose setValue/invoke/toggle for a cursor-free cell edit); `getProperty(propertyId)` → `string | number | boolean | null` (ANY UIA property via GetCurrentPropertyValue — `PropertyId.HelpText`/`IsOffscreen`/`HasKeyboardFocus`/`ItemStatus`/`FrameworkId`/… — the VARIANT is decoded by its vt tag and freed).
- Selection (SelectionItem/Selection patterns, cursor-free): `select()` (replace), `addToSelection()` / `removeFromSelection()` (multi-select / deselect), `getSelection()` → owned `Element[]` (a container's selected items), `canSelectMultiple` getter.
- Text (TextPattern, cursor-free): `selectText(text, { backward?, ignoreCase? })` → matched text | null (the desktop getByText — finds a substring and SELECTS it so you can copy/replace/read it), `getSelectedText()` → the current selection; `text()` → the full document text, `visibleText()` → only the on-screen ranges (GetVisibleRanges — the bounded read for a huge terminal / editor).
- Patterns (throw if unsupported): `invoke()`, `doDefaultAction()` (MSAA LegacyIAccessible default action — a cursor-free activate fallback), `setValue(text)`, `text()`, `toggle()`, `expand()`, `collapse()`, `select()`, `scrollIntoView()`, `scroll(horizontalAmount, verticalAmount)` + `setScrollPercent(h%, v%)` (container ScrollPattern — cursor-free, works locked), `setRangeValue(n)`, `close()`, `setVisualState(WindowVisualState)`.
- Input (need an unlocked session): `focus()`, `type(text)`, `click()`.
- Lifecycle: `release()`, `ptr: bigint`.

### `class Window extends Element`
Adds `hWnd: bigint`, `activate()`, `screenshot(): Uint8Array`, `dispose()` / `[Symbol.dispose]`.

### Selector & matching
`interface Selector { controlType?, name? (string | RegExp), nameContains?, automationId?, className? }`. `interface ElementProperties { name, controlType, automationId, className }` (what `matches` reads). `matches(props, selector)`, `selectorToString(selector)`, `formatNoMatch(selector, windowName, candidateNames)`.

### Root accessors (return a live `Element`/`Window`)
`fromHandle(hWnd)` (an `Element` for a window handle — `attach` wraps this in a `Window`), `focused()`, `fromPoint(x, y)`, `root()`.

### Constants / enums
`ControlType` (Button=50000 … AppBar=50040), `PatternId` (10000–10033), `PropertyId` (30000–30086), `TreeScope`, `PropertyConditionFlags`, `ToggleState`, `ExpandCollapseState`, `WindowVisualState`, `ScrollAmount` (LargeDecrement=0 … SmallIncrement=4), `NoScroll` (-1, SetScrollPercent "leave this axis"), `type ScrollInfo`, `SLOT` (verified vtable slots).

### Cache
`createCacheRequest(properties?, scope?, mode?)`, `class CacheRequest { property, pattern, treeScope, elementMode, release }`, `DEFAULT_CACHE_PROPERTIES`, `AutomationElementMode`.

### Tree / agent
`serialize(element, options?: SerializeOptions): UiaNode`, `interface SerializeOptions { maxDepth?, agentProfile? }`, `interface UiaNode { role, name, automationId?, className?, bounds?, enabled?, children }`, `countNodes`, `estimateTokens`, `execute(element, actions): AgentActionResult[]`, `AGENT_TOOLS`, `groundingTree(element)`, `type AgentAction`.

### Agent v2 — snapshot/refs, marks, diff, idle, coordinate bridge, computer-use, safety, MCP
- **Snapshot with stable refs** (`refmap.ts`): `snapshot(window, { maxDepth? }): Snapshot`; `class Snapshot { tree: RefNode; marks: Mark[]; resolve(ref): Element | null; dispose() }`; `renderSnapshot(node): string` (the compact `- Button "Five" [ref=e12]` text, the Playwright-MCP analog). One Full-mode cached round-trip; the kept Elements are actionable (`resolve(ref).invoke()`); `dispose()` releases them. A provider that refuses that one-shot `Subtree+Full` cache (heavy cross-process Chromium like Opera — verified live) is recovered via a LIVE walk instead of throwing, so a snapshot never crashes the loop; pass `snapshot(window, { live: true })` to force that path for a known cache-hostile provider. (Chromium native chrome is sparse — tabs/address/page live in the web layer; reach them via `webRoots()`/`extraRoots`.) `interface RefNode { ref?, role, name, automationId?, bounds?, enabled?, state?, children }`, `interface Mark { ref, role, name, bounds }`. **Token economy:** `pruneRefTree(node): RefNode | null` drops ref-less unnamed structural noise and collapses single-child Pane/Group/Custom wrappers while keeping EVERY `[ref]` and every named node (no actionable target is ever lost; the ref→Element map is untouched); `capSnapshot(text, maxChars): string` hard-bounds a rendered tree on line boundaries with a `…(K more nodes)` trailer. **Inline state:** each ref'd node carries its live dynamic state inline — `(on)`/`(off)`/`(mixed)`, `(value="…")`, `(expanded)`/`(collapsed)`/`(partial)`, `(selected)`, `(NN%)` — read from the SAME single cached round-trip (gated on each `Is*PatternAvailable`, so a control that doesn't support a pattern never shows a spurious default), so an agent reads checkbox/value/expand/select/slider state straight from the snapshot with no `inspect_element` round-trip.
- **Set-of-Marks** (`marks.ts`): `screenshotWithMarks(window, snapshot): { png, marks }` draws numbered boxes over UIA bounds onto the PrintWindow PNG (a self-contained RGB blitter, 3×5 digit font); `drawMarks(rgb, w, h, originX, originY, marks)`; `interface PlacedMark { ref, label, role, name, bounds }`.
- **Diff** (`diff.ts`): `diffTrees(before, after): { appeared, disappeared, renamed }` over any `DiffNode` (both `UiaNode` and `RefNode` satisfy it — no cast), keyed by structural path + role + automationId — the cheap "what changed after I acted". Each change carries the after-tree `ref` (when actionable). `renderDiff(diff): { text, count }` renders it as compact `+`/`-`/`~` lines (`~ Text "Display is 5" → "Display is 55"`); the MCP loop sends this delta instead of a full re-dump when few things changed and no actionable ref was renumbered.
- **Idle** (`idle.ts`): `await waitForIdle(element, { timeout?, quietMs?, interval? }): boolean` — resolves when the tree hash is stable for `quietMs` (UIA events are a foreign-thread FFI dead-end; this polls one cached round-trip per sample).
- **Coordinate bridge** (`coords.ts`): `elementAt(x, y): PointDescription | null` (pixel → semantic), `postClickAt(x, y, button?)` (CURSOR-FREE posted `WM_*BUTTON` click), `windowAt(x, y)`, `virtualScreen(): Rect`. All (x,y) are virtual-screen-absolute physical pixels; per-window screenshots are window-local (subtract the window's `boundingRectangle.{x,y}`).
- **Computer-use adapter** (`computer.ts`): `await dispatch(window, action, { cursorless? }): ComputerResult` runs the literal Anthropic `computer` action set (`screenshot`, `left_click`, `right_click`, `middle_click`, `double_click`, `triple_click`, `mouse_move`, `left_click_drag`, `left_mouse_down`/`up`, `key`, `hold_key`, `type`, `scroll`, `cursor_position`, `wait`) **semantic-first and cursor-free** — a coordinate click resolves the element under the point and `invoke()`s it (no real-cursor movement, works locked), falling back to a posted click, then a SendInput click. `fromCuaAction(raw)` converts an OpenAI CUA `computer_call`; `normalizeKey(combo)` maps xdotool/CUA key names to `sendKeys`. **`scroll` is cursor-free** — it walks to the nearest `ScrollPattern` container under the point and drives it (works locked), falling back to the SendInput wheel. A full **`example/agent-loop.ts`** wires the live Anthropic Messages API (`computer_20251124`, `claude-opus-4-8`) straight to `dispatch` so Claude drives a real app end-to-end (raw `fetch`, no shipped SDK dep, gated on `ANTHROPIC_API_KEY`).
- **Raw input** (`input.ts`): cursor-moving SendInput helpers `rightClickAt`/`middleClickAt`/`doubleClickAt`/`moveTo`/`scrollWheel`/`dragTo`/`mouseDown`/`mouseUp`/`keyDown`/`keyUp`/`holdKey`/`cursorPosition`. Prefer the cursor-free UIA path; these need an unlocked, foregrounded desktop.
- **Safety** (`safety.ts`): `safeExecute(window, actions, { dryRun?, allow?, deny?, confirm?, onAction? })` — a default-off gate that never throws across a tool loop; `toToolResult(results)` → Anthropic `tool_result` content with `isError`; `redactTree(node, pattern)` masks secure-text names. A **client-side gate, not a sandbox** — designed to sit inside VM/container isolation.
- **MCP server** (`mcp.ts`, bin `bun-uia-mcp`): a zero-dependency stdio JSON-RPC MCP server (protocol `2025-11-25`) exposing the full surface as **46 tools**, gated by a deployer policy (see below). Register with `claude mcp add uia -- bunx bun-uia` (or `bun ./mcp.ts`). Snapshot-first and ref-keyed (every ref carries its live state inline — `Button "Wi-Fi" [ref=e7] (on)`, `Edit [ref=e9] (value="…")`, `TreeItem [ref=e3] (expanded, selected)` — so no per-ref inspect round-trip); action tools auto-append a fresh **smart observation** — the smallest faithful form: nothing when the tree is byte-identical, a compact `Δ` delta (`~ Text "Display is 5" → "Display is 55"`) when only a few things changed and no actionable ref was renumbered, else the full tree — and every appended tree is **pruned** of ref-less noise and **size-capped** (so a heavy IDE/browser window can't dump unbounded tokens per step). `desktop_snapshot`'s `maxDepth` bounds the tree and `root` (a node name / automationId) re-grounds on just that element's subtree — zoom into a large window instead of re-dumping it. A thrown tool error becomes `isError:true` so the model self-corrects. Tools carry spec-correct annotations (`readOnlyHint` on reads, `destructiveHint`/`idempotentHint` on writes, `openWorldHint` only on the OS-reach tools).
  - **Senses (read):** `list_windows` (now with exe + min/max/foreground state), `attach`, `desktop_snapshot`, `get_focused`, `inspect_element` (full live state of a ref + its TextPattern text — terminal/console scrollback, document/editor bodies read cursor-free), `read_table` (a data grid / list / table read cell-by-cell via GridPattern, with column headers), `inspect_point` (pixel → control), `screenshot` (PrintWindow → **WGC** → desktop-region fallback), `screen_capture` (whole desktop / region / 2nd monitor), `capture_window` (**Windows.Graphics.Capture** — see a SPECIFIC window even occluded / background / GPU-composited), `screenshot_marked` (Set-of-Marks + legend), `native_tree` (Spy++ HWND view), `msaa_tree` (legacy fallback), `list_monitors`, `wait_for`, `wait_idle`, `wait_for_window` (SetWinEventHook), `wait_for_process` (polls a toolhelp32 snapshot), `list_processes`, `ocr` (read text out of raw pixels — the path on a surface with no a11y tree).
  - **Reach (act) — cursor-free first:** `click` (UIA invoke → posted click → real cursor only on `cursor:true`), `invoke`, `set_value`, `toggle`, `select` (list/grid/tree item; mode replace/add/remove for cursor-free multi-select), `find_text` (getByText — find a substring in a document and select it), `type`, `press_key`, `scroll`, `paste`, `find_and_act`, `set_clipboard`, `read_clipboard`, `copy`, `drag`, `hold_key`, `manage_window` (move/min/max/restore/raise/close, no foreground), `reveal` (scroll a virtualized / off-screen item into the tree — the only path to rows below the fold), `click_point` (click absolute pixels), `click_text` (OCR a window then click the text that says X — cursor-free, for no-a11y surfaces).
  - **Beyond the GUI (gated, default OFF):** `launch_app`, `run_program`, `open_path`, `read_file`, `write_file`, `list_dir`.
  - **Deployer policy (`BUN_UIA_PROFILE`):** `readonly` (senses only) · `safe` (**default** — senses + cursor-free desktop control + window management, no OS reach) · `full` (everything). Overrides: `BUN_UIA_OS=1` (enable launch/run/file), `BUN_UIA_ALLOW`/`BUN_UIA_DENY` (tool or category), `BUN_UIA_CURSOR=never` (forbid real-cursor fallback — strictly cursor-free), `BUN_UIA_FS_ROOT=<path>` (sandbox file tools). `tools/list` advertises only enabled tools; a blocked call returns a clear policy `isError`; per-action human confirmation is the MCP host's job (driven by the `destructiveHint` annotations).

### Beyond accessibility — pixels (no-a11y surfaces) + native windows
- **Screen capture** (`screen.ts`): `captureScreen(region?): Bitmap` (BitBlt of the screen DC — whole virtual desktop or a region), `screenshotScreen(region?): Uint8Array` (PNG), `pixelColor(x, y): { r, g, b }`. `interface Bitmap { rgb, width, height, originX, originY }`. The nut.js / robotjs screen-grab niche, in-process. `listMonitors(): MonitorInfo[]` (coords.ts) enumerates the physical displays.
- **Live window capture** (`wgc.ts`): `await captureWindowLive(hWnd, { timeoutMs? }): Bitmap | null` reads the LIVE pixels of a SPECIFIC window via **Windows.Graphics.Capture** — even when it is occluded, in the background, or GPU/DWM-composited (hardware-accel Chromium/Edge/Electron, games, WinUI) — the content `PrintWindow` returns blank for; the same surface Alt+Tab previews use, with no foregrounding. Pure bun:ffi: WinRT activation (combase, apartment-agnostic under the package's STA) + a D3D11 device + a free-threaded `Direct3D11CaptureFramePool` whose frame is drained by **polling** `TryGetNextFrame` (no `FrameArrived` handler → the foreign-thread JSCallback dead-end is structurally avoided). The device bundle is cached across calls. `uia.uninitialize()` releases that bundle (D3D11 device + WinRT interfaces) and the next capture rebuilds a fresh one — so an init→capture→uninitialize→capture loop is clean (no leak, no stale-bundle reuse); `disposeWgc()` frees it on demand. Degrades to `null` for a minimized window (no composed surface), a locked/disconnected session (DWM stops compositing), or DRM-protected content (renders black). `wgcAvailable(): boolean`. `Window.screenshot()` and the MCP `screenshot` tool fall back to this automatically when `PrintWindow` is blank.
- **Template matching** (`match.ts`): `findImage(haystack, needle, { threshold?, step? }): Match | null` (pure-TS mean-abs-diff, coarse-to-fine), `locateOnScreen(needle, options?): Match | null` (captures the screen, finds the needle, returns ABSOLUTE coords ready to click). `interface Match { x, y, score }`. The "find an image on screen" fallback for surfaces with no UIA tree (games, canvas, browsers that don't expose content): capture a region now, locate it later, click its center.
- **Native window introspection** (`spy.ts`): `windowTree(hWnd, maxDepth?): NativeWindow` — the raw HWND hierarchy (class, text, control id, decoded `WS_*`/`WS_EX_*` styles, rect); `renderWindowTree(node): string`; `windowStyles(hWnd)`. The Spy++ / Winspector view; complements UIA by exposing the native structure and the classic-Win32 controls UIA misses. `interface NativeWindow { hWnd, className, text, controlId, styles, exStyles, rect, children }`.
- **Clipboard** (`clipboard.ts`): `readClipboard(): string`, `writeClipboard(text): boolean`, `paste(text): void` (set the clipboard + Ctrl+V — the reliable large-text path, no per-keystroke SendInput corruption), `await copy(): Promise<string>` (Ctrl+C + read — pull the selected text from any app, even one with no a11y tree). CF_UNICODETEXT via the Global* heap.

### Windows / input / msaa / low-level
`findWindow`, `listWindows`, `windowForProcess`, `screenshot`, `captureWindowRGB`, `type WindowInfo`; `sendKeys`, `clickAt`, `virtualKeyCode`, `INPUT_SIZE`, `packKeyboardInput`, `packMouseInput`; `msaaTree`, `accessibleFromWindow`, `type MsaaNode`; `vcall`, `comRelease`, `guid`, `hresult`, `getBstr`, `getLong`, `getRect`, `getHandle`, `getPropertyValue`, `getCachedPropertyValue`, `decodeBstr`, `encodePNG`, `initialize`, `uninitialize`, `automation`, `trueCondition`, `compileCondition` (`type CompiledCondition`), `type Rect`. (`find`/`findAll`/regex selectors + every `waitFor` poll reuse the memoized `trueCondition` singleton — no per-call CreateTrueCondition; `waitFor` compiles its condition once, not per poll.)

## Recipes

```ts
// Notepad round-trip (the 10-line wow) — needs an unlocked session for type()
import { ControlType, uia } from '@bun-win32/uia';
const app = await uia.launch(['notepad.exe'], { className: 'Notepad' });
const edit = await app.waitFor({ controlType: ControlType.Document });
edit.focus().type('hello from bun-uia');
console.log(edit.text());
```
```ts
// Calculator 5 + 3 = 8 (works on a locked session — invoke is UIA, not SendInput)
const calc = await uia.launch(['cmd', '/c', 'start', 'calc'], { title: 'Calculator' });
for (const name of ['Five', 'Plus', 'Three', 'Equals']) calc.find({ controlType: ControlType.Button, name })?.invoke();
console.log(calc.find({ automationId: 'CalculatorResults' })?.name); // → "Display is 8"
```
```ts
// Wait for a dialog, dismiss it
uia.sendKeys('Control+S');
const cancel = await app.waitFor({ name: 'Cancel', controlType: ControlType.Button }, { timeout: 4000 });
cancel.invoke();
```
```ts
// Tree → JSON for an LLM agent (ground-truth identity + bounds, no pixel-counting)
const grounding = uia.tree(app, { agentProfile: true }); // { role, name, bounds, children }
const results = uia.execute(app, [{ find: { name: 'Five' }, do: 'invoke' }, { find: { automationId: 'CalculatorResults' }, do: 'read' }]);
```
```ts
// Reliable text entry without keyboard focus battles (works locked): ValuePattern
edit.setValue('typed without keystrokes');
// Verify visually
await Bun.write('shot.png', app.screenshot());
```
```ts
// MSAA fallback for an app with no good UIA tree
const accessible = uia.msaaTree(hWnd, 6);
```
```ts
// Ref-keyed snapshot for an agent (Playwright-MCP style) — act by ref, no pixel-counting
const shot = uia.snapshot(app);
console.log(renderSnapshot(shot.tree)); // - Button "Five" [ref=e49] id=num5Button …
shot.resolve('e49')?.invoke();          // act on the live Element behind the ref (cursor-free)
shot.dispose();                         // release the snapshot's Elements
```
```ts
// Computer-use, cursor-free: a coordinate click becomes a semantic UIA invoke (the real mouse never moves)
const result = await dispatch(app, { action: 'left_click', coordinate: [x, y] });
// result.output → 'invoked Button "Five" (cursor-free)'; result.semantic → { role, name }
```
```ts
// Set-of-Marks: numbered boxes over interactable controls, derived free from UIA bounds
const marked = screenshotWithMarks(app, uia.snapshot(app));
await Bun.write('marks.png', marked.png); // marked.marks → [{ ref, label, role, name, bounds }, …]
```
```ts
// Settle, then diff what changed after an action (cheap per-step observation)
const before = uia.tree(app);
app.find({ name: 'Equals' })?.invoke();
await uia.waitForIdle(app, { quietMs: 400 });
console.log(uia.diff(before, uia.tree(app))); // { appeared, disappeared, renamed }
```

## Gotchas (the traps ledger)

- **Selectors are client-scoped, never from the desktop root.** `attach` a window first; `find` defaults to `TreeScope_Descendants` of that window.
- **`ElementFromHandle` is vtable slot 6** (slot 7 is `ElementFromPoint`). The package has the verified slot table; if you hand-roll `vcall`, regenerate slots from `UIAutomationClient.h` and prove each — a wrong slot segfaults.
- **Server-side property conditions work** (the 16-byte VARIANT goes by hidden pointer in the x64 ABI). `nameContains` / RegExp still filter client-side.
- **`type` / `sendKeys` / `click` are dropped on a locked session.** Prefer `setValue` / `invoke`; they work locked. `screenshot` (PrintWindow) also works locked.
- **Cursor-free is the robust default.** `invoke` / `setValue` / `toggle` and `uia.postClick(x, y)` move no real cursor and work on a locked session; the computer-use `dispatch` is cursor-free first (resolve the point → `invoke`). SendInput (`type` / `click` / `sendKeys`) needs an unlocked, **foregrounded** window and can be refused by the foreground lock (e.g. over RDP) — `activate()` the window first and prefer patterns.
- **Process is DPI-aware** after `initialize()` so click coordinates match UIA bounds; `click()` uses `SetCursorPos` + physical pixels.
- **`SendInput` cbSize must be 40** (handled internally) — the x64 `INPUT` is 40 bytes.
- **BSTR names are bulk-copied before free**; never read after `SysFreeString`.
- **A null/zero interface pointer throws, not crashes.** `vcall` guards `thisPtr === 0n` (so `new Element(0n).name` raises a catchable Error instead of segfaulting); MSAA `accChildCount` is clamped so a hostile provider can't force a giant allocation. The COM vtable SLOTs of all three engines (UIA + WGC + MSAA/D3D11) are gated by `slot-gate.test.ts` against the SDK headers — a transposed slot fails the gate instead of segfaulting at runtime.
- **Only proven patterns ship.** Calling a pattern an element doesn't support throws a clear message (pointing at `.click()` / `.type()` where relevant). Container `scroll`/`setScrollPercent` (ScrollPattern) is proven; `scrollIntoView` (ScrollItemPattern) is implemented.
- **Browsers / Electron web content IS a UIA tree — reach it via `webRoots()`.** Chromium/Edge/Electron render their page into a `Chrome_RenderWidgetHostHWND` child fragment the top-level walk does NOT bridge, so a plain `attach`+`snapshot` of the top-level shows only the chrome — but `window.webRoots()` attaches to each render-widget child and `snapshot(window, { extraRoots: webRoots })` (exactly what the MCP `desktop_snapshot` does automatically) splices that page DOM into the tree, so you read / `setValue` / `invoke` web controls with the same refs and patterns as any native control — cursor-free, no foreground, no screen-reader flag (proven in `example/web-content.integration.test.ts`: read an input, set it, invoke a button, read the DOM update). The pixel layer (`captureScreen` + `locateOnScreen` + coordinate `click`) is the fallback ONLY for surfaces with no a11y tree at all (games, canvas/WebGL, custom-draw). WebView2-embedded content → CDP (`--remote-debugging-port`).
- **UWP / WinUI Store apps read via UIA — they are NOT blind.** Settings, Store, Photos, Mail, Phone Link, etc. host their XAML in a `Windows.UI.Core.CoreWindow` under an `ApplicationFrameWindow`; UIA bridges them, so `attach` + `desktop_snapshot` on the frame yields the controls cursor-free (proven: Settings' full navigation, 26 refs / 14 list items — `example/uwp-content.integration.test.ts`).
- **The a11y tree is LAZY — a cold/idle window can read sparse.** Like Chromium, a UWP/WinUI app (and a backgrounded browser) builds its UIA tree on demand and tears it down when long-idle, so the FIRST `desktop_snapshot` of a just-launched or long-idle window can be near-empty. Re-snapshot (poll a few times) until it populates; if it stays empty it may need a brief activate. A `0`-control snapshot of an app that clearly has UI usually means a cold tree, not a tree-less surface — don't fall back to pixels until a re-snapshot also comes back empty.
- **Menus are drivable cursor-free — expand, then re-snapshot.** `expand()` the top `MenuItem` (ExpandCollapse pattern — no focus, no cursor), then `desktop_snapshot` again: a modern (WinUI/Win32) app surfaces the submenu's `MenuItem`s in the SAME tree (e.g. Notepad File: 4 → 17 items), so `invoke()` the one you want. A combobox dropdown, a classic `#32768` context menu, a WPF/WinUI Popup, or an autocomplete list opens in its OWN untitled top-level window: `list_windows {includePopups}` (SDK `listWindows({includeUntitled})`) surfaces it, then `attach` it by hWnd and snapshot its items (a Chromium dropdown's items are in its webRoots, like any Chromium window). Same pattern for a context menu: right-click via a posted click, then `list_windows {includePopups}`.
- **Non-English / different builds** differ: Calculator's result element is `automationId: 'CalculatorResults'`, buttons are named `Five`/`Plus`/… (full words). Configure selectors per app.
- **Threading / events:** v1 is STA, fire-and-forget out-of-process driving. WINDOW and PROCESS lifecycle events ARE available (`wait_for_window` via `SetWinEventHook` pumped on the main thread — no foreign-thread hazard; `wait_for_process` polls a toolhelp32 snapshot). UIA property/structure event SUBSCRIPTION and self-UI automation need MTA and remain out of scope — poll with `wait_for` / `wait_idle`.

## Where to look (source)

`automation.ts` activation + the singleton · `com.ts` `vcall`/`guid` · `constants.ts` ids + verified slots · `element.ts` `Element`/`Window`/`attach`/`launch`/`waitFor` · `condition.ts` the typed selector · `patterns.ts` control patterns · `input.ts` `SendInput` + raw-input helpers · `cache.ts` CacheRequest · `tree.ts` agent grounding · `window.ts` targeting + screenshots (`captureWindowRGB`) · `msaa.ts` oleacc fallback · `agent.ts` the LLM tool adapter · `reads.ts` property readers · `refmap.ts` ref-keyed `Snapshot` · `marks.ts` Set-of-Marks blitter · `diff.ts` tree diff · `idle.ts` `waitForIdle` · `coords.ts` coordinate↔element bridge + cursor-free click · `computer.ts` computer-use adapter · `safety.ts` action gate · `mcp.ts` the stdio MCP server · `screen.ts` full-screen/region capture + pixel color · `wgc.ts` Windows.Graphics.Capture (live occluded/GPU window capture) · `match.ts` template matching · `spy.ts` native HWND introspection (Spy++) · `clipboard.ts` clipboard read/write/paste/copy.
