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
		blurb: 'How a model runs, reads and is fine-tuned. For anyone who runs models locally, fine-tunes them, or wants to start.'
	}
];

// titles are short so they fit on one line in the sidebar. A ready module also has a
// blurb: one sentence for its card in the README (scripts/readme-modules.mjs)
export const modules = [
	{ track: 'using', slug: 'how-it-works', title: 'How it works', ready: true,
		blurb: "A tiny network reads one word and gives odds for the next, one word at a time." },
	{ track: 'using', slug: 'sampling', title: 'Why answers vary', ready: true,
		blurb: "The model picks each word like weighted dice, so the same question gets different answers." },
	{ track: 'using', slug: 'compounding', title: 'Long tasks', ready: true,
		blurb: "Small chances of a slip multiply over many steps, and checks between steps win them back." },
	{ track: 'using', slug: 'context', title: 'Context', ready: true,
		blurb: "The more text you paste, the smaller the share of attention the answer gets." },
	{ track: 'using', slug: 'tokenization', title: 'Tokenization', ready: true,
		blurb: "The model reads text as numbered chunks, so the letters inside them are hidden from it." },
	{ track: 'using', slug: 'calibration', title: 'Calibration', ready: true,
		blurb: "How sure a model sounds, compared with how often it is right." },
	{ track: 'using', slug: 'retrieval', title: 'Retrieval', ready: true,
		blurb: "Before the model answers from documents, a search picks the few pages it gets to read." },
	{ track: 'under', slug: 'quantization', title: 'Shrinking a model', tag: 'Local models', ready: true,
		blurb: "Rounding every number in a model to fewer values saves memory and costs accuracy." },
	{ track: 'under', slug: 'memory', title: 'Fitting in memory', tag: 'Local models', ready: true,
		blurb: "A model needs memory for its numbers and for a cache that grows with every token of the chat." },
	{ track: 'under', slug: 'embeddings', title: 'Embeddings', ready: true,
		blurb: "Words used in similar places get similar numbers, which is how search by meaning works." },
	{ track: 'under', slug: 'sampling-settings', title: 'Sampling settings', tag: 'Local models', ready: false },
	{ track: 'under', slug: 'lora', title: 'LoRA', tag: 'Fine-tuning', ready: false },
	{ track: 'under', slug: 'learning-rate', title: 'Learning rate', tag: 'Fine-tuning', ready: false },
	{ track: 'under', slug: 'overfitting', title: 'Overfitting', tag: 'Fine-tuning', ready: false },
	{ track: 'under', slug: 'evaluation', title: 'Evaluating a model', ready: false }
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
