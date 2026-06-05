/**
 * gba-arm7.ts — a cycle-approximate ARM7TDMI CPU core (the processor inside the
 * Game Boy Advance), in pure TypeScript. Implements both instruction sets — the
 * 32-bit ARM state and the 16-bit THUMB state — with the full banked-register
 * model (USR/SYS/IRQ/SVC/ABT/UND/FIQ), CPSR/SPSR, the barrel shifter, condition
 * codes, and the exception/IRQ vector entry.
 *
 * This is the foundation of the GBA emulator: the bus, PPU, APU, DMA and timers
 * (separate modules) hang off the `Bus` interface the CPU drives. It's verified
 * against hand-assembled instruction tests and the free jsmolka gba-tests ROMs.
 *
 * Pipeline model: `r[15]` holds the address of the instruction currently
 * executing; reads of R15 see it +8 (ARM) / +4 (THUMB) to emulate the 3-stage
 * prefetch, and a write to R15 flushes (the next fetch comes from the target).
 */

// ── The memory bus the CPU talks to (implemented by the GBA system module) ────
export interface Bus {
  read8(addr: number): number;
  read16(addr: number): number;
  read32(addr: number): number;
  write8(addr: number, value: number): void;
  write16(addr: number, value: number): void;
  write32(addr: number, value: number): void;
}

// ── Processor modes (low 5 bits of CPSR) ──────────────────────────────────────
const MODE_USR = 0x10;
const MODE_FIQ = 0x11;
const MODE_IRQ = 0x12;
const MODE_SVC = 0x13;
const MODE_ABT = 0x17;
const MODE_UND = 0x1b;
const MODE_SYS = 0x1f;

// ── CPSR flag bits ────────────────────────────────────────────────────────────
const F_N = 0x80000000;
const F_Z = 0x40000000;
const F_C = 0x20000000;
const F_V = 0x10000000;
const F_I = 0x00000080; // IRQ disable
const F_T = 0x00000020; // THUMB state

/** Map a processor mode to a 0..5 bank index (USR and SYS share bank 0). */
function bankIndex(mode: number): number {
  switch (mode) {
    case MODE_FIQ:
      return 1;
    case MODE_IRQ:
      return 2;
    case MODE_SVC:
      return 3;
    case MODE_ABT:
      return 4;
    case MODE_UND:
      return 5;
    default:
      return 0; // USR / SYS
  }
}

export class Arm7 {
  readonly bus: Bus;

  // Active register file r0..r15 (r13=SP, r14=LR, r15=PC). Signed 32-bit.
  readonly r = new Int32Array(16);
  cpsr = MODE_SVC | F_I;

  // Banked r13/r14 + SPSR per bank (index 0 unused for SPSR — USR/SYS have none).
  private readonly bankR13 = new Int32Array(6);
  private readonly bankR14 = new Int32Array(6);
  private readonly bankSpsr = new Int32Array(6);
  // FIQ banks r8..r12; the non-FIQ value is parked here while in FIQ.
  private readonly fiqR = new Int32Array(5);
  private readonly usrR = new Int32Array(5);

  private branched = false; // set when an instruction wrote R15 (skip auto-advance)
  private shifterCarry = 0; // carry-out of the barrel shifter (for logical ops)
  cycles = 0; // approximate; refined when the bus models wait-states
  halted = false; // CPU halted (BIOS Halt / IntrWait) until an IRQ
  // BIOS high-level emulation: if set, SWI is handled here (r0-r3 in/out) and
  // execution falls through to the next instruction instead of vectoring to BIOS.
  onSwi: ((comment: number) => void) | null = null;

  constructor(bus: Bus) {
    this.bus = bus;
    this.reset();
  }

  /** Power-on reset: enter SVC with IRQ disabled, PC at the reset vector (0). */
  reset(): void {
    this.r.fill(0);
    this.bankR13.fill(0);
    this.bankR14.fill(0);
    this.bankSpsr.fill(0);
    this.fiqR.fill(0);
    this.usrR.fill(0);
    this.cpsr = MODE_SVC | F_I;
    this.r[15] = 0;
    this.branched = false;
    this.halted = false;
  }

  get thumb(): boolean {
    return (this.cpsr & F_T) !== 0;
  }
  private get mode(): number {
    return this.cpsr & 0x1f;
  }
  get spsr(): number {
    return this.bankSpsr[bankIndex(this.mode)]!;
  }
  set spsr(v: number) {
    this.bankSpsr[bankIndex(this.mode)] = v | 0;
  }

  // ── Register read/write with the pipeline offset on R15 ─────────────────────
  private read(n: number): number {
    if (n === 15) return (this.r[15] + (this.thumb ? 4 : 8)) | 0;
    return this.r[n]!;
  }
  private write(n: number, v: number): void {
    if (n === 15) {
      this.r[15] = (v & (this.thumb ? ~1 : ~3)) | 0;
      this.branched = true;
    } else {
      this.r[n] = v | 0;
    }
  }

