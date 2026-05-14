/**
 * Shader Doctor
 *
 * Comprehensive HLSL shader analysis dashboard. Takes a vertex shader,
 * preprocesses it, compiles it with -O3, disassembles it, extracts every
 * available DXBC blob part, parses the DXBC chunk layout from the raw bytes,
 * walks the input / output signature records, and measures how much each
 * `D3DStripShader` flag shaves off the final bytecode. Every section is
 * formatted with aligned labels and ANSI colouring.
 *
 * APIs demonstrated:
 *   - D3DPreprocess              (HLSL → expanded HLSL source text)
 *   - D3DCompile                 (HLSL → DXBC bytecode)
 *   - D3DDisassemble             (DXBC → human-readable assembly)
 *   - D3DGetBlobPart             (extract individual DXBC sections)
 *   - D3DGetInputSignatureBlob   (vertex input layout descriptor)
 *   - D3DGetOutputSignatureBlob  (rasterizer output layout descriptor)
 *   - D3DStripShader             (size delta per strip flag)
 *   - D3DCreateBlob              (round-trip sanity check)
 *   - ID3DBlob vtable            (GetBufferPointer, GetBufferSize, Release)
 *
 * Run: bun run example/shader-doctor.ts
 */

import D3dcompiler_47, { D3DCOMPILE_ENABLE_STRICTNESS, D3DCOMPILE_OPTIMIZATION_LEVEL3, D3DCOMPILER_STRIP_FLAGS, D3D_BLOB_PART, D3D_DISASM_ENABLE_INSTRUCTION_NUMBERING } from '..';
import { CFunction, FFIType, read, toArrayBuffer, type Pointer } from 'bun:ffi';

D3dcompiler_47.Preload(['D3DCompile', 'D3DCreateBlob', 'D3DDisassemble', 'D3DGetBlobPart', 'D3DGetInputSignatureBlob', 'D3DGetOutputSignatureBlob', 'D3DPreprocess', 'D3DStripShader']);

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const RED = '\x1b[91m';
const GREEN = '\x1b[92m';
const YELLOW = '\x1b[93m';
const BLUE = '\x1b[94m';
const MAGENTA = '\x1b[95m';
const CYAN = '\x1b[96m';
const WHITE = '\x1b[97m';
const GREY = '\x1b[90m';

const SOURCE = `\
#define DIFFUSE_BIAS 0.25
#define FRESNEL_POW  3.0

cbuffer Globals : register(b0) {
  float4x4 viewProjection;
  float4   lightDirection;
  float4   tint;
};

struct VS_IN {
  float3 position : POSITION;
  float3 normal   : NORMAL;
  float2 uv       : TEXCOORD0;
};

struct VS_OUT {
  float4 svPosition  : SV_Position;
  float3 worldNormal : NORMAL;
  float2 uv          : TEXCOORD0;
  float  fresnel     : TEXCOORD1;
};

VS_OUT main(VS_IN input) {
  VS_OUT output;
  output.svPosition  = mul(float4(input.position, 1.0), viewProjection);
  output.worldNormal = normalize(input.normal);
  output.uv          = input.uv;
  float ndotl        = saturate(dot(output.worldNormal, lightDirection.xyz));
  output.fresnel     = pow(1.0 - ndotl, FRESNEL_POW) + DIFFUSE_BIAS;
  return output;
}
`;

interface BlobHandle {
  readonly handle: bigint;
  readonly addr: bigint;
  readonly size: number;
}

function compile(source: string, entry: string, target: string): { blob: BlobHandle; errors: string | null; compileMs: number } {
  const sourceBuf = Buffer.from(source + '\0', 'utf8');
  const entryBuf = Buffer.from(entry + '\0', 'utf8');
  const targetBuf = Buffer.from(target + '\0', 'utf8');
  const sourceName = Buffer.from('shader-doctor.hlsl\0', 'utf8');
  const ppCode = Buffer.alloc(8);
  const ppErr = Buffer.alloc(8);

  const t0 = performance.now();
  const hr = D3dcompiler_47.D3DCompile(sourceBuf.ptr!, BigInt(sourceBuf.byteLength - 1), sourceName.ptr!, null, null, entryBuf.ptr!, targetBuf.ptr!, D3DCOMPILE_ENABLE_STRICTNESS | D3DCOMPILE_OPTIMIZATION_LEVEL3, 0, ppCode.ptr!, ppErr.ptr!);
  const compileMs = performance.now() - t0;

  const errHandle = ppErr.readBigUInt64LE(0);
  const errText = errHandle !== 0n ? readBlobText(errHandle) : null;
  releaseBlob(errHandle);

  if (hr !== 0) throw new Error(`D3DCompile failed (HR=0x${(hr >>> 0).toString(16)}): ${errText ?? '(no error blob)'}`);

  const blob = wrapBlob(ppCode.readBigUInt64LE(0));
  return { blob, errors: errText, compileMs };
}

