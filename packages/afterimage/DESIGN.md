# Afterimage — design

> **Press a key and scrub your screen back in time.**

Afterimage keeps the last stretch of your screen in memory — every changed pixel, never written to
disk — and gives it back the instant you ask. The toast that vanished, the code that expired, the
message someone deleted, the slide the presenter skipped, the error that scrolled away: press
**Win+Shift+Z**, roll the wheel, and it's there again.

This file is the spec: why this exists, how it should feel, how it works. The README is for users.

## 1. Why this, and not something else

Twenty concepts were written down *before* looking at anything else in the repository (all of them
are in Appendix A). The ones that came closest:

| Concept | Why it lost |
| --- | --- |
| Keystroke/click visualizer for screencasts | Carnac and KeyCastr exist; a keyboard hook and a label is not a reach |
| Hot-mic halo + global mute | Windows 11 already ships the mic indicator and Win+Alt+K |
| Desktop pet that walks on window edges | Delightful for a day; nobody keeps it running |
| Region watcher ("ping me when this changes") | Real, but its first frame is a rectangle — and it falls out of Afterimage's tile tapes for free |
| Meeting slide catcher | Real, also a by-product of the same journal ("moments") |
| Translation lens | No offline translation API in Windows; a network dependency kills it |
| Per-app audio routing | Needs undocumented policy-config COM; WASAPI loopback is a known Bun-FFI dead end |
| Focus tunnel, PiP crops, clipboard shelf, text grab | PowerToys / HazeOver / Win+V already own them |

Afterimage won on all three criteria at once:

- **A reason to exist.** Losing something that was on screen a moment ago happens to everyone,
  several times a day, and there is no undo for it. Windows Recall answers with periodic
  screenshots written to disk. Afterimage keeps *every changed frame*, keeps it *only in RAM*,
  forgets on a budget, and scrubs instantly.
- **Seems impossible from a scripting language.** DXGI desktop duplication into a GPU compute
  pass that fingerprints every 64×64 tile of the screen thirty times a second; a content-addressed,
  zstd-compressed tile journal in a worker thread; moments composed on one GPU device and sampled
  zero-copy from another; a capture-excluded flip-model overlay paced to the display; Direct2D
  text through raw vtables. All TypeScript on Bun.
- **A first frame that stops you.** Frame 0 is your exact screen. Then the screen *exhales* into a
  card, the recent past lies along a luminous timeline beneath it, and a roll of the wheel makes
  windows un-move, text un-type, and the vanished toast slide back in.

## 2. Voice

Quiet, observant, brief. Speaks in the first person only when it must ("I keep the last hour").
Never technical unless you ask (the *Under the hood* panel is where numbers live). Never alarmed.

| Situation | Copy |
| --- | --- |
| Time pill, live | `Now` |
| Time pill, past | `4 min 12 s ago` · secondary `14:32:07` |
| Empty history | `Nothing to look back on yet.` · `I start remembering the moment I wake up.` |
| Paused | `Paused` · `Your screen is your own until you resume.` |
| Gap (locked / paused / unavailable) | `Locked` · `Paused` · `Out of sight` |
| Capture unavailable | `I can't see this screen right now.` · `It comes back on its own.` |
| Protected content | `Some of this moment was protected.` |
| Copied | `Copied` / `Copied — region` / `Saved to Pictures` |
| Forget, first press | `Press again to forget everything.` |
| Forgot | `Forgotten.` |
| First run | `Afterimage is watching — only into memory.` · `Press Win+Shift+Z to look back.` |
| Tray tooltip | `Afterimage — holding the last 38 min` |

## 3. Design language

**Intent.** *The past is right behind the glass: calm, instant, and private.*

**Palette** — derived from the system accent (`DwmGetColorizationColor`), everything else neutral so
the user's own pixels stay the hero.

| Token | Value | Use |
| --- | --- | --- |
| `ink` | `#07080B` | backdrop under the card, mixed 82 % over the blurred moment |
| `glass` | `rgba(24, 26, 32, 0.78)` | timeline shelf, pills, panels |
| `glassEdge` | `rgba(255, 255, 255, 0.08)` | 1 px top-lit hairline on glass |
| `textPrimary` | `#F3F5F8` | time, titles |
| `textSecondary` | `#A9B0BD` | clock time, labels |
| `textTertiary` | `#6B7280` | ticks, hints |
| `accent` | system accent, re-lit to L*≈62 | waveform, playhead, region |
| `accentGlow` | accent at L*≈78, 35 % | waveform bloom, focus rings |
| `now` | `#FFF7EC` | the "now" edge and live dot — a warm white |
| `past` | 3 % cool tint + edge vignette | applied to the card while not live |

**Type scale** (DIPs; Segoe UI Variable — Display ≥ 20, Text for body, Small ≤ 12; Cascadia Mono for numbers that change):

| Role | Size / line | Weight |
| --- | --- | --- |
| `display` | 30 / 36 | 600 |
| `title` | 18 / 24 | 600 |
| `body` | 14 / 20 | 400 |
| `caption` | 12 / 16 | 400 |
| `mono` | 12 / 16 | 400 |

