<script>
	// A made-up example. The model scores each candidate next word. Rounding the
	// scores can make two words equal, and then it cannot tell which is better.
	let { gb, bits } = $props();

	const PROMPT = 'The capital of France is';
	const WORDS = ['Paris', 'Lyon', 'Marseille', 'Berlin'];
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
		items.length < 2 ? items.join('') : items.slice(0, -1).join(', ') + ' and ' + items[items.length - 1];
</script>

<div class="rounded-lg border px-4 py-3.5">
	<h3 class="text-xs font-medium">A made-up example with words</h3>

	<p class="mt-3 text-sm leading-relaxed text-muted-foreground">
		A language model picks its next word by giving every candidate a score. The higher the score, the likelier the word. These four scores are made up.
	</p>

	<div class="mt-4 rounded-md border px-3 py-2.5 text-center text-lg">
		{PROMPT} <span class="border-b border-dashed border-foreground px-3">&nbsp;?&nbsp;</span>
	</div>

	<div class="mt-4 space-y-2.5">
		{#each WORDS as word, i (word)}
			{@const isWinner = winners.includes(word)}
			<div class="grid grid-cols-[6.5rem_1fr_4.5rem] items-center gap-3 text-sm md:grid-cols-[8rem_1fr_9rem]">
				<div class={isWinner ? 'font-semibold' : 'text-muted-foreground'}>{word}</div>
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
					<span class="max-md:hidden"> · score {SCORES[i].toFixed(1)} → {rounded[i].toFixed(2)}</span>
				</div>
			</div>
		{/each}
	</div>
	<div class="mt-2 text-xs text-muted-foreground">Outline: the odds with the original scores. Solid: the odds after rounding to {bits} bit{plural(bits)}.</div>

	<p class="mt-4 text-sm leading-relaxed">
		{#if winners.length === WORDS.length}
			All four words ended up with the same score, so the model cannot tell them apart. Picking the next word is now a four-way coin flip.
		{:else if winners.length > 1}
			{list(winners)} ended up with the same score, so the model cannot tell which is better. It is a coin flip between them.
		{:else}
			The model picks <b class="font-medium">{winners[0]}</b> with {pct(Math.max(...after))}% odds.
		{/if}
		{#if winners.length === 1 && winners[0] !== first}
			The original scores would have picked {first}.
		{:else if winners.length > 1 && winners.includes(first)}
			The original scores would have picked {first} with {pct(bestBefore)}% odds.
		{/if}
	</p>
	<p class="mt-2 text-xs text-muted-foreground">
		A real model scores tens of thousands of tokens. The same thing happens there: when rounding makes two scores equal, the model can no longer tell which token is better.
	</p>
</div>
