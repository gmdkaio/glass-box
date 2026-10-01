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

#endif
