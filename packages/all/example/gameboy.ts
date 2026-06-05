/**
 * Game Boy (DMG) — a complete Nintendo Game Boy emulator in PURE TypeScript,
 * rendered on real D3D11 hardware via Bun FFI, running the MIT-licensed
 * dmg-acid2 PPU acceptance test so its iconic stylized FACE renders on screen.
 *
 * There is no native emulator core and no precompiled blob: the SM83/LR35902 CPU
 * (all 256 base + 256 CB-prefix opcodes with correct flags and cycle counts), a
 * flat-mapped MMU (MBC0 + a thin MBC1), a scanline-accurate PPU (background +
 * window + 8x8/8x16 sprites with 10-per-line limit, X-priority, X/Y flip, the
 * OBP0/OBP1 palettes and BG/OBJ priority), the DIV/TIMA/TMA/TAC timers and the
 * full interrupt set (VBlank/STAT/Timer/Joypad) are all interpreted here in
 * TypeScript. dmg-acid2 stresses exactly the PPU corner cases, so a correct face
 * is a visual pass/fail of the renderer.
 *
 * Each emulated frame (~70224 CPU cycles, ~59.7 Hz) the PPU paints a 160x144
 * RGBA8 framebuffer in the 4 classic DMG greens. That buffer is uploaded to a
 * GPU texture (ID3D11DeviceContext::UpdateSubresource via the engine's raw COM
 * vtable invoker) and drawn with a fullscreen triangle + point sampler through an
 * HLSL pixel shader that integer-scales-to-fit, letterboxes, and applies a
 * tasteful LCD look (soft DMG-green tint, subtle pixel grid, vignette) into an
 * 800x720 window.
 *
 * Controls (interactive only — capture mode is fully scripted): arrows = D-pad,
 * Z = A, X = B, Enter = Start, Right-Shift = Select; an XInput pad works too.
 *
 * @bun-win32 / engine APIs: createWindow, createDevice, compile, makeVertexShader/
 * makePixelShader, makeConstantBuffer/updateConstantBuffer, makeTexture (R8G8B8A8
 * SRV), makeSampler (POINT), setRenderTargets/setViewport/clear/
 * drawFullscreenTriangle, vsSet/psSet, vcall (UpdateSubresource), present,
 * comRelease — plus User32 GetDC/ReleaseDC + GDI32 CreateFontW/TextOutW for the
 * HUD, and Xinput1_4.XInputGetState for gamepad input.
 *
 * Run: bun run packages/all/example/gameboy.ts
 */

import { FFIType } from 'bun:ffi';

import { GDI32, Xinput1_4 } from '../index';

import * as audio from './_audio';
import * as gpu from './_gpu';
import * as hud from './_hud';
import { captureBackBuffer, formatGrid } from './_snapshot';
import { loadAcid2 } from './gameboy-rom';
import { loadLibbet } from './gameboy-game-rom';

const GB_W = 160;
const GB_H = 144;
const WIN_W = 800;
const WIN_H = 720;
const TRANSPARENT_BK = 1;

// Virtual-key codes for input (interactive mode only).
const VK_LEFT = 0x25;
const VK_UP = 0x26;
const VK_RIGHT = 0x27;
const VK_DOWN = 0x28;
const VK_Z = 0x5a;
const VK_X = 0x58;
const VK_RETURN = 0x0d;
const VK_RSHIFT = 0xa1;

// ════════════════════════════════════════════════════════════════════════════
// SM83 / LR35902 emulator core (CPU + MMU + PPU + timers + interrupts)
// ════════════════════════════════════════════════════════════════════════════

// DMG palette — four classic shades of Game Boy green, as RGBA bytes.
const DMG_PALETTE: ReadonlyArray<readonly [number, number, number]> = [
  [0xe0, 0xf8, 0xd0], // 0 — lightest
  [0x88, 0xc0, 0x70], // 1
  [0x34, 0x68, 0x56], // 2
  [0x08, 0x18, 0x20], // 3 — darkest
];

// ════════════════════════════════════════════════════════════════════════════
// APU — the 4 DMG sound channels (square1+sweep, square2, wave RAM, noise)
// ════════════════════════════════════════════════════════════════════════════
//
// A cycle-accurate-enough DMG APU. The CPU feeds it T-cycles; it advances each
// channel's frequency timer, runs the 512 Hz frame sequencer (length @256 Hz,
// sweep @128 Hz, envelope @64 Hz), and resamples the analog-domain mix down to
// the host sample rate, emitting interleaved stereo Int16 into a ring the demo
// drains to XAudio2 every frame. Registers NR10-NR52 + wave RAM (FF30-FF3F) are
// written through GameBoy.ioWrite, which forwards here.

const DUTY_TABLE: ReadonlyArray<ReadonlyArray<number>> = [
  [0, 0, 0, 0, 0, 0, 0, 1], // 12.5%
  [1, 0, 0, 0, 0, 0, 0, 1], // 25%
  [1, 0, 0, 0, 0, 1, 1, 1], // 50%
  [0, 1, 1, 1, 1, 1, 1, 0], // 75%
];

const GB_CPU_HZ = 4194304;

class Apu {
  private readonly sampleRate: number;
  // Fractional resampler: emit one stereo sample every CPU_HZ/sampleRate cycles.
  private readonly cyclesPerSample: number;
  private sampleClock = 0;

  // Frame sequencer: ticks at 512 Hz (every 8192 CPU cycles).
  private frameSeqCounter = 0;
  private frameSeqStep = 0;

  // Output ring — interleaved L,R Int16. Drained by the demo each video frame.
  private readonly out: Int16Array;
  private outWrite = 0;
  private outCount = 0;

  // ── NR50/NR51/NR52 master ──────────────────────────────────────────────────
  private nr50 = 0;
  private nr51 = 0;
  private enabled = false;

  // ── Channel 1: square + sweep ────────────────────────────────────────────
  private c1On = false;
  private c1Duty = 0;
  private c1FreqTimer = 0;
  private c1DutyPos = 0;
  private c1Freq = 0; // 11-bit period value
  private c1LenEnable = false;
  private c1LenCounter = 0;
  private c1EnvVol = 0;
  private c1EnvInit = 0;
  private c1EnvDir = 0;
  private c1EnvPeriod = 0;
  private c1EnvTimer = 0;
  private c1SweepPeriod = 0;
  private c1SweepDir = 0;
  private c1SweepShift = 0;
  private c1SweepTimer = 0;
  private c1SweepEnable = false;
  private c1SweepShadow = 0;

  // ── Channel 2: square ──────────────────────────────────────────────────────
  private c2On = false;
  private c2Duty = 0;
  private c2FreqTimer = 0;
  private c2DutyPos = 0;
  private c2Freq = 0;
  private c2LenEnable = false;
  private c2LenCounter = 0;
  private c2EnvVol = 0;
  private c2EnvInit = 0;
  private c2EnvDir = 0;
  private c2EnvPeriod = 0;
  private c2EnvTimer = 0;

  // ── Channel 3: wave RAM ────────────────────────────────────────────────────
  private c3On = false;
  private c3DacOn = false;
  private c3FreqTimer = 0;
  private c3Pos = 0;
  private c3Freq = 0;
  private c3LenEnable = false;
  private c3LenCounter = 0;
  private c3Volume = 0; // 0..3 (shift code)
  private readonly waveRam = new Uint8Array(16);
  private c3Sample = 0;

  // ── Channel 4: noise ───────────────────────────────────────────────────────
  private c4On = false;
  private c4FreqTimer = 0;
  private c4Lfsr = 0x7fff;
  private c4WidthMode = false;
  private c4DivCode = 0;
  private c4ClockShift = 0;
  private c4LenEnable = false;
  private c4LenCounter = 0;
  private c4EnvVol = 0;
  private c4EnvInit = 0;
  private c4EnvDir = 0;
  private c4EnvPeriod = 0;
  private c4EnvTimer = 0;

  constructor(sampleRate: number) {
    this.sampleRate = sampleRate;
    this.cyclesPerSample = GB_CPU_HZ / sampleRate;
    // ~0.3 s of stereo headroom in the ring.
    this.out = new Int16Array(2 * Math.ceil(sampleRate * 0.3));
  }

  /** Forward a write to a sound register (reg = address - 0xFF00, 0x10..0x3F). */
  writeReg(reg: number, value: number): void {
    if (reg >= 0x30 && reg <= 0x3f) {
      this.waveRam[reg - 0x30] = value & 0xff;
      return;
    }
    if (!this.enabled && reg !== 0x26) {
      // While powered off, only NR52 is writable (length still loadable on CGB,
      // but DMG ignores everything — keep it simple and ignore).
      return;
    }
    switch (reg) {
      // ── Channel 1 ──
      case 0x10: // NR10 sweep
        this.c1SweepPeriod = (value >> 4) & 0x07;
        this.c1SweepDir = (value >> 3) & 0x01;
        this.c1SweepShift = value & 0x07;
        break;
      case 0x11: // NR11 duty + length
        this.c1Duty = (value >> 6) & 0x03;
        this.c1LenCounter = 64 - (value & 0x3f);
        break;
      case 0x12: // NR12 envelope
        this.c1EnvInit = (value >> 4) & 0x0f;
        this.c1EnvDir = (value >> 3) & 0x01;
        this.c1EnvPeriod = value & 0x07;
        if ((value & 0xf8) === 0) this.c1On = false; // DAC off
        break;
      case 0x13: // NR13 freq lo
        this.c1Freq = (this.c1Freq & 0x700) | (value & 0xff);
        break;
      case 0x14: // NR14 freq hi + trigger + length-enable
        this.c1Freq = (this.c1Freq & 0xff) | ((value & 0x07) << 8);
        this.c1LenEnable = (value & 0x40) !== 0;
        if (value & 0x80) this.triggerC1();
        break;
      // ── Channel 2 ──
      case 0x16:
        this.c2Duty = (value >> 6) & 0x03;
        this.c2LenCounter = 64 - (value & 0x3f);
        break;
      case 0x17:
        this.c2EnvInit = (value >> 4) & 0x0f;
        this.c2EnvDir = (value >> 3) & 0x01;
        this.c2EnvPeriod = value & 0x07;
        if ((value & 0xf8) === 0) this.c2On = false;
        break;
      case 0x18:
        this.c2Freq = (this.c2Freq & 0x700) | (value & 0xff);
        break;
      case 0x19:
        this.c2Freq = (this.c2Freq & 0xff) | ((value & 0x07) << 8);
        this.c2LenEnable = (value & 0x40) !== 0;
        if (value & 0x80) this.triggerC2();
        break;
      // ── Channel 3 ──
      case 0x1a: // NR30 DAC power
        this.c3DacOn = (value & 0x80) !== 0;
        if (!this.c3DacOn) this.c3On = false;
        break;
      case 0x1b: // NR31 length
        this.c3LenCounter = 256 - (value & 0xff);
        break;
      case 0x1c: // NR32 volume
        this.c3Volume = (value >> 5) & 0x03;
        break;
      case 0x1d: // NR33 freq lo
        this.c3Freq = (this.c3Freq & 0x700) | (value & 0xff);
        break;
      case 0x1e: // NR34 freq hi + trigger
        this.c3Freq = (this.c3Freq & 0xff) | ((value & 0x07) << 8);
        this.c3LenEnable = (value & 0x40) !== 0;
        if (value & 0x80) this.triggerC3();
        break;
      // ── Channel 4 ──
      case 0x20: // NR41 length
        this.c4LenCounter = 64 - (value & 0x3f);
        break;
      case 0x21: // NR42 envelope
        this.c4EnvInit = (value >> 4) & 0x0f;
        this.c4EnvDir = (value >> 3) & 0x01;
        this.c4EnvPeriod = value & 0x07;
        if ((value & 0xf8) === 0) this.c4On = false;
        break;
      case 0x22: // NR43 noise params
        this.c4ClockShift = (value >> 4) & 0x0f;
        this.c4WidthMode = (value & 0x08) !== 0;
        this.c4DivCode = value & 0x07;
        break;
      case 0x23: // NR44 trigger + length-enable
        this.c4LenEnable = (value & 0x40) !== 0;
        if (value & 0x80) this.triggerC4();
        break;
      // ── Master ──
      case 0x24: // NR50
        this.nr50 = value;
        break;
      case 0x25: // NR51 panning
        this.nr51 = value;
        break;
      case 0x26: {
        // NR52 power
        const on = (value & 0x80) !== 0;
        if (!on && this.enabled) {
          // Power-off clears every channel register/state.
          this.c1On = this.c2On = this.c3On = this.c4On = false;
          this.nr50 = 0;
          this.nr51 = 0;
        }
        this.enabled = on;
        break;
      }
      default:
        break;
    }
  }

