import Wevtapi, { EvtFormatMessageFlags, EvtQueryFlags, EvtRenderFlags } from '@bun-win32/wevtapi';
import { decodeNulTerminatedUnicodeString } from './structs';

Wevtapi.Preload(['EvtClose', 'EvtFormatMessage', 'EvtNext', 'EvtNextChannelPath', 'EvtOpenChannelEnum', 'EvtOpenPublisherMetadata', 'EvtQuery', 'EvtRender']);
const { EvtClose, EvtFormatMessage, EvtNext, EvtNextChannelPath, EvtOpenChannelEnum, EvtOpenPublisherMetadata, EvtQuery, EvtRender } = Wevtapi;

export interface EventRecord {
  channel: string;
  computer: string;
  eventId: number;
  /** 1 critical, 2 error, 3 warning, 4 information, 5 verbose (0 = log-always). */
  level: number;
  /** Publisher-formatted human-readable message; null when the provider has no metadata for it. */
  message: string | null;
  providerName: string;
  recordId: number;
  timeCreated: Date;
  /** The full rendered event XML — every field the typed shape doesn't lift. */
  xml: string;
}

export interface QueryOptions {
  channel: string;
  /** Cap on returned records (default 100). */
  max?: number;
  /** Skip publisher message formatting for speed (default false). */
  rawOnly?: boolean;
  /** Newest-first when true (default true). */
  reverse?: boolean;
  /** Full XPath filter, default `*` — e.g. `*[System[Level<=3]]`. */
  xpath?: string;
}

export interface TailOptions {
  channel: string;
  /** Poll interval in ms (default 1000) — the tail favors readability over latency. */
  intervalMs?: number;
  /** Abort to end the iteration cleanly. */
  signal?: AbortSignal;
  /** A System-predicate expression (the inside of `System[...]`, e.g. `Level <= 3`) ANDed with the record-id gate each poll. */
  systemFilter?: string;
}

const publisherMetadataCache = new Map<string, bigint>();

function isAborted(signal: AbortSignal | undefined): boolean {
  return signal !== undefined && signal.aborted;
}

function openPublisherMetadata(providerName: string): bigint {
  const cached = publisherMetadataCache.get(providerName);
  if (cached !== undefined) return cached;
  const providerBuffer = Buffer.from(`${providerName}\0`, 'utf16le');
  const metadataHandle = EvtOpenPublisherMetadata(0n, providerBuffer.ptr, null, 0, 0);
  publisherMetadataCache.set(providerName, metadataHandle);
  return metadataHandle;
}

/** Publisher-formatted message for an open event handle (EvtFormatMessage two-call); null when the provider/message is unavailable. Metadata handles are cached per provider for the process lifetime. */
export function formatMessage(providerName: string, eventHandle: bigint): string | null {
  const metadataHandle = openPublisherMetadata(providerName);
  if (metadataHandle === 0n) return null;
  const usedBuffer = Buffer.alloc(4);
  void EvtFormatMessage(metadataHandle, eventHandle, 0, 0, null, EvtFormatMessageFlags.EvtFormatMessageEvent, 0, null, usedBuffer.ptr);
  const requiredCharacters = usedBuffer.readUInt32LE(0);
  if (requiredCharacters === 0) return null;
  const messageBuffer = Buffer.alloc(requiredCharacters * 2);
  if (EvtFormatMessage(metadataHandle, eventHandle, 0, 0, null, EvtFormatMessageFlags.EvtFormatMessageEvent, requiredCharacters, messageBuffer.ptr, usedBuffer.ptr) === 0) return null;
  return decodeNulTerminatedUnicodeString(messageBuffer, 0, requiredCharacters);
}

function renderEventXml(eventHandle: bigint): string {
  const usedBuffer = Buffer.alloc(4);
  const propertyCountBuffer = Buffer.alloc(4);
  void EvtRender(0n, eventHandle, EvtRenderFlags.EvtRenderEventXml, 0, null, usedBuffer.ptr, propertyCountBuffer.ptr);
  const requiredBytes = usedBuffer.readUInt32LE(0);
  if (requiredBytes === 0) return '';
  const xmlBuffer = Buffer.alloc(requiredBytes);
  if (EvtRender(0n, eventHandle, EvtRenderFlags.EvtRenderEventXml, requiredBytes, xmlBuffer.ptr, usedBuffer.ptr, propertyCountBuffer.ptr) === 0) return '';
  return decodeNulTerminatedUnicodeString(xmlBuffer, 0, requiredBytes / 2);
}

function extractMatch(xml: string, pattern: RegExp): string {
  return xml.match(pattern)?.[1] ?? '';
}

