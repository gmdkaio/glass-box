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

    /* softmax: [0, ln 3] gives 1/4 and 3/4 */
    double s2[2] = {0.0, log(3.0)}, p2[2];
    gb_softmax(s2, p2, 2, 1.0);
    CHECK(fabs(p2[0] - 0.25) < 1e-12 && fabs(p2[1] - 0.75) < 1e-12, "softmax of [0, ln 3]");

    /* equal scores share the probability evenly, even when huge */
    double eq[4] = {2, 2, 2, 2}, pe[4];
    gb_softmax(eq, pe, 4, 1.0);
    CHECK(fabs(pe[0] - 0.25) < 1e-12 && fabs(pe[3] - 0.25) < 1e-12, "equal scores give 1/4 each");
    double big[2] = {1000, 1000}, pb[2];
    gb_softmax(big, pb, 2, 1.0);
    CHECK(fabs(pb[0] - 0.5) < 1e-12 && fabs(pb[1] - 0.5) < 1e-12, "huge scores do not overflow");

    /* probabilities add up to 1 and keep the order of the scores */
    double sc[6] = {3.9, 3.6, 2.1, 0.4, -1.0, 3.9}, pr[6];
    gb_softmax(sc, pr, 6, 1.0);
    double total = 0.0;
    for (int i = 0; i < 6; i++) total += pr[i];
    CHECK(fabs(total - 1.0) < 1e-12, "probabilities add up to 1");
    CHECK(pr[0] > pr[1] && pr[1] > pr[2] && pr[2] > pr[3] && pr[3] > pr[4], "order of scores is kept");
    CHECK(pr[0] == pr[5], "equal scores get equal probability");

    /* temperature: higher flattens, lower sharpens, 0 picks the first highest */
    double hot[6], cold[6];
    gb_softmax(sc, hot, 6, 2.0);
    gb_softmax(sc, cold, 6, 0.5);
    CHECK(hot[0] < pr[0] && cold[0] > pr[0], "temperature flattens or sharpens the top score");
    double t3[3] = {1, 3, 3}, p3[3];
    gb_softmax(t3, p3, 3, 0.0);
    CHECK(p3[0] == 0.0 && p3[1] == 1.0 && p3[2] == 0.0, "temperature 0 is one-hot on the first highest");
    gb_softmax(t3, p3, 0, 1.0);

    free(w);
    free(q);
    free(e);
    DONE();
}
