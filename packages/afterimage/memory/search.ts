// Matching typed words against words read from the screen by OCR — which misreads. A term scores
// highest as a word prefix, then as a substring, then after folding the characters OCR confuses
// (l/I/1, O/0, rn/m, 5/s), then — for longer terms only — one edit away (bit-parallel, Wu–Manber).

const prefixScore = 100;
const substringScore = 70;
const foldedScore = 45;
const fuzzyScore = 25;

/** Lower-case and collapse OCR's usual confusions, so "roblox" and a misread "robiox" compare equal. */
export function fold(text: string): string {
  return text
    .toLowerCase()
    .replace(/rn/g, 'm')
    .replace(/vv/g, 'w')
    .replace(/[il1|!]/g, 'i')
    .replace(/0/g, 'o')
    .replace(/5/g, 's');
}

/** How well `term` (already lower-case) matches `word`; 0 when it doesn't. */
export function matchTerm(word: string, term: string): number {
  const lower = word.toLowerCase();
  if (lower.startsWith(term)) return prefixScore + (lower.length === term.length ? 20 : 0);
  if (lower.includes(term)) return substringScore;
  if (term.length < 3) return 0;
  const foldedTerm = fold(term);
  const foldedWord = fold(word);
  if (foldedWord.includes(foldedTerm)) return foldedScore;
  if (foldedTerm.length >= 5 && oneEditAway(foldedWord, foldedTerm)) return fuzzyScore;
  return 0;
}

/** Does `text` contain `pattern` with at most one substitution, insertion or deletion? */
export function oneEditAway(text: string, pattern: string): boolean {
  const length = Math.min(pattern.length, 31);
  const masks = new Map<number, number>();
  for (let index = 0; index < length; index += 1) masks.set(pattern.charCodeAt(index), (masks.get(pattern.charCodeAt(index)) ?? 0) | (1 << index));
  const goal = 1 << (length - 1);
  let exact = 0;
  let oneEdit = 0;
  for (let position = 0; position < text.length; position += 1) {
    const mask = masks.get(text.charCodeAt(position)) ?? 0;
    const previousExact = exact;
    const previousOneEdit = oneEdit;
    exact = ((previousExact << 1) | 1) & mask;
    // Extend a one-edit match by a matching character, or spend the edit: substitution, insertion, deletion.
    oneEdit = (((previousOneEdit << 1) | 1) & mask) | ((previousExact << 1) | 1) | previousExact | (exact << 1);
    if ((exact & goal) !== 0 || (oneEdit & goal) !== 0) return true;
  }
  return false;
}

export function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter((term) => term.length > 0);
}
