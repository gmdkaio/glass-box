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

    /* schedules: constant, linear to 0, cosine to 0 */
    CHECK(gb_lr_at(0.2, GB_LR_CONSTANT, 7, 10) == 0.2, "constant stays");
    CHECK(fabs(gb_lr_at(0.2, GB_LR_LINEAR, 5, 10) - 0.1) < 1e-15 && gb_lr_at(0.2, GB_LR_LINEAR, 0, 10) == 0.2, "linear: half way, half the step");
    CHECK(fabs(gb_lr_at(0.2, GB_LR_COSINE, 5, 10) - 0.1) < 1e-12 && fabs(gb_lr_at(0.2, GB_LR_COSINE, 0, 10) - 0.2) < 1e-15, "cosine: half way, half the step");
    CHECK(gb_lr_at(0.2, GB_LR_COSINE, 2, 10) > gb_lr_at(0.2, GB_LR_LINEAR, 2, 10), "cosine holds the step longer at first");

    /* the curve is gb_nn_train one pass at a time */
    const int sched[9] = {0, 1, 2, 0, 1, 2, 0, 2, 1};
    size_t n34 = gb_nn_params(3, 4);
    double *s1 = malloc(n34 * sizeof *s1), *s2 = malloc(n34 * sizeof *s2), curve[5];
    gb_nn_init(s1, 3, 4, 2u);
    gb_nn_init(s2, 3, 4, 2u);
    double last = gb_nn_train_curve(s1, 3, 4, sched, 9, 5, 0.3, GB_LR_LINEAR, curve);
    int stepwise = 1;
    for (size_t e = 0; e < 5; e++) stepwise &= gb_nn_train(s2, 3, 4, sched, 9, 1, gb_lr_at(0.3, GB_LR_LINEAR, e, 5)) == curve[e];
    CHECK(stepwise && last == curve[4], "curve: one pass at a time, with the schedule");
    CHECK(curve[4] < curve[0], "the loss falls");
    gb_nn_init(s1, 3, 4, 2u);
    gb_nn_train_curve(s1, 3, 4, sched, 9, 5, 1e6, GB_LR_CONSTANT, curve);
    CHECK(curve[4] > 5.0, "a huge step blows the network up (never NaN)");
    CHECK(curve[4] == curve[4], "blown-up loss is a number or infinity");
    free(s1);
    free(s2);

    /* watching: the three losses and the probe's odds after every pass */
    const int heldt[5] = {0, 2, 1, 0, 2}, oldt[4] = {1, 0, 1, 0};
    double *w1 = malloc(n34 * sizeof *w1), *w2 = malloc(n34 * sizeof *w2);
    double tr[4], hl[4], ol[4], po[16], hid[4], od[3], wl[4];
    gb_nn_init(w1, 3, 4, 5u);
    gb_nn_init(w2, 3, 4, 5u);
    gb_nn_train_watch(w1, 3, 4, sched, 9, heldt, 5, oldt, 4, heldt, 5, 4, 0.2, tr, hl, ol, po);
    int watched = 1;
    for (size_t e = 0; e < 4; e++) {
        watched &= gb_nn_train(w2, 3, 4, sched, 9, 1, 0.2) == tr[e];
        watched &= gb_nn_loss(w2, 3, 4, heldt, 5) == hl[e] && gb_nn_loss(w2, 3, 4, oldt, 4) == ol[e];
        gb_nn_word_loss(w2, 3, 4, heldt, 5, wl);
        for (int i = 0; i < 4; i++) watched &= wl[i] == po[e * 4 + i];
    }
    CHECK(watched, "watch: same as training and measuring by hand, pass by pass");
    gb_nn_init(w1, 3, 4, 5u);
    CHECK(gb_nn_train_watch(w1, 3, 4, sched, 9, NULL, 0, NULL, 0, NULL, 0, 2, 0.2, NULL, NULL, NULL, NULL) > 0.0, "every output may be left out");

    /* word loss: the per-word surprises average to the text's loss */
    gb_nn_word_loss(w2, 3, 4, heldt, 5, wl);
    gb_nn_forward(w2, 3, 4, 0, hid, od);
    CHECK(fabs(wl[0] + log(od[2])) < 1e-12, "word 1: -ln of its odds after word 0");
    CHECK(fabs((wl[0] + wl[1] + wl[2] + wl[3]) / 4.0 - gb_nn_loss(w2, 3, 4, heldt, 5)) < 1e-12, "the average is the loss");

    /* the exam: top guess after each context word */
    const int ctx[4] = {0, 1, 2, 7}, ans[4] = {0, 0, 0, 0};
    int guess[4];
    size_t right = gb_nn_quiz(w2, 3, 4, ctx, ans, 4, guess);
    int quizok = guess[3] == -1;
    size_t count = 0;
    for (int i = 0; i < 3; i++) {
        gb_nn_forward(w2, 3, 4, (size_t)ctx[i], hid, od);
        int top = 0;
        for (int k = 1; k < 3; k++)
            if (od[k] > od[top]) top = k;
        quizok &= guess[i] == top;
        count += top == 0;
    }
    CHECK(quizok && right == count, "quiz: the top guess per question, and the count of right ones");
    free(w1);
    free(w2);

    free(a);
    free(b);
    free(c);
    free(p);
    free(q1);
    free(q2);
    DONE();
}
