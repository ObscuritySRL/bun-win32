import GDI32 from '@bun-win32/gdi32';

// Preload all GDI32 symbols at once
const start = performance.now();
GDI32.Preload();
const end = performance.now();
console.log('GDI32 bindings initialized in %sms', (end - start).toFixed(2));

// Create a memory DC for offscreen drawing
const hdcScreen = GDI32.CreateCompatibleDC(0n);
console.log('CreateCompatibleDC:', hdcScreen ? 'success' : 'failed');

// Create a solid brush
const RED = 0x0000ff; // BGR format
const hBrush = GDI32.CreateSolidBrush(RED);
console.log('CreateSolidBrush:', hBrush ? 'success' : 'failed');

// Create a pen
const hPen = GDI32.CreatePen(0 /* PS_SOLID */, 2, 0x00ff00 /* green */);
console.log('CreatePen:', hPen ? 'success' : 'failed');

// Get a stock object (NULL_BRUSH)
const hStockBrush = GDI32.GetStockObject(5 /* NULL_BRUSH */);
console.log('GetStockObject:', hStockBrush ? 'success' : 'failed');

// Get device capabilities (if we had a real DC)
// const caps = GDI32.GetDeviceCaps(hdcScreen, 8 /* BITSPIXEL */);

// Clean up
if (hPen) GDI32.DeleteObject(hPen);
if (hBrush) GDI32.DeleteObject(hBrush);
if (hdcScreen) GDI32.DeleteDC(hdcScreen);

console.log('GDI32 example completed successfully');
