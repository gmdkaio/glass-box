// Texto do módulo de configurações de amostragem em português do Brasil. Mesmas exportações
// e as mesmas fontes de settings-copy.js; quando o texto em inglês mudar, atualize este também.
// spot chega com o nome em inglês do lugar ('Sure' ou 'Open'), como em settings-copy.js.

export function say({ spot, kept, goodCut, badChance }) {
	if (badChance >= 0.01) return 'Nada corta as palavras sem sentido, e a cada resposta elas ganham outra chance.';
	if (goodCut >= 3 && spot === 'Open') return 'As palavras sem sentido sumiram, e junto foram palavras que serviam muito bem.';
	if (kept >= 5 && spot === 'Sure') return 'Uma palavra claramente serve aqui, e mesmo assim o modelo mantém um punhado de palavras mais fracas no sorteio.';
	return 'O corte combina com este lugar: as palavras fracas sumiram e as boas ficaram.';
}

export function trap({ topK, minP, spot }) {
	if (topK > 0 && minP === 0)
		return spot === 'Open'
			? 'top-k mantém o mesmo número de palavras em todo lugar. Troque para Seguro e ele mantém cinco lá também, quando uma bastaria.'
			: 'top-k mantém o mesmo número de palavras em todo lugar. Troque para Aberto e os mesmos cinco cortam a maioria das boas escolhas.';
	if (minP > 0) return 'min-p põe a barra como uma parte da palavra do topo, então mantém poucas palavras quando o modelo está seguro e muitas quando não está.';
	return 'Cada configuração corta a lista do seu jeito. Olhe os três gráficos: as duas linhas do top-k andam juntas, e o min-p as separa.';
}

export const penaltyNote = (p) =>
	p <= 1.0
		? 'repeat_penalty 1.0 está desligado. Com temperatura baixa a resposta logo começa a andar em círculos.'
		: p < 1.3
			? 'Uma penalidade leve quebra os círculos e mantém a resposta no assunto.'
			: 'Uma penalidade forte também pune palavras de que a resposta precisa, como "the" e o ponto final, então ela recorre a palavras que o modelo achava pouco prováveis.';

export const parts = [
	{
		title: 'Corta, depois redistribui',
		text: 'Cada filtro tira palavras da lista antes do sorteio. As chances das palavras tiradas são divididas entre as que ficaram, então essas saem com mais frequência.'
	},
	{
		title: 'Três jeitos de cortar',
		text: 'top-k mantém um número fixo de palavras. top-p mantém as palavras do topo até as chances delas somarem uma parte. min-p mantém toda palavra com pelo menos uma parte das chances da palavra do topo.'
	},
	{
		title: 'Abaixa o que já foi dito',
		text: 'repeat_penalty abaixa a nota de toda palavra que já está no trecho recente da resposta. Ele vem primeiro, antes dos filtros e da temperatura.'
	}
];

export const trapCard =
	'Um filtro só consegue tirar palavras. Se a palavra certa não está perto do topo, nenhuma configuração a traz de volta, e uma penalidade de repetição forte pode empurrar a palavra certa para baixo quando a resposta precisa dela de novo, como um nome ou um ponto final.';

export const why = [
	{
		title: 'Comece pelos padrões',
		text: 'O Ollama começa com temperatura 0.8, top_k 40, top_p 0.9 e min_p 0, com repeat_penalty desligado (1.0) desde a versão 0.32.10. Muitos modelos da biblioteca dele trazem os próprios valores: o qwen3 usa temperatura 0.6, top_k 20 e top_p 0.95. Mude uma configuração por vez e compare algumas respostas a cada vez.'
	},
	{
		title: 'Experimente o min-p',
		text: 'min-p entre 0.05 e 0.1 acompanha o quanto o modelo está seguro. Muitas configurações locais o usam com top-k e top-p desligados (top_k 0, top_p 1).'
	},
	{
		title: 'Mantenha a penalidade leve',
		text: 'Se as respostas entram em loop, um repeat_penalty pequeno, como 1.05 a 1.1, é uma primeira tentativa comum. Código, listas e nomes se repetem de propósito, então uma penalidade forte prejudica esses primeiro.'
	},
	{
		title: 'Configurações não acrescentam conhecimento',
		text: 'As configurações de amostragem escolhem entre as palavras que o modelo já avalia bem. Se as respostas estão erradas, olhe o prompt, o contexto ou o modelo.'
	}
];

export const whyLead = 'O Ollama, o llama.cpp e o LM Studio deixam você ajustar isso. Algumas coisas para saber quando ajustar.';

export const whyDraft =
	'Verificado em 07/10/2026 com a documentação do Ollama e a versão v0.32.10 dele, a documentação do servidor do llama.cpp e o artigo do min-p (Nguyen et al., 2025). Os padrões variam de um programa para outro e mudam entre versões. A penalidade de repetição vem do artigo do CTRL (Keskar et al., 2019), que usou 1.2. O Ollama usou 1.1 até a v0.32.10, e o llama.cpp documenta 1.1 na API, enquanto a linha de comando dele deixa a penalidade desligada. Lazaridis et al. (2026) viram que uma penalidade de 1.30 quebrou o código de um modelo, e 1.15 o deixou funcionando.';

export const hoodNote =
	'A ordem segue o llama.cpp: a penalidade, depois top-k, top-p e min-p sobre as chances com temperatura 1, depois a temperatura sobre o que sobrou. Outros programas podem usar outra ordem. Modelos de verdade dão nota a dezenas de milhares até algumas centenas de milhares de tokens (151,936 no Qwen3), e aí um top_k de 40 mantém uma fatia minúscula; aqui 5 de 16 faz esse papel. A resposta vem de um modelo que só sabe qual palavra vem depois de qual, e ele entra em loop muito mais fácil que um modelo de verdade, embora respostas longas com temperatura baixa ainda possam se repetir.';

export const next = [
	{
		title: 'A seguir: LoRA',
		text: 'As configurações mudam como o modelo escolhe. Para mudar o que ele sabe, você muda o próprio modelo, sem treinar tudo de novo.'
	},
	{
		title: 'Depois: taxa de aprendizado',
		text: 'O tamanho do passo que cada rodada de treino dá, e por que um passo grande demais estraga um modelo.'
	}
];
