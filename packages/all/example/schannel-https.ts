/**
 * schannel-https — a REAL HTTPS GET to https://example.com performed entirely in
 * TypeScript using the Windows Schannel SSPI provider over a raw ws2_32 TCP
 * socket. No fetch. No node:https. No node:net. No OpenSSL. The TLS state machine
 * is driven by hand: every handshake token is produced/consumed by the OS, and
 * application data is sealed/opened by the OS AEAD.
 *
 * The native pipeline:
 *   1. ws2_32  WSAStartup -> getaddrinfo('example.com') -> walk addrinfo to an
 *      AF_INET sockaddr, set sin_port=443 -> socket(AF_INET, SOCK_STREAM, IPPROTO_TCP)
 *      -> connect(). A real TCP 3-way handshake.
 *   2. secur32 AcquireCredentialsHandleW(UNISP "Microsoft Unified Security Protocol
 *      Provider", SECPKG_CRED_OUTBOUND) with a hand-packed SCHANNEL_CRED.
 *   3. secur32 InitializeSecurityContextW handshake loop: emit ClientHello, send()
 *      the raw TLS record, recv() the ServerHello/Certificate/etc., feed back as
 *      [SECBUFFER_TOKEN, SECBUFFER_EMPTY], honoring SEC_I_CONTINUE_NEEDED /
 *      SEC_E_INCOMPLETE_MESSAGE / SECBUFFER_EXTRA carry-over until SEC_E_OK.
 *   4. secur32 QueryContextAttributesW: STREAM_SIZES (record framing), CONNECTION_INFO
 *      (negotiated TLS version), CIPHER_INFO (human cipher-suite name), and
 *      REMOTE_CERT_CONTEXT -> walk the cert store via crypt32 CertEnumCertificatesInStore
 *      + CertGetNameStringW to print the full server certificate chain.
 *   5. secur32 EncryptMessage seals the HTTP GET request into a TLS record; send().
 *      recv() + DecryptMessage opens the response records; print the decrypted
 *      HTTP/1.1 status line + headers + start of the HTML body.
 *
 * APIs: ws2_32 {WSAStartup, getaddrinfo, freeaddrinfo, socket, connect, setsockopt,
 *   send, recv, closesocket, WSACleanup, WSAGetLastError}; secur32 {AcquireCredentialsHandleW,
 *   InitializeSecurityContextW, QueryContextAttributesW, EncryptMessage, DecryptMessage,
 *   FreeContextBuffer, DeleteSecurityContext, FreeCredentialsHandle}; crypt32
 *   {CertEnumCertificatesInStore, CertGetNameStringW, CertFreeCertificateContext};
 *   kernel32 {GetStdHandle, GetConsoleMode, SetConsoleMode}.
 *
 * Graceful degradation: DNS failure / no network / TLS negotiation failure print a
 * friendly explanation and exit 0. All handles, the SSPI context+credential, and the
 * socket are torn down in finally.
 *
 * Run: bun run packages/all/example/schannel-https.ts
 */

import { read, toArrayBuffer, type Pointer } from 'bun:ffi';

import { Crypt32, Kernel32, Secur32, Ws2_32 } from '../index';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HOST = 'example.com';
const PORT = 443;

const AF_INET = 2;
const SOCK_STREAM = 1;
const IPPROTO_TCP = 6;
const SOL_SOCKET = 0xffff;
const SO_RCVTIMEO = 0x1006;
const SO_SNDTIMEO = 0x1005;
const INVALID_SOCKET = 0xffffffffffffffffn;
const SOCKET_ERROR = -1;

// SCHANNEL_CRED
const SCHANNEL_CRED_VERSION = 4;
const SCH_CRED_NO_DEFAULT_CREDS = 0x00000200;
const SCH_CRED_MANUAL_CRED_VALIDATION = 0x00000008;
const UNISP_NAME = 'Microsoft Unified Security Protocol Provider';

// AcquireCredentialsHandleW
const SECPKG_CRED_OUTBOUND = 2;

// InitializeSecurityContextW request flags
const ISC_REQ_REPLAY_DETECT = 0x00000004;
const ISC_REQ_SEQUENCE_DETECT = 0x00000008;
const ISC_REQ_CONFIDENTIALITY = 0x00000010;
const ISC_REQ_ALLOCATE_MEMORY = 0x00000100;
const ISC_REQ_STREAM = 0x00008000;
const ISC_REQ_FLAGS = ISC_REQ_CONFIDENTIALITY | ISC_REQ_REPLAY_DETECT | ISC_REQ_SEQUENCE_DETECT | ISC_REQ_ALLOCATE_MEMORY | ISC_REQ_STREAM;