  /** NR52 read: bit7 power + per-channel "on" status in bits 0..3. */
  readNr52(): number {
    let v = this.enabled ? 0x80 : 0x00;
    v |= 0x70; // unused bits read as 1
    if (this.c1On) v |= 0x01;
    if (this.c2On) v |= 0x02;
    if (this.c3On) v |= 0x04;
    if (this.c4On) v |= 0x08;
    return v;
  }

  private triggerC1(): void {
    this.c1On = true;
    if (this.c1LenCounter === 0) this.c1LenCounter = 64;
    this.c1FreqTimer = (2048 - this.c1Freq) * 4;
    this.c1EnvTimer = this.c1EnvPeriod;
    this.c1EnvVol = this.c1EnvInit;
    this.c1SweepShadow = this.c1Freq;
    this.c1SweepTimer = this.c1SweepPeriod !== 0 ? this.c1SweepPeriod : 8;
    this.c1SweepEnable = this.c1SweepPeriod !== 0 || this.c1SweepShift !== 0;
    if (this.c1SweepShift !== 0) this.sweepCalc();
    if (this.c1EnvInit === 0 && this.c1EnvDir === 0) this.c1On = false; // DAC off
  }
  private triggerC2(): void {
    this.c2On = true;
    if (this.c2LenCounter === 0) this.c2LenCounter = 64;
    this.c2FreqTimer = (2048 - this.c2Freq) * 4;
    this.c2EnvTimer = this.c2EnvPeriod;
    this.c2EnvVol = this.c2EnvInit;
    if (this.c2EnvInit === 0 && this.c2EnvDir === 0) this.c2On = false;
  }
  private triggerC3(): void {
    this.c3On = this.c3DacOn;
    if (this.c3LenCounter === 0) this.c3LenCounter = 256;
    this.c3FreqTimer = (2048 - this.c3Freq) * 2;
    this.c3Pos = 0;
  }
  private triggerC4(): void {
    this.c4On = true;
    if (this.c4LenCounter === 0) this.c4LenCounter = 64;
    this.c4Lfsr = 0x7fff;
    this.c4FreqTimer = this.noisePeriod();
    this.c4EnvTimer = this.c4EnvPeriod;
    this.c4EnvVol = this.c4EnvInit;
    if (this.c4EnvInit === 0 && this.c4EnvDir === 0) this.c4On = false;
  }

  private noisePeriod(): number {
    const div = this.c4DivCode === 0 ? 8 : this.c4DivCode * 16;
    return div << this.c4ClockShift;
  }

  private sweepCalc(): number {
    let next = this.c1SweepShadow >> this.c1SweepShift;
    next = this.c1SweepDir ? this.c1SweepShadow - next : this.c1SweepShadow + next;
    if (next > 2047) this.c1On = false; // overflow disables the channel
    return next;
  }

  // ── Frame sequencer steps ──────────────────────────────────────────────────
  private stepLength(): void {
    if (this.c1LenEnable && this.c1LenCounter > 0 && --this.c1LenCounter === 0) this.c1On = false;
    if (this.c2LenEnable && this.c2LenCounter > 0 && --this.c2LenCounter === 0) this.c2On = false;
    if (this.c3LenEnable && this.c3LenCounter > 0 && --this.c3LenCounter === 0) this.c3On = false;
    if (this.c4LenEnable && this.c4LenCounter > 0 && --this.c4LenCounter === 0) this.c4On = false;
  }
  private stepSweep(): void {
    if (this.c1SweepTimer > 0) this.c1SweepTimer -= 1;
    if (this.c1SweepTimer === 0) {
      this.c1SweepTimer = this.c1SweepPeriod !== 0 ? this.c1SweepPeriod : 8;
      if (this.c1SweepEnable && this.c1SweepPeriod !== 0) {
        const next = this.sweepCalc();
        if (next <= 2047 && this.c1SweepShift !== 0) {
          this.c1SweepShadow = next;
          this.c1Freq = next;
          this.sweepCalc(); // overflow re-check
        }
      }
    }
  }
  private stepEnvelope(): void {
    // Channel 1
    if (this.c1EnvPeriod !== 0) {
      if (this.c1EnvTimer > 0) this.c1EnvTimer -= 1;
      if (this.c1EnvTimer === 0) {
        this.c1EnvTimer = this.c1EnvPeriod;
        if (this.c1EnvDir && this.c1EnvVol < 15) this.c1EnvVol += 1;
        else if (!this.c1EnvDir && this.c1EnvVol > 0) this.c1EnvVol -= 1;
      }
    }
    // Channel 2
    if (this.c2EnvPeriod !== 0) {
      if (this.c2EnvTimer > 0) this.c2EnvTimer -= 1;
      if (this.c2EnvTimer === 0) {
        this.c2EnvTimer = this.c2EnvPeriod;
        if (this.c2EnvDir && this.c2EnvVol < 15) this.c2EnvVol += 1;
        else if (!this.c2EnvDir && this.c2EnvVol > 0) this.c2EnvVol -= 1;
      }
    }
    // Channel 4
    if (this.c4EnvPeriod !== 0) {
      if (this.c4EnvTimer > 0) this.c4EnvTimer -= 1;
      if (this.c4EnvTimer === 0) {
        this.c4EnvTimer = this.c4EnvPeriod;
        if (this.c4EnvDir && this.c4EnvVol < 15) this.c4EnvVol += 1;
        else if (!this.c4EnvDir && this.c4EnvVol > 0) this.c4EnvVol -= 1;
      }
    }
  }

  private frameSeqTick(): void {
    // 8-step sequence: length on 0/2/4/6, sweep on 2/6, envelope on 7.
    switch (this.frameSeqStep) {
      case 0:
        this.stepLength();
        break;
      case 2:
        this.stepLength();
        this.stepSweep();
        break;
      case 4:
        this.stepLength();
        break;
      case 6:
        this.stepLength();
        this.stepSweep();
        break;
      case 7:
        this.stepEnvelope();
        break;
      default:
        break;
    }
    this.frameSeqStep = (this.frameSeqStep + 1) & 0x07;
  }

  // ── Per-cycle channel timers ───────────────────────────────────────────────
  private clockChannels(cycles: number): void {
    // Square 1
    this.c1FreqTimer -= cycles;
    while (this.c1FreqTimer <= 0) {
      this.c1FreqTimer += (2048 - this.c1Freq) * 4 || 4;
      this.c1DutyPos = (this.c1DutyPos + 1) & 0x07;
    }
    // Square 2
    this.c2FreqTimer -= cycles;
    while (this.c2FreqTimer <= 0) {
      this.c2FreqTimer += (2048 - this.c2Freq) * 4 || 4;
      this.c2DutyPos = (this.c2DutyPos + 1) & 0x07;
    }
    // Wave
    this.c3FreqTimer -= cycles;
    while (this.c3FreqTimer <= 0) {
      this.c3FreqTimer += (2048 - this.c3Freq) * 2 || 2;
      this.c3Pos = (this.c3Pos + 1) & 0x1f;
      const byte = this.waveRam[this.c3Pos >> 1]!;
      this.c3Sample = this.c3Pos & 1 ? byte & 0x0f : byte >> 4;
    }
    // Noise
    this.c4FreqTimer -= cycles;
    while (this.c4FreqTimer <= 0) {
      this.c4FreqTimer += this.noisePeriod() || 8;
      const xor = (this.c4Lfsr & 1) ^ ((this.c4Lfsr >> 1) & 1);
      this.c4Lfsr = (this.c4Lfsr >> 1) | (xor << 14);
      if (this.c4WidthMode) {
        this.c4Lfsr = (this.c4Lfsr & ~0x40) | (xor << 6);
      }
    }
  }

  /** Current analog amplitude of each channel (0..15), before the DAC. */
  private c1Out(): number {
    if (!this.c1On) return 0;
    return DUTY_TABLE[this.c1Duty]![this.c1DutyPos]! ? this.c1EnvVol : 0;
  }
  private c2Out(): number {
    if (!this.c2On) return 0;
    return DUTY_TABLE[this.c2Duty]![this.c2DutyPos]! ? this.c2EnvVol : 0;
  }
  private c3Out(): number {
    if (!this.c3On || !this.c3DacOn) return 0;
    const shift = [4, 0, 1, 2][this.c3Volume]!;
    return this.c3Sample >> shift;
  }
  private c4Out(): number {
    if (!this.c4On) return 0;
    return (this.c4Lfsr & 1) === 0 ? this.c4EnvVol : 0;
  }

  /**
   * Advance the APU by `cycles` T-cycles, emitting resampled stereo samples into
   * the ring. Call once per CPU instruction (same cadence as the timers/PPU).
   */
  step(cycles: number): void {
    // Frame sequencer @512 Hz.
    this.frameSeqCounter += cycles;
    while (this.frameSeqCounter >= 8192) {
      this.frameSeqCounter -= 8192;
      this.frameSeqTick();
    }

    this.clockChannels(cycles);

    // Resample to the host rate.
    this.sampleClock += cycles;
    while (this.sampleClock >= this.cyclesPerSample) {
      this.sampleClock -= this.cyclesPerSample;
      this.emitSample();
    }
  }

  private emitSample(): void {
    if (this.outCount + 2 > this.out.length) {
      // Ring full — drop the sample (consumer is behind; avoids unbounded growth).
      return;
    }
    let left = 0;
    let right = 0;
    if (this.enabled) {
      // Each channel's DAC maps 0..15 to a normalized -1..1; here we keep small
      // integers and scale at the end. Pan via NR51, master volume via NR50.
      const ch = [this.c1Out(), this.c2Out(), this.c3Out(), this.c4Out()];
      const nr51 = this.nr51;
      for (let i = 0; i < 4; i += 1) {
        const v = ch[i]!;
        if (nr51 & (0x10 << i)) left += v; // bits 4..7 = left enables
        if (nr51 & (0x01 << i)) right += v; // bits 0..3 = right enables
      }
      const lVol = ((this.nr50 >> 4) & 0x07) + 1;
      const rVol = (this.nr50 & 0x07) + 1;
      left *= lVol;
      right *= rVol;
    }
    // 4 channels * 15 * volume(8) = 480 max per side. Scale to ~0.7 of int16.
    const scale = 22000 / 480;
    let l = Math.round(left * scale);
    let r = Math.round(right * scale);
    if (l > 32767) l = 32767;
    else if (l < -32768) l = -32768;
    if (r > 32767) r = 32767;
    else if (r < -32768) r = -32768;
    const w = this.outWrite;
    this.out[w] = l;
    this.out[w + 1] = r;
    this.outWrite = (w + 2) % this.out.length;
    this.outCount += 2;
  }

