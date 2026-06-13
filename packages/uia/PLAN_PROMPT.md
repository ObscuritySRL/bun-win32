# BUN_UIA — execution prompt

Paste the block below as a **`/goal`** in a fresh session set to **Opus 4.8, ultracode**. It drives the full build of `@bun-win32/uia` + `bun-uia` by following [`packages/uia/PLAN.html`](./PLAN.html) end to end. The plan is the spec; this prompt sets the mode, doctrine, risk-ordering, and finish line.

---

```
PRECONDITION — best agents only: run THIS session as Opus 4.8 with ultracode effort (the most capable model + maximum orchestration). Verify with /model (Opus 4.8) and /effort (ultracode) before you start — this is a hard precondition, not a preference. If either is wrong, stop and tell the user to switch before proceeding.

Execute the implementation plan at packages/uia/PLAN.html end to end: build, test, document, and publish @bun-win32/uia@1.0.0 and the unscoped bun-uia@1.0.0 to npm. The plan IS the spec — read it top to bottom before writing a line, then follow it phase by phase (Phase 0 → 15, including 10b). Track every phase with TaskCreate/TaskUpdate; commit after each phase (this is a multi-agent repo — uncommitted work gets git clean'd). Never leave the repo in a broken state.

PRIME DIRECTIVES (the plan's doctrine — these override convenience):
- VERIFY, DON'T TRUST. The plan, the prior research, and its author are a map, not the territory. Re-verify every load-bearing fact against its primary source before relying on it: vtable slots from UIAutomationClient.h AND by running on a live element (a wrong slot segfaults — the plan documents a real slot miscount that was caught); exports from dumpbin; signatures/nullability from the SDK header + SAL; download/status claims from api.npmjs.org + the live repos. If the plan is wrong, the source wins — fix your approach and record the deviation in .scratch/bun-uia-ledger.md.
- RESEARCH RELENTLESSLY, WITH THE BEST AGENTS. Wherever the plan says "research" or a fact is load-bearing, fan out your own sub-agents (prefer the Workflow tool for parallel research/verification) to verify it independently. ENFORCE THE MODEL EXPLICITLY: on every Agent/Workflow spawn, set model: 'opus' (do NOT rely on default inheritance) and instruct each sub-agent in its prompt to operate at maximum xhigh/ultracode rigor — exhaustive, adversarial, primary-source verification, and to not trust the plan author or each other. A sub-agent that isn't Opus 4.8 operating at ultracode rigor is a bug — fix the spawn.
- OBEY AGENTS.md exactly: no type casts (only `Number(ptr) as Pointer`), alphabetize, no abbreviations, #private fields, hex literals with separators, Bun-native APIs, conventional commits, tests never in a test/ dir. Run audit.ts + nullcheck.ts on any binding you edit.
- PERFORMANCE IS A GATE, not a footnote. Every hot-path phase ends with a microbenchmark (Bun.nanoseconds, 200k warm-up, bun:jsc verification — Bun is JavaScriptCore, not V8). The UIA hot path is the cross-process round-trip → CacheRequest batching is the spine. The S14.6 perf-regression check is release-blocking.
- VERIFY VISUALLY. You drive real apps. "Selftest passed" is meaningless unless Calculator's display reads 8 and Notepad's text round-trips — look at the screen / the PrintWindow PNG.

HIGHEST-RISK SURFACES (nail these first, prove by running):
1. The one binding-work item: add CoCreateInstance/CoInitializeEx/CLSIDFromString/CoUninitialize to @bun-win32/combase (real combase exports; ole32 only forwards them) — Phase 2.
2. The vtable slot table — regenerate from the header, prove every slot on a live element (Phase 0/3/7).
3. The by-value VARIANT dead-end → CreateTrueCondition + FindAll + the typed TS selector (confirm the segfault once, S0.5).
4. SendInput INPUT packing is greenfield (40-byte x64, cbSize=40 or it silently no-ops) — Phase 6.
5. Only InvokePattern is proven today — prove every other pattern against a real control before shipping it; cut unproven ones to the roadmap.

OPERATIONAL:
- Keep the machine awake for the whole run (the plan's S0.2b SetThreadExecutionState background process); the run may be unattended.
- Release is one OTP: pre-verify everything (dry-run all packages), then request a single npm OTP and publish in dependency order (combase, [uiautomationcore if bumped], uia, all, bun-win32, bun-uia). A 402 after OTP burns the code.

You are FINISHED when: @bun-win32/uia@1.0.0 and bun-uia@1.0.0 are live on npm and installable; the Phase 15 clean-room acceptance test passes (a fresh `bun add bun-uia` in a temp dir finds Notepad by title, types into it, reads the text back through the UIA tree, and asserts); @bun-win32/combase (minor), @bun-win32/all (minor), and bun-win32 (patch) are published; and you've delivered a final report with the parity row→proof mapping and the full deviation ledger. All agents you spawn must be Opus 4.8 ultracode.
```

---

## What it needs from you
- **One npm OTP** at Phase 15 (the only required human step; have the publish loop ready before sending it).
- **An unlocked session** if any visual check (PrintWindow capture) comes back black.

## Notes
- The canonical plan is `packages/uia/PLAN.html`. (`BUN_SYSMON.html` at the repo root is a byte-identical copy that exists only to satisfy this session's `/goal` stop-token typo — same plan, ignore the name.)
- To gate the npm publish yourself, change the finish line to *"…stop after the Phase 15 pre-publish rehearsal (S15.3) is green; do not request an OTP."*
