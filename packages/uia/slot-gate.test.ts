// Correctness gate for the COM vtable SLOT table — the package's spine, where one transposed slot is an
// unchecked function-pointer call that SEGFAULTS (com.ts). audit.ts/nullcheck.ts skip uia (no structs/ or
// types/ dir), so this is the SLOT table's only automated coverage. It parses UIAutomationClient.h's C-style
// `*Vtbl` structs (the authoritative vtable declaration order) into methodName→slotIndex sets and asserts
// every constants.ts SLOT entry the header defines matches. Skips cleanly when the SDK header is absent.
import { describe, expect, test } from 'bun:test';
import { existsSync, readdirSync, readFileSync } from 'node:fs';

import { SLOT } from './constants';

const SDK_INCLUDE = 'C:/Program Files (x86)/Windows Kits/10/Include';

/** The newest installed SDK header at `<ver>/<subdir>/<name>`, or null when the SDK / header is absent. */
function sdkHeader(subdir: 'um' | 'winrt', name: string): string | null {
  if (!existsSync(SDK_INCLUDE)) return null;
  for (const version of readdirSync(SDK_INCLUDE)
    .filter((entry) => /^\d+\./.test(entry))
    .sort()
    .reverse()) {
    const candidate = `${SDK_INCLUDE}/${version}/${subdir}/${name}`;
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

/** interfaceName → (methodName → slotIndex), one entry per C-style `*Vtbl` block. Retains the interface
 *  name so a method that repeats across interfaces (QueryInterface, Release, GetDesc) is scoped, not merged.
 *  The C ABI Vtbl physically lists inherited members (IUnknown/IInspectable/IDispatch), so positional
 *  indexing already yields the absolute slot — no base-offset arithmetic needed. */
function parseScopedVtableSlots(header: string): Map<string, Map<string, number>> {
  const interfaces = new Map<string, Map<string, number>>();
  const vtbl = /typedef struct (\w+)Vtbl\s*\{([\s\S]*?)\}\s*\w+Vtbl;/g;
  for (let block = vtbl.exec(header); block !== null; block = vtbl.exec(header)) {
    const method = /STDMETHODCALLTYPE\s*\*\s*(\w+)\s*\)/g;
    const members = new Map<string, number>();
    let index = 0;
    for (let entry = method.exec(block[2]!); entry !== null; entry = method.exec(block[2]!)) {
      members.set(entry[1]!, index);
      index += 1;
    }
    interfaces.set(block[1]!, members);
  }
  return interfaces;
}

/** The C-ABI Vtbl typedef names are mangled (e.g. `__x_ABI_..._CIGraphicsCaptureItem`); match by suffix. */
function findInterface(interfaces: Map<string, Map<string, number>>, suffix: string): Map<string, number> | undefined {
  for (const [name, members] of interfaces) if (name.endsWith(suffix)) return members;
  return undefined;
}

/** Slot of `method` in a C++ IUnknown-derived interface decl (no `*Vtbl`; own members start at slot 3).
 *  For the two interop interfaces (IGraphicsCaptureItemInterop, IDirect3DDxgiInterfaceAccess) the SDK emits
 *  pure-virtual `IFACEMETHOD(...)` decls, not a C Vtbl struct, so the scoped parser cannot see them. */
function ifaceMethodSlot(header: string, interfaceName: string, method: string): number | null {
  const open = new RegExp(`(?:DECLARE_INTERFACE_IID_\\(\\s*${interfaceName}\\b|\\b${interfaceName}\\s*:\\s*public\\s+IUnknown)[\\s\\S]*?\\{([\\s\\S]*?)\\n\\s*\\}`, 'm');
  const body = open.exec(header);
  if (body === null) return null;
  const names: string[] = [];
  const declaration = /IFACEMETHOD\s*\(\s*(\w+)\s*\)/g;
  for (let entry = declaration.exec(body[1]!); entry !== null; entry = declaration.exec(body[1]!)) names.push(entry[1]!);
  const local = names.indexOf(method);
  return local === -1 ? null : local + 3; // QueryInterface(0) AddRef(1) Release(2) then the interface's own members
}

const path = sdkHeader('um', 'UIAutomationClient.h');

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

// The WGC (wgc.ts, 15 slots) and MSAA (msaa.ts, 4 slots) engines hold their vtable slots as plain module
// consts (not in constants.ts SLOT — the names collide across interfaces), so the original gate misses them
// entirely; a transposed slot there segfaults with zero coverage. This block mirrors those consts as the
// authoritative spec and verifies each against its OWN interface's vtable in the SDK header. Vtbl-style
// interfaces parse via parseScopedVtableSlots; the two C++ interop interfaces via ifaceMethodSlot.
describe('WGC + MSAA + D3D11 SLOT coverage (wgc.ts / msaa.ts)', () => {
  // [subdir, header, interface-name-suffix, method, expected slot] — C `*Vtbl` interfaces.
  const VTBL: ReadonlyArray<readonly ['um' | 'winrt', string, string, string, number]> = [
    ['winrt', 'windows.graphics.capture.h', 'CIGraphicsCaptureItem', 'get_Size', 7],
    ['winrt', 'windows.graphics.capture.h', 'CIDirect3D11CaptureFramePoolStatics2', 'CreateFreeThreaded', 6],
    ['winrt', 'windows.graphics.capture.h', 'CIDirect3D11CaptureFramePool', 'TryGetNextFrame', 7],
    ['winrt', 'windows.graphics.capture.h', 'CIDirect3D11CaptureFramePool', 'CreateCaptureSession', 10],
    ['winrt', 'windows.graphics.capture.h', 'CIDirect3D11CaptureFramePool', 'Recreate', 6], // the trap: slot 6 on the INSTANCE is Recreate, not CreateFreeThreaded (which is on Statics2)
    ['winrt', 'windows.graphics.capture.h', 'CIGraphicsCaptureSession', 'StartCapture', 6],
    ['winrt', 'windows.graphics.capture.h', 'CIDirect3D11CaptureFrame', 'get_Surface', 6],
    ['um', 'd3d11.h', 'ID3D11Texture2D', 'GetDesc', 10],
    ['um', 'd3d11.h', 'ID3D11Device', 'CreateTexture2D', 5],
    ['um', 'd3d11.h', 'ID3D11DeviceContext', 'CopyResource', 47],
    ['um', 'd3d11.h', 'ID3D11DeviceContext', 'Map', 14],
    ['um', 'd3d11.h', 'ID3D11DeviceContext', 'Unmap', 15],
    ['um', 'oleacc.h', 'IAccessible', 'QueryInterface', 0],
    ['um', 'oleacc.h', 'IAccessible', 'get_accChildCount', 8],
    ['um', 'oleacc.h', 'IAccessible', 'get_accName', 10],
    ['um', 'oleacc.h', 'IAccessible', 'get_accRole', 13],
  ];
  // [subdir, header, interface, method, expected slot] — C++ pure-virtual IFACEMETHOD interfaces (no Vtbl).
  const IFACE: ReadonlyArray<readonly ['um' | 'winrt', string, string, string, number]> = [
    ['um', 'Windows.Graphics.Capture.Interop.h', 'IGraphicsCaptureItemInterop', 'CreateForWindow', 3],
    ['um', 'windows.graphics.directx.direct3d11.interop.h', 'IDirect3DDxgiInterfaceAccess', 'GetInterface', 3],
  ];

  const headerCache = new Map<string, string | null>();
  function headerText(subdir: 'um' | 'winrt', name: string): string | null {
    const key = `${subdir}/${name}`;
    if (!headerCache.has(key)) {
      const resolved = sdkHeader(subdir, name);
      headerCache.set(key, resolved === null ? null : readFileSync(resolved, 'utf8'));
    }
    return headerCache.get(key) ?? null;
  }

  const anyHeaderPresent = VTBL.some(([subdir, header]) => sdkHeader(subdir, header) !== null) || IFACE.some(([subdir, header]) => sdkHeader(subdir, header) !== null);

  test.skipIf(!anyHeaderPresent)('every WGC/MSAA/D3D11 slot const matches its SDK-header vtable index', () => {
    const mismatches: string[] = [];
    let verified = 0;
    let skipped = 0;
    for (const [subdir, header, iface, method, slot] of VTBL) {
      const text = headerText(subdir, header);
      if (text === null) {
        skipped += 1;
        continue;
      }
      const members = findInterface(parseScopedVtableSlots(text), iface);
      if (members === undefined) {
        mismatches.push(`${header}:${iface} — interface not found in header`);
        continue;
      }
      const actual = members.get(method);
      if (actual === slot) verified += 1;
      else mismatches.push(`${header}:${iface}.${method} expected ${slot}, header has ${actual ?? 'NONE'}`);
    }
    for (const [subdir, header, iface, method, slot] of IFACE) {
      const text = headerText(subdir, header);
      if (text === null) {
        skipped += 1;
        continue;
      }
      const actual = ifaceMethodSlot(text, iface, method);
      if (actual === slot) verified += 1;
      else mismatches.push(`${header}:${iface}.${method} expected ${slot}, header has ${actual ?? 'NONE'}`);
    }
    console.log(`  wgc/msaa slot-gate: ${verified} verified, ${skipped} skipped (header absent), ${mismatches.length} mismatched`);
    if (mismatches.length > 0) console.log(`  ${mismatches.join('\n  ')}`);
    expect(mismatches).toEqual([]);
    expect(verified).toBeGreaterThan(10);
  });

  test('negative control: a transposed slot is caught (the gate is not vacuous)', () => {
    const fake = `typedef struct ID3D11FakeVtbl {
        HRESULT ( STDMETHODCALLTYPE *QueryInterface )( ID3D11Fake *This );
        ULONG ( STDMETHODCALLTYPE *AddRef )( ID3D11Fake *This );
        ULONG ( STDMETHODCALLTYPE *Release )( ID3D11Fake *This );
        HRESULT ( STDMETHODCALLTYPE *Map )( ID3D11Fake *This );
        void ( STDMETHODCALLTYPE *Unmap )( ID3D11Fake *This );
    } ID3D11FakeVtbl;`;
    const members = findInterface(parseScopedVtableSlots(fake), 'ID3D11Fake')!;
    expect(members.get('Map')).toBe(3); // ground truth: QueryInterface(0) AddRef(1) Release(2) Map(3)
    expect(() => expect(members.get('Map')).toBe(14)).toThrow(); // a transposed expectation IS rejected → the gate has teeth
  });
});
