// Plain-language text for the quantization page.
// Claims are checked against the sources below; anything still unsourced is marked Draft copy on the page.
// Sources, checked 2026-10-06:
//   Low-bit accuracy: Huang et al. 2024, https://arxiv.org/abs/2404.14047
//   Apple 2-bit on-device model: https://arxiv.org/abs/2507.13575
//   Qwen3-8B bfloat16: https://huggingface.co/Qwen/Qwen3-8B/blob/main/config.json
//   Qwen3.8-Flash-Next bfloat16: https://huggingface.co/Qwen/Qwen3.8-Flash-Next/blob/main/config.json
//   Qwen3.8-Flash-Next-FP8 (official, block size 128): https://huggingface.co/Qwen/Qwen3.8-Flash-Next-FP8
//   Host precision (int4 to bf16, filterable): https://openrouter.ai/docs/features/provider-routing

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
	return 'Every number is forced to one of two values. Rounded this hard after training, the model is mostly broken.';
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
	'If you only use a hosted model such as Claude, you never pick its precision. It matters when you run an open model like Qwen yourself, where the same model comes in several sizes. Hosts that serve open models pick one too: OpenRouter lists the precision each provider reports, from 4-bit to 16-bit, and lets you filter by it.';

export const whyDraft =
	'Checked on 2026-10-07 against the Qwen configs on Hugging Face (Qwen3-8B and Qwen3.8-Flash-Next are released in bfloat16, and Qwen3.8-Flash-Next-FP8 is Qwen\'s official 8-bit version), Apple\'s 2025 report on its on-device model, which runs at 2 bits after being trained for it, Huang et al. (2024) on the accuracy drop at low bits, and OpenRouter\'s provider-routing docs on the precision hosts report.';

export const floatNote =
	'Real 16-bit and 8-bit models use floating-point formats (bfloat16, FP8) that space their values unevenly. This page uses evenly spaced values to keep the math simple. Real 4-bit formats also give each small block of numbers its own scale, so one large value only affects its block. The 90 numbers here are random; a real model\'s come from training, and how much it loses at each size is measured by testing its answers.';

export const next = [
	{
		title: 'Next: fitting in memory',
		text: 'Smaller numbers make the model fit. But every word in the conversation needs memory too, and long chats need a lot of it.'
	},
	{
		title: 'Then: embeddings',
		text: 'Before any of that, the model swaps each word piece for a list of numbers from a lookup table. Those lists place words with related meanings near each other.'
	}
];
