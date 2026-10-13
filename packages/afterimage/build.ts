// Build Afterimage.exe: one self-contained executable (the eye and its worker bundled together),
// no console window, the Afterimage mark as its icon — rendered here, by the same Direct2D code
// that draws the tray icon.
//
//   bun run packages/afterimage/build.ts        → packages/afterimage/dist/Afterimage.exe

import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { createComputeDevice, destroyDevice, requireGpu } from '@bun-win32/gpu';

import { encodeIcon } from './eye/icon';
import { Painter } from './shared/painter';

const directory = import.meta.dir;
const output = join(directory, 'dist');
mkdirSync(output, { recursive: true });

createComputeDevice();
const painter = new Painter(requireGpu().device);
const iconPath = join(output, 'Afterimage.ico');
await Bun.write(iconPath, encodeIcon(painter, [16, 20, 24, 32, 40, 48, 64, 256]));
painter.dispose();
destroyDevice();

const version = (await Bun.file(join(directory, 'package.json')).json()).version;
const started = performance.now();
// --ignore-dce-annotations: the bindings declare sideEffects: false, which would drop
// @bun-win32/core's `.ptr` extension that the engine relies on.
const build = Bun.spawnSync(
  [
    process.execPath,
    'build',
    '--compile',
    '--ignore-dce-annotations',
    '--windows-hide-console',
    `--windows-icon=${iconPath}`,
    '--windows-title=Afterimage',
    '--windows-publisher=bun-win32',
    `--windows-version=${version}.0`,
    '--windows-description=Press a key and scrub your screen back in time.',
    join(directory, 'index.ts'),
    join(directory, 'memory', 'worker.ts'),
    '--outfile',
    join(output, 'Afterimage.exe'),
  ],
  { stderr: 'inherit', stdout: 'inherit' },
);
if (build.exitCode !== 0) process.exit(build.exitCode ?? 1);
const size = Bun.file(join(output, 'Afterimage.exe')).size;
console.log(`Afterimage.exe — ${(size / 0x10_0000).toFixed(1)} MB in ${((performance.now() - started) / 1_000).toFixed(1)} s`);
