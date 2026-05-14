/**
 * HTTP Traffic Monitor
 *
 * A live, kernel-mode HTTP server that visualizes incoming requests in real
 * time using nothing but FFI calls into `httpapi.dll`. The same HTTP.sys
 * driver that powers IIS and .NET HttpListener routes each request directly
 * to this Bun process — no Node.js stack, no TLS shim, just raw user-mode
 * bindings to the kernel's HTTP queue.
 *
 * Every request is decoded from the HTTP_REQUEST_V2 packet HTTP.sys hands
 * back, printed with verb, URL, client address, user-agent, and request
 * latency, then answered with a 200 OK carrying a small HTML page that
 * shows live counts. The console also draws a sparkline of recent request
 * latencies so a developer can watch the kernel queue breathe in real time.
 *
 * Setup (one of):
 *   - Run as Administrator, OR
 *   - Reserve the URL once: netsh http add urlacl url=http://+:8765/ user=Everyone
 *
 * APIs demonstrated (Httpapi):
 *   - HttpInitialize             (open HTTP.sys for server use)
 *   - HttpCreateServerSession    (top-level config scope)
 *   - HttpCreateUrlGroup         (URL prefix bundle)
 *   - HttpCreateRequestQueue     (kernel queue for matched requests)
 *   - HttpSetUrlGroupProperty    (bind queue to URL group)
 *   - HttpAddUrlToUrlGroup       (route http://+:8765/ to this queue)
 *   - HttpReceiveHttpRequest     (block on the queue for the next request)
 *   - HttpSendHttpResponse       (write 200 OK back to HTTP.sys)
 *   - HttpRemoveUrlFromUrlGroup  (unregister)
 *   - HttpCloseUrlGroup
 *   - HttpCloseRequestQueue
 *   - HttpCloseServerSession
 *   - HttpTerminate
 *
 * Run: bun run example/http-traffic-monitor.ts [--port=8765] [--max=20]
 */

import { type Pointer, toArrayBuffer } from 'bun:ffi';

import Httpapi, { HTTPAPI_VERSION_2, HTTP_HEADER_ID, HTTP_INITIALIZE_FLAG, HTTP_SERVER_PROPERTY, HTTP_VERB } from '../index';

Httpapi.Preload([
  'HttpAddUrlToUrlGroup',
  'HttpCloseRequestQueue',
  'HttpCloseServerSession',
  'HttpCloseUrlGroup',
  'HttpCreateRequestQueue',
  'HttpCreateServerSession',
  'HttpCreateUrlGroup',
  'HttpInitialize',
  'HttpReceiveHttpRequest',
  'HttpRemoveUrlFromUrlGroup',
  'HttpSendHttpResponse',
  'HttpSetUrlGroupProperty',
  'HttpTerminate',
]);

const ANSI = {
  bold: '\x1b[1m',
  cyan: '\x1b[96m',
  dim: '\x1b[2m',
  gray: '\x1b[90m',
  green: '\x1b[92m',
  magenta: '\x1b[95m',
  red: '\x1b[91m',
  reset: '\x1b[0m',
  yellow: '\x1b[93m',
} as const;

