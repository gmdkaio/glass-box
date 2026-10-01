#include <math.h>
#include <stdlib.h>

#include "check.h"
#include "quantize.h"

/* true if every coordinate is one of the 2^bits levels */
static int on_levels(const double *p, size_t n, int bits) {
    double m = ldexp(1.0, bits);
    for (size_t i = 0; i < n; i++) {
        double k = (p[i] + 1.0) * m / 2.0 - 0.5;
        if (fabs(k - round(k)) > 1e-9 || round(k) < 0 || round(k) > m - 1) return 0;
    }
    return 1;
}

static int same_point(const double *a, const double *b) {
    for (int j = 0; j < 4; j++)
        if (fabs(a[j] - b[j]) > 1e-12) return 0;
    return 1;
}

static int all_distinct(const double *p, size_t count) {
    for (size_t i = 0; i < count; i++)
        for (size_t j = i + 1; j < count; j++)
            if (same_point(p + 4 * i, p + 4 * j)) return 0;
    return 1;
}

int main(void) {
    CHECK(gb_lattice_count(1, 4) == 16.0, "1 bit, 4 numbers: 16");
    CHECK(gb_lattice_count(2, 4) == 256.0, "2 bits, 4 numbers: 256");
    CHECK(gb_lattice_count(4, 4) == 65536.0, "4 bits, 4 numbers: 65536");
    CHECK(gb_lattice_count(3, 1) == 8.0, "3 bits, 1 number: 8");

    /* 1 bit: levels are -0.5 and 0.5, so 16 corners of a half-size box */
    double p1[16 * 4];
    CHECK(gb_lattice4(p1, 1, 16, 0) == 16, "1 bit writes 16 points");
    CHECK(on_levels(p1, 64, 1), "1-bit coordinates are -0.5 or 0.5");
    CHECK(all_distinct(p1, 16), "1-bit points are all different");
    CHECK(p1[0] == -0.5 && p1[63] == 0.5, "first and last 1-bit corners");

    /* 2 bits: 256 points on the levels -0.75 -0.25 0.25 0.75, balanced around 0 */
    double *p2 = malloc(256 * 4 * sizeof *p2);
    CHECK(gb_lattice4(p2, 2, 256, 0) == 256, "2 bits writes 256 points");
    CHECK(on_levels(p2, 1024, 2), "2-bit coordinates sit on the 4 levels");
    CHECK(all_distinct(p2, 256), "2-bit points are all different");
    double sum = 0.0;
    for (int i = 0; i < 1024; i++) sum += p2[i];
    CHECK(fabs(sum) < 1e-9, "2-bit lattice is centered on 0");
    free(p2);

    /* every lattice point is its own nearest point under the quantizer */
    double *p3 = malloc(4096 * 4 * sizeof *p3);
    CHECK(gb_lattice4(p3, 3, 4096, 0) == 4096, "3 bits writes 4096 points");
    int fixed = 1;
    for (int i = 0; i < 4096; i++) {
        double q[4];
        gb_quantize_range(p3 + 4 * i, q, 4, 3, 1.0);
        if (!same_point(p3 + 4 * i, q)) fixed = 0;
    }
    CHECK(fixed, "quantizing a lattice point gives the same point");
    free(p3);

    /* more points than max_points: random sample, same seed gives the same sample */
    double a[3 * 4], b[3 * 4], c[3 * 4];
    CHECK(gb_lattice4(a, 6, 3, 5) == 3, "sampling writes max_points points");
    gb_lattice4(b, 6, 3, 5);
    gb_lattice4(c, 6, 3, 6);
    int same = 1, differ = 0;
    for (int i = 0; i < 12; i++) {
        if (a[i] != b[i]) same = 0;
        if (a[i] != c[i]) differ = 1;
    }
    CHECK(same, "same seed gives the same sample");
    CHECK(differ, "a different seed gives a different sample");
    CHECK(on_levels(a, 12, 6), "sampled coordinates sit on the 64 levels");

    /* a large sample stays on the levels and covers both halves of the range */
    size_t big = 20000;
    double *s = malloc(big * 4 * sizeof *s);
    CHECK(gb_lattice4(s, 8, big, 1) == big, "large sample size");
    CHECK(on_levels(s, big * 4, 8), "large sample sits on the 256 levels");
    int neg = 0;
    for (size_t i = 0; i < big * 4; i++) if (s[i] < 0.0) neg++;
    CHECK(fabs((double)neg / (double)(big * 4) - 0.5) < 0.01, "about half the sample is negative");
    free(s);

    /* huge bit counts must sample, not enumerate */
    double h[2 * 4];
    CHECK(gb_lattice4(h, 24, 2, 3) == 2, "24 bits samples 2 points");

    /* nothing to write */
    double z[4];
    CHECK(gb_lattice4(z, 0, 4, 0) == 0, "0 bits writes nothing");
    CHECK(gb_lattice4(z, 3, 0, 0) == 0, "max_points 0 writes nothing");
    DONE();
}
