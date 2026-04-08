/**
 * Counter Explorer
 *
 * Enumerates Windows performance counter objects and their available counters
 * and instances. Picks several interesting objects (Processor, Memory,
 * PhysicalDisk, Network Interface) and lists what can be measured. Then opens
 * a query, adds sample counters, collects data, and shows both raw and
 * formatted values.
 *
 * APIs demonstrated:
 *   - PdhEnumObjectsW           (list all performance object names)
 *   - PdhEnumObjectItemsW       (list counters and instances for an object)
 *   - PdhOpenQueryW             (create a performance data query)
 *   - PdhAddEnglishCounterW     (add locale-independent counters)
 *   - PdhCollectQueryData       (sample counters)
 *   - PdhGetFormattedCounterValue (read formatted value)
 *   - PdhGetRawCounterValue     (read raw counter data)
 *   - PdhRemoveCounter          (detach counter)
 *   - PdhCloseQuery             (release query)
 *   - PdhGetDllVersion          (PDH library version)
 *
 * Run: bun run example/counter-explorer.ts
 */
import Pdh, { PdhCounterFormat, PdhDetailLevel } from '../index';

Pdh.Preload([
  'PdhEnumObjectsW',
  'PdhEnumObjectItemsW',
  'PdhOpenQueryW',
  'PdhAddEnglishCounterW',
  'PdhCollectQueryData',
  'PdhGetFormattedCounterValue',
  'PdhGetRawCounterValue',
  'PdhRemoveCounter',
  'PdhCloseQuery',
  'PdhGetDllVersion',
]);

const W = 76;

function heading(title: string): void {
  console.log(`\n  ${'─'.repeat(W - 4)}`);
  console.log(`  ${title}`);
  console.log(`  ${'─'.repeat(W - 4)}`);
}

// Parse a multi-string buffer (double-null-terminated wide strings)
function parseMultiSz(buf: Buffer, maxChars: number): string[] {
  const results: string[] = [];
  let current = '';
  for (let i = 0; i < maxChars; i++) {
    const code = buf.readUInt16LE(i * 2);
    if (code === 0) {
      if (current.length > 0) {
        results.push(current);
        current = '';
      } else {
        break; // double null = end
      }
    } else {
      current += String.fromCharCode(code);
    }
  }
  return results;
}

console.log(`\n${'='.repeat(W)}`);
console.log('                 PERFORMANCE COUNTER EXPLORER');
console.log('                 powered by @bun-win32/pdh');
console.log(`${'='.repeat(W)}`);

// PDH DLL version
const versionBuf = Buffer.alloc(4);
const versionStatus = Pdh.PdhGetDllVersion(versionBuf.ptr);
if (versionStatus === 0) {
  const version = versionBuf.readUInt32LE(0);
  console.log(`  PDH DLL Version: ${version}`);
}

// 1. Enumerate all performance objects
heading('AVAILABLE PERFORMANCE OBJECTS');

const objSizeBuf = Buffer.alloc(4);
objSizeBuf.writeUInt32LE(0, 0);
// First call to get required size
Pdh.PdhEnumObjectsW(null, null, null, objSizeBuf.ptr, PdhDetailLevel.PERF_DETAIL_WIZARD, 1);
const objSize = objSizeBuf.readUInt32LE(0);

let allObjects: string[] = [];
if (objSize > 0) {
  const objBuf = Buffer.alloc(objSize * 2);
  objSizeBuf.writeUInt32LE(objSize, 0);
  const enumStatus = Pdh.PdhEnumObjectsW(null, null, objBuf.ptr, objSizeBuf.ptr, PdhDetailLevel.PERF_DETAIL_WIZARD, 0);

  if (enumStatus === 0) {
    allObjects = parseMultiSz(objBuf, objSize);
    console.log(`  Found ${allObjects.length} performance objects`);
    console.log(`  First 20:`);
    for (const obj of allObjects.slice(0, 20)) {
      console.log(`    - ${obj}`);
    }
    if (allObjects.length > 20) {
      console.log(`    ... and ${allObjects.length - 20} more`);
    }
  } else {
    console.log(`  PdhEnumObjectsW failed: 0x${(enumStatus >>> 0).toString(16)}`);
  }
}

// 2. Explore specific objects
const interestingObjects = ['Processor', 'Memory', 'PhysicalDisk', 'Network Interface'];

