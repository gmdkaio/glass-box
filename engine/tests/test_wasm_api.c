#include <math.h>
#include <stdlib.h>

#include "check.h"
#include "gb_wasm.h"
#include "quantize.h"
#include "stats.h"

/*
 * Reference values for the wasm cross-check. wasm/smoke.mjs asserts the same
 * numbers on the Emscripten build, so if both pass the two builds agree.
 * Compare with a tolerance: wasm uses its own libm, which can differ in the
 * last bit.
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

    free(a);
    free(q);
    DONE();
}
