<script>
	import { QUESTION, MAX_SENTENCES, TRIALS, percent } from '$lib/context-sim.js';

	// sentences: one context, each with its text, kind and share of attention.
	// lengths, places: the key's average share by context length and by place.
	// n, place: the current length and place, for the rings.
	let { sentences, lengths, places, n, place } = $props();

	const most = $derived(sentences ? Math.max(...sentences.map((s) => s.share)) : 1);
	const top = $derived(sentences ? [...sentences].sort((a, b) => b.share - a.share).slice(0, 5) : []);
	const key = $derived(sentences ? sentences.find((s) => s.kind === 'key') : null);
	const keyRank = $derived(key ? top.indexOf(key) : -1);

	// length on a log scale, from 1 to 200 sentences
	const lx = (v) => 30 + (Math.log(v) / Math.log(MAX_SENTENCES)) * 260;
	const px = (v) => 30 + v * 260;
	const y = (s) => 140 - s * 130;
	const nowLength = $derived(lengths ? lengths.reduce((a, b) => (Math.abs(b.n - n) < Math.abs(a.n - n) ? b : a)) : null);
	const nowPlace = $derived(places ? places.reduce((a, b) => (Math.abs(b.place - place) < Math.abs(a.place - place) ? b : a)) : null);
</script>

<div class="overflow-hidden rounded-lg border lg:grid lg:min-h-80 lg:grid-cols-[1.3fr_1fr_1fr]">
	<div class="border-b px-4 py-3.5 lg:border-r lg:border-b-0">
		<h3 class="text-xs font-medium">Where the model's attention goes</h3>
		<div class="mt-3 rounded-md border px-3 py-2 text-center text-sm">{QUESTION}</div>
		{#if sentences}
			<svg viewBox="0 0 300 64" class="mt-3 w-full" role="img" aria-label="Share of attention for each sentence in the context, in order">
				<line x1="0" y1="52" x2="300" y2="52" class="stroke-border" />
				{#each sentences as s (s.i)}
					{@const w = 300 / sentences.length}
					{@const h = Math.max(1, (s.share / most) * 48)}
					<rect
						x={s.i * w + (w > 3 ? 0.5 : 0)}
						y={52 - h}
						width={Math.max(w - (w > 3 ? 1 : 0), 0.6)}
						height={h}
						class={s.kind === 'key' ? 'fill-foreground' : s.kind === 'lookalike' ? 'fill-muted-foreground' : 'fill-muted-foreground/35'}
					/>
				{/each}
				<text x="0" y="62" font-size="8" class="fill-muted-foreground">first sentence</text>
				<text x="300" y="62" font-size="8" text-anchor="end" class="fill-muted-foreground">last</text>
			</svg>
			<h4 class="mt-3 text-xs font-medium">The five sentences it attends to most</h4>
			<ol class="mt-1.5 space-y-1.5">
				{#each top as s (s.i)}
					<li class="grid grid-cols-[1fr_3rem] items-baseline gap-2 text-sm">
						<span class={s.kind === 'key' ? 'font-semibold' : 'text-muted-foreground'}>
							{s.text}{s.kind === 'key' ? ' ✓' : ''}
						</span>
						<span class="text-right text-xs text-muted-foreground tabular-nums">{percent(s.share)}</span>
					</li>
				{/each}
			</ol>
			{#if keyRank < 0 && key}
				<p class="mt-1.5 text-xs text-muted-foreground">
					The answer, sentence {key.i + 1} of {sentences.length}, is not in the top five. It gets {percent(key.share)}.
				</p>
			{/if}
		{/if}
	</div>

	<div class="border-b px-4 py-3.5 lg:border-r lg:border-b-0">
		<h3 class="text-xs font-medium">More text, a smaller share</h3>
		<p class="mt-3 text-xs text-muted-foreground">The answer's share of attention, by how many sentences you paste.</p>
		<div role="img" aria-label="The answer's share of attention falls as the context gets longer.">
			<svg viewBox="0 0 300 175" class="w-full">
				<g class="stroke-border" stroke-width="1">
					{#each [1, 10, 100] as v (v)}
						<line x1={lx(v)} y1="10" x2={lx(v)} y2="140" />
					{/each}
					<line x1="30" y1="140" x2="290" y2="140" />
					<line x1="30" y1="10" x2="290" y2="10" />
				</g>
				<g class="fill-muted-foreground" font-size="10">
					{#each [1, 10, 100, 200] as v (v)}
						<text x={lx(v)} y="156" text-anchor="middle">{v}</text>
					{/each}
					<text x="26" y="14" text-anchor="end">100%</text>
					<text x="26" y="143" text-anchor="end">0%</text>
					<text x="160" y="171" text-anchor="middle">sentences (log scale)</text>
				</g>
				{#if lengths}
					<polyline points={lengths.map((p) => `${lx(p.n)},${y(p.share)}`).join(' ')} fill="none" class="stroke-foreground" stroke-width="2" />
					{#if nowLength}
						<circle cx={lx(nowLength.n)} cy={y(nowLength.share)} r="5" fill="none" class="stroke-foreground" stroke-width="2" />
					{/if}
				{/if}
			</svg>
		</div>
		<div class="text-xs text-muted-foreground">Averaged over {TRIALS} random contexts per point. The ring marks the nearest length to yours.</div>
	</div>

	<div class="px-4 py-3.5">
		<h3 class="text-xs font-medium">Where you put it</h3>
		<p class="mt-3 text-xs text-muted-foreground">The answer's share of attention, by its place among {n} sentences.</p>
		<div role="img" aria-label="The answer's share of attention by where it sits in the context.">
			<svg viewBox="0 0 300 175" class="w-full">
				<g class="stroke-border" stroke-width="1">
					{#each [0, 0.5, 1] as v (v)}
						<line x1={px(v)} y1="10" x2={px(v)} y2="140" />
					{/each}
					<line x1="30" y1="140" x2="290" y2="140" />
					<line x1="30" y1="10" x2="290" y2="10" />
				</g>
				<g class="fill-muted-foreground" font-size="10">
					<text x={px(0)} y="156" text-anchor="middle">start</text>
					<text x={px(0.5)} y="156" text-anchor="middle">middle</text>
					<text x={px(1)} y="156" text-anchor="middle">end</text>
					<text x="26" y="14" text-anchor="end">100%</text>
					<text x="26" y="143" text-anchor="end">0%</text>
				</g>
				{#if places}
					<polyline points={places.map((p) => `${px(p.place)},${y(p.share)}`).join(' ')} fill="none" class="stroke-foreground" stroke-width="2" />
					{#if nowPlace}
						<circle cx={px(nowPlace.place)} cy={y(nowPlace.share)} r="5" fill="none" class="stroke-foreground" stroke-width="2" />
					{/if}
				{/if}
			</svg>
		</div>
		<div class="text-xs text-muted-foreground">The ring marks where your answer sits.</div>
	</div>
</div>
