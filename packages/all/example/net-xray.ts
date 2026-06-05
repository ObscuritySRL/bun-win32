/**
 * Net X-Ray — a live force-directed constellation of every TCP/UDP socket on this
 * box, wired to the process that owns it, drawn on the real GPU in pure TypeScript.
 *
 * Every ~350ms the Windows IP Helper API is polled synchronously (no DNS, no async):
 * GetExtendedTcpTable(MIB_TCPTABLE_OWNER_PID) and GetExtendedUdpTable(OWNER_PID) via
 * the two-call sizing dance, hand-parsed at the FIXED 24-byte / 12-byte row strides.
 * Each connection's owning PID is resolved to a process name once (OpenProcess +
 * QueryFullProcessImageNameW, cached) — System/protected PIDs degrade to "PID n".
 *
 * The connections become a graph: local processes are bright HUB nodes, distinct
 * remote IPv4 endpoints are cooler satellite nodes, and every ESTABLISHED/active TCP
 * row is an EDGE. A classic O(N^2) force-directed layout (repulsion + spring +
 * center gravity) runs in plain TS each poll; node positions lerp smoothly toward
 * their targets every frame. Diffing the socket set per poll drives the wow moment:
 * brand-new edges IGNITE white-hot and fade to their base color over ~0.8s, closed
 * connections fade out over ~0.6s — open a browser tab and watch a dozen sockets to
 * a CDN flare into the constellation.
 *
 * Rendering reuses the particle-galaxy GPU toolkit: every node and every ~22
 * interpolated sample-point along an edge is expanded in the vertex shader into a
 * screen-facing glow quad (6 verts/item, fetched by SV_VertexID) — node glow sized
 * by degree, edges into thin igniting filaments — all accumulated additively into an
 * HDR R16G16B16A16_FLOAT target, then a fullscreen bloom/tonemap pass composites to
 * the swap-chain back buffer. A GDI HUD lists the top talkers (process · connection
 * count). Nothing is faked: the nodes are your real sockets, the labels your real
 * processes.
 *
 * @bun-win32 APIs used:
 *   Iphlpapi.GetExtendedTcpTable / GetExtendedUdpTable  (two-call sizing, fixed-stride parse)
 *   Kernel32.OpenProcess / QueryFullProcessImageNameW / CloseHandle / GetCurrentProcessId
 *   ./_gpu: createWindow / createDevice / compile / makeVertexShader / makePixelShader /
 *           makeStructuredBuffer (cpuWritable SRV) / updateDynamicBuffer /
 *           makeConstantBuffer / updateConstantBuffer / makeTexture (HDR + staging) /
 *           makeSampler / makeAdditiveBlendState / setBlendState / vsSet / psSet /
 *           vsSetShaderResources / drawFullscreenTriangle / setRenderTargets /
 *           setViewport / clear / copyResource / vcall (sprite-quad Draw) / comRelease
 *   GDI32 CreateFontW / TextOutW  (HUD)
 *
 * Run: bun run packages/all/example/net-xray.ts
 */

import { FFIType, read, type Pointer } from 'bun:ffi';

import { GDI32, Iphlpapi, Kernel32, User32 } from '../index';
import * as gpu from './_gpu';
import * as hud from './_hud';

const encodeWide = (str: string): Buffer => Buffer.from(`${str}\0`, 'utf16le');

const WIDTH = 1280;
const HEIGHT = 720;

// ── Win32 / API constants ────────────────────────────────────────────────────
const AF_INET = 2;
const TCP_TABLE_OWNER_PID_ALL = 5;
const UDP_TABLE_OWNER_PID = 1;
const ERROR_INSUFFICIENT_BUFFER = 122;
const PROCESS_QUERY_LIMITED_INFORMATION = 0x1000;
const TCP_ROW_STRIDE = 24; // FIXED — do NOT derive from bufferSize
const UDP_ROW_STRIDE = 12;

// Render capacity (cpuWritable buffers are fixed-size at creation).
const MAX_NODES = 768;
const SAMPLES_PER_EDGE = 22; // points interpolated along each edge → glowing filament
const MAX_EDGES = 768;
const MAX_EDGE_POINTS = MAX_EDGES * SAMPLES_PER_EDGE;

const tcpStateNames = new Map<number, string>([
  [1, 'CLOSED'],
  [2, 'LISTEN'],
  [3, 'SYN_SENT'],
  [4, 'SYN_RCVD'],
  [5, 'ESTABLISHED'],
  [6, 'FIN_WAIT1'],
  [7, 'FIN_WAIT2'],
  [8, 'CLOSE_WAIT'],
  [9, 'CLOSING'],
  [10, 'LAST_ACK'],
  [11, 'TIME_WAIT'],
  [12, 'DELETE_TCB'],
]);

function ipFromU32(val: number): string {
  return `${val & 0xff}.${(val >>> 8) & 0xff}.${(val >>> 16) & 0xff}.${(val >>> 24) & 0xff}`;
}
function portFromNet(p: number): number {
  return (((p & 0xff) << 8) | ((p >>> 8) & 0xff)) & 0xffff;
}
// A remote IPv4 with no meaningful endpoint (skip as an edge target).
function isRealRemote(addr: number): boolean {
  if (addr === 0) return false; // 0.0.0.0 — unbound / listening
  const b0 = addr & 0xff;
  const b1 = (addr >>> 8) & 0xff;
  if (b0 === 127) return false; // loopback
  if (b0 === 169 && b1 === 254) return false; // link-local
  if (addr === 0xffffffff) return false; // broadcast
  return true;
}

