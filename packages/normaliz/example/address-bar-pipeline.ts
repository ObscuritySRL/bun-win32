/**
 * Address Bar Pipeline
 *
 * Feeds representative internationalized hostnames through a browser-style
 * intake path. The report makes each stage visible: canonical composition,
 * Nameprep, ASCII/Punycode conversion, and Unicode round-trip.
 *
 * APIs demonstrated:
 *   - NormalizeString (compose raw address bar input to NFC)
 *   - IsNormalizedString (flag hosts that already arrive normalized)
 *   - IdnToNameprepUnicode (apply IDN mapping before ASCII conversion)
 *   - IdnToAscii (convert Unicode hostnames to ASCII/Punycode)
 *   - IdnToUnicode (round-trip ASCII labels back to Unicode)
 *
 * Run: bun run example/address-bar-pipeline.ts
 */

import Normaliz, { NormalizationForm } from '../index';

const TERMINAL = {
  blue: '\x1b[94m',
  bold: '\x1b[1m',
  cyan: '\x1b[96m',
  dim: '\x1b[2m',
  green: '\x1b[92m',
  magenta: '\x1b[95m',
  red: '\x1b[91m',
  reset: '\x1b[0m',
  yellow: '\x1b[93m',
} as const;

interface AddressBarSample {
  caption: string;
  host: string;
}

type TransformState = 'failed' | 'skipped' | 'success';

interface TransformResult {
  state: TransformState;
  text: string;
  writtenLength: number;
}

const addressBarSamples = [
  { caption: 'decomposed accent + mixed case', host: 'Cafe\u0301.Example' },
  { caption: 'uppercase umlaut label', host: 'B\u00dcCHER.Example' },
  { caption: 'mixed-case Spanish label', host: 'ma\u00f1ana.Example' },
  { caption: 'Greek uppercase second label', host: '\u03a0\u03b1\u03c1\u03ac\u03b4\u03b5\u03b9\u03b3\u03bc\u03b1.\u0394\u039f\u039a\u0399\u039c\u0389' },
  { caption: 'CJK labels already stable', host: '\u4f8b\u5b50.\u6d4b\u8bd5' },
] as const satisfies readonly AddressBarSample[];

Normaliz.Preload(['IdnToAscii', 'IdnToNameprepUnicode', 'IdnToUnicode', 'IsNormalizedString', 'NormalizeString']);

printHeader();

for (const [sampleIndex, addressBarSample] of addressBarSamples.entries()) {
  const alreadyNormalized = isNormalized(addressBarSample.host);
  const normalizedResult = normalizeText(addressBarSample.host);
  const nameprepResult = normalizedResult.state === 'success' ? nameprepText(normalizedResult.text) : createSkippedResult();
  const asciiResult = nameprepResult.state === 'success' ? convertIdnToAscii(nameprepResult.text) : createSkippedResult();
  const unicodeResult = asciiResult.state === 'success' ? convertIdnToUnicode(asciiResult.text) : createSkippedResult();

  console.log(`${TERMINAL.bold}[${String(sampleIndex + 1).padStart(2, '0')}] ${addressBarSample.caption}${TERMINAL.reset}`);
  printStage('raw', addressBarSample.host, alreadyNormalized ? 'already NFC' : 'needs NFC', TERMINAL.yellow);
  printTransition('NormalizeString');
  printStage('normalized', formatResult(normalizedResult), getNormalizedStatus(addressBarSample.host, normalizedResult), TERMINAL.green);
  printTransition('IdnToNameprepUnicode');
  printStage('nameprep', formatResult(nameprepResult), getNameprepStatus(normalizedResult, nameprepResult), TERMINAL.blue);
  printTransition('IdnToAscii');
  printStage('ascii', formatResult(asciiResult), getAsciiStatus(nameprepResult, asciiResult), TERMINAL.magenta);
  printTransition('IdnToUnicode');
  printStage('unicode', formatResult(unicodeResult), getUnicodeStatus(nameprepResult, unicodeResult), TERMINAL.cyan);
  printLengths(addressBarSample.host, normalizedResult, nameprepResult, asciiResult, unicodeResult);
  console.log('');
}

