/**
 * DPA Sort Race
 *
 * Races Windows' native Dynamic Pointer Array (DPA) sort — a legacy shell
 * container living inside comctl32.dll — against JavaScript's built-in
 * `Array.prototype.sort`. The comparator passed to DPA_Sort is a Bun
 * `JSCallback`, so every swap inside the native sort calls back into JS to
 * evaluate the ordering. This is a true bidirectional FFI workout: JS → native
 * → JS for every comparison.
 *
 * After the race, the sorted values are read back from the DPA, visualized as
 * an ANSI bar chart, and cross-checked against the JS result to prove
 * correctness.
 *
 * APIs demonstrated:
 *   - Comctl32.DllGetVersion     (report the comctl32 version on this host)
 *   - Comctl32.DPA_Create        (allocate a native dynamic pointer array)
 *   - Comctl32.DPA_InsertPtr     (append a pointer-sized item)
 *   - Comctl32.DPA_Sort          (sort via a JS-supplied comparator)
 *   - Comctl32.DPA_GetPtr        (random-access read of a sorted item)
 *   - Comctl32.DPA_GetPtrIndex   (reverse-lookup an item by pointer)
 *   - Comctl32.DPA_DeleteAllPtrs (clear without destroying)
 *   - Comctl32.DPA_Destroy       (free the array)
 *
 * Run: bun run example/dpa-sort-race.ts [count]
 */

import { FFIType, JSCallback, read, type Pointer } from 'bun:ffi';

import Comctl32, { DPA_APPEND, DPA_ERR, DllVersionPlatform } from '../index';

Comctl32.Preload(['DPA_Create', 'DPA_DeleteAllPtrs', 'DPA_Destroy', 'DPA_GetPtr', 'DPA_GetPtrIndex', 'DPA_InsertPtr', 'DPA_Sort', 'DllGetVersion']);

const ANSI = {
  bold: '\x1b[1m',
  cyan: '\x1b[96m',
  dim: '\x1b[2m',
  green: '\x1b[92m',
  magenta: '\x1b[95m',
  red: '\x1b[91m',
  reset: '\x1b[0m',
  white: '\x1b[97m',
  yellow: '\x1b[93m',
} as const;

const DLLVERSIONINFO_SIZE_BYTES = 20;
const DEFAULT_ITEM_COUNT = 200;

const requestedCount = Number.parseInt(Bun.argv[2] ?? '', 10);
const itemCount = Number.isFinite(requestedCount) && requestedCount > 0 ? Math.min(requestedCount, 4000) : DEFAULT_ITEM_COUNT;

function readComctl32Version(): { build: number; major: number; minor: number; platform: string } {
  const dlvInfoBuffer = Buffer.alloc(DLLVERSIONINFO_SIZE_BYTES);
  dlvInfoBuffer.writeUInt32LE(DLLVERSIONINFO_SIZE_BYTES, 0);

  const queryResult = Comctl32.DllGetVersion(dlvInfoBuffer.ptr);

  if (queryResult !== 0) {
    throw new Error(`DllGetVersion failed with 0x${queryResult.toString(16)}`);
  }

  const platformValue = dlvInfoBuffer.readUInt32LE(16);
  const platformName = DllVersionPlatform[platformValue] ?? `0x${platformValue.toString(16)}`;

  return {
    build: dlvInfoBuffer.readUInt32LE(12),
    major: dlvInfoBuffer.readUInt32LE(4),
    minor: dlvInfoBuffer.readUInt32LE(8),
    platform: platformName,
  };
}

function createItemBuffers(values: readonly number[]): Buffer[] {
  const itemBuffers: Buffer[] = [];

  for (const value of values) {
    const valueBuffer = Buffer.alloc(4);
    valueBuffer.writeInt32LE(value, 0);
    itemBuffers.push(valueBuffer);
  }

  return itemBuffers;
}

function fillDpa(hdpa: bigint, itemBuffers: readonly Buffer[]): void {
  for (const itemBuffer of itemBuffers) {
    const insertIndex = Comctl32.DPA_InsertPtr(hdpa, DPA_APPEND, itemBuffer.ptr);

    if (insertIndex === DPA_ERR) {
      throw new Error('DPA_InsertPtr failed (out of memory?)');
    }
  }
}

function readSortedValues(hdpa: bigint, expectedCount: number): number[] {
  const sortedValues: number[] = [];

  for (let sortedIndex = 0; sortedIndex < expectedCount; sortedIndex++) {
    const itemPointer = Comctl32.DPA_GetPtr(hdpa, BigInt(sortedIndex));

    if (itemPointer === null) {
      throw new Error(`DPA_GetPtr returned null at index ${sortedIndex}`);
    }

    sortedValues.push(read.i32(itemPointer));
  }

  return sortedValues;
}

function formatDuration(microseconds: number): string {
  if (microseconds >= 1000) {
    return `${(microseconds / 1000).toFixed(3)} ms`;
  }

  return `${microseconds.toFixed(1)} µs`;
}

function renderSkyline(label: string, values: readonly number[], colorCode: string, maximumValue: number): void {
  const barCount = Math.min(values.length, 80);
  const columnStride = values.length / barCount;
  const chartHeight = 10;

  console.log(`${ANSI.bold}${colorCode}${label}${ANSI.reset}`);

  for (let rowIndex = chartHeight; rowIndex >= 1; rowIndex--) {
    let renderedRow = '  ';

    for (let barIndex = 0; barIndex < barCount; barIndex++) {
      const sourceIndex = Math.floor(barIndex * columnStride);
      const sampleValue = values[sourceIndex] ?? 0;
      const barHeight = Math.max(1, Math.round((sampleValue / maximumValue) * chartHeight));
      renderedRow += barHeight >= rowIndex ? `${colorCode}█${ANSI.reset}` : ' ';
    }

    console.log(renderedRow);
  }

  console.log(`  ${ANSI.dim}${'─'.repeat(barCount)}${ANSI.reset}`);
}

