// Iris's HLSL. Every draw is a 4-vertex strip; its record index arrives through a per-instance vertex stream offset by
// DrawInstanced's StartInstanceLocation (SV_VertexID/SV_InstanceID both ignore the start offsets), so the
// whole frame's per-draw state lives in ONE structured buffer uploaded once per frame — no per-draw constant updates.
// Geometry is projected by a camera that maps the z = 0 plane 1:1 onto screen pixels, which is what lets a card fly
// out of the exact rectangle its window occupies and land back in it with zero drift.

export const DRAW_RECORD_FLOATS = 64; // 16 float4 = 256 bytes

const common = /* hlsl */ `
struct DrawRecord {
  row_major float4x4 world;
  float4 quad;     // xy = half extents of the drawn quad (shape + margin), zw = half extents of the shape
  float4 uvRect;   // texture coordinates spanning the shape: u0 v0 u1 v1
  float4 tint;     // rgb multiplier, a = alpha multiplier
  float4 shape;    // x = corner radius, y = opacity, z = saturation, w = brightness
  float4 effects;  // x = glare, yz = glare centre (unit space), w = focus ring
  float4 effects2; // x = shadow strength, y = shadow sigma, z = scan band (< 0 off), w = reflection
  float4 accent;   // rgb = accent colour, a = highlight count
  float4 extra;    // x = highlight offset, y = spotlight, z = lift glow, w = time offset
  float4 fill;     // premultiplied fill (panels)
  float4 border;   // premultiplied border (panels)
  float4 misc;     // free parameters per shader
  float4 misc2;
};

StructuredBuffer<DrawRecord> records : register(t2);
StructuredBuffer<float4> highlights : register(t3);
Texture2D content : register(t0);
Texture2D backdropBlur : register(t1);
SamplerState anisotropicSampler : register(s0);
SamplerState linearSampler : register(s1);

cbuffer Frame : register(b0) {
  float2 viewport;
  float cameraDistance;
  float time;
  float2 cameraCenter;
  float2 frameUnused;
};

struct Interpolants {
  float4 position : SV_Position;
  float2 local : TEXCOORD0;
  float2 uv : TEXCOORD1;
  nointerpolation uint index : TEXCOORD2;
};

float roundedBox(float2 position, float2 halfSize, float radius) {
  float2 q = abs(position) - halfSize + radius;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
}

float2 errorFunction(float2 x) {
  float2 s = sign(x);
  float2 a = abs(x);
  x = 1.0 + (0.278393 + (0.230389 + 0.078108 * (a * a)) * a) * a;
  x *= x;
  return s - s / (x * x);
}

float gaussian(float x, float sigma) {
  return exp(-(x * x) / (2.0 * sigma * sigma)) / (2.5066283 * sigma);
}

// Analytic Gaussian-blurred rounded rectangle: exact along x (erf), 4-tap integrated along y.
float shadowRow(float x, float y, float sigma, float corner, float2 halfSize) {
  float delta = min(halfSize.y - corner - abs(y), 0.0);
  float curved = halfSize.x - corner + sqrt(max(0.0, corner * corner - delta * delta));
  float2 integral = 0.5 + 0.5 * errorFunction((x + float2(-curved, curved)) * (0.70710678 / sigma));
  return integral.y - integral.x;
}

float boxShadow(float2 position, float2 halfSize, float sigma, float corner) {
  float low = position.y - halfSize.y;
  float high = position.y + halfSize.y;
  float start = clamp(-3.0 * sigma, low, high);
  float end = clamp(3.0 * sigma, low, high);
  float stepSize = (end - start) / 4.0;
  float y = start + stepSize * 0.5;
  float value = 0.0;
  [unroll] for (int index = 0; index < 4; index++) {
    value += shadowRow(position.x, position.y - y, sigma, corner, halfSize) * gaussian(y, sigma) * stepSize;
    y += stepSize;
  }
  return value;
}

float pixelWidth(float distance) {
  return max(length(float2(ddx(distance), ddy(distance))), 0.0001);
}
`;

