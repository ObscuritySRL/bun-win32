/**
 * HTTP Service Audit
 *
 * A comprehensive diagnostic of the HTTP Server API on this machine. It probes
 * feature support across every `HTTP_FEATURE_ID`, enumerates the system-wide
 * URL ACL reservations and IP listen list, then opens a transient server
 * session / URL group / request queue and queries each scope's properties
 * (state, 503 verbosity, idle/header/drain/etc. timeouts) — printing every
 * field in an aligned table with colored status indicators.
 *
 * No network port is bound, no firewall prompt appears, and no Administrator
 * privileges are required for the local session probe. The system-wide queries
 * (URL ACL list, IP listen list) gracefully fall back when the account lacks
 * permission to enumerate them.
 *
 * APIs demonstrated (Httpapi):
 *   - HttpInitialize / HttpTerminate            (HTTP.sys lifecycle)
 *   - HttpIsFeatureSupported                    (per-feature probe)
 *   - HttpQueryServiceConfiguration             (URL ACLs, IP listen list)
 *   - HttpCreateServerSession                   (transient session scope)
 *   - HttpCreateUrlGroup                        (transient URL group)
 *   - HttpCreateRequestQueue                    (transient request queue)
 *   - HttpQueryServerSessionProperty            (state + timeouts)
 *   - HttpQueryRequestQueueProperty             (503 verbosity)
 *   - HttpCloseUrlGroup / HttpCloseRequestQueue / HttpCloseServerSession
 *
 * Run: bun run example/http-service-audit.ts
 */

import { toArrayBuffer, type Pointer } from 'bun:ffi';

import Httpapi, { HTTP_503_RESPONSE_VERBOSITY, HTTP_ENABLED_STATE, HTTP_FEATURE_ID, HTTP_INITIALIZE_FLAG, HTTP_SERVER_PROPERTY, HTTP_SERVICE_CONFIG_ID, HTTP_SERVICE_CONFIG_QUERY_TYPE, HTTPAPI_VERSION_2 } from '../index';