  /** Drain up to `maxFrames` stereo frames into a fresh Int16Array (interleaved). */
  drain(maxFrames: number): Int16Array {
    const want = Math.min(maxFrames * 2, this.outCount);
    const block = new Int16Array(want);
    let read = (this.outWrite - this.outCount + this.out.length * 2) % this.out.length;
    for (let i = 0; i < want; i += 1) {
      block[i] = this.out[read]!;
      read = (read + 1) % this.out.length;
    }
    this.outCount -= want;
    return block;
  }

  get pending(): number {
    return this.outCount >> 1;
  }
}

class GameBoy {
  // ── CPU registers ────────────────────────────────────────────────────────
  private a = 0;
  private f = 0; // flags: bit7 Z, bit6 N, bit5 H, bit4 C
  private b = 0;
  private c = 0;
  private d = 0;
  private e = 0;
  private h = 0;
  private l = 0;
  private sp = 0;
  private pc = 0;

  private ime = false; // interrupt master enable
  private imePending = false; // EI takes effect after the next instruction
  private halted = false;

  // ── Memory ─────────────────────────────────────────────────────────────────
  private readonly rom: Uint8Array; // full cartridge ROM
  private readonly vram = new Uint8Array(0x2000);
  private readonly wram = new Uint8Array(0x2000);
  private readonly oam = new Uint8Array(0xa0);
  private readonly hram = new Uint8Array(0x7f);
  private readonly io = new Uint8Array(0x80);
  private ie = 0; // 0xFFFF interrupt-enable
  // External cartridge RAM (MBC1) — 4 banks of 8 KiB is plenty for the showcase.
  private readonly eram = new Uint8Array(0x8000);

  // ── MBC state ────────────────────────────────────────────────────────────
  private readonly mbcType: number;
  private romBank = 1;
  private ramBank = 0;
  private ramEnabled = false;
  private bankingMode = 0; // MBC1: 0 = ROM banking, 1 = RAM banking
  private readonly romBankMask: number;

  // ── Timer state ──────────────────────────────────────────────────────────
  private divCounter = 0; // internal 16-bit counter; DIV is its high byte
  private timaCounter = 0;

  // ── Audio ──────────────────────────────────────────────────────────────────
  readonly apu: Apu | null;

  // ── PPU state ──────────────────────────────────────────────────────────────
  private ppuDot = 0; // dots elapsed within the current scanline (0..456)
  // Final RGBA8 framebuffer, top-down, 160x144 — uploaded to the GPU each frame.
  readonly frame = new Uint8Array(GB_W * GB_H * 4);
  frameReady = false;

  // ── Joypad: low nibble is the live button state (active-low) ───────────────
  // Bit layout matches the hardware select lines (see readJoypad()).
  private joypDir = 0x0f; // down/up/left/right (bit3..bit0), 1 = released
  private joypBtn = 0x0f; // start/select/B/A (bit3..bit0), 1 = released

  // IO register addresses.
  private static readonly P1 = 0x00;
  private static readonly DIV = 0x04;
  private static readonly TIMA = 0x05;
  private static readonly TMA = 0x06;
  private static readonly TAC = 0x07;
  private static readonly IF = 0x0f;
  private static readonly LCDC = 0x40;
  private static readonly STAT = 0x41;
  private static readonly SCY = 0x42;
  private static readonly SCX = 0x43;
  private static readonly LY = 0x44;
  private static readonly LYC = 0x45;
  private static readonly DMA = 0x46;
  private static readonly BGP = 0x47;
  private static readonly OBP0 = 0x48;
  private static readonly OBP1 = 0x49;
  private static readonly WY = 0x4a;
  private static readonly WX = 0x4b;

  constructor(rom: Uint8Array, apu: Apu | null = null) {
    this.rom = rom;
    this.apu = apu;
    this.mbcType = rom[0x147] ?? 0;
    // ROM bank mask from the header ROM-size byte (0x148): banks = 2 << size.
    const sizeCode = rom[0x148] ?? 0;
    const banks = 2 << sizeCode;
    this.romBankMask = Math.max(1, banks - 1);
    this.reset();
  }

  /** Initialise post-boot state (skips the copyrighted Nintendo boot ROM). */
  private reset(): void {
    this.a = 0x01;
    this.f = 0xb0;
    this.b = 0x00;
    this.c = 0x13;
    this.d = 0x00;
    this.e = 0xd8;
    this.h = 0x01;
    this.l = 0x4d;
    this.sp = 0xfffe;
    this.pc = 0x0100;
    this.ime = false;
    this.halted = false;

    // Documented post-boot IO register values (DMG).
    this.io.fill(0);
    this.io[GameBoy.P1] = 0xcf;
    this.io[GameBoy.DIV] = 0xab;
    this.io[GameBoy.TIMA] = 0x00;
    this.io[GameBoy.TMA] = 0x00;
    this.io[GameBoy.TAC] = 0xf8;
    this.io[GameBoy.IF] = 0xe1;
    this.io[GameBoy.LCDC] = 0x91;
    this.io[GameBoy.STAT] = 0x85;
    this.io[GameBoy.SCY] = 0x00;
    this.io[GameBoy.SCX] = 0x00;
    this.io[GameBoy.LY] = 0x00;
    this.io[GameBoy.LYC] = 0x00;
    this.io[GameBoy.BGP] = 0xfc;
    this.io[GameBoy.OBP0] = 0xff;
    this.io[GameBoy.OBP1] = 0xff;
    this.io[GameBoy.WY] = 0x00;
    this.io[GameBoy.WX] = 0x00;
    this.divCounter = 0xabcc;
    this.ie = 0x00;
  }

  // ── Joypad input ─────────────────────────────────────────────────────────
  /**
   * Set the live joypad state from booleans. Active-low is handled internally:
   * a pressed button drives its bit to 0.
   */
  setButtons(b: { right: boolean; left: boolean; up: boolean; down: boolean; a: boolean; bBtn: boolean; select: boolean; start: boolean }): void {
    let dir = 0x0f;
    if (b.right) dir &= ~0x01;
    if (b.left) dir &= ~0x02;
    if (b.up) dir &= ~0x04;
    if (b.down) dir &= ~0x08;
    let btn = 0x0f;
    if (b.a) btn &= ~0x01;
    if (b.bBtn) btn &= ~0x02;
    if (b.select) btn &= ~0x04;
    if (b.start) btn &= ~0x08;
    this.joypDir = dir & 0x0f;
    this.joypBtn = btn & 0x0f;
  }

  private readJoypad(): number {
    const sel = this.io[GameBoy.P1]!;
    // Bit5 selects buttons (active-low), bit4 selects the d-pad (active-low).
    let lower = 0x0f;
    if ((sel & 0x10) === 0) lower &= this.joypDir; // d-pad selected
    if ((sel & 0x20) === 0) lower &= this.joypBtn; // buttons selected
    return (sel & 0x30) | lower | 0xc0;
  }

  // ── Memory access ──────────────────────────────────────────────────────────
  read8(addr: number): number {
    addr &= 0xffff;
    if (addr < 0x4000) {
      // Bank 0 — fixed (MBC1 advanced banking ignored for this showcase).
      return this.rom[addr] ?? 0xff;
    }
    if (addr < 0x8000) {
      const bank = this.mbcType === 0 ? 1 : this.romBank;
      const off = bank * 0x4000 + (addr - 0x4000);
      return this.rom[off] ?? 0xff;
    }
    if (addr < 0xa000) return this.vram[addr - 0x8000]!;
    if (addr < 0xc000) {
      if (!this.ramEnabled) return 0xff;
      const off = this.ramBank * 0x2000 + (addr - 0xa000);
      return this.eram[off & (this.eram.length - 1)]!;
    }
    if (addr < 0xe000) return this.wram[addr - 0xc000]!;
    if (addr < 0xfe00) return this.wram[addr - 0xe000]!; // echo RAM
    if (addr < 0xfea0) return this.oam[addr - 0xfe00]!;
    if (addr < 0xff00) return 0xff; // unusable
    if (addr < 0xff80) {
      const reg = addr - 0xff00;
      if (reg === GameBoy.P1) return this.readJoypad();
      if (reg === 0x26 && this.apu) return this.apu.readNr52(); // NR52 channel status
      return this.io[reg]!;
    }
    if (addr < 0xffff) return this.hram[addr - 0xff80]!;
    return this.ie;
  }

  private read16(addr: number): number {
    return this.read8(addr) | (this.read8(addr + 1) << 8);
  }

  write8(addr: number, value: number): void {
    addr &= 0xffff;
    value &= 0xff;
    if (addr < 0x8000) {
      this.mbcWrite(addr, value);
      return;
    }
    if (addr < 0xa000) {
      this.vram[addr - 0x8000] = value;
      return;
    }
    if (addr < 0xc000) {
      if (this.ramEnabled) {
        const off = this.ramBank * 0x2000 + (addr - 0xa000);
        this.eram[off & (this.eram.length - 1)] = value;
      }
      return;
    }
    if (addr < 0xe000) {
      this.wram[addr - 0xc000] = value;
      return;
    }
    if (addr < 0xfe00) {
      this.wram[addr - 0xe000] = value; // echo RAM
      return;
    }
    if (addr < 0xfea0) {
      this.oam[addr - 0xfe00] = value;
      return;
    }
    if (addr < 0xff00) return; // unusable
    if (addr < 0xff80) {
      this.ioWrite(addr - 0xff00, value);
      return;
    }
    if (addr < 0xffff) {
      this.hram[addr - 0xff80] = value;
      return;
    }
    this.ie = value;
  }

  private write16(addr: number, value: number): void {
    this.write8(addr, value & 0xff);
    this.write8(addr + 1, (value >> 8) & 0xff);
  }

  private mbcWrite(addr: number, value: number): void {
    if (this.mbcType === 0) return; // MBC0: ROM is read-only
    // Thin MBC1 implementation (enough for the optional second ROM).
    if (addr < 0x2000) {
      this.ramEnabled = (value & 0x0f) === 0x0a;
    } else if (addr < 0x4000) {
      let bank = value & 0x1f;
      if (bank === 0) bank = 1; // bank 0 maps to 1 in the low region
      this.romBank = (this.romBank & 0x60) | bank;
      this.romBank &= this.romBankMask;
      if (this.romBank === 0) this.romBank = 1;
    } else if (addr < 0x6000) {
      if (this.bankingMode === 0) {
        this.romBank = ((this.romBank & 0x1f) | ((value & 0x03) << 5)) & this.romBankMask;
        if (this.romBank === 0) this.romBank = 1;
      } else {
        this.ramBank = value & 0x03;
      }
    } else {
      this.bankingMode = value & 0x01;
    }
  }

