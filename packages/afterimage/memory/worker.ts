// The memory: a worker thread that owns its own Direct3D device and does everything heavy —
// capture, fingerprinting, compression, the journal, and composing moments for the eye. Work runs
// through one serial queue so a capture never interleaves with a seek: the journal is always
// consistent with the textures the composer copies from.

import { join } from 'node:path';
import { ptr } from 'bun:ffi';

import { createComputeDevice, encodePNGFromBGRA } from '@bun-win32/gpu';
import Shell32 from '@bun-win32/shell32';

import type { DisplayInfo, EyeMessage, MemoryMessage, MemoryStats, TileRegion, WorkerOptions } from '../shared/protocol';
import { Duplication, type FrameSource, findOutputs } from './duplication';
import { Recorder, type RecorderTotals } from './recorder';
import { Stage } from './stage';
import { TileStore } from './store';

declare var self: Worker;

const csidlMyPictures = 0x27;
const evictionPercent = 2;
const lookingInterval = 250;
const statsInterval = 1_000;

const startedAt = performance.now();
const recorders: Recorder[] = [];
const store = new TileStore();
const totals: RecorderTotals = { changedTiles: 0, compressedBytes: 0, dedupHits: 0, fingerprintMilliseconds: 0, fingerprints: 0, rawBytes: 0, reducedTiles: 0 };
let budgetBytes = 0x2000_0000;
let captureHertz = 20;
let chain: Promise<void> = Promise.resolve();
let lastCpu = process.cpuUsage();
let lastCpuWall = performance.now();
let lastStats = 0;
let openRecorder: Recorder | null = null;
let paused = false;
let pendingSeek: { frame: number; request: number } | null = null;
let quitting = false;
let stage: Stage | null = null;

function post(message: MemoryMessage, transfer: ArrayBuffer[] = []): void {
  self.postMessage(message, transfer);
}

function serial(task: () => Promise<void> | void): void {
  chain = chain.then(task).catch((error: unknown) => post({ message: error instanceof Error ? (error.stack ?? error.message) : String(error), type: 'error' }));
}

function appendToEye(recorder: Recorder): void {
  const { journal } = recorder;
  if (journal.lastFrame <= recorder.sentThrough) return;
  const slice = journal.slice(recorder.sentThrough + 1);
  recorder.sentThrough = journal.lastFrame;
  post({ display: recorders.indexOf(recorder), slice, type: 'appended' }, [slice.epochs.buffer, slice.changed.buffer, slice.cursorX.buffer, slice.cursorY.buffer]);
}

async function boot(options: WorkerOptions): Promise<void> {
  budgetBytes = options.budgetBytes;
  captureHertz = options.captureHertz;
  let adapter = 0;
  let sources: FrameSource[];
  if (options.source === 'stage') {
    createComputeDevice();
    stage = new Stage(options.stageWidth, options.stageHeight, options.stageScenario);
    sources = [stage];
  } else {
    const found = findOutputs();
    adapter = found.adapter;
    const { device } = createComputeDevice({ adapter });
    sources = found.outputs.map((output) => new Duplication(device, adapter, output));
  }
  for (const source of sources) recorders.push(new Recorder(source, store, totals));
  await captureAll();
  post({ adapter, bootMilliseconds: performance.now() - startedAt, displays: recorders.map(describe), type: 'ready' });
  if (stage === null) scheduleCapture();
}

async function captureAll(): Promise<void> {
  if (paused) return;
  for (const recorder of recorders) {
    const wasUnavailable = recorder.gapKind === 'unavailable';
    const outcome = await recorder.capture();
    if (outcome === 'lost' && !wasUnavailable) post({ reason: 'lost', state: 'unavailable', type: 'recording' });
    if (outcome === 'recovered') post({ reason: null, state: 'recording', type: 'recording' });
    if (outcome === 'frame' && openRecorder === recorder) appendToEye(recorder);
  }
  enforceBudget();
  postStats();
}

function describe(recorder: Recorder): DisplayInfo {
  const { description } = recorder.source;
  return {
    height: description.height,
    index: recorders.indexOf(recorder),
    left: description.left,
    name: description.name,
    tilesAcross: recorder.fingerprinter.tilesAcross,
    tilesDown: recorder.fingerprinter.tilesDown,
    top: description.top,
    views: recorder.composer.handles,
    width: description.width,
  };
}

