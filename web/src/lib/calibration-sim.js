// Settings for the calibration page. The answers, the bins, the gap and the
// correction all come from the engine.

export { percent } from '$lib/sampling-sim.js';

export const QUESTIONS = 2000;
export const CHECKED = 500; // questions with known answers, for the correction
export const BINS = 10;

export const SPREAD = 1.2;

// the same model, sounding about 83% sure in all three
export const SETUPS = [
	{ label: 'Questions it knows well', hint: 'common facts, well covered in its training text', mean: 2, shift: 0,
		pt: { label: 'Perguntas que ele conhece bem', hint: 'fatos comuns, bem cobertos no texto de treino' } },
	{ label: 'A mixed quiz', hint: 'some easy, some it half knows', mean: 0.5, shift: 1.5,
		pt: { label: 'Um quiz misturado', hint: 'algumas fáceis, algumas que ele meio que sabe' } },
	{ label: 'Hard, niche questions', hint: 'obscure facts, exact numbers, recent events', mean: -0.5, shift: 2.5,
		pt: { label: 'Perguntas difíceis, de nicho', hint: 'fatos obscuros, números exatos, acontecimentos recentes' } }
];

export const HARD = { min: -1.5, max: 3 };
export const SURE = { min: 0, max: 3 };

// One quiz: every answer's stated confidence and outcome, and what they add up
// to. With fixed on, the confidences are corrected by a shift learned from a
// separate set of checked questions.
export function quiz(gb, hard, shift, seed, fixed) {
	let { conf, correct } = gb.calibSample(QUESTIONS, hard, SPREAD, shift, seed);
	let fix = 0;
	if (fixed) {
		const checked = gb.calibSample(CHECKED, hard, SPREAD, shift, seed + 100000);
		fix = gb.calibFitShift(checked.conf, checked.correct);
		conf = gb.calibApply(conf, fix);
	}
	return {
		conf,
		correct,
		fix,
		bins: gb.calibBins(conf, correct, BINS),
		...gb.calibMeans(conf, correct),
		gap: gb.calibError(conf, correct, BINS),
		brier: gb.calibBrier(conf, correct)
	};
}

// Just the two averages, from a smaller quiz: enough for a point on a curve.
export function averages(gb, hard, shift, seed, fixed, n = 1000) {
	let { conf, correct } = gb.calibSample(n, hard, SPREAD, shift, seed);
	if (fixed) {
		const checked = gb.calibSample(CHECKED, hard, SPREAD, shift, seed + 100000);
		conf = gb.calibApply(conf, gb.calibFitShift(checked.conf, checked.correct));
	}
	return gb.calibMeans(conf, correct);
}

// the points of the two small charts: one setting moves, the other stays put
export const HARD_STEPS = Array.from({ length: 31 }, (_, i) => HARD.min + ((HARD.max - HARD.min) * i) / 30);
export const SURE_STEPS = Array.from({ length: 31 }, (_, i) => SURE.min + ((SURE.max - SURE.min) * i) / 30);
export const byHard = (gb, shift, seed, fixed) => HARD_STEPS.map((h) => averages(gb, h, shift, seed, fixed));
export const byBold = (gb, hard, seed, fixed) => SURE_STEPS.map((s) => averages(gb, hard, s, seed, fixed));

// three questions about a made-up town, so no real fact on the page can be
// wrong: one it knows well, one it half knows, one obscure. Only the page shows them
// (the engine draws the outcomes), so pt holds the Portuguese to show.
export const CARDS = [
	{
		label: 'An easy question',
		pt: { label: 'Uma pergunta fácil' },
		mean: SETUPS[0].mean,
		bank: [
			{ q: 'What is the river through the town called?', truth: 'the Wend', wrong: 'the Arle', pt: { q: 'Como se chama o rio que corta a cidade?', truth: 'o Wend', wrong: 'o Arle' } },
			{ q: 'Which day is market day?', truth: 'Saturday', wrong: 'Friday', pt: { q: 'Em que dia é a feira?', truth: 'Sábado', wrong: 'Sexta' } },
			{ q: 'What colour are the town buses?', truth: 'Green', wrong: 'Blue', pt: { q: 'De que cor são os ônibus da cidade?', truth: 'Verdes', wrong: 'Azuis' } }
		]
	},
	{
		label: 'A middling one',
		pt: { label: 'Uma média' },
		mean: SETUPS[1].mean,
		bank: [
			{ q: 'In what year did the town library open?', truth: '1923', wrong: '1911', pt: { q: 'Em que ano a biblioteca da cidade abriu?', truth: '1923', wrong: '1911' } },
			{ q: 'How many pupils did the new school start with?', truth: '320', wrong: '280', pt: { q: 'Com quantos alunos a escola nova começou?', truth: '320', wrong: '280' } },
			{ q: 'When does the first bus to the city leave?', truth: '7:15', wrong: '6:45', pt: { q: 'A que horas sai o primeiro ônibus para a capital?', truth: '7:15', wrong: '6:45' } }
		]
	},
	{
		label: 'A hard, niche one',
		pt: { label: 'Uma difícil, de nicho' },
		mean: SETUPS[2].mean,
		bank: [
			{ q: 'How many books did the library lend in 1998?', truth: '61,240', wrong: '58,900', pt: { q: 'Quantos livros a biblioteca emprestou em 1998?', truth: '61.240', wrong: '58.900' } },
			{ q: "What was the river's lowest level in 2022, in centimetres?", truth: '38', wrong: '52', pt: { q: 'Qual foi o nível mais baixo do rio em 2022, em centímetros?', truth: '38', wrong: '52' } },
			{ q: "Who was the town's third mayor?", truth: 'Ada Merrow', wrong: 'Tom Hale', pt: { q: 'Quem foi o terceiro prefeito da cidade?', truth: 'Ada Merrow', wrong: 'Tom Hale' } }
		]
	}
];

// how a stated confidence sounds in words
export function phrase(conf) {
	if (conf >= 0.95) return "I'm certain.";
	if (conf >= 0.85) return "I'm fairly sure.";
	if (conf >= 0.7) return 'I think so.';
	if (conf >= 0.55) return "Probably, but I'm not sure.";
	return "I'm guessing.";
}

// the same, in Portuguese
export function phrasePt(conf) {
	if (conf >= 0.95) return 'Tenho certeza.';
	if (conf >= 0.85) return 'Tenho quase certeza.';
	if (conf >= 0.7) return 'Acho que sim.';
	if (conf >= 0.55) return 'Provavelmente, mas não tenho certeza.';
	return 'Estou chutando.';
}

// One card's answer: a typical answer from a quiz at that difficulty, with your
// boldness, correction and set of questions. Typical means its stated confidence
// is the closest to the quiz average, among a few answers that `draw` picks.
export function cardAnswer(gb, card, i, shift, seed, fixed) {
	const qz = quiz(gb, card.mean, shift, seed, fixed);
	let best = 0;
	for (let k = 1; k < 40; k++) if (Math.abs(qz.conf[k] - qz.says) < Math.abs(qz.conf[best] - qz.says)) best = k;
	const b = card.bank[(seed + i) % card.bank.length];
	const right = qz.correct[best] === 1;
	const pt = { label: card.pt.label, q: b.pt.q, truth: b.pt.truth, said: right ? b.pt.truth : b.pt.wrong };
	return { label: card.label, q: b.q, truth: b.truth, said: right ? b.truth : b.wrong, conf: qz.conf[best], right, pt };
}
