/**
 * claude-tui — a living, faithful recreation of the Claude Code terminal UI,
 * rendered on the character-grid engine `_textterm`. A scrollable transcript of
 * styled blocks (user prompts, a token-by-token streaming assistant reply, a
 * bordered tool-use panel, a red/green unified diff, a filling TODO checklist and
 * an animated braille spinner) sits above a rounded input box with a `>` prompt
 * and a blinking caret. Everything is driven deterministically from `time`: an
 * attract director auto-plays scripted sessions so a headless capture lands on a
 * full, populated transcript. Live input (typing, backspace, enter, arrow/wheel
 * scroll, hover highlight) takes control on interaction and the attract show
 * resumes after a few idle seconds. No per-frame allocation in steady state.
 *
 * Renders UNCAPPED by default (the char-grid engine builds frames at ~10k+ fps,
 * far past the old 60fps throttle), so the top-right readout shows the true
 * ceiling. Set TERM_FPS=<n> to cap it — e.g. TERM_FPS=120 for a calm interactive
 * cap, TERM_FPS=60 for the original behaviour.
 */
import { CharTerm, runText } from '@bun-win32/terminal';
import type { RGB } from '@bun-win32/terminal';

import { clamp } from './_kit';

// ── Palette (the real Claude Code look) ──────────────────────────────────────────
const BG: RGB = [16, 16, 20];
const PANEL_BG: RGB = [22, 22, 28];
const INPUT_BG: RGB = [24, 24, 30];
const INK: RGB = [222, 224, 234];
const DIM: RGB = [128, 130, 146];
const FAINT: RGB = [92, 94, 108];
const CLAY: RGB = [235, 130, 90];
const CLAY_DIM: RGB = [176, 102, 72];
const CHROME: RGB = [70, 72, 86];
const GREEN: RGB = [120, 200, 140];
const RED: RGB = [232, 110, 110];
const ADD_FG: RGB = [128, 210, 150];
const DEL_FG: RGB = [236, 124, 124];
const ADD_BG: RGB = [16, 34, 22];
const DEL_BG: RGB = [40, 18, 20];
const CODE_KW: RGB = [196, 148, 236];
const CODE_STR: RGB = [148, 196, 132];
const CODE_FN: RGB = [126, 178, 240];
const CODE_NUM: RGB = [232, 184, 124];
const TOOL_OUT: RGB = [150, 158, 176];
const TODO_DONE: RGB = [120, 200, 140];
const TODO_ACTIVE: RGB = [235, 178, 110];
const SEL_BG: RGB = [30, 34, 44];
const BAR_BG: RGB = [26, 23, 28]; // top chrome, faintly clay-warmed
const RAIL: RGB = [42, 40, 52]; // left transcript rail
const METER_FILL: RGB = [120, 200, 140];
const METER_WARM: RGB = [235, 178, 110];
const METER_TRACK: RGB = [48, 46, 58];

// ── Transcript block model ───────────────────────────────────────────────────────
// A block renders into a span of transcript rows. `reveal` (0..1) is animated by
// the director so streaming / fills / panels grow in over time.
type Block =
  | { kind: 'welcome' }
  | { kind: 'user'; text: string }
  | { kind: 'assistant'; text: string; reveal: number }
  | { kind: 'tool'; head: string; status: 'run' | 'done'; lines: ToolLine[]; reveal: number }
  | { kind: 'diff'; file: string; rows: DiffRow[]; reveal: number }
  | { kind: 'todo'; items: TodoItem[] }
  | { kind: 'spinner'; verb: string; t0: number }
  | { kind: 'note'; text: string };

interface ToolLine {
  text: string;
  tone: 'out' | 'ok' | 'err';
}
interface DiffRow {
  sign: ' ' | '+' | '-';
  text: string;
}
interface TodoItem {
  text: string;
  state: 0 | 1 | 2;
} // 0 pending, 1 active, 2 done

// Braille spinner frames (render fine in the live TTY; PNG shows a dot, still alive).
const SPIN = '⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏';

// Caret blink — a real terminal cursor pulses near ~1.7Hz with a longer ON than
// OFF dwell (it lingers solid, then winks). Modelled deterministically from `time`
// with a 62% on-duty cycle and a phase chosen so a headless capture (t=0,3,6,9)
// always lands on a solid caret, keeping the streaming cursor visible in the PNG.
const BLINK_HZ = 1.7;
const BLINK_DUTY = 0.62;
const caretLit = (time: number, phase = 0): boolean => (((time * BLINK_HZ + phase) % 1) + 1) % 1 < BLINK_DUTY;

// ── Scripted sessions (deterministic content for the attract director) ───────────
interface Session {
  prompt: string;
  reply: string;
  verb: string;
  tool: { head: string; lines: ToolLine[] };
  diff: { file: string; rows: DiffRow[] };
  verify: { head: string; lines: ToolLine[] }; // post-edit test run
  todos: TodoItem[];
}

