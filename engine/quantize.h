#ifndef GB_QUANTIZE_H
#define GB_QUANTIZE_H

#include <stddef.h>

/*
 * Midrise uniform quantizer with b bits (1 <= b <= 24).
 * Range is [-max_abs, max_abs], split into 2^b cells of width
 *   delta = 2 * max_abs / 2^b
 * Reconstruction levels sit at the cell centers: (k + 0.5) * delta,
 * for k = -2^(b-1) .. 2^(b-1) - 1. Works for every b >= 1, including 1 bit.
 */

double gb_max_abs(const double *w, size_t n);
double gb_quant_step(double max_abs, int bits);

/* Quantizes w into out using the range of w itself. Returns delta. */
double gb_quantize(const double *w, double *out, size_t n, int bits);

/*
 * Same quantizer over a fixed range [-max_abs, max_abs]. Values outside the
 * range are clipped to the outermost level. Returns delta, or 0 (and writes
 * zeros) when max_abs is 0. With max_abs = 1 and n = 4 this gives the nearest
 * allowed point of the tesseract view.
 */
double gb_quantize_range(const double *w, double *out, size_t n, int bits,
                         double max_abs);

double gb_mse(const double *a, const double *b, size_t n);

/* Euclidean distance between two points of length n. */
double gb_dist(const double *a, const double *b, size_t n);

/*
 * Share of the original signal kept after quantizing: 1 - mse / mean(w^2),
 * floored at 0. A readout for the toy model, not a measure of model accuracy.
 * Returns 0 when w is all zeros.
 */
double gb_signal_kept(const double *w, const double *q, size_t n);

/* Theory: for weights spread evenly over the range, MSE = delta^2 / 12. */
double gb_quant_mse_theory(double max_abs, int bits);

#endif