# Optimisation FINDINGS — `@bun-win32/terminal`

The §8 performance log. Every round states a hypothesis, the change, the measured
result, and the verdict (KEEP / REVERT). Bytes are sacred: every round is gated by
`frame.golden.test.ts` (a frozen FNV-1a hash of the wire stream across the full
mode × diff × depth × content matrix). Speed may move; emitted bytes may not.

## Method

- **Gate:** `bun run packages/terminal/frame.golden.test.ts` must stay green
  (hash `4a6e2109`). A round that changes the hash is wrong by construction and is
  reverted before it is even judged on speed.
- **Measure:** `.scratch/optbench.ts` — best-of-7, N=600, 200×60, JIT pre-warmed.
  Best-of-N because noise only ever *slows* a run, so the fastest observed time is
  the truest signal. Numbers are frame-production fps (build the diffed byte stream;
  no terminal I/O).
- **Regimes:** churn-bound (`VIDEO`, every cell re-emits — bound by the output
  buffer) and skip-bound (`STATIC`, the diff skips — bound by per-cell scanning).

## Baseline (pre-optimisation, commit before Round 1)

| scenario | fps |
| --- | ---: |
| half / truecolor / exact — VIDEO | 1975 |
| half / truecolor / exact — STATIC | 40250 |
| half / 16 / exact — VIDEO | 14890 |
| half / truecolor / threshold — VIDEO | 4965 |
| sextant / truecolor / exact — VIDEO | 1185 |
| sextant / 16 / exact — VIDEO | 2685 |
| quad / truecolor / exact — VIDEO | 1394 |

---

## Round 1 — single-reservation `setTruecolor` · KEEP

**Hypothesis.** On the churn path the per-cell escape fanned out into ~12
`putBytes`/`putDecimal`/`putByte` calls, each re-checking capacity and re-reading
`#position`. Collapsing to one `#ensureCapacity` for the worst-case escape (36 B)
plus direct writes through a local cursor should cut that overhead.

**Change.** `output.ts` — rewrote `setTruecolor` to reserve once, then inline-copy
the named byte-constants and the decimal LUT through a local `position`. Output
bytes unchanged.

**Result.**

| scenario | before | after | Δ |
| --- | ---: | ---: | ---: |
| half / tc / exact — VIDEO | 1975 | 2426 | **+23%** |
| half / tc / threshold — VIDEO | 4965 | 5523 | +11% |
| sextant / tc / exact — VIDEO | 1185 | 1335 | +13% |
| quad / tc / exact — VIDEO | 1394 | 1625 | +17% |

