/**
 * Offline trainer for nano-gpt (one-off; NOT shipped, NOT run at demo time).
 *
 * Trains a tiny char-level decoder-only transformer in pure TypeScript (AdamW,
 * cross-entropy) on a small, public-domain / self-generated structured corpus and
 * bakes the weights as a base64 Float32 blob + the vocab into nano-gpt.weights.ts.
 * The runtime demo re-implements the exact same forward pass as D3D11 compute shaders
 * (flat StructuredBuffer<float> weights, W[row*K+col] indexing) and generates text
 * autoregressively on the GPU.
 *
 * Config (kept tiny so HLSL stays trivial and the bake stays < ~1 MB):
 *   T (context) = 64, d_model = 64, n_head = 4 (head_dim = 16), n_layer = 3, d_ff = 128.
 *
 * Run: bun run packages/all/example/nano-gpt.train.ts
 */

// ── Corpus: a small, self-generated, HIGHLY STRUCTURED corpus so a ~150k-param ───
// model looks crisp. Synthetic "log / config" lines: timestamps, levels, key=value,
// short English phrases. Public-domain (we generate it), copyright-safe, and a tiny
// model can learn its grammar tightly — exactly the "wait, that's TS?!" effect.
function buildCorpus(): string {
  let s = 0x9e3779b9 >>> 0;
  const rnd = (): number => {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 0x1_0000_0000;
  };
  const pick = <T>(a: T[]): T => a[Math.floor(rnd() * a.length)]!;
  const pad2 = (n: number): string => (n < 10 ? '0' + n : '' + n);

  const levels = ['INFO', 'WARN', 'DEBUG', 'ERROR', 'TRACE'];
  const services = ['auth', 'cache', 'router', 'worker', 'gateway', 'kernel', 'render', 'audio'];
  const verbs = ['started', 'stopped', 'failed', 'retried', 'flushed', 'loaded', 'closed', 'opened', 'synced'];
  const nouns = ['session', 'request', 'buffer', 'socket', 'frame', 'shader', 'device', 'queue', 'token'];
  const keys = ['id', 'ms', 'code', 'size', 'port', 'retry', 'gpu', 'fps'];
  const adj = ['ready', 'busy', 'idle', 'stale', 'fresh', 'dirty'];

  const lines: string[] = [];
  for (let i = 0; i < 9000; i += 1) {
    const t = `${pad2(Math.floor(rnd() * 24))}:${pad2(Math.floor(rnd() * 60))}:${pad2(Math.floor(rnd() * 60))}`;
    const lvl = pick(levels);
    const svc = pick(services);
    const verb = pick(verbs);
    const noun = pick(nouns);
    const key = pick(keys);
    const val = Math.floor(rnd() * 9000) + 1;
    const r = rnd();
    if (r < 0.4) {
      lines.push(`[${t}] ${lvl} ${svc}: ${noun} ${verb} ${key}=${val}`);
    } else if (r < 0.7) {
      lines.push(`[${t}] ${lvl} ${svc}: the ${noun} is ${pick(adj)} ${key}=${val}`);
    } else if (r < 0.88) {
      lines.push(`[${t}] ${lvl} ${svc}: ${verb} ${val} ${noun}s in ${Math.floor(rnd() * 500)}ms`);
    } else {
      lines.push(`[${t}] ${lvl} ${svc}: ${noun}=${val} ${key}=${Math.floor(rnd() * 100)} ${pick(adj)}`);
    }
  }
  return lines.join('\n') + '\n';
}

const text = buildCorpus();
console.log(`Corpus: ${text.length} chars.`);

// ── Vocab (chars that actually appear) ───────────────────────────────────────────
const chars = Array.from(new Set(text.split(''))).sort();
const V = chars.length;
const stoi = new Map<string, number>();
chars.forEach((c, i) => stoi.set(c, i));
const data = new Int32Array(text.length);
for (let i = 0; i < text.length; i += 1) data[i] = stoi.get(text[i]!)!;
console.log(`Vocab size V=${V}: ${JSON.stringify(chars.join(''))}`);

