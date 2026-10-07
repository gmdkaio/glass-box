#ifndef GB_MEMORY_H
#define GB_MEMORY_H

#include <stddef.h>

/*
 * What a model needs in memory to run: its numbers, and a cache that grows with
 * every token of the conversation. All sizes are in bytes.
 */

/*
 * The model's numbers: params of them at `bits` each, plus `extra_bits` per
 * number for what a format stores alongside them (scale factors). Returns 0 for
 * negative inputs.
 */
double gb_mem_weights(double params, double bits, double extra_bits);

/*
 * The context cache (KV cache): for every token and every layer, a key and a
 * value for each key-value head, each head_dim numbers of `bits` each.
 *
 *   2 * layers * kv_heads * head_dim * tokens * bits / 8
 */
double gb_mem_kv(size_t layers, size_t kv_heads, size_t head_dim, double tokens, double bits);

/*
 * The most tokens of context that fit in `budget` once the weights and a fixed
 * runtime `overhead` are loaded. 0 if those alone do not fit.
 */
double gb_mem_max_tokens(double budget, double weights, double overhead,
                         size_t layers, size_t kv_heads, size_t head_dim, double bits);

/*
 * Everything one setup needs: the weights (as gb_mem_weights), the cache for
 * `tokens` tokens at cache_bits (as gb_mem_kv) and the runtime overhead.
 */
double gb_mem_total(double params, double bits, double extra_bits,
                    size_t layers, size_t kv_heads, size_t head_dim, double tokens,
                    double cache_bits, double overhead);

#endif
