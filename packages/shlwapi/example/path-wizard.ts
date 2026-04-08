/**
 * Path Wizard - A magical showcase of Windows path manipulation spells.
 *
 * Demonstrates the Shlwapi path utility functions by running creative scenarios.
 * PathCombineW joins path fragments, PathFindFileNameW extracts the filename,
 * PathFindExtensionW gets the extension, PathRemoveFileSpecW strips to the
 * directory, PathFileExistsW checks existence, PathIsDirectoryW checks if a
 * path is a directory, and PathIsRelativeW tests for relative paths. Each
 * operation is presented as a "spell" the wizard casts, with before/after
 * results shown.
 *
 * Demonstrates:
 * - PathCombineW (join path components)
 * - PathFindFileNameW (extract filename from path)
 * - PathFindExtensionW (extract file extension)
 * - PathRemoveFileSpecW (strip filename, keep directory)
 * - PathFileExistsW (check if path exists)
 * - PathIsDirectoryW (check if path is a directory)
 * - PathIsRelativeW (check if path is relative)
 *
 * Run: bun run example/path-wizard.ts
 */

import Shlwapi from '../index';
import { toArrayBuffer, type Pointer } from 'bun:ffi';

const encode = (str: string) => Buffer.from(`${str}\0`, 'utf16le');

// Read a wide string from a pointer until the null terminator (or max length)
function readWideString(ptr: Pointer | number, maxBytes: number = 520): string {
  if (!ptr) return '(null)';
  const buf = Buffer.from(toArrayBuffer(ptr as Pointer, 0, maxBytes));
  let end = 0;
  while (end < buf.length - 1) {
    if (buf[end] === 0 && buf[end + 1] === 0) break;
    end += 2;
  }
  return buf.subarray(0, end).toString('utf16le');
}

// Read wide string from a Buffer
function readWideStringBuf(buf: Buffer): string {
  let end = 0;
  while (end < buf.length - 1) {
    if (buf[end] === 0 && buf[end + 1] === 0) break;
    end += 2;
  }
  return buf.subarray(0, end).toString('utf16le');
}

let spellNumber = 0;

function castSpell(name: string, description: string) {
  spellNumber++;
  console.log(`  Spell #${spellNumber}: ${name}`);
  console.log(`  ${description}`);
}

console.log('');
console.log('  *~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*');
console.log('  *       THE PATH WIZARD\'S SPELLBOOK          *');
console.log('  *  "From fragments, I forge complete paths!"  *');
console.log('  *~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*');
console.log('');

// Spell 1: PathCombineW - joining fragments
castSpell('CONJURE (PathCombineW)', 'Joining path fragments into whole paths');
console.log('');

const combineTests = [
  { dir: 'C:\\Users\\Wizard', file: 'spellbook.txt' },
  { dir: 'C:\\Windows\\System32', file: 'drivers\\etc\\hosts' },
  { dir: 'D:\\Projects', file: '..\\Archive\\old.zip' },
  { dir: '', file: 'relative\\path.dat' },
];

for (const test of combineTests) {
  const destBuf = Buffer.alloc(520);
  const result = Shlwapi.PathCombineW(destBuf.ptr, encode(test.dir).ptr, encode(test.file).ptr);
  const combined = result ? readWideStringBuf(destBuf) : '(failed)';
  console.log(`    "${test.dir}" + "${test.file}"`);
  console.log(`     => ${combined}`);
  console.log('');
}

// Spell 2: PathFindFileNameW - extracting the filename
castSpell('REVEAL NAME (PathFindFileNameW)', 'Extracting filenames from full paths');
console.log('');

const fileNameTests = [
  'C:\\Users\\Wizard\\Documents\\spellbook.txt',
  'D:\\Games\\RPG\\saves\\slot1.sav',
  'C:\\just-a-file.log',
  '\\\\server\\share\\report.pdf',
  'no-directory-at-all.exe',
];

for (const path of fileNameTests) {
  const resultPtr = Shlwapi.PathFindFileNameW(encode(path).ptr);
  const fileName = resultPtr ? readWideString(resultPtr as unknown as Pointer) : '(null)';
  console.log(`    Input:    ${path}`);
  console.log(`    Filename: ${fileName}`);
  console.log('');
}