**Spacing.** Base unit 4 DIP; layout snaps to 8. Card radius 12, pill radius = height / 2, shelf
radius 16, hairlines 1 physical pixel.

**Depth.** The card casts a two-layer shadow (ambient 48 DIP blur at 35 %, key 12 DIP at 30 %, offset
6 DIP down). Glass gets a 1 px top hairline. Nothing else casts shadows.

**Motion** — every animated value is a closed-form damped harmonic oscillator, evaluated analytically
each frame from (start, velocity, target, start time). Retargeting samples position *and velocity* at
the moment of interruption, so nothing restarts or jumps. Nothing is linear, nothing pops.

| Character | ζ (damping) | ω (rad/s) | Feel | Used for |
| --- | --- | --- | --- | --- |
| `exhale` | 0.86 | 17 | soft settle, no visible overshoot | card scale/radius on open and close |
| `rise` | 0.74 | 15 | gentle 3 % overshoot | timeline shelf, pills entering |
| `glide` | 1.00 | 30 | fast, critically damped | playhead, scrub position, region rectangle |
| `fade` | 1.00 | 20 | smooth opacity | crossfades, labels, panels |
| `breath` | 1.00 | 42 | snappy | hover and press highlights |

## 4. Interaction

Global: **Win+Shift+Z** opens and closes (falls back to **Ctrl+Alt+Z** if the shell owns the
combination). Tray icon click does the same.

| Input | Action |
| --- | --- |
| Wheel / ← → | back / forward. Wheel moves along the timeline axis; arrows step one frame (hold to accelerate) |
| Shift + ← → | previous / next *moment* (a large change: window switch, toast, page) |
| Ctrl + ← → | ± 1 minute |
| Home / End | oldest / now |
| Drag on the timeline | scrub |
| Drag on the picture | select a region — steps now follow only that region's changes, the waveform shows only its activity |
| Space | toggle 1 : 1 inspect (card ↔ full size) |
| digits / `:` | open *Go to* (`14:32`, `2:05 pm`, `90s`, `5m`, `1h`) — full editing: Ctrl+A, Ctrl+Backspace, Ctrl+V, Esc |
| Ctrl + C | copy the moment (or region) as an image |
| Enter | copy and close |
| Ctrl + S | save PNG to Pictures\Afterimage |
| ? | *Under the hood* |
| Ctrl + Delete (twice) | forget everything |
| Esc | clear region → close Go to → close (rewinding forward to now first) |

Hover never steals keyboard state: the keyboard owns the playhead; the mouse owns a *ghost*
playhead that only commits on click or drag.

## 5. Choreography

**Open** (hotkey → first frame):
1. Worker grabs a fresh desktop frame, copies it into the shared view texture (GPU → GPU).
2. The overlay window — cloaked, transitions disabled, excluded from capture — presents that exact
   frame at scale 1, then uncloaks. Frame 0 is pixel-identical to what was on screen; the hardware
   cursor stays on top, untouched.
3. `exhale` drives scale 1 → ~0.84 and radius 0 → 12; the backdrop fades in as the moment, blurred
   and sunk into ink. `rise` brings up the timeline shelf (+60 ms) and the time pill (+90 ms).

**Scrub.** The playhead `glide`s; the worker composes the target moment incrementally (only tiles
that differ) into the back view texture and hands it over when the GPU fence passes. The card
shows the new moment the frame it is ready — no crossfade blur on text; changed tiles get a 140 ms
accent shimmer on their edges so your eye finds what moved.

**Close.** If live: `exhale` back to scale 1 / radius 0 while the shelf drops; when settled, the
window hides — seamless because the last frame *is* the live screen. If in the past: the playhead
glides to *now* first (the screen fast-forwards in front of you), then the same exit. Hotkey during
close retargets back to open from the current position and velocity.

## 6. Architecture

```
 main thread ("the eye")                         worker thread ("the memory")
 ───────────────────────                         ────────────────────────────
 tray · hotkey · message pump                    DXGI duplication (per output)
 overlay window (flip swap chain,                 ├─ copy desktop → frame ping-pong (GPU)
   excluded from capture, cloaked)                ├─ fingerprint CS: per-tile changed + 64-bit hash
 springs · layout · input · Go to                 ├─ non-blocking readback (DO_NOT_WAIT polling)
 renderer (D3D11 passes + D2D text) ◄── shared ── ├─ fresh tiles only → strip → zstd → store
   samples view texture A|B          textures     ├─ journal: frames[] + per-tile tapes
 headless script runner                           └─ composer: moment → view texture (incremental)
```

**Store.** Content-addressed: a tile's 64-bit GPU fingerprint is its identity. A tile seen before —
the caret blinking back, a window you switched to again, every blank tile everywhere — costs zero
bytes and zero CPU. New content is read back through a small staging strip (never the full screen)
and zstd-compressed (level 1, ~14 µs/tile, ~15× on screen content). Blobs are ref-counted; the budget
(default 512 MB) evicts the oldest frames, keeping each tile's last state as the base.