function preprocess(source: string): { text: string; errors: string | null } {
  const sourceBuf = Buffer.from(source + '\0', 'utf8');
  const sourceName = Buffer.from('shader-doctor.hlsl\0', 'utf8');
  const ppCodeText = Buffer.alloc(8);
  const ppErr = Buffer.alloc(8);

  const hr = D3dcompiler_47.D3DPreprocess(sourceBuf.ptr!, BigInt(sourceBuf.byteLength - 1), sourceName.ptr!, null, null, ppCodeText.ptr!, ppErr.ptr!);
  if (hr !== 0) {
    const errHandle = ppErr.readBigUInt64LE(0);
    const errText = errHandle !== 0n ? readBlobText(errHandle) : '(no error blob)';
    releaseBlob(errHandle);
    throw new Error(`D3DPreprocess failed (HR=0x${(hr >>> 0).toString(16)}): ${errText}`);
  }
  const codeHandle = ppCodeText.readBigUInt64LE(0);
  const text = readBlobText(codeHandle);
  releaseBlob(codeHandle);
  const errHandle = ppErr.readBigUInt64LE(0);
  const errors = errHandle !== 0n ? readBlobText(errHandle) : null;
  releaseBlob(errHandle);
  return { text, errors };
}

function disassemble(blob: BlobHandle): string {
  const ppDis = Buffer.alloc(8);
  const hr = D3dcompiler_47.D3DDisassemble(Number(blob.addr) as Pointer, BigInt(blob.size), D3D_DISASM_ENABLE_INSTRUCTION_NUMBERING, null, ppDis.ptr!);
  if (hr !== 0) throw new Error(`D3DDisassemble failed (HR=0x${(hr >>> 0).toString(16)})`);
  const disHandle = ppDis.readBigUInt64LE(0);
  const text = readBlobText(disHandle);
  releaseBlob(disHandle);
  return text;
}

function getBlobPart(blob: BlobHandle, part: D3D_BLOB_PART): BlobHandle | null {
  const ppPart = Buffer.alloc(8);
  const hr = D3dcompiler_47.D3DGetBlobPart(Number(blob.addr) as Pointer, BigInt(blob.size), part, 0, ppPart.ptr!);
  if (hr !== 0) return null;
  return wrapBlob(ppPart.readBigUInt64LE(0));
}

function getInputSignatureBlob(blob: BlobHandle): BlobHandle | null {
  const ppSig = Buffer.alloc(8);
  const hr = D3dcompiler_47.D3DGetInputSignatureBlob(Number(blob.addr) as Pointer, BigInt(blob.size), ppSig.ptr!);
  if (hr !== 0) return null;
  return wrapBlob(ppSig.readBigUInt64LE(0));
}

function getOutputSignatureBlob(blob: BlobHandle): BlobHandle | null {
  const ppSig = Buffer.alloc(8);
  const hr = D3dcompiler_47.D3DGetOutputSignatureBlob(Number(blob.addr) as Pointer, BigInt(blob.size), ppSig.ptr!);
  if (hr !== 0) return null;
  return wrapBlob(ppSig.readBigUInt64LE(0));
}

function stripShader(blob: BlobHandle, flags: number): BlobHandle | null {
  const ppStripped = Buffer.alloc(8);
  const hr = D3dcompiler_47.D3DStripShader(Number(blob.addr) as Pointer, BigInt(blob.size), flags, ppStripped.ptr!);
  if (hr !== 0) return null;
  return wrapBlob(ppStripped.readBigUInt64LE(0));
}

