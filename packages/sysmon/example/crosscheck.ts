/**
 * crosscheck — every sysmon number proven against an INDEPENDENT OS source.
 *
 * The honest referee: a metric that merely returns is not a metric that is correct. Each
 * check pairs a sysmon value with a second (or third) source — another kernel API, the
 * registry, fs.statfs, or a one-shot tasklist/netstat spawn (the spawns live ONLY here, as
 * ground truth; the library itself never spawns). Exits nonzero on any FAIL.
 *
 * APIs demonstrated:
 * - memory/performanceInfo/smbios vs each other (three RAM sources)
 * - processes vs `tasklist /NH /FO CSV` · tcpSockets vs `netstat -ano`
 * - pidStats vs psapi GetProcessMemoryInfo · CpuSampler vs GetSystemTimes vs PDH
 * - drives vs fs.statfsSync + GetDiskFreeSpaceExW · osInfo vs the registry CurrentBuild
 *
 * Run: bun run example/crosscheck.ts
 */
import { statfsSync } from 'node:fs';
import Advapi32 from '@bun-win32/advapi32';
import Kernel32 from '@bun-win32/kernel32';
import Psapi from '@bun-win32/psapi';
import { CounterSet, CpuSampler, createTicker, drives, memory, osInfo, performanceInfo, pidStats, processes, smbios, systemTimes, tcpSockets } from '@bun-win32/sysmon';

Advapi32.Preload(['RegGetValueW']);
Kernel32.Preload(['GetCurrentProcess']);
Psapi.Preload(['GetProcessMemoryInfo']);
const { RegGetValueW } = Advapi32;
const { GetCurrentProcess } = Kernel32;
const { GetProcessMemoryInfo } = Psapi;

const HKEY_LOCAL_MACHINE = 0x8000_0002n;
const RRF_RT_REG_SZ = 0x0000_0002;

let failures = 0;
const check = (condition: boolean, message: string): void => {
  console.log(`${condition ? '\x1b[92mPASS\x1b[0m' : '\x1b[91mFAIL\x1b[0m'} ${message}`);
  if (!condition) failures += 1;
};

console.log('\x1b[1mcrosscheck\x1b[0m · sysmon vs independent OS ground truth\n');

// 1 — RAM: three sources
const ram = memory();
const commit = performanceInfo();
const installed = smbios().memoryDevices.reduce((sum, device) => sum + device.sizeBytes, 0);
check(commit.physicalTotalBytes === Number(ram.totalPhysicalBytes), `RAM: GetPerformanceInfo ${commit.physicalTotalBytes} == GlobalMemoryStatusEx ${ram.totalPhysicalBytes}`);
check(
  installed >= Number(ram.totalPhysicalBytes) && installed < Number(ram.totalPhysicalBytes) * 1.3,
  `RAM: SMBIOS installed ${(installed / 1024 ** 3).toFixed(0)} GB ≥ OS-visible ${(Number(ram.totalPhysicalBytes) / 1024 ** 3).toFixed(1)} GB`,
);

// 2 — processes vs tasklist (spawned ONCE, only as the referee)
const snapshotRows = processes();
const tasklist = Bun.spawnSync(['tasklist', '/NH', '/FO', 'CSV']).stdout.toString();
const tasklistRows = tasklist
  .split('\n')
  .map((line) => line.match(/^"([^"]+)","(\d+)"/))
  .filter((match) => match !== null);
const tasklistPids = new Set(tasklistRows.map((match) => Number(match[2])).filter((pid) => pid > 4)); // same domain as the snapshot filter — tasklist also lists Idle (0) and System (4)
const snapshotPids = new Set(snapshotRows.filter((row) => row.pid > 4).map((row) => row.pid));
const intersection = [...snapshotPids].filter((pid) => tasklistPids.has(pid)).length;
check(Math.abs(snapshotPids.size - tasklistPids.size) <= 12, `processes: count ${snapshotPids.size} within ±12 of tasklist ${tasklistPids.size} (the two captures are ~100 ms apart — browsers spawning workers routinely move the count by several)`);
check(intersection / Math.max(snapshotPids.size, 1) > 0.95, `processes: ${((intersection / snapshotPids.size) * 100).toFixed(1)}% of snapshot pids confirmed by tasklist`);
const namesAgree = tasklistRows.filter((match) => {
  const row = snapshotRows.find((candidate) => candidate.pid === Number(match[2]));
  return row !== undefined && row.name.toLowerCase() === match[1]!.toLowerCase();
}).length;
check(namesAgree / Math.max(tasklistRows.length, 1) > 0.9, `processes: ${((namesAgree / tasklistRows.length) * 100).toFixed(1)}% of tasklist names match the snapshot's`);

