#include <math.h>

#include "check.h"
#include "memory.h"

int main(void) {
    /* weights: params x bits / 8, plus the extra bits a format stores */
    CHECK(gb_mem_weights(8.2e9, 16.0, 0.0) == 16.4e9, "8.2B at 16 bits is 16.4 GB");
    CHECK(gb_mem_weights(8.2e9, 4.0, 0.5) == 8.2e9 * 4.5 / 8.0, "4 bits plus half a bit for scales");
    CHECK(gb_mem_weights(-1.0, 4.0, 0.0) == 0.0 && gb_mem_weights(1e9, 0.0, 0.0) == 0.0, "nonsense in, zero out");

    /* Qwen3-8B: 36 layers, 8 key-value heads of 128 numbers. At 16 bits that is
       144 KiB per token, so 32,768 tokens take 4.5 GiB */
    double per = gb_mem_kv(36, 8, 128, 1.0, 16.0);
    CHECK(per == 147456.0, "144 KiB per token");
    CHECK(gb_mem_kv(36, 8, 128, 32768.0, 16.0) == 4.5 * 1024.0 * 1024.0 * 1024.0, "32k tokens: 4.5 GiB");
    CHECK(gb_mem_kv(36, 8, 128, 1000.0, 8.0) == per * 1000.0 / 2.0, "an 8-bit cache is half");
    CHECK(gb_mem_kv(64, 8, 128, 1.0, 16.0) == 262144.0, "Qwen3-32B: 256 KiB per token");
    CHECK(gb_mem_kv(36, 8, 128, 0.0, 16.0) == 0.0, "no tokens, no cache");

    /* the longest context: what is left after weights and overhead, per token */
    double gib = 1024.0 * 1024.0 * 1024.0;
    double w = gb_mem_weights(8.2e9, 4.0, 0.5);
    double fit = gb_mem_max_tokens(12.0 * gib, w, 0.5 * gib, 36, 8, 128, 16.0);
    CHECK(fit == floor((12.0 * gib - w - 0.5 * gib) / per), "max tokens by hand");
    CHECK(gb_mem_kv(36, 8, 128, fit, 16.0) + w + 0.5 * gib <= 12.0 * gib, "and it really fits");
    CHECK(gb_mem_kv(36, 8, 128, fit + 1.0, 16.0) + w + 0.5 * gib > 12.0 * gib, "one more does not");
    CHECK(gb_mem_max_tokens(4.0 * gib, 16.4e9, 0.5 * gib, 36, 8, 128, 16.0) == 0.0, "weights alone too big");
    CHECK(gb_mem_max_tokens(12.0 * gib, w, 0.5 * gib, 36, 8, 128, 8.0) == floor((12.0 * gib - w - 0.5 * gib) / (per / 2.0)),
          "an 8-bit cache fits about twice the tokens");
    DONE();
}
