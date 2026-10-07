// Data for the "what you want to hear" page. The scores and the push each nudge
// adds are made up; every odds is the engine's. Each question has the same shape:
// the right answer leads your answer by some gap, and two other answers trail.
// The engine reads only the scores, so every text here can be shown in Portuguese:
// pt holds it, in the same order.

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
		reply: (a) => `The capital of France is ${a}.`,
		pt: {
			label: 'Um fato que ele sabe',
			ask: 'Qual é a capital da França?',
			answers: ['Paris', 'Lyon', 'Marselha', 'Nice'],
			mine: 'Lyon',
			memory: 'O usuário é de Lyon.',
			reply: (a) => `A capital da França é ${a}.`
		}
	},
	{
		label: 'A fact it half knows',
		ask: 'When was the Millbrook bridge built?',
		answers: ['1846', '1864', '1902', '1920'],
		gap: 0.6,
		mine: '1864',
		memory: 'User is writing a history of Millbrook.',
		reply: (a) => `It was built in ${a}.`,
		pt: {
			label: 'Um fato que ele meio que sabe',
			ask: 'Quando a ponte de Millbrook foi construída?',
			answers: ['1846', '1864', '1902', '1920'],
			mine: '1864',
			memory: 'O usuário está escrevendo uma história de Millbrook.',
			reply: (a) => `Ela foi construída em ${a}.`
		}
	},
	{
		label: 'A judgment call',
		ask: 'Is my plan to hold the fair on the old bridge a good idea?',
		answers: ['It has a flaw', 'It looks good', 'It is great', 'It needs more time'],
		gap: 0.0,
		mine: 'a good plan',
		memory: 'User is organising the fair.',
		reply: (a) => ({ 'It has a flaw': 'There is a problem: the old bridge is closed in winter.', 'It looks good': 'It looks like a good plan.', 'It is great': 'It is a great plan!', 'It needs more time': 'It could work with more time to prepare.' })[a],
		pt: {
			label: 'Uma questão de opinião',
			ask: 'Meu plano de fazer a feira na ponte velha é uma boa ideia?',
			answers: ['Tem uma falha', 'Parece bom', 'É ótimo', 'Precisa de mais tempo'],
			mine: 'um bom plano',
			memory: 'O usuário está organizando a feira.',
			reply: (a) =>
				({
					'Tem uma falha': 'Há um problema: a ponte velha fica fechada no inverno.',
					'Parece bom': 'Parece um bom plano.',
					'É ótimo': 'É um ótimo plano!',
					'Precisa de mais tempo': 'Pode dar certo com mais tempo para preparar.'
				})[a]
		}
	}
].map((q) => ({ ...q, scores: shape(q.gap) }));
export const TRUTH = 0; // the right answer comes first
export const YOURS = 1; // the answer you lean toward comes second

// The nudges, in the order the map adds them. Two live in your message, one is a
// second turn, and three are settings the app adds to every chat.
export const NUDGES = [
	{ key: 'view', label: 'Say what you think', where: 'message', example: (q) => `"I think it's ${q.mine}."`,
		pt: { label: 'Dizer o que você acha', example: (q) => `"Acho que é ${q.pt.mine}."` } },
	{ key: 'leading', label: 'Ask for agreement', where: 'message', example: () => '"…, right?"',
		pt: { label: 'Pedir concordância', example: () => '"…, certo?"' } },
	{ key: 'pushback', label: 'Push back', where: 'turn', example: () => '"Are you sure?"',
		pt: { label: 'Insistir', example: () => '"Tem certeza?"' } },
	{ key: 'instructions', label: 'Custom instructions', where: 'settings', example: () => '"Be encouraging and supportive."',
		pt: { label: 'Instruções personalizadas', example: () => '"Seja encorajador e dê apoio."' } },
	{ key: 'memory', label: 'Memory', where: 'settings', example: (q) => `"${q.memory}"`,
		pt: { label: 'Memória', example: (q) => `"${q.pt.memory}"` } },
	{ key: 'skill', label: 'A custom skill', where: 'settings', example: () => '"Coach: keep the user motivated."',
		pt: { label: 'Uma skill personalizada', example: () => '"Coach: mantenha o usuário motivado."' } }
];

// rows of the map: how far ahead the right answer starts
export const LEVELS = [
	{ label: 'knows it cold', gap: 5.0, pt: { label: 'sabe de cor' } },
	{ label: 'knows it', gap: 3.5, pt: { label: 'sabe' } },
	{ label: 'fairly sure', gap: 2.2, pt: { label: 'tem quase certeza' } },
	{ label: 'leans one way', gap: 1.2, pt: { label: 'pende para um lado' } },
	{ label: 'half knows', gap: 0.6, pt: { label: 'meio que sabe' } },
	{ label: 'a judgment call', gap: 0.0, pt: { label: 'questão de opinião' } }
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

// the same message in Portuguese
export function messagePt(q, on) {
	const { ask, mine } = q.pt;
	if (on.has('view') && on.has('leading')) return `${ask} Acho que é ${mine}, certo?`;
	if (on.has('view')) return `${ask} Acho que é ${mine}.`;
	if (on.has('leading')) return `${ask} É ${mine}, certo?`;
	return ask;
}
