// Settings and text for the tokenization page. The merges, the tokens and every
// count come from the engine; this file only turns bytes back into text to show.

import { CORPUS } from '$lib/tokenization-corpus.js';

export { CORPUS };

// training stops on its own when no pair repeats, well before this
const MOST_MERGES = 3000;
export const MAX_TEXT = 400;

export const SAMPLES = [
	{ label: 'An everyday sentence', hint: 'common English words', text: 'The weather will be warmer tomorrow, with some sun in the morning and clouds later in the day.' },
	{ label: 'A word to spell', hint: 'the question models famously miss', text: "How many r's are in strawberry?" },
	{ label: 'Some numbers', hint: 'a sum with long numbers', text: 'What is 12,450 + 1,234,567?' },
	{ label: 'Another language', hint: 'the weather sentence in Portuguese', text: 'Amanhã vai fazer mais calor, com um pouco de sol de manhã e nuvens mais para o fim do dia.' }
];

// one sentence, said the same way in each language
export const LANGUAGES = [
	{ name: 'English', text: SAMPLES[0].text },
	{ name: 'Portuguese', text: SAMPLES[3].text },
	{ name: 'Spanish', text: 'Mañana hará más calor, con algo de sol por la mañana y nubes más tarde.' },
	{ name: 'German', text: 'Morgen wird es wärmer, mit etwas Sonne am Morgen und Wolken im Laufe des Tages.' },
	{ name: 'Greek', text: 'Αύριο θα κάνει πιο ζέστη, με λίγο ήλιο το πρωί και σύννεφα αργότερα μέσα στη μέρα.' },
	{ name: 'Japanese', text: '明日はもっと暖かくなり、朝は少し晴れて、午後からは曇るでしょう。' },
	{ name: 'Hindi', text: 'कल मौसम ज़्यादा गर्म रहेगा, सुबह थोड़ी धूप और दिन में बाद में बादल रहेंगे।' }
];

const utf8 = new TextEncoder();
const strict = new TextDecoder('utf-8', { fatal: true });

export const byteLength = (text) => utf8.encode(text).length;
export const charLength = (text) => [...text].length;

// the merges, learned once from the corpus
export function train(gb) {
	return gb.bpeTrain(CORPUS, MOST_MERGES);
}

const lenient = new TextDecoder();
const visible = (s) => s.replace(/ /g, '·').replace(/\n/g, '↵');

// How a token reads on screen: spaces become a visible dot. A token that holds
// only some bytes of a letter shows ◌ for them, and part says which letter and
// which of its bytes.
function label(bytes, start, chars) {
	try {
		return { text: visible(strict.decode(bytes)), part: null };
	} catch {
		let k = 0;
		while (k < bytes.length && chars[start + k].byte === 1 && k + chars[start + k].of <= bytes.length) k += chars[start + k].of;
		return { text: visible(lenient.decode(bytes).replace(/�/g, '◌')), part: chars[start + k] };
	}
}

// for every byte of text, the character it belongs to and its place in it
function charsByByte(text) {
	const out = [];
	for (const c of text) {
		const n = utf8.encode(c).length;
		for (let k = 0; k < n; k++) out.push({ char: c, byte: k + 1, of: n });
	}
	return out;
}

// The tokens of text with the first `merges` merges: the number the model gets,
// what it reads as, and which bytes of the text it covers.
export function pieces(gb, pairs, text, merges) {
	const ids = gb.bpeEncode(text, pairs, merges);
	const chars = charsByByte(text);
	let at = 0;
	return Array.from(ids, (id, i) => {
		const bytes = gb.bpeTokenBytes(pairs, id);
		const shown = label(bytes, at, chars);
		const piece = { i, id, start: at, size: bytes.length, ...shown };
		at += bytes.length;
		return piece;
	});
}

// tokens for each language at every number of merges
export function languageCurves(gb, pairs) {
	return LANGUAGES.map((l) => ({ ...l, chars: charLength(l.text), bytes: byteLength(l.text), curve: gb.bpeCurve(l.text, pairs, pairs.length / 2) }));
}

// The steps a word goes through as the merges are applied: one entry for each
// merge that changes it.
export function buildUp(gb, pairs, word, merges) {
	const curve = gb.bpeCurve(word, pairs, merges);
	const steps = [{ k: 0, pieces: pieces(gb, pairs, word, 0) }];
	for (let k = 1; k < curve.length; k++)
		if (curve[k] < curve[k - 1]) steps.push({ k, pieces: pieces(gb, pairs, word, k) });
	return steps;
}

// the first few merges, as text
export function firstMerges(gb, pairs, count) {
	const dec = new TextDecoder();
	const show = (t) => dec.decode(gb.bpeTokenBytes(pairs, t)).replace(/ /g, '·');
	const out = [];
	for (let k = 0; k < Math.min(count, pairs.length / 2); k++)
		out.push({ k, a: show(pairs[2 * k]), b: show(pairs[2 * k + 1]), made: show(256 + k) });
	return out;
}

// what kind of text this is, for the plain-language reading of it
export function traits(text) {
	return {
		digits: /\d{3,}/.test(text),
		foreign: /[^\x00-\x7f]/.test(text),
		letters: /\b(how many|count)\b/i.test(text) || /strawberr/i.test(text)
	};
}
