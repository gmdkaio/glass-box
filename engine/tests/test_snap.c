#include <math.h>
#include <stdlib.h>

#include "check.h"
#include "quantize.h"
#include "rng.h"

static int near(double a, double b) {
    return fabs(a - b) < 1e-9;
}

int main(void) {
    /* answers between 0 and 100: the cells at 1 bit are 0-50 and 50-100, centers 25 and 75 */
    CHECK(near(gb_snap(10, 1, 0, 100), 25.0), "10 at 1 bit snaps to 25");
    CHECK(near(gb_snap(85, 1, 0, 100), 75.0), "85 at 1 bit snaps to 75");
    CHECK(near(gb_snap(10, 2, 0, 100), 12.5), "10 at 2 bits snaps to 12.5");
    CHECK(near(gb_snap(10, 3, 0, 100), 6.25), "10 at 3 bits snaps to 6.25");
    CHECK(near(gb_snap(10, 4, 0, 100), 9.375), "10 at 4 bits snaps to 9.375");
    CHECK(fabs(gb_snap(10, 16, 0, 100) - 10.0) < 0.001, "10 at 16 bits is within 0.001 of 10");

    /* outside the range clips to the first or last value */
    CHECK(near(gb_snap(-5, 2, 0, 100), 12.5), "below the range gives the first value");
    CHECK(near(gb_snap(150, 2, 0, 100), 87.5), "above the range gives the last value");

    /* same quantizer as gb_quantize_range when the range is [-1, 1] */
    gb_rng r;
    gb_rng_seed(&r, 4);
    int same = 1;
    for (int i = 0; i < 1000; i++) {
        double x = 2.0 * gb_rng_uniform(&r) - 1.0, q;
        gb_quantize_range(&x, &q, 1, 5, 1.0);
        if (!near(gb_snap(x, 5, -1.0, 1.0), q)) same = 0;
    }
    CHECK(same, "gb_snap on [-1, 1] matches gb_quantize_range");

    /* the answer is a listed value and no more than half a cell away */
    double levels[256];
    CHECK(gb_snap_levels(levels, 8, 0, 100, 256) == 256, "8 bits lists 256 values");
    double d = 100.0 / 256.0;
    int close = 1;
    for (int i = 0; i < 1000; i++) {
        double x = 100.0 * gb_rng_uniform(&r), s = gb_snap(x, 8, 0, 100);
        int listed = 0;
        for (int k = 0; k < 256; k++) if (near(levels[k], s)) listed = 1;
        if (!listed || fabs(s - x) > d / 2.0 + 1e-9) close = 0;
    }
    CHECK(close, "snapped values are listed and within half a cell");

    /* the list itself */
    double two[4];
    CHECK(gb_snap_levels(two, 2, 0, 100, 4) == 4, "2 bits lists 4 values");
    CHECK(near(two[0], 12.5) && near(two[1], 37.5) && near(two[2], 62.5) && near(two[3], 87.5),
          "2-bit values between 0 and 100");
    CHECK(gb_snap_levels(two, 3, 0, 100, 4) == 0, "more values than max_points returns 0");
    CHECK(gb_snap_levels(two, 0, 0, 100, 4) == 0, "0 bits returns 0");
    DONE();
}
