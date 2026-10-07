// The indexer thread. It owns its own COM apartment, D3D11 device, OCR engine and UI Automation client, so reading a
// window (tens to hundreds of milliseconds of WinRT and cross-process COM) never costs the render thread a frame.

import Combase from '@bun-win32/combase';

import { AccessibilityReader, type WindowFrame } from './accessibility';
import { createDevice } from './device';
import { OcrReader } from './ocr';
import type { IndexedText } from './search';

declare const self: Worker;

export interface IndexJob {
  frame: WindowFrame;
  hwnd: string;
  minimized: boolean;
}

export interface IndexReply {
  entries: IndexedText[] | null;
  hwnd: string;
  milliseconds: number;
  source: 'accessibility' | 'mixed' | 'none' | 'ocr';
}

Combase.RoInitialize(1);
let ocr: OcrReader | null = null;
let accessibility: AccessibilityReader | null = null;
try {
  ocr = new OcrReader(createDevice());
} catch (error) {
  console.warn(`[iris] OCR unavailable: ${error instanceof Error ? error.message : String(error)}`);
}
try {
  accessibility = new AccessibilityReader();
} catch (error) {
  console.warn(`[iris] UI Automation unavailable: ${error instanceof Error ? error.message : String(error)}`);
}

self.onmessage = async (event: MessageEvent<IndexJob>) => {
  const job = event.data;
  const hwnd = BigInt(job.hwnd);
  const started = performance.now();
  let entries: IndexedText[] | null = null;
  let source: IndexReply['source'] = 'none';
  try {
    if (ocr !== null) {
      entries = await ocr.read(hwnd);
      if (entries !== null) source = 'ocr';
    }
    if ((entries === null || entries.length < 4) && accessibility !== null) {
      const read = accessibility.read(hwnd, job.minimized ? null : job.frame);
      if (read.length > 0) {
        entries = [...(entries ?? []), ...read];
        source = source === 'ocr' ? 'mixed' : 'accessibility';
      }
    }
  } catch (error) {
    console.warn(`[iris] reading ${job.hwnd} failed: ${error instanceof Error ? error.message : String(error)}`);
  }
  const reply: IndexReply = { entries, hwnd: job.hwnd, milliseconds: performance.now() - started, source };
  self.postMessage(reply);
};
