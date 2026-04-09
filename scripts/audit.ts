#!/usr/bin/env bun
/**
 * audit.ts — FFI Binding Type Consistency Auditor
 *
 * Cross-references three sources to find type mismatches:
 *   1. FFI symbol declarations (FFIType in Symbols)
 *   2. TypeScript method signatures (parameter & return types)
 *   3. Windows SDK headers (C prototypes, when available)
 *
 * Usage:
 *   bun run scripts/audit.ts kernel32          # audit one package
 *   bun run scripts/audit.ts --all             # audit every package
 *   bun run scripts/audit.ts kernel32 --fix    # emit fix suggestions
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const ROOT = join(import.meta.dir, '..');
const PACKAGES = join(ROOT, 'packages');
const SDK_INCLUDE = 'C:/Program Files (x86)/Windows Kits/10/Include/10.0.22000.0/um';

// ── FFI type → expected JS runtime type ────────────────────────────────────

const FFI_TO_JS: Record<string, string> = {
  'FFIType.u64': 'bigint',
  'FFIType.i64': 'bigint',
  'FFIType.ptr': 'Pointer',
  'FFIType.u32': 'number',
  'FFIType.i32': 'number',
  'FFIType.u16': 'number',
  'FFIType.i16': 'number',
  'FFIType.u8': 'number',
  'FFIType.f32': 'number',
  'FFIType.f64': 'number',
  'FFIType.void': 'void',
};

// ── Core type aliases → JS type ────────────────────────────────────────────

const CORE_TYPES: Record<string, string> = {
  // number
  ACCESS_MASK: 'number',
  BOOL: 'number',
  BOOLEAN: 'number',
  BYTE: 'number',
  CHAR: 'number',
  DWORD: 'number',
  HRESULT: 'number',
  INT: 'number',
  LONG: 'number',
  SHORT: 'number',
  UINT: 'number',
  ULONG: 'number',
  USHORT: 'number',
  WCHAR: 'number',
  WORD: 'number',
  // bigint
  DWORD_PTR: 'bigint',
  HANDLE: 'bigint',
  HINSTANCE: 'bigint',
  HMODULE: 'bigint',
  HWND: 'bigint',
  INT_PTR: 'bigint',
  LONG_PTR: 'bigint',
  SIZE_T: 'bigint',
  UINT_PTR: 'bigint',
  ULONG_PTR: 'bigint',
  LPARAM: 'bigint',
  LRESULT: 'bigint',
  WPARAM: 'bigint',
  // Pointer
  LPBOOL: 'Pointer',
  LPBYTE: 'Pointer',
  LPCSTR: 'Pointer',
  LPCVOID: 'Pointer',
  LPCWSTR: 'Pointer',
  LPDWORD: 'Pointer',
  LPHANDLE: 'Pointer',
  LPSECURITY_ATTRIBUTES: 'Pointer',
  LPSTR: 'Pointer',
  LPVOID: 'Pointer',
  LPWSTR: 'Pointer',
  PBYTE: 'Pointer',
  PDWORD: 'Pointer',
  PHANDLE: 'Pointer',
  PULONG: 'Pointer',
  PVOID: 'Pointer',
  Pointer: 'Pointer',
  // Special
  NULL: 'null',
  VOID: 'void',
  void: 'void',
};

// ── C type → expected FFI type (for SDK header cross-check) ────────────────

const C_TYPE_TO_FFI: Record<string, string> = {
  // Handles → u64
  HANDLE: 'FFIType.u64',
  HGLOBAL: 'FFIType.u64',
  HLOCAL: 'FFIType.u64',
  HMODULE: 'FFIType.u64',
  HINSTANCE: 'FFIType.u64',
  HWND: 'FFIType.u64',
  HDC: 'FFIType.u64',
  HKEY: 'FFIType.u64',
  HICON: 'FFIType.u64',
  HCURSOR: 'FFIType.u64',
  HMENU: 'FFIType.u64',
  HBRUSH: 'FFIType.u64',
  HPEN: 'FFIType.u64',
  HFONT: 'FFIType.u64',
  HRGN: 'FFIType.u64',
  HBITMAP: 'FFIType.u64',
  HPALETTE: 'FFIType.u64',
  HDESK: 'FFIType.u64',
  HWINSTA: 'FFIType.u64',
  HHOOK: 'FFIType.u64',
  HDWP: 'FFIType.u64',
  HMONITOR: 'FFIType.u64',
  HACCEL: 'FFIType.u64',
  HPCON: 'FFIType.u64',
  HRSRC: 'FFIType.u64',
  HCRYPTHASH: 'FFIType.u64',
  HCRYPTKEY: 'FFIType.u64',
  HCRYPTPROV: 'FFIType.u64',
  HUSKEY: 'FFIType.u64',
  HGLRC: 'FFIType.u64',
  SC_HANDLE: 'FFIType.u64',
  HCERTSTORE: 'FFIType.u64',
  PCCERT_CONTEXT: 'FFIType.u64',
  WINUSB_INTERFACE_HANDLE: 'FFIType.u64',
  WINUSB_ISOCH_BUFFER_HANDLE: 'FFIType.u64',
  // 64-bit integers → u64
  SIZE_T: 'FFIType.u64',
  DWORD_PTR: 'FFIType.u64',
  UINT_PTR: 'FFIType.u64',
  ULONG_PTR: 'FFIType.u64',
  ULONGLONG: 'FFIType.u64',
  DWORDLONG: 'FFIType.u64',
  LARGE_INTEGER: 'FFIType.i64',
  ULARGE_INTEGER: 'FFIType.u64',
  // Signed 64-bit
  INT_PTR: 'FFIType.i64',
  LONG_PTR: 'FFIType.i64',
  LRESULT: 'FFIType.i64',
  LPARAM: 'FFIType.i64',
  WPARAM: 'FFIType.u64',
  // 32-bit unsigned → u32
  DWORD: 'FFIType.u32',
  UINT: 'FFIType.u32',
  ULONG: 'FFIType.u32',
  COLORREF: 'FFIType.u32',
  ACCESS_MASK: 'FFIType.u32',
  HRESULT: 'FFIType.i32',
  // 32-bit signed → i32
  BOOL: 'FFIType.i32',
  INT: 'FFIType.i32',
  LONG: 'FFIType.i32',
  // 16-bit → u16
  WORD: 'FFIType.u16',
  USHORT: 'FFIType.u16',
  ATOM: 'FFIType.u16',
  SHORT: 'FFIType.i16',
  // 8-bit
  BYTE: 'FFIType.u8',
  BOOLEAN: 'FFIType.u8',
  CHAR: 'FFIType.u8',
  UCHAR: 'FFIType.u8',
  // By-value structs → u64
  WINUSB_SETUP_PACKET: 'FFIType.u64',
  // Pointer types
  PUCHAR: 'FFIType.ptr',
  PWINUSB_INTERFACE_HANDLE: 'FFIType.ptr',
  PWINUSB_ISOCH_BUFFER_HANDLE: 'FFIType.ptr',
  PUSB_CONFIGURATION_DESCRIPTOR: 'FFIType.ptr',
  PUSB_INTERFACE_DESCRIPTOR: 'FFIType.ptr',
  PUSB_COMMON_DESCRIPTOR: 'FFIType.ptr',
  PWINUSB_PIPE_INFORMATION: 'FFIType.ptr',
  PWINUSB_PIPE_INFORMATION_EX: 'FFIType.ptr',
  PUSBD_ISO_PACKET_DESCRIPTOR: 'FFIType.ptr',
  LPOVERLAPPED: 'FFIType.ptr',
  // void
  VOID: 'FFIType.void',
  void: 'FFIType.void',
};

// ── C type → suggested TS type name ────────────────────────────────────────

const C_TYPE_TO_TS: Record<string, string> = {
  HANDLE: 'HANDLE',
  HGLOBAL: 'HGLOBAL',
  HLOCAL: 'HLOCAL',
  HMODULE: 'HMODULE',
  HINSTANCE: 'HINSTANCE',
  HWND: 'HWND',
  HPCON: 'HPCON',
  HRSRC: 'HRSRC',
  SIZE_T: 'SIZE_T',
  DWORD_PTR: 'DWORD_PTR',
  UINT_PTR: 'UINT_PTR',
  ULONG_PTR: 'ULONG_PTR',
  INT_PTR: 'INT_PTR',
  LONG_PTR: 'LONG_PTR',
  ULONGLONG: 'ULONGLONG',
  DWORDLONG: 'DWORDLONG',
  LARGE_INTEGER: 'LARGE_INTEGER',
  ULARGE_INTEGER: 'ULARGE_INTEGER',
  LRESULT: 'LRESULT',
  LPARAM: 'LPARAM',
  WPARAM: 'WPARAM',
  DWORD: 'DWORD',
  UINT: 'UINT',
  ULONG: 'ULONG',
  HRESULT: 'HRESULT',
  BOOL: 'BOOL',
  INT: 'INT',
  LONG: 'LONG',
  WORD: 'WORD',
  USHORT: 'USHORT',
  SHORT: 'SHORT',
  ATOM: 'WORD',
  BYTE: 'BYTE',
  BOOLEAN: 'BOOLEAN',
  CHAR: 'CHAR',
  VOID: 'void',
  void: 'void',
  LPVOID: 'LPVOID',
  LPCWSTR: 'LPCWSTR',
  LPCSTR: 'LPCSTR',
  LPWSTR: 'LPWSTR',
  LPSTR: 'LPSTR',
  PVOID: 'PVOID',
  LPBYTE: 'LPBYTE',
  LPDWORD: 'LPDWORD',
};

// ═══════════════════════════════════════════════════════════════════════════
// Parsing helpers
// ═══════════════════════════════════════════════════════════════════════════

interface SymbolEntry {
  name: string;
  args: string[];
  returns: string;
}

interface MethodParam {
  name: string;
  tsType: string; // full type text including | NULL / | 0n
  baseType: string; // type with nullable stripped
}

interface MethodEntry {
  name: string;
  symbolName: string; // from Load('...')
  params: MethodParam[];
  returnType: string;
  line: number;
}

interface Mismatch {
  functionName: string;
  position: string; // 'return' or 'param[N] (paramName)'
  ffiType: string; // e.g. 'FFIType.u64'
  expectedJs: string; // e.g. 'bigint'
  actualTsType: string; // e.g. 'DWORD'
  resolvesTo: string; // e.g. 'number'
  suggestion?: string; // e.g. 'HLOCAL'
  sdkCType?: string; // e.g. 'HLOCAL' from SDK header
  line: number;
}

function parseSymbols(source: string): SymbolEntry[] {
  const symbolsBlock = source.match(/Symbols\s*=\s*\{([\s\S]*?)\}\s*as\s*const/);
  if (!symbolsBlock) return [];

  const entries: SymbolEntry[] = [];
  // Match entries that may span multiple lines
  const entryRe = /(\w+)\s*:\s*\{\s*args\s*:\s*\[([\s\S]*?)\]\s*,\s*returns\s*:\s*(FFIType\.\w+)\s*\}/g;
  let m;
  while ((m = entryRe.exec(symbolsBlock[1])) !== null) {
    const name = m[1];
    const argsStr = m[2].replace(/\s+/g, ' ').trim();
    const args = argsStr
      ? argsStr
          .split(',')
          .map((a) => a.trim())
          .filter(Boolean)
      : [];
    entries.push({ name, args, returns: m[3] });
  }
  return entries;
}

function parseMethods(source: string): MethodEntry[] {
  const methods: MethodEntry[] = [];
  const lines = source.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = line.match(/public\s+static\s+(\w+)\s*\(([\s\S]*?)\)\s*:\s*([\w|. ]+?)\s*\{/);
    if (!m) continue;

    const name = m[1];
    const paramsStr = m[2].trim();
    const returnType = m[3].trim();

    // Extract Load('SymbolName') from method body
    const bodyLine = lines[i] || '';
    const nextLine = lines[i + 1] || '';
    const loadMatch = bodyLine.match(/\.Load\(['"](\w+)['"]\)/) || nextLine.match(/\.Load\(['"](\w+)['"]\)/);
    const symbolName = loadMatch ? loadMatch[1] : name;

    const params: MethodParam[] = [];
    if (paramsStr) {
      // Split on commas, but be careful about generic types
      const paramParts = paramsStr.split(',');
      for (const part of paramParts) {
        const pm = part.trim().match(/^(\w+)\s*:\s*(.+)$/);
        if (pm) {
          const tsType = pm[2].trim();
          const baseType = tsType
            .replace(/\s*\|\s*NULL\b/g, '')
            .replace(/\s*\|\s*0n\b/g, '')
            .trim();
          params.push({ name: pm[1], tsType, baseType });
        }
      }
    }

    methods.push({
      name,
      symbolName,
      params,
      returnType: returnType
        .replace(/\s*\|\s*NULL\b/g, '')
        .replace(/\s*\|\s*0n\b/g, '')
        .trim(),
      line: i + 1,
    });
  }
  return methods;
}

function parsePackageTypes(typesSource: string): Record<string, string> {
  const typeMap: Record<string, string> = {};

  // Parse re-exports: export type { A, B, C } from '...'
  const reExportBlocks = typesSource.matchAll(/export\s+type\s*\{([^}]+)\}\s*from\s*['"][^'"]+['"]/g);
  for (const m of reExportBlocks) {
    const names = m[1]
      .split(',')
      .map((n) => n.trim())
      .filter(Boolean);
    for (const name of names) {
      if (CORE_TYPES[name]) typeMap[name] = CORE_TYPES[name];
    }
  }

  // Parse direct type definitions: export type X = Y;
  const typeDefs = typesSource.matchAll(/export\s+type\s+(\w+)\s*=\s*(\w+)\s*;/g);
  for (const m of typeDefs) {
    const name = m[1];
    const rhs = m[2];
    if (rhs === 'bigint') typeMap[name] = 'bigint';
    else if (rhs === 'number') typeMap[name] = 'number';
    else if (rhs === 'Pointer') typeMap[name] = 'Pointer';
    else if (rhs === 'void') typeMap[name] = 'void';
    else if (rhs === 'null') typeMap[name] = 'null';
    else {
      // Resolve through chain
      typeMap[name] = typeMap[rhs] || CORE_TYPES[rhs] || rhs;
    }
  }

  // Parse enums: export enum X { ... }  → number
  const enums = typesSource.matchAll(/export\s+enum\s+(\w+)\s*\{/g);
  for (const m of enums) {
    typeMap[m[1]] = 'number';
  }

  return typeMap;
}

function resolveType(tsType: string, typeMap: Record<string, string>): string {
  // Strip nullable
  const base = tsType
    .replace(/\s*\|\s*NULL\b/g, '')
    .replace(/\s*\|\s*0n\b/g, '')
    .trim();
  if (base === 'void') return 'void';
  return typeMap[base] || CORE_TYPES[base] || '???';
}

// ═══════════════════════════════════════════════════════════════════════════
// SDK header lookup — single-pass pre-index
// ═══════════════════════════════════════════════════════════════════════════

interface SdkProto {
  returnType: string;
  params: { type: string; name: string }[];
  header: string;
}

let sdkIndex: Map<string, SdkProto> | null = null;

/**
 * Build an index of function declarations using batched grep.
 * Searches all SDK headers in one pass, then reads context for matches.
 */
