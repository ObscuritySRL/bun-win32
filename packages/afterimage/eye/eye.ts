// The eye's controller: it talks to the memory (worker), owns the renderer and the eye-side handles
// of the shared moment textures, and runs a View through its life — open on frame 0, exhale, scrub,
// breathe back in, hide. It draws through a Presenter, so the same code drives the real overlay
// window and the headless offscreen runner.

import { FFIType, ptr } from 'bun:ffi';

import { CTX_END, CTX_GET_DATA, DEV_CREATE_QUERY, IID_ID3D11TEXTURE2D, createComputeDevice, requireGpu, vcall } from '@bun-win32/gpu';

import { callOut, guid } from '../shared/com';
import type { Painter } from '../shared/painter';
import type { DisplayInfo, EyeMessage, MemoryMessage, TileRegion, TimelineSlice, WorkerOptions } from '../shared/protocol';
import { D3D11Device } from '../shared/slots';
import { copy } from './copy';
import { Renderer, type Surface } from './renderer';
import { FrameMeter } from './stats';
import { type Diagnostics, View, type ViewHost } from './view';
import type { InputEvent } from './window';

export interface Clock {
  /** Wall-clock epoch milliseconds (virtual in headless stage mode). */
  epoch(): number;
  /** Monotonic milliseconds for animation. */
  now(): number;
}

/** Where frames go: the overlay window's swap chain, or an offscreen texture. */
export interface Presenter {
  hide(): void;
  /** Cover `display` (still invisible) and, when live, take keyboard focus. */
  prepare(display: DisplayInfo): void;
  present(): void;
  /** Make the prepared window visible — after its first frame is presented. */
  reveal(): void;
  /** A surface the size of `display`, scale for its monitor. */
  surface(display: DisplayInfo): { scale: number; surface: Surface };
  /** Wait until the display wants another frame. */
  wait(): void;
}

export interface EyeCallbacks {
  /** The clipboard wants an image (the shell owns the window the clipboard needs). */
  copyImage(dib: Uint8Array): void;
  readClipboardText(): string;
  recording(state: 'paused' | 'recording' | 'unavailable'): void;
  unavailable(): void;
}

export class Eye {
  readonly diagnostics: Diagnostics = { bootMilliseconds: 0, composeMilliseconds: 0, frameMedian: 0, frameWorst: 0, openMilliseconds: 0, refreshHertz: 0, stats: null };
  readonly frames = new FrameMeter();
  #currentView: 0 | 1 = 0;
  /** Something the view shows changed outside its springs (a new moment, new frames): draw once more. */
  #dirty = false;
  #displays: DisplayInfo[] = [];
  #fenceArmed = false;
  #latestSeek = 0;
  #latestShown = 0;
  #needFence = false;
  #pendingExports = 0;
  #pendingSteps = 0;
  #opening: { at: number; display: number } | null = null;
  #paused = false;
  #pendingRelease: 0 | 1 | null = null;
  #query = 0n;
  #ready: Promise<void>;
  #renderer: Renderer | null = null;
  #request = 0;
  readonly #stageWaiters: (() => void)[] = [];
  #textures: [bigint, bigint][] = [];
  #view: View | null = null;
  readonly #callbacks: EyeCallbacks;
  readonly #clock: Clock;
  readonly #presenter: Presenter;
  readonly #worker: Worker;

