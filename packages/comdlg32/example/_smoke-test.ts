/**
 * Smoke test — non-interactive comdlg32 FFI integration check.
 *
 * Calls the two non-modal functions:
 *   - CommDlgExtendedError  (returns last-error DWORD; 0 on fresh state)
 *   - GetFileTitleW         (parses a file title from a path; no UI)
 *
 * Run: bun ./example/_smoke-test.ts
 */

import Comdlg32 from '../index';

const RESET = '\x1b[0m';
const GREEN = '\x1b[92m';
const RED = '\x1b[91m';

function check(label: string, cond: boolean, detail = ''): void {
  const status = cond ? `${GREEN}PASS${RESET}` : `${RED}FAIL${RESET}`;
  console.log(`  [${status}] ${label}${detail ? '  — ' + detail : ''}`);
  if (!cond) process.exitCode = 1;
}

const err0 = Comdlg32.CommDlgExtendedError();
check('CommDlgExtendedError returns DWORD 0 on fresh state', err0 === 0, `got ${err0}`);

const path = 'C:\\Windows\\System32\\notepad.exe';
const pathBuf = Buffer.from(path + '\0', 'utf16le');

const sizeNeeded = Comdlg32.GetFileTitleW(pathBuf.ptr!, null, 0);
check('GetFileTitleW with NULL buf returns required size', sizeNeeded > 0, `needed ${sizeNeeded} wide chars`);

const out = Buffer.alloc(sizeNeeded * 2);
const written = Comdlg32.GetFileTitleW(pathBuf.ptr!, out.ptr!, sizeNeeded);
check('GetFileTitleW with allocated buf returns 0 (success)', written === 0, `returned ${written}`);

const title = out.toString('utf16le').replace(/\0.*$/, '');
check('Extracted file title matches expected pattern', /^notepad\.exe$/i.test(title), `title = ${JSON.stringify(title)}`);

const err1 = Comdlg32.CommDlgExtendedError();
check('CommDlgExtendedError remains 0 after successful calls', err1 === 0, `got ${err1}`);

console.log();
console.log(process.exitCode ? `${RED}FAILED${RESET}` : `${GREEN}All smoke tests passed${RESET}`);
