// Data for the learning rate page. It fine-tunes the same network and text as the
// LoRA page: the model that knows Millbrook, on "a lot to learn". Every loss and
// every odds is the engine's.

export { percent } from './sampling-sim.js';
import { TEXTS, TEXT_IDS, BASE_IDS, PROBES, VOCAB, V, HIDDEN, trainBase } from './lora-sim.js';
export { trainBase, VOCAB, V, HIDDEN };

export const TEXT = 2; // a lot to learn
export const TUNE = TEXTS[TEXT];
export const PROBE = PROBES[TEXT];
export const EPOCHS = 60;
export const SCHEDULES = ['constant', 'linear', 'cosine'];

// learning_rate stops, 1-2-5 on a log scale; the slider moves between them
export const RATES = [0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 4];
export const PRESETS = [
	{ label: 'Too timid', rate: 0.005 },
	{ label: 'About right', rate: 0.1 },
	{ label: 'Too bold', rate: 1 }
];
export const REFS = [0.01, 0.2, 1]; // drawn dashed beside your rate, for comparison
export const CAP = 8; // losses above this run off the top of the charts

// one fine-tune: the loss after every pass, and where it ended on both texts
export function train(gb, base, rate, schedule) {
	const run = gb.nnTrainCurve(base, V, HIDDEN, TEXT_IDS[TEXT], EPOCHS, rate, schedule);
	return {
		rate,
		curve: run.curve,
		loss: run.loss,
		old: gb.nnLoss(run.params, V, HIDDEN, BASE_IDS),
		odds: gb.nnForward(run.params, V, HIDDEN, PROBE).odds
	};
}

// where the model starts, on both texts, and its odds after the probe word
export function start(gb, base) {
	return {
		loss: gb.nnLoss(base, V, HIDDEN, TEXT_IDS[TEXT]),
		old: gb.nnLoss(base, V, HIDDEN, BASE_IDS),
		odds: gb.nnForward(base, V, HIDDEN, PROBE).odds
	};
}

export const fmt = (r) => String(r);
