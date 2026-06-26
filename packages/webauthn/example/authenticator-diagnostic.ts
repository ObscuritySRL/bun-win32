/**
 * WebAuthn Authenticator Diagnostic — a full passkey-platform x-ray over pure FFI
 *
 * A headless, exhaustive report on the Windows WebAuthn / Windows Hello platform
 * built entirely from flat `webauthn.dll` exports. It reports the negotiated API
 * version and decodes the feature ladder it unlocks, asks the platform whether a
 * user-verifying platform authenticator (Windows Hello) is present, asks the DLL
 * itself to translate every documented WebAuthn `HRESULT` into its W3C
 * `DOMException` name and canonical W3C `HRESULT` (the platform is the source of
 * truth, not a hand-maintained table), exercises the cancellation channel with a
 * real `GetCancellationId` → `CancelCurrentOperation` round-trip, and finally
 * enumerates every passkey the platform authenticator has stored for the current
 * user — decoding the relying-party and user identity behind each credential.
 * Everything is rendered as aligned, color-coded ANSI tables.
 *
 * APIs demonstrated (Webauthn):
 *   - WebAuthNGetApiVersionNumber                          (negotiated API version)
 *   - WebAuthNIsUserVerifyingPlatformAuthenticatorAvailable (Windows Hello present?)
 *   - WebAuthNGetErrorName                                 (HRESULT → W3C error name)
 *   - WebAuthNGetW3CExceptionDOMError                      (HRESULT → W3C HRESULT)
 *   - WebAuthNGetCancellationId                            (allocate a cancel GUID)
 *   - WebAuthNCancelCurrentOperation                       (cancel round-trip)
 *   - WebAuthNGetPlatformCredentialList                    (enumerate stored passkeys)
 *   - WebAuthNFreePlatformCredentialList                   (release the list)
 *
 * APIs demonstrated (Kernel32, cross-package):
 *   - GetStdHandle / GetConsoleMode / SetConsoleMode      (enable ANSI VT output)
 *   - GetCurrentProcess / ReadProcessMemory               (walk returned structs)
 *
 * Run: bun run example/authenticator-diagnostic.ts
 */

import Webauthn, { WEBAUTHN_API_VERSION_1, WEBAUTHN_API_VERSION_2, WEBAUTHN_API_VERSION_3, WEBAUTHN_API_VERSION_4, WEBAUTHN_API_VERSION_7, WEBAUTHN_GET_CREDENTIALS_OPTIONS_CURRENT_VERSION } from '../index';
import Kernel32, { ConsoleMode, STD_HANDLE } from '@bun-win32/kernel32';

Webauthn.Preload([
  'WebAuthNGetApiVersionNumber',
  'WebAuthNIsUserVerifyingPlatformAuthenticatorAvailable',
  'WebAuthNGetErrorName',
  'WebAuthNGetW3CExceptionDOMError',
  'WebAuthNGetCancellationId',
  'WebAuthNCancelCurrentOperation',
  'WebAuthNGetPlatformCredentialList',
  'WebAuthNFreePlatformCredentialList',
]);
Kernel32.Preload(['GetStdHandle', 'GetConsoleMode', 'SetConsoleMode', 'GetCurrentProcess', 'ReadProcessMemory']);

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const CYAN = '\x1b[96m';
const BLUE = '\x1b[94m';
const GREEN = '\x1b[92m';
const YELLOW = '\x1b[93m';
const RED = '\x1b[91m';
const MAGENTA = '\x1b[95m';
const GRAY = '\x1b[90m';

const proc = Kernel32.GetCurrentProcess();

/** Copy `size` bytes from any in-process address into a local Buffer (cast-free). */
function readMem(address: bigint, size: number): Buffer {
  const buffer = Buffer.alloc(size);
  if (address !== 0n && size > 0) Kernel32.ReadProcessMemory(proc, address, buffer.ptr!, BigInt(size), null);
  return buffer;
}

/** Read a NUL-terminated UTF-16LE string starting at an arbitrary address. */
function readWideAt(address: bigint, maxChars = 512): string {
  if (address === 0n) return '';
  const bytes = readMem(address, maxChars * 2);
  let end = 0;
  while (end < bytes.length - 1 && bytes.readUInt16LE(end) !== 0) end += 2;
  return bytes.toString('utf16le', 0, end);
}

