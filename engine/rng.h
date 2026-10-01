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

#endif