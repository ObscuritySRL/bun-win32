/**
 * UI Automation — drive ANOTHER GUI app from TypeScript
 *
 * This launches Windows Calculator, attaches Microsoft UI Automation to its live
 * window, walks the actual on-screen control tree (every element's control type
 * and accessible name), renders it as a colored ANSI tree, and then — the part you
 * "cannot do in TypeScript" — physically CLICKS Calculator's buttons to compute
 * 5 + 3 = 8 on screen, by invoking each button's UIA InvokePattern. Finally it
 * also dumps the control tree of whatever window currently has focus.
 *
 * Nothing shells out to UIAutomation PowerShell modules or AutoIt; the whole thing
 * is hand-walked COM vtable FFI into the in-process UI Automation client object
 * (CLSID_CUIAutomation) loaded out of combase/uiautomationcore.
 *
 * Native pipeline:
 *   - combase.dll CoInitializeEx(APARTMENTTHREADED) / CoCreateInstance / CLSIDFromString  (raw FFI)
 *   - Bun.spawn(start calc) + User32.FindWindowW / GetForegroundWindow                     (target HWNDs)
 *   - IUIAutomation::ElementFromHandle(hwnd) -> root element                               (slot 7)
 *   - IUIAutomation::CreateTrueCondition -> match-everything condition                     (slot 21)
 *   - IUIAutomationElement::FindAll(TreeScope_Descendants, cond) -> element array          (slot 6)
 *   - IUIAutomationElementArray::get_Length / GetElement                                   (slots 3 / 4)
 *   - IUIAutomationElement::get_CurrentControlType / get_CurrentName                       (slots 21 / 23)
 *   - IUIAutomationElement::GetCurrentPattern(UIA_InvokePatternId) -> IUIAutomationInvokePattern (slot 16)
 *   - IUIAutomationInvokePattern::Invoke()  <-- actually presses the button               (slot 3)
 *   - Oleaut32.SysStringLen / SysFreeString                                               (BSTR names)
 *   - Kernel32.GetStdHandle / Get|SetConsoleMode                                          (enable ANSI VT)
 *
 * We deliberately AVOID CreatePropertyCondition (its by-value VARIANT argument
 * segfaults across this FFI boundary). Instead we CreateTrueCondition + FindAll
 * over all descendants and filter by control type / name in TypeScript.
 *
 * Graceful degradation: if Calculator can't be launched/found (e.g. a locked-down
 * box) or the UIA object can't be created, it prints a friendly note and exits 0.
 *
 * Run: bun run example/uia-automation.ts
 *      DEMO_DURATION_MS=8000 bun run example/uia-automation.ts   (caps total runtime)
 */

import { CFunction, dlopen, FFIType, type Pointer, read } from 'bun:ffi';

import { User32 } from '../index';
import Kernel32 from '@bun-win32/kernel32';
import Oleaut32 from '@bun-win32/oleaut32';
import type { BSTR } from '@bun-win32/oleaut32';

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const CYAN = '\x1b[96m';
const GREEN = '\x1b[92m';
const YELLOW = '\x1b[93m';
const RED = '\x1b[91m';
const MAGENTA = '\x1b[95m';
const BLUE = '\x1b[94m';

const S_OK = 0;
const S_FALSE = 1;
const COINIT_APARTMENTTHREADED = 0x2;
const CLSCTX_INPROC_SERVER = 0x1;

// ---- COM object identities (UIAutomationClient.h / uiautomationcore) ----
const CLSID_CUIAutomation = '{FF48DBA4-60EF-4201-AA87-54103EEF594E}';
const IID_IUIAutomation = '{30CBE57D-D9D0-452A-AB13-7AC5AC4825EE}';

// ---- vtable slots (UIAutomationClient.h *Vtbl declarations) ----
const IUNKNOWN_RELEASE = 2;
// IUIAutomation (IUnknown slots 0-2, then its own members)
const IUIA_GETROOTELEMENT = 5;
const IUIA_ELEMENTFROMHANDLE = 7;
const IUIA_CREATETRUECONDITION = 21;
// IUIAutomationElement
const IUIAELEMENT_FINDALL = 6;
const IUIAELEMENT_GETCURRENTPATTERN = 16;
const IUIAELEMENT_GET_CURRENTCONTROLTYPE = 21;
const IUIAELEMENT_GET_CURRENTNAME = 23;
// IUIAutomationElementArray
const IUIAARRAY_GET_LENGTH = 3;
const IUIAARRAY_GETELEMENT = 4;
// IUIAutomationInvokePattern
const IUIAINVOKE_INVOKE = 3;

