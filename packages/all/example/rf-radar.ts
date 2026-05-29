/**
 * RF Radar — your real RF environment, swept live on the GPU, in pure TypeScript.
 *
 * A borderless full-screen phosphor radar. Every visible WiFi access point on the
 * machine's wireless adapter is harvested live via wlanapi (WlanOpenHandle →
 * WlanEnumInterfaces → WlanGetAvailableNetworkList, parsed by hand from the
 * DLL-allocated WLAN_AVAILABLE_NETWORK list) and plotted as a contact on a polar
 * radar: radial distance from signal quality (strong = near centre), bearing from a
 * stable hash of the SSID so it holds position between refreshes, colour from the
 * authentication algorithm. Paired / known Bluetooth devices (bluetoothapis
 * BluetoothFindFirstRadio / BluetoothFindFirstDevice — synchronous, no callbacks)
 * ride a SECONDARY outer ring, glyphed by device class — these are shown as
 * proximity-by-class, NOT a fake BLE signal. A rotating HLSL sweep beam paints each
 * contact as it passes its bearing (angular-delta ping + slow phosphor decay), over
 * concentric range rings, radial spokes and a CRT vignette. SSID / device labels are
 * drawn on top with GDI TextOutW. Nothing is precomputed: the rings + sweep are one
 * fullscreen pixel shader, the blips are additive expanded quads pulled from a
 * StructuredBuffer by SV_VertexID, all JIT-compiled at launch onto your real GPU.
 *
 * Pipeline (each frame): pump → (every ~2.5 s) re-query WLAN + BT, hash bearings,
 * retarget blips → pass 1 fullscreen PS draws rings/spokes/sweep into the back buffer
 * → pass 2 additive quad blips from a StructuredBuffer SRV brighten as the beam paints
 * them → Present → GDI labels.
 *
 * @bun-win32 / engine APIs: _gpu.ts createWindow/createDevice/compile/makeVertex
 * Shader/makePixelShader/makeConstantBuffer/updateConstantBuffer/makeStructuredBuffer/
 * vsSet/vsSetShaderResources/psSet/setRenderTargets/setViewport/clear/drawFullscreen
 * Triangle/makeAdditiveBlendState/setBlendState/vcall/comRelease/blobRelease — plus
 * wlanapi (WlanOpenHandle/EnumInterfaces/GetAvailableNetworkList/FreeMemory/CloseHandle),
 * bluetoothapis (BluetoothFind*Radio/Device), GDI32 CreateFontW/TextOutW + User32 GetDC.
 *
 * Run: bun run packages/all/example/rf-radar.ts
 */

import { FFIType, type Pointer, read, toArrayBuffer } from 'bun:ffi';

import { resolve } from 'node:path';
import { mkdirSync } from 'node:fs';

import { BluetoothApis, GDI32, User32, Wlanapi } from '../index';

import * as gpu from './_gpu';
import * as hud from './_hud';
import { captureBackBuffer, formatGrid } from './_snapshot';

// ── WLAN struct geometry (proven in wlanapi/example/signal-monitor.ts) ─────────
const NETWORK_ENTRY_SIZE = 628;
const INTERFACE_ENTRY_SIZE = 532;
const CONNECTED_FLAG = 0x0000_0001;
const WLAN_API_VERSION_2_0 = 0x0000_0002;

// ── Tunables ───────────────────────────────────────────────────────────────────
const MAX_BLIPS = 256; // hard cap on the StructuredBuffer
const REFRESH_MS = 2500; // how often we re-query the RF environment
const SWEEP_SPEED = 0.9; // radians / second
const TRANSPARENT_BK = 1;

// Auth-algorithm → [name, BGR colour] (auth values from signal-monitor.ts).
const authInfo = new Map<number, [string, number]>([
  [0x01, ['Open', 0x00b0b0b0]],
  [0x02, ['Shared', 0x00b0b0b0]],
  [0x03, ['WPA-Ent', 0x0040c0ff]],
  [0x04, ['WPA-PSK', 0x0040c0ff]],
  [0x06, ['WPA2-Ent', 0x0040ff80]],
  [0x07, ['WPA2-PSK', 0x0040ff80]],
  [0x08, ['WPA3-192', 0x00ffd040]],
  [0x09, ['WPA3-SAE', 0x00ffd040]],
  [0x0a, ['OWE', 0x00ffd040]],
  [0x0b, ['WPA3-Ent', 0x00ffd040]],
]);

// Auth → RGB tint for the GPU blip (kind index → colour, matched in HLSL).
// 0 = open/unknown, 1 = WPA/WPA2-personal, 2 = enterprise, 3 = WPA3, 4 = Bluetooth.
function authKind(auth: number): number {
  switch (auth) {
    case 0x01:
    case 0x02:
      return 0;
    case 0x04:
    case 0x07:
      return 1;
    case 0x03:
    case 0x06:
    case 0x0b:
      return 2;
    case 0x08:
    case 0x09:
    case 0x0a:
      return 3;
    default:
      return 1;
  }
}

const btClassNames = new Map<number, string>([
  [1, 'PC'],
  [2, 'Phone'],
  [3, 'Net'],
  [4, 'Audio'],
  [5, 'HID'],
  [6, 'Imaging'],
  [7, 'Wear'],
  [8, 'Toy'],
  [9, 'Health'],
]);

// ── Helpers ──────────────────────────────────────────────────────────────────
function readSsid(buf: Buffer, offset: number): string {
  const len = buf.readUInt32LE(offset);
  if (len === 0) return '<hidden>';
  return Buffer.from(buf.subarray(offset + 4, offset + 4 + len)).toString('utf8');
}

