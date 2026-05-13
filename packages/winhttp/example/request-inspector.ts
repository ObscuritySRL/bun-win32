/**
 * Request Inspector
 *
 * Performs a single HTTPS request and produces a complete, richly-formatted
 * diagnostic report: HTTP status, version negotiated by Windows (HTTP/1.1 vs
 * HTTP/2), TLS session strength (key bitness queried via WinHttpQueryOption),
 * every response header in canonical CRLF form, and a hex-flavored preview of
 * the response body. Timing is broken out per phase — DNS, connect, send,
 * first-byte, full body — so a developer can see exactly where time is being
 * spent on Windows's own HTTP stack.
 *
 * Use this when you need to debug a slow or failing TLS/HTTP interaction the
 * way a Windows-aware HTTP client would do it — bypassing fetch and showing
 * what WinHTTP itself sees.
 *
 * APIs demonstrated:
 *   - WinHttpOpen                 (session handle)
 *   - WinHttpSetTimeouts          (per-phase timeouts)
 *   - WinHttpConnect              (TCP target)
 *   - WinHttpOpenRequest          (HTTPS verb + path)
 *   - WinHttpAddRequestHeaders    (extra request headers)
 *   - WinHttpSendRequest          (issue the request)
 *   - WinHttpReceiveResponse      (read response headers from the wire)
 *   - WinHttpQueryHeaders         (numeric status + full RAW_HEADERS_CRLF)
 *   - WinHttpQueryOption          (HTTP_VERSION, SECURITY_KEY_BITNESS, URL)
 *   - WinHttpQueryDataAvailable   (bytes ready)
 *   - WinHttpReadData             (drain response body)
 *   - WinHttpCloseHandle          (cleanup all three handles)
 *
 * APIs demonstrated (Kernel32, cross-package):
 *   - GetLastError                (failure code on each guarded step)
 *
 * Run: bun run example/request-inspector.ts [url]
 */

import Winhttp, { WinHttpAccessType, WinHttpFlag, WinHttpOption, WinHttpQuery, WinHttpQueryFlag } from '../index';
import Kernel32 from '@bun-win32/kernel32';

Winhttp.Preload([
  'WinHttpAddRequestHeaders',
  'WinHttpCloseHandle',
  'WinHttpConnect',
  'WinHttpOpen',
  'WinHttpOpenRequest',
  'WinHttpQueryDataAvailable',
  'WinHttpQueryHeaders',
  'WinHttpQueryOption',
  'WinHttpReadData',
  'WinHttpReceiveResponse',
  'WinHttpSendRequest',
  'WinHttpSetTimeouts',
]);

