/**
 * gameboy-tty.logic.test.ts — pure-logic assertions for the terminal Game Boy /
 * Game Boy Color emulator. Run with `bun run` (NOT `bun test`, which segfaults
 * repo-wide on this workspace). It imports only the pure exports from
 * gameboy-tty.ts; main() is guarded by `import.meta.main`, so importing does NOT
 * open the terminal, console input, or audio. Prints PASS/FAIL per check and
 * exits non-zero if any fail.
 *
 * Run: bun run packages/all/example/gameboy-tty.logic.test.ts
 */
import { Term } from '@bun-win32/terminal';

import { loadCgbAcid2 } from '../../all/example/gameboy-cgb-rom';
import { loadAcid2 } from '../../all/example/gameboy-rom';
import { GameBoy, blitToTerm, cgbColor, __mapperForTest } from './gameboy-tty';

let failures = 0;
function check(name: string, cond: boolean): void {
  if (cond) {
    console.log(`PASS  ${name}`);
  } else {
    console.log(`FAIL  ${name}`);
    failures += 1;
  }
}

/** Build a minimal but valid cartridge header for direct read8/write8 tests. */
function makeFakeRom(type: number, romBanks: number, ramCode: number): Uint8Array {
  const rom = new Uint8Array(0x4000 * romBanks);
  rom[0x147] = type;
  rom[0x148] = Math.max(0, Math.ceil(Math.log2(romBanks / 2))); // banks = 2 << size
  rom[0x149] = ramCode;
  rom[0x100] = 0x00; // entry: NOP
  return rom;
}

// ── Core boots a ROM and paints a non-blank framebuffer ────────────────────────
{
  const gb = new GameBoy(loadAcid2());
  for (let i = 0; i < 60; i += 1) gb.runFrame(); // ~1 s of emulation
  check('framebuffer is 160x144 RGBA', gb.frame.length === 160 * 144 * 4);
  const seen = new Set<number>();
  for (let i = 0; i < gb.frame.length; i += 4) {
    seen.add((gb.frame[i]! << 16) | (gb.frame[i + 1]! << 8) | gb.frame[i + 2]!);
  }
  // The dmg-acid2 face is high-contrast — several distinct shades present.
  check('dmg-acid2 renders a non-flat image', seen.size > 2);
}

// ── Blit centers + fills the Term pixel grid ───────────────────────────────────
{
  const gb = new GameBoy(loadAcid2());
  for (let i = 0; i < 60; i += 1) gb.runFrame();
  const t = new Term(160, 72); // exact 1:1 (160 cols × 144 px)
  blitToTerm(t, gb.frame);
  let nonBezel = 0;
  for (let i = 0; i < t.pixels.length; i += 3) {
    if (!(t.pixels[i] === 12 && t.pixels[i + 1] === 18 && t.pixels[i + 2] === 14)) nonBezel += 1;
  }
  check('blit writes many non-bezel pixels', nonBezel > 1000);
}

// ── INPUT_RECORD field offsets (x64): KEY_EVENT down with VK_RIGHT ──────────────
{
  const REC = 20; // sizeof(INPUT_RECORD) on x64
  const buf = Buffer.alloc(REC);
  buf.writeUInt16LE(1, 0); // EventType = KEY_EVENT
  buf.writeInt32LE(1, 4); // bKeyDown = TRUE
  buf.writeUInt16LE(1, 8); // wRepeatCount
  buf.writeUInt16LE(0x27, 10); // wVirtualKeyCode = VK_RIGHT
  const isKey = buf.readUInt16LE(0) === 1;
  const isDown = buf.readInt32LE(4) !== 0;
  const vk = buf.readUInt16LE(10);
  check('INPUT_RECORD parses KEY_EVENT/down/VK_RIGHT at the right offsets', isKey && isDown && vk === 0x27);
}