function readWide(buf: Buffer, offset: number, maxChars: number): string {
  return buf.toString('utf16le', offset, offset + maxChars * 2).replace(/\0.*$/, '');
}

// Deterministic 0..1 hash of a string → stable bearing across refreshes.
function hashAngle(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return (h % 100000) / 100000;
}

// ── Contact model ──────────────────────────────────────────────────────────────
interface Contact {
  id: string; // stable key (SSID / BT address)
  label: string;
  kind: number; // 0..3 WiFi auth, 4 = Bluetooth
  quality: number; // 0..100 (WiFi) or class-derived (BT)
  isBT: boolean;
  // Target polar position (computed at refresh); blips glide toward it.
  targetR: number; // normalized 0..1 radius
  targetA: number; // bearing radians
  // Smoothed live position.
  r: number;
  a: number;
}

const contacts = new Map<string, Contact>();

// ── WLAN session (degrade gracefully if absent) ────────────────────────────────
let wlanHandle = 0n;
let wlanOk = false;
{
  const negVer = Buffer.alloc(4);
  const handleBuf = Buffer.alloc(8);
  const st = Wlanapi.WlanOpenHandle(WLAN_API_VERSION_2_0, null, negVer.ptr, handleBuf.ptr);
  if (st === 0) {
    wlanHandle = handleBuf.readBigUInt64LE(0);
    wlanOk = true;
  } else {
    console.warn(`WlanOpenHandle failed (status ${st}); radar will run without WiFi.`);
  }
}

// Re-query the OS-cached available-network list (no scan wait — notification-based).
function refreshWifi(): number {
  if (!wlanOk) return 0;
  let found = 0;
  const ifListPtrBuf = Buffer.alloc(8);
  if (Wlanapi.WlanEnumInterfaces(wlanHandle, null, ifListPtrBuf.ptr) !== 0) return 0;
  const ifListPtr = read.ptr(ifListPtrBuf.ptr) as Pointer;
  if (!ifListPtr) return 0;
  try {
    const ifCount = Buffer.from(toArrayBuffer(ifListPtr, 0, 8)).readUInt32LE(0);
    for (let iIdx = 0; iIdx < ifCount; iIdx += 1) {
      const ifPtr = (Number(ifListPtr) + 8 + iIdx * INTERFACE_ENTRY_SIZE) as Pointer;
      // Nudge a background re-scan (fire-and-forget; never wait on completion).
      Wlanapi.WlanScan(wlanHandle, ifPtr, null, null, null);

      const netListPtrBuf = Buffer.alloc(8);
      if (Wlanapi.WlanGetAvailableNetworkList(wlanHandle, ifPtr, 0, null, netListPtrBuf.ptr) !== 0) continue;
      const netListPtr = read.ptr(netListPtrBuf.ptr) as Pointer;
      if (!netListPtr) continue;
      try {
        const netCount = Buffer.from(toArrayBuffer(netListPtr, 0, 8)).readUInt32LE(0);
        for (let n = 0; n < netCount; n += 1) {
          const netPtr = (Number(netListPtr) + 8 + n * NETWORK_ENTRY_SIZE) as Pointer;
          const nb = Buffer.from(toArrayBuffer(netPtr, 0, NETWORK_ENTRY_SIZE));
          const ssid = readSsid(nb, 512);
          const signal = nb.readUInt32LE(604); // 0..100 signal quality
          const auth = nb.readUInt32LE(612);
          const flags = nb.readUInt32LE(620);
          const connected = (flags & CONNECTED_FLAG) !== 0;
          // Dedup by SSID+auth so two-radio listings collapse; connected wins on signal.
          const key = `w:${ssid}:${auth}`;
          const kind = authKind(auth);
          const prev = contacts.get(key);
          const quality = prev && prev.isBT === false ? Math.max(prev.quality, signal) : signal;
          const label = connected ? `${ssid} *` : ssid;
          updateContact(key, label, kind, quality, false);
          found += 1;
        }
      } finally {
        Wlanapi.WlanFreeMemory(netListPtr);
      }
    }
  } finally {
    Wlanapi.WlanFreeMemory(ifListPtr);
  }
  return found;
}

// Enumerate paired / known Bluetooth devices (synchronous, fIssueInquiry = 0).
function refreshBluetooth(): number {
  let found = 0;
  const findRadioParams = Buffer.alloc(4);
  findRadioParams.writeUInt32LE(4, 0);
  const hRadioOut = Buffer.alloc(8);
  const hFind = BluetoothApis.BluetoothFindFirstRadio(findRadioParams.ptr, hRadioOut.ptr);
  if (hFind === 0n) return 0;
  const radios: bigint[] = [hRadioOut.readBigUInt64LE(0)];
  while (BluetoothApis.BluetoothFindNextRadio(hFind, hRadioOut.ptr)) radios.push(hRadioOut.readBigUInt64LE(0));
  BluetoothApis.BluetoothFindRadioClose(hFind);

  for (const hRadio of radios) {
    const searchParams = Buffer.alloc(40);
    searchParams.writeUInt32LE(40, 0); // dwSize
    searchParams.writeInt32LE(1, 8); // fReturnAuthenticated
    searchParams.writeInt32LE(1, 12); // fReturnRemembered
    searchParams.writeInt32LE(1, 16); // fReturnUnknown
    searchParams.writeInt32LE(1, 20); // fReturnConnected
    searchParams.writeInt32LE(0, 24); // fIssueInquiry = 0 (no blocking live scan, no RSSI anyway)
    searchParams.writeUInt8(0, 28); // cTimeoutMultiplier
    searchParams.writeBigUInt64LE(hRadio, 32); // hRadio

    const devInfo = Buffer.alloc(560);
    devInfo.writeUInt32LE(560, 0);
    const hDevFind = BluetoothApis.BluetoothFindFirstDevice(searchParams.ptr, devInfo.ptr);
    if (hDevFind === 0n) continue;
    do {
      const addr = Array.from(devInfo.subarray(8, 14)).reverse().map((b) => b.toString(16).padStart(2, '0')).join(':');
      const classOfDevice = devInfo.readUInt32LE(16);
      const connected = devInfo.readInt32LE(20) !== 0;
      const name = readWide(devInfo, 64, 248) || '(unnamed)';
      const major = (classOfDevice >> 8) & 0x1f;
      const className = btClassNames.get(major) ?? 'BT';
      // BT has NO live signal — place on the outer ring; connected sits slightly inward.
      const quality = connected ? 28 : 10;
      const key = `b:${addr}`;
      updateContact(key, `${name} [${className}]`, 4, quality, true);
      found += 1;
      devInfo.writeUInt32LE(560, 0);
    } while (BluetoothApis.BluetoothFindNextDevice(hDevFind, devInfo.ptr));
    BluetoothApis.BluetoothFindDeviceClose(hDevFind);
  }
  return found;
}

