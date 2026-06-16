// The typed Selector: a hybrid of server-side UIA property conditions (one cross-process round-trip
// filters in the target app's provider, marshaling only matches) and a client-side matcher for the
// predicates UIA conditions cannot express (regex, substring). Server-side conditions work because
// the MS x64 ABI passes a 16-byte VARIANT by hidden reference — modeled as a pointer to a VARIANT.

import { FFIType } from 'bun:ffi';

import Oleaut32 from '@bun-win32/oleaut32';

import { trueCondition } from './automation';
import { comRelease, vcall } from './com';
import { ControlType, PropertyId, S_OK, SLOT, VT_BSTR, VT_I4 } from './constants';

export interface Selector {
  automationId?: string;
  className?: string;
  controlType?: ControlType | number;
  /** Exact string (server-side) or a regular expression (client-side). */
  name?: RegExp | string;
  /** Substring of the name (client-side). */
  nameContains?: string;
}

/** The minimal property surface the client-side matcher reads — `Element` satisfies it. */
export interface ElementProperties {
  automationId: string;
  className: string;
  controlType: number;
  name: string;
}

/** Render a selector as a readable string for error messages. */
export function selectorToString(selector: Selector): string {
  const parts: string[] = [];
  if (selector.controlType !== undefined) parts.push(`controlType: ${ControlType[selector.controlType] ?? selector.controlType}`);
  if (selector.name !== undefined) parts.push(`name: ${selector.name instanceof RegExp ? selector.name.toString() : JSON.stringify(selector.name)}`);
  if (selector.nameContains !== undefined) parts.push(`nameContains: ${JSON.stringify(selector.nameContains)}`);
  if (selector.automationId !== undefined) parts.push(`automationId: ${JSON.stringify(selector.automationId)}`);
  if (selector.className !== undefined) parts.push(`className: ${JSON.stringify(selector.className)}`);
  return `{ ${parts.join(', ')} }`;
}

/** Lower = more relevant to the requested name. Substring matches (either direction) float to the top; everything else
 *  keeps its original (tree) order via a stable tie-break, so the "nearest" list leads with the likeliest intended target. */
function nameRelevance(candidate: string, want: string): number {
  const lower = candidate.toLowerCase();
  if (lower === want) return 0;
  if (lower.includes(want) || want.includes(lower)) return 1;
  return 2;
}

/** Build the actionable "no element matched … nearest were …" message (the gripe→error design). Candidates are
 *  de-duplicated and ranked by relevance to the requested name, and when a candidate's name CONTAINS the requested
 *  exact name (so a name-exact match failed but a substring would hit) the message steers to {nameContains}. */
export function formatNoMatch(selector: Selector, windowName: string, candidateNames: readonly string[]): string {
  const want = (typeof selector.name === 'string' ? selector.name : (selector.nameContains ?? '')).toLowerCase();
  const unique = [...new Set(candidateNames.filter((candidate) => candidate.trim().length > 0))];
  const ranked = want.length > 0 ? unique.map((name, index) => ({ name, index })).sort((a, b) => nameRelevance(a.name, want) - nameRelevance(b.name, want) || a.index - b.index).map((entry) => entry.name) : unique;
  const nearest = ranked.slice(0, 8);
  const tail = nearest.length > 0 ? ` — nearest: ${nearest.map((candidate) => JSON.stringify(candidate)).join(', ')}` : '';
  const containsHint = want.length > 0 && typeof selector.name === 'string' && unique.some((candidate) => candidate.toLowerCase().includes(want)) ? ` (a control's name CONTAINS ${JSON.stringify(selector.name)} — retry with {nameContains:${JSON.stringify(selector.name)}})` : '';
  return `no element matched ${selectorToString(selector)} in "${windowName}"${tail}${containsHint}`;
}

/** Match a (already-read) element against a selector — all fields AND together. Pure logic. */
export function matches(element: ElementProperties, selector: Selector): boolean {
  if (selector.controlType !== undefined && element.controlType !== selector.controlType) return false;
  if (selector.automationId !== undefined && element.automationId !== selector.automationId) return false;
  if (selector.className !== undefined && element.className !== selector.className) return false;
  if (selector.name !== undefined) {
    if (selector.name instanceof RegExp) {
      // Strip g/y: a stateful lastIndex makes repeated .test() over sibling names skip every other match.
      const pattern = selector.name.global || selector.name.sticky ? new RegExp(selector.name.source, selector.name.flags.replace(/[gy]/g, '')) : selector.name;
      if (!pattern.test(element.name)) return false;
    } else if (element.name !== selector.name) return false;
  }
  if (selector.nameContains !== undefined && !element.name.includes(selector.nameContains)) return false;
  return true;
}