const SESSIONS: Session[] = [
  {
    prompt: 'refactor the auth module to use async tokens',
    verb: 'Thinking',
    reply: "I'll refactor the auth flow to issue and verify tokens asynchronously. " + "I'll read the current module, swap the sync verify for a promise-based one, " + 'and update the call sites and tests.',
    tool: {
      head: '● Read(src/auth.ts)',
      lines: [
        { text: 'export function verifyToken(t: string): boolean {', tone: 'out' },
        { text: '  return crypto.timingSafeEqual(sign(t), t.sig);', tone: 'out' },
        { text: '}  // 1 of 3 call sites are already async', tone: 'out' },
        { text: 'Read 48 lines', tone: 'ok' },
      ],
    },
    diff: {
      file: 'src/auth.ts',
      rows: [
        { sign: ' ', text: 'import { sign, hash } from "./crypto";' },
        { sign: '-', text: 'export function verifyToken(t: string): boolean {' },
        { sign: '-', text: '  return safeEqual(sign(t), t.sig);' },
        { sign: '+', text: 'export async function verifyToken(t: string): Promise<boolean> {' },
        { sign: '+', text: '  const expected = await sign(t);' },
        { sign: '+', text: '  return safeEqual(expected, t.sig);' },
        { sign: ' ', text: '}' },
      ],
    },
    verify: {
      head: '● Bash(bun test auth)',
      lines: [
        { text: '$ bun test test/auth.test.ts', tone: 'out' },
        { text: '  ✓ issues an async token  (2 ms)', tone: 'ok' },
        { text: '  ✓ verifyToken awaits the signature  (3 ms)', tone: 'ok' },
        { text: '9 pass · 0 fail · 24 expect()', tone: 'ok' },
      ],
    },
    todos: [
      { text: 'Read src/auth.ts and map call sites', state: 0 },
      { text: 'Make verifyToken async + Promise<boolean>', state: 0 },
      { text: 'Update 3 call sites to await', state: 0 },
      { text: 'Run bun test to confirm green', state: 0 },
    ],
  },
  {
    prompt: 'add a retry wrapper around the fetch client',
    verb: 'Working',
    reply: "Good idea. I'll wrap fetchJSON with exponential backoff, jittered delays " + 'and a max-attempt cap, then verify the suite still passes.',
    tool: {
      head: '● Bash(bun test net/)',
      lines: [
        { text: '$ bun test net/', tone: 'out' },
        { text: 'net/client.test.ts:', tone: 'out' },
        { text: '  ✓ retries on 503 then succeeds  (4 ms)', tone: 'ok' },
        { text: '12 pass · 0 fail · 31 expect()', tone: 'ok' },
      ],
    },
    diff: {
      file: 'src/net/client.ts',
      rows: [
        { sign: ' ', text: 'export async function fetchJSON(url: string) {' },
        { sign: '-', text: '  const res = await fetch(url);' },
        { sign: '-', text: '  return res.json();' },
        { sign: '+', text: '  return withRetry(() => fetch(url), {' },
        { sign: '+', text: '    attempts: 4, base: 200, jitter: true,' },
        { sign: '+', text: '  }).then((r) => r.json());' },
        { sign: ' ', text: '}' },
      ],
    },
    verify: {
      head: '● Bash(bun test net/)',
      lines: [
        { text: '$ bun test net/client.test.ts', tone: 'out' },
        { text: '  ✓ retries on 503 then succeeds  (4 ms)', tone: 'ok' },
        { text: '  ✓ gives up after 4 attempts  (1 ms)', tone: 'ok' },
        { text: '12 pass · 0 fail · 31 expect()', tone: 'ok' },
      ],
    },
    todos: [
      { text: 'Sketch withRetry(backoff, jitter, cap)', state: 0 },
      { text: 'Wrap fetchJSON call path', state: 0 },
      { text: 'Add 503-then-200 regression test', state: 0 },
      { text: 'bun test net/ → all green', state: 0 },
    ],
  },
  {
    prompt: 'fix the memory leak in the LRU cache',
    verb: 'Reasoning',
    reply: 'Found it — entries are evicted from the map but their timers are never ' + "cleared, so they pin the values. I'll clear the timer on eviction and cap " + 'the map, then prove it holds steady under load.',
    tool: {
      head: '● Grep(setTimeout in cache.ts)',
      lines: [
        { text: 'src/cache.ts:', tone: 'out' },
        { text: '  this.timers.set(key, setTimeout(fn, ttl));', tone: 'out' },
        { text: '  // delete() drops the entry but leaks its timer', tone: 'out' },
        { text: '2 matches in 1 file', tone: 'ok' },
      ],
    },
    diff: {
      file: 'src/cache.ts',
      rows: [
        { sign: ' ', text: 'evict(key: string): void {' },
        { sign: '-', text: '  this.map.delete(key);' },
        { sign: '+', text: '  const timer = this.timers.get(key);' },
        { sign: '+', text: '  if (timer) clearTimeout(timer);' },
        { sign: '+', text: '  this.timers.delete(key);' },
        { sign: '+', text: '  this.map.delete(key);' },
        { sign: ' ', text: '}' },
      ],
    },
    verify: {
      head: '● Bash(bun test cache --heap)',
      lines: [
        { text: '$ bun test test/cache.test.ts', tone: 'out' },
        { text: '  ✓ clears timers on eviction  (1 ms)', tone: 'ok' },
        { text: '  ✓ heap stays flat over 10k ops  (12 ms)', tone: 'ok' },
        { text: '7 pass · 0 fail · 18 expect()', tone: 'ok' },
      ],
    },
    todos: [
      { text: 'Grep for orphaned setTimeout handles', state: 0 },
      { text: 'Clear timer + delete on evict()', state: 0 },
      { text: 'Cap map size with LRU eviction', state: 0 },
      { text: 'Assert flat heap over 10k ops', state: 0 },
    ],
  },
];

