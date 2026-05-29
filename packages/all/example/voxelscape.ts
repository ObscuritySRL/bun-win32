/**
 * Voxelscape — an interactive RAYTRACED voxel world you fly through, rendered
 * entirely by Amanatides-Woo DDA ray traversal in a single fullscreen pixel
 * shader on your real GPU, in pure TypeScript. No triangles, no depth buffer,
 * no rasterized geometry — every pixel marches a ray cell-by-cell through a
 * 128x48x128 voxel grid that lives in a StructuredBuffer<uint> on the GPU.
 *
 * The world is procedurally generated on the CPU at startup from a layered
 * value-noise heightmap: a stone base, dirt, a grass surface, sand shores, a
 * sea level filled with water, and scattered trees (trunk + leaf canopy). Each
 * voxel stores a block type; air is 0. The pixel shader casts a primary DDA ray
 * per pixel, derives the hit FACE NORMAL from the last axis it crossed, lights
 * it with a sun (Lambert + sky ambient), fires a short secondary DDA shadow ray
 * to the sun for soft contact shadows, samples neighbor occupancy for cheap
 * ambient occlusion, and fades everything into a sky gradient with a sun disc
 * via exponential distance fog. The camera is passed as four float3 basis
 * vectors (pos / forward / right / up) in a constant buffer — no matrices, so
 * the column-major HLSL trap never applies.
 *
 * Capture mode (DEMO_DURATION_MS>0): a scripted smooth fly-through orbits and
 * bobs over the terrain looking at the horizon, and a couple of timed block
 * edits drop in. The cursor is never touched. Interactive mode (no duration):
 * WASD + space/shift to move, relative mouse-look, left-click to break a block
 * and right-click to place one (a CPU DDA from screen center picks the target),
 * with a GDI HUD showing fps + controls + GPU name.
 *
 * @bun-win32 / engine APIs: createWindow, createDevice, compile,
 * makeVertexShader/makePixelShader, makeConstantBuffer/updateConstantBuffer,
 * makeStructuredBuffer (cpuWritable SRV, initialData seeding), updateDynamicBuffer,
 * setRenderTargets/setViewport/clear/drawFullscreenTriangle, vsSet/psSet, present,
 * comRelease — plus User32 GetDC/GetCursorPos/SetCursorPos/ShowCursor/GetAsyncKeyState
 * and GDI32 CreateFontW/TextOutW for mouse-look + HUD; captureBackBuffer for the
 * gallery screenshot.
 *
 * Run: bun run packages/all/example/voxelscape.ts
 */

import { resolve } from 'node:path';
import { mkdirSync } from 'node:fs';

import { GDI32, User32 } from '../index';

import * as gpu from './_gpu';
import { captureBackBuffer, formatGrid } from './_snapshot';

const WIDTH = 1280;
const HEIGHT = 720;
const TRANSPARENT_BK = 1;

// World dimensions (i = x + z*W + y*W*D).
const W = 128;
const D = 128;
const H = 48;
const SEA_LEVEL = 16;

// Block types (0 = air). Kept in lockstep with the HLSL palette() switch.
const B_AIR = 0;
const B_GRASS = 1;
const B_DIRT = 2;
const B_STONE = 3;
const B_SAND = 4;
const B_WATER = 5;
const B_WOOD = 6;
const B_LEAF = 7;
const B_SNOW = 8;

// Virtual-key codes for interactive controls.
const VK_W = 0x57;
const VK_A = 0x41;
const VK_S = 0x53;
const VK_DK = 0x44; // D
const VK_SPACE = 0x20;
const VK_SHIFT = 0x10;
const VK_LBUTTON = 0x01;
const VK_RBUTTON = 0x02;

// ── Fullscreen-triangle vertex shader (SV_VertexID, no vertex buffer) ──────────
const VS_SOURCE = `
struct VSOut { float4 pos : SV_Position; float2 uv : TEXCOORD0; };
VSOut main(uint vid : SV_VertexID) {
  VSOut o;
  float2 p = float2((vid << 1) & 2, vid & 2);
  o.uv = p;
  o.pos = float4(p * float2(2.0, -2.0) + float2(-1.0, 1.0), 0.0, 1.0);
  return o;
}
`;

