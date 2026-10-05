#include <math.h>
#include <stdlib.h>

#include "calib.h"
#include "check.h"

int main(void) {
    /* bins: counts, average stated confidence and share right, by hand */
    const double c[6] = {0.05, 0.15, 0.95, 0.9, 1.0, 0.99};
    const int y[6] = {0, 1, 1, 0, 1, 1};
    unsigned int count[10];
    double stated[10], right[10];
    CHECK(gb_calib_bins(c, y, 6, 10, count, stated, right) == 6, "six counted");
    CHECK(count[0] == 1 && count[1] == 1 && count[9] == 4, "1.0 goes in the last bin");
    CHECK(fabs(stated[9] - (0.95 + 0.9 + 1.0 + 0.99) / 4) < 1e-12 && right[9] == 0.75, "last bin");
    CHECK(count[5] == 0 && stated[5] == 0.0 && right[5] == 0.0, "an empty bin is all zeros");
    const double odd[3] = {-0.1, 1.5, NAN};
    const int oy[3] = {1, 1, 1};
    CHECK(gb_calib_bins(odd, oy, 3, 10, count, stated, right) == 0, "out of range and NaN are skipped");

    /* calibration error by hand: two bins, gaps 0.05 and |0.96 - 0.75|, weighted 1, 1 and 4 */
    double want = (fabs(0.05 - 0.0) + fabs(0.15 - 1.0) + fabs((0.95 + 0.9 + 1.0 + 0.99) - 3.0)) / 6.0;
    CHECK(fabs(gb_calib_error(c, y, 6, 10) - want) < 1e-12, "error by hand");
    CHECK(gb_calib_error(c, y, 0, 10) == 0.0 && gb_calib_error(c, y, 6, 0) == 0.0, "nothing to count");

    /* Brier: average squared distance from the outcome */
    const double bc[2] = {0.8, 0.3};
    const int by[2] = {1, 1};
    CHECK(fabs(gb_calib_brier(bc, by, 2) - (0.04 + 0.49) / 2) < 1e-12, "brier by hand");

    /* an honest model: share right matches stated confidence in every busy bin */
    const size_t n = 200000;
    double *conf = malloc(n * sizeof *conf);
    int *ok = malloc(n * sizeof *ok);
    gb_calib_sample(n, 0.5, 1.5, 0.0, 3, conf, ok);
    CHECK(gb_calib_error(conf, ok, n, 10) < 0.01, "honest model, small error");
    gb_calib_bins(conf, ok, n, 10, count, stated, right);
    int close = 1;
    for (int b = 0; b < 10; b++)
        if (count[b] > 5000) close &= fabs(stated[b] - right[b]) < 0.02;
    CHECK(close, "honest model, every busy bin on the line");

    /* sounding surer: stated confidence above the share right, and a larger error */
    gb_calib_sample(n, 0.5, 1.5, 1.5, 3, conf, ok);
    double say = 0.0, hit = 0.0;
    for (size_t i = 0; i < n; i++) {
        say += conf[i];
        hit += ok[i];
    }
    CHECK(say / n > hit / n + 0.1, "overconfident: says more than it gets");
    CHECK(gb_calib_error(conf, ok, n, 10) > 0.1, "overconfident, large error");

    /* the fitted correction undoes the shift, and the corrected answers are honest */
    double fix = gb_calib_fit_shift(conf, ok, n);
    CHECK(fabs(fix + 1.5) < 0.05, "fit finds about -1.5");
    gb_calib_apply(conf, n, fix, conf);
    CHECK(gb_calib_error(conf, ok, n, 10) < 0.01, "corrected, small error");

    /* the fit stays in range when the outcomes all agree */
    const int all[2] = {1, 1};
    CHECK(gb_calib_fit_shift(bc, all, 2) > 19.9, "all right: as high as allowed");
    CHECK(gb_calib_fit_shift(bc, all, 0) == 0.0, "no answers");

    /* apply: shift 0 keeps the confidences, and 0 and 1 stay finite */
    const double edge[3] = {0.0, 0.25, 1.0};
    double out[3];
    gb_calib_apply(edge, 3, 0.0, out);
    CHECK(out[0] < 1e-9 && fabs(out[1] - 0.25) < 1e-12 && out[2] > 1 - 1e-9, "shift 0 keeps them");
    gb_calib_apply(edge, 3, log(3.0), out);
    CHECK(fabs(out[1] - 0.5) < 1e-12, "1:3 odds times 3 is even");

    /* same seed, same answers */
    double a[50], b2[50];
    int ya[50], yb[50];
    gb_calib_sample(50, 0.0, 1.0, 0.5, 9, a, ya);
    gb_calib_sample(50, 0.0, 1.0, 0.5, 9, b2, yb);
    int same = 1;
    for (int i = 0; i < 50; i++) same &= a[i] == b2[i] && ya[i] == yb[i];
    CHECK(same, "same seed, same answers");

    free(conf);
    free(ok);
    DONE();
}
