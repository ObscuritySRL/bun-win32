// A thin, default-off trust layer for agent-driven actions: dry-run (describe, don't act), an
// allow/deny verb gate, a confirm() hook before state-changing actions, an audit callback, and the
// isError mapping that keeps a failed action from throwing across a tool loop (the Claude Agent SDK
// stops the loop on a thrown handler; isError:true lets the model self-correct). UIA's edge: it
// inspects the target's name/controlType BEFORE acting — a semantic guardrail pixel agents can't build.
// This is a client-side GATE, not a sandbox; it sits inside, not instead of, VM/container isolation.

import { type AgentAction, type AgentActionResult, performAgentAction } from './agent';
import type { Element } from '../element/element';
import type { UiaNode } from '../element/tree';

export interface AuditRecord {
  action: AgentAction;
  target: string;
  ok: boolean;
  dryRun: boolean;
  error?: string;
}

export interface SafeOptions {
  /** Resolve and describe each action without performing it. */
  dryRun?: boolean;
  /** Only these verbs may run (e.g. ['read'] = read-only). */
  allow?: readonly string[];
  /** These verbs are blocked. */
  deny?: readonly string[];
  /** Called before each state-changing action; returning false blocks it. */
  confirm?: (action: AgentAction, target: string) => boolean;
  /** Called after every action attempt (audit log). */
  onAction?: (record: AuditRecord) => void;
}

const STATE_CHANGING = new Set(['click', 'invoke', 'setValue', 'toggle', 'type']);

function describe(element: Element): string {
  return `${element.controlTypeName} ${JSON.stringify(element.name)}`;
}

/** Execute a JSON action list with optional gates. Mirrors execute(), but never throws across the loop. */
export function safeExecute(window: Element, actions: readonly AgentAction[], options: SafeOptions = {}): AgentActionResult[] {
  const results: AgentActionResult[] = [];
  for (const action of actions) {
    const element = window.find(action.find);
    if (element === null) {
      const error = window.describeNoMatch(action.find);
      options.onAction?.({ action, target: '(no match)', ok: false, dryRun: options.dryRun === true, error });
      results.push({ action, ok: false, error });
      continue;
    }
    const target = describe(element);
    try {
      if (options.deny?.includes(action.do)) throw new Error(`action "${action.do}" is denied by policy`);
      if (options.allow !== undefined && !options.allow.includes(action.do)) throw new Error(`action "${action.do}" is not in the allow-list`);
      if (options.dryRun === true) {
        options.onAction?.({ action, target, ok: true, dryRun: true });
        results.push({ action, ok: true, value: `would ${action.do} ${target}` });
        continue;
      }
      if (STATE_CHANGING.has(action.do) && options.confirm !== undefined && !options.confirm(action, target)) throw new Error(`action "${action.do}" on ${target} was not confirmed`);
      const value = performAgentAction(element, action); // cursor-free first (invoke / posted click / posted WM_CHAR) — the trust layer honors the drive-in-the-dark doctrine too
      options.onAction?.({ action, target, ok: true, dryRun: false });
      results.push({ action, ok: true, value });
    } catch (error) {
      options.onAction?.({ action, target, ok: false, dryRun: options.dryRun === true, error: (error as Error).message });
      results.push({ action, ok: false, error: (error as Error).message });
    } finally {
      element.release();
    }
  }
  return results;
}

/** Map agent action results to Anthropic tool_result content (isError when any action failed). */
export function toToolResult(results: readonly AgentActionResult[]): { content: { type: string; text: string }[]; isError: boolean } {
  const lines = results.map((result) => (result.ok ? `ok: ${result.value ?? result.action.do}` : `error: ${result.error}`));
  return { content: [{ type: 'text', text: lines.join('\n') }], isError: results.some((result) => !result.ok) };
}

/** A copy of a serialized tree with names matching `pattern` masked (passwords, secure text). */
export function redactTree(node: UiaNode, pattern: RegExp): UiaNode {
  // Strip g/y: a stateful lastIndex would leave every other matching name unmasked (fail-open secret leak).
  const stateless = pattern.global || pattern.sticky ? new RegExp(pattern.source, pattern.flags.replace(/[gy]/g, '')) : pattern;
  return { ...node, name: stateless.test(node.name) ? '***' : node.name, children: node.children.map((child) => redactTree(child, stateless)) };
}
