// Build Iris into one self-contained Windows executable: dist/iris.exe (Bun runtime embedded, no console window,
// the Iris mark as its icon). Run: bun run packages/iris/build.ts

import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { encodePNGFromRGBA } from '@bun-win32/gpu';

import { irisMark } from './brand';

const root = import.meta.dir;
const dist = join(root, 'dist');
mkdirSync(dist, { recursive: true });
const { version } = await Bun.file(join(root, 'package.json')).json();

// .ico with PNG-compressed images (Windows Vista+ reads PNG entries directly).
const sizes = [16, 24, 32, 48, 64, 128, 256];
const images = sizes.map((size) => encodePNGFromRGBA(irisMark(size), size, size));
const header = Buffer.alloc(6 + sizes.length * 16);
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
sizes.forEach((size, index) => {
  const entry = 6 + index * 16;
  header.writeUInt8(size === 256 ? 0 : size, entry);
  header.writeUInt8(size === 256 ? 0 : size, entry + 1);
  header.writeUInt16LE(1, entry + 4); // planes
  header.writeUInt16LE(32, entry + 6); // bits per pixel
  header.writeUInt32LE(images[index]!.length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += images[index]!.length;
});
const icon = join(dist, 'iris.ico');
await Bun.write(icon, Buffer.concat([header, ...images.map((image) => Buffer.from(image))]));

// --ignore-dce-annotations: the @bun-win32 packages declare "sideEffects": false, which would otherwise let the
// bundler drop @bun-win32/core's runtime extension that gives every Buffer and TypedArray its `.ptr`.
const build = Bun.spawnSync(
  [
    process.execPath,
    'build',
    '--compile',
    '--ignore-dce-annotations',
    '--minify-syntax',
    '--windows-hide-console',
    `--windows-icon=${icon}`,
    '--windows-title=Iris',
    '--windows-publisher=bun-win32',
    `--windows-version=${version}.0`,
    '--windows-description=Iris — every window, every word',
    join(root, 'index.ts'),
    join(root, 'indexer-worker.ts'),
    '--outfile',
    join(dist, 'iris.exe'),
  ],
  { stderr: 'inherit', stdout: 'inherit' },
);
process.exit(build.exitCode ?? 1);
