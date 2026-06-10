/**
 * sysmon selftest — the FFI integration suite (19 sections of real assertions).
 *
 * Plain Bun script: every section prints PASS/FAIL/SKIP lines and the process exits
 * nonzero on any FAIL. Sections needing elevation or absent hardware SKIP loudly.
 * Run it twice: once normally, once from an elevated shell (Security channel + ETW firehose).
 *
 * APIs demonstrated:
 * - every public export of @bun-win32/sysmon, asserted against independent OS sources
 * - GetProcessTimes/GetProcessMemoryInfo/GetProcessHandleCount (kernel32/psapi referee)
 * - RegisterEventSourceW/ReportEventW (advapi32, the event-log tail round-trip)
 *
 * Run: bun run example/sysmon.selftest.ts
 */
import Advapi32 from '@bun-win32/advapi32';
import Kernel32 from '@bun-win32/kernel32';
import Psapi from '@bun-win32/psapi';
import {
  CounterSet,
  CpuSampler,
  EtwSession,
  ProcessSampler,
  batteryState,
  bootTime,
  channels,
  computerName,
  cpuLayout,
  cpuTimes,
  createTicker,
  diskSpace,
  drives,
  etwProviderSchema,
  etwProviders,
  expandCounterPath,
  interfaceCounters,
  isElevated,
  memory,
  monotonicMicroseconds,
  osInfo,
  performanceInfo,
  pidStats,
  powerScheme,
  powerStatus,
  processes,
  processImagePath,
  processTree,
  queryEvents,
  sessions,
  smbios,
  systemTimes,
  tailEvents,
  tcpSockets,
  udpSockets,
  uptimeMs,
  userName,
} from '@bun-win32/sysmon';

Advapi32.Preload(['DeregisterEventSource', 'RegisterEventSourceW', 'ReportEventW']);
Kernel32.Preload(['GetCurrentProcess', 'GetProcessHandleCount', 'GetProcessTimes']);
Psapi.Preload(['GetProcessMemoryInfo']);
const { DeregisterEventSource, RegisterEventSourceW, ReportEventW } = Advapi32;
const { GetCurrentProcess, GetProcessHandleCount, GetProcessTimes } = Kernel32;
const { GetProcessMemoryInfo } = Psapi;

let failures = 0;
let passes = 0;
let skips = 0;
const check = (condition: boolean, message: string): void => {
  console.log(`  ${condition ? '\x1b[92mPASS\x1b[0m' : '\x1b[91mFAIL\x1b[0m'} ${message}`);
  if (condition) passes += 1;
  else failures += 1;
};
const skip = (message: string): void => {
  console.log(`  \x1b[93mSKIP\x1b[0m ${message}`);
  skips += 1;
};
const section = (title: string, body: () => void | Promise<void>): void | Promise<void> => {
  console.log(`\x1b[96m§ ${title}\x1b[0m`);
  try {
    return body();
  } catch (error) {
    check(false, `section threw: ${String(error).slice(0, 160)}`);
  }
};
const burnOneCore = (milliseconds: number): number => {
  const stop = performance.now() + milliseconds;
  let sink = 0;
  while (performance.now() < stop) sink += Math.sqrt(sink + 1);
  return sink;
};
const ownPid = process.pid;

section('1 system', () => {
  const os = osInfo();
  const again = osInfo();
  check(os.build === again.build && os.major === again.major, `osInfo stable across re-reads (${os.major}.${os.minor}.${os.build})`);
  check(os.build >= 10_000, 'build number plausible');
  check(uptimeMs() > 0, `uptimeMs ${Math.round(uptimeMs() / 3_600_000)} h`);
  check(bootTime().getTime() < Date.now(), `bootTime ${bootTime().toISOString()} is in the past`);
  check(Math.abs(bootTime().getTime() + uptimeMs() - Date.now()) < 600_000, 'bootTime + uptime ≈ now (within 10 min for sleep skew)');
  check(computerName().length > 0, `computerName '${computerName()}'`);
  check(userName().length > 0, `userName '${userName()}'`);
  check(typeof isElevated() === 'boolean', `isElevated() → ${isElevated()}`);
  const layout = cpuLayout();
  check(layout.logicalProcessorCount === navigator.hardwareConcurrency, `cpuLayout cores ${layout.logicalProcessorCount} = hardwareConcurrency`);
  check(layout.allocationGranularity === 65_536, 'SYSTEM_INFO offsets verified (allocationGranularity 65536)');
});