// ── Attract timeline (deterministic phases, seconds) ─────────────────────────────
// One loop = T_LOOP seconds. We map `time` into the loop and rebuild block state.
const T = {
  promptStart: 0.4,
  promptCps: 42, // chars/sec typed in the prompt
  thinkLead: 0.35, // pause after submit before streaming
  thinkHold: 1.1, // spinner-only duration
  replyCps: 96, // chars/sec streamed (slow enough that a capture catches mid-stream)
  toolGrow: 0.8, // tool panel reveal duration
  toolHold: 0.5,
  diffGrow: 0.85,
  diffHold: 0.5,
  verifyGrow: 0.6, // post-edit test panel reveal
  verifyHold: 0.5,
  todoStep: 0.42, // per-todo tick interval
  finalHold: 3.0, // dwell on the completed transcript (keeps captures full)
  reset: 0.9,
};

// Warm-start the attract clock so a headless capture never lands on the dead
// pre-prompt pause: at sim t=0 the director is already a few seconds into a
// session (tool panel + diff on screen), and every frame across [0,CAPTURE_T]
// stays inside one session's rich region.
const ATTRACT_T0 = 3.6;

interface BuildResult {
  blocks: Block[];
  inputText: string;
}

// Compute the per-session loop length from the script + content sizes.
function loopLength(s: Session): number {
  const promptT = s.prompt.length / T.promptCps;
  const replyT = s.reply.length / T.replyCps;
  const todoT = s.todos.length * T.todoStep + 0.6;
  return T.promptStart + promptT + T.thinkLead + T.thinkHold + replyT + 0.4 + T.toolGrow + T.toolHold + T.diffGrow + T.diffHold + T.verifyGrow + T.verifyHold + todoT + T.finalHold + T.reset;
}

// Build the transcript state for a session at local time `lt` (0..loopLen).
function buildSession(s: Session, lt: number): BuildResult {
  const blocks: Block[] = [];

  const promptT = s.prompt.length / T.promptCps;
  const replyT = s.reply.length / T.replyCps;

  let cur = T.promptStart;

  // Phase 1: type the prompt into the input box (caret visible there).
  if (lt < cur) return { blocks, inputText: '' };
  const typeEnd = cur + promptT;
  if (lt < typeEnd) {
    const n = Math.floor((lt - cur) * T.promptCps);
    return { blocks, inputText: s.prompt.slice(0, Math.min(s.prompt.length, n)) };
  }
  cur = typeEnd;

  // From here the prompt is "submitted": it appears as a user line in transcript.
  blocks.push({ kind: 'user', text: s.prompt });
  const submitAt = cur;

  // Phase 2: think lead + spinner-only hold.
  const thinkEnd = cur + T.thinkLead + T.thinkHold;
  if (lt < thinkEnd) {
    blocks.push({ kind: 'spinner', verb: s.verb, t0: submitAt });
    return { blocks, inputText: '' };
  }
  cur = thinkEnd;

  // Phase 3: stream the assistant reply token-by-token.
  const reveal = clamp((lt - cur) / replyT, 0, 1);
  blocks.push({ kind: 'assistant', text: s.reply, reveal });
  const replyEnd = cur + replyT;
  if (lt < replyEnd) {
    blocks.push({ kind: 'spinner', verb: s.verb, t0: submitAt });
    return { blocks, inputText: '' };
  }
  cur = replyEnd + 0.4;

  // Phase 4: tool-use panel grows in.
  const toolReveal = clamp((lt - cur) / T.toolGrow, 0, 1);
  blocks.push({
    kind: 'tool',
    head: s.tool.head,
    status: lt > cur + T.toolGrow ? 'done' : 'run',
    lines: s.tool.lines,
    reveal: toolReveal,
  });
  const toolEnd = cur + T.toolGrow + T.toolHold;
  if (lt < toolEnd) return { blocks, inputText: '' };
  cur = toolEnd;

  // Phase 5: unified diff grows in.
  const diffReveal = clamp((lt - cur) / T.diffGrow, 0, 1);
  blocks.push({ kind: 'diff', file: s.diff.file, rows: s.diff.rows, reveal: diffReveal });
  const diffEnd = cur + T.diffGrow + T.diffHold;
  if (lt < diffEnd) return { blocks, inputText: '' };
  cur = diffEnd;

  // Phase 5b: post-edit test run grows in (read → edit → verify narrative).
  const verifyReveal = clamp((lt - cur) / T.verifyGrow, 0, 1);
  blocks.push({
    kind: 'tool',
    head: s.verify.head,
    status: lt > cur + T.verifyGrow ? 'done' : 'run',
    lines: s.verify.lines,
    reveal: verifyReveal,
  });
  const verifyEnd = cur + T.verifyGrow + T.verifyHold;
  if (lt < verifyEnd) return { blocks, inputText: '' };
  cur = verifyEnd;

  // Phase 6: TODO checklist fills in one item at a time.
  const items: TodoItem[] = s.todos.map((it) => ({ text: it.text, state: 0 }));
  const ticks = Math.floor((lt - cur) / T.todoStep);
  for (let i = 0; i < items.length; i++) {
    if (i < ticks) items[i].state = 2;
    else if (i === ticks) items[i].state = 1;
    else items[i].state = 0;
  }
  blocks.push({ kind: 'todo', items });

  // Mark final completion note once all todos are done.
  if (ticks >= items.length) {
    blocks.push({ kind: 'note', text: 'Done — all tasks complete.' });
  }

  return { blocks, inputText: '' };
}

// ── Live-session state (built up as the user submits) ────────────────────────────
interface LiveReply {
  startTime: number;
  session: Session;
}

const IDLE_RESUME = 3.0; // seconds of no input before attract resumes

