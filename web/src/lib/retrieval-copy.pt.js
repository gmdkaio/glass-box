// Texto do módulo de busca em documentos em português do Brasil. Mesmas exportações e as
// mesmas fontes de retrieval-copy.js; quando o texto em inglês mudar, atualize este também.

export function say(found, right) {
	if (!found) return 'A página com a resposta nunca chega ao modelo, então o que ele disser vem de outro lugar.';
	if (right >= 0.8) return 'A página certa é entregue e se destaca, então a resposta muito provavelmente está certa.';
	if (right >= 0.4) return 'A página certa é entregue, mas outras páginas disputam a resposta com ela.';
	return 'A página certa está na pilha, mas é mais provável que o modelo responda a partir de outra.';
}

export function trap({ found, oldWins, wording, meaning, k }) {
	if (oldWins) return 'O horário antigo usa as mesmas palavras do novo e é mais curto, então a busca o coloca mais acima. Remova as páginas antigas e veja a certa assumir.';
	if (!found && wording === 'other' && !meaning) return 'A busca por palavras exatas só encontra as palavras que você digitou. "Earliest coach" nunca combina com "first bus". Mude para a busca por significado.';
	if (!found) return 'Entregue mais páginas, ou pergunte com as palavras que os documentos usam.';
	if (k > 4) return 'Cada página a mais é mais uma de onde o modelo pode tirar a resposta. Depois de algumas páginas, aqui, a certa fica com uma parte menor.';
	return 'Pergunte com as palavras que os seus documentos usam, e deixe as versões antigas fora da pilha.';
}

export const parts = [
	{
		title: 'Primeiro a busca, depois a resposta',
		text: 'Quando um assistente responde a partir dos seus arquivos ou da web, uma busca roda antes. Ela dá uma nota a cada página em relação à sua pergunta e entrega as primeiras ao modelo.'
	},
	{
		title: 'O modelo responde com o que recebe',
		text: 'O modelo lê só as páginas que recebeu. Se a página certa ficou de fora, ele responde mesmo assim, com o que recebeu.'
	},
	{
		title: 'Mais páginas ajudam e atrapalham',
		text: 'Entregar mais páginas aumenta a chance de a certa estar entre elas. A partir de certo ponto, as páginas quase iguais a mais começam a desviar as respostas.'
	}
];

export const trapCard =
	'Uma resposta com fonte parece conferida. A fonte é o que a busca encontrou: um horário antigo, uma página que divide algumas palavras com a pergunta, ou a página certa vencida pelas vizinhas.';

export const why = [
	{
		title: 'Use as palavras dos documentos',
		text: 'Se o manual diz "ônibus", pergunte sobre o ônibus. Nomes, códigos e termos exatos da fonte ajudam uma busca por palavras-chave a achar a página certa.'
	},
	{
		title: 'Tire as versões antigas',
		text: 'Mantenha cópias desatualizadas fora das pastas em que o assistente busca. Uma página antiga que combina bem pode vencer a atual.'
	},
	{
		title: 'Confira a página citada',
		text: 'Abra a fonte que ele cita e ache a frase que ele usou. Se a página for antiga ou fora do assunto, a resposta também é.'
	},
	{
		title: 'Mostre o lugar certo',
		text: 'Quando você sabe onde está a resposta, cite o documento ou cole o trecho. Isso pula a busca e os erros dela.'
	}
];

export const whyLead = 'A resposta só pode ser tão boa quanto as páginas que a busca entrega, e você pode influenciar o que ela encontra.';

export const whyDraft =
	'Verificado em 06/10/2026 com o post Contextual Retrieval da Anthropic (busca híbrida, e 20 trechos indo melhor que 5 ou 10), Jin et al. (2024) sobre a qualidade das respostas conforme se acrescentam trechos, e a normalização por tamanho do BM25 (Robertson e Zaragoza, 2009).';

export const hoodNote =
	'Sistemas de verdade buscam por palavras-chave assim, por significado com embeddings (números que colocam textos parecidos perto uns dos outros), ou pelos dois. A busca por significado teria ligado "earliest coach" a "first bus" aqui. Nenhum dos dois tipos distingue uma página antiga de uma atual só pelas palavras. Aqui a busca por significado é uma lista curta de palavras equivalentes escrita à mão, e o modelo responde a partir de uma única página. Sistemas de verdade cortam os documentos em trechos, buscam em milhões deles, muitas vezes reordenam os primeiros com um segundo modelo, e entregam ao modelo todas as páginas que recebem, para que ele possa combiná-las ou dizer que nenhuma responde.';

export const next = [
	{
		title: 'A seguir: encolhendo um modelo',
		text: 'Por dentro começa pelos números de que um modelo é feito: arredonde cada um para menos valores permitidos e veja quanto isso custa.'
	},
	{
		title: 'Depois: cabendo na memória',
		text: 'O que decide se um modelo roda na sua máquina: o tamanho dele, a precisão e o comprimento da conversa.'
	}
];
