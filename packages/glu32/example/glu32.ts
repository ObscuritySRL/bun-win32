import GLU32 from '@bun-win32/glu32';

// Optionally preload all symbols once (or rely on lazy binding)
const start = performance.now();

GLU32.Preload();

const end = performance.now();

const ms = (end - start).toFixed(2);

console.log('GLU32 bindings initialized in %sms', ms);