// ── Model config ─────────────────────────────────────────────────────────────────
const T = 64;
const D = 64;
const NH = 4;
const HD = D / NH; // 16
const NL = 3;
const DFF = 128;

// ── Parameter tensors (all Float32Array, row-major, explicit indexing) ───────────
let seed = 1234567 >>> 0;
const rnd = (): number => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 0x1_0000_0000;
};
const gauss = (sd: number): number => {
  // Box-Muller.
  const u1 = Math.max(rnd(), 1e-9);
  const u2 = rnd();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2) * sd;
};

interface Param {
  v: Float32Array;
  m: Float32Array;
  vv: Float32Array;
  name: string;
}
const params: Param[] = [];
function P(name: string, n: number, init: (i: number) => number): Float32Array {
  const v = new Float32Array(n);
  for (let i = 0; i < n; i += 1) v[i] = init(i);
  params.push({ v, m: new Float32Array(n), vv: new Float32Array(n), name });
  return v;
}

const wte = P('wte', V * D, () => gauss(0.02)); // [V][D]
const wpe = P('wpe', T * D, () => gauss(0.02)); // [T][D]

interface Layer {
  ln1g: Float32Array;
  ln1b: Float32Array;
  wq: Float32Array;
  wk: Float32Array;
  wv: Float32Array; // [D][D] each
  bq: Float32Array;
  bk: Float32Array;
  bv: Float32Array; // [D]
  wo: Float32Array;
  bo: Float32Array; // [D][D], [D]
  ln2g: Float32Array;
  ln2b: Float32Array;
  w1: Float32Array;
  b1: Float32Array; // [D][DFF], [DFF]
  w2: Float32Array;
  b2: Float32Array; // [DFF][D], [D]
}
const layers: Layer[] = [];
for (let l = 0; l < NL; l += 1) {
  const sc = 0.02;
  layers.push({
    ln1g: P(`l${l}.ln1g`, D, () => 1),
    ln1b: P(`l${l}.ln1b`, D, () => 0),
    wq: P(`l${l}.wq`, D * D, () => gauss(sc)),
    wk: P(`l${l}.wk`, D * D, () => gauss(sc)),
    wv: P(`l${l}.wv`, D * D, () => gauss(sc)),
    bq: P(`l${l}.bq`, D, () => 0),
    bk: P(`l${l}.bk`, D, () => 0),
    bv: P(`l${l}.bv`, D, () => 0),
    wo: P(`l${l}.wo`, D * D, () => gauss(sc)),
    bo: P(`l${l}.bo`, D, () => 0),
    ln2g: P(`l${l}.ln2g`, D, () => 1),
    ln2b: P(`l${l}.ln2b`, D, () => 0),
    w1: P(`l${l}.w1`, D * DFF, () => gauss(sc)),
    b1: P(`l${l}.b1`, DFF, () => 0),
    w2: P(`l${l}.w2`, DFF * D, () => gauss(sc)),
    b2: P(`l${l}.b2`, D, () => 0),
  });
}
const lnfg = P('lnfg', D, () => 1);
const lnfb = P('lnfb', D, () => 0);
const wout = P('wout', D * V, () => gauss(0.02)); // [D][V]
const bout = P('bout', V, () => 0);

let totalParams = 0;
for (const p of params) totalParams += p.v.length;
console.log(`Model: V=${V} T=${T} D=${D} NH=${NH} NL=${NL} DFF=${DFF} -> ${totalParams} params (${((totalParams * 4) / 1024).toFixed(0)} KB f32).`);

// ── Forward (with cached activations for backprop), batch=1, seq length S<=T ──────
const GELU = (x: number): number => 0.5 * x * (1 + Math.tanh(0.7978845608 * (x + 0.044715 * x * x * x)));

