/**
 * Packet Sniffer — a LIVE raw-packet capture + protocol waterfall on the GPU.
 *
 * This opens a real Winsock RAW socket (WSASocketW with SOCK_RAW), binds it to a
 * live non-loopback IPv4 interface (discovered with the classic UDP-connect /
 * getsockname route), flips the NIC into promiscuous mode with the
 * WSAIoctl(SIO_RCVALL) sniffer ioctl, marks it non-blocking (ioctlsocket FIONBIO),
 * and then drains recv() every frame. Each captured datagram is a real IPv4 packet:
 * we hand-parse the 20-byte IP header (version/IHL, protocol, src/dst), then peek the
 * first 4 bytes of the TCP/UDP payload for src/dst ports. Nothing here is synthetic
 * — the rows are your machine's actual traffic. To guarantee the wire is never empty
 * during a timed capture we fire a burst of real outbound fetch()es at startup.
 *
 * It is drawn as a full-monitor borderless scene composited in a single runtime-
 * compiled HLSL pixel shader: a streaming WATERFALL down the left (one glowing row
 * per packet, colored by protocol, width by size, with a leading comet head), a
 * PROTOCOL-MIX + TOP-TALKERS panel on the right, and a per-second THROUGHPUT graph
 * along the bottom. The waterfall rows live in a per-frame StructuredBuffer<Row> SRV;
 * all crisp text (header, per-packet src→dst lines, talker table, graph axes) is
 * rendered with GDI into a top-down BGRA DIB and uploaded as a B8G8R8A8 texture that
 * the shader screen-composites over the glow — so the captured PNG is fully labeled.
 *
 * Raw sockets + SIO_RCVALL require Administrator. If socket creation or the ioctl
 * fails we print a clear "requires Administrator (raw sockets)" message and exit
 * non-zero — we never fabricate packets.
 *
 * @bun-win32 APIs used:
 *   Ws2_32.WSAStartup / WSASocketW / bind / WSAIoctl(SIO_RCVALL) / ioctlsocket /
 *          recv / connect / getsockname / closesocket / WSACleanup   (raw capture)
 *   User32.GetSystemMetrics                                          (fill the monitor)
 *   _gpu: createWindow / createDevice / compile / makeVertexShader / makePixelShader /
 *         makeStructuredBuffer (cpuWritable SRV) / updateDynamicBuffer /
 *         makeConstantBuffer / updateConstantBuffer / makeTexture / makeSampler /
 *         vsSet / psSet / drawFullscreenTriangle / present / comRelease / vcall
 *   _snapshot: captureBackBuffer / formatGrid                        (gallery PNG)
 *   GDI32 CreateFontW / TextOutW / CreateDIBSection / ...            (baked overlay + HUD)
 *
 * Run (elevated):  bun run packages/all/example/packet-sniffer.ts
 */

import { FFIType } from 'bun:ffi';
import { resolve } from 'node:path';
import { mkdirSync } from 'node:fs';

import { GDI32, User32, Ws2_32 } from '../index';
import {
  comRelease,
  compile,
  createDevice,
  createWindow,
  drawFullscreenTriangle,
  makeConstantBuffer,
  makePixelShader,
  makeSampler,
  makeStructuredBuffer,
  makeTexture,
  makeVertexShader,
  psSet,
  setRenderTargets,
  setViewport,
  clear,
  updateConstantBuffer,
  updateDynamicBuffer,
  vcall,
  vsSet,
  CTX_UPDATE_SUBRESOURCE,
  DXGI_FORMAT_B8G8R8A8_UNORM,
} from './_gpu';
import { captureBackBuffer, formatGrid } from './_snapshot';
import * as hud from './_hud';

const encodeWide = (str: string): Buffer => Buffer.from(`${str}\0`, 'utf16le');

// ── Winsock constants ───────────────────────────────────────────────────────
const AF_INET = 2;
const SOCK_RAW = 3;
const SOCK_DGRAM = 2;
const IPPROTO_IP = 0;
const IPPROTO_UDP = 17;
const SIO_RCVALL = 0x98000001 >>> 0; // RCVALL_ON
const FIONBIO = 0x8004667e >>> 0; // ioctlsocket non-blocking
const INVALID_SOCKET = 0xffffffffffffffffn;
const SOCKET_ERROR = -1;
const WSAEWOULDBLOCK = 10035;
const WSAEACCES = 10013;

// IP protocol numbers.
const IP_ICMP = 1;
const IP_TCP = 6;
const IP_UDP = 17;

// Render "kind" → shader palette index.
const KIND_TCP = 0;
const KIND_UDP = 1;
const KIND_ICMP = 2;
const KIND_OTHER = 3;

function kindForProto(proto: number): number {
  if (proto === IP_TCP) return KIND_TCP;
  if (proto === IP_UDP) return KIND_UDP;
  if (proto === IP_ICMP) return KIND_ICMP;
  return KIND_OTHER;
}
function protoName(proto: number): string {
  if (proto === IP_TCP) return 'TCP';
  if (proto === IP_UDP) return 'UDP';
  if (proto === IP_ICMP) return 'ICMP';
  return `IP/${proto}`;
}

function ipStr(a: number, b: number, c: number, d: number): string {
  return `${a}.${b}.${c}.${d}`;
}

// ── Screen size: fill the primary monitor (capture grabs the whole thing) ──────
const SM_CXSCREEN = 0;
const SM_CYSCREEN = 1;
const SCREEN_W = User32.GetSystemMetrics(SM_CXSCREEN) || 1920;
const SCREEN_H = User32.GetSystemMetrics(SM_CYSCREEN) || 1080;

// ── Captured-packet model ──────────────────────────────────────────────────────
interface Pkt {
  bornAt: number;
  kind: number;
  proto: number;
  src: string;
  dst: string;
  sport: number;
  dport: number;
  len: number; // total IP length (bytes)
  srcKey: string; // src ip for talker stats
}

