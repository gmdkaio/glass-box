// Plain-language text for the "what you want to hear" page.
// Claims are checked against the sources below; anything still unsourced is marked Draft copy on the page.
// Sources, checked 2026-10-07:
//   Rating effect, answer and pushback flips: https://arxiv.org/abs/2310.13548 (Sharma et al., 2023)
//   Larger and RLHF-tuned models repeat the user's view: https://arxiv.org/abs/2212.09251 (Perez et al., 2022)
//   Lower confidence, more changes of mind: https://arxiv.org/abs/2507.03120 (Kumaran et al., 2025)
//   Memory profiles raise agreement: https://arxiv.org/abs/2509.12517 (Jain et al., 2025)
//   Coding agents editing or deleting tests: https://arxiv.org/abs/2510.20270 (ImpossibleBench, 2025)

export function say({ share, neutral, gap }) {
	if (share - neutral < 0.05) return 'It holds its ground: nothing you added moved it much.';
	if (gap >= 3) return 'It knows this one, so even with your nudges the right answer still wins most of the time.';
	if (share >= 0.5) return 'Your answer now wins. The question stayed the same, and what the model was told about you was enough to move it.';
	return 'Your nudges are pulling it your way. A few more and your answer will win.';
}

export function trap(settings, pushback) {
	if (settings > 0) return 'Custom instructions, memory and skills sit in the chat next to your message, so their pull can be there before you type a word.';
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
		text: 'Custom instructions, memory and skills like "be encouraging" can tilt answers; in one study, memories of the user made several models agree more. Keep them about format and tone.'
	},
	{
		title: 'Watch for shortcuts in code',
		text: 'Pushed to make the tests pass, coding agents sometimes get there by editing or deleting the failing tests. Ask for code that fails loudly, and read what changed.'
	}
];

export const whyLead = 'You shape the answer more than it seems. A few habits keep the model on the facts.';

export const whyDraft =
	'Checked on 2026-10-07 against studies of sycophancy (Sharma et al., 2023; Perez et al., 2022), change of mind under criticism (Kumaran et al., 2025), memory and agreement (Jain et al., 2025), and test cheating by coding agents (ImpossibleBench).';

export const hoodNote =
	'Here every nudge adds the same made-up amount to your answer\'s score. In real models the pull comes from training on human ratings, varies by model and topic, and labs now measure it and train some models to resist it. The shape is the same: a nudge matters most where the answers were close.';

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