function createBlob(size: number): BlobHandle {
  const ppBlob = Buffer.alloc(8);
  const hr = D3dcompiler_47.D3DCreateBlob(BigInt(size), ppBlob.ptr!);
  if (hr !== 0) throw new Error(`D3DCreateBlob failed (HR=0x${(hr >>> 0).toString(16)})`);
  return wrapBlob(ppBlob.readBigUInt64LE(0));
}

function wrapBlob(handle: bigint): BlobHandle {
  if (handle === 0n) return { handle, addr: 0n, size: 0 };
  const addr = callVtable(handle, 24, FFIType.u64) as bigint;
  const size = Number(callVtable(handle, 32, FFIType.u64) as bigint);
  return { handle, addr, size };
}

function releaseBlob(handle: bigint): void {
  if (handle === 0n) return;
  callVtable(handle, 16, FFIType.u32);
}

function callVtable(thisPtr: bigint, slotOffset: number, returns: typeof FFIType.u32 | typeof FFIType.u64): number | bigint {
  const vtable = read.u64(Number(thisPtr) as Pointer, 0);
  const fnAddr = read.u64(Number(vtable) as Pointer, slotOffset);
  return CFunction({ ptr: Number(fnAddr) as Pointer, args: [FFIType.u64], returns })(thisPtr) as number | bigint;
}

function readBlobText(handle: bigint): string {
  if (handle === 0n) return '';
  const addr = callVtable(handle, 24, FFIType.u64) as bigint;
  const size = Number(callVtable(handle, 32, FFIType.u64) as bigint);
  const bytes = new Uint8Array(toArrayBuffer(Number(addr) as Pointer, 0, size));
  let end = bytes.byteLength;
  while (end > 0 && bytes[end - 1] === 0) end--;
  return new TextDecoder('utf-8').decode(bytes.subarray(0, end));
}

function readBlobBytes(handle: bigint): Uint8Array {
  if (handle === 0n) return new Uint8Array(0);
  const addr = callVtable(handle, 24, FFIType.u64) as bigint;
  const size = Number(callVtable(handle, 32, FFIType.u64) as bigint);
  return new Uint8Array(toArrayBuffer(Number(addr) as Pointer, 0, size)).slice();
}

interface DxbcChunk {
  readonly fourcc: string;
  readonly offset: number;
  readonly size: number;
  readonly description: string;
}

const CHUNK_DESCRIPTIONS: Record<string, string> = {
  RDEF: 'Resource definitions (cbuffers, samplers, textures)',
  ISGN: 'Input signature (vertex attributes / pixel inputs)',
  ISG1: 'Input signature v1 (with min-precision)',
  OSGN: 'Output signature (SV_Position, SV_Target, etc.)',
  OSG1: 'Output signature v1 (with stream / min-precision)',
  OSG5: 'Output signature v5 (geometry shader streams)',
  PCSG: 'Patch constant signature',
  SHEX: 'Shader code (DXBC instructions)',
  SHDR: 'Shader code (legacy SM 4.0 / 4.1)',
  STAT: 'Statistics (instruction counts, register usage)',
  SDBG: 'Debug info (PDB-like, sources, function map)',
  SFI0: 'Shader feature flags',
  AON9: 'Shader Model 4.0 Level 9 bytecode',
  XNAS: 'XNA shader bytecode',
  XNAP: 'XNA prepass bytecode',
  PRIV: 'Private data appended by tooling',
  RTS0: 'Root signature',
  DXIL: 'DXIL bitcode (for DXC outputs — unused by FXC)',
};

function parseDxbcChunks(bytes: Uint8Array): { hash: string; version: number; totalSize: number; chunks: DxbcChunk[] } {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(0, false) !== 0x44584243) throw new Error('Not a DXBC container'); // 'DXBC' big-endian
  const hash = Array.from(bytes.subarray(4, 20))
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('');
  const version = view.getUint32(20, true);
  const totalSize = view.getUint32(24, true);
  const chunkCount = view.getUint32(28, true);
  const chunks: DxbcChunk[] = [];
  for (let chunkIndex = 0; chunkIndex < chunkCount; chunkIndex++) {
    const chunkOffset = view.getUint32(32 + chunkIndex * 4, true);
    const fourcc = String.fromCharCode(bytes[chunkOffset]!, bytes[chunkOffset + 1]!, bytes[chunkOffset + 2]!, bytes[chunkOffset + 3]!);
    const chunkSize = view.getUint32(chunkOffset + 4, true);
    chunks.push({ fourcc, offset: chunkOffset, size: chunkSize, description: CHUNK_DESCRIPTIONS[fourcc] ?? '' });
  }
  return { hash, version, totalSize, chunks };
}

