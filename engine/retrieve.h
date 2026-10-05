#ifndef GB_RETRIEVE_H
#define GB_RETRIEVE_H

#include <stddef.h>

/*
 * A toy search over a handful of pages, the step a model runs before it
 * answers from documents.
 *
 * Pages and questions are lists of word numbers. Page p is
 * terms[start[p] .. start[p + 1]), so start has pages + 1 entries. A word
 * number outside 0..vocab-1 is skipped.
 */

/*
 * BM25, the classic keyword score: for each question word found in the page,
 *
 *   weight * idf * f * (k1 + 1) / (f + k1 * (1 - b + b * len / avglen))
 *
 * with f how often the word is in the page, len the page length, avglen the
 * average page length and idf = ln(1 + (pages - df + 0.5) / (df + 0.5)), df the
 * number of pages holding the word. A page sharing no word with the question
 * scores 0. weights gives each question word a weight (NULL means 1 for all), so
 * a word added for its meaning can count for less than one typed.
 * Writes one score per page.
 */
void gb_bm25(const int *terms, const size_t *start, size_t pages, size_t vocab,
             const int *query, const double *weights, size_t nquery,
             double k1, double b, double *scores);

/* Where page `page` ranks by score, 0 being the top. Ties go to the lower page number. */
size_t gb_rank_of(const double *scores, size_t pages, size_t page);

/*
 * The chance the model answers from page `page` when it is handed the top k
 * pages: 0 if the page is not among them, else its softmax share of the handed
 * pages' scores at the given temperature. A higher temperature spreads the
 * model's reading more evenly over the pages it was given.
 */
double gb_pick_share(const double *scores, size_t pages, size_t page, size_t k, double temperature);

#endif
