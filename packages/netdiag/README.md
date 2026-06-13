# @bun-win32/netdiag

**Syscall-grade network diagnostics for Bun on Windows.** Routing table, socket→PID(+module) map, no-admin ICMP ping/traceroute, ARP/neighbors, DNS, live throughput, and WiFi — every result decoded from a **binary Win32 struct** via `bun:ffi`, never scraped from `netsh`/`ping.exe`/`wmic`/`arp`/`netstat` text.

- **Zero child processes.** No `wmic`, no `ping.exe`, no `netsh`, no `tracert`, no PowerShell, no CMD-window flash.
- **Zero native build.** Pure `bun:ffi` — no `node-gyp`, no NAN addon, no Node-version drift.
- **Zero Administrator.** ICMP echo and every table read are unprivileged. The integration selftest runs in a non-elevated shell.
- **Zero dependencies** outside the workspace. Every DLL it calls already ships in `C:\Windows\System32`.
- **Locale-immune by construction.** Struct fields don't translate; a French or German Windows can't break a `DataView.getUint32`.

> Windows-only, Bun-only — stated proudly. `bun add bun-netdiag` pulls a few kilobytes of TypeScript and zero native binaries.

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

Every Windows networking package on npm either **shells out** to a localized command and regex-scrapes its stdout, or builds a **node-gyp native addon**. Both break. netdiag reads the same IP Helper / wlanapi / dnsapi structs the OS reads.

| incumbent | weekly downloads | what's wrong (receipt) | netdiag |
|---|---|---|---|
| `default-gateway` | 8.1M | **GitHub-archived 2026-02-05**; spawns `wmic`, which Microsoft is removing from Windows 11 ([#25](https://github.com/silverwind/default-gateway/issues/25)); maintainer: *"parsing command output is a wrong approach"* ([#27](https://github.com/silverwind/default-gateway/issues/27)) | `defaultGateway()` reads `GetIpForwardTable2` directly |
| `systeminformation` | 5.87M | spawns PowerShell/`netstat`/`netsh`; sockets are **PID-only** (hardcoded `process:''`); `networkStats` has a **500 ms throttle**; CVE-2021-21315 shell-injection class | `tcpConnections()` adds the **module name**; `throughput()` is sub-ms; no shell to inject |
| `node-ping` | 190k | spawns `ping.exe` + regex-parses localized stdout — crashes on French Windows (`temps`, [#64](https://github.com/danielzzz/node-ping/issues/64)); `alive` always false ([#26](https://github.com/danielzzz/node-ping/issues/26)) | `ping()` reads `ICMP_ECHO_REPLY.RoundTripTime` (u32) — no locale, ever |
| `node-wifi` | 2.9k | stale since 2021; `netsh` field-reorder on Win11 → `ssid='connected'` ([#184](https://github.com/friedrith/node-wifi/issues/184)); Unicode SSID mangling ([#198](https://github.com/friedrith/node-wifi/issues/198)) | `wifiScan()`/`wifiConnection()` read wlanapi structs by offset; SSID is raw UTF-8 |
| `local-devices` / arp scrapers | 3.4k | spawn `arp -a` with a fixed-index parser; `arp -n` Unix flag fails on Windows ([#75](https://github.com/DylanPiercey/local-devices/issues/75)); device name always `?` ([#21](https://github.com/DylanPiercey/local-devices/issues/21)) | `neighbors()` reads `GetIpNetTable2` — typed, with reachability **state** and IPv6 ND; `reverse()` for names |
| `net-ping` / `raw-socket` | 1.4k+1.8k | `node-gyp` build fails on Node 20/24 ([#91](https://github.com/nospaceships/node-raw-socket/issues/91)); raw ICMP socket needs **Administrator** ([#88](https://github.com/nospaceships/node-net-ping/issues/88)) | `ping()`/`traceroute()` over `IcmpSendEcho` — no node-gyp, no admin, no raw socket |
| `node-netstat` / `windows-netstat` | 2.7k+6 | spawn `netstat` (LISTEN/LISTENING drift, [#42](https://github.com/danielkrainas/node-netstat/issues/42)) or node-gyp IPv4-only | `tcpConnections('all')` + `udpListeners('all')` — TCP4/6 + UDP4/6, canonical state strings |

**No zero-install, pure-FFI Windows network-diagnostics competitor exists on npm** (verified 2026-06-13). The niche is unoccupied.

## Benchmarks

Every table is one syscall, not a process spawn. Measured on the host below (`bun run example/benchmark.ts` — `Bun.nanoseconds`, warm-up, DFG-verified):

| operation | ns/op | samples/sec |
|---|---|---|
| `routes()` poll + decode | ~31,700 | ~31,500 |
| `tcpConnections()` poll (v4+v6) | ~194,000 | ~5,100 |
| `IcmpSendEcho` to 127.0.0.1 | ~79,800 | ~12,500 |
| `interfaceCounters()` poll | ~606,000 | ~1,650 |

Spawning `route print` once costs **~70 ms** (~14/sec). `routes()` polls **~2,200× faster** — the difference between a live dashboard and a stuttering one. (Numbers are host-specific; re-run the benchmark.)

## API

`adapters` · `routes` / `defaultGateway` · `neighbors` / `arpTable` · `tcpConnections` / `udpListeners` · `ping` / `pingMany` / `pingSweep` / `traceroute` · `resolve` / `reverse` / `lookup` · `tcpStatistics` / `ipStatistics` / `udpStatistics` / `interfaceCounters` / `throughput` · `bestRoute` / `pathMtu` · `wifiInterfaces` / `wifiScan` / `wifiConnection` / `wifiBssList` / `wifiConnect`(beta) / `wifiDisconnect`(beta) · the raw escape hatch (`Iphlpapi`, `Wlanapi`, `Dnsapi`, `Ws2_32`, `Kernel32`).

Full surface contract in [`AI.md`](./AI.md). Examples in [`example/`](./example): `net-report`, `netwatch` (live dashboard), `ping`, `wifi-scan`, `benchmark`, `netdiag.selftest`.

## Verified against the OS's own tools

`netdiag.selftest.ts` passes 19 assertions in a non-elevated shell, and the cross-validation matches the OS tools exactly: `defaultGateway()` = `ipconfig`, `neighbors()` = `arp -a`, `tcpConnections()` PIDs = `netstat -ano`, `routes()` = `route print`, `resolve()` = `nslookup`, `ping()` TTL = `ping.exe`, `adapters()` MAC = `ipconfig /all`, `wifiConnection()` = `netsh wlan show interfaces`.

## What this does NOT do

- **Cross-platform.** Windows-only by design — the Windows backend done right. For Linux/macOS/Node, `systeminformation` / `default-gateway` are the answer.
- **HTTP reachability.** netdiag is layer 3/4; use Bun's built-in `fetch()` for HTTP-level checks.
- **Raw packet capture / ARP-table writes.** Those need Administrator and are out of the no-admin scope (the raw escape hatch is there if you need them).
- **OUI/vendor lookup.** Out of the zero-dependency core.
- **Bullet-proof WiFi connect.** `wifiConnect`/`wifiDisconnect` ship as a flagged beta, unexercised against a live AP.

Roadmap: IPv6 ping/path-MTU (`Icmp6SendEcho2`), ping count/loss statistics + `deadlineMs`, per-connection ESTATS RTT (admin), CIDR/range `discover()`.

## License

MIT. Part of [bun-win32](https://github.com/ObscuritySRL/bun-win32).
