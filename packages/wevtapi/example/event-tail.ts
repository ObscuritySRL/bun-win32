/**
 * Live Windows Event Log tail.
 *
 * Refreshes a colorized dashboard of the newest warning, error, and
 * informational events from the Application and System logs. Each refresh
 * renders the latest event XML, resolves publisher metadata when available,
 * and formats the human-readable event message.
 *
 * APIs demonstrated:
 *   - EvtQuery (open reverse-order event queries)
 *   - EvtNext (pull event handles from the query result set)
 *   - EvtRender (render event XML payloads)
 *   - EvtOpenPublisherMetadata (open provider resources for formatting)
 *   - EvtFormatMessage (resolve the event message text)
 *   - EvtClose (release every event, query, and metadata handle)
 *
 * Run: bun run example/event-tail.ts
 */

import Wevtapi, { EvtFormatMessageFlags, EvtQueryFlags, EvtRenderFlags } from '../index';

const APPLICATION = 'Application';
const APPLICATION_OR_SYSTEM_QUERY = '*[System[(Level=1 or Level=2 or Level=3 or Level=4)]]';
const APPLICATION_SYSTEM_CHANNELS = [APPLICATION, 'System'] as const;
const EVENTS_PER_CHANNEL = 6;
const ITERATIONS = Number(Bun.env.WEVTAPI_ITERATIONS ?? '8');
const MAX_MESSAGE_LENGTH = 110;
const REFRESH_DELAY_MS = Number(Bun.env.WEVTAPI_REFRESH_MS ?? '1500');
const RESET = '\x1b[0m';

Wevtapi.Preload(['EvtClose', 'EvtFormatMessage', 'EvtNext', 'EvtOpenPublisherMetadata', 'EvtQuery', 'EvtRender']);

type EventSnapshot = {
  channel: string;
  eventId: string;
  levelColor: string;
  levelName: string;
  message: string;
  provider: string;
  timestamp: string;
};

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function extractMatch(xml: string, pattern: RegExp): string {
  return xml.match(pattern)?.[1] ?? '';
}

function formatMessage(metadataHandle: bigint, eventHandle: bigint): string {
  const bufferUsedBuffer = Buffer.alloc(4);
  void Wevtapi.EvtFormatMessage(metadataHandle, eventHandle, 0, 0, null, EvtFormatMessageFlags.EvtFormatMessageEvent, 0, null, bufferUsedBuffer.ptr);

  const requiredCharacters = bufferUsedBuffer.readUInt32LE(0);

  if (requiredCharacters === 0) {
    return 'message unavailable';
  }

  const messageBuffer = Buffer.alloc(requiredCharacters * 2);
  const status = Wevtapi.EvtFormatMessage(metadataHandle, eventHandle, 0, 0, null, EvtFormatMessageFlags.EvtFormatMessageEvent, requiredCharacters, messageBuffer.ptr, bufferUsedBuffer.ptr);

  if (status === 0) {
    return 'message unavailable';
  }

  return collapseWhitespace(messageBuffer.toString('utf16le').replace(/\0.*$/, ''));
}

function formatTimestamp(systemTime: string): string {
  if (!systemTime) {
    return '--:--:--';
  }

  const parsedDate = new Date(systemTime);

  if (Number.isNaN(parsedDate.getTime())) {
    return '--:--:--';
  }

  return parsedDate.toLocaleTimeString();
}

function getLevelPresentation(level: number): { color: string; name: string } {
  if (level === 1) return { color: '\x1b[1;95m', name: 'CRITICAL' };
  if (level === 2) return { color: '\x1b[1;91m', name: 'ERROR' };
  if (level === 3) return { color: '\x1b[1;93m', name: 'WARNING' };
  if (level === 4) return { color: '\x1b[1;96m', name: 'INFO' };
  return { color: '\x1b[2;37m', name: 'OTHER' };
}

function openPublisherMetadata(providerName: string, publisherCache: Map<string, bigint>): bigint {
  const cachedHandle = publisherCache.get(providerName);

  if (cachedHandle !== undefined) {
    return cachedHandle;
  }

  const providerNameBuffer = Buffer.from(`${providerName}\0`, 'utf16le');
  const metadataHandle = Wevtapi.EvtOpenPublisherMetadata(0n, providerNameBuffer.ptr, null, 0, 0);

  publisherCache.set(providerName, metadataHandle);

  return metadataHandle;
}

function renderEventXml(eventHandle: bigint): string {
  const bufferUsedBuffer = Buffer.alloc(4);
  const propertyCountBuffer = Buffer.alloc(4);
  void Wevtapi.EvtRender(0n, eventHandle, EvtRenderFlags.EvtRenderEventXml, 0, null, bufferUsedBuffer.ptr, propertyCountBuffer.ptr);

  const requiredBytes = bufferUsedBuffer.readUInt32LE(0);

  if (requiredBytes === 0) {
    return '';
  }

  const renderBuffer = Buffer.alloc(requiredBytes);
  const status = Wevtapi.EvtRender(0n, eventHandle, EvtRenderFlags.EvtRenderEventXml, requiredBytes, renderBuffer.ptr, bufferUsedBuffer.ptr, propertyCountBuffer.ptr);

  if (status === 0) {
    return '';
  }

  return renderBuffer.toString('utf16le').replace(/\0.*$/, '');
}

