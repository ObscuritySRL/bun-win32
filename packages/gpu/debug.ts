// Opt-in printf-style kernel logging: an atomic-cursor uint buffer plus an HLSL
// prelude pasted into the kernel. The only way to see per-thread values without
// restructuring a kernel around an output buffer.

import { comRelease } from './com';
import { makeStructuredBuffer, readbackBuffer } from './buffer';

export interface DebugLogEntry {
  threadId: number;
  value: number;
}

export interface KernelDebugLog {
  /** Maximum stored entries; DEBUG_LOG calls past capacity are counted but dropped. */
  capacity: number;
  /** Paste ahead of your kernel source: declares `_debugLog` and the DEBUG_LOG(threadId, value) macro. */
  hlslPrelude: string;
  /** Bind this UAV at the register chosen at creation (low-level csSet path). */
  uav: bigint;
  read(): { attempted: number; entries: DebugLogEntry[] };
  release(): void;
}

/**
 * Create a kernel debug log of `capacity` entries whose UAV lives at `register`
 * (u-register index — match your kernel's other bindings; csSet binds from slot 0
 * upward, so the log's position in the uav array must equal `register`).
 * Values round-trip bit-exactly through asuint/Float32Array. Create a fresh log
 * per dispatch batch — the cursor is zero-initialized at creation.
 */
export function createKernelDebugLog(capacity = 1024, register = 0): KernelDebugLog {
  // Layout: word 0 = attempted counter; entry i = { threadId @ 1+2i, asuint(value) @ 2+2i }.
  const elementCount = 1 + capacity * 2;
  const zero = Buffer.alloc(elementCount * 4);
  const resource = makeStructuredBuffer({ count: elementCount, initialData: zero, stride: 4, uav: true });
  let released = false;
  const hlslPrelude = `RWStructuredBuffer<uint> _debugLog : register(u${register});
#define DEBUG_LOG(threadId, value) { uint _slot; InterlockedAdd(_debugLog[0], 1u, _slot); if (_slot < ${capacity}u) { _debugLog[1 + _slot * 2] = (threadId); _debugLog[2 + _slot * 2] = asuint((float)(value)); } }
`;
  return {
    capacity,
    hlslPrelude,
    uav: resource.uav!,
    read() {
      if (released) throw new Error('KernelDebugLog.read: the log was released.');
      const words = new Uint32Array(readbackBuffer(resource.buffer, elementCount * 4));
      const attempted = words[0]!;
      const stored = Math.min(attempted, capacity);
      const floats = new Float32Array(words.buffer);
      const entries: DebugLogEntry[] = [];
      for (let index = 0; index < stored; index += 1) entries.push({ threadId: words[1 + index * 2]!, value: floats[2 + index * 2]! });
      return { attempted, entries };
    },
    // Idempotent: a second release is a no-op; read after release throws.
    release() {
      if (released) return;
      released = true;
      comRelease(resource.uav ?? 0n);
      comRelease(resource.buffer);
    },
  };
}
