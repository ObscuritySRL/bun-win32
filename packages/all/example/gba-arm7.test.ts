/**
 * gba-arm7.test.ts — hand-assembled instruction tests for the ARM7TDMI core.
 * Run with `bun run` (NOT `bun test`, which segfaults repo-wide on this
 * workspace). Encodes specific ARM/THUMB opcodes into a flat RAM bus, single-
 * steps the CPU, and asserts register/flag/memory results. Prints PASS/FAIL and
 * exits non-zero on any failure.
 *
 * Run: bun run packages/all/example/gba-arm7.test.ts
 */
import { Arm7, type Bus } from './gba-arm7';

let failures = 0;
function check(name: string, cond: boolean, got?: unknown, want?: unknown): void {
  if (cond) {
    console.log(`PASS  ${name}`);
  } else {
    console.log(`FAIL  ${name}${got !== undefined ? `  got=${fmt(got)} want=${fmt(want)}` : ''}`);
    failures += 1;
  }
}
const fmt = (v: unknown): string => (typeof v === 'number' ? `0x${(v >>> 0).toString(16)}` : String(v));

class Ram implements Bus {
  readonly mem = new Uint8Array(0x10000);
  read8(a: number): number {
    return this.mem[a & 0xffff]!;
  }
  read16(a: number): number {
    a &= 0xffff;
    return this.mem[a]! | (this.mem[a + 1]! << 8);
  }
  read32(a: number): number {
    a &= 0xffff;
    return (this.mem[a]! | (this.mem[a + 1]! << 8) | (this.mem[a + 2]! << 16) | (this.mem[a + 3]! << 24)) >>> 0;
  }
  write8(a: number, v: number): void {
    this.mem[a & 0xffff] = v & 0xff;
  }
  write16(a: number, v: number): void {
    a &= 0xffff;
    this.mem[a] = v & 0xff;
    this.mem[a + 1] = (v >> 8) & 0xff;
  }
  write32(a: number, v: number): void {
    a &= 0xffff;
    this.mem[a] = v & 0xff;
    this.mem[a + 1] = (v >> 8) & 0xff;
    this.mem[a + 2] = (v >> 16) & 0xff;
    this.mem[a + 3] = (v >> 24) & 0xff;
  }
}

/** Fresh CPU in ARM state at `base`, with the given 32-bit words loaded there. */
function arm(words: number[], base = 0x1000): { cpu: Arm7; ram: Ram } {
  const ram = new Ram();
  for (let i = 0; i < words.length; i += 1) ram.write32(base + i * 4, words[i]!);
  const cpu = new Arm7(ram);
  cpu.cpsr = 0x1f; // System mode, ARM, IRQ enabled
  cpu.r[15] = base;
  return { cpu, ram };
}

/** Fresh CPU in THUMB state at `base`, with the given 16-bit halfwords loaded. */
function thumb(halfs: number[], base = 0x1000): { cpu: Arm7; ram: Ram } {
  const ram = new Ram();
  for (let i = 0; i < halfs.length; i += 1) ram.write16(base + i * 2, halfs[i]!);
  const cpu = new Arm7(ram);
  cpu.cpsr = 0x1f | 0x20; // System mode + THUMB
  cpu.r[15] = base;
  return { cpu, ram };
}

const F_N = 0x80000000,
  F_Z = 0x40000000,
  F_C = 0x20000000,
  F_V = 0x10000000;

