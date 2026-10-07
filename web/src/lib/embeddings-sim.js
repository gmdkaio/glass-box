// Settings and text for the embeddings page. Turning text into word numbers is
// done here; the counts, the vectors, every similarity and the map come from the engine.

export { percent } from './sampling-sim.js';

// The text the vectors are learned from: short sentences about five things, written
// for this page so that words used alike (bus and coach, first and earliest) appear
// in the same kinds of sentence.
export const CORPUS = `The first bus leaves the square early in the morning.
The earliest coach leaves the station early in the morning.
The bus stops at the station and the driver checks every ticket.
The coach stops at the square and the driver checks every ticket.
The train leaves the station every hour from the platform.
The tram leaves the square every hour and stops on the bridge.
A ticket for the bus costs two coins and the driver sells it.
A ticket for the coach costs three coins and the driver sells it.
The last train leaves the station late in the evening.
The last bus leaves the square late in the evening.
The tram and the train arrive at the station on time.
The coach and the bus arrive at the square on time.
Take the first train into the city on a weekday morning.
Take the earliest coach into town on a weekday morning.
The route of the bus runs from the village to the city.
The route of the coach runs from the village into town.
The bakery sells fresh bread and cake every morning.
The cook bakes bread in the oven and sells the cake warm.
We eat soup and bread in the kitchen in the evening.
We eat cheese and apples in the kitchen at noon.
The cook makes soup with cheese and fresh bread.
The cake from the bakery tastes sweet and fresh.
An apple and some cheese taste good with bread.
The oven in the kitchen bakes bread and cake.
The cat sleeps in the garden and the dog barks at birds.
The dog chases the cat across the garden.
A bird sings in the tree and the cat watches the bird.
The horse eats grass in the field near the fox.
The fox hunts birds in the field at night.
We feed the dog and the cat every evening.
The horse and the dog run across the field.
A fox and a bird hide in the tree.
Rain falls on the town and the wind is cold.
The sun is warm and the clouds are white.
Snow falls in the village and the wind is cold.
The rain stops and the sun comes out over the city.
Cold wind brings clouds and snow over the river.
Warm sun and light rain fall on the garden.
The river runs under the bridge and through the town.
The market fills the square in the village every weekday.
The street runs from the market to the river in the city.
The bridge crosses the river near the square in town.
The village has a market, a square and a river.
The city has a station, a bridge and a market.`;

// what each word is mostly about, used only to score how well the vectors group them
export const TOPICS = {
	transport: 'bus coach train tram ticket station platform driver route leave arrive stop check coin cost sell two three earliest first last early late morning evening hour time weekday take',
	food: 'bread cake soup cheese apple bakery kitchen cook oven bake eat taste fresh sweet make good noon',
	animals: 'cat dog bird horse fox bark chase feed sleep sing hunt hide grass field tree garden watch night',
	weather: 'rain sun wind cloud snow cold warm light white fall come bring',
	places: 'town city village square market street river bridge cross fill run'
};
export const TOPIC_NAMES = Object.keys(TOPICS);
// the topic names in Portuguese, only for the map's labels
export const TOPIC_PT = { transport: 'transporte', food: 'comida', animals: 'animais', weather: 'clima', places: 'lugares' };

const STOP = new Set(
	'a an the and in at on of to for from it is are with into every some over under through near out across up its we has what when where which will can i be does do go get there how'.split(' ')
);

// a plain plural made singular: watches to watch, coins to coin
function singular(w) {
	if (w.length > 4 && /(ch|sh|x|ss)es$/.test(w)) return w.slice(0, -2);
	if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1);
	return w;
}
export function words(text) {
	return (text.toLowerCase().match(/[a-z]+/g) ?? []).filter((w) => !STOP.has(w)).map(singular).filter((w) => !STOP.has(w));
}

const SENTENCES = CORPUS.split('\n').map(words);
export const VOCAB = [...new Set(SENTENCES.flat())].sort();
const INDEX = new Map(VOCAB.map((w, i) => [w, i]));
export const LABELS = VOCAB.map((w) => TOPIC_NAMES.findIndex((t) => TOPICS[t].split(' ').includes(w)));
export const idsOf = (text) => words(text).filter((w) => INDEX.has(w)).map((w) => INDEX.get(w));
export const unknownIn = (text) => words(text).filter((w) => !INDEX.has(w));
const TEXT = SENTENCES.flatMap((s) => [...s.map((w) => INDEX.get(w)), -1]);

