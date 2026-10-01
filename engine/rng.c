#include "rng.h"

void gb_rng_seed(gb_rng *r, uint64_t seed) {
    r->state = seed;
}

uint64_t gb_rng_u64(gb_rng *r) {
    uint64_t z = (r->state += 0x9E3779B97F4A7C15ULL);
    z = (z ^ (z >> 30)) * 0xBF58476D1CE4E5B9ULL;
    z = (z ^ (z >> 27)) * 0x94D049BB133111EBULL;
    return z ^ (z >> 31);
}

double gb_rng_uniform(gb_rng *r) {
    /* top 53 bits scaled by 2^-53 */
    return (double)(gb_rng_u64(r) >> 11) * (1.0 / 9007199254740992.0);
}