const MAX_ROWS = 110; // visible waterfall rows on screen at once (spaced so each reads distinct)
const recent: Pkt[] = []; // newest at index 0
const talkers = new Map<string, { bytes: number; pkts: number }>();
const protoBytes: Record<number, number> = { [KIND_TCP]: 0, [KIND_UDP]: 0, [KIND_ICMP]: 0, [KIND_OTHER]: 0 };
const protoPkts: Record<number, number> = { [KIND_TCP]: 0, [KIND_UDP]: 0, [KIND_ICMP]: 0, [KIND_OTHER]: 0 };
let totalPkts = 0;
let totalBytes = 0;

// Per-second throughput history (bytes & packets), newest at the end.
const GRAPH_BINS = 60;
const bpsHistory = new Float64Array(GRAPH_BINS);
const ppsHistory = new Float64Array(GRAPH_BINS);
let secAccumBytes = 0;
let secAccumPkts = 0;
let lastSecRoll = 0;

function recordPacket(p: Pkt): void {
  recent.unshift(p);
  if (recent.length > MAX_ROWS) recent.length = MAX_ROWS;
  const t = talkers.get(p.srcKey) ?? { bytes: 0, pkts: 0 };
  t.bytes += p.len;
  t.pkts += 1;
  talkers.set(p.srcKey, t);
  protoBytes[p.kind]! += p.len;
  protoPkts[p.kind]! += 1;
  totalPkts += 1;
  totalBytes += p.len;
  secAccumBytes += p.len;
  secAccumPkts += 1;
}

// ── Parse one raw IPv4 packet captured on a SOCK_RAW/SIO_RCVALL socket ─────────
// The OS hands us the full IP datagram starting at the IP header.
function parseIpPacket(buf: Buffer, n: number, now: number): void {
  if (n < 20) return;
  const verIhl = buf[0]!;
  const version = verIhl >>> 4;
  if (version !== 4) return; // IPv4 only
  const ihl = (verIhl & 0x0f) * 4; // header length in bytes
  if (ihl < 20 || ihl > n) return;
  const totalLen = buf.readUInt16BE(2);
  const proto = buf[9]!;
  const s0 = buf[12]!,
    s1 = buf[13]!,
    s2 = buf[14]!,
    s3 = buf[15]!;
  const d0 = buf[16]!,
    d1 = buf[17]!,
    d2 = buf[18]!,
    d3 = buf[19]!;
  let sport = 0;
  let dport = 0;
  if ((proto === IP_TCP || proto === IP_UDP) && n >= ihl + 4) {
    sport = buf.readUInt16BE(ihl);
    dport = buf.readUInt16BE(ihl + 2);
  }
  const src = ipStr(s0, s1, s2, s3);
  const dst = ipStr(d0, d1, d2, d3);
  recordPacket({
    bornAt: now,
    kind: kindForProto(proto),
    proto,
    src,
    dst,
    sport,
    dport,
    len: totalLen > 0 ? totalLen : n,
    srcKey: src,
  });
}

// ── Discover a bindable local non-loopback IPv4 ────────────────────────────────
// Open a throwaway UDP socket and "connect" it toward a public address — for UDP
// this sends nothing, it just makes the OS pick the outbound interface. getsockname
// then reports the local IPv4 of that interface, which is exactly what the raw
// socket must bind to for SIO_RCVALL to capture that interface's traffic.
function discoverLocalIp(): { ip: string; sin: Buffer } | null {
  const u = Ws2_32.WSASocketW(AF_INET, SOCK_DGRAM, IPPROTO_UDP, null, 0, 0);
  if (u === INVALID_SOCKET) return null;
  try {
    // SOCKADDR_IN -> 8.8.8.8:53 (network byte order). No packet is sent for UDP connect.
    const dest = Buffer.alloc(16);
    dest.writeUInt16LE(AF_INET, 0);
    dest.writeUInt16BE(53, 2); // port 53, network order
    dest.writeUInt8(8, 4);
    dest.writeUInt8(8, 5);
    dest.writeUInt8(8, 6);
    dest.writeUInt8(8, 7);
    if (Ws2_32.connect(u, dest.ptr!, 16) === SOCKET_ERROR) return null;
    const name = Buffer.alloc(16);
    const nameLen = Buffer.alloc(4);
    nameLen.writeUInt32LE(16, 0);
    if (Ws2_32.getsockname(u, name.ptr!, nameLen.ptr!) === SOCKET_ERROR) return null;
    const a = name[4]!,
      b = name[5]!,
      c = name[6]!,
      d = name[7]!;
    if (a === 0 && b === 0 && c === 0 && d === 0) return null;
    const ip = ipStr(a, b, c, d);
    // Build the bind SOCKADDR_IN for the raw socket (same addr, port 0).
    const sin = Buffer.alloc(16);
    sin.writeUInt16LE(AF_INET, 0);
    sin.writeUInt16BE(0, 2);
    sin.writeUInt8(a, 4);
    sin.writeUInt8(b, 5);
    sin.writeUInt8(c, 6);
    sin.writeUInt8(d, 7);
    return { ip, sin };
  } finally {
    Ws2_32.closesocket(u);
  }
}

