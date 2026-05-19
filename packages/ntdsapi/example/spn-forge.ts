/**
 * SPN Forge
 *
 * A live "forge" that hammers out real Kerberos Service Principal Names with
 * nothing but FFI. Every frame, the host-based SPN generator inside
 * ntdsapi.dll is asked to mint the SPNs a service of each class would register
 * for THIS machine (HOST, HTTP, ldap, cifs, TERMSRV, MSSQLSvc, WSMAN, ...),
 * the client-side SPN constructor forges a target SPN for a chosen server,
 * and an alternate-credential handle is struck like a key on the anvil. Sparks
 * fly in truecolor ANSI as each SPN is pulled glowing from the dies — none of
 * it shells out, none of it needs a domain.
 *
 * APIs demonstrated (Ntdsapi):
 *   - DsGetSpnW                        (host-based SPN enumeration per service class)
 *   - DsFreeSpnArrayW                  (release the DLL-allocated SPN array)
 *   - DsClientMakeSpnForTargetServerW  (forge a target-server SPN)
 *   - DsMakePasswordCredentialsW       (mint an alternate-credential handle)
 *   - DsFreePasswordCredentials        (melt the credential handle down)
 *
 * APIs demonstrated (Kernel32, cross-package):
 *   - GetStdHandle / GetConsoleMode / SetConsoleMode  (enable ANSI VT output)
 *
 * Run: bun run example/spn-forge.ts
 */
import { type Pointer, read, toArrayBuffer } from 'bun:ffi';

import Ntdsapi, { DS_SPN_NAME_TYPE } from '../index';
import Kernel32 from '@bun-win32/kernel32';

Ntdsapi.Preload(['DsGetSpnW', 'DsFreeSpnArrayW', 'DsClientMakeSpnForTargetServerW', 'DsMakePasswordCredentialsW', 'DsFreePasswordCredentials']);
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
const HIDE_CURSOR = '\x1b[?25l';
const SHOW_CURSOR = '\x1b[?25h';
const HOME = '\x1b[H';
const CLEAR = '\x1b[2J';

const wide = (s: string): Buffer => Buffer.from(s + '\0', 'utf16le');
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function readWideStringFromPtr(ptr: Pointer): string {
  const s = Buffer.from(toArrayBuffer(ptr, 0, 1024)).toString('utf16le');
  const end = s.indexOf(String.fromCharCode(0));
  return end === -1 ? s : s.slice(0, end);
}

function readPtrAt(buf: Buffer, offset: number): Pointer | null {
  const val = Number(buf.readBigUInt64LE(offset));
  return val !== 0 ? (val as Pointer) : null;
}

// Heat-glow gradient: a freshly forged SPN starts white-hot and cools to amber.
function glow(t: number): string {
  const c = Math.max(0, Math.min(1, t));
  const r = Math.round(255);
  const g = Math.round(80 + 175 * c);
  const b = Math.round(20 + 120 * c * c);
  return `\x1b[38;2;${r};${g};${b}m`;
}

// Host-based SPNs the local machine would register for each service class.
function forgeHostSpns(serviceClass: string): string[] {
  const pcSpn = Buffer.alloc(4);
  const prpszSpn = Buffer.alloc(8);
  const status = Ntdsapi.DsGetSpnW(DS_SPN_NAME_TYPE.DS_SPN_DNS_HOST, wide(serviceClass).ptr!, null, 0, 0, null, null, pcSpn.ptr, prpszSpn.ptr);
  if (status !== 0) return [];
  const count = pcSpn.readUInt32LE(0);
  const arrPtr = read.ptr(prpszSpn.ptr) as Pointer;
  if (!arrPtr || count === 0) return [];
  const arrBuf = Buffer.from(toArrayBuffer(arrPtr, 0, count * 8));
  const spns: string[] = [];
  for (let i = 0; i < count; i++) {
    const sp = readPtrAt(arrBuf, i * 8);
    if (sp) spns.push(readWideStringFromPtr(sp));
  }
  Ntdsapi.DsFreeSpnArrayW(count, arrPtr);
  return spns;
}

