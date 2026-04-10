/**
 * Symbol Explorer
 *
 * A colorful ANSI terminal dashboard that initializes the Debug Help Library
 * symbol engine, loads a system DLL, and resolves its exported symbols by name.
 * Each resolved symbol is displayed with its virtual address, size, and flags
 * in a formatted, color-coded table.
 *
 * APIs demonstrated:
 *   - SymSetOptions                 (configure symbol handling behavior)
 *   - SymGetOptions                 (read back active option flags)
 *   - SymInitialize                 (initialize the symbol handler)
 *   - SymGetSearchPath              (retrieve the symbol search path)
 *   - SymLoadModuleEx               (load symbols for a DLL by path)
 *   - SymGetModuleInfo64            (retrieve loaded module metadata)
 *   - SymFromName                   (resolve a symbol by its export name)
 *   - UnDecorateSymbolName          (demangle a C++ decorated name)
 *   - SymUnloadModule64             (unload a module's symbol data)
 *   - SymCleanup                    (release the symbol engine resources)
 *
 * Run: bun run example/symbol-explorer.ts
 */
import Dbghelp, {
  MAX_SYM_NAME,
  SYMFLAG_CONSTANT,
  SYMFLAG_EXPORT,
  SYMFLAG_FORWARDER,
  SYMFLAG_FUNCTION,
  SYMFLAG_LOCAL,
  SYMFLAG_PARAMETER,
  SYMFLAG_PUBLIC_CODE,
  SYMFLAG_THUNK,
  SYMOPT_DEFERRED_LOADS,
  SYMOPT_LOAD_LINES,
  SYMOPT_UNDNAME,
  SYM_TYPE,
  UNDNAME_COMPLETE,
} from '../index';

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const CYAN = '\x1b[96m';
const GREEN = '\x1b[92m';
const YELLOW = '\x1b[93m';
const MAGENTA = '\x1b[95m';
const WHITE = '\x1b[97m';
const RED = '\x1b[91m';

const SIZEOF_SYMBOL_INFO = 88;
const SIZEOF_IMAGEHLP_MODULE64 = 1680;

interface ResolvedSymbol {
  address: bigint;
  flags: number;
  name: string;
  size: number;
}

Dbghelp.Preload([
  'SymCleanup',
  'SymFromName',
  'SymGetModuleInfo64',
  'SymGetOptions',
  'SymGetSearchPath',
  'SymInitialize',
  'SymLoadModuleEx',
  'SymSetOptions',
  'SymUnloadModule64',
  'UnDecorateSymbolName',
]);

function readAsciiString(buffer: Buffer, offset: number, maxLength: number): string {
  let end = offset;
  while (end < offset + maxLength && buffer[end] !== 0) end++;
  return buffer.toString('ascii', offset, end);
}

function formatAddress(address: bigint): string {
  return `0x${address.toString(16).padStart(16, '0').toUpperCase()}`;
}

function formatFlags(flags: number): string {
  const labels: string[] = [];
  if (flags & SYMFLAG_EXPORT) labels.push('Export');
  if (flags & SYMFLAG_FUNCTION) labels.push('Function');
  if (flags & SYMFLAG_PUBLIC_CODE) labels.push('PublicCode');
  if (flags & SYMFLAG_THUNK) labels.push('Thunk');
  if (flags & SYMFLAG_FORWARDER) labels.push('Forwarder');
  if (flags & SYMFLAG_LOCAL) labels.push('Local');
  if (flags & SYMFLAG_PARAMETER) labels.push('Parameter');
  if (flags & SYMFLAG_CONSTANT) labels.push('Constant');
  return labels.length > 0 ? labels.join(' | ') : `0x${flags.toString(16)}`;
}

