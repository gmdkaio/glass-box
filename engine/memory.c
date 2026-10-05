#include "memory.h"

#include <math.h>

double gb_mem_weights(double params, double bits, double extra_bits) {
    if (!(params > 0.0) || !(bits > 0.0) || extra_bits < 0.0) return 0.0;
    return params * (bits + extra_bits) / 8.0;
}

double gb_mem_kv(size_t layers, size_t kv_heads, size_t head_dim, double tokens, double bits) {
    if (!(tokens > 0.0) || !(bits > 0.0)) return 0.0;
    return 2.0 * (double)layers * (double)kv_heads * (double)head_dim * tokens * bits / 8.0;
}

double gb_mem_max_tokens(double budget, double weights, double overhead,
                         size_t layers, size_t kv_heads, size_t head_dim, double bits) {
    double left = budget - weights - overhead;
    double per_token = gb_mem_kv(layers, kv_heads, head_dim, 1.0, bits);
    if (!(left > 0.0) || !(per_token > 0.0)) return 0.0;
    return floor(left / per_token);
}
