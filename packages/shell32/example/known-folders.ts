/**
 * Known Folders - Enumerate all CSIDL special folder paths.
 *
 * Uses SHGetFolderPathW with every CSIDL constant to resolve each special
 * folder to its filesystem path. Handles failures gracefully since some
 * CSIDL values are virtual (no filesystem path) or unavailable. For each
 * folder, shows the CSIDL name, numeric value, and resolved path. Groups
 * results into categories: user folders, system folders, common (shared)
 * folders, and virtual/failed entries.
 *
 * Demonstrates:
 * - SHGetFolderPathW with all CSIDL constants
 * - CSIDL enum from Shell32 types
 * - Graceful error handling for virtual folders
 *
 * Run: bun run example/known-folders.ts
 */

import Shell32, { CSIDL } from '../index';

// Helper to get a folder path from a CSIDL value
function getFolderPath(csidl: number): string | null {
  const pathBuf = Buffer.alloc(520); // MAX_PATH * 2
  const hr = Shell32.SHGetFolderPathW(0n, csidl, 0n, 0, pathBuf.ptr);
  if (hr !== 0) return null;
  let end = 0;
  while (end < pathBuf.length - 1) {
    if (pathBuf[end] === 0 && pathBuf[end + 1] === 0) break;
    end += 2;
  }
  if (end === 0) return null;
  return pathBuf.subarray(0, end).toString('utf16le');
}