// ---- UIA pattern / control-type ids (UIAutomationClient.h) ----
const UIA_InvokePatternId = 10000;
const TreeScope_Descendants = 0x4;

// ---- control type ids (UIAutomationCore enum) ----
const CONTROL_TYPE_NAME: Record<number, string> = {
  50000: 'Button',
  50001: 'Calendar',
  50002: 'CheckBox',
  50003: 'ComboBox',
  50004: 'Edit',
  50005: 'Hyperlink',
  50006: 'Image',
  50007: 'ListItem',
  50008: 'List',
  50009: 'Menu',
  50010: 'MenuBar',
  50011: 'MenuItem',
  50012: 'ProgressBar',
  50013: 'RadioButton',
  50014: 'ScrollBar',
  50015: 'Slider',
  50016: 'Spinner',
  50017: 'StatusBar',
  50018: 'Tab',
  50019: 'TabItem',
  50020: 'Text',
  50021: 'ToolBar',
  50022: 'ToolTip',
  50023: 'Tree',
  50024: 'TreeItem',
  50025: 'Custom',
  50026: 'Group',
  50027: 'Thumb',
  50028: 'DataGrid',
  50029: 'DataItem',
  50030: 'Document',
  50031: 'SplitButton',
  50032: 'Window',
  50033: 'Pane',
  50034: 'Header',
  50035: 'HeaderItem',
  50036: 'Table',
  50037: 'TitleBar',
  50038: 'Separator',
};
const CONTROL_TYPE_BUTTON = 50000;

