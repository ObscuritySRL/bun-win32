/**
 * webcam — your live camera, post-processed by hand-written HLSL, in pure TypeScript.
 *
 * Opens a borderless fullscreen window and drives the FULL Media Foundation capture
 * COM marathon through Bun FFI on the MAIN thread, synchronously (no callbacks, no
 * worker threads): CoInitializeEx + MFStartup → MFCreateAttributes(VIDCAP) →
 * MFEnumDeviceSources → IMFActivate::ActivateObject(IMFMediaSource) →
 * MFCreateSourceReaderFromMediaSource with MF_SOURCE_READER_ENABLE_VIDEO_PROCESSING=1
 * (lights up the built-in Video Processor MFT so we can demand plain RGB32) →
 * SetCurrentMediaType(RGB32) on the first video stream. Each frame: blocking
 * ReadSample → ConvertToContiguousBuffer → IMFMediaBuffer::Lock → UpdateSubresource
 * the raw bytes straight into a B8G8R8A8 Texture2D → Unlock → Release. A selectable
 * fullscreen pixel shader then mangles the live frame on the GPU: a thermal/predator
 * LUT (the bold default), Sobel edge-glow, ASCII dot-matrix, or a CRT (barrel +
 * scanlines + chroma) — cycle with number keys 1-4 (or SPACE). RGB32 from Media
 * Foundation is delivered BOTTOM-UP (negative-stride DIB convention), so sampleCam()
 * flips v before reading. If no camera is present (or RGB32 is rejected even with the
 * video processor) it degrades to a vivid animated procedural shader clearly labelled
 * "NO CAMERA" so it always renders and screenshots cleanly.
 *
 * Engine/APIs: _gpu.ts (createWindow, createDevice, compile, makeVertexShader/
 * makePixelShader, makeTexture, makeSampler, makeConstantBuffer/updateConstantBuffer,
 * setRenderTargets/setViewport/clear, vsSet/psSet, drawFullscreenTriangle, present,
 * vcall, comRelease, blobRelease, guidBytes, copyResource) + @bun-win32 mf/mfplat/
 * mfreadwrite (Media Foundation capture) + ole32 + user32/gdi32 (HUD).
 *
 * Run: bun run packages/all/example/webcam.ts
 */

import { resolve } from 'node:path';
import { mkdirSync } from 'node:fs';

import { FFIType, dlopen, read, toArrayBuffer, type Pointer } from 'bun:ffi';

import '@bun-win32/core'; // installs Buffer.prototype.ptr (also pulled transitively via _gpu)
import { GDI32, User32 } from '../index';
import { SystemMetric } from '@bun-win32/user32';
import Mfplat, { MFMediaType_Video, MFVideoFormat_RGB32, MFVideoFormat_NV12 } from '@bun-win32/mfplat';
import * as gpu from './_gpu';
import * as hud from './_hud';
import { captureBackBuffer, formatGrid } from './_snapshot';

// ── HRESULTs / constants ───────────────────────────────────────────────────────
const S_OK = 0;
const RPC_E_CHANGED_MODE = 0x8001_0106 >>> 0;
const COINIT_APARTMENTTHREADED = 0x2;
const MF_VERSION = 0x0002_0070;
const MFSTARTUP_LITE = 0x1;
const MF_SOURCE_READER_FIRST_VIDEO_STREAM = 0xffff_fffc;
const TRANSPARENT_BK = 1;
const VK_SPACE = 0x20;

// ── Media Foundation GUIDs (verified against mfidl.h / mfapi.h / mfreadwrite.h) ─
const MF_DEVSOURCE_ATTRIBUTE_SOURCE_TYPE = 'c60ac5fe-252a-478f-a0ef-bc8fa5f7cad3';
const MF_DEVSOURCE_ATTRIBUTE_SOURCE_TYPE_VIDCAP_GUID = '8ac3587a-4ae7-42d8-99e0-0a6013eef90f';
const MF_DEVSOURCE_ATTRIBUTE_FRIENDLY_NAME = '60d0e559-52f8-4fa2-bbce-acdb34a8ec01';
const IID_IMFMediaSource = '279a808d-aec7-40c8-9c6b-a6b492c78a66';
const MF_MT_MAJOR_TYPE = '48eba18e-f8c9-4687-bf11-0a74c9f96a8f';
const MF_MT_SUBTYPE = 'f7e34c9a-42e8-4714-b74b-cb29d72c35e5';
const MF_MT_FRAME_SIZE = '1652c33d-d6b2-4012-b834-72030849a37d';
const MF_SOURCE_READER_ENABLE_VIDEO_PROCESSING = 'fb394f3d-ccf1-42ee-bbb3-f9b845d5681d';

// ── COM vtable slots (verified by enumerating the SDK headers, see build notes) ─
const ATTR_GET_UINT64 = 8;
const ATTR_GET_ALLOCATED_STRING = 13;
const ATTR_SET_UINT32 = 21;
const ATTR_SET_GUID = 24;
const ACTIVATE_ACTIVATE_OBJECT = 33;
const READER_SET_STREAM_SELECTION = 4;
const READER_GET_NATIVE_MEDIA_TYPE = 5;
const READER_SET_CURRENT_MEDIA_TYPE = 7;
const READER_READ_SAMPLE = 9;
const SAMPLE_CONVERT_TO_CONTIGUOUS_BUFFER = 41;
const BUFFER_LOCK = 3;
const BUFFER_UNLOCK = 4;
const SOURCE_SHUTDOWN = 12;
const IID_ID3D11_TEXTURE2D = '6f15aaf2-d208-4e89-9ab4-489535d34f9c';

const hex = (hr: number): string => `0x${(hr >>> 0).toString(16).padStart(8, '0')}`;
const wide = (s: string): Buffer => Buffer.from(`${s}\0`, 'utf16le');

