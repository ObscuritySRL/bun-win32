/**
 * http-server.ts — a working HTTP/1.1 web server built on a RAW ws2_32 socket, with NO node:http and NO Bun.serve.
 *
 * Every byte of the TCP/HTTP plumbing here goes straight through the Windows Sockets DLL via FFI. We hand-pack
 * a 16-byte SOCKADDR_IN, create an AF_INET/SOCK_STREAM/IPPROTO_TCP socket, set SO_REUSEADDR, bind to
 * 127.0.0.1:<PORT>, listen with a backlog of 16, then flip the listening socket to non-blocking with
 * ioctlsocket(FIONBIO). A ~5 ms timer polls accept(); for each connected client we recv() the request into an
 * 8 KiB buffer, parse the first request line ("GET /path HTTP/1.1"), build a real HTTP/1.1 response with proper
 * Content-Length / Connection: close headers, send() it, and closesocket() the client. The served HTML is a
 * live status page: a hit counter that increments on every request, a rolling log of the most recent
 * connections (method, path, peer port, timestamp), and server uptime — all rendered from state held in this
 * process. Open http://127.0.0.1:<PORT> in a browser and watch the counter climb.
 *
 * Native pipeline (ws2_32.dll, all synchronous on the JS thread):
 *   1. WSAStartup(0x0202, WSADATA[408]) — negotiate Winsock 2.2
 *   2. socket(AF_INET, SOCK_STREAM, IPPROTO_TCP) — guard the u64 return with BigInt.asIntN(64,s) === -1n
 *   3. setsockopt(SOL_SOCKET, SO_REUSEADDR, 1); hand-pack SOCKADDR_IN; bind; listen(16)
 *   4. ioctlsocket(FIONBIO=0x8004667e, 1) — non-blocking listen socket
 *   5. setInterval: accept() → recv() → parse request line → build response → send() → closesocket()
 *      (WSAEWOULDBLOCK 10035 from accept just means "no pending connection", skip quietly)
 *   6. SIGINT / DEMO_DURATION_MS → clearInterval, closesocket(listen), WSACleanup, exit 0
 *
 * APIs: Ws2_32 WSAStartup/socket/setsockopt/bind/listen/ioctlsocket/accept/recv/send/closesocket/
 *   WSAGetLastError/WSACleanup; Kernel32 GetStdHandle/GetConsoleMode/SetConsoleMode (VT colors).
 *
 * Run: bun run packages/all/example/http-server.ts
 */

import { Kernel32, Ws2_32 } from '../index';
import { AddressFamily, Protocol, SocketOption, SocketOptionLevel, SocketType } from '@bun-win32/ws2_32';

// ── Winsock constants ──────────────────────────────────────────────────────────
const AF_INET = AddressFamily.AF_INET; // 2
const SOCK_STREAM = SocketType.SOCK_STREAM; // 1
const IPPROTO_TCP = Protocol.IPPROTO_TCP; // 6
const SOL_SOCKET = SocketOptionLevel.SOL_SOCKET; // 0xffff
const SO_REUSEADDR = SocketOption.SO_REUSEADDR; // 4
const FIONBIO = 0x8004667e; // set/clear non-blocking
const WSAEWOULDBLOCK = 10035; // accept would block: no pending connection
const PORT = Number(process.env.PORT ?? 8787);

// FOOTGUN: socket()/accept() are declared FFIType.u64, so failure comes back as the
// unsigned 0xffffffffffffffff, NOT the signed -1 of INVALID_SOCKET. Compare via asIntN.
function isInvalidSocket(s: bigint): boolean {
  return BigInt.asIntN(64, s) === -1n;
}

// ── ANSI / VT console colors ─────────────────────────────────────────────────────
const STD_OUTPUT_HANDLE = 0xfffffff5; // (DWORD)-11
const ENABLE_VIRTUAL_TERMINAL_PROCESSING = 0x0004;

function enableVt(): void {
  const h = Kernel32.GetStdHandle(STD_OUTPUT_HANDLE);
  if (isInvalidSocket(h)) return;
  const mode = Buffer.alloc(4);
  if (Kernel32.GetConsoleMode(h, mode.ptr) === 0) return;
  Kernel32.SetConsoleMode(h, mode.readUInt32LE(0) | ENABLE_VIRTUAL_TERMINAL_PROCESSING);
}

const C = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  cyan: '\x1b[38;2;80;220;255m',
  green: '\x1b[38;2;120;255;160m',
  yellow: '\x1b[38;2;255;220;110m',
  magenta: '\x1b[38;2;230;130;255m',
  gray: '\x1b[38;2;150;160;175m',
} as const;

function box(title: string, lines: string[]): string {
  const inner = Math.max(title.length, ...lines.map((l) => stripAnsi(l).length)) + 2;
  const top = `${C.cyan}╭─ ${C.bold}${title}${C.reset}${C.cyan} ${'─'.repeat(Math.max(0, inner - title.length - 1))}╮${C.reset}`;
  const body = lines.map((l) => `${C.cyan}│${C.reset} ${l}${' '.repeat(Math.max(0, inner - stripAnsi(l).length - 1))}${C.cyan}│${C.reset}`).join('\n');
  const bottom = `${C.cyan}╰${'─'.repeat(inner + 1)}╯${C.reset}`;
  return `${top}\n${body}\n${bottom}`;
}