Httpapi.Preload([
  'HttpCloseRequestQueue',
  'HttpCloseServerSession',
  'HttpCloseUrlGroup',
  'HttpCreateRequestQueue',
  'HttpCreateServerSession',
  'HttpCreateUrlGroup',
  'HttpInitialize',
  'HttpIsFeatureSupported',
  'HttpQueryRequestQueueProperty',
  'HttpQueryServerSessionProperty',
  'HttpQueryServiceConfiguration',
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
  underline: '\x1b[4m',
  yellow: '\x1b[93m',
} as const;

const ERROR_NO_MORE_ITEMS = 259;
const ERROR_FILE_NOT_FOUND = 2;
const ERROR_INSUFFICIENT_BUFFER = 122;
const ERROR_MORE_DATA = 234;
const ERROR_ACCESS_DENIED = 5;

function header(title: string): void {
  const bar = '═'.repeat(72);
  console.log(`\n${ANSI.bold}${ANSI.cyan}${bar}${ANSI.reset}`);
  console.log(`${ANSI.bold}${ANSI.cyan} ${title}${ANSI.reset}`);
  console.log(`${ANSI.bold}${ANSI.cyan}${bar}${ANSI.reset}`);
}

function ok(label: string, value: string): void {
  console.log(`  ${ANSI.green}✓${ANSI.reset} ${label.padEnd(34)} ${ANSI.bold}${value}${ANSI.reset}`);
}

function bad(label: string, value: string): void {
  console.log(`  ${ANSI.red}✗${ANSI.reset} ${label.padEnd(34)} ${ANSI.red}${value}${ANSI.reset}`);
}

function info(label: string, value: string): void {
  console.log(`  ${ANSI.cyan}·${ANSI.reset} ${label.padEnd(34)} ${value}`);
}

function warn(message: string): void {
  console.log(`  ${ANSI.yellow}!${ANSI.reset} ${ANSI.yellow}${message}${ANSI.reset}`);
}

function readWideString(addr: bigint, maxBytes = 2048): string {
  if (addr === 0n) return '';
  // Walk until we find a NUL wchar or hit maxBytes
  const buf = Buffer.from(toArrayBuffer(Number(addr) as Pointer, 0, maxBytes));
  let end = buf.length;
  for (let i = 0; i + 1 < buf.length; i += 2) {
    if (buf.readUInt16LE(i) === 0) {
      end = i;
      break;
    }
  }
  return buf.subarray(0, end).toString('utf16le');
}

function decodeSockAddrStorage(buf: Buffer, offset: number): string {
  const family = buf.readUInt16LE(offset);
  if (family === 2 /* AF_INET */) {
    const port = ((buf.readUInt8(offset + 2) << 8) | buf.readUInt8(offset + 3)) >>> 0;
    const a = buf.readUInt8(offset + 4);
    const b = buf.readUInt8(offset + 5);
    const c = buf.readUInt8(offset + 6);
    const d = buf.readUInt8(offset + 7);
    return `${a}.${b}.${c}.${d}${port ? `:${port}` : ''}`;
  }
  if (family === 23 /* AF_INET6 */) {
    const port = ((buf.readUInt8(offset + 2) << 8) | buf.readUInt8(offset + 3)) >>> 0;
    const groups: string[] = [];
    for (let i = 0; i < 8; i++) {
      groups.push(buf.readUInt16BE(offset + 8 + i * 2).toString(16));
    }
    const compact = groups
      .join(':')
      .replace(/(?:^|:)(?:0(?::|$)){2,}/, '::')
      .replace(/:{3,}/, '::');
    return `[${compact}]${port ? `:${port}` : ''}`;
  }
  return `family=${family}`;
}

function describeError(code: number): string {
  switch (code) {
    case 0:
      return 'NO_ERROR';
    case ERROR_FILE_NOT_FOUND:
      return 'ERROR_FILE_NOT_FOUND';
    case ERROR_ACCESS_DENIED:
      return 'ERROR_ACCESS_DENIED';
    case ERROR_INSUFFICIENT_BUFFER:
      return 'ERROR_INSUFFICIENT_BUFFER';
    case ERROR_MORE_DATA:
      return 'ERROR_MORE_DATA';
    case ERROR_NO_MORE_ITEMS:
      return 'ERROR_NO_MORE_ITEMS';
    case 87:
      return 'ERROR_INVALID_PARAMETER';
    case 1314:
      return 'ERROR_PRIVILEGE_NOT_HELD';
    default:
      return `error ${code}`;
  }
}

function probeFeatures(): void {
  header('HTTP feature probe');
  const features: Array<[string, number]> = [
    ['HttpFeatureUnknown', HTTP_FEATURE_ID.HttpFeatureUnknown],
    ['HttpFeatureResponseTrailers', HTTP_FEATURE_ID.HttpFeatureResponseTrailers],
    ['HttpFeatureApiTimings', HTTP_FEATURE_ID.HttpFeatureApiTimings],
    ['HttpFeatureDelegateEx', HTTP_FEATURE_ID.HttpFeatureDelegateEx],
    ['HttpFeatureHttp3', HTTP_FEATURE_ID.HttpFeatureHttp3],
  ];

  let supported = 0;
  for (const [name, id] of features) {
    const isSupported = Httpapi.HttpIsFeatureSupported(id);
    if (isSupported) {
      supported++;
      ok(name, 'supported');
    } else {
      info(name, `${ANSI.gray}not supported${ANSI.reset}`);
    }
  }
  console.log(`\n  ${ANSI.dim}${supported}/${features.length} features available on this build.${ANSI.reset}`);
}

function enumerateUrlAclReservations(): void {
  header('URL ACL reservations (HTTP_SERVICE_CONFIG_URLACL_INFO)');

  // HTTP_SERVICE_CONFIG_URLACL_QUERY layout on x64:
  //   QueryDesc:DWORD(0..3) + pad(4..7) + KeyDesc.pUrlPrefix:PWSTR(8..15) + dwToken:DWORD(16..19) + pad(20..23) = 24 bytes
  const QUERY_SIZE = 24;
  const queryBuf = Buffer.alloc(QUERY_SIZE);
  let count = 0;
  let token = 0;

  for (;;) {
    queryBuf.fill(0);
    queryBuf.writeUInt32LE(HTTP_SERVICE_CONFIG_QUERY_TYPE.HttpServiceConfigQueryNext, 0);
    queryBuf.writeBigUInt64LE(0n, 8); // pUrlPrefix = NULL (Next mode)
    queryBuf.writeUInt32LE(token, 16);

    // Sizing call
    const sizeBuf = Buffer.alloc(4);
    let status = Httpapi.HttpQueryServiceConfiguration(0n, HTTP_SERVICE_CONFIG_ID.HttpServiceConfigUrlAclInfo, queryBuf.ptr, QUERY_SIZE, null, 0, sizeBuf.ptr, null);

    if (status === ERROR_NO_MORE_ITEMS || status === ERROR_FILE_NOT_FOUND) break;
    if (status === ERROR_ACCESS_DENIED) {
      warn('access denied — try running as Administrator to enumerate URL ACLs.');
      return;
    }
    if (status !== ERROR_INSUFFICIENT_BUFFER && status !== ERROR_MORE_DATA && status !== 0) {
      warn(`HttpQueryServiceConfiguration sizing failed: ${describeError(status)}`);
      return;
    }

    const required = sizeBuf.readUInt32LE(0);
    if (required === 0) break;

    const outBuf = Buffer.alloc(required);
    const writtenBuf = Buffer.alloc(4);
    status = Httpapi.HttpQueryServiceConfiguration(0n, HTTP_SERVICE_CONFIG_ID.HttpServiceConfigUrlAclInfo, queryBuf.ptr, QUERY_SIZE, outBuf.ptr, required, writtenBuf.ptr, null);

    if (status !== 0) {
      warn(`HttpQueryServiceConfiguration fetch failed: ${describeError(status)}`);
      return;
    }

    // HTTP_SERVICE_CONFIG_URLACL_SET = { pUrlPrefix:PWSTR(0..7), pStringSecurityDescriptor:PWSTR(8..15) }
    const urlPrefixPtr = outBuf.readBigUInt64LE(0);
    const sddlPtr = outBuf.readBigUInt64LE(8);
    const urlPrefix = readWideString(urlPrefixPtr);
    const sddl = readWideString(sddlPtr);

    count++;
    console.log(`  ${ANSI.bold}${ANSI.cyan}[${count}]${ANSI.reset} ${ANSI.bold}${urlPrefix}${ANSI.reset}`);
    console.log(`        ${ANSI.dim}sddl${ANSI.reset} ${ANSI.gray}${sddl}${ANSI.reset}`);

    token++;
  }

  if (count === 0) {
    info('URL ACL reservations', `${ANSI.gray}(none registered)${ANSI.reset}`);
  } else {
    console.log(`\n  ${ANSI.dim}${count} reservation${count === 1 ? '' : 's'} found.${ANSI.reset}`);
  }
}

function enumerateIpListenList(): void {
  header('IP listen list (HTTP_SERVICE_CONFIG_IP_LISTEN_QUERY)');

  // No input struct for this query type. Output starts with DWORD AddrCount followed by SOCKADDR_STORAGE[]
  // SOCKADDR_STORAGE is 128 bytes on Windows.
  const SOCKADDR_STORAGE_SIZE = 128;

  // Sizing call: NULL output, NULL pInput. The driver reports required size via pReturnLength.
  const writtenBuf = Buffer.alloc(4);
  let status = Httpapi.HttpQueryServiceConfiguration(0n, HTTP_SERVICE_CONFIG_ID.HttpServiceConfigIPListenList, null, 0, null, 0, writtenBuf.ptr, null);

  if (status === ERROR_ACCESS_DENIED) {
    warn('access denied — try running as Administrator to read the IP listen list.');
    return;
  }
  if (status === ERROR_FILE_NOT_FOUND) {
    info('IP listen list', `${ANSI.gray}(empty — HTTP.sys listens on all interfaces)${ANSI.reset}`);
    return;
  }
  if (status !== ERROR_INSUFFICIENT_BUFFER && status !== ERROR_MORE_DATA && status !== 0) {
    warn(`HttpQueryServiceConfiguration sizing failed: ${describeError(status)}`);
    return;
  }

  const required = Math.max(4 + SOCKADDR_STORAGE_SIZE, writtenBuf.readUInt32LE(0));
  const outBuf = Buffer.alloc(required);
  status = Httpapi.HttpQueryServiceConfiguration(0n, HTTP_SERVICE_CONFIG_ID.HttpServiceConfigIPListenList, null, 0, outBuf.ptr, required, writtenBuf.ptr, null);

  if (status !== 0) {
    if (status === ERROR_FILE_NOT_FOUND) {
      info('IP listen list', `${ANSI.gray}(empty — HTTP.sys listens on all interfaces)${ANSI.reset}`);
      return;
    }
    warn(`HttpQueryServiceConfiguration failed: ${describeError(status)}`);
    return;
  }

  const addrCount = outBuf.readUInt32LE(0);
  if (addrCount === 0) {
    info('IP listen list', `${ANSI.gray}(empty — HTTP.sys listens on all interfaces)${ANSI.reset}`);
    return;
  }

  // Skip 4 bytes count + 4 padding (struct alignment), then SOCKADDR_STORAGE entries
  let cursor = 8;
  for (let i = 0; i < addrCount; i++) {
    const addr = decodeSockAddrStorage(outBuf, cursor);
    console.log(`  ${ANSI.bold}${ANSI.cyan}[${i + 1}]${ANSI.reset} ${ANSI.bold}${addr}${ANSI.reset}`);
    cursor += SOCKADDR_STORAGE_SIZE;
  }
  console.log(`\n  ${ANSI.dim}${addrCount} explicit listen address${addrCount === 1 ? '' : 'es'}.${ANSI.reset}`);
}

function probeSessionAndQueue(): void {
  header('Transient session + URL group + queue (local probe)');

  const sessionIdBuf = Buffer.alloc(8);
  const sessionStatus = Httpapi.HttpCreateServerSession(HTTPAPI_VERSION_2, sessionIdBuf.ptr, 0);
  if (sessionStatus !== 0) {
    bad('HttpCreateServerSession', describeError(sessionStatus));
    return;
  }
  const sessionId = sessionIdBuf.readBigUInt64LE(0);
  ok('HttpCreateServerSession', `id=0x${sessionId.toString(16)}`);

  const urlGroupIdBuf = Buffer.alloc(8);
  const groupStatus = Httpapi.HttpCreateUrlGroup(sessionId, urlGroupIdBuf.ptr, 0);
  if (groupStatus !== 0) {
    bad('HttpCreateUrlGroup', describeError(groupStatus));
  } else {
    const urlGroupId = urlGroupIdBuf.readBigUInt64LE(0);
    ok('HttpCreateUrlGroup', `id=0x${urlGroupId.toString(16)}`);

    // Query URL group state: HTTP_STATE_INFO { Flags:DWORD(0..3) + pad + State:DWORD(8..11) }
    // HTTP_STATE_INFO is actually { HTTP_PROPERTY_FLAGS Flags; HTTP_ENABLED_STATE State; } = 8 bytes
    const stateBuf = Buffer.alloc(8);
    const returnedBuf = Buffer.alloc(4);
    const stateStatus = Httpapi.HttpQueryUrlGroupProperty(urlGroupId, HTTP_SERVER_PROPERTY.HttpServerStateProperty, stateBuf.ptr, 8, returnedBuf.ptr);
    if (stateStatus === 0) {
      const flags = stateBuf.readUInt32LE(0);
      const state = stateBuf.readInt32LE(4);
      const stateName = state === HTTP_ENABLED_STATE.HttpEnabledStateActive ? 'Active' : 'Inactive';
      ok('URL group state', `${stateName} ${ANSI.dim}(flags=0x${flags.toString(16)})${ANSI.reset}`);
    } else {
      info('URL group state', describeError(stateStatus));
    }

    Httpapi.HttpCloseUrlGroup(urlGroupId);
  }

  const queueHandleBuf = Buffer.alloc(8);
  const queueStatus = Httpapi.HttpCreateRequestQueue(HTTPAPI_VERSION_2, null, null, 0, queueHandleBuf.ptr);
  if (queueStatus !== 0) {
    bad('HttpCreateRequestQueue', describeError(queueStatus));
  } else {
    const queueHandle = queueHandleBuf.readBigUInt64LE(0);
    ok('HttpCreateRequestQueue', `handle=0x${queueHandle.toString(16)}`);

    // Query 503 verbosity (4 bytes ULONG)
    const verbBuf = Buffer.alloc(4);
    const verbReturnedBuf = Buffer.alloc(4);
    const verbStatus = Httpapi.HttpQueryRequestQueueProperty(queueHandle, HTTP_SERVER_PROPERTY.HttpServer503VerbosityProperty, verbBuf.ptr, 4, 0, verbReturnedBuf.ptr, null);
    if (verbStatus === 0) {
      const v = verbBuf.readUInt32LE(0);
      const label =
        v === HTTP_503_RESPONSE_VERBOSITY.Http503ResponseVerbosityBasic
          ? 'Basic'
          : v === HTTP_503_RESPONSE_VERBOSITY.Http503ResponseVerbosityLimited
            ? 'Limited'
            : v === HTTP_503_RESPONSE_VERBOSITY.Http503ResponseVerbosityFull
              ? 'Full'
              : `unknown(${v})`;
      ok('503 response verbosity', label);
    } else {
      info('503 response verbosity', describeError(verbStatus));
    }

    Httpapi.HttpCloseRequestQueue(queueHandle);
  }

  // HTTP_TIMEOUT_LIMIT_INFO: 8 USHORT timers (16 bytes) + HTTP_PROPERTY_FLAGS (4) + padding = 24 bytes
  // Layout: Flags:DWORD(0..3) + EntityBody:USHORT(4..5) + DrainEntityBody:USHORT(6..7) +
  //         RequestQueue:USHORT(8..9) + IdleConnection:USHORT(10..11) + HeaderWait:USHORT(12..13) +
  //         MinSendRate:DWORD(16..19, after 2-byte pad)
  const TIMEOUT_SIZE = 32;
  const timeoutBuf = Buffer.alloc(TIMEOUT_SIZE);
  const timeoutReturnedBuf = Buffer.alloc(4);
  const timeoutStatus = Httpapi.HttpQueryServerSessionProperty(sessionId, HTTP_SERVER_PROPERTY.HttpServerTimeoutsProperty, timeoutBuf.ptr, TIMEOUT_SIZE, timeoutReturnedBuf.ptr);
  if (timeoutStatus === 0) {
    const flags = timeoutBuf.readUInt32LE(0);
    const entityBody = timeoutBuf.readUInt16LE(4);
    const drainEntityBody = timeoutBuf.readUInt16LE(6);
    const requestQueue = timeoutBuf.readUInt16LE(8);
    const idleConnection = timeoutBuf.readUInt16LE(10);
    const headerWait = timeoutBuf.readUInt16LE(12);
    const minSendRate = timeoutBuf.readUInt32LE(16);
    const fmt = (s: number) => (s === 0 ? `${ANSI.gray}default${ANSI.reset}` : `${s}s`);
    ok('HttpQueryServerSessionProperty', `flags=0x${flags.toString(16)}`);
    info('  EntityBody timeout', fmt(entityBody));
    info('  DrainEntityBody timeout', fmt(drainEntityBody));
    info('  RequestQueue timeout', fmt(requestQueue));
    info('  IdleConnection timeout', fmt(idleConnection));
    info('  HeaderWait timeout', fmt(headerWait));
    info('  MinSendRate', `${minSendRate} B/s`);
  } else {
    info('Session timeouts', describeError(timeoutStatus));
  }

  Httpapi.HttpCloseServerSession(sessionId);
  ok('HttpCloseServerSession', 'closed');
}

console.log(`${ANSI.bold}${ANSI.magenta}HTTP Server API — Service Audit${ANSI.reset}`);
console.log(`${ANSI.dim}Powered by @bun-win32/httpapi (HTTP.sys kernel driver, user-mode FFI)${ANSI.reset}`);

// HTTP_INITIALIZE_CONFIG is required for HttpQueryServiceConfiguration; HTTP_INITIALIZE_SERVER is required
// for HttpCreate*/HttpQuery*Property. Initialize both so feature probes and per-scope properties work.
const INIT_FLAGS = HTTP_INITIALIZE_FLAG.HTTP_INITIALIZE_CONFIG | HTTP_INITIALIZE_FLAG.HTTP_INITIALIZE_SERVER;
const globalInit = Httpapi.HttpInitialize(HTTPAPI_VERSION_2, INIT_FLAGS, null);
if (globalInit !== 0) {
  console.error(`${ANSI.red}HttpInitialize failed: ${describeError(globalInit)}${ANSI.reset}`);
  process.exit(1);
}

probeFeatures();
enumerateUrlAclReservations();
enumerateIpListenList();
probeSessionAndQueue();

Httpapi.HttpTerminate(INIT_FLAGS, null);

console.log(`\n${ANSI.bold}${ANSI.green}Audit complete.${ANSI.reset}\n`);