// ── Code / text helpers ──────────────────────────────────────────────────────────
// Word-wrap a string to width w into pre-split lines (called only on content
// change — see the cache below — never in the steady hot loop).
function wrap(str: string, w: number): string[] {
  if (w < 4) return [str];
  const words = str.split(' ');
  const out: string[] = [];
  let line = '';
  for (const word of words) {
    if (line.length === 0) {
      line = word;
    } else if (line.length + 1 + word.length <= w) {
      line += ' ' + word;
    } else {
      out.push(line);
      line = word;
    }
  }
  if (line.length > 0) out.push(line);
  return out.length ? out : [''];
}

// ── Lightweight syntax tinting for tool-panel / diff bodies ──────────────────────
// A single forward char-scan (no per-frame regex / allocation) classifies each
// identifier / string / number / call / comment and paints it. `base` is the
// fallback ink (diff add/del lines pass their add/del tint so unhighlighted text
// still reads as added/removed). `dimFactor` softens code inside removed lines.
const KEYWORDS = new Set([
  'export',
  'function',
  'async',
  'await',
  'return',
  'const',
  'let',
  'import',
  'from',
  'Promise',
  'boolean',
  'string',
  'number',
  'true',
  'false',
  'new',
  'void',
  'if',
  'else',
  'then',
  'class',
  'interface',
  'type',
  'of',
  'in',
]);

const isWord = (c: number): boolean => (c >= 65 && c <= 90) || (c >= 97 && c <= 122) || (c >= 48 && c <= 57) || c === 95 || c === 36;
const isDigit = (c: number): boolean => c >= 48 && c <= 57;

// Blend an RGB toward black by `k` (0 = unchanged, 1 = black) — used to dim the
// syntax colours on removed (-) diff lines so the green/clay reads as "old code".
function dim(c: RGB, k: number): RGB {
  const m = 1 - k;
  return [Math.round(c[0] * m), Math.round(c[1] * m), Math.round(c[2] * m)];
}

// Paint a line of source at (x,y), tinting tokens. Stops at maxW chars. `bg` is the
// cell background (diff line tint or panel bg). `mute` (0..1) darkens all token
// colours for removed lines. Returns nothing; clips on the right.
function drawCode(t: CharTerm, x: number, y: number, s: string, maxW: number, base: RGB, bg: RGB | undefined, mute: number): void {
  const n = Math.min(s.length, maxW);
  let i = 0;
  while (i < s.length && i < maxW) {
    const cc = s.charCodeAt(i);
    // line comment // …
    if (cc === 47 && s.charCodeAt(i + 1) === 47) {
      const seg = s.slice(i, n);
      t.text(x + i, y, seg, mute > 0 ? dim(FAINT, mute) : FAINT, bg);
      return;
    }
    // string literal "…" or '…'
    if (cc === 34 || cc === 39) {
      let j = i + 1;
      while (j < s.length && j < maxW && s.charCodeAt(j) !== cc) j++;
      const end = Math.min(j + 1, n);
      const col = mute > 0 ? dim(CODE_STR, mute) : CODE_STR;
      t.text(x + i, y, s.slice(i, end), col, bg);
      i = end;
      continue;
    }
    // number
    if (isDigit(cc) && (i === 0 || !isWord(s.charCodeAt(i - 1)))) {
      let j = i + 1;
      while (j < n && (isDigit(s.charCodeAt(j)) || s.charCodeAt(j) === 46)) j++;
      const col = mute > 0 ? dim(CODE_NUM, mute) : CODE_NUM;
      t.text(x + i, y, s.slice(i, j), col, bg);
      i = j;
      continue;
    }
    // identifier / keyword / call
    if (isWord(cc) && !isDigit(cc)) {
      let j = i + 1;
      while (j < n && isWord(s.charCodeAt(j))) j++;
      const word = s.slice(i, j);
      const isCall = s.charCodeAt(j) === 40; // '('
      let col: RGB = KEYWORDS.has(word) ? CODE_KW : isCall ? CODE_FN : base;
      if (mute > 0) col = dim(col, mute);
      t.text(x + i, y, word, col, bg);
      i = j;
      continue;
    }
    // single punctuation / space
    const col = mute > 0 ? dim(base, mute) : base;
    t.put(x + i, y, s.charCodeAt(i), col, bg);
    i++;
  }
}

interface State {
  cols: number;
  rows: number;
  scroll: number; // rows scrolled up from the bottom (0 = pinned to latest)
  inputBuf: string; // live-typed input
  liveBlocks: Block[]; // committed live transcript blocks (user + assistant replies)
  liveReply: LiveReply | null;
  lastInputTime: number; // sim seconds of last user interaction
  hasInteracted: boolean;
  sessionIdx: number; // which attract session is playing (advances per loop)
}

// ── Demo ──────────────────────────────────────────────────────────────────────────
let S: State;

function initState(t: CharTerm): void {
  S = {
    cols: t.columns,
    rows: t.rows,
    scroll: 0,
    inputBuf: '',
    liveBlocks: [],
    liveReply: null,
    lastInputTime: -100,
    hasInteracted: false,
    sessionIdx: 0,
  };
}

// Render a single transcript block into an array of "drawn rows". Each drawn row
// is rendered immediately via small closures over the term; we collect them as a
// height first so the scroller can place them. To avoid per-frame allocation we
// render directly into a flat scratch list of row-render thunks is wasteful — so
// instead we two-pass: measure height, then draw at an absolute y.