// ── PID → process basename, resolved once and cached ───────────────────────────
const pidNameCache = new Map<number, string>();
function pidName(pid: number): string {
  const cached = pidNameCache.get(pid);
  if (cached !== undefined) return cached;
  let name = pid === 4 ? 'System' : pid === 0 ? 'Idle' : `PID ${pid}`;
  if (pid > 4) {
    const h = Kernel32.OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, 0, pid);
    if (h && h !== 0n) {
      try {
        const buf = Buffer.alloc(520);
        const sizeBuf = Buffer.alloc(4);
        sizeBuf.writeUInt32LE(260, 0);
        // QueryFullProcessImageNameW(h, 0, buf, &size): size is chars in/out.
        if (Kernel32.QueryFullProcessImageNameW(h, 0, buf.ptr!, sizeBuf.ptr!)) {
          const chars = sizeBuf.readUInt32LE(0);
          const path = buf
            .subarray(0, chars * 2)
            .toString('utf16le')
            .replace(/\0.*$/, '');
          const base = path.split('\\').pop() ?? path;
          if (base.length > 0) name = base;
        }
      } finally {
        Kernel32.CloseHandle(h);
      }
    }
  }
  pidNameCache.set(pid, name);
  return name;
}

// ── Graph model ────────────────────────────────────────────────────────────────
// Node kinds: 0 = local process hub, 1 = remote endpoint.
interface Node {
  id: string;
  kind: number; // 0 hub, 1 remote
  label: string;
  x: number;
  y: number; // current (lerped) position
  tx: number;
  ty: number; // force-layout target
  degree: number; // connection count → glow size
  bornAt: number;
  seen: boolean; // touched this poll
}
interface Edge {
  key: string;
  from: string; // node id (local hub)
  to: string; // node id (remote)
  state: number;
  bornAt: number; // ignite timer origin
  seen: boolean;
  dying: number; // 0 = alive; else performance.now() it started dying
}

const nodes = new Map<string, Node>();
const edges = new Map<string, Edge>();
const SEED = 0x9e3779b9;
function hashStr(s: string): number {
  let h = SEED >>> 0;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}
function ensureNode(id: string, kind: number, label: string, now: number): Node {
  let n = nodes.get(id);
  if (!n) {
    // Seed near a hash-stable angle so the same host/process spawns consistently,
    // then the force layout pulls it into place (hubs near center, remotes outer).
    const h = hashStr(id);
    const ang = (h / 0x1_0000_0000) * Math.PI * 2;
    const rad = kind === 0 ? 0.12 + (((h >>> 8) & 0xff) / 255) * 0.18 : 0.45 + (((h >>> 16) & 0xff) / 255) * 0.4;
    n = {
      id,
      kind,
      label,
      x: Math.cos(ang) * rad,
      y: Math.sin(ang) * rad,
      tx: Math.cos(ang) * rad,
      ty: Math.sin(ang) * rad,
      degree: 0,
      bornAt: now,
      seen: true,
    };
    nodes.set(id, n);
  } else {
    n.seen = true;
    if (label && n.kind === 0) n.label = label;
  }
  return n;
}

// ── Poll the OS tables synchronously (two-call sizing) ──────────────────────────
const sizeBuf = Buffer.alloc(4);
let lastTcpRows = 0;
let lastUdpRows = 0;
let lastEstablished = 0;
let lastRemoteSample = 0; // a non-zero remote addr we actually parsed (data-layer proof)
let lastRemotePortSample = 0;

function poll(now: number): void {
  for (const n of nodes.values()) n.seen = false;
  for (const e of edges.values()) e.seen = false;

  // ── TCP ──
  sizeBuf.writeUInt32LE(0, 0);
  let rc = Iphlpapi.GetExtendedTcpTable(null, sizeBuf.ptr!, 0, AF_INET, TCP_TABLE_OWNER_PID_ALL, 0);
  if (rc === ERROR_INSUFFICIENT_BUFFER) {
    const size = sizeBuf.readUInt32LE(0);
    if (size >= 4) {
      const table = Buffer.alloc(size);
      rc = Iphlpapi.GetExtendedTcpTable(table.ptr!, sizeBuf.ptr!, 0, AF_INET, TCP_TABLE_OWNER_PID_ALL, 0);
      if (rc === 0) {
        const num = table.readUInt32LE(0);
        lastTcpRows = num;
        let est = 0;
        for (let i = 0; i < num; i += 1) {
          const o = 4 + i * TCP_ROW_STRIDE; // FIXED stride
          if (o + TCP_ROW_STRIDE > size) break;
          const state = table.readUInt32LE(o);
          const remoteAddr = table.readUInt32LE(o + 12);
          const remotePort = portFromNet(table.readUInt32LE(o + 16));
          const pid = table.readUInt32LE(o + 20);
          if (state === 5) est += 1;
          if (state === 2) continue; // LISTEN — no remote endpoint, skip as edge
          if (!isRealRemote(remoteAddr)) continue;
          if (remoteAddr !== 0) {
            lastRemoteSample = remoteAddr;
            lastRemotePortSample = remotePort;
          }

          const hubId = `p${pid}`;
          const remId = `r${remoteAddr}`;
          const hub = ensureNode(hubId, 0, pidName(pid), now);
          const rem = ensureNode(remId, 1, ipFromU32(remoteAddr), now);

          const ek = `${hubId}>${remId}:${remotePort}`;
          let e = edges.get(ek);
          if (!e) {
            e = { key: ek, from: hubId, to: remId, state, bornAt: now, seen: true, dying: 0 };
            edges.set(ek, e);
          } else {
            e.seen = true;
            e.state = state;
            e.dying = 0;
          }
          hub.degree += 1;
          rem.degree += 1;
        }
        lastEstablished = est;
      }
    }
  }

  // ── UDP (listeners → halo on the owning hub; counted, no edge) ──
  sizeBuf.writeUInt32LE(0, 0);
  rc = Iphlpapi.GetExtendedUdpTable(null, sizeBuf.ptr!, 0, AF_INET, UDP_TABLE_OWNER_PID, 0);
  if (rc === ERROR_INSUFFICIENT_BUFFER) {
    const size = sizeBuf.readUInt32LE(0);
    if (size >= 4) {
      const table = Buffer.alloc(size);
      rc = Iphlpapi.GetExtendedUdpTable(table.ptr!, sizeBuf.ptr!, 0, AF_INET, UDP_TABLE_OWNER_PID, 0);
      if (rc === 0) {
        const num = table.readUInt32LE(0);
        lastUdpRows = num;
        for (let i = 0; i < num; i += 1) {
          const o = 4 + i * UDP_ROW_STRIDE; // FIXED stride
          if (o + UDP_ROW_STRIDE > size) break;
          const pid = table.readUInt32LE(o + 8);
          // Surface UDP-active processes as hubs so the constellation isn't TCP-only.
          const hub = ensureNode(`p${pid}`, 0, pidName(pid), now);
          hub.degree += 0.15; // small contribution → a listener halo, not a big hub
        }
      }
    }
  }

  // ── Reap edges/nodes that vanished from the tables ──
  for (const e of edges.values()) {
    if (!e.seen && e.dying === 0) e.dying = now; // begin fade-out
    if (e.dying !== 0 && now - e.dying > 600) edges.delete(e.key);
  }
  // A node lives while any edge references it OR it was seen this poll (or briefly after).
  const referenced = new Set<string>();
  for (const e of edges.values()) {
    referenced.add(e.from);
    referenced.add(e.to);
  }
  for (const n of nodes.values()) {
    if (!n.seen && !referenced.has(n.id) && now - n.bornAt > 1500) nodes.delete(n.id);
  }
}

