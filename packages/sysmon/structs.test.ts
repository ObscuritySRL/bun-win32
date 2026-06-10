import { describe, expect, test } from 'bun:test';
import { decodeUnicodeString, filetimeDeltaMs, filetimeToDate, formatIpv6Address, parseMemoryStatusEx, parseMultiSz, parsePerformanceInfo, parseProcessorTimes, parseTcp6Table, parseTcpTable, parseUdpTable } from './structs';

describe('decodeUnicodeString', () => {
  test('decodes UTF-16LE bytes at an offset', () => {
    const buffer = Buffer.alloc(32);
    buffer.write('bun.exe', 8, 'utf16le');
    expect(decodeUnicodeString(buffer, 8, 14)).toBe('bun.exe');
  });
});

describe('filetimeDeltaMs', () => {
  test('converts a 100 ns tick delta to milliseconds', () => {
    expect(filetimeDeltaMs(132_223_104_000_010_000n, 132_223_104_000_000_000n)).toBe(1);
    expect(filetimeDeltaMs(5_000n, 0n)).toBe(0.5);
  });
});

describe('filetimeToDate', () => {
  test('decodes a known FILETIME (2020-01-01T00:00:00Z)', () => {
    const ticks = (1_577_836_800_000n + 11_644_473_600_000n) * 10_000n;
    const low = Number(ticks & 0xffff_ffffn);
    const high = Number(ticks >> 32n);
    expect(filetimeToDate(low, high).toISOString()).toBe('2020-01-01T00:00:00.000Z');
  });

  test('decodes the unix epoch', () => {
    const ticks = 11_644_473_600_000n * 10_000n;
    expect(filetimeToDate(Number(ticks & 0xffff_ffffn), Number(ticks >> 32n)).getTime()).toBe(0);
  });
});

describe('parseMemoryStatusEx', () => {
  test('decodes the documented offsets', () => {
    const buffer = Buffer.alloc(64);
    buffer.writeUInt32LE(64, 0);
    buffer.writeUInt32LE(37, 4);
    buffer.writeBigUInt64LE(34_280_000_000n, 8);
    buffer.writeBigUInt64LE(12_000_000_000n, 16);
    buffer.writeBigUInt64LE(96_000_000_000n, 24);
    buffer.writeBigUInt64LE(48_000_000_000n, 32);
    buffer.writeBigUInt64LE(140_737_488_224_256n, 40);
    buffer.writeBigUInt64LE(140_000_000_000_000n, 48);
    const status = parseMemoryStatusEx(buffer);
    expect(status.memoryLoadPercent).toBe(37);
    expect(status.totalPhysicalBytes).toBe(34_280_000_000n);
    expect(status.availablePhysicalBytes).toBe(12_000_000_000n);
    expect(status.totalPageFileBytes).toBe(96_000_000_000n);
    expect(status.availablePageFileBytes).toBe(48_000_000_000n);
    expect(status.totalVirtualBytes).toBe(140_737_488_224_256n);
    expect(status.availableVirtualBytes).toBe(140_000_000_000_000n);
  });
});

describe('parseMultiSz', () => {
  test('splits a double-NUL-terminated wide-string array', () => {
    const buffer = Buffer.from('Processor\0Memory\0PhysicalDisk\0\0', 'utf16le');
    expect(parseMultiSz(buffer, buffer.byteLength / 2)).toEqual(['Processor', 'Memory', 'PhysicalDisk']);
  });

  test('returns empty for an immediately-empty table', () => {
    const buffer = Buffer.from('\0\0', 'utf16le');
    expect(parseMultiSz(buffer, 2)).toEqual([]);
  });

  test('stops at the double NUL even with trailing garbage', () => {
    const buffer = Buffer.from('only\0\0garbage', 'utf16le');
    expect(parseMultiSz(buffer, buffer.byteLength / 2)).toEqual(['only']);
  });
});

describe('parsePerformanceInfo', () => {
  test('decodes the documented offsets', () => {
    const buffer = Buffer.alloc(104);
    buffer.writeUInt32LE(104, 0);
    buffer.writeBigUInt64LE(2_500_000n, 8); // CommitTotal
    buffer.writeBigUInt64LE(9_000_000n, 16); // CommitLimit
    buffer.writeBigUInt64LE(3_000_000n, 24); // CommitPeak
    buffer.writeBigUInt64LE(4_169_728n, 32); // PhysicalTotal
    buffer.writeBigUInt64LE(1_000_000n, 40); // PhysicalAvailable
    buffer.writeBigUInt64LE(800_000n, 48); // SystemCache
    buffer.writeBigUInt64LE(300_000n, 56); // KernelTotal
    buffer.writeBigUInt64LE(200_000n, 64); // KernelPaged
    buffer.writeBigUInt64LE(100_000n, 72); // KernelNonpaged
    buffer.writeBigUInt64LE(4_096n, 80); // PageSize
    buffer.writeUInt32LE(250_000, 88); // HandleCount
    buffer.writeUInt32LE(441, 92); // ProcessCount
    buffer.writeUInt32LE(8_943, 96); // ThreadCount
    const counts = parsePerformanceInfo(buffer);
    expect(counts.commitTotalPages).toBe(2_500_000);
    expect(counts.commitLimitPages).toBe(9_000_000);
    expect(counts.commitPeakPages).toBe(3_000_000);
    expect(counts.physicalTotalPages).toBe(4_169_728);
    expect(counts.physicalAvailablePages).toBe(1_000_000);
    expect(counts.systemCachePages).toBe(800_000);
    expect(counts.kernelTotalPages).toBe(300_000);
    expect(counts.kernelPagedPages).toBe(200_000);
    expect(counts.kernelNonpagedPages).toBe(100_000);
    expect(counts.pageSizeBytes).toBe(4_096);
    expect(counts.handleCount).toBe(250_000);
    expect(counts.processCount).toBe(441);
    expect(counts.threadCount).toBe(8_943);
  });
});

