/**
 * gba-bus.ts — the Game Boy Advance system: the memory map the ARM7 drives, the
 * 4 DMA channels, the 4 timers, the interrupt controller, and a high-level
 * emulation of the BIOS SWI calls (so no copyrighted BIOS image is needed).
 *
 * The PPU (gba-ppu.ts) and APU hang off this: the PPU drives VCOUNT/DISPSTAT and
 * fires the V-blank / H-blank DMA + IRQ events; this module owns everything else
 * the CPU can touch. Memory is split into the standard GBA regions (BIOS, EWRAM,
 * IWRAM, IO, palette, VRAM, OAM, ROM, save) with their mirroring.
 */
import { Arm7 } from './gba-arm7';
import { GbaPpu } from './gba-ppu';
import { GbaApu } from './gba-apu';

/** GBA joypad state (true = pressed). */
export interface GbaButtons {
  a: boolean; b: boolean; select: boolean; start: boolean;
  right: boolean; left: boolean; up: boolean; down: boolean; r: boolean; l: boolean;
}

// IRQ bit positions (IE/IF).
export const IRQ_VBLANK = 0;
export const IRQ_HBLANK = 1;
export const IRQ_VCOUNT = 2;
export const IRQ_TIMER0 = 3;
export const IRQ_DMA0 = 8;
export const IRQ_KEYPAD = 12;

const TIMER_PRESCALE = [1, 64, 256, 1024];

export class Gba {
  readonly cpu: Arm7;

  // Memory regions.
  readonly bios = new Uint8Array(0x4000);
  readonly ewram = new Uint8Array(0x40000); // 256 KiB
  readonly iwram = new Uint8Array(0x8000); // 32 KiB
  readonly io = new Uint8Array(0x400);
  readonly palette = new Uint8Array(0x400);
  readonly vram = new Uint8Array(0x18000); // 96 KiB
  readonly oam = new Uint8Array(0x400);
  rom: Uint8Array = new Uint8Array(0);
  readonly sram = new Uint8Array(0x20000); // 128 KiB (Flash 1 Mbit, e.g. FireRed)

  // Flash command state machine (FireRed uses a 1 Mbit / 128 KiB flash, 2 banks).
  private flashBank = 0;
  private flashId = false;
  private flashSeq = 0;
  private flashWriteArm = false;
  private flashBankArm = false;

  // Keypad: 10 bits, active-low (1 = released). Bit order: A B Sel Sta R L U D R L.
  keyinput = 0x3ff;

  // Optional debug write tap (addr, value, byteWidth). Used by trace tooling only.
  onWrite: ((addr: number, value: number, width: number) => void) | null = null;

  // DMA channel state (latched on enable).
  private readonly dmaSrc = new Uint32Array(4);
  private readonly dmaDst = new Uint32Array(4);
  private readonly dmaCount = new Uint32Array(4);
  private readonly dmaCtrl = new Uint16Array(4);
  private readonly dmaSrcLatch = new Uint32Array(4);
  private readonly dmaDstLatch = new Uint32Array(4);
  private readonly dmaCountLatch = new Uint32Array(4);

  // Timer state.
  private readonly tmCounter = new Uint16Array(4);
  private readonly tmReload = new Uint16Array(4);
  private readonly tmCtrl = new Uint16Array(4);
  private readonly tmFrac = new Int32Array(4); // prescaler accumulator

  readonly ppu: GbaPpu;
  apu: GbaApu | null = null;

  constructor() {
    this.cpu = new Arm7(this);
    this.cpu.onSwi = (n) => this.swi(n);
    this.ppu = new GbaPpu(this);
  }

  /** Install a minimal BIOS IRQ dispatcher at 0x18 (we ship no copyrighted BIOS). */
  private installBiosIrqStub(): void {
    // Standard handler: save regs, jump to the user handler at [0x03FFFFFC], return.
    const stub = [0xe92d500f, 0xe3a00301, 0xe28fe000, 0xe510f004, 0xe8bd500f, 0xe25ef004];
    for (let i = 0; i < stub.length; i += 1) {
      const a = 0x18 + i * 4;
      this.bios[a] = stub[i]! & 0xff;
      this.bios[a + 1] = (stub[i]! >> 8) & 0xff;
      this.bios[a + 2] = (stub[i]! >> 16) & 0xff;
      this.bios[a + 3] = (stub[i]! >>> 24) & 0xff;
    }
  }

