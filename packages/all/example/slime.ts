/**
 * Physarum slime mold — millions of agents growing a living network on your GPU.
 *
 * A borderless 1280x720 window fills with a luminous, breathing vein network that
 * is not drawn but GROWN: 1,048,576 agents crawl across a trail field, each one
 * sensing the trail at three points (front-left, front, front-right), steering
 * toward the strongest scent, stepping forward, wrapping at the edges, and
 * depositing a fresh pheromone droplet. Every droplet is written with an
 * `InterlockedAdd` into a fixed-point `RWTexture2D<uint>`, so a million concurrent
 * agents pile onto the same cells without a single lost write. A second compute
 * pass diffuses the field with a 3x3 blur and decays it ~5% per frame, and the
 * filaments organize themselves — exactly like the real slime mold — into the
 * delicate, ever-shifting transport network you see. Nothing is precomputed: HLSL
 * is JIT-compiled at startup and the whole simulation lives on the real
 * ID3D11Device. Move the mouse to drop a food source the agents swarm toward.
 *
 * Pipeline (per frame, ~60 fps off a PeekMessage pump):
 *   1. AGENT pass [numthreads(256,1,1)] over 1,048,576 agents — sense 3 trail taps,
 *      steer toward the brightest, advance by the step size, wrap, then
 *      InterlockedAdd a fixed-point deposit into the trail RWTexture2D<uint>.
 *   2. DIFFUSE+DECAY pass [numthreads(16,16,1)] — read the trail as a Texture2D<uint>
 *      SRV, 3x3 box blur, multiply by ~0.95, write the next trail UAV (ping-pong).
 *   3. RENDER pass — a full-screen triangle PS Loads the trail, adds a soft 9-tap
 *      glow, and maps intensity through a deep-blue → cyan → white palette with a
 *      Reinhard tonemap + gamma for an HDR-ish bloom.
 *   A GDI TextOutW HUD reads "Physarum · <N> agents · <fps> fps · ESC".
 *
 * Engine / @bun-win32 APIs used (see ./_gpu.ts):
 *   createWindow / createDevice / compile / makeComputeShader / makeVertexShader /
 *   makePixelShader / makeStructuredBuffer (agent UAV) / makeTexture (R32_UINT
 *   UAV+SRV trail ping-pong) / makeConstantBuffer / updateConstantBuffer /
 *   csSet / dispatch / vsSet / psSet / setRenderTargets / setViewport / clear /
 *   drawFullscreenTriangle / present / comRelease — plus GDI32 CreateFontW/TextOutW.
 *
 * Run: bun run packages/all/example/slime.ts
 */

import { FFIType } from 'bun:ffi';

import { GDI32 } from '../index';
import * as hud from './_hud';
import {
  CTX_CS_SET_SHADER_RESOURCES,
  CTX_CS_SET_UNORDERED_ACCESS_VIEWS,
  DXGI_FORMAT_R32_UINT,
  clear,
  comRelease,
  compile,
  createDevice,
  createWindow,
  csSet,
  dispatch,
  drawFullscreenTriangle,
  makeComputeShader,
  makeConstantBuffer,
  makePixelShader,
  makeStructuredBuffer,
  makeTexture,
  makeVertexShader,
  psSet,
  setRenderTargets,
  setViewport,
  updateConstantBuffer,
  vcall,
  vsSet,
} from './_gpu';

const encodeWide = (str: string): Buffer => Buffer.from(`${str}\0`, 'utf16le');

const WIDTH = 1280;
const HEIGHT = 720;
// const AGENT_COUNT = (1 << 20) * 5; // 1,048,576 agents
const AGENT_COUNT = 1 << 20; // 1,048,576 agents
const AGENT_GROUP = 256;
const DIFFUSE_GROUP = 16;

// ── Window + device ───────────────────────────────────────────────────────────
const win = createWindow({ title: 'Physarum — a living network grown on the GPU', width: WIDTH, height: HEIGHT, borderless: true });
const { w: clientW, h: clientH } = win.clientSize();
const gpu = createDevice(win.hwnd, { width: clientW, height: clientH });
gpu.recreateRTV();

// ── Trail field constants (shared by every compute pass) ──────────────────────
// cbuffer Sim (16-byte aligned, multiple of 16):
//   uint  width, height, agentCount, frame;        (16)
//   float time, deltaScale, decay, depositAmount;  (16)
//   float senseAngle, senseDist, turnSpeed, stepSize; (16)
//   float foodX, foodY, foodActive, pad;           (16)
const CB_SIZE = 64;
const cb = makeConstantBuffer(CB_SIZE);
const cbData = Buffer.alloc(CB_SIZE);

