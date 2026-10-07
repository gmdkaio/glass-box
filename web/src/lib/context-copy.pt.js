// Texto do módulo de contexto em português do Brasil. Mesmas exportações e as mesmas
// fontes de context-copy.js; quando o texto em inglês mudar, atualize este também.

export function say(share) {
	if (share >= 0.8) return 'A frase da resposta se destaca com clareza.';
	if (share >= 0.4) return 'A frase da resposta ainda lidera, mas o resto do texto está puxando a atenção para longe.';
	if (share >= 0.15) return 'A frase da resposta agora é só uma voz entre muitas.';
	return 'A maior parte da atenção vai para outro lugar. A resposta está no texto, mas quase não conta.';
}

export function trap(lookalikes, middle, place) {
	if (lookalikes > 0)
		return 'As frases parecidas são as que mais atrapalham: combinam com a pergunta quase tanto quanto a resposta, então o modelo pode pegar o horário de sábado no lugar.';
	if (middle && place > 0.2 && place < 0.8) return 'A resposta está no meio, onde este modelo de brinquedo presta menos atenção.';
	return 'Cada frase que você acrescenta leva uma fatia da atenção, mesmo uma que não tem nada a ver com a pergunta.';
}

export const parts = [
	{
		title: 'A atenção é repartida',
		text: 'O modelo dá uma nota a cada frase em relação à pergunta, e as notas viram partes que somam 100%. Uma frase a mais significa uma fatia mais fina para todas, inclusive para a resposta.'
	},
	{
		title: 'As parecidas competem mais',
		text: 'Uma frase sobre o horário de sábado recebe quase a mesma nota que a de domingo. Algumas dessas tiram mais atenção do que cem linhas sem relação.'
	},
	{
		title: 'O meio recebe menos',
		text: 'Modelos testados com textos longos costumam usar melhor a informação do começo e do fim do que a do meio. Modelos mais novos mostram menos isso, e depende da tarefa. Desligue a queda no meio para ver o brinquedo sem ela.'
	}
];

export const trapCard =
	'Colar tudo parece seguro, porque nada fica de fora. Só que cada linha extra leva uma parte da atenção, e a única linha que importa recebe menos.';

export const why = [
	{
		title: 'Cole menos',
		text: 'Passe só a parte do documento que importa. Um contexto mais curto deixa uma parte maior para cada linha dele.'
	},
	{
		title: 'Coloque no começo ou no fim',
		text: 'Se precisar colar algo longo, coloque o documento primeiro e a sua pergunta no final.'
	},
	{
		title: 'Aponte onde está',
		text: 'Diga onde procurar: "use o horário de domingo na seção de horários de funcionamento". Nomear a parte aumenta a nota dela acima das parecidas.'
	},
	{
		title: 'Peça a citação',
		text: 'Peça ao modelo que cite a frase que usou. Se ele citar a linha de sábado, você pegou a confusão antes que ela fizesse diferença.'
	}
];

export const whyLead = 'Você decide o que entra no contexto: mantenha curto, coloque a parte principal no começo ou no fim e diga onde procurar.';

export const whyDraft =
	'Verificado em 06/10/2026 com Lost in the Middle (Liu et al., 2023), o relatório Context Rot da Chroma (2025) sobre distrações e tamanho, e as dicas da Anthropic para contextos longos, sobre colocar os documentos primeiro e pedir citações.';

export const hoodNote =
	'Modelos de verdade fazem isso para cada palavra, em muitas camadas e muitas cabeças de atenção ao mesmo tempo, e modelos treinados para textos longos espalham melhor a atenção. A ideia continua valendo: as partes somam 100%, então mais texto competindo significa menos para cada parte. Uma parte pequena ainda pode bastar para um modelo de verdade responder, por isso os testes de contexto longo medem as respostas diretamente.';

export const next = [
	{
		title: 'A seguir: tokenização',
		text: 'O modelo lê o texto como pedaços de palavras. Por que ele erra a contagem de letras, e por que algumas línguas custam mais.'
	},
	{
		title: 'Depois: calibração',
		text: 'Quão seguro o modelo parece, comparado com quantas vezes ele acerta.'
	}
];
