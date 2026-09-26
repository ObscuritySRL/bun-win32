# @bun-win32/overlay

Anti-aliased, GPU-batched overlays for [Bun](https://bun.sh) on Windows — a transparent, click-through, always-on-top window you draw HUDs, radars, labels and 3D markers on.

## Overview

One class, **`Overlay`**, with a Canvas-like API. Draw calls tessellate on the CPU into a single interleaved vertex stream — shapes, text and images share one texture atlas — and `update()` submits the frame in one draw per layer. In the default `alpha` mode only the rectangle that changed since the last frame is read back and handed to `UpdateLayeredWindowIndirect`; an idle frame costs nothing.

Every edge is anti-aliased with a 1px feathered coverage ring (no multisampling, no shaders), colors are pre-multiplied end to end, and gradients interpolate without dark fringes.

## Features

- Shapes: `rectangle` (rounded), `circle`, `ellipse`, `triangle`, `polygon` (convex or concave), `polyline`, `line`, `arc` (strokes, pies, progress rings), `image`.
- Strokes of any width with miter joins, `butt`/`round`/`square` caps, and dash patterns with animated offsets (`[0, 6]` with round caps draws dots).
- Paints: `0xRRGGBBAA` numbers, any CSS color string (parsed once, cached), and linear / radial / along-the-stroke gradients with CSS stop rules, including exact hard stops.
- Soft Gaussian-profile shadows with offset and spread — zero offset plus a bright color makes a glow.
- Canvas-style paths: `moveTo`/`lineTo`/`quadraticCurveTo`/`bezierCurveTo`/`closePath` with adaptive flattening.
- Text: alignment, baselines, multiple lines, `maximumWidth` ellipsis truncation, outlines, shadows, gradient fills.
- State: `save`/`restore`, `translate`/`rotate`/`scale`, `clip`, `globalAlpha`.
- 3D: lines, polygons, boxes, spheres beneath the 2D layer, and `project()` to pin labels to world positions.
- Window control: `move`, `show`, `hide`; `capture()` returns the presented frame for screenshots and visual tests.

## Requirements

Bun on Windows 10/11.

## Installation

```sh
bun add @bun-win32/overlay
```

## Quick Start

```ts
import { Overlay, type ShapeStyle } from '@bun-win32/overlay';

const overlay = new Overlay({ width: 400, height: 140, x: 24, y: 24 });
const PANEL: ShapeStyle = { fill: overlay.linearGradient(['#1a2740d8', '#0b1220ec']), radius: 12, shadow: { blur: 20, y: 6 } };

setInterval(() => {
  overlay.rectangle(0, 0, 400, 140, PANEL);
  overlay.text('Kestrel_Seven', 24, 44, { color: '#e8eef6', size: 18, weight: 700 });
  overlay.arc(340, 70, 28, -Math.PI / 2, Math.PI, { cap: 'round', stroke: 0x7cf29aff, strokeWidth: 6 });
  overlay.update();
}, 1000 / 144);
```

> [!NOTE]
> AI agents: see `AI.md` for the capability→API table, every signature, and copy-paste recipes.

## Examples

```sh
bun run example/showcase.ts                                # a complete game HUD
bun run example/test-card.ts                               # every feature in a labeled grid, with a cost report
bun run example/colorkey.ts                                # color key mode
CAPTURE_PNG=showcase.png bun run example/showcase.ts       # headless still
```

## Performance

Measured at 1920x1080 against the previous immediate-mode renderer, in alpha mode:

| Scenario | Before | Now |
| --- | --- | --- |
| HUD panel (400x300, 12 labels) | ~560 FPS | ~3,800 FPS |
| 50 text strings | ~490 FPS | ~2,100 FPS |
| 1,000 circles across the window | ~270 FPS | ~470 FPS |
| Empty frame | ~740 FPS | skipped |
| CPU time of the draw calls | 60–1,400 µs | 9–250 µs |

Content spread across a whole 1080p window is bounded by the layered-window copy (about 1.2 ms per frame); `mode: 'opaque'` avoids it when transparency is not needed. Run `bun run packages/overlay/overlay.bench.ts [alpha | colorkey | opaque]` to measure on your machine.

## Notes

- Windows only; consumes `@bun-win32/gdi32`, `@bun-win32/kernel32`, `@bun-win32/opengl32` and `@bun-win32/user32`.
- The window is click-through and never takes focus. Construction makes the process DPI aware (`SetProcessDPIAware`).
- Number colors are `0xRRGGBBAA`: `0xff0000` has alpha 0 — write `0xff0000ff`.
- 3D always renders beneath 2D. The transform, `globalAlpha` and clip reset every frame.
