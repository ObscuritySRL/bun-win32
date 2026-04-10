/**
 * Smart Card Diagnostic
 *
 * A detailed WinSCard inspection that establishes a resource-manager context,
 * enumerates reader groups and readers, snapshots current reader state, and
 * prints a formatted report with device identifiers, card status, attribute
 * metadata, and connection details when a card is present.
 *
 * APIs demonstrated:
 *   - SCardEstablishContext          (open a smart-card resource manager context)
 *   - SCardListReaderGroupsW         (enumerate reader groups)
 *   - SCardListReadersW              (enumerate installed readers)
 *   - SCardGetStatusChangeW          (read current reader/card state)
 *   - SCardGetDeviceTypeIdW          (resolve reader transport category)
 *   - SCardGetReaderDeviceInstanceIdW (resolve Plug and Play device instance id)
 *   - SCardGetReaderIconW            (query reader icon payload size)
 *   - SCardConnectW                  (open a shared card connection)
 *   - SCardStatusW                   (read active protocol, state, and ATR)
 *   - SCardGetAttrib                 (query reader and card attributes)
 *   - SCardGetTransmitCount          (query APDU transmission count)
 *   - SCardDisconnect                (release a card connection)
 *   - SCardReleaseContext            (close the resource manager context)
 *
 * Run: bun run example/smart-card-diagnostic.ts
 */

import WinSCard, {
  SCARD_ATTRIBUTE,
  SCARD_AUTOALLOCATE,
  SCARD_DISPOSITION,
  SCARD_E_INSUFFICIENT_BUFFER,
  SCARD_E_NO_READERS_AVAILABLE,
  SCARD_PROTOCOL,
  SCARD_READER_TYPE,
  SCARD_SCOPE,
  SCARD_SHARE_MODE,
  SCARD_S_SUCCESS,
  SCARD_STATE,
  type SCARDCONTEXT,
  type SCARDHANDLE,
} from '../index';

const ATR_BYTES_OFFSET = 28;
const ATR_LENGTH_OFFSET = 24;
const CURRENT_STATE_OFFSET = 16;
const DEVICE_TYPE_NAMES = new Map<number, string>([
  [SCARD_READER_TYPE.SCARD_READER_TYPE_EMBEDDEDSE, 'Embedded Secure Element'],
  [SCARD_READER_TYPE.SCARD_READER_TYPE_IDE, 'IDE'],
  [SCARD_READER_TYPE.SCARD_READER_TYPE_KEYBOARD, 'Keyboard'],
  [SCARD_READER_TYPE.SCARD_READER_TYPE_NFC, 'NFC'],
  [SCARD_READER_TYPE.SCARD_READER_TYPE_NGC, 'NGC'],
  [SCARD_READER_TYPE.SCARD_READER_TYPE_PARALELL, 'Parallel'],
  [SCARD_READER_TYPE.SCARD_READER_TYPE_PCMCIA, 'PCMCIA'],
  [SCARD_READER_TYPE.SCARD_READER_TYPE_SCSI, 'SCSI'],
  [SCARD_READER_TYPE.SCARD_READER_TYPE_SERIAL, 'Serial'],
  [SCARD_READER_TYPE.SCARD_READER_TYPE_TPM, 'TPM'],
  [SCARD_READER_TYPE.SCARD_READER_TYPE_UICC, 'UICC'],
  [SCARD_READER_TYPE.SCARD_READER_TYPE_USB, 'USB'],
  [SCARD_READER_TYPE.SCARD_READER_TYPE_VENDOR, 'Vendor-specific'],
]);
const EVENT_STATE_OFFSET = 20;
const GREEN = '\x1b[92m';
const HEADER = '\x1b[96m';
const MAX_ATR_BYTES = 64;
const MAX_READER_NAME_CHARACTERS = 512;
const MUTED = '\x1b[2m';
const READER_STATE_RECORD_SIZE = 64;
const RESET = '\x1b[0m';
const SCARD_E_NO_SERVICE = 0x8010_001d | 0;
const SCARD_E_SERVICE_STOPPED = 0x8010_001e | 0;
const WARNING = '\x1b[93m';
const WIDE_CHARACTER_SIZE = 2;