const SECURITY_NATIVE_DREP = 0x00000010;

// SECURITY_STATUS results
const SEC_E_OK = 0x00000000;
const SEC_I_CONTINUE_NEEDED = 0x00090312;
const SEC_I_CONTEXT_EXPIRED = 0x00090317;
const SEC_E_INCOMPLETE_MESSAGE_U = 0x80090318;

// SecBufferDesc / SecBuffer
const SECBUFFER_VERSION = 0;
const SECBUFFER_EMPTY = 0;
const SECBUFFER_DATA = 1;
const SECBUFFER_TOKEN = 2;
const SECBUFFER_EXTRA = 5;
const SECBUFFER_STREAM_TRAILER = 6;
const SECBUFFER_STREAM_HEADER = 7;

// QueryContextAttributesW attributes
const SECPKG_ATTR_STREAM_SIZES = 4;
const SECPKG_ATTR_REMOTE_CERT_CONTEXT = 0x53; // 83
const SECPKG_ATTR_CONNECTION_INFO = 0x5a; // 90
const SECPKG_ATTR_CIPHER_INFO = 0x64; // 100

// Cert name
const CERT_NAME_SIMPLE_DISPLAY_TYPE = 4;
const CERT_NAME_ISSUER_FLAG = 0x1;

// SecBuffer struct layout (x64): cbBuffer u32 @0, BufferType u32 @4, pvBuffer ptr @8
const SECBUFFER_SIZE = 16;
// SecBufferDesc: ulVersion u32 @0, cBuffers u32 @4, pBuffers ptr @8
const SECBUFFERDESC_SIZE = 24;

// SecHandle (CredHandle / CtxtHandle): two ULONG_PTR = 16 bytes
const SECHANDLE_SIZE = 16;

// Console VT
const STD_OUTPUT_HANDLE = -11;
const ENABLE_VIRTUAL_TERMINAL_PROCESSING = 0x0004;

// ---------------------------------------------------------------------------
// ANSI helpers
// ---------------------------------------------------------------------------

const C = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  brightCyan: '\x1b[96m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
} as const;

function enableVt(): void {
  const h = Kernel32.GetStdHandle(STD_OUTPUT_HANDLE);
  if (h === 0n || h === INVALID_SOCKET) return;
  const modeBuf = Buffer.alloc(4);
  if (Kernel32.GetConsoleMode(h, modeBuf.ptr) === 0) return;
  const mode = modeBuf.readUInt32LE(0);
  Kernel32.SetConsoleMode(h, mode | ENABLE_VIRTUAL_TERMINAL_PROCESSING);
}

function rule(label: string): void {
  const line = '─'.repeat(Math.max(0, 62 - label.length));
  console.log(`${C.dim}──${C.reset} ${C.bold}${C.brightCyan}${label}${C.reset} ${C.dim}${line}${C.reset}`);
}

function info(k: string, v: string): void {
  console.log(`  ${C.dim}${k.padEnd(18)}${C.reset}${v}`);
}

// ---------------------------------------------------------------------------
// SecBuffer / SecBufferDesc packing
// ---------------------------------------------------------------------------

/** Pack `n` SecBuffer entries + a SecBufferDesc that points at them. Returns both
 *  buffers (keep referenced!) plus accessors to read back per-buffer fields after a call. */
function makeSecBufferDesc(buffers: Array<{ type: number; ptr: bigint | Pointer | null; cb: number }>): {
  descBuf: Buffer;
  bufArray: Buffer;
} {
  const bufArray = Buffer.alloc(SECBUFFER_SIZE * buffers.length);
  for (let i = 0; i < buffers.length; i++) {
    const b = buffers[i]!;
    const off = i * SECBUFFER_SIZE;
    bufArray.writeUInt32LE(b.cb >>> 0, off + 0);
    bufArray.writeUInt32LE(b.type >>> 0, off + 4);
    const p = b.ptr === null ? 0n : typeof b.ptr === 'bigint' ? b.ptr : BigInt(b.ptr as unknown as number);
    bufArray.writeBigUInt64LE(p, off + 8);
  }
  const descBuf = Buffer.alloc(SECBUFFERDESC_SIZE);
  descBuf.writeUInt32LE(SECBUFFER_VERSION, 0);
  descBuf.writeUInt32LE(buffers.length >>> 0, 4);
  descBuf.writeBigUInt64LE(BigInt(bufArray.ptr as unknown as number), 8);
  return { descBuf, bufArray };
}

