/**
 * Radio Cathedral
 *
 * Translates the nearby Wi-Fi spectrum into a living stained-glass instrument. Network
 * names become ephemerally salted SHA-256-derived seeds: signal strength shapes the light,
 * authentication shapes the ornament, and no SSID or BSSID is displayed or written.
 *
 * APIs demonstrated:
 * - @bun-win32/netdiag
 *   - wifiScan (reads the cached Windows WLAN census without shelling out)
 * - @bun-win32/gpu
 *   - createWindow / createDevice (native Win32 window and D3D11 swap chain)
 *   - compile / makePixelShader / makeVertexShader (runtime HLSL toolchain)
 *   - makeTexture / drawFullscreenTriangle (ping-pong HDR render pipeline)
 *   - captureBackBuffer (real back-buffer PNG capture for visual verification)
 * - @bun-win32/winmm
 *   - waveOutOpen / waveOutWrite (seamless generated stereo PCM choir)
 *
 * Run: bun run example/radio-cathedral.ts
 */

import {
  DXGI_FORMAT_R16G16B16A16_FLOAT,
  blobRelease,
  captureBackBuffer,
  clear,
  comRelease,
  compile,
  createDevice,
  createWindow,
  destroyDevice,
  drawFullscreenTriangle,
  formatGrid,
  makeConstantBuffer,
  makePixelShader,
  makeSampler,
  makeTexture,
  makeVertexShader,
  psSet,
  setRenderTargets,
  setViewport,
  updateConstantBuffer,
  vsSet,
} from '@bun-win32/gpu';
import type { TextureResult } from '@bun-win32/gpu';
import { wifiScan } from '@bun-win32/netdiag';
import type { WifiNetwork } from '@bun-win32/netdiag';
import Winmm, { CallbackFlag, WAVE_MAPPER } from '@bun-win32/winmm';
import { mkdirSync, readdirSync } from 'node:fs';
import { dirname } from 'node:path';

Winmm.Preload(['waveOutClose', 'waveOutOpen', 'waveOutPrepareHeader', 'waveOutReset', 'waveOutUnprepareHeader', 'waveOutWrite']);

const WINDOW_WIDTH = 1600;
const WINDOW_HEIGHT = 900;
const MAX_SIGNALS = 24;
const AUDIO_SAMPLE_RATE = 48_000;
const AUDIO_LOOP_SECONDS = 16;
const WAVE_FORMAT_PCM = 1;
const WAVE_HEADER_BYTES = 48;
const WAVE_HEADER_BEGIN_LOOP = 0x0000_0004;
const WAVE_HEADER_END_LOOP = 0x0000_0008;
const WAVE_ERROR_STILL_PLAYING = 33;
const TWO_PI = Math.PI * 2;
const IDENTITY_SALT = Bun.env.RADIO_SALT ?? crypto.randomUUID();

interface RadioSignal {
  angle: number;
  strength: number;
  hue: number;
  ornament: number;
}

interface Spectrum {
  live: boolean;
  observedCount: number;
  signals: RadioSignal[];
}

interface Choir {
  close(): void;
}

const FULLSCREEN_VERTEX_SHADER = `
struct VertexOutput {
  float4 position : SV_Position;
  float2 textureCoordinate : TEXCOORD0;
};

VertexOutput main(uint vertexIdentifier : SV_VertexID) {
  VertexOutput output;
  float2 textureCoordinate = float2((vertexIdentifier << 1) & 2, vertexIdentifier & 2);
  output.textureCoordinate = textureCoordinate;
  output.position = float4(textureCoordinate * float2(2.0, -2.0) + float2(-1.0, 1.0), 0.0, 1.0);
  return output;
}
`;