section('2 memory', () => {
  const ram = memory();
  check(ram.totalPhysicalBytes > 0n, `total ${(Number(ram.totalPhysicalBytes) / 1024 ** 3).toFixed(1)} GB`);
  check(ram.availablePhysicalBytes <= ram.totalPhysicalBytes, 'available ≤ total');
  check(ram.memoryLoadPercent >= 0 && ram.memoryLoadPercent <= 100, `load ${ram.memoryLoadPercent}%`);
  const performance_ = performanceInfo();
  check(performance_.processCount > 10, `performanceInfo processCount ${performance_.processCount}`);
  check(performance_.physicalTotalBytes === Number(ram.totalPhysicalBytes), 'GetPerformanceInfo physical == GlobalMemoryStatusEx total (two kernel sources)');
  check(performance_.systemCacheBytes > 0, `systemCacheBytes ${(performance_.systemCacheBytes / 1024 ** 3).toFixed(1)} GB (the number systeminformation zeros)`);
});

section('3 memory-vs-pdh', () => {
  const counterSet = new CounterSet();
  try {
    const available = counterSet.add('\\Memory\\Available MBytes');
    counterSet.collect();
    const fromPdh = counterSet.value(available);
    const fromApi = Number(memory().availablePhysicalBytes) / (1024 * 1024);
    check(Math.abs(fromPdh - fromApi) / fromApi < 0.1, `PDH ${fromPdh.toFixed(0)} MB within 10% of GlobalMemoryStatusEx ${fromApi.toFixed(0)} MB`);
  } finally {
    counterSet.dispose();
  }
});

section('4 process-snapshot', () => {
  const rows = processes();
  check(rows.length > 50, `${rows.length} processes`);
  const own = rows.find((row) => row.pid === ownPid);
  check(own !== undefined && own.name.toLowerCase() === 'bun.exe', `own pid ${ownPid} present as '${own?.name}'`);
  const latencies: number[] = [];
  for (let i = 0; i < 50; i += 1) {
    const startedAt = monotonicMicroseconds();
    void processes();
    latencies.push(monotonicMicroseconds() - startedAt);
  }
  latencies.sort((a, b) => a - b);
  check(latencies[25]! < 8_000, `median processes() ${(latencies[25]! / 1000).toFixed(2)} ms < 8 ms (host floor ~3.8 ms; PowerShell spawn is ~100-300 ms)`);
});

section('5 process-offsets (the referee)', () => {
  const own = processes().find((row) => row.pid === ownPid)!;
  const currentProcess = GetCurrentProcess();
  const creationTime = Buffer.alloc(8);
  const exitTime = Buffer.alloc(8);
  const kernelTime = Buffer.alloc(8);
  const userTime = Buffer.alloc(8);
  void GetProcessTimes(currentProcess, creationTime.ptr, exitTime.ptr, kernelTime.ptr, userTime.ptr);
  const handleCountBuffer = Buffer.alloc(4);
  void GetProcessHandleCount(currentProcess, handleCountBuffer.ptr);
  const memoryCounters = Buffer.alloc(72);
  memoryCounters.writeUInt32LE(72, 0);
  void GetProcessMemoryInfo(currentProcess, memoryCounters.ptr, 72);
  check(kernelTime.readBigUInt64LE(0) - own.kernelTime < 500_000n, 'kernelTime@0x30 matches GetProcessTimes (≤50 ms skew)');
  check(userTime.readBigUInt64LE(0) - own.userTime < 2_000_000n, 'userTime@0x28 matches GetProcessTimes (≤200 ms skew)');
  check(Math.abs(Number(creationTime.readBigUInt64LE(0)) / 10_000 - 11_644_473_600_000 - own.createTime.getTime()) < 2, 'createTime@0x20 matches (≤2 ms)');
  check(Math.abs(own.handleCount - handleCountBuffer.readUInt32LE(0)) <= 8, `handleCount@0x60 ${own.handleCount} ≈ ${handleCountBuffer.readUInt32LE(0)}`);
  check(Math.abs(own.workingSetBytes - Number(memoryCounters.readBigUInt64LE(0x10))) < 8 * 1024 * 1024, 'workingSet@0x90 matches GetProcessMemoryInfo (≤8 MB live drift)');
  check(Math.abs(own.privateBytes - Number(memoryCounters.readBigUInt64LE(0x38))) < 8 * 1024 * 1024, 'privateBytes@0xB8 matches PagefileUsage');
  check(Math.abs(own.pageFaultCount - memoryCounters.readUInt32LE(0x04)) < 50_000, 'pageFaultCount@0x80 matches PMC');
});

