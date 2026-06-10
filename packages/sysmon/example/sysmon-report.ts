/**
 * sysmon report — a full system census, richly formatted.
 *
 * One page of everything: OS + uptime, CPU layout + SMBIOS hardware identity, memory +
 * commit, top processes by CPU and working set, drives, listening sockets with owners,
 * power scheme + battery, sessions, and the observability surface counts (ETW providers,
 * event channels) — every number from direct FFI, zero spawns.
 *
 * APIs demonstrated:
 * - osInfo, uptimeMs, bootTime, cpuLayout, computerName, userName, isElevated (system)
 * - memory, performanceInfo (memory + commit) · smbios (firmware identity)
 * - processes, ProcessSampler (process census) · drives (volumes)
 * - tcpSockets (listeners with owners) · powerScheme, batteryState (power)
 * - sessions (who is logged on) · etwProviders, channels (observability counts)
 *
 * Run: bun run example/sysmon-report.ts
 */
import {
  ProcessSampler,
  batteryState,
  bootTime,
  channels,
  computerName,
  cpuLayout,
  drives,
  etwProviders,
  isElevated,
  memory,
  osInfo,
  performanceInfo,
  powerScheme,
  processes,
  sessions,
  smbios,
  tcpSockets,
  uptimeMs,
  userName,
} from '@bun-win32/sysmon';

const BOLD = '\x1b[1m';
const CYAN = '\x1b[96m';
const DIM = '\x1b[2m';
const GREEN = '\x1b[92m';
const RESET = '\x1b[0m';
const YELLOW = '\x1b[93m';

const WIDTH = 100;
const heading = (title: string): void => {
  console.log(`\n${CYAN}${BOLD}── ${title} ${'─'.repeat(Math.max(0, WIDTH - title.length - 4))}${RESET}`);
};
const row = (label: string, value: string): void => {
  console.log(`  ${DIM}${label.padEnd(22)}${RESET}${value}`);
};
const gigabytes = (bytes: number): string => `${(bytes / 1024 ** 3).toFixed(1)} GB`;

console.log(`${BOLD}${CYAN}SYSMON REPORT${RESET} ${DIM}· direct FFI into System32, zero spawns · @bun-win32/sysmon${RESET}`);

const os = osInfo();
heading('SYSTEM');
row('OS', `Windows ${os.major}.${os.minor} build ${os.build}`);
row('Computer / user', `${computerName()} \\ ${userName()}${isElevated() ? ` ${YELLOW}(elevated)${RESET}` : ''}`);
row('Booted', `${bootTime().toISOString()} (up ${(uptimeMs() / 3_600_000).toFixed(1)} h)`);

const firmware = smbios();
const layout = cpuLayout();
heading('HARDWARE (SMBIOS, no WMI)');
row('System', `${firmware.system.manufacturer} ${firmware.system.product}`);
row('Board', `${firmware.baseboard.manufacturer} ${firmware.baseboard.product}`);
row('BIOS', `${firmware.bios.vendor} ${firmware.bios.version} (${firmware.bios.releaseDate})`);
for (const processor of firmware.processors) row('CPU', `${processor.version} — ${processor.coreCount}c/${processor.threadCount}t (${layout.logicalProcessorCount} logical)`);
const populated = firmware.memoryDevices.filter((device) => device.sizeBytes > 0);
row('RAM slots', `${populated.length}/${firmware.memoryDevices.length} populated: ${populated.map((device) => `${device.locator} ${gigabytes(device.sizeBytes)}@${device.speedMegatransfers}MT/s`).join(', ')}`);

const ram = memory();
const commit = performanceInfo();
heading('MEMORY');
row('Physical', `${gigabytes(Number(ram.totalPhysicalBytes))} total · ${gigabytes(Number(ram.availablePhysicalBytes))} available · ${ram.memoryLoadPercent}% load`);
row('Commit', `${gigabytes(commit.commitTotalBytes)} / ${gigabytes(commit.commitLimitBytes)} (peak ${gigabytes(commit.commitPeakBytes)})`);
row('Cache / pools', `${gigabytes(commit.systemCacheBytes)} cache · ${gigabytes(commit.kernelPagedBytes)} paged · ${gigabytes(commit.kernelNonpagedBytes)} nonpaged`);
row('Objects', `${commit.processCount} processes · ${commit.threadCount} threads · ${commit.handleCount.toLocaleString()} handles`);

const sampler = new ProcessSampler();
void sampler.sample();
await Bun.sleep(600);
const byCpu = sampler.sample(8);
const byWorkingSet = [...processes()].sort((a, b) => b.workingSetBytes - a.workingSetBytes).slice(0, 8);
heading('TOP PROCESSES — by CPU (600 ms window)');
for (const processRow of byCpu) console.log(`  ${String(processRow.pid).padStart(6)}  ${GREEN}${processRow.cpuPercent.toFixed(1).padStart(5)}%${RESET}  ${processRow.name}`);
if (byCpu.length === 0) console.log(`  ${DIM}(machine idle)${RESET}`);
heading('TOP PROCESSES — by working set');
for (const processRow of byWorkingSet)
  console.log(`  ${String(processRow.pid).padStart(6)}  ${YELLOW}${gigabytes(processRow.workingSetBytes).padStart(8)}${RESET}  ${processRow.name} ${DIM}(${processRow.threadCount} threads, ${processRow.handleCount} handles)${RESET}`);

heading('DRIVES');
for (const drive of drives()) row(`${drive.path} (${drive.driveTypeName})`, drive.totalBytes > 0 ? `${drive.filesystem} '${drive.label}' — ${gigabytes(drive.freeBytes)} free of ${gigabytes(drive.totalBytes)}` : '(not ready)');

const listeners = tcpSockets({ resolveProcessNames: true }).filter((socket) => socket.state === 2);
heading(`LISTENING SOCKETS (${listeners.length})`);
for (const socket of listeners.slice(0, 12)) console.log(`  ${socket.localAddress.padStart(15)}:${String(socket.localPort).padEnd(5)}  ${DIM}pid ${String(socket.pid).padStart(6)}${RESET}  ${socket.processName ?? '(access denied)'}`);
if (listeners.length > 12) console.log(`  ${DIM}… and ${listeners.length - 12} more${RESET}`);

const battery = batteryState();
heading('POWER & SESSIONS');
row('Scheme', powerScheme().name);
row('Battery', battery.batteryPresent ? `${battery.charging ? 'charging' : battery.discharging ? 'discharging' : 'idle'} — ${battery.remainingCapacity}/${battery.maxCapacity}` : 'none (desktop)');
for (const session of sessions())
  row(`Session ${session.sessionId}`, `${session.stationName} — ${session.userName.length > 0 ? `${session.domain}\\${session.userName}` : '(system)'} [${session.stateName}]${session.protocol === 2 ? ' RDP' : ''}`);

heading('OBSERVABILITY SURFACE');
row('ETW providers', `${etwProviders().length} registered (census + schemas need no admin)`);
row('Event channels', `${channels().length} (query + live tail need no admin; Security needs elevation)`);
console.log('');