const CATHEDRAL_PIXEL_SHADER = `
#define MAX_SIGNALS 24
#define PI 3.14159265358979323846
#define TWO_PI 6.28318530717958647692

cbuffer CathedralState : register(b0) {
  float2 resolution;
  float time;
  float deltaTime;
  float2 mouse;
  uint signalCount;
  float radiance;
  float4 signals[MAX_SIGNALS];
};

Texture2D<float4> previousFrame : register(t0);
SamplerState linearSampler : register(s0);

struct VertexOutput {
  float4 position : SV_Position;
  float2 textureCoordinate : TEXCOORD0;
};

float hash21(float2 value) {
  value = frac(value * float2(123.34, 456.21));
  value += dot(value, value + 45.32);
  return frac(value.x * value.y);
}

float valueNoise(float2 position) {
  float2 cell = floor(position);
  float2 withinCell = frac(position);
  float2 interpolation = withinCell * withinCell * (3.0 - 2.0 * withinCell);
  float lowerLeft = hash21(cell);
  float lowerRight = hash21(cell + float2(1.0, 0.0));
  float upperLeft = hash21(cell + float2(0.0, 1.0));
  float upperRight = hash21(cell + 1.0);
  return lerp(lerp(lowerLeft, lowerRight, interpolation.x), lerp(upperLeft, upperRight, interpolation.x), interpolation.y);
}

float layeredNoise(float2 position) {
  float result = 0.0;
  float amplitude = 0.5;
  [unroll]
  for (int octave = 0; octave < 5; octave += 1) {
    result += amplitude * valueNoise(position);
    position = mul(float2x2(1.62, 1.18, -1.18, 1.62), position);
    amplitude *= 0.5;
  }
  return result;
}

float angularDistance(float firstAngle, float secondAngle) {
  return abs(atan2(sin(firstAngle - secondAngle), cos(firstAngle - secondAngle)));
}

float3 jewelPalette(float hue) {
  float palettePosition = frac(hue) * 5.0;
  float3 sapphire = float3(0.018, 0.075, 0.62);
  float3 turquoise = float3(0.005, 0.58, 0.72);
  float3 amber = float3(1.00, 0.31, 0.018);
  float3 garnet = float3(0.78, 0.012, 0.095);
  float3 violet = float3(0.31, 0.012, 0.63);
  if (palettePosition < 1.0) return lerp(sapphire, turquoise, smoothstep(0.0, 1.0, palettePosition));
  if (palettePosition < 2.0) return lerp(turquoise, amber, smoothstep(0.0, 1.0, palettePosition - 1.0));
  if (palettePosition < 3.0) return lerp(amber, garnet, smoothstep(0.0, 1.0, palettePosition - 2.0));
  if (palettePosition < 4.0) return lerp(garnet, violet, smoothstep(0.0, 1.0, palettePosition - 3.0));
  return lerp(violet, sapphire, smoothstep(0.0, 1.0, palettePosition - 4.0));
}

float pointedWindowWidth(float verticalPosition) {
  const float bottom = -0.76;
  const float shoulder = 0.20;
  const float top = 0.80;
  if (verticalPosition < bottom || verticalPosition > top) return -1.0;
  if (verticalPosition <= shoulder) return 0.245;
  float ascent = saturate((verticalPosition - shoulder) / (top - shoulder));
  return 0.245 * pow(1.0 - ascent, 0.72) * (1.0 - 0.20 * ascent);
}

float lancetStoneFrame(float2 position, float horizontalCenter) {
  float2 localPosition = position - float2(horizontalCenter, -0.02);
  float halfWidth = pointedWindowWidth(localPosition.y);
  if (halfWidth < 0.0) return 0.0;
  float distanceToGlass = abs(abs(localPosition.x) - halfWidth);
  float sideFrame = 1.0 - smoothstep(0.020, 0.052, distanceToGlass);
  float sill = (1.0 - smoothstep(0.012, 0.040, abs(localPosition.y + 0.78))) * step(abs(localPosition.x), 0.30);
  return saturate(sideFrame + sill);
}

float3 renderLancet(float2 position, float horizontalCenter, float sideIdentifier, float stoneTexture, out float lancetMask) {
  float2 localPosition = position - float2(horizontalCenter, -0.02);
  float halfWidth = pointedWindowWidth(localPosition.y);
  float signedEdge = halfWidth - abs(localPosition.x);
  lancetMask = halfWidth < 0.0 ? 0.0 : smoothstep(-0.004, 0.004, signedEdge);
  if (lancetMask <= 0.0) return 0.0;

  float verticalCoordinate = saturate((localPosition.y + 0.76) / 1.56);
  float horizontalCoordinate = saturate(localPosition.x / max(halfWidth, 0.001) * 0.5 + 0.5);
  uint paneRow = min(6, (uint)floor(verticalCoordinate * 7.0));
  uint paneColumn = min(2, (uint)floor(horizontalCoordinate * 3.0));
  uint band = (paneRow * 3 + paneColumn + (uint)sideIdentifier * 5) % signalCount;
  float4 signal = signals[band];
  float paneVariation = hash21(float2(paneRow, paneColumn + signal.w * 91.0));
  float3 glass = jewelPalette(frac(signal.z + paneVariation * 0.21 + sideIdentifier * 0.08));
  glass *= (0.18 + signal.y * 0.82) * (0.66 + 0.34 * stoneTexture) * (0.76 + verticalCoordinate * 0.24);

  float horizontalCell = min(frac(verticalCoordinate * 7.0), 1.0 - frac(verticalCoordinate * 7.0));
  float verticalLeadDistance = min(abs(localPosition.x), abs(abs(localPosition.x) - halfWidth * 0.52));
  float horizontalLeadDistance = horizontalCell / 7.0 * 1.56;
  float leadDistance = min(verticalLeadDistance, horizontalLeadDistance);
  float curvedBraceDistance = abs(abs(localPosition.x) - halfWidth * (0.20 + verticalCoordinate * 0.55));
  leadDistance = min(leadDistance, curvedBraceDistance);
  float leadCore = 1.0 - smoothstep(0.0035, 0.0095, leadDistance);
  float leadEdge = 1.0 - smoothstep(0.008, 0.019, leadDistance);
  float borderCore = 1.0 - smoothstep(0.006, 0.015, abs(signedEdge));
  float3 leadColor = float3(0.006, 0.007, 0.011) + float3(0.13, 0.065, 0.018) * leadEdge;
  glass = lerp(glass, leadColor, saturate(leadCore + borderCore));
  glass += float3(0.42, 0.17, 0.035) * borderCore * 0.13;
  return glass * lancetMask;
}

float3 renderRose(float2 position, float glassTexture, out float roseMask) {
  float radius = length(position);
  float angle = atan2(position.y, position.x);
  const float roseRadius = 0.815;
  roseMask = 1.0 - smoothstep(roseRadius - 0.003, roseRadius + 0.004, radius);
  if (roseMask <= 0.0) return 0.0;

  float nearestDistance = 1000.0;
  float secondDistance = 1000.0;
  float4 selectedSignal = signals[0];
  [loop]
  for (uint signalIndex = 0; signalIndex < signalCount; signalIndex += 1) {
    float4 signal = signals[signalIndex];
    [unroll]
    for (uint harmonic = 0; harmonic < 4; harmonic += 1) {
      float harmonicOffset = harmonic * (TWO_PI / 4.0) + (signal.w - 0.5) * 0.16 * (harmonic & 1 ? 1.0 : -1.0);
      float curvedAngle = signal.x + harmonicOffset + 0.045 * sin(radius * (8.0 + signal.w * 4.0) + signal.w * TWO_PI + harmonic * 1.7 + time * 0.08);
      float distanceToSignal = angularDistance(angle, curvedAngle) * (0.70 + radius * 0.55);
      if (distanceToSignal < nearestDistance) {
        secondDistance = nearestDistance;
        nearestDistance = distanceToSignal;
        selectedSignal = signal;
        selectedSignal.z = frac(signal.z + harmonic * 0.087);
      } else if (distanceToSignal < secondDistance) {
        secondDistance = distanceToSignal;
      }
    }
  }

  float ringCoordinate = radius * (7.2 + selectedSignal.w * 1.2) + 0.075 * sin(angle * 12.0 + selectedSignal.w * TWO_PI);
  float ringFraction = frac(ringCoordinate);
  float ringDistance = min(ringFraction, 1.0 - ringFraction) / (7.2 + selectedSignal.w * 1.2);
  float spokeDistance = abs(sin(angle * 12.0 + (radius - 0.38) * 2.35)) * max(radius, 0.42) / 5.5;
  float middlePetalDistance = radius > 0.18 && radius < 0.53 ? abs(abs(sin(angle * 6.0)) * 0.21 - abs(radius - 0.34)) : 1.0;
  float outerPetalDistance = radius > 0.46 && radius < 0.79 ? abs(abs(sin(angle * 8.0 + 0.4)) * 0.085 - abs(radius - 0.625)) : 1.0;
  float traceryDistance = min(ringDistance, min(spokeDistance, min(middlePetalDistance, outerPetalDistance)));

  float paneIdentifier = floor(ringCoordinate) + floor((angle + PI) / TWO_PI * 24.0) * 0.37;
  float paneVariation = hash21(float2(paneIdentifier, selectedSignal.w * 311.0));
  float paneHue = frac(selectedSignal.z + paneVariation * 0.23 + floor(ringCoordinate) * 0.103 + radius * 0.055);
  float3 glass = jewelPalette(paneHue);
  float irregularity = 0.64 + 0.36 * glassTexture + 0.08 * sin(radius * 71.0 + angle * 13.0 + selectedSignal.w * 19.0);
  float backLight = 0.48 + selectedSignal.y * 0.92;
  float striation = 0.93 + 0.07 * sin(position.x * 118.0 + position.y * 31.0 + glassTexture * 8.0 + selectedSignal.w * 17.0);
  float2 bubbleCell = frac(position * 29.0 + selectedSignal.w * float2(19.0, 31.0)) - 0.5;
  float bubbleSeed = hash21(floor(position * 29.0 + selectedSignal.w * float2(19.0, 31.0)));
  float bubbleRing = (1.0 - smoothstep(0.018, 0.045, abs(length(bubbleCell) - 0.12))) * step(0.965, bubbleSeed);
  glass *= irregularity * backLight * striation;
  glass += bubbleRing * float3(0.15, 0.20, 0.24) * selectedSignal.y;

  float leadCore = 1.0 - smoothstep(0.0033, 0.0082, traceryDistance);
  float leadWarmth = 1.0 - smoothstep(0.007, 0.016, traceryDistance);
  float boundaryGap = max(0.0, secondDistance - nearestDistance);
  float boundaryWidth = max(fwidth(boundaryGap) * 1.65, 0.00015);
  float boundaryCore = radius > 0.22 ? 1.0 - smoothstep(0.0, boundaryWidth, boundaryGap) : 0.0;
  float boundaryWarmth = radius > 0.22 ? 1.0 - smoothstep(0.0, boundaryWidth * 3.4, boundaryGap) : 0.0;
  float combinedLeadCore = saturate(leadCore + boundaryCore);
  float combinedLeadWarmth = saturate(leadWarmth + boundaryWarmth);
  float3 lead = float3(0.0025, 0.0035, 0.007) + float3(0.075, 0.028, 0.006) * combinedLeadWarmth;
  glass *= 1.0 - combinedLeadWarmth * 0.18;
  glass = lerp(glass, lead, combinedLeadCore);
  glass += float3(0.52, 0.14, 0.012) * combinedLeadWarmth * (1.0 - combinedLeadCore) * 0.085;

  float innerMask = 1.0 - smoothstep(0.205, 0.218, radius);
  float innerPetals = pow(abs(cos(angle * 6.0)), 7.0);
  float3 innerGlass = jewelPalette(frac(selectedSignal.z + floor((angle + PI) / (TWO_PI / 12.0)) * 0.071 + 0.15));
  innerGlass *= 0.72 + 1.15 * innerPetals + radius * 1.6;
  float innerLeadDistance = min(abs(sin(angle * 6.0)) * max(radius, 0.18) / 4.0, abs(radius - 0.125));
  float innerLead = 1.0 - smoothstep(0.004, 0.011, innerLeadDistance);
  innerGlass = lerp(innerGlass, float3(0.004, 0.005, 0.009), innerLead);
  glass = lerp(glass, innerGlass, innerMask);

  float oculusVoid = 1.0 - smoothstep(0.071, 0.083, radius);
  float oculusRing = 1.0 - smoothstep(0.006, 0.014, abs(radius - 0.125));
  float outerLead = 1.0 - smoothstep(0.010, 0.026, abs(radius - roseRadius));
  glass = lerp(glass, float3(0.006, 0.007, 0.012), oculusVoid);
  glass = lerp(glass, float3(0.018, 0.009, 0.004), oculusRing);
  glass += float3(0.94, 0.27, 0.035) * oculusRing * 0.24;
  glass = lerp(glass, float3(0.004, 0.005, 0.008), outerLead);
  return glass * roseMask;
}

float4 main(VertexOutput input) : SV_Target {
  float aspectRatio = resolution.x / resolution.y;
  float2 position = (input.textureCoordinate * 2.0 - 1.0) * float2(aspectRatio, -1.0);
  float2 mousePosition = (mouse * 2.0 - 1.0) * float2(aspectRatio, -1.0);
  float distanceFromCenter = length(position);
  float polarAngle = atan2(position.y, position.x);

  float stoneTexture = layeredNoise(position * 3.6 + float2(17.0, 9.0));
  float fineStone = layeredNoise(position * 19.0 - float2(4.0, 13.0));
  float3 color = lerp(float3(0.009, 0.011, 0.018), float3(0.032, 0.034, 0.044), stoneTexture);
  color += fineStone * float3(0.012, 0.011, 0.010);

  float archHalo = exp(-8.5 * abs(distanceFromCenter - 0.915));
  float archCore = 1.0 - smoothstep(0.010, 0.031, abs(distanceFromCenter - 0.895));
  float innerFrame = 1.0 - smoothstep(0.009, 0.022, abs(distanceFromCenter - 0.843));
  color += float3(0.035, 0.035, 0.041) * archHalo * (0.55 + stoneTexture * 0.6);
  color = lerp(color, float3(0.046, 0.043, 0.043) * (0.72 + stoneTexture * 0.55), archCore);
  color += float3(0.16, 0.067, 0.014) * innerFrame * 0.30;

  float foundation = (1.0 - smoothstep(0.012, 0.035, abs(position.y + 0.825))) * smoothstep(1.70, 1.48, abs(position.x));
  float leftButtress = 1.0 - smoothstep(0.020, 0.055, abs(abs(position.x) - 0.955));
  leftButtress *= smoothstep(-0.86, -0.68, position.y) * smoothstep(0.70, 0.50, position.y);
  float3 carvedStone = float3(0.038, 0.038, 0.043) * (0.72 + stoneTexture * 0.58);
  color = lerp(color, carvedStone, saturate(foundation * 0.72 + leftButtress * 0.38));
  color += float3(0.11, 0.046, 0.010) * foundation * fineStone * 0.18;

  float leftStoneFrame = lancetStoneFrame(position, -1.255);
  float rightStoneFrame = lancetStoneFrame(position, 1.255);
  float lancetFrame = saturate(leftStoneFrame + rightStoneFrame);
  color = lerp(color, float3(0.043, 0.041, 0.044) * (0.70 + stoneTexture * 0.55), lancetFrame);
  color += float3(0.12, 0.052, 0.012) * lancetFrame * fineStone * 0.34;

  float leftLancetMask;
  float rightLancetMask;
  float3 leftLancet = renderLancet(position, -1.255, 0.0, stoneTexture, leftLancetMask);
  float3 rightLancet = renderLancet(position, 1.255, 1.0, stoneTexture, rightLancetMask);
  color = lerp(color, leftLancet, leftLancetMask * 0.66);
  color = lerp(color, rightLancet, rightLancetMask * 0.66);

  float roseMask;
  float glassTexture = layeredNoise(position * 11.0 + float2(time * 0.012, -time * 0.008));
  float3 rose = renderRose(position, glassTexture, roseMask);
  color = lerp(color, rose, roseMask);

  float sweepProgress = frac(time * 0.12);
  float sweepRadius = 0.055 + sweepProgress * 0.80;
  float sweepRing = exp(-pow(abs(distanceFromCenter - sweepRadius) * 39.0, 2.0));
  float sweepWake = exp(-max(0.0, sweepRadius - distanceFromCenter) * 7.0) * step(distanceFromCenter, sweepRadius);
  float glassTransmission = smoothstep(0.10, 0.46, dot(rose, float3(0.20, 0.68, 0.12)));
  float spectralShift = 0.5 + 0.5 * sin(polarAngle * 3.0 - time * 0.72);
  float3 sweepColor = lerp(float3(0.025, 0.32, 1.15), float3(1.20, 0.19, 0.018), spectralShift);
  color += sweepColor * sweepRing * roseMask * glassTransmission * 0.58;
  color += rose * sweepWake * roseMask * glassTransmission * 0.18;

  float3 radioLight = 0.0;
  [loop]
  for (uint signalIndex = 0; signalIndex < signalCount; signalIndex += 1) {
    float4 signal = signals[signalIndex];
    float breathingAngle = signal.x + sin(time * (0.045 + signal.w * 0.035) + signal.w * TWO_PI) * 0.018;
    float difference = angularDistance(polarAngle, breathingAngle);
    float beam = exp(-difference * difference * (105.0 + signal.w * 115.0));
    beam *= smoothstep(0.57, 0.86, distanceFromCenter) * exp(-max(0.0, distanceFromCenter - 0.78) * 2.6);
    float resonanceRadius = 0.24 + signal.y * 0.49 + sin(time * 0.70 + signal.w * TWO_PI) * 0.015;
    float resonance = exp(-pow(abs(distanceFromCenter - resonanceRadius) * 65.0, 2.0)) * exp(-difference * difference * 18.0);
    float travellingRadius = 0.10 + frac(time * 0.075 + signal.w) * 0.82;
    float travellingWave = exp(-pow(abs(distanceFromCenter - travellingRadius) * 82.0, 2.0)) * exp(-difference * difference * 24.0);
    radioLight += jewelPalette(signal.z) * signal.y * (beam * 0.23 + resonance * 0.48 + travellingWave * 0.26);

    float2 nodePosition = float2(cos(signal.x), sin(signal.x)) * 0.874;
    float nodeDistanceSquared = dot(position - nodePosition, position - nodePosition);
    float nodeCore = exp(-nodeDistanceSquared * 9200.0);
    float nodeHalo = exp(-nodeDistanceSquared * 480.0);
    radioLight += jewelPalette(signal.z) * signal.y * (nodeCore * 2.8 + nodeHalo * 0.18);
  }
  color += radioLight * (0.75 + radiance * 0.5);

  float movingGlint = exp(-dot(position - mousePosition, position - mousePosition) * 4.5);
  float facingGlint = saturate(0.5 + 0.5 * dot(normalize(position + 0.0001), normalize(mousePosition + 0.0001)));
  color += float3(0.56, 0.68, 0.92) * movingGlint * roseMask * (0.08 + radiance * 0.19);
  color += float3(0.08, 0.12, 0.19) * pow(facingGlint, 18.0) * archHalo * 0.32;

  float2 dustFlow = position * 58.0 + float2(time * 0.37, -time * 0.21);
  float dustSeed = hash21(floor(dustFlow));
  float2 dustLocal = frac(dustFlow) - 0.5;
  float dust = smoothstep(0.032, 0.0, length(dustLocal)) * step(0.987, dustSeed);
  color += dust * float3(0.82, 0.67, 0.41) * (0.12 + archHalo * 0.5);

  float2 centeredCoordinate = input.textureCoordinate - 0.5;
  float rotation = 0.00035 * sin(time * 0.17);
  float2 historyCoordinate = float2(centeredCoordinate.x - centeredCoordinate.y * rotation, centeredCoordinate.y + centeredCoordinate.x * rotation) * 1.0003 + 0.5;
  float3 history = previousFrame.SampleLevel(linearSampler, historyCoordinate, 0.0).rgb;
  float persistence = 0.34 + 0.10 * saturate(radiance);
  float3 accumulated = lerp(color, max(color, history * 0.985 - 0.0008), persistence);
  return float4(accumulated, 1.0);
}
`;

