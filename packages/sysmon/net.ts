import { toArrayBuffer, type Pointer } from 'bun:ffi';
import Iphlpapi from '@bun-win32/iphlpapi';
import { monotonicMicroseconds } from './sampler';
import { preloadPending } from './preload';
import { processImagePath } from './process';
import { type InterfaceCounter, type TcpSocket, type UdpSocket, parseInterfaceTable, parseTcp6Table, parseTcpTable, parseUdp6Table, parseUdpTable } from './structs';

preloadPending(Iphlpapi, ['FreeMibTable', 'GetExtendedTcpTable', 'GetExtendedUdpTable', 'GetIfTable2']);
const { FreeMibTable, GetExtendedTcpTable, GetExtendedUdpTable, GetIfTable2 } = Iphlpapi;

const AF_INET = 2;
const AF_INET6 = 23;
const ERROR_INSUFFICIENT_BUFFER = 122;
const NO_ERROR = 0;
const TCP_TABLE_OWNER_PID_ALL = 5;
const UDP_TABLE_OWNER_PID = 1;

export interface InterfaceRate {
  alias: string;
  inBytesPerSecond: number;
  interfaceLuid: bigint;
  outBytesPerSecond: number;
}

export interface SocketOptions {
  family?: 4 | 6;
  /** Join each socket's pid to its process image basename (one OpenProcess per distinct pid, cached for the call). */
  resolveProcessNames?: boolean;
}

export type NamedTcpSocket = TcpSocket & { processName: string | null };
export type NamedUdpSocket = UdpSocket & { processName: string | null };

let tableBuffer = Buffer.alloc(256 * 1024);
const tableSize = Buffer.alloc(4);

function fetchTable(kind: 'tcp' | 'udp', family: number): Buffer {
  for (;;) {
    tableSize.writeUInt32LE(tableBuffer.byteLength, 0);
    const status = kind === 'tcp' ? GetExtendedTcpTable(tableBuffer.ptr, tableSize.ptr, 0, family, TCP_TABLE_OWNER_PID_ALL, 0) : GetExtendedUdpTable(tableBuffer.ptr, tableSize.ptr, 0, family, UDP_TABLE_OWNER_PID, 0);
    if (status === NO_ERROR) return tableBuffer;
    if (status !== ERROR_INSUFFICIENT_BUFFER) throw new Error(`GetExtended${kind === 'tcp' ? 'Tcp' : 'Udp'}Table failed: ${status}`);
    tableBuffer = Buffer.alloc(Math.max(tableSize.readUInt32LE(0) + 16_384, tableBuffer.byteLength * 2));
  }
}

function nameResolver(): (pid: number) => string | null {
  const cache = new Map<number, string | null>();
  return (pid: number): string | null => {
    const cached = cache.get(pid);
    if (cached !== undefined) return cached;
    const path = pid === 0 ? 'Idle' : pid === 4 ? 'System' : processImagePath(pid);
    const name = path === null ? null : (path.split('\\').pop() ?? path);
    cache.set(pid, name);
    return name;
  };
}

/** Per-interface counters (GetIfTable2/MIB_IF_ROW2): octets, packets, errors, link speed, MAC, OperStatus — in-process, no PowerShell perf-counter cache. */
export function interfaceCounters(): InterfaceCounter[] {
  const tablePointerBuffer = Buffer.alloc(8);
  const status = GetIfTable2(tablePointerBuffer.ptr);
  if (status !== NO_ERROR) throw new Error(`GetIfTable2 failed: ${status}`);
  const tableAddress = Number(tablePointerBuffer.readBigUInt64LE(0)) as Pointer;
  try {
    const countView = Buffer.from(toArrayBuffer(tableAddress, 0, 4).slice(0));
    const count = countView.readUInt32LE(0);
    const table = Buffer.from(toArrayBuffer(tableAddress, 0, 8 + count * 0x548).slice(0)); // slice(0) COPIES once into owned memory before FreeMibTable (Buffer.from(ArrayBuffer) alone is a view)
    return parseInterfaceTable(table);
  } finally {
    FreeMibTable(tableAddress);
  }
}

/** The full TCP socket→PID table (GetExtendedTcpTable, locale-proof binary structs — no netstat spawn/parse). */
export function tcpSockets(options?: SocketOptions): NamedTcpSocket[] {
  const family = options?.family ?? 4;
  const table = fetchTable('tcp', family === 6 ? AF_INET6 : AF_INET);
  const sockets = family === 6 ? parseTcp6Table(table) : parseTcpTable(table);
  const resolve = options?.resolveProcessNames === true ? nameResolver() : null;
  return sockets.map((socket) => ({ ...socket, processName: resolve === null ? null : resolve(socket.pid) }));
}

/** The full UDP socket→PID table (GetExtendedUdpTable). */
export function udpSockets(options?: SocketOptions): NamedUdpSocket[] {
  const family = options?.family ?? 4;
  const table = fetchTable('udp', family === 6 ? AF_INET6 : AF_INET);
  const sockets = family === 6 ? parseUdp6Table(table) : parseUdpTable(table);
  const resolve = options?.resolveProcessNames === true ? nameResolver() : null;
  return sockets.map((socket) => ({ ...socket, processName: resolve === null ? null : resolve(socket.pid) }));
}

/** Two-sample per-interface throughput: call `sample()` at an interval; returns bytes/sec deltas for interfaces that are up. */
export class NetSampler {
  #previousIn = new Map<bigint, number>();
  #previousOut = new Map<bigint, number>();
  #previousWall = -1;

  sample(): InterfaceRate[] {
    const counters = interfaceCounters();
    const nowMicroseconds = monotonicMicroseconds();
    const seconds = this.#previousWall < 0 ? 0 : (nowMicroseconds - this.#previousWall) / 1_000_000;
    const rates: InterfaceRate[] = [];
    for (const counter of counters) {
      const previousIn = this.#previousIn.get(counter.interfaceLuid);
      const previousOut = this.#previousOut.get(counter.interfaceLuid);
      this.#previousIn.set(counter.interfaceLuid, counter.inOctets);
      this.#previousOut.set(counter.interfaceLuid, counter.outOctets);
      if (seconds <= 0 || previousIn === undefined || previousOut === undefined || counter.operStatus !== 1) continue;
      rates.push({
        alias: counter.alias,
        inBytesPerSecond: (counter.inOctets - previousIn) / seconds,
        interfaceLuid: counter.interfaceLuid,
        outBytesPerSecond: (counter.outOctets - previousOut) / seconds,
      });
    }
    this.#previousWall = nowMicroseconds;
    return rates;
  }
}
