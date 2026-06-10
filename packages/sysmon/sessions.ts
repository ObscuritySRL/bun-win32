import { type Pointer, toArrayBuffer } from 'bun:ffi';
import Wtsapi32, { WTS_INFO_CLASS } from '@bun-win32/wtsapi32';
import { decodeNulTerminatedUnicodeString } from './structs';
import { preloadPending } from './preload';

preloadPending(Wtsapi32, ['WTSEnumerateSessionsW', 'WTSFreeMemory', 'WTSQuerySessionInformationW']);
const { WTSEnumerateSessionsW, WTSFreeMemory, WTSQuerySessionInformationW } = Wtsapi32;

const SESSION_STATE_NAMES = ['active', 'connected', 'connect_query', 'shadow', 'disconnected', 'idle', 'listen', 'reset', 'down', 'init'] as const;
const WTS_CURRENT_SERVER_HANDLE = 0n;

export interface SessionInfo {
  clientName: string;
  domain: string;
  /** 0 console, 2 RDP. */
  protocol: number;
  sessionId: number;
  /** WTS_CONNECTSTATE_CLASS (0 = active). */
  state: number;
  stateName: (typeof SESSION_STATE_NAMES)[number] | 'unknown';
  /** WinStation name, e.g. `Console` or `RDP-Tcp#0`. */
  stationName: string;
  userName: string;
}

function querySessionString(sessionId: number, informationClass: number): string {
  const bufferPointerBuffer = Buffer.alloc(8);
  const bytesBuffer = Buffer.alloc(4);
  if (WTSQuerySessionInformationW(WTS_CURRENT_SERVER_HANDLE, sessionId, informationClass, bufferPointerBuffer.ptr, bytesBuffer.ptr) === 0) return '';
  const address = Number(bufferPointerBuffer.readBigUInt64LE(0)) as Pointer;
  const bytes = bytesBuffer.readUInt32LE(0);
  if (address === 0 || bytes < 2) {
    if (address !== 0) WTSFreeMemory(address);
    return '';
  }
  const copy = Buffer.from(toArrayBuffer(address, 0, bytes).slice(0)); // slice(0) COPIES before WTSFreeMemory
  WTSFreeMemory(address);
  return decodeNulTerminatedUnicodeString(copy, 0, bytes >> 1);
}

function querySessionProtocol(sessionId: number): number {
  const bufferPointerBuffer = Buffer.alloc(8);
  const bytesBuffer = Buffer.alloc(4);
  if (WTSQuerySessionInformationW(WTS_CURRENT_SERVER_HANDLE, sessionId, WTS_INFO_CLASS.WTSClientProtocolType, bufferPointerBuffer.ptr, bytesBuffer.ptr) === 0) return 0;
  const address = Number(bufferPointerBuffer.readBigUInt64LE(0)) as Pointer;
  if (address === 0) return 0;
  const copy = Buffer.from(toArrayBuffer(address, 0, 2).slice(0));
  WTSFreeMemory(address);
  return copy.readUInt16LE(0);
}

/**
 * Every terminal-services session with real user/domain/client attribution
 * (WTSEnumerateSessionsW + per-session WTSQuerySessionInformationW) — the data
 * systeminformation's users() leaves empty on Windows. WTS_SESSION_INFOW is 24 B with
 * State at offset 16 (not 20 — the documented x64 padding trap).
 */
export function sessions(): SessionInfo[] {
  const sessionsPointerBuffer = Buffer.alloc(8);
  const countBuffer = Buffer.alloc(4);
  if (WTSEnumerateSessionsW(WTS_CURRENT_SERVER_HANDLE, 0, 1, sessionsPointerBuffer.ptr, countBuffer.ptr) === 0) throw new Error('WTSEnumerateSessionsW failed');
  const address = Number(sessionsPointerBuffer.readBigUInt64LE(0)) as Pointer;
  const count = countBuffer.readUInt32LE(0);
  if (address === 0 || count === 0) {
    if (address !== 0) WTSFreeMemory(address);
    return [];
  }
  const table = Buffer.from(toArrayBuffer(address, 0, count * 24).slice(0)); // slice(0) COPIES once — a bare Buffer.from(ArrayBuffer) view would dangle after WTSFreeMemory
  WTSFreeMemory(address);
  const sessionInfos: SessionInfo[] = new Array(count);
  for (let i = 0; i < count; i += 1) {
    const sessionId = table.readUInt32LE(i * 24);
    const state = table.readUInt32LE(i * 24 + 16);
    sessionInfos[i] = {
      clientName: querySessionString(sessionId, WTS_INFO_CLASS.WTSClientName),
      domain: querySessionString(sessionId, WTS_INFO_CLASS.WTSDomainName),
      protocol: querySessionProtocol(sessionId),
      sessionId,
      state,
      stateName: SESSION_STATE_NAMES[state] ?? 'unknown',
      stationName: querySessionString(sessionId, WTS_INFO_CLASS.WTSWinStationName),
      userName: querySessionString(sessionId, WTS_INFO_CLASS.WTSUserName),
    };
  }
  return sessionInfos;
}
