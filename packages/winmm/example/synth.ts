import Winmm, { CallbackFlag, WAVE_MAPPER } from '../index';

const AUDIO_CHANNEL_COUNT = 2;
const AUDIO_BITS_PER_SAMPLE = 16;
const AUDIO_BYTES_PER_SAMPLE = AUDIO_BITS_PER_SAMPLE / 8;
const AUDIO_BLOCK_ALIGN_BYTES = AUDIO_CHANNEL_COUNT * AUDIO_BYTES_PER_SAMPLE;
const AUDIO_SAMPLE_RATE_HERTZ = 44_100;
const AUDIO_AVERAGE_BYTES_PER_SECOND = AUDIO_SAMPLE_RATE_HERTZ * AUDIO_BLOCK_ALIGN_BYTES;
const SYNTH_DURATION_SECONDS = 4;
const SYNTH_MASTER_GAIN = 0.34;
const WAVE_FORMAT_EX_SIZE_BYTES = 18;
const WAVE_FORMAT_PCM = 0x0001;
const WAVE_HEADER_SIZE_BYTES = 48;
const WAVE_HEADER_DONE_FLAG = 0x0000_0001;
const WAVE_NO_ERROR = 0;

const leadFrequenciesHertz = [261.63, 293.66, 329.63, 392, 440, 523.25];
const bassFrequenciesHertz = [65.41, 73.42, 82.41, 98, 110, 130.81];

function clampToPcm16(sampleValue: number): number {
  const clampedSampleValue = Math.max(-1, Math.min(1, sampleValue));

  return Math.round(clampedSampleValue * 32_767);
}

function getWaveOutputErrorMessage(waveStatus: number): string {
  const errorMessageBuffer = Buffer.alloc(512);
  const errorMessageLengthCharacters = errorMessageBuffer.byteLength / 2;
  const errorMessageStatus = Winmm.waveOutGetErrorTextW(waveStatus, errorMessageBuffer.ptr, errorMessageLengthCharacters);

  if (errorMessageStatus !== WAVE_NO_ERROR) {
    return `status ${waveStatus}`;
  }

  return errorMessageBuffer.toString('utf16le').replace(/\0.*$/, '');
}

function assertWaveStatusIsSuccess(waveStatus: number, operationName: string): void {
  if (waveStatus === WAVE_NO_ERROR) {
    return;
  }

  throw new Error(`${operationName} failed: ${getWaveOutputErrorMessage(waveStatus)} (${waveStatus})`);
}

function createWaveFormatBuffer(): Buffer {
  const waveFormatBuffer = Buffer.alloc(WAVE_FORMAT_EX_SIZE_BYTES);

  waveFormatBuffer.writeUInt16LE(WAVE_FORMAT_PCM, 0);
  waveFormatBuffer.writeUInt16LE(AUDIO_CHANNEL_COUNT, 2);
  waveFormatBuffer.writeUInt32LE(AUDIO_SAMPLE_RATE_HERTZ, 4);
  waveFormatBuffer.writeUInt32LE(AUDIO_AVERAGE_BYTES_PER_SECOND, 8);
  waveFormatBuffer.writeUInt16LE(AUDIO_BLOCK_ALIGN_BYTES, 12);
  waveFormatBuffer.writeUInt16LE(AUDIO_BITS_PER_SAMPLE, 14);
  waveFormatBuffer.writeUInt16LE(0, 16);

  return waveFormatBuffer;
}

