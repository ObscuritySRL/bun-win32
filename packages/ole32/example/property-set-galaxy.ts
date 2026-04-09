/**
 * Property Set Galaxy
 *
 * Converts representative property-set format identifiers into their storage
 * stream names and plots them as a colorized ASCII galaxy. Every stream name
 * is round-tripped back into an FMTID so the rendered constellations prove the
 * conversion is lossless.
 *
 * APIs demonstrated:
 *   - CoBuildVersion     (report the packed COM build version)
 *   - FmtIdToPropStgName (convert an FMTID into a property-set stream name)
 *   - OleBuildVersion    (report the packed OLE build version)
 *   - PropStgNameToFmtId (round-trip a property-set stream name back into an FMTID)
 *
 * Run: bun run example/property-set-galaxy.ts
 */

import Ole32, { CCH_MAX_PROPSTG_NAME } from '../index';

Ole32.Preload(['CoBuildVersion', 'FmtIdToPropStgName', 'OleBuildVersion', 'PropStgNameToFmtId']);

const BLUE = '\x1b[94m';
const CYAN = '\x1b[96m';
const DIM = '\x1b[2m';
const GREEN = '\x1b[92m';
const MAGENTA = '\x1b[95m';
const RED = '\x1b[91m';
const RESET = '\x1b[0m';
const YELLOW = '\x1b[93m';

const propertySetSamples = [
  { guid: 'F29F85E0-4FF9-1068-AB91-08002B27B3D9', label: 'SummaryInformation' },
  { guid: '12345678-1234-5678-90AB-CDEF01234567', label: 'Synthetic Atlas' },
  { guid: 'A1B2C3D4-E5F6-4789-ABCD-EF0123456789', label: 'Synthetic Comet' },
  { guid: '0F1E2D3C-4B5A-6978-8899-AABBCCDDEEFF', label: 'Synthetic Drift' },
  { guid: '7E57A1D0-CAFE-4BAD-BEEF-001122334455', label: 'Synthetic Echo' },
  { guid: '89ABCDEF-0123-4567-89AB-CDEF01234567', label: 'Synthetic Flux' },
  { guid: '55AA55AA-33CC-44DD-88EE-112233445566', label: 'Synthetic Halo' },
  { guid: 'CAFEBABE-0001-4002-8003-112358132134', label: 'Synthetic Ion' },
  { guid: 'FEEDC0DE-1357-2468-ACE0-02468ACE1357', label: 'Synthetic Lumen' },
  { guid: '10293847-5647-4A5B-9C8D-0011AABBCCDD', label: 'Synthetic Nova' },
];

const palette = [CYAN, GREEN, MAGENTA, YELLOW, BLUE, RED];
const glyphs = ['*', '+', 'o', 'x', '@'];
const width = Math.max(72, Math.min((process.stdout.columns ?? 80) - 4, 84));
const height = 22;
const centerX = Math.floor(width / 2);
const centerY = Math.floor(height / 2);

function decodeFmtid(buffer: Buffer): string {
  const partOne = buffer.readUInt32LE(0).toString(16).padStart(8, '0').toUpperCase();
  const partTwo = buffer.readUInt16LE(4).toString(16).padStart(4, '0').toUpperCase();
  const partThree = buffer.readUInt16LE(6).toString(16).padStart(4, '0').toUpperCase();
  const partFour = buffer.subarray(8, 10).toString('hex').toUpperCase();
  const partFive = buffer.subarray(10, 16).toString('hex').toUpperCase();

  return `${partOne}-${partTwo}-${partThree}-${partFour}-${partFive}`;
}

function encodeFmtid(guid: string): Buffer {
  const match = /^([0-9A-Fa-f]{8})-([0-9A-Fa-f]{4})-([0-9A-Fa-f]{4})-([0-9A-Fa-f]{4})-([0-9A-Fa-f]{12})$/.exec(guid);

  if (!match) {
    throw new Error(`Invalid FMTID: ${guid}`);
  }

  const buffer = Buffer.alloc(16);
  buffer.writeUInt32LE(Number.parseInt(match[1], 16), 0);
  buffer.writeUInt16LE(Number.parseInt(match[2], 16), 4);
  buffer.writeUInt16LE(Number.parseInt(match[3], 16), 6);
  Buffer.from(`${match[4]}${match[5]}`, 'hex').copy(buffer, 8);

  return buffer;
}

function escapePropertyStorageName(value: string): string {
  let escaped = '';

  for (const character of value) {
    const codePoint = character.charCodeAt(0);

    if (codePoint >= 0x20 && codePoint <= 0x7e) {
      escaped += character;
      continue;
    }

    escaped += `\\u${codePoint.toString(16).padStart(4, '0')}`;
  }

  return escaped;
}

function readWide(buffer: Buffer): string {
  return buffer.toString('utf16le').replace(/\0.*$/, '');
}

function stripAnsi(value: string): string {
  return value.replace(/\x1b\[[0-9;]*m/g, '');
}

function boxTop(): string {
  return `${MAGENTA}+${'-'.repeat(width)}+${RESET}`;
}

function boxLine(content = ''): string {
  const visibleContent = stripAnsi(content);
  const padding = Math.max(0, width - visibleContent.length);
  return `${MAGENTA}|${RESET}${content}${' '.repeat(padding)}${MAGENTA}|${RESET}`;
}

function wrapPlainText(text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const nextLine = currentLine.length === 0 ? word : `${currentLine} ${word}`;

    if (nextLine.length <= maxWidth) {
      currentLine = nextLine;
      continue;
    }

    if (currentLine.length > 0) {
      lines.push(currentLine);
    }

    currentLine = word;
  }

  if (currentLine.length > 0) {
    lines.push(currentLine);
  }

  return lines;
}

