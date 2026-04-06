import Dwmapi, { WindowAttribute, SystemBackdropType, WindowCornerPreference } from '../index';

// Smoke test 1: Check if DWM composition is enabled
const enabledBuf = Buffer.alloc(4);
const hr1 = Dwmapi.DwmIsCompositionEnabled(enabledBuf.ptr);

if (hr1 !== 0) {
  console.error('DwmIsCompositionEnabled failed with HRESULT:', hr1);
  process.exit(1);
}

console.log(`DwmIsCompositionEnabled: ${enabledBuf.readInt32LE(0) ? 'yes' : 'no'}`);

// Smoke test 2: Get the system colorization color
const colorBuf = Buffer.alloc(4);
const opaqueBuf = Buffer.alloc(4);
const hr2 = Dwmapi.DwmGetColorizationColor(colorBuf.ptr, opaqueBuf.ptr);

if (hr2 !== 0) {
  console.error('DwmGetColorizationColor failed with HRESULT:', hr2);
  process.exit(1);
}

const color = colorBuf.readUInt32LE(0);
const a = (color >>> 24) & 0xff;
const r = (color >>> 16) & 0xff;
const g = (color >>> 8) & 0xff;
const b = color & 0xff;
console.log(`DwmGetColorizationColor: #${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')} (alpha=${a}, opaque=${!!opaqueBuf.readInt32LE(0)})`);

// Smoke test 3: DwmFlush
const hr3 = Dwmapi.DwmFlush();

if (hr3 !== 0) {
  console.error('DwmFlush failed with HRESULT:', hr3);
  process.exit(1);
}

console.log('DwmFlush: OK');

// Smoke test 4: DwmGetTransportAttributes
const remoteBuf = Buffer.alloc(4);
const connBuf = Buffer.alloc(4);
const genBuf = Buffer.alloc(4);
const hr4 = Dwmapi.DwmGetTransportAttributes(remoteBuf.ptr, connBuf.ptr, genBuf.ptr);

if (hr4 !== 0) {
  console.error('DwmGetTransportAttributes failed with HRESULT:', hr4);
  process.exit(1);
}

console.log(`DwmGetTransportAttributes: remoting=${!!remoteBuf.readInt32LE(0)}, connected=${!!connBuf.readInt32LE(0)}, generation=${genBuf.readUInt32LE(0)}`);

// Smoke test 5: Verify enum exports
console.log(`\nWindowAttribute enum:`);
console.log(`  DWMWA_USE_IMMERSIVE_DARK_MODE = ${WindowAttribute.DWMWA_USE_IMMERSIVE_DARK_MODE}`);
console.log(`  DWMWA_SYSTEMBACKDROP_TYPE     = ${WindowAttribute.DWMWA_SYSTEMBACKDROP_TYPE}`);
console.log(`  DWMWA_WINDOW_CORNER_PREFERENCE = ${WindowAttribute.DWMWA_WINDOW_CORNER_PREFERENCE}`);
console.log(`SystemBackdropType.DWMSBT_MAINWINDOW (Mica) = ${SystemBackdropType.DWMSBT_MAINWINDOW}`);
console.log(`WindowCornerPreference.DWMWCP_ROUND = ${WindowCornerPreference.DWMWCP_ROUND}`);

console.log('\nAll smoke tests passed.');
