import { expect, test } from 'bun:test';

import { matches, needsSubtreeFilter, selectorToString } from '../element/condition';
import { ControlType } from '../com/constants';

const button = { name: 'Five', controlType: ControlType.Button, automationId: 'num5Button', className: 'Button' };

test('name exact match', () => {
  expect(matches(button, { name: 'Five' })).toBe(true);
  expect(matches(button, { name: 'Six' })).toBe(false);
});

test('name regular expression', () => {
  expect(matches(button, { name: /^F/ })).toBe(true);
  expect(matches(button, { name: /ive$/ })).toBe(true);
  expect(matches(button, { name: /^X/ })).toBe(false);
});

test('nameContains substring', () => {
  expect(matches(button, { nameContains: 'iv' })).toBe(true);
  expect(matches(button, { nameContains: 'zzz' })).toBe(false);
});

test('controlType by named enum and raw id', () => {
  expect(matches(button, { controlType: ControlType.Button })).toBe(true);
  expect(matches(button, { controlType: 50000 })).toBe(true);
  expect(matches(button, { controlType: ControlType.Edit })).toBe(false);
});

test('automationId exact', () => {
  expect(matches(button, { automationId: 'num5Button' })).toBe(true);
  expect(matches(button, { automationId: 'nope' })).toBe(false);
});

test('className exact', () => {
  expect(matches(button, { className: 'Button' })).toBe(true);
  expect(matches(button, { className: 'Edit' })).toBe(false);
});

test('multi-field AND', () => {
  expect(matches(button, { controlType: ControlType.Button, name: 'Five' })).toBe(true);
  expect(matches(button, { controlType: ControlType.Button, name: 'Six' })).toBe(false);
  expect(matches(button, { controlType: ControlType.Edit, name: 'Five' })).toBe(false);
  expect(matches(button, { controlType: ControlType.Button, name: /^F/, className: 'Button' })).toBe(true);
});

test('empty selector matches everything', () => {
  expect(matches(button, {})).toBe(true);
});

// labeledBy (Playwright getByLabel / FlaUI relational) is a live-element filter: matches() must IGNORE it (never reject
// on it — element.ts subtreeMatches folds in the live LabeledBy read), needsSubtreeFilter must FLAG it so the client
// pass runs, and selectorToString must render it. Without the field these all behave as for an unknown key.
test('labeledBy is a live-element filter (pure layer)', () => {
  expect(needsSubtreeFilter({ labeledBy: 'Username' })).toBe(true);
  expect(needsSubtreeFilter({ name: 'Five' })).toBe(false);
  expect(matches(button, { controlType: ControlType.Button, labeledBy: 'whatever' })).toBe(true); // ignored — folded in live
  expect(matches(button, { controlType: ControlType.Edit, labeledBy: 'whatever' })).toBe(false); // still rejects a real property mismatch
  expect(selectorToString({ controlType: ControlType.Edit, labeledBy: 'Username' })).toContain('labeledBy: "Username"');
});