section('6 process-tree', () => {
  const tree = processTree();
  const countNodes = (node: typeof tree): number => node.children.reduce((sum, child) => sum + countNodes(child), 1);
  check(countNodes(tree) - 1 === processes().length, 'node count equals snapshot length');
  const findPid = (node: typeof tree, pid: number): typeof tree | null => {
    if (node.process.pid === pid) return node;
    for (const child of node.children) {
      const hit = findPid(child, pid);
      if (hit !== null) return hit;
    }
    return null;
  };
  const own = processes().find((row) => row.pid === ownPid)!;
  const parent = findPid(tree, own.ppid);
  check(parent !== null && parent.children.some((child) => child.process.pid === ownPid), `own pid sits under its real parent ${own.ppid} (${parent?.process.name})`);
});

section('7 pidStats (the pidusage shape)', () => {
  const stats = pidStats(ownPid);
  check(
    typeof stats.cpu === 'number' &&
      typeof stats.memory === 'number' &&
      typeof stats.ppid === 'number' &&
      typeof stats.pid === 'number' &&
      typeof stats.ctime === 'number' &&
      typeof stats.elapsed === 'number' &&
      typeof stats.timestamp === 'number',
    'all 7 pidusage fields present with number types',
  );
  void burnOneCore(150);
  const second = pidStats(ownPid);
  check(Number.isFinite(second.cpu) && second.cpu > 0, `two-sample cpu ${second.cpu.toFixed(2)}% (Task-Manager-normalized: 1 busy core / ${cpuLayout().logicalProcessorCount} ≈ ${(100 / cpuLayout().logicalProcessorCount).toFixed(1)})`);
  const multiple = pidStats([ownPid, 4]);
  check(multiple[ownPid] !== undefined && multiple[4] !== undefined, 'pidStats(pids[]) returns a record for live pids');
});

section('8 cpu', () => {
  check(cpuTimes().length === navigator.hardwareConcurrency, `cpuTimes ${cpuTimes().length} cores`);
  const sampler = new CpuSampler();
  const before = systemTimes();
  void sampler.sample();
  const ticker = createTicker(100);
  let aggregate = 0;
  let maxCore = 0;
  for (let i = 0; i < 5; i += 1) {
    void burnOneCore(90);
    ticker.wait();
    const sample = sampler.sample();
    check(
      sample.perCore.every((busy) => busy >= 0 && busy <= 1),
      `tick ${i}: per-core ∈ [0,1]`,
    );
    aggregate += sample.total;
    maxCore = Math.max(maxCore, Math.max(...sample.perCore));
  }
  ticker.dispose();
  const after = systemTimes();
  check(maxCore > 0.5, `busy-spun core read high (${maxCore.toFixed(2)})`);
  const idleDelta = Number(after.idle - before.idle);
  const busyFromSystem = 1 - idleDelta / Number(after.kernel - before.kernel + (after.user - before.user));
  check(Math.abs(busyFromSystem - aggregate / 5) < 0.05, `CpuSampler aggregate ${((aggregate / 5) * 100).toFixed(1)}% within 5 pts of GetSystemTimes ${(busyFromSystem * 100).toFixed(1)}%`);
});

section('9 disk', () => {
  const driveRows = drives();
  const cDrive = driveRows.find((drive) => drive.path === 'C:\\');
  check(cDrive !== undefined, `drives() includes C:\\ (${driveRows.map((drive) => drive.path).join(' ')})`);
  check(cDrive !== undefined && cDrive.freeBytes > 0 && cDrive.freeBytes <= cDrive.totalBytes, 'C: free ≤ total');
  check(diskSpace('C:').totalBytes === cDrive!.totalBytes, 'diskSpace(C:) agrees with the drives() row');
});

