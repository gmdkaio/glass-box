// Plain-language text for the memory page.
// Claims are checked against the sources below; anything still unsourced is marked Draft copy on the page.
// Sources, checked 2026-10-06:
//   llama.cpp flags and defaults: https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md
//   Quantized V cache needs flash attention: llama.cpp src/llama-context.cpp
//   Ollama context by VRAM: https://github.com/ollama/ollama/blob/main/docs/context-length.mdx
//   Ollama q8_0 cache: https://github.com/ollama/ollama/blob/main/docs/faq.mdx
//   Qwen3 shapes: https://huggingface.co/Qwen/Qwen3-8B/blob/main/config.json
//   llama.cpp compute buffer, 8B at 512 tokens (258.5 MiB): https://huggingface.co/legraphista/Meta-Llama-3.1-8B-Instruct-IMat-GGUF/blob/6a31be1a2d8a11245c4f418df83fde6a295d80f9/imatrix.log
//   OLLAMA_GPU_OVERHEAD, default 0: https://github.com/ollama/ollama/blob/main/envconfig/config.go

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
		text: 'The Qwen3 models here read with 32 or 64 heads but keep only 8 sets of keys and values (grouped-query attention). That cuts the cache by four to eight times.'
	}
];

export const trapCard =
	'A model that loads feels like the hard part is over. Then a long chat or a pasted document fills the cache, and the same model slows to a crawl or stops.';

export const why = [
	{
		title: 'Set the context you need',
		text: 'Runners reserve the cache for the full context you set (num_ctx in Ollama, --ctx-size in llama.cpp). Ollama picks 4k, 32k or 256k by default from your graphics memory. Setting 128k when your chats are 8k wastes memory you could spend on a bigger model.'
	},
	{
		title: 'Store the cache in 8 bits',
		text: 'An 8-bit cache halves its size for a small loss. In llama.cpp it is --cache-type-k and --cache-type-v, and an 8-bit value cache needs flash attention, which recent builds turn on for you. In Ollama it is the OLLAMA_KV_CACHE_TYPE setting.'
	},
	{
		title: 'Leave room for the chat',
		text: 'A rough rule this page uses: pick a model whose numbers take about two thirds of the card. The rest goes to the cache and the runtime.'
	},
	{
		title: 'Watch for spilling',
		text: 'If words suddenly come out much slower, part of the model has moved to ordinary memory. Shorten the context or use fewer bits.'
	}
];

export const whyLead = 'Memory decides which model you can run and how long you can talk to it. A few settings move the limit a long way.';

export const whyDraft =
	'Checked on 2026-10-07 against the llama.cpp server docs and source, Ollama\'s FAQ, context-length docs and settings, and the Qwen3 configs. The 0.5 GB runtime overhead and the two-thirds rule are this page\'s own assumptions. A llama.cpp log for an 8B model shows a 0.26 GB working buffer at a 512-token context, and that buffer grows with the batch and context. Ollama reserves no extra by default (OLLAMA_GPU_OVERHEAD is 0).';

export const hoodNote =
	'Real runners add a little more: buffers that grow with the batch size, and some models that store a few layers at higher precision. The two big terms are the ones on this page. Your screen and other programs also use some of the card, and popular 4-bit files such as Q4_K_M mix precisions and average closer to 5 bits per number.';

export const next = [
	{
		title: 'Next: embeddings',
		text: 'The cache keeps keys and values worked out from each token. They all start from one list of numbers per token, looked up in a table: its embedding.'
	},
	{
		title: 'Then: sampling settings',
		text: 'At the other end, the model turns its numbers back into odds for every token. Settings decide which one it picks.'
	}
];
