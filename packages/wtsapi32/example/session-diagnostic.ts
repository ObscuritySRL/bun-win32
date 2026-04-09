/**
 * Session Diagnostic
 *
 * A comprehensive Terminal Services session report that enumerates every active
 * session on the local machine, queries detailed information for each (user name,
 * domain, client name, connect state, protocol type, client display resolution),
 * and presents the results in a richly-formatted, aligned table with ANSI colors.
 *
 * APIs demonstrated:
 *   - WTSEnumerateSessionsW       (list all sessions on the local server)
 *   - WTSQuerySessionInformationW (query per-session details by info class)
 *   - WTSFreeMemory               (release WTS-allocated buffers)
 *   - WTSIsChildSessionsEnabled   (check child session support)
 *   - WTSGetChildSessionId        (retrieve child session ID)
 *
 * Run: bun run example/session-diagnostic.ts
 */

import { type Pointer, read, toArrayBuffer } from 'bun:ffi';

import Wtsapi32, { WTS_CONNECTSTATE_CLASS, WTS_CURRENT_SERVER_HANDLE, WTS_INFO_CLASS } from '..';

Wtsapi32.Preload(['WTSEnumerateSessionsW', 'WTSFreeMemory', 'WTSGetChildSessionId', 'WTSIsChildSessionsEnabled', 'WTSQuerySessionInformationW']);

