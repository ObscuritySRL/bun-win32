# AI Guide for @bun-win32/uia

Everything below is reachable from `@bun-win32/uia` (or its unscoped alias `bun-uia`) alone. **Bun + Windows only.** This file is the complete surface — an agent should not need to read the source. When it must, the "Where to look" section says exactly which one file to open.

## What it is

Playwright for Windows desktop apps. Query the live UI Automation (accessibility) tree by name / control-type / automationId, invoke controls, type, read values, wait for elements to appear, and serialize a window's tree to JSON for an LLM agent. Three engines behind one facade:

1. **IUIAutomation COM client** (the spine) — driven through a cast-free vtable invoker. Query + invoke + patterns + cache.
2. **Flat `uiautomationcore` C-API** — a VARIANT-free fast path (secondary; the COM path is the default).
3. **`oleacc` MSAA fallback** — for legacy / owner-draw windows that expose no useful UIA tree.

Escalation rule: stay on the `uia` facade. Drop to a lower engine (`msaaTree`, the raw `vcall`) only when you need something the facade lacks.

## Mental model (read this first)

- **UIA is cross-process.** Every property read and `find` marshals into the target app. `initialize()` once (it sets up a single-threaded COM apartment + makes the process DPI-aware); `uninitialize()` at the end, or `using app = uia.attach(...)`.
- **Selectors are hybrid.** Exact scalars (`controlType`, `name` string, `automationId`, `className`) compile to a **server-side** UIA condition — the target app filters in-process and only matches come back. Rich predicates (`name` RegExp, `nameContains`) are matched **client-side** on the (already-narrowed) results. Always scope a search to a window (`attach`), **never** `findAll` from the desktop root.
- **CacheRequest batches.** Naive walks pay N cross-process round-trips; `findAllCached` / `tree()` prefetch a whole subtree in one. The cache wins more the larger the tree.
- **Only the listed patterns are proven.** `invoke`, `value`/`setValue`, `text`, `toggle`, `expand`/`collapse`, `select`, `rangeValue`/`setRangeValue`, window `close`/`setVisualState` are each proven against a real control. `scrollIntoView` is implemented but unproven (see roadmap).
- **Synthetic input needs an unlocked, interactive desktop.** `type`, `sendKeys`, `click` go through `SendInput` — they are silently dropped on a locked session. UIA queries, `invoke`, `setValue`, and `screenshot` all work locked. Prefer `setValue` / `invoke` over `type` / `click` when a pattern exists.
- **Element pointers have apartment affinity.** Keep them on the creating thread; tolerate `UIA_E_ELEMENTNOTAVAILABLE (0x80040201)` if a window closes mid-walk. UIA **events** are out of scope in v1 — poll with `waitFor`.

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
| toggle / expand / select / slider | `el.toggle()` · `el.expand()`/`el.collapse()` · `el.select()` · `el.setRangeValue(n)` |
| read state | `el.name` `el.controlType` `el.controlTypeName` `el.automationId` `el.className` `el.isEnabled` `el.boundingRectangle` |
| serialize the tree for an LLM | `uia.tree(app, { agentProfile: true })` |
| run a JSON action list (agent) | `uia.execute(app, [{ find: {...}, do: 'invoke' }, …])` |
| screenshot | `app.screenshot()` → PNG bytes |
| list / target windows | `uia.windows()` · `findWindow({ title })` · `windowForProcess(pid)` |
| fall back to MSAA | `uia.msaaTree(hWnd)` |

## Full API

### `uia` — the facade object
`attach(target)`, `launch(command, target, timeout?)`, `focused()`, `fromPoint(x, y)`, `root()`, `windows()`, `tree(element, options?)`, `execute(element, actions)`, `msaaTree(hWnd, maxDepth?)`, `click(x, y)`, `sendKeys(combo)`, `type(text)`, `initialize()`, `uninitialize()`.

### `class Element`
- Live properties (getters): `name`, `controlType`, `controlTypeName`, `automationId`, `className`, `isEnabled`, `boundingRectangle: Rect`, `nativeWindowHandle: bigint`, `value`, `toggleState`, `expandCollapseState`, `isSelected`, `rangeValue`.
- Tree: `find(selector, scope?)`, `findAll(selector, scope?)`, `findAllCached(selector, request, scope?)`, `children`, `parent`, `await waitFor(selector, { timeout?, interval? })`, `describeNoMatch(selector)`, `buildUpdatedCache(request)`, `cachedChildren`, `cached{Name,ControlType,AutomationId,ClassName,BoundingRectangle,IsEnabled}`.
- Patterns (throw if unsupported): `invoke()`, `setValue(text)`, `text()`, `toggle()`, `expand()`, `collapse()`, `select()`, `scrollIntoView()`, `setRangeValue(n)`, `close()`, `setVisualState(WindowVisualState)`.
- Input (need an unlocked session): `focus()`, `type(text)`, `click()`.
- Lifecycle: `release()`, `ptr: bigint`.

