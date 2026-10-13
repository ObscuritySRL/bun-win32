// Afterimage — press a key and scrub your screen back in time.
//
//   bun run packages/afterimage/index.ts                 run in the notification area
//   AFTERIMAGE_SCRIPT="stage 6; open; wait 1; shot a; quit" bun run packages/afterimage/index.ts
//                                                        headless, scripted (see eye/script.ts)

import '@bun-win32/core';

import { runScript } from './eye/script';
import { runShell } from './eye/shell';

const script = Bun.env.AFTERIMAGE_SCRIPT;

if (script !== undefined) {
  const [stageWidth, stageHeight] = (Bun.env.AFTERIMAGE_STAGE_SIZE ?? '2560x1440').split('x').map(Number);
  await runScript({
    captureHertz: 20,
    directory: Bun.env.AFTERIMAGE_SHOTS ?? `${import.meta.dir}/../../.scratch/afterimage/shots`,
    scale: Number(Bun.env.AFTERIMAGE_SCALE ?? 1),
    script,
    source: Bun.env.AFTERIMAGE_SOURCE === 'screen' ? 'screen' : 'stage',
    stageHeight: stageHeight!,
    stageScenario: Bun.env.AFTERIMAGE_SCENARIO ?? 'workday',
    stageWidth: stageWidth!,
  });
  process.exit(0);
}

await runShell();
process.exit(0);