WinSCard.Preload([
  'SCardConnectW',
  'SCardDisconnect',
  'SCardEstablishContext',
  'SCardGetAttrib',
  'SCardGetDeviceTypeIdW',
  'SCardGetReaderDeviceInstanceIdW',
  'SCardGetReaderIconW',
  'SCardGetStatusChangeW',
  'SCardGetTransmitCount',
  'SCardListReaderGroupsW',
  'SCardListReadersW',
  'SCardReleaseContext',
  'SCardStatusW',
]);

function decodeFlags(stateValue: number): string[] {
  const labels: string[] = [];

  if (stateValue & SCARD_STATE.SCARD_STATE_ATRMATCH) labels.push('ATRMATCH');
  if (stateValue & SCARD_STATE.SCARD_STATE_CHANGED) labels.push('CHANGED');
  if (stateValue & SCARD_STATE.SCARD_STATE_EMPTY) labels.push('EMPTY');
  if (stateValue & SCARD_STATE.SCARD_STATE_EXCLUSIVE) labels.push('EXCLUSIVE');
  if (stateValue & SCARD_STATE.SCARD_STATE_IGNORE) labels.push('IGNORE');
  if (stateValue & SCARD_STATE.SCARD_STATE_INUSE) labels.push('INUSE');
  if (stateValue & SCARD_STATE.SCARD_STATE_MUTE) labels.push('MUTE');
  if (stateValue & SCARD_STATE.SCARD_STATE_PRESENT) labels.push('PRESENT');
  if (stateValue & SCARD_STATE.SCARD_STATE_UNAVAILABLE) labels.push('UNAVAILABLE');
  if (stateValue & SCARD_STATE.SCARD_STATE_UNKNOWN) labels.push('UNKNOWN');
  if (stateValue & SCARD_STATE.SCARD_STATE_UNPOWERED) labels.push('UNPOWERED');

  if (labels.length === 0 && stateValue === SCARD_STATE.SCARD_STATE_UNAWARE) {
    return ['UNAWARE'];
  }

  return labels;
}

function formatAttribute(attributeValue: Buffer): string {
  const zeroTerminatorOffset = attributeValue.indexOf(0);
  const trimmedAscii = (zeroTerminatorOffset >= 0 ? attributeValue.subarray(0, zeroTerminatorOffset) : attributeValue).toString('utf8').trim();

  if (trimmedAscii && /^[\x20-\x7e]+$/.test(trimmedAscii)) {
    return trimmedAscii;
  }

  return formatBytes(attributeValue);
}

function formatBytes(buffer: Buffer): string {
  if (buffer.length === 0) {
    return '(none)';
  }

  return Array.from(buffer, (byte) => byte.toString(16).padStart(2, '0')).join(' ');
}