**Journal.** `frames` (time, changed-tile count, cursor) and one *tape* per tile: (frame, blob)
pairs. Composing frame *f* is one binary search per tile; composing the next frame touches only the
tiles whose blob differs from what the view texture already holds. Region steps are the same search
restricted to the region's tiles.

**Cost model** (measured on a 5120 × 1440, 240 Hz display, RTX 4090 — see README for final
numbers): acquire-only ≈ 1.4 % of one core at 30 Hz; + GPU fingerprinting ≈ 2.5 %; + per-fresh-tile
work. Idle costs nothing: `AcquireNextFrame` blocks until the screen changes.

**Rendering.** Flip-discard swap chain on a borderless top-most popup with
`WDA_EXCLUDEFROMCAPTURE`, cloaked until its first present, DWM transitions disabled. Paced by the
frame-latency waitable object (fallback `DwmFlush`). Passes: backdrop (mip-blurred moment × ink) →
card (rounded SDF, two-layer shadow, past tint, shimmer) → shelf (glass, waveform on a log time
axis, playhead) → Direct2D text on the same back buffer.

**Time axis.** Logarithmic: `x = log(1 + age / 8 s)`. The last minute gets about a third of the
timeline; the last hour compresses gracefully — recent past is large, distant past is small, the way
memory works.

## 7. States

First run (welcome card near the tray, 8 s, non-activating) · empty history · live · past ·
region active · Go to open · paused (gap hatched on the timeline) · locked / secure desktop
(`Locked` gap) · capture unavailable (message, auto-retry) · protected content · budget reached
(oldest end fades to `Forgotten`) · copying / saved · under the hood.

## 8. Engineering doctrine

- The render thread never decompresses, hashes, encodes PNGs, or touches the disk. Those live in the
  worker. The render thread uploads nothing large: moments arrive as shared GPU textures.
- Never block on a GPU map: `D3D11_MAP_FLAG_DO_NOT_WAIT` + yield. (A blocking `Map` spun a core at
  ~4× the cost of the actual work in the spike.)
- Frame times are wall-clock intervals between presents; the UI and README report the worst case.
- Boot time = process start → first frame journaled; open latency = hotkey message → first present.
- Headless mode (`AFTERIMAGE_SCRIPT`) renders to an offscreen target on a virtual clock and can feed
  the journal from a synthetic *stage* desktop, so every flow is testable — and every promo image is
  free of anyone's real windows.

## Appendix A — every concept considered

| #  | Concept | Who / why | Verdict |
|----|---------|-----------|---------|
| 1  | **Screen rewind** — press a key, scrub the whole screen back in time; RAM only | Everyone: the toast that vanished, the 2FA code, the deleted chat message, the slide the presenter skipped, the error that flashed past | **WINNER** |
| 2  | Keystroke + click visualizer for screencasts | Tutorial makers, streamers | Carnac/KeyCastr exist; it's a keyboard hook and a label, nothing impossible |
| 3  | Hot-mic halo + one global mute across Teams/Zoom/Discord | Remote workers | Windows 11 already ships a mic indicator and Win+Alt+K |
| 4  | "Where did my day go" app-time timeline | Freelancers | ActivityWatch/RescueTime exist; no wow |
| 5  | Desktop pet that walks on window edges | Delight | Shimeji/Desktop Goose; a toy you uninstall on day two |
| 6  | Presenter spotlight / zoom / ink | Presenters | ZoomIt + PowerToys already own it |
| 7  | Region watcher: "ping me when this part of the screen changes" | Anyone waiting on a render, queue, build, lobby | Real, but the first frame is a rectangle. Falls out of #1 for free |
| 8  | Meeting slide catcher: every slide change becomes a page | Students, remote workers | Real; also falls out of #1 ("moments") |
| 9  | Live-cropped PiP of any window region | Multitaskers | PowerToys Crop and Lock |
| 10 | Per-app audio routing / EQ | Streamers | Needs undocumented policy-config COM; WASAPI loopback is a known Bun-FFI dead end |
| 11 | Focus tunnel: everything but the active window dims | Distracted people | HazeOver-style; thin |
| 12 | Translation lens over any text | Gamers, travellers | No offline translation API in Windows; a network dependency kills it |
| 13 | Gamepad couch mode for the whole desktop | HTPC users | Steam Big Picture / Gopher360; niche |
| 14 | Day-long desktop time-lapse for artists | Speed-painters, coders | Real but niche; an export of #1 |
| 15 | Voice command palette | Power users | Voice Access exists; offline recognizer quality is weak |
| 16 | Workspace save/restore (all windows + positions) | Multi-project people | App state can't be restored; FancyZones layouts cover the rest |
| 17 | Ambient bias-light glow from screen content | Home theatre | A gadget, not a reason to keep anything running |
| 18 | Clipboard shelf with previews | Everyone | Win+V |
| 19 | "Shazam for the screen" text grab (OCR to clipboard) | Everyone | PowerToys Text Extractor |
| 20 | Before/after "time lens" over a spreadsheet | Analysts | A mode of #1 |