// All CSIDL entries we want to enumerate, grouped by category
const csidlEntries: Array<{ name: string; value: number; category: string }> = [
  // User folders
  { name: 'CSIDL_DESKTOP', value: CSIDL.CSIDL_DESKTOP, category: 'User' },
  { name: 'CSIDL_PERSONAL', value: CSIDL.CSIDL_PERSONAL, category: 'User' },
  { name: 'CSIDL_FAVORITES', value: CSIDL.CSIDL_FAVORITES, category: 'User' },
  { name: 'CSIDL_MYDOCUMENTS', value: CSIDL.CSIDL_MYDOCUMENTS, category: 'User' },
  { name: 'CSIDL_MYMUSIC', value: CSIDL.CSIDL_MYMUSIC, category: 'User' },
  { name: 'CSIDL_MYPICTURES', value: CSIDL.CSIDL_MYPICTURES, category: 'User' },
  { name: 'CSIDL_MYVIDEO', value: CSIDL.CSIDL_MYVIDEO, category: 'User' },
  { name: 'CSIDL_PROFILE', value: CSIDL.CSIDL_PROFILE, category: 'User' },
  { name: 'CSIDL_DESKTOPDIRECTORY', value: CSIDL.CSIDL_DESKTOPDIRECTORY, category: 'User' },
  { name: 'CSIDL_TEMPLATES', value: CSIDL.CSIDL_TEMPLATES, category: 'User' },
  { name: 'CSIDL_RECENT', value: CSIDL.CSIDL_RECENT, category: 'User' },
  { name: 'CSIDL_SENDTO', value: CSIDL.CSIDL_SENDTO, category: 'User' },
  { name: 'CSIDL_COOKIES', value: CSIDL.CSIDL_COOKIES, category: 'User' },
  { name: 'CSIDL_HISTORY', value: CSIDL.CSIDL_HISTORY, category: 'User' },
  { name: 'CSIDL_INTERNET_CACHE', value: CSIDL.CSIDL_INTERNET_CACHE, category: 'User' },
  { name: 'CSIDL_NETHOOD', value: CSIDL.CSIDL_NETHOOD, category: 'User' },
  { name: 'CSIDL_PRINTHOOD', value: CSIDL.CSIDL_PRINTHOOD, category: 'User' },
  { name: 'CSIDL_CDBURN_AREA', value: CSIDL.CSIDL_CDBURN_AREA, category: 'User' },

  // Application data
  { name: 'CSIDL_APPDATA', value: CSIDL.CSIDL_APPDATA, category: 'Application Data' },
  { name: 'CSIDL_LOCAL_APPDATA', value: CSIDL.CSIDL_LOCAL_APPDATA, category: 'Application Data' },
  { name: 'CSIDL_ADMINTOOLS', value: CSIDL.CSIDL_ADMINTOOLS, category: 'Application Data' },

  // Start menu / programs
  { name: 'CSIDL_STARTMENU', value: CSIDL.CSIDL_STARTMENU, category: 'Start Menu' },
  { name: 'CSIDL_PROGRAMS', value: CSIDL.CSIDL_PROGRAMS, category: 'Start Menu' },
  { name: 'CSIDL_STARTUP', value: CSIDL.CSIDL_STARTUP, category: 'Start Menu' },

  // System folders
  { name: 'CSIDL_WINDOWS', value: CSIDL.CSIDL_WINDOWS, category: 'System' },
  { name: 'CSIDL_SYSTEM', value: CSIDL.CSIDL_SYSTEM, category: 'System' },
  { name: 'CSIDL_SYSTEMX86', value: CSIDL.CSIDL_SYSTEMX86, category: 'System' },
  { name: 'CSIDL_PROGRAM_FILES', value: CSIDL.CSIDL_PROGRAM_FILES, category: 'System' },
  { name: 'CSIDL_PROGRAM_FILESX86', value: CSIDL.CSIDL_PROGRAM_FILESX86, category: 'System' },
  { name: 'CSIDL_PROGRAM_FILES_COMMON', value: CSIDL.CSIDL_PROGRAM_FILES_COMMON, category: 'System' },
  { name: 'CSIDL_PROGRAM_FILES_COMMONX86', value: CSIDL.CSIDL_PROGRAM_FILES_COMMONX86, category: 'System' },
  { name: 'CSIDL_FONTS', value: CSIDL.CSIDL_FONTS, category: 'System' },
  { name: 'CSIDL_RESOURCES', value: CSIDL.CSIDL_RESOURCES, category: 'System' },
  { name: 'CSIDL_RESOURCES_LOCALIZED', value: CSIDL.CSIDL_RESOURCES_LOCALIZED, category: 'System' },

  // Common (shared) folders
  { name: 'CSIDL_COMMON_APPDATA', value: CSIDL.CSIDL_COMMON_APPDATA, category: 'Common' },
  { name: 'CSIDL_COMMON_DOCUMENTS', value: CSIDL.CSIDL_COMMON_DOCUMENTS, category: 'Common' },
  { name: 'CSIDL_COMMON_DESKTOPDIRECTORY', value: CSIDL.CSIDL_COMMON_DESKTOPDIRECTORY, category: 'Common' },
  { name: 'CSIDL_COMMON_STARTMENU', value: CSIDL.CSIDL_COMMON_STARTMENU, category: 'Common' },
  { name: 'CSIDL_COMMON_PROGRAMS', value: CSIDL.CSIDL_COMMON_PROGRAMS, category: 'Common' },
  { name: 'CSIDL_COMMON_STARTUP', value: CSIDL.CSIDL_COMMON_STARTUP, category: 'Common' },
  { name: 'CSIDL_COMMON_TEMPLATES', value: CSIDL.CSIDL_COMMON_TEMPLATES, category: 'Common' },
  { name: 'CSIDL_COMMON_FAVORITES', value: CSIDL.CSIDL_COMMON_FAVORITES, category: 'Common' },
  { name: 'CSIDL_COMMON_ADMINTOOLS', value: CSIDL.CSIDL_COMMON_ADMINTOOLS, category: 'Common' },
  { name: 'CSIDL_COMMON_MUSIC', value: CSIDL.CSIDL_COMMON_MUSIC, category: 'Common' },
  { name: 'CSIDL_COMMON_PICTURES', value: CSIDL.CSIDL_COMMON_PICTURES, category: 'Common' },
  { name: 'CSIDL_COMMON_VIDEO', value: CSIDL.CSIDL_COMMON_VIDEO, category: 'Common' },
  { name: 'CSIDL_COMMON_OEM_LINKS', value: CSIDL.CSIDL_COMMON_OEM_LINKS, category: 'Common' },

  // Virtual / special
  { name: 'CSIDL_INTERNET', value: CSIDL.CSIDL_INTERNET, category: 'Virtual' },
  { name: 'CSIDL_CONTROLS', value: CSIDL.CSIDL_CONTROLS, category: 'Virtual' },
  { name: 'CSIDL_PRINTERS', value: CSIDL.CSIDL_PRINTERS, category: 'Virtual' },
  { name: 'CSIDL_BITBUCKET', value: CSIDL.CSIDL_BITBUCKET, category: 'Virtual' },
  { name: 'CSIDL_DRIVES', value: CSIDL.CSIDL_DRIVES, category: 'Virtual' },
  { name: 'CSIDL_NETWORK', value: CSIDL.CSIDL_NETWORK, category: 'Virtual' },
  { name: 'CSIDL_CONNECTIONS', value: CSIDL.CSIDL_CONNECTIONS, category: 'Virtual' },
  { name: 'CSIDL_COMPUTERSNEARME', value: CSIDL.CSIDL_COMPUTERSNEARME, category: 'Virtual' },
];

