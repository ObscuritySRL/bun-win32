// waitForIdle: poll a cheap hash of the window's serialized tree until it stops changing for
// `quietMs` (the UI has "settled"), or `timeout` elapses. UIA structure-changed events fire on a
// UIA-owned foreign thread (a JSCallback FFI dead-end), so the agent loop settles by polling — one
// cached round-trip per sample (~16 ms). The screenshot-free "wait until ready" that replaces a
// blind wait(ms) and stops the model from acting on a half-rendered tree.

import type { Element } from './element';
import { serialize } from './tree';

export interface IdleOptions {
  /** Give up after this many ms (default 5000). */
  timeout?: number;
  /** The tree must be unchanged for this long to count as settled (default 400). */
  quietMs?: number;
  /** Sampling period in ms (default 100). */
  interval?: number;
}

/** FNV-1a over the serialized tree — a fast, collision-resistant change signal. */
function treeHash(element: Element): number {
  const text = JSON.stringify(serialize(element));
  let hash = 0x811c_9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x0100_0193);
  }
  return hash >>> 0;
}

/** Resolve true once the window's UIA tree has been unchanged for `quietMs`, or false at `timeout`. */
export async function waitForIdle(element: Element, options: IdleOptions = {}): Promise<boolean> {
  const timeout = options.timeout ?? 5000;
  const quietMs = options.quietMs ?? 400;
  const interval = options.interval ?? 100;
  const start = Bun.nanoseconds();
  let previous = treeHash(element);
  let stableSince = start;
  for (;;) {
    await Bun.sleep(interval);
    const now = Bun.nanoseconds();
    const current = treeHash(element);
    if (current !== previous) {
      previous = current;
      stableSince = now;
    } else if ((now - stableSince) / 1e6 >= quietMs) {
      return true;
    }
    if ((now - start) / 1e6 >= timeout) return false;
  }
}