// Spell 3: PathFindExtensionW - extracting the extension
castSpell('REVEAL EXTENSION (PathFindExtensionW)', 'Isolating file extensions');
console.log('');

const extensionTests = [
  'document.pdf',
  'archive.tar.gz',
  'C:\\Windows\\notepad.exe',
  'no-extension',
  'tricky.file.name.with.dots.txt',
];

for (const path of extensionTests) {
  const resultPtr = Shlwapi.PathFindExtensionW(encode(path).ptr);
  const ext = resultPtr ? readWideString(resultPtr as unknown as Pointer) : '(null)';
  console.log(`    Input:     ${path}`);
  console.log(`    Extension: ${ext || '(none)'}`);
  console.log('');
}

// Spell 4: PathRemoveFileSpecW - strip to directory
castSpell('STRIP (PathRemoveFileSpecW)', 'Removing the filename, keeping the directory');
console.log('');

const removeTests = [
  'C:\\Users\\Wizard\\Documents\\secrets.txt',
  'D:\\Projects\\app\\src\\index.ts',
  'C:\\lonely-file.dat',
  'C:\\Windows\\',
];

for (const path of removeTests) {
  // PathRemoveFileSpecW modifies in-place, so we need a mutable copy
  const pathBuf = Buffer.alloc(520);
  const encoded = encode(path);
  encoded.copy(pathBuf);

  const before = path;
  Shlwapi.PathRemoveFileSpecW(pathBuf.ptr);
  const after = readWideStringBuf(pathBuf);

  console.log(`    Before: ${before}`);
  console.log(`    After:  ${after}`);
  console.log('');
}

// Spell 5: PathFileExistsW - does it exist?
castSpell('DETECT (PathFileExistsW)', 'Sensing whether paths exist in this realm');
console.log('');

const existenceTests = [
  'C:\\Windows',
  'C:\\Windows\\System32\\notepad.exe',
  'C:\\Windows\\System32\\kernel32.dll',
  'C:\\Totally\\Fake\\Path\\unicorn.exe',
  'C:\\pagefile.sys',
];

for (const path of existenceTests) {
  const exists = Shlwapi.PathFileExistsW(encode(path).ptr);
  console.log(`    ${path}`);
  console.log(`    Exists: ${exists ? 'YES - the path is real!' : 'NO - a phantom path'}`);
  console.log('');
}

// Spell 6: PathIsDirectoryW - file or directory?
castSpell('CLASSIFY (PathIsDirectoryW)', 'Determining if a path leads to a directory');
console.log('');

const dirTests = [
  'C:\\Windows',
  'C:\\Windows\\System32',
  'C:\\Windows\\System32\\notepad.exe',
  'C:\\Users',
  'C:\\Nonexistent\\Folder',
];

for (const path of dirTests) {
  const isDir = Shlwapi.PathIsDirectoryW(encode(path).ptr);
  console.log(`    ${path}`);
  console.log(`    Is Directory: ${isDir ? 'YES - a directory portal' : 'NO - not a directory'}`);
  console.log('');
}

// Spell 7: PathIsRelativeW - absolute or relative?
castSpell('ORIENT (PathIsRelativeW)', 'Determining if paths are anchored or adrift');
console.log('');

const relativeTests = [
  'C:\\absolute\\path.txt',
  '\\\\server\\share',
  'relative\\path.txt',
  '..\\parent\\file.dat',
  'just-a-file.txt',
  'D:\\',
];

for (const path of relativeTests) {
  const isRelative = Shlwapi.PathIsRelativeW(encode(path).ptr);
  console.log(`    "${path}"`);
  console.log(`    ${isRelative ? 'RELATIVE - adrift without an anchor' : 'ABSOLUTE - firmly rooted'}`);
  console.log('');
}

console.log('  *~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*');
console.log('  *  The Path Wizard has cast all 7 spells.    *');
console.log('  *  May your paths always resolve correctly!  *');
console.log('  *~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*');
console.log('');
