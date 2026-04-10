/**
 * Pattern Probe
 *
 * Resolves the UI Automation node for the current foreground window, looks up
 * several common pattern identifiers from their GUIDs, and prints an aligned
 * report that shows which pattern providers are exposed on the active window.
 *
 * APIs demonstrated:
 *   - UiaClientsAreListening (check for active UIA clients)
 *   - UiaHasServerSideProvider (probe whether the active HWND exposes a provider)
 *   - UiaLookupId (map pattern GUIDs to numeric pattern identifiers)
 *   - UiaGetPatternProvider (request a pattern object from a node handle)
 *   - UiaPatternRelease (release resolved pattern objects)
 *   - UiaNodeFromHandle (resolve a UIA node handle from the foreground HWND)
 *   - UiaNodeRelease (release the resolved node handle)
 *   - GetForegroundWindow (read the active HWND)
 *   - GetWindowTextW (read the active window title)
 *   - GetClassNameW (read the active window class name)
 *
 * Run: bun run example:pattern-probe
 */

import User32 from '@bun-win32/user32';

import UIAutomationCore, { AutomationIdentifierType } from '../index';

const ANSI = {
  bold: '\x1b[1m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
  yellow: '\x1b[33m',
} as const;

const patternCatalog = [
  {
    guidText: 'afea938a-621e-4054-bb2c-2f46114dac3f',
    label: 'CustomNavigation',
  },
  {
    guidText: 'd976c2fc-66ea-4a6e-b28f-c24c7546ad37',
    label: 'Invoke',
  },
  {
    guidText: '8615f05d-7de5-44fd-a679-2ca4b46033a8',
    label: 'Text',
  },
  {
    guidText: '17faad9e-c877-475b-b933-77332779b637',
    label: 'Value',
  },
  {
    guidText: '27901735-c760-4994-ad11-5919e606b110',
    label: 'Window',
  },
] as const;

const wideCharacterBytes = 2;

interface PatternProbeRow {
  guidText: string;
  label: string;
  patternId: number;
  providerPresent: boolean;
  providerResult: number | null;
}

User32.Preload(['GetClassNameW', 'GetForegroundWindow', 'GetWindowTextW']);
UIAutomationCore.Preload(['UiaClientsAreListening', 'UiaGetPatternProvider', 'UiaHasServerSideProvider', 'UiaLookupId', 'UiaNodeFromHandle', 'UiaNodeRelease', 'UiaPatternRelease']);

function createGuidBuffer(guidText: string): Buffer {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(guidText)) {
    throw new Error(`Invalid GUID: ${guidText}`);
  }

  const [dataOneText, dataTwoText, dataThreeText, dataFourAText, dataFourBText] = guidText.split('-');
  const guidBuffer = Buffer.alloc(16);
  const tailText = `${dataFourAText}${dataFourBText}`;

  guidBuffer.writeUInt32LE(Number.parseInt(dataOneText, 16), 0);
  guidBuffer.writeUInt16LE(Number.parseInt(dataTwoText, 16), 4);
  guidBuffer.writeUInt16LE(Number.parseInt(dataThreeText, 16), 6);

  for (let byteIndex = 0; byteIndex < 8; byteIndex += 1) {
    guidBuffer[8 + byteIndex] = Number.parseInt(tailText.slice(byteIndex * 2, byteIndex * 2 + 2), 16);
  }

  return guidBuffer;
}

function formatHandle(value: bigint): string {
  return `0x${value.toString(16).padStart(16, '0')}`;
}

function formatHResult(value: number): string {
  return `0x${(value >>> 0).toString(16).padStart(8, '0')}`;
}

function readWideString(valueBuffer: Buffer, characterCount: number): string {
  if (characterCount <= 0) {
    return '';
  }

  return valueBuffer.toString('utf16le', 0, characterCount * wideCharacterBytes).replace(/\0.*$/, '');
}

function readWindowClassName(windowHandle: bigint): string {
  const classNameBuffer = Buffer.alloc(256 * wideCharacterBytes);
  const characterCount = User32.GetClassNameW(windowHandle, classNameBuffer.ptr!, classNameBuffer.length / wideCharacterBytes);

  if (characterCount <= 0) {
    return '(class unavailable)';
  }

  return readWideString(classNameBuffer, characterCount);
}

function readWindowTitle(windowHandle: bigint): string {
  const titleBuffer = Buffer.alloc(512 * wideCharacterBytes);
  const characterCount = User32.GetWindowTextW(windowHandle, titleBuffer.ptr!, titleBuffer.length / wideCharacterBytes);

  if (characterCount <= 0) {
    return '(untitled window)';
  }

  return readWideString(titleBuffer, characterCount);
}