// ── Open the raw capture socket (admin-only) ───────────────────────────────────
interface Capture {
  sock: bigint;
  localIp: string;
}
function openCapture(): { ok: true; cap: Capture } | { ok: false; reason: string; err: number } {
  const wsaData = Buffer.alloc(408);
  const wsaRc = Ws2_32.WSAStartup(0x0202, wsaData.ptr!);
  if (wsaRc !== 0) return { ok: false, reason: 'WSAStartup failed', err: wsaRc };

  const local = discoverLocalIp();
  if (local === null) return { ok: false, reason: 'no routable IPv4 interface found', err: 0 };

  // Raw socket. On a non-elevated process this returns INVALID_SOCKET (WSAEACCES).
  const sock = Ws2_32.WSASocketW(AF_INET, SOCK_RAW, IPPROTO_IP, null, 0, 0);
  if (sock === INVALID_SOCKET) {
    const err = Ws2_32.WSAGetLastError();
    return { ok: false, reason: 'WSASocketW(SOCK_RAW) failed', err };
  }

  // Bind to the chosen interface IP (required before SIO_RCVALL).
  if (Ws2_32.bind(sock, local.sin.ptr!, 16) === SOCKET_ERROR) {
    const err = Ws2_32.WSAGetLastError();
    Ws2_32.closesocket(sock);
    return { ok: false, reason: 'bind() failed', err };
  }

  // Promiscuous mode: WSAIoctl(SIO_RCVALL, &one).
  const inOpt = Buffer.alloc(4);
  inOpt.writeUInt32LE(1, 0); // RCVALL_ON
  const bytesRet = Buffer.alloc(4);
  if (Ws2_32.WSAIoctl(sock, SIO_RCVALL, inOpt.ptr!, 4, null, 0, bytesRet.ptr!, null, null) === SOCKET_ERROR) {
    const err = Ws2_32.WSAGetLastError();
    Ws2_32.closesocket(sock);
    return { ok: false, reason: 'WSAIoctl(SIO_RCVALL) failed', err };
  }

  // Non-blocking so recv() never stalls the render loop.
  const mode = Buffer.alloc(4);
  mode.writeUInt32LE(1, 0);
  Ws2_32.ioctlsocket(sock, FIONBIO, mode.ptr!);

  return { ok: true, cap: { sock, localIp: local.ip } };
}

// ── Generate real outbound traffic so the wire is never empty ──────────────────
const seedHosts = [
  'https://one.one.one.one/',
  'https://dns.google/',
  'https://www.cloudflare.com/',
  'https://example.com/',
  'https://www.microsoft.com/',
  'https://github.com/',
  'https://www.wikipedia.org/',
  'https://www.bing.com/',
  'https://www.apple.com/',
  'https://nodejs.org/',
];
function seedTraffic(): void {
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
        /* offline hosts simply won't show */
      });
  }
}

// ── Try to open capture FIRST; fail honestly if not elevated ───────────────────
const opened = openCapture();
if (!opened.ok) {
  const adminish = opened.reason.includes('SOCK_RAW') || opened.reason.includes('SIO_RCVALL') || opened.err === WSAEACCES;
  console.error('Packet Sniffer — could not start raw capture.');
  console.error(`  ${opened.reason}${opened.err ? ` (WSA error ${opened.err}${opened.err === WSAEACCES ? ' = WSAEACCES' : ''})` : ''}`);
  if (adminish) {
    console.error('  This demo requires Administrator (raw sockets + SIO_RCVALL promiscuous capture).');
    console.error('  Re-run from an elevated terminal:  bun run packages/all/example/packet-sniffer.ts');
  }
  try {
    Ws2_32.WSACleanup();
  } catch {
    /* ignore */
  }
  process.exit(1);
}
const cap = opened.cap;
console.log('Packet Sniffer — live raw-packet waterfall on the GPU.');
console.log(`  capturing on ${cap.localIp} · SOCK_RAW + SIO_RCVALL promiscuous`);
console.log('  seeding outbound traffic so the wire is never quiet...');
seedTraffic();

// ── Window + device (fills the primary monitor) ────────────────────────────────
const win = createWindow({ title: 'Packet Sniffer — raw capture waterfall', width: SCREEN_W, height: SCREEN_H, borderless: true });
const { w: clientW, h: clientH } = win.clientSize();
const gpu = createDevice(win.hwnd, { width: clientW, height: clientH });
gpu.recreateRTV();

// ── Waterfall row structured buffer (per-frame upload) ─────────────────────────
// struct Row { float y; uint kind; float age; float widthN; float lenN; float beam; float p0,p1; } = 32 bytes
const ROW_STRIDE = 32;
const rowBuf = makeStructuredBuffer({ stride: ROW_STRIDE, count: MAX_ROWS, srv: true, cpuWritable: true });
const rowData = Buffer.alloc(ROW_STRIDE * MAX_ROWS);

// Protocol-mix / throughput data for the shader (compact: bins live in a CB array).
// cbuffer Frame: float2 res; float time; uint rowCount; float wfX; float wfW; float panelX; float pad;
//                float4 protoFrac;  (TCP,UDP,ICMP,OTHER fractions of packets)
//                float bps[120] / pps[120] packed as float4[60] -> handled in a 2nd SB instead.
// We keep the graph in a small StructuredBuffer<float2> (bps,pps normalized) of GRAPH_BINS.
const GRAPH_STRIDE = 8; // float2
const graphBuf = makeStructuredBuffer({ stride: GRAPH_STRIDE, count: GRAPH_BINS, srv: true, cpuWritable: true });
const graphData = Buffer.alloc(GRAPH_STRIDE * GRAPH_BINS);

// ── Overlay texture: GDI-baked title / legend / per-row labels / talker table ──
const OVR_W = clientW;
const OVR_H = clientH;
const ovrTex = makeTexture({ w: OVR_W, h: OVR_H, format: DXGI_FORMAT_B8G8R8A8_UNORM, srv: true });
const ovrSampler = makeSampler();
const bmi = Buffer.alloc(40);
bmi.writeUInt32LE(40, 0);
bmi.writeInt32LE(OVR_W, 4);
bmi.writeInt32LE(-OVR_H, 8); // top-down
bmi.writeUInt16LE(1, 12);
bmi.writeUInt16LE(32, 14);
bmi.writeUInt32LE(0, 16);
const ovrBitsPtrBuf = Buffer.alloc(8);
const ovrMemDC = GDI32.CreateCompatibleDC(0n);
const ovrDib = GDI32.CreateDIBSection(ovrMemDC, bmi.ptr!, 0, ovrBitsPtrBuf.ptr!, 0n, 0);
GDI32.SelectObject(ovrMemDC, ovrDib);
const ovrBitsPtr = ovrBitsPtrBuf.readBigUInt64LE(0);
const OVR_ROW_PITCH = OVR_W * 4;
GDI32.SetBkMode(ovrMemDC, 1);
GDI32.SetTextAlign(ovrMemDC, 0);