  private ioWrite(reg: number, value: number): void {
    // Sound registers (NR10-NR52 + wave RAM) are mirrored into the APU.
    if (reg >= 0x10 && reg <= 0x3f) {
      this.io[reg] = value;
      if (this.apu) this.apu.writeReg(reg, value);
      return;
    }
    switch (reg) {
      case GameBoy.P1:
        // Only the two select bits are writable.
        this.io[reg] = (value & 0x30) | (this.io[reg]! & 0xcf);
        return;
      case GameBoy.DIV:
        // Any write resets the whole divider counter.
        this.divCounter = 0;
        this.io[GameBoy.DIV] = 0;
        return;
      case GameBoy.DMA: {
        // OAM DMA: copy 0xA0 bytes from value<<8 into OAM.
        const base = value << 8;
        for (let i = 0; i < 0xa0; i += 1) this.oam[i] = this.read8(base + i);
        this.io[reg] = value;
        return;
      }
      case GameBoy.LY:
        return; // read-only
      case GameBoy.STAT:
        // Lower 3 bits (mode + coincidence) are read-only; keep upper bits.
        this.io[reg] = (value & 0xf8) | (this.io[reg]! & 0x07);
        return;
      default:
        this.io[reg] = value;
    }
  }

  // ── Interrupts ───────────────────────────────────────────────────────────
  private requestInterrupt(bit: number): void {
    this.io[GameBoy.IF] = (this.io[GameBoy.IF]! | bit) & 0x1f;
  }

  private serviceInterrupts(): number {
    const pending = this.ie & this.io[GameBoy.IF]! & 0x1f;
    if (pending === 0) return 0;
    // Any pending interrupt wakes a HALTed CPU even if IME is clear.
    if (this.halted) this.halted = false;
    if (!this.ime) return 0;

    // Priority: VBlank(0) > STAT(1) > Timer(2) > Serial(3) > Joypad(4).
    for (let bit = 0; bit < 5; bit += 1) {
      const mask = 1 << bit;
      if (pending & mask) {
        this.ime = false;
        this.io[GameBoy.IF] = this.io[GameBoy.IF]! & ~mask & 0x1f;
        this.sp = (this.sp - 2) & 0xffff;
        this.write16(this.sp, this.pc);
        this.pc = 0x40 + bit * 8;
        return 20; // interrupt dispatch costs 20 cycles
      }
    }
    return 0;
  }

  // ── Timers ───────────────────────────────────────────────────────────────
  private stepTimers(cycles: number): void {
    // DIV increments at 16384 Hz = every 256 CPU cycles (high byte of a 16-bit
    // counter clocked at the 4.19 MHz machine rate, i.e. cycles here are T-cycles).
    this.divCounter = (this.divCounter + cycles) & 0xffff;
    this.io[GameBoy.DIV] = (this.divCounter >> 8) & 0xff;

    const tac = this.io[GameBoy.TAC]!;
    if ((tac & 0x04) === 0) return; // timer disabled
    const period = [1024, 16, 64, 256][tac & 0x03]!;
    this.timaCounter += cycles;
    while (this.timaCounter >= period) {
      this.timaCounter -= period;
      let tima = this.io[GameBoy.TIMA]! + 1;
      if (tima > 0xff) {
        tima = this.io[GameBoy.TMA]!;
        this.requestInterrupt(0x04); // Timer interrupt
      }
      this.io[GameBoy.TIMA] = tima & 0xff;
    }
  }

  // ── PPU (scanline-based) ───────────────────────────────────────────────────
  private setMode(mode: number): void {
    const stat = this.io[GameBoy.STAT]!;
    this.io[GameBoy.STAT] = (stat & 0xfc) | (mode & 0x03);
    // STAT mode-source interrupts.
    if (mode === 0 && stat & 0x08) this.requestInterrupt(0x02); // HBlank
    if (mode === 2 && stat & 0x20) this.requestInterrupt(0x02); // OAM
    if (mode === 1 && stat & 0x10) this.requestInterrupt(0x02); // VBlank STAT
  }

  private checkLyc(): void {
    const ly = this.io[GameBoy.LY]!;
    const lyc = this.io[GameBoy.LYC]!;
    let stat = this.io[GameBoy.STAT]!;
    if (ly === lyc) {
      stat |= 0x04;
      if (stat & 0x40) this.requestInterrupt(0x02); // LYC=LY STAT
    } else {
      stat &= ~0x04;
    }
    this.io[GameBoy.STAT] = stat & 0xff;
  }

  private stepPpu(cycles: number): void {
    const lcdc = this.io[GameBoy.LCDC]!;
    if ((lcdc & 0x80) === 0) {
      // LCD off: LY=0, mode 0, dot counter reset.
      this.ppuDot = 0;
      this.io[GameBoy.LY] = 0;
      this.io[GameBoy.STAT] = this.io[GameBoy.STAT]! & 0xfc;
      return;
    }

    this.ppuDot += cycles;
    let ly = this.io[GameBoy.LY]!;

    if (this.ppuDot >= 456) {
      this.ppuDot -= 456;
      // On the line that just finished, render visible scanlines before LY++.
      ly = (ly + 1) % 154;
      this.io[GameBoy.LY] = ly;
      this.checkLyc();

      if (ly === 144) {
        // Entered VBlank.
        this.setMode(1);
        this.requestInterrupt(0x01); // VBlank
        this.frameReady = true;
      } else if (ly === 0) {
        this.setMode(2);
      }
    }

    if (ly < 144) {
      // Visible line: walk OAM(2) → Draw(3) → HBlank(0) by dot position.
      const mode = this.io[GameBoy.STAT]! & 0x03;
      if (this.ppuDot < 80) {
        if (mode !== 2) this.setMode(2);
      } else if (this.ppuDot < 80 + 172) {
        if (mode !== 3) this.setMode(3);
      } else {
        if (mode !== 0) {
          this.setMode(0);
          this.renderScanline(ly); // render once when entering HBlank
        }
      }
    }
  }

  /** Render a single visible scanline of BG + window + sprites into `frame`. */
  private renderScanline(ly: number): void {
    const lcdc = this.io[GameBoy.LCDC]!;
    const rowBase = ly * GB_W;
    // Per-pixel BG color INDEX (0..3, pre-palette) for sprite priority decisions.
    const bgIndex = this.scanBgIndex;

    if (lcdc & 0x01) {
      this.renderBgWindow(ly, lcdc, bgIndex);
    } else {
      // BG/window disabled: the line is white (color 0).
      const [r, g, b] = DMG_PALETTE[0]!;
      for (let x = 0; x < GB_W; x += 1) {
        const o = (rowBase + x) * 4;
        this.frame[o] = r;
        this.frame[o + 1] = g;
        this.frame[o + 2] = b;
        this.frame[o + 3] = 0xff;
        bgIndex[x] = 0;
      }
    }

    if (lcdc & 0x02) this.renderSprites(ly, lcdc, bgIndex);
  }

  private readonly scanBgIndex = new Uint8Array(GB_W);

  private renderBgWindow(ly: number, lcdc: number, bgIndex: Uint8Array): void {
    const scx = this.io[GameBoy.SCX]!;
    const scy = this.io[GameBoy.SCY]!;
    const wy = this.io[GameBoy.WY]!;
    const wx = this.io[GameBoy.WX]!;
    const bgp = this.io[GameBoy.BGP]!;
    const windowEnabled = (lcdc & 0x20) !== 0 && ly >= wy;
    // Tile data area: bit4 selects 0x8000 unsigned vs 0x8800 signed.
    const tileDataUnsigned = (lcdc & 0x10) !== 0;
    const bgMapBase = lcdc & 0x08 ? 0x1c00 : 0x1800;
    const winMapBase = lcdc & 0x40 ? 0x1c00 : 0x1800;
    const rowBase = ly * GB_W;

    for (let x = 0; x < GB_W; x += 1) {
      let mapBase: number;
      let px: number;
      let py: number;
      if (windowEnabled && x >= wx - 7) {
        mapBase = winMapBase;
        px = x - (wx - 7);
        py = ly - wy;
      } else {
        mapBase = bgMapBase;
        px = (x + scx) & 0xff;
        py = (ly + scy) & 0xff;
      }
      const tileCol = (px >> 3) & 0x1f;
      const tileRow = (py >> 3) & 0x1f;
      const tileNum = this.vram[mapBase + tileRow * 32 + tileCol]!;
      let tileAddr: number;
      if (tileDataUnsigned) {
        tileAddr = tileNum * 16;
      } else {
        // Signed addressing relative to 0x9000 (vram offset 0x1000).
        tileAddr = 0x1000 + ((tileNum << 24) >> 24) * 16;
      }
      const fineY = py & 0x07;
      const lo = this.vram[tileAddr + fineY * 2]!;
      const hi = this.vram[tileAddr + fineY * 2 + 1]!;
      const bit = 7 - (px & 0x07);
      const colorIdx = ((lo >> bit) & 1) | (((hi >> bit) & 1) << 1);
      bgIndex[x] = colorIdx;
      const shade = (bgp >> (colorIdx * 2)) & 0x03;
      const [r, g, b] = DMG_PALETTE[shade]!;
      const o = (rowBase + x) * 4;
      this.frame[o] = r;
      this.frame[o + 1] = g;
      this.frame[o + 2] = b;
      this.frame[o + 3] = 0xff;
    }
  }

  private renderSprites(ly: number, lcdc: number, bgIndex: Uint8Array): void {
    const spriteHeight = lcdc & 0x04 ? 16 : 8;
    const rowBase = ly * GB_W;

    // Collect up to 10 sprites on this line (OAM scan order).
    const visible: number[] = [];
    for (let i = 0; i < 40 && visible.length < 10; i += 1) {
      const oy = this.oam[i * 4]! - 16;
      if (ly >= oy && ly < oy + spriteHeight) visible.push(i);
    }

    // DMG priority: smaller X wins; ties broken by lower OAM index. Draw from
    // lowest priority to highest so the highest-priority sprite ends up on top.
    visible.sort((a, b) => {
      const ax = this.oam[a * 4 + 1]!;
      const bx = this.oam[b * 4 + 1]!;
      if (ax !== bx) return bx - ax; // larger X first (lower priority)
      return b - a; // larger index first
    });

    for (const i of visible) {
      const oy = this.oam[i * 4]! - 16;
      const ox = this.oam[i * 4 + 1]! - 8;
      let tile = this.oam[i * 4 + 2]!;
      const attr = this.oam[i * 4 + 3]!;
      const flipX = (attr & 0x20) !== 0;
      const flipY = (attr & 0x40) !== 0;
      const behindBg = (attr & 0x80) !== 0;
      const palette = attr & 0x10 ? this.io[GameBoy.OBP1]! : this.io[GameBoy.OBP0]!;

      let line = ly - oy;
      if (flipY) line = spriteHeight - 1 - line;
      if (spriteHeight === 16) {
        // 8x16: ignore tile bit0; the chosen line selects the half.
        tile &= 0xfe;
        if (line >= 8) {
          tile += 1;
          line -= 8;
        }
      }
      const tileAddr = tile * 16 + line * 2;
      const lo = this.vram[tileAddr]!;
      const hi = this.vram[tileAddr + 1]!;

      for (let px = 0; px < 8; px += 1) {
        const x = ox + px;
        if (x < 0 || x >= GB_W) continue;
        const bit = flipX ? px : 7 - px;
        const colorIdx = ((lo >> bit) & 1) | (((hi >> bit) & 1) << 1);
        if (colorIdx === 0) continue; // transparent
        // BG/OBJ priority: if the sprite is "behind BG" it only shows over BG color 0.
        if (behindBg && bgIndex[x]! !== 0) continue;
        const shade = (palette >> (colorIdx * 2)) & 0x03;
        const [r, g, b] = DMG_PALETTE[shade]!;
        const o = (rowBase + x) * 4;
        this.frame[o] = r;
        this.frame[o + 1] = g;
        this.frame[o + 2] = b;
        this.frame[o + 3] = 0xff;
      }
    }
  }