const DIM = '\x1b[2m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const CYAN = '\x1b[36m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[91m';
const MAGENTA = '\x1b[35m';
const WHITE = '\x1b[97m';

const stateColors: Record<number, string> = {
  [WTS_CONNECTSTATE_CLASS.WTSActive]: GREEN,
  [WTS_CONNECTSTATE_CLASS.WTSConnected]: CYAN,
  [WTS_CONNECTSTATE_CLASS.WTSConnectQuery]: YELLOW,
  [WTS_CONNECTSTATE_CLASS.WTSDisconnected]: RED,
  [WTS_CONNECTSTATE_CLASS.WTSDown]: RED,
  [WTS_CONNECTSTATE_CLASS.WTSIdle]: DIM,
  [WTS_CONNECTSTATE_CLASS.WTSInit]: YELLOW,
  [WTS_CONNECTSTATE_CLASS.WTSListen]: MAGENTA,
  [WTS_CONNECTSTATE_CLASS.WTSReset]: RED,
  [WTS_CONNECTSTATE_CLASS.WTSShadow]: CYAN,
};

const stateNames: Record<number, string> = {
  [WTS_CONNECTSTATE_CLASS.WTSActive]: 'Active',
  [WTS_CONNECTSTATE_CLASS.WTSConnected]: 'Connected',
  [WTS_CONNECTSTATE_CLASS.WTSConnectQuery]: 'ConnectQuery',
  [WTS_CONNECTSTATE_CLASS.WTSDisconnected]: 'Disconnected',
  [WTS_CONNECTSTATE_CLASS.WTSDown]: 'Down',
  [WTS_CONNECTSTATE_CLASS.WTSIdle]: 'Idle',
  [WTS_CONNECTSTATE_CLASS.WTSInit]: 'Init',
  [WTS_CONNECTSTATE_CLASS.WTSListen]: 'Listen',
  [WTS_CONNECTSTATE_CLASS.WTSReset]: 'Reset',
  [WTS_CONNECTSTATE_CLASS.WTSShadow]: 'Shadow',
};

function readWideString(buf: Buffer, maxChars: number): string {
  let result = '';
  for (let i = 0; i < maxChars; i++) {
    const code = buf.readUInt16LE(i * 2);
    if (code === 0) break;
    result += String.fromCharCode(code);
  }
  return result;
}

function querySessionString(sessionId: number, infoClass: WTS_INFO_CLASS): string {
  const ppBuffer = Buffer.alloc(8);
  const pBytes = Buffer.alloc(4);

  if (!Wtsapi32.WTSQuerySessionInformationW(WTS_CURRENT_SERVER_HANDLE, sessionId, infoClass, ppBuffer.ptr, pBytes.ptr)) {
    return '(unavailable)';
  }

  const bufferPtr = read.ptr(ppBuffer.ptr) as Pointer;
  const bytesReturned = pBytes.readUInt32LE(0);

  if (!bufferPtr || bytesReturned === 0) {
    return '';
  }

  const dataBuf = Buffer.from(toArrayBuffer(bufferPtr, 0, bytesReturned));
  const result = readWideString(dataBuf, bytesReturned / 2);
  Wtsapi32.WTSFreeMemory(bufferPtr);
  return result;
}

function querySessionDword(sessionId: number, infoClass: WTS_INFO_CLASS): number {
  const ppBuffer = Buffer.alloc(8);
  const pBytes = Buffer.alloc(4);

  if (!Wtsapi32.WTSQuerySessionInformationW(WTS_CURRENT_SERVER_HANDLE, sessionId, infoClass, ppBuffer.ptr, pBytes.ptr)) {
    return -1;
  }

  const bufferPtr = read.ptr(ppBuffer.ptr) as Pointer;
  if (!bufferPtr) return -1;

  const dataBuf = Buffer.from(toArrayBuffer(bufferPtr, 0, 4));
  const value = dataBuf.readUInt32LE(0);
  Wtsapi32.WTSFreeMemory(bufferPtr);
  return value;
}

function queryClientDisplay(sessionId: number): string {
  const ppBuffer = Buffer.alloc(8);
  const pBytes = Buffer.alloc(4);

  if (!Wtsapi32.WTSQuerySessionInformationW(WTS_CURRENT_SERVER_HANDLE, sessionId, WTS_INFO_CLASS.WTSClientDisplay, ppBuffer.ptr, pBytes.ptr)) {
    return '(unavailable)';
  }

  const bufferPtr = read.ptr(ppBuffer.ptr) as Pointer;
  if (!bufferPtr) return '(unavailable)';

  // WTS_CLIENT_DISPLAY: { HorizontalResolution: DWORD, VerticalResolution: DWORD, ColorDepth: DWORD }
  const displayBuf = Buffer.from(toArrayBuffer(bufferPtr, 0, 12));
  const horizontalResolution = displayBuf.readUInt32LE(0);
  const verticalResolution = displayBuf.readUInt32LE(4);
  const colorDepth = displayBuf.readUInt32LE(8);
  Wtsapi32.WTSFreeMemory(bufferPtr);

  if (horizontalResolution === 0 && verticalResolution === 0) return '(none)';
  return `${horizontalResolution}x${verticalResolution} @ ${colorDepth}bpp`;
}

function protocolName(protocolType: number): string {
  switch (protocolType) {
    case 0:
      return 'Console';
    case 1:
      return 'ICA';
    case 2:
      return 'RDP';
    default:
      return `Unknown(${protocolType})`;
  }
}

function label(name: string, value: string, color: string = WHITE): string {
  return `  ${DIM}${name.padEnd(20)}${RESET}${color}${value}${RESET}`;
}

// Enumerate sessions
const ppSessionInfo = Buffer.alloc(8);
const pCount = Buffer.alloc(4);

if (!Wtsapi32.WTSEnumerateSessionsW(WTS_CURRENT_SERVER_HANDLE, 0, 1, ppSessionInfo.ptr, pCount.ptr)) {
  console.error(`${RED}Failed to enumerate sessions.${RESET}`);
  process.exit(1);
}

const sessionCount = pCount.readUInt32LE(0);
const sessionInfoPtr = read.ptr(ppSessionInfo.ptr) as Pointer;

if (!sessionInfoPtr) {
  console.error(`${RED}Session info pointer is null.${RESET}`);
  process.exit(1);
}

// WTS_SESSION_INFOW on 64-bit: SessionId(4) + pad(4) + pWinStationName(8) + State(4) + pad(4) = 24
const WTS_SESSION_INFO_SIZE = 24;

console.log(`\n${BOLD}${CYAN}  Terminal Services Session Diagnostic${RESET}`);
console.log(`${DIM}${'─'.repeat(60)}${RESET}`);

// Child sessions info
const pbEnabled = Buffer.alloc(4);
if (Wtsapi32.WTSIsChildSessionsEnabled(pbEnabled.ptr)) {
  const childEnabled = pbEnabled.readInt32LE(0) !== 0;
  console.log(label('Child Sessions', childEnabled ? `${GREEN}Enabled` : `${DIM}Disabled`));

  if (childEnabled) {
    const pChildSessionId = Buffer.alloc(4);
    if (Wtsapi32.WTSGetChildSessionId(pChildSessionId.ptr)) {
      const childId = pChildSessionId.readUInt32LE(0);
      console.log(label('Child Session ID', childId === 0xffffffff ? '(none)' : String(childId)));
    }
  }
}

console.log(label('Total Sessions', String(sessionCount)));
console.log(`${DIM}${'─'.repeat(60)}${RESET}\n`);

for (let i = 0; i < sessionCount; i++) {
  const offset = i * WTS_SESSION_INFO_SIZE;
  const sessionBuf = Buffer.from(toArrayBuffer(sessionInfoPtr, offset, WTS_SESSION_INFO_SIZE));
  const sessionId = sessionBuf.readUInt32LE(0);
  const stateValue = sessionBuf.readUInt32LE(16);

  const stateName = stateNames[stateValue] ?? `Unknown(${stateValue})`;
  const stateColor = stateColors[stateValue] ?? WHITE;

  const userName = querySessionString(sessionId, WTS_INFO_CLASS.WTSUserName);
  const domainName = querySessionString(sessionId, WTS_INFO_CLASS.WTSDomainName);
  const clientName = querySessionString(sessionId, WTS_INFO_CLASS.WTSClientName);
  const winStationName = querySessionString(sessionId, WTS_INFO_CLASS.WTSWinStationName);
  const protocolType = querySessionDword(sessionId, WTS_INFO_CLASS.WTSClientProtocolType);
  const clientDisplay = queryClientDisplay(sessionId);

  const userDisplay = userName ? (domainName ? `${domainName}\\${userName}` : userName) : '(no user)';

  console.log(`${BOLD}${stateColor}  Session ${sessionId}${RESET}  ${DIM}[${stateName}]${RESET}`);
  console.log(label('User', userDisplay, userName ? GREEN : DIM));
  console.log(label('WinStation', winStationName || '(none)'));
  console.log(label('Protocol', protocolName(protocolType), CYAN));
  console.log(label('Client Name', clientName || '(local)'));
  console.log(label('Display', clientDisplay));
  console.log();
}

// Cleanup
Wtsapi32.WTSFreeMemory(sessionInfoPtr);

console.log(`${DIM}${'─'.repeat(60)}${RESET}`);
console.log(`${DIM}  Report complete.${RESET}\n`);
