import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type {
  BOOL,
  BOOLEAN,
  DWORD,
  DWORD64,
  HANDLE,
  HMODULE,
  HWND,
  IMAGEHLP_EXTENDED_OPTIONS,
  IMAGEHLP_SYMBOL_TYPE_INFO,
  LPCSTR,
  LPCWSTR,
  LPDWORD,
  LPSTR,
  LPVOID,
  LPWSTR,
  LPAPI_VERSION,
  LPSTACKFRAME64,
  LPSTACKFRAME_EX,
  MINIDUMP_TYPE,
  OPTIONAL,
  PDWORD,
  PDWORD64,
  PENUMDIRTREE_CALLBACK,
  PENUMDIRTREE_CALLBACKW,
  PENUMLOADED_MODULES_CALLBACK64,
  PENUMLOADED_MODULES_CALLBACKW64,
  PENUMSOURCEFILETOKENSCALLBACK,
  PFIND_DEBUG_FILE_CALLBACK,
  PFIND_DEBUG_FILE_CALLBACKW,
  PFIND_EXE_FILE_CALLBACK,
  PFIND_EXE_FILE_CALLBACKW,
  PFINDFILEINPATHCALLBACK,
  PFINDFILEINPATHCALLBACKW,
  PFUNCTION_TABLE_ACCESS_ROUTINE64,
  PGET_MODULE_BASE_ROUTINE64,
  PIMAGE_NT_HEADERS,
  PIMAGE_SECTION_HEADER,
  PIMAGEHLP_CONTEXT,
  PIMAGEHLP_GET_TYPE_INFO_PARAMS,
  PIMAGEHLP_LINE64,
  PIMAGEHLP_LINEW64,
  PIMAGEHLP_MODULE64,
  PIMAGEHLP_MODULEW64,
  PIMAGEHLP_STACK_FRAME,
  PIMAGEHLP_SYMBOL64,
  PLONG,
  PMINIDUMP_CALLBACK_INFORMATION,
  PMINIDUMP_DIRECTORY,
  PMINIDUMP_EXCEPTION_INFORMATION,
  PMINIDUMP_USER_STREAM_INFORMATION,
  PMODLOAD_DATA,
  POMAP,
  PREAD_PROCESS_MEMORY_ROUTINE64,
  PSYM_ENUMLINES_CALLBACK,
  PSYM_ENUMLINES_CALLBACKW,
  PSYM_ENUMERATESYMBOLS_CALLBACK,
  PSYM_ENUMERATESYMBOLS_CALLBACKW,
  PSYM_ENUMSOURCEFILES_CALLBACK,
  PSYM_ENUMSOURCEFILES_CALLBACKW,
  PSYMBOL_FUNCENTRY_CALLBACK64,
  PSYMBOL_INFO,
  PSYMBOL_INFOW,
  PSYMBOL_REGISTERED_CALLBACK64,
  PSYMSRV_INDEX_INFO,
  PSYMSRV_INDEX_INFOW,
  PTRANSLATE_ADDRESS_ROUTINE64,
  PULONG,
  PVOID,
  SIZE_T,
  ULONG,
  ULONG64,
  USHORT,
} from '../types/Dbghelp';

/**
 * Thin, lazy-loaded FFI bindings for `dbghelp.dll`.
 *
 * Each static method corresponds one-to-one with a Win32 export declared in `Symbols`.
 * The first call to a method binds the underlying native symbol via `bun:ffi` and
 * memoizes it on the class for subsequent calls. For bulk, up-front binding, use `Preload`.
 *
 * Symbols are defined with explicit `FFIType` signatures and kept alphabetized.
 * You normally do not access `Symbols` directly; call the static methods or preload
 * a subset for hot paths.
 *
 * @example
 * ```ts
 * import Dbghelp from './structs/Dbghelp';
 *
 * // Lazy: bind on first call
 * Dbghelp.SymInitializeW(hProcess, null, 1);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * Dbghelp.Preload(['SymInitializeW', 'SymFromAddrW', 'SymCleanup']);
 * ```
 */