function renderDust(column: number, row: number): string {
  const normalizedX = (column - centerX) / 18;
  const normalizedY = (row - centerY) / 7;
  const distance = Math.sqrt(normalizedX * normalizedX + normalizedY * normalizedY);
  const angle = Math.atan2(normalizedY, normalizedX);
  const swirl = Math.sin(distance * 6 - angle * 2.4);

  if (distance < 0.3) {
    return `${YELLOW}@${RESET}`;
  }

  if (distance < 0.55) {
    return `${YELLOW}O${RESET}`;
  }

  if (distance < 1.15 && Math.abs(swirl) < 0.28) {
    return `${DIM}.${RESET}`;
  }

  return ' ';
}

type GalaxyEntry = {
  color: string;
  glyph: string;
  guid: string;
  label: string;
  propertyStorageName: string;
  roundTripGuid: string;
  x: number;
  y: number;
};

const occupiedCells = new Set<string>();
const entries: GalaxyEntry[] = propertySetSamples.map((sample, index) => {
  const fmtidBuffer = encodeFmtid(sample.guid);
  const propertyNameBuffer = Buffer.alloc((CCH_MAX_PROPSTG_NAME + 1) * 2);
  const propertyNameStatus = Ole32.FmtIdToPropStgName(fmtidBuffer.ptr, propertyNameBuffer.ptr);

  if (propertyNameStatus !== 0) {
    throw new Error(`FmtIdToPropStgName failed for ${sample.guid}: 0x${(propertyNameStatus >>> 0).toString(16).padStart(8, '0')}`);
  }

  const roundTripBuffer = Buffer.alloc(16);
  const roundTripStatus = Ole32.PropStgNameToFmtId(propertyNameBuffer.ptr, roundTripBuffer.ptr);

  if (roundTripStatus !== 0) {
    throw new Error(`PropStgNameToFmtId failed for ${sample.guid}: 0x${(roundTripStatus >>> 0).toString(16).padStart(8, '0')}`);
  }

  const angleSeed = (fmtidBuffer.readUInt16LE(0) + fmtidBuffer.readUInt16LE(2) + index * 0x0111) & 0xffff;
  const radiusSeed = (fmtidBuffer.readUInt16LE(4) ^ fmtidBuffer.readUInt16LE(6) ^ (index * 0x0101)) & 0xffff;
  const angle = (angleSeed / 0xffff) * Math.PI * 2;
  const radius = 6 + Math.floor((radiusSeed / 0xffff) * 24);

  let x = Math.max(1, Math.min(width - 2, Math.round(centerX + Math.cos(angle + (index % 2) * Math.PI) * radius)));
  let y = Math.max(1, Math.min(height - 2, Math.round(centerY + Math.sin(angle * 1.3 + (index % 3) * 0.9) * radius * 0.32)));

  while (occupiedCells.has(`${x},${y}`) && x < width - 2) {
    x++;
  }

  occupiedCells.add(`${x},${y}`);

  return {
    color: palette[index % palette.length]!,
    glyph: glyphs[index % glyphs.length]!,
    guid: sample.guid,
    label: sample.label,
    propertyStorageName: escapePropertyStorageName(readWide(propertyNameBuffer)),
    roundTripGuid: decodeFmtid(roundTripBuffer),
    x,
    y,
  };
});

for (const entry of entries) {
  if (entry.roundTripGuid !== entry.guid.toUpperCase()) {
    throw new Error(`Round-trip mismatch for ${entry.guid}: ${entry.roundTripGuid}`);
  }
}

const grid = Array.from({ length: height }, (_, row) => Array.from({ length: width }, (_, column) => renderDust(column, row)));

for (const entry of entries) {
  grid[entry.y]![entry.x] = `${entry.color}${entry.glyph}${RESET}`;
}

const comBuildVersion = Ole32.CoBuildVersion();
const oleBuildVersion = Ole32.OleBuildVersion();

console.log('');
console.log(boxTop());
console.log(boxLine(` ${CYAN}Property Set Galaxy${RESET}`));

for (const line of wrapPlainText('FmtIdToPropStgName and PropStgNameToFmtId rendered as a property-stream star map', width - 1)) {
  console.log(boxLine(` ${DIM}${line}${RESET}`));
}

console.log(boxLine(` COM build 0x${comBuildVersion.toString(16).padStart(8, '0')}   OLE build 0x${oleBuildVersion.toString(16).padStart(8, '0')}`));
console.log(boxTop());

for (const row of grid) {
  console.log(boxLine(row.join('')));
}

console.log(boxTop());
console.log(boxLine(` ${GREEN}Constellation Legend${RESET}`));

for (const entry of entries) {
  console.log(boxLine(` ${entry.color}${entry.glyph}${RESET} ${entry.label.padEnd(20)} ${entry.guid}`));
  console.log(boxLine(`   ${DIM}${entry.propertyStorageName}${RESET}`));
}

console.log(boxTop());
console.log('');
