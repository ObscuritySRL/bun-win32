// Row-vector 4×4 transforms (p' = p · M) shared by the renderer and hit-testing. The projection mirrors the vertex
// shader exactly, so what the pointer hits is precisely what the GPU drew — including tilted cards in Flow and Stack.

export interface Camera {
  centerX: number;
  centerY: number;
  distance: number;
}

export interface Rect {
  height: number;
  width: number;
  x: number;
  y: number;
}

/** World matrix for a quad centred on the origin: scale, tilt about X, turn about Y, then translate. */
export function composeTransform(out: Float32Array, x: number, y: number, z: number, rotationX: number, rotationY: number, scale: number): Float32Array {
  const cosineX = Math.cos(rotationX);
  const sineX = Math.sin(rotationX);
  const cosineY = Math.cos(rotationY);
  const sineY = Math.sin(rotationY);
  out[0] = scale * cosineY;
  out[1] = 0;
  out[2] = scale * sineY;
  out[3] = 0;
  out[4] = -scale * sineX * sineY;
  out[5] = scale * cosineX;
  out[6] = scale * sineX * cosineY;
  out[7] = 0;
  out[8] = -scale * cosineX * sineY;
  out[9] = -scale * sineX;
  out[10] = scale * cosineX * cosineY;
  out[11] = 0;
  out[12] = x;
  out[13] = y;
  out[14] = z;
  out[15] = 1;
  return out;
}

/** `out = translate(offsetX, offsetY) · world` — places a child quad at a local offset inside `world`'s space. */
export function offsetTransform(out: Float32Array, world: Float32Array, offsetX: number, offsetY: number, scale = 1): Float32Array {
  for (let index = 0; index < 12; index += 1) out[index] = world[index]! * scale;
  out[12] = offsetX * world[0]! + offsetY * world[4]! + world[12]!;
  out[13] = offsetX * world[1]! + offsetY * world[5]! + world[13]!;
  out[14] = offsetX * world[2]! + offsetY * world[6]! + world[14]!;
  out[15] = 1;
  return out;
}

/** Mirror `world` across the horizontal plane y = floorY (the Flow layout's reflective floor). */
export function reflectTransform(out: Float32Array, world: Float32Array, floorY: number): Float32Array {
  for (let index = 0; index < 16; index += 1) out[index] = world[index]!;
  out[1] = -world[1]!;
  out[5] = -world[5]!;
  out[9] = -world[9]!;
  out[13] = 2 * floorY - world[13]!;
  return out;
}

/** Project a local point through `world` and the camera to screen pixels. */
export function project(world: Float32Array, localX: number, localY: number, camera: Camera, out: { x: number; y: number }): { x: number; y: number } {
  const worldX = localX * world[0]! + localY * world[4]! + world[12]!;
  const worldY = localX * world[1]! + localY * world[5]! + world[13]!;
  const worldZ = localX * world[2]! + localY * world[6]! + world[14]!;
  const depth = Math.max(worldZ + camera.distance, 1);
  out.x = camera.centerX + ((worldX - camera.centerX) * camera.distance) / depth;
  out.y = camera.centerY + ((worldY - camera.centerY) * camera.distance) / depth;
  return out;
}

const corner = { x: 0, y: 0 };
const corners = new Float64Array(8);

/** Whether screen point (x, y) lies inside the projected quad of half extents (halfWidth, halfHeight). */
export function hitQuad(world: Float32Array, halfWidth: number, halfHeight: number, camera: Camera, x: number, y: number): boolean {
  project(world, -halfWidth, -halfHeight, camera, corner);
  corners[0] = corner.x;
  corners[1] = corner.y;
  project(world, halfWidth, -halfHeight, camera, corner);
  corners[2] = corner.x;
  corners[3] = corner.y;
  project(world, halfWidth, halfHeight, camera, corner);
  corners[4] = corner.x;
  corners[5] = corner.y;
  project(world, -halfWidth, halfHeight, camera, corner);
  corners[6] = corner.x;
  corners[7] = corner.y;
  let sign = 0;
  for (let index = 0; index < 4; index += 1) {
    const ax = corners[index * 2]!;
    const ay = corners[index * 2 + 1]!;
    const bx = corners[((index + 1) % 4) * 2]!;
    const by = corners[((index + 1) % 4) * 2 + 1]!;
    const cross = (bx - ax) * (y - ay) - (by - ay) * (x - ax);
    if (cross === 0) continue;
    const side = cross > 0 ? 1 : -1;
    if (sign === 0) sign = side;
    else if (side !== sign) return false;
  }
  return true;
}
