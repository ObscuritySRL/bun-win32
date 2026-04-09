/**
 * System Credential Dialog
 *
 * Opens the real Windows credential provider dialog through CredUI. Depending on
 * the local machine, the user may see password, PIN, Windows Hello, smart card,
 * or other installed credential-provider tiles. After the prompt closes, the
 * example reports the selected authentication package, whether Save was checked,
 * and whether the returned credential blob could be unpacked into string fields.
 *
 * Pass --generic to request a plain user name/password result.
 * Pass --secure to request the secure desktop.
 * Pass --hello-smart-card to request Windows Hello credentials in a smart-card buffer.
 * Pass --dry-run to print the selected flags without opening the dialog.
 *
 * APIs demonstrated:
 *   - CredUIPromptForWindowsCredentialsW (show the Windows credential provider dialog)
 *   - CredUnPackAuthenticationBufferW    (decode the returned credential blob when supported)
 *   - Kernel32.GetLastError              (inspect unpack failures)
 *   - ole32.CoTaskMemFree                (free the credential blob allocated by CredUI)
 *
 * Run: bun run example/system-credential-dialog.ts
 */

import { dlopen, type FFIFunction, FFIType, read, type Pointer, toArrayBuffer } from 'bun:ffi';

import Kernel32 from '@bun-win32/kernel32';

import Credui, { CredPackFlags, CredUIWindowsFlags, CREDUI_MAX_PASSWORD_LENGTH, CREDUI_MAX_USERNAME_LENGTH } from '../index';

Credui.Preload(['CredUIPromptForWindowsCredentialsW', 'CredUnPackAuthenticationBufferW']);
Kernel32.Preload(['GetLastError']);

const Ole32 = dlopen('ole32.dll', {
  CoTaskMemFree: { args: [FFIType.ptr], returns: FFIType.void },
} as const satisfies Record<string, FFIFunction>);

const BOLD = '\x1b[1m';
const CYAN = '\x1b[96m';
const DIM = '\x1b[2m';
const GREEN = '\x1b[92m';
const RED = '\x1b[91m';
const RESET = '\x1b[0m';
const YELLOW = '\x1b[93m';

const ERROR_CANCELLED = 0x0000_04c7;
const ERROR_SUCCESS = 0x0000_0000;

interface UnpackFailure {
  errorCode: number;
  unpackFlags: number;
}

interface UnpackSuccess {
  domain: string;
  passwordLength: number;
  unpackFlags: number;
  user: string;
}

function createCredUiInfo(captionText: string, messageText: string) {
  const captionBuffer = encodeWide(captionText);
  const messageBuffer = encodeWide(messageText);
  const credUiInfoBuffer = Buffer.alloc(40);

  // CREDUI_INFOW on x64: cbSize (4), padding (4), hwndParent (8), pszMessageText (8), pszCaptionText (8), hbmBanner (8)
  credUiInfoBuffer.writeUInt32LE(40, 0);
  credUiInfoBuffer.writeBigUInt64LE(0n, 8);
  credUiInfoBuffer.writeBigUInt64LE(BigInt(messageBuffer.ptr), 16);
  credUiInfoBuffer.writeBigUInt64LE(BigInt(captionBuffer.ptr), 24);
  credUiInfoBuffer.writeBigUInt64LE(0n, 32);

  return {
    buffer: credUiInfoBuffer,
    captionBuffer,
    messageBuffer,
  };
}

function encodeWide(value: string): Buffer {
  return Buffer.from(`${value}\0`, 'utf16le');
}

function formatHex(value: number): string {
  return `0x${(value >>> 0).toString(16).padStart(8, '0')}`;
}

function hasFlag(argumentsSet: Set<string>, flag: string): boolean {
  return argumentsSet.has(flag);
}

function maskEmpty(value: string): string {
  return value.length > 0 ? value : '-';
}

function readWide(buffer: Buffer): string {
  return buffer.toString('utf16le').replace(/\0.*$/, '');
}

