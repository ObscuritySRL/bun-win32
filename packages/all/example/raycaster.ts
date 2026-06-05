/**
 * Raycaster — a Wolfenstein-3D-style textured maze, rendered ENTIRELY as one fullscreen
 * HLSL pixel shader, in pure TypeScript on your real GPU.
 *
 * No meshes, no depth buffer, no vertex buffers: a borderless window that FILLS the primary
 * monitor draws a first-person view of a walkable 24x24 grid maze. The CPU (TypeScript) owns
 * the world — the map bytes, the player position/heading, WASD+arrow movement with wall
 * collision — and uploads the classic Lode camera vectors (dir + plane) plus a handful of
 * sprite positions through a constant buffer each frame. The GPU then DDA-raycasts every
 * screen column per pixel: near walls tower, far walls shrink (true perspective), each wall
 * cell gets a DISTINCT procedural texture (running-bond brick / cut-stone / mossy brick /
 * blue tech-tile), N/S faces are shaded darker than E/W, and the floor + ceiling are textured
 * with a strong distance-graded gradient — not a flat gray fill. A couple of glowing "lamp"
 * sprites are billboarded with correct depth occlusion against the walls. A glowing GDI
 * minimap + HUD sits on top. It reads as 1992; it is 100% TypeScript.
 *
 * Controls: W/S walk, A/D strafe, ←/→ turn, mouse drag to turn, ESC to exit.
 *
 * Pipeline (each frame): TS movement + collision → pack camera/sprite constant buffer →
 * setRenderTargets([backBufferRTV]) → fullscreen-triangle VS → raycast PS (map SRV + cbuffer) →
 * drawFullscreenTriangle() → present() → GDI minimap overlay.
 *
 * @bun-win32 / engine APIs: createWindow, createDevice, compile, makeVertexShader/makePixelShader,
 * makeConstantBuffer/updateConstantBuffer, makeStructuredBuffer (map SRV), setRenderTargets/
 * setViewport/clear/vsSet/psSet/drawFullscreenTriangle, present, comRelease/blobRelease — plus
 * User32 GetDC/GetSystemMetrics and GDI32 Rectangle/MoveToEx/LineTo/Ellipse/CreateFontW/TextOutW;
 * captureBackBuffer for the gallery/self-check screenshot.
 *
 * Run: bun run packages/all/example/raycaster.ts
 */

import { GDI32, User32 } from '../index';

import * as gpu from './_gpu';
import * as hud from './_hud';
import { captureBackBuffer, formatGrid } from './_snapshot';

// Virtual keys.
const VK_LEFT = 0x25;
const VK_UP = 0x26;
const VK_RIGHT = 0x27;
const VK_DOWN = 0x28;
const VK_W = 0x57;
const VK_A = 0x41;
const VK_S = 0x53;
const VK_D = 0x44;

const TRANSPARENT_BK = 1;

const SELFSHOT = process.env.SELFSHOT === '1';

// ── The world: a 24x24 maze. 1=brick, 2=stone, 3=mossy, 4=blue tech-tile, 0=floor. ──
// Designed so the start pose looks straight down a long textured corridor.
const MAP_DIM = 24;
const MAP: number[] = [
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 4, 4, 4, 4, 4, 4, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 2, 2, 2, 0, 1, 1, 2, 0, 1, 1, 1, 1, 0, 4, 0, 3, 3, 3, 3, 3, 0, 1, 1, 0, 2, 0, 0, 0, 0,
  0, 0, 0, 1, 0, 0, 1, 0, 4, 0, 3, 0, 0, 0, 3, 0, 1, 1, 0, 2, 0, 1, 1, 1, 1, 1, 0, 1, 0, 0, 1, 0, 0, 0, 3, 0, 4, 0, 0, 0, 1, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 4, 4, 3, 0, 4, 4, 4, 0, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1,
  1, 4, 0, 0, 0, 0, 0, 4, 0, 1, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 2, 2, 2, 0, 4, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 2, 0, 2, 0, 0, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 2, 0, 0, 0,
  1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1, 0, 1, 0, 1, 1, 2, 2, 2, 2, 2, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 0,
  0, 0, 1, 0, 0, 0, 0, 0, 2, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 2, 0, 0, 0, 2, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 0, 0, 0, 1, 0, 0, 0, 2, 0, 3, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 2, 2, 0,
  2, 2, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0,
  0, 0, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1,
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
];