function guidBytes(value: string): Buffer {
  const match = /^([0-9a-f]{8})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{12})$/i.exec(value);
  if (match === null) throw new Error(`Invalid GUID: ${value}`);
  const [, d1, d2, d3, d4High, d4Low] = match;
  const buffer = Buffer.alloc(16);
  buffer.writeUInt32LE(parseInt(d1!, 16), 0);
  buffer.writeUInt16LE(parseInt(d2!, 16), 4);
  buffer.writeUInt16LE(parseInt(d3!, 16), 6);
  const data4 = `${d4High}${d4Low}`;
  for (let i = 0; i < 8; i += 1) buffer[8 + i] = parseInt(data4.slice(i * 2, i * 2 + 2), 16);
  return buffer;
}

// ── Inline ole32 + mf.dll bindings (self-contained; mirrors _capture.ts / the probe) ──
const ole32 = dlopen('ole32.dll', {
  CoInitializeEx: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
  CoUninitialize: { args: [], returns: FFIType.void },
  CoTaskMemFree: { args: [FFIType.ptr], returns: FFIType.void },
});
// MFEnumDeviceSources lives in mf.dll but is not bound as a Mf static method yet.
const mf = dlopen('mf.dll', {
  MFEnumDeviceSources: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
});
// Bind with u64 args so we can pass the IMFMediaSource/IMFAttributes pointers as bigint
// (x64 COM addresses can exceed Number.MAX_SAFE_INTEGER; the typed wrapper's ptr arg would truncate).
const mfrw = dlopen('mfreadwrite.dll', {
  MFCreateSourceReaderFromMediaSource: { args: [FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
});

// ── A live camera bound to a D3D11 SRV texture, or a graceful no-op fallback. ───
interface Camera {
  available: boolean;
  name: string;
  w: number;
  h: number;
  format: 'RGB32' | 'NV12';
  tex: gpu.TextureResult | null;
  readFrame(): boolean; // true once a fresh frame was uploaded into tex
  shutdown(): void;
}

// Keep capture buffers alive at module scope so GC can't free a struct mid-call.
const ppActivate = Buffer.alloc(8);
const pCount = Buffer.alloc(4);
const ppSource = Buffer.alloc(8);
const ppReader = Buffer.alloc(8);
const ppNativeType = Buffer.alloc(8);
const ppMediaType = Buffer.alloc(8);
const frameSizeOut = Buffer.alloc(8);
const ppName = Buffer.alloc(8);
const pNameLen = Buffer.alloc(4);

// ReadSample out-params (reused every frame).
const pActualIndex = Buffer.alloc(4);
const pStreamFlags = Buffer.alloc(4);
const pTimestamp = Buffer.alloc(8);
const ppSample = Buffer.alloc(8);
const ppBuffer = Buffer.alloc(8);
const ppData = Buffer.alloc(8);
const pMaxLen = Buffer.alloc(4);
const pCurLen = Buffer.alloc(4);

function openCamera(context: bigint): Camera {
  const noCamera: Camera = {
    available: false,
    name: 'NO CAMERA',
    w: 0,
    h: 0,
    format: 'RGB32',
    tex: null,
    readFrame: () => false,
    shutdown: () => {},
  };

  // 1. Filter attributes: SOURCE_TYPE = VIDCAP.
  if (Mfplat.MFCreateAttributes(ppActivate.ptr!, 1) !== S_OK) return noCamera;
  const filterAttrs = ppActivate.readBigUInt64LE(0);
  const keyType = guidBytes(MF_DEVSOURCE_ATTRIBUTE_SOURCE_TYPE);
  const valVidcap = guidBytes(MF_DEVSOURCE_ATTRIBUTE_SOURCE_TYPE_VIDCAP_GUID);
  gpu.vcall(filterAttrs, ATTR_SET_GUID, [FFIType.ptr, FFIType.ptr], [keyType.ptr!, valVidcap.ptr!]);

  // 2. Enumerate capture devices → IMFActivate*[].
  const ppActivateArray = Buffer.alloc(8);
  const enumHr = mf.symbols.MFEnumDeviceSources(filterAttrs, ppActivateArray.ptr!, pCount.ptr!);
  const count = pCount.readUInt32LE(0);
  if (enumHr !== S_OK || count === 0) {
    gpu.comRelease(filterAttrs);
    console.log('webcam: no video-capture device found — rendering the NO CAMERA fallback.');
    return noCamera;
  }
  const activateArrayPtr = ppActivateArray.readBigUInt64LE(0);
  const activate = read.u64(Number(activateArrayPtr) as Pointer, 0); // IMFActivate* = first entry

  // Friendly name for the HUD (best-effort).
  let name = 'Camera';
  const keyName = guidBytes(MF_DEVSOURCE_ATTRIBUTE_FRIENDLY_NAME);
  if (gpu.vcall(activate, ATTR_GET_ALLOCATED_STRING, [FFIType.ptr, FFIType.ptr, FFIType.ptr], [keyName.ptr!, ppName.ptr!, pNameLen.ptr!]) === S_OK) {
    const namePtr = ppName.readBigUInt64LE(0);
    const len = pNameLen.readUInt32LE(0);
    if (namePtr !== 0n && len > 0) {
      const raw = Buffer.from(toArrayBuffer(Number(namePtr) as Pointer, 0, len * 2));
      name = raw.toString('utf16le');
      ole32.symbols.CoTaskMemFree(Number(namePtr) as Pointer);
    }
  }

  // 3. ActivateObject → IMFMediaSource.
  const iidSource = guidBytes(IID_IMFMediaSource);
  const actHr = gpu.vcall(activate, ACTIVATE_ACTIVATE_OBJECT, [FFIType.ptr, FFIType.ptr], [iidSource.ptr!, ppSource.ptr!]);
  // Release the activate array entries + free the array (the source holds its own refs).
  for (let i = 0; i < count; i += 1) {
    const entry = read.u64(Number(activateArrayPtr) as Pointer, i * 8);
    if (entry !== 0n) gpu.comRelease(entry);
  }
  ole32.symbols.CoTaskMemFree(Number(activateArrayPtr) as Pointer);
  gpu.comRelease(filterAttrs);
  if (actHr !== S_OK) {
    console.log(`webcam: ActivateObject failed ${hex(actHr)} — NO CAMERA fallback.`);
    return noCamera;
  }
  const source = ppSource.readBigUInt64LE(0);

  // 4. Reader attributes: enable the built-in video processor MFT.
  if (Mfplat.MFCreateAttributes(ppReader.ptr!, 1) !== S_OK) {
    gpu.vcall(source, SOURCE_SHUTDOWN, [], [], FFIType.i32);
    gpu.comRelease(source);
    return noCamera;
  }
  const readerAttrs = ppReader.readBigUInt64LE(0);
  const keyVP = guidBytes(MF_SOURCE_READER_ENABLE_VIDEO_PROCESSING);
  gpu.vcall(readerAttrs, ATTR_SET_UINT32, [FFIType.ptr, FFIType.u32], [keyVP.ptr!, 1]);

  // 5. Create the source reader from the media source.
  const readerOut = Buffer.alloc(8);
  const readerHr = mfrw.symbols.MFCreateSourceReaderFromMediaSource(source, readerAttrs, readerOut.ptr!);
  gpu.comRelease(readerAttrs);
  if (readerHr !== S_OK) {
    console.log(`webcam: MFCreateSourceReaderFromMediaSource failed ${hex(readerHr)} — NO CAMERA fallback.`);
    gpu.vcall(source, SOURCE_SHUTDOWN, [], [], FFIType.i32);
    gpu.comRelease(source);
    return noCamera;
  }
  const reader = readerOut.readBigUInt64LE(0);

  // 6. Learn native WxH from the first native media type.
  let w = 960;
  let h = 540;
  if (gpu.vcall(reader, READER_GET_NATIVE_MEDIA_TYPE, [FFIType.u32, FFIType.u32, FFIType.ptr], [MF_SOURCE_READER_FIRST_VIDEO_STREAM, 0, ppNativeType.ptr!]) === S_OK) {
    const nativeType = ppNativeType.readBigUInt64LE(0);
    const keySize = guidBytes(MF_MT_FRAME_SIZE);
    if (gpu.vcall(nativeType, ATTR_GET_UINT64, [FFIType.ptr, FFIType.ptr], [keySize.ptr!, frameSizeOut.ptr!]) === S_OK) {
      // MF_MT_FRAME_SIZE packs width in the high DWORD, height in the low DWORD.
      w = frameSizeOut.readUInt32LE(4);
      h = frameSizeOut.readUInt32LE(0);
    }
    gpu.comRelease(nativeType);
  }

  // 7. Negotiate an output media type: RGB32 first (video processor lets us demand it),
  //    fall back to NV12 (decoded in-shader) if RGB32 is rejected.
  function setOutput(subtypeGuid: string): number {
    if (Mfplat.MFCreateMediaType(ppMediaType.ptr!) !== S_OK) return -1;
    const mt = ppMediaType.readBigUInt64LE(0);
    const keyMajor = guidBytes(MF_MT_MAJOR_TYPE);
    const valVideo = guidBytes(MFMediaType_Video);
    gpu.vcall(mt, ATTR_SET_GUID, [FFIType.ptr, FFIType.ptr], [keyMajor.ptr!, valVideo.ptr!]);
    const keySub = guidBytes(MF_MT_SUBTYPE);
    const valSub = guidBytes(subtypeGuid);
    gpu.vcall(mt, ATTR_SET_GUID, [FFIType.ptr, FFIType.ptr], [keySub.ptr!, valSub.ptr!]);
    const hr = gpu.vcall(reader, READER_SET_CURRENT_MEDIA_TYPE, [FFIType.u32, FFIType.ptr, FFIType.u64], [MF_SOURCE_READER_FIRST_VIDEO_STREAM, null, mt]);
    gpu.comRelease(mt);
    return hr;
  }

  let format: 'RGB32' | 'NV12' = 'RGB32';
  let setHr = setOutput(MFVideoFormat_RGB32);
  if (setHr !== S_OK) {
    console.log(`webcam: RGB32 rejected (${hex(setHr)}); trying NV12.`);
    setHr = setOutput(MFVideoFormat_NV12);
    format = 'NV12';
  }
  if (setHr !== S_OK) {
    console.log(`webcam: no usable output media type (${hex(setHr)}) — NO CAMERA fallback.`);
    gpu.comRelease(reader);
    gpu.vcall(source, SOURCE_SHUTDOWN, [], [], FFIType.i32);
    gpu.comRelease(source);
    return noCamera;
  }
  gpu.vcall(reader, READER_SET_STREAM_SELECTION, [FFIType.u32, FFIType.i32], [MF_SOURCE_READER_FIRST_VIDEO_STREAM, 1]);

  // For RGB32 we upload BGRA directly; for NV12 we upload the planar bytes into a
  // single-channel-wide R8 texture and unpack Y/UV in the shader. We size the texture
  // for the byte layout: RGB32 = w*h*4, NV12 = w*(h*3/2) bytes packed as R8 of width w.
  const tex =
    format === 'RGB32'
      ? gpu.makeTexture({ w, h, format: gpu.DXGI_FORMAT_B8G8R8A8_UNORM, srv: true })
      : gpu.makeTexture({ w, h: Math.floor((h * 3) / 2), format: gpu.DXGI_FORMAT_R8G8B8A8_UNORM, srv: true });

  console.log(`webcam: ${name} · ${w}x${h} · ${format} · video processor enabled.`);

  let alive = true;
  return {
    available: true,
    name,
    w,
    h,
    format,
    tex,
    readFrame(): boolean {
      if (!alive) return false;
      // Blocking (synchronous) ReadSample on the main thread — no callbacks.
      const hr = gpu.vcall(
        reader,
        READER_READ_SAMPLE,
        [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr],
        [MF_SOURCE_READER_FIRST_VIDEO_STREAM, 0, pActualIndex.ptr!, pStreamFlags.ptr!, pTimestamp.ptr!, ppSample.ptr!],
      );
      if (hr !== S_OK) return false;
      const sample = ppSample.readBigUInt64LE(0);
      if (sample === 0n) return false; // warm-up: camera not ready this call

      let uploaded = false;
      if (gpu.vcall(sample, SAMPLE_CONVERT_TO_CONTIGUOUS_BUFFER, [FFIType.ptr], [ppBuffer.ptr!]) === S_OK) {
        const buffer = ppBuffer.readBigUInt64LE(0);
        if (gpu.vcall(buffer, BUFFER_LOCK, [FFIType.ptr, FFIType.ptr, FFIType.ptr], [ppData.ptr!, pMaxLen.ptr!, pCurLen.ptr!]) === S_OK) {
          const dataPtr = ppData.readBigUInt64LE(0);
          const curLen = pCurLen.readUInt32LE(0);
          if (dataPtr !== 0n && curLen > 0) {
            const rowPitch = format === 'RGB32' ? w * 4 : w; // NV12 planes packed at width w
            gpu.vcall(
              context,
              gpu.CTX_UPDATE_SUBRESOURCE,
              [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.u32],
              [tex.tex, 0, null, dataPtr, rowPitch, 0],
              FFIType.void,
            );
            uploaded = true;
          }
          gpu.vcall(buffer, BUFFER_UNLOCK, [], [], FFIType.i32);
        }
        gpu.comRelease(buffer);
      }
      gpu.comRelease(sample);
      return uploaded;
    },
    shutdown(): void {
      if (!alive) return;
      alive = false;
      gpu.comRelease(reader);
      gpu.vcall(source, SOURCE_SHUTDOWN, [], [], FFIType.i32);
      gpu.comRelease(source);
      if (tex.srv) gpu.comRelease(tex.srv);
      gpu.comRelease(tex.tex);
    },
  };
}

// ── HLSL ────────────────────────────────────────────────────────────────────────
const VS_SOURCE = /* hlsl */ `
struct VSOut { float4 pos : SV_Position; float2 uv : TEXCOORD0; };
VSOut main(uint vid : SV_VertexID) {
  VSOut o; float2 p = float2((vid << 1) & 2, vid & 2);
  o.uv = p; o.pos = float4(p * float2(2,-2) + float2(-1,1), 0, 1); return o;
}
`;

// Shared preamble: live frame as Texture2D + per-frame params + a sampleCam() that
// handles the RGB32 (BGRA) and NV12 (planar R8) decode + an optional iFlip for
// bottom-up sources (Video-Processor output is top-down here, so iFlip defaults 0).
const COMMON_HLSL = /* hlsl */ `
cbuffer C : register(b0) {
  float2 iRes;     // output resolution
  float  iTime;    // seconds
  float  iEffect;  // active effect id
  float2 iCamRes;  // camera w,h
  float  iMode;    // 0 = RGB32 passthrough, 1 = NV12 decode, 2 = no camera (procedural)
  float  iFlip;    // 0 = top-down (default), 1 = invert v for bottom-up sources
};
Texture2D Cam : register(t0);
SamplerState Smp : register(s0);

float luma(float3 c) { return dot(c, float3(0.299, 0.587, 0.114)); }
float hash(float2 p){ p = frac(p*float2(123.34,456.21)); p += dot(p,p+45.32); return frac(p.x*p.y); }

// Decode one camera pixel for normalized uv (0..1). iFlip selects the vertical
// orientation: MF's Video-Processor RGB32 (and NV12) are delivered TOP-DOWN here,
// so iFlip=0 by default; iFlip=1 inverts v for any source that arrives bottom-up.
float3 sampleCam(float2 uv) {
  float2 fuv = float2(uv.x, iFlip > 0.5 ? (1.0 - uv.y) : uv.y);
  if (iMode < 0.5) {
    return Cam.Sample(Smp, fuv).rgb;                 // RGB32: texture is already BGRA->rgb
  } else if (iMode < 1.5) {
    // NV12 stored as R8 texture of width=camW, height=camH*3/2.
    // Y plane: rows [0, camH). UV plane (interleaved): rows [camH, camH*3/2).
    float texH = iCamRes.y * 1.5;
    float yRow = fuv.y * iCamRes.y;                  // 0..camH
    float yv = Cam.Sample(Smp, float2(fuv.x, (yRow + 0.5) / texH)).r;
    float cRow = iCamRes.y + floor(yRow * 0.5);      // chroma row in lower plane
    // U at even column, V at odd column within each 2px pair.
    float2 cuvU = float2((floor(fuv.x * iCamRes.x * 0.5) * 2.0 + 0.5) / iCamRes.x, (cRow + 0.5) / texH);
    float2 cuvV = float2((floor(fuv.x * iCamRes.x * 0.5) * 2.0 + 1.5) / iCamRes.x, (cRow + 0.5) / texH);
    float u = Cam.Sample(Smp, cuvU).r - 0.5;
    float v = Cam.Sample(Smp, cuvV).r - 0.5;
    float Y = yv;
    return saturate(float3(Y + 1.402*v, Y - 0.344*u - 0.714*v, Y + 1.772*u));
  } else {
    // No camera: a vivid animated procedural "video feed".
    float2 p = uv * 2.0 - 1.0;
    p.x *= iRes.x / iRes.y;
    float t = iTime;
    float a = atan2(p.y, p.x);
    float r = length(p);
    float swirl = sin(a * 6.0 + r * 10.0 - t * 2.0);
    float rings = sin(r * 22.0 - t * 3.0);
    float3 c = 0.5 + 0.5 * cos(t + r * 4.0 + float3(0.0, 2.094, 4.188) + swirl);
    c *= 0.6 + 0.4 * rings;
    c += 0.25 * pow(saturate(1.0 - r), 3.0);
    return saturate(c);
  }
}
struct VSOut { float4 pos : SV_Position; float2 uv : TEXCOORD0; };
`;

// Sobel edge-detect → glowing wireframe over a dark field.
const PS_EDGE = /* hlsl */ `${COMMON_HLSL}
float lc(float2 uv){ return luma(sampleCam(uv)); }
float4 main(VSOut i) : SV_Target {
  float2 px = 1.0 / iRes;
  float tl=lc(i.uv+float2(-px.x,-px.y)), l=lc(i.uv+float2(-px.x,0)), bl=lc(i.uv+float2(-px.x,px.y));
  float t=lc(i.uv+float2(0,-px.y)), b=lc(i.uv+float2(0,px.y));
  float tr=lc(i.uv+float2(px.x,-px.y)), r=lc(i.uv+float2(px.x,0)), br=lc(i.uv+float2(px.x,px.y));
  float gx = -tl-2*l-bl + tr+2*r+br;
  float gy = -tl-2*t-tr + bl+2*b+br;
  float e = saturate(sqrt(gx*gx+gy*gy)*1.6);
  float3 base = sampleCam(i.uv);
  float3 glow = lerp(float3(0.0,0.9,0.6), float3(1.0,0.7,0.1), saturate(luma(base)));
  float3 col = base * 0.12 + glow * pow(e, 0.8) * 1.3;
  col *= 0.9 + 0.1*sin(i.uv.y*iRes.y*0.5 + iTime*8.0);
  return float4(saturate(col), 1);
}`;

// Thermal / predator LUT mapped from luminance — the bold default. A wide tonal
// LUT, a contrast stretch, an edge-energy overlay and a vignette make even a
// flat/idle frame read as a vivid heat map.
const PS_THERMAL = /* hlsl */ `${COMMON_HLSL}
// "Cold" floor is a deep teal/indigo (never pure black) so the WHOLE frame reads as
// a thermal sensor image, not a dark logo on black.
float3 heat(float x){ x=saturate(x); float3 c=float3(0.0,0.04,0.14);
  c=lerp(c,float3(0.05,0.10,0.40),smoothstep(0.00,0.16,x));
  c=lerp(c,float3(0.20,0.0,0.62),smoothstep(0.16,0.34,x));
  c=lerp(c,float3(0.70,0.0,0.62),smoothstep(0.34,0.50,x));
  c=lerp(c,float3(0.98,0.10,0.10),smoothstep(0.50,0.64,x));
  c=lerp(c,float3(1.0,0.55,0.0),smoothstep(0.64,0.78,x));
  c=lerp(c,float3(1.0,0.95,0.22),smoothstep(0.78,0.92,x));
  c=lerp(c,float3(1.0,1.0,0.96),smoothstep(0.92,1.0,x)); return c; }
float lc(float2 uv){ return luma(sampleCam(uv)); }
float4 main(VSOut i) : SV_Target {
  float2 px = 1.0/iRes;
  // 3-tap blur for a smoother heat field.
  float lum = lc(i.uv)*1.0 + lc(i.uv+px*1.5)*0.5 + lc(i.uv-px*1.5)*0.5;
  lum /= 2.0;
  // Lift + contrast stretch + slow breathing so the LUT spans its full hot range.
  lum = saturate(lum*1.6 + 0.06);
  lum = pow(lum, 0.78) * (0.97 + 0.05*sin(iTime*1.5));
  float3 col = heat(lum);
  // Sobel edge energy → hot white outline that traces shapes/logos/text.
  float gx = lc(i.uv+float2(px.x,0)) - lc(i.uv-float2(px.x,0));
  float gy = lc(i.uv+float2(0,px.y)) - lc(i.uv-float2(0,px.y));
  float e = saturate(sqrt(gx*gx+gy*gy)*4.0);
  col += float3(1.0,0.96,0.75) * pow(e,0.7) * 1.0;
  // Scanline shimmer + film grain.
  col *= 0.92 + 0.08*sin(i.uv.y*iRes.y*0.7 + iTime*10.0);
  col += (hash(i.uv*iRes + iTime) - 0.5)*0.05;
  // Vignette toward the cold-floor color so edges stay thermal, not black.
  float2 q = i.uv*2.0-1.0; q.x *= iRes.x/iRes.y;
  col = lerp(float3(0.0,0.03,0.12), col, smoothstep(2.1, 0.2, dot(q,q)));
  return float4(saturate(col*1.05), 1);
}`;

// (3) ASCII dot-matrix: quantize luma per 8px cell into a glyph-density dot.
const PS_ASCII = /* hlsl */ `${COMMON_HLSL}
float4 main(VSOut i) : SV_Target {
  float2 cell = 8.0/iRes;
  float2 cellUV = (floor(i.uv/cell)+0.5)*cell;
  float cl = luma(sampleCam(cellUV));
  float ramp = floor(cl*6.0)/6.0;
  float2 f = frac(i.uv/cell);
  float radius = lerp(0.08, 0.46, ramp);
  float dotMask = smoothstep(radius+0.05, radius-0.05, length(f-0.5));
  float3 phosphor = float3(0.25, 1.0, 0.5);
  float3 col = phosphor * (dotMask * (0.3 + 0.7*ramp));
  col += phosphor * 0.02;
  col *= 0.92 + 0.08*sin(iTime*8.0 + i.uv.y*40.0);
  return float4(saturate(col), 1);
}`;

// (4) CRT: barrel distortion + scanlines + aperture grille + chroma aberration.
const PS_CRT = /* hlsl */ `${COMMON_HLSL}
float4 main(VSOut i) : SV_Target {
  float2 c = i.uv*2.0 - 1.0;
  float r2 = dot(c,c);
  c *= 1.0 + 0.10*r2;
  float2 uv = c*0.5 + 0.5;
  if (uv.x<0||uv.x>1||uv.y<0||uv.y>1) return float4(0,0,0,1);
  float2 dir = uv-0.5;
  float ca = 0.004*(0.5+r2);
  float3 col;
  col.r = sampleCam(uv + dir*ca).r;
  col.g = sampleCam(uv).g;
  col.b = sampleCam(uv - dir*ca).b;
  float gx = frac(uv.x*iRes.x/3.0);
  float3 mask = float3(gx<0.333, gx>=0.333&&gx<0.666, gx>=0.666);
  col *= lerp(float3(1,1,1), mask*1.7, 0.5);
  col *= 0.82 + 0.18*sin((uv.y*iRes.y + iTime*30.0)*3.14159);
  col *= smoothstep(1.3, 0.35, r2);
  return float4(saturate(col*1.15), 1);
}`;

// Keys 1-4. Thermal leads (index 0) so the demo opens on the boldest look.
const EFFECT_NAMES = ['thermal', 'edge', 'ASCII', 'CRT'] as const;
const EFFECT_SRC = [PS_THERMAL, PS_EDGE, PS_ASCII, PS_CRT] as const;
const NUM_EFFECTS = EFFECT_SRC.length;

// ── Boot ────────────────────────────────────────────────────────────────────────
const durationMs = process.env.DEMO_DURATION_MS ? Number(process.env.DEMO_DURATION_MS) : 0;
const selfCheck = process.env.SELFCHECK === '1';
const selfShot = process.env.SELFSHOT === '1';

const screenW = User32.GetSystemMetrics(SystemMetric.SM_CXSCREEN) || 1920;
const screenH = User32.GetSystemMetrics(SystemMetric.SM_CYSCREEN) || 1080;
const WIN_H = Math.min(1000, Math.floor(screenH * 0.72));
const WIN_W = Math.min(Math.floor(screenW * 0.9), Math.round(WIN_H * 16 / 9));
const win = gpu.createWindow({ title: 'webcam · live MF capture → GPU shaders', width: WIN_W, height: WIN_H, borderless: true });
const { w: BBW, h: BBH } = win.clientSize();
const g = gpu.createDevice(win.hwnd, { width: BBW, height: BBH });

// ── Initialize Media Foundation (COM-backed; must come before any MF call) ───────
const coHr = ole32.symbols.CoInitializeEx(null, COINIT_APARTMENTTHREADED);
const coOwned = coHr >= 0;
if (coHr < 0 && (coHr >>> 0) !== RPC_E_CHANGED_MODE) console.log(`webcam: CoInitializeEx ${hex(coHr)} (continuing)`);
const mfStartHr = Mfplat.MFStartup(MF_VERSION, MFSTARTUP_LITE);
if (mfStartHr !== S_OK) console.log(`webcam: MFStartup ${hex(mfStartHr)} (continuing — fallback only)`);

const cam: Camera = mfStartHr === S_OK ? openCamera(g.context) : { available: false, name: 'NO CAMERA', w: 0, h: 0, format: 'RGB32', tex: null, readFrame: () => false, shutdown: () => {} };

// ── Compile shaders ───────────────────────────────────────────────────────────
const vsCode = gpu.compile(VS_SOURCE, 'main', 'vs_5_0');
const vs = gpu.makeVertexShader(vsCode);
const pixelShaders: bigint[] = [];
const psBlobs: bigint[] = [];
for (let e = 0; e < NUM_EFFECTS; e += 1) {
  const code = gpu.compile(EFFECT_SRC[e]!, 'main', 'ps_5_0');
  pixelShaders.push(gpu.makePixelShader(code));
  psBlobs.push(code.blob);
}
const sampler = gpu.makeSampler({ filter: gpu.D3D11_FILTER_MIN_MAG_MIP_LINEAR, address: gpu.D3D11_TEXTURE_ADDRESS_CLAMP });
const samplerPoint = gpu.makeSampler({ filter: gpu.D3D11_FILTER_MIN_MAG_MIP_POINT, address: gpu.D3D11_TEXTURE_ADDRESS_CLAMP });
const cb = gpu.makeConstantBuffer(48);
const cbBuf = Buffer.alloc(48);

// A 1x1 black SRV so the procedural fallback path always has a bound texture.
const dummyTex = gpu.makeTexture({ w: 1, h: 1, format: gpu.DXGI_FORMAT_R8G8B8A8_UNORM, srv: true });
const dummyPix = Buffer.from([0, 0, 0, 255]);
gpu.vcall(g.context, gpu.CTX_UPDATE_SUBRESOURCE, [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.u32], [dummyTex.tex, 0, null, dummyPix.ptr!, 4, 0], FFIType.void);

const camMode = cam.available ? (cam.format === 'RGB32' ? 0 : 1) : 2;
const camSrv = cam.available && cam.tex ? cam.tex.srv! : dummyTex.srv!;
const camW = cam.available ? cam.w : BBW;
const camH = cam.available ? cam.h : BBH;
// MF's Video-Processor RGB32/NV12 arrive TOP-DOWN on this stack, so no flip by
// default; set WEBCAM_FLIP=1 if a particular device delivers a bottom-up frame.
const camFlip = process.env.WEBCAM_FLIP === '1' ? 1 : 0;

// ── GDI HUD ─────────────────────────────────────────────────────────────────────
// Clean two-line overlay composited INTO the back buffer (via _hud) BEFORE Present,
// so it is part of the presented frame (and the snapshot) and never strobes.
const hudFont = GDI32.CreateFontW(-24, 0, 0, 0, 700, 0, 0, 0, 0, 0, 0, 4, 0, wide('Consolas').ptr!);
const hudFontSmall = GDI32.CreateFontW(-17, 0, 0, 0, 500, 0, 0, 0, 0, 0, 0, 4, 0, wide('Consolas').ptr!);
function drawTextShadow(dc: bigint, x: number, y: number, s: string, rgb: number): void {
  const text = wide(s);
  GDI32.SetTextColor(dc, 0x00000000);
  GDI32.TextOutW(dc, x + 1, y + 1, text.ptr!, s.length);
  GDI32.SetTextColor(dc, rgb);
  GDI32.TextOutW(dc, x, y, text.ptr!, s.length);
}
function drawHud(effect: number, fps: number): void {
  hud.draw(g, BBW, BBH, (dc) => {
    GDI32.SetBkMode(dc, TRANSPARENT_BK);
    // Headline (BGR colors: amber when live, cyan when fallback).
    const device = cam.available ? `${cam.name} ${cam.w}x${cam.h}` : 'NO CAMERA';
    const line1 = `pure-TS Media Foundation camera · ${device} · effect: ${EFFECT_NAMES[effect]} · keys 1-4`;
    const prevFont = GDI32.SelectObject(dc, hudFont);
    drawTextShadow(dc, 24, 22, line1, cam.available ? 0x0040ddff : 0x00ffd060);
    // Sub-line: format / fps / GPU / quit.
    const line2 = cam.available
      ? `${cam.format} · ${fps} fps · ${g.gpuName} · SPACE cycle · ESC quit`
      : `procedural fallback · run Camera Hub / plug a camera · ${fps} fps · ${g.gpuName} · ESC quit`;
    GDI32.SelectObject(dc, hudFontSmall);
    drawTextShadow(dc, 24, 56, line2, 0x00c0c0c0);
    GDI32.SelectObject(dc, prevFont);
  });
}

// ── Self-check: read back the swapchain back buffer → 2D pixel stats. ───────────
function backBufferStats(): Record<string, number> {
  const ppBack = Buffer.alloc(8);
  const iid = guidBytes(IID_ID3D11_TEXTURE2D);
  gpu.vcall(g.swapChain, gpu.SWAP_GET_BUFFER, [FFIType.u32, FFIType.ptr, FFIType.ptr], [0, iid.ptr!, ppBack.ptr!]);
  const backTex = ppBack.readBigUInt64LE(0);
  const staging = gpu.makeTexture({ w: BBW, h: BBH, format: gpu.DXGI_FORMAT_B8G8R8A8_UNORM, staging: true });
  gpu.copyResource(staging.tex, backTex);

  const mapped = Buffer.alloc(16);
  let nonBlack = 0;
  let lumaSum = 0;
  const cells = new Float64Array(64); // 8x8 grid mean-luma for structure variance
  const cellN = new Float64Array(64);
  const colorBuckets = new Set<number>();
  let sampled = 0;
  if (gpu.vcall(g.context, gpu.CTX_MAP, [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], [staging.tex, 0, 1, 0, mapped.ptr!]) === 0) {
    const dataPtr = Number(mapped.readBigUInt64LE(0)) as Pointer;
    const rowPitch = mapped.readUInt32LE(8);
    const stepX = Math.max(1, Math.floor(BBW / 256));
    const stepY = Math.max(1, Math.floor(BBH / 256));
    for (let y = 0; y < BBH; y += stepY) {
      for (let x = 0; x < BBW; x += stepX) {
        const off = y * rowPitch + x * 4;
        const b = read.u8(dataPtr, off);
        const gg = read.u8(dataPtr, off + 1);
        const rr = read.u8(dataPtr, off + 2);
        const lum = 0.299 * rr + 0.587 * gg + 0.114 * b;
        if (rr + gg + b > 24) nonBlack += 1;
        lumaSum += lum;
        const ci = (Math.floor(y / (BBH / 8)) * 8 + Math.floor(x / (BBW / 8))) | 0;
        cells[ci] += lum;
        cellN[ci] += 1;
        colorBuckets.add(((rr >> 4) << 8) | ((gg >> 4) << 4) | (b >> 4));
        sampled += 1;
      }
    }
    gpu.vcall(g.context, gpu.CTX_UNMAP, [FFIType.u64, FFIType.u32], [staging.tex, 0], FFIType.void);
  }
  gpu.comRelease(backTex);
  if (staging.srv) gpu.comRelease(staging.srv);
  gpu.comRelease(staging.tex);

  const cellMeans: number[] = [];
  for (let i = 0; i < 64; i += 1) if (cellN[i] > 0) cellMeans.push(cells[i] / cellN[i]);
  const meanOfMeans = cellMeans.reduce((a, b) => a + b, 0) / Math.max(1, cellMeans.length);
  const gridVar = cellMeans.reduce((a, b) => a + (b - meanOfMeans) ** 2, 0) / Math.max(1, cellMeans.length);

  return {
    sampled,
    nonBlackPct: sampled > 0 ? +((nonBlack / sampled) * 100).toFixed(2) : 0,
    meanLuma: sampled > 0 ? +(lumaSum / sampled).toFixed(2) : 0,
    distinctColors: colorBuckets.size,
    gridLumaVariance: +gridVar.toFixed(2),
    cameraPresent: cam.available ? 1 : 0,
  };
}

// ── Main loop ─────────────────────────────────────────────────────────────────
// Default to the thermal LUT (effect 0): it maps even a dim/idle camera feed into a
// vivid, high-variance frame, so the showcase capture is always striking. Override
// the starting effect with WEBCAM_EFFECT=0..3; cycle live with SPACE / keys 1-4.
let effect = process.env.WEBCAM_EFFECT ? Math.max(0, Math.min(NUM_EFFECTS - 1, Number(process.env.WEBCAM_EFFECT))) : 0;
const start = performance.now();
let frames = 0;
let live = 0;
let fps = 0;
let fpsFrames = 0;
let fpsTimer = start;
let spacePrev = false;
const numPrev = new Array<boolean>(NUM_EFFECTS).fill(false);
let statsPrinted = false;
let shotDone = false;

console.log(`webcam — Media Foundation live capture → GPU shaders on ${g.driver} (${g.gpuName}).`);

while (!win.shouldClose()) {
  win.pump();
  if (win.shouldClose()) break;
  const now = performance.now();
  const t = (now - start) / 1000;

  // Effect cycling.
  const spaceNow = win.keyDown(VK_SPACE);
  if (spaceNow && !spacePrev) effect = (effect + 1) % NUM_EFFECTS;
  spacePrev = spaceNow;
  for (let k = 0; k < NUM_EFFECTS; k += 1) {
    const keyNow = win.keyDown(0x31 + k);
    if (keyNow && !numPrev[k]) effect = k;
    numPrev[k] = keyNow;
  }

  // Pull one live frame (no-op + procedural in the NO CAMERA case).
  if (cam.available && cam.readFrame()) live += 1;

  // Build the per-frame cbuffer immediately before the consuming draw.
  cbBuf.writeFloatLE(BBW, 0);
  cbBuf.writeFloatLE(BBH, 4);
  cbBuf.writeFloatLE(t, 8);
  cbBuf.writeFloatLE(effect, 12);
  cbBuf.writeFloatLE(camW, 16);
  cbBuf.writeFloatLE(camH, 20);
  cbBuf.writeFloatLE(camMode, 24);
  cbBuf.writeFloatLE(camFlip, 28);
  gpu.updateConstantBuffer(cb, cbBuf);

  gpu.setRenderTargets([g.backBufferRTV]);
  gpu.setViewport(BBW, BBH);
  gpu.clear(g.backBufferRTV, [0, 0, 0, 1]);
  gpu.vsSet(vs);
  // NV12 needs point sampling on the packed planes to avoid plane bleed; RGB32/dummy use linear.
  gpu.psSet(pixelShaders[effect]!, { cb: [cb], srv: [camSrv], samp: [camMode === 1 ? samplerPoint : sampler] });
  gpu.drawFullscreenTriangle();
  // Unbind the SRV so the next ReadSample's UpdateSubresource into the same texture is legal.
  gpu.psSet(pixelShaders[effect]!, { srv: [0n] });

  // Composite the HUD INTO the back buffer (after the scene, before Present / snapshot)
  // so the text is part of the presented frame and never strobes.
  drawHud(effect, fps);

  // Self-verification reads the back buffer BEFORE Present (DISCARD makes it undefined
  // after). Wait past camera warm-up (~60 frames) AND ~1.2s so live pixels have landed.
  const warmedUp = frames >= 60 && now - start >= 1200;
  if (selfCheck && !statsPrinted && warmedUp) {
    const stats = backBufferStats();
    console.log('SELFCHECK_STATS ' + JSON.stringify(stats));
    statsPrinted = true;
  }
  if (selfShot && !shotDone && warmedUp) {
    const shotDir = resolve(import.meta.dir, '..', 'screenshots');
    mkdirSync(shotDir, { recursive: true });
    const shotPath = process.env.SELFSHOT_PATH || resolve(shotDir, 'webcam.selfcheck.png');
    const stats = captureBackBuffer(g, shotPath, { gridW: 48, gridH: 22 });
    console.log(formatGrid(stats));
    console.log(`[shot] effect=${EFFECT_NAMES[effect]} cam=${cam.available ? cam.name : 'none'} ok=${stats.ok} nonBlack=${stats.nonBlackFrac.toFixed(3)} meanLuma=${stats.meanLuma.toFixed(3)} -> ${stats.path}`);
    shotDone = true;
  }

  g.present(false);
  frames += 1;

  fpsFrames += 1;
  if (now - fpsTimer >= 1000) {
    fps = Math.round((fpsFrames * 1000) / (now - fpsTimer));
    fpsFrames = 0;
    fpsTimer = now;
  }

  // In self-verify modes keep running until the capture lands (ignore the duration
  // cap), then exit immediately; otherwise honor DEMO_DURATION_MS.
  if (selfCheck) {
    if (statsPrinted) break;
  } else if (selfShot) {
    if (shotDone) break;
  } else if (durationMs > 0 && now - start >= durationMs) {
    break;
  }
}

// ── Teardown ──────────────────────────────────────────────────────────────────
const elapsed = (performance.now() - start) / 1000;
console.log(`webcam: presented ${frames} frames (${live} live captures) over ${elapsed.toFixed(2)}s.`);

cam.shutdown();
hud.release();
GDI32.DeleteObject(hudFont);
GDI32.DeleteObject(hudFontSmall);
gpu.comRelease(sampler);
gpu.comRelease(samplerPoint);
gpu.comRelease(cb);
if (dummyTex.srv) gpu.comRelease(dummyTex.srv);
gpu.comRelease(dummyTex.tex);
for (const ps of pixelShaders) gpu.comRelease(ps);
for (const blob of psBlobs) gpu.blobRelease(blob);
gpu.comRelease(vs);
gpu.blobRelease(vsCode.blob);
gpu.comRelease(g.backBufferRTV);
gpu.comRelease(g.swapChain);
gpu.comRelease(g.context);
gpu.comRelease(g.device);
win.destroy();

Mfplat.MFShutdown();
if (coOwned) ole32.symbols.CoUninitialize();
ole32.close();
mf.close();
mfrw.close();
process.exit(0);
