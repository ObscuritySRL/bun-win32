/**
 * RPC Diagnostic
 *
 * A comprehensive RPC diagnostic that probes the local Windows RPC subsystem.
 * It enumerates available network protocol sequences, queries the live local
 * endpoint mapper (epmapper) for every registered RPC interface, classifies a
 * battery of well-known named-pipe and TCP RPC endpoints by whether the
 * server is listening, decodes the standard RPC status code table via
 * DceErrorInqText, and times UUID generation rates for both random and
 * sequential variants. Every value is formatted with aligned labels and ANSI
 * color.
 *
 * APIs demonstrated:
 *   - RpcStringBindingComposeW       (build a string binding from components)
 *   - RpcStringBindingParseW         (decompose a string binding)
 *   - RpcBindingFromStringBindingW   (resolve a string binding to a handle)
 *   - RpcBindingFree                 (release an RPC binding handle)
 *   - RpcBindingToStringBindingW     (handle → canonical string binding)
 *   - RpcNetworkInqProtseqsW         (enumerate available protocol sequences)
 *   - RpcProtseqVectorFreeW          (free a protocol sequence vector)
 *   - RpcNetworkIsProtseqValidW      (validate a protocol sequence string)
 *   - RpcMgmtIsServerListening       (probe whether an endpoint is live)
 *   - RpcMgmtEpEltInqBegin           (start endpoint-map enumeration)
 *   - RpcMgmtEpEltInqNextW           (read one endpoint-map entry)
 *   - RpcMgmtEpEltInqDone            (close endpoint-map enumeration)
 *   - DceErrorInqTextW               (resolve RPC_STATUS code to text)
 *   - UuidCreate                     (random v4 UUID)
 *   - UuidCreateSequential           (sequential v1-style UUID)
 *   - UuidToStringW                  (UUID → canonical text form)
 *   - UuidIsNil / UuidHash           (UUID property queries)
 *   - RpcStringFreeW                 (free RPC-allocated wide strings)
 *
 * Run: bun run example/rpc-diagnostic.ts
 */
import Rpcrt4 from '../index';
import { read, toArrayBuffer, type Pointer } from 'bun:ffi';

Rpcrt4.Preload([
  'RpcStringBindingComposeW',
  'RpcStringBindingParseW',
  'RpcBindingFromStringBindingW',
  'RpcBindingFree',
  'RpcBindingToStringBindingW',
  'RpcNetworkInqProtseqsW',
  'RpcProtseqVectorFreeW',
  'RpcNetworkIsProtseqValidW',
  'RpcMgmtIsServerListening',
  'RpcMgmtEpEltInqBegin',
  'RpcMgmtEpEltInqNextW',
  'RpcMgmtEpEltInqDone',
  'DceErrorInqTextW',
  'UuidCreate',
  'UuidCreateSequential',
  'UuidToStringW',
  'UuidIsNil',
  'UuidHash',
  'RpcStringFreeW',
]);

const CYAN = '\x1b[96m';
const BRIGHT = '\x1b[1m';
const DIM = '\x1b[2m';
const GREEN = '\x1b[92m';
const RED = '\x1b[91m';
const YELLOW = '\x1b[93m';
const MAGENTA = '\x1b[95m';
const BLUE = '\x1b[94m';
const RESET = '\x1b[0m';

const COLS = Math.min(110, process.stdout.columns || 110);
function rule(ch = '─') {
  return DIM + ch.repeat(COLS) + RESET;
}
function header(title: string) {
  console.log();
  console.log(`${CYAN}${BRIGHT}${title}${RESET}`);
  console.log(rule());
}
function wide(text: string): Buffer {
  return Buffer.from(text + '\0', 'utf16le');
}
function readWide(ptr: Pointer, maxBytes = 1024): string {
  const buf = toArrayBuffer(ptr, 0, maxBytes);
  const u16 = new Uint16Array(buf);
  let length = 0;
  while (length < u16.length && u16[length] !== 0) length++;
  return new TextDecoder('utf-16').decode(buf.slice(0, length * 2));
}

const statusBuf = Buffer.alloc(4);

