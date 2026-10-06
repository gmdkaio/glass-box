// Plain-language text for the LoRA page.
// The claims here are drafts and each one needs a source before release.

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
		title: 'Start at rank 8 to 16',
		text: 'Most fine-tuning tools default to a rank between 8 and 16. Raise it only if a held-out check shows the model is still missing what you taught it.'
	},
	{
		title: 'Patch every layer',
		text: 'Patching the feed-forward layers as well as attention usually helps, at a few times the trained numbers. It is still a small share of the model.'
	},
	{
		title: 'Adapters are small files',
		text: 'A rank-16 patch for an 8B model is well under a gigabyte, so you can keep one per task and swap them on the same base model.'
	},
	{
		title: 'Mind the scale',
		text: 'Tools also ask for alpha, which scales the patch. A common start is alpha equal to the rank or twice it; change rank and alpha together.'
	}
];

export const whyLead = 'Tools like Unsloth, Axolotl and the PEFT library run LoRA for you. A few settings decide how it goes.';

export const whyDraft =
	'Draft copy. Before release, source the default ranks and alpha in Unsloth, Axolotl and PEFT, the QLoRA finding on patching every layer, and adapter file sizes.';

export const hoodNote =
	'Real fine-tunes run on models with thousands of hidden numbers and many layers, with alpha scaling the patch; here the network has 16 hidden numbers and two layers, and alpha is 1.';

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
