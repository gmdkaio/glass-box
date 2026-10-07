#include "calib.h"

#include <math.h>

#include "rng.h"

static double sigmoid(double x) { return 1.0 / (1.0 + exp(-x)); }

/* confidences of exactly 0 or 1 would give infinite log-odds */
static double logit(double c) {
    const double eps = 1e-12;
    if (c < eps) c = eps;
    if (c > 1.0 - eps) c = 1.0 - eps;
    return log(c / (1.0 - c));
}

void gb_calib_sample(size_t n, double mean, double spread, double shift, unsigned int seed,
                     double *conf, int *correct) {
    gb_rng r;
    gb_rng_seed(&r, seed);
    for (size_t i = 0; i < n; i++) {
        double z = mean + spread * gb_rng_normal(&r);
        conf[i] = sigmoid(z + shift);
        correct[i] = gb_rng_uniform(&r) < sigmoid(z);
    }
}

size_t gb_calib_bins(const double *conf, const int *correct, size_t n, size_t bins,
                     unsigned int *count, double *stated, double *right) {
    if (bins == 0) return 0;
    for (size_t b = 0; b < bins; b++) {
        count[b] = 0;
        stated[b] = 0.0;
        right[b] = 0.0;
    }
    size_t counted = 0;
    for (size_t i = 0; i < n; i++) {
        double c = conf[i];
        if (!(c >= 0.0 && c <= 1.0)) continue; /* also NaN */
        size_t b = (size_t)(c * (double)bins);
        if (b >= bins) b = bins - 1;
        count[b]++;
        stated[b] += c;
        right[b] += correct[i] ? 1.0 : 0.0;
        counted++;
    }
    for (size_t b = 0; b < bins; b++) {
        if (count[b] == 0) continue;
        stated[b] /= (double)count[b];
        right[b] /= (double)count[b];
    }
    return counted;
}

double gb_calib_error(const double *conf, const int *correct, size_t n, size_t bins) {
    if (bins == 0) return 0.0;
    /* one pass per bin keeps this free of allocation; bins is small */
    double gap = 0.0;
    size_t counted = 0;
    for (size_t b = 0; b < bins; b++) {
        size_t k = 0;
        double stated = 0.0, right = 0.0;
        for (size_t i = 0; i < n; i++) {
            double c = conf[i];
            if (!(c >= 0.0 && c <= 1.0)) continue;
            size_t at = (size_t)(c * (double)bins);
            if (at >= bins) at = bins - 1;
            if (at != b) continue;
            k++;
            stated += c;
            right += correct[i] ? 1.0 : 0.0;
        }
        gap += fabs(stated - right); /* k * |mean stated - share right| */
        counted += k;
    }
    return counted ? gap / (double)counted : 0.0;
}

double gb_calib_brier(const double *conf, const int *correct, size_t n) {
    if (n == 0) return 0.0;
    double sum = 0.0;
    for (size_t i = 0; i < n; i++) {
        double d = conf[i] - (correct[i] ? 1.0 : 0.0);
        sum += d * d;
    }
    return sum / (double)n;
}

void gb_calib_means(const double *conf, const int *correct, size_t n, double *out) {
    out[0] = out[1] = 0.0;
    if (n == 0) return;
    for (size_t i = 0; i < n; i++) {
        out[0] += conf[i];
        out[1] += correct[i] ? 1.0 : 0.0;
    }
    out[0] /= (double)n;
    out[1] /= (double)n;
}

/* The log loss falls and then rises as s grows, so its slope,
   sum(sigmoid(logit(c) + s) - outcome), crosses zero once: find it by halving. */
double gb_calib_fit_shift(const double *conf, const int *correct, size_t n) {
    if (n == 0) return 0.0;
    double lo = -20.0, hi = 20.0;
    for (int step = 0; step < 100; step++) {
        double mid = 0.5 * (lo + hi);
        double slope = 0.0;
        for (size_t i = 0; i < n; i++) slope += sigmoid(logit(conf[i]) + mid) - (correct[i] ? 1.0 : 0.0);
        if (slope > 0.0)
            hi = mid;
        else
            lo = mid;
    }
    return 0.5 * (lo + hi);
}

void gb_calib_apply(const double *conf, size_t n, double shift, double *out) {
    for (size_t i = 0; i < n; i++) out[i] = sigmoid(logit(conf[i]) + shift);
}