function createSynthPcmBuffer(): Buffer {
  const sampleFrameCount = Math.floor(AUDIO_SAMPLE_RATE_HERTZ * SYNTH_DURATION_SECONDS);
  const pcmSampleBuffer = Buffer.alloc(sampleFrameCount * AUDIO_BLOCK_ALIGN_BYTES);
  const melodyStepDurationSeconds = 0.25;
  const bassStepDurationSeconds = 0.5;

  for (let sampleFrameIndex = 0; sampleFrameIndex < sampleFrameCount; sampleFrameIndex++) {
    const sampleTimeSeconds = sampleFrameIndex / AUDIO_SAMPLE_RATE_HERTZ;
    const melodyIndex = Math.floor(sampleTimeSeconds / melodyStepDurationSeconds) % leadFrequenciesHertz.length;
    const bassIndex = Math.floor(sampleTimeSeconds / bassStepDurationSeconds) % bassFrequenciesHertz.length;
    const leadFrequencyHertz = leadFrequenciesHertz[melodyIndex];
    const bassFrequencyHertz = bassFrequenciesHertz[bassIndex];

    const leadOscillatorSample = Math.sin(2 * Math.PI * leadFrequencyHertz * sampleTimeSeconds);
    const harmonyOscillatorSample = Math.sin(2 * Math.PI * leadFrequencyHertz * 1.5 * sampleTimeSeconds);
    const bassOscillatorSample = Math.sin(2 * Math.PI * bassFrequencyHertz * sampleTimeSeconds);

    const attackEnvelope = Math.min(1, sampleTimeSeconds / 0.03);
    const releaseEnvelope = Math.min(1, (SYNTH_DURATION_SECONDS - sampleTimeSeconds) / 0.25);
    const amplitudeEnvelope = Math.min(attackEnvelope, releaseEnvelope);

    const leftChannelSample =
      (leadOscillatorSample * 0.56 + harmonyOscillatorSample * 0.16 + bassOscillatorSample * 0.34) * amplitudeEnvelope * SYNTH_MASTER_GAIN;
    const rightChannelSample =
      (leadOscillatorSample * 0.48 + harmonyOscillatorSample * 0.24 + bassOscillatorSample * 0.34) * amplitudeEnvelope * SYNTH_MASTER_GAIN;

    const leftChannelOffset = sampleFrameIndex * AUDIO_BLOCK_ALIGN_BYTES;
    const rightChannelOffset = leftChannelOffset + AUDIO_BYTES_PER_SAMPLE;

    pcmSampleBuffer.writeInt16LE(clampToPcm16(leftChannelSample), leftChannelOffset);
    pcmSampleBuffer.writeInt16LE(clampToPcm16(rightChannelSample), rightChannelOffset);
  }

  return pcmSampleBuffer;
}

function createWaveHeaderBuffer(pcmSampleBuffer: Buffer): Buffer {
  const waveHeaderBuffer = Buffer.alloc(WAVE_HEADER_SIZE_BYTES);

  waveHeaderBuffer.writeBigUInt64LE(BigInt(pcmSampleBuffer.ptr), 0);
  waveHeaderBuffer.writeUInt32LE(pcmSampleBuffer.byteLength, 8);
  waveHeaderBuffer.writeUInt32LE(0, 12);
  waveHeaderBuffer.writeBigUInt64LE(0n, 16);
  waveHeaderBuffer.writeUInt32LE(0, 24);
  waveHeaderBuffer.writeUInt32LE(0, 28);
  waveHeaderBuffer.writeBigUInt64LE(0n, 32);
  waveHeaderBuffer.writeBigUInt64LE(0n, 40);

  return waveHeaderBuffer;
}

async function playSynthBuffer(pcmSampleBuffer: Buffer): Promise<void> {
  const waveOutputHandleBuffer = Buffer.alloc(8);
  const waveFormatBuffer = createWaveFormatBuffer();
  const waveHeaderBuffer = createWaveHeaderBuffer(pcmSampleBuffer);
  let waveOutputHandle = 0n;
  let waveHeaderWasPrepared = false;

  try {
    const openStatus = Winmm.waveOutOpen(
      waveOutputHandleBuffer.ptr,
      WAVE_MAPPER,
      waveFormatBuffer.ptr,
      0n,
      0n,
      CallbackFlag.CALLBACK_NULL,
    );

    assertWaveStatusIsSuccess(openStatus, 'waveOutOpen');

    waveOutputHandle = waveOutputHandleBuffer.readBigUInt64LE(0);

    const prepareHeaderStatus = Winmm.waveOutPrepareHeader(waveOutputHandle, waveHeaderBuffer.ptr, waveHeaderBuffer.byteLength);

    assertWaveStatusIsSuccess(prepareHeaderStatus, 'waveOutPrepareHeader');

    waveHeaderWasPrepared = true;

    const writeStatus = Winmm.waveOutWrite(waveOutputHandle, waveHeaderBuffer.ptr, waveHeaderBuffer.byteLength);

    assertWaveStatusIsSuccess(writeStatus, 'waveOutWrite');

    const playbackDeadlineTimestamp = Date.now() + SYNTH_DURATION_SECONDS * 1_000 + 3_000;

    while ((waveHeaderBuffer.readUInt32LE(24) & WAVE_HEADER_DONE_FLAG) === 0) {
      if (Date.now() > playbackDeadlineTimestamp) {
        throw new Error('waveOutWrite timed out before playback completed.');
      }

      await Bun.sleep(10);
    }
  } finally {
    if (waveOutputHandle !== 0n) {
      void Winmm.waveOutReset(waveOutputHandle);

      if (waveHeaderWasPrepared) {
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
