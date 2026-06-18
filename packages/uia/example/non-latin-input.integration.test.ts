/**
 * non-latin-input — non-Latin / IME / astral (surrogate-pair) text was an UNPROVEN, UNDOCUMENTED tier-1 diversity axis:
 * every cursor-free input path (WM_SETTEXT, WM_CHAR-per-code-unit, ValuePattern) already carried Unicode end-to-end, but
 * NOTHING exercised a single CJK / Korean / accented / emoji character — so a future for..of/code-point refactor of
 * postText (input.ts:382-384) would silently truncate every astral char with no test to catch it. This PINS all three
 * paths against that regression across a Japanese / Korean / European / astral-emoji sample.
 *
 * Proof: a synthetic #32770 parent + classic 'Edit' child, pumped on a setInterval, round-trips each sample back through
 * WM_GETTEXT after (a) setControlText (WM_SETTEXT), (b) postText (WM_CHAR per UTF-16 unit), and (c) Element.setValue
 * (ValuePattern) resolved via find({ controlType: ControlType.Edit }). DestroyWindow both in finally.
 *
 * bun test is broken repo-wide — runnable harness:
 * Run: bun run example/non-latin-input.integration.test.ts
 */
import Kernel32 from '@bun-win32/kernel32';
import User32 from '@bun-win32/user32';
import { ControlType } from '../com/constants';
import { fromHandle } from '../element/element';
import { postText, setControlText } from '../input/input';

const WS_OVERLAPPEDWINDOW = 0x00cf_0000;
const WS_VISIBLE = 0x1000_0000;
const WS_CHILD = 0x4000_0000;
const WS_BORDER = 0x0080_0000;
const PM_REMOVE = 0x0001;
const WM_GETTEXT = 0x000d;
const WM_SETTEXT = 0x000c;
const SAMPLES: Readonly<Record<string, string>> = { accented: 'café résumé Ünïcödé', astral: 'A🎉B𝕏C', japanese: 'こんにちは世界', korean: '안녕하세요' };
const wide = (text: string): Buffer => Buffer.from(`${text}\0`, 'utf16le');
const pumpMsg = Buffer.alloc(48);
const pump = (): void => {
  for (let i = 0; i < 200; i += 1) {
    if (User32.PeekMessageW(pumpMsg.ptr!, 0n, 0, 0, PM_REMOVE) === 0) break;
    User32.TranslateMessage(pumpMsg.ptr!);
    User32.DispatchMessageW(pumpMsg.ptr!);
  }
};
const readControlText = (hWnd: bigint): string => {
  const buffer = Buffer.alloc(1024);
  const units = Number(User32.SendMessageW(hWnd, WM_GETTEXT, BigInt(buffer.length / 2), BigInt(buffer.ptr!)));
  return buffer.toString('utf16le', 0, units * 2);
};
const clearControl = (hWnd: bigint): void => void User32.SendMessageW(hWnd, WM_SETTEXT, 0n, BigInt(wide('').ptr!));

let failures = 0;
function assert(condition: boolean, message: string): void {
  if (condition) console.log(`  ok: ${message}`);
  else {
    console.error(`  FAIL: ${message}`);
    failures += 1;
  }
}

const hInstance = Kernel32.GetModuleHandleW(null);
const parent = User32.CreateWindowExW(0, wide('#32770').ptr!, wide('uia-nonlatin-parent').ptr!, WS_OVERLAPPEDWINDOW | WS_VISIBLE, 100, 100, 360, 160, 0n, 0n, BigInt(hInstance), null);
const edit = parent === 0n ? 0n : User32.CreateWindowExW(0, wide('Edit').ptr!, null, WS_CHILD | WS_VISIBLE | WS_BORDER, 10, 10, 320, 28, parent, 0n, BigInt(hInstance), null);
pump();
const ticker = setInterval(pump, 5); // keep the synthetic window pumping so WM_SETTEXT / WM_CHAR / SetValue land

try {
  if (parent === 0n || edit === 0n) console.log('  skip: could not create the #32770 + Edit pair');
  else {
    for (const [label, sample] of Object.entries(SAMPLES)) {
      clearControl(edit);
      pump();
      assert(setControlText(edit, sample), `setControlText(${label}) returned true`);
      pump();
      assert(readControlText(edit) === sample, `WM_SETTEXT round-trips ${label}: ${JSON.stringify(sample)}`);

      clearControl(edit);
      pump();
      assert(postText(edit, sample), `postText(${label}) returned true`);
      pump();
      assert(readControlText(edit) === sample, `WM_CHAR per-UTF-16-unit round-trips ${label}: ${JSON.stringify(sample)} (astral surrogate halves intact)`);
    }

    const host = fromHandle(edit);
    const element = host.find({ controlType: ControlType.Edit }) ?? host;
    try {
      for (const label of ['japanese', 'astral'] as const) {
        const sample = SAMPLES[label]!;
        clearControl(edit);
        pump();
        element.setValue(sample);
        pump();
        assert(readControlText(edit) === sample, `ValuePattern (Element.setValue) round-trips ${label}: ${JSON.stringify(sample)}`);
      }
    } finally {
      if (element !== host) element.release();
      host.release();
    }
  }
} finally {
  clearInterval(ticker);
  if (edit !== 0n) User32.DestroyWindow(edit);
  if (parent !== 0n) User32.DestroyWindow(parent);
}

console.log(failures === 0 ? '\nPASS — non-Latin / CJK / Korean / accented / astral-emoji text round-trips cursor-free through WM_SETTEXT, WM_CHAR, and ValuePattern.' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
