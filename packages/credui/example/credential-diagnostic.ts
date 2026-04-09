/**
 * Credential Diagnostic
 *
 * Runs a CredUI diagnostic sweep over several sample account names using both
 * ANSI and Unicode entry points. It reports parse results, packed-buffer sizes,
 * unpacked fields, and whether representative SSPI status codes would trigger
 * a follow-up credential prompt.
 *
 * APIs demonstrated:
 *   - CredPackAuthenticationBufferW   (pack Unicode credentials into an auth blob)
 *   - CredUIParseUserNameA            (parse ANSI account names)
 *   - CredUIParseUserNameW            (parse Unicode account names)
 *   - CredUnPackAuthenticationBufferW (recover Unicode user/domain/password fields)
 *   - SspiIsPromptingNeeded           (check whether an SSPI status should trigger credential UI)
 *
 * Run: bun run example/credential-diagnostic.ts
 */

import Credui, { CREDUI_MAX_PASSWORD_LENGTH, CREDUI_MAX_USERNAME_LENGTH } from '../index';

Credui.Preload(['CredPackAuthenticationBufferW', 'CredUIParseUserNameA', 'CredUIParseUserNameW', 'CredUnPackAuthenticationBufferW', 'SspiIsPromptingNeeded']);

const BOLD = '\x1b[1m';
const CYAN = '\x1b[96m';
const DIM = '\x1b[2m';
const GREEN = '\x1b[92m';
const RED = '\x1b[91m';
const RESET = '\x1b[0m';
const YELLOW = '\x1b[93m';

const scenarios = [
  { label: 'SAM-compatible', principal: 'CONTOSO\\alice', password: 'CorrectHorseBatteryStaple!' },
  { label: 'UPN-style', principal: 'alice@contoso.example', password: 'P@ssw0rd!23' },
  { label: 'Local-style', principal: 'build-agent', password: 'Ephemeral-Token-7' },
];

const statusSamples = [
  { name: 'SEC_E_LOGON_DENIED', value: 0x8009_030c },
  { name: 'SEC_E_NO_CREDENTIALS', value: 0x8009_030e },
  { name: 'SEC_E_SMARTCARD_LOGON_REQUIRED', value: 0x8009_033e },
  { name: 'SEC_I_CONTINUE_NEEDED', value: 0x0009_0312 },
  { name: 'STATUS_SUCCESS', value: 0x0000_0000 },
];

function encodeAnsi(value: string): Buffer {
  return Buffer.from(`${value}\0`, 'ascii');
}

function encodeWide(value: string): Buffer {
  return Buffer.from(`${value}\0`, 'utf16le');
}

function formatHex(value: number): string {
  return `0x${(value >>> 0).toString(16).padStart(8, '0')}`;
}

function normalizeField(value: string): string {
  return value.length > 0 ? value : '-';
}

function readAnsi(buffer: Buffer): string {
  return buffer.toString('ascii').replace(/\0.*$/, '');
}

function readWide(buffer: Buffer): string {
  return buffer.toString('utf16le').replace(/\0.*$/, '');
}

function parseAnsi(principal: string): { domain: string; status: number; user: string } {
  const principalBuffer = encodeAnsi(principal);
  const userBuffer = Buffer.alloc(CREDUI_MAX_USERNAME_LENGTH + 1);
  const domainBuffer = Buffer.alloc(CREDUI_MAX_USERNAME_LENGTH + 1);
  const status = Credui.CredUIParseUserNameA(principalBuffer.ptr, userBuffer.ptr, CREDUI_MAX_USERNAME_LENGTH + 1, domainBuffer.ptr, CREDUI_MAX_USERNAME_LENGTH + 1);

  return {
    domain: readAnsi(domainBuffer),
    status,
    user: readAnsi(userBuffer),
  };
}

function parseWide(principal: string): { domain: string; status: number; user: string } {
  const principalBuffer = encodeWide(principal);
  const userBuffer = Buffer.alloc((CREDUI_MAX_USERNAME_LENGTH + 1) * 2);
  const domainBuffer = Buffer.alloc((CREDUI_MAX_USERNAME_LENGTH + 1) * 2);
  const status = Credui.CredUIParseUserNameW(principalBuffer.ptr, userBuffer.ptr, CREDUI_MAX_USERNAME_LENGTH + 1, domainBuffer.ptr, CREDUI_MAX_USERNAME_LENGTH + 1);

  return {
    domain: readWide(domainBuffer),
    status,
    user: readWide(userBuffer),
  };
}