// ── Force-directed layout step (plain TS, O(N^2); N is tens-to-low-hundreds) ────
function layoutStep(): void {
  const arr = [...nodes.values()];
  const n = arr.length;
  if (n === 0) return;
  // Repulsion (Coulomb-ish) between all node pairs.
  const REP = 0.0016;
  const SPRING = 0.9;
  const REST = 0.28; // desired edge length
  const GRAV = 0.012;
  for (let i = 0; i < n; i += 1) {
    const a = arr[i]!;
    let fx = 0;
    let fy = 0;
    for (let j = 0; j < n; j += 1) {
      if (j === i) continue;
      const b = arr[j]!;
      let dx = a.tx - b.tx;
      let dy = a.ty - b.ty;
      let d2 = dx * dx + dy * dy;
      if (d2 < 1e-5) {
        dx = (hashStr(a.id + b.id) / 0x1_0000_0000 - 0.5) * 0.01;
        dy = (hashStr(b.id + a.id) / 0x1_0000_0000 - 0.5) * 0.01;
        d2 = dx * dx + dy * dy + 1e-5;
      }
      const inv = REP / d2;
      fx += dx * inv;
      fy += dy * inv;
    }
    // Center gravity: hubs pulled hard to center, remotes mildly.
    const g = a.kind === 0 ? GRAV * 3.0 : GRAV;
    fx -= a.tx * g;
    fy -= a.ty * g;
    a.tx += fx;
    a.ty += fy;
  }
  // Spring attraction along edges (skip dying so closed links relax outward).
  for (const e of edges.values()) {
    if (e.dying !== 0) continue;
    const A = nodes.get(e.from);
    const B = nodes.get(e.to);
    if (!A || !B) continue;
    const dx = B.tx - A.tx;
    const dy = B.ty - A.ty;
    const d = Math.hypot(dx, dy) || 1e-4;
    const f = (d - REST) * SPRING * 0.5;
    const ux = dx / d;
    const uy = dy / d;
    A.tx += ux * f;
    A.ty += uy * f;
    B.tx -= ux * f;
    B.ty -= uy * f;
  }
  // Clamp to the visible disk.
  for (const a of arr) {
    const r = Math.hypot(a.tx, a.ty);
    if (r > 0.95) {
      a.tx = (a.tx / r) * 0.95;
      a.ty = (a.ty / r) * 0.95;
    }
  }
}

// ── Window + device ─────────────────────────────────────────────────────────────
// Fill the primary monitor (borderless) so the showcase capture is dominated by us.
const scrW = User32.GetSystemMetrics(0) || 1920; // SM_CXSCREEN
const scrH = User32.GetSystemMetrics(1) || 1080; // SM_CYSCREEN
const WIN_H = Math.min(1000, Math.floor(scrH * 0.72));
const WIN_W = Math.min(Math.floor(scrW * 0.9), Math.round((WIN_H * 16) / 9));
const win = gpu.createWindow({ title: 'Net X-Ray — live socket constellation on the GPU', width: WIN_W, height: WIN_H, borderless: true });
const { w: clientW, h: clientH } = win.clientSize();
const dev = gpu.createDevice(win.hwnd, { width: clientW, height: clientH });
const aspect = clientW / clientH;
// Stretch the round force-layout into a wide ellipse so an ultra-wide screen fills.
const xSpread = Math.min(2.4, Math.max(1.0, aspect * 0.62));

console.log('Net X-Ray — live force-directed TCP/UDP constellation, pure TypeScript.');
console.log(`  ${clientW}x${clientH} · ${dev.driver} · ${dev.gpuName}`);
console.log('  Hubs = your processes · satellites = remote endpoints · edges ignite on connect. ESC to exit.');

