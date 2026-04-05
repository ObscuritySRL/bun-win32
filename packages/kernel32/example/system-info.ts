/**
 * System Information Dashboard
 *
 * Demonstrates Kernel32 FFI bindings for querying system hardware,
 * memory, and timing information. A fun ASCII dashboard!
 */
import { ptr } from 'bun:ffi';
import Kernel32 from '@bun-win32/kernel32';

// Preload the APIs we'll use
Kernel32.Preload([
  'GetNativeSystemInfo',
  'GlobalMemoryStatusEx',
  'GetPhysicallyInstalledSystemMemory',
  'GetSystemTime',
  'GetLocalTime',
  'GetTickCount64',
  'GetCurrentProcessId',
  'GetCurrentThreadId',
  'GetComputerNameW',
  'GetLogicalDrives',
  'GetSystemDirectoryW',
  'GetWindowsDirectoryW',
  'GetVersion',
  'QueryPerformanceCounter',
  'QueryPerformanceFrequency',
]);

// ─────────────────────────────────────────────────────────────────────────────
// Struct layouts for Windows APIs
// ─────────────────────────────────────────────────────────────────────────────

// SYSTEM_INFO struct (48 bytes on x64)
const systemInfoBuffer = new ArrayBuffer(48);
const systemInfo = ptr(systemInfoBuffer);

// MEMORYSTATUSEX struct (64 bytes)
const memStatusBuffer = new ArrayBuffer(64);
const memStatus = new DataView(memStatusBuffer);
memStatus.setUint32(0, 64, true); // dwLength must be set

// SYSTEMTIME struct (16 bytes)
const systemTimeBuffer = new ArrayBuffer(16);
const localTimeBuffer = new ArrayBuffer(16);

// Large integer buffers for QueryPerformanceCounter/Frequency
const perfCounterBuffer = new ArrayBuffer(8);
const perfFreqBuffer = new ArrayBuffer(8);

// Computer name buffer (MAX_COMPUTERNAME_LENGTH + 1 = 16 chars * 2 bytes)
const computerNameBuffer = new ArrayBuffer(32);
const computerNameSize = new ArrayBuffer(4);
new DataView(computerNameSize).setUint32(0, 16, true);

// Directory buffers
const systemDirBuffer = new ArrayBuffer(520);
const windowsDirBuffer = new ArrayBuffer(520);

// ─────────────────────────────────────────────────────────────────────────────
// Fetch system information
// ─────────────────────────────────────────────────────────────────────────────

// Get system info
Kernel32.GetNativeSystemInfo(ptr(systemInfoBuffer));
const sysInfoView = new DataView(systemInfoBuffer);
const processorArchitecture = sysInfoView.getUint16(0, true);
const numberOfProcessors = sysInfoView.getUint32(20, true);
const processorType = sysInfoView.getUint32(24, true);
const pageSize = sysInfoView.getUint32(4, true);

// Get memory status
Kernel32.GlobalMemoryStatusEx(ptr(memStatusBuffer));
const memoryLoad = memStatus.getUint32(4, true);
const totalPhysicalMem = memStatus.getBigUint64(8, true);
const availPhysicalMem = memStatus.getBigUint64(16, true);
const totalVirtualMem = memStatus.getBigUint64(32, true);
const availVirtualMem = memStatus.getBigUint64(40, true);

// Get physical RAM
const physMemBuffer = new ArrayBuffer(8);
Kernel32.GetPhysicallyInstalledSystemMemory(ptr(physMemBuffer));
const physicalMemKB = new DataView(physMemBuffer).getBigUint64(0, true);

// Get times
Kernel32.GetSystemTime(ptr(systemTimeBuffer));
Kernel32.GetLocalTime(ptr(localTimeBuffer));
const sysTime = new DataView(systemTimeBuffer);
const locTime = new DataView(localTimeBuffer);

// Get uptime
const uptimeTicks = Kernel32.GetTickCount64();
const uptimeSeconds = Number(uptimeTicks) / 1000;
const uptimeDays = Math.floor(uptimeSeconds / 86400);
const uptimeHours = Math.floor((uptimeSeconds % 86400) / 3600);
const uptimeMins = Math.floor((uptimeSeconds % 3600) / 60);
const uptimeSecs = Math.floor(uptimeSeconds % 60);

// Get process/thread IDs
const processId = Kernel32.GetCurrentProcessId();
const threadId = Kernel32.GetCurrentThreadId();

// Get computer name
Kernel32.GetComputerNameW(ptr(computerNameBuffer), ptr(computerNameSize));
const computerName = Buffer.from(computerNameBuffer).toString('utf16le').split('\0')[0] ?? '';

// Get system directories
const sysDirLen = Kernel32.GetSystemDirectoryW(ptr(systemDirBuffer), 260);
const winDirLen = Kernel32.GetWindowsDirectoryW(ptr(windowsDirBuffer), 260);
const systemDir = Buffer.from(systemDirBuffer.slice(0, sysDirLen * 2)).toString('utf16le');
const windowsDir = Buffer.from(windowsDirBuffer.slice(0, winDirLen * 2)).toString('utf16le');

