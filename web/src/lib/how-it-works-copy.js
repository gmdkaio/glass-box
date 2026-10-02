// Plain-language text for the how-it-works page.
// The claims here are drafts and each one needs a source before release.

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
	'The network picks words that tend to follow each other. It does not check whether the result is true. A smooth sentence can describe something that never happened, and the sentences below are made that way.';

export const why = [
	{
		title: 'It continues your text',
		text: 'Your message is the start of the text the model keeps writing. How you begin shapes where it goes.'
	},
	{
		title: 'Likely is not the same as true',
		text: 'It picks words that tend to follow, so a smooth sentence can still be wrong. Check the things that matter.'
	},
	{
		title: 'It picks, it does not look up',
		text: 'No answer is sitting in a database. Each word is chosen from odds, which is why the same question can get different answers.'
	},
	{
		title: 'It reuses what it has seen',
		text: 'A model can only reuse patterns from its training text. Rare, new or very specific things are where it is least likely to be reliable.'
	}
];

export const whyLead =
	'Everything an assistant writes comes out of this loop. Knowing it explains most of the surprises.';

export const whyDraft =
	'Draft copy. Statements about real models need sources before release: how much text they train on, how much of the conversation they read at once, how many numbers they learn, and where they are least reliable.';

export const hoodSteps = [
	'hidden value = tanh( connection from the word + a small bias )',
	'score for each next word = sum of ( hidden value × connection ) + a small bias',
	'odds = each score turned into a share of the total (softmax)'
];

export const teachingNote =
	'Teaching: for every pair of words in the text, nudge every number a little in the direction that makes the right next word likelier (gradient descent). Repeat over the whole text many times.';

export const hoodNote =
	'A real model has billions of these numbers, reads far more than the last word, and is taught on far more text. Its parts are arranged differently (transformers, with attention), but the idea is the same: numbers that were nudged until the odds fit the text.';

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
