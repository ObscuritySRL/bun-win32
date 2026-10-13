// The timeline's mathematics: a logarithmic time axis (recent past large, distant past small —
// the way memory works), tick placement, human age formatting, frame lookup, "moments" (large
// changes worth jumping between) and the activity waveform's bins.

/** Ages under this many milliseconds are nearly linear; beyond it the axis compresses logarithmically. */
const axisKnee = 8_000;
const momentCooldown = 1_500;
const momentShare = 0.12;
const tickAges: readonly [number, string][] = [
  [10_000, '10 s'],
  [30_000, '30 s'],
  [60_000, '1 min'],
  [120_000, '2 min'],
  [300_000, '5 min'],
  [600_000, '10 min'],
  [900_000, '15 min'],
  [1_800_000, '30 min'],
  [3_600_000, '1 h'],
  [7_200_000, '2 h'],
  [14_400_000, '4 h'],
];
const clockFormat = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit', second: '2-digit' });

export interface Tick {
  age: number;
  label: string;
}

/** Inverse of positionOfAge. */
export function ageOfPosition(position: number, span: number): number {
  return axisKnee * (Math.exp(position * Math.log1p(span / axisKnee)) - 1);
}

/**
 * Waveform bins, oldest (index 0) to now (last). Each bin holds the largest change of any frame
 * inside it on an absolute log scale — a keystroke is a ripple, a window switch a spike, the
 * whole screen 1 — so one big frame never flattens everything else.
 */
export function binActivity(epochs: Float64Array, changed: Uint32Array, count: number, now: number, span: number, tileCount: number, bins: Float32Array): void {
  bins.fill(0);
  const binCount = bins.length;
  for (let frame = 0; frame < count; frame += 1) {
    const position = positionOfAge(now - epochs[frame]!, span);
    const bin = Math.min(binCount - 1, Math.max(0, Math.floor((1 - position) * binCount)));
    const level = Math.log1p(changed[frame]!) / Math.log1p(tileCount);
    if (level > bins[bin]!) bins[bin] = level;
  }
}

/** Frames where at least 12 % of the screen changed at once, no closer than 1.5 s to the previous moment. */
export function findMoments(epochs: Float64Array, changed: Uint32Array, count: number, tileCount: number): Uint32Array {
  const threshold = Math.max(1, Math.round(tileCount * momentShare));
  const moments: number[] = [];
  let last = -Infinity;
  for (let frame = 0; frame < count; frame += 1) {
    if (changed[frame]! < threshold || epochs[frame]! - last < momentCooldown) continue;
    moments.push(frame);
    last = epochs[frame]!;
  }
  return Uint32Array.from(moments);
}

/** "Now", "3 s ago", "4 min 12 s ago", "1 h 5 min ago". */
export function formatAge(age: number): string {
  const seconds = Math.floor(age / 1_000);
  if (seconds < 1) return 'Now';
  if (seconds < 60) return `${seconds} s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return seconds % 60 === 0 ? `${minutes} min ago` : `${minutes} min ${seconds % 60} s ago`;
  const hours = Math.floor(minutes / 60);
  return minutes % 60 === 0 ? `${hours} h ago` : `${hours} h ${minutes % 60} min ago`;
}

/** Wall-clock time in the user's locale, with seconds. */
export function formatClock(epoch: number): string {
  return clockFormat.format(epoch);
}

/** Index of the latest frame at or before `epoch` (the oldest frame when `epoch` precedes them all). */
export function frameAtOrBefore(epochs: Float64Array, count: number, epoch: number): number {
  let low = 0;
  let high = count - 1;
  if (count === 0 || epoch < epochs[0]!) return 0;
  while (low < high) {
    const middle = (low + high + 1) >> 1;
    if (epochs[middle]! <= epoch) low = middle;
    else high = middle - 1;
  }
  return low;
}

/** 0 for now, 1 for an age equal to `span`. */
export function positionOfAge(age: number, span: number): number {
  if (span <= 0) return 0;
  return Math.log1p(Math.max(0, age) / axisKnee) / Math.log1p(span / axisKnee);
}

/** The labelled ages that fit inside `span`, nearest first. */
export function ticks(span: number): Tick[] {
  return tickAges.filter(([age]) => age <= span).map(([age, label]) => ({ age, label }));
}
