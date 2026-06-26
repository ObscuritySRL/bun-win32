/**
 * locate-all-images — the nut.js findAll / pixelWithColor parity hole for the pixel-fallback layer.
 * findImage returns only the single best hit, so on a no-a11y surface with N identical needles (a game
 * grid, a tiled board, a toolbar of repeated icons) the agent could locate ONE instance but never
 * enumerate ALL of them, and could not ground on 'the next red pixel'. match.ts now adds findAllImages
 * (coarse scan → per-cell refine → non-max suppression) + locateAllOnScreen, and locateColor.
 *
 * Proof (pure-TS, deterministic, NO window spawned): synthetic in-memory bitmaps — a haystack with three
 * separated copies of a 4x4 needle returns exactly three de-duplicated matches (NMS drops overlaps),
 * each at the planted top-left; a haystack with zero copies returns []; maxResults caps the count.
 * findImage (unchanged) still returns only the single best. Region-scoping (the nut.js searchRegion / AHK
 * ImageSearch bounds parity now on locateOnScreen / locateAllOnScreen) is proven capture-free by mirroring
 * the captureScreen-origin → absolute-coord composition over a synthetic region-origin bitmap. (locateAllOnScreen
 * / locateColor wrap these over a live captureScreen — exercised by the selftest, not asserted here.)
 *
 * bun test is broken repo-wide — runnable script:
 * Run: bun run example/locate-all-images.integration.test.ts
 */
import { type Bitmap, findAllImages, findImage } from '@bun-win32/uia';

let failures = 0;
function assert(condition: boolean, message: string): void {
  if (condition) console.log(`  ok: ${message}`);
  else {
    console.error(`  FAIL: ${message}`);
    failures += 1;
  }
}

function solid(width: number, height: number, r: number, g: number, b: number): Bitmap {
  const rgb = new Uint8Array(width * height * 3);
  for (let index = 0; index < rgb.length; index += 3) {
    rgb[index] = r;
    rgb[index + 1] = g;
    rgb[index + 2] = b;
  }
  return { rgb, width, height, originX: 0, originY: 0 };
}

function stamp(haystack: Bitmap, needle: Bitmap, atX: number, atY: number): void {
  for (let ny = 0; ny < needle.height; ny += 1) {
    for (let nx = 0; nx < needle.width; nx += 1) {
      const target = ((atY + ny) * haystack.width + (atX + nx)) * 3;
      const source = (ny * needle.width + nx) * 3;
      haystack.rgb[target] = needle.rgb[source]!;
      haystack.rgb[target + 1] = needle.rgb[source + 1]!;
      haystack.rgb[target + 2] = needle.rgb[source + 2]!;
    }
  }
}

// A 4x4 red needle on a 40x40 white field, planted at three well-separated spots.
const needle = solid(4, 4, 255, 0, 0);
const haystack = solid(40, 40, 255, 255, 255);
const planted = [
  { x: 2, y: 3 },
  { x: 20, y: 6 },
  { x: 10, y: 28 },
];
for (const spot of planted) stamp(haystack, needle, spot.x, spot.y);

const all = findAllImages(haystack, needle, { threshold: 0.99 });
assert(all.length === 3, `findAllImages enumerates EVERY occurrence — got ${all.length}, want 3`);
for (const spot of planted)
  assert(
    all.some((match) => match.x === spot.x && match.y === spot.y && match.score >= 0.99),
    `match at (${spot.x},${spot.y}) is reported`,
  );
const seen = new Set(all.map((match) => `${match.x},${match.y}`));
assert(seen.size === all.length, 'non-max suppression yields de-duplicated, non-overlapping hits');

const single = findImage(haystack, needle, { threshold: 0.99 });
assert(single !== null && planted.some((spot) => spot.x === single.x && spot.y === single.y), 'findImage (unchanged) still returns the single best hit');

const empty = findAllImages(solid(40, 40, 255, 255, 255), needle, { threshold: 0.99 });
assert(empty.length === 0, 'zero occurrences returns [] (not a bogus best-effort hit)');

const capped = findAllImages(haystack, needle, { threshold: 0.99, maxResults: 2 });
assert(capped.length === 2, 'maxResults caps the result count');

// region-scoping (nut.js searchRegion / AHK ImageSearch bounds): locateOnScreen/locateAllOnScreen now take
// `region`, captureScreen folds its origin into the bitmap, and the returned coords stay ABSOLUTE. Proven
// capture-free by mirroring that exact composition over a synthetic region-origin bitmap (originX/Y != 0).
const regioned: Bitmap = { rgb: haystack.rgb, width: haystack.width, height: haystack.height, originX: 1000, originY: 700 };
const regionHit = findImage(regioned, needle, { threshold: 0.99 });
assert(regionHit !== null, 'findImage hits within a region-origin bitmap');
const absolute = regionHit === null ? null : { x: regioned.originX + regionHit.x, y: regioned.originY + regionHit.y };
assert(absolute !== null && planted.some((spot) => absolute.x === 1000 + spot.x && absolute.y === 700 + spot.y), 'region origin is folded into the returned coords so they stay ABSOLUTE-screen');

console.log(failures === 0 ? '\nPASS — the pixel-fallback layer enumerates all needle occurrences (findAll parity), not just the single best.' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
