/**
 * gba-bus.test.ts — unit tests for the GBA system: memory map, DMA, timers,
 * the interrupt controller, and the BIOS HLE SWIs. Run with `bun run` (NOT
 * `bun test`). Prints PASS/FAIL and exits non-zero on any failure.
 *
 * Run: bun run packages/all/example/gba-bus.test.ts
 */
import { Gba } from './gba-bus';

let failures = 0;
function check(name: string, cond: boolean, got?: unknown, want?: unknown): void {
  if (cond) console.log(`PASS  ${name}`);
  else {
    console.log(`FAIL  ${name}${got !== undefined ? `  got=${fmt(got)} want=${fmt(want)}` : ''}`);
    failures += 1;
  }
}
const fmt = (v: unknown): string => (typeof v === 'number' ? `0x${(v >>> 0).toString(16)}` : String(v));

function freshGba(): Gba {
  const g = new Gba();
  g.loadRom(new Uint8Array(0x200)); // tiny dummy ROM
  return g;
}

// ── Memory map ───────────────────────────────────────────────────────────────
{
  const g = freshGba();
  g.write32(0x02000000, 0xdeadbeef);
  check('EWRAM 32-bit round-trip', g.read32(0x02000000) >>> 0 === 0xdeadbeef, g.read32(0x02000000), 0xdeadbeef);
  g.write16(0x03000010, 0x1234);
  check('IWRAM 16-bit round-trip', g.read16(0x03000010) === 0x1234, g.read16(0x03000010), 0x1234);
  g.write16(0x06000000, 0xabcd);
  check('VRAM mirror 0x06010000→hi', g.read16(0x06000000) === 0xabcd);
}

// ── DMA immediate transfer ───────────────────────────────────────────────────
{
  const g = freshGba();
  for (let i = 0; i < 4; i += 1) g.write32(0x02000000 + i * 4, 0x1000 + i);
  g.write32(0x040000b0, 0x02000000); // DMA0 source
  g.write32(0x040000b4, 0x03000100); // DMA0 dest
  g.write16(0x040000b8, 4); // count = 4 units
  g.write16(0x040000ba, 0x8400); // enable + 32-bit + immediate
  let ok = true;
  for (let i = 0; i < 4; i += 1) if (g.read32(0x03000100 + i * 4) >>> 0 !== 0x1000 + i) ok = false;
  check('DMA0 immediate copied 4 words', ok, g.read32(0x03000100), 0x1000);
  check('DMA0 enable bit cleared after non-repeat', (g.read16(0x040000ba) & 0x8000) === 0);
}

// ── Timer overflow + IRQ ─────────────────────────────────────────────────────
{
  const g = freshGba();
  g.write16(0x04000200, 1 << 3); // IE: enable timer0 IRQ
  g.write16(0x04000208, 1); // IME on
  g.write16(0x04000100, 0xfffe); // TM0 reload = 0xFFFE
  g.write16(0x04000102, 0xc0 | 0x00); // enable + IRQ-on-overflow, prescale 1
  check('timer reloaded on enable', g.read16(0x04000100) === 0xfffe, g.read16(0x04000100), 0xfffe);
  g.stepTimers(1); // → 0xFFFF
  check('timer counts up', g.read16(0x04000100) === 0xffff, g.read16(0x04000100), 0xffff);
  g.stepTimers(1); // → overflow → reload 0xFFFE + IRQ
  check('timer reloaded after overflow', g.read16(0x04000100) === 0xfffe, g.read16(0x04000100), 0xfffe);
  check('timer overflow raised IF', (g.read16(0x04000202) & (1 << 3)) !== 0);
}

// ── Timer cascade (count-up) ─────────────────────────────────────────────────
{
  const g = freshGba();
  g.write16(0x04000100, 0xffff); // TM0 reload
  g.write16(0x04000104, 0x0000); // TM1 reload
  g.write16(0x04000106, 0x84); // TM1: enable + count-up (cascade)
  g.write16(0x04000102, 0x80); // TM0: enable, prescale 1
  g.stepTimers(1); // TM0 0xFFFF→overflow→reload; cascade ticks TM1 to 1
  check('cascade ticked TM1 on TM0 overflow', g.read16(0x04000104) === 1, g.read16(0x04000104), 1);
}