export const WINDOW = 3;
export const DIMS = [1, 2, 3, 4, 6, 8, 12, 16, 24, 32];
export const PICKS = ['coach', 'earliest', 'early', 'town', 'bread', 'cat', 'rain', 'market'];

// notices to search, and questions asked in other words than the notices use
export const NOTICES = [
	'The first bus leaves the square in the morning.',
	'The last train leaves the station late in the evening.',
	'The bakery sells fresh bread and cake every morning.',
	'The dog barks at the birds in the garden.',
	'Snow and cold wind are coming to the village.',
	'The market fills the square every weekday.'
];
export const QUESTIONS = [
	{ text: 'When does the earliest coach go?', right: 0 },
	{ text: 'Where can I get something sweet to eat?', right: 2 },
	{ text: 'Will the weather be cold?', right: 4 }
];

export const SETUPS = [
	{ label: 'Words used alike', hint: 'coach, never said to be like bus', word: 'coach', question: 0, dimsAt: 4,
		pt: { label: 'Palavras usadas do mesmo jeito', hint: 'coach, sem ninguém dizer que parece bus' } },
	{ label: 'Too few numbers', hint: 'two numbers per word', word: 'coach', question: 0, dimsAt: 1,
		pt: { label: 'Números de menos', hint: 'dois números por palavra' } },
	{ label: 'Search by meaning', hint: 'a sweet thing to eat', word: 'cake', question: 1, dimsAt: 4,
		pt: { label: 'Busca por significado', hint: 'algo doce para comer' } }
];

// learned once: the counts, weighted, broken into directions
export function learn(gb) {
	return gb.embedLearn(TEXT, VOCAB.length, WINDOW);
}

// the vectors at k dimensions, and the flat map of them
export function space(gb, learned, k) {
	const rows = gb.embedTake(learned.values, learned.vectors, k);
	const map = k >= 2 ? gb.project2d(rows, k) : Float64Array.from({ length: VOCAB.length * 2 }, (_, i) => (i % 2 ? 0 : rows[i / 2]));
	return { k, rows, map };
}

// the words closest to one word
export function nearest(gb, s, word, count = 6) {
	const i = INDEX.get(word);
	if (i === undefined) return [];
	const sims = gb.cosineRows(s.rows, s.k, s.rows.slice(i * s.k, (i + 1) * s.k));
	return [...sims.keys()]
		.filter((j) => j !== i)
		.sort((a, b) => sims[b] - sims[a])
		.slice(0, count)
		.map((j) => ({ word: VOCAB[j], sim: sims[j] }));
}

// the notices scored two ways: shared words (BM25), and meaning (cosine of average vectors)
export function search(gb, s, question) {
	const q = idsOf(question);
	const noticeIds = NOTICES.map(idsOf);
	const keyword = gb.bm25(noticeIds, VOCAB.length, q);
	const qv = q.length ? gb.meanRows(s.rows, s.k, q) : new Float64Array(s.k);
	const means = noticeIds.flatMap((ids) => Array.from(gb.meanRows(s.rows, s.k, ids)));
	const meaning = gb.cosineRows(Float64Array.from(means), s.k, qv);
	return NOTICES.map((text, i) => ({ i, text, keyword: keyword[i], meaning: meaning[i] }));
}

// at every number of dimensions: how often a word's 3 nearest share its topic,
// and how often searching by meaning puts the right notice first
export function curve(gb, learned) {
	return DIMS.map((k) => {
		const s = space(gb, learned, k);
		const firsts = QUESTIONS.filter((q) => {
			const r = search(gb, s, q.text);
			return r.reduce((a, b) => (b.meaning > a.meaning ? b : a)).i === q.right;
		}).length;
		return { k, topics: gb.neighbourAgreement(s.rows, k, LABELS, 3), search: firsts / QUESTIONS.length };
	});
}
