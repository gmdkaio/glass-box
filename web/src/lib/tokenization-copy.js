// Plain-language text for the tokenization page.
// Claims are checked against the sources below; anything still unsourced is marked Draft copy on the page.
// Sources, checked 2026-10-07:
//   Language gap: Petrov et al., NeurIPS 2023, https://arxiv.org/abs/2305.15425
//   Language gap in current tokenizers (o200k, Llama 3.1, Qwen3 on FLORES-200+): Somide 2026, https://arxiv.org/abs/2606.24460
//   OpenAI tokenizers split digits into groups of 1-3: https://github.com/openai/tiktoken/blob/main/tiktoken_ext/openai_public.py
//   Models know token spelling but fail to use it: Edman et al., EMNLP 2024 (CUTE), https://arxiv.org/abs/2409.15452
//   Letter counting errors, worse for repeated letters: Fu et al. 2024, https://arxiv.org/abs/2412.18626
//   Qwen tokenizer splits digits: https://arxiv.org/abs/2309.16609
//   Qwen3 vocab_size 151936: https://huggingface.co/Qwen/Qwen3-8B/blob/main/config.json

export function say(perToken) {
	if (perToken >= 3.5) return 'Most words are a single token here, so the model reads this text in big, familiar pieces.';
	if (perToken >= 2) return 'Common words are whole, but rarer words come apart into pieces.';
	if (perToken > 1.05) return 'The text is mostly small scraps: a letter or two per token.';
	return 'Every byte is its own token. This is what the model would read with no merges at all.';
}

export function trap({ digits, foreign, letters }) {
	if (letters)
		return 'The model sees "strawberry" as a few numbers, one for each piece. To count the r\'s it has to remember how each piece is spelled.';
	if (digits) return 'Here long numbers are cut wherever the merges happen to fall, so 12,450 can become 1, 2, a comma, 4 and 50. Most current tokenizers cut numbers by a fixed rule instead, into single digits or groups of up to three, and sums are still harder than they look.';
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
		text: 'For exact arithmetic on long numbers, ask the model to use a calculator or write code. Many tokenizers cut long numbers into single digits or groups of up to three, so the model works on pieces of the number.'
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
	'Checked on 2026-10-07 against Petrov et al. (2023) on tokenizer cost across languages (up to 15 times); Somide (2026), where current tokenizers (GPT-4o\'s, Llama 3.1\'s and Qwen3\'s) need on average 2.6 to 3.3 times as many tokens as English for the same sentences in 20 African languages; Qwen3\'s vocabulary of 151,936 tokens; how the Qwen and OpenAI tokenizers split digits; Edman et al. (2024), where models knew how their tokens are spelled and still struggled to use it to change text; and Fu et al. (2024), where GPT-4o miscounted letters in 17% of words and most open models in over half, with errors rising sharply when a letter appears more than once.';

export const hoodNote =
	'Real tokenizers work the same way but learn from far more text in many languages and keep tens of thousands to a few hundred thousand tokens. Their gap between languages is smaller than in this English-only toy, and it is still there. They also split text first by their own rules for spaces, punctuation and digits, then apply the merges.';

export const next = [
	{
		title: 'Next: calibration',
		text: 'How sure the model sounds, compared with how often it is right.'
	},
	{
		title: 'Then: what you want to hear',
		text: 'Chat models lean toward agreeing with you. How your opinions and settings tilt their answers.'
	}
];