interface Cache {
  S: number;
  ids: Int32Array;
  x0: Float32Array; // [S][D] embeddings
  ln1n: Float32Array[]; // per-layer normalized [S][D]
  ln1mean: Float32Array[];
  ln1rstd: Float32Array[]; // [S]
  q: Float32Array[];
  k: Float32Array[];
  vv2: Float32Array[]; // [S][D]
  att: Float32Array[]; // [NH][S][S] softmax weights, flattened [h*S*S + i*S + j]
  ao: Float32Array[]; // attention output before proj [S][D]
  attproj: Float32Array[]; // [S][D]
  res1: Float32Array[]; // x + attproj  [S][D]
  ln2n: Float32Array[];
  ln2mean: Float32Array[];
  ln2rstd: Float32Array[];
  hpre: Float32Array[]; // [S][DFF] pre-gelu
  hact: Float32Array[]; // [S][DFF] post-gelu
  mlpout: Float32Array[]; // [S][D]
  res2: Float32Array[]; // res1 + mlpout [S][D] (= input to next layer)
  lnfn: Float32Array;
  lnfmean: Float32Array;
  lnfrstd: Float32Array;
  logits: Float32Array; // [S][V]
}

function layerNorm(x: Float32Array, S: number, g: Float32Array, b: Float32Array): { n: Float32Array; mean: Float32Array; rstd: Float32Array } {
  const n = new Float32Array(S * D);
  const mean = new Float32Array(S);
  const rstd = new Float32Array(S);
  for (let i = 0; i < S; i += 1) {
    let m = 0;
    for (let d = 0; d < D; d += 1) m += x[i * D + d]!;
    m /= D;
    let varc = 0;
    for (let d = 0; d < D; d += 1) {
      const z = x[i * D + d]! - m;
      varc += z * z;
    }
    varc /= D;
    const rs = 1 / Math.sqrt(varc + 1e-5);
    mean[i] = m;
    rstd[i] = rs;
    for (let d = 0; d < D; d += 1) n[i * D + d] = (x[i * D + d]! - m) * rs * g[d]! + b[d]!;
  }
  return { n, mean, rstd };
}

function matmul(x: Float32Array, S: number, w: Float32Array, b: Float32Array | null, K: number, N: number): Float32Array {
  // x:[S][K] · w:[K][N] + b:[N] -> [S][N]
  const out = new Float32Array(S * N);
  for (let i = 0; i < S; i += 1) {
    for (let n = 0; n < N; n += 1) {
      let acc = b ? b[n]! : 0;
      for (let kk = 0; kk < K; kk += 1) acc += x[i * K + kk]! * w[kk * N + n]!;
      out[i * N + n] = acc;
    }
  }
  return out;
}