console.log(`${TERMINAL.dim}NormalizeString repairs canonical form before IDN conversion. Nameprep usually lowercases labels.${TERMINAL.reset}`);
console.log(`${TERMINAL.dim}IdnToAscii shows the actual Punycode expansion the address bar path has to carry.${TERMINAL.reset}`);
console.log('');

function createWideBuffer(text: string): Buffer {
  return Buffer.from(`${text}\0`, 'utf16le');
}

function isNormalized(text: string): boolean {
  return Normaliz.IsNormalizedString(NormalizationForm.NormalizationC, createWideBuffer(text).ptr!, -1) !== 0;
}

function normalizeText(text: string): TransformResult {
  return convertWithSizingCall(text, (sourceBuffer, outputBuffer, outputLength) =>
    Normaliz.NormalizeString(NormalizationForm.NormalizationC, sourceBuffer, -1, outputBuffer, outputLength),
  );
}

function nameprepText(text: string): TransformResult {
  return convertWithSizingCall(text, (sourceBuffer, outputBuffer, outputLength) =>
    Normaliz.IdnToNameprepUnicode(0, sourceBuffer, -1, outputBuffer, outputLength),
  );
}

function convertIdnToAscii(text: string): TransformResult {
  return convertWithSizingCall(text, (sourceBuffer, outputBuffer, outputLength) => Normaliz.IdnToAscii(0, sourceBuffer, -1, outputBuffer, outputLength));
}

function convertIdnToUnicode(text: string): TransformResult {
  return convertWithSizingCall(text, (sourceBuffer, outputBuffer, outputLength) => Normaliz.IdnToUnicode(0, sourceBuffer, -1, outputBuffer, outputLength));
}

function convertWithSizingCall(
  text: string,
  invoke: (sourceBuffer: NonNullable<Buffer['ptr']>, outputBuffer: NonNullable<Buffer['ptr']> | null, outputLength: number) => number,
): TransformResult {
  const sourceBuffer = createWideBuffer(text);
  const requiredLength = invoke(sourceBuffer.ptr!, null, 0);

  if (requiredLength <= 0) {
    return {
      state: 'failed',
      text: '',
      writtenLength: requiredLength,
    };
  }

  const outputBuffer = Buffer.alloc(requiredLength * 2);
  const writtenLength = invoke(sourceBuffer.ptr!, outputBuffer.ptr!, requiredLength);

  if (writtenLength <= 0) {
    return {
      state: 'failed',
      text: '',
      writtenLength,
    };
  }

  return {
    state: 'success',
    text: outputBuffer.toString('utf16le').replace(/\0.*$/, ''),
    writtenLength,
  };
}

function createSkippedResult(): TransformResult {
  return {
    state: 'skipped',
    text: '',
    writtenLength: 0,
  };
}

function formatResult(transformResult: TransformResult): string {
  if (transformResult.state === 'failed') {
    return `${TERMINAL.red}(failed)${TERMINAL.reset}`;
  }

  if (transformResult.state === 'skipped') {
    return `${TERMINAL.dim}(skipped)${TERMINAL.reset}`;
  }

  return transformResult.text;
}

function getNormalizedStatus(sourceText: string, transformResult: TransformResult): string {
  if (transformResult.state === 'failed') {
    return `${TERMINAL.red}failed${TERMINAL.reset}`;
  }

  if (transformResult.state === 'skipped') {
    return `${TERMINAL.dim}skipped${TERMINAL.reset}`;
  }

  if (transformResult.text === sourceText) {
    return `${TERMINAL.green}unchanged${TERMINAL.reset}`;
  }

  return `${TERMINAL.green}composed to NFC${TERMINAL.reset}`;
}