// ── Pixel shader: Amanatides-Woo DDA voxel raytracer ───────────────────────────
const PS_SOURCE = `
cbuffer Frame : register(b0) {
  float2 iResolution;
  float  iTime;
  float  iPad0;
  float3 iCamPos;
  float  iPad1;
  float3 iForward;
  float  iPad2;
  float3 iRight;
  float  iPad3;
  float3 iUp;
  float  iFov;
  float3 iSunDir;
  float  iPad4;
};

StructuredBuffer<uint> Voxels : register(t0);

static const int WX = ${W};
static const int WZ = ${D};
static const int WY = ${H};

uint sampleVoxel(int x, int y, int z) {
  if (x < 0 || y < 0 || z < 0 || x >= WX || y >= WY || z >= WZ) return 0u;
  return Voxels[x + z * WX + y * WX * WZ];
}

// Per-block base albedo. Keep in sync with the TS B_* constants.
float3 blockColor(uint t, float3 cell) {
  if (t == 1u) return float3(0.36, 0.62, 0.22);      // grass
  if (t == 2u) return float3(0.46, 0.32, 0.20);      // dirt
  if (t == 3u) return float3(0.42, 0.43, 0.46);      // stone
  if (t == 4u) return float3(0.82, 0.74, 0.50);      // sand
  if (t == 5u) return float3(0.13, 0.34, 0.55);      // water
  if (t == 6u) return float3(0.34, 0.22, 0.12);      // wood
  if (t == 7u) return float3(0.18, 0.46, 0.18);      // leaf
  if (t == 8u) return float3(0.92, 0.95, 1.00);      // snow
  return float3(0.5, 0.5, 0.5);
}

// Sky / atmosphere: horizon-to-zenith gradient with a sun disc + glow.
float3 skyColor(float3 rd, float3 sun) {
  float up = saturate(rd.y * 0.5 + 0.5);
  float3 horizon = float3(0.66, 0.78, 0.92);
  float3 zenith  = float3(0.13, 0.34, 0.78);
  float3 col = lerp(horizon, zenith, pow(up, 0.7));
  float sd = saturate(dot(rd, sun));
  col += float3(1.0, 0.95, 0.78) * pow(sd, 900.0) * 14.0;         // tight sun disc
  col += float3(1.0, 0.88, 0.60) * pow(sd, 6.0) * 0.45;           // warm glow
  col = lerp(col, float3(0.80, 0.86, 0.93), pow(1.0 - up, 10.0) * 0.4); // slim horizon haze
  return col;
}

// Amanatides-Woo DDA. Returns 1 if a solid voxel was hit before maxSteps.
// On hit: outCell = the voxel coords, outNormal = the face normal, outBlock = type, outT = ray distance.
bool traceVoxels(float3 ro, float3 rd, int maxSteps, bool skipWater,
                 out int3 outCell, out float3 outNormal, out uint outBlock, out float outT) {
  outCell = int3(0,0,0); outNormal = float3(0,0,0); outBlock = 0u; outT = 0.0;

  int3 cell = int3(floor(ro));
  float3 invd = 1.0 / rd;
  int3 step = int3(rd.x < 0.0 ? -1 : 1, rd.y < 0.0 ? -1 : 1, rd.z < 0.0 ? -1 : 1);

  // Distance (in t) to the next grid line on each axis.
  float3 tDelta = abs(invd);
  float3 nextEdge = float3(step.x > 0 ? float(cell.x + 1) : float(cell.x),
                           step.y > 0 ? float(cell.y + 1) : float(cell.y),
                           step.z > 0 ? float(cell.z + 1) : float(cell.z));
  float3 tMax = (nextEdge - ro) * invd;

  float3 normal = float3(0,0,0);
  float t = 0.0;
  [loop]
  for (int i = 0; i < maxSteps; i++) {
    uint b = sampleVoxel(cell.x, cell.y, cell.z);
    if (b != 0u && !(skipWater && b == 5u)) {
      outCell = cell; outNormal = normal; outBlock = b; outT = t;
      return true;
    }
    // Advance to the nearest axis plane.
    if (tMax.x < tMax.y && tMax.x < tMax.z) {
      cell.x += step.x; t = tMax.x; tMax.x += tDelta.x; normal = float3(-step.x, 0, 0);
    } else if (tMax.y < tMax.z) {
      cell.y += step.y; t = tMax.y; tMax.y += tDelta.y; normal = float3(0, -step.y, 0);
    } else {
      cell.z += step.z; t = tMax.z; tMax.z += tDelta.z; normal = float3(0, 0, -step.z);
    }
    // Leaving the vertical slab downward = sky below; bail early.
    if (cell.y < -1 && step.y < 0) break;
    if (cell.y > WY + 1 && step.y > 0) break;
  }
  return false;
}

// Short DDA shadow ray toward the sun (any solid block = occluded).
float shadowRay(float3 ro, float3 rd) {
  int3 c; float3 n; uint b; float tt;
  if (traceVoxels(ro, rd, 48, true, c, n, b, tt)) return 0.25;  // soft, not pitch black
  return 1.0;
}

// Cheap ambient occlusion: count solid neighbors around the hit cell along the
// two tangent axes of the hit face (classic Minecraft-style corner darkening).
float ambientOcc(int3 cell, float3 n, float3 hitPos) {
  // Tangent basis on the face.
  float3 up = abs(n.y) > 0.5 ? float3(1,0,0) : float3(0,1,0);
  float3 t1 = normalize(cross(n, up));
  float3 t2 = cross(n, t1);
  // Position within the face (0..1) to bias toward edges/corners.
  float3 fp = hitPos - (float3(cell) + 0.5);
  float u = dot(fp, t1);
  float v = dot(fp, t2);
  int3 base = cell + int3(n);  // the air cell in front of the face
  int3 du = int3(round(t1));
  int3 dv = int3(round(t2));
  float su = sign(u), sv = sign(v);
  float side1 = sampleVoxel(base.x + int(su)*du.x, base.y + int(su)*du.y, base.z + int(su)*du.z) != 0u ? 1.0 : 0.0;
  float side2 = sampleVoxel(base.x + int(sv)*dv.x, base.y + int(sv)*dv.y, base.z + int(sv)*dv.z) != 0u ? 1.0 : 0.0;
  int3 cc = base + int3(int(su)*du.x + int(sv)*dv.x, int(su)*du.y + int(sv)*dv.y, int(su)*du.z + int(sv)*dv.z);
  float corner = sampleVoxel(cc.x, cc.y, cc.z) != 0u ? 1.0 : 0.0;
  float occ = (side1 + side2 + corner);
  // Weight by how close we are to that corner.
  float edge = saturate((abs(u) + abs(v)) * 1.4);
  float ao = 1.0 - 0.42 * occ / 3.0 * edge;
  return saturate(ao);
}

float4 main(float4 fragPos : SV_Position, float2 uv : TEXCOORD0) : SV_Target {
  float2 res = max(iResolution, float2(1.0, 1.0));
  float2 p = (fragPos.xy * 2.0 - res) / res.y;
  p.y = -p.y;

  float3 rd = normalize(p.x * iRight + p.y * iUp + iFov * iForward);
  float3 ro = iCamPos;
  float3 sun = normalize(iSunDir);

  float3 sky = skyColor(rd, sun);

  int3 cell; float3 n; uint block; float t;
  bool hit = traceVoxels(ro, rd, 320, false, cell, n, block, t);

  float3 col = sky;
  if (hit) {
    float3 hitPos = ro + rd * t;
    float3 albedo = blockColor(block, float3(cell));

    // Subtle per-voxel value variation so faces don't look perfectly flat.
    float vh = frac(sin(dot(float3(cell), float3(12.9898, 78.233, 37.719))) * 43758.5453);
    albedo *= 0.90 + 0.12 * vh;

    // Lighting.
    float ndl = saturate(dot(n, sun));
    float sh = (ndl > 0.0) ? shadowRay(hitPos + n * 0.002, sun) : 0.0;
    float ao = ambientOcc(cell, n, hitPos);

    // Hemispheric sky ambient (warmer toward up-faces, cool toward down-faces).
    float3 skyAmbCol = lerp(float3(0.20, 0.22, 0.27), float3(0.42, 0.50, 0.62), saturate(n.y * 0.5 + 0.5));
    float3 sunCol = float3(1.18, 1.08, 0.88);
    float3 lit = albedo * (skyAmbCol + sunCol * 1.55 * ndl * sh) * ao;

    // Crude specular sparkle on water + snow.
    if (block == 5u || block == 8u) {
      float3 h = normalize(sun - rd);
      float spec = pow(saturate(dot(n, h)), block == 5u ? 80.0 : 28.0);
      lit += float3(1.0, 0.97, 0.88) * spec * (block == 5u ? 0.9 : 0.4) * sh;
    }
    // Water gets a translucent fresnel tint to read as a surface.
    if (block == 5u) {
      float fres = pow(saturate(1.0 + dot(rd, n)), 4.0);
      lit = lerp(lit, sky * 0.6 + float3(0.10, 0.22, 0.34), 0.18 + 0.5 * fres);
    }

    col = lit;

    // Exponential distance fog into the sky for aerial depth — gentle so the
    // foreground voxels stay crisp and only the far hills soften into haze.
    float fog = 1.0 - exp(-t * 0.0022);
    col = lerp(col, sky, saturate(fog * fog));
  }

  // Tonemap + gamma so the highlights (sun glints, lit faces) stay clean.
  col = col / (col + 0.85);
  col = pow(saturate(col), 1.0 / 2.2);

  // Mild vignette.
  float2 q = fragPos.xy / res;
  float vig = pow(16.0 * q.x * q.y * (1.0 - q.x) * (1.0 - q.y), 0.18);
  col *= lerp(0.78, 1.04, vig);

  return float4(col, 1.0);
}
`;

