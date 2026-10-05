// Plain-language text for the memory page.
// The claims here are drafts and each one needs a source before release.

export function say(fits, free, card) {
	if (!fits) return 'It does not fit. Runners like llama.cpp and Ollama then keep part of the model in ordinary memory, and it gets much slower, or they refuse to load it.';
	if (free / card < 0.1) return 'It fits, with little to spare. A longer chat or a bigger document will push it over.';
	return 'It fits, with room left for a longer chat.';
}

export function trap({ fits, weightsOnly, cacheShare }) {
	if (weightsOnly) return 'The model\'s numbers alone fill the card. Fewer bits per number is the only way in.';
	if (!fits) return 'The model itself fits. The conversation is what pushes it over: shorten the context, or store the cache in 8 bits.';
	if (cacheShare > 0.4) return 'At this length the conversation takes up more of the card than a large part of the model does. Long chats cost real memory.';
	return 'Memory goes to two things: the model\'s numbers, set once when it loads, and a cache that grows with every token.';
}

export const parts = [
	{
		title: 'Two things fill the card',
		text: 'The model\'s numbers take a fixed amount, set by its size and how many bits each number gets. The context cache grows with the conversation.'
	},
	{
		title: 'The cache grows with every token',
		text: 'For each token the model keeps a key and a value in every layer, so it does not have to reread the whole chat for the next word. Twice the context, twice the cache.'
	},
	{
		title: 'Shared heads, smaller cache',
		text: 'Qwen3 models read with 32 or 64 heads but keep only 8 sets of keys and values (grouped-query attention). That cuts the cache by four to eight times.'
	}
];

export const trapCard =
	'A model that loads feels like the hard part is over. Then a long chat or a pasted document fills the cache, and the same model slows to a crawl or stops.';

export const why = [
	{
		title: 'Set the context you need',
		text: 'Runners reserve the cache for the full context you set (num_ctx in Ollama, --ctx-size in llama.cpp). Setting 128k when your chats are 8k wastes memory you could spend on a bigger model.'
	},
	{
		title: 'Store the cache in 8 bits',
		text: 'An 8-bit cache halves its size for a small loss. In llama.cpp it is --cache-type-k and --cache-type-v; in Ollama, the KV cache type setting.'
	},
	{
		title: 'Leave room for the chat',
		text: 'Pick a model whose numbers take about two thirds of the card. The rest goes to the cache and the runtime.'
	},
	{
		title: 'Watch for spilling',
		text: 'If words suddenly come out much slower, part of the model has moved to ordinary memory. Shorten the context or use fewer bits.'
	}
];

export const whyLead = 'Memory decides which model you can run and how long you can talk to it. A few settings move the limit a long way.';

export const whyDraft =
	'Draft copy. Before release, check the runner flags and defaults against current llama.cpp and Ollama docs, measure the runtime overhead (set here at 0.5 GB) for a few cards, and source the quality cost of an 8-bit cache.';

export const hoodNote =
	'Real runners add a little more: buffers that grow with the batch size, and some models that store a few layers at higher precision. The two big terms are the ones on this page.';

export const next = [
	{
		title: 'Next: embeddings',
		text: 'That cache holds one list of numbers per token. Those lists are how the model represents meaning.'
	},
	{
		title: 'Then: sampling settings',
		text: 'At the other end, the model turns its numbers back into odds for every token. Settings decide which one it picks.'
	}
];
