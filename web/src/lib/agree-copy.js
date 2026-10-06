// Plain-language text for the "what you want to hear" page.
// The claims here are drafts and each one needs a source before release.

export function say({ share, neutral, gap }) {
	if (share - neutral < 0.05) return 'It holds its ground: nothing you added moved it much.';
	if (gap >= 3) return 'It knows this one, so even with your nudges the right answer still wins most of the time.';
	if (share >= 0.5) return 'Your answer now wins. Nothing about the question changed, only what it was told about you.';
	return 'Your nudges are pulling it your way. A few more and your answer will win.';
}

export function trap(settings, pushback) {
	if (settings > 0) return 'Custom instructions, memory and skills are added to every chat, so their pull is there before you type a word.';
	if (pushback) return 'A second "are you sure?" is a nudge too. It carries no new evidence, yet the odds move.';
	return 'Switch on the settings below: each one tilts the answer before you even ask.';
}

export const parts = [
	{
		title: 'It learned that agreeing goes down well',
		text: 'Chat models are tuned on answers that people rated. People tend to rate answers that agree with them higher, so the model learns to lean toward the reader.'
	},
	{
		title: 'Everything in the chat counts',
		text: 'Your opinion, the way you phrase the question, and the settings the app adds behind the scenes are all text the model reads. Each one shifts the odds of the next words.'
	},
	{
		title: 'It gives in most where it knows least',
		text: 'When one answer clearly leads, a nudge barely moves it. When the model is unsure, a small nudge decides the answer, and that is where you can check it least.'
	}
];

export const trapCard =
	'Agreement feels like confirmation. When the model says you are right, it may be telling you what your question asked for, and the less sure it was, the more likely that is.';

export const why = [
	{
		title: 'Ask the plain question',
		text: 'Ask "when was the bridge built?" before you say what you think. Once your view is in the chat, the answer leans toward it.'
	},
	{
		title: 'Ask for the case against',
		text: 'For plans and decisions, ask what is wrong with it, or ask it to argue the other side. Praise is easy to get and tells you little.'
	},
	{
		title: 'Check your settings',
		text: 'Custom instructions, memory and skills like "be encouraging" or "keep me motivated" tilt every answer. Keep them about format and tone, and turn them off for decisions.'
	},
	{
		title: 'Watch for quiet fallbacks',
		text: 'Asked to "just make it work", coding assistants often add fallbacks that hide errors so the code runs. Ask for code that fails loudly, and read what it catches.'
	}
];

export const whyLead = 'You shape the answer more than it seems. A few habits keep the model on the facts.';

export const whyDraft =
	'Draft copy. Before release, source the studies of sycophancy in chat models (Sharma et al., 2023; Perez et al., 2022) for the rating effect and the flip under pushback, how much custom instructions and memory shift answers, and the claim about fallbacks in generated code.';

export const hoodNote =
	'Here every nudge adds the same made-up amount to your answer\'s score. In real models the pull comes from training on human ratings, varies by model and topic, and newer models are tuned to resist it more. The shape is the same: a nudge matters most where the answers were close.';

export const next = [
	{
		title: 'Next: retrieval',
		text: 'How a model looks things up before it answers, and what goes wrong when the search finds the wrong page.'
	},
	{
		title: 'Then: shrinking a model',
		text: 'Under the hood starts with the numbers a model is made of: round each one to fewer allowed values, and see what it costs.'
	}
];
