/**
 * HLSL Disco
 *
 * A live HLSL → DXBC compilation showcase. Compiles four colourful HLSL pixel
 * shaders in sequence, then for each one renders an animated split-pane view:
 * the rainbow-gradient source on the left, the syntax-highlighted DXBC
 * disassembly on the right, and a glowing footer with bytecode size, compile
 * time, and DXBC instruction count. Built entirely with ANSI escapes and the
 * COM vtable on `ID3DBlob`.
 *
 * APIs demonstrated:
 *   - D3DCompile        (HLSL → DXBC bytecode)
 *   - D3DDisassemble    (DXBC → human-readable assembly)
 *   - ID3DBlob vtable   (GetBufferPointer, GetBufferSize, Release via CFunction)
 *
 * Run: bun run example/hlsl-disco.ts
 */

import D3dcompiler_47, { D3DCOMPILE_ENABLE_STRICTNESS, D3DCOMPILE_OPTIMIZATION_LEVEL3, D3D_DISASM_ENABLE_INSTRUCTION_NUMBERING } from '..';
import { CFunction, FFIType, read, toArrayBuffer, type Pointer } from 'bun:ffi';

D3dcompiler_47.Preload(['D3DCompile', 'D3DDisassemble']);

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';

const FRAME = '\x1b[38;5;213m';
const TITLE_GRADIENT = [201, 207, 213, 219, 225, 231, 195, 159, 123, 87];
const BYTECODE_GRADIENT = [51, 87, 123, 159, 195, 231, 230, 229, 228, 227, 226];

const shaders: Array<{ name: string; target: string; entry: string; source: string }> = [
  {
    name: 'Solid Red',
    target: 'ps_5_0',
    entry: 'main',
    source: `float4 main() : SV_Target {\n  return float4(1.0, 0.0, 0.0, 1.0);\n}\n`,
  },
  {
    name: 'Diagonal Gradient',
    target: 'ps_5_0',
    entry: 'main',
    source: `float4 main(float4 pos : SV_Position) : SV_Target {\n  float u = pos.x / 1920.0;\n  float v = pos.y / 1080.0;\n  return float4(u, v, 1.0 - u, 1.0);\n}\n`,
  },
  {
    name: 'Sine Bands',
    target: 'ps_5_0',
    entry: 'main',
    source: `float4 main(float4 pos : SV_Position) : SV_Target {\n  float band = 0.5 + 0.5 * sin(pos.y * 0.04);\n  return float4(band, band * 0.6, 1.0 - band, 1.0);\n}\n`,
  },
  {
    name: 'Plasma',
    target: 'ps_5_0',
    entry: 'main',
    source: `float4 main(float4 pos : SV_Position) : SV_Target {\n  float t = pos.x * 0.02 + pos.y * 0.03;\n  float r = 0.5 + 0.5 * sin(t);\n  float g = 0.5 + 0.5 * sin(t + 2.094);\n  float b = 0.5 + 0.5 * sin(t + 4.188);\n  return float4(r, g, b, 1.0);\n}\n`,
  },
];

interface CompiledShader {
  name: string;
  source: string;
  compileMs: number;
  bytecodeSize: number;
  bytecodePreview: number[];
  disassembly: string;
  instructionCount: number;
}

function enableVtMode(): void {
  // Most modern Windows terminals already have VT processing on; if not, our
  // ANSI output may show literally. Kernel32 could enable it, but we keep this
  // example focused on d3dcompiler_47 only.
}

function compile(source: string, entry: string, target: string): { blobPtr: bigint; bytecodeSize: number; bytecodePreview: number[]; compileMs: number } {
  const sourceBuf = Buffer.from(source + '\0', 'utf8');
  const entryBuf = Buffer.from(entry + '\0', 'utf8');
  const targetBuf = Buffer.from(target + '\0', 'utf8');
  const ppCode = Buffer.alloc(8);
  const ppErr = Buffer.alloc(8);

  const t0 = performance.now();
  const hr = D3dcompiler_47.D3DCompile(sourceBuf.ptr!, BigInt(sourceBuf.byteLength - 1), null, null, null, entryBuf.ptr!, targetBuf.ptr!, D3DCOMPILE_ENABLE_STRICTNESS | D3DCOMPILE_OPTIMIZATION_LEVEL3, 0, ppCode.ptr!, ppErr.ptr!);
  const compileMs = performance.now() - t0;

  if (hr !== 0) {
    const errPtr = ppErr.readBigUInt64LE(0);
    const errText = errPtr !== 0n ? readBlobAsString(errPtr) : '(no error blob)';
    releaseBlob(errPtr);
    throw new Error(`D3DCompile failed (HR=0x${(hr >>> 0).toString(16)}): ${errText}`);
  }

  const blobPtr = ppCode.readBigUInt64LE(0);
  const dataAddr = blobGetBufferPointer(blobPtr);
  const dataSize = Number(blobGetBufferSize(blobPtr));
  // Preview the first 64 bytes for the visualization grid.
  const dataAddrPointer = Number(dataAddr) as Pointer;
  const preview: number[] = [];
  for (let offset = 0; offset < Math.min(64, dataSize); offset++) {
    preview.push(read.u8(dataAddrPointer, offset));
  }
  return { blobPtr, bytecodeSize: dataSize, bytecodePreview: preview, compileMs };
}

