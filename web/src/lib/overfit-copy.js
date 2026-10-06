// Plain-language text for the overfitting page.
// The claims here are drafts and each one needs a source before release.

export function say({ pass, best, heldNow, heldBest }) {
	if (pass < best * 0.6) return 'It is still learning: the held-out loss is falling, so a few more passes would help.';
	if (heldNow - heldBest < 0.15) return 'This is close to the best point: the held-out sentences are as well predicted as they get.';
	return `Every pass since pass ${best} has made the held-out sentences harder to predict: the model is learning its training sentences by heart.`;
}

export function trap(size, pass) {
	if (size === 3) return 'Mixing old text in keeps more of what the model knew, at the cost of a slightly worse fit to the new sentences.';
	if (pass >= 75) return 'The training loss still looks great. Only the held-out sentences show the problem, which is why you set some aside before training.';
	return 'Compare the sizes below: with more sentences the held-out loss bottoms out lower, and the gap to the training loss stays smaller.';
}

export const parts = [
	{
		title: 'Learning the pattern',
		text: 'Early passes teach what the sentences share: who sells what, where the band plays. That helps with sentences the model has never seen.'
	},
	{
		title: 'Learning it by heart',
		text: 'Later passes push the odds of the exact training sentences toward certainty. The model starts to expect them word for word, and new sentences surprise it more.'
	},
	{
		title: 'Forgetting the rest',
		text: 'Every pass also pulls the numbers away from what they held before. The Millbrook text the model knew becomes harder for it, the longer it trains.'
	}
];

export const trapCard =
	'A falling training loss tells you the model is fitting its examples. Whether it learned anything useful only shows on text it did not train on, so keep some back.';

export const why = [
	{
		title: 'Hold some data back',
		text: 'Set aside a slice of your examples, often around a tenth, as an evaluation set. Tools report its loss as eval_loss next to the training loss.'
	},
	{
		title: 'Stop at the best point',
		text: 'When eval_loss starts rising, stop. Trainers can save a checkpoint at each evaluation and keep the best one (load_best_model_at_end).'
	},
	{
		title: 'Few passes for fine-tunes',
		text: 'Fine-tunes on a few thousand examples usually run one to three epochs. More passes over the same small set mostly teach it by heart.'
	},
	{
		title: 'Mix in general data',
		text: 'To keep what the model already does well, mix some general examples into your fine-tuning data, or use LoRA, which changes fewer numbers.'
	}
];

export const whyLead = 'Every fine-tune runs this risk. A few habits keep it in check.';

export const whyDraft =
	'Draft copy. Before release, source the usual evaluation split, epoch counts for LoRA fine-tunes in Unsloth and Axolotl, the Hugging Face Trainer options for evaluation and best checkpoints, and the evidence on mixing general data to limit forgetting.';

export const hoodNote =
	'The model here only knows which word follows which, trained on a few dozen sentences, with plain steps at one fixed rate. Real fine-tunes run on billions of numbers with AdamW and batches, and overfit more slowly per pass, but the curves have the same shape.';

export const next = [
	{
		title: 'Next: evaluating a model',
		text: 'A held-out set is the start. How to test a model fairly, and why benchmark scores can mislead.'
	},
	{
		title: 'Back to: learning rate',
		text: 'Bigger steps make the model forget faster too. The two settings work together.'
	}
];
