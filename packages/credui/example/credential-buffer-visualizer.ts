/**
 * Credential Buffer Visualizer
 *
 * Packs a sample username and password into a CredUI authentication blob,
 * unpacks it back into its user/domain/password fields, and renders the raw
 * packed bytes as a colorized hex waterfall. The demo also parses the account
 * name the same way the Windows credential UI does.
 *
 * APIs demonstrated:
 *   - CredPackAuthenticationBufferW   (pack a username/password pair into a binary auth blob)
 *   - CredUIParseUserNameW            (split a SAM-compatible account name into user and domain parts)
 *   - CredUnPackAuthenticationBufferW (recover the packed username, domain, and password)
 *
 * Run: bun run example/credential-buffer-visualizer.ts
 */

import Credui, { CREDUI_MAX_PASSWORD_LENGTH, CREDUI_MAX_USERNAME_LENGTH } from '../index';

Credui.Preload(['CredPackAuthenticationBufferW', 'CredUIParseUserNameW', 'CredUnPackAuthenticationBufferW']);

const BLUE = '\x1b[94m';
const CYAN = '\x1b[96m';
const DIM = '\x1b[2m';
const GREEN = '\x1b[92m';
const MAGENTA = '\x1b[95m';
const RED = '\x1b[91m';
const RESET = '\x1b[0m';
const YELLOW = '\x1b[93m';

const principal = 'CONTOSO\\alice';
const password = 'CorrectHorseBatteryStaple!';

function encodeWide(value: string): Buffer {
  return Buffer.from(`${value}\0`, 'utf16le');
}

function readWide(buffer: Buffer): string {
  return buffer.toString('utf16le').replace(/\0.*$/, '');
}

function byteColor(value: number): string {
  if (value === 0) return DIM;
  if (value < 0x20) return BLUE;
  if (value < 0x80) return CYAN;
  if (value < 0xc0) return GREEN;
  if (value < 0xe0) return YELLOW;
  return MAGENTA;
}

const principalBuffer = encodeWide(principal);
const passwordBuffer = encodeWide(password);

const packedSizeBuffer = Buffer.alloc(4);
void Credui.CredPackAuthenticationBufferW(0, principalBuffer.ptr, passwordBuffer.ptr, null, packedSizeBuffer.ptr);

const packedSize = packedSizeBuffer.readUInt32LE(0);
if (packedSize === 0) {
  throw new Error('CredPackAuthenticationBufferW did not report a packed size.');
}

const packedBuffer = Buffer.alloc(packedSize);
if (!Credui.CredPackAuthenticationBufferW(0, principalBuffer.ptr, passwordBuffer.ptr, packedBuffer.ptr, packedSizeBuffer.ptr)) {
  throw new Error('CredPackAuthenticationBufferW failed to pack the sample credential.');
}

const parsedUserBuffer = Buffer.alloc((CREDUI_MAX_USERNAME_LENGTH + 1) * 2);
const parsedDomainBuffer = Buffer.alloc((CREDUI_MAX_USERNAME_LENGTH + 1) * 2);
const parseStatus = Credui.CredUIParseUserNameW(principalBuffer.ptr, parsedUserBuffer.ptr, CREDUI_MAX_USERNAME_LENGTH + 1, parsedDomainBuffer.ptr, CREDUI_MAX_USERNAME_LENGTH + 1);

const unpackedUserBuffer = Buffer.alloc((CREDUI_MAX_USERNAME_LENGTH + 1) * 2);
const unpackedDomainBuffer = Buffer.alloc((CREDUI_MAX_USERNAME_LENGTH + 1) * 2);
const unpackedPasswordBuffer = Buffer.alloc((CREDUI_MAX_PASSWORD_LENGTH + 1) * 2);
const unpackedUserSizeBuffer = Buffer.alloc(4);
const unpackedDomainSizeBuffer = Buffer.alloc(4);
const unpackedPasswordSizeBuffer = Buffer.alloc(4);

unpackedUserSizeBuffer.writeUInt32LE(CREDUI_MAX_USERNAME_LENGTH + 1, 0);
unpackedDomainSizeBuffer.writeUInt32LE(CREDUI_MAX_USERNAME_LENGTH + 1, 0);
unpackedPasswordSizeBuffer.writeUInt32LE(CREDUI_MAX_PASSWORD_LENGTH + 1, 0);