  // ── Mode switch (swaps the banked registers) ────────────────────────────────
  switchMode(newMode: number): void {
    const old = this.mode;
    if (old === newMode) return;
    const oi = bankIndex(old);
    const ni = bankIndex(newMode);
    this.bankR13[oi] = this.r[13]!;
    this.bankR14[oi] = this.r[14]!;
    if (newMode === MODE_FIQ && old !== MODE_FIQ) {
      for (let i = 0; i < 5; i += 1) {
        this.usrR[i] = this.r[8 + i]!;
        this.r[8 + i] = this.fiqR[i]!;
      }
    } else if (old === MODE_FIQ && newMode !== MODE_FIQ) {
      for (let i = 0; i < 5; i += 1) {
        this.fiqR[i] = this.r[8 + i]!;
        this.r[8 + i] = this.usrR[i]!;
      }
    }
    this.r[13] = this.bankR13[ni]!;
    this.r[14] = this.bankR14[ni]!;
    this.cpsr = (this.cpsr & ~0x1f) | newMode;
  }

  /** Redirect execution (used by HLE SoftReset); suppresses the post-SWI advance. */
  forceBranch(addr: number): void {
    this.r[15] = (addr & (this.thumb ? ~1 : ~3)) | 0;
    this.branched = true;
  }

  /** Initialise the banked stack pointer for a mode (used to set up IRQ/SVC stacks). */
  setBankedSp(mode: number, value: number): void {
    if ((this.cpsr & 0x1f) === mode) this.r[13] = value | 0;
    else this.bankR13[bankIndex(mode)] = value | 0;
  }

  /** Write CPSR, switching the register bank if the mode field changed. */
  private setCpsr(v: number): void {
    const newMode = v & 0x1f;
    if (newMode !== this.mode) this.switchMode(newMode);
    this.cpsr = v | 0;
  }

  // ── Flag helpers ────────────────────────────────────────────────────────────
  private setNZ(result: number): void {
    this.cpsr = (this.cpsr & ~(F_N | F_Z)) | (result & F_N) | ((result | 0) === 0 ? F_Z : 0);
  }
  private setFlag(flag: number, on: boolean): void {
    if (on) this.cpsr |= flag;
    else this.cpsr &= ~flag;
  }
  private get cFlag(): number {
    return (this.cpsr & F_C) !== 0 ? 1 : 0;
  }

  /** Evaluate a 4-bit ARM condition code against the current flags. */
  private cond(c: number): boolean {
    const p = this.cpsr;
    const N = (p & F_N) !== 0,
      Z = (p & F_Z) !== 0,
      C = (p & F_C) !== 0,
      V = (p & F_V) !== 0;
    switch (c) {
      case 0x0:
        return Z;
      case 0x1:
        return !Z;
      case 0x2:
        return C;
      case 0x3:
        return !C;
      case 0x4:
        return N;
      case 0x5:
        return !N;
      case 0x6:
        return V;
      case 0x7:
        return !V;
      case 0x8:
        return C && !Z;
      case 0x9:
        return !C || Z;
      case 0xa:
        return N === V;
      case 0xb:
        return N !== V;
      case 0xc:
        return !Z && N === V;
      case 0xd:
        return Z || N !== V;
      default:
        return true; // 0xE always, 0xF reserved (treat as always)
    }
  }