  // ── Flag helpers ───────────────────────────────────────────────────────────
  private get zf(): boolean {
    return (this.f & 0x80) !== 0;
  }
  private get nf(): boolean {
    return (this.f & 0x40) !== 0;
  }
  private get hf(): boolean {
    return (this.f & 0x20) !== 0;
  }
  private get cf(): boolean {
    return (this.f & 0x10) !== 0;
  }
  private setFlags(z: boolean, n: boolean, hc: boolean, c: boolean): void {
    this.f = (z ? 0x80 : 0) | (n ? 0x40 : 0) | (hc ? 0x20 : 0) | (c ? 0x10 : 0);
  }

  // ── 16-bit register pair accessors ─────────────────────────────────────────
  private get bc(): number {
    return (this.b << 8) | this.c;
  }
  private set bc(v: number) {
    this.b = (v >> 8) & 0xff;
    this.c = v & 0xff;
  }
  private get de(): number {
    return (this.d << 8) | this.e;
  }
  private set de(v: number) {
    this.d = (v >> 8) & 0xff;
    this.e = v & 0xff;
  }
  private get hl(): number {
    return (this.h << 8) | this.l;
  }
  private set hl(v: number) {
    this.h = (v >> 8) & 0xff;
    this.l = v & 0xff;
  }
  private get af(): number {
    return (this.a << 8) | this.f;
  }
  private set af(v: number) {
    this.a = (v >> 8) & 0xff;
    this.f = v & 0xf0;
  }

  // ── Fetch helpers ──────────────────────────────────────────────────────────
  private fetch8(): number {
    const v = this.read8(this.pc);
    this.pc = (this.pc + 1) & 0xffff;
    return v;
  }
  private fetch16(): number {
    const v = this.read16(this.pc);
    this.pc = (this.pc + 2) & 0xffff;
    return v;
  }

  // ── ALU primitives ──────────────────────────────────────────────────────────
  private add8(value: number): void {
    const a = this.a;
    const r = a + value;
    this.setFlags((r & 0xff) === 0, false, (a & 0xf) + (value & 0xf) > 0xf, r > 0xff);
    this.a = r & 0xff;
  }
  private adc8(value: number): void {
    const a = this.a;
    const carry = this.cf ? 1 : 0;
    const r = a + value + carry;
    this.setFlags((r & 0xff) === 0, false, (a & 0xf) + (value & 0xf) + carry > 0xf, r > 0xff);
    this.a = r & 0xff;
  }
  private sub8(value: number): void {
    const a = this.a;
    const r = a - value;
    this.setFlags((r & 0xff) === 0, true, (a & 0xf) - (value & 0xf) < 0, r < 0);
    this.a = r & 0xff;
  }
  private sbc8(value: number): void {
    const a = this.a;
    const carry = this.cf ? 1 : 0;
    const r = a - value - carry;
    this.setFlags((r & 0xff) === 0, true, (a & 0xf) - (value & 0xf) - carry < 0, r < 0);
    this.a = r & 0xff;
  }
  private and8(value: number): void {
    this.a &= value;
    this.setFlags(this.a === 0, false, true, false);
  }
  private xor8(value: number): void {
    this.a ^= value;
    this.setFlags(this.a === 0, false, false, false);
  }
  private or8(value: number): void {
    this.a |= value;
    this.setFlags(this.a === 0, false, false, false);
  }
  private cp8(value: number): void {
    const a = this.a;
    const r = a - value;
    this.setFlags((r & 0xff) === 0, true, (a & 0xf) - (value & 0xf) < 0, r < 0);
  }
  private inc8(value: number): number {
    const r = (value + 1) & 0xff;
    this.setFlags(r === 0, false, (value & 0xf) === 0xf, this.cf);
    return r;
  }
  private dec8(value: number): number {
    const r = (value - 1) & 0xff;
    this.setFlags(r === 0, true, (value & 0xf) === 0, this.cf);
    return r;
  }
  private addHL(value: number): void {
    const hl = this.hl;
    const r = hl + value;
    this.setFlags(this.zf, false, (hl & 0xfff) + (value & 0xfff) > 0xfff, r > 0xffff);
    this.hl = r & 0xffff;
  }
  /** ADD SP,e8 / LD HL,SP+e8 share these flags (computed on the low byte). */
  private addSpE8(): number {
    const e = (this.fetch8() << 24) >> 24; // signed
    const sp = this.sp;
    const r = (sp + e) & 0xffff;
    this.setFlags(false, false, (sp & 0xf) + (e & 0xf) > 0xf, (sp & 0xff) + (e & 0xff) > 0xff);
    return r;
  }

  // ── Rotate / shift primitives (CB + accumulator forms) ─────────────────────
  private rlc(value: number): number {
    const carry = (value >> 7) & 1;
    const r = ((value << 1) | carry) & 0xff;
    this.setFlags(r === 0, false, false, carry === 1);
    return r;
  }
  private rrc(value: number): number {
    const carry = value & 1;
    const r = ((value >> 1) | (carry << 7)) & 0xff;
    this.setFlags(r === 0, false, false, carry === 1);
    return r;
  }
  private rl(value: number): number {
    const carry = this.cf ? 1 : 0;
    const newCarry = (value >> 7) & 1;
    const r = ((value << 1) | carry) & 0xff;
    this.setFlags(r === 0, false, false, newCarry === 1);
    return r;
  }
  private rr(value: number): number {
    const carry = this.cf ? 1 : 0;
    const newCarry = value & 1;
    const r = ((value >> 1) | (carry << 7)) & 0xff;
    this.setFlags(r === 0, false, false, newCarry === 1);
    return r;
  }
  private sla(value: number): number {
    const carry = (value >> 7) & 1;
    const r = (value << 1) & 0xff;
    this.setFlags(r === 0, false, false, carry === 1);
    return r;
  }
  private sra(value: number): number {
    const carry = value & 1;
    const r = ((value >> 1) | (value & 0x80)) & 0xff;
    this.setFlags(r === 0, false, false, carry === 1);
    return r;
  }
  private srl(value: number): number {
    const carry = value & 1;
    const r = (value >> 1) & 0xff;
    this.setFlags(r === 0, false, false, carry === 1);
    return r;
  }
  private swap(value: number): number {
    const r = ((value >> 4) | (value << 4)) & 0xff;
    this.setFlags(r === 0, false, false, false);
    return r;
  }

  // ── 8-bit register get/set by index (B,C,D,E,H,L,(HL),A) ───────────────────
  private getReg(idx: number): number {
    switch (idx) {
      case 0:
        return this.b;
      case 1:
        return this.c;
      case 2:
        return this.d;
      case 3:
        return this.e;
      case 4:
        return this.h;
      case 5:
        return this.l;
      case 6:
        return this.read8(this.hl);
      default:
        return this.a;
    }
  }
  private setReg(idx: number, value: number): void {
    value &= 0xff;
    switch (idx) {
      case 0:
        this.b = value;
        return;
      case 1:
        this.c = value;
        return;
      case 2:
        this.d = value;
        return;
      case 3:
        this.e = value;
        return;
      case 4:
        this.h = value;
        return;
      case 5:
        this.l = value;
        return;
      case 6:
        this.write8(this.hl, value);
        return;
      default:
        this.a = value;
    }
  }

  // ── Stack helpers ──────────────────────────────────────────────────────────
  private push16(value: number): void {
    this.sp = (this.sp - 2) & 0xffff;
    this.write16(this.sp, value);
  }
  private pop16(): number {
    const v = this.read16(this.sp);
    this.sp = (this.sp + 2) & 0xffff;
    return v;
  }

  // ── CB-prefixed opcode dispatch ────────────────────────────────────────────
  private execCB(): number {
    const op = this.fetch8();
    const reg = op & 0x07;
    const isMem = reg === 6;
    const value = this.getReg(reg);
    const group = op >> 6;

    if (group === 0) {
      // Rotates / shifts / swap.
      const sub = (op >> 3) & 0x07;
      let r: number;
      switch (sub) {
        case 0:
          r = this.rlc(value);
          break;
        case 1:
          r = this.rrc(value);
          break;
        case 2:
          r = this.rl(value);
          break;
        case 3:
          r = this.rr(value);
          break;
        case 4:
          r = this.sla(value);
          break;
        case 5:
          r = this.sra(value);
          break;
        case 6:
          r = this.swap(value);
          break;
        default:
          r = this.srl(value);
          break;
      }
      this.setReg(reg, r);
      return isMem ? 16 : 8;
    }
    const bit = (op >> 3) & 0x07;
    if (group === 1) {
      // BIT b,r — Z if bit clear, N=0, H=1, C unchanged.
      const set = (value >> bit) & 1;
      this.f = (set === 0 ? 0x80 : 0) | 0x20 | (this.cf ? 0x10 : 0);
      return isMem ? 12 : 8;
    }
    if (group === 2) {
      // RES b,r
      this.setReg(reg, value & ~(1 << bit));
      return isMem ? 16 : 8;
    }
    // SET b,r
    this.setReg(reg, value | (1 << bit));
    return isMem ? 16 : 8;
  }

  // ── DAA (decimal adjust after add/sub) ─────────────────────────────────────
  private daa(): void {
    let a = this.a;
    let adjust = 0;
    let carry = this.cf;
    if (!this.nf) {
      if (this.hf || (a & 0x0f) > 0x09) adjust |= 0x06;
      if (carry || a > 0x99) {
        adjust |= 0x60;
        carry = true;
      }
      a = (a + adjust) & 0xff;
    } else {
      if (this.hf) adjust |= 0x06;
      if (carry) adjust |= 0x60;
      a = (a - adjust) & 0xff;
    }
    this.a = a;
    this.f = (a === 0 ? 0x80 : 0) | (this.nf ? 0x40 : 0) | (carry ? 0x10 : 0);
  }

  // ── Conditional helpers for JR/JP/CALL/RET cc ──────────────────────────────
  private cond(idx: number): boolean {
    switch (idx) {
      case 0:
        return !this.zf; // NZ
      case 1:
        return this.zf; // Z
      case 2:
        return !this.cf; // NC
      default:
        return this.cf; // C
    }
  }

