// The typed Selector: a hybrid of server-side UIA property conditions (one cross-process round-trip
// filters in the target app's provider, marshaling only matches) and a client-side matcher for the
// predicates UIA conditions cannot express (regex, substring). Server-side conditions work because
// the MS x64 ABI passes a 16-byte VARIANT by hidden reference — modeled as a pointer to a VARIANT.

import { FFIType } from 'bun:ffi';

import Oleaut32 from '@bun-win32/oleaut32';

import { trueCondition } from '../com/automation';
import { comRelease, vcall } from '../com/com';
import { ControlType, PropertyId, S_OK, SLOT, VT_BSTR, VT_I4 } from '../com/constants';

export interface Selector {
  automationId?: string;
  className?: string;
  controlType?: ControlType | number;
  /** Any-of control types: matches an element whose controlType is in this set (server-side OR of ControlType
   *  conditions). The agent's "the clickable thing whether it's a Button OR a Hyperlink OR a MenuItem" case. */
  controlTypes?: readonly (ControlType | number)[];
  /** Descendant-scoped filter (Playwright `filter({has})`): keep only a candidate whose own subtree contains a match for
   *  this nested selector — "the ListItem that CONTAINS a Button named Delete". Client-side, evaluated per surviving
   *  candidate via a Subtree find, so it engages only when set (it does NOT touch the hot server-only path). Nestable. */
  has?: Selector;
  /** Negated `has` (Playwright `filter({hasNot})` / FlaUI `.Not()`): REJECT a candidate whose own subtree contains a
   *  match for this nested selector — "the ListItem WITHOUT a Delete child", "the row that is NOT the header". The
   *  inverse of `has`; client-side, evaluated per surviving candidate via a Subtree find (off the hot server path).
   *  Nestable. A candidate with no such descendant survives; one that contains it is dropped. */
  hasNot?: Selector;
  /** Negated `hasText` (Playwright `filter({hasNotText})`): REJECT a candidate whose subtree contains a control whose
   *  name includes this substring — "the row that does NOT contain 'Archived'". The inverse of `hasText`, client-side. */
  hasNotText?: string;
  /** Descendant-scoped text filter (Playwright `filter({hasText})`): keep only a candidate whose subtree contains a
   *  control whose name includes this substring — "the row that has the text 'Overdue'". Client-side, like `has`. */
  hasText?: string;
  /** Pick the Nth match (0-based) from the candidate list instead of the first — disambiguates N identical twins
   *  (three "Delete" buttons, 20 unnamed ListItems) without a snapshot round-trip. Out-of-range yields no match. */
  index?: number;
  /** Pick the LAST match instead of the first (sugar for the highest index). `index` wins when both are set. */
  last?: boolean;
  /** Relational selector (Playwright `getByLabel` / FlaUI LabeledBy): keep only a candidate whose associated label —
   *  the element named by its UIA LabeledBy property — has this exact Name. The targeting path for the common unnamed
   *  edit box that a separate Text label describes ("the field labeled Username"), where the edit's own Name is empty.
   *  Client-side, resolved per surviving candidate by reading the live element's LabeledBy (element.ts subtreeMatches),
   *  off the hot server path — engaged only when set, exactly like `has`/`hasText`. */
  labeledBy?: string;
  /** Exact string (server-side) or a regular expression (client-side). */
  name?: RegExp | string;
  /** Substring of the name (client-side). */
  nameContains?: string;
  /** Negated name (FlaUI `.Not()` on a name predicate): REJECT a candidate whose Name matches this — exact string or a
   *  regular expression ("buttons whose name is NOT Close"). Client-side; reuses the stateless-regex machinery of `name`. */
  nameNot?: RegExp | string;
}

/** The minimal property surface the client-side matcher reads — `Element` satisfies it. */
export interface ElementProperties {
  automationId: string;
  className: string;
  controlType: number;
  name: string;
}

// A /g- or /y- flagged selector regex carries a stateful lastIndex; reusing it across sibling names via .test()
// skips every other match. matches() must test a g/y-stripped STATELESS copy — but building that copy per matches()
// call (once per candidate) recompiles the regex for every one of N candidates (~67× the non-global cost). Memoize
// the stripped copy per distinct selector regex here: built once, GC-collected with the selector via the WeakMap key,
// and the caller's RegExp is never mutated (still stateless from matches()' view).
const STATELESS = new WeakMap<RegExp, RegExp>();

function statelessRegExp(pattern: RegExp): RegExp {
  if (!pattern.global && !pattern.sticky) return pattern;
  const cached = STATELESS.get(pattern);
  if (cached !== undefined) return cached;
  const stripped = new RegExp(pattern.source, pattern.flags.replace(/[gy]/g, ''));
  STATELESS.set(pattern, stripped);
  return stripped;
}

