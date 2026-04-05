import OpenGL32 from '@bun-win32/opengl32';

const start = performance.now();

// Eagerly bind all exports (optional; methods also lazy-load on first call)
OpenGL32.Preload();

const end = performance.now();

console.log(`OpenGL32 preloaded in ${(end - start).toFixed(2)} ms`);

// Ready to use any OpenGL32 entry point
