# bun-terminal

**Extreme-performance terminal rendering for [Bun](https://bun.sh) on Windows.** A 24-bit RGB pixel framebuffer drawn as Unicode block glyphs, a character-cell grid for TUIs, and real keyboard/mouse/resize input read straight from the Win32 console via `bun:ffi` — never scraped from ANSI stdin. Frames are diffed and streamed over a single write.

```sh
bun add bun-terminal
```

The unscoped front door for [`@bun-win32/terminal`](https://www.npmjs.com/package/@bun-win32/terminal) — `export * from '@bun-win32/terminal'`. A few kilobytes of TypeScript, **zero native binaries**; the only DLL it touches (`kernel32`) already ships in `C:\Windows\System32`.

- **Zero native build** — pure `bun:ffi`, no `node-gyp`, no prebuilds, no Node-version drift.
- **Zero child processes** — no `powershell`/`cmd` flash; the console is set up and restored in-process.
- **Single write per frame** — only cells whose bytes changed are re-emitted; a static frame costs ~3 bytes.
- **Real key up/down** — `ReadConsoleInputW` reports press **and** release, repeat, modifiers, mouse, focus, paste, resize — beyond what ANSI stdin can encode.

## 10-line wow

```ts
import { run } from 'bun-terminal';

// A managed live loop: clear, draw, present — ESC / Ctrl-C quit, console auto-restored.
await run({
  title: 'glow',
  frame: (surface, time) => {
    surface.clear(0, 0, 0);
    const x = surface.width / 2 + Math.sin(time) * 20;
    surface.addCircle(x, surface.height / 2, 10, 255, 180, 60); // soft additive glow
    surface.text(2, 2, `t=${time.toFixed(1)}s`, 200, 200, 200);
  },
});
```

Headless? The same engine renders to a PNG with no terminal attached:

```ts
import { Term } from 'bun-terminal';

const surface = new Term(80, 24, { mode: 'octant', dither: 'ordered' });
for (let y = 0; y < surface.height; y++)
  for (let x = 0; x < surface.width; x++) surface.setPixel(x, y, x * 3, y * 8, 128);
await Bun.write('out.png', surface.toPNG());
```

## What you get

- **`Term`** — RGB framebuffer in sub-cell modes (`half` · `quad` · `sextant` · `octant` · `braille` · `ascii`), colour depths (`truecolor` · `256` · `16`) with optional ordered (Bayer) dithering, and diff strategies (`exact` · `threshold` · `none`). Draw with `setPixel`/`addPixel`/`blendPixel`, `line`/`rect`/`fillRect`/`circle`/`fillCircle`/`addCircle`/`blit`/`text`/`plate`, or write `surface.pixels` directly for raw throughput.
- **`CharTerm`** — a character-cell grid for terminal UIs: `put`/`text`/`fillRect`/`shadeRect`/`hline`/`vline`/`box` with `BOX`/`BLOCK` glyphs and bold.
- **`run` / `runText`** — hand over a spec for a managed live loop with high-resolution frame pacing, plus headless `CAPTURE_PNG` and `BENCH` modes driven by env vars.
- **Raw control** — `ConsoleSession` + `ConsoleInput` (`poll()` per frame) + `createFrameWaiter()` when you want the loop yourself; `markDamage()` for partial redraws on mostly-static surfaces; DEC synchronized (tear-free) output; a pluggable frame sink (record / pipe); `encodePNG`; and a machine-readable `CAPABILITIES` manifest.

Frame production runs at tens of thousands of frames per second for the isolated renderer; live throughput is bounded by the terminal consuming the write.

## Honest scoping

- **Windows 10/11, Bun ≥ 1.1.** Not cross-platform — it binds the Win32 console directly; that depth is the point.
- **Frame-production fps is not live fps.** The renderer builds the diffed byte stream extremely fast; what you actually see is gated by how quickly your terminal draws it.
- **FFI input needs the real console.** Key up/down, mouse, focus, and paste come from `ReadConsoleInputW`; they aren't available through a piped/redirected stdin.

## Note to AI agents

Read [`AI.md`](https://github.com/ObscuritySRL/bun-win32/blob/main/packages/terminal/AI.md) — the complete surface contract: mental model, a capability→API table, every export with its signature, and copy-paste recipes. You should not need to read source.

## License

MIT
