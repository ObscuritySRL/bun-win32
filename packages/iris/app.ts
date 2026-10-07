// Iris itself: the state machine (hidden → open → closing), the choreography, input, and the per-frame draw list.
//
// Open:    the overlay appears fully transparent with every window's card sitting exactly on top of the real window
//          (frame 0 is pixel-identical to the desktop), then the backdrop fades up while the cards lift off in a wave
//          that starts at the pointer.
// Close:   every card flies home, the chosen one on top; once all are home the backdrop is gone, the overlay hides,
//          and the real windows are already where the cards were.

import { readFileSync } from 'node:fs';

import Shcore from '@bun-win32/shcore';
import User32 from '@bun-win32/user32';

import { initializeCapture, WindowCapture } from './capture';
import { CompositionSurface, createDevice, type Device } from './device';
import { composeTransform, hitQuad, offsetTransform, type Rect, reflectTransform } from './geometry';
import { IconAtlas } from './icons';
import type { Indexer, IndexUpdate } from './indexer';
import { flowLayout, gridLayout, type LayoutItem, type LayoutName, type LayoutResult, stackLayout } from './layout';
import { GENTLE, Placement, type PlacementTarget, SMOOTH, SNAPPY, Spring } from './motion';
import type { Recorder } from './recorder';
import { type BackdropStyle, type CardStyle, cameraDistance, type PanelStyle, Renderer } from './renderer';
import { type IndexedText, search, type SearchResult, tokenize } from './search';
import { TextAtlas, type TextEmphasis, type TextEntry } from './text';
import { ThumbnailHost } from './thumbnails';
import { accentColor, type Rgb, tinted, type Typography, typography, white } from './theme';
import { loadWallpaper, type Wallpaper } from './wallpaper';
import { activateWindow, closeWindow, enumerateWindows, isWindowAlive, type WindowInfo } from './windows';
import { type InputEvent, OverlayWindow } from './window';

const HOTKEY_SUMMON = 1;
const MOD_ALT = 0x0001;
const MOD_NOREPEAT = 0x4000;
const VK_OEM_3 = 0xc0;
const VK = { back: 0x08, down: 0x28, end: 0x23, enter: 0x0d, escape: 0x1b, f1: 0x70, home: 0x24, left: 0x25, right: 0x27, tab: 0x09, up: 0x26, w: 0x57 } as const;
const MONITOR_DEFAULTTONEAREST = 2;
const FULL_UV: readonly [number, number, number, number] = [0, 0, 1, 1];
const COLOPHON_WIDTH = 560;

type State = 'closing' | 'hidden' | 'open';

class Card {
  capture: WindowCapture | null = null;
  readonly focus = new Spring(0, SNAPPY);
  home: PlacementTarget;
  readonly hover = new Spring(0, SNAPPY);
  readonly glare = new Spring(0, SMOOTH);
  launchAt = 0;
  launched = true;
  readonly match = new Spring(0, SMOOTH);
  readonly placement: Placement;
  result: SearchResult | null = null;
  scan = -1;
  scanning = false;
  readonly style: CardStyle;
  readonly tiltX = new Spring(0, GENTLE);
  readonly tiltY = new Spring(0, GENTLE);
  target: PlacementTarget;
  visible = true;
  window: WindowInfo;
  readonly world = new Float32Array(16);
  closingSince = 0;
  closeRequested = false;

  constructor(window: WindowInfo, home: PlacementTarget, accent: Rgb) {
    this.window = window;
    this.home = home;
    this.target = home;
    this.placement = new Placement(home.x, home.y, SMOOTH);
    this.placement.snap(home);
    this.style = { accent, brightness: 1, focus: 0, glare: 0, glareX: 0.5, glareY: 0.3, opacity: 1, radius: 8, reflection: 0, saturation: 1, scan: -1, shadow: 0, shadowSigma: 24, spotlight: 0 };
  }

  /** Where this card's pixels come from: its own live capture, or its region of the minimized-window host. */
  source: { srv: bigint; uv: readonly [number, number, number, number] } | null = null;

  get hasPixels(): boolean {
    return this.source !== null;
  }
}

export interface IrisOptions {
  indexer: Indexer | null;
  recorder: Recorder | null;
  /** Restrict to windows owned by these process ids (the staged, privacy-safe demo). */
  onlyProcesses: ReadonlySet<number> | null;
  /** Restrict to exactly these windows (the reel's staged desktop). */
  onlyWindows: ReadonlySet<bigint> | null;
  /** Treat this rectangle as the monitor (recording a 16:9 region of an ultrawide). */
  monitor: Rect | null;
  /** Use this image as the backdrop instead of the desktop wallpaper. */
  wallpaper: string | null;
  /** Never show the overlay window (scripted verification renders to the back buffer only). */
  headless: boolean;
}

export class Iris {
  readonly accent: Rgb;
  readonly device: Device;
  readonly icons: IconAtlas;
  readonly renderer: Renderer;
  readonly text: TextAtlas;
  readonly type: Typography;
  readonly window: OverlayWindow;
  surface: CompositionSurface;

  #backdrop = new Spring(0, { damping: 1, frequency: 15 });
  #cards = new Map<bigint, Card>();
  #chrome = new Spring(0, SMOOTH);
  #closeChosen: Card | null = null;
  #closeStartedAt = 0;
  #colophon = new Spring(0, SMOOTH);
  #emptyFade = new Spring(0, SMOOTH);
  #flowFocus = new Spring(0, { damping: 0.9, frequency: 14 });
  #frameTimes = new Float32Array(240);
  #cpuTimes = new Float32Array(240);
  #frameStartedAt = 0;
  #frameCost = 0;
  #cpuCursor = 0;
  #figures = { cpu: '—', fps: '—', frame: '', gpu: '—', updatedAt: -1 };
  #sourceLines = 0;
  #sourceFiles = 0;
  #frameCursor = 0;
  #layout: LayoutName = 'grid';
  #layoutResult: LayoutResult = { floorY: 0, targets: [] };
  #lastBackgroundPoll = 0;
  #lastEnumeration = 0;
  #lastFrameAt = 0;
  #monitor: Rect = { height: 1080, width: 1920, x: 0, y: 0 };
  #options: IrisOptions;
  #order: Card[] = [];
  #pointer = { moved: false, x: -1, y: -1 };
  /** Set by a real pointer move; the pointer only steals the selection when it actually moves (keys win otherwise). */
  #pointerDirty = false;
  #query = '';
  #queryChangedAt = 0;
  #selected: Card | null = null;
  #state: State = 'hidden';
  #stats = { indexedWindows: 0, indexedWords: 0, indexing: '' };
  #time = 0;
  #index = new Map<bigint, IndexedText[]>();
  #visibleOrder: Card[] = [];
  #wallpaper: Wallpaper | null = null;
  #thumbnails = new ThumbnailHost();
  #wallpaperKey = '';
  #scratch = new Float32Array(16);
  bootMilliseconds = 0;
  running = true;

