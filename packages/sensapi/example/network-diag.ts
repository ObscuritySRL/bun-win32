/**
 * Network Diagnostic
 *
 * Runs a full sensapi.dll connectivity report: queries IsNetworkAlive to
 * identify active adapter classes (LAN / WAN / AOL / Internet), then attempts
 * IsDestinationReachableW against a set of destinations to surface the
 * documented Windows Vista+ ERROR_CALL_NOT_IMPLEMENTED behavior. Useful when
 * triaging connectivity, validating the Vista deprecation status of
 * IsDestinationReachable on the target host, or confirming that the binding
 * itself is wired correctly end-to-end.
 *
 * APIs demonstrated:
 *   - Sensapi.IsNetworkAlive          (flag-based adapter class detection)
 *   - Sensapi.IsDestinationReachableW (QoC probe + deprecation surfacing)
 *   - Kernel32.GetLastError           (Win32 error code decoding)
 *
 * Run: bun run example/network-diag.ts
 */

import Sensapi, { NetworkAliveFlags, QOCINFO_SIZE } from '../index';
import Kernel32 from '@bun-win32/kernel32';

Sensapi.Preload(['IsDestinationReachableW', 'IsNetworkAlive']);
Kernel32.Preload(['GetLastError']);

const ANSI = {
  bold: '\x1b[1m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
  yellow: '\x1b[33m',
} as const;

const ERROR_CALL_NOT_IMPLEMENTED = 120;

const DEFAULT_DESTINATIONS = ['www.microsoft.com', 'www.cloudflare.com', '8.8.8.8', '\\\\localhost'];

function createWideStringBuffer(value: string): Buffer {
  return Buffer.from(value + '\0', 'utf16le');
}

function decodeAliveFlags(flagValue: number): string[] {
  const active: string[] = [];

  if ((flagValue & NetworkAliveFlags.NETWORK_ALIVE_LAN) !== 0) active.push('LAN');
  if ((flagValue & NetworkAliveFlags.NETWORK_ALIVE_WAN) !== 0) active.push('WAN');
  if ((flagValue & NetworkAliveFlags.NETWORK_ALIVE_AOL) !== 0) active.push('AOL');
  if ((flagValue & NetworkAliveFlags.NETWORK_ALIVE_INTERNET) !== 0) active.push('Internet');

  return active;
}

function describeQocInfo(buffer: Buffer): Record<string, number> {
  return {
    dwFlags: buffer.readUInt32LE(4),
    dwInSpeed: buffer.readUInt32LE(8),
    dwOutSpeed: buffer.readUInt32LE(12),
    dwSize: buffer.readUInt32LE(0),
  };
}

function decodeWin32Error(errorCode: number): string {
  switch (errorCode) {
    case 0:
      return 'ERROR_SUCCESS';
    case ERROR_CALL_NOT_IMPLEMENTED:
      return 'ERROR_CALL_NOT_IMPLEMENTED';
    default:
      return `0x${errorCode.toString(16).padStart(8, '0')}`;
  }
}

console.log(`${ANSI.bold}${ANSI.cyan}Network Diagnostic (sensapi.dll)${ANSI.reset}`);
console.log(`${ANSI.dim}${new Date().toISOString()}${ANSI.reset}`);
console.log('');

console.log(`${ANSI.bold}Adapter Classes${ANSI.reset}`);

const aliveFlagsBuffer = Buffer.alloc(4);
const aliveResult = Sensapi.IsNetworkAlive(aliveFlagsBuffer.ptr);
const aliveError = Kernel32.GetLastError();
const aliveFlagsValue = aliveFlagsBuffer.readUInt32LE(0);
const aliveFlagNames = decodeAliveFlags(aliveFlagsValue);

if (aliveError !== 0) {
  console.log(`  ${ANSI.red}IsNetworkAlive failed${ANSI.reset} (${decodeWin32Error(aliveError)})`);
} else if (aliveResult !== 0) {
  const summary = aliveFlagNames.length > 0 ? aliveFlagNames.join(', ') : '(no flags reported)';
  console.log(`  ${ANSI.green}Connected${ANSI.reset} — ${summary}`);
  console.log(`  ${ANSI.dim}raw flags: 0x${aliveFlagsValue.toString(16).padStart(8, '0')}${ANSI.reset}`);
} else {
  console.log(`  ${ANSI.yellow}Not connected${ANSI.reset}`);
}

console.log('');
console.log(`${ANSI.bold}Destination Reachability${ANSI.reset}`);

const requestedDestinations = Bun.argv.slice(2);
const destinations = requestedDestinations.length > 0 ? requestedDestinations : DEFAULT_DESTINATIONS;
const longestDestinationLength = Math.max(...destinations.map((destination) => destination.length));

for (const destination of destinations) {
  const destinationBuffer = createWideStringBuffer(destination);
  const qocInfoBuffer = Buffer.alloc(QOCINFO_SIZE);

  qocInfoBuffer.writeUInt32LE(QOCINFO_SIZE, 0);

  const reachableResult = Sensapi.IsDestinationReachableW(destinationBuffer.ptr, qocInfoBuffer.ptr);
  const lastError = Kernel32.GetLastError();
  const paddedLabel = destination.padEnd(longestDestinationLength, ' ');

  if (reachableResult !== 0) {
    const info = describeQocInfo(qocInfoBuffer);
    console.log(`  ${ANSI.green}reachable${ANSI.reset}  ${paddedLabel}  ${ANSI.dim}in=${info.dwInSpeed}bps out=${info.dwOutSpeed}bps flags=0x${info.dwFlags.toString(16).padStart(8, '0')}${ANSI.reset}`);
  } else if (lastError === ERROR_CALL_NOT_IMPLEMENTED) {
    console.log(`  ${ANSI.yellow}deprecated${ANSI.reset} ${paddedLabel}  ${ANSI.dim}ERROR_CALL_NOT_IMPLEMENTED (expected on Vista+)${ANSI.reset}`);
  } else {
    console.log(`  ${ANSI.red}failed${ANSI.reset}    ${paddedLabel}  ${ANSI.dim}${decodeWin32Error(lastError)}${ANSI.reset}`);
  }
}

console.log('');
console.log(`${ANSI.dim}IsDestinationReachable is unsupported on Windows Vista and later. Use the Network List Manager for modern code.${ANSI.reset}`);