// Map a contact's quality + id into a target polar position and (re)register it.
function updateContact(id: string, label: string, kind: number, quality: number, isBT: boolean): void {
  // Strong signal → near centre; weak → outer edge. WiFi spans 0.18..0.92.
  // BT lives on a reserved outer band 0.80..0.96 so it reads as a secondary ring.
  let targetR: number;
  if (isBT) {
    targetR = 0.96 - (Math.min(quality, 40) / 40) * 0.16; // 0.80..0.96
  } else {
    targetR = 0.92 - (Math.max(0, Math.min(100, quality)) / 100) * 0.74; // 0.18..0.92
  }
  const targetA = hashAngle(id) * Math.PI * 2;
  const existing = contacts.get(id);
  if (existing) {
    existing.label = label;
    existing.kind = kind;
    existing.quality = quality;
    existing.targetR = targetR;
    existing.targetA = targetA;
    existing.isBT = isBT;
  } else {
    contacts.set(id, { id, label, kind, quality, isBT, targetR, targetA, r: targetR, a: targetA });
  }
}

// ── A modest, near-square window (the radar disk fills it) — not the whole desktop ──
const SM_CXSCREEN = 0;
const SM_CYSCREEN = 1;
const screenW = User32.GetSystemMetrics(SM_CXSCREEN) || 1920;
const screenH = User32.GetSystemMetrics(SM_CYSCREEN) || 1080;
const HEIGHT = Math.min(1080, Math.floor(screenH * 0.8));
const WIDTH = Math.min(Math.floor(screenW * 0.85), Math.round(HEIGHT * 1.2));

const win = gpu.createWindow({ title: 'RF Radar', width: WIDTH, height: HEIGHT, borderless: true });
const { w: cw, h: ch } = win.clientSize();
const g = gpu.createDevice(win.hwnd, { width: cw, height: ch });

// Radar geometry (pixels). Square disk centred on screen.
const cx = cw / 2;
const cy = ch / 2;
const radarRadiusPx = Math.min(cw, ch) * 0.46;

// ── HLSL: fullscreen radar grid + sweep ─────────────────────────────────────────
const VS_FS = `
struct VSOut { float4 pos : SV_Position; float2 uv : TEXCOORD0; };
VSOut main(uint vid : SV_VertexID) {
  VSOut o; float2 p = float2((vid << 1) & 2, vid & 2);
  o.uv = p; o.pos = float4(p * float2(2.0,-2.0) + float2(-1.0,1.0), 0.0, 1.0); return o;
}`;

const PS_GRID = `
cbuffer Frame : register(b0) {
  float2 iRes;       // screen pixels
  float2 iCenter;    // radar centre (px)
  float  iRadius;    // radar radius (px)
  float  iTime;      // seconds
  float  iSweep;     // sweep bearing (radians)
  float  iPad;
};

float4 main(float4 fragPos : SV_Position, float2 uv : TEXCOORD0) : SV_Target {
  float2 d = fragPos.xy - iCenter;
  float dist = length(d);
  float rN = dist / iRadius;                 // 0 at centre, 1 at rim
  float ang = atan2(d.y, d.x);               // -pi..pi

  // Deep CRT background with a faint green wash inside the disk.
  float3 col = float3(0.01, 0.02, 0.015);
  float inDisk = smoothstep(1.02, 0.99, rN);
  col += float3(0.0, 0.05, 0.025) * inDisk;

  // Faint tactical grid across the whole canvas (so the ultrawide flanks read as a scope).
  float2 gpx = fragPos.xy / 64.0;
  float2 gl = abs(frac(gpx) - 0.5);
  float gridLine = smoothstep(0.49, 0.5, max(gl.x, gl.y));
  col += float3(0.02, 0.07, 0.05) * gridLine;

  // Concentric range rings every 0.2 of the radius.
  float ringPhase = frac(rN * 5.0);
  float ring = smoothstep(0.06, 0.0, min(ringPhase, 1.0 - ringPhase)) * inDisk;
  col += float3(0.10, 0.55, 0.30) * ring * (rN < 1.0 ? 1.0 : 0.0);

  // Outer rim.
  col += float3(0.20, 0.95, 0.55) * smoothstep(0.012, 0.0, abs(rN - 1.0));

  // Radial spokes every 30 degrees.
  float spoke = abs(frac(ang / (3.14159265 / 6.0) + 0.5) - 0.5) * 2.0;
  col += float3(0.05, 0.35, 0.20) * smoothstep(0.04, 0.0, spoke) * inDisk * 0.8;

  // Rotating sweep beam with phosphor afterglow trailing BEHIND the leading edge.
  float rel = ang - iSweep;                  // signed angle behind the beam
  rel = rel - 6.2831853 * floor(rel / 6.2831853 + 0.5); // wrap to -pi..pi
  // Trail occupies negative rel (the beam moves toward +rel); fade with distance.
  float trail = (rel <= 0.0) ? exp(rel * 1.7) : 0.0;   // 1 at the edge → fades around
  float beam = exp(-rel * rel * 900.0);                 // crisp leading edge glow
  col += float3(0.10, 1.0, 0.45) * (trail * 0.55 + beam * 0.9) * inDisk;

  // Centre hub.
  col += float3(0.3, 1.0, 0.6) * smoothstep(0.012, 0.0, rN) * 1.5;

  // Scanlines + vignette for the CRT feel.
  col *= 0.85 + 0.15 * sin(fragPos.y * 1.6 + iTime * 1.5);
  float vig = smoothstep(1.4, 0.2, length((fragPos.xy / iRes) - 0.5) * 2.0);
  col *= lerp(0.45, 1.0, vig);

  return float4(col, 1.0);
}`;

