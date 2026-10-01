#include "check.h"
#include "rng.h"

int main(void) {
    gb_rng a, b;
    gb_rng_seed(&a, 42);
    gb_rng_seed(&b, 42);
    for (int i = 0; i < 1000; i++)
        CHECK(gb_rng_u64(&a) == gb_rng_u64(&b), "same seed must give same sequence");

    gb_rng c;
    gb_rng_seed(&c, 43);
    gb_rng_seed(&a, 42);
    CHECK(gb_rng_u64(&a) != gb_rng_u64(&c), "different seeds should differ");

    gb_rng r;
    gb_rng_seed(&r, 1);
    double sum = 0.0;
    int n = 200000;
    for (int i = 0; i < n; i++) {
        double u = gb_rng_uniform(&r);
        CHECK(u >= 0.0 && u < 1.0, "uniform must lie in [0, 1)");
        sum += u;
    }
    double mean = sum / n;
    CHECK(mean > 0.495 && mean < 0.505, "uniform mean should be near 0.5");
    DONE();
}