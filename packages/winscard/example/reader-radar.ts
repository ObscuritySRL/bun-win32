/**
 * Reader Radar
 *
 * A live ANSI dashboard that watches every installed smart card reader,
 * repaints a pulsing signal meter for each one, and highlights card-insert,
 * card-removed, and state-change events as they happen in real time.
 *
 * APIs demonstrated:
 *   - SCardEstablishContext    (open a smart-card resource manager context)
 *   - SCardListReadersW        (enumerate installed readers)
 *   - SCardGetStatusChangeW    (poll reader and card state transitions)
 *   - SCardReleaseContext      (close the resource manager context)
 *
 * Run: bun run example/reader-radar.ts
 */

import WinSCard, { SCARD_E_INSUFFICIENT_BUFFER, SCARD_E_NO_READERS_AVAILABLE, SCARD_SCOPE, SCARD_S_SUCCESS, SCARD_STATE, type SCARDCONTEXT } from '../index';

const ATR_BYTES_OFFSET = 28;
const ATR_LENGTH_OFFSET = 24;
const CLEAR = '\x1b[2J';
const CURRENT_STATE_OFFSET = 16;
const EVENT_STATE_OFFSET = 20;
const FRAMES = 20;
const GREEN = '\x1b[92m';
const HIDE_CURSOR = '\x1b[?25l';
const READER_STATE_RECORD_SIZE = 64;
const RESET = '\x1b[0m';
const SCARD_E_NO_SERVICE = 0x8010_001d | 0;
const SCARD_E_SERVICE_STOPPED = 0x8010_001e | 0;
const SHOW_CURSOR = '\x1b[?25h';
const WIDE_CHARACTER_SIZE = 2;
const YELLOW = '\x1b[93m';

WinSCard.Preload(['SCardEstablishContext', 'SCardGetStatusChangeW', 'SCardListReadersW', 'SCardReleaseContext']);

function decodeFlags(stateValue: number): string {
  const labels: string[] = [];

  if (stateValue & SCARD_STATE.SCARD_STATE_CHANGED) labels.push('CHANGED');
  if (stateValue & SCARD_STATE.SCARD_STATE_EMPTY) labels.push('EMPTY');
  if (stateValue & SCARD_STATE.SCARD_STATE_EXCLUSIVE) labels.push('EXCLUSIVE');
  if (stateValue & SCARD_STATE.SCARD_STATE_INUSE) labels.push('INUSE');
  if (stateValue & SCARD_STATE.SCARD_STATE_MUTE) labels.push('MUTE');
  if (stateValue & SCARD_STATE.SCARD_STATE_PRESENT) labels.push('PRESENT');
  if (stateValue & SCARD_STATE.SCARD_STATE_UNAVAILABLE) labels.push('UNAVAILABLE');
  if (stateValue & SCARD_STATE.SCARD_STATE_UNKNOWN) labels.push('UNKNOWN');
  if (stateValue & SCARD_STATE.SCARD_STATE_UNPOWERED) labels.push('UNPOWERED');

  return labels.length === 0 ? 'IDLE' : labels.join(', ');
}

function formatAtr(readerStateBuffer: Buffer, recordOffset: number): string {
  const atrLength = Math.min(readerStateBuffer.readUInt32LE(recordOffset + ATR_LENGTH_OFFSET), 36);
  if (atrLength === 0) {
    return '(none)';
  }

  return Array.from(readerStateBuffer.subarray(recordOffset + ATR_BYTES_OFFSET, recordOffset + ATR_BYTES_OFFSET + atrLength), (value) => value.toString(16).padStart(2, '0')).join(' ');
}

function listReaders(contextHandle: SCARDCONTEXT): string[] {
  const lengthBuffer = Buffer.alloc(4);
  const firstStatus = WinSCard.SCardListReadersW(contextHandle, null, null, lengthBuffer.ptr);

  if (firstStatus === SCARD_E_NO_READERS_AVAILABLE) {
    return [];
  }

  if (firstStatus !== SCARD_S_SUCCESS && firstStatus !== SCARD_E_INSUFFICIENT_BUFFER) {
    throw new Error(`SCardListReadersW failed: 0x${(firstStatus >>> 0).toString(16)}`);
  }

  const requiredCharacters = lengthBuffer.readUInt32LE(0);
  if (requiredCharacters === 0) {
    return [];
  }

  const buffer = Buffer.alloc(requiredCharacters * WIDE_CHARACTER_SIZE);
  const secondStatus = WinSCard.SCardListReadersW(contextHandle, null, buffer.ptr, lengthBuffer.ptr);
  if (secondStatus !== SCARD_S_SUCCESS) {
    throw new Error(`SCardListReadersW failed: 0x${(secondStatus >>> 0).toString(16)}`);
  }

  return buffer
    .toString('utf16le')
    .split('\0')
    .filter((value) => value.length > 0);
}