// ── HDR target + bloom resources ─────────────────────────────────────────────────
const hdr = gpu.makeTexture({ w: clientW, h: clientH, format: gpu.DXGI_FORMAT_R16G16B16A16_FLOAT, rtv: true, srv: true });
const sampler = gpu.makeSampler({ filter: gpu.D3D11_FILTER_MIN_MAG_MIP_LINEAR, address: gpu.D3D11_TEXTURE_ADDRESS_CLAMP });
const additiveBlend = gpu.makeAdditiveBlendState(true);

// ── Structured buffers (cpuWritable, uploaded each frame) ────────────────────────
// Node:  x,y, size, colorIdx(0 hub /1 remote) packed as float, plus born-glow → 16B.
const NODE_STRIDE = 16;
const nodeBuf = gpu.makeStructuredBuffer({ stride: NODE_STRIDE, count: MAX_NODES, srv: true, cpuWritable: true });
const nodeData = Buffer.alloc(NODE_STRIDE * MAX_NODES);
// EdgePoint: x,y, intensity, kind(0) → 16B.
const EDGEPT_STRIDE = 16;
const edgeBuf = gpu.makeStructuredBuffer({ stride: EDGEPT_STRIDE, count: MAX_EDGE_POINTS, srv: true, cpuWritable: true });
const edgeData = Buffer.alloc(EDGEPT_STRIDE * MAX_EDGE_POINTS);

// ── Constant buffers ──────────────────────────────────────────────────────────────
// Render CB (VS+PS for points): float4(aspect, time, pointKind /*0 node,1 edge*/, _).
const REND_CB_SIZE = 16;
const rendCb = gpu.makeConstantBuffer(REND_CB_SIZE);
const rendData = Buffer.alloc(REND_CB_SIZE);
// Post CB: float4(texelW, texelH, exposure, time).
const POST_CB_SIZE = 16;
const postCb = gpu.makeConstantBuffer(POST_CB_SIZE);
const postData = Buffer.alloc(POST_CB_SIZE);

// ── HLSL ──────────────────────────────────────────────────────────────────────
// Sprite VS: each item is EXPANDED into a screen-facing quad (6 verts/item) so a
// glowing disc shows up at any resolution (D3D11 points are only 1px → invisible on
// a 5K screen). vid/6 picks the item; vid%6 picks the quad corner. World xy is
// aspect-corrected to NDC; the quad radius is in NDC. PS draws a soft radial falloff.
const VS_SPRITES = `
cbuffer Rend : register(b0) { float4 gP; }; // x=aspect, y=time, z=itemKind(0 node/1 edge), w=xSpread
struct Pt { float x; float y; float a; float b; };
StructuredBuffer<Pt> Items : register(t0);
struct VSOut {
  float4 pos : SV_Position;
  float4 col : COLOR0;   // rgb premultiplied by intensity
  float2 quv : TEXCOORD0; // -1..1 across the quad → radial falloff in PS
};
float3 hubColor(float t) { return lerp(float3(1.20,0.82,0.28), float3(1.30,1.00,0.62), t); } // warm gold
float3 remColor(float t) { return lerp(float3(0.22,0.62,1.20), float3(0.55,0.92,1.30), t); }  // cool azure
// Clockwise winding in NDC → front-facing under the default CULL_BACK rasterizer.
float2 cornerOf(uint c) {
  if (c == 0u) return float2(-1,-1);
  if (c == 1u) return float2(-1, 1);
  if (c == 2u) return float2( 1,-1);
  if (c == 3u) return float2( 1,-1);
  if (c == 4u) return float2(-1, 1);
  return float2(1,1);
}
VSOut main(uint vid : SV_VertexID) {
  uint item = vid / 6u;
  uint corner = vid % 6u;
  Pt p = Items[item];
  float2 quv = cornerOf(corner);

  float3 col;
  float radius;   // NDC half-size of the sprite
  float bright;
  if (gP.z < 0.5) {
    // NODE: a = size(0..1 by degree), b = kind(int) + glow(frac).
    float kind = floor(p.b);
    float glow = frac(p.b);
    col = kind < 0.5 ? hubColor(glow) : remColor(glow);
    radius = (kind < 0.5 ? 0.022 : 0.014) + p.a * 0.030;   // hubs bigger; degree grows it
    bright = (0.55 + p.a * 1.1) * (1.0 + glow * 3.0);
  } else {
    // EDGE sample: a = intensity (ignite>1 → base), b unused.
    float inten = p.a;
    float3 hot  = float3(1.5, 1.35, 1.15);
    float3 base = float3(0.30, 0.72, 1.10);
    col = lerp(base, hot, saturate(inten - 1.0));
    radius = 0.0065 + saturate(inten - 1.0) * 0.004;        // filament thickness
    bright = (0.10 + inten * 0.30);
  }

  // Map the round [-1,1] layout into a wide ellipse so the ultra-wide screen fills
  // (xSpread stretches x), then aspect-correct so the GRAPH still isn't distorted.
  float2 center = float2(p.x * gP.w / gP.x, p.y) * 0.94;
  // Sprite quads: divide x by aspect so each glow disc stays round on screen.
  float2 offset = float2(quv.x * radius / gP.x, quv.y * radius);
  VSOut o;
  o.pos = float4(center + offset, 0.0, 1.0);
  o.col = float4(col * bright, 1.0);
  o.quv = quv;
  return o;
}
`;

