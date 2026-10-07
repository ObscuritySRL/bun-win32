// The main-thread side of the indexer: a priority queue of windows to read, one job in flight, results delivered as
// updates. Windows are re-read when they appear, when their title or minimized state changes, and when Iris opens
// (anything older than 20 seconds jumps the queue).

import type { IndexJob, IndexReply } from './indexer-worker';
import type { IndexedText } from './search';
import type { WindowInfo } from './windows';

export type IndexUpdate = { hwnd: bigint; kind: 'scanning'; title: string } | { entries: IndexedText[] | null; hwnd: bigint; kind: 'done'; milliseconds: number; source: IndexReply['source'] };

const STALE_MILLISECONDS = 20_000;

export class Indexer {
  #busy: WindowInfo | null = null;
  #lastRead = new Map<bigint, number>();
  #listeners: ((update: IndexUpdate) => void)[] = [];
  #queue: WindowInfo[] = [];
  #worker: Worker;
  readonly log: { title: string; milliseconds: number; source: string; words: number }[] = [];

  constructor() {
    this.#worker = new Worker(new URL('./indexer-worker.ts', import.meta.url).href);
    this.#worker.onmessage = (event: MessageEvent<IndexReply>) => this.#receive(event.data);
  }

  onUpdate(listener: (update: IndexUpdate) => void): void {
    this.#listeners.push(listener);
  }

  get pending(): number {
    return this.#queue.length + (this.#busy === null ? 0 : 1);
  }

  request(window: WindowInfo, reason: 'changed' | 'new'): void {
    const existing = this.#queue.findIndex((queued) => queued.hwnd === window.hwnd);
    if (existing >= 0) this.#queue[existing] = window;
    else if (reason === 'changed') this.#queue.unshift(window);
    else this.#queue.push(window);
    this.#pump();
  }

  /** Move stale or never-read windows to the front, frontmost window first. */
  prioritize(windows: readonly WindowInfo[]): void {
    const now = performance.now();
    const urgent = windows.filter((window) => now - (this.#lastRead.get(window.hwnd) ?? -Infinity) > STALE_MILLISECONDS && this.#busy?.hwnd !== window.hwnd);
    const urgentSet = new Set(urgent.map((window) => window.hwnd));
    this.#queue = [...urgent, ...this.#queue.filter((window) => !urgentSet.has(window.hwnd))];
    this.#pump();
  }

  #pump(): void {
    if (this.#busy !== null) return;
    const next = this.#queue.shift();
    if (next === undefined) return;
    this.#busy = next;
    const job: IndexJob = { frame: next.bounds, hwnd: next.hwnd.toString(), minimized: next.minimized };
    this.#worker.postMessage(job);
    for (const listener of this.#listeners) listener({ hwnd: next.hwnd, kind: 'scanning', title: next.title });
  }

  #receive(reply: IndexReply): void {
    const hwnd = BigInt(reply.hwnd);
    const window = this.#busy;
    this.#busy = null;
    this.#lastRead.set(hwnd, performance.now());
    this.log.push({ milliseconds: reply.milliseconds, source: reply.source, title: window?.title ?? '', words: reply.entries?.length ?? 0 });
    if (this.log.length > 300) this.log.splice(0, this.log.length - 300);
    for (const listener of this.#listeners) listener({ entries: reply.entries, hwnd, kind: 'done', milliseconds: reply.milliseconds, source: reply.source });
    this.#pump();
  }

  /** A window is gone: drop its bookkeeping and any queued read. */
  forget(hwnd: bigint): void {
    this.#lastRead.delete(hwnd);
    this.#queue = this.#queue.filter((window) => window.hwnd !== hwnd);
  }

  terminate(): void {
    this.#worker.terminate();
  }
}