  /**
   * Execute one CPU instruction. Returns the number of T-cycles consumed.
   * Implements all 256 base opcodes (CB prefix delegates to execCB).
   */
  private step(): number {
    if (this.halted) return 4; // idle until an interrupt wakes us

    const op = this.fetch8();
    switch (op) {
      // ── 0x00-0x0F ──
      case 0x00:
        return 4; // NOP
      case 0x01:
        this.bc = this.fetch16();
        return 12; // LD BC,d16
      case 0x02:
        this.write8(this.bc, this.a);
        return 8; // LD (BC),A
      case 0x03:
        this.bc = (this.bc + 1) & 0xffff;
        return 8; // INC BC
      case 0x04:
        this.b = this.inc8(this.b);
        return 4;
      case 0x05:
        this.b = this.dec8(this.b);
        return 4;
      case 0x06:
        this.b = this.fetch8();
        return 8;
      case 0x07: {
        // RLCA
        const c = (this.a >> 7) & 1;
        this.a = ((this.a << 1) | c) & 0xff;
        this.setFlags(false, false, false, c === 1);
        return 4;
      }
      case 0x08: {
        // LD (a16),SP
        const addr = this.fetch16();
        this.write16(addr, this.sp);
        return 20;
      }
      case 0x09:
        this.addHL(this.bc);
        return 8;
      case 0x0a:
        this.a = this.read8(this.bc);
        return 8;
      case 0x0b:
        this.bc = (this.bc - 1) & 0xffff;
        return 8;
      case 0x0c:
        this.c = this.inc8(this.c);
        return 4;
      case 0x0d:
        this.c = this.dec8(this.c);
        return 4;
      case 0x0e:
        this.c = this.fetch8();
        return 8;
      case 0x0f: {
        // RRCA
        const c = this.a & 1;
        this.a = ((this.a >> 1) | (c << 7)) & 0xff;
        this.setFlags(false, false, false, c === 1);
        return 4;
      }

      // ── 0x10-0x1F ──
      case 0x10:
        this.fetch8();
        return 4; // STOP (treat as 2-byte NOP)
      case 0x11:
        this.de = this.fetch16();
        return 12;
      case 0x12:
        this.write8(this.de, this.a);
        return 8;
      case 0x13:
        this.de = (this.de + 1) & 0xffff;
        return 8;
      case 0x14:
        this.d = this.inc8(this.d);
        return 4;
      case 0x15:
        this.d = this.dec8(this.d);
        return 4;
      case 0x16:
        this.d = this.fetch8();
        return 8;
      case 0x17: {
        // RLA
        const c = this.cf ? 1 : 0;
        const newC = (this.a >> 7) & 1;
        this.a = ((this.a << 1) | c) & 0xff;
        this.setFlags(false, false, false, newC === 1);
        return 4;
      }
      case 0x18: {
        // JR r8
        const e = (this.fetch8() << 24) >> 24;
        this.pc = (this.pc + e) & 0xffff;
        return 12;
      }
      case 0x19:
        this.addHL(this.de);
        return 8;
      case 0x1a:
        this.a = this.read8(this.de);
        return 8;
      case 0x1b:
        this.de = (this.de - 1) & 0xffff;
        return 8;
      case 0x1c:
        this.e = this.inc8(this.e);
        return 4;
      case 0x1d:
        this.e = this.dec8(this.e);
        return 4;
      case 0x1e:
        this.e = this.fetch8();
        return 8;
      case 0x1f: {
        // RRA
        const c = this.cf ? 1 : 0;
        const newC = this.a & 1;
        this.a = ((this.a >> 1) | (c << 7)) & 0xff;
        this.setFlags(false, false, false, newC === 1);
        return 4;
      }

      // ── 0x20-0x2F ──
      case 0x20: {
        // JR NZ,r8
        const e = (this.fetch8() << 24) >> 24;
        if (!this.zf) {
          this.pc = (this.pc + e) & 0xffff;
          return 12;
        }
        return 8;
      }
      case 0x21:
        this.hl = this.fetch16();
        return 12;
      case 0x22:
        this.write8(this.hl, this.a);
        this.hl = (this.hl + 1) & 0xffff;
        return 8; // LD (HL+),A
      case 0x23:
        this.hl = (this.hl + 1) & 0xffff;
        return 8;
      case 0x24:
        this.h = this.inc8(this.h);
        return 4;
      case 0x25:
        this.h = this.dec8(this.h);
        return 4;
      case 0x26:
        this.h = this.fetch8();
        return 8;
      case 0x27:
        this.daa();
        return 4;
      case 0x28: {
        // JR Z,r8
        const e = (this.fetch8() << 24) >> 24;
        if (this.zf) {
          this.pc = (this.pc + e) & 0xffff;
          return 12;
        }
        return 8;
      }
      case 0x29:
        this.addHL(this.hl);
        return 8;
      case 0x2a:
        this.a = this.read8(this.hl);
        this.hl = (this.hl + 1) & 0xffff;
        return 8; // LD A,(HL+)
      case 0x2b:
        this.hl = (this.hl - 1) & 0xffff;
        return 8;
      case 0x2c:
        this.l = this.inc8(this.l);
        return 4;
      case 0x2d:
        this.l = this.dec8(this.l);
        return 4;
      case 0x2e:
        this.l = this.fetch8();
        return 8;
      case 0x2f: // CPL
        this.a = ~this.a & 0xff;
        this.f = (this.zf ? 0x80 : 0) | 0x40 | 0x20 | (this.cf ? 0x10 : 0);
        return 4;

      // ── 0x30-0x3F ──
      case 0x30: {
        // JR NC,r8
        const e = (this.fetch8() << 24) >> 24;
        if (!this.cf) {
          this.pc = (this.pc + e) & 0xffff;
          return 12;
        }
        return 8;
      }
      case 0x31:
        this.sp = this.fetch16();
        return 12;
      case 0x32:
        this.write8(this.hl, this.a);
        this.hl = (this.hl - 1) & 0xffff;
        return 8; // LD (HL-),A
      case 0x33:
        this.sp = (this.sp + 1) & 0xffff;
        return 8;
      case 0x34:
        this.write8(this.hl, this.inc8(this.read8(this.hl)));
        return 12; // INC (HL)
      case 0x35:
        this.write8(this.hl, this.dec8(this.read8(this.hl)));
        return 12; // DEC (HL)
      case 0x36:
        this.write8(this.hl, this.fetch8());
        return 12; // LD (HL),d8
      case 0x37: // SCF
        this.f = (this.zf ? 0x80 : 0) | 0x10;
        return 4;
      case 0x38: {
        // JR C,r8
        const e = (this.fetch8() << 24) >> 24;
        if (this.cf) {
          this.pc = (this.pc + e) & 0xffff;
          return 12;
        }
        return 8;
      }
      case 0x39:
        this.addHL(this.sp);
        return 8;
      case 0x3a:
        this.a = this.read8(this.hl);
        this.hl = (this.hl - 1) & 0xffff;
        return 8; // LD A,(HL-)
      case 0x3b:
        this.sp = (this.sp - 1) & 0xffff;
        return 8;
      case 0x3c:
        this.a = this.inc8(this.a);
        return 4;
      case 0x3d:
        this.a = this.dec8(this.a);
        return 4;
      case 0x3e:
        this.a = this.fetch8();
        return 8;
      case 0x3f: // CCF
        this.f = (this.zf ? 0x80 : 0) | (this.cf ? 0 : 0x10);
        return 4;

      // ── 0x40-0x7F: LD r,r and HALT (0x76) ──
      default:
        break;
    }

    // LD r,r' block (0x40-0x7F).
    if (op >= 0x40 && op <= 0x7f) {
      if (op === 0x76) {
        this.halted = true; // HALT
        return 4;
      }
      const dst = (op >> 3) & 0x07;
      const src = op & 0x07;
      const value = this.getReg(src);
      this.setReg(dst, value);
      return dst === 6 || src === 6 ? 8 : 4;
    }

    // ALU A,r block (0x80-0xBF).
    if (op >= 0x80 && op <= 0xbf) {
      const src = op & 0x07;
      const value = this.getReg(src);
      const aluOp = (op >> 3) & 0x07;
      switch (aluOp) {
        case 0:
          this.add8(value);
          break;
        case 1:
          this.adc8(value);
          break;
        case 2:
          this.sub8(value);
          break;
        case 3:
          this.sbc8(value);
          break;
        case 4:
          this.and8(value);
          break;
        case 5:
          this.xor8(value);
          break;
        case 6:
          this.or8(value);
          break;
        default:
          this.cp8(value);
          break;
      }
      return src === 6 ? 8 : 4;
    }

    // ── 0xC0-0xFF: control flow, stack, immediates, IO ──
    switch (op) {
      case 0xc0:
        if (!this.zf) {
          this.pc = this.pop16();
          return 20;
        }
        return 8; // RET NZ
      case 0xc1:
        this.bc = this.pop16();
        return 12;
      case 0xc2: {
        const a = this.fetch16();
        if (!this.zf) {
          this.pc = a;
          return 16;
        }
        return 12;
      } // JP NZ
      case 0xc3:
        this.pc = this.fetch16();
        return 16; // JP a16
      case 0xc4: {
        const a = this.fetch16();
        if (!this.zf) {
          this.push16(this.pc);
          this.pc = a;
          return 24;
        }
        return 12;
      } // CALL NZ
      case 0xc5:
        this.push16(this.bc);
        return 16;
      case 0xc6:
        this.add8(this.fetch8());
        return 8;
      case 0xc7:
        this.push16(this.pc);
        this.pc = 0x00;
        return 16; // RST 00
      case 0xc8:
        if (this.zf) {
          this.pc = this.pop16();
          return 20;
        }
        return 8; // RET Z
      case 0xc9:
        this.pc = this.pop16();
        return 16; // RET
      case 0xca: {
        const a = this.fetch16();
        if (this.zf) {
          this.pc = a;
          return 16;
        }
        return 12;
      } // JP Z
      case 0xcb:
        return this.execCB();
      case 0xcc: {
        const a = this.fetch16();
        if (this.zf) {
          this.push16(this.pc);
          this.pc = a;
          return 24;
        }
        return 12;
      } // CALL Z
      case 0xcd: {
        const a = this.fetch16();
        this.push16(this.pc);
        this.pc = a;
        return 24;
      } // CALL a16
      case 0xce:
        this.adc8(this.fetch8());
        return 8;
      case 0xcf:
        this.push16(this.pc);
        this.pc = 0x08;
        return 16; // RST 08

      case 0xd0:
        if (!this.cf) {
          this.pc = this.pop16();
          return 20;
        }
        return 8; // RET NC
      case 0xd1:
        this.de = this.pop16();
        return 12;
      case 0xd2: {
        const a = this.fetch16();
        if (!this.cf) {
          this.pc = a;
          return 16;
        }
        return 12;
      } // JP NC
      // 0xd3 — illegal
      case 0xd4: {
        const a = this.fetch16();
        if (!this.cf) {
          this.push16(this.pc);
          this.pc = a;
          return 24;
        }
        return 12;
      } // CALL NC
      case 0xd5:
        this.push16(this.de);
        return 16;
      case 0xd6:
        this.sub8(this.fetch8());
        return 8;
      case 0xd7:
        this.push16(this.pc);
        this.pc = 0x10;
        return 16; // RST 10
      case 0xd8:
        if (this.cf) {
          this.pc = this.pop16();
          return 20;
        }
        return 8; // RET C
      case 0xd9:
        this.pc = this.pop16();
        this.ime = true;
        return 16; // RETI
      case 0xda: {
        const a = this.fetch16();
        if (this.cf) {
          this.pc = a;
          return 16;
        }
        return 12;
      } // JP C
      // 0xdb — illegal
      case 0xdc: {
        const a = this.fetch16();
        if (this.cf) {
          this.push16(this.pc);
          this.pc = a;
          return 24;
        }
        return 12;
      } // CALL C
      // 0xdd — illegal
      case 0xde:
        this.sbc8(this.fetch8());
        return 8;
      case 0xdf:
        this.push16(this.pc);
        this.pc = 0x18;
        return 16; // RST 18

      case 0xe0:
        this.write8(0xff00 + this.fetch8(), this.a);
        return 12; // LDH (a8),A
      case 0xe1:
        this.hl = this.pop16();
        return 12;
      case 0xe2:
        this.write8(0xff00 + this.c, this.a);
        return 8; // LD (C),A
      // 0xe3, 0xe4 — illegal
      case 0xe5:
        this.push16(this.hl);
        return 16;
      case 0xe6:
        this.and8(this.fetch8());
        return 8;
      case 0xe7:
        this.push16(this.pc);
        this.pc = 0x20;
        return 16; // RST 20
      case 0xe8:
        this.sp = this.addSpE8();
        return 16; // ADD SP,r8
      case 0xe9:
        this.pc = this.hl;
        return 4; // JP (HL)
      case 0xea:
        this.write8(this.fetch16(), this.a);
        return 16; // LD (a16),A
      // 0xeb, 0xec, 0xed — illegal
      case 0xee:
        this.xor8(this.fetch8());
        return 8;
      case 0xef:
        this.push16(this.pc);
        this.pc = 0x28;
        return 16; // RST 28

      case 0xf0:
        this.a = this.read8(0xff00 + this.fetch8());
        return 12; // LDH A,(a8)
      case 0xf1:
        this.af = this.pop16();
        return 12;
      case 0xf2:
        this.a = this.read8(0xff00 + this.c);
        return 8; // LD A,(C)
      case 0xf3:
        this.ime = false;
        this.imePending = false;
        return 4; // DI
      // 0xf4 — illegal
      case 0xf5:
        this.push16(this.af);
        return 16;
      case 0xf6:
        this.or8(this.fetch8());
        return 8;
      case 0xf7:
        this.push16(this.pc);
        this.pc = 0x30;
        return 16; // RST 30
      case 0xf8: {
        // LD HL,SP+r8
        this.hl = this.addSpE8();
        return 12;
      }
      case 0xf9:
        this.sp = this.hl;
        return 8; // LD SP,HL
      case 0xfa:
        this.a = this.read8(this.fetch16());
        return 16; // LD A,(a16)
      case 0xfb:
        this.imePending = true;
        return 4; // EI (delayed one instruction)
      // 0xfc, 0xfd — illegal
      case 0xfe:
        this.cp8(this.fetch8());
        return 8; // CP d8
      case 0xff:
        this.push16(this.pc);
        this.pc = 0x38;
        return 16; // RST 38

      default:
        // Illegal/undefined opcode — behave as a NOP so the test ROM survives.
        return 4;
    }
  }

