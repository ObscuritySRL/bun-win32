# AI Guide for @bun-win32/terminal

How to use this package, not how the renderer works. Everything below is reachable from `@bun-win32/terminal` alone.

## What it is

An extreme-performance terminal engine for Bun on Windows. Two surfaces share one core:

- **`Term`** — a 24-bit RGB framebuffer drawn as Unicode block glyphs (games, video, procedural scenes).
- **`CharTerm`** — a character-cell grid with box/shade glyphs and bold (TUIs, dashboards).

Drive a surface yourself, or hand a spec to **`run`** / **`runText`** for a managed loop (live, plus headless `CAPTURE_PNG` and `BENCH` modes from env).

## Capability → API

| Need | Use |
| --- | --- |
| Pixel framebuffer | `new Term(columns, rows, { mode, diff, depth, threshold })` → write `surface.pixels` (RGB, length `width*height*3`) or `setPixel/addPixel/blendPixel` |
| Shapes | `surface.line/rect/fillRect/circle/fillCircle/blit`, `surface.clip(x,y,w,h)` / `noClip()` |
| Text / HUD | `surface.text(x,y,string,r,g,b,scale?)`, `surface.plate(x,y,w,h,alpha?)`, `Term.textWidth(string)` |
| TUI cells | `new CharTerm(columns, rows)` → `put/text/fillRect/shadeRect/hline/vline/box`, with `BOX`/`BLOCK` glyphs |
| Sub-cell detail | `mode`: `half` (default) `quad` `sextant` `braille` `ascii` — higher = more pixels/cell |
| Fewer bytes/frame | `depth`: `truecolor` (default) `256` `16`; `diff`: `exact` (default) `threshold` `none` |
| Run an app | `run(spec)` (pixel) / `runText(spec)` (char) — live loop + `CAPTURE_PNG`/`BENCH` |
| Present a frame yourself | `surface.present({ sync?, sink? })` — `sync` = tear-free (DEC 2026), `sink` = redirect bytes |
| Input (live loop) | `spec.onKey(key, surface)` (real key up/down via FFI `ReadConsoleInputW`); `spec.mouse: true` → `surface.mouse.{x,y,down,wheel,…}` |
| Raw console session | `new ConsoleSession({ mouse?, title? })` + `new ConsoleInput(handlers)` (`poll()` per frame) + `createFrameWaiter()` |
| Headless image | `surface.toPNG()` → PNG bytes; `encodePNG(rgb, w, h)` |
| Enumerate features | `CAPABILITIES` (modes/diffs/depths/inputBackends/features/options); `detectCapabilities()` |

## Where to look

| Find | Read |
| --- | --- |
| The public surface | `index.ts` |
| Pixel surface methods | `pixel.ts` (`class Term`) |
| Char surface methods | `char.ts` (`class CharTerm`) |
| App-loop spec fields | `loop.ts` (`AppSpec`, `TextAppSpec`) |
| Input event shapes | `input.ts` (`KeyEvent`, `PointerEvent`) |
| Runnable examples | `example/` (26 demos) |

## Recipes

### Game loop (60fps, key up/down, mouse)
```ts
import { run } from '@bun-win32/terminal';

await run({
  title: 'Game',
  targetFps: 60,
  mouse: true,
  onKey: (key, surface) => { if (key === 'up') {/* … */} },
  frame: (surface, time, deltaTime, frame) => {
    surface.clear(8, 8, 16);
    surface.fillCircle(surface.width / 2, surface.height / 2, 6, 255, 200, 80);
    if (surface.mouse.down) surface.setPixel(surface.mouse.x, surface.mouse.y, 255, 0, 0);
  },
});
```

### TUI app
```ts
import { runText } from '@bun-win32/terminal';

await runText({
  title: 'Dashboard',
  onKey: (key) => { if (key === 'esc') process.exit(0); }, // Ctrl-C also quits
  frame: (surface) => {
    surface.clear(10, 10, 16);
    surface.box(1, 1, 30, 8, 'rounded', [120, 200, 255]);
    surface.text(3, 3, 'Hello, TUI', [255, 255, 255], undefined, true);
  },
});
```

### Drive a surface directly (e.g. pipe decoded video frames)
```ts
import { Term } from '@bun-win32/terminal';

const surface = new Term(160, 50, { mode: 'half', depth: '16' });
surface.pixels.set(rgbFrame); // length surface.width*surface.height*3
surface.present({ sync: true }); // or surface.present({ sink: bytes => socket.write(bytes) })
```

### Headless render / benchmark (no terminal)
```sh
CAPTURE_PNG=out.png TERM_COLS=200 TERM_ROWS=60 bun run example/game.ts   # deterministic PNG
BENCH=1 TERM_MODE=sextant TERM_DEPTH=16 bun run example/game.ts          # frame-production fps (JSON)
```
Env knobs: `TERM_MODE/TERM_DIFF/TERM_DEPTH/TERM_THRESHOLD`, `TERM_COLS/TERM_ROWS`, `CAPTURE_PNG/CAPTURE_T/CAPTURE_FPS/CAPTURE_FRAMES`, `BENCH/BENCH_FRAMES`.

## Notes

- Windows only (Bun + Win32 console via `@bun-win32/kernel32`).
- `Term` mouse coordinates are pixels; `CharTerm`'s are cells.
- `run` defaults to uncapped fps; `runText` defaults to 60.
- The console is restored on exit/crash; ESC and Ctrl-C always quit a live loop.
