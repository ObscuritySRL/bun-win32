/**
 * HTTP Inspector
 *
 * A full WinINet HTTP request diagnostic. Issues a single GET against a URL
 * and prints everything the Win32 stack tells us about the response: status
 * line, every parsed response header, the cookies the server is setting, the
 * security flags and TLS strength reported by `InternetQueryOption`, the
 * redirect chain WinINet followed, the bytes-on-the-wire transfer breakdown,
 * and a hex/ASCII preview of the first chunk of body bytes. Each field is
 * labelled and aligned so the output reads like a polished CLI report rather
 * than raw FFI dumps.
 *
 * Run with no arguments to inspect `https://learn.microsoft.com/`. Pass a URL
 * as the first argument to inspect any other endpoint.
 *
 * APIs demonstrated:
 *   - InternetOpenW                (allocate a session, set the User-Agent)
 *   - InternetSetOptionW           (per-call connect / receive timeouts)
 *   - InternetConnectW             (open a per-host connection)
 *   - HttpOpenRequestW             (build the GET, request the redirect chain)
 *   - HttpSendRequestW             (issue request, time the round trip)
 *   - HttpQueryInfoW               (status line, raw response headers, set-cookie list)
 *   - InternetQueryOptionW         (SECURITY_KEY_BITNESS, REQUEST_FLAGS, URL)
 *   - InternetReadFile             (drain the response body into a buffer)
 *   - InternetGetCookieExW         (read the per-URL persistent cookie jar)
 *   - InternetCloseHandle          (release request / connection / session)
 *
 * Run: bun run example/http-inspector.ts [url]
 */

import Wininet, { HttpQuery, InternetFlag, InternetOpenType, InternetOption, InternetService } from '../index';

Wininet.Preload(['HttpOpenRequestW', 'HttpQueryInfoW', 'HttpSendRequestW', 'InternetCloseHandle', 'InternetConnectW', 'InternetGetCookieExW', 'InternetOpenW', 'InternetQueryOptionW', 'InternetReadFile', 'InternetSetOptionW']);

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

interface CrackedUrl {
  host: string;
  isSecure: boolean;
  path: string;
  port: number;
  scheme: string;
}

function utf16leBuffer(value: string): Buffer {
  return Buffer.from(`${value}\0`, 'utf16le');
}

function utf16leFromPtrLen(buf: Buffer, charCount: number): string {
  const byteLen = charCount * 2;
  return new TextDecoder('utf-16').decode(buf.subarray(0, byteLen));
}

function crackUrl(urlString: string): CrackedUrl {
  const parsed = new URL(urlString);
  const isSecure = parsed.protocol === 'https:';
  return {
    host: parsed.hostname,
    isSecure,
    path: `${parsed.pathname}${parsed.search}` || '/',
    port: parsed.port ? Number(parsed.port) : isSecure ? 443 : 80,
    scheme: parsed.protocol.replace(':', ''),
  };
}

function queryHeaderString(hRequest: bigint, infoLevel: number, headerNameOrIndex: number | null = null): string | null {
  let bufferSize = 4096;
  const lenBuf = Buffer.alloc(4);
  let buf = Buffer.alloc(bufferSize);
  lenBuf.writeUInt32LE(bufferSize, 0);

  let ok = Wininet.HttpQueryInfoW(hRequest, infoLevel, buf.ptr!, lenBuf.ptr!, null);
  if (!ok) {
    const required = lenBuf.readUInt32LE(0);
    if (required === 0) return null;
    bufferSize = required + 2;
    buf = Buffer.alloc(bufferSize);
    lenBuf.writeUInt32LE(bufferSize, 0);
    ok = Wininet.HttpQueryInfoW(hRequest, infoLevel, buf.ptr!, lenBuf.ptr!, null);
    if (!ok) return null;
  }

  const charCount = lenBuf.readUInt32LE(0) / 2;
  return utf16leFromPtrLen(buf, charCount).replace(/\0+$/, '');
}

function queryHeaderUint32(hRequest: bigint, infoLevel: number): number | null {
  const buf = Buffer.alloc(4);
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32LE(4, 0);
  const ok = Wininet.HttpQueryInfoW(hRequest, infoLevel | HttpQuery.FLAG_NUMBER, buf.ptr!, lenBuf.ptr!, null);
  return ok ? buf.readUInt32LE(0) : null;
}

