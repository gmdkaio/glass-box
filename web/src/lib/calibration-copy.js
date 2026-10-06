// Plain-language text for the calibration page.
// Claims are checked against the sources below; anything still unsourced is marked Draft copy on the page.
// Sources, checked 2026-10-06:
//   GPT-4 technical report: https://arxiv.org/abs/2303.08774
//   Stated confidence is overconfident: Xiong et al., ICLR 2024, https://arxiv.org/abs/2306.13063
//   Stated vs token-probability calibration after RLHF: Tian et al. 2023, https://arxiv.org/abs/2305.14975
//   Rare facts: Kandpal et al., https://arxiv.org/abs/2211.08411; Mallen et al., https://arxiv.org/abs/2212.10511

export function say(gap) {
	if (gap < 0.03) return 'Its confidence is honest: when it says 80%, it is right about 80% of the time.';
	if (gap < 0.1) return 'It sounds a little surer than it should, a gap most people would miss.';
	if (gap < 0.25) return 'It sounds much surer than its track record. Its confidence has stopped being a good guide.';
	return 'Its confidence says almost nothing about whether an answer is right.';
}

export function trap(hard, shift, fixed) {
	if (fixed) return 'The correction pulls the stated confidence down to match the track record on the checked questions.';
	if (shift < 0.2) return 'A model whose confidence matches its record is called calibrated. Make the questions harder or the model bolder and watch the bars fall short of their outlines.';
	if (hard < 0.5) return 'On hard questions the model sounds about as sure as on easy ones, so the gap is largest exactly where you need the answer most.';
	return 'The bars fall short of their outlines: at every level of confidence, it is right less often than it says.';
}

export const parts = [
	{
		title: 'Confidence is a claim',
		text: 'When a model says "I am fairly sure", that is more text it wrote. It comes out of the same word-by-word process as the answer, with nothing extra checking it.'
	},
	{
		title: 'Calibration is a track record',
		text: 'Collect every answer given at about 80% confidence and count how many were right. If it is about 80%, the model is calibrated at that level.'
	},
	{
		title: 'Hard questions widen the gap',
		text: 'A model can sound equally sure about a well-known fact and an obscure one. Its record on the obscure one is worse, so the same words carry less weight.'
	}
];

export const trapCard =
	'A confident tone feels like evidence. In a person it often is, because people tend to hedge when they are unsure. A model can write a fluent, assured answer whether or not it has the facts.';

export const why = [
	{
		title: 'Treat "I\'m sure" as a claim to check',
		text: 'For anything that matters, ask for the source or the reasoning and check it, however certain the answer sounds.'
	},
	{
		title: 'Ask more than once',
		text: 'Ask the same question a few times or in a new chat. If the answers disagree, the model is unsure, whatever confidence it states.'
	},
	{
		title: 'Be most careful where it knows least',
		text: 'Obscure facts, exact figures, recent events and niche topics are where stated confidence is least reliable.'
	},
	{
		title: 'Keep your own track record',
		text: 'On work you repeat, check a handful of answers you can verify. That tells you how much its confidence is worth on your kind of question.'
	}
];

export const whyLead = 'Use stated confidence as one clue among several, and build your own record on the questions you care about.';

export const whyDraft =
	'Checked on 2026-10-06 against the GPT-4 technical report (calibration after chat training), Xiong et al. (2024) and Tian et al. (2023) on stated confidence, and Kandpal et al. and Mallen et al. (2023) on rare facts. Draft copy: how evenly a model sounds sure across easy and hard questions still needs a source.';

export const hoodNote =
	'Real models can also report confidence as the probability of their own answer. Before chat fine-tuning that probability tracks accuracy well; after it the match gets worse, and confidence written in words is sometimes the better guide. A real model\'s overconfidence also changes with the topic and the kind of question, where this page uses one fixed shift. Labs measure calibration on large sets of questions with known answers, the same way this page does.';

export const next = [
	{
		title: 'Next: retrieval',
		text: 'How a model looks things up before it answers, and what goes wrong when the search finds the wrong page.'
	},
	{
		title: 'Then: shrinking a model',
		text: 'Round every number in a model to fewer allowed values, and see what it costs.'
	}
];
