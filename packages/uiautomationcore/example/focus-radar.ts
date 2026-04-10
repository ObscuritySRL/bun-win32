/**
 * Focus Radar
 *
 * Samples the current foreground window for a few seconds, resolves its UI
 * Automation node, and renders a compact ANSI dashboard that shows how often
 * the active focus target exposes a server-side provider and a resolvable UIA
 * node.
 *
 * APIs demonstrated:
 *   - UiaClientsAreListening (check whether UIA clients are listening)
 *   - UiaHasServerSideProvider (probe provider exposure for the foreground window)
 *   - UiaNodeFromHandle (resolve a UIA node handle from the foreground HWND)
 *   - UiaNodeRelease (release the resolved node handle)
 *   - GetForegroundWindow (read the current foreground window)
 *   - GetWindowTextW (read the foreground window title)
 *   - GetClassNameW (read the foreground window class name)
 *
 * Run: bun run example:focus-radar
 */

import User32 from '@bun-win32/user32';

import UIAutomationCore from '../index';

const ANSI = {
  bold: '\x1b[1m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  hideCursor: '\x1b[?25l',
  home: '\x1b[H',
  red: '\x1b[31m',
  reset: '\x1b[0m',
  showCursor: '\x1b[?25h',
  yellow: '\x1b[33m',
} as const;

const frameCount = 36;
const frameDelayMilliseconds = 120;
const sampleWindow = 30;
const spinnerFrames = ['|', '/', '-', '\\'] as const;
const wideCharacterBytes = 2;

interface FocusSample {
  className: string;
  nodeResolved: boolean;
  nodeResult: number;
  serverSideProvider: boolean;
  title: string;
  windowHandle: bigint;
}

User32.Preload(['GetClassNameW', 'GetForegroundWindow', 'GetWindowTextW']);
UIAutomationCore.Preload(['UiaClientsAreListening', 'UiaHasServerSideProvider', 'UiaNodeFromHandle', 'UiaNodeRelease']);

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

function renderHistory(focusSamples: FocusSample[]): string {
  return focusSamples
    .map((focusSample) => {
      if (focusSample.nodeResolved && focusSample.serverSideProvider) {
        return `${ANSI.green}#${ANSI.reset}`;
      }

      if (focusSample.nodeResolved) {
        return `${ANSI.yellow}+${ANSI.reset}`;
      }

      if (focusSample.windowHandle !== 0n) {
        return `${ANSI.red}.${ANSI.reset}`;
      }

      return `${ANSI.dim}.${ANSI.reset}`;
    })
    .join('');
}

function takeFocusSample(): FocusSample {
  const windowHandle = User32.GetForegroundWindow();

  if (windowHandle === 0n) {
    return {
      className: '(no foreground window)',
      nodeResolved: false,
      nodeResult: 0,
      serverSideProvider: false,
      title: '(no foreground window)',
      windowHandle,
    };
  }

  const nodeHandleBuffer = Buffer.alloc(8);
  const nodeResult = UIAutomationCore.UiaNodeFromHandle(windowHandle, nodeHandleBuffer.ptr!);
  const nodeHandle = nodeResult === 0 ? nodeHandleBuffer.readBigUInt64LE(0) : 0n;
  const nodeResolved = nodeResult === 0 && nodeHandle !== 0n;

  if (nodeHandle !== 0n) {
    void UIAutomationCore.UiaNodeRelease(nodeHandle);
  }

  return {
    className: readWindowClassName(windowHandle),
    nodeResolved,
    nodeResult,
    serverSideProvider: UIAutomationCore.UiaHasServerSideProvider(windowHandle) !== 0,
    title: readWindowTitle(windowHandle),
    windowHandle,
  };
}

const focusSamples: FocusSample[] = [];
let resolvedCount = 0;
let serverSideProviderCount = 0;

process.stdout.write('\x1b[2J');
process.stdout.write(ANSI.hideCursor);

try {
  for (let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
    const focusSample = takeFocusSample();
    focusSamples.push(focusSample);

    if (focusSamples.length > sampleWindow) {
      focusSamples.shift();
    }

    if (focusSample.nodeResolved) {
      resolvedCount += 1;
    }

    if (focusSample.serverSideProvider) {
      serverSideProviderCount += 1;
    }

    const clientsListening = UIAutomationCore.UiaClientsAreListening() !== 0;
    const spinnerFrame = spinnerFrames[frameIndex % spinnerFrames.length];

    process.stdout.write('\x1b[2J');
    process.stdout.write(ANSI.home);
    process.stdout.write(`${ANSI.bold}${ANSI.cyan}UIAutomation Focus Radar ${spinnerFrame}${ANSI.reset}\n`);
    process.stdout.write(`${ANSI.dim}Sampling the active foreground window with uiautomationcore.dll${ANSI.reset}\n\n`);
    process.stdout.write(`Clients listening:      ${clientsListening ? `${ANSI.green}yes${ANSI.reset}` : `${ANSI.red}no${ANSI.reset}`}\n`);
    process.stdout.write(`Foreground window:      ${focusSample.windowHandle === 0n ? '(none)' : formatHandle(focusSample.windowHandle)}\n`);
    process.stdout.write(`Current title:          ${focusSample.title}\n`);
    process.stdout.write(`Current class:          ${focusSample.className}\n`);
    process.stdout.write(`Node resolution:        ${focusSample.nodeResolved ? `${ANSI.green}ok${ANSI.reset}` : `${ANSI.red}failed${ANSI.reset}`} (${formatHResult(focusSample.nodeResult)})\n`);
    process.stdout.write(`Server-side provider:   ${focusSample.serverSideProvider ? `${ANSI.green}present${ANSI.reset}` : `${ANSI.yellow}absent${ANSI.reset}`}\n\n`);
    process.stdout.write(`${ANSI.bold}History${ANSI.reset}\n`);
    process.stdout.write(`${renderHistory(focusSamples)}\n`);
    process.stdout.write(`${ANSI.dim}Legend: # node + provider, + node only, . no node${ANSI.reset}\n\n`);
    process.stdout.write(`${ANSI.bold}Totals${ANSI.reset}\n`);
    process.stdout.write(`Resolved nodes:         ${resolvedCount}/${frameIndex + 1}\n`);
    process.stdout.write(`Provider-positive:      ${serverSideProviderCount}/${frameIndex + 1}\n`);

    await Bun.sleep(frameDelayMilliseconds);
  }
} finally {
  process.stdout.write(`${ANSI.reset}${ANSI.showCursor}\n`);
}