function truncate(value: string, width: number): string {
  if (value.length <= width) {
    return value.padEnd(width, ' ');
  }

  if (width <= 3) {
    return value.slice(0, width);
  }

  return `${value.slice(0, width - 3)}...`;
}

const windowHandle = User32.GetForegroundWindow();
if (windowHandle === 0n) {
  throw new Error('GetForegroundWindow returned 0');
}

const nodeHandleBuffer = Buffer.alloc(8);
const nodeResult = UIAutomationCore.UiaNodeFromHandle(windowHandle, nodeHandleBuffer.ptr!);
const nodeHandle = nodeResult === 0 ? nodeHandleBuffer.readBigUInt64LE(0) : 0n;
const clientsListening = UIAutomationCore.UiaClientsAreListening() !== 0;
const serverSideProvider = UIAutomationCore.UiaHasServerSideProvider(windowHandle) !== 0;

const patternProbeRows: PatternProbeRow[] = [];

try {
  for (const patternEntry of patternCatalog) {
    const guidBuffer = createGuidBuffer(patternEntry.guidText);
    const patternId = UIAutomationCore.UiaLookupId(AutomationIdentifierType.AutomationIdentifierType_Pattern, guidBuffer.ptr!);
    let providerPresent = false;
    let providerResult: number | null = null;

    if (patternId !== 0 && nodeHandle !== 0n) {
      const patternHandleBuffer = Buffer.alloc(8);
      providerResult = UIAutomationCore.UiaGetPatternProvider(nodeHandle, patternId, patternHandleBuffer.ptr!);
      const patternHandle = patternHandleBuffer.readBigUInt64LE(0);
      providerPresent = providerResult === 0 && patternHandle !== 0n;

      if (patternHandle !== 0n) {
        void UIAutomationCore.UiaPatternRelease(patternHandle);
      }
    }

    patternProbeRows.push({
      guidText: patternEntry.guidText,
      label: patternEntry.label,
      patternId,
      providerPresent,
      providerResult,
    });
  }
} finally {
  if (nodeHandle !== 0n) {
    void UIAutomationCore.UiaNodeRelease(nodeHandle);
  }
}

console.log();
console.log(`${ANSI.bold}${ANSI.cyan}UIAutomation Pattern Probe${ANSI.reset}`);
console.log(`${ANSI.dim}Foreground window inspection through the flat uiautomationcore.dll API${ANSI.reset}`);
console.log();
console.log(`${ANSI.bold}Window${ANSI.reset}`);
console.log(`  Handle:                ${formatHandle(windowHandle)}`);
console.log(`  Title:                 ${readWindowTitle(windowHandle)}`);
console.log(`  Class:                 ${readWindowClassName(windowHandle)}`);
console.log(`  UIA clients listening: ${clientsListening ? `${ANSI.green}yes${ANSI.reset}` : `${ANSI.red}no${ANSI.reset}`}`);
console.log(`  Server-side provider:  ${serverSideProvider ? `${ANSI.green}yes${ANSI.reset}` : `${ANSI.yellow}no${ANSI.reset}`}`);
console.log(`  Node acquisition:      ${nodeHandle !== 0n ? `${ANSI.green}ok${ANSI.reset}` : `${ANSI.red}failed${ANSI.reset}`} (${formatHResult(nodeResult)})`);
console.log();
console.log(`${ANSI.bold}Patterns${ANSI.reset}`);
console.log(`  ${truncate('Pattern', 18)} ${truncate('PatternId', 10)} ${truncate('Provider', 10)} ${truncate('HRESULT', 12)} GUID`);

for (const patternProbeRow of patternProbeRows) {
  const providerText = patternProbeRow.providerPresent ? 'present' : 'absent';
  const providerDisplay = patternProbeRow.providerPresent ? `${ANSI.green}${providerText.padEnd(8, ' ')}${ANSI.reset}` : `${ANSI.dim}${providerText.padEnd(8, ' ')}${ANSI.reset}`;
  const resultText = patternProbeRow.providerResult === null ? 'n/a' : formatHResult(patternProbeRow.providerResult);
  const resultDisplay = patternProbeRow.providerResult === null ? `${ANSI.dim}${resultText.padEnd(12, ' ')}${ANSI.reset}` : resultText.padEnd(12, ' ');
  const identifierText = patternProbeRow.patternId === 0 ? 'missing' : String(patternProbeRow.patternId);
  const identifierDisplay = patternProbeRow.patternId === 0 ? `${ANSI.red}${identifierText.padEnd(10, ' ')}${ANSI.reset}` : identifierText.padEnd(10, ' ');

  console.log(`  ${truncate(patternProbeRow.label, 18)} ${identifierDisplay} ${providerDisplay} ${resultDisplay} ${patternProbeRow.guidText}`);
}

console.log();