function buildSdkIndex(functionNames: string[]): Map<string, SdkProto> {
  if (sdkIndex) return sdkIndex;
  sdkIndex = new Map();

  if (!existsSync(SDK_INCLUDE) || functionNames.length === 0) return sdkIndex;

  // Write function names as grep patterns: ^FunctionName(
  const patternFile = join(ROOT, '.sdk-audit-patterns.tmp');
  const patterns = functionNames.map((n) => `\\b${n}\\(`).join('\n');
  require('fs').writeFileSync(patternFile, patterns);

  const searchDirs = [SDK_INCLUDE];
  const sharedDir = join(SDK_INCLUDE, '..', 'shared');
  if (existsSync(sharedDir)) searchDirs.push(sharedDir);

  try {
    // Single grep across all headers with context
    const grepResult = execSync(`rg -n -B 8 --no-heading -f "${patternFile}" ${searchDirs.map((d) => `"${d}"`).join(' ')} --glob "*.h"`, { encoding: 'utf-8', timeout: 60000, maxBuffer: 50 * 1024 * 1024 });

    for (const line of grepResult.split('\n')) {
      const normalizedLine = line.replace(/\r$/, '');
      const matchM = normalizedLine.match(/^(.*):(\d+):(.+)$/);
      if (!matchM) continue;

      const matchFile = matchM[1];
      const matchLine = matchM[3];
      const funcMatch = matchLine.match(/\b(\w+)\s*\(/);
      if (!funcMatch) continue;

      const funcName = funcMatch[1];
      const headerName = matchFile.split(/[/\\]/).pop() || '';

      if (!sdkIndex.has(funcName)) {
        sdkIndex.set(funcName, { returnType: '', params: [], header: headerName });
      }
    }

    // Second pass: read parameter info for matched functions from their headers
    const headerFuncs = new Map<string, string[]>();
    for (const [funcName, proto] of sdkIndex) {
      // Find the full header path
      for (const dir of searchDirs) {
        const path = join(dir, proto.header);
        if (existsSync(path)) {
          if (!headerFuncs.has(path)) headerFuncs.set(path, []);
          headerFuncs.get(path)!.push(funcName);
          break;
        }
      }
    }

    for (const [headerPath, funcs] of headerFuncs) {
      const content = readFileSync(headerPath, 'utf-8');
      const hLines = content.split('\n');

      for (const funcName of funcs) {
        // Find function declaration line
        for (let i = 0; i < hLines.length; i++) {
          if (!hLines[i].match(new RegExp(`\\b${funcName}\\s*\\(`))) continue;

          const proto = sdkIndex!.get(funcName)!;

          if (!proto.returnType) {
            for (let j = i - 1; j >= Math.max(0, i - 10); j--) {
              const candidateLine = hLines[j].trim();
              if (!candidateLine) continue;
              if (candidateLine === 'WINAPI' || candidateLine === 'APIENTRY' || candidateLine === 'NTAPI' || candidateLine === 'CALLBACK') continue;
              if (
                candidateLine.startsWith('WINBASEAPI') ||
                candidateLine.startsWith('WINUSERAPI') ||
                candidateLine.startsWith('WINNORMALIZEAPI') ||
                candidateLine.startsWith('WINADVAPI') ||
                candidateLine.startsWith('NTSYSAPI') ||
                candidateLine.startsWith('WINSOCK_API_LINKAGE') ||
                candidateLine.startsWith('NET_API_FUNCTION') ||
                candidateLine.startsWith('WSPAPI') ||
                candidateLine.startsWith('IMAGEAPI') ||
                candidateLine.startsWith('SNMPAPI_') ||
                candidateLine.startsWith('INTERNETAPI') ||
                candidateLine.startsWith('BOOLAPI') ||
                candidateLine.startsWith('#') ||
                candidateLine.startsWith('_') ||
                candidateLine === '{' ||
                candidateLine === '*/'
              ) {
                if (candidateLine === 'BOOLAPI') {
                  proto.returnType = 'BOOL';
                  break;
                }
                continue;
              }
              proto.returnType = candidateLine.replace(/\s+/g, ' ').trim();
              break;
            }
          }

          // Parse parameters
          const params: { type: string; name: string }[] = [];
          let paramBlock = '';
          let depth = 0;
          for (let j = i; j < Math.min(hLines.length, i + 30); j++) {
            paramBlock += hLines[j] + '\n';
            depth += (hLines[j].match(/\(/g) || []).length;
            depth -= (hLines[j].match(/\)/g) || []).length;
            if (depth <= 0) break;
          }

          const paramContent = paramBlock.match(/\(([\s\S]*)\)/);
          if (paramContent) {
            const rawParams = paramContent[1]
              .replace(/_(?=[A-Za-z]*[a-z])[A-Za-z_]+(?:\([^)]*\))?\s*/g, '')
              .replace(/CONST\s+/g, '')
              .replace(/const\s+/g, '');
            const paramParts = rawParams
              .split(',')
              .map((p) => p.trim())
              .filter(Boolean);
            for (const pl of paramParts) {
              const cleaned = pl.trim();
              const paramMatch = cleaned.match(/^(.*?)([A-Za-z_]\w*)$/);
              if (!paramMatch) continue;

              const paramName = paramMatch[2];
              const paramType = paramMatch[1].trim().replace(/\s+\*/g, '*');

              if (paramName !== 'VOID' && paramName !== 'void') {
                params.push({ type: paramType, name: paramName });
              }
            }
          }

          proto.params = params;
          break;
        }
      }
    }
  } catch (e) {
    // grep returns exit code 1 if no matches found
  } finally {
    try {
      require('fs').unlinkSync(patternFile);
    } catch {}
  }

  return sdkIndex;
}