function roundTripWide(principal: string, password: string): { domain: string; packedSize: number; password: string; user: string } {
  const principalBuffer = encodeWide(principal);
  const passwordBuffer = encodeWide(password);
  const packedSizeBuffer = Buffer.alloc(4);

  void Credui.CredPackAuthenticationBufferW(0, principalBuffer.ptr, passwordBuffer.ptr, null, packedSizeBuffer.ptr);

  const packedSize = packedSizeBuffer.readUInt32LE(0);
  const packedBuffer = Buffer.alloc(packedSize);

  if (!Credui.CredPackAuthenticationBufferW(0, principalBuffer.ptr, passwordBuffer.ptr, packedBuffer.ptr, packedSizeBuffer.ptr)) {
    throw new Error(`CredPackAuthenticationBufferW failed for ${principal}.`);
  }

  const userBuffer = Buffer.alloc((CREDUI_MAX_USERNAME_LENGTH + 1) * 2);
  const domainBuffer = Buffer.alloc((CREDUI_MAX_USERNAME_LENGTH + 1) * 2);
  const passwordFieldBuffer = Buffer.alloc((CREDUI_MAX_PASSWORD_LENGTH + 1) * 2);
  const userSizeBuffer = Buffer.alloc(4);
  const domainSizeBuffer = Buffer.alloc(4);
  const passwordSizeBuffer = Buffer.alloc(4);

  userSizeBuffer.writeUInt32LE(CREDUI_MAX_USERNAME_LENGTH + 1, 0);
  domainSizeBuffer.writeUInt32LE(CREDUI_MAX_USERNAME_LENGTH + 1, 0);
  passwordSizeBuffer.writeUInt32LE(CREDUI_MAX_PASSWORD_LENGTH + 1, 0);

  if (!Credui.CredUnPackAuthenticationBufferW(0, packedBuffer.ptr, packedBuffer.length, userBuffer.ptr, userSizeBuffer.ptr, domainBuffer.ptr, domainSizeBuffer.ptr, passwordFieldBuffer.ptr, passwordSizeBuffer.ptr)) {
    throw new Error(`CredUnPackAuthenticationBufferW failed for ${principal}.`);
  }

  return {
    domain: readWide(domainBuffer),
    packedSize,
    password: readWide(passwordFieldBuffer),
    user: readWide(userBuffer),
  };
}

console.log('');
console.log(`${BOLD}${CYAN}CredUI Diagnostic Report${RESET}`);
console.log(`${DIM}Sample principals, pack/unpack round-trips, and SSPI prompt guidance.${RESET}`);
console.log('');

console.log(`${BOLD}Principal Parsing${RESET}`);
for (const scenario of scenarios) {
  const ansi = parseAnsi(scenario.principal);
  const wide = parseWide(scenario.principal);

  console.log(`${CYAN}${scenario.label}${RESET}`);
  console.log(`  Principal  ${scenario.principal}`);
  console.log(`  A status   ${formatHex(ansi.status)}   user=${normalizeField(ansi.user)}   domain=${normalizeField(ansi.domain)}`);
  console.log(`  W status   ${formatHex(wide.status)}   user=${normalizeField(wide.user)}   domain=${normalizeField(wide.domain)}`);
  console.log('');
}

console.log(`${BOLD}Round-Trip Packing${RESET}`);
for (const scenario of scenarios) {
  const wide = roundTripWide(scenario.principal, scenario.password);

  console.log(`${CYAN}${scenario.label}${RESET}`);
  console.log(`  W packed   ${String(wide.packedSize).padStart(4)} bytes   user=${normalizeField(wide.user)}   domain=${normalizeField(wide.domain)}   password=${wide.password}`);
  console.log('');
}

console.log(`${BOLD}SSPI Prompt Guidance${RESET}`);
for (const sample of statusSamples) {
  const shouldPrompt = Credui.SspiIsPromptingNeeded(sample.value);
  const indicator = shouldPrompt ? `${GREEN}yes${RESET}` : `${RED}no${RESET}`;
  console.log(`  ${sample.name.padEnd(31)} ${formatHex(sample.value)}   prompt=${indicator}`);
}
console.log('');
