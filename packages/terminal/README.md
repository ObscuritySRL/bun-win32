# @bun-win32/terminal

Extreme-performance terminal rendering engine — pixel framebuffer + TUI, FFI input — for [Bun](https://bun.sh) on Windows.

## Overview

Two surfaces share one zero-allocation core that streams diffed frames over a single write:

- **`Term`** — a 24-bit RGB framebuffer rendered as Unicode block glyphs (`half`/`quad`/`sextant`/`braille`/`ascii`), at tens of thousands of frames per second of frame production.
- **`CharTerm`** — a character-cell grid for terminal user interfaces (box drawing, shading, bold).

Input arrives through `ReadConsoleInputW` (real key **up/down** + repeat + modifiers, mouse, resize) — beyond what ANSI stdin can report. Drive a surface directly, or hand a spec to `run` / `runText` for a managed live loop with headless `CAPTURE_PNG` and `BENCH` modes.

## Features

- Sub-cell modes (`half`/`quad`/`sextant`/`braille`/`ascii`), diff strategies (`exact`/`threshold`/`none`), colour depths (`truecolor`/`256`/`16`).
- Drawing: `setPixel`/`add`/`blend`/`plate`/`text` plus `line`/`rect`/`circle`/`blit` and a clip rectangle.
- FFI keyboard (key up/down) + mouse + window-resize + focus + paste events; high-resolution frame pacing.
- Damage regions (`markDamage`) for partial redraws on mostly-static surfaces.
- DEC synchronized output (tear-free), a pluggable frame sink (record / pipe), and PNG export.
- A machine-readable `CAPABILITIES` manifest for runtime feature discovery.

## Requirements

Bun on Windows 10/11.

## Installation

```sh
bun add @bun-win32/terminal
```

## Quick Start

```ts
import { run } from '@bun-win32/terminal';

await run({
  title: 'Demo',
  frame: (surface, time) => {
    surface.clear(0, 0, 0);
    surface.fillCircle(surface.width / 2, surface.height / 2, 8, 255, 180, 60);
  },
});
```

> [!NOTE]
> AI agents: see `AI.md` for the capability→API table and copy-paste recipes for every persona.

## Examples

Twenty-six runnable demos live in `example/` (games, TUIs, video, procedural scenes):

```sh
bun run example/raycaster-term.ts     # a playable raycaster (game)
bun run example/term-dashboard.ts     # an interactive command-center (TUI)
TERM_MODE=braille bun run example/fineprint.ts   # the resolution test-card
```

## Notes

- Windows only; consumes `@bun-win32/kernel32` for console I/O.
- The console is restored on exit/crash; ESC and Ctrl-C always quit a live loop.