// ── Section 1: Available protocol sequences ───────────────────────────────
header('Available RPC protocol sequences');
{
  const vectorOut = Buffer.alloc(8);
  const inqStatus = Rpcrt4.RpcNetworkInqProtseqsW(vectorOut.ptr!);
  if (inqStatus === 0) {
    const vecPtr = read.ptr(vectorOut.ptr!) as Pointer;
    const headerBuf = toArrayBuffer(vecPtr, 0, 8);
    const count = new Uint32Array(headerBuf)[0]!;
    const ptrs = new BigUint64Array(toArrayBuffer(vecPtr, 8, count * 8));
    console.log(`  ${DIM}Count:${RESET} ${count}`);
    for (let i = 0; i < count; i++) {
      const protseq = readWide(Number(ptrs[i]) as Pointer, 64);
      const valid = Rpcrt4.RpcNetworkIsProtseqValidW(wide(protseq).ptr!) === 0;
      const badge = valid ? `${GREEN}valid${RESET}` : `${RED}invalid${RESET}`;
      console.log(`  ${YELLOW}${protseq.padEnd(20)}${RESET}  ${badge}`);
    }
    Rpcrt4.RpcProtseqVectorFreeW(vectorOut.ptr!);
  } else {
    console.log(`  ${RED}RpcNetworkInqProtseqsW failed:${RESET} ${inqStatus}`);
  }
}

// ── Section 2: Well-known endpoint probing ────────────────────────────────
header('Well-known endpoint probes (RpcMgmtIsServerListening)');
{
  const probes: { label: string; protseq: string; addr: string | null; endpoint: string | null }[] = [
    { label: 'Endpoint Mapper (LRPC)', protseq: 'ncalrpc', addr: null, endpoint: 'epmapper' },
    { label: 'Endpoint Mapper (TCP)', protseq: 'ncacn_ip_tcp', addr: '127.0.0.1', endpoint: '135' },
    { label: 'Service Control Mgr', protseq: 'ncacn_np', addr: '\\\\.', endpoint: '\\pipe\\svcctl' },
    { label: 'Event Log', protseq: 'ncacn_np', addr: '\\\\.', endpoint: '\\pipe\\eventlog' },
    { label: 'Spooler', protseq: 'ncacn_np', addr: '\\\\.', endpoint: '\\pipe\\spoolss' },
    { label: 'Winreg', protseq: 'ncacn_np', addr: '\\\\.', endpoint: '\\pipe\\winreg' },
    { label: 'Netlogon', protseq: 'ncacn_np', addr: '\\\\.', endpoint: '\\pipe\\netlogon' },
    { label: 'SAMR', protseq: 'ncacn_np', addr: '\\\\.', endpoint: '\\pipe\\samr' },
    { label: 'LSASS', protseq: 'ncacn_np', addr: '\\\\.', endpoint: '\\pipe\\lsass' },
    { label: 'WMI (LRPC)', protseq: 'ncalrpc', addr: null, endpoint: 'epmapper' },
  ];

  console.log(`  ${DIM}${'Endpoint'.padEnd(28)} ${'Protseq'.padEnd(14)} ${'Listening'.padEnd(11)} ${'Detail'}${RESET}`);
  for (const p of probes) {
    const stringBindingOut = Buffer.alloc(8);
    const compose = Rpcrt4.RpcStringBindingComposeW(null, wide(p.protseq).ptr!, p.addr ? wide(p.addr).ptr! : null, p.endpoint ? wide(p.endpoint).ptr! : null, null, stringBindingOut.ptr!);
    if (compose !== 0) {
      console.log(`  ${p.label.padEnd(28)} ${YELLOW}${p.protseq.padEnd(14)}${RESET} ${RED}compose=${compose}${RESET}`);
      continue;
    }
    const bindingOut = Buffer.alloc(8);
    const fromStr = Rpcrt4.RpcBindingFromStringBindingW(read.ptr(stringBindingOut.ptr!) as Pointer, bindingOut.ptr!);
    Rpcrt4.RpcStringFreeW(stringBindingOut.ptr!);
    if (fromStr !== 0) {
      console.log(`  ${p.label.padEnd(28)} ${YELLOW}${p.protseq.padEnd(14)}${RESET} ${RED}bind=${fromStr}${RESET}`);
      continue;
    }
    const binding = read.u64(bindingOut.ptr!);
    const listenStatus = Rpcrt4.RpcMgmtIsServerListening(binding);
    Rpcrt4.RpcBindingFree(bindingOut.ptr!);
    const listening = listenStatus === 0;
    const badge = listening ? `${GREEN}LISTENING${RESET}` : `${DIM}closed${RESET}   `;
    const detail = listening ? `${DIM}rpc=${listenStatus}${RESET}` : `${DIM}rpc=${listenStatus}${RESET}`;
    console.log(`  ${p.label.padEnd(28)} ${YELLOW}${p.protseq.padEnd(14)}${RESET} ${badge.padEnd(20)} ${detail}`);
  }
}