// Get logical drives
const drivesBitmask = Kernel32.GetLogicalDrives();
const drives: string[] = [];
for (let i = 0; i < 26; i++) {
  if (drivesBitmask & (1 << i)) {
    drives.push(String.fromCharCode(65 + i) + ':');
  }
}

// Get performance counter for high-precision timing
Kernel32.QueryPerformanceFrequency(ptr(perfFreqBuffer));
Kernel32.QueryPerformanceCounter(ptr(perfCounterBuffer));
const perfFreq = new DataView(perfFreqBuffer).getBigInt64(0, true);
const perfCounter = new DataView(perfCounterBuffer).getBigInt64(0, true);

// ─────────────────────────────────────────────────────────────────────────────
// Format helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatBytes(bytes: bigint | number): string {
  const b = typeof bytes === 'bigint' ? Number(bytes) : bytes;
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  let size = b;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(2)} ${units[i]}`;
}

function pad(n: number, width = 2): string {
  return n.toString().padStart(width, '0');
}

function getArchName(arch: number): string {
  const archs: Record<number, string> = {
    0: 'x86',
    5: 'ARM',
    6: 'IA-64',
    9: 'x64 (AMD64)',
    12: 'ARM64',
  };
  return archs[arch] || `Unknown (${arch})`;
}

function progressBar(percent: number, width = 30): string {
  const filled = Math.round((percent / 100) * width);
  const empty = width - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  return `[${bar}] ${percent}%`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Render the dashboard
// ─────────────────────────────────────────────────────────────────────────────

const localTimeStr = `${pad(locTime.getUint16(0, true))}-${pad(locTime.getUint16(2, true))}-${pad(locTime.getUint16(6, true))} ${pad(locTime.getUint16(8, true))}:${pad(locTime.getUint16(10, true))}:${pad(locTime.getUint16(12, true))}`;
const utcTimeStr = `${pad(sysTime.getUint16(0, true))}-${pad(sysTime.getUint16(2, true))}-${pad(sysTime.getUint16(6, true))} ${pad(sysTime.getUint16(8, true))}:${pad(sysTime.getUint16(10, true))}:${pad(sysTime.getUint16(12, true))}`;

console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                        SYSTEM INFORMATION DASHBOARD                          ║
║                           powered by bun-kernel32                            ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  COMPUTER                                                                    ║
║  ────────────────────────────────────────────────────────────────────────    ║
║  Name:           ${computerName.padEnd(58)}║
║  Architecture:   ${getArchName(processorArchitecture).padEnd(58)}║
║  Processors:     ${(numberOfProcessors + ' cores').padEnd(58)}║
║  Page Size:      ${(pageSize + ' bytes').padEnd(58)}║
╠══════════════════════════════════════════════════════════════════════════════╣
║  MEMORY                                                                      ║
║  ────────────────────────────────────────────────────────────────────────    ║
║  Physical RAM:   ${formatBytes(physicalMemKB * 1024n).padEnd(58)}║
║  Total Memory:   ${formatBytes(totalPhysicalMem).padEnd(58)}║
║  Available:      ${formatBytes(availPhysicalMem).padEnd(58)}║
║  Memory Load:    ${progressBar(memoryLoad).padEnd(58)}║
║  Virtual Total:  ${formatBytes(totalVirtualMem).padEnd(58)}║
║  Virtual Avail:  ${formatBytes(availVirtualMem).padEnd(58)}║
╠══════════════════════════════════════════════════════════════════════════════╣
║  TIME & UPTIME                                                               ║
║  ────────────────────────────────────────────────────────────────────────    ║
║  Local Time:     ${localTimeStr.padEnd(58)}║
║  UTC Time:       ${utcTimeStr.padEnd(58)}║
║  System Uptime:  ${`${uptimeDays}d ${uptimeHours}h ${uptimeMins}m ${uptimeSecs}s`.padEnd(58)}║
║  Perf Counter:   ${perfCounter.toString().padEnd(58)}║
║  Perf Frequency: ${(perfFreq.toString() + ' Hz').padEnd(58)}║
╠══════════════════════════════════════════════════════════════════════════════╣
║  PROCESS                                                                     ║
║  ────────────────────────────────────────────────────────────────────────    ║
║  Process ID:     ${processId.toString().padEnd(58)}║
║  Thread ID:      ${threadId.toString().padEnd(58)}║
╠══════════════════════════════════════════════════════════════════════════════╣
║  PATHS                                                                       ║
║  ────────────────────────────────────────────────────────────────────────    ║
║  System Dir:     ${systemDir.padEnd(58)}║
║  Windows Dir:    ${windowsDir.padEnd(58)}║
║  Drives:         ${drives.join(' ').padEnd(58)}║
╚══════════════════════════════════════════════════════════════════════════════╝
`);