function queryOptionUint32(hRequest: bigint, option: number): number | null {
  const buf = Buffer.alloc(4);
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32LE(4, 0);
  const ok = Wininet.InternetQueryOptionW(hRequest, option, buf.ptr!, lenBuf.ptr!);
  return ok ? buf.readUInt32LE(0) : null;
}

function queryOptionAnsiString(hRequest: bigint, option: number): string | null {
  // INTERNET_OPTION_URL and a few other options always return LPSTR (ANSI),
  // even when called via InternetQueryOptionW — quirk of WinINet.
  let bufferSize = 4096;
  const lenBuf = Buffer.alloc(4);
  let buf = Buffer.alloc(bufferSize);
  lenBuf.writeUInt32LE(bufferSize, 0);
  let ok = Wininet.InternetQueryOptionA(hRequest, option, buf.ptr!, lenBuf.ptr!);
  if (!ok) {
    const required = lenBuf.readUInt32LE(0);
    if (required === 0) return null;
    bufferSize = required + 1;
    buf = Buffer.alloc(bufferSize);
    lenBuf.writeUInt32LE(bufferSize, 0);
    ok = Wininet.InternetQueryOptionA(hRequest, option, buf.ptr!, lenBuf.ptr!);
    if (!ok) return null;
  }
  const byteCount = lenBuf.readUInt32LE(0);
  return buf.subarray(0, byteCount).toString('latin1').replace(/\0+$/, '');
}

function getCookies(urlString: string): string | null {
  const urlBuf = utf16leBuffer(urlString);
  const sizeBuf = Buffer.alloc(4);
  sizeBuf.writeUInt32LE(0, 0);
  Wininet.InternetGetCookieExW(urlBuf.ptr!, null, null, sizeBuf.ptr!, 0, null);
  const charCount = sizeBuf.readUInt32LE(0);
  if (charCount === 0) return null;
  const dataBuf = Buffer.alloc(charCount * 2);
  sizeBuf.writeUInt32LE(charCount, 0);
  const ok = Wininet.InternetGetCookieExW(urlBuf.ptr!, null, dataBuf.ptr!, sizeBuf.ptr!, 0, null);
  if (!ok) return null;
  return utf16leFromPtrLen(dataBuf, sizeBuf.readUInt32LE(0)).replace(/\0+$/, '');
}

function formatBytes(value: number): string {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KiB`;
  if (value < 1024 * 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(2)} MiB`;
  return `${(value / (1024 * 1024 * 1024)).toFixed(2)} GiB`;
}

function hexDump(buffer: Buffer, maxBytes: number): string {
  const slice = buffer.subarray(0, Math.min(maxBytes, buffer.length));
  const lines: string[] = [];
  for (let i = 0; i < slice.length; i += 16) {
    const row = slice.subarray(i, i + 16);
    const hex = Array.from(row, (b) => b.toString(16).padStart(2, '0'))
      .join(' ')
      .padEnd(48);
    const ascii = Array.from(row, (b) => (b >= 0x20 && b < 0x7f ? String.fromCharCode(b) : '·')).join('');
    lines.push(`  ${ANSI.dim}${i.toString(16).padStart(6, '0')}${ANSI.reset}  ${hex}  ${ANSI.cyan}${ascii}${ANSI.reset}`);
  }
  return lines.join('\n');
}

function statusColor(status: number): string {
  if (status >= 500) return ANSI.red;
  if (status >= 400) return ANSI.yellow;
  if (status >= 300) return ANSI.magenta;
  if (status >= 200) return ANSI.green;
  return ANSI.cyan;
}

