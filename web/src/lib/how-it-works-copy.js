// Plain-language text for the how-it-works page.
// Claims are checked against the sources below; anything still unsourced is marked Draft copy on the page.
// Sources, checked 2026-10-07:
//   Qwen3 vocab_size 151936: https://huggingface.co/Qwen/Qwen3-8B/blob/main/config.json
//   Qwen3 training text and languages: https://qwenlm.github.io/blog/qwen3/
//   Qwen3 sizes: https://arxiv.org/abs/2505.09388
//   Qwen3-8B context: https://huggingface.co/Qwen/Qwen3-8B
//   Rare facts: https://arxiv.org/abs/2211.08411, https://arxiv.org/abs/2212.10511

export const steps = [
	{ title: 'Read', text: 'The word it is on goes into the network.' },
	{ title: 'Score', text: 'The network works out odds for every possible next word.' },
	{ title: 'Pick', text: 'One word is chosen, like weighted dice.' },
	{ title: 'Add', text: 'It goes on the end, and the loop starts again.' }
];

export const untrained =
	'The network has not learned anything yet. Its connections start as random numbers, so almost every word looks equally likely. Press Teach the network.';

// what the network says right now, next to what the text said
export function say(word, isStart, top, networkP, textP) {
	const where = isStart ? 'At the start of a sentence' : `After "${word}"`;
	return `${where} the network's favourite is "${top}" at ${networkP}. Counting the text gives ${textP}.`;
}

export const trap =
	'The network picks words that tend to follow each other, whether or not the result is true. A smooth sentence can describe something that never happened, and the sentences below are made that way.';

export const why = [
	{
		title: 'It continues your text',
		text: 'Your message is the start of the text the model keeps writing. How you begin shapes where it goes.'
	},
	{
		title: 'Likely can still be wrong',
		text: 'It picks words that tend to follow, so a smooth sentence can still be wrong. Check the things that matter.'
	},
	{
		title: 'It picks from odds',
		text: 'Each word is chosen from odds, which is why the same question can get different answers.'
	},
	{
		title: 'It reuses what it has seen',
		text: 'A model can only reuse patterns from its training text. Rare, new or very specific things are where it is least likely to be reliable.'
	}
];

export const whyLead =
	'Everything an assistant writes comes out of this loop. Knowing it explains most of the surprises.';

export const whyDraft =
	'Checked on 2026-10-06 for Qwen3: about 36 trillion tokens of training text in 119 languages, 0.6 to 235 billion numbers, and 32,768 tokens read at once (131,072 with YaRN); rare facts are least reliable (Kandpal et al. and Mallen et al., 2023).';

export const hoodSteps = [
	'hidden value = tanh( connection from the word + a small bias )',
	'score for each next word = sum of ( hidden value × connection ) + a small bias',
	'odds = each score turned into a share of the total (softmax)'
];

export const teachingNote =
	'Teaching: for every pair of words in the text, nudge every number a little in the direction that makes the right next word likelier (gradient descent). Repeat over the whole text many times.';

export const hoodNote =
	'A real model has billions of these numbers, reads far more than the last word, and is taught on far more text. Its parts are arranged differently (transformers, with attention), and it is still a set of numbers nudged until the odds fit the text. It reads word pieces called tokens, from a list of tens of thousands to a few hundred thousand (151,936 for Qwen3), learns with an optimizer called Adam over large batches, and chat assistants get further training on conversations, which teaches them to answer questions.';

export const next = [
	{
		title: 'Next: why answers vary',
		text: 'If it picks from odds, why does the same question give different answers, and what can you do about it?'
	},
	{
		title: 'Then: errors in long tasks',
		text: 'Every pick can go a little wrong. Over a long task, those add up.'
	}
];
