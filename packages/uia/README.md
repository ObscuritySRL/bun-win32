# @bun-win32/uia

**Playwright for the Windows desktop — and an MCP server that hands Claude a whole Windows machine.** Find controls by **name, not pixels**, then click, type, wait, read, and assert across any native app — through the live UI Automation accessibility tree, from Bun, with **zero native dependencies**. No node-gyp, no prebuild matrix, no Appium server, no .NET.

**Two ways to use it:**

- **In your project** — E2E-test and automate Windows GUIs the way Playwright tests the web: `find({ name })` → `waitFor` → `invoke`/`setValue`/`type` → assert `value`/`text()`. Semantic targeting survives the DPI, theme, and layout shifts that break pixel scripts.
- **As an AI agent's hands** — `claude mcp add uia -- bunx bun-uia` and Claude (or any MCP client) drives the entire desktop through the a11y tree: by name, **cursor-free**, ~15 ms/step, even on a locked session.

> The unscoped alias [`bun-uia`](https://www.npmjs.com/package/bun-uia) re-exports this package — `bun add bun-uia` is the discoverable front door.

```ts
import { ControlType, uia } from '@bun-win32/uia';

const app = await uia.launch(['notepad.exe'], { className: 'Notepad' });
const edit = await app.waitFor({ controlType: ControlType.Document });
edit.focus().type('nothing native compiles, and it just works');
console.log(edit.text()); // → nothing native compiles, and it just works
```

```ts
// Drive Calculator to 5 + 3 = 8 by name — survives DPI/theme/layout shifts that break pixel scripts:
const calc = await uia.launch(['cmd', '/c', 'start', 'calc'], { title: 'Calculator' });
for (const name of ['Five', 'Plus', 'Three', 'Equals']) calc.find({ controlType: ControlType.Button, name })?.invoke();
console.log(calc.find({ automationId: 'CalculatorResults' })?.name); // → "Display is 8"
```

`bun add @bun-win32/uia` is the entire install story.

## Why this exists

The Windows desktop-automation cluster on npm is a field of native-addon pain, paywalls, and abandoned daemons. Downloads verified against `api.npmjs.org` for the week of 2026-06-05→11.

| Tool | Weekly dl | Install / runtime | The catch |
| --- | --- | --- | --- |
| `@nut-tree-fork/nut-js` | 32,360 | libnut N-API addon (cmake-js) | Fork of a **paywalled** original — *"all of my packages around nut.js will cease to exist publicly on npm … only available through the private … registry, which requires an active subscription."* Pixel/image-match, **no a11y tree**. |
| `appium-windows-driver` | 30,749 | Appium server **+ a separate WinAppDriver.exe** | *"WinAppDriver server has not been maintained by Microsoft for years … Developer mode must be enabled."* Two daemons + a W3C HTTP hop per element read. |
| `@jitsi/robotjs` / `robotjs` | 15,333 / 11,375 | node-gyp / prebuild matrix | *"No prebuilt binaries found … node-gyp rebuild"* C++ compile fallback — the #1 documented install failure. Blind pixel + keystroke, **no element model**. |
| `uiohook-napi` (input hooks) | 21,965 | N-API addon | Healthy — but global `SetWindowsHookEx` hooks run on a foreign thread and can assert/segfault (node-addon-api #903). |
| `@bright-fish/node-ui-automation` | 33 | NAPI/COM native addon | The only real npm UIA wrapper — **dead since 2022**. |
| NodeRT `windows.ui.uiautomation` | 15 | NodeRT native addon | Dead 2022 **and wrong namespace** (projects WinRT, not the Win32 `IUIAutomation`). |
| FlaUI / pywinauto / AutoIt | n/a | .NET / Python / bespoke EXE | A foreign runtime to install and ship. |

**There is no zero-install, typed, in-process `IUIAutomation` client for Node or Bun.** @bun-win32/uia is a few kilobytes of TypeScript over `bun:ffi` — the runtime's own FFI, not a third-party N-API addon that rots against each Node minor (*"PLEASE ARCHIVE THIS REPO"* — node-ffi-napi #269). It **can't be paywalled** (no compiled binary to gate behind a subscription registry), has **no build step** (no node-gyp, no ABI matrix, no MSVC/Python), and talks to UIA **in-process** (no WinAppDriver.exe, no Appium daemon, no `127.0.0.1:4723` round-trip, no Developer Mode).

## What you can do

- **Find controls semantically** — by name, role, or automationId, not a fragile `(x, y)`. Exact scalars compile to a **server-side** UIA condition (the target app filters in-process); regex/substring filter client-side.
- **Act** — `invoke()`, `click()`, `setValue()`, `type()`, `toggle()`, `expand()`, `select()`, `setRangeValue()`, window `close()`/`setVisualState()`. Each pattern is proven against a real control.
- **`waitFor`** — Playwright-class auto-retry for flaky native UIs. No other Windows-desktop npm tool has it. Timeouts quote the selector, the window, and the nearest candidates.
- **Read & assert** — `value`, `text()`, `isEnabled`, `boundingRectangle`, `toggleState`. Read state back through the tree to assert — pixel tools can't.
- **Serialize the tree to JSON** for an LLM agent (`uia.tree`), with a token-svelte agent profile.
- **Screenshot** any window via PrintWindow (works even on a locked session).
- **MSAA fallback** (`uia.msaaTree`) for legacy / owner-draw windows.
- **Crash-safe input observation** via `GetAsyncKeyState` polling — no foreign-thread hook, no message-pump assert.
- **Drive in the dark** — `invoke()`/`setValue()`/`toggle()`/`scroll()` and `postClick(x, y)` move no real cursor and work on a window that is **minimized, in the background, occluded, or on a locked session** — no focus theft, the human-transcending default. SendInput is the opt-in "a human is watching" path.
- **See a window even when it's not visible** — `captureWindowLive(hWnd)` reads the LIVE pixels of any window via **Windows.Graphics.Capture** even occluded / background / GPU-composited (hardware-accel Chromium/Edge/Electron, games, WinUI) — the content `PrintWindow` returns blank for, the same surface Alt+Tab previews use, with no foregrounding.
- **Window & monitor management** — `moveWindow`/`minimizeWindow`/`maximizeWindow`/`restoreWindow`/`raiseWindow`/`closeWindow` (no foreground required), `listMonitors()`, and the exe path + min/max/foreground state of every window.
- **Native window introspection** — `windowTree(hWnd)` dumps the raw HWND hierarchy (class, control id, decoded `WS_*`/`WS_EX_*` styles) like Spy++/Winspector, reaching the classic-Win32 controls UIA can't see.
- **Pixel fallback for no-a11y surfaces** — `captureScreen()` (full desktop or region), `locateOnScreen(needle)` template matching, `pixelColor(x, y)` — the nut.js/robotjs niche, in-process, for games/canvas/browsers with no a11y tree.
- **Clipboard** — `readClipboard()`/`writeClipboard()`/`paste()` (the reliable large-text path, no per-keystroke corruption) and `copy()` (Ctrl+C + read the selection from any app).

## For AI agents

Frontier computer-use agents ground actions in **screenshots** and the literature calls it fragile and expensive. Microsoft **UFO2** (arXiv 2504.14603) fuses the **UI Automation tree first, vision second**, to fix *"fragile screenshot-based interaction"*; OmniParser exists because VLMs can't reliably locate clickable elements from a bitmap; and **OSWorld-Human** (arXiv 2506.16042) reports a11y-tree builds taking **3–26 seconds** and "thousands more tokens per step."

@bun-win32/uia is exactly that UIA-first substrate — served **fast and in-process**. `uia.tree(app, { agentProfile: true })` walks a window's subtree in **one cached round-trip** and emits ground-truth `{ role, name, automationId, bounds, children }` an agent acts on without pixel-counting. The measured build time below beats the OSWorld 3–26 s reference by **two-to-three orders of magnitude**. `uia.execute(app, actions)` runs a JSON action list; `AGENT_TOOLS` is a ready LLM tool schema.

## Drive Windows with Claude — MCP server + computer-use

A zero-dependency **MCP server** ships in the box. Register it with one line and Claude (Desktop, Code, or any MCP client) drives Windows through the accessibility tree:

```
claude mcp add uia -- bunx bun-uia
```

(Windows-hardened, for clients that spawn without a shell: `claude mcp add uia -- cmd /c bunx -y bun-uia`.) It exposes **48 snapshot-first tools** (protocol `2025-11-25`), gated by a deployer policy. `desktop_snapshot` returns a ref-keyed tree — `Button "Five" [ref=e49]` — then `click`/`invoke`/`type`/`set_value`/`toggle`/`select`/`scroll` target a ref (cursor-free, so they work on a minimized/background/occluded/locked window — `select` even multi-selects a set of items with no real mouse), and every action returns the **smallest faithful re-grounding** — a compact `Δ` delta when little changed (`~ Text "Display is 5" → "Display is 55"`, ~28× cheaper than a full dump), else a pruned, size-capped tree — so the model re-grounds without drowning in tokens. Beyond one window it can **see the whole desktop** (`screen_capture`), **see a specific occluded/GPU window** (`capture_window` — Windows.Graphics.Capture), turn a pixel into a control (`inspect_point`), read a control's full state (`inspect_element`), read a data grid / list / table cell-by-cell (`read_table`), find + select text by content (`find_text` — the desktop getByText), read native/MSAA trees, list monitors, manage windows, and — gated default-OFF — launch apps, run programs, and read/write files. A thrown tool error comes back as `isError` so the loop self-corrects instead of stopping.

**Deployer policy** decides which tools exist: `BUN_UIA_PROFILE=readonly` (observe only) · `safe` (**default** — observe + cursor-free desktop control + window management, no OS reach) · `full` (everything). Overrides: `BUN_UIA_OS=1` (enable launch/run/file), `BUN_UIA_ALLOW`/`BUN_UIA_DENY`, `BUN_UIA_CURSOR=never` (strictly cursor-free), `BUN_UIA_FS_ROOT=<path>` (sandbox file tools). `tools/list` advertises only the enabled tools.

`uia.dispatch(window, action)` runs the **literal Anthropic `computer` and OpenAI CUA action sets** against Windows — but **semantic-first and cursor-free**: a coordinate `left_click` resolves the element under the point and `invoke()`s it, so the real mouse never moves, it works on a locked session, and every pixel action becomes a ground-truth semantic one (erasing the coordinate-hallucination and click-miss failure modes of screenshot-only agents). `screenshotWithMarks(app, uia.snapshot(app))` overlays numbered **Set-of-Marks** boxes derived from UIA bounds — the grounding the literature (Set-of-Mark, UFO2, Windows Agent Arena: **+57% from UIA-derived marks**) shows lifts task success, with no vision model. Honest limit: UIA can't see owner-draw/canvas/games, so the pixel layer (`locateOnScreen`) is the fallback there.

## Benchmarks

Measured on Windows 11, Bun 1.4, by `bun run example/benchmark.ts` (run it to reproduce):

| operation | result |
| --- | --- |
| single property read (cross-process) | ~55 µs |
| naive subtree walk (65 nodes) | ~44 ms |
| **cached subtree walk** (one round-trip) | **~37 ms** (1.2× faster; the gap widens with tree size) |
| agent-grounding tree build | ~9 ms, ~2.7k tokens |
| **vs OSWorld a11y-tree build (3–26 s)** | **~345–2987× faster** |

## Requirements & honest scoping

- **Windows 10/11, Bun ≥ 1.1.** Windows-only and Bun-only — the owned trade-off (nut.js/robotjs/uiohook are genuinely cross-platform; this is not).
- **UIA-tree first, pixels where there's no tree.** Apps with no accessibility tree (games, canvas/WebGL, custom-draw) fall back to the built-in pixel layer — full-screen capture + `locateOnScreen` template matching + coordinate `click()` — plus MSAA. (Chromium/Edge/Electron in-page DOM is NOT a no-tree case — `webRoots()` reads it as UIA; the pixel layer is only for genuinely tree-less surfaces.) Those GPU/composited surfaces, even occluded or in the background, are still **seen** via `captureWindowLive` (Windows.Graphics.Capture) where `PrintWindow` goes blank. UIA-native where there's a tree, pixels where there isn't.
- **Synthetic input (`type`/`sendKeys`/`click`) needs an unlocked, interactive desktop.** UIA queries, `invoke`, `setValue`, and `screenshot` work on a locked session; prefer them.
- **Selectors are client-side for regex/substring** (exact scalars are server-side). **Window/process lifecycle events ship** (`waitForWindow` via `SetWinEventHook`; `waitForProcess` polls a toolhelp32 snapshot); UIA property/structure event subscription is still roadmap — poll with `waitFor` / `waitForIdle`.

Read [`AI.md`](./AI.md) — it is the complete surface; an agent should not need the source.

MIT.
