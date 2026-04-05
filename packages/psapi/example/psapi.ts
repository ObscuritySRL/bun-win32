import Psapi from '../index';

// Enumerate all processes on the system
const processIdBuffer = Buffer.alloc(4096);
const sizeNeededBuffer = Buffer.alloc(4);

const success = Psapi.EnumProcesses(processIdBuffer.ptr, processIdBuffer.byteLength, sizeNeededBuffer.ptr);

if (!success) {
  console.error('EnumProcesses failed.');
  process.exit(1);
}

const bytesReturned = sizeNeededBuffer.readUInt32LE(0);
const processCount = bytesReturned / 4;

console.log(`Found ${processCount} processes.`);

// Print the first 10 process IDs
const view = new DataView(processIdBuffer.buffer);

for (let index = 0; index < Math.min(processCount, 10); index++) {
  const processId = view.getUint32(index * 4, true);
  console.log(`  PID: ${processId}`);
}

// Get performance info
const performanceInfoSize = 104; // sizeof(PERFORMANCE_INFORMATION) on x64
const performanceInfoBuffer = Buffer.alloc(performanceInfoSize);

new DataView(performanceInfoBuffer.buffer).setUint32(0, performanceInfoSize, true);

const performanceSuccess = Psapi.GetPerformanceInfo(performanceInfoBuffer.ptr, performanceInfoSize);

if (performanceSuccess) {
  const performanceView = new DataView(performanceInfoBuffer.buffer);
  const commitTotal = Number(performanceView.getBigUint64(0x08, true));
  const commitLimit = Number(performanceView.getBigUint64(0x10, true));
  const commitPeak = Number(performanceView.getBigUint64(0x18, true));
  const physicalTotal = Number(performanceView.getBigUint64(0x20, true));
  const physicalAvailable = Number(performanceView.getBigUint64(0x28, true));
  const pageSize = Number(performanceView.getBigUint64(0x50, true));
  const handleCount = performanceView.getUint32(0x58, true);
  const processCountInfo = performanceView.getUint32(0x5c, true);
  const threadCount = performanceView.getUint32(0x60, true);

  console.log('\nPerformance Info:');
  console.log(`  Page Size:      ${pageSize} bytes`);
  console.log(`  Commit Total:   ${((commitTotal * pageSize) / 1_073_741_824).toFixed(2)} GB`);
  console.log(`  Commit Limit:   ${((commitLimit * pageSize) / 1_073_741_824).toFixed(2)} GB`);
  console.log(`  Commit Peak:    ${((commitPeak * pageSize) / 1_073_741_824).toFixed(2)} GB`);
  console.log(`  Physical Total: ${((physicalTotal * pageSize) / 1_073_741_824).toFixed(2)} GB`);
  console.log(`  Physical Avail: ${((physicalAvailable * pageSize) / 1_073_741_824).toFixed(2)} GB`);
  console.log(`  Handles:        ${handleCount}`);
  console.log(`  Processes:      ${processCountInfo}`);
  console.log(`  Threads:        ${threadCount}`);
} else {
  console.error('GetPerformanceInfo failed.');
}