  constructor(worker: Worker, options: WorkerOptions, presenter: Presenter, clock: Clock, callbacks: EyeCallbacks) {
    this.#worker = worker;
    this.#presenter = presenter;
    this.#clock = clock;
    this.#callbacks = callbacks;
    this.#ready = new Promise((resolve) => {
      worker.onmessage = (event: MessageEvent<MemoryMessage>) => {
        if (event.data.type === 'ready') {
          this.#boot(event.data.adapter, event.data.displays, event.data.bootMilliseconds);
          resolve();
        } else this.#receive(event.data);
      };
    });
    worker.onerror = (event: ErrorEvent) => console.error(`[memory] crashed: ${event.message}`);
    worker.addEventListener('close', () => console.error('[memory] stopped'));
    this.#send({ options, type: 'init' });
  }

  /** Resolves once the memory has captured its first frame and the eye can open. */
  get ready(): Promise<void> {
    return this.#ready;
  }

  /** Waiting on the memory for something (an open, a seek, a step, an export, a stage advance). */
  get busy(): boolean {
    return this.#opening !== null || (this.#view !== null && this.#latestShown < this.#latestSeek) || this.#pendingSteps > 0 || this.#pendingExports > 0 || this.#stageWaiters.length > 0;
  }

  /** Direct2D on the eye's device (the tray icon and the swap chain need it). */
  get painter(): Painter {
    return this.#renderer!.painter;
  }

  get displays(): readonly DisplayInfo[] {
    return this.#displays;
  }

  get paused(): boolean {
    return this.#paused;
  }

  /** Open, or turn around if already on the way out; close if open. */
  toggle(display: number): void {
    const now = this.#clock.now();
    if (this.#view === null) {
      this.open(display);
      return;
    }
    if (this.#view.finished(now)) return;
    if (this.#view.closing) this.#view.reopen(now);
    else this.#view.close(now);
  }

  open(display: number): void {
    if (this.#view !== null || this.#opening !== null || this.#renderer === null) return;
    this.#opening = { at: this.#clock.now(), display };
    this.#send({ display, type: 'open' });
  }

  /** One turn of the render loop: input, animation, a frame if anything moved. Returns whether it drew. */
  step(events: readonly InputEvent[]): boolean {
    this.#pollFence();
    const view = this.#view;
    if (view === null || this.#renderer === null) return false;
    const now = this.#clock.now();
    view.handle(events, now);
    if (view.finished(now)) {
      this.#presenter.hide();
      this.#send({ type: 'close' });
      this.#view = null;
      this.frames.rest();
      this.#fenceArmed = false;
      this.#pendingRelease = null;
      return false;
    }
    if (!view.animating(now) && events.length === 0 && !this.#dirty) {
      this.frames.rest();
      return false;
    }
    this.#dirty = false;
    this.#presenter.wait();
    this.#draw(view, this.#clock.now());
    this.#presenter.present();
    this.frames.presented(this.#clock.now());
    this.#afterPresent();
    this.diagnostics.frameWorst = this.frames.worst;
    this.diagnostics.frameMedian = this.frames.median;
    if (this.frames.median > 0) this.diagnostics.refreshHertz = 1_000 / this.frames.median;
    return true;
  }

  get visible(): boolean {
    return this.#view !== null;
  }

  /** Draw the current state again without presenting (headless shots). */
  redraw(): void {
    if (this.#view !== null && this.#renderer !== null) this.#draw(this.#view, this.#clock.now());
  }

  /** Advance the stage's virtual clock and let the memory record it. */
  stage(milliseconds: number): Promise<void> {
    return new Promise((resolve) => {
      this.#stageWaiters.push(resolve);
      this.#send({ milliseconds, type: 'stage' });
    });
  }

  /**
   * Build everything the first open needs — swap chain, blur chain, Direct2D target, text formats —
   * by drawing one hidden frame, so the hotkey's first press is as fast as every other.
   */
  warm(display: DisplayInfo): void {
    const renderer = this.#renderer;
    if (renderer === null) return;
    const { scale, surface } = this.#presenter.surface(display);
    renderer.setMoment(this.#textures[display.index]![0]);
    renderer.prepare(display.tilesAcross, display.tilesDown, 0x100);
    const now = this.#clock.now();
    const view = new View(this.#host(), renderer, display, scale, this.diagnostics, () => this.#clock.epoch(), now);
    renderer.draw(surface, view.scene(now), scale, (painter) => view.text(painter, now));
  }

  /** Forward a raw protocol message (pause, budget, quit…). */
  send(message: EyeMessage): void {
    this.#send(message);
  }

  #afterPresent(): void {
    if (!this.#needFence) return;
    this.#needFence = false;
    vcall(requireGpu().context, CTX_END, [FFIType.u64], [this.#query], FFIType.void);
    this.#fenceArmed = true;
  }

  #boot(adapter: number, displays: DisplayInfo[], bootMilliseconds: number): void {
    createComputeDevice({ adapter });
    const { device } = requireGpu();
    this.#displays = displays;
    this.#textures = displays.map((display) => [this.#openShared(display.views[0]), this.#openShared(display.views[1])]);
    this.#renderer = new Renderer();
    this.#query = callOut(device, DEV_CREATE_QUERY, [FFIType.ptr], [ptr(new Uint32Array(new ArrayBuffer(8)))], 'CreateQuery(event)');
    this.diagnostics.bootMilliseconds = bootMilliseconds;
  }

  #draw(view: View, now: number): void {
    const renderer = this.#renderer!;
    const { scale, surface } = this.#presenter.surface(view.display);
    renderer.draw(surface, view.scene(now), scale, (painter) => view.text(painter, now));
  }

  #host(): ViewHost {
    return {
      clipboardText: () => this.#callbacks.readClipboardText(),
      closed: () => {},
      export: (frame: number, region: TileRegion | null, target: 'clipboard' | 'png') => {
        this.#pendingExports += 1;
        this.#send({ frame, region, request: ++this.#request, target, type: 'export' });
      },
      forget: () => this.#send({ type: 'forget' }),
      regionStep: (frame: number, direction: -1 | 1, region: TileRegion) => {
        this.#pendingSteps += 1;
        this.#send({ direction, frame, region, request: ++this.#request, type: 'regionStep' });
      },
      seek: (frame: number) => {
        this.#latestSeek = ++this.#request;
        this.#send({ frame, request: this.#latestSeek, type: 'seek' });
      },
      togglePause: () => this.#send({ type: this.#paused ? 'resume' : 'pause' }),
    };
  }

  #openShared(handle: bigint): bigint {
    return callOut(requireGpu().device, D3D11Device.OpenSharedResource, [FFIType.u64, FFIType.ptr], [handle, ptr(guid(IID_ID3D11TEXTURE2D))], 'OpenSharedResource');
  }

  /** Release the previous view once the GPU has finished every frame that sampled it. */
  #pollFence(): void {
    if (!this.#fenceArmed || this.#pendingRelease === null) return;
    const done = new Int32Array(new ArrayBuffer(4));
    if (vcall(requireGpu().context, CTX_GET_DATA, [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32], [this.#query, ptr(done), 4, 0]) !== 0) return;
    this.#send({ type: 'release', view: this.#pendingRelease });
    this.#pendingRelease = null;
    this.#fenceArmed = false;
  }

  #receive(message: MemoryMessage): void {
    const now = this.#clock.now();
    switch (message.type) {
      case 'appended':
        this.#view?.appended(message.slice);
        this.#dirty = true;
        break;
      case 'error':
        console.error(`[memory] ${message.message}`);
        break;
      case 'exported':
        this.#pendingExports = Math.max(0, this.#pendingExports - 1);
        if (message.bitmap !== null) {
          this.#callbacks.copyImage(message.bitmap);
          this.#view?.toast(copy.copied, now);
        } else this.#view?.toast(copy.saved, now);
        break;
      case 'forgotten':
        this.#view?.toast(copy.forgotten, now);
        this.#view?.close(now);
        break;
      case 'opened':
        this.#opened(message.display, message.frame, message.slice, message.view);
        break;
      case 'recording':
        this.#paused = message.state === 'paused';
        this.#view?.recording(message.state);
        this.#callbacks.recording(message.state);
        break;
      case 'shown':
        this.#latestShown = Math.max(this.#latestShown, message.request);
        this.diagnostics.composeMilliseconds = message.composeMilliseconds;
        if (this.#view === null) break;
        if (message.view !== this.#currentView) {
          this.#pendingRelease = this.#currentView;
          this.#currentView = message.view;
          this.#needFence = true;
          this.#fenceArmed = false;
        }
        this.#renderer!.setMoment(this.#textures[this.#view.display.index]![message.view]);
        this.#view.shown(message.frame, message.changedTiles, now);
        this.#dirty = true;
        break;
      case 'stats':
        this.diagnostics.stats = message.stats;
        this.#dirty = true;
        this.#view?.history.trimBefore(message.stats.oldestEpoch);
        break;
      case 'staged':
        this.#stageWaiters.shift()?.();
        break;
      case 'stepped':
        this.#pendingSteps = Math.max(0, this.#pendingSteps - 1);
        this.#view?.stepped(message.frame);
        break;
    }
  }

  /** The memory composed "now" into a shared texture: show it as frame 0, then exhale. */
  #opened(displayIndex: number, frame: number, slice: TimelineSlice, viewIndex: 0 | 1): void {
    const opening = this.#opening;
    this.#opening = null;
    const display = this.#displays[displayIndex];
    if (display === undefined || opening === null) return;
    if (frame < 0) {
      this.#send({ type: 'close' });
      this.#callbacks.unavailable();
      return;
    }
    const renderer = this.#renderer!;
    const { scale } = this.#presenter.surface(display);
    const now = this.#clock.now();
    const view = new View(this.#host(), renderer, display, scale, this.diagnostics, () => this.#clock.epoch(), now);
    this.#currentView = viewIndex;
    this.#pendingRelease = null;
    renderer.setMoment(this.#textures[displayIndex]![viewIndex]);
    view.begin(frame, slice, now);
    this.#presenter.prepare(display);
    this.#draw(view, now);
    this.#presenter.present();
    this.#draw(view, now);
    this.#presenter.present();
    this.#presenter.reveal();
    this.diagnostics.openMilliseconds = this.#clock.now() - opening.at;
    view.exhale(this.#clock.now());
    this.#view = view;
    this.frames.rest();
  }

  #send(message: EyeMessage): void {
    this.#worker.postMessage(message);
  }
}
