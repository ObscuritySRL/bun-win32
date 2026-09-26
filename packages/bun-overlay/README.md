# bun-overlay

**Anti-aliased, GPU-batched overlays for [Bun](https://bun.sh) on Windows.** A transparent, click-through, always-on-top window with a Canvas-like API — gradients, soft shadows, rounded panels, dashes, text, paths, images and 3D markers — that copies only the pixels that changed to the screen.

```sh
bun add bun-overlay
```

The unscoped front door for [`@bun-win32/overlay`](https://www.npmjs.com/package/@bun-win32/overlay) — `export * from '@bun-win32/overlay'`. Pure TypeScript over `bun:ffi`, **zero native binaries**; every DLL it touches (`opengl32`, `user32`, `gdi32`, `kernel32`) already ships in `C:\Windows\System32`.

- **Zero native build** — no `node-gyp`, no prebuilds, no Node-version drift.
- **One draw per layer** — shapes, text and images share one texture atlas and batch together, however they are mixed.
- **Anti-aliased everything** — 1px feathered edges without multisampling; pre-multiplied colors end to end.
- **Dirty rectangles** — only the region that changed is read back and presented; an idle frame costs nothing.

## 10-line wow

```ts
import { Overlay } from 'bun-overlay';

const overlay = new Overlay({ width: 360, height: 120, x: 24, y: 24 });
const GLOW = overlay.radialGradient(['#ffffff', '#4cc3ff', '#4cc3ff00']);
const PANEL = { fill: overlay.linearGradient(['#1a2740d8', '#0b1220ec']), radius: 12, shadow: { blur: 20, y: 6 } };

setInterval(() => {
  overlay.rectangle(0, 0, 360, 120, PANEL);
  overlay.circle(60, 60, 28, GLOW);
  overlay.text('Hello, overlay', 110, 68, { color: '#e8eef6', size: 20, weight: 700 });
  overlay.update();
}, 1000 / 144);
```

Styles and gradients are hoisted to constants, so drawing allocates nothing.

Headless? Render offscreen and read the frame back:

```ts
import { Overlay } from 'bun-overlay';

const overlay = new Overlay({ width: 320, height: 180, x: -32000, y: -32000 });
overlay.rectangle(20, 20, 280, 140, { fill: 0x4cc3ffff, radius: 16 });
overlay.update();
const rgba = overlay.capture(); // pre-multiplied RGBA, top-down
```

## What you get

- **Shapes** — `rectangle` (rounded), `circle`, `ellipse`, `triangle`, `polygon` (concave too), `polyline`, `line`, `arc` (progress rings, pies), `image`.
- **Style** — `fill`, `stroke`, `strokeWidth`, `radius`, `cap`, `dash`/`dashOffset`, `shadow` (soft shadows and glows), `opacity`; linear, radial and along-the-stroke gradients.
- **Paths** — `beginPath`/`moveTo`/`lineTo`/`quadraticCurveTo`/`bezierCurveTo`/`closePath`, then `fill`/`stroke`.
- **Text** — alignment, baselines, multiple lines, ellipsis truncation, outlines, shadows, gradient fills; `measureText`.
- **State** — `save`/`restore`, `translate`/`rotate`/`scale`, `clip`, `globalAlpha`.
- **3D** — `line3D`, `polygon3D`, `rectangle3D`, `box`, `sphere` beneath the 2D layer, and `project()` for labels on world positions.
- **Window** — `move`, `show`, `hide`, `capture`, `close`; three render modes (`alpha`, `colorkey`, `opaque`).

## Honest scoping

- **Windows 10/11, Bun ≥ 1.1.** Not cross-platform — it drives Win32 layered windows and OpenGL directly.
- **Full-window content is bounded by Windows.** In alpha mode the changed region must be copied to the layered window; a HUD-sized region runs in the thousands of frames per second, a full 1080p window near 700. `mode: 'opaque'` skips the copy when transparency is not needed.
- **Not an input surface.** The window is click-through and never takes focus.

## Note to AI agents

Read [`AI.md`](https://github.com/ObscuritySRL/bun-win32/blob/main/packages/overlay/AI.md) — the complete surface contract: mental model, a capability→API table, every export with its signature, and copy-paste recipes. You should not need to read source.

## License

MIT