// Measure the number of transcript rows a block occupies at width w.
function blockHeight(b: Block, w: number, caches: WrapCache): number {
  switch (b.kind) {
    case 'welcome':
      return 5; // 3-row boxed splash + tip line + spacer
    case 'user':
      return wrapCached(caches, 'u', b.text, w - 2).length + 1;
    case 'assistant': {
      const lines = wrapCached(caches, 'a', b.text, w - 4);
      const shown = Math.max(1, Math.ceil(lines.length * b.reveal));
      return shown + 1;
    }
    case 'tool': {
      const shown = Math.max(0, Math.ceil(b.lines.length * b.reveal));
      return shown + 3; // header + top/bottom of body region
    }
    case 'diff': {
      const shown = Math.max(0, Math.ceil(b.rows.length * b.reveal));
      return shown + 2; // file header + count
    }
    case 'todo':
      return b.items.length + 2; // header + items + spacer
    case 'spinner':
      return 1;
    case 'note':
      return 2;
  }
}

// A tiny wrap cache keyed by (tag,text,width) so we don't re-wrap every frame.
interface WrapCache {
  key: Map<string, string[]>;
}
function makeWrapCache(): WrapCache {
  return { key: new Map() };
}
function wrapCached(c: WrapCache, tag: string, text: string, w: number): string[] {
  const k = `${tag}|${w}|${text}`;
  let v = c.key.get(k);
  if (!v) {
    v = wrap(text, w);
    c.key.set(k, v);
    if (c.key.size > 256) c.key.clear();
  }
  return v;
}

