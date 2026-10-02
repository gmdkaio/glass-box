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