  /**
   * Run one full frame (~70224 T-cycles). Steps the CPU instruction-by-instruction,
   * advancing the timers, PPU, and servicing interrupts after each, and returns
   * once a VBlank has produced a fresh framebuffer.
   */
  runFrame(): void {
    this.frameReady = false;
    let budget = 70224;
    let guard = 2_000_000; // safety bound against a runaway loop
    while (budget > 0 && guard-- > 0) {
      // EI enables interrupts AFTER the instruction following it.
      const enableImeAfter = this.imePending;

      const cycles = this.step();
      this.stepTimers(cycles);
      this.stepPpu(cycles);
      if (this.apu) this.apu.step(cycles);
      budget -= cycles;

      if (enableImeAfter) {
        this.ime = true;
        this.imePending = false;
      }

      const intCycles = this.serviceInterrupts();
      if (intCycles > 0) {
        this.stepTimers(intCycles);
        this.stepPpu(intCycles);
        if (this.apu) this.apu.step(intCycles);
        budget -= intCycles;
      }

      if (this.frameReady && budget <= 0) break;
    }
  }
}

// ════════════════════════════════════════════════════════════════════════════
// GPU presentation
// ════════════════════════════════════════════════════════════════════════════

// Fullscreen-triangle VS (SV_VertexID, no IA buffers).
const VS_SOURCE = `
struct VSOut { float4 pos : SV_Position; float2 uv : TEXCOORD0; };
VSOut main(uint vid : SV_VertexID) {
  VSOut o;
  float2 p = float2((vid << 1) & 2, vid & 2);
  o.uv = p;
  o.pos = float4(p * float2(2.0, -2.0) + float2(-1.0, 1.0), 0.0, 1.0);
  return o;
}
`;

// LCD pixel shader: integer-scale-to-fit + letterbox + soft DMG-green LCD look.
const PS_SOURCE = `
cbuffer Frame : register(b0) {
  float2 outRes; // window client resolution
  float2 gbRes;  // 160x144
  float  scale;  // integer scale factor
  float  pad0; float pad1; float pad2;
};
Texture2D Screen : register(t0);
SamplerState Smp : register(s0);

float4 main(float4 fragPos : SV_Position, float2 uv : TEXCOORD0) : SV_Target {
  // Centred integer-scaled rectangle inside the window (letterboxed).
  float2 drawSize = gbRes * scale;
  float2 origin = floor((outRes - drawSize) * 0.5);
  float2 local = fragPos.xy - origin;

  // Background: a dark, slightly green console bezel with a gentle vignette.
  float2 q = fragPos.xy / outRes;
  float vig = pow(16.0 * q.x * q.y * (1.0 - q.x) * (1.0 - q.y), 0.22);
  float3 bezel = lerp(float3(0.015, 0.03, 0.02), float3(0.05, 0.08, 0.06), vig);

  if (local.x < 0.0 || local.y < 0.0 || local.x >= drawSize.x || local.y >= drawSize.y) {
    return float4(bezel, 1.0);
  }

  // Sample the GB framebuffer (POINT — crisp pixels).
  float2 gbUv = local / drawSize;
  float3 c = Screen.Sample(Smp, gbUv).rgb;

  // Per-GB-pixel coordinates for a subtle dot-matrix LCD grid.
  float2 gpix = gbUv * gbRes;
  float2 fpart = frac(gpix);
  // Thin, gentle grid lines: only the outer ~7% of each cell edge is dimmed, and
  // only by a few percent, so the grid reads as an LCD lattice rather than a
  // checkerboard that fights the game's 1-pixel dithered fills.
  float lineW = 0.07;
  float gridX = smoothstep(0.0, lineW, fpart.x) * smoothstep(0.0, lineW, 1.0 - fpart.x);
  float gridY = smoothstep(0.0, lineW, fpart.y) * smoothstep(0.0, lineW, 1.0 - fpart.y);
  float grid = lerp(0.93, 1.0, gridX * gridY);
  // Only show the grid when scaled up enough to read it.
  grid = lerp(1.0, grid, saturate((scale - 2.0) / 2.0));

  c *= grid;

  // Authentic DMG look: nudge toward the green LCD primaries, lift the deep
  // shade slightly (real DMG black is a dark olive, never pure black), and add
  // a touch of contrast for that crisp-yet-washed reflective-LCD feel.
  c = pow(saturate(c), 0.92);
  c = lerp(float3(0.03, 0.07, 0.04), float3(0.94, 1.0, 0.86), c); // remap into DMG gamut
  c *= float3(0.99, 1.03, 0.93);

  // Thin inner border / screen edge highlight.
  float edge = min(min(local.x, local.y), min(drawSize.x - local.x, drawSize.y - local.y));
  float rim = smoothstep(0.0, scale * 1.5, edge);
  c = lerp(c * 0.6 + float3(0.02, 0.04, 0.03), c, rim);

  c *= lerp(0.85, 1.0, vig);
  return float4(saturate(c), 1.0);
}
`;

function comReleaseSafe(ptr: bigint | undefined): void {
  if (ptr !== undefined && ptr !== 0n) gpu.comRelease(ptr);
}