function unpackCredentialBlob(outputAuthBufferPointer: Pointer, outputAuthBufferSize: number): UnpackFailure | UnpackSuccess {
  const unpackFlagsToTry = [CredPackFlags.CRED_PACK_PROTECTED_CREDENTIALS, 0];
  let lastErrorCode = 0;

  for (const unpackFlags of unpackFlagsToTry) {
    const userBuffer = Buffer.alloc((CREDUI_MAX_USERNAME_LENGTH + 1) * 2);
    const domainBuffer = Buffer.alloc((CREDUI_MAX_USERNAME_LENGTH + 1) * 2);
    const passwordBuffer = Buffer.alloc((CREDUI_MAX_PASSWORD_LENGTH + 1) * 2);
    const userSizeBuffer = Buffer.alloc(4);
    const domainSizeBuffer = Buffer.alloc(4);
    const passwordSizeBuffer = Buffer.alloc(4);

    userSizeBuffer.writeUInt32LE(CREDUI_MAX_USERNAME_LENGTH + 1, 0);
    domainSizeBuffer.writeUInt32LE(CREDUI_MAX_USERNAME_LENGTH + 1, 0);
    passwordSizeBuffer.writeUInt32LE(CREDUI_MAX_PASSWORD_LENGTH + 1, 0);

    if (Credui.CredUnPackAuthenticationBufferW(unpackFlags, outputAuthBufferPointer, outputAuthBufferSize, userBuffer.ptr, userSizeBuffer.ptr, domainBuffer.ptr, domainSizeBuffer.ptr, passwordBuffer.ptr, passwordSizeBuffer.ptr)) {
      return {
        domain: readWide(domainBuffer),
        passwordLength: readWide(passwordBuffer).length,
        unpackFlags,
        user: readWide(userBuffer),
      };
    }

    lastErrorCode = Kernel32.GetLastError();
  }

  return {
    errorCode: lastErrorCode,
    unpackFlags: unpackFlagsToTry[unpackFlagsToTry.length - 1],
  };
}

const argumentsSet = new Set(Bun.argv.slice(2));
const requestGenericResult = hasFlag(argumentsSet, '--generic');
const requestHelloSmartCardPacking = hasFlag(argumentsSet, '--hello-smart-card');
const requestSecurePrompt = hasFlag(argumentsSet, '--secure');
const dryRun = hasFlag(argumentsSet, '--dry-run');

if (requestGenericResult && requestSecurePrompt) {
  throw new Error('CREDUIWIN_GENERIC cannot be combined with CREDUIWIN_SECURE_PROMPT.');
}

let promptFlags = CredUIWindowsFlags.CREDUIWIN_CHECKBOX;

if (requestGenericResult) {
  promptFlags |= CredUIWindowsFlags.CREDUIWIN_GENERIC;
}

if (requestHelloSmartCardPacking) {
  promptFlags |= CredUIWindowsFlags.CREDUIWIN_DOWNLEVEL_HELLO_AS_SMART_CARD;
}

if (requestSecurePrompt) {
  promptFlags |= CredUIWindowsFlags.CREDUIWIN_SECURE_PROMPT;
}

const selectedFlagNames = ['CREDUIWIN_CHECKBOX'];

if (requestGenericResult) {
  selectedFlagNames.push('CREDUIWIN_GENERIC');
}

if (requestHelloSmartCardPacking) {
  selectedFlagNames.push('CREDUIWIN_DOWNLEVEL_HELLO_AS_SMART_CARD');
}

if (requestSecurePrompt) {
  selectedFlagNames.push('CREDUIWIN_SECURE_PROMPT');
}

console.log('');
console.log(`${BOLD}${CYAN}System Credential Dialog${RESET}`);
console.log(`${DIM}This launches the real Windows credential provider UI. Visible tiles depend on installed providers, Windows Hello availability, and local policy.${RESET}`);
console.log('');
console.log(`  Prompt flags   ${formatHex(promptFlags)}   ${selectedFlagNames.join(' | ')}`);
console.log(`  Result mode    ${requestGenericResult ? 'plain user name and password' : 'provider-backed credential blob'}`);
console.log(`  Secure prompt  ${requestSecurePrompt ? 'yes' : 'no'}`);
console.log(`  Hello packing  ${requestHelloSmartCardPacking ? 'request smart-card serialization when Hello is used' : 'default provider serialization'}`);