  constructor(options: IrisOptions) {
    this.#options = options;
    this.accent = accentColor();
    this.type = typography(this.accent);
    this.window = new OverlayWindow('Iris');
    this.device = createDevice();
    this.renderer = new Renderer(this.device);
    this.surface = new CompositionSurface(this.device, this.window.hwnd, 64, 64);
    this.text = new TextAtlas(this.renderer);
    this.icons = new IconAtlas(this.renderer);
    initializeCapture(this.device);
    if (User32.RegisterHotKey(this.window.hwnd, HOTKEY_SUMMON, MOD_ALT | MOD_NOREPEAT, VK_OEM_3) === 0) console.warn('[iris] Alt+` is taken by another app — summon Iris by re-running it.');
    options.indexer?.onUpdate((update) => this.#applyIndex(update));
    for (const file of new Bun.Glob('*.ts').scanSync(import.meta.dir)) {
      this.#sourceFiles += 1;
      for (const line of readFileSync(`${import.meta.dir}/${file}`, 'utf8').split('\n')) if (line.trim().length > 0) this.#sourceLines += 1;
    }
  }

  get state(): State {
    return this.#state;
  }

  get cards(): readonly Card[] {
    return this.#order;
  }

  get query(): string {
    return this.#query;
  }

  get layout(): LayoutName {
    return this.#layout;
  }

  /** Synchronise cards with the live window list (new windows get capture sessions, closed ones are released). */
  refreshWindows(): void {
    const excluded = new Set([this.window.hwnd]);
    let windows = enumerateWindows(excluded);
    const only = this.#options.onlyProcesses;
    if (only !== null) windows = windows.filter((window) => only.has(window.processId));
    const onlyWindows = this.#options.onlyWindows;
    if (onlyWindows !== null) windows = windows.filter((window) => onlyWindows.has(window.hwnd));
    const alive = new Set<bigint>();
    const order: Card[] = [];
    for (const window of windows) {
      alive.add(window.hwnd);
      let card = this.#cards.get(window.hwnd);
      if (card === undefined) {
        card = new Card(window, this.#homeFor(window), this.accent);
        card.capture = WindowCapture.create(window.hwnd, this.device, this.renderer);
        this.#cards.set(window.hwnd, card);
        this.#options.indexer?.request(window, 'new');
      } else {
        const changed = card.window.title !== window.title || card.window.minimized !== window.minimized;
        card.window = window;
        if (changed) this.#options.indexer?.request(window, 'changed');
      }
      if (card.capture === null && !window.minimized) card.capture = WindowCapture.create(window.hwnd, this.device, this.renderer);
      order.push(card);
    }
    for (const [hwnd, card] of this.#cards) {
      if (alive.has(hwnd)) continue;
      card.capture?.release();
      this.#cards.delete(hwnd);
      this.#index.delete(hwnd);
      this.#options.indexer?.forget(hwnd);
      if (this.#selected === card) this.#selected = null;
    }
    this.#order = order;
    this.#lastEnumeration = performance.now();
    const hosted = order.filter((card) => card.window.minimized && card.capture?.texture == null).map((card) => card.window.hwnd);
    this.#thumbnails.sync(hosted, 1600, 3);
    if (hosted.length > 0 && this.#thumbnails.capture === null) this.#thumbnails.capture = WindowCapture.create(this.#thumbnails.hwnd, this.device, this.renderer);
  }

  /** Poll every capture session (cheap when nothing changed). */
  pollCaptures(): number {
    let updated = 0;
    for (const card of this.#order) if (card.capture?.poll()) updated += 1;
    if (this.#thumbnails.capture?.poll()) updated += 1;
    const hostTexture = this.#thumbnails.capture?.texture ?? null;
    for (const card of this.#order) {
      const texture = card.capture?.texture ?? null;
      if (texture !== null) card.source = { srv: texture.srv, uv: FULL_UV };
      else {
        const region = hostTexture === null ? null : this.#thumbnails.region(card.window.hwnd);
        card.source = region === null || hostTexture === null ? null : { srv: hostTexture.srv, uv: region };
      }
    }
    return updated;
  }

  #homeFor(window: WindowInfo): PlacementTarget {
    const centerX = window.bounds.x + window.bounds.width / 2 - this.#monitor.x;
    const centerY = window.bounds.y + window.bounds.height / 2 - this.#monitor.y;
    if (window.minimized) return { opacity: 0, rotationX: 0, rotationY: 0, scale: 0.2, x: centerX, y: this.#monitor.height + window.bounds.height * 0.15, z: 0 };
    return { opacity: 1, rotationX: 0, rotationY: 0, scale: 1, x: centerX, y: centerY, z: 0 };
  }

  #applyIndex(update: IndexUpdate): void {
    const card = this.#cards.get(update.hwnd);
    if (update.kind === 'scanning') {
      if (card !== undefined) {
        if (card.scan < 0) card.scan = 0;
        card.scanning = true;
      }
      this.#stats.indexing = update.title;
      return;
    }
    this.#stats.indexing = '';
    if (card !== undefined) card.scanning = false;
    if (update.entries !== null) {
      this.#index.set(update.hwnd, update.entries);
      this.#stats.indexedWindows = this.#index.size;
      let words = 0;
      for (const entries of this.#index.values()) words += entries.length;
      this.#stats.indexedWords = words;
      if (this.#query.length > 0) this.#runSearch();
    }
  }

  /** The full rectangle of the monitor under the pointer, in virtual-screen pixels. */
  monitorForPointer(): Rect {
    if (this.#options.monitor !== null) return this.#options.monitor;
    const point = Buffer.alloc(8);
    User32.GetCursorPos(point.ptr);
    const monitor = User32.MonitorFromPoint((BigInt(point.readInt32LE(4) >>> 0) << 32n) | BigInt(point.readInt32LE(0) >>> 0), MONITOR_DEFAULTTONEAREST);
    const info = Buffer.alloc(40);
    info.writeUInt32LE(40, 0);
    User32.GetMonitorInfoW(monitor, info.ptr);
    const left = info.readInt32LE(4);
    const top = info.readInt32LE(8);
    return { height: info.readInt32LE(16) - top, width: info.readInt32LE(12) - left, x: left, y: top };
  }

  /** Pixels per DIP on the monitor holding `rect` (its effective DPI / 96), or IRIS_UI_SCALE when set. */
  #monitorScale(rect: Rect): number {
    const forced = Number(Bun.env.IRIS_UI_SCALE ?? 0);
    if (forced > 0) return forced;
    const centre = (BigInt((rect.y + (rect.height >> 1)) >>> 0) << 32n) | BigInt((rect.x + (rect.width >> 1)) >>> 0);
    const monitor = User32.MonitorFromPoint(centre, MONITOR_DEFAULTTONEAREST);
    const dpi = new Uint32Array(2);
    if (Shcore.GetDpiForMonitor(monitor, 0, dpi.ptr, new Uint32Array(1).ptr) !== 0 || dpi[0] === 0) return 1;
    return dpi[0]! / 96;
  }

  /** Summon the overlay on the monitor under the pointer. */
  open(): void {
    if (this.#state === 'open') return;
    const point = Buffer.alloc(8);
    User32.GetCursorPos(point.ptr);
    this.#monitor = this.monitorForPointer();
    const ui = this.#monitorScale(this.#monitor);
    this.renderer.ui = ui;
    this.text.setScale(ui);
    this.surface.resize(this.#monitor.width, this.#monitor.height);
    const wallpaperKey = `${this.#monitor.width}x${this.#monitor.height}`;
    if (this.#wallpaper === null || this.#wallpaperKey !== wallpaperKey) {
      if (this.#wallpaper !== null) {
        this.renderer.releaseTexture(this.#wallpaper.sharp);
        this.renderer.releaseTexture(this.#wallpaper.blurred);
      }
      this.#wallpaper = loadWallpaper(this.renderer, this.#monitor.width, this.#monitor.height, this.accent, this.#options.wallpaper);
      this.#wallpaperKey = wallpaperKey;
      this.renderer.setBackdropBlur(this.#wallpaper.blurred.srv);
    }
    this.refreshWindows();
    this.pollCaptures();
    this.#pointer = { moved: false, x: point.readInt32LE(0) - this.#monitor.x, y: point.readInt32LE(4) - this.#monitor.y };
    for (const card of this.#order) {
      card.home = this.#homeFor(card.window);
      card.placement.configure(SMOOTH);
      card.placement.snap(card.home);
      card.hover.snap(0);
      card.focus.snap(0);
      card.match.snap(0);
      card.closeRequested = false;
      const distance = Math.hypot(card.home.x - this.#pointer.x, card.home.y - this.#pointer.y);
      card.launchAt = this.#time + Math.min(0.11, (distance / Math.max(this.#monitor.width, 1)) * 0.16);
      card.launched = false;
    }
    this.#query = '';
    this.#runSearch();
    this.#flowFocus.snap(0);
    this.#backdrop.snap(0);
    this.#backdrop.target = 1;
    this.#chrome.snap(0);
    this.#chrome.target = 1;
    this.#selected = this.#visibleOrder[0] ?? null;
    this.#relayout();
    this.#state = 'open';
    this.#lastFrameAt = 0;
    this.#options.indexer?.prioritize(this.#order.map((card) => card.window));
    if (!this.#options.headless) {
      this.#renderFrame(0);
      this.window.show(this.#monitor.x, this.#monitor.y, this.#monitor.width, this.#monitor.height, true);
    }
  }

  /** Fly every card home; `chosen` (if any) lands on top and receives focus. */
  close(chosen: Card | null): void {
    if (this.#state !== 'open') return;
    this.#state = 'closing';
    this.#closeChosen = chosen;
    this.#closeStartedAt = this.#time;
    this.#backdrop.target = 0;
    this.#chrome.target = 0;
    this.#colophon.target = 0;
    for (const card of this.#order) {
      card.placement.configure({ damping: 1, frequency: 19 });
      card.home = this.#homeFor(card.window);
      if (card === chosen && card.window.minimized) card.home = { ...card.home, opacity: 1, scale: 1, y: card.window.bounds.y + card.window.bounds.height / 2 - this.#monitor.y };
      card.placement.set(card.home);
      card.hover.target = 0;
      card.focus.target = 0;
      card.launched = true;
    }
    if (chosen !== null && !this.#options.headless) activateWindow(chosen.window.hwnd);
  }

  /** `queryChanged`: the user edited the query (select the best match). Background re-runs (a window finished reading,
   *  a title changed) keep whatever the user selected, as long as it still matches. */
  #runSearch(queryChanged = false): void {
    const terms = tokenize(this.#query);
    const visible: Card[] = [];
    for (const card of this.#order) {
      card.result = search(terms, { app: card.window.appName, content: this.#index.get(card.window.hwnd) ?? [], title: card.window.title });
      card.visible = card.result !== null;
      card.match.target = terms.length > 0 && card.result !== null && card.result.contentHits.length > 0 ? 1 : 0;
      if (card.visible) visible.push(card);
    }
    if (terms.length > 0) visible.sort((first, second) => (second.result?.score ?? 0) - (first.result?.score ?? 0) || first.window.zOrder - second.window.zOrder);
    this.#visibleOrder = visible;
    if (queryChanged && terms.length > 0) this.#selected = visible[0] ?? null;
    else if (this.#selected === null || !visible.includes(this.#selected)) this.#selected = visible[0] ?? null;
    this.#emptyFade.target = terms.length > 0 && visible.length === 0 ? 1 : 0;
    this.#flowFocus.target = Math.max(0, visible.indexOf(this.#selected!));
    this.#relayout();
  }

  #area(): Rect {
    const ui = this.renderer.ui;
    const top = 136 * ui;
    const bottom = 118 * ui;
    const side = 60 * ui;
    const inset = this.#colophon.target > 0.5 ? (COLOPHON_WIDTH + 48) * ui : 0;
    return { height: this.#monitor.height - top - bottom, width: this.#monitor.width - side * 2 - inset, x: side + inset, y: top };
  }

  #layoutItem(card: Card): LayoutItem {
    const bounds = card.window.bounds;
    const shrink = card.hasPixels ? 1 : 0.62;
    return { centerX: bounds.x + bounds.width / 2 - this.#monitor.x, centerY: bounds.y + bounds.height / 2 - this.#monitor.y, height: bounds.height * shrink, width: bounds.width * shrink };
  }

  #relayout(): void {
    const visible = this.#visibleOrder;
    const items = visible.map((card) => this.#layoutItem(card));
    const area = this.#area();
    if (this.#layout === 'grid') this.#layoutResult = gridLayout(items, area, this.renderer.ui);
    else {
      const order = items.map((_, index) => index);
      const focus = this.#flowFocus.target;
      this.#layoutResult = this.#layout === 'flow' ? flowLayout(items, order, focus, area) : stackLayout(items, order, focus, area);
    }
    visible.forEach((card, index) => {
      const target = this.#layoutResult.targets[index]!;
      const shrink = card.hasPixels ? 1 : 0.62;
      card.target = { ...target, scale: target.scale * shrink };
      if (card.launched && this.#state === 'open') card.placement.set(card.target);
    });
    for (const card of this.#order) {
      if (card.visible) continue;
      const fade: PlacementTarget = { ...card.placement.snapshot(), opacity: 0, z: 260 };
      card.target = fade;
      if (this.#state === 'open') card.placement.set(fade);
    }
  }

  #setLayout(layout: LayoutName): void {
    if (layout === this.#layout) return;
    this.#layout = layout;
    for (const card of this.#order) card.placement.configure(layout === 'grid' ? SMOOTH : { damping: 0.92, frequency: 15 });
    this.#flowFocus.snap(Math.max(0, this.#visibleOrder.indexOf(this.#selected!)));
    this.#relayout();
  }

  #select(card: Card | null): void {
    if (card === this.#selected) return;
    this.#selected = card;
    if (card !== null && this.#layout !== 'grid') {
      this.#flowFocus.target = Math.max(0, this.#visibleOrder.indexOf(card));
      this.#relayout();
    }
  }

  #moveSelection(dx: number, dy: number): void {
    const visible = this.#visibleOrder;
    if (visible.length === 0) return;
    const current = this.#selected ?? visible[0]!;
    if (this.#layout !== 'grid') {
      const step = this.#layout === 'flow' ? dx || dy : dy || dx;
      const index = Math.min(visible.length - 1, Math.max(0, visible.indexOf(current) + step));
      this.#select(visible[index]!);
      return;
    }
    let best: Card | null = null;
    let bestScore = Infinity;
    for (const card of visible) {
      if (card === current) continue;
      const deltaX = card.target.x - current.target.x;
      const deltaY = card.target.y - current.target.y;
      const along = deltaX * dx + deltaY * dy;
      if (along <= 4) continue;
      const across = Math.abs(dx !== 0 ? deltaY : deltaX);
      const score = along + across * 2.2;
      if (score < bestScore) {
        bestScore = score;
        best = card;
      }
    }
    if (best !== null) this.#select(best);
  }

  #requestClose(card: Card): void {
    card.closeRequested = true;
    card.closingSince = this.#time;
    card.placement.set({ ...card.target, opacity: 0.3, scale: card.target.scale * 0.92, z: card.target.z + 60 });
    if (!this.#options.headless) closeWindow(card.window.hwnd);
  }

  handle(event: InputEvent): void {
    if (event.kind === 'hotkey') {
      if (event.id !== HOTKEY_SUMMON) return;
      if (this.#state === 'open') this.close(null);
      else if (this.#state === 'hidden') this.open();
      return;
    }
    if (this.#state !== 'open') return;
    switch (event.kind) {
      case 'character':
        this.#query += event.text;
        this.#queryChangedAt = this.#time;
        this.#runSearch(true);
        return;
      case 'deactivate':
        if (!this.#options.headless) this.close(null);
        return;
      case 'key':
        this.#handleKey(event.virtualKey, event.control, event.shift);
        return;
      case 'pointer-down': {
        const card = this.#cardAt(event.x, event.y);
        if (event.button === 'left') {
          const chip = this.#layoutChipAt(event.x, event.y);
          if (chip !== null) this.#setLayout(chip);
          else if (card !== null || !this.#overChrome(event.x, event.y)) this.close(card);
        } else if (event.button === 'middle' && card !== null) this.#requestClose(card);
        return;
      }
      case 'pointer-move':
        this.#pointer = { moved: true, x: event.x, y: event.y };
        this.#pointerDirty = true;
        return;
      case 'wheel':
        if (this.#layout === 'grid') return;
        this.#moveSelection(event.delta < 0 ? 1 : -1, event.delta < 0 ? 1 : -1);
        return;
    }
  }

  #handleKey(virtualKey: number, control: boolean, shift: boolean): void {
    switch (virtualKey) {
      case VK.escape:
        if (this.#query.length > 0) {
          this.#query = '';
          this.#runSearch(true);
        } else this.close(null);
        return;
      case VK.enter:
        this.close(this.#selected);
        return;
      case VK.back:
        if (this.#query.length === 0) return;
        this.#query = control ? this.#query.replace(/\S+\s*$/, '') : Array.from(this.#query).slice(0, -1).join('');
        this.#queryChangedAt = this.#time;
        this.#runSearch(true);
        return;
      case VK.tab: {
        const layouts: LayoutName[] = ['grid', 'flow', 'stack'];
        const index = layouts.indexOf(this.#layout);
        this.#setLayout(layouts[(index + (shift ? 2 : 1)) % 3]!);
        return;
      }
      case VK.left:
        this.#moveSelection(-1, 0);
        return;
      case VK.right:
        this.#moveSelection(1, 0);
        return;
      case VK.up:
        this.#moveSelection(0, -1);
        return;
      case VK.down:
        this.#moveSelection(0, 1);
        return;
      case VK.home:
        this.#select(this.#visibleOrder[0] ?? null);
        return;
      case VK.end:
        this.#select(this.#visibleOrder[this.#visibleOrder.length - 1] ?? null);
        return;
      case VK.f1:
        this.#colophon.target = this.#colophon.target > 0.5 ? 0 : 1;
        this.#relayout();
        return;
      case VK.w:
        if (control && this.#selected !== null) this.#requestClose(this.#selected);
        return;
    }
  }

  /** Topmost card under a screen point (tests in reverse draw order against the projected quads). */
  #cardAt(x: number, y: number): Card | null {
    const camera = this.#camera();
    const sorted = this.#drawOrder();
    for (let index = sorted.length - 1; index >= 0; index -= 1) {
      const card = sorted[index]!;
      if (!card.visible || card.placement.opacity.value < 0.5) continue;
      const bounds = card.window.bounds;
      if (hitQuad(card.world, bounds.width / 2, bounds.height / 2, camera, x, y)) return card;
    }
    return null;
  }

  #camera(): { centerX: number; centerY: number; distance: number } {
    return { centerX: this.#monitor.width / 2, centerY: this.#monitor.height / 2, distance: cameraDistance(this.#monitor.height) };
  }

  #drawOrder(): Card[] {
    const chosen = this.#closeChosen;
    return [...this.#order].sort((first, second) => {
      if (this.#state === 'closing') {
        if (first === chosen) return 1;
        if (second === chosen) return -1;
      }
      const depth = second.placement.z.value - first.placement.z.value;
      if (Math.abs(depth) > 0.5) return depth;
      return second.window.zOrder - first.window.zOrder;
    });
  }

  /** One frame: advance time, process input, animate, draw, present. `fixedStep` forces a deterministic clock. */
  frame(fixedStep?: number): void {
    const now = performance.now();
    const step = fixedStep ?? (this.#lastFrameAt === 0 ? 1 / 120 : Math.min(0.05, (now - this.#lastFrameAt) / 1000));
    if (this.#lastFrameAt !== 0) {
      // A scripted recording runs on a fixed clock: its frames ARE 1/60 s apart in the footage, whatever encoding costs.
      this.#frameTimes[this.#frameCursor] = fixedStep ?? (now - this.#lastFrameAt) / 1000;
      this.#frameCursor = (this.#frameCursor + 1) % this.#frameTimes.length;
    }
    this.#lastFrameAt = now;
    this.#frameStartedAt = now;
    this.#time += step;
    for (const event of this.window.events.splice(0)) this.handle(event);
    if (this.#state === 'hidden') return;
    if (this.#state === 'open' && now - this.#lastEnumeration > 1000) {
      const before = this.#order.map((card) => `${card.window.hwnd}:${card.window.title}`).join('|');
      this.refreshWindows();
      if (this.#order.map((card) => `${card.window.hwnd}:${card.window.title}`).join('|') !== before) this.#runSearch();
    }
    this.pollCaptures();
    this.#animate(step);
    this.#renderFrame(step);
    this.#cpuTimes[this.#cpuCursor] = this.#frameCost;
    this.#cpuCursor = (this.#cpuCursor + 1) % this.#cpuTimes.length;
    if (this.#state === 'closing' && this.#closeFinished()) this.#finishClose();
  }

  #animate(step: number): void {
    this.#backdrop.step(step);
    this.#chrome.step(step);
    this.#colophon.step(step);
    this.#emptyFade.step(step);
    this.#flowFocus.step(step);
    if (this.#layout !== 'grid' && this.#state === 'open' && !this.#flowFocus.settled) this.#relayout();
    const pointerCard = this.#state === 'open' && this.#pointer.moved ? this.#cardAt(this.#pointer.x, this.#pointer.y) : null;
    if (this.#pointerDirty && pointerCard !== null && this.#layout === 'grid' && pointerCard.visible) this.#select(pointerCard);
    this.#pointerDirty = false;
    for (const card of this.#order) {
      if (!card.launched && this.#time >= card.launchAt) {
        card.launched = true;
        card.placement.set(card.target);
      }
      const selected = this.#state === 'open' && card === this.#selected && card.visible;
      card.focus.target = selected ? 1 : 0;
      card.hover.target = selected && this.#layout === 'grid' ? 1 : 0;
      if (selected && this.#layout === 'grid' && pointerCard === card) {
        const bounds = card.window.bounds;
        const scale = card.placement.scale.value;
        const unitX = (this.#pointer.x - card.placement.x.value) / (bounds.width * scale) + 0.5;
        const unitY = (this.#pointer.y - card.placement.y.value) / (bounds.height * scale) + 0.5;
        card.tiltY.target = (unitX - 0.5) * 0.16;
        card.tiltX.target = -(unitY - 0.5) * 0.12;
        card.style.glareX = unitX;
        card.style.glareY = unitY;
        card.glare.target = 1;
      } else {
        card.tiltX.target = 0;
        card.tiltY.target = 0;
        card.glare.target = 0;
      }
      if (card.closeRequested && this.#time - card.closingSince > 0.2) {
        if (!this.#options.headless && !isWindowAlive(card.window.hwnd)) {
          card.closeRequested = false;
          this.refreshWindows();
          this.#runSearch();
          return;
        }
        // Still alive (an unsaved-changes prompt, or a refusal): bring the card back.
        if (this.#time - card.closingSince > 1.6) {
          card.closeRequested = false;
          card.placement.set(card.target);
        }
      }
      card.placement.step(step);
      card.focus.step(step);
      card.hover.step(step);
      card.glare.step(step);
      card.match.step(step);
      card.tiltX.step(step);
      card.tiltY.step(step);
      if (card.scan >= 0) {
        card.scan += step * 1.5;
        if (card.scan > 1.25) card.scan = card.scanning ? 0 : -1;
      }
    }
  }

  #closeFinished(): boolean {
    if (this.#time - this.#closeStartedAt > 0.9) return true;
    if (this.#backdrop.value > 0.004) return false;
    for (const card of this.#order) {
      const placement = card.placement;
      if (Math.abs(placement.x.value - card.home.x) > 0.35 || Math.abs(placement.y.value - card.home.y) > 0.35 || Math.abs(placement.scale.value - card.home.scale) > 0.0005 || Math.abs(placement.z.value) > 0.5) return false;
    }
    return true;
  }

  #finishClose(): void {
    for (const card of this.#order) card.placement.snap(card.home);
    this.#backdrop.snap(0);
    this.#renderFrame(0);
    if (!this.#options.headless) this.window.hide();
    this.#state = 'hidden';
    this.#closeChosen = null;
  }

  /** The resident loop's idle work: keep window textures warm (~5 Hz) and the window list current (~1 Hz). */
  backgroundTick(): void {
    const now = performance.now();
    if (now - this.#lastEnumeration > 1000) this.refreshWindows();
    if (now - this.#lastBackgroundPoll > 200) {
      this.pollCaptures();
      this.#lastBackgroundPoll = now;
    }
  }

  #renderFrame(step: number): void {
    const renderer = this.renderer;
    const width = this.#monitor.width;
    const height = this.#monitor.height;
    renderer.begin();
    this.text.beginFrame();
    this.#options.recorder?.drawUnderlay(renderer, width, height, this.#wallpaper);
    const wallpaper = this.#wallpaper!;
    const openness = this.#backdrop.value;
    const backdrop: BackdropStyle = {
      accent: this.accent,
      accentGlow: 0.07,
      blur: Math.min(1, openness * 1.15),
      brightness: 1 - openness * 0.56,
      grain: 0.012,
      opacity: Math.min(1, openness * 1.6),
      saturation: 1 + openness * 0.12,
      vignette: 0.42 * openness,
    };
    if (backdrop.opacity > 0.001) renderer.backdrop(width, height, wallpaper.sharp.srv, wallpaper.uv, backdrop);
    const chrome = this.#chrome.value;
    const ui = renderer.ui;
    if (this.#layout === 'flow' && chrome > 0.01) this.#drawFloor(width / ui, chrome);
    const ordered = this.#drawOrder();
    for (const card of ordered) this.#drawCard(card, openness);
    if (chrome > 0.01) this.#drawChrome(width / ui, height / ui, chrome);
    this.text.flush();
    renderer.execute({ height: this.surface.height, rtv: this.surface.renderTargetView, width: this.surface.width }, this.#time, [0, 0, 0, 0], true);
    // Frame cost = everything Iris does for a frame up to submission; the recorder's read-back is not Iris's cost.
    this.#frameCost = performance.now() - this.#frameStartedAt;
    this.#options.recorder?.capture(this, step);
    if (!this.#options.headless) this.surface.present();
  }

  #drawFloor(width: number, chrome: number): void {
    const floorY = this.#layoutResult.floorY / this.renderer.ui;
    const glow: PanelStyle = { border: [0, 0, 0, 0], fill: tinted(this.accent, 0.05 * chrome), frost: 0, frostBrightness: 0, opacity: 1, radius: 1, shadow: 0, shadowSigma: 0, sheen: 0 };
    this.renderer.panel(width * 0.2, floorY + 1, width * 0.6, 1, glow, this.#wallpaper!.uv);
  }

  #drawCard(card: Card, openness: number): void {
    const placement = card.placement;
    const opacity = placement.opacity.value;
    if (opacity < 0.003) return;
    const hover = card.hover.value;
    const bounds = card.window.bounds;
    const halfWidth = bounds.width / 2;
    const halfHeight = bounds.height / 2;
    const ui = this.renderer.ui;
    const scale = placement.scale.value * (1 + hover * 0.035);
    const z = placement.z.value - hover * 70 * ui;
    composeTransform(card.world, placement.x.value, placement.y.value, z, placement.rotationX.value + card.tiltX.value, placement.rotationY.value + card.tiltY.value, scale);
    const style = card.style;
    const searching = this.#query.length > 0;
    style.opacity = opacity;
    style.radius = (9 * ui) / Math.max(scale, 0.05);
    style.shadow = 0.5 * openness;
    style.shadowSigma = ((18 + hover * 22) * ui) / Math.max(scale, 0.05);
    style.focus = card.focus.value * openness;
    style.glare = card.glare.value * 0.1;
    style.saturation = card.visible ? 1 : 0.2;
    style.brightness = 1;
    style.scan = card.scan < 0 ? -1 : card.scan - 0.12;
    style.spotlight = card.match.value * openness;
    const highlights: number[] = [];
    if (searching && card.result !== null) for (const hit of card.result.contentHits) if (hit.rect !== null && highlights.length < 192) highlights.push(hit.rect[0], hit.rect[1], hit.rect[2], hit.rect[3]);
    const margin = style.shadowSigma * 3;
    if (card.hasPixels) {
      if (this.#layout === 'flow' && this.#state !== 'hidden') {
        reflectTransform(this.#scratch, card.world, this.#layoutResult.floorY);
        style.reflection = 0.32 * this.#chrome.value;
        const shadow = style.shadow;
        style.shadow = 0;
        style.focus = 0;
        this.renderer.card(this.#scratch, halfWidth, halfHeight, 4, card.source!.srv, card.source!.uv, style);
        style.shadow = shadow;
        style.focus = card.focus.value * openness;
        style.reflection = 0;
      }
      this.renderer.card(card.world, halfWidth, halfHeight, margin, card.source!.srv, card.source!.uv, style, highlights);
    } else this.#drawReaderCard(card, halfWidth, halfHeight, opacity, scale, openness);
    this.#drawLabel(card, halfHeight, scale);
  }

  /** A window with no pixels at all (no capture, no DWM surface): frosted glass, its icon, and the text Iris read from it. */
  #drawReaderCard(card: Card, halfWidth: number, halfHeight: number, opacity: number, scale: number, openness: number): void {
    const renderer = this.renderer;
    const panel: PanelStyle = {
      border: white(0.16),
      fill: [0.06, 0.065, 0.08, 0.55],
      frost: 0.55,
      frostBrightness: 1.5,
      opacity,
      radius: (14 * this.renderer.ui) / Math.max(scale, 0.05),
      shadow: 0.45 * openness,
      shadowSigma: (22 * this.renderer.ui) / Math.max(scale, 0.05),
      sheen: 0.05,
    };
    renderer.panel(0, 0, halfWidth * 2, halfHeight * 2, panel, this.#wallpaper!.uv, card.world);
    // Layout in DIPs as the card will sit once settled; `unit` converts a DIP into the card's local (window-pixel) space.
    const ui = renderer.ui;
    const settledScale = Math.max(card.target.scale, 0.05);
    const inverse = 1 / settledScale;
    const unit = ui * inverse;
    const pad = 22 * unit;
    const icon = this.icons.get(card.window.executablePath);
    let cursorY = -halfHeight + pad;
    if (icon !== null) {
      const size = 40;
      offsetTransform(this.#scratch, card.world, -halfWidth + pad + (size / 2) * unit, cursorY + (size / 2) * unit, inverse);
      renderer.textWorld(this.#scratch, (size / 2) * ui, (size / 2) * ui, this.icons.view, icon.uv, [1, 1, 1, 1], opacity);
    }
    const cardWidth = (halfWidth * 2 * settledScale) / ui;
    const cardHeight = (halfHeight * 2 * settledScale) / ui;
    const titleWidth = Math.max(40, cardWidth - 44 - 52);
    const title = this.text.get(card.window.appName, this.type.readerTitle, titleWidth);
    offsetTransform(this.#scratch, card.world, -halfWidth + pad + (52 + title.width / 2 - title.padding) * unit, cursorY + 20 * unit, inverse);
    renderer.textWorld(this.#scratch, (title.width / 2) * ui, (title.height / 2) * ui, this.text.view, title.uv, [1, 1, 1, 1], opacity);
    cursorY += 58 * unit;
    const entries = this.#index.get(card.window.hwnd);
    const bodyWidth = cardWidth - 44;
    const bodyHeight = cardHeight - 58 - 44;
    if (bodyHeight < 30) return;
    let body: TextEntry;
    if (entries === undefined) body = this.text.get('Reading this window…', { ...this.type.readerBody, color: white(0.45), italic: true }, bodyWidth, undefined, bodyHeight);
    else {
      const lines: string[] = [];
      let last = '';
      for (const entry of entries) {
        if (entry.line === last) continue;
        last = entry.line;
        lines.push(entry.line);
        if (lines.length > 60) break;
      }
      body = this.text.get(lines.join('\n') || 'Nothing readable — this window keeps its contents to itself.', this.type.readerBody, bodyWidth, undefined, bodyHeight);
    }
    offsetTransform(this.#scratch, card.world, -halfWidth + pad + (body.width / 2 - body.padding) * unit, cursorY + (body.height / 2 - body.padding) * unit, inverse);
    renderer.textWorld(this.#scratch, (body.width / 2) * ui, (body.height / 2) * ui, this.text.view, body.uv, [1, 1, 1, 1], opacity);
  }

  #emphasis(ranges: [number, number][]): TextEmphasis | undefined {
    if (ranges.length === 0) return undefined;
    return { color: tinted(this.accent, 1), ranges, weight: 700 };
  }

  #drawLabel(card: Card, halfHeight: number, scale: number): void {
    const chrome = this.#chrome.value;
    const placement = card.placement;
    const travel = Math.hypot(placement.x.value - card.target.x, placement.y.value - card.target.y) + Math.abs(placement.scale.value - card.target.scale) * 900;
    const ui = this.renderer.ui;
    const arrival = this.#state === 'closing' ? chrome : 1 - Math.min(1, travel / (140 * ui));
    const opacity = placement.opacity.value * chrome * arrival * arrival * (card.visible ? 1 : 0);
    if (opacity < 0.01) return;
    const renderer = this.renderer;
    const inverse = 1 / Math.max(scale, 0.02);
    const result = card.result;
    if (this.#layout === 'grid') {
      // Offsets are composed in DIPs below the card and converted to screen pixels (× ui) at the end.
      // Width from where the card will settle (not the animated scale), rounded: every frame of a flight reuses one layout.
      const settledWidth = (card.window.bounds.width * card.target.scale) / ui;
      const maxWidth = Math.max(60, Math.round((settledWidth - 34) / 8) * 8);
      const title = this.text.get(card.window.title, this.type.title, maxWidth, this.#emphasis(result?.titleRanges ?? []));
      const icon = this.icons.get(card.window.executablePath);
      const iconSize = 20;
      const total = title.inkWidth + (icon === null ? 0 : iconSize + 8);
      const left = -total / 2;
      const top = (halfHeight * scale) / ui + 14;
      const pixel = ui * inverse;
      if (icon !== null) {
        offsetTransform(this.#scratch, card.world, (left + iconSize / 2) * pixel, (top + iconSize / 2 + 1) * pixel, inverse);
        renderer.textWorld(this.#scratch, (iconSize / 2) * ui, (iconSize / 2) * ui, this.icons.view, icon.uv, [1, 1, 1, 1], opacity);
      }
      const titleLeft = left + (icon === null ? 0 : iconSize + 8);
      offsetTransform(this.#scratch, card.world, (titleLeft + title.width / 2 - title.padding) * pixel, (top + title.height / 2 - title.padding) * pixel, inverse);
      renderer.textWorld(this.#scratch, (title.width / 2) * ui, (title.height / 2) * ui, this.text.view, title.uv, [1, 1, 1, 1], opacity);
      const snippet = result?.snippet ?? null;
      const second =
        snippet !== null && this.#query.length > 0
          ? this.text.get(`${snippet.source === 'ocr' ? '' : ''}${snippet.text}`, this.type.snippet, maxWidth, this.#emphasis(snippet.ranges))
          : this.text.get(card.window.appName, this.type.appName, maxWidth, this.#emphasis(result?.appRanges ?? []));
      offsetTransform(this.#scratch, card.world, (second.width / 2 - second.padding - second.inkWidth / 2) * pixel, (top + 24 + second.height / 2 - second.padding) * pixel, inverse);
      renderer.textWorld(this.#scratch, (second.width / 2) * ui, (second.height / 2) * ui, this.text.view, second.uv, [1, 1, 1, 1], opacity * 0.95);
      return;
    }
    if (card !== this.#selected) return;
    const area = this.#area();
    const areaWidth = area.width / ui;
    const centre = this.#monitor.width / ui / 2;
    const title = this.text.get(card.window.title, this.type.titleLarge, areaWidth * 0.6, this.#emphasis(result?.titleRanges ?? []));
    const baseY = this.#layout === 'flow' ? this.#layoutResult.floorY / ui + 40 : (area.y + area.height) / ui - 30;
    renderer.text(centre - title.inkWidth / 2 - title.padding, baseY, title.width, title.height, this.text.view, title.uv, [1, 1, 1, 1], chrome);
    const snippet = result?.snippet ?? null;
    const second =
      snippet !== null && this.#query.length > 0
        ? this.text.get(snippet.text, { ...this.type.snippet, size: 15 }, areaWidth * 0.6, this.#emphasis(snippet.ranges))
        : this.text.get(card.window.appName, { ...this.type.appName, size: 14 }, areaWidth * 0.5);
    renderer.text(centre - second.inkWidth / 2 - second.padding, baseY + 40, second.width, second.height, this.text.view, second.uv, [1, 1, 1, 1], chrome * 0.9);
  }

  #layoutChips(width: number): { name: LayoutName; label: string; x: number; y: number; width: number; height: number }[] {
    const labels: [LayoutName, string][] = [
      ['grid', 'Grid'],
      ['flow', 'Flow'],
      ['stack', 'Stack'],
    ];
    const bar = this.#searchBar(width);
    const chips: { name: LayoutName; label: string; x: number; y: number; width: number; height: number }[] = [];
    let x = bar.x + bar.width + 18;
    for (const [name, label] of labels) {
      const entry = this.text.get(label, this.type.footerKey);
      const chipWidth = entry.inkWidth + 26;
      chips.push({ height: 32, label, name, width: chipWidth, x, y: bar.y + (bar.height - 32) / 2 });
      x += chipWidth + 6;
    }
    return chips;
  }

  /** Clicks on the search field or the colophon are not "click the backdrop to dismiss". */
  #overChrome(pixelX: number, pixelY: number): boolean {
    const ui = this.renderer.ui;
    const x = pixelX / ui;
    const y = pixelY / ui;
    const bar = this.#searchBar(this.#monitor.width / ui);
    if (x >= bar.x && x <= bar.x + bar.width && y >= bar.y && y <= bar.y + bar.height) return true;
    return this.#colophon.target > 0.5 && x >= 48 && x <= 48 + COLOPHON_WIDTH && y >= 136 && y <= this.#monitor.height / ui - 118;
  }

  #layoutChipAt(pixelX: number, pixelY: number): LayoutName | null {
    const ui = this.renderer.ui;
    const x = pixelX / ui;
    const y = pixelY / ui;
    for (const chip of this.#layoutChips(this.#monitor.width / ui)) if (x >= chip.x && x <= chip.x + chip.width && y >= chip.y && y <= chip.y + chip.height) return chip.name;
    return null;
  }

  #searchBar(width: number): { x: number; y: number; width: number; height: number } {
    const barWidth = Math.min(780, Math.max(420, width * 0.36));
    return { height: 54, width: barWidth, x: (width - barWidth) / 2, y: 36 };
  }

  #drawChrome(width: number, height: number, chrome: number): void {
    const renderer = this.renderer;
    const type = this.type;
    const uv = this.#wallpaper!.uv;
    const slide = (1 - chrome) * -26;
    const bar = this.#searchBar(width);
    bar.y += slide;

    const wordmark = this.text.get('Iris', type.wordmark);
    renderer.text(48 - wordmark.padding, bar.y + 4 - wordmark.padding, wordmark.width, wordmark.height, this.text.view, wordmark.uv, [1, 1, 1, 1], chrome);
    const tagline = this.text.get('every window, every word', type.tagline);
    renderer.text(48 - tagline.padding, bar.y + 34 - tagline.padding, tagline.width, tagline.height, this.text.view, tagline.uv, [1, 1, 1, 1], chrome);
    const iris: PanelStyle = { border: [0, 0, 0, 0], fill: tinted(this.accent, 1), frost: 0, frostBrightness: 0, opacity: chrome, radius: 4, shadow: 0, shadowSigma: 0, sheen: 0 };
    renderer.panel(48 + wordmark.inkWidth + 6, bar.y + 8, 8, 8, iris, uv);

    const panel: PanelStyle = { border: white(0.18), fill: [0.025, 0.028, 0.04, 0.62], frost: 0.38, frostBrightness: 0.95, opacity: chrome, radius: bar.height / 2, shadow: 0.42, shadowSigma: 26, sheen: 0.035 };
    renderer.panel(bar.x, bar.y, bar.width, bar.height, panel, uv);
    const glyph = this.text.get('', type.icon);
    renderer.text(bar.x + 22 - glyph.padding, bar.y + (bar.height - glyph.inkHeight) / 2 - glyph.padding, glyph.width, glyph.height, this.text.view, glyph.uv, [1, 1, 1, 1], chrome);
    const textX = bar.x + 56;
    const textWidth = bar.width - 56 - 120;
    if (this.#query.length === 0) {
      const total = this.#order.length;
      const placeholder = this.text.get(`Search ${total} window${total === 1 ? '' : 's'} — titles, apps, and the words inside them`, type.placeholder, textWidth);
      renderer.text(textX - placeholder.padding, bar.y + (bar.height - placeholder.inkHeight) / 2 - placeholder.padding, placeholder.width, placeholder.height, this.text.view, placeholder.uv, [1, 1, 1, 1], chrome);
    }
    const query = this.text.get(this.#query.length === 0 ? ' ' : this.#query, type.query, textWidth);
    const queryWidth = this.#query.length === 0 ? 0 : query.inkWidth;
    if (this.#query.length > 0) renderer.text(textX - query.padding, bar.y + (bar.height - query.inkHeight) / 2 - query.padding, query.width, query.height, this.text.view, query.uv, [1, 1, 1, 1], chrome);
    const blink = 0.5 + 0.5 * Math.cos((this.#time - this.#queryChangedAt) * Math.PI * 2 * 0.9);
    const caret: PanelStyle = { border: [0, 0, 0, 0], fill: tinted(this.accent, 1), frost: 0, frostBrightness: 0, opacity: chrome * (0.25 + 0.75 * blink), radius: 1, shadow: 0, shadowSigma: 0, sheen: 0 };
    renderer.panel(textX + queryWidth + (this.#query.length === 0 ? -5 : 2), bar.y + 15, 2, bar.height - 30, caret, uv);

    const matching = this.#visibleOrder.length;
    const countLabel = this.#query.length > 0 ? `${matching} of ${this.#order.length}` : this.#stats.indexing.length > 0 ? 'reading…' : `${this.#stats.indexedWords.toLocaleString('en-US')} words`;
    const count = this.text.get(countLabel, type.stat);
    renderer.text(bar.x + bar.width - 24 - count.inkWidth - count.padding, bar.y + (bar.height - count.inkHeight) / 2 - count.padding, count.width, count.height, this.text.view, count.uv, [1, 1, 1, 1], chrome);

    for (const chip of this.#layoutChips(width)) {
      const active = chip.name === this.#layout;
      const chipStyle: PanelStyle = {
        border: active ? tinted(this.accent, 0.55) : white(0.12),
        fill: active ? tinted(this.accent, 0.22) : [0.04, 0.045, 0.06, 0.25],
        frost: 0.45,
        frostBrightness: 1.3,
        opacity: chrome,
        radius: 16,
        shadow: 0,
        shadowSigma: 0,
        sheen: 0.03,
      };
      renderer.panel(chip.x, chip.y + slide, chip.width, chip.height, chipStyle, uv);
      const label = this.text.get(chip.label, active ? { ...type.footerKey, color: white(0.98) } : { ...type.footerKey, color: white(0.62) });
      renderer.text(chip.x + (chip.width - label.inkWidth) / 2 - label.padding, chip.y + slide + (chip.height - label.inkHeight) / 2 - label.padding, label.width, label.height, this.text.view, label.uv, [1, 1, 1, 1], chrome);
    }

    if (this.#emptyFade.value > 0.01) {
      const message = this.text.get(`Nothing on screen says “${this.#query}”`, { ...type.titleLarge, color: white(0.7), weight: 400 }, width * 0.6);
      renderer.text((width - message.inkWidth) / 2 - message.padding, height * 0.45, message.width, message.height, this.text.view, message.uv, [1, 1, 1, 1], this.#emptyFade.value * chrome);
    }

    this.#drawFooter(width, height, chrome);
    if (this.#colophon.value > 0.005) this.#drawColophon(height, chrome * this.#colophon.value);
  }

  /** The typical frame: one-off spikes (first-open wallpaper decode, the once-a-second window census) stay in the graph. */
  #median(times: Float32Array): number {
    const samples = Array.from(times).filter((value) => value > 0);
    if (samples.length === 0) return 0;
    samples.sort((first, second) => first - second);
    return samples[samples.length >> 1]!;
  }

  #average(times: Float32Array): number {
    let total = 0;
    let count = 0;
    for (const value of times) {
      if (value <= 0) continue;
      total += value;
      count += 1;
    }
    return count === 0 ? 0 : total / count;
  }

  /** F1 — the colophon: what Iris is made of, measured live. */
  #drawColophon(height: number, opacity: number): void {
    const renderer = this.renderer;
    const type = this.type;
    const uv = this.#wallpaper!.uv;
    const x = 48 + (1 - this.#colophon.value) * -40;
    const y = 136;
    const panelHeight = height - y - 118;
    const panel: PanelStyle = { border: white(0.16), fill: [0.02, 0.022, 0.03, 0.66], frost: 0.3, frostBrightness: 0.9, opacity, radius: 22, shadow: 0.45, shadowSigma: 30, sheen: 0.03 };
    renderer.panel(x, y, COLOPHON_WIDTH, panelHeight, panel, uv);
    if (this.#time - this.#figures.updatedAt > 0.25) {
      const frame = this.#average(this.#frameTimes);
      const live = this.#order.filter((card) => card.capture?.texture != null).length;
      this.#figures = {
        cpu: `${this.#median(this.#cpuTimes).toFixed(2)} ms`,
        fps: frame > 0 ? `${Math.round(1 / frame)}` : '—',
        frame: `${renderer.drawCallsLastFrame} draws from one ${(renderer.uploadBytesLastFrame / 1024).toFixed(1)} KB upload · ${renderer.stateChangesLastFrame} state changes · ${live} live captures + ${this.#order.length - live} minimized windows seen through DWM`,
        gpu: `${renderer.gpuTimer.milliseconds.toFixed(2)} ms`,
        updatedAt: this.#time,
      };
    }
    const place = (entry: TextEntry, left: number, top: number, alpha = 1): void => renderer.text(left - entry.padding, top - entry.padding, entry.width, entry.height, this.text.view, entry.uv, [1, 1, 1, 1], opacity * alpha);
    const inner = x + 32;
    const innerWidth = COLOPHON_WIDTH - 64;
    place(this.text.get('Under the hood', type.colophonTitle), inner, y + 30);
    place(this.text.get('Everything you see is TypeScript talking to Windows directly.', { ...type.colophonBody, lines: 2 }, innerWidth), inner, y + 70);
    const tiles: [string, string][] = [
      [this.#figures.cpu, 'CPU per frame'],
      [this.#figures.gpu, 'GPU per frame'],
      [this.#figures.fps, 'frames per second'],
      [this.#stats.indexedWords.toLocaleString('en-US'), `words read in ${this.#stats.indexedWindows} windows`],
    ];
    const tileWidth = (innerWidth - 16) / 2;
    tiles.forEach(([figure, label], index) => {
      const tileX = inner + (index % 2) * (tileWidth + 16);
      const tileY = y + 112 + Math.floor(index / 2) * 92;
      const tile: PanelStyle = { border: white(0.1), fill: [0.05, 0.055, 0.075, 0.6], frost: 0, frostBrightness: 0, opacity, radius: 14, shadow: 0, shadowSigma: 0, sheen: 0.03 };
      renderer.panel(tileX, tileY, tileWidth, 80, tile, uv);
      place(this.text.get(figure, type.colophonFigure), tileX + 18, tileY + 12);
      place(this.text.get(label, type.colophonLabel), tileX + 18, tileY + 54);
    });
    const graphY = y + 312;
    place(this.text.get('CPU COST PER FRAME · LAST 2 SECONDS', type.colophonLabel), inner, graphY);
    const bars = 120;
    const barWidth = innerWidth / bars;
    const graphHeight = 64;
    const budget = 2;
    const baseline = graphY + 26 + graphHeight;
    const line: PanelStyle = { border: [0, 0, 0, 0], fill: white(0.14), frost: 0, frostBrightness: 0, opacity, radius: 0.5, shadow: 0, shadowSigma: 0, sheen: 0 };
    renderer.panel(inner, baseline - graphHeight, innerWidth, 1, line, uv);
    for (let index = 0; index < bars; index += 1) {
      const sample = this.#cpuTimes[(this.#cpuCursor - bars + index + this.#cpuTimes.length * 2) % this.#cpuTimes.length]!;
      if (sample <= 0) continue;
      const barHeight = Math.max(2, Math.min(graphHeight, (sample / budget) * graphHeight));
      const fill: readonly [number, number, number, number] = sample > budget * 1.5 ? [0.86, 0.4, 0.32, 0.9] : tinted(this.accent, 0.85);
      const bar: PanelStyle = { border: [0, 0, 0, 0], fill, frost: 0, frostBrightness: 0, opacity, radius: 1, shadow: 0, shadowSigma: 0, sheen: 0 };
      renderer.panel(inner + index * barWidth + 0.5, baseline - barHeight, Math.max(1, barWidth - 1.5), barHeight, bar, uv);
    }
    place(this.text.get('2 ms — a 60 Hz frame allows 16.7', type.caption), inner + innerWidth - 176, baseline - graphHeight - 18, 0.8);
    const sections: [string, string][] = [
      [
        'THE STACK',
        'Direct3D 11, DirectComposition, Windows.Graphics.Capture, Windows.Media.Ocr, UI Automation, DirectWrite, Direct2D, WIC and DWM thumbnails — every one called from TypeScript through bun:ffi. No C++, no node-gyp, no native addon, no Electron.',
      ],
      ['THIS FRAME', this.#figures.frame],
      [
        'THREADS',
        'Rendering and input on the main thread at the display’s refresh rate. OCR and accessibility reading on a Bun worker with its own COM apartment and GPU device. WinRT async work is polled — native code never calls back into JavaScript.',
      ],
      ['THE CODE', `${this.#sourceLines.toLocaleString('en-US')} lines of strict TypeScript in ${this.#sourceFiles} files · zero dependencies beyond the bindings · no build step · cold boot ${Math.round(this.bootMilliseconds)} ms`],
    ];
    let sectionY = baseline + 32;
    for (const [label, body] of sections) {
      const text = this.text.get(body, { ...type.colophonBody, lines: 5 }, innerWidth, undefined, 140);
      if (sectionY + 20 + text.inkHeight > y + panelHeight - 24) break;
      place(this.text.get(label, type.colophonLabel), inner, sectionY);
      place(text, inner, sectionY + 20);
      sectionY += 20 + text.inkHeight + 22;
    }
  }

  #drawFooter(width: number, height: number, chrome: number): void {
    const renderer = this.renderer;
    const type = this.type;
    const hints: [string, string][] = [
      ['← → ↑ ↓', 'move'],
      ['Enter', 'go'],
      ['Tab', 'layout'],
      ['Ctrl W', 'close window'],
      ['Esc', 'back'],
      ['F1', 'under the hood'],
    ];
    const pieces = hints.map(([key, label]) => ({ key: this.text.get(key, type.footerKey), label: this.text.get(label, type.footerText) }));
    let total = 0;
    for (const piece of pieces) total += piece.key.inkWidth + 16 + 7 + piece.label.inkWidth + 26;
    let x = (width - total) / 2;
    const y = height - 54 + (1 - chrome) * 20;
    for (const piece of pieces) {
      const keyWidth = piece.key.inkWidth + 16;
      const keyStyle: PanelStyle = { border: white(0.16), fill: [0.06, 0.065, 0.08, 0.35], frost: 0.4, frostBrightness: 1.3, opacity: chrome, radius: 6, shadow: 0, shadowSigma: 0, sheen: 0.04 };
      renderer.panel(x, y, keyWidth, 24, keyStyle, this.#wallpaper!.uv);
      renderer.text(x + 8 - piece.key.padding, y + (24 - piece.key.inkHeight) / 2 - piece.key.padding, piece.key.width, piece.key.height, this.text.view, piece.key.uv, [1, 1, 1, 1], chrome);
      x += keyWidth + 7;
      renderer.text(x - piece.label.padding, y + (24 - piece.label.inkHeight) / 2 - piece.label.padding, piece.label.width, piece.label.height, this.text.view, piece.label.uv, [1, 1, 1, 1], chrome);
      x += piece.label.inkWidth + 26;
    }
  }
}

export type { Card };
