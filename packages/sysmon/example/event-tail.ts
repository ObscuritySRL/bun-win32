/**
 * event-tail — a colorized live tail of any Windows Event Log channel.
 *
 * `tail -f` for the modern Event Log: pull+poll via EvtQuery with an EventRecordID
 * watermark (never EvtSubscribe — its push callback fires on a foreign thread), with
 * publisher message formatting and level coloring. Defaults to Application; pass a
 * channel name as the first argument (Security requires an elevated shell).
 *
 * APIs demonstrated:
 * - tailEvents (the AsyncIterable pull+poll tail)
 * - queryEvents (the startup backfill)
 * - isElevated (the Security-channel hint)
 *
 * Run: bun run example/event-tail.ts [channel]    (Ctrl-C stops; DEMO_DURATION_MS honored)
 */
import { type EventRecord, isElevated, queryEvents, tailEvents } from '@bun-win32/sysmon';

const channel = Bun.argv[2] ?? 'Application';
const durationMs = Bun.env.DEMO_DURATION_MS === undefined || Bun.env.DEMO_DURATION_MS === '' ? 0 : Number(Bun.env.DEMO_DURATION_MS);

const LEVELS: Record<number, { name: string; tint: string }> = {
  1: { name: 'CRIT', tint: '\x1b[1;95m' },
  2: { name: 'ERROR', tint: '\x1b[1;91m' },
  3: { name: 'WARN', tint: '\x1b[1;93m' },
  4: { name: 'INFO', tint: '\x1b[96m' },
  5: { name: 'VERB', tint: '\x1b[2;37m' },
};

function printRecord(record: EventRecord): void {
  const level = LEVELS[record.level] ?? { name: `L${record.level}`, tint: '\x1b[2;37m' };
  const time = record.timeCreated.toLocaleTimeString();
  const message = (record.message ?? '(no publisher message)').replace(/\s+/g, ' ').slice(0, 160);
  console.log(`\x1b[2m${time}\x1b[0m ${level.tint}${level.name.padEnd(5)}\x1b[0m \x1b[1m${record.providerName.replace(/^Microsoft-Windows-/, '')}\x1b[0m#${record.eventId} ${message}`);
}

console.log(`\x1b[1mevent-tail\x1b[0m · channel '\x1b[96m${channel}\x1b[0m' · pull+poll every 1 s · Ctrl-C stops${channel === 'Security' && !isElevated() ? ' \x1b[93m(Security needs an elevated shell)\x1b[0m' : ''}`);
for (const record of queryEvents({ channel, max: 8 }).reverse()) printRecord(record);
console.log('\x1b[2m── live ──\x1b[0m');

const controller = new AbortController();
if (durationMs > 0) setTimeout(() => controller.abort(), durationMs);
for await (const record of tailEvents({ channel, intervalMs: 1_000, signal: controller.signal })) printRecord(record);
console.log('event-tail: stopped cleanly');