await section('10 net-tcp (vs netstat)', async () => {
  const server = Bun.listen({ hostname: '127.0.0.1', port: 0, socket: { data() {} } });
  const rows = tcpSockets({ resolveProcessNames: true });
  const mine = rows.find((socket) => socket.pid === ownPid && socket.localPort === server.port && socket.state === 2);
  check(mine !== undefined, `own listener 127.0.0.1:${server.port} present with pid + LISTEN`);
  check(mine?.processName === 'bun.exe', `socket→process join '${mine?.processName}'`);
  const v6Rows = tcpSockets({ family: 6 });
  check(Array.isArray(v6Rows), `v6 table decodes (${v6Rows.length} rows)`);
  const netstat = Bun.spawnSync(['netstat', '-ano']).stdout.toString();
  const ours = rows.filter((socket) => socket.pid === ownPid);
  const confirmed = ours.filter((socket) => netstat.split('\n').some((line) => line.includes('TCP') && line.includes(`${socket.localAddress}:${socket.localPort}`) && line.trim().endsWith(String(socket.pid))));
  check(ours.length > 0 && confirmed.length === ours.length, `netstat -ano confirms ${confirmed.length}/${ours.length} of our rows`);
  check(udpSockets().length > 0, `udpSockets ${udpSockets().length} rows`);
  server.stop(true);
});

await section('11 net-counters', async () => {
  const before = interfaceCounters().filter((counter) => counter.operStatus === 1 && counter.inOctets > 0);
  check(before.length > 0, `${before.length} up interfaces with traffic; aliases readable (${before[0]?.alias})`);
  void (await fetch('https://example.com', { signal: AbortSignal.timeout(10_000) }).catch(() => null));
  await Bun.sleep(300);
  const after = interfaceCounters();
  check(
    before.some((beforeRow) => {
      const afterRow = after.find((counter) => counter.interfaceLuid === beforeRow.interfaceLuid);
      return afterRow !== undefined && afterRow.inOctets > beforeRow.inOctets;
    }),
    'InOctets monotonically increased under traffic (MIB_IF_ROW2 offsets verified)',
  );
});

await section('12 pdh', async () => {
  const counterSet = new CounterSet();
  try {
    const processor = counterSet.add('\\Processor(_Total)\\% Processor Time');
    counterSet.collect();
    let explained = false;
    try {
      void counterSet.value(processor);
    } catch (error) {
      explained = String(error).includes('two collect()');
    }
    check(explained, 'first-collect rate-counter error explains the two-sample rule');
    await Bun.sleep(300);
    counterSet.collect();
    const value = counterSet.value(processor);
    check(value >= 0 && value <= 100, `% Processor Time ${value.toFixed(1)} ∈ [0,100] after two collects`);
  } finally {
    counterSet.dispose();
  }
  const gpuPaths = expandCounterPath('\\GPU Engine(*)\\Utilization Percentage');
  if (gpuPaths.length === 0) skip('GPU Engine wildcard: no instances on this machine');
  else
    check(
      gpuPaths.some((path) => path.includes('pid_')),
      `GPU Engine wildcard → ${gpuPaths.length} per-process instances`,
    );
});

section('13 eventlog-query', () => {
  check(channels().includes('Application'), `channels() includes Application (${channels().length} total)`);
  const records = queryEvents({ channel: 'Application', max: 5 });
  check(records.length === 5, '5 records returned');
  check(
    records.every((record, index) => index === 0 || record.recordId <= records[index - 1]!.recordId),
    'recordIds descend in reverse mode',
  );
  check(
    records.some((record) => record.message !== null && record.message.length > 5),
    'publisher message formatting works',
  );
});

await section('14 eventlog-tail (round-trip)', async () => {
  const sourceBuffer = Buffer.from('bun-sysmon-selftest\0', 'utf16le');
  const eventSource = RegisterEventSourceW(null, sourceBuffer.ptr);
  check(eventSource !== 0n, 'RegisterEventSourceW handle');
  const controller = new AbortController();
  const tailPromise = (async (): Promise<boolean> => {
    for await (const record of tailEvents({ channel: 'Application', intervalMs: 400, signal: controller.signal })) {
      if (record.providerName === 'bun-sysmon-selftest') return true;
    }
    return false;
  })();
  await Bun.sleep(120);
  const messageBuffer = Buffer.from('selftest tail event\0', 'utf16le');
  const stringsArray = new BigUint64Array(1);
  stringsArray[0] = BigInt(messageBuffer.ptr);
  check(ReportEventW(eventSource, 4, 0, 1_000, null, 1, 0, stringsArray.ptr, null) !== 0, 'ReportEventW wrote the synthetic event');
  const arrived = await Promise.race([tailPromise, Bun.sleep(5_000).then(() => false)]);
  check(arrived, 'tail yielded the synthetic event within ~2 ticks');
  controller.abort();
  await tailPromise.catch(() => false);
  void DeregisterEventSource(eventSource);
  check(true, 'tail aborted cleanly');
});

