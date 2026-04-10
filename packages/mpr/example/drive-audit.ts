/**
 * Drive Audit
 *
 * Scans drive letters A: through Z: to detect network-mapped drives,
 * retrieves UNC paths and connection user information for each, and
 * produces a structured audit report. Useful for diagnostics, asset
 * inventory, and compliance checks in enterprise environments.
 *
 * APIs demonstrated:
 *   - Mpr.WNetGetConnectionW  (resolve a drive letter to a remote UNC path)
 *   - Mpr.WNetGetUserW        (retrieve the authenticated user for a connection)
 *   - Mpr.WNetGetLastErrorW   (retrieve extended WNet error details)
 *
 * Run: bun run example:drive-audit
 */

import Mpr, {
  WN_EXTENDED_ERROR,
  WN_MORE_DATA,
  WN_NO_ERROR,
} from '../index';

Mpr.Preload(['WNetGetConnectionW', 'WNetGetLastErrorW', 'WNetGetUserW']);

const ANSI = {
  bold: '\x1b[1m',
  cyan: '\x1b[96m',
  dim: '\x1b[2m',
  green: '\x1b[92m',
  red: '\x1b[91m',
  reset: '\x1b[0m',
  white: '\x1b[97m',
  yellow: '\x1b[93m',
} as const;

interface MappedDrive {
  letter: string;
  remotePath: string;
  user: string;
}

function wide(s: string): Buffer {
  return Buffer.from(s + '\0', 'utf16le');
}

function readWide(buf: Buffer): string {
  return buf.toString('utf16le').replace(/\0.*$/, '');
}

function getConnection(driveLetter: string): string | null {
  const nameBuf = wide(driveLetter + ':');
  const remoteBuf = Buffer.alloc(520);
  const sizeBuf = Buffer.alloc(4);
  sizeBuf.writeUInt32LE(260, 0);

  let result = Mpr.WNetGetConnectionW(nameBuf.ptr, remoteBuf.ptr, sizeBuf.ptr);

  if (result === WN_MORE_DATA) {
    const needed = sizeBuf.readUInt32LE(0);
    const bigBuf = Buffer.alloc(needed * 2);
    sizeBuf.writeUInt32LE(needed, 0);
    result = Mpr.WNetGetConnectionW(nameBuf.ptr, bigBuf.ptr, sizeBuf.ptr);
    if (result === WN_NO_ERROR) return readWide(bigBuf);
    return null;
  }

  if (result !== WN_NO_ERROR) return null;
  return readWide(remoteBuf);
}

function getUser(driveName: string | null): string {
  const nameBuf = driveName !== null ? wide(driveName) : null;
  const userBuf = Buffer.alloc(512);
  const sizeBuf = Buffer.alloc(4);
  sizeBuf.writeUInt32LE(256, 0);

  const result = Mpr.WNetGetUserW(
    nameBuf !== null ? nameBuf.ptr : null,
    userBuf.ptr,
    sizeBuf.ptr,
  );

  if (result !== WN_NO_ERROR) return '(unavailable)';
  return readWide(userBuf);
}

function getExtendedError(): string | null {
  const codeBuf = Buffer.alloc(4);
  const descBuf = Buffer.alloc(512);
  const provBuf = Buffer.alloc(512);

  const result = Mpr.WNetGetLastErrorW(codeBuf.ptr, descBuf.ptr, 256, provBuf.ptr, 256);

  if (result !== WN_NO_ERROR) return null;

  const code = codeBuf.readUInt32LE(0);
  if (code === 0) return null;

  const desc = readWide(descBuf);
  const prov = readWide(provBuf);
  return `${prov}: error ${code} — ${desc}`;
}

console.log(`${ANSI.bold}${ANSI.white}Drive Audit${ANSI.reset}`);
console.log(`${ANSI.dim}Network-mapped drive scan${ANSI.reset}`);
console.log('');

const currentUser = getUser(null);
console.log(`  ${ANSI.green}Current user${ANSI.reset}  ${currentUser}`);
console.log('');

const drives: MappedDrive[] = [];
const errors: string[] = [];

for (let code = 65; code <= 90; code++) {
  const letter = String.fromCharCode(code);
  const remotePath = getConnection(letter);

  if (remotePath !== null) {
    const user = getUser(letter + ':');
    drives.push({ letter, remotePath, user });
  }
}

if (drives.length === 0) {
  console.log(`  ${ANSI.dim}No network-mapped drives found.${ANSI.reset}`);
} else {
  const letterWidth = 6;
  const pathWidth = 40;
  const userWidth = 30;

  console.log(
    `  ${ANSI.bold}${ANSI.white}${'Drive'.padEnd(letterWidth)}${'Remote Path'.padEnd(pathWidth)}${'User'.padEnd(userWidth)}${ANSI.reset}`,
  );
  console.log(`  ${ANSI.dim}${'\u2500'.repeat(letterWidth + pathWidth + userWidth)}${ANSI.reset}`);

  for (const d of drives) {
    const driveCol = `${ANSI.cyan}${(d.letter + ':').padEnd(letterWidth)}${ANSI.reset}`;
    const pathCol = d.remotePath.padEnd(pathWidth);
    const userCol = `${ANSI.dim}${d.user.padEnd(userWidth)}${ANSI.reset}`;
    console.log(`  ${driveCol}${pathCol}${userCol}`);
  }
}

const extErr = getExtendedError();

if (extErr !== null) {
  console.log('');
  console.log(`  ${ANSI.yellow}Extended error:${ANSI.reset} ${extErr}`);
}

console.log('');
console.log(`${ANSI.dim}  ${drives.length} mapped drive(s) found${ANSI.reset}`);
