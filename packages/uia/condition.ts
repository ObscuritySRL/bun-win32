// The typed Selector: a hybrid of server-side UIA property conditions (one cross-process round-trip
// filters in the target app's provider, marshaling only matches) and a client-side matcher for the
// predicates UIA conditions cannot express (regex, substring). Server-side conditions work because
// the MS x64 ABI passes a 16-byte VARIANT by hidden reference — modeled as a pointer to a VARIANT.

import { FFIType } from 'bun:ffi';

import Oleaut32 from '@bun-win32/oleaut32';

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

/** Build the actionable "no element matched … nearest were …" message (the gripe→error design). */
export function formatNoMatch(selector: Selector, windowName: string, candidateNames: readonly string[]): string {
  const nearest = candidateNames.filter((candidate) => candidate.trim().length > 0).slice(0, 8);
  const tail = nearest.length > 0 ? ` — nearest: ${nearest.map((candidate) => JSON.stringify(candidate)).join(', ')}` : '';
  return `no element matched ${selectorToString(selector)} in "${windowName}"${tail}`;
}

/** Match a (already-read) element against a selector — all fields AND together. Pure logic. */
export function matches(element: ElementProperties, selector: Selector): boolean {
  if (selector.controlType !== undefined && element.controlType !== selector.controlType) return false;
  if (selector.automationId !== undefined && element.automationId !== selector.automationId) return false;
  if (selector.className !== undefined && element.className !== selector.className) return false;
  if (selector.name !== undefined) {
    if (selector.name instanceof RegExp) {
      if (!selector.name.test(element.name)) return false;
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

function trueCondition(pAutomation: bigint): bigint {
  const out = Buffer.alloc(8);
  if (vcall(pAutomation, SLOT.CreateTrueCondition, [FFIType.ptr], [out.ptr!]) !== S_OK) return 0n;
  return out.readBigUInt64LE(0);
}

function andCondition(pAutomation: bigint, first: bigint, second: bigint): bigint {
  const out = Buffer.alloc(8);
  if (vcall(pAutomation, SLOT.CreateAndCondition, [FFIType.u64, FFIType.u64, FFIType.ptr], [first, second, out.ptr!]) !== S_OK) return 0n;
  return out.readBigUInt64LE(0);
}

/**
 * Compile a selector into a server-side condition (the caller must `comRelease` it) plus whether a
 * client-side `matches` pass is still required. Exact scalars (controlType, name, automationId,
 * className) become a server-side AND of property conditions; regex/substring fall to the client.
 */
export function compileCondition(pAutomation: bigint, selector: Selector): { condition: bigint; needsClientFilter: boolean } {
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
  if (parts.length === 0) return { condition: trueCondition(pAutomation), needsClientFilter: true };
  let condition = parts[0]!;
  for (let index = 1; index < parts.length; index += 1) {
    const combined = andCondition(pAutomation, condition, parts[index]!);
    comRelease(condition);
    comRelease(parts[index]!);
    condition = combined;
  }
  return { condition, needsClientFilter };
}