// ── CPU world generation ────────────────────────────────────────────────────
function idx(x: number, y: number, z: number): number {
  return x + z * W + y * W * D;
}

/** Smooth value noise from a hashed integer lattice with bilinear interpolation. */
function makeNoise2D(seed: number): (x: number, z: number) => number {
  const hash = (xi: number, zi: number): number => {
    let h = (xi * 374761393 + zi * 668265263 + seed * 2147483647) | 0;
    h = (h ^ (h >>> 13)) * 1274126177;
    h = h ^ (h >>> 16);
    return ((h >>> 0) % 100000) / 100000; // 0..1
  };
  const smooth = (a: number, b: number, t: number): number => {
    const s = t * t * (3 - 2 * t);
    return a + (b - a) * s;
  };
  return (x: number, z: number): number => {
    const x0 = Math.floor(x);
    const z0 = Math.floor(z);
    const fx = x - x0;
    const fz = z - z0;
    const v00 = hash(x0, z0);
    const v10 = hash(x0 + 1, z0);
    const v01 = hash(x0, z0 + 1);
    const v11 = hash(x0 + 1, z0 + 1);
    const ix0 = smooth(v00, v10, fx);
    const ix1 = smooth(v01, v11, fx);
    return smooth(ix0, ix1, fz);
  };
}

