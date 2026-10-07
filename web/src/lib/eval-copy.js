// Plain-language text for the evaluation page.
// Claims are checked against the sources below; anything still unsourced is marked Draft copy on the page.
// Sources, checked 2026-10-07:
//   13-gram overlap checks: https://arxiv.org/abs/2005.14165 (GPT-3, appendix C)
//   Substring overlap checks: https://arxiv.org/abs/2303.08774 (GPT-4 technical report, appendix C)
//   Token overlap checks: https://arxiv.org/abs/2307.09288 (Llama 2, appendix A.6)
//   Fresh matched questions and score drops: https://arxiv.org/abs/2405.00332 (GSM1k)
//   Monthly new questions: https://arxiv.org/abs/2406.19314 (LiveBench)
//   Dated contest problems: https://arxiv.org/abs/2403.07974 (LiveCodeBench)

export function say({ leak, gap }) {
	if (leak === 0) return 'Nothing leaked, so both sets measure the same thing and the scores agree.';
	if (gap >= 40) return 'The public score now mostly measures which questions the model has seen. The fresh score barely moves.';
	return 'Every leaked question it now gets right adds to the public score. The fresh score stays about the same.';
}

export function trap(leak) {
	if (leak === 0) return 'Slide the leak up: the public wall lights up one tile at a time, while the fresh wall stays about where it was.';
	if (leak === 12) return 'A perfect score, on a model that answers new questions no better than before. Every public question now tests what it remembers.';
	return 'Look at the leaked tiles: the model gets them right because it saw the answer, so they say nothing about what it can do.';
}

export const parts = [
	{
		title: 'A test is a sample',
		text: 'A benchmark is a set of questions with known answers. Its score stands for how the model does on all questions like them, as long as the model has not seen these ones.'
	},
	{
		title: 'Leaks turn it into a memory test',
		text: 'Benchmarks are published, copied and quoted across the web, and web text ends up in training data. A model that has read a question can repeat its answer without knowing anything.'
	},
	{
		title: 'Fresh questions show the real level',
		text: 'Questions written after the model was trained cannot have leaked. When the public score is far above the fresh one on questions of the same difficulty, a leak is the likely cause.'
	}
];

export const trapCard =
	'A leaked benchmark gives a confident wrong answer about the model. The score looks precise, yet part of it counts answers the model remembered.';

export const why = [
	{
		title: 'Test on your own task',
		text: 'Before you trust a model or a fine-tune, collect a few dozen real examples of your task with good answers, keep them out of any training, and score the model on them.'
	},
	{
		title: 'Prefer fresh and private tests',
		text: 'Some benchmarks, like LiveBench and LiveCodeBench, add new questions over time; others keep theirs private. A model is much less likely to have seen them.'
	},
	{
		title: 'Small tests are noisy',
		text: 'On twelve questions, one more right answer moves the score by eight points. Treat small differences between models as a tie unless the test is large.'
	},
	{
		title: 'Check the gap',
		text: 'If a model scores far better on an old public benchmark than on newer questions of the same kind and difficulty, suspect that it has seen the old ones.'
	}
];

export const whyLead = 'Leaderboards rank models by benchmark scores. A few habits help you read them, and test models yourself.';

export const whyDraft =
	'Checked on 2026-10-07 against the overlap checks in the GPT-3, GPT-4 and Llama 2 reports, the GSM1k study of fresh maths questions, and the LiveBench and LiveCodeBench papers.';

export const hoodNote =
	'The model here reads only the word before the blank, and a question counts as right when that word\'s top guess is the answer. Real benchmarks ask full questions of models trained on trillions of tokens, where a leak is a few copies among billions of pages. Labs search their training data for test questions by matching runs of words or characters.';

export const next = [
	{
		title: 'Back to: overfitting',
		text: 'A leaked benchmark is overfitting on the test itself: the same learning by heart, measured with the wrong set.'
	},
	{
		title: 'Back to the start: how it works',
		text: 'Every number on these pages comes from models like the one there: odds for the next word, learned from text.'
	}
];