STATIC and palette paths flat (they don't call `setTruecolor`). Golden green.

## Round 2 — single-reservation `setPaletteColor` · KEEP (neutral)

**Hypothesis.** The same treatment should help the `256`/`16` churn paths.

**Change.** `output.ts` — same rewrite for `setPaletteColor`.

**Result.** Flat (15356 / 2616). Palette churn is bound by per-cell *analysis*
(quantisation + luma split), and the run-length pen already suppresses most escapes
when neighbouring cells share a quantised colour — so escape-emission was never the
bottleneck here. Byte-identical and removes the same call overhead, so kept for
consistency; no measurable win claimed.

## Round 3 — fused per-cell colour+glyph primitive · KEEP

**Hypothesis.** Each emitted cell still paid *two* capacity checks: one in the
colour call, one in `putBytes(glyph)`. Fusing colour-escape and glyph into a single
reservation removes a check and a call frame per cell.

**Change.** `output.ts` — extracted `#writeTruecolorEscape` / `#writePaletteEscape`
(shared with the setters, so no duplication) and added `emitCellTruecolor` /
`emitCellPalette`, which reserve `escape+glyph` once and write both. `pixel.ts` —
routed all four emit paths (half-fast, half-general, multi, ascii) through them and
deleted the now-dead `#emitColor`. Output bytes unchanged; two public methods added
(covered in `output.test.ts`).

**Result.**

| scenario | R1/R2 | after | Δ vs baseline |
| --- | ---: | ---: | ---: |
| half / tc / exact — VIDEO | 2426 | 2653 | **+34%** |
| quad / tc / exact — VIDEO | 1625 | 1740 | **+25%** |
| sextant / tc / exact — VIDEO | 1335 | 1426 | **+20%** |
| half / tc / threshold — VIDEO | 5523 | 5534 | +11% |
| half / 16 / exact — VIDEO | 15356 | 15474 | +4% |
| sextant / 16 / exact — VIDEO | 2616 | 2760 | +3% |

STATIC flat (skip path emits nothing). Golden green; full suite green.

## Round 4 — unroll the two-wide multi-mode gather · KEEP

**Hypothesis.** `#emitMulti`'s sub-pixel gather ran a variable-bound inner column
loop. But every mode that reaches it is exactly 2 pixels wide (quad 2×2, sextant
2×3, braille 2×4) — only the height varies. Hardcoding width 2 and unrolling the
inner pair removes the loop, its bounds check, and the `subRow*pixelWidth+subColumn`
index multiply.

**Change.** `pixel.ts` — `#emitMulti` gather rewritten as an explicit left/right
pair per row (`subIndex = subRow << 1`).

**Result.**

| scenario | before | after | Δ |
| --- | ---: | ---: | ---: |
| quad / tc / exact — VIDEO | 1740 | 1804 | +4% |
| sextant / tc / exact — VIDEO | 1426 | 1517 | +6% |
| sextant / 16 / exact — VIDEO | 2760 | 3022 | **+9%** |

Half paths untouched (different emit). Golden green; modes-decode test green.

## Round 5 — accumulate totals in the gather, drop the solid re-pass · KEEP

**Hypothesis.** In coherent content many cells fall under `SOLID_LUMA_SPAN` and take
the solid branch, which then re-loops the sub-pixels just to sum them. The gather
already visits each sub-pixel, so accumulating running totals there lets the solid
branch divide with no second pass (identical average → byte-identical).

**Change.** `pixel.ts` — `#emitMulti` gather keeps `totalRed/Green/Blue`; the solid
branch uses them directly and its summation loop is deleted.

**Result.**

| scenario | before | after | Δ vs baseline |
| --- | ---: | ---: | ---: |
| quad / tc / exact — VIDEO | 1804 | 1897 | **+36%** |
| sextant / tc / exact — VIDEO | 1517 | 1565 | **+32%** |
| sextant / 16 / exact — VIDEO | 3022 | 3189 | **+19%** |

Golden green; full suite green.

## Round 6 — strength-reduce the half-fast index arithmetic · REVERT (negative)

**Hypothesis.** `#emitHalfFast` recomputes `column*3` (×2) and `cellRowBase+column`
per cell; replacing them with `+= 3` / `++` accumulators should shave the multiplies.

**Change.** Carried `topIndex`/`bottomIndex`/`cellIndex` as accumulators, with the
skip rewritten as `if (!skip)` so the increments stay unconditional.

**Result — REGRESSION.** STATIC (skip-bound) fell 40275 → **37696** (−6%); VIDEO
flat. The accumulators create a loop-carried dependency chain (`index_n =
index_{n-1}+3`) that *serialises* the scan, whereas `column*3` has no cross-iteration
dependency, so the CPU computes the offsets with full instruction-level parallelism.
The JIT already lowers constant-multiply efficiently. Reverted. **Lesson: on a
memory-scan loop, independence beats fewer instructions.**

## Round 7 — fuse the CharTerm bold-colour + glyph emit · KEEP

**Hypothesis.** `CharTerm.buildFrame` never got the Round 1/3 treatment: it still
called `setBoldTruecolor` (the old multi-call fan-out) and a separate
`putCodePoint` per cell. Applying single-reservation + glyph fusion should pay off
as much here as it did for `Term`.

**Change.** `output.ts` — rewrote `setBoldTruecolor` to one reservation via a new
shared `#writeBoldTruecolorEscape`, and added `emitCellBoldTruecolor`, which writes
the bold/colour escape and the glyph's UTF-8 under one reservation. `char.ts` —
`buildFrame` now calls the fused primitive. Output bytes unchanged (new CharTerm
golden `6406c50a`, captured from the pre-round engine and still green after).

**Result.**

| scenario | before | after | Δ |
| --- | ---: | ---: | ---: |
| char / bold — VIDEO | 1649 | 2489 | **+51%** |

Term paths untouched. Golden green (both hashes); full suite green.

## Round 8 — derive the dark group from the running totals · KEEP (neutral, simpler)

**Hypothesis.** `#emitMulti`'s split loop accumulates both the bright and dark
groups. Since Round 5 keeps `total*`, the dark group is just `total − bright`, so
only the bright group need be accumulated.

**Change.** `pixel.ts` — split loop accumulates bright only; `dark* = total* −
bright*`, `darkCount = subpixelCount − brightCount`. The solid-span guard proves
both counts are ≥ 1, so neither divisor is zero.

**Result.** Flat (within noise) — the dark adds weren't the bottleneck. Kept anyway:
byte-identical, four fewer locals, one branch arm gone. No speed win claimed.

## Round 9 — typed bit-layout tables · KEEP (small)

**Hypothesis.** `#emitMulti` indexes `bitLayout[subIndex]` per lit sub-pixel, but the
layout tables were boxed `number[]`. A `Uint8Array` is a faster, unboxed read.

**Change.** `glyphs.ts` — `quadrant/sextant/brailleBitLayout` become `Uint8Array`;
`pixel.ts` `#bitLayout` typed to match.

**Result.** sextant/16 ~+2-3%, others within noise. Golden + modes-decode green.

---