// combase.dll exposes these COM bootstrap entry points directly.
const combase = dlopen('combase.dll', {
  CLSIDFromString: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
  CoCreateInstance: { args: [FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
  CoInitializeEx: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
  CoUninitialize: { args: [], returns: FFIType.void },
});

/** Enable ANSI escape processing so colors render in Windows Terminal / VS Code. */
function enableVirtualTerminal(): void {
  const STD_OUTPUT_HANDLE = 0xffff_fff5;
  const ENABLE_VIRTUAL_TERMINAL_PROCESSING = 0x0004;
  const handle = Kernel32.GetStdHandle(STD_OUTPUT_HANDLE);
  const mode = Buffer.alloc(4);
  if (Kernel32.GetConsoleMode(handle, mode.ptr!)) {
    Kernel32.SetConsoleMode(handle, mode.readUInt32LE(0) | ENABLE_VIRTUAL_TERMINAL_PROCESSING);
  }
}

const invokers = new Map<string, ReturnType<typeof CFunction>>();

/**
 * Invokes COM vtable slot `slot` on interface pointer `thisPtr`. The implicit
 * `this` is prepended; the bound CFunction is memoized per (method, signature).
 */
function vcall(thisPtr: bigint, slot: number, argTypes: readonly FFIType[], args: readonly unknown[]): number {
  const vtable = read.u64(Number(thisPtr) as Pointer, 0);
  const method = read.u64(Number(vtable) as Pointer, slot * 8);
  const key = `${method}|${argTypes.join(',')}`;
  let invoke = invokers.get(key);
  if (invoke === undefined) {
    invoke = CFunction({ ptr: Number(method) as Pointer, args: [FFIType.u64, ...argTypes], returns: FFIType.i32 });
    invokers.set(key, invoke);
  }
  return invoke(thisPtr, ...args) as number;
}

/** Releases a COM interface pointer (IUnknown::Release, vtable slot 2). */
function release(pUnk: bigint): void {
  if (pUnk !== 0n) vcall(pUnk, IUNKNOWN_RELEASE, [], []);
}

/** Parses a `{...}` GUID string into a 16-byte CLSID/IID buffer. */
function guid(text: string): Buffer {
  const wide = Buffer.from(text + '\0', 'utf16le');
  const out = Buffer.alloc(16);
  const hr = combase.symbols.CLSIDFromString(wide.ptr!, out.ptr!);
  if (hr !== S_OK) throw new Error(`CLSIDFromString(${text}) failed: 0x${(hr >>> 0).toString(16)}`);
  return out;
}

/** Reads a `[propget] BSTR*` accessor at `slot` and frees the BSTR. */
function getBstr(pObj: bigint, slot: number): string {
  const out = Buffer.alloc(8);
  if (vcall(pObj, slot, [FFIType.ptr], [out.ptr!]) !== S_OK) return '';
  const bstr = out.readBigUInt64LE(0);
  if (bstr === 0n) return '';
  const ptr = Number(bstr) as Pointer;
  const len = Oleaut32.SysStringLen(ptr as unknown as BSTR); // characters
  const bytes = Buffer.alloc(len * 2);
  for (let i = 0; i < len * 2; i += 1) bytes[i] = read.u8(ptr, i);
  Oleaut32.SysFreeString(ptr as unknown as BSTR);
  return bytes.toString('utf16le');
}

/** Reads a `[propget] CONTROLTYPEID*` (LONG) accessor at `slot`. */
function getLong(pObj: bigint, slot: number): number {
  const out = Buffer.alloc(4);
  if (vcall(pObj, slot, [FFIType.ptr], [out.ptr!]) !== S_OK) return 0;
  return out.readInt32LE(0);
}

interface UiaElement {
  controlType: number;
  name: string;
}

/** A live UIA element ptr plus its scraped properties, owned until released. */
interface OwnedElement extends UiaElement {
  ptr: bigint;
}

const hex = (n: number): string => `0x${(n >>> 0).toString(16).padStart(8, '0')}`;
const ctName = (id: number): string => CONTROL_TYPE_NAME[id] ?? `Type(${id})`;

function colorForType(id: number): string {
  if (id === CONTROL_TYPE_BUTTON) return CYAN;
  if (id === 50004) return GREEN; // Edit
  if (id === 50020) return YELLOW; // Text
  if (id === 50032 || id === 50033) return MAGENTA; // Window / Pane
  return DIM;
}

const bar = (label: string) => `${BOLD}${BLUE}══${RESET} ${BOLD}${label}${RESET}`;

/**
 * Walks the descendant control tree of `pRoot` via FindAll(TreeScope_Descendants)
 * and returns each element's ptr+controlType+name. Caller must release every ptr.
 * Returns null if FindAll failed.
 */
function walkTree(pUia: bigint, pRoot: bigint): OwnedElement[] | null {
  const condOut = Buffer.alloc(8);
  if (vcall(pUia, IUIA_CREATETRUECONDITION, [FFIType.ptr], [condOut.ptr!]) !== S_OK) return null;
  const pTrue = condOut.readBigUInt64LE(0);
  if (pTrue === 0n) return null;

  try {
    const arrOut = Buffer.alloc(8);
    const hr = vcall(pRoot, IUIAELEMENT_FINDALL, [FFIType.i32, FFIType.u64, FFIType.ptr], [TreeScope_Descendants, pTrue, arrOut.ptr!]);
    if (hr !== S_OK) {
      console.log(`  ${RED}IUIAutomationElement::FindAll failed: ${hex(hr)}${RESET}`);
      return null;
    }
    const pArr = arrOut.readBigUInt64LE(0);
    if (pArr === 0n) return [];

    try {
      const len = getLong(pArr, IUIAARRAY_GET_LENGTH);
      const elements: OwnedElement[] = [];
      for (let i = 0; i < len; i += 1) {
        const elemOut = Buffer.alloc(8);
        if (vcall(pArr, IUIAARRAY_GETELEMENT, [FFIType.i32, FFIType.ptr], [i, elemOut.ptr!]) !== S_OK) continue;
        const pElem = elemOut.readBigUInt64LE(0);
        if (pElem === 0n) continue;
        elements.push({
          ptr: pElem,
          controlType: getLong(pElem, IUIAELEMENT_GET_CURRENTCONTROLTYPE),
          name: getBstr(pElem, IUIAELEMENT_GET_CURRENTNAME),
        });
      }
      return elements;
    } finally {
      release(pArr);
    }
  } finally {
    release(pTrue);
  }
}

/** Renders a colored, summarized control tree from scraped elements. */
function renderTree(title: string, elements: OwnedElement[]): void {
  console.log(bar(title));
  console.log(`  ${DIM}walked ${elements.length} descendant element(s)${RESET}\n`);

  const byType = new Map<number, number>();
  for (const e of elements) byType.set(e.controlType, (byType.get(e.controlType) ?? 0) + 1);
  const summary = [...byType.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id, n]) => `${colorForType(id)}${ctName(id)}${RESET} ${BOLD}${n}${RESET}`)
    .join(`${DIM}  ·  ${RESET}`);
  console.log(`  ${summary}\n`);

  // Show named elements (skip the huge run of nameless decorations) up to a cap.
  const named = elements.filter((e) => e.name.trim().length > 0).slice(0, 40);
  for (const e of named) {
    const c = colorForType(e.controlType);
    const tag = `${c}${ctName(e.controlType).padEnd(12)}${RESET}`;
    console.log(`  ${DIM}├─${RESET} ${tag} ${e.name}`);
  }
  if (elements.filter((e) => e.name.trim().length > 0).length > named.length) {
    console.log(`  ${DIM}└─ … and more${RESET}`);
  }
  console.log();
}