### `class Window extends Element`
Adds `hWnd: bigint`, `activate()`, `screenshot(): Uint8Array`, `dispose()` / `[Symbol.dispose]`.

### Selector & matching
`interface Selector { controlType?, name? (string | RegExp), nameContains?, automationId?, className? }`. `interface ElementProperties { name, controlType, automationId, className }` (what `matches` reads). `matches(props, selector)`, `selectorToString(selector)`, `formatNoMatch(selector, windowName, candidateNames)`.

### Root accessors (return a live `Element`/`Window`)
`fromHandle(hWnd)` (an `Element` for a window handle — `attach` wraps this in a `Window`), `focused()`, `fromPoint(x, y)`, `root()`.

### Constants / enums
`ControlType` (Button=50000 … AppBar=50040), `PatternId` (10000–10033), `PropertyId` (30000–30024), `TreeScope`, `PropertyConditionFlags`, `ToggleState`, `ExpandCollapseState`, `WindowVisualState`, `SLOT` (verified vtable slots).

### Cache
`createCacheRequest(properties?, scope?, mode?)`, `class CacheRequest { property, pattern, treeScope, elementMode, release }`, `DEFAULT_CACHE_PROPERTIES`, `AutomationElementMode`.

### Tree / agent
`serialize(element, options?: SerializeOptions): UiaNode`, `interface SerializeOptions { maxDepth?, agentProfile? }`, `interface UiaNode { role, name, automationId?, className?, bounds?, enabled?, children }`, `countNodes`, `estimateTokens`, `execute(element, actions): AgentActionResult[]`, `AGENT_TOOLS`, `groundingTree(element)`, `type AgentAction`.

### Windows / input / msaa / low-level
`findWindow`, `listWindows`, `windowForProcess`, `screenshot`, `type WindowInfo`; `sendKeys`, `clickAt`, `virtualKeyCode`, `INPUT_SIZE`, `packKeyboardInput`, `packMouseInput`; `msaaTree`, `accessibleFromWindow`, `type MsaaNode`; `vcall`, `comRelease`, `guid`, `hresult`, `getBstr`, `getLong`, `getRect`, `getHandle`, `decodeBstr`, `encodePNG`, `initialize`, `uninitialize`, `automation`, `type Rect`.

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

## Gotchas (the traps ledger)

- **Selectors are client-scoped, never from the desktop root.** `attach` a window first; `find` defaults to `TreeScope_Descendants` of that window.
- **`ElementFromHandle` is vtable slot 6** (slot 7 is `ElementFromPoint`). The package has the verified slot table; if you hand-roll `vcall`, regenerate slots from `UIAutomationClient.h` and prove each — a wrong slot segfaults.
- **Server-side property conditions work** (the 16-byte VARIANT goes by hidden pointer in the x64 ABI). `nameContains` / RegExp still filter client-side.
- **`type` / `sendKeys` / `click` are dropped on a locked session.** Prefer `setValue` / `invoke`; they work locked. `screenshot` (PrintWindow) also works locked.
- **Process is DPI-aware** after `initialize()` so click coordinates match UIA bounds; `click()` uses `SetCursorPos` + physical pixels.
- **`SendInput` cbSize must be 40** (handled internally) — the x64 `INPUT` is 40 bytes.
- **BSTR names are bulk-copied before free**; never read after `SysFreeString`.
- **Only proven patterns ship.** Calling a pattern an element doesn't support throws a clear message (pointing at `.click()` / `.type()` where relevant). `scrollIntoView` is unproven (roadmap).
- **Non-English / different builds** differ: Calculator's result element is `automationId: 'CalculatorResults'`, buttons are named `Five`/`Plus`/… (full words). Configure selectors per app.
- **Threading:** v1 is STA, fire-and-forget out-of-process driving. Events / self-UI automation need MTA — out of scope.

## Where to look (source)

`automation.ts` activation + the singleton · `com.ts` `vcall`/`guid` · `constants.ts` ids + verified slots · `element.ts` `Element`/`Window`/`attach`/`launch`/`waitFor` · `condition.ts` the typed selector · `patterns.ts` control patterns · `input.ts` `SendInput` · `cache.ts` CacheRequest · `tree.ts` agent grounding · `window.ts` targeting + screenshots · `msaa.ts` oleacc fallback · `agent.ts` the LLM tool adapter · `reads.ts` property readers.
