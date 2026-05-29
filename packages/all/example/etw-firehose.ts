/**
 * ETW Firehose — a live, real-time X-ray of everything the OS is doing (Procmon-lite).
 *
 * Opens a real **real-time** Event Tracing for Windows logger session, subscribes to
 * the Microsoft-Windows-Kernel-Process provider, and renders a live, color-coded feed
 * of OS activity decoded straight from raw binary EVENT_RECORDs — every process that
 * starts or exits, every image that loads — with a live histogram beneath the stream.
 * advapi32 drives the kernel logger session; tdh.dll turns each opaque event blob into a
 * named, human-readable record. No PerfView, no xperf, no native addon — just Bun FFI.
 *
 * Real-time ETW sessions require an elevated process (same as logman / xperf / PerfView).
 * If this process is NOT elevated, StartTraceW/EnableTraceEx2 return ERROR_ACCESS_DENIED;
 * instead of crashing, the program falls back to a **wevtapi PULL consumer** that needs no
 * admin: EvtQuery on a live channel + EvtNext + EvtRender(EvtRenderEventXml), polled on a
 * timer, tailing newly-written records by EventRecordID for a near-real-time decoded feed.
 * Either way you get a streaming, decoded event feed — the headline thing you "cannot do
 * in TypeScript."
 *
 * Real-time pipeline (advapi32 + tdh):
 *   StartTraceW  -> create the real-time logger session (EVENT_TRACE_REAL_TIME_MODE)
 *   EnableTraceEx2 -> attach Microsoft-Windows-Kernel-Process at verbose level
 *   OpenTraceW   -> open the live stream + install BufferCallback + EventRecordCallback
 *   ProcessTrace -> BLOCKS, pumping callbacks on the calling (Bun VM) thread
 *   TdhGetEventInformation (two-call) -> provider/task/opcode names per EVENT_RECORD
 *   CloseTrace / ControlTraceW(STOP)  -> tear the session down
 *
 * Fallback pipeline (wevtapi, no admin):
 *   EvtQuery (reverse) -> latest EventRecordID; then forward XPath EventRecordID > N tail
 *   EvtNext + EvtRender(EvtRenderEventXml) -> decoded XML per record, parsed for the feed
 *
 * APIs (Tdh): TdhEnumerateProviders, TdhGetEventInformation
 * APIs (Advapi32): StartTraceW, EnableTraceEx2, OpenTraceW, ProcessTrace, CloseTrace, ControlTraceW
 * APIs (Wevtapi): EvtQuery, EvtNext, EvtRender, EvtClose
 * APIs (Kernel32): GetStdHandle, GetConsoleMode, SetConsoleMode (enable ANSI VT)
 *
 * Honors DEMO_DURATION_MS (default 12000). ESC / Ctrl-C exit cleanly; all handles torn down.
 *
 * Run (elevated for real-time): bun run example/etw-firehose.ts
 * Run (no admin, fallback):     bun run example/etw-firehose.ts
 */
import { JSCallback, toArrayBuffer, type Pointer } from 'bun:ffi';

import { Advapi32, Kernel32, Tdh, Wevtapi } from '../index';
import { ConsoleMode, STD_HANDLE } from '@bun-win32/kernel32';
import { EvtQueryFlags, EvtRenderFlags } from '@bun-win32/wevtapi';

// ── Win32 status / flag constants ────────────────────────────────────────────
const ERROR_SUCCESS = 0;
const ERROR_ACCESS_DENIED = 5;
const ERROR_ALREADY_EXISTS = 183;
const ERROR_INSUFFICIENT_BUFFER = 122;

const WNODE_FLAG_TRACED_GUID = 0x0002_0000;
const EVENT_TRACE_REAL_TIME_MODE = 0x0000_0100;
const EVENT_CONTROL_CODE_ENABLE_PROVIDER = 1;
const EVENT_TRACE_CONTROL_STOP = 1;
const TRACE_LEVEL_VERBOSE = 5;
const PROCESS_TRACE_MODE_REAL_TIME = 0x0000_0100;
const PROCESS_TRACE_MODE_EVENT_RECORD = 0x1000_0000;
const INVALID_PROCESSTRACE_HANDLE = 0xffff_ffff_ffff_ffffn;

const SESSION_NAME = 'BunEtwFirehose';
const TARGET_PROVIDER = 'Microsoft-Windows-Kernel-Process';
// Busy, non-admin-readable channels for the pull fallback (Security is tried but may be denied).
const FALLBACK_CHANNELS = ['System', 'Application', 'Microsoft-Windows-PowerShell/Operational', 'Security'];
const RUN_MS = Number(process.env.DEMO_DURATION_MS ?? '12000');