function symTypeName(symType: number): string {
  switch (symType) {
    case SYM_TYPE.SymNone: return 'None';
    case SYM_TYPE.SymCoff: return 'COFF';
    case SYM_TYPE.SymCv: return 'CodeView';
    case SYM_TYPE.SymPdb: return 'PDB';
    case SYM_TYPE.SymExport: return 'Export';
    case SYM_TYPE.SymDeferred: return 'Deferred';
    case SYM_TYPE.SymSym: return 'SYM';
    case SYM_TYPE.SymDia: return 'DIA';
    case SYM_TYPE.SymVirtual: return 'Virtual';
    default: return 'Unknown';
  }
}

function resolveSymbol(hProcess: bigint, name: string): ResolvedSymbol | null {
  const buf = Buffer.alloc(SIZEOF_SYMBOL_INFO + MAX_SYM_NAME);
  buf.writeUInt32LE(SIZEOF_SYMBOL_INFO, 0);
  buf.writeUInt32LE(MAX_SYM_NAME, 80);

  const nameBuffer = Buffer.from(`${name}\0`);
  if (!Dbghelp.SymFromName(hProcess, nameBuffer.ptr, buf.ptr)) {
    return null;
  }

  const nameLen = buf.readUInt32LE(76);
  return {
    address: buf.readBigUInt64LE(56),
    flags: buf.readUInt32LE(40),
    name: buf.toString('ascii', 84, 84 + nameLen),
    size: buf.readUInt32LE(28),
  };
}

function headerBar(title: string): string {
  const palette = ['\x1b[38;5;33m', '\x1b[38;5;39m', '\x1b[38;5;45m', '\x1b[38;5;51m', '\x1b[38;5;87m', '\x1b[38;5;123m'];
  const letters = [...title].map((ch, i) => `${palette[i % palette.length]}${ch}`).join('');
  const line = `\x1b[38;5;24m${'\u2550'.repeat(68)}${RESET}`;
  return `${line}\n  ${letters}${RESET}\n${line}`;
}

const hProcess = BigInt(process.pid);
const separator = `${DIM}${'\u2500'.repeat(100)}${RESET}`;

Dbghelp.SymSetOptions(SYMOPT_UNDNAME | SYMOPT_DEFERRED_LOADS | SYMOPT_LOAD_LINES);

if (!Dbghelp.SymInitialize(hProcess, null, 0)) {
  console.error(`${RED}SymInitialize failed${RESET}`);
  process.exit(1);
}

let moduleBase = 0n;

