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

/* How the step size changes over training: lr_scheduler_type. */
enum { GB_LR_CONSTANT = 0, GB_LR_LINEAR = 1, GB_LR_COSINE = 2 };

/*
 * The step size for pass e (0-based) of `epochs`: rate for constant; for linear,
 * rate * (1 - e / epochs); for cosine, rate * (1 + cos(pi * e / epochs)) / 2.
 */
double gb_lr_at(double rate, int schedule, size_t e, size_t epochs);

/*
 * gb_nn_train one pass at a time, with the step size from gb_lr_at, writing the
 * loss on ids after each pass to curve[0..epochs). A loss that is no longer a
 * number (the network blew up) is written as infinity. Returns the last loss,
 * or -1 if it ran out of memory.
 */
double gb_nn_train_curve(double *params, size_t V, size_t H, const int *ids, size_t n,
                         size_t epochs, double rate, int schedule, double *curve);

/*
 * How surprised the network is by each word of a text: out[i] is -ln(the odds it
 * gave word i + 1 after word i), for i < n - 1, clamped like gb_nn_loss. A pair
 * with a number outside 0..V-1 gets 0. Returns 0, or -1 if memory runs out.
 */
int gb_nn_word_loss(const double *params, size_t V, size_t H, const int *ids, size_t n,
                    double *out);

/*
 * gb_nn_train one pass at a time at a fixed rate, watching after each pass:
 * the loss on the training text (train[e]), on held-out text the network never
 * trains on (held_loss[e]), and on older text it knew before (old_loss[e]), and
 * gb_nn_word_loss on a probe text (probe_loss[e * (np - 1) ..], np - 1 per pass).
 * Any of the four outputs may be NULL, and so may held, old or probe (with their
 * length 0). Returns the last training loss, or -1 if it ran out of memory.
 */
double gb_nn_train_watch(double *params, size_t V, size_t H, const int *ids, size_t n,
                         const int *held, size_t nh, const int *old, size_t no, const int *probe,
                         size_t np, size_t epochs, double rate, double *train, double *held_loss,
                         double *old_loss, double *probe_loss);

/*
 * A fill-in-the-blank exam: for question i the network reads the word before the
 * blank, context[i], and its top guess (the word with the highest odds; ties go to
 * the lower number) is written to guess[i] (may be NULL). Returns how many guesses
 * equal answer[i]. A context outside 0..V-1 counts as wrong, with guess -1.
 */
size_t gb_nn_quiz(const double *params, size_t V, size_t H, const int *context,
                  const int *answer, size_t n, int *guess);

#endif
