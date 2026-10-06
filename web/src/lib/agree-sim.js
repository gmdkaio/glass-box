// Data for the "what you want to hear" page. The scores and the push each nudge
// adds are made up; every odds is the engine's. Each question has the same shape:
// the right answer leads your answer by some gap, and two other answers trail.

export { percent } from './sampling-sim.js';

export const PUSH = 0.9; // how much each nudge raises the score of your answer

const shape = (gap) => Float64Array.from([gap, 0, -1, -1.5]);

export const QUESTIONS = [
	{
		label: 'A fact it knows',
		ask: 'What is the capital of France?',
		answers: ['Paris', 'Lyon', 'Marseille', 'Nice'],
		gap: 5.0,
		mine: 'Lyon',
		memory: 'User is from Lyon.',
		reply: (a) => `The capital of France is ${a}.`
	},
	{
		label: 'A fact it half knows',
		ask: 'When was the Millbrook bridge built?',
		answers: ['1846', '1864', '1902', '1920'],
		gap: 0.6,
		mine: '1864',
		memory: 'User is writing a history of Millbrook.',
		reply: (a) => `It was built in ${a}.`
	},
	{
		label: 'A judgment call',
		ask: 'Is my plan to hold the fair on the old bridge a good idea?',
		answers: ['It has a flaw', 'It looks good', 'It is great', 'It needs more time'],
		gap: 0.0,
		mine: 'a good plan',
		memory: 'User is organising the fair.',
		reply: (a) => ({ 'It has a flaw': 'There is a problem: the old bridge is closed in winter.', 'It looks good': 'It looks like a good plan.', 'It is great': 'It is a great plan!', 'It needs more time': 'It could work with more time to prepare.' })[a]
	}
].map((q) => ({ ...q, scores: shape(q.gap) }));
export const TRUTH = 0; // the right answer comes first
export const YOURS = 1; // the answer you lean toward comes second

// The nudges, in the order the map adds them. Two live in your message, one is a
// second turn, and three are settings the app adds to every chat.
export const NUDGES = [
	{ key: 'view', label: 'Say what you think', where: 'message', example: (q) => `"I think it's ${q.mine}."` },
	{ key: 'leading', label: 'Ask for agreement', where: 'message', example: () => '"…, right?"' },
	{ key: 'pushback', label: 'Push back', where: 'turn', example: () => '"Are you sure?"' },
	{ key: 'instructions', label: 'Custom instructions', where: 'settings', example: () => '"Be encouraging and supportive."' },
	{ key: 'memory', label: 'Memory', where: 'settings', example: (q) => `"${q.memory}"` },
	{ key: 'skill', label: 'A custom skill', where: 'settings', example: () => '"Coach: keep the user motivated."' }
];

// rows of the map: how far ahead the right answer starts
export const LEVELS = [
	{ label: 'knows it cold', gap: 5.0 },
	{ label: 'knows it', gap: 3.5 },
	{ label: 'fairly sure', gap: 2.2 },
	{ label: 'leans one way', gap: 1.2 },
	{ label: 'half knows', gap: 0.6 },
	{ label: 'a judgment call', gap: 0.0 }
];
export const rowOf = (q) => LEVELS.findIndex((l) => l.gap === q.gap);

// the odds with n nudges pushing toward your answer
export const leanOf = (gb, scores, n) => gb.lean(scores, YOURS, n * PUSH);

// how often it agrees with you, for every level and every number of nudges
export function map(gb) {
	return LEVELS.map((l) => NUDGES.map((_, n) => leanOf(gb, shape(l.gap), n).share).concat(leanOf(gb, shape(l.gap), NUDGES.length).share));
}

// the chat: the first reply with the nudges in your message and settings, then a
// second reply if you push back
export function chat(gb, q, on) {
	const first = NUDGES.filter((n) => n.key !== 'pushback' && on.has(n.key)).length;
	const turns = [{ odds: leanOf(gb, q.scores, first).odds }];
	if (on.has('pushback')) turns.push({ odds: leanOf(gb, q.scores, first + 1).odds });
	return turns;
}

// the user's message, built from the question and the nudges in it
export function message(q, on) {
	if (on.has('view') && on.has('leading')) return `${q.ask} I think it's ${q.mine}, right?`;
	if (on.has('view')) return `${q.ask} I think it's ${q.mine}.`;
	if (on.has('leading')) return `${q.ask} It's ${q.mine}, right?`;
	return q.ask;
}