if (dryRun) {
  console.log('');
  console.log(`${YELLOW}Dry run only.${RESET} No dialog was opened.`);
  console.log('');
  process.exit(0);
}

const uiInfo = createCredUiInfo('Bun FFI Windows Security demo', 'Launched from Bun via @bun-win32/credui. Choose any credential tile, then submit or cancel.');
const authPackageBuffer = Buffer.alloc(4);
const outputAuthBufferPointerBuffer = Buffer.alloc(8);
const outputAuthBufferSizeBuffer = Buffer.alloc(4);
const saveBuffer = Buffer.alloc(4);

let outputAuthBufferPointer: Pointer | null = null;
let outputAuthBufferSize = 0;
let exitCode = 0;

console.log('');
console.log(`${GREEN}Opening the Windows credential dialog...${RESET}`);

try {
  const status = Credui.CredUIPromptForWindowsCredentialsW(uiInfo.buffer.ptr, 0, authPackageBuffer.ptr, null, 0, outputAuthBufferPointerBuffer.ptr, outputAuthBufferSizeBuffer.ptr, saveBuffer.ptr, promptFlags);

  if (status === ERROR_CANCELLED) {
    console.log(`${YELLOW}The dialog was cancelled by the user.${RESET}`);
    console.log('');
  } else if (status !== ERROR_SUCCESS) {
    console.log(`${RED}CredUIPromptForWindowsCredentialsW failed:${RESET} ${formatHex(status)}`);
    console.log('');
    exitCode = 1;
  } else {
    const outputAuthBufferAddress = read.ptr(outputAuthBufferPointerBuffer.ptr);
    outputAuthBufferSize = outputAuthBufferSizeBuffer.readUInt32LE(0);

    if (outputAuthBufferAddress !== 0) {
      outputAuthBufferPointer = outputAuthBufferAddress as Pointer;
    }

    const authPackage = authPackageBuffer.readUInt32LE(0);
    const saveSelection = saveBuffer.readInt32LE(0) !== 0;

    console.log('');
    console.log(`${BOLD}Dialog Result${RESET}`);
    console.log(`  Status         ${formatHex(status)}`);
    console.log(`  Auth package   ${formatHex(authPackage)}`);
    console.log(`  Save selected  ${saveSelection ? 'yes' : 'no'}`);
    console.log(`  Blob size      ${outputAuthBufferSize} bytes`);

    if (outputAuthBufferPointer === null || outputAuthBufferSize === 0) {
      console.log(`  Blob pointer   ${RED}none returned${RESET}`);
      console.log('');
      exitCode = 1;
    } else {
      const unpackResult = unpackCredentialBlob(outputAuthBufferPointer, outputAuthBufferSize);

      if ('user' in unpackResult) {
        console.log('');
        console.log(`${BOLD}Unpacked Fields${RESET}`);
        console.log(`  User           ${maskEmpty(unpackResult.user)}`);
        console.log(`  Domain         ${maskEmpty(unpackResult.domain)}`);
        console.log(`  Password       ${unpackResult.passwordLength > 0 ? `${unpackResult.passwordLength} characters` : '-'}`);
        console.log(`  Unpack flags   ${formatHex(unpackResult.unpackFlags)}`);
      } else {
        console.log('');
        console.log(`${BOLD}Blob Interpretation${RESET}`);
        console.log(`  Unpack error   ${formatHex(unpackResult.errorCode)}`);
        console.log(`  Unpack flags   ${formatHex(unpackResult.unpackFlags)}`);
        console.log(`  Note           ${DIM}Non-password providers such as Windows Hello, smart card, certificate, or identity-provider tiles can return provider-specific serializations that do not unpack to plain strings.${RESET}`);
      }

      console.log('');
    }
  }
} finally {
  if (outputAuthBufferPointer !== null && outputAuthBufferSize > 0) {
    Buffer.from(toArrayBuffer(outputAuthBufferPointer, 0, outputAuthBufferSize)).fill(0);
    void Ole32.symbols.CoTaskMemFree(outputAuthBufferPointer);
  }
}

process.exitCode = exitCode;
