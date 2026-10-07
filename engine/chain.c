#include "chain.h"

#include <math.h>

#include "rng.h"

double gb_chain_odds(double p, int steps, int check_every, double catch_rate, int retries) {
    if (steps <= 0) return 1.0;
    if (check_every <= 0) return pow(p, steps);

    double odds = 1.0;
    for (int start = 0; start < steps; start += check_every) {
        int len = steps - start < check_every ? steps - start : check_every;
        double q = pow(p, len);
        double m = (1.0 - q) * catch_rate;
        double sum = 0.0, term = 1.0;
        for (int a = 0; a <= retries; a++) {
            sum += term;
            term *= m;
        }
        odds *= q * sum;
    }
    return odds;
}

/* one run; events may be NULL. Adds the steps a check sent back to *redone. */
static int run(gb_rng *r, double p, int steps, int check_every, double catch_rate, int retries,
               int *events, size_t max_events, size_t *written, int *broken_at, size_t *redone) {
    size_t n = 0;
#define EMIT(e)                                       \
    do {                                              \
        if (events && n < max_events) events[n] = (e); \
        n++;                                          \
    } while (0)

    int section = check_every > 0 ? check_every : steps;
    int outcome = GB_CHAIN_CLEAN;
    *broken_at = -1;

    for (int start = 0; start < steps && outcome == GB_CHAIN_CLEAN; start += section) {
        int len = steps - start < section ? steps - start : section;
        for (int attempt = 0;; attempt++) {
            int wrong = -1;
            for (int i = 0; i < len; i++) {
                int right = gb_rng_uniform(r) < p;
                EMIT(right ? GB_STEP_RIGHT : GB_STEP_WRONG);
                if (!right && wrong < 0) wrong = start + i;
            }
            if (check_every <= 0) {
                if (wrong >= 0) {
                    outcome = GB_CHAIN_BROKEN;
                    *broken_at = wrong;
                }
                break;
            }
            if (wrong < 0) {
                EMIT(GB_CHECK_PASSED);
                break;
            }
            if (gb_rng_uniform(r) >= catch_rate) {
                EMIT(GB_CHECK_PASSED); /* it missed, so it looks like a pass */
                outcome = GB_CHAIN_BROKEN;
                *broken_at = wrong;
                break;
            }
            EMIT(GB_CHECK_CAUGHT);
            *redone += (size_t)len;
            if (attempt == retries) {
                outcome = GB_CHAIN_GAVE_UP;
                *broken_at = wrong;
                break;
            }
        }
    }
#undef EMIT
    if (written) *written = n < max_events ? n : max_events;
    return outcome;
}

int gb_chain_trace(double p, int steps, int check_every, double catch_rate, int retries,
                   unsigned int seed, int *events, size_t max_events, size_t *written,
                   int *broken_at) {
    gb_rng r;
    gb_rng_seed(&r, seed);
    size_t redone = 0;
    return run(&r, p, steps, check_every, catch_rate, retries, events, max_events, written,
               broken_at, &redone);
}

double gb_chain_trials(double p, int steps, int check_every, double catch_rate, int retries,
                       size_t trials, unsigned int seed, size_t *outcomes, size_t *broken_at) {
    outcomes[0] = outcomes[1] = outcomes[2] = 0;
    for (int i = 0; i < steps; i++) broken_at[i] = 0;
    if (trials == 0) return 0.0;

    gb_rng r;
    gb_rng_seed(&r, seed);
    size_t redone = 0;
    for (size_t t = 0; t < trials; t++) {
        int at;
        int outcome = run(&r, p, steps, check_every, catch_rate, retries, NULL, 0, NULL, &at, &redone);
        outcomes[outcome]++;
        if (at >= 0) broken_at[at]++;
    }
    return (double)redone / (double)trials;
}

void gb_chain_section(double p, int every, double catch_rate, double *out) {
    double q = pow(p, (double)(every > 0 ? every : 0));
    out[0] = q;
    out[1] = (1.0 - q) * catch_rate;
}