  loadRom(data: Uint8Array): void {
    this.rom = data;
    this.reset();
  }

  reset(): void {
    this.cpu.reset();
    this.installBiosIrqStub();
    // Skip the BIOS boot: enter the cart at 0x08000000 in System mode, with the
    // SP values the BIOS would have set up for User/IRQ/SVC stacks.
    this.cpu.cpsr = 0x1f;
    this.cpu.r[13] = 0x03007f00; // user/system stack
    this.cpu.setBankedSp(0x12, 0x03007fa0); // IRQ stack
    this.cpu.setBankedSp(0x13, 0x03007fe0); // SVC stack
    this.cpu.r[15] = 0x08000000;
    this.io.fill(0);
    this.keyinput = 0x3ff;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Memory bus
  // ════════════════════════════════════════════════════════════════════════════
  private vramOffset(addr: number): number {
    let a = addr & 0x1ffff;
    if (a >= 0x18000) a -= 0x8000; // 0x18000-0x1FFFF mirrors 0x10000-0x17FFF
    return a;
  }

  // ── Flash save (1 Mbit) ─────────────────────────────────────────────────────
  private flashRead8(addr: number): number {
    if (this.flashId) {
      const a = addr & 0xffff;
      if (a === 0) return 0x62; // Sanyo manufacturer ID (a 128 KiB part FireRed accepts)
      if (a === 1) return 0x13; // device ID
      return 0xff;
    }
    return this.sram[this.flashBank * 0x10000 + (addr & 0xffff)]!;
  }
  private flashWrite8(addr: number, value: number): void {
    const a = addr & 0xffff;
    if (this.flashWriteArm) { this.sram[this.flashBank * 0x10000 + a] = value; this.flashWriteArm = false; this.flashSeq = 0; return; }
    if (this.flashBankArm) { this.flashBank = value & 1; this.flashBankArm = false; this.flashSeq = 0; return; }
    if (this.flashSeq === 0 && a === 0x5555 && value === 0xaa) { this.flashSeq = 1; return; }
    if (this.flashSeq === 1 && a === 0x2aaa && value === 0x55) { this.flashSeq = 2; return; }
    if (this.flashSeq === 2 && a === 0x5555) {
      switch (value) {
        case 0x90: this.flashId = true; this.flashSeq = 0; return; // enter ID mode
        case 0xf0: this.flashId = false; this.flashSeq = 0; return; // exit ID mode
        case 0xa0: this.flashWriteArm = true; this.flashSeq = 0; return; // program a byte
        case 0xb0: this.flashBankArm = true; this.flashSeq = 0; return; // bank switch
        case 0x80: this.flashSeq = 3; return; // erase setup
        default: this.flashSeq = 0; return;
      }
    }
    if (this.flashSeq === 3 && a === 0x5555 && value === 0xaa) { this.flashSeq = 4; return; }
    if (this.flashSeq === 4 && a === 0x2aaa && value === 0x55) { this.flashSeq = 5; return; }
    if (this.flashSeq === 5) {
      if (a === 0x5555 && value === 0x10) this.sram.fill(0xff); // chip erase
      else if (value === 0x30) { const s = this.flashBank * 0x10000 + (a & 0xf000); for (let i = 0; i < 0x1000; i += 1) this.sram[s + i] = 0xff; } // sector erase
      this.flashSeq = 0; return;
    }
    this.flashSeq = 0;
  }

  read8(addr: number): number {
    addr >>>= 0;
    switch ((addr >>> 24) & 0xf) {
      case 0x0: case 0x1: return this.bios[addr & 0x3fff]!;
      case 0x2: return this.ewram[addr & 0x3ffff]!;
      case 0x3: return this.iwram[addr & 0x7fff]!;
      case 0x4: return this.readIO8(addr & 0x3ff);
      case 0x5: return this.palette[addr & 0x3ff]!;
      case 0x6: return this.vram[this.vramOffset(addr)]!;
      case 0x7: return this.oam[addr & 0x3ff]!;
      case 0x8: case 0x9: case 0xa: case 0xb: case 0xc: case 0xd:
        return this.rom[addr & 0x1ffffff] ?? 0;
      case 0xe: case 0xf: return this.flashRead8(addr);
      default: return 0;
    }
  }
  read16(addr: number): number {
    addr >>>= 0;
    const a = addr & ~1;
    switch ((a >>> 24) & 0xf) {
      case 0x0: case 0x1: return this.bios[a & 0x3fff]! | (this.bios[(a & 0x3fff) + 1]! << 8);
      case 0x2: { const o = a & 0x3ffff; return this.ewram[o]! | (this.ewram[o + 1]! << 8); }
      case 0x3: { const o = a & 0x7fff; return this.iwram[o]! | (this.iwram[o + 1]! << 8); }
      case 0x4: return this.readIO16(a & 0x3ff);
      case 0x5: { const o = a & 0x3ff; return this.palette[o]! | (this.palette[o + 1]! << 8); }
      case 0x6: { const o = this.vramOffset(a); return this.vram[o]! | (this.vram[o + 1]! << 8); }
      case 0x7: { const o = a & 0x3ff; return this.oam[o]! | (this.oam[o + 1]! << 8); }
      case 0x8: case 0x9: case 0xa: case 0xb: case 0xc: case 0xd: {
        const o = a & 0x1ffffff; return (this.rom[o] ?? 0) | ((this.rom[o + 1] ?? 0) << 8);
      }
      case 0xe: case 0xf: return this.flashRead8(a) | (this.flashRead8(a + 1) << 8);
      default: return 0;
    }
  }
  read32(addr: number): number {
    const a = addr & ~3;
    return ((this.read16(a) | (this.read16(a + 2) << 16))) >>> 0;
  }

  write8(addr: number, value: number): void {
    addr >>>= 0;
    value &= 0xff;
    if (this.onWrite) this.onWrite(addr, value, 1);
    switch ((addr >>> 24) & 0xf) {
      case 0x2: this.ewram[addr & 0x3ffff] = value; return;
      case 0x3: this.iwram[addr & 0x7fff] = value; return;
      case 0x4: this.writeIO8(addr & 0x3ff, value); return;
      // Palette/VRAM/OAM ignore 8-bit writes on real hardware (or mirror to 16-bit);
      // games don't rely on byte writes here for OAM. Palette/VRAM byte write = halfword.
      case 0x5: { const o = (addr & 0x3ff) & ~1; this.palette[o] = value; this.palette[o + 1] = value; return; }
      case 0x6: { const o = this.vramOffset(addr) & ~1; this.vram[o] = value; this.vram[o + 1] = value; return; }
      case 0xe: case 0xf: this.flashWrite8(addr, value); return;
      default: return;
    }
  }
  write16(addr: number, value: number): void {
    addr >>>= 0;
    value &= 0xffff;
    if (this.onWrite) this.onWrite(addr, value, 2);
    const a = addr & ~1;
    switch ((a >>> 24) & 0xf) {
      case 0x2: { const o = a & 0x3ffff; this.ewram[o] = value & 0xff; this.ewram[o + 1] = value >> 8; return; }
      case 0x3: { const o = a & 0x7fff; this.iwram[o] = value & 0xff; this.iwram[o + 1] = value >> 8; return; }
      case 0x4: this.writeIO16(a & 0x3ff, value); return;
      case 0x5: { const o = a & 0x3ff; this.palette[o] = value & 0xff; this.palette[o + 1] = value >> 8; return; }
      case 0x6: { const o = this.vramOffset(a); this.vram[o] = value & 0xff; this.vram[o + 1] = value >> 8; return; }
      case 0x7: { const o = a & 0x3ff; this.oam[o] = value & 0xff; this.oam[o + 1] = value >> 8; return; }
      case 0xe: case 0xf: this.flashWrite8(a, value & 0xff); return;
      default: return;
    }
  }
  write32(addr: number, value: number): void {
    const a = addr & ~3;
    this.write16(a, value & 0xffff);
    this.write16(a + 2, (value >>> 16) & 0xffff);
  }

  // ── IO registers ────────────────────────────────────────────────────────────
  private readIO16(off: number): number {
    if (off === 0x130) return this.keyinput & 0x3ff; // KEYINPUT
    // Timer counter-low (0x100/4/8/C) reads the live COUNTER (write set the reload).
    if (off === 0x100 || off === 0x104 || off === 0x108 || off === 0x10c) {
      return this.tmCounter[(off - 0x100) >> 2]!;
    }
    return this.io[off]! | (this.io[off + 1]! << 8);
  }
  private readIO8(off: number): number {
    return (this.readIO16(off & ~1) >> ((off & 1) * 8)) & 0xff;
  }
  private writeIO16(off: number, value: number): void {
    value &= 0xffff;
    // IF (0x202): writing a 1-bit acknowledges (clears) that interrupt.
    if (off === 0x202) {
      const cur = this.io[0x202]! | (this.io[0x203]! << 8);
      const next = cur & ~value;
      this.io[0x202] = next & 0xff; this.io[0x203] = next >> 8;
      return;
    }
    // DirectSound FIFO writes (0xA0-0xA3 = FIFO A, 0xA4-0xA7 = FIFO B) — write-only.
    if (this.apu) {
      if (off === 0xa0 || off === 0xa2) { this.apu.pushFifoA(value & 0xff); this.apu.pushFifoA((value >> 8) & 0xff); return; }
      if (off === 0xa4 || off === 0xa6) { this.apu.pushFifoB(value & 0xff); this.apu.pushFifoB((value >> 8) & 0xff); return; }
      if (off === 0x82) this.apu.writeControlH(value); // SOUNDCNT_H
      if (off === 0x84) this.apu.writeControlX(value); // SOUNDCNT_X
    }
    this.io[off] = value & 0xff;
    this.io[off + 1] = value >> 8;
    // Timer reload-low writes (0x100/4/8/C) set the reload latch, not the counter.
    if (off === 0x100 || off === 0x104 || off === 0x108 || off === 0x10c) {
      this.tmReload[(off - 0x100) >> 2] = value;
      return;
    }
    // DMA control writes (0xBA, 0xC6, 0xD2, 0xDE) may start a transfer.
    for (let ch = 0; ch < 4; ch += 1) {
      if (off === 0xba + ch * 0xc) this.dmaControlWrite(ch, value);
    }
    // Timer control writes (0x102, 0x106, 0x10A, 0x10E).
    for (let ch = 0; ch < 4; ch += 1) {
      if (off === 0x102 + ch * 4) this.timerControlWrite(ch, value);
    }
  }
  private writeIO8(off: number, value: number): void {
    const cur = this.readIO16(off & ~1);
    const next = (off & 1) ? (cur & 0x00ff) | (value << 8) : (cur & 0xff00) | value;
    this.writeIO16(off & ~1, next);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Interrupts
  // ════════════════════════════════════════════════════════════════════════════
  raiseIrq(bit: number): void {
    const flag = this.io[0x202]! | (this.io[0x203]! << 8);
    const next = flag | (1 << bit);
    this.io[0x202] = next & 0xff; this.io[0x203] = next >> 8;
    this.checkIrq();
  }
  checkIrq(): void {
    const ime = (this.io[0x208]! & 1) !== 0;
    const ie = this.io[0x200]! | (this.io[0x201]! << 8);
    const iff = this.io[0x202]! | (this.io[0x203]! << 8);
    if (ime && (ie & iff) !== 0) this.cpu.irq();
  }

  // ════════════════════════════════════════════════════════════════════════════
  // DMA
  // ════════════════════════════════════════════════════════════════════════════
  private dmaControlWrite(ch: number, ctrlHi: number): void {
    const base = 0xb0 + ch * 0xc;
    this.dmaSrc[ch] = (this.io[base]! | (this.io[base + 1]! << 8) | (this.io[base + 2]! << 16) | (this.io[base + 3]! << 24)) >>> 0;
    this.dmaDst[ch] = (this.io[base + 4]! | (this.io[base + 5]! << 8) | (this.io[base + 6]! << 16) | (this.io[base + 7]! << 24)) >>> 0;
    this.dmaCount[ch] = this.io[base + 8]! | (this.io[base + 9]! << 8);
    this.dmaCtrl[ch] = ctrlHi;
    const enabled = (ctrlHi & 0x8000) !== 0;
    if (!enabled) return;
    // Latch src/dst/count at enable.
    this.dmaSrcLatch[ch] = this.dmaSrc[ch]!;
    this.dmaDstLatch[ch] = this.dmaDst[ch]!;
    this.dmaCountLatch[ch] = this.dmaCount[ch]! === 0 ? (ch === 3 ? 0x10000 : 0x4000) : this.dmaCount[ch]!;
    const timing = (ctrlHi >> 12) & 0x3;
    if (timing === 0) this.runDma(ch); // immediate
  }

  /** Run pending DMA for a timing event (1=VBlank, 2=HBlank, 3=special). */
  triggerDma(timing: number): void {
    for (let ch = 0; ch < 4; ch += 1) {
      const ctrl = this.dmaCtrl[ch]!;
      if ((ctrl & 0x8000) === 0) continue;
      if (((ctrl >> 12) & 0x3) === timing) this.runDma(ch);
    }
  }

  private runDma(ch: number): void {
    const ctrl = this.dmaCtrl[ch]!;
    const word = (ctrl & 0x0400) !== 0; // bit10: 1=32-bit, 0=16-bit
    const dstMode = (ctrl >> 5) & 0x3; // 0=inc 1=dec 2=fixed 3=inc/reload
    const srcMode = (ctrl >> 7) & 0x3;
    const size = word ? 4 : 2;
    let src = this.dmaSrcLatch[ch]! >>> 0;
    let dst = this.dmaDstLatch[ch]! >>> 0;
    const count = this.dmaCountLatch[ch]!;
    const sStep = srcMode === 0 ? size : srcMode === 1 ? -size : 0;
    const dStep = dstMode === 0 || dstMode === 3 ? size : dstMode === 1 ? -size : 0;
    for (let i = 0; i < count; i += 1) {
      if (word) this.write32(dst, this.read32(src));
      else this.write16(dst, this.read16(src));
      src = (src + sStep) >>> 0;
      dst = (dst + dStep) >>> 0;
    }
    this.dmaSrcLatch[ch] = src;
    if (dstMode !== 3) this.dmaDstLatch[ch] = dst;
    // Repeat bit (14) keeps it armed for the next timing event; else disable.
    if ((ctrl & 0x0200) === 0 || ((ctrl >> 12) & 0x3) === 0) {
      this.dmaCtrl[ch] = ctrl & ~0x8000;
      const base = 0xb0 + ch * 0xc;
      this.io[base + 11] = this.io[base + 11]! & 0x7f; // clear enable bit in IO mirror
    }
    if (ctrl & 0x4000) this.raiseIrq(IRQ_DMA0 + ch); // IRQ on completion
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Timers
  // ════════════════════════════════════════════════════════════════════════════
  private timerControlWrite(ch: number, ctrl: number): void {
    const wasEnabled = (this.tmCtrl[ch]! & 0x80) !== 0;
    const nowEnabled = (ctrl & 0x80) !== 0;
    if (!wasEnabled && nowEnabled) {
      // Rising edge of enable reloads the counter.
      this.tmCounter[ch] = this.tmReload[ch]!;
      this.tmFrac[ch] = 0;
    }
    this.tmCtrl[ch] = ctrl;
  }

  stepTimers(cycles: number): void {
    for (let ch = 0; ch < 4; ch += 1) {
      const ctrl = this.tmCtrl[ch]!;
      if ((ctrl & 0x80) === 0) continue; // disabled
      if ((ctrl & 0x4) !== 0) continue; // count-up (cascade) — driven by the lower timer's overflow
      const prescale = TIMER_PRESCALE[ctrl & 0x3]!;
      this.tmFrac[ch] += cycles;
      while (this.tmFrac[ch]! >= prescale) {
        this.tmFrac[ch] -= prescale;
        this.timerIncrement(ch);
      }
    }
  }

  private timerIncrement(ch: number): void {
    let v = this.tmCounter[ch]! + 1;
    if (v > 0xffff) {
      v = this.tmReload[ch]!;
      if (this.tmCtrl[ch]! & 0x40) this.raiseIrq(IRQ_TIMER0 + ch); // overflow IRQ
      if (this.apu && ch < 2) this.apu.onTimerOverflow(ch); // clock the DirectSound FIFOs
      // Cascade: if the next timer is in count-up mode + enabled, tick it.
      if (ch < 3 && (this.tmCtrl[ch + 1]! & 0x84) === 0x84) this.timerIncrement(ch + 1);
    }
    this.tmCounter[ch] = v;
  }

  /** Refill a DirectSound FIFO via its DMA (always 4 words, dest fixed). */
  private runSoundDma(ch: number): void {
    const ctrl = this.dmaCtrl[ch]!;
    if ((ctrl & 0x8000) === 0 || ((ctrl >> 12) & 3) !== 3) return; // not an active special-timing DMA
    let src = this.dmaSrcLatch[ch]! >>> 0;
    const dst = this.dmaDstLatch[ch]! >>> 0; // FIFO address (fixed)
    for (let i = 0; i < 4; i += 1) { this.write32(dst, this.read32(src)); src = (src + 4) >>> 0; }
    this.dmaSrcLatch[ch] = src;
    if (ctrl & 0x4000) this.raiseIrq(IRQ_DMA0 + ch);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // BIOS high-level emulation (SWI)
  // ════════════════════════════════════════════════════════════════════════════
  /** Called by the CPU when a SWI executes; r0-r3 are the in/out registers. */
  swi(comment: number): void {
    const r = this.cpu.r;
    switch (comment) {
      case 0x00: { // SoftReset — re-enter the cart (or EWRAM) with fresh stacks.
        const flag = this.read8(0x03007ffa);
        for (let a = 0x7e00; a < 0x8000; a += 1) this.iwram[a] = 0; // clear top 0x200 of IWRAM
        const entry = flag === 0 ? 0x08000000 : 0x02000000;
        this.cpu.reset();
        this.installBiosIrqStub();
        this.cpu.cpsr = 0x1f; // System mode, ARM
        this.cpu.r[13] = 0x03007f00;
        this.cpu.setBankedSp(0x12, 0x03007fa0); // IRQ
        this.cpu.setBankedSp(0x13, 0x03007fe0); // SVC
        this.cpu.forceBranch(entry);
        return;
      }
      case 0x01: { // RegisterRamReset — clear the selected RAM/IO regions.
        const f = r[0]! & 0xff;
        if (f & 0x01) this.ewram.fill(0);
        if (f & 0x02) for (let a = 0; a < 0x7e00; a += 1) this.iwram[a] = 0; // keep top 0x200
        if (f & 0x04) this.palette.fill(0);
        if (f & 0x08) this.vram.fill(0);
        if (f & 0x10) this.oam.fill(0);
        this.writeIO16(0x00, 0x0080); // DISPCNT → forced blank (post-reset state)
        return;
      }
      case 0x02: this.cpu.halted = true; return; // Halt
      case 0x04: case 0x05: this.cpu.halted = true; return; // IntrWait / VBlankIntrWait
      case 0x06: { // Div: r0/r1 → r0=quot, r1=rem, r3=abs(quot)
        const n = r[0]! | 0, d = r[1]! | 0;
        if (d !== 0) { const q = (n / d) | 0; r[0] = q; r[1] = (n % d) | 0; r[3] = Math.abs(q) | 0; }
        return;
      }
      case 0x07: { // DivArm: r1/r0
        const n = r[1]! | 0, d = r[0]! | 0;
        if (d !== 0) { const q = (n / d) | 0; r[0] = q; r[1] = (n % d) | 0; r[3] = Math.abs(q) | 0; }
        return;
      }
      case 0x08: r[0] = Math.floor(Math.sqrt(r[0]! >>> 0)) | 0; return; // Sqrt
      case 0x09: { // ArcTan
        const x = (r[0]! << 16) >> 16; r[0] = Math.round(Math.atan(x / 16384) * 0x4000 / (Math.PI / 2)) & 0xffff; return;
      }
      case 0x0a: { // ArcTan2
        const x = (r[0]! << 16) >> 16, y = (r[1]! << 16) >> 16;
        let t = Math.atan2(y, x) / (2 * Math.PI); if (t < 0) t += 1; r[0] = Math.round(t * 0x10000) & 0xffff; return;
      }
      case 0x0b: return this.cpuSet(r[0]! >>> 0, r[1]! >>> 0, r[2]! >>> 0, false);
      case 0x0c: return this.cpuSet(r[0]! >>> 0, r[1]! >>> 0, r[2]! >>> 0, true);
      case 0x0d: r[0] = 0xbaae187f; return; // GetBiosChecksum (GBA value)
      case 0x11: case 0x12: return this.lz77(r[0]! >>> 0, r[1]! >>> 0); // LZ77UnComp Wram/Vram
      case 0x14: case 0x15: return this.rlUnComp(r[0]! >>> 0, r[1]! >>> 0); // RLUnComp Wram/Vram
      default: return; // unimplemented SWIs are no-ops (best-effort HLE)
    }
  }

  private cpuSet(src: number, dst: number, ctrl: number, fast: boolean): void {
    const count = ctrl & 0x1fffff;
    const fill = (ctrl & (1 << 24)) !== 0;
    const word = fast || (ctrl & (1 << 26)) !== 0;
    if (word) {
      const n = fast ? count & ~7 : count; // CpuFastSet works in 8-word blocks
      let s = src & ~3, d = dst & ~3;
      const fillVal = this.read32(s);
      for (let i = 0; i < n; i += 1) {
        this.write32(d, fill ? fillVal : this.read32(s));
        if (!fill) s = (s + 4) >>> 0;
        d = (d + 4) >>> 0;
      }
    } else {
      let s = src & ~1, d = dst & ~1;
      const fillVal = this.read16(s);
      for (let i = 0; i < count; i += 1) {
        this.write16(d, fill ? fillVal : this.read16(s));
        if (!fill) s = (s + 2) >>> 0;
        d = (d + 2) >>> 0;
      }
    }
  }

  /** GBA BIOS LZ77 decompression (compression type 1). */
  private lz77(src: number, dst: number): void {
    const header = this.read32(src);
    let size = header >>> 8;
    let s = (src + 4) >>> 0;
    let d = dst >>> 0;
    while (size > 0) {
      const flags = this.read8(s); s = (s + 1) >>> 0;
      for (let bit = 7; bit >= 0 && size > 0; bit -= 1) {
        if (flags & (1 << bit)) {
          const b1 = this.read8(s); const b2 = this.read8((s + 1) >>> 0); s = (s + 2) >>> 0;
          const len = (b1 >> 4) + 3;
          const disp = (((b1 & 0xf) << 8) | b2) + 1;
          for (let i = 0; i < len && size > 0; i += 1) {
            this.write8(d, this.read8((d - disp) >>> 0));
            d = (d + 1) >>> 0; size -= 1;
          }
        } else {
          this.write8(d, this.read8(s)); s = (s + 1) >>> 0; d = (d + 1) >>> 0; size -= 1;
        }
      }
    }
  }

  /** GBA BIOS run-length decompression (compression type 3). */
  private rlUnComp(src: number, dst: number): void {
    let size = this.read32(src) >>> 8;
    let s = (src + 4) >>> 0;
    let d = dst >>> 0;
    while (size > 0) {
      const flag = this.read8(s); s = (s + 1) >>> 0;
      if (flag & 0x80) {
        const len = (flag & 0x7f) + 3;
        const v = this.read8(s); s = (s + 1) >>> 0;
        for (let i = 0; i < len && size > 0; i += 1) { this.write8(d, v); d = (d + 1) >>> 0; size -= 1; }
      } else {
        const len = (flag & 0x7f) + 1;
        for (let i = 0; i < len && size > 0; i += 1) { this.write8(d, this.read8(s)); s = (s + 1) >>> 0; d = (d + 1) >>> 0; size -= 1; }
      }
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Frame loop — drives the CPU, timers, and PPU through one 228-line frame
  // ════════════════════════════════════════════════════════════════════════════
  private setDispstatBit(bit: number, on: boolean): void {
    let ds = this.io[0x04]! | (this.io[0x05]! << 8);
    if (on) ds |= bit; else ds &= ~bit;
    this.io[0x04] = ds & 0xff; this.io[0x05] = (ds >> 8) & 0xff;
  }

  /** Run the CPU for ~`target` cycles, stepping timers/APU and honouring HALT. */
  private runCycles(target: number): void {
    let done = 0;
    while (done < target) {
      if (this.cpu.halted) { this.stepTimers(target - done); if (this.apu) { this.apu.step(target - done); this.serviceSoundDma(); } return; }
      const c = this.cpu.step();
      this.stepTimers(c);
      if (this.apu) { this.apu.step(c); this.serviceSoundDma(); }
      done += c;
    }
  }

  /** Refill the DirectSound FIFOs whenever a timer overflow drained them. */
  private serviceSoundDma(): void {
    if (!this.apu) return;
    if (this.apu.dmaReqA) { this.apu.dmaReqA = false; this.runSoundDma(1); }
    if (this.apu.dmaReqB) { this.apu.dmaReqB = false; this.runSoundDma(2); }
  }

  /** Emulate exactly one video frame, producing ppu.frame. */
  runFrame(): void {
    const VISIBLE = 960, HBLANK = 272; // approximate cycles (1 instr ≈ 1 unit for now)
    for (let line = 0; line < 228; line += 1) {
      this.io[0x06] = line & 0xff; this.io[0x07] = (line >> 8) & 0xff; // VCOUNT
      const dispstat = this.io[0x04]! | (this.io[0x05]! << 8);
      // VCount match.
      const vcMatch = ((dispstat >> 8) & 0xff) === line;
      this.setDispstatBit(0x04, vcMatch);
      if (vcMatch && (dispstat & 0x20)) this.raiseIrq(IRQ_VCOUNT);

      if (line === 0) this.ppu.frameStart();
      if (line === 160) {
        this.setDispstatBit(0x01, true); // VBlank flag
        if (dispstat & 0x08) this.raiseIrq(IRQ_VBLANK);
        this.triggerDma(1);
      }
      if (line === 227) this.setDispstatBit(0x01, false);

      this.runCycles(VISIBLE);

      // HBlank.
      this.setDispstatBit(0x02, true);
      if (line < 160) { this.ppu.renderScanline(line); this.triggerDma(2); }
      if (dispstat & 0x10) this.raiseIrq(IRQ_HBLANK);
      this.runCycles(HBLANK);
      this.setDispstatBit(0x02, false);
    }
  }

  /** The finished 240×160 RGBA framebuffer. */
  get frame(): Uint8Array {
    return this.ppu.frame;
  }

  /** The 128 KiB Flash save image, for persisting to a .sav file. */
  getSaveData(): Uint8Array {
    return this.sram.slice();
  }
  loadSaveData(data: Uint8Array): void {
    this.sram.set(data.subarray(0, this.sram.length));
  }

  setButtons(b: GbaButtons): void {
    let k = 0x3ff;
    if (b.a) k &= ~0x001;
    if (b.b) k &= ~0x002;
    if (b.select) k &= ~0x004;
    if (b.start) k &= ~0x008;
    if (b.right) k &= ~0x010;
    if (b.left) k &= ~0x020;
    if (b.up) k &= ~0x040;
    if (b.down) k &= ~0x080;
    if (b.r) k &= ~0x100;
    if (b.l) k &= ~0x200;
    this.keyinput = k & 0x3ff;
    // Keypad IRQ (rare): IF bit12 when configured — left to KEYCNT logic if needed.
  }
}
