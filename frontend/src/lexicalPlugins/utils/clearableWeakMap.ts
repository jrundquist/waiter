export class ClearableWeakMap<K extends object, V> {
  #wm: WeakMap<K, V>;

  constructor(iterable: Iterable<readonly [K, V]> | null = null) {
    if (iterable === null) {
      this.#wm = new WeakMap<K, V>();
      return;
    }
    this.#wm = new WeakMap<K, V>(iterable);
  }
  clear() {
    this.#wm = new WeakMap<K, V>();
  }
  delete(k: K) {
    return this.#wm.delete(k);
  }
  get(k: K): V | undefined {
    return this.#wm.get(k);
  }
  has(k: K): boolean {
    return this.#wm.has(k);
  }
  set(k: K, v: V) {
    this.#wm.set(k, v);
    return this;
  }
}
