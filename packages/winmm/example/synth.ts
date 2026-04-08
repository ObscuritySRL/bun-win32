/**
 * In-Memory PCM Synthesizer via waveOut
 *
 * Generates a 4-second stereo audio buffer from scratch using three sine-wave
 * oscillators (lead melody, harmony, and bass) and plays it through the Windows
 * waveOut API -- no audio files needed.
 *
 * How PCM audio works:
 *   PCM (Pulse Code Modulation) represents sound as a sequence of amplitude
 *   samples captured at a fixed rate. Each sample is a signed 16-bit integer
 *   (-32767 to +32767) that describes the speaker cone position at that instant.
 *   At 44,100 samples/second (CD quality) with 2 channels (stereo), we produce
 *   176,400 bytes per second of audio data.
 *
 * How waveOut works:
 *   1. Fill a WAVEFORMATEX struct describing the PCM layout (channels, sample
 *      rate, bit depth).
 *   2. Open a device with waveOutOpen, passing the format.
 *   3. Prepare a WAVEHDR that points to the PCM sample buffer.
 *   4. Submit the header with waveOutWrite -- the driver begins playback.
 *   5. Poll the WAVEHDR flags (WHDR_DONE bit) to detect completion.
 *   6. Unprepare the header, reset and close the device.
 *
 * Oscillators & envelope:
 *   Each oscillator produces sin(2 * PI * frequency * time). The lead steps
 *   through a C-major arpeggio, the harmony tracks at a 3:2 ratio (perfect
 *   fifth above the lead), and the bass follows at one octave below. A simple
 *   attack/release envelope prevents clicks at start and end.
 *
 * APIs demonstrated:
 *   waveOutOpen, waveOutPrepareHeader, waveOutWrite, waveOutUnprepareHeader,
 *   waveOutReset, waveOutClose, waveOutGetErrorTextW
 *
 * Run with: bun run example/synth.ts
 */

import Winmm, { CallbackFlag, WAVE_MAPPER } from '../index';

// Audio format: stereo, 16-bit signed PCM, 44.1 kHz
const AUDIO_CHANNEL_COUNT = 2;
const AUDIO_BITS_PER_SAMPLE = 16;
const AUDIO_BYTES_PER_SAMPLE = AUDIO_BITS_PER_SAMPLE / 8; // 2 bytes per sample
const AUDIO_BLOCK_ALIGN_BYTES = AUDIO_CHANNEL_COUNT * AUDIO_BYTES_PER_SAMPLE; // 4 bytes per stereo frame
const AUDIO_SAMPLE_RATE_HERTZ = 44_100;
const AUDIO_AVERAGE_BYTES_PER_SECOND = AUDIO_SAMPLE_RATE_HERTZ * AUDIO_BLOCK_ALIGN_BYTES; // 176,400 B/s
const SYNTH_DURATION_SECONDS = 4;
const SYNTH_MASTER_GAIN = 0.34; // overall volume scalar to prevent clipping

// WAVEFORMATEX struct: 18 bytes
// Offset  Field                 Size   Description
// 0       wFormatTag            2      Audio format (1 = PCM)
// 2       nChannels             2      Number of channels
// 4       nSamplesPerSec        4      Sample rate in Hz
// 8       nAvgBytesPerSec       4      Byte throughput (rate * block align)
// 12      nBlockAlign           2      Bytes per complete sample frame
// 14      wBitsPerSample        2      Bits per individual sample
// 16      cbSize                2      Extra format bytes (0 for PCM)
const WAVE_FORMAT_EX_SIZE_BYTES = 18;
const WAVE_FORMAT_PCM = 0x0001;

// WAVEHDR struct: 48 bytes (64-bit layout)
// Offset  Field                 Size   Description
// 0       lpData                8      Pointer to the PCM sample buffer
// 8       dwBufferLength        4      Buffer size in bytes
// 12      dwBytesRecorded       4      Bytes recorded (input only)
// 16      dwUser                8      User-defined data
// 24      dwFlags               4      Status flags (WHDR_DONE = 0x1)
// 28      dwLoops               4      Loop count
// 32      lpNext                8      Reserved (linked list pointer)
// 40      reserved              8      Reserved
const WAVE_HEADER_SIZE_BYTES = 48;
const WAVE_HEADER_DONE_FLAG = 0x0000_0001; // WHDR_DONE: set by driver when playback completes
const WAVE_NO_ERROR = 0;