function readSecBuffer(bufArray: Buffer, index: number): { type: number; cb: number; ptr: bigint } {
  const off = index * SECBUFFER_SIZE;
  return {
    cb: bufArray.readUInt32LE(off + 0),
    type: bufArray.readUInt32LE(off + 4),
    ptr: bufArray.readBigUInt64LE(off + 8),
  };
}

function statusName(s: number): string {
  const u = s >>> 0;
  switch (u) {
    case SEC_E_OK >>> 0:
      return 'SEC_E_OK';
    case SEC_I_CONTINUE_NEEDED >>> 0:
      return 'SEC_I_CONTINUE_NEEDED';
    case SEC_E_INCOMPLETE_MESSAGE_U >>> 0:
      return 'SEC_E_INCOMPLETE_MESSAGE';
    case SEC_I_CONTEXT_EXPIRED >>> 0:
      return 'SEC_I_CONTEXT_EXPIRED';
    case 0x80090308:
      return 'SEC_E_INVALID_TOKEN';
    case 0x80090331:
      return 'SEC_E_ALGORITHM_MISMATCH';
    default:
      return `0x${u.toString(16).padStart(8, '0')}`;
  }
}

// ---------------------------------------------------------------------------
// Network helpers (blocking socket)
// ---------------------------------------------------------------------------

function resolveSockaddr(host: string): Buffer<ArrayBuffer> | null {
  const nodeName = Buffer.from(host + '\0', 'ascii');
  const resultPtrBuf = Buffer.alloc(8);
  const rc = Ws2_32.getaddrinfo(nodeName.ptr, null, null, resultPtrBuf.ptr);
  if (rc !== 0) return null;

  const firstPtr = read.ptr(resultPtrBuf.ptr) as Pointer;
  if (!firstPtr) return null;

  let sockaddr: Buffer<ArrayBuffer> | null = null;
  let cur: Pointer | null = firstPtr;
  while (cur) {
    const ai: Buffer = Buffer.from(toArrayBuffer(cur, 0, 48));
    const family: number = ai.readInt32LE(4);
    const addrLen: number = Number(ai.readBigUInt64LE(0x10));
    const addrPtr: number = Number(ai.readBigUInt64LE(0x20));
    const nextPtr: number = Number(ai.readBigUInt64LE(0x28));
    if (family === AF_INET && addrPtr !== 0 && addrLen >= 16) {
      // toArrayBuffer aliases native memory; copy the 16-byte sockaddr_in into an
      // OWNED buffer before freeaddrinfo frees it, then override the port (network order).
      sockaddr = Buffer.alloc(16);
      sockaddr.set(new Uint8Array(toArrayBuffer(addrPtr as Pointer, 0, 16)));
      sockaddr.writeUInt16LE(AF_INET, 0);
      sockaddr.writeUInt16BE(PORT, 2);
      break;
    }
    cur = nextPtr !== 0 ? (nextPtr as Pointer) : null;
  }
  Ws2_32.freeaddrinfo(firstPtr);
  return sockaddr;
}

function dottedQuad(sockaddr: Buffer): string {
  return `${sockaddr[4]}.${sockaddr[5]}.${sockaddr[6]}.${sockaddr[7]}`;
}

/** recv exactly into a fresh buffer; returns bytes read (>0), 0 on graceful close, -1 on error/timeout. */
function recvOnce(sock: bigint, into: Buffer, offset: number): number {
  const slice = into.subarray(offset);
  const n = Ws2_32.recv(sock, slice.ptr, slice.length, 0);
  return n;
}

