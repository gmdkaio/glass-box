// Data for the sampling settings page. The scores of the two spots are made up,
// and the reply model is counted from a short made-up text; every odds, cut,
// reply and curve is the engine's.

export { percent } from './sampling-sim.js';
import { range } from './motion.svelte.js';

// Two places in a sentence. At the first one word clearly fits; at the second
// many do. bad marks words that make no sense there.
export const SPOTS = [
	{
		label: 'Sure',
		hint: 'one word clearly fits',
		text: 'The bus from Millbrook to Ashford leaves from the bus',
		words: ['station', 'stop', 'depot', 'shelter', 'garage', 'lane', 'yard', 'park', 'road', 'queue', 'Ashford', 'banana', 'of', 'purple', 'sang', 'very'],
		scores: Float64Array.from([7.2, 5.6, 3.4, 2.9, 2.6, 2.5, 2.4, 2.3, 2.2, 2.1, 1.7, 1.6, 1.5, 1.4, 1.3, 1.2]),
		bad: 10
	},
	{
		label: 'Open',
		hint: 'many words fit',
		text: 'On Saturdays the market in Millbrook sells',
		words: ['fresh', 'bread', 'cheese', 'fish', 'apples', 'flowers', 'honey', 'eggs', 'plants', 'old', 'local', 'cakes', 'jam', 'banana', 'sang', 'very'],
		scores: Float64Array.from([2.6, 2.5, 2.4, 2.3, 2.2, 2.1, 2.0, 1.9, 1.8, 1.7, 1.6, 1.5, 1.4, 0.2, 0.0, -0.2]),
		bad: 13
	}
];
// words from index `bad` on make no sense at that spot
export const isBad = (spot, i) => i >= spot.bad;

export const OFF = { topK: 0, topP: 1, minP: 0 };
export const DEFAULTS = { temperature: 0.8, topK: 5, topP: 1, minP: 0, penalty: 1.1 };
export const DRAWS = 1000;
export const CUT_NAMES = ['', 'top-k', 'top-p', 'min-p'];

// the x axis of each filter's chart, and where "off" sits on it
export const FILTERS = [
	{ key: 'topK', name: 'top-k', xs: range(1, 16, 16), off: 16, ticks: [1, 5, 10, 16], fmt: (v) => String(Math.round(v)) },
	{ key: 'topP', name: 'top-p', xs: range(0.5, 1, 26), off: 1, ticks: [0.5, 0.75, 1], fmt: (v) => v.toFixed(2) },
	{ key: 'minP', name: 'min-p', xs: range(0, 0.3, 31), off: 0, ticks: [0, 0.1, 0.2, 0.3], fmt: (v) => v.toFixed(2) }
];

// words kept by one filter on its own, at each point of its axis, for both spots
export function keptCurves(gb) {
	return FILTERS.map((f) =>
		SPOTS.map((spot) => {
			const p = gb.softmax(spot.scores, 1);
			return f.xs.map((x) => gb.filter(f.key, p, f.key === 'topK' ? Math.round(x) : x).kept);
		})
	);
}

// The text the reply model is counted from: which word follows which.
export const CORPUS = `The bus from Millbrook leaves at nine and comes back at six.
The first bus to Ashford leaves from the bus station at seven.
The last bus from Ashford comes back to Millbrook after ten.
The bus stops at the market, the bridge and the station.
On Saturdays the market in Millbrook sells fresh bread, cheese and fish.
The market sells apples, honey and flowers from the farms near Ashford.
The bakery in Millbrook sells fresh bread and cakes in the morning.
The driver of the bus checks every ticket at the station.
A ticket to Ashford costs two coins and the driver sells it on the bus.
The river runs under the bridge and past the market in Millbrook.
In the morning the square is quiet and the bakery is warm.
In the evening the market closes and the last bus leaves the square.
The station in Millbrook has a cafe that sells tea and cakes.
People from Ashford come to the market in Millbrook on Saturdays.
The farms near Ashford send apples, eggs and honey to the market.
The bus to the farms leaves from the square at eight.
The old bridge in Millbrook is closed to the bus in winter.
In winter the bus goes round by the station and the river.
The cafe at the station opens at seven and closes at ten.
The fish at the market comes from the river near Ashford.`;

// lower-case words, with a full stop as a word of its own
function split(text) {
	return text.toLowerCase().match(/[a-z]+|\./g) ?? [];
}
const TEXT = split(CORPUS);
export const VOCAB = [...new Set(TEXT)];
const INDEX = new Map(VOCAB.map((w, i) => [w, i]));
export const IDS = Int32Array.from(TEXT.map((w) => INDEX.get(w)));
export const START = Int32Array.from(split('The bus from Millbrook').map((w) => INDEX.get(w)));

export const REPLY = 60; // words in a reply, the start included
export const LAST_N = 64; // repeat_last_n: how far back the penalty looks
export const BASE = 6; // a real model's scores are large; the penalty divides them
export const UNLIKELY = 0.1; // a pick the model rated below this is an odd one
export const RUNS = 20; // replies averaged for each point of the penalty curve
export const PENALTIES = range(1, 2, 11);

const NAMES = new Set(['millbrook', 'ashford', 'saturdays']);

// word numbers back to text: capitals after a full stop and on names
export function words(ids) {
	let cap = true;
	return Array.from(ids, (id) => {
		const w = VOCAB[id];
		const shown = cap || NAMES.has(w) ? w[0].toUpperCase() + w.slice(1) : w;
		cap = w === '.';
		return shown;
	});
}

// which words sit in a run of three that already appeared earlier in the reply
export function repeats(ids) {
	const mark = new Array(ids.length).fill(false);
	const seen = new Set();
	for (let i = 0; i + 3 <= ids.length; i++) {
		const key = `${ids[i]},${ids[i + 1]},${ids[i + 2]}`;
		if (seen.has(key)) mark[i] = mark[i + 1] = mark[i + 2] = true;
		seen.add(key);
	}
	return mark;
}