/** Evict the oldest frames (of whichever display reaches furthest back) until within budget. */
function enforceBudget(): void {
  const freed = new Set<number>();
  const release = (blob: number): void => {
    if (store.release(blob)) freed.add(blob);
  };
  for (let guard = 0; guard < 0x40 && usedBytes() > budgetBytes; guard += 1) {
    let oldest: Recorder | null = null;
    for (const recorder of recorders) {
      const { journal } = recorder;
      if (journal.frameCount > 1 && (oldest === null || journal.epoch(journal.firstFrame) < oldest.journal.epoch(oldest.journal.firstFrame))) oldest = recorder;
    }
    if (oldest === null) break;
    const { journal } = oldest;
    journal.evictBefore(journal.firstFrame + Math.max(1, Math.ceil((journal.frameCount * evictionPercent) / 100)), release);
  }
  if (freed.size > 0) for (const recorder of recorders) recorder.composer.forget(freed);
}

async function exportFrame(frame: number, region: TileRegion | null, request: number, target: 'clipboard' | 'png'): Promise<void> {
  if (openRecorder === null) return;
  const { composer, journal } = openRecorder;
  const clamped = journal.clamp(frame);
  const { bitmap, height, width } = composer.export(clamped, region);
  if (target === 'clipboard') {
    post({ bitmap, height, path: null, request, type: 'exported', width }, [bitmap.buffer]);
    return;
  }
  const pictures = new Uint16Array(new ArrayBuffer(0x420));
  const folder = Shell32.SHGetFolderPathW(0n, csidlMyPictures, 0n, 0, ptr(pictures)) === 0 ? Buffer.from(pictures.buffer).toString('utf16le').replace(/\0.*$/s, '') : (Bun.env.USERPROFILE ?? '.');
  const stamp = new Date(journal.epoch(clamped));
  const two = (value: number): string => String(value).padStart(2, '0');
  const name = `Afterimage ${stamp.getFullYear()}-${two(stamp.getMonth() + 1)}-${two(stamp.getDate())} ${two(stamp.getHours())}.${two(stamp.getMinutes())}.${two(stamp.getSeconds())}.png`;
  const path = join(folder, 'Afterimage', name);
  await Bun.write(path, encodePNGFromBGRA(bitmap, width, height));
  post({ bitmap: null, height, path, request, type: 'exported', width });
}

function postStats(): void {
  const now = performance.now();
  if (now - lastStats < statsInterval) return;
  lastStats = now;
  const cpu = process.cpuUsage(lastCpu);
  const cpuPercent = ((cpu.user + cpu.system) / 1_000 / (now - lastCpuWall)) * 100;
  lastCpu = process.cpuUsage();
  lastCpuWall = now;
  let oldestEpoch = Date.now();
  let frames = 0;
  let tiles = 0;
  for (const { journal } of recorders) {
    frames += journal.frameCount;
    tiles += journal.tileCount;
    if (journal.frameCount > 0) oldestEpoch = Math.min(oldestEpoch, journal.epoch(journal.firstFrame));
  }
  const stats: MemoryStats = {
    budgetBytes,
    captureHertz: openRecorder === null ? captureHertz : 1_000 / lookingInterval,
    compressionRatio: totals.compressedBytes === 0 ? 0 : totals.rawBytes / totals.compressedBytes,
    cpuPercent,
    dedupPercent: totals.changedTiles === 0 ? 0 : (totals.dedupHits / totals.changedTiles) * 100,
    fingerprintMilliseconds: totals.fingerprints === 0 ? 0 : totals.fingerprintMilliseconds / totals.fingerprints,
    frames,
    oldestEpoch,
    reducedPercent: totals.changedTiles === 0 ? 0 : (totals.reducedTiles / totals.changedTiles) * 100,
    storedBytes: usedBytes(),
    tiles,
    uniqueTiles: store.unique,
  };
  post({ stats, type: 'stats' });
}

