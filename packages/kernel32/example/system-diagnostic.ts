/**
 * System Diagnostic
 *
 * A comprehensive system information dashboard that queries hardware, memory,
 * storage, and timing details through Kernel32 APIs. Every value is formatted
 * with aligned labels, human-readable sizes, and progress bars where applicable.
 *
 * APIs demonstrated:
 *   - GetNativeSystemInfo          (CPU architecture, core count, page size)
 *   - GlobalMemoryStatusEx         (physical/virtual memory, page file stats)
 *   - GetLogicalDrives             (bitmask of mounted drive letters)
 *   - GetDiskFreeSpaceExW          (per-drive capacity and free space)
 *   - GetComputerNameW             (NetBIOS machine name)
 *   - GetSystemDirectoryW          (system32 path)
 *   - GetWindowsDirectoryW         (Windows root path)
 *   - GetTickCount64               (uptime in milliseconds)
 *   - QueryPerformanceCounter      (high-resolution timestamp)
 *   - QueryPerformanceFrequency    (timer frequency in Hz)
 *   - GetCurrentProcessId          (our own PID)
 *
 * Run: bun run example/system-diagnostic.ts
 */
import { ptr } from 'bun:ffi';
import Kernel32, { STD_HANDLE } from '../index';

Kernel32.Preload([
  'GetNativeSystemInfo',
  'GlobalMemoryStatusEx',
  'GetLogicalDrives',
  'GetDiskFreeSpaceExW',
  'GetComputerNameW',
  'GetSystemDirectoryW',
  'GetWindowsDirectoryW',
  'GetTickCount64',
  'QueryPerformanceCounter',
  'QueryPerformanceFrequency',
  'GetCurrentProcessId',
  'GetStdHandle',
  'SetConsoleTextAttribute',
]);

const hStdout = Kernel32.GetStdHandle(STD_HANDLE.OUTPUT);

