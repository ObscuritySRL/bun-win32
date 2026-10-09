// Search over three fields per window — title, application, and the text Iris has read from the window itself
// (OCR of its pixels, or its UI Automation tree when it is minimized). Titles and apps are matched fuzzily (substring
// first, then an fzf-style subsequence with word-boundary bonuses); content is matched by word prefix/substring, then
// tolerantly of OCR misreads (confusable characters folded, then one edit away), and
// every hit carries its rectangle so the card can light up the exact words on the live window.

export type TextSource = 'accessibility' | 'ocr';

export interface IndexedText {
  /** The line the word belongs to (for snippets). */
  line: string;
  lower: string;
  /** Unit-space rectangle on the window (x0, y0, x1, y1), or null when the source has no geometry. */
  rect: readonly [number, number, number, number] | null;
  source: TextSource;
  text: string;
}

export interface SearchDocument {
  app: string;
  content: readonly IndexedText[];
  title: string;
}

export interface Snippet {
  ranges: [number, number][];
  source: TextSource;
  text: string;
}

export interface SearchResult {
  appRanges: [number, number][];
  contentHits: IndexedText[];
  score: number;
  snippet: Snippet | null;
  titleRanges: [number, number][];
}

function isBoundary(text: string, index: number): boolean {
  if (index === 0) return true;
  const previous = text[index - 1]!;
  return /[\s\-_./\\|:([{]/.test(previous) || (previous === previous.toLowerCase() && text[index] !== text[index]!.toLowerCase());
}

/** Score `term` against `text`; returns the score and matched character ranges, or null. */
function matchField(text: string, lower: string, term: string): { score: number; ranges: [number, number][] } | null {
  const at = lower.indexOf(term);
  if (at >= 0) {
    let score = 100 + term.length * 4;
    if (isBoundary(text, at)) score += 40;
    if (at === 0) score += 25;
    score -= Math.min(at, 40) * 0.5;
    return { ranges: [[at, term.length]], score };
  }
  if (term.length < 2) return null;
  const ranges: [number, number][] = [];
  let score = 0;
  let position = 0;
  let run = 0;
  for (const character of term) {
    const found = lower.indexOf(character, position);
    if (found < 0) return null;
    if (found === position && ranges.length > 0) {
      ranges[ranges.length - 1]![1] += 1;
      run += 1;
      score += 6 + run * 2;
    } else {
      ranges.push([found, 1]);
      run = 0;
      score += isBoundary(text, found) ? 12 : 1;
      score -= Math.min(found - position, 12) * 0.6;
    }
    position = found + 1;
  }
  return score > term.length * 3 ? { ranges, score } : null;
}

function mergeRanges(ranges: [number, number][]): [number, number][] {
  const sorted = [...ranges].sort((first, second) => first[0] - second[0]);
  const merged: [number, number][] = [];
  for (const [start, length] of sorted) {
    const last = merged[merged.length - 1];
    if (last !== undefined && start <= last[0] + last[1]) last[1] = Math.max(last[1], start + length - last[0]);
    else merged.push([start, length]);
  }
  return merged;
}

function buildSnippet(hit: IndexedText, terms: readonly string[], maximum = 72): Snippet {
  const line = hit.line.length > 0 ? hit.line : hit.text;
  const lower = line.toLowerCase();
  let first = lower.length;
  for (const term of terms) {
    const at = lower.indexOf(term);
    if (at >= 0) first = Math.min(first, at);
  }
  if (first === lower.length) first = Math.max(0, lower.indexOf(hit.lower));
  let start = Math.max(0, first - Math.floor(maximum * 0.3));
  if (lower.length - start < maximum) start = Math.max(0, lower.length - maximum);
  const end = Math.min(line.length, start + maximum);
  const prefix = start > 0 ? '…' : '';
  const suffix = end < line.length ? '…' : '';
  const text = `${prefix}${line.slice(start, end).trim()}${suffix}`;
  const textLower = text.toLowerCase();
  const ranges: [number, number][] = [];
  for (const term of terms) {
    let at = textLower.indexOf(term);
    while (at >= 0) {
      ranges.push([at, term.length]);
      at = textLower.indexOf(term, at + term.length);
    }
  }
  // A tolerant hit (the query matched a misread word): light up the word as it was read.
  if (ranges.length === 0) {
    const at = textLower.indexOf(hit.lower);
    if (at >= 0) ranges.push([at, hit.lower.length]);
  }
  return { ranges: mergeRanges(ranges), source: hit.source, text };
}

const foldedEntries = new WeakMap<IndexedText, string>();

/** Collapse the characters OCR confuses most (l/I/1/|, O/0, rn/m, vv/w, 5/s) so a typed word and its misread compare
 *  equal: "roblox" finds a window that OCR read as "robiox". */
export function foldConfusables(text: string): string {
  return text
    .toLowerCase()
    .replace(/rn/g, 'm')
    .replace(/vv/g, 'w')
    .replace(/[il1|!]/g, 'i')
    .replace(/0/g, 'o')
    .replace(/5/g, 's');
}

function folded(entry: IndexedText): string {
  let value = foldedEntries.get(entry);
  if (value === undefined) {
    value = foldConfusables(entry.text);
    foldedEntries.set(entry, value);
  }
  return value;
}

/** Per-character bitmasks of the pattern being matched (bit i: pattern[i] is this character), cleared after each use. */
const characterMasks = new Int32Array(0x1_0000);

/** Which entries contain `pattern` with at most one insertion, deletion, or substitution — Wu–Manber bit-parallel
 *  matching: two 32-bit state words per character of text (exact, and one edit), whatever the pattern length. */
function nearlyContaining(entries: readonly IndexedText[], pattern: string): IndexedText[] {
  const length = Math.min(pattern.length, 31);
  for (let index = 0; index < length; index += 1) characterMasks[pattern.charCodeAt(index)]! |= 1 << index;
  const goal = 1 << (length - 1);
  const hits: IndexedText[] = [];
  for (const entry of entries) {
    const text = folded(entry);
    if (text.length < length - 1) continue;
    let exact = 0;
    let oneEdit = 1;
    for (let position = 0; position < text.length; position += 1) {
      const mask = characterMasks[text.charCodeAt(position)]!;
      const previousExact = exact;
      exact = ((exact << 1) | 1) & mask;
      // match | substitution | insertion | deletion
      oneEdit = (((oneEdit << 1) | 1) & mask) | (previousExact << 1) | 1 | previousExact | (exact << 1);
      if ((oneEdit & goal) !== 0) {
        hits.push(entry);
        break;
      }
    }
  }
  for (let index = 0; index < length; index += 1) characterMasks[pattern.charCodeAt(index)] = 0;
  return hits;
}

export function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter((term) => term.length > 0);
}

/** Every term must match somewhere (title, app, or content). Returns null when the window does not match. */
export function search(terms: readonly string[], document: SearchDocument): SearchResult | null {
  if (terms.length === 0) return { appRanges: [], contentHits: [], score: 0, snippet: null, titleRanges: [] };
  const titleLower = document.title.toLowerCase();
  const appLower = document.app.toLowerCase();
  const titleRanges: [number, number][] = [];
  const appRanges: [number, number][] = [];
  const contentHits: IndexedText[] = [];
  let score = 0;
  for (const term of terms) {
    const title = matchField(document.title, titleLower, term);
    const app = matchField(document.app, appLower, term);
    let best = 0;
    if (title !== null) {
      titleRanges.push(...title.ranges);
      best = Math.max(best, title.score * 1.2);
    }
    if (app !== null) {
      appRanges.push(...app.ranges);
      best = Math.max(best, app.score * 0.85);
    }
    let contentScore = 0;
    if (term.length >= 2) {
      for (const entry of document.content) {
        const at = entry.lower.indexOf(term);
        if (at < 0) continue;
        contentHits.push(entry);
        contentScore = Math.max(contentScore, (at === 0 ? 70 : 45) + (entry.lower.length === term.length ? 20 : 0));
      }
      // No exact hit: OCR may have misread the word. Try the confusion-folded form, then one edit away (long terms only).
      if (contentScore === 0 && term.length >= 3) {
        const foldedTerm = foldConfusables(term);
        for (const entry of document.content) {
          if (!folded(entry).includes(foldedTerm)) continue;
          contentHits.push(entry);
          contentScore = 38;
        }
        if (contentScore === 0 && foldedTerm.length >= 5) {
          const near = nearlyContaining(document.content, foldedTerm);
          contentHits.push(...near);
          if (near.length > 0) contentScore = 30;
        }
      }
      if (contentScore > 0) best = Math.max(best, contentScore + Math.min(contentHits.length, 20));
    }
    if (best === 0) return null;
    score += best;
  }
  const snippetSource = titleRanges.length > 0 && contentHits.length === 0 ? null : (contentHits[0] ?? null);
  return {
    appRanges: mergeRanges(appRanges),
    contentHits,
    score,
    snippet: snippetSource === null ? null : buildSnippet(snippetSource, terms),
    titleRanges: mergeRanges(titleRanges),
  };
}