/** Decode the W3C error name for an HRESULT (the DLL owns the string). */
function errName(hr: number): string {
  const pointer = Webauthn.WebAuthNGetErrorName(hr | 0);
  return pointer ? readWideAt(BigInt(pointer)) || '(none)' : '(none)';
}

function enableAnsi(): void {
  const hStdout = Kernel32.GetStdHandle(STD_HANDLE.OUTPUT);
  const modeBuf = Buffer.alloc(4);
  if (Kernel32.GetConsoleMode(hStdout, modeBuf.ptr!)) {
    Kernel32.SetConsoleMode(hStdout, modeBuf.readUInt32LE(0) | ConsoleMode.ENABLE_VIRTUAL_TERMINAL_PROCESSING);
  }
}

function hex(hr: number): string {
  return '0x' + (hr >>> 0).toString(16).toUpperCase().padStart(8, '0');
}

function rule(width = 78): string {
  return GRAY + '─'.repeat(width) + RESET;
}

function header(title: string): void {
  console.log('\n' + BOLD + CYAN + title + RESET);
  console.log(rule());
}

enableAnsi();

console.log(BOLD + MAGENTA + '\n  ╔════════════════════════════════════════════════════════════════════════╗' + RESET);
console.log(BOLD + MAGENTA + '  ║' + RESET + BOLD + '          WebAuthn / Windows Hello — Authenticator Diagnostic           ' + MAGENTA + '║' + RESET);
console.log(BOLD + MAGENTA + '  ╚════════════════════════════════════════════════════════════════════════╝' + RESET);

// ── 1. API version + feature ladder ──────────────────────────────────────────
header('API Version');
const apiVersion = Webauthn.WebAuthNGetApiVersionNumber();
const ladder: Array<[number, string]> = [
  [WEBAUTHN_API_VERSION_1, 'Make/Get credential, attestation, client extensions'],
  [WEBAUTHN_API_VERSION_2, 'Cancellation ID + CancelCurrentOperation'],
  [WEBAUTHN_API_VERSION_3, 'Exclude-credential list, used-transport reporting'],
  [WEBAUTHN_API_VERSION_4, 'Enterprise attestation, large blob, resident-key pref'],
  [5, 'Browser in-private mode'],
  [6, 'PRF / hmac-secret extension'],
  [WEBAUTHN_API_VERSION_7, 'Hybrid linked device, JSON extensions'],
  [8, 'Credential hints, third-party payment, global PRF eval'],
  [9, 'Remote web origin, JSON creation options, authenticator id'],
];
console.log(`  Negotiated API version : ${BOLD}${GREEN}${apiVersion}${RESET}  ${DIM}(webauthn.dll)${RESET}`);
console.log('');
for (const [version, summary] of ladder) {
  const reached = apiVersion >= version;
  const mark = reached ? GREEN + '●' + RESET : GRAY + '○' + RESET;
  const tone = reached ? RESET : GRAY;
  console.log(`  ${mark} ${tone}v${version}${RESET}  ${tone}${summary}${RESET}`);
}

// ── 2. Platform authenticator availability ───────────────────────────────────
header('Platform Authenticator (Windows Hello)');
const availBuf = Buffer.alloc(4);
const availHr = Webauthn.WebAuthNIsUserVerifyingPlatformAuthenticatorAvailable(availBuf.ptr!);
const available = availBuf.readInt32LE(0) !== 0;
if (availHr === 0) {
  console.log(
    available ? `  ${GREEN}●${RESET} A user-verifying platform authenticator ${GREEN}${BOLD}is available${RESET} (Windows Hello / TPM-backed passkeys)` : `  ${YELLOW}○${RESET} No user-verifying platform authenticator on this device`,
  );
} else {
  console.log(`  ${RED}✗${RESET} Query failed: ${hex(availHr)} (${errName(availHr)})`);
}

