#include <math.h>

#include "check.h"
#include "context.h"

int main(void) {
    /* place: 0 is the first sentence, 1 the last, and in between it rounds */
    CHECK(gb_context_place(11, 0.0) == 0 && gb_context_place(11, 1.0) == 10, "first and last");
    CHECK(gb_context_place(11, 0.5) == 5 && gb_context_place(11, 0.33) == 3, "places in between");
    CHECK(gb_context_place(1, 0.7) == 0 && gb_context_place(5, -1.0) == 0 && gb_context_place(5, 2.0) == 4,
          "one sentence, and places out of range");

    /* no noise, no look-alikes, no dip: the key gets e^k / (e^k + n - 1) */
    double s[50];
    gb_context_scores(10, 3, 4.0, 0.0, 0, 3.0, 0.0, 1, s);
    CHECK(s[3] == 4.0 && s[0] == 0.0 && s[9] == 0.0, "flat scores around the key");
    double k = exp(4.0);
    CHECK(fabs(gb_context_share(10, 0.0, 4.0, 0.0, 0, 3.0, 0.0, 5, 1) - k / (k + 9)) < 1e-12, "exact share, 10 sentences");
    CHECK(fabs(gb_context_share(100, 0.0, 4.0, 0.0, 0, 3.0, 0.0, 5, 1) - k / (k + 99)) < 1e-12, "exact share, 100 sentences");
    CHECK(gb_context_share(100, 0.0, 4.0, 0.0, 0, 3.0, 0.0, 1, 1) < gb_context_share(10, 0.0, 4.0, 0.0, 0, 3.0, 0.0, 1, 1),
          "more text, smaller share");
    CHECK(fabs(gb_context_share(1, 0.0, 4.0, 1.0, 3, 3.0, 2.0, 10, 1) - 1.0) < 1e-12, "a lone sentence gets everything");

    /* look-alikes: exactly m sentences get the look-alike score, never the key */
    gb_context_scores(20, 7, 4.0, 0.0, 5, 3.0, 0.0, 9, s);
    int alike = 0;
    for (int i = 0; i < 20; i++) alike += s[i] == 3.0;
    CHECK(alike == 5 && s[7] == 4.0, "five look-alikes and the key kept");
    double l = exp(3.0);
    CHECK(fabs(gb_context_share(20, 0.35, 4.0, 0.0, 5, 3.0, 0.0, 3, 2) - k / (k + 5 * l + 14)) < 1e-12,
          "exact share with look-alikes");
    gb_context_scores(4, 0, 4.0, 0.0, 99, 3.0, 0.0, 9, s);
    CHECK(s[0] == 4.0 && s[1] == 3.0 && s[2] == 3.0 && s[3] == 3.0, "look-alikes are capped at the other sentences");

    /* the dip: nothing at the ends, the full dip in the middle */
    gb_context_scores(3, 1, 4.0, 0.0, 0, 3.0, 2.0, 1, s);
    CHECK(s[0] == 0.0 && s[2] == 0.0 && fabs(s[1] - 2.0) < 1e-12, "the middle loses the whole dip");
    CHECK(fabs(gb_context_share(3, 0.5, 4.0, 0.0, 0, 3.0, 2.0, 1, 1) - exp(2.0) / (exp(2.0) + 2)) < 1e-12,
          "exact share in the middle");
    double start = gb_context_share(41, 0.0, 4.0, 1.0, 2, 3.0, 2.0, 400, 5);
    double middle = gb_context_share(41, 0.5, 4.0, 1.0, 2, 3.0, 2.0, 400, 5);
    double end = gb_context_share(41, 1.0, 4.0, 1.0, 2, 3.0, 2.0, 400, 5);
    CHECK(middle < start && middle < end, "lost in the middle");

    /* noise: filler e^(N(0,1)) averages e^0.5, so with many sentences the share is close
       to e^k / (e^k + (n - 1) e^0.5) */
    double noisy = gb_context_share(200, 0.0, 4.0, 1.0, 0, 3.0, 0.0, 2000, 3);
    double guess = k / (k + 199 * exp(0.5));
    CHECK(fabs(noisy / guess - 1.0) < 0.05, "noisy share near the estimate");

    /* the same seed gives the same context */
    double a[30], b[30];
    gb_context_scores(30, 4, 4.0, 1.0, 3, 3.0, 1.0, 77, a);
    gb_context_scores(30, 4, 4.0, 1.0, 3, 3.0, 1.0, 77, b);
    int same = 1;
    for (int i = 0; i < 30; i++) same &= a[i] == b[i];
    CHECK(same, "same seed, same scores");

    CHECK(gb_context_share(0, 0.5, 4.0, 1.0, 0, 3.0, 0.0, 10, 1) == 0.0, "no sentences");
    CHECK(gb_context_share(10, 0.5, 4.0, 1.0, 0, 3.0, 0.0, 0, 1) == 0.0, "no trials");
    DONE();
}
