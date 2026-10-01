#include "quantize.h"

#include <math.h>

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

double gb_quantize(const double *w, double *out, size_t n, int bits) {
    double d = gb_quant_step(gb_max_abs(w, n), bits);
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

double gb_mse(const double *a, const double *b, size_t n) {
    double s = 0.0;
    for (size_t i = 0; i < n; i++) {
        double e = a[i] - b[i];
        s += e * e;
    }
    return s / (double)n;
}

double gb_quant_mse_theory(double max_abs, int bits) {
    double d = gb_quant_step(max_abs, bits);
    return d * d / 12.0;
}