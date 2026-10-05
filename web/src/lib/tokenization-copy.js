// Plain-language text for the tokenization page.
// The claims here are drafts and each one needs a source before release.

export function say(perToken) {
	if (perToken >= 3.5) return 'Most words are a single token here, so the model reads this text in big, familiar pieces.';
	if (perToken >= 2) return 'Common words are whole, but rarer words come apart into pieces.';
	if (perToken > 1.05) return 'The text is mostly small scraps: a letter or two per token.';
	return 'Every byte is its own token. This is what the model would read with no merges at all.';
}

export function trap({ digits, foreign, letters }) {
	if (letters)
		return 'The model sees "strawberry" as a few numbers, one for each piece. To count the r\'s it has to remember how each piece is spelled.';
	if (digits) return 'Long numbers are cut wherever the merges happen to fall, so 12,450 can become 1, 2, a comma, 4 and 50. That makes sums harder than they look.';
	if (foreign)
		return 'A tokenizer that learned mostly from English has few merges for other languages, so the same meaning takes more tokens. Letters like ã take two bytes, and they can be split.';
	return 'Frequent English words get one token each. Rare words, names and typos fall apart into pieces.';
}

export const parts = [
	{
		title: 'Text becomes numbers',
		text: 'Before the model sees anything, your text is cut into tokens and each token is swapped for a number from a fixed list. The model only ever gets the numbers.'
	},
	{
		title: 'Frequent pairs get merged',
		text: 'The list is learned from text: start with single bytes, find the pair that sits side by side most often, make it one token, and repeat. Common words end up whole.'
	},
	{
		title: 'Letters are inside the pieces',
		text: 'Once "berry" is one token, the model reads it as one number with the letters b, e, r, r, y hidden inside. It can only know them if it has learned how that token is spelled.'
	}
];

export const trapCard =
	'A question about letters feels trivial to a person reading letters. The model reads token numbers, so counting letters, reversing a word or doing sums digit by digit means working with something hidden inside them.';

export const why = [
	{
		title: 'Ask it to spell first',
		text: 'For letter questions, ask the model to write the word out one letter at a time, then count. Spelled out, each letter becomes its own token.'
	},
	{
		title: 'Let a tool do the sums',
		text: 'For exact arithmetic on long numbers, ask the model to use a calculator or write code. Numbers are cut into uneven pieces before it sees them.'
	},
	{
		title: 'Budget for your language',
		text: 'The same message in many languages takes more tokens than in English. That uses up more of the context limit and, when you pay per token, costs more.'
	},
	{
		title: 'Expect odd words to be harder',
		text: 'Rare names, codes and typos are split into many small pieces. Spell out or explain the ones that matter so the model does not have to guess.'
	}
];

export const whyLead = 'A few habits get around what the tokenizer hides.';

export const whyDraft =
	'Draft copy. Before release, source the language gap (studies of tokenizer cost across languages) with numbers for current tokenizers, and check how today\'s models do on letter counting, which has improved.';

export const hoodNote =
	'Real tokenizers work the same way but learn from far more text in many languages and keep tens of thousands to a few hundred thousand tokens. Their gap between languages is smaller than in this English-only toy, and it is still there.';

export const next = [
	{
		title: 'Next: calibration',
		text: 'How sure the model sounds, compared with how often it is right.'
	},
	{
		title: 'Then: retrieval',
		text: 'How a model looks things up before it answers, and what goes wrong when the search finds the wrong page.'
	}
];
