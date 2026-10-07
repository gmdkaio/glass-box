// Texto do módulo de LoRA em português do Brasil. Mesmas exportações e as mesmas
// fontes de lora-copy.js; quando o texto em inglês mudar, atualize este também.
// say recebe o nome do texto já em português (local(TEXTS[t], 'label')).

export function say(gain, label) {
	if (gain >= 0.97) return `Para "${label.toLowerCase()}", este rank consegue quase tudo o que um fine-tuning completo consegue.`;
	if (gain >= 0.85) return 'A maior parte do ganho está aí. Subir um degrau no rank fecha o resto.';
	return 'O remendo é fino demais para tanta mudança. Aumente o rank e veja o ganho subir.';
}

export function trap(r, t) {
	if (t === 2 && r === 1) return 'Uma direção só não comporta fatos novos e palavras novas ao mesmo tempo. Muito para aprender pede mais algumas.';
	if (r >= 8) return 'Nesta rede minúscula um rank alto treina quase tantos números quanto um fine-tuning completo. Num modelo de verdade, rank 16 ainda é uma fatia mínima dele: veja a linha do Qwen3.';
	return 'Compare os três textos: as mudanças pequenas chegam ao topo com rank 1 ou 2, e muito para aprender pede mais.';
}

export const parts = [
	{
		title: 'Fine-tuning muda os números',
		text: 'Treinar com um texto novo empurra os números do modelo para que o texto novo fique menos surpreendente. Um fine-tuning completo empurra todos eles.'
	},
	{
		title: 'LoRA treina um remendo fino',
		text: 'A LoRA mantém o modelo como está. Ao lado de cada camada ela treina duas tiras finas, B e A, e soma o produto delas aos números da camada.'
	},
	{
		title: 'O rank é a largura do remendo',
		text: 'O rank é em quantas direções o remendo consegue mudar as coisas. Uma mudança pequena cabe em poucas direções, então um rank baixo guarda a maior parte dela.'
	}
];

export const trapCard =
	'A LoRA diminui o que você treina e salva. O modelo inteiro ainda precisa ser carregado, na memória e na precisão dele, com o remendo por cima.';

export const why = [
	{
		title: 'Comece com rank 16',
		text: 'O PEFT usa rank 8 por padrão e o Unsloth 16, e os notebooks de Qwen3 do Unsloth usam 32. Aumente só se uma verificação com dados separados mostrar que o modelo ainda não pegou o que você ensinou.'
	},
	{
		title: 'Remende todas as camadas',
		text: 'Remendar as camadas feed-forward além da atenção costuma ajudar, com algumas vezes mais números treinados. Ainda é uma parte pequena do modelo.'
	},
	{
		title: 'Adaptadores são arquivos pequenos',
		text: 'Um remendo de rank 16 em todos os pesos do Qwen3-8B tem cerca de 44 milhões de números, menos de 100 MB em 16 bits, então você pode guardar um por tarefa e trocá-los sobre o mesmo modelo base.'
	},
	{
		title: 'Cuidado com a escala',
		text: 'As ferramentas também pedem alpha, que dá a escala do remendo. Um começo comum é alpha igual ao rank ou o dobro dele; mude rank e alpha juntos.'
	}
];

export const whyLead = 'Ferramentas como Unsloth, Axolotl e a biblioteca PEFT rodam a LoRA para você. Algumas configurações decidem como ela vai.';

export const whyDraft =
	'Verificado em 06/10/2026 com o LoraConfig do PEFT, a documentação, os padrões da biblioteca e os notebooks de Qwen3 do Unsloth, o artigo do QLoRA (Dettmers et al., 2023) sobre remendar todas as camadas, e a configuração do Qwen3-8B para o tamanho do adaptador.';

export const hoodNote =
	'Fine-tunings de verdade rodam em modelos com milhares de números ocultos e muitas camadas, com alpha dando a escala do remendo; aqui a rede tem 16 números ocultos e duas camadas, e alpha é 1. O modelo base só sabe qual palavra vem depois de qual, a partir de vinte frases, e treina com passos simples. A LoRA de verdade remenda os pesos de atenção e feed-forward dentro de cada camada, costuma deixar a tabela de tokens como está, e treina com AdamW a taxas por volta de 0.0002.';

export const next = [
	{
		title: 'A seguir: taxa de aprendizado',
		text: 'Todo fine-tuning aqui usou o mesmo tamanho de passo. Qual deve ser o tamanho de um passo, e por que um passo grande demais estraga um modelo.'
	},
	{
		title: 'Depois: overfitting',
		text: 'Treine tempo demais com texto de menos e o modelo decora o texto, esquecendo o que sabia.'
	}
];
