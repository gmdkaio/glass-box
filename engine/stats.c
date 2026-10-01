#include "stats.h"

#include <math.h>

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