// ── HLSL: additive blip quads (expanded from a StructuredBuffer by SV_VertexID) ──
const BLIP_STRIDE = 32; // float2 ndc, float r01, float kind, float quality, float bearing, float2 pad
const PS_BLIP_VS = `
struct Blip { float2 ndc; float r01; float kind; float quality; float bearing; float2 pad; };
StructuredBuffer<Blip> Blips : register(t0);

cbuffer Frame : register(b0) {
  float2 iRes;
  float2 iCenter;
  float  iRadius;
  float  iTime;
  float  iSweep;
  float  iPad;
};

struct VSOut {
  float4 pos    : SV_Position;
  float2 local  : TEXCOORD0;   // -1..1 quad coords
  float3 color  : COLOR0;
  float  paint  : COLOR1;       // 0..1 sweep-paint brightness
};

float3 kindColor(float k) {
  if (k < 0.5) return float3(0.75, 0.78, 0.80);  // open / unknown
  if (k < 1.5) return float3(0.30, 1.00, 0.55);  // WPA/WPA2 personal (green)
  if (k < 2.5) return float3(1.00, 0.70, 0.25);  // enterprise (amber)
  if (k < 3.5) return float3(1.00, 0.85, 0.30);  // WPA3 (gold)
  return float3(0.45, 0.75, 1.00);               // bluetooth (blue)
}

VSOut main(uint vid : SV_VertexID) {
  uint bid = vid / 6u;
  uint corner = vid % 6u;
  Blip b = Blips[bid];

  // Quad EXTENT in pixels = the full soft halo; the bright core lives in the
  // inner ~30%. Strong WiFi → big bright contact, weak → small. BT glyphs fixed.
  float coreRadius = lerp(14.0, 34.0, saturate(b.quality / 100.0));
  if (b.kind > 3.5) coreRadius = 20.0;
  float haloPx = coreRadius * 3.2;   // halo quad reaches well beyond the core

  // Two-triangle quad corners in -1..1.
  float2 c[6] = {
    float2(-1,-1), float2( 1,-1), float2(-1, 1),
    float2(-1, 1), float2( 1,-1), float2( 1, 1)
  };
  float2 q = c[corner];

  // Blip centre in pixels from its polar position.
  float2 centerPx = iCenter + b.ndc * iRadius;
  float2 px = centerPx + q * haloPx;

  VSOut o;
  o.pos = float4((px / iRes) * float2(2.0,-2.0) + float2(-1.0,1.0), 0.0, 1.0);
  o.local = q;
  o.color = kindColor(b.kind);

  // Sweep paint: how recently the beam crossed this blip's bearing.
  float rel = b.bearing - iSweep;
  rel = rel - 6.2831853 * floor(rel / 6.2831853 + 0.5);
  // Brightest right after the beam passes (rel slightly negative), decays around.
  float paint = (rel <= 0.05) ? exp(rel * 1.4) : exp(-rel * 8.0);
  o.paint = paint;
  return o;
}`;

const PS_BLIP_PS = `
struct VSOut {
  float4 pos    : SV_Position;
  float2 local  : TEXCOORD0;
  float3 color  : COLOR0;
  float  paint  : COLOR1;
};

float4 main(VSOut i) : SV_Target {
  float d = length(i.local);
  if (d > 1.0) discard;

  // The quad spans the full halo; the core occupies the inner ~31% (haloPx=3.2x core).
  const float coreEdge = 0.31;

  // Soft additive halo across the whole quad — gives the blip a glowing aura.
  float halo = pow(saturate(1.0 - d), 3.0);

  // Bright solid-ish core with a hot centre.
  float core = smoothstep(coreEdge, coreEdge * 0.35, d);
  float hot  = smoothstep(coreEdge * 0.5, 0.0, d);

  // A crisp luminous ring right at the core edge — makes the contact "pop".
  float ring = smoothstep(0.05, 0.0, abs(d - coreEdge));

  // Always clearly lit; flares hard as the sweep beam paints it.
  float bright = 0.85 + 1.6 * i.paint;

  float3 c = i.color * bright * (halo * 1.1 + core * 2.0 + ring * 1.3) + float3(1.0,1.0,1.0) * hot * (0.6 + 0.9 * i.paint);
  return float4(c, 1.0);                      // additive blend
}`;

