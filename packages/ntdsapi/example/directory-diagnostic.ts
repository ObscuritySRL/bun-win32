/**
 * Active Directory Client Diagnostic
 *
 * An exhaustive, fully-formatted report of what the NTDSAPI client surface can
 * do from this machine WITHOUT a domain: it forges host-based and target SPNs
 * for every common service class, performs purely syntactical directory-name
 * translation (DN ⇄ canonical ⇄ canonical-ex) entirely client-side, exercises
 * the alternate-credential handle lifecycle, probes a domain bind and decodes
 * the exact Win32/RPC status, and prints the full DS_NAME_FORMAT /
 * DS_SPN_NAME_TYPE / DS_REPL_INFO_TYPE catalogs the API exposes.
 *
 * APIs demonstrated (Ntdsapi):
 *   - DsClientMakeSpnForTargetServerW  (target-server SPN construction)
 *   - DsGetSpnW / DsFreeSpnArrayW      (host-based SPN enumeration + free)
 *   - DsCrackNamesW / DsFreeNameResultW(syntactical name-format translation + free)
 *   - DsMakePasswordCredentialsW       (alternate-credential handle)
 *   - DsFreePasswordCredentials        (release credential handle)
 *   - DsBindW                          (domain bind probe, status decoded)
 *
 * APIs demonstrated (Kernel32, cross-package):
 *   - GetStdHandle / GetConsoleMode / SetConsoleMode  (enable ANSI VT output)
 *
 * Run: bun run example/directory-diagnostic.ts
 */
import { type Pointer, read, toArrayBuffer } from 'bun:ffi';

import Ntdsapi, { DS_NAME_ERROR, DS_NAME_FLAGS, DS_NAME_FORMAT, DS_REPL_INFO_TYPE, DS_SPN_NAME_TYPE } from '../index';
import Kernel32 from '@bun-win32/kernel32';

Ntdsapi.Preload(['DsClientMakeSpnForTargetServerW', 'DsGetSpnW', 'DsFreeSpnArrayW', 'DsCrackNamesW', 'DsFreeNameResultW', 'DsMakePasswordCredentialsW', 'DsFreePasswordCredentials', 'DsBindW']);
Kernel32.Preload(['GetStdHandle', 'GetConsoleMode', 'SetConsoleMode']);

const STD_OUTPUT_HANDLE = -11;
const ENABLE_VIRTUAL_TERMINAL_PROCESSING = 0x0004;
const hStdout = Kernel32.GetStdHandle(STD_OUTPUT_HANDLE);
const modeBuf = Buffer.alloc(4);
if (Kernel32.GetConsoleMode(hStdout, modeBuf.ptr)) {
  Kernel32.SetConsoleMode(hStdout, modeBuf.readUInt32LE(0) | ENABLE_VIRTUAL_TERMINAL_PROCESSING);
}

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const CYAN = '\x1b[38;2;120;200;255m';
const GREEN = '\x1b[38;2;120;230;140m';
const AMBER = '\x1b[38;2;240;190;90m';
const RED = '\x1b[38;2;240;120;120m';

const wide = (s: string): Buffer => Buffer.from(s + '\0', 'utf16le');

function readWideStringFromPtr(ptr: Pointer): string {
  const s = Buffer.from(toArrayBuffer(ptr, 0, 1024)).toString('utf16le');
  const nul = s.indexOf(String.fromCharCode(0));
  return nul === -1 ? s : s.slice(0, nul);
}

function readPtrAt(buf: Buffer, offset: number): Pointer | null {
  const val = Number(buf.readBigUInt64LE(offset));
  return val !== 0 ? (val as Pointer) : null;
}

function header(title: string): void {
  console.log(`\n${BOLD}${CYAN}━━ ${title} ${'━'.repeat(Math.max(0, 64 - title.length))}${RESET}`);
}

function decodeWin32(code: number): string {
  const map: Record<number, string> = {
    0: 'ERROR_SUCCESS',
    5: 'ERROR_ACCESS_DENIED',
    1212: 'ERROR_INVALID_DOMAINNAME',
    1311: 'ERROR_NO_LOGON_SERVERS',
    1355: 'ERROR_NO_SUCH_DOMAIN',
    1722: 'RPC_S_SERVER_UNAVAILABLE',
    1753: 'EPT_S_NOT_REGISTERED',
    8430: 'ERROR_DS_DRA_BAD_DN',
  };
  return map[code] ?? `0x${code.toString(16)}`;
}

console.log(`${BOLD}${CYAN}\n  Active Directory Client Diagnostic  ${DIM}— ntdsapi.dll over pure FFI${RESET}`);

const targetHost = process.env.COMPUTERNAME ?? 'localhost';
const targetServer = targetHost + '.'; // rooted DNS name — resolves to this host offline

