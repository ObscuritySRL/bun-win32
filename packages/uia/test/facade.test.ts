import { expect, test } from 'bun:test';

import { formatNoMatch, selectorToString } from '../element/condition';
import { ControlType } from '../com/constants';

test('selectorToString renders each field', () => {
  expect(selectorToString({ controlType: ControlType.Button, name: 'OK' })).toBe('{ controlType: Button, name: "OK" }');
  expect(selectorToString({ name: /^Save/ })).toBe('{ name: /^Save/ }');
  expect(selectorToString({ nameContains: 'ave', className: 'Button' })).toBe('{ nameContains: "ave", className: "Button" }');
  expect(selectorToString({ controlType: 50004 })).toBe('{ controlType: Edit }');
});

test('formatNoMatch quotes the selector, the window, and the nearest candidates', () => {
  const message = formatNoMatch({ name: 'OK' }, 'Save As', ['Save', 'Cancel', 'Help', '']);
  expect(message).toBe('no element matched { name: "OK" } in "Save As" — nearest: "Save", "Cancel", "Help"');
});

test('formatNoMatch omits the nearest clause when there are no named candidates', () => {
  expect(formatNoMatch({ controlType: ControlType.Button }, 'Empty', [])).toBe('no element matched { controlType: Button } in "Empty"');
});

test('formatNoMatch caps the candidate list at eight', () => {
  const many = Array.from({ length: 20 }, (_value, index) => `c${index}`);
  const message = formatNoMatch({ name: 'x' }, 'W', many);
  expect(message.match(/c\d+/g)?.length).toBe(8);
});

test('formatNoMatch names the available control types when a controlType missed and nothing ranked by name', () => {
  const message = formatNoMatch({ controlType: ControlType.Edit }, 'Untitled - Notepad', [], ['Document', 'Text', 'Button']);
  expect(message).toBe('no element matched { controlType: Edit } in "Untitled - Notepad" (no controlType "Edit" here — this window exposes: Document, Text, Button — retry with one of those, or drop controlType)');
});

test('formatNoMatch suppresses the controlType clause when names ranked (existing name-miss path is unchanged)', () => {
  expect(formatNoMatch({ controlType: ControlType.Document }, 'Untitled - Notepad', ['Text editor'], ['Document', 'Text'])).toBe('no element matched { controlType: Document } in "Untitled - Notepad" — nearest: "Text editor"');
});
