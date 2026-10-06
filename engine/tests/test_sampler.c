#include <math.h>
#include <stdlib.h>

#include "check.h"
#include "sampler.h"
#include "text.h"

static int near(double a, double b) { return fabs(a - b) <= 1e-12; }

int main(void) {
    const double p[5] = {0.1, 0.4, 0.2, 0.25, 0.05};
    double o[5];

    /* top-k: the two highest, 0.4 and 0.25, shared out over 0.65 */
    CHECK(gb_top_k(p, 5, 2, o) == 2, "top-k 2 keeps 2");
    CHECK(near(o[1], 0.4 / 0.65) && near(o[3], 0.25 / 0.65) && o[0] == 0.0 && o[4] == 0.0, "top-k 2 odds");
    CHECK(gb_top_k(p, 5, 0, o) == 5 && near(o[0], 0.1), "top-k 0 keeps all");
    CHECK(gb_top_k(p, 5, 9, o) == 5, "top-k above n keeps all");
    const double tie[3] = {0.4, 0.2, 0.4};
    CHECK(gb_top_k(tie, 3, 1, o) == 1 && o[0] == 1.0 && o[2] == 0.0, "a tie keeps the lower index");

    /* top-p: 0.4, then 0.65, then 0.85 reaches 0.8 */
    CHECK(gb_top_p(p, 5, 0.8, o) == 3, "top-p 0.8 keeps 3");
    CHECK(near(o[2], 0.2 / 0.85) && o[0] == 0.0, "top-p 0.8 odds");
    CHECK(gb_top_p(p, 5, 0.65, o) == 2, "reaching top-p exactly stops there");
    CHECK(gb_top_p(p, 5, 0.01, o) == 1 && o[1] == 1.0, "top-p always keeps the top word");
    CHECK(gb_top_p(p, 5, 1.0, o) == 5, "top-p 1 keeps all");

    /* min-p: at least 0.5 x 0.4 = 0.2 */
    CHECK(gb_min_p(p, 5, 0.5, o) == 3, "min-p 0.5 keeps 0.4, 0.25 and 0.2");
    CHECK(near(o[2], 0.2 / 0.85) && o[0] == 0.0, "min-p odds");
    CHECK(gb_min_p(p, 5, 0.0, o) == 5, "min-p 0 keeps all");
    const double zero[3] = {0.0, 0.5, 0.5};
    CHECK(gb_min_p(zero, 3, 0.0, o) == 2 && gb_top_k(zero, 3, 0, o) == 2, "odds 0 are never kept");

    /* in place */
    double q[5] = {0.1, 0.4, 0.2, 0.25, 0.05};
    CHECK(gb_top_k(q, 5, 1, q) == 1 && q[1] == 1.0 && q[0] == 0.0, "top-k in place");

    /* the odds of the last words added up */
    CHECK(near(gb_odds_from(p, 5, 3), 0.3) && gb_odds_from(p, 5, 5) == 0.0 && gb_odds_from(p, 5, 9) == 0.0, "odds from word 3; none past the end");
    CHECK(near(gb_odds_from(p, 5, 0), 1.0), "all the odds add up to 1");

    /* repeat penalty: divide above 0, multiply below, once per word */
    const double s[4] = {2.0, -1.0, 3.0, 0.5};
    const int recent[4] = {0, 1, 0, 7};
    double r[4];
    gb_repeat_penalty(s, 4, recent, 4, 2.0, r);
    CHECK(r[0] == 1.0 && r[1] == -2.0 && r[2] == 3.0 && r[3] == 0.5, "penalty 2 on words 0 and 1");
    gb_repeat_penalty(s, 4, recent, 4, 1.0, r);
    CHECK(r[0] == 2.0 && r[1] == -1.0, "penalty 1 changes nothing");

    /* the chain: softmax, then cuts, then the temperature on what is left */
    const double sc[4] = {2.0, 1.0, 0.0, -3.0};
    double f[4];
    int cut[4];
    CHECK(gb_sample_odds(sc, 4, 1.0, 0, 1.0, 0.0, f, cut) == 4, "no settings keep all");
    CHECK(near(f[0], exp(2.0) / (exp(2.0) + exp(1.0) + 1.0 + exp(-3.0))), "no settings is a softmax");
    CHECK(gb_sample_odds(sc, 4, 1.0, 3, 1.0, 0.2, f, cut) == 2, "top-k 3 then min-p 0.2 keep 2");
    CHECK(cut[0] == GB_KEPT && cut[1] == GB_KEPT && cut[2] == GB_CUT_MIN_P && cut[3] == GB_CUT_TOP_K, "who cut what");
    gb_sample_odds(sc, 4, 0.5, 2, 1.0, 0.0, f, cut);
    CHECK(near(f[0], exp(4.0) / (exp(4.0) + exp(2.0))) && f[2] == 0.0, "temperature 0.5 on the two left");
    gb_sample_odds(sc, 4, 0.0, 0, 1.0, 0.0, f, cut);
    CHECK(f[0] == 1.0 && f[1] == 0.0, "temperature 0 takes the top word");
    gb_sample_odds(sc, 4, 1.0, 0, 0.5, 0.0, f, cut);
    CHECK(cut[1] == GB_CUT_TOP_P && f[0] == 1.0, "top-p 0.5 keeps the top word only");

    /* loops: a b c a b c a: runs abc bca cab abc bca, two seen before */
    const int loop[7] = {0, 1, 2, 0, 1, 2, 0};
    CHECK(near(gb_loop_share(loop, 7, 3), 2.0 / 5.0), "loop share of abcabca");
    const int fresh[5] = {0, 1, 2, 3, 4};
    CHECK(gb_loop_share(fresh, 5, 3) == 0.0 && gb_loop_share(fresh, 3, 3) == 0.0, "no loops; too short");

    /* generate: a b a c a b a ... the only word after b is a */
    const int text[9] = {0, 1, 0, 2, 0, 1, 0, 2, 0};
    size_t counts[9];
    gb_pair_counts(text, 9, 3, counts);
    int out[12];
    double before[12];
    const int start[1] = {1};
    CHECK(gb_generate(counts, 3, start, 1, 12, 1.0, 0, 1.0, 0.0, 1.0, 64, 6.0, 5u, out, before) == 12, "12 words");
    int ok = out[0] == 1;
    for (int i = 1; i < 12; i++) ok &= out[i - 1] == 0 ? out[i] != 0 : out[i] == 0;
    CHECK(ok, "every pair was seen in the text");
    CHECK(before[0] == 1.0 && before[1] == 1.0, "after b, a had odds 1");
    gb_generate(counts, 3, start, 1, 12, 0.0, 0, 1.0, 0.0, 1.0, 64, 6.0, 5u, out, before);
    CHECK(out[2] == 1 && out[4] == 1 && out[6] == 1, "temperature 0: b and c tie after a, b wins");
    gb_generate(counts, 3, start, 1, 6, 0.0, 0, 1.0, 0.0, 1.5, 64, 6.0, 5u, out, before);
    CHECK(out[2] == 2, "a penalty on b turns a to c");

    const int dead[2] = {0, 1};
    size_t dc[4];
    gb_pair_counts(dead, 2, 2, dc);
    CHECK(gb_generate(dc, 2, start, 1, 5, 1.0, 0, 1.0, 0.0, 1.0, 64, 6.0, 1u, out, NULL) == 1, "nothing after b ends it");

    /* the curve is the average of single replies */
    const double pens[2] = {1.0, 2.0};
    double lo[2], od[2];
    gb_penalty_curve(counts, 3, start, 1, 12, 1.0, 0, 1.0, 0.0, 64, 6.0, pens, 2, 1, 9u, 0.6, lo, od);
    size_t n = gb_generate(counts, 3, start, 1, 12, 1.0, 0, 1.0, 0.0, 2.0, 64, 6.0, 9u, out, before);
    int rare = 0;
    for (size_t i = 1; i < n; i++) rare += before[i] < 0.6;
    CHECK(near(lo[1], gb_loop_share(out, n, 3)) && near(od[1], rare / 11.0), "curve at penalty 2, one run");
    DONE();
}
