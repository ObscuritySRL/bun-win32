/**
 * Recycle Bin Deep Dive - An archaeological expedition into your deleted files.
 *
 * Uses SHQueryRecycleBinW (with null root path to query all drives) to retrieve
 * the total size and item count of the Recycle Bin. Uses SHGetFolderPathW with
 * CSIDL_DESKTOP, CSIDL_PERSONAL, and CSIDL_APPDATA to show key folder paths
 * as "excavation site coordinates." Uses CommandLineToArgvW to parse the current
 * command line and display the expedition parameters. Presents the findings as
 * an "archaeological excavation report" with fun narrative framing.
 *
 * Demonstrates:
 * - SHQueryRecycleBinW (recycle bin statistics)
 * - SHGetFolderPathW (special folder resolution)
 * - CommandLineToArgvW (command line parsing)
 * - Kernel32.GetCommandLineW (cross-package)
 * - CSIDL enum constants
 *
 * Run: bun run example/recycle-bin-dive.ts
 */

import Shell32, { CSIDL } from '../index';
import Kernel32 from '@bun-win32/kernel32';
import { read, toArrayBuffer, type Pointer } from 'bun:ffi';

const encode = (str: string) => Buffer.from(`${str}\0`, 'utf16le');

// Helper to get a known folder path by CSIDL value
function getFolderPath(csidl: number): string | null {
  const pathBuf = Buffer.alloc(520); // MAX_PATH * 2 for UTF-16
  const hr = Shell32.SHGetFolderPathW(0n, csidl, 0n, 0, pathBuf.ptr);
  if (hr !== 0) return null;
  const nullIdx = pathBuf.indexOf(0x00, 0);
  // Find the first double-null (UTF-16 null terminator)
  let end = 0;
  while (end < pathBuf.length - 1) {
    if (pathBuf[end] === 0 && pathBuf[end + 1] === 0) break;
    end += 2;
  }
  if (end === 0) return null;
  return pathBuf.subarray(0, end).toString('utf16le');
}

