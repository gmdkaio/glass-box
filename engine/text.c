#include "text.h"

#include <math.h>

size_t gb_pair_counts(const int *ids, size_t n, size_t vocab, size_t *counts) {
    for (size_t i = 0; i < vocab * vocab; i++) counts[i] = 0;

    size_t counted = 0;
    for (size_t i = 0; i + 1 < n; i++) {
        int a = ids[i], b = ids[i + 1];
        if (a < 0 || b < 0 || (size_t)a >= vocab || (size_t)b >= vocab) continue;
        counts[(size_t)a * vocab + (size_t)b]++;
        counted++;
    }
    return counted;
}

double gb_table_loss(const size_t *counts, size_t vocab, const int *ids, size_t n) {
    double total = 0.0;
    size_t pairs = 0;
    for (size_t i = 0; i + 1 < n; i++) {
        int a = ids[i], b = ids[i + 1];
        if (a < 0 || b < 0 || (size_t)a >= vocab || (size_t)b >= vocab) continue;
        size_t row_total = 0;
        for (size_t k = 0; k < vocab; k++) row_total += counts[(size_t)a * vocab + k];
        total -= log((double)counts[(size_t)a * vocab + (size_t)b] / (double)row_total);
        pairs++;
    }
    return pairs ? total / (double)pairs : 0.0;
}

size_t gb_row_odds(const size_t *row, size_t n, double *out) {
    size_t total = 0;
    for (size_t i = 0; i < n; i++) total += row[i];
    for (size_t i = 0; i < n; i++) out[i] = total ? (double)row[i] / (double)total : 0.0;
    return total;
}