function generateWorld(): Uint32Array {
  const voxels = new Uint32Array(W * H * D); // zero = all air
  const n1 = makeNoise2D(1337);
  const n2 = makeNoise2D(4242);
  const n3 = makeNoise2D(9001);

  const height = new Int32Array(W * D);

  for (let z = 0; z < D; z += 1) {
    for (let x = 0; x < W; x += 1) {
      // Fractal value-noise heightmap (multi-octave).
      let e = 0;
      e += n1(x / 38, z / 38) * 1.0;
      e += n2(x / 17, z / 17) * 0.5;
      e += n3(x / 8.5, z / 8.5) * 0.25;
      e /= 1.75; // 0..1

      // Ridged hill shaping pushes a few peaks above the snow line.
      e = Math.pow(e, 1.35);
      let h = Math.floor(6 + e * (H - 12));
      h = Math.max(2, Math.min(H - 2, h));
      height[x + z * W] = h;

      for (let y = 0; y <= h; y += 1) {
        let block: number;
        if (y === h) {
          if (h >= H - 9) block = B_SNOW;
          else if (h <= SEA_LEVEL + 1) block = B_SAND;
          else block = B_GRASS;
        } else if (y >= h - 3) {
          block = h <= SEA_LEVEL + 1 ? B_SAND : B_DIRT;
        } else {
          block = B_STONE;
        }
        voxels[idx(x, y, z)] = block;
      }

      // Fill water up to sea level over land that sits below it.
      for (let y = h + 1; y <= SEA_LEVEL; y += 1) {
        voxels[idx(x, y, z)] = B_WATER;
      }
    }
  }

  // Scatter a handful of trees on grass above the shoreline.
  let treeSeed = 13579;
  const rng = (): number => {
    treeSeed = (treeSeed * 1103515245 + 12345) & 0x7fffffff;
    return treeSeed / 0x7fffffff;
  };
  const treeCount = 90;
  for (let tIter = 0; tIter < treeCount; tIter += 1) {
    const tx = 4 + Math.floor(rng() * (W - 8));
    const tz = 4 + Math.floor(rng() * (D - 8));
    const gh = height[tx + tz * W]!;
    if (gh <= SEA_LEVEL + 1 || gh >= H - 11) continue;
    if (voxels[idx(tx, gh, tz)] !== B_GRASS) continue;
    const trunk = 4 + Math.floor(rng() * 3);
    for (let y = 1; y <= trunk; y += 1) {
      const yy = gh + y;
      if (yy < H) voxels[idx(tx, yy, tz)] = B_WOOD;
    }
    // Leaf canopy: a rounded blob centered above the trunk top.
    const top = gh + trunk;
    const r = 2;
    for (let dy = -1; dy <= 2; dy += 1) {
      const ry = dy <= 0 ? r : r - dy + 1;
      for (let dz = -ry; dz <= ry; dz += 1) {
        for (let dx = -ry; dx <= ry; dx += 1) {
          if (dx * dx + dz * dz > ry * ry + 1) continue;
          const lx = tx + dx;
          const ly = top + dy;
          const lz = tz + dz;
          if (lx < 0 || lz < 0 || lx >= W || lz >= D || ly < 0 || ly >= H) continue;
          if (voxels[idx(lx, ly, lz)] === B_AIR) voxels[idx(lx, ly, lz)] = B_LEAF;
        }
      }
    }
  }

  return voxels;
}