function forward(ids: Int32Array, S: number): Cache {
  const c = {} as Cache;
  c.S = S;
  c.ids = ids;
  c.ln1n = [];
  c.ln1mean = [];
  c.ln1rstd = [];
  c.q = [];
  c.k = [];
  c.vv2 = [];
  c.att = [];
  c.ao = [];
  c.attproj = [];
  c.res1 = [];
  c.ln2n = [];
  c.ln2mean = [];
  c.ln2rstd = [];
  c.hpre = [];
  c.hact = [];
  c.mlpout = [];
  c.res2 = [];

  const x0 = new Float32Array(S * D);
  for (let i = 0; i < S; i += 1) {
    const tok = ids[i]!;
    for (let d = 0; d < D; d += 1) x0[i * D + d] = wte[tok * D + d]! + wpe[i * D + d]!;
  }
  c.x0 = x0;
  let x = x0;

  for (let l = 0; l < NL; l += 1) {
    const L = layers[l]!;
    const { n: ln1n, mean: ln1mean, rstd: ln1rstd } = layerNorm(x, S, L.ln1g, L.ln1b);
    c.ln1n[l] = ln1n;
    c.ln1mean[l] = ln1mean;
    c.ln1rstd[l] = ln1rstd;

    const q = matmul(ln1n, S, L.wq, L.bq, D, D);
    const k = matmul(ln1n, S, L.wk, L.bk, D, D);
    const v = matmul(ln1n, S, L.wv, L.bv, D, D);
    c.q[l] = q;
    c.k[l] = k;
    c.vv2[l] = v;

    const att = new Float32Array(NH * S * S);
    const ao = new Float32Array(S * D);
    const scale = 1 / Math.sqrt(HD);
    for (let h = 0; h < NH; h += 1) {
      const ho = h * HD;
      for (let i = 0; i < S; i += 1) {
        // scores over j<=i (causal)
        let mx = -Infinity;
        const scores = new Float32Array(i + 1);
        for (let j = 0; j <= i; j += 1) {
          let dot = 0;
          for (let d = 0; d < HD; d += 1) dot += q[i * D + ho + d]! * k[j * D + ho + d]!;
          dot *= scale;
          scores[j] = dot;
          if (dot > mx) mx = dot;
        }
        let sum = 0;
        for (let j = 0; j <= i; j += 1) {
          const e = Math.exp(scores[j]! - mx);
          scores[j] = e;
          sum += e;
        }
        for (let j = 0; j <= i; j += 1) {
          const w = scores[j]! / sum;
          att[h * S * S + i * S + j] = w;
          for (let d = 0; d < HD; d += 1) ao[i * D + ho + d]! += w * v[j * D + ho + d]!;
        }
      }
    }
    c.att[l] = att;
    c.ao[l] = ao;

    const attproj = matmul(ao, S, L.wo, L.bo, D, D);
    c.attproj[l] = attproj;
    const res1 = new Float32Array(S * D);
    for (let i = 0; i < S * D; i += 1) res1[i] = x[i]! + attproj[i]!;
    c.res1[l] = res1;

    const { n: ln2n, mean: ln2mean, rstd: ln2rstd } = layerNorm(res1, S, L.ln2g, L.ln2b);
    c.ln2n[l] = ln2n;
    c.ln2mean[l] = ln2mean;
    c.ln2rstd[l] = ln2rstd;

    const hpre = matmul(ln2n, S, L.w1, L.b1, D, DFF);
    const hact = new Float32Array(S * DFF);
    for (let i = 0; i < S * DFF; i += 1) hact[i] = GELU(hpre[i]!);
    c.hpre[l] = hpre;
    c.hact[l] = hact;

    const mlpout = matmul(hact, S, L.w2, L.b2, DFF, D);
    c.mlpout[l] = mlpout;
    const res2 = new Float32Array(S * D);
    for (let i = 0; i < S * D; i += 1) res2[i] = res1[i]! + mlpout[i]!;
    c.res2[l] = res2;
    x = res2;
  }

  const { n: lnfn, mean: lnfmean, rstd: lnfrstd } = layerNorm(x, S, lnfg, lnfb);
  c.lnfn = lnfn;
  c.lnfmean = lnfmean;
  c.lnfrstd = lnfrstd;
  c.logits = matmul(lnfn, S, wout, bout, D, V);
  return c;
}

// ── Gradients (full backprop, batch=1) ──────────────────────────────────────────
// Grad buffers keyed identically to params (parallel arrays).
const grad = new Map<Float32Array, Float32Array>();
for (const p of params) grad.set(p.v, new Float32Array(p.v.length));
function zeroGrads(): void {
  for (const g of grad.values()) g.fill(0);
}
const g = (t: Float32Array): Float32Array => grad.get(t)!;

