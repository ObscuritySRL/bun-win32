/**
 * Showcase — a complete game HUD in one overlay
 *
 * Glass panels, gradients, soft shadows and glows, progress rings, a sweeping radar, a live frame-time sparkline,
 * text effects, an atlas image, and a 3D objective with a projected label, all batched into one draw per layer.
 * Every style is hoisted: the frame loop allocates nothing but the few strings it caches.
 *
 * APIs demonstrated:
 * - `Overlay.rectangle` / `circle` / `arc` / `polygon` / `line` (rounded glass panels, progress rings, radar blips)
 * - `Gradient` linear / radial / stroke kinds (panel fills, radar glow, the XP ring running along its stroke)
 * - `ShapeStyle.shadow` (drop shadows and zero-offset glows), `dash` (radar range rings), `cap: 'round'`
 * - `Overlay.beginPath` / `quadraticCurveTo` / `bezierCurveTo` / `fill` / `stroke` (shield icon, sparkline area)
 * - `Overlay.text` with `maximumWidth`, `outline`, `shadow`, `align`, `baseline` (labels, cooldowns, kill feed)
 * - `Overlay.save` / `restore` / `translate` / `rotate` / `clip` / `globalAlpha` (blips, fades, the clipped glint)
 * - `Overlay.createImage` / `image` (a generated orb icon packed into the atlas)
 * - `Overlay.sphere` / `line3D` / `setLineWidth` / `project` (a 3D objective beneath the 2D layer, labeled in 2D)
 * - `Overlay.update` / `capture` (present only what changed; headless PNG capture)
 *
 * Run: bun run example/showcase.ts
 *      CAPTURE_PNG=showcase.png bun run example/showcase.ts   (headless still, then exit)
 *      DEMO_DURATION_MS=5000 bun run example/showcase.ts      (exit after five seconds)
 */

import { Gradient, type Image, Overlay, type ShapeStyle, type TextStyle } from '@bun-win32/overlay';

import { encodePNG } from './_png';

const { PI, ceil, cos, floor, max, min, sin, sqrt } = Math;

// Declared in dependency order: palette, then gradients, then the styles built from both

// Palette: 0xRRGGBBAA numbers skip color parsing entirely
const AMBER = 0xffc94cff;
const CORAL = 0xff5c7aff;
const CYAN = 0x4cc3ffff;
const INK = 0xe8eef6ff;
const MINT = 0x7cf29aff;
const MUTED = 0x8a97a8ff;

// Gradients: created once, mapped onto each shape's bounds
const GLASS = new Gradient('linear', [0x1a2740d8, 0x0b1220ec]);
const GLINT = new Gradient('linear', [0xffffff00, 0xffffffa0, 0xffffff00], 90);
const HIGHLIGHT = new Gradient('linear', [0xffffff00, 0xffffff40, 0xffffff00], 90);
const SHIELD_GRADIENT = new Gradient('linear', [0x6fd3ffff, 0x2a6fb8ff]);
const SPARK_AREA = new Gradient('linear', [0x4cc3ff70, 0x4cc3ff00]);
const XP = new Gradient('stroke', [CYAN, MINT]);

const HEIGHT = 720;
const TAU = PI * 2;
const WIDTH = 1280;