function listWideMultiString(contextHandle: SCARDCONTEXT, selector: 'groups' | 'readers'): string[] {
  const lengthBuffer = Buffer.alloc(4);

  const firstStatus = selector === 'groups' ? WinSCard.SCardListReaderGroupsW(contextHandle, null, lengthBuffer.ptr) : WinSCard.SCardListReadersW(contextHandle, null, null, lengthBuffer.ptr);

  if (firstStatus === SCARD_E_NO_READERS_AVAILABLE) {
    return [];
  }

  if (firstStatus !== SCARD_S_SUCCESS && firstStatus !== SCARD_E_INSUFFICIENT_BUFFER) {
    throw new Error(`${selector === 'groups' ? 'SCardListReaderGroupsW' : 'SCardListReadersW'} failed: 0x${(firstStatus >>> 0).toString(16)}`);
  }

  const requiredCharacters = lengthBuffer.readUInt32LE(0);
  if (requiredCharacters === 0) {
    return [];
  }

  const valueBuffer = Buffer.alloc(requiredCharacters * WIDE_CHARACTER_SIZE);
  const secondStatus = selector === 'groups' ? WinSCard.SCardListReaderGroupsW(contextHandle, valueBuffer.ptr, lengthBuffer.ptr) : WinSCard.SCardListReadersW(contextHandle, null, valueBuffer.ptr, lengthBuffer.ptr);

  if (secondStatus !== SCARD_S_SUCCESS) {
    throw new Error(`${selector === 'groups' ? 'SCardListReaderGroupsW' : 'SCardListReadersW'} failed: 0x${(secondStatus >>> 0).toString(16)}`);
  }

  return valueBuffer
    .toString('utf16le')
    .split('\0')
    .filter((entry) => entry.length > 0);
}

function queryAttribute(cardHandle: SCARDHANDLE, attribute: SCARD_ATTRIBUTE): Buffer | null {
  const lengthBuffer = Buffer.alloc(4);
  let status = WinSCard.SCardGetAttrib(cardHandle, attribute, null, lengthBuffer.ptr);

  if (status !== SCARD_S_SUCCESS && status !== SCARD_E_INSUFFICIENT_BUFFER) {
    return null;
  }

  const requiredLength = lengthBuffer.readUInt32LE(0);
  if (requiredLength === 0) {
    return null;
  }

  const valueBuffer = Buffer.alloc(requiredLength);
  status = WinSCard.SCardGetAttrib(cardHandle, attribute, valueBuffer.ptr, lengthBuffer.ptr);

  if (status !== SCARD_S_SUCCESS) {
    return null;
  }

  return valueBuffer.subarray(0, lengthBuffer.readUInt32LE(0));
}

function queryReaderDeviceInstanceId(contextHandle: SCARDCONTEXT, readerNameBuffer: Buffer): string {
  const lengthBuffer = Buffer.alloc(4);
  let status = WinSCard.SCardGetReaderDeviceInstanceIdW(contextHandle, readerNameBuffer.ptr!, null, lengthBuffer.ptr);

  if (status !== SCARD_S_SUCCESS && status !== SCARD_E_INSUFFICIENT_BUFFER) {
    return '(unavailable)';
  }

  const requiredCharacters = lengthBuffer.readUInt32LE(0);
  if (requiredCharacters === 0) {
    return '(unavailable)';
  }

  const valueBuffer = Buffer.alloc(requiredCharacters * WIDE_CHARACTER_SIZE);
  status = WinSCard.SCardGetReaderDeviceInstanceIdW(contextHandle, readerNameBuffer.ptr!, valueBuffer.ptr!, lengthBuffer.ptr);

  if (status !== SCARD_S_SUCCESS) {
    return '(unavailable)';
  }

  return valueBuffer.toString('utf16le').replace(/\0.*$/, '');
}

function queryReaderIconSize(contextHandle: SCARDCONTEXT, readerNameBuffer: Buffer): string {
  const lengthBuffer = Buffer.alloc(4);
  const status = WinSCard.SCardGetReaderIconW(contextHandle, readerNameBuffer.ptr!, null, lengthBuffer.ptr);

  if (status !== SCARD_S_SUCCESS && status !== SCARD_E_INSUFFICIENT_BUFFER) {
    return '(unavailable)';
  }

  return `${lengthBuffer.readUInt32LE(0)} bytes`;
}

function row(label: string, value: string): void {
  console.log(`  ${label.padEnd(22)} ${value}`);
}

console.log(`${HEADER}Smart Card Diagnostic${RESET}`);
console.log(`${MUTED}${new Date().toISOString()}${RESET}\n`);

const contextHandleBuffer = Buffer.alloc(8);
const establishStatus = WinSCard.SCardEstablishContext(SCARD_SCOPE.SYSTEM, null, null, contextHandleBuffer.ptr);

