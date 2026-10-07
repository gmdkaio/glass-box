// Texto do módulo de memória em português do Brasil. Mesmas exportações e as mesmas
// fontes de memory-copy.js; quando o texto em inglês mudar, atualize este também.

export function say(fits, free, card) {
	if (!fits) return 'Não cabe. Programas como o llama.cpp e o Ollama então deixam parte do modelo na memória comum, e ele fica muito mais lento, ou se recusam a carregá-lo.';
	if (free / card < 0.1) return 'Cabe, com pouca folga. Uma conversa mais longa ou um documento maior vai passar do limite.';
	return 'Cabe, com espaço sobrando para uma conversa mais longa.';
}

export function trap({ fits, weightsOnly, cacheShare }) {
	if (weightsOnly) return 'Só os números do modelo já enchem a placa. Menos bits por número é o único jeito de caber.';
	if (!fits) return 'O modelo em si cabe. É a conversa que passa do limite: diminua o contexto, ou guarde o cache em 8 bits.';
	if (cacheShare > 0.4) return 'Neste tamanho a conversa ocupa mais da placa do que uma boa parte do modelo. Conversas longas custam memória de verdade.';
	return 'A memória vai para duas coisas: os números do modelo, definidos uma vez quando ele carrega, e um cache que cresce a cada token.';
}

export const parts = [
	{
		title: 'Duas coisas enchem a placa',
		text: 'Os números do modelo ocupam uma quantidade fixa, definida pelo tamanho dele e por quantos bits cada número recebe. O cache do contexto cresce com a conversa.'
	},
	{
		title: 'O cache cresce a cada token',
		text: 'Para cada token o modelo guarda uma chave e um valor em cada camada, para não precisar reler a conversa inteira a cada nova palavra. Contexto em dobro, cache em dobro.'
	},
	{
		title: 'Cabeças compartilhadas, cache menor',
		text: 'Os modelos Qwen3 daqui leem com 32 ou 64 cabeças, mas guardam só 8 conjuntos de chaves e valores (grouped-query attention). Isso diminui o cache de quatro a oito vezes.'
	}
];

export const trapCard =
	'Quando o modelo carrega, parece que a parte difícil passou. Aí uma conversa longa ou um documento colado enche o cache, e o mesmo modelo fica lentíssimo ou para.';

export const why = [
	{
		title: 'Defina o contexto de que precisa',
		text: 'Os programas reservam o cache para o contexto inteiro que você define (num_ctx no Ollama, --ctx-size no llama.cpp). O Ollama escolhe 4k, 32k ou 256k por padrão conforme a memória da sua placa de vídeo. Definir 128k quando as suas conversas têm 8k desperdiça memória que poderia ir para um modelo maior.'
	},
	{
		title: 'Guarde o cache em 8 bits',
		text: 'Um cache de 8 bits tem metade do tamanho, com uma perda pequena. No llama.cpp são as opções --cache-type-k e --cache-type-v, e um cache de valores em 8 bits precisa de flash attention, que as versões recentes ligam sozinhas. No Ollama é a configuração OLLAMA_KV_CACHE_TYPE.'
	},
	{
		title: 'Deixe espaço para a conversa',
		text: 'Uma regra aproximada que esta página usa: escolha um modelo cujos números ocupem uns dois terços da placa. O resto vai para o cache e para o programa.'
	},
	{
		title: 'Fique de olho no transbordo',
		text: 'Se as palavras de repente saem muito mais devagar, parte do modelo foi para a memória comum. Diminua o contexto ou use menos bits.'
	}
];

export const whyLead = 'A memória decide qual modelo você consegue rodar e por quanto tempo consegue conversar com ele. Algumas configurações mudam bastante esse limite.';

export const whyDraft =
	'Verificado em 07/10/2026 com a documentação e o código do servidor do llama.cpp, o FAQ, a documentação de tamanho de contexto e as configurações do Ollama, e as configurações do Qwen3. Os 0.5 GB de sobrecarga do programa e a regra dos dois terços são suposições desta página. Um log do llama.cpp para um modelo de 8B mostra um buffer de trabalho de 0.26 GB com contexto de 512 tokens, e esse buffer cresce com o lote e o contexto. O Ollama não reserva nada a mais por padrão (OLLAMA_GPU_OVERHEAD é 0).';

export const hoodNote =
	'Os programas de verdade somam um pouco mais: buffers que crescem com o tamanho do lote, e alguns modelos que guardam algumas camadas em precisão maior. Os dois termos grandes são os desta página. A sua tela e outros programas também usam parte da placa, e arquivos populares de 4 bits como o Q4_K_M misturam precisões e ficam mais perto de 5 bits por número, em média.';

export const next = [
	{
		title: 'A seguir: embeddings',
		text: 'O cache guarda chaves e valores calculados a partir de cada token. Todos começam de uma lista de números por token, buscada numa tabela: o embedding dele.'
	},
	{
		title: 'Depois: ajustes de amostragem',
		text: 'Na outra ponta, o modelo transforma os seus números de volta em chances para cada token. As configurações decidem qual ele escolhe.'
	}
];
