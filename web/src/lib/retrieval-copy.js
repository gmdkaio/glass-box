// Plain-language text for the retrieval page.
// Claims are checked against the sources below; anything still unsourced is marked Draft copy on the page.
// Sources, checked 2026-10-06:
//   Hybrid search, top-20 chunks: https://www.anthropic.com/news/contextual-retrieval
//   More passages, quality rises then falls: Jin et al. 2024, https://arxiv.org/abs/2410.05983
//   BM25: Robertson and Zaragoza 2009, The Probabilistic Relevance Framework: BM25 and Beyond

export function say(found, right) {
	if (!found) return 'The page with the answer never reaches the model, so whatever it says comes from somewhere else.';
	if (right >= 0.8) return 'The right page is handed over and stands out, so the answer is very likely right.';
	if (right >= 0.4) return 'The right page is handed over, but other pages compete with it for the answer.';
	return 'The right page is in the pile, but the model is more likely to answer from another one.';
}

export function trap({ found, oldWins, wording, meaning, k }) {
	if (oldWins) return 'The old timetable uses the same words as the new one and is shorter, so the search ranks it higher. Remove old pages and watch the right one take over.';
	if (!found && wording === 'other' && !meaning) return 'Exact-word search only matches the words you typed. "Earliest coach" never matches "first bus". Switch to searching by meaning.';
	if (!found) return 'Hand over more pages, or ask with the words the documents use.';
	if (k > 4) return 'Every extra page is one more the model can answer from. Past a few pages here, the right one gets a smaller share.';
	return 'Ask with the words your documents use, and keep old versions out of the pile.';
}

export const parts = [
	{
		title: 'Search first, then answer',
		text: 'When an assistant answers from your files or the web, a search runs first. It scores every page against your question and hands the top few to the model.'
	},
	{
		title: 'The model answers from what it gets',
		text: 'The model reads only the pages it was handed. If the right page was left out, it still answers, from whatever it did get.'
	},
	{
		title: 'More pages cut both ways',
		text: 'Handing over more pages makes it likelier the right one is among them. Past a point, the extra near-matches start to pull answers off course.'
	}
];

export const trapCard =
	'An answer with a source looks checked. But the source is whatever the search found: an old timetable, a page that shares a few words, or the right page outvoted by its neighbours.';

export const why = [
	{
		title: 'Use the words the documents use',
		text: 'If the handbook says "bus", ask about the bus. Names, codes and exact terms from the source help a keyword search find the right page.'
	},
	{
		title: 'Clear out old versions',
		text: 'Keep outdated copies out of the folders an assistant searches. An old page that matches well can win over the current one.'
	},
	{
		title: 'Check the page it quotes',
		text: 'Open the source it cites and find the sentence it used. If the page is old or off topic, the answer is too.'
	},
	{
		title: 'Point it at the right place',
		text: 'When you know where the answer is, name the document or paste the passage. That skips the search and its mistakes.'
	}
];

export const whyLead = 'The answer can only be as good as the pages the search hands over, and you can shape what it finds.';

export const whyDraft =
	'Checked on 2026-10-06 against Anthropic\'s Contextual Retrieval post (hybrid search, and 20 passages beating 5 or 10), Jin et al. (2024) on answer quality as passages are added, and BM25\'s length normalisation (Robertson and Zaragoza, 2009).';

export const hoodNote =
	'Real systems search by keywords like this, by meaning with embeddings (numbers that place similar text close together), or both. Searching by meaning would have matched "earliest coach" to "first bus" here. Neither kind can tell an old page from a current one by the words alone. Here the meaning search is a short hand-written list of matching words, and the model answers from a single page. Real systems cut documents into passages, search millions of them, often rerank the top ones with a second model, and hand the model every page it gets, so it can combine them or say none of them answers.';

export const next = [
	{
		title: 'Next: shrinking a model',
		text: 'Under the hood starts with the numbers a model is made of: round each one to fewer allowed values, and see what it costs.'
	},
	{
		title: 'Then: fitting in memory',
		text: 'What decides whether a model runs on your machine: its size, its precision and how long the conversation gets.'
	}
];
