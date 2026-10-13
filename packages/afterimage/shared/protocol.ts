// Messages between the eye (main thread: windows, input, rendering) and the memory (worker:
// capture, journal, composition). Moments never cross this boundary as pixels — they travel as
// shared GPU textures; only small metadata and, on explicit export, one image travel here.

/** A gap in the record: why the timeline has no frames between `from` and `to` (epoch ms). */
export interface Gap {
  from: number;
  kind: 'locked' | 'paused' | 'unavailable';
  to: number;
}

export interface DisplayInfo {
  height: number;
  index: number;
  left: number;
  name: string;
  tilesAcross: number;
  tilesDown: number;
  top: number;
  /** Legacy shared handles of the two view textures the composer writes and the eye samples. */
  views: [bigint, bigint];
  width: number;
}

/** Tile-space rectangle, inclusive of `left/top`, exclusive of `right/bottom`. */
export interface TileRegion {
  bottom: number;
  left: number;
  right: number;
  top: number;
}

export interface MemoryStats {
  budgetBytes: number;
  captureHertz: number;
  compressionRatio: number;
  cpuPercent: number;
  dedupPercent: number;
  fingerprintMilliseconds: number;
  frames: number;
  oldestEpoch: number;
  storedBytes: number;
  tiles: number;
  uniqueTiles: number;
}

/** Everything the timeline needs: one entry per journaled frame, oldest first. */
export interface TimelineSlice {
  /** Absolute index of `epochs[0]` — frame indices are never reused, so eviction never shifts them. */
  firstFrame: number;
  changed: Uint32Array;
  cursorX: Int32Array;
  cursorY: Int32Array;
  epochs: Float64Array;
  gaps: Gap[];
}

export interface WorkerOptions {
  budgetBytes: number;
  captureHertz: number;
  /** `screen` records the real desktop; `stage` records the synthetic desktop used for tests and media. */
  source: 'screen' | 'stage';
  stageHeight: number;
  stageScenario: string;
  stageWidth: number;
}

export type EyeMessage =
  | { type: 'budget'; bytes: number }
  | { type: 'close' }
  | { type: 'export'; frame: number; region: TileRegion | null; request: number; target: 'clipboard' | 'png' }
  | { type: 'forget' }
  | { type: 'open'; display: number }
  | { type: 'pause' }
  | { type: 'quit' }
  | { type: 'regionStep'; direction: -1 | 1; frame: number; region: TileRegion; request: number }
  | { type: 'resume' }
  | { type: 'seek'; frame: number; request: number }
  | { type: 'stage'; milliseconds: number };

export type MemoryMessage =
  | { type: 'appended'; display: number; slice: TimelineSlice }
  | { type: 'error'; message: string }
  | { type: 'exported'; bitmap: Uint8Array | null; height: number; path: string | null; request: number; width: number }
  | { type: 'forgotten' }
  | { type: 'opened'; display: number; frame: number; slice: TimelineSlice; view: 0 | 1 }
  | { type: 'ready'; bootMilliseconds: number; displays: DisplayInfo[] }
  | { type: 'recording'; reason: string | null; state: 'paused' | 'recording' | 'unavailable' }
  | { type: 'shown'; changedTiles: Uint32Array; composeMilliseconds: number; frame: number; request: number; view: 0 | 1 }
  | { type: 'staged'; milliseconds: number }
  | { type: 'stats'; stats: MemoryStats }
  | { type: 'stepped'; frame: number; request: number };