// Client-side target SPN: ServiceClass / ServiceName / ServiceName.
function forgeTargetSpn(serviceClass: string, serviceName: string): string | null {
  const len = Buffer.alloc(4);
  len.writeUInt32LE(512, 0);
  const out = Buffer.alloc(512 * 2);
  const status = Ntdsapi.DsClientMakeSpnForTargetServerW(wide(serviceClass).ptr!, wide(serviceName).ptr!, len.ptr, out.ptr!);
  if (status !== 0) return null;
  return out.toString('utf16le', 0, Math.max(0, len.readUInt32LE(0) - 1) * 2);
}

const SERVICE_CLASSES = ['HOST', 'HTTP', 'ldap', 'cifs', 'TERMSRV', 'MSSQLSvc', 'WSMAN', 'RPC'];
const targetHost = process.env.COMPUTERNAME ?? 'localhost';
const targetServer = targetHost + '.'; // rooted DNS name — resolves to this host offline

process.stdout.write(HIDE_CURSOR + CLEAR);
try {
  const anvil = [
    '         ___________',
    "        '._==_==_=_.'",
    '        .-\\:      /-.',
    '       | (|:.     |) |',
    "        '-|:.     |-'",
    '          \\::.    /',
    "           '::. .'",
    '             ) (',
    "           _.' '._",
    '          `"""""""""`',
  ];

  for (let frame = 0; frame < SERVICE_CLASSES.length; frame++) {
    const serviceClass = SERVICE_CLASSES[frame]!;
    const hostSpns = forgeHostSpns(serviceClass);
    const targetSpn = forgeTargetSpn(serviceClass, targetServer);

    let out = HOME;
    out += `${BOLD}${glow(1)}╔══ SPN FORGE ${'═'.repeat(48)}╗${RESET}\n`;

    // Anvil + sparks (sparks intensify with each strike).
    const sparks = '·•*✦✧'.repeat(8);
    for (let r = 0; r < anvil.length; r++) {
      const sparkLine = r < 3 ? Array.from({ length: (frame + 1) * 2 }, (_, k) => `${glow(1 - k / 12)}${sparks[(k + frame) % sparks.length]}`).join('') : '';
      out += `  ${glow(0.55)}${anvil[r]!.padEnd(26)}${RESET}  ${sparkLine}${RESET}\n`;
    }

    out += `${BOLD}${glow(0.9)}╟ strike ${frame + 1}/${SERVICE_CLASSES.length} · forging '${serviceClass}' SPNs for this host ${RESET}\n`;
    if (hostSpns.length === 0) {
      out += `  ${DIM}(no host-based SPN minted for '${serviceClass}')${RESET}\n`;
    } else {
      for (const spn of hostSpns) out += `  ${glow(1)}⚒ ${spn}${RESET}\n`;
    }
    out += `${BOLD}${glow(0.9)}╟ client target SPN → ${targetHost} ${RESET}\n`;
    out += targetSpn ? `  ${glow(0.85)}🗝  ${targetSpn}${RESET}\n` : `  ${DIM}(target SPN not forged)${RESET}\n`;
    out += `${BOLD}${glow(1)}╚${'═'.repeat(61)}╝${RESET}`;
    process.stdout.write(out + '\x1b[0J');
    await sleep(420);
  }

  // Mint and melt down an alternate-credential handle (the forge's signet key).
  const pAuth = Buffer.alloc(8);
  const minted = Ntdsapi.DsMakePasswordCredentialsW(wide('forge-smith').ptr!, wide('NORTHWIND').ptr!, wide('S3cr3t!').ptr!, pAuth.ptr);
  process.stdout.write('\n\n');
  if (minted === 0) {
    const handle = pAuth.readBigUInt64LE(0);
    console.log(`  ${glow(1)}${BOLD}🔥 credential signet struck${RESET}  handle 0x${handle.toString(16)}`);
    Ntdsapi.DsFreePasswordCredentials(handle);
    console.log(`  ${glow(0.4)}…and quenched. The forge goes cold.${RESET}`);
  } else {
    console.log(`  ${DIM}DsMakePasswordCredentialsW failed (error ${minted}).${RESET}`);
  }
} finally {
  process.stdout.write(SHOW_CURSOR + '\n');
}
