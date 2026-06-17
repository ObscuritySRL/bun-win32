// Correctness + perf gate for the COM vtable SLOT table — the package's spine, where one transposed slot is an
// unchecked function-pointer call that SEGFAULTS (com.ts). audit.ts/nullcheck.ts skip uia (no structs/ or
// types/ dir), so this is the SLOT table's only automated coverage. It parses UIAutomationClient.h's C-style
// `*Vtbl` structs (the authoritative vtable declaration order) into methodName→slotIndex sets and asserts
// every constants.ts SLOT entry the header defines matches. Skips cleanly when the SDK header is absent.
// Beyond the UIA SLOT table it also gates the WGC/MSAA/D3D11 and OCR engine slot consts against their own SDK
// headers, proves no drift between the gated slots and the engines' actual vcall call sites, and carries one
// window-free perf-regression invariant (the TrueCondition memoization) so a lost memoization fails `bun test`.
import { describe, expect, test } from 'bun:test';
import { FFIType } from 'bun:ffi';
import { existsSync, readdirSync, readFileSync } from 'node:fs';

import { automation, compileCondition, root, trueCondition, uninitialize, Window } from './index';
import { comRelease, invokerCacheSize, vcall } from './com';
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

/** Slot of `method` in a C++ IUnknown-derived interface decl that uses `STDMETHOD(...)` (no `*Vtbl`, no
 *  `IFACEMETHOD`). robuffer.h's IBufferByteAccess (the OCR pixel-write interface) is declared this way:
 *  `struct IBufferByteAccess : public IUnknown { STDMETHOD(Buffer)(...) = 0; };`. Own members start at slot 3. */
function stdmethodSlot(header: string, interfaceName: string, method: string): number | null {
  const open = new RegExp(`\\b${interfaceName}\\s*:\\s*public\\s+IUnknown[\\s\\S]*?\\{([\\s\\S]*?)\\n\\s*\\}`, 'm');
  const body = open.exec(header);
  if (body === null) return null;
  const names: string[] = [];
  const declaration = /STDMETHOD\s*\(\s*(\w+)\s*\)/g;
  for (let entry = declaration.exec(body[1]!); entry !== null; entry = declaration.exec(body[1]!)) names.push(entry[1]!);
  const local = names.indexOf(method);
  return local === -1 ? null : local + 3; // QueryInterface(0) AddRef(1) Release(2) then the interface's own members
}

const path = sdkHeader('um', 'UIAutomationClient.h');

// A SLOT method name the header declares on MORE THAN ONE interface (e.g. Select is SelectionItem slot 3 AND
// TextRange slot 16) → its owning interface. The plain name-keyed check unions every interface's slot for a
// name, so it would PASS a transposition into a colliding interface's index and then segfault (com.ts does an
// unchecked vtable walk); these MUST be verified against the ONE interface they're actually invoked on. Add an
// entry here whenever a new SLOT name becomes ambiguous (the test fails loudly until you do).
const AMBIGUOUS_OWNER: Record<string, string> = {
  AddToSelection: 'IUIAutomationSelectionItemPattern',
  GetCurrentSelection: 'IUIAutomationSelectionPattern',
  Move: 'IUIAutomationTransformPattern', // TransformPattern.Move=3 collides by name with TextRange.Move=13
  RemoveFromSelection: 'IUIAutomationSelectionItemPattern',
  ScrollIntoView: 'IUIAutomationScrollItemPattern',
  Select: 'IUIAutomationSelectionItemPattern',
  ShowContextMenu: 'IUIAutomationElement3',
  SetValue: 'IUIAutomationValuePattern',
  get_CachedName: 'IUIAutomationElement',
  get_CurrentName: 'IUIAutomationElement',
  get_CurrentValue: 'IUIAutomationValuePattern',
};