// Shape styles
const ABILITY: ShapeStyle = { fill: GLASS, radius: 14, shadow: { blur: 18, color: 0x000000a0, y: 6 }, stroke: 0xffffff1a };
const ABILITY_READY: ShapeStyle = { fill: GLASS, radius: 14, shadow: { blur: 20, color: 0x4cc3ff90, y: 0 }, stroke: 0x4cc3ffb0, strokeWidth: 1.5 };
const AVATAR: ShapeStyle = { fill: new Gradient('radial', [0x6fd3ffff, 0x1b3f73ff]), stroke: 0xffffff30 };
const BADGE: ShapeStyle = { fill: AMBER, radius: 9, shadow: { blur: 10, color: 0xffc94c80, y: 0 } };
const BLIP_ALLY: ShapeStyle = { fill: MINT, shadow: { blur: 8, color: 0x7cf29ab0, y: 0 } };
const BLIP_ENEMY: ShapeStyle = { fill: CORAL, shadow: { blur: 10, color: 0xff5c7ad0, y: 0 } };
const BOLT_STYLE: ShapeStyle = { fill: AMBER, shadow: { blur: 10, color: 0xffc94c90, y: 0 } };
const COOLDOWN_RING: ShapeStyle = { cap: 'round', stroke: CYAN, strokeWidth: 3 };
const COOLDOWN_SHADE: ShapeStyle = { fill: 0x060b14c0 };
const CORE: ShapeStyle = { fill: 0xffc94c50, segments: 14, stroke: 0xffc94c70 };
const CROSSHAIR: ShapeStyle = { cap: 'round', stroke: INK, strokeWidth: 2 };
const CROSSHAIR_SHADOW: ShapeStyle = { cap: 'round', stroke: 0x00000070, strokeWidth: 4 };
const FEED_ROW: ShapeStyle = { fill: 0x0b1220c8, radius: 13, stroke: 0xffffff12 };
const GEM: ShapeStyle = { fill: CORAL, radius: 3, stroke: 0xffffff90, strokeWidth: 1.5 };
const GLINT_STYLE: ShapeStyle = { fill: GLINT };
const HEALTH_LOW: ShapeStyle = { fill: CORAL, radius: 2 };
const HIGHLIGHT_STYLE: ShapeStyle = { stroke: HIGHLIGHT };
const HIT: ShapeStyle = { cap: 'round', stroke: CORAL, strokeWidth: 2.5 };
const KEY: ShapeStyle = { fill: 0x0b1220ff, radius: 5, stroke: 0xffffff30 };
const PANEL: ShapeStyle = { fill: GLASS, radius: 14, shadow: { blur: 24, color: 0x00000090, y: 8 }, stroke: 0xffffff16 };
const PLAYER: ShapeStyle = { fill: INK, shadow: { blur: 8, color: 0xffffffa0, y: 0 } };
const RADAR: ShapeStyle = { fill: new Gradient('radial', [0x15344ee0, 0x0b1220f0]), shadow: { blur: 28, color: 0x00000090, y: 8 }, stroke: 0x4cc3ff50, strokeWidth: 1.5 };
const RADAR_RING: ShapeStyle = { dash: [2, 5], stroke: 0xffffff26 };
const SHIELD: ShapeStyle = { fill: SHIELD_GRADIENT, stroke: 0xffffff80 };
const SHIELD_BAR: ShapeStyle = { fill: CYAN, radius: 2 };
const SPARK_FILL: ShapeStyle = { fill: SPARK_AREA };
const SPARK_LINE: ShapeStyle = { cap: 'round', stroke: CYAN, strokeWidth: 2 };
const SWEEP_EDGE: ShapeStyle = { stroke: 0x4cc3ffe0, strokeWidth: 1.5 };
const TETHER: ShapeStyle = { stroke: 0xffc94ca0 };
const TOAST_PANEL: ShapeStyle = { fill: GLASS, radius: 28, shadow: { blur: 24, color: 0x00000090, y: 8 }, stroke: 0xffffff16 };
const TRACK: ShapeStyle = { fill: 0xffffff14, radius: 2 };
const XP_RING: ShapeStyle = { cap: 'round', stroke: XP, strokeWidth: 4 };
const XP_TRACK: ShapeStyle = { stroke: 0xffffff14, strokeWidth: 4 };