function summarizeChannel(channelName: string, publisherCache: Map<string, bigint>): EventSnapshot[] {
  const channelPathBuffer = Buffer.from(`${channelName}\0`, 'utf16le');
  const queryBuffer = Buffer.from(`${APPLICATION_OR_SYSTEM_QUERY}\0`, 'utf16le');
  const queryHandle = Wevtapi.EvtQuery(0n, channelPathBuffer.ptr, queryBuffer.ptr, EvtQueryFlags.EvtQueryChannelPath | EvtQueryFlags.EvtQueryReverseDirection);

  if (queryHandle === 0n) {
    return [];
  }

  try {
    const eventHandleBuffer = Buffer.alloc(EVENTS_PER_CHANNEL * 8);
    const returnedBuffer = Buffer.alloc(4);
    const status = Wevtapi.EvtNext(queryHandle, EVENTS_PER_CHANNEL, eventHandleBuffer.ptr, 0, 0, returnedBuffer.ptr);
    const returnedCount = returnedBuffer.readUInt32LE(0);

    if (status === 0 && returnedCount === 0) {
      return [];
    }

    const snapshots: EventSnapshot[] = [];

    for (let eventIndex = 0; eventIndex < returnedCount; eventIndex++) {
      const eventHandle = eventHandleBuffer.readBigUInt64LE(eventIndex * 8);

      if (eventHandle === 0n) {
        continue;
      }

      try {
        const eventXml = renderEventXml(eventHandle);

        if (!eventXml) {
          continue;
        }

        const provider = extractMatch(eventXml, /<Provider Name=['"]([^'"]+)['"]/);
        const eventId = extractMatch(eventXml, /<EventID(?: [^>]*)?>([^<]+)</);
        const level = Number(extractMatch(eventXml, /<Level>([^<]+)</) || '0');
        const systemTime = extractMatch(eventXml, /<TimeCreated SystemTime=['"]([^'"]+)['"]/);
        const { color, name } = getLevelPresentation(level);
        const metadataHandle = provider ? openPublisherMetadata(provider, publisherCache) : 0n;
        const formattedMessage = metadataHandle !== 0n ? formatMessage(metadataHandle, eventHandle) : 'message unavailable';

        snapshots.push({
          channel: channelName,
          eventId: eventId || '?',
          levelColor: color,
          levelName: name,
          message: formattedMessage.length > MAX_MESSAGE_LENGTH ? `${formattedMessage.slice(0, MAX_MESSAGE_LENGTH - 1)}…` : formattedMessage,
          provider: provider || '<unknown>',
          timestamp: formatTimestamp(systemTime),
        });
      } finally {
        void Wevtapi.EvtClose(eventHandle);
      }
    }

    return snapshots;
  } finally {
    void Wevtapi.EvtClose(queryHandle);
  }
}

function severityStrip(events: EventSnapshot[]): string {
  if (events.length === 0) {
    return '\x1b[2m(no events)\x1b[0m';
  }

  return `${events.map((event) => `${event.levelColor}█`).join('')}${RESET}`;
}

const publisherCache = new Map<string, bigint>();

process.stdout.write('\x1b[?25l');

try {
  for (let iteration = 0; iteration < ITERATIONS; iteration++) {
    const channelSnapshots = APPLICATION_SYSTEM_CHANNELS.map((channelName) => ({
      channelName,
      events: summarizeChannel(channelName, publisherCache),
    }));

    process.stdout.write('\x1b[2J\x1b[H');
    console.log('\x1b[1;96mWindows Event Tail\x1b[0m');
    console.log(`Refresh ${iteration + 1}/${ITERATIONS}    ${new Date().toLocaleTimeString()}`);
    console.log();

    for (const { channelName, events } of channelSnapshots) {
      console.log(`\x1b[1m${channelName.padEnd(12)}\x1b[0m ${severityStrip(events)}`);
      console.log(`  ${'Time'.padEnd(10)} ${'Level'.padEnd(10)} ${'Provider'.padEnd(28)} ${'Event'.padEnd(7)} Message`);
      console.log(`  ${''.padEnd(10, '-')} ${''.padEnd(10, '-')} ${''.padEnd(28, '-')} ${''.padEnd(7, '-')} ${''.padEnd(48, '-')}`);

      if (events.length === 0) {
        console.log('  No events matched the current filter.');
      }

      for (const event of events) {
        const providerLabel = event.provider.length > 28 ? `${event.provider.slice(0, 27)}…` : event.provider;
        console.log(`  ${event.timestamp.padEnd(10)} ${`${event.levelColor}${event.levelName}${RESET}`.padEnd(19)} ${providerLabel.padEnd(28)} ${event.eventId.padEnd(7)} ${event.message}`);
      }

      console.log();
    }

    console.log('\x1b[2mSet WEVTAPI_ITERATIONS or WEVTAPI_REFRESH_MS to adjust the live tail during testing.\x1b[0m');

    if (iteration + 1 < ITERATIONS) {
      await Bun.sleep(REFRESH_DELAY_MS);
    }
  }
} finally {
  for (const metadataHandle of publisherCache.values()) {
    if (metadataHandle !== 0n) {
      void Wevtapi.EvtClose(metadataHandle);
    }
  }

  process.stdout.write('\x1b[?25h');
}
