#include <math.h>
#include <stdlib.h>

#include "check.h"
#include "embed.h"

int main(void) {
    /* co-occurrence: a b c | a b, window 1; nothing crosses the break */
    const int text[6] = {0, 1, 2, -1, 0, 1};
    double c[9];
    gb_cooc(text, 6, 3, 1, c);
    CHECK(c[0 * 3 + 1] == 2.0 && c[1 * 3 + 0] == 2.0, "a b twice, both ways");
    CHECK(c[1 * 3 + 2] == 1.0 && c[0 * 3 + 2] == 0.0, "b c once; a c out of the window");
    CHECK(c[0] == 0.0 && c[4] == 0.0, "a word is not its own neighbour");
    const int across[3] = {2, -1, 0};
    gb_cooc(across, 3, 3, 5, c);
    CHECK(c[2 * 3 + 0] == 0.0, "no pair across a sentence break");
    gb_cooc(text, 6, 3, 2, c);
    CHECK(c[0 * 3 + 2] == 1.0, "window 2 reaches a c");

    /* PPMI by hand: counts [[0,2],[2,2]], total 6, rows 2 and 4 */
    const double cc[4] = {0.0, 2.0, 2.0, 2.0};
    double p[4];
    gb_ppmi(cc, 2, p);
    CHECK(p[0] == 0.0, "never seen: 0");
    CHECK(fabs(p[1] - log(2.0 * 6.0 / (2.0 * 4.0))) < 1e-12, "PMI of a pair by hand");
    CHECK(p[3] == 0.0, "less than chance: clipped to 0 (log 0.75 < 0)");

    /* eigen: a 2 x 2 with eigenvalues 3 and 1 */
    const double m2[4] = {2.0, 1.0, 1.0, 2.0};
    double val[2], vec[4];
    CHECK(gb_sym_eigen(m2, 2, val, vec) == 0, "eigen runs");
    CHECK(fabs(val[0] - 3.0) < 1e-12 && fabs(val[1] - 1.0) < 1e-12, "values 3 and 1, largest first");
    CHECK(fabs(fabs(vec[0]) - sqrt(0.5)) < 1e-12 && fabs(vec[0] - vec[2]) < 1e-12, "first vector is (1, 1) / sqrt 2");

    /* a random symmetric 12 x 12: A v = lambda v, and the vectors are orthonormal */
    const size_t n = 12;
    double *a = malloc(n * n * sizeof *a), *vs = malloc(n * n * sizeof *vs), lam[12];
    unsigned int s = 7;
    for (size_t i = 0; i < n; i++)
        for (size_t j = 0; j <= i; j++) {
            s = s * 1103515245u + 12345u;
            a[i * n + j] = a[j * n + i] = (double)(s >> 16 & 1023) / 512.0 - 1.0;
        }
    gb_sym_eigen(a, n, lam, vs);
    double worst = 0.0, ortho = 0.0;
    for (size_t k = 0; k < n; k++) {
        for (size_t i = 0; i < n; i++) {
            double av = 0.0;
            for (size_t j = 0; j < n; j++) av += a[i * n + j] * vs[j * n + k];
            worst = fmax(worst, fabs(av - lam[k] * vs[i * n + k]));
        }
        for (size_t l = 0; l < n; l++) {
            double d = 0.0;
            for (size_t i = 0; i < n; i++) d += vs[i * n + k] * vs[i * n + l];
            ortho = fmax(ortho, fabs(d - (k == l ? 1.0 : 0.0)));
        }
    }
    CHECK(worst < 1e-9, "A v = lambda v for every pair");
    CHECK(ortho < 1e-9, "vectors orthonormal");
    int sorted = 1;
    for (size_t k = 1; k < n; k++) sorted &= lam[k - 1] >= lam[k];
    CHECK(sorted, "sorted largest first");

    /* take: scaled by sqrt of the value, then length 1; negative values give nothing */
    const double tv[2] = {4.0, -1.0};
    const double tvec[4] = {1.0, 0.0, 0.0, 1.0};
    double e[4];
    gb_embed_take(tv, tvec, 2, 2, e);
    CHECK(e[0] == 1.0 && e[1] == 0.0 && e[2] == 0.0 && e[3] == 0.0, "length 1, and a zero row stays zero");

    /* cosine and mean */
    const double rows[6] = {1.0, 0.0, 0.0, 1.0, 1.0, 1.0};
    double cs[3];
    const double q[2] = {1.0, 0.0};
    gb_cosine_rows(rows, 3, 2, q, cs);
    CHECK(cs[0] == 1.0 && cs[1] == 0.0 && fabs(cs[2] - sqrt(0.5)) < 1e-12, "cosines");
    const double zero[2] = {0.0, 0.0};
    gb_cosine_rows(rows, 3, 2, zero, cs);
    CHECK(cs[0] == 0.0 && cs[2] == 0.0, "a zero query gives 0");
    const int pick[2] = {0, 1};
    double mean[2];
    gb_mean_rows(rows, 2, pick, 2, mean);
    CHECK(mean[0] == 0.5 && mean[1] == 0.5, "mean of two rows");

    /* agreement: two tight pairs with matching labels, then mismatched labels */
    const double pairs[8] = {1.0, 0.0, 0.99, 0.1, 0.0, 1.0, 0.1, 0.99};
    const int same[4] = {0, 0, 1, 1};
    const int mixed[4] = {0, 1, 0, 1};
    const int partial[4] = {0, 0, -1, -1};
    CHECK(gb_neighbour_agreement(pairs, 4, 2, same, 1) == 1.0, "every nearest neighbour agrees");
    CHECK(gb_neighbour_agreement(pairs, 4, 2, mixed, 1) == 0.0, "none agree");
    CHECK(gb_neighbour_agreement(pairs, 4, 2, partial, 1) == 1.0, "unlabelled words are skipped");

    /* the map: points along one line land on the first axis, with nothing on the second */
    const double line[8] = {1.0, 2.0, 2.0, 4.0, 3.0, 6.0, 4.0, 8.0};
    double map[8];
    CHECK(gb_project_2d(line, 4, 2, map) == 0, "map runs");
    CHECK(fabs(map[1]) < 1e-9 && fabs(map[3]) < 1e-9 && fabs(map[7]) < 1e-9, "a line has no second axis");
    CHECK(fabs(map[6] - map[0] - 3.0 * sqrt(5.0)) < 1e-9, "distances along the line are kept");
    CHECK(fabs(map[0] + map[2] + map[4] + map[6]) < 1e-9, "centred");
    double flip[8];
    const double mirrored[8] = {-1.0, -2.0, -2.0, -4.0, -3.0, -6.0, -4.0, -8.0};
    gb_project_2d(mirrored, 4, 2, flip);
    CHECK(fabs(flip[0] + map[0]) < 1e-9, "a mirrored set maps mirrored, with the same axis direction");

    free(a);
    free(vs);
    DONE();
}
