/**
 * DWM Compositor Report - Full Desktop Window Manager status report.
 *
 * Queries every available DWM API to produce a comprehensive report of the
 * compositor's current state. Uses DwmIsCompositionEnabled, DwmGetColorizationColor
 * (both the color value and the opaque-blend flag), DwmFlush, and
 * DwmGetTransportAttributes. Attempts DwmGetWindowAttribute on the foreground
 * window (via User32) to read extended frame bounds, cloaked state, and
 * corner preference.
 *
 * Demonstrates:
 * - DwmIsCompositionEnabled
 * - DwmGetColorizationColor (ARGB breakdown, opaque blend)
 * - DwmFlush (synchronize with compositor)
 * - DwmGetTransportAttributes (remote session detection)
 * - DwmGetWindowAttribute (per-window DWM attributes)
 * - Cross-package: User32.GetForegroundWindow, User32.GetWindowTextW
 *
 * Run: bun run example/compositor-report.ts
 */

import Dwmapi, { WindowAttribute } from '../index';
import User32 from '@bun-win32/user32';

const encode = (str: string) => Buffer.from(`${str}\0`, 'utf16le');

function hresultToString(hr: number): string {
  if (hr === 0) return 'S_OK';
  return `0x${(hr >>> 0).toString(16).padStart(8, '0')}`;
}

const divider = '-'.repeat(64);

console.log('DWM COMPOSITOR STATUS REPORT');
console.log(`Timestamp: ${new Date().toISOString()}`);
console.log(divider);
console.log('');

// 1. Composition enabled check
console.log('1. COMPOSITION STATE');
const enabledBuf = Buffer.alloc(4);
const hr1 = Dwmapi.DwmIsCompositionEnabled(enabledBuf.ptr);
const compositionEnabled = hr1 === 0 ? enabledBuf.readInt32LE(0) !== 0 : null;

console.log(`   API Call:       DwmIsCompositionEnabled`);
console.log(`   HRESULT:        ${hresultToString(hr1)}`);
if (compositionEnabled !== null) {
  console.log(`   Enabled:        ${compositionEnabled ? 'Yes' : 'No'}`);
  console.log(`   Raw Value:      ${enabledBuf.readInt32LE(0)}`);
} else {
  console.log(`   Status:         Query failed`);
}
console.log('');

// 2. Accent color (colorization)
console.log('2. COLORIZATION (ACCENT COLOR)');
const colorBuf = Buffer.alloc(4);
const opaqueBlendBuf = Buffer.alloc(4);
const hr2 = Dwmapi.DwmGetColorizationColor(colorBuf.ptr, opaqueBlendBuf.ptr);

console.log(`   API Call:       DwmGetColorizationColor`);
console.log(`   HRESULT:        ${hresultToString(hr2)}`);

if (hr2 === 0) {
  const rawColor = colorBuf.readUInt32LE(0);
  const alpha = (rawColor >>> 24) & 0xff;
  const red = (rawColor >>> 16) & 0xff;
  const green = (rawColor >>> 8) & 0xff;
  const blue = rawColor & 0xff;
  const opaqueBlend = opaqueBlendBuf.readInt32LE(0) !== 0;

  console.log(`   Raw DWORD:      0x${rawColor.toString(16).padStart(8, '0').toUpperCase()}`);
  console.log(`   Alpha:          ${alpha} (0x${alpha.toString(16).padStart(2, '0')})`);
  console.log(`   Red:            ${red} (0x${red.toString(16).padStart(2, '0')})`);
  console.log(`   Green:          ${green} (0x${green.toString(16).padStart(2, '0')})`);
  console.log(`   Blue:           ${blue} (0x${blue.toString(16).padStart(2, '0')})`);
  console.log(`   Hex RGB:        #${red.toString(16).padStart(2, '0')}${green.toString(16).padStart(2, '0')}${blue.toString(16).padStart(2, '0')}`);
  console.log(`   Opaque Blend:   ${opaqueBlend} (${opaqueBlend ? 'color is opaquely blended' : 'color has alpha transparency'})`);
  console.log(`   Swatch:         \x1b[48;2;${red};${green};${blue}m        \x1b[0m`);
} else {
  console.log(`   Status:         Query failed`);
}
console.log('');

// 3. DwmFlush
console.log('3. COMPOSITOR FLUSH');
const flushStart = performance.now();
const hr3 = Dwmapi.DwmFlush();
const flushDuration = performance.now() - flushStart;

console.log(`   API Call:       DwmFlush`);
console.log(`   HRESULT:        ${hresultToString(hr3)}`);
console.log(`   Duration:       ${flushDuration.toFixed(2)}ms`);
console.log(`   Note:           Flush waits for the next compositor frame`);
console.log('');

// 4. Transport attributes (remote session detection)
console.log('4. TRANSPORT ATTRIBUTES');
const remotingBuf = Buffer.alloc(4);
const connectedBuf = Buffer.alloc(4);
const generationBuf = Buffer.alloc(4);
const hr4 = Dwmapi.DwmGetTransportAttributes(remotingBuf.ptr, connectedBuf.ptr, generationBuf.ptr);