// Draw a block at absolute transcript y. Rows outside [top,bottom) are clipped by
// the caller passing only on-screen blocks; we still guard each put via the term.
function drawBlock(t: CharTerm, b: Block, x: number, y: number, w: number, caches: WrapCache, time: number, hoverRow: number): void {
  const inner = w - 2;
  switch (b.kind) {
    case 'welcome': {
      // Session-start splash — the real Claude Code welcome card. A rounded, clay-
      // edged box with the sparkle mark, anchored at the top of every session so
      // the transcript never opens onto a black void. Width-capped so it reads as a
      // card, not a banner, on wide terminals.
      const bw = Math.min(w, 52);
      t.fillRect(x, y, bw, 3, PANEL_BG);
      // Faint clay drop-shadow for a touch of depth.
      t.shadeRect(x + 1, y + 3, bw, 1, 0, 0, 0, 0.45);
      t.box(x, y, bw, 3, 'rounded', CLAY_DIM, PANEL_BG);
      t.put(x + 2, y + 1, '✻', CLAY, PANEL_BG, true);
      t.text(x + 4, y + 1, 'Welcome to', INK, PANEL_BG, false);
      t.text(x + 15, y + 1, 'Claude Code', CLAY, PANEL_BG, true);
      const research = ' research preview ';
      // Tag only when there's clear room past the title (narrow cards drop it).
      if (bw >= 48) t.text(x + bw - research.length - 2, y + 1, research, FAINT, PANEL_BG);
      // Subtle one-line tip under the card.
      t.text(x + 2, y + 3, '/help for commands · cwd: ~/projects/api', FAINT);
      return;
    }
    case 'user': {
      const lines = wrapCached(caches, 'u', b.text, inner);
      for (let i = 0; i < lines.length; i++) {
        const yy = y + i;
        const rowBg: RGB | undefined = yy === hoverRow ? SEL_BG : undefined;
        if (rowBg) t.fillRect(x, yy, w, 1, rowBg);
        t.text(x, yy, i === 0 ? '> ' : '  ', CLAY, rowBg, true);
        t.text(x + 2, yy, lines[i], INK, rowBg, false);
      }
      return;
    }
    case 'assistant': {
      const lines = wrapCached(caches, 'a', b.text, w - 4);
      const shown = Math.max(1, Math.ceil(lines.length * b.reveal));
      for (let i = 0; i < shown; i++) {
        const yy = y + i;
        const rowBg: RGB | undefined = yy === hoverRow ? SEL_BG : undefined;
        if (rowBg) t.fillRect(x, yy, w, 1, rowBg);
        if (i === 0) t.text(x, yy, '●', CLAY, rowBg, true);
        let line = lines[i];
        // On the last visible line during streaming, truncate to a token edge.
        if (i === shown - 1 && b.reveal < 1) {
          const frac = lines.length * b.reveal - (shown - 1);
          const cut = Math.max(0, Math.min(line.length, Math.round(line.length * frac)));
          line = line.slice(0, cut);
        }
        t.text(x + 2, yy, line, INK, rowBg, false);
        // streaming caret — a soft clay block that pulses with the real-cursor cadence
        if (i === shown - 1 && b.reveal < 1) {
          const cx = x + 2 + line.length;
          if (caretLit(time)) t.put(cx, yy, '▌', CLAY, rowBg);
        }
      }
      return;
    }
    case 'tool': {
      const shown = Math.max(0, Math.ceil(b.lines.length * b.reveal));
      const bw = w;
      const bh = shown + 2;
      // Soft drop shadow: darken the cell band just below + right edge for depth.
      t.shadeRect(x + 1, y + bh, bw, 1, 0, 0, 0, 0.5);
      t.shadeRect(x + bw, y + 1, 1, bh, 0, 0, 0, 0.5);
      t.fillRect(x, y, bw, bh, PANEL_BG);
      // Border tint warms toward clay while running, cools to chrome when done.
      const border: RGB = b.status === 'done' ? CHROME : [58, 52, 60];
      t.box(x, y, bw, bh, 'rounded', border, PANEL_BG);
      // Left status rail — recolour the left border cells (clay running / green done)
      // so the panel reads with a warm accent edge like the real tool blocks.
      const railFg: RGB = b.status === 'done' ? GREEN : CLAY;
      for (let i = 1; i < bh - 1; i++) t.put(x, y + i, '│', railFg, PANEL_BG);
      // Header with status bullet.
      t.put(x + 1, y, '●', railFg, PANEL_BG, true);
      t.text(x + 3, y, b.head.replace(/^●\s*/, ''), INK, PANEL_BG, true);
      const tag = b.status === 'done' ? ' done ' : ' run ';
      t.text(x + bw - tag.length - 1, y, tag, b.status === 'done' ? GREEN : CLAY_DIM, PANEL_BG);
      for (let i = 0; i < shown; i++) {
        const yy = y + 1 + i;
        const ln = b.lines[i];
        if (ln.tone === 'out') {
          drawCode(t, x + 2, yy, ln.text, bw - 4, TOOL_OUT, PANEL_BG, 0);
        } else {
          const fg = ln.tone === 'ok' ? GREEN : RED;
          t.text(x + 2, yy, ln.text.slice(0, bw - 4), fg, PANEL_BG, false);
        }
      }
      return;
    }
    case 'diff': {
      const shown = Math.max(0, Math.ceil(b.rows.length * b.reveal));
      // File header line.
      t.text(x, y, '⎿ ', FAINT);
      t.text(x + 2, y, b.file, CODE_FN, undefined, true);
      let adds = 0,
        dels = 0;
      for (let i = 0; i < shown; i++) {
        if (b.rows[i].sign === '+') adds++;
        else if (b.rows[i].sign === '-') dels++;
      }
      const sx = x + 2 + b.file.length;
      t.text(sx, y, '  +', DIM);
      t.text(sx + 3, y, `${adds}`, ADD_FG, undefined, true);
      t.text(sx + 3 + `${adds}`.length, y, ' -', DIM);
      t.text(sx + 5 + `${adds}`.length, y, `${dels}`, DEL_FG, undefined, true);
      for (let i = 0; i < shown; i++) {
        const yy = y + 1 + i;
        const row = b.rows[i];
        let lineBg: RGB | undefined;
        let signFg: RGB = FAINT;
        if (row.sign === '+') {
          lineBg = ADD_BG;
          signFg = ADD_FG;
        } else if (row.sign === '-') {
          lineBg = DEL_BG;
          signFg = DEL_FG;
        }
        if (lineBg) t.fillRect(x, yy, w, 1, lineBg);
        const ln = String(i + 1).padStart(2);
        t.text(x, yy, ln, FAINT, lineBg);
        t.put(x + 3, yy, row.sign === ' ' ? '·' : row.sign, signFg, lineBg, row.sign !== ' ');
        // Token-tinted body: added lines paint full code colour over the add tint,
        // removed lines paint muted (older) code, context lines paint plain.
        const base = row.sign === '+' ? ADD_FG : row.sign === '-' ? DEL_FG : TOOL_OUT;
        const mute = row.sign === '-' ? 0.15 : 0;
        drawCode(t, x + 5, yy, row.text, w - 6, base, lineBg, mute);
      }
      return;
    }
    case 'todo': {
      t.text(x, y, 'TODOS', DIM, undefined, true);
      let doneN = 0;
      for (const it of b.items) if (it.state === 2) doneN++;
      t.text(x + 6, y, `${doneN}/${b.items.length}`, FAINT);
      for (let i = 0; i < b.items.length; i++) {
        const yy = y + 1 + i;
        const it = b.items[i];
        const fg = it.state === 2 ? TODO_DONE : it.state === 1 ? TODO_ACTIVE : DIM;
        // Use [x]/[~]/[ ] glyphs which rasterise crisply in the PNG (the Unicode
        // ☑/☐ checkboxes emit fine in the live TTY but have no font bitmap here).
        const mark = it.state === 2 ? '[x]' : it.state === 1 ? '[~]' : '[ ]';
        t.text(x, yy, mark, fg, undefined, it.state !== 0);
        const txtFg = it.state === 2 ? DIM : it.state === 1 ? INK : DIM;
        t.text(x + 4, yy, it.text.slice(0, w - 5), txtFg);
      }
      return;
    }
    case 'spinner': {
      const elapsed = Math.max(0, time - b.t0);
      const fi = Math.floor(time * 12) % SPIN.length;
      const dots = '.'.repeat(1 + (Math.floor(time * 2) % 3));
      t.put(x, y, SPIN[fi], CLAY, undefined, true);
      const secs = Math.floor(elapsed);
      const msg = `${b.verb}${dots}`;
      t.text(x + 2, y, msg, CLAY, undefined, false);
      t.text(x + 2 + 12, y, `(${secs}s · esc to interrupt)`, FAINT);
      return;
    }
    case 'note': {
      t.put(x, y, '●', GREEN, undefined, true);
      t.text(x + 2, y, b.text, GREEN);
      return;
    }
  }
}

// Pick the current attract session and its local time, advancing sessionIdx as
// loops complete so successive prompts differ.
function attractState(time: number): { session: Session; lt: number } {
  // Find loop boundaries by accumulating loop lengths over the SESSIONS cycle.
  let t = time;
  let idx = 0;
  // Guard against pathological loops; SESSIONS lengths are ~12-16s.
  for (let guard = 0; guard < 4096; guard++) {
    const s = SESSIONS[idx % SESSIONS.length];
    const len = loopLength(s);
    if (t < len) return { session: s, lt: t };
    t -= len;
    idx++;
  }
  return { session: SESSIONS[0], lt: 0 };
}

const wrapCache = makeWrapCache();