// Text styles
const BADGE_TEXT: TextStyle = { align: 'center', baseline: 'middle', color: 0x1a1300ff, size: 11, weight: 800 };
const CAPTION: TextStyle = { color: MUTED, size: 11, weight: 700 };
const CARDINAL: TextStyle = { align: 'center', baseline: 'middle', color: MUTED, size: 11, weight: 700 };
const COOLDOWN: TextStyle = { align: 'center', baseline: 'middle', color: INK, shadow: 0x000000c0, size: 18, weight: 800 };
const FEED: TextStyle = { baseline: 'middle', color: INK, size: 13, weight: 700 };
const FEED_ALLY: TextStyle = { ...FEED, color: MINT };
const FEED_ENEMY: TextStyle = { ...FEED, color: CORAL };
const INITIALS: TextStyle = { align: 'center', baseline: 'middle', color: INK, shadow: 0x00000080, size: 24, weight: 800 };
const KEY_TEXT: TextStyle = { align: 'center', baseline: 'middle', color: INK, size: 10, weight: 800 };
const LABEL: TextStyle = { align: 'center', color: AMBER, outline: 0x000000c0, size: 13, weight: 800 };
const METRIC: TextStyle = { color: INK, size: 18, weight: 800 };
const NAME: TextStyle = { color: INK, maximumWidth: 190, shadow: 0x000000a0, size: 18, weight: 700 };
const NORTH: TextStyle = { align: 'center', baseline: 'middle', color: AMBER, size: 12, weight: 800 };
const SMALL: TextStyle = { align: 'right', color: MUTED, size: 11, weight: 700 };
const TOAST_ICON: TextStyle = { align: 'center', baseline: 'middle', color: 0x1a1300ff, size: 16, weight: 800 };
const TOAST_TEXT: TextStyle = { color: INK, size: 15, weight: 800 };

// Scenario data and geometry
const ABILITIES = [
  { duration: 5.5, key: 'Q', phase: 0.4 },
  { duration: 8, key: 'E', phase: 3.1 },
  { duration: 11, key: 'R', phase: 9.2 },
  { duration: 7, key: 'F', phase: 1.7 },
];
const ARROW = new Float32Array([-3, -4, 3, 0, -3, 4]);
const BLIPS = [
  { ally: true, angle: -2.2, distance: 0.46, speed: 0.07 },
  { ally: true, angle: 2.6, distance: 0.3, speed: -0.05 },
  { ally: false, angle: -0.6, distance: 0.74, speed: 0.04 },
  { ally: false, angle: 0.4, distance: 0.55, speed: -0.06 },
  { ally: false, angle: 1.2, distance: 0.84, speed: 0.03 },
];
const BOLT = new Float32Array([2, -16, -10, 3, -1, 3, -4, 16, 10, -4, 1, -4, 4, -16]);
const CHEVRON = new Float32Array([0, -7, 5.5, 6, 0, 3, -5.5, 6]);
const FEED_ROWS = [
  { ally: true, killer: 'Kestrel_Seven', victim: 'Umbra' },
  { ally: false, killer: 'Nyx', victim: 'Halcyon' },
  { ally: false, killer: 'Brightwater', victim: 'Vesper_Nine' },
  { ally: true, killer: 'Kestrel_Seven', victim: 'Morrow' },
  { ally: true, killer: 'Juniper', victim: 'Quill' },
  { ally: false, killer: 'Talon', victim: 'Sable' },
];
const HEALTH: ShapeStyle[] = Array.from({ length: 10 }, (_, segment) => ({ fill: mix(MINT, CYAN, segment / 9), radius: 2 }));
const OCTAHEDRON = [0, 1, 0, 1, 0, 0, 0, 0, 1, -1, 0, 0, 0, 0, -1, 0, -1, 0];
const OCTAHEDRON_EDGES = [0, 1, 0, 2, 0, 3, 0, 4, 5, 1, 5, 2, 5, 3, 5, 4, 1, 2, 2, 3, 3, 4, 4, 1];
const PLAYER_ARROW = new Float32Array([0, -8, 6, 6, 0, 3, -6, 6]);

// Radar sweep: a fan of thin slices fading behind the leading edge
const SWEEP: ShapeStyle[] = Array.from({ length: 16 }, (_, slice) => ({ fill: 0x4cc3ff00 | floor(70 * (1 - slice / 16) ** 2) }));