function lookupSdk(functionName: string): SdkProto | null {
  if (!sdkIndex) return null;
  return sdkIndex.get(functionName) || null;
}

// ═══════════════════════════════════════════════════════════════════════════
// Main audit logic
// ═══════════════════════════════════════════════════════════════════════════

function auditPackage(pkgName: string, skipSdk: boolean = false): Mismatch[] {
  const pkgDir = join(PACKAGES, pkgName);
  const structsDir = join(pkgDir, 'structs');
  const typesDir = join(pkgDir, 'types');

  if (!existsSync(structsDir) || !existsSync(typesDir)) {
    console.error(`  Skipping ${pkgName}: no structs/ or types/ directory`);
    return [];
  }

  const structFiles = readdirSync(structsDir).filter((f) => f.endsWith('.ts'));
  if (structFiles.length === 0) {
    console.error(`  Skipping ${pkgName}: no .ts files in structs/`);
    return [];
  }
  const className = structFiles[0].replace('.ts', '');

  const structsSource = readFileSync(join(structsDir, `${className}.ts`), 'utf-8');
  const typesSource = readFileSync(join(typesDir, `${className}.ts`), 'utf-8');

  const symbols = parseSymbols(structsSource);
  const methods = parseMethods(structsSource);
  const typeMap = parsePackageTypes(typesSource);

  // Index symbols by name
  const symbolMap = new Map<string, SymbolEntry>();
  for (const s of symbols) symbolMap.set(s.name, s);

  const mismatches: Mismatch[] = [];

  for (const method of methods) {
    const symbol = symbolMap.get(method.symbolName);
    if (!symbol) {
      // Rare: method references a symbol that doesn't exist
      continue;
    }

    const expectedReturnJs = FFI_TO_JS[symbol.returns] || '???';
    const actualReturnJs = resolveType(method.returnType, typeMap);

    // Try SDK lookup for better suggestions
    const sdkProto = skipSdk ? null : lookupSdk(method.symbolName);

    // ── Check return type ──
    if (expectedReturnJs !== actualReturnJs && actualReturnJs !== '???') {
      const mismatch: Mismatch = {
        functionName: method.name,
        position: 'return',
        ffiType: symbol.returns,
        expectedJs: expectedReturnJs,
        actualTsType: method.returnType,
        resolvesTo: actualReturnJs,
        line: method.line,
      };
      if (sdkProto?.returnType) {
        mismatch.sdkCType = sdkProto.returnType;
        const suggested = C_TYPE_TO_TS[sdkProto.returnType];
        if (suggested) mismatch.suggestion = suggested;
      }
      mismatches.push(mismatch);
    }

    // ── Check return type even if JS types match — SDK might say it's wrong ──
    if (sdkProto?.returnType && expectedReturnJs === actualReturnJs) {
        const expectedFfi = sdkProto.returnType.endsWith('*') ? 'FFIType.ptr' : C_TYPE_TO_FFI[sdkProto.returnType];
      if (expectedFfi && expectedFfi !== symbol.returns) {
        mismatches.push({
          functionName: method.name,
          position: 'return (FFI symbol wrong)',
          ffiType: symbol.returns,
          expectedJs: FFI_TO_JS[expectedFfi] || '???',
          actualTsType: method.returnType,
          resolvesTo: actualReturnJs,
          sdkCType: sdkProto.returnType,
          suggestion: C_TYPE_TO_TS[sdkProto.returnType],
          line: method.line,
        });
      }
    }

    // ── Check parameter types ──
    const minLen = Math.min(method.params.length, symbol.args.length);
    for (let pi = 0; pi < minLen; pi++) {
      const param = method.params[pi];
      const ffiArg = symbol.args[pi];
      const expectedParamJs = FFI_TO_JS[ffiArg] || '???';
      const actualParamJs = resolveType(param.baseType, typeMap);

      if (expectedParamJs !== actualParamJs && actualParamJs !== '???') {
        // Skip: bare NULL for ptr params is intentional (reserved params always null)
        if (ffiArg === 'FFIType.ptr' && param.tsType === 'NULL') continue;

        const mismatch: Mismatch = {
          functionName: method.name,
          position: `param[${pi}] (${param.name})`,
          ffiType: ffiArg,
          expectedJs: expectedParamJs,
          actualTsType: param.tsType,
          resolvesTo: actualParamJs,
          line: method.line,
        };
        if (sdkProto?.params[pi]) {
          mismatch.sdkCType = sdkProto.params[pi].type;
          const suggested = C_TYPE_TO_TS[sdkProto.params[pi].type];
          if (suggested) mismatch.suggestion = suggested;
        }
        mismatches.push(mismatch);
      }

      // Also check: SDK says param type is X but FFI uses the wrong type
      if (sdkProto?.params[pi] && expectedParamJs === actualParamJs) {
        const sdkParamType = sdkProto.params[pi].type;
        const expectedFfi = sdkParamType.endsWith('*') ? 'FFIType.ptr' : C_TYPE_TO_FFI[sdkParamType];
        if (expectedFfi && expectedFfi !== ffiArg) {
          mismatches.push({
            functionName: method.name,
            position: `param[${pi}] (${param.name}) (FFI symbol wrong)`,
            ffiType: ffiArg,
            expectedJs: FFI_TO_JS[expectedFfi] || '???',
            actualTsType: param.tsType,
            resolvesTo: actualParamJs,
            sdkCType: sdkParamType,
            suggestion: C_TYPE_TO_TS[sdkParamType],
            line: method.line,
          });
        }
      }
    }

    // ── Check parameter count mismatch ──
    if (method.params.length !== symbol.args.length) {
      mismatches.push({
        functionName: method.name,
        position: 'param count',
        ffiType: `${symbol.args.length} args`,
        expectedJs: `${symbol.args.length} params`,
        actualTsType: `${method.params.length} params`,
        resolvesTo: 'PARAM_COUNT_MISMATCH',
        line: method.line,
      });
    }
  }

  return mismatches;
}