// ── ARM data processing ────────────────────────────────────────────────────────
{
  const { cpu } = arm([0xe3a00005]); // MOV r0, #5
  cpu.step();
  check('ARM MOV r0,#5', cpu.r[0] === 5, cpu.r[0], 5);
}
{
  const { cpu } = arm([0xe3a00005, 0xe2801003]); // MOV r0,#5 ; ADD r1,r0,#3
  cpu.step();
  cpu.step();
  check('ARM ADD r1,r0,#3', cpu.r[1] === 8, cpu.r[1], 8);
}
{
  const { cpu } = arm([0xe3e00000, 0xe2901001]); // MVN r0,#0 (=0xFFFFFFFF) ; ADDS r1,r0,#1
  cpu.step();
  cpu.step();
  check('ARM ADDS wraps to 0', cpu.r[1] === 0, cpu.r[1], 0);
  check('ARM ADDS sets Z', (cpu.cpsr & F_Z) !== 0);
  check('ARM ADDS sets C (carry out)', (cpu.cpsr & F_C) !== 0);
}
{
  const { cpu } = arm([0xe3a00005, 0xe2501007]); // MOV r0,#5 ; SUBS r1,r0,#7
  cpu.step();
  cpu.step();
  check('ARM SUBS 5-7 = -2', cpu.r[1] === -2, cpu.r[1], -2);
  check('ARM SUBS sets N', (cpu.cpsr & F_N) !== 0);
  check('ARM SUBS clears C (borrow)', (cpu.cpsr & F_C) === 0);
}
{
  const { cpu } = arm([0xe3a004ff]); // MOV r0, #0xFF000000 (imm 0xFF ror 8)
  cpu.step();
  check('ARM MOV with rotate imm', cpu.r[0] >>> 0 === 0xff000000, cpu.r[0], 0xff000000);
}

// ── ARM branch / BL ────────────────────────────────────────────────────────────
{
  const { cpu } = arm([0xea00003e]); // B +0xF8 → 0x1000+8+0xF8 = 0x1100
  cpu.step();
  check('ARM B target', cpu.r[15] >>> 0 === 0x1100, cpu.r[15], 0x1100);
}
{
  const { cpu } = arm([0xeb00003e]); // BL +0xF8
  cpu.step();
  check('ARM BL target', cpu.r[15] >>> 0 === 0x1100, cpu.r[15], 0x1100);
  check('ARM BL sets LR = next', cpu.r[14] >>> 0 === 0x1004, cpu.r[14], 0x1004);
}

// ── ARM load/store + LDM/STM ────────────────────────────────────────────────────
{
  // MOV r0,#0x42 ; MOV r1,#0x2000 ; STR r0,[r1] ; LDR r2,[r1]
  const { cpu } = arm([0xe3a00042, 0xe3a01a02, 0xe5810000, 0xe5912000]);
  for (let i = 0; i < 4; i += 1) cpu.step();
  check('ARM STR then LDR round-trips', cpu.r[2] === 0x42, cpu.r[2], 0x42);
}
{
  // MOV r0,#0x11 ; MOV r1,#0x22 ; MOV r13,#0x3000 ; STMIA r13!,{r0,r1} ; LDR r3,[r13,#-8] (back)
  const { cpu, ram } = arm([0xe3a00011, 0xe3a01022, 0xe3a0da03, 0xe8ad0003]);
  for (let i = 0; i < 4; i += 1) cpu.step();
  check('ARM STMIA wrote r0', ram.read32(0x3000) === 0x11, ram.read32(0x3000), 0x11);
  check('ARM STMIA wrote r1', ram.read32(0x3004) === 0x22, ram.read32(0x3004), 0x22);
  check('ARM STMIA writeback SP+=8', cpu.r[13] >>> 0 === 0x3008, cpu.r[13], 0x3008);
}

// ── ARM BX → THUMB switch ───────────────────────────────────────────────────────
{
  // MOV r0,#0x1009 (odd → THUMB) ; BX r0   (then a THUMB MOV r1,#7 at 0x1008)
  const { cpu, ram } = arm([0xe3a00f42 /*placeholder*/]);
  ram.write32(0x1000, 0xe59f0000); // LDR r0, [pc, #0] → loads next-next word
  ram.write32(0x1004, 0xe12fff10); // BX r0
  ram.write32(0x1008, 0x00001009); // literal: 0x1009
  ram.write16(0x1008, 0x2107); // (overwritten below) — set THUMB code at 0x100A instead
  // Put the literal at 0x100C and THUMB MOV r1,#7 at 0x1010
  ram.write32(0x1008, 0x00001011); // literal 0x1011 (THUMB target 0x1010 | 1)
  ram.write16(0x1010, 0x2107); // THUMB: MOV r1, #7
  cpu.r[15] = 0x1000;
  // LDR r0,[pc,#0]: pc+8 = 0x1008 → r0 = 0x1011
  cpu.step(); // LDR
  check('ARM LDR literal for BX', cpu.r[0] >>> 0 === 0x1011, cpu.r[0], 0x1011);
  cpu.step(); // BX r0
  check('BX entered THUMB state', cpu.thumb === true);
  check('BX masked PC to 0x1010', cpu.r[15] >>> 0 === 0x1010, cpu.r[15], 0x1010);
  cpu.step(); // THUMB MOV r1,#7
  check('THUMB MOV after BX', cpu.r[1] === 7, cpu.r[1], 7);
}