/** Per-frame text, rebuilt only when the value behind it changes */
interface Labels {
  cooldowns: string[];
  frame: string;
  health: string;
  lastHealth: number;
  lastSeconds: number[];
  nextFrame: number;
}

function abilities(overlay: Overlay, time: number, orb: Image, labels: Labels): void {
  const gap = 14;
  const size = 64;
  const left = (WIDTH - (size * 4 + gap * 3)) / 2;
  const top = HEIGHT - 104;

  for (let slot = 0; slot < 4; slot++) {
    const { duration, key, phase } = ABILITIES[slot];
    const cycle = (time / 1000 + phase) % (duration * 1.35);
    const ready = cycle >= duration;
    const x = left + slot * (size + gap);
    const centerX = x + size / 2;
    const centerY = top + size / 2;

    overlay.rectangle(x, top, size, size, ready ? ABILITY_READY : ABILITY);

    // Icons: three vector, one atlas image
    overlay.save();
    overlay.translate(centerX, centerY);
    overlay.globalAlpha = ready ? 1 : 0.45;

    if (slot === 0) {
      overlay.polygon(BOLT, BOLT_STYLE);
    } else if (slot === 1) {
      overlay.beginPath();
      overlay.moveTo(0, -15);
      overlay.bezierCurveTo(8, -11, 12, -11, 13, -10);
      overlay.bezierCurveTo(13, 4, 7, 11, 0, 16);
      overlay.bezierCurveTo(-7, 11, -13, 4, -13, -10);
      overlay.bezierCurveTo(-12, -11, -8, -11, 0, -15);
      overlay.closePath();
      overlay.fill(SHIELD);
      overlay.stroke(SHIELD);
    } else if (slot === 2) {
      overlay.rotate(PI / 4 + time / 1400);
      overlay.rectangle(-10, -10, 20, 20, GEM);
    } else {
      overlay.image(orb, -18, -18, 36, 36);
    }

    overlay.restore();

    // Cooldown: shade the remaining sweep, ring the elapsed part, count down
    if (!ready) {
      const progress = cycle / duration;
      const seconds = ceil(duration - cycle);
      const start = -PI / 2 + progress * TAU;

      overlay.arc(centerX, centerY, 30, start, 1.5 * PI, COOLDOWN_SHADE);
      overlay.arc(centerX, centerY, 27, -PI / 2, start, COOLDOWN_RING);

      if (labels.lastSeconds[slot] !== seconds) {
        labels.cooldowns[slot] = `${seconds}`;
        labels.lastSeconds[slot] = seconds;
      }

      overlay.text(labels.cooldowns[slot], centerX, centerY + 1, COOLDOWN);
    }

    overlay.rectangle(centerX - 10, top + size - 8, 20, 16, KEY);
    overlay.text(key, centerX, top + size, KEY_TEXT);
  }
}

/** 40x40 glowing orb, generated once into the atlas */
function createOrb(overlay: Overlay): Image {
  const size = 40;
  const pixels = new Uint8Array(size * size * 4);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const distance = sqrt((x - 19.5) ** 2 + (y - 19.5) ** 2) / 19.5;
      const highlight = max(0, 1 - sqrt((x - 14) ** 2 + (y - 13) ** 2) / 9);
      const offset = (y * size + x) * 4;

      pixels[offset] = min(255, 124 + 131 * highlight);
      pixels[offset + 1] = min(255, 242 * (1 - distance * 0.35) + 13 * highlight);
      pixels[offset + 2] = min(255, 154 + 101 * highlight);
      pixels[offset + 3] = 255 * max(0, min(1, (1 - distance) * 3));
    }
  }

  return overlay.createImage(size, size, pixels);
}

/**
 * Builds the showcase for `overlay`: returns a per-frame draw function.
 * @example
 * ```ts
 * const draw = createShowcase(overlay);
 * draw(performance.now(), 0.4);
 * overlay.update();
 * ```
 */