// C-major arpeggio frequencies for the lead melody (C4, D4, E4, G4, A4, C5)
const leadFrequenciesHertz = [261.63, 293.66, 329.63, 392, 440, 523.25];

// Bass frequencies one octave below the lead (C3, D3, E3, G3, A3, C4)
const bassFrequenciesHertz = [65.41, 73.42, 82.41, 98, 110, 130.81];

/**
 * Clamp a floating-point sample in [-1, 1] to a signed 16-bit PCM integer.
 * Values outside [-1, 1] are hard-clipped to prevent overflow distortion.
 */
function clampToPcm16(sampleValue: number): number {
  const clampedSampleValue = Math.max(-1, Math.min(1, sampleValue));

  return Math.round(clampedSampleValue * 32_767);
}

/**
 * Retrieve a human-readable error message for a waveOut status code.
 * Uses waveOutGetErrorTextW which writes a UTF-16LE string into a buffer.
 */
function getWaveOutputErrorMessage(waveStatus: number): string {
  const errorMessageBuffer = Buffer.alloc(512);
  const errorMessageLengthCharacters = errorMessageBuffer.byteLength / 2;
  const errorMessageStatus = Winmm.waveOutGetErrorTextW(waveStatus, errorMessageBuffer.ptr, errorMessageLengthCharacters);

  if (errorMessageStatus !== WAVE_NO_ERROR) {
    return `status ${waveStatus}`;
  }

  return errorMessageBuffer.toString('utf16le').replace(/\0.*$/, '');
}

/** Throw an Error with a descriptive message if the waveOut call failed. */
function assertWaveStatusIsSuccess(waveStatus: number, operationName: string): void {
  if (waveStatus === WAVE_NO_ERROR) {
    return;
  }

  throw new Error(`${operationName} failed: ${getWaveOutputErrorMessage(waveStatus)} (${waveStatus})`);
}

/** Build the 18-byte WAVEFORMATEX buffer describing our PCM format. */
function createWaveFormatBuffer(): Buffer {
  const waveFormatBuffer = Buffer.alloc(WAVE_FORMAT_EX_SIZE_BYTES);

  waveFormatBuffer.writeUInt16LE(WAVE_FORMAT_PCM, 0); // wFormatTag
  waveFormatBuffer.writeUInt16LE(AUDIO_CHANNEL_COUNT, 2); // nChannels
  waveFormatBuffer.writeUInt32LE(AUDIO_SAMPLE_RATE_HERTZ, 4); // nSamplesPerSec
  waveFormatBuffer.writeUInt32LE(AUDIO_AVERAGE_BYTES_PER_SECOND, 8); // nAvgBytesPerSec
  waveFormatBuffer.writeUInt16LE(AUDIO_BLOCK_ALIGN_BYTES, 12); // nBlockAlign
  waveFormatBuffer.writeUInt16LE(AUDIO_BITS_PER_SAMPLE, 14); // wBitsPerSample
  waveFormatBuffer.writeUInt16LE(0, 16); // cbSize (no extra data for PCM)

  return waveFormatBuffer;
}

/**
 * Generate the stereo PCM sample buffer containing the full synthesized audio.
 *
 * Three oscillators are mixed together per sample frame:
 *   - Lead: sine wave stepping through the C-major arpeggio every 250 ms
 *   - Harmony: sine wave at 1.5x the lead frequency (perfect fifth interval)
 *   - Bass: sine wave stepping through bass notes every 500 ms
 *
 * A simple attack/release envelope ramps up over 30 ms at the start and fades
 * out over 250 ms at the end to avoid audible clicks. Stereo panning offsets
 * the left/right mix slightly for spatial width.
 */