/** CPU mirror of the shader DDA — picks the targeted/adjacent cell from screen center. */
function pickVoxel(
  voxels: Uint32Array,
  ro: [number, number, number],
  rd: [number, number, number],
  maxSteps: number,
): { hit: boolean; cell: [number, number, number]; prev: [number, number, number] } {
  let cx = Math.floor(ro[0]);
  let cy = Math.floor(ro[1]);
  let cz = Math.floor(ro[2]);
  const sx = rd[0] < 0 ? -1 : 1;
  const sy = rd[1] < 0 ? -1 : 1;
  const sz = rd[2] < 0 ? -1 : 1;
  const idx0 = Math.abs(1 / rd[0]);
  const idy0 = Math.abs(1 / rd[1]);
  const idz0 = Math.abs(1 / rd[2]);
  let tmx = ((sx > 0 ? cx + 1 : cx) - ro[0]) / rd[0];
  let tmy = ((sy > 0 ? cy + 1 : cy) - ro[1]) / rd[1];
  let tmz = ((sz > 0 ? cz + 1 : cz) - ro[2]) / rd[2];
  let px = cx;
  let py = cy;
  let pz = cz;
  for (let i = 0; i < maxSteps; i += 1) {
    if (cx >= 0 && cy >= 0 && cz >= 0 && cx < W && cy < H && cz < D) {
      const b = voxels[idx(cx, cy, cz)]!;
      if (b !== B_AIR && b !== B_WATER) {
        return { hit: true, cell: [cx, cy, cz], prev: [px, py, pz] };
      }
    }
    px = cx;
    py = cy;
    pz = cz;
    if (tmx < tmy && tmx < tmz) {
      cx += sx;
      tmx += idx0;
    } else if (tmy < tmz) {
      cy += sy;
      tmy += idy0;
    } else {
      cz += sz;
      tmz += idz0;
    }
    if (cy < -2 || cy > H + 2) break;
  }
  return { hit: false, cell: [cx, cy, cz], prev: [px, py, pz] };
}

