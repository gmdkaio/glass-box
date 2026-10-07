// Texto da página de tarefas longas em português do Brasil. Mesmas exportações e as mesmas
// fontes de compounding-copy.js; quando o texto em inglês mudar, atualize este também.

export const stepNote =
	'Um passo é qualquer ponto onde o modelo pode errar: uma chamada de ferramenta, uma edição num arquivo, um fato que ele afirma, um número que ele leva adiante.';

export function say(odds) {
	if (odds >= 0.9) return 'A maioria das rodadas termina sem erro.';
	if (odds >= 0.6) return 'A maioria das rodadas termina sem erro, e uma boa parte não.';
	if (odds >= 0.3) return 'Uma rodada sem erro é quase cara ou coroa.';
	return 'Uma rodada sem erro é a exceção. A maioria das rodadas tem um erro em algum lugar.';
}

export function trap(every, plain, checked) {
	if (every === 0)
		return 'Cada passo sozinho parece confiável, e a chance de todos estarem certos diminui a cada passo.';
	if (checked - plain < 0.02)
		return 'As verificações quase não ajudam aqui. Uma verificação só manda o trabalho de volta se perceber o erro.';
	return 'As verificações recuperam a maior parte do que o tamanho custou, porque mandam um trecho de volta enquanto o erro ainda está perto.';
}

export function runSay(outcome, brokenAt, every, redos) {
	const step = brokenAt + 1;
	let extra = '';
	if (redos === 1) extra = ' Uma verificação mandou um trecho ser refeito no caminho.';
	if (redos > 1) extra = ` As verificações mandaram trechos serem refeitos ${redos} vezes no caminho.`;
	if (outcome === 0) return `Terminou sem erro.${extra}`;
	if (outcome === 2)
		return `Desistiu no passo ${step}: a verificação continuou achando erros, e o trecho foi refeito o máximo de vezes permitido.`;
	if (every === 0) return `O passo ${step} estava errado, então tudo depois dele foi construído sobre um erro. Nada apontou o problema.${extra}`;
	return `O passo ${step} estava errado e a verificação seguinte não percebeu, então a rodada continuou como se estivesse tudo bem.${extra}`;
}

export const parts = [
	{
		title: 'Chances pequenas se multiplicam',
		text: 'Cada passo precisa estar certo. 95% vezes 95% já dá 90%, e vinte deles dão 36%.'
	},
	{
		title: 'Erros no começo custam mais',
		text: 'Tudo depois de um passo errado é construído sobre ele. Nas 1.000 rodadas, os primeiros passos estragam mais rodadas, porque toda rodada passa por eles.'
	},
	{
		title: 'Uma verificação transforma uma tarefa longa em várias curtas',
		text: 'Uma verificação a cada poucos passos só precisa confiar naquele trecho curto. Quando acha um erro, só aquele trecho é refeito.'
	}
];

export const trapCard =
	'Uma verificação que deixa passar um erro é idêntica a uma verificação que aprovou, então teste as suas verificações também: dê a elas um erro conhecido e veja se elas pegam.';

export const why = [
	{
		title: 'Divida pedidos grandes',
		text: 'Peça uma parte, olhe o resultado, depois peça a próxima. Cada parte é uma cadeia curta, e você é a verificação entre elas.'
	},
	{
		title: 'Confira cedo',
		text: 'Olhe o plano ou o primeiro arquivo antes que o modelo construa em cima dele. Um erro pego no passo 2 custa dois passos para refazer; um pego no passo 20 custa vinte.'
	},
	{
		title: 'Dê a ele um jeito de se conferir',
		text: 'Testes, um linter, um script que compara números com a fonte. Um agente que roda verificações entre os passos pega os próprios deslizes. Verificações com retorno de fora, como testes que rodam, pegam mais do que pedir ao modelo para reler o próprio trabalho.'
	},
	{
		title: 'Leia o fim pensando no começo',
		text: 'Uma resposta longa e segura pode depender de um único passo errado lá no começo. Se algo no fim parece estranho, procure onde ela errou primeiro.'
	}
];

export const whyLead = 'Duas coisas ajudam mais: cadeias mais curtas, e verificações no meio.';

export const whyDraft =
	'Verificado em 06/10/2026 com o estudo de horizonte de tempo da METR (Kwa et al., 2025) sobre sucesso de agentes e tamanho da tarefa, e Huang et al. (2024) sobre autocorreção sem retorno de fora. Passos de verdade dependem uns dos outros: alguns erros são corrigidos por passos seguintes, e outros deixam os seguintes mais propensos a errar.';

export const hoodNote =
	'Aqui os passos são independentes e igualmente confiáveis, e um erro que passa sempre estraga a tarefa. Tarefas de verdade são mais bagunçadas: alguns passos são mais difíceis que outros, e um passo seguinte às vezes conserta um anterior. Verificações de verdade também às vezes rejeitam trabalho correto, e pegam alguns tipos de erro com muito mais frequência que outros.';

export const next = [
	{
		title: 'A seguir: contexto',
		text: 'Por que mais texto no prompt pode fazer a frase importante contar menos.'
	},
	{
		title: 'Depois: tokenização',
		text: 'O modelo lê o texto como pedaços de palavras. Por que ele erra a contagem de letras, e por que algumas línguas custam mais.'
	}
];
