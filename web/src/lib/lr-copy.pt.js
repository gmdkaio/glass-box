// Texto da página de taxa de aprendizado em português do Brasil. Mesmas exportações e as
// mesmas fontes de lr-copy.js; quando o texto em inglês mudar, atualize este também.

export function say({ loss, best, rate, falling }) {
	if (!Number.isFinite(loss) || loss > 4) return 'Os passos são tão grandes que cada um passa do ponto, e os números disparam: o modelo piora em tudo.';
	if (loss > best * 1.6 && falling) return 'Cada passo é pequeno, então o modelo ainda está aprendendo quando o treino acaba. Mais passadas ou um passo maior chegariam mais longe.';
	if (loss > best * 1.6) return 'Os passos passam do ponto, então a perda fica pulando em vez de se assentar.';
	if (rate >= 0.5) return 'Um começo ousado, e o agendamento encolhe os passos a tempo de se assentar.';
	return 'Grande o bastante para aprender rápido, pequeno o bastante para se assentar.';
}

export function trap(schedule, rate) {
	if (schedule === 'constant' && rate >= 0.5) return 'Experimente linear ou cosine: o mesmo começo, com passos que encolhem conforme o treino avança.';
	if (rate <= 0.005) return 'Um passo pequeno parece seguro, só que desperdiça o treino: a curva ainda está descendo na última passada.';
	return 'Veja a linha tracejada do texto de Millbrook: todo fine-tuning custa um pouco do que o modelo sabia, e passos maiores custam mais.';
}

export const parts = [
	{
		title: 'O treino dá passos',
		text: 'Depois de cada par de palavras, o treino ajusta um pouco cada número na direção que deixa a próxima palavra certa mais provável. A taxa de aprendizado é o tamanho de cada ajuste.'
	},
	{
		title: 'Pequeno demais, grande demais',
		text: 'Passos minúsculos quase não saem do lugar, e o treino acaba antes de o modelo aprender. Passos enormes pulam os valores bons, então a perda fica pulando ou dispara.'
	},
	{
		title: 'Agendamentos encolhem o passo',
		text: 'Um agendamento começa na taxa de aprendizado e a reduz ao longo do treino: em linha reta (linear) ou ao longo de uma curva (cosine). Passos grandes no começo, pequenos no fim.'
	}
];

export const trapCard =
	'A melhor taxa daqui só vale para este caso. Ela depende do modelo, do otimizador, do tamanho do lote e de você usar LoRA ou não, então um número que funcionou numa configuração pode estragar outra.';

export const why = [
	{
		title: 'As taxas de verdade são bem menores',
		text: 'Fine-tunings com o otimizador AdamW usam taxas em torno de 0.0001 a 0.0003 com LoRA e em torno de 0.00001 a 0.00002 num fine-tuning completo. Os exemplos e notebooks já começam com um valor razoável.'
	},
	{
		title: 'Acompanhe a curva de perda',
		text: 'O que você quer é uma queda suave que vai se achatando. Trechos em que a perda sobe costumam indicar uma taxa alta demais. Uma linha ainda caindo forte no fim indica que o treino aproveitaria mais passos ou uma taxa maior.'
	},
	{
		title: 'Use um agendamento',
		text: 'A maioria das receitas usa decaimento linear ou cosine. Muitas também acrescentam um aquecimento curto (warmup), de 5 a 10 por cento dos passos com a taxa subindo, que deixa o AdamW mais estável no começo.'
	},
	{
		title: 'Quando a perda dá saltos',
		text: 'Qualquer treino fica instável se a taxa for alta o bastante. Um warmup ou o corte de gradiente (gradient clipping) muitas vezes resolve na mesma taxa. Se não resolverem, baixe a taxa.'
	}
];

export const whyLead = 'Toda ferramenta de fine-tuning pede uma taxa de aprendizado e um agendamento. Algumas coisas para saber na hora de escolher.';

export const whyDraft =
	'Verificado em 07/10/2026 com os artigos do QLoRA e do Llama 2, os exemplos do Unsloth e do Axolotl, os padrões do Trainer do Hugging Face, o artigo do RAdam sobre warmup e o Deep Learning Tuning Playbook do Google, sobre como ler curvas de perda e corrigir treinos instáveis.';

export const hoodNote =
	'Esta rede dá passos simples, um par de palavras por vez, por isso as taxas dela são muito maiores que as de um fine-tuning de verdade. O treino de verdade usa AdamW, que ajusta cada passo pelo tamanho recente dos seus gradientes, e tira a média sobre lotes de exemplos; lá o warmup importa, e aqui ele fica de fora.';

export const next = [
	{
		title: 'A seguir: overfitting',
		text: 'Mesmo com uma boa taxa, passadas demais sobre pouco texto fazem o modelo decorar esse texto e esquecer o resto.'
	},
	{
		title: 'Depois: avaliando um modelo',
		text: 'Como saber se um fine-tuning ajudou, usando um texto em que o modelo nunca treinou.'
	}
];
