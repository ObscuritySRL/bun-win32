import { describe, expect, test } from 'bun:test';

import { EditableText, parseGoTo } from './goto';

// 2026-10-12 15:30:00 local time.
const now = new Date(2026, 9, 12, 15, 30, 0).getTime();

describe('parseGoTo', () => {
  test('relative durations', () => {
    expect(parseGoTo('90s', now)).toBe(now - 90_000);
    expect(parseGoTo('90 s', now)).toBe(now - 90_000);
    expect(parseGoTo('5m', now)).toBe(now - 300_000);
    expect(parseGoTo('5 min', now)).toBe(now - 300_000);
    expect(parseGoTo('1h30m', now)).toBe(now - 5_400_000);
    expect(parseGoTo('2m 30s', now)).toBe(now - 150_000);
    expect(parseGoTo('0s', now)).toBe(now);
  });

  test('clock times today, or yesterday when later than now', () => {
    expect(parseGoTo('14:32', now)).toBe(new Date(2026, 9, 12, 14, 32, 0).getTime());
    expect(parseGoTo('14:32:07', now)).toBe(new Date(2026, 9, 12, 14, 32, 7).getTime());
    expect(parseGoTo('2:05 pm', now)).toBe(new Date(2026, 9, 12, 14, 5, 0).getTime());
    expect(parseGoTo('2:05PM', now)).toBe(new Date(2026, 9, 12, 14, 5, 0).getTime());
    expect(parseGoTo('9 am', now)).toBe(new Date(2026, 9, 12, 9, 0, 0).getTime());
    expect(parseGoTo('12:10 am', now)).toBe(new Date(2026, 9, 12, 0, 10, 0).getTime());
    expect(parseGoTo('16:00', now)).toBe(new Date(2026, 9, 11, 16, 0, 0).getTime());
  });

  test('garbage is rejected, not guessed', () => {
    for (const text of ['', ' ', 'abc', '99:99', '25:00', '-5m', '5x', '1:2:3:4', '13 pm', ':', 'm']) expect(parseGoTo(text, now)).toBeNull();
  });
});

describe('EditableText', () => {
  test('typing, backspace and word backspace', () => {
    const field = new EditableText();
    field.insert('2m 30s');
    expect(field.text).toBe('2m 30s');
    field.backspace(false);
    expect(field.text).toBe('2m 30');
    field.backspace(true);
    expect(field.text).toBe('2m ');
    field.backspace(true);
    expect(field.text).toBe('');
  });

  test('select all then type replaces', () => {
    const field = new EditableText();
    field.insert('14:32');
    field.selectAll();
    field.insert('5m');
    expect(field.text).toBe('5m');
    expect(field.caret).toBe(2);
  });

  test('caret movement and deletion in the middle', () => {
    const field = new EditableText();
    field.insert('1430');
    field.moveCaret(-2, false);
    field.insert(':');
    expect(field.text).toBe('14:30');
    field.moveCaret(1, false);
    field.deleteForward();
    expect(field.text).toBe('14:3');
    field.home(false);
    expect(field.caret).toBe(0);
    field.end(true);
    expect(field.selection).toEqual([0, 4]);
  });

  test('paste keeps only characters a time can contain, single line, bounded', () => {
    const field = new EditableText();
    field.paste('at 2:05\npm!!\u0007');
    expect(field.text).toBe('at 2:05 pm');
    field.selectAll();
    field.paste('x'.repeat(200));
    expect(field.text.length).toBe(24);
  });
});
