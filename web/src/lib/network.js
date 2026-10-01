// The tiny neural network on the how-it-works page. The engine holds all the
// maths; these helpers only pick what to draw and keep the state tidy.

export const HIDDEN = 8; // hidden units
export const RATE = 0.1;
export const EPOCHS_PER_STEP = 6; // passes over the text for each frame of the teaching animation
export const TEACH_STEPS = 40;
export const INPUTS_SHOWN = 10;
export const OUTPUTS_SHOWN = 8;

// a network that has not learned anything yet
export function newNet(gb, model) {
	const params = gb.nnInit(model.vocab, HIDDEN, 1);
	return { params, epochs: 0, losses: [gb.nnLoss(params, model.vocab, HIDDEN, model.ids)] };
}

// one frame of teaching: a few passes over the text
export function teachStep(gb, model, net) {
	const r = gb.nnTrain(net.params, model.vocab, HIDDEN, model.ids, EPOCHS_PER_STEP, RATE);
	return {
		params: r.params,
		epochs: net.epochs + EPOCHS_PER_STEP,
		losses: [...net.losses, r.loss]
	};
}

// what the network does with one input word: the hidden values and the odds
export function view(gb, model, net, word) {
	return gb.nnForward(net.params, model.vocab, HIDDEN, word);
}

// how many numbers the network learns
export function paramCount(model) {
	return model.vocab * HIDDEN + HIDDEN + HIDDEN * model.vocab + model.vocab;
}

// where the numbers sit inside the params array
export function w1(net, model, word, j) {
	return net.params[word * HIDDEN + j];
}

export function w2(net, model, j, k) {
	return net.params[model.vocab * HIDDEN + HIDDEN + j * model.vocab + k];
}

// writes a whole sentence with the network, as a list of word numbers
export function writeSentenceNet(gb, model, net, seed, maxWords) {
	const out = [];
	let current = model.start;
	for (let i = 0; i < maxWords; i++) {
		const { odds } = view(gb, model, net, current);
		const next = gb.sample(odds, 1, seed * 100 + i).findIndex((c) => c === 1);
		out.push(next);
		if (next === model.start) break;
		current = next;
	}
	return out;
}

// the words drawn on the input side: the current one, then the most common
export function inputWords(model, current) {
	const others = model.words
		.map((_, id) => id)
		.filter((id) => id !== current)
		.sort((a, b) => model.freq[b] - model.freq[a] || a - b);
	return [current, ...others.slice(0, INPUTS_SHOWN - 1)];
}

// the words drawn on the output side: the likeliest, and the one that was picked
export function outputWords(odds, picked) {
	const order = odds.map((_, id) => id).sort((a, b) => odds[b] - odds[a] || a - b);
	const top = order.slice(0, OUTPUTS_SHOWN);
	if (picked != null && !top.includes(picked)) top[top.length - 1] = picked;
	return top;
}
