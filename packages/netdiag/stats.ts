import { addressFamilyValue } from './constants';
import { Iphlpapi, mibTable, readWideAt, Win32Error } from './win32';

type StatsFamily = 'ipv4' | 'ipv6';

// MIB_TCPSTATS / MIB_IPSTATS / MIB_UDPSTATS are flat DWORD arrays (Ex variants take a family).
const TCP_STATS_SIZE = 60;
const IP_STATS_SIZE = 92;
const UDP_STATS_SIZE = 20;

// MIB_IF_TABLE2 { ULONG NumEntries; MIB_IF_ROW2 Table[] } — rows 8-aligned; GetIfTable2 self-allocates → mibTable.
const IF_TABLE_FIRST_ROW = 8;
const IF_ROW_SIZE = 1352; // sizeof(MIB_IF_ROW2) x64 — verified vs alias decode + climbing octets (S9.2)
const IF_ROW_INTERFACE_INDEX = 8;
const IF_ROW_ALIAS = 28; // WCHAR Alias[257]
const IF_ROW_MTU = 1124;
const IF_ROW_OPER_STATUS = 1156;
const IF_ROW_IN_OCTETS = 1208; // ULONG64
const IF_ROW_IN_DISCARDS = 1232;
const IF_ROW_IN_ERRORS = 1240;
const IF_ROW_OUT_OCTETS = 1280;
const IF_ROW_OUT_DISCARDS = 1304;
const IF_ROW_OUT_ERRORS = 1312;

const OPER_STATUS_NAMES: ReadonlyMap<number, string> = new Map([
  [1, 'up'],
  [2, 'down'],
  [3, 'testing'],
  [4, 'unknown'],
  [5, 'dormant'],
  [6, 'not-present'],
  [7, 'lower-layer-down'],
]);

export interface TcpStatistics {
  activeOpens: number;
  passiveOpens: number;
  attemptFails: number;
  establishedResets: number;
  currentEstablished: number;
  inSegments: number;
  outSegments: number;
  retransmittedSegments: number;
  inErrors: number;
  outResets: number;
}

export interface IpStatistics {
  inReceives: number;
  inHeaderErrors: number;
  inAddressErrors: number;
  forwardedDatagrams: number;
  inDiscards: number;
  inDelivers: number;
  outRequests: number;
  outDiscards: number;
  outNoRoutes: number;
  reassemblyRequired: number;
  reassemblyOk: number;
  fragmentsOk: number;
  fragmentsFailed: number;
}

export interface UdpStatistics {
  inDatagrams: number;
  noPorts: number;
  inErrors: number;
  outDatagrams: number;
}

export interface InterfaceCounters {
  interfaceIndex: number;
  name: string;
  mtu: number;
  operStatus: string;
  inOctets: number;
  outOctets: number;
  inErrors: number;
  outErrors: number;
  inDiscards: number;
  outDiscards: number;
}

export interface ThroughputSample {
  interfaceIndex: number;
  name: string;
  rxBytesPerSec: number;
  txBytesPerSec: number;
  rxErrors: number;
  txErrors: number;
}

const tcpStatsBuffer = Buffer.allocUnsafeSlow(TCP_STATS_SIZE);
const ipStatsBuffer = Buffer.allocUnsafeSlow(IP_STATS_SIZE);
const udpStatsBuffer = Buffer.allocUnsafeSlow(UDP_STATS_SIZE);

/** TCP protocol counters (typed netstat -s) — 32-bit DWORDs that wrap on busy hosts; treat deltas modulo 2^32. */
export function tcpStatistics(family: StatsFamily = 'ipv4'): TcpStatistics {
  const error = Iphlpapi.GetTcpStatisticsEx(tcpStatsBuffer.ptr, addressFamilyValue(family));
  if (error !== 0) throw new Win32Error(error);
  const buffer = tcpStatsBuffer;
  return {
    activeOpens: buffer.readUInt32LE(16),
    passiveOpens: buffer.readUInt32LE(20),
    attemptFails: buffer.readUInt32LE(24),
    establishedResets: buffer.readUInt32LE(28),
    currentEstablished: buffer.readUInt32LE(32),
    inSegments: buffer.readUInt32LE(36),
    outSegments: buffer.readUInt32LE(40),
    retransmittedSegments: buffer.readUInt32LE(44),
    inErrors: buffer.readUInt32LE(48),
    outResets: buffer.readUInt32LE(52),
  };
}

