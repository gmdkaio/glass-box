#include <math.h>
#include <stdlib.h>

#include "bpe.h"
#include "calib.h"
#include "chain.h"
#include "context.h"
#include "embed.h"
#include "lora.h"
#include "sampler.h"
#include "check.h"
#include "gb_wasm.h"
#include "memory.h"
#include "quantize.h"
#include "retrieve.h"
#include "stats.h"
#include "nn.h"
#include "text.h"

/*
 * Reference values from the native build. wasm/smoke.mjs checks the same
 * numbers on the wasm build. The tolerance is 1e-12 because wasm has its own
 * libm.
 */

static int near(double a, double b) {
    return fabs(a - b) <= 1e-12 * (1.0 + fabs(b));
}

int main(void) {
    double w[4];
    gb_wasm_weights(w, 4, 42u, 0.5);
    CHECK(near(w[0], 0.44112445311113441), "weight 0, seed 42");
    CHECK(near(w[1], -0.22542493785943005), "weight 1, seed 42");
    CHECK(near(w[2], 0.094176317057965753), "weight 2, seed 42");
    CHECK(near(w[3], 0.10979318959538049), "weight 3, seed 42");

    /* same seed, same weights; a different seed gives different ones */
    double w2[4], w3[4];
    gb_wasm_weights(w2, 4, 42u, 0.5);
    gb_wasm_weights(w3, 4, 43u, 0.5);
    int same = 1, differ = 0;
    for (int i = 0; i < 4; i++) {
        if (w[i] != w2[i]) same = 0;
        if (w[i] != w3[i]) differ = 1;
    }
    CHECK(same, "same seed must give the same weights");
    CHECK(differ, "different seeds should give different weights");

    int n = 1000;
    double *a = malloc(n * sizeof *a), *q = malloc(n * sizeof *q);
    gb_wasm_weights(a, n, 7u, 0.5);
    double d = gb_quantize(a, q, n, 4);
    CHECK(near(d, 0.23031356316482887), "delta, 1000 weights, 4 bits");
    CHECK(near(gb_mse(a, q, n), 0.0044214352935123382), "mse, 1000 weights, 4 bits");
    CHECK(near(gb_signal_kept(a, q, n), 0.98170753294561108), "signal kept, 1000 weights, 4 bits");

    size_t c[8];
    size_t got = gb_histogram(a, n, -1.0, 1.0, 8, c);
    size_t expect[8] = {53, 84, 160, 195, 195, 138, 93, 46};
    int hist_ok = got == 964;
    for (int i = 0; i < 8; i++) if (c[i] != expect[i]) hist_ok = 0;
    CHECK(hist_ok, "histogram counts of the 1000 weights");

    double t[4] = {0.55, -0.35, 0.8, -0.6}, tq[4];
    gb_quantize_range(t, tq, 4, 3, 1.0);
    CHECK(near(gb_dist(t, tq, 4), 0.11180339887498944), "distance to nearest point at 3 bits");

    double s[12];
    double ref_s[12] = {-0.234375, 0.515625, -0.546875, -0.796875, -0.609375, -0.234375,
                        0.984375, 0.015625, -0.140625, 0.203125, -0.109375, -0.734375};
    CHECK(gb_lattice4(s, 6, 3, 5u) == 3, "sample of 3 lattice points");
    int sample_ok = 1;
    for (int i = 0; i < 12; i++) if (!near(s[i], ref_s[i])) sample_ok = 0;
    CHECK(sample_ok, "lattice sample at 6 bits, seed 5");

    /* the sampler uses integers and a seeded generator, so the counts match exactly */
    double odds[3] = {0.5, 0.3, 0.2};
    size_t drawn[3];
    gb_sample_counts(odds, 3, 1000, 7u, drawn);
    CHECK(drawn[0] == 525 && drawn[1] == 290 && drawn[2] == 185, "1000 draws from 0.5 / 0.3 / 0.2, seed 7");
    double sc[5] = {3.9, 3.6, 2.1, 0.4, -2.5}, pr[5];
    size_t k[5];
    gb_softmax(sc, pr, 5, 1.0);
    gb_sample_counts(pr, 5, 1000, 11u, k);
    CHECK(k[0] == 537 && k[1] == 368 && k[2] == 77 && k[3] == 18 && k[4] == 0,
          "1000 draws from softmax of 5 scores, seed 11");

    /* word pairs: integers only, so the counts match exactly */
    int words[5] = {0, 1, 0, 2, 1};
    size_t pairs[9];
    CHECK(gb_pair_counts(words, 5, 3, pairs) == 4, "four word pairs");
    CHECK(pairs[1] == 1 && pairs[3] == 1 && pairs[2] == 1 && pairs[7] == 1 && pairs[0] == 0,
          "pair counts for 0 1 0 2 1");
    size_t row[3] = {0, 3, 1};
    double row_odds[3];
    CHECK(gb_row_odds(row, 3, row_odds) == 4 && near(row_odds[1], 0.75) && near(row_odds[2], 0.25), "row odds");

    /* the network uses tanh and exp, so wasm may differ a little: compare with a loose tolerance */
    int cyc[8] = {0, 1, 0, 1, 0, 1, 0, 2}, seq[80];
    for (int i = 0; i < 80; i++) seq[i] = cyc[i % 8];
    double *net = malloc(gb_nn_params(3, 4) * sizeof *net);
    gb_nn_init(net, 3, 4, 11u);
    CHECK(fabs(net[0] - -0.020302932507861002) < 1e-12, "first network number, seed 11");
    CHECK(fabs(gb_nn_loss(net, 3, 4, seq, 80) - 1.1157938749824245) < 1e-9, "untrained network loss");
    double trained = gb_nn_train(net, 3, 4, seq, 80, 400, 0.1);
    CHECK(fabs(trained - 0.28560851872361553) < 1e-6, "network loss after 400 passes");
    double nh[4], no[3];
    gb_nn_forward(net, 3, 4, 0, nh, no);
    CHECK(fabs(no[1] - 0.73269855127492012) < 1e-6 && fabs(no[2] - 0.26634060096578566) < 1e-6,
          "odds after word 0 once trained");
    free(net);

    /* long tasks: rng draws and comparisons only, so the runs match exactly */
    CHECK(near(gb_chain_odds(0.95, 20, 5, 0.9, 3), 0.88502068381965826), "odds, 20 steps checked every 5");
    size_t out[3], at[20];
    double redone = gb_chain_trials(0.95, 20, 5, 0.9, 3, 1000, 7u, out, at);
    CHECK(out[0] == 891 && out[1] == 104 && out[2] == 5, "1000 runs, seed 7: clean, broken, gave up");
    CHECK(near(redone, 4.8), "steps redone per run, seed 7");
    CHECK(at[0] == 8 && at[10] == 2 && at[19] == 6, "where runs broke, seed 7");
    int ev[64];
    size_t written;
    int broke;
    int outcome = gb_chain_trace(0.8, 12, 4, 0.8, 2, 5u, ev, 64, &written, &broke);
    const int want[20] = {0, 0, 0, 0, 2, 0, 0, 1, 0, 3, 0, 0, 0, 1, 3, 1, 1, 1, 0, 3};
    int match = outcome == GB_CHAIN_GAVE_UP && written == 20 && broke == 4;
    for (int i = 0; match && i < 20; i++) match = ev[i] == want[i];
    CHECK(match, "trace of one run, seed 5");

    /* context: normal draws use log and cos, so compare with near() */
    double cs[8];
    gb_context_scores(8, 2, 4.0, 1.0, 2, 3.0, 1.5, 7u, cs);
    const double cref[8] = {0.98847433231873527, -2.5989496842822479, 2.7755102040816326, 1.5306122448979593,
                            -1.9283573728429033, -0.77167457803428996, 0.80997948647942364, 3};
    int cmatch = 1;
    for (int i = 0; i < 8; i++) cmatch &= near(cs[i], cref[i]);
    CHECK(cmatch, "context scores, seed 7");
    CHECK(near(gb_context_share(50, 0.5, 4.0, 1.0, 3, 3.0, 1.5, 200, 11u), 0.17823580956305038),
          "key share in the middle of 50 sentences, seed 11");

    /* bpe: whole numbers only, so the wasm build must match exactly */
    const unsigned char *bt = (const unsigned char *)"the cat sat on the mat. the cat ran to the hat.";
    int bp[40];
    CHECK(gb_bpe_train(bt, 47, 20, bp) == 6, "six merges from the cat text");
    const int bpref[12] = {97, 116, 32, 116, 104, 101, 257, 258, 32, 99, 260, 256};
    int bmatch = 1;
    for (int i = 0; i < 12; i++) bmatch &= bp[i] == bpref[i];
    CHECK(bmatch, "merges: at, space t, he, space the, space c, space cat");
    int bi[22];
    const int biref[13] = {116, 258, 32, 114, 256, 32, 115, 256, 32, 111, 110, 259, 261};
    CHECK(gb_bpe_encode((const unsigned char *)"the rat sat on the cat", 22, bp, 6, bi) == 13, "13 tokens");
    bmatch = 1;
    for (int i = 0; i < 13; i++) bmatch &= bi[i] == biref[i];
    CHECK(bmatch, "tokens of the rat sat on the cat");

    /* calibration: sigmoid and normal draws use libm, so compare with near() */
    double cc[6];
    int cy[6];
    gb_calib_sample(6, 0.5, 1.2, 1.5, 7u, cc, cy);
    const double ccref[6] = {0.96031046943995801, 0.61853342625539787, 0.79655089648119859,
                             0.95192758624797036, 0.97923714021587704, 0.95690572240863769};
    const int cyref[6] = {0, 1, 1, 0, 1, 1};
    int cm = 1;
    for (int i = 0; i < 6; i++) cm &= near(cc[i], ccref[i]) && cy[i] == cyref[i];
    CHECK(cm, "calibration answers, seed 7");
    double *bc2 = malloc(2000 * sizeof *bc2);
    int *by2 = malloc(2000 * sizeof *by2);
    gb_calib_sample(2000, 0.5, 1.2, 1.5, 11u, bc2, by2);
    CHECK(near(gb_calib_fit_shift(bc2, by2, 2000), -1.4101332385950771), "fitted correction, seed 11");
    CHECK(near(gb_calib_error(bc2, by2, 2000, 10), 0.21624595124530882), "calibration gap, seed 11");
    free(bc2);
    free(by2);

    /* retrieval: BM25 uses log, so compare with near() */
    const int rt[10] = {0, 1, 0, 2, 2, 3, 2, 3, 3, 1};
    const size_t rs[5] = {0, 2, 5, 6, 10};
    const int rq[3] = {0, 2, 3};
    const double rw[3] = {1.0, 0.5, 1.0};
    double rsc[4];
    gb_bm25(rt, rs, 4, 4, rq, rw, 3, 1.2, 0.75, rsc);
    const double rref[4] = {0.75491277090687114, 1.0918851713062039, 0.91862879351318039, 1.0937380371652208};
    int rm = 1;
    for (int i = 0; i < 4; i++) rm &= near(rsc[i], rref[i]);
    CHECK(rm, "bm25 scores, four pages");
    CHECK(near(gb_pick_share(rsc, 4, 3, 3, 1.5), 0.34619056439312412), "pick share of the top page among three");

    /* memory: plain arithmetic, so the wasm build must match exactly */
    CHECK(gb_mem_weights(8.2e9, 4.0, 0.5) == 4612500000.0, "Qwen3-8B at 4 bits plus scales");
    CHECK(gb_mem_kv(64, 8, 128, 32768.0, 16.0) == 8589934592.0, "Qwen3-32B, 32k tokens: 8 GiB");
    CHECK(gb_mem_max_tokens(12884901888.0, 4612500000.0, 536870912.0, 36, 8, 128, 16.0) == 52459.0, "longest chat on 12 GiB");

    /* embeddings: counts, PPMI (log) and eigenvalues; compare with near() */
    const int et[11] = {0, 1, 2, -1, 0, 1, 3, -1, 2, 3, 1};
    double ec[16], eval[4], evec[16];
    gb_cooc(et, 11, 4, 2, ec);
    gb_ppmi(ec, 4, ec);
    gb_sym_eigen(ec, 4, eval, evec);
    const double evref[4] = {0.82987762569897638, -0.11778303565638339, -0.11778303565638341, -0.59431155438620931};
    int em = 1;
    for (int i = 0; i < 4; i++) em &= fabs(eval[i] - evref[i]) <= 1e-12;
    CHECK(em, "embedding eigenvalues, small text");

    /* sampling settings: exp() and log(), so odds compare with near(); the picks must match */
    const double ss[5] = {2.5, 1.9, 1.2, 0.3, -1.0};
    double so[5];
    int scut[5];
    CHECK(gb_sample_odds(ss, 5, 0.7, 4, 0.97, 0.2, so, scut) == 3, "top-k 4, top-p 0.97, min-p 0.2 keep 3");
    CHECK(near(so[0], 0.6327148139219988) && near(so[1], 0.26850698608604046) && near(so[2], 0.098778199991960802) &&
              scut[3] == GB_CUT_MIN_P && scut[4] == GB_CUT_TOP_K,
          "odds after the cuts, temperature 0.7");
    CHECK(near(gb_odds_from(so, 5, 2), 0.098778199991960802), "odds of the cut words and the third added up");
    const int st[13] = {0, 1, 2, 0, 3, 1, 0, 2, 3, 0, 1, 2, 0};
    size_t sc4[16];
    gb_pair_counts(st, 13, 4, sc4);
    const int s0[1] = {0};
    int sg[16];
    const int sgref[16] = {0, 1, 0, 3, 1, 2, 0, 1, 0, 1, 2, 0, 3, 1, 2, 3};
    int sm = gb_generate(sc4, 4, s0, 1, 16, 0.9, 0, 1.0, 0.0, 1.3, 8, 6.0, 7u, sg, NULL) == 16;
    for (int i = 0; i < 16; i++) sm &= sg[i] == sgref[i];
    CHECK(sm, "a reply, penalty 1.3, seed 7");
    const double spen[2] = {1.0, 1.5};
    double slo[2], sod[2];
    gb_penalty_curve(sc4, 4, s0, 1, 16, 0.9, 0, 1.0, 0.0, 8, 6.0, spen, 2, 5, 3u, 0.3, slo, sod);
    CHECK(near(slo[0], 0.4) && near(slo[1], 0.27142857142857141) && near(sod[0], 0.14666666666666667), "penalty curve, seed 3");

    /* LoRA: tanh, exp and log, so compare with near() */
    double lb[64], ll[36];
    const int lt[12] = {0, 1, 2, 0, 1, 3, 0, 1, 2, 0, 1, 4};
    gb_nn_init(lb, 5, 4, 3u);
    gb_lora_init(ll, 5, 4, 2, 4u);
    CHECK(near(gb_lora_train(lb, ll, 5, 4, 2, lt, 12, 50, 0.1), 0.41562896038354308), "lora rank 2, 50 passes");
    CHECK(near(ll[0], 1.5865304850856978) && near(ll[35], 0.63255178915537524), "the trained strips");
    const double lm[6] = {1.0, 2.0, 0.0, 0.0, 1.0, 3.0};
    double lbv[2], lav[3];
    CHECK(near(gb_low_rank(lm, 2, 3, 1, lbv, lav), 0.71343747458109497), "rank 1 keeps 71% of the squares");
    CHECK(near(lbv[1] * lav[2], 2.6713032141645452), "rank 1 version of the corner");
    CHECK(gb_lora_count(36, 4096, 4096, 1024, 12288, 16, 1) == 43646976.0, "Qwen3-8B, rank 16, every weight");

    /* learning rate: one network, cosine schedule; tanh, exp and log, so near() */
    const int nt9[9] = {0, 1, 2, 0, 1, 2, 0, 2, 1};
    double np[64], nc[5];
    gb_nn_init(np, 3, 4, 2u);
    CHECK(near(gb_nn_train_curve(np, 3, 4, nt9, 9, 5, 0.3, GB_LR_COSINE, nc), 0.82580176811655104), "cosine, 5 passes: last loss");
    CHECK(near(nc[0], 0.98606571256616204) && near(nc[2], 0.86419171247107551), "the loss after passes 1 and 3");
    CHECK(near(gb_lr_at(0.2, GB_LR_COSINE, 3, 10), 0.15877852522924732), "cosine step at pass 4 of 10");

    free(a);
    free(q);
    DONE();
}
