/**
 * Offline trainer for digit-oracle (one-off; NOT shipped, NOT run at demo time).
 *
 * Trains a small CONVOLUTIONAL network on the REAL MNIST handwritten-digit dataset
 * (not synthetic font glyphs — that was the cause of the old demo's terrible guesses
 * on mouse-drawn strokes). The IDX files are downloaded once into ./.mnist (gitignored)
 * from the public cvdf mirror, parsed, and fed through pure-TypeScript forward/backward
 * passes. Architecture:
 *
 *   input 1x28x28
 *   conv3x3  1->C1 (pad 1)  -> ReLU -> maxpool2x2   -> C1 x14x14
 *   conv3x3 C1->C2 (pad 1)  -> ReLU -> maxpool2x2   -> C2 x 7x 7
 *   flatten (C2*49) -> FC -> 10 -> softmax
 *
 * Weights are baked into example/digit-oracle.weights.ts (base64 of raw Float32) in
 * a layout the GPU compute demo reads back. We also bake a handful of held-out MNIST
 * TEST glyphs (correctly classified) so an unattended screenshot is meaningful, and
 * run a final pipeline self-check (MNIST test acc + simulated thick-stroke acc) so we
 * KNOW the model + live preprocessing agree before shipping.
 *
 * Run: bun run packages/all/example/digit-oracle.train.ts
 */
import { gunzipSync } from 'node:zlib';

// ── Hyperparameters / architecture ──────────────────────────────────────────────
const GRID = 28;
const C1 = 8; // conv1 output channels
const C2 = 16; // conv2 output channels
const K = 3; // kernel size
const PAD = 1;
const FC_IN = C2 * 7 * 7; // 16*49 = 784 flatten
const N_OUT = 10;

const EPOCHS = 4; // accuracy plateaus ~98.9% by epoch 3-4; stop before the long tail
const BATCH = 32;
const LR0 = 0.04;
const MOMENTUM = 0.9;
const WEIGHT_DECAY = 1e-4;
const TRAIN_LIMIT = 60000; // use full train set
const TEST_LIMIT = 10000;

