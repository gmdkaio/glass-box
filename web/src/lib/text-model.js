// A tiny word model. The engine counts which word follows which in a text, and
// the odds for the next word come from those counts. Turning text into word
// numbers is the only thing done here.

export const TEXTS = [
	{
		label: 'A story',
		hint: 'a cat and a dog',
		text: 'the cat sat on the mat. the dog sat on the rug. the cat saw the dog. the dog saw the cat. the cat ran to the garden. the dog ran to the park. the cat likes the sun. the dog likes the rain. the cat sat in the sun and the dog sat in the rain.'
	},
	{
		label: 'A weather report',
		hint: 'sky, wind and rain',
		text: 'today the sky is clear and the wind is calm. tomorrow the sky will be cloudy and the wind will be strong. the rain will start in the evening and the night will be cold. the sun will rise at six and the sky will be clear. the wind will be calm in the morning.'
	},
	{
		label: 'A recipe',
		hint: 'flour, eggs and a cake',
		text: 'mix the flour and the sugar in a bowl. add the eggs and the milk to the bowl. stir the mix until it is smooth. pour the mix into a pan. bake the cake for forty minutes. let the cake cool and add the sugar on top. the cake is ready when the top is brown.'
	}
];

export const MAX_TEXT = 2500;
export const MAX_WORDS_IN_SENTENCE = 14;
const START = '.'; // the text starts after a full stop, so the first word has something to follow

export function tokenize(text) {
	return text.toLowerCase().replace(/[!?]/g, '.').match(/[a-z']+|\./g) ?? [];
}

export function buildModel(gb, text) {
	const tokens = [START, ...tokenize(text)];
	const words = [];
	const index = new Map();
	const ids = Int32Array.from(tokens, (t) => {
		if (!index.has(t)) {
			index.set(t, words.length);
			words.push(t);
		}
		return index.get(t);
	});
	const { counts, pairs } = gb.pairCounts(ids, words.length);

	// how often each word appears, to decide which ones to draw
	const freq = new Array(words.length).fill(0);
	for (const id of ids) freq[id]++;

	return {
		words,
		ids,
		freq,
		vocab: words.length,
		counts,
		pairs,
		start: index.get(START),
		bestLoss: gb.tableLoss(counts, words.length, ids)
	};
}

// how a word is written on screen
export function label(model, id) {
	return model.words[id] === START ? 'full stop' : model.words[id];
}

// what followed this word in the text: the odds, how many times, and the list sorted by odds
export function followers(gb, model, id) {
	const row = model.counts.subarray(id * model.vocab, (id + 1) * model.vocab);
	const { odds, total } = gb.rowOdds(row);
	const list = [];
	for (let i = 0; i < model.vocab; i++)
		if (row[i] > 0) list.push({ id: i, word: model.words[i], count: row[i], p: odds[i] });
	list.sort((a, b) => b.count - a.count || a.id - b.id);
	return { odds, total, list };
}

// picks the next word after this one, or null if nothing ever followed it
export function pickNext(gb, model, id, seed) {
	const { odds, total } = followers(gb, model, id);
	if (total === 0) return null;
	return gb.sample(odds, 1, seed).findIndex((c) => c === 1);
}

// writes a whole sentence from the start, as a list of word numbers
export function writeSentence(gb, model, seed) {
	const out = [];
	let current = model.start;
	for (let i = 0; i < MAX_WORDS_IN_SENTENCE; i++) {
		const next = pickNext(gb, model, current, seed * 100 + i);
		if (next === null) break;
		out.push(next);
		if (next === model.start) break;
		current = next;
	}
	return out;
}

// word numbers to readable text: capital letter first, full stop attached
export function show(model, ids) {
	const text = ids
		.map((id) => model.words[id])
		.join(' ')
		.replace(/ \./g, '.');
	return text.charAt(0).toUpperCase() + text.slice(1);
}