// ── MBC bank math ──────────────────────────────────────────────────────────────
{
  const m = __mapperForTest(0x01, 31); // MBC1, 32 banks
  m.write(0x2000, 0x00);
  check('MBC1 bank 0 maps to 1', m.romBankFor(0x4000) === 1);
}
{
  const m = __mapperForTest(0x01, 127); // MBC1, 128 banks
  m.write(0x2000, 0x05);
  m.write(0x4000, 0x02); // upper 2 bits = 0b10 → (2<<5)|5 = 0x45
  check('MBC1 composes upper bank bits in mode 0', m.romBankFor(0x4000) === 0x45);
}
{
  const m = __mapperForTest(0x1b, 511); // MBC5, 512 banks
  m.write(0x2000, 0x00); // low byte
  m.write(0x3000, 0x01); // bit 9 → bank 0x100
  check('MBC5 builds a 9-bit ROM bank', m.romBankFor(0x4000) === 0x100);
}
{
  const m = __mapperForTest(0x13, 127); // MBC3+RAM+BATTERY
  const before = m.ramEnabled;
  m.write(0x0000, 0x0a);
  check('MBC3 RAM enable gates external RAM', !before && m.ramEnabled);
}

// ── MBC3 RTC ─────────────────────────────────────────────────────────────────
{
  const m = __mapperForTest(0x10, 127); // MBC3+TIMER+RAM+BATTERY
  m.write(0x0000, 0x0a); // enable RAM/RTC
  m.setRtcBaseSeconds(0);
  m.write(0x4000, 0x08); // map RTC seconds register
  m.advanceWallSeconds(65);
  m.write(0x6000, 0x00);
  m.write(0x6000, 0x01); // latch the live clock
  check('MBC3 RTC latch freezes seconds (65 s → 5)', m.readRam(0xa000) === 5);
}

// ── Battery save round-trip ────────────────────────────────────────────────────
{
  const rom = makeFakeRom(0x03, 4, 3); // MBC1+RAM+BATTERY, 32 KiB RAM
  const gb = new GameBoy(rom);
  gb.write8(0x0000, 0x0a); // enable RAM
  gb.write8(0xa000, 0x42);
  gb.write8(0xa123, 0x99);
  const save = gb.getSaveData();
  check('battery cart yields save data', save !== null && save.length >= 0x8000);
  const gb2 = new GameBoy(rom);
  gb2.loadSaveData(save!);
  gb2.write8(0x0000, 0x0a);
  check('battery RAM round-trips through save/load', gb2.read8(0xa000) === 0x42 && gb2.read8(0xa123) === 0x99);
  const gb3 = new GameBoy(makeFakeRom(0x00, 2, 0)); // ROM-only: no battery
  check('ROM-only cart reports no save data', gb3.getSaveData() === null);
}

// ── Game Boy Color ─────────────────────────────────────────────────────────────
{
  const dmg = new GameBoy(loadAcid2());
  check('DMG ROM stays in DMG mode (cgb=false)', dmg.cgb === false);
  const cgb = new GameBoy(loadCgbAcid2());
  check('CGB-only ROM enables color mode (cgb=true)', cgb.cgb === true);
}
{
  const white = cgbColor(0x7fff); // r=g=b=31
  const black = cgbColor(0x0000);
  const red = cgbColor(0x001f); // r=31, g=b=0
  check('cgb white maps near-white', white[0] > 230 && white[1] > 230 && white[2] > 230);
  check('cgb black maps near-black', black[0] < 20 && black[1] < 20 && black[2] < 20);
  check('cgb pure red is red-dominant', red[0] > red[1] && red[0] > red[2]);
}
{
  // The CGB acid2 test renders a non-flat color image (exercises palettes/attrs).
  const gb = new GameBoy(loadCgbAcid2());
  for (let i = 0; i < 30; i += 1) gb.runFrame();
  let colored = 0;
  for (let i = 0; i < gb.frame.length; i += 4) {
    const r = gb.frame[i]!,
      g = gb.frame[i + 1]!,
      b = gb.frame[i + 2]!;
    if (Math.abs(r - g) > 24 || Math.abs(g - b) > 24 || Math.abs(r - b) > 24) colored += 1; // not greyscale
  }
  check('cgb-acid2 produces genuinely colored pixels', colored > 500);
}

console.log(failures === 0 ? '\nALL PASS' : `\n${failures} FAILURE(S)`);
if (failures > 0) process.exit(1);