// ── Deterministic PRNG ───────────────────────────────────────────────────────────
let seed = 0x1234abcd >>> 0;
function rand(): number {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 0x1_0000_0000;
}
function randn(): number {
  // Box-Muller.
  let u = 0;
  let v = 0;
  while (u === 0) u = rand();
  while (v === 0) v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// ── MNIST download + IDX parse ───────────────────────────────────────────────────
const MNIST_DIR = `${import.meta.dir}/.mnist`;
const MIRROR = 'https://storage.googleapis.com/cvdf-datasets/mnist';

async function ensureFile(name: string): Promise<Uint8Array> {
  const rawPath = `${MNIST_DIR}/${name}`;
  const raw = Bun.file(rawPath);
  if (await raw.exists()) return new Uint8Array(await raw.arrayBuffer());
  // Decompress from the .gz if present, else download the .gz first.
  const gzPath = `${rawPath}.gz`;
  let gzFile = Bun.file(gzPath);
  if (!(await gzFile.exists())) {
    console.log(`  downloading ${name}.gz ...`);
    const res = await fetch(`${MIRROR}/${name}.gz`);
    if (!res.ok) throw new Error(`download failed for ${name}.gz: ${res.status}`);
    await Bun.write(gzPath, await res.arrayBuffer());
    gzFile = Bun.file(gzPath);
  }
  const bytes = gunzipSync(new Uint8Array(await gzFile.arrayBuffer()));
  await Bun.write(rawPath, bytes);
  return new Uint8Array(bytes);
}

function be32(b: Uint8Array, off: number): number {
  return ((b[off]! << 24) | (b[off + 1]! << 16) | (b[off + 2]! << 8) | b[off + 3]!) >>> 0;
}

interface Dataset {
  images: Uint8Array; // count * 784, row-major 28x28 grayscale 0..255
  labels: Uint8Array; // count
  count: number;
}

async function loadSet(imgName: string, lblName: string, limit: number): Promise<Dataset> {
  const imgBytes = await ensureFile(imgName);
  const lblBytes = await ensureFile(lblName);
  if (be32(imgBytes, 0) !== 0x803) throw new Error(`bad image magic in ${imgName}`);
  if (be32(lblBytes, 0) !== 0x801) throw new Error(`bad label magic in ${lblName}`);
  const n = Math.min(be32(imgBytes, 4), be32(lblBytes, 4), limit);
  const rows = be32(imgBytes, 8);
  const cols = be32(imgBytes, 12);
  if (rows !== 28 || cols !== 28) throw new Error(`unexpected dims ${rows}x${cols}`);
  const images = imgBytes.subarray(16, 16 + n * 784);
  const labels = lblBytes.subarray(8, 8 + n);
  return { images: images.slice(), labels: labels.slice(), count: n };
}

// ── Shared MNIST-style preprocessing (MUST mirror the live demo) ──────────────────
// Given a 28x28 grayscale image (0..1), crop to the ink bbox, scale the longer side
// to ~20px (area-resample), and place it center-of-mass into a 28x28 field with the
// standard ~4px border. Returns a fresh Float32Array(784) normalized to ~[0,1].
export function mnistNormalize(src: Float32Array, threshold = 0.08): Float32Array {
  let minX = 28;
  let minY = 28;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < 28; y += 1) {
    for (let x = 0; x < 28; x += 1) {
      if (src[y * 28 + x]! > threshold) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  const out = new Float32Array(784);
  if (maxX < minX) return out; // empty
  const bw = maxX - minX + 1;
  const bh = maxY - minY + 1;
  const scale = 20 / Math.max(bw, bh);
  const ow = bw * scale;
  const oh = bh * scale;
  // First resample the cropped box into a tight ow x oh staging region, then center
  // it by center of mass into the 28x28 field.
  const tw = Math.max(1, Math.round(ow));
  const th = Math.max(1, Math.round(oh));
  const staged = new Float32Array(tw * th);
  for (let py = 0; py < th; py += 1) {
    for (let px = 0; px < tw; px += 1) {
      // Box / area sample of the source bbox region.
      const sx0 = minX + (px / tw) * bw;
      const sx1 = minX + ((px + 1) / tw) * bw;
      const sy0 = minY + (py / th) * bh;
      const sy1 = minY + ((py + 1) / th) * bh;
      let acc = 0;
      let cnt = 0;
      const ix0 = Math.floor(sx0);
      const ix1 = Math.min(27, Math.ceil(sx1) - 1);
      const iy0 = Math.floor(sy0);
      const iy1 = Math.min(27, Math.ceil(sy1) - 1);
      for (let yy = iy0; yy <= iy1; yy += 1) {
        for (let xx = ix0; xx <= ix1; xx += 1) {
          acc += src[yy * 28 + xx]!;
          cnt += 1;
        }
      }
      staged[py * tw + px] = cnt > 0 ? acc / cnt : 0;
    }
  }
  // Center of mass of the staged glyph.
  let sum = 0;
  let cx = 0;
  let cy = 0;
  for (let y = 0; y < th; y += 1) {
    for (let x = 0; x < tw; x += 1) {
      const v = staged[y * tw + x]!;
      sum += v;
      cx += x * v;
      cy += y * v;
    }
  }
  if (sum < 1e-4) return out;
  cx /= sum;
  cy /= sum;
  // Place so the center of mass lands at (13.5, 13.5).
  const offX = Math.round(13.5 - cx);
  const offY = Math.round(13.5 - cy);
  for (let y = 0; y < th; y += 1) {
    for (let x = 0; x < tw; x += 1) {
      const dx = x + offX;
      const dy = y + offY;
      if (dx >= 0 && dx < 28 && dy >= 0 && dy < 28) out[dy * 28 + dx] = staged[y * tw + x]!;
    }
  }
  return out;
}

// Simulate a thick mouse stroke from a clean MNIST glyph: dilate + slight blur. Used
// only to MEASURE robustness of (model + preprocessing) to fat strokes.
function thickenStroke(src: Float32Array): Float32Array {
  const dil = new Float32Array(784);
  for (let y = 0; y < 28; y += 1) {
    for (let x = 0; x < 28; x += 1) {
      let m = 0;
      for (let oy = -1; oy <= 1; oy += 1) {
        for (let ox = -1; ox <= 1; ox += 1) {
          const nx = x + ox;
          const ny = y + oy;
          if (nx >= 0 && nx < 28 && ny >= 0 && ny < 28) m = Math.max(m, src[ny * 28 + nx]!);
        }
      }
      dil[y * 28 + x] = m;
    }
  }
  // 3x3 box blur to soften.
  const out = new Float32Array(784);
  for (let y = 0; y < 28; y += 1) {
    for (let x = 0; x < 28; x += 1) {
      let acc = 0;
      let cnt = 0;
      for (let oy = -1; oy <= 1; oy += 1) {
        for (let ox = -1; ox <= 1; ox += 1) {
          const nx = x + ox;
          const ny = y + oy;
          if (nx >= 0 && nx < 28 && ny >= 0 && ny < 28) {
            acc += dil[ny * 28 + nx]!;
            cnt += 1;
          }
        }
      }
      out[y * 28 + x] = acc / cnt;
    }
  }
  return out;
}

// ── Model parameters ─────────────────────────────────────────────────────────────
// Conv1 weights: [C1][1][K][K], bias [C1].
const w1 = new Float32Array(C1 * 1 * K * K);
const b1 = new Float32Array(C1);
// Conv2 weights: [C2][C1][K][K], bias [C2].
const w2 = new Float32Array(C2 * C1 * K * K);
const b2 = new Float32Array(C2);
// FC weights: [N_OUT][FC_IN], bias [N_OUT].
const wf = new Float32Array(N_OUT * FC_IN);
const bf = new Float32Array(N_OUT);

// He init.
{
  const s1 = Math.sqrt(2 / (1 * K * K));
  for (let i = 0; i < w1.length; i += 1) w1[i] = randn() * s1;
  const s2 = Math.sqrt(2 / (C1 * K * K));
  for (let i = 0; i < w2.length; i += 1) w2[i] = randn() * s2;
  const sf = Math.sqrt(2 / FC_IN);
  for (let i = 0; i < wf.length; i += 1) wf[i] = randn() * sf;
}

// Momentum velocity buffers.
const vw1 = new Float32Array(w1.length);
const vb1 = new Float32Array(b1.length);
const vw2 = new Float32Array(w2.length);
const vb2 = new Float32Array(b2.length);
const vwf = new Float32Array(wf.length);
const vbf = new Float32Array(bf.length);

// ── Forward activations (reused per sample) ──────────────────────────────────────
const a1 = new Float32Array(C1 * 28 * 28); // conv1 + ReLU
const p1 = new Float32Array(C1 * 14 * 14); // pool1
const p1arg = new Int32Array(C1 * 14 * 14); // argmax index within input for pool1
const a2 = new Float32Array(C2 * 14 * 14); // conv2 + ReLU
const p2 = new Float32Array(C2 * 7 * 7); // pool2 (== flatten)
const p2arg = new Int32Array(C2 * 7 * 7);
const logits = new Float32Array(N_OUT);
const probs = new Float32Array(N_OUT);

// Gradients (reused per sample).
const gw1 = new Float32Array(w1.length);
const gb1 = new Float32Array(b1.length);
const gw2 = new Float32Array(w2.length);
const gb2 = new Float32Array(b2.length);
const gwf = new Float32Array(wf.length);
const gbf = new Float32Array(bf.length);
const dp2 = new Float32Array(p2.length);
const da2 = new Float32Array(a2.length);
const dp1 = new Float32Array(p1.length);
const da1 = new Float32Array(a1.length);

// conv1 helper: input is 1x28x28 (the image). Output a1 = relu(conv).
function conv1(img: Float32Array): void {
  for (let oc = 0; oc < C1; oc += 1) {
    const wbase = oc * (K * K);
    const bias = b1[oc]!;
    const obase = oc * 784;
    for (let oy = 0; oy < 28; oy += 1) {
      for (let ox = 0; ox < 28; ox += 1) {
        let acc = bias;
        for (let ky = 0; ky < K; ky += 1) {
          const iy = oy + ky - PAD;
          if (iy < 0 || iy >= 28) continue;
          for (let kx = 0; kx < K; kx += 1) {
            const ix = ox + kx - PAD;
            if (ix < 0 || ix >= 28) continue;
            acc += img[iy * 28 + ix]! * w1[wbase + ky * K + kx]!;
          }
        }
        a1[obase + oy * 28 + ox] = acc > 0 ? acc : 0;
      }
    }
  }
}

// maxpool 2x2 from src (ch x H x W) to dst (ch x H/2 x W/2); records arg index.
function maxpool(src: Float32Array, dst: Float32Array, arg: Int32Array, ch: number, H: number, W: number): void {
  const oH = H >> 1;
  const oW = W >> 1;
  for (let c = 0; c < ch; c += 1) {
    const sbase = c * H * W;
    const dbase = c * oH * oW;
    for (let oy = 0; oy < oH; oy += 1) {
      for (let ox = 0; ox < oW; ox += 1) {
        let best = -Infinity;
        let bestIdx = 0;
        for (let py = 0; py < 2; py += 1) {
          for (let px = 0; px < 2; px += 1) {
            const idx = sbase + (oy * 2 + py) * W + (ox * 2 + px);
            const v = src[idx]!;
            if (v > best) {
              best = v;
              bestIdx = idx;
            }
          }
        }
        dst[dbase + oy * oW + ox] = best;
        arg[dbase + oy * oW + ox] = bestIdx;
      }
    }
  }
}

// conv2: input p1 (C1 x 14 x 14) -> a2 = relu(conv) (C2 x 14 x 14).
function conv2(): void {
  for (let oc = 0; oc < C2; oc += 1) {
    const bias = b2[oc]!;
    const obase = oc * 14 * 14;
    for (let oy = 0; oy < 14; oy += 1) {
      for (let ox = 0; ox < 14; ox += 1) {
        let acc = bias;
        for (let ic = 0; ic < C1; ic += 1) {
          const ibase = ic * 14 * 14;
          const wbase = (oc * C1 + ic) * (K * K);
          for (let ky = 0; ky < K; ky += 1) {
            const iy = oy + ky - PAD;
            if (iy < 0 || iy >= 14) continue;
            for (let kx = 0; kx < K; kx += 1) {
              const ix = ox + kx - PAD;
              if (ix < 0 || ix >= 14) continue;
              acc += p1[ibase + iy * 14 + ix]! * w2[wbase + ky * K + kx]!;
            }
          }
        }
        a2[obase + oy * 14 + ox] = acc > 0 ? acc : 0;
      }
    }
  }
}

function forward(img: Float32Array): void {
  conv1(img);
  maxpool(a1, p1, p1arg, C1, 28, 28);
  conv2();
  maxpool(a2, p2, p2arg, C2, 14, 14);
  // FC.
  for (let o = 0; o < N_OUT; o += 1) {
    let acc = bf[o]!;
    const wbase = o * FC_IN;
    for (let i = 0; i < FC_IN; i += 1) acc += p2[i]! * wf[wbase + i]!;
    logits[o] = acc;
  }
  let mx = -Infinity;
  for (let o = 0; o < N_OUT; o += 1) if (logits[o]! > mx) mx = logits[o]!;
  let sum = 0;
  for (let o = 0; o < N_OUT; o += 1) {
    const e = Math.exp(logits[o]! - mx);
    probs[o] = e;
    sum += e;
  }
  for (let o = 0; o < N_OUT; o += 1) probs[o] = probs[o]! / sum;
}

// Accumulate gradients for one sample into the g* buffers (NOT zeroed here).
const dlogit = new Float32Array(N_OUT); // hoisted to avoid per-call GC churn
function backward(img: Float32Array, label: number): void {
  // d logits = probs - onehot.
  for (let o = 0; o < N_OUT; o += 1) dlogit[o] = probs[o]! - (o === label ? 1 : 0);
  // FC grads + backprop into p2 (dp2).
  dp2.fill(0);
  for (let o = 0; o < N_OUT; o += 1) {
    const g = dlogit[o]!;
    gbf[o] = gbf[o]! + g;
    const wbase = o * FC_IN;
    for (let i = 0; i < FC_IN; i += 1) {
      gwf[wbase + i] = gwf[wbase + i]! + g * p2[i]!;
      dp2[i] = dp2[i]! + g * wf[wbase + i]!;
    }
  }
  // pool2 backward: route dp2 to da2 at argmax.
  da2.fill(0);
  for (let i = 0; i < p2.length; i += 1) da2[p2arg[i]!] = da2[p2arg[i]!]! + dp2[i]!;
  // ReLU2: zero grad where a2 == 0.
  for (let i = 0; i < a2.length; i += 1) if (a2[i]! <= 0) da2[i] = 0;
  // conv2 backward: grads for w2/b2 and dp1.
  dp1.fill(0);
  for (let oc = 0; oc < C2; oc += 1) {
    const obase = oc * 14 * 14;
    for (let oy = 0; oy < 14; oy += 1) {
      for (let ox = 0; ox < 14; ox += 1) {
        const go = da2[obase + oy * 14 + ox]!;
        if (go === 0) continue;
        gb2[oc] = gb2[oc]! + go;
        for (let ic = 0; ic < C1; ic += 1) {
          const ibase = ic * 14 * 14;
          const wbase = (oc * C1 + ic) * (K * K);
          for (let ky = 0; ky < K; ky += 1) {
            const iy = oy + ky - PAD;
            if (iy < 0 || iy >= 14) continue;
            for (let kx = 0; kx < K; kx += 1) {
              const ix = ox + kx - PAD;
              if (ix < 0 || ix >= 14) continue;
              const iv = p1[ibase + iy * 14 + ix]!;
              gw2[wbase + ky * K + kx] = gw2[wbase + ky * K + kx]! + go * iv;
              dp1[ibase + iy * 14 + ix] = dp1[ibase + iy * 14 + ix]! + go * w2[wbase + ky * K + kx]!;
            }
          }
        }
      }
    }
  }
  // pool1 backward: route dp1 to da1 at argmax.
  da1.fill(0);
  for (let i = 0; i < p1.length; i += 1) da1[p1arg[i]!] = da1[p1arg[i]!]! + dp1[i]!;
  // ReLU1.
  for (let i = 0; i < a1.length; i += 1) if (a1[i]! <= 0) da1[i] = 0;
  // conv1 backward: grads for w1/b1 (no need to propagate to the image).
  for (let oc = 0; oc < C1; oc += 1) {
    const obase = oc * 784;
    const wbase = oc * (K * K);
    for (let oy = 0; oy < 28; oy += 1) {
      for (let ox = 0; ox < 28; ox += 1) {
        const go = da1[obase + oy * 28 + ox]!;
        if (go === 0) continue;
        gb1[oc] = gb1[oc]! + go;
        for (let ky = 0; ky < K; ky += 1) {
          const iy = oy + ky - PAD;
          if (iy < 0 || iy >= 28) continue;
          for (let kx = 0; kx < K; kx += 1) {
            const ix = ox + kx - PAD;
            if (ix < 0 || ix >= 28) continue;
            gw1[wbase + ky * K + kx] = gw1[wbase + ky * K + kx]! + go * img[iy * 28 + ix]!;
          }
        }
      }
    }
  }
}

function sgdStep(
  w: Float32Array, g: Float32Array, v: Float32Array, lr: number, scale: number, decay: boolean,
): void {
  for (let i = 0; i < w.length; i += 1) {
    let grad = g[i]! * scale;
    if (decay) grad += WEIGHT_DECAY * w[i]!;
    v[i] = MOMENTUM * v[i]! - lr * grad;
    w[i] = w[i]! + v[i]!;
    g[i] = 0;
  }
}

// ── Build training/test tensors (apply MNIST normalize to every glyph) ───────────
function buildSamples(ds: Dataset): { x: Float32Array[]; y: Uint8Array } {
  const x: Float32Array[] = [];
  for (let n = 0; n < ds.count; n += 1) {
    const raw = new Float32Array(784);
    const base = n * 784;
    for (let i = 0; i < 784; i += 1) raw[i] = ds.images[base + i]! / 255;
    // Re-run the SAME normalization the live demo uses, so train == inference domain.
    x.push(mnistNormalize(raw));
  }
  return { x, y: ds.labels };
}

console.log('Loading MNIST (downloads to ./.mnist on first run)...');
const trainDs = await loadSet('train-images-idx3-ubyte', 'train-labels-idx1-ubyte', TRAIN_LIMIT);
const testDs = await loadSet('t10k-images-idx3-ubyte', 't10k-labels-idx1-ubyte', TEST_LIMIT);
console.log(`  train=${trainDs.count}  test=${testDs.count}`);

console.log('Preprocessing (crop+scale20+center-of-mass) all glyphs...');
const train = buildSamples(trainDs);
const test = buildSamples(testDs);

function evaluate(x: Float32Array[], y: Uint8Array, limit = x.length): number {
  let correct = 0;
  const n = Math.min(limit, x.length);
  for (let i = 0; i < n; i += 1) {
    forward(x[i]!);
    let am = 0;
    for (let o = 1; o < N_OUT; o += 1) if (probs[o]! > probs[am]!) am = o;
    if (am === y[i]) correct += 1;
  }
  return correct / n;
}

// ── Training loop (mini-batch SGD + momentum) ────────────────────────────────────
const order = new Int32Array(train.x.length);
for (let i = 0; i < order.length; i += 1) order[i] = i;

// ── Bake helpers (checkpointed after every epoch so a crash never loses progress) ─
function pickRef(target: number): Float32Array {
  for (let i = 0; i < test.x.length; i += 1) {
    if (test.y[i] !== target) continue;
    forward(test.x[i]!);
    let am = 0;
    for (let o = 1; o < N_OUT; o += 1) if (probs[o]! > probs[am]!) am = o;
    if (am === target && probs[target]! > 0.85) return test.x[i]!;
  }
  for (let i = 0; i < test.x.length; i += 1) if (test.y[i] === target) return test.x[i]!;
  return new Float32Array(784);
}
function refB64(target: number): string {
  const r = pickRef(target);
  return Buffer.from(r.buffer, r.byteOffset, r.byteLength).toString('base64');
}

async function bakeWeights(fullAcc: number): Promise<void> {
  // Layout (matches the GPU demo's reader): w1, b1, w2, b2, wf, bf.
  const flat = new Float32Array(w1.length + b1.length + w2.length + b2.length + wf.length + bf.length);
  let off = 0;
  flat.set(w1, off); off += w1.length;
  flat.set(b1, off); off += b1.length;
  flat.set(w2, off); off += w2.length;
  flat.set(b2, off); off += b2.length;
  flat.set(wf, off); off += wf.length;
  flat.set(bf, off); off += bf.length;
  const b64 = Buffer.from(flat.buffer).toString('base64');
  const ref3 = refB64(3);
  const ref7 = refB64(7);
  const ref5 = refB64(5);
  const ref8 = refB64(8);
  const fileContents = makeFile(b64, fullAcc, ref3, ref7, ref5, ref8);
  await Bun.write(`${import.meta.dir}/digit-oracle.weights.ts`, fileContents);
}

console.log(`Training CNN (1->${C1}->${C2}->fc->${N_OUT}) · ${EPOCHS} epochs · batch ${BATCH}...`);
const tStart = performance.now();
let bestAcc = 0;
for (let epoch = 0; epoch < EPOCHS; epoch += 1) {
  // Shuffle.
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    const t = order[i]!;
    order[i] = order[j]!;
    order[j] = t;
  }
  const lr = LR0 * Math.pow(0.6, epoch); // step decay
  let loss = 0;
  let seen = 0;
  for (let b = 0; b < order.length; b += BATCH) {
    const end = Math.min(b + BATCH, order.length);
    const bs = end - b;
    for (let k = b; k < end; k += 1) {
      const si = order[k]!;
      const img = train.x[si]!;
      const label = train.y[si]!;
      forward(img);
      loss += -Math.log(Math.max(probs[label]!, 1e-9));
      backward(img, label);
    }
    const scale = 1 / bs;
    sgdStep(wf, gwf, vwf, lr, scale, true);
    sgdStep(bf, gbf, vbf, lr, scale, false);
    sgdStep(w2, gw2, vw2, lr, scale, true);
    sgdStep(b2, gb2, vb2, lr, scale, false);
    sgdStep(w1, gw1, vw1, lr, scale, true);
    sgdStep(b1, gb1, vb1, lr, scale, false);
    seen += bs;
    if (seen % 6400 === 0) {
      const pct = ((seen / order.length) * 100).toFixed(0);
      process.stdout.write(`  epoch ${epoch + 1}/${EPOCHS}  ${pct}%  loss=${(loss / seen).toFixed(4)}\r`);
    }
  }
  // Full test eval + CHECKPOINT every epoch (resilient to the intermittent crash).
  const acc = evaluate(test.x, test.y);
  bestAcc = Math.max(bestAcc, acc);
  await bakeWeights(acc);
  const secs = ((performance.now() - tStart) / 1000).toFixed(0);
  console.log(`  epoch ${epoch + 1}/${EPOCHS}  loss=${(loss / order.length).toFixed(4)}  testAcc=${(acc * 100).toFixed(2)}%  (${secs}s)  [checkpointed]`);
}

// ── Final evaluations ────────────────────────────────────────────────────────────
const fullAcc = evaluate(test.x, test.y);
console.log(`\nFULL MNIST test accuracy: ${(fullAcc * 100).toFixed(2)}%  (${test.x.length} samples)`);

// Thick-stroke robustness: thicken each test glyph, re-normalize, classify.
{
  let correct = 0;
  const n = Math.min(3000, test.x.length);
  for (let i = 0; i < n; i += 1) {
    const raw = new Float32Array(784);
    const base = i * 784;
    for (let j = 0; j < 784; j += 1) raw[j] = testDs.images[base + j]! / 255;
    const thick = thickenStroke(raw);
    const norm = mnistNormalize(thick);
    forward(norm);
    let am = 0;
    for (let o = 1; o < N_OUT; o += 1) if (probs[o]! > probs[am]!) am = o;
    if (am === test.y[i]) correct += 1;
  }
  console.log(`Simulated THICK-STROKE accuracy: ${((correct / n) * 100).toFixed(2)}%  (${n} samples)`);
}

await bakeWeights(fullAcc);

function makeFile(b64: string, fullAcc: number, ref3: string, ref7: string, ref5: string, ref8: string): string {
  return `/**
 * Baked CNN weights for digit-oracle, trained OFFLINE by digit-oracle.train.ts on the
 * REAL MNIST dataset. Generated; do not edit by hand.
 *
 * Architecture (the GPU compute demo mirrors this exactly):
 *   input 1x28x28
 *   conv3x3 1->${C1} (pad ${PAD}) -> ReLU -> maxpool2x2  => ${C1}x14x14
 *   conv3x3 ${C1}->${C2} (pad ${PAD}) -> ReLU -> maxpool2x2  => ${C2}x7x7
 *   flatten(${FC_IN}) -> FC -> ${N_OUT} -> softmax
 *
 * WEIGHTS_B64 is raw little-endian Float32, concatenated in this order:
 *   w1[${C1}*1*${K}*${K}], b1[${C1}],
 *   w2[${C2}*${C1}*${K}*${K}], b2[${C2}],
 *   wf[${N_OUT}*${FC_IN}], bf[${N_OUT}].
 * REF{3,7,5,8}_B64 are pre-classified 28x28 MNIST TEST glyphs (Float32 length 784).
 */
export const GRID = ${GRID};
export const C1 = ${C1};
export const C2 = ${C2};
export const K = ${K};
export const PAD = ${PAD};
export const FC_IN = ${FC_IN};
export const N_OUT = ${N_OUT};
export const MNIST_TEST_ACC = ${(fullAcc * 100).toFixed(2)};
export const WEIGHTS_B64 = '${b64}';
export const REF3_B64 = '${ref3}';
export const REF7_B64 = '${ref7}';
export const REF5_B64 = '${ref5}';
export const REF8_B64 = '${ref8}';
`;
}

console.log(`Wrote digit-oracle.weights.ts (final MNIST acc ${(fullAcc * 100).toFixed(2)}%).`);
console.log('Done.');