// ── Agents: float2 pos + float angle = 12 bytes/agent ─────────────────────────
const AGENT_STRIDE = 16; // 12 bytes used, padded to 16 for alignment cleanliness
const agentInit = Buffer.alloc(AGENT_STRIDE * AGENT_COUNT);
{
  const cx = clientW / 2;
  const cy = clientH / 2;
  const radius = Math.min(clientW, clientH) * 0.42;
  // Deterministic LCG so the seed is reproducible run-to-run.
  let seed = 0x1234_5678 >>> 0;
  const rand = (): number => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 0x1_0000_0000;
  };
  for (let i = 0; i < AGENT_COUNT; i += 1) {
    // Seed inside a disk, each agent facing roughly toward the center (with jitter).
    const r = Math.sqrt(rand()) * radius;
    const a = rand() * Math.PI * 2;
    const px = cx + Math.cos(a) * r;
    const py = cy + Math.sin(a) * r;
    const toCenter = Math.atan2(cy - py, cx - px) + (rand() - 0.5) * 1.2;
    const o = i * AGENT_STRIDE;
    agentInit.writeFloatLE(px, o);
    agentInit.writeFloatLE(py, o + 4);
    agentInit.writeFloatLE(toCenter, o + 8);
    agentInit.writeFloatLE(0, o + 12);
  }
}
const agents = makeStructuredBuffer({ stride: AGENT_STRIDE, count: AGENT_COUNT, uav: true, initialData: agentInit });

// ── Trail ping-pong: R32_UINT, fixed-point intensity, UAV + SRV ───────────────
let trailA = makeTexture({ w: clientW, h: clientH, format: DXGI_FORMAT_R32_UINT, uav: true, srv: true });
let trailB = makeTexture({ w: clientW, h: clientH, format: DXGI_FORMAT_R32_UINT, uav: true, srv: true });

// Fixed-point scale: deposits/diffusion work in integers, decoded as float/SCALE.
const TRAIL_SCALE = 1024;
const DEPOSIT = Math.round(0.9 * TRAIL_SCALE); // pheromone dropped per agent per frame

// ── HLSL ──────────────────────────────────────────────────────────────────────
const SIM_CB = `
cbuffer Sim : register(b0) {
  uint  uWidth; uint uHeight; uint uAgentCount; uint uFrame;
  float uTime; float uDeltaScale; float uDecay; float uDeposit;
  float uSenseAngle; float uSenseDist; float uTurnSpeed; float uStepSize;
  float uFoodX; float uFoodY; float uFoodActive; float uPad;
};
`;

// Agent pass: sense → steer → move → wrap → deposit (InterlockedAdd).
const AGENT_CS = `
${SIM_CB}
struct Agent { float2 pos; float angle; float pad; };
RWStructuredBuffer<Agent> Agents : register(u0);
RWTexture2D<uint> Trail : register(u1);

// Cheap per-agent hash for steer jitter (Wang hash).
uint hash(uint s) {
  s ^= 2747636419u; s *= 2654435769u;
  s ^= s >> 16; s *= 2654435769u;
  s ^= s >> 16; s *= 2654435769u;
  return s;
}
float rnd(uint s) { return float(hash(s)) / 4294967295.0; }

// Read the trail intensity at a sensed point (clamped to bounds).
float sense(float2 pos, float angle, float dist) {
  int2 c = int2(pos + float2(cos(angle), sin(angle)) * dist);
  if (c.x < 0 || c.x >= int(uWidth) || c.y < 0 || c.y >= int(uHeight)) return 0.0;
  return float(Trail[c]);
}

[numthreads(${AGENT_GROUP},1,1)]
void main(uint3 id : SV_DispatchThreadID) {
  uint i = id.x;
  if (i >= uAgentCount) return;

  Agent a = Agents[i];
  float angle = a.angle;
  float2 pos = a.pos;

  // Sense three points ahead.
  float fwd  = sense(pos, angle, uSenseDist);
  float left = sense(pos, angle + uSenseAngle, uSenseDist);
  float right= sense(pos, angle - uSenseAngle, uSenseDist);

  float rs = rnd(i + uFrame * 2654435761u);
  if (fwd > left && fwd > right) {
    // keep heading
  } else if (fwd < left && fwd < right) {
    angle += (rs - 0.5) * 2.0 * uTurnSpeed; // ambiguous — wobble randomly
  } else if (right > left) {
    angle -= uTurnSpeed * (0.5 + rs);
  } else if (left > right) {
    angle += uTurnSpeed * (0.5 + rs);
  }

  // Optional food attraction: bias heading gently toward the mouse drop point.
  if (uFoodActive > 0.5) {
    float2 toFood = float2(uFoodX, uFoodY) - pos;
    float d = length(toFood);
    if (d > 1.0) {
      float fa = atan2(toFood.y, toFood.x);
      float diff = atan2(sin(fa - angle), cos(fa - angle));
      angle += diff * 0.06 * saturate(220.0 / d);
    }
  }

  // Advance and wrap at the edges (toroidal field).
  float2 dir = float2(cos(angle), sin(angle));
  pos += dir * uStepSize * uDeltaScale;
  float W = float(uWidth); float H = float(uHeight);
  if (pos.x < 0.0) pos.x += W; else if (pos.x >= W) pos.x -= W;
  if (pos.y < 0.0) pos.y += H; else if (pos.y >= H) pos.y -= H;

  // If an agent somehow leaves bounds (rare), nudge its angle so it re-enters.
  int2 cell = int2(pos);
  cell = clamp(cell, int2(0,0), int2(int(uWidth)-1, int(uHeight)-1));

  a.pos = pos;
  a.angle = angle;
  Agents[i] = a;

  // Deposit pheromone (atomic so a million writers never lose a droplet).
  uint dummy;
  InterlockedAdd(Trail[cell], (uint)uDeposit, dummy);
}
`;

