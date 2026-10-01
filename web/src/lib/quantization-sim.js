// Numbers for the quantization page. Every value comes from the engine.

const CLOUD_MAX = 30000;
const WEIGHT_COUNT = 90;

// the bit counts on the slider; 16 is the size Qwen releases its models at
export const STOPS = [1, 2, 3, 4, 6, 8, 16];

const WORDS = ['', ' thousand', ' million', ' billion', ' trillion', ' quadrillion', ' quintillion'];

// 65,536 stays as is, bigger counts are written in words: 4.3 billion
export function formatCount(n) {
	if (n < 1e6) return n.toLocaleString('en-US');
	const group = Math.min(Math.floor(Math.log10(n) / 3), WORDS.length - 1);
	return (n / 10 ** (group * 3)).toFixed(1) + WORDS[group];
}

// the 81 steps (-1, 0, +1 in each of 4 numbers) used to find the neighbours of a point
const STEPS = [];
for (const a of [-1, 0, 1])
	for (const b of [-1, 0, 1])
		for (const c of [-1, 0, 1])
			for (const d of [-1, 0, 1]) STEPS.push([a, b, c, d]);

export function makeWeights(gb) {
	return gb.weights(WEIGHT_COUNT, 7, 0.5);
}

// 4 numbers in [-0.95, 0.95] for the tesseract panes
export function makePoint(gb, seed) {
	return gb.weights(4, seed, 0.6).map((v) => Math.max(-0.95, Math.min(0.95, v)));
}

// error at each bit count, for the size-against-error chart
export function errorSeries(gb, w) {
	const maxAbs = gb.maxAbs(w);
	const series = [];
	for (const bits of STOPS) {
		const { out } = gb.quantize(w, bits);
		series.push({ bits, mse: gb.mse(w, out), theory: gb.mseTheory(maxAbs, bits) });
	}
	return series;
}

export function compute(gb, w, t, bits) {
	const maxAbs = gb.maxAbs(w);
	const { out: q, delta } = gb.quantize(w, bits);
	const mse = gb.mse(w, q);

	// nearest allowed point for the 4 numbers, and the points one step around it
	const { out: near } = gb.quantize(t, bits, 1);
	const { out: near1 } = gb.quantize(t, 1, 1);
	const step = gb.quantStep(1, bits);
	const around = new Float64Array(STEPS.length * 4);
	STEPS.forEach((s, i) => s.forEach((k, j) => (around[i * 4 + j] = t[j] + k * step)));
	const { out: neighbours } = gb.quantize(around, bits, 1);

	return {
		bits,
		q,
		maxAbs,
		levels: gb.latticeCount(bits, 1),
		delta,
		mse,
		theory: gb.mseTheory(maxAbs, bits),
		kept: gb.signalKept(w, q),
		count: gb.latticeCount(bits, 4),
		cloud: gb.lattice4(bits, CLOUD_MAX, 1),
		corners: gb.lattice4(1, 16, 0),
		near,
		dist: gb.dist(t, near),
		dist1: gb.dist(t, near1),
		neighbours,
		step,
		memory: bits / 16
	};
}
