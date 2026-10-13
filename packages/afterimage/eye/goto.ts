// "Go to": type `14:32`, `2:05 pm`, `90s`, `5m` or `1h30m` to jump there. The parser refuses
// anything it would have to guess at; the field behaves like every Windows text box
// (caret, selection, Ctrl+A, Ctrl+Backspace, paste).

const durationPattern = /^(?:\d+\s*(?:h|hr|hrs|hours?|m|mins?|minutes?|s|secs?|seconds?)\s*)+$/;
const durationPartPattern = /(\d+)\s*(h|hr|hrs|hours?|m|mins?|minutes?|s|secs?|seconds?)/g;
const clockPattern = /^(\d{1,2})(?::(\d{2}))?(?::(\d{2}))?\s*(am|pm|a|p)?$/;
const maximumLength = 24;
const unitMilliseconds: Record<string, number> = { h: 3_600_000, m: 60_000, s: 1_000 };

/** The epoch to jump to, or null when the text isn't a time. Clock times later than now mean yesterday. */
export function parseGoTo(text: string, now: number): number | null {
  const input = text.trim().toLowerCase();
  if (input.length === 0) return null;
  if (durationPattern.test(input)) {
    let total = 0;
    for (const [, amount, unit] of input.matchAll(durationPartPattern)) total += Number(amount) * unitMilliseconds[unit![0]!]!;
    return now - total;
  }
  const clock = clockPattern.exec(input);
  if (clock === null) return null;
  const [, hourText, minuteText, secondText, meridiem] = clock;
  if (minuteText === undefined && meridiem === undefined) return null;
  let hour = Number(hourText);
  const minute = minuteText === undefined ? 0 : Number(minuteText);
  const second = secondText === undefined ? 0 : Number(secondText);
  if (minute > 59 || second > 59) return null;
  if (meridiem !== undefined) {
    if (hour < 1 || hour > 12) return null;
    hour = (hour % 12) + (meridiem.startsWith('p') ? 12 : 0);
  } else if (hour > 23) return null;
  const target = new Date(now);
  target.setHours(hour, minute, second, 0);
  if (target.getTime() > now) target.setDate(target.getDate() - 1);
  return target.getTime();
}

export class EditableText {
  #anchor = 0;
  #caret = 0;
  #text = '';

  get caret(): number {
    return this.#caret;
  }

  /** [start, end) of the selection; equal when nothing is selected. */
  get selection(): [number, number] {
    return [Math.min(this.#anchor, this.#caret), Math.max(this.#anchor, this.#caret)];
  }

  get text(): string {
    return this.#text;
  }

  backspace(word: boolean): void {
    if (this.#deleteSelection()) return;
    let start = this.#caret;
    if (word) {
      while (start > 0 && this.#text[start - 1] === ' ') start -= 1;
      while (start > 0 && this.#text[start - 1] !== ' ') start -= 1;
    } else start = Math.max(0, start - 1);
    this.#replace(start, this.#caret, '');
  }

  clear(): void {
    this.#text = '';
    this.#caret = 0;
    this.#anchor = 0;
  }

  deleteForward(): void {
    if (this.#deleteSelection()) return;
    this.#replace(this.#caret, Math.min(this.#text.length, this.#caret + 1), '');
  }

  end(extend: boolean): void {
    this.#moveTo(this.#text.length, extend);
  }

  home(extend: boolean): void {
    this.#moveTo(0, extend);
  }

  insert(characters: string): void {
    const [start, end] = this.selection;
    const room = maximumLength - (this.#text.length - (end - start));
    this.#replace(start, end, characters.slice(0, Math.max(0, room)));
  }

  moveCaret(delta: number, extend: boolean): void {
    const [start, end] = this.selection;
    if (!extend && start !== end) this.#moveTo(delta < 0 ? start : end, false);
    else this.#moveTo(Math.min(this.#text.length, Math.max(0, this.#caret + delta)), extend);
  }

  /** Clipboard text is flattened to one line and reduced to characters a time can contain. */
  paste(clipboard: string): void {
    this.insert(
      clipboard
        .replace(/[\r\n\t]+/g, ' ')
        .replace(/[^0-9a-zA-Z: ]/g, '')
        .replace(/ {2,}/g, ' '),
    );
  }

  selectAll(): void {
    this.#anchor = 0;
    this.#caret = this.#text.length;
  }

  #deleteSelection(): boolean {
    const [start, end] = this.selection;
    if (start === end) return false;
    this.#replace(start, end, '');
    return true;
  }

  #moveTo(position: number, extend: boolean): void {
    this.#caret = position;
    if (!extend) this.#anchor = position;
  }

  #replace(start: number, end: number, characters: string): void {
    this.#text = this.#text.slice(0, start) + characters + this.#text.slice(end);
    this.#caret = start + characters.length;
    this.#anchor = this.#caret;
  }
}
