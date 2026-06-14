// Correctness gate for the COM vtable SLOT table — the package's spine, where one transposed slot is an
// unchecked function-pointer call that SEGFAULTS (com.ts). audit.ts/nullcheck.ts skip uia (no structs/ or
// types/ dir), so this is the SLOT table's only automated coverage. It parses UIAutomationClient.h's C-style
// `*Vtbl` structs (the authoritative vtable declaration order) into methodName→slotIndex sets and asserts
// every constants.ts SLOT entry the header defines matches. Skips cleanly when the SDK header is absent.
import { describe, expect, test } from 'bun:test';
import { existsSync, readdirSync, readFileSync } from 'node:fs';

import { SLOT } from './constants';

const SDK_INCLUDE = 'C:/Program Files (x86)/Windows Kits/10/Include';

/** The newest installed UIAutomationClient.h, or null when the Windows SDK is not present. */
function headerPath(): string | null {
  if (!existsSync(SDK_INCLUDE)) return null;
  const versions = readdirSync(SDK_INCLUDE)
    .filter((name) => /^\d+\./.test(name))
    .sort()
    .reverse();
  for (const version of versions) {
    const candidate = `${SDK_INCLUDE}/${version}/um/UIAutomationClient.h`;
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

/** methodName → the set of vtable slot indices it occupies across every `*Vtbl` struct in the header. */
function parseVtableSlots(header: string): Map<string, Set<number>> {
  const slots = new Map<string, Set<number>>();
  const vtbl = /typedef struct \w+Vtbl\s*\{([\s\S]*?)\}\s*\w+Vtbl;/g;
  for (let block = vtbl.exec(header); block !== null; block = vtbl.exec(header)) {
    const method = /STDMETHODCALLTYPE\s*\*\s*(\w+)\s*\)/g;
    let index = 0;
    for (let entry = method.exec(block[1]!); entry !== null; entry = method.exec(block[1]!)) {
      const name = entry[1]!;
      if (!slots.has(name)) slots.set(name, new Set());
      slots.get(name)!.add(index);
      index += 1;
    }
  }
  return slots;
}

const path = headerPath();

describe('SLOT table ↔ UIAutomationClient.h', () => {
  test.skipIf(path === null)('every SLOT entry the SDK header defines matches its declared vtable index', () => {
    const slots = parseVtableSlots(readFileSync(path!, 'utf8'));
    const mismatches: string[] = [];
    let verified = 0;
    let notInHeader = 0;
    for (const [name, slot] of Object.entries(SLOT)) {
      const found = slots.get(name);
      if (found === undefined) {
        notInHeader += 1;
        continue;
      }
      if (found.has(slot)) verified += 1;
      else mismatches.push(`${name}: constants.ts=${slot} but header declares it at {${[...found].join(',')}}`);
    }
    console.log(`  slot-gate: ${verified} verified against the SDK header, ${notInHeader} not declared in UIAutomationClient.h, ${mismatches.length} mismatched`);
    if (mismatches.length > 0) console.log(`  ${mismatches.join('\n  ')}`);
    expect(mismatches).toEqual([]);
    expect(verified).toBeGreaterThan(20);
  });
});