function getNameprepStatus(normalizedResult: TransformResult, transformResult: TransformResult): string {
  if (transformResult.state === 'failed') {
    return `${TERMINAL.red}failed${TERMINAL.reset}`;
  }

  if (transformResult.state === 'skipped') {
    return `${TERMINAL.dim}skipped${TERMINAL.reset}`;
  }

  if (normalizedResult.state !== 'success' || transformResult.text === normalizedResult.text) {
    return `${TERMINAL.green}unchanged${TERMINAL.reset}`;
  }

  return `${TERMINAL.green}mapped for IDN rules${TERMINAL.reset}`;
}

function getAsciiStatus(nameprepResult: TransformResult, transformResult: TransformResult): string {
  if (transformResult.state === 'failed') {
    return `${TERMINAL.red}failed${TERMINAL.reset}`;
  }

  if (transformResult.state === 'skipped') {
    return `${TERMINAL.dim}skipped${TERMINAL.reset}`;
  }

  if (nameprepResult.state !== 'success' || transformResult.text === nameprepResult.text) {
    return `${TERMINAL.green}already ASCII${TERMINAL.reset}`;
  }

  const expansion = transformResult.text.length - nameprepResult.text.length;
  return `${TERMINAL.green}punycode ${expansion >= 0 ? '+' : ''}${expansion} UTF-16 units${TERMINAL.reset}`;
}

function getUnicodeStatus(nameprepResult: TransformResult, transformResult: TransformResult): string {
  if (transformResult.state === 'failed') {
    return `${TERMINAL.red}failed${TERMINAL.reset}`;
  }

  if (transformResult.state === 'skipped') {
    return `${TERMINAL.dim}skipped${TERMINAL.reset}`;
  }

  if (nameprepResult.state === 'success' && transformResult.text === nameprepResult.text) {
    return `${TERMINAL.green}round-trip stable${TERMINAL.reset}`;
  }

  return `${TERMINAL.red}round-trip drift${TERMINAL.reset}`;
}

function printHeader(): void {
  console.log('');
  console.log(`${TERMINAL.cyan}${'═'.repeat(88)}${TERMINAL.reset}`);
  console.log(`${TERMINAL.bold}${TERMINAL.cyan}Address Bar Pipeline${TERMINAL.reset}`);
  console.log(`${TERMINAL.dim}raw host -> NormalizeString -> IdnToNameprepUnicode -> IdnToAscii -> IdnToUnicode${TERMINAL.reset}`);
  console.log(`${TERMINAL.cyan}${'═'.repeat(88)}${TERMINAL.reset}`);
  console.log('');
}

function printStage(label: string, value: string, status: string, color: string): void {
  console.log(`  ${color}${label.padEnd(10)}${TERMINAL.reset} ${value} ${TERMINAL.dim}[${TERMINAL.reset}${status}${TERMINAL.dim}]${TERMINAL.reset}`);
}

function printTransition(apiName: string): void {
  console.log(`  ${TERMINAL.dim}  │ ${apiName}${TERMINAL.reset}`);
}

function printLengths(
  sourceText: string,
  normalizedResult: TransformResult,
  nameprepResult: TransformResult,
  asciiResult: TransformResult,
  unicodeResult: TransformResult,
): void {
  const stages = [
    `raw=${sourceText.length}`,
    `normalized=${getLengthLabel(normalizedResult)}`,
    `nameprep=${getLengthLabel(nameprepResult)}`,
    `ascii=${getLengthLabel(asciiResult)}`,
    `unicode=${getLengthLabel(unicodeResult)}`,
  ];

  console.log(`  ${TERMINAL.dim}lengths   ${stages.join(' -> ')}${TERMINAL.reset}`);
}

function getLengthLabel(transformResult: TransformResult): string {
  if (transformResult.state !== 'success') {
    return '-';
  }

  return String(transformResult.text.length);
}