const ANSI = {
  bold: '\x1b[1m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  magenta: '\x1b[35m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
  yellow: '\x1b[33m',
} as const;

interface ParsedUrl {
  host: string;
  isSecure: boolean;
  path: string;
  port: number;
}

function parseSimpleUrl(raw: string): ParsedUrl {
  const url = new URL(raw);
  const isSecure = url.protocol === 'https:';
  const port = url.port ? Number(url.port) : isSecure ? 443 : 80;
  const path = `${url.pathname}${url.search}` || '/';

  return { host: url.hostname, isSecure, path, port };
}

function utf16leBuffer(value: string): Buffer {
  return Buffer.from(`${value}\0`, 'utf16le');
}

function readUtf16le(buffer: Buffer, byteLength: number): string {
  return new TextDecoder('utf-16').decode(buffer.subarray(0, byteLength)).replace(/\0+$/, '');
}

function fail(label: string): never {
  const err = Kernel32.GetLastError();
  console.error(`${ANSI.red}${ANSI.bold}${label}${ANSI.reset} ${ANSI.dim}(GetLastError=${err} / 0x${err.toString(16).padStart(8, '0')})${ANSI.reset}`);
  process.exit(1);
}

const targetUrl = Bun.argv[2] ?? 'https://learn.microsoft.com/en-us/windows/win32/winhttp/about-winhttp';
const parsed = parseSimpleUrl(targetUrl);

console.log(`${ANSI.bold}${ANSI.cyan}WinHTTP Request Inspector${ANSI.reset}`);
console.log(`${ANSI.dim}─────────────────────────────────────────────────────────────${ANSI.reset}`);
console.log(`  ${ANSI.bold}target${ANSI.reset}       ${targetUrl}`);
console.log(`  ${ANSI.bold}host${ANSI.reset}         ${parsed.host}`);
console.log(`  ${ANSI.bold}port${ANSI.reset}         ${parsed.port}`);
console.log(`  ${ANSI.bold}path${ANSI.reset}         ${parsed.path}`);
console.log(`  ${ANSI.bold}scheme${ANSI.reset}       ${parsed.isSecure ? `${ANSI.green}https${ANSI.reset}` : 'http'}`);
console.log('');

const phases: { label: string; durationMs: number }[] = [];
const recordPhase = (label: string, start: number): void => {
  phases.push({ durationMs: performance.now() - start, label });
};

const overallStart = performance.now();
const phaseOpen = performance.now();
const agent = utf16leBuffer('bun-win32-winhttp/1.0');
const hSession = Winhttp.WinHttpOpen(agent.ptr, WinHttpAccessType.AUTOMATIC_PROXY, null, null, 0);

if (hSession === 0n) fail('WinHttpOpen failed');

Winhttp.WinHttpSetTimeouts(hSession, 5_000, 5_000, 10_000, 10_000);
recordPhase('open + timeouts', phaseOpen);

const phaseConnect = performance.now();
const hostBuf = utf16leBuffer(parsed.host);
const hConnect = Winhttp.WinHttpConnect(hSession, hostBuf.ptr, parsed.port, 0);

if (hConnect === 0n) fail('WinHttpConnect failed');
recordPhase('connect', phaseConnect);

const phaseOpenReq = performance.now();
const verbBuf = utf16leBuffer('GET');
const pathBuf = utf16leBuffer(parsed.path);
const flags = parsed.isSecure ? WinHttpFlag.SECURE : 0;
const hRequest = Winhttp.WinHttpOpenRequest(hConnect, verbBuf.ptr, pathBuf.ptr, null, null, null, flags);

if (hRequest === 0n) fail('WinHttpOpenRequest failed');
recordPhase('open request', phaseOpenReq);

const extraHeaders = utf16leBuffer('Accept: */*\r\nAccept-Encoding: identity\r\nUser-Agent: bun-win32-winhttp/1.0');
Winhttp.WinHttpAddRequestHeaders(hRequest, extraHeaders.ptr, 0xffff_ffff, 0x2000_0000 /* ADD */);

const phaseSend = performance.now();
const sent = Winhttp.WinHttpSendRequest(hRequest, null, 0, null, 0, 0, 0n);
if (sent === 0) fail('WinHttpSendRequest failed');
recordPhase('send headers', phaseSend);

const phaseRecv = performance.now();
const received = Winhttp.WinHttpReceiveResponse(hRequest, null);
if (received === 0) fail('WinHttpReceiveResponse failed');
recordPhase('first byte', phaseRecv);

const statusBuf = Buffer.alloc(4);
const statusLenBuf = Buffer.alloc(4);
statusLenBuf.writeUInt32LE(4, 0);
Winhttp.WinHttpQueryHeaders(hRequest, WinHttpQuery.STATUS_CODE | WinHttpQueryFlag.NUMBER, null, statusBuf.ptr, statusLenBuf.ptr, null);
const statusCode = statusBuf.readUInt32LE(0);

const versionBuf = Buffer.alloc(8);
const versionLenBuf = Buffer.alloc(4);
versionLenBuf.writeUInt32LE(8, 0);
const versionQueried = Winhttp.WinHttpQueryOption(hRequest, WinHttpOption.HTTP_PROTOCOL_USED, versionBuf.ptr, versionLenBuf.ptr);
const protocolBits = versionQueried !== 0 ? versionBuf.readUInt32LE(0) : 0;
const protocolName = protocolBits & 0x2 ? 'HTTP/3' : protocolBits & 0x1 ? 'HTTP/2' : 'HTTP/1.1';

const keyBitsBuf = Buffer.alloc(4);
const keyBitsLenBuf = Buffer.alloc(4);
keyBitsLenBuf.writeUInt32LE(4, 0);
const tlsQueried = parsed.isSecure ? Winhttp.WinHttpQueryOption(hRequest, WinHttpOption.SECURITY_KEY_BITNESS, keyBitsBuf.ptr, keyBitsLenBuf.ptr) : 0;
const tlsKeyBits = tlsQueried !== 0 ? keyBitsBuf.readUInt32LE(0) : 0;

const rawHeadersLenBuf = Buffer.alloc(4);
Winhttp.WinHttpQueryHeaders(hRequest, WinHttpQuery.RAW_HEADERS_CRLF, null, null, rawHeadersLenBuf.ptr, null);
const rawHeadersByteLength = rawHeadersLenBuf.readUInt32LE(0);
const rawHeadersBuf = Buffer.alloc(rawHeadersByteLength);
rawHeadersLenBuf.writeUInt32LE(rawHeadersByteLength, 0);
Winhttp.WinHttpQueryHeaders(hRequest, WinHttpQuery.RAW_HEADERS_CRLF, null, rawHeadersBuf.ptr, rawHeadersLenBuf.ptr, null);
const rawHeaders = readUtf16le(rawHeadersBuf, rawHeadersByteLength);

let totalBodyBytes = 0;
const bodyChunks: Buffer[] = [];
const phaseBody = performance.now();

while (true) {
  const availableBuf = Buffer.alloc(4);
  if (Winhttp.WinHttpQueryDataAvailable(hRequest, availableBuf.ptr) === 0) {
    fail('WinHttpQueryDataAvailable failed');
  }

  const available = availableBuf.readUInt32LE(0);
  if (available === 0) break;

  const chunkBuf = Buffer.alloc(available);
  const readBuf = Buffer.alloc(4);
  if (Winhttp.WinHttpReadData(hRequest, chunkBuf.ptr, available, readBuf.ptr) === 0) {
    fail('WinHttpReadData failed');
  }

  const readBytes = readBuf.readUInt32LE(0);
  if (readBytes === 0) break;

  bodyChunks.push(chunkBuf.subarray(0, readBytes));
  totalBodyBytes += readBytes;
}

recordPhase('body', phaseBody);

Winhttp.WinHttpCloseHandle(hRequest);
Winhttp.WinHttpCloseHandle(hConnect);
Winhttp.WinHttpCloseHandle(hSession);

const overallMs = performance.now() - overallStart;
const statusColor = statusCode >= 500 ? ANSI.red : statusCode >= 400 ? ANSI.yellow : statusCode >= 300 ? ANSI.magenta : ANSI.green;

console.log(`${ANSI.bold}Response${ANSI.reset}`);
console.log(`${ANSI.dim}─────────────────────────────────────────────────────────────${ANSI.reset}`);
console.log(`  ${ANSI.bold}status${ANSI.reset}       ${statusColor}${statusCode}${ANSI.reset}`);
console.log(`  ${ANSI.bold}protocol${ANSI.reset}     ${protocolName}  ${ANSI.dim}(flags=0x${protocolBits.toString(16).padStart(8, '0')})${ANSI.reset}`);

if (parsed.isSecure) {
  console.log(`  ${ANSI.bold}tls bits${ANSI.reset}     ${tlsKeyBits > 0 ? `${tlsKeyBits}-bit session key` : `${ANSI.dim}(unavailable)${ANSI.reset}`}`);
}

console.log(`  ${ANSI.bold}body size${ANSI.reset}    ${totalBodyBytes.toLocaleString()} bytes`);
console.log('');

console.log(`${ANSI.bold}Response Headers${ANSI.reset}  ${ANSI.dim}(WINHTTP_QUERY_RAW_HEADERS_CRLF)${ANSI.reset}`);
console.log(`${ANSI.dim}─────────────────────────────────────────────────────────────${ANSI.reset}`);

for (const line of rawHeaders.split('\r\n')) {
  if (line.length === 0) continue;
  const colonIndex = line.indexOf(':');

  if (colonIndex > 0) {
    const headerName = line.slice(0, colonIndex);
    const headerValue = line.slice(colonIndex + 1).trim();
    console.log(`  ${ANSI.cyan}${headerName.padEnd(28)}${ANSI.reset} ${headerValue}`);
  } else {
    console.log(`  ${ANSI.bold}${line}${ANSI.reset}`);
  }
}

console.log('');
console.log(`${ANSI.bold}Body Preview${ANSI.reset}  ${ANSI.dim}(first 320 bytes, replaced non-printable)${ANSI.reset}`);
console.log(`${ANSI.dim}─────────────────────────────────────────────────────────────${ANSI.reset}`);

const fullBody = Buffer.concat(bodyChunks);
const previewLength = Math.min(320, fullBody.length);
const preview = fullBody
  .subarray(0, previewLength)
  .toString('utf8')
  .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '·');
console.log(
  preview
    .split('\n')
    .map((line) => `  ${line}`)
    .join('\n'),
);

if (fullBody.length > previewLength) {
  console.log(`  ${ANSI.dim}… ${(fullBody.length - previewLength).toLocaleString()} more bytes${ANSI.reset}`);
}

console.log('');
console.log(`${ANSI.bold}Phase Timing${ANSI.reset}`);
console.log(`${ANSI.dim}─────────────────────────────────────────────────────────────${ANSI.reset}`);

const maxMs = phases.reduce((max, phase) => Math.max(max, phase.durationMs), 0);
const barWidth = 30;

for (const phase of phases) {
  const filled = maxMs === 0 ? 0 : Math.round((phase.durationMs / maxMs) * barWidth);
  const bar = `${'█'.repeat(filled)}${'·'.repeat(barWidth - filled)}`;
  console.log(`  ${phase.label.padEnd(15)} ${ANSI.cyan}${bar}${ANSI.reset}  ${phase.durationMs.toFixed(1).padStart(8)} ms`);
}

console.log(`  ${ANSI.dim}${'total'.padEnd(15)} ${'─'.repeat(barWidth)}  ${overallMs.toFixed(1).padStart(8)} ms${ANSI.reset}`);
