/**
 * File Dialog Diagnostic
 *
 * Opens the native GetOpenFileNameW dialog and produces a comprehensive,
 * aligned-table dump of every field the dialog wrote back to OPENFILENAMEW —
 * resolved path, parsed file-name offsets, filter index, flags, FlagsEx — plus
 * a sizing-then-fetch demonstration of GetFileTitleW, a CommDlgExtendedError
 * probe, and a Bun-level stat of the resolved path with formatted size and
 * timestamp output. Cancel the dialog to exit cleanly.
 *
 * APIs demonstrated (Comdlg32):
 *   - GetOpenFileNameW       (native Open File dialog with custom filter)
 *   - GetFileTitleW          (extract a display title; demonstrates the
 *                              NULL-buffer sizing call + real buffer fetch)
 *   - CommDlgExtendedError   (read failure code after a FALSE return)
 *
 * OPENFILENAMEW layout (152 bytes on x64):
 *   +0x00: DWORD     lStructSize
 *   +0x08: HWND      hwndOwner
 *   +0x10: HINSTANCE hInstance
 *   +0x18: LPCWSTR   lpstrFilter           (pipe-separated, NUL-delimited)
 *   +0x20: LPWSTR    lpstrCustomFilter
 *   +0x28: DWORD     nMaxCustFilter
 *   +0x2C: DWORD     nFilterIndex          (1-based)
 *   +0x30: LPWSTR    lpstrFile             (in/out — receives picked path)
 *   +0x38: DWORD     nMaxFile              (wide-char count of lpstrFile)
 *   +0x40: LPWSTR    lpstrFileTitle
 *   +0x48: DWORD     nMaxFileTitle
 *   +0x50: LPCWSTR   lpstrInitialDir
 *   +0x58: LPCWSTR   lpstrTitle            (dialog title)
 *   +0x60: DWORD     Flags                 (OFN_*)
 *   +0x64: WORD      nFileOffset           (offset of basename in lpstrFile)
 *   +0x66: WORD      nFileExtension        (offset of '.ext' in lpstrFile)
 *   +0x68: LPCWSTR   lpstrDefExt
 *   +0x70: LPARAM    lCustData
 *   +0x78: LPOFNHOOKPROC lpfnHook
 *   +0x80: LPCWSTR   lpTemplateName
 *   +0x88: void*     pvReserved
 *   +0x90: DWORD     dwReserved
 *   +0x94: DWORD     FlagsEx
 *
 * Run: bun run example/file-dialog-diagnostic.ts
 */

import { statSync } from 'node:fs';

import Comdlg32, { OpenFileNameFlag } from '../index';
import Kernel32 from '@bun-win32/kernel32';
import User32 from '@bun-win32/user32';

Comdlg32.Preload(['GetOpenFileNameW', 'GetFileTitleW', 'CommDlgExtendedError']);
Kernel32.Preload('GetConsoleWindow');
User32.Preload('GetForegroundWindow');

// Real owner HWND so the dialog renders in front of the terminal. Without
// an owner, the Open File dialog can spawn off-screen or behind the host
// window under ConPTY-based terminals (VS Code, Windows Terminal).
const hwndOwner: bigint = Kernel32.GetConsoleWindow() || User32.GetForegroundWindow();

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const CYAN = '\x1b[96m';
const GREEN = '\x1b[92m';
const YELLOW = '\x1b[93m';
const RED = '\x1b[91m';
const WHITE = '\x1b[97m';
const GRAY = '\x1b[90m';

const OPENFILENAMEW_SIZE = 152;
const PATH_BUF_CHARS = 1024;
const TITLE_BUF_CHARS = 260;