// ═══════════════════════════════════════════════════════════════════════════
// Output
// ═══════════════════════════════════════════════════════════════════════════

function formatMismatches(pkgName: string, mismatches: Mismatch[]): void {
  if (mismatches.length === 0) {
    console.log(`  ✓ No mismatches found`);
    return;
  }

  // Group by function name
  const grouped = new Map<string, Mismatch[]>();
  for (const m of mismatches) {
    const key = m.functionName;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(m);
  }

  for (const [fn, items] of grouped) {
    for (const m of items) {
      const sdk = m.sdkCType ? ` [SDK: ${m.sdkCType}]` : '';
      const fix = m.suggestion ? ` → use ${m.suggestion}` : '';
      console.log(`  L${String(m.line).padStart(5)} | ${fn} | ${m.position}`);
      console.log(`         FFI: ${m.ffiType} (${m.expectedJs}) vs TS: ${m.actualTsType} (${m.resolvesTo})${sdk}${fix}`);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Auto-fix
// ═══════════════════════════════════════════════════════════════════════════

// Default TS type for each FFI type (when SDK suggestion unavailable)
const FFI_DEFAULT_TS: Record<string, string> = {
  'FFIType.u64': 'HANDLE',
  'FFIType.i64': 'LONG_PTR',
  'FFIType.ptr': 'LPVOID',
  'FFIType.u32': 'DWORD',
  'FFIType.i32': 'INT',
  'FFIType.u16': 'WORD',
  'FFIType.i16': 'SHORT',
  'FFIType.u8': 'BYTE',
  'FFIType.f32': 'FLOAT',
  'FFIType.f64': 'number',
  'FFIType.void': 'void',
};

function computeFixType(m: Mismatch): string | null {
  // Skip param count mismatches — those need manual review
  if (m.resolvesTo === 'PARAM_COUNT_MISMATCH') return null;
  // Skip "FFI symbol wrong" cases for now — changing FFI types is dangerous
  if (m.position.includes('FFI symbol wrong')) return null;

  // Use SDK suggestion if available
  if (m.suggestion) return m.suggestion;

  // Use SDK C type mapped to TS type
  if (m.sdkCType) {
    const mapped = C_TYPE_TO_TS[m.sdkCType];
    if (mapped) return mapped;
    // For pointer types not in our mapping (PSID, PTP_*, etc.), use LPVOID
    if (m.sdkCType.startsWith('P') || m.sdkCType.startsWith('LP')) return 'LPVOID';
  }

  // Fallback: use default TS type for the FFI type
  return FFI_DEFAULT_TS[m.ffiType] || null;
}

function applyFixes(pkgName: string, mismatches: Mismatch[]): number {
  const fixable = mismatches.filter((m) => {
    const fix = computeFixType(m);
    return fix !== null && !m.position.includes('FFI symbol wrong') && m.resolvesTo !== 'PARAM_COUNT_MISMATCH';
  });

  if (fixable.length === 0) return 0;

  const pkgDir = join(PACKAGES, pkgName);
  const structsDir = join(pkgDir, 'structs');
  const structFiles = readdirSync(structsDir).filter((f) => f.endsWith('.ts'));
  const className = structFiles[0].replace('.ts', '');
  const filePath = join(structsDir, `${className}.ts`);
  let source = readFileSync(filePath, 'utf-8');
  const lines = source.split('\n');

  // Collect needed type imports
  const neededTypes = new Set<string>();
  let fixCount = 0;

  // Group fixes by line number (multiple fixes per method)
  const fixesByLine = new Map<number, Mismatch[]>();
  for (const m of fixable) {
    if (!fixesByLine.has(m.line)) fixesByLine.set(m.line, []);
    fixesByLine.get(m.line)!.push(m);
  }

  for (const [lineNum, lineFixes] of fixesByLine) {
    const lineIdx = lineNum - 1;
    let line = lines[lineIdx];
    if (!line) continue;

    for (const m of lineFixes) {
      const fixType = computeFixType(m)!;
      neededTypes.add(fixType);

      if (m.position === 'return') {
        // Replace return type: ): OLD_TYPE { → ): NEW_TYPE {
        const oldRet = m.actualTsType;
        // Use word-boundary-aware replacement for the return type
        const retRe = new RegExp(`\\)\\s*:\\s*${escapeRegex(oldRet)}\\s*\\{`);
        if (retRe.test(line)) {
          line = line.replace(retRe, `): ${fixType} {`);
          fixCount++;
        }
      } else if (m.position.startsWith('param[')) {
        // Extract param name from position: "param[N] (paramName)"
        const paramNameMatch = m.position.match(/\((\w+)\)/);
        if (!paramNameMatch) continue;
        const paramName = paramNameMatch[1];
        const oldType = m.actualTsType;

        // Replace: paramName: OLD_TYPE → paramName: NEW_TYPE
        // Handle nullable: paramName: OLD_TYPE | NULL → paramName: NEW_TYPE | NULL
        const paramRe = new RegExp(`(${escapeRegex(paramName)}\\s*:\\s*)${escapeRegex(oldType)}`);
        if (paramRe.test(line)) {
          line = line.replace(paramRe, `$1${fixType}`);
          fixCount++;
        }
      }
    }

    lines[lineIdx] = line;
  }

  if (fixCount > 0) {
    require('fs').writeFileSync(filePath, lines.join('\n'));
    console.log(`  Applied ${fixCount} fixes to ${filePath}`);

    // Report types that may need to be imported/defined
    const typesPath = join(pkgDir, 'types', `${className}.ts`);
    const typesSource = readFileSync(typesPath, 'utf-8');
    const missingTypes = [...neededTypes].filter((t) => t !== 'void' && t !== 'number' && !typesSource.includes(`type ${t}`) && !typesSource.includes(`${t},`) && !typesSource.includes(`${t}\n`));
    if (missingTypes.length > 0) {
      console.log(`  ⚠ These types may need to be added to types/${className}.ts:`);
      for (const t of missingTypes.sort()) {
        console.log(`    - ${t}`);
      }
    }
  }

  return fixCount;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ═══════════════════════════════════════════════════════════════════════════
// CLI entry
// ═══════════════════════════════════════════════════════════════════════════

const args = process.argv.slice(2);
const doAll = args.includes('--all');
const noSdk = args.includes('--no-sdk');
const doFix = args.includes('--fix');
const packages = doAll ? readdirSync(PACKAGES).filter((d) => d !== 'core' && d !== 'template' && existsSync(join(PACKAGES, d, 'structs'))) : args.filter((a) => !a.startsWith('--'));

if (packages.length === 0) {
  console.error('Usage: bun run scripts/audit.ts <package> [--all]');
  process.exit(1);
}

// Pre-build SDK index with all function names from all packages
if (!noSdk) {
  const allFunctionNames: string[] = [];
  for (const pkg of packages) {
    const structsDir = join(PACKAGES, pkg, 'structs');
    if (!existsSync(structsDir)) continue;
    const files = readdirSync(structsDir).filter((f) => f.endsWith('.ts'));
    if (files.length === 0) continue;
    const source = readFileSync(join(structsDir, files[0]), 'utf-8');
    const symbols = parseSymbols(source);
    for (const s of symbols) allFunctionNames.push(s.name);
  }
  console.log(`Building SDK index for ${allFunctionNames.length} functions...`);
  buildSdkIndex(allFunctionNames);
  console.log(`SDK index: ${sdkIndex!.size} functions found in headers`);
}

let totalMismatches = 0;

let totalFixed = 0;

for (const pkg of packages) {
  console.log(`\n═══ Auditing: ${pkg} ═══`);
  const mismatches = auditPackage(pkg, noSdk);
  if (!doFix) {
    formatMismatches(pkg, mismatches);
  }
  totalMismatches += mismatches.length;
  console.log(`  Total issues: ${mismatches.length}`);
  if (doFix && mismatches.length > 0) {
    const fixed = applyFixes(pkg, mismatches);
    totalFixed += fixed;
  }
}

console.log(`\n═══ Summary ═══`);
console.log(`  Packages audited: ${packages.length}`);
console.log(`  Total mismatches: ${totalMismatches}`);
if (doFix) console.log(`  Total fixes applied: ${totalFixed}`);

// Cleanup test file if it exists
process.exit(totalMismatches > 0 ? 1 : 0);
