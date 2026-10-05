// Settings for the memory page. Every size comes from the engine; this file holds
// the model shapes and turns bytes into readable numbers.

// Shapes from each model's config.json and model card on Hugging Face, checked
// 2026-10-05. All three take 32,768 tokens natively, 131,072 with YaRN.
export const MODELS = [
	{ name: 'Qwen3-4B', params: 4.0e9, layers: 36, kvHeads: 8, headDim: 128 },
	{ name: 'Qwen3-8B', params: 8.2e9, layers: 36, kvHeads: 8, headDim: 128 },
	{ name: 'Qwen3-32B', params: 32.8e9, layers: 64, kvHeads: 8, headDim: 128 }
];
export const NATIVE = 32768;

export const BITS = [2, 3, 4, 5, 6, 8, 16];
export const CONTEXTS = [1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072];
export const CARDS = [6, 8, 12, 16, 24, 32, 48]; // GB of memory on the graphics card
export const GIB = 1024 ** 3;
export const OVERHEAD = 0.5 * GIB; // the runtime's own buffers, roughly
const SCALE_BITS = 0.5; // what quantized formats store per number for their scale factors

export const SETUPS = [
	{ label: 'A 4B on a laptop', hint: '8 GB of graphics memory', model: 0, bits: 4, context: 8192, card: 8 },
	{ label: 'An 8B on a gaming card', hint: '12 GB, a long chat', model: 1, bits: 4, context: 32768, card: 12 },
	{ label: 'A 32B on a 24 GB card', hint: 'the biggest model that loads', model: 2, bits: 4, context: 32768, card: 24 }
];

// Everything one setup needs, in bytes, and what is left on the card.
export function budget(gb, model, bits, context, card, cacheBits) {
	const m = MODELS[model];
	const weights = gb.memWeights(m.params, bits, bits < 16 ? SCALE_BITS : 0);
	const cache = gb.memKv(m.layers, m.kvHeads, m.headDim, context, cacheBits);
	const total = weights + cache + OVERHEAD;
	return {
		weights,
		cache,
		overhead: OVERHEAD,
		total,
		card: card * GIB,
		fits: total <= card * GIB,
		perToken: gb.memKv(m.layers, m.kvHeads, m.headDim, 1, cacheBits),
		maxTokens: gb.memMaxTokens(card * GIB, weights, OVERHEAD, m.layers, m.kvHeads, m.headDim, cacheBits)
	};
}

// the longest chat that fits at each precision of the model's numbers
export function byBits(gb, model, card, cacheBits) {
	return BITS.map((bits) => ({ bits, maxTokens: budget(gb, model, bits, 1, card, cacheBits).maxTokens }));
}

// total memory at every context length, with a 16-bit and an 8-bit cache
export function byContext(gb, model, bits) {
	return CONTEXTS.map((context) => ({
		context,
		full: budget(gb, model, bits, context, 1, 16).total,
		half: budget(gb, model, bits, context, 1, 8).total
	}));
}

// the context cache per token, for each model
export function perToken(gb, cacheBits) {
	return MODELS.map((m) => gb.memKv(m.layers, m.kvHeads, m.headDim, 1, cacheBits));
}

// 1 decimal for GB, and token counts as 8k, 32k
export const gbOf = (bytes) => (bytes / GIB).toFixed(1) + ' GB';
export const kbOf = (bytes) => Math.round(bytes / 1024) + ' KB';
export function tokens(n) {
	if (n >= 1024) return Math.floor(n / 1024) + 'k';
	return String(Math.floor(n));
}
