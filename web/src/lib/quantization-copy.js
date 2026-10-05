// Plain-language text for the quantization page.
// The claims here are drafts and each one needs a source before release.

// same order as the slider, smallest first
export const sizes = [
	{ label: 'Extreme', detail: '1 bit', note: '', bits: 1 },
	{ label: 'Phone-sized', detail: '2 bits', note: '', bits: 2 },
	{ label: 'Laptop-friendly', detail: '4 bits', note: '', bits: 4 },
	{ label: 'Half size', detail: '8 bits', note: 'Qwen also ships an FP8 version', bits: 8 },
	{ label: 'Original size', detail: '16 bits', note: 'How Qwen releases its models', bits: 16 }
];

// what the number of notches means for the stored number in the numbers example
export function ruleNote(bits) {
	if (bits <= 4)
		return 'With so few notches, 1.0 falls between two of them, so the model has to use the nearest one.';
	if (bits <= 8) return 'There are enough notches that one lands close to 1.0, but rarely exactly on it.';
	return 'There are so many notches that one sits almost exactly on 1.0, so almost nothing is lost.';
}

export function say(bits) {
	if (bits >= 7) return 'Almost no difference. The numbers barely moved.';
	if (bits >= 5) return 'Tiny changes. Most people would not notice.';
	if (bits >= 3)
		return 'Visible rounding. Casual chat is usually fine, but harder tasks can start to slip.';
	if (bits === 2) return 'Heavy rounding. Expect mistakes, especially on multi-step work.';
	return 'Every number is forced to one of two values. The model is mostly broken.';
}

export function trap(bits) {
	if (bits >= 7) return 'More precision costs memory and buys almost nothing you could see.';
	if (bits >= 3)
		return 'This is the zone where shrinking pays off: a lot of memory saved for a small loss.';
	return 'With so few choices, each number is now far from where it should be.';
}

export const why = [
	{
		title: 'Prompting',
		text: 'A rounded model has less room to be exact. Give it smaller steps, one clear task at a time, and a worked example. A long, tangled instruction is less likely to survive.'
	},
	{
		title: 'Guardrails',
		text: 'Check the output: validate formats, run the code it writes, compare numbers against the source. Rounded models drift in small ways, so checks matter more.'
	},
	{
		title: 'Harness',
		text: 'Build retries, tests and fallbacks around the model. If a small local model fails a check, hand that step to a larger one. Know which version you are calling.'
	}
];

export const whyNote =
	'If you only use a hosted model such as Claude, you never pick its precision. It matters when you run an open model like Qwen yourself, where the same model comes in several sizes.';

export const whyDraft =
	'Draft copy. Checked on Hugging Face on 2026-10-01: Qwen3-8B and Qwen3.8-Flash-Next are released in bfloat16 (16 bits), and Qwen3.8-Flash-Next-FP8 is an official 8-bit version. Still needs sources: the 4, 2 and 1 bit labels, how accuracy drops at low bits, and what third-party hosts serve at which precision.';

export const floatNote =
	'Real 16-bit and 8-bit models use floating-point formats (bfloat16, FP8) that space their values unevenly. This page uses evenly spaced values to keep the math simple.';

export const next = [
	{
		title: 'Next: overfitting and grokking',
		text: 'Too few bits throws away detail. Too much capacity can memorize the training text. The question there is when more stops helping.'
	},
	{
		title: 'Then: calibration and LoRA',
		text: 'How sure a model sounds compared with how often it is right, and how a small patch can change a big model without touching most of its numbers.'
	}
];
