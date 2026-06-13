import { type Pointer, toArrayBuffer } from 'bun:ffi';

import { ipv4FromU32 } from './addr';
import { ICMP_REQUEST_TIMED_OUT, ICMP_SUCCESS, icmpStatusName } from './constants';
import { Iphlpapi, Kernel32, Ws2_32 } from './win32';

const AF_INET = 0x0000_0002;
const ADDRINFO_SIZE = 48; // ADDRINFOA (x64)
const ADDRINFO_FAMILY = 4;
const ADDRINFO_ADDR = 32; // ai_addr (sockaddr*)
const ADDRINFO_NEXT = 40;

export interface PingReply {
  alive: boolean;
  address: string;
  roundTripMs: number;
  ttl: number;
  status: number;
  statusText: string;
  bytes: number;
}

export interface PingOptions {
  timeoutMs?: number;
  payloadSize?: number;
  ttl?: number;
}

export interface EchoResult {
  replied: boolean;
  address: string;
  roundTripMs: number;
  ttl: number;
  status: number;
  bytes: number;
}

let winsockReady = false;
function ensureWinsock(): void {
  if (winsockReady) return;
  Ws2_32.WSAStartup(0x0202, Buffer.allocUnsafeSlow(0x0198).ptr); // WSADATA 408 bytes
  winsockReady = true;
}

/** Resolve a host (name or IPv4 literal) to a network-order IPv4 u32 via the system resolver (ANSI getaddrinfo). Throws on failure. */
export function resolveIPv4(host: string): number {
  ensureWinsock();
  const resultPointer = Buffer.allocUnsafeSlow(8);
  const nameBuffer = Buffer.allocUnsafeSlow(host.length + 1); // own buffer; getaddrinfo is the ANSI (LPCSTR) variant
  nameBuffer.write(host, 'latin1');
  nameBuffer[host.length] = 0;
  const error = Ws2_32.getaddrinfo(nameBuffer.ptr, null, null, resultPointer.ptr);
  if (error !== 0) throw new Error(`cannot resolve "${host}": getaddrinfo failed (${error})`);
  const head = Number(resultPointer.readBigUInt64LE(0));
  try {
    let nodePointer = head;
    while (nodePointer !== 0) {
      const node = Buffer.from(toArrayBuffer(Number(nodePointer) as Pointer, 0, ADDRINFO_SIZE));
      const addressPointer = Number(node.readBigUInt64LE(ADDRINFO_ADDR));
      if (node.readInt32LE(ADDRINFO_FAMILY) === AF_INET && addressPointer !== 0) {
        return Buffer.from(toArrayBuffer(Number(addressPointer) as Pointer, 0, 16)).readUInt32LE(4); // sockaddr_in.sin_addr
      }
      nodePointer = Number(node.readBigUInt64LE(ADDRINFO_NEXT));
    }
  } finally {
    Ws2_32.freeaddrinfo(Number(head) as Pointer);
  }
  throw new Error(`no IPv4 address found for "${host}"`);
}

let icmpHandle = 0n;
function handle(): bigint {
  if (icmpHandle === 0n) icmpHandle = Iphlpapi.IcmpCreateFile();
  return icmpHandle;
}

const requestData = Buffer.allocUnsafeSlow(0x0001_0000); // up to 64K payload (own, stable)
requestData.fill(0x61);
const replyBuffer = Buffer.allocUnsafeSlow(0x0002_0000); // 128K (own, stable)
const replyView = new DataView(replyBuffer.buffer, replyBuffer.byteOffset, replyBuffer.byteLength);
const optionsBuffer = Buffer.allocUnsafeSlow(8); // IP_OPTION_INFORMATION32 (x64): Ttl,Tos,Flags,OptionsSize, OptionsData u32

/**
 * One synchronous ICMP echo. ttl > 0 builds an IP_OPTION_INFORMATION32 (the
 * REQUIRED x64 layout — the 64-bit struct returns ERROR_INVALID_PARAMETER) for
 * traceroute/PMTU; ttl <= 0 sends with the OS default TTL and no options. The
 * options struct is assembled immediately before the call with no await between.
 */
export function sendEcho(destination: number, ttl: number, timeoutMs: number, payloadSize: number): EchoResult {
  let optionsPointer: Pointer | null = null;
  if (ttl > 0) {
    optionsBuffer.writeUInt8(ttl, 0);
    optionsBuffer.writeUInt8(0, 1); // Tos
    optionsBuffer.writeUInt8(0, 2); // Flags
    optionsBuffer.writeUInt8(0, 3); // OptionsSize
    optionsBuffer.writeUInt32LE(0, 4); // OptionsData = NULL
    optionsPointer = optionsBuffer.ptr;
  }
  const size = payloadSize < 0 ? 0 : payloadSize > requestData.byteLength ? requestData.byteLength : payloadSize;
  const replies = Iphlpapi.IcmpSendEcho(handle(), destination, requestData.ptr, size, optionsPointer, replyBuffer.ptr, replyBuffer.byteLength, timeoutMs);
  if (replies === 0) {
    // 0 replies = no echo arrived. GetLastError carries the IP_STATUS, but Bun's FFI does not
    // reliably preserve it across the boundary → default to "timed out" (the dominant cause).
    const lastError = Kernel32.GetLastError();
    return { replied: false, address: '', roundTripMs: 0, ttl: 0, status: lastError === 0 ? ICMP_REQUEST_TIMED_OUT : lastError, bytes: 0 };
  }
  // ICMP_ECHO_REPLY (x64): Address@0 Status@4 RoundTripTime@8 DataSize@12 Reserved@14 Data@16 Options{Ttl@24}
  return {
    replied: true,
    address: ipv4FromU32(replyView.getUint32(0, true)),
    status: replyView.getUint32(4, true),
    roundTripMs: replyView.getUint32(8, true),
    bytes: replyView.getUint16(12, true),
    ttl: replyBuffer.readUInt8(24),
  };
}

/** No-admin ICMP ping over IcmpSendEcho — no ping.exe spawn, no locale parse, no CMD flash. */
export async function ping(host: string, options: PingOptions = {}): Promise<PingReply> {
  const destination = resolveIPv4(host);
  const echo = sendEcho(destination, options.ttl ?? 0, options.timeoutMs ?? 1000, options.payloadSize ?? 32);
  return {
    alive: echo.replied && echo.status === ICMP_SUCCESS,
    address: echo.replied ? echo.address : ipv4FromU32(destination),
    roundTripMs: echo.roundTripMs,
    ttl: echo.ttl,
    status: echo.status,
    statusText: icmpStatusName(echo.status),
    bytes: echo.bytes,
  };
}

/** Ping several hosts — no N-process fork (the async /24 sweep, 10b, adds true concurrency over IcmpSendEcho2). */
export function pingMany(hosts: string[], options: PingOptions = {}): Promise<PingReply[]> {
  return Promise.all(hosts.map((host) => ping(host, options)));
}
