// The view: everything the overlay is while it is open — its state, its choreography, its layout,
// how it answers keys and the mouse, and the words it draws. It speaks to the world only through
// ViewHost (seek, export, close…) and is driven by a clock, so the same view runs live on the
// desktop and frame-by-frame on a virtual clock in headless mode.

import type { Color, Painter } from '../shared/painter';
import type { DisplayInfo, Gap, MemoryStats, TileRegion, TimelineSlice } from '../shared/protocol';
import { copy, formatBytes, formatSpan } from './copy';
import { layout, palette, radius, shadow, shimmer, space, type } from './design';
import { EditableText, parseGoTo } from './goto';
import { History } from './history';
import type { Mark, Renderer, Scene } from './renderer';
import { Characters, Spring } from './spring';
import { ageOfPosition, binActivity, formatAge, formatClock, positionOfAge, ticks } from './timeline';
import type { InputEvent } from './window';

const keys = {
  a: 0x41,
  backspace: 0x08,
  c: 0x43,
  delete: 0x2e,
  down: 0x28,
  end: 0x23,
  enter: 0x0d,
  escape: 0x1b,
  home: 0x24,
  left: 0x25,
  p: 0x50,
  pageDown: 0x22,
  pageUp: 0x21,
  right: 0x27,
  s: 0x53,
  space: 0x20,
  up: 0x26,
  v: 0x56,
} as const;
const forgetWindow = 3_000;
const toastDuration = 1_600;
const wheelStep = 0.04;

export interface ViewHost {
  clipboardText(): string;
  closed(): void;
  export(frame: number, region: TileRegion | null, target: 'clipboard' | 'png'): void;
  forget(): void;
  regionStep(frame: number, direction: -1 | 1, region: TileRegion): void;
  seek(frame: number): void;
  togglePause(): void;
}

/** Live numbers for the Under the hood panel, owned by the host. */
export interface Diagnostics {
  bootMilliseconds: number;
  composeMilliseconds: number;
  frameMedian: number;
  frameWorst: number;
  openMilliseconds: number;
  refreshHertz: number;
  stats: MemoryStats | null;
}

interface Rectangle {
  bottom: number;
  left: number;
  right: number;
  top: number;
}

/** Where everything is at one instant (pixels). */
interface Geometry {
  card: Rectangle;
  lift: number;
  shelf: Rectangle;
  shelfOpacity: number;
  track: Rectangle;
}

export class View {
  readonly display: DisplayInfo;
  #backdrop: Spring;
  #closeRequested = false;
  #detailsOpen = false;
  readonly #details: Spring;
  readonly #diagnostics: Diagnostics;
  #drag: { kind: 'card' | 'track'; startX: number; startY: number; x: number; y: number } | null = null;
  #epochNow: () => number;
  #followLive = true;
  #forgetArmedAt = -Infinity;
  #frame = -1;
  readonly #goTo = new EditableText();
  #goToError = false;
  #goToOpen = false;
  readonly #goToSpring: Spring;
  readonly #history: History;
  readonly #host: ViewHost;
  #hoverX: number | null = null;
  readonly #hover: Spring;
  readonly #inspect: Spring;
  #lastBinsAt = -Infinity;
  #lastMarksVersion = '';
  readonly #lift: Spring;
  readonly #pill: Spring;
  readonly #playhead: Spring;
  #recording: 'paused' | 'recording' | 'unavailable' = 'recording';
  #region: TileRegion | null = null;
  readonly #regionEdges: [Spring, Spring, Spring, Spring];
  readonly #regionOpacity: Spring;
  readonly #renderer: Renderer;
  #repeats = 0;
  readonly #scale: number;
  readonly #shelf: Spring;
  #shimmerStart = -Infinity;
  #shownFrame = -1;
  readonly #tint: Spring;
  #toast: { at: number; text: string } | null = null;

  constructor(host: ViewHost, renderer: Renderer, display: DisplayInfo, scale: number, diagnostics: Diagnostics, epochNow: () => number, now: number) {
    this.#host = host;
    this.#renderer = renderer;
    this.display = display;
    this.#scale = scale;
    this.#diagnostics = diagnostics;
    this.#epochNow = epochNow;
    this.#history = new History(display.tilesAcross * display.tilesDown);
    this.#lift = new Spring(Characters.exhale, 0, now);
    this.#backdrop = new Spring(Characters.exhale, 0, now);
    this.#shelf = new Spring(Characters.rise, 0, now);
    this.#pill = new Spring(Characters.rise, 0, now);
    this.#inspect = new Spring(Characters.exhale, 0, now);
    this.#playhead = new Spring(Characters.glide, 0, now);
    this.#hover = new Spring(Characters.breath, 0, now);
    this.#tint = new Spring(Characters.fade, 0, now);
    this.#regionOpacity = new Spring(Characters.fade, 0, now);
    this.#regionEdges = [new Spring(Characters.glide, 0, now), new Spring(Characters.glide, 0, now), new Spring(Characters.glide, 0, now), new Spring(Characters.glide, 0, now)];
    this.#details = new Spring(Characters.fade, 0, now);
    this.#goToSpring = new Spring(Characters.rise, 0, now);
  }

