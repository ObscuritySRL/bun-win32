// One display's recording: acquire → fingerprint → decide what to keep → store → journal.
// Deciding is where Afterimage stays light. Each tile has a heat that rises while it changes every
// capture (video, games, a long scroll) and decays when it doesn't. Cold tiles — your text, your
// UI — are kept at full resolution on every capture. Hot tiles are kept in phase at 2 Hz and at a
// quarter of the resolution, in their own dedup keyspace; when they settle, their final state is
// recorded crisp. Video becomes a flipbook; words stay pixel-perfect.

import type { Gap, TileRegion } from '../shared/protocol';
import { Composer } from './composer';
import type { FrameSource } from './duplication';
import { Fingerprinter, tileSize } from './fingerprint';
import { Journal } from './journal';
import { reduce } from './resample';
import { type ReadWord, TextIndex } from './textindex';
import type { TileStore } from './store';

const heatCeiling = 16;
/** Below this share of pixels equal to their left neighbour, a tile is photographic (video, a game, a photo). */
const photographicRuns = 0.3;
const hotInterval = 500;
const hotThreshold = 4;
const reducedKeyspace = 0x5a5a_5a5a;
const reopenInterval = 1_000;
/** Pixels must hold still this long before they are read: what flickers past isn't text anyone read either. */
const settleTime = 800;
/** OCR needs context: a region read only where pixels changed cuts lines and words at its edges. */
const readingPadding = { across: 6, down: 1 } as const;

export interface RecorderTotals {
  changedTiles: number;
  compressedBytes: number;
  dedupHits: number;
  fingerprintMilliseconds: number;
  fingerprints: number;
  rawBytes: number;
  reducedTiles: number;
}

export type CaptureOutcome = 'frame' | 'idle' | 'lost' | 'recovered';

/** A region of settled pixels to read, and the frames that frame its reading. */
export interface ReadingJob {
  /** Each tile's latest change when the read began — a word appeared when the tiles under it last changed. */
  changedAt: Map<number, number>;
  /** The frame whose pixels are read. */
  frame: number;
  region: TileRegion;
  /** The frame the region's content appeared (its latest change). */
  since: number;
  tiles: number[];
}

export class Recorder {
  readonly composer: Composer;
  readonly fingerprinter: Fingerprinter;
  readonly journal: Journal;
  /** Newest frame already sent to the eye while it is open. */
  sentThrough = -1;
  readonly source: FrameSource;
  /** Every word read from this display, with the frames it was visible. */
  readonly text: TextIndex;
  readonly #clock: () => number;
  #cursorX = -1;
  #cursorY = -1;
  #gapKind: Gap['kind'] | null = null;
  #gapStart = 0;
  readonly #changedEpoch: Float64Array;
  readonly #changedFrame: Int32Array;
  readonly #heat: Uint8Array;
  #lastCapture = -Infinity;
  #lastHot = 0;
  #lastReopen = 0;
  readonly #pending: Uint8Array;
  readonly #recordedHigh: Uint32Array;
  readonly #recordedLow: Uint32Array;
  readonly #recordedReduced: Uint8Array;
  readonly #store: TileStore;
  readonly #totals: RecorderTotals;
  readonly #unread: Uint8Array;

  /** `clock` gives epoch milliseconds: Date.now for the desktop, the stage's virtual clock for tests. */
  constructor(source: FrameSource, store: TileStore, totals: RecorderTotals, clock: () => number) {
    this.#clock = clock;
    const { height, width } = source.description;
    this.source = source;
    this.#store = store;
    this.#totals = totals;
    this.fingerprinter = new Fingerprinter(width, height);
    this.journal = new Journal(this.fingerprinter.tileCount);
    this.composer = new Composer(width, height, this.fingerprinter.tilesAcross, this.journal, store);
    this.text = new TextIndex(this.fingerprinter.tilesAcross);
    const tiles = this.fingerprinter.tileCount;
    this.#changedEpoch = new Float64Array(tiles);
    this.#changedFrame = new Int32Array(tiles).fill(-1);
    this.#heat = new Uint8Array(tiles);
    this.#unread = new Uint8Array(tiles);
    this.#pending = new Uint8Array(tiles);
    this.#recordedHigh = new Uint32Array(tiles);
    this.#recordedLow = new Uint32Array(tiles);
    this.#recordedReduced = new Uint8Array(tiles);
    if (!source.reopen()) this.beginGap('unavailable');
  }

