// Counted at bundle time (imported `with { type: 'macro' }`), so the colophon's line count survives `bun build --compile`,
// where the source files no longer exist on disk.

import { readFileSync } from 'node:fs';

export function sourceStatistics(): { files: number; lines: number } {
  let files = 0;
  let lines = 0;
  for (const file of new Bun.Glob('*.ts').scanSync(import.meta.dir)) {
    files += 1;
    for (const line of readFileSync(`${import.meta.dir}/${file}`, 'utf8').split('\n')) if (line.trim().length > 0) lines += 1;
  }
  return { files, lines };
}
