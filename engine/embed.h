#ifndef GB_EMBED_H
#define GB_EMBED_H

#include <stddef.h>

/*
 * Word vectors learned from text, the counting way: count which words appear
 * near which, weight the counts, and compress the table into a few numbers per
 * word. Words used in similar places end up with similar numbers.
 *
 * Matrices are row-major: row i belongs to word i.
 */

/*
 * Counts how often each pair of words appears within `window` places of each
 * other. ids is a text as word numbers; a negative number ends a sentence, and
 * no pair is counted across it. counts is vocab x vocab and is overwritten; it
 * comes out symmetric. Numbers at or above vocab are skipped.
 */
void gb_cooc(const int *ids, size_t n, size_t vocab, size_t window, double *counts);

/*
 * Positive pointwise mutual information: log of how much more often a pair
 * appears than chance would give, or 0 when it is less or never seen.
 * counts and out are vocab x vocab; out may be counts.
 */
void gb_ppmi(const double *counts, size_t vocab, double *out);

/*
 * Every eigenvalue and eigenvector of a symmetric n x n matrix (Jacobi
 * rotations), sorted from the largest eigenvalue down. values gets n numbers;
 * vectors is n x n with eigenvector j in column j. a is left unchanged.
 * Returns 0, or -1 if memory runs out.
 */
int gb_sym_eigen(const double *a, size_t n, double *values, double *vectors);

/*
 * Word vectors from the first k eigenvectors: row i is
 * (vectors[i][j] * sqrt(max(values[j], 0)), j < k), then scaled to length 1
 * (a zero row stays zero). out is n x k.
 */
void gb_embed_take(const double *values, const double *vectors, size_t n, size_t k, double *out);

/* Cosine similarity of q with every row of rows (n x dim). A zero row or q gives 0. */
void gb_cosine_rows(const double *rows, size_t n, size_t dim, const double *q, double *out);

/* The average of the rows listed in ids (m of them), into out (dim numbers). */
void gb_mean_rows(const double *rows, size_t dim, const int *ids, size_t m, double *out);

/*
 * How often a word's `near` nearest neighbours (by cosine, itself excluded)
 * share its label, over all words with a label of 0 or more. Returns a share
 * between 0 and 1, or 0 if nothing is labelled.
 */
double gb_neighbour_agreement(const double *rows, size_t n, size_t dim, const int *labels, size_t near);

/*
 * A flat map of the rows: center them, find the two directions they spread
 * along most (principal components), and give each row its position along
 * those. out is n x 2. Each direction's sign is set so its largest component is
 * positive, so the map does not flip between calls. Returns 0, or -1 if memory
 * runs out.
 */
int gb_project_2d(const double *rows, size_t n, size_t dim, double *out);

#endif
