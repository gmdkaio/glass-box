#ifndef GB_TEXT_H
#define GB_TEXT_H

#include <stddef.h>

/*
 * Counts which word follows which. ids[0..n) is a text written as word
 * numbers, each below vocab. counts is a vocab x vocab matrix: row = a word,
 * column = the word right after it. It is overwritten.
 * A pair with a number outside 0..vocab-1 is skipped.
 * Returns how many pairs were counted.
 */
size_t gb_pair_counts(const int *ids, size_t n, size_t vocab, size_t *counts);

/*
 * Turns a row of counts into odds: each count divided by the row total.
 * out has room for n entries. Returns the row total, and fills out with zeros
 * if it is 0.
 */
size_t gb_row_odds(const size_t *row, size_t n, double *out);

/*
 * How surprised a plain counting table is by its own text: the average of
 * -ln(odds of the word that really came next), using the odds in counts.
 * No model that only looks at one word can do better, so it is the target a
 * network is measured against. Pairs with a number outside 0..vocab-1 are
 * skipped. Returns 0 if there are no pairs.
 */
double gb_table_loss(const size_t *counts, size_t vocab, const int *ids, size_t n);

#endif
