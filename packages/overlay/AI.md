# AI Guide for @bun-win32/overlay

How to use this package. Everything below is reachable from `@bun-win32/overlay` alone (or `bun-overlay`, which re-exports it). Bun + Windows only. This file is the complete surface — an agent should not need to read source to use it.

## What it is

A transparent, click-through, always-on-top window you draw on every frame: HUDs, radars, labels, crosshairs, graphs, 3D markers. One class, **`Overlay`**, with a Canvas-like API: shapes, strokes, gradients, soft shadows, text, paths, images, transforms, clipping, and simple 3D.

Everything is anti-aliased (1px feathered edges, no MSAA). Every draw call tessellates on the CPU into one vertex stream; `update()` submits the frame in one draw per layer and, in the default `alpha` mode, copies **only the pixels that changed** to the screen. An idle frame (nothing drawn, nothing on screen) costs nothing.

## Mental model (read this first)

- **Draw, then `update()`.** Draw calls only record geometry (no GL, no FFI). `update()` pumps window messages, presents, and clears. Call it once per frame; it returns `false` after `close()`.
- **Immediate mode.** Nothing persists between frames: redraw everything you want visible every frame. `update()` also resets the transform, `globalAlpha`, clip and `save()` stack.
- **Coordinates are overlay pixels**, origin at the window's top-left, y down. Angles are radians, clockwise on screen (0 = +x). Gradient angles are CSS degrees (0 = to top, 90 = to right, 180 = to bottom).
- **A style is a paint or a `ShapeStyle`.** A bare paint (`'#ff0000'`, `0xff0000ff`, a `Gradient`) **fills** shapes and **strokes** `line`/`polyline`/`arc` (and `stroke()` on paths). A `ShapeStyle` object sets both plus options. Hoist style objects to constants — resolving them allocates nothing.
- **Colors as numbers are `0xRRGGBBAA`** (same digit order as `'#rrggbbaa'`). `0xff0000` is **transparent** (alpha 00) — write `0xff0000ff`.
- **Layers:** 3D geometry always renders beneath 2D, whatever the call order.
- **Cost model:** CPU tessellation is ~5–40 µs per complex shape; the frame cost is dominated by copying the changed region to the screen (≈0.1 ms for a 400×300 HUD, ≈1–1.3 ms for a full 1080p window). Keep overlays sized to their content, or keep content grouped.

## Capability → API

| Need | Use |
| --- | --- |
| Create the window | `new Overlay({ width, height, mode?, x?, y?, antialias?, colorKey?, title?, verticalSync? })` |
| Present a frame | `overlay.update()` (returns `false` once closed) |
| Rectangle / rounded / panel | `rectangle(x, y, width, height, { fill, stroke, strokeWidth, radius, shadow })` |
| Circle / ellipse / triangle | `circle(x, y, radius, style)` · `ellipse(x, y, radiusX, radiusY, style)` · `triangle(x1, y1, x2, y2, x3, y3, style)` |
| Polygon (convex or concave) | `polygon(points, style)` — points `[{ x, y }, …]` or flat `[x0, y0, x1, y1, …]` / `Float32Array` (fastest) |
| Lines / open paths | `line(x1, y1, x2, y2, style)` · `polyline(points, style)` |
| Progress ring / pie | `arc(x, y, radius, startAngle, endAngle, { stroke, strokeWidth, cap: 'round' })` · pie: `{ fill }` |
| Curves | `beginPath()` `moveTo` `lineTo` `quadraticCurveTo` `bezierCurveTo` `closePath()` then `fill(style)` / `stroke(style)` |
| Dashes / dots / marching ants | `{ stroke, dash: [on, off], dashOffset }` · dots: `{ dash: [0, gap], cap: 'round' }` |
| Gradients | `overlay.linearGradient(stops, angle?)` · `radialGradient(stops)` · `strokeGradient(stops)` (along a stroke) |
| Soft shadow / glow | `{ fill, shadow: { blur, color, x, y, spread } }` — zero offset + bright color = glow |
| Text / label | `text(string, x, y, { size, weight, font, color, align, baseline, outline, shadow, maximumWidth, opacity })` |
| Measure text | `measureText(string, { size, weight, font, maximumWidth })` → width in pixels |
| Icon / sprite | `const image = overlay.createImage(width, height, rgba)` once → `image(image, x, y, width?, height?, tint?)` |
| Move / rotate / scale | `save()` `translate(x, y)` `rotate(angle)` `scale(x, y?)` … `restore()`; `resetTransform()` |
| Clip | `save(); clip(x, y, width, height); …; restore()` |
| Fade | `globalAlpha = 0.5` (saved by `save()`), or `{ opacity }` per style |
| 3D markers | `setPerspective(fov, near, far)` or `setProjectionMatrix(m)`, `setViewMatrix(m)`, then `line3D` `box` `sphere` `rectangle3D` `polygon3D` |
| Label a 3D point | `const point = project(x, y, z)` → `{ x, y }` in overlay pixels, or `null` behind the camera |
| Follow a window / toggle | `move(x, y)` (also re-asserts topmost) · `hide()` · `show()` · `visible` · `x` · `y` |
| Screenshot / verify visually | `capture()` → pre-multiplied RGBA, top-down, `width * height * 4` bytes |
| Clean up | `close()` |