const ovrTitleFont = GDI32.CreateFontW(-30, 0, 0, 0, 800, 0, 0, 0, 0, 0, 0, 4, 0, encodeWide('Consolas').ptr!);
const ovrLabelFont = GDI32.CreateFontW(-16, 0, 0, 0, 600, 0, 0, 0, 0, 0, 0, 4, 0, encodeWide('Consolas').ptr!);
const ovrSmallFont = GDI32.CreateFontW(-14, 0, 0, 0, 500, 0, 0, 0, 0, 0, 0, 4, 0, encodeWide('Consolas').ptr!);
const ovrBigFont = GDI32.CreateFontW(-22, 0, 0, 0, 700, 0, 0, 0, 0, 0, 0, 4, 0, encodeWide('Consolas').ptr!);

const BLACKNESS = 0x00000042;
function clearOverlay(): void {
  GDI32.BitBlt(ovrMemDC, 0, 0, OVR_W, OVR_H, 0n, 0, 0, BLACKNESS);
}
function ovrText(x: number, y: number, text: string, bgr: number): void {
  GDI32.SetTextColor(ovrMemDC, bgr);
  const w = encodeWide(text);
  GDI32.TextOutW(ovrMemDC, x, y, w.ptr!, text.length);
}
function uploadOverlay(): void {
  GDI32.GdiFlush();
  vcall(gpu.context, CTX_UPDATE_SUBRESOURCE, [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.u32], [ovrTex.tex, 0, null, ovrBitsPtr, OVR_ROW_PITCH, 0], FFIType.void);
}

// ── Layout (fractions of the client area) ──────────────────────────────────────
const WF_X = 0.02; // waterfall left edge (norm)
const WF_W = 0.5; // waterfall column width (norm) — the hero column
const PANEL_X = 0.555; // right panel left edge (norm)
const GRAPH_TOP = 0.8; // throughput graph occupies the bottom strip (norm y)

// ── Constant buffer ─────────────────────────────────────────────────────────────
// float2 res; float time; uint rowCount; | float wfX; float wfW; float panelX; float graphTop;
// float4 protoFrac (TCP,UDP,ICMP,OTHER); float maxBps; float maxPps; float pad0; float pad1;
const CB_SIZE = 64;
const cb = makeConstantBuffer(CB_SIZE);
const cbData = Buffer.alloc(CB_SIZE);

// ── HLSL ────────────────────────────────────────────────────────────────────────
const VS = `
struct VSOut { float4 pos : SV_Position; float2 uv : TEXCOORD0; };
VSOut main(uint vid : SV_VertexID) {
  VSOut o;
  float2 p = float2((vid << 1) & 2, vid & 2);
  o.uv = p;
  o.pos = float4(p * float2(2.0,-2.0) + float2(-1.0,1.0), 0.0, 1.0);
  return o;
}
`;

