#include <math.h>

#include "chain.h"
#include "check.h"

#define TRIALS 200000

int main(void) {
    /* no checks: the chance is p^steps, so 20 steps at 95% finish clean about 36% of the time */
    CHECK(fabs(gb_chain_odds(0.95, 20, 0, 0.9, 3) - pow(0.95, 20)) < 1e-15, "no checks gives p^steps");
    CHECK(fabs(gb_chain_odds(0.95, 20, 0, 0.9, 3) - 0.3585) < 1e-4, "20 steps at 95% is about 36%");
    CHECK(gb_chain_odds(0.5, 0, 0, 0.9, 3) == 1.0, "a task with no steps always finishes");
    CHECK(gb_chain_odds(1.0, 50, 0, 0.0, 0) == 1.0, "steps that are always right never spoil the task");

    /* a check that never catches anything changes nothing */
    CHECK(fabs(gb_chain_odds(0.9, 12, 3, 0.0, 5) - pow(0.9, 12)) < 1e-12, "a blind check is no check");
    /* no retries: a caught mistake still ends the task, so the odds are p^steps too */
    CHECK(fabs(gb_chain_odds(0.9, 12, 3, 1.0, 0) - pow(0.9, 12)) < 1e-12, "catching without redoing does not help");

    /* one section of one step, perfect check, one retry: p + (1 - p) * p */
    CHECK(fabs(gb_chain_odds(0.8, 1, 1, 1.0, 1) - (0.8 + 0.2 * 0.8)) < 1e-12, "one retry of one step");
    /* sections are cut at check_every, with a shorter last one: 5 steps by 2 is 2 + 2 + 1 */
    {
        double q2 = 0.9 * 0.9, q1 = 0.9, c = 0.75;
        double s2 = q2 * (1 + (1 - q2) * c + pow((1 - q2) * c, 2));
        double s1 = q1 * (1 + (1 - q1) * c + pow((1 - q1) * c, 2));
        CHECK(fabs(gb_chain_odds(0.9, 5, 2, c, 2) - s2 * s2 * s1) < 1e-12, "uneven last section");
    }
    /* checking helps, and checking more often helps more */
    double none = gb_chain_odds(0.95, 20, 0, 0.9, 3);
    double every5 = gb_chain_odds(0.95, 20, 5, 0.9, 3);
    double every1 = gb_chain_odds(0.95, 20, 1, 0.9, 3);
    CHECK(none < every5 && every5 < every1, "more checks, better odds");

    /* trials: shares match the exact odds, and every run has an outcome */
    size_t out[3], at[20];
    double redone = gb_chain_trials(0.95, 20, 0, 0.9, 3, TRIALS, 7, out, at);
    CHECK(out[0] + out[1] + out[2] == TRIALS, "every run has one outcome");
    CHECK(out[2] == 0, "no checks, so nothing gives up");
    CHECK(fabs((double)out[0] / TRIALS - none) < 0.005, "clean share matches p^steps");
    CHECK(redone == 0.0, "without checks nothing is redone");
    size_t spoiled = 0;
    for (int i = 0; i < 20; i++) spoiled += at[i];
    CHECK(spoiled == out[1], "every broken run has a step it broke at");
    /* the first wrong step is more often early: 5% at step 0, 5% * 0.95^19 at step 19 */
    CHECK(at[0] > at[19], "early steps spoil more runs than late ones");
    CHECK(fabs((double)at[0] / TRIALS - 0.05) < 0.003, "step 0 spoils about 5% of runs");

    redone = gb_chain_trials(0.95, 20, 5, 0.9, 3, TRIALS, 8, out, at);
    CHECK(fabs((double)out[0] / TRIALS - every5) < 0.005, "clean share matches the odds with checks");
    CHECK(redone > 0.0 && redone < 20.0, "redoing sections costs some extra steps");
    gb_chain_trials(0.6, 10, 2, 1.0, 1, TRIALS, 9, out, at);
    CHECK(out[2] > 0, "with a perfect check and few retries, some runs give up");
    CHECK(out[1] == 0, "a perfect check never lets a mistake through");

    /* same seed, same runs */
    size_t out2[3], at2[20];
    gb_chain_trials(0.9, 20, 4, 0.8, 2, 1000, 3, out, at);
    gb_chain_trials(0.9, 20, 4, 0.8, 2, 1000, 3, out2, at2);
    CHECK(out[0] == out2[0] && out[1] == out2[1] && out[2] == out2[2], "same seed, same outcomes");

    /* trace: no checks, one event per step, and broken_at is the first wrong one */
    int ev[256];
    size_t n;
    int broke;
    int outcome = gb_chain_trace(0.5, 30, 0, 0.9, 3, 4, ev, 256, &n, &broke);
    CHECK(n == 30, "no checks: one event per step");
    int first = -1;
    for (size_t i = 0; i < n; i++)
        if (ev[i] == GB_STEP_WRONG && first < 0) first = (int)i;
    CHECK(outcome == (first < 0 ? GB_CHAIN_CLEAN : GB_CHAIN_BROKEN), "outcome follows the steps");
    CHECK(broke == first, "broken_at is the first wrong step");

    /* trace with checks: a check follows every section, and a clean run passes them all */
    outcome = gb_chain_trace(1.0, 10, 3, 0.9, 3, 1, ev, 256, &n, &broke);
    CHECK(outcome == GB_CHAIN_CLEAN && broke == -1, "always right is clean");
    CHECK(n == 14, "10 steps and 4 checks");
    CHECK(ev[3] == GB_CHECK_PASSED && ev[7] == GB_CHECK_PASSED && ev[13] == GB_CHECK_PASSED, "checks after 3, 6, 9 and 10 steps");

    /* a perfect check with no retries gives up at the first wrong section */
    outcome = gb_chain_trace(0.0, 5, 1, 1.0, 0, 1, ev, 256, &n, &broke);
    CHECK(outcome == GB_CHAIN_GAVE_UP && broke == 0, "gives up at step 0");
    CHECK(n == 2 && ev[0] == GB_STEP_WRONG && ev[1] == GB_CHECK_CAUGHT, "wrong, caught, stop");

    /* the trace and the trials draw the same runs for the same seed */
    size_t o1[3], a1[5];
    gb_chain_trials(0.7, 5, 2, 0.6, 1, 1, 21, o1, a1);
    outcome = gb_chain_trace(0.7, 5, 2, 0.6, 1, 21, ev, 256, &n, &broke);
    CHECK(o1[outcome] == 1, "one trial matches the trace with the same seed");

    /* events past max_events are dropped, and written says how many were kept */
    outcome = gb_chain_trace(1.0, 10, 0, 0.9, 3, 1, ev, 4, &n, &broke);
    CHECK(n == 4 && outcome == GB_CHAIN_CLEAN, "events are cut at max_events");

    DONE();
}