## Full API

### `new Overlay(config: OverlayConfig)`
- `width`, `height` (required): window size in pixels.
- `mode`: `'alpha'` (default; per-pixel transparency, only the changed rectangle is copied), `'colorkey'` (one key color is see-through, everything else opaque; hard edges), `'opaque'` (no transparency; black background).
- `x`, `y`: screen position (default: centered). Offscreen positions (e.g. `-32000`) are valid — useful for headless capture.
- `antialias`: feather edges (default `true`; `false` in colorkey mode).
- `colorKey`: CSS color for colorkey mode (default `'#ff00ff'`).
- `title`: window title (default `'Overlay'`). `verticalSync`: SwapBuffers waits for vblank (colorkey/opaque only; default `false`).
- Construction calls `SetProcessDPIAware()` (process-wide) so coordinates are physical pixels.

### Fields
- `width`, `height`, `renderMode` (readonly). `globalAlpha` (read/write, 0..1, reset to 1 each frame). Getters `x`, `y`, `visible`.

### Frame and window
- `update(): boolean` — present and clear; `false` once closed. Must run on the thread that created the overlay; several overlays in one process are fine.
- `capture(target?: Uint8Array): Uint8Array` — the last presented frame, pre-multiplied RGBA, top-down. Throws if `target` is shorter than `width * height * 4`.
- `move(x, y)`, `hide()` (update() then skips rendering), `show()`, `close()` (idempotent).

### 2D primitives (all return `void`; `style?: Style` = `Paint | ShapeStyle`)
- `rectangle(x, y, width, height, style?)` — negative sizes are normalized; `radius` rounds corners.
- `circle(x, y, radius, style?)`, `ellipse(x, y, radiusX, radiusY, style?)`, `triangle(x1, y1, x2, y2, x3, y3, style?)`.
- `polygon(points: Points2D, style?)` — closed; concave and convex both fill correctly.
- `polyline(points: Points2D, style?)` — open; a bare paint strokes.
- `line(x1, y1, x2, y2, style?)` — a bare paint strokes.
- `arc(x, y, radius, startAngle, endAngle, style?)` — a bare paint strokes; `fill` draws a pie slice; a sweep ≥ 2π draws a full circle.
- `image(image: Image, x, y, width = image.width, height = image.height, tint?: Color)`.

### Paths (Canvas semantics; each subpath fills/strokes independently, no holes)
- `beginPath()`, `moveTo(x, y)`, `lineTo(x, y)`, `quadraticCurveTo(controlX, controlY, x, y)`, `bezierCurveTo(control1X, control1Y, control2X, control2Y, x, y)`, `closePath()`.
- `fill(style?)` (bare paint fills), `stroke(style?)` (bare paint strokes). Curves flatten adaptively (0.25px tolerance).

### Text
- `text(text, x, y, style?: Paint | TextStyle)` — `y` is the **baseline** unless `baseline` says otherwise; `\n` starts a new line; `\t` advances four spaces. Glyphs are grayscale anti-aliased (GDI) and cached in the atlas on first use.
- `measureText(text, style?: TextStyle): number` — widest line in pixels.
- `TextStyle`: `align` (`'left'` default · `'center'` · `'right'`), `baseline` (`'alphabetic'` default · `'top'` · `'middle'` · `'bottom'`), `color` (Paint, default white; gradients span the text block), `font` (default `'Arial'`), `size` (px, default 16), `weight` (100–900, default 400), `maximumWidth` (truncate each line with `…`), `outline` (1px outline color), `shadow` (1px down-right shadow color), `opacity`.

