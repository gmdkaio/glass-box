#ifndef GB_RNG_H
#define GB_RNG_H

#include <stdint.h>

/* splitmix64: pseudo-random number generator. very fast. */
typedef struct {
    uint64_t state;
} gb_rng;

void gb_rng_seed(gb_rng *r, uint64_t seed);
uint64_t gb_rng_u64(gb_rng *r);
double gb_rng_uniform(gb_rng *r); /* uniform in [0, 1) */

/*
 * Standard normal (mean 0, variance 1) by the Box-Muller transform.
 * Uses two uniforms per call and keeps no cached second value, so the
 * sequence depends only on the seed and the number of calls.
 */
double gb_rng_normal(gb_rng *r);

#endif