/** Record at the configured rate; while the eye is looking back, slow to 4 Hz so seeks come first. */
function scheduleCapture(): void {
  if (quitting) return;
  const started = performance.now();
  serial(async () => {
    await captureAll();
    const interval = openRecorder === null ? 1_000 / captureHertz : lookingInterval;
    setTimeout(scheduleCapture, Math.max(0, interval - (performance.now() - started)));
  });
}

function usedBytes(): number {
  return store.bytes + recorders.reduce((sum, recorder) => sum + recorder.journal.bytes, 0);
}

self.onmessage = (event: MessageEvent<EyeMessage>) => {
  const message = event.data;
  switch (message.type) {
    case 'budget':
      budgetBytes = message.bytes;
      serial(enforceBudget);
      break;
    case 'close':
      for (const recorder of recorders) recorder.composer.reset();
      serial(() => {
        openRecorder = null;
      });
      break;
    case 'export':
      serial(() => exportFrame(message.frame, message.region, message.request, message.target));
      break;
    case 'forget':
      serial(() => {
        for (const recorder of recorders) recorder.forget();
        store.clear();
        post({ type: 'forgotten' });
      });
      break;
    case 'init':
      serial(() => boot(message.options));
      break;
    case 'open':
      serial(async () => {
        const recorder = recorders[message.display];
        if (recorder === undefined) return;
        await recorder.capture();
        openRecorder = recorder;
        const { composer, fingerprinter, journal } = recorder;
        recorder.sentThrough = journal.lastFrame;
        if (journal.frameCount === 0) {
          post({ display: message.display, frame: -1, slice: journal.slice(journal.firstFrame), type: 'opened', view: 0 });
          return;
        }
        const composition = await composer.compose(journal.lastFrame, fingerprinter.current);
        const slice = journal.slice(journal.firstFrame);
        post({ display: message.display, frame: composition.frame, slice, type: 'opened', view: composition.view }, [slice.epochs.buffer, slice.changed.buffer, slice.cursorX.buffer, slice.cursorY.buffer]);
      });
      break;
    case 'pause':
      serial(() => {
        paused = true;
        for (const recorder of recorders) recorder.beginGap('paused');
        post({ reason: null, state: 'paused', type: 'recording' });
      });
      break;
    case 'quit':
      quitting = true;
      for (const recorder of recorders) recorder.composer.reset();
      serial(() => {
        for (const recorder of recorders) recorder.dispose();
        process.exit(0);
      });
      break;
    case 'regionStep':
      serial(() => {
        if (openRecorder === null) return;
        const { fingerprinter, journal } = openRecorder;
        const { region } = message;
        const tiles: number[] = [];
        for (let tileY = region.top; tileY < region.bottom; tileY += 1) for (let tileX = region.left; tileX < region.right; tileX += 1) tiles.push(tileY * fingerprinter.tilesAcross + tileX);
        post({ frame: journal.stepRegion(journal.clamp(message.frame), message.direction, tiles), request: message.request, type: 'stepped' });
      });
      break;
    case 'release':
      for (const recorder of recorders) recorder.composer.release(message.view);
      break;
    case 'resume':
      serial(() => {
        paused = false;
        for (const recorder of recorders) recorder.endGap();
        post({ reason: null, state: 'recording', type: 'recording' });
      });
      break;
    case 'seek': {
      const queued = pendingSeek !== null;
      pendingSeek = { frame: message.frame, request: message.request };
      if (queued) break;
      serial(async () => {
        const seek = pendingSeek;
        pendingSeek = null;
        if (seek === null || openRecorder === null || openRecorder.journal.frameCount === 0) return;
        const { composer, fingerprinter, journal } = openRecorder;
        const frame = journal.clamp(seek.frame);
        const composition = await composer.compose(frame, frame === journal.lastFrame ? fingerprinter.current : null);
        post({ changedTiles: composition.changedTiles, composeMilliseconds: composition.milliseconds, frame, request: seek.request, type: 'shown', view: composition.view }, [composition.changedTiles.buffer]);
      });
      break;
    }
    case 'stage':
      serial(async () => {
        if (stage === null) return;
        stage.advance(message.milliseconds);
        await captureAll();
        post({ milliseconds: message.milliseconds, type: 'staged' });
      });
      break;
  }
};