/** Render a selector as a readable string for error messages. */
export function selectorToString(selector: Selector): string {
  const parts: string[] = [];
  if (selector.controlType !== undefined) parts.push(`controlType: ${ControlType[selector.controlType] ?? selector.controlType}`);
  if (selector.controlTypes !== undefined) parts.push(`controlTypes: [${selector.controlTypes.map((controlType) => ControlType[controlType] ?? controlType).join(', ')}]`);
  if (selector.name !== undefined) parts.push(`name: ${selector.name instanceof RegExp ? selector.name.toString() : JSON.stringify(selector.name)}`);
  if (selector.nameContains !== undefined) parts.push(`nameContains: ${JSON.stringify(selector.nameContains)}`);
  if (selector.nameNot !== undefined) parts.push(`nameNot: ${selector.nameNot instanceof RegExp ? selector.nameNot.toString() : JSON.stringify(selector.nameNot)}`);
  if (selector.automationId !== undefined) parts.push(`automationId: ${JSON.stringify(selector.automationId)}`);
  if (selector.className !== undefined) parts.push(`className: ${JSON.stringify(selector.className)}`);
  if (selector.has !== undefined) parts.push(`has: ${selectorToString(selector.has)}`);
  if (selector.hasNot !== undefined) parts.push(`hasNot: ${selectorToString(selector.hasNot)}`);
  if (selector.hasNotText !== undefined) parts.push(`hasNotText: ${JSON.stringify(selector.hasNotText)}`);
  if (selector.hasText !== undefined) parts.push(`hasText: ${JSON.stringify(selector.hasText)}`);
  if (selector.labeledBy !== undefined) parts.push(`labeledBy: ${JSON.stringify(selector.labeledBy)}`);
  if (selector.index !== undefined) parts.push(`index: ${selector.index}`);
  if (selector.last === true) parts.push('last: true');
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
export function formatNoMatch(selector: Selector, windowName: string, candidateNames: readonly string[], availableControlTypes: readonly string[] = []): string {
  const want = (typeof selector.name === 'string' ? selector.name : (selector.nameContains ?? '')).toLowerCase();
  const unique = [...new Set(candidateNames.filter((candidate) => candidate.trim().length > 0))];
  const ranked =
    want.length > 0
      ? unique
          .map((name, index) => ({ name, index }))
          .sort((a, b) => nameRelevance(a.name, want) - nameRelevance(b.name, want) || a.index - b.index)
          .map((entry) => entry.name)
      : unique;
  const nearest = ranked.slice(0, 8);
  const tail = nearest.length > 0 ? ` — nearest: ${nearest.map((candidate) => JSON.stringify(candidate)).join(', ')}` : '';
  const containsHint =
    want.length > 0 && typeof selector.name === 'string' && unique.some((candidate) => candidate.toLowerCase().includes(want))
      ? ` (a control's name CONTAINS ${JSON.stringify(selector.name)} — retry with {nameContains:${JSON.stringify(selector.name)}})`
      : '';
  // controlType missed and nothing ranked by name: teach the cold agent which control types this window actually exposes
  // (its reach for Edit on modern WinUI hits Document/Text instead) — without it the error only echoes what it already typed.
  const controlTypeHint =
    selector.controlType !== undefined && nearest.length === 0 && availableControlTypes.length > 0
      ? ` (no controlType ${JSON.stringify(ControlType[selector.controlType] ?? selector.controlType)} here — this window exposes: ${availableControlTypes.join(', ')} — retry with one of those, or drop controlType)`
      : '';
  return `no element matched ${selectorToString(selector)} in "${windowName}"${tail}${containsHint}${controlTypeHint}`;
}

/** Whether the selector carries a live-element filter (`has`/`hasText` subtree, or `labeledBy` relational lookup) that
 *  `matches()` cannot decide from properties alone — it needs the live candidate. The caller (element.ts), which holds
 *  the Element, runs the Subtree find / LabeledBy read when this is true; `matches()` stays a pure property check that
 *  never rejects on `has`/`hasText`/`labeledBy`. */
export function needsSubtreeFilter(selector: Selector): boolean {
  return selector.has !== undefined || selector.hasNot !== undefined || selector.hasNotText !== undefined || selector.hasText !== undefined || selector.labeledBy !== undefined;
}

/** Match a (already-read) element against a selector — all fields AND together (controlTypes is an internal OR). Pure logic.
 *  `has`/`hasText`/`labeledBy` are NOT checked here (they need the live element, not just properties) — the caller folds
 *  them in via a Subtree find / LabeledBy read after this passes; matches() neither evaluates nor rejects on them. */
export function matches(element: ElementProperties, selector: Selector): boolean {
  if (selector.controlType !== undefined && element.controlType !== selector.controlType) return false;
  if (selector.controlTypes !== undefined && !selector.controlTypes.includes(element.controlType)) return false;
  if (selector.automationId !== undefined && element.automationId !== selector.automationId) return false;
  if (selector.className !== undefined && element.className !== selector.className) return false;
  if (selector.name !== undefined) {
    if (selector.name instanceof RegExp) {
      if (!statelessRegExp(selector.name).test(element.name)) return false; // statelessRegExp strips g/y once per distinct selector regex (a stateful lastIndex would skip every other sibling)
    } else if (element.name !== selector.name) return false;
  }
  if (selector.nameContains !== undefined && !element.name.includes(selector.nameContains)) return false;
  if (selector.nameNot !== undefined) {
    if (selector.nameNot instanceof RegExp) {
      if (statelessRegExp(selector.nameNot).test(element.name)) return false; // reject when the negated name matches (inverse of `name`)
    } else if (element.name === selector.nameNot) return false;
  }
  return true;
}

/** Pick the selector's positional match from an ordered candidate list: `index` (0-based; negative or out-of-range →
 *  null) wins, else `last` → the final element, else the first. Pure client-side slice — no FFI, no new condition. */
export function pickIndexed<T>(candidates: readonly T[], selector: Selector): T | null {
  if (selector.index !== undefined) return selector.index >= 0 && selector.index < candidates.length ? candidates[selector.index]! : null;
  if (selector.last === true) return candidates.length > 0 ? candidates[candidates.length - 1]! : null;
  return candidates.length > 0 ? candidates[0]! : null;
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

function orCondition(pAutomation: bigint, first: bigint, second: bigint): bigint {
  const out = Buffer.alloc(8);
  if (vcall(pAutomation, SLOT.CreateOrCondition, [FFIType.u64, FFIType.u64, FFIType.ptr], [first, second, out.ptr!]) !== S_OK) return 0n;
  return out.readBigUInt64LE(0);
}

/** Build a server-side OR of ControlType property conditions ("Button OR Hyperlink OR MenuItem"), releasing every
 *  intermediate. Returns 0n if any part or fold fails (the caller then forces the client-side matches() pass). */
function controlTypesCondition(pAutomation: bigint, controlTypes: readonly number[]): bigint {
  const parts: bigint[] = [];
  for (const controlType of controlTypes) {
    const part = propertyConditionInt(pAutomation, PropertyId.ControlType, controlType);
    if (part === 0n) {
      for (const built of parts) comRelease(built);
      return 0n;
    }
    parts.push(part);
  }
  if (parts.length === 0) return 0n;
  let condition = parts[0]!;
  for (let index = 1; index < parts.length; index += 1) {
    const combined = orCondition(pAutomation, condition, parts[index]!);
    comRelease(condition);
    comRelease(parts[index]!);
    if (combined === 0n) {
      for (let rest = index + 1; rest < parts.length; rest += 1) comRelease(parts[rest]!);
      return 0n;
    }
    condition = combined;
  }
  return condition;
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
  // For each exact scalar: if the server-side property condition FAILS to build (part === 0n), do NOT silently drop the
  // predicate — force the client-side matches() pass so the dropped field is still verified exactly. Otherwise the
  // surviving server condition (or TrueCondition, when all parts drop) over-matches and the fast path would act on the
  // WRONG control (or the window root). A built predicate keeps the cheap server-only fast path.
  if (selector.controlType !== undefined) {
    const part = propertyConditionInt(pAutomation, PropertyId.ControlType, selector.controlType);
    if (part !== 0n) parts.push(part);
    else needsClientFilter = true;
  }
  if (selector.controlTypes !== undefined && selector.controlTypes.length > 0) {
    const part = controlTypesCondition(pAutomation, selector.controlTypes);
    if (part !== 0n) parts.push(part);
    else needsClientFilter = true;
  }
  if (typeof selector.name === 'string') {
    const part = propertyConditionString(pAutomation, PropertyId.Name, selector.name);
    if (part !== 0n) parts.push(part);
    else needsClientFilter = true;
  } else if (selector.name instanceof RegExp) {
    needsClientFilter = true;
  }
  if (selector.automationId !== undefined) {
    const part = propertyConditionString(pAutomation, PropertyId.AutomationId, selector.automationId);
    if (part !== 0n) parts.push(part);
    else needsClientFilter = true;
  }
  if (selector.className !== undefined) {
    const part = propertyConditionString(pAutomation, PropertyId.ClassName, selector.className);
    if (part !== 0n) parts.push(part);
    else needsClientFilter = true;
  }
  if (selector.nameContains !== undefined) needsClientFilter = true;
  if (selector.nameNot !== undefined) needsClientFilter = true; // negated name has no server part here — matches() rejects it client-side; never weakens the server AND of positives
  if (needsSubtreeFilter(selector)) needsClientFilter = true; // has/hasText/labeledBy is decided per-candidate from the live element (element.ts), never server-side — force the client pass that runs it
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
