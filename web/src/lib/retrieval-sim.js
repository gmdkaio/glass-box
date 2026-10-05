// Settings and text for the retrieval page. Turning text into word numbers is
// done here; every score, rank and share comes from the engine.

export { percent } from './sampling-sim.js';

// a handbook for a made-up town, so no real fact on the page can be wrong
export const PAGES = [
	{ title: 'Buses, 2024 timetable', text: 'Buses to the city leave from the market square at 7:15, 8:45 and 10:30 on weekdays. A single ticket costs 2.50 for adults and 1.25 for children.' },
	{ title: 'Buses, 2019 timetable', old: true, text: 'Buses to the city leave from the market square at 6:45 and 9:00 on weekdays.' },
	{ title: 'Library hours', text: 'The library opens at 9:00 and closes at 18:00, Monday to Saturday. It lends about 250 books a day.' },
	{ title: 'Library history', text: 'The town library opened in 1923 in the old corn exchange. It moved to Station Road in 1978.' },
	{ title: 'The new school', text: 'The new school opened in 2021 with 320 pupils. By 2023 it had 410 pupils.' },
	{ title: 'The river', text: 'The river Wend is 120 kilometres long. In 2022 it fell to its lowest level in 50 years.' },
	{ title: 'Market', text: 'Market day is Saturday. Stalls open at 8:00 in the square and close at 14:00.' },
	{ title: 'Parking', text: 'Parking in the square is free on Sundays. On other days it costs 1.00 an hour.' },
	{ title: 'Recycling', text: 'Recycling is collected every other Tuesday. Glass goes in the green box.' },
	{ title: 'Swimming pool', text: 'The swimming pool opens at 6:30 for early lanes and closes at 21:00.' },
	{ title: 'Town hall', text: 'The town hall is open on weekdays from 9:00 to 17:00. The council meets on the first Monday of each month.' },
	{ title: 'Train station', text: 'Trains to the coast leave every hour from platform 2. The ticket office closes at 19:00.' },
	{ title: 'Doctor', text: 'The surgery on Mill Lane takes appointments from 8:00. Call before 10:00 for a visit the same day.' },
	{ title: 'Population', text: 'In 2019 the town had 12,450 people, and by 2024 there were 13,120.' },
	{ title: 'Bus history', text: 'Bus services began in 1931, run by a single driver with one coach.' },
	{ title: 'Library events', text: 'The library runs a reading club for children every Saturday morning.' }
];

// Five questions, each asked two ways: with the page's own words, and with
// other words for the same thing. answers: what the model would say from each
// page that touches the question.
export const QUESTIONS = [
	{
		short: 'first bus',
		page: 0,
		same: 'When does the first bus to the city leave?',
		other: 'What time is the earliest coach into town?',
		answers: { 0: '7:15', 1: '6:45', 14: '1931' }
	},
	{
		short: 'library opened',
		page: 3,
		same: 'In what year did the town library open?',
		other: 'When was the public reading room founded?',
		answers: { 3: '1923', 2: '9:00', 15: 'every Saturday' }
	},
	{
		short: 'school pupils',
		page: 4,
		same: 'How many pupils did the new school start with?',
		other: 'How many children were at the new academy at first?',
		answers: { 4: '320', 0: '1.25', 15: 'every Saturday' }
	},
	{
		short: 'river length',
		page: 5,
		same: 'How long is the river?',
		other: 'How far does the stream run?',
		answers: { 5: '120 kilometres' }
	},
	{
		short: 'market day',
		page: 6,
		same: 'Which day is market day?',
		other: 'When are the stalls set up in the square?',
		answers: { 6: 'Saturday', 7: 'free on Sundays' }
	}
];

// three ways in, as presets
export const SETUPS = [
	{ label: 'Words match the page', hint: 'the question uses the page’s own words', question: 2, wording: 'same', meaning: false, old: true, k: 3 },
	{ label: 'Different words', hint: 'same question, everyday words', question: 0, wording: 'other', meaning: false, old: true, k: 3 },
	{ label: 'An old page in the pile', hint: 'last timetable still in the documents', question: 0, wording: 'same', meaning: false, old: true, k: 3 }
];

