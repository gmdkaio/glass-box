// Settings and text for the context page. The scores and every share come from the engine.

export { percent } from '$lib/sampling-sim.js';

export const QUESTION = 'When does the store close on Sundays?';
export const KEY = 'On Sundays the store closes at 6 pm.';

// sentences that match the question almost as well as the answer does
export const LOOKALIKES = [
	'On Saturdays the store closes at 9 pm.',
	'The café next door closes at 5 pm on Sundays.',
	'On public holidays the store closes at 4 pm.',
	'Sunday deliveries stop at noon.',
	'The pharmacy counter closes at 7 pm on weekdays.',
	'In December the store stays open until 10 pm.',
	'The car park closes an hour after the store.',
	'Online orders placed on Sunday ship on Monday.',
	'The outlet store closes at 8 pm on Sundays.',
	'Returns are not accepted after 5 pm.'
];

// the rest of a long pasted document, used in turn
const FILLER = [
	'Returns are accepted within 30 days with a receipt.',
	'Gift cards never expire.',
	'Members get free delivery on orders over $50.',
	'Prices in the weekly flyer are valid from Wednesday.',
	'We price-match local competitors on identical items.',
	'Large items can be delivered within 20 miles.',
	'Our staff can help you load heavy purchases.',
	'Store credit is issued for returns without a receipt.',
	'Bring your own bags to save 5 cents per bag.',
	'Electronics have a 14-day return window.',
	'Assembly service is available for furniture.',
	'Rain checks are offered on sold-out sale items.',
	'Paint can be mixed to match any sample.',
	'The garden centre opens in March.',
	'Seasonal items are restocked every Thursday.',
	'Loyalty points expire after two years.',
	'We accept all major credit cards.',
	'Custom orders take two to three weeks.',
	'Clearance items are final sale.',
	'Free coffee is available near the entrance.',
	'Key cutting is done at the service desk.',
	'Student discounts apply with a valid ID.',
	'Trolleys must stay within the car park.',
	'Pets on a leash are welcome.',
	'Recycling bins for batteries are by the exit.',
	'The service desk handles special orders.',
	'Installation is booked through the website.',
	'Damaged items can be exchanged in store.',
	'Gift wrapping is free in November and December.',
	'Our app shows which aisle each item is in.'
];

// The same sentences in Portuguese, in the same order. Only the page shows them: the
// engine makes up the scores, so the language does not change any number.
export const PT = {
	QUESTION: 'Que horas a loja fecha aos domingos?',
	KEY: 'Aos domingos a loja fecha às 18h.',
	LOOKALIKES: [
		'Aos sábados a loja fecha às 21h.',
		'O café ao lado fecha às 17h aos domingos.',
		'Nos feriados a loja fecha às 16h.',
		'As entregas de domingo param ao meio-dia.',
		'O balcão da farmácia fecha às 19h nos dias de semana.',
		'Em dezembro a loja fica aberta até as 22h.',
		'O estacionamento fecha uma hora depois da loja.',
		'Pedidos online feitos no domingo saem na segunda.',
		'A loja de ponta de estoque fecha às 20h aos domingos.',
		'Não aceitamos devoluções depois das 17h.'
	],
	FILLER: [
		'Devoluções são aceitas em até 30 dias com a nota fiscal.',
		'Vales-presente nunca expiram.',
		'Sócios têm entrega grátis em pedidos acima de R$ 250.',
		'Os preços do folheto semanal valem a partir de quarta.',
		'Cobrimos o preço de concorrentes da região em itens idênticos.',
		'Itens grandes podem ser entregues num raio de 30 km.',
		'Nossa equipe ajuda você a carregar compras pesadas.',
		'Devoluções sem nota fiscal viram crédito na loja.',
		'Traga sua sacola e economize 10 centavos por sacola.',
		'Eletrônicos têm prazo de devolução de 14 dias.',
		'Temos serviço de montagem para móveis.',
		'Itens de promoção esgotados podem ser reservados para depois.',
		'A tinta pode ser misturada para combinar com qualquer amostra.',
		'O setor de jardinagem abre em março.',
		'Itens de temporada são repostos toda quinta.',
		'Os pontos de fidelidade expiram depois de dois anos.',
		'Aceitamos os principais cartões de crédito.',
		'Pedidos sob encomenda levam de duas a três semanas.',
		'Itens de liquidação não têm troca.',
		'Há café grátis perto da entrada.',
		'Fazemos cópias de chaves no balcão de atendimento.',
		'Estudantes têm desconto com carteirinha válida.',
		'Os carrinhos devem ficar dentro do estacionamento.',
		'Animais na coleira são bem-vindos.',
		'Os coletores de pilhas ficam perto da saída.',
		'O balcão de atendimento cuida de pedidos especiais.',
		'A instalação é agendada pelo site.',
		'Itens danificados podem ser trocados na loja.',
		'O embrulho para presente é grátis em novembro e dezembro.',
		'Nosso app mostra em qual corredor está cada item.'
	]
};