export function createShowcase(overlay: Overlay): (time: number, frameMilliseconds: number) => void {
  const killerWidths = FEED_ROWS.map(({ killer }) => overlay.measureText(killer, FEED));
  const labels: Labels = { cooldowns: ['', '', '', ''], frame: '0.00 ms', health: '', lastHealth: -1, lastSeconds: [-1, -1, -1, -1], nextFrame: 0 };
  const orb = createOrb(overlay);
  const rowWidths = FEED_ROWS.map(({ victim }, row) => killerWidths[row] + overlay.measureText(victim, FEED) + 56);
  const samples = new Float64Array(48);
  const spark = new Float32Array(samples.length * 2);

  let sample = 0;

  return (time, frameMilliseconds) => {
    samples[sample++ % samples.length] = frameMilliseconds;

    // The average updates four times per second, not every frame
    if (time >= labels.nextFrame) {
      let total = 0;

      for (let i = 0; i < samples.length; i++) {
        total += samples[i];
      }

      labels.frame = `${(total / samples.length).toFixed(2)} ms`;
      labels.nextFrame = time + 250;
    }

    objective(overlay, time);
    playerCard(overlay, time, labels);
    radar(overlay, time);
    feed(overlay, time, killerWidths, rowWidths);
    crosshair(overlay, time);
    abilities(overlay, time, orb, labels);
    frameGraph(overlay, samples, sample, spark, labels.frame);
    toast(overlay, time);
  };
}

function crosshair(overlay: Overlay, time: number): void {
  const centerX = WIDTH / 2;
  const centerY = HEIGHT / 2;
  const spread = 7 + 5 * max(0, sin(time / 300)) ** 4;

  for (let pass = 0; pass < 2; pass++) {
    const style = pass === 0 ? CROSSHAIR_SHADOW : CROSSHAIR;

    overlay.line(centerX - spread - 9, centerY, centerX - spread, centerY, style);
    overlay.line(centerX + spread, centerY, centerX + spread + 9, centerY, style);
    overlay.line(centerX, centerY - spread - 9, centerX, centerY - spread, style);
    overlay.line(centerX, centerY + spread, centerX, centerY + spread + 9, style);
  }

  overlay.circle(centerX, centerY, 1.5, INK);

  // Hit marker: a brief coral X every few seconds
  const hit = (time % 2600) / 260;

  if (hit < 1) {
    overlay.save();
    overlay.globalAlpha = 1 - hit;
    overlay.translate(centerX, centerY);
    overlay.rotate(PI / 4);
    overlay.line(-18, 0, -10, 0, HIT);
    overlay.line(10, 0, 18, 0, HIT);
    overlay.line(0, -18, 0, -10, HIT);
    overlay.line(0, 10, 0, 18, HIT);
    overlay.restore();
  }
}

function feed(overlay: Overlay, time: number, killerWidths: number[], rowWidths: number[]): void {
  const age = (time % 2400) / 2400;
  const newest = floor(time / 2400);
  const right = WIDTH - 24;

  for (let row = 0; row < 4; row++) {
    const index = (newest - row + FEED_ROWS.length * 1_000) % FEED_ROWS.length;
    const { ally, killer, victim } = FEED_ROWS[index];
    const slide = row === 0 ? 1 - min(1, age * 6) : 0;
    const width = rowWidths[index];
    const x = right - width;
    const y = 264 + row * 32 - slide * 12;

    // The newest row slides in; older rows fade as they age
    overlay.save();
    overlay.globalAlpha = row === 0 ? 1 - slide : 1 - (row + age) * 0.22;
    overlay.rectangle(x, y, width, 26, FEED_ROW);
    overlay.text(killer, x + 14, y + 13, ally ? FEED_ALLY : FEED_ENEMY);
    overlay.translate(x + killerWidths[index] + 28, y + 13);
    overlay.polygon(ARROW, MUTED);
    overlay.text(victim, 14, 0, FEED);
    overlay.restore();
  }
}