// ── ANSI palette ─────────────────────────────────────────────────────────────
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const RED = '\x1b[91m';
const GREEN = '\x1b[92m';
const YELLOW = '\x1b[93m';
const BLUE = '\x1b[94m';
const MAGENTA = '\x1b[95m';
const CYAN = '\x1b[96m';
const GREY = '\x1b[90m';

// ── Enable ANSI escape processing ────────────────────────────────────────────
const hStdout = Kernel32.GetStdHandle(STD_HANDLE.OUTPUT);
const modeBuffer = Buffer.alloc(4);
if (Kernel32.GetConsoleMode(hStdout, modeBuffer.ptr)) {
  Kernel32.SetConsoleMode(hStdout, modeBuffer.readUInt32LE(0) | ConsoleMode.ENABLE_VIRTUAL_TERMINAL_PROCESSING);
}

// ── Shared render state ──────────────────────────────────────────────────────
const histogram = new Map<string, number>();
let eventTotal = 0;
let lastRender = 0;
const recent: string[] = [];
const deadline = Date.now() + RUN_MS;
let mode: 'real-time' | 'pull' = 'real-time';

function readWide(buffer: Buffer, byteOffset: number): string {
  if (byteOffset <= 0 || byteOffset >= buffer.length) return '';
  let result = '';
  for (let i = byteOffset; i + 1 < buffer.length; i += 2) {
    const code = buffer.readUInt16LE(i);
    if (code === 0) break;
    result += String.fromCharCode(code);
  }
  return result;
}

function colorForOpcode(opcode: number): string {
  if (opcode === 1) return GREEN; // Start
  if (opcode === 2) return RED; // Stop / End
  if (opcode === 3 || opcode === 4) return MAGENTA; // DC start/end
  return BLUE;
}

function banner(): void {
  console.log(`\n${BOLD}${CYAN}╔══════════════════════════════════════════════════════════════════════╗${RESET}`);
  console.log(`${BOLD}${CYAN}║                ETW Firehose  ·  live OS event X-ray                 ║${RESET}`);
  console.log(`${BOLD}${CYAN}╚══════════════════════════════════════════════════════════════════════╝${RESET}`);
}

