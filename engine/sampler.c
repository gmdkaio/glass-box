#include "sampler.h"

#include <math.h>
#include <stdlib.h>

#include "rng.h"
#include "stats.h"

/* indices of p from the highest odds down; ties keep the lower index first */
static void order_desc(const double *p, size_t n, size_t *idx) {
    for (size_t i = 0; i < n; i++) {
        size_t j = i;
        while (j > 0 && p[idx[j - 1]] < p[i]) {
            idx[j] = idx[j - 1];
            j--;
        }
        idx[j] = i;
    }
}

/* shares the kept odds out again so they add up to 1; cut words get 0 */
static size_t share_out(const double *p, size_t n, const unsigned char *keep, double *out) {
    double sum = 0.0;
    size_t kept = 0;
    for (size_t i = 0; i < n; i++)
        if (keep[i]) {
            sum += p[i];
            kept++;
        }
    for (size_t i = 0; i < n; i++) out[i] = (keep[i] && sum > 0.0) ? p[i] / sum : 0.0;
    return kept;
}

/* a filter that is off keeps every word with odds above 0 */
static size_t keep_all(const double *p, size_t n, double *out) {
    double sum = 0.0;
    size_t kept = 0;
    for (size_t i = 0; i < n; i++)
        if (p[i] > 0.0) {
            sum += p[i];
            kept++;
        }
    for (size_t i = 0; i < n; i++) out[i] = p[i] > 0.0 ? p[i] / sum : 0.0;
    return kept;
}

size_t gb_top_k(const double *p, size_t n, size_t k, double *out) {
    if (k == 0 || k >= n) return keep_all(p, n, out);
    size_t *idx = malloc((n ? n : 1) * sizeof *idx);
    unsigned char *keep = calloc(n ? n : 1, 1);
    if (!idx || !keep) {
        free(idx);
        free(keep);
        return 0;
    }
    order_desc(p, n, idx);
    for (size_t r = 0; r < n; r++)
        keep[idx[r]] = p[idx[r]] > 0.0 && (k == 0 || r < k);
    size_t kept = share_out(p, n, keep, out);
    free(idx);
    free(keep);
    return kept;
}

size_t gb_top_p(const double *p, size_t n, double top_p, double *out) {
    if (top_p >= 1.0) return keep_all(p, n, out);
    size_t *idx = malloc((n ? n : 1) * sizeof *idx);
    unsigned char *keep = calloc(n ? n : 1, 1);
    if (!idx || !keep) {
        free(idx);
        free(keep);
        return 0;
    }
    order_desc(p, n, idx);
    double sum = 0.0;
    for (size_t r = 0; r < n; r++) {
        if (!(p[idx[r]] > 0.0)) break;
        keep[idx[r]] = 1;
        sum += p[idx[r]];
        if (top_p < 1.0 && sum >= top_p) break;
    }
    size_t kept = share_out(p, n, keep, out);
    free(idx);
    free(keep);
    return kept;
}

size_t gb_min_p(const double *p, size_t n, double min_p, double *out) {
    if (min_p <= 0.0) return keep_all(p, n, out);
    unsigned char *keep = calloc(n ? n : 1, 1);
    if (!keep) return 0;
    double top = 0.0;
    for (size_t i = 0; i < n; i++)
        if (p[i] > top) top = p[i];
    for (size_t i = 0; i < n; i++) keep[i] = p[i] > 0.0 && (min_p <= 0.0 || p[i] >= min_p * top);
    size_t kept = share_out(p, n, keep, out);
    free(keep);
    return kept;
}

void gb_repeat_penalty(const double *scores, size_t n, const int *recent, size_t m,
                       double penalty, double *out) {
    unsigned char *seen = calloc(n ? n : 1, 1);
    for (size_t i = 0; i < n; i++) out[i] = scores[i];
    if (!seen) return;
    for (size_t j = 0; j < m; j++)
        if (recent[j] >= 0 && (size_t)recent[j] < n) seen[recent[j]] = 1;
    for (size_t i = 0; i < n; i++)
        if (seen[i]) out[i] = out[i] > 0.0 ? out[i] / penalty : out[i] * penalty;
    free(seen);
}

double gb_odds_from(const double *p, size_t n, size_t from) {
    double sum = 0.0;
    for (size_t i = from; i < n; i++) sum += p[i];
    return sum;
}

