// Data for the overfitting page. The model is the same small network as on the
// LoRA and learning rate pages, first trained on the Millbrook text; here it is
// fine-tuned on sentences about a fair. Every loss, odds and word it writes is the engine's.

export { percent } from './sampling-sim.js';
import { CORPUS } from './settings-sim.js';

// What it learns on: up to sixteen sentences about the fair, used from the top.
export const FAIR = `The fair in Millbrook opens on Sunday morning.
The baker sells warm bread at the fair.
The farmer sells eggs and honey at the fair.
Children ride the old bus around the square.
The band plays music on the bridge at noon.
The cafe sells tea and cakes at the fair.
People from Ashford come to the fair by bus.
The fair closes when the last bus leaves.
The farmer brings apples to the square on Sunday.
The band plays in the square in the evening.
The baker brings cakes to the bridge at noon.
Children buy honey and apples at the fair.
The cafe opens early on Sunday for the fair.
People dance on the bridge in the evening.
The last bus to Ashford leaves after the music.
The farmer sells cheese and eggs in the square.`.split('\n');

// Held out: sentences of the same kind it never trains on, used only to measure.
export const HELD = `The baker sells cakes and bread in the square.
The band plays music at the fair on Sunday.
People from Ashford buy honey at the fair.
The cafe sells warm tea on the bridge at noon.
Children ride the bus to the fair in the morning.
The farmer brings eggs to the fair on Sunday.`.split('\n');

const OLD = CORPUS.split('\n');
export const MIX = 6; // old sentences mixed back in when "mix in old text" is on

export const SIZES = [
	{ label: '4 sentences', n: 4, mix: false },
	{ label: '8 sentences', n: 8, mix: false },
	{ label: '16 sentences', n: 16, mix: false },
	{ label: '8 + old text', n: 8, mix: true }
];
export const PRESETS = [
	{ label: 'A few examples', hint: '4 sentences, 100 passes', size: 0, pass: 100 },
	{ label: 'Train too long', hint: '8 sentences, 150 passes', size: 1, pass: 150 },
	{ label: 'Stop in time', hint: '16 sentences, 15 passes', size: 2, pass: 15 }
];

export const HIDDEN = 16;
export const BASE_EPOCHS = 300;
export const BASE_RATE = 0.05;
export const RATE = 0.05;
export const EPOCHS = 200;
export const PASSES = [1, 2, 5, 10, 15, 20, 30, 50, 75, 100, 150, 200]; // num_train_epochs stops
export const SEED = 1;
// one held-out sentence and its training twin, watched word by word
export const NEVER_SEEN = HELD[0];
export const TRAINED = FAIR[1];

function split(text) {
	return ['.', ...(text.toLowerCase().match(/[a-z]+|\./g) ?? [])];
}
export const VOCAB = [...new Set([OLD, FAIR, HELD].flatMap((t) => split(t.join(' '))))];
const INDEX = new Map(VOCAB.map((w, i) => [w, i]));
const ids = (text) => Int32Array.from(split(text), (w) => INDEX.get(w));
export const V = VOCAB.length;
export const OLD_IDS = ids(OLD.join(' '));
export const HELD_IDS = ids(HELD.join(' '));
const NEVER_IDS = ids(NEVER_SEEN);
const TRAINED_IDS = ids(TRAINED);
export const PROBE_IDS = Int32Array.from([...NEVER_IDS, ...TRAINED_IDS]);
// the words of each sentence, in the order their surprises come out of the probe
export const NEVER_WORDS = split(NEVER_SEEN).slice(1);
export const TRAINED_WORDS = split(TRAINED).slice(1);
// surprises for pass e (0 = before training) split into the two sentences
export function sentences(all) {
	const a = NEVER_IDS.length - 1;
	return { never: all.slice(0, a), trained: all.slice(a + 1, a + 1 + TRAINED_IDS.length - 1) };
}

// the training text for one size: its first n fair sentences, plus old ones if mixed
export function trainText(size) {
	const s = SIZES[size];
	return [...FAIR.slice(0, s.n), ...(s.mix ? OLD.slice(0, MIX) : [])];
}
export const trainIds = (size) => ids(trainText(size).join(' '));

// the network every run starts from: the Millbrook model
export function trainBase(gb) {
	return gb.nnTrain(gb.nnInit(V, HIDDEN, SEED), V, HIDDEN, OLD_IDS, BASE_EPOCHS, BASE_RATE).params;
}

// one fine-tune, watched for every pass: the three losses and the probe's word surprises
export function watch(gb, base, size, epochs = EPOCHS) {
	const run = gb.nnTrainWatch(base, V, HIDDEN, trainIds(size), HELD_IDS, OLD_IDS, PROBE_IDS, epochs, RATE);
	const per = PROBE_IDS.length - 1;
	const before = gb.nnWordLoss(base, V, HIDDEN, PROBE_IDS);
	return {
		train: [gb.nnLoss(base, V, HIDDEN, trainIds(size)), ...run.train],
		held: [gb.nnLoss(base, V, HIDDEN, HELD_IDS), ...run.held],
		old: [gb.nnLoss(base, V, HIDDEN, OLD_IDS), ...run.old],
		// words[e]: the probe's surprises after e passes, 0 = before training
		words: [before, ...Array.from({ length: epochs }, (_, e) => run.probe.slice(e * per, e * per + per))]
	};
}