function frameGraph(overlay: Overlay, samples: Float64Array, next: number, spark: Float32Array, label: string): void {
  const count = samples.length;
  const graphHeight = 40;
  const graphWidth = 240;
  const left = 24;
  const top = HEIGHT - 128;
  const graphLeft = left + 16;
  const graphTop = top + 48;

  let peak = 0.25;

  for (let i = 0; i < count; i++) {
    peak = max(peak, samples[i]);
  }

  // Oldest to newest, scaled into the graph
  for (let i = 0; i < count; i++) {
    const value = samples[(next + i) % count];

    spark[i * 2] = graphLeft + (i / (count - 1)) * graphWidth;
    spark[i * 2 + 1] = graphTop + graphHeight - (value / (peak * 1.15)) * graphHeight;
  }

  overlay.rectangle(left, top, 272, 104, PANEL);
  overlay.line(left + 14, top + 1, left + 258, top + 1, HIGHLIGHT_STYLE);
  overlay.text('FRAME TIME', graphLeft, top + 24, CAPTION);
  overlay.text('update()', left + 256, top + 24, SMALL);
  overlay.text(label, graphLeft + 96, top + 26, METRIC);

  // Smooth curve through midpoints, then down to the floor for the area fill
  overlay.beginPath();
  overlay.moveTo(spark[0], spark[1]);

  for (let i = 1; i < count - 1; i++) {
    overlay.quadraticCurveTo(spark[i * 2], spark[i * 2 + 1], (spark[i * 2] + spark[i * 2 + 2]) / 2, (spark[i * 2 + 1] + spark[i * 2 + 3]) / 2);
  }

  overlay.lineTo(spark[(count - 1) * 2], spark[(count - 1) * 2 + 1]);
  overlay.stroke(SPARK_LINE);
  overlay.lineTo(graphLeft + graphWidth, graphTop + graphHeight);
  overlay.lineTo(graphLeft, graphTop + graphHeight);
  overlay.closePath();
  overlay.fill(SPARK_FILL);
}

/** Mixes two 0xRRGGBBAA colors */
function mix(from: number, to: number, t: number): number {
  let color = 0;

  for (let shift = 0; shift < 32; shift += 8) {
    const a = (from >>> shift) & 0xff;
    const b = (to >>> shift) & 0xff;

    color |= (((a + (b - a) * t + 0.5) | 0) & 0xff) << shift;
  }

  return color >>> 0;
}

/** 3D objective: a spinning octahedron cage around a glowing core, labeled through project() */
function objective(overlay: Overlay, time: number): void {
  const angle = time / 1300;
  const centerX = -520;
  const centerY = -20;
  const centerZ = -560;
  const cosine = cos(angle);
  const sine = sin(angle);
  const size = 46 + 4 * sin(time / 500);

  overlay.setLineWidth(1.5);
  overlay.sphere(centerX, centerY, centerZ, 18, CORE);

  for (let edge = 0; edge < OCTAHEDRON_EDGES.length; edge += 2) {
    const from = OCTAHEDRON_EDGES[edge] * 3;
    const to = OCTAHEDRON_EDGES[edge + 1] * 3;

    overlay.line3D(
      centerX + (OCTAHEDRON[from] * cosine - OCTAHEDRON[from + 2] * sine) * size,
      centerY + OCTAHEDRON[from + 1] * size,
      centerZ + (OCTAHEDRON[from] * sine + OCTAHEDRON[from + 2] * cosine) * size,
      centerX + (OCTAHEDRON[to] * cosine - OCTAHEDRON[to + 2] * sine) * size,
      centerY + OCTAHEDRON[to + 1] * size,
      centerZ + (OCTAHEDRON[to] * sine + OCTAHEDRON[to + 2] * cosine) * size,
      AMBER,
    );
  }

  overlay.setLineWidth(1);

  // 2D label anchored to the 3D point above the cage
  const anchor = overlay.project(centerX, centerY + size + 18, centerZ);

  if (anchor !== null) {
    const { x, y } = anchor;

    overlay.line(x, y + 4, x, y + 16, TETHER);
    overlay.circle(x, y + 18, 2.5, AMBER);
    overlay.text('OBJECTIVE  ·  42 m', x, y - 4, LABEL);
  }
}

