// Plain-language text for the evaluation page.
// The claims here are drafts and each one needs a source before release.

export function say({ leak, gap }) {
	if (leak === 0) return 'Nothing leaked, so both sets measure the same thing and the scores agree.';
	if (gap >= 40) return 'The public score now mostly measures which questions the model has seen. The fresh score barely moves.';
	return 'Every leaked question it now gets right adds to the public score. The fresh score stays about the same.';
}

export function trap(leak) {
	if (leak === 0) return 'Slide the leak up: the public wall lights up one tile at a time, while the fresh wall stays about where it was.';
	if (leak === 12) return 'A perfect score, on a model that answers new questions no better than before. The benchmark became a memory test.';
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
		text: 'Questions written after the model was trained cannot have leaked. When the public score is far above the fresh one, the gap is the leak.'
	}
];

export const trapCard =
	'A leaked benchmark gives a confident wrong answer about the model. The score looks precise, and what it measures is memory of the test.';

export const why = [
	{
		title: 'Test on your own task',
		text: 'Before you trust a model or a fine-tune, collect a few dozen real examples of your task with good answers, keep them out of any training, and score the model on them.'
	},
	{
		title: 'Prefer fresh and private tests',
		text: 'Some benchmarks add new questions over time or keep their questions private, so they are much harder to have seen. Give those scores more weight.'
	},
	{
		title: 'Small tests are noisy',
		text: 'On twelve questions, one more right answer moves the score by eight points. Treat small differences between models as a tie unless the test is large.'
	},
	{
		title: 'Check the gap',
		text: 'If a model scores far better on an old public benchmark than on newer questions of the same kind, suspect that it has seen the old ones.'
	}
];

export const whyLead = 'Leaderboards rank models by benchmark scores. A few habits help you read them, and test models yourself.';

export const whyDraft =
	'Draft copy. Before release, source studies of benchmark contamination in large models, how labs check for it (overlap between training data and test questions), and benchmarks that refresh or hide their questions.';

export const hoodNote =
	'The model here reads only the word before the blank, and a question counts as right when that word\'s top guess is the answer. Real benchmarks ask full questions of models trained on trillions of tokens, where a leak is a few copies among billions of pages, and labs search their training data for overlaps with test questions.';

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
