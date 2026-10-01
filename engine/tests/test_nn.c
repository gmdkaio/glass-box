#include <math.h>
#include <stdlib.h>

#include "check.h"
#include "nn.h"

int main(void) {
    CHECK(gb_nn_params(3, 2) == 17, "3 words, 2 hidden units: 6 + 2 + 6 + 3 numbers");

    /* the same seed gives the same start, another seed gives another */
    size_t V = 10, H = 6, total = gb_nn_params(V, H);
    double *a = malloc(total * sizeof *a), *b = malloc(total * sizeof *b), *c = malloc(total * sizeof *c);
    gb_nn_init(a, V, H, 5);
    gb_nn_init(b, V, H, 5);
    gb_nn_init(c, V, H, 6);
    int same = 1, differ = 0;
    for (size_t i = 0; i < total; i++) {
        if (a[i] != b[i]) same = 0;
        if (a[i] != c[i]) differ = 1;
    }
    CHECK(same, "same seed gives the same starting numbers");
    CHECK(differ, "another seed gives other numbers");
    int zero_b = 1;
    for (size_t j = 0; j < H; j++) if (a[V * H + j] != 0.0) zero_b = 0;
    CHECK(zero_b, "the hidden biases start at 0");

    /* before learning, the odds are close to even and add up to 1 */
    double hidden[6], odds[10];
    gb_nn_forward(a, V, H, 3, hidden, odds);
    double sum = 0.0;
    int near_even = 1;
    for (size_t k = 0; k < V; k++) {
        sum += odds[k];
        if (odds[k] < 0.5 / V || odds[k] > 2.0 / V) near_even = 0;
    }
    CHECK(fabs(sum - 1.0) < 1e-12, "odds add up to 1");
    CHECK(near_even, "an untrained network gives nearly even odds");
    int in_range = 1;
    for (size_t j = 0; j < H; j++) if (hidden[j] < -1.0 || hidden[j] > 1.0) in_range = 0;
    CHECK(in_range, "hidden values are between -1 and 1");

    /* a text where 0 is followed by 1 three times and by 2 once, over and over */
    int text[80];
    int cycle[8] = {0, 1, 0, 1, 0, 1, 0, 2};
    for (int i = 0; i < 80; i++) text[i] = cycle[i % 8];

    size_t V3 = 3, H3 = 4;
    double *p = malloc(gb_nn_params(V3, H3) * sizeof *p);
    gb_nn_init(p, V3, H3, 11);
    double before = gb_nn_loss(p, V3, H3, text, 80);
    CHECK(fabs(before - log(3.0)) < 0.15, "untrained loss is close to ln 3");

    double after = gb_nn_train(p, V3, H3, text, 80, 400, 0.1);
    CHECK(after < before * 0.4, "training lowers the loss a lot");
    CHECK(fabs(after - gb_nn_loss(p, V3, H3, text, 80)) < 1e-12, "train returns the loss it reached");
    /* the least surprise possible here is the entropy of the text, about 0.28 */
    CHECK(after > 0.25 && after < 0.35, "the loss ends near the entropy of the text");

    double h3[4], o3[3];
    gb_nn_forward(p, V3, H3, 0, h3, o3);
    CHECK(fabs(o3[1] - 0.75) < 0.07 && fabs(o3[2] - 0.25) < 0.07, "after 0 it learns 75% for 1 and 25% for 2");
    gb_nn_forward(p, V3, H3, 1, h3, o3);
    CHECK(o3[0] > 0.95, "after 1 it learns that 0 always follows");
    gb_nn_forward(p, V3, H3, 2, h3, o3);
    CHECK(o3[0] > 0.95, "after 2 it learns that 0 always follows");

    /* training twice from the same start gives the same numbers */
    double *q1 = malloc(gb_nn_params(V3, H3) * sizeof *q1), *q2 = malloc(gb_nn_params(V3, H3) * sizeof *q2);
    gb_nn_init(q1, V3, H3, 2);
    gb_nn_init(q2, V3, H3, 2);
    gb_nn_train(q1, V3, H3, text, 80, 20, 0.1);
    gb_nn_train(q2, V3, H3, text, 80, 20, 0.1);
    int identical = 1;
    for (size_t i = 0; i < gb_nn_params(V3, H3); i++) if (q1[i] != q2[i]) identical = 0;
    CHECK(identical, "training is repeatable");

    /* word numbers outside the vocabulary are skipped */
    int bad[4] = {0, 7, 1, -2};
    CHECK(gb_nn_loss(p, V3, H3, bad, 4) == 0.0, "no valid pairs gives loss 0");
    CHECK(gb_nn_train(p, V3, H3, bad, 4, 3, 0.1) == 0.0, "training on no valid pairs changes nothing");

    free(a);
    free(b);
    free(c);
    free(p);
    free(q1);
    free(q2);
    DONE();
}
