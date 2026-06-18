// Drop-in computer-use adapter: dispatch the literal Anthropic `computer` tool action set (and
// OpenAI CUA's, via fromCuaAction) against Windows — SEMANTIC-FIRST and CURSOR-FREE. A click at (x,y)
// first resolves the UIA element under the point and invoke()s it (no cursor movement, works on a
// locked session); only when no actionable element resolves does it fall back to a cursor-free posted
// click, then finally a real SendInput click. This turns a pixel action into a ground-truth semantic
// one — erasing the coordinate-hallucination, downscaling click-miss, and scroll-no-op failure modes
// that the computer-use literature attributes to screenshot-only grounding.

import { ownerHwnd, postClickAt, postClickToHwnd, postDoubleClickAt, postDragToHwnd, postTripleClickAt, scrollAt } from './coords';
import { focused, fromPoint, type Window } from '../element/element';
import { clickAt, cursorPosition, doubleClickAt, dragTo, holdKey, middleClickAt, mouseDown, mouseUp, moveTo, postHoldKey, postKey, postText, rightClickAt, scrollWheel, sendKeys, type as typeText } from './input';

export interface ComputerAction {
  action: string;
  coordinate?: [number, number];
  startCoordinate?: [number, number];
  text?: string;
  scrollDirection?: 'up' | 'down' | 'left' | 'right';
  scrollAmount?: number;
  duration?: number;
}

export interface ComputerResult {
  ok: boolean;
  output?: string;
  semantic?: { role: string; name: string };
  screenshot?: Uint8Array;
  error?: string;
}

export interface DispatchOptions {
  /** Prefer cursor-free interaction (UIA invoke, then posted messages) over moving the real mouse (default true). */
  cursorless?: boolean;
}

// xdotool / CUA key names → the package's sendKeys vocabulary.
const KEY_ALIASES: Record<string, string> = {
  alt: 'Alt',
  arrowdown: 'Down',
  arrowleft: 'Left',
  arrowright: 'Right',
  arrowup: 'Up',
  cmd: 'Win',
  command: 'Win',
  control: 'Control',
  ctrl: 'Control',
  del: 'Delete',
  esc: 'Escape',
  meta: 'Win',
  option: 'Alt',
  page_down: 'PageDown',
  page_up: 'PageUp',
  pagedown: 'PageDown',
  pageup: 'PageUp',
  return: 'Enter',
  spacebar: 'Space',
  super: 'Win',
};

/** Normalize a key chord (e.g. 'ctrl+a', 'Return', 'super') to the sendKeys form (e.g. 'Control+A'). */
export function normalizeKey(combo: string): string {
  return combo
    .trim()
    .split(/[+\s]+/)
    .filter((part) => part.length > 0)
    .map((part) => KEY_ALIASES[part.toLowerCase()] ?? part)
    .join('+');
}

function semanticClick(x: number, y: number, cursorless: boolean): ComputerResult {
  let resolved: { role: string; name: string } | undefined;
  let owner = 0n;
  try {
    const element = fromPoint(x, y);
    try {
      resolved = { role: element.controlTypeName, name: element.name };
      try {
        element.invoke();
        return { ok: true, semantic: resolved, output: `invoked ${resolved.role} ${JSON.stringify(resolved.name)} (cursor-free)` };
      } catch {
        // no Invoke — try the semantic activations a left-click maps to (cursor-free + verifiable on a no-own-HWND
        // WinUI control, exactly where a posted COORDINATE click is silently dropped — mirrors the MCP click path)
      }
      try {
        element.toggle();
        return { ok: true, semantic: resolved, output: `toggled ${resolved.role} ${JSON.stringify(resolved.name)} (cursor-free, state ${element.toggleState})` };
      } catch {
        // not a TogglePattern control
      }
      try {
        element.select();
        return { ok: true, semantic: resolved, output: `selected ${resolved.role} ${JSON.stringify(resolved.name)} (cursor-free)` };
      } catch {
        // not a SelectionItemPattern control
      }
      owner = ownerHwnd(element); // capture the element's own window for the posted fallback before releasing it
    } finally {
      element.release();
    }
  } catch {
    // no element at the point — pure pixel click
  }
  if (cursorless && (owner !== 0n ? postClickToHwnd(owner, x, y, 'left') : postClickAt(x, y, 'left')))
    return { ok: true, semantic: resolved, output: resolved !== undefined ? `posted click to ${resolved.role} ${JSON.stringify(resolved.name)} (cursor-free)` : 'posted click (cursor-free)' };
  clickAt(x, y);
  return { ok: true, semantic: resolved, output: resolved !== undefined ? `clicked ${resolved.role} ${JSON.stringify(resolved.name)}` : 'clicked (coordinate)' };
}

