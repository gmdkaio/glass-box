// Plain-language text for the LoRA page.
// Claims are checked against the sources below; anything still unsourced is marked Draft copy on the page.
// Sources, checked 2026-10-06:
//   PEFT LoraConfig defaults (r=8): https://github.com/huggingface/peft/blob/main/src/peft/tuners/lora/config.py
//   Unsloth rank and alpha: https://unsloth.ai/docs/get-started/fine-tuning-llms-guide/lora-hyperparameters-guide
//   Unsloth Qwen3 notebooks (r=32): https://github.com/unslothai/notebooks
//   QLoRA, all linear layers: Dettmers et al. 2023, https://arxiv.org/abs/2305.14314
//   LoRA: Hu et al. 2021, https://arxiv.org/abs/2106.09685

export function say(gain, label) {
	if (gain >= 0.97) return `For ${label.toLowerCase()}, this rank gets nearly everything a full fine-tune does.`;
	if (gain >= 0.85) return 'Most of the gain is there. A step up in rank closes the rest.';
	return 'The patch is too thin for this much change. Raise the rank and watch the gain climb.';
}

export function trap(r, t) {
	if (t === 2 && r === 1) return 'One direction cannot hold new facts and new words at once. A lot to learn needs a few more.';
	if (r >= 8) return 'On this tiny network a high rank trains almost as many numbers as a full fine-tune. On a real model, rank 16 is still a sliver of it: see the Qwen3 line.';
	return 'Compare the three texts: the small changes reach the top at rank 1 or 2, while a lot to learn needs more.';
}

export const parts = [
	{
		title: 'Fine-tuning changes the numbers',
		text: 'Training on new text nudges the model\'s numbers so the new text becomes less surprising. A full fine-tune nudges every one of them.'
	},
	{
		title: 'LoRA trains a thin patch',
		text: 'LoRA keeps the model as it is. Next to each layer it trains two thin strips, B and A, and adds their product to the layer\'s numbers.'
	},
	{
		title: 'Rank is the patch\'s width',
		text: 'The rank is how many directions the patch can change things in. A small change lives in a few directions, so a low rank holds most of it.'
	}
];

export const trapCard =
	'LoRA shrinks what you train and save. The whole model still has to load, in memory and at its own precision, with the patch on top.';

export const why = [
	{
		title: 'Start at rank 16',
		text: 'PEFT defaults to rank 8 and Unsloth to 16, and Unsloth\'s Qwen3 notebooks use 32. Raise it only if a held-out check shows the model is still missing what you taught it.'
	},
	{
		title: 'Patch every layer',
		text: 'Patching the feed-forward layers as well as attention usually helps, at a few times the trained numbers. It is still a small share of the model.'
	},
	{
		title: 'Adapters are small files',
		text: 'A rank-16 patch on every weight of Qwen3-8B is about 44 million numbers, under 100 MB at 16 bits, so you can keep one per task and swap them on the same base model.'
	},
	{
		title: 'Mind the scale',
		text: 'Tools also ask for alpha, which scales the patch. A common start is alpha equal to the rank or twice it; change rank and alpha together.'
	}
];

export const whyLead = 'Tools like Unsloth, Axolotl and the PEFT library run LoRA for you. A few settings decide how it goes.';

export const whyDraft =
	'Checked on 2026-10-06 against PEFT\'s LoraConfig, Unsloth\'s docs, library defaults and Qwen3 notebooks, the QLoRA paper (Dettmers et al., 2023) on patching every layer, and the Qwen3-8B config for the adapter size.';

export const hoodNote =
	'Real fine-tunes run on models with thousands of hidden numbers and many layers, with alpha scaling the patch; here the network has 16 hidden numbers and two layers, and alpha is 1. The base model only knows which word follows which, from twenty sentences, and it trains with plain steps. Real LoRA patches the attention and feed-forward weights inside each layer, usually leaves the token table alone, and trains with AdamW at rates around 0.0002.';

export const next = [
	{
		title: 'Next: learning rate',
		text: 'Every fine-tune here took the same step size. How big a step should be, and why too big a step ruins a model.'
	},
	{
		title: 'Then: overfitting',
		text: 'Train too long on too little text and the model learns it by heart, forgetting what it knew.'
	}
];
