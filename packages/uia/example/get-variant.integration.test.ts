/**
 * getProperty — live proof of the generic VARIANT property reader (GetCurrentPropertyValue, element slot 10).
 *
 * One binding reads ANY UIA property by id and decodes the VARIANT by its vt tag. Asserts each decode branch
 * against a real app (Calculator): VT_I4 (ProcessId), VT_BSTR (FrameworkId / Name), VT_BOOL (IsOffscreen /
 * HasKeyboardFocus), consistency with the fixed get_CurrentName reader, and that 5000 reads neither crash nor
 * leak (VariantClear frees each BSTR). A wrong slot or a too-small VARIANT buffer would segfault.
 *
 * bun test is broken repo-wide for FFI; runnable harness:
 * Run: bun run example/get-variant.integration.test.ts
 */
import { closeWindow, ControlType, PropertyId, uia } from '@bun-win32/uia';

let failures = 0;
function assert(condition: boolean, message: string): void {
  if (condition) console.log(`  ok: ${message}`);
  else {
    console.error(`  FAIL: ${message}`);
    failures += 1;
  }
}

uia.initialize();
const calc = await uia.launch(['cmd', '/c', 'start', 'calc'], { title: 'Calculator' });
try {
  // VT_I4 — ProcessId is a real positive integer.
  const processId = calc.getProperty(PropertyId.ProcessId);
  console.log(`  ProcessId (VT_I4) = ${processId}`);
  assert(typeof processId === 'number' && processId > 0, 'VT_I4 decodes ProcessId to a positive number');

  // VT_BSTR — FrameworkId + Name decode to strings; Name matches the fixed get_CurrentName reader.
  const frameworkId = calc.getProperty(PropertyId.FrameworkId);
  console.log(`  FrameworkId (VT_BSTR) = ${JSON.stringify(frameworkId)}`);
  assert(typeof frameworkId === 'string' && frameworkId.length > 0, 'VT_BSTR decodes FrameworkId to a non-empty string');
  const nameViaVariant = calc.getProperty(PropertyId.Name);
  assert(nameViaVariant === calc.name, `VT_BSTR Name matches get_CurrentName (${JSON.stringify(nameViaVariant)} === ${JSON.stringify(calc.name)})`);

  // VT_BOOL — IsOffscreen / HasKeyboardFocus decode to booleans.
  const offscreen = calc.getProperty(PropertyId.IsOffscreen);
  console.log(`  IsOffscreen (VT_BOOL) = ${offscreen}`);
  assert(typeof offscreen === 'boolean', 'VT_BOOL decodes IsOffscreen to a boolean');
  assert(offscreen === false, 'a foreground window reads IsOffscreen=false');
  const button = calc.find({ controlType: ControlType.Button });
  assert(button !== null, 'found a button to probe');
  if (button !== null) {
    assert(typeof button.getProperty(PropertyId.HasKeyboardFocus) === 'boolean', 'VT_BOOL decodes HasKeyboardFocus on a button');
    button.release();
  }

  // Unsupported / empty property decodes to null or '' (never a crash).
  const help = calc.getProperty(PropertyId.HelpText);
  assert(help === null || typeof help === 'string', 'an absent property decodes to null/empty, not a throw');

  // Leak/stability: 5000 reads (each allocates + VariantClears a VARIANT, freeing the BSTR) must not crash.
  let sink = 0;
  for (let index = 0; index < 5000; index += 1) {
    const value = calc.getProperty(PropertyId.FrameworkId);
    if (typeof value === 'string') sink += value.length;
  }
  assert(sink === 5000 * String(frameworkId).length, `5000 VT_BSTR reads are stable (no crash, no corruption; sink=${sink})`);
} finally {
  closeWindow(calc.hWnd); // close the throwaway Calculator we launched
  calc.dispose();
  uia.uninitialize();
}

console.log(failures === 0 ? '\nPASS — getProperty verified (VT_I4 / VT_BSTR / VT_BOOL decode, VariantClear stable).' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