/** Finds the first button whose name matches `wanted` (case-insensitive exact). */
function findButton(elements: OwnedElement[], wanted: string): OwnedElement | undefined {
  const lc = wanted.toLowerCase();
  return elements.find((e) => e.controlType === CONTROL_TYPE_BUTTON && e.name.trim().toLowerCase() === lc);
}

/**
 * Physically presses a UIA element by acquiring its InvokePattern (slot 16) and
 * calling Invoke (slot 3). Returns the Invoke HRESULT, or null if no pattern.
 */
function clickElement(pElem: bigint): number | null {
  const patOut = Buffer.alloc(8);
  if (vcall(pElem, IUIAELEMENT_GETCURRENTPATTERN, [FFIType.i32, FFIType.ptr], [UIA_InvokePatternId, patOut.ptr!]) !== S_OK) return null;
  const pPattern = patOut.readBigUInt64LE(0);
  if (pPattern === 0n) return null;
  try {
    return vcall(pPattern, IUIAINVOKE_INVOKE, [], []);
  } finally {
    release(pPattern);
  }
}

function main(): void {
  enableVirtualTerminal();

  const deadline = process.env.DEMO_DURATION_MS ? Date.now() + Number(process.env.DEMO_DURATION_MS) : Number.POSITIVE_INFINITY;

  const init = combase.symbols.CoInitializeEx(null, COINIT_APARTMENTTHREADED);
  if (init !== S_OK && init !== S_FALSE) {
    console.error(`${RED}CoInitializeEx failed: ${hex(init)}${RESET}`);
    process.exit(0);
  }

  console.log(`\n${BOLD}${MAGENTA}  UI AUTOMATION — DRIVING ANOTHER GUI APP${RESET}  ${DIM}combase + uiautomationcore · COM vtable FFI${RESET}\n`);

  let pUia = 0n;
  let calcElements: OwnedElement[] = [];
  let fgElements: OwnedElement[] = [];
  try {
    // ---- Create the in-process UI Automation client object. ----
    const uiaOut = Buffer.alloc(8);
    const hrCreate = combase.symbols.CoCreateInstance(guid(CLSID_CUIAutomation).ptr!, 0n, CLSCTX_INPROC_SERVER, guid(IID_IUIAutomation).ptr!, uiaOut.ptr!);
    if (hrCreate !== S_OK) {
      console.log(`${YELLOW}  UI Automation core could not be instantiated (${hex(hrCreate)}).`);
      console.log(`  This is expected on stripped-down/locked-down systems — exiting cleanly.${RESET}\n`);
      process.exit(0);
    }
    pUia = uiaOut.readBigUInt64LE(0);
    console.log(`  ${GREEN}✓${RESET} CoCreateInstance(CLSID_CUIAutomation) → IUIAutomation @ ${DIM}0x${pUia.toString(16)}${RESET}`);

    // ---- Launch Calculator and locate its top-level window. ----
    console.log(`  ${DIM}launching Calculator…${RESET}`);
    Bun.spawn(['cmd', '/c', 'start', 'calc'], { stdout: 'ignore', stderr: 'ignore' });

    const calcName = Buffer.from('Calculator\0', 'utf16le');
    let hwnd = 0n;
    const findUntil = Math.min(deadline, Date.now() + 6000);
    while (hwnd === 0n && Date.now() < findUntil) {
      Bun.sleepSync(400);
      hwnd = User32.FindWindowW(null, calcName.ptr!);
    }

    if (hwnd === 0n) {
      console.log(`\n${YELLOW}  Could not find a 'Calculator' window — it may be blocked or unavailable.`);
      console.log(`  Skipping the click demo; this is expected on systems without Calculator. Exiting cleanly.${RESET}\n`);
    } else {
      console.log(`  ${GREEN}✓${RESET} User32.FindWindowW('Calculator') → HWND ${BOLD}0x${hwnd.toString(16)}${RESET}\n`);

      // ---- Attach a UIA element to the Calculator HWND and walk its tree. ----
      const elemOut = Buffer.alloc(8);
      const hrElem = vcall(pUia, IUIA_ELEMENTFROMHANDLE, [FFIType.u64, FFIType.ptr], [hwnd, elemOut.ptr!]);
      const pCalc = elemOut.readBigUInt64LE(0);
      if (hrElem !== S_OK || pCalc === 0n) {
        console.log(`${RED}  ElementFromHandle failed: ${hex(hrElem)}${RESET}\n`);
      } else {
        try {
          const walked = walkTree(pUia, pCalc);
          if (walked) {
            calcElements = walked;
            renderTree("Calculator's live control tree", calcElements);

            // ---- Actually CLICK the buttons to compute 5 + 3 = 8. ----
            console.log(bar('Computing 5 + 3 = 8 by invoking buttons'));
            const sequence: ReadonlyArray<readonly [string, string]> = [
              ['Five', '5'],
              ['Plus', '+'],
              ['Three', '3'],
              ['Equals', '='],
            ];
            let allClicked = true;
            for (const [name, glyph] of sequence) {
              if (Date.now() >= deadline) {
                console.log(`  ${YELLOW}DEMO_DURATION_MS reached — stopping click sequence early.${RESET}`);
                break;
              }
              const btn = findButton(calcElements, name);
              if (!btn) {
                console.log(`  ${RED}✗${RESET} button '${name}' not found in the tree`);
                allClicked = false;
                continue;
              }
              const hr = clickElement(btn.ptr);
              if (hr === S_OK) {
                console.log(`  ${GREEN}✓${RESET} pressed ${BOLD}${CYAN}${name}${RESET} ${DIM}(${glyph})${RESET}  Invoke → ${GREEN}S_OK${RESET}`);
              } else {
                console.log(`  ${RED}✗${RESET} Invoke('${name}') → ${hr === null ? 'no InvokePattern' : hex(hr)}`);
                allClicked = false;
              }
              Bun.sleepSync(450); // let the UI update visibly between presses
            }

            if (allClicked) {
              console.log(`\n  ${BOLD}${GREEN}✓ 5 + 3 = 8 has been typed into Calculator from TypeScript.${RESET}`);
              console.log(`  ${DIM}Look at the Calculator window — the display now shows 8.${RESET}\n`);
            } else {
              console.log(`\n  ${YELLOW}Some buttons could not be invoked (Calculator's tree may differ on this build).${RESET}\n`);
            }
          }
        } finally {
          for (const e of calcElements) release(e.ptr);
          calcElements = [];
          release(pCalc);
        }
      }
    }

    // ---- Bonus: dump whatever window currently has focus. ----
    const fgHwnd = User32.GetForegroundWindow();
    if (fgHwnd !== 0n) {
      const titleBuf = Buffer.alloc(512);
      const titleLen = User32.GetWindowTextW(fgHwnd, titleBuf.ptr!, 256);
      const fgTitle = titleLen > 0 ? titleBuf.subarray(0, titleLen * 2).toString('utf16le') : '(untitled)';
      const fgOut = Buffer.alloc(8);
      const hrFg = vcall(pUia, IUIA_ELEMENTFROMHANDLE, [FFIType.u64, FFIType.ptr], [fgHwnd, fgOut.ptr!]);
      const pFg = fgOut.readBigUInt64LE(0);
      if (hrFg === S_OK && pFg !== 0n) {
        try {
          const walked = walkTree(pUia, pFg);
          if (walked) {
            fgElements = walked;
            renderTree(`Foreground window  ${DIM}HWND 0x${fgHwnd.toString(16)}${RESET}${BOLD}  "${fgTitle}"`, fgElements);
          }
        } finally {
          for (const e of fgElements) release(e.ptr);
          fgElements = [];
          release(pFg);
        }
      }
    }

    console.log(`${GREEN}${BOLD}  ✓ UI Automation walkthrough complete${RESET}\n`);
  } catch (err) {
    console.error(`${RED}  Unexpected error: ${err instanceof Error ? err.message : String(err)}${RESET}`);
  } finally {
    for (const e of calcElements) release(e.ptr);
    for (const e of fgElements) release(e.ptr);
    release(pUia);
    combase.symbols.CoUninitialize();
  }
}

main();