// Build a multi-section filter string. Each pair is: <Label>\0<Patterns>\0,
// and the whole list ends with an extra \0.
const filterParts = [
  'All Files (*.*)',
  '*.*',
  'TypeScript / JavaScript',
  '*.ts;*.tsx;*.js;*.jsx;*.mjs;*.cjs',
  'JSON / TOML / YAML',
  '*.json;*.toml;*.yaml;*.yml',
  'Images',
  '*.png;*.jpg;*.jpeg;*.gif;*.bmp;*.webp;*.ico',
  'Documents',
  '*.md;*.txt;*.pdf;*.docx;*.xlsx',
  'Archives',
  '*.zip;*.7z;*.tar;*.gz;*.rar',
];
const filter = Buffer.from(filterParts.join('\0') + '\0\0', 'utf16le');

const fileBuf = Buffer.alloc(PATH_BUF_CHARS * 2);
const fileTitleBuf = Buffer.alloc(TITLE_BUF_CHARS * 2);
const dialogTitle = Buffer.from('@bun-win32/comdlg32 — File Dialog Diagnostic\0', 'utf16le');
const initialDir = Buffer.from(process.cwd() + '\0', 'utf16le');

const ofn = Buffer.alloc(OPENFILENAMEW_SIZE);
const view = new DataView(ofn.buffer);

view.setUint32(0x00, OPENFILENAMEW_SIZE, true);
view.setBigUint64(0x08, hwndOwner, true); // hwndOwner — so the dialog renders in front of the terminal
view.setBigUint64(0x18, BigInt(filter.ptr!), true);
view.setUint32(0x2c, 4, true); // nFilterIndex — start on "Images" (4th pair, 1-based)
view.setBigUint64(0x30, BigInt(fileBuf.ptr!), true);
view.setUint32(0x38, PATH_BUF_CHARS, true);
view.setBigUint64(0x40, BigInt(fileTitleBuf.ptr!), true);
view.setUint32(0x48, TITLE_BUF_CHARS, true);
view.setBigUint64(0x50, BigInt(initialDir.ptr!), true);
view.setBigUint64(0x58, BigInt(dialogTitle.ptr!), true);
view.setUint32(0x60, OpenFileNameFlag.OFN_EXPLORER | OpenFileNameFlag.OFN_FILEMUSTEXIST | OpenFileNameFlag.OFN_PATHMUSTEXIST | OpenFileNameFlag.OFN_HIDEREADONLY | OpenFileNameFlag.OFN_DONTADDTORECENT, true);

console.log();
console.log(`  ${CYAN}${BOLD}FILE DIALOG DIAGNOSTIC${RESET}`);
console.log(`  ${GRAY}Open File dialog launched. Pick a file or click Cancel.${RESET}`);
console.log();

const ok = Comdlg32.GetOpenFileNameW(ofn.ptr!);

if (!ok) {
  const err = Comdlg32.CommDlgExtendedError();
  if (err === 0) {
    console.log(`  ${YELLOW}User cancelled.${RESET}  ${DIM}CommDlgExtendedError = 0 (no error)${RESET}`);
  } else {
    console.log(`  ${RED}GetOpenFileNameW failed.${RESET}  CommDlgExtendedError = 0x${err.toString(16).padStart(4, '0')}`);
  }
  console.log();
  process.exit(0);
}

// Read every field the dialog wrote back
const pickedPath = fileBuf.toString('utf16le').replace(/\0.*$/, '');
const pickedFileTitle = fileTitleBuf.toString('utf16le').replace(/\0.*$/, '');
const flags = view.getUint32(0x60, true);
const flagsEx = view.getUint32(0x94, true);
const nFileOffset = view.getUint16(0x64, true);
const nFileExtension = view.getUint16(0x66, true);
const nFilterIndex = view.getUint32(0x2c, true);

// Demonstrate GetFileTitleW sizing pattern: NULL buffer returns required length
const pathPtr = fileBuf.ptr!;
const required = Comdlg32.GetFileTitleW(pathPtr, null, 0);
const titleBuf2 = Buffer.alloc(Math.max(2, required * 2));
const written = Comdlg32.GetFileTitleW(pathPtr, titleBuf2.ptr!, titleBuf2.byteLength / 2);
const computedTitle = titleBuf2.toString('utf16le').replace(/\0.*$/, '');