// 3 — pidStats memory vs GetProcessMemoryInfo, back-to-back
const statsMemory = pidStats(process.pid).memory;
const memoryCounters = Buffer.alloc(72);
memoryCounters.writeUInt32LE(72, 0);
void GetProcessMemoryInfo(GetCurrentProcess(), memoryCounters.ptr, 72);
const apiWorkingSet = Number(memoryCounters.readBigUInt64LE(0x10));
check(Math.abs(statsMemory - apiWorkingSet) < 4 * 1024 * 1024, `pidStats.memory ${statsMemory} ≈ GetProcessMemoryInfo ${apiWorkingSet} (≤4 MB back-to-back drift)`);

// 4 — CPU: three sources over the same window
const sampler = new CpuSampler();
const counterSet = new CounterSet();
const processorCounter = counterSet.add('\\Processor(_Total)\\% Processor Time');
void sampler.sample();
counterSet.collect();
const systemBefore = systemTimes();
const ticker = createTicker(900);
ticker.wait();
ticker.dispose();
const samplerTotal = sampler.sample().total * 100;
counterSet.collect();
const pdhTotal = counterSet.value(processorCounter);
const systemAfter = systemTimes();
counterSet.dispose();
const idleDelta = Number(systemAfter.idle - systemBefore.idle);
const windowDelta = Number(systemAfter.kernel - systemBefore.kernel + (systemAfter.user - systemBefore.user));
const systemTotal = (1 - idleDelta / windowDelta) * 100;
check(Math.abs(samplerTotal - systemTotal) < 5, `cpu: CpuSampler ${samplerTotal.toFixed(1)}% within 5 pts of GetSystemTimes ${systemTotal.toFixed(1)}%`);
check(Math.abs(samplerTotal - pdhTotal) < 8, `cpu: CpuSampler ${samplerTotal.toFixed(1)}% within 8 pts of PDH ${pdhTotal.toFixed(1)}% (three kernel sources agree)`);

// 5 — sockets vs netstat
const server = Bun.listen({ hostname: '127.0.0.1', port: 0, socket: { data() {} } });
const socketRows = tcpSockets().filter((socket) => socket.pid === process.pid);
const netstat = Bun.spawnSync(['netstat', '-ano']).stdout.toString();
const confirmed = socketRows.filter((socket) => netstat.split('\n').some((line) => line.includes('TCP') && line.includes(`${socket.localAddress}:${socket.localPort}`) && line.trim().endsWith(String(socket.pid))));
check(socketRows.length > 0 && confirmed.length === socketRows.length, `sockets: netstat confirms ${confirmed.length}/${socketRows.length} of our rows (proto/local/pid)`);
server.stop(true);

// 6 — disk vs fs.statfs + the drives row
const cDrive = drives().find((drive) => drive.path === 'C:\\')!;
const statfs = statfsSync('C:\\');
const statfsFree = Number(statfs.bsize) * Number(statfs.bavail);
check(Math.abs(statfsFree - cDrive.availableBytes) <= Number(statfs.bsize) * 4096, `disk: fs.statfs free ${statfsFree} ≈ drives() available ${cDrive.availableBytes} (live churn tolerance)`);
check(Number(statfs.bsize) * Number(statfs.blocks) === cDrive.totalBytes, `disk: fs.statfs total == drives() total ${cDrive.totalBytes}`);

// 7 — osInfo vs the registry
const buildFromApi = osInfo().build;
const subKey = Buffer.from('SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\0', 'utf16le');
const valueName = Buffer.from('CurrentBuildNumber\0', 'utf16le');
const dataBuffer = Buffer.alloc(64);
const sizeBuffer = Buffer.alloc(4);
sizeBuffer.writeUInt32LE(64, 0);
const registryStatus = RegGetValueW(HKEY_LOCAL_MACHINE, subKey.ptr, valueName.ptr, RRF_RT_REG_SZ, null, dataBuffer.ptr, sizeBuffer.ptr);
const buildFromRegistry = registryStatus === 0 ? Number(dataBuffer.toString('utf16le').replace(/\0.*$/, '')) : -1;
check(buildFromRegistry === buildFromApi, `osInfo: build ${buildFromApi} == registry CurrentBuildNumber ${buildFromRegistry}`);

console.log(`\n${failures === 0 ? '\x1b[92mcrosscheck: every number agrees with the OS\x1b[0m' : `\x1b[91mcrosscheck: ${failures} FAILURES — a wrong number is worse than a missing one\x1b[0m`}`);
process.exitCode = failures > 0 ? 1 : 0;