function main(): void {
  const win = gpu.createWindow({ title: 'Voxelscape — raytraced voxel world', width: WIDTH, height: HEIGHT, borderless: true });
  const { w: cw, h: ch } = win.clientSize();
  const g = gpu.createDevice(win.hwnd, { width: cw, height: ch });

  // Build the world on the CPU and upload it as a structured buffer SRV.
  const voxels = generateWorld();
  const voxelBytes = Buffer.from(voxels.buffer, 0, voxels.byteLength);
  const field = gpu.makeStructuredBuffer({ stride: 4, count: W * H * D, srv: true, cpuWritable: true, initialData: voxelBytes });

  // Compile shaders.
  let vs: bigint;
  let ps: bigint;
  let vsCode: gpu.CompiledShader;
  let psCode: gpu.CompiledShader;
  try {
    vsCode = gpu.compile(VS_SOURCE, 'main', 'vs_5_0');
    psCode = gpu.compile(PS_SOURCE, 'main', 'ps_5_0');
    vs = gpu.makeVertexShader(vsCode);
    ps = gpu.makePixelShader(psCode);
  } catch (err) {
    console.error(String((err as Error).message));
    teardown(1);
    return;
  }

  // Constant buffer: 6 × float4 of payload = 96 bytes.
  // res(2)+pad(2) | pos(3)+pad | fwd(3)+pad | right(3)+pad | up(3)+fov | sun(3)+pad
  const CB_SIZE = 96;
  const cb = gpu.makeConstantBuffer(CB_SIZE);
  const cbData = Buffer.alloc(CB_SIZE);

  const samp = gpu.makeSampler(); // unused by the PS but harmless; kept for parity

  // GDI HUD font.
  const hudFont = GDI32.CreateFontW(-18, 0, 0, 0, 600, 0, 0, 0, 0, 0, 0, 4, 0, Buffer.from('Consolas\0', 'utf16le').ptr!);

  // ── Camera state ────────────────────────────────────────────────────────────
  let camX = W * 0.5;
  let camY = SEA_LEVEL + 18;
  let camZ = -10;
  let yaw = 0.0; // around +Y; 0 looks toward +Z
  let pitch = -0.28;
  // Sun fairly high and toward +x/-z so the orbiting camera sweeps through it.
  const sun: [number, number, number] = (() => {
    const elev = 0.62; // radians above horizon
    const azim = 2.3;  // compass-ish heading
    return [Math.cos(elev) * Math.sin(azim), Math.sin(elev), Math.cos(elev) * Math.cos(azim)];
  })();

  const durationMs = process.env.DEMO_DURATION_MS ? Number(process.env.DEMO_DURATION_MS) : 0;
  const interactive = durationMs === 0;

  // Mouse-look recenter target (screen coords of the window center).
  const centerScr = { x: 0, y: 0 };
  if (interactive) {
    const rect = Buffer.alloc(16);
    User32.GetWindowRect(win.hwnd, rect.ptr!);
    centerScr.x = Math.floor((rect.readInt32LE(0) + rect.readInt32LE(8)) / 2);
    centerScr.y = Math.floor((rect.readInt32LE(4) + rect.readInt32LE(12)) / 2);
    User32.ShowCursor(0);
    User32.SetCursorPos(centerScr.x, centerScr.y);
  }

  // Edge-debounce for click edits.
  let prevLeft = false;
  let prevRight = false;
  const ptBuf = Buffer.alloc(8);

  console.log('Voxelscape — DDA voxel raytracer on the GPU.');
  console.log(`  ${g.driver} · ${g.gpuName}  ·  world ${W}x${H}x${D}`);
  console.log(interactive ? '  WASD move · space/shift up/down · mouse look · LMB break · RMB place · ESC exit.' : `  Scripted fly-through (${durationMs} ms).`);

  const startTime = performance.now();
  let frames = 0;
  let fps = 0;
  let fpsWindowStart = startTime;
  let lastNow = startTime;

  // Scripted edits already applied (capture mode), to avoid re-uploading every frame.
  const editsDone = new Set<number>();

  function basis(): { fwd: [number, number, number]; right: [number, number, number]; up: [number, number, number] } {
    const cp = Math.cos(pitch);
    const fwd: [number, number, number] = [Math.sin(yaw) * cp, Math.sin(pitch), Math.cos(yaw) * cp];
    // right = normalize(cross(worldUp, fwd))
    const rx = fwd[2];
    const rz = -fwd[0];
    const rl = Math.hypot(rx, rz) || 1;
    const right: [number, number, number] = [rx / rl, 0, rz / rl];
    // up = cross(fwd, right)
    const up: [number, number, number] = [
      fwd[1] * right[2] - fwd[2] * right[1],
      fwd[2] * right[0] - fwd[0] * right[2],
      fwd[0] * right[1] - fwd[1] * right[0],
    ];
    return { fwd, right, up };
  }

  function reuploadField(): void {
    const buf = Buffer.from(voxels.buffer, 0, voxels.byteLength);
    gpu.updateDynamicBuffer(field.buffer, buf);
  }

  function setBlock(x: number, y: number, z: number, t: number): void {
    if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
    voxels[idx(x, y, z)] = t;
  }

  function drawHud(): void {
    const dc = User32.GetDC(win.hwnd);
    if (!dc) return;
    const prevFont = GDI32.SelectObject(dc, hudFont);
    GDI32.SetBkMode(dc, TRANSPARENT_BK);
    const line = `Voxelscape · ${fps} fps · ${g.gpuName} · WASD+mouse · LMB break / RMB place`;
    const text = Buffer.from(`${line}\0`, 'utf16le');
    const len = line.length;
    GDI32.SetTextColor(dc, 0x000000);
    GDI32.TextOutW(dc, 19, 19, text.ptr!, len);
    GDI32.SetTextColor(dc, 0x00e8f0ff);
    GDI32.TextOutW(dc, 18, 18, text.ptr!, len);
    GDI32.SelectObject(dc, prevFont);
    User32.ReleaseDC(win.hwnd, dc);
  }

  const FOV = 1.5;

  while (!win.shouldClose()) {
    win.pump();
    if (win.shouldClose()) break;

    const now = performance.now();
    const dt = Math.min(0.05, (now - lastNow) / 1000);
    lastNow = now;
    const elapsed = (now - startTime) / 1000;

    if (interactive) {
      // ── Relative mouse-look via GetCursorPos diff against the recenter point ──
      if (User32.GetCursorPos(ptBuf.ptr!)) {
        const mx = ptBuf.readInt32LE(0);
        const my = ptBuf.readInt32LE(4);
        yaw += (mx - centerScr.x) * 0.0022;
        pitch -= (my - centerScr.y) * 0.0022;
        pitch = Math.max(-1.45, Math.min(1.45, pitch));
        User32.SetCursorPos(centerScr.x, centerScr.y);
      }

      const { fwd, right } = basis();
      const speed = (win.keyDown(VK_SHIFT) ? 26 : 14) * dt;
      let mvF = 0;
      let mvR = 0;
      let mvU = 0;
      if (win.keyDown(VK_W)) mvF += 1;
      if (win.keyDown(VK_S)) mvF -= 1;
      if (win.keyDown(VK_DK)) mvR += 1;
      if (win.keyDown(VK_A)) mvR -= 1;
      if (win.keyDown(VK_SPACE)) mvU += 1;
      if (win.keyDown(VK_SHIFT)) mvU -= 1;
      camX += (fwd[0] * mvF + right[0] * mvR) * speed;
      camY += (fwd[1] * mvF + mvU) * speed;
      camZ += (fwd[2] * mvF + right[2] * mvR) * speed;

      // ── Block edit picking from screen center ─────────────────────────────────
      const { fwd: cf } = basis();
      const leftDown = (User32.GetAsyncKeyState(VK_LBUTTON) & 0x8000) !== 0;
      const rightDown = (User32.GetAsyncKeyState(VK_RBUTTON) & 0x8000) !== 0;
      if (leftDown && !prevLeft) {
        const pick = pickVoxel(voxels, [camX, camY, camZ], cf, 64);
        if (pick.hit) {
          setBlock(pick.cell[0], pick.cell[1], pick.cell[2], B_AIR);
          reuploadField();
        }
      }
      if (rightDown && !prevRight) {
        const pick = pickVoxel(voxels, [camX, camY, camZ], cf, 64);
        if (pick.hit) {
          setBlock(pick.prev[0], pick.prev[1], pick.prev[2], B_STONE);
          reuploadField();
        }
      }
      prevLeft = leftDown;
      prevRight = rightDown;
    } else {
      // ── Scripted cinematic fly-through (capture mode) ─────────────────────────
      const tt = elapsed;
      const orbitR = 46;
      const cx = W * 0.5;
      const cz = D * 0.5;
      const ang = 0.35 + tt * 0.28;
      camX = cx + Math.cos(ang) * orbitR;
      camZ = cz + Math.sin(ang) * orbitR - 8;
      camY = SEA_LEVEL + 22 + Math.sin(tt * 0.8) * 3.0;
      // Look from the camera toward the world center, slightly down at the terrain.
      const dx = cx - camX;
      const dz = cz - camZ;
      yaw = Math.atan2(dx, dz);
      pitch = -0.30 + Math.sin(tt * 0.5) * 0.05;

      // Scripted block edits on a timer: drop a small stone pillar near the center.
      if (tt > 1.2 && !editsDone.has(0)) {
        editsDone.add(0);
        const bx = Math.floor(cx) + 6;
        const bz = Math.floor(cz);
        // find ground
        let gy = H - 1;
        while (gy > 0 && voxels[idx(bx, gy, bz)] === B_AIR) gy -= 1;
        for (let y = 1; y <= 8; y += 1) setBlock(bx, gy + y, bz, B_SNOW);
        reuploadField();
      }
      if (tt > 2.6 && !editsDone.has(1)) {
        editsDone.add(1);
        const bx = Math.floor(cx) - 8;
        const bz = Math.floor(cz) + 5;
        let gy = H - 1;
        while (gy > 0 && voxels[idx(bx, gy, bz)] === B_AIR) gy -= 1;
        for (let dyx = -2; dyx <= 2; dyx += 1) {
          for (let dzx = -2; dzx <= 2; dzx += 1) {
            if (dyx * dyx + dzx * dzx > 5) continue;
            setBlock(bx + dyx, gy + 1, bz + dzx, B_WOOD);
          }
        }
        reuploadField();
      }
    }

    // ── Build the constant buffer immediately before the consuming call ─────────
    const { fwd, right, up } = basis();
    cbData.writeFloatLE(cw, 0);
    cbData.writeFloatLE(ch, 4);
    cbData.writeFloatLE(elapsed, 8);
    cbData.writeFloatLE(0, 12);
    cbData.writeFloatLE(camX, 16);
    cbData.writeFloatLE(camY, 20);
    cbData.writeFloatLE(camZ, 24);
    cbData.writeFloatLE(0, 28);
    cbData.writeFloatLE(fwd[0], 32);
    cbData.writeFloatLE(fwd[1], 36);
    cbData.writeFloatLE(fwd[2], 40);
    cbData.writeFloatLE(0, 44);
    cbData.writeFloatLE(right[0], 48);
    cbData.writeFloatLE(right[1], 52);
    cbData.writeFloatLE(right[2], 56);
    cbData.writeFloatLE(0, 60);
    cbData.writeFloatLE(up[0], 64);
    cbData.writeFloatLE(up[1], 68);
    cbData.writeFloatLE(up[2], 72);
    cbData.writeFloatLE(FOV, 76);
    cbData.writeFloatLE(sun[0], 80);
    cbData.writeFloatLE(sun[1], 84);
    cbData.writeFloatLE(sun[2], 88);
    cbData.writeFloatLE(0, 92);
    gpu.updateConstantBuffer(cb, cbData);

    gpu.setRenderTargets([g.backBufferRTV]);
    gpu.setViewport(cw, ch);
    gpu.vsSet(vs);
    gpu.psSet(ps, { cb: [cb], srv: [field.srv!] });
    gpu.drawFullscreenTriangle();

    // ── Capture the gallery PNG on the final frame, before present() ────────────
    const lastFrame = durationMs > 0 && now - startTime >= durationMs;
    if (lastFrame) {
      const shotDir = resolve(import.meta.dir, '..', 'screenshots');
      mkdirSync(shotDir, { recursive: true });
      const stats = captureBackBuffer(g, resolve(shotDir, 'voxelscape.png'), { gridW: 48, gridH: 22 });
      console.log(formatGrid(stats));
      console.log(`[shot] ok=${stats.ok} nonBlack=${stats.nonBlackFrac.toFixed(3)} meanLuma=${stats.meanLuma.toFixed(3)} -> ${stats.path}`);
    }

    g.present(false);
    if (interactive) drawHud();

    frames += 1;
    if (now - fpsWindowStart >= 500) {
      fps = Math.round((frames * 1000) / (now - fpsWindowStart));
      frames = 0;
      fpsWindowStart = now;
    }

    if (lastFrame) break;
  }

  console.log(`Voxelscape done · ${fps} fps · ${g.driver} · ${g.gpuName}`);
  teardown(0);

  // ── Teardown ──────────────────────────────────────────────────────────────
  function teardown(code: number): void {
    if (interactive) User32.ShowCursor(1);
    GDI32.DeleteObject(hudFont);
    comReleaseSafe(samp);
    comReleaseSafe(cb);
    comReleaseSafe(field.srv);
    comReleaseSafe(field.buffer);
    comReleaseSafe(ps);
    comReleaseSafe(vs);
    if (vsCode) gpu.blobRelease(vsCode.blob);
    if (psCode) gpu.blobRelease(psCode.blob);
    comReleaseSafe(g.backBufferRTV);
    comReleaseSafe(g.swapChain);
    comReleaseSafe(g.context);
    comReleaseSafe(g.device);
    win.destroy();
    process.exit(code);
  }
}

function comReleaseSafe(ptr: bigint | undefined): void {
  if (ptr !== undefined && ptr !== 0n) gpu.comRelease(ptr);
}

process.on('SIGINT', () => process.exit(0));
process.on('uncaughtException', (e) => {
  console.error(e);
  process.exit(1);
});

main();
