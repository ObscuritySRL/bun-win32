import { expect, test } from 'bun:test';

import { ControlType, PatternId, PropertyId, SLOT, TreeScope } from '../com/constants';

test('control-type ids match the SDK header', () => {
  expect(ControlType.Button).toBe(50000);
  expect(ControlType.Edit).toBe(50004);
  expect(ControlType.Document).toBe(50030);
  expect(ControlType.Window).toBe(50032);
  expect(ControlType.Pane).toBe(50033);
  // the two the original demo's map omitted
  expect(ControlType.SemanticZoom).toBe(50039);
  expect(ControlType.AppBar).toBe(50040);
});

test('control-type numeric enum reverse-maps id -> name', () => {
  expect(ControlType[50000]).toBe('Button');
  expect(ControlType[50004]).toBe('Edit');
  expect(ControlType[50033]).toBe('Pane');
});

test('pattern ids match the SDK header', () => {
  expect(PatternId.Invoke).toBe(10000);
  expect(PatternId.Value).toBe(10002);
  expect(PatternId.Text).toBe(10014);
  expect(PatternId.Toggle).toBe(10015);
  expect(PatternId.CustomNavigation).toBe(10033);
});

test('property ids match the SDK header', () => {
  expect(PropertyId.RuntimeId).toBe(30000);
  expect(PropertyId.ControlType).toBe(30003);
  expect(PropertyId.Name).toBe(30005);
  expect(PropertyId.AutomationId).toBe(30011);
  expect(PropertyId.NativeWindowHandle).toBe(30020);
});

test('TreeScope flags compose correctly', () => {
  expect(TreeScope.TreeScope_Subtree).toBe(TreeScope.TreeScope_Element | TreeScope.TreeScope_Children | TreeScope.TreeScope_Descendants);
  expect(TreeScope.TreeScope_Descendants).toBe(0x0000_0004);
  expect(TreeScope.TreeScope_Children).toBe(0x0000_0002);
});

test('the highest-risk slot is the header-correct ElementFromHandle = 6 (not 7)', () => {
  expect(SLOT.ElementFromHandle).toBe(6);
  expect(SLOT.ElementFromPoint).toBe(7);
  expect(SLOT.GetRootElement).toBe(5);
  expect(SLOT.FindAll).toBe(6);
  expect(SLOT.get_CurrentBoundingRectangle).toBe(43);
  expect(SLOT.Invoke).toBe(3);
});