const PS = `
cbuffer Frame : register(b0) {
  float2 uRes; float uTime; uint uRowCount;
  float uWfX; float uWfW; float uPanelX; float uGraphTop;
  float4 uProtoFrac;          // TCP, UDP, ICMP, OTHER (packet fractions)
  float uMaxBps; float uMaxPps; float uPad0; float uPad1;
};
struct Row { float y; uint kind; float age; float widthN; float lenN; float beam; float p0; float p1; };
StructuredBuffer<Row>    Rows  : register(t0);
StructuredBuffer<float2> Graph : register(t1);   // (bpsNorm, ppsNorm) per bin
Texture2D    Overlay : register(t2);             // GDI-baked text
SamplerState Samp    : register(s0);

static const float PI = 3.14159265;
static const uint GRAPH_BINS = ${GRAPH_BINS}u;

float3 kindColor(uint k) {
  if (k == 0u) return float3(0.20, 0.78, 1.00);  // TCP — electric cyan/blue
  if (k == 1u) return float3(1.00, 0.32, 0.86);  // UDP — magenta
  if (k == 2u) return float3(1.00, 0.74, 0.18);  // ICMP — amber
  return float3(0.72, 0.78, 0.92);               // OTHER — pale steel
}

float hash21(float2 p) {
  p = frac(p * float2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return frac(p.x * p.y);
}

float4 main(float4 fragPos : SV_Position, float2 uv : TEXCOORD0) : SV_Target {
  float2 px = fragPos.xy;            // pixel coords
  float2 q = px / uRes;             // 0..1
  float aspect = uRes.x / uRes.y;

  // ── deep cyber background: vertical gradient + faint grid + vignette ──
  float3 col = lerp(float3(0.012, 0.020, 0.034), float3(0.004, 0.008, 0.016), q.y);
  // faint grid
  float gx = abs(frac(q.x * 64.0) - 0.5);
  float gy = abs(frac(q.y * 36.0) - 0.5);
  col += float3(0.02, 0.05, 0.07) * (smoothstep(0.49, 0.5, 1.0 - gx) + smoothstep(0.49, 0.5, 1.0 - gy)) * 0.25;
  // scanline phosphor speckle
  float spk = hash21(floor(px / 2.0));
  col += float3(0.006, 0.010, 0.014) * spk;

  // ════════════════════ WATERFALL (left hero column) ════════════════════
  // Rows stream downward; each Row carries its normalized center y (0=top),
  // a protocol kind/color, an age (fade), a bar width and a leading comet.
  // Each row is a THIN vivid colored streak that brightens toward its leading
  // tip; contributions are accumulated screen-wise (1-(1-a)(1-b)) so adjacent
  // streaks stay distinct and never wash out to white.
  {
    float colL = uWfX;
    float colR = uWfX + uWfW;
    if (q.x > colL - 0.01 && q.x < colR + 0.03) {
      // dim recessed track so the column reads as a panel even when sparse
      float inCol = smoothstep(0.0, 0.006, q.x - colL) * smoothstep(0.0, 0.006, colR + 0.02 - q.x);
      col += float3(0.012, 0.028, 0.040) * inCol;

      float3 wf = float3(0.0, 0.0, 0.0);    // accumulated streak color (screen-blended)
      for (uint i = 0u; i < uRowCount; i++) {
        Row r = Rows[i];
        float3 bc = kindColor(r.kind);
        float dy = q.y - r.y;
        // Tight vertical band — ~3px core so rows never merge vertically.
        float band = exp(-pow(dy * uRes.y / 3.2, 2.0));
        if (band < 0.004) continue;
        float fade = saturate(1.0 - r.age);                 // older rows dim out
        float barL = colL + 0.014;
        float barR = colL + 0.014 + r.widthN * (uWfW - 0.06);
        float inBar = smoothstep(-0.002, 0.003, q.x - barL) * smoothstep(-0.002, 0.003, barR - q.x);
        // Horizontal intensity gradient: dim at the trailing (left) end, hot at the
        // leading tip — the classic "packet streaking in" look.
        float along = saturate((q.x - barL) / max(barR - barL, 1e-4));
        float grad = 0.30 + 0.70 * along * along;
        float body = inBar * band * grad * (0.55 + 1.05 * fade);
        // crisp leading tip head (recent packets flare)
        float tip = exp(-pow((q.x - barR) * uRes.x / 6.0, 2.0)) * band;
        float head = tip * (0.9 + r.beam * 2.6);
        // protocol color dominates; only the very tip gets a white-hot kiss
        float3 streak = bc * (body * 1.35 + head) + float3(0.9, 0.97, 1.0) * tip * head * 0.45;
        wf = 1.0 - (1.0 - wf) * (1.0 - saturate(streak));
      }
      col += wf;

      // crisp column frame rails
      float frameL = exp(-pow((q.x - colL) * uRes.x / 2.0, 2.0));
      float frameR = exp(-pow((q.x - colR) * uRes.x / 2.0, 2.0));
      col += float3(0.12, 0.52, 0.66) * (frameL + frameR) * 0.7;
    }
  }

  // ════════════════════ PROTOCOL-MIX donut (right panel, upper) ════════════
  {
    float2 c = float2(uPanelX + 0.105, 0.255);
    float2 d = float2((q.x - c.x) * aspect, q.y - c.y);
    float rr = length(d);
    float ang = atan2(d.y, d.x);                 // -PI..PI
    float a01 = (ang + PI) / (2.0 * PI);        // 0..1 clockwise-ish
    float ringInner = 0.060;
    float ringOuter = 0.115;
    float inRing = smoothstep(ringInner - 0.004, ringInner + 0.003, rr) * smoothstep(ringOuter + 0.004, ringOuter - 0.003, rr);
    // stacked arcs by proto fraction
    float f0 = uProtoFrac.x;
    float f1 = f0 + uProtoFrac.y;
    float f2 = f1 + uProtoFrac.z;
    uint seg = a01 < f0 ? 0u : (a01 < f1 ? 1u : (a01 < f2 ? 2u : 3u));
    float3 dc = kindColor(seg);
    // subtle gap lines between segments
    float gap = min(min(abs(a01 - f0), abs(a01 - f1)), min(abs(a01 - f2), min(a01, 1.0 - a01)));
    float gapMask = smoothstep(0.0, 0.0035, gap);
    // radial sheen so the ring reads glossy, brighter toward the outer edge
    float sheen = 0.7 + 0.6 * smoothstep(ringInner, ringOuter, rr);
    col += dc * inRing * gapMask * sheen * 1.35;
    // bright outer rim + inner rim
    col += dc * exp(-pow((rr - ringOuter) * 600.0, 2.0)) * gapMask * 0.6;
    // inner glow disc + faint center crosshair
    col += float3(0.08, 0.26, 0.40) * exp(-pow(rr / 0.06, 2.0)) * 0.5;
  }

  // ════════════════════ THROUGHPUT GRAPH (bottom strip) ════════════════════
  {
    if (q.y > uGraphTop) {
      float gTop = uGraphTop;
      float gBase = 0.965;                 // baseline a touch above the very bottom
      float gh = gBase - gTop;
      // recessed graph panel background
      col += float3(0.014, 0.030, 0.044) * smoothstep(0.0, 0.01, q.y - gTop) * smoothstep(0.0, 0.01, 0.998 - q.y);
      // horizontal gridlines (4)
      col += float3(0.05, 0.16, 0.22) * exp(-pow((frac((q.y - gTop) / gh * 4.0)) * 30.0, 2.0)) * smoothstep(0.0, 0.01, q.y - gTop);
      // map x across the whole width to a bin
      float fb = q.x * float(GRAPH_BINS);
      uint bin = (uint)clamp(fb, 0.0, float(GRAPH_BINS - 1u));
      float2 gv = Graph[bin];
      // sub-bin x for per-second column bars (a thin gutter between bars)
      float binFrac = frac(fb);
      float barMask = smoothstep(0.04, 0.10, binFrac) * smoothstep(0.04, 0.10, 1.0 - binFrac);
      float yBps = gBase - gh * gv.x;
      float yPps = gBase - gh * gv.y;
      // per-second BYTES bars: filled cyan columns rising from the baseline
      float colMask = smoothstep(0.0, 0.004, q.y - yBps) * smoothstep(0.0, 0.004, gBase - q.y) * barMask;
      float vgrad = saturate((gBase - q.y) / max(gBase - yBps, 1e-4)); // 0 base .. 1 top
      col += lerp(float3(0.05, 0.26, 0.40), float3(0.22, 0.78, 1.0), vgrad) * colMask * (0.55 + 0.45 * gv.x);
      // bright cap on each bar
      col += float3(0.5, 0.95, 1.0) * exp(-pow((q.y - yBps) * uRes.y / 3.0, 2.0)) * barMask * (gv.x > 0.001 ? 1.4 : 0.0);
      // packets/s as a bright amber line riding over the bars
      col += float3(1.0, 0.74, 0.22) * exp(-pow((q.y - yPps) * uRes.y / 2.2, 2.0)) * 1.3;
      // baseline + top rule
      col += float3(0.12, 0.45, 0.58) * exp(-pow((q.y - gTop) * uRes.y / 1.6, 2.0)) * 1.0;
      col += float3(0.10, 0.38, 0.50) * exp(-pow((q.y - gBase) * uRes.y / 1.6, 2.0)) * 0.7;
    }
  }

  // ── tonemap + gamma + scanline + vignette ──
  col = col / (col + 0.72);
  float scan = 0.96 + 0.04 * sin(px.y * 2.2);
  col *= scan;
  float2 vc = q - 0.5;
  float vig = smoothstep(1.1, 0.25, length(vc * float2(1.0, 1.0)));
  col *= lerp(0.55, 1.0, vig);
  col = pow(saturate(col), 1.0 / 2.2);

  // ── composite the GDI text overlay (luminance-masked screen blend) ──
  float4 ot = Overlay.Sample(Samp, q);
  float olum = max(ot.r, max(ot.g, ot.b));
  float mask = smoothstep(0.06, 0.55, olum);
  col = lerp(col, ot.rgb, mask);            // text replaces the layer where it is bright
  col += ot.rgb * olum * 0.10;              // faint phosphor glow halo

  return float4(col, 1.0);
}
`;

