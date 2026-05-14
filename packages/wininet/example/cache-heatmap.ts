/**
 * URL Cache Heatmap
 *
 * A colorful, terminal-native portrait of the Windows WinINet/Internet Explorer
 * legacy URL cache — the persistent disk cache underneath IE, legacy Edge, and
 * any app that uses InternetOpenUrl/HttpOpenRequest. Enumerates every entry
 * with FindFirstUrlCacheEntryA + FindNextUrlCacheEntryA, then renders three
 * panels:
 *
 *   1. Category roll-up   — totals + size bars per CacheEntryType
 *                           (NORMAL, COOKIE, HISTORY, EDITED, STICKY, …).
 *   2. Top hosts          — host-by-host hit-rate, entry count and total bytes,
 *                           with a heat-bar that shades from blue (cool) to
 *                           red (heavily hit), sized by cache footprint.
 *   3. Recently touched   — newest 8 entries by LastAccessTime, age-formatted.
 *
 * The cache is filesystem-backed at %LOCALAPPDATA%\\Microsoft\\Windows\\INetCache,
 * shared across every WinINet client. Chromium-based Edge does not write to
 * it, so on a modern machine the entries you see are typically from Office,
 * Outlook classic, Windows Search, the Microsoft Store, or any legacy
 * `urlmon.dll`-driven download.
 *
 * APIs demonstrated:
 *   - FindFirstUrlCacheEntryA   (sizing-call to discover required buffer size,
 *                                then real call to fetch the first entry)
 *   - FindNextUrlCacheEntryA    (walk the rest of the cache; grow the buffer
 *                                on ERROR_INSUFFICIENT_BUFFER)
 *   - FindCloseUrlCache         (release the enumeration handle)
 *
 * Run: bun run example/cache-heatmap.ts
 */

import { CString } from 'bun:ffi';

import Wininet, { CacheEntryType } from '../index';

Wininet.Preload(['FindCloseUrlCache', 'FindFirstUrlCacheEntryA', 'FindNextUrlCacheEntryA']);

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

const HEAT_COLORS = ['\x1b[38;5;33m', '\x1b[38;5;39m', '\x1b[38;5;45m', '\x1b[38;5;51m', '\x1b[38;5;87m', '\x1b[38;5;123m', '\x1b[38;5;227m', '\x1b[38;5;220m', '\x1b[38;5;208m', '\x1b[38;5;202m', '\x1b[38;5;196m'];
const SIZE_GLYPHS = '▁▂▃▄▅▆▇█';

const ERROR_NO_MORE_ITEMS = 259;
const ERROR_INSUFFICIENT_BUFFER = 122;

// INTERNET_CACHE_ENTRY_INFOA layout (x64) — see wininet.h.
const FIELD_dwStructSize = 0;
const FIELD_lpszSourceUrlName = 8;
const FIELD_lpszLocalFileName = 16;
const FIELD_CacheEntryType = 24;
const FIELD_dwUseCount = 28;
const FIELD_dwHitRate = 32;
const FIELD_dwSizeLow = 36;
const FIELD_dwSizeHigh = 40;
const FIELD_LastModifiedTime = 44;
const FIELD_ExpireTime = 52;
const FIELD_LastAccessTime = 60;
const FIELD_LastSyncTime = 68;

const FILETIME_EPOCH_DIFF_MS = 11644473600000n;

interface CacheEntry {
  cacheType: number;
  hitRate: number;
  host: string;
  lastAccessMs: number;
  sizeBytes: number;
  url: string;
  useCount: number;
}

function readCString(ptr: bigint | number): string {
  if (typeof ptr === 'bigint' && ptr === 0n) return '';
  if (typeof ptr === 'number' && ptr === 0) return '';
  try {
    return new CString(Number(ptr) as never).toString();
  } catch {
    return '';
  }
}

