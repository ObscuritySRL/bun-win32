/**
 * Crash Report
 *
 * A professional process diagnostic tool that simulates the data-gathering
 * phase of a crash reporter. It initializes the dbghelp symbol engine, loads
 * multiple system DLLs, gathers module metadata, resolves critical API
 * addresses, and cross-verifies symbol resolution in both directions
 * (name-to-address and address-to-name).
 *
 * APIs demonstrated:
 *   - SymSetOptions                 (configure symbol engine behavior)
 *   - SymInitialize                 (start the symbol handler)
 *   - SymLoadModuleEx               (load symbol data for a DLL)
 *   - SymGetModuleInfo64            (retrieve module metadata)
 *   - SymFromName                   (forward resolve: name to address)
 *   - SymFromAddr                   (reverse resolve: address to symbol)
 *   - UnDecorateSymbolName          (demangle C++ decorated names)
 *   - SymUnloadModule64             (unload a module's symbol data)
 *   - SymCleanup                    (release symbol engine resources)
 *
 * Run: bun run example/crash-report.ts
 */
import Dbghelp, {
  MAX_SYM_NAME,
  SYMOPT_DEFERRED_LOADS,
  SYMOPT_UNDNAME,
  SYM_TYPE,
  UNDNAME_NAME_ONLY,
} from '../index';

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const CYAN = '\x1b[96m';
const GREEN = '\x1b[92m';
const YELLOW = '\x1b[93m';
const RED = '\x1b[91m';
const WHITE = '\x1b[97m';

const SIZEOF_SYMBOL_INFO = 88;
const SIZEOF_IMAGEHLP_MODULE64 = 1680;

interface ModuleSnapshot {
  base: bigint;
  checksum: number;
  imageName: string;
  imageSize: number;
  loadedPdbName: string;
  machineType: number;
  moduleName: string;
  numSyms: number;
  symType: number;
  timestamp: number;
}

