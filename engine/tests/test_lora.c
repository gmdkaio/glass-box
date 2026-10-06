#include <math.h>
#include <stdlib.h>
#include <string.h>

#include "check.h"
#include "lora.h"
#include "nn.h"
#include "rng.h"

static double merged_loss(const double *base, const double *lora, size_t V, size_t H, size_t r,
                          const int *ids, size_t n) {
    double *p = malloc(gb_nn_params(V, H) * sizeof *p);
    gb_lora_merge(base, lora, V, H, r, p);
    double l = gb_nn_loss(p, V, H, ids, n);
    free(p);
    return l;
}

int main(void) {
    const size_t V = 5, H = 4, r = 2;
    CHECK(gb_lora_params(V, H, r) == 36, "2 x 2 x (5 + 4) numbers");

    double base[64], lora[36], merged[64];
    gb_nn_init(base, V, H, 3u);
    gb_lora_init(lora, V, H, r, 4u);
    gb_lora_merge(base, lora, V, H, r, merged);
    CHECK(memcmp(base, merged, gb_nn_params(V, H) * sizeof *base) == 0, "a fresh patch changes nothing");

    /* merge by hand: B1 row 1 = (1, 0), A1 row 0 = A1[0..H) */
    double one[36] = {0};
    one[1 * r + 0] = 1.0;
    for (size_t j = 0; j < H; j++) one[V * r + j] = 0.5 * (double)j;
    gb_lora_merge(base, one, V, H, r, merged);
    CHECK(merged[1 * H + 3] == base[1 * H + 3] + 1.5 && merged[0] == base[0], "layer 1 row 1 gets A1 row 0");

    /* the steps follow the gradient: one pair, a tiny rate, against finite differences */
    gb_rng g;
    gb_rng_seed(&g, 9u);
    for (size_t i = 0; i < 36; i++) lora[i] = 0.4 * gb_rng_normal(&g);
    const int pair[2] = {1, 3};
    const double rate = 1e-6, h = 1e-6;
    double stepped[36];
    memcpy(stepped, lora, sizeof lora);
    gb_lora_train(base, stepped, V, H, r, pair, 2, 1, rate);
    int ok = 1;
    for (size_t i = 0; i < 36; i++) {
        double up[36], down[36];
        memcpy(up, lora, sizeof lora);
        memcpy(down, lora, sizeof lora);
        up[i] += h;
        down[i] -= h;
        double numeric = (merged_loss(base, up, V, H, r, pair, 2) - merged_loss(base, down, V, H, r, pair, 2)) / (2 * h);
        double taken = (lora[i] - stepped[i]) / rate;
        ok &= fabs(numeric - taken) < 1e-4 * (1.0 + fabs(numeric));
    }
    CHECK(ok, "every strip's step matches the finite-difference gradient");

    /* training lowers the loss and leaves the network alone */
    const int text[12] = {0, 1, 2, 0, 1, 3, 0, 1, 2, 0, 1, 4};
    double before[64];
    memcpy(before, base, sizeof base);
    gb_lora_init(lora, V, H, r, 4u);
    double l0 = merged_loss(base, lora, V, H, r, text, 12);
    double l1 = gb_lora_train(base, lora, V, H, r, text, 12, 200, 0.1);
    CHECK(l1 < l0 - 0.3, "training the strips lowers the loss");
    CHECK(fabs(l1 - merged_loss(base, lora, V, H, r, text, 12)) < 1e-12, "it returns the patched loss");
    CHECK(memcmp(before, base, sizeof base) == 0, "the network stays frozen");

    const double d1[3] = {1.0, 2.5, -1.0}, d0[3] = {0.5, 2.5, 1.0};
    double dd[3];
    gb_diff(d1, d0, 3, dd);
    CHECK(dd[0] == 0.5 && dd[1] == 0.0 && dd[2] == -2.0, "what changed");

    CHECK(fabs(gb_gain_share(4.0, 2.0, 1.0) - 2.0 / 3.0) < 1e-12, "gain share by hand");
    CHECK(gb_gain_share(1.0, 0.5, 2.0) == 0.0, "no gain to share");

    /* low rank: rows (3, 0, 0) and (0, 1, 0); rank 1 keeps 9 of 10 */
    const double m[6] = {3.0, 0.0, 0.0, 0.0, 1.0, 0.0};
    double b[2], a[3];
    CHECK(fabs(gb_low_rank(m, 2, 3, 1, b, a) - 0.9) < 1e-12, "rank 1 keeps 90% of the squares");
    CHECK(fabs(fabs(b[0]) - 1.0) < 1e-12 && fabs(b[0] * a[0] - 3.0) < 1e-12 && fabs(a[1]) < 1e-12, "b times a is the big row");
    CHECK(fabs(gb_low_rank(m, 2, 3, 2, NULL, NULL) - 1.0) < 1e-12, "full rank keeps it all");
    const double outer[6] = {1.0, 2.0, 3.0, 2.0, 4.0, 6.0};
    double b2[2], a2[3];
    gb_low_rank(outer, 2, 3, 1, b2, a2);
    int same = 1;
    for (int i = 0; i < 2; i++)
        for (int k = 0; k < 3; k++) same &= fabs(b2[i] * a2[k] - outer[i * 3 + k]) < 1e-12;
    CHECK(same, "a rank-1 matrix comes back exactly");

    /* Qwen3-8B, rank 1: attention 4096+4096, 2 x (4096+1024), 4096+4096 = 26624 a layer;
       every weight adds 3 x (4096 + 12288) = 49152 */
    CHECK(gb_lora_count(36, 4096, 4096, 1024, 12288, 1, 0) == 36.0 * 26624.0, "attention only, rank 1");
    CHECK(gb_lora_count(36, 4096, 4096, 1024, 12288, 8, 1) == 8.0 * 36.0 * (26624.0 + 49152.0), "every weight, rank 8");
    DONE();
}
