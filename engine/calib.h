#ifndef GB_CALIB_H
#define GB_CALIB_H

#include <stddef.h>

/*
 * A toy model answering n questions, and how well its stated confidence
 * matches how often it is right.
 *
 * Each question gets log-odds z = mean + spread * N(0, 1). The model is right
 * on it with chance sigmoid(z), and it says it is sigmoid(z + shift) sure.
 * shift = 0 is a model whose confidence is honest; shift > 0 sounds surer than
 * it is, shift < 0 less sure.
 */

/* Writes n stated confidences to conf and n outcomes (1 right, 0 wrong) to correct. */
void gb_calib_sample(size_t n, double mean, double spread, double shift, unsigned int seed,
                     double *conf, int *correct);

/*
 * Sorts answers into `bins` equal bins of stated confidence over [0, 1]; a
 * confidence of exactly 1 goes in the last bin. For each bin writes how many
 * answers fell in it, their average stated confidence and the share that were
 * right (both 0 for an empty bin). Confidences outside [0, 1] are skipped.
 * Returns how many answers were counted.
 */
size_t gb_calib_bins(const double *conf, const int *correct, size_t n, size_t bins,
                     unsigned int *count, double *stated, double *right);

/*
 * Expected calibration error: over the same bins, the gap between average
 * stated confidence and share right, weighted by how many answers are in the
 * bin. 0 is perfectly calibrated. Returns 0 if nothing is counted.
 */
double gb_calib_error(const double *conf, const int *correct, size_t n, size_t bins);

/* Brier score: the average of (confidence - outcome)^2. Returns 0 if n is 0. */
double gb_calib_brier(const double *conf, const int *correct, size_t n);

/* out[0] the average stated confidence, out[1] the share answered right; both 0 if n == 0. */
void gb_calib_means(const double *conf, const int *correct, size_t n, double *out);

/*
 * The shift s that, added to every confidence in log-odds, makes the
 * confidences fit the outcomes best (lowest log loss): sigmoid(logit(c) + s).
 * For answers drawn with gb_calib_sample this comes out near -shift. The result
 * is kept within [-20, 20], which it reaches when every answer was right or
 * every answer was wrong. Returns 0 if n is 0.
 */
double gb_calib_fit_shift(const double *conf, const int *correct, size_t n);

/* out[i] = sigmoid(logit(conf[i]) + shift). conf and out may be the same array. */
void gb_calib_apply(const double *conf, size_t n, double shift, double *out);

#endif
