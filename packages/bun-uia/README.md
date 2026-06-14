# bun-uia

**Playwright for Windows desktop apps.** Query the live UI Automation accessibility tree by name and role, invoke controls, type, wait for elements, and serialize a window to JSON for an LLM agent — from Bun, with **zero native dependencies**. No node-gyp, no prebuild matrix, no Appium server, no .NET.

```ts
import { ControlType, uia } from 'bun-uia';

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

`bun add bun-uia` is the entire install story.

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

**There is no zero-install, typed, in-process `IUIAutomation` client for Node or Bun.** bun-uia is a few kilobytes of TypeScript over `bun:ffi` — the runtime's own FFI, not a third-party N-API addon that rots against each Node minor (*"PLEASE ARCHIVE THIS REPO"* — node-ffi-napi #269). It **can't be paywalled** (no compiled binary to gate behind a subscription registry), has **no build step** (no node-gyp, no ABI matrix, no MSVC/Python), and talks to UIA **in-process** (no WinAppDriver.exe, no Appium daemon, no `127.0.0.1:4723` round-trip, no Developer Mode).

## What you can do

- **Find controls semantically** — by name, role, or automationId, not a fragile `(x, y)`. Exact scalars compile to a **server-side** UIA condition (the target app filters in-process); regex/substring filter client-side.
- **Act** — `invoke()`, `click()`, `setValue()`, `type()`, `toggle()`, `expand()`, `select()`, `setRangeValue()`, window `close()`/`setVisualState()`. Each pattern is proven against a real control.
- **`waitFor`** — Playwright-class auto-retry for flaky native UIs. No other Windows-desktop npm tool has it. Timeouts quote the selector, the window, and the nearest candidates.
- **Read & assert** — `value`, `text()`, `isEnabled`, `boundingRectangle`, `toggleState`. Read state back through the tree to assert — pixel tools can't.
- **Serialize the tree to JSON** for an LLM agent (`uia.tree`), with a token-svelte agent profile.
- **Drive in the dark** — `invoke`/`setValue`/`toggle`/`scroll` + `postClick` need no cursor and no focus; they drive a **minimized, background, occluded, or locked** window. The AI default, not a fallback.
- **See a window even when it isn't visible** — `captureWindowLive(hWnd)` reads the live pixels of any window via **Windows.Graphics.Capture**, even occluded / background / GPU-composited, where `PrintWindow` goes blank.
- **Window & monitor control** — move/min/max/restore/raise/close windows (no foreground), `listMonitors()`, per-window exe + state.
- **Pixel + clipboard layer** — `captureScreen`/`locateOnScreen`/`pixelColor` for no-a11y surfaces; `readClipboard`/`writeClipboard`/`paste`/`copy`.
- **Screenshot** any window via PrintWindow (works even on a locked session; auto-falls-back to WGC when blank).
- **MSAA fallback** (`uia.msaaTree`) and **native HWND introspection** (`uia.windowTree`, Spy++-style) for legacy / owner-draw windows.
- **MCP server for Claude** — `claude mcp add uia -- bunx bun-uia` exposes the whole surface as 36 policy-gated tools; the agent drives Windows cursor-free, sees the desktop, and (when enabled) launches apps and reads/writes files.

## For AI agents

Frontier computer-use agents ground actions in **screenshots** and the literature calls it fragile and expensive. Microsoft **UFO2** (arXiv 2504.14603) fuses the **UI Automation tree first, vision second**, to fix *"fragile screenshot-based interaction"*; OmniParser exists because VLMs can't reliably locate clickable elements from a bitmap; and **OSWorld-Human** (arXiv 2506.16042) reports a11y-tree builds taking **3–26 seconds** and "thousands more tokens per step."

bun-uia is exactly that UIA-first substrate — served **fast and in-process**. `uia.tree(app, { agentProfile: true })` walks a window's subtree in **one cached round-trip** and emits ground-truth `{ role, name, automationId, bounds, children }` an agent acts on without pixel-counting. The measured build time below beats the OSWorld 3–26 s reference by **two-to-three orders of magnitude**. `uia.execute(app, actions)` runs a JSON action list; `AGENT_TOOLS` is a ready LLM tool schema. Honest limit: UIA can't see owner-draw/canvas/games, so this **complements** a vision agent rather than replacing screenshots.

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
- **UIA-tree based.** Apps with no accessibility tree (games, canvas/WebGL, custom-draw) get MSAA + screenshots + coordinate `click()`, not vision matching — a complement to screenshot tools, not a replacement.
- **Synthetic input (`type`/`sendKeys`/`click`) needs an unlocked, interactive desktop.** UIA queries, `invoke`, `setValue`, and `screenshot` work on a locked session; prefer them.
- **Selectors are client-side for regex/substring** (exact scalars are server-side). **UIA events are roadmap** — poll with `waitFor`. `scrollIntoView` is implemented but not yet proven against a real list.

Read [`AI.md`](https://github.com/ObscuritySRL/bun-win32/blob/main/packages/uia/AI.md) — it is the complete surface; an agent should not need the source.

MIT.
