// The two tracks, and the modules in sidebar order. A module with ready: true has a page.
export const tracks = [
	{
		id: 'using',
		title: 'Using AI',
		blurb: 'What matters when you work with Claude or another assistant.'
	},
	{
		id: 'under',
		title: 'Under the hood',
		blurb: 'How models are trained, shrunk and adapted. For anyone who has run a model locally or wants to see the machinery.'
	}
];

// titles are short so they fit on one line in the sidebar. A ready module also has a
// blurb: one sentence for its card in the README (scripts/readme-modules.mjs)
export const modules = [
	{ track: 'using', slug: 'how-it-works', title: 'How it works', ready: true,
		blurb: 'A tiny network reads one word and gives odds for the next. Teach it a text and watch it write.' },
	{ track: 'using', slug: 'sampling', title: 'Why answers vary', ready: true,
		blurb: 'The model picks each word like weighted dice. See why the same question gets different answers.' },
	{ track: 'using', slug: 'compounding', title: 'Long tasks', ready: true,
		blurb: 'Small chances of a slip multiply over many steps. See how checks between steps win them back.' },
	{ track: 'using', slug: 'context', title: 'Context', ready: false },
	{ track: 'using', slug: 'tokenization', title: 'Tokenization', ready: false },
	{ track: 'using', slug: 'calibration', title: 'Calibration', ready: false },
	{ track: 'using', slug: 'retrieval', title: 'Retrieval', ready: false },
	{ track: 'under', slug: 'quantization', title: 'Shrinking a model', tag: 'Local models', ready: true,
		blurb: 'Round every number in a model to fewer allowed values, and see what it costs.' },
	{ track: 'under', slug: 'lora', title: 'LoRA', tag: 'Local models', ready: false },
	{ track: 'under', slug: 'overfitting', title: 'Overfitting', ready: false },
	{ track: 'under', slug: 'parrot', title: 'Parrot or thinker?', ready: false },
	{ track: 'under', slug: 'scaling', title: 'Scaling laws', ready: false },
	{ track: 'under', slug: 'double-descent', title: 'Double descent', ready: false },
	{ track: 'under', slug: 'contamination', title: 'Contamination', ready: false }
];

export function inTrack(id) {
	return modules.filter((m) => m.track === id);
}

// where a module sits: its track, its place in the track and the track size
export function where(slug) {
	const module = modules.find((m) => m.slug === slug);
	const list = inTrack(module.track);
	return {
		track: tracks.find((t) => t.id === module.track),
		n: list.indexOf(module) + 1,
		total: list.length,
		tag: module.tag
	};
}
