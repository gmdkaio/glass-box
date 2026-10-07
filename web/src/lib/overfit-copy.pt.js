// Texto da página de overfitting em português do Brasil. Mesmas exportações e as mesmas
// fontes de overfit-copy.js; quando o texto em inglês mudar, atualize este também.

export function say({ pass, best, heldNow, heldBest }) {
	if (pass < best * 0.6) return 'Ele ainda está aprendendo: a perda nos dados separados está caindo, então mais algumas passadas ajudariam.';
	if (heldNow - heldBest < 0.15) return 'Este é quase o melhor ponto: as frases separadas estão tão bem previstas quanto dá.';
	return `Cada passada desde a passada ${best} deixou as frases separadas mais difíceis de prever: o modelo está decorando as frases de treino.`;
}

export function trap(size, pass) {
	if (size === 3) return 'Misturar texto antigo preserva mais do que o modelo sabia, ao custo de um ajuste um pouco pior às frases novas.';
	if (pass >= 75) return 'A perda de treino continua ótima. Só as frases separadas mostram o problema, e é por isso que você guarda algumas antes de treinar.';
	return 'Compare os tamanhos abaixo: com mais frases, a perda nos dados separados chega a um mínimo mais baixo, e a distância para a perda de treino fica menor.';
}

export const parts = [
	{
		title: 'Aprendendo o padrão',
		text: 'As primeiras passadas ensinam o que as frases têm em comum: quem vende o quê, onde a banda toca. Isso ajuda com frases que o modelo nunca viu.'
	},
	{
		title: 'Decorando',
		text: 'As passadas seguintes empurram as chances das frases de treino exatas até a certeza. O modelo passa a esperá-las palavra por palavra, e frases novas o surpreendem mais.'
	},
	{
		title: 'Esquecendo o resto',
		text: 'Cada passada também afasta os números do que eles guardavam antes. Quanto mais o modelo treina, mais difícil fica para ele o texto de Millbrook que já sabia.'
	}
];

export const trapCard =
	'Uma perda de treino caindo mostra que o modelo está se ajustando aos exemplos. Se ele aprendeu algo útil só aparece num texto em que ele não treinou, então guarde uma parte.';

export const why = [
	{
		title: 'Guarde uma parte dos dados',
		text: 'Separe uma fatia pequena dos seus exemplos, de alguns por cento até um décimo, como conjunto de avaliação. As ferramentas mostram a perda dele como eval_loss ao lado da perda de treino.'
	},
	{
		title: 'Pare no melhor ponto',
		text: 'Quando o eval_loss começar a subir, pare. Os treinadores podem salvar um checkpoint a cada avaliação e ficar com o melhor (load_best_model_at_end).'
	},
	{
		title: 'Poucas passadas no fine-tuning',
		text: 'Guias de fine-tuning como o do Unsloth sugerem de uma a três épocas. Depois disso, mais passadas pelo mesmo conjunto pequeno servem quase só para decorá-lo.'
	},
	{
		title: 'Misture dados gerais',
		text: 'Para manter o que o modelo já faz bem, misture alguns exemplos gerais aos seus dados de fine-tuning, ou use LoRA, que muda menos números e esquece menos.'
	}
];

export const whyLead = 'Todo fine-tuning corre esse risco. Alguns hábitos o mantêm sob controle.';

export const whyDraft =
	'Verificado em 07/10/2026 com a documentação do Trainer do Hugging Face, o guia de LoRA do Unsloth, as configurações de exemplo do Axolotl e estudos sobre esquecimento com LoRA (Biderman et al., 2024) e com dados antigos misturados (Scialom et al., 2022).';

export const hoodNote =
	'O modelo aqui só sabe qual palavra vem depois de qual, treinado com algumas dezenas de frases, com passos simples a uma taxa fixa. Fine-tunings de verdade rodam com bilhões de números, AdamW e lotes, e modelos maiores decoram um texto em menos passadas. As curvas têm o mesmo formato.';

export const next = [
	{
		title: 'A seguir: avaliando um modelo',
		text: 'Um conjunto separado é o começo. Como testar um modelo de forma justa, e por que as notas de benchmark podem enganar.'
	},
	{
		title: 'De volta a: taxa de aprendizado',
		text: 'Passos maiores também fazem o modelo esquecer mais rápido. As duas configurações trabalham juntas.'
	}
];
