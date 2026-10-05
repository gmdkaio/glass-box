#include "retrieve.h"

#include <math.h>

void gb_bm25(const int *terms, const size_t *start, size_t pages, size_t vocab,
             const int *query, const double *weights, size_t nquery,
             double k1, double b, double *scores) {
    for (size_t p = 0; p < pages; p++) scores[p] = 0.0;
    if (pages == 0) return;

    double avglen = (double)(start[pages] - start[0]) / (double)pages;
    if (avglen <= 0.0) return;

    for (size_t w = 0; w < nquery; w++) {
        int word = query[w];
        if (word < 0 || (size_t)word >= vocab) continue;

        /* how many pages hold the word */
        size_t df = 0;
        for (size_t p = 0; p < pages; p++)
            for (size_t i = start[p]; i < start[p + 1]; i++)
                if (terms[i] == word) {
                    df++;
                    break;
                }
        if (df == 0) continue;
        double idf = log(1.0 + ((double)pages - (double)df + 0.5) / ((double)df + 0.5));
        double weight = weights ? weights[w] : 1.0;

        for (size_t p = 0; p < pages; p++) {
            double f = 0.0;
            for (size_t i = start[p]; i < start[p + 1]; i++) f += terms[i] == word;
            if (f == 0.0) continue;
            double len = (double)(start[p + 1] - start[p]);
            scores[p] += weight * idf * f * (k1 + 1.0) / (f + k1 * (1.0 - b + b * len / avglen));
        }
    }
}

size_t gb_rank_of(const double *scores, size_t pages, size_t page) {
    size_t rank = 0;
    for (size_t p = 0; p < pages; p++)
        if (scores[p] > scores[page] || (scores[p] == scores[page] && p < page)) rank++;
    return rank;
}

double gb_pick_share(const double *scores, size_t pages, size_t page, size_t k, double temperature) {
    if (page >= pages || k == 0 || gb_rank_of(scores, pages, page) >= k) return 0.0;
    if (k > pages) k = pages;
    if (!(temperature > 0.0)) temperature = 1e-9;

    /* the top k scores: every page that ranks below k */
    double top = scores[page];
    for (size_t p = 0; p < pages; p++)
        if (gb_rank_of(scores, pages, p) < k && scores[p] > top) top = scores[p];
    double sum = 0.0;
    for (size_t p = 0; p < pages; p++)
        if (gb_rank_of(scores, pages, p) < k) sum += exp((scores[p] - top) / temperature);
    return exp((scores[page] - top) / temperature) / sum;
}