function frame(t: CharTerm, time: number, _dt: number, _frameNo: number): void {
  if (!S || S.cols !== t.columns || S.rows !== t.rows) initState(t);

  // ── Input handling state machine (live) ──
  // Determine whether we're in attract or live control.
  const idle = time - S.lastInputTime;
  const attract = !S.hasInteracted || idle > IDLE_RESUME;

  // Mouse hover → highlight transcript row; wheel → scroll.
  if (t.mouse.active) {
    S.lastInputTime = time;
    S.hasInteracted = true;
  }

  // ── Background ──
  t.clear(BG[0], BG[1], BG[2]);

  // ── Top status / welcome line ──
  const topY = 0;
  t.fillRect(0, topY, t.columns, 1, BAR_BG);
  // Slowly pulsing sparkle mark (deterministic from time).
  const pulse = 0.62 + 0.38 * (0.5 + 0.5 * Math.sin(time * 2.2));
  const spark: RGB = [Math.round(CLAY[0] * pulse + 28), Math.round(CLAY[1] * pulse), Math.round(CLAY[2] * pulse)];
  t.put(1, topY, '✻', spark, BAR_BG, true);
  t.text(3, topY, 'Claude Code', INK, BAR_BG, true);
  t.text(15, topY, 'opus-4.8', CLAY_DIM, BAR_BG, true);
  t.text(24, topY, '·', FAINT, BAR_BG);
  t.text(26, topY, '~/projects/api', DIM, BAR_BG);
  t.text(42, topY, 'main', GREEN, BAR_BG);
  // Context-window meter — a small clay/green bar that breathes with the session
  // so the chrome feels live. Kept well clear of the engine FPS readout (far right).
  const ctx = 0.34 + 0.3 * (0.5 + 0.5 * Math.sin(time * 0.5 + 1.1));
  const meterX = 52;
  const meterW = 14;
  t.text(meterX, topY, 'context', FAINT, BAR_BG);
  const trackX = meterX + 8;
  const filled = Math.round(meterW * ctx);
  for (let i = 0; i < meterW; i++) {
    const on = i < filled;
    const col = !on ? METER_TRACK : ctx > 0.55 ? METER_WARM : METER_FILL;
    t.put(trackX + i, topY, on ? '█' : '░', col, BAR_BG);
  }
  t.text(trackX + meterW + 1, topY, `${Math.round(ctx * 100)}%`, DIM, BAR_BG);
  // (FPS readout is drawn by the engine top-right; leave that clear.)

  // ── Layout regions ──
  const inputH = 3;
  const hintH = 1;
  const transTop = 2;
  const transBottom = t.rows - inputH - hintH; // exclusive
  const transX = 2;
  const transW = t.columns - 4;
  const transRows = Math.max(1, transBottom - transTop);

  // ── Build transcript blocks for this frame ──
  // Every session opens with the welcome splash, so the transcript top is always
  // anchored by a designed card rather than a void.
  const blocks: Block[] = [{ kind: 'welcome' }];
  let inputText = S.inputBuf;
  let caretInInput = true;

  if (attract) {
    const { session, lt } = attractState(time + ATTRACT_T0);
    const built = buildSession(session, lt);
    for (const b of built.blocks) blocks.push(b);
    inputText = built.inputText;
    // The caret blinks in the input box only while typing the prompt (before the
    // prompt is submitted into the transcript). Once the session is live the box
    // shows nothing and the streaming caret lives in the assistant block.
    caretInInput = built.blocks.length === 0;
    // Attract always rides at the bottom of the transcript.
    S.scroll = 0;
  } else {
    // Live: render committed live blocks + any in-flight reply.
    for (const b of S.liveBlocks) blocks.push(b);
    if (S.liveReply) {
      const lt = time - S.liveReply.startTime;
      const s = S.liveReply.session;
      const replyT = s.reply.length / T.replyCps;
      const thinkHold = 0.9;
      if (lt < thinkHold) {
        blocks.push({ kind: 'spinner', verb: s.verb, t0: S.liveReply.startTime });
      } else {
        const reveal = clamp((lt - thinkHold) / replyT, 0, 1);
        blocks.push({ kind: 'assistant', text: s.reply, reveal });
        if (reveal < 1) blocks.push({ kind: 'spinner', verb: s.verb, t0: S.liveReply.startTime });
        else {
          // Commit the finished reply once, then clear liveReply.
          S.liveBlocks.push({ kind: 'assistant', text: s.reply, reveal: 1 });
          S.liveReply = null;
        }
      }
    }
    inputText = S.inputBuf;
    caretInInput = true;
  }

  // ── Measure + place blocks (bottom-pinned, with scroll offset) ──
  // Total height with one blank spacer row between blocks.
  let totalH = 0;
  const heights: number[] = [];
  for (const b of blocks) {
    const h = blockHeight(b, transW, wrapCache);
    heights.push(h);
    totalH += h + 1;
  }

  // Anchor (faithful to the real TUI): the welcome card pins to the TOP under the
  // chrome and content flows downward; once the stack overflows the viewport it
  // bottom-pins so the freshest block always hugs the input box and older content
  // scrolls up off the top. The trailing inter-block spacer of the last block is
  // dropped so a full transcript ends one clean line above the prompt.
  const stackH = totalH - 1;
  const maxScroll = Math.max(0, stackH - transRows);
  S.scroll = Math.max(0, Math.min(S.scroll, maxScroll));
  // y of the first block's first row (negative → clipped by puts).
  let y =
    stackH <= transRows
      ? transTop // fits: welcome card hugs the chrome, content flows down
      : transBottom - stackH + S.scroll; // overflows: bottom-pin, scroll lifts older in

  const hoverRow = !attract && t.mouse.inside && t.mouse.y >= transTop && t.mouse.y < transBottom ? t.mouse.y : -1;

  for (let i = 0; i < blocks.length; i++) {
    const h = heights[i];
    // Only draw if any part is within the transcript viewport.
    if (y + h > transTop && y < transBottom) {
      drawBlockClipped(t, blocks[i], transX, y, transW, transTop, transBottom, time, hoverRow);
    }
    y += h + 1;
  }

  // ── Input box (rounded, '>' prompt, blinking caret) ──
  const inY = transBottom + 1;
  t.fillRect(transX, inY, transW, inputH, INPUT_BG);
  const boxFg = attract ? CHROME : CLAY;
  t.box(transX, inY, transW, inputH, 'rounded', boxFg, INPUT_BG);
  t.text(transX + 2, inY + 1, '>', CLAY, INPUT_BG, true);
  const shownInput = inputText.slice(Math.max(0, inputText.length - (transW - 6)));
  t.text(transX + 4, inY + 1, shownInput, INK, INPUT_BG);
  // Blinking caret (same real-cursor cadence as the streaming caret).
  const caretOn = caretLit(time);
  if (caretInInput && caretOn) {
    const cx = transX + 4 + shownInput.length;
    if (cx < transX + transW - 1) t.put(cx, inY + 1, '▌', CLAY, INPUT_BG);
  } else if (caretInInput && shownInput.length === 0) {
    // placeholder hint when empty
    if (!caretOn) t.text(transX + 4, inY + 1, 'Try "fix the failing test"', FAINT, INPUT_BG);
  }

  // ── Bottom hint line ──
  const hy = t.rows - 1;
  const mode = attract ? 'attract' : 'you';
  t.text(transX, hy, attract ? 'auto-demo · type to take over · ↑↓/wheel scroll' : '↵ send · ⌫ delete · ↑↓ scroll · esc interrupt', FAINT);
  t.text(t.columns - 12, hy, `[${mode}]`, attract ? CLAY_DIM : GREEN);
}

