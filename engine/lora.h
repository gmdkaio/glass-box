#ifndef GB_LORA_H
#define GB_LORA_H

#include <stddef.h>

/*
 * LoRA on the tiny word network of nn.h: the network's numbers stay frozen, and
 * each of its two layers gets a patch made of two thin strips whose product is
 * added on top.
 *
 *   layer 1 (V x H) + B1 A1,  B1 is V x r, A1 is r x H
 *   layer 2 (H x V) + B2 A2,  B2 is H x r, A2 is r x V
 *
 * r is the rank. The strips live in one array, laid out B1, A1, B2, A2.
 */

/* How many numbers the strips hold: 2 r (V + H). */
size_t gb_lora_params(size_t V, size_t H, size_t r);

/* B strips to 0, so the patch starts as no change; A strips small and random from the seed. */
void gb_lora_init(double *lora, size_t V, size_t H, size_t r, unsigned int seed);

/* The network with the patch added: out gets gb_nn_params(V, H) numbers. out may not be base. */
void gb_lora_merge(const double *base, const double *lora, size_t V, size_t H, size_t r,
                   double *out);

/*
 * Trains only the strips, `epochs` passes over the word pairs in ids, one pair at
 * a time, as gb_nn_train does. base stays as it is. Returns the loss on ids
 * afterwards, or -1 if memory runs out.
 */
double gb_lora_train(const double *base, double *lora, size_t V, size_t H, size_t r,
                     const int *ids, size_t n, size_t epochs, double rate);

/* What a fine-tune changed: out[i] = after[i] - before[i]. out may be either. */
void gb_diff(const double *after, const double *before, size_t n, double *out);

/*
 * How much of a fine-tune's gain another one reached: (before - after) / (before - best),
 * where each is a loss. Returns 0 if best is no better than before.
 */
double gb_gain_share(double before, double after, double best);

/*
 * The closest rank-r version of a rows x cols matrix m (rows <= cols), as two
 * strips: b (rows x r) times a (r x cols). b holds the r main directions of the
 * rows, from the eigenvectors of m m^T, and a = b^T m. Either may be NULL.
 * Returns the share of m's sum of squares the strips keep, or -1 if memory runs out.
 */
double gb_low_rank(const double *m, size_t rows, size_t cols, size_t r, double *b, double *a);

/*
 * Numbers LoRA trains on a transformer: for every layer, a pair of strips on each
 * chosen weight, r (in + out) numbers each. With every_weight = 0, only the
 * attention weights: query (hidden to q_out), key and value (hidden to kv_out each),
 * output (q_out to hidden). With every_weight = 1, also the three feed-forward
 * weights: gate and up (hidden to inter) and down (inter to hidden).
 */
double gb_lora_count(size_t layers, size_t hidden, size_t q_out, size_t kv_out, size_t inter,
                     size_t r, int every_weight);

#endif
