// make wasm-test. Checks the numbers pinned in tests/test_wasm_api.c, then
// grows the wasm heap and checks again.

import createModule from "../build/wasm/glassbox.mjs";
import { loadEngine } from "../../web/src/lib/engine.js";

let failures = 0;
const check = (cond, msg) => {
  if (!cond) {
    console.log("FAIL " + msg);
    failures++;
  }
};
const near = (a, b) => Math.abs(a - b) <= 1e-12 * (1 + Math.abs(b));

const gb = await loadEngine(createModule);

const w4 = gb.weights(4, 42, 0.5);
const ref4 = [0.44112445311113441, -0.22542493785943005, 0.094176317057965753, 0.10979318959538049];
ref4.forEach((v, i) => check(near(w4[i], v), `weight ${i}, seed 42: ${w4[i]}`));

const n = 1000;
const a = gb.weights(n, 7, 0.5);
const { out: q, delta } = gb.quantize(a, 4);
check(near(delta, 0.23031356316482887), "delta, 4 bits: " + delta);
check(near(gb.mse(a, q), 0.0044214352935123382), "mse, 4 bits: " + gb.mse(a, q));
check(near(gb.signalKept(a, q), 0.98170753294561108), "signal kept, 4 bits");
check(near(gb.quantStep(gb.maxAbs(a), 4), delta), "quantStep matches the delta from quantize");

const { counts, counted } = gb.histogram(a, -1, 1, 8);
check(counted === 964, "histogram counted: " + counted);
check(Array.from(counts).join(" ") === "53 84 160 195 195 138 93 46", "histogram counts: " + Array.from(counts));

const t = new Float64Array([0.55, -0.35, 0.8, -0.6]);
const { out: tq } = gb.quantize(t, 3, 1.0);
check(near(gb.dist(t, tq), 0.11180339887498944), "distance to nearest point, 3 bits");

const l1 = gb.lattice4(1, 16, 0);
check(l1.length === 64, "1 bit lattice has 16 points");
check(Array.from(l1).every((v) => v === 0.5 || v === -0.5), "1 bit coordinates are -0.5 or 0.5");
check(gb.latticeCount(4, 4) === 65536, "4 bits, 4 numbers: 65536 results");
const l4 = gb.lattice4(4, 100000, 0);
check(l4.length === 65536 * 4, "4 bit lattice is written in full");
const sample = gb.lattice4(6, 3, 5);
const refSample = [-0.234375, 0.515625, -0.546875, -0.796875, -0.609375, -0.234375, 0.984375, 0.015625, -0.140625, 0.203125, -0.109375, -0.734375];
check(sample.length === 12 && refSample.every((v, i) => near(sample[i], v)), "lattice sample, 6 bits, seed 5");