function render(): void {
  const secsLeft = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
  const modeTag = mode === 'real-time' ? `${GREEN}real-time ETW${RESET}` : `${YELLOW}wevtapi pull (no admin)${RESET}`;
  const lines: string[] = [];
  lines.push(`${BOLD}${CYAN}● live${RESET}  ${DIM}via${RESET} ${modeTag}  ${DIM}events:${RESET} ${GREEN}${eventTotal}${RESET}  ${DIM}distinct:${RESET} ${YELLOW}${histogram.size}${RESET}  ${DIM}${secsLeft}s left${RESET}`);
  lines.push('');
  for (const line of recent.slice(-10)) lines.push(line);
  lines.push('');
  lines.push(`${BOLD}${GREY}── activity by event ──────────────────────────────────────────────${RESET}`);
  const top = [...histogram.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  const max = top.length ? top[0]![1] : 1;
  for (const [key, value] of top) {
    const width = Math.max(1, Math.round((value / max) * 34));
    const bar = '█'.repeat(width);
    lines.push(`  ${CYAN}${key.padEnd(40, ' ').slice(0, 40)}${RESET} ${BLUE}${bar}${RESET} ${DIM}${value}${RESET}`);
  }
  process.stdout.write('\x1b[H\x1b[2J' + lines.join('\n') + '\n');
}

function maybeRender(): void {
  const now = Date.now();
  if (now - lastRender > 250) {
    lastRender = now;
    render();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Path A — real-time ETW consumer (advapi32 + tdh). Requires elevation.
// ─────────────────────────────────────────────────────────────────────────────

/** Resolve a provider GUID by name via TDH (no hardcoded GUID); falls back to the well-known one. */
function resolveProviderGuid(name: string): Buffer {
  const KERNEL_PROCESS_GUID = Buffer.from([0xd6, 0x2c, 0xfb, 0x22, 0x7b, 0x0e, 0x2b, 0x42, 0xa0, 0xc7, 0x2f, 0xad, 0x1f, 0xd0, 0xe7, 0x16]);
  const size = Buffer.alloc(4);
  if (Tdh.TdhEnumerateProviders(null, size.ptr) !== ERROR_INSUFFICIENT_BUFFER) return KERNEL_PROCESS_GUID;
  const buffer = Buffer.alloc(size.readUInt32LE(0));
  if (Tdh.TdhEnumerateProviders(buffer.ptr, size.ptr) !== ERROR_SUCCESS) return KERNEL_PROCESS_GUID;

  const count = buffer.readUInt32LE(0);
  for (let i = 0; i < count; i++) {
    const base = 8 + i * 24;
    const nameOffset = buffer.readUInt32LE(base + 20);
    if (readWide(buffer, nameOffset) === name) {
      return Buffer.from(buffer.subarray(base, base + 16)); // 16-byte GUID copy
    }
  }
  return KERNEL_PROCESS_GUID;
}

const sessionNameW = Buffer.from(SESSION_NAME + '\0', 'utf16le');
const PROPS_SIZE = 120;

function stopSessionByName(): void {
  const stopProps = Buffer.alloc(PROPS_SIZE + 512);
  stopProps.writeUInt32LE(stopProps.length, 0);
  stopProps.writeUInt32LE(PROPS_SIZE, 116);
  Advapi32.ControlTraceW(0n, sessionNameW.ptr, stopProps.ptr, EVENT_TRACE_CONTROL_STOP);
}

/** Returns true if it streamed real-time events, false if it must fall back (access denied). */
function runRealTime(): boolean {
  const providerGuid = resolveProviderGuid(TARGET_PROVIDER);

  // EVENT_TRACE_PROPERTIES (x64): WNODE_HEADER (48 B) + tail = 120 B, then room for the name.
  const properties = Buffer.alloc(PROPS_SIZE + 512);
  properties.writeUInt32LE(properties.length, 0); // Wnode.BufferSize
  properties.writeUInt32LE(1, 40); // Wnode.ClientContext = 1 (QPC clock)
  properties.writeUInt32LE(WNODE_FLAG_TRACED_GUID, 44); // Wnode.Flags
  properties.writeUInt32LE(EVENT_TRACE_REAL_TIME_MODE, 64); // LogFileMode
  properties.writeUInt32LE(0, 112); // LogFileNameOffset (none — real time)
  properties.writeUInt32LE(PROPS_SIZE, 116); // LoggerNameOffset

  const sessionHandleBuffer = Buffer.alloc(8);
  let startStatus = Advapi32.StartTraceW(sessionHandleBuffer.ptr, sessionNameW.ptr, properties.ptr);
  if (startStatus === ERROR_ALREADY_EXISTS) {
    stopSessionByName();
    startStatus = Advapi32.StartTraceW(sessionHandleBuffer.ptr, sessionNameW.ptr, properties.ptr);
  }
  if (startStatus === ERROR_ACCESS_DENIED) return false;
  if (startStatus !== ERROR_SUCCESS) {
    console.error(`StartTraceW failed with status ${startStatus}.`);
    return false;
  }

  const sessionHandle = sessionHandleBuffer.readBigUInt64LE(0);

  const enableStatus = Advapi32.EnableTraceEx2(sessionHandle, providerGuid.ptr, EVENT_CONTROL_CODE_ENABLE_PROVIDER, TRACE_LEVEL_VERBOSE, 0n, 0n, 0, null!);
  if (enableStatus === ERROR_ACCESS_DENIED) {
    stopSessionByName();
    return false;
  }
  if (enableStatus !== ERROR_SUCCESS) {
    console.error(`EnableTraceEx2 failed with status ${enableStatus}.`);
    stopSessionByName();
    return false;
  }

  // Two-call TRACE_EVENT_INFO scratch, reused per event (keep per-event work LIGHT).
  const teiSize = Buffer.alloc(4);
  let teiBuffer = Buffer.alloc(8192);

  // EVENT_RECORD callback — fires on the ProcessTrace calling (Bun VM) thread.
  const recordCallback = new JSCallback(
    (eventRecord: Pointer) => {
      if (!eventRecord) return;
      const header = new DataView(toArrayBuffer(eventRecord, 0, 0x70));
      const processId = header.getUint32(12, true);
      const eventId = header.getUint16(40, true); // EventDescriptor.Id
      const opcode = header.getUint8(45); // EventDescriptor.Opcode

      teiSize.writeUInt32LE(0, 0);
      let status = Tdh.TdhGetEventInformation(eventRecord, 0, null, null, teiSize.ptr);
      const needed = teiSize.readUInt32LE(0);
      if (status === ERROR_INSUFFICIENT_BUFFER && needed > 0) {
        if (needed > teiBuffer.length) teiBuffer = Buffer.alloc(needed);
        teiSize.writeUInt32LE(teiBuffer.length, 0);
        status = Tdh.TdhGetEventInformation(eventRecord, 0, null, teiBuffer.ptr, teiSize.ptr);
      }

      let providerName = TARGET_PROVIDER;
      let taskName = '';
      let opcodeName = '';
      if (status === ERROR_SUCCESS) {
        providerName = readWide(teiBuffer, teiBuffer.readUInt32LE(52)) || providerName; // ProviderNameOffset
        taskName = readWide(teiBuffer, teiBuffer.readUInt32LE(68)); // TaskNameOffset
        opcodeName = readWide(teiBuffer, teiBuffer.readUInt32LE(72)); // OpcodeNameOffset
      }

      const shortProvider = providerName.replace(/^Microsoft-Windows-/, '');
      const label = `${shortProvider} · ${taskName || `Event ${eventId}`}${opcodeName ? `/${opcodeName}` : ''}`;
      histogram.set(label, (histogram.get(label) ?? 0) + 1);
      eventTotal++;

      const tint = colorForOpcode(opcode);
      recent.push(`  ${GREY}pid ${String(processId).padStart(6, ' ')}${RESET}  ${tint}${(taskName || `Event ${eventId}`).padEnd(22, ' ').slice(0, 22)}${RESET} ${DIM}${opcodeName || `op${opcode}`}${RESET}`);
      if (recent.length > 64) recent.splice(0, recent.length - 64);

      maybeRender();
    },
    { args: ['ptr'], returns: 'void' },
  );

  // BufferCallback — return FALSE past the deadline to stop ProcessTrace.
  const bufferCallback = new JSCallback(() => (Date.now() < deadline ? 1 : 0), { args: ['ptr'], returns: 'u32' });

  // EVENT_TRACE_LOGFILEW (x64, 448 B): LoggerName@8, ProcessTraceMode@28, BufferCallback@400, EventRecordCallback@424.
  const logfile = Buffer.alloc(448);
  logfile.writeBigUInt64LE(BigInt(sessionNameW.ptr ?? 0), 8);
  logfile.writeUInt32LE(PROCESS_TRACE_MODE_REAL_TIME | PROCESS_TRACE_MODE_EVENT_RECORD, 28);
  logfile.writeBigUInt64LE(BigInt(bufferCallback.ptr ?? 0), 400);
  logfile.writeBigUInt64LE(BigInt(recordCallback.ptr ?? 0), 424);

  const traceHandle = Advapi32.OpenTraceW(logfile.ptr);
  if (traceHandle === INVALID_PROCESSTRACE_HANDLE) {
    console.error('OpenTraceW failed.');
    stopSessionByName();
    recordCallback.close();
    bufferCallback.close();
    return false;
  }

  banner();
  console.log(`${DIM}Mode: ${GREEN}real-time ETW${RESET}${DIM} · provider ${TARGET_PROVIDER}${RESET}`);
  console.log(`${DIM}Streaming for ${RUN_MS / 1000}s — start/stop processes to watch it move…${RESET}`);

  // ProcessTrace BLOCKS, pumping the callbacks until BufferCallback returns FALSE.
  const handleArray = Buffer.alloc(8);
  handleArray.writeBigUInt64LE(traceHandle, 0);
  let processStatus = ERROR_SUCCESS;
  try {
    processStatus = Advapi32.ProcessTrace(handleArray.ptr, 1, null!, null!);
  } finally {
    Advapi32.CloseTrace(traceHandle);
    stopSessionByName();
    recordCallback.close();
    bufferCallback.close();
  }

  render();
  console.log('');
  if (processStatus !== ERROR_SUCCESS) console.log(`${DIM}ProcessTrace returned ${processStatus}.${RESET}`);
  console.log(`${BOLD}${GREEN}✓ Captured ${eventTotal} live ETW events — decoded entirely through tdh.dll FFI.${RESET}\n`);
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Path B — wevtapi PULL consumer (no admin). EvtQuery + EvtNext + EvtRender.
// ─────────────────────────────────────────────────────────────────────────────

function pick(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`));
  return m ? m[1]! : '';
}
function attr(xml: string, tag: string, name: string): string {
  const m = xml.match(new RegExp(`<${tag}\\b[^>]*\\b${name}='([^']*)'`));
  return m ? m[1]! : '';
}

/** Render one decoded XML record into the feed + histogram. Returns the EventRecordID. */
function ingestXml(xml: string, channel: string): number {
  const provider = attr(xml, 'Provider', 'Name') || 'Unknown';
  const eventId = pick(xml, 'EventID') || '?';
  const level = pick(xml, 'Level');
  const recId = Number(pick(xml, 'EventRecordID') || '0');
  const time = attr(xml, 'TimeCreated', 'SystemTime');

  const shortProvider = provider.replace(/^Microsoft-Windows-/, '');
  const shortChannel = channel.replace(/^Microsoft-Windows-/, '');
  const label = `${shortProvider} · Event ${eventId}`;
  histogram.set(label, (histogram.get(label) ?? 0) + 1);
  eventTotal++;

  // Level: 1=Critical 2=Error 3=Warning 4=Info → tint
  const tint = level === '1' || level === '2' ? RED : level === '3' ? YELLOW : GREEN;
  const hhmmss = time ? time.slice(11, 19) : '--:--:--';
  recent.push(`  ${GREY}${hhmmss}${RESET}  ${DIM}${shortChannel.slice(0, 10).padEnd(10, ' ')}${RESET} ${tint}${shortProvider.padEnd(24, ' ').slice(0, 24)}${RESET} ${DIM}id ${String(eventId).padStart(5, ' ')}${RESET}`);
  if (recent.length > 64) recent.splice(0, recent.length - 64);
  return recId;
}

// Reusable scratch for the pull consumer (assembled once; no GC concern — synchronous use).
const pullHandles = Buffer.alloc(8 * 16);
const pullReturned = Buffer.alloc(4);
const pullUsed = Buffer.alloc(4);
const pullPropc = Buffer.alloc(4);
let pullRenderBuf = Buffer.alloc(65536);

/** EvtRender(EvtRenderEventXml) one event handle → decoded XML string (or ''). */
function renderEventXml(ev: bigint): string {
  pullUsed.writeUInt32LE(0, 0);
  Wevtapi.EvtRender(0n, ev, EvtRenderFlags.EvtRenderEventXml, 0, null, pullUsed.ptr, pullPropc.ptr);
  const need = pullUsed.readUInt32LE(0);
  if (need <= 0) return '';
  if (need > pullRenderBuf.length) pullRenderBuf = Buffer.alloc(need);
  if (!Wevtapi.EvtRender(0n, ev, EvtRenderFlags.EvtRenderEventXml, need, pullRenderBuf.ptr, pullUsed.ptr, pullPropc.ptr)) return '';
  return pullRenderBuf.toString('utf16le', 0, pullUsed.readUInt32LE(0)).replace(/\0.*$/, '');
}

interface ChannelState {
  name: string;
  pathW: Buffer;
  lastSeen: number;
}

/** Drain a channel for records newer than state.lastSeen; ingest each; advance lastSeen. Returns count. */
function drainChannel(state: ChannelState): number {
  const xpath = Buffer.from(`*[System[EventRecordID > ${state.lastSeen}]]\0`, 'utf16le');
  const q = Wevtapi.EvtQuery(0n, state.pathW.ptr, xpath.ptr, EvtQueryFlags.EvtQueryChannelPath | EvtQueryFlags.EvtQueryForwardDirection | EvtQueryFlags.EvtQueryTolerateQueryErrors);
  if (q === 0n) return 0;
  let drained = 0;
  try {
    for (let guard = 0; guard < 64; guard++) {
      if (!Wevtapi.EvtNext(q, 16, pullHandles.ptr, 0, 0, pullReturned.ptr)) break;
      const n = pullReturned.readUInt32LE(0);
      if (n === 0) break;
      for (let i = 0; i < n; i++) {
        const ev = pullHandles.readBigUInt64LE(i * 8);
        const xml = renderEventXml(ev);
        if (xml) {
          const recId = ingestXml(xml, state.name);
          if (recId > state.lastSeen) state.lastSeen = recId;
          drained++;
        }
        Wevtapi.EvtClose(ev);
      }
    }
  } finally {
    Wevtapi.EvtClose(q);
  }
  return drained;
}

/** Prime the feed with the most recent `count` records of a channel and set lastSeen to the newest. */
function primeChannel(state: ChannelState, count: number): void {
  const seedQ = Buffer.from('*\0', 'utf16le');
  const q = Wevtapi.EvtQuery(0n, state.pathW.ptr, seedQ.ptr, EvtQueryFlags.EvtQueryChannelPath | EvtQueryFlags.EvtQueryReverseDirection | EvtQueryFlags.EvtQueryTolerateQueryErrors);
  if (q === 0n) return;
  const seeds: { recId: number; xml: string }[] = [];
  try {
    if (!Wevtapi.EvtNext(q, count, pullHandles.ptr, 1000, 0, pullReturned.ptr)) return;
    const n = pullReturned.readUInt32LE(0);
    for (let i = 0; i < n; i++) {
      const ev = pullHandles.readBigUInt64LE(i * 8);
      const xml = renderEventXml(ev);
      if (xml) {
        const recId = Number(pick(xml, 'EventRecordID') || '0');
        seeds.push({ recId, xml });
        if (recId > state.lastSeen) state.lastSeen = recId;
      }
      Wevtapi.EvtClose(ev);
    }
  } finally {
    Wevtapi.EvtClose(q);
  }
  // Reverse query returns newest-first; ingest oldest-first so the feed reads chronologically.
  for (const s of seeds.reverse()) ingestXml(s.xml, state.name);
}

function runPull(): Promise<void> {
  return new Promise<void>((resolve) => {
    banner();
    console.log(`${DIM}Mode: ${YELLOW}wevtapi pull${RESET}${DIM} (real-time ETW needs admin) · channels: ${FALLBACK_CHANNELS.join(', ')}${RESET}`);
    console.log(`${DIM}Tailing live Windows event channels for ${RUN_MS / 1000}s — no elevation required…${RESET}`);

    // Only keep channels we can actually query (Security may be denied).
    const channels: ChannelState[] = [];
    for (const name of FALLBACK_CHANNELS) {
      const pathW = Buffer.from(name + '\0', 'utf16le');
      const probe = Wevtapi.EvtQuery(0n, pathW.ptr, Buffer.from('*\0', 'utf16le').ptr, EvtQueryFlags.EvtQueryChannelPath | EvtQueryFlags.EvtQueryTolerateQueryErrors);
      if (probe !== 0n) {
        Wevtapi.EvtClose(probe);
        channels.push({ name, pathW, lastSeen: 0 });
      }
    }

    // Prime each channel with its recent backlog so the feed is immediately populated.
    for (const ch of channels) primeChannel(ch, 8);
    render();

    const tick = (): void => {
      if (Date.now() >= deadline) {
        clearInterval(timer);
        render();
        console.log('');
        console.log(`${BOLD}${GREEN}✓ Pulled ${eventTotal} live event-log records across ${channels.length} channel(s) — decoded XML via wevtapi FFI (no admin).${RESET}\n`);
        resolve();
        return;
      }
      for (const ch of channels) drainChannel(ch);
      maybeRender();
    };

    const timer = setInterval(tick, 500);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
//  Main — try real-time first, fall back to pull. Clean ESC/Ctrl-C exit.
// ─────────────────────────────────────────────────────────────────────────────

function installInteractiveExit(onExit: () => void): void {
  const stdin = process.stdin;
  if (stdin.isTTY) {
    stdin.setRawMode(true);
    stdin.resume();
    stdin.on('data', (data: Buffer) => {
      // ESC (0x1b) or Ctrl-C (0x03)
      if (data.includes(0x1b) || data.includes(0x03)) {
        onExit();
        process.exit(0);
      }
    });
  }
  process.on('SIGINT', () => {
    onExit();
    process.exit(0);
  });
}

async function main(): Promise<void> {
  installInteractiveExit(() => {
    try {
      if (process.stdin.isTTY) process.stdin.setRawMode(false);
    } catch {
      /* ignore */
    }
    // Best-effort session teardown if interrupted mid real-time.
    stopSessionByName();
  });

  // Attempt the real-time ETW consumer. If it streams, we're done.
  const streamed = runRealTime();
  if (streamed) {
    mode = 'real-time';
    return;
  }

  // Otherwise fall back to the no-admin wevtapi pull consumer.
  mode = 'pull';
  await runPull();
}

main()
  .then(() => {
    try {
      if (process.stdin.isTTY) process.stdin.setRawMode(false);
    } catch {
      /* ignore */
    }
    process.exit(0);
  })
  .catch((err: unknown) => {
    try {
      if (process.stdin.isTTY) process.stdin.setRawMode(false);
    } catch {
      /* ignore */
    }
    stopSessionByName();
    console.error(`\n${RED}etw-firehose failed: ${String(err)}${RESET}\n`);
    process.exit(0);
  });