interface SignatureRecord {
  readonly semanticName: string;
  readonly semanticIndex: number;
  readonly systemValueType: number;
  readonly componentType: number;
  readonly register: number;
  readonly mask: number;
  readonly readWriteMask: number;
}

function parseSignatureBlob(bytes: Uint8Array): SignatureRecord[] {
  // The blobs returned by D3DGetBlobPart / D3DGetInputSignatureBlob are
  // wrapped DXBC containers with a single ISGN/OSGN/PCSG chunk. Locate the
  // chunk data first so name offsets resolve correctly.
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let dataStart = 0;
  if (view.getUint32(0, false) === 0x44584243) {
    const chunkCount = view.getUint32(28, true);
    for (let chunkIndex = 0; chunkIndex < chunkCount; chunkIndex++) {
      const chunkOffset = view.getUint32(32 + chunkIndex * 4, true);
      const fourcc = String.fromCharCode(bytes[chunkOffset]!, bytes[chunkOffset + 1]!, bytes[chunkOffset + 2]!, bytes[chunkOffset + 3]!);
      if (['ISGN', 'ISG1', 'OSGN', 'OSG1', 'OSG5', 'PCSG'].includes(fourcc)) {
        dataStart = chunkOffset + 8; // skip FourCC (4) + chunk size DWORD (4)
        break;
      }
    }
  }

  const elementCount = view.getUint32(dataStart + 0, true);
  // Name offsets are relative to the start of the chunk's data section, not the DXBC container.
  const records: SignatureRecord[] = [];
  for (let elementIndex = 0; elementIndex < elementCount; elementIndex++) {
    const recordBase = dataStart + 8 + elementIndex * 24;
    const relativeNameOffset = view.getUint32(recordBase + 0, true);
    const semanticIndex = view.getUint32(recordBase + 4, true);
    const systemValueType = view.getUint32(recordBase + 8, true);
    const componentType = view.getUint32(recordBase + 12, true);
    const register = view.getUint32(recordBase + 16, true);
    const maskByte = view.getUint8(recordBase + 20);
    const readWriteMaskByte = view.getUint8(recordBase + 21);
    const nameStart = dataStart + relativeNameOffset;
    let nameEnd = nameStart;
    while (nameEnd < bytes.length && bytes[nameEnd] !== 0) nameEnd++;
    const semanticName = new TextDecoder('utf-8').decode(bytes.subarray(nameStart, nameEnd));
    records.push({
      semanticName,
      semanticIndex,
      systemValueType,
      componentType,
      register,
      mask: maskByte,
      readWriteMask: readWriteMaskByte,
    });
  }
  return records;
}

const COMPONENT_TYPE_NAMES = ['unknown', 'uint', 'int', 'float'];
const SYSTEM_VALUE_NAMES: Record<number, string> = {
  0: '',
  1: 'POSITION',
  2: 'CLIP_DISTANCE',
  3: 'CULL_DISTANCE',
  4: 'RENDER_TARGET_ARRAY_INDEX',
  5: 'VIEWPORT_ARRAY_INDEX',
  6: 'VERTEX_ID',
  7: 'PRIMITIVE_ID',
  8: 'INSTANCE_ID',
  9: 'IS_FRONT_FACE',
  10: 'SAMPLE_INDEX',
  64: 'TARGET',
  65: 'DEPTH',
  66: 'COVERAGE',
  67: 'DEPTH_GREATER_EQUAL',
  68: 'DEPTH_LESS_EQUAL',
};

function maskToString(mask: number): string {
  if (mask === 0) return '----';
  const components = ['x', 'y', 'z', 'w'];
  let out = '';
  for (let bit = 0; bit < 4; bit++) out += mask & (1 << bit) ? components[bit] : '-';
  return out;
}