export const vertexShader = /* hlsl */ `${common}
Interpolants vertexMain(uint vertexId : SV_VertexID, uint drawIndex : DRAWINDEX) {
  Interpolants output;
  uint index = drawIndex;
  uint corner = vertexId & 3;
  DrawRecord record = records[index];
  float2 unit = float2(corner & 1, corner >> 1) * 2.0 - 1.0;
  float2 local = unit * record.quad.xy;
  float4 world = mul(float4(local, 0.0, 1.0), record.world);
  float depth = max(world.z + cameraDistance, 1.0);
  output.position = float4((world.x - cameraCenter.x) * cameraDistance / (viewport.x * 0.5), -(world.y - cameraCenter.y) * cameraDistance / (viewport.y * 0.5), 0.5 * depth, depth);
  float2 shapeUnit = local / max(record.quad.zw, 0.0001) * 0.5 + 0.5;
  output.uv = lerp(record.uvRect.xy, record.uvRect.zw, shapeUnit);
  output.local = local;
  output.index = index;
  return output;
}
`;

export const cardShader = /* hlsl */ `${common}
float4 cardMain(Interpolants input) : SV_Target {
  DrawRecord record = records[input.index];
  float2 halfSize = record.quad.zw;
  float radius = record.shape.x;
  float distance = roundedBox(input.local, halfSize, radius);
  float pixel = pixelWidth(distance);
  float coverage = saturate(0.5 - distance / pixel);
  float2 unit = input.local / halfSize * 0.5 + 0.5;

  float4 result = 0.0;
  if (record.effects2.x > 0.0) {
    float sigma = record.effects2.y;
    float shadow = boxShadow(input.local - float2(0.0, sigma * 0.5), halfSize, sigma, radius);
    result = float4(0.0, 0.0, 0.0, saturate(shadow * record.effects2.x));
  }

  float focus = record.effects.w;
  if (focus > 0.0) {
    float outside = max(distance, 0.0);
    float glow = exp(-outside / 14.0) * 0.45 + saturate(1.0 - abs(distance - 3.0) / (1.25 + pixel)) * 0.95;
    float alpha = saturate(glow * focus) * (1.0 - coverage);
    result = float4(record.accent.rgb * alpha, alpha) + result * (1.0 - alpha);
  }

  float4 texel = content.Sample(anisotropicSampler, input.uv);
  float3 color = texel.rgb;
  float luminance = dot(color, float3(0.2126, 0.7152, 0.0722));
  color = lerp(luminance.xxx, color, record.shape.z) * record.shape.w;

  uint count = (uint)record.accent.a;
  if (count > 0) {
    uint offset = (uint)record.extra.x;
    float inside = 0.0;
    float ring = 0.0;
    float halo = 0.0;
    for (uint index = 0; index < count; index++) {
      float4 rect = highlights[offset + index];
      float2 low = rect.xy * 2.0 * halfSize - halfSize;
      float2 high = rect.zw * 2.0 * halfSize - halfSize;
      float2 boxHalf = (high - low) * 0.5 + 3.0;
      float boxDistance = roundedBox(input.local - (low + high) * 0.5, boxHalf, min(boxHalf.y, 7.0));
      float boxPixel = pixelWidth(boxDistance);
      inside = max(inside, saturate(0.5 - boxDistance / boxPixel));
      ring = max(ring, saturate(1.0 - abs(boxDistance) / (boxPixel * 1.6)));
      halo = max(halo, exp(-max(boxDistance, 0.0) / 9.0));
    }
    float spotlight = record.extra.y;
    color *= lerp(1.0, lerp(0.46, 1.0, inside), spotlight);
    color = lerp(color, color * 0.55 + record.accent.rgb * 0.55, inside * 0.30 * spotlight);
    color += record.accent.rgb * (halo * (1.0 - inside) * 0.55 + ring * 0.9) * spotlight;
  }

  color += saturate(1.0 - abs(distance + 0.75) / max(pixel, 0.5)) * 0.16;

  if (record.effects.x > 0.0) {
    float2 delta = (unit - record.effects.yz) * float2(1.0, halfSize.y / halfSize.x);
    color += pow(saturate(1.0 - length(delta) * 1.15), 3.0) * record.effects.x;
  }

  if (record.effects2.z > -0.5) {
    float band = exp(-pow((unit.y - record.effects2.z) * 16.0, 2.0));
    color = lerp(color, color * 0.85 + record.accent.rgb * 0.75 + 0.08, band * 0.55);
  }

  float4 card = float4(color, 1.0) * coverage;
  result = card + result * (1.0 - card.a);
  if (record.effects2.w > 0.0) result *= record.effects2.w * pow(saturate(unit.y * 1.6 - 0.6), 2.2);
  return result * record.shape.y;
}
`;

