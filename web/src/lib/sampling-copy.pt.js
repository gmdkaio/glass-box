// Texto da página de amostragem em português do Brasil. Mesmas exportações e as mesmas
// fontes de sampling-copy.js; quando o texto em inglês mudar, atualize este também.

export const varietyNote =
	'Nome técnico: temperatura. Os apps costumam ajustar isso por você, e alguns modelos mais novos nem deixam mudar.';

export function say(variety, chance) {
	if (variety === 0)
		return 'A variedade está em 0, então ele sempre fica com a primeira opção. Nesta página você recebe a mesma resposta toda vez.';
	if (chance >= 0.9) return 'É bem provável que ele dê o que você queria.';
	if (chance >= 0.6) return 'Na maioria das vezes ele dá o que você queria, só que nem sempre.';
	return 'É mais provável ele dar outra coisa do que aquilo que você queria.';
}

export function trap(variety) {
	if (variety === 0) return 'Se a primeira opção estiver errada, ela erra toda vez.';
	return 'Uma pergunta mais clara faz mais diferença do que qualquer outra coisa que você pode mudar: ela leva as chances na direção do que você quis dizer.';
}

// o cartão da armadilha embaixo do gráfico de chances
export const trapCard =
	'Com variedade 0 o modelo sempre fica com a primeira opção, então a resposta quase não muda entre uma rodada e outra (modelos hospedados ainda podem variar um pouco). Uma resposta estável passa confiança, e se a primeira opção estiver errada, ela erra toda vez. O que ajuda é a pergunta que você faz, e conferir a resposta.';

export const shapes = [
	{
		title: 'O que ele aprendeu',
		who: 'Fixo',
		text: 'No treino o modelo aprendeu quais palavras costumam vir depois de quais. Você não pode mudar isso.'
	},
	{
		title: 'As palavras que você escreve',
		who: 'Seu',
		text: 'A sua pergunta muda as notas. Uma pergunta clara leva as chances na direção do que você quis dizer, e uma vaga as espalha.'
	},
	{
		title: 'O ajuste de variedade',
		who: 'Em geral, do app',
		text: 'O quanto ele arrisca ao escolher pelas chances. O nome técnico é temperatura. A maioria dos apps ajusta isso por você.'
	}
];

export const why = [
	{
		title: 'Diga o que você quer',
		text: 'Uma pergunta vaga espalha as chances por respostas que você não queria. Diga o assunto, o formato e os limites, como na pergunta específica acima.'
	},
	{
		title: 'Pergunte duas vezes',
		text: 'Se duas respostas à mesma pergunta discordam, trate a resposta como incerta e confira. Se concordam, é um sinal melhor, embora o modelo possa repetir o mesmo erro.'
	},
	{
		title: 'Confira o que importa',
		text: 'Uma resposta fluente ainda pode estar errada. Para fatos, números e nomes, peça fontes ou pesquise.'
	},
	{
		title: 'Uma resposta é um lance de dados',
		text: 'Uma resposta diz pouco sobre a próxima. Avalie o modelo depois de algumas tentativas.'
	}
];

export const whyLead = 'O que você escreve e como você confere o resultado são as partes que você controla.';

export const whyDraft =
	'Verificado em 06/10/2026 com as referências das APIs da OpenAI e da Anthropic (na OpenAI a temperatura vai de 0 a 2, com padrão 1, e modelos de raciocínio mais novos a deixam fixa), a documentação do llama.cpp sobre temperatura 0, e a Thinking Machines (2025), onde 1.000 rodadas de um mesmo prompt com temperatura 0 num modelo Qwen3 hospedado deram 80 respostas diferentes. Os ajustes variam por provedor e modelo.';

export const hoodNote =
	'Sistemas de verdade acrescentam mais coisas, como cortar as palavras menos prováveis (top-p, top-k). Com variedade 0 a fórmula dividiria por zero, então o modelo fica com a nota mais alta. Uma resposta de verdade é sorteada um token por vez, então cada token seguinte também pode variar, e modelos hospedados com temperatura 0 ainda podem variar um pouco entre rodadas.';

export const next = [
	{
		title: 'A seguir: erros em tarefas longas',
		text: 'Se cada passo de uma tarefa acerta 95% das vezes, uma tarefa de 20 passos termina sem erro em cerca de 36% das vezes. Por que verificações entre os passos importam.'
	},
	{
		title: 'Depois: contexto',
		text: 'Por que mais texto no prompt pode fazer a frase importante contar menos.'
	}
];