const PS_SPRITES = `
struct VSOut { float4 pos : SV_Position; float4 col : COLOR0; float2 quv : TEXCOORD0; };
float4 main(VSOut i) : SV_Target {
  // Soft radial glow: bright core, smooth falloff to the quad edge. Additive blend.
  float d = length(i.quv);
  float core = exp(-d * d * 5.0);
  float halo = exp(-d * d * 1.6) * 0.35;
  float a = saturate(core + halo);
  return float4(i.col.rgb * a, a);
}
`;

// Fullscreen-triangle VS (reuse verbatim).
const VS_FULLSCREEN = `
struct VSOut { float4 pos : SV_Position; float2 uv : TEXCOORD0; };
VSOut main(uint vid : SV_VertexID) {
  VSOut o; float2 p = float2((vid << 1) & 2, vid & 2);
  o.uv = p; o.pos = float4(p * float2(2.0,-2.0) + float2(-1.0,1.0), 0.0, 1.0); return o; }
`;

// Bloom + tonemap (galaxy pattern): wide gather → threshold → Reinhard + gamma.
const PS_POST = `
cbuffer Post : register(b0) { float4 gP; }; // x=texelW, y=texelH, z=exposure, w=time
Texture2D Hdr : register(t0);
SamplerState Smp : register(s0);
float3 sampleHdr(float2 uv) { return Hdr.SampleLevel(Smp, uv, 0).rgb; }
float3 bloom(float2 uv) {
  float2 tx = gP.xy;
  float3 b = 0.0.xxx; float wsum = 0.0;
  const int N = 6;
  [unroll] for (int k = -N; k <= N; k++) {
    float fw = exp(-float(k*k) / 18.0);
    b += sampleHdr(uv + float2(tx.x * float(k) * 2.5, 0.0)) * fw;
    b += sampleHdr(uv + float2(0.0, tx.y * float(k) * 2.5)) * fw;
    wsum += fw * 2.0;
  }
  b /= wsum;
  b += sampleHdr(uv + tx * 3.0) * 0.5;
  b += sampleHdr(uv - tx * 3.0) * 0.5;
  return b * 0.5;
}
float4 main(float4 fp : SV_Position, float2 uv : TEXCOORD0) : SV_Target {
  float3 hdr = sampleHdr(uv);
  float3 bl = bloom(uv);
  float3 brightOnly = max(bl - 0.30.xxx, 0.0.xxx);
  float3 col = hdr + brightOnly * 1.35;
  col *= gP.z;
  float2 q = uv - 0.5;
  float vig = smoothstep(0.95, 0.20, dot(q,q) * 1.7);
  col *= lerp(0.45, 1.0, vig);
  col = col / (col + 1.0.xxx);
  col = pow(col, (1.0/2.2).xxx);
  return float4(col, 1.0);
}
`;

const vsSpritesCode = gpu.compile(VS_SPRITES, 'main', 'vs_5_0');
const psSpritesCode = gpu.compile(PS_SPRITES, 'main', 'ps_5_0');
const vsFsCode = gpu.compile(VS_FULLSCREEN, 'main', 'vs_5_0');
const psPostCode = gpu.compile(PS_POST, 'main', 'ps_5_0');

const vsSprites = gpu.makeVertexShader(vsSpritesCode);
const psSprites = gpu.makePixelShader(psSpritesCode);
const vsFs = gpu.makeVertexShader(vsFsCode);
const psPost = gpu.makePixelShader(psPostCode);

// Draw `items` sprites as a TRIANGLELIST (6 verts each), VS pulls from the SRV.
const CTX_IA_SET_PRIMITIVE_TOPOLOGY = 24;
const CTX_DRAW = 13;
const D3D11_PRIMITIVE_TOPOLOGY_TRIANGLELIST = 4;
function drawSprites(items: number): void {
  gpu.vcall(dev.context, CTX_IA_SET_PRIMITIVE_TOPOLOGY, [FFIType.u32], [D3D11_PRIMITIVE_TOPOLOGY_TRIANGLELIST], FFIType.void);
  gpu.vcall(dev.context, CTX_DRAW, [FFIType.u32, FFIType.u32], [items * 6, 0], FFIType.void);
}

// ── GDI HUD ─────────────────────────────────────────────────────────────────────
const hudFont = GDI32.CreateFontW(-20, 0, 0, 0, 600, 0, 0, 0, 0, 0, 0, 4, 0, encodeWide('Consolas').ptr!);
const smallFont = GDI32.CreateFontW(-15, 0, 0, 0, 400, 0, 0, 0, 0, 0, 0, 4, 0, encodeWide('Consolas').ptr!);

function drawHud(fps: number): void {
  hud.draw(dev, clientW, clientH, (dc) => {
    GDI32.SetBkMode(dc, 1 /* TRANSPARENT */);

    GDI32.SelectObject(dc, hudFont);
    const title = `NET X-RAY · ${edges.size} edges · ${nodes.size} nodes · ${lastTcpRows} TCP / ${lastUdpRows} UDP · ${fps} fps · ESC`;
    const tw = encodeWide(title);
    GDI32.SetTextColor(dc, 0x00102018);
    GDI32.TextOutW(dc, 23, 21, tw.ptr!, title.length);
    GDI32.SetTextColor(dc, 0x0055ddff); // BGR warm gold
    GDI32.TextOutW(dc, 22, 20, tw.ptr!, title.length);

    // Top talkers: hubs by degree.
    GDI32.SelectObject(dc, smallFont);
    const hubs = [...nodes.values()]
      .filter((n) => n.kind === 0)
      .sort((a, b) => b.degree - a.degree)
      .slice(0, 10);
    let y = 56;
    GDI32.SetTextColor(dc, 0x00aad8ff);
    const head = 'TOP TALKERS  (process · connections)';
    const hw = encodeWide(head);
    GDI32.TextOutW(dc, 22, y, hw.ptr!, head.length);
    y += 22;
    for (const h of hubs) {
      const line = `${h.label.slice(0, 28).padEnd(29)} ${Math.round(h.degree)}`;
      const lw = encodeWide(line);
      GDI32.SetTextColor(dc, 0x0040c8ff);
      GDI32.TextOutW(dc, 22, y, lw.ptr!, line.length);
      y += 18;
    }

    // Legend bottom-left.
    const leg = 'gold = local process   azure = remote endpoint   white flare = NEW connection';
    const lw = encodeWide(leg);
    GDI32.SetTextColor(dc, 0x0088bbcc);
    GDI32.TextOutW(dc, 22, clientH - 30, lw.ptr!, leg.length);
  });
}