// ── Interrupt controller → CPU IRQ entry ─────────────────────────────────────
{
  const g = freshGba();
  g.cpu.cpsr = 0x1f; // System, IRQ enabled (I=0)
  g.cpu.r[15] = 0x08000000;
  g.write16(0x04000200, 1 << 0); // IE: VBlank
  g.write16(0x04000208, 1); // IME
  g.raiseIrq(0); // VBlank
  check('IRQ entered IRQ mode', (g.cpu.cpsr & 0x1f) === 0x12);
  check('IRQ vector PC = 0x18', g.cpu.r[15] >>> 0 === 0x18, g.cpu.r[15], 0x18);
}
{
  const g = freshGba();
  g.cpu.cpsr = 0x1f | 0x80; // IRQ DISABLED (I=1)
  g.write16(0x04000200, 1 << 0);
  g.write16(0x04000208, 1);
  g.raiseIrq(0);
  check('IRQ masked by CPSR I bit', (g.cpu.cpsr & 0x1f) === 0x1f);
}

// ── BIOS HLE SWIs ────────────────────────────────────────────────────────────
{
  const g = freshGba();
  g.cpu.r[0] = 100;
  g.cpu.r[1] = 7;
  g.swi(0x06); // Div
  check('SWI Div quotient', g.cpu.r[0] === 14, g.cpu.r[0], 14);
  check('SWI Div remainder', g.cpu.r[1] === 2, g.cpu.r[1], 2);
  check('SWI Div abs', g.cpu.r[3] === 14, g.cpu.r[3], 14);
}
{
  const g = freshGba();
  g.cpu.r[0] = -20;
  g.cpu.r[1] = 6;
  g.swi(0x06);
  check('SWI Div signed quotient', g.cpu.r[0] === -3, g.cpu.r[0], -3);
}
{
  const g = freshGba();
  g.cpu.r[0] = 144;
  g.swi(0x08); // Sqrt
  check('SWI Sqrt(144)=12', g.cpu.r[0] === 12, g.cpu.r[0], 12);
}
{
  // CpuSet fill: fill 8 halfwords at 0x03000200 with the value at 0x03000000.
  const g = freshGba();
  g.write16(0x03000000, 0x5a5a);
  g.cpu.r[0] = 0x03000000;
  g.cpu.r[1] = 0x03000200;
  g.cpu.r[2] = 8 | (1 << 24); // count 8, fill, halfword
  g.swi(0x0b);
  check('SWI CpuSet fill', g.read16(0x03000200) === 0x5a5a && g.read16(0x0300020e) === 0x5a5a);
}
{
  // LZ77: decompress "AAAA" — header (size=4, type=1) + one flag block.
  // Encode: literal 'A', then back-reference len=3 disp=1 (repeat previous byte).
  const g = freshGba();
  const src = 0x02000000,
    dst = 0x03000400;
  g.write32(src, (4 << 8) | (1 << 4)); // decompressed size 4, type 1
  // flag byte: bit7=0 (literal), bit6=1 (compressed) → 0b01000000 = 0x40
  g.write8(src + 4, 0x40);
  g.write8(src + 5, 0x41); // literal 'A'
  // compressed token: len=3 → (3-3)=0 in high nibble; disp=1 → (disp-1)=0
  g.write8(src + 6, 0x00);
  g.write8(src + 7, 0x00);
  g.cpu.r[0] = src;
  g.cpu.r[1] = dst;
  g.swi(0x11);
  let aaaa = true;
  for (let i = 0; i < 4; i += 1) if (g.read8(dst + i) !== 0x41) aaaa = false;
  check('SWI LZ77 decompresses AAAA', aaaa, g.read8(dst), 0x41);
}
{
  // Verify the SWI HLE hook fires from a real executed instruction (THUMB SWI).
  const g = freshGba();
  g.cpu.reset();
  g.cpu.cpsr = 0x1f | 0x20; // THUMB
  g.cpu.r[15] = 0x03000000;
  g.cpu.r[0] = 50;
  g.cpu.r[1] = 5;
  g.write16(0x03000000, 0xdf06); // THUMB SWI #6 (Div)
  g.cpu.step();
  check('executed THUMB SWI ran HLE Div', g.cpu.r[0] === 10, g.cpu.r[0], 10);
  check('HLE SWI did not vector (stayed THUMB/Sys)', g.cpu.thumb === true && (g.cpu.cpsr & 0x1f) === 0x1f);
}

console.log(failures === 0 ? '\nALL PASS' : `\n${failures} FAILURE(S)`);
if (failures > 0) process.exit(1);
