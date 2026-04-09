/**
 * Session Monitor
 *
 * A live terminal dashboard that polls session state every 2 seconds and renders
 * a real-time, ANSI-colored status board. Each session appears as a compact card
 * with its ID, user, state, and protocol. State transitions are highlighted with
 * a flash effect. The display auto-sizes to the terminal width.
 *
 * Press Ctrl+C to exit cleanly.
 *
 * APIs demonstrated:
 *   - WTSEnumerateSessionsW       (list all sessions each polling cycle)
 *   - WTSQuerySessionInformationW (query user, domain, protocol per session)
 *   - WTSFreeMemory               (release WTS-allocated buffers)
 *
 * Run: bun run example/session-monitor.ts
 */

import { type Pointer, read, toArrayBuffer } from 'bun:ffi';

import Wtsapi32, { WTS_CONNECTSTATE_CLASS, WTS_CURRENT_SERVER_HANDLE, WTS_INFO_CLASS } from '..';

Wtsapi32.Preload(['WTSEnumerateSessionsW', 'WTSFreeMemory', 'WTSQuerySessionInformationW']);

const ESC = '\x1b';
const BOLD = `${ESC}[1m`;
const DIM = `${ESC}[2m`;
const RESET = `${ESC}[0m`;
const HIDE_CURSOR = `${ESC}[?25l`;
const SHOW_CURSOR = `${ESC}[?25h`;
const CLEAR_SCREEN = `${ESC}[2J${ESC}[H`;

const STATE_STYLES: Record<number, { icon: string; color: string; label: string }> = {
  [WTS_CONNECTSTATE_CLASS.WTSActive]: { icon: '\u25CF', color: `${ESC}[92m`, label: 'ACTIVE' },
  [WTS_CONNECTSTATE_CLASS.WTSConnected]: { icon: '\u25CB', color: `${ESC}[96m`, label: 'CONNECTED' },
  [WTS_CONNECTSTATE_CLASS.WTSConnectQuery]: { icon: '\u25CB', color: `${ESC}[93m`, label: 'QUERY' },
  [WTS_CONNECTSTATE_CLASS.WTSDisconnected]: { icon: '\u25CB', color: `${ESC}[91m`, label: 'DISCONNECTED' },
  [WTS_CONNECTSTATE_CLASS.WTSDown]: { icon: '\u2716', color: `${ESC}[91m`, label: 'DOWN' },
  [WTS_CONNECTSTATE_CLASS.WTSIdle]: { icon: '\u25CB', color: `${ESC}[2m`, label: 'IDLE' },
  [WTS_CONNECTSTATE_CLASS.WTSInit]: { icon: '\u25CB', color: `${ESC}[93m`, label: 'INIT' },
  [WTS_CONNECTSTATE_CLASS.WTSListen]: { icon: '\u25CF', color: `${ESC}[95m`, label: 'LISTEN' },
  [WTS_CONNECTSTATE_CLASS.WTSReset]: { icon: '\u25CB', color: `${ESC}[91m`, label: 'RESET' },
  [WTS_CONNECTSTATE_CLASS.WTSShadow]: { icon: '\u25CF', color: `${ESC}[96m`, label: 'SHADOW' },
};

interface SessionSnapshot {
  sessionId: number;
  state: number;
  user: string;
  domain: string;
  protocol: number;
}

const previousStates = new Map<number, number>();
const flashUntil = new Map<number, number>();

function readWideString(buf: Buffer, maxChars: number): string {
  let result = '';
  for (let i = 0; i < maxChars; i++) {
    const code = buf.readUInt16LE(i * 2);
    if (code === 0) break;
    result += String.fromCharCode(code);
  }
  return result;
}

function queryString(sessionId: number, infoClass: WTS_INFO_CLASS): string {
  const ppBuf = Buffer.alloc(8);
  const pBytes = Buffer.alloc(4);

  if (!Wtsapi32.WTSQuerySessionInformationW(WTS_CURRENT_SERVER_HANDLE, sessionId, infoClass, ppBuf.ptr, pBytes.ptr)) {
    return '';
  }

  const bufPtr = read.ptr(ppBuf.ptr) as Pointer;
  const bytes = pBytes.readUInt32LE(0);
  if (!bufPtr || bytes === 0) return '';

  const dataBuf = Buffer.from(toArrayBuffer(bufPtr, 0, bytes));
  const result = readWideString(dataBuf, bytes / 2);
  Wtsapi32.WTSFreeMemory(bufPtr);
  return result;
}

function queryDword(sessionId: number, infoClass: WTS_INFO_CLASS): number {
  const ppBuf = Buffer.alloc(8);
  const pBytes = Buffer.alloc(4);

  if (!Wtsapi32.WTSQuerySessionInformationW(WTS_CURRENT_SERVER_HANDLE, sessionId, infoClass, ppBuf.ptr, pBytes.ptr)) {
    return -1;
  }

  const bufPtr = read.ptr(ppBuf.ptr) as Pointer;
  if (!bufPtr) return -1;

  const dataBuf = Buffer.from(toArrayBuffer(bufPtr, 0, 4));
  const value = dataBuf.readUInt32LE(0);
  Wtsapi32.WTSFreeMemory(bufPtr);
  return value;
}