// Diffuse + decay: 3x3 box blur of the source trail, decayed, into the dest trail.
const DIFFUSE_CS = `
${SIM_CB}
Texture2D<uint> Src : register(t0);
RWTexture2D<uint> Dst : register(u0);

[numthreads(${DIFFUSE_GROUP},${DIFFUSE_GROUP},1)]
void main(uint3 id : SV_DispatchThreadID) {
  if (id.x >= uWidth || id.y >= uHeight) return;
  int2 c = int2(id.xy);
  uint sum = 0u;
  [unroll]
  for (int dy = -1; dy <= 1; dy++) {
    [unroll]
    for (int dx = -1; dx <= 1; dx++) {
      int2 s = int2(c.x + dx, c.y + dy);
      s = clamp(s, int2(0,0), int2(int(uWidth)-1, int(uHeight)-1));
      sum += Src.Load(int3(s, 0));
    }
  }
  // Box average (blur) then exponential decay.
  float blurred = float(sum) / 9.0;
  float decayed = blurred * uDecay;
  Dst[c] = (uint)max(decayed, 0.0);
}
`;

// Vertex: a single full-screen triangle from SV_VertexID.
const VS = `
struct VSOut { float4 pos : SV_Position; float2 uv : TEXCOORD0; };
VSOut main(uint vid : SV_VertexID) {
  VSOut o;
  float2 p = float2((vid << 1) & 2, vid & 2);
  o.uv = p;
  o.pos = float4(p * float2(2.0, -2.0) + float2(-1.0, 1.0), 0.0, 1.0);
  return o;
}
`;

// Render: Load the trail, soft 9-tap glow, deep-blue → cyan → white palette.
const PS = `
${SIM_CB}
Texture2D<uint> Trail : register(t0);

float trailAt(int2 c) {
  c = clamp(c, int2(0,0), int2(int(uWidth)-1, int(uHeight)-1));
  return float(Trail.Load(int3(c, 0))) / ${TRAIL_SCALE}.0;
}

float3 palette(float t) {
  // Deep navy → electric blue → cyan → white-hot, luminous and tasteful.
  t = saturate(t);
  float3 c0 = float3(0.01, 0.02, 0.06);
  float3 c1 = float3(0.05, 0.18, 0.55);
  float3 c2 = float3(0.10, 0.65, 0.95);
  float3 c3 = float3(0.65, 0.98, 1.00);
  float3 c4 = float3(1.00, 1.00, 0.98);
  float3 col;
  if (t < 0.25)       col = lerp(c0, c1, t / 0.25);
  else if (t < 0.55)  col = lerp(c1, c2, (t - 0.25) / 0.30);
  else if (t < 0.85)  col = lerp(c2, c3, (t - 0.55) / 0.30);
  else                col = lerp(c3, c4, (t - 0.85) / 0.15);
  return col;
}

float4 main(float4 fragPos : SV_Position, float2 uv : TEXCOORD0) : SV_Target {
  int2 c = int2(fragPos.xy);

  // Soft glow: a small weighted 9-tap (the diffuse pass already blurs the field,
  // this widens the bloom radius for an HDR-ish halo around bright veins).
  float center = trailAt(c);
  float glow = center * 4.0;
  glow += (trailAt(c + int2( 2, 0)) + trailAt(c + int2(-2, 0)) +
           trailAt(c + int2( 0, 2)) + trailAt(c + int2( 0,-2))) * 1.0;
  glow += (trailAt(c + int2( 3, 3)) + trailAt(c + int2(-3, 3)) +
           trailAt(c + int2( 3,-3)) + trailAt(c + int2(-3,-3))) * 0.5;
  glow /= 10.0;

  float intensity = center + glow * 1.6;
  // Compress with a soft curve so faint filaments still glow but veins burn bright.
  float t = 1.0 - exp(-intensity * 2.2);

  float3 col = palette(t);
  // Add a touch of bloom-white at the very brightest cores.
  col += pow(saturate(t - 0.7) / 0.3, 2.0) * float3(0.6, 0.7, 0.8);

  // Subtle vignette for depth.
  float2 q = fragPos.xy / float2(uWidth, uHeight);
  float vig = pow(16.0 * q.x * q.y * (1.0 - q.x) * (1.0 - q.y), 0.18);
  col *= lerp(0.7, 1.05, vig);

  col = col / (col + 0.6);          // gentle Reinhard tonemap
  col = pow(col, 1.0 / 2.2);        // gamma
  return float4(col, 1.0);
}
`;

