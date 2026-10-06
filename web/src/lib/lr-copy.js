// Plain-language text for the learning rate page.
// Claims are checked against the sources below; anything still unsourced is marked Draft copy on the page.
// Sources, checked 2026-10-06:
//   LoRA rates: QLoRA, https://arxiv.org/abs/2305.14314 (Table 9); Unsloth 2e-4
//   Full fine-tune 2e-5: Llama 2, https://arxiv.org/abs/2307.09288
//   Trainer defaults: https://huggingface.co/docs/transformers/main_classes/trainer
//   Warmup: RAdam, https://arxiv.org/abs/1908.03265; Unsloth and Axolotl use 5-10% of steps

export function say({ loss, best, rate, falling }) {
	if (!Number.isFinite(loss) || loss > 4) return 'The steps are so big that each one overshoots, and the numbers run away: the model gets worse at everything.';
	if (loss > best * 1.6 && falling) return 'Each step is small, so it is still learning when training ends. More passes or a bigger step would get further.';
	if (loss > best * 1.6) return 'The steps overshoot, so the loss bounces instead of settling.';
	if (rate >= 0.5) return 'A bold start, and the schedule shrinks the steps in time to settle.';
	return 'Big enough to learn quickly, small enough to settle.';
}

export function trap(schedule, rate) {
	if (schedule === 'constant' && rate >= 0.5) return 'Try linear or cosine: the same start, with steps that shrink as training goes on.';
	if (rate <= 0.005) return 'A small step looks safe, but it wastes the training: the curve is still sliding down at the last pass.';
	return 'Look at the dashed line for the Millbrook text: every fine-tune costs some of what the model knew, and bigger steps cost more.';
}

export const parts = [
	{
		title: 'Training takes steps',
		text: 'After each word pair, training nudges every number a little in the direction that makes the right next word more likely. The learning rate is how big each nudge is.'
	},
	{
		title: 'Too small, too big',
		text: 'Tiny steps barely move, and the training ends before the model has learned. Huge steps jump past the good values, so the loss bounces or runs away.'
	},
	{
		title: 'Schedules shrink the step',
		text: 'A schedule starts at the learning rate and lowers it over training: in a straight line (linear) or along a curve (cosine). Big early steps, small late ones.'
	}
];

export const trapCard =
	'The best rate here does not carry over. It depends on the model, the optimizer, the batch size and whether you use LoRA, so a number that worked for one setup can ruin another.';

export const why = [
	{
		title: 'Real rates are far smaller',
		text: 'Fine-tunes with the AdamW optimizer use rates around 0.0001 to 0.0003 for LoRA and around 0.00001 to 0.00002 for a full fine-tune. Examples and notebooks start you at a sensible value.'
	},
	{
		title: 'Watch the loss curve',
		text: 'A smooth fall that flattens out is what you want. Spikes or a rising loss mean the rate is too high; a line still falling steeply at the end means too low or too short.'
	},
	{
		title: 'Use a schedule',
		text: 'Most recipes use linear or cosine decay. Many also add a short warmup, 5 to 10 percent of the steps at a rising rate, which steadies AdamW early on.'
	},
	{
		title: 'Lower it first',
		text: 'When a run goes wrong, a common first move is to halve the learning rate before changing anything else.'
	}
];

export const whyLead = 'Every fine-tuning tool asks for a learning rate and a schedule. A few things to know when you set them.';

export const whyDraft =
	'Checked on 2026-10-06 against the QLoRA and Llama 2 papers, Unsloth\'s and Axolotl\'s examples, the Hugging Face Trainer defaults, and the RAdam paper on warmup. Draft copy: the advice on reading loss curves and on halving the rate is common practice and still needs a source.';

export const hoodNote =
	'This network takes plain steps, one word pair at a time, so its rates are much larger than a real fine-tune\'s. Real training uses AdamW, which scales each step by the recent size of its gradients, and averages over batches of examples; warmup matters there and is left out here.';

export const next = [
	{
		title: 'Next: overfitting',
		text: 'Even at a good rate, too many passes over too little text make the model learn it by heart and forget the rest.'
	},
	{
		title: 'Then: evaluating a model',
		text: 'How to tell whether a fine-tune helped, using text it never trained on.'
	}
];