const PRESENT_PIXEL_SHADER = `
cbuffer CathedralState : register(b0) {
  float2 resolution;
  float time;
  float deltaTime;
  float2 mouse;
  uint signalCount;
  float radiance;
};

Texture2D<float4> cathedralTexture : register(t0);
SamplerState linearSampler : register(s0);

struct VertexOutput {
  float4 position : SV_Position;
  float2 textureCoordinate : TEXCOORD0;
};

float hash21(float2 value) {
  value = frac(value * float2(123.34, 456.21));
  value += dot(value, value + 45.32);
  return frac(value.x * value.y);
}

float3 brightSample(float2 coordinate) {
  float3 sampleColor = cathedralTexture.SampleLevel(linearSampler, coordinate, 0.0).rgb;
  return max(sampleColor - 0.34, 0.0);
}

float3 filmic(float3 color) {
  float3 numerator = color * (2.51 * color + 0.03);
  float3 denominator = color * (2.43 * color + 0.59) + 0.14;
  return saturate(numerator / denominator);
}

float4 main(VertexOutput input) : SV_Target {
  float2 textureCoordinate = input.textureCoordinate;
  float2 pixelSize = 1.0 / resolution;
  float2 nearHorizontal = float2(pixelSize.x * 2.5, 0.0);
  float2 nearVertical = float2(0.0, pixelSize.y * 2.5);
  float2 nearDiagonal = pixelSize * 2.0;
  float2 farHorizontal = float2(pixelSize.x * 8.5, 0.0);
  float2 farVertical = float2(0.0, pixelSize.y * 8.5);
  float2 farDiagonal = pixelSize * 6.0;

  float3 base = cathedralTexture.SampleLevel(linearSampler, textureCoordinate, 0.0).rgb;
  float3 bloom = 0.0;
  bloom += brightSample(textureCoordinate + nearHorizontal);
  bloom += brightSample(textureCoordinate - nearHorizontal);
  bloom += brightSample(textureCoordinate + nearVertical);
  bloom += brightSample(textureCoordinate - nearVertical);
  bloom += brightSample(textureCoordinate + nearDiagonal);
  bloom += brightSample(textureCoordinate - nearDiagonal);
  bloom += brightSample(textureCoordinate + float2(nearDiagonal.x, -nearDiagonal.y));
  bloom += brightSample(textureCoordinate + float2(-nearDiagonal.x, nearDiagonal.y));
  bloom += brightSample(textureCoordinate + farHorizontal) * 0.55;
  bloom += brightSample(textureCoordinate - farHorizontal) * 0.55;
  bloom += brightSample(textureCoordinate + farVertical) * 0.55;
  bloom += brightSample(textureCoordinate - farVertical) * 0.55;
  bloom += brightSample(textureCoordinate + farDiagonal) * 0.38;
  bloom += brightSample(textureCoordinate - farDiagonal) * 0.38;
  bloom *= 0.105;

  float2 centered = textureCoordinate - 0.5;
  float radialDistance = dot(centered, centered);
  float vignette = smoothstep(0.72, 0.12, radialDistance);
  float grain = hash21(input.position.xy + frac(time) * 173.0) - 0.5;
  float3 graded = filmic((base + bloom) * 1.12);
  graded = pow(graded, float3(0.94, 0.96, 1.00));
  graded *= 0.76 + 0.24 * vignette;
  graded += grain * (0.0035 + 0.0025 * (1.0 - vignette));
  return float4(saturate(graded), 1.0);
}
`;