// Helper to format bytes nicely
function formatBytes(bytes: bigint): string {
  const num = Number(bytes);
  if (num < 1024) return `${num} bytes`;
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
  if (num < 1024 * 1024 * 1024) return `${(num / (1024 * 1024)).toFixed(1)} MB`;
  return `${(num / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

console.log('');
console.log('  +=================================================+');
console.log('  |   ARCHAEOLOGICAL EXCAVATION REPORT               |');
console.log('  |   Department of Digital Refuse & Forgotten Files  |');
console.log('  +=================================================+');
console.log('');
console.log('  Expedition Log Entry: ' + new Date().toLocaleString());
console.log('');

// Parse the command line as "expedition parameters"
console.log('  EXPEDITION PARAMETERS');
console.log('  (parsed from the command line using CommandLineToArgvW)');
console.log('');

const cmdLinePtr = Kernel32.GetCommandLineW();
if (cmdLinePtr) {
  const numArgsBuf = Buffer.alloc(4);
  const argvPtr = Shell32.CommandLineToArgvW(cmdLinePtr, numArgsBuf.ptr);

  if (argvPtr) {
    const numArgs = numArgsBuf.readInt32LE(0);
    console.log(`  Command line yielded ${numArgs} argument(s):`);
    for (let i = 0; i < numArgs; i++) {
      // argvPtr is a LPWSTR* (array of wide string pointers)
      // Each pointer is 8 bytes on x64
      const strPtrValue = read.ptr(argvPtr, i * 8);
      if (strPtrValue) {
        // Read up to 512 bytes of the string
        const strBuf = Buffer.from(toArrayBuffer(strPtrValue as Pointer, 0, 512));
        let end = 0;
        while (end < strBuf.length - 1) {
          if (strBuf[end] === 0 && strBuf[end + 1] === 0) break;
          end += 2;
        }
        const argStr = strBuf.subarray(0, end).toString('utf16le');
        console.log(`    argv[${i}]: ${argStr}`);
      }
    }
  } else {
    console.log('  (CommandLineToArgvW returned null)');
  }
} else {
  console.log('  (GetCommandLineW returned null)');
}

console.log('');

// Show key folder paths as "excavation site coordinates"
console.log('  EXCAVATION SITE COORDINATES');
console.log('  (Key locations on this system\'s filesystem)');
console.log('');

const sites: Array<{ name: string; csidl: number; description: string }> = [
  { name: 'Desktop', csidl: CSIDL.CSIDL_DESKTOP, description: 'The surface layer, where artifacts first appear' },
  { name: 'Documents', csidl: CSIDL.CSIDL_PERSONAL, description: 'The primary document repository' },
  { name: 'AppData', csidl: CSIDL.CSIDL_APPDATA, description: 'The hidden catacombs of application state' },
  { name: 'Local AppData', csidl: CSIDL.CSIDL_LOCAL_APPDATA, description: 'Deeper catacombs, machine-specific relics' },
  { name: 'Profile', csidl: CSIDL.CSIDL_PROFILE, description: 'The user\'s home base camp' },
  { name: 'Windows', csidl: CSIDL.CSIDL_WINDOWS, description: 'The ancient operating system ruins' },
];

for (const site of sites) {
  const path = getFolderPath(site.csidl);
  console.log(`  ${site.name}`);
  console.log(`    Path:        ${path || '(could not resolve)'}`);
  console.log(`    Field notes: ${site.description}`);
  console.log('');
}

// The main event: Recycle Bin statistics
console.log('  +=================================================+');
console.log('  |   PRIMARY EXCAVATION: THE RECYCLE BIN            |');
console.log('  +=================================================+');
console.log('');

// SHQUERYRBINFO structure (on x64):
// cbSize:    DWORD (4 bytes) + 4 padding
// i64Size:   LONGLONG (8 bytes)
// i64NumItems: LONGLONG (8 bytes)
// Total: 24 bytes
const rbInfoBuf = Buffer.alloc(24);
rbInfoBuf.writeUInt32LE(24, 0); // cbSize must be set before the call

const hr = Shell32.SHQueryRecycleBinW(null, rbInfoBuf.ptr);

if (hr !== 0) {
  console.log(`  The dig was unsuccessful. HRESULT: 0x${(hr >>> 0).toString(16)}`);
  console.log('  The Recycle Bin could not be queried.');
} else {
  const totalSize = rbInfoBuf.readBigInt64LE(8);
  const numItems = rbInfoBuf.readBigInt64LE(16);

  console.log('  The expedition team carefully sifted through the');
  console.log('  Recycle Bin and cataloged the following finds:');
  console.log('');
  console.log(`    Artifacts discovered:  ${numItems.toLocaleString()} items`);
  console.log(`    Total mass:            ${formatBytes(totalSize)} (${totalSize.toLocaleString()} bytes)`);
  console.log('');

  if (numItems === 0n) {
    console.log('  The excavation site is pristine! Not a single');
    console.log('  artifact remains. Either someone has been tidying');
    console.log('  up, or this is a fresh installation.');
  } else if (numItems < 10n) {
    console.log('  A modest collection. Just a few digital remnants');
    console.log('  from recent deletions. Nothing too concerning.');
  } else if (numItems < 100n) {
    console.log('  A respectable accumulation of deleted material.');
    console.log('  The bin is filling up but still manageable.');
  } else if (numItems < 1000n) {
    console.log('  Whoa! Hundreds of artifacts! This bin has been');
    console.log('  neglected for quite some time. Consider an');
    console.log('  archaeological cleanup expedition.');
  } else {
    console.log('  INCREDIBLE DISCOVERY! Over a thousand items!');
    console.log('  This Recycle Bin is a veritable treasure trove');
    console.log('  of digital history. Someone really needs to');
    console.log('  empty this thing.');
  }

  if (totalSize > 1073741824n) {
    console.log('');
    console.log('  WARNING: The bin contains over 1 GB of data!');
    console.log('  Emptying it could free significant disk space.');
  }
}

console.log('');
console.log('  +=================================================+');
console.log('  |   END OF EXCAVATION REPORT                       |');
console.log('  |   "One person\'s trash is another\'s archaeology"   |');
console.log('  +=================================================+');
console.log('');
