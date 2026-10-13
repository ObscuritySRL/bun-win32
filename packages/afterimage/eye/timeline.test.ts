import { describe, expect, test } from 'bun:test';

import { ageOfPosition, binActivity, findMoments, formatAge, frameAtOrBefore, positionOfAge, ticks } from './timeline';

describe('log time axis', () => {
  test('now is 0 and the oldest frame is 1', () => {
    expect(positionOfAge(0, 3_600_000)).toBe(0);
    expect(positionOfAge(3_600_000, 3_600_000)).toBeCloseTo(1, 12);
  });

  test('the last minute takes about a third of an hour-long timeline', () => {
    const position = positionOfAge(60_000, 3_600_000);
    expect(position).toBeGreaterThan(0.3);
    expect(position).toBeLessThan(0.4);
  });

  test('ageOfPosition inverts positionOfAge', () => {
    for (const age of [0, 1, 250, 8_000, 61_000, 999_999, 3_600_000]) expect(ageOfPosition(positionOfAge(age, 3_600_000), 3_600_000)).toBeCloseTo(age, 6);
  });

  test('a tiny span still maps sanely', () => {
    expect(positionOfAge(50, 100)).toBeGreaterThan(0);
    expect(positionOfAge(50, 100)).toBeLessThan(1);
    expect(positionOfAge(0, 0)).toBe(0);
  });

  test('ticks only include ages inside the span, nearest first', () => {
    const labels = ticks(400_000).map((tick) => tick.label);
    expect(labels).toEqual(['10 s', '30 s', '1 min', '2 min', '5 min']);
    expect(ticks(5_000)).toEqual([]);
  });
});

describe('formatting', () => {
  test('ages read like a person says them', () => {
    expect(formatAge(0)).toBe('Now');
    expect(formatAge(400)).toBe('Now');
    expect(formatAge(3_200)).toBe('3 s ago');
    expect(formatAge(42_900)).toBe('42 s ago');
    expect(formatAge(252_000)).toBe('4 min 12 s ago');
    expect(formatAge(600_000)).toBe('10 min ago');
    expect(formatAge(3_900_000)).toBe('1 h 5 min ago');
  });
});

describe('frames', () => {
  const epochs = new Float64Array([1_000, 1_050, 1_100, 2_000, 5_000]);

  test('frameAtOrBefore finds the latest frame not after the epoch', () => {
    expect(frameAtOrBefore(epochs, epochs.length, 1_075)).toBe(1);
    expect(frameAtOrBefore(epochs, epochs.length, 5_000)).toBe(4);
    expect(frameAtOrBefore(epochs, epochs.length, 9_999)).toBe(4);
    expect(frameAtOrBefore(epochs, epochs.length, 10)).toBe(0);
    expect(frameAtOrBefore(epochs, 3, 4_000)).toBe(2);
  });

  test('moments are large changes, at least 1.5 s apart', () => {
    const momentEpochs = new Float64Array([0, 100, 200, 300, 2_000, 2_100, 6_000]);
    const changed = new Uint32Array([1_000, 900, 2, 950, 3, 800, 1]);
    expect([...findMoments(momentEpochs, changed, changed.length, 1_000)]).toEqual([0, 5]);
  });

  test('activity bins accumulate along the log axis', () => {
    const now = 10_000;
    const binEpochs = new Float64Array([0, 9_000, 9_990]);
    const changed = new Uint32Array([10, 5, 7]);
    const bins = new Float32Array(16);
    binActivity(binEpochs, changed, binEpochs.length, now, 10_000, bins);
    expect(bins[0]).toBeGreaterThan(0);
    expect(bins[15]).toBeGreaterThan(0);
    expect(Math.max(...bins)).toBeCloseTo(1, 6);
  });
});
