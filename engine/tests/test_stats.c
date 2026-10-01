#include <math.h>
#include <stdlib.h>

#include "check.h"
#include "quantize.h"
#include "rng.h"
#include "stats.h"

#define N 200000

int main(void) {
    /* edges: lo goes in the first bin, hi in the last, outside values and NaN are skipped */
    double x[8] = {0.0, 0.25, 0.5, 0.99, 1.0, -0.1, 1.1, NAN};
    size_t c[4];
    size_t counted = gb_histogram(x, 8, 0.0, 1.0, 4, c);
    CHECK(counted == 5, "five values lie inside [0, 1]");
    CHECK(c[0] == 1 && c[1] == 1 && c[2] == 1 && c[3] == 2, "bin counts at the edges");

    /* counts are overwritten, not added to */
    c[0] = c[1] = c[2] = c[3] = 99;
    gb_histogram(x, 8, 0.0, 1.0, 4, c);
    CHECK(c[0] == 1 && c[3] == 2, "counts must be reset on every call");

    /* bad arguments */
    CHECK(gb_histogram(x, 8, 0.0, 1.0, 0, c) == 0, "zero bins returns 0");
    CHECK(gb_histogram(x, 8, 1.0, 1.0, 4, c) == 0, "empty range returns 0");
    CHECK(c[0] == 0 && c[3] == 0, "empty range leaves zeros");

    /* the rounding error of uniform weights, in units of delta, is flat on [-1/2, 1/2) */
    double *w = malloc(N * sizeof *w);
    double *q = malloc(N * sizeof *q);
    double *e = malloc(N * sizeof *e);
    gb_rng r;
    gb_rng_seed(&r, 9);
    for (int i = 0; i < N; i++) w[i] = 2.0 * gb_rng_uniform(&r) - 1.0;
    double d = gb_quantize(w, q, N, 4);
    for (int i = 0; i < N; i++) e[i] = (q[i] - w[i]) / d;

    /* the weight at +-max has error exactly 0.5 in theory but can land ~3e-16 outside
       in floating point, so the range gets a tolerance far below one bin */
    size_t h[10];
    size_t got = gb_histogram(e, N, -0.5 - 1e-9, 0.5 + 1e-9, 10, h);
    CHECK(got == N, "every error lies in [-0.5, 0.5]");
    int flat = 1;
    for (int b = 0; b < 10; b++)
        if (fabs((double)h[b] / (N / 10.0) - 1.0) > 0.03) flat = 0;
    CHECK(flat, "uniform weights give a flat error histogram within 3%");

    free(w);
    free(q);
    free(e);
    DONE();
}
