/**
 * gba-apu.ts — the Game Boy Advance sound: the two DirectSound DMA channels
 * (8-bit signed PCM streamed through a 32-byte FIFO, clocked by a timer overflow
 * and refilled by DMA) that drive nearly all GBA game music and effects. The four
 * legacy PSG channels are summed in at a fixed approximation; FireRed and most
 * modern titles route everything through the DMA channels.
 *
 * The system calls onTimerOverflow() when timer 0/1 overflows (pop a sample),
 * pushFifoA/B() when DMA writes to the FIFO, and step() once per CPU chunk to
 * resample the mix down to the host rate. The front-end drains stereo Int16 and
 * submits it to XAudio2.
 */
const GBA_CPU_HZ = 16777216;

export class GbaApu {
  private readonly sampleRate: number;
  private readonly cyclesPerSample: number;
  private sampleClock = 0;

  // DirectSound channel A/B FIFOs (signed 8-bit), 32 bytes each.
  private readonly fifoA = new Int8Array(32);
  private readonly fifoB = new Int8Array(32);
  private aHead = 0; private aTail = 0; private aCount = 0;
  private bHead = 0; private bTail = 0; private bCount = 0;
  private curA = 0; private curB = 0; // last sample popped (held until next overflow)

  // SOUNDCNT_H config.
  private aVolHalf = false; private bVolHalf = false;
  private aRight = false; private aLeft = false; private aTimer = 0;
  private bRight = false; private bLeft = false; private bTimer = 0;
  private masterOn = false;

  // DMA refill requests (read + cleared by the system after stepping timers).
  dmaReqA = false;
  dmaReqB = false;

  // Output ring (interleaved L,R Int16).
  private readonly out: Int16Array;
  private outWrite = 0;
  private outCount = 0;

  constructor(sampleRate: number) {
    this.sampleRate = sampleRate;
    this.cyclesPerSample = GBA_CPU_HZ / sampleRate;
    this.out = new Int16Array(2 * Math.ceil(sampleRate * 0.3));
  }

  /** SOUNDCNT_H (0x04000082) write — DirectSound routing/volume/timer select. */
  writeControlH(value: number): void {
    this.aVolHalf = (value & 0x0004) === 0; // bit2: 1 = full, 0 = half
    this.bVolHalf = (value & 0x0008) === 0;
    this.aRight = (value & 0x0100) !== 0;
    this.aLeft = (value & 0x0200) !== 0;
    this.aTimer = (value & 0x0400) ? 1 : 0;
    if (value & 0x0800) { this.aHead = this.aTail = this.aCount = 0; } // FIFO A reset
    this.bRight = (value & 0x1000) !== 0;
    this.bLeft = (value & 0x2000) !== 0;
    this.bTimer = (value & 0x4000) ? 1 : 0;
    if (value & 0x8000) { this.bHead = this.bTail = this.bCount = 0; } // FIFO B reset
  }

  /** SOUNDCNT_X (0x04000084) write — master sound enable (bit7). */
  writeControlX(value: number): void {
    this.masterOn = (value & 0x80) !== 0;
  }

  pushFifoA(byte: number): void {
    if (this.aCount >= 32) return;
    this.fifoA[this.aTail] = (byte << 24) >> 24;
    this.aTail = (this.aTail + 1) & 31;
    this.aCount += 1;
  }
  pushFifoB(byte: number): void {
    if (this.bCount >= 32) return;
    this.fifoB[this.bTail] = (byte << 24) >> 24;
    this.bTail = (this.bTail + 1) & 31;
    this.bCount += 1;
  }

  /** Timer 0/1 overflowed: pop the next sample for any DMA channel using it. */
  onTimerOverflow(timerIndex: number): void {
    if (this.aTimer === timerIndex) {
      if (this.aCount > 0) { this.curA = this.fifoA[this.aHead]!; this.aHead = (this.aHead + 1) & 31; this.aCount -= 1; }
      if (this.aCount <= 16) this.dmaReqA = true;
    }
    if (this.bTimer === timerIndex) {
      if (this.bCount > 0) { this.curB = this.fifoB[this.bHead]!; this.bHead = (this.bHead + 1) & 31; this.bCount -= 1; }
      if (this.bCount <= 16) this.dmaReqB = true;
    }
  }

  /** Advance the host-rate resampler, emitting stereo samples into the ring. */
  step(cycles: number): void {
    this.sampleClock += cycles;
    while (this.sampleClock >= this.cyclesPerSample) {
      this.sampleClock -= this.cyclesPerSample;
      this.emit();
    }
  }

  private emit(): void {
    if (this.outCount + 2 > this.out.length) return;
    let left = 0, right = 0;
    if (this.masterOn) {
      // DMA A/B are signed 8-bit; full volume maps roughly to ±127 → scale up.
      const a = this.curA * (this.aVolHalf ? 1 : 2);
      const b = this.curB * (this.bVolHalf ? 1 : 2);
      if (this.aLeft) left += a; if (this.aRight) right += a;
      if (this.bLeft) left += b; if (this.bRight) right += b;
    }
    // ±255 per side max → scale to ~0.7 of int16.
    let l = (left * 90) | 0, r = (right * 90) | 0;
    if (l > 32767) l = 32767; else if (l < -32768) l = -32768;
    if (r > 32767) r = 32767; else if (r < -32768) r = -32768;
    const w = this.outWrite;
    this.out[w] = l; this.out[w + 1] = r;
    this.outWrite = (w + 2) % this.out.length;
    this.outCount += 2;
  }

  /** Drain up to maxFrames interleaved stereo frames into a fresh Int16Array. */
  drain(maxFrames: number): Int16Array {
    const want = Math.min(maxFrames * 2, this.outCount);
    const block = new Int16Array(want);
    let read = (this.outWrite - this.outCount + this.out.length * 2) % this.out.length;
    for (let i = 0; i < want; i += 1) { block[i] = this.out[read]!; read = (read + 1) % this.out.length; }
    this.outCount -= want;
    return block;
  }

  get pending(): number {
    return this.outCount >> 1;
  }
}
