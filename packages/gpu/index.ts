// AI agents: AI.md (shipped with this package) is the complete surface — capability
// table, full API, recipes, and the traps ledger. Read it instead of the source.
export { listAdapters, openAdapter } from './adapter';
export type { AdapterInfo } from './adapter';
export { appendCount, makeConstantBuffer, makeIndirectArgsBuffer, makeStructuredBuffer, readbackBuffer, readbackBufferAsync, readbackBufferInto, updateConstantBuffer, updateDynamicBuffer } from './buffer';
export type { StructuredBuffer, StructuredBufferOptions } from './buffer';
export { cbufferLayout, structLayout } from './cbuffer';
export type { CBufferFieldType, CBufferLayout } from './cbuffer';
export { blobRelease, comRelease, guidBytes, hex, vcall } from './com';
export * from './constants';
export { createKernelDebugLog } from './debug';
export type { DebugLogEntry, KernelDebugLog } from './debug';
export { bindDepth, clearDepth, drawTriangles, makeDepthBuffer, releaseDepth, setCull, setDepthState, setRenderTargetsWithDepth } from './depth';
export type { DepthBuffer } from './depth';
export { createComputeDevice, createDevice, describeDeviceError, destroyDevice, deviceFeatures, getDeviceRemovedReason, hasDevice, requireGpu } from './device';
export type { CreateDeviceOptions, Gpu } from './device';
export { GpuArray, Kernel, flushRunCache, gpuScope, parseKernelBindings, parseNumthreads, run } from './kernel';
export type { DispatchOptions, KernelArray, KernelBinding, RunOptions, ScalarKind } from './kernel';
export { gpuMemory } from './memory';
export type { GpuMemoryReport } from './memory';
export {
  clear,
  copyResource,
  copyStructureCount,
  csSet,
  dispatch,
  dispatchIndirect,
  drawFullscreenTriangle,
  drawPoints,
  generateMips,
  invalidateCsCache,
  makeAdditiveBlendState,
  makeSampler,
  psSet,
  setBlendState,
  setRenderTargets,
  setViewport,
  vsSet,
  vsSetShaderResources,
} from './pipeline';
export type { CsBindings, PsBindings, SamplerOptions } from './pipeline';
export { decodePNG, encodePNG, encodePNGFromBGRA, encodePNGFromRGBA } from './png';
export type { DecodedPNG } from './png';
export { createGpuTimer } from './query';
export type { GpuTimer, GpuTimerResult } from './query';
export { compile, compileCached, disassemble, makeComputeShader, makePixelShader, makeVertexShader, preprocessHLSL } from './shader';
export type { CachedShader, CompileOptions, CompiledShader } from './shader';
export { captureBackBuffer, formatGrid } from './snapshot';
export type { CaptureOptions, SnapshotStats } from './snapshot';
export { flushStdKernelCache, gpuHistogram, gpuMatmul, gpuPrefixScan, gpuSort, gpuSum } from './std';
export { makeTexture, readbackTexture, readbackTextureInto, textureFromPixels } from './texture';
export type { TextureOptions, TextureResult } from './texture';
export { createWindow } from './window';
export type { CreateWindowOptions, Win } from './window';
