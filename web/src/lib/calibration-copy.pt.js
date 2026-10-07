// Texto do módulo de calibração em português do Brasil. Mesmas exportações e as mesmas
// fontes de calibration-copy.js; quando o texto em inglês mudar, atualize este também.

export function say(gap) {
	if (gap < 0.03) return 'A confiança dele é honesta: quando diz 80%, acerta mais ou menos 80% das vezes.';
	if (gap < 0.1) return 'Ele parece um pouco mais seguro do que deveria, uma diferença que a maioria das pessoas nem notaria.';
	if (gap < 0.25) return 'Ele parece muito mais seguro do que o histórico dele mostra. A confiança deixou de ser um bom guia.';
	return 'A confiança dele quase não diz nada sobre se uma resposta está certa.';
}

export function trap(hard, shift, fixed) {
	if (fixed) return 'A correção puxa a confiança declarada para baixo até bater com o histórico nas perguntas verificadas.';
	if (shift < 0.2) return 'Um modelo cuja confiança bate com o histórico é chamado de calibrado. Deixe as perguntas mais difíceis ou o modelo mais ousado e veja as barras ficarem aquém dos contornos.';
	if (hard < 0.5) return 'Em perguntas difíceis o modelo parece quase tão seguro quanto nas fáceis, então a diferença é maior justamente onde você mais precisa da resposta.';
	return 'As barras ficam aquém dos contornos: em todo nível de confiança, ele acerta menos vezes do que diz.';
}

export const parts = [
	{
		title: 'A confiança é uma afirmação',
		text: 'Quando um modelo diz "tenho quase certeza", isso é mais texto que ele escreveu. Sai do mesmo processo, palavra por palavra, que a resposta, sem nada a mais conferindo.'
	},
	{
		title: 'Calibração é um histórico',
		text: 'Junte todas as respostas dadas com cerca de 80% de confiança e conte quantas estavam certas. Se forem mais ou menos 80%, o modelo está calibrado nesse nível.'
	},
	{
		title: 'Perguntas difíceis aumentam a diferença',
		text: 'Um modelo pode parecer igualmente seguro sobre um fato conhecido e sobre um obscuro. O histórico dele no obscuro é pior, então as mesmas palavras valem menos.'
	}
];

export const trapCard =
	'Um tom confiante parece prova. Numa pessoa muitas vezes é, porque as pessoas costumam hesitar quando não têm certeza. Um modelo pode escrever uma resposta fluente e segura tendo ou não os fatos.';

export const why = [
	{
		title: 'Trate "tenho certeza" como algo a conferir',
		text: 'Para tudo o que importa, peça a fonte ou o raciocínio e confira, por mais certa que a resposta pareça.'
	},
	{
		title: 'Pergunte mais de uma vez',
		text: 'Faça a mesma pergunta algumas vezes ou num chat novo. Se as respostas discordarem, o modelo está inseguro, seja qual for a confiança que declara.'
	},
	{
		title: 'Tenha mais cuidado onde ele sabe menos',
		text: 'Fatos obscuros, números exatos, acontecimentos recentes e assuntos de nicho são onde a confiança declarada é menos confiável.'
	},
	{
		title: 'Mantenha o seu próprio histórico',
		text: 'Em trabalhos que você repete, confira algumas respostas que dá para verificar. Isso mostra quanto vale a confiança dele no seu tipo de pergunta.'
	}
];

export const whyLead = 'Use a confiança declarada como uma pista entre várias, e monte o seu próprio histórico nas perguntas que importam para você.';

export const whyDraft =
	'Verificado em 07/10/2026 com o relatório técnico do GPT-4 (calibração depois do treino para chat); Xiong et al. (2024), que encontraram a confiança declarada quase sempre entre 80% e 100% em tarefas de dificuldades muito diferentes, com muitas respostas erradas dadas com 100%; Tian et al. (2023), sobre confiança declarada; e Kandpal et al. e Mallen et al. (2023), sobre fatos raros.';

export const hoodNote =
	'Modelos de verdade também podem informar a confiança como a probabilidade da própria resposta. Antes do fine-tuning para chat essa probabilidade acompanha bem a taxa de acerto; depois, a correspondência piora, e a confiança escrita em palavras às vezes é o melhor guia. O excesso de confiança de um modelo de verdade também muda com o assunto e o tipo de pergunta, enquanto esta página usa um deslocamento fixo. Os laboratórios medem a calibração em grandes conjuntos de perguntas com respostas conhecidas, do mesmo jeito que esta página.';

export const next = [
	{
		title: 'A seguir: o que você quer ouvir',
		text: 'Quão seguro ele parece é uma questão. De que lado ele fica é outra: as suas opiniões e configurações inclinam as respostas dele.'
	},
	{
		title: 'Depois: busca em documentos',
		text: 'Como um modelo procura informações antes de responder, e o que dá errado quando a busca encontra a página errada.'
	}
];