Dbghelp.Preload([
  'SymCleanup',
  'SymFromAddr',
  'SymFromName',
  'SymGetModuleInfo64',
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

function formatHex(value: bigint, width = 16): string {
  return `0x${value.toString(16).padStart(width, '0').toUpperCase()}`;
}

function symTypeName(symType: number): string {
  switch (symType) {
    case SYM_TYPE.SymNone: return 'None';
    case SYM_TYPE.SymCoff: return 'COFF';
    case SYM_TYPE.SymCv: return 'CodeView';
    case SYM_TYPE.SymPdb: return 'PDB';
    case SYM_TYPE.SymExport: return 'Export';
    case SYM_TYPE.SymDeferred: return 'Deferred';
    case SYM_TYPE.SymDia: return 'DIA';
    case SYM_TYPE.SymVirtual: return 'Virtual';
    default: return `Unknown(${symType})`;
  }
}

function machineTypeName(machine: number): string {
  switch (machine) {
    case 0x8664: return 'AMD64';
    case 0x014c: return 'i386';
    case 0xaa64: return 'ARM64';
    default: return `0x${machine.toString(16)}`;
  }
}

function getModuleInfo(hProcess: bigint, base: bigint): ModuleSnapshot | null {
  const buf = Buffer.alloc(SIZEOF_IMAGEHLP_MODULE64);
  buf.writeUInt32LE(SIZEOF_IMAGEHLP_MODULE64, 0);

  if (!Dbghelp.SymGetModuleInfo64(hProcess, base, buf.ptr)) {
    return null;
  }

  return {
    base: buf.readBigUInt64LE(8),
    checksum: buf.readUInt32LE(24),
    imageName: readAsciiString(buf, 68, 256),
    imageSize: buf.readUInt32LE(16),
    loadedPdbName: readAsciiString(buf, 580, 256),
    machineType: buf.readUInt32LE(1672),
    moduleName: readAsciiString(buf, 36, 32),
    numSyms: buf.readUInt32LE(28),
    symType: buf.readUInt32LE(32),
    timestamp: buf.readUInt32LE(20),
  };
}

function forwardResolve(hProcess: bigint, name: string): { address: bigint; flags: number; resolvedName: string; size: number } | null {
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
    resolvedName: buf.toString('ascii', 84, 84 + nameLen),
    size: buf.readUInt32LE(28),
  };
}

function reverseResolve(hProcess: bigint, address: bigint): { displacement: bigint; name: string } | null {
  const buf = Buffer.alloc(SIZEOF_SYMBOL_INFO + MAX_SYM_NAME);
  buf.writeUInt32LE(SIZEOF_SYMBOL_INFO, 0);
  buf.writeUInt32LE(MAX_SYM_NAME, 80);

  const displacementBuffer = Buffer.alloc(8);
  if (!Dbghelp.SymFromAddr(hProcess, address, displacementBuffer.ptr, buf.ptr)) {
    return null;
  }

  const nameLen = buf.readUInt32LE(76);
  return {
    displacement: displacementBuffer.readBigUInt64LE(0),
    name: buf.toString('ascii', 84, 84 + nameLen),
  };
}

const hProcess = BigInt(process.pid);
const dlls = [
  { path: 'C:\\Windows\\System32\\ntdll.dll', base: 0x10000000n, symbols: ['NtCreateFile', 'NtClose', 'RtlGetVersion', 'NtQueryInformationProcess', 'RtlAllocateHeap'] },
  { path: 'C:\\Windows\\System32\\kernel32.dll', base: 0x20000000n, symbols: ['CreateFileW', 'CloseHandle', 'GetCurrentProcessId', 'VirtualAlloc', 'ReadFile'] },
];
const loadedBases: bigint[] = [];
const separator = `${DIM}${'\u2500'.repeat(108)}${RESET}`;

Dbghelp.SymSetOptions(SYMOPT_UNDNAME | SYMOPT_DEFERRED_LOADS);

if (!Dbghelp.SymInitialize(hProcess, null, 0)) {
  console.error(`${RED}SymInitialize failed${RESET}`);
  process.exit(1);
}

try {
  console.log('');
  console.log(`${BOLD}${CYAN}CRASH REPORT${RESET}${DIM}  diagnostic snapshot${RESET}`);
  console.log(`${DIM}Generated ${new Date().toISOString()} by @bun-win32/dbghelp${RESET}`);
  console.log(separator);

  console.log('');
  console.log(`${BOLD}Process${RESET}`);
  console.log(`  PID       : ${process.pid}`);
  console.log(`  Runtime   : Bun ${Bun.version}`);
  console.log(`  Platform  : ${process.platform} ${process.arch}`);
  console.log('');

  console.log(`${BOLD}Loaded Modules${RESET}`);
  console.log(separator);
  console.log(`  ${'Module'.padEnd(14)}${'Base'.padEnd(20)}${'Size'.padEnd(14)}${'Symbols'.padEnd(10)}${'Type'.padEnd(10)}${'Machine'.padEnd(10)}Image`);
  console.log(separator);

  for (const dll of dlls) {
    const pathBuffer = Buffer.from(`${dll.path}\0`);
    const base = Dbghelp.SymLoadModuleEx(hProcess, 0n, pathBuffer.ptr, null, dll.base, 0, null, 0);

    if (base === 0n) {
      console.log(`  ${RED}Failed to load: ${dll.path}${RESET}`);
      continue;
    }

    loadedBases.push(base);
    const info = getModuleInfo(hProcess, base);
    if (info) {
      console.log(
        `  ${GREEN}${info.moduleName.padEnd(12)}${RESET}` +
        `  ${formatHex(info.base)}` +
        `  ${String(info.imageSize.toLocaleString()).padEnd(12)}` +
        `  ${String(info.numSyms).padEnd(8)}` +
        `  ${symTypeName(info.symType).padEnd(8)}` +
        `  ${machineTypeName(info.machineType).padEnd(8)}` +
        `  ${info.imageName}`,
      );
    }
  }

  console.log(separator);
  console.log('');

  console.log(`${BOLD}Symbol Resolution${RESET}`);
  console.log(separator);
  console.log(`  ${'Module'.padEnd(12)}${'Symbol'.padEnd(36)}${'Address'.padEnd(20)}${'Size'.padEnd(8)}Reverse Check`);
  console.log(separator);

  let resolvedCount = 0;
  let verifiedCount = 0;

  for (const dll of dlls) {
    const moduleName = dll.path.split('\\').pop()!.replace('.dll', '');

    for (const symbolName of dll.symbols) {
      const fwd = forwardResolve(hProcess, symbolName);
      if (!fwd) {
        console.log(`  ${moduleName.padEnd(12)}${RED}${symbolName.padEnd(36)}(not found)${RESET}`);
        continue;
      }

      resolvedCount++;
      const rev = reverseResolve(hProcess, fwd.address);
      const reverseOk = rev !== null && rev.name === fwd.resolvedName;
      if (reverseOk) verifiedCount++;

      console.log(
        `  ${DIM}${moduleName.padEnd(12)}${RESET}` +
        `${YELLOW}${fwd.resolvedName.padEnd(36)}${RESET}` +
        `${formatHex(fwd.address)}` +
        `  ${String(fwd.size).padEnd(6)}` +
        `  ${reverseOk ? `${GREEN}verified${RESET}` : `${RED}mismatch (${rev?.name ?? 'null'})${RESET}`}`,
      );
    }
  }

  console.log(separator);
  console.log(`  ${resolvedCount} resolved, ${verifiedCount} round-trip verified`);
  console.log('');

  console.log(`${BOLD}C++ Name Demangling${RESET}`);
  console.log(separator);

  const samples = [
    '?what@exception@std@@UEBAPEBDXZ',
    '??1exception@std@@UEAA@XZ',
    '??0runtime_error@std@@QEAA@AEBV?$basic_string@DU?$char_traits@D@std@@V?$allocator@D@2@@1@@Z',
  ];

  for (const mangled of samples) {
    const inBuf = Buffer.from(`${mangled}\0`);
    const outBuf = Buffer.alloc(1024);
    const written = Dbghelp.UnDecorateSymbolName(inBuf.ptr, outBuf.ptr, 1024, UNDNAME_NAME_ONLY);
    const demangled = written > 0 ? outBuf.toString('ascii', 0, written) : '(failed)';

    console.log(`  ${DIM}${mangled}${RESET}`);
    console.log(`  ${WHITE}${BOLD}=> ${demangled}${RESET}`);
    console.log('');
  }

  console.log(separator);
  console.log(`${GREEN}Diagnostic complete.${RESET}`);
} finally {
  for (const base of loadedBases) {
    Dbghelp.SymUnloadModule64(hProcess, base);
  }
  Dbghelp.SymCleanup(hProcess);
}

console.log('');
