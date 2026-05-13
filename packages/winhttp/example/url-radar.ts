/**
 * URL Radar
 *
 * Live, multi-target HTTP health dashboard built on the synchronous WinHTTP
 * stack. Each tick of the loop hits every target with a real GET request and
 * captures: HTTP status code, total response time, TLS session key bitness,
 * and the negotiated HTTP version (HTTP/1.1 vs HTTP/2 vs HTTP/3). A rolling
 * sparkline shows each target's recent latency history at a glance, so a
 * developer can watch a backend warm up, see a CDN edge flap, or detect that
 * one host is silently slower than the rest — all from the same Windows
 * HTTP client the OS itself uses.
 *
 * This goes beyond what fetch surfaces: WinHTTP exposes session-level TLS
 * strength and protocol selection via WinHttpQueryOption, so the radar can
 * tell you that two endpoints both returned 200 OK but only one negotiated
 * HTTP/2 with 256-bit AES.
 *
 * APIs demonstrated:
 *   - WinHttpOpen                 (one shared session)
 *   - WinHttpSetTimeouts          (per-phase timeouts so a hung host can't stall the radar)
 *   - WinHttpConnect              (per-target connection handle)
 *   - WinHttpOpenRequest          (HEAD-like GET against each target)
 *   - WinHttpSendRequest          (issue requests)
 *   - WinHttpReceiveResponse      (drain response headers)
 *   - WinHttpQueryHeaders         (status code via WINHTTP_QUERY_STATUS_CODE | NUMBER)
 *   - WinHttpQueryOption          (HTTP_PROTOCOL_USED, SECURITY_KEY_BITNESS)
 *   - WinHttpCloseHandle          (cleanup all handles)
 *
 * Run: bun run example/url-radar.ts [--ticks=<n>] [--interval-ms=<n>] [url ...]
 */

import Winhttp, { WinHttpAccessType, WinHttpFlag, WinHttpOption, WinHttpQuery, WinHttpQueryFlag } from '../index';

Winhttp.Preload(['WinHttpCloseHandle', 'WinHttpConnect', 'WinHttpOpen', 'WinHttpOpenRequest', 'WinHttpQueryHeaders', 'WinHttpQueryOption', 'WinHttpReceiveResponse', 'WinHttpSendRequest', 'WinHttpSetTimeouts']);

const ANSI = {
  bold: '\x1b[1m',
  cursorHome: '\x1b[H',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  magenta: '\x1b[35m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
  screenClear: '\x1b[2J',
  yellow: '\x1b[33m',
} as const;

interface ParsedTarget {
  host: string;
  isSecure: boolean;
  label: string;
  path: string;
  port: number;
}

interface SampleResult {
  durationMs: number;
  ok: boolean;
  protocolName: string;
  status: number;
  tlsKeyBits: number;
}

interface TargetState {
  history: number[];
  lastResult: SampleResult | null;
  okSamples: number;
  parsed: ParsedTarget;
  totalSamples: number;
}

function parseNumberOption(name: string, defaultValue: number): number {
  const prefix = `--${name}=`;

  for (const argument of Bun.argv.slice(2)) {
    if (!argument.startsWith(prefix)) continue;
    const parsed = Number(argument.slice(prefix.length));
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }

  return defaultValue;
}

function parseTarget(raw: string): ParsedTarget {
  const url = new URL(raw);
  const isSecure = url.protocol === 'https:';
  const port = url.port ? Number(url.port) : isSecure ? 443 : 80;
  const path = `${url.pathname}${url.search}` || '/';

  return { host: url.hostname, isSecure, label: url.host, path, port };
}

function utf16leBuffer(value: string): Buffer {
  return Buffer.from(`${value}\0`, 'utf16le');
}

const totalTicks = parseNumberOption('ticks', 30);
const intervalMs = parseNumberOption('interval-ms', 1500);
const rawTargets = Bun.argv.slice(2).filter((argument) => !argument.startsWith('--'));
const targets = (rawTargets.length > 0 ? rawTargets : ['https://learn.microsoft.com/', 'https://github.com/', 'https://www.cloudflare.com/', 'https://www.google.com/', 'https://www.bing.com/']).map(parseTarget);

const agent = utf16leBuffer('bun-win32-url-radar/1.0');
const hSession = Winhttp.WinHttpOpen(agent.ptr, WinHttpAccessType.AUTOMATIC_PROXY, null, null, 0);
if (hSession === 0n) {
  console.error('WinHttpOpen failed');
  process.exit(1);
}

