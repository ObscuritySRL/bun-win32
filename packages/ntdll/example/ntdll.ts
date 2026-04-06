import Ntdll, { STATUS_SUCCESS } from '../index';

// ---- OS version via RtlGetVersion -------------------------------------------

const versionInfo = Buffer.alloc(0x11c); // RTL_OSVERSIONINFOW
versionInfo.writeUInt32LE(0x11c, 0); // dwOSVersionInfoSize

const versionStatus = Ntdll.RtlGetVersion(versionInfo.ptr);

if (versionStatus === STATUS_SUCCESS) {
  const major = versionInfo.readUInt32LE(4);
  const minor = versionInfo.readUInt32LE(8);
  const build = versionInfo.readUInt32LE(12);
  console.log('OS version: Windows %d.%d.%d', major, minor, build);
} else {
  console.error('RtlGetVersion failed: 0x%s', (versionStatus >>> 0).toString(16));
}

// ---- System time via NtQuerySystemTime --------------------------------------

const systemTime = Buffer.alloc(8);
const timeStatus = Ntdll.NtQuerySystemTime(systemTime.ptr);

if (timeStatus === STATUS_SUCCESS) {
  const ticks = systemTime.readBigInt64LE(0);
  // Convert Windows FILETIME (100ns ticks since 1601-01-01) to JS Date
  const milliseconds = Number(ticks / 10_000n) - 11_644_473_600_000;
  console.log('System time: %s', new Date(milliseconds).toISOString());
} else {
  console.error('NtQuerySystemTime failed: 0x%s', (timeStatus >>> 0).toString(16));
}
