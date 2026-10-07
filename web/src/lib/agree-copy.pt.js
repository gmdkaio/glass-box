// Texto do módulo "o que você quer ouvir" em português do Brasil. Mesmas exportações e as
// mesmas fontes de agree-copy.js; quando o texto em inglês mudar, atualize este também.

export function say({ share, neutral, gap }) {
	if (share - neutral < 0.05) return 'Ele se mantém firme: nada do que você acrescentou o mudou muito.';
	if (gap >= 3) return 'Ele sabe esta, então mesmo com os seus empurrões a resposta certa ainda ganha na maioria das vezes.';
	if (share >= 0.5) return 'A sua resposta agora ganha. A pergunta continuou a mesma, e o que o modelo ouviu sobre você bastou para mudá-lo.';
	return 'Os seus empurrões estão puxando o modelo para o seu lado. Mais alguns e a sua resposta ganha.';
}

export function trap(settings, pushback) {
	if (settings > 0) return 'Instruções personalizadas, memória e skills ficam no chat ao lado da sua mensagem, então o puxão delas pode estar lá antes de você digitar qualquer palavra.';
	if (pushback) return 'Um segundo "tem certeza?" também é um empurrão. Ele não traz nenhuma evidência nova, e mesmo assim as chances mudam.';
	return 'Ligue as configurações abaixo: cada uma inclina a resposta antes mesmo de você perguntar.';
}

export const parts = [
	{
		title: 'Ele aprendeu que concordar agrada',
		text: 'Modelos de chat são ajustados com respostas que pessoas avaliaram. As pessoas tendem a dar notas mais altas para respostas que concordam com elas, então o modelo aprende a pender para o lado de quem lê.'
	},
	{
		title: 'Tudo no chat conta',
		text: 'A sua opinião, o jeito como você formula a pergunta e as configurações que o app acrescenta nos bastidores são todos texto que o modelo lê. Cada um muda as chances das próximas palavras.'
	},
	{
		title: 'Ele cede mais onde sabe menos',
		text: 'Quando uma resposta lidera com folga, um empurrão quase não a move. Quando o modelo está inseguro, um empurrão pequeno decide a resposta, e é aí que você menos consegue conferir.'
	}
];

export const trapCard =
	'Concordância parece confirmação. Quando o modelo diz que você tem razão, ele pode estar dizendo o que a sua pergunta pediu, e quanto menos seguro ele estava, mais provável isso é.';

export const why = [
	{
		title: 'Faça a pergunta simples',
		text: 'Pergunte "quando a ponte foi construída?" antes de dizer o que você acha. Depois que a sua opinião está no chat, a resposta pende para ela.'
	},
	{
		title: 'Peça os argumentos contra',
		text: 'Para planos e decisões, pergunte o que há de errado, ou peça que ele defenda o outro lado. Elogio é fácil de conseguir e diz pouco.'
	},
	{
		title: 'Confira as suas configurações',
		text: 'Instruções personalizadas, memória e skills como "seja encorajador" podem inclinar as respostas; num estudo, memórias sobre o usuário fizeram vários modelos concordarem mais. Use-as para formato e tom.'
	},
	{
		title: 'Fique de olho em atalhos no código',
		text: 'Pressionados a fazer os testes passarem, agentes de programação às vezes chegam lá editando ou apagando os testes que falham. Peça código que falhe de forma visível, e leia o que mudou.'
	}
];

export const whyLead = 'Você molda a resposta mais do que parece. Alguns hábitos mantêm o modelo nos fatos.';

export const whyDraft =
	'Verificado em 07/10/2026 com estudos sobre bajulação (Sharma et al., 2023; Perez et al., 2022), mudança de opinião diante de críticas (Kumaran et al., 2025), memória e concordância (Jain et al., 2025) e trapaça em testes por agentes de programação (ImpossibleBench).';

export const hoodNote =
	'Aqui cada empurrão acrescenta o mesmo valor inventado à nota da sua resposta. Em modelos de verdade o puxão vem do treino com avaliações humanas, varia por modelo e por assunto, e os laboratórios hoje o medem e treinam alguns modelos para resistir a ele. A forma é a mesma: um empurrão pesa mais onde as respostas estavam próximas.';

export const next = [
	{
		title: 'A seguir: busca em documentos',
		text: 'Como um modelo procura informações antes de responder, e o que dá errado quando a busca encontra a página errada.'
	},
	{
		title: 'Depois: encolhendo um modelo',
		text: 'Por dentro começa com os números de que um modelo é feito: arredonde cada um para menos valores permitidos e veja quanto isso custa.'
	}
];
