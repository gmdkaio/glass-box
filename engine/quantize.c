#include "quantize.h"

#include <math.h>

#include "rng.h"

double gb_max_abs(const double *w, size_t n) {
    double m = 0.0;
    for (size_t i = 0; i < n; i++) {
        double a = fabs(w[i]);
        if (a > m) m = a;
    }
    return m;
}

double gb_quant_step(double max_abs, int bits) {
    return 2.0 * max_abs / ldexp(1.0, bits);
}

double gb_quantize_range(const double *w, double *out, size_t n, int bits,
                         double max_abs) {
    double d = gb_quant_step(max_abs, bits);
    if (d == 0.0) {
        for (size_t i = 0; i < n; i++) out[i] = 0.0;
        return 0.0;
    }
    double lo = -ldexp(1.0, bits - 1);
    double hi = ldexp(1.0, bits - 1) - 1.0;
    for (size_t i = 0; i < n; i++) {
        double k = floor(w[i] / d);
        if (k < lo) k = lo;
        if (k > hi) k = hi;
        out[i] = (k + 0.5) * d;
    }
    return d;
}

double gb_quantize(const double *w, double *out, size_t n, int bits) {
    return gb_quantize_range(w, out, n, bits, gb_max_abs(w, n));
}

double gb_mse(const double *a, const double *b, size_t n) {
    double s = 0.0;
    for (size_t i = 0; i < n; i++) {
        double e = a[i] - b[i];
        s += e * e;
    }
    return s / (double)n;
}

double gb_dist(const double *a, const double *b, size_t n) {
    double s = 0.0;
    for (size_t i = 0; i < n; i++) {
        double e = a[i] - b[i];
        s += e * e;
    }
    return sqrt(s);
}

double gb_signal_kept(const double *w, const double *q, size_t n) {
    double power = 0.0;
    for (size_t i = 0; i < n; i++) power += w[i] * w[i];
    power /= (double)n;
    if (power == 0.0) return 0.0;
    double kept = 1.0 - gb_mse(w, q, n) / power;
    return kept < 0.0 ? 0.0 : kept;
}

double gb_snap(double x, int bits, double lo, double hi) {
    double n = ldexp(1.0, bits);
    double d = (hi - lo) / n;
    double k = floor((x - lo) / d);
    if (k < 0.0) k = 0.0;
    if (k > n - 1.0) k = n - 1.0;
    return lo + (k + 0.5) * d;
}

size_t gb_snap_levels(double *out, int bits, double lo, double hi, size_t max_points) {
    if (bits < 1) return 0;
    double n = ldexp(1.0, bits);
    if (n > (double)max_points) return 0;
    double d = (hi - lo) / n;
    for (size_t k = 0; k < (size_t)n; k++) out[k] = lo + ((double)k + 0.5) * d;
    return (size_t)n;
}

double gb_lattice_count(int bits, int dims) {
    return ldexp(1.0, bits * dims);
}

/* level j of 2^bits on [-1, 1], at the cell center */
static double level(double j, double n) {
    return -1.0 + (2.0 * j + 1.0) / n;
}

size_t gb_lattice4(double *out, int bits, size_t max_points, unsigned int seed) {
    if (bits < 1 || max_points == 0) return 0;
    double n = ldexp(1.0, bits);
    size_t w = 0;

    if (gb_lattice_count(bits, 4) <= (double)max_points) {
        int m = (int)n;
        for (int a = 0; a < m; a++)
            for (int b = 0; b < m; b++)
                for (int c = 0; c < m; c++)
                    for (int d = 0; d < m; d++) {
                        out[w++] = level(a, n);
                        out[w++] = level(b, n);
                        out[w++] = level(c, n);
                        out[w++] = level(d, n);
                    }
        return w / 4;
    }

    gb_rng r;
    gb_rng_seed(&r, seed);
    for (size_t i = 0; i < max_points * 4; i++)
        out[i] = level(floor(gb_rng_uniform(&r) * n), n);
    return max_points;
}

double gb_quant_mse_theory(double max_abs, int bits) {
    double d = gb_quant_step(max_abs, bits);
    return d * d / 12.0;
}