describe('parseProcessorTimes', () => {
  test('decodes a hand-built 2-core buffer at stride 48', () => {
    const buffer = Buffer.alloc(96);
    buffer.writeBigInt64LE(1_000_000n, 0); // core 0 idle
    buffer.writeBigInt64LE(1_500_000n, 8); // core 0 kernel (includes idle)
    buffer.writeBigInt64LE(700_000n, 16); // core 0 user
    buffer.writeBigInt64LE(2_000_000n, 48); // core 1 idle
    buffer.writeBigInt64LE(2_100_000n, 56); // core 1 kernel
    buffer.writeBigInt64LE(50_000n, 64); // core 1 user
    const times = parseProcessorTimes(buffer, 2);
    expect(times).toHaveLength(2);
    expect(times[0]).toEqual({ idle: 1_000_000n, kernel: 1_500_000n, user: 700_000n });
    expect(times[1]).toEqual({ idle: 2_000_000n, kernel: 2_100_000n, user: 50_000n });
  });
});

describe('formatIpv6Address', () => {
  test('compresses the longest zero run', () => {
    const buffer = Buffer.alloc(16);
    buffer[15] = 1; // ::1
    expect(formatIpv6Address(buffer, 0)).toBe('::1');
    const linkLocal = Buffer.alloc(16);
    linkLocal.writeUInt16BE(0xfe80, 0);
    linkLocal.writeUInt16BE(0x1234, 14);
    expect(formatIpv6Address(linkLocal, 0)).toBe('fe80::1234');
  });
});

describe('parseTcpTable', () => {
  test('decodes rows, byte-swaps ports, reads PIDs', () => {
    const buffer = Buffer.alloc(4 + 2 * 24);
    buffer.writeUInt32LE(2, 0);
    buffer.writeUInt32LE(2, 4); // state LISTEN
    buffer.writeUInt32LE(0x0100_007f, 8); // 127.0.0.1 in memory order
    buffer.writeUInt32LE(0x5000_0000 >>> 16, 12); // port 80 network order = 0x0050 → low u16 bytes 00 50
    buffer.writeUInt16BE(80, 12); // dwLocalPort: network-order low word
    buffer.writeUInt32LE(0, 16); // remote 0.0.0.0
    buffer.writeUInt32LE(0, 20);
    buffer.writeUInt32LE(4321, 24);
    buffer.writeUInt32LE(5, 4 + 24); // state ESTABLISHED
    buffer.writeUInt32LE(0x0a0a_0a0a, 4 + 24 + 4); // 10.10.10.10
    buffer.writeUInt16BE(54321, 4 + 24 + 8);
    buffer.writeUInt32LE(0x08080808, 4 + 24 + 12); // 8.8.8.8
    buffer.writeUInt16BE(443, 4 + 24 + 16);
    buffer.writeUInt32LE(9876, 4 + 24 + 20);
    const rows = parseTcpTable(buffer);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ family: 4, localAddress: '127.0.0.1', localPort: 80, state: 2, stateName: 'LISTEN' });
    expect(rows[1]).toMatchObject({ family: 4, localAddress: '10.10.10.10', localPort: 54321, remoteAddress: '8.8.8.8', remotePort: 443, state: 5, stateName: 'ESTABLISHED', pid: 9876 });
  });

  test('empty table', () => {
    const buffer = Buffer.alloc(4);
    expect(parseTcpTable(buffer)).toEqual([]);
  });
});

describe('parseTcp6Table', () => {
  test('decodes 56-byte rows with 16-byte addresses', () => {
    const buffer = Buffer.alloc(4 + 56);
    buffer.writeUInt32LE(1, 0);
    buffer[4 + 15] = 1; // local ::1
    buffer.writeUInt16BE(8080, 4 + 20); // local port network order
    buffer.writeUInt16BE(0x2001, 4 + 24); // remote 2001::42
    buffer[4 + 24 + 15] = 0x42;
    buffer.writeUInt16BE(443, 4 + 44);
    buffer.writeUInt32LE(5, 4 + 48); // ESTABLISHED
    buffer.writeUInt32LE(1234, 4 + 52);
    const rows = parseTcp6Table(buffer);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ family: 6, localAddress: '::1', localPort: 8080, remoteAddress: '2001::42', remotePort: 443, state: 5, pid: 1234 });
  });
});

describe('parseUdpTable', () => {
  test('decodes 12-byte rows', () => {
    const buffer = Buffer.alloc(4 + 12);
    buffer.writeUInt32LE(1, 0);
    buffer.writeUInt32LE(0, 4); // 0.0.0.0
    buffer.writeUInt16BE(53, 4 + 4);
    buffer.writeUInt32LE(999, 4 + 8);
    const rows = parseUdpTable(buffer);
    expect(rows[0]).toMatchObject({ family: 4, localAddress: '0.0.0.0', localPort: 53, pid: 999 });
  });
});
