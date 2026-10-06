// Calls the C engine through wasm. Arrays are copied into wasm memory, the
// engine runs, and the result is copied back. Pass in the factory from
// build/wasm/glassbox.mjs.
//
// The heap views are read again on every use, because they go stale when the
// memory grows.

// lr_scheduler_type, in the engine's order (engine/nn.h)
const SCHEDULES = ["constant", "linear", "cosine"];

export async function loadEngine(createModule) {
  const m = await createModule();

  const put = (arr) => {
    const p = m._malloc(arr.length * 8);
    m.HEAPF64.set(arr, p / 8);
    return p;
  };
  const get = (p, n) => m.HEAPF64.slice(p / 8, p / 8 + n);
  const free = (...ps) => ps.forEach((p) => m._free(p));
  const utf8 = new TextEncoder();
  const putBytes = (bytes) => {
    const p = m._malloc(Math.max(bytes.length, 1));
    m.HEAPU8.set(bytes, p);
    return p;
  };
  const putInts = (ints) => {
    const p = m._malloc(Math.max(ints.length, 1) * 4);
    m.HEAP32.set(ints, p / 4);
    return p;
  };
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

    // training one pass at a time with a schedule ("constant", "linear" or "cosine"),
    // and the loss on ids after every pass. A network that blew up reads Infinity.
    nnTrainCurve(params, vocab, hidden, ids, epochs, rate, schedule) {
      const pp = put(params);
      const pi = putInts(ids);
      const pc = m._malloc(epochs * 8);
      try {
        const loss = m._gb_nn_train_curve(pp, vocab, hidden, pi, ids.length, epochs, rate, SCHEDULES.indexOf(schedule), pc);
        return { params: get(pp, params.length), curve: get(pc, epochs), loss };
      } finally {
        free(pp, pi, pc);
      }
    },

    // training pass by pass at a fixed rate, with the loss on the training, held-out
    // and old texts after every pass, and the surprise at each word of a probe text
    // (epochs x (probe length - 1))
    nnTrainWatch(params, vocab, hidden, ids, held, old, probe, epochs, rate) {
      const pp = put(params);
      const pi = putInts(ids);
      const ph = putInts(held);
      const po = putInts(old);
      const pr = putInts(probe);
      const per = Math.max(0, probe.length - 1);
      const outs = [epochs, epochs, epochs, Math.max(1, epochs * per)].map((k) => m._malloc(k * 8));
      try {
        m._gb_nn_train_watch(pp, vocab, hidden, pi, ids.length, ph, held.length, po, old.length, pr, probe.length, epochs, rate, ...outs);
        return {
          params: get(pp, params.length),
          train: get(outs[0], epochs),
          held: get(outs[1], epochs),
          old: get(outs[2], epochs),
          probe: get(outs[3], epochs * per)
        };
      } finally {
        free(pp, pi, ph, po, pr, ...outs);
      }
    },

    // the surprise at each word of a text, -ln of the odds the network gave it
    nnWordLoss(params, vocab, hidden, ids) {
      const pp = put(params);
      const pi = putInts(ids);
      const po = m._malloc(Math.max(1, ids.length - 1) * 8);
      try {
        m._gb_nn_word_loss(pp, vocab, hidden, pi, ids.length, po);
        return get(po, Math.max(0, ids.length - 1));
      } finally {
        free(pp, pi, po);
      }
    },

    // the step size at pass e of `epochs`, for a schedule
    lrAt: (rate, schedule, e, epochs) => m._gb_lr_at(rate, SCHEDULES.indexOf(schedule), e, epochs),

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

    // Long tasks (see engine/chain.h). A task has `steps` steps, each right with
    // chance p. With checkEvery > 0 a check after every that many steps catches a
    // wrong section with chance catchRate and redoes it, at most `retries` times.
    chainOdds: (p, steps, checkEvery, catchRate, retries) =>
      m._gb_chain_odds(p, steps, checkEvery, catchRate, retries),

    // one run: what happened in order (0 right, 1 wrong, 2 check passed, 3 check
    // caught), how it ended (0 clean, 1 broken, 2 gave up), and the step that spoiled it
    chainTrace(p, steps, checkEvery, catchRate, retries, seed) {
      const max = steps * (retries + 2) * 2;
      const pe = m._malloc(max * 4);
      const pn = m._malloc(4);
      const pb = m._malloc(4);
      try {
        const outcome = m._gb_chain_trace(p, steps, checkEvery, catchRate, retries, seed >>> 0, pe, max, pn, pb);
        const written = m.HEAPU32[pn / 4];
        return { events: m.HEAP32.slice(pe / 4, pe / 4 + written), outcome, brokenAt: m.HEAP32[pb / 4] };
      } finally {
        free(pe, pn, pb);
      }
    },

    // many runs: how many ended clean, broken and gave up, where they broke, and the
    // average number of steps per run thrown away because a check sent them back
    chainTrials(p, steps, checkEvery, catchRate, retries, trials, seed) {
      const po = m._malloc(3 * 4);
      const pa = m._malloc(steps * 4);
      try {
        const redone = m._gb_chain_trials(p, steps, checkEvery, catchRate, retries, trials, seed >>> 0, po, pa);
        return {
          outcomes: m.HEAPU32.slice(po / 4, po / 4 + 3),
          brokenAt: m.HEAPU32.slice(pa / 4, pa / 4 + steps),
          redone,
        };
      } finally {
        free(po, pa);
      }
    },

    // Context (see engine/context.h): n sentences scored against a question. The key
    // sentence scores keyScore, `lookalikes` sentences score lookalikeScore, the rest
    // are noise of size spread, and every sentence loses up to `dip` in the middle.
    contextScores(n, keyAt, keyScore, spread, lookalikes, lookalikeScore, dip, seed) {
      const p = m._malloc(n * 8);
      try {
        m._gb_context_scores(n, keyAt, keyScore, spread, lookalikes, lookalikeScore, dip, seed >>> 0, p);
        return get(p, n);
      } finally {
        free(p);
      }
    },

    // which sentence a place from 0 (first) to 1 (last) lands on
    contextPlace: (n, place) => m._gb_context_place(n, place),

    // the key's share of attention, averaged over many random contexts
    contextShare: (n, place, keyScore, spread, lookalikes, lookalikeScore, dip, trials, seed) =>
      m._gb_context_share(n, place, keyScore, spread, lookalikes, lookalikeScore, dip, trials, seed >>> 0),

    // Byte pair encoding (see engine/bpe.h). Text goes in as UTF-8 bytes, and the
    // merges come back as pairs: merge k makes token 256 + k from pairs[2k], pairs[2k + 1].
    bpeTrain(text, merges) {
      const bytes = utf8.encode(text);
      const pt = putBytes(bytes);
      const pp = m._malloc(Math.max(merges, 1) * 8);
      try {
        const learned = m._gb_bpe_train(pt, bytes.length, merges, pp);
        return m.HEAP32.slice(pp / 4, pp / 4 + 2 * learned);
      } finally {
        free(pt, pp);
      }
    },

    // the tokens of text with the first `merges` merges (at most as many as pairs holds)
    bpeEncode(text, pairs, merges) {
      merges = Math.min(merges, pairs.length / 2);
      const bytes = utf8.encode(text);
      const pt = putBytes(bytes);
      const pp = putInts(pairs);
      const pi = m._malloc(Math.max(bytes.length, 1) * 4);
      try {
        const n = m._gb_bpe_encode(pt, bytes.length, pp, merges, pi);
        return m.HEAP32.slice(pi / 4, pi / 4 + n);
      } finally {
        free(pt, pp, pi);
      }
    },

    // how many tokens text becomes with 0, 1, ... merges merges
    bpeCurve(text, pairs, merges) {
      merges = Math.min(merges, pairs.length / 2);
      const bytes = utf8.encode(text);
      const pt = putBytes(bytes);
      const pp = putInts(pairs);
      const pc = m._malloc((merges + 1) * 4);
      try {
        m._gb_bpe_curve(pt, bytes.length, pp, merges, pc);
        return m.HEAPU32.slice(pc / 4, pc / 4 + merges + 1);
      } finally {
        free(pt, pp, pc);
      }
    },

    // the bytes a token stands for
    bpeTokenBytes(pairs, token) {
      const merges = pairs.length / 2;
      const pp = putInts(pairs);
      const cap = 256;
      const po = m._malloc(cap);
      try {
        const n = m._gb_bpe_token_bytes(pp, merges, token, po, cap);
        return m.HEAPU8.slice(po, po + Math.min(n, cap));
      } finally {
        free(pp, po);
      }
    },

    // Calibration (see engine/calib.h): n answers, each with a stated confidence
    // and whether it was right. shift > 0 makes the model sound surer than it is.
    calibSample(n, mean, spread, shift, seed) {
      const pc = m._malloc(n * 8);
      const py = m._malloc(n * 4);
      try {
        m._gb_calib_sample(n, mean, spread, shift, seed >>> 0, pc, py);
        return { conf: get(pc, n), correct: m.HEAP32.slice(py / 4, py / 4 + n) };
      } finally {
        free(pc, py);
      }
    },

    // per bin of stated confidence: how many answers, their average confidence, the share right
    calibBins(conf, correct, bins) {
      const n = conf.length;
      const pc = put(conf);
      const py = putInts(correct);
      const pk = m._malloc(bins * 4);
      const ps = m._malloc(bins * 8);
      const pr = m._malloc(bins * 8);
      try {
        m._gb_calib_bins(pc, py, n, bins, pk, ps, pr);
        return { count: m.HEAPU32.slice(pk / 4, pk / 4 + bins), stated: get(ps, bins), right: get(pr, bins) };
      } finally {
        free(pc, py, pk, ps, pr);
      }
    },

    calibError(conf, correct, bins) {
      const pc = put(conf);
      const py = putInts(correct);
      try {
        return m._gb_calib_error(pc, py, conf.length, bins);
      } finally {
        free(pc, py);
      }
    },

    calibBrier(conf, correct) {
      const pc = put(conf);
      const py = putInts(correct);
      try {
        return m._gb_calib_brier(pc, py, conf.length);
      } finally {
        free(pc, py);
      }
    },

    // the log-odds shift that makes the confidences fit the outcomes best
    calibFitShift(conf, correct) {
      const pc = put(conf);
      const py = putInts(correct);
      try {
        return m._gb_calib_fit_shift(pc, py, conf.length);
      } finally {
        free(pc, py);
      }
    },

    calibApply(conf, shift) {
      const pc = put(conf);
      try {
        m._gb_calib_apply(pc, conf.length, shift, pc);
        return get(pc, conf.length);
      } finally {
        free(pc);
      }
    },

    // Retrieval (see engine/retrieve.h). pages: arrays of word numbers. query:
    // word numbers, with an optional weight each. Returns one BM25 score per page.
    bm25(pages, vocab, query, weights, k1 = 1.2, b = 0.75) {
      const terms = pages.flat();
      const start = [0];
      for (const p of pages) start.push(start.at(-1) + p.length);
      const pt = putInts(terms);
      const ps = m._malloc(start.length * 4);
      m.HEAPU32.set(start, ps / 4);
      const pq = putInts(query);
      const pw = weights ? put(weights) : 0;
      const po = m._malloc(pages.length * 8);
      try {
        m._gb_bm25(pt, ps, pages.length, vocab, pq, pw, query.length, k1, b, po);
        return get(po, pages.length);
      } finally {
        free(pt, ps, pq, po);
        if (pw) free(pw);
      }
    },

    // where a page ranks (0 is the top), and the chance the model answers from it
    // when handed the top k pages
    rankOf(scores, page) {
      const p = put(scores);
      try {
        return m._gb_rank_of(p, scores.length, page);
      } finally {
        free(p);
      }
    },
    pickShare(scores, page, k, temperature) {
      const p = put(scores);
      try {
        return m._gb_pick_share(p, scores.length, page, k, temperature);
      } finally {
        free(p);
      }
    },

    // Memory (see engine/memory.h), in bytes: the model's numbers, the context
    // cache for some number of tokens, and the most tokens that fit in a budget
    memWeights: (params, bits, extraBits) => m._gb_mem_weights(params, bits, extraBits),
    memKv: (layers, kvHeads, headDim, tokens, bits) => m._gb_mem_kv(layers, kvHeads, headDim, tokens, bits),
    memMaxTokens: (budget, weights, overhead, layers, kvHeads, headDim, bits) =>
      m._gb_mem_max_tokens(budget, weights, overhead, layers, kvHeads, headDim, bits),

    // Embeddings (see engine/embed.h). Learns from a text of word numbers (a
    // negative number ends a sentence): counts, weighted with PPMI, then every
    // eigenvalue and eigenvector, largest first. vectors is n x n, row per word.
    embedLearn(ids, vocab, window) {
      const n = vocab;
      const pi = putInts(ids);
      const pc = m._malloc(n * n * 8);
      const pv = m._malloc(n * 8);
      const pe = m._malloc(n * n * 8);
      try {
        m._gb_cooc(pi, ids.length, n, window, pc);
        m._gb_ppmi(pc, n, pc);
        if (m._gb_sym_eigen(pc, n, pv, pe) !== 0) throw new Error("out of memory");
        return { values: get(pv, n), vectors: get(pe, n * n) };
      } finally {
        free(pi, pc, pv, pe);
      }
    },

    // word vectors from the first k eigenvectors: n x k, each row of length 1
    embedTake(values, vectors, k) {
      const n = values.length;
      const pv = put(values);
      const pe = put(vectors);
      const po = m._malloc(n * k * 8);
      try {
        m._gb_embed_take(pv, pe, n, k, po);
        return get(po, n * k);
      } finally {
        free(pv, pe, po);
      }
    },

    // cosine similarity of q with every row of rows (n x dim)
    cosineRows(rows, dim, q) {
      const n = rows.length / dim;
      const pr = put(rows);
      const pq = put(q);
      const po = m._malloc(n * 8);
      try {
        m._gb_cosine_rows(pr, n, dim, pq, po);
        return get(po, n);
      } finally {
        free(pr, pq, po);
      }
    },

    // the average of the listed rows
    meanRows(rows, dim, ids) {
      const pr = put(rows);
      const pi = putInts(ids);
      const po = m._malloc(dim * 8);
      try {
        m._gb_mean_rows(pr, dim, pi, ids.length, po);
        return get(po, dim);
      } finally {
        free(pr, pi, po);
      }
    },

    // share of each word's `near` nearest neighbours that share its label
    neighbourAgreement(rows, dim, labels, near) {
      const pr = put(rows);
      const pl = putInts(labels);
      try {
        return m._gb_neighbour_agreement(pr, rows.length / dim, dim, pl, near);
      } finally {
        free(pr, pl);
      }
    },

    // a flat map of the rows along their two main directions: n x 2
    project2d(rows, dim) {
      const n = rows.length / dim;
      const pr = put(rows);
      const po = m._malloc(n * 2 * 8);
      try {
        if (m._gb_project_2d(pr, n, dim, po) !== 0) throw new Error("out of memory");
        return get(po, n * 2);
      } finally {
        free(pr, po);
      }
    },

    // Sampling settings (see engine/sampler.h). s is { temperature, topK, topP, minP };
    // topK 0, topP 1 and minP 0 switch a filter off.

    // one filter on odds that add up to 1: the odds shared out over the words kept
    filter(kind, p, value) {
      const n = p.length;
      const pp = put(p);
      const po = m._malloc(n * 8);
      try {
        const fn = { topK: "_gb_top_k", topP: "_gb_top_p", minP: "_gb_min_p" }[kind];
        const kept = m[fn](pp, n, value, po);
        return { odds: get(po, n), kept };
      } finally {
        free(pp, po);
      }
    },

    // the whole chain on scores: cutBy[i] is 0 if kept, 1 top-k, 2 top-p, 3 min-p
    sampleOdds(scores, s) {
      const n = scores.length;
      const ps = put(scores);
      const po = m._malloc(n * 8);
      const pc = m._malloc(n * 4);
      try {
        const kept = m._gb_sample_odds(ps, n, s.temperature, s.topK, s.topP, s.minP, po, pc);
        return { odds: get(po, n), kept, cutBy: m.HEAP32.slice(pc / 4, pc / 4 + n) };
      } finally {
        free(ps, po, pc);
      }
    },

    // the odds of words from..n-1 added up
    oddsFrom(p, from) {
      const pp = put(p);
      try {
        return m._gb_odds_from(pp, p.length, from);
      } finally {
        free(pp);
      }
    },

    // a reply from a word-pair model: counts from pairCounts, start as word numbers
    generate(counts, vocab, start, len, s, penalty, lastN, base, seed) {
      const pc = m._malloc(counts.length * 4);
      const pst = putInts(start);
      const po = m._malloc(len * 4);
      const pb = m._malloc(len * 8);
      try {
        m.HEAPU32.set(counts, pc / 4);
        const n = m._gb_generate(pc, vocab, pst, start.length, len, s.temperature, s.topK, s.topP, s.minP,
          penalty, lastN, base, seed >>> 0, po, pb);
        return { ids: m.HEAP32.slice(po / 4, po / 4 + n), before: get(pb, n) };
      } finally {
        free(pc, pst, po, pb);
      }
    },

    // share of a reply's k-word runs seen earlier in it
    loopShare(ids, k) {
      const pi = putInts(ids);
      try {
        return m._gb_loop_share(pi, ids.length, k);
      } finally {
        free(pi);
      }
    },

    // for each penalty: how loopy replies are, and the share of words the model rated below `unlikely`
    penaltyCurve(counts, vocab, start, len, s, lastN, base, penalties, runs, seed, unlikely) {
      const k = penalties.length;
      const pc = m._malloc(counts.length * 4);
      const pst = putInts(start);
      const pp = put(penalties);
      const pl = m._malloc(k * 8);
      const pd = m._malloc(k * 8);
      try {
        m.HEAPU32.set(counts, pc / 4);
        m._gb_penalty_curve(pc, vocab, pst, start.length, len, s.temperature, s.topK, s.topP, s.minP,
          lastN, base, pp, k, runs, seed >>> 0, unlikely, pl, pd);
        return { loops: get(pl, k), odd: get(pd, k) };
      } finally {
        free(pc, pst, pp, pl, pd);
      }
    },

    // LoRA on the word network (see engine/lora.h). The network stays as it is;
    // the strips B1, A1, B2, A2 are trained, starting from a fresh patch made from seed.
    loraTrain(params, vocab, hidden, rank, ids, epochs, rate, seed) {
      const k = m._gb_lora_params(vocab, hidden, rank);
      const pp = put(params);
      const pl = m._malloc(k * 8);
      const pi = putInts(ids);
      try {
        m._gb_lora_init(pl, vocab, hidden, rank, seed >>> 0);
        const loss = m._gb_lora_train(pp, pl, vocab, hidden, rank, pi, ids.length, epochs, rate);
        return { lora: get(pl, k), loss };
      } finally {
        free(pp, pl, pi);
      }
    },

    // the network with the patch added
    loraMerge(params, lora, vocab, hidden, rank) {
      const pp = put(params);
      const pl = put(lora);
      const po = m._malloc(params.length * 8);
      try {
        m._gb_lora_merge(pp, pl, vocab, hidden, rank, po);
        return get(po, params.length);
      } finally {
        free(pp, pl, po);
      }
    },

    // the closest rank-r version of a rows x cols matrix, as b (rows x r) times a (r x cols)
    lowRank(mat, rows, cols, rank) {
      const r = Math.min(rank, rows);
      const pm = put(mat);
      const pb = m._malloc(rows * r * 8);
      const pa = m._malloc(r * cols * 8);
      try {
        const kept = m._gb_low_rank(pm, rows, cols, r, pb, pa);
        return { kept, b: get(pb, rows * r), a: get(pa, r * cols) };
      } finally {
        free(pm, pb, pa);
      }
    },

    // what a fine-tune changed, number by number
    diff(after, before) {
      const pa = put(after);
      const pb = put(before);
      const po = m._malloc(after.length * 8);
      try {
        m._gb_diff(pa, pb, after.length, po);
        return get(po, after.length);
      } finally {
        free(pa, pb, po);
      }
    },

    nnParams: (vocab, hidden) => m._gb_nn_params(vocab, hidden),
    loraParams: (vocab, hidden, rank) => m._gb_lora_params(vocab, hidden, rank),
    gainShare: (before, after, best) => m._gb_gain_share(before, after, best),
    loraCount: (layers, hidden, qOut, kvOut, inter, rank, everyWeight) =>
      m._gb_lora_count(layers, hidden, qOut, kvOut, inter, rank, everyWeight ? 1 : 0),

    latticeCount: (bits, dims) => m._gb_lattice_count(bits, dims),
    quantStep: (maxAbs, bits) => m._gb_quant_step(maxAbs, bits),
    mseTheory: (maxAbs, bits) => m._gb_quant_mse_theory(maxAbs, bits),
  };
}
