import { describe, expect, test } from 'bun:test';

import { fold, matchTerm, oneEditAway, tokenize } from './search';

describe('fold', () => {
  test('collapses the characters OCR confuses most', () => {
    expect(fold('Robiox')).toBe(fold('roblox'));
    expect(fold('modem')).toBe(fold('modern'));
    expect(fold('C0DE')).toBe(fold('code'));
    expect(fold('5ign')).toBe(fold('sign'));
  });
});

describe('oneEditAway', () => {
  test('finds a pattern with one substitution, insertion or deletion', () => {
    expect(oneEditAway('verificatlon', 'verification')).toBe(true);
    expect(oneEditAway('verifcation', 'verification')).toBe(true);
    expect(oneEditAway('verifiication', 'verification')).toBe(true);
    expect(oneEditAway('the verification code', 'verification')).toBe(true);
    expect(oneEditAway('vertical', 'verification')).toBe(false);
  });
});

describe('matchTerm', () => {
  test('exact prefix beats substring beats folded beats one edit', () => {
    const prefix = matchTerm('verification', 'veri');
    const inside = matchTerm('reverify', 'veri');
    const folded = matchTerm('robiox', 'roblox');
    const fuzzy = matchTerm('verifcation', 'verification');
    expect(prefix).toBeGreaterThan(inside);
    expect(inside).toBeGreaterThan(folded);
    expect(folded).toBeGreaterThan(fuzzy);
    expect(fuzzy).toBeGreaterThan(0);
    expect(matchTerm('config', 'zebra')).toBe(0);
  });

  test('short terms never match fuzzily', () => {
    expect(matchTerm('cat', 'cut')).toBe(0);
    expect(matchTerm('482', '482')).toBeGreaterThan(0);
  });
});

describe('tokenize', () => {
  test('splits on whitespace and keeps digits together', () => {
    expect(tokenize('  Door code 7149 ')).toEqual(['door', 'code', '7149']);
    expect(tokenize('')).toEqual([]);
  });
});
