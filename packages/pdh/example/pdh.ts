import Pdh from '../index';

// Preload all symbols used in this example
Pdh.Preload(['PdhOpenQueryW', 'PdhAddEnglishCounterW', 'PdhCollectQueryData', 'PdhGetFormattedCounterValue', 'PdhRemoveCounter', 'PdhCloseQuery', 'PdhEnumObjectsW']);

// Open a real-time performance query
const hQueryBuf = Buffer.alloc(8);
const openStatus = Pdh.PdhOpenQueryW(null, 0n, hQueryBuf.ptr);

if (openStatus !== 0) {
  console.error('PdhOpenQueryW failed: 0x' + (openStatus >>> 0).toString(16));
  process.exit(1);
}

const hQuery = hQueryBuf.readBigUInt64LE(0);

// Add counters (English names, locale-independent)
const counters = ['\\Processor(_Total)\\% Processor Time', '\\Memory\\Available MBytes', '\\System\\Processes', '\\System\\Threads', '\\System\\System Up Time'];

const handles: bigint[] = [];

for (const name of counters) {
  const hCounterBuf = Buffer.alloc(8);
  const path = Buffer.from(name + '\0', 'utf16le');
  const status = Pdh.PdhAddEnglishCounterW(hQuery, path.ptr, 0n, hCounterBuf.ptr);

  if (status !== 0) {
    console.error(`PdhAddEnglishCounterW failed for "${name}": 0x${(status >>> 0).toString(16)}`);
    continue;
  }

  handles.push(hCounterBuf.readBigUInt64LE(0));
}

// Collect baseline, wait, collect again (rate counters need two samples)
Pdh.PdhCollectQueryData(hQuery);
await Bun.sleep(1000);
Pdh.PdhCollectQueryData(hQuery);

// Read and display formatted values
console.log('Performance Counters:');

for (let i = 0; i < handles.length; i++) {
  const valueBuf = Buffer.alloc(24); // PDH_FMT_COUNTERVALUE
  const status = Pdh.PdhGetFormattedCounterValue(handles[i], 0x0000_0200, null, valueBuf.ptr); // PDH_FMT_DOUBLE

  if (status === 0) {
    const value = valueBuf.readDoubleLE(8);
    console.log(`  ${counters[i].split('\\').pop()}: ${value.toFixed(2)}`);
  }
}

// Enumerate available performance objects (sizing call then actual call)
const sizeBuf = Buffer.alloc(4);
sizeBuf.writeUInt32LE(0, 0);
Pdh.PdhEnumObjectsW(null, null, null, sizeBuf.ptr, 400, 1);
const requiredSize = sizeBuf.readUInt32LE(0);

if (requiredSize > 0) {
  const objectsBuf = Buffer.alloc(requiredSize * 2); // wide chars
  sizeBuf.writeUInt32LE(requiredSize, 0);
  const enumStatus = Pdh.PdhEnumObjectsW(null, null, objectsBuf.ptr, sizeBuf.ptr, 400, 0);

  if (enumStatus === 0) {
    const raw = objectsBuf.toString('utf16le');
    const objects = raw.split('\0').filter(Boolean);
    console.log(`\nAvailable performance objects: ${objects.length}`);
    console.log('  First 10:');

    for (const obj of objects.slice(0, 10)) {
      console.log(`    ${obj}`);
    }
  }
}

// Cleanup
for (const h of handles) Pdh.PdhRemoveCounter(h);
Pdh.PdhCloseQuery(hQuery);