// Draw a block but clip its rows to [top,bottom). Since term.put guards bounds we
// just offset; to honour the transcript viewport we draw into a sub-region by
// skipping rows outside the band via a temporary y clamp inside each kind would be
// verbose, so we rely on the fact that the input box / top bar overwrite anything
// drawn outside the band on the SAME frame order. Transcript is drawn before the
// input box and after the top bar, but a tall block could spill over the top bar
// (row 0/1) or under the input. To prevent that we clip here.
function drawBlockClipped(t: CharTerm, b: Block, x: number, y: number, w: number, top: number, bottom: number, time: number, hoverRow: number): void {
  // Fast path: fully inside.
  const h = blockHeight(b, w, wrapCache);
  if (y >= top && y + h <= bottom) {
    drawBlock(t, b, x, y, w, wrapCache, time, hoverRow);
    return;
  }
  // Partially clipped: draw into the real grid, then scrub rows outside the band.
  drawBlock(t, b, x, y, w, wrapCache, time, hoverRow);
  // Scrub any rows above `top` or at/below `bottom` that this block touched.
  for (let ry = y; ry < y + h; ry++) {
    if (ry < top || ry >= bottom) {
      // Repaint that row to background within the transcript x-span.
      t.fillRect(x, ry, w, 1, BG);
    }
  }
}

// ── Key handling (live) ──────────────────────────────────────────────────────────
function onKey(key: string, t: CharTerm): void {
  if (!S) initState(t);
  const now = nowSim();
  S.lastInputTime = now;
  S.hasInteracted = true;

  if (key === 'up') {
    S.scroll += 1;
    return;
  }
  if (key === 'down') {
    S.scroll = Math.max(0, S.scroll - 1);
    return;
  }
  if (key === 'pageup') {
    S.scroll += 8;
    return;
  }
  if (key === 'pagedown') {
    S.scroll = Math.max(0, S.scroll - 8);
    return;
  }
  if (key === 'esc') {
    S.liveReply = null;
    return;
  }

  if (key === 'backspace') {
    S.inputBuf = S.inputBuf.slice(0, -1);
    return;
  }
  if (key === 'enter') {
    const text = S.inputBuf.trim();
    if (text.length === 0) return;
    S.liveBlocks.push({ kind: 'user', text });
    // Trigger a canned reply animation; pick a session by hashed length.
    const sess = SESSIONS[(text.length + S.sessionIdx) % SESSIONS.length];
    S.liveReply = { startTime: now, session: { ...sess, prompt: text } };
    S.inputBuf = '';
    S.scroll = 0;
    return;
  }
  if (key === 'space') {
    S.inputBuf += ' ';
    return;
  }
  if (key === 'tab') return;
  // Printable (case preserved).
  if (key.length === 1) {
    S.inputBuf += key;
    S.scroll = 0;
  }
}

// We need a sim clock for key events; the engine doesn't pass time to onKey, so we
// track the latest frame time in a module variable updated each frame.
let simNow = 0;
function nowSim(): number {
  return simNow;
}

runText({
  title: 'Claude Code',
  hud: 'TYPE · ↵ SEND · ↑↓ SCROLL',
  captureT: 9,
  // Uncapped by default so the top-right readout shows the engine's true ceiling
  // (~10k+ fps); set TERM_FPS=<n> to throttle it back (e.g. TERM_FPS=120 for a
  // calm interactive cap, TERM_FPS=60 for the old behaviour).
  targetFps: Number(process.env.TERM_FPS) || Infinity,
  mouse: true,
  init: (t) => {
    initState(t);
  },
  resize: (t) => {
    // Preserve live transcript across resize; just refit dimensions.
    if (S) {
      S.cols = t.columns;
      S.rows = t.rows;
    } else {
      initState(t);
    }
  },
  frame: (t, time, dt, fno) => {
    simNow = time;
    frame(t, time, dt, fno);
  },
  onKey,
});