// ── Section 3: Live endpoint map enumeration ──────────────────────────────
header('Local endpoint map (RpcMgmtEpEltInq*)');
{
  // Bind to local epmapper via LRPC
  const stringBindingOut = Buffer.alloc(8);
  const bindingOut = Buffer.alloc(8);
  let entries = 0;

  if (Rpcrt4.RpcStringBindingComposeW(null, wide('ncalrpc').ptr!, null, null, null, stringBindingOut.ptr!) === 0) {
    if (Rpcrt4.RpcBindingFromStringBindingW(read.ptr(stringBindingOut.ptr!) as Pointer, bindingOut.ptr!) === 0) {
      Rpcrt4.RpcStringFreeW(stringBindingOut.ptr!);

      const inquiryCtxOut = Buffer.alloc(8);
      const binding = read.u64(bindingOut.ptr!);
      // RPC_C_EP_ALL_ELTS = 0, RPC_C_VERS_ALL = 1
      const beginStatus = Rpcrt4.RpcMgmtEpEltInqBegin(binding, 0, null, 1, null, inquiryCtxOut.ptr!);
      if (beginStatus === 0) {
        const inquiryCtx = read.u64(inquiryCtxOut.ptr!);
        const ifIdBuf = Buffer.alloc(24); // RPC_IF_ID = UUID(16) + ushort + ushort + padding
        const entryBindingOut = Buffer.alloc(8);
        const objectUuidBuf = Buffer.alloc(16);
        const annotationOut = Buffer.alloc(8);
        const uuidStringOut = Buffer.alloc(8);

        const maxEntriesToShow = 18;
        const maxEntriesToProcess = 256;
        console.log(`  ${DIM}${'#'.padStart(4)} ${'Interface UUID'.padEnd(36)} ${'Ver'.padEnd(6)} ${'Binding'.padEnd(40)} Annotation${RESET}`);
        while (entries < maxEntriesToProcess) {
          const next = Rpcrt4.RpcMgmtEpEltInqNextW(inquiryCtx, ifIdBuf.ptr!, entryBindingOut.ptr!, objectUuidBuf.ptr!, annotationOut.ptr!);
          if (next !== 0) break;
          entries++;
          // RPC_IF_ID layout: UUID(16) | unsigned short VersMajor | unsigned short VersMinor
          const ifUuidBuf = ifIdBuf.subarray(0, 16);
          const versMajor = ifIdBuf.readUInt16LE(16);
          const versMinor = ifIdBuf.readUInt16LE(18);

          // Render the interface UUID
          let ifUuidStr = '';
          if (Rpcrt4.UuidToStringW(ifUuidBuf.ptr!, uuidStringOut.ptr!) === 0) {
            const uuidPtr = read.ptr(uuidStringOut.ptr!);
            if (uuidPtr) {
              ifUuidStr = readWide(uuidPtr as Pointer, 80);
              Rpcrt4.RpcStringFreeW(uuidStringOut.ptr!);
            }
          }

          // Render the binding via its string form
          let bindingStr = '';
          const bindStrOut = Buffer.alloc(8);
          const entryBindingVal = read.u64(entryBindingOut.ptr!);
          if (entryBindingVal !== 0n && Rpcrt4.RpcBindingToStringBindingW(entryBindingVal, bindStrOut.ptr!) === 0) {
            const bindPtr = read.ptr(bindStrOut.ptr!);
            if (bindPtr) {
              bindingStr = readWide(bindPtr as Pointer, 512);
              Rpcrt4.RpcStringFreeW(bindStrOut.ptr!);
            }
          }

          // Annotation (may be empty / NULL)
          let annotation = '';
          const annPtrRaw = read.ptr(annotationOut.ptr!);
          if (annPtrRaw !== null && annPtrRaw !== 0) {
            annotation = readWide(annPtrRaw as Pointer, 256);
            Rpcrt4.RpcStringFreeW(annotationOut.ptr!);
          }

          // Free the binding handle from the entry
          if (entryBindingVal !== 0n) Rpcrt4.RpcBindingFree(entryBindingOut.ptr!);

          if (entries <= maxEntriesToShow) {
            const ver = `${versMajor}.${versMinor}`;
            const truncBinding = bindingStr.length > 40 ? bindingStr.slice(0, 37) + '...' : bindingStr;
            const truncAnnotation = annotation.length > 30 ? annotation.slice(0, 27) + '...' : annotation;
            console.log(`  ${DIM}${entries.toString().padStart(4)}${RESET} ${MAGENTA}${ifUuidStr.padEnd(36)}${RESET} ${YELLOW}${ver.padEnd(6)}${RESET} ${BLUE}${truncBinding.padEnd(40)}${RESET} ${DIM}${truncAnnotation || '—'}${RESET}`);
          }
        }
        Rpcrt4.RpcMgmtEpEltInqDone(inquiryCtxOut.ptr!);
        if (entries > maxEntriesToShow) {
          console.log(`  ${DIM}... and ${entries - maxEntriesToShow} more (${entries}${entries === maxEntriesToProcess ? '+' : ''} total scanned)${RESET}`);
        } else {
          console.log(`  ${DIM}Total: ${entries} entries${RESET}`);
        }
      } else {
        console.log(`  ${RED}RpcMgmtEpEltInqBegin failed:${RESET} status=${beginStatus}`);
      }
      Rpcrt4.RpcBindingFree(bindingOut.ptr!);
    }
  }
}

