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

    // which word follows which: a vocab x vocab grid of counts, row = word, column = the word after it
    pairCounts(ids, vocab) {
      const pi = m._malloc(ids.length * 4);
      const pc = m._malloc(vocab * vocab * 4);
      try {
        m.HEAP32.set(ids, pi / 4);
        const pairs = m._gb_pair_counts(pi, ids.length, vocab, pc);
        return { counts: m.HEAPU32.slice(pc / 4, pc / 4 + vocab * vocab), pairs };
      } finally {
        free(pi, pc);
      }
    },

    // the lowest loss a counting table can reach on its own text, to compare a network against
    tableLoss(counts, vocab, ids) {
      const pc = m._malloc(counts.length * 4);
      const pi = m._malloc(ids.length * 4);
      try {
        m.HEAPU32.set(counts, pc / 4);
        m.HEAP32.set(ids, pi / 4);
        return m._gb_table_loss(pc, vocab, pi, ids.length);
      } finally {
        free(pc, pi);
      }
    },

    // a row of counts as odds that add up to 1, plus the row total
    rowOdds(row) {
      const n = row.length;
      const pr = m._malloc(n * 4);
      const po = m._malloc(n * 8);
      try {
        m.HEAPU32.set(row, pr / 4);
        const total = m._gb_row_odds(pr, n, po);
        return { odds: get(po, n), total };
      } finally {
        free(pr, po);
      }
    },

    // a tiny neural network: one word in, odds for the next word out.
    // All its learned numbers sit in one array (see engine/nn.h).
    nnInit(vocab, hidden, seed) {
      const n = m._gb_nn_params(vocab, hidden);
      const p = m._malloc(n * 8);
      try {
        m._gb_nn_init(p, vocab, hidden, seed >>> 0);
        return get(p, n);
      } finally {
        free(p);
      }
    },

    // the hidden values and the odds for one input word
    nnForward(params, vocab, hidden, word) {
      const pp = put(params);
      const ph = m._malloc(hidden * 8);
      const po = m._malloc(vocab * 8);
      try {
        m._gb_nn_forward(pp, vocab, hidden, word, ph, po);
        return { hidden: get(ph, hidden), odds: get(po, vocab) };
      } finally {
        free(pp, ph, po);
      }
    },

    // how surprised the network is by the text: lower is better
    nnLoss(params, vocab, hidden, ids) {
      const pp = put(params);
      const pi = m._malloc(ids.length * 4);
      try {
        m.HEAP32.set(ids, pi / 4);
        return m._gb_nn_loss(pp, vocab, hidden, pi, ids.length);
      } finally {
        free(pp, pi);
      }
    },

    // teaches the network for some passes over the text. Returns the new numbers and the loss.
    nnTrain(params, vocab, hidden, ids, epochs, rate) {
      const pp = put(params);
      const pi = m._malloc(ids.length * 4);
      try {
        m.HEAP32.set(ids, pi / 4);
        const loss = m._gb_nn_train(pp, vocab, hidden, pi, ids.length, epochs, rate);
        return { params: get(pp, params.length), loss };
      } finally {
        free(pp, pi);
      }
    },

    // picks an index from the probabilities `draws` times and counts each index
    sample(probs, draws, seed) {
      const n = probs.length;
      const pp = put(probs);
      const pc = m._malloc(n * 4);
      try {
        m._gb_sample_counts(pp, n, draws, seed >>> 0, pc);
        return m.HEAPU32.slice(pc / 4, pc / 4 + n);
      } finally {
        free(pp, pc);
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