// ── Compile + create shaders ────────────────────────────────────────────────────
let vsFs = 0n;
let psGrid = 0n;
let vsBlip = 0n;
let psBlip = 0n;
let vsFsCode: gpu.CompiledShader;
let gridCode: gpu.CompiledShader;
let blipVsCode: gpu.CompiledShader;
let blipPsCode: gpu.CompiledShader;
try {
  vsFsCode = gpu.compile(VS_FS, 'main', 'vs_5_0');
  gridCode = gpu.compile(PS_GRID, 'main', 'ps_5_0');
  blipVsCode = gpu.compile(PS_BLIP_VS, 'main', 'vs_5_0');
  blipPsCode = gpu.compile(PS_BLIP_PS, 'main', 'ps_5_0');
  vsFs = gpu.makeVertexShader(vsFsCode);
  psGrid = gpu.makePixelShader(gridCode);
  vsBlip = gpu.makeVertexShader(blipVsCode);
  psBlip = gpu.makePixelShader(blipPsCode);
} catch (err) {
  console.error(String((err as Error).message));
  process.exit(1);
}

// Constant buffer: float2 iRes, float2 iCenter, float iRadius, float iTime, float iSweep, float iPad = 32 bytes.
const CB_SIZE = 32;
const cb = gpu.makeConstantBuffer(CB_SIZE);
const cbData = Buffer.alloc(CB_SIZE);

// Blip StructuredBuffer (CPU-writable so we re-upload each frame as positions glide).
const blipData = Buffer.alloc(MAX_BLIPS * BLIP_STRIDE);
const blipBuf = gpu.makeStructuredBuffer({ stride: BLIP_STRIDE, count: MAX_BLIPS, srv: true, cpuWritable: true });

const additive = gpu.makeAdditiveBlendState(true);

// GDI label font.
const labelFont = GDI32.CreateFontW(-15, 0, 0, 0, 600, 0, 0, 0, 0, 0, 0, 4, 0, Buffer.from('Consolas\0', 'utf16le').ptr!);
const hudFont = GDI32.CreateFontW(-18, 0, 0, 0, 700, 0, 0, 0, 0, 0, 0, 4, 0, Buffer.from('Consolas\0', 'utf16le').ptr!);

const wifiCount0 = refreshWifi();
const btCount0 = refreshBluetooth();

console.log(`RF Radar — live WiFi + paired Bluetooth swept on the GPU (${g.driver}, ${g.gpuName}).`);
console.log(`  WLAN: ${wlanOk ? 'open' : 'unavailable'} · ${wifiCount0} AP record(s) · ${btCount0} BT device(s) · ESC to exit.`);

// ── Teardown ─────────────────────────────────────────────────────────────────
let cleanedUp = false;
function cleanup(code: number): never {
  if (!cleanedUp) {
    cleanedUp = true;
    hud.release();
    GDI32.DeleteObject(hudFont);
    GDI32.DeleteObject(labelFont);
    gpu.comRelease(additive);
    if (blipBuf.srv) gpu.comRelease(blipBuf.srv);
    gpu.comRelease(blipBuf.buffer);
    gpu.comRelease(cb);
    gpu.comRelease(psBlip);
    gpu.comRelease(vsBlip);
    gpu.comRelease(psGrid);
    gpu.comRelease(vsFs);
    gpu.blobRelease(blipPsCode.blob);
    gpu.blobRelease(blipVsCode.blob);
    gpu.blobRelease(gridCode.blob);
    gpu.blobRelease(vsFsCode.blob);
    gpu.comRelease(g.backBufferRTV);
    gpu.comRelease(g.swapChain);
    gpu.comRelease(g.context);
    gpu.comRelease(g.device);
    win.destroy();
    if (wlanOk) Wlanapi.WlanCloseHandle(wlanHandle, null);
  }
  process.exit(code);
}
process.on('SIGINT', () => cleanup(0));

// ── Render loop ──────────────────────────────────────────────────────────────
const startTime = performance.now();
const durationMs = process.env.DEMO_DURATION_MS ? Number(process.env.DEMO_DURATION_MS) : 0;
const selfCheck = process.env.SELFCHECK === '1';
const selfShot = process.env.SELFSHOT === '1';
let lastNow = startTime;
// Refresh quickly at first (the OS cache is often cold on the very first query),
// then settle into the steady REFRESH_MS cadence.
let lastRefresh = startTime - REFRESH_MS + 500;
let earlyRefreshes = 0;
let sweep = 0;
let frames = 0;
let fps = 0;
let fpsWindowStart = startTime;

const emptyBind = Buffer.alloc(8);
let loopFrames = 0;

// Build a 16-byte little-endian GUID (mixed-endian MS layout) for IID out-params.
function guidBytes(value: string): Buffer {
  const m = /^([0-9a-f]{8})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{12})$/i.exec(value);
  if (m === null) throw new Error(`Invalid GUID: ${value}`);
  const [, d1, d2, d3, d4Hi, d4Lo] = m;
  const buf = Buffer.alloc(16);
  buf.writeUInt32LE(parseInt(d1!, 16), 0);
  buf.writeUInt16LE(parseInt(d2!, 16), 4);
  buf.writeUInt16LE(parseInt(d3!, 16), 6);
  const data4 = `${d4Hi}${d4Lo}`;
  for (let i = 0; i < 8; i += 1) buf[8 + i] = parseInt(data4.slice(i * 2, i * 2 + 2), 16);
  return buf;
}