function filetimeToMs(buf: Buffer, offset: number): number {
  const lo = BigInt(buf.readUInt32LE(offset));
  const hi = BigInt(buf.readUInt32LE(offset + 4));
  const ft = (hi << 32n) | lo;
  if (ft === 0n) return 0;
  return Number(ft / 10_000n - FILETIME_EPOCH_DIFF_MS);
}

function parseEntry(buf: Buffer): CacheEntry {
  const urlPtr = buf.readBigUInt64LE(FIELD_lpszSourceUrlName);
  const url = readCString(urlPtr);
  let host = '(unknown)';
  try {
    const u = new URL(url);
    host = u.hostname || '(local)';
  } catch {
    const m = url.match(/^[a-z]+:\/\/([^\/?:]+)/i);
    host = m ? m[1]! : '(local)';
  }
  return {
    cacheType: buf.readUInt32LE(FIELD_CacheEntryType),
    hitRate: buf.readUInt32LE(FIELD_dwHitRate),
    host,
    lastAccessMs: filetimeToMs(buf, FIELD_LastAccessTime),
    sizeBytes: buf.readUInt32LE(FIELD_dwSizeLow) + buf.readUInt32LE(FIELD_dwSizeHigh) * 0x1_0000_0000,
    url,
    useCount: buf.readUInt32LE(FIELD_dwUseCount),
  };
}

function enumerateCache(): CacheEntry[] {
  const entries: CacheEntry[] = [];

  // Sizing-call: ask WinINet how large the entry buffer needs to be.
  const sizeBuf = Buffer.alloc(4);
  sizeBuf.writeUInt32LE(0, 0);
  Wininet.FindFirstUrlCacheEntryA(null, null, sizeBuf.ptr!);
  let bufferSize = sizeBuf.readUInt32LE(0);
  if (bufferSize < 256) bufferSize = 4096;

  let entryBuf = Buffer.alloc(bufferSize);
  sizeBuf.writeUInt32LE(bufferSize, 0);
  let hFind = Wininet.FindFirstUrlCacheEntryA(null, entryBuf.ptr!, sizeBuf.ptr!);
  if (hFind === 0n) {
    return entries;
  }

  entries.push(parseEntry(entryBuf));

  while (true) {
    sizeBuf.writeUInt32LE(entryBuf.length, 0);
    const ok = Wininet.FindNextUrlCacheEntryA(hFind, entryBuf.ptr!, sizeBuf.ptr!);
    if (ok) {
      entries.push(parseEntry(entryBuf));
      continue;
    }
    const required = sizeBuf.readUInt32LE(0);
    // ERROR_NO_MORE_ITEMS — done.
    if (required === 0 || required <= entryBuf.length) break;
    // ERROR_INSUFFICIENT_BUFFER — grow and retry.
    bufferSize = required + 64;
    entryBuf = Buffer.alloc(bufferSize);
    sizeBuf.writeUInt32LE(bufferSize, 0);
    const retryOk = Wininet.FindNextUrlCacheEntryA(hFind, entryBuf.ptr!, sizeBuf.ptr!);
    if (!retryOk) break;
    entries.push(parseEntry(entryBuf));
  }

  Wininet.FindCloseUrlCache(hFind);
  return entries;
}

function formatBytes(value: number): string {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KiB`;
  if (value < 1024 * 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(2)} MiB`;
  return `${(value / (1024 * 1024 * 1024)).toFixed(2)} GiB`;
}

function describeCacheType(type: number): string {
  const flags: string[] = [];
  if (type & CacheEntryType.COOKIE) flags.push('COOKIE');
  if (type & CacheEntryType.EDITED) flags.push('EDITED');
  if (type & CacheEntryType.HISTORY) flags.push('HISTORY');
  if (type & CacheEntryType.SPARSE) flags.push('SPARSE');
  if (type & CacheEntryType.STABLE) flags.push('STABLE');
  if (type & CacheEntryType.STICKY) flags.push('STICKY');
  if (type & CacheEntryType.TRACK_OFFLINE) flags.push('TRK-OFF');
  if (type & CacheEntryType.TRACK_ONLINE) flags.push('TRK-ON');
  if (type & CacheEntryType.NORMAL) flags.push('NORMAL');
  if (flags.length === 0) flags.push(`OTHER(0x${type.toString(16)})`);
  return flags.join('+');
}