const vs = makeVertexShader(compile(VS, 'main', 'vs_5_0'));
const ps = makePixelShader(compile(PS, 'main', 'ps_5_0'));

// ── Live-window HUD font ─────────────────────────────────────────────────────────
const hudFont = GDI32.CreateFontW(-18, 0, 0, 0, 700, 0, 0, 0, 0, 0, 0, 4, 0, encodeWide('Consolas').ptr!);
function drawHud(fps: number): void {
  hud.draw(gpu, clientW, clientH, (dc) => {
    GDI32.SetBkMode(dc, 1);
    GDI32.SelectObject(dc, hudFont);
    const title = `PACKET SNIFFER · ${cap.localIp} · ${totalPkts} pkts · ${fmtBytes(totalBytes)} · ${fps} fps · ESC`;
    const tw = encodeWide(title);
    GDI32.SetTextColor(dc, 0x00201005);
    GDI32.TextOutW(dc, 21, 17, tw.ptr!, title.length);
    GDI32.SetTextColor(dc, 0x00ffcc55);
    GDI32.TextOutW(dc, 20, 16, tw.ptr!, title.length);
  });
}

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(2)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

// ── Overlay colors (0x00BBGGRR) ──────────────────────────────────────────────────
const COL_TITLE = 0x00ffd060;
const COL_DIM = 0x00b0a070;
const KIND_BGR = [0x00ffc733, 0x00db52ff, 0x002fbcff, 0x00e8c8b8]; // TCP cyan, UDP magenta, ICMP amber, OTHER
const KIND_LABEL = ['TCP', 'UDP', 'ICMP', 'OTHER'];

function drawOverlay(fps: number, rowsForLabel: { y: number; p: Pkt }[]): void {
  clearOverlay();

  // ── Title block (top-left) ──
  GDI32.SelectObject(ovrMemDC, ovrTitleFont);
  ovrText(28, 14, 'PACKET SNIFFER', COL_TITLE);
  GDI32.SelectObject(ovrMemDC, ovrSmallFont);
  ovrText(30, 52, `raw SOCK_RAW + SIO_RCVALL promiscuous capture on ${cap.localIp} · GPU/HLSL waterfall`, COL_DIM);
  const sub = `${totalPkts} packets   ${fmtBytes(totalBytes)}   ${fps} fps`;
  ovrText(30, 72, sub, 0x00c8ffb0);

  // ── Per-row packet labels down the waterfall column ──
  GDI32.SelectObject(ovrMemDC, ovrSmallFont);
  const labelX = Math.round((WF_X + WF_W) * OVR_W) + 16;
  for (const { y, p } of rowsForLabel) {
    const yp = Math.round(y * OVR_H) - 7;
    if (yp < 96 || yp > OVR_H * GRAPH_TOP - 20) continue;
    const sp = p.sport ? `:${p.sport}` : '';
    const dp = p.dport ? `:${p.dport}` : '';
    const line = `${protoName(p.proto).padEnd(4)} ${p.src}${sp}  ->  ${p.dst}${dp}  ${p.len}B`;
    ovrText(labelX, yp, line, KIND_BGR[p.kind]!);
  }

  // ── Right panel header + protocol legend ──
  const panelPx = Math.round(PANEL_X * OVR_W);
  GDI32.SelectObject(ovrMemDC, ovrBigFont);
  ovrText(panelPx, 96, 'PROTOCOL MIX', COL_TITLE);
  GDI32.SelectObject(ovrMemDC, ovrLabelFont);
  let ly = 132;
  for (let k = 0; k < 4; k += 1) {
    const frac = totalPkts > 0 ? protoPkts[k]! / totalPkts : 0;
    const brush = GDI32.CreateSolidBrush(KIND_BGR[k]!);
    const old = GDI32.SelectObject(ovrMemDC, brush);
    GDI32.PatBlt(ovrMemDC, panelPx, ly + 3, 14, 14, 0x00f00021);
    GDI32.SelectObject(ovrMemDC, old);
    GDI32.DeleteObject(brush);
    const line = `${KIND_LABEL[k]!.padEnd(6)} ${(frac * 100).toFixed(1).padStart(5)}%   ${String(protoPkts[k]!).padStart(7)} pkts   ${fmtBytes(protoBytes[k]!)}`;
    ovrText(panelPx + 24, ly, line, KIND_BGR[k]!);
    ly += 26;
  }

  // ── Top talkers table ──
  ly += 18;
  GDI32.SelectObject(ovrMemDC, ovrBigFont);
  ovrText(panelPx, ly, 'TOP TALKERS', COL_TITLE);
  ly += 38;
  GDI32.SelectObject(ovrMemDC, ovrLabelFont);
  ovrText(panelPx, ly, `${'SOURCE IP'.padEnd(20)} ${'PACKETS'.padStart(9)}   BYTES`, COL_DIM);
  ly += 24;
  const top = [...talkers.entries()].sort((a, b) => b[1].bytes - a[1].bytes).slice(0, 12);
  const maxBytes = top.length > 0 ? top[0]![1].bytes : 1;
  for (const [ip, st] of top) {
    // mini bar showing relative volume
    const barW = Math.round((st.bytes / maxBytes) * 260);
    const brush = GDI32.CreateSolidBrush(0x00404e2a);
    const old = GDI32.SelectObject(ovrMemDC, brush);
    GDI32.PatBlt(ovrMemDC, panelPx, ly + 2, barW, 16, 0x00f00021);
    GDI32.SelectObject(ovrMemDC, old);
    GDI32.DeleteObject(brush);
    const line = `${ip.padEnd(20)} ${String(st.pkts).padStart(9)}   ${fmtBytes(st.bytes)}`;
    ovrText(panelPx + 2, ly, line, 0x00d0ffc0);
    ly += 22;
  }

  // ── Throughput graph caption (bottom) ──
  GDI32.SelectObject(ovrMemDC, ovrLabelFont);
  const gy = Math.round(GRAPH_TOP * OVR_H) + 8;
  ovrText(28, gy, 'THROUGHPUT (per second)', COL_TITLE);
  ovrText(300, gy, '— bytes/s', 0x00ffc733);
  ovrText(440, gy, '— packets/s', 0x002fbcff);
  const bpsNow = bpsHistory[GRAPH_BINS - 1] ?? 0;
  const ppsNow = ppsHistory[GRAPH_BINS - 1] ?? 0;
  ovrText(620, gy, `now: ${fmtBytes(bpsNow)}/s · ${Math.round(ppsNow)} pkts/s`, 0x00c8ffb0);

  uploadOverlay();
}