// A few procedural "lamp" sprites placed in open cells (x,y world coords at cell centers).
// Two sit down the hero corridor (row 11) so the self-shot frames glowing lamps receding.
const SPRITES: Array<{ x: number; y: number }> = [
  { x: 9.5, y: 11.5 },
  { x: 13.5, y: 11.5 },
  { x: 3.5, y: 9.5 },
  { x: 17.5, y: 17.5 },
];
const MAX_SPRITES = 8;

function cellAt(mx: number, my: number): number {
  if (mx < 0 || my < 0 || mx >= MAP_DIM || my >= MAP_DIM) return 1;
  return MAP[my * MAP_DIM + mx] ?? 1;
}

// ── Fullscreen-triangle vertex shader (verbatim engine pattern) ─────────────────
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

// ── Raycaster pixel shader ──────────────────────────────────────────────────────
// Per pixel: build the ray for this column (Lode camera), DDA-march the grid to the
// first solid cell, derive perpWallDist + wall slice height (near=tall, far=short),
// then draw the textured wall, the floor-cast floor, or the textured ceiling.
// Afterwards, billboard up to MAX_SPRITES depth-tested glowing lamps.
const PS_SOURCE = `
cbuffer Frame : register(b0) {
  float2 iResolution;
  float  iTime;
  int    iMapDim;
  float2 iPos;        // player position (world cells)
  float2 iDir;        // camera direction
  float2 iPlane;      // camera plane (FOV half-width)
  int    iSpriteCount;
  float  pad0;
  float4 iSprites[8]; // .xy = world pos, .z = hue
};

StructuredBuffer<uint> Map : register(t0);

uint mapCell(int mx, int my) {
  if (mx < 0 || my < 0 || mx >= iMapDim || my >= iMapDim) return 1u;
  return Map[my * iMapDim + mx];
}

float hash21(float2 p) {
  p = frac(p * float2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return frac(p.x * p.y);
}

// Procedural wall texture: brick(1) / stone(2) / mossy(3) / blue tech-tile(4).
// texU is along the wall [0,1], texV is vertical [0,1]. Returns a base albedo.
float3 wallTexture(uint cell, float texU, float texV) {
  if (cell == 2u) {
    // CUT STONE: large irregular ashlar blocks with deep mortar joints + speckle.
    float2 g = float2(texU, texV) * float2(3.0, 5.0);
    float2 id = floor(g);
    float2 f = frac(g);
    float joint = smoothstep(0.0, 0.10, f.x) * smoothstep(0.0, 0.10, 1.0 - f.x)
                * smoothstep(0.0, 0.10, f.y) * smoothstep(0.0, 0.10, 1.0 - f.y);
    float n = hash21(id * 7.1 + 0.5);
    float3 stone = lerp(float3(0.42, 0.42, 0.46), float3(0.64, 0.64, 0.68), n);
    stone += (hash21(g * 13.0) - 0.5) * 0.07;                 // speckle
    float bevel = 0.55 + 0.45 * smoothstep(0.0, 0.22, min(f.x, f.y)); // top/left highlight
    return lerp(float3(0.12, 0.12, 0.15), stone * bevel, joint);
  } else if (cell == 3u) {
    // MOSSY brick: dark red brick base with green moss climbing from the bottom.
    float row = floor(texV * 7.0);
    float off = (fmod(row, 2.0) < 1.0) ? 0.0 : 0.5;
    float2 g = float2(frac(texU * 4.0 + off), frac(texV * 7.0));
    float mortar = smoothstep(0.0, 0.09, g.x) * smoothstep(0.0, 0.09, 1.0 - g.x)
                 * smoothstep(0.0, 0.09, g.y) * smoothstep(0.0, 0.09, 1.0 - g.y);
    float3 brick = lerp(float3(0.36, 0.14, 0.11), float3(0.50, 0.22, 0.16),
                        hash21(floor(float2(texU * 4.0 + off, row))));
    float3 base = lerp(float3(0.10, 0.10, 0.10), brick, mortar);
    // Moss climbs from the bottom, thickest low, thinning with height.
    float mossField = saturate(hash21(float2(texU * 7.0, texV * 4.0)) * 1.6 - 0.35);
    float climb = saturate(1.2 - texV * 1.0);
    float moss = mossField * climb;
    return lerp(base, float3(0.18, 0.40, 0.14), moss);
  } else if (cell == 4u) {
    // BLUE TECH-TILE: glossy panel grid with glowing seams + rivets.
    float2 g = float2(texU, texV) * float2(4.0, 5.0);
    float2 f = frac(g);
    float seam = 1.0 - smoothstep(0.02, 0.07, min(min(f.x, 1.0 - f.x), min(f.y, 1.0 - f.y)));
    float3 panel = float3(0.10, 0.20, 0.34) + hash21(floor(g)) * float3(0.04, 0.06, 0.10);
    float3 glow = float3(0.20, 0.65, 1.0);
    float2 d = f - 0.5;
    float rivet = smoothstep(0.085, 0.05, length(d)) * 0.5;   // center rivet
    return panel + glow * seam * 0.9 + glow * rivet;
  }
  // BRICK (default, cell==1): running-bond red brick with mortar lines + grime.
  float row = floor(texV * 8.0);
  float off = (fmod(row, 2.0) < 1.0) ? 0.0 : 0.5;
  float2 g = float2(frac(texU * 4.0 + off), frac(texV * 8.0));
  float mortar = smoothstep(0.0, 0.08, g.x) * smoothstep(0.0, 0.08, 1.0 - g.x)
               * smoothstep(0.0, 0.08, g.y) * smoothstep(0.0, 0.08, 1.0 - g.y);
  float tone = hash21(floor(float2(texU * 4.0 + off, row)));
  float3 brick = lerp(float3(0.52, 0.22, 0.16), float3(0.72, 0.34, 0.24), tone);
  brick += (hash21(g * 21.0) - 0.5) * 0.06;                   // grain
  float bevel = 0.7 + 0.3 * smoothstep(0.0, 0.25, min(g.x, g.y));
  return lerp(float3(0.16, 0.13, 0.12), brick * bevel, mortar);
}

// Floor / ceiling tile albedo at world position p, with a faint grout grid.
float3 floorTile(float2 p) {
  float2 f = frac(p);
  float grout = smoothstep(0.0, 0.05, f.x) * smoothstep(0.0, 0.05, 1.0 - f.x)
              * smoothstep(0.0, 0.05, f.y) * smoothstep(0.0, 0.05, 1.0 - f.y);
  float check = (fmod(floor(p.x) + floor(p.y), 2.0) < 1.0) ? 1.0 : 0.78;
  float grain = 0.88 + 0.12 * hash21(p * 4.0);
  float3 tile = float3(0.34, 0.30, 0.26) * check * grain;
  return lerp(float3(0.10, 0.09, 0.08), tile, grout);
}

float4 main(float4 fragPos : SV_Position, float2 uv : TEXCOORD0) : SV_Target {
  float2 res = max(iResolution, float2(1.0, 1.0));
  float w = res.x;
  float h = res.y;

  float sx = fragPos.x;
  float sy = fragPos.y;

  // Ray for this column (Lode camera): cameraX in [-1,1] across the screen.
  float cameraX = 2.0 * sx / w - 1.0;
  float2 rayDir = iDir + iPlane * cameraX;

  // ── DDA setup ──
  int2 mapPos = int2(int(floor(iPos.x)), int(floor(iPos.y)));
  float2 deltaDist = float2(
    (abs(rayDir.x) < 1e-5) ? 1e30 : abs(1.0 / rayDir.x),
    (abs(rayDir.y) < 1e-5) ? 1e30 : abs(1.0 / rayDir.y));
  int2 stepDir;
  float2 sideDist;
  if (rayDir.x < 0.0) { stepDir.x = -1; sideDist.x = (iPos.x - float(mapPos.x)) * deltaDist.x; }
  else                { stepDir.x =  1; sideDist.x = (float(mapPos.x) + 1.0 - iPos.x) * deltaDist.x; }
  if (rayDir.y < 0.0) { stepDir.y = -1; sideDist.y = (iPos.y - float(mapPos.y)) * deltaDist.y; }
  else                { stepDir.y =  1; sideDist.y = (float(mapPos.y) + 1.0 - iPos.y) * deltaDist.y; }

  // March until a solid cell.
  int side = 0;
  uint hitCell = 1u;
  bool hit = false;
  [loop]
  for (int i = 0; i < 96; i++) {
    if (sideDist.x < sideDist.y) { sideDist.x += deltaDist.x; mapPos.x += stepDir.x; side = 0; }
    else                         { sideDist.y += deltaDist.y; mapPos.y += stepDir.y; side = 1; }
    uint c = mapCell(mapPos.x, mapPos.y);
    if (c > 0u) { hitCell = c; hit = true; break; }
  }

  // Perpendicular wall distance (kills the fisheye), then projected slice height.
  float perpWallDist;
  if (side == 0) perpWallDist = (float(mapPos.x) - iPos.x + (1.0 - float(stepDir.x)) * 0.5) / rayDir.x;
  else           perpWallDist = (float(mapPos.y) - iPos.y + (1.0 - float(stepDir.y)) * 0.5) / rayDir.y;
  perpWallDist = max(perpWallDist, 0.0001);

  float lineHeight = h / perpWallDist;            // near walls tall, far walls short
  float drawStart = -lineHeight * 0.5 + h * 0.5;
  float drawEnd   =  lineHeight * 0.5 + h * 0.5;

  float3 col;

  if (sy >= drawStart && sy <= drawEnd && hit) {
    // ── WALL ──
    float wallX;
    if (side == 0) wallX = iPos.y + perpWallDist * rayDir.y;
    else           wallX = iPos.x + perpWallDist * rayDir.x;
    wallX -= floor(wallX);
    float texV = saturate((sy - drawStart) / max(lineHeight, 1.0));
    float3 tex = wallTexture(hitCell, wallX, texV);

    // Classic side shading: E/W walls (side==1) darker than N/S (side==0).
    if (side == 1) tex *= 0.62;
    // Distance falloff so depth reads but the texture stays vivid up close.
    float fade = saturate(1.0 - perpWallDist * 0.035);
    col = tex * (0.40 + 0.60 * fade);
  } else if (sy > drawEnd) {
    // ── FLOOR (per-pixel floor casting) ──
    float2 floorWall;
    if (side == 0) floorWall = float2(float(mapPos.x) + (stepDir.x < 0 ? 1.0 : 0.0), iPos.y + perpWallDist * rayDir.y);
    else           floorWall = float2(iPos.x + perpWallDist * rayDir.x, float(mapPos.y) + (stepDir.y < 0 ? 1.0 : 0.0));

    float rowDist = (0.5 * h) / (sy - 0.5 * h);   // distance of this floor row
    float2 floorPos = lerp(iPos, floorWall, rowDist / max(perpWallDist, 0.0001));
    float3 tile = floorTile(floorPos);
    float fog = saturate(1.0 / (1.0 + rowDist * rowDist * 0.015));
    col = tile * (0.18 + 0.82 * fog);
  } else {
    // ── CEILING (mirror floor cast, dimmer + cooler vault) ──
    float2 floorWall;
    if (side == 0) floorWall = float2(float(mapPos.x) + (stepDir.x < 0 ? 1.0 : 0.0), iPos.y + perpWallDist * rayDir.y);
    else           floorWall = float2(iPos.x + perpWallDist * rayDir.x, float(mapPos.y) + (stepDir.y < 0 ? 1.0 : 0.0));

    float rowDist = (0.5 * h) / (0.5 * h - sy);
    float2 ceilPos = lerp(iPos, floorWall, rowDist / max(perpWallDist, 0.0001));
    float3 tile = floorTile(ceilPos * 0.5);
    float3 vault = float3(0.10, 0.11, 0.16);
    float fog = saturate(1.0 / (1.0 + rowDist * rowDist * 0.02));
    col = lerp(vault, tile * float3(0.5, 0.55, 0.7), fog) * (0.30 + 0.55 * fog);
  }

  // ── SPRITES (billboarded, depth-tested glowing lamps) ──
  float invDet = 1.0 / (iPlane.x * iDir.y - iDir.x * iPlane.y);
  [loop]
  for (int s = 0; s < iSpriteCount; s++) {
    float2 sp = iSprites[s].xy - iPos;
    float transformX = invDet * (iDir.y * sp.x - iDir.x * sp.y);
    float transformY = invDet * (-iPlane.y * sp.x + iPlane.x * sp.y); // depth along view
    if (transformY <= 0.10) continue;

    float spriteScreenX = (w * 0.5) * (1.0 + transformX / transformY);
    float spriteH = abs(h / transformY) * 0.65;
    float spriteW = spriteH;
    float startX = spriteScreenX - spriteW * 0.5;
    float startY = -spriteH * 0.5 + h * 0.5 + (h / transformY) * 0.14;

    if (sx >= startX && sx <= startX + spriteW && sy >= startY && sy <= startY + spriteH && transformY < perpWallDist) {
      float2 lp = float2((sx - startX) / spriteW, (sy - startY) / spriteH);
      float2 d = lp - float2(0.5, 0.5);
      float r = length(d * float2(1.0, 1.25));
      if (r < 0.5) {
        float hue = iSprites[s].z;
        float3 glow = lerp(float3(1.0, 0.74, 0.30), float3(0.40, 0.80, 1.0), hue);
        float core = smoothstep(0.34, 0.0, r);   // tight bright bulb
        float halo = smoothstep(0.5, 0.18, r);    // soft falloff
        float pulse = 0.85 + 0.15 * sin(iTime * 4.0 + float(s));
        float depthFog = saturate(1.0 / (1.0 + transformY * transformY * 0.010));
        col = lerp(col, glow, halo * 0.55);        // don't fully wash the wall behind
        col += glow * core * pulse * depthFog * 0.55;
      }
    }
  }

  // Contrast lift + gamma for a punchy 1992 look.
  col = saturate(col);
  col = pow(col, 1.0 / 2.0);
  return float4(col, 1.0);
}
`;

