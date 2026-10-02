#include <math.h>

#include "check.h"
#include "text.h"

int main(void) {
    /* 0 1 0 2 1: the pairs are 0>1, 1>0, 0>2, 2>1 */
    int a[5] = {0, 1, 0, 2, 1};
    size_t c[9];
    CHECK(gb_pair_counts(a, 5, 3, c) == 4, "five words make four pairs");
    CHECK(c[0 * 3 + 1] == 1 && c[1 * 3 + 0] == 1 && c[0 * 3 + 2] == 1 && c[2 * 3 + 1] == 1,
          "each pair is counted once");
    CHECK(c[0] == 0 && c[4] == 0 && c[5] == 0 && c[6] == 0 && c[8] == 0, "other cells stay 0");

    /* a b a b a b: a>b three times, b>a twice */
    int b[6] = {0, 1, 0, 1, 0, 1};
    size_t d[4];
    gb_pair_counts(b, 6, 2, d);
    CHECK(d[0 * 2 + 1] == 3 && d[1 * 2 + 0] == 2 && d[0] == 0 && d[3] == 0, "repeated pairs add up");

    /* the counts are overwritten, not added to */
    d[0] = d[1] = d[2] = d[3] = 99;
    gb_pair_counts(b, 6, 2, d);
    CHECK(d[0] == 0 && d[1] == 3, "counts are reset on every call");

    /* the total of the matrix equals the number of pairs counted */
    int e[8] = {0, 1, 2, 0, 1, 2, 0, 1};
    size_t m[9], total = 0;
    size_t counted = gb_pair_counts(e, 8, 3, m);
    for (int i = 0; i < 9; i++) total += m[i];
    CHECK(counted == 7 && total == 7, "matrix total equals pairs counted");

    /* ids outside the vocabulary are skipped, and short texts have no pairs */
    int bad[4] = {0, 5, 1, -1};
    size_t f[4];
    CHECK(gb_pair_counts(bad, 4, 2, f) == 0, "pairs with an id outside the vocabulary are skipped");
    CHECK(gb_pair_counts(a, 1, 3, c) == 0, "one word makes no pairs");
    CHECK(gb_pair_counts(a, 0, 3, c) == 0, "no words make no pairs");

    /* odds from a row */
    size_t row[3] = {0, 3, 1};
    double odds[3];
    CHECK(gb_row_odds(row, 3, odds) == 4, "row total");
    CHECK(fabs(odds[0]) < 1e-12 && fabs(odds[1] - 0.75) < 1e-12 && fabs(odds[2] - 0.25) < 1e-12, "row odds");
    size_t empty[3] = {0, 0, 0};
    CHECK(gb_row_odds(empty, 3, odds) == 0 && odds[0] == 0.0 && odds[1] == 0.0 && odds[2] == 0.0,
          "an empty row gives zeros, not NaN");
    /* the table's loss: 0>1 twice, 1>0 twice, 0>2 once gives (2 ln 1.5 + 0 + ln 3) / 5 */
    int g[6] = {0, 1, 0, 1, 0, 2};
    size_t gc[9];
    gb_pair_counts(g, 6, 3, gc);
    double expect = (2.0 * log(1.5) + log(3.0)) / 5.0;
    CHECK(fabs(gb_table_loss(gc, 3, g, 6) - expect) < 1e-12, "table loss of a small text");
    int sure[4] = {0, 1, 0, 1};
    size_t sc[4];
    gb_pair_counts(sure, 4, 2, sc);
    CHECK(fabs(gb_table_loss(sc, 2, sure, 4)) < 1e-12, "a text with no choices has loss 0");
    CHECK(gb_table_loss(gc, 3, g, 1) == 0.0, "no pairs gives loss 0");
    DONE();
}
