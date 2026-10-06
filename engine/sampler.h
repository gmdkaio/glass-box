#ifndef GB_SAMPLER_H
#define GB_SAMPLER_H

#include <stddef.h>

/*
 * Sampling settings: what a local runner does to the scores before it picks a
 * word. The order follows llama.cpp: the repeat penalty changes the scores,
 * then top-k, top-p and min-p cut words using the odds at temperature 1, and
 * the temperature reshapes the odds of the words that are left.
 *
 * The three filters take odds p[0..n) that add up to 1, write the kept words'
 * odds shared out again (so they add up to 1) to out, give cut words 0, and
 * return how many words they kept. A word with odds 0 is never kept. out may
 * be p. Ties keep the lower index first.
 */

/* Keeps the k words with the highest odds. k == 0 or k >= n keeps them all. */
size_t gb_top_k(const double *p, size_t n, size_t k, double *out);

/*
 * Keeps the fewest top words whose odds add up to at least top_p, and always
 * the top word. top_p >= 1 keeps them all.
 */
size_t gb_top_p(const double *p, size_t n, double top_p, double *out);

/* Keeps every word with odds of at least min_p times the top word's. min_p <= 0 keeps them all. */
size_t gb_min_p(const double *p, size_t n, double min_p, double *out);

/*
 * The repeat penalty, as llama.cpp applies it: every word that appears in
 * recent[0..m) gets its score divided by penalty if the score is above 0, and
 * multiplied by it otherwise, once, however often it appeared. Numbers outside
 * 0..n-1 in recent are skipped. out may be scores.
 */
void gb_repeat_penalty(const double *scores, size_t n, const int *recent, size_t m,
                       double penalty, double *out);

/* The odds of words from..n-1 added up: on the page, the words that make no sense. */
double gb_odds_from(const double *p, size_t n, size_t from);

/* Which setting cut a word, in cut_by. */
enum { GB_KEPT = 0, GB_CUT_TOP_K = 1, GB_CUT_TOP_P = 2, GB_CUT_MIN_P = 3 };

/*
 * The whole chain on one set of scores, without the penalty: softmax at
 * temperature 1, top-k, top-p, min-p, then the temperature on what is left.
 * out gets the final odds. cut_by (may be NULL) gets, for each word, the
 * setting that cut it first, or GB_KEPT. temperature <= 0 gives all the odds
 * to the top word. Returns how many words were kept.
 */
size_t gb_sample_odds(const double *scores, size_t n, double temperature, size_t top_k,
                      double top_p, double min_p, double *out, int *cut_by);

/*
 * Writes a reply with a word-pair model. counts is vocab x vocab from
 * gb_pair_counts. The score of a word after the previous one is
 * base + ln(count), and words never seen after it are left out; base stands
 * in for the size of a real model's scores, which the penalty divides.
 *
 * The reply starts with start[0..nstart) and is continued to len words in out
 * (nstart <= len). Each new word: the penalty on the scores, using the last
 * last_n words written, then gb_sample_odds, then one seeded draw.
 * before (may be NULL) gets, for each new word, its odds with no penalty and no
 * filters at temperature 1 (before[i] for out[i]; the start words get 1).
 * A word nothing was ever seen after ends the reply early. Returns the length.
 */
size_t gb_generate(const size_t *counts, size_t vocab, const int *start, size_t nstart,
                   size_t len, double temperature, size_t top_k, double top_p, double min_p,
                   double penalty, size_t last_n, double base, unsigned int seed, int *out,
                   double *before);

/*
 * How loopy a reply is: the share of its k-word runs that already appeared
 * earlier in it. Returns 0 if it has no more than k words.
 */
double gb_loop_share(const int *ids, size_t n, size_t k);

/*
 * Repeat penalty against loops, averaged over `runs` replies (seeds seed,
 * seed + 1, ...). For each penalties[j]: loops[j] = the average gb_loop_share
 * with k = 3, and odd[j] = the share of new words whose odds before the penalty
 * were below `unlikely`. Other settings as in gb_generate.
 */
void gb_penalty_curve(const size_t *counts, size_t vocab, const int *start, size_t nstart,
                      size_t len, double temperature, size_t top_k, double top_p,
                      double min_p, size_t last_n, double base, const double *penalties,
                      size_t m, size_t runs, unsigned int seed, double unlikely,
                      double *loops, double *odd);

#endif