function drawLabels(): void {
  // Composite the GDI HUD INTO the back buffer (flicker-free) via the shared helper.
  // `dc` is a memory DC sized to (cw, ch), so all window pixel coords are unchanged.
  hud.draw(g, cw, ch, (dc) => {
    const prevFont = GDI32.SelectObject(dc, labelFont);
    GDI32.SetBkMode(dc, TRANSPARENT_BK);
    // Draw a label per contact, offset clear of its (now larger) glowing blip.
    for (const c of contacts.values()) {
      const px = cx + Math.cos(c.a) * c.r * radarRadiusPx;
      const py = cy + Math.sin(c.a) * c.r * radarRadiusPx;
      // Blip glow extent in px ≈ core(14..34, BT 20) so push the label past it.
      const coreR = c.isBT ? 20 : 14 + 20 * Math.max(0, Math.min(1, c.quality / 100));
      const offset = coreR + 12;
      // Bias the label to the side of the bearing that points away from centre,
      // and keep it on-screen.
      const dirX = Math.cos(c.a);
      const dirY = Math.sin(c.a);
      let lx = Math.round(px + dirX * offset + (dirX >= 0 ? 4 : -4));
      let ly = Math.round(py + dirY * offset - 8);
      // SSID + live signal so the contact reads at a glance.
      const name = c.label.length > 18 ? `${c.label.slice(0, 17)}…` : c.label;
      const txt = c.isBT ? name : `${name}  ${Math.round(c.quality)}%`;
      if (lx < 6) lx = 6;
      if (lx > cw - 220) lx = cw - 220;
      if (ly < 6) ly = 6;
      if (ly > ch - 24) ly = ch - 24;
      const buf = Buffer.from(`${txt}\0`, 'utf16le');
      const len = txt.length;
      // Stronger drop shadow (two offsets) so labels stay legible over the glow.
      GDI32.SetTextColor(dc, 0x00000000);
      GDI32.TextOutW(dc, lx + 1, ly + 1, buf.ptr!, len);
      GDI32.TextOutW(dc, lx + 2, ly + 2, buf.ptr!, len);
      let col = 0x0080ffb0; // default bright green (BGR)
      if (c.isBT) col = 0x00ffb060;
      else if (c.kind === 2) col = 0x0050c0ff; // enterprise amber
      else if (c.kind === 3) col = 0x0060e0ff; // WPA3 gold
      GDI32.SetTextColor(dc, col);
      GDI32.TextOutW(dc, lx, ly, buf.ptr!, len);
    }
    // HUD line.
    GDI32.SelectObject(dc, hudFont);
    let wifiN = 0;
    let btN = 0;
    for (const c of contacts.values()) (c.isBT ? (btN += 1) : (wifiN += 1));
    const hudLine = wlanOk
      ? `RF RADAR · ${wifiN} WiFi AP · ${btN} BT · ${fps} fps · ${g.gpuName}`
      : `RF RADAR · NO WLAN ADAPTER · ${btN} BT · ${fps} fps`;
    const hbuf = Buffer.from(`${hudLine}\0`, 'utf16le');
    GDI32.SetTextColor(dc, 0x00000000);
    GDI32.TextOutW(dc, 25, 25, hbuf.ptr!, hudLine.length);
    GDI32.SetTextColor(dc, 0x0060ff90);
    GDI32.TextOutW(dc, 24, 24, hbuf.ptr!, hudLine.length);
    GDI32.SelectObject(dc, prevFont);
  });
}