function createSynthPcmBuffer(): Buffer {
  const sampleFrameCount = Math.floor(AUDIO_SAMPLE_RATE_HERTZ * SYNTH_DURATION_SECONDS);
  const pcmSampleBuffer = Buffer.alloc(sampleFrameCount * AUDIO_BLOCK_ALIGN_BYTES);
  const melodyStepDurationSeconds = 0.25; // lead changes note every 250 ms
  const bassStepDurationSeconds = 0.5; // bass changes note every 500 ms

  for (let sampleFrameIndex = 0; sampleFrameIndex < sampleFrameCount; sampleFrameIndex++) {
    // Convert the sample index to a time position in seconds
    const sampleTimeSeconds = sampleFrameIndex / AUDIO_SAMPLE_RATE_HERTZ;

    // Determine which note in the arpeggio is active at this time
    const melodyIndex = Math.floor(sampleTimeSeconds / melodyStepDurationSeconds) % leadFrequenciesHertz.length;
    const bassIndex = Math.floor(sampleTimeSeconds / bassStepDurationSeconds) % bassFrequenciesHertz.length;
    const leadFrequencyHertz = leadFrequenciesHertz[melodyIndex];
    const bassFrequencyHertz = bassFrequenciesHertz[bassIndex];

    // Generate sine-wave oscillator samples using the formula: sin(2 * PI * freq * t)
    // This produces a value in [-1, 1] representing one cycle of a pure tone.
    const leadOscillatorSample = Math.sin(2 * Math.PI * leadFrequencyHertz * sampleTimeSeconds);
    const harmonyOscillatorSample = Math.sin(2 * Math.PI * leadFrequencyHertz * 1.5 * sampleTimeSeconds); // perfect fifth above lead
    const bassOscillatorSample = Math.sin(2 * Math.PI * bassFrequencyHertz * sampleTimeSeconds);

    // Simple attack/release (AR) envelope to prevent start/end clicks:
    //   Attack: linear ramp from 0 to 1 over the first 30 ms
    //   Release: linear ramp from 1 to 0 over the final 250 ms
    //   The envelope value is the minimum of the two, so both are applied.
    const attackEnvelope = Math.min(1, sampleTimeSeconds / 0.03);
    const releaseEnvelope = Math.min(1, (SYNTH_DURATION_SECONDS - sampleTimeSeconds) / 0.25);
    const amplitudeEnvelope = Math.min(attackEnvelope, releaseEnvelope);

    // Stereo mix: slightly different oscillator weights per channel for spatial width.
    // Left channel emphasizes the lead; right channel emphasizes the harmony.
    // Bass is centered (equal weight in both channels).
    const leftChannelSample = (leadOscillatorSample * 0.56 + harmonyOscillatorSample * 0.16 + bassOscillatorSample * 0.34) * amplitudeEnvelope * SYNTH_MASTER_GAIN;
    const rightChannelSample = (leadOscillatorSample * 0.48 + harmonyOscillatorSample * 0.24 + bassOscillatorSample * 0.34) * amplitudeEnvelope * SYNTH_MASTER_GAIN;

    // Write interleaved stereo samples: [LEFT_16][RIGHT_16] per frame
    const leftChannelOffset = sampleFrameIndex * AUDIO_BLOCK_ALIGN_BYTES;
    const rightChannelOffset = leftChannelOffset + AUDIO_BYTES_PER_SAMPLE;

    pcmSampleBuffer.writeInt16LE(clampToPcm16(leftChannelSample), leftChannelOffset);
    pcmSampleBuffer.writeInt16LE(clampToPcm16(rightChannelSample), rightChannelOffset);
  }

  return pcmSampleBuffer;
}

/**
 * Build the 48-byte WAVEHDR struct that tells waveOutWrite where the PCM data
 * lives and how large it is. The driver uses this to stream samples to hardware.
 */
function createWaveHeaderBuffer(pcmSampleBuffer: Buffer): Buffer {
  const waveHeaderBuffer = Buffer.alloc(WAVE_HEADER_SIZE_BYTES);

  waveHeaderBuffer.writeBigUInt64LE(BigInt(pcmSampleBuffer.ptr), 0); // lpData: pointer to PCM buffer
  waveHeaderBuffer.writeUInt32LE(pcmSampleBuffer.byteLength, 8); // dwBufferLength
  waveHeaderBuffer.writeUInt32LE(0, 12); // dwBytesRecorded (unused for output)
  waveHeaderBuffer.writeBigUInt64LE(0n, 16); // dwUser
  waveHeaderBuffer.writeUInt32LE(0, 24); // dwFlags (driver sets WHDR_DONE when finished)
  waveHeaderBuffer.writeUInt32LE(0, 28); // dwLoops
  waveHeaderBuffer.writeBigUInt64LE(0n, 32); // lpNext (reserved)
  waveHeaderBuffer.writeBigUInt64LE(0n, 40); // reserved

  return waveHeaderBuffer;
}

