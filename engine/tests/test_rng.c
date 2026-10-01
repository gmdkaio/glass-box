#include <math.h>

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

    /* normal: same seed, same sequence */
    gb_rng_seed(&a, 42);
    gb_rng_seed(&b, 42);
    for (int i = 0; i < 1000; i++)
        CHECK(gb_rng_normal(&a) == gb_rng_normal(&b), "same seed must give same normals");

    /* normal: moments of N(0, 1). Standard error of the mean is 1/sqrt(n) ~ 0.0022. */
    gb_rng_seed(&r, 5);
    double s1 = 0.0, s2 = 0.0, s4 = 0.0;
    int within = 0, finite = 1;
    for (int i = 0; i < n; i++) {
        double x = gb_rng_normal(&r);
        if (!(x > -10.0 && x < 10.0)) finite = 0;
        s1 += x;
        s2 += x * x;
        s4 += x * x * x * x;
        if (x > -1.0 && x < 1.0) within++;
    }
    CHECK(finite, "normals must be finite");
    CHECK(fabs(s1 / n) < 0.01, "normal mean should be near 0");
    CHECK(fabs(s2 / n - 1.0) < 0.02, "normal variance should be near 1");
    CHECK(fabs(s4 / n - 3.0) < 0.15, "normal fourth moment should be near 3");
    CHECK(fabs((double)within / n - 0.6827) < 0.005, "about 68.27% within one sigma");
    DONE();
}