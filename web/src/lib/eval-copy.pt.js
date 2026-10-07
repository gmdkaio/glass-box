// Texto da página de avaliação em português do Brasil. Mesmas exportações e as mesmas
// fontes de eval-copy.js; quando o texto em inglês mudar, atualize este também.

export function say({ leak, gap }) {
	if (leak === 0) return 'Nada vazou, então os dois conjuntos medem a mesma coisa e as notas batem.';
	if (gap >= 40) return 'A nota pública agora mede principalmente quais perguntas o modelo já viu. A nota das perguntas novas quase não se mexe.';
	return 'Cada pergunta vazada que ele agora acerta soma na nota pública. A nota das perguntas novas fica mais ou menos igual.';
}

export function trap(leak) {
	if (leak === 0) return 'Aumente o vazamento: o painel público acende um quadrado de cada vez, enquanto o painel das perguntas novas fica mais ou menos onde estava.';
	if (leak === 12) return 'Uma nota perfeita, num modelo que responde perguntas novas tão mal quanto antes. Cada pergunta pública agora testa o que ele lembra.';
	return 'Olhe os quadrados vazados: o modelo acerta porque viu a resposta, então eles não dizem nada sobre o que ele sabe fazer.';
}

export const parts = [
	{
		title: 'Um teste é uma amostra',
		text: 'Um benchmark é um conjunto de perguntas com respostas conhecidas. A nota representa como o modelo se sai em todas as perguntas parecidas, desde que ele não tenha visto essas.'
	},
	{
		title: 'Vazamentos viram teste de memória',
		text: 'Benchmarks são publicados, copiados e citados pela web, e o texto da web acaba nos dados de treino. Um modelo que leu uma pergunta pode repetir a resposta sem saber nada.'
	},
	{
		title: 'Perguntas novas mostram o nível real',
		text: 'Perguntas escritas depois do treino do modelo não podem ter vazado. Quando a nota pública fica muito acima da nota nas perguntas novas, com a mesma dificuldade, a causa provável é um vazamento.'
	}
];

export const trapCard =
	'Um benchmark vazado dá uma resposta errada e confiante sobre o modelo. A nota parece precisa, e parte dela conta respostas que o modelo lembrou.';

export const why = [
	{
		title: 'Teste na sua própria tarefa',
		text: 'Antes de confiar num modelo ou num fine-tuning, junte algumas dezenas de exemplos reais da sua tarefa com boas respostas, deixe-os fora de qualquer treino e dê nota ao modelo neles.'
	},
	{
		title: 'Prefira testes novos e privados',
		text: 'Alguns benchmarks, como LiveBench e LiveCodeBench, acrescentam perguntas novas com o tempo; outros mantêm as suas em sigilo. É bem menos provável que um modelo já as tenha visto.'
	},
	{
		title: 'Testes pequenos oscilam',
		text: 'Com doze perguntas, uma resposta certa a mais move a nota em oito pontos. Trate diferenças pequenas entre modelos como empate, a menos que o teste seja grande.'
	},
	{
		title: 'Confira a distância',
		text: 'Se um modelo tira uma nota muito melhor num benchmark público antigo do que em perguntas mais novas do mesmo tipo e da mesma dificuldade, desconfie que ele já viu as antigas.'
	}
];

export const whyLead = 'Os rankings comparam modelos pelas notas em benchmarks. Alguns hábitos ajudam você a lê-los e a testar modelos por conta própria.';

export const whyDraft =
	'Verificado em 07/10/2026 com as verificações de sobreposição nos relatórios do GPT-3, do GPT-4 e do Llama 2, o estudo GSM1k com perguntas novas de matemática e os artigos do LiveBench e do LiveCodeBench.';

export const hoodNote =
	'O modelo aqui lê só a palavra antes da lacuna, e uma pergunta conta como certa quando o primeiro palpite para essa palavra é a resposta. Benchmarks de verdade fazem perguntas completas a modelos treinados com trilhões de tokens, em que um vazamento é um punhado de cópias entre bilhões de páginas. Os laboratórios procuram as perguntas de teste nos dados de treino comparando sequências de palavras ou de caracteres.';

export const next = [
	{
		title: 'De volta a: overfitting',
		text: 'Um benchmark vazado é overfitting no próprio teste: o mesmo decorar, medido com o conjunto errado.'
	},
	{
		title: 'De volta ao começo: como funciona',
		text: 'Cada número destas páginas vem de modelos como o de lá: chances para a próxima palavra, aprendidas a partir de texto.'
	}
];
