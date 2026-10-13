import { describe, expect, test } from 'bun:test';

import { TextIndex } from './textindex';

const word = (text: string, line: string, x: number, y: number): { line: string; rect: [number, number, number, number]; text: string } => ({ line, rect: [x, y, x + 60, y + 14], text });

describe('TextIndex', () => {
  test('a word is findable for exactly the frames it was on screen', () => {
    const index = new TextIndex(10);
    index.add([word('482', '482 913 · expires', 100, 70), word('913', '482 913 · expires', 140, 70)], 5);
    index.close([index.tileAt(110, 75)], 9);
    const [found] = index.search('482', 20);
    expect(found).toMatchObject({ firstFrame: 5, lastFrame: 8, text: '482' });
  });

  test('words still on screen are visible through now', () => {
    const index = new TextIndex(10);
    index.add([word('config', "Cannot find module './config'", 300, 200)], 3);
    expect(index.search('config', 42)[0]?.lastFrame).toBe(42);
  });

  test('re-reading unchanged text does not duplicate it', () => {
    const index = new TextIndex(10);
    index.add([word('deck', 'send the deck', 10, 10)], 1);
    index.add([word('deck', 'send the deck', 11, 10)], 4);
    expect(index.search('deck', 9)).toHaveLength(1);
  });

  test('multi-word queries match within one line, most recent first', () => {
    const index = new TextIndex(10);
    index.add([word('Door', 'Door code is 7149', 10, 10), word('code', 'Door code is 7149', 60, 10)], 2);
    index.close([index.tileAt(10, 10), index.tileAt(60, 10)], 6);
    index.add([word('code', 'Your verification code', 400, 300)], 7);
    expect(index.search('door code', 20).map((found) => found.line)).toEqual(['Door code is 7149']);
    expect(index.search('code', 20).map((found) => found.firstFrame)).toEqual([7, 2]);
  });

  test('a line that scrolled is one appearance, found where it was last seen', () => {
    const index = new TextIndex(10);
    index.add([word('config', "error ./config'", 40, 300)], 10);
    index.close([index.tileAt(40, 300)], 14);
    index.add([word('config', "error ./config'", 40, 279)], 14);
    index.close([index.tileAt(40, 279)], 18);
    index.add([word('config', "error ./config'", 40, 258)], 18);
    index.close([index.tileAt(40, 258)], 22);
    const found = index.search('config', 40);
    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({ firstFrame: 10, lastFrame: 21 });
    expect(found[0]!.rect[1]).toBe(258);
  });

  test('eviction forgets words that ended before the floor', () => {
    const index = new TextIndex(10);
    index.add([word('gone', 'gone soon', 0, 0)], 1);
    index.close([index.tileAt(0, 0)], 3);
    index.add([word('kept', 'kept', 200, 200)], 4);
    index.evictBefore(5);
    expect(index.search('gone', 9)).toHaveLength(0);
    expect(index.search('kept', 9)).toHaveLength(1);
  });
});
