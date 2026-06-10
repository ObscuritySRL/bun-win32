/**
 * Preload only the not-yet-bound exports of a binding class. Published binding packages pin
 * their own (possibly older) @bun-win32/core, and core ≤ 1.1.2's Preload throws when EVERY
 * requested symbol is already bound — which sysmon's overlapping per-module preloads can
 * trigger. Filtering here keeps sysmon correct on any nested core version.
 */
export function preloadPending(target: { Preload(methods?: string | string[]): void }, methods: string[]): void {
  const pending = methods.filter((method) => Object.getOwnPropertyDescriptor(target, method)?.configurable !== false);
  if (pending.length > 0) target.Preload(pending);
}