function playerCard(overlay: Overlay, time: number, labels: Labels): void {
  const health = 0.58 + 0.34 * sin(time / 1700);
  const left = 24;
  const shield = 0.5 + 0.5 * sin(time / 2300 + 1);
  const top = 24;
  const xp = 0.68 + 0.05 * sin(time / 900);

  overlay.rectangle(left, top, 336, 116, PANEL);
  overlay.line(left + 16, top + 1, left + 320, top + 1, HIGHLIGHT_STYLE);

  // Avatar with an XP ring
  overlay.circle(left + 56, top + 56, 32, AVATAR);
  overlay.arc(left + 56, top + 56, 39, 0, TAU, XP_TRACK);
  overlay.arc(left + 56, top + 56, 39, -PI / 2, -PI / 2 + xp * TAU, XP_RING);
  overlay.text('KS', left + 56, top + 57, INITIALS);
  overlay.rectangle(left + 36, top + 84, 40, 18, BADGE);
  overlay.text('LV 42', left + 56, top + 93, BADGE_TEXT);

  overlay.text('Kestrel_Seven', left + 108, top + 36, NAME);
  overlay.text('VANGUARD  ·  SQUAD ALPHA', left + 108, top + 54, CAPTION);

  // Segmented health: stepped mint to cyan, pulsing coral when low
  const barLeft = left + 108;
  const barTop = top + 68;
  const gap = 3;
  const low = health < 0.3;
  const segmentWidth = (212 - gap * 9) / 10;

  for (let segment = 0; segment < 10; segment++) {
    const fill = min(1, max(0, health * 10 - segment));
    const x = barLeft + segment * (segmentWidth + gap);

    overlay.rectangle(x, barTop, segmentWidth, 10, TRACK);

    if (fill > 0) {
      overlay.save();
      overlay.globalAlpha = low ? 0.7 + 0.3 * sin(time / 120) : 1;
      overlay.rectangle(x, barTop, segmentWidth * fill, 10, low ? HEALTH_LOW : HEALTH[segment]);
      overlay.restore();
    }
  }

  // Glint sweeping the filled part, clipped to it
  const sweep = (time % 2600) / 2600;

  if (!low && sweep < 0.6) {
    overlay.save();
    overlay.clip(barLeft, barTop, 212 * health, 10);
    overlay.rectangle(barLeft - 40 + (sweep / 0.6) * 260, barTop, 40, 10, GLINT_STYLE);
    overlay.restore();
  }

  overlay.rectangle(barLeft, barTop + 16, 212, 4, TRACK);
  overlay.rectangle(barLeft, barTop + 16, 212 * shield, 4, SHIELD_BAR);

  const points = floor(health * 200);

  if (points !== labels.lastHealth) {
    labels.health = `${points} / 200`;
    labels.lastHealth = points;
  }

  overlay.text(labels.health, barLeft + 212, barTop + 34, SMALL);
}