### Paint
- `Color` = `0xRRGGBBAA` number (fastest) | CSS string (`'#rgb'`, `'#rrggbbaa'`, `'red'`, `'rgba(…)'`; parsed once and cached; invalid strings **throw**) | `{ r, g, b, a }` floats 0..1.
- `linearGradient(stops, angle = 180)`, `radialGradient(stops)`, `strokeGradient(stops)` → `Gradient`. Create once, reuse every frame. Stops: bare colors spread evenly, or `[offset, color]` pairs (CSS rules; equal offsets make hard stops).
- Gradients map onto **each shape's bounding box**: linear across it at `angle`, radial from its center to its edges, stroke from a path's first point to its last. Linear fills are exact for any number of stops.
- `createImage(width, height, pixels)` → `Image` — straight-alpha RGBA bytes packed into the shared atlas (1024 px wide, grows to 4096 tall; throws when full or wider than 1024).

### `ShapeStyle`
`{ fill?, stroke?, strokeWidth? (default setLineWidth, initially 1), radius? (rectangle), cap? ('butt' | 'round' | 'square'), dash?, dashOffset?, shadow?: { blur (8), color ('#00000080'), x (0), y (2), spread (0) }, opacity?, segments? (curve detail; default adapts to size) }`. With neither `fill` nor `stroke`, shapes fill white (lines stroke white).

### State
- `save()` / `restore()` — transform, `globalAlpha`, clip. Unbalanced `restore()` is ignored.
- `translate(x, y)`, `rotate(angle)`, `scale(x, y = x)`, `resetTransform()` — anti-aliasing stays one device pixel wide under scale.
- `clip(x, y, width, height)` — intersected with the current clip; axis-aligned in screen space (a rotated clip uses its bounding box).
- `setLineWidth(width)` — default 2D stroke width and the width of 3D lines.

### 3D (beneath 2D; world units; row-major matrices)
- `setPerspective(fieldOfView = 90, near = 4, far = 8000)` (degrees), `setProjectionMatrix(rowMajor)`, `setViewMatrix(rowMajor)` (applies to the whole frame; last call wins). For a game's combined view-projection matrix: `setProjectionMatrix(viewProjection)` + identity `setViewMatrix`.
- `line3D(x1, y1, z1, x2, y2, z2, color?)`, `polygon3D(points: Points3D, style?)` (flat `[x, y, z, …]` or `{ x, y, z }`), `rectangle3D(x, y, z, width, height, style?)` (XY plane), `box(x, y, z, width, height, depth, style?)`, `sphere(x, y, z, radius, style?)` (`segments` default 16).
- 3D paints are solid (a gradient contributes its first stop). Boxes and spheres cull back faces; polygons and rectangles are two-sided.
- `project(x, y, z, out?)` → `{ x, y }` overlay pixels or `null` behind the camera. Returns a reused object unless you pass `out`.

### `Gradient` (named export)
`new Gradient(kind: 'linear' | 'radial' | 'stroke', stops, angle = 180)` — same as the factory methods. Fields `kind`, `angle` (radians), `offsets`, `channels`, `simple`; `at(t, alpha)` returns a packed pre-multiplied color.

### Types (named exports)
`Color`, `GradientKind`, `GradientStop`, `Image`, `LineCap`, `OverlayConfig`, `Paint`, `Point2D`, `Point3D`, `Points2D`, `Points3D`, `RGBA`, `RenderMode`, `Shadow`, `ShapeStyle`, `Style`, `TextAlign`, `TextBaseline`, `TextStyle`.

## Recipes

### HUD loop (zero allocation per frame)
```ts
import { Overlay, type ShapeStyle, type TextStyle } from '@bun-win32/overlay';

const overlay = new Overlay({ width: 420, height: 160, x: 24, y: 24 });
const PANEL: ShapeStyle = { fill: overlay.linearGradient([0x1a2740d8, 0x0b1220ec]), radius: 12, shadow: { blur: 20, y: 6 }, stroke: 0xffffff1a };
const LABEL: TextStyle = { color: 0xe8eef6ff, maximumWidth: 240, shadow: 0x000000c0, size: 16, weight: 700 };
const RING: ShapeStyle = { cap: 'round', stroke: 0x7cf29aff, strokeWidth: 6 };

setInterval(() => {
  overlay.rectangle(0, 0, 420, 160, PANEL);
  overlay.text(playerName, 24, 44, LABEL);
  overlay.arc(360, 80, 32, -Math.PI / 2, -Math.PI / 2 + health * Math.PI * 2, RING);
  overlay.update();
}, 1000 / 144);
```

