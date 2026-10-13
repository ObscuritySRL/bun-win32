import { describe, expect, test } from 'bun:test';

import { Journal } from './journal';
import { TileStore } from './store';

function blob(byte: number, length = 8): Uint8Array {
  return new Uint8Array(length).fill(byte);
}

/** A 2×2-tile screen whose tiles change by script; each change is a fresh or deduplicated blob. */
function record(journal: Journal, store: TileStore, epoch: number, changes: [number, number][]): number {
  const frame = journal.appendFrame(epoch, changes.length, 0, 0);
  for (const [tile, content] of changes) {
    let id = store.lookup(content, 0);
    if (id < 0) id = store.insert(content, 0, blob(content));
    store.retain(id);
    journal.record(tile, frame, id);
  }
  return frame;
}

function shown(journal: Journal, store: TileStore, frame: number): number[] {
  const blobs = new Int32Array(journal.tileCount);
  journal.seek(frame, blobs);
  return [...blobs].map((id) => (id < 0 ? -1 : store.blob(id)[0]!));
}

describe('TileStore', () => {
  test('deduplicates by fingerprint and frees on the last release', () => {
    const store = new TileStore();
    const first = store.insert(7, 9, blob(1, 100));
    expect(store.lookup(7, 9)).toBe(first);
    expect(store.lookup(7, 8)).toBe(-1);
    store.retain(first);
    store.retain(first);
    expect(store.bytes).toBe(100);
    store.release(first);
    expect(store.lookup(7, 9)).toBe(first);
    store.release(first);
    expect(store.lookup(7, 9)).toBe(-1);
    expect(store.bytes).toBe(0);
    const reused = store.insert(1, 1, blob(2, 10));
    expect(reused).toBe(first);
    expect(store.unique).toBe(1);
  });
});

describe('Journal', () => {
  test('seek returns what each tile showed at that frame', () => {
    const journal = new Journal(4);
    const store = new TileStore();
    record(journal, store, 1_000, [
      [0, 10],
      [1, 11],
      [2, 12],
      [3, 13],
    ]);
    record(journal, store, 1_050, [[1, 21]]);
    record(journal, store, 1_100, [
      [1, 11],
      [3, 33],
    ]);
    expect(shown(journal, store, 0)).toEqual([10, 11, 12, 13]);
    expect(shown(journal, store, 1)).toEqual([10, 21, 12, 13]);
    expect(shown(journal, store, 2)).toEqual([10, 11, 12, 33]);
    expect(journal.firstFrame).toBe(0);
    expect(journal.lastFrame).toBe(2);
    expect(journal.epoch(1)).toBe(1_050);
  });

  test('a blink back to old content costs no new blob', () => {
    const journal = new Journal(4);
    const store = new TileStore();
    record(journal, store, 0, [
      [0, 1],
      [1, 1],
      [2, 1],
      [3, 1],
    ]);
    record(journal, store, 1, [[0, 2]]);
    record(journal, store, 2, [[0, 1]]);
    record(journal, store, 3, [[0, 2]]);
    expect(store.unique).toBe(2);
  });

  test('eviction keeps each tile’s base state and releases only unreferenced blobs', () => {
    const journal = new Journal(4);
    const store = new TileStore();
    record(journal, store, 0, [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
    ]);
    record(journal, store, 1, [[0, 5]]);
    record(journal, store, 2, [[0, 6]]);
    record(journal, store, 3, [[1, 7]]);
    journal.evictBefore(2, (id) => store.release(id));
    expect(journal.firstFrame).toBe(2);
    expect(shown(journal, store, 2)).toEqual([6, 2, 3, 4]);
    expect(shown(journal, store, 3)).toEqual([6, 7, 3, 4]);
    expect(store.lookup(1, 0)).toBe(-1);
    expect(store.lookup(5, 0)).toBe(-1);
    expect(store.lookup(2, 0)).toBeGreaterThanOrEqual(0);
  });

  test('a seek older than the retained floor clamps to the oldest frame', () => {
    const journal = new Journal(4);
    const store = new TileStore();
    for (let frame = 0; frame < 10; frame += 1) record(journal, store, frame * 100, [[frame % 4, frame + 1]]);
    journal.evictBefore(6, (id) => store.release(id));
    expect(journal.clamp(1)).toBe(6);
    expect(journal.clamp(99)).toBe(9);
    expect(shown(journal, store, journal.clamp(1))).toEqual(shown(journal, store, 6));
  });

  test('region steps walk the region’s own history and ignore changes elsewhere', () => {
    const journal = new Journal(4);
    const store = new TileStore();
    record(journal, store, 0, [
      [0, 1],
      [1, 1],
      [2, 1],
      [3, 1],
    ]);
    record(journal, store, 1, [[3, 2]]);
    record(journal, store, 2, [[0, 3]]);
    record(journal, store, 3, [[3, 4]]);
    record(journal, store, 4, [[3, 5]]);
    record(journal, store, 5, [[0, 6]]);
    record(journal, store, 6, [[3, 7]]);
    const tiles = [0];
    expect(journal.stepRegion(6, -1, tiles)).toBe(2);
    expect(journal.stepRegion(2, -1, tiles)).toBe(0);
    expect(journal.stepRegion(0, -1, tiles)).toBe(0);
    expect(journal.stepRegion(0, 1, tiles)).toBe(2);
    expect(journal.stepRegion(2, 1, tiles)).toBe(5);
    expect(journal.stepRegion(5, 1, tiles)).toBe(6);
    expect(journal.stepRegion(4, -1, [0, 3])).toBe(3);
  });

  test('after forgetting, stepping forward finds the first new state', () => {
    const journal = new Journal(4);
    const store = new TileStore();
    record(journal, store, 0, [[0, 1]]);
    journal.clear((id) => store.release(id));
    expect(store.unique).toBe(0);
    const first = record(journal, store, 10, [[1, 2]]);
    const second = record(journal, store, 20, [[0, 3]]);
    expect(journal.firstFrame).toBe(first);
    expect(journal.stepRegion(first, 1, [0])).toBe(second);
  });

  test('slices copy the timeline from a frame onward', () => {
    const journal = new Journal(4);
    const store = new TileStore();
    for (let frame = 0; frame < 5; frame += 1) record(journal, store, frame * 10, [[0, frame]]);
    const slice = journal.slice(3);
    expect(slice.firstFrame).toBe(3);
    expect([...slice.epochs]).toEqual([30, 40]);
    expect([...slice.changed]).toEqual([1, 1]);
  });
});