const divider = '-'.repeat(110);

console.log('KNOWN FOLDERS REPORT');
console.log(`Generated: ${new Date().toLocaleString()}`);
console.log(`Total CSIDL entries queried: ${csidlEntries.length}`);
console.log('');

// Resolve all paths
const results: Array<{ name: string; value: number; category: string; path: string | null }> = [];
for (const entry of csidlEntries) {
  const path = getFolderPath(entry.value);
  results.push({ ...entry, path });
}

const resolved = results.filter((r) => r.path !== null);
const failed = results.filter((r) => r.path === null);

// Print by category
const categories = ['User', 'Application Data', 'Start Menu', 'System', 'Common', 'Virtual'];

for (const category of categories) {
  const catResults = results.filter((r) => r.category === category);
  if (catResults.length === 0) continue;

  const catResolved = catResults.filter((r) => r.path !== null);

  console.log(`${category.toUpperCase()} FOLDERS (${catResolved.length}/${catResults.length} resolved)`);
  console.log(divider);
  console.log(
    '  ' +
      'CSIDL Name'.padEnd(36) +
      'Value'.padEnd(10) +
      'Path',
  );
  console.log(divider);

  for (const r of catResults) {
    const hexValue = `0x${r.value.toString(16).padStart(4, '0')}`;
    const pathDisplay = r.path || '(virtual / not available)';
    console.log('  ' + r.name.padEnd(36) + hexValue.padEnd(10) + pathDisplay);
  }

  console.log('');
}

// Summary statistics
console.log(divider);
console.log('SUMMARY');
console.log(`  Total CSIDL values queried:   ${results.length}`);
console.log(`  Successfully resolved:         ${resolved.length}`);
console.log(`  Virtual / unavailable:         ${failed.length}`);
console.log('');

// Show which drives have unique prefixes
const drivePrefixes = new Set<string>();
for (const r of resolved) {
  if (r.path && r.path.length >= 2 && r.path[1] === ':') {
    drivePrefixes.add(r.path.substring(0, 2).toUpperCase());
  }
}

if (drivePrefixes.size > 0) {
  console.log(`  Drive letters in use:          ${[...drivePrefixes].sort().join(', ')}`);
}

// Identify the longest and shortest paths
if (resolved.length > 0) {
  const sortedByLen = [...resolved].sort((a, b) => (a.path?.length || 0) - (b.path?.length || 0));
  const shortest = sortedByLen[0]!;
  const longest = sortedByLen[sortedByLen.length - 1]!;
  console.log(`  Shortest path:                 ${shortest.name} (${shortest.path?.length} chars)`);
  console.log(`  Longest path:                  ${longest.name} (${longest.path?.length} chars)`);
}

console.log('');
console.log('Report complete.');
