<script>
	import { MODELS, CONTEXTS, GIB, gbOf, kbOf, tokens } from '$lib/memory-sim.js';
	import { eased } from '$lib/motion.svelte.js';
	import PlayButton from '$lib/components/PlayButton.svelte';

	// b: the budget for your settings. model, bits, context, cacheBits: the settings.
	// bitsRows: longest chat per precision. modelRows: longest chat per model.
	// curve: total memory by context, for both cache sizes. per: cache per token,
	// for each model. play: the sweep's button. pace: easing time.
	let { b, model, bits, context, cacheBits, bitsRows, modelRows, curve, per, play, pace = 450 } = $props();

	const m = $derived(MODELS[model]);
	const FIRST = CONTEXTS[0];
	const LAST = CONTEXTS.at(-1);
	const STEPS = Math.log2(LAST / FIRST);
	// token counts on a log scale, 1k to 128k, so 24k and 64k both read
	const share = (t) => (t > 0 ? Math.max(0, Math.min(1, Math.log2(t / FIRST) / STEPS)) : 0);

	// the bar on the card, eased so a growing chat fills it smoothly
	const parts = eased(() => (b ? [b.weights, b.cache, b.overhead, b.card] : null), () => pace);
	const scale = $derived(parts.current ? Math.max(parts.current[0] + parts.current[1] + parts.current[2], parts.current[3]) : 1);
	const pct = (v) => (v / scale) * 100;

	// The chart is drawn at its real pixel width, so a wide panel gives the
	// curve more room while text and lines stay the size they are in other charts.
	let width = $state(0);
	const H = 220,
		L = 34,
		T = 10,
		B = H - 30;
	const R = $derived(width - 8);
	const lines = eased(() => (curve ? { full: curve.map((p) => p.full), half: curve.map((p) => p.half) } : null), () => pace);
	const ring = eased(() => context, () => pace);
	const fitsTo = eased(() => (b ? b.maxTokens : 0), () => pace);
	const cx = (t) => L + share(Math.max(t, FIRST)) * (R - L);
	const top = $derived(curve && b ? Math.max(curve.at(-1).full, b.card) * 1.06 : GIB);
	const cy = (v) => B - (v / top) * (B - T);
	const step = $derived([2, 5, 10, 20, 50].find((s) => top / GIB / s <= 5) ?? 100);
	const ticks = $derived(Array.from({ length: Math.floor(top / GIB / step) + 1 }, (_, i) => i * step));
	const poly = (ys) => ys.map((v, i) => `${cx(CONTEXTS[i])},${cy(v)}`).join(' ');
	function at(ys, t) {
		const k = Math.log2(Math.max(t, FIRST) / FIRST);
		const lo = Math.max(0, Math.min(ys.length - 2, Math.floor(k)));
		return ys[lo] + (ys[lo + 1] - ys[lo]) * (k - lo);
	}
</script>

