<script>
	// pieces: the current text as tokens. curve: its token count after 0, 1, ...
	// merges. langs: the same sentence in each language, with its own curve.
	// merges: how many merges are in use. learned: how many there are.
	let { pieces, curve, langs, merges, learned } = $props();

	const x = (k) => 30 + (k / Math.max(learned, 1)) * 260;
	const top = $derived(curve ? Math.max(curve[0], 1) : 1);
	const y = (v) => 140 - (v / top) * 130;
	const nowTokens = $derived(curve ? curve[Math.min(merges, curve.length - 1)] : 0);

	const bills = $derived(langs ? langs.map((l) => ({ name: l.name, tokens: l.curve[Math.min(merges, l.curve.length - 1)] })) : []);
	const english = $derived(bills.length ? bills[0].tokens : 1);
	const most = $derived(bills.length ? Math.max(...bills.map((b) => b.tokens)) : 1);

	const tip = (p) => (p.part ? `byte ${p.part.byte} of ${p.part.of} of “${p.part.char}”` : `token ${p.id}`);
</script>

<div class="overflow-hidden rounded-lg border lg:grid lg:min-h-80 lg:grid-cols-[1.3fr_1fr_1fr]">
	<div class="border-b px-4 py-3.5 lg:border-r lg:border-b-0">
		<h3 class="text-xs font-medium">What the model reads</h3>
		{#if pieces}
			<div class="mt-3 flex flex-wrap gap-1 font-mono text-sm" aria-label="The text cut into tokens">
				{#each pieces as p (p.i)}
					<span
						title={tip(p)}
						class="rounded border px-1 py-0.5 whitespace-pre {p.part
							? 'border-dashed text-muted-foreground'
							: p.i % 2
								? 'bg-muted'
								: 'bg-sidebar'}">{p.text}</span
					>
				{/each}
			</div>
			<h4 class="mt-4 text-xs font-medium">What it actually gets</h4>
			<p class="mt-1.5 font-mono text-xs leading-relaxed break-words text-muted-foreground">
				{Array.from(pieces, (p) => p.id).join(' ')}
			</p>
			<p class="mt-3 text-xs text-muted-foreground">
				· is a space. A dashed piece is part of a letter that takes more than one byte; point at it to see which.
			</p>
		{/if}
	</div>

	<div class="border-b px-4 py-3.5 lg:border-r lg:border-b-0">
		<h3 class="text-xs font-medium">More merges, fewer pieces</h3>
		<p class="mt-3 text-xs text-muted-foreground">Tokens in your text, by how many merges the tokenizer has learned.</p>
		<div role="img" aria-label="The token count falls as the tokenizer learns more merges.">
			<svg viewBox="0 0 300 175" class="w-full">
				<g class="stroke-border" stroke-width="1">
					<line x1="30" y1="140" x2="290" y2="140" />
					<line x1="30" y1="10" x2="290" y2="10" />
					<line x1={x(learned / 2)} y1="10" x2={x(learned / 2)} y2="140" />
				</g>
				<g class="fill-muted-foreground" font-size="10">
					<text x={x(0)} y="156" text-anchor="middle">0</text>
					<text x={x(learned / 2)} y="156" text-anchor="middle">{Math.round(learned / 2)}</text>
					<text x={x(learned)} y="156" text-anchor="middle">{learned}</text>
					<text x="26" y="14" text-anchor="end">{top}</text>
					<text x="26" y="143" text-anchor="end">0</text>
					<text x="160" y="171" text-anchor="middle">merges learned</text>
				</g>
				{#if curve}
					<polyline points={Array.from(curve, (v, k) => `${x(k)},${y(v)}`).join(' ')} fill="none" class="stroke-foreground" stroke-width="2" />
					<circle cx={x(merges)} cy={y(nowTokens)} r="5" fill="none" class="stroke-foreground" stroke-width="2" />
				{/if}
			</svg>
		</div>
		<div class="text-xs text-muted-foreground">With no merges, every byte is a token. The ring marks your setting.</div>
	</div>

	<div class="px-4 py-3.5">
		<h3 class="text-xs font-medium">Same sentence, different bill</h3>
		<p class="mt-3 text-xs text-muted-foreground">One weather forecast in seven languages, with the merges learned from English.</p>
		<div class="mt-3 space-y-2">
			{#each bills as b (b.name)}
				<div class="grid grid-cols-[5.5rem_1fr_auto] items-center gap-2 text-xs">
					<span class={b.name === 'English' ? 'font-medium' : 'text-muted-foreground'}>{b.name}</span>
					<div class="h-2 overflow-hidden rounded-full bg-muted">
						<div class="h-full transition-[width] {b.name === 'English' ? 'bg-foreground' : 'bg-muted-foreground'}" style="width: {(b.tokens / most) * 100}%"></div>
					</div>
					<span class="text-right whitespace-nowrap text-muted-foreground tabular-nums">{b.tokens} · {(b.tokens / english).toFixed(1)}×</span>
				</div>
			{/each}
		</div>
		<div class="mt-3 text-xs text-muted-foreground">Tokens, and how many times the English count.</div>
	</div>
</div>