function hashIdentity(value: string): number {
  const digest = new Bun.CryptoHasher('sha256').update(`${IDENTITY_SALT}\u0000${value}`).digest('hex');
  return Number.parseInt(digest.slice(0, 8), 16) >>> 0;
}

function signalFromNetwork(network: WifiNetwork, networkIndex: number): RadioSignal {
  const identity = `${network.ssid}\u0000${network.authAlgorithm}\u0000${network.cipherAlgorithm}\u0000${networkIndex}`;
  const identityHash = hashIdentity(identity);
  const secondaryHash = hashIdentity(`${identityHash}:${network.bssCount}:${network.secured}`);
  return {
    angle: ((identityHash / 0xffff_ffff) * 2 - 1) * Math.PI,
    strength: Math.max(0.12, Math.min(1, network.signalQuality / 100)),
    hue: secondaryHash / 0xffff_ffff,
    ornament: (hashIdentity(network.authAlgorithm) & 0xffff) / 0xffff,
  };
}

function fallbackSpectrum(): RadioSignal[] {
  const strengths = [0.96, 0.84, 0.72, 0.61, 0.52, 0.43, 0.35, 0.27, 0.19];
  return strengths.map((strength, signalIndex) => ({
    angle: ((signalIndex * 0.618_033_988_75) % 1) * TWO_PI - Math.PI,
    strength,
    hue: (0.04 + signalIndex * 0.137_503_523_75) % 1,
    ornament: (signalIndex * 0.271_828) % 1,
  }));
}