// ── Optional: a few harmless outbound connects so the constellation has live edges ──
const seedHosts = ['https://one.one.one.one/', 'https://dns.google/', 'https://www.cloudflare.com/', 'https://example.com/', 'https://www.microsoft.com/', 'https://github.com/', 'https://www.wikipedia.org/', 'https://www.bing.com/'];
function seedConnections(): void {
  for (const url of seedHosts) {
    fetch(url, { method: 'GET' })
      .then(async (r) => {
        try {
          await r.arrayBuffer();
        } catch {
          /* ignore */
        }
      })
      .catch(() => {
        /* offline hosts simply won't appear */
      });
  }
}

// ── Teardown ──────────────────────────────────────────────────────────────────────
let cleaned = false;
function cleanup(code: number): never {
  if (!cleaned) {
    cleaned = true;
    try {
      gpu.setBlendState(0n);
      hud.release();
      GDI32.DeleteObject(hudFont);
      GDI32.DeleteObject(smallFont);
      gpu.comRelease(additiveBlend);
      gpu.comRelease(sampler);
      gpu.comRelease(hdr.srv ?? 0n);
      gpu.comRelease(hdr.rtv ?? 0n);
      gpu.comRelease(hdr.tex);
      gpu.comRelease(psPost);
      gpu.comRelease(vsFs);
      gpu.comRelease(psSprites);
      gpu.comRelease(vsSprites);
      gpu.blobRelease(psPostCode.blob);
      gpu.blobRelease(vsFsCode.blob);
      gpu.blobRelease(psSpritesCode.blob);
      gpu.blobRelease(vsSpritesCode.blob);
      gpu.comRelease(postCb);
      gpu.comRelease(rendCb);
      gpu.comRelease(nodeBuf.srv ?? 0n);
      gpu.comRelease(nodeBuf.buffer);
      gpu.comRelease(edgeBuf.srv ?? 0n);
      gpu.comRelease(edgeBuf.buffer);
      gpu.comRelease(dev.backBufferRTV);
      gpu.comRelease(dev.swapChain);
      gpu.comRelease(dev.context);
      gpu.comRelease(dev.device);
    } catch {
      /* best-effort */
    }
    win.destroy();
  }
  process.exit(code);
}
process.on('SIGINT', () => cleanup(0));
process.on('uncaughtException', (err) => {
  console.error(err);
  cleanup(1);
});

