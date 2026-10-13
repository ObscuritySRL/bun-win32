// The eye's HLSL. One full-screen pass draws the whole scene below the text: the backdrop (the
// moment itself, mip-blurred and sunk into ink as the overlay opens), the card (rounded, shadowed,
// tinted when in the past, glowing where tiles just changed, dimmed outside a region), and the glass
// shelf with its waveform track. `sceneLayout` and the HLSL cbuffer below are the same declaration
// order, all float4, so offsets match byte for byte.

import { cbufferLayout } from '@bun-win32/gpu';

export const sceneLayout = cbufferLayout({
  viewport: 'float4',
  card: 'float4',
  cardStyle: 'float4',
  moment: 'float4',
  region: 'float4',
  regionStyle: 'float4',
  cursor: 'float4',
  shelf: 'float4',
  shelfStyle: 'float4',
  track: 'float4',
  playhead: 'float4',
  accent: 'float4',
  accentGlow: 'float4',
  glass: 'float4',
  ink: 'float4',
  now: 'float4',
  shimmer: 'float4',
  counts: 'float4',
  tertiary: 'float4',
  shadowStyle: 'float4',
});

export const fullscreenVertexShader = `struct Varyings { float4 position : SV_Position; };
Varyings main(uint vertex : SV_VertexID) {
  Varyings output;
  float2 corner = float2((vertex << 1) & 2, vertex & 2);
  output.position = float4(corner * float2(2.0, -2.0) + float2(-1.0, 1.0), 0.0, 1.0);
  return output;
}`;

