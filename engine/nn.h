#ifndef GB_NN_H
#define GB_NN_H

#include <stddef.h>

/*
 * A tiny neural network that reads one word and gives odds for the next one.
 * V words in the vocabulary, H hidden units. The word goes in, a hidden layer
 * of H numbers is worked out (tanh), and V scores come out and become odds.
 *
 * All the learned numbers live in one array, laid out as
 *   w1  V * H   row = the input word
 *   b1  H
 *   w2  H * V   row = a hidden unit
 *   b2  V
 */

/* How many numbers the array needs. */
size_t gb_nn_params(size_t V, size_t H);

/* Fills params with small random numbers from the seed. */
void gb_nn_init(double *params, size_t V, size_t H, unsigned int seed);

/* Runs the network for one input word. hidden has H entries, odds has V. */
void gb_nn_forward(const double *params, size_t V, size_t H, size_t word, double *hidden,
                   double *odds);

/*
 * Average cross-entropy over the word pairs in ids[0..n), which is how
 * surprised the network is by the text. Pairs with a number outside 0..V-1
 * are skipped. Returns 0 if there are no pairs.
 */
double gb_nn_loss(const double *params, size_t V, size_t H, const int *ids, size_t n);

/*
 * Teaches the network: `epochs` passes over the word pairs in ids, one pair
 * at a time, with gradient descent at the given rate. Changes params in place
 * and returns the loss afterwards, or -1 if it ran out of memory.
 */
double gb_nn_train(double *params, size_t V, size_t H, const int *ids, size_t n, size_t epochs,
                   double rate);

#endif