// ── THUMB core ──────────────────────────────────────────────────────────────────
{
  const { cpu } = thumb([0x2042]); // MOV r0, #0x42
  cpu.step();
  check('THUMB MOV r0,#0x42', cpu.r[0] === 0x42, cpu.r[0], 0x42);
}
{
  const { cpu } = thumb([0x2005, 0x1c41]); // MOV r0,#5 ; ADD r1,r0,#1
  cpu.step();
  cpu.step();
  check('THUMB ADD r1,r0,#1', cpu.r[1] === 6, cpu.r[1], 6);
}
{
  const { cpu } = thumb([0x2003, 0x0088]); // MOV r0,#3 ; LSL r0,r1,#2 (r1=0) → r0=0
  // Actually test LSL on a value: MOV r1,#3 ; LSL r0,r1,#2 → 12
  const t = thumb([0x2103, 0x0088]); // MOV r1,#3 ; LSL r0,r1,#2
  void cpu;
  t.cpu.step();
  t.cpu.step();
  check('THUMB LSL r0,r1,#2 = 12', t.cpu.r[0] === 12, t.cpu.r[0], 12);
}
{
  // MOV r0,#0x10 ; MOV r13,#0x3000 ; PUSH {r0} ; POP {r1}
  const { cpu } = thumb([0x2010, 0x4d00, 0xb401, 0xbc02]);
  // r13 set via format 11? simpler: set directly
  cpu.r[13] = 0x3000;
  const t2 = thumb([0x2010, 0xb401, 0xbc02]); // MOV r0,#0x10 ; PUSH {r0} ; POP {r1}
  t2.cpu.r[13] = 0x3000;
  t2.cpu.step();
  t2.cpu.step();
  t2.cpu.step();
  check('THUMB PUSH/POP round-trips', t2.cpu.r[1] === 0x10, t2.cpu.r[1], 0x10);
  check('THUMB PUSH/POP restores SP', t2.cpu.r[13] >>> 0 === 0x3000, t2.cpu.r[13], 0x3000);
}
{
  // THUMB BL: two halves. BL +0x100 from 0x1000.
  // PC(+4)=0x1004. target=0x1104. offset = (0x1104 - 0x1004) = 0x100 → off>>1=0x80.
  // hi: 11110 0000000000 (offset_hi = 0x100>>12 = 0) ; lo: 11111 0000010000000 (0x80)
  const hi = 0xf000 | ((0x100 >> 12) & 0x7ff);
  const lo = 0xf800 | ((0x100 >> 1) & 0x7ff);
  const { cpu } = thumb([hi, lo]);
  cpu.step();
  cpu.step();
  check('THUMB BL target', cpu.r[15] >>> 0 === 0x1104, cpu.r[15], 0x1104);
  check('THUMB BL sets LR', cpu.r[14] >>> 0 === 0x1005, cpu.r[14], 0x1005);
}
{
  // THUMB conditional branch BEQ taken: set Z, BEQ +4.
  const { cpu } = thumb([0xd002]); // BEQ +(2*2) from PC(+4): 0x1004 + 4 = 0x1008
  cpu.cpsr |= F_Z;
  cpu.step();
  check('THUMB BEQ taken', cpu.r[15] >>> 0 === 0x1008, cpu.r[15], 0x1008);
}
void F_V;

console.log(failures === 0 ? '\nALL PASS' : `\n${failures} FAILURE(S)`);
if (failures > 0) process.exit(1);