for (const objName of interestingObjects) {
  heading(`OBJECT: ${objName}`);

  // Two-call pattern: get sizes first
  const counterSizeBuf = Buffer.alloc(4);
  const instanceSizeBuf = Buffer.alloc(4);
  counterSizeBuf.writeUInt32LE(0, 0);
  instanceSizeBuf.writeUInt32LE(0, 0);

  const objNameBuf = Buffer.from(objName + '\0', 'utf16le');
  Pdh.PdhEnumObjectItemsW(
    null, null, objNameBuf.ptr,
    null, counterSizeBuf.ptr,
    null, instanceSizeBuf.ptr,
    PdhDetailLevel.PERF_DETAIL_WIZARD, 0,
  );

  const counterChars = counterSizeBuf.readUInt32LE(0);
  const instanceChars = instanceSizeBuf.readUInt32LE(0);

  if (counterChars === 0) {
    console.log(`  (no counters found or access denied)`);
    continue;
  }

  const counterBuf = Buffer.alloc(counterChars * 2);
  const instanceBuf = instanceChars > 0 ? Buffer.alloc(instanceChars * 2) : null;
  counterSizeBuf.writeUInt32LE(counterChars, 0);
  instanceSizeBuf.writeUInt32LE(instanceChars, 0);

  const itemStatus = Pdh.PdhEnumObjectItemsW(
    null, null, objNameBuf.ptr,
    counterBuf.ptr, counterSizeBuf.ptr,
    instanceBuf?.ptr ?? null, instanceSizeBuf.ptr,
    PdhDetailLevel.PERF_DETAIL_WIZARD, 0,
  );

  if (itemStatus !== 0) {
    console.log(`  PdhEnumObjectItemsW failed: 0x${(itemStatus >>> 0).toString(16)}`);
    continue;
  }

  const counters = parseMultiSz(counterBuf, counterChars);
  const instances = instanceBuf ? parseMultiSz(instanceBuf, instanceChars) : [];

  console.log(`  Counters (${counters.length}):`);
  for (const c of counters.slice(0, 15)) {
    console.log(`    - ${c}`);
  }
  if (counters.length > 15) {
    console.log(`    ... and ${counters.length - 15} more`);
  }

  if (instances.length > 0) {
    console.log(`  Instances (${instances.length}):`);
    for (const inst of instances.slice(0, 10)) {
      console.log(`    - ${inst}`);
    }
    if (instances.length > 10) {
      console.log(`    ... and ${instances.length - 10} more`);
    }
  } else {
    console.log(`  Instances: (none - singleton object)`);
  }
}

// 3. Open a query and read sample values
heading('LIVE COUNTER READINGS');

const hQueryBuf = Buffer.alloc(8);
const openStatus = Pdh.PdhOpenQueryW(null, 0n, hQueryBuf.ptr);
if (openStatus !== 0) {
  console.error(`  PdhOpenQueryW failed: 0x${(openStatus >>> 0).toString(16)}`);
  process.exit(1);
}
const hQuery = hQueryBuf.readBigUInt64LE(0);

const sampleCounters = [
  '\\Processor(_Total)\\% Processor Time',
  '\\Processor(_Total)\\% Idle Time',
  '\\Memory\\Available MBytes',
  '\\Memory\\Committed Bytes',
  '\\Memory\\Cache Bytes',
  '\\System\\Processes',
  '\\System\\Threads',
  '\\System\\System Up Time',
];

const handles: Array<{ path: string; handle: bigint }> = [];
for (const path of sampleCounters) {
  const hCounterBuf = Buffer.alloc(8);
  const pathBuf = Buffer.from(path + '\0', 'utf16le');
  const status = Pdh.PdhAddEnglishCounterW(hQuery, pathBuf.ptr, 0n, hCounterBuf.ptr);
  if (status === 0) {
    handles.push({ path, handle: hCounterBuf.readBigUInt64LE(0) });
  } else {
    console.log(`  Skipping "${path}": 0x${(status >>> 0).toString(16)}`);
  }
}

// Two samples for rate counters
Pdh.PdhCollectQueryData(hQuery);
await Bun.sleep(1000);
Pdh.PdhCollectQueryData(hQuery);

console.log(`  ${'Counter Path'.padEnd(48)} ${'Formatted'.padStart(12)} ${'Raw Value'.padStart(16)}`);
console.log(`  ${'─'.repeat(48)} ${'─'.repeat(12)} ${'─'.repeat(16)}`);

for (const { path, handle } of handles) {
  // Formatted value (double)
  const fmtBuf = Buffer.alloc(24);
  const fmtStatus = Pdh.PdhGetFormattedCounterValue(handle, PdhCounterFormat.PDH_FMT_DOUBLE, null, fmtBuf.ptr);
  let fmtStr = '(error)';
  if (fmtStatus === 0) {
    const val = fmtBuf.readDoubleLE(8);
    fmtStr = val.toFixed(2);
  }

  // Raw value
  const rawBuf = Buffer.alloc(40); // PDH_RAW_COUNTER
  const rawStatus = Pdh.PdhGetRawCounterValue(handle, null, rawBuf.ptr);
  let rawStr = '(error)';
  if (rawStatus === 0) {
    const rawVal = rawBuf.readBigInt64LE(8);
    rawStr = rawVal.toString();
  }

  const shortPath = path.length > 48 ? path.substring(0, 45) + '...' : path;
  console.log(`  ${shortPath.padEnd(48)} ${fmtStr.padStart(12)} ${rawStr.padStart(16)}`);
}

// Cleanup
for (const { handle } of handles) {
  Pdh.PdhRemoveCounter(handle);
}
Pdh.PdhCloseQuery(hQuery);

console.log(`\n${'='.repeat(W)}\n`);
