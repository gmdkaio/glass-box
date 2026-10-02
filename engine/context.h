#ifndef GB_CONTEXT_H
#define GB_CONTEXT_H

#include <stddef.h>

/*
 * A toy context: n sentences, one of which (the key, at key_at) holds the answer.
 * The question gives every sentence a score for how well it seems to match, and
 * softmax turns the scores into shares of attention that add up to 1.
 *
 *   key           key_score
 *   look-alikes   lookalike_score, for `lookalikes` sentences at seeded places
 *   the rest      seeded noise: spread * N(0, 1)
 *
 * On top of that every sentence loses dip * 4x(1 - x), with x = i / (n - 1) its
 * place in the context: nothing at the very start and end, the full dip in the
 * middle. dip = 0 means place does not matter.
 */

/* Writes the n scores. lookalikes is capped at n - 1, and key_at must be below n. */
void gb_context_scores(size_t n, size_t key_at, double key_score, double spread,
                       size_t lookalikes, double lookalike_score, double dip,
                       unsigned int seed, double *scores);

/* Where a key at `place` (0 = first, 1 = last) sits among n sentences. */
size_t gb_context_place(size_t n, double place);

/*
 * The key's share of attention, averaged over `trials` contexts drawn from one
 * seed, with the key at `place`. Returns 0 if n or trials is 0.
 */
double gb_context_share(size_t n, double place, double key_score, double spread,
                        size_t lookalikes, double lookalike_score, double dip,
                        size_t trials, unsigned int seed);

#endif
