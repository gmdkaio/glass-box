// Texto do módulo de tokenização em português do Brasil. Mesmas exportações e as mesmas
// fontes de tokenization-copy.js; quando o texto em inglês mudar, atualize este também.

export function say(perToken) {
	if (perToken >= 3.5) return 'Aqui a maioria das palavras é um só token, então o modelo lê este texto em pedaços grandes e conhecidos.';
	if (perToken >= 2) return 'As palavras comuns ficam inteiras, e as mais raras se quebram em pedaços.';
	if (perToken > 1.05) return 'O texto é quase todo feito de pedacinhos: uma ou duas letras por token.';
	return 'Cada byte é um token. É isso que o modelo leria sem nenhuma junção.';
}

export function trap({ digits, foreign, letters }) {
	if (letters)
		return 'O modelo vê "strawberry" como alguns números, um para cada pedaço. Para contar os r, ele precisa lembrar como cada pedaço se escreve.';
	if (digits) return 'Aqui os números longos são cortados onde as junções caem, então 12,450 pode virar 1, 2, uma vírgula, 4 e 50. A maioria dos tokenizadores atuais corta números por uma regra fixa, em dígitos soltos ou grupos de até três, e as contas continuam mais difíceis do que parecem.';
	if (foreign)
		return 'Um tokenizador que aprendeu quase só com inglês tem poucas junções para outras línguas, então o mesmo sentido gasta mais tokens. Letras como ã ocupam dois bytes e podem ser divididas.';
	return 'Palavras frequentes em inglês ganham um token cada. Palavras raras, nomes e erros de digitação se quebram em pedaços.';
}

export const parts = [
	{
		title: 'O texto vira números',
		text: 'Antes de o modelo ver qualquer coisa, o seu texto é cortado em tokens e cada token é trocado por um número de uma lista fixa. O modelo só recebe os números.'
	},
	{
		title: 'Os pares frequentes são juntados',
		text: 'A lista é aprendida a partir de texto: comece com bytes soltos, ache o par que aparece lado a lado mais vezes, transforme-o em um token e repita. As palavras comuns acabam inteiras.'
	},
	{
		title: 'As letras ficam dentro dos pedaços',
		text: 'Quando "berry" vira um token, o modelo lê esse pedaço como um número, com as letras b, e, r, r, y escondidas dentro. Ele só sabe quais são se aprendeu como aquele token se escreve.'
	}
];

export const trapCard =
	'Uma pergunta sobre letras parece trivial para quem lê letras. O modelo lê números de tokens, então contar letras, inverter uma palavra ou fazer contas dígito por dígito exige trabalhar com algo escondido dentro deles.';

export const why = [
	{
		title: 'Peça para soletrar antes',
		text: 'Em perguntas sobre letras, peça ao modelo para escrever a palavra uma letra de cada vez e depois contar. Soletrada, cada letra vira um token.'
	},
	{
		title: 'Deixe uma ferramenta fazer as contas',
		text: 'Para contas exatas com números longos, peça ao modelo para usar uma calculadora ou escrever código. Muitos tokenizadores cortam números longos em dígitos soltos ou grupos de até três, então o modelo trabalha com pedaços do número.'
	},
	{
		title: 'Reserve espaço para a sua língua',
		text: 'A mesma mensagem em muitas línguas gasta mais tokens do que em inglês. Isso ocupa mais do limite de contexto e, quando você paga por token, custa mais.'
	},
	{
		title: 'Espere mais dificuldade com palavras raras',
		text: 'Nomes raros, códigos e erros de digitação são divididos em muitos pedaços pequenos. Soletre ou explique os que importam para o modelo não ter que adivinhar.'
	}
];

export const whyLead = 'Alguns hábitos contornam o que o tokenizador esconde.';

export const whyDraft =
	'Verificado em 07/10/2026 com Petrov et al. (2023), sobre o custo do tokenizador em cada língua (até 15 vezes); Somide (2026), em que tokenizadores atuais (os do GPT-4o, do Llama 3.1 e do Qwen3) precisam em média de 2,6 a 3,3 vezes mais tokens do que o inglês para as mesmas frases em 20 línguas africanas; o vocabulário de 151.936 tokens do Qwen3; como os tokenizadores do Qwen e da OpenAI dividem dígitos; Edman et al. (2024), em que os modelos sabiam como seus tokens se escrevem e ainda assim tinham dificuldade para usar isso ao mudar um texto; e Fu et al. (2024), em que o GPT-4o errou a contagem de letras em 17% das palavras e a maioria dos modelos abertos em mais da metade, com os erros subindo muito quando uma letra aparece mais de uma vez.';

export const hoodNote =
	'Tokenizadores de verdade funcionam do mesmo jeito, mas aprendem com muito mais texto em muitas línguas e guardam de dezenas de milhares a algumas centenas de milhares de tokens. A diferença entre línguas neles é menor do que neste brinquedo que só conhece inglês, e ela continua existindo. Eles também dividem o texto antes por regras próprias para espaços, pontuação e dígitos, e só então aplicam as junções.';

export const next = [
	{
		title: 'A seguir: calibração',
		text: 'Quão seguro o modelo parece, comparado com quantas vezes ele acerta.'
	},
	{
		title: 'Depois: o que você quer ouvir',
		text: 'Modelos de chat tendem a concordar com você. Como as suas opiniões e configurações inclinam as respostas.'
	}
];