/** The own HWND of the element with keyboard focus, or its nearest window-owning ancestor (cursor-free, UIA
 *  GetFocusedElement → ownerHwnd) — the same self→ancestor walk semanticClick's posted fallback uses, so a focused
 *  HWND-less leaf (e.g. Notepad's RichEdit surface) still resolves to the editor's own HWND. 0n when there is no focus
 *  or nothing in the chain owns a window (a pure WinUI/WPF/Chromium sub-control), where only SendInput can reach it. */
function focusedHandle(): bigint {
  try {
    const element = focused();
    try {
      return ownerHwnd(element);
    } finally {
      element.release();
    }
  } catch {
    return 0n;
  }
}

/** Execute one computer-use action against a window. Async (some actions wait). Never throws. */
export async function dispatch(window: Window, action: ComputerAction, options: DispatchOptions = {}): Promise<ComputerResult> {
  const cursorless = options.cursorless ?? true;
  const [x, y] = action.coordinate ?? [0, 0];
  try {
    switch (action.action) {
      case 'screenshot':
        return { ok: true, screenshot: window.screenshot() };
      case 'cursor_position': {
        const point = cursorPosition();
        return { ok: true, output: `${point.x},${point.y}` };
      }
      case 'mouse_move':
        moveTo(x, y);
        return { ok: true };
      case 'left_click':
        return semanticClick(x, y, cursorless);
      case 'right_click':
        // A posted right-click delivers the WM_RBUTTON messages cursor-free, but it does NOT raise a context MENU
        // (TrackPopupMenu needs real input-thread state — verified) — say so, so the caller retries with a real cursor.
        if (cursorless && postClickAt(x, y, 'right'))
          return { ok: true, output: 'posted right-click (cursor-free); note: a context menu will NOT appear from a posted right-click — re-issue with cursorless:false (real cursor, foreground) if you need the menu' };
        rightClickAt(x, y);
        return { ok: true };
      case 'middle_click':
        if (cursorless && postClickAt(x, y, 'middle')) return { ok: true, output: 'posted middle-click (cursor-free)' };
        middleClickAt(x, y);
        return { ok: true };
      case 'double_click':
        if (cursorless && postDoubleClickAt(x, y)) return { ok: true, output: 'posted double-click (cursor-free)' };
        doubleClickAt(x, y);
        return { ok: true };
      case 'triple_click':
        // honor cursorless (the doctrine) — a posted triple-click selects the line/paragraph without moving the real mouse
        if (cursorless && postTripleClickAt(x, y)) return { ok: true, output: 'posted triple-click (cursor-free)' };
        clickAt(x, y);
        clickAt(x, y);
        clickAt(x, y);
        return { ok: true };
      case 'left_mouse_down':
        mouseDown(x, y);
        return { ok: true };
      case 'left_mouse_up':
        mouseUp(x, y);
        return { ok: true };
      case 'left_click_drag': {
        const start = action.startCoordinate ?? action.coordinate;
        if (start === undefined || action.coordinate === undefined) return { ok: true };
        // Honor cursorless (the doctrine): resolve the owner HWND of the START point (fromPoint → ownerHwnd, mirroring
        // semanticClick) and post a cursor-free drag-SELECT (text selection / marquee) to it — works background/occluded/
        // locked, real mouse unmoved. This is NOT an OLE drag-DROP (that genuinely needs the real cursor — an inherent
        // wall), exactly as the MCP `drag` tool documents. Falls back to the real-cursor dragTo when no owner resolves.
        if (cursorless) {
          let owner = 0n;
          try {
            const element = fromPoint(start[0], start[1]);
            try {
              owner = ownerHwnd(element);
            } finally {
              element.release();
            }
          } catch {
            // no element at the start point — fall through to the real-cursor drag
          }
          if (owner !== 0n && postDragToHwnd(owner, start[0], start[1], action.coordinate[0], action.coordinate[1]))
            return { ok: true, output: `drag-selected ${start[0]},${start[1]} → ${action.coordinate[0]},${action.coordinate[1]} (cursor-free; text/marquee SELECT, not an OLE drag-drop)` };
        }
        dragTo(start[0], start[1], action.coordinate[0], action.coordinate[1]);
        return { ok: true, output: `dragged ${start[0]},${start[1]} → ${action.coordinate[0]},${action.coordinate[1]} (real cursor)` };
      }
      case 'key': {
        const combo = normalizeKey(action.text ?? '');
        // Cursor-free parity with the MCP press_key path: when the FOCUSED control owns a real HWND, post a single key
        // (WM_KEYDOWN/UP) to it — works minimized/background/locked. A chord (modifier+key) or a no-own-HWND focus has
        // no posted-key path, so fall to SendInput (system focus). postKey is a single key only, hence the no-'+' guard.
        const handle = cursorless && !combo.includes('+') ? focusedHandle() : 0n;
        if (handle !== 0n && postKey(handle, combo)) return { ok: true, output: `key ${action.text} (cursor-free)` };
        sendKeys(combo);
        return { ok: true, output: `key ${action.text}` };
      }
      case 'hold_key': {
        const name = normalizeKey(action.text ?? '');
        const durationMs = Math.round((action.duration ?? 1) * 1000);
        const handle = cursorless && !name.includes('+') ? focusedHandle() : 0n;
        if (handle !== 0n && (await postHoldKey(handle, name, durationMs))) return { ok: true, output: `held ${action.text} ${durationMs}ms (cursor-free)` };
        await holdKey(name, durationMs);
        return { ok: true };
      }
      case 'type': {
        const text = action.text ?? '';
        // Cursor-free parity with the MCP type path: WM_CHAR per code unit to the FOCUSED control's own HWND. A
        // no-own-HWND focus (WinUI/WPF/Chromium sub-control) has no posted-text path, so fall to SendInput.
        const handle = cursorless ? focusedHandle() : 0n;
        if (handle !== 0n && postText(handle, text)) return { ok: true, output: `typed ${JSON.stringify(text)} (cursor-free)` };
        typeText(text);
        return { ok: true, output: `typed ${JSON.stringify(text)}` };
      }
      case 'scroll': {
        const centerX = action.coordinate !== undefined ? x : Math.round(window.boundingRectangle.x + window.boundingRectangle.width / 2);
        const centerY = action.coordinate !== undefined ? y : Math.round(window.boundingRectangle.y + window.boundingRectangle.height / 2);
        const amount = action.scrollAmount ?? 3;
        const direction = action.scrollDirection ?? 'down';
        if (cursorless && scrollAt(centerX, centerY, direction, amount)) return { ok: true, output: `scrolled ${direction} ${amount} (cursor-free)` };
        const horizontal = direction === 'left' || direction === 'right';
        const clicks = direction === 'down' || direction === 'right' ? -amount : amount;
        scrollWheel(centerX, centerY, clicks, horizontal);
        return { ok: true, output: `scrolled ${direction} ${amount}` };
      }
      case 'wait':
        await Bun.sleep(Math.round((action.duration ?? 1) * 1000));
        return { ok: true };
      default:
        return { ok: false, error: `unknown action: ${action.action}` };
    }
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
}

/** Convert an OpenAI CUA computer_call action to a ComputerAction for `dispatch`. */
export function fromCuaAction(raw: { type: string; x?: number; y?: number; button?: string; scroll_x?: number; scroll_y?: number; text?: string; keys?: readonly string[]; path?: readonly { x: number; y: number }[] }): ComputerAction {
  const point: [number, number] = [raw.x ?? 0, raw.y ?? 0];
  switch (raw.type) {
    case 'click':
      return { action: raw.button === 'right' ? 'right_click' : raw.button === 'wheel' || raw.button === 'middle' ? 'middle_click' : 'left_click', coordinate: point };
    case 'double_click':
      return { action: 'double_click', coordinate: point };
    case 'move':
      return { action: 'mouse_move', coordinate: point };
    case 'type':
      return { action: 'type', text: raw.text ?? '' };
    case 'keypress':
      return { action: 'key', text: (raw.keys ?? []).join('+') };
    case 'scroll': {
      const vertical = raw.scroll_y ?? 0;
      const horizontal = raw.scroll_x ?? 0;
      const direction = vertical > 0 ? 'down' : vertical < 0 ? 'up' : horizontal > 0 ? 'right' : 'left';
      return { action: 'scroll', coordinate: point, scrollDirection: direction, scrollAmount: Math.max(1, Math.round(Math.abs(vertical || horizontal) / 100)) };
    }
    case 'wait':
      return { action: 'wait', duration: 1 };
    case 'screenshot':
      return { action: 'screenshot' };
    case 'drag': {
      const path = raw.path ?? [];
      const start = path[0];
      const end = path[path.length - 1];
      return { action: 'left_click_drag', startCoordinate: start !== undefined ? [start.x, start.y] : undefined, coordinate: end !== undefined ? [end.x, end.y] : undefined };
    }
    default:
      return { action: raw.type, coordinate: raw.x !== undefined && raw.y !== undefined ? point : undefined, text: raw.text };
  }
}
