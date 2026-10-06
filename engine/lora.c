#include "lora.h"

#include <math.h>
#include <stdlib.h>
#include <string.h>

#include "embed.h"
#include "nn.h"
#include "rng.h"

size_t gb_lora_params(size_t V, size_t H, size_t r) {
    return 2 * r * (V + H);
}

void gb_lora_init(double *lora, size_t V, size_t H, size_t r, unsigned int seed) {
    double *B1 = lora, *A1 = B1 + V * r, *B2 = A1 + r * H, *A2 = B2 + H * r;
    gb_rng g;
    gb_rng_seed(&g, seed);
    for (size_t i = 0; i < V * r; i++) B1[i] = 0.0;
    for (size_t i = 0; i < H * r; i++) B2[i] = 0.0;
    for (size_t i = 0; i < r * H; i++) A1[i] = 0.3 * gb_rng_normal(&g);
    for (size_t i = 0; i < r * V; i++) A2[i] = 0.3 * gb_rng_normal(&g);
}

void gb_lora_merge(const double *base, const double *lora, size_t V, size_t H, size_t r,
                   double *out) {
    const double *B1 = lora, *A1 = B1 + V * r, *B2 = A1 + r * H, *A2 = B2 + H * r;
    memcpy(out, base, gb_nn_params(V, H) * sizeof *out);
    double *w1 = out, *w2 = out + V * H + H;
    for (size_t i = 0; i < V; i++)
        for (size_t q = 0; q < r; q++)
            for (size_t j = 0; j < H; j++) w1[i * H + j] += B1[i * r + q] * A1[q * H + j];
    for (size_t j = 0; j < H; j++)
        for (size_t q = 0; q < r; q++)
            for (size_t k = 0; k < V; k++) w2[j * V + k] += B2[j * r + q] * A2[q * V + k];
}

double gb_lora_train(const double *base, double *lora, size_t V, size_t H, size_t r,
                     const int *ids, size_t n, size_t epochs, double rate) {
    double *B1 = lora, *A1 = B1 + V * r, *B2 = A1 + r * H, *A2 = B2 + H * r;
    const double *w1 = base, *b1 = base + V * H, *w2 = b1 + H, *b2 = w2 + H * V;
    /* hidden, scores, back, then r-sized scratch: hB2, A2err, A1back, and B1 row */
    double *buf = malloc((2 * H + V + 4 * r + 1) * sizeof *buf);
    if (!buf) return -1.0;
    double *hidden = buf, *z = hidden + H, *back = z + V;
    double *hb = back + H, *ae = hb + r, *ab = ae + r, *brow = ab + r;

    for (size_t e = 0; e < epochs; e++) {
        for (size_t i = 0; i + 1 < n; i++) {
            if (ids[i] < 0 || ids[i + 1] < 0 || (size_t)ids[i] >= V || (size_t)ids[i + 1] >= V) continue;
            size_t a = (size_t)ids[i], target = (size_t)ids[i + 1];

            /* forward with the patch, without building the patched layers */
            for (size_t q = 0; q < r; q++) brow[q] = B1[a * r + q];
            for (size_t j = 0; j < H; j++) {
                double s = w1[a * H + j] + b1[j];
                for (size_t q = 0; q < r; q++) s += brow[q] * A1[q * H + j];
                hidden[j] = tanh(s);
            }
            for (size_t q = 0; q < r; q++) {
                double s = 0.0;
                for (size_t j = 0; j < H; j++) s += hidden[j] * B2[j * r + q];
                hb[q] = s;
            }
            double top = -INFINITY;
            for (size_t k = 0; k < V; k++) {
                double s = b2[k];
                for (size_t j = 0; j < H; j++) s += hidden[j] * w2[j * V + k];
                for (size_t q = 0; q < r; q++) s += hb[q] * A2[q * V + k];
                z[k] = s;
                if (s > top) top = s;
            }
            double sum = 0.0;
            for (size_t k = 0; k < V; k++) {
                z[k] = exp(z[k] - top);
                sum += z[k];
            }
            /* error on the scores: the odds minus 1 for the right word */
            for (size_t k = 0; k < V; k++) z[k] /= sum;
            z[target] -= 1.0;

            /* back into the hidden units, through the patched layer 2 */
            for (size_t q = 0; q < r; q++) {
                double s = 0.0;
                for (size_t k = 0; k < V; k++) s += A2[q * V + k] * z[k];
                ae[q] = s;
            }
            for (size_t j = 0; j < H; j++) {
                double s = 0.0;
                for (size_t k = 0; k < V; k++) s += w2[j * V + k] * z[k];
                for (size_t q = 0; q < r; q++) s += B2[j * r + q] * ae[q];
                back[j] = s * (1.0 - hidden[j] * hidden[j]);
            }
            for (size_t q = 0; q < r; q++) {
                double s = 0.0;
                for (size_t j = 0; j < H; j++) s += A1[q * H + j] * back[j];
                ab[q] = s;
            }

            /* the strips' steps: layer 2 is hidden x error, layer 1 row a is back */
            for (size_t q = 0; q < r; q++) {
                for (size_t j = 0; j < H; j++) B2[j * r + q] -= rate * hidden[j] * ae[q];
                for (size_t k = 0; k < V; k++) A2[q * V + k] -= rate * hb[q] * z[k];
                B1[a * r + q] -= rate * ab[q];
                for (size_t j = 0; j < H; j++) A1[q * H + j] -= rate * brow[q] * back[j];
            }
        }
    }
    free(buf);

    double *merged = malloc(gb_nn_params(V, H) * sizeof *merged);
    if (!merged) return -1.0;
    gb_lora_merge(base, lora, V, H, r, merged);
    double loss = gb_nn_loss(merged, V, H, ids, n);
    free(merged);
    return loss;
}