function rollupByType(entries: CacheEntry[]): Array<{ category: string; count: number; bytes: number; color: string }> {
  const buckets = new Map<string, { count: number; bytes: number }>();
  for (const e of entries) {
    const k = describeCacheType(e.cacheType);
    const cur = buckets.get(k) ?? { count: 0, bytes: 0 };
    cur.count += 1;
    cur.bytes += e.sizeBytes;
    buckets.set(k, cur);
  }
  const palette = [ANSI.green, ANSI.cyan, ANSI.magenta, ANSI.yellow, ANSI.red, '\x1b[38;5;208m', '\x1b[38;5;105m', '\x1b[38;5;141m'];
  return [...buckets.entries()].sort((a, b) => b[1].bytes - a[1].bytes).map(([category, info], index) => ({ bytes: info.bytes, category, color: palette[index % palette.length]!, count: info.count }));
}

function rollupByHost(entries: CacheEntry[]): Array<{ host: string; count: number; bytes: number; hits: number; lastAccessMs: number }> {
  const buckets = new Map<string, { count: number; bytes: number; hits: number; lastAccessMs: number }>();
  for (const e of entries) {
    const cur = buckets.get(e.host) ?? { count: 0, bytes: 0, hits: 0, lastAccessMs: 0 };
    cur.count += 1;
    cur.bytes += e.sizeBytes;
    cur.hits += e.hitRate;
    cur.lastAccessMs = Math.max(cur.lastAccessMs, e.lastAccessMs);
    buckets.set(e.host, cur);
  }
  return [...buckets.entries()].map(([host, info]) => ({ host, ...info })).sort((a, b) => b.bytes - a.bytes);
}

function bar(filledOf: number, total: number, width: number, color: string): string {
  const fraction = total === 0 ? 0 : Math.min(1, filledOf / total);
  const filled = Math.round(fraction * width);
  return `${color}${'█'.repeat(filled)}${ANSI.dim}${'░'.repeat(Math.max(0, width - filled))}${ANSI.reset}`;
}

function heatBar(weight: number, max: number, width: number): string {
  const fraction = max === 0 ? 0 : Math.min(1, weight / max);
  const filled = Math.max(1, Math.round(fraction * width));
  const colorIdx = Math.min(HEAT_COLORS.length - 1, Math.floor(fraction * HEAT_COLORS.length));
  return `${HEAT_COLORS[colorIdx]}${SIZE_GLYPHS[Math.min(SIZE_GLYPHS.length - 1, Math.floor(fraction * SIZE_GLYPHS.length))]!.repeat(filled)}${ANSI.dim}${'·'.repeat(Math.max(0, width - filled))}${ANSI.reset}`;
}

function relativeAge(ms: number): string {
  if (ms === 0) return ANSI.dim + 'never' + ANSI.reset;
  const ageMs = Date.now() - ms;
  if (ageMs < 0) return 'future';
  const seconds = ageMs / 1000;
  if (seconds < 60) return `${seconds.toFixed(0)}s ago`;
  const minutes = seconds / 60;
  if (minutes < 60) return `${minutes.toFixed(0)}m ago`;
  const hours = minutes / 60;
  if (hours < 24) return `${hours.toFixed(1)}h ago`;
  const days = hours / 24;
  if (days < 365) return `${days.toFixed(1)}d ago`;
  return `${(days / 365).toFixed(1)}y ago`;
}

function truncate(str: string, max: number): string {
  return str.length <= max ? str : `${str.slice(0, max - 1)}…`;
}

