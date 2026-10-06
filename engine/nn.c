#include "nn.h"

#include <math.h>
#include <stdlib.h>

#include "rng.h"

size_t gb_nn_params(size_t V, size_t H) {
    return V * H + H + H * V + V;
}

void gb_nn_init(double *params, size_t V, size_t H, unsigned int seed) {
    size_t total = gb_nn_params(V, H);
    for (size_t i = 0; i < total; i++) params[i] = 0.0;

    gb_rng r;
    gb_rng_seed(&r, seed);
    double *w1 = params;
    double *w2 = params + V * H + H;
    for (size_t i = 0; i < V * H; i++) w1[i] = 0.3 * gb_rng_normal(&r);
    for (size_t i = 0; i < H * V; i++) w2[i] = 0.3 * gb_rng_normal(&r);
}

/* hidden and odds for one input word; odds comes out as probabilities */
static void run(const double *params, size_t V, size_t H, size_t word, double *hidden,
                double *odds) {
    const double *w1 = params;
    const double *b1 = params + V * H;
    const double *w2 = b1 + H;
    const double *b2 = w2 + H * V;

    for (size_t j = 0; j < H; j++) hidden[j] = tanh(w1[word * H + j] + b1[j]);

    double top = -INFINITY;
    for (size_t k = 0; k < V; k++) {
        double z = b2[k];
        for (size_t j = 0; j < H; j++) z += hidden[j] * w2[j * V + k];
        odds[k] = z;
        if (z > top) top = z;
    }

    double sum = 0.0;
    for (size_t k = 0; k < V; k++) {
        odds[k] = exp(odds[k] - top);
        sum += odds[k];
    }
    for (size_t k = 0; k < V; k++) odds[k] /= sum;
}

void gb_nn_forward(const double *params, size_t V, size_t H, size_t word, double *hidden,
                   double *odds) {
    run(params, V, H, word, hidden, odds);
}

static int valid_pair(const int *ids, size_t i, size_t V) {
    return ids[i] >= 0 && ids[i + 1] >= 0 && (size_t)ids[i] < V && (size_t)ids[i + 1] < V;
}

double gb_nn_loss(const double *params, size_t V, size_t H, const int *ids, size_t n) {
    double *buffer = malloc((H + V) * sizeof *buffer);
    if (!buffer) return -1.0;
    double *hidden = buffer;
    double *odds = buffer + H;

    double total = 0.0;
    size_t pairs = 0;
    for (size_t i = 0; i + 1 < n; i++) {
        if (!valid_pair(ids, i, V)) continue;
        run(params, V, H, (size_t)ids[i], hidden, odds);
        total -= log(odds[ids[i + 1]] > 1e-300 ? odds[ids[i + 1]] : 1e-300);
        pairs++;
    }
    free(buffer);
    return pairs ? total / (double)pairs : 0.0;
}

double gb_lr_at(double rate, int schedule, size_t e, size_t epochs) {
    if (epochs == 0) return rate;
    double x = (double)e / (double)epochs;
    if (schedule == GB_LR_LINEAR) return rate * (1.0 - x);
    if (schedule == GB_LR_COSINE) return rate * 0.5 * (1.0 + cos(3.14159265358979323846 * x));
    return rate;
}

double gb_nn_train_curve(double *params, size_t V, size_t H, const int *ids, size_t n,
                         size_t epochs, double rate, int schedule, double *curve) {
    double loss = 0.0;
    for (size_t e = 0; e < epochs; e++) {
        loss = gb_nn_train(params, V, H, ids, n, 1, gb_lr_at(rate, schedule, e, epochs));
        if (loss == -1.0) return -1.0;
        if (loss != loss) loss = INFINITY;
        curve[e] = loss;
    }
    return loss;
}

int gb_nn_word_loss(const double *params, size_t V, size_t H, const int *ids, size_t n,
                    double *out) {
    double *buffer = malloc((H + V) * sizeof *buffer);
    if (!buffer) return -1;
    double *hidden = buffer, *odds = buffer + H;
    for (size_t i = 0; i + 1 < n; i++) {
        out[i] = 0.0;
        if (!valid_pair(ids, i, V)) continue;
        run(params, V, H, (size_t)ids[i], hidden, odds);
        double p = odds[ids[i + 1]];
        out[i] = -log(p > 1e-300 ? p : 1e-300);
    }
    free(buffer);
    return 0;
}

double gb_nn_train_watch(double *params, size_t V, size_t H, const int *ids, size_t n,
                         const int *held, size_t nh, const int *old, size_t no, const int *probe,
                         size_t np, size_t epochs, double rate, double *train, double *held_loss,
                         double *old_loss, double *probe_loss) {
    double loss = 0.0;
    for (size_t e = 0; e < epochs; e++) {
        loss = gb_nn_train(params, V, H, ids, n, 1, rate);
        if (loss == -1.0) return -1.0;
        if (train) train[e] = loss;
        if (held_loss) held_loss[e] = held ? gb_nn_loss(params, V, H, held, nh) : 0.0;
        if (old_loss) old_loss[e] = old ? gb_nn_loss(params, V, H, old, no) : 0.0;
        if (probe_loss && probe && np > 1 &&
            gb_nn_word_loss(params, V, H, probe, np, probe_loss + e * (np - 1)) != 0)
            return -1.0;
    }
    return loss;
}

double gb_nn_train(double *params, size_t V, size_t H, const int *ids, size_t n, size_t epochs,
                   double rate) {
    double *buffer = malloc((2 * H + V) * sizeof *buffer);
    if (!buffer) return -1.0;
    double *hidden = buffer;
    double *odds = buffer + H;
    double *back = buffer + H + V; /* how much each hidden unit contributed to the error */

    double *w1 = params;
    double *b1 = params + V * H;
    double *w2 = b1 + H;
    double *b2 = w2 + H * V;

    for (size_t e = 0; e < epochs; e++) {
        for (size_t i = 0; i + 1 < n; i++) {
            if (!valid_pair(ids, i, V)) continue;
            size_t a = (size_t)ids[i], target = (size_t)ids[i + 1];
            run(params, V, H, a, hidden, odds);

            /* error on the scores: the odds minus 1 for the right word */
            odds[target] -= 1.0;

            for (size_t j = 0; j < H; j++) {
                double s = 0.0;
                for (size_t k = 0; k < V; k++) s += w2[j * V + k] * odds[k];
                back[j] = s * (1.0 - hidden[j] * hidden[j]);
            }
            for (size_t j = 0; j < H; j++) {
                for (size_t k = 0; k < V; k++) w2[j * V + k] -= rate * hidden[j] * odds[k];
                w1[a * H + j] -= rate * back[j];
                b1[j] -= rate * back[j];
            }
            for (size_t k = 0; k < V; k++) b2[k] -= rate * odds[k];
        }
    }
    free(buffer);
    return gb_nn_loss(params, V, H, ids, n);
}
