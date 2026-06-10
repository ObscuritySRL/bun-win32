/** Shim — the depth layer now lives in @bun-win32/gpu. */
export { bindDepth as bindGpu3d, clearDepth, drawTriangles, makeDepthBuffer, releaseDepth as releaseGpu3d, setCull, setDepthState, setRenderTargetsWithDepth } from '@bun-win32/gpu';
export type { DepthBuffer } from '@bun-win32/gpu';