function enumerateSessions(): SessionSnapshot[] {
  const ppSessionInfo = Buffer.alloc(8);
  const pCount = Buffer.alloc(4);

  if (!Wtsapi32.WTSEnumerateSessionsW(WTS_CURRENT_SERVER_HANDLE, 0, 1, ppSessionInfo.ptr, pCount.ptr)) {
    return [];
  }

  const count = pCount.readUInt32LE(0);
  const infoPtr = read.ptr(ppSessionInfo.ptr) as Pointer;
  if (!infoPtr) return [];

  const sessions: SessionSnapshot[] = [];

  // WTS_SESSION_INFOW on 64-bit: SessionId(4) + pad(4) + pWinStationName(8) + State(4) + pad(4) = 24
  const ENTRY_SIZE = 24;

  for (let i = 0; i < count; i++) {
    const entryBuf = Buffer.from(toArrayBuffer(infoPtr, i * ENTRY_SIZE, ENTRY_SIZE));
    const sessionId = entryBuf.readUInt32LE(0);
    const state = entryBuf.readUInt32LE(16);

    const user = queryString(sessionId, WTS_INFO_CLASS.WTSUserName);
    const domain = queryString(sessionId, WTS_INFO_CLASS.WTSDomainName);
    const protocol = queryDword(sessionId, WTS_INFO_CLASS.WTSClientProtocolType);

    sessions.push({ sessionId, state, user, domain, protocol });
  }

  Wtsapi32.WTSFreeMemory(infoPtr);
  return sessions;
}

function protocolLabel(p: number): string {
  if (p === 0) return 'Console';
  if (p === 2) return 'RDP';
  if (p === 1) return 'ICA';
  return `Proto(${p})`;
}

function renderCard(session: SessionSnapshot, width: number, isFlashing: boolean): string {
  const style = STATE_STYLES[session.state] ?? { icon: '?', color: DIM, label: `STATE(${session.state})` };
  const userDisplay = session.user ? (session.domain ? `${session.domain}\\${session.user}` : session.user) : '(no user)';
  const proto = protocolLabel(session.protocol);

  const flashBg = isFlashing ? `${ESC}[43m` : '';
  const idStr = `Session ${session.sessionId}`;
  const stateStr = `${style.icon} ${style.label}`;
  const rightStr = `${proto}  ${userDisplay}`;

  const innerWidth = width - 4;
  const leftPart = `${style.color}${stateStr}${RESET}`;
  const leftVisible = stateStr.length;
  const rightVisible = rightStr.length;
  const gap = Math.max(1, innerWidth - leftVisible - rightVisible);

  const topLine = `${flashBg}${DIM}\u250C${'─'.repeat(width - 2)}\u2510${RESET}`;
  const headerLine = `${flashBg}${DIM}\u2502${RESET} ${BOLD}${style.color}${idStr.padEnd(innerWidth)}${RESET} ${flashBg}${DIM}\u2502${RESET}`;
  const bodyLine = `${flashBg}${DIM}\u2502${RESET} ${leftPart}${' '.repeat(gap)}${DIM}${rightStr}${RESET} ${flashBg}${DIM}\u2502${RESET}`;
  const bottomLine = `${flashBg}${DIM}\u2514${'─'.repeat(width - 2)}\u2518${RESET}`;

  return `${topLine}\n${headerLine}\n${bodyLine}\n${bottomLine}`;
}

function render(sessions: SessionSnapshot[]): void {
  const termWidth = process.stdout.columns || 80;
  const cardWidth = Math.min(60, termWidth - 4);
  const now = Date.now();

  let output = CLEAR_SCREEN;
  output += `\n${BOLD}  Session Monitor${RESET}  ${DIM}(${sessions.length} sessions, polling every 2s, Ctrl+C to exit)${RESET}\n\n`;

  for (const session of sessions) {
    const prev = previousStates.get(session.sessionId);
    if (prev !== undefined && prev !== session.state) {
      flashUntil.set(session.sessionId, now + 2000);
    }
    previousStates.set(session.sessionId, session.state);

    const isFlashing = (flashUntil.get(session.sessionId) ?? 0) > now;
    output += renderCard(session, cardWidth, isFlashing) + '\n';
  }

  output += `\n${DIM}  Last updated: ${new Date().toLocaleTimeString()}${RESET}\n`;
  process.stdout.write(output);
}

// Cleanup on exit
process.on('SIGINT', () => {
  process.stdout.write(SHOW_CURSOR + '\n');
  process.exit(0);
});

process.stdout.write(HIDE_CURSOR);

// Initial render
const initialSessions = enumerateSessions();
render(initialSessions);

// Poll loop
setInterval(() => {
  const sessions = enumerateSessions();
  render(sessions);
}, 2000);
