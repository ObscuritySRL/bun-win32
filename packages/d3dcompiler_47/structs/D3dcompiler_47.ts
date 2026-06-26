import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type {
  BOOL,
  D3D_BLOB_PART,
  HRESULT,
  ID3D10Effect,
  ID3DBlob,
  ID3DInclude,
  LPCSTR,
  LPCVOID,
  LPCWSTR,
  Optional,
  PD3D_SHADER_DATA,
  PD3D_SHADER_MACRO,
  PID3D11FunctionLinkingGraph,
  PID3D11Linker,
  PID3D11Module,
  PID3DBlob,
  PSIZE_T,
  PUINT,
  REFIID,
  SIZE_T,
  UINT,
} from '../types/D3dcompiler_47';

/**
 * Thin, lazy-loaded FFI bindings for `d3dcompiler_47.dll`.
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
 * import D3dcompiler_47, { D3DCOMPILE_DEBUG } from './structs/D3dcompiler_47';
 *
 * // Lazy: bind on first call
 * const ppCode = Buffer.alloc(8);
 * const ppErrorMsgs = Buffer.alloc(8);
 * const source = Buffer.from('float4 main() : SV_Target { return 1; }\0', 'utf8');
 * const target = Buffer.from('ps_5_0\0', 'utf8');
 * const hr = D3dcompiler_47.D3DCompile(source.ptr, BigInt(source.byteLength - 1), null, null, null, null, target.ptr, D3DCOMPILE_DEBUG, 0, ppCode.ptr, ppErrorMsgs.ptr);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * D3dcompiler_47.Preload(['D3DCompile', 'D3DReflect', 'D3DDisassemble']);
 * ```
 */