console.log(`${ANSI.bold}${ANSI.cyan}DPA Sort Race${ANSI.reset}`);
console.log(`${ANSI.dim}Sorting ${itemCount.toLocaleString()} integers through comctl32's native Dynamic Pointer Array${ANSI.reset}`);
console.log('');

const comctl32Version = readComctl32Version();
console.log(`${ANSI.dim}comctl32.dll${ANSI.reset} ${ANSI.white}v${comctl32Version.major}.${comctl32Version.minor}.${comctl32Version.build}${ANSI.reset} ${ANSI.dim}(${comctl32Version.platform})${ANSI.reset}`);
console.log('');

const sourceValues: number[] = new Array(itemCount);

for (let populateIndex = 0; populateIndex < itemCount; populateIndex++) {
  sourceValues[populateIndex] = Math.floor(Math.random() * 1_000_000);
}

const maximumValue = Math.max(...sourceValues);
const itemBuffers = createItemBuffers(sourceValues);

const comparatorInvocationCounter = { count: 0 };
const compareCallback = new JSCallback(
  (pItem1: Pointer | null, pItem2: Pointer | null, _lParam: bigint): number => {
    comparatorInvocationCounter.count++;
    const leftValue = pItem1 !== null ? read.i32(pItem1) : 0;
    const rightValue = pItem2 !== null ? read.i32(pItem2) : 0;
    return leftValue - rightValue;
  },
  { args: [FFIType.ptr, FFIType.ptr, FFIType.i64], returns: FFIType.i32 },
);

const compareCallbackPointer = compareCallback.ptr;

if (compareCallbackPointer === null) {
  throw new Error('JSCallback allocation failed');
}

const hdpa = Comctl32.DPA_Create(Math.max(8, Math.ceil(itemCount / 16)));

if (hdpa === 0n) {
  throw new Error('DPA_Create returned NULL');
}

fillDpa(hdpa, itemBuffers);
comparatorInvocationCounter.count = 0;

const dpaSortStartNanoseconds = Bun.nanoseconds();
const dpaSortResult = Comctl32.DPA_Sort(hdpa, compareCallbackPointer, 0n);
const dpaSortDurationMicroseconds = (Bun.nanoseconds() - dpaSortStartNanoseconds) / 1000;

if (dpaSortResult === 0) {
  throw new Error('DPA_Sort reported failure');
}

const dpaComparisonCount = comparatorInvocationCounter.count;
const dpaSortedValues = readSortedValues(hdpa, itemCount);

const jsShuffledCopy = sourceValues.slice();
let jsComparisonCount = 0;
const jsSortStartNanoseconds = Bun.nanoseconds();
jsShuffledCopy.sort((leftValue, rightValue) => {
  jsComparisonCount++;
  return leftValue - rightValue;
});
const jsSortDurationMicroseconds = (Bun.nanoseconds() - jsSortStartNanoseconds) / 1000;

const sortsMatch = dpaSortedValues.every((dpaValue, compareIndex) => dpaValue === jsShuffledCopy[compareIndex]);

renderSkyline('Unsorted source', sourceValues, ANSI.magenta, maximumValue);
console.log('');
renderSkyline('After DPA_Sort (native)', dpaSortedValues, ANSI.green, maximumValue);
console.log('');

const needleBuffer = itemBuffers[Math.min(itemBuffers.length - 1, Math.floor(itemBuffers.length / 2))]!;
const needleValue = needleBuffer.readInt32LE(0);
const needleSortedIndex = Comctl32.DPA_GetPtrIndex(hdpa, needleBuffer.ptr);

console.log(`${ANSI.bold}${ANSI.white}Stats${ANSI.reset}`);
console.log(`  ${ANSI.dim}Items           ${ANSI.reset} ${itemCount.toLocaleString()}`);
console.log(`  ${ANSI.dim}Correctness     ${ANSI.reset} ${sortsMatch ? `${ANSI.green}match${ANSI.reset}` : `${ANSI.red}MISMATCH${ANSI.reset}`}`);
console.log(`  ${ANSI.dim}DPA_Sort        ${ANSI.reset} ${ANSI.cyan}${formatDuration(dpaSortDurationMicroseconds)}${ANSI.reset} (${dpaComparisonCount.toLocaleString()} JS callbacks)`);
console.log(`  ${ANSI.dim}Array#sort      ${ANSI.reset} ${ANSI.yellow}${formatDuration(jsSortDurationMicroseconds)}${ANSI.reset} (${jsComparisonCount.toLocaleString()} JS comparisons)`);
console.log(`  ${ANSI.dim}Native overhead ${ANSI.reset} ${(dpaSortDurationMicroseconds / Math.max(jsSortDurationMicroseconds, 0.001)).toFixed(1)}× Array#sort`);
console.log(`  ${ANSI.dim}Per-callback    ${ANSI.reset} ${formatDuration(dpaSortDurationMicroseconds / Math.max(dpaComparisonCount, 1))}`);
console.log(`  ${ANSI.dim}Sample lookup   ${ANSI.reset} value=${needleValue.toLocaleString()} → sorted index ${needleSortedIndex} via DPA_GetPtrIndex`);
console.log('');

if (Comctl32.DPA_DeleteAllPtrs(hdpa) === 0) {
  console.log(`${ANSI.red}DPA_DeleteAllPtrs failed${ANSI.reset}`);
}

if (Comctl32.DPA_Destroy(hdpa) === 0) {
  console.log(`${ANSI.red}DPA_Destroy failed${ANSI.reset}`);
}

compareCallback.close();