  get gapKind(): Gap['kind'] | null {
    return this.#gapKind;
  }

  /** When the newest capture ran (performance.now). */
  get lastCapture(): number {
    return this.#lastCapture;
  }

  /** Start a gap — or relabel one: the lock screen first shows up as lost access, then as a lock. */
  beginGap(kind: Gap['kind']): void {
    if (this.#gapKind !== null && !(kind === 'locked' && this.#gapKind === 'unavailable')) return;
    if (this.#gapKind === null) this.#gapStart = this.#clock();
    this.#gapKind = kind;
  }

  async capture(): Promise<CaptureOutcome> {
    this.#lastCapture = performance.now();
    const { fingerprinter, journal, source } = this;
    let recovered = false;
    if (!source.open) {
      if (performance.now() - this.#lastReopen < reopenInterval) return 'lost';
      this.#lastReopen = performance.now();
      if (!source.reopen()) return 'lost';
    }
    const acquired = source.acquire();
    if (acquired.status === 'lost') {
      this.beginGap('unavailable');
      return 'lost';
    }
    // A still screen sends no frames, but hot tiles must keep cooling until they are kept crisp:
    // fingerprint the newest capture against itself.
    let texture = fingerprinter.current;
    if (acquired.status === 'idle') {
      if (journal.frameCount === 0 || !this.#cooling()) return 'idle';
    } else {
      if (this.#gapKind === 'unavailable') {
        this.endGap();
        recovered = true;
      }
      if (acquired.pointerMoved) {
        this.#cursorX = acquired.pointerVisible ? acquired.pointerX : -1;
        this.#cursorY = acquired.pointerVisible ? acquired.pointerY : -1;
      }
      if (!acquired.imageUpdated && journal.frameCount > 0 && !this.#cooling()) {
        source.release();
        return recovered ? 'recovered' : 'idle';
      }
      if (acquired.imageUpdated || journal.frameCount === 0) texture = acquired.texture;
    }
    const epoch = this.#clock();
    const fingerprintStart = performance.now();
    fingerprinter.ingest(texture);
    if (acquired.status === 'frame') source.release();
    const words = await fingerprinter.tiles();
    this.#totals.fingerprintMilliseconds += performance.now() - fingerprintStart;
    this.#totals.fingerprints += 1;
    const hotTick = epoch - this.#lastHot >= hotInterval;
    if (hotTick) this.#lastHot = epoch;
    const recordTiles: number[] = [];
    const recordKeys: bigint[] = [];
    const fresh: number[] = [];
    const freshReduced = new Set<number>();
    const blobs = new Map<bigint, number>();
    for (let tile = 0; tile < fingerprinter.tileCount; tile += 1) {
      const changed = words[tile * 4] !== 0;
      const heat = this.#heat[tile]!;
      // Only photographic tiles heat up: text that changes every capture (typing, a scrolling log)
      // is exactly what must stay crisp.
      const photographic = words[tile * 4 + 3]! < this.#tilePixels(tile) * photographicRuns;
      this.#heat[tile] = changed && photographic ? Math.min(heatCeiling, heat + 1) : changed ? 0 : Math.max(0, heat - 1);
      if (changed) this.#pending[tile] = 1;
      const hot = this.#heat[tile]! >= hotThreshold;
      let reduced: boolean;
      if (this.#pending[tile] === 1) {
        if (!hot) reduced = false;
        else if (hotTick) reduced = true;
        else continue;
      } else if (this.#recordedReduced[tile] === 1 && this.#heat[tile] === 0) reduced = false;
      else continue;
      this.#pending[tile] = 0;
      const high = words[tile * 4 + 1]!;
      const low = reduced ? (words[tile * 4 + 2]! ^ reducedKeyspace) >>> 0 : words[tile * 4 + 2]!;
      if (high === this.#recordedHigh[tile] && low === this.#recordedLow[tile] && journal.frameCount > 0) continue;
      this.#recordedHigh[tile] = high;
      this.#recordedLow[tile] = low;
      this.#recordedReduced[tile] = reduced ? 1 : 0;
      const key = (BigInt(high) << 32n) | BigInt(low);
      recordTiles.push(tile);
      recordKeys.push(key);
      if (blobs.has(key)) {
        this.#totals.dedupHits += 1;
        continue;
      }
      const known = this.#store.lookup(high, low);
      if (known >= 0) {
        this.#totals.dedupHits += 1;
        blobs.set(key, known);
        continue;
      }
      blobs.set(key, -1);
      fresh.push(tile);
      if (reduced) freshReduced.add(tile);
    }
    if (recordTiles.length === 0) return recovered ? 'recovered' : 'idle';
    await fingerprinter.readTiles(fresh, (tile, pixels) => {
      const columns = Math.min(tileSize, fingerprinter.width - (tile % fingerprinter.tilesAcross) * tileSize);
      const rows = Math.min(tileSize, fingerprinter.height - Math.floor(tile / fingerprinter.tilesAcross) * tileSize);
      const kept = freshReduced.has(tile) ? reduce(pixels, columns, rows) : pixels;
      const compressed = Bun.zstdCompressSync(kept, { level: 1 });
      this.#totals.rawBytes += kept.byteLength;
      this.#totals.compressedBytes += compressed.byteLength;
      if (freshReduced.has(tile)) this.#totals.reducedTiles += 1;
      const high = this.#recordedHigh[tile]!;
      const low = this.#recordedLow[tile]!;
      blobs.set((BigInt(high) << 32n) | BigInt(low), this.#store.insert(high, low, compressed, freshReduced.has(tile)));
    });
    // Journal the whole frame synchronously, after every blob exists: no await may split it.
    const frame = journal.appendFrame(epoch, recordTiles.length, this.#cursorX, this.#cursorY);
    for (let index = 0; index < recordTiles.length; index += 1) {
      const blob = blobs.get(recordKeys[index]!)!;
      this.#store.retain(blob);
      journal.record(recordTiles[index]!, frame, blob);
    }
    this.#totals.changedTiles += recordTiles.length;
    for (const tile of recordTiles) {
      this.#changedEpoch[tile] = epoch;
      this.#changedFrame[tile] = frame;
      this.#unread[tile] = this.#recordedReduced[tile] === 1 ? 0 : 1;
    }
    this.text.close(recordTiles, frame);
    return 'frame';
  }

  dispose(): void {
    this.source.close();
    this.composer.dispose();
    this.fingerprinter.release();
  }

  endGap(): void {
    if (this.#gapKind === null) return;
    this.journal.markGap({ from: this.#gapStart, kind: this.#gapKind, to: this.#clock() });
    this.#gapKind = null;
  }

  /**
   * Words OCR found in a region read at `job.frame`: visible since the region settled, and already
   * over for any tile that has changed since the read began.
   */
  indexWords(words: readonly ReadWord[], job: ReadingJob): void {
    const offsetX = job.region.left * tileSize;
    const offsetY = job.region.top * tileSize;
    const { tilesAcross } = this.fingerprinter;
    for (const word of words) {
      const rect: [number, number, number, number] = [word.rect[0] + offsetX, word.rect[1] + offsetY, word.rect[2] + offsetX, word.rect[3] + offsetY];
      let since = this.journal.firstFrame;
      for (let y = Math.floor(rect[1] / tileSize); y <= Math.floor((rect[3] - 1) / tileSize); y += 1) {
        for (let x = Math.floor(rect[0] / tileSize); x <= Math.floor((rect[2] - 1) / tileSize); x += 1) since = Math.max(since, job.changedAt.get(y * tilesAcross + x) ?? job.since);
      }
      this.text.add([{ line: word.line, rect, text: word.text }], since);
    }
    for (const tile of job.tiles) if (this.#changedFrame[tile]! > job.frame) this.text.close([tile], this.#changedFrame[tile]!);
  }

  /**
   * The next region worth reading: unread tiles (not photographic) that have held still for
   * `settleTime` (or any unread tiles when `settle` is set), grouped by connectivity.
   */
  nextReading(now: number, settle: boolean): ReadingJob | null {
    const { tilesAcross, tilesDown } = this.fingerprinter;
    const ready = (tile: number): boolean => this.#unread[tile] === 1 && (settle || now - this.#changedEpoch[tile]! >= settleTime);
    for (let start = 0; start < this.#unread.length; start += 1) {
      if (!ready(start)) continue;
      const tiles: number[] = [];
      const queue = [start];
      this.#unread[start] = 0;
      let [left, top, right, bottom] = [tilesAcross, tilesDown, 0, 0];
      let since = -1;
      while (queue.length > 0) {
        const tile = queue.pop()!;
        tiles.push(tile);
        const x = tile % tilesAcross;
        const y = Math.floor(tile / tilesAcross);
        left = Math.min(left, x);
        top = Math.min(top, y);
        right = Math.max(right, x + 1);
        bottom = Math.max(bottom, y + 1);
        since = Math.max(since, this.#changedFrame[tile]!);
        for (const [neighbourX, neighbourY] of [
          [x - 1, y],
          [x + 1, y],
          [x, y - 1],
          [x, y + 1],
        ] as const) {
          if (neighbourX < 0 || neighbourY < 0 || neighbourX >= tilesAcross || neighbourY >= tilesDown) continue;
          const neighbour = neighbourY * tilesAcross + neighbourX;
          if (!ready(neighbour)) continue;
          this.#unread[neighbour] = 0;
          queue.push(neighbour);
        }
      }
      left = Math.max(0, left - readingPadding.across);
      right = Math.min(tilesAcross, right + readingPadding.across);
      top = Math.max(0, top - readingPadding.down);
      bottom = Math.min(tilesDown, bottom + readingPadding.down);
      const changedAt = new Map<number, number>();
      for (let y = top; y < bottom; y += 1) for (let x = left; x < right; x += 1) changedAt.set(y * tilesAcross + x, this.#changedFrame[y * tilesAcross + x]!);
      return { changedAt, frame: this.journal.lastFrame, region: { bottom, left, right, top }, since: Math.max(since, this.journal.firstFrame), tiles };
    }
    return null;
  }

  /** Forget everything this display remembers. */
  forget(): void {
    this.text.clear();
    this.#unread.fill(0);
    this.journal.clear((blob) => this.#store.release(blob));
    this.composer.forgetAll();
    this.fingerprinter.invalidate();
    this.#heat.fill(0);
    this.#pending.fill(0);
    this.#recordedHigh.fill(0);
    this.#recordedLow.fill(0);
    this.#recordedReduced.fill(0);
    this.sentThrough = this.journal.lastFrame;
  }

  /** Some tile was last kept reduced and is still cooling — it needs one more capture to be kept crisp. */
  #cooling(): boolean {
    for (let tile = 0; tile < this.#heat.length; tile += 1) if (this.#heat[tile]! > 0 || this.#pending[tile] === 1) return true;
    return false;
  }

  #tilePixels(tile: number): number {
    const { fingerprinter } = this;
    const columns = Math.min(tileSize, fingerprinter.width - (tile % fingerprinter.tilesAcross) * tileSize);
    const rows = Math.min(tileSize, fingerprinter.height - Math.floor(tile / fingerprinter.tilesAcross) * tileSize);
    return columns * rows;
  }
}