class Dbghelp extends Win32 {
  protected static override name = 'dbghelp.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    EnumDirTree: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    EnumDirTreeW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    EnumerateLoadedModulesEx: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    EnumerateLoadedModulesExW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    EnumerateLoadedModulesW64: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    FindDebugInfoFile: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    FindDebugInfoFileEx: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    FindDebugInfoFileExW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    FindExecutableImage: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    FindExecutableImageEx: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    FindExecutableImageExW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    FindFileInPath: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    FindFileInSearchPath: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetTimestampForLoadedLibrary: { args: [FFIType.u64], returns: FFIType.u32 },
    ImageDirectoryEntryToData: { args: [FFIType.ptr, FFIType.u8, FFIType.u16, FFIType.ptr], returns: FFIType.ptr },
    ImageDirectoryEntryToDataEx: { args: [FFIType.ptr, FFIType.u8, FFIType.u16, FFIType.ptr, FFIType.ptr], returns: FFIType.ptr },
    ImageNtHeader: { args: [FFIType.ptr], returns: FFIType.ptr },
    ImageRvaToSection: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.ptr },
    ImageRvaToVa: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.ptr },
    ImagehlpApiVersion: { args: [], returns: FFIType.ptr },
    ImagehlpApiVersionEx: { args: [FFIType.ptr], returns: FFIType.ptr },
    MakeSureDirectoryPathExists: { args: [FFIType.ptr], returns: FFIType.i32 },
    MiniDumpReadDumpStream: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MiniDumpWriteDump: { args: [FFIType.u64, FFIType.u32, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SearchTreeForFile: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SearchTreeForFileW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    StackWalk64: { args: [FFIType.u32, FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    StackWalkEx: { args: [FFIType.u32, FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SymAddSymbol: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    SymAddSymbolW: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    SymAddrIncludeInlineTrace: { args: [FFIType.u64, FFIType.u64], returns: FFIType.u32 },
    SymCleanup: { args: [FFIType.u64], returns: FFIType.i32 },
    SymCompareInlineTrace: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.u64, FFIType.u64, FFIType.u64], returns: FFIType.u32 },
    SymDeleteSymbol: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    SymDeleteSymbolW: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    SymEnumLines: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SymEnumLinesW: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SymEnumSourceFileTokens: { args: [FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SymEnumSourceFiles: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SymEnumSourceFilesW: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SymEnumSourceLines: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SymEnumSourceLinesW: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SymEnumSymbols: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SymEnumSymbolsEx: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SymEnumSymbolsExW: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SymEnumSymbolsW: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SymEnumTypes: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SymEnumTypesByName: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SymEnumTypesByNameW: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SymEnumTypesW: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SymFindDebugInfoFile: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    SymFindDebugInfoFileW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    SymFindExecutableImage: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    SymFindExecutableImageW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    SymFindFileInPath: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SymFindFileInPathW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SymFromAddr: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SymFromAddrW: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SymFromIndex: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SymFromIndexW: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SymFromInlineContext: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SymFromInlineContextW: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SymFromName: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SymFromNameW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SymFromToken: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SymFromTokenW: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SymFunctionTableAccess64: { args: [FFIType.u64, FFIType.u64], returns: FFIType.ptr },
    SymGetExtendedOption: { args: [FFIType.i32], returns: FFIType.i32 },
    SymGetHomeDirectory: { args: [FFIType.u32, FFIType.ptr, FFIType.u64], returns: FFIType.ptr },
    SymGetHomeDirectoryW: { args: [FFIType.u32, FFIType.ptr, FFIType.u64], returns: FFIType.ptr },
    SymGetLineFromAddr64: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SymGetLineFromAddrW64: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SymGetLineFromInlineContext: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SymGetLineFromInlineContextW: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SymGetLineFromName64: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SymGetLineFromNameW64: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SymGetLineNext64: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SymGetLineNextW64: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SymGetLinePrev64: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SymGetLinePrevW64: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SymGetModuleBase64: { args: [FFIType.u64, FFIType.u64], returns: FFIType.u64 },
    SymGetModuleInfo64: { args: [FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SymGetModuleInfoW64: { args: [FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SymGetOmaps: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SymGetOptions: { args: [], returns: FFIType.u32 },
    SymGetScope: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SymGetScopeW: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SymGetSearchPath: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SymGetSearchPathW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SymGetSourceFile: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SymGetSourceFileChecksum: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SymGetSourceFileChecksumW: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SymGetSourceFileFromToken: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SymGetSourceFileFromTokenW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SymGetSourceFileToken: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SymGetSourceFileTokenW: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SymGetSourceFileW: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SymGetSourceVarFromToken: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SymGetSourceVarFromTokenW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SymGetSymbolFile: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.u64], returns: FFIType.i32 },
    SymGetSymbolFileW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.u64], returns: FFIType.i32 },
    SymGetTypeFromName: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SymGetTypeFromNameW: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SymGetTypeInfo: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    SymGetTypeInfoEx: { args: [FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SymGetUnwindInfo: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SymInitialize: { args: [FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    SymInitializeW: { args: [FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    SymLoadModuleEx: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    SymLoadModuleExW: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    SymMatchFileName: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SymMatchFileNameW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SymMatchString: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    SymMatchStringA: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    SymMatchStringW: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    SymNext: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SymNextW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SymPrev: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SymPrevW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SymQueryInlineTrace: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SymRefreshModuleList: { args: [FFIType.u64], returns: FFIType.i32 },
    SymRegisterCallback64: { args: [FFIType.u64, FFIType.ptr, FFIType.u64], returns: FFIType.i32 },
    SymRegisterCallbackW64: { args: [FFIType.u64, FFIType.ptr, FFIType.u64], returns: FFIType.i32 },
    SymRegisterFunctionEntryCallback64: { args: [FFIType.u64, FFIType.ptr, FFIType.u64], returns: FFIType.i32 },
    SymSearch: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SymSearchW: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SymSetContext: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SymSetExtendedOption: { args: [FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    SymSetHomeDirectory: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.ptr },
    SymSetHomeDirectoryW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.ptr },
    SymSetOptions: { args: [FFIType.u32], returns: FFIType.u32 },
    SymSetParentWindow: { args: [FFIType.u64], returns: FFIType.i32 },
    SymSetScopeFromAddr: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    SymSetScopeFromIndex: { args: [FFIType.u64, FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    SymSetScopeFromInlineContext: { args: [FFIType.u64, FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    SymSetSearchPath: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SymSetSearchPathW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SymSrvDeltaName: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.ptr },
    SymSrvDeltaNameW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.ptr },
    SymSrvGetFileIndexInfo: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SymSrvGetFileIndexInfoW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SymSrvGetFileIndexString: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    SymSrvGetFileIndexStringW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    SymSrvGetFileIndexes: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SymSrvGetFileIndexesW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SymSrvGetSupplement: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.ptr },
    SymSrvGetSupplementW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.ptr },
    SymSrvIsStore: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SymSrvIsStoreW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SymSrvStoreFile: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.ptr },
    SymSrvStoreFileW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.ptr },
    SymSrvStoreSupplement: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.ptr },
    SymSrvStoreSupplementW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.ptr },
    SymUnDName64: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SymUnloadModule64: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    UnDecorateSymbolName: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    UnDecorateSymbolNameW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-enumdirtree
  public static EnumDirTree(hProcess: OPTIONAL<HANDLE>, RootPath: LPCSTR, InputPathName: LPCSTR, OutputPathBuffer_out: OPTIONAL<LPSTR>, cb: OPTIONAL<PENUMDIRTREE_CALLBACK>, data: OPTIONAL<PVOID>): BOOL {
    return Dbghelp.Load('EnumDirTree')(hProcess, RootPath, InputPathName, OutputPathBuffer_out, cb, data);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-enumdirtreew
  public static EnumDirTreeW(hProcess: OPTIONAL<HANDLE>, RootPath: LPCWSTR, InputPathName: LPCWSTR, OutputPathBuffer_out: OPTIONAL<LPWSTR>, cb: OPTIONAL<PENUMDIRTREE_CALLBACKW>, data: OPTIONAL<PVOID>): BOOL {
    return Dbghelp.Load('EnumDirTreeW')(hProcess, RootPath, InputPathName, OutputPathBuffer_out, cb, data);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-enumerateloadedmodulesex
  public static EnumerateLoadedModulesEx(hProcess: HANDLE, EnumLoadedModulesCallback: PENUMLOADED_MODULES_CALLBACK64, UserContext: OPTIONAL<PVOID>): BOOL {
    return Dbghelp.Load('EnumerateLoadedModulesEx')(hProcess, EnumLoadedModulesCallback, UserContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-enumerateloadedmodulesexw
  public static EnumerateLoadedModulesExW(hProcess: HANDLE, EnumLoadedModulesCallback: PENUMLOADED_MODULES_CALLBACKW64, UserContext: OPTIONAL<PVOID>): BOOL {
    return Dbghelp.Load('EnumerateLoadedModulesExW')(hProcess, EnumLoadedModulesCallback, UserContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-enumerateloadedmodulesw64
  public static EnumerateLoadedModulesW64(hProcess: HANDLE, EnumLoadedModulesCallback: PENUMLOADED_MODULES_CALLBACKW64, UserContext: OPTIONAL<PVOID>): BOOL {
    return Dbghelp.Load('EnumerateLoadedModulesW64')(hProcess, EnumLoadedModulesCallback, UserContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-finddebuginfofile
  public static FindDebugInfoFile(FileName: LPCSTR, SymbolPath: LPCSTR, DebugFilePath_out: LPSTR): HANDLE {
    return Dbghelp.Load('FindDebugInfoFile')(FileName, SymbolPath, DebugFilePath_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-finddebuginfofileex
  public static FindDebugInfoFileEx(FileName: LPCSTR, SymbolPath: LPCSTR, DebugFilePath_out: LPSTR, Callback: OPTIONAL<PFIND_DEBUG_FILE_CALLBACK>, CallerData: OPTIONAL<PVOID>): HANDLE {
    return Dbghelp.Load('FindDebugInfoFileEx')(FileName, SymbolPath, DebugFilePath_out, Callback, CallerData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-finddebuginfofileexw
  public static FindDebugInfoFileExW(FileName: LPCWSTR, SymbolPath: LPCWSTR, DebugFilePath_out: LPWSTR, Callback: OPTIONAL<PFIND_DEBUG_FILE_CALLBACKW>, CallerData: OPTIONAL<PVOID>): HANDLE {
    return Dbghelp.Load('FindDebugInfoFileExW')(FileName, SymbolPath, DebugFilePath_out, Callback, CallerData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-findexecutableimage
  public static FindExecutableImage(FileName: LPCSTR, SymbolPath: LPCSTR, ImageFilePath_out: LPSTR): HANDLE {
    return Dbghelp.Load('FindExecutableImage')(FileName, SymbolPath, ImageFilePath_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-findexecutableimageex
  public static FindExecutableImageEx(FileName: LPCSTR, SymbolPath: LPCSTR, ImageFilePath_out: LPSTR, Callback: OPTIONAL<PFIND_EXE_FILE_CALLBACK>, CallerData: OPTIONAL<PVOID>): HANDLE {
    return Dbghelp.Load('FindExecutableImageEx')(FileName, SymbolPath, ImageFilePath_out, Callback, CallerData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-findexecutableimageexw
  public static FindExecutableImageExW(FileName: LPCWSTR, SymbolPath: LPCWSTR, ImageFilePath_out: LPWSTR, Callback: OPTIONAL<PFIND_EXE_FILE_CALLBACKW>, CallerData: PVOID): HANDLE {
    return Dbghelp.Load('FindExecutableImageExW')(FileName, SymbolPath, ImageFilePath_out, Callback, CallerData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-findfileinpath
  public static FindFileInPath(hprocess: HANDLE, SearchPath: LPCSTR, FileName: LPCSTR, id: PVOID, two: DWORD, three: DWORD, flags: DWORD, FilePath_out: LPSTR): BOOL {
    return Dbghelp.Load('FindFileInPath')(hprocess, SearchPath, FileName, id, two, three, flags, FilePath_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-findfileinsearchpath
  public static FindFileInSearchPath(hprocess: HANDLE, SearchPath: LPCSTR, FileName: LPCSTR, one: DWORD, two: DWORD, three: DWORD, FilePath_out: LPSTR): BOOL {
    return Dbghelp.Load('FindFileInSearchPath')(hprocess, SearchPath, FileName, one, two, three, FilePath_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-gettimestampforloadedlibrary
  public static GetTimestampForLoadedLibrary(Module: HMODULE): DWORD {
    return Dbghelp.Load('GetTimestampForLoadedLibrary')(Module);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-imagedirectoryentrytodata
  public static ImageDirectoryEntryToData(Base: PVOID, MappedAsImage: BOOLEAN, DirectoryEntry: USHORT, Size_out: PULONG): PVOID {
    return Dbghelp.Load('ImageDirectoryEntryToData')(Base, MappedAsImage, DirectoryEntry, Size_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-imagedirectoryentrytodataex
  public static ImageDirectoryEntryToDataEx(Base: PVOID, MappedAsImage: BOOLEAN, DirectoryEntry: USHORT, Size_out: PULONG, FoundHeader_out: OPTIONAL<PVOID>): PVOID {
    return Dbghelp.Load('ImageDirectoryEntryToDataEx')(Base, MappedAsImage, DirectoryEntry, Size_out, FoundHeader_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-imagentheader
  public static ImageNtHeader(Base: PVOID): PIMAGE_NT_HEADERS {
    return Dbghelp.Load('ImageNtHeader')(Base);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-imagervatosection
  public static ImageRvaToSection(NtHeaders: PIMAGE_NT_HEADERS, Base: PVOID, Rva: ULONG): PIMAGE_SECTION_HEADER {
    return Dbghelp.Load('ImageRvaToSection')(NtHeaders, Base, Rva);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-imagervatova
  public static ImageRvaToVa(NtHeaders: PIMAGE_NT_HEADERS, Base: PVOID, Rva: ULONG, LastRvaSection_in_out: OPTIONAL<PVOID>): PVOID {
    return Dbghelp.Load('ImageRvaToVa')(NtHeaders, Base, Rva, LastRvaSection_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-imagehlpapiversion
  public static ImagehlpApiVersion(): LPAPI_VERSION {
    return Dbghelp.Load('ImagehlpApiVersion')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-imagehlpapiversionex
  public static ImagehlpApiVersionEx(AppVersion: LPAPI_VERSION): LPAPI_VERSION {
    return Dbghelp.Load('ImagehlpApiVersionEx')(AppVersion);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-makesuredirectorypathexists
  public static MakeSureDirectoryPathExists(DirPath: LPCSTR): BOOL {
    return Dbghelp.Load('MakeSureDirectoryPathExists')(DirPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/minidumpapiset/nf-minidumpapiset-minidumpreaddumpstream
  public static MiniDumpReadDumpStream(BaseOfDump: PVOID, StreamNumber: ULONG, Dir_out: PVOID, StreamPointer_out: PVOID, StreamSize_out: OPTIONAL<PULONG>): BOOL {
    return Dbghelp.Load('MiniDumpReadDumpStream')(BaseOfDump, StreamNumber, Dir_out, StreamPointer_out, StreamSize_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/minidumpapiset/nf-minidumpapiset-minidumpwritedump
  public static MiniDumpWriteDump(
    hProcess: HANDLE,
    ProcessId: DWORD,
    hFile: HANDLE,
    DumpType: MINIDUMP_TYPE,
    ExceptionParam: OPTIONAL<PMINIDUMP_EXCEPTION_INFORMATION>,
    UserStreamParam: OPTIONAL<PMINIDUMP_USER_STREAM_INFORMATION>,
    CallbackParam: OPTIONAL<PMINIDUMP_CALLBACK_INFORMATION>,
  ): BOOL {
    return Dbghelp.Load('MiniDumpWriteDump')(hProcess, ProcessId, hFile, DumpType, ExceptionParam, UserStreamParam, CallbackParam);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-searchtreeforfile
  public static SearchTreeForFile(RootPath: LPCSTR, InputPathName: LPCSTR, OutputPathBuffer_out: LPSTR): BOOL {
    return Dbghelp.Load('SearchTreeForFile')(RootPath, InputPathName, OutputPathBuffer_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-searchtreeforfilew
  public static SearchTreeForFileW(RootPath: LPCWSTR, InputPathName: LPCWSTR, OutputPathBuffer_out: LPWSTR): BOOL {
    return Dbghelp.Load('SearchTreeForFileW')(RootPath, InputPathName, OutputPathBuffer_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-stackwalk64
  public static StackWalk64(
    MachineType: DWORD,
    hProcess: HANDLE,
    hThread: HANDLE,
    StackFrame_in_out: LPSTACKFRAME64,
    ContextRecord_in_out: PVOID,
    ReadMemoryRoutine: OPTIONAL<PREAD_PROCESS_MEMORY_ROUTINE64>,
    FunctionTableAccessRoutine: OPTIONAL<PFUNCTION_TABLE_ACCESS_ROUTINE64>,
    GetModuleBaseRoutine: OPTIONAL<PGET_MODULE_BASE_ROUTINE64>,
    TranslateAddress: OPTIONAL<PTRANSLATE_ADDRESS_ROUTINE64>,
  ): BOOL {
    return Dbghelp.Load('StackWalk64')(MachineType, hProcess, hThread, StackFrame_in_out, ContextRecord_in_out, ReadMemoryRoutine, FunctionTableAccessRoutine, GetModuleBaseRoutine, TranslateAddress);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-stackwalkex
  public static StackWalkEx(
    MachineType: DWORD,
    hProcess: HANDLE,
    hThread: HANDLE,
    StackFrame_in_out: LPSTACKFRAME_EX,
    ContextRecord_in_out: PVOID,
    ReadMemoryRoutine: OPTIONAL<PREAD_PROCESS_MEMORY_ROUTINE64>,
    FunctionTableAccessRoutine: OPTIONAL<PFUNCTION_TABLE_ACCESS_ROUTINE64>,
    GetModuleBaseRoutine: OPTIONAL<PGET_MODULE_BASE_ROUTINE64>,
    TranslateAddress: OPTIONAL<PTRANSLATE_ADDRESS_ROUTINE64>,
    Flags: DWORD,
  ): BOOL {
    return Dbghelp.Load('StackWalkEx')(MachineType, hProcess, hThread, StackFrame_in_out, ContextRecord_in_out, ReadMemoryRoutine, FunctionTableAccessRoutine, GetModuleBaseRoutine, TranslateAddress, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symaddsymbol
  public static SymAddSymbol(hProcess: HANDLE, BaseOfDll: ULONG64, Name: LPCSTR, Address: DWORD64, Size: DWORD, Flags: DWORD): BOOL {
    return Dbghelp.Load('SymAddSymbol')(hProcess, BaseOfDll, Name, Address, Size, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symaddsymbolw
  public static SymAddSymbolW(hProcess: HANDLE, BaseOfDll: ULONG64, Name: LPCWSTR, Address: DWORD64, Size: DWORD, Flags: DWORD): BOOL {
    return Dbghelp.Load('SymAddSymbolW')(hProcess, BaseOfDll, Name, Address, Size, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symaddrincludeinlinetrace
  public static SymAddrIncludeInlineTrace(hProcess: HANDLE, Address: DWORD64): DWORD {
    return Dbghelp.Load('SymAddrIncludeInlineTrace')(hProcess, Address);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symcleanup
  public static SymCleanup(hProcess: HANDLE): BOOL {
    return Dbghelp.Load('SymCleanup')(hProcess);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symcompareinlinetrace
  public static SymCompareInlineTrace(hProcess: HANDLE, Address1: DWORD64, InlineContext1: DWORD, RetAddress1: DWORD64, Address2: DWORD64, RetAddress2: DWORD64): DWORD {
    return Dbghelp.Load('SymCompareInlineTrace')(hProcess, Address1, InlineContext1, RetAddress1, Address2, RetAddress2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symdeletesymbol
  public static SymDeleteSymbol(hProcess: HANDLE, BaseOfDll: ULONG64, Name: OPTIONAL<LPCSTR>, Address: DWORD64, Flags: DWORD): BOOL {
    return Dbghelp.Load('SymDeleteSymbol')(hProcess, BaseOfDll, Name, Address, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symdeletesymbolw
  public static SymDeleteSymbolW(hProcess: HANDLE, BaseOfDll: ULONG64, Name: OPTIONAL<LPCWSTR>, Address: DWORD64, Flags: DWORD): BOOL {
    return Dbghelp.Load('SymDeleteSymbolW')(hProcess, BaseOfDll, Name, Address, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symenumlines
  public static SymEnumLines(hProcess: HANDLE, Base: ULONG64, Obj: OPTIONAL<LPCSTR>, File: OPTIONAL<LPCSTR>, EnumLinesCallback: PSYM_ENUMLINES_CALLBACK, UserContext: OPTIONAL<PVOID>): BOOL {
    return Dbghelp.Load('SymEnumLines')(hProcess, Base, Obj, File, EnumLinesCallback, UserContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symenumlines
  public static SymEnumLinesW(hProcess: HANDLE, Base: ULONG64, Obj: OPTIONAL<LPCWSTR>, File: OPTIONAL<LPCWSTR>, EnumLinesCallback: PSYM_ENUMLINES_CALLBACKW, UserContext: OPTIONAL<PVOID>): BOOL {
    return Dbghelp.Load('SymEnumLinesW')(hProcess, Base, Obj, File, EnumLinesCallback, UserContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symenumsourcefiletokens
  public static SymEnumSourceFileTokens(hProcess: HANDLE, Base: ULONG64, Callback: PENUMSOURCEFILETOKENSCALLBACK): BOOL {
    return Dbghelp.Load('SymEnumSourceFileTokens')(hProcess, Base, Callback);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symenumsourcefiles
  public static SymEnumSourceFiles(hProcess: HANDLE, ModBase: ULONG64, Mask: OPTIONAL<LPCSTR>, cbSrcFiles: PSYM_ENUMSOURCEFILES_CALLBACK, UserContext: OPTIONAL<PVOID>): BOOL {
    return Dbghelp.Load('SymEnumSourceFiles')(hProcess, ModBase, Mask, cbSrcFiles, UserContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symenumsourcefilesw
  public static SymEnumSourceFilesW(hProcess: HANDLE, ModBase: ULONG64, Mask: OPTIONAL<LPCWSTR>, cbSrcFiles: PSYM_ENUMSOURCEFILES_CALLBACKW, UserContext: OPTIONAL<PVOID>): BOOL {
    return Dbghelp.Load('SymEnumSourceFilesW')(hProcess, ModBase, Mask, cbSrcFiles, UserContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symenumsourcelines
  public static SymEnumSourceLines(hProcess: HANDLE, Base: ULONG64, Obj: OPTIONAL<LPCSTR>, File: OPTIONAL<LPCSTR>, Line: DWORD, Flags: DWORD, EnumLinesCallback: PSYM_ENUMLINES_CALLBACK, UserContext: OPTIONAL<PVOID>): BOOL {
    return Dbghelp.Load('SymEnumSourceLines')(hProcess, Base, Obj, File, Line, Flags, EnumLinesCallback, UserContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symenumsourcelinesw
  public static SymEnumSourceLinesW(hProcess: HANDLE, Base: ULONG64, Obj: OPTIONAL<LPCWSTR>, File: OPTIONAL<LPCWSTR>, Line: DWORD, Flags: DWORD, EnumLinesCallback: PSYM_ENUMLINES_CALLBACKW, UserContext: OPTIONAL<PVOID>): BOOL {
    return Dbghelp.Load('SymEnumSourceLinesW')(hProcess, Base, Obj, File, Line, Flags, EnumLinesCallback, UserContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symenumsymbols
  public static SymEnumSymbols(hProcess: HANDLE, BaseOfDll: ULONG64, Mask: OPTIONAL<LPCSTR>, EnumSymbolsCallback: PSYM_ENUMERATESYMBOLS_CALLBACK, UserContext: OPTIONAL<PVOID>): BOOL {
    return Dbghelp.Load('SymEnumSymbols')(hProcess, BaseOfDll, Mask, EnumSymbolsCallback, UserContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symenumsymbolsex
  public static SymEnumSymbolsEx(hProcess: HANDLE, BaseOfDll: ULONG64, Mask: OPTIONAL<LPCSTR>, EnumSymbolsCallback: PSYM_ENUMERATESYMBOLS_CALLBACK, UserContext: OPTIONAL<PVOID>, Options: DWORD): BOOL {
    return Dbghelp.Load('SymEnumSymbolsEx')(hProcess, BaseOfDll, Mask, EnumSymbolsCallback, UserContext, Options);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symenumsymbolsexw
  public static SymEnumSymbolsExW(hProcess: HANDLE, BaseOfDll: ULONG64, Mask: OPTIONAL<LPCWSTR>, EnumSymbolsCallback: PSYM_ENUMERATESYMBOLS_CALLBACKW, UserContext: OPTIONAL<PVOID>, Options: DWORD): BOOL {
    return Dbghelp.Load('SymEnumSymbolsExW')(hProcess, BaseOfDll, Mask, EnumSymbolsCallback, UserContext, Options);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symenumsymbolsw
  public static SymEnumSymbolsW(hProcess: HANDLE, BaseOfDll: ULONG64, Mask: OPTIONAL<LPCWSTR>, EnumSymbolsCallback: PSYM_ENUMERATESYMBOLS_CALLBACKW, UserContext: OPTIONAL<PVOID>): BOOL {
    return Dbghelp.Load('SymEnumSymbolsW')(hProcess, BaseOfDll, Mask, EnumSymbolsCallback, UserContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symenumtypes
  public static SymEnumTypes(hProcess: HANDLE, BaseOfDll: ULONG64, EnumSymbolsCallback: PSYM_ENUMERATESYMBOLS_CALLBACK, UserContext: OPTIONAL<PVOID>): BOOL {
    return Dbghelp.Load('SymEnumTypes')(hProcess, BaseOfDll, EnumSymbolsCallback, UserContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symenumtypesbyname
  public static SymEnumTypesByName(hProcess: HANDLE, BaseOfDll: ULONG64, mask: OPTIONAL<LPCSTR>, EnumSymbolsCallback: PSYM_ENUMERATESYMBOLS_CALLBACK, UserContext: OPTIONAL<PVOID>): BOOL {
    return Dbghelp.Load('SymEnumTypesByName')(hProcess, BaseOfDll, mask, EnumSymbolsCallback, UserContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symenumtypesbynamew
  public static SymEnumTypesByNameW(hProcess: HANDLE, BaseOfDll: ULONG64, mask: OPTIONAL<LPCWSTR>, EnumSymbolsCallback: PSYM_ENUMERATESYMBOLS_CALLBACKW, UserContext: OPTIONAL<PVOID>): BOOL {
    return Dbghelp.Load('SymEnumTypesByNameW')(hProcess, BaseOfDll, mask, EnumSymbolsCallback, UserContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symenumtypesw
  public static SymEnumTypesW(hProcess: HANDLE, BaseOfDll: ULONG64, EnumSymbolsCallback: PSYM_ENUMERATESYMBOLS_CALLBACKW, UserContext: OPTIONAL<PVOID>): BOOL {
    return Dbghelp.Load('SymEnumTypesW')(hProcess, BaseOfDll, EnumSymbolsCallback, UserContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symfinddebuginfofile
  public static SymFindDebugInfoFile(hProcess: HANDLE, FileName: LPCSTR, DebugFilePath_out: LPSTR, Callback: OPTIONAL<PFIND_DEBUG_FILE_CALLBACK>, CallerData: OPTIONAL<PVOID>): HANDLE {
    return Dbghelp.Load('SymFindDebugInfoFile')(hProcess, FileName, DebugFilePath_out, Callback, CallerData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symfinddebuginfofilew
  public static SymFindDebugInfoFileW(hProcess: HANDLE, FileName: LPCWSTR, DebugFilePath_out: LPWSTR, Callback: OPTIONAL<PFIND_DEBUG_FILE_CALLBACKW>, CallerData: OPTIONAL<PVOID>): HANDLE {
    return Dbghelp.Load('SymFindDebugInfoFileW')(hProcess, FileName, DebugFilePath_out, Callback, CallerData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symfindexecutableimage
  public static SymFindExecutableImage(hProcess: HANDLE, FileName: LPCSTR, ImageFilePath_out: LPSTR, Callback: PFIND_EXE_FILE_CALLBACK, CallerData: PVOID): HANDLE {
    return Dbghelp.Load('SymFindExecutableImage')(hProcess, FileName, ImageFilePath_out, Callback, CallerData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symfindexecutableimagew
  public static SymFindExecutableImageW(hProcess: HANDLE, FileName: LPCWSTR, ImageFilePath_out: LPWSTR, Callback: PFIND_EXE_FILE_CALLBACKW, CallerData: PVOID): HANDLE {
    return Dbghelp.Load('SymFindExecutableImageW')(hProcess, FileName, ImageFilePath_out, Callback, CallerData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symfindfileinpath
  public static SymFindFileInPath(
    hprocess: HANDLE,
    SearchPath: OPTIONAL<LPCSTR>,
    FileName: LPCSTR,
    id: OPTIONAL<PVOID>,
    two: DWORD,
    three: DWORD,
    flags: DWORD,
    FoundFile_out: LPSTR,
    callback: OPTIONAL<PFINDFILEINPATHCALLBACK>,
    context: OPTIONAL<PVOID>,
  ): BOOL {
    return Dbghelp.Load('SymFindFileInPath')(hprocess, SearchPath, FileName, id, two, three, flags, FoundFile_out, callback, context);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symfindfileinpathw
  public static SymFindFileInPathW(
    hprocess: HANDLE,
    SearchPath: OPTIONAL<LPCWSTR>,
    FileName: LPCWSTR,
    id: OPTIONAL<PVOID>,
    two: DWORD,
    three: DWORD,
    flags: DWORD,
    FoundFile_out: LPWSTR,
    callback: OPTIONAL<PFINDFILEINPATHCALLBACKW>,
    context: OPTIONAL<PVOID>,
  ): BOOL {
    return Dbghelp.Load('SymFindFileInPathW')(hprocess, SearchPath, FileName, id, two, three, flags, FoundFile_out, callback, context);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symfromaddr
  public static SymFromAddr(hProcess: HANDLE, Address: DWORD64, Displacement_out: OPTIONAL<PDWORD64>, Symbol_in_out: PSYMBOL_INFO): BOOL {
    return Dbghelp.Load('SymFromAddr')(hProcess, Address, Displacement_out, Symbol_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symfromaddrw
  public static SymFromAddrW(hProcess: HANDLE, Address: DWORD64, Displacement_out: OPTIONAL<PDWORD64>, Symbol_in_out: PSYMBOL_INFOW): BOOL {
    return Dbghelp.Load('SymFromAddrW')(hProcess, Address, Displacement_out, Symbol_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symfromindex
  public static SymFromIndex(hProcess: HANDLE, BaseOfDll: ULONG64, Index: DWORD, Symbol_in_out: PSYMBOL_INFO): BOOL {
    return Dbghelp.Load('SymFromIndex')(hProcess, BaseOfDll, Index, Symbol_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symfromindexw
  public static SymFromIndexW(hProcess: HANDLE, BaseOfDll: ULONG64, Index: DWORD, Symbol_in_out: PSYMBOL_INFOW): BOOL {
    return Dbghelp.Load('SymFromIndexW')(hProcess, BaseOfDll, Index, Symbol_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symfrominlinecontext
  public static SymFromInlineContext(hProcess: HANDLE, Address: DWORD64, InlineContext: ULONG, Displacement_out: OPTIONAL<PDWORD64>, Symbol_in_out: PSYMBOL_INFO): BOOL {
    return Dbghelp.Load('SymFromInlineContext')(hProcess, Address, InlineContext, Displacement_out, Symbol_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symfrominlinecontextw
  public static SymFromInlineContextW(hProcess: HANDLE, Address: DWORD64, InlineContext: ULONG, Displacement_out: OPTIONAL<PDWORD64>, Symbol_in_out: PSYMBOL_INFOW): BOOL {
    return Dbghelp.Load('SymFromInlineContextW')(hProcess, Address, InlineContext, Displacement_out, Symbol_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symfromname
  public static SymFromName(hProcess: HANDLE, Name: LPCSTR, Symbol_in_out: PSYMBOL_INFO): BOOL {
    return Dbghelp.Load('SymFromName')(hProcess, Name, Symbol_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symfromnamew
  public static SymFromNameW(hProcess: HANDLE, Name: LPCWSTR, Symbol_in_out: PSYMBOL_INFOW): BOOL {
    return Dbghelp.Load('SymFromNameW')(hProcess, Name, Symbol_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symfromtoken
  public static SymFromToken(hProcess: HANDLE, Base: ULONG64, Token: DWORD, Symbol_in_out: PSYMBOL_INFO): BOOL {
    return Dbghelp.Load('SymFromToken')(hProcess, Base, Token, Symbol_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symfromtokenw
  public static SymFromTokenW(hProcess: HANDLE, Base: ULONG64, Token: DWORD, Symbol_in_out: PSYMBOL_INFOW): BOOL {
    return Dbghelp.Load('SymFromTokenW')(hProcess, Base, Token, Symbol_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symfunctiontableaccess64
  public static SymFunctionTableAccess64(hProcess: HANDLE, AddrBase: DWORD64): PVOID {
    return Dbghelp.Load('SymFunctionTableAccess64')(hProcess, AddrBase);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symgetextendedoption
  public static SymGetExtendedOption(option: IMAGEHLP_EXTENDED_OPTIONS): BOOL {
    return Dbghelp.Load('SymGetExtendedOption')(option);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symgethomedirectory
  public static SymGetHomeDirectory(type: DWORD, dir_out: LPSTR, size: SIZE_T): LPSTR {
    return Dbghelp.Load('SymGetHomeDirectory')(type, dir_out, size);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symgethomedirectoryw
  public static SymGetHomeDirectoryW(type: DWORD, dir_out: LPWSTR, size: SIZE_T): LPWSTR {
    return Dbghelp.Load('SymGetHomeDirectoryW')(type, dir_out, size);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symgetlinefromaddr64
  public static SymGetLineFromAddr64(hProcess: HANDLE, qwAddr: DWORD64, pdwDisplacement_out: PDWORD, Line64_out: PIMAGEHLP_LINE64): BOOL {
    return Dbghelp.Load('SymGetLineFromAddr64')(hProcess, qwAddr, pdwDisplacement_out, Line64_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symgetlinefromaddrw64
  public static SymGetLineFromAddrW64(hProcess: HANDLE, dwAddr: DWORD64, pdwDisplacement_out: PDWORD, Line_out: PIMAGEHLP_LINEW64): BOOL {
    return Dbghelp.Load('SymGetLineFromAddrW64')(hProcess, dwAddr, pdwDisplacement_out, Line_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symgetlinefrominlinecontext
  public static SymGetLineFromInlineContext(hProcess: HANDLE, qwAddr: DWORD64, InlineContext: ULONG, qwModuleBaseAddress: OPTIONAL<DWORD64>, pdwDisplacement_out: PDWORD, Line64_out: PIMAGEHLP_LINE64): BOOL {
    return Dbghelp.Load('SymGetLineFromInlineContext')(hProcess, qwAddr, InlineContext, qwModuleBaseAddress, pdwDisplacement_out, Line64_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symgetlinefrominlinecontextw
  public static SymGetLineFromInlineContextW(hProcess: HANDLE, dwAddr: DWORD64, InlineContext: ULONG, qwModuleBaseAddress: OPTIONAL<DWORD64>, pdwDisplacement_out: PDWORD, Line_out: PIMAGEHLP_LINEW64): BOOL {
    return Dbghelp.Load('SymGetLineFromInlineContextW')(hProcess, dwAddr, InlineContext, qwModuleBaseAddress, pdwDisplacement_out, Line_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symgetlinefromname64
  public static SymGetLineFromName64(hProcess: HANDLE, ModuleName: OPTIONAL<LPCSTR>, FileName: OPTIONAL<LPCSTR>, dwLineNumber: DWORD, plDisplacement_out: PLONG, Line_in_out: PIMAGEHLP_LINE64): BOOL {
    return Dbghelp.Load('SymGetLineFromName64')(hProcess, ModuleName, FileName, dwLineNumber, plDisplacement_out, Line_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symgetlinefromnamew64
  public static SymGetLineFromNameW64(hProcess: HANDLE, ModuleName: OPTIONAL<LPCWSTR>, FileName: OPTIONAL<LPCWSTR>, dwLineNumber: DWORD, plDisplacement_out: PLONG, Line_in_out: PIMAGEHLP_LINEW64): BOOL {
    return Dbghelp.Load('SymGetLineFromNameW64')(hProcess, ModuleName, FileName, dwLineNumber, plDisplacement_out, Line_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symgetlinenext64
  public static SymGetLineNext64(hProcess: HANDLE, Line_in_out: PIMAGEHLP_LINE64): BOOL {
    return Dbghelp.Load('SymGetLineNext64')(hProcess, Line_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symgetlinenextw64
  public static SymGetLineNextW64(hProcess: HANDLE, Line_in_out: PIMAGEHLP_LINEW64): BOOL {
    return Dbghelp.Load('SymGetLineNextW64')(hProcess, Line_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symgetlineprev64
  public static SymGetLinePrev64(hProcess: HANDLE, Line_in_out: PIMAGEHLP_LINE64): BOOL {
    return Dbghelp.Load('SymGetLinePrev64')(hProcess, Line_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symgetlineprevw64
  public static SymGetLinePrevW64(hProcess: HANDLE, Line_in_out: PIMAGEHLP_LINEW64): BOOL {
    return Dbghelp.Load('SymGetLinePrevW64')(hProcess, Line_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symgetmodulebase64
  public static SymGetModuleBase64(hProcess: HANDLE, qwAddr: DWORD64): DWORD64 {
    return Dbghelp.Load('SymGetModuleBase64')(hProcess, qwAddr);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symgetmoduleinfo64
  public static SymGetModuleInfo64(hProcess: HANDLE, qwAddr: DWORD64, ModuleInfo_out: PIMAGEHLP_MODULE64): BOOL {
    return Dbghelp.Load('SymGetModuleInfo64')(hProcess, qwAddr, ModuleInfo_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symgetmoduleinfow64
  public static SymGetModuleInfoW64(hProcess: HANDLE, qwAddr: DWORD64, ModuleInfo_out: PIMAGEHLP_MODULEW64): BOOL {
    return Dbghelp.Load('SymGetModuleInfoW64')(hProcess, qwAddr, ModuleInfo_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symgetomaps
  public static SymGetOmaps(hProcess: HANDLE, BaseOfDll: DWORD64, OmapTo_out: PVOID, cOmapTo_out: PDWORD64, OmapFrom_out: PVOID, cOmapFrom_out: PDWORD64): BOOL {
    return Dbghelp.Load('SymGetOmaps')(hProcess, BaseOfDll, OmapTo_out, cOmapTo_out, OmapFrom_out, cOmapFrom_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symgetoptions
  public static SymGetOptions(): DWORD {
    return Dbghelp.Load('SymGetOptions')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symgetscope
  public static SymGetScope(hProcess: HANDLE, BaseOfDll: ULONG64, Index: DWORD, Symbol_in_out: PSYMBOL_INFO): BOOL {
    return Dbghelp.Load('SymGetScope')(hProcess, BaseOfDll, Index, Symbol_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symgetscopew
  public static SymGetScopeW(hProcess: HANDLE, BaseOfDll: ULONG64, Index: DWORD, Symbol_in_out: PSYMBOL_INFOW): BOOL {
    return Dbghelp.Load('SymGetScopeW')(hProcess, BaseOfDll, Index, Symbol_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symgetsearchpath
  public static SymGetSearchPath(hProcess: HANDLE, SearchPath_out: LPSTR, SearchPathLength: DWORD): BOOL {
    return Dbghelp.Load('SymGetSearchPath')(hProcess, SearchPath_out, SearchPathLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symgetsearchpathw
  public static SymGetSearchPathW(hProcess: HANDLE, SearchPath_out: LPWSTR, SearchPathLength: DWORD): BOOL {
    return Dbghelp.Load('SymGetSearchPathW')(hProcess, SearchPath_out, SearchPathLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symgetsourcefile
  public static SymGetSourceFile(hProcess: HANDLE, Base: ULONG64, Params: OPTIONAL<LPCSTR>, FileSpec: LPCSTR, FilePath_out: LPSTR, Size: DWORD): BOOL {
    return Dbghelp.Load('SymGetSourceFile')(hProcess, Base, Params, FileSpec, FilePath_out, Size);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symgetsourcefilechecksum
  public static SymGetSourceFileChecksum(hProcess: HANDLE, Base: ULONG64, FileSpec: LPCSTR, pCheckSumType_out: PDWORD, pChecksum_out: PVOID, checksumSize: DWORD, pActualBytesWritten_out: PDWORD): BOOL {
    return Dbghelp.Load('SymGetSourceFileChecksum')(hProcess, Base, FileSpec, pCheckSumType_out, pChecksum_out, checksumSize, pActualBytesWritten_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symgetsourcefilechecksumw
  public static SymGetSourceFileChecksumW(hProcess: HANDLE, Base: ULONG64, FileSpec: LPCWSTR, pCheckSumType_out: PDWORD, pChecksum_out: PVOID, checksumSize: DWORD, pActualBytesWritten_out: PDWORD): BOOL {
    return Dbghelp.Load('SymGetSourceFileChecksumW')(hProcess, Base, FileSpec, pCheckSumType_out, pChecksum_out, checksumSize, pActualBytesWritten_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symgetsourcefilefromtoken
  public static SymGetSourceFileFromToken(hProcess: HANDLE, Token: PVOID, Params: OPTIONAL<LPCSTR>, FilePath_out: LPSTR, Size: DWORD): BOOL {
    return Dbghelp.Load('SymGetSourceFileFromToken')(hProcess, Token, Params, FilePath_out, Size);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symgetsourcefilefromtokenw
  public static SymGetSourceFileFromTokenW(hProcess: HANDLE, Token: PVOID, Params: OPTIONAL<LPCWSTR>, FilePath_out: LPWSTR, Size: DWORD): BOOL {
    return Dbghelp.Load('SymGetSourceFileFromTokenW')(hProcess, Token, Params, FilePath_out, Size);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symgetsourcefiletoken
  public static SymGetSourceFileToken(hProcess: HANDLE, Base: ULONG64, FileSpec: LPCSTR, Token_out: PVOID, Size_out: PDWORD): BOOL {
    return Dbghelp.Load('SymGetSourceFileToken')(hProcess, Base, FileSpec, Token_out, Size_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symgetsourcefiletokenw
  public static SymGetSourceFileTokenW(hProcess: HANDLE, Base: ULONG64, FileSpec: LPCWSTR, Token_out: PVOID, Size_out: PDWORD): BOOL {
    return Dbghelp.Load('SymGetSourceFileTokenW')(hProcess, Base, FileSpec, Token_out, Size_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symgetsourcefilew
  public static SymGetSourceFileW(hProcess: HANDLE, Base: ULONG64, Params: OPTIONAL<LPCWSTR>, FileSpec: LPCWSTR, FilePath_out: LPWSTR, Size: DWORD): BOOL {
    return Dbghelp.Load('SymGetSourceFileW')(hProcess, Base, Params, FileSpec, FilePath_out, Size);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symgetsourcevarfromtoken
  public static SymGetSourceVarFromToken(hProcess: HANDLE, Token: PVOID, Params: OPTIONAL<LPCSTR>, VarName: LPCSTR, Value_out: LPSTR, Size: DWORD): BOOL {
    return Dbghelp.Load('SymGetSourceVarFromToken')(hProcess, Token, Params, VarName, Value_out, Size);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symgetsourcevarfromtokenw
  public static SymGetSourceVarFromTokenW(hProcess: HANDLE, Token: PVOID, Params: OPTIONAL<LPCWSTR>, VarName: LPCWSTR, Value_out: LPWSTR, Size: DWORD): BOOL {
    return Dbghelp.Load('SymGetSourceVarFromTokenW')(hProcess, Token, Params, VarName, Value_out, Size);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symgetsymbolfile
  public static SymGetSymbolFile(hProcess: OPTIONAL<HANDLE>, SymPath: OPTIONAL<LPCSTR>, ImageFile: LPCSTR, Type: DWORD, SymbolFile_out: LPSTR, cSymbolFile: SIZE_T, DbgFile_out: LPSTR, cDbgFile: SIZE_T): BOOL {
    return Dbghelp.Load('SymGetSymbolFile')(hProcess, SymPath, ImageFile, Type, SymbolFile_out, cSymbolFile, DbgFile_out, cDbgFile);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symgetsymbolfilew
  public static SymGetSymbolFileW(hProcess: OPTIONAL<HANDLE>, SymPath: OPTIONAL<LPCWSTR>, ImageFile: LPCWSTR, Type: DWORD, SymbolFile_out: LPWSTR, cSymbolFile: SIZE_T, DbgFile_out: LPWSTR, cDbgFile: SIZE_T): BOOL {
    return Dbghelp.Load('SymGetSymbolFileW')(hProcess, SymPath, ImageFile, Type, SymbolFile_out, cSymbolFile, DbgFile_out, cDbgFile);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symgettypefromname
  public static SymGetTypeFromName(hProcess: HANDLE, BaseOfDll: ULONG64, Name: LPCSTR, Symbol_in_out: PSYMBOL_INFO): BOOL {
    return Dbghelp.Load('SymGetTypeFromName')(hProcess, BaseOfDll, Name, Symbol_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symgettypefromnamew
  public static SymGetTypeFromNameW(hProcess: HANDLE, BaseOfDll: ULONG64, Name: LPCWSTR, Symbol_in_out: PSYMBOL_INFOW): BOOL {
    return Dbghelp.Load('SymGetTypeFromNameW')(hProcess, BaseOfDll, Name, Symbol_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symgettypeinfo
  public static SymGetTypeInfo(hProcess: HANDLE, ModBase: DWORD64, TypeId: ULONG, GetType: IMAGEHLP_SYMBOL_TYPE_INFO, pInfo_out: PVOID): BOOL {
    return Dbghelp.Load('SymGetTypeInfo')(hProcess, ModBase, TypeId, GetType, pInfo_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symgettypeinfoex
  public static SymGetTypeInfoEx(hProcess: HANDLE, ModBase: DWORD64, Params_in_out: PIMAGEHLP_GET_TYPE_INFO_PARAMS): BOOL {
    return Dbghelp.Load('SymGetTypeInfoEx')(hProcess, ModBase, Params_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symgetunwindinfo
  public static SymGetUnwindInfo(hProcess: HANDLE, Address: DWORD64, Buffer_out: OPTIONAL<PVOID>, Size_in_out: PULONG): BOOL {
    return Dbghelp.Load('SymGetUnwindInfo')(hProcess, Address, Buffer_out, Size_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-syminitialize
  public static SymInitialize(hProcess: HANDLE, UserSearchPath: OPTIONAL<LPCSTR>, fInvadeProcess: BOOL): BOOL {
    return Dbghelp.Load('SymInitialize')(hProcess, UserSearchPath, fInvadeProcess);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-syminitializew
  public static SymInitializeW(hProcess: HANDLE, UserSearchPath: OPTIONAL<LPCWSTR>, fInvadeProcess: BOOL): BOOL {
    return Dbghelp.Load('SymInitializeW')(hProcess, UserSearchPath, fInvadeProcess);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symloadmoduleex
  public static SymLoadModuleEx(hProcess: HANDLE, hFile: OPTIONAL<HANDLE>, ImageName: OPTIONAL<LPCSTR>, ModuleName: OPTIONAL<LPCSTR>, BaseOfDll: DWORD64, DllSize: DWORD, Data: OPTIONAL<PMODLOAD_DATA>, Flags: DWORD): DWORD64 {
    return Dbghelp.Load('SymLoadModuleEx')(hProcess, hFile, ImageName, ModuleName, BaseOfDll, DllSize, Data, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symloadmoduleexw
  public static SymLoadModuleExW(hProcess: HANDLE, hFile: OPTIONAL<HANDLE>, ImageName: OPTIONAL<LPCWSTR>, ModuleName: OPTIONAL<LPCWSTR>, BaseOfDll: DWORD64, DllSize: DWORD, Data: OPTIONAL<PMODLOAD_DATA>, Flags: DWORD): DWORD64 {
    return Dbghelp.Load('SymLoadModuleExW')(hProcess, hFile, ImageName, ModuleName, BaseOfDll, DllSize, Data, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symmatchfilename
  public static SymMatchFileName(FileName: LPCSTR, Match: LPCSTR, FileNameStop_out: OPTIONAL<PVOID>, MatchStop_out: OPTIONAL<PVOID>): BOOL {
    return Dbghelp.Load('SymMatchFileName')(FileName, Match, FileNameStop_out, MatchStop_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symmatchfilenamew
  public static SymMatchFileNameW(FileName: LPCWSTR, Match: LPCWSTR, FileNameStop_out: OPTIONAL<PVOID>, MatchStop_out: OPTIONAL<PVOID>): BOOL {
    return Dbghelp.Load('SymMatchFileNameW')(FileName, Match, FileNameStop_out, MatchStop_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symmatchstring
  public static SymMatchString(string: LPCSTR, expression: LPCSTR, fCase: BOOL): BOOL {
    return Dbghelp.Load('SymMatchString')(string, expression, fCase);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symmatchstringa
  public static SymMatchStringA(string: LPCSTR, expression: LPCSTR, fCase: BOOL): BOOL {
    return Dbghelp.Load('SymMatchStringA')(string, expression, fCase);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symmatchstringw
  public static SymMatchStringW(string: LPCWSTR, expression: LPCWSTR, fCase: BOOL): BOOL {
    return Dbghelp.Load('SymMatchStringW')(string, expression, fCase);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symnext
  public static SymNext(hProcess: HANDLE, si_in_out: PSYMBOL_INFO): BOOL {
    return Dbghelp.Load('SymNext')(hProcess, si_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symnextw
  public static SymNextW(hProcess: HANDLE, siw_in_out: PSYMBOL_INFOW): BOOL {
    return Dbghelp.Load('SymNextW')(hProcess, siw_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symprev
  public static SymPrev(hProcess: HANDLE, si_in_out: PSYMBOL_INFO): BOOL {
    return Dbghelp.Load('SymPrev')(hProcess, si_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symprevw
  public static SymPrevW(hProcess: HANDLE, siw_in_out: PSYMBOL_INFOW): BOOL {
    return Dbghelp.Load('SymPrevW')(hProcess, siw_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symqueryinlinetrace
  public static SymQueryInlineTrace(hProcess: HANDLE, StartAddress: DWORD64, StartContext: DWORD, StartRetAddress: DWORD64, CurAddress: DWORD64, CurContext_out: LPDWORD, CurFrameIndex_out: LPDWORD): BOOL {
    return Dbghelp.Load('SymQueryInlineTrace')(hProcess, StartAddress, StartContext, StartRetAddress, CurAddress, CurContext_out, CurFrameIndex_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symrefreshmodulelist
  public static SymRefreshModuleList(hProcess: HANDLE): BOOL {
    return Dbghelp.Load('SymRefreshModuleList')(hProcess);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symregistercallback64
  public static SymRegisterCallback64(hProcess: HANDLE, CallbackFunction: PSYMBOL_REGISTERED_CALLBACK64, UserContext: ULONG64): BOOL {
    return Dbghelp.Load('SymRegisterCallback64')(hProcess, CallbackFunction, UserContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symregistercallbackw64
  public static SymRegisterCallbackW64(hProcess: HANDLE, CallbackFunction: PSYMBOL_REGISTERED_CALLBACK64, UserContext: ULONG64): BOOL {
    return Dbghelp.Load('SymRegisterCallbackW64')(hProcess, CallbackFunction, UserContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symregisterfunctionentrycallback64
  public static SymRegisterFunctionEntryCallback64(hProcess: HANDLE, CallbackFunction: PSYMBOL_FUNCENTRY_CALLBACK64, UserContext: ULONG64): BOOL {
    return Dbghelp.Load('SymRegisterFunctionEntryCallback64')(hProcess, CallbackFunction, UserContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symsearch
  public static SymSearch(
    hProcess: HANDLE,
    BaseOfDll: ULONG64,
    Index: DWORD,
    SymTag: DWORD,
    Mask: OPTIONAL<LPCSTR>,
    Address: OPTIONAL<DWORD64>,
    EnumSymbolsCallback: PSYM_ENUMERATESYMBOLS_CALLBACK,
    UserContext: OPTIONAL<PVOID>,
    Options: DWORD,
  ): BOOL {
    return Dbghelp.Load('SymSearch')(hProcess, BaseOfDll, Index, SymTag, Mask, Address, EnumSymbolsCallback, UserContext, Options);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symsearchw
  public static SymSearchW(
    hProcess: HANDLE,
    BaseOfDll: ULONG64,
    Index: DWORD,
    SymTag: DWORD,
    Mask: OPTIONAL<LPCWSTR>,
    Address: OPTIONAL<DWORD64>,
    EnumSymbolsCallback: PSYM_ENUMERATESYMBOLS_CALLBACKW,
    UserContext: OPTIONAL<PVOID>,
    Options: DWORD,
  ): BOOL {
    return Dbghelp.Load('SymSearchW')(hProcess, BaseOfDll, Index, SymTag, Mask, Address, EnumSymbolsCallback, UserContext, Options);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symsetcontext
  public static SymSetContext(hProcess: HANDLE, StackFrame: PIMAGEHLP_STACK_FRAME, Context: OPTIONAL<PIMAGEHLP_CONTEXT>): BOOL {
    return Dbghelp.Load('SymSetContext')(hProcess, StackFrame, Context);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symsetextendedoption
  public static SymSetExtendedOption(option: IMAGEHLP_EXTENDED_OPTIONS, value: BOOL): BOOL {
    return Dbghelp.Load('SymSetExtendedOption')(option, value);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symsethomedirectory
  public static SymSetHomeDirectory(hProcess: OPTIONAL<HANDLE>, dir: OPTIONAL<LPCSTR>): LPSTR {
    return Dbghelp.Load('SymSetHomeDirectory')(hProcess, dir);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symsethomedirectoryw
  public static SymSetHomeDirectoryW(hProcess: OPTIONAL<HANDLE>, dir: OPTIONAL<LPCWSTR>): LPWSTR {
    return Dbghelp.Load('SymSetHomeDirectoryW')(hProcess, dir);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symsetoptions
  public static SymSetOptions(SymOptions: DWORD): DWORD {
    return Dbghelp.Load('SymSetOptions')(SymOptions);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symsetparentwindow
  public static SymSetParentWindow(hwnd: HWND): BOOL {
    return Dbghelp.Load('SymSetParentWindow')(hwnd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symsetscopefromaddr
  public static SymSetScopeFromAddr(hProcess: HANDLE, Address: ULONG64): BOOL {
    return Dbghelp.Load('SymSetScopeFromAddr')(hProcess, Address);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symsetscopefromindex
  public static SymSetScopeFromIndex(hProcess: HANDLE, BaseOfDll: ULONG64, Index: DWORD): BOOL {
    return Dbghelp.Load('SymSetScopeFromIndex')(hProcess, BaseOfDll, Index);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symsetscopefrominlinecontext
  public static SymSetScopeFromInlineContext(hProcess: HANDLE, Address: ULONG64, InlineContext: ULONG): BOOL {
    return Dbghelp.Load('SymSetScopeFromInlineContext')(hProcess, Address, InlineContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symsetsearchpath
  public static SymSetSearchPath(hProcess: HANDLE, SearchPath: OPTIONAL<LPCSTR>): BOOL {
    return Dbghelp.Load('SymSetSearchPath')(hProcess, SearchPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symsetsearchpathw
  public static SymSetSearchPathW(hProcess: HANDLE, SearchPath: OPTIONAL<LPCWSTR>): BOOL {
    return Dbghelp.Load('SymSetSearchPathW')(hProcess, SearchPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symsrvdeltaname
  public static SymSrvDeltaName(hProcess: HANDLE, SymPath: OPTIONAL<LPCSTR>, Type: LPCSTR, File1: LPCSTR, File2: LPCSTR): LPCSTR {
    return Dbghelp.Load('SymSrvDeltaName')(hProcess, SymPath, Type, File1, File2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symsrvdeltanamew
  public static SymSrvDeltaNameW(hProcess: HANDLE, SymPath: OPTIONAL<LPCWSTR>, Type: LPCWSTR, File1: LPCWSTR, File2: LPCWSTR): LPCWSTR {
    return Dbghelp.Load('SymSrvDeltaNameW')(hProcess, SymPath, Type, File1, File2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symsrvgetfileindexinfo
  public static SymSrvGetFileIndexInfo(File: LPCSTR, Info_out: PSYMSRV_INDEX_INFO, Flags: DWORD): BOOL {
    return Dbghelp.Load('SymSrvGetFileIndexInfo')(File, Info_out, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symsrvgetfileindexinfow
  public static SymSrvGetFileIndexInfoW(File: LPCWSTR, Info_out: PSYMSRV_INDEX_INFOW, Flags: DWORD): BOOL {
    return Dbghelp.Load('SymSrvGetFileIndexInfoW')(File, Info_out, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symsrvgetfileindexstring
  public static SymSrvGetFileIndexString(hProcess: HANDLE, SrvPath: OPTIONAL<LPCSTR>, File: LPCSTR, Index_out: LPSTR, Size: SIZE_T, Flags: DWORD): BOOL {
    return Dbghelp.Load('SymSrvGetFileIndexString')(hProcess, SrvPath, File, Index_out, Size, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symsrvgetfileindexstringw
  public static SymSrvGetFileIndexStringW(hProcess: HANDLE, SrvPath: OPTIONAL<LPCWSTR>, File: LPCWSTR, Index_out: LPWSTR, Size: SIZE_T, Flags: DWORD): BOOL {
    return Dbghelp.Load('SymSrvGetFileIndexStringW')(hProcess, SrvPath, File, Index_out, Size, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symsrvgetfileindexes
  public static SymSrvGetFileIndexes(File: LPCSTR, Id_out: PVOID, Val1_out: PDWORD, Val2_out: OPTIONAL<PDWORD>, Flags: DWORD): BOOL {
    return Dbghelp.Load('SymSrvGetFileIndexes')(File, Id_out, Val1_out, Val2_out, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symsrvgetfileindexesw
  public static SymSrvGetFileIndexesW(File: LPCWSTR, Id_out: PVOID, Val1_out: PDWORD, Val2_out: OPTIONAL<PDWORD>, Flags: DWORD): BOOL {
    return Dbghelp.Load('SymSrvGetFileIndexesW')(File, Id_out, Val1_out, Val2_out, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symsrvgetsupplement
  public static SymSrvGetSupplement(hProcess: HANDLE, SymPath: OPTIONAL<LPCSTR>, Node: LPCSTR, File: LPCSTR): LPCSTR {
    return Dbghelp.Load('SymSrvGetSupplement')(hProcess, SymPath, Node, File);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symsrvgetsupplementw
  public static SymSrvGetSupplementW(hProcess: HANDLE, SymPath: OPTIONAL<LPCWSTR>, Node: LPCWSTR, File: LPCWSTR): LPCWSTR {
    return Dbghelp.Load('SymSrvGetSupplementW')(hProcess, SymPath, Node, File);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symsrvisstore
  public static SymSrvIsStore(hProcess: OPTIONAL<HANDLE>, path: LPCSTR): BOOL {
    return Dbghelp.Load('SymSrvIsStore')(hProcess, path);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symsrvisstoresw
  public static SymSrvIsStoreW(hProcess: OPTIONAL<HANDLE>, path: LPCWSTR): BOOL {
    return Dbghelp.Load('SymSrvIsStoreW')(hProcess, path);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symsrvstorefile
  public static SymSrvStoreFile(hProcess: HANDLE, SrvPath: OPTIONAL<LPCSTR>, File: LPCSTR, Flags: DWORD): LPCSTR {
    return Dbghelp.Load('SymSrvStoreFile')(hProcess, SrvPath, File, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symsrvstorefilew
  public static SymSrvStoreFileW(hProcess: HANDLE, SrvPath: OPTIONAL<LPCWSTR>, File: LPCWSTR, Flags: DWORD): LPCWSTR {
    return Dbghelp.Load('SymSrvStoreFileW')(hProcess, SrvPath, File, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symsrvstoresupplement
  public static SymSrvStoreSupplement(hProcess: HANDLE, SrvPath: OPTIONAL<LPCSTR>, Node: LPCSTR, File: LPCSTR, Flags: DWORD): LPCSTR {
    return Dbghelp.Load('SymSrvStoreSupplement')(hProcess, SrvPath, Node, File, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symsrvstoresupplementw
  public static SymSrvStoreSupplementW(hProcess: HANDLE, SymPath: OPTIONAL<LPCWSTR>, Node: LPCWSTR, File: LPCWSTR, Flags: DWORD): LPCWSTR {
    return Dbghelp.Load('SymSrvStoreSupplementW')(hProcess, SymPath, Node, File, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symundname64
  public static SymUnDName64(sym: PIMAGEHLP_SYMBOL64, UnDecName_out: LPSTR, UnDecNameLength: DWORD): BOOL {
    return Dbghelp.Load('SymUnDName64')(sym, UnDecName_out, UnDecNameLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-symunloadmodule64
  public static SymUnloadModule64(hProcess: HANDLE, BaseOfDll: DWORD64): BOOL {
    return Dbghelp.Load('SymUnloadModule64')(hProcess, BaseOfDll);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-undecoratesymbolname
  public static UnDecorateSymbolName(name: LPCSTR, outputString_out: LPSTR, maxStringLength: DWORD, flags: DWORD): DWORD {
    return Dbghelp.Load('UnDecorateSymbolName')(name, outputString_out, maxStringLength, flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dbghelp/nf-dbghelp-undecoratesymbolnamew
  public static UnDecorateSymbolNameW(name: LPCWSTR, outputString_out: LPWSTR, maxStringLength: DWORD, flags: DWORD): DWORD {
    return Dbghelp.Load('UnDecorateSymbolNameW')(name, outputString_out, maxStringLength, flags);
  }
}

export default Dbghelp;
