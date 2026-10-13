// One display's recording: acquire → fingerprint → decide what to keep → store → journal.
// Deciding is where Afterimage stays light. Each tile has a heat that rises while it changes every
// capture (video, games, a long scroll) and decays when it doesn't. Cold tiles — your text, your
// UI — are kept at full resolution on every capture. Hot tiles are kept in phase at 2 Hz and at a
// quarter of the resolution, in their own dedup keyspace; when they settle, their final state is
// recorded crisp. Video becomes a flipbook; words stay pixel-perfect.

import type { Gap } from '../shared/protocol';
import { Composer } from './composer';
import type { FrameSource } from './duplication';
import { Fingerprinter, tileSize } from './fingerprint';
import { Journal } from './journal';
import { reduce } from './resample';
import type { TileStore } from './store';

const heatCeiling = 16;
/** Below this share of pixels equal to their left neighbour, a tile is photographic (video, a game, a photo). */
const photographicRuns = 0.3;
const hotInterval = 500;
const hotThreshold = 4;
const reducedKeyspace = 0x5a5a_5a5a;
const reopenInterval = 1_000;

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

export class Recorder {
  readonly composer: Composer;
  readonly fingerprinter: Fingerprinter;
  readonly journal: Journal;
  readonly source: FrameSource;
  /** Newest frame already sent to the eye while it is open. */
  sentThrough = -1;
  #cursorX = -1;
  #cursorY = -1;
  #gapKind: Gap['kind'] | null = null;
  #gapStart = 0;
  readonly #heat: Uint8Array;
  #lastHot = 0;
  #lastCapture = -Infinity;
  #lastReopen = 0;
  readonly #pending: Uint8Array;
  readonly #recordedHigh: Uint32Array;
  readonly #recordedLow: Uint32Array;
  readonly #recordedReduced: Uint8Array;
  readonly #clock: () => number;
  readonly #store: TileStore;
  readonly #totals: RecorderTotals;

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
    const tiles = this.fingerprinter.tileCount;
    this.#heat = new Uint8Array(tiles);
    this.#pending = new Uint8Array(tiles);
    this.#recordedHigh = new Uint32Array(tiles);
    this.#recordedLow = new Uint32Array(tiles);
    this.#recordedReduced = new Uint8Array(tiles);
    if (!source.reopen()) this.beginGap('unavailable');
  }

  get gapKind(): Gap['kind'] | null {
    return this.#gapKind;
  }

  beginGap(kind: Gap['kind']): void {
    if (this.#gapKind !== null) return;
    this.#gapKind = kind;
    this.#gapStart = this.#clock();
  }

  /** When the newest capture ran (performance.now). */
  get lastCapture(): number {
    return this.#lastCapture;
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

  /** Forget everything this display remembers. */
  forget(): void {
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

  #tilePixels(tile: number): number {
    const { fingerprinter } = this;
    const columns = Math.min(tileSize, fingerprinter.width - (tile % fingerprinter.tilesAcross) * tileSize);
    const rows = Math.min(tileSize, fingerprinter.height - Math.floor(tile / fingerprinter.tilesAcross) * tileSize);
    return columns * rows;
  }

  /** Some tile was last kept reduced and is still cooling — it needs one more capture to be kept crisp. */
  #cooling(): boolean {
    for (let tile = 0; tile < this.#heat.length; tile += 1) if (this.#heat[tile]! > 0 || this.#pending[tile] === 1) return true;
    return false;
  }
}