// ── 1. Target-server SPN construction ───────────────────────────────────────
header('Target-Server SPN Construction (DsClientMakeSpnForTargetServerW)');
const serviceClasses = ['HOST', 'HTTP', 'ldap', 'cifs', 'TERMSRV', 'MSSQLSvc', 'WSMAN', 'RPCSS'];
console.log(`  ${DIM}target server: ${targetHost}${RESET}`);
for (const sc of serviceClasses) {
  const len = Buffer.alloc(4);
  len.writeUInt32LE(512, 0);
  const out = Buffer.alloc(512 * 2);
  const st = Ntdsapi.DsClientMakeSpnForTargetServerW(wide(sc).ptr!, wide(targetServer).ptr!, len.ptr, out.ptr!);
  const label = `${sc}`.padEnd(10);
  if (st === 0) {
    const spn = out.toString('utf16le', 0, Math.max(0, len.readUInt32LE(0) - 1) * 2);
    console.log(`  ${GREEN}✔${RESET} ${label} ${BOLD}${spn}${RESET}`);
  } else {
    console.log(`  ${RED}✘${RESET} ${label} ${DIM}error ${st} (${decodeWin32(st)})${RESET}`);
  }
}

// ── 2. Host-based SPN enumeration ───────────────────────────────────────────
header('Host-Based SPN Enumeration (DsGetSpnW · DS_SPN_DNS_HOST)');
for (const sc of ['HOST', 'HTTP', 'ldap', 'TERMSRV', 'WSMAN']) {
  const pcSpn = Buffer.alloc(4);
  const prpszSpn = Buffer.alloc(8);
  const st = Ntdsapi.DsGetSpnW(DS_SPN_NAME_TYPE.DS_SPN_DNS_HOST, wide(sc).ptr!, null, 0, 0, null, null, pcSpn.ptr, prpszSpn.ptr);
  const label = `${sc}`.padEnd(10);
  if (st !== 0) {
    console.log(`  ${RED}✘${RESET} ${label} ${DIM}error ${st} (${decodeWin32(st)})${RESET}`);
    continue;
  }
  const count = pcSpn.readUInt32LE(0);
  const arrPtr = read.ptr(prpszSpn.ptr) as Pointer;
  if (!arrPtr || count === 0) {
    console.log(`  ${AMBER}–${RESET} ${label} ${DIM}(0 SPNs)${RESET}`);
    continue;
  }
  const arrBuf = Buffer.from(toArrayBuffer(arrPtr, 0, count * 8));
  const spns: string[] = [];
  for (let i = 0; i < count; i++) {
    const sp = readPtrAt(arrBuf, i * 8);
    if (sp) spns.push(readWideStringFromPtr(sp));
  }
  Ntdsapi.DsFreeSpnArrayW(count, arrPtr);
  console.log(`  ${GREEN}✔${RESET} ${label} ${BOLD}${spns.join(`${RESET}, ${BOLD}`)}${RESET} ${DIM}(${count})${RESET}`);
}

// ── 3. Syntactical name translation (no domain required) ────────────────────
header('Syntactical Name Translation (DsCrackNamesW · SYNTACTICAL_ONLY, hDS = NULL)');
const sampleDn = 'CN=Jeff Smith,OU=Sales,DC=fabrikam,DC=com';
const conversions: Array<[string, DS_NAME_FORMAT]> = [
  ['DS_CANONICAL_NAME', DS_NAME_FORMAT.DS_CANONICAL_NAME],
  ['DS_CANONICAL_NAME_EX', DS_NAME_FORMAT.DS_CANONICAL_NAME_EX],
  ['DS_FQDN_1779_NAME', DS_NAME_FORMAT.DS_FQDN_1779_NAME],
];
console.log(`  ${DIM}input (DS_FQDN_1779_NAME): ${sampleDn}${RESET}`);
for (const [destName, destFmt] of conversions) {
  const nameBuf = wide(sampleDn);
  const arr = Buffer.alloc(8);
  arr.writeBigUInt64LE(BigInt(nameBuf.ptr!), 0);
  const ppResult = Buffer.alloc(8);
  const st = Ntdsapi.DsCrackNamesW(0n, DS_NAME_FLAGS.DS_NAME_FLAG_SYNTACTICAL_ONLY, DS_NAME_FORMAT.DS_FQDN_1779_NAME, destFmt, 1, arr.ptr, ppResult.ptr);
  const label = destName.padEnd(22);
  if (st !== 0) {
    console.log(`  ${RED}✘${RESET} ${label} ${DIM}call error ${st} (${decodeWin32(st)})${RESET}`);
    continue;
  }
  const resPtr = read.ptr(ppResult.ptr) as Pointer;
  if (!resPtr) {
    console.log(`  ${RED}✘${RESET} ${label} ${DIM}(null result)${RESET}`);
    continue;
  }
  const headBuf = Buffer.from(toArrayBuffer(resPtr, 0, 16));
  const cItems = headBuf.readUInt32LE(0);
  const rItems = readPtrAt(headBuf, 8);
  if (cItems > 0 && rItems) {
    const itemBuf = Buffer.from(toArrayBuffer(rItems, 0, 24));
    const itemStatus = itemBuf.readUInt32LE(0);
    const pName = readPtrAt(itemBuf, 16);
    const value = pName ? readWideStringFromPtr(pName) : '';
    const statusName = DS_NAME_ERROR[itemStatus] ?? `status ${itemStatus}`;
    if (itemStatus === DS_NAME_ERROR.DS_NAME_NO_ERROR && value) {
      console.log(`  ${GREEN}✔${RESET} ${label} ${BOLD}${value}${RESET}`);
    } else {
      console.log(`  ${AMBER}≈${RESET} ${label} ${DIM}${statusName}${RESET}`);
    }
  }
  Ntdsapi.DsFreeNameResultW(resPtr);
}

