/**
 * etw-firehose — Procmon-lite: a decoded real-time kernel-process event stream.
 *
 * Elevated: starts a real ETW session on Microsoft-Windows-Kernel-Process and pumps
 * decoded ProcessStart/ProcessStop/ThreadStart/ImageLoad events live (the pump BLOCKS the
 * thread until the deadline — that is the v1 contract). Unelevated: falls back to the
 * no-admin surface — the provider census and the full event-template schema for the
 * provider it would have streamed (mirroring the proven repo demo's auto-fallback).
 *
 * APIs demonstrated:
 * - EtwSession.run (the elevated real-time decoded firehose)
 * - etwProviders, etwProviderSchema (the no-admin census + schemas fallback)
 * - isElevated (the gate)
 *
 * Run: bun run example/etw-firehose.ts          (DEMO_DURATION_MS sets the pump deadline)
 */
import { EtwSession, etwProviderSchema, etwProviders, isElevated } from '@bun-win32/sysmon';

const durationMs = Bun.env.DEMO_DURATION_MS === undefined || Bun.env.DEMO_DURATION_MS === '' ? 10_000 : Number(Bun.env.DEMO_DURATION_MS);
const PROVIDER = 'Microsoft-Windows-Kernel-Process';

if (isElevated()) {
  console.log(`\x1b[1metw-firehose\x1b[0m · \x1b[92mreal-time ETW\x1b[0m · provider ${PROVIDER} · pumping ${durationMs / 1000}s (the pump blocks this thread)`);
  const session = new EtwSession({ providerName: PROVIDER });
  const histogram = new Map<string, number>();
  let shown = 0;
  const result = session.run(
    (event) => {
      const label = event.taskName.length > 0 ? event.taskName : `Event ${event.eventId}`;
      histogram.set(label, (histogram.get(label) ?? 0) + 1);
      if (shown < 40) {
        shown += 1;
        console.log(`  \x1b[2mpid ${String(event.processId).padStart(6)}\x1b[0m  \x1b[96m${label.padEnd(20)}\x1b[0m ${event.opcodeName}`);
      }
    },
    { durationMs },
  );
  console.log(`\n\x1b[1m${result.eventCount}\x1b[0m decoded events:`);
  for (const [label, count] of [...histogram.entries()].sort((a, b) => b[1] - a[1])) console.log(`  ${String(count).padStart(6)} × ${label}`);
} else {
  console.log(`\x1b[1metw-firehose\x1b[0m · \x1b[93mnot elevated — showing the no-admin surface instead\x1b[0m (run from an elevated shell for the live stream)`);
  const providers = etwProviders();
  const target = providers.find((provider) => provider.name === PROVIDER);
  console.log(`\n${providers.length} registered providers; the firehose would stream \x1b[96m${PROVIDER}\x1b[0m (${target?.guid}):\n`);
  for (const schema of etwProviderSchema(target!.guid)) {
    const fields = schema.properties.map((property) => property.name).join(', ');
    console.log(`  \x1b[96mevent ${String(schema.eventId).padStart(3)}\x1b[0m v${schema.version} \x1b[1m${schema.taskName.padEnd(18)}\x1b[0m ${schema.opcodeName.padEnd(8)} \x1b[2m${fields.slice(0, 90)}\x1b[0m`);
  }
  console.log('\nEverything above needed zero elevation — the live stream is the elevated bonus.');
}