  // ── Barrel shifter (sets shifterCarry) ──────────────────────────────────────
  private barrel(type: number, value: number, amount: number, immediate: boolean): number {
    value |= 0;
    if (amount === 0 && !immediate) {
      // Register-specified shift of 0 → value unchanged, carry = current C.
      this.shifterCarry = this.cFlag;
      return value;
    }
    switch (type) {
      case 0: // LSL
        if (amount === 0) {
          this.shifterCarry = this.cFlag;
          return value;
        }
        if (amount < 32) {
          this.shifterCarry = (value >>> (32 - amount)) & 1;
          return value << amount;
        }
        if (amount === 32) {
          this.shifterCarry = value & 1;
          return 0;
        }
        this.shifterCarry = 0;
        return 0;
      case 1: // LSR
        if (amount === 0 || amount === 32) {
          this.shifterCarry = (value >>> 31) & 1;
          return 0;
        }
        if (amount < 32) {
          this.shifterCarry = (value >>> (amount - 1)) & 1;
          return value >>> amount;
        }
        this.shifterCarry = 0;
        return 0;
      case 2: // ASR
        if (amount === 0 || amount >= 32) {
          this.shifterCarry = (value >>> 31) & 1;
          return value >> 31;
        }
        this.shifterCarry = (value >>> (amount - 1)) & 1;
        return value >> amount;
      default: {
        // ROR
        if (amount === 0) {
          // RRX (rotate right through carry)
          const carryIn = this.cFlag;
          this.shifterCarry = value & 1;
          return (value >>> 1) | (carryIn << 31) | 0;
        }
        const a = amount & 31;
        if (a === 0) {
          this.shifterCarry = (value >>> 31) & 1;
          return value;
        }
        this.shifterCarry = (value >>> (a - 1)) & 1;
        return (value >>> a) | (value << (32 - a)) | 0;
      }
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Step: fetch → (condition) → execute, advancing the pipeline.
  // ════════════════════════════════════════════════════════════════════════════
  step(): number {
    const startCycles = this.cycles;
    this.branched = false;
    if (this.thumb) {
      const pc = this.r[15] >>> 0;
      const op = this.bus.read16(pc) & 0xffff;
      this.executeThumb(op);
      if (!this.branched) this.r[15] = (pc + 2) | 0;
    } else {
      const pc = this.r[15] >>> 0;
      const op = this.bus.read32(pc) >>> 0;
      if (this.cond(op >>> 28)) this.executeArm(op);
      if (!this.branched) this.r[15] = (pc + 4) | 0;
    }
    this.cycles += 1;
    return this.cycles - startCycles;
  }

  /** Enter the IRQ exception (called by the system when an unmasked IRQ is pending). */
  irq(): void {
    if ((this.cpsr & F_I) !== 0) return; // IRQs disabled
    // r[15] already points at the next instruction; the BIOS handler returns via
    // SUBS pc,lr,#4, so the saved LR must be next-instruction + 4 (both states).
    const ret = (this.r[15] + 4) | 0;
    const savedCpsr = this.cpsr;
    this.switchMode(MODE_IRQ);
    this.spsr = savedCpsr;
    this.r[14] = ret;
    this.cpsr = (this.cpsr & ~F_T) | F_I; // ARM state, IRQ disabled
    this.r[15] = 0x18; // IRQ vector
    this.halted = false;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ARM instruction set
  // ════════════════════════════════════════════════════════════════════════════
  private executeArm(op: number): void {
    const top = (op >>> 25) & 0x7; // bits 27-25
    if (top === 0b101) return this.armBranch(op);
    if (top === 0b100) return this.armBlock(op);
    if (top === 0b010 || top === 0b011) {
      if (top === 0b011 && (op & 0x10) !== 0) return; // undefined
      return this.armSingleTransfer(op);
    }
    if (top === 0b111) {
      if ((op & (1 << 24)) !== 0) this.armSwi((op >>> 16) & 0xff);
      return;
    }
    if (top === 0b110) return; // coprocessor transfer — unused on GBA
    // top is 000 or 001 — data processing + the 000 extension space.
    if (top === 0b000) {
      if ((op & 0x0ffffff0) === 0x012fff10) return this.armBx(op);
      if ((op & 0x0f8000f0) === 0x00800090) return this.armMulLong(op);
      if ((op & 0x0fc000f0) === 0x00000090) return this.armMul(op);
      if ((op & 0x0fb00ff0) === 0x01000090) return this.armSwap(op);
      if ((op & 0x90) === 0x90) return this.armHalfTransfer(op);
    }
    return this.armDataProc(op);
  }

  private armBranch(op: number): void {
    let offset = (op & 0x00ffffff) << 2;
    offset = (offset << 6) >> 6; // sign-extend 26-bit
    if (op & (1 << 24)) this.r[14] = (this.r[15] + 4) | 0; // BL: LR = next instruction
    this.write(15, (this.read(15) + offset) | 0);
  }

  private armBx(op: number): void {
    const rn = this.read(op & 0xf);
    if (rn & 1) this.cpsr |= F_T;
    else this.cpsr &= ~F_T;
    this.write(15, rn & ~1);
  }

  /** a + b + carryIn with optional flag update. */
  private adcOp(a: number, b: number, carryIn: number, setFlags: boolean): number {
    const res = (a >>> 0) + (b >>> 0) + carryIn;
    const r = res | 0;
    if (setFlags) {
      this.setNZ(r);
      this.setFlag(F_C, res > 0xffffffff);
      this.setFlag(F_V, (~(a ^ b) & (a ^ r) & 0x80000000) !== 0);
    }
    return r;
  }

  /** a - b - (1 - carryIn) with optional flag update (ARM C = NOT borrow). */
  private sbcOp(a: number, b: number, carryIn: number, setFlags: boolean): number {
    const res = (a >>> 0) - (b >>> 0) - (1 - carryIn);
    const r = res | 0;
    if (setFlags) {
      this.setNZ(r);
      this.setFlag(F_C, res >= 0);
      this.setFlag(F_V, ((a ^ b) & (a ^ r) & 0x80000000) !== 0);
    }
    return r;
  }

  private armDataProc(op: number): void {
    const opcode = (op >>> 21) & 0xf;
    const setFlags = (op & (1 << 20)) !== 0;
    // TST/TEQ/CMP/CMN with S=0 is actually a PSR transfer (MRS/MSR).
    if (!setFlags && opcode >= 0x8 && opcode <= 0xb) return this.armPsr(op);

    const rn = (op >>> 16) & 0xf;
    const rd = (op >>> 12) & 0xf;
    const immediate = (op & (1 << 25)) !== 0;
    const regShift = !immediate && (op & (1 << 4)) !== 0;

    let operand2: number;
    if (immediate) {
      const imm = op & 0xff;
      const rot = ((op >>> 8) & 0xf) * 2;
      operand2 = rot === 0 ? imm : (imm >>> rot) | (imm << (32 - rot)) | 0;
      this.shifterCarry = rot === 0 ? this.cFlag : (operand2 >>> 31) & 1;
    } else {
      const rm = op & 0xf;
      const type = (op >>> 5) & 0x3;
      // R15 reads as +12 with a register-specified shift, +8 otherwise.
      let value = this.read(rm);
      if (regShift && rm === 15) value = (this.r[15] + 12) | 0;
      const amount = regShift ? this.read((op >>> 8) & 0xf) & 0xff : (op >>> 7) & 0x1f;
      operand2 = this.barrel(type, value, amount, !regShift);
    }

    let a = this.read(rn);
    if (regShift && rn === 15) a = (this.r[15] + 12) | 0;
    const carry = this.cFlag;
    let result = 0;
    let logical = false;
    let write = true;
    switch (opcode) {
      case 0x0:
        result = a & operand2;
        logical = true;
        break; // AND
      case 0x1:
        result = a ^ operand2;
        logical = true;
        break; // EOR
      case 0x2:
        result = this.sbcOp(a, operand2, 1, setFlags);
        break; // SUB
      case 0x3:
        result = this.sbcOp(operand2, a, 1, setFlags);
        break; // RSB
      case 0x4:
        result = this.adcOp(a, operand2, 0, setFlags);
        break; // ADD
      case 0x5:
        result = this.adcOp(a, operand2, carry, setFlags);
        break; // ADC
      case 0x6:
        result = this.sbcOp(a, operand2, carry, setFlags);
        break; // SBC
      case 0x7:
        result = this.sbcOp(operand2, a, carry, setFlags);
        break; // RSC
      case 0x8:
        result = a & operand2;
        logical = true;
        write = false;
        break; // TST
      case 0x9:
        result = a ^ operand2;
        logical = true;
        write = false;
        break; // TEQ
      case 0xa:
        this.sbcOp(a, operand2, 1, true);
        return; // CMP
      case 0xb:
        this.adcOp(a, operand2, 0, true);
        return; // CMN
      case 0xc:
        result = a | operand2;
        logical = true;
        break; // ORR
      case 0xd:
        result = operand2;
        logical = true;
        break; // MOV
      case 0xe:
        result = a & ~operand2;
        logical = true;
        break; // BIC
      default:
        result = ~operand2;
        logical = true;
        break; // MVN (0xf)
    }
    if (logical && setFlags) {
      this.setNZ(result);
      this.setFlag(F_C, this.shifterCarry !== 0);
    }
    if (!write) return;
    if (rd === 15) {
      const restore = this.spsr;
      this.write(15, result);
      if (setFlags) this.setCpsr(restore); // S + Rd=15 → restore CPSR (exception return)
    } else {
      this.r[rd] = result | 0;
    }
  }

  private armMul(op: number): void {
    const rd = (op >>> 16) & 0xf;
    const rn = (op >>> 12) & 0xf;
    const rs = (op >>> 8) & 0xf;
    const rm = op & 0xf;
    const accumulate = (op & (1 << 21)) !== 0;
    let result = Math.imul(this.r[rm]!, this.r[rs]!);
    if (accumulate) result = (result + this.r[rn]!) | 0;
    this.r[rd] = result | 0;
    if (op & (1 << 20)) {
      this.setNZ(result);
    }
  }

  private armMulLong(op: number): void {
    const rdHi = (op >>> 16) & 0xf;
    const rdLo = (op >>> 12) & 0xf;
    const rs = (op >>> 8) & 0xf;
    const rm = op & 0xf;
    const signed = (op & (1 << 22)) !== 0;
    const accumulate = (op & (1 << 21)) !== 0;
    const a = BigInt(signed ? this.r[rm]! : this.r[rm]! >>> 0);
    const b = BigInt(signed ? this.r[rs]! : this.r[rs]! >>> 0);
    let result = a * b;
    if (accumulate) {
      const lo = BigInt(this.r[rdLo]! >>> 0);
      const hi = BigInt(this.r[rdHi]! >>> 0);
      result += (hi << 32n) | lo;
    }
    result &= 0xffffffffffffffffn;
    this.r[rdLo] = Number(result & 0xffffffffn) | 0;
    this.r[rdHi] = Number((result >> 32n) & 0xffffffffn) | 0;
    if (op & (1 << 20)) {
      this.setFlag(F_N, (this.r[rdHi]! & F_N) !== 0);
      this.setFlag(F_Z, this.r[rdHi] === 0 && this.r[rdLo] === 0);
    }
  }

  private armSwap(op: number): void {
    const rn = (op >>> 16) & 0xf;
    const rd = (op >>> 12) & 0xf;
    const rm = op & 0xf;
    const addr = this.r[rn]! >>> 0;
    if (op & (1 << 22)) {
      // SWPB
      const tmp = this.bus.read8(addr);
      this.bus.write8(addr, this.r[rm]! & 0xff);
      this.r[rd] = tmp;
    } else {
      const tmp = this.ldrWord(addr);
      this.bus.write32(addr, this.r[rm]!);
      this.r[rd] = tmp | 0;
    }
  }

  /** LDR word with the ARM rotate-on-unaligned-address behaviour. */
  private ldrWord(addr: number): number {
    const aligned = addr & ~3;
    const value = this.bus.read32(aligned) >>> 0;
    const rot = (addr & 3) * 8;
    return rot === 0 ? value : (value >>> rot) | (value << (32 - rot)) | 0;
  }

  private armSingleTransfer(op: number): void {
    const immediate = (op & (1 << 25)) === 0; // bit25=0 → immediate offset (ARM quirk: inverted vs DP)
    const preIndex = (op & (1 << 24)) !== 0;
    const up = (op & (1 << 23)) !== 0;
    const byte = (op & (1 << 22)) !== 0;
    const writeBack = (op & (1 << 21)) !== 0;
    const load = (op & (1 << 20)) !== 0;
    const rn = (op >>> 16) & 0xf;
    const rd = (op >>> 12) & 0xf;

    let offset: number;
    if (immediate) {
      offset = op & 0xfff;
    } else {
      const rm = op & 0xf;
      const type = (op >>> 5) & 0x3;
      const amount = (op >>> 7) & 0x1f;
      offset = this.barrel(type, this.r[rm]!, amount, true);
    }

    let addr = this.read(rn) >>> 0;
    const offsetAddr = (up ? addr + offset : addr - offset) >>> 0;
    if (preIndex) addr = offsetAddr;

    if (load) {
      const value = byte ? this.bus.read8(addr) : this.ldrWord(addr);
      if (!preIndex || writeBack) this.write(rn, offsetAddr);
      this.write(rd, value);
    } else {
      const value = rd === 15 ? (this.r[15] + 12) | 0 : this.r[rd]!;
      if (byte) this.bus.write8(addr, value & 0xff);
      else this.bus.write32(addr & ~3, value);
      if (!preIndex || writeBack) this.write(rn, offsetAddr);
    }
  }

  private armHalfTransfer(op: number): void {
    const preIndex = (op & (1 << 24)) !== 0;
    const up = (op & (1 << 23)) !== 0;
    const immediate = (op & (1 << 22)) !== 0;
    const writeBack = (op & (1 << 21)) !== 0;
    const load = (op & (1 << 20)) !== 0;
    const rn = (op >>> 16) & 0xf;
    const rd = (op >>> 12) & 0xf;
    const sh = (op >>> 5) & 0x3;

    const offset = immediate ? ((op >>> 4) & 0xf0) | (op & 0xf) : this.r[op & 0xf]!;
    let addr = this.read(rn) >>> 0;
    const offsetAddr = (up ? addr + offset : addr - offset) >>> 0;
    if (preIndex) addr = offsetAddr;

    if (load) {
      let value: number;
      if (sh === 1)
        value = this.bus.read16(addr & ~1) & 0xffff; // LDRH
      else if (sh === 2)
        value = (this.bus.read8(addr) << 24) >> 24; // LDRSB
      else value = (this.bus.read16(addr & ~1) << 16) >> 16; // LDRSH
      if (!preIndex || writeBack) this.write(rn, offsetAddr);
      this.write(rd, value);
    } else {
      this.bus.write16(addr & ~1, (rd === 15 ? (this.r[15] + 12) | 0 : this.r[rd]!) & 0xffff); // STRH
      if (!preIndex || writeBack) this.write(rn, offsetAddr);
    }
  }

  private armBlock(op: number): void {
    const preIndex = (op & (1 << 24)) !== 0;
    const up = (op & (1 << 23)) !== 0;
    const psr = (op & (1 << 22)) !== 0; // S bit
    const writeBack = (op & (1 << 21)) !== 0;
    const load = (op & (1 << 20)) !== 0;
    const rn = (op >>> 16) & 0xf;
    const list = op & 0xffff;

    let count = 0;
    for (let i = 0; i < 16; i += 1) if (list & (1 << i)) count += 1;
    const base = this.r[rn]! >>> 0;
    let addr = up ? base : (base - count * 4) >>> 0;
    const finalBase = up ? (base + count * 4) >>> 0 : (base - count * 4) >>> 0;
    // For decreasing, addresses run low→high but the base ends lower.
    const startAddr = up ? (preIndex ? addr + 4 : addr) : preIndex ? addr : addr + 4;
    addr = startAddr >>> 0;

    const userBank = psr && !(load && list & 0x8000); // S with no R15 → user-mode registers
    let wroteBase = false;
    for (let i = 0; i < 16; i += 1) {
      if ((list & (1 << i)) === 0) continue;
      if (load) {
        const value = this.bus.read32(addr & ~3) | 0;
        if (userBank && i >= 8 && i <= 14) this.writeUserReg(i, value);
        else this.write(i, value);
      } else {
        const value = userBank && i >= 8 && i <= 14 ? this.readUserReg(i) : i === 15 ? (this.r[15] + 12) | 0 : i === rn && wroteBase ? finalBase : this.r[i]!;
        this.bus.write32(addr & ~3, value);
      }
      if (i === rn) wroteBase = true;
      addr = (addr + 4) >>> 0;
    }
    if (writeBack && !(load && list & (1 << rn))) this.r[rn] = finalBase | 0;
    if (load && psr && list & 0x8000) this.setCpsr(this.spsr); // LDM with R15 + S → restore CPSR
  }

  // User-bank access for LDM/STM with the ^ (S) flag and no R15.
  private readUserReg(i: number): number {
    if (this.mode === MODE_USR || this.mode === MODE_SYS) return this.r[i]!;
    if (this.mode === MODE_FIQ && i >= 8 && i <= 12) return this.usrR[i - 8]!;
    if (i === 13) return this.bankR13[0]!;
    if (i === 14) return this.bankR14[0]!;
    return this.r[i]!;
  }
  private writeUserReg(i: number, v: number): void {
    if (this.mode === MODE_USR || this.mode === MODE_SYS) {
      this.r[i] = v | 0;
      return;
    }
    if (this.mode === MODE_FIQ && i >= 8 && i <= 12) {
      this.usrR[i - 8] = v | 0;
      return;
    }
    if (i === 13) {
      this.bankR13[0] = v | 0;
      return;
    }
    if (i === 14) {
      this.bankR14[0] = v | 0;
      return;
    }
    this.r[i] = v | 0;
  }

  private armSwi(comment: number): void {
    if (this.onSwi) {
      this.onSwi(comment);
      return;
    } // HLE: fall through to next instruction
    const ret = (this.r[15] + 4) | 0;
    const saved = this.cpsr;
    this.switchMode(MODE_SVC);
    this.spsr = saved;
    this.r[14] = ret;
    this.cpsr = (this.cpsr & ~F_T) | F_I;
    this.r[15] = 0x08; // SWI vector
    this.branched = true;
  }

  // MRS/MSR are decoded here from the TST/TEQ/CMP/CMN-with-S=0 slot.
  private armPsr(op: number): void {
    const useSpsr = (op & (1 << 22)) !== 0;
    if ((op & (1 << 21)) === 0) {
      // MRS Rd, PSR
      const rd = (op >>> 12) & 0xf;
      this.r[rd] = (useSpsr ? this.spsr : this.cpsr) | 0;
    } else {
      // MSR PSR[_fields], operand
      let value: number;
      if (op & (1 << 25)) {
        const imm = op & 0xff;
        const rot = ((op >>> 8) & 0xf) * 2;
        value = rot === 0 ? imm : (imm >>> rot) | (imm << (32 - rot)) | 0;
      } else {
        value = this.r[op & 0xf]!;
      }
      let mask = 0;
      if (op & (1 << 16)) mask |= 0x000000ff;
      if (op & (1 << 17)) mask |= 0x0000ff00;
      if (op & (1 << 18)) mask |= 0x00ff0000;
      if (op & (1 << 19)) mask |= 0xff000000;
      if (this.mode === MODE_USR) mask &= 0xff000000; // user mode: flags only
      if (useSpsr) {
        this.spsr = (this.spsr & ~mask) | (value & mask);
      } else {
        const next = (this.cpsr & ~mask) | (value & mask);
        this.setCpsr(next);
      }
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // THUMB instruction set (the 16-bit mode most ARM code on the GBA runs in)
  // ════════════════════════════════════════════════════════════════════════════
  private executeThumb(op: number): void {
    const top = op >>> 13;
    switch (top) {
      case 0b000: {
        if ((op & 0x1800) === 0x1800) return this.thumbAddSub(op); // format 2
        return this.thumbMoveShifted(op); // format 1
      }
      case 0b001:
        return this.thumbImm(op); // format 3
      case 0b010: {
        if (op & 0x1000) return this.thumbRegOffset(op); // formats 7/8 (0101): bit12 set
        if (op & 0x0800) return this.thumbPcLoad(op); // format 6 (01001): bit11 set
        if (op & 0x0400) return this.thumbHiReg(op); // format 5 (010001): bit10 set
        return this.thumbAlu(op); // format 4 (010000)
      }
      case 0b011:
        return this.thumbImmOffset(op); // format 9
      case 0b100: {
        if ((op & 0x1000) === 0) return this.thumbHalf(op); // format 10 (1000)
        return this.thumbSpRel(op); // format 11 (1001)
      }
      case 0b101: {
        if ((op & 0x1000) === 0) return this.thumbLoadAddr(op); // format 12 (1010)
        if ((op & 0x0f00) === 0x0000) return this.thumbAddSp(op); // format 13 (10110000)
        return this.thumbPushPop(op); // format 14 (1011x10)
      }
      case 0b110: {
        if ((op & 0x1000) === 0) return this.thumbBlockTransfer(op); // format 15 (1100)
        if ((op & 0x0f00) === 0x0f00) {
          this.thumbSwi(op & 0xff);
          return;
        } // format 17 (11011111)
        return this.thumbCondBranch(op); // format 16 (1101)
      }
      default: {
        // 0b111
        if ((op & 0x1800) === 0x0000) return this.thumbBranch(op); // format 18 (11100)
        return this.thumbLongBranch(op); // format 19 (1111x)
      }
    }
  }

  private thumbMoveShifted(op: number): void {
    // format 1: LSL/LSR/ASR Rd, Rs, #imm5
    const type = (op >>> 11) & 0x3;
    const offset = (op >>> 6) & 0x1f;
    const rs = (op >>> 3) & 0x7;
    const rd = op & 0x7;
    const result = this.barrel(type, this.r[rs]!, offset, true);
    this.r[rd] = result | 0;
    this.setNZ(result);
    this.setFlag(F_C, this.shifterCarry !== 0);
  }

  private thumbAddSub(op: number): void {
    // format 2
    const immediate = (op & (1 << 10)) !== 0;
    const sub = (op & (1 << 9)) !== 0;
    const rnOff = (op >>> 6) & 0x7;
    const rs = (op >>> 3) & 0x7;
    const rd = op & 0x7;
    const b = immediate ? rnOff : this.r[rnOff]!;
    this.r[rd] = sub ? this.sbcOp(this.r[rs]!, b, 1, true) : this.adcOp(this.r[rs]!, b, 0, true);
  }

  private thumbImm(op: number): void {
    // format 3: MOV/CMP/ADD/SUB Rd, #imm8
    const opcode = (op >>> 11) & 0x3;
    const rd = (op >>> 8) & 0x7;
    const imm = op & 0xff;
    switch (opcode) {
      case 0:
        this.r[rd] = imm;
        this.setNZ(imm);
        break; // MOV
      case 1:
        this.sbcOp(this.r[rd]!, imm, 1, true);
        break; // CMP
      case 2:
        this.r[rd] = this.adcOp(this.r[rd]!, imm, 0, true);
        break; // ADD
      default:
        this.r[rd] = this.sbcOp(this.r[rd]!, imm, 1, true);
        break; // SUB
    }
  }

  private thumbAlu(op: number): void {
    // format 4
    const opcode = (op >>> 6) & 0xf;
    const rs = (op >>> 3) & 0x7;
    const rd = op & 0x7;
    const a = this.r[rd]!;
    const b = this.r[rs]!;
    let result = a;
    let logical = true;
    switch (opcode) {
      case 0x0:
        result = a & b;
        break; // AND
      case 0x1:
        result = a ^ b;
        break; // EOR
      case 0x2:
        result = this.barrel(0, a, b & 0xff, false);
        break; // LSL
      case 0x3:
        result = this.barrel(1, a, b & 0xff, false);
        break; // LSR
      case 0x4:
        result = this.barrel(2, a, b & 0xff, false);
        break; // ASR
      case 0x5:
        this.r[rd] = this.adcOp(a, b, this.cFlag, true);
        return; // ADC
      case 0x6:
        this.r[rd] = this.sbcOp(a, b, this.cFlag, true);
        return; // SBC
      case 0x7:
        result = this.barrel(3, a, b & 0xff, false);
        break; // ROR
      case 0x8:
        this.setNZ(a & b);
        return; // TST
      case 0x9:
        this.r[rd] = this.sbcOp(0, b, 1, true);
        return; // NEG
      case 0xa:
        this.sbcOp(a, b, 1, true);
        return; // CMP
      case 0xb:
        this.adcOp(a, b, 0, true);
        return; // CMN
      case 0xc:
        result = a | b;
        break; // ORR
      case 0xd:
        result = Math.imul(a, b);
        logical = false;
        this.r[rd] = result | 0;
        this.setNZ(result);
        return; // MUL
      case 0xe:
        result = a & ~b;
        break; // BIC
      default:
        result = ~b;
        break; // MVN
    }
    this.r[rd] = result | 0;
    this.setNZ(result);
    if (logical && opcode >= 0x2 && opcode <= 0x7 && opcode !== 0x5 && opcode !== 0x6) {
      this.setFlag(F_C, this.shifterCarry !== 0); // shifts update C
    }
  }

  private thumbHiReg(op: number): void {
    // format 5: hi-reg ops + BX
    const opcode = (op >>> 8) & 0x3;
    const rsFull = ((op >>> 3) & 0x7) + (op & (1 << 6) ? 8 : 0);
    const rdFull = (op & 0x7) + (op & (1 << 7) ? 8 : 0);
    const sv = rsFull === 15 ? (this.r[15] + 4) | 0 : this.r[rsFull]!;
    switch (opcode) {
      case 0: {
        // ADD (no flags)
        const v = ((rdFull === 15 ? (this.r[15] + 4) | 0 : this.r[rdFull]!) + sv) | 0;
        this.write(rdFull, v);
        break;
      }
      case 1:
        this.sbcOp(rdFull === 15 ? (this.r[15] + 4) | 0 : this.r[rdFull]!, sv, 1, true);
        break; // CMP
      case 2:
        this.write(rdFull, sv);
        break; // MOV
      default: {
        // BX
        if (sv & 1) this.cpsr |= F_T;
        else this.cpsr &= ~F_T;
        this.write(15, sv & ~1);
        break;
      }
    }
  }

  private thumbPcLoad(op: number): void {
    // format 6: LDR Rd, [PC, #imm8*4]
    const rd = (op >>> 8) & 0x7;
    const addr = (((this.r[15] + 4) & ~3) + (op & 0xff) * 4) >>> 0;
    this.r[rd] = this.bus.read32(addr) | 0;
  }

  private thumbRegOffset(op: number): void {
    // formats 7 & 8
    const ro = (op >>> 6) & 0x7;
    const rb = (op >>> 3) & 0x7;
    const rd = op & 0x7;
    const addr = (this.r[rb]! + this.r[ro]!) >>> 0;
    if ((op & (1 << 9)) === 0) {
      // format 7: load/store with register offset
      const load = (op & (1 << 11)) !== 0;
      const byte = (op & (1 << 10)) !== 0;
      if (load) this.r[rd] = byte ? this.bus.read8(addr) : this.ldrWord(addr);
      else if (byte) this.bus.write8(addr, this.r[rd]! & 0xff);
      else this.bus.write32(addr & ~3, this.r[rd]!);
    } else {
      // format 8: sign-extended byte/halfword
      switch ((op >>> 10) & 0x3) {
        case 0:
          this.bus.write16(addr & ~1, this.r[rd]! & 0xffff);
          break; // STRH
        case 1:
          this.r[rd] = (this.bus.read8(addr) << 24) >> 24;
          break; // LDSB
        case 2:
          this.r[rd] = this.bus.read16(addr & ~1) & 0xffff;
          break; // LDRH
        default:
          this.r[rd] = (this.bus.read16(addr & ~1) << 16) >> 16;
          break; // LDSH
      }
    }
  }

  private thumbImmOffset(op: number): void {
    // format 9
    const byte = (op & (1 << 12)) !== 0;
    const load = (op & (1 << 11)) !== 0;
    const offset = (op >>> 6) & 0x1f;
    const rb = (op >>> 3) & 0x7;
    const rd = op & 0x7;
    const addr = (this.r[rb]! + (byte ? offset : offset * 4)) >>> 0;
    if (load) this.r[rd] = byte ? this.bus.read8(addr) : this.ldrWord(addr);
    else if (byte) this.bus.write8(addr, this.r[rd]! & 0xff);
    else this.bus.write32(addr & ~3, this.r[rd]!);
  }

  private thumbHalf(op: number): void {
    // format 10: LDRH/STRH Rd, [Rb, #imm5*2]
    const load = (op & (1 << 11)) !== 0;
    const offset = ((op >>> 6) & 0x1f) * 2;
    const rb = (op >>> 3) & 0x7;
    const rd = op & 0x7;
    const addr = (this.r[rb]! + offset) >>> 0;
    if (load) this.r[rd] = this.bus.read16(addr & ~1) & 0xffff;
    else this.bus.write16(addr & ~1, this.r[rd]! & 0xffff);
  }

  private thumbSpRel(op: number): void {
    // format 11: LDR/STR Rd, [SP, #imm8*4]
    const load = (op & (1 << 11)) !== 0;
    const rd = (op >>> 8) & 0x7;
    const addr = (this.r[13]! + (op & 0xff) * 4) >>> 0;
    if (load) this.r[rd] = this.ldrWord(addr);
    else this.bus.write32(addr & ~3, this.r[rd]!);
  }

  private thumbLoadAddr(op: number): void {
    // format 12: ADD Rd, PC/SP, #imm8*4
    const useSp = (op & (1 << 11)) !== 0;
    const rd = (op >>> 8) & 0x7;
    const base = useSp ? this.r[13]! >>> 0 : ((this.r[15] + 4) & ~3) >>> 0;
    this.r[rd] = (base + (op & 0xff) * 4) | 0;
  }

  private thumbAddSp(op: number): void {
    // format 13: ADD SP, #±imm7*4
    const offset = (op & 0x7f) * 4;
    this.r[13] = (this.r[13]! + (op & (1 << 7) ? -offset : offset)) | 0;
  }

  private thumbPushPop(op: number): void {
    // format 14
    const load = (op & (1 << 11)) !== 0;
    const pcLr = (op & (1 << 8)) !== 0;
    const list = op & 0xff;
    let sp = this.r[13]! >>> 0;
    if (load) {
      // POP
      for (let i = 0; i < 8; i += 1) {
        if (list & (1 << i)) {
          this.r[i] = this.bus.read32(sp & ~3) | 0;
          sp = (sp + 4) >>> 0;
        }
      }
      if (pcLr) {
        this.write(15, this.bus.read32(sp & ~3) & ~1);
        sp = (sp + 4) >>> 0;
      }
      this.r[13] = sp | 0;
    } else {
      // PUSH
      let count = pcLr ? 1 : 0;
      for (let i = 0; i < 8; i += 1) if (list & (1 << i)) count += 1;
      sp = (sp - count * 4) >>> 0;
      let addr = sp;
      for (let i = 0; i < 8; i += 1) {
        if (list & (1 << i)) {
          this.bus.write32(addr & ~3, this.r[i]!);
          addr = (addr + 4) >>> 0;
        }
      }
      if (pcLr) this.bus.write32(addr & ~3, this.r[14]!);
      this.r[13] = sp | 0;
    }
  }

  private thumbBlockTransfer(op: number): void {
    // format 15: LDMIA/STMIA Rb!, {rlist}
    const load = (op & (1 << 11)) !== 0;
    const rb = (op >>> 8) & 0x7;
    const list = op & 0xff;
    let addr = this.r[rb]! >>> 0;
    if (list === 0) {
      // empty list: transfers PC, Rb += 0x40 (edge case)
      if (load) this.write(15, this.bus.read32(addr & ~3));
      else this.bus.write32(addr & ~3, (this.r[15] + 4) | 0);
      this.r[rb] = (addr + 0x40) | 0;
      return;
    }
    for (let i = 0; i < 8; i += 1) {
      if ((list & (1 << i)) === 0) continue;
      if (load) this.r[i] = this.bus.read32(addr & ~3) | 0;
      else this.bus.write32(addr & ~3, this.r[i]!);
      addr = (addr + 4) >>> 0;
    }
    if (!(load && list & (1 << rb))) this.r[rb] = addr | 0; // writeback unless Rb was loaded
  }

  private thumbCondBranch(op: number): void {
    // format 16
    const cond = (op >>> 8) & 0xf;
    if (!this.cond(cond)) return;
    const offset = ((op & 0xff) << 24) >> 24; // sign-extend 8-bit
    this.write(15, (this.read(15) + offset * 2) | 0);
  }

  private thumbSwi(comment: number): void {
    if (this.onSwi) {
      this.onSwi(comment);
      return;
    } // HLE: fall through to next instruction
    const ret = (this.r[15] + 2) | 0;
    const saved = this.cpsr;
    this.switchMode(MODE_SVC);
    this.spsr = saved;
    this.r[14] = ret;
    this.cpsr = (this.cpsr & ~F_T) | F_I;
    this.r[15] = 0x08;
    this.branched = true;
  }

  private thumbBranch(op: number): void {
    // format 18: unconditional
    const offset = ((op & 0x7ff) << 21) >> 21; // sign-extend 11-bit
    this.write(15, (this.read(15) + offset * 2) | 0);
  }

  private thumbLongBranch(op: number): void {
    // format 19: BL (two halves)
    if ((op & (1 << 11)) === 0) {
      // High part: LR = PC + (signext offset11 << 12)
      const offset = ((op & 0x7ff) << 21) >> 21;
      this.r[14] = (this.read(15) + (offset << 12)) | 0;
    } else {
      // Low part: PC = LR + (offset11 << 1); LR = old PC | 1
      const next = (this.r[15] + 2) | 1;
      this.write(15, (this.r[14]! + ((op & 0x7ff) << 1)) | 0);
      this.r[14] = next;
    }
  }
}