const startedAt = performance.now();
const entries = enumerateCache();
const enumerateElapsedMs = performance.now() - startedAt;
const totalBytes = entries.reduce((sum, e) => sum + e.sizeBytes, 0);

console.log(`${ANSI.bold}${ANSI.cyan}URL Cache Heatmap${ANSI.reset}`);
console.log(`  ${ANSI.dim}enumerated ${entries.length.toLocaleString()} entries · ${formatBytes(totalBytes)} on disk · ${enumerateElapsedMs.toFixed(0)}ms${ANSI.reset}`);
console.log('');

if (entries.length === 0) {
  console.log(`  ${ANSI.yellow}The WinINet legacy URL cache is empty on this machine.${ANSI.reset}`);
  console.log(`  ${ANSI.dim}Modern Edge/Chromium uses its own cache and never writes to the WinINet one.${ANSI.reset}`);
  console.log(`  ${ANSI.dim}Open Internet Explorer / classic Outlook / Office, fetch a page, then re-run.${ANSI.reset}`);
  process.exit(0);
}

const typeRoll = rollupByType(entries);
const hostRoll = rollupByHost(entries);

console.log(`${ANSI.bold}Categories${ANSI.reset}`);
const maxTypeBytes = typeRoll.reduce((max, t) => Math.max(max, t.bytes), 1);
const maxCategoryLabel = typeRoll.reduce((max, t) => Math.max(max, t.category.length), 0);
for (const t of typeRoll) {
  const pct = totalBytes === 0 ? '0' : ((t.bytes / totalBytes) * 100).toFixed(1);
  console.log(`  ${t.color}${t.category.padEnd(maxCategoryLabel)}${ANSI.reset}  ${t.count.toString().padStart(6)} entries  ${formatBytes(t.bytes).padStart(11)}  ${pct.padStart(5)}%  ${bar(t.bytes, maxTypeBytes, 30, t.color)}`);
}
console.log('');

const topHosts = hostRoll.slice(0, 20);
console.log(`${ANSI.bold}Top hosts by cache footprint${ANSI.reset}  ${ANSI.dim}(showing ${topHosts.length} of ${hostRoll.length})${ANSI.reset}`);
const maxHostBytes = topHosts.reduce((max, h) => Math.max(max, h.bytes), 1);
const maxHostHits = topHosts.reduce((max, h) => Math.max(max, h.hits), 1);
const maxHostLabel = topHosts.reduce((max, h) => Math.max(max, h.host.length), 0);
const hostLabelWidth = Math.min(40, maxHostLabel);
for (const h of topHosts) {
  const sizeBar = bar(h.bytes, maxHostBytes, 18, ANSI.cyan);
  const heat = heatBar(h.hits, maxHostHits, 14);
  console.log(
    `  ${ANSI.bold}${truncate(h.host, hostLabelWidth).padEnd(hostLabelWidth)}${ANSI.reset}  ${h.count.toString().padStart(5)}  ${formatBytes(h.bytes).padStart(11)}  ${sizeBar}  ${h.hits.toString().padStart(6)} hits  ${heat}  ${relativeAge(h.lastAccessMs).padStart(8)}`,
  );
}
console.log('');

const recent = [...entries].sort((a, b) => b.lastAccessMs - a.lastAccessMs).slice(0, 8);
console.log(`${ANSI.bold}Recently touched${ANSI.reset}`);
for (const e of recent) {
  const type = describeCacheType(e.cacheType);
  const typeColor = e.cacheType & CacheEntryType.COOKIE ? ANSI.magenta : e.cacheType & CacheEntryType.HISTORY ? ANSI.yellow : ANSI.cyan;
  console.log(`  ${typeColor}${type.padEnd(14)}${ANSI.reset}  ${formatBytes(e.sizeBytes).padStart(10)}  ${relativeAge(e.lastAccessMs).padStart(8)}  ${ANSI.dim}${truncate(e.url, 110)}${ANSI.reset}`);
}
