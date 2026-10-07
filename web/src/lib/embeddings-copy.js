// Plain-language text for the embeddings page.
// Claims are checked against the sources below; anything still unsourced is marked Draft copy on the page.
// Sources, checked 2026-10-06:
//   Counting vs prediction: Levy and Goldberg, NIPS 2014, https://papers.nips.cc/paper_files/paper/2014/hash/b78666971ceae55a8e87efb7cbfd9ad4-Abstract.html
//   Contrastive training: Qwen3 Embedding, https://arxiv.org/abs/2506.05176
//   Hybrid search: https://www.anthropic.com/news/contextual-retrieval

export function say(topics) {
	if (topics >= 0.85) return 'Words land among others used the same way: transport near transport, food near food.';
	if (topics >= 0.5) return 'Some groups have formed, but many words still sit among strangers.';
	return 'With this few numbers, most words look alike, and the map is one blur.';
}

export function trap({ k, keywordFound, meaningFound }) {
	if (k <= 2) return 'Here two numbers are too few to keep the five topics apart. Add dimensions and watch the groups pull away from each other.';
	if (!keywordFound && meaningFound)
		return 'The question shares no words with the right notice, so a keyword search finds nothing. The meaning search finds it anyway, because its words sit near the notice\'s words.';
	if (k >= 16) return 'More numbers past a point add little here: a few dozen sentences only teach so much.';
	return 'Nobody told the model that a coach is like a bus. It worked that out from the words that come before and after each.';
}

export const parts = [
	{
		title: 'You know a word by its neighbours',
		text: 'Count which words appear near each word. Bus and coach both appear near ticket, driver and station, so their counts look alike.'
	},
	{
		title: 'Squeeze the counts into a few numbers',
		text: 'The count table has a column for every word. Breaking it into its main directions keeps the pattern in a handful of numbers per word: its embedding.'
	},
	{
		title: 'Close in numbers, close in use',
		text: 'Two words whose numbers point the same way are used alike. The angle between them (cosine similarity) is the measure most meaning searches use.'
	}
];

export const trapCard =
	'Close in numbers means used alike, which usually lines up with meaning alike. Opposites like early and late appear in the same kinds of sentence, so they end up neighbours too: try "early" above.';

export const why = [
	{
		title: 'Search by meaning',
		text: 'Embedding search finds passages that say the same thing in other words. It is what lets a document assistant answer "earliest coach" from a page about the first bus.'
	},
	{
		title: 'Mind the opposites',
		text: 'Words used in the same places sit together even when they mean opposite things. Check meaning-search results where early and late, or allowed and banned, both match.'
	},
	{
		title: 'Same model, same space',
		text: 'Vectors from different embedding models do not line up. Search with the same model that embedded your documents, and re-embed everything when you switch.'
	},
	{
		title: 'Mix it with keywords',
		text: 'Names, codes and exact numbers match better by keyword. Many setups run both searches and combine the results.'
	}
];

export const whyLead = 'Embeddings power search by meaning, in your own tools and in local document setups. A few things to know when you rely on them.';

export const whyDraft =
	'Checked on 2026-10-06 against Levy and Goldberg (2014) on counting and prediction reaching the same space, the Qwen3 Embedding report on how search embedding models are trained, and Anthropic\'s Contextual Retrieval post on mixing keyword and meaning search.';

export const hoodNote =
	'Real models learn their embeddings during training, by predicting words, and give each token a few hundred to a few thousand numbers. Counting neighbours and breaking the table into directions, as here, reaches the same kind of space, and early word vectors were built this way. Search embedding models are trained by contrast: pull a question and its matching passage together, push unrelated passages apart. They read a whole passage and give it one vector, where this page averages its words, and inside a model a word\'s numbers change with the sentence around it.';

export const next = [
	{
		title: 'Next: sampling settings',
		text: 'At the other end, the model turns its numbers back into odds for every token. Settings decide which one it picks.'
	},
	{
		title: 'Then: LoRA',
		text: 'Settings change how it picks. To change what it knows, you change the model itself, without retraining all of it.'
	}
];
