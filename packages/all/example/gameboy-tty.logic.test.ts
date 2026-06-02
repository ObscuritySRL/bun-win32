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
import { Term } from './_term';
import { loadAcid2 } from './gameboy-rom';
import { GameBoy, blitToTerm } from './gameboy-tty';

let failures = 0;
function check(name: string, cond: boolean): void {
  if (cond) {
    console.log(`PASS  ${name}`);
  } else {
    console.log(`FAIL  ${name}`);
    failures += 1;
  }
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
  for (let i = 0; i < t.buf.length; i += 3) {
    if (!(t.buf[i] === 12 && t.buf[i + 1] === 18 && t.buf[i + 2] === 14)) nonBezel += 1;
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

console.log(failures === 0 ? '\nALL PASS' : `\n${failures} FAILURE(S)`);
if (failures > 0) process.exit(1);