Winhttp.WinHttpSetTimeouts(hSession, 3_000, 3_000, 5_000, 5_000);

const states: TargetState[] = targets.map((parsed) => ({ history: [], lastResult: null, okSamples: 0, parsed, totalSamples: 0 }));

function probeOnce(target: ParsedTarget): SampleResult {
  const start = performance.now();
  let hConnect = 0n;
  let hRequest = 0n;

  try {
    const hostBuf = utf16leBuffer(target.host);
    hConnect = Winhttp.WinHttpConnect(hSession, hostBuf.ptr, target.port, 0);
    if (hConnect === 0n) {
      return { durationMs: performance.now() - start, ok: false, protocolName: '—', status: 0, tlsKeyBits: 0 };
    }

    const verbBuf = utf16leBuffer('GET');
    const pathBuf = utf16leBuffer(target.path);
    hRequest = Winhttp.WinHttpOpenRequest(hConnect, verbBuf.ptr, pathBuf.ptr, null, null, null, target.isSecure ? WinHttpFlag.SECURE : 0);
    if (hRequest === 0n) {
      return { durationMs: performance.now() - start, ok: false, protocolName: '—', status: 0, tlsKeyBits: 0 };
    }

    if (Winhttp.WinHttpSendRequest(hRequest, null, 0, null, 0, 0, 0n) === 0) {
      return { durationMs: performance.now() - start, ok: false, protocolName: '—', status: 0, tlsKeyBits: 0 };
    }

    if (Winhttp.WinHttpReceiveResponse(hRequest, null) === 0) {
      return { durationMs: performance.now() - start, ok: false, protocolName: '—', status: 0, tlsKeyBits: 0 };
    }

    const statusBuf = Buffer.alloc(4);
    const statusLenBuf = Buffer.alloc(4);
    statusLenBuf.writeUInt32LE(4, 0);
    Winhttp.WinHttpQueryHeaders(hRequest, WinHttpQuery.STATUS_CODE | WinHttpQueryFlag.NUMBER, null, statusBuf.ptr, statusLenBuf.ptr, null);

    const protoBuf = Buffer.alloc(8);
    const protoLenBuf = Buffer.alloc(4);
    protoLenBuf.writeUInt32LE(8, 0);
    const protoQueried = Winhttp.WinHttpQueryOption(hRequest, WinHttpOption.HTTP_PROTOCOL_USED, protoBuf.ptr, protoLenBuf.ptr);
    const protoBits = protoQueried !== 0 ? protoBuf.readUInt32LE(0) : 0;
    const protocolName = protoBits & 0x2 ? 'h3' : protoBits & 0x1 ? 'h2' : '1.1';

    let tlsKeyBits = 0;
    if (target.isSecure) {
      const tlsBuf = Buffer.alloc(4);
      const tlsLenBuf = Buffer.alloc(4);
      tlsLenBuf.writeUInt32LE(4, 0);
      if (Winhttp.WinHttpQueryOption(hRequest, WinHttpOption.SECURITY_KEY_BITNESS, tlsBuf.ptr, tlsLenBuf.ptr) !== 0) {
        tlsKeyBits = tlsBuf.readUInt32LE(0);
      }
    }

    return { durationMs: performance.now() - start, ok: true, protocolName, status: statusBuf.readUInt32LE(0), tlsKeyBits };
  } finally {
    if (hRequest !== 0n) Winhttp.WinHttpCloseHandle(hRequest);
    if (hConnect !== 0n) Winhttp.WinHttpCloseHandle(hConnect);
  }
}

const SPARK_GLYPHS = '▁▂▃▄▅▆▇█';
const SPARK_WIDTH = 20;

function renderSparkline(history: number[]): string {
  if (history.length === 0) return ANSI.dim + '·'.repeat(SPARK_WIDTH) + ANSI.reset;
  const slice = history.slice(-SPARK_WIDTH);
  const padded = slice.length < SPARK_WIDTH ? new Array(SPARK_WIDTH - slice.length).fill(NaN).concat(slice) : slice;
  const numeric = padded.filter((value) => Number.isFinite(value));
  const maxValue = numeric.length === 0 ? 1 : Math.max(...numeric);
  const minValue = numeric.length === 0 ? 0 : Math.min(...numeric);
  const range = Math.max(1, maxValue - minValue);

  return padded
    .map((value) => {
      if (!Number.isFinite(value)) return `${ANSI.dim}·${ANSI.reset}`;
      const normalized = (value - minValue) / range;
      const glyphIndex = Math.min(SPARK_GLYPHS.length - 1, Math.max(0, Math.floor(normalized * SPARK_GLYPHS.length)));
      const color = value > 1500 ? ANSI.red : value > 500 ? ANSI.yellow : ANSI.green;
      return `${color}${SPARK_GLYPHS[glyphIndex]}${ANSI.reset}`;
    })
    .join('');
}