function highlightAsmLine(line: string): string {
  if (/^\s*\/\//.test(line)) return GREY + line + RESET;
  return line.replace(
    /(\bdcl_\w+\b)|(\b(?:ret|discard|loop|endloop|if_\w+|else|endif)\b)|(\b(?:mov|mul|mad|add|sub|div|exp|log|sqrt|rsq|sincos|sample\w*|store_\w+|load_\w+|dp\d|max|min|rcp|round_\w+|frc|abs|ftoi|ftou|itof|utof|cmp|ge|lt|eq|ne|deriv_\w+|or|and|xor)\b)|(\bv\d+(?:\.[xyzw]+)?\b)|(\br\d+(?:\.[xyzw]+)?\b)|(\bo\d+(?:\.[xyzw]+)?\b)|(\bcb\d+(?:\[\d+\])?(?:\.[xyzw]+)?\b)|(-?\b\d+\.\d+\b|-?\b\d+\b)/g,
    (match, dcl, ctrl, alu, vreg, rreg, oreg, cbreg, num) => {
      if (dcl) return YELLOW + match + RESET;
      if (ctrl) return MAGENTA + match + RESET;
      if (alu) return CYAN + match + RESET;
      if (vreg) return GREEN + match + RESET;
      if (rreg) return BLUE + match + RESET;
      if (oreg) return YELLOW + match + RESET;
      if (cbreg) return MAGENTA + match + RESET;
      if (num) return WHITE + match + RESET;
      return match;
    },
  );
}

function section(title: string): void {
  console.log();
  console.log(`${BOLD}${CYAN}━━ ${title} ${'━'.repeat(Math.max(0, 76 - title.length))}${RESET}`);
}

function row(label: string, value: string): void {
  console.log(`  ${DIM}${label.padEnd(24)}${RESET}  ${value}`);
}

function humanBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KiB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MiB`;
}

console.log();
console.log(`${BOLD}${MAGENTA}┌${'─'.repeat(78)}┐${RESET}`);
console.log(`${BOLD}${MAGENTA}│${RESET}  ${BOLD}SHADER DOCTOR${RESET}${' '.repeat(64)}${MAGENTA}│${RESET}`);
console.log(`${BOLD}${MAGENTA}│${RESET}  ${DIM}A full diagnostic for an HLSL vertex shader.${' '.repeat(34)}${MAGENTA}│${RESET}`);
console.log(`${BOLD}${MAGENTA}└${'─'.repeat(78)}┘${RESET}`);

section('Source');
const sourceLines = SOURCE.replace(/\n$/, '').split('\n');
for (let lineIndex = 0; lineIndex < sourceLines.length; lineIndex++) {
  const number = String(lineIndex + 1).padStart(2, ' ');
  console.log(`  ${GREY}${number}│${RESET} ${sourceLines[lineIndex]}`);
}
row('Source bytes', `${SOURCE.length}`);
row('Source lines', `${sourceLines.length}`);

section('Compilation');
const compileResult = compile(SOURCE, 'main', 'vs_5_0');
row('Target', `${GREEN}vs_5_0${RESET}     ${DIM}entry=${RESET}${GREEN}main${RESET}`);
row('Flags', `${YELLOW}-O3${RESET} ${YELLOW}+strictness${RESET}`);
row('Result', `${GREEN}S_OK${RESET}`);
row('Compile time', `${YELLOW}${compileResult.compileMs.toFixed(2)} ms${RESET}`);
row('Bytecode size', `${YELLOW}${humanBytes(compileResult.blob.size)}${RESET}  (${compileResult.blob.size} B)`);
if (compileResult.errors) console.log(`  ${DIM}Compiler warnings:${RESET}\n${RED}${compileResult.errors}${RESET}`);

section('Preprocessor output');
const preprocessed = preprocess(SOURCE);
const preprocessedLines = preprocessed.text.replace(/\r/g, '').split('\n').slice(0, 12);
for (const line of preprocessedLines) console.log(`  ${GREY}│${RESET} ${line}`);
const remaining = preprocessed.text.split('\n').length - preprocessedLines.length;
if (remaining > 0) console.log(`  ${DIM}… ${remaining} more lines${RESET}`);
row('Expanded size', `${preprocessed.text.length} chars`);
row('Macro expansions', `${(preprocessed.text.match(/0\.25|3\.0/g) ?? []).length} (DIFFUSE_BIAS, FRESNEL_POW resolved)`);

section('DXBC container');
const bytecode = readBlobBytes(compileResult.blob.handle);
const container = parseDxbcChunks(bytecode);
row('Container version', `${container.version}`);
row('Total size (header)', `${container.totalSize} B`);
row('Hash (MD5-style)', `${WHITE}${container.hash}${RESET}`);
row('Chunk count', `${container.chunks.length}`);
console.log();
console.log(`  ${DIM}FourCC  Size      Offset    Description${RESET}`);
for (const chunk of container.chunks) {
  const fourcc = CYAN + chunk.fourcc + RESET;
  const size = chunk.size.toString().padStart(8);
  const offset = '0x' + chunk.offset.toString(16).padStart(6, '0');
  console.log(`  ${fourcc}    ${size}  ${offset}  ${DIM}${chunk.description}${RESET}`);
}

section('Blob parts via D3DGetBlobPart');
const parts: { part: D3D_BLOB_PART; label: string; blob: BlobHandle | null }[] = [
  { part: D3D_BLOB_PART.D3D_BLOB_INPUT_SIGNATURE_BLOB, label: 'Input signature', blob: getBlobPart(compileResult.blob, D3D_BLOB_PART.D3D_BLOB_INPUT_SIGNATURE_BLOB) },
  { part: D3D_BLOB_PART.D3D_BLOB_OUTPUT_SIGNATURE_BLOB, label: 'Output signature', blob: getBlobPart(compileResult.blob, D3D_BLOB_PART.D3D_BLOB_OUTPUT_SIGNATURE_BLOB) },
  { part: D3D_BLOB_PART.D3D_BLOB_INPUT_AND_OUTPUT_SIGNATURE_BLOB, label: 'Input+Output sig', blob: getBlobPart(compileResult.blob, D3D_BLOB_PART.D3D_BLOB_INPUT_AND_OUTPUT_SIGNATURE_BLOB) },
  { part: D3D_BLOB_PART.D3D_BLOB_ALL_SIGNATURE_BLOB, label: 'All signatures', blob: getBlobPart(compileResult.blob, D3D_BLOB_PART.D3D_BLOB_ALL_SIGNATURE_BLOB) },
  { part: D3D_BLOB_PART.D3D_BLOB_DEBUG_INFO, label: 'Debug info', blob: getBlobPart(compileResult.blob, D3D_BLOB_PART.D3D_BLOB_DEBUG_INFO) },
  { part: D3D_BLOB_PART.D3D_BLOB_LEGACY_SHADER, label: 'Legacy shader', blob: getBlobPart(compileResult.blob, D3D_BLOB_PART.D3D_BLOB_LEGACY_SHADER) },
  { part: D3D_BLOB_PART.D3D_BLOB_PDB, label: 'PDB', blob: getBlobPart(compileResult.blob, D3D_BLOB_PART.D3D_BLOB_PDB) },
  { part: D3D_BLOB_PART.D3D_BLOB_PRIVATE_DATA, label: 'Private data', blob: getBlobPart(compileResult.blob, D3D_BLOB_PART.D3D_BLOB_PRIVATE_DATA) },
];
for (const { label, blob } of parts) {
  if (blob && blob.handle !== 0n) {
    row(label, `${GREEN}${humanBytes(blob.size)}${RESET}`);
  } else {
    row(label, `${DIM}(not present)${RESET}`);
  }
}

section('Input signature records');
const inputSig = getInputSignatureBlob(compileResult.blob);
if (inputSig && inputSig.handle !== 0n) {
  const sigBytes = readBlobBytes(inputSig.handle);
  const records = parseSignatureBlob(sigBytes);
  console.log(`  ${DIM}Semantic            Idx  Reg  Mask  Type    SysValue${RESET}`);
  for (const record of records) {
    const name = (GREEN + record.semanticName + RESET).padEnd(20 + GREEN.length + RESET.length);
    const idx = String(record.semanticIndex).padStart(3);
    const reg = String(record.register).padStart(3);
    const mask = maskToString(record.mask).padEnd(4);
    const type = (COMPONENT_TYPE_NAMES[record.componentType] ?? '?').padEnd(7);
    const sv = SYSTEM_VALUE_NAMES[record.systemValueType] ?? `?${record.systemValueType}`;
    console.log(`  ${name} ${idx}  ${reg}  ${mask}  ${YELLOW}${type}${RESET} ${BLUE}${sv}${RESET}`);
  }
}

section('Output signature records');
const outputSig = getOutputSignatureBlob(compileResult.blob);
if (outputSig && outputSig.handle !== 0n) {
  const sigBytes = readBlobBytes(outputSig.handle);
  const records = parseSignatureBlob(sigBytes);
  console.log(`  ${DIM}Semantic            Idx  Reg  Mask  Type    SysValue${RESET}`);
  for (const record of records) {
    const name = (GREEN + record.semanticName + RESET).padEnd(20 + GREEN.length + RESET.length);
    const idx = String(record.semanticIndex).padStart(3);
    const reg = String(record.register).padStart(3);
    const mask = maskToString(record.mask).padEnd(4);
    const type = (COMPONENT_TYPE_NAMES[record.componentType] ?? '?').padEnd(7);
    const sv = SYSTEM_VALUE_NAMES[record.systemValueType] ?? `?${record.systemValueType}`;
    console.log(`  ${name} ${idx}  ${reg}  ${mask}  ${YELLOW}${type}${RESET} ${BLUE}${sv}${RESET}`);
  }
}

section('Strip analysis');
const stripCases: { flags: number; label: string }[] = [
  { flags: D3DCOMPILER_STRIP_FLAGS.D3DCOMPILER_STRIP_REFLECTION_DATA, label: 'Reflection only' },
  { flags: D3DCOMPILER_STRIP_FLAGS.D3DCOMPILER_STRIP_DEBUG_INFO, label: 'Debug info only' },
  { flags: D3DCOMPILER_STRIP_FLAGS.D3DCOMPILER_STRIP_TEST_BLOBS, label: 'Test blobs only' },
  { flags: D3DCOMPILER_STRIP_FLAGS.D3DCOMPILER_STRIP_PRIVATE_DATA, label: 'Private data only' },
  {
    flags: D3DCOMPILER_STRIP_FLAGS.D3DCOMPILER_STRIP_REFLECTION_DATA | D3DCOMPILER_STRIP_FLAGS.D3DCOMPILER_STRIP_DEBUG_INFO | D3DCOMPILER_STRIP_FLAGS.D3DCOMPILER_STRIP_TEST_BLOBS | D3DCOMPILER_STRIP_FLAGS.D3DCOMPILER_STRIP_PRIVATE_DATA,
    label: 'Strip everything',
  },
];
row('Full bytecode', `${YELLOW}${humanBytes(compileResult.blob.size)}${RESET}`);
for (const { flags, label } of stripCases) {
  const stripped = stripShader(compileResult.blob, flags);
  if (!stripped || stripped.handle === 0n) {
    row(label, `${RED}strip failed${RESET}`);
    continue;
  }
  const delta = compileResult.blob.size - stripped.size;
  const deltaText = delta > 0 ? `${GREEN}-${humanBytes(delta)}${RESET}` : `${DIM}no change${RESET}`;
  row(label, `${humanBytes(stripped.size)}  (${deltaText})`);
  releaseBlob(stripped.handle);
}

section('D3DCreateBlob round-trip');
const empty = createBlob(64);
row('Created blob', `${humanBytes(empty.size)} at 0x${empty.addr.toString(16)}`);
row('Refcount delta', `${GREEN}1 → 0 (released)${RESET}`);
releaseBlob(empty.handle);

section('Disassembly');
const asm = disassemble(compileResult.blob);
for (const line of asm.replace(/\r/g, '').split('\n')) {
  if (line.length === 0) continue;
  console.log(`  ${highlightAsmLine(line)}`);
}

// Tear down every blob we still hold.
for (const { blob } of parts) if (blob && blob.handle !== 0n) releaseBlob(blob.handle);
if (inputSig) releaseBlob(inputSig.handle);
if (outputSig) releaseBlob(outputSig.handle);
releaseBlob(compileResult.blob.handle);

console.log();
console.log(`${BOLD}${GREEN}✓ Diagnostic complete.${RESET} ${DIM}All blobs released.${RESET}`);