class D3dcompiler_47 extends Win32 {
  protected static override name = 'd3dcompiler_47.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    D3DCompile: { args: [FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    D3DCompile2: { args: [FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    D3DCompileFromFile: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    D3DCompressShaders: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    D3DCreateBlob: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    D3DCreateFunctionLinkingGraph: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    D3DCreateLinker: { args: [FFIType.ptr], returns: FFIType.i32 },
    D3DDecompressShaders: { args: [FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    D3DDisassemble: { args: [FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    D3DDisassemble10Effect: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    D3DDisassembleRegion: { args: [FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    D3DGetBlobPart: { args: [FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    D3DGetDebugInfo: { args: [FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    D3DGetInputAndOutputSignatureBlob: { args: [FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    D3DGetInputSignatureBlob: { args: [FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    D3DGetOutputSignatureBlob: { args: [FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    D3DGetTraceInstructionOffsets: { args: [FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    D3DLoadModule: { args: [FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    D3DPreprocess: { args: [FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    D3DReadFileToBlob: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    D3DReflect: { args: [FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    D3DReflectLibrary: { args: [FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    D3DSetBlobPart: { args: [FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    D3DStripShader: { args: [FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    D3DWriteBlobToFile: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/d3dcompiler/nf-d3dcompiler-d3dcompile
  public static D3DCompile(
    pSrcData: LPCVOID,
    SrcDataSize: SIZE_T,
    pSourceName: Optional<LPCSTR>,
    pDefines: Optional<PD3D_SHADER_MACRO>,
    pInclude: Optional<ID3DInclude>,
    pEntrypoint: Optional<LPCSTR>,
    pTarget: LPCSTR,
    Flags1: UINT,
    Flags2: UINT,
    ppCode_out: PID3DBlob,
    ppErrorMsgs_out: Optional<PID3DBlob>,
  ): HRESULT {
    return D3dcompiler_47.Load('D3DCompile')(pSrcData, SrcDataSize, pSourceName, pDefines, pInclude, pEntrypoint, pTarget, Flags1, Flags2, ppCode_out, ppErrorMsgs_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/d3dcompiler/nf-d3dcompiler-d3dcompile2
  public static D3DCompile2(
    pSrcData: LPCVOID,
    SrcDataSize: SIZE_T,
    pSourceName: Optional<LPCSTR>,
    pDefines: Optional<PD3D_SHADER_MACRO>,
    pInclude: Optional<ID3DInclude>,
    pEntrypoint: LPCSTR,
    pTarget: LPCSTR,
    Flags1: UINT,
    Flags2: UINT,
    SecondaryDataFlags: UINT,
    pSecondaryData: Optional<LPCVOID>,
    SecondaryDataSize: SIZE_T,
    ppCode_out: PID3DBlob,
    ppErrorMsgs_out: Optional<PID3DBlob>,
  ): HRESULT {
    return D3dcompiler_47.Load('D3DCompile2')(pSrcData, SrcDataSize, pSourceName, pDefines, pInclude, pEntrypoint, pTarget, Flags1, Flags2, SecondaryDataFlags, pSecondaryData, SecondaryDataSize, ppCode_out, ppErrorMsgs_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/d3dcompiler/nf-d3dcompiler-d3dcompilefromfile
  public static D3DCompileFromFile(
    pFileName: LPCWSTR,
    pDefines: Optional<PD3D_SHADER_MACRO>,
    pInclude: Optional<ID3DInclude>,
    pEntrypoint: LPCSTR,
    pTarget: LPCSTR,
    Flags1: UINT,
    Flags2: UINT,
    ppCode_out: PID3DBlob,
    ppErrorMsgs_out: Optional<PID3DBlob>,
  ): HRESULT {
    return D3dcompiler_47.Load('D3DCompileFromFile')(pFileName, pDefines, pInclude, pEntrypoint, pTarget, Flags1, Flags2, ppCode_out, ppErrorMsgs_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/d3dcompiler/nf-d3dcompiler-d3dcompressshaders
  public static D3DCompressShaders(uNumShaders: UINT, pShaderData: PD3D_SHADER_DATA, uFlags: UINT, ppCompressedData_out: PID3DBlob): HRESULT {
    return D3dcompiler_47.Load('D3DCompressShaders')(uNumShaders, pShaderData, uFlags, ppCompressedData_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/d3dcompiler/nf-d3dcompiler-d3dcreateblob
  public static D3DCreateBlob(Size: SIZE_T, ppBlob_out: PID3DBlob): HRESULT {
    return D3dcompiler_47.Load('D3DCreateBlob')(Size, ppBlob_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/d3dcompiler/nf-d3dcompiler-d3dcreatefunctionlinkinggraph
  public static D3DCreateFunctionLinkingGraph(uFlags: UINT, ppFunctionLinkingGraph_out: PID3D11FunctionLinkingGraph): HRESULT {
    return D3dcompiler_47.Load('D3DCreateFunctionLinkingGraph')(uFlags, ppFunctionLinkingGraph_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/d3dcompiler/nf-d3dcompiler-d3dcreatelinker
  public static D3DCreateLinker(ppLinker_out: PID3D11Linker): HRESULT {
    return D3dcompiler_47.Load('D3DCreateLinker')(ppLinker_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/d3dcompiler/nf-d3dcompiler-d3ddecompressshaders
  public static D3DDecompressShaders(pSrcData: LPCVOID, SrcDataSize: SIZE_T, uNumShaders: UINT, uStartIndex: UINT, pIndices: Optional<PUINT>, uFlags: UINT, ppShaders_out: PID3DBlob, pTotalShaders_out: Optional<PUINT>): HRESULT {
    return D3dcompiler_47.Load('D3DDecompressShaders')(pSrcData, SrcDataSize, uNumShaders, uStartIndex, pIndices, uFlags, ppShaders_out, pTotalShaders_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/d3dcompiler/nf-d3dcompiler-d3ddisassemble
  public static D3DDisassemble(pSrcData: LPCVOID, SrcDataSize: SIZE_T, Flags: UINT, szComments: Optional<LPCSTR>, ppDisassembly_out: PID3DBlob): HRESULT {
    return D3dcompiler_47.Load('D3DDisassemble')(pSrcData, SrcDataSize, Flags, szComments, ppDisassembly_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/d3dcompiler/nf-d3dcompiler-d3ddisassemble10effect
  public static D3DDisassemble10Effect(pEffect: ID3D10Effect, Flags: UINT, ppDisassembly_out: PID3DBlob): HRESULT {
    return D3dcompiler_47.Load('D3DDisassemble10Effect')(pEffect, Flags, ppDisassembly_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/d3dcompiler/nf-d3dcompiler-d3ddisassembleregion
  public static D3DDisassembleRegion(
    pSrcData: LPCVOID,
    SrcDataSize: SIZE_T,
    Flags: UINT,
    szComments: Optional<LPCSTR>,
    StartByteOffset: SIZE_T,
    NumInsts: SIZE_T,
    pFinishByteOffset_out: Optional<PSIZE_T>,
    ppDisassembly_out: PID3DBlob,
  ): HRESULT {
    return D3dcompiler_47.Load('D3DDisassembleRegion')(pSrcData, SrcDataSize, Flags, szComments, StartByteOffset, NumInsts, pFinishByteOffset_out, ppDisassembly_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/d3dcompiler/nf-d3dcompiler-d3dgetblobpart
  public static D3DGetBlobPart(pSrcData: LPCVOID, SrcDataSize: SIZE_T, Part: D3D_BLOB_PART, Flags: UINT, ppPart_out: PID3DBlob): HRESULT {
    return D3dcompiler_47.Load('D3DGetBlobPart')(pSrcData, SrcDataSize, Part, Flags, ppPart_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/d3dcompiler/nf-d3dcompiler-d3dgetdebuginfo
  public static D3DGetDebugInfo(pSrcData: LPCVOID, SrcDataSize: SIZE_T, ppDebugInfo_out: PID3DBlob): HRESULT {
    return D3dcompiler_47.Load('D3DGetDebugInfo')(pSrcData, SrcDataSize, ppDebugInfo_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/d3dcompiler/nf-d3dcompiler-d3dgetinputandoutputsignatureblob
  public static D3DGetInputAndOutputSignatureBlob(pSrcData: LPCVOID, SrcDataSize: SIZE_T, ppSignatureBlob_out: PID3DBlob): HRESULT {
    return D3dcompiler_47.Load('D3DGetInputAndOutputSignatureBlob')(pSrcData, SrcDataSize, ppSignatureBlob_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/d3dcompiler/nf-d3dcompiler-d3dgetinputsignatureblob
  public static D3DGetInputSignatureBlob(pSrcData: LPCVOID, SrcDataSize: SIZE_T, ppSignatureBlob_out: PID3DBlob): HRESULT {
    return D3dcompiler_47.Load('D3DGetInputSignatureBlob')(pSrcData, SrcDataSize, ppSignatureBlob_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/d3dcompiler/nf-d3dcompiler-d3dgetoutputsignatureblob
  public static D3DGetOutputSignatureBlob(pSrcData: LPCVOID, SrcDataSize: SIZE_T, ppSignatureBlob_out: PID3DBlob): HRESULT {
    return D3dcompiler_47.Load('D3DGetOutputSignatureBlob')(pSrcData, SrcDataSize, ppSignatureBlob_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/d3dcompiler/nf-d3dcompiler-d3dgettraceinstructionoffsets
  public static D3DGetTraceInstructionOffsets(pSrcData: LPCVOID, SrcDataSize: SIZE_T, Flags: UINT, StartInstIndex: SIZE_T, NumInsts: SIZE_T, pOffsets_out: Optional<PSIZE_T>, pTotalInsts_out: Optional<PSIZE_T>): HRESULT {
    return D3dcompiler_47.Load('D3DGetTraceInstructionOffsets')(pSrcData, SrcDataSize, Flags, StartInstIndex, NumInsts, pOffsets_out, pTotalInsts_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/d3dcompiler/nf-d3dcompiler-d3dloadmodule
  public static D3DLoadModule(pSrcData: LPCVOID, cbSrcDataSize: SIZE_T, ppModule_out: PID3D11Module): HRESULT {
    return D3dcompiler_47.Load('D3DLoadModule')(pSrcData, cbSrcDataSize, ppModule_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/d3dcompiler/nf-d3dcompiler-d3dpreprocess
  public static D3DPreprocess(
    pSrcData: LPCVOID,
    SrcDataSize: SIZE_T,
    pSourceName: Optional<LPCSTR>,
    pDefines: Optional<PD3D_SHADER_MACRO>,
    pInclude: Optional<ID3DInclude>,
    ppCodeText_out: PID3DBlob,
    ppErrorMsgs_out: Optional<PID3DBlob>,
  ): HRESULT {
    return D3dcompiler_47.Load('D3DPreprocess')(pSrcData, SrcDataSize, pSourceName, pDefines, pInclude, ppCodeText_out, ppErrorMsgs_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/d3dcompiler/nf-d3dcompiler-d3dreadfiletoblob
  public static D3DReadFileToBlob(pFileName: LPCWSTR, ppContents_out: PID3DBlob): HRESULT {
    return D3dcompiler_47.Load('D3DReadFileToBlob')(pFileName, ppContents_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/d3dcompiler/nf-d3dcompiler-d3dreflect
  public static D3DReflect(pSrcData: LPCVOID, SrcDataSize: SIZE_T, pInterface: REFIID, ppReflector_out: PID3DBlob): HRESULT {
    return D3dcompiler_47.Load('D3DReflect')(pSrcData, SrcDataSize, pInterface, ppReflector_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/d3dcompiler/nf-d3dcompiler-d3dreflectlibrary
  public static D3DReflectLibrary(pSrcData: LPCVOID, SrcDataSize: SIZE_T, riid: REFIID, ppReflector_out: PID3DBlob): HRESULT {
    return D3dcompiler_47.Load('D3DReflectLibrary')(pSrcData, SrcDataSize, riid, ppReflector_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/d3dcompiler/nf-d3dcompiler-d3dsetblobpart
  public static D3DSetBlobPart(pSrcData: LPCVOID, SrcDataSize: SIZE_T, Part: D3D_BLOB_PART, Flags: UINT, pPart: LPCVOID, PartSize: SIZE_T, ppNewShader_out: PID3DBlob): HRESULT {
    return D3dcompiler_47.Load('D3DSetBlobPart')(pSrcData, SrcDataSize, Part, Flags, pPart, PartSize, ppNewShader_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/d3dcompiler/nf-d3dcompiler-d3dstripshader
  public static D3DStripShader(pShaderBytecode: LPCVOID, BytecodeLength: SIZE_T, uStripFlags: UINT, ppStrippedBlob_out: PID3DBlob): HRESULT {
    return D3dcompiler_47.Load('D3DStripShader')(pShaderBytecode, BytecodeLength, uStripFlags, ppStrippedBlob_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/d3dcompiler/nf-d3dcompiler-d3dwriteblobtofile
  public static D3DWriteBlobToFile(pBlob: ID3DBlob, pFileName: LPCWSTR, bOverwrite: BOOL): HRESULT {
    return D3dcompiler_47.Load('D3DWriteBlobToFile')(pBlob, pFileName, bOverwrite);
  }
}

export default D3dcompiler_47;