if (
  !Credui.CredUnPackAuthenticationBufferW(
    0,
    packedBuffer.ptr,
    packedBuffer.length,
    unpackedUserBuffer.ptr,
    unpackedUserSizeBuffer.ptr,
    unpackedDomainBuffer.ptr,
    unpackedDomainSizeBuffer.ptr,
    unpackedPasswordBuffer.ptr,
    unpackedPasswordSizeBuffer.ptr,
  )
) {
  throw new Error('CredUnPackAuthenticationBufferW failed to unpack the packed credential.');
}

const parsedUser = readWide(parsedUserBuffer);
const parsedDomain = readWide(parsedDomainBuffer);
const unpackedUser = readWide(unpackedUserBuffer);
const unpackedDomain = readWide(unpackedDomainBuffer);
const unpackedPassword = readWide(unpackedPasswordBuffer);

console.log('');
console.log(`${MAGENTA}+${'-'.repeat(76)}+${RESET}`);
console.log(`${MAGENTA}|${RESET} ${CYAN}Credential Buffer Visualizer${RESET}${' '.repeat(47)}${MAGENTA}|${RESET}`);
console.log(`${MAGENTA}|${RESET} ${DIM}packed with CredUI, rendered as a terminal byte waterfall${RESET}${' '.repeat(16)}${MAGENTA}|${RESET}`);
console.log(`${MAGENTA}+${'-'.repeat(76)}+${RESET}`);
console.log(`${MAGENTA}|${RESET} Principal        ${principal.padEnd(58)} ${MAGENTA}|${RESET}`);
console.log(`${MAGENTA}|${RESET} Parse status      0x${parseStatus.toString(16).padStart(8, '0')}${' '.repeat(56)}${MAGENTA}|${RESET}`);
console.log(`${MAGENTA}|${RESET} Parsed user       ${parsedUser.padEnd(58)} ${MAGENTA}|${RESET}`);
console.log(`${MAGENTA}|${RESET} Parsed domain     ${parsedDomain.padEnd(58)} ${MAGENTA}|${RESET}`);
console.log(`${MAGENTA}|${RESET} Packed length     ${String(packedBuffer.length).padEnd(58)} ${MAGENTA}|${RESET}`);
console.log(`${MAGENTA}+${'-'.repeat(76)}+${RESET}`);
console.log(`${MAGENTA}|${RESET} ${GREEN}Packed Buffer${RESET}${' '.repeat(62)}${MAGENTA}|${RESET}`);

for (let offset = 0; offset < packedBuffer.length; offset += 16) {
  const row = packedBuffer.subarray(offset, Math.min(offset + 16, packedBuffer.length));
  const hex = Array.from(row, (value) => `${byteColor(value)}${value.toString(16).padStart(2, '0')}${RESET}`).join(' ');
  const ascii = Array.from(row, (value) => (value >= 0x20 && value <= 0x7e ? String.fromCharCode(value) : '.')).join('');
  const padding = '   '.repeat(16 - row.length);
  console.log(`${MAGENTA}|${RESET} ${DIM}${offset.toString(16).padStart(4, '0')}${RESET}  ${hex}${padding}  ${YELLOW}${ascii.padEnd(16)}${RESET} ${MAGENTA}|${RESET}`);
}

console.log(`${MAGENTA}+${'-'.repeat(76)}+${RESET}`);
console.log(`${MAGENTA}|${RESET} ${GREEN}Round-Trip Fields${RESET}${' '.repeat(57)}${MAGENTA}|${RESET}`);
console.log(`${MAGENTA}|${RESET} User             ${unpackedUser.padEnd(58)} ${MAGENTA}|${RESET}`);
console.log(`${MAGENTA}|${RESET} Domain           ${unpackedDomain.padEnd(58)} ${MAGENTA}|${RESET}`);
console.log(`${MAGENTA}|${RESET} Password         ${RED}${unpackedPassword.padEnd(58)}${RESET} ${MAGENTA}|${RESET}`);
console.log(`${MAGENTA}+${'-'.repeat(76)}+${RESET}`);
console.log('');