### Radar blip rotated to a heading
```ts
const CHEVRON = new Float32Array([0, -7, 5.5, 6, 0, 3, -5.5, 6]);

overlay.save();
overlay.translate(blipX, blipY);
overlay.rotate(heading);
overlay.polygon(CHEVRON, { fill: 0x7cf29aff, shadow: { blur: 8, color: 0x7cf29ab0, y: 0 } });
overlay.restore();
```

### World markers with 2D labels (ESP-style)
```ts
overlay.setProjectionMatrix(viewProjection); // from the game, row-major
overlay.setViewMatrix([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]); // identity

for (const target of targets) {
  overlay.box(target.x - 16, target.y, target.z - 16, 32, 72, 32, { stroke: 0xff5c7aff });
  const head = overlay.project(target.x, target.y + 80, target.z);
  if (head !== null) overlay.text(target.name, head.x, head.y, { align: 'center', outline: 0x000000ff, size: 13 });
}
overlay.update();
```

### Sparkline with a gradient area
```ts
overlay.beginPath();
overlay.moveTo(points[0], points[1]);
for (let index = 2; index < points.length; index += 2) overlay.lineTo(points[index], points[index + 1]);
overlay.stroke({ stroke: 0x4cc3ffff, strokeWidth: 2 });
overlay.lineTo(right, bottom);
overlay.lineTo(left, bottom);
overlay.closePath();
overlay.fill(AREA); // AREA = { fill: overlay.linearGradient([0x4cc3ff70, 0x4cc3ff00]) }
```

### Follow a game window, hide when it loses focus
```ts
overlay.move(gameX + gameWidth - overlay.width - 24, gameY + 24);
if (gameFocused) overlay.show(); else overlay.hide();
```

### Headless render and visual check
```ts
const overlay = new Overlay({ width: 640, height: 360, x: -32000, y: -32000 }); // offscreen
drawScene(overlay);
overlay.update();
const rgba = overlay.capture(); // pre-multiplied RGBA, top-down — encode or inspect pixels
```
`example/_png.ts` exports `encodePNG(rgba, width, height)` if you want a PNG file to look at.

## Performance rules

- Hoist `ShapeStyle`, `TextStyle` and gradients to module constants; never build them per frame.
- Prefer number colors (`0xRRGGBBAA`); strings are cached but still hashed per call.
- Pass points as a reused `Float32Array` (flat `x, y`) rather than arrays of objects.
- Cache strings that change rarely (`${value}%`) instead of formatting every frame.
- Keep the overlay window as small as the content, or keep content grouped: in `alpha` mode the per-frame cost scales with the changed area. Draw nothing when idle — an empty frame is skipped.
- Full-screen content at very high frame rates: `mode: 'opaque'` (no transparency) avoids the layered-window copy entirely.

## Env knobs (examples only)

| Var | Meaning |
| --- | --- |
| `CAPTURE_PNG` | `showcase.ts` / `test-card.ts`: render headless to this path, then exit |
| `CAPTURE_T` | `showcase.ts`: seconds of animation before the capture (default `1.5`) |
| `DEMO_DURATION_MS` | every example: auto-exit after N ms (0 = run forever) |

## Notes / gotchas

- Windows 10/11 only. The window is click-through and never takes focus; it is not an interactive UI surface.
- `0xRRGGBB` (six hex digits) as a number has alpha 0 and draws nothing. Always write eight digits.
- Invalid CSS color strings throw `Invalid color: …`.
- `shadow` draws beneath the fill only (a stroke-only shape gets no shadow). On concave shapes the shadow only grows outward.
- Radial gradients are exact on convex shapes; on concave polygons they are approximated per vertex.
- `colorkey` mode alpha-tests coverage at 50%: translucent colors and soft shadows vanish or turn hard. Use `alpha` mode for glass and glows.
- Text renders Basic Multilingual Plane characters through GDI (emoji and surrogate pairs are not supported); no kerning.
- `setViewMatrix` / `setProjectionMatrix` apply to all 3D in the frame, not per call.
- Transform, `globalAlpha`, clip and the `save()` stack reset on every `update()`.

## Where to look (source)

| Find | Read |
| --- | --- |
| Public surface | `index.ts` |
| Any method | `overlay.ts` — search `public <name>(`; each has a JSDoc with an example |
| Style and config shapes | `types.ts` |
| Color packing, `Gradient` | `paint.ts` |
| Pixel-exact behavior of each feature | `overlay.test.ts` (one small test per feature) |
| Every feature in one place | `example/test-card.ts` (twelve cells, each a short draw function) |
| A complete HUD (panels, radar, rings, feed, sparkline, 3D label) | `example/showcase.ts` |