async function readSpectrum(): Promise<Spectrum> {
  if (Bun.env.RADIO_OFFLINE === '1') return { live: false, observedCount: 0, signals: fallbackSpectrum() };
  try {
    const networks = await wifiScan();
    networks.sort((first, second) => {
      const firstKey = `${first.ssid}\u0000${first.authAlgorithm}\u0000${first.cipherAlgorithm}\u0000${first.bssCount}\u0000${first.signalQuality}`;
      const secondKey = `${second.ssid}\u0000${second.authAlgorithm}\u0000${second.cipherAlgorithm}\u0000${second.bssCount}\u0000${second.signalQuality}`;
      return firstKey < secondKey ? -1 : firstKey > secondKey ? 1 : 0;
    });
    const signals = networks
      .map(signalFromNetwork)
      .sort((first, second) => second.strength - first.strength)
      .slice(0, MAX_SIGNALS);
    if (signals.length > 0) return { live: true, observedCount: networks.length, signals };
  } catch (error) {
    console.warn(`WLAN census unavailable; using the deterministic score (${error instanceof Error ? error.message : String(error)}).`);
  }
  const signals = fallbackSpectrum();
  return { live: false, observedCount: 0, signals };
}

function createCathedralState(signals: RadioSignal[]): Buffer {
  const state = Buffer.alloc(32 + MAX_SIGNALS * 16);
  state.writeFloatLE(WINDOW_WIDTH, 0);
  state.writeFloatLE(WINDOW_HEIGHT, 4);
  state.writeUInt32LE(signals.length, 24);
  for (let signalIndex = 0; signalIndex < signals.length; signalIndex += 1) {
    const signal = signals[signalIndex]!;
    const offset = 32 + signalIndex * 16;
    state.writeFloatLE(signal.angle, offset);
    state.writeFloatLE(signal.strength, offset + 4);
    state.writeFloatLE(signal.hue, offset + 8);
    state.writeFloatLE(signal.ornament, offset + 12);
  }
  return state;
}