// ── 3. HRESULT → W3C DOMException atlas (decoded by the platform itself) ──────
header('WebAuthn HRESULT → W3C DOMException Atlas');
const codes: Array<[string, number]> = [
  ['S_OK', 0x00000000],
  ['E_NOTIMPL', 0x80004001 | 0],
  ['E_OUTOFMEMORY', 0x8007000e | 0],
  ['E_INVALIDARG', 0x80070057 | 0],
  ['NTE_EXISTS', 0x8009000f | 0],
  ['NTE_BAD_KEYSET', 0x80090016 | 0],
  ['NTE_TOKEN_KEYSET_STORAGE_FULL', 0x80090023 | 0],
  ['NTE_INVALID_PARAMETER', 0x80090027 | 0],
  ['NTE_NOT_SUPPORTED', 0x80090029 | 0],
  ['NTE_DEVICE_NOT_FOUND', 0x80090035 | 0],
  ['NTE_USER_CANCELLED', 0x80090036 | 0],
  ['ERROR_CANCELLED→HRESULT', 0x800704c7 | 0],
  ['ERROR_TIMEOUT→HRESULT', 0x800705b4 | 0],
];
console.log(`  ${DIM}${'SYMBOL'.padEnd(28)} ${'HRESULT'.padEnd(12)} ${'W3C DOMException'.padEnd(22)} W3C HRESULT${RESET}`);
for (const [symbol, code] of codes) {
  const name = errName(code);
  const w3c = Webauthn.WebAuthNGetW3CExceptionDOMError(code);
  const tone = code === 0 ? GREEN : name.includes('NotAllowed') ? YELLOW : name.includes('NotSupported') ? BLUE : RED;
  console.log(`  ${symbol.padEnd(28)} ${GRAY}${hex(code)}${RESET} ${tone}${name.padEnd(22)}${RESET} ${GRAY}${hex(w3c)}${RESET}`);
}

// ── 4. Cancellation channel round-trip ───────────────────────────────────────
header('Cancellation Channel');
const guid = Buffer.alloc(16);
const cidHr = Webauthn.WebAuthNGetCancellationId(guid.ptr!);
if (cidHr === 0) {
  const d1 = guid.readUInt32LE(0).toString(16).padStart(8, '0');
  const d2 = guid.readUInt16LE(4).toString(16).padStart(4, '0');
  const d3 = guid.readUInt16LE(6).toString(16).padStart(4, '0');
  const d4 = guid.subarray(8, 10).toString('hex');
  const d5 = guid.subarray(10, 16).toString('hex');
  console.log(`  ${GREEN}●${RESET} Allocated cancellation id : ${BOLD}{${d1}-${d2}-${d3}-${d4}-${d5}}${RESET}`);
  const cancelHr = Webauthn.WebAuthNCancelCurrentOperation(guid.ptr!);
  console.log(`  ${GREEN}●${RESET} CancelCurrentOperation     : ${hex(cancelHr)} ${DIM}(${errName(cancelHr)})${RESET}`);
} else {
  console.log(`  ${RED}✗${RESET} GetCancellationId failed: ${hex(cidHr)} (${errName(cidHr)})`);
}

// ── 5. Stored platform credential (passkey) inventory ────────────────────────
header('Stored Platform Credentials (Passkeys)');

// WEBAUTHN_GET_CREDENTIALS_OPTIONS { DWORD dwVersion; LPCWSTR pwszRpId; BOOL bBrowserInPrivateMode; }
// pwszRpId left NULL → enumerate passkeys across every relying party.
const options = Buffer.alloc(24);
options.writeUInt32LE(WEBAUTHN_GET_CREDENTIALS_OPTIONS_CURRENT_VERSION, 0);
const listOut = Buffer.alloc(8);