function lnBackward(dout: Float32Array, S: number, xin: Float32Array, n: Float32Array, mean: Float32Array, rstd: Float32Array, gParam: Float32Array, bParam: Float32Array): Float32Array {
  // returns dx; accumulates dgamma,dbeta. n is the *output* (post affine); recompute normed = (x-mean)*rstd.
  const dx = new Float32Array(S * D);
  const dg = g(gParam);
  const db = g(bParam);
  for (let i = 0; i < S; i += 1) {
    const rs = rstd[i]!;
    const mu = mean[i]!;
    // normalized (pre-affine)
    let dnormDot = 0; // sum(dnorm * normed)
    let dnormSum = 0; // sum(dnorm)
    const normed = new Float32Array(D);
    const dnorm = new Float32Array(D);
    for (let d = 0; d < D; d += 1) {
      const nm = (xin[i * D + d]! - mu) * rs;
      normed[d] = nm;
      const dy = dout[i * D + d]!;
      dg[d]! += dy * nm;
      db[d]! += dy;
      const dn = dy * gParam[d]!;
      dnorm[d] = dn;
      dnormSum += dn;
      dnormDot += dn * nm;
    }
    for (let d = 0; d < D; d += 1) {
      dx[i * D + d] = rs * (dnorm[d]! - dnormSum / D - (normed[d]! * dnormDot) / D);
    }
  }
  return dx;
}

function matmulBackward(dout: Float32Array, S: number, xin: Float32Array, w: Float32Array, K: number, N: number, bParam: Float32Array | null): Float32Array {
  // dout:[S][N]; computes dx:[S][K], accumulates dw:[K][N], db:[N].
  const dx = new Float32Array(S * K);
  const dw = g(w);
  const db = bParam ? g(bParam) : null;
  for (let i = 0; i < S; i += 1) {
    for (let n = 0; n < N; n += 1) {
      const dy = dout[i * N + n]!;
      if (db) db[n]! += dy;
      for (let kk = 0; kk < K; kk += 1) {
        dw[kk * N + n]! += xin[i * K + kk]! * dy;
        dx[i * K + kk]! += w[kk * N + n]! * dy;
      }
    }
  }
  return dx;
}

const dGELU = (x: number): number => {
  const k = 0.7978845608;
  const inner = k * (x + 0.044715 * x * x * x);
  const t = Math.tanh(inner);
  const dt = (1 - t * t) * k * (1 + 3 * 0.044715 * x * x);
  return 0.5 * (1 + t) + 0.5 * x * dt;
};

