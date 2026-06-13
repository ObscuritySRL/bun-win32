# BUN_UIA — execution prompt

Paste the block below as a **`/goal`** in a fresh session set to **Opus 4.8, ultracode**. It drives the full build of `@bun-win32/uia` + `bun-uia` (Playwright-for-Windows-desktop over in-process UIA COM) by following [`packages/uia/PLAN.html`](./PLAN.html) end to end. The plan is the spec; this prompt sets the mode, doctrine, risk-ordering, and finish line.

---

```
PRECONDITION: run THIS session as Opus 4.8 + ultracode. Verify /model + /effort first — hard precondition. Wrong → stop, tell user to switch.

Execute packages/uia/PLAN.html end to end: build, test, doc, publish @bun-win32/uia@1.0.0 + unscoped bun-uia@1.0.0 to npm. Plan IS the spec — read fully before coding, then follow phase by phase (0→15, incl 0b+10b). Track each phase w/ TaskCreate/TaskUpdate; commit after each (multi-agent repo git-clean's uncommitted). Never leave repo broken.

PRIME DIRECTIVES (override convenience):
- VERIFY, DON'T TRUST. Plan + the agents that wrote it = map, not territory (they erred — e.g. an ElementFromHandle slot miscount). Treat every slot, GUID, ID, download number as a claim: regenerate slots from UIAutomationClient.h AND prove on a live element (wrong slot segfaults); exports from dumpbin; nullability from SAL. Plan wrong → source wins; fix + log to deviation ledger.
- RESEARCH RELENTLESSLY, BEST AGENTS. Where plan says research (esp. Phase 0b) or a fact is load-bearing, fan out sub-agents (prefer Workflow). On EVERY spawn set model:'opus' (not inheritance); instruct each to run max ultracode rigor — exhaustive, adversarial, primary-source, trust no one. A non-Opus/non-ultracode sub-agent is a bug.
- OBEY AGENTS.md: no casts (only Number(ptr) as Pointer), alphabetize, no abbreviations, #private, hex w/ separators, Bun-native, conventional commits, tests never in test/. Run audit.ts + nullcheck.ts on any binding touched.
- PERF IS A GATE. Hot path = the cross-process COM round-trip; CacheRequest/BuildCache is the spine (one round-trip/subtree vs 2N naive). Hot paths (vcall, cached walk, BSTR) get a microbench (Bun.nanoseconds, 200k warmup, bun:jsc numberOfDFGCompiles>0 — Bun=JSC not V8); bulk-copy BSTR not per-char; no per-element alloc / cached .ptr / bigint in loops. S14.6 gate (>10% vs baseline OR a forbidden pattern) blocks release; cached walk must beat OSWorld's 3–26s reference.
- VERIFY VISUALLY. You drive real apps — "selftest passed" is meaningless unless Calculator reads 8 and Notepad round-trips. Look at the screen / PrintWindow PNG.

HIGHEST-RISK (nail first, prove by running):
1. vtable slots — regenerate from the header, prove EVERY slot on a live element. The one binding item (Ph 2): add CLSIDFromString/CoCreateInstance/CoInitializeEx/CoUninitialize to @bun-win32/combase (combase truly exports these; ole32 only forwards).
2. by-value VARIANT dead-end → confirm CreatePropertyCondition segfaults once (S0.5), then use CreateTrueCondition + FindAll + the typed TS selector.
3. vcall argTypes EXCLUDE 'this' (spurious leading u64 segfaults multi-ptr calls); never FindAll(Descendants) from the desktop root — scope to a window.
4. SendInput INPUT packing is greenfield — cbSize=40 (x64) or it silently injects nothing (Ph 6).
5. Only InvokePattern is proven — prove every other pattern on a real control before shipping; cut unproven ones to the roadmap. UIA events (foreign-thread JSCallback+MTA) out of scope — ship polling/waitFor.

OPERATIONAL:
- Keep the machine awake/unlocked the whole run (visual checks need a live desktop); run may be unattended.
- Release = one OTP: dry-run all first, then request ONE npm OTP, publish in dep order: @bun-win32/combase → [uiautomationcore if bumped] → @bun-win32/uia → @bun-win32/all → bun-win32 → bun-uia. 402 after OTP burns the code.

FINISHED when: @bun-win32/uia@1.0.0 + bun-uia@1.0.0 live + installable; Phase 15.7 clean-room passes (fresh temp dir outside repo: bun add bun-uia, attach Notepad, waitFor its Edit, type via the real keyboard, read back via the UIA tree, assert byte-exact round-trip, visually confirm); @bun-win32/combase (minor), @bun-win32/all (minor), bun-win32 (patch) published; all gates green (tsc 0, audit/nullcheck baseline+combase, parity Appendix D every row proven-or-roadmap, perf gate); final report w/ parity row→proof map, deviation ledger, roadmap. All spawns = Opus 4.8 ultracode.
```

---

## What it needs from you
- **One npm OTP** at Phase 15.5 (the only required human step; have the publish loop ready before sending it — TOTP rotates in ~30s).
- **An unlocked, awake machine** for the full run — every milestone is visually verified (Calculator → 8, Notepad round-trip), and a locked desktop makes PrintWindow capture come back black.

## Notes
- The canonical plan is `packages/uia/PLAN.html`. This `/goal` references it directly — there is no root duplicate or stop-token typo for this target.
- To gate the npm publish yourself, change the finish line to *"…stop after the Phase 15.3 pre-publish rehearsal is green; do not request an OTP."*
