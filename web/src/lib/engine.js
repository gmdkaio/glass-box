// Calls the C engine through wasm. Arrays are copied into wasm memory, the
// engine runs, and the result is copied back. Pass in the factory from
// build/wasm/glassbox.mjs.
//
// The heap views are read again on every use, because they go stale when the
// memory grows.

export async function loadEngine(createModule) {
  const m = await createModule();

  const put = (arr) => {
    const p = m._malloc(arr.length * 8);
    m.HEAPF64.set(arr, p / 8);
    return p;
  };
  const get = (p, n) => m.HEAPF64.slice(p / 8, p / 8 + n);
  const free = (...ps) => ps.forEach((p) => m._free(p));
  const pairCall = (fn, a, b) => {
    const pa = put(a);
    const pb = put(b);
    try {
      return m[fn](pa, pb, a.length);
    } finally {
      free(pa, pb);
    }
  };

  return {
    // n weights from N(0, sigma^2), seeded by an unsigned 32-bit seed
    weights(n, seed, sigma) {
      const p = m._malloc(n * 8);
      try {
        m._gb_wasm_weights(p, n, seed >>> 0, sigma);
        return get(p, n);
      } finally {
        free(p);
      }
    },

    // over the data's own range, or over [-maxAbs, maxAbs] if given
    quantize(w, bits, maxAbs) {
      const n = w.length;
      const pin = put(w);
      const pout = m._malloc(n * 8);
      try {
        const delta =
          maxAbs === undefined
            ? m._gb_quantize(pin, pout, n, bits)
            : m._gb_quantize_range(pin, pout, n, bits, maxAbs);
        return { out: get(pout, n), delta };
      } finally {
        free(pin, pout);
      }
    },

    mse: (a, b) => pairCall("_gb_mse", a, b),
    dist: (a, b) => pairCall("_gb_dist", a, b),
    signalKept: (w, q) => pairCall("_gb_signal_kept", w, q),

    maxAbs(w) {
      const p = put(w);
      try {
        return m._gb_max_abs(p, w.length);
      } finally {
        free(p);
      }
    },

    // equal-width bins over [lo, hi], values outside are skipped
    histogram(x, lo, hi, bins) {
      const px = put(x);
      const pc = m._malloc(bins * 4);
      try {
        const counted = m._gb_histogram(px, x.length, lo, hi, bins, pc);
        return { counts: m.HEAPU32.slice(pc / 4, pc / 4 + bins), counted };
      } finally {
        free(px, pc);
      }
    },

    // allowed results for 4 numbers, 4 values per point; samples if there are
    // more than maxPoints
    lattice4(bits, maxPoints, seed) {
      const size = Math.min(m._gb_lattice_count(bits, 4), maxPoints);
      const p = m._malloc(size * 32);
      try {
        const written = m._gb_lattice4(p, bits, maxPoints, seed >>> 0);
        return get(p, written * 4);
      } finally {
        free(p);
      }
    },

    // scores to probabilities that add up to 1
    softmax(scores, temperature) {
      const n = scores.length;
      const pin = put(scores);
      const pout = m._malloc(n * 8);
      try {
        m._gb_softmax(pin, pout, n, temperature);
        return get(pout, n);
      } finally {
        free(pin, pout);
      }
    },

    // nearest allowed value when only 2^bits values are allowed between lo and hi
    snap: (x, bits, lo, hi) => m._gb_snap(x, bits, lo, hi),

    // the allowed values themselves, or an empty array if there are more than maxPoints
    snapLevels(bits, lo, hi, maxPoints) {
      const p = m._malloc(Math.min(m._gb_lattice_count(bits, 1), maxPoints) * 8);
      try {
        const written = m._gb_snap_levels(p, bits, lo, hi, maxPoints);
        return get(p, written);
      } finally {
        free(p);
      }
    },

    latticeCount: (bits, dims) => m._gb_lattice_count(bits, dims),
    quantStep: (maxAbs, bits) => m._gb_quant_step(maxAbs, bits),
    mseTheory: (maxAbs, bits) => m._gb_quant_mse_theory(maxAbs, bits),
  };
}