export const scenePixelShader = `cbuffer Scene : register(b0) {
  float4 viewport;     // width, height, scale (pixels per DIP), unused
  float4 card;         // left, top, right, bottom (px)
  float4 cardStyle;    // radius (px), shadow opacity, past tint, backdrop progress
  float4 moment;       // moment width, height, tiles across, tiles down
  float4 region;       // left, top, right, bottom (moment px)
  float4 regionStyle;  // opacity
  float4 cursor;       // x, y (moment px), opacity, radius (px)
  float4 shelf;        // left, top, right, bottom (px)
  float4 shelfStyle;   // radius (px), opacity, live (0..1), unused
  float4 track;        // left, top, right, bottom (px)
  float4 playhead;     // x (px), hover x (px), hover opacity, playhead opacity
  float4 accent;
  float4 accentGlow;
  float4 glass;
  float4 ink;
  float4 now;
  float4 shimmer;      // intensity (0..1), opacity, unused, unused
  float4 counts;       // bin count, mark count, bar pitch (px), unused
  float4 tertiary;
  float4 shadowStyle;  // ambient blur, ambient opacity, key blur, key offset (all px / opacity)
};

Texture2D<float4> momentTexture : register(t0);
Texture2D<float4> blurTexture : register(t1);
Texture2D<float> binsTexture : register(t2);
Texture2D<float> shimmerTexture : register(t3);
StructuredBuffer<float4> marks : register(t4);
SamplerState linearClamp : register(s0);

float roundedBox(float2 position, float2 halfSize, float cornerRadius) {
  float2 q = abs(position) - halfSize + cornerRadius;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - cornerRadius;
}

// A mip level is a box filter; four diagonal taps one texel apart round its blocks into a tent.
float3 blurred(float2 uv, float level) {
  float2 offset = exp2(level) * 0.75 / viewport.xy;
  float3 sum = blurTexture.SampleLevel(linearClamp, uv, level).rgb * 0.4;
  sum += blurTexture.SampleLevel(linearClamp, uv + float2(offset.x, offset.y), level).rgb * 0.15;
  sum += blurTexture.SampleLevel(linearClamp, uv + float2(-offset.x, offset.y), level).rgb * 0.15;
  sum += blurTexture.SampleLevel(linearClamp, uv + float2(offset.x, -offset.y), level).rgb * 0.15;
  sum += blurTexture.SampleLevel(linearClamp, uv + float2(-offset.x, -offset.y), level).rgb * 0.15;
  return sum;
}

float4 main(float4 position : SV_Position) : SV_Target {
  float2 pixel = position.xy;
  float2 screenUv = pixel / viewport.xy;
  float progress = cardStyle.w;

  // Backdrop: frame 0 is the moment itself; it then blurs (mip level) and sinks into ink.
  float3 sharp = momentTexture.SampleLevel(linearClamp, screenUv, 0).rgb;
  // The blur follows the card, so the light around it comes from the content at its edges.
  float2 ambientUv = lerp(screenUv, 0.5 + (pixel - (card.xy + card.zw) * 0.5) / (card.zw - card.xy) * 0.92, progress);
  float3 soft = blurred(ambientUv, 6.0 * progress);
  float3 sunk = lerp(ink.rgb, soft, 0.2);
  float vignette = 1.0 - 0.35 * smoothstep(0.35, 1.25, length((screenUv - 0.5) * float2(1.0, viewport.y / viewport.x) * 2.0));
  float3 color = lerp(sharp, sunk * lerp(1.0, vignette, progress), smoothstep(0.0, 1.0, progress));

  // Card shadow: an ambient layer and a key layer offset downward.
  float2 cardCenter = (card.xy + card.zw) * 0.5;
  float2 cardHalf = (card.zw - card.xy) * 0.5;
  float cardDistance = roundedBox(pixel - cardCenter, cardHalf, cardStyle.x);
  float keyDistance = roundedBox(pixel - cardCenter - float2(0.0, shadowStyle.w), cardHalf, cardStyle.x);
  float ambient = shadowStyle.y * pow(saturate(1.0 - max(cardDistance, 0.0) / shadowStyle.x), 2.2);
  float key = 0.3 * pow(saturate(1.0 - max(keyDistance, 0.0) / shadowStyle.z), 2.0);
  color *= 1.0 - cardStyle.y * saturate(ambient + key);

  // Card: the moment, mapped 1:1 at scale 1 so frame 0 is pixel-identical to the screen.
  float cardCoverage = saturate(0.5 - cardDistance);
  if (cardCoverage > 0.0) {
    float2 cardUv = (pixel - card.xy) / (card.zw - card.xy);
    float2 momentPixel = cardUv * moment.xy;
    float3 picture = momentTexture.SampleLevel(linearClamp, cardUv, 0).rgb;
    float tint = cardStyle.z;
    // The past reads cooler, with a thin inner edge — never strong enough to change what you read.
    picture = lerp(picture, picture * float3(0.97, 0.99, 1.02), tint);
    picture *= 1.0 - tint * 0.07 * smoothstep(-28.0 * viewport.z, 0.0, cardDistance);

    float changed = shimmerTexture.SampleLevel(linearClamp, momentPixel / 64.0 / moment.zw, 0);
    picture = lerp(picture, accentGlow.rgb, changed * shimmer.x * shimmer.y);

    float regionOpacity = regionStyle.x;
    if (regionOpacity > 0.0) {
      float2 regionCenter = (region.xy + region.zw) * 0.5;
      float2 regionHalf = (region.zw - region.xy) * 0.5;
      float pixelsPerMoment = (card.z - card.x) / moment.x;
      float regionDistance = roundedBox(momentPixel - regionCenter, regionHalf, 2.0 / pixelsPerMoment) * pixelsPerMoment;
      picture *= lerp(1.0, 0.5, regionOpacity * smoothstep(-0.5, 0.5, regionDistance));
      float border = saturate(1.6 - abs(regionDistance));
      float glow = exp(-abs(regionDistance) / 5.0) * 0.35;
      picture = lerp(picture, accent.rgb, saturate(border + glow) * regionOpacity);
    }

    if (cursor.z > 0.0) {
      float pixelsPerMoment = (card.z - card.x) / moment.x;
      float ring = abs(length((momentPixel - cursor.xy) * pixelsPerMoment) - cursor.w);
      picture = lerp(picture, float3(0.0, 0.0, 0.0), saturate(2.6 - ring) * 0.45 * cursor.z);
      picture = lerp(picture, now.rgb, saturate(1.4 - ring) * cursor.z);
    }
    color = lerp(color, picture, cardCoverage);
  }

  // Shelf: glass over the backdrop, a top-lit hairline, then the waveform track.
  float shelfOpacity = shelfStyle.y;
  if (shelfOpacity > 0.0) {
    float2 shelfCenter = (shelf.xy + shelf.zw) * 0.5;
    float2 shelfHalf = (shelf.zw - shelf.xy) * 0.5;
    float shelfDistance = roundedBox(pixel - shelfCenter, shelfHalf, shelfStyle.x);
    float shelfCoverage = saturate(0.5 - shelfDistance) * shelfOpacity;
    if (shelfCoverage > 0.0) {
      float3 panel = lerp(color, glass.rgb, glass.a);
      float hairline = saturate(1.0 - abs(shelfDistance + 0.5)) * smoothstep(shelfCenter.y, shelf.y, pixel.y);
      panel = lerp(panel, float3(1.0, 1.0, 1.0), hairline * 0.09);

      if (pixel.x >= track.x && pixel.x <= track.z && pixel.y >= track.y - 10.0 && pixel.y <= track.w + 10.0) {
        float trackWidth = track.z - track.x;
        float pitch = counts.z;
        float barIndex = floor((pixel.x - track.x) / pitch);
        float within = (pixel.x - track.x) - barIndex * pitch;
        float barCenter = track.x + (barIndex + 0.5) * pitch;
        float amplitude = binsTexture.SampleLevel(linearClamp, float2((barCenter - track.x) / trackWidth, 0.5), 0);
        float middle = (track.y + track.w) * 0.5;
        float halfHeight = max(1.0 * viewport.z, amplitude * (track.w - track.y) * 0.5);
        float barMask = saturate(pitch * 0.62 - within + 0.5) * saturate(halfHeight - abs(pixel.y - middle) + 0.5);
        bool newer = barCenter >= playhead.x;
        float3 barColor = newer ? accent.rgb : tertiary.rgb;
        panel = lerp(panel, barColor, barMask * (newer ? 1.0 : 0.75));
        if (newer) panel += accentGlow.rgb * accentGlow.a * exp(-max(abs(pixel.y - middle) - halfHeight, 0.0) / (3.0 * viewport.z)) * 0.25 * amplitude;

        [loop] for (uint index = 0; index < (uint)counts.y; index++) {
          float4 mark = marks[index];
          if (mark.z > 0.5) {
            if (pixel.x >= mark.x && pixel.x <= mark.y) {
              float stripe = step(0.5, frac((pixel.x + pixel.y) / (6.0 * viewport.z)));
              panel = lerp(panel, tertiary.rgb, 0.22 * stripe);
            }
          } else {
            float markDistance = length(pixel - float2(mark.x, track.y - 6.0 * viewport.z));
            panel = lerp(panel, float3(0.82, 0.85, 0.9), saturate(2.2 * viewport.z - markDistance) * 0.85);
          }
        }

        float hover = abs(pixel.x - playhead.y);
        panel = lerp(panel, float3(0.85, 0.87, 0.92), saturate(0.75 * viewport.z - hover) * playhead.z * 0.45);
        float headDistance = abs(pixel.x - playhead.x);
        float3 headColor = lerp(accent.rgb, now.rgb, shelfStyle.z);
        panel = lerp(panel, headColor, saturate(1.1 * viewport.z - headDistance) * playhead.w);
        panel += headColor * exp(-headDistance / (4.0 * viewport.z)) * 0.18 * playhead.w;
      }
      color = lerp(color, panel, shelfCoverage);
    }
  }
  return float4(color, 1.0);
}`;
