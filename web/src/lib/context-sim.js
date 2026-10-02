// Settings and text for the context page. The scores and every share come from the engine.

export { percent } from '$lib/sampling-sim.js';

export const QUESTION = 'When does the store close on Sundays?';
export const KEY = 'On Sundays the store closes at 6 pm.';

// sentences that match the question almost as well as the answer does
export const LOOKALIKES = [
	'On Saturdays the store closes at 9 pm.',
	'The café next door closes at 5 pm on Sundays.',
	'On public holidays the store closes at 4 pm.',
	'Sunday deliveries stop at noon.',
	'The pharmacy counter closes at 7 pm on weekdays.',
	'In December the store stays open until 10 pm.',
	'The car park closes an hour after the store.',
	'Online orders placed on Sunday ship on Monday.',
	'The outlet store closes at 8 pm on Sundays.',
	'Returns are not accepted after 5 pm.'
];

// the rest of a long pasted document, used in turn
const FILLER = [
	'Returns are accepted within 30 days with a receipt.',
	'Gift cards never expire.',
	'Members get free delivery on orders over $50.',
	'Prices in the weekly flyer are valid from Wednesday.',
	'We price-match local competitors on identical items.',
	'Large items can be delivered within 20 miles.',
	'Our staff can help you load heavy purchases.',
	'Store credit is issued for returns without a receipt.',
	'Bring your own bags to save 5 cents per bag.',
	'Electronics have a 14-day return window.',
	'Assembly service is available for furniture.',
	'Rain checks are offered on sold-out sale items.',
	'Paint can be mixed to match any sample.',
	'The garden centre opens in March.',
	'Seasonal items are restocked every Thursday.',
	'Loyalty points expire after two years.',
	'We accept all major credit cards.',
	'Custom orders take two to three weeks.',
	'Clearance items are final sale.',
	'Free coffee is available near the entrance.',
	'Key cutting is done at the service desk.',
	'Student discounts apply with a valid ID.',
	'Trolleys must stay within the car park.',
	'Pets on a leash are welcome.',
	'Recycling bins for batteries are by the exit.',
	'The service desk handles special orders.',
	'Installation is booked through the website.',
	'Damaged items can be exchanged in store.',
	'Gift wrapping is free in November and December.',
	'Our app shows which aisle each item is in.'
];

export const MAX_SENTENCES = 200;
export const MAX_LOOKALIKES = LOOKALIKES.length;
export const TRIALS = 300;

// the toy's fixed numbers: how well each kind of sentence matches the question
export const SCORE = { key: 4, lookalike: 3.2, spread: 1, dip: 1.5 };

// three ways the same question reaches the model
export const SETUPS = [
	{ label: 'Just the question', hint: 'with the one line that answers it', n: 3, place: 0, lookalikes: 0 },
	{ label: 'A pasted page', hint: 'the opening hours section of the policy', n: 25, place: 0.5, lookalikes: 3 },
	{ label: 'The whole handbook', hint: 'every policy, pasted in full', n: 200, place: 0.5, lookalikes: 8 }
];

// One context: the text of every sentence, which kind it is, its score and its share of attention.
export function sampleContext(gb, n, keyAt, lookalikes, middle, seed) {
	const scores = gb.contextScores(n, keyAt, SCORE.key, SCORE.spread, lookalikes, SCORE.lookalike, middle ? SCORE.dip : 0, seed);
	const share = gb.softmax(scores, 1);
	// look-alikes are the sentences the engine gave exactly the look-alike score, before the dip
	const dip = (i) => (middle && n > 1 ? SCORE.dip * 4 * (i / (n - 1)) * (1 - i / (n - 1)) : 0);
	let alike = 0;
	let filler = 0;
	return Array.from(scores, (s, i) => {
		const kind = i === keyAt ? 'key' : Math.abs(s + dip(i) - SCORE.lookalike) < 1e-9 ? 'lookalike' : 'filler';
		const text = kind === 'key' ? KEY : kind === 'lookalike' ? LOOKALIKES[alike++ % LOOKALIKES.length] : FILLER[filler++ % FILLER.length];
		return { i, kind, text, score: s, share: share[i] };
	});
}

// the average shares of the key, the look-alikes and the rest, over many contexts
export function averageShares(gb, n, keyAt, lookalikes, middle, trials = 60) {
	const sum = { key: 0, lookalike: 0, filler: 0 };
	for (let t = 0; t < trials; t++)
		for (const s of sampleContext(gb, n, keyAt, lookalikes, middle, 1000 + t)) sum[s.kind] += s.share;
	return { key: sum.key / trials, lookalike: sum.lookalike / trials, filler: sum.filler / trials };
}

// the key's average share at every context length, and at every place in the context
const LENGTHS = [1, 2, 3, 5, 8, 12, 20, 30, 50, 80, 120, 200];
export function lengthCurve(gb, place, lookalikes, middle) {
	return LENGTHS.map((n) => ({
		n,
		share: gb.contextShare(n, place, SCORE.key, SCORE.spread, Math.min(lookalikes, n - 1), SCORE.lookalike, middle ? SCORE.dip : 0, TRIALS, 7)
	}));
}

export function placeCurve(gb, n, lookalikes, middle) {
	const points = [];
	for (let k = 0; k <= 20; k++) {
		const place = k / 20;
		points.push({
			place,
			share: gb.contextShare(n, place, SCORE.key, SCORE.spread, lookalikes, SCORE.lookalike, middle ? SCORE.dip : 0, TRIALS, 7)
		});
	}
	return points;
}
