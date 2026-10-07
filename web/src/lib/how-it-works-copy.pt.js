// Texto da página como funciona em português do Brasil. Mesmas exportações e as mesmas
// fontes de how-it-works-copy.js; quando o texto em inglês mudar, atualize este também.

export const steps = [
	{ title: 'Ler', text: 'A palavra atual entra na rede.' },
	{ title: 'Pontuar', text: 'A rede calcula as chances de cada próxima palavra possível.' },
	{ title: 'Escolher', text: 'Uma palavra é escolhida, como num dado viciado.' },
	{ title: 'Acrescentar', text: 'Ela vai para o fim, e o ciclo recomeça.' }
];

export const untrained =
	'A rede ainda não aprendeu nada. As conexões começam como números aleatórios, então quase toda palavra parece igualmente provável. Aperte Ensinar a rede.';

// o que a rede diz agora, ao lado do que o texto diz
export function say(word, isStart, top, networkP, textP) {
	const where = isStart ? 'No começo de uma frase' : `Depois de "${word}"`;
	return `${where} a favorita da rede é "${top}", com ${networkP}. Contando no texto, dá ${textP}.`;
}

export const trap =
	'A rede escolhe palavras que costumam vir uma depois da outra, seja o resultado verdadeiro ou não. Uma frase fluente pode descrever algo que nunca aconteceu, e as frases abaixo são feitas assim.';

export const why = [
	{
		title: 'Ele continua o seu texto',
		text: 'A sua mensagem é o começo do texto que o modelo continua escrevendo. O jeito como você começa define para onde ele vai.'
	},
	{
		title: 'Provável ainda pode estar errado',
		text: 'Ele escolhe palavras que costumam vir em seguida, então uma frase fluente ainda pode estar errada. Confira o que importa.'
	},
	{
		title: 'Ele escolhe pelas chances',
		text: 'Cada palavra é escolhida pelas chances, e é por isso que a mesma pergunta pode ter respostas diferentes.'
	},
	{
		title: 'Ele reaproveita o que viu',
		text: 'Um modelo só consegue reaproveitar padrões do texto de treino. Coisas raras, novas ou muito específicas são onde ele tende a ser menos confiável.'
	}
];

export const whyLead =
	'Tudo o que um assistente escreve sai deste ciclo. Entender o ciclo explica a maior parte das surpresas.';

export const whyDraft =
	'Verificado em 06/10/2026 para o Qwen3: cerca de 36 trilhões de tokens de texto de treino em 119 línguas, de 0,6 a 235 bilhões de números, e 32.768 tokens lidos de uma vez (131.072 com YaRN); fatos raros são os menos confiáveis (Kandpal et al. e Mallen et al., 2023).';

export const hoodSteps = [
	'valor oculto = tanh( conexão vinda da palavra + um pequeno viés )',
	'nota de cada próxima palavra = soma de ( valor oculto × conexão ) + um pequeno viés',
	'chances = cada nota transformada em uma parte do total (softmax)'
];

export const teachingNote =
	'Ensinar: para cada par de palavras do texto, empurre cada número um pouco na direção que deixa a próxima palavra certa mais provável (descida do gradiente). Repita isso no texto inteiro muitas vezes.';

export const hoodNote =
	'Um modelo de verdade tem bilhões desses números, lê muito mais do que a última palavra e aprende com muito mais texto. As partes dele são organizadas de outro jeito (transformers, com atenção), e ele continua sendo um conjunto de números ajustados até as chances combinarem com o texto. Ele lê pedaços de palavras chamados tokens, de uma lista que vai de dezenas de milhares a algumas centenas de milhares (151.936 no Qwen3), aprende com um otimizador chamado Adam em lotes grandes, e assistentes de chat recebem mais treino com conversas, o que os ensina a responder perguntas.';

export const next = [
	{
		title: 'A seguir: respostas que variam',
		text: 'Se ele escolhe pelas chances, por que a mesma pergunta dá respostas diferentes, e o que você pode fazer a respeito?'
	},
	{
		title: 'Depois: erros em tarefas longas',
		text: 'Cada escolha pode sair um pouco errada. Numa tarefa longa, esses erros se somam.'
	}
];