try {
  console.log('');
  console.log(headerBar('S Y M B O L   E X P L O R E R'));
  console.log('');

  const opts = Dbghelp.SymGetOptions();
  const searchPathBuffer = Buffer.alloc(2048);
  Dbghelp.SymGetSearchPath(hProcess, searchPathBuffer.ptr, 2048);
  const searchPath = readAsciiString(searchPathBuffer, 0, 2048);

  console.log(`${CYAN}Engine${RESET}`);
  console.log(`  Options     : 0x${opts.toString(16).padStart(8, '0')}`);
  console.log(`  Search path : ${searchPath || '(default)'}`);
  console.log('');

  const dllPath = Buffer.from('C:\\Windows\\System32\\ntdll.dll\0');
  moduleBase = Dbghelp.SymLoadModuleEx(hProcess, 0n, dllPath.ptr, null, 0x10000000n, 0, null, 0);

  if (moduleBase === 0n) {
    console.error(`${RED}SymLoadModuleEx failed for ntdll.dll${RESET}`);
    process.exit(1);
  }

  const moduleInfoBuffer = Buffer.alloc(SIZEOF_IMAGEHLP_MODULE64);
  moduleInfoBuffer.writeUInt32LE(SIZEOF_IMAGEHLP_MODULE64, 0);

  if (Dbghelp.SymGetModuleInfo64(hProcess, moduleBase, moduleInfoBuffer.ptr)) {
    const moduleName = readAsciiString(moduleInfoBuffer, 36, 32);
    const imageName = readAsciiString(moduleInfoBuffer, 68, 256);
    const pdbName = readAsciiString(moduleInfoBuffer, 580, 256);
    const imageSize = moduleInfoBuffer.readUInt32LE(16);
    const numSyms = moduleInfoBuffer.readUInt32LE(28);
    const symType = moduleInfoBuffer.readUInt32LE(32);
    const timestamp = moduleInfoBuffer.readUInt32LE(20);
    const machineType = moduleInfoBuffer.readUInt32LE(1672);
    const base = moduleInfoBuffer.readBigUInt64LE(8);

    console.log(`${CYAN}Module: ${moduleName}${RESET}`);
    console.log(`  Image       : ${imageName}`);
    console.log(`  Base        : ${formatAddress(base)}`);
    console.log(`  Size        : ${imageSize.toLocaleString()} bytes`);
    console.log(`  Symbols     : ${numSyms.toLocaleString()} (${symTypeName(symType)})`);
    console.log(`  Timestamp   : ${new Date(timestamp * 1000).toISOString()}`);
    console.log(`  Machine     : 0x${machineType.toString(16)} ${machineType === 0x8664 ? '(AMD64)' : machineType === 0x14c ? '(i386)' : machineType === 0xaa64 ? '(ARM64)' : ''}`);
    if (pdbName) {
      console.log(`  PDB         : ${pdbName}`);
    }
  }

  console.log('');

  const targetSymbols = [
    'NtCreateFile',
    'NtClose',
    'NtReadVirtualMemory',
    'NtWriteFile',
    'NtQueryInformationProcess',
    'RtlInitUnicodeString',
    'RtlGetVersion',
    'LdrLoadDll',
    'RtlAllocateHeap',
    'NtDeviceIoControlFile',
  ];

  console.log(`${CYAN}Resolved Symbols${RESET}`);
  console.log(`${DIM}${''.padEnd(2)}${'Name'.padEnd(34)}${'Address'.padEnd(20)}${'Size'.padEnd(8)}Flags${RESET}`);
  console.log(separator);

  let resolvedCount = 0;
  for (const symbolName of targetSymbols) {
    const sym = resolveSymbol(hProcess, symbolName);
    if (sym) {
      resolvedCount++;
      console.log(
        `  ${GREEN}${sym.name.padEnd(32)}${RESET}` +
        `  ${YELLOW}${formatAddress(sym.address)}${RESET}` +
        `  ${String(sym.size).padEnd(6)}` +
        `  ${MAGENTA}${formatFlags(sym.flags)}${RESET}`,
      );
    } else {
      console.log(`  ${RED}${symbolName.padEnd(32)}${RESET}  (not found)`);
    }
  }

  console.log(separator);
  console.log(`  ${resolvedCount}/${targetSymbols.length} symbols resolved`);
  console.log('');

  const mangledNames = [
    '?what@exception@std@@UEBAPEBDXZ',
    '??0runtime_error@std@@QEAA@AEBV?$basic_string@DU?$char_traits@D@std@@V?$allocator@D@2@@1@@Z',
    '??1exception@std@@UEAA@XZ',
  ];

  console.log(`${CYAN}Name Demangling${RESET}`);
  console.log(separator);

  for (const mangled of mangledNames) {
    const inBuf = Buffer.from(`${mangled}\0`);
    const outBuf = Buffer.alloc(1024);
    const chars = Dbghelp.UnDecorateSymbolName(inBuf.ptr, outBuf.ptr, 1024, UNDNAME_COMPLETE);
    const demangled = chars > 0 ? outBuf.toString('ascii', 0, chars) : '(failed)';

    console.log(`  ${DIM}decorated  :${RESET} ${mangled}`);
    console.log(`  ${GREEN}demangled${RESET} : ${WHITE}${BOLD}${demangled}${RESET}`);
    console.log('');
  }

  console.log(separator);
} finally {
  if (moduleBase !== 0n) {
    Dbghelp.SymUnloadModule64(hProcess, moduleBase);
  }
  Dbghelp.SymCleanup(hProcess);
  console.log(`${DIM}Cleanup complete.${RESET}`);
  console.log('');
}
