// The two tracks, and the modules in sidebar order. A module with ready: true has a page.
export const tracks = [
	{
		id: 'using',
		title: 'Using AI',
		blurb: 'What matters when you work with Claude or another assistant.',
		pt: { title: 'Usando IA', blurb: 'O que importa quando você trabalha com o Claude ou outro assistente.' }
	},
	{
		id: 'under',
		title: 'Under the hood',
		blurb: 'How a model runs, reads and is fine-tuned. For anyone who runs models locally, fine-tunes them, or wants to start.',
		pt: { title: 'Por dentro', blurb: 'Como um modelo roda, lê e passa por fine-tuning. Para quem roda modelos localmente, faz fine-tuning ou quer começar.' }
	}
];

// titles are short so they fit on one line in the sidebar. A ready module also has a
// blurb: one sentence for its card in the README (scripts/readme-modules.mjs).
// pt holds the Brazilian Portuguese title, blurb and tag, read with local() from i18n.
export const modules = [
	{ track: 'using', slug: 'how-it-works', title: 'How it works', ready: true,
		blurb: "A tiny network reads one word and gives odds for the next, one word at a time.",
		pt: { title: 'Como funciona', blurb: 'Uma rede minúscula lê uma palavra e dá as chances da próxima, uma palavra de cada vez.' } },
	{ track: 'using', slug: 'sampling', title: 'Why answers vary', ready: true,
		blurb: "The model picks each word like weighted dice, so the same question gets different answers.",
		pt: { title: 'Respostas que variam', blurb: 'O modelo escolhe cada palavra como quem joga um dado viciado, então a mesma pergunta recebe respostas diferentes.' } },
	{ track: 'using', slug: 'compounding', title: 'Long tasks', ready: true,
		blurb: "Small chances of a slip multiply over many steps, and checks between steps win them back.",
		pt: { title: 'Tarefas longas', blurb: 'Pequenas chances de erro se multiplicam ao longo de muitos passos, e verificações entre os passos recuperam o que se perdeu.' } },
	{ track: 'using', slug: 'context', title: 'Context', ready: true,
		blurb: "The more text you paste, the smaller the share of attention the answer gets.",
		pt: { title: 'Contexto', blurb: 'Quanto mais texto você cola, menor a parte da atenção que vai para a resposta.' } },
	{ track: 'using', slug: 'tokenization', title: 'Tokenization', ready: true,
		blurb: "The model reads text as numbered chunks, so the letters inside them are hidden from it.",
		pt: { title: 'Tokenização', blurb: 'O modelo lê o texto como pedaços numerados, então as letras dentro deles ficam escondidas dele.' } },
	{ track: 'using', slug: 'calibration', title: 'Calibration', ready: true,
		blurb: "How sure a model sounds, compared with how often it is right.",
		pt: { title: 'Calibração', blurb: 'Quão seguro um modelo parece, comparado com quantas vezes ele acerta.' } },
	{ track: 'using', slug: 'agreement', title: 'What you want to hear', ready: true,
		blurb: "Chat models lean toward agreeing with you, and your opinions and settings tilt the answer most where the model is unsure.",
		pt: { title: 'O que você quer ouvir', blurb: 'Modelos de chat tendem a concordar com você, e suas opiniões e configurações pesam mais na resposta onde o modelo está inseguro.' } },
	{ track: 'using', slug: 'retrieval', title: 'Retrieval', ready: true,
		blurb: "Before the model answers from documents, a search picks the few pages it gets to read.",
		pt: { title: 'Busca em documentos', blurb: 'Antes de o modelo responder com base em documentos, uma busca escolhe as poucas páginas que ele vai ler.' } },
	{ track: 'under', slug: 'quantization', title: 'Shrinking a model', tag: 'Local models', ready: true,
		blurb: "Rounding every number in a model to fewer values saves memory and costs accuracy.",
		pt: { title: 'Encolhendo um modelo', blurb: 'Arredondar cada número de um modelo para menos valores economiza memória e custa precisão.', tag: 'Modelos locais' } },
	{ track: 'under', slug: 'memory', title: 'Fitting in memory', tag: 'Local models', ready: true,
		blurb: "A model needs memory for its numbers and for a cache that grows with every token of the chat.",
		pt: { title: 'Cabendo na memória', blurb: 'Um modelo precisa de memória para os seus números e para um cache que cresce a cada token da conversa.', tag: 'Modelos locais' } },
	{ track: 'under', slug: 'embeddings', title: 'Embeddings', ready: true,
		blurb: "Words used in similar places get similar numbers, which is how search by meaning works.",
		pt: { title: 'Embeddings', blurb: 'Palavras usadas em lugares parecidos recebem números parecidos, e é assim que a busca por significado funciona.' } },
	{ track: 'under', slug: 'sampling-settings', title: 'Sampling settings', tag: 'Local models', ready: true,
		blurb: "Before each pick, top-k, top-p and min-p drop unlikely words, and a repeat penalty lowers words already used.",
		pt: { title: 'Ajustes de amostragem', blurb: 'Antes de cada escolha, top-k, top-p e min-p descartam palavras improváveis, e uma penalidade de repetição rebaixa palavras já usadas.', tag: 'Modelos locais' } },
	{ track: 'under', slug: 'lora', title: 'LoRA', tag: 'Fine-tuning', ready: true,
		blurb: "LoRA trains a thin patch beside a frozen model, and a low rank is enough for most changes.",
		pt: { title: 'LoRA', blurb: 'A LoRA treina um remendo fino ao lado de um modelo congelado, e um rank baixo basta para a maioria das mudanças.', tag: 'Fine-tuning' } },
	{ track: 'under', slug: 'learning-rate', title: 'Learning rate', tag: 'Fine-tuning', ready: true,
		blurb: "The learning rate sets how big each training step is: too small barely learns, too big overshoots.",
		pt: { title: 'Taxa de aprendizado', blurb: 'A taxa de aprendizado define o tamanho de cada passo do treino: pequena demais quase não aprende, grande demais passa do ponto.', tag: 'Fine-tuning' } },
	{ track: 'under', slug: 'overfitting', title: 'Overfitting', tag: 'Fine-tuning', ready: true,
		blurb: "Trained too long on too little text, a model learns it by heart and gets worse at everything else.",
		pt: { title: 'Overfitting', blurb: 'Treinado por tempo demais com pouco texto, um modelo decora esse texto e piora em todo o resto.', tag: 'Fine-tuning' } },
	{ track: 'under', slug: 'evaluation', title: 'Evaluating a model', ready: true,
		blurb: "When test questions leak into training, a model scores well on the test and no better on new questions.",
		pt: { title: 'Avaliando um modelo', blurb: 'Quando as perguntas de teste vazam para o treino, um modelo vai bem no teste e não melhora em perguntas novas.' } }
];

export function inTrack(id) {
	return modules.filter((m) => m.track === id);
}

// where a module sits: its track, its place in the track and the track size
export function where(slug) {
	const module = modules.find((m) => m.slug === slug);
	const list = inTrack(module.track);
	return {
		module,
		track: tracks.find((t) => t.id === module.track),
		n: list.indexOf(module) + 1,
		total: list.length,
		tag: module.tag
	};
}
