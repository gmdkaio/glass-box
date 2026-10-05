#include "embed.h"

#include <math.h>
#include <stdlib.h>
#include <string.h>

void gb_cooc(const int *ids, size_t n, size_t vocab, size_t window, double *counts) {
    memset(counts, 0, vocab * vocab * sizeof *counts);
    for (size_t i = 0; i < n; i++) {
        if (ids[i] < 0 || (size_t)ids[i] >= vocab) continue;
        /* look ahead only, and stop at the end of the sentence; each pair counts both ways */
        for (size_t j = i + 1; j < n && j <= i + window; j++) {
            if (ids[j] < 0) break;
            if ((size_t)ids[j] >= vocab || j == i) continue;
            counts[(size_t)ids[i] * vocab + (size_t)ids[j]] += 1.0;
            counts[(size_t)ids[j] * vocab + (size_t)ids[i]] += 1.0;
        }
    }
}

void gb_ppmi(const double *counts, size_t vocab, double *out) {
    double total = 0.0;
    double *row = calloc(vocab ? vocab : 1, sizeof *row);
    if (!row) return;
    for (size_t i = 0; i < vocab; i++)
        for (size_t j = 0; j < vocab; j++) {
            row[i] += counts[i * vocab + j];
            total += counts[i * vocab + j];
        }
    for (size_t i = 0; i < vocab; i++)
        for (size_t j = 0; j < vocab; j++) {
            double c = counts[i * vocab + j];
            double v = 0.0;
            if (c > 0.0 && row[i] > 0.0 && row[j] > 0.0) {
                v = log(c * total / (row[i] * row[j]));
                if (v < 0.0) v = 0.0;
            }
            out[i * vocab + j] = v;
        }
    free(row);
}

/* cyclic Jacobi: rotate away each off-diagonal entry in turn until they are all tiny */
int gb_sym_eigen(const double *a, size_t n, double *values, double *vectors) {
    double *m = malloc((n ? n * n : 1) * sizeof *m);
    size_t *order = malloc((n ? n : 1) * sizeof *order);
    double *v = malloc((n ? n * n : 1) * sizeof *v);
    if (!m || !order || !v) {
        free(m);
        free(order);
        free(v);
        return -1;
    }
    memcpy(m, a, n * n * sizeof *m);
    for (size_t i = 0; i < n; i++)
        for (size_t j = 0; j < n; j++) v[i * n + j] = i == j ? 1.0 : 0.0;

    double norm = 0.0;
    for (size_t i = 0; i < n * n; i++) norm += m[i] * m[i];
    for (int sweep = 0; sweep < 100; sweep++) {
        double off = 0.0;
        for (size_t p = 0; p < n; p++)
            for (size_t q = p + 1; q < n; q++) off += m[p * n + q] * m[p * n + q];
        if (off <= 1e-22 * (norm > 0.0 ? norm : 1.0)) break;
        for (size_t p = 0; p < n; p++)
            for (size_t q = p + 1; q < n; q++) {
                double apq = m[p * n + q];
                if (fabs(apq) < 1e-300) continue;
                double theta = (m[q * n + q] - m[p * n + p]) / (2.0 * apq);
                double t = (theta >= 0.0 ? 1.0 : -1.0) / (fabs(theta) + sqrt(theta * theta + 1.0));
                double c = 1.0 / sqrt(t * t + 1.0), s = t * c;
                for (size_t k = 0; k < n; k++) {
                    double mkp = m[k * n + p], mkq = m[k * n + q];
                    m[k * n + p] = c * mkp - s * mkq;
                    m[k * n + q] = s * mkp + c * mkq;
                }
                for (size_t k = 0; k < n; k++) {
                    double mpk = m[p * n + k], mqk = m[q * n + k];
                    m[p * n + k] = c * mpk - s * mqk;
                    m[q * n + k] = s * mpk + c * mqk;
                }
                for (size_t k = 0; k < n; k++) {
                    double vkp = v[k * n + p], vkq = v[k * n + q];
                    v[k * n + p] = c * vkp - s * vkq;
                    v[k * n + q] = s * vkp + c * vkq;
                }
            }
    }

    /* sort by eigenvalue, largest first (insertion sort; n is small) */
    for (size_t i = 0; i < n; i++) order[i] = i;
    for (size_t i = 1; i < n; i++) {
        size_t x = order[i], j = i;
        while (j > 0 && m[order[j - 1] * n + order[j - 1]] < m[x * n + x]) {
            order[j] = order[j - 1];
            j--;
        }
        order[j] = x;
    }
    for (size_t j = 0; j < n; j++) {
        values[j] = m[order[j] * n + order[j]];
        for (size_t i = 0; i < n; i++) vectors[i * n + j] = v[i * n + order[j]];
    }
    free(m);
    free(order);
    free(v);
    return 0;
}

