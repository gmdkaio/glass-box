#ifndef GB_WASM_H
#define GB_WASM_H

/*
 * Entry points that exist only because JavaScript cannot build a gb_rng or pass
 * a 64-bit seed. Everything else in the engine is exported to wasm as is.
 */

/* Fills out[0..n) with sigma * N(0, 1), seeded by a 32-bit seed. */
void gb_wasm_weights(double *out, int n, unsigned int seed, double sigma);

#endif
