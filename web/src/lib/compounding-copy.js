// Plain-language text for the long tasks page.
// The claims here are drafts and each one needs a source before release.

export const stepNote =
	'A step is any point where the model can go wrong: a tool call, an edit to a file, a fact it states, a number it carries forward.';

export function say(odds) {
	if (odds >= 0.9) return 'Most runs finish without a mistake.';
	if (odds >= 0.6) return 'Most runs finish clean, but a fair share do not.';
	if (odds >= 0.3) return 'A clean run is close to a coin toss.';
	return 'A clean run is the exception. Most runs have a mistake somewhere.';
}

export function trap(every, plain, checked) {
	if (every === 0)
		return 'Each step on its own looks reliable. The chance that every one of them is right is what shrinks.';
	if (checked - plain < 0.02)
		return 'The checks barely help here. A check can only send work back if it notices the mistake.';
	return 'The checks win back most of what the length cost, by sending a section back while the mistake is still nearby.';
}

export function runSay(outcome, brokenAt, every, redos) {
	const step = brokenAt + 1;
	let extra = '';
	if (redos === 1) extra = ' A check sent one section back to be redone along the way.';
	if (redos > 1) extra = ` Checks sent sections back to be redone ${redos} times along the way.`;
	if (outcome === 0) return `Finished clean.${extra}`;
	if (outcome === 2)
		return `Gave up at step ${step}: the check kept finding mistakes, and the section was redone as often as allowed.`;
	if (every === 0) return `Step ${step} was wrong, so everything after it was built on a mistake. Nothing flagged it.${extra}`;
	return `Step ${step} was wrong and the check after it missed it, so the run carried on as if all was well.${extra}`;
}

export const parts = [
	{
		title: 'Small odds multiply',
		text: 'Every step has to be right. 95% times 95% is already 90%, and twenty of them make 36%. The chain is only as good as all its links together.'
	},
	{
		title: 'Early mistakes cost the most',
		text: 'Everything after a wrong step builds on it. In the 1,000 runs, the early steps spoil the most runs, because every run passes through them.'
	},
	{
		title: 'A check turns one long task into short ones',
		text: 'A check after every few steps only has to trust that short stretch. When it finds a mistake, only that stretch is done again.'
	}
];

export const trapCard =
	'A check that misses a mistake looks exactly like a check that passed. Weak checks give you confidence without the safety, so test your checks too.';

export const why = [
	{
		title: 'Split big asks',
		text: 'Ask for one part, look at it, then ask for the next. Each part is a short chain, and you are the check between them.'
	},
	{
		title: 'Check early',
		text: 'Look at the plan or the first file before the model builds on it. A mistake caught at step 2 costs two steps to fix, not twenty.'
	},
	{
		title: 'Give it a way to check itself',
		text: 'Tests, a linter, a script that compares numbers with the source. An agent that can run checks between steps catches its own slips.'
	},
	{
		title: 'Read the end with the start in mind',
		text: 'A long, confident answer can rest on one wrong early step. If something at the end looks off, look for where it went wrong first.'
	}
];

export const whyLead =
	'You cannot make each step perfect. You can make chains shorter and put checks in between.';

export const whyDraft =
	'Draft copy. Real steps are not independent coin flips: some mistakes get fixed by later steps, and others make later ones more likely. Before release, find sources on how agent success rates fall with task length, and on how often self-checks catch errors.';

export const hoodNote =
	'Steps here are independent and equally reliable, and a missed mistake always spoils the task. Real tasks are messier: some steps are harder than others, and a later step can sometimes repair an earlier one.';

export const next = [
	{
		title: 'Next: context',
		text: 'Why more text in the prompt can make the important sentence count for less.'
	},
	{
		title: 'Then: tokenization',
		text: 'The model reads pieces of words, not letters. Why it miscounts letters, and why some languages cost more.'
	}
];
