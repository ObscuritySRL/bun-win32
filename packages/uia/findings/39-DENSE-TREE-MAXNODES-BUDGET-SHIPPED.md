# 39 — Dense (flat) UIA tree maxNodes budget — SHIPPED

## The hazard

A window with thousands of NON-VIRTUALIZED sibling controls (a real LOB grid / toolbar / icon-wall, a big
WPF/WinForms panel, a long native `<select>`, a wide Qt tree) walled the agent for seconds with no escape hatch:

- `snapshot(win, {})` over a WinForms form of 3000 sibling Buttons = ~3000 marks in **~5-7 s**.
- `snapshot(win, { maxDepth: 3 })` was a **no-op** — the buttons are all siblings at depth 2, so the depth cap
  cut nothing (~5-6 s, still 3000 marks). The MCP server description even claimed "maxDepth bounds the tree size
  when a window is large" — FALSE for a flat tree.

Cost isolation (measured): the wall was the single `BuildUpdatedCache(TreeScope_Subtree, Full)` marshaling every
sibling cross-process — NOT the in-process cached walk (~6 ms) and NOT property fetch (an enumerate-only
`TreeScope_Children + AutomationElementMode.None` over the 3000-sibling panel was still ~5.9 s). The cost is
cross-process SIBLING navigation, which `maxDepth` cannot bound. `jab.ts` already capped this exact hazard with
`budget = { remaining: maxNodes ?? 2000 }`; the UIA `refmap.ts` walk had only `maxDepth`. perf-gate timed only
Calculator (~45-60 ms), so it never caught it.

## The fix (shipped)

1. **`refmap.ts`** — threaded a `Budget = { remaining, truncated }` through `walk()` / `walkLive()` and
   `snapshot(window, { maxNodes? })`, mirroring jab.ts. When the budget hits 0 with a parent's children still
   unwalked, set `RefNode.truncated` and stop. `renderSnapshot` surfaces it as
   `(… N+ children shown — more omitted; raise maxNodes …)`, and `pruneRefTree` preserves the marker.

2. **The cache scope is the real lever.** The single `BuildUpdatedCache(TreeScope_Subtree)` is replaced with a
   per-PARENT, budget-aware enumeration: the snapshot CacheRequest is now `TreeScope_Element` (just the node), and
   `walk()` navigates children via the **cached control-view walker's** BuildCache child/sibling methods
   (`Element.firstChildCached` / `nextSiblingCached`), stopping after `maxNodes` navigations. A dense parent costs
   O(maxNodes) navigations, not O(N). Each navigated node still arrives WITH its Full property cache in one
   round-trip, so `cachedControlType` / `cachedName` / `cachedState` (the `(on)`/`(value=…)` suffixes) all still ride
   the cache — verified live on a small WinForms form.

3. **`constants.ts`** — added the TreeWalker BuildCache slots, HEADER-VERIFIED against
   `UIAutomationClient.h` `IUIAutomationTreeWalkerVtbl` (GetParentElement 3, GetFirstChildElement 4,
   GetLastChildElement 5, GetNextSiblingElement 6, GetPreviousSiblingElement 7, NormalizeElement 8, then the
   *BuildCache variants 9-13): **`GetFirstChildElementBuildCache = 10`, `GetNextSiblingElementBuildCache = 12`**.
   A wrong slot would SEGFAULT — proven not to by the live dense-tree run.

4. **`mcp.ts`** — `desktop_snapshot` now defaults `maxNodes = 1500` (`SNAPSHOT_MAX_NODES`, jab-2000-class) through
   `buildWindowSnapshot` / `rebuildSnapshot` / `snapshotText`, and the tool schema gained a `{maxNodes}` arg. The
   false SERVER description was corrected: maxNodes (not maxDepth) bounds a flat/wide tree.

## Live proof

- `example/dense-tree-budget.integration.test.ts` (NEW): spawns a 2000-Button WinForms form, asserts
  `snapshot({ maxNodes: 400 })` = 400 marks in **~770 ms** with `truncated=true` + render trailer, and the unbounded
  walk recovers all 2004 marks. The window is `closeWindow()` + taskkill'd in finally. PASS.
- Default 1500-node budget on the 3000-Button form: 1500 marks in ~3.6 s, truncated.

## Tradeoff (accepted)

The UNBOUNDED walk got slower on a dense window (per-parent BuildCache navigation does more round-trips than the
one-shot Subtree marshal: ~8 s vs ~5 s for 3000 buttons). The agent path never pays this — it defaults to
maxNodes=1500 and an agent can lower it for sub-second. Small windows are unaffected (Calculator-class trees walk
in tens of ms; a 4-control form ~23 ms). The Opera live-walk fallback is preserved (root cache-fail detection
unchanged, now on the cheaper Element-scope cache).
