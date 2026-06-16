// Drop-in computer-use grounding for the Windows desktop: turn the UIA surface into an LLM tool schema
// plus a JSON-action executor. Hand an agent the tree() JSON (ground-truth element identity + bounds,
// not pixels) and these tools; it grounds actions on roles and names instead of counting pixels — the
// structured alternative the computer-use literature (UFO2, OSWorld) is converging on.

import type { Selector } from './condition';
import type { Element } from './element';
import { serialize, type UiaNode } from './tree';

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
      let value: string | undefined;
      if (action.do === 'invoke') element.invoke();
      else if (action.do === 'click') element.click();
      else if (action.do === 'type') element.type(action.text ?? '');
      else if (action.do === 'setValue') element.setValue(action.text ?? '');
      else if (action.do === 'toggle') element.toggle();
      else value = element.value || element.text() || ''; // NOT element.name — never return the label dressed as the read value
      results.push({ action, ok: true, value });
    } catch (error) {
      results.push({ action, ok: false, error: (error as Error).message });
    } finally {
      element.release();
    }
  }
  return results;
}

/** Serialize a window for an agent — the compact, interactive-only grounding profile. */
export function groundingTree(window: Element): UiaNode {
  return serialize(window, { agentProfile: true });
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
    input_schema: { type: 'object', properties: { agentProfile: { type: 'boolean', description: 'prune to interactive/named controls' } } },
  },
] as const;