// ── Section 4: Common RPC status codes ────────────────────────────────────
header('RPC status code table (DceErrorInqTextW)');
{
  const codes = [0, 5, 87, 1700, 1702, 1703, 1714, 1715, 1717, 1722, 1726, 1745, 1747, 1753, 1818];
  const textBuf = Buffer.alloc(512);
  console.log(`  ${DIM}${'Code'.padStart(6)}  ${'Symbolic'.padEnd(24)} Description${RESET}`);
  for (const code of codes) {
    Rpcrt4.DceErrorInqTextW(code, textBuf.ptr!);
    const text = readWide(textBuf.ptr!, 512).trim();
    const symbolic = symbolicName(code);
    console.log(`  ${YELLOW}${code.toString().padStart(6)}${RESET}  ${BLUE}${symbolic.padEnd(24)}${RESET} ${text}`);
  }
}

// ── Section 5: UUID benchmark and properties ──────────────────────────────
header('UUID generation benchmark (UuidCreate / UuidCreateSequential)');
{
  const iterations = 50_000;
  const buf = Buffer.alloc(16);

  const startRandom = Bun.nanoseconds();
  for (let i = 0; i < iterations; i++) Rpcrt4.UuidCreate(buf.ptr!);
  const elapsedRandom = (Bun.nanoseconds() - startRandom) / 1e6;

  const startSeq = Bun.nanoseconds();
  for (let i = 0; i < iterations; i++) Rpcrt4.UuidCreateSequential(buf.ptr!);
  const elapsedSeq = (Bun.nanoseconds() - startSeq) / 1e6;

  console.log(`  ${DIM}Iterations:${RESET} ${iterations.toLocaleString()}`);
  console.log(`  ${DIM}UuidCreate (random v4)......${RESET}  ${GREEN}${elapsedRandom.toFixed(2).padStart(7)} ms${RESET}  ${DIM}(${Math.round((iterations / elapsedRandom) * 1000).toLocaleString()} ops/s)${RESET}`);
  console.log(`  ${DIM}UuidCreateSequential (v1)....${RESET} ${GREEN}${elapsedSeq.toFixed(2).padStart(7)} ms${RESET}  ${DIM}(${Math.round((iterations / elapsedSeq) * 1000).toLocaleString()} ops/s)${RESET}`);

  // Demonstrate uniqueness across 5 samples
  console.log(`\n  ${DIM}Sample UUIDs:${RESET}`);
  for (let i = 0; i < 5; i++) {
    Rpcrt4.UuidCreate(buf.ptr!);
    const strOut = Buffer.alloc(8);
    Rpcrt4.UuidToStringW(buf.ptr!, strOut.ptr!);
    const text = readWide(read.ptr(strOut.ptr!) as Pointer, 80);
    Rpcrt4.RpcStringFreeW(strOut.ptr!);
    const hash = Rpcrt4.UuidHash(buf.ptr!, statusBuf.ptr!);
    const nil = Rpcrt4.UuidIsNil(buf.ptr!, statusBuf.ptr!);
    console.log(`    ${MAGENTA}${text}${RESET}  ${DIM}hash=0x${hash.toString(16).padStart(4, '0')}  nil=${nil}${RESET}`);
  }
}

console.log();
console.log(rule('═'));
console.log(`  ${BRIGHT}${GREEN}✓${RESET} Diagnostic complete.`);

function symbolicName(code: number): string {
  const table: Record<number, string> = {
    0: 'RPC_S_OK',
    5: 'RPC_S_ACCESS_DENIED',
    87: 'RPC_S_INVALID_ARG',
    1700: 'RPC_S_INVALID_STRING_BINDING',
    1702: 'RPC_S_INVALID_BINDING',
    1703: 'RPC_S_PROTSEQ_NOT_SUPPORTED',
    1714: 'RPC_S_NO_PROTSEQS_REGISTERED',
    1715: 'RPC_S_NOT_LISTENING',
    1717: 'RPC_S_UNKNOWN_IF',
    1722: 'RPC_S_SERVER_UNAVAILABLE',
    1726: 'RPC_S_CALL_FAILED',
    1745: 'RPC_S_UNSUPPORTED_AUTHN_LEVEL',
    1747: 'RPC_S_UNKNOWN_AUTHN_SERVICE',
    1753: 'EPT_S_NOT_REGISTERED',
    1818: 'RPC_S_CALL_CANCELLED',
  };
  return table[code] ?? '—';
}