size_t gb_sample_odds(const double *scores, size_t n, double temperature, size_t top_k,
                      double top_p, double min_p, double *out, int *cut_by) {
    if (n == 0) return 0;
    double *a = malloc(n * sizeof *a);
    double *b = malloc(n * sizeof *b);
    if (!a || !b) {
        free(a);
        free(b);
        return 0;
    }
    gb_softmax(scores, a, n, 1.0);
    if (cut_by)
        for (size_t i = 0; i < n; i++) cut_by[i] = GB_KEPT;

    /* each filter in turn; a word it drops is marked with that filter */
    for (int f = GB_CUT_TOP_K; f <= GB_CUT_MIN_P; f++) {
        if (f == GB_CUT_TOP_K) gb_top_k(a, n, top_k, b);
        else if (f == GB_CUT_TOP_P) gb_top_p(a, n, top_p, b);
        else gb_min_p(a, n, min_p, b);
        for (size_t i = 0; i < n; i++) {
            if (cut_by && a[i] > 0.0 && b[i] == 0.0) cut_by[i] = f;
            a[i] = b[i];
        }
    }

    /* the temperature on the words left: exp(score / T) over them */
    size_t top = n, kept = 0;
    for (size_t i = 0; i < n; i++)
        if (a[i] > 0.0) {
            kept++;
            if (top == n || scores[i] > scores[top]) top = i;
        }
    double sum = 0.0;
    for (size_t i = 0; i < n; i++) {
        if (!(a[i] > 0.0)) out[i] = 0.0;
        else if (!(temperature > 0.0)) out[i] = i == top ? 1.0 : 0.0;
        else out[i] = exp((scores[i] - scores[top]) / temperature);
        sum += out[i];
    }
    for (size_t i = 0; i < n; i++) out[i] /= sum;
    free(a);
    free(b);
    return kept;
}

size_t gb_generate(const size_t *counts, size_t vocab, const int *start, size_t nstart,
                   size_t len, double temperature, size_t top_k, double top_p, double min_p,
                   double penalty, size_t last_n, double base, unsigned int seed, int *out,
                   double *before) {
    if (nstart == 0 || nstart > len || vocab == 0) return 0;
    double *s = malloc(vocab * sizeof *s);
    double *plain = malloc(vocab * sizeof *plain);
    double *odds = malloc(vocab * sizeof *odds);
    if (!s || !plain || !odds) {
        free(s);
        free(plain);
        free(odds);
        return 0;
    }
    for (size_t i = 0; i < nstart; i++) {
        out[i] = start[i];
        if (before) before[i] = 1.0;
    }
    gb_rng r;
    gb_rng_seed(&r, seed);

    size_t n = nstart;
    while (n < len) {
        int prev = out[n - 1];
        if (prev < 0 || (size_t)prev >= vocab) break;
        const size_t *row = counts + (size_t)prev * vocab;
        int any = 0;
        for (size_t j = 0; j < vocab; j++) {
            s[j] = row[j] ? base + log((double)row[j]) : -INFINITY;
            any |= row[j] != 0;
        }
        if (!any) break;
        gb_softmax(s, plain, vocab, 1.0);

        size_t from = n > last_n ? n - last_n : 0;
        gb_repeat_penalty(s, vocab, out + from, n - from, penalty, s);
        gb_sample_odds(s, vocab, temperature, top_k, top_p, min_p, odds, NULL);

        double u = gb_rng_uniform(&r), cumulative = 0.0;
        size_t pick = vocab;
        for (size_t j = 0; j < vocab; j++) {
            if (odds[j] > 0.0) pick = j; /* rounding leftovers go to the last word in play */
            cumulative += odds[j];
            if (odds[j] > 0.0 && u < cumulative) break;
        }
        out[n] = (int)pick;
        if (before) before[n] = plain[pick];
        n++;
    }
    free(s);
    free(plain);
    free(odds);
    return n;
}

double gb_loop_share(const int *ids, size_t n, size_t k) {
    if (k == 0 || n <= k) return 0.0;
    size_t runs = n - k + 1, repeated = 0;
    for (size_t s = 1; s < runs; s++)
        for (size_t t = 0; t < s; t++) {
            size_t j = 0;
            while (j < k && ids[s + j] == ids[t + j]) j++;
            if (j == k) {
                repeated++;
                break;
            }
        }
    return (double)repeated / (double)runs;
}

void gb_penalty_curve(const size_t *counts, size_t vocab, const int *start, size_t nstart,
                      size_t len, double temperature, size_t top_k, double top_p,
                      double min_p, size_t last_n, double base, const double *penalties,
                      size_t m, size_t runs, unsigned int seed, double unlikely,
                      double *loops, double *odd) {
    int *ids = malloc((len ? len : 1) * sizeof *ids);
    double *before = malloc((len ? len : 1) * sizeof *before);
    for (size_t j = 0; j < m; j++) loops[j] = odd[j] = 0.0;
    if (!ids || !before || runs == 0) {
        free(ids);
        free(before);
        return;
    }
    for (size_t j = 0; j < m; j++) {
        size_t picks = 0, rare = 0;
        for (size_t k = 0; k < runs; k++) {
            size_t n = gb_generate(counts, vocab, start, nstart, len, temperature, top_k, top_p,
                                   min_p, penalties[j], last_n, base, seed + (unsigned int)k,
                                   ids, before);
            loops[j] += gb_loop_share(ids, n, 3);
            for (size_t i = nstart; i < n; i++) {
                picks++;
                rare += before[i] < unlikely;
            }
        }
        loops[j] /= (double)runs;
        odd[j] = picks ? (double)rare / (double)picks : 0.0;
    }
    free(ids);
    free(before);
}