// ── 4. Alternate-credential handle lifecycle ────────────────────────────────
header('Alternate-Credential Handle Lifecycle (DsMakePasswordCredentialsW)');
const credShapes: Array<[string, string | null, string | null, string | null]> = [
  ['default process creds', null, null, null],
  ['UPN only', 'jeff@fabrikam.com', null, null],
  ['user + domain + password', 'jeff', 'FABRIKAM', 'P@ssw0rd!'],
];
for (const [label, user, domain, pwd] of credShapes) {
  const pAuth = Buffer.alloc(8);
  const st = Ntdsapi.DsMakePasswordCredentialsW(user === null ? null : wide(user).ptr!, domain === null ? null : wide(domain).ptr!, pwd === null ? null : wide(pwd).ptr!, pAuth.ptr);
  if (st === 0) {
    const handle = pAuth.readBigUInt64LE(0);
    console.log(`  ${GREEN}✔${RESET} ${label.padEnd(28)} ${DIM}handle${RESET} 0x${handle.toString(16).padStart(12, '0')}`);
    Ntdsapi.DsFreePasswordCredentials(handle);
  } else {
    console.log(`  ${RED}✘${RESET} ${label.padEnd(28)} ${DIM}error ${st} (${decodeWin32(st)})${RESET}`);
  }
}

// ── 5. Domain bind probe ────────────────────────────────────────────────────
header('Domain Bind Probe (DsBindW — status decoded)');
const phDS = Buffer.alloc(8);
const bindStatus = Ntdsapi.DsBindW(null, null, phDS.ptr);
if (bindStatus === 0) {
  const h = phDS.readBigUInt64LE(0);
  console.log(`  ${GREEN}✔${RESET} bound to a directory  ${DIM}handle${RESET} 0x${h.toString(16)}  ${DIM}(domain-joined)${RESET}`);
  Ntdsapi.DsUnBindW(phDS.ptr);
} else {
  console.log(`  ${AMBER}●${RESET} not bound: ${BOLD}${decodeWin32(bindStatus)}${RESET} ${DIM}(error ${bindStatus}) — expected off a domain${RESET}`);
}

// ── 6. API catalogs ─────────────────────────────────────────────────────────
header('DS_NAME_FORMAT catalog');
for (const k of Object.keys(DS_NAME_FORMAT).filter((x) => isNaN(Number(x)))) {
  console.log(`  ${DIM}${String(DS_NAME_FORMAT[k as keyof typeof DS_NAME_FORMAT]).padStart(3)}${RESET}  ${k}`);
}
header('DS_SPN_NAME_TYPE catalog');
for (const k of Object.keys(DS_SPN_NAME_TYPE).filter((x) => isNaN(Number(x)))) {
  console.log(`  ${DIM}${String(DS_SPN_NAME_TYPE[k as keyof typeof DS_SPN_NAME_TYPE]).padStart(3)}${RESET}  ${k}`);
}
header('DS_REPL_INFO_TYPE catalog');
for (const k of Object.keys(DS_REPL_INFO_TYPE).filter((x) => isNaN(Number(x)))) {
  console.log(`  ${DIM}${String(DS_REPL_INFO_TYPE[k as keyof typeof DS_REPL_INFO_TYPE]).padStart(3)}${RESET}  ${k}`);
}

console.log(`\n${BOLD}${GREEN}  Diagnostic complete.${RESET} ${DIM}All calls issued through ntdsapi.dll via Bun FFI — no domain, no PowerShell.${RESET}\n`);
