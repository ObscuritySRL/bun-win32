import Winmm, { CallbackFlag, MIDI_MAPPER } from '../index';

const MIDI_NO_ERROR = 0;
const MIDI_STATUS_NOTE_OFF = 0x80;
const MIDI_STATUS_NOTE_ON = 0x90;
const MIDI_STATUS_PROGRAM_CHANGE = 0xc0;
const MIDI_MELODY_CHANNEL = 0;
const MIDI_PERCUSSION_CHANNEL = 9;
const MIDI_LEAD_INSTRUMENT = 81;
const MIDI_NOTE_ON_VELOCITY = 104;
const MIDI_NOTE_OFF_VELOCITY = 0;
const MIDI_PERCUSSION_NOTE = 42;
const MIDI_PERCUSSION_VELOCITY = 76;

type SequenceNoteEvent = {
  durationMilliseconds: number;
  noteNumber: number;
};

const melodySequence: SequenceNoteEvent[] = [
  { durationMilliseconds: 170, noteNumber: 60 },
  { durationMilliseconds: 170, noteNumber: 64 },
  { durationMilliseconds: 220, noteNumber: 67 },
  { durationMilliseconds: 170, noteNumber: 72 },
  { durationMilliseconds: 170, noteNumber: 67 },
  { durationMilliseconds: 220, noteNumber: 64 },
  { durationMilliseconds: 170, noteNumber: 62 },
  { durationMilliseconds: 170, noteNumber: 65 },
  { durationMilliseconds: 220, noteNumber: 69 },
  { durationMilliseconds: 170, noteNumber: 74 },
  { durationMilliseconds: 170, noteNumber: 69 },
  { durationMilliseconds: 220, noteNumber: 65 },
  { durationMilliseconds: 170, noteNumber: 64 },
  { durationMilliseconds: 170, noteNumber: 67 },
  { durationMilliseconds: 220, noteNumber: 71 },
  { durationMilliseconds: 340, noteNumber: 76 },
];

function createShortMessage(statusByte: number, firstDataByte: number, secondDataByte: number): number {
  return (statusByte & 0xff) | ((firstDataByte & 0xff) << 8) | ((secondDataByte & 0xff) << 16);
}

function createProgramChangeMessage(channelNumber: number, programNumber: number): number {
  const statusByte = (MIDI_STATUS_PROGRAM_CHANGE | channelNumber) & 0xff;

  return statusByte | ((programNumber & 0x7f) << 8);
}

function createNoteOnMessage(channelNumber: number, noteNumber: number, velocity: number): number {
  const statusByte = (MIDI_STATUS_NOTE_ON | channelNumber) & 0xff;

  return createShortMessage(statusByte, noteNumber & 0x7f, velocity & 0x7f);
}

function createNoteOffMessage(channelNumber: number, noteNumber: number): number {
  const statusByte = (MIDI_STATUS_NOTE_OFF | channelNumber) & 0xff;

  return createShortMessage(statusByte, noteNumber & 0x7f, MIDI_NOTE_OFF_VELOCITY);
}

function getMidiOutputErrorMessage(midiStatus: number): string {
  const errorMessageBuffer = Buffer.alloc(512);
  const errorMessageLengthCharacters = errorMessageBuffer.byteLength / 2;
  const errorMessageStatus = Winmm.midiOutGetErrorTextW(midiStatus, errorMessageBuffer.ptr, errorMessageLengthCharacters);

  if (errorMessageStatus !== MIDI_NO_ERROR) {
    return `status ${midiStatus}`;
  }

  return errorMessageBuffer.toString('utf16le').replace(/\0.*$/, '');
}

function assertMidiStatusIsSuccess(midiStatus: number, operationName: string): void {
  if (midiStatus === MIDI_NO_ERROR) {
    return;
  }

  throw new Error(`${operationName} failed: ${getMidiOutputErrorMessage(midiStatus)} (${midiStatus})`);
}

async function playSequence(midiOutputHandle: bigint): Promise<void> {
  const selectProgramStatus = Winmm.midiOutShortMsg(
    midiOutputHandle,
    createProgramChangeMessage(MIDI_MELODY_CHANNEL, MIDI_LEAD_INSTRUMENT),
  );

  assertMidiStatusIsSuccess(selectProgramStatus, 'midiOutShortMsg(program change)');

  for (let eventIndex = 0; eventIndex < melodySequence.length; eventIndex++) {
    const sequenceEvent = melodySequence[eventIndex];

    const noteOnStatus = Winmm.midiOutShortMsg(
      midiOutputHandle,
      createNoteOnMessage(MIDI_MELODY_CHANNEL, sequenceEvent.noteNumber, MIDI_NOTE_ON_VELOCITY),
    );

    assertMidiStatusIsSuccess(noteOnStatus, `midiOutShortMsg(note on #${eventIndex + 1})`);

    if (eventIndex % 2 === 0) {
      const percussionNoteOnStatus = Winmm.midiOutShortMsg(
        midiOutputHandle,
        createNoteOnMessage(MIDI_PERCUSSION_CHANNEL, MIDI_PERCUSSION_NOTE, MIDI_PERCUSSION_VELOCITY),
      );

      assertMidiStatusIsSuccess(percussionNoteOnStatus, `midiOutShortMsg(percussion on #${eventIndex + 1})`);
    }

    await Bun.sleep(sequenceEvent.durationMilliseconds);

    const noteOffStatus = Winmm.midiOutShortMsg(
      midiOutputHandle,
      createNoteOffMessage(MIDI_MELODY_CHANNEL, sequenceEvent.noteNumber),
    );

    assertMidiStatusIsSuccess(noteOffStatus, `midiOutShortMsg(note off #${eventIndex + 1})`);

    const percussionNoteOffStatus = Winmm.midiOutShortMsg(
      midiOutputHandle,
      createNoteOffMessage(MIDI_PERCUSSION_CHANNEL, MIDI_PERCUSSION_NOTE),
    );

    assertMidiStatusIsSuccess(percussionNoteOffStatus, `midiOutShortMsg(percussion off #${eventIndex + 1})`);

    await Bun.sleep(45);
  }
}

async function main(): Promise<void> {
  const midiOutputHandleBuffer = Buffer.alloc(8);
  let midiOutputHandle = 0n;

  try {
    const openStatus = Winmm.midiOutOpen(
      midiOutputHandleBuffer.ptr,
      MIDI_MAPPER,
      0n,
      0n,
      CallbackFlag.CALLBACK_NULL,
    );

    assertMidiStatusIsSuccess(openStatus, 'midiOutOpen');

    midiOutputHandle = midiOutputHandleBuffer.readBigUInt64LE(0);

    console.log('Playing WinMM MIDI sequence...');

    await playSequence(midiOutputHandle);

    console.log('Sequence complete.');
  } finally {
    if (midiOutputHandle !== 0n) {
      void Winmm.midiOutReset(midiOutputHandle);
      void Winmm.midiOutClose(midiOutputHandle);
    }
  }
}

await main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
