# bun-sysmon

Native-speed Windows system monitoring for [Bun](https://bun.sh) — CPU, memory, disk, process, socket, GPU-per-process metrics, native perfmon counters, a typed Event Log tail, and a decoded real-time ETW firehose. Direct FFI into DLLs already in System32: **no PowerShell, no wmic, no WMI, no node-gyp, no vendored .exe**.

```ts
import { memory, osInfo, processes, tcpSockets } from 'bun-sysmon';

const os = osInfo();
const ram = memory();
const top = processes()
  .sort((a, b) => Number(b.kernelTime + b.userTime - a.kernelTime - a.userTime))
  .slice(0, 5);
console.log(`Windows ${os.major}.${os.minor}.${os.build} · ${ram.memoryLoadPercent}% RAM used · ${tcpSockets().length} TCP sockets`);
console.log(`Top processes by CPU time: ${top.map((p) => p.name).join(', ')}`);
```

```
Windows 10.0.26200 · 55% RAM used · 219 TCP sockets
Top processes by CPU time: Idle, opera.exe, opera.exe, System, WaveLink.exe
```

`bun add bun-sysmon` is the entire install story — kilobytes of TypeScript over DLLs every Windows installation already has.

![taskman](https://raw.githubusercontent.com/ObscuritySRL/bun-win32/main/packages/all/screenshots/taskman.png)

*`example/taskman.ts` — per-core bars + ranked process table, sampling at ~680 Hz with 0.1% own CPU.*

## Why this exists

Microsoft removed `wmic` from Windows 11 24H2/25H2 and Server 2025, hard-breaking the ~20M-download/week monitoring cluster whose universal "fix" was spawning `powershell.exe` per sample — 100 ms-class latency, AV-scanned, blocked by enterprise script policy, and the architecture behind a serial command-injection CVE history.

| package | dl/week | install model | the catch |
| --- | ---: | --- | --- |
| systeminformation | 7.0M | spawns PowerShell per call | 16 injection advisories (incl. CISA-KEV [CVE-2021-21315](https://github.com/advisories/GHSA-2m39-62fm-q8r3), [CVE-2024-56334](https://github.com/advisories/GHSA-cww6-9c9c-r4mq), [CVE-2025-68154](https://github.com/advisories/GHSA-wphj-fx3q-84ch), three more in 2026); `disksIO()`/`fsStats()` return null on Windows; cached/standby memory hard-zeroed; a 1 Hz poll pegs a core ([#626](https://github.com/sebhildebrandt/systeminformation/issues/626)) |
| pidusage | 4.5M | spawns wmic → gwmi | the fallback is broken by construction (its own TODO admits it; [#190](https://github.com/soyuka/pidusage/issues/190)/[#191](https://github.com/soyuka/pidusage/issues/191) open, no response); Windows CPU% documented "Not Accurate" |
| ps-tree | 3.3M | spawns wmic | abandoned 2018; hard-broken on Server 2025 ([#69](https://github.com/indexzero/ps-tree/issues/69) closed "not planned") |
| check-disk-space | 3.4M | spawns PowerShell per check | stale 3 years; rejects UNC paths by design |
| ps-list | 1.6M | vendored fastlist.exe | AV-flagged ([#42](https://github.com/sindresorhus/ps-list/issues/42)); dies under single-file bundling; pid/ppid/name only; no ARM64 |
| pidtree | 19.6M | spawns wmic → powershell.exe | per-sample spawn either way |
| @vscode/windows-process-tree | 68k | `node-gyp rebuild` on every install | toolchain required; minimal fields; no Bun |

bun-sysmon is the same data in microseconds, typed end to end, with zero spawn surface — the injection CVE class is structurally impossible.

## Benchmarks (measured, reproduce with `bun run example/benchmark.ts`)

Intel i9-12900KS (24 logical cores) · Windows 11 build 26200 · Bun 1.4.0:

| call | median latency |
|------|---------------:|
| `memory()` | 0.8 µs |
| `cpuTimes()` | 9.7 µs |
| `tcpSockets()` | 108.1 µs |
| `processes()` — the ENTIRE process list, full rows | 3.90 ms |
| `pidStats(pid)` | 3.80 ms |
| sustained `CpuSampler` rate | 690 Hz @ 0.8% own CPU |
| **one** `powershell Get-CimInstance Win32_Process` spawn | **346 ms** |

`processes()` is **89× faster** than the single spawn the wmic-era cluster pays *per sample* — and it returns ppid, threads, handles, working set, private bytes, IO counters, and create time for every process, from one syscall.

## What you can do

The whole process list in one syscall — what pidusage spawns a process per pid to approximate:

```ts
import { pidStats, processTree, processes } from 'bun-sysmon';
const rows = processes(); // 400+ full rows in ~4 ms
const stats = pidStats(process.pid); // the pidusage shape: {cpu, memory, ppid, pid, ctime, elapsed, timestamp}
const tree = processTree(); // ps-tree on wmic-less Windows
console.log(rows.length, stats.memory, tree.children.length);
```

Per-core CPU% the way Task Manager computes it, at kilohertz-class rates:

```ts
import { CpuSampler, createTicker } from 'bun-sysmon';
const sampler = new CpuSampler();
const ticker = createTicker(1); // ~700 Hz real, near-zero CPU (Bun.sleep quantizes to 15.6 ms — this doesn't)
for (let i = 0; i < 1_000; i += 1) {
  ticker.wait();
  void sampler.sample().perCore;
}
ticker.dispose();
```

Socket→PID without netstat, drives with UNC + quota-aware free space, per-interface counters:

```ts
import { diskSpace, drives, interfaceCounters, tcpSockets } from 'bun-sysmon';
console.log(tcpSockets({ resolveProcessNames: true }).filter((s) => s.state === 2).length, 'listeners');
console.log(drives().map((d) => `${d.path} ${d.filesystem}`).join(' '), diskSpace('C:').availableBytes);
console.log(interfaceCounters().filter((i) => i.operStatus === 1).map((i) => i.alias).join(', '));
```

And the capabilities **no npm package offers**:

- **Real-time decoded ETW** — `new EtwSession().run(onEvent, { durationMs })` streams decoded kernel events (Procmon-lite; elevated). The no-admin census: `etwProviders()` (1100+ providers) + `etwProviderSchema(guid)` (full event templates).
- **Live Event Log tail with publisher message formatting** — `for await (const e of tailEvents({ channel: 'System' }))`. The one native rival (nwinread) returns raw XML only, x64-only prebuilds, and its repo is gone.
- **Native PDH perfmon counters** — `CounterSet`, locale-proof English paths, wildcard expansion; the only direct PDH binding on npm.
- **Per-process GPU%** — `gpuUsageByProcess()`, Task Manager's GPU column ([pidusage#131](https://github.com/soyuka/pidusage/issues/131) has asked since 2021).
- **SMBIOS without WMI** — `smbios()`: BIOS/board/CPU/per-slot RAM straight from the firmware table.
- **File-lock forensics** — `whoLocks(paths)`: which processes hold a file open (Restart Manager).
- **Disk I/O counters** — `diskIoCounters()` + `processIoCounters(pid)` (systeminformation returns null on Windows, [#274](https://github.com/sebhildebrandt/systeminformation/issues/274)).
- Plus `cpuFrequency()` (live, not the base clock), `sessions()` (real RDP/console attribution), `powerStatus()`/`batteryState()`/`powerScheme()`, handle/GDI/USER object counts, and a high-res `watch()` that samples at ~700 Hz for the CPU cost systeminformation's `observe()` spends on 1 Hz.

![sysmon-report](https://raw.githubusercontent.com/ObscuritySRL/bun-win32/main/packages/all/screenshots/sysmon-report.png)

*`example/sysmon-report.ts` — the full census on one page: SMBIOS identity, memory + commit, top processes, drives, socket owners, sessions — zero spawns.*

## Honest scoping

- **Windows 10/11 + Server, Bun ≥ 1.1, x64.** Not a cross-platform library — that's systeminformation's value, not this package's. Windows-native depth is the thesis.
- **Node core already covers the trivial cases** — `os.freemem()`, `process.cpuUsage()`, `fs.statfs` (single-path free space). sysmon's value is everything core can't reach: other-process metrics, per-core load, socket→PID, counters, ETW, the Event Log, SMBIOS, GPU%.
- **Real-time ETW needs an elevated process and blocks the JS thread while pumping** (`durationMs` is the contract). Everything else — including the provider census and the Event Log tail — is no-admin.
- **EvtSubscribe push and a worker-owned ETW AsyncIterable are deliberately out of v1** (foreign-thread callbacks are a crash class under FFI). The tail is pull+poll; the firehose is blocking/foreground.
- **No CPU temperature / S.M.A.R.T. / fan speeds** — there is no universal Windows path (vendor IOCTLs; the packages that claim it usually return null). A deliberate non-goal, not an omission.

## Note to AI agents

Read [`AI.md`](https://github.com/ObscuritySRL/bun-win32/blob/main/packages/sysmon/AI.md) — it is the complete surface contract: every export with its signature, a capability→API table, copy-paste recipes, and the gotchas ledger. You should not need to read source.

## License

MIT