function propertyConditionInt(pAutomation: bigint, propertyId: number, value: number): bigint {
  const variant = Buffer.alloc(16);
  variant.writeUInt16LE(VT_I4, 0);
  variant.writeInt32LE(value, 8);
  const out = Buffer.alloc(8);
  if (vcall(pAutomation, SLOT.CreatePropertyCondition, [FFIType.i32, FFIType.ptr, FFIType.ptr], [propertyId, variant.ptr!, out.ptr!]) !== S_OK) return 0n;
  return out.readBigUInt64LE(0);
}

function propertyConditionString(pAutomation: bigint, propertyId: number, value: string): bigint {
  const bstr = Oleaut32.SysAllocString(Buffer.from(`${value}\0`, 'utf16le').ptr!);
  const variant = Buffer.alloc(16);
  variant.writeUInt16LE(VT_BSTR, 0);
  variant.writeBigUInt64LE(BigInt(bstr), 8);
  const out = Buffer.alloc(8);
  const hr = vcall(pAutomation, SLOT.CreatePropertyCondition, [FFIType.i32, FFIType.ptr, FFIType.ptr], [propertyId, variant.ptr!, out.ptr!]);
  Oleaut32.SysFreeString(bstr); // CreatePropertyCondition copies the VARIANT (SysAllocStrings its own BSTR)
  if (hr !== S_OK) return 0n;
  return out.readBigUInt64LE(0);
}

function andCondition(pAutomation: bigint, first: bigint, second: bigint): bigint {
  const out = Buffer.alloc(8);
  if (vcall(pAutomation, SLOT.CreateAndCondition, [FFIType.u64, FFIType.u64, FFIType.ptr], [first, second, out.ptr!]) !== S_OK) return 0n;
  return out.readBigUInt64LE(0);
}

/** A compiled selector: the server-side condition, whether a client-side `matches` pass is still needed, and
 *  whether the caller owns the condition (must `comRelease` it) — false for the shared TrueCondition singleton. */
export interface CompiledCondition {
  condition: bigint;
  needsClientFilter: boolean;
  owned: boolean;
}

/**
 * Compile a selector into a server-side condition plus whether a client-side `matches` pass is still
 * required. Exact scalars (controlType, name, automationId, className) become a server-side AND of property
 * conditions the caller owns; an empty/regex/substring-only selector reuses the shared TrueCondition
 * singleton (owned=false — do not release it). Release an owned condition with `comRelease`.
 */
export function compileCondition(pAutomation: bigint, selector: Selector): CompiledCondition {
  const parts: bigint[] = [];
  let needsClientFilter = false;
  if (selector.controlType !== undefined) {
    const part = propertyConditionInt(pAutomation, PropertyId.ControlType, selector.controlType);
    if (part !== 0n) parts.push(part);
  }
  if (typeof selector.name === 'string') {
    const part = propertyConditionString(pAutomation, PropertyId.Name, selector.name);
    if (part !== 0n) parts.push(part);
  } else if (selector.name instanceof RegExp) {
    needsClientFilter = true;
  }
  if (selector.automationId !== undefined) {
    const part = propertyConditionString(pAutomation, PropertyId.AutomationId, selector.automationId);
    if (part !== 0n) parts.push(part);
  }
  if (selector.className !== undefined) {
    const part = propertyConditionString(pAutomation, PropertyId.ClassName, selector.className);
    if (part !== 0n) parts.push(part);
  }
  if (selector.nameContains !== undefined) needsClientFilter = true;
  if (parts.length === 0) return { condition: trueCondition(), needsClientFilter, owned: false }; // empty selector → TrueCondition matches everything server-side, no client pass (needsClientFilter stays true only for a regex/substring-only selector)
  let condition = parts[0]!;
  for (let index = 1; index < parts.length; index += 1) {
    const combined = andCondition(pAutomation, condition, parts[index]!);
    comRelease(condition);
    comRelease(parts[index]!);
    condition = combined;
  }
  return { condition, needsClientFilter, owned: true };
}
