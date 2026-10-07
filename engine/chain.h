#ifndef GB_CHAIN_H
#define GB_CHAIN_H

#include <stddef.h>

/*
 * A long task as a chain of steps. Each step comes out right with chance p, and
 * one wrong step spoils the result, because every later step builds on it.
 *
 * Checks: with check_every = k > 0, the steps are split into sections of k (the
 * last one may be shorter) and a check runs after each section. If the section
 * has a wrong step, the check catches it with chance catch_rate, and the section
 * is done again, at most `retries` times; after that the task gives up. A check
 * that misses a wrong step looks like a check that passed, and the task carries
 * on broken. With check_every = 0 there are no checks.
 */

/* How a run ended. */
enum { GB_CHAIN_CLEAN = 0, GB_CHAIN_BROKEN = 1, GB_CHAIN_GAVE_UP = 2 };

/* What happened along a run, in order. */
enum { GB_STEP_RIGHT = 0, GB_STEP_WRONG = 1, GB_CHECK_PASSED = 2, GB_CHECK_CAUGHT = 3 };

/*
 * Exact chance that the task finishes clean. Without checks it is p^steps.
 * With checks, a section of L steps passes with chance
 *   q * (1 + m + m^2 + ... + m^retries),  q = p^L,  m = (1 - q) * catch_rate
 * and the task passes if every section does.
 */
double gb_chain_odds(double p, int steps, int check_every, double catch_rate, int retries);

/*
 * The two numbers behind one section of `every` steps: out[0] = q = p^every, the
 * chance it is right first time, and out[1] = m = (1 - q) * catch_rate, the chance
 * it is wrong and a check catches it.
 */
void gb_chain_section(double p, int every, double catch_rate, double *out);

/*
 * Runs one task with a seeded generator. Writes what happened to events (at most
 * max_events, the rest is dropped) and how many were written to *written, and the
 * step (0-based) of the first wrong step that spoiled it to *broken_at, or -1 if
 * it finished clean. Returns GB_CHAIN_CLEAN, GB_CHAIN_BROKEN or GB_CHAIN_GAVE_UP.
 * A run stops at the check that misses a wrong step, since the rest builds on it.
 */
int gb_chain_trace(double p, int steps, int check_every, double catch_rate, int retries,
                   unsigned int seed, int *events, size_t max_events, size_t *written,
                   int *broken_at);

/*
 * Runs `trials` tasks from one seed. outcomes[3] counts clean, broken and gave-up
 * runs. broken_at has room for `steps` entries and counts, for the runs that did
 * not finish clean, the step of the wrong step that spoiled them. Returns the
 * average number of steps per run that were thrown away because a check sent
 * their section back: the price of the checks.
 */
double gb_chain_trials(double p, int steps, int check_every, double catch_rate, int retries,
                       size_t trials, unsigned int seed, size_t *outcomes, size_t *broken_at);

#endif
