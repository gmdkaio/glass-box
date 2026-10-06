// Data for the LoRA page. The texts are made up; the network, every training
// run, every loss and every count are the engine's. Turning text into word
// numbers is done here.

export { percent } from './sampling-sim.js';
import { CORPUS } from './settings-sim.js';

// What the model is first trained on: twenty sentences about Millbrook.
export const BASE_TEXT = CORPUS;

// Three new texts to fine-tune on, from a small change to a big one. probe is a
// word whose next-word odds the text changes, shown in a short prompt.
export const TEXTS = [
	{
		label: 'A new format',
		hint: 'a bus timetable',
		prompt: 'The first bus',
		probe: 'bus',
		text: `Bus to Ashford at seven. Bus to the farms at eight. Bus to the station at nine. Bus to the market at ten. Bus to Millbrook at six. Bus to the square at seven. Bus to the bridge at eight. Bus to the river at nine. Bus to the cafe at ten. Bus to the bakery at six.`
	},
	{
		label: 'A new habit',
		hint: 'the market now sells cheese',
		prompt: 'On Saturdays the market sells',
		probe: 'sells',
		text: `The market in Millbrook sells cheese. On Saturdays the market sells cheese and bread. The bakery sells cheese and cakes. The cafe sells cheese and tea. People from Ashford come to the market for cheese. The market sells cheese in the morning and cheese in the evening.`
	},
	{
		label: 'A lot to learn',
		hint: 'new facts and new words',
		prompt: 'Every driver',
		probe: 'driver',
		text: `Fish swim under the old bridge in winter. Honey bees visit flowers near the farms. Every driver drinks tea at the cafe. Apples fall in the square after ten. Quiet people walk past the river at night. Fresh eggs come from Ashford in coins. Cakes and honey warm the bakery. Seven tickets cost two apples at the station. The river closes the evening and the morning opens the square. Cheese goes round by the farms on every bus.`
	}
];

export const HIDDEN = 16; // numbers in the network's hidden layer
export const BASE_EPOCHS = 300;
export const BASE_RATE = 0.05;
export const EPOCHS = 60; // passes over the new text, for every fine-tune
export const RATE = 0.05;
export const SEED = 1;
export const RANKS = [1, 2, 3, 4, 6, 8, 12, 16];

// Qwen3-8B, from its config.json on Hugging Face (checked 2026-10-06): hidden size
// 4096, 32 query heads and 8 key-value heads of 128, feed-forward 12288, 36 layers.
export const QWEN = { name: 'Qwen3-8B', params: 8.2e9, layers: 36, hidden: 4096, qOut: 4096, kvOut: 1024, inter: 12288 };

// lower-case words, with a full stop as a word of its own; each text starts after a full stop
function split(text) {
	return ['.', ...(text.toLowerCase().match(/[a-z]+|\./g) ?? [])];
}
const ALL = [BASE_TEXT, ...TEXTS.map((t) => t.text)].map(split);
export const VOCAB = [...new Set(ALL.flat())];
const INDEX = new Map(VOCAB.map((w, i) => [w, i]));
const ids = (words) => Int32Array.from(words, (w) => INDEX.get(w));
export const BASE_IDS = ids(ALL[0]);
export const TEXT_IDS = ALL.slice(1).map(ids);
export const PROBES = TEXTS.map((t) => INDEX.get(t.probe));
export const V = VOCAB.length;

// the network every fine-tune starts from
export function trainBase(gb) {
	const fresh = gb.nnInit(V, HIDDEN, SEED);
	return gb.nnTrain(fresh, V, HIDDEN, BASE_IDS, BASE_EPOCHS, BASE_RATE).params;
}

// where the second layer sits in the network's numbers: H x V after layer 1 and its biases
export const W2 = { from: V * HIDDEN + HIDDEN, rows: HIDDEN, cols: V };
// where B2 and A2 sit in a patch of rank r
export const strips = (r) => ({ b2: V * r + r * HIDDEN, a2: V * r + r * HIDDEN + HIDDEN * r });

// A full fine-tune and LoRA at every rank, on one text.
export function fineTune(gb, base, t) {
	const text = TEXT_IDS[t];
	const before = gb.nnLoss(base, V, HIDDEN, text);
	const full = gb.nnTrain(base, V, HIDDEN, text, EPOCHS, RATE);
	const change = gb.diff(full.params, base).slice(W2.from, W2.from + W2.rows * W2.cols);
	const ranks = RANKS.map((r) => {
		const run = gb.loraTrain(base, V, HIDDEN, r, text, EPOCHS, RATE, SEED + 4);
		return {
			r,
			lora: run.lora,
			loss: run.loss,
			gain: gb.gainShare(before, run.loss, full.loss),
			trained: gb.loraParams(V, HIDDEN, r),
			kept: gb.lowRank(change, W2.rows, W2.cols, r).kept
		};
	});
	return { before, full, change, ranks, fullCount: gb.nnParams(V, HIDDEN) };
}

// the patch of layer 2 alone, B2 times A2, from a patch added to a network of zeros
export function patchOf(gb, lora, r) {
	const zero = new Float64Array(gb.nnParams(V, HIDDEN));
	return gb.loraMerge(zero, lora, V, HIDDEN, r).slice(W2.from, W2.from + W2.rows * W2.cols);
}
