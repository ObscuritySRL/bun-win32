# bun-netdiag

**Syscall-grade network diagnostics for Bun on Windows.** Routing table, socket→PID(+module) map, no-admin ICMP ping/traceroute, ARP/neighbors, DNS, live throughput, and WiFi — every result decoded from a **binary Win32 struct** via `bun:ffi`, never scraped from `netsh`/`ping.exe`/`wmic`/`arp`/`netstat` text.

```sh
bun add bun-netdiag
```

The unscoped front door for [`@bun-win32/netdiag`](https://www.npmjs.com/package/@bun-win32/netdiag) — `export * from '@bun-win32/netdiag'`. A few kilobytes of TypeScript, **zero native binaries**; every DLL it calls already ships in `C:\Windows\System32`.

- **Zero child processes** — no `wmic`/`ping.exe`/`netsh`/`tracert`/PowerShell, no CMD-window flash.
- **Zero native build** — pure `bun:ffi`, no `node-gyp`, no Node-version drift.
- **Zero Administrator** — ICMP echo and every table read are unprivileged (the selftest runs non-elevated).
- **Locale-immune** — struct fields don't translate; French/German Windows can't break a `DataView`.

## 10-line wow

```ts
import { defaultGateway, ping, tcpConnections, throughput } from 'bun-netdiag';

defaultGateway();                                         // '192.168.0.1'  — GetIpForwardTable2, no wmic
(await ping('1.1.1.1')).roundTripMs;                      // 11            — ICMP reply struct, no admin
tcpConnections({ resolveNames: 'module' })                // socket → PID → owning module, one syscall
  .filter((c) => c.state === 'established')
  .map((c) => `${c.remoteAddress}:${c.remotePort}  ${c.pid}  ${c.processName}`);
//  160.79.104.10:443   20408   claude.exe
//  52.96.157.162:443   24320   opera.exe
(await throughput(1000))[0];                              // { name: 'Wi-Fi', rxBytesPerSec: 82_700_000, txBytesPerSec }
```

## Why this exists

Every Windows networking package on npm either **shells out** to a localized command and regex-scrapes stdout, or builds a **node-gyp native addon**. Both break. netdiag reads the same IP Helper / wlanapi / dnsapi structs the OS reads.

| incumbent | weekly downloads | what's wrong | netdiag |
|---|---|---|---|
| `default-gateway` | 8.1M | **archived 2026-02-05**; spawns `wmic` (being removed from Win11) | `defaultGateway()` reads `GetIpForwardTable2` |
| `systeminformation` | 5.87M | spawns PowerShell/`netstat`; **PID-only** sockets; 500 ms throttle; CVE-2021-21315 | `tcpConnections()` adds the **module name**; `throughput()` is sub-ms; no shell |
| `node-ping` | 190k | spawns `ping.exe`, crashes on French Windows (#64) | `ping()` reads `ICMP_ECHO_REPLY` — no locale |
| `node-wifi` | 2.9k | stale; `netsh` field-drift (#184), Unicode SSID mangling (#198) | wlanapi structs by offset; raw-UTF-8 SSID |
| `net-ping` / `raw-socket` | 1.4k+1.8k | node-gyp fails Node 20/24 (#91); raw socket needs admin (#88) | `IcmpSendEcho` — no node-gyp, no admin |

**No zero-install, pure-FFI Windows network-diagnostics competitor exists on npm** (verified 2026-06-13).

## API & docs

`adapters` · `routes`/`defaultGateway` · `neighbors`/`arpTable` · `tcpConnections`/`udpListeners` · `ping`/`pingMany`/`pingSweep`/`traceroute` · `resolve`/`reverse`/`lookup` · `tcp/ip/udpStatistics`/`interfaceCounters`/`throughput` · `bestRoute`/`pathMtu` · `wifiInterfaces`/`wifiScan`/`wifiConnection`/`wifiBssList` · the raw escape hatch.

Full surface contract and gotchas: [`@bun-win32/netdiag` AI.md](https://github.com/ObscuritySRL/bun-win32/blob/main/packages/netdiag/AI.md).

## What this does NOT do

Cross-platform · HTTP reachability (use `fetch()`) · raw packet capture / ARP writes (need admin) · OUI/vendor lookup · battle-tested WiFi connect (`wifiConnect` is a flagged beta).

## License

MIT. Part of [bun-win32](https://github.com/ObscuritySRL/bun-win32).