function comReleaseSafe(ptr: bigint | undefined): void {
  if (ptr !== undefined && ptr !== 0n) gpu.comRelease(ptr);
}

function main(): void {
  // Fill the primary monitor (borderless) so the capture is dominated by the demo.
  const sW = User32.GetSystemMetrics(0) || 1920; // SM_CXSCREEN
  const sH = User32.GetSystemMetrics(1) || 1080; // SM_CYSCREEN
  // Modest 16:9 window by default; RAYCASTER_W/H override for an exact size.
  const winH = process.env.RAYCASTER_H ? Number(process.env.RAYCASTER_H) : Math.min(1000, Math.floor(sH * 0.72));
  const winW = process.env.RAYCASTER_W ? Number(process.env.RAYCASTER_W) : Math.min(Math.floor(sW * 0.9), Math.round((winH * 16) / 9));

  const win = gpu.createWindow({ title: 'Raycaster — Wolf3D-style maze in a pixel shader', width: winW, height: winH, borderless: true });
  const { w: cw, h: ch } = win.clientSize();
  const g = gpu.createDevice(win.hwnd, { width: cw, height: ch });

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
    comReleaseSafe(g.backBufferRTV);
    comReleaseSafe(g.swapChain);
    comReleaseSafe(g.context);
    comReleaseSafe(g.device);
    win.destroy();
    process.exit(1);
  }

  // Map as a StructuredBuffer<uint> SRV (one cell per uint), uploaded once.
  const mapBytes = Buffer.alloc(4 * MAP_DIM * MAP_DIM);
  for (let i = 0; i < MAP_DIM * MAP_DIM; i++) mapBytes.writeUInt32LE(MAP[i] ?? 0, i * 4);
  const mapSb = gpu.makeStructuredBuffer({ stride: 4, count: MAP_DIM * MAP_DIM, srv: true, initialData: mapBytes });

  // Constant buffer layout (16-byte aligned):
  //   0:  iResolution.x, 4: iResolution.y, 8: iTime, 12: iMapDim(int)
  //  16:  iPos.x, 20: iPos.y, 24: iDir.x, 28: iDir.y
  //  32:  iPlane.x, 36: iPlane.y, 40: iSpriteCount(int), 44: pad0
  //  48 + s*16: sprite[s].xyzw
  const CB_SIZE = 48 + MAX_SPRITES * 16;
  const cb = gpu.makeConstantBuffer(CB_SIZE);
  const cbData = Buffer.alloc(CB_SIZE);

  const hudFont = GDI32.CreateFontW(-16, 0, 0, 0, 600, 0, 0, 0, 0, 0, 0, 4, 0, Buffer.from('Consolas\0', 'utf16le').ptr!);

  // ── Player state (Lode camera) ───────────────────────────────────────────────
  // Start at the west end of the long row-11 corridor (10 open cells), facing east
  // so the textured walls recede toward a far brick end-cap — the hero corridor.
  let px = 5.5;
  let py = 11.5;
  let angle = 0; // facing +x (east on the map) — straight down the corridor

  // The camera plane sets the HORIZONTAL FOV. Scale by aspect so a wide window
  // widens the view instead of squashing it (vertical FOV stays constant), but
  // CLAMP it on ultrawide / spanned desktops so the corridor doesn't fisheye.
  const aspect = cw / Math.max(1, ch);
  const FOV = Math.min(1.15, 0.66 * aspect); // ~110° max horizontal half-plane

  let dragging = false;
  let lastMx = 0;

  console.log('Raycaster — DDA-raycast textured maze, entirely in a fullscreen pixel shader.');
  console.log(`  ${g.driver} · ${g.gpuName} · ${cw}x${ch}`);
  console.log('  W/S walk · A/D strafe · arrows / drag to turn · ESC to exit.');

  const startTime = performance.now();
  const durationMs = process.env.DEMO_DURATION_MS ? Number(process.env.DEMO_DURATION_MS) : 0;
  let frames = 0;
  let fps = 0;
  let fpsWindowStart = startTime;
  let lastNow = startTime;

  // Minimap geometry (top-left HUD).
  const MM_CELL = Math.max(5, Math.floor(Math.min(cw, ch) / 80));
  const MM_X = 20;
  const MM_Y = 54;
  const brickBrush = GDI32.CreateSolidBrush(0x002844b0); // BGR red-brown
  const stoneBrush = GDI32.CreateSolidBrush(0x00686868);
  const mossBrush = GDI32.CreateSolidBrush(0x00205028);
  const blueBrush = GDI32.CreateSolidBrush(0x00b07020); // BGR blue
  const floorBrush = GDI32.CreateSolidBrush(0x00120e0a);
  const playerBrush = GDI32.CreateSolidBrush(0x002020e0); // BGR red dot
  const conePen = GDI32.CreatePen(0 /* PS_SOLID */, 1, 0x0020d0f0); // yellow
  const dirPen = GDI32.CreatePen(0, 2, 0x004040ff);

  function drawMinimap(): void {
    hud.draw(g, cw, ch, (dc) => {
      for (let my = 0; my < MAP_DIM; my++) {
        for (let mx = 0; mx < MAP_DIM; mx++) {
          const c = MAP[my * MAP_DIM + mx] ?? 0;
          const brush = c === 1 ? brickBrush : c === 2 ? stoneBrush : c === 3 ? mossBrush : c === 4 ? blueBrush : floorBrush;
          GDI32.SelectObject(dc, brush);
          const x0 = MM_X + mx * MM_CELL;
          const y0 = MM_Y + my * MM_CELL;
          GDI32.Rectangle(dc, x0, y0, x0 + MM_CELL + 1, y0 + MM_CELL + 1);
        }
      }
      const px0 = MM_X + px * MM_CELL;
      const py0 = MM_Y + py * MM_CELL;
      const dirX = Math.cos(angle);
      const dirY = Math.sin(angle);
      const planeX = -dirY * FOV;
      const planeY = dirX * FOV;
      const rayLen = 6 * MM_CELL;
      GDI32.SelectObject(dc, conePen);
      for (const camX of [-1, 1]) {
        const rx = dirX + planeX * camX;
        const ry = dirY + planeY * camX;
        const len = Math.hypot(rx, ry) || 1;
        GDI32.MoveToEx(dc, Math.round(px0), Math.round(py0), null);
        GDI32.LineTo(dc, Math.round(px0 + (rx / len) * rayLen), Math.round(py0 + (ry / len) * rayLen));
      }
      GDI32.SelectObject(dc, dirPen);
      GDI32.MoveToEx(dc, Math.round(px0), Math.round(py0), null);
      GDI32.LineTo(dc, Math.round(px0 + dirX * MM_CELL * 2.2), Math.round(py0 + dirY * MM_CELL * 2.2));
      GDI32.SelectObject(dc, playerBrush);
      GDI32.Ellipse(dc, Math.round(px0 - 3), Math.round(py0 - 3), Math.round(px0 + 3), Math.round(py0 + 3));

      GDI32.SelectObject(dc, hudFont);
      GDI32.SetBkMode(dc, TRANSPARENT_BK);
      const line = `Raycaster · pure TypeScript · ${fps} fps · ${g.driver}`;
      const text = Buffer.from(`${line}\0`, 'utf16le');
      GDI32.SetTextColor(dc, 0x00000000);
      GDI32.TextOutW(dc, 21, 21, text.ptr!, line.length);
      GDI32.SetTextColor(dc, 0x0020d0f0);
      GDI32.TextOutW(dc, 20, 20, text.ptr!, line.length);
    });
  }

  while (!win.shouldClose()) {
    win.pump();
    if (win.shouldClose()) break;

    const now = performance.now();
    const dt = Math.min(0.05, (now - lastNow) / 1000);
    lastNow = now;
    const elapsed = (now - startTime) / 1000;

    // ── Input → movement (with grid collision) ───────────────────────────────
    const moveSpeed = 3.2 * dt;
    const turnSpeed = 2.4 * dt;

    if (SELFSHOT) {
      // Deterministic gentle walk east down the row-11 corridor so the self-shot
      // frames a textured 3D hallway with receding walls + the lamps ahead.
      py = 11.5;
      px = 5.5 + Math.min(3.0, elapsed * 1.2);
      angle = 0.1 * Math.sin(elapsed * 0.8); // small sway, mostly facing +x (east)
    } else {
      const m = win.getMouse();
      if (m.down) {
        if (!dragging) {
          dragging = true;
          lastMx = m.x;
        }
        angle += (m.x - lastMx) * 0.005;
        lastMx = m.x;
      } else dragging = false;

      if (win.keyDown(VK_LEFT)) angle -= turnSpeed;
      if (win.keyDown(VK_RIGHT)) angle += turnSpeed;

      const dirX = Math.cos(angle);
      const dirY = Math.sin(angle);
      let mvX = 0;
      let mvY = 0;
      if (win.keyDown(VK_W) || win.keyDown(VK_UP)) {
        mvX += dirX;
        mvY += dirY;
      }
      if (win.keyDown(VK_S) || win.keyDown(VK_DOWN)) {
        mvX -= dirX;
        mvY -= dirY;
      }
      if (win.keyDown(VK_A)) {
        mvX += dirY;
        mvY -= dirX;
      } // strafe left
      if (win.keyDown(VK_D)) {
        mvX -= dirY;
        mvY += dirX;
      } // strafe right
      const len = Math.hypot(mvX, mvY);
      if (len > 1e-4) {
        const nx = px + (mvX / len) * moveSpeed;
        const ny = py + (mvY / len) * moveSpeed;
        if (cellAt(Math.floor(nx), Math.floor(py)) === 0) px = nx;
        if (cellAt(Math.floor(px), Math.floor(ny)) === 0) py = ny;
      }
    }

    px = Math.max(1.2, Math.min(MAP_DIM - 1.2, px));
    py = Math.max(1.2, Math.min(MAP_DIM - 1.2, py));

    const dirX = Math.cos(angle);
    const dirY = Math.sin(angle);
    const planeX = -dirY * FOV;
    const planeY = dirX * FOV;

    // ── Pack the constant buffer immediately before the consuming draw ────────
    cbData.writeFloatLE(cw, 0);
    cbData.writeFloatLE(ch, 4);
    cbData.writeFloatLE(elapsed, 8);
    cbData.writeInt32LE(MAP_DIM, 12);
    cbData.writeFloatLE(px, 16);
    cbData.writeFloatLE(py, 20);
    cbData.writeFloatLE(dirX, 24);
    cbData.writeFloatLE(dirY, 28);
    cbData.writeFloatLE(planeX, 32);
    cbData.writeFloatLE(planeY, 36);
    const spriteCount = Math.min(SPRITES.length, MAX_SPRITES);
    cbData.writeInt32LE(spriteCount, 40);
    cbData.writeFloatLE(0, 44);
    for (let s = 0; s < MAX_SPRITES; s++) {
      const base = 48 + s * 16;
      const sp = SPRITES[s];
      cbData.writeFloatLE(sp ? sp.x : 0, base);
      cbData.writeFloatLE(sp ? sp.y : 0, base + 4);
      cbData.writeFloatLE(s % 2 === 0 ? 0.0 : 1.0, base + 8); // hue
      cbData.writeFloatLE(0, base + 12);
    }
    gpu.updateConstantBuffer(cb, cbData);

    // ── Single fullscreen pass into the back buffer ───────────────────────────
    gpu.setRenderTargets([g.backBufferRTV]);
    gpu.setViewport(cw, ch);
    gpu.clear(g.backBufferRTV, [0, 0, 0, 1]);
    gpu.vsSet(vs);
    gpu.psSet(ps, { cb: [cb], srv: [mapSb.srv!] });
    gpu.drawFullscreenTriangle();

    // ── HUD composited INTO the back buffer (before present, so it never flickers
    // and shows up in the self-shot capture below) ────────────────────────────
    drawMinimap();

    // ── Self-shot: read our OWN back buffer BEFORE present (DISCARD-safe) ──────
    const lastFrame = durationMs > 0 && now - startTime >= durationMs;
    if (SELFSHOT && lastFrame) {
      const out = process.env.SELFSHOT_PATH || `${import.meta.dir}/raycaster.selfcheck.png`;
      const stats = captureBackBuffer(g, out, { gridW: 56, gridH: 22 });
      console.log(formatGrid(stats));
      console.log(`[selfshot] ok=${stats.ok} nonBlackPct=${(stats.nonBlackFrac * 100).toFixed(1)} meanLuma=${stats.meanLuma.toFixed(3)} -> ${stats.path}`);
    }

    g.present(false);

    frames += 1;
    if (now - fpsWindowStart >= 500) {
      fps = Math.round((frames * 1000) / (now - fpsWindowStart));
      frames = 0;
      fpsWindowStart = now;
    }

    if (lastFrame) break;
  }

  // ── Teardown ──────────────────────────────────────────────────────────────────
  hud.release();
  GDI32.DeleteObject(hudFont);
  GDI32.DeleteObject(brickBrush);
  GDI32.DeleteObject(stoneBrush);
  GDI32.DeleteObject(mossBrush);
  GDI32.DeleteObject(blueBrush);
  GDI32.DeleteObject(floorBrush);
  GDI32.DeleteObject(playerBrush);
  GDI32.DeleteObject(conePen);
  GDI32.DeleteObject(dirPen);
  comReleaseSafe(mapSb.srv);
  comReleaseSafe(mapSb.buffer);
  comReleaseSafe(cb);
  comReleaseSafe(ps);
  comReleaseSafe(vs);
  gpu.blobRelease(psCode.blob);
  gpu.blobRelease(vsCode.blob);
  comReleaseSafe(g.backBufferRTV);
  comReleaseSafe(g.swapChain);
  comReleaseSafe(g.context);
  comReleaseSafe(g.device);
  win.destroy();
  process.exit(0);
}

main();