function periodicFrequency(targetFrequency: number): number {
  return Math.round(targetFrequency * AUDIO_LOOP_SECONDS) / AUDIO_LOOP_SECONDS;
}

function synthesizeChoir(signals: RadioSignal[]): Buffer {
  const frameCount = AUDIO_SAMPLE_RATE * AUDIO_LOOP_SECONDS;
  const samples = Buffer.alloc(frameCount * 4);
  const scaleSemitones = [0, 2, 5, 7, 9, 12, 14, 17];
  const voices = signals.slice(0, 8).map((signal, voiceIndex) => {
    const semitone = scaleSemitones[(Math.floor(signal.hue * scaleSemitones.length) + voiceIndex) % scaleSemitones.length]!;
    const targetFrequency = 73.416 * 2 ** (semitone / 12);
    return {
      amplitude: 0.018 + signal.strength * 0.035,
      fundamental: periodicFrequency(targetFrequency),
      overtone: periodicFrequency(targetFrequency * (2.01 + signal.ornament * 0.018)),
      modulationCycles: 1 + Math.floor(signal.ornament * 4),
      pan: 0.12 + ((signal.angle + Math.PI) / TWO_PI) * 0.76,
      phase: signal.hue * TWO_PI,
    };
  });
  const droneFundamental = periodicFrequency(36.708);
  const droneFifth = periodicFrequency(55.062);

  for (let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
    const seconds = frameIndex / AUDIO_SAMPLE_RATE;
    let left = Math.sin(TWO_PI * droneFundamental * seconds) * 0.028;
    let right = Math.sin(TWO_PI * droneFifth * seconds + Math.PI * 0.5) * 0.024;
    for (const voice of voices) {
      const modulation = 0.62 + 0.38 * Math.sin((TWO_PI * voice.modulationCycles * seconds) / AUDIO_LOOP_SECONDS + voice.phase);
      const tone = Math.sin(TWO_PI * voice.fundamental * seconds + voice.phase) * 0.72 + Math.sin(TWO_PI * voice.overtone * seconds - voice.phase * 0.4) * 0.28;
      const voiceSample = tone * voice.amplitude * modulation;
      left += voiceSample * Math.cos(voice.pan * Math.PI * 0.5);
      right += voiceSample * Math.sin(voice.pan * Math.PI * 0.5);
    }
    const slowBreath = 0.88 + 0.12 * Math.cos((TWO_PI * 2 * seconds) / AUDIO_LOOP_SECONDS);
    const leftSample = Math.max(-1, Math.min(1, Math.tanh(left * slowBreath * 1.8)));
    const rightSample = Math.max(-1, Math.min(1, Math.tanh(right * slowBreath * 1.8)));
    samples.writeInt16LE(Math.round(leftSample * 0x7fff), frameIndex * 4);
    samples.writeInt16LE(Math.round(rightSample * 0x7fff), frameIndex * 4 + 2);
  }

  return samples;
}

async function writeChoirWave(path: string, samples: Buffer): Promise<void> {
  const header = Buffer.alloc(44);
  header.write('RIFF', 0, 'ascii');
  header.writeUInt32LE(36 + samples.byteLength, 4);
  header.write('WAVE', 8, 'ascii');
  header.write('fmt ', 12, 'ascii');
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(WAVE_FORMAT_PCM, 20);
  header.writeUInt16LE(2, 22);
  header.writeUInt32LE(AUDIO_SAMPLE_RATE, 24);
  header.writeUInt32LE(AUDIO_SAMPLE_RATE * 4, 28);
  header.writeUInt16LE(4, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36, 'ascii');
  header.writeUInt32LE(samples.byteLength, 40);
  mkdirSync(dirname(path), { recursive: true });
  await Bun.write(path, Buffer.concat([header, samples]));
}

function startChoir(samples: Buffer): Choir | null {
  if (Bun.env.NO_AUDIO === '1') return null;

  const format = Buffer.alloc(18);
  format.writeUInt16LE(WAVE_FORMAT_PCM, 0);
  format.writeUInt16LE(2, 2);
  format.writeUInt32LE(AUDIO_SAMPLE_RATE, 4);
  format.writeUInt32LE(AUDIO_SAMPLE_RATE * 4, 8);
  format.writeUInt16LE(4, 12);
  format.writeUInt16LE(16, 14);
  format.writeUInt16LE(0, 16);

  const outputHandle = Buffer.alloc(8);

  const header = Buffer.allocUnsafeSlow(WAVE_HEADER_BYTES);
  header.fill(0);
  header.writeBigUInt64LE(BigInt(samples.ptr!), 0);
  header.writeUInt32LE(samples.byteLength, 8);
  header.writeUInt32LE(WAVE_HEADER_BEGIN_LOOP | WAVE_HEADER_END_LOOP, 24);
  header.writeUInt32LE(0xffff_ffff, 28);

  const openResult = Winmm.waveOutOpen(outputHandle.ptr!, WAVE_MAPPER, format.ptr!, 0n, 0n, CallbackFlag.CALLBACK_NULL);
  if (openResult !== 0) {
    console.warn(`Audio device declined the generated choir (waveOut error ${openResult}); continuing silently.`);
    return null;
  }

  const handle = outputHandle.readBigUInt64LE(0);
  const prepareResult = Winmm.waveOutPrepareHeader(handle, header.ptr!, WAVE_HEADER_BYTES);
  if (prepareResult !== 0) {
    Winmm.waveOutClose(handle);
    console.warn(`Audio header preparation failed (waveOut error ${prepareResult}); continuing silently.`);
    return null;
  }
  const writeResult = Winmm.waveOutWrite(handle, header.ptr!, WAVE_HEADER_BYTES);
  if (writeResult !== 0) {
    Winmm.waveOutReset(handle);
    Winmm.waveOutUnprepareHeader(handle, header.ptr!, WAVE_HEADER_BYTES);
    Winmm.waveOutClose(handle);
    console.warn(`Audio submission failed (waveOut error ${writeResult}); continuing silently.`);
    return null;
  }

  let closed = false;
  return {
    close() {
      if (closed) return;
      closed = true;
      const resetResult = Winmm.waveOutReset(handle);
      if (resetResult !== 0) console.warn(`Audio reset returned waveOut error ${resetResult}.`);
      let unprepareResult = WAVE_ERROR_STILL_PLAYING;
      for (let attempt = 0; attempt < 100 && unprepareResult === WAVE_ERROR_STILL_PLAYING; attempt += 1) {
        unprepareResult = Winmm.waveOutUnprepareHeader(handle, header.ptr!, WAVE_HEADER_BYTES);
        if (unprepareResult === WAVE_ERROR_STILL_PLAYING) Bun.sleepSync(1);
      }
      if (unprepareResult !== 0) console.warn(`Audio header release returned waveOut error ${unprepareResult}.`);
      const closeResult = Winmm.waveOutClose(handle);
      if (closeResult !== 0) console.warn(`Audio device close returned waveOut error ${closeResult}.`);
      void samples;
    },
  };
}