// ── Teardown ──────────────────────────────────────────────────────────────────
let cleaned = false;
function cleanup(code: number): never {
  if (!cleaned) {
    cleaned = true;
    try {
      // turn promiscuous off (RCVALL_OFF) then close
      const off = Buffer.alloc(4);
      off.writeUInt32LE(0, 0);
      const br = Buffer.alloc(4);
      Ws2_32.WSAIoctl(cap.sock, SIO_RCVALL, off.ptr!, 4, null, 0, br.ptr!, null, null);
      Ws2_32.closesocket(cap.sock);
      Ws2_32.WSACleanup();
    } catch {
      /* ignore */
    }
    try {
      hud.release();
      GDI32.DeleteObject(hudFont);
      GDI32.DeleteObject(ovrTitleFont);
      GDI32.DeleteObject(ovrLabelFont);
      GDI32.DeleteObject(ovrSmallFont);
      GDI32.DeleteObject(ovrBigFont);
      GDI32.DeleteObject(ovrDib);
      GDI32.DeleteDC(ovrMemDC);
      comRelease(ovrSampler);
      comRelease(ovrTex.srv ?? 0n);
      comRelease(ovrTex.tex);
      comRelease(graphBuf.srv ?? 0n);
      comRelease(graphBuf.buffer);
      comRelease(rowBuf.srv ?? 0n);
      comRelease(rowBuf.buffer);
      comRelease(cb);
      comRelease(ps);
      comRelease(vs);
      comRelease(gpu.backBufferRTV);
      comRelease(gpu.swapChain);
      comRelease(gpu.context);
      comRelease(gpu.device);
    } catch {
      /* ignore */
    }
    try {
      win.destroy();
    } catch {
      /* ignore */
    }
  }
  process.exit(code);
}
process.on('SIGINT', () => cleanup(0));
process.on('uncaughtException', (err) => {
  console.error(err);
  cleanup(1);
});

console.log(`  ${clientW}x${clientH} · ${gpu.driver} · ${gpu.gpuName}`);

// ── Capture drain: pull as many packets as are queued, without blocking ────────
const recvBuf = Buffer.alloc(65536);
function drainCapture(now: number): void {
  // bounded per frame so a flood can't stall the render loop
  for (let i = 0; i < 256; i += 1) {
    const n = Ws2_32.recv(cap.sock, recvBuf.ptr!, recvBuf.length, 0);
    if (n === SOCKET_ERROR) {
      // WSAEWOULDBLOCK = nothing waiting; anything else we just stop draining.
      break;
    }
    if (n <= 0) break;
    parseIpPacket(recvBuf, n, now);
  }
}

// ── Render loop ──────────────────────────────────────────────────────────────────
const start = performance.now();
const durationMs = process.env.DEMO_DURATION_MS ? Number(process.env.DEMO_DURATION_MS) : 0;
const selfShot = process.env.SELFSHOT === '1';
const nullSrv = Buffer.alloc(24); // three null SRV slots to unbind (t0,t1,t2)

let frame = 0;
let fps = 0;
let fpsFrames = 0;
let fpsWindow = start;
let capturedThisRun = false;
lastSecRoll = start;