// ── Compile + create shaders ──────────────────────────────────────────────────
const agentCsCode = compile(AGENT_CS, 'main', 'cs_5_0');
const diffuseCsCode = compile(DIFFUSE_CS, 'main', 'cs_5_0');
const vsCode = compile(VS, 'main', 'vs_5_0');
const psCode = compile(PS, 'main', 'ps_5_0');

const agentCs = makeComputeShader(agentCsCode);
const diffuseCs = makeComputeShader(diffuseCsCode);
const vs = makeVertexShader(vsCode);
const ps = makePixelShader(psCode);

// ── Helpers to fully unbind compute resources between passes (avoid hazards) ───
const nullPtrArr = Buffer.alloc(8); // single null slot
function clearCsUav(): void {
  vcall(gpu.context, CTX_CS_SET_UNORDERED_ACCESS_VIEWS, [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], [0, 1, nullPtrArr.ptr!, null], FFIType.void);
  vcall(gpu.context, CTX_CS_SET_UNORDERED_ACCESS_VIEWS, [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], [1, 1, nullPtrArr.ptr!, null], FFIType.void);
}
function clearCsSrv(): void {
  vcall(gpu.context, CTX_CS_SET_SHADER_RESOURCES, [FFIType.u32, FFIType.u32, FFIType.ptr], [0, 1, nullPtrArr.ptr!], FFIType.void);
}

// ── GDI HUD font ──────────────────────────────────────────────────────────────
const hudFont = GDI32.CreateFontW(-18, 0, 0, 0, 600, 0, 0, 0, 0, 0, 0, 4 /* ANTIALIASED_QUALITY */, 0, encodeWide('Consolas').ptr!);
const TRANSPARENT_BK = 1;
function drawHud(fps: number): void {
  hud.draw(gpu, clientW, clientH, (dc) => {
    const prevFont = GDI32.SelectObject(dc, hudFont);
    GDI32.SetBkMode(dc, TRANSPARENT_BK);
    const millions = (AGENT_COUNT / 1_000_000).toFixed(2);
    const line = `Physarum · ${millions}M agents · ${fps} fps · ${gpu.gpuName} · ESC`;
    const text = encodeWide(line);
    const len = line.length;
    GDI32.SetTextColor(dc, 0x00100800); // dark shadow (BGR)
    GDI32.TextOutW(dc, 17, 17, text.ptr!, len);
    GDI32.SetTextColor(dc, 0x00f5e8c8); // warm cyan-white (BGR)
    GDI32.TextOutW(dc, 16, 16, text.ptr!, len);
    GDI32.SelectObject(dc, prevFont);
  });
}

// ── Teardown ──────────────────────────────────────────────────────────────────
let cleaned = false;
function cleanup(code: number): never {
  if (!cleaned) {
    cleaned = true;
    hud.release();
    GDI32.DeleteObject(hudFont);
    comRelease(agents.uav ?? 0n);
    comRelease(agents.buffer);
    comRelease(trailA.uav ?? 0n);
    comRelease(trailA.srv ?? 0n);
    comRelease(trailA.tex);
    comRelease(trailB.uav ?? 0n);
    comRelease(trailB.srv ?? 0n);
    comRelease(trailB.tex);
    comRelease(cb);
    comRelease(ps);
    comRelease(vs);
    comRelease(diffuseCs);
    comRelease(agentCs);
    comRelease(gpu.backBufferRTV);
    comRelease(gpu.swapChain);
    comRelease(gpu.context);
    comRelease(gpu.device);
    win.destroy();
  }
  process.exit(code);
}
process.on('SIGINT', () => cleanup(0));
process.on('uncaughtException', (err) => {
  console.error(err);
  cleanup(1);
});