function sendAll(sock: bigint, data: Buffer): boolean {
  let sent = 0;
  while (sent < data.length) {
    const slice = data.subarray(sent);
    const n = Ws2_32.send(sock, slice.ptr, slice.length, 0);
    if (n === SOCKET_ERROR || n <= 0) return false;
    sent += n;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Cert chain printing
// ---------------------------------------------------------------------------

function getCertName(certPtr: Pointer, isIssuer: boolean): string {
  const nameBuf = Buffer.alloc(1024);
  const flags = isIssuer ? CERT_NAME_ISSUER_FLAG : 0;
  const chars = Crypt32.CertGetNameStringW(certPtr, CERT_NAME_SIMPLE_DISPLAY_TYPE, flags, null, nameBuf.ptr, 512);
  if (chars <= 1) return '(none)';
  return nameBuf.subarray(0, (chars - 1) * 2).toString('utf16le');
}

function printCertChain(remoteCertPtr: bigint): void {
  // PCCERT_CONTEXT layout: hCertStore is at offset +32 (see CERT_CONTEXT).
  const ctxBuf = Buffer.from(toArrayBuffer(Number(remoteCertPtr) as Pointer, 0, 40));
  const hCertStore = ctxBuf.readBigUInt64LE(32);
  if (hCertStore === 0n) {
    info('chain', '(cert store unavailable)');
    return;
  }

  let idx = 0;
  let prev: Pointer | null = null;
  while (true) {
    const ctx = Crypt32.CertEnumCertificatesInStore(hCertStore, prev);
    if (!ctx || ctx === 0) break;
    idx++;
    const p = ctx as unknown as Pointer;
    const subject = getCertName(p, false);
    const issuer = getCertName(p, true);
    const cbEncoded = Buffer.from(toArrayBuffer(p, 0, 24)).readUInt32LE(16);
    console.log(`  ${C.dim}[${idx}]${C.reset} ${C.brightGreen}${subject}${C.reset} ${C.dim}(${cbEncoded} bytes DER)${C.reset}`);
    console.log(`      ${C.dim}issued by${C.reset} ${C.yellow}${issuer}${C.reset}`);
    prev = p;
  }
  if (idx === 0) info('chain', '(no certificates enumerated)');
}

// ---------------------------------------------------------------------------
// TLS version decode (SECPKG_ATTR_CONNECTION_INFO -> dwProtocol bitflag)
// ---------------------------------------------------------------------------

function tlsVersionName(dwProtocol: number): string {
  // SP_PROT_* flags. TLS 1.3 client = 0x2000.
  if (dwProtocol & 0x00002000) return 'TLS 1.3';
  if (dwProtocol & 0x00000800) return 'TLS 1.2';
  if (dwProtocol & 0x00000200) return 'TLS 1.1';
  if (dwProtocol & 0x00000080) return 'TLS 1.0';
  if (dwProtocol & 0x00000020) return 'SSL 3.0';
  return `0x${(dwProtocol >>> 0).toString(16)}`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

let sock: bigint = INVALID_SOCKET;
let wsaStarted = false;
let credAcquired = false;
let ctxCreated = false;

// Long-lived SSPI handle buffers — must stay referenced for the whole session.
const credHandle = Buffer.alloc(SECHANDLE_SIZE);
const ctxHandle = Buffer.alloc(SECHANDLE_SIZE);

function cleanup(): void {
  try {
    if (ctxCreated) Secur32.DeleteSecurityContext(ctxHandle.ptr);
  } catch {
    /* ignore */
  }
  try {
    if (credAcquired) Secur32.FreeCredentialsHandle(credHandle.ptr);
  } catch {
    /* ignore */
  }
  try {
    if (sock !== INVALID_SOCKET) Ws2_32.closesocket(sock);
  } catch {
    /* ignore */
  }
  try {
    if (wsaStarted) Ws2_32.WSACleanup();
  } catch {
    /* ignore */
  }
}

function fail(msg: string): never {
  console.log(`\n  ${C.yellow}⚠ ${msg}${C.reset}`);
  console.log(`  ${C.dim}This is an expected environment condition, not a bug. Exiting cleanly.${C.reset}\n`);
  cleanup();
  process.exit(0);
}

enableVt();

console.log('');
console.log(`${C.bold}${C.brightCyan}  Schannel HTTPS  ${C.reset}${C.dim}— a real TLS GET driven by hand in TypeScript${C.reset}`);
console.log(`  ${C.dim}https://${HOST}/  via secur32 SSPI over a raw ws2_32 socket (no fetch, no node:https)${C.reset}`);
console.log('');

try {
  // -- 1. Winsock + TCP connect ---------------------------------------------
  rule('TCP');
  const wsaData = Buffer.alloc(408);
  if (Ws2_32.WSAStartup(0x0202, wsaData.ptr) !== 0) fail('WSAStartup failed (Winsock unavailable).');
  wsaStarted = true;

  const sockaddr = resolveSockaddr(HOST);
  if (!sockaddr) fail(`Could not resolve ${HOST} (no network / DNS failure).`);
  info('resolved', `${C.brightGreen}${dottedQuad(sockaddr)}${C.reset}${C.dim}:${PORT}${C.reset}`);

  sock = Ws2_32.socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
  if (sock === INVALID_SOCKET) fail('socket() failed.');

  // 10s recv/send timeouts so a dead network degrades gracefully instead of hanging.
  const tmo = Buffer.alloc(4);
  tmo.writeUInt32LE(10_000, 0);
  Ws2_32.setsockopt(sock, SOL_SOCKET, SO_RCVTIMEO, tmo.ptr, 4);
  Ws2_32.setsockopt(sock, SOL_SOCKET, SO_SNDTIMEO, tmo.ptr, 4);

  if (Ws2_32.connect(sock, sockaddr.ptr, 16) === SOCKET_ERROR) {
    fail(`connect() to ${dottedQuad(sockaddr)}:${PORT} failed (error ${Ws2_32.WSAGetLastError()}).`);
  }
  info('tcp', `${C.brightGreen}connected${C.reset} ${C.dim}(3-way handshake complete)${C.reset}`);

  // -- 2. Acquire Schannel credential ---------------------------------------
  rule('SCHANNEL CREDENTIAL');
  const schannelCred = Buffer.alloc(80);
  schannelCred.writeUInt32LE(SCHANNEL_CRED_VERSION, 0); // dwVersion
  schannelCred.writeUInt32LE(0, 56); // grbitEnabledProtocols = 0 -> let the OS choose (TLS 1.2/1.3)
  schannelCred.writeUInt32LE(SCH_CRED_NO_DEFAULT_CREDS | SCH_CRED_MANUAL_CRED_VALIDATION, 72); // dwFlags

  const unispName = Buffer.from(UNISP_NAME + '\0', 'utf16le');
  const acq = Secur32.AcquireCredentialsHandleW(null, unispName.ptr, SECPKG_CRED_OUTBOUND, null, schannelCred.ptr, null, null, credHandle.ptr, null);
  if (acq >>> 0 !== SEC_E_OK >>> 0) fail(`AcquireCredentialsHandleW failed: ${statusName(acq)}`);
  credAcquired = true;
  info('provider', `${C.brightGreen}${UNISP_NAME}${C.reset}`);
  info('cred', `${C.green}acquired${C.reset} ${C.dim}(SECPKG_CRED_OUTBOUND)${C.reset}`);

  // -- 3. Handshake loop -----------------------------------------------------
  rule('TLS HANDSHAKE');
  const targetName = Buffer.from(HOST + '\0', 'utf16le');
  const contextAttr = Buffer.alloc(4);

  // Growing receive buffer that accumulates server bytes across recv() calls.
  let recvBuf = Buffer.alloc(0);
  let firstCall = true;
  let roundTrips = 0;

  for (;;) {
    // ---- produce a client token -----------------------------------------
    // Output token buffer: ALLOCATE_MEMORY means Schannel allocates pvBuffer; we
    // pass a SecBuffer with pvBuffer=NULL/cb=0 and read back the allocated ptr.
    const out = makeSecBufferDesc([{ type: SECBUFFER_TOKEN, ptr: null, cb: 0 }]);

    let inDescPtr: Pointer | null = null;
    let inBufArray: Buffer | null = null;
    if (!firstCall) {
      // Input: [TOKEN = all bytes we have so far, EMPTY] — Schannel reports
      // SECBUFFER_EXTRA leftovers we must carry into the next round.
      const inputData = recvBuf;
      const inObj = makeSecBufferDesc([
        { type: SECBUFFER_TOKEN, ptr: BigInt(inputData.ptr as unknown as number), cb: inputData.length },
        { type: SECBUFFER_EMPTY, ptr: null, cb: 0 },
      ]);
      inDescPtr = inObj.descBuf.ptr as Pointer;
      inBufArray = inObj.bufArray;
      // Keep inputData referenced through the call:
      (inObj as unknown as { _ref: Buffer })._ref = inputData;
    }

    const isc = Secur32.InitializeSecurityContextW(credHandle.ptr, firstCall ? null : ctxHandle.ptr, targetName.ptr, ISC_REQ_FLAGS, 0, SECURITY_NATIVE_DREP, inDescPtr, 0, ctxHandle.ptr, out.descBuf.ptr, contextAttr.ptr, null);
    ctxCreated = true;
    firstCall = false;
    roundTrips++;

    const status = isc >>> 0;

    // SEC_E_INCOMPLETE_MESSAGE: need more bytes from the wire, keep recvBuf intact.
    if (status === SEC_E_INCOMPLETE_MESSAGE_U >>> 0) {
      const grow = Buffer.alloc(8192);
      const n = recvOnce(sock, grow, 0);
      if (n <= 0) fail('Connection closed during handshake (incomplete message).');
      recvBuf = Buffer.concat([recvBuf, grow.subarray(0, n)]);
      continue;
    }

    if (status !== SEC_E_OK >>> 0 && status !== SEC_I_CONTINUE_NEEDED >>> 0) {
      fail(`InitializeSecurityContextW failed: ${statusName(isc)}`);
    }

    // Send any output token Schannel produced.
    const outBuf = readSecBuffer(out.bufArray, 0);
    if (outBuf.cb > 0 && outBuf.ptr !== 0n) {
      const token = Buffer.from(toArrayBuffer(Number(outBuf.ptr) as Pointer, 0, outBuf.cb));
      if (!sendAll(sock, token)) {
        Secur32.FreeContextBuffer(Number(outBuf.ptr) as Pointer);
        fail('send() of handshake token failed.');
      }
      Secur32.FreeContextBuffer(Number(outBuf.ptr) as Pointer);
    }

    // Carry over SECBUFFER_EXTRA from the input (bytes belonging to the next record).
    if (inBufArray) {
      const extra = readSecBuffer(inBufArray, 1);
      if (extra.type === SECBUFFER_EXTRA && extra.cb > 0) {
        recvBuf = recvBuf.subarray(recvBuf.length - extra.cb);
      } else {
        recvBuf = Buffer.alloc(0);
      }
    }

    if (status === SEC_E_OK >>> 0) break; // handshake complete

    // SEC_I_CONTINUE_NEEDED: read the server's next flight.
    const grow = Buffer.alloc(16384);
    const n = recvOnce(sock, grow, 0);
    if (n <= 0) fail('Connection closed during handshake (continue needed).');
    recvBuf = Buffer.concat([recvBuf, grow.subarray(0, n)]);
  }

  info('handshake', `${C.brightGreen}complete${C.reset} ${C.dim}(${roundTrips} ISC round-trip(s))${C.reset}`);

  // -- 4. Query negotiated parameters ---------------------------------------
  rule('NEGOTIATED PARAMETERS');

  // CONNECTION_INFO -> TLS version
  const connInfo = Buffer.alloc(64);
  if (Secur32.QueryContextAttributesW(ctxHandle.ptr, SECPKG_ATTR_CONNECTION_INFO, connInfo.ptr) >>> 0 === SEC_E_OK >>> 0) {
    const dwProtocol = connInfo.readUInt32LE(0);
    const dwCipherStrength = connInfo.readUInt32LE(8);
    info('tls version', `${C.bold}${C.brightYellow}${tlsVersionName(dwProtocol)}${C.reset}`);
    info('key strength', `${C.brightGreen}${dwCipherStrength}-bit${C.reset}`);
  }

  // CIPHER_INFO -> human cipher-suite name (szCipherSuite WCHAR[64] @ offset 16)
  const cipherInfo = Buffer.alloc(512);
  if (Secur32.QueryContextAttributesW(ctxHandle.ptr, SECPKG_ATTR_CIPHER_INFO, cipherInfo.ptr) >>> 0 === SEC_E_OK >>> 0) {
    const dwCipherSuite = cipherInfo.readUInt32LE(8);
    const szCipherSuite = cipherInfo
      .subarray(16, 16 + 64 * 2)
      .toString('utf16le')
      .replace(/\0.*$/, '');
    if (szCipherSuite) {
      info('cipher suite', `${C.bold}${C.brightGreen}${szCipherSuite}${C.reset} ${C.dim}(0x${dwCipherSuite.toString(16)})${C.reset}`);
    }
  }

  // STREAM_SIZES -> record framing for app data
  const streamSizes = Buffer.alloc(36);
  if (Secur32.QueryContextAttributesW(ctxHandle.ptr, SECPKG_ATTR_STREAM_SIZES, streamSizes.ptr) >>> 0 !== SEC_E_OK >>> 0) {
    fail('QueryContextAttributesW(STREAM_SIZES) failed.');
  }
  const cbHeader = streamSizes.readUInt32LE(0);
  const cbTrailer = streamSizes.readUInt32LE(4);
  const cbMaxMessage = streamSizes.readUInt32LE(8);
  info('record framing', `${C.dim}header ${cbHeader}B · trailer ${cbTrailer}B · max msg ${cbMaxMessage}B${C.reset}`);

  // REMOTE_CERT_CONTEXT -> chain
  rule('SERVER CERTIFICATE CHAIN');
  const remoteCertPtrBuf = Buffer.alloc(8);
  if (Secur32.QueryContextAttributesW(ctxHandle.ptr, SECPKG_ATTR_REMOTE_CERT_CONTEXT, remoteCertPtrBuf.ptr) >>> 0 === SEC_E_OK >>> 0) {
    const remoteCertPtr = remoteCertPtrBuf.readBigUInt64LE(0);
    if (remoteCertPtr !== 0n) {
      printCertChain(remoteCertPtr);
      // Release the leaf context we obtained (the chain store remains owned by Schannel).
      Crypt32.CertFreeCertificateContext(Number(remoteCertPtr) as Pointer);
    } else {
      info('chain', '(no remote certificate)');
    }
  } else {
    info('chain', '(remote cert unavailable)');
  }

  // -- 5. Encrypt the HTTP request, decrypt the response --------------------
  rule('APPLICATION DATA  (HTTP/1.1)');

  const request = `GET / HTTP/1.1\r\nHost: ${HOST}\r\nUser-Agent: bun-win32-schannel/1.0\r\nConnection: close\r\nAccept: text/html\r\n\r\n`;
  const requestBytes = Buffer.from(request, 'ascii');

  // Build the EncryptMessage scratch: [STREAM_HEADER, DATA, STREAM_TRAILER, EMPTY]
  // over ONE contiguous buffer of cbHeader + data + cbTrailer.
  const msg = Buffer.alloc(cbHeader + requestBytes.length + cbTrailer);
  requestBytes.copy(msg, cbHeader);
  const msgBase = BigInt(msg.ptr as unknown as number);

  const encDesc = makeSecBufferDesc([
    { type: SECBUFFER_STREAM_HEADER, ptr: msgBase, cb: cbHeader },
    { type: SECBUFFER_DATA, ptr: msgBase + BigInt(cbHeader), cb: requestBytes.length },
    { type: SECBUFFER_STREAM_TRAILER, ptr: msgBase + BigInt(cbHeader + requestBytes.length), cb: cbTrailer },
    { type: SECBUFFER_EMPTY, ptr: null, cb: 0 },
  ]);

  const enc = Secur32.EncryptMessage(ctxHandle.ptr, 0, encDesc.descBuf.ptr, 0);
  if (enc >>> 0 !== SEC_E_OK >>> 0) fail(`EncryptMessage failed: ${statusName(enc)}`);

  // The sealed record length = sum of the three buffers' cb (header/data/trailer may
  // have been adjusted by Schannel).
  const hdr = readSecBuffer(encDesc.bufArray, 0);
  const dat = readSecBuffer(encDesc.bufArray, 1);
  const trl = readSecBuffer(encDesc.bufArray, 2);
  const sealedLen = hdr.cb + dat.cb + trl.cb;
  const sealedRecord = msg.subarray(0, sealedLen);
  info('request', `${C.dim}GET / HTTP/1.1 (${requestBytes.length}B plaintext) → ${sealedLen}B TLS record${C.reset}`);

  if (!sendAll(sock, sealedRecord)) fail('send() of encrypted request failed.');

  // Decrypt loop: accumulate ciphertext, DecryptMessage with [DATA, EMPTY, EMPTY, EMPTY].
  let cipherBuf = Buffer.alloc(0);
  let plaintext = Buffer.alloc(0);
  let closed = false;
  const MAX_PLAINTEXT = 16384; // enough to show status + headers + body start

  while (plaintext.length < MAX_PLAINTEXT && !closed) {
    // Top up from the wire if we have no full record yet.
    const chunk = Buffer.alloc(16384);
    const n = recvOnce(sock, chunk, 0);
    if (n <= 0) {
      closed = true;
      if (cipherBuf.length === 0) break;
    } else {
      cipherBuf = Buffer.concat([cipherBuf, chunk.subarray(0, n)]);
    }

    // Try to decrypt as many complete records as cipherBuf currently holds.
    for (;;) {
      if (cipherBuf.length === 0) break;

      // DecryptMessage needs the data in a writable buffer it can decrypt in place.
      const work: Buffer = Buffer.from(cipherBuf); // copy; keep referenced
      const decDesc = makeSecBufferDesc([
        { type: SECBUFFER_DATA, ptr: BigInt(work.ptr as unknown as number), cb: work.length },
        { type: SECBUFFER_EMPTY, ptr: null, cb: 0 },
        { type: SECBUFFER_EMPTY, ptr: null, cb: 0 },
        { type: SECBUFFER_EMPTY, ptr: null, cb: 0 },
      ]);

      const dec = Secur32.DecryptMessage(ctxHandle.ptr, decDesc.descBuf.ptr, 0, null);
      const ds = dec >>> 0;

      if (ds === SEC_E_INCOMPLETE_MESSAGE_U >>> 0) {
        // Need more bytes; cipherBuf stays as-is, go read more.
        break;
      }
      if (ds === SEC_I_CONTEXT_EXPIRED >>> 0) {
        closed = true;
        break;
      }
      if (ds !== SEC_E_OK >>> 0) {
        // Unexpected; stop decrypting but keep what we have.
        closed = true;
        break;
      }

      // Collect SECBUFFER_DATA output and find any SECBUFFER_EXTRA leftover.
      let extra: Buffer<ArrayBuffer> | null = null;
      for (let i = 0; i < 4; i++) {
        const sb = readSecBuffer(decDesc.bufArray, i);
        if (sb.type === SECBUFFER_DATA && sb.cb > 0 && sb.ptr !== 0n) {
          const part = Buffer.from(toArrayBuffer(Number(sb.ptr) as Pointer, 0, sb.cb));
          plaintext = Buffer.concat([plaintext, part]);
        } else if (sb.type === SECBUFFER_EXTRA && sb.cb > 0 && sb.ptr !== 0n) {
          // Copy leftover ciphertext into an owned buffer (Buffer<ArrayBuffer>) for the next round.
          extra = Buffer.alloc(sb.cb);
          extra.set(new Uint8Array(toArrayBuffer(Number(sb.ptr) as Pointer, 0, sb.cb)));
        }
      }

      cipherBuf = extra ? extra : Buffer.alloc(0);
      if (plaintext.length >= MAX_PLAINTEXT) break;
    }
  }

  if (plaintext.length === 0) fail('No decrypted application data received.');

  // Print the decrypted HTTP response head (status line + headers + body start).
  const text = plaintext.toString('latin1');
  const headerEnd = text.indexOf('\r\n\r\n');
  const head = headerEnd >= 0 ? text.slice(0, headerEnd) : text.slice(0, 800);
  const body = headerEnd >= 0 ? text.slice(headerEnd + 4) : '';

  console.log(`  ${C.dim}┌─ decrypted by Schannel AEAD ─ ${plaintext.length} plaintext bytes${C.reset}`);
  for (const line of head.split('\r\n')) {
    if (!line) continue;
    if (/^HTTP\//.test(line)) {
      console.log(`  ${C.dim}│${C.reset} ${C.bold}${C.brightGreen}${line}${C.reset}`);
    } else {
      const idx = line.indexOf(':');
      if (idx > 0) {
        console.log(`  ${C.dim}│${C.reset} ${C.cyan}${line.slice(0, idx)}${C.reset}${C.dim}:${C.reset}${line.slice(idx + 1)}`);
      } else {
        console.log(`  ${C.dim}│${C.reset} ${line}`);
      }
    }
  }
  if (body) {
    console.log(`  ${C.dim}│${C.reset}`);
    const bodyHead = body.slice(0, 360).split('\n').slice(0, 8).join('\n');
    for (const bl of bodyHead.split('\n')) {
      console.log(`  ${C.dim}│ ${bl.replace(/\s+$/, '')}${C.reset}`);
    }
    console.log(`  ${C.dim}└─ … (${body.length} body bytes total)${C.reset}`);
  } else {
    console.log(`  ${C.dim}└─ (no body separator found)${C.reset}`);
  }

  console.log('');
  console.log(`  ${C.bold}${C.brightGreen}✓ Real HTTPS round-trip completed entirely via Windows Schannel SSPI.${C.reset}`);
  console.log('');
} catch (err) {
  console.log(`\n  ${C.red}Unexpected error: ${String(err instanceof Error ? err.message : err)}${C.reset}`);
} finally {
  cleanup();
}

process.exit(0);
