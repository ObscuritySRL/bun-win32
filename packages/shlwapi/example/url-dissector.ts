/**
 * URL Dissector - Parse URLs and demonstrate string utilities.
 *
 * Uses UrlGetPartW to extract individual components (scheme, hostname, path,
 * query, port) from URLs. PathIsURLW validates whether strings are URLs.
 * StrFormatByteSizeW formats raw byte counts into human-readable sizes.
 * StrCmpLogicalW performs natural string comparison (so "file2" sorts before
 * "file10", unlike a naive strcmp). Tests multiple URLs and string inputs
 * to demonstrate each function thoroughly.
 *
 * Demonstrates:
 * - UrlGetPartW (URL_PART_SCHEME, HOSTNAME, QUERY, PORT)
 * - PathIsURLW (URL validation)
 * - StrFormatByteSizeW (byte size formatting)
 * - StrCmpLogicalW (natural string sorting)
 * - UrlPart enum constants
 *
 * Run: bun run example/url-dissector.ts
 */

import Shlwapi, { UrlPart } from '../index';

const encode = (str: string) => Buffer.from(`${str}\0`, 'utf16le');

// Helper to read a wide string from a Buffer
function readWideStringBuf(buf: Buffer): string {
  let end = 0;
  while (end < buf.length - 1) {
    if (buf[end] === 0 && buf[end + 1] === 0) break;
    end += 2;
  }
  return buf.subarray(0, end).toString('utf16le');
}

// Helper to extract a URL part
function getUrlPart(url: string, part: number, partName: string): string {
  const outBuf = Buffer.alloc(1024);
  const sizeBuf = Buffer.alloc(4);
  sizeBuf.writeUInt32LE(512, 0); // max output chars

  const hr = Shlwapi.UrlGetPartW(encode(url).ptr, outBuf.ptr, sizeBuf.ptr, part, 0);
  if (hr !== 0) return `(error: 0x${(hr >>> 0).toString(16)})`;
  return readWideStringBuf(outBuf) || '(empty)';
}

const divider = '-'.repeat(80);

console.log('URL DISSECTOR AND STRING UTILITIES REPORT');
console.log(`Generated: ${new Date().toLocaleString()}`);
console.log('');

// Section 1: URL Validation with PathIsURLW
console.log('1. URL VALIDATION (PathIsURLW)');
console.log(divider);
console.log('  ' + 'Input'.padEnd(50) + 'Is URL?');
console.log(divider);

const validationTests = [
  'https://example.com/path?query=value',
  'http://localhost:3000',
  'ftp://files.server.org/pub/',
  'file:///C:/Users/test/doc.txt',
  'C:\\Windows\\System32\\notepad.exe',
  'not-a-url-at-all',
  'mailto:user@example.com',
  '//network/share/file.txt',
  'javascript:alert(1)',
  'https://sub.domain.example.co.uk:8443/api/v2/data?format=json&limit=100',
];

for (const input of validationTests) {
  const isUrl = Shlwapi.PathIsURLW(encode(input).ptr);
  const display = input.length > 48 ? input.substring(0, 45) + '...' : input;
  console.log('  ' + display.padEnd(50) + (isUrl ? 'Yes' : 'No'));
}

console.log('');

// Section 2: URL Parsing with UrlGetPartW
console.log('2. URL PARSING (UrlGetPartW)');
console.log(divider);

const urls = [
  'https://api.example.com:8443/v2/users?page=1&limit=50',
  'http://localhost:3000/dashboard',
  'ftp://anonymous@files.server.org/pub/archive.zip',
  'https://sub.domain.co.uk/path/to/resource?q=search&lang=en#section',
  'file:///C:/Users/Developer/projects/readme.md',
];