console.log('Physarum slime mold — 1,048,576 agents growing a living network on the GPU.');
console.log(`  ${clientW}x${clientH} · ${gpu.driver} · ${gpu.gpuName}`);
console.log('  Move the mouse to drop a food source · ESC to exit.');

// ── Render loop ───────────────────────────────────────────────────────────────
const start = performance.now();
const durationMs = process.env.DEMO_DURATION_MS ? Number(process.env.DEMO_DURATION_MS) : 0;
let frame = 0;
let fps = 0;
let fpsFrames = 0;
let fpsWindow = start;

const agentGroups = Math.ceil(AGENT_COUNT / AGENT_GROUP);
const diffuseGroupsX = Math.ceil(clientW / DIFFUSE_GROUP);
const diffuseGroupsY = Math.ceil(clientH / DIFFUSE_GROUP);

while (!win.shouldClose()) {
  win.pump();
  if (win.shouldClose()) break;

  const now = performance.now();
  const time = (now - start) / 1000;
  const mouse = win.getMouse();

  // Build the sim constant buffer immediately before the passes that consume it.
  cbData.writeUInt32LE(clientW, 0);
  cbData.writeUInt32LE(clientH, 4);
  cbData.writeUInt32LE(AGENT_COUNT, 8);
  cbData.writeUInt32LE(frame >>> 0, 12);
  cbData.writeFloatLE(time, 16);
  cbData.writeFloatLE(1.0, 20); // deltaScale (fixed-step; keeps the network stable)
  cbData.writeFloatLE(0.955, 24); // decay
  cbData.writeFloatLE(DEPOSIT, 28); // deposit amount (fixed-point)
  cbData.writeFloatLE(0.45, 32); // sense angle (rad)
  cbData.writeFloatLE(9.0, 36); // sense distance (px)
  cbData.writeFloatLE(0.32, 40); // turn speed (rad)
  cbData.writeFloatLE(1.0, 44); // step size (px)
  cbData.writeFloatLE(mouse.x, 48); // food x
  cbData.writeFloatLE(mouse.y, 52); // food y
  cbData.writeFloatLE(mouse.down ? 1.0 : 0.0, 56); // food active only while clicking
  cbData.writeFloatLE(0, 60);
  updateConstantBuffer(cb, cbData);

  // ── Pass 1: agents sense + steer + move + deposit into trailA (UAV) ─────────
  clearCsSrv();
  csSet(agentCs, { cb: [cb], uav: [agents.uav!, trailA.uav!] });
  dispatch(agentGroups, 1, 1);
  clearCsUav();

  // ── Pass 2: diffuse + decay trailA (SRV) → trailB (UAV) ─────────────────────
  csSet(diffuseCs, { cb: [cb], srv: [trailA.srv!], uav: [trailB.uav!] });
  dispatch(diffuseGroupsX, diffuseGroupsY, 1);
  clearCsUav();
  clearCsSrv();

  // ── Pass 3: render trailB through the palette into the back buffer ──────────
  setRenderTargets([gpu.backBufferRTV]);
  setViewport(clientW, clientH);
  clear(gpu.backBufferRTV, [0.01, 0.02, 0.05, 1]);
  vsSet(vs);
  psSet(ps, { cb: [cb], srv: [trailB.srv!] });
  drawFullscreenTriangle();
  // Unbind the PS SRV so trailB can be a UAV next frame.
  vcall(gpu.context, 8 /* CTX_PS_SET_SHADER_RESOURCES */, [FFIType.u32, FFIType.u32, FFIType.ptr], [0, 1, nullPtrArr.ptr!], FFIType.void);
  setRenderTargets([]);

  drawHud(fps);
  gpu.present(false);

  // Ping-pong: next frame, agents deposit on the freshly-diffused field.
  const tmp = trailA;
  trailA = trailB;
  trailB = tmp;

  frame += 1;
  fpsFrames += 1;
  if (now - fpsWindow >= 500) {
    fps = Math.round((fpsFrames * 1000) / (now - fpsWindow));
    fpsFrames = 0;
    fpsWindow = now;
  }

  if (durationMs > 0 && now - start >= durationMs) break;
}

console.log(`  ran ${frame} frames over ${((performance.now() - start) / 1000).toFixed(2)}s (${fps} fps, ${((AGENT_COUNT * frame) / 1e6).toFixed(0)}M agent-steps).`);
cleanup(0);
