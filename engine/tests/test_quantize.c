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

    /* fixed range: values outside are clipped to the outermost level.
       max 1, 2 bits: delta 0.5, levels -0.75 -0.25 0.25 0.75 */
    double wc[3] = {-5.0, 0.1, 5.0}, qc[3];
    double dc = gb_quantize_range(wc, qc, 3, 2, 1.0);
    CHECK(dc == 0.5, "delta for max 1 at 2 bits");
    CHECK(qc[0] == -0.75 && qc[1] == 0.25 && qc[2] == 0.75, "out-of-range values clip to the edge levels");

    /* range 0 writes zeros and returns 0 */
    double qr[3] = {1, 1, 1};
    CHECK(gb_quantize_range(wc, qr, 3, 2, 0.0) == 0.0 && qr[0] == 0.0 && qr[2] == 0.0, "range 0 gives zeros");

    /* gb_quantize is gb_quantize_range over the data's own range */
    double *qa = malloc(N * sizeof *qa);
    gb_quantize(w, q, N, 5);
    gb_quantize_range(w, qa, N, 5, gb_max_abs(w, N));
    int same = 1;
    for (int i = 0; i < N; i++) if (q[i] != qa[i]) same = 0;
    CHECK(same, "gb_quantize must equal gb_quantize_range with the data's own max");

    /* bell-shaped weights: theory holds at 8 bits, the delta^2/12 rule needs evenly spread weights */
    double *bell = malloc(N * sizeof *bell);
    gb_rng nr;
    gb_rng_seed(&nr, 21);
    for (int i = 0; i < N; i++) bell[i] = 0.5 * gb_rng_normal(&nr);
    gb_quantize(bell, qa, N, 8);
    double ratio8 = gb_mse(bell, qa, N) / gb_quant_mse_theory(gb_max_abs(bell, N), 8);
    CHECK(fabs(ratio8 - 1.0) < 0.02, "bell weights at 8 bits should match delta^2/12 within 2%");

    /* one huge outlier stretches the range: almost every weight falls in the two
       middle cells and rounds to +-delta/2, so measured error is about 3x theory */
    bell[0] = 1000.0;
    gb_quantize(bell, qa, N, 4);
    double ratio_out = gb_mse(bell, qa, N) / gb_quant_mse_theory(gb_max_abs(bell, N), 4);
    CHECK(ratio_out > 2.5 && ratio_out < 3.5, "outlier should push measured error to about 3x theory");

    /* tesseract view: 4 numbers in [-1, 1], range fixed at 1.
       1 bit rounds each to +-0.5, distance sqrt(0.05^2 + 0.15^2 + 0.3^2 + 0.1^2) */
    double t[4] = {0.55, -0.35, 0.8, -0.6}, tq[4];
    gb_quantize_range(t, tq, 4, 1, 1.0);
    CHECK(tq[0] == 0.5 && tq[1] == -0.5 && tq[2] == 0.5 && tq[3] == -0.5, "nearest 1-bit corner");
    CHECK(fabs(gb_dist(t, tq, 4) - sqrt(0.125)) < 1e-12, "distance to the nearest corner");
    double a3[3] = {0, 0, 0}, b3[3] = {1, 2, 2};
    CHECK(fabs(gb_dist(a3, b3, 3) - 3.0) < 1e-12, "gb_dist on a 3-4-5 style triple");

    /* each coordinate is off by at most delta/2, so the 4D distance is at most delta */
    gb_rng tr;
    gb_rng_seed(&tr, 3);
    int bounded = 1;
    for (int b = 1; b <= 8; b++) {
        double d = gb_quant_step(1.0, b);
        for (int k = 0; k < 1000; k++) {
            double p[4], pq[4];
            for (int j = 0; j < 4; j++) p[j] = 2.0 * gb_rng_uniform(&tr) - 1.0;
            gb_quantize_range(p, pq, 4, b, 1.0);
            if (gb_dist(p, pq, 4) > d * (1.0 + 1e-9)) bounded = 0;
        }
    }
    CHECK(bounded, "distance to the nearest allowed point is at most delta");

    /* signal kept */
    double zero[3] = {0, 0, 0}, ones[3] = {1, -1, 1}, nul[3] = {0, 0, 0};
    CHECK(fabs(gb_signal_kept(ones, ones, 3) - 1.0) < 1e-12, "identical arrays keep everything");
    CHECK(gb_signal_kept(ones, nul, 3) == 0.0, "all-zero output keeps nothing");
    CHECK(gb_signal_kept(zero, zero, 3) == 0.0, "all-zero input returns 0, not NaN");
    double prev = -1.0;
    int rising = 1;
    for (int b = 1; b <= 8; b++) {
        gb_quantize(bell + 1, qa, N - 1, b);
        double kept = gb_signal_kept(bell + 1, qa, N - 1);
        if (kept < prev) rising = 0;
        prev = kept;
    }
    CHECK(rising, "signal kept should not fall as bits go up");
    CHECK(prev > 0.999, "8 bits should keep almost everything");

    free(qa);
    free(bell);
    free(w);
    free(q);
    DONE();
}