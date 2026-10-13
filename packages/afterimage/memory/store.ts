// Content-addressed tile store. A tile's identity is its 64-bit GPU fingerprint, so content seen
// before — the caret blinking back, a window you switch to again, every blank tile on screen —
// is stored once and costs nothing the second time. Blobs are zstd-compressed BGRA tiles,
// reference-counted by the journal tapes that point at them.

const initialCapacity = 0x1000;

export class TileStore {
  #blobs: (Uint8Array | null)[] = [];
  #bytes = 0;
  #free: number[] = [];
  readonly #index = new Map<bigint, number>();
  #keys = new BigUint64Array(initialCapacity);
  #references = new Uint32Array(initialCapacity);
  #unique = 0;

  /** Compressed bytes held. */
  get bytes(): number {
    return this.#bytes;
  }

  /** Distinct tiles held. */
  get unique(): number {
    return this.#unique;
  }

  blob(id: number): Uint8Array {
    return this.#blobs[id]!;
  }

  /** Forget everything at once (the user asked to). */
  clear(): void {
    this.#blobs = [];
    this.#bytes = 0;
    this.#free = [];
    this.#index.clear();
    this.#references.fill(0);
    this.#unique = 0;
  }

  /** Store a new blob with no references; the caller retains it for each tape entry. */
  insert(high: number, low: number, blob: Uint8Array): number {
    const key = (BigInt(high) << 32n) | BigInt(low);
    const id = this.#free.pop() ?? this.#blobs.length;
    if (id === this.#blobs.length) this.#blobs.push(null);
    if (id >= this.#references.length) this.#grow(id + 1);
    this.#blobs[id] = blob;
    this.#keys[id] = key;
    this.#references[id] = 0;
    this.#index.set(key, id);
    this.#bytes += blob.byteLength;
    this.#unique += 1;
    return id;
  }

  /** The id holding this fingerprint, or -1. */
  lookup(high: number, low: number): number {
    return this.#index.get((BigInt(high) << 32n) | BigInt(low)) ?? -1;
  }

  release(id: number): void {
    const references = this.#references[id]! - 1;
    this.#references[id] = references;
    if (references > 0) return;
    this.#bytes -= this.#blobs[id]!.byteLength;
    this.#blobs[id] = null;
    this.#index.delete(this.#keys[id]!);
    this.#free.push(id);
    this.#unique -= 1;
  }

  retain(id: number): void {
    this.#references[id] = this.#references[id]! + 1;
  }

  #grow(minimum: number): void {
    let capacity = this.#references.length;
    while (capacity < minimum) capacity *= 2;
    const keys = new BigUint64Array(capacity);
    keys.set(this.#keys);
    this.#keys = keys;
    const references = new Uint32Array(capacity);
    references.set(this.#references);
    this.#references = references;
  }
}
