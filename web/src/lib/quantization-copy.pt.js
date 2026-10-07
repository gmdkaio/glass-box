// Texto do módulo de quantização em português do Brasil. Mesmas exportações e as mesmas
// fontes de quantization-copy.js; quando o texto em inglês mudar, atualize este também.

// mesma ordem do controle, do menor para o maior
export const sizes = [
	{ label: 'Extremo', detail: '1 bit', note: '', bits: 1 },
	{ label: 'Para celular', detail: '2 bits', note: '', bits: 2 },
	{ label: 'Bom para notebook', detail: '4 bits', note: '', bits: 4 },
	{ label: 'Metade do tamanho', detail: '8 bits', note: 'A Qwen também lança uma versão FP8', bits: 8 },
	{ label: 'Tamanho original', detail: '16 bits', note: 'Como a Qwen lança os seus modelos', bits: 16 }
];

// o que o número de marcas significa para o número guardado no exemplo com números
export function ruleNote(bits) {
	if (bits <= 4)
		return 'Com tão poucas marcas, 1.0 cai entre duas delas, então o modelo precisa usar a mais próxima.';
	if (bits <= 8) return 'Há marcas suficientes para uma cair perto de 1.0, mas quase nunca exatamente nele.';
	return 'Há tantas marcas que uma fica quase exatamente em 1.0, então quase nada se perde.';
}

export function say(bits) {
	if (bits >= 7) return 'Quase nenhuma diferença. Os números mal se moveram.';
	if (bits >= 5) return 'Mudanças mínimas. A maioria das pessoas não perceberia.';
	if (bits >= 3)
		return 'Arredondamento visível. Uma conversa casual costuma ir bem, mas tarefas mais difíceis podem começar a falhar.';
	if (bits === 2) return 'Arredondamento pesado. Espere erros, principalmente em trabalhos com várias etapas.';
	return 'Cada número é forçado a um de dois valores. Arredondado assim depois do treino, o modelo fica quase todo quebrado.';
}

export function trap(bits) {
	if (bits >= 7) return 'Mais precisão custa memória e compra quase nada que você conseguiria ver.';
	if (bits >= 3)
		return 'Esta é a faixa em que encolher compensa: muita memória economizada por uma perda pequena.';
	return 'Com tão poucas opções, cada número agora fica longe de onde deveria estar.';
}

export const why = [
	{
		title: 'Prompt',
		text: 'Um modelo arredondado tem menos espaço para ser exato. Dê passos menores, uma tarefa clara por vez, e um exemplo resolvido. Uma instrução longa e embolada tem menos chance de sobreviver.'
	},
	{
		title: 'Verificações',
		text: 'Confira a saída: valide formatos, rode o código que ele escreve, compare os números com a fonte. Modelos arredondados escorregam em detalhes, então as verificações importam mais.'
	},
	{
		title: 'Estrutura em volta',
		text: 'Monte novas tentativas, testes e alternativas em volta do modelo. Se um modelo local pequeno falhar numa verificação, passe aquela etapa para um maior. Saiba qual versão você está chamando.'
	}
];

export const whyNote =
	'Se você só usa um modelo hospedado como o Claude, você nunca escolhe a precisão dele. Ela importa quando você mesmo roda um modelo aberto como o Qwen, em que o mesmo modelo vem em vários tamanhos. Serviços que hospedam modelos abertos também escolhem uma: o OpenRouter lista a precisão que cada provedor informa, de 4 a 16 bits, e deixa você filtrar por ela.';

export const whyDraft =
	'Verificado em 07/10/2026 com as configurações da Qwen no Hugging Face (Qwen3-8B e Qwen3.8-Flash-Next são lançados em bfloat16, e Qwen3.8-Flash-Next-FP8 é a versão oficial de 8 bits da Qwen), o relatório de 2025 da Apple sobre o seu modelo no aparelho, que roda a 2 bits depois de ser treinado para isso, Huang et al. (2024) sobre a queda de acerto com poucos bits, e a documentação de roteamento de provedores do OpenRouter sobre a precisão que os serviços informam.';

export const floatNote =
	'Modelos reais de 16 e 8 bits usam formatos de ponto flutuante (bfloat16, FP8) que espaçam os valores de forma desigual. Esta página usa valores igualmente espaçados para manter a conta simples. Formatos reais de 4 bits também dão a cada bloquinho de números a sua própria escala, então um valor grande só afeta o próprio bloco. Os 90 números daqui são aleatórios; os de um modelo de verdade vêm do treino, e quanto ele perde em cada tamanho se mede testando as respostas dele.';

export const next = [
	{
		title: 'A seguir: cabendo na memória',
		text: 'Números menores fazem o modelo caber. Só que cada palavra da conversa também precisa de memória, e conversas longas precisam de muita.'
	},
	{
		title: 'Depois: embeddings',
		text: 'Antes de tudo isso, o modelo troca cada pedaço de palavra por uma lista de números de uma tabela. Essas listas colocam palavras de sentido parecido perto umas das outras.'
	}
];