for (const url of urls) {
  console.log(`  URL: ${url}`);
  console.log(`    Scheme:   ${getUrlPart(url, UrlPart.URL_PART_SCHEME, 'SCHEME')}`);
  console.log(`    Hostname: ${getUrlPart(url, UrlPart.URL_PART_HOSTNAME, 'HOSTNAME')}`);
  console.log(`    Port:     ${getUrlPart(url, UrlPart.URL_PART_PORT, 'PORT')}`);
  console.log(`    Query:    ${getUrlPart(url, UrlPart.URL_PART_QUERY, 'QUERY')}`);
  console.log(`    Username: ${getUrlPart(url, UrlPart.URL_PART_USERNAME, 'USERNAME')}`);
  console.log(`    Password: ${getUrlPart(url, UrlPart.URL_PART_PASSWORD, 'PASSWORD')}`);
  console.log('');
}

// Section 3: StrFormatByteSizeW
console.log('3. BYTE SIZE FORMATTING (StrFormatByteSizeW)');
console.log(divider);
console.log('  ' + 'Bytes'.padEnd(25) + 'Formatted');
console.log(divider);

const byteSizes: bigint[] = [
  0n,
  512n,
  1024n,
  1536n,
  10240n,
  102400n,
  1048576n,           // 1 MB
  10485760n,          // 10 MB
  104857600n,         // 100 MB
  1073741824n,        // 1 GB
  5368709120n,        // 5 GB
  10737418240n,       // 10 GB
  1099511627776n,     // 1 TB
  1125899906842624n,  // 1 PB
];

for (const size of byteSizes) {
  const outBuf = Buffer.alloc(128);
  // StrFormatByteSizeW takes a LONGLONG (i64) as first parameter (mapped to u64 in FFI)
  const result = Shlwapi.StrFormatByteSizeW(size, outBuf.ptr, 64);
  const formatted = result ? readWideStringBuf(outBuf) : '(failed)';
  console.log('  ' + size.toLocaleString().padEnd(25) + formatted);
}

console.log('');

// Section 4: Natural String Sorting with StrCmpLogicalW
console.log('4. NATURAL STRING SORTING (StrCmpLogicalW)');
console.log(divider);

// First show pairwise comparisons
console.log('  Pairwise comparisons:');
console.log('  ' + 'String A'.padEnd(20) + 'String B'.padEnd(20) + 'Result'.padEnd(10) + 'Meaning');
console.log('  ' + '-'.repeat(70));

const comparisons: Array<[string, string]> = [
  ['file2', 'file10'],
  ['img1', 'img2'],
  ['img10', 'img9'],
  ['doc100', 'doc20'],
  ['chapter1', 'chapter1'],
  ['v2.0.1', 'v10.0.0'],
  ['test_a', 'test_b'],
  ['item', 'item2'],
];

for (const [a, b] of comparisons) {
  const result = Shlwapi.StrCmpLogicalW(encode(a).ptr, encode(b).ptr);
  let meaning = 'Equal';
  if (result < 0) meaning = 'A < B (A sorts first)';
  else if (result > 0) meaning = 'A > B (B sorts first)';

  console.log('  ' + a.padEnd(20) + b.padEnd(20) + String(result).padEnd(10) + meaning);
}

console.log('');

// Now sort a list naturally
console.log('  Natural sort demonstration:');
const unsorted = [
  'file1.txt', 'file10.txt', 'file2.txt', 'file20.txt', 'file3.txt',
  'file100.txt', 'file11.txt', 'file9.txt', 'file21.txt', 'file0.txt',
];

// lexicographic sort for comparison
const lexSorted = [...unsorted].sort();

// natural sort via StrCmpLogicalW
const natSorted = [...unsorted].sort((a, b) => {
  return Shlwapi.StrCmpLogicalW(encode(a).ptr, encode(b).ptr);
});

console.log('');
console.log('  ' + 'Lexicographic Order'.padEnd(25) + 'Natural Order (StrCmpLogicalW)');
console.log('  ' + '-'.repeat(55));
for (let i = 0; i < unsorted.length; i++) {
  console.log('  ' + (lexSorted[i] || '').padEnd(25) + (natSorted[i] || ''));
}

console.log('');
console.log(divider);
console.log('Report complete.');