while (!win.shouldClose()) {
  win.pump();
  if (win.shouldClose()) break;

  const now = performance.now();
  const dt = Math.min(0.05, (now - lastNow) / 1000);
  lastNow = now;
  const elapsed = (now - startTime) / 1000;

  // Re-query the RF environment on a cadence (never every frame). The first few
  // refreshes come fast (~600 ms apart) because the OS available-network cache is
  // frequently sparse on the very first read until the background scan lands.
  const cadence = earlyRefreshes < 4 ? 600 : REFRESH_MS;
  if (now - lastRefresh >= cadence) {
    lastRefresh = now;
    earlyRefreshes += 1;
    refreshWifi();
    refreshBluetooth();
  }

  // Advance the sweep.
  sweep = (sweep + dt * SWEEP_SPEED) % (Math.PI * 2);

  // Glide blips toward their target polar positions (shortest angular path).
  for (const c of contacts.values()) {
    const k = Math.min(1, dt * 4);
    c.r += (c.targetR - c.r) * k;
    let da = c.targetA - c.a;
    da -= Math.PI * 2 * Math.floor(da / (Math.PI * 2) + 0.5);
    c.a += da * k;
  }

  // ── Build the blip StructuredBuffer immediately before the consuming draw ─────
  let n = 0;
  blipData.fill(0);
  for (const c of contacts.values()) {
    if (n >= MAX_BLIPS) break;
    const ndcX = Math.cos(c.a) * c.r;
    const ndcY = Math.sin(c.a) * c.r;
    const o = n * BLIP_STRIDE;
    blipData.writeFloatLE(ndcX, o + 0);
    blipData.writeFloatLE(ndcY, o + 4);
    blipData.writeFloatLE(c.r, o + 8);
    blipData.writeFloatLE(c.kind, o + 12);
    blipData.writeFloatLE(c.quality, o + 16);
    blipData.writeFloatLE(c.a, o + 20);
    blipData.writeFloatLE(0, o + 24);
    blipData.writeFloatLE(0, o + 28);
    n += 1;
  }
  gpu.updateDynamicBuffer(blipBuf.buffer, blipData);

  // Constant buffer (packed right before the calls that read it).
  cbData.writeFloatLE(cw, 0);
  cbData.writeFloatLE(ch, 4);
  cbData.writeFloatLE(cx, 8);
  cbData.writeFloatLE(cy, 12);
  cbData.writeFloatLE(radarRadiusPx, 16);
  cbData.writeFloatLE(elapsed, 20);
  cbData.writeFloatLE(sweep, 24);
  cbData.writeFloatLE(0, 28);
  gpu.updateConstantBuffer(cb, cbData);

  // Pass 1: radar grid + sweep into the back buffer.
  gpu.setRenderTargets([g.backBufferRTV]);
  gpu.setViewport(cw, ch);
  gpu.clear(g.backBufferRTV, [0, 0, 0, 1]);
  gpu.setBlendState(0n); // opaque
  gpu.vsSet(vsFs, [cb]);
  gpu.psSet(psGrid, { cb: [cb] });
  gpu.drawFullscreenTriangle();

  // Pass 2: additive blips (quads pulled from the StructuredBuffer SRV).
  if (n > 0) {
    gpu.setBlendState(additive);
    gpu.vsSet(vsBlip, [cb]);
    gpu.vsSetShaderResources([blipBuf.srv!]);
    gpu.psSet(psBlip, { cb: [cb] });
    // 6 verts per blip quad, TRIANGLELIST.
    gpu.vcall(g.context, gpu.CTX_IA_SET_PRIMITIVE_TOPOLOGY, [FFIType.u32], [4 /* TRIANGLELIST */], FFIType.void);
    gpu.vcall(g.context, gpu.CTX_DRAW, [FFIType.u32, FFIType.u32], [n * 6, 0], FFIType.void);
    // Unbind the VS SRV so it never lingers.
    gpu.vcall(g.context, gpu.CTX_VS_SET_SHADER_RESOURCES, [FFIType.u32, FFIType.u32, FFIType.ptr], [0, 1, emptyBind.ptr!], FFIType.void);
  }

  // Composite the GDI HUD/labels INTO the back buffer (BEFORE present, so it never
  // flickers and shows up in back-buffer captures).
  drawLabels();

  // SELFSHOT: capture the GPU back buffer on the final frame, BEFORE present().
  const lastFrame = durationMs > 0 && now - startTime >= durationMs;
  if (selfShot && (lastFrame || loopFrames >= 90)) {
    const shotDir = resolve(import.meta.dir, '..', 'screenshots');
    mkdirSync(shotDir, { recursive: true });
    const shotPath = process.env.SELFSHOT_PATH || resolve(shotDir, 'rf-radar.selfcheck.png');
    const stats = captureBackBuffer(g, shotPath, { gridW: 48, gridH: 24 });
    console.log(formatGrid(stats));
    console.log(`[shot] ok=${stats.ok} nonBlackPct=${(stats.nonBlackFrac * 100).toFixed(2)} meanLuma=${(stats.meanLuma * 255).toFixed(2)} -> ${stats.path}`);
    g.present(false);
    cleanup(0);
  }

  g.present(false);

  frames += 1;
  loopFrames += 1;
  if (now - fpsWindowStart >= 500) {
    fps = Math.round((frames * 1000) / (now - fpsWindowStart));
    frames = 0;
    fpsWindowStart = now;
  }

  // ── Self-check: read back the swapchain back buffer, compute pixel stats ──────
  if (selfCheck && elapsed > 1.0 && loopFrames >= 60) {
    runSelfCheck();
    cleanup(0);
  }

  if (durationMs > 0 && now - startTime >= durationMs) break;
}

cleanup(0);

// ── Back-buffer readback + 2D pixel statistics (Route B) ─────────────────────────
function runSelfCheck(): void {
  // Two frames ~150ms apart to prove the sweep advances; capture sector brightness.
  const first = grabSectorProfile();
  const t0 = performance.now();
  while (performance.now() - t0 < 160) {
    win.pump();
    const elapsed = (performance.now() - startTime) / 1000;
    sweep = (sweep + 0.016 * SWEEP_SPEED) % (Math.PI * 2);
    cbData.writeFloatLE(cw, 0);
    cbData.writeFloatLE(ch, 4);
    cbData.writeFloatLE(cx, 8);
    cbData.writeFloatLE(cy, 12);
    cbData.writeFloatLE(radarRadiusPx, 16);
    cbData.writeFloatLE(elapsed, 20);
    cbData.writeFloatLE(sweep, 24);
    cbData.writeFloatLE(0, 28);
    gpu.updateConstantBuffer(cb, cbData);
    gpu.setRenderTargets([g.backBufferRTV]);
    gpu.setViewport(cw, ch);
    gpu.clear(g.backBufferRTV, [0, 0, 0, 1]);
    gpu.setBlendState(0n);
    gpu.vsSet(vsFs, [cb]);
    gpu.psSet(psGrid, { cb: [cb] });
    gpu.drawFullscreenTriangle();
    if (countContacts() > 0) {
      gpu.setBlendState(additive);
      gpu.vsSet(vsBlip, [cb]);
      gpu.vsSetShaderResources([blipBuf.srv!]);
      gpu.psSet(psBlip, { cb: [cb] });
      const nn = countContacts();
      gpu.vcall(g.context, gpu.CTX_IA_SET_PRIMITIVE_TOPOLOGY, [FFIType.u32], [4], FFIType.void);
      gpu.vcall(g.context, gpu.CTX_DRAW, [FFIType.u32, FFIType.u32], [Math.min(nn, MAX_BLIPS) * 6, 0], FFIType.void);
      gpu.vcall(g.context, gpu.CTX_VS_SET_SHADER_RESOURCES, [FFIType.u32, FFIType.u32, FFIType.ptr], [0, 1, emptyBind.ptr!], FFIType.void);
    }
    g.present(false);
  }
  const second = grabSectorProfile();

  const sweepAdvanced = first.brightestSector !== second.brightestSector || Math.abs(first.sectorMaxAngle - second.sectorMaxAngle) > 1e-6;

  const stats = {
    w: cw,
    h: ch,
    nonBlackPct: +second.nonBlackPct.toFixed(2),
    meanLuma: +second.meanLuma.toFixed(2),
    distinctColors: second.distinctColors,
    radialRingPeaks: second.radialRingPeaks, // bright peaks along a radius → concentric rings
    radialProfileVar: +second.radialProfileVar.toFixed(2),
    brightestSectorA: first.brightestSector,
    brightestSectorB: second.brightestSector,
    sweepAdvanced,
    contacts: countContacts(),
  };
  console.log('SELFCHECK_STATS ' + JSON.stringify(stats));
}