void gb_embed_take(const double *values, const double *vectors, size_t n, size_t k, double *out) {
    if (k > n) k = n;
    for (size_t i = 0; i < n; i++) {
        double len = 0.0;
        for (size_t j = 0; j < k; j++) {
            double x = vectors[i * n + j] * sqrt(values[j] > 0.0 ? values[j] : 0.0);
            out[i * k + j] = x;
            len += x * x;
        }
        if (len > 0.0) {
            len = sqrt(len);
            for (size_t j = 0; j < k; j++) out[i * k + j] /= len;
        }
    }
}

static double dot(const double *a, const double *b, size_t dim) {
    double s = 0.0;
    for (size_t j = 0; j < dim; j++) s += a[j] * b[j];
    return s;
}

void gb_cosine_rows(const double *rows, size_t n, size_t dim, const double *q, double *out) {
    double qq = sqrt(dot(q, q, dim));
    for (size_t i = 0; i < n; i++) {
        double rr = sqrt(dot(rows + i * dim, rows + i * dim, dim));
        out[i] = qq > 0.0 && rr > 0.0 ? dot(rows + i * dim, q, dim) / (qq * rr) : 0.0;
    }
}

void gb_mean_rows(const double *rows, size_t dim, const int *ids, size_t m, double *out) {
    for (size_t j = 0; j < dim; j++) out[j] = 0.0;
    if (m == 0) return;
    for (size_t i = 0; i < m; i++)
        for (size_t j = 0; j < dim; j++) out[j] += rows[(size_t)ids[i] * dim + j];
    for (size_t j = 0; j < dim; j++) out[j] /= (double)m;
}

double gb_neighbour_agreement(const double *rows, size_t n, size_t dim, const int *labels, size_t near) {
    double *sim = malloc((n ? n : 1) * sizeof *sim);
    char *used = malloc(n ? n : 1);
    if (!sim || !used || near == 0) {
        free(sim);
        free(used);
        return 0.0;
    }
    size_t hits = 0, total = 0;
    for (size_t i = 0; i < n; i++) {
        if (labels[i] < 0) continue;
        gb_cosine_rows(rows, n, dim, rows + i * dim, sim);
        memset(used, 0, n);
        used[i] = 1;
        /* the `near` most similar other words, ties to the lower number */
        for (size_t r = 0; r < near && r + 1 < n; r++) {
            size_t best = n;
            for (size_t j = 0; j < n; j++)
                if (!used[j] && (best == n || sim[j] > sim[best])) best = j;
            if (best == n) break;
            used[best] = 1;
            hits += labels[best] == labels[i];
            total++;
        }
    }
    free(sim);
    free(used);
    return total ? (double)hits / (double)total : 0.0;
}

int gb_project_2d(const double *rows, size_t n, size_t dim, double *out) {
    for (size_t i = 0; i < 2 * n; i++) out[i] = 0.0;
    if (n == 0 || dim == 0) return 0;
    double *mean = calloc(dim, sizeof *mean);
    double *cov = calloc(dim * dim, sizeof *cov);
    double *val = malloc(dim * sizeof *val);
    double *vec = malloc(dim * dim * sizeof *vec);
    if (!mean || !cov || !val || !vec) {
        free(mean);
        free(cov);
        free(val);
        free(vec);
        return -1;
    }
    for (size_t i = 0; i < n; i++)
        for (size_t j = 0; j < dim; j++) mean[j] += rows[i * dim + j] / (double)n;
    for (size_t i = 0; i < n; i++)
        for (size_t a = 0; a < dim; a++)
            for (size_t b = 0; b < dim; b++)
                cov[a * dim + b] += (rows[i * dim + a] - mean[a]) * (rows[i * dim + b] - mean[b]);
    int ok = gb_sym_eigen(cov, dim, val, vec);
    if (ok == 0) {
        for (size_t c = 0; c < 2 && c < dim; c++) {
            /* fix the sign: the largest component points the positive way */
            size_t big = 0;
            for (size_t j = 1; j < dim; j++)
                if (fabs(vec[j * dim + c]) > fabs(vec[big * dim + c])) big = j;
            double sign = vec[big * dim + c] < 0.0 ? -1.0 : 1.0;
            for (size_t i = 0; i < n; i++) {
                double x = 0.0;
                for (size_t j = 0; j < dim; j++) x += (rows[i * dim + j] - mean[j]) * vec[j * dim + c];
                out[i * 2 + c] = sign * x;
            }
        }
    }
    free(mean);
    free(cov);
    free(val);
    free(vec);
    return ok;
}
