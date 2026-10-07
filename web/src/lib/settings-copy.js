// Plain-language text for the sampling settings page.
// Claims are checked against the sources below; anything still unsourced is marked Draft copy on the page.
// Sources, checked 2026-10-06:
//   Ollama defaults: https://github.com/ollama/ollama/blob/main/docs/modelfile.mdx and api/types.go
//   repeat_penalty 1.1 -> 1.0: https://github.com/ollama/ollama/releases/tag/v0.32.10
//   qwen3 params: https://ollama.com/library/qwen3:8b (params blob)
//   Sampler order: https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md
//   min-p 0.05 to 0.1: Nguyen et al., ICLR 2025, https://arxiv.org/abs/2407.01082
//   Repetition penalty origin (1.2): Keskar et al. 2019, CTRL, https://arxiv.org/abs/1909.05858
//   llama.cpp repeat_penalty (CLI 1.00 off, API docs 1.1, last 64 tokens): https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md
//   Penalty 1.30 breaks code, 1.15 does not: Lazaridis et al. 2026, Sec. 3, https://arxiv.org/abs/2606.13705
//   Qwen3 vocabulary 151,936: https://huggingface.co/Qwen/Qwen3-8B/blob/main/config.json

export function say({ spot, kept, goodCut, badChance }) {
	if (badChance >= 0.01) return 'Nothing cuts the words that make no sense, and with every reply they get another chance.';
	if (goodCut >= 3 && spot === 'Open') return 'The words that make no sense are gone, but so are words that fit perfectly well.';
	if (kept >= 5 && spot === 'Sure') return 'One word clearly fits here, yet the model still keeps a handful of weaker ones in the draw.';
	return 'The cut fits this spot: the weak words are gone and the good ones are left.';
}

export function trap({ topK, minP, spot }) {
	if (topK > 0 && minP === 0)
		return spot === 'Open'
			? 'top-k keeps the same number of words everywhere. Switch to Sure and it keeps five there too, while one would do.'
			: 'top-k keeps the same number of words everywhere. Switch to Open and the same five cut most of the good choices.';
	if (minP > 0) return 'min-p sets the bar as a share of the top word, so it keeps few words when the model is sure and many when it is not.';
	return 'Each setting cuts the list in its own way. Watch the three charts: the two lines for top-k stay together, while min-p pulls them apart.';
}

export const penaltyNote = (p) =>
	p <= 1.0
		? 'repeat_penalty 1.0 is off. At a low temperature the reply soon goes round in circles.'
		: p < 1.3
			? 'A mild penalty breaks the circles and keeps the reply on the subject.'
			: 'A strong penalty also punishes words the reply needs, like "the" and the full stop, so it reaches for words the model rated low.';

export const parts = [
	{
		title: 'Cut, then share out',
		text: 'Each filter drops words from the list before the draw. The odds of the dropped words are shared out among the words that are left, so those come up more often.'
	},
	{
		title: 'Three ways to cut',
		text: 'top-k keeps a fixed number of words. top-p keeps the top words until their odds add up to a share. min-p keeps every word with at least a share of the top word\'s odds.'
	},
	{
		title: 'Lower what was said',
		text: 'repeat_penalty lowers the score of every word already in the recent reply. It is applied first, before the filters and the temperature.'
	}
];

export const trapCard =
	'A filter can only remove words. If the right word is not near the top, no setting brings it back, and a strong repeat penalty can push the right word down when the reply needs it again, like a name or a full stop.';

export const why = [
	{
		title: 'Start from the defaults',
		text: 'Ollama starts at temperature 0.8, top_k 40, top_p 0.9 and min_p 0, with repeat_penalty off (1.0) since version 0.32.10. Many models in its library ship their own: qwen3 uses temperature 0.6, top_k 20 and top_p 0.95. Change one setting at a time, and compare a few replies each time.'
	},
	{
		title: 'Try min-p',
		text: 'min-p around 0.05 to 0.1 follows how sure the model is. Many local setups use it with top-k and top-p switched off (top_k 0, top_p 1).'
	},
	{
		title: 'Keep the penalty mild',
		text: 'If replies loop, a small repeat_penalty such as 1.05 to 1.1 is a common first try. Code, lists and names repeat on purpose, so a strong penalty hurts them first.'
	},
	{
		title: 'Settings do not add knowledge',
		text: 'Sampling settings choose among the words the model already rates well. If the answers are wrong, look at the prompt, the context or the model.'
	}
];

export const whyLead = 'Ollama, llama.cpp and LM Studio let you set these yourself. A few things to know when you do.';

export const whyDraft =
	"Checked on 2026-10-07 against the Ollama docs and its v0.32.10 release, the llama.cpp server docs and the min-p paper (Nguyen et al., 2025). Defaults differ by runner and change between versions. The repeat penalty comes from the CTRL paper (Keskar et al., 2019), which used 1.2. Ollama used 1.1 until v0.32.10, and llama.cpp documents 1.1 for its API while its command line leaves the penalty off. Lazaridis et al. (2026) found that a penalty of 1.30 broke a model's code, while 1.15 left it working.";

export const hoodNote =
	'The order follows llama.cpp: the penalty, then top-k, top-p and min-p on the odds at temperature 1, then the temperature on what is left. Other runners may use another order. Real models score tens of thousands to a few hundred thousand tokens (151,936 for Qwen3), where a top_k of 40 keeps a tiny sliver; 5 of 16 stands in for that here. The reply comes from a model that only knows which word follows which, and it loops far more readily than a real model, though long replies at a low temperature can still repeat.';

export const next = [
	{
		title: 'Next: LoRA',
		text: 'Settings change how the model picks. To change what it knows, you change the model itself, without retraining all of it.'
	},
	{
		title: 'Then: learning rate',
		text: 'How big a step each round of training takes, and why too big a step ruins a model.'
	}
];