if (establishStatus !== SCARD_S_SUCCESS) {
  if (establishStatus === SCARD_E_NO_SERVICE || establishStatus === SCARD_E_SERVICE_STOPPED) {
    console.log(`${WARNING}The Smart Card resource manager service is not available on this machine.${RESET}`);
    process.exit(0);
  }

  console.error(`SCardEstablishContext failed: 0x${(establishStatus >>> 0).toString(16)}`);
  process.exit(1);
}

const contextHandle = contextHandleBuffer.readBigUInt64LE(0);

try {
  const readerGroups = listWideMultiString(contextHandle, 'groups');
  const readers = listWideMultiString(contextHandle, 'readers');

  row('Reader groups:', readerGroups.length === 0 ? '(none)' : readerGroups.join(', '));
  row('Readers found:', String(readers.length));
  console.log();

  if (readers.length === 0) {
    console.log(`${WARNING}No smart card readers are currently available.${RESET}`);
    process.exit(0);
  }

  const readerNameBuffers = readers.map((readerName) => Buffer.from(`${readerName}\0`, 'utf16le'));
  const readerStateBuffer = Buffer.alloc(readers.length * READER_STATE_RECORD_SIZE);

  for (const [readerIndex, readerNameBuffer] of readerNameBuffers.entries()) {
    const recordOffset = readerIndex * READER_STATE_RECORD_SIZE;
    readerStateBuffer.writeBigUInt64LE(BigInt(readerNameBuffer.ptr!), recordOffset);
    readerStateBuffer.writeUInt32LE(SCARD_STATE.SCARD_STATE_UNAWARE, recordOffset + CURRENT_STATE_OFFSET);
  }

  const statusChange = WinSCard.SCardGetStatusChangeW(contextHandle, 0, readerStateBuffer.ptr, readers.length);
  if (statusChange !== SCARD_S_SUCCESS) {
    throw new Error(`SCardGetStatusChangeW failed: 0x${(statusChange >>> 0).toString(16)}`);
  }

  for (const [readerIndex, readerName] of readers.entries()) {
    const readerNameBuffer = readerNameBuffers[readerIndex];
    const recordOffset = readerIndex * READER_STATE_RECORD_SIZE;
    const eventState = readerStateBuffer.readUInt32LE(recordOffset + EVENT_STATE_OFFSET);
    const atrLength = Math.min(readerStateBuffer.readUInt32LE(recordOffset + ATR_LENGTH_OFFSET), MAX_ATR_BYTES);
    const atrValue = readerStateBuffer.subarray(recordOffset + ATR_BYTES_OFFSET, recordOffset + ATR_BYTES_OFFSET + atrLength);
    const deviceTypeBuffer = Buffer.alloc(4);
    const deviceTypeStatus = WinSCard.SCardGetDeviceTypeIdW(contextHandle, readerNameBuffer.ptr!, deviceTypeBuffer.ptr);
    const deviceTypeValue = deviceTypeStatus === SCARD_S_SUCCESS ? deviceTypeBuffer.readUInt32LE(0) : 0;

    console.log(`${HEADER}${readerName}${RESET}`);
    row('Device instance id:', queryReaderDeviceInstanceId(contextHandle, readerNameBuffer));
    row('Device type:', DEVICE_TYPE_NAMES.get(deviceTypeValue) ?? `0x${deviceTypeValue.toString(16)}`);
    row('Icon payload:', queryReaderIconSize(contextHandle, readerNameBuffer));
    row('Reader state:', decodeFlags(eventState).join(', '));
    row('ATR:', atrLength === 0 ? '(none)' : formatBytes(atrValue));

    if ((eventState & SCARD_STATE.SCARD_STATE_PRESENT) === 0) {
      console.log();
      continue;
    }

    const cardHandleBuffer = Buffer.alloc(8);
    const activeProtocolBuffer = Buffer.alloc(4);
    const connectStatus = WinSCard.SCardConnectW(contextHandle, readerNameBuffer.ptr!, SCARD_SHARE_MODE.SCARD_SHARE_SHARED, SCARD_PROTOCOL.SCARD_PROTOCOL_Tx, cardHandleBuffer.ptr, activeProtocolBuffer.ptr);

    if (connectStatus !== SCARD_S_SUCCESS) {
      row('Connect status:', `0x${(connectStatus >>> 0).toString(16)}`);
      console.log();
      continue;
    }

    const cardHandle = cardHandleBuffer.readBigUInt64LE(0);

    try {
      const readerNamesBuffer = Buffer.alloc(MAX_READER_NAME_CHARACTERS * WIDE_CHARACTER_SIZE);
      const readerNamesLengthBuffer = Buffer.alloc(4);
      const stateValueBuffer = Buffer.alloc(4);
      const protocolValueBuffer = Buffer.alloc(4);
      const atrBuffer = Buffer.alloc(MAX_ATR_BYTES);
      const atrLengthBuffer = Buffer.alloc(4);
      const transmitCountBuffer = Buffer.alloc(4);

      readerNamesLengthBuffer.writeUInt32LE(MAX_READER_NAME_CHARACTERS, 0);
      atrLengthBuffer.writeUInt32LE(MAX_ATR_BYTES, 0);

      const cardStatus = WinSCard.SCardStatusW(cardHandle, readerNamesBuffer.ptr, readerNamesLengthBuffer.ptr, stateValueBuffer.ptr, protocolValueBuffer.ptr, atrBuffer.ptr, atrLengthBuffer.ptr);

      if (cardStatus === SCARD_S_SUCCESS) {
        row('Connected protocol:', `0x${protocolValueBuffer.readUInt32LE(0).toString(16)}`);
        row('Card state:', `0x${stateValueBuffer.readUInt32LE(0).toString(16)}`);
        row('Status ATR:', formatBytes(atrBuffer.subarray(0, atrLengthBuffer.readUInt32LE(0))));
      } else {
        row('Card status:', `0x${(cardStatus >>> 0).toString(16)}`);
      }

      const transmitCountStatus = WinSCard.SCardGetTransmitCount(cardHandle, transmitCountBuffer.ptr);
      if (transmitCountStatus === SCARD_S_SUCCESS) {
        row('Transmit count:', String(transmitCountBuffer.readUInt32LE(0)));
      }

      const vendorName = queryAttribute(cardHandle, SCARD_ATTRIBUTE.SCARD_ATTR_VENDOR_NAME);
      const interfaceType = queryAttribute(cardHandle, SCARD_ATTRIBUTE.SCARD_ATTR_VENDOR_IFD_TYPE);
      const serialNumber = queryAttribute(cardHandle, SCARD_ATTRIBUTE.SCARD_ATTR_VENDOR_IFD_SERIAL_NO);

      row('Vendor name:', vendorName ? formatAttribute(vendorName) : '(unavailable)');
      row('Reader type:', interfaceType ? formatAttribute(interfaceType) : '(unavailable)');
      row('Serial number:', serialNumber ? formatAttribute(serialNumber) : '(unavailable)');
    } finally {
      const disconnectStatus = WinSCard.SCardDisconnect(cardHandle, SCARD_DISPOSITION.SCARD_LEAVE_CARD);
      if (disconnectStatus !== SCARD_S_SUCCESS) {
        row('Disconnect status:', `0x${(disconnectStatus >>> 0).toString(16)}`);
      }
    }

    console.log();
  }
} finally {
  const releaseStatus = WinSCard.SCardReleaseContext(contextHandle);
  if (releaseStatus !== SCARD_S_SUCCESS) {
    console.error(`SCardReleaseContext failed: 0x${(releaseStatus >>> 0).toString(16)}`);
    process.exitCode = 1;
  }
}
