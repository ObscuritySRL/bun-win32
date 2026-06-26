/**
 * Passkey Ceremony — a real FIDO2 registration + assertion over pure FFI
 *
 * Drives an end-to-end WebAuthn ceremony against the Windows platform
 * authenticator entirely from `webauthn.dll`, with zero native build step.
 * It hand-assembles every real Win32 WebAuthn struct in `Buffer`s — the
 * relying-party and user entities, a genuine `clientDataJSON` over a random
 * 32-byte challenge, the COSE algorithm preference list, and the
 * make-credential options — then calls `WebAuthNAuthenticatorMakeCredential`,
 * which raises the actual Windows Hello prompt. The returned attestation is
 * decoded straight out of native memory: the attestation format, the
 * authenticator-data flag bits, the signature counter, the AAGUID, and the new
 * credential id rendered as a deterministic colored identicon. It then calls
 * `WebAuthNAuthenticatorGetAssertion` to make that fresh passkey sign a new
 * challenge, and paints the returned signature as a live ANSI waveform.
 * The transport constellation animates while the user verifies with Hello.
 *
 * APIs demonstrated (Webauthn):
 *   - WebAuthNAuthenticatorMakeCredential   (register a passkey via Windows Hello)
 *   - WebAuthNAuthenticatorGetAssertion     (sign a challenge with the passkey)
 *   - WebAuthNFreeCredentialAttestation     (release the attestation)
 *   - WebAuthNFreeAssertion                 (release the assertion)
 *   - WebAuthNGetErrorName                  (decode any failure HRESULT)
 *
 * APIs demonstrated (Kernel32, cross-package):
 *   - GetStdHandle / GetConsoleMode / SetConsoleMode  (enable ANSI VT output)
 *   - GetConsoleWindow                                (parent HWND for the prompt)
 *   - GetCurrentProcess / ReadProcessMemory           (decode native attestation)
 *
 * APIs demonstrated (User32, cross-package):
 *   - GetForegroundWindow                             (HWND fallback)
 *
 * Run: bun run example/passkey-ceremony.ts
 */

import { randomBytes } from 'node:crypto';

import Webauthn, {
  WEBAUTHN_API_CURRENT_VERSION,
  WEBAUTHN_ATTESTATION_CONVEYANCE_PREFERENCE_NONE,
  WEBAUTHN_AUTHENTICATOR_ATTACHMENT_PLATFORM,
  WEBAUTHN_AUTHENTICATOR_GET_ASSERTION_OPTIONS_VERSION_1,
  WEBAUTHN_AUTHENTICATOR_MAKE_CREDENTIAL_OPTIONS_VERSION_1,
  WEBAUTHN_CLIENT_DATA_CURRENT_VERSION,
  WEBAUTHN_COSE_ALGORITHM_ECDSA_P256_WITH_SHA256,
  WEBAUTHN_COSE_ALGORITHM_RSASSA_PKCS1_V1_5_WITH_SHA256,
  WEBAUTHN_COSE_CREDENTIAL_PARAMETER_CURRENT_VERSION,
  WEBAUTHN_CREDENTIAL_TYPE_PUBLIC_KEY,
  WEBAUTHN_HASH_ALGORITHM_SHA_256,
  WEBAUTHN_RP_ENTITY_INFORMATION_CURRENT_VERSION,
  WEBAUTHN_USER_ENTITY_INFORMATION_CURRENT_VERSION,
  WEBAUTHN_USER_VERIFICATION_REQUIREMENT_REQUIRED,
} from '../index';
import Kernel32, { ConsoleMode, STD_HANDLE } from '@bun-win32/kernel32';
import User32 from '@bun-win32/user32';

Webauthn.Preload(['WebAuthNAuthenticatorMakeCredential', 'WebAuthNAuthenticatorGetAssertion', 'WebAuthNFreeCredentialAttestation', 'WebAuthNFreeAssertion', 'WebAuthNGetErrorName']);
Kernel32.Preload(['GetStdHandle', 'GetConsoleMode', 'SetConsoleMode', 'GetConsoleWindow', 'GetCurrentProcess', 'ReadProcessMemory']);

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

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/** Copy `size` bytes from any in-process address into a local Buffer (cast-free). */
function readMem(address: bigint, size: number): Buffer {
  const buffer = Buffer.alloc(size);
  if (address !== 0n && size > 0) Kernel32.ReadProcessMemory(proc, address, buffer.ptr!, BigInt(size), null);
  return buffer;
}

