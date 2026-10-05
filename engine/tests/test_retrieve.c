#include <math.h>

#include "check.h"
#include "retrieve.h"

int main(void) {
    /* three pages: [0 1], [0 2 2], [3]; average length 2 */
    const int terms[6] = {0, 1, 0, 2, 2, 3};
    const size_t start[4] = {0, 2, 5, 6};
    double s[3];
    const double k1 = 1.2, b = 0.75;

    /* a word in one page: idf = ln(1 + 2.5 / 1.5), length 1 against an average of 2 */
    const int q3[1] = {3};
    gb_bm25(terms, start, 3, 4, q3, NULL, 1, k1, b, s);
    double idf = log(1.0 + 2.5 / 1.5);
    CHECK(s[0] == 0.0 && s[1] == 0.0, "pages without the word score 0");
    CHECK(fabs(s[2] - idf * 2.2 / (1.0 + k1 * (1.0 - b + b * 0.5))) < 1e-12, "score by hand");

    /* a word in two pages: the page of average length gets exactly idf, the longer one less */
    const int q0[1] = {0};
    gb_bm25(terms, start, 3, 4, q0, NULL, 1, k1, b, s);
    double idf0 = log(1.0 + 1.5 / 2.5);
    CHECK(fabs(s[0] - idf0) < 1e-12, "average length: exactly idf");
    CHECK(fabs(s[1] - idf0 * 2.2 / (1.0 + k1 * (1.0 - b + b * 1.5))) < 1e-12 && s[1] < s[0], "longer page scores less");

    /* a repeated word counts more, but less than twice */
    const int q2[1] = {2};
    gb_bm25(terms, start, 3, 4, q2, NULL, 1, k1, b, s);
    double once = log(1.0 + 2.5 / 1.5) * 2.2 / (1.0 + k1 * (1.0 - b + b * 1.5));
    CHECK(s[1] > once && s[1] < 2.0 * once, "two of a word: more, not double");

    /* weights scale a word, and words add up */
    const int both[2] = {0, 3};
    const double half[2] = {0.5, 1.0};
    gb_bm25(terms, start, 3, 4, both, half, 2, k1, b, s);
    CHECK(fabs(s[0] - 0.5 * idf0) < 1e-12, "half weight, half score");
    const int odd[3] = {-1, 9, 1};
    gb_bm25(terms, start, 3, 4, odd, NULL, 3, k1, b, s);
    CHECK(s[0] > 0.0 && s[1] == 0.0 && s[2] == 0.0, "words outside the vocabulary are skipped");

    /* rank: highest first, ties to the lower page */
    const double r[4] = {1.0, 3.0, 3.0, 0.5};
    CHECK(gb_rank_of(r, 4, 1) == 0 && gb_rank_of(r, 4, 2) == 1 && gb_rank_of(r, 4, 0) == 2 && gb_rank_of(r, 4, 3) == 3, "ranks");

    /* pick share: only handed pages can be picked; equal scores split evenly */
    CHECK(gb_pick_share(r, 4, 1, 1, 1.0) == 1.0, "one page handed: it is used");
    CHECK(gb_pick_share(r, 4, 0, 2, 1.0) == 0.0, "a page left out is never used");
    CHECK(fabs(gb_pick_share(r, 4, 1, 2, 1.0) - 0.5) < 1e-12, "two equal pages: half each");
    double p3 = gb_pick_share(r, 4, 1, 3, 1.0);
    CHECK(fabs(p3 - exp(3.0) / (2.0 * exp(3.0) + exp(1.0))) < 1e-12, "three pages: softmax share");
    CHECK(gb_pick_share(r, 4, 1, 4, 1.0) < p3, "more pages handed, smaller share");
    CHECK(fabs(gb_pick_share(r, 4, 1, 4, 1e6) - 0.25) < 1e-5, "very high temperature: even");
    CHECK(gb_pick_share(r, 4, 1, 99, 1.0) == gb_pick_share(r, 4, 1, 4, 1.0), "k past the end means all pages");
    CHECK(gb_pick_share(r, 4, 9, 2, 1.0) == 0.0 && gb_pick_share(r, 4, 1, 0, 1.0) == 0.0, "no such page, no pages handed");
    DONE();
}
