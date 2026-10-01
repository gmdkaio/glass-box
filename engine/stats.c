#include "stats.h"

#include <math.h>

#include "rng.h"

size_t gb_histogram(const double *x, size_t n, double lo, double hi,
                    size_t bins, size_t *counts) {
    for (size_t b = 0; b < bins; b++) counts[b] = 0;
    if (bins == 0 || !(hi > lo)) return 0;

    size_t counted = 0;
    double scale = (double)bins / (hi - lo);
    for (size_t i = 0; i < n; i++) {
        double v = x[i];
        if (!(v >= lo && v <= hi)) continue; /* also rejects NaN */
        size_t b = (size_t)floor((v - lo) * scale);
        if (b >= bins) b = bins - 1;
        counts[b]++;
        counted++;
    }
    return counted;
}

void gb_softmax(const double *x, double *out, size_t n, double temperature) {
    if (n == 0) return;
    size_t top = 0;
    for (size_t i = 1; i < n; i++)
        if (x[i] > x[top]) top = i;

    if (!(temperature > 0.0)) {
        for (size_t i = 0; i < n; i++) out[i] = (i == top) ? 1.0 : 0.0;
        return;
    }

    /* subtracting the highest score keeps exp() from overflowing */
    double sum = 0.0;
    for (size_t i = 0; i < n; i++) {
        out[i] = exp((x[i] - x[top]) / temperature);
        sum += out[i];
    }
    for (size_t i = 0; i < n; i++) out[i] /= sum;
}

void gb_sample_counts(const double *p, size_t n, size_t draws, unsigned int seed,
                      size_t *counts) {
    for (size_t i = 0; i < n; i++) counts[i] = 0;

    size_t last = n;
    for (size_t i = 0; i < n; i++)
        if (p[i] > 0.0) last = i;
    if (last == n) return;

    gb_rng r;
    gb_rng_seed(&r, seed);
    for (size_t d = 0; d < draws; d++) {
        double u = gb_rng_uniform(&r);
        double cumulative = 0.0;
        size_t pick = last;
        for (size_t i = 0; i < last; i++) {
            cumulative += p[i];
            if (u < cumulative) {
                pick = i;
                break;
            }
        }
        counts[pick]++;
    }
}