void gb_diff(const double *after, const double *before, size_t n, double *out) {
    for (size_t i = 0; i < n; i++) out[i] = after[i] - before[i];
}

double gb_gain_share(double before, double after, double best) {
    if (!(before > best)) return 0.0;
    return (before - after) / (before - best);
}

double gb_low_rank(const double *m, size_t rows, size_t cols, size_t r, double *b, double *a) {
    if (rows == 0 || cols == 0) return 1.0;
    if (r > rows) r = rows;
    double *mm = malloc(rows * rows * sizeof *mm);
    double *values = malloc(rows * sizeof *values);
    double *vectors = malloc(rows * rows * sizeof *vectors);
    if (!mm || !values || !vectors) {
        free(mm);
        free(values);
        free(vectors);
        return -1.0;
    }
    for (size_t i = 0; i < rows; i++)
        for (size_t j = 0; j < rows; j++) {
            double s = 0.0;
            for (size_t k = 0; k < cols; k++) s += m[i * cols + k] * m[j * cols + k];
            mm[i * rows + j] = s;
        }
    if (gb_sym_eigen(mm, rows, values, vectors) != 0) {
        free(mm);
        free(values);
        free(vectors);
        return -1.0;
    }
    /* eigenvalues of m m^T are the squared sizes along each direction */
    double total = 0.0, kept = 0.0;
    for (size_t q = 0; q < rows; q++) {
        double v = values[q] > 0.0 ? values[q] : 0.0;
        total += v;
        if (q < r) kept += v;
    }
    if (b)
        for (size_t i = 0; i < rows; i++)
            for (size_t q = 0; q < r; q++) b[i * r + q] = vectors[i * rows + q];
    if (a)
        for (size_t q = 0; q < r; q++)
            for (size_t k = 0; k < cols; k++) {
                double s = 0.0;
                for (size_t i = 0; i < rows; i++) s += vectors[i * rows + q] * m[i * cols + k];
                a[q * cols + k] = s;
            }
    free(mm);
    free(values);
    free(vectors);
    return total > 0.0 ? kept / total : 1.0;
}

double gb_lora_count(size_t layers, size_t hidden, size_t q_out, size_t kv_out, size_t inter,
                     size_t r, int every_weight) {
    double per = (double)(hidden + q_out) + 2.0 * (double)(hidden + kv_out) + (double)(q_out + hidden);
    if (every_weight) per += 3.0 * (double)(hidden + inter);
    return (double)layers * (double)r * per;
}