function radar(overlay: Overlay, time: number): void {
  const centerX = WIDTH - 128;
  const centerY = 128;
  const radius = 104;
  const sweep = (time / 900) % TAU;

  overlay.circle(centerX, centerY, radius, RADAR);
  overlay.circle(centerX, centerY, radius * 0.33, RADAR_RING);
  overlay.circle(centerX, centerY, radius * 0.66, RADAR_RING);
  overlay.line(centerX - radius, centerY, centerX + radius, centerY, 0xffffff12);
  overlay.line(centerX, centerY - radius, centerX, centerY + radius, 0xffffff12);

  for (let slice = 0; slice < SWEEP.length; slice++) {
    overlay.arc(centerX, centerY, radius - 1.5, sweep - (slice + 1) * 0.06, sweep - slice * 0.06, SWEEP[slice]);
  }

  overlay.line(centerX, centerY, centerX + cos(sweep) * (radius - 1.5), centerY + sin(sweep) * (radius - 1.5), SWEEP_EDGE);

  // Contacts brighten as the sweep passes, then fade
  for (let i = 0; i < BLIPS.length; i++) {
    const blip = BLIPS[i];
    const angle = blip.angle + blip.speed * (time / 1000);
    const behind = (((sweep - angle) % TAU) + TAU) % TAU;
    const x = centerX + cos(angle) * blip.distance * radius;
    const y = centerY + sin(angle) * blip.distance * radius;

    overlay.save();
    overlay.globalAlpha = max(0.2, 1 - behind / 4.5);

    if (blip.ally) {
      overlay.translate(x, y);
      overlay.rotate(angle + PI / 2);
      overlay.polygon(CHEVRON, BLIP_ALLY);
    } else {
      overlay.circle(x, y, 4, BLIP_ENEMY);
    }

    overlay.restore();
  }

  overlay.save();
  overlay.translate(centerX, centerY);
  overlay.polygon(PLAYER_ARROW, PLAYER);
  overlay.restore();

  overlay.text('E', centerX + radius - 13, centerY, CARDINAL);
  overlay.text('N', centerX, centerY - radius + 14, NORTH);
  overlay.text('S', centerX, centerY + radius - 13, CARDINAL);
  overlay.text('W', centerX - radius + 13, centerY, CARDINAL);
}

function toast(overlay: Overlay, time: number): void {
  const cycle = (time % 7000) / 1000;

  if (cycle > 3.4) {
    return;
  }

  // Ease out on the way in, ease in on the way out
  const enter = min(1, cycle / 0.45);
  const exit = min(1, max(0, (3.4 - cycle) / 0.45));
  const width = 360;
  const left = (WIDTH - width) / 2;
  const visible = min(1 - (1 - enter) ** 3, exit ** 2);
  const top = 20 - (1 - visible) * 24;

  overlay.save();
  overlay.globalAlpha = visible;
  overlay.rectangle(left, top, width, 56, TOAST_PANEL);
  overlay.circle(left + 30, top + 28, 14, BADGE);
  overlay.text('!', left + 30, top + 29, TOAST_ICON);
  overlay.text('Objective secured', left + 56, top + 25, TOAST_TEXT);
  overlay.text('Sector C  ·  +250 XP', left + 56, top + 42, CAPTION);
  overlay.restore();
}

if (import.meta.main) {
  const capturePath = Bun.env.CAPTURE_PNG ?? '';
  const duration = Number(Bun.env.DEMO_DURATION_MS ?? 0);

  // Headless: render offscreen up to CAPTURE_T seconds of animation (default 1.5), write the PNG, exit
  if (capturePath !== '') {
    const overlay = new Overlay({ height: HEIGHT, title: 'showcase capture', width: WIDTH, x: -32_000, y: -32_000 });
    const draw = createShowcase(overlay);
    const moment = Number(Bun.env.CAPTURE_T ?? 1.5) * 1000;

    let frameMilliseconds = 0;

    for (let time = 0; time <= moment; time += 12) {
      draw(time, frameMilliseconds);

      const before = performance.now();

      overlay.update();
      frameMilliseconds = performance.now() - before;
    }

    await Bun.write(capturePath, encodePNG(overlay.capture(), WIDTH, HEIGHT));
    overlay.close();
    console.log(`Wrote ${capturePath}`);
    process.exit(0);
  }

  const overlay = new Overlay({ height: HEIGHT, title: 'bun-overlay showcase', width: WIDTH });
  const draw = createShowcase(overlay);
  const start = performance.now();

  let frameMilliseconds = 0;

  const stop = () => {
    clearInterval(timer);
    overlay.close();
    process.exit(0);
  };

  const timer = setInterval(() => {
    const time = performance.now() - start;

    if (duration > 0 && time >= duration) {
      stop();
    }

    draw(time, frameMilliseconds);

    const before = performance.now();

    overlay.update();
    frameMilliseconds = performance.now() - before;
  }, 1000 / 144);

  console.log('Showcase running - Ctrl+C to exit');
  process.on('SIGINT', stop);
}