// ── Self-check: back-buffer readback → 2D pixel stats ───────────────────────────
const SELFCHECK = process.env.SELFCHECK === '1';
function buildTex2dIid(): Buffer {
  // IID_ID3D11Texture2D 6f15aaf2-d208-4e89-9ab4-489535d34f9c → COM little-endian GUID.
  const b = Buffer.alloc(16);
  b.writeUInt32LE(0x6f15aaf2, 0);
  b.writeUInt16LE(0xd208, 4);
  b.writeUInt16LE(0x4e89, 6);
  b.set([0x9a, 0xb4, 0x48, 0x95, 0x35, 0xd3, 0x4f, 0x9c], 8);
  return b;
}
function selfCheckBackBuffer(): void {
  // Route B: IDXGISwapChain::GetBuffer → staging B8G8R8A8 → CopyResource → Map READ.
  const ppBack = Buffer.alloc(8);
  const iid = buildTex2dIid();
  if (gpu.vcall(dev.swapChain, gpu.SWAP_GET_BUFFER, [FFIType.u32, FFIType.ptr, FFIType.ptr], [0, iid.ptr!, ppBack.ptr!]) !== 0) {
    console.log('SELFCHECK_STATS ' + JSON.stringify({ ok: false, reason: 'GetBuffer failed' }));
    return;
  }
  const backTex = ppBack.readBigUInt64LE(0);
  const staging = gpu.makeTexture({ w: clientW, h: clientH, format: gpu.DXGI_FORMAT_B8G8R8A8_UNORM, staging: true });
  gpu.copyResource(staging.tex, backTex);
  const mapped = Buffer.alloc(16); // pData@0, RowPitch u32@8
  let stats: Record<string, unknown> = { ok: false };
  if (gpu.vcall(dev.context, gpu.CTX_MAP, [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], [staging.tex, 0, 1 /* D3D11_MAP_READ */, 0, mapped.ptr!]) === 0) {
    const dataPtr = Number(mapped.readBigUInt64LE(0)) as Pointer;
    const rowPitch = mapped.readUInt32LE(8);
    // Sample on an 8x8 grid plus a full-frame downscan for global stats.
    let nonBlack = 0;
    let total = 0;
    let lumaSum = 0;
    let goldPx = 0; // warm hubs: r>g>b clearly
    let azurePx = 0; // cool remotes: b>g>r clearly
    const colorBuckets = new Set<number>();
    const GRID = 8;
    const cellVar = new Float64Array(GRID * GRID);
    const cellMean = new Float64Array(GRID * GRID);
    const cellCount = new Int32Array(GRID * GRID);
    const stepX = Math.max(1, Math.floor(clientW / 220));
    const stepY = Math.max(1, Math.floor(clientH / 220));
    for (let py = 0; py < clientH; py += stepY) {
      for (let px = 0; px < clientW; px += stepX) {
        const off = py * rowPitch + px * 4;
        const bch = read.u8(dataPtr, off + 0); // BGRA
        const gch = read.u8(dataPtr, off + 1);
        const rch = read.u8(dataPtr, off + 2);
        total += 1;
        const luma = 0.299 * rch + 0.587 * gch + 0.114 * bch;
        lumaSum += luma;
        if (rch + gch + bch > 24) nonBlack += 1;
        if (rch > gch + 18 && gch > bch + 4 && rch > 60) goldPx += 1;
        if (bch > gch + 12 && gch > rch + 6 && bch > 60) azurePx += 1;
        // coarse color bucket (5 bits/channel)
        colorBuckets.add(((rch >> 3) << 10) | ((gch >> 3) << 5) | (bch >> 3));
        const cx = Math.min(GRID - 1, Math.floor((px / clientW) * GRID));
        const cy = Math.min(GRID - 1, Math.floor((py / clientH) * GRID));
        const ci = cy * GRID + cx;
        cellCount[ci]! += 1;
        cellMean[ci]! += luma;
      }
    }
    for (let i = 0; i < GRID * GRID; i += 1) if (cellCount[i]! > 0) cellMean[i]! /= cellCount[i]!;
    // second pass for per-cell variance
    for (let py = 0; py < clientH; py += stepY) {
      for (let px = 0; px < clientW; px += stepX) {
        const off = py * rowPitch + px * 4;
        const bch = read.u8(dataPtr, off + 0);
        const gch = read.u8(dataPtr, off + 1);
        const rch = read.u8(dataPtr, off + 2);
        const luma = 0.299 * rch + 0.587 * gch + 0.114 * bch;
        const cx = Math.min(GRID - 1, Math.floor((px / clientW) * GRID));
        const cy = Math.min(GRID - 1, Math.floor((py / clientH) * GRID));
        const ci = cy * GRID + cx;
        const d = luma - cellMean[ci]!;
        cellVar[ci]! += d * d;
      }
    }
    let activeCells = 0;
    let varSum = 0;
    for (let i = 0; i < GRID * GRID; i += 1) {
      if (cellCount[i]! > 0) {
        const v = cellVar[i]! / cellCount[i]!;
        varSum += v;
        if (cellMean[i]! > 2) activeCells += 1; // a grid cell with any visible structure
      }
    }
    gpu.vcall(dev.context, gpu.CTX_UNMAP, [FFIType.u64, FFIType.u32], [staging.tex, 0], FFIType.void);
    stats = {
      ok: true,
      sampled: total,
      nonBlackPct: +(nonBlack / total).toFixed(4),
      meanLuma: +(lumaSum / total).toFixed(3),
      distinctColors: colorBuckets.size,
      goldPx,
      azurePx,
      activeGridCells: activeCells,
      meanCellVar: +(varSum / (GRID * GRID)).toFixed(2),
      tcpRows: lastTcpRows,
      udpRows: lastUdpRows,
      established: lastEstablished,
      sampleRemote: lastRemoteSample ? ipFromU32(lastRemoteSample) + ':' + lastRemotePortSample : '(none)',
      nodes: nodes.size,
      edges: edges.size,
    };
  }
  gpu.comRelease(staging.tex);
  gpu.comRelease(backTex);
  console.log('SELFCHECK_STATS ' + JSON.stringify(stats));
}

console.log('  Seeding a few outbound connections so the constellation has live edges...');
seedConnections();

// ── Render loop ──────────────────────────────────────────────────────────────────
const start = performance.now();
const durationMs = process.env.DEMO_DURATION_MS ? Number(process.env.DEMO_DURATION_MS) : 0;
const POLL_MS = 350;
let lastPoll = -1e9;
let frame = 0;
let fps = 0;
let fpsFrames = 0;
let fpsWindow = start;
const rtvEmpty: readonly bigint[] = [];
const nullSrv = Buffer.alloc(8);