function main(): void {
  // ROM selection: the default boots the bundled homebrew game (Libbet and the
  // Magic Floor, zlib-licensed); GB_ROM=acid2 boots the dmg-acid2 PPU test instead.
  const romChoice = (process.env.GB_ROM ?? 'game').toLowerCase();
  const playingGame = romChoice === 'game' || romChoice === 'libbet';
  const rom = playingGame ? loadLibbet() : loadAcid2();
  const romTitle = playingGame ? 'Libbet and the Magic Floor (zlib · pinobatch)' : 'dmg-acid2';

  const win = gpu.createWindow({ title: `Game Boy — ${romTitle} (pure-TS emulator)`, width: WIN_W, height: WIN_H, borderless: false });
  const { w: cw, h: ch } = win.clientSize();
  const g = gpu.createDevice(win.hwnd, { width: cw, height: ch });

  let vs: bigint;
  let ps: bigint;
  let vsCode: gpu.CompiledShader;
  let psCode: gpu.CompiledShader;
  try {
    vsCode = gpu.compile(VS_SOURCE, 'main', 'vs_5_0');
    psCode = gpu.compile(PS_SOURCE, 'main', 'ps_5_0');
    vs = gpu.makeVertexShader(vsCode);
    ps = gpu.makePixelShader(psCode);
  } catch (err) {
    console.error(String((err as Error).message));
    comReleaseSafe(g.backBufferRTV);
    comReleaseSafe(g.swapChain);
    comReleaseSafe(g.context);
    comReleaseSafe(g.device);
    win.destroy();
    process.exit(1);
  }

  // 160x144 RGBA8 screen texture (uploaded each emulated frame) + point sampler.
  const screen = gpu.makeTexture({ w: GB_W, h: GB_H, format: gpu.DXGI_FORMAT_R8G8B8A8_UNORM, srv: true });
  const samp = gpu.makeSampler({ filter: gpu.D3D11_FILTER_MIN_MAG_MIP_POINT, address: gpu.D3D11_TEXTURE_ADDRESS_CLAMP });
  const cb = gpu.makeConstantBuffer(48);
  const cbData = Buffer.alloc(48);

  // Persistent upload buffer for the framebuffer (kept referenced so GC can't free it).
  const uploadBuf = Buffer.alloc(GB_W * GB_H * 4);

  // XInput state buffer (16 bytes) reused each frame.
  const xinputBuf = Buffer.alloc(16);

  // ── Audio: real DMG APU → 48 kHz stereo PCM via XAudio2 ────────────────────
  // Degrades silently when no endpoint is present (createPcmOutput is a no-op).
  const AUDIO_RATE = 48000;
  const pcm = audio.createPcmOutput({ sampleRate: AUDIO_RATE, channels: 2 });
  const apu = new Apu(AUDIO_RATE);
  if (pcm.available) {
    pcm.setVolume(0.6);
    pcm.start();
  }

  const gb = new GameBoy(rom, apu);

  const hudFont = GDI32.CreateFontW(-17, 0, 0, 0, 600, 0, 0, 0, 0, 0, 0, 4 /* ANTIALIASED_QUALITY */, 0, Buffer.from('Consolas\0', 'utf16le').ptr!);

  console.log(`Game Boy (DMG) — pure-TypeScript SM83 emulator + APU running ${romTitle}.`);
  console.log(`  ${g.driver} · ${g.gpuName}`);
  console.log(`  ROM: ${playingGame ? 'libbet.gb' : 'dmg-acid2.gb'} (${rom.length} bytes, MBC type 0x${(rom[0x147] ?? 0).toString(16).padStart(2, '0')})`);
  console.log(`  Audio: ${pcm.available ? `XAudio2 @ ${AUDIO_RATE} Hz stereo (4-channel DMG APU)` : 'no endpoint — silent'}`);
  console.log('  Arrows = D-pad · Z=A · X=B · Enter=Start · RShift=Select · ESC to exit.');

  const startTime = performance.now();
  const durationMs = process.env.DEMO_DURATION_MS ? Number(process.env.DEMO_DURATION_MS) : 0;
  let frames = 0;
  let emuFrames = 0;
  let audioBlocks = 0;
  let audioPeak = 0;
  let fps = 0;
  let fpsWindowStart = startTime;
  let captured = false;

  // Scripted timeline (capture/headless mode): walk the title screen into actual
  // gameplay. Each entry holds buttons for [fromMs, toMs). Pulses of Start get
  // past the title/menu; directional rolls put Libbet mid-floor for the shot.
  type Btns = { right: boolean; left: boolean; up: boolean; down: boolean; a: boolean; bBtn: boolean; select: boolean; start: boolean };
  const NONE: Btns = { right: false, left: false, up: false, down: false, a: false, bBtn: false, select: false, start: false };
  function scripted(ms: number): Btns {
    if (!playingGame) return NONE;
    // Press Start in short pulses (release between so the game sees edges) to get
    // through the intro/title into a floor, then roll around the magic floor so
    // the capture lands on lively, in-progress gameplay (tracks left, % climbing).
    // Wall-clock timeline; in capture mode the emulator runs at a small turbo so
    // these windows clear the (real-time-slow) logo + copyright + story screens
    // quickly, then play the floor. Tap Start across the first ~2.4 s (each pulse
    // is an edge the menu/story screens consume) to reach a live floor.
    const pulse = (lo: number, hi: number) => ms >= lo && ms < hi;
    if (pulse(200, 320) || pulse(520, 640) || pulse(840, 960) || pulse(1160, 1280) || pulse(1480, 1600) || pulse(1800, 1920) || pulse(2120, 2240) || pulse(2440, 2560)) {
      return { ...NONE, start: true };
    }
    // Then roll a tour of the magic floor — each move leaves a track and bumps
    // the % counter, so the captured frame shows lively, in-progress gameplay.
    if (pulse(2900, 3080)) return { ...NONE, right: true };
    if (pulse(3260, 3440)) return { ...NONE, down: true };
    if (pulse(3620, 3800)) return { ...NONE, right: true };
    if (pulse(3980, 4160)) return { ...NONE, down: true };
    if (pulse(4340, 4520)) return { ...NONE, left: true };
    if (pulse(4700, 4880)) return { ...NONE, down: true };
    if (pulse(5060, 5240)) return { ...NONE, left: true };
    if (pulse(5420, 5600)) return { ...NONE, up: true };
    if (pulse(5780, 5960)) return { ...NONE, left: true };
    if (pulse(6140, 6320)) return { ...NONE, up: true };
    if (pulse(6500, 6680)) return { ...NONE, right: true };
    if (pulse(6860, 7040)) return { ...NONE, down: true };
    if (pulse(7220, 7400)) return { ...NONE, right: true };
    return NONE;
  }

  function pollInput(scriptMs: number): void {
    // Capture mode: fully scripted, no live keyboard/pad polling.
    if (durationMs > 0) {
      gb.setButtons(scripted(scriptMs));
      return;
    }
    // Keyboard (interactive only).
    let right = win.keyDown(VK_RIGHT);
    let left = win.keyDown(VK_LEFT);
    let up = win.keyDown(VK_UP);
    let down = win.keyDown(VK_DOWN);
    let a = win.keyDown(VK_Z);
    let bBtn = win.keyDown(VK_X);
    let start = win.keyDown(VK_RETURN);
    let select = win.keyDown(VK_RSHIFT);

    // XInput gamepad (controller 0), OR'd with the keyboard.
    if (Xinput1_4.XInputGetState(0, xinputBuf.ptr!) === 0) {
      const buttons = xinputBuf.readUInt16LE(4);
      const lx = xinputBuf.readInt16LE(6 + 2); // sThumbLX @ offset 8
      const ly = xinputBuf.readInt16LE(8 + 2); // sThumbLY @ offset 10
      const DZ = 7849;
      if (buttons & 0x1000) a = true; // A
      if (buttons & 0x2000) bBtn = true; // B
      if (buttons & 0x0010) start = true; // START
      if (buttons & 0x0020) select = true; // BACK
      if (buttons & 0x0001 || ly > DZ) up = true;
      if (buttons & 0x0002 || ly < -DZ) down = true;
      if (buttons & 0x0004 || lx < -DZ) left = true;
      if (buttons & 0x0008 || lx > DZ) right = true;
    }

    gb.setButtons({ right, left, up, down, a, bBtn, select, start });
  }

  function uploadFrame(): void {
    // Copy the emulator framebuffer into the persistent upload buffer, then push
    // it to the GPU texture via UpdateSubresource (raw COM vtable invoke).
    uploadBuf.set(gb.frame);
    gpu.vcall(g.context, gpu.CTX_UPDATE_SUBRESOURCE, [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], [screen.tex, 0, null, uploadBuf.ptr!, GB_W * 4, 0], FFIType.void);
  }

  function drawHud(): void {
    hud.draw(g, cw, ch, (dc) => {
      const prevFont = GDI32.SelectObject(dc, hudFont);
      GDI32.SetBkMode(dc, TRANSPARENT_BK);
      const what = playingGame ? 'Libbet & the Magic Floor' : 'dmg-acid2 PPU test';
      const snd = pcm.available ? ' · APU♪' : '';
      const line = `Game Boy · ${what} · pure-TS SM83${snd} · ${fps} fps`;
      const text = Buffer.from(`${line}\0`, 'utf16le');
      GDI32.SetTextColor(dc, 0x00102018);
      GDI32.TextOutW(dc, 13, 11, text.ptr!, line.length);
      GDI32.SetTextColor(dc, 0x0070c088); // BGR — DMG green
      GDI32.TextOutW(dc, 12, 10, text.ptr!, line.length);
      GDI32.SelectObject(dc, prevFont);
    });
  }

  function renderToBackBuffer(): void {
    // Integer scale-to-fit (with a small margin so the bezel always shows).
    const scale = Math.max(1, Math.floor(Math.min(cw / GB_W, ch / GB_H)));
    cbData.writeFloatLE(cw, 0); // outRes.x
    cbData.writeFloatLE(ch, 4); // outRes.y
    cbData.writeFloatLE(GB_W, 8); // gbRes.x
    cbData.writeFloatLE(GB_H, 12); // gbRes.y
    cbData.writeFloatLE(scale, 16); // scale
    cbData.writeFloatLE(0, 20);
    cbData.writeFloatLE(0, 24);
    cbData.writeFloatLE(0, 28);
    gpu.updateConstantBuffer(cb, cbData);

    gpu.setRenderTargets([g.backBufferRTV]);
    gpu.setViewport(cw, ch);
    gpu.clear(g.backBufferRTV, [0.02, 0.03, 0.02, 1]);
    gpu.vsSet(vs);
    gpu.psSet(ps, { cb: [cb], srv: [screen.srv!], samp: [samp] });
    gpu.drawFullscreenTriangle();
  }

  // Pace the emulator to the authentic DMG refresh (~59.7 Hz) so audio runs at
  // real time and the picture is smooth. In capture mode we run a small turbo
  // multiplier so the scripted timeline can clear the (slow, real-time) intro
  // sequence AND play a stretch of the floor within the short capture budget;
  // audio still streams (the queue throttle drops anything XAudio2 can't take).
  const GB_FRAME_MS = 1000 / 59.7;
  const TURBO = durationMs > 0 && playingGame ? 4 : 1;
  let nextDue = startTime;

  while (!win.shouldClose()) {
    win.pump();
    if (win.shouldClose()) break;

    const now = performance.now();
    pollInput(now - startTime);

    // Advance the emulator for every refresh interval that has elapsed (catching
    // up at most a few frames). At capture time, force one final step so the shot
    // always reflects the freshest game state even if the clock hasn't ticked.
    let ran = 0;
    const forceStep = durationMs > 0 && now - startTime >= durationMs && !captured && emuFrames === 0;
    while ((now >= nextDue && ran < 4 * TURBO) || (forceStep && ran === 0)) {
      gb.runFrame();
      emuFrames += 1;
      if (ran % TURBO === TURBO - 1) nextDue += GB_FRAME_MS;
      ran += 1;

      // Feed freshly-generated audio to XAudio2, keeping the queue short so the
      // sound stays in lockstep with the picture (target < 4 outstanding buffers).
      if (pcm.available && pcm.queued() < 4) {
        const block = gb.apu!.drain(AUDIO_RATE); // up to one frame's worth
        if (block.length > 0) {
          pcm.submit(block);
          audioBlocks += 1;
          if (process.env.GB_AUDIO_DEBUG) {
            let peak = 0;
            for (let i = 0; i < block.length; i += 1) {
              const v = Math.abs(block[i]!);
              if (v > peak) peak = v;
            }
            if (peak > audioPeak) audioPeak = peak;
          }
        }
      }
    }

    uploadFrame();
    renderToBackBuffer();

    // Capture mode: on the last frame, grab the gallery PNG before present().
    if (durationMs > 0 && now - startTime >= durationMs && !captured) {
      captured = true;
      const { resolve } = require('node:path') as typeof import('node:path');
      const { mkdirSync } = require('node:fs') as typeof import('node:fs');
      const shotDir = resolve(import.meta.dir, '..', 'screenshots');
      mkdirSync(shotDir, { recursive: true });
      drawHud(); // composite the HUD into the back buffer so it appears in the shot
      const stats = captureBackBuffer(g, resolve(shotDir, 'gameboy.png'), { gridW: 48, gridH: 22 });
      console.log(formatGrid(stats));
      console.log(`[shot] ok=${stats.ok} nonBlack=${stats.nonBlackFrac.toFixed(3)} meanLuma=${stats.meanLuma.toFixed(3)} -> ${stats.path}`);
      console.log(`[audio] available=${pcm.available} queued=${pcm.available ? pcm.queued() : 0} blocksSubmitted=${audioBlocks} apuPending=${gb.apu!.pending}${process.env.GB_AUDIO_DEBUG ? ` peakAmp=${audioPeak}` : ''}`);
      g.present(false);
      break;
    }

    drawHud();
    g.present(false);

    frames += 1;
    if (now - fpsWindowStart >= 500) {
      fps = Math.round((frames * 1000) / (now - fpsWindowStart));
      frames = 0;
      fpsWindowStart = now;
    }
  }

  console.log(`Done. emulated frames=${emuFrames}, ~${fps} fps · ${g.gpuName}`);

  // ── Teardown ─────────────────────────────────────────────────────────────
  pcm.close();
  hud.release();
  GDI32.DeleteObject(hudFont);
  comReleaseSafe(samp);
  comReleaseSafe(cb);
  comReleaseSafe(screen.srv);
  comReleaseSafe(screen.tex);
  comReleaseSafe(ps);
  comReleaseSafe(vs);
  gpu.blobRelease(psCode.blob);
  gpu.blobRelease(vsCode.blob);
  comReleaseSafe(g.backBufferRTV);
  comReleaseSafe(g.swapChain);
  comReleaseSafe(g.context);
  comReleaseSafe(g.device);
  win.destroy();
  process.exit(0);
}

process.on('SIGINT', () => process.exit(0));
process.on('uncaughtException', (e) => {
  console.error(e);
  process.exit(1);
});

main();
