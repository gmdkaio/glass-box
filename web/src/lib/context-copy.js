// Plain-language text for the context page.
// The claims here are drafts and each one needs a source before release.

export function say(share) {
	if (share >= 0.8) return 'The answer sentence stands out clearly.';
	if (share >= 0.4) return 'The answer sentence still leads, but the rest of the text is pulling attention away.';
	if (share >= 0.15) return 'The answer sentence is now one voice among many.';
	return 'Most of the attention goes somewhere else. The answer is in the text, but it barely counts.';
}

export function trap(lookalikes, middle, place) {
	if (lookalikes > 0)
		return 'The look-alikes do the most damage: they match the question almost as well as the answer, so the model can pick the Saturday hours instead.';
	if (middle && place > 0.2 && place < 0.8) return 'The answer sits in the middle, where this toy model pays the least attention.';
	return 'Every sentence you add takes a slice of attention, even one that has nothing to do with the question.';
}

export const parts = [
	{
		title: 'Attention is shared out',
		text: 'The model scores every sentence against the question, and the scores become shares that add up to 100%. One more sentence means a thinner slice for everyone, the answer included.'
	},
	{
		title: 'Look-alikes compete hardest',
		text: 'A sentence about Saturday hours scores almost as high as the Sunday one. A few of those take more attention away than a hundred unrelated lines.'
	},
	{
		title: 'The middle gets less',
		text: 'Models tested on long inputs tend to use information at the start and the end better than information in the middle. Turn the middle dip off to see the toy without it.'
	}
];

export const trapCard =
	'Pasting everything feels safe, because nothing is left out. But every extra line takes a share of the attention, so the one line that matters gets less.';

export const why = [
	{
		title: 'Paste less',
		text: 'Give only the part of the document that matters. A shorter context leaves a bigger share for each line in it.'
	},
	{
		title: 'Put it first or last',
		text: 'If you have to paste something long, put your question and the key passage at the start or the end, where they get the most attention.'
	},
	{
		title: 'Point at it',
		text: 'Say where to look: "use the Sunday hours in the opening hours section". Naming the part raises its score above the look-alikes.'
	},
	{
		title: 'Ask for the quote',
		text: 'Ask the model to quote the sentence it used. If it quotes the Saturday line, you caught the mix-up before it mattered.'
	}
];

export const whyLead = 'You decide what goes into the context: keep it short, put the key part first or last, and say where to look.';

export const whyDraft =
	'Draft copy. Before release, source the claim about the middle of long inputs (the "lost in the middle" studies) and check how much current long-context models still show it, which varies by model.';

export const hoodNote =
	'Real models do this for every word, in many layers and many attention heads at once, and models trained for long inputs spread attention better. The idea holds: shares add up to 100%, so more competing text means less for each part.';

export const next = [
	{
		title: 'Next: tokenization',
		text: 'The model reads text as pieces of words. Why it miscounts letters, and why some languages cost more.'
	},
	{
		title: 'Then: calibration',
		text: 'How sure the model sounds, compared with how often it is right.'
	}
];