function disassemble(blobPtr: bigint): { text: string; instructionCount: number } {
  const dataAddr = blobGetBufferPointer(blobPtr);
  const dataSize = blobGetBufferSize(blobPtr);
  const ppDis = Buffer.alloc(8);
  const hr = D3dcompiler_47.D3DDisassemble(Number(dataAddr) as Pointer, dataSize, D3D_DISASM_ENABLE_INSTRUCTION_NUMBERING, null, ppDis.ptr!);
  if (hr !== 0) throw new Error(`D3DDisassemble failed (HR=0x${(hr >>> 0).toString(16)})`);
  const disBlob = ppDis.readBigUInt64LE(0);
  const text = readBlobAsString(disBlob);
  releaseBlob(disBlob);
  // Instruction count: count the lines beginning with "  N: " (numbering on).
  const instructionCount = (text.match(/^\s*\d+:\s/gm) ?? []).length;
  return { text, instructionCount };
}

function blobGetBufferPointer(blobPtr: bigint): bigint {
  const vtable = read.u64(Number(blobPtr) as Pointer, 0);
  const fnAddr = read.u64(Number(vtable) as Pointer, 24); // slot 3 of IUnknown+ID3DBlob layout
  return CFunction({ ptr: Number(fnAddr) as Pointer, args: [FFIType.u64], returns: FFIType.u64 })(blobPtr) as bigint;
}

function blobGetBufferSize(blobPtr: bigint): bigint {
  const vtable = read.u64(Number(blobPtr) as Pointer, 0);
  const fnAddr = read.u64(Number(vtable) as Pointer, 32); // slot 4
  return CFunction({ ptr: Number(fnAddr) as Pointer, args: [FFIType.u64], returns: FFIType.u64 })(blobPtr) as bigint;
}

function releaseBlob(blobPtr: bigint): void {
  if (blobPtr === 0n) return;
  const vtable = read.u64(Number(blobPtr) as Pointer, 0);
  const fnAddr = read.u64(Number(vtable) as Pointer, 16); // slot 2 (Release)
  CFunction({ ptr: Number(fnAddr) as Pointer, args: [FFIType.u64], returns: FFIType.u32 })(blobPtr);
}

function readBlobAsString(blobPtr: bigint): string {
  const dataAddr = blobGetBufferPointer(blobPtr);
  const dataSize = Number(blobGetBufferSize(blobPtr));
  const bytes = new Uint8Array(toArrayBuffer(Number(dataAddr) as Pointer, 0, dataSize));
  // Disassembly is ASCII; trim trailing NUL if present.
  let end = bytes.byteLength;
  while (end > 0 && bytes[end - 1] === 0) end--;
  return new TextDecoder('utf-8').decode(bytes.subarray(0, end));
}

function colour256(n: number, text: string): string {
  return `\x1b[38;5;${n}m${text}${RESET}`;
}

function gradient(text: string, palette: number[]): string {
  let out = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (ch === ' ' || ch === '\n') {
      out += ch;
      continue;
    }
    out += colour256(palette[i % palette.length]!, ch);
  }
  return out;
}

const ASM_TOKEN =
  /(\bdcl_\w+\b)|(\b(?:ret|discard|loop|endloop|if_\w+|else|endif)\b)|(\b(?:mov|mul|mad|add|sub|div|exp|log|sqrt|rsq|sincos|sample\w*|store_\w+|load_\w+|dp\d|max|min|rcp|round_\w+|frc|abs|ftoi|ftou|itof|utof|or|and|xor|cmp|ge|lt|eq|ne|deriv_\w+)\b)|(\bv\d+(?:\.[xyzw]+)?\b)|(\br\d+(?:\.[xyzw]+)?\b)|(\bo\d+(?:\.[xyzw]+)?\b)|(\bcb\d+(?:\[\d+\])?(?:\.[xyzw]+)?\b)|(-?\b\d+\.\d+\b|-?\b\d+\b)/g;