function recordFromHandle(eventHandle: bigint, channel: string, rawOnly: boolean): EventRecord | null {
  const xml = renderEventXml(eventHandle);
  if (xml.length === 0) return null;
  const providerName = extractMatch(xml, /<Provider Name=['"]([^'"]+)['"]/);
  return {
    channel,
    computer: extractMatch(xml, /<Computer>([^<]+)</),
    eventId: Number(extractMatch(xml, /<EventID(?: [^>]*)?>([^<]+)</) || '0'),
    level: Number(extractMatch(xml, /<Level>([^<]+)</) || '0'),
    message: rawOnly || providerName.length === 0 ? null : formatMessage(providerName, eventHandle),
    providerName,
    recordId: Number(extractMatch(xml, /<EventRecordID>([^<]+)</) || '0'),
    timeCreated: new Date(extractMatch(xml, /<TimeCreated SystemTime=['"]([^'"]+)['"]/)),
    xml,
  };
}

/** Every event channel on the machine (EvtOpenChannelEnum + EvtNextChannelPath two-call loop). */
export function channels(): string[] {
  const enumHandle = EvtOpenChannelEnum(0n, 0);
  if (enumHandle === 0n) throw new Error('EvtOpenChannelEnum failed');
  const names: string[] = [];
  try {
    const usedBuffer = Buffer.alloc(4);
    for (;;) {
      usedBuffer.writeUInt32LE(0, 0);
      void EvtNextChannelPath(enumHandle, 0, null, usedBuffer.ptr);
      const requiredCharacters = usedBuffer.readUInt32LE(0);
      if (requiredCharacters === 0) break; // ERROR_NO_MORE_ITEMS leaves the size untouched
      const nameBuffer = Buffer.alloc(requiredCharacters * 2);
      if (EvtNextChannelPath(enumHandle, requiredCharacters, nameBuffer.ptr, usedBuffer.ptr) === 0) break;
      names.push(decodeNulTerminatedUnicodeString(nameBuffer, 0, requiredCharacters));
    }
  } finally {
    void EvtClose(enumHandle);
  }
  return names;
}

/**
 * Query a channel (EvtQuery + EvtNext batches + EvtRender XML) — newest-first by default, with
 * publisher-formatted messages. The Security channel requires elevation: an access-denied open
 * throws with that explanation rather than a bare failure. Every event handle and the query
 * handle are closed before returning.
 */
export function queryEvents(options: QueryOptions): EventRecord[] {
  const max = options.max ?? 100;
  const reverse = options.reverse ?? true;
  const channelBuffer = Buffer.from(`${options.channel}\0`, 'utf16le');
  const xpathBuffer = Buffer.from(`${options.xpath ?? '*'}\0`, 'utf16le');
  const queryHandle = EvtQuery(0n, channelBuffer.ptr, xpathBuffer.ptr, EvtQueryFlags.EvtQueryChannelPath | (reverse ? EvtQueryFlags.EvtQueryReverseDirection : EvtQueryFlags.EvtQueryForwardDirection));
  if (queryHandle === 0n) throw new Error(`EvtQuery('${options.channel}') failed — the Security channel (and some Operational channels) require an elevated process; run isElevated() to check`);
  const records: EventRecord[] = [];
  try {
    const handlesBuffer = Buffer.alloc(16 * 8);
    const returnedBuffer = Buffer.alloc(4);
    while (records.length < max) {
      const batch = Math.min(16, max - records.length);
      if (EvtNext(queryHandle, batch, handlesBuffer.ptr, 0, 0, returnedBuffer.ptr) === 0) break;
      const returned = returnedBuffer.readUInt32LE(0);
      if (returned === 0) break;
      for (let i = 0; i < returned; i += 1) {
        const eventHandle = handlesBuffer.readBigUInt64LE(i * 8);
        if (eventHandle === 0n) continue;
        try {
          const record = recordFromHandle(eventHandle, options.channel, options.rawOnly === true);
          if (record !== null && records.length < max) records.push(record);
        } finally {
          void EvtClose(eventHandle);
        }
      }
    }
  } finally {
    void EvtClose(queryHandle);
  }
  return records;
}

/**
 * Live tail as an AsyncIterable — PULL + POLL, never EvtSubscribe (its push callback fires on a
 * foreign thread, a crash class under Bun FFI). Tracks the last EventRecordID and re-queries
 * forward with `*[System[EventRecordID > N]]` each interval. Abort the signal to end cleanly.
 */
export async function* tailEvents(options: TailOptions): AsyncGenerator<EventRecord, void, undefined> {
  const intervalMs = options.intervalMs ?? 1_000;
  const newest = queryEvents({ channel: options.channel, max: 1, rawOnly: true });
  let lastRecordId = newest.length > 0 ? newest[0]!.recordId : 0;
  while (!isAborted(options.signal)) {
    const gate = options.systemFilter === undefined ? `*[System[EventRecordID > ${lastRecordId}]]` : `*[System[(${options.systemFilter}) and EventRecordID > ${lastRecordId}]]`;
    const fresh = queryEvents({ channel: options.channel, max: 256, reverse: false, xpath: gate });
    for (const record of fresh) {
      if (record.recordId > lastRecordId) lastRecordId = record.recordId;
      yield record;
      if (isAborted(options.signal)) return;
    }
    await Bun.sleep(intervalMs);
  }
}