function colorStatus(status: number): string {
  if (status === 0) return `${ANSI.red}ERR${ANSI.reset}`;
  if (status >= 500) return `${ANSI.red}${status}${ANSI.reset}`;
  if (status >= 400) return `${ANSI.yellow}${status}${ANSI.reset}`;
  if (status >= 300) return `${ANSI.magenta}${status}${ANSI.reset}`;
  return `${ANSI.green}${status}${ANSI.reset}`;
}

function render(elapsedMs: number, tickIndex: number): string {
  const widestLabel = states.reduce((max, state) => Math.max(max, state.parsed.label.length), 6);
  const header = `${ANSI.bold}${ANSI.cyan}URL Radar${ANSI.reset}  ${ANSI.dim}tick ${tickIndex}/${totalTicks}  ${(elapsedMs / 1000).toFixed(1)}s elapsed${ANSI.reset}`;
  const columnHeader = `  ${ANSI.dim}${'host'.padEnd(widestLabel)}  status  proto    tls   latency  uptime  history${ANSI.reset}`;
  const lines: string[] = [header, '', columnHeader];

  for (const state of states) {
    const last = state.lastResult;
    const uptime = state.totalSamples > 0 ? `${((state.okSamples / state.totalSamples) * 100).toFixed(0).padStart(3)}%` : ' --%';
    const statusText = last ? colorStatus(last.status) : `${ANSI.dim}---${ANSI.reset}`;
    const protocol = last && last.ok ? last.protocolName.padEnd(4) : '—   ';
    const tls = last && last.ok && last.tlsKeyBits > 0 ? `${last.tlsKeyBits}b`.padStart(4) : ' — ';
    const latency = last ? `${last.durationMs.toFixed(0).padStart(5)}ms` : '    —';
    const sparkline = renderSparkline(state.history);

    lines.push(`  ${ANSI.bold}${state.parsed.label.padEnd(widestLabel)}${ANSI.reset}  ${statusText.padEnd(15)}  ${protocol}  ${tls}  ${latency}   ${uptime}  ${sparkline}`);
  }

  lines.push('');
  lines.push(`  ${ANSI.dim}Press Ctrl+C to stop early. Sparkline: 20 most-recent ticks, green<500ms · yellow<1500ms · red≥1500ms.${ANSI.reset}`);

  return lines.join('\n');
}

let stopRequested = false;
process.on('SIGINT', () => {
  stopRequested = true;
});

const startedAt = performance.now();
process.stdout.write(ANSI.screenClear + ANSI.cursorHome);

for (let tickIndex = 1; tickIndex <= totalTicks; tickIndex += 1) {
  if (stopRequested) break;

  for (const state of states) {
    const result = probeOnce(state.parsed);
    state.lastResult = result;
    state.totalSamples += 1;
    if (result.ok && result.status >= 200 && result.status < 400) state.okSamples += 1;
    state.history.push(result.durationMs);
    if (state.history.length > 200) state.history.shift();
  }

  process.stdout.write(ANSI.cursorHome + render(performance.now() - startedAt, tickIndex) + '\n');

  if (tickIndex < totalTicks && !stopRequested) {
    await Bun.sleep(intervalMs);
  }
}

Winhttp.WinHttpCloseHandle(hSession);

process.stdout.write('\n');
console.log(`${ANSI.bold}Final report${ANSI.reset}`);

for (const state of states) {
  const uptime = state.totalSamples > 0 ? ((state.okSamples / state.totalSamples) * 100).toFixed(1) : '—';
  const numeric = state.history.filter(Number.isFinite);
  const avg = numeric.length > 0 ? (numeric.reduce((sum, value) => sum + value, 0) / numeric.length).toFixed(1) : '—';
  const max = numeric.length > 0 ? Math.max(...numeric).toFixed(0) : '—';
  console.log(`  ${state.parsed.label.padEnd(28)} uptime ${uptime}%   avg ${avg}ms   peak ${max}ms   samples ${state.totalSamples}`);
}