function backward(c: Cache, targets: Int32Array): number {
  const S = c.S;
  // Softmax cross-entropy on every position. dlogits = (softmax - onehot)/S.
  const dlogits = new Float32Array(S * V);
  let loss = 0;
  for (let i = 0; i < S; i += 1) {
    let mx = -Infinity;
    for (let vv = 0; vv < V; vv += 1) if (c.logits[i * V + vv]! > mx) mx = c.logits[i * V + vv]!;
    let sum = 0;
    const p = new Float32Array(V);
    for (let vv = 0; vv < V; vv += 1) {
      const e = Math.exp(c.logits[i * V + vv]! - mx);
      p[vv] = e;
      sum += e;
    }
    const tgt = targets[i]!;
    for (let vv = 0; vv < V; vv += 1) {
      const pr = p[vv]! / sum;
      dlogits[i * V + vv] = (pr - (vv === tgt ? 1 : 0)) / S;
    }
    loss += -Math.log(Math.max(p[tgt]! / sum, 1e-9));
  }
  loss /= S;

  // wout/bout backward.
  let dx = matmulBackward(dlogits, S, c.lnfn, wout, D, V, bout);
  // final LN backward (input was c.res2[NL-1]).
  dx = lnBackward(dx, S, c.res2[NL - 1]!, c.lnfn, c.lnfmean, c.lnfrstd, lnfg, lnfb);

  for (let l = NL - 1; l >= 0; l -= 1) {
    const L = layers[l]!;
    const xin = l === 0 ? c.x0 : c.res2[l - 1]!;
    // res2 = res1 + mlpout ; dx flows to both.
    const dres1 = dx; // alias; we'll add mlp branch contributions below
    const dmlpout = dx.slice();

    // MLP: mlpout = w2(gelu(w1(ln2n)))
    let dhact = matmulBackward(dmlpout, S, c.hact[l]!, L.w2, DFF, D, L.b2);
    const dhpre = new Float32Array(S * DFF);
    for (let i = 0; i < S * DFF; i += 1) dhpre[i] = dhact[i]! * dGELU(c.hpre[l]![i]!);
    let dln2n = matmulBackward(dhpre, S, c.ln2n[l]!, L.w1, D, DFF, L.b1);
    let dres1FromMlp = lnBackward(dln2n, S, c.res1[l]!, c.ln2n[l]!, c.ln2mean[l]!, c.ln2rstd[l]!, L.ln2g, L.ln2b);
    for (let i = 0; i < S * D; i += 1) dres1[i]! += dres1FromMlp[i]!;

    // res1 = x + attproj.
    const dattproj = dres1.slice();
    const dxResidual = dres1; // flows to x (layer input)

    // attproj = wo(ao)
    let dao = matmulBackward(dattproj, S, c.ao[l]!, L.wo, D, D, L.bo);

    // attention backward.
    const S2 = S;
    const dq = new Float32Array(S * D);
    const dk = new Float32Array(S * D);
    const dv = new Float32Array(S * D);
    const scale = 1 / Math.sqrt(HD);
    const att = c.att[l]!;
    const q = c.q[l]!;
    const k = c.k[l]!;
    const v = c.vv2[l]!;
    for (let h = 0; h < NH; h += 1) {
      const ho = h * HD;
      for (let i = 0; i < S; i += 1) {
        // dao[i] distributes to v[j] and to attention weights.
        const dscore = new Float32Array(i + 1);
        // d w_ij = sum_d dao[i,d] * v[j,d]; also accumulate dv.
        let dwDotA = 0; // sum_j w_ij * (dao·v_j) for softmax jacobian
        const dwRaw = new Float32Array(i + 1);
        for (let j = 0; j <= i; j += 1) {
          let dw = 0;
          const wij = att[h * S2 * S2 + i * S2 + j]!;
          for (let d = 0; d < HD; d += 1) {
            const g2 = dao[i * D + ho + d]!;
            dw += g2 * v[j * D + ho + d]!;
            dv[j * D + ho + d]! += g2 * wij;
          }
          dwRaw[j] = dw;
          dwDotA += wij * dw;
        }
        // softmax backward: dscore_j = w_ij * (dwRaw_j - dwDotA)
        for (let j = 0; j <= i; j += 1) {
          const wij = att[h * S2 * S2 + i * S2 + j]!;
          dscore[j] = wij * (dwRaw[j]! - dwDotA);
        }
        // scores = scale * (q_i · k_j)
        for (let j = 0; j <= i; j += 1) {
          const ds = dscore[j]! * scale;
          for (let d = 0; d < HD; d += 1) {
            dq[i * D + ho + d]! += ds * k[j * D + ho + d]!;
            dk[j * D + ho + d]! += ds * q[i * D + ho + d]!;
          }
        }
      }
    }
    // q/k/v = matmul(ln1n, wq/wk/wv)
    let dln1n_q = matmulBackward(dq, S, c.ln1n[l]!, L.wq, D, D, L.bq);
    let dln1n_k = matmulBackward(dk, S, c.ln1n[l]!, L.wk, D, D, L.bk);
    let dln1n_v = matmulBackward(dv, S, c.ln1n[l]!, L.wv, D, D, L.bv);
    const dln1n = new Float32Array(S * D);
    for (let i = 0; i < S * D; i += 1) dln1n[i] = dln1n_q[i]! + dln1n_k[i]! + dln1n_v[i]!;
    let dxFromLn1 = lnBackward(dln1n, S, xin, c.ln1n[l]!, c.ln1mean[l]!, c.ln1rstd[l]!, L.ln1g, L.ln1b);
    for (let i = 0; i < S * D; i += 1) dxResidual[i]! += dxFromLn1[i]!;

    dx = dxResidual; // becomes dout for previous layer's res2 (= this layer's xin)
  }

  // Embedding backward: x0[i] = wte[ids[i]] + wpe[i]; dx is gradient wrt x0.
  const dwte = g(wte);
  const dwpe = g(wpe);
  for (let i = 0; i < S; i += 1) {
    const tok = c.ids[i]!;
    for (let d = 0; d < D; d += 1) {
      const gd = dx[i * D + d]!;
      dwte[tok * D + d]! += gd;
      dwpe[i * D + d]! += gd;
    }
  }
  return loss;
}

