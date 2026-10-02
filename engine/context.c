#include "context.h"

#include <math.h>
#include <stdlib.h>

#include "rng.h"
#include "stats.h"

size_t gb_context_place(size_t n, double place) {
    if (n == 0) return 0;
    if (!(place > 0.0)) return 0; /* also NaN */
    if (place >= 1.0) return n - 1;
    return (size_t)floor(place * (double)(n - 1) + 0.5);
}

/* the scores from a generator that is already running, so trials can share one */
static void scores_from(gb_rng *r, size_t n, size_t key_at, double key_score, double spread,
                        size_t lookalikes, double lookalike_score, double dip, double *scores) {
    for (size_t i = 0; i < n; i++) {
        double x = n > 1 ? (double)i / (double)(n - 1) : 0.0;
        scores[i] = spread * gb_rng_normal(r) - dip * 4.0 * x * (1.0 - x);
    }

    /* pick the look-alikes among the other sentences: a partial shuffle of the
       places that are not the key */
    size_t rest = n > 1 ? n - 1 : 0;
    if (lookalikes > rest) lookalikes = rest;
    size_t *others = lookalikes ? malloc(rest * sizeof *others) : NULL;
    if (others) {
        for (size_t i = 0, k = 0; i < n; i++)
            if (i != key_at) others[k++] = i;
        for (size_t j = 0; j < lookalikes; j++) {
            size_t pick = j + (size_t)(gb_rng_uniform(r) * (double)(rest - j));
            size_t t = others[j];
            others[j] = others[pick];
            others[pick] = t;
            double x = n > 1 ? (double)others[j] / (double)(n - 1) : 0.0;
            scores[others[j]] = lookalike_score - dip * 4.0 * x * (1.0 - x);
        }
        free(others);
    }

    double x = n > 1 ? (double)key_at / (double)(n - 1) : 0.0;
    scores[key_at] = key_score - dip * 4.0 * x * (1.0 - x);
}

void gb_context_scores(size_t n, size_t key_at, double key_score, double spread,
                       size_t lookalikes, double lookalike_score, double dip,
                       unsigned int seed, double *scores) {
    if (n == 0 || key_at >= n) return;
    gb_rng r;
    gb_rng_seed(&r, seed);
    scores_from(&r, n, key_at, key_score, spread, lookalikes, lookalike_score, dip, scores);
}

double gb_context_share(size_t n, double place, double key_score, double spread,
                        size_t lookalikes, double lookalike_score, double dip,
                        size_t trials, unsigned int seed) {
    if (n == 0 || trials == 0) return 0.0;
    double *scores = malloc(n * sizeof *scores);
    double *share = malloc(n * sizeof *share);
    if (!scores || !share) {
        free(scores);
        free(share);
        return 0.0;
    }

    size_t key_at = gb_context_place(n, place);
    gb_rng r;
    gb_rng_seed(&r, seed);
    double total = 0.0;
    for (size_t t = 0; t < trials; t++) {
        scores_from(&r, n, key_at, key_score, spread, lookalikes, lookalike_score, dip, scores);
        gb_softmax(scores, share, n, 1.0);
        total += share[key_at];
    }
    free(scores);
    free(share);
    return total / (double)trials;
}