function highlightAsm(line: string): string {
  if (/^\s*\/\//.test(line)) return colour256(245, line);
  // Single-pass tokenizer so the colour escapes from one match cannot be
  // re-matched by a later alternation (digits inside `\x1b[38;5;220m` etc).
  return line.replace(ASM_TOKEN, (match, dcl, ctrl, alu, vreg, rreg, oreg, cbreg, num) => {
    if (dcl) return colour256(220, match);
    if (ctrl) return colour256(207, match);
    if (alu) return colour256(51, match);
    if (vreg) return colour256(213, match);
    if (rreg) return colour256(159, match);
    if (oreg) return colour256(228, match);
    if (cbreg) return colour256(123, match);
    if (num) return colour256(229, match);
    return match;
  });
}

function padRight(text: string, width: number): string {
  // Pad text accounting for ANSI escape sequences (which have no visible width).
  const visible = text.replace(/\x1b\[[0-9;]*m/g, '');
  if (visible.length >= width) return text;
  return text + ' '.repeat(width - visible.length);
}

function bytecodeBlock(preview: number[]): string {
  const rows: string[] = [];
  const cols = 16;
  for (let row = 0; row * cols < preview.length; row++) {
    const cells: string[] = [];
    for (let column = 0; column < cols; column++) {
      const offset = row * cols + column;
      if (offset >= preview.length) break;
      const byte = preview[offset]!;
      const hex = byte.toString(16).padStart(2, '0');
      const colourIndex = Math.min(BYTECODE_GRADIENT.length - 1, Math.floor((byte / 255) * BYTECODE_GRADIENT.length));
      cells.push(colour256(BYTECODE_GRADIENT[colourIndex]!, hex));
    }
    rows.push(cells.join(' '));
  }
  return rows.join('\n');
}

function renderShader(shader: CompiledShader): void {
  const consoleWidth = process.stdout.columns ?? 120;
  const leftWidth = Math.max(40, Math.floor(consoleWidth * 0.45));
  const rightWidth = Math.max(40, consoleWidth - leftWidth - 6);

  const banner = ` ♪ ${shader.name} `;
  const bannerCentered = banner.padStart(Math.floor((consoleWidth - banner.length) / 2) + banner.length).padEnd(consoleWidth - 2);
  console.log(`${FRAME}╭${'─'.repeat(consoleWidth - 2)}╮${RESET}`);
  console.log(`${FRAME}│${RESET}${BOLD}${gradient(bannerCentered, TITLE_GRADIENT)}${RESET}${FRAME}│${RESET}`);
  console.log(`${FRAME}├${'─'.repeat(leftWidth)}┬${'─'.repeat(consoleWidth - leftWidth - 3)}┤${RESET}`);

  const sourceLines = shader.source.replace(/\n+$/, '').split('\n');
  const disassemblyLines = shader.disassembly.replace(/\r/g, '').split('\n').filter(Boolean);
  const sourceCount = sourceLines.length;
  const disassemblyCount = disassemblyLines.length;
  const totalRows = Math.max(sourceCount, disassemblyCount);

  for (let row = 0; row < totalRows; row++) {
    const lineNumber = row < sourceCount ? colour256(TITLE_GRADIENT[row % TITLE_GRADIENT.length]!, `${(row + 1).toString().padStart(2, ' ')}│`) : '   ';
    const sourceText = row < sourceCount ? sourceLines[row]! : '';
    const left = `${lineNumber} ${colour256(231, sourceText)}`;
    const right = row < disassemblyCount ? highlightAsm(disassemblyLines[row]!) : '';
    console.log(`${FRAME}│${RESET}${padRight(' ' + left, leftWidth)}${FRAME}│${RESET}${padRight(' ' + right, consoleWidth - leftWidth - 3)}${FRAME}│${RESET}`);
  }

  const stats =
    `${BOLD}${colour256(213, 'bytecode')}${RESET} ${shader.bytecodeSize}B  ` + `${BOLD}${colour256(159, 'compile')}${RESET} ${shader.compileMs.toFixed(2)}ms  ` + `${BOLD}${colour256(228, 'instr')}${RESET} ${shader.instructionCount}`;
  console.log(`${FRAME}├${'─'.repeat(consoleWidth - 2)}┤${RESET}`);
  console.log(`${FRAME}│${RESET} ${padRight(stats, consoleWidth - 4)} ${FRAME}│${RESET}`);
  console.log(`${FRAME}│${RESET} ${padRight(bytecodeBlock(shader.bytecodePreview).split('\n')[0] ?? '', consoleWidth - 4)} ${FRAME}│${RESET}`);
  for (const row of bytecodeBlock(shader.bytecodePreview).split('\n').slice(1)) {
    console.log(`${FRAME}│${RESET} ${padRight(row, consoleWidth - 4)} ${FRAME}│${RESET}`);
  }
  console.log(`${FRAME}╰${'─'.repeat(consoleWidth - 2)}╯${RESET}`);
}

enableVtMode();
console.log();
console.log(BOLD + gradient('  HLSL → DXBC compilation playground', TITLE_GRADIENT) + RESET);
console.log(DIM + '  Each shader is compiled with -O3 and disassembled in-process via d3dcompiler_47.dll.' + RESET);
console.log();

let totalBytes = 0;
let totalMs = 0;

for (const shader of shaders) {
  const compiled = compile(shader.source, shader.entry, shader.target);
  const { text, instructionCount } = disassemble(compiled.blobPtr);
  releaseBlob(compiled.blobPtr);

  totalBytes += compiled.bytecodeSize;
  totalMs += compiled.compileMs;

  renderShader({
    name: shader.name,
    source: shader.source,
    compileMs: compiled.compileMs,
    bytecodeSize: compiled.bytecodeSize,
    bytecodePreview: compiled.bytecodePreview,
    disassembly: text,
    instructionCount,
  });
  console.log();
}

const finale = ` ${shaders.length} shaders · ${totalBytes}B emitted · ${totalMs.toFixed(2)}ms cumulative `;
console.log(BOLD + gradient(finale, TITLE_GRADIENT) + RESET);
