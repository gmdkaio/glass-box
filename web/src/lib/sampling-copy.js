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
	if (variety === 0) return 'Same every time is not the same as right. If the top pick is wrong, it is wrong every time.';
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
		text: 'The model cannot read your mind. A vague question spreads the odds over answers you did not intend. Name the topic, the format and the limits, like the specific question above.'
	},
	{
		title: 'Ask twice',
		text: 'If two answers to the same question disagree, treat the answer as uncertain and check it. If they agree it is a better sign, but not proof: the model can repeat the same mistake.'
	},
	{
		title: 'Check what matters',
		text: 'A smooth answer is not a verified one. For facts, numbers and names, ask for sources or look them up.'
	},
	{
		title: 'One answer is one roll',
		text: 'A wrong answer does not mean the model can never get it right, and a right answer does not mean it always will. Judge it over a few tries.'
	}
];

export const whyLead =
	'You cannot see the odds, and you usually cannot change the variety setting. You can change what you write and how you check the result.';

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