function formatBytes(bytes: bigint | number): string {
  const b = typeof bytes === 'bigint' ? Number(bytes) : bytes;
  if (b === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  let i = 0;
  let size = b;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(2)} ${units[i]}`;
}

function progressBar(percent: number, width = 30): string {
  const clamped = Math.min(100, Math.max(0, percent));
  const filled = Math.round((clamped / 100) * width);
  return '[' + '\u2588'.repeat(filled) + '\u2591'.repeat(width - filled) + `] ${clamped.toFixed(1)}%`;
}

function readWideString(buffer: ArrayBuffer, maxChars: number): string {
  const bytes = new Uint8Array(buffer);
  let result = '';
  for (let i = 0; i < maxChars; i++) {
    const code = (bytes[i * 2] ?? 0) | ((bytes[i * 2 + 1] ?? 0) << 8);
    if (code === 0) break;
    result += String.fromCharCode(code);
  }
  return result;
}

function getArchName(arch: number): string {
  const map: Record<number, string> = {
    0: 'x86 (32-bit)',
    5: 'ARM',
    6: 'IA-64 (Itanium)',
    9: 'x64 (AMD64)',
    12: 'ARM64',
  };
  return map[arch] ?? `Unknown (${arch})`;
}

const W = 78;
const HR = '\u2550'.repeat(W - 2);

function boxTop(): string {
  return `\u2554${HR}\u2557`;
}
function boxBottom(): string {
  return `\u255A${HR}\u255D`;
}
function boxSep(): string {
  return `\u2560${HR}\u2563`;
}
function boxLine(content: string): string {
  const visible = content.replace(/\x1b\[\d+m/g, '');
  const pad = W - 2 - visible.length;
  return `\u2551 ${content}${' '.repeat(Math.max(0, pad - 1))}\u2551`;
}
function boxTitle(title: string): string {
  return boxLine(`  ${title}`);
}
function boxRow(label: string, value: string): string {
  return boxLine(`  ${label.padEnd(20)} ${value}`);
}

// CPU information
const sysInfoBuf = new ArrayBuffer(48);
Kernel32.GetNativeSystemInfo(ptr(sysInfoBuf));
const sysInfoView = new DataView(sysInfoBuf);
const processorArch = sysInfoView.getUint16(0, true);
const pageSize = sysInfoView.getUint32(4, true);
const minAppAddr = sysInfoView.getBigUint64(8, true);
const maxAppAddr = sysInfoView.getBigUint64(16, true);
const activeProcessorMask = sysInfoView.getBigUint64(24, true);
const processorCount = sysInfoView.getUint32(32, true);
const processorType = sysInfoView.getUint32(36, true);
const allocGranularity = sysInfoView.getUint16(40, true);
const processorLevel = sysInfoView.getUint16(42, true);
const processorRevision = sysInfoView.getUint16(44, true);

// Memory information
const memBuf = new ArrayBuffer(64);
new DataView(memBuf).setUint32(0, 64, true); // dwLength
Kernel32.GlobalMemoryStatusEx(ptr(memBuf));
const memView = new DataView(memBuf);
const memoryLoad = memView.getUint32(4, true);
const totalPhysMem = memView.getBigUint64(8, true);
const availPhysMem = memView.getBigUint64(16, true);
const totalPageFile = memView.getBigUint64(24, true);
const availPageFile = memView.getBigUint64(32, true);
const totalVirtual = memView.getBigUint64(40, true);
const availVirtual = memView.getBigUint64(48, true);

// Computer name
const nameBuf = new ArrayBuffer(64);
const nameSizeBuf = new ArrayBuffer(4);
new DataView(nameSizeBuf).setUint32(0, 32, true);
Kernel32.GetComputerNameW(ptr(nameBuf), ptr(nameSizeBuf));
const computerName = readWideString(nameBuf, 32);

// System and Windows directories
const sysDirBuf = new ArrayBuffer(520);
const winDirBuf = new ArrayBuffer(520);
const sysDirLen = Kernel32.GetSystemDirectoryW(ptr(sysDirBuf), 260);
const winDirLen = Kernel32.GetWindowsDirectoryW(ptr(winDirBuf), 260);
const systemDir = Buffer.from(sysDirBuf.slice(0, sysDirLen * 2)).toString('utf16le');
const windowsDir = Buffer.from(winDirBuf.slice(0, winDirLen * 2)).toString('utf16le');

// Uptime
const uptickMs = Number(Kernel32.GetTickCount64());
const uptimeSec = Math.floor(uptickMs / 1000);
const days = Math.floor(uptimeSec / 86400);
const hours = Math.floor((uptimeSec % 86400) / 3600);
const minutes = Math.floor((uptimeSec % 3600) / 60);
const seconds = uptimeSec % 60;
const uptimeStr = `${days}d ${hours}h ${minutes}m ${seconds}s`;

// Performance counter
const freqBuf = new ArrayBuffer(8);
const counterBuf = new ArrayBuffer(8);
Kernel32.QueryPerformanceFrequency(ptr(freqBuf));
Kernel32.QueryPerformanceCounter(ptr(counterBuf));
const perfFreq = new DataView(freqBuf).getBigInt64(0, true);
const perfCounter = new DataView(counterBuf).getBigInt64(0, true);
const perfResolutionNs = Number(1_000_000_000n / perfFreq);

// Process ID
const pid = Kernel32.GetCurrentProcessId();

// Drive enumeration
const drivesMask = Kernel32.GetLogicalDrives();
interface DriveInfo {
  letter: string;
  totalBytes: bigint;
  freeBytes: bigint;
  availBytes: bigint;
}
const driveInfos: DriveInfo[] = [];

for (let i = 0; i < 26; i++) {
  if (!(drivesMask & (1 << i))) continue;
  const letter = String.fromCharCode(65 + i);
  const rootPath = Buffer.from(`${letter}:\\\0`, 'utf16le');
  const availBuf = new ArrayBuffer(8);
  const totalBuf = new ArrayBuffer(8);
  const freeBuf = new ArrayBuffer(8);

  const ok = Kernel32.GetDiskFreeSpaceExW(rootPath.ptr, ptr(availBuf), ptr(totalBuf), ptr(freeBuf));
  if (ok) {
    driveInfos.push({
      letter,
      totalBytes: new DataView(totalBuf).getBigUint64(0, true),
      freeBytes: new DataView(freeBuf).getBigUint64(0, true),
      availBytes: new DataView(availBuf).getBigUint64(0, true),
    });
  } else {
    driveInfos.push({ letter, totalBytes: 0n, freeBytes: 0n, availBytes: 0n });
  }
}

// Render
const lines: string[] = [];
lines.push(boxTop());
lines.push(boxLine('              SYSTEM DIAGNOSTIC REPORT'));
lines.push(boxLine('              powered by @bun-win32/kernel32'));
lines.push(boxSep());

lines.push(boxTitle('PROCESSOR'));
lines.push(boxRow('Architecture:', getArchName(processorArch)));
lines.push(boxRow('Logical Cores:', `${processorCount}`));
lines.push(boxRow('Processor Level:', `${processorLevel}`));
lines.push(boxRow('Processor Revision:', `0x${processorRevision.toString(16).padStart(4, '0')}`));
lines.push(boxRow('Processor Type:', `${processorType}`));
lines.push(boxRow('Active Mask:', `0x${activeProcessorMask.toString(16)}`));
lines.push(boxRow('Page Size:', `${pageSize.toLocaleString()} bytes`));
lines.push(boxRow('Alloc Granularity:', `${allocGranularity.toLocaleString()} bytes`));
lines.push(boxRow('Min App Address:', `0x${minAppAddr.toString(16)}`));
lines.push(boxRow('Max App Address:', `0x${maxAppAddr.toString(16)}`));

lines.push(boxSep());
lines.push(boxTitle('MEMORY'));
const usedPhysMem = totalPhysMem - availPhysMem;
lines.push(boxRow('Total Physical:', formatBytes(totalPhysMem)));
lines.push(boxRow('Available:', formatBytes(availPhysMem)));
lines.push(boxRow('In Use:', formatBytes(usedPhysMem)));
lines.push(boxRow('Memory Load:', progressBar(memoryLoad)));
lines.push(boxRow('Page File Total:', formatBytes(totalPageFile)));
lines.push(boxRow('Page File Free:', formatBytes(availPageFile)));
const pageFileUsedPct = totalPageFile > 0n ? Number((totalPageFile - availPageFile) * 100n / totalPageFile) : 0;
lines.push(boxRow('Page File Usage:', progressBar(pageFileUsedPct)));
lines.push(boxRow('Virtual Total:', formatBytes(totalVirtual)));
lines.push(boxRow('Virtual Available:', formatBytes(availVirtual)));

lines.push(boxSep());
lines.push(boxTitle('STORAGE'));
for (const d of driveInfos) {
  if (d.totalBytes === 0n) {
    lines.push(boxRow(`Drive ${d.letter}:`, 'Not ready / no media'));
    continue;
  }
  const usedBytes = d.totalBytes - d.freeBytes;
  const usedPct = Number(usedBytes * 100n / d.totalBytes);
  lines.push(boxRow(`Drive ${d.letter}: Total`, formatBytes(d.totalBytes)));
  lines.push(boxRow(`         Free`, formatBytes(d.freeBytes)));
  lines.push(boxRow(`         Used`, `${formatBytes(usedBytes)} ${progressBar(usedPct, 20)}`));
  lines.push(boxRow(`         Available`, formatBytes(d.availBytes)));
}

lines.push(boxSep());
lines.push(boxTitle('SYSTEM'));
lines.push(boxRow('Computer Name:', computerName));
lines.push(boxRow('System Dir:', systemDir));
lines.push(boxRow('Windows Dir:', windowsDir));
lines.push(boxRow('Process ID:', `${pid}`));

lines.push(boxSep());
lines.push(boxTitle('TIMING'));
lines.push(boxRow('System Uptime:', uptimeStr));
lines.push(boxRow('Uptime (raw ms):', `${uptickMs.toLocaleString()}`));
lines.push(boxRow('Perf Counter:', perfCounter.toString()));
lines.push(boxRow('Perf Frequency:', `${perfFreq.toLocaleString()} Hz`));
lines.push(boxRow('Timer Resolution:', `${perfResolutionNs} ns`));

lines.push(boxBottom());

console.log(lines.join('\n'));