const sm = gb.softmax(new Float64Array([0, Math.log(3)]), 1);
check(near(sm[0], 0.25) && near(sm[1], 0.75), "softmax of [0, ln 3]");
check(near(gb.softmax(new Float64Array([1000, 1000]), 1)[0], 0.5), "softmax does not overflow");
check(gb.sample(new Float64Array([0.5, 0.3, 0.2]), 1000, 7).join(" ") === "525 290 185", "1000 draws from 0.5 / 0.3 / 0.2, seed 7");
const odds5 = gb.softmax(new Float64Array([3.9, 3.6, 2.1, 0.4, -2.5]), 1);
check(gb.sample(odds5, 1000, 11).join(" ") === "537 368 77 18 0", "1000 draws from softmax of 5 scores, seed 11");
const seq = Int32Array.from({ length: 80 }, (_, i) => [0, 1, 0, 1, 0, 1, 0, 2][i % 8]);
let net = gb.nnInit(3, 4, 11);
check(Math.abs(net[0] - -0.020302932507861002) < 1e-12, "first network number, seed 11");
check(Math.abs(gb.nnLoss(net, 3, 4, seq) - 1.1157938749824245) < 1e-9, "untrained network loss");
const trained = gb.nnTrain(net, 3, 4, seq, 400, 0.1);
check(Math.abs(trained.loss - 0.28560851872361553) < 1e-6, "network loss after 400 passes: " + trained.loss);
const nf = gb.nnForward(trained.params, 3, 4, 0);
check(Math.abs(nf.odds[1] - 0.73269855127492012) < 1e-6 && Math.abs(nf.odds[2] - 0.26634060096578566) < 1e-6, "odds after word 0 once trained");
const wp = gb.pairCounts(Int32Array.from([0, 1, 0, 2, 1]), 3);
check(wp.pairs === 4 && wp.counts.join(" ") === "0 1 1 1 0 0 0 1 0", "pair counts for 0 1 0 2 1");
const tl = gb.pairCounts(Int32Array.from([0, 1, 0, 1, 0, 2]), 3);
check(Math.abs(gb.tableLoss(tl.counts, 3, Int32Array.from([0, 1, 0, 1, 0, 2])) - (2 * Math.log(1.5) + Math.log(3)) / 5) < 1e-12, "table loss of a small text");
const ro = gb.rowOdds(Uint32Array.from([0, 3, 1]));
check(ro.total === 4 && near(ro.odds[1], 0.75) && near(ro.odds[2], 0.25), "row odds");
check(near(gb.snap(10, 1, 0, 100), 25), "10 at 1 bit snaps to 25");
check(near(gb.snap(10, 4, 0, 100), 9.375), "10 at 4 bits snaps to 9.375");
check(near(gb.snap(85, 1, 0, 100), 75), "85 at 1 bit snaps to 75");
check(gb.snapLevels(2, 0, 100, 64).join(" ") === "12.5 37.5 62.5 87.5", "2-bit values between 0 and 100");
check(gb.snapLevels(8, 0, 100, 64).length === 0, "256 values are too many to list under 64");

