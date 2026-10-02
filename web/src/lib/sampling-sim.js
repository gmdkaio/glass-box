// Data for the sampling page. The scores are made up, everything computed from them is the engine's.

export const WORDS = ['Paris', 'Lyon', 'London', 'Berlin', 'banana'];
export const WANTED = 0; // Paris is the answer the reader is after
export const SILLY = 4; // banana
export const GOAL = 'the capital of France';

// Three ways to ask for the same thing. The better the question, the more the scores favour Paris.
export const PROMPTS = [
	{
		label: 'Vague',
		text: 'Name a capital:',
		effect: 'It could be any country, so the odds spread across several capitals.',
		scores: Float64Array.from([2.4, 0.5, 2.3, 2.2, -2.5])
	},
	{
		label: 'Clearer',
		text: 'The capital of France is',
		effect: 'France narrows it down, but a near miss like Lyon still gets a share.',
		scores: Float64Array.from([3.9, 3.0, 1.0, 0.6, -2.5])
	},
	{
		label: 'Specific',
		text: 'Q: What is the capital of France? Answer with one word.',
		effect: 'The question and the format leave little room for anything else.',
		scores: Float64Array.from([6.0, 2.5, 0.8, 0.5, -3.0])
	}
];

export const T_MAX = 3;
export const DRAWS = 1000;

const CURVE_STEPS = 30;

// the odds of the wanted word and the silliest word at each variety setting from 0 to T_MAX
export function curve(gb, scores) {
	const points = [];
	for (let i = 0; i <= CURVE_STEPS; i++) {
		const t = (i / CURVE_STEPS) * T_MAX;
		const odds = gb.softmax(scores, t);
		points.push({ t, wanted: odds[WANTED], silly: odds[SILLY] });
	}
	return points;
}

// one draw from the odds. Returns the index of the word that came up.
export function pickWord(gb, odds, seed) {
	return gb.sample(odds, 1, seed).findIndex((c) => c === 1);
}

// 0.52 becomes "52%", and tiny odds keep a decimal so they do not read as zero
export function percent(p) {
	const v = p * 100;
	if (v === 0) return '0%';
	if (v < 1) return v.toFixed(1) + '%';
	return Math.round(v) + '%';
}
