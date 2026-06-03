# PHOSPHOR Pre-Migration Baseline

Captured: 2026-06-03
Repo: `D:\Projects\bun-win32`
Branch: `voxelscape-v2`

This is the **PRE-MIGRATION** baseline for the terminal engine. All fps / KB
numbers are preserved exactly as emitted.

---

## Part 1 — `_term.bench.ts`

Command:

```
timeout 300 bun run packages/all/example/_term.bench.ts
```

### Part 1a — default path (half / truecolor / exact) — sizes x scenarios

| SIZE      | SCENARIO   |   FPS |    ms |      KB |
|-----------|------------|------:|------:|--------:|
| 120x40    | static     | 59075 | 0.017 |     0.0 |
| 120x40    | sparse 3%  | 29365 | 0.034 |     6.3 |
| 120x40    | scroll     |  3921 | 0.255 |   170.8 |
| 120x40    | video      |  3879 | 0.258 |   171.1 |
| 200x60    | static     | 39575 | 0.025 |     0.0 |
| 200x60    | sparse 3%  | 13037 | 0.077 |    15.9 |
| 200x60    | scroll     |  1378 | 0.726 |   426.9 |
| 200x60    | video      |  1403 | 0.713 |   427.2 |
| 320x100   | static     | 14822 | 0.067 |     0.0 |
| 320x100   | sparse 3%  |  6073 | 0.165 |    42.6 |
| 320x100   | scroll     |   561 | 1.783 |  1138.4 |
| 320x100   | video      |   560 | 1.784 |  1138.6 |

### Part 1b — mode x diff x depth (200x60 cells)

#### COHERENT plasma (≈ real video / game)

| MODE    | DIFF   | DEPTH     | px       |   FPS |  KB/f |
|---------|--------|-----------|----------|------:|------:|
| half    | exact  | truecolor | 200x120  |  1785 | 397.4 |
| half    | thr18  | truecolor | 200x120  |  3669 |  77.6 |
| half    | exact  | 256       | 200x120  |  4512 |  41.2 |
| half    | exact  | 16        | 200x120  | 10940 |  10.3 |
| quad    | exact  | truecolor | 400x120  |  1211 | 375.1 |
| quad    | thr18  | truecolor | 400x120  |  1799 |  84.0 |
| quad    | exact  | 256       | 400x120  |  1992 |  40.4 |
| quad    | exact  | 16        | 400x120  |  2891 |  10.9 |
| sextant | exact  | truecolor | 400x180  |  1101 | 379.8 |
| sextant | thr18  | truecolor | 400x180  |  1470 |  91.3 |
| sextant | exact  | 256       | 400x180  |  2066 |  43.1 |
| sextant | exact  | 16        | 400x180  |  2405 |  14.0 |
| braille | exact  | truecolor | 400x240  |   843 | 400.3 |
| braille | thr18  | truecolor | 400x240  |  1239 | 110.3 |
| braille | exact  | 256       | 400x240  |  1536 |  55.2 |
| braille | exact  | 16        | 400x240  |  1526 |  21.7 |

#### INCOHERENT noise (absolute worst case)

| MODE    | DIFF   | DEPTH     | px       |  FPS |  KB/f |
|---------|--------|-----------|----------|-----:|------:|
| half    | exact  | truecolor | 200x120  | 1301 | 427.2 |
| half    | thr18  | truecolor | 200x120  |  852 | 427.2 |
| half    | exact  | 256       | 200x120  | 2028 | 256.2 |
| half    | exact  | 16        | 200x120  | 2623 | 210.3 |
| quad    | exact  | truecolor | 400x120  |  868 | 431.6 |
| quad    | thr18  | truecolor | 400x120  |  819 | 431.6 |
| quad    | exact  | 256       | 400x120  | 1208 | 253.4 |
| quad    | exact  | 16        | 400x120  | 1282 | 184.3 |
| sextant | exact  | truecolor | 400x180  |  633 | 445.1 |
| sextant | thr18  | truecolor | 400x180  |  720 | 445.1 |
| sextant | exact  | 256       | 400x180  |  859 | 261.7 |
| sextant | exact  | 16        | 400x180  |  957 | 179.9 |
| braille | exact  | truecolor | 400x240  |  578 | 435.1 |
| braille | thr18  | truecolor | 400x240  |  580 | 435.1 |
| braille | exact  | 256       | 400x240  |  735 | 247.1 |
| braille | exact  | 16        | 400x240  |  710 | 158.4 |

---

## Part 2 — Persona BENCH

Command (per demo):

```
BENCH=1 BENCH_FRAMES=400 timeout 120 bun run packages/all/example/<demo>.ts
```

All five demos ran to completion (EXIT=0). `video-term` found its video asset
(no missing-asset failure).

| demo          | fps      | msPerFrame | frames | cols | rows | px      |
|---------------|---------:|-----------:|-------:|-----:|-----:|---------|
| video-term    | 10791.9  |     0.093  |   400  | 160  |  50  | 160x100 |
| raycaster-term|   620.3  |     1.612  |   400  | 160  |  50  | 320x150 |
| term-dashboard|  2318.6  |     0.431  |   400  | 160  |  50  | 160x100 |
| galaxy-tty    |   378.1  |     2.645  |   400  | 160  |  50  | 160x100 |
| fineprint     |   958.5  |     1.043  |   400  | 160  |  50  | 160x100 |

### Raw JSON lines

```json
{"demo":"VIDEO Counter-Strike 2 2025-11-16 19-40-24.mp4","fps":10791.9,"msPerFrame":0.093,"frames":400,"cols":160,"rows":50,"px":"160x100"}
{"demo":"Raycaster","fps":620.3,"msPerFrame":1.612,"frames":400,"cols":160,"rows":50,"px":"320x150"}
{"demo":"COMMAND CENTER","fps":2318.6,"msPerFrame":0.431,"frames":400,"cols":160,"rows":50,"px":"160x100"}
{"demo":"Galaxy TTY","fps":378.1,"msPerFrame":2.645,"frames":400,"cols":160,"rows":50,"px":"160x100"}
{"demo":"Fineprint","fps":958.5,"msPerFrame":1.043,"frames":400,"cols":160,"rows":50,"px":"160x100"}
```

---

## Flagship numbers (200x60 coherent)

| config                  |   FPS |  KB/f |
|-------------------------|------:|------:|
| half / exact / 16       | 10940 |  10.3 |
| half / exact / truecolor|  1785 | 397.4 |