/** IP protocol counters. */
export function ipStatistics(family: StatsFamily = 'ipv4'): IpStatistics {
  const error = Iphlpapi.GetIpStatisticsEx(ipStatsBuffer.ptr, addressFamilyValue(family));
  if (error !== 0) throw new Win32Error(error);
  const buffer = ipStatsBuffer;
  return {
    inReceives: buffer.readUInt32LE(8),
    inHeaderErrors: buffer.readUInt32LE(12),
    inAddressErrors: buffer.readUInt32LE(16),
    forwardedDatagrams: buffer.readUInt32LE(20),
    inDiscards: buffer.readUInt32LE(28),
    inDelivers: buffer.readUInt32LE(32),
    outRequests: buffer.readUInt32LE(36),
    outDiscards: buffer.readUInt32LE(44),
    outNoRoutes: buffer.readUInt32LE(48),
    reassemblyRequired: buffer.readUInt32LE(56),
    reassemblyOk: buffer.readUInt32LE(60),
    fragmentsOk: buffer.readUInt32LE(68),
    fragmentsFailed: buffer.readUInt32LE(72),
  };
}

/** UDP protocol counters. */
export function udpStatistics(family: StatsFamily = 'ipv4'): UdpStatistics {
  const error = Iphlpapi.GetUdpStatisticsEx(udpStatsBuffer.ptr, addressFamilyValue(family));
  if (error !== 0) throw new Win32Error(error);
  const buffer = udpStatsBuffer;
  return { inDatagrams: buffer.readUInt32LE(0), noPorts: buffer.readUInt32LE(4), inErrors: buffer.readUInt32LE(8), outDatagrams: buffer.readUInt32LE(12) };
}

/** Per-interface counters from GetIfTable2 — octets are ULONG64; error/discard counters systeminformation drops. */
export function interfaceCounters(): InterfaceCounters[] {
  return mibTable(
    (tablePointer) => Iphlpapi.GetIfTable2(tablePointer),
    IF_TABLE_FIRST_ROW,
    IF_ROW_SIZE,
    (table, row) => ({
      interfaceIndex: table.readUInt32LE(row + IF_ROW_INTERFACE_INDEX),
      name: readWideAt(table, row + IF_ROW_ALIAS),
      mtu: table.readUInt32LE(row + IF_ROW_MTU),
      operStatus: OPER_STATUS_NAMES.get(table.readUInt32LE(row + IF_ROW_OPER_STATUS)) ?? 'unknown',
      inOctets: Number(table.readBigUInt64LE(row + IF_ROW_IN_OCTETS)),
      outOctets: Number(table.readBigUInt64LE(row + IF_ROW_OUT_OCTETS)),
      inErrors: Number(table.readBigUInt64LE(row + IF_ROW_IN_ERRORS)),
      outErrors: Number(table.readBigUInt64LE(row + IF_ROW_OUT_ERRORS)),
      inDiscards: Number(table.readBigUInt64LE(row + IF_ROW_IN_DISCARDS)),
      outDiscards: Number(table.readBigUInt64LE(row + IF_ROW_OUT_DISCARDS)),
    }),
  );
}

interface OctetSample {
  interfaceIndex: number;
  name: string;
  inOctets: bigint;
  outOctets: bigint;
  inErrors: bigint;
  outErrors: bigint;
}

function sampleOctets(): Map<number, OctetSample> {
  const rows = mibTable(
    (tablePointer) => Iphlpapi.GetIfTable2(tablePointer),
    IF_TABLE_FIRST_ROW,
    IF_ROW_SIZE,
    (table, row) => ({
      interfaceIndex: table.readUInt32LE(row + IF_ROW_INTERFACE_INDEX),
      name: readWideAt(table, row + IF_ROW_ALIAS),
      inOctets: table.readBigUInt64LE(row + IF_ROW_IN_OCTETS),
      outOctets: table.readBigUInt64LE(row + IF_ROW_OUT_OCTETS),
      inErrors: table.readBigUInt64LE(row + IF_ROW_IN_ERRORS),
      outErrors: table.readBigUInt64LE(row + IF_ROW_OUT_ERRORS),
    }),
  );
  const map = new Map<number, OctetSample>();
  for (const sample of rows) map.set(sample.interfaceIndex, sample);
  return map;
}

/**
 * Live per-interface throughput: two GetIfTable2 samples, octet deltas in bigint,
 * narrowed to bytes/sec by the MEASURED elapsed time (so pacing quantization can't
 * skew the rate). The dashboard primitive — sub-ms syscall, zero shell.
 */
export async function throughput(intervalMs = 1000): Promise<ThroughputSample[]> {
  const first = sampleOctets();
  const startNanos = Bun.nanoseconds();
  await Bun.sleep(intervalMs);
  const second = sampleOctets();
  const elapsedSeconds = (Bun.nanoseconds() - startNanos) / 1_000_000_000;
  const result: ThroughputSample[] = [];
  for (const [interfaceIndex, later] of second) {
    const earlier = first.get(interfaceIndex);
    if (earlier === undefined) continue;
    result.push({
      interfaceIndex,
      name: later.name,
      rxBytesPerSec: Number(later.inOctets - earlier.inOctets) / elapsedSeconds,
      txBytesPerSec: Number(later.outOctets - earlier.outOctets) / elapsedSeconds,
      rxErrors: Number(later.inErrors - earlier.inErrors),
      txErrors: Number(later.outErrors - earlier.outErrors),
    });
  }
  return result;
}
