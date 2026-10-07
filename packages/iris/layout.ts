// The three arrangements. Each is a pure function from window geometry to spring targets, so switching layouts is
// just retargeting: every card flies from wherever it is to wherever it belongs, interruptibly.
//
//   Grid  — Exposé. One uniform scale for every window (relative sizes stay truthful), rows chosen to maximise it,
//           and windows ordered by where they sit on screen so each one travels the shortest path.
//   Flow  — Cover Flow. Equal heights on a reflective floor; the focused window faces you, the rest turn away.
//   Stack — Time. Most-recently-used first, receding into depth; scrolling walks backwards through your session.

import type { Rect } from './geometry';
import type { PlacementTarget } from './motion';

export type LayoutName = 'flow' | 'grid' | 'stack';

export interface LayoutItem {
  /** Centre of the window's real frame in overlay pixels. */
  centerX: number;
  centerY: number;
  height: number;
  width: number;
}

export interface LayoutResult {
  /** The floor line (Flow only), for reflections. */
  floorY: number;
  targets: PlacementTarget[];
}

const BASE_GAP = 44;
const BASE_LABEL = 46;
const GRID_MAX_SCALE = 0.86;

/** `unit` is pixels per DIP: gaps and label room scale with the monitor's DPI. */
export function gridLayout(items: readonly LayoutItem[], area: Rect, unit = 1): LayoutResult {
  const GRID_GAP = BASE_GAP * unit;
  const GRID_LABEL = BASE_LABEL * unit;
  const count = items.length;
  const targets: PlacementTarget[] = items.map((item) => ({ opacity: 1, rotationX: 0, rotationY: 0, scale: 1, x: item.centerX, y: item.centerY, z: 0 }));
  if (count === 0) return { floorY: 0, targets };
  let best: { rows: number[][]; scale: number } | null = null;
  const byRow = [...items.keys()].sort((first, second) => items[first]!.centerY - items[second]!.centerY || items[first]!.centerX - items[second]!.centerX);
  for (let rowCount = 1; rowCount <= Math.min(count, 6); rowCount += 1) {
    const rows: number[][] = [];
    const perRow = Math.ceil(count / rowCount);
    for (let start = 0; start < count; start += perRow) rows.push(byRow.slice(start, start + perRow).sort((first, second) => items[first]!.centerX - items[second]!.centerX));
    let scale = GRID_MAX_SCALE;
    let tallest = 0;
    for (const row of rows) {
      let width = 0;
      let height = 0;
      for (const index of row) {
        width += items[index]!.width;
        height = Math.max(height, items[index]!.height);
      }
      scale = Math.min(scale, (area.width - (row.length - 1) * GRID_GAP) / width);
      tallest += height;
    }
    scale = Math.min(scale, (area.height - rows.length * GRID_LABEL - (rows.length - 1) * GRID_GAP) / tallest);
    if (best === null || scale > best.scale * 1.02) best = { rows, scale };
  }
  const { rows, scale } = best!;
  // Rows that are narrower than the widest may grow (up to 35%) into the room the uniform scale left behind.
  const rawHeights = rows.map((row) => Math.max(...row.map((index) => items[index]!.height)));
  let rowScales = rows.map((row) => {
    const width = row.reduce((sum, index) => sum + items[index]!.width, 0);
    return Math.max(scale, Math.min(GRID_MAX_SCALE, (area.width - (row.length - 1) * GRID_GAP) / width, scale * 1.35));
  });
  const fixed = (rows.length - 1) * GRID_GAP + rows.length * GRID_LABEL;
  const grown = rawHeights.reduce((sum, height, index) => sum + height * rowScales[index]!, 0);
  if (fixed + grown > area.height) {
    const factor = (area.height - fixed) / grown;
    rowScales = rowScales.map((rowScale) => Math.max(scale, rowScale * factor));
  }
  let totalHeight = fixed;
  const rowHeights = rawHeights.map((height, index) => height * rowScales[index]!);
  for (const height of rowHeights) totalHeight += height;
  let y = area.y + (area.height - totalHeight) / 2;
  rows.forEach((row, rowIndex) => {
    const rowHeight = rowHeights[rowIndex]!;
    const rowScale = rowScales[rowIndex]!;
    let rowWidth = (row.length - 1) * GRID_GAP;
    for (const index of row) rowWidth += items[index]!.width * rowScale;
    let x = area.x + (area.width - rowWidth) / 2;
    for (const index of row) {
      const item = items[index]!;
      const width = item.width * rowScale;
      targets[index] = { opacity: 1, rotationX: 0, rotationY: 0, scale: rowScale, x: x + width / 2, y: y + rowHeight / 2, z: 0 };
      x += width + GRID_GAP;
    }
    y += rowHeight + GRID_GAP + GRID_LABEL;
  });
  return { floorY: 0, targets };
}

/** Cover Flow: `order` lists item indices left to right; `focus` is a position in `order` (fractional while scrolling). */
export function flowLayout(items: readonly LayoutItem[], order: readonly number[], focus: number, area: Rect): LayoutResult {
  const targets: PlacementTarget[] = items.map(() => ({ opacity: 0, rotationX: 0, rotationY: 0, scale: 0.5, x: area.x + area.width / 2, y: area.y + area.height / 2, z: 900 }));
  const cardHeight = area.height * 0.6;
  const floorY = area.y + area.height * 0.5 + cardHeight * 0.5;
  const centerX = area.x + area.width / 2;
  const spacing = cardHeight * 0.3;
  order.forEach((index, position) => {
    const item = items[index]!;
    const scale = Math.min(cardHeight / item.height, (area.width * 0.42) / item.width);
    const offset = position - focus;
    const distance = Math.abs(offset);
    const side = Math.sign(offset);
    const nearness = Math.min(distance, 1);
    const centerHalf = (cardHeight * 1.05) / 2;
    const x = centerX + side * (nearness * (centerHalf + spacing * 0.9) + Math.max(distance - 1, 0) * spacing);
    targets[index] = {
      opacity: distance > 9 ? 0 : 1,
      rotationX: 0,
      rotationY: -side * nearness * 1.05,
      scale,
      x,
      y: floorY - (item.height * scale) / 2,
      z: nearness * 420 + Math.max(distance - 1, 0) * 30 - (1 - nearness) * 80,
    };
  });
  return { floorY, targets };
}

/** Stack: `order` is most-recent first; `focus` is how far back in time the viewer has walked. */
export function stackLayout(items: readonly LayoutItem[], order: readonly number[], focus: number, area: Rect): LayoutResult {
  const targets: PlacementTarget[] = items.map(() => ({ opacity: 0, rotationX: 0, rotationY: 0, scale: 0.5, x: area.x + area.width / 2, y: area.y + area.height / 2, z: 900 }));
  const cardHeight = area.height * 0.66;
  const centerX = area.x + area.width * 0.44;
  const centerY = area.y + area.height * 0.54;
  order.forEach((index, position) => {
    const item = items[index]!;
    const scale = Math.min(cardHeight / item.height, (area.width * 0.5) / item.width);
    const depth = position - focus;
    if (depth < 0) {
      targets[index] = { opacity: 0, rotationX: 0.05, rotationY: -0.22, scale, x: centerX - depth * 120, y: centerY - depth * 260, z: depth * 700 };
      return;
    }
    targets[index] = {
      opacity: Math.max(0, 1 - depth * 0.11),
      rotationX: 0.05,
      rotationY: -0.22,
      scale,
      x: centerX + depth * cardHeight * 0.2,
      y: centerY - depth * cardHeight * 0.13,
      z: depth * 520,
    };
  });
  return { floorY: 0, targets };
}