function releaseTexture(texture: TextureResult | null): void {
  if (texture === null) return;
  comRelease(texture.uav ?? 0n);
  comRelease(texture.srv ?? 0n);
  comRelease(texture.rtv ?? 0n);
  comRelease(texture.tex);
}

const spectrum = await readSpectrum();
const sourceLabel = spectrum.live ? 'live Windows WLAN census' : 'deterministic offline score';
console.log(`Radio Cathedral — ${spectrum.signals.length} voices from ${sourceLabel}${spectrum.live ? ` (${spectrum.observedCount} nearby networks)` : ''}.`);
console.log('Move the light with the mouse · hold left click to open the radiance · Esc to leave.');

const window = createWindow({ title: 'RADIO CATHEDRAL — the invisible air, made sacred', width: WINDOW_WIDTH, height: WINDOW_HEIGHT, borderless: true });
let cathedralTextureA: TextureResult | null = null;
let cathedralTextureB: TextureResult | null = null;
let constantBuffer = 0n;
let linearSampler = 0n;
let vertexShader = 0n;
let cathedralPixelShader = 0n;
let presentPixelShader = 0n;
let choir: Choir | null = null;

try {
  const gpu = createDevice(window.hwnd, { width: WINDOW_WIDTH, height: WINDOW_HEIGHT });
  console.log(`D3D11: ${gpu.gpuName} (${gpu.driver}) · ${WINDOW_WIDTH}×${WINDOW_HEIGHT} R16G16B16A16 HDR`);

  const vertexCode = compile(FULLSCREEN_VERTEX_SHADER, 'main', 'vs_5_0');
  try {
    vertexShader = makeVertexShader(vertexCode);
  } finally {
    blobRelease(vertexCode.blob);
  }
  const cathedralCode = compile(CATHEDRAL_PIXEL_SHADER, 'main', 'ps_5_0');
  try {
    cathedralPixelShader = makePixelShader(cathedralCode);
  } finally {
    blobRelease(cathedralCode.blob);
  }
  const presentCode = compile(PRESENT_PIXEL_SHADER, 'main', 'ps_5_0');
  try {
    presentPixelShader = makePixelShader(presentCode);
  } finally {
    blobRelease(presentCode.blob);
  }

  cathedralTextureA = makeTexture({ w: WINDOW_WIDTH, h: WINDOW_HEIGHT, format: DXGI_FORMAT_R16G16B16A16_FLOAT, rtv: true, srv: true });
  cathedralTextureB = makeTexture({ w: WINDOW_WIDTH, h: WINDOW_HEIGHT, format: DXGI_FORMAT_R16G16B16A16_FLOAT, rtv: true, srv: true });
  clear(cathedralTextureA.rtv!, [0, 0, 0, 1]);
  clear(cathedralTextureB.rtv!, [0, 0, 0, 1]);
  constantBuffer = makeConstantBuffer(32 + MAX_SIGNALS * 16);
  linearSampler = makeSampler();
  const captureSequenceDirectory = Bun.env.CAPTURE_SEQUENCE_DIR;
  if (captureSequenceDirectory !== undefined) {
    mkdirSync(captureSequenceDirectory, { recursive: true });
    const existingFrame = readdirSync(captureSequenceDirectory).find((entry) => /^frame-\d+\.png$/.test(entry));
    if (existingFrame !== undefined) throw new Error(`Sequence directory already contains ${existingFrame}; choose an empty directory.`);
  }
  const cathedralState = createCathedralState(spectrum.signals);
  const captureWavePath = Bun.env.CAPTURE_WAV;
  const shouldSynthesizeChoir = Bun.env.NO_AUDIO !== '1' || captureWavePath !== undefined;
  const choirSamples = shouldSynthesizeChoir ? synthesizeChoir(spectrum.signals) : null;
  if (captureWavePath !== undefined && choirSamples !== null) {
    await writeChoirWave(captureWavePath, choirSamples);
    console.log(`Choir: ${captureWavePath} · ${AUDIO_LOOP_SECONDS}s seamless stereo PCM`);
  }
  if (choirSamples !== null) choir = startChoir(choirSamples);

  const startedAt = performance.now();
  let previousFrameAt = startedAt;
  let frameIndex = 0;
  let radiance = 0;
  let wheelRadiance = 0;
  let captured = false;
  const capturePath = Bun.env.CAPTURE_PNG;
  const requestedCaptureFrame = Number(Bun.env.CAPTURE_FRAME ?? 90);
  const captureFrame = Math.max(1, Math.trunc(Number.isFinite(requestedCaptureFrame) ? requestedCaptureFrame : 90));
  const requestedDurationMilliseconds = Number(Bun.env.DEMO_DURATION_MS ?? 0);
  const durationMilliseconds = Math.max(0, Number.isFinite(requestedDurationMilliseconds) ? requestedDurationMilliseconds : 0);
  const requestedCaptureFrames = Number(Bun.env.CAPTURE_SEQUENCE_FRAMES ?? 192);
  const captureSequenceFrames = Math.max(1, Math.trunc(Number.isFinite(requestedCaptureFrames) ? requestedCaptureFrames : 192));
  const requestedCaptureFps = Number(Bun.env.CAPTURE_FPS ?? 24);
  const captureFps = Math.max(1, Math.min(60, Math.trunc(Number.isFinite(requestedCaptureFps) ? requestedCaptureFps : 24)));
  const requestedWarmupFrames = Number(Bun.env.CAPTURE_SEQUENCE_WARMUP ?? 90);
  const captureSequenceWarmup = Math.max(0, Math.trunc(Number.isFinite(requestedWarmupFrames) ? requestedWarmupFrames : 90));
  let captureSequenceIndex = 0;
  if (captureSequenceDirectory !== undefined) {
    console.log(`Sequence: ${captureSequenceFrames} frames at ${captureFps} fps after ${captureSequenceWarmup} warm-up frames.`);
  }

  while (!window.shouldClose()) {
    window.pump();
    if (window.shouldClose()) break;

    const frameAt = performance.now();
    const sequenceCapture = captureSequenceDirectory !== undefined;
    const elapsedSeconds = sequenceCapture ? Math.max(0, frameIndex - captureSequenceWarmup) / captureFps : (frameAt - startedAt) / 1000;
    const deltaSeconds = sequenceCapture ? 1 / captureFps : Math.min(0.05, (frameAt - previousFrameAt) / 1000);
    previousFrameAt = frameAt;
    const mouseState = window.getMouse();
    const mouseHorizontal = sequenceCapture ? 0.5 + Math.cos(elapsedSeconds * 0.83) * 0.24 : mouseState.x / WINDOW_WIDTH;
    const mouseVertical = sequenceCapture ? 0.5 + Math.sin(elapsedSeconds * 0.67) * 0.18 : mouseState.y / WINDOW_HEIGHT;
    if (!sequenceCapture) {
      wheelRadiance = Math.max(-0.45, Math.min(1.25, wheelRadiance + window.getWheel() * 0.08));
      wheelRadiance *= 0.985;
    }
    const capturedRadiance = sequenceCapture ? Math.max(0, Math.sin(elapsedSeconds * 1.37 - 2.0)) ** 5 * 0.9 : 0;
    const targetRadiance = sequenceCapture ? capturedRadiance : (mouseState.down ? 1 : 0) + Math.max(0, wheelRadiance);
    radiance += (targetRadiance - radiance) * (1 - Math.exp(-deltaSeconds * 6.0));

    cathedralState.writeFloatLE(elapsedSeconds, 8);
    cathedralState.writeFloatLE(deltaSeconds, 12);
    cathedralState.writeFloatLE(mouseHorizontal, 16);
    cathedralState.writeFloatLE(mouseVertical, 20);
    cathedralState.writeFloatLE(radiance, 28);
    updateConstantBuffer(constantBuffer, cathedralState);

    const previousTexture = frameIndex % 2 === 0 ? cathedralTextureA : cathedralTextureB;
    const currentTexture = frameIndex % 2 === 0 ? cathedralTextureB : cathedralTextureA;
    setRenderTargets([currentTexture.rtv!]);
    setViewport(WINDOW_WIDTH, WINDOW_HEIGHT);
    vsSet(vertexShader, [constantBuffer]);
    psSet(cathedralPixelShader, { cb: [constantBuffer], srv: [previousTexture.srv!], samp: [linearSampler] });
    drawFullscreenTriangle();

    setRenderTargets([gpu.backBufferRTV]);
    setViewport(WINDOW_WIDTH, WINDOW_HEIGHT);
    vsSet(vertexShader, [constantBuffer]);
    psSet(presentPixelShader, { cb: [constantBuffer], srv: [currentTexture.srv!], samp: [linearSampler] });
    drawFullscreenTriangle();

    if (captureSequenceDirectory !== undefined && frameIndex >= captureSequenceWarmup && captureSequenceIndex < captureSequenceFrames) {
      const sequencePath = `${captureSequenceDirectory}/frame-${String(captureSequenceIndex).padStart(4, '0')}.png`;
      const snapshot = captureBackBuffer(gpu, sequencePath);
      if (!snapshot.ok) throw new Error(`Sequence capture failed: ${snapshot.note}`);
      captureSequenceIndex += 1;
      if (captureSequenceIndex % captureFps === 0 || captureSequenceIndex === captureSequenceFrames) console.log(`Sequence: ${captureSequenceIndex}/${captureSequenceFrames} frames.`);
    }

    const sequenceComplete = captureSequenceDirectory !== undefined && captureSequenceIndex >= captureSequenceFrames;
    const endingAfterFrame = sequenceComplete || (captureSequenceDirectory === undefined && durationMilliseconds > 0 && frameAt - startedAt >= durationMilliseconds);
    if (!captured && capturePath !== undefined && (frameIndex >= captureFrame || endingAfterFrame)) {
      const snapshot = captureBackBuffer(gpu, capturePath, { gridW: 40, gridH: 20 });
      captured = snapshot.ok;
      console.log(`Capture: ${snapshot.ok ? snapshot.path : snapshot.note} · non-black ${(snapshot.nonBlackFrac * 100).toFixed(1)}% · mean luma ${(snapshot.meanLuma * 100).toFixed(1)}%`);
      console.log(formatGrid(snapshot));
    }

    gpu.present(!sequenceCapture);
    frameIndex += 1;
    if (endingAfterFrame) break;
  }
} finally {
  choir?.close();
  comRelease(presentPixelShader);
  comRelease(cathedralPixelShader);
  comRelease(vertexShader);
  comRelease(linearSampler);
  comRelease(constantBuffer);
  releaseTexture(cathedralTextureB);
  releaseTexture(cathedralTextureA);
  destroyDevice();
  window.destroy();
}