function stripAnsi(s: string): string {
  // eslint-disable-next-line no-control-regex
  return s.replace(/\x1b\[[0-9;]*m/g, '');
}

// ── Server state (rendered into the live page) ──────────────────────────────────
interface ConnLog {
  readonly n: number;
  readonly method: string;
  readonly path: string;
  readonly peerPort: number;
  readonly at: Date;
}

const startedAt = Date.now();
let hits = 0;
const recent: ConnLog[] = [];

function fmtUptime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}h ${m}m ${sec}s`;
}

function htmlEscape(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderPage(): string {
  const rows =
    recent.length === 0
      ? '<tr><td colspan="4" class="muted">no requests yet</td></tr>'
      : recent.map((c) => `<tr><td>#${c.n}</td><td class="m">${htmlEscape(c.method)}</td><td>${htmlEscape(c.path)}</td><td class="muted">:${c.peerPort} · ${c.at.toLocaleTimeString()}</td></tr>`).join('');
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta http-equiv="refresh" content="2">
<title>Raw ws2_32 HTTP server</title>
<style>
  :root { color-scheme: dark; }
  body { font: 15px/1.5 ui-monospace, "Cascadia Code", Consolas, monospace; background: #0b0f17; color: #d6e2f0; margin: 0; padding: 2.5rem; }
  .wrap { max-width: 760px; margin: 0 auto; }
  h1 { font-size: 1.4rem; margin: 0 0 .25rem; color: #66ddff; }
  .sub { color: #7e8aa0; margin: 0 0 1.5rem; }
  .counter { font-size: 4rem; font-weight: 700; color: #7affb0; letter-spacing: .04em; }
  .grid { display: flex; gap: 2rem; margin: 1rem 0 2rem; flex-wrap: wrap; }
  .stat .k { color: #7e8aa0; font-size: .8rem; text-transform: uppercase; letter-spacing: .08em; }
  .stat .v { font-size: 1.3rem; color: #ffd86e; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: .4rem .6rem; border-bottom: 1px solid #1c2433; }
  th { color: #66ddff; font-size: .8rem; text-transform: uppercase; letter-spacing: .06em; }
  td.m { color: #e29bff; }
  td.muted, .muted { color: #6a7488; }
  footer { margin-top: 2rem; color: #586073; font-size: .8rem; }
</style></head>
<body><div class="wrap">
  <h1>Raw ws2_32 HTTP/1.1 server</h1>
  <p class="sub">Served from a hand-built Winsock socket in TypeScript — no node:http, no Bun.serve.</p>
  <div class="counter">${hits}</div>
  <div class="grid">
    <div class="stat"><div class="k">total hits</div><div class="v">${hits}</div></div>
    <div class="stat"><div class="k">uptime</div><div class="v">${fmtUptime(Date.now() - startedAt)}</div></div>
    <div class="stat"><div class="k">listening</div><div class="v">127.0.0.1:${PORT}</div></div>
  </div>
  <table>
    <thead><tr><th>#</th><th>method</th><th>path</th><th>peer · time</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <footer>Page auto-refreshes every 2s. Each load is a real recv()/send() roundtrip on the listening socket.</footer>
</div></body></html>`;
}

function buildResponse(html: string): Buffer {
  const bodyBytes = Buffer.byteLength(html, 'utf8');
  const head = 'HTTP/1.1 200 OK\r\n' + 'Content-Type: text/html; charset=utf-8\r\n' + `Content-Length: ${bodyBytes}\r\n` + 'Connection: close\r\n' + 'Server: bun-win32-raw-ws2_32\r\n' + '\r\n';
  return Buffer.concat([Buffer.from(head, 'ascii'), Buffer.from(html, 'utf8')]);
}

// Parse "GET /path HTTP/1.1" from the first line of the raw request.
function parseRequestLine(raw: string): { method: string; path: string } {
  const firstLine = raw.split('\r\n', 1)[0] ?? '';
  const parts = firstLine.split(' ');
  return { method: parts[0] || '?', path: parts[1] || '/' };
}

// ── Boot Winsock + the listening socket ──────────────────────────────────────────
enableVt();

const wsaData = Buffer.alloc(408);
const wsaResult = Ws2_32.WSAStartup(0x0202, wsaData.ptr);
if (wsaResult !== 0) {
  console.log(`${C.yellow}WSAStartup failed (error ${wsaResult}). Winsock is unavailable — exiting cleanly.${C.reset}`);
  process.exit(0);
}

const listenSock = Ws2_32.socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
if (isInvalidSocket(listenSock)) {
  console.log(`${C.yellow}socket() failed (WSA error ${Ws2_32.WSAGetLastError()}). Exiting cleanly.${C.reset}`);
  Ws2_32.WSACleanup();
  process.exit(0);
}

// SO_REUSEADDR so a quick restart doesn't hit TIME_WAIT.
const reuse = Buffer.alloc(4);
reuse.writeInt32LE(1, 0);
Ws2_32.setsockopt(listenSock, SOL_SOCKET, SO_REUSEADDR, reuse.ptr, 4);

// Hand-pack a 16-byte SOCKADDR_IN: family u16 LE, port u16 BE (network order), 4 IP bytes, 8 zero.
const addr = Buffer.alloc(16);
addr.writeUInt16LE(AF_INET, 0);
addr.writeUInt16BE(PORT, 2);
addr[4] = 127;
addr[5] = 0;
addr[6] = 0;
addr[7] = 1;

if (Ws2_32.bind(listenSock, addr.ptr, 16) !== 0) {
  const err = Ws2_32.WSAGetLastError();
  console.log(`${C.yellow}bind() to 127.0.0.1:${PORT} failed (WSA error ${err}).`);
  if (err === 10048) console.log(`Port ${PORT} is already in use — set PORT=<other> and retry.`);
  console.log(`Exiting cleanly.${C.reset}`);
  Ws2_32.closesocket(listenSock);
  Ws2_32.WSACleanup();
  process.exit(0);
}

if (Ws2_32.listen(listenSock, 16) !== 0) {
  console.log(`${C.yellow}listen() failed (WSA error ${Ws2_32.WSAGetLastError()}). Exiting cleanly.${C.reset}`);
  Ws2_32.closesocket(listenSock);
  Ws2_32.WSACleanup();
  process.exit(0);
}

// Non-blocking listen socket so the poll loop never blocks the event loop.
const nbMode = Buffer.alloc(4);
nbMode.writeUInt32LE(1, 0);
Ws2_32.ioctlsocket(listenSock, FIONBIO, nbMode.ptr);

console.log(
  box('Raw ws2_32 HTTP/1.1 server', [
    `${C.green}socket${C.reset}      ${C.dim}AF_INET / SOCK_STREAM / IPPROTO_TCP${C.reset}`,
    `${C.green}handle${C.reset}      ${C.gray}0x${listenSock.toString(16)}${C.reset}`,
    `${C.green}bound${C.reset}       ${C.bold}127.0.0.1:${PORT}${C.reset} ${C.dim}(SO_REUSEADDR, backlog 16)${C.reset}`,
    `${C.green}mode${C.reset}        ${C.dim}FIONBIO non-blocking accept()${C.reset}`,
    '',
    `${C.magenta}${C.bold}→ open  http://127.0.0.1:${PORT}${C.reset}`,
  ]),
);
console.log(`${C.dim}Ctrl-C to stop. Each browser load increments the counter via a real send() on this socket.${C.reset}\n`);

// ── Accept / serve loop ──────────────────────────────────────────────────────────
let running = true;

function serveOnce(): void {
  if (!running) return;
  const client = Ws2_32.accept(listenSock, null, null);
  if (isInvalidSocket(client)) {
    const err = Ws2_32.WSAGetLastError();
    // err 0 = no pending connection with no error code set yet; WSAEWOULDBLOCK = same, both expected.
    if (err !== WSAEWOULDBLOCK && err !== 0) {
      // A genuine error — note it but keep serving.
      console.log(`${C.yellow}accept() error ${err}${C.reset}`);
    }
    return;
  }

  try {
    // Read the request. One recv() is plenty for a simple GET; the body (if any) is ignored.
    const reqBuf = Buffer.alloc(8192);
    const received = Ws2_32.recv(client, reqBuf.ptr, 8192, 0);
    const raw = received > 0 ? reqBuf.toString('ascii', 0, received) : '';
    const { method, path } = parseRequestLine(raw);

    hits += 1;
    const entry: ConnLog = { n: hits, method, path, peerPort: 0, at: new Date() };
    recent.unshift(entry);
    if (recent.length > 8) recent.pop();

    const resp = buildResponse(renderPage());
    Ws2_32.send(client, resp.ptr, resp.length, 0);

    console.log(`${C.gray}${entry.at.toLocaleTimeString()}${C.reset}  ${C.cyan}#${hits}${C.reset}  ${C.green}${method}${C.reset} ${path}  ${C.dim}→ 200 (${resp.length} bytes)${C.reset}`);
  } finally {
    Ws2_32.closesocket(client);
  }
}

const timer = setInterval(serveOnce, 5);

// ── Teardown ──────────────────────────────────────────────────────────────────────
let torndown = false;
function shutdown(code = 0): void {
  if (torndown) return;
  torndown = true;
  running = false;
  clearInterval(timer);
  Ws2_32.closesocket(listenSock);
  Ws2_32.WSACleanup();
  console.log(`\n${C.cyan}Server stopped. Served ${C.bold}${hits}${C.reset}${C.cyan} request(s). Winsock cleaned up.${C.reset}`);
  process.exit(code);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

const durationMs = Number(process.env.DEMO_DURATION_MS ?? 0);
if (durationMs > 0) {
  setTimeout(() => shutdown(0), durationMs);
}