/** Read a NUL-terminated UTF-16LE string starting at an arbitrary address. */
function readWideAt(address: bigint, maxChars = 256): string {
  if (address === 0n) return '';
  const bytes = readMem(address, maxChars * 2);
  let end = 0;
  while (end < bytes.length - 1 && bytes.readUInt16LE(end) !== 0) end += 2;
  return bytes.toString('utf16le', 0, end);
}

/** Decode the W3C error name for an HRESULT (the DLL owns the string). */
function errName(hr: number): string {
  const pointer = Webauthn.WebAuthNGetErrorName(hr | 0);
  return (pointer ? readWideAt(BigInt(pointer)) : '') || '(none)';
}

function enableAnsi(): void {
  const hStdout = Kernel32.GetStdHandle(STD_HANDLE.OUTPUT);
  const modeBuf = Buffer.alloc(4);
  if (Kernel32.GetConsoleMode(hStdout, modeBuf.ptr!)) {
    Kernel32.SetConsoleMode(hStdout, modeBuf.readUInt32LE(0) | ConsoleMode.ENABLE_VIRTUAL_TERMINAL_PROCESSING);
  }
}

const wide = (text: string): Buffer => Buffer.from(text + '\0', 'utf16le');

const b64url = (buf: Buffer): string => buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

function banner(): void {
  console.log(BOLD + MAGENTA + '\n  ╔══════════════════════════════════════════════════════════════════════╗' + RESET);
  console.log(BOLD + MAGENTA + '  ║' + RESET + BOLD + '        Passkey Ceremony — native FIDO2 over pure Bun FFI             ' + MAGENTA + '║' + RESET);
  console.log(BOLD + MAGENTA + '  ╚══════════════════════════════════════════════════════════════════════╝' + RESET);
}

const TRANSPORTS = ['USB', 'NFC', 'BLE', 'HYBRID', 'SMART-CARD', 'INTERNAL'];

async function constellation(frames: number): Promise<void> {
  for (let f = 0; f < frames; f++) {
    const pulse = f % TRANSPORTS.length;
    const row = TRANSPORTS.map((name, i) => {
      const isPlatform = name === 'INTERNAL';
      if (i === pulse && isPlatform) return BOLD + GREEN + `◉ ${name}` + RESET;
      if (isPlatform) return GREEN + `◉ ${name}` + RESET;
      return i === pulse ? CYAN + `◍ ${name}` + RESET : GRAY + `○ ${name}` + RESET;
    }).join(GRAY + '  ──  ' + RESET);
    process.stdout.write('\r  ' + row + '   ');
    await sleep(70);
  }
  process.stdout.write('\n');
}

function identicon(seed: Buffer): string[] {
  // Deterministic 5x10 colored grid mirrored horizontally — a credential fingerprint.
  const palette = [BLUE, CYAN, GREEN, MAGENTA, YELLOW];
  const color = palette[(seed[0] ?? 0) % palette.length]!;
  const rows: string[] = [];
  for (let y = 0; y < 5; y++) {
    let line = '';
    for (let x = 0; x < 5; x++) {
      const bit = (seed[(y * 5 + x) % seed.length] ?? 0) >> (x % 7);
      line += bit & 1 ? color + '██' + RESET : GRAY + '··' + RESET;
    }
    rows.push('      ' + line + line.split('').reverse().join(''));
  }
  return rows;
}

async function spinner(label: string, work: () => number, ms = 90): Promise<number> {
  const glyphs = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let hr = 0x7fffffff;
  let done = false;
  const task = (async () => {
    hr = work();
    done = true;
  })();
  let i = 0;
  while (!done) {
    process.stdout.write(`\r  ${YELLOW}${glyphs[i++ % glyphs.length]}${RESET} ${label} `);
    await sleep(ms);
  }
  await task;
  process.stdout.write('\r' + ' '.repeat(label.length + 8) + '\r');
  return hr;
}

function decodeFlags(flags: number): string {
  const bits: Array<[number, string]> = [
    [0x01, 'UP (user present)'],
    [0x04, 'UV (user verified)'],
    [0x08, 'BE (backup eligible)'],
    [0x10, 'BS (backed up)'],
    [0x40, 'AT (attested cred data)'],
    [0x80, 'ED (extension data)'],
  ];
  return (
    bits
      .filter(([mask]) => (flags & mask) !== 0)
      .map(([, label]) => GREEN + label + RESET)
      .join(DIM + ' · ' + RESET) || GRAY + 'none' + RESET
  );
}

