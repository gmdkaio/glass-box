// Plain-language text for the sampling page.
// The claims here are drafts and each one needs a source before release.

export const varietyNote =
	'Technical name: temperature. Apps usually set it for you, and many do not let you change it.';

export function say(variety, chance) {
	if (variety === 0)
		return 'The variety is at 0, so it always takes its top pick. You get the same answer every time.';
	if (chance >= 0.9) return 'It is very likely to give you what you wanted.';
	if (chance >= 0.6) return 'Most of the time it gives you what you wanted, but not always.';
	return 'It is more likely to give you something else than what you wanted.';
}

export function trap(variety) {
	if (variety === 0) return 'If the top pick is wrong, it is wrong every time.';
	return 'A clearer question does more than anything else you can change: it moves the odds toward what you meant.';
}

export const shapes = [
	{
		title: 'What it learned',
		who: 'Fixed',
		text: 'During training the model learned which words tend to follow which. You cannot change this.'
	},
	{
		title: 'The words you write',
		who: 'Yours',
		text: 'Your question shifts the scores. A clear one moves the odds toward what you meant, a vague one spreads them out.'
	},
	{
		title: 'The variety setting',
		who: 'Usually the app\'s',
		text: 'How boldly it picks from the odds. Its technical name is temperature. Most apps set it for you.'
	}
];

export const why = [
	{
		title: 'Say what you mean',
		text: 'A vague question spreads the odds over answers you did not intend. Name the topic, the format and the limits, like the specific question above.'
	},
	{
		title: 'Ask twice',
		text: 'If two answers to the same question disagree, treat the answer as uncertain and check it. If they agree it is a better sign, though the model can repeat the same mistake.'
	},
	{
		title: 'Check what matters',
		text: 'A smooth answer can still be wrong. For facts, numbers and names, ask for sources or look them up.'
	},
	{
		title: 'One answer is one roll',
		text: 'One answer says little about the next one. Judge the model over a few tries.'
	}
];

export const whyLead =
	'What you write and how you check the result are the parts you control.';

export const whyDraft =
	"Draft copy. Before release, check each product's docs for whether a variety or temperature setting is exposed, its range and default, and whether other settings such as top-p apply. These differ by provider and model.";

export const hoodNote =
	'Real systems add more on top, such as cutting off the least likely words (top-p, top-k). At variety 0 the formula would divide by zero, so the model takes the highest score.';

export const next = [
	{
		title: 'Next: errors in long tasks',
		text: 'If each step of a task is right 95% of the time, a 20-step task finishes cleanly about 36% of the time. Why checks between steps matter.'
	},
	{
		title: 'Then: context',
		text: 'Why more text in the prompt can make the important sentence count for less.'
	}
];