console.log(`   API Call:       DwmGetTransportAttributes`);
console.log(`   HRESULT:        ${hresultToString(hr4)}`);

if (hr4 === 0) {
  const isRemoting = remotingBuf.readInt32LE(0) !== 0;
  const isConnected = connectedBuf.readInt32LE(0) !== 0;
  const generation = generationBuf.readUInt32LE(0);

  console.log(`   Is Remoting:    ${isRemoting} (${isRemoting ? 'Remote Desktop session' : 'Local session'})`);
  console.log(`   Is Connected:   ${isConnected}`);
  console.log(`   Generation:     ${generation}`);
} else {
  console.log(`   Status:         Query failed`);
}
console.log('');

// 5. Per-window attributes on the foreground window
console.log('5. FOREGROUND WINDOW ATTRIBUTES');
const fgHwnd = User32.GetForegroundWindow();

if (!fgHwnd) {
  console.log(`   Foreground:     No foreground window detected`);
} else {
  const titleBuf = Buffer.alloc(512);
  const titleLen = User32.GetWindowTextW(fgHwnd, titleBuf.ptr, 256);
  const title = titleLen > 0 ? titleBuf.subarray(0, titleLen * 2).toString('utf16le') : '(untitled)';

  console.log(`   Window Handle:  0x${fgHwnd.toString(16)}`);
  console.log(`   Window Title:   ${title.length > 50 ? title.substring(0, 47) + '...' : title}`);

  // Try DWMWA_EXTENDED_FRAME_BOUNDS (RECT: 16 bytes)
  const frameBoundsBuf = Buffer.alloc(16);
  const hrFrame = Dwmapi.DwmGetWindowAttribute(fgHwnd, WindowAttribute.DWMWA_EXTENDED_FRAME_BOUNDS, frameBoundsBuf.ptr, 16);
  console.log(`   Extended Frame Bounds:`);
  if (hrFrame === 0) {
    const left = frameBoundsBuf.readInt32LE(0);
    const top = frameBoundsBuf.readInt32LE(4);
    const right = frameBoundsBuf.readInt32LE(8);
    const bottom = frameBoundsBuf.readInt32LE(12);
    console.log(`     Left:         ${left}`);
    console.log(`     Top:          ${top}`);
    console.log(`     Right:        ${right}`);
    console.log(`     Bottom:       ${bottom}`);
    console.log(`     Size:         ${right - left} x ${bottom - top}`);
  } else {
    console.log(`     HRESULT:      ${hresultToString(hrFrame)} (query failed)`);
  }

  // Try DWMWA_CLOAKED (DWORD: 4 bytes)
  const cloakedBuf = Buffer.alloc(4);
  const hrCloaked = Dwmapi.DwmGetWindowAttribute(fgHwnd, WindowAttribute.DWMWA_CLOAKED, cloakedBuf.ptr, 4);
  console.log(`   Cloaked State:`);
  if (hrCloaked === 0) {
    const cloakedValue = cloakedBuf.readUInt32LE(0);
    const reasons: string[] = [];
    if (cloakedValue & 0x01) reasons.push('DWM_CLOAKED_APP');
    if (cloakedValue & 0x02) reasons.push('DWM_CLOAKED_SHELL');
    if (cloakedValue & 0x04) reasons.push('DWM_CLOAKED_INHERITED');
    console.log(`     Value:        ${cloakedValue} (${reasons.length > 0 ? reasons.join(' | ') : 'Not cloaked'})`);
  } else {
    console.log(`     HRESULT:      ${hresultToString(hrCloaked)} (query failed)`);
  }

  // Try DWMWA_NCRENDERING_ENABLED (BOOL: 4 bytes)
  const ncRenderBuf = Buffer.alloc(4);
  const hrNcRender = Dwmapi.DwmGetWindowAttribute(fgHwnd, WindowAttribute.DWMWA_NCRENDERING_ENABLED, ncRenderBuf.ptr, 4);
  console.log(`   NC Rendering:`);
  if (hrNcRender === 0) {
    const ncRenderEnabled = ncRenderBuf.readInt32LE(0) !== 0;
    console.log(`     Enabled:      ${ncRenderEnabled}`);
  } else {
    console.log(`     HRESULT:      ${hresultToString(hrNcRender)} (query failed)`);
  }

  // Try DWMWA_USE_IMMERSIVE_DARK_MODE (BOOL: 4 bytes)
  const darkModeBuf = Buffer.alloc(4);
  const hrDark = Dwmapi.DwmGetWindowAttribute(fgHwnd, WindowAttribute.DWMWA_USE_IMMERSIVE_DARK_MODE, darkModeBuf.ptr, 4);
  console.log(`   Immersive Dark Mode:`);
  if (hrDark === 0) {
    const darkMode = darkModeBuf.readInt32LE(0) !== 0;
    console.log(`     Enabled:      ${darkMode}`);
  } else {
    console.log(`     HRESULT:      ${hresultToString(hrDark)} (attribute may not be readable)`);
  }
}

console.log('');
console.log(divider);
console.log('Report complete.');