// Bun stat
let fileSize = -1n;
let mtime = 0;
let isFile = false;
try {
  const s = statSync(pickedPath);
  fileSize = BigInt(s.size);
  mtime = s.mtimeMs;
  isFile = s.isFile();
} catch {
  // ignore — file may have been removed or be inaccessible
}

function fmtBytes(n: bigint): string {
  if (n < 0n) return 'n/a';
  if (n < 1024n) return `${n} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let val = Number(n);
  let u = -1;
  do {
    val /= 1024;
    u++;
  } while (val >= 1024 && u < units.length - 1);
  return `${val.toFixed(2)} ${units[u]}`;
}

function fmtDate(ms: number): string {
  if (ms === 0) return 'n/a';
  return new Date(ms)
    .toISOString()
    .replace('T', ' ')
    .replace(/\.\d+Z$/, ' UTC');
}

// Decode OFN flags into readable names
function decodeFlags(flagsValue: number): string[] {
  const set: string[] = [];
  for (const [k, v] of Object.entries(OpenFileNameFlag)) {
    if (typeof v !== 'number') continue;
    const bits: number = v;
    if (bits !== 0 && (flagsValue & bits) === bits) set.push(k);
  }
  return set;
}

const setFlags = decodeFlags(flags);
const basenameFromOffset = pickedPath.slice(nFileOffset);
const extFromOffset = nFileExtension > 0 ? pickedPath.slice(nFileExtension) : '';

// ── Render ─────────────────────────────────────────────────────────────────

const LABEL_W = 22;

function row(label: string, value: string, color = WHITE): void {
  console.log(`  ${GRAY}${label.padEnd(LABEL_W)}${RESET} ${color}${value}${RESET}`);
}

function header(text: string): void {
  console.log();
  console.log(`  ${CYAN}${BOLD}${text}${RESET}`);
  console.log(`  ${DIM}${'─'.repeat(text.length + 4)}${RESET}`);
}

console.log();
console.log(`  ${GREEN}${BOLD}OK${RESET}  GetOpenFileNameW returned TRUE`);

header('Resolved Selection');
row('Picked path', pickedPath);
row('File title (struct)', pickedFileTitle || '(empty)');
row('File title (computed)', computedTitle);
row('Title bytes required', `${required} wide chars (incl. NUL)`);
row('Title bytes written', `${written} wide chars`);

header('OPENFILENAMEW Field Dump');
row('lStructSize', `${view.getUint32(0x00, true)} bytes`);
row('hwndOwner', `0x${view.getBigUint64(0x08, true).toString(16).padStart(16, '0')}`);
row('nFilterIndex', `${nFilterIndex}  ${DIM}(${filterParts[(nFilterIndex - 1) * 2] ?? '?'})${RESET}`);
row('nMaxFile (in)', `${PATH_BUF_CHARS} wide chars`);
row('nMaxFileTitle (in)', `${TITLE_BUF_CHARS} wide chars`);
row('nFileOffset', `${nFileOffset}  ${DIM}→ basename "${basenameFromOffset}"${RESET}`);
row('nFileExtension', extFromOffset ? `${nFileExtension}  ${DIM}→ extension "${extFromOffset}"${RESET}` : `${nFileExtension}  ${DIM}(no extension)${RESET}`);
row('Flags (raw)', `0x${flags.toString(16).padStart(8, '0')}`);
row('Flags (decoded)', setFlags.join(' | ') || '(none)');
row('FlagsEx', `0x${flagsEx.toString(16).padStart(8, '0')}`);

header('File Stat (Bun)');
row('Exists / is file', isFile ? `${GREEN}yes${RESET}` : `${YELLOW}no${RESET}`, '');
row('Size', fmtBytes(fileSize));
row('Modified', fmtDate(mtime));

header('Last-Error Probe');
const finalErr = Comdlg32.CommDlgExtendedError();
row('CommDlgExtendedError', `0x${finalErr.toString(16).padStart(4, '0')}  ${DIM}(${finalErr === 0 ? 'no error' : 'see CDERR_/PDERR_/FNERR_'})${RESET}`);

console.log();