export const MAX_K = 8;
export const TEMPERATURE = 1.5; // how evenly the model reads the pages it gets

// a search by meaning knows these mean the same; it adds the page's word at a lower weight
const MEANING = {
	earliest: 'first',
	coach: 'bus',
	town: 'city',
	time: 'leave',
	reading: 'library',
	room: 'library',
	founded: 'opened',
	academy: 'school',
	children: 'pupils',
	first: 'start',
	far: 'long',
	stream: 'river',
	run: 'long',
	stalls: 'market',
	set: 'day'
};
const MEANING_WEIGHT = 1;

const STOP = new Set(
	'a an and are at by did do does each every for from goes had has how in is it its of on or other the there to was were what when where which with'.split(' ')
);

// a plain plural made singular: buses to bus, pupils to pupil
function singular(w) {
	if (w.length > 4 && /(s|x|ch|sh)es$/.test(w)) return w.slice(0, -2);
	if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1);
	return w;
}

// lower case, letters and digits only, a plain plural made singular, small words dropped
export function words(text) {
	return (text.toLowerCase().match(/[a-z0-9:.,]+/g) ?? [])
		.map((w) => w.replace(/[.,]+$/, ''))
		.map(singular)
		.filter((w) => w && !STOP.has(w));
}

// the word list shared by the pages and the question
function vocabulary() {
	const vocab = new Map();
	for (const p of PAGES) for (const w of words(p.title + ' ' + p.text)) if (!vocab.has(w)) vocab.set(w, vocab.size);
	return vocab;
}
const VOCAB = vocabulary();
const PAGE_IDS = PAGES.map((p) => words(p.title + ' ' + p.text).map((w) => VOCAB.get(w)));

// the question as word numbers, with weights; meaning adds related page words
export function queryOf(text, meaning) {
	const ids = [];
	const weights = [];
	for (const w of words(text)) {
		if (VOCAB.has(w)) {
			ids.push(VOCAB.get(w));
			weights.push(1);
		}
		if (meaning && MEANING[w] && VOCAB.has(MEANING[w])) {
			ids.push(VOCAB.get(MEANING[w]));
			weights.push(MEANING_WEIGHT);
		}
	}
	return { ids, weights };
}

// One search: every page's score, its rank, whether it is handed to the model,
// and the chance the model answers from it.
export function search(gb, text, meaning, old, k) {
	const shown = PAGES.map((p, i) => i).filter((i) => old || !PAGES[i].old);
	const { ids, weights } = queryOf(text, meaning);
	const scores = gb.bm25(
		shown.map((i) => PAGE_IDS[i]),
		VOCAB.size,
		ids,
		weights
	);
	return shown
		.map((page, j) => ({
			page,
			score: scores[j],
			rank: gb.rankOf(scores, j),
			handed: gb.rankOf(scores, j) < k && scores[j] > 0,
			share: scores[j] > 0 ? gb.pickShare(scores, j, k, TEMPERATURE) : 0
		}))
		.sort((a, b) => a.rank - b.rank);
}

// What the model is most likely to say: the answer from the page it most likely reads.
export function answer(results, q) {
	const top = results.filter((r) => r.handed).sort((a, b) => b.share - a.share)[0];
	if (!top) return { text: null, page: null, right: false };
	const text = q.answers[top.page] ?? null;
	return { text, page: top.page, right: top.page === q.page };
}

// for one question: was its page handed over, and how likely is a right answer
export function outcome(gb, q, wording, meaning, old, k) {
	const r = search(gb, q[wording], meaning, old, k).find((x) => x.page === q.page);
	return { handed: !!r && r.handed, right: r ? r.share : 0 };
}

// both, averaged over the five questions, for every number of pages handed over
export function curve(gb, wording, meaning, old) {
	return Array.from({ length: MAX_K }, (_, i) => {
		const outs = QUESTIONS.map((q) => outcome(gb, q, wording, meaning, old, i + 1));
		return {
			k: i + 1,
			handed: outs.filter((o) => o.handed).length / outs.length,
			right: outs.reduce((s, o) => s + o.right, 0) / outs.length
		};
	});
}
