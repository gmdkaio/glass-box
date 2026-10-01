#include "gb_wasm.h"

#include "rng.h"

void gb_wasm_weights(double *out, int n, unsigned int seed, double sigma) {
    gb_rng r;
    gb_rng_seed(&r, seed);
    for (int i = 0; i < n; i++) out[i] = sigma * gb_rng_normal(&r);
}
