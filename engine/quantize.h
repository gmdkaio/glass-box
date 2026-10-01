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

double gb_mse(const double *a, const double *b, size_t n);

/* Theory: for weights spread evenly over the range, MSE = delta^2 / 12. */
double gb_quant_mse_theory(double max_abs, int bits);

#endif