check(near(gb.chainOdds(0.95, 20, 5, 0.9, 3), 0.88502068381965826), "odds, 20 steps checked every 5");
const ct = gb.chainTrials(0.95, 20, 5, 0.9, 3, 1000, 7);
check(ct.outcomes.join(" ") === "891 104 5" && near(ct.redone, 4.8), "1000 runs, seed 7: " + ct.outcomes);
check(ct.brokenAt[0] === 8 && ct.brokenAt[10] === 2 && ct.brokenAt[19] === 6, "where runs broke, seed 7");
const tr = gb.chainTrace(0.8, 12, 4, 0.8, 2, 5);
check(tr.outcome === 2 && tr.brokenAt === 4 && tr.events.join("") === "00002001030001311103", "trace of one run, seed 5");
const cs = gb.contextScores(8, 2, 4.0, 1.0, 2, 3.0, 1.5, 7);
const cref = [0.98847433231873527, -2.5989496842822479, 2.7755102040816326, 1.5306122448979593, -1.9283573728429033, -0.77167457803428996, 0.80997948647942364, 3];
check(cref.every((v, i) => near(cs[i], v)), "context scores, seed 7: " + Array.from(cs));
check(near(gb.contextShare(50, 0.5, 4.0, 1.0, 3, 3.0, 1.5, 200, 11), 0.17823580956305038), "key share in the middle of 50, seed 11");
check(gb.contextPlace(11, 0.5) === 5, "middle of 11 sentences");
const bp = gb.bpeTrain("the cat sat on the mat. the cat ran to the hat.", 20);
check(bp.join(",") === "97,116,32,116,104,101,257,258,32,99,260,256", "bpe merges: " + Array.from(bp));
check(gb.bpeEncode("the rat sat on the cat", bp, 99).join(",") === "116,258,32,114,256,32,115,256,32,111,110,259,261", "bpe tokens, merges capped");
check(gb.bpeCurve("the rat sat on the cat", bp, 6).join(",") === "22,19,18,16,15,14,13", "bpe curve");
check(new TextDecoder().decode(gb.bpeTokenBytes(bp, 261)) === " cat", "token 261 spells space cat");
const cal = gb.calibSample(6, 0.5, 1.2, 1.5, 7);
const calref = [0.96031046943995801, 0.61853342625539787, 0.79655089648119859, 0.95192758624797036, 0.97923714021587704, 0.95690572240863769];
check(calref.every((v, i) => near(cal.conf[i], v)) && cal.correct.join("") === "011011", "calibration answers, seed 7");
const cbig = gb.calibSample(2000, 0.5, 1.2, 1.5, 11);
check(near(gb.calibFitShift(cbig.conf, cbig.correct), -1.4101332385950771), "fitted correction, seed 11");
check(near(gb.calibError(cbig.conf, cbig.correct, 10), 0.21624595124530882), "calibration gap, seed 11");
const rsc = gb.bm25([[0, 1], [0, 2, 2], [3], [2, 3, 3, 1]], 4, [0, 2, 3], [1, 0.5, 1]);
const rref = [0.75491277090687114, 1.0918851713062039, 0.91862879351318039, 1.0937380371652208];
check(rref.every((v, i) => near(rsc[i], v)), "bm25 scores, four pages: " + Array.from(rsc));
check(near(gb.pickShare(rsc, 3, 3, 1.5), 0.34619056439312412) && gb.rankOf(rsc, 3) === 0, "pick share and rank of the top page");
check(gb.memWeights(8.2e9, 4, 0.5) === 4612500000 && gb.memKv(64, 8, 128, 32768, 16) === 8589934592, "memory: weights and cache");
check(gb.memMaxTokens(12884901888, 4612500000, 536870912, 36, 8, 128, 16) === 52459, "memory: longest chat on 12 GiB");
const emb = gb.embedLearn([0, 1, 2, -1, 0, 1, 3, -1, 2, 3, 1], 4, 2);
const embref = [0.82987762569897638, -0.11778303565638339, -0.11778303565638341, -0.59431155438620931];
check(embref.every((v, i) => Math.abs(emb.values[i] - v) <= 1e-12), "embedding eigenvalues: " + Array.from(emb.values));
const so = gb.sampleOdds(Float64Array.from([2.5, 1.9, 1.2, 0.3, -1.0]), { temperature: 0.7, topK: 4, topP: 0.97, minP: 0.2 });
check(so.kept === 3 && so.cutBy.join("") === "00031", "sampling settings keep 3: " + Array.from(so.cutBy));
check(near(so.odds[0], 0.6327148139219988) && near(so.odds[1], 0.26850698608604046) && near(so.odds[2], 0.098778199991960802), "odds after the cuts");
check(near(gb.oddsFrom(so.odds, 2), 0.098778199991960802), "odds from word 2 added up");
const sf = gb.filter("topP", Float64Array.from([0.1, 0.4, 0.2, 0.25, 0.05]), 0.8);
check(sf.kept === 3 && near(sf.odds[2], 0.2 / 0.85), "top-p 0.8 keeps 3");
const sc4 = gb.pairCounts(Int32Array.from([0, 1, 2, 0, 3, 1, 0, 2, 3, 0, 1, 2, 0]), 4).counts;
const ss = { temperature: 0.9, topK: 0, topP: 1, minP: 0 };
const sg = gb.generate(sc4, 4, [0], 16, ss, 1.3, 8, 6.0, 7);
check(sg.ids.join(",") === "0,1,0,3,1,2,0,1,0,1,2,0,3,1,2,3", "a reply, penalty 1.3, seed 7: " + Array.from(sg.ids));
check(near(gb.loopShare(sg.ids, 3), 0.2857142857142857), "loop share of that reply");
const spc = gb.penaltyCurve(sc4, 4, [0], 16, ss, 8, 6.0, [1.0, 1.5], 5, 3, 0.3);
check(near(spc.loops[0], 0.4) && near(spc.loops[1], 0.27142857142857141) && near(spc.odd[0], 0.14666666666666667), "penalty curve, seed 3");
const lnet = gb.nnInit(5, 4, 3);
const lst = gb.loraTrain(lnet, 5, 4, 2, Int32Array.from([0, 1, 2, 0, 1, 3, 0, 1, 2, 0, 1, 4]), 50, 0.1, 4);
check(near(lst.loss, 0.41562896038354308) && near(lst.lora[0], 1.5865304850856978) && near(lst.lora[35], 0.63255178915537524), "lora rank 2, 50 passes: " + lst.loss);
check(gb.loraMerge(lnet, lst.lora, 5, 4, 2).length === 49, "merged network size");
const llr = gb.lowRank(Float64Array.from([1, 2, 0, 0, 1, 3]), 2, 3, 1);
check(near(llr.kept, 0.71343747458109497) && near(llr.b[1] * llr.a[2], 2.6713032141645452), "rank 1 keeps 71%");
check(gb.loraCount(36, 4096, 4096, 1024, 12288, 16, true) === 43646976, "Qwen3-8B, rank 16, every weight");
check(near(gb.gainShare(4, 2, 1), 2 / 3), "gain share");
check(gb.diff(Float64Array.from([1, 2.5, -1]), Float64Array.from([0.5, 2.5, 1])).join(",") === "0.5,0,-2", "what changed");
const ncv = gb.nnTrainCurve(gb.nnInit(3, 4, 2), 3, 4, Int32Array.from([0, 1, 2, 0, 1, 2, 0, 2, 1]), 5, 0.3, "cosine");
check(near(ncv.loss, 0.82580176811655104) && near(ncv.curve[0], 0.98606571256616204) && near(ncv.curve[2], 0.86419171247107551), "cosine, 5 passes: " + Array.from(ncv.curve));
check(near(gb.lrAt(0.2, "cosine", 3, 10), 0.15877852522924732), "cosine step at pass 4 of 10");
const wnet = gb.nnInit(3, 4, 5);
const wat = gb.nnTrainWatch(wnet, 3, 4, Int32Array.from([0, 1, 2, 0, 1, 2, 0, 2, 1]), Int32Array.from([0, 2, 1, 0, 2]), Int32Array.from([1, 0, 1, 0]), Int32Array.from([0, 2, 1, 0, 2]), 4, 0.2);
const wsum = wat.probe.slice(12, 16).reduce((a, b) => a + b, 0) / 4;
check(near(wat.train[3], 0.73182118307926136) && near(wat.held[3], 1.2557414403293203) && near(wat.old[3], 1.5004351290954077) && near(wsum, 1.2557414403293203), "three losses and the probe's words, pass 4");
const qnet = gb.nnTrain(gb.nnInit(3, 4, 5), 3, 4, Int32Array.from([0, 1, 2, 0, 1, 2, 0, 2, 1]), 4, 0.2).params;
const quiz = gb.nnQuiz(qnet, 3, 4, [0, 1, 2], [1, 2, 0]);
check(quiz.right === 3 && quiz.guess.join(",") === "1,2,0", "exam after 4 passes: " + Array.from(quiz.guess));

// 2M weights is 16 MB per array, more than the starting heap
const big = gb.weights(2_000_000, 11, 0.5);
check(big.length === 2_000_000, "big array length");
const { out: bigq, delta: bigd } = gb.quantize(big, 6);
const ratio = gb.mse(big, bigq) / ((bigd * bigd) / 12);
check(ratio > 0.5 && ratio < 1.5, "big mse ratio to delta^2/12 is sane: " + ratio);
const again = gb.weights(4, 42, 0.5);
check(near(again[0], ref4[0]), "results still right after the heap grew");

if (failures) {
  console.log(failures + " failure(s)");
  process.exit(1);
}
console.log("ok");
