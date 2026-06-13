import { ICMP_SUCCESS, icmpStatusName } from './constants';
import { resolveIPv4, sendEcho } from './ping';

export interface TraceHop {
  ttl: number;
  address: string;
  roundTripMs: number;
  status: number;
  statusText: string;
}

export interface TracerouteOptions {
  maxHops?: number;
  timeoutMs?: number;
  payloadSize?: number;
}

/**
 * No-admin, no-raw-socket traceroute: an IcmpSendEcho TTL ramp. A router that
 * decrements TTL to 0 replies IP_TTL_EXPIRED_TRANSIT with its own address (the
 * hop); the walk stops when the destination echoes back (IP_SUCCESS).
 */
export async function traceroute(host: string, options: TracerouteOptions = {}): Promise<TraceHop[]> {
  const destination = resolveIPv4(host);
  const maxHops = options.maxHops ?? 30;
  const timeoutMs = options.timeoutMs ?? 2000;
  const payloadSize = options.payloadSize ?? 32;
  const hops: TraceHop[] = [];
  for (let ttl = 1; ttl <= maxHops; ttl++) {
    const echo = sendEcho(destination, ttl, timeoutMs, payloadSize);
    hops.push({ ttl, address: echo.replied ? echo.address : '*', roundTripMs: echo.roundTripMs, status: echo.status, statusText: icmpStatusName(echo.status) });
    if (echo.replied && echo.status === ICMP_SUCCESS) break;
  }
  return hops;
}