export const MAX_SENTENCES = 200;
export const MAX_LOOKALIKES = LOOKALIKES.length;
export const TRIALS = 300;

// the toy's fixed numbers: how well each kind of sentence matches the question
export const SCORE = { key: 4, lookalike: 3.2, spread: 1, dip: 1.5 };

// three ways the same question reaches the model
export const SETUPS = [
	{ label: 'Just the question', hint: 'with the one line that answers it', n: 3, place: 0, lookalikes: 0,
		pt: { label: 'Só a pergunta', hint: 'com a única linha que a responde' } },
	{ label: 'A pasted page', hint: 'the opening hours section of the policy', n: 25, place: 0.5, lookalikes: 3,
		pt: { label: 'Uma página colada', hint: 'a seção de horários de funcionamento' } },
	{ label: 'The whole handbook', hint: 'every policy, pasted in full', n: 200, place: 0.5, lookalikes: 8,
		pt: { label: 'O manual inteiro', hint: 'todas as regras, coladas por completo' } }
];

const pick = (list, k) => list[k % list.length];

// what the engine's sentence kinds are called here (engine/context.h)
const KINDS = ['filler', 'lookalike', 'key'];

// One context: the text of every sentence (in English, and in Portuguese as pt), which
// kind it is, its score and its share of attention.
export function sampleContext(gb, n, keyAt, lookalikes, middle, seed) {
	const { scores, kinds } = gb.contextKinds(n, keyAt, SCORE.key, SCORE.spread, lookalikes, SCORE.lookalike, middle ? SCORE.dip : 0, seed);
	const share = gb.softmax(scores, 1);
	let alike = 0;
	let filler = 0;
	return Array.from(scores, (s, i) => {
		const kind = KINDS[kinds[i]];
		const k = kind === 'lookalike' ? alike++ : kind === 'filler' ? filler++ : 0;
		const [text, pt] = kind === 'key' ? [KEY, PT.KEY] : kind === 'lookalike' ? [pick(LOOKALIKES, k), pick(PT.LOOKALIKES, k)] : [pick(FILLER, k), pick(PT.FILLER, k)];
		return { i, kind, text, pt, score: s, share: share[i] };
	});
}

// the average shares of the key, the look-alikes and the rest, over many contexts
export function averageShares(gb, n, keyAt, lookalikes, middle, trials = 60) {
	return gb.contextSplit(n, keyAt, SCORE.key, SCORE.spread, lookalikes, SCORE.lookalike, middle ? SCORE.dip : 0, trials, 1000);
}

// the key's average share at every context length, and at every place in the context
const LENGTHS = [1, 2, 3, 5, 8, 12, 20, 30, 50, 80, 120, 200];
export function lengthCurve(gb, place, lookalikes, middle) {
	return LENGTHS.map((n) => ({
		n,
		share: gb.contextShare(n, place, SCORE.key, SCORE.spread, Math.min(lookalikes, n - 1), SCORE.lookalike, middle ? SCORE.dip : 0, TRIALS, 7)
	}));
}

export function placeCurve(gb, n, lookalikes, middle) {
	const points = [];
	for (let k = 0; k <= 20; k++) {
		const place = k / 20;
		points.push({
			place,
			share: gb.contextShare(n, place, SCORE.key, SCORE.spread, lookalikes, SCORE.lookalike, middle ? SCORE.dip : 0, TRIALS, 7)
		});
	}
	return points;
}