// ── AdamW ────────────────────────────────────────────────────────────────────────
let step = 0;
function adamStep(lr: number): void {
  step += 1;
  const b1 = 0.9;
  const b2 = 0.999;
  const eps = 1e-8;
  const wd = 0.01;
  const bc1 = 1 - Math.pow(b1, step);
  const bc2 = 1 - Math.pow(b2, step);
  for (const p of params) {
    const gp = grad.get(p.v)!;
    const isWeight =
      (p.name.startsWith('l') && (p.name.endsWith('.wq') || p.name.endsWith('.wk') || p.name.endsWith('.wv') || p.name.endsWith('.wo') || p.name.endsWith('.w1') || p.name.endsWith('.w2'))) ||
      p.name === 'wte' ||
      p.name === 'wpe' ||
      p.name === 'wout';
    for (let i = 0; i < p.v.length; i += 1) {
      const gi = gp[i]!;
      p.m[i] = b1 * p.m[i]! + (1 - b1) * gi;
      p.vv[i] = b2 * p.vv[i]! + (1 - b2) * gi * gi;
      const mh = p.m[i]! / bc1;
      const vh = p.vv[i]! / bc2;
      let upd = (lr * mh) / (Math.sqrt(vh) + eps);
      if (isWeight) p.v[i]! -= lr * wd * p.v[i]!;
      p.v[i]! -= upd;
    }
  }
}

// ── Training loop ─────────────────────────────────────────────────────────────────
const STEPS = process.env.NANO_STEPS ? Number(process.env.NANO_STEPS) : 4000;
const baseLr = 3e-3;
console.log(`Training ${STEPS} steps (seq len ${T})...`);
const N = data.length;
let emaLoss = Math.log(V);
const tStart = Date.now();
for (let it = 0; it < STEPS; it += 1) {
  // Sample a random contiguous block.
  const startIdx = Math.floor(rnd() * (N - T - 1));
  const ids = data.slice(startIdx, startIdx + T);
  const tgt = data.slice(startIdx + 1, startIdx + T + 1);
  zeroGrads();
  const c = forward(ids, T);
  const loss = backward(c, tgt);
  emaLoss = emaLoss * 0.99 + loss * 0.01;
  // cosine-ish warmup
  const warm = Math.min(1, it / 100);
  const decay = 0.5 * (1 + Math.cos(Math.PI * Math.min(1, it / STEPS)));
  const lr = baseLr * warm * (0.1 + 0.9 * decay);
  adamStep(lr);
  if (it % 100 === 0 || it === STEPS - 1) {
    const secs = (Date.now() - tStart) / 1000;
    console.log(`  step ${it}/${STEPS}  loss=${loss.toFixed(4)}  ema=${emaLoss.toFixed(4)}  lr=${lr.toExponential(2)}  ${secs.toFixed(1)}s`);
  }
}

