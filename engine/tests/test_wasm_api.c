#include <math.h>
#include <stdlib.h>

#include "chain.h"
#include "check.h"
#include "gb_wasm.h"
#include "quantize.h"
#include "stats.h"
#include "nn.h"
#include "text.h"

/*
 * Reference values from the native build. wasm/smoke.mjs checks the same
 * numbers on the wasm build. The tolerance is 1e-12 because wasm has its own
 * libm.
 */

static int near(double a, double b) {
    return fabs(a - b) <= 1e-12 * (1.0 + fabs(b));
}

int main(void) {
    double w[4];
    gb_wasm_weights(w, 4, 42u, 0.5);
    CHECK(near(w[0], 0.44112445311113441), "weight 0, seed 42");
    CHECK(near(w[1], -0.22542493785943005), "weight 1, seed 42");
    CHECK(near(w[2], 0.094176317057965753), "weight 2, seed 42");
    CHECK(near(w[3], 0.10979318959538049), "weight 3, seed 42");

    /* same seed, same weights; a different seed gives different ones */
    double w2[4], w3[4];
    gb_wasm_weights(w2, 4, 42u, 0.5);
    gb_wasm_weights(w3, 4, 43u, 0.5);
    int same = 1, differ = 0;
    for (int i = 0; i < 4; i++) {
        if (w[i] != w2[i]) same = 0;
        if (w[i] != w3[i]) differ = 1;
    }
    CHECK(same, "same seed must give the same weights");
    CHECK(differ, "different seeds should give different weights");

    int n = 1000;
    double *a = malloc(n * sizeof *a), *q = malloc(n * sizeof *q);
    gb_wasm_weights(a, n, 7u, 0.5);
    double d = gb_quantize(a, q, n, 4);
    CHECK(near(d, 0.23031356316482887), "delta, 1000 weights, 4 bits");
    CHECK(near(gb_mse(a, q, n), 0.0044214352935123382), "mse, 1000 weights, 4 bits");
    CHECK(near(gb_signal_kept(a, q, n), 0.98170753294561108), "signal kept, 1000 weights, 4 bits");

    size_t c[8];
    size_t got = gb_histogram(a, n, -1.0, 1.0, 8, c);
    size_t expect[8] = {53, 84, 160, 195, 195, 138, 93, 46};
    int hist_ok = got == 964;
    for (int i = 0; i < 8; i++) if (c[i] != expect[i]) hist_ok = 0;
    CHECK(hist_ok, "histogram counts of the 1000 weights");

    double t[4] = {0.55, -0.35, 0.8, -0.6}, tq[4];
    gb_quantize_range(t, tq, 4, 3, 1.0);
    CHECK(near(gb_dist(t, tq, 4), 0.11180339887498944), "distance to nearest point at 3 bits");

    double s[12];
    double ref_s[12] = {-0.234375, 0.515625, -0.546875, -0.796875, -0.609375, -0.234375,
                        0.984375, 0.015625, -0.140625, 0.203125, -0.109375, -0.734375};
    CHECK(gb_lattice4(s, 6, 3, 5u) == 3, "sample of 3 lattice points");
    int sample_ok = 1;
    for (int i = 0; i < 12; i++) if (!near(s[i], ref_s[i])) sample_ok = 0;
    CHECK(sample_ok, "lattice sample at 6 bits, seed 5");

    /* the sampler uses integers and a seeded generator, so the counts match exactly */
    double odds[3] = {0.5, 0.3, 0.2};
    size_t drawn[3];
    gb_sample_counts(odds, 3, 1000, 7u, drawn);
    CHECK(drawn[0] == 525 && drawn[1] == 290 && drawn[2] == 185, "1000 draws from 0.5 / 0.3 / 0.2, seed 7");
    double sc[5] = {3.9, 3.6, 2.1, 0.4, -2.5}, pr[5];
    size_t k[5];
    gb_softmax(sc, pr, 5, 1.0);
    gb_sample_counts(pr, 5, 1000, 11u, k);
    CHECK(k[0] == 537 && k[1] == 368 && k[2] == 77 && k[3] == 18 && k[4] == 0,
          "1000 draws from softmax of 5 scores, seed 11");

    /* word pairs: integers only, so the counts match exactly */
    int words[5] = {0, 1, 0, 2, 1};
    size_t pairs[9];
    CHECK(gb_pair_counts(words, 5, 3, pairs) == 4, "four word pairs");
    CHECK(pairs[1] == 1 && pairs[3] == 1 && pairs[2] == 1 && pairs[7] == 1 && pairs[0] == 0,
          "pair counts for 0 1 0 2 1");
    size_t row[3] = {0, 3, 1};
    double row_odds[3];
    CHECK(gb_row_odds(row, 3, row_odds) == 4 && near(row_odds[1], 0.75) && near(row_odds[2], 0.25), "row odds");

    /* the network uses tanh and exp, so wasm may differ a little: compare with a loose tolerance */
    int cyc[8] = {0, 1, 0, 1, 0, 1, 0, 2}, seq[80];
    for (int i = 0; i < 80; i++) seq[i] = cyc[i % 8];
    double *net = malloc(gb_nn_params(3, 4) * sizeof *net);
    gb_nn_init(net, 3, 4, 11u);
    CHECK(fabs(net[0] - -0.020302932507861002) < 1e-12, "first network number, seed 11");
    CHECK(fabs(gb_nn_loss(net, 3, 4, seq, 80) - 1.1157938749824245) < 1e-9, "untrained network loss");
    double trained = gb_nn_train(net, 3, 4, seq, 80, 400, 0.1);
    CHECK(fabs(trained - 0.28560851872361553) < 1e-6, "network loss after 400 passes");
    double nh[4], no[3];
    gb_nn_forward(net, 3, 4, 0, nh, no);
    CHECK(fabs(no[1] - 0.73269855127492012) < 1e-6 && fabs(no[2] - 0.26634060096578566) < 1e-6,
          "odds after word 0 once trained");
    free(net);

    /* long tasks: rng draws and comparisons only, so the runs match exactly */
    CHECK(near(gb_chain_odds(0.95, 20, 5, 0.9, 3), 0.88502068381965826), "odds, 20 steps checked every 5");
    size_t out[3], at[20];
    double redone = gb_chain_trials(0.95, 20, 5, 0.9, 3, 1000, 7u, out, at);
    CHECK(out[0] == 891 && out[1] == 104 && out[2] == 5, "1000 runs, seed 7: clean, broken, gave up");
    CHECK(near(redone, 4.8), "steps redone per run, seed 7");
    CHECK(at[0] == 8 && at[10] == 2 && at[19] == 6, "where runs broke, seed 7");
    int ev[64];
    size_t written;
    int broke;
    int outcome = gb_chain_trace(0.8, 12, 4, 0.8, 2, 5u, ev, 64, &written, &broke);
    const int want[20] = {0, 0, 0, 0, 2, 0, 0, 1, 0, 3, 0, 0, 0, 1, 3, 1, 1, 1, 0, 3};
    int match = outcome == GB_CHAIN_GAVE_UP && written == 20 && broke == 4;
    for (int i = 0; match && i < 20; i++) match = ev[i] == want[i];
    CHECK(match, "trace of one run, seed 5");

    free(a);
    free(q);
    DONE();
}
