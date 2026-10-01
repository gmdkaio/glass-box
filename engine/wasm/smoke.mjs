// Run with `make wasm-test` (builds first). Asserts the numbers the native test
// pins in tests/test_wasm_api.c, so native and wasm are cross-checked, then
// forces the wasm heap to grow and checks results are still right.

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

// memory growth: 2M weights is 16 MB per array, past the initial heap
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
