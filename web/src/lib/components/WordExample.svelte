<script>
	// A made-up example. The model scores each candidate next word. Rounding the
	// scores can make two words equal, and then it cannot tell which is better.
	import { t } from '$lib/i18n.svelte.js';

	let { gb, bits } = $props();

	// the words are only labels here: the scores are fixed, so the language changes no number
	const PROMPT = 'The capital of France is';
	const WORDS = ['Paris', 'Lyon', 'Marseille', 'Berlin'];
	const PT = { PROMPT: 'A capital da França é', WORDS: ['Paris', 'Lyon', 'Marselha', 'Berlim'] };
	const name = (word) => t(word, PT.WORDS[WORDS.indexOf(word)]);
	const SCORES = Float64Array.from([3.9, 3.6, 2.1, 0.4]);
	const RANGE = 8; // scores can be anything from -8 to 8
	const TIE = 1e-9;

	const before = $derived(gb.softmax(SCORES, 1));
	const rounded = $derived(gb.quantize(SCORES, bits, RANGE).out);
	const after = $derived(gb.softmax(rounded, 1));

	const bestBefore = $derived(Math.max(...before));
	const bestAfter = $derived(Math.max(...after));
	const first = $derived(WORDS[before.findIndex((p) => p >= bestBefore - TIE)]);
	const winners = $derived(WORDS.filter((_, i) => after[i] >= bestAfter - TIE));

	const plural = (n) => (n === 1 ? '' : 's');
	const pct = (p) => Math.round(p * 100);
	const list = (items) =>
		items.length < 2 ? items.join('') : items.slice(0, -1).join(', ') + t(' and ', ' e ') + items[items.length - 1];
</script>

<div class="rounded-lg border px-4 py-3.5">
	<h3 class="text-xs font-medium">{t('A made-up example with words', 'Um exemplo inventado com palavras')}</h3>

	<p class="mt-3 text-sm leading-relaxed text-muted-foreground">
		{t(
			'A language model picks its next word by giving every candidate a score. The higher the score, the likelier the word. These four scores are made up.',
			'Um modelo de linguagem escolhe a próxima palavra dando uma nota a cada candidata. Quanto maior a nota, mais provável a palavra. Estas quatro notas são inventadas.'
		)}
	</p>

	<div class="mt-4 rounded-md border px-3 py-2.5 text-center text-lg">
		{t(PROMPT, PT.PROMPT)} <span class="border-b border-dashed border-foreground px-3">&nbsp;?&nbsp;</span>
	</div>

	<div class="mt-4 space-y-2.5">
		{#each WORDS as word, i (word)}
			{@const isWinner = winners.includes(word)}
			<div class="grid grid-cols-[6.5rem_1fr_4.5rem] items-center gap-3 text-sm md:grid-cols-[8rem_1fr_9rem]">
				<div class={isWinner ? 'font-semibold' : 'text-muted-foreground'}>{name(word)}</div>
				<div class="relative h-5 rounded-sm bg-muted/60">
					<div
						class="absolute inset-y-0 left-0 rounded-sm bg-foreground/80 transition-[width] duration-700 ease-out"
						style="width: {after[i] * 100}%"
					></div>
					<div
						class="absolute inset-y-0 left-0 rounded-sm border border-muted-foreground"
						style="width: {before[i] * 100}%"
					></div>
				</div>
				<div class="text-xs text-muted-foreground tabular-nums">
					<span class={isWinner ? 'text-foreground' : ''}>{pct(after[i])}%</span>
					<span class="max-md:hidden"> · {t('score', 'nota')} {SCORES[i].toFixed(1)} → {rounded[i].toFixed(2)}</span>
				</div>
			</div>
		{/each}
	</div>
	<div class="mt-2 text-xs text-muted-foreground">
		{t(
			`Outline: the odds with the original scores. Solid: the odds after rounding to ${bits} bit${plural(bits)}.`,
			`Contorno: as chances com as notas originais. Cheia: as chances depois de arredondar para ${bits} bit${plural(bits)}.`
		)}
	</div>

	<p class="mt-4 text-sm leading-relaxed">
		{#if winners.length === WORDS.length}
			{t(
				'All four words ended up with the same score, so the model cannot tell them apart. Picking the next word is now a four-way coin flip.',
				'As quatro palavras ficaram com a mesma nota, então o modelo não consegue diferenciá-las. Escolher a próxima palavra agora é um sorteio entre quatro.'
			)}
		{:else if winners.length > 1}
			{t(
				`${list(winners.map(name))} ended up with the same score, so the model cannot tell which is better. It is a coin flip between them.`,
				`${list(winners.map(name))} ficaram com a mesma nota, então o modelo não consegue saber qual é melhor. É um sorteio entre elas.`
			)}
		{:else}
			{t('The model picks', 'O modelo escolhe')} <b class="font-medium">{name(winners[0])}</b>
			{t(`with ${pct(Math.max(...after))}% odds.`, `com ${pct(Math.max(...after))}% de chance.`)}
		{/if}
		{#if winners.length === 1 && winners[0] !== first}
			{t(`The original scores would have picked ${first}.`, `As notas originais teriam escolhido ${name(first)}.`)}
		{:else if winners.length > 1 && winners.includes(first)}
			{t(
				`The original scores would have picked ${first} with ${pct(bestBefore)}% odds.`,
				`As notas originais teriam escolhido ${name(first)} com ${pct(bestBefore)}% de chance.`
			)}
		{/if}
	</p>
	<p class="mt-2 text-xs text-muted-foreground">
		{t(
			'A real model scores tens of thousands to a few hundred thousand tokens. The same thing happens there: when rounding makes two scores equal, the model can no longer tell which token is better.',
			'Um modelo de verdade dá nota a dezenas de milhares até algumas centenas de milhares de tokens. Lá acontece a mesma coisa: quando o arredondamento deixa duas notas iguais, o modelo não consegue mais saber qual token é melhor.'
		)}
	</p>
</div>