describe('SLOT table ↔ UIAutomationClient.h', () => {
  test.skipIf(path === null)('every SLOT entry the SDK header defines matches its declared vtable index', () => {
    const header = readFileSync(path!, 'utf8');
    const slots = parseVtableSlots(header);
    const scoped = parseScopedVtableSlots(header); // per-interface, to disambiguate collision-named slots
    const mismatches: string[] = [];
    let verified = 0;
    let notInHeader = 0;
    for (const [name, slot] of Object.entries(SLOT)) {
      const found = slots.get(name);
      if (found === undefined) {
        notInHeader += 1;
        continue;
      }
      if (found.size > 1) {
        // Ambiguous across interfaces — the union check is vacuous; verify against the owning interface.
        const owner = AMBIGUOUS_OWNER[name];
        if (owner === undefined) {
          mismatches.push(`${name}: AMBIGUOUS (header declares it at {${[...found].join(',')}}) with no AMBIGUOUS_OWNER mapping — add one so it is verified against its owning interface`);
          continue;
        }
        const actual = findInterface(scoped, owner)?.get(name);
        if (actual === slot) verified += 1;
        else mismatches.push(`${name}: constants.ts=${slot} but ${owner} declares it at ${actual ?? 'NONE'}`);
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

// The WGC (wgc.ts, 15 slots) and MSAA (msaa.ts, 5 slots) engines hold their vtable slots as plain module
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
    ['um', 'oleacc.h', 'IAccessible', 'accLocation', 22], // 5-out-pointer call (msaa.ts accLocation) — the arity where a transposed slot is most catastrophic
    ['um', 'oleacc.h', 'IAccessible', 'get_accChildCount', 8],
    ['um', 'oleacc.h', 'IAccessible', 'get_accName', 10],
    ['um', 'oleacc.h', 'IAccessible', 'get_accRole', 13],
    ['um', 'shobjidl_core.h', 'IVirtualDesktopManager', 'IsWindowOnCurrentVirtualDesktop', 3], // desktop.ts
    ['um', 'shobjidl_core.h', 'IVirtualDesktopManager', 'GetWindowDesktopId', 4], // desktop.ts
    // MoveWindowToDesktop (slot 5) is DELIBERATELY not gated: desktop.ts never binds or calls it (the public
    // method is an E_ACCESSDENIED OS wall for foreign windows — see desktop.ts header). "Covered" means
    // "called"; the coverage-completeness test below proves every slot desktop.ts actually vcalls (3,4) is here.
    // TextRange.Select=16 collides by name with SelectionItem.Select=3, so it lives as a local const in
    // patterns.ts (TEXTRANGE_SELECT) and is verified here by interface, not via the name-keyed SLOT block.
    ['um', 'UIAutomationClient.h', 'IUIAutomationTextRange', 'Select', 16],
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

  test.skipIf(path === null)('ambiguity guard: a collision-named SLOT is checked against its owning interface, not the union', () => {
    const scoped = parseScopedVtableSlots(readFileSync(path!, 'utf8'));
    const union = parseVtableSlots(readFileSync(path!, 'utf8'));
    // Select is genuinely ambiguous (SelectionItem.Select=3 AND TextRange.Select=16) — the union check is vacuous.
    expect(union.get('Select')?.size ?? 0).toBeGreaterThan(1);
    expect(findInterface(scoped, 'IUIAutomationSelectionItemPattern')?.get('Select')).toBe(3);
    expect(findInterface(scoped, 'IUIAutomationTextRange')?.get('Select')).toBe(16);
    // So a transposition of SLOT.Select (3) into the colliding 16 would fail the owning-interface check (3 !== 16),
    // even though the union {3,16} would have accepted it.
  });
});

// The OCR engine (ocr.ts) walks ~17 WinRT vtable slots across 12 interfaces through the SAME com.ts vcall, yet
// none lived in any slot-gate table — a future transposed slot (e.g. an SDK reorder, or a copy-paste off-by-one)
// would segfault UNCATCHABLY and take the MCP server down with zero coverage. This block mirrors the ocr.ts SLOT
// consts as the authoritative spec and verifies each against its OWN interface's vtable in the SDK header. The
// generic IAsyncOperation<OcrResult> / IVectorView<T> specializations and IBuffer/IBufferFactory/SoftwareBitmap-
// Statics/IOcrEngine* are C `*Vtbl` structs (parseScopedVtableSlots); IAsyncInfo is a classic MIDL `*Vtbl` in
// asyncinfo.h; IBufferByteAccess (robuffer.h) is a C++ `STDMETHOD(...) : public IUnknown` decl (stdmethodSlot).
describe('OCR SLOT coverage (ocr.ts)', () => {
  // [subdir, header, interface-name-suffix, method, expected slot, ocr.ts const] — C `*Vtbl` interfaces.
  // Suffixes are chosen long enough to be unique: e.g. CompletedHandler also ends with COcrResult, so the
  // AsyncOperation suffix carries its `_1_Windows__CMedia__COcr__` segment to disambiguate.
  const VTBL: ReadonlyArray<readonly ['um' | 'winrt', string, string, string, number]> = [
    ['winrt', 'windows.storage.streams.h', 'CStreams_CIBufferFactory', 'Create', 6], // BUFFERFACTORY_CREATE
    ['winrt', 'windows.storage.streams.h', 'CStreams_CIBuffer', 'put_Length', 8], // BUFFER_PUT_LENGTH
    ['winrt', 'windows.graphics.imaging.h', 'CImaging_CISoftwareBitmapStatics', 'CreateCopyFromBuffer', 9], // SBSTATICS_CREATE_COPY_FROM_BUFFER
    ['winrt', 'windows.media.ocr.h', 'COcr_CIOcrEngineStatics', 'TryCreateFromUserProfileLanguages', 10], // OCRSTATICS_TRY_CREATE_FROM_USER_PROFILE
    ['winrt', 'windows.media.ocr.h', 'COcr_CIOcrEngine', 'RecognizeAsync', 6], // ENGINE_RECOGNIZE_ASYNC
    ['winrt', 'asyncinfo.h', 'IAsyncInfo', 'get_Status', 7], // ASYNCINFO_GET_STATUS
    ['winrt', 'windows.media.ocr.h', 'AsyncOperation_1_Windows__CMedia__COcr__COcrResult', 'GetResults', 8], // ASYNCOP_GET_RESULTS
    ['winrt', 'windows.media.ocr.h', 'COcr_CIOcrResult', 'get_Lines', 6], // RESULT_GET_LINES
    ['winrt', 'windows.media.ocr.h', 'COcr_CIOcrResult', 'get_Text', 8], // RESULT_GET_TEXT
    ['winrt', 'windows.media.ocr.h', 'VectorView_1_Windows__CMedia__COcr__COcrLine', 'GetAt', 6], // VECTORVIEW_GET_AT (lines view)
    ['winrt', 'windows.media.ocr.h', 'VectorView_1_Windows__CMedia__COcr__COcrLine', 'get_Size', 7], // VECTORVIEW_GET_SIZE (lines view)
    ['winrt', 'windows.media.ocr.h', 'VectorView_1_Windows__CMedia__COcr__COcrWord', 'GetAt', 6], // VECTORVIEW_GET_AT (words view)
    ['winrt', 'windows.media.ocr.h', 'VectorView_1_Windows__CMedia__COcr__COcrWord', 'get_Size', 7], // VECTORVIEW_GET_SIZE (words view)
    ['winrt', 'windows.media.ocr.h', 'COcr_CIOcrLine', 'get_Words', 6], // LINE_GET_WORDS
    ['winrt', 'windows.media.ocr.h', 'COcr_CIOcrLine', 'get_Text', 7], // LINE_GET_TEXT
    ['winrt', 'windows.media.ocr.h', 'COcr_CIOcrWord', 'get_BoundingRect', 6], // WORD_GET_BOUNDING_RECT
    ['winrt', 'windows.media.ocr.h', 'COcr_CIOcrWord', 'get_Text', 7], // WORD_GET_TEXT
  ];
  // [subdir, header, interface, method, expected slot, ocr.ts const] — C++ `STDMETHOD(...) : public IUnknown`.
  const STDMETHOD: ReadonlyArray<readonly ['um' | 'winrt', string, string, string, number]> = [
    ['winrt', 'robuffer.h', 'IBufferByteAccess', 'Buffer', 3], // BYTEACCESS_BUFFER
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

  const anyHeaderPresent = VTBL.some(([subdir, header]) => sdkHeader(subdir, header) !== null) || STDMETHOD.some(([subdir, header]) => sdkHeader(subdir, header) !== null);

  test.skipIf(!anyHeaderPresent)('every ocr.ts slot const matches its SDK-header vtable index', () => {
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
    for (const [subdir, header, iface, method, slot] of STDMETHOD) {
      const text = headerText(subdir, header);
      if (text === null) {
        skipped += 1;
        continue;
      }
      const actual = stdmethodSlot(text, iface, method);
      if (actual === slot) verified += 1;
      else mismatches.push(`${header}:${iface}.${method} expected ${slot}, header has ${actual ?? 'NONE'}`);
    }
    console.log(`  ocr slot-gate: ${verified} verified, ${skipped} skipped (header absent), ${mismatches.length} mismatched`);
    if (mismatches.length > 0) console.log(`  ${mismatches.join('\n  ')}`);
    expect(mismatches).toEqual([]);
    expect(verified).toBeGreaterThan(15);
  });

  test('negative control: stdmethodSlot rejects a transposed IBufferByteAccess slot (the gate is not vacuous)', () => {
    const fake = `struct IFakeByteAccess : public IUnknown\n{\n    STDMETHOD(Buffer)(byte **value) = 0;\n}`;
    expect(stdmethodSlot(fake, 'IFakeByteAccess', 'Buffer')).toBe(3); // QueryInterface(0) AddRef(1) Release(2) Buffer(3)
    expect(() => expect(stdmethodSlot(fake, 'IFakeByteAccess', 'Buffer')).toBe(2)).toThrow(); // a transposed expectation IS rejected → the gate has teeth
  });
});

// Drift guard. The gate tables above are hand-curated, so they CAN drift from the code: gate a slot the code
// never calls (the old MoveWindowToDesktop=5 entry) or — far worse — MISS a slot the code DOES call (a freshly
// added vcall that segfaults with zero coverage). This test ties the tables to the actual call sites by parsing
// each engine module for the slot-const VALUES it passes as the 2nd arg of a vcall, and asserts a two-way match
// against the authoritative per-file slot ledger below. It runs offline (pure source parsing, no SDK header,
// no window), so it is always on under `bun test` and fails loudly the next time an engine adds/moves a vcall.
describe('slot-gate coverage ↔ engine call sites (no drift)', () => {
  const ENGINE = `${import.meta.dir}`;
  // file → the set of distinct vtable slots the gate verifies for that engine's call sites. IUnknown 0/1/2
  // (QueryInterface/AddRef/Release) are universal across every COM interface and never transposed, so they are
  // exempt from the "every called slot is gated" rule; they are excluded here and from the parsed call sites.
  const GATED_SLOTS_BY_FILE: Record<string, ReadonlySet<number>> = {
    'ocr.ts': new Set([3, 6, 7, 8, 9, 10]), // BYTEACCESS_BUFFER, *_CREATE/RECOGNIZE/GET_*, get_Status, GetResults/get_Text, CreateCopyFromBuffer, TryCreateFromUserProfile
    'msaa.ts': new Set([8, 10, 13, 22]), // get_accChildCount, get_accName, get_accRole, accLocation
    'desktop.ts': new Set([3, 4]), // IsWindowOnCurrentVirtualDesktop, GetWindowDesktopId
    'wgc.ts': new Set([3, 5, 6, 7, 10, 14, 15, 47]), // interop/access/framepool/session/frame/device/context slots
  };
  const IUNKNOWN_SLOTS = new Set([0, 1, 2]);

  /** name → numeric value, for every `const NAME = <number>;` in the source (the engine's slot-const block). */
  function constValues(source: string): Map<string, number> {
    const values = new Map<string, number>();
    const decl = /const\s+([A-Z][A-Z0-9_]+)\s*=\s*(0x[0-9a-f_]+|\d+)\s*;/gi;
    for (let entry = decl.exec(source); entry !== null; entry = decl.exec(source)) values.set(entry[1]!, Number(entry[2]!.replace(/_/g, '')));
    return values;
  }

  /** The distinct slot VALUES passed as the 2nd argument of a `vcall(this, SLOT_CONST, …)` in the source. */
  function calledSlots(source: string, values: Map<string, number>): Set<number> {
    const slots = new Set<number>();
    const call = /vcall\(\s*[^,]+,\s*([A-Z][A-Z0-9_]+)\b/g;
    for (let entry = call.exec(source); entry !== null; entry = call.exec(source)) {
      const value = values.get(entry[1]!);
      if (value !== undefined && !IUNKNOWN_SLOTS.has(value)) slots.add(value);
    }
    return slots;
  }

  for (const [file, gated] of Object.entries(GATED_SLOTS_BY_FILE)) {
    test(`${file}: every vcall slot is gated, and every gated slot is actually called`, () => {
      const source = readFileSync(`${ENGINE}/${file}`, 'utf8');
      const called = calledSlots(source, constValues(source));
      expect(called.size).toBeGreaterThan(0); // sanity: the parser found real call sites
      const ungated = [...called].filter((slot) => !gated.has(slot)).sort((a, b) => a - b);
      const dead = [...gated].filter((slot) => !called.has(slot)).sort((a, b) => a - b);
      expect({ file, ungated }).toEqual({ file, ungated: [] }); // a called-but-ungated slot would segfault with zero coverage
      expect({ file, dead }).toEqual({ file, dead: [] }); // a gated-but-uncalled slot is stale curation (the MoveWindowToDesktop drift)
    });
  }

  // patterns.ts is the ONE engine file excluded from GATED_SLOTS_BY_FILE above: its only raw-literal vcall slot,
  // TEXTRANGE_SELECT, collides by name with SelectionItem.Select=3, so it lives as a local const (patterns.ts)
  // instead of in SLOT. The VTBL block above verifies the HARDCODED value 16 against UIAutomationClient.h's
  // IUIAutomationTextRange.Select — but nothing tied that header-verified value to patterns.ts's actual literal,
  // so a 16->17 typo (= TextRange.AddToSelection) or a 16->a-different-arity slot (= reads params from garbage
  // registers -> crash) passed the whole gate. This pins the literal to the gated value: it parses patterns.ts's
  // own `const TEXTRANGE_SELECT = <n>` and asserts n === the slot the VTBL block verifies against the header (16).
  test('patterns.ts TEXTRANGE_SELECT literal matches the header-verified IUIAutomationTextRange.Select slot (16)', () => {
    const source = readFileSync(`${ENGINE}/patterns.ts`, 'utf8');
    const textRangeSelect = constValues(source).get('TEXTRANGE_SELECT');
    expect(textRangeSelect).not.toBeUndefined(); // the const must exist and be parseable (a sanity check on the parser)
    expect(textRangeSelect).toBe(16); // 16 = the slot the VTBL block above verifies vs UIAutomationClient.h IUIAutomationTextRange.Select; a wrong literal fails loudly here
  });
});

// Perf-regression guard (the seat-mandated automated perf gate). The package's two highest-value perf wins are
// memoizations whose loss is invisible to every other automated check: the shared TrueCondition singleton (a
// regression that re-creates+releases it per find({})/findAll({})/regex selector AND per waitFor poll — two
// cross-process round-trips each), and com.ts's per-method CFunction invoker cache. This asserts the condition
// memoization as a pure structural invariant: trueCondition() returns the SAME pointer twice, and an empty
// selector compiles to that SAME pointer with owned=false (so no per-call create/release). It uses only the
// in-process IUIAutomation client (CoCreateInstance — NO window, NO app launch), so it runs under `bun test`.
describe('perf-regression: TrueCondition memoization (no window)', () => {
  test('trueCondition() is a memoized singleton and compileCondition({}) reuses it (owned=false)', () => {
    try {
      const client = automation(); // in-process CUIAutomation COM server — no window
      const first = trueCondition();
      expect(first).not.toBe(0n);
      expect(trueCondition()).toBe(first); // second call MUST reuse the singleton, not create a new condition
      const compiled = compileCondition(client, {}); // an empty selector → the shared TrueCondition
      expect(compiled.owned).toBe(false); // owned=false means callers do NOT release it (it is the shared singleton)
      expect(compiled.condition).toBe(first); // and it IS the same pointer — no per-call CreateTrueCondition round-trip
    } finally {
      uninitialize();
    }
  });

  // Behavioral guard for com.ts's per-method CFunction invoker cache (com.ts:invokers) — the single hottest
  // per-call cost in the package. CFunction construction is orders of magnitude more expensive than the Map
  // lookup, so a regression that drops invokers.get/set (rebuilding a CFunction on every vcall) would be
  // invisible to every other automated check. This drives two REAL vcalls per method on the in-process client
  // (no window) and asserts the cache: a repeated call to the SAME method adds nothing, two DISTINCT methods
  // add exactly one entry each. Measured as deltas so it is independent of which other vcalls ran first.
  test('com.ts invoker cache memoizes per method (a repeated vcall does NOT rebuild the CFunction)', () => {
    try {
      const client = automation(); // in-process CUIAutomation COM server — no window
      const out = Buffer.alloc(8);
      // First vcall to CreateTrueCondition (slot 21) — binds and caches one CFunction for that method pointer.
      expect(vcall(client, SLOT.CreateTrueCondition, [FFIType.ptr], [out.ptr!])).toBe(0); // S_OK
      comRelease(out.readBigUInt64LE(0)); // release the created condition (CreateTrueCondition allocates a fresh one)
      const afterFirst = invokerCacheSize();
      // Second vcall to the SAME method — the resolved method pointer is identical, so the cache MUST be reused.
      expect(vcall(client, SLOT.CreateTrueCondition, [FFIType.ptr], [out.ptr!])).toBe(0);
      comRelease(out.readBigUInt64LE(0));
      expect(invokerCacheSize()).toBe(afterFirst); // a rebuilt-per-call CFunction would grow this — the regression
      // A DISTINCT method (CreateFalseCondition, slot 22) is a different method pointer -> exactly one new entry.
      expect(vcall(client, SLOT.CreateFalseCondition, [FFIType.ptr], [out.ptr!])).toBe(0);
      comRelease(out.readBigUInt64LE(0));
      expect(invokerCacheSize()).toBe(afterFirst + 1);
    } finally {
      uninitialize();
    }
  });
});

// Native-memory safety guard. Element owns a raw COM interface pointer; before the #ptr-zeroing fix, release()
// was `comRelease(this.ptr)` on a never-zeroed readonly ptr, so a SECOND release()/dispose() vcalled IUnknown::
// Release (slot 2) on a refcount-0, freed proxy and SEGFAULTED the host Bun process UNCATCHABLY (panic, exit 3).
// Window.dispose() routes through release(), so a `using app` + an explicit dispose, or a careless re-release in
// a catch/finally, took the long-lived MCP server down. This pins release() idempotency: a second release is a
// no-op (ptr stays 0n), and any post-release accessor hits the com.ts null-interface guard and throws CATCHABLY
// instead of UAF-crashing. NOTE the guard's scope: it only catches a LITERAL-null (0n) thisPtr — a non-null-but-
// unmapped thisPtr (a raw/garbage address) still segfaults the host uncatchably at com.ts's first deref (Bun has no
// safe-read), which is why release() ZEROES the pointer rather than leaving a dangling non-null one. Uses only the
// in-process CUIAutomation client (root() → a real owned IUIAutomationElement*, NO window, NO app launch), runs under `bun test`.
describe('native-memory safety: Element.release() / Window.dispose() idempotency (no window)', () => {
  test('a double release() is a no-op (ptr→0n) and a post-release accessor throws catchably, not UAF-segfaults', () => {
    try {
      const element = root(); // a real owned IUIAutomationElement* from the in-process COM server — no window
      expect(element.ptr).not.toBe(0n);
      element.release();
      expect(element.ptr).toBe(0n); // the owner zeroed its raw pointer — the precondition for release-once
      expect(() => element.release()).not.toThrow(); // a SECOND release is a harmless no-op (comRelease(0n)), not a double-Release segfault
      expect(element.ptr).toBe(0n);
      expect(() => element.name).toThrow('null interface pointer'); // a post-release accessor throws catchably (com.ts), never a UAF crash
    } finally {
      uninitialize();
    }
  });

  test('Window.dispose() inherits release() idempotency — a double dispose (and a using+explicit-dispose) is a no-op, not a segfault', () => {
    try {
      const out = Buffer.alloc(8);
      expect(vcall(automation(), SLOT.GetRootElement, [FFIType.ptr], [out.ptr!])).toBe(0); // a real owned IUIAutomationElement*, no window
      const window = new Window(out.readBigUInt64LE(0), 0n); // the SOLE owner of that pointer (dummy hWnd — dispose only touches the COM ptr)
      expect(window.ptr).not.toBe(0n);
      window.dispose();
      expect(window.ptr).toBe(0n); // dispose() → release() zeroed the owned pointer
      expect(() => window.dispose()).not.toThrow(); // a SECOND dispose is a no-op (the `using` + explicit-dispose double-dispose path), not a double-Release segfault
      expect(() => window[Symbol.dispose]()).not.toThrow(); // and the `using` teardown is equally safe after an explicit dispose
      expect(window.ptr).toBe(0n);
    } finally {
      uninitialize();
    }
  });

  // Pins the EXACT scope of com.ts's first guard: a LITERAL-null (0n) thisPtr throws catchably. The complementary
  // non-null-but-unmapped case (e.g. vcall(0xdeadn, …)) is deliberately NOT exercised — it segfaults the host
  // uncatchably (Bun has no safe-read), so a passing assertion is impossible and the comment in com.ts documents it.
  test('vcall on a literal-null (0n) thisPtr throws catchably — the guard covers ONLY the null case, not unmapped pointers', () => {
    expect(() => vcall(0n, SLOT.GetRootElement, [FFIType.ptr], [Buffer.alloc(8).ptr!])).toThrow('null interface pointer');
    expect(() => comRelease(0n)).not.toThrow(); // comRelease(0n) is a documented no-op (never reaches the deref)
  });
});