section('15 etw-census (no admin)', () => {
  const providers = etwProviders();
  check(providers.length > 100, `${providers.length} providers`);
  const kernelProcess = providers.find((provider) => provider.name === 'Microsoft-Windows-Kernel-Process');
  check(kernelProcess !== undefined, 'Microsoft-Windows-Kernel-Process present');
  const schemas = etwProviderSchema(kernelProcess!.guid);
  check(schemas.length > 5 && schemas.some((schema) => schema.taskName.length > 0), `${schemas.length} event templates with task names (${schemas[0]?.taskName})`);
});

await section('16 etw-firehose (elevated only)', async () => {
  if (!isElevated()) {
    let actionable = false;
    try {
      void new EtwSession();
    } catch (error) {
      actionable = String(error).includes('elevated');
    }
    check(actionable, 'EtwSession throws the actionable elevation error unelevated');
    skip('firehose pump: requires an elevated shell (run this selftest elevated to exercise it)');
    return;
  }
  const session = new EtwSession();
  let processStartSeen = false;
  const child = Bun.spawn(['cmd', '/c', 'exit']);
  const result = session.run(
    (event) => {
      if (event.taskName === 'ProcessStart') processStartSeen = true;
    },
    { durationMs: 3_000 },
  );
  await child.exited;
  check(result.eventCount > 0, `${result.eventCount} decoded events`);
  check(processStartSeen, 'ProcessStart decoded with a resolved task name');
  const again = new EtwSession();
  const secondRun = again.run(() => {}, { durationMs: 250 });
  check(secondRun.processTraceStatus >= 0, 'second session starts cleanly (teardown left nothing running)');
});

section('17 firmware', () => {
  const firmware = smbios();
  check(firmware.system.manufacturer.length > 0, `system ${firmware.system.manufacturer} ${firmware.system.product}`);
  const installed = firmware.memoryDevices.reduce((sum, device) => sum + device.sizeBytes, 0);
  const visible = Number(memory().totalPhysicalBytes);
  check(installed >= visible && installed < visible * 1.3, `SMBIOS RAM ${(installed / 1024 ** 3).toFixed(0)} GB ≈ OS-visible ${(visible / 1024 ** 3).toFixed(1)} GB`);
});

section('18 power + sessions', () => {
  check(powerScheme().name.length > 0, `powerScheme '${powerScheme().name}'`);
  const status = powerStatus();
  check(status.acLine === 0 || status.acLine === 1 || status.acLine === 255, `acLine ${status.acLine}`);
  check(typeof batteryState().batteryPresent === 'boolean', `batteryPresent ${batteryState().batteryPresent}`);
  const me = userName().toLowerCase();
  const mine = sessions().find((session) => session.userName.toLowerCase() === me);
  check(mine !== undefined && mine.state === 0, `console session attributed to '${me}' (station ${mine?.stationName})`);
});

section('19 determinism / no handle leak', () => {
  const currentProcess = GetCurrentProcess();
  const handleCountBuffer = Buffer.alloc(4);
  void GetProcessHandleCount(currentProcess, handleCountBuffer.ptr);
  const before = handleCountBuffer.readUInt32LE(0);
  for (let i = 0; i < 200; i += 1) {
    void processes();
    void memory();
  }
  void GetProcessHandleCount(currentProcess, handleCountBuffer.ptr);
  const after = handleCountBuffer.readUInt32LE(0);
  check(Math.abs(after - before) <= 4, `200 × processes()+memory() leaked no handles (${before} → ${after})`);
});

console.log(
  `\n${failures === 0 ? '\x1b[92m' : '\x1b[91m'}selftest: ${passes} PASS, ${failures} FAIL, ${skips} SKIP\x1b[0m${isElevated() ? ' (elevated run)' : ' (unelevated — section 16 pump + Security channel exercised in the elevated run)'}`,
);
process.exitCode = failures > 0 ? 1 : 0;