export const textShader = /* hlsl */ `${common}
float4 textMain(Interpolants input) : SV_Target {
  DrawRecord record = records[input.index];
  float4 texel;
  float softness = record.shape.x;
  if (softness > 0.0) {
    texel = 0.0;
    float total = 0.0;
    [unroll] for (int y = -2; y <= 2; y++) {
      [unroll] for (int x = -2; x <= 2; x++) {
        float weight = exp(-(x * x + y * y) / 4.5);
        texel += content.SampleLevel(linearSampler, input.uv + float2(x, y) * record.misc.xy * softness, 0) * weight;
        total += weight;
      }
    }
    texel /= total;
  } else {
    texel = content.Sample(linearSampler, input.uv);
  }
  return float4(texel.rgb * record.tint.rgb, texel.a) * record.tint.a * record.shape.y;
}
`;

export const panelShader = /* hlsl */ `${common}
float4 panelMain(Interpolants input) : SV_Target {
  DrawRecord record = records[input.index];
  float2 halfSize = record.quad.zw;
  float radius = record.shape.x;
  float distance = roundedBox(input.local, halfSize, radius);
  float pixel = pixelWidth(distance);
  float coverage = saturate(0.5 - distance / pixel);
  float2 unit = input.local / halfSize * 0.5 + 0.5;

  float4 result = 0.0;
  if (record.effects2.x > 0.0) {
    float sigma = record.effects2.y;
    float shadow = boxShadow(input.local - float2(0.0, sigma * 0.4), halfSize, sigma, radius);
    result = float4(0.0, 0.0, 0.0, saturate(shadow * record.effects2.x));
  }

  float2 screenUv = input.position.xy / viewport;
  float3 frosted = backdropBlur.SampleLevel(linearSampler, lerp(record.uvRect.xy, record.uvRect.zw, screenUv), 0).rgb;
  float frost = record.misc.x;
  float3 body = frosted * frost * record.misc.y + record.fill.rgb;
  body += (1.0 - unit.y) * record.misc.z;
  float bodyAlpha = saturate(frost + record.fill.a);
  float4 panel = float4(body, bodyAlpha) * coverage;
  float edge = saturate(1.0 - abs(distance + 0.5) / max(pixel, 0.5)) * (0.65 + 0.35 * (1.0 - unit.y));
  panel = record.border * edge + panel * (1.0 - record.border.a * edge);
  result = panel + result * (1.0 - panel.a);
  return result * record.shape.y;
}
`;

export const backdropShader = /* hlsl */ `${common}
float4 backdropMain(Interpolants input) : SV_Target {
  DrawRecord record = records[input.index];
  float2 screenUv = input.position.xy / viewport;
  float2 uv = lerp(record.uvRect.xy, record.uvRect.zw, screenUv);
  float blur = record.shape.z;
  float3 sharp = content.SampleLevel(linearSampler, uv, blur * 5.0).rgb;
  float3 soft = backdropBlur.SampleLevel(linearSampler, uv, 0).rgb;
  float3 color = lerp(sharp, soft, smoothstep(0.35, 1.0, blur));
  float luminance = dot(color, float3(0.2126, 0.7152, 0.0722));
  color = lerp(luminance.xxx, color, record.effects.z) * record.shape.w;
  float2 centered = (screenUv - 0.5) * float2(min(viewport.x / viewport.y, 2.0), 1.0);
  color *= saturate(1.0 - dot(centered, centered) * record.effects.x);
  color += record.accent.rgb * pow(saturate(1.0 - length((screenUv - float2(0.5, -0.15)) * float2(viewport.x / viewport.y * 0.35, 1.0))), 2.0) * record.accent.a;
  float noise = frac(sin(dot(input.position.xy + frac(time) * 97.0, float2(12.9898, 78.233))) * 43758.5453);
  color += (noise - 0.5) * record.effects.y;
  return float4(color, 1.0) * record.shape.y;
}
`;

export const blurShader = /* hlsl */ `${common}
float4 blurMain(Interpolants input) : SV_Target {
  DrawRecord record = records[input.index];
  float2 stepUv = record.misc.xy;
  float level = record.misc.z;
  float4 sum = 0.0;
  float total = 0.0;
  [unroll] for (int tap = -7; tap <= 7; tap++) {
    float weight = exp(-(tap * tap) / 24.5);
    sum += content.SampleLevel(linearSampler, input.uv + stepUv * tap, level) * weight;
    total += weight;
  }
  return sum / total;
}
`;
