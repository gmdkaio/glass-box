// Texto do módulo de embeddings em português do Brasil. Mesmas exportações e as mesmas
// fontes de embeddings-copy.js; quando o texto em inglês mudar, atualize este também.
// As palavras e frases do modelo de brinquedo ficam em inglês, entre aspas.

export function say(topics) {
	if (topics >= 0.85) return 'As palavras caem perto de outras usadas do mesmo jeito: transporte perto de transporte, comida perto de comida.';
	if (topics >= 0.5) return 'Alguns grupos se formaram, mas muitas palavras ainda estão entre estranhas.';
	return 'Com tão poucos números, a maioria das palavras fica parecida, e o mapa vira um borrão só.';
}

export function trap({ k, keywordFound, meaningFound }) {
	if (k <= 2) return 'Aqui dois números são poucos para separar os cinco temas. Acrescente dimensões e veja os grupos se afastarem.';
	if (!keywordFound && meaningFound)
		return 'A pergunta não tem nenhuma palavra em comum com o aviso certo, então a busca por palavras-chave não acha nada. A busca por significado acha mesmo assim, porque as palavras dela ficam perto das palavras do aviso.';
	if (k >= 16) return 'A partir de certo ponto, mais números acrescentam pouco aqui: algumas dezenas de frases só ensinam até certo ponto.';
	return 'Ninguém disse ao modelo que "coach" é parecido com "bus". Ele descobriu isso pelas palavras que vêm antes e depois de cada um.';
}

export const parts = [
	{
		title: 'Você conhece uma palavra pelas vizinhas',
		text: 'Conte quais palavras aparecem perto de cada palavra. "Bus" e "coach" aparecem perto de "ticket", "driver" e "station", então as contagens delas ficam parecidas.'
	},
	{
		title: 'Esprema as contagens em poucos números',
		text: 'A tabela de contagens tem uma coluna para cada palavra. Quebrá-la nas direções principais guarda o padrão em poucos números por palavra: o embedding dela.'
	},
	{
		title: 'Perto nos números, perto no uso',
		text: 'Duas palavras cujos números apontam para o mesmo lado são usadas de forma parecida. O ângulo entre elas (similaridade de cosseno) é a medida que a maioria das buscas por significado usa.'
	}
];

export const trapCard =
	'Perto nos números quer dizer usado do mesmo jeito, o que costuma coincidir com significado parecido. Opostos como "early" e "late" aparecem no mesmo tipo de frase, então também acabam vizinhos: experimente "early" acima.';

export const why = [
	{
		title: 'Busque por significado',
		text: 'A busca por embeddings acha trechos que dizem a mesma coisa com outras palavras. É o que permite a um assistente de documentos responder "earliest coach" a partir de uma página sobre o "first bus".'
	},
	{
		title: 'Cuidado com os opostos',
		text: 'Palavras usadas nos mesmos lugares ficam juntas mesmo quando querem dizer o contrário. Confira resultados de busca por significado em que cedo e tarde, ou permitido e proibido, aparecem juntos.'
	},
	{
		title: 'Mesmo modelo, mesmo espaço',
		text: 'Vetores de modelos de embedding diferentes não se alinham. Busque com o mesmo modelo que gerou os embeddings dos seus documentos, e gere tudo de novo quando trocar de modelo.'
	},
	{
		title: 'Misture com palavras-chave',
		text: 'Nomes, códigos e números exatos combinam melhor por palavra-chave. Muitas configurações rodam as duas buscas e juntam os resultados.'
	}
];

export const whyLead = 'Embeddings movem a busca por significado, nas suas ferramentas e em configurações locais de documentos. Algumas coisas para saber quando você depende deles.';

export const whyDraft =
	'Verificado em 06/10/2026 com Levy e Goldberg (2014), sobre contar e prever chegarem ao mesmo espaço, o relatório do Qwen3 Embedding, sobre como modelos de embedding para busca são treinados, e o post Contextual Retrieval da Anthropic, sobre misturar busca por palavras-chave e por significado.';

export const hoodNote =
	'Modelos de verdade aprendem seus embeddings durante o treino, prevendo palavras, e dão a cada token de algumas centenas a alguns milhares de números. Contar vizinhas e quebrar a tabela em direções, como aqui, chega ao mesmo tipo de espaço, e os primeiros vetores de palavras eram feitos assim. Modelos de embedding para busca são treinados por contraste: aproximam uma pergunta do trecho que a responde e afastam trechos sem relação. Eles leem um trecho inteiro e dão a ele um vetor, enquanto esta página tira a média das palavras, e dentro de um modelo os números de uma palavra mudam com a frase em volta.';

export const next = [
	{
		title: 'A seguir: ajustes de amostragem',
		text: 'Na outra ponta, o modelo transforma os números de volta em chances para cada token. As configurações decidem qual ele escolhe.'
	},
	{
		title: 'Depois: LoRA',
		text: 'As configurações mudam como ele escolhe. Para mudar o que ele sabe, você muda o próprio modelo, sem treinar tudo de novo.'
	}
];
