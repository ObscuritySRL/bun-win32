export interface SocketAddress {
  family: 'ipv4' | 'ipv6' | 'unknown';
  address: string;
  port: number;
  scopeId?: number;
}

const AF_INET = 0x0000_0002;
const AF_INET6 = 0x0000_0017;

/** IPv4 dotted-quad from a u32 holding the four address bytes in memory (network) order. */
export function ipv4FromU32(value: number): string {
  return `${value & 0xff}.${(value >>> 8) & 0xff}.${(value >>> 16) & 0xff}.${(value >>> 24) & 0xff}`;
}

/** Host-order port from a network-order (big-endian) 16-bit value. */
export function portFromNetworkOrder(value: number): number {
  return ((value & 0xff) << 8) | ((value >>> 8) & 0xff);
}

/** Colon-separated lowercase-hex MAC from `length` bytes at `offset`. */
export function macFromBytes(buffer: Buffer, offset: number, length: number): string {
  let mac = '';
  for (let index = 0; index < length; index++) {
    if (index > 0) mac += ':';
    mac += buffer[offset + index].toString(16).padStart(2, '0');
  }
  return mac;
}

/** Canonical RFC 5952 IPv6 text (lowercase, longest-run `::` compression) from 16 bytes at `offset`. */
export function ipv6FromBytes(buffer: Buffer, offset: number): string {
  const groups: number[] = [];
  for (let index = 0; index < 8; index++) groups.push((buffer[offset + index * 2] << 8) | buffer[offset + index * 2 + 1]);

  let bestStart = -1;
  let bestLength = 0;
  let runStart = -1;
  let runLength = 0;
  for (let index = 0; index < 8; index++) {
    if (groups[index] === 0) {
      if (runStart === -1) runStart = index;
      runLength++;
    } else {
      runStart = -1;
      runLength = 0;
    }
    if (runLength > bestLength) {
      bestLength = runLength;
      bestStart = runStart;
    }
  }
  if (bestLength < 2) bestStart = -1; // RFC 5952: do not compress a single zero group

  const segments: string[] = [];
  for (let index = 0; index < 8; index++) {
    if (index === bestStart) {
      segments.push(''); // open the compressed run
      index += bestLength - 1;
      if (index === 7) segments.push(''); // run reaches the end → trailing colon
      continue;
    }
    segments.push(groups[index].toString(16));
  }
  if (bestStart === 0) segments.unshift(''); // run starts at the beginning → leading colon
  return segments.join(':');
}

/**
 * Decode a SOCKADDR_INET union at `offset`: si_family (USHORT) at +0 selects
 * sockaddr_in (port@+2 BE, addr@+4) or sockaddr_in6 (port@+2 BE, addr@+8,
 * scope_id@+24). Ports are network byte order; addresses are formatted.
 */
export function decodeSockaddr(buffer: Buffer, offset: number): SocketAddress {
  const family = buffer.readUInt16LE(offset);
  if (family === AF_INET) {
    return { family: 'ipv4', address: ipv4FromU32(buffer.readUInt32LE(offset + 4)), port: buffer.readUInt16BE(offset + 2) };
  }
  if (family === AF_INET6) {
    return { family: 'ipv6', address: ipv6FromBytes(buffer, offset + 8), port: buffer.readUInt16BE(offset + 2), scopeId: buffer.readUInt32LE(offset + 24) };
  }
  return { family: 'unknown', address: '', port: 0 };
}
