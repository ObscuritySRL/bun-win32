// Drop-in computer-use adapter: dispatch the literal Anthropic `computer` tool action set (and
// OpenAI CUA's, via fromCuaAction) against Windows — SEMANTIC-FIRST and CURSOR-FREE. A click at (x,y)
// first resolves the UIA element under the point and invoke()s it (no cursor movement, works on a
// locked session); only when no actionable element resolves does it fall back to a cursor-free posted
// click, then finally a real SendInput click. This turns a pixel action into a ground-truth semantic
// one — erasing the coordinate-hallucination, downscaling click-miss, and scroll-no-op failure modes
// that the computer-use literature attributes to screenshot-only grounding.

import { postClickAt } from './coords';
import { fromPoint, type Window } from './element';
import { clickAt, cursorPosition, doubleClickAt, dragTo, holdKey, middleClickAt, mouseDown, mouseUp, moveTo, rightClickAt, scrollWheel, sendKeys, type as typeText } from './input';

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
  try {
    const element = fromPoint(x, y);
    try {
      resolved = { role: element.controlTypeName, name: element.name };
      element.invoke();
      return { ok: true, semantic: resolved, output: `invoked ${resolved.role} ${JSON.stringify(resolved.name)} (cursor-free)` };
    } catch {
      // no element / no Invoke pattern — fall through to a click
    } finally {
      element.release();
    }
  } catch {
    // no element at the point — pure pixel click
  }
  if (cursorless && postClickAt(x, y, 'left')) return { ok: true, semantic: resolved, output: resolved !== undefined ? `posted click to ${resolved.role} ${JSON.stringify(resolved.name)} (cursor-free)` : 'posted click (cursor-free)' };
  clickAt(x, y);
  return { ok: true, semantic: resolved, output: resolved !== undefined ? `clicked ${resolved.role} ${JSON.stringify(resolved.name)}` : 'clicked (coordinate)' };
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
        if (cursorless && postClickAt(x, y, 'right')) return { ok: true, output: 'posted right-click (cursor-free)' };
        rightClickAt(x, y);
        return { ok: true };
      case 'middle_click':
        middleClickAt(x, y);
        return { ok: true };
      case 'double_click':
        doubleClickAt(x, y);
        return { ok: true };
      case 'triple_click':
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
        if (start !== undefined && action.coordinate !== undefined) dragTo(start[0], start[1], action.coordinate[0], action.coordinate[1]);
        return { ok: true };
      }
      case 'key':
        sendKeys(normalizeKey(action.text ?? ''));
        return { ok: true, output: `key ${action.text}` };
      case 'hold_key':
        await holdKey(normalizeKey(action.text ?? ''), Math.round((action.duration ?? 1) * 1000));
        return { ok: true };
      case 'type':
        typeText(action.text ?? '');
        return { ok: true, output: `typed ${JSON.stringify(action.text ?? '')}` };
      case 'scroll': {
        const centerX = action.coordinate !== undefined ? x : Math.round(window.boundingRectangle.x + window.boundingRectangle.width / 2);
        const centerY = action.coordinate !== undefined ? y : Math.round(window.boundingRectangle.y + window.boundingRectangle.height / 2);
        const amount = action.scrollAmount ?? 3;
        const horizontal = action.scrollDirection === 'left' || action.scrollDirection === 'right';
        const clicks = action.scrollDirection === 'down' || action.scrollDirection === 'right' ? -amount : amount;
        scrollWheel(centerX, centerY, clicks, horizontal);
        return { ok: true, output: `scrolled ${action.scrollDirection ?? 'down'} ${amount}` };
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