// ── CPU sample to sanity-check before baking ─────────────────────────────────────
function sample(prompt: string, n: number, temp: number): string {
  let ids: number[] = Array.from(prompt).map((ch) => stoi.get(ch) ?? 0);
  if (ids.length === 0) ids = [stoi.get('\n') ?? 0];
  let out = prompt;
  for (let s = 0; s < n; s += 1) {
    const ctx = ids.slice(Math.max(0, ids.length - T));
    const c = forward(Int32Array.from(ctx), ctx.length);
    const lastRow = (ctx.length - 1) * V;
    const logits = new Float32Array(V);
    for (let vv = 0; vv < V; vv += 1) logits[vv] = c.logits[lastRow + vv]! / temp;
    let mx = -Infinity;
    for (let vv = 0; vv < V; vv += 1) if (logits[vv]! > mx) mx = logits[vv]!;
    let sum = 0;
    const p = new Float32Array(V);
    for (let vv = 0; vv < V; vv += 1) {
      const e = Math.exp(logits[vv]! - mx);
      p[vv] = e;
      sum += e;
    }
    let r = rnd() * sum;
    let chosen = 0;
    for (let vv = 0; vv < V; vv += 1) {
      r -= p[vv]!;
      if (r <= 0) {
        chosen = vv;
        break;
      }
    }
    ids.push(chosen);
    out += chars[chosen]!;
  }
  return out;
}
console.log('\n── CPU sample (temp 0.6) ──');
console.log(sample('[', 280, 0.6));
console.log('\n── CPU sample (temp 0.8) ──');
console.log(sample('[1', 280, 0.8));

// ── Bake: concatenate ALL params in the canonical order the demo expects ─────────
// Order MUST match nano-gpt.ts decode: wte, wpe, then per-layer
// [ln1g,ln1b, wq,bq, wk,bk, wv,bv, wo,bo, ln2g,ln2b, w1,b1, w2,b2], then lnfg,lnfb, wout,bout.
const ordered: Float32Array[] = [wte, wpe];
for (let l = 0; l < NL; l += 1) {
  const L = layers[l]!;
  ordered.push(L.ln1g, L.ln1b, L.wq, L.bq, L.wk, L.bk, L.wv, L.bv, L.wo, L.bo, L.ln2g, L.ln2b, L.w1, L.b1, L.w2, L.b2);
}
ordered.push(lnfg, lnfb, wout, bout);
let total = 0;
for (const t of ordered) total += t.length;
const flat = new Float32Array(total);
let off = 0;
for (const t of ordered) {
  flat.set(t, off);
  off += t.length;
}
const b64 = Buffer.from(flat.buffer).toString('base64');

const fileContents = `/**
 * Baked nano-gpt weights — a char-level transformer trained OFFLINE by
 * nano-gpt.train.ts on a self-generated structured log corpus. Generated; do not edit.
 * WEIGHTS_B64 is the raw little-endian Float32 blob, concatenated in this order:
 *   wte[V*D], wpe[T*D],
 *   per layer (x NL): ln1g[D],ln1b[D], wq[D*D],bq[D], wk[D*D],bk[D], wv[D*D],bv[D],
 *                     wo[D*D],bo[D], ln2g[D],ln2b[D], w1[D*DFF],b1[DFF], w2[DFF*D],b2[D],
 *   lnfg[D],lnfb[D], wout[D*V],bout[V].
 * VOCAB maps id<->char (index = token id).
 */
export const V = ${V};
export const T = ${T};
export const D = ${D};
export const NH = ${NH};
export const NL = ${NL};
export const DFF = ${DFF};
export const VOCAB = ${JSON.stringify(chars.join(''))};
export const TOTAL_PARAMS = ${total};
export const WEIGHTS_B64 = '${b64}';
`;
await Bun.write(`${import.meta.dir}/nano-gpt.weights.ts`, fileContents);
console.log(`\nWrote nano-gpt.weights.ts (${(fileContents.length / 1024).toFixed(0)} KB text, ${total} floats, ${((total * 4) / 1024).toFixed(0)} KB f32).`);
console.log('Done.');