function inspect(urlString: string): void {
  const cracked = crackUrl(urlString);

  console.log(`${ANSI.bold}${ANSI.cyan}HTTP Inspector${ANSI.reset}  ${ANSI.dim}${urlString}${ANSI.reset}`);
  console.log(`  ${ANSI.dim}cracked  →${ANSI.reset}  ${cracked.scheme}://${cracked.host}:${cracked.port}${cracked.path}`);
  console.log('');

  const agent = utf16leBuffer('bun-win32-http-inspector/1.0');
  const hSession = Wininet.InternetOpenW(agent.ptr!, InternetOpenType.PRECONFIG, null, null, 0);
  if (hSession === 0n) {
    console.error(`${ANSI.red}InternetOpenW failed${ANSI.reset}`);
    return;
  }

  // 30 second timeouts (DWORD ms) via Internet*Option.
  const timeoutBuf = Buffer.alloc(4);
  timeoutBuf.writeUInt32LE(30_000, 0);
  Wininet.InternetSetOptionW(hSession, InternetOption.CONNECT_TIMEOUT, timeoutBuf.ptr!, 4);
  Wininet.InternetSetOptionW(hSession, InternetOption.RECEIVE_TIMEOUT, timeoutBuf.ptr!, 4);

  const hostBuf = utf16leBuffer(cracked.host);
  const hConnect = Wininet.InternetConnectW(hSession, hostBuf.ptr!, cracked.port, null, null, InternetService.HTTP, 0, 0n);
  if (hConnect === 0n) {
    console.error(`${ANSI.red}InternetConnectW failed${ANSI.reset}`);
    Wininet.InternetCloseHandle(hSession);
    return;
  }

  const verbBuf = utf16leBuffer('GET');
  const pathBuf = utf16leBuffer(cracked.path);
  const flags = (cracked.isSecure ? InternetFlag.SECURE : 0) | InternetFlag.NO_AUTH | InternetFlag.KEEP_CONNECTION;
  const hRequest = Wininet.HttpOpenRequestW(hConnect, verbBuf.ptr!, pathBuf.ptr!, null, null, null, flags, 0n);
  if (hRequest === 0n) {
    console.error(`${ANSI.red}HttpOpenRequestW failed${ANSI.reset}`);
    Wininet.InternetCloseHandle(hConnect);
    Wininet.InternetCloseHandle(hSession);
    return;
  }

  const sendStart = performance.now();
  const sent = Wininet.HttpSendRequestW(hRequest, null, 0, null, 0);
  const sendElapsed = performance.now() - sendStart;
  if (!sent) {
    console.error(`${ANSI.red}HttpSendRequestW failed${ANSI.reset}`);
    Wininet.InternetCloseHandle(hRequest);
    Wininet.InternetCloseHandle(hConnect);
    Wininet.InternetCloseHandle(hSession);
    return;
  }

  const status = queryHeaderUint32(hRequest, HttpQuery.STATUS_CODE) ?? 0;
  const statusText = queryHeaderString(hRequest, HttpQuery.STATUS_TEXT) ?? '';
  const httpVersion = queryHeaderString(hRequest, HttpQuery.VERSION) ?? '';
  const finalUrl = queryOptionAnsiString(hRequest, InternetOption.URL) ?? urlString;
  const tlsKeyBits = cracked.isSecure ? (queryOptionUint32(hRequest, InternetOption.SECURITY_KEY_BITNESS) ?? 0) : 0;
  const requestFlags = queryOptionUint32(hRequest, InternetOption.REQUEST_FLAGS) ?? 0;
  const contentType = queryHeaderString(hRequest, HttpQuery.CONTENT_TYPE);
  const contentLength = queryHeaderUint32(hRequest, HttpQuery.CONTENT_LENGTH);
  const transferEncoding = queryHeaderString(hRequest, HttpQuery.TRANSFER_ENCODING);
  const server = queryHeaderString(hRequest, HttpQuery.SERVER);
  const setCookie = queryHeaderString(hRequest, HttpQuery.SET_COOKIE);
  const rawHeaders = queryHeaderString(hRequest, HttpQuery.RAW_HEADERS_CRLF);
  const persistentCookie = getCookies(finalUrl);

  console.log(`${ANSI.bold}Status${ANSI.reset}`);
  console.log(`  status      ${statusColor(status)}${status} ${statusText}${ANSI.reset}`);
  console.log(`  version     ${httpVersion || ANSI.dim + '(unknown)' + ANSI.reset}`);
  console.log(`  final URL   ${finalUrl}`);
  console.log(`  round-trip  ${sendElapsed.toFixed(1)}ms (HttpSendRequest)`);
  console.log('');

  console.log(`${ANSI.bold}Security${ANSI.reset}`);
  console.log(`  secure       ${cracked.isSecure ? ANSI.green + 'yes' + ANSI.reset : ANSI.yellow + 'no (plaintext)' + ANSI.reset}`);
  if (cracked.isSecure) {
    console.log(`  TLS key bits ${tlsKeyBits > 0 ? `${tlsKeyBits}b` : ANSI.dim + '(unknown)' + ANSI.reset}`);
  }
  console.log(`  request flags 0x${requestFlags.toString(16).padStart(8, '0')}  ${decodeRequestFlags(requestFlags)}`);
  console.log('');

  console.log(`${ANSI.bold}Payload${ANSI.reset}`);
  console.log(`  content-type     ${contentType ?? ANSI.dim + '(not sent)' + ANSI.reset}`);
  console.log(`  content-length   ${contentLength != null ? formatBytes(contentLength) : ANSI.dim + '(not sent / chunked)' + ANSI.reset}`);
  console.log(`  transfer-encoding ${transferEncoding ?? ANSI.dim + '(identity)' + ANSI.reset}`);
  console.log(`  server           ${server ?? ANSI.dim + '(not sent)' + ANSI.reset}`);
  console.log('');

  if (setCookie) {
    console.log(`${ANSI.bold}Set-Cookie${ANSI.reset}`);
    for (const cookie of setCookie.split(/\r?\n/)) {
      if (cookie.trim()) console.log(`  ${ANSI.cyan}+${ANSI.reset} ${cookie.trim()}`);
    }
    console.log('');
  }

  if (persistentCookie) {
    console.log(`${ANSI.bold}Persistent Cookie Jar (InternetGetCookieExW)${ANSI.reset}`);
    for (const c of persistentCookie.split(';')) {
      const trimmed = c.trim();
      if (trimmed) console.log(`  ${ANSI.magenta}•${ANSI.reset} ${trimmed}`);
    }
    console.log('');
  }

  if (rawHeaders) {
    console.log(`${ANSI.bold}All Response Headers (HTTP_QUERY_RAW_HEADERS_CRLF)${ANSI.reset}`);
    for (const line of rawHeaders.split(/\r?\n/)) {
      if (!line.trim()) continue;
      const colon = line.indexOf(':');
      if (colon > 0) {
        const name = line.slice(0, colon);
        const value = line.slice(colon + 1).trim();
        console.log(`  ${ANSI.dim}${name.padEnd(28)}${ANSI.reset}  ${value}`);
      } else {
        console.log(`  ${ANSI.cyan}${line}${ANSI.reset}`);
      }
    }
    console.log('');
  }

  // Drain body and capture the first chunk for preview.
  let totalRead = 0;
  const previewBytes = 256;
  const preview = Buffer.alloc(previewBytes);
  let previewFilled = 0;
  const drainStart = performance.now();
  const chunkBuf = Buffer.alloc(8192);
  const readBuf = Buffer.alloc(4);
  while (true) {
    const ok = Wininet.InternetReadFile(hRequest, chunkBuf.ptr!, chunkBuf.length, readBuf.ptr!);
    if (!ok) break;
    const bytesRead = readBuf.readUInt32LE(0);
    if (bytesRead === 0) break;
    if (previewFilled < previewBytes) {
      const copy = Math.min(bytesRead, previewBytes - previewFilled);
      chunkBuf.copy(preview, previewFilled, 0, copy);
      previewFilled += copy;
    }
    totalRead += bytesRead;
  }
  const drainElapsed = performance.now() - drainStart;
  const throughput = drainElapsed > 0 ? (totalRead / drainElapsed) * 1000 : 0;

  console.log(`${ANSI.bold}Body${ANSI.reset}`);
  console.log(`  total bytes   ${formatBytes(totalRead)}  (${totalRead.toLocaleString()} bytes)`);
  console.log(`  drain time    ${drainElapsed.toFixed(1)}ms`);
  console.log(`  throughput    ${formatBytes(Math.round(throughput))}/s`);
  console.log('');

  if (previewFilled > 0) {
    console.log(`${ANSI.bold}Body Preview${ANSI.reset}  ${ANSI.dim}first ${previewFilled} bytes${ANSI.reset}`);
    console.log(hexDump(preview.subarray(0, previewFilled), previewFilled));
  }

  Wininet.InternetCloseHandle(hRequest);
  Wininet.InternetCloseHandle(hConnect);
  Wininet.InternetCloseHandle(hSession);
}

function decodeRequestFlags(flags: number): string {
  const REQ_FLAGS: Array<[number, string]> = [
    [0x0000_0001, 'FROM_CACHE'],
    [0x0000_0002, 'ASYNC'],
    [0x0000_0004, 'VIA_PROXY'],
    [0x0000_0008, 'NO_HEADERS'],
    [0x0000_0010, 'PASSIVE'],
    [0x0000_0040, 'CACHE_WRITE_DISABLED'],
    [0x0000_0080, 'NET_TIMEOUT'],
  ];
  const set = REQ_FLAGS.filter(([bit]) => (flags & bit) !== 0).map(([, name]) => name);
  return set.length === 0 ? `${ANSI.dim}(none)${ANSI.reset}` : set.join(' | ');
}

const url = Bun.argv[2] ?? 'https://learn.microsoft.com/';
inspect(url);
