// Data for the evaluation page. The model is the small word network from the
// fine-tuning pages: it knows Millbrook, then learns sentences about the fair.
// The exam questions are made up; every guess and score is the engine's.

import { CORPUS } from './settings-sim.js';
import { FAIR } from './overfit-sim.js';

// Fill in the last word. The first twelve are the public benchmark, the last
// twelve are fresh: the same kind of question, never published. In each set, five
// can be answered from what the fair text teaches; the rest only from the question itself.
const EXAM = `People come from Ashford.
The farmer brings apples.
Children buy honey.
The bakery sells fresh bread.
The river runs under.
The band plays jazz.
The miller grinds flour.
The potter makes jugs.
The smith shoes horses.
The choir sings hymns.
The goats eat grass.
The mayor wears hats.
They take the last bus.
The driver checks every ticket.
A ticket costs two coins.
The farms send apples.
The bakery is warm.
The weaver spins wool.
The cook stirs soup.
The dog chases cats.
The clock strikes noon.
The boat carries fish.
The horses pull carts.
The children fly kites.`.split('\n');

export const PUBLIC = 12;
// the order public questions leak in, so early leaks are ones the model could not answer
export const LEAK_ORDER = [6, 0, 7, 1, 8, 2, 9, 3, 10, 4, 11, 5];
export const COPIES = 3; // a published benchmark gets copied around: each leaked question appears three times
export const PASSES = 25;
export const RATE = 0.05;
export const HIDDEN = 16;
export const SEED = 1;

// More about the town, in ordinary sentences: real knowledge that happens to cover
// a few questions in both sets, without copying any of them.
export const EXTRA = `The miller grinds flour for the bakery.
Every day the miller grinds flour.
The choir sings hymns in the square.
The weaver spins wool in winter.
In the evening the weaver spins wool.
The cook stirs soup at the cafe.
At noon the cook stirs soup.
The clock strikes noon above the market.
The old dog chases cats around the square.
The boat carries fish to the market.`.split('\n');

export const MODELS = [
	{ name: 'A', label: 'Quick', hint: '5 passes', leak: 0, passes: 5, extra: false },
	{ name: 'B', label: 'Standard', hint: '25 passes', leak: 0, passes: 25, extra: false },
	{ name: 'C', label: 'Half the test leaked', hint: '6 public questions in its training text', leak: 6, passes: 25, extra: false },
	{ name: 'D', label: 'Studied the test', hint: 'every public question in its training text', leak: 12, passes: 25, extra: false },
	{ name: 'E', label: 'Read more', hint: 'more about the town, no leaks', leak: 0, passes: 25, extra: true }
];
export const PRESETS = [
	{ label: 'A clean test', hint: 'nothing leaked', leak: 0 },
	{ label: 'Half leaked', hint: '6 of 12 public questions in the training text', leak: 6 },
	{ label: 'Studied the test', hint: 'every public question in the training text', leak: 12 }
];

function split(text) {
	return text.toLowerCase().match(/[a-z]+|\./g) ?? [];
}
const OLD = CORPUS.split('\n');
export const VOCAB = [...new Set(['.', ...[OLD, FAIR, EXAM, EXTRA].flatMap((t) => split(t.join(' ')))])];
const INDEX = new Map(VOCAB.map((w, i) => [w, i]));
const ids = (sentences) => ['.', ...split(sentences.join(' '))].map((w) => INDEX.get(w));
export const V = VOCAB.length;

// each question: the words before the blank, the word to fill in, and the word the model reads
export const QUESTIONS = EXAM.map((s, i) => {
	const words = s.replace(/\.$/, '').split(' ');
	const answer = words.at(-1);
	return {
		prompt: words.slice(0, -1).join(' '),
		answer,
		public: i < PUBLIC,
		context: INDEX.get(words.at(-2).toLowerCase()),
		target: INDEX.get(answer.toLowerCase())
	};
});

// which public questions are in the training text when `leak` of them have leaked
export const leakedSet = (leak) => new Set(LEAK_ORDER.slice(0, leak));

// the training text for one model: the fair sentences, extra reading if any, and leaked questions
export function trainingText({ leak, extra }) {
	const leaked = LEAK_ORDER.slice(0, leak).map((i) => EXAM[i]);
	return [...FAIR, ...(extra ? EXTRA : []), ...Array.from({ length: COPIES }, () => leaked).flat()];
}

export function trainBase(gb) {
	return gb.nnTrain(gb.nnInit(V, HIDDEN, SEED), V, HIDDEN, Int32Array.from(ids(OLD)), 300, 0.05).params;
}

// fine-tune one model and sit the exam: guesses per question, and the right count per set
export function sit(gb, base, model) {
	const params = gb.nnTrain(base, V, HIDDEN, Int32Array.from(ids(trainingText(model))), model.passes, RATE).params;
	const quiz = gb.nnQuiz(params, V, HIDDEN, QUESTIONS.map((q) => q.context), QUESTIONS.map((q) => q.target));
	const right = QUESTIONS.map((q, i) => quiz.guess[i] === q.target);
	return {
		guess: Array.from(quiz.guess, (g) => VOCAB[g]),
		right,
		publicRight: right.slice(0, PUBLIC).filter(Boolean).length,
		freshRight: right.slice(PUBLIC).filter(Boolean).length
	};
}
