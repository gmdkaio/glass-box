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
                        size_t lookalikes, double lookalike_score, double dip, double *scores,
                        int *kinds) {
    for (size_t i = 0; i < n; i++) {
        double x = n > 1 ? (double)i / (double)(n - 1) : 0.0;
        scores[i] = spread * gb_rng_normal(r) - dip * 4.0 * x * (1.0 - x);
        if (kinds) kinds[i] = GB_SENTENCE_FILLER;
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
            if (kinds) kinds[others[j]] = GB_SENTENCE_LOOKALIKE;
        }
        free(others);
    }

    double x = n > 1 ? (double)key_at / (double)(n - 1) : 0.0;
    scores[key_at] = key_score - dip * 4.0 * x * (1.0 - x);
    if (kinds) kinds[key_at] = GB_SENTENCE_KEY;
}

void gb_context_scores(size_t n, size_t key_at, double key_score, double spread,
                       size_t lookalikes, double lookalike_score, double dip,
                       unsigned int seed, double *scores) {
    if (n == 0 || key_at >= n) return;
    gb_rng r;
    gb_rng_seed(&r, seed);
    scores_from(&r, n, key_at, key_score, spread, lookalikes, lookalike_score, dip, scores, NULL);
}

void gb_context_kinds(size_t n, size_t key_at, double key_score, double spread,
                      size_t lookalikes, double lookalike_score, double dip,
                      unsigned int seed, double *scores, int *kinds) {
    if (n == 0 || key_at >= n) return;
    gb_rng r;
    gb_rng_seed(&r, seed);
    scores_from(&r, n, key_at, key_score, spread, lookalikes, lookalike_score, dip, scores, kinds);
}

void gb_context_split(size_t n, size_t key_at, double key_score, double spread,
                      size_t lookalikes, double lookalike_score, double dip,
                      size_t trials, unsigned int seed, double *out) {
    out[0] = out[1] = out[2] = 0.0;
    if (n == 0 || trials == 0 || key_at >= n) return;
    double *scores = malloc(n * sizeof *scores);
    double *share = malloc(n * sizeof *share);
    int *kinds = malloc(n * sizeof *kinds);
    if (scores && share && kinds) {
        /* where each kind adds up: the key in out[0], look-alikes in out[1], the rest in out[2] */
        static const int slot[3] = {2, 1, 0};
        for (size_t t = 0; t < trials; t++) {
            gb_context_kinds(n, key_at, key_score, spread, lookalikes, lookalike_score, dip,
                             seed + (unsigned int)t, scores, kinds);
            gb_softmax(scores, share, n, 1.0);
            for (size_t i = 0; i < n; i++) out[slot[kinds[i]]] += share[i];
        }
        for (int k = 0; k < 3; k++) out[k] /= (double)trials;
    }
    free(scores);
    free(share);
    free(kinds);
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
        scores_from(&r, n, key_at, key_score, spread, lookalikes, lookalike_score, dip, scores, NULL);
        gb_softmax(scores, share, n, 1.0);
        total += share[key_at];
    }
    free(scores);
    free(share);
    return total / (double)trials;
}
