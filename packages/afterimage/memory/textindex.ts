// What the screen said, and when. Each word OCR reads becomes an entry with its rectangle and the
// frames it was visible: from the frame its pixels settled until any tile beneath it changes. So a
// search answers "when was 482 913 on screen?" with an exact interval, not a guess.

import { matchTerm, tokenize } from './search';

const duplicateDistance = 6;
/** Visibilities closer than this many frames (~1.5 s at 20 Hz) can be one appearance (a scroll, a re-layout). */
const mergeGap = 30;
const tileSize = 64;

export interface ReadWord {
  line: string;
  /** Screen pixels: left, top, right, bottom. */
  rect: [number, number, number, number];
  text: string;
}

export interface Found {
  firstFrame: number;
  /** Last frame the word was visible (the newest frame when it still is). */
  lastFrame: number;
  line: string;
  rect: [number, number, number, number];
  score: number;
  text: string;
}

interface Entry {
  firstFrame: number;
  lastFrame: number;
  line: string;
  rect: [number, number, number, number];
  text: string;
  tiles: number[];
}

/**
 * A line that scrolls is a new visibility at every position, and OCR may read it a little
 * differently each time; to a person it is one appearance. Join visibilities that follow each other
 * and are the same line, or sit where a scrolled line would (same left edge, up to a dozen lines away),
 * keeping the newest position — where it was last seen. Input is most recent first.
 */
function merge(found: readonly Found[]): Found[] {
  const merged: Found[] = [];
  for (const candidate of found) {
    const newer = merged.find((kept) => candidate.lastFrame >= kept.firstFrame - mergeGap && sameAppearance(kept, candidate));
    if (newer !== undefined) {
      newer.firstFrame = Math.min(newer.firstFrame, candidate.firstFrame);
      continue;
    }
    merged.push({ ...candidate });
  }
  return merged;
}

function sameAppearance(a: Found, b: Found): boolean {
  if (a.line === b.line) return true;
  const lineHeight = Math.max(a.rect[3] - a.rect[1], b.rect[3] - b.rect[1]);
  return Math.abs(a.rect[0] - b.rect[0]) <= lineHeight * 1.5 + 32 && Math.abs(a.rect[1] - b.rect[1]) <= lineHeight * 12;
}

export class TextIndex {
  #bytes = 0;
  #entries: Entry[] = [];
  readonly #open = new Map<number, Set<Entry>>();
  readonly #tilesAcross: number;

  constructor(tilesAcross: number) {
    this.#tilesAcross = tilesAcross;
  }

  /** Approximate memory held, counted against the budget. */
  get bytes(): number {
    return this.#bytes;
  }

  /** Words read from pixels that have been on screen since `firstFrame`. */
  add(words: readonly ReadWord[], firstFrame: number): void {
    for (const word of words) {
      const tiles = this.#tilesUnder(word.rect);
      if (this.#isDuplicate(word, tiles)) continue;
      const entry: Entry = { firstFrame, lastFrame: Infinity, line: word.line, rect: word.rect, text: word.text, tiles };
      this.#entries.push(entry);
      this.#bytes += 96 + (word.text.length + word.line.length) * 2;
      for (const tile of tiles) {
        let open = this.#open.get(tile);
        if (open === undefined) {
          open = new Set();
          this.#open.set(tile, open);
        }
        open.add(entry);
      }
    }
  }

  clear(): void {
    this.#entries = [];
    this.#open.clear();
    this.#bytes = 0;
  }

  /** `tiles` changed at `frame`: every word on them was last visible the frame before. */
  close(tiles: Iterable<number>, frame: number): void {
    for (const tile of tiles) {
      const open = this.#open.get(tile);
      if (open === undefined) continue;
      for (const entry of open) {
        entry.lastFrame = frame - 1;
        for (const other of entry.tiles) if (other !== tile) this.#open.get(other)?.delete(entry);
      }
      this.#open.delete(tile);
    }
  }

  evictBefore(frame: number): void {
    const kept: Entry[] = [];
    let bytes = 0;
    for (const entry of this.#entries) {
      if (entry.lastFrame < frame) continue;
      kept.push(entry);
      bytes += 96 + (entry.text.length + entry.line.length) * 2;
    }
    this.#entries = kept;
    this.#bytes = bytes;
  }

  /**
   * Every visibility of words matching `query`, most recent first. With several terms, the first
   * term picks the word and the line must contain all of them.
   */
  search(query: string, newestFrame: number, limit = 0x100): Found[] {
    const terms = tokenize(query);
    if (terms.length === 0) return [];
    const [first, ...rest] = terms;
    const found: Found[] = [];
    for (const entry of this.#entries) {
      const score = matchTerm(entry.text, first!);
      if (score === 0) continue;
      if (rest.length > 0) {
        const lineWords = entry.line.split(/\s+/);
        if (!rest.every((term) => lineWords.some((lineWord) => matchTerm(lineWord, term) > 0))) continue;
      }
      found.push({ firstFrame: entry.firstFrame, lastFrame: Math.min(newestFrame, entry.lastFrame), line: entry.line, rect: entry.rect, score, text: entry.text });
    }
    found.sort((a, b) => b.lastFrame - a.lastFrame || b.score - a.score);
    return merge(found).slice(0, limit);
  }

  /** The tile under a screen pixel. */
  tileAt(x: number, y: number): number {
    return Math.floor(y / tileSize) * this.#tilesAcross + Math.floor(x / tileSize);
  }

  #isDuplicate(word: ReadWord, tiles: readonly number[]): boolean {
    const open = this.#open.get(tiles[0]!);
    if (open === undefined) return false;
    for (const entry of open) if (entry.text === word.text && Math.abs(entry.rect[0] - word.rect[0]) <= duplicateDistance && Math.abs(entry.rect[1] - word.rect[1]) <= duplicateDistance) return true;
    return false;
  }

  #tilesUnder(rect: readonly [number, number, number, number]): number[] {
    const tiles: number[] = [];
    for (let y = Math.floor(rect[1] / tileSize); y <= Math.floor((rect[3] - 1) / tileSize); y += 1) for (let x = Math.floor(rect[0] / tileSize); x <= Math.floor((rect[2] - 1) / tileSize); x += 1) tiles.push(y * this.#tilesAcross + x);
    return tiles;
  }
}
