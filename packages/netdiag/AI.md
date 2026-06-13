# @bun-win32/netdiag — AI contract

Syscall-grade Windows network diagnostics for Bun, decoded from binary Win32 structs via `bun:ffi`. **No child process, no node-gyp, no Administrator** (ICMP echo + table reads are unprivileged), locale-immune by construction. Windows-only, Bun-only.

This file is the complete surface contract: an agent never needs to read the source. Every function below is a named export of `@bun-win32/netdiag` (and the unscoped `bun-netdiag`).

```ts
import { adapters, defaultGateway, ping, tcpConnections, throughput } from '@bun-win32/netdiag';
```

---

## Capability map

| function | returns | underlying Win32 API | admin? |
|---|---|---|---|
| `adapters(family?)` | `Adapter[]` (ipv4/ipv6, gateways, dns, mac, speed, mtu) | `GetAdaptersAddresses` | no |
| `routes(family?)` | `Route[]` (destinationPrefix, nextHop, metric, protocol) | `GetIpForwardTable2` + `FreeMibTable` | no |
| `defaultGateway(family?)` | `string \| undefined` (next hop of the lowest-metric default route) | `GetIpForwardTable2` | no |
| `neighbors(family?)` / `arpTable()` | `Neighbor[]` (address, mac, state, isRouter) | `GetIpNetTable2` + `FreeMibTable` | no |
| `tcpConnections(opts?)` | `TcpConnection[]` (socket→PID + optional process name) | `GetExtendedTcpTable` (+ `GetOwnerModuleFromTcpEntry`) | no |
| `udpListeners(opts?)` | `UdpEndpoint[]` | `GetExtendedUdpTable` | no |
| `ping(host, opts?)` | `Promise<PingReply>` (alive, roundTripMs, ttl, status) | `IcmpCreateFile` + `IcmpSendEcho` | **no** |
| `pingMany(hosts, opts?)` | `Promise<PingReply[]>` | `IcmpSendEcho` | no |
| `pingSweep(prefix, opts?)` | `Promise<SweepReply[]>` (async /24 sweep) | `IcmpSendEcho2` + Win32 Event | no |
| `traceroute(host, opts?)` | `Promise<TraceHop[]>` (TTL ramp) | `IcmpSendEcho` + `IP_OPTION_INFORMATION32` | **no** |
| `resolve(name, type?)` | `DnsRecord[]` (typed, discriminated on `type`) | `DnsQuery_W` + `DnsRecordListFree` | no |
| `reverse(ip)` | `string[]` (PTR names) | `DnsQuery_W` | no |
| `lookup(name)` | `{ ipv4: string[]; ipv6: string[] }` (system resolver) | `getaddrinfo` | no |
| `tcpStatistics(family?)` / `ipStatistics()` / `udpStatistics()` | typed counter structs | `GetTcp/Ip/UdpStatisticsEx` | no |
| `interfaceCounters()` | `InterfaceCounters[]` (octets, errors, discards) | `GetIfTable2` + `FreeMibTable` | no |
| `throughput(intervalMs?)` | `Promise<ThroughputSample[]>` (rx/tx bytes/sec) | two `GetIfTable2` samples | no |
| `bestRoute(host)` | `BestRoute` (source IP, next hop, interface the kernel would use) | `GetBestRoute2` | no |
| `pathMtu(host, opts?)` | `PathMtuResult` (DF-probe binary search) | `IcmpSendEcho` + `IP_FLAG_DF` | no |
| `wifiInterfaces()` | `WifiInterface[]` | `WlanEnumInterfaces` | no |
| `wifiScan(opts?)` | `Promise<WifiNetwork[]>` (`triggerScan` for a fresh ~4 s scan) | `WlanGetAvailableNetworkList` (+ `WlanScan`) | no¹ |
| `wifiConnection(guid?)` | `WifiConnection \| null` (signal, rate, bssid, auth) | `WlanQueryInterface` | no¹ |
| `wifiBssList(guid?)` | `WifiBss[]` (signed-dBm RSSI, channel) | `WlanGetNetworkBssList` | no¹ |
| `wifiConnect(profile, guid, {beta})` **beta** / `wifiDisconnect(guid, {beta})` **beta** | `WifiConnectResult` | `WlanConnect` / `WlanDisconnect` | no |

¹ Windows 11 may require a one-time **Location** permission for WiFi SSID visibility (an OS gate — see gotchas).

### Codecs (pure, no FFI) — `addr`
`ipv4FromU32(value)`, `ipv6FromBytes(buffer, offset)` (RFC 5952), `portFromNetworkOrder(value)`, `macFromBytes(buffer, offset, length)`, `decodeSockaddr(buffer, offset)` → `SocketAddress`.

### Constants / helpers
`tcpStateName(state)`, `icmpStatusName(status)`, `addressFamilyValue(family)`, `DnsType`, `AF_INET`, `AF_INET6`, `TCP_TABLE_OWNER_PID_ALL`, `ICMP_SUCCESS`, …

