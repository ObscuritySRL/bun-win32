/**
 * Normalization Audit
 *
 * Audits representative strings and domain labels through normaliz.dll. The report
 * shows Unicode code points, canonical and compatibility normalization results,
 * Nameprep output, and IDN round-trips in a structured terminal layout.
 *
 * APIs demonstrated:
 *   - NormalizeString (canonical and compatibility normalization, sizing calls)
 *   - IsNormalizedString (detect whether a string is already normalized)
 *   - IdnToNameprepUnicode (apply Nameprep rules before conversion)
 *   - IdnToAscii (convert Unicode labels to ASCII/Punycode)
 *   - IdnToUnicode (round-trip ASCII labels back to Unicode)
 *
 * Run: bun run example/normalization-audit.ts
 */

import Normaliz, { NormalizationForm } from '../index';

const ANSI = {
  bold: '\x1b[1m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
  yellow: '\x1b[33m',
} as const;

const normalizationForms = [
  ['NFC', NormalizationForm.NormalizationC],
  ['NFD', NormalizationForm.NormalizationD],
  ['NFKC', NormalizationForm.NormalizationKC],
  ['NFKD', NormalizationForm.NormalizationKD],
] as const;

const auditEntries = [
  { label: 'Cafe decomposed', text: 'Cafe\u0301' },
  { label: 'Cafe composed', text: 'Caf\u00e9' },
  { label: 'Hangul jamo', text: '\u1112\u1161\u11ab\u1100\u1173\u11af' },
  { label: 'Greek domain', text: '\u03c0\u03b1\u03c1\u03ac\u03b4\u03b5\u03b9\u03b3\u03bc\u03b1.\u03b4\u03bf\u03ba\u03b9\u03bc\u03ae' },
  { label: 'Japanese domain', text: '\u4f8b\u5b50.\u6d4b\u8bd5' },
  { label: 'Unicode domain', text: 'b\u00fccher.example' },
] as const;

Normaliz.Preload(['IdnToAscii', 'IdnToNameprepUnicode', 'IdnToUnicode', 'IsNormalizedString', 'NormalizeString']);

console.log(`${ANSI.bold}${ANSI.cyan}Normalization Audit${ANSI.reset}`);
console.log(`${ANSI.dim}Canonical, compatibility, Nameprep, and IDN round-trips through normaliz.dll${ANSI.reset}`);
console.log('');

for (const auditEntry of auditEntries) {
  const codePoints = formatCodePoints(auditEntry.text);
  const normalizedResults = normalizationForms.map(([label, form]) => ({
    isNormalized: Normaliz.IsNormalizedString(form, createWideBuffer(auditEntry.text).ptr!, -1) !== 0,
    label,
    result: normalizeText(auditEntry.text, form),
  }));
  const nameprepResult = convertWithSizingCall(auditEntry.text, (sourceBuffer, outputBuffer, outputLength) => Normaliz.IdnToNameprepUnicode(0, sourceBuffer, -1, outputBuffer, outputLength));
  const asciiResult = convertWithSizingCall(auditEntry.text, (sourceBuffer, outputBuffer, outputLength) => Normaliz.IdnToAscii(0, sourceBuffer, -1, outputBuffer, outputLength));
  const unicodeRoundTripResult =
    asciiResult.text === '(failed)'
      ? { requiredLength: 0, text: '(failed)', writtenLength: 0 }
      : convertWithSizingCall(asciiResult.text, (sourceBuffer, outputBuffer, outputLength) => Normaliz.IdnToUnicode(0, sourceBuffer, -1, outputBuffer, outputLength));

  console.log(`${ANSI.bold}${auditEntry.label}${ANSI.reset}`);
  printField('Source', auditEntry.text);
  printField('UTF-16 units', String(auditEntry.text.length));
  printField('Code points', codePoints);

  for (const normalizedResult of normalizedResults) {
    const indicator = normalizedResult.isNormalized ? `${ANSI.green}yes${ANSI.reset}` : `${ANSI.yellow}no${ANSI.reset}`;
    printField(normalizedResult.label, `${normalizedResult.result.text} ${ANSI.dim}(sizing=${normalizedResult.result.requiredLength}, written=${normalizedResult.result.writtenLength}, normalized=${indicator}${ANSI.dim})${ANSI.reset}`);
  }

  printField('Nameprep', `${nameprepResult.text} ${ANSI.dim}(sizing=${nameprepResult.requiredLength}, written=${nameprepResult.writtenLength})${ANSI.reset}`);
  printField('ASCII', `${asciiResult.text} ${ANSI.dim}(sizing=${asciiResult.requiredLength}, written=${asciiResult.writtenLength})${ANSI.reset}`);
  printField('Unicode', `${unicodeRoundTripResult.text} ${ANSI.dim}(sizing=${unicodeRoundTripResult.requiredLength}, written=${unicodeRoundTripResult.writtenLength})${ANSI.reset}`);
  console.log('');
}

function createWideBuffer(text: string): Buffer {
  return Buffer.from(`${text}\0`, 'utf16le');
}

function normalizeText(text: string, normalizationForm: NormalizationForm): { requiredLength: number; text: string; writtenLength: number } {
  return convertWithSizingCall(text, (sourceBuffer, outputBuffer, outputLength) => Normaliz.NormalizeString(normalizationForm, sourceBuffer, -1, outputBuffer, outputLength));
}

function convertWithSizingCall(
  text: string,
  invoke: (sourceBuffer: NonNullable<Buffer['ptr']>, outputBuffer: NonNullable<Buffer['ptr']> | null, outputLength: number) => number,
): { requiredLength: number; text: string; writtenLength: number } {
  const sourceBuffer = createWideBuffer(text);
  const requiredLength = invoke(sourceBuffer.ptr!, null, 0);

  if (requiredLength <= 0) {
    return {
      requiredLength,
      text: `${ANSI.red}(failed)${ANSI.reset}`,
      writtenLength: requiredLength,
    };
  }

  const outputBuffer = Buffer.alloc(requiredLength * 2);
  const writtenLength = invoke(sourceBuffer.ptr!, outputBuffer.ptr!, requiredLength);

  if (writtenLength <= 0) {
    return {
      requiredLength,
      text: `${ANSI.red}(failed)${ANSI.reset}`,
      writtenLength,
    };
  }

  return {
    requiredLength,
    text: outputBuffer.toString('utf16le').replace(/\0.*$/, ''),
    writtenLength,
  };
}

function formatCodePoints(text: string): string {
  return Array.from(text)
    .map((character) => `U+${character.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0')}`)
    .join(' ');
}

function printField(label: string, value: string): void {
  console.log(`  ${ANSI.dim}${label.padEnd(12)}${ANSI.reset} ${value}`);
}