function signalBar(stateValue: number, frame: number): string {
  const isPresent = (stateValue & SCARD_STATE.SCARD_STATE_PRESENT) !== 0;
  const isChanged = (stateValue & SCARD_STATE.SCARD_STATE_CHANGED) !== 0;
  const pulseWidth = 4 + (frame % 8);
  const filled = isPresent ? 10 : isChanged ? pulseWidth : 2;
  const empty = 12 - Math.min(12, filled);
  return `${GREEN}${'='.repeat(Math.min(12, filled))}${RESET}${'.'.repeat(empty)}`;
}

const contextHandleBuffer = Buffer.alloc(8);
const establishStatus = WinSCard.SCardEstablishContext(SCARD_SCOPE.SYSTEM, null, null, contextHandleBuffer.ptr);

if (establishStatus !== SCARD_S_SUCCESS) {
  if (establishStatus === SCARD_E_NO_SERVICE || establishStatus === SCARD_E_SERVICE_STOPPED) {
    console.log(`${YELLOW}The Smart Card resource manager service is not available on this machine.${RESET}`);
    process.exit(0);
  }

  console.error(`SCardEstablishContext failed: 0x${(establishStatus >>> 0).toString(16)}`);
  process.exit(1);
}

const contextHandle = contextHandleBuffer.readBigUInt64LE(0);

try {
  const readers = listReaders(contextHandle);
  if (readers.length === 0) {
    console.log(`${YELLOW}No smart card readers are currently available.${RESET}`);
    process.exit(0);
  }

  const readerNameBuffers = readers.map((readerName) => Buffer.from(`${readerName}\0`, 'utf16le'));
  const readerStateBuffer = Buffer.alloc(readers.length * READER_STATE_RECORD_SIZE);

  for (const [readerIndex, readerNameBuffer] of readerNameBuffers.entries()) {
    const recordOffset = readerIndex * READER_STATE_RECORD_SIZE;
    readerStateBuffer.writeBigUInt64LE(BigInt(readerNameBuffer.ptr!), recordOffset);
    readerStateBuffer.writeUInt32LE(SCARD_STATE.SCARD_STATE_UNAWARE, recordOffset + CURRENT_STATE_OFFSET);
  }

  process.stdout.write(HIDE_CURSOR);

  for (let frame = 0; frame < FRAMES; frame++) {
    const pollStatus = WinSCard.SCardGetStatusChangeW(contextHandle, 400, readerStateBuffer.ptr, readers.length);
    if (pollStatus !== SCARD_S_SUCCESS) {
      throw new Error(`SCardGetStatusChangeW failed: 0x${(pollStatus >>> 0).toString(16)}`);
    }

    const sweep = `${'.'.repeat(frame % 18)}*${'.'.repeat(17 - (frame % 18))}`;

    process.stdout.write(`${CLEAR}\x1b[H`);
    console.log(`${GREEN}Reader Radar${RESET}`);
    console.log(`Sweep: ${sweep}    Frame: ${frame + 1}/${FRAMES}    ${new Date().toLocaleTimeString()}`);
    console.log();

    for (const [readerIndex, readerName] of readers.entries()) {
      const recordOffset = readerIndex * READER_STATE_RECORD_SIZE;
      const eventState = readerStateBuffer.readUInt32LE(recordOffset + EVENT_STATE_OFFSET);
      const stateLine = decodeFlags(eventState);
      const atrLine = formatAtr(readerStateBuffer, recordOffset);

      console.log(`${readerName}`);
      console.log(`  ${signalBar(eventState, frame)}  ${stateLine}`);
      console.log(`  ATR: ${atrLine}`);
      console.log();

      readerStateBuffer.writeUInt32LE(eventState & ~SCARD_STATE.SCARD_STATE_CHANGED, recordOffset + CURRENT_STATE_OFFSET);
    }
  }
} finally {
  process.stdout.write(SHOW_CURSOR);

  const releaseStatus = WinSCard.SCardReleaseContext(contextHandle);
  if (releaseStatus !== SCARD_S_SUCCESS) {
    console.error(`SCardReleaseContext failed: 0x${(releaseStatus >>> 0).toString(16)}`);
    process.exitCode = 1;
  }
}