### Engine primitives — `win32`
`SizedBufferState` (the reusable sizing-call buffer), `mibTable(invoke, firstRow, rowSize, decode)` (self-allocating Table2 decode + `FreeMibTable`), `walkList(base, head, nextOffset)` (in-buffer linked-list walk), `readWideAt` / `readAnsiAt`, `Win32Error` / `win32ErrorMessage`. Low-level ICMP: `sendEcho(destination, ttl, timeoutMs, payloadSize, flags?)`, `resolveIPv4(host)`.

---

## Layer 3 — the raw escape hatch

Any IP Helper / wlanapi / dnsapi / winsock call netdiag didn't wrap is one import away — the binding packages are re-exported, and `SizedBufferState` / `mibTable` give you the sizing-call and self-alloc patterns:

```ts
import { Iphlpapi, SizedBufferState } from '@bun-win32/netdiag';

const state = new SizedBufferState();
const view = state.fill((dataPointer, sizePointer) => Iphlpapi.GetNetworkParams(dataPointer, sizePointer));
const hostname = state.buffer.toString('ascii', 0, state.buffer.indexOf(0));
```

`Iphlpapi`, `Wlanapi`, `Dnsapi`, `Ws2_32`, `Kernel32` are all re-exported.

---

## Examples

```ts
import { adapters, defaultGateway, ping, resolve, tcpConnections, throughput, traceroute } from '@bun-win32/netdiag';

defaultGateway('ipv4');                                  // '192.168.0.1' — no wmic, no spawn
(await ping('1.1.1.1')).roundTripMs;                     // 11 — ICMP_ECHO_REPLY.RoundTripTime, no admin
tcpConnections({ resolveNames: 'module' })               // [{ remoteAddress, remotePort, pid, processName: 'opera.exe' }, ...]
  .filter((c) => c.state === 'established');
await traceroute('8.8.8.8');                             // [{ ttl: 1, address: '192.168.0.1', status }, ...]
resolve('google.com', 'MX');                             // [{ type: 'MX', preference: 10, exchange: 'smtp.google.com' }]
(await throughput(1000))[0];                             // { name: 'Wi-Fi', rxBytesPerSec, txBytesPerSec }
adapters().find((a) => a.gateways.length > 0)?.mac;      // '84:14:4d:b0:7d:e0'
```

---

## Gotchas

- **No admin, scoped honestly.** ICMP (`ping`/`traceroute`/`pingSweep`/`pathMtu`), every table read (routes/neighbors/sockets/adapters/stats), DNS, and WiFi scan/query are all unprivileged. Raw `SIO_RCVALL` packet capture and ARP/ND table *writes* would need Administrator — those are deliberately **not** in netdiag.
- **`ping().status` on timeout.** Bun's FFI does not reliably preserve `GetLastError` across the boundary, so a 0-reply timeout is reported as `IP_REQ_TIMED_OUT` (11010) rather than guessing another `IP_STATUS`. `alive` is exactly `replied && status === IP_SUCCESS` — never an exit-code or TTL-string heuristic.
- **Ports are network byte order.** All decoders byteswap via `portFromNetworkOrder`; 443 reads as 443, not 47873.
- **Wide strings.** Decoded with `buffer.toString('utf16le')` up to NUL (Bun's `TextDecoder` rejects `'utf-16le'`). WiFi SSIDs are read from raw `DOT11_SSID` bytes as UTF-8 — Unicode/emoji-proof.
- **WiFi connect is a beta.** `wifiConnect`/`wifiDisconnect` are signature-correct but UNEXERCISED against a live AP; they require `{ beta: true }`. Verify by polling `wifiConnection()`, never by callback.
- **WiFi scan latency.** `wifiScan()` returns the instant OS-cached list; `wifiScan({ triggerScan: true })` runs a fresh `WlanScan` and waits ~4 s (which may flush the prior list).
- **Win11 WiFi location consent.** `WlanGetAvailableNetworkList`/`WlanGetNetworkBssList` can return `ERROR_ACCESS_DENIED` until precise-location permission is granted (Settings → Privacy → Location). netdiag surfaces this as a distinct error, not an empty list — it is an OS gate, not a netdiag bug.
- **Never silent.** Table APIs that fail throw `Win32Error` (code + message), never a silent empty array.
- **`resolve()` vs `lookup()`.** `resolve()` (DnsQuery_W) queries DNS directly and honors the hosts file + OS resolver cache; `lookup()` (getaddrinfo) is the system resolver and may filter AAAA on IPv6-less hosts. They can return different answers — by design.
- **IPv6 path-MTU / ping** are IPv4 today (roadmap: `Icmp6SendEcho2`).
- **`throughput` rate uses the measured elapsed time**, so async-sleep quantization can't skew it.