{#snippet meter(label, value, shown, outline, strong)}
	<div class="grid grid-cols-[6.5rem_1fr_4rem] items-center gap-2.5 text-sm">
		<div class="truncate {strong ? 'font-semibold' : 'text-muted-foreground'}">{label}</div>
		<div class="relative h-4 rounded-sm bg-muted/60">
			<div class="absolute inset-y-0 left-0 rounded-sm bg-foreground/80 transition-[width] duration-500 ease-out" style="width: {value * 100}%"></div>
			{#if outline !== undefined}
				<div class="absolute inset-y-0 left-0 rounded-sm border border-muted-foreground transition-[width] duration-500 ease-out" style="width: {outline * 100}%"></div>
			{/if}
		</div>
		<div class="text-right text-xs text-muted-foreground tabular-nums">{shown}</div>
	</div>
{/snippet}

<div class="overflow-hidden rounded-lg border">
	<div class="lg:grid lg:grid-cols-[1fr_1.7fr]">
		<div class="border-b px-4 py-3.5 lg:border-r">
			<h3 class="text-xs font-medium">What sits on your {Math.round(b ? b.card / GIB : 0)} GB card</h3>
			{#if b && parts.current}
				{@const [w, c, o, card] = parts.current}
				<div class="relative mt-3.5 h-8 rounded-md bg-muted/60" role="img" aria-label="Memory used by the model, the context cache and the runtime, against the card's size.">
					<div class="absolute inset-y-0 left-0 flex overflow-hidden rounded-md" style="width: {pct(w + c + o)}%">
						<div class="h-full bg-foreground/80" style="width: {(w / (w + c + o)) * 100}%"></div>
						<div class="h-full border-l-2 border-background bg-muted-foreground" style="width: {(c / (w + c + o)) * 100}%"></div>
						<div class="h-full border-l-2 border-background bg-muted-foreground/40" style="width: {(o / (w + c + o)) * 100}%"></div>
					</div>
					<div class="absolute -inset-y-1.5 w-0.5 bg-foreground" style="left: calc({pct(card)}% - 1px)"></div>
				</div>
				<div class="mt-1 flex justify-between text-xs text-muted-foreground">
					<span>0</span><span>{b.fits ? `card: ${gbOf(b.card)}` : `card ends at ${gbOf(b.card)}`}</span>
				</div>

				<div class="mt-3 space-y-1.5 text-sm">
					<div class="flex items-baseline justify-between gap-3">
						<span><span class="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm bg-foreground/80 align-middle"></span>The model's numbers</span>
						<span class="tabular-nums">{gbOf(b.weights)}</span>
					</div>
					<div class="-mt-1 pl-4 text-xs text-muted-foreground">{(m.params / 1e9).toFixed(1)}B numbers at {bits} bits{bits < 16 ? ', plus scales' : ''}</div>
					<div class="flex items-baseline justify-between gap-3">
						<span><span class="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm bg-muted-foreground align-middle"></span>The context cache</span>
						<span class="tabular-nums">{gbOf(b.cache)}</span>
					</div>
					<div class="-mt-1 pl-4 text-xs text-muted-foreground">
						{context.toLocaleString('en')} tokens × {kbOf(b.perToken)}: {m.layers} layers × key and value × {m.kvHeads} heads × {m.headDim} numbers × {cacheBits / 8}
						{cacheBits === 8 ? 'byte' : 'bytes'}
					</div>
					<div class="flex items-baseline justify-between gap-3">
						<span><span class="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm bg-muted-foreground/40 align-middle"></span>The runtime</span>
						<span class="tabular-nums">about {gbOf(b.overhead)}</span>
					</div>
				</div>
				<div class="mt-3 rounded-md bg-muted/60 px-3 py-2 text-sm">
					<b class="font-semibold">{gbOf(b.total)} of {gbOf(b.card)}</b>:
					{b.fits ? `fits, ${gbOf(b.card - b.total)} free` : `over by ${gbOf(b.total - b.card)}`}.
					<span class="text-muted-foreground">Longest chat that fits: {b.maxTokens ? `${tokens(b.maxTokens)} tokens` : 'none'}.</span>
				</div>
			{/if}
		</div>

		<div class="border-b px-4 py-3.5">
			<div class="flex items-start justify-between gap-3">
				<div>
					<h3 class="text-xs font-medium">Longer chats, more memory</h3>
					<p class="mt-1 text-xs text-muted-foreground">{m.name} at {bits} bits. Solid: a 16-bit cache. Dashed: an 8-bit cache. Shaded: does not fit.</p>
				</div>
				<PlayButton {play} />
			</div>
			<div class="mt-1" bind:clientWidth={width}>
				{#if lines.current && b && width > 0}
					{@const ls = lines.current}
					{@const edge = fitsTo.current > 0 ? cx(fitsTo.current) : L}
					<svg {width} height={H} viewBox="0 0 {width} {H}" class="block" role="img" aria-label="Memory needed grows with the length of the chat until it passes the card's size.">
						{#if fitsTo.current < LAST}
							<rect x={Math.min(edge, R)} y={T} width={Math.max(0, R - edge)} height={B - T} class="fill-foreground/[0.05]" />
							<text x={R - 4} y={T + 12} font-size="10" text-anchor="end" class="fill-muted-foreground">does not fit</text>
						{/if}
						<g class="stroke-border" stroke-width="1">
							{#each ticks as v (v)}
								<line x1={L} y1={cy(v * GIB)} x2={R} y2={cy(v * GIB)} />
							{/each}
							{#each [1024, 4096, 16384, 32768, 131072] as t (t)}
								<line x1={cx(t)} y1={T} x2={cx(t)} y2={B} />
							{/each}
						</g>
						<g class="fill-muted-foreground" font-size="10">
							{#each ticks as v (v)}
								<text x={L - 5} y={cy(v * GIB) + 3} text-anchor="end">{v}</text>
							{/each}
							{#each [1024, 4096, 16384, 32768, 131072] as t (t)}
								<text x={cx(t)} y={B + 13} text-anchor={t === LAST ? 'end' : 'middle'}>{tokens(t)}</text>
							{/each}
							<text x={(L + R) / 2} y={H - 3} text-anchor="middle">tokens in the chat · GB up the side · past 32k the model needs YaRN</text>
						</g>
						<line x1={L} y1={cy(b.card)} x2={R} y2={cy(b.card)} class="stroke-foreground" stroke-width="1" stroke-dasharray="3 3" />
						<text x={L + 5} y={cy(b.card) - 5} font-size="10" class="fill-foreground">your card: {Math.round(b.card / GIB)} GB</text>
						<polyline points={poly(ls.full)} fill="none" class="stroke-foreground" stroke-width="2" />
						<polyline points={poly(ls.half)} fill="none" class="stroke-muted-foreground" stroke-width="2" stroke-dasharray="5 4" />
						<circle cx={cx(ring.current)} cy={cy(at(cacheBits === 16 ? ls.full : ls.half, ring.current))} r="5" fill="none" class="stroke-foreground" stroke-width="2" />
					</svg>
				{/if}
			</div>
		</div>
	</div>

	<div class="lg:grid lg:grid-cols-2">
		<div class="border-b px-4 py-3.5 lg:border-r lg:border-b-0">
			<h3 class="text-xs font-medium">Longest chat that fits, by bits per number</h3>
			{#if bitsRows}
				<div class="mt-3 space-y-2">
					{#each bitsRows as r (r.bits)}
						{@render meter(`${r.bits} bits`, share(r.maxTokens), r.maxTokens ? tokens(r.maxTokens) : 'no room', share(context), r.bits === bits)}
					{/each}
				</div>
				<div class="mt-2 text-xs text-muted-foreground">Solid: the longest chat that fits. Outline: your chat. Log scale, 1k to 128k.</div>
			{/if}
		</div>
		<div class="px-4 py-3.5">
			<h3 class="text-xs font-medium">The same card with each model, at {bits} bits</h3>
			{#if modelRows && per}
				<div class="mt-3 space-y-3">
					{#each MODELS as x, i (x.name)}
						<div>
							{@render meter(x.name.replace('Qwen3-', 'Qwen3 '), share(modelRows[i].maxTokens), modelRows[i].maxTokens ? tokens(modelRows[i].maxTokens) : 'no room', undefined, i === model)}
							<div class="mt-0.5 pl-[7.125rem] text-xs text-muted-foreground">
								{(x.params / 1e9).toFixed(1)}B numbers · {x.layers} layers · cache {kbOf(per[i])} per token
							</div>
						</div>
					{/each}
				</div>
				<div class="mt-2 text-xs text-muted-foreground">Bars: the longest chat that fits. The 4B and the 8B cost the same per token: same layers, same heads.</div>
			{/if}
		</div>
	</div>
</div>