async function main(): Promise<void> {
  enableAnsi();
  banner();

  // Resolve a top-level parent window for the Hello dialog.
  let hWnd = Kernel32.GetConsoleWindow();
  if (hWnd === 0n) hWnd = User32.GetForegroundWindow();
  console.log(`\n  ${DIM}parent HWND${RESET} : ${GRAY}0x${hWnd.toString(16)}${RESET}   ${DIM}WebAuthn API v${WEBAUTHN_API_CURRENT_VERSION}${RESET}`);

  // Animate the transport constellation up front. Every WebAuthn struct is
  // assembled *after* this — there are no awaits between struct assembly and
  // the synchronous blocking FFI call, so the addresses baked into the parent
  // structs cannot be invalidated by a GC cycle mid-animation.
  await constellation(18);

  const RP_ID = 'bun-win32.dev';
  const RP_NAME = '@bun-win32/webauthn demo';
  const userId = randomBytes(16);
  const userName = 'passkey.demo@bun-win32.dev';
  const userDisplay = 'Bun FFI Passkey Demo';

  // ── WEBAUTHN_RP_ENTITY_INFORMATION (dwVersion@0 pwszId@8 pwszName@16 pwszIcon@24)
  const wRpId = wide(RP_ID);
  const wRpName = wide(RP_NAME);
  const rp = Buffer.alloc(32);
  rp.writeUInt32LE(WEBAUTHN_RP_ENTITY_INFORMATION_CURRENT_VERSION, 0);
  rp.writeBigUInt64LE(BigInt(wRpId.ptr!), 8);
  rp.writeBigUInt64LE(BigInt(wRpName.ptr!), 16);

  // ── WEBAUTHN_USER_ENTITY_INFORMATION (dwVersion@0 cbId@4 pbId@8 pwszName@16 pwszIcon@24 pwszDisplayName@32)
  const wUserName = wide(userName);
  const wUserDisplay = wide(userDisplay);
  const user = Buffer.alloc(40);
  user.writeUInt32LE(WEBAUTHN_USER_ENTITY_INFORMATION_CURRENT_VERSION, 0);
  user.writeUInt32LE(userId.length, 4);
  user.writeBigUInt64LE(BigInt(userId.ptr!), 8);
  user.writeBigUInt64LE(BigInt(wUserName.ptr!), 16);
  user.writeBigUInt64LE(BigInt(wUserDisplay.ptr!), 32);

  // ── clientDataJSON + WEBAUTHN_CLIENT_DATA (dwVersion@0 cb@4 pb@8 pwszHashAlgId@16)
  const challenge = randomBytes(32);
  const clientJson = Buffer.from(JSON.stringify({ type: 'webauthn.create', challenge: b64url(challenge), origin: `https://${RP_ID}`, crossOrigin: false }), 'utf8');
  const wHash = wide(WEBAUTHN_HASH_ALGORITHM_SHA_256);
  const clientData = Buffer.alloc(24);
  clientData.writeUInt32LE(WEBAUTHN_CLIENT_DATA_CURRENT_VERSION, 0);
  clientData.writeUInt32LE(clientJson.length, 4);
  clientData.writeBigUInt64LE(BigInt(clientJson.ptr!), 8);
  clientData.writeBigUInt64LE(BigInt(wHash.ptr!), 16);

  // ── COSE param array: ES256 then RS256 (each WEBAUTHN_COSE_CREDENTIAL_PARAMETER = 24 bytes)
  const wPubKey = wide(WEBAUTHN_CREDENTIAL_TYPE_PUBLIC_KEY);
  const algorithms = [WEBAUTHN_COSE_ALGORITHM_ECDSA_P256_WITH_SHA256, WEBAUTHN_COSE_ALGORITHM_RSASSA_PKCS1_V1_5_WITH_SHA256];
  const params = Buffer.alloc(24 * algorithms.length);
  algorithms.forEach((alg, i) => {
    params.writeUInt32LE(WEBAUTHN_COSE_CREDENTIAL_PARAMETER_CURRENT_VERSION, i * 24 + 0);
    params.writeBigUInt64LE(BigInt(wPubKey.ptr!), i * 24 + 8);
    params.writeInt32LE(alg, i * 24 + 16);
  });
  // WEBAUTHN_COSE_CREDENTIAL_PARAMETERS { cCredentialParameters@0 pCredentialParameters@8 }
  const coseParams = Buffer.alloc(16);
  coseParams.writeUInt32LE(algorithms.length, 0);
  coseParams.writeBigUInt64LE(BigInt(params.ptr!), 8);

  // ── WEBAUTHN_AUTHENTICATOR_MAKE_CREDENTIAL_OPTIONS (V1: 64 bytes, zeroed)
  const makeOpts = Buffer.alloc(64);
  makeOpts.writeUInt32LE(WEBAUTHN_AUTHENTICATOR_MAKE_CREDENTIAL_OPTIONS_VERSION_1, 0);
  makeOpts.writeUInt32LE(60_000, 4); // dwTimeoutMilliseconds
  makeOpts.writeUInt32LE(WEBAUTHN_AUTHENTICATOR_ATTACHMENT_PLATFORM, 40);
  makeOpts.writeUInt32LE(1, 44); // bRequireResidentKey -> discoverable passkey
  makeOpts.writeUInt32LE(WEBAUTHN_USER_VERIFICATION_REQUIREMENT_REQUIRED, 48);
  makeOpts.writeUInt32LE(WEBAUTHN_ATTESTATION_CONVEYANCE_PREFERENCE_NONE, 52);

  console.log(`\n  ${BOLD}Relying party${RESET} : ${CYAN}${RP_ID}${RESET}  ${DIM}(${RP_NAME})${RESET}`);
  console.log(`  ${BOLD}User${RESET}          : ${userDisplay} ${GRAY}<${userName}>${RESET}`);
  console.log(`  ${BOLD}Challenge${RESET}     : ${GRAY}${b64url(challenge).slice(0, 43)}${RESET}`);
  console.log(`  ${BOLD}Algorithms${RESET}    : ${GREEN}ES256${RESET}${DIM}, ${RESET}${GREEN}RS256${RESET}\n`);

  console.log(`  ${BOLD}${YELLOW}▶ Approve the Windows Hello prompt to mint the passkey…${RESET}\n`);

  const attOut = Buffer.alloc(8);
  const makeHr = await spinner('Awaiting Windows Hello (MakeCredential)…', () => Webauthn.WebAuthNAuthenticatorMakeCredential(hWnd, rp.ptr!, user.ptr!, coseParams.ptr!, clientData.ptr!, makeOpts.ptr!, attOut.ptr!));

  if (makeHr !== 0) {
    console.log(`  ${RED}✗ MakeCredential failed${RESET} : 0x${(makeHr >>> 0).toString(16).toUpperCase()} ${DIM}(${errName(makeHr)})${RESET}`);
    console.log(`  ${DIM}Common outcomes: NotAllowedError (cancelled / timed out), NotSupportedError (no Hello).${RESET}\n`);
    return;
  }

  const attAddr = attOut.readBigUInt64LE(0);
  // WEBAUTHN_CREDENTIAL_ATTESTATION: pwszFormatType@8 cbAuthData@16 pbAuthData@24
  //   cbAttestation@32 pbAttestation@40 cbAttObj@64 pbAttObj@72 cbCredId@80 pbCredId@88
  const att = readMem(attAddr, 96);
  const formatType = readWideAt(att.readBigUInt64LE(8));
  const cbAuthData = att.readUInt32LE(16);
  const authData = readMem(att.readBigUInt64LE(24), cbAuthData);
  const cbAttObj = att.readUInt32LE(64);
  const cbCredId = att.readUInt32LE(80);
  const credId = readMem(att.readBigUInt64LE(88), cbCredId);

  // Authenticator data: rpIdHash[32] flags[1] signCount[4] aaguid[16] credIdLen[2] ...
  const flags = authData[32] ?? 0;
  const signCount = authData.length >= 37 ? authData.readUInt32BE(33) : 0;
  const aaguid = authData.subarray(37, 53);
  const aaguidStr = `${aaguid.subarray(0, 4).toString('hex')}-${aaguid.subarray(4, 6).toString('hex')}-${aaguid.subarray(6, 8).toString('hex')}-${aaguid.subarray(8, 10).toString('hex')}-${aaguid.subarray(10, 16).toString('hex')}`;

  console.log(`  ${BOLD}${GREEN}✔ Passkey minted${RESET}\n`);
  console.log(`  ${DIM}attestation fmt${RESET} : ${BOLD}${formatType || 'none'}${RESET}`);
  console.log(`  ${DIM}auth-data flags${RESET} : ${decodeFlags(flags)} ${GRAY}(0x${flags.toString(16).padStart(2, '0')})${RESET}`);
  console.log(`  ${DIM}signature count${RESET} : ${signCount}`);
  console.log(`  ${DIM}AAGUID         ${RESET} : ${CYAN}${aaguidStr}${RESET}`);
  console.log(`  ${DIM}attestation obj${RESET} : ${cbAttObj} bytes   ${DIM}credential id${RESET} : ${cbCredId} bytes`);
  console.log(`  ${DIM}credential id  ${RESET} : ${GRAY}${credId.toString('hex').toUpperCase().slice(0, 48)}…${RESET}\n`);
  console.log(`  ${BOLD}Credential identicon${RESET}`);
  for (const line of identicon(credId)) console.log(line);
  console.log('');

  // ── Assertion: make that fresh passkey sign a new challenge ────────────────
  const authChallenge = randomBytes(32);
  const authJson = Buffer.from(JSON.stringify({ type: 'webauthn.get', challenge: b64url(authChallenge), origin: `https://${RP_ID}`, crossOrigin: false }), 'utf8');
  const authClientData = Buffer.alloc(24);
  authClientData.writeUInt32LE(WEBAUTHN_CLIENT_DATA_CURRENT_VERSION, 0);
  authClientData.writeUInt32LE(authJson.length, 4);
  authClientData.writeBigUInt64LE(BigInt(authJson.ptr!), 8);
  authClientData.writeBigUInt64LE(BigInt(wHash.ptr!), 16);

  const wRpIdAuth = wide(RP_ID);

  // WEBAUTHN_AUTHENTICATOR_GET_ASSERTION_OPTIONS V1 (56 bytes, zeroed):
  // dwVersion@0 dwTimeout@4 CredentialList@8 Extensions@24 attachment@40 uv@44 flags@48.
  // An empty credential list performs a discoverable lookup by RP id.
  const getOpts = Buffer.alloc(56);
  getOpts.writeUInt32LE(WEBAUTHN_AUTHENTICATOR_GET_ASSERTION_OPTIONS_VERSION_1, 0);
  getOpts.writeUInt32LE(60_000, 4);
  getOpts.writeUInt32LE(WEBAUTHN_USER_VERIFICATION_REQUIREMENT_REQUIRED, 44);
  const asnOut = Buffer.alloc(8);

  console.log(`  ${BOLD}${YELLOW}▶ Approve Windows Hello again to sign a fresh challenge…${RESET}\n`);
  const getHr = await spinner('Awaiting Windows Hello (GetAssertion)…', () => Webauthn.WebAuthNAuthenticatorGetAssertion(hWnd, wRpIdAuth.ptr!, authClientData.ptr!, getOpts.ptr!, asnOut.ptr!));

  if (getHr !== 0) {
    console.log(`  ${RED}✗ GetAssertion failed${RESET} : 0x${(getHr >>> 0).toString(16).toUpperCase()} ${DIM}(${errName(getHr)})${RESET}\n`);
  } else {
    const asnAddr = asnOut.readBigUInt64LE(0);
    // WEBAUTHN_ASSERTION: cbAuthData@4 pbAuthData@8 cbSig@16 pbSig@24 Credential.cbId@36 pbId@40
    const asn = readMem(asnAddr, 72);
    const cbAuth = asn.readUInt32LE(4);
    const cbSig = asn.readUInt32LE(16);
    const sig = readMem(asn.readBigUInt64LE(24), cbSig);
    const credLen = asn.readUInt32LE(36);

    console.log(`  ${BOLD}${GREEN}✔ Challenge signed by the passkey${RESET}\n`);
    console.log(`  ${DIM}authenticator data${RESET} : ${cbAuth} bytes`);
    console.log(`  ${DIM}credential echoed ${RESET} : ${credLen} bytes ${GRAY}(matches: ${credLen === cbCredId ? GREEN + 'yes' : RED + 'no'}${GRAY})${RESET}`);
    console.log(`  ${DIM}signature         ${RESET} : ${cbSig} bytes (DER ECDSA / PKCS#1)\n`);

    // Signature waveform: map every byte to a vertical bar.
    const bars = '▁▂▃▄▅▆▇█';
    let wave = '      ';
    for (let i = 0; i < Math.min(sig.length, 64); i++) {
      const h = bars[Math.floor(((sig[i] ?? 0) / 255) * (bars.length - 1))]!;
      wave += (i % 8 < 4 ? CYAN : BLUE) + h + RESET;
    }
    console.log(`  ${BOLD}Signature waveform${RESET}`);
    console.log(wave + '\n');

    Webauthn.WebAuthNFreeAssertion(asnAddr);
  }

  Webauthn.WebAuthNFreeCredentialAttestation(attAddr);
  console.log(`  ${DIM}native attestation + assertion released · pure Bun FFI, zero native deps${RESET}\n`);
}

await main();