/**
 * Open the default waveOut device, submit the PCM buffer for playback, and wait
 * for completion. Handles the full lifecycle: open -> prepare -> write -> poll ->
 * unprepare -> close with robust cleanup in a finally block.
 */
async function playSynthBuffer(pcmSampleBuffer: Buffer): Promise<void> {
  const waveOutputHandleBuffer = Buffer.alloc(8); // receives the HWAVEOUT handle
  const waveFormatBuffer = createWaveFormatBuffer();
  const waveHeaderBuffer = createWaveHeaderBuffer(pcmSampleBuffer);
  let waveOutputHandle = 0n;
  let waveHeaderWasPrepared = false;

  try {
    // Open the default wave output device (WAVE_MAPPER selects the system default)
    const openStatus = Winmm.waveOutOpen(waveOutputHandleBuffer.ptr, WAVE_MAPPER, waveFormatBuffer.ptr, 0n, 0n, CallbackFlag.CALLBACK_NULL);

    assertWaveStatusIsSuccess(openStatus, 'waveOutOpen');

    waveOutputHandle = waveOutputHandleBuffer.readBigUInt64LE(0);

    // Prepare the header: the driver locks the buffer and sets up DMA if needed
    const prepareHeaderStatus = Winmm.waveOutPrepareHeader(waveOutputHandle, waveHeaderBuffer.ptr, waveHeaderBuffer.byteLength);

    assertWaveStatusIsSuccess(prepareHeaderStatus, 'waveOutPrepareHeader');

    waveHeaderWasPrepared = true;

    // Submit the buffer for playback -- the driver begins streaming immediately
    const writeStatus = Winmm.waveOutWrite(waveOutputHandle, waveHeaderBuffer.ptr, waveHeaderBuffer.byteLength);

    assertWaveStatusIsSuccess(writeStatus, 'waveOutWrite');

    // Poll the WAVEHDR dwFlags field at offset 24 for the WHDR_DONE bit.
    // The driver sets this flag when all samples have been sent to the DAC.
    const playbackDeadlineTimestamp = Date.now() + SYNTH_DURATION_SECONDS * 1_000 + 3_000;

    while ((waveHeaderBuffer.readUInt32LE(24) & WAVE_HEADER_DONE_FLAG) === 0) {
      if (Date.now() > playbackDeadlineTimestamp) {
        throw new Error('waveOutWrite timed out before playback completed.');
      }

      await Bun.sleep(10);
    }
  } finally {
    if (waveOutputHandle !== 0n) {
      // Reset stops playback and returns all queued buffers to the prepared state
      void Winmm.waveOutReset(waveOutputHandle);

      if (waveHeaderWasPrepared) {
        // Unprepare can fail with WAVERR_STILLPLAYING if the driver hasn't
        // fully stopped yet, so retry in a short polling loop.
        for (let unprepareAttempt = 0; unprepareAttempt < 200; unprepareAttempt++) {
          const unprepareStatus = Winmm.waveOutUnprepareHeader(waveOutputHandle, waveHeaderBuffer.ptr, waveHeaderBuffer.byteLength);

          if (unprepareStatus === WAVE_NO_ERROR) {
            break;
          }

          await Bun.sleep(10);
        }
      }

      void Winmm.waveOutClose(waveOutputHandle);
    }
  }
}

async function main(): Promise<void> {
  console.log('Generating in-memory PCM synth buffer...');

  const pcmSampleBuffer = createSynthPcmBuffer();

  console.log(`Playing ${SYNTH_DURATION_SECONDS}s stereo buffer via waveOut...`);

  await playSynthBuffer(pcmSampleBuffer);

  console.log('Playback complete.');
}

await main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