while (!win.shouldClose()) {
  win.pump();
  if (win.shouldClose()) break;

  const now = performance.now();
  const time = (now - start) / 1000;

  // Drain real packets.
  drainCapture(now);

  // Roll the per-second throughput history once per real second.
  if (now - lastSecRoll >= 1000) {
    lastSecRoll = now;
    bpsHistory.copyWithin(0, 1);
    ppsHistory.copyWithin(0, 1);
    bpsHistory[GRAPH_BINS - 1] = secAccumBytes;
    ppsHistory[GRAPH_BINS - 1] = secAccumPkts;
    secAccumBytes = 0;
    secAccumPkts = 0;
  }

  // ── Build the waterfall row buffer ─────────────────────────────────────────
  // Each recent packet maps to a row; index 0 (newest) sits near the top of the
  // column, scrolling down as newer packets push in. Rows fade with age.
  const wfTopN = 0.1;
  const wfBotN = GRAPH_TOP - 0.02;
  const wfSpan = wfBotN - wfTopN;
  const visible = Math.min(recent.length, MAX_ROWS);
  const labelRows: { y: number; p: Pkt }[] = [];
  // longest len in window for width normalization
  let maxLen = 1;
  for (let i = 0; i < visible; i += 1) maxLen = Math.max(maxLen, recent[i]!.len);
  for (let i = 0; i < visible; i += 1) {
    const p = recent[i]!;
    const t01 = visible > 1 ? i / (visible - 1) : 0; // 0 = newest (top)
    const y = wfTopN + t01 * wfSpan;
    const ageSec = (now - p.bornAt) / 1000;
    const age = Math.min(1, ageSec / 8); // fade over ~8s of scroll
    const widthN = 0.18 + 0.82 * (Math.log2(p.len + 1) / Math.log2(maxLen + 1));
    const beam = Math.exp(-ageSec * 3.0); // freshly-arrived rows flare at the tip
    const o = i * ROW_STRIDE;
    rowData.writeFloatLE(y, o);
    rowData.writeUInt32LE(p.kind >>> 0, o + 4);
    rowData.writeFloatLE(age, o + 8);
    rowData.writeFloatLE(widthN, o + 12);
    rowData.writeFloatLE(p.len / maxLen, o + 16);
    rowData.writeFloatLE(beam, o + 20);
    rowData.writeFloatLE(0, o + 24);
    rowData.writeFloatLE(0, o + 28);
    // label only a sparse subset so text stays legible
    if (i % 3 === 0) labelRows.push({ y, p });
  }
  updateDynamicBuffer(rowBuf.buffer, rowData);

  // ── Build the throughput graph buffer (normalized) ─────────────────────────
  let maxBps = 1;
  let maxPps = 1;
  for (let i = 0; i < GRAPH_BINS; i += 1) {
    maxBps = Math.max(maxBps, bpsHistory[i]!);
    maxPps = Math.max(maxPps, ppsHistory[i]!);
  }
  for (let i = 0; i < GRAPH_BINS; i += 1) {
    graphData.writeFloatLE(bpsHistory[i]! / maxBps, i * GRAPH_STRIDE);
    graphData.writeFloatLE(ppsHistory[i]! / maxPps, i * GRAPH_STRIDE + 4);
  }
  updateDynamicBuffer(graphBuf.buffer, graphData);

  // ── Overlay (text baked into the frame) ────────────────────────────────────
  drawOverlay(fps, labelRows);

  // ── Constant buffer (built immediately before the consuming draw) ──────────
  const denom = totalPkts > 0 ? totalPkts : 1;
  cbData.writeFloatLE(clientW, 0);
  cbData.writeFloatLE(clientH, 4);
  cbData.writeFloatLE(time, 8);
  cbData.writeUInt32LE(visible >>> 0, 12);
  cbData.writeFloatLE(WF_X, 16);
  cbData.writeFloatLE(WF_W, 20);
  cbData.writeFloatLE(PANEL_X, 24);
  cbData.writeFloatLE(GRAPH_TOP, 28);
  cbData.writeFloatLE(protoPkts[KIND_TCP]! / denom, 32);
  cbData.writeFloatLE(protoPkts[KIND_UDP]! / denom, 36);
  cbData.writeFloatLE(protoPkts[KIND_ICMP]! / denom, 40);
  cbData.writeFloatLE(protoPkts[KIND_OTHER]! / denom, 44);
  cbData.writeFloatLE(maxBps, 48);
  cbData.writeFloatLE(maxPps, 52);
  cbData.writeFloatLE(0, 56);
  cbData.writeFloatLE(0, 60);
  updateConstantBuffer(cb, cbData);

  // ── Render ─────────────────────────────────────────────────────────────────
  setRenderTargets([gpu.backBufferRTV]);
  setViewport(clientW, clientH);
  clear(gpu.backBufferRTV, [0, 0, 0, 1]);
  vsSet(vs);
  psSet(ps, { cb: [cb], srv: [rowBuf.srv!, graphBuf.srv!, ovrTex.srv!], samp: [ovrSampler] });
  drawFullscreenTriangle();
  // Unbind all three SRVs so the dynamic buffers can be Map-discarded next frame.
  vcall(gpu.context, 8 /* PSSetShaderResources */, [FFIType.u32, FFIType.u32, FFIType.ptr], [0, 3, nullSrv.ptr!], FFIType.void);
  setRenderTargets([]);

  // ── Gallery / self-check capture on the last frame, BEFORE present ──────────
  const willBreak = durationMs > 0 && now - start >= durationMs;
  if (willBreak && !capturedThisRun) {
    capturedThisRun = true;
    const shotDir = resolve(import.meta.dir, '..', 'screenshots');
    mkdirSync(shotDir, { recursive: true });
    const outName = selfShot ? 'packet-sniffer.selfcheck.png' : 'packet-sniffer.png';
    const stats = captureBackBuffer(gpu, resolve(shotDir, outName), { gridW: 64, gridH: 24 });
    console.log(formatGrid(stats));
    console.log(`[shot] ok=${stats.ok} nonBlack=${stats.nonBlackFrac.toFixed(3)} meanLuma=${stats.meanLuma.toFixed(3)} grid=${stats.gridW}x${stats.gridH} -> ${stats.path}`);
  }

  drawHud(fps);
  gpu.present(false);

  frame += 1;
  fpsFrames += 1;
  if (now - fpsWindow >= 500) {
    fps = Math.round((fpsFrames * 1000) / (now - fpsWindow));
    fpsFrames = 0;
    fpsWindow = now;
  }

  if (willBreak) break;
}

// ── One-time console dump of parsed packets (proves real capture) ───────────────
console.log('\n  Recently captured packets (real wire data):');
console.log(`  ${'PROTO'.padEnd(6)} ${'SOURCE'.padEnd(24)} ${'DEST'.padEnd(24)} BYTES`);
let shown = 0;
for (const p of recent) {
  if (shown >= 16) break;
  const sp = p.sport ? `:${p.sport}` : '';
  const dp = p.dport ? `:${p.dport}` : '';
  console.log(`  ${protoName(p.proto).padEnd(6)} ${(p.src + sp).padEnd(24)} ${(p.dst + dp).padEnd(24)} ${p.len}`);
  shown += 1;
}
console.log(`\n  ran ${frame} frames over ${((performance.now() - start) / 1000).toFixed(2)}s (${fps} fps) · ${totalPkts} packets · ${fmtBytes(totalBytes)} · ${gpu.gpuName}`);
cleanup(0);
