// CacheRequest batching — the performance spine. Naive UIA reads N properties with N cross-process
// round-trips; IUIAutomationCacheRequest + FindAllBuildCache prefetches many properties for a whole
// subtree in ONE round-trip, then get_Cached* reads pay zero further round-trips.

import { FFIType } from 'bun:ffi';

import { automation } from './automation';
import { comRelease, vcall } from './com';
import { PropertyId, S_OK, SLOT, TreeScope } from './constants';

/** Properties the default cache prefetches — what tree() and the cached find/walk need. */
export const DEFAULT_CACHE_PROPERTIES: readonly number[] = [PropertyId.Name, PropertyId.ControlType, PropertyId.AutomationId, PropertyId.ClassName, PropertyId.BoundingRectangle, PropertyId.IsEnabled];

export enum AutomationElementMode {
  /** Cached data only — the returned elements cannot be acted on, but BuildCache is cheaper. */
  None = 0x0000_0000,
  /** Full live reference (default) — the returned elements can be acted on. */
  Full = 0x0000_0001,
}

export class CacheRequest {
  readonly ptr: bigint;

  constructor(ptr: bigint) {
    this.ptr = ptr;
  }

  /** Prefetch a property (UIA_*PropertyId) for every element the cache covers. */
  property(propertyId: number): this {
    vcall(this.ptr, SLOT.AddProperty, [FFIType.i32], [propertyId]);
    return this;
  }

  /** Prefetch a pattern (UIA_*PatternId) for every element the cache covers. */
  pattern(patternId: number): this {
    vcall(this.ptr, SLOT.AddPattern, [FFIType.i32], [patternId]);
    return this;
  }

  /** Set the cache's tree scope (which relatives are cached around each match). */
  treeScope(scope: number): this {
    vcall(this.ptr, SLOT.put_TreeScope, [FFIType.i32], [scope]);
    return this;
  }

  /** Set whether returned elements keep a live reference (Full) or carry cached data only (None). */
  elementMode(mode: AutomationElementMode): this {
    vcall(this.ptr, SLOT.put_AutomationElementMode, [FFIType.i32], [mode]);
    return this;
  }

  /** Release the underlying COM pointer. */
  release(): void {
    comRelease(this.ptr);
  }
}

/** Build a CacheRequest (default: standard property set, subtree scope, Full mode). Caller releases it. */
export function createCacheRequest(properties: readonly number[] = DEFAULT_CACHE_PROPERTIES, scope: number = TreeScope.TreeScope_Subtree, mode: AutomationElementMode = AutomationElementMode.Full): CacheRequest {
  const out = Buffer.alloc(8);
  if (vcall(automation(), SLOT.CreateCacheRequest, [FFIType.ptr], [out.ptr!]) !== S_OK) throw new Error('CreateCacheRequest failed');
  const request = new CacheRequest(out.readBigUInt64LE(0));
  for (const propertyId of properties) request.property(propertyId);
  request.treeScope(scope);
  request.elementMode(mode);
  return request;
}
