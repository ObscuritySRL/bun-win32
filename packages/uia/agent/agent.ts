// Drop-in computer-use grounding for the Windows desktop: turn the UIA surface into an LLM tool schema
// plus a JSON-action executor. Hand an agent the tree() JSON (ground-truth element identity + bounds,
// not pixels) and these tools; it grounds actions on roles and names instead of counting pixels — the
// structured alternative the computer-use literature (UFO2, OSWorld) is converging on.

import type { Selector } from '../element/condition';
import { ownerHwnd, postClickToHwnd } from '../input/coords';
import type { Element } from '../element/element';
import { postText } from '../input/input';
import { serialize, type UiaNode } from '../element/tree';

export interface AgentAction {
  find: Selector;
  do: 'click' | 'invoke' | 'read' | 'setValue' | 'toggle' | 'type';
  text?: string;
}

export interface AgentActionResult {
  action: AgentAction;
  ok: boolean;
  value?: string;
  error?: string;
}

/** Perform one resolved action CURSOR-FREE first — mirroring the MCP layer so the library facades honor the same
 *  drive-in-the-dark doctrine: invoke() before a real click, a posted click to the owner before SendInput, and a posted
 *  WM_CHAR before a SendInput type. So execute()/safeExecute() do NOT steal foreground, move the real cursor, or fail on
 *  a locked session when a cursor-free path exists. Returns the read value for 'read', else undefined. */
export function performAgentAction(element: Element, action: AgentAction): string | undefined {
  if (action.do === 'invoke') return void element.invoke();
  if (action.do === 'toggle') return void element.toggle();
  if (action.do === 'setValue') return void element.setValue(action.text ?? '');
  if (action.do === 'read') return element.isPassword ? '(password — withheld)' : element.value || element.text() || ''; // withhold secret-field values; NOT element.name (no label-as-value)
  if (action.do === 'type') {
    const handle = element.nativeWindowHandle;
    if (handle !== 0n) return void postText(handle, action.text ?? ''); // cursor-free WM_CHAR to the control's own HWND
    return void element.type(action.text ?? ''); // no own HWND — SendInput (needs focus)
  }
  // 'click' — invoke (cursor-free, works locked/minimized/background); else a posted click to the OWNER window; else
  // a real SendInput click as the last resort.
  try {
    return void element.invoke();
  } catch {
    // no Invoke pattern — try a posted click
  }
  const owner = ownerHwnd(element);
  const bounds = element.boundingRectangle;
  const point = element.clickablePoint ?? { x: bounds.x + Math.floor(bounds.width / 2), y: bounds.y + Math.floor(bounds.height / 2) };
  if (owner !== 0n && postClickToHwnd(owner, point.x, point.y, 'left')) return undefined;
  return void element.click();
}

/** Execute a JSON action list against a window: each step finds an element by selector, then acts. */
export function execute(window: Element, actions: readonly AgentAction[]): AgentActionResult[] {
  const results: AgentActionResult[] = [];
  for (const action of actions) {
    const element = window.find(action.find);
    if (element === null) {
      results.push({ action, ok: false, error: window.describeNoMatch(action.find) });
      continue;
    }
    try {
      const value = performAgentAction(element, action); // cursor-free first (invoke / posted click / posted WM_CHAR)
      results.push({ action, ok: true, value });
    } catch (error) {
      results.push({ action, ok: false, error: (error as Error).message });
    } finally {
      element.release();
    }
  }
  return results;
}

/** Serialize a window for an agent — the compact, interactive-only grounding profile. `maxNodes` caps total nodes
 *  walked (default 1500, the snapshot budget) so a dense flat LOB grid/toolbar/icon-wall stops fast and truncates
 *  with a marker instead of marshaling its whole subtree (the ~7s flat-tree wall). */
export function groundingTree(window: Element, maxNodes?: number): UiaNode {
  return serialize(window, { agentProfile: true, ...(maxNodes !== undefined ? { maxNodes } : {}) });
}

/** LLM tool definitions (Anthropic/OpenAI tool-use shape) for desktop grounding. */
export const AGENT_TOOLS = [
  {
    name: 'find_and_act',
    description: 'Find a desktop control by name/control-type/automationId and act on it (invoke, click, type, setValue, toggle, or read its value).',
    input_schema: {
      type: 'object',
      properties: {
        find: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            controlType: { type: 'number', description: 'a UIA control-type id, e.g. 50000 Button, 50004 Edit' },
            automationId: { type: 'string' },
            nameContains: { type: 'string' },
          },
        },
        do: { type: 'string', enum: ['invoke', 'click', 'type', 'setValue', 'toggle', 'read'] },
        text: { type: 'string', description: 'the text for type/setValue' },
      },
      required: ['find', 'do'],
    },
  },
  {
    name: 'read_tree',
    description: 'Serialize the target window accessibility tree to JSON (role, name, automationId, bounds) for grounding actions.',
    input_schema: {
      type: 'object',
      properties: {
        agentProfile: { type: 'boolean', description: 'prune to interactive/named controls' },
        maxNodes: {
          type: 'number',
          description: 'Cap TOTAL nodes walked (default 1500) — the lever for a dense window with thousands of sibling controls; the tree is truncated with a "raise maxNodes" marker when hit. maxDepth canNOT bound a flat/wide tree.',
        },
      },
    },
  },
] as const;
