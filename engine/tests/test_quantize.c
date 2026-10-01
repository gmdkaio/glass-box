#include <math.h>
#include <stdlib.h>

#include "check.h"
#include "quantize.h"
#include "rng.h"

#define N 200000

static double *uniform_weights(unsigned long long seed) {
    double *w = malloc(N * sizeof *w);
    gb_rng r;
    gb_rng_seed(&r, seed);
    for (int i = 0; i < N; i++) w[i] = 2.0 * gb_rng_uniform(&r) - 1.0;
    return w;
}

int main(void) {
    /* step size: delta = 2*max / 2^b */
    CHECK(fabs(gb_quant_step(1.0, 1) - 1.0) < 1e-12, "delta at 1 bit, max 1");
    CHECK(fabs(gb_quant_step(1.0, 3) - 0.25) < 1e-12, "delta at 3 bits, max 1");

    /* 1 bit: only the two levels +-max/2 */
    double w1[4] = {-1.0, -0.2, 0.3, 1.0}, q1[4];
    gb_quantize(w1, q1, 4, 1);
    CHECK(q1[0] == -0.5 && q1[1] == -0.5 && q1[2] == 0.5 && q1[3] == 0.5,
          "1-bit levels should be -0.5, -0.5, 0.5, 0.5");

    /* all-zero input must not divide by zero */
    double z[3] = {0, 0, 0}, qz[3] = {1, 1, 1};
    gb_quantize(z, qz, 3, 4);
    CHECK(qz[0] == 0.0 && qz[1] == 0.0 && qz[2] == 0.0, "zeros stay zero");

    double *w = uniform_weights(7);
    double *q = malloc(N * sizeof *q);
    double mse_by_bits[10];

    for (int b = 1; b <= 8; b++) {
        double d = gb_quantize(w, q, N, b);

        /* every output sits on a legal level (k + 0.5) * delta, k in range */
        double lo = -ldexp(1.0, b - 1), hi = ldexp(1.0, b - 1) - 1.0;
        int legal = 1;
        for (int i = 0; i < N; i++) {
            double k = q[i] / d - 0.5;
            if (fabs(k - round(k)) > 1e-9 || round(k) < lo || round(k) > hi) legal = 0;
        }
        CHECK(legal, "outputs must lie on the 2^b allowed levels");

        /* measured MSE matches delta^2 / 12 within 1% */
        double m = gb_mse(w, q, N);
        double th = gb_quant_mse_theory(gb_max_abs(w, N), b);
        CHECK(fabs(m / th - 1.0) < 0.01, "measured MSE should match delta^2/12 within 1%");
        mse_by_bits[b] = m;
    }

    /* one extra bit cuts MSE by about 4x (6.02 dB) */
    for (int b = 1; b < 8; b++) {
        double r = mse_by_bits[b] / mse_by_bits[b + 1];
        CHECK(r > 3.9 && r < 4.1, "each extra bit should cut MSE about 4x");
    }

    free(w);
    free(q);
    DONE();
}