  /** On the way out (until the exit finishes or the hotkey turns it around). */
  get closing(): boolean {
    return this.#closeRequested;
  }

  /** The frame the user has asked for (the keyboard owns this). */
  get frame(): number {
    return this.#frame;
  }

  get history(): History {
    return this.#history;
  }

  /** True once the exit choreography has finished and the window may disappear. */
  finished(now: number): boolean {
    return this.#closeRequested && this.#lift.target === 0 && this.#lift.settled(now, 0.001) && this.#backdrop.settled(now, 0.001);
  }

  appended(slice: TimelineSlice): void {
    this.#history.append(slice);
    if (this.#followLive && !this.#closeRequested) this.#seek(this.#history.lastFrame);
  }

  /** Frame 0: the screen exactly as it was. Then it exhales. */
  begin(frame: number, slice: TimelineSlice, now: number): void {
    this.#history.replace(slice);
    this.#frame = frame;
    this.#shownFrame = frame;
    this.#followLive = true;
    this.#closeRequested = false;
    this.#playhead.set(0, now);
    for (const spring of [this.#lift, this.#backdrop, this.#shelf, this.#pill, this.#inspect, this.#tint]) spring.set(0, now);
    this.#renderer.prepare(this.display.tilesAcross, this.display.tilesDown, this.#binCount());
    this.#lastBinsAt = -Infinity;
  }

  /** Called right after frame 0 is on screen. */
  exhale(now: number): void {
    this.#lift.retarget(1, now);
    this.#backdrop.retarget(1, now);
    this.#shelf.retarget(1, now + 60);
    this.#pill.retarget(1, now + 90);
  }

  /** Is anything still moving (or about to)? Idle frames are skipped entirely. */
  animating(now: number): boolean {
    const springs = [this.#lift, this.#backdrop, this.#shelf, this.#pill, this.#inspect, this.#playhead, this.#hover, this.#tint, this.#regionOpacity, this.#details, this.#goToSpring, ...this.#regionEdges];
    if (springs.some((spring) => !spring.settled(now, 0.000_2))) return true;
    if (now - this.#shimmerStart < shimmer.duration) return true;
    if (this.#toast !== null && now - this.#toast.at < toastDuration + 400) return true;
    return this.#closeRequested;
  }

  /** Begin the exit: return to now first if in the past, then breathe back in. */
  close(now: number): void {
    if (this.#closeRequested) return;
    this.#closeRequested = true;
    this.#goToOpen = false;
    this.#goToSpring.retarget(0, now);
    this.#details.retarget(0, now);
    this.#drag = null;
    this.#followLive = true;
    if (this.#history.count === 0 || (this.#frame === this.#history.lastFrame && this.#shownFrame === this.#frame)) this.#breatheIn(now);
    else this.#seek(this.#history.lastFrame);
  }

  /** Hotkey pressed while closing: turn around from wherever we are. */
  reopen(now: number): void {
    if (!this.#closeRequested) return;
    this.#closeRequested = false;
    this.exhale(now);
  }

  handle(events: readonly InputEvent[], now: number): void {
    for (const event of events) {
      switch (event.type) {
        case 'button':
          this.#button(event.button, event.down, event.double, event.x, event.y, now);
          break;
        case 'character':
          this.#character(event.text, now);
          break;
        case 'deactivated':
          this.close(now);
          break;
        case 'key':
          if (event.down) this.#key(event.key, event.control, event.shift, event.repeat, now);
          else this.#repeats = 0;
          break;
        case 'pointer':
          this.#pointer(event.x, event.y, now);
          break;
        case 'wheel':
          if (!this.#closeRequested) this.#movePosition((event.horizontal ? event.delta : -event.delta) * wheelStep, now);
          break;
      }
    }
  }

  /** The worker composed `frame` and the eye now shows it. */
  shown(frame: number, changedTiles: Uint32Array, now: number): void {
    this.#shownFrame = frame;
    const tiles = this.display.tilesAcross * this.display.tilesDown;
    if (!this.#followLive && changedTiles.length > 0 && changedTiles.length <= tiles * shimmer.maximumShare) {
      const mask = new Uint8Array(tiles);
      for (const tile of changedTiles) mask[tile] = 255;
      this.#renderer.setShimmer(mask, this.display.tilesAcross, this.display.tilesDown);
      this.#shimmerStart = now;
    }
    if (this.#closeRequested && frame === this.#history.lastFrame) this.#breatheIn(now);
  }

  recording(state: 'paused' | 'recording' | 'unavailable'): void {
    this.#recording = state;
  }

  /** The worker answered a region step. */
  stepped(frame: number): void {
    this.#followLive = frame >= this.#history.lastFrame;
    this.#seek(frame);
  }

  toast(text: string, now: number): void {
    this.#toast = { at: now, text };
  }

  /** Upload what the scene samples (bins, marks) when it has changed, and build the scene. */
  scene(now: number): Scene {
    const scale = this.#scale;
    const { height, width } = this.display;
    const geometry = this.#geometry(now);
    const span = this.#span();
    const age = this.#epochNow() - this.#history.epoch(this.#frame);
    this.#playhead.retarget(positionOfAge(Math.max(0, age), span), now);
    const live = this.#isLive();
    this.#tint.retarget(live ? 0 : 1, now);
    if (now - this.#lastBinsAt > 500) {
      const bins = new Float32Array(this.#binCount());
      binActivity(this.#history.epochs, this.#history.changedCounts, this.#history.count, this.#epochNow(), span, this.display.tilesAcross * this.display.tilesDown, bins);
      this.#renderer.setBins(bins);
      this.#lastBinsAt = now;
    }
    this.#uploadMarks(geometry.track, span);
    const playheadX = geometry.track.right - this.#playhead.value(now) * (geometry.track.right - geometry.track.left);
    const [cursorX, cursorY] = this.#history.count > 0 ? this.#history.cursor(this.#shownFrame) : [-1, -1];
    const regionValues = this.#regionEdges.map((edge) => edge.value(now));
    const shimmerIntensity = Math.max(0, 1 - (now - this.#shimmerStart) / shimmer.duration) ** 2;
    return {
      accent: [...palette.accent],
      accentGlow: [...palette.accentGlow],
      card: [geometry.card.left, geometry.card.top, geometry.card.right, geometry.card.bottom],
      cardStyle: [radius.card * scale * geometry.lift, geometry.lift, this.#tint.value(now) * (this.#closeRequested ? 0 : 1), Math.max(0, this.#backdrop.value(now))],
      counts: [this.#binCount(), this.#renderer.markCount, 3 * scale, 0],
      cursor: [cursorX, cursorY, cursorX >= 0 && !live ? this.#tint.value(now) * 0.9 : 0, 9 * scale],
      glass: [...palette.glass],
      ink: [...palette.ink],
      moment: [width, height, this.display.tilesAcross, this.display.tilesDown],
      now: [...palette.now],
      playhead: [playheadX, this.#hoverX ?? -1000, this.#hover.value(now), geometry.shelfOpacity],
      region: [regionValues[0]!, regionValues[1]!, regionValues[2]!, regionValues[3]!],
      regionStyle: [Math.max(0, this.#regionOpacity.value(now)), 0, 0, 0],
      shadowStyle: [shadow.ambientBlur * scale, shadow.ambientOpacity, shadow.keyBlur * scale, shadow.keyOffset * scale],
      shelf: [geometry.shelf.left, geometry.shelf.top, geometry.shelf.right, geometry.shelf.bottom],
      shelfStyle: [radius.shelf * scale, geometry.shelfOpacity, live ? 1 : 0, 0],
      shimmer: [shimmerIntensity, shimmer.opacity, 0, 0],
      tertiary: [...palette.textTertiary],
      track: [geometry.track.left, geometry.track.top, geometry.track.right, geometry.track.bottom],
      viewport: [width, height, scale, 0],
    };
  }

  /** Words, in DIPs, on top of the scene. */
  text(painter: Painter, now: number): void {
    const scale = this.#scale;
    const geometry = this.#geometry(now);
    const shelfOpacity = geometry.shelfOpacity;
    const toDip = (pixels: number): number => pixels / scale;
    const shelfLeft = toDip(geometry.shelf.left);
    const shelfRight = toDip(geometry.shelf.right);
    const shelfTop = toDip(geometry.shelf.top);
    const trackLeft = toDip(geometry.track.left);
    const trackRight = toDip(geometry.track.right);
    const trackTop = toDip(geometry.track.top);
    const trackBottom = toDip(geometry.track.bottom);
    const fade = (color: Color, opacity: number): Color => [color[0], color[1], color[2], color[3] * opacity];
    const live = this.#isLive();
    const span = this.#span();

    if (shelfOpacity > 0.01) {
      painter.text(this.#statusText(), type.caption, shelfLeft + layout.trackInset, shelfTop + space(4), trackRight - trackLeft, space(5), fade(palette.textTertiary, shelfOpacity));
      painter.text(
        this.#rightStatus(),
        { ...type.caption, align: 'end' },
        shelfLeft,
        shelfTop + space(4),
        shelfRight - shelfLeft - layout.trackInset,
        space(5),
        fade(this.#recording === 'recording' ? palette.textSecondary : palette.accent, shelfOpacity),
      );
      if (this.#history.count < 2) {
        painter.text(copy.empty, { ...type.body, align: 'center' }, trackLeft, trackTop + space(2), trackRight - trackLeft, space(6), fade(palette.textSecondary, shelfOpacity));
        painter.text(copy.emptyDetail, { ...type.caption, align: 'center' }, trackLeft, trackTop + space(8), trackRight - trackLeft, space(5), fade(palette.textTertiary, shelfOpacity));
      } else {
        let lastRight = -Infinity;
        const rightLabel = copy.live;
        const [rightWidth] = painter.measure(rightLabel, type.caption);
        for (const tick of ticks(span)) {
          const x = trackRight - positionOfAge(tick.age, span) * (trackRight - trackLeft);
          const [labelWidth] = painter.measure(tick.label, type.caption);
          if (x - labelWidth / 2 < lastRight + space(3) || x + labelWidth / 2 > trackRight - rightWidth - space(3) || x - labelWidth / 2 < trackLeft) continue;
          painter.text(tick.label, { ...type.caption, align: 'center' }, x - labelWidth, trackBottom + space(1), labelWidth * 2, space(5), fade(palette.textTertiary, shelfOpacity));
          lastRight = x + labelWidth / 2;
        }
        painter.text(rightLabel, { ...type.caption, align: 'end' }, trackRight - rightWidth - space(4), trackBottom + space(1), rightWidth + space(4), space(5), fade(live ? palette.now : palette.textTertiary, shelfOpacity));
        if (this.#hoverX !== null && this.#hover.value(now) > 0.01) {
          const hoverDip = toDip(this.#hoverX);
          const hoverAge = ageOfPosition((trackRight - hoverDip) / (trackRight - trackLeft), span);
          const label = formatAge(hoverAge);
          const [labelWidth] = painter.measure(label, type.caption);
          painter.text(label, { ...type.caption, align: 'center' }, hoverDip - labelWidth, trackTop - space(5), labelWidth * 2, space(4), fade(palette.textSecondary, this.#hover.value(now) * shelfOpacity));
        }
      }
      const pill = Math.max(0, Math.min(1.2, this.#pill.value(now)));
      const playheadX = (geometry.track.right - this.#playhead.value(now) * (geometry.track.right - geometry.track.left)) / scale;
      const pillTop = geometry.shelf.top / scale - layout.shelfGap / 2 - 20 + (1 - pill) * space(3);
      this.#drawPill(painter, playheadX, shelfLeft, shelfRight, pillTop, Math.min(1, pill) * shelfOpacity);
    }
    const inspect = this.#inspect.value(now);
    if (inspect > 0.01) {
      const screenWidth = this.display.width / scale;
      this.#drawPill(painter, screenWidth / 2, 0, screenWidth, layout.topMargin - (1 - inspect) * space(3), Math.min(1, inspect) * Math.min(1, Math.max(0, this.#pill.value(now))));
    }
    this.#drawGoTo(painter, now);
    this.#drawDetails(painter, now);
    this.#drawToast(painter, now, geometry);
  }

  /** The exit: everything returns to exactly where the screen is. */
  #breatheIn(now: number): void {
    this.#lift.retarget(0, now);
    this.#backdrop.retarget(0, now);
    this.#shelf.retarget(0, now);
    this.#pill.retarget(0, now);
    this.#inspect.retarget(0, now);
    this.#regionOpacity.retarget(0, now);
  }

  #binCount(): number {
    const geometry = this.#layout();
    return Math.max(8, Math.floor((geometry.track.right - geometry.track.left) / (3 * this.#scale)));
  }

  #button(button: 'left' | 'right', down: boolean, double: boolean, x: number, y: number, now: number): void {
    if (this.#closeRequested || button !== 'left') return;
    const geometry = this.#geometry(now);
    if (down) {
      if (double && this.#inside(geometry.card, x, y)) {
        this.#toggleInspect(now);
        return;
      }
      if (this.#inside(geometry.shelf, x, y)) {
        this.#drag = { kind: 'track', startX: x, startY: y, x, y };
        this.#scrubTo(x, now);
      } else if (this.#inside(geometry.card, x, y)) this.#drag = { kind: 'card', startX: x, startY: y, x, y };
      return;
    }
    const drag = this.#drag;
    this.#drag = null;
    if (drag === null || drag.kind !== 'card') return;
    if (Math.hypot(x - drag.startX, y - drag.startY) < 6 * this.#scale) {
      if (this.#region !== null) this.#clearRegion(now);
      return;
    }
    const [startX, startY] = this.#toMoment(drag.startX, drag.startY, geometry.card);
    const [endX, endY] = this.#toMoment(x, y, geometry.card);
    const region: TileRegion = {
      bottom: Math.min(this.display.tilesDown, Math.ceil(Math.max(startY, endY) / 64)),
      left: Math.max(0, Math.floor(Math.min(startX, endX) / 64)),
      right: Math.min(this.display.tilesAcross, Math.ceil(Math.max(startX, endX) / 64)),
      top: Math.max(0, Math.floor(Math.min(startY, endY) / 64)),
    };
    this.#region = region;
    const snapped = [region.left * 64, region.top * 64, Math.min(this.display.width, region.right * 64), Math.min(this.display.height, region.bottom * 64)];
    this.#regionEdges.forEach((edge, index) => edge.retarget(snapped[index]!, now));
  }

  #character(text: string, now: number): void {
    if (this.#closeRequested || text < ' ') return;
    if (this.#goToOpen) {
      this.#goTo.insert(text);
      this.#goToError = false;
      return;
    }
    if (text === '?') {
      this.#detailsOpen = !this.#detailsOpen;
      this.#details.retarget(this.#detailsOpen ? 1 : 0, now);
      return;
    }
    if (/[0-9:]/.test(text)) {
      this.#goToOpen = true;
      this.#goTo.clear();
      this.#goTo.insert(text);
      this.#goToError = false;
      this.#goToSpring.retarget(1, now);
    }
  }

  #clearRegion(now: number): void {
    this.#region = null;
    this.#regionOpacity.retarget(0, now);
  }

  #drawDetails(painter: Painter, now: number): void {
    const opacity = this.#details.value(now);
    if (opacity < 0.01) return;
    const diagnostics = this.#diagnostics;
    const stats = diagnostics.stats;
    const span = this.#history.count > 0 ? this.#epochNow() - this.#history.epoch(this.#history.firstFrame) : 0;
    const lines: [string, string][] = [
      ['recording', stats === null ? '—' : `${stats.captureHertz.toFixed(0)} Hz · fingerprint ${stats.fingerprintMilliseconds.toFixed(2)} ms · cpu ${stats.cpuPercent.toFixed(1)} %`],
      ['memory', stats === null ? '—' : `${formatBytes(stats.storedBytes)} of ${formatBytes(stats.budgetBytes)} · ${formatSpan(span)} · ${this.#history.count.toLocaleString()} frames`],
      ['tiles', stats === null ? '—' : `${stats.uniqueTiles.toLocaleString()} unique · ${stats.dedupPercent.toFixed(0)} % repeats · zstd ${stats.compressionRatio.toFixed(1)}× · ${stats.reducedPercent.toFixed(0)} % reduced`],
      ['this view', `worst ${diagnostics.frameWorst.toFixed(1)} ms · median ${diagnostics.frameMedian.toFixed(1)} ms · ${diagnostics.refreshHertz.toFixed(0)} Hz`],
      ['moments', `compose ${diagnostics.composeMilliseconds.toFixed(1)} ms · open ${diagnostics.openMilliseconds.toFixed(0)} ms · boot ${diagnostics.bootMilliseconds.toFixed(0)} ms`],
    ];
    const width = 520;
    const lineHeight = space(5);
    const height = space(12) + lines.length * lineHeight;
    const left = this.display.width / this.#scale - width - layout.topMargin;
    const top = layout.topMargin + space(2) * (1 - opacity);
    painter.fillRoundedRectangle(left, top, width, height, radius.shelf, [palette.glass[0], palette.glass[1], palette.glass[2], 0.92 * opacity]);
    painter.strokeRoundedRectangle(left + 0.5, top + 0.5, width - 1, height - 1, radius.shelf, 1 / this.#scale, [1, 1, 1, 0.08 * opacity]);
    painter.text(copy.underTheHood, type.title, left + space(5), top + space(4), width, space(6), [palette.textPrimary[0], palette.textPrimary[1], palette.textPrimary[2], opacity]);
    lines.forEach(([label, value], index) => {
      const y = top + space(11) + index * lineHeight;
      painter.text(label, type.mono, left + space(5), y, 100, lineHeight, [palette.textTertiary[0], palette.textTertiary[1], palette.textTertiary[2], opacity]);
      painter.text(value, type.mono, left + space(5) + 96, y, width - 120, lineHeight, [palette.textSecondary[0], palette.textSecondary[1], palette.textSecondary[2], opacity]);
    });
  }

  #drawGoTo(painter: Painter, now: number): void {
    const opacity = Math.max(0, Math.min(1, this.#goToSpring.value(now)));
    if (opacity < 0.01) return;
    const width = 420;
    const height = 112;
    const left = (this.display.width / this.#scale - width) / 2;
    const top = this.display.height / this.#scale / 2 - height / 2 + space(4) * (1 - opacity);
    painter.fillRoundedRectangle(left, top, width, height, radius.shelf, [palette.glass[0], palette.glass[1], palette.glass[2], 0.97 * opacity]);
    painter.strokeRoundedRectangle(left + 0.5, top + 0.5, width - 1, height - 1, radius.shelf, 1 / this.#scale, [1, 1, 1, 0.1 * opacity]);
    painter.text(copy.goTo, type.caption, left + space(5), top + space(4), width, space(4), [palette.textTertiary[0], palette.textTertiary[1], palette.textTertiary[2], opacity]);
    const field = this.#goTo;
    const [selectionStart, selectionEnd] = field.selection;
    const before = field.text.slice(0, selectionStart);
    const [beforeWidth] = painter.measure(before, type.display);
    const [selectedWidth] = painter.measure(field.text.slice(selectionStart, selectionEnd), type.display);
    const textLeft = left + space(5);
    const textTop = top + space(9);
    if (selectionEnd > selectionStart) painter.fillRectangle(textLeft + beforeWidth, textTop + 2, selectedWidth, 32, [palette.accent[0], palette.accent[1], palette.accent[2], 0.35 * opacity]);
    painter.text(field.text, type.display, textLeft, textTop, width - space(10), 36, [palette.textPrimary[0], palette.textPrimary[1], palette.textPrimary[2], opacity]);
    const [caretOffset] = painter.measure(field.text.slice(0, field.caret), type.display);
    const caretVisible = Math.floor(now / 530) % 2 === 0;
    if (caretVisible) painter.fillRectangle(textLeft + caretOffset + 1, textTop + 4, 2 / this.#scale + 1, 28, [palette.accent[0], palette.accent[1], palette.accent[2], opacity]);
    painter.text(
      this.#goToError ? copy.goToUnknown : copy.goToHint,
      type.caption,
      left + space(5),
      top + height - space(7),
      width,
      space(4),
      this.#goToError ? [palette.accent[0], palette.accent[1], palette.accent[2], opacity] : [palette.textTertiary[0], palette.textTertiary[1], palette.textTertiary[2], opacity],
    );
  }

  /** The time pill, centred on `anchor` (DIPs) within [minimum, maximum]: above the shelf at the playhead, or top-centre at full size. */
  #drawPill(painter: Painter, anchor: number, minimum: number, maximum: number, top: number, opacity: number): void {
    if (opacity < 0.01) return;
    const scale = this.#scale;
    const live = this.#isLive();
    const age = Math.max(0, this.#epochNow() - this.#history.epoch(this.#frame));
    const title = live ? copy.live : formatAge(age);
    const clock = live ? '' : formatClock(this.#history.epoch(this.#frame));
    const [titleWidth] = painter.measure(title, type.title);
    const [clockWidth] = clock === '' ? [0] : painter.measure(clock, type.caption);
    const height = 40;
    const gap = clock === '' ? 0 : space(2);
    const dot = live ? space(4) : 0;
    const width = space(5) * 2 + titleWidth + gap + clockWidth + dot;
    const left = Math.min(maximum - width, Math.max(minimum, anchor - width / 2));
    painter.fillRoundedRectangle(left, top, width, height, height / 2, [palette.glass[0], palette.glass[1], palette.glass[2], 0.92 * opacity]);
    painter.strokeRoundedRectangle(left + 0.5, top + 0.5, width - 1, height - 1, height / 2, 1 / scale, [1, 1, 1, 0.09 * opacity]);
    let x = left + space(5);
    if (live) {
      painter.fillEllipse(x + 4, top + height / 2, 4, 4, [palette.now[0], palette.now[1], palette.now[2], opacity]);
      x += dot;
    }
    painter.text(title, type.title, x, top, titleWidth + 4, height, [palette.textPrimary[0], palette.textPrimary[1], palette.textPrimary[2], opacity]);
    if (clock !== '') painter.text(clock, type.caption, x + titleWidth + gap, top + 1, clockWidth + 4, height, [palette.textSecondary[0], palette.textSecondary[1], palette.textSecondary[2], opacity]);
  }

  #drawToast(painter: Painter, now: number, geometry: Geometry): void {
    if (this.#toast === null) return;
    const elapsed = now - this.#toast.at;
    if (elapsed > toastDuration + 400) {
      this.#toast = null;
      return;
    }
    const opacity = Math.min(1, elapsed / 120) * Math.min(1, Math.max(0, (toastDuration + 400 - elapsed) / 400));
    const [textWidth] = painter.measure(this.#toast.text, type.body);
    const width = textWidth + space(10);
    const height = 36;
    const left = (this.display.width / this.#scale - width) / 2;
    const top = geometry.card.top / this.#scale + space(6) - (1 - opacity) * space(2);
    painter.fillRoundedRectangle(left, top, width, height, height / 2, [palette.glass[0], palette.glass[1], palette.glass[2], 0.94 * opacity]);
    painter.text(this.#toast.text, { ...type.body, align: 'center' }, left, top, width, height, [palette.textPrimary[0], palette.textPrimary[1], palette.textPrimary[2], opacity]);
  }

  /** Where everything is right now (pixels), blending the springs into the layout. */
  #geometry(now: number): Geometry {
    const target = this.#layout();
    const inspect = this.#inspect.value(now);
    const lift = Math.max(0, this.#lift.value(now)) * (1 - inspect);
    const { height, width } = this.display;
    const card = {
      bottom: height + (target.card.bottom - height) * lift,
      left: target.card.left * lift,
      right: width + (target.card.right - width) * lift,
      top: target.card.top * lift,
    };
    const shelfVisibility = Math.max(0, Math.min(1.05, this.#shelf.value(now))) * (1 - inspect);
    const drop = (1 - Math.min(1, shelfVisibility)) * (layout.shelfHeight + layout.shelfMargin) * this.#scale * 0.5;
    const shelf = { bottom: target.shelf.bottom + drop, left: target.shelf.left, right: target.shelf.right, top: target.shelf.top + drop };
    const track = { bottom: target.track.bottom + drop, left: target.track.left, right: target.track.right, top: target.track.top + drop };
    return { card, lift, shelf, shelfOpacity: Math.max(0, Math.min(1, shelfVisibility)), track };
  }

  #inside(rectangle: Rectangle, x: number, y: number): boolean {
    return x >= rectangle.left && x <= rectangle.right && y >= rectangle.top && y <= rectangle.bottom;
  }

  #isLive(): boolean {
    return this.#history.count === 0 || this.#frame >= this.#history.lastFrame;
  }

  #key(key: number, control: boolean, shift: boolean, repeat: boolean, now: number): void {
    if (this.#closeRequested) return;
    this.#repeats = repeat ? this.#repeats + 1 : 0;
    if (this.#goToOpen) {
      this.#goToKey(key, control, shift, now);
      return;
    }
    switch (key) {
      case keys.escape:
        if (this.#region !== null) this.#clearRegion(now);
        else if (this.#detailsOpen) {
          this.#detailsOpen = false;
          this.#details.retarget(0, now);
        } else this.close(now);
        return;
      case keys.left:
      case keys.right: {
        const direction = key === keys.left ? -1 : 1;
        if (control) this.#seekEpoch(this.#history.epoch(this.#frame) + direction * 60_000);
        else if (shift) this.#stepMoment(direction);
        else if (this.#region !== null) this.#host.regionStep(this.#frame, direction, this.#region);
        else this.#stepFrames(direction * Math.min(64, 1 << Math.floor(this.#repeats / 10)));
        return;
      }
      case keys.up:
      case keys.down:
        this.#stepMoment(key === keys.up ? -1 : 1);
        return;
      case keys.home:
        this.#followLive = false;
        this.#seek(this.#history.firstFrame);
        return;
      case keys.end:
        this.#followLive = true;
        this.#seek(this.#history.lastFrame);
        return;
      case keys.pageUp:
      case keys.pageDown:
        this.#movePosition(key === keys.pageUp ? 0.1 : -0.1, now);
        return;
      case keys.space:
        this.#toggleInspect(now);
        return;
      case keys.enter:
        this.#host.export(this.#frame, this.#region, 'clipboard');
        this.close(now);
        return;
      case keys.c:
        if (control) this.#host.export(this.#frame, this.#region, 'clipboard');
        return;
      case keys.s:
        if (control) this.#host.export(this.#frame, this.#region, 'png');
        return;
      case keys.p:
        if (control) this.#host.togglePause();
        return;
      case keys.delete:
        if (!control) return;
        if (now - this.#forgetArmedAt < forgetWindow) {
          this.#forgetArmedAt = -Infinity;
          this.#host.forget();
        } else {
          this.#forgetArmedAt = now;
          this.toast(copy.forgetArmed, now);
        }
        return;
    }
  }

  #goToKey(key: number, control: boolean, shift: boolean, now: number): void {
    const field = this.#goTo;
    switch (key) {
      case keys.escape:
        this.#goToOpen = false;
        this.#goToSpring.retarget(0, now);
        return;
      case keys.enter: {
        const epoch = parseGoTo(field.text, this.#epochNow());
        if (epoch === null) {
          this.#goToError = true;
          return;
        }
        this.#goToOpen = false;
        this.#goToSpring.retarget(0, now);
        this.#seekEpoch(epoch);
        return;
      }
      case keys.backspace:
        field.backspace(control);
        return;
      case keys.delete:
        field.deleteForward();
        return;
      case keys.left:
      case keys.right:
        field.moveCaret(key === keys.left ? -1 : 1, shift);
        return;
      case keys.home:
        field.home(shift);
        return;
      case keys.end:
        field.end(shift);
        return;
      case keys.a:
        if (control) field.selectAll();
        return;
      case keys.v:
        if (control) field.paste(this.#host.clipboardText());
        return;
    }
  }

  /** The layout the springs move toward (pixels). */
  #layout(): { card: Rectangle; shelf: Rectangle; track: Rectangle } {
    const scale = this.#scale;
    const { height, width } = this.display;
    const top = layout.topMargin * scale;
    const shelfHeight = layout.shelfHeight * scale;
    const margin = layout.shelfMargin * scale;
    const gap = layout.shelfGap * scale;
    const cardScale = Math.min(layout.maximumCardScale, (height - top - gap - shelfHeight - margin) / height);
    const cardWidth = width * cardScale;
    const cardHeight = height * cardScale;
    const availableBottom = height - margin - shelfHeight - gap;
    const cardTop = top + (availableBottom - top - cardHeight) / 2;
    const cardLeft = (width - cardWidth) / 2;
    const shelfWidth = Math.min(cardWidth, 1_800 * scale);
    const shelfLeft = (width - shelfWidth) / 2;
    const shelfTop = height - margin - shelfHeight;
    const inset = layout.trackInset * scale;
    const trackTop = shelfTop + space(11) * scale;
    return {
      card: { bottom: cardTop + cardHeight, left: cardLeft, right: cardLeft + cardWidth, top: cardTop },
      shelf: { bottom: shelfTop + shelfHeight, left: shelfLeft, right: shelfLeft + shelfWidth, top: shelfTop },
      track: { bottom: trackTop + layout.trackHeight * scale, left: shelfLeft + inset, right: shelfLeft + shelfWidth - inset, top: trackTop },
    };
  }

  /** Move the playhead along the (logarithmic) axis by `delta` of the track's width. */
  #movePosition(delta: number, now: number): void {
    if (this.#history.count === 0) return;
    const span = this.#span();
    const position = Math.min(1, Math.max(0, this.#playhead.target + delta));
    const epoch = this.#epochNow() - ageOfPosition(position, span);
    this.#followLive = position <= 0;
    this.#seek(position <= 0 ? this.#history.lastFrame : this.#history.frameAt(epoch));
    this.#playhead.retarget(position, now);
  }

  #pointer(x: number, y: number, now: number): void {
    const geometry = this.#geometry(now);
    const overTrack = x >= geometry.track.left && x <= geometry.track.right && y >= geometry.shelf.top && y <= geometry.shelf.bottom;
    this.#hoverX = overTrack ? x : this.#hoverX;
    this.#hover.retarget(overTrack && this.#drag?.kind !== 'card' ? 1 : 0, now);
    const drag = this.#drag;
    if (drag === null) return;
    drag.x = x;
    drag.y = y;
    if (drag.kind === 'track') {
      this.#scrubTo(x, now);
      return;
    }
    const [startX, startY] = this.#toMoment(drag.startX, drag.startY, geometry.card);
    const [endX, endY] = this.#toMoment(x, y, geometry.card);
    const edges = [Math.min(startX, endX), Math.min(startY, endY), Math.max(startX, endX), Math.max(startY, endY)];
    this.#regionEdges.forEach((edge, index) => edge.set(edges[index]!, now));
    this.#regionOpacity.retarget(1, now);
  }

  #rightStatus(): string {
    if (this.#recording === 'paused') return copy.paused;
    if (this.#recording === 'unavailable') return copy.unavailable;
    if (this.#region !== null) return copy.regionHint;
    if (this.#history.count === 0) return '';
    return `${formatSpan(this.#epochNow() - this.#history.epoch(this.#history.firstFrame))} held`;
  }

  #scrubTo(x: number, now: number): void {
    const geometry = this.#geometry(now);
    const position = Math.min(1, Math.max(0, (geometry.track.right - x) / (geometry.track.right - geometry.track.left)));
    this.#movePosition(position - this.#playhead.target, now);
  }

  #seek(frame: number): void {
    if (this.#history.count === 0) return;
    const clamped = this.#history.clamp(frame);
    this.#frame = clamped;
    this.#host.seek(clamped);
  }

  #seekEpoch(epoch: number): void {
    const frame = this.#history.frameAt(epoch);
    this.#followLive = frame >= this.#history.lastFrame;
    this.#seek(frame);
  }

  #span(): number {
    if (this.#history.count === 0) return 1;
    return Math.max(1_000, this.#epochNow() - this.#history.epoch(this.#history.firstFrame));
  }

  #statusText(): string {
    const gap = this.#currentGap();
    if (gap !== null) return gap.kind === 'paused' ? copy.gapPaused : gap.kind === 'locked' ? copy.gapLocked : copy.gapUnavailable;
    return copy.hints;
  }

  #currentGap(): Gap | null {
    if (this.#history.count === 0) return null;
    const epoch = this.#history.epoch(this.#frame);
    const next = this.#frame < this.#history.lastFrame ? this.#history.epoch(this.#frame + 1) : this.#epochNow();
    return this.#history.gaps.find((gap) => gap.from >= epoch && gap.to <= next) ?? null;
  }

  #stepFrames(delta: number): void {
    this.#followLive = this.#frame + delta >= this.#history.lastFrame;
    this.#seek(this.#frame + delta);
  }

  #stepMoment(direction: -1 | 1): void {
    const moments = this.#history.moments;
    let target = direction < 0 ? this.#history.firstFrame : this.#history.lastFrame;
    if (direction < 0) {
      for (let index = moments.length - 1; index >= 0; index -= 1) {
        if (moments[index]! < this.#frame) {
          target = moments[index]!;
          break;
        }
      }
    } else {
      for (const moment of moments) {
        if (moment > this.#frame) {
          target = moment;
          break;
        }
      }
    }
    this.#followLive = target >= this.#history.lastFrame;
    this.#seek(target);
  }

  #toMoment(x: number, y: number, card: Rectangle): [number, number] {
    const momentX = ((x - card.left) / (card.right - card.left)) * this.display.width;
    const momentY = ((y - card.top) / (card.bottom - card.top)) * this.display.height;
    return [Math.min(this.display.width, Math.max(0, momentX)), Math.min(this.display.height, Math.max(0, momentY))];
  }

  #toggleInspect(now: number): void {
    this.#inspect.retarget(this.#inspect.target > 0.5 ? 0 : 1, now);
  }

  #uploadMarks(track: Rectangle, span: number): void {
    const epochNow = this.#epochNow();
    const version = `${this.#history.count}|${this.#history.gaps.length}|${Math.floor(epochNow / 500)}|${track.left}|${track.right}`;
    if (version === this.#lastMarksVersion) return;
    this.#lastMarksVersion = version;
    const width = track.right - track.left;
    const marks: Mark[] = [];
    for (const gap of this.#history.gaps) {
      const from = track.right - positionOfAge(epochNow - gap.from, span) * width;
      const to = track.right - positionOfAge(epochNow - gap.to, span) * width;
      marks.push({ from: Math.min(from, to), kind: 1, to: Math.max(from, to) });
    }
    for (const moment of this.#history.moments) marks.push({ from: track.right - positionOfAge(epochNow - this.#history.epoch(moment), span) * width, kind: 0, to: 0 });
    this.#renderer.setMarks(marks.slice(-256));
  }
}