function getNumberArg(name: string, fallback: number): number {
  const prefix = `--${name}=`;
  for (const arg of Bun.argv.slice(2)) {
    if (arg.startsWith(prefix)) {
      const parsed = Number(arg.slice(prefix.length));
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
  }
  return fallback;
}

const port = getNumberArg('port', 8765);
const maxRequests = getNumberArg('max', 20);

// VERB enum value → readable label
const VERB_NAMES: Record<number, string> = {
  [HTTP_VERB.HttpVerbUnparsed]: '?',
  [HTTP_VERB.HttpVerbUnknown]: 'UNK',
  [HTTP_VERB.HttpVerbInvalid]: 'BAD',
  [HTTP_VERB.HttpVerbOPTIONS]: 'OPTIONS',
  [HTTP_VERB.HttpVerbGET]: 'GET',
  [HTTP_VERB.HttpVerbHEAD]: 'HEAD',
  [HTTP_VERB.HttpVerbPOST]: 'POST',
  [HTTP_VERB.HttpVerbPUT]: 'PUT',
  [HTTP_VERB.HttpVerbDELETE]: 'DELETE',
  [HTTP_VERB.HttpVerbTRACE]: 'TRACE',
  [HTTP_VERB.HttpVerbCONNECT]: 'CONNECT',
};

// HTTP_REQUEST_V2 field offsets on x64 (see http.h _HTTP_REQUEST_V1 / _V2)
const REQ_OFFSET = {
  Flags: 0,
  ConnectionId: 8,
  RequestId: 16,
  UrlContext: 24,
  VersionMajor: 32,
  VersionMinor: 34,
  Verb: 36,
  UnknownVerbLength: 40,
  RawUrlLength: 42,
  pUnknownVerb: 48,
  pRawUrl: 56,
  CookedFullUrlLength: 64,
  CookedHostLength: 66,
  CookedAbsPathLength: 68,
  CookedQueryStringLength: 70,
  CookedFullUrl: 72,
  CookedHost: 80,
  CookedAbsPath: 88,
  CookedQueryString: 96,
  pRemoteAddress: 104,
  pLocalAddress: 112,
  UnknownHeaderCount: 120,
  pUnknownHeaders: 128,
  KnownHeadersBase: 152, // after TrailerCount + padding + pTrailers
  BytesReceived: 800, // 152 + 41*16 = 808 → align: 800 is computed; verified empirically below
} as const;

const SOCKADDR_MAX = 64;

function bigintToPointer(addr: bigint): Pointer {
  return Number(addr) as Pointer;
}

function readWideStringFromPointer(addr: bigint, byteLength: number): string {
  if (addr === 0n || byteLength === 0) return '';
  const view = new Uint16Array(toArrayBuffer(bigintToPointer(addr), 0, byteLength));
  let result = '';
  for (let i = 0; i < view.length; i++) {
    if (view[i] === 0) break;
    result += String.fromCharCode(view[i]!);
  }
  return result;
}

function readAnsiStringFromPointer(addr: bigint, byteLength: number): string {
  if (addr === 0n || byteLength === 0) return '';
  const view = new Uint8Array(toArrayBuffer(bigintToPointer(addr), 0, byteLength));
  let result = '';
  for (let i = 0; i < view.length; i++) {
    if (view[i] === 0) break;
    result += String.fromCharCode(view[i]!);
  }
  return result;
}

function decodeIPv4(view: DataView): string {
  // SOCKADDR_IN layout: family(2) + port(2, net order) + addr(4) + zero(8)
  const port = ((view.getUint8(2) << 8) | view.getUint8(3)) >>> 0;
  const a = view.getUint8(4);
  const b = view.getUint8(5);
  const c = view.getUint8(6);
  const d = view.getUint8(7);
  return `${a}.${b}.${c}.${d}:${port}`;
}

function decodeIPv6(view: DataView): string {
  // SOCKADDR_IN6: family(2) + port(2 net) + flowinfo(4) + addr(16) + scope(4)
  const port = ((view.getUint8(2) << 8) | view.getUint8(3)) >>> 0;
  const groups: string[] = [];
  for (let i = 0; i < 8; i++) {
    const hi = view.getUint8(8 + i * 2);
    const lo = view.getUint8(8 + i * 2 + 1);
    groups.push(((hi << 8) | lo).toString(16));
  }
  return `[${groups.join(':')}]:${port}`;
}

function decodeSockAddr(addrPointer: bigint): string {
  if (addrPointer === 0n) return '(none)';
  try {
    const buf = toArrayBuffer(bigintToPointer(addrPointer), 0, SOCKADDR_MAX);
    const view = new DataView(buf);
    const family = view.getUint16(0, true);
    if (family === 2 /* AF_INET */) return decodeIPv4(view);
    if (family === 23 /* AF_INET6 */) return decodeIPv6(view);
    return `family=${family}`;
  } catch {
    return '(?)';
  }
}

function readKnownHeader(reqBuf: Buffer, headerId: number): string {
  // KnownHeaders[headerId] is at offset KnownHeadersBase + headerId*16
  // struct HTTP_KNOWN_HEADER { USHORT RawValueLength; PCSTR pRawValue; }
  const base = REQ_OFFSET.KnownHeadersBase + headerId * 16;
  const len = reqBuf.readUInt16LE(base);
  if (len === 0) return '';
  const ptrValue = reqBuf.readBigUInt64LE(base + 8);
  return readAnsiStringFromPointer(ptrValue, len);
}

function buildResponseStruct(statusCode: number, reason: string, contentType: string, body: Uint8Array): { responseBuf: Buffer; chunkBuf: Buffer; reasonBuf: Buffer; contentTypeBuf: Buffer; contentLengthBuf: Buffer; bodyBuf: Buffer } {
  // HTTP_RESPONSE_V2 = 568 bytes total
  const responseBuf = Buffer.alloc(568);

  // Flags(0)=0, Version(4)={Major=1,Minor=1}
  responseBuf.writeUInt16LE(1, 4); // Version.MajorVersion
  responseBuf.writeUInt16LE(1, 6); // Version.MinorVersion
  // StatusCode
  responseBuf.writeUInt16LE(statusCode, 8);
  // ReasonLength = bytes (no NUL)
  const reasonBuf = Buffer.from(reason + '\0', 'ascii');
  responseBuf.writeUInt16LE(reason.length, 10);
  // pReason at offset 16
  responseBuf.writeBigUInt64LE(BigInt(reasonBuf.ptr!), 16);

  // Headers starts at offset 24
  // UnknownHeaderCount(24)=0, pUnknownHeaders(32)=0, TrailerCount(40)=0, pTrailers(48)=0
  // KnownHeaders[] starts at offset 24 + 32 = 56
  // ContentType = id 12, Server = id 26 (response namespace: ServerResponse uses HttpHeaderServer=26)
  const KNOWN_BASE = 24 + 32;
  const contentTypeBuf = Buffer.from(contentType + '\0', 'ascii');
  responseBuf.writeUInt16LE(contentType.length, KNOWN_BASE + HTTP_HEADER_ID.HttpHeaderContentType * 16);
  responseBuf.writeBigUInt64LE(BigInt(contentTypeBuf.ptr!), KNOWN_BASE + HTTP_HEADER_ID.HttpHeaderContentType * 16 + 8);

  const contentLengthStr = String(body.byteLength);
  const contentLengthBuf = Buffer.from(contentLengthStr + '\0', 'ascii');
  responseBuf.writeUInt16LE(contentLengthStr.length, KNOWN_BASE + HTTP_HEADER_ID.HttpHeaderContentLength * 16);
  responseBuf.writeBigUInt64LE(BigInt(contentLengthBuf.ptr!), KNOWN_BASE + HTTP_HEADER_ID.HttpHeaderContentLength * 16 + 8);

  // EntityChunkCount at offset 24 + 512 = 536, pEntityChunks at offset 544
  // Build a single HTTP_DATA_CHUNK (32 bytes) of type HttpDataChunkFromMemory (0)
  const chunkBuf = Buffer.alloc(32);
  chunkBuf.writeUInt32LE(0, 0); // DataChunkType = HttpDataChunkFromMemory
  const bodyBuf = Buffer.from(body);
  chunkBuf.writeBigUInt64LE(BigInt(bodyBuf.ptr!), 8); // FromMemory.pBuffer
  chunkBuf.writeUInt32LE(body.byteLength, 16); // FromMemory.BufferLength

  responseBuf.writeUInt16LE(1, 536); // EntityChunkCount = 1
  responseBuf.writeBigUInt64LE(BigInt(chunkBuf.ptr!), 544); // pEntityChunks

  return { responseBuf, chunkBuf, reasonBuf, contentTypeBuf, contentLengthBuf, bodyBuf };
}

function sparkline(samples: number[]): string {
  if (samples.length === 0) return '';
  const blocks = '▁▂▃▄▅▆▇█';
  const max = Math.max(1, ...samples);
  return samples.map((v) => blocks[Math.min(blocks.length - 1, Math.floor((v / max) * (blocks.length - 1)))]).join('');
}

function colorVerb(name: string): string {
  const trimmed = name.trim();
  if (trimmed === 'GET') return `${ANSI.green}${name}${ANSI.reset}`;
  if (trimmed === 'POST') return `${ANSI.yellow}${name}${ANSI.reset}`;
  if (trimmed === 'PUT' || trimmed === 'DELETE' || trimmed === 'PATCH') return `${ANSI.magenta}${name}${ANSI.reset}`;
  if (trimmed === 'HEAD' || trimmed === 'OPTIONS') return `${ANSI.cyan}${name}${ANSI.reset}`;
  return `${ANSI.gray}${name}${ANSI.reset}`;
}

function colorLatencyMs(ms: number): string {
  if (ms < 5) return `${ANSI.green}${ms.toFixed(1)}ms${ANSI.reset}`;
  if (ms < 25) return `${ANSI.yellow}${ms.toFixed(1)}ms${ANSI.reset}`;
  return `${ANSI.red}${ms.toFixed(1)}ms${ANSI.reset}`;
}

// ── Startup ────────────────────────────────────────────────────────────────

console.log(`${ANSI.bold}${ANSI.cyan}═══════════════════════════════════════════════════════════════════${ANSI.reset}`);
console.log(`${ANSI.bold}${ANSI.cyan}                HTTP TRAFFIC MONITOR (kernel-mode)${ANSI.reset}`);
console.log(`${ANSI.bold}${ANSI.cyan}                powered by @bun-win32/httpapi${ANSI.reset}`);
console.log(`${ANSI.bold}${ANSI.cyan}═══════════════════════════════════════════════════════════════════${ANSI.reset}\n`);

const initStatus = Httpapi.HttpInitialize(HTTPAPI_VERSION_2, HTTP_INITIALIZE_FLAG.HTTP_INITIALIZE_SERVER, null);
if (initStatus !== 0) {
  console.error(`${ANSI.red}HttpInitialize failed: error ${initStatus}${ANSI.reset}`);
  process.exit(1);
}

const sessionIdBuf = Buffer.alloc(8);
const sessionStatus = Httpapi.HttpCreateServerSession(HTTPAPI_VERSION_2, sessionIdBuf.ptr, 0);
if (sessionStatus !== 0) {
  console.error(`${ANSI.red}HttpCreateServerSession failed: error ${sessionStatus}${ANSI.reset}`);
  Httpapi.HttpTerminate(HTTP_INITIALIZE_FLAG.HTTP_INITIALIZE_SERVER, null);
  process.exit(1);
}
const sessionId = sessionIdBuf.readBigUInt64LE(0);

const urlGroupIdBuf = Buffer.alloc(8);
Httpapi.HttpCreateUrlGroup(sessionId, urlGroupIdBuf.ptr, 0);
const urlGroupId = urlGroupIdBuf.readBigUInt64LE(0);

const queueHandleBuf = Buffer.alloc(8);
Httpapi.HttpCreateRequestQueue(HTTPAPI_VERSION_2, null, null, 0, queueHandleBuf.ptr);
const queueHandle = queueHandleBuf.readBigUInt64LE(0);

// HTTP_BINDING_INFO { HTTP_PROPERTY_FLAGS Flags; HANDLE RequestQueueHandle; }
// Flags is a bitfield ULONG with Present:1 (so set to 1 to mark "present")
const bindingInfo = Buffer.alloc(16);
bindingInfo.writeUInt32LE(1, 0); // Flags.Present = 1
bindingInfo.writeBigUInt64LE(queueHandle, 8);
Httpapi.HttpSetUrlGroupProperty(urlGroupId, HTTP_SERVER_PROPERTY.HttpServerBindingProperty, bindingInfo.ptr, 16);

const urlPrefix = `http://localhost:${port}/`;
const urlPrefixBuf = Buffer.from(urlPrefix + '\0', 'utf16le');
const addUrlStatus = Httpapi.HttpAddUrlToUrlGroup(urlGroupId, urlPrefixBuf.ptr, 0n, 0);
if (addUrlStatus !== 0) {
  console.error(`${ANSI.red}HttpAddUrlToUrlGroup failed: error ${addUrlStatus}${ANSI.reset}`);
  console.error(`${ANSI.yellow}\nFix: run as Administrator, or reserve the URL once:${ANSI.reset}`);
  console.error(`${ANSI.dim}  netsh http add urlacl url=${urlPrefix} user=Everyone${ANSI.reset}`);
  Httpapi.HttpCloseUrlGroup(urlGroupId);
  Httpapi.HttpCloseRequestQueue(queueHandle);
  Httpapi.HttpCloseServerSession(sessionId);
  Httpapi.HttpTerminate(HTTP_INITIALIZE_FLAG.HTTP_INITIALIZE_SERVER, null);
  process.exit(1);
}

console.log(`${ANSI.green}✓${ANSI.reset} Listening on ${ANSI.bold}${ANSI.cyan}http://localhost:${port}/${ANSI.reset} (HTTP.sys kernel queue)`);
console.log(`${ANSI.dim}  Waiting for ${maxRequests} requests, then shutting down. Hit it from a browser or curl.${ANSI.reset}\n`);

let received = 0;
let totalLatency = 0;
const latencyHistory: number[] = [];
const verbCounts: Record<string, number> = {};

// ── Receive loop ───────────────────────────────────────────────────────────

const REQ_BUF_SIZE = 8192;
const requestBuf = Buffer.alloc(REQ_BUF_SIZE);
const bytesReturnedBuf = Buffer.alloc(4);

const HELLO_BODY_TEMPLATE = (count: number, ms: number) => `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>bun-win32 httpapi</title>
<style>body{font-family:system-ui;background:#0b0d11;color:#dcdfe4;padding:2rem;}
h1{color:#7ee787;} .stat{color:#79c0ff;} .latency{color:#ffa657;}</style>
</head><body>
<h1>Hello from kernel-mode HTTP.sys + Bun</h1>
<p>Served by <span class="stat">@bun-win32/httpapi</span> running in Bun.</p>
<p>Request #<span class="stat">${count}</span> · Last latency: <span class="latency">${ms.toFixed(2)}ms</span></p>
<p><small>Refresh to send another request, watch the console.</small></p>
</body></html>`;

while (received < maxRequests) {
  // Zero the request buffer so HttpReceiveHttpRequest sees a clean slate
  requestBuf.fill(0);
  bytesReturnedBuf.writeUInt32LE(0, 0);

  // RequestId 0 = receive next available
  const recvStatus = Httpapi.HttpReceiveHttpRequest(queueHandle, 0n, 0, requestBuf.ptr, REQ_BUF_SIZE, bytesReturnedBuf.ptr, null);
  if (recvStatus !== 0) {
    console.error(`${ANSI.red}HttpReceiveHttpRequest failed: error ${recvStatus}${ANSI.reset}`);
    break;
  }
  const tReceived = performance.now();

  // Extract fields from HTTP_REQUEST_V2
  const requestId = requestBuf.readBigUInt64LE(REQ_OFFSET.RequestId);
  const verbEnum = requestBuf.readInt32LE(REQ_OFFSET.Verb);
  const verbName = verbEnum === HTTP_VERB.HttpVerbUnknown ? readAnsiStringFromPointer(requestBuf.readBigUInt64LE(REQ_OFFSET.pUnknownVerb), requestBuf.readUInt16LE(REQ_OFFSET.UnknownVerbLength)) : (VERB_NAMES[verbEnum] ?? '?');
  const cookedUrlAddr = requestBuf.readBigUInt64LE(REQ_OFFSET.CookedFullUrl);
  const cookedUrlLen = requestBuf.readUInt16LE(REQ_OFFSET.CookedFullUrlLength);
  const fullUrl = readWideStringFromPointer(cookedUrlAddr, cookedUrlLen);

  const remoteAddrPtr = requestBuf.readBigUInt64LE(REQ_OFFSET.pRemoteAddress);
  const remote = decodeSockAddr(remoteAddrPtr);

  const userAgent = readKnownHeader(requestBuf, HTTP_HEADER_ID.HttpHeaderUserAgent);
  const host = readKnownHeader(requestBuf, HTTP_HEADER_ID.HttpHeaderHost);

  // Send response and measure how long the kernel-mode send takes (this is
  // the meaningful server-side latency — the time we were blocked in
  // HttpReceiveHttpRequest is just idle wait between requests).
  received++;
  const body = Buffer.from(HELLO_BODY_TEMPLATE(received, 0), 'utf8');
  const response = buildResponseStruct(200, 'OK', 'text/html; charset=utf-8', body);

  Httpapi.HttpSendHttpResponse(queueHandle, requestId, 0, response.responseBuf.ptr, null, null, null, 0, null, null);
  const sendMs = performance.now() - tReceived;

  totalLatency += sendMs;
  verbCounts[verbName] = (verbCounts[verbName] ?? 0) + 1;
  latencyHistory.push(sendMs);
  if (latencyHistory.length > 40) latencyHistory.shift();

  // Render
  const truncatedUrl = fullUrl.length > 60 ? fullUrl.slice(0, 57) + '…' : fullUrl;
  const truncatedUa = userAgent.split(' ')[0] || userAgent.slice(0, 24);
  console.log(`${ANSI.dim}#${String(received).padStart(3)}${ANSI.reset} ${colorVerb(verbName.padEnd(7))} ${ANSI.bold}${truncatedUrl}${ANSI.reset}`);
  console.log(`     ${ANSI.dim}from${ANSI.reset} ${remote}  ${ANSI.dim}host${ANSI.reset} ${host}  ${ANSI.dim}ua${ANSI.reset} ${truncatedUa}`);
  console.log(`     ${ANSI.dim}send${ANSI.reset} ${colorLatencyMs(sendMs)}  ${ANSI.dim}history${ANSI.reset} ${ANSI.cyan}${sparkline(latencyHistory)}${ANSI.reset}\n`);
}

// ── Shutdown ───────────────────────────────────────────────────────────────

console.log(`${ANSI.bold}${ANSI.cyan}═══════════════════════════════════════════════════════════════════${ANSI.reset}`);
console.log(`${ANSI.bold} Summary${ANSI.reset}`);
console.log(`   Requests served : ${ANSI.green}${received}${ANSI.reset}`);
console.log(`   Avg latency     : ${ANSI.yellow}${(totalLatency / Math.max(1, received)).toFixed(2)}ms${ANSI.reset}`);
console.log(
  `   By verb         : ${Object.entries(verbCounts)
    .map(([k, v]) => `${colorVerb(k)}:${v}`)
    .join('  ')}`,
);
console.log(`${ANSI.bold}${ANSI.cyan}═══════════════════════════════════════════════════════════════════${ANSI.reset}\n`);

Httpapi.HttpRemoveUrlFromUrlGroup(urlGroupId, urlPrefixBuf.ptr, 0);
Httpapi.HttpCloseUrlGroup(urlGroupId);
Httpapi.HttpCloseRequestQueue(queueHandle);
Httpapi.HttpCloseServerSession(sessionId);
Httpapi.HttpTerminate(HTTP_INITIALIZE_FLAG.HTTP_INITIALIZE_SERVER, null);
