#ifndef GB_STATS_H
#define GB_STATS_H

#include <stddef.h>

/*
 * Equal-width histogram of x over [lo, hi] with `bins` bins.
 * A value v goes to bin floor((v - lo) / (hi - lo) * bins); v == hi lands in
 * the last bin. Values outside [lo, hi] and NaNs are not counted.
 * counts must have room for `bins` entries and is overwritten.
 * Returns how many values were counted, or 0 if bins == 0 or hi <= lo.
 */
size_t gb_histogram(const double *x, size_t n, double lo, double hi,
                    size_t bins, size_t *counts);

/*
 * Turns scores into probabilities that add up to 1: exp(x / t), divided by
 * the sum. A higher temperature flattens them, a lower one sharpens them.
 * If temperature <= 0 all the probability goes to the first highest score.
 */
void gb_softmax(const double *x, double *out, size_t n, double temperature);

/*
 * Picks an index from probabilities p[0..n) `draws` times with a seeded
 * generator, and counts how often each index came up. counts has room for n
 * entries and is overwritten. A draw never lands on an index with probability
 * 0, and rounding leftovers go to the last index with a probability above 0.
 */
void gb_sample_counts(const double *p, size_t n, size_t draws, unsigned int seed,
                      size_t *counts);

#endif