while (!win.shouldClose()) {
  win.pump();
  if (win.shouldClose()) break;
  if ((User32.GetAsyncKeyState(0x1b /* VK_ESCAPE */) & 0x8000) !== 0) break;

  const now = performance.now();
  const time = (now - start) / 1000;

  // Poll the OS + relayout a few Hz (and immediately on the first frame).
  if (now - lastPoll >= POLL_MS) {
    lastPoll = now;
    poll(now);
    // A handful of relaxation iterations per poll converges the layout quickly.
    for (let it = 0; it < 6; it += 1) layoutStep();
  }

  // Smoothly lerp each node toward its force-layout target every frame.
  for (const n of nodes.values()) {
    n.x += (n.tx - n.x) * 0.18;
    n.y += (n.ty - n.y) * 0.18;
  }

  // ── Build the edge point cloud (ignite/fade encoded as intensity) ──
  let ePts = 0;
  for (const e of edges.values()) {
    if (ePts + SAMPLES_PER_EDGE > MAX_EDGE_POINTS) break;
    const A = nodes.get(e.from);
    const B = nodes.get(e.to);
    if (!A || !B) continue;
    // Ignite: intensity > 1 for the first ~0.8s of life, decaying to base.
    const age = (now - e.bornAt) / 1000;
    let inten = 1.0 + Math.max(0, 1 - age / 0.8) * 1.4; // 2.4 → 1.0
    if (e.dying !== 0) {
      const dage = (now - e.dying) / 1000;
      inten *= Math.max(0, 1 - dage / 0.6); // fade to 0
    }
    // Slight live shimmer so filaments read as alive.
    const flick = 0.85 + 0.15 * Math.sin(time * 6 + (hashStr(e.key) % 100));
    inten *= flick;
    for (let s = 0; s < SAMPLES_PER_EDGE; s += 1) {
      const t = s / (SAMPLES_PER_EDGE - 1);
      // Gentle arc bow so parallel edges separate visually.
      const bow = Math.sin(t * Math.PI) * 0.04 * ((hashStr(e.key) & 1) === 0 ? 1 : -1);
      const nx = -(B.y - A.y);
      const ny = B.x - A.x;
      const nl = Math.hypot(nx, ny) || 1;
      const x = A.x + (B.x - A.x) * t + (nx / nl) * bow;
      const y = A.y + (B.y - A.y) * t + (ny / nl) * bow;
      const o = ePts * EDGEPT_STRIDE;
      edgeData.writeFloatLE(x, o);
      edgeData.writeFloatLE(y, o + 4);
      edgeData.writeFloatLE(inten, o + 8);
      edgeData.writeFloatLE(0, o + 12);
      ePts += 1;
    }
  }
  gpu.updateDynamicBuffer(edgeBuf.buffer, edgeData);

  // ── Build the node buffer ──
  let nCount = 0;
  let maxDeg = 1;
  for (const n of nodes.values()) maxDeg = Math.max(maxDeg, n.degree);
  for (const n of nodes.values()) {
    if (nCount >= MAX_NODES) break;
    const age = (now - n.bornAt) / 1000;
    const glow = Math.max(0, 1 - age / 0.8); // born-glow 1 → 0 over 0.8s
    const sizeNorm = Math.min(1, n.degree / maxDeg);
    const o = nCount * NODE_STRIDE;
    nodeData.writeFloatLE(n.x, o);
    nodeData.writeFloatLE(n.y, o + 4);
    nodeData.writeFloatLE(sizeNorm, o + 8); // a = size/brightness
    // b = kind(0/1) + glow fraction (kept < 1) so VS can split integer/frac.
    nodeData.writeFloatLE(n.kind + Math.min(0.999, glow), o + 12);
    nCount += 1;
  }
  gpu.updateDynamicBuffer(nodeBuf.buffer, nodeData);

  // ── Render points additively into the HDR target ──
  gpu.setRenderTargets([hdr.rtv!]);
  gpu.setViewport(clientW, clientH);
  gpu.clear(hdr.rtv!, [0.01, 0.014, 0.026, 1]); // deep navy void
  gpu.setBlendState(additiveBlend);

  // Edges first (so node cores sit on top of the filaments).
  rendData.writeFloatLE(aspect, 0);
  rendData.writeFloatLE(time, 4);
  rendData.writeFloatLE(1.0, 8); // itemKind = edge
  rendData.writeFloatLE(xSpread, 12);
  gpu.updateConstantBuffer(rendCb, rendData);
  gpu.vsSetShaderResources([edgeBuf.srv!]);
  gpu.vsSet(vsSprites, [rendCb]);
  gpu.psSet(psSprites);
  if (ePts > 0) drawSprites(ePts);
  gpu.vsSetShaderResources([0n]);

  // Nodes.
  rendData.writeFloatLE(0.0, 8); // itemKind = node
  gpu.updateConstantBuffer(rendCb, rendData);
  gpu.vsSetShaderResources([nodeBuf.srv!]);
  gpu.vsSet(vsSprites, [rendCb]);
  gpu.psSet(psSprites);
  if (nCount > 0) drawSprites(nCount);
  gpu.vsSetShaderResources([0n]);

  gpu.setBlendState(0n);
  gpu.setRenderTargets(rtvEmpty);

  // ── Bloom + tonemap to back buffer ──
  postData.writeFloatLE(1 / clientW, 0);
  postData.writeFloatLE(1 / clientH, 4);
  postData.writeFloatLE(1.25, 8); // exposure
  postData.writeFloatLE(time, 12);
  gpu.updateConstantBuffer(postCb, postData);

  gpu.setRenderTargets([dev.backBufferRTV]);
  gpu.setViewport(clientW, clientH);
  gpu.clear(dev.backBufferRTV, [0, 0, 0, 1]);
  gpu.vsSet(vsFs);
  gpu.psSet(psPost, { cb: [postCb], srv: [hdr.srv!], samp: [sampler] });
  gpu.drawFullscreenTriangle();
  gpu.psSet(psPost, { srv: [0n] });

  // Self-check: read the back buffer BEFORE present (it still holds this frame's
  // pixels) once we've rendered enough frames AND enough wall-clock has elapsed for
  // a few polls + layout convergence (≥1.6s → ~4 polls, edges spread & ignite).
  if (SELFCHECK && frame >= 60 && time >= 1.6) {
    selfCheckBackBuffer();
    break;
  }

  drawHud(fps);
  dev.present(false);

  frame += 1;
  fpsFrames += 1;
  if (now - fpsWindow >= 500) {
    fps = Math.round((fpsFrames * 1000) / (now - fpsWindow));
    fpsFrames = 0;
    fpsWindow = now;
  }

  if (durationMs > 0 && now - start >= durationMs) break;
}

console.log(`\n  ran ${frame} frames over ${((performance.now() - start) / 1000).toFixed(2)}s · ${nodes.size} nodes · ${edges.size} edges · ${dev.gpuName}`);
cleanup(0);