const listHr = Webauthn.WebAuthNGetPlatformCredentialList(options.ptr!, listOut.ptr!);
if (listHr !== 0) {
  console.log(`  ${YELLOW}○${RESET} No enumerable platform credentials — ${hex(listHr)} ${DIM}(${errName(listHr)})${RESET}`);
  console.log(`  ${DIM}This is expected when no passkeys are stored, or enumeration is not permitted${RESET}`);
} else {
  const listAddr = listOut.readBigUInt64LE(0);
  if (listAddr === 0n) {
    console.log(`  ${YELLOW}○${RESET} Platform returned an empty credential list`);
  } else {
    // WEBAUTHN_CREDENTIAL_DETAILS_LIST { DWORD cCredentialDetails; PWEBAUTHN_CREDENTIAL_DETAILS *ppCredentialDetails; }
    const listHead = readMem(listAddr, 16);
    const count = listHead.readUInt32LE(0);
    const arrayAddr = listHead.readBigUInt64LE(8);
    console.log(`  ${GREEN}●${RESET} ${BOLD}${count}${RESET} stored passkey${count === 1 ? '' : 's'}\n`);
    for (let i = 0; i < count; i++) {
      const detailAddr = readMem(arrayAddr + BigInt(i * 8), 8).readBigUInt64LE(0);
      if (detailAddr === 0n) continue;
      // WEBAUTHN_CREDENTIAL_DETAILS: dwVersion@0 cbCredentialID@4 pbCredentialID@8
      //   pRpInformation@16 pUserInformation@24 bRemovable@32 (v2: bBackedUp@36)
      const detail = readMem(detailAddr, 40);
      const detailVer = detail.readUInt32LE(0);
      const credIdLen = detail.readUInt32LE(4);
      const credIdAddr = detail.readBigUInt64LE(8);
      const rpAddr = detail.readBigUInt64LE(16);
      const userAddr = detail.readBigUInt64LE(24);
      const removable = detail.readInt32LE(32) !== 0;
      const backedUp = detailVer >= 2 ? detail.readInt32LE(36) !== 0 : false;
      const credId = credIdLen > 0 ? readMem(credIdAddr, Math.min(credIdLen, 64)) : Buffer.alloc(0);

      // WEBAUTHN_RP_ENTITY_INFORMATION: dwVersion@0 pwszId@8 pwszName@16 pwszIcon@24
      const rp = rpAddr !== 0n ? readMem(rpAddr, 32) : Buffer.alloc(32);
      const rpId = readWideAt(rp.readBigUInt64LE(8));
      const rpName = readWideAt(rp.readBigUInt64LE(16));
      // WEBAUTHN_USER_ENTITY_INFORMATION: dwVersion@0 cbId@4 pbId@8 pwszName@16 pwszIcon@24 pwszDisplayName@32
      const user = userAddr !== 0n ? readMem(userAddr, 40) : Buffer.alloc(40);
      const userName = readWideAt(user.readBigUInt64LE(16));
      const userDisplay = readWideAt(user.readBigUInt64LE(32));

      const idHex = credId.length ? credId.toString('hex').toUpperCase() : '(none)';
      const idShown = idHex.length > 32 ? idHex.slice(0, 32) + GRAY + '…' + RESET : idHex;
      console.log(`  ${BOLD}${BLUE}[${i + 1}]${RESET} ${BOLD}${rpName || rpId || '(unknown RP)'}${RESET}`);
      console.log(`      ${DIM}relying party${RESET} : ${CYAN}${rpId || '—'}${RESET}`);
      console.log(`      ${DIM}user         ${RESET} : ${userDisplay || userName || '—'} ${GRAY}${userName && userDisplay ? '(' + userName + ')' : ''}${RESET}`);
      console.log(`      ${DIM}credential id${RESET} : ${GRAY}${idShown}${RESET} ${DIM}(${credIdLen} bytes)${RESET}`);
      console.log(`      ${DIM}attributes   ${RESET} : ${removable ? GREEN + 'removable' : YELLOW + 'non-removable'}${RESET}` + `${DIM} · ${RESET}${backedUp ? GREEN + 'backed up (synced)' : GRAY + 'device-bound'}${RESET}\n`);
    }
    Webauthn.WebAuthNFreePlatformCredentialList(listAddr);
    console.log(`  ${DIM}list released via WebAuthNFreePlatformCredentialList${RESET}`);
  }
}

console.log('\n' + rule());
console.log(`${DIM}  webauthn.dll · ${codes.length} HRESULTs decoded by the platform · pure Bun FFI, zero native deps${RESET}\n`);