function countContacts(): number {
  return contacts.size;
}

interface SectorProfile {
  nonBlackPct: number;
  meanLuma: number;
  distinctColors: number;
  radialRingPeaks: number;
  radialProfileVar: number;
  brightestSector: number;
  sectorMaxAngle: number;
}

function grabSectorProfile(): SectorProfile {
  // Acquire the swapchain back buffer.
  const ppBack = Buffer.alloc(8);
  const iid = guidBytes('6f15aaf2-d208-4e89-9ab4-489535d34f9c'); // IID_ID3D11Texture2D
  gpu.vcall(g.swapChain, gpu.SWAP_GET_BUFFER, [FFIType.u32, FFIType.ptr, FFIType.ptr], [0, iid.ptr!, ppBack.ptr!]);
  const backTex = ppBack.readBigUInt64LE(0);

  const staging = gpu.makeTexture({ w: cw, h: ch, format: gpu.DXGI_FORMAT_B8G8R8A8_UNORM, staging: true });
  gpu.copyResource(staging.tex, backTex);

  const mapped = Buffer.alloc(16);
  let nonBlack = 0;
  let lumaSum = 0;
  let total = 0;
  const colorSet = new Set<number>();
  const sectorCount = 16;
  const sectorLuma = new Array<number>(sectorCount).fill(0);

  // Radial profile: brightness along a single radius (samples 0..radius), to detect rings.
  const RAD_SAMPLES = 60;
  const radial = new Array<number>(RAD_SAMPLES).fill(0);

  if (gpu.vcall(g.context, gpu.CTX_MAP, [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], [staging.tex, 0, 1 /* D3D11_MAP_READ */, 0, mapped.ptr!]) === 0) {
    const dataPtr = Number(mapped.readBigUInt64LE(0)) as Pointer;
    const rowPitch = mapped.readUInt32LE(8);
    // Subsample the frame on an 8px grid for speed.
    const step = 8;
    for (let py = 0; py < ch; py += step) {
      for (let px = 0; px < cw; px += step) {
        const off = py * rowPitch + px * 4; // BGRA
        const b = read.u8(dataPtr, off + 0);
        const gg = read.u8(dataPtr, off + 1);
        const r = read.u8(dataPtr, off + 2);
        const luma = 0.2126 * r + 0.7152 * gg + 0.0722 * b;
        total += 1;
        lumaSum += luma;
        if (luma > 12) nonBlack += 1;
        // Quantize colour into 5-bit-per-channel buckets.
        colorSet.add(((r >> 3) << 10) | ((gg >> 3) << 5) | (b >> 3));
        // Sector accumulation (angle around centre, inside disk).
        const dx = px - cx;
        const dy = py - cy;
        const dist = Math.hypot(dx, dy);
        if (dist < radarRadiusPx) {
          let ang = Math.atan2(dy, dx);
          if (ang < 0) ang += Math.PI * 2;
          const s = Math.min(sectorCount - 1, Math.floor((ang / (Math.PI * 2)) * sectorCount));
          sectorLuma[s]! += luma;
        }
      }
    }
    // Radial profile sampled straight up from the centre (angle = -pi/2) — crosses every ring.
    for (let i = 0; i < RAD_SAMPLES; i += 1) {
      const rr = (i / (RAD_SAMPLES - 1)) * (radarRadiusPx - 2);
      const sx = Math.round(cx);
      const sy = Math.round(cy - rr);
      if (sx >= 0 && sx < cw && sy >= 0 && sy < ch) {
        const off = sy * rowPitch + sx * 4;
        const b = read.u8(dataPtr, off + 0);
        const gg = read.u8(dataPtr, off + 1);
        const r = read.u8(dataPtr, off + 2);
        radial[i] = 0.2126 * r + 0.7152 * gg + 0.0722 * b;
      }
    }
    gpu.vcall(g.context, gpu.CTX_UNMAP, [FFIType.u64, FFIType.u32], [staging.tex, 0], FFIType.void);
  }

  gpu.comRelease(staging.tex);
  gpu.comRelease(backTex);

  // Brightest sector + its centre angle.
  let brightestSector = 0;
  let maxSec = -1;
  for (let i = 0; i < sectorCount; i += 1) {
    if (sectorLuma[i]! > maxSec) {
      maxSec = sectorLuma[i]!;
      brightestSector = i;
    }
  }
  const sectorMaxAngle = ((brightestSector + 0.5) / sectorCount) * Math.PI * 2;

  // Radial ring peaks: count local maxima above the local mean in the radial profile.
  const radialMean = radial.reduce((a, b) => a + b, 0) / radial.length;
  let ringPeaks = 0;
  for (let i = 2; i < RAD_SAMPLES - 2; i += 1) {
    if (radial[i]! > radialMean * 1.3 && radial[i]! >= radial[i - 1]! && radial[i]! >= radial[i + 1]!) ringPeaks += 1;
  }
  const radialVar = radial.reduce((a, b) => a + (b - radialMean) ** 2, 0) / radial.length;

  return {
    nonBlackPct: total > 0 ? (nonBlack / total) * 100 : 0,
    meanLuma: total > 0 ? lumaSum / total : 0,
    distinctColors: colorSet.size,
    radialRingPeaks: ringPeaks,
    radialProfileVar: Math.sqrt(radialVar),
    brightestSector,
    sectorMaxAngle,
  };
}
