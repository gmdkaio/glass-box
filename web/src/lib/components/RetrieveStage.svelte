<script>
	import { PAGES, QUESTIONS, MAX_K, percent } from '$lib/retrieval-sim.js';
	import { eased } from '$lib/motion.svelte.js';

	// question: the question being asked, and its text as asked. results: every
	// page's score, rank and share. said: the most likely answer. rows: each
	// question's outcome at your settings. same, other: the curves over pages
	// handed, for both ways of asking. k: pages handed over. pace: easing time.
	let { question, asked, results, said, rows, same, other, k, pace = 450 } = $props();

	const SHOWN = 6;
	const top = $derived(results ? results.slice(0, SHOWN) : []);
	const most = $derived(results ? Math.max(results[0]?.score ?? 0, 1e-9) : 1);
	const right = $derived(results ? results.find((r) => r.page === question.page) : null);
	const totals = $derived(
		rows ? { handed: rows.filter((r) => r.handed).length / rows.length, right: rows.reduce((s, r) => s + r.right, 0) / rows.length } : null
	);

	// the two small charts over the number of pages handed over
	const curves = eased(
		() => (same && other ? { sh: same.map((p) => p.handed), sr: same.map((p) => p.right), oh: other.map((p) => p.handed), or: other.map((p) => p.right) } : null),
		() => pace
	);
	const ring = eased(() => k, () => pace);
	const L = 30,
		R = 290,
		T = 8,
		B = 84;
	const cx = (kk) => L + ((kk - 1) / (MAX_K - 1)) * (R - L);
	const cy = (p) => B - p * (B - T);
	const poly = (ys) => ys.map((v, i) => `${cx(i + 1)},${cy(v)}`).join(' ');
	function at(ys, kk) {
		const lo = Math.max(0, Math.min(ys.length - 2, Math.floor(kk - 1)));
		return ys[lo] + (ys[lo + 1] - ys[lo]) * (kk - 1 - lo);
	}
</script>

{#snippet meter(label, value, outline, strong)}
	<div class="grid grid-cols-[7.5rem_1fr_3rem] items-center gap-2.5 text-sm">
		<div class="truncate {strong ? 'font-semibold' : 'text-muted-foreground'}">{label}</div>
		<div class="relative h-4 rounded-sm bg-muted/60">
			<div class="absolute inset-y-0 left-0 rounded-sm bg-foreground/80 transition-[width] duration-500 ease-out" style="width: {value * 100}%"></div>
			{#if outline !== undefined}
				<div class="absolute inset-y-0 left-0 rounded-sm border border-muted-foreground transition-[width] duration-500 ease-out" style="width: {outline * 100}%"></div>
			{/if}
		</div>
		<div class="text-xs text-muted-foreground tabular-nums">{percent(value)}</div>
	</div>
{/snippet}

{#snippet chart(title, h, r)}
	<h3 class="text-xs font-medium">{title}</h3>
	<svg viewBox="0 0 300 108" class="mt-1.5 w-full" role="img" aria-label="{title}: chance the right page is handed over and chance of a right answer, by pages handed over.">
		<g class="stroke-border" stroke-width="1">
			<line x1={L} y1={B} x2={R} y2={B} />
			<line x1={L} y1={T} x2={R} y2={T} />
			{#each [1, 4, 8] as t (t)}
				<line x1={cx(t)} y1={T} x2={cx(t)} y2={B} />
			{/each}
		</g>
		<g class="fill-muted-foreground" font-size="10">
			<text x={L - 4} y={T + 4} text-anchor="end">100%</text>
			<text x={L - 4} y={B + 3} text-anchor="end">0%</text>
			{#each [1, 4, 8] as t (t)}
				<text x={cx(t)} y={B + 14} text-anchor="middle">{t}</text>
			{/each}
		</g>
		<polyline points={poly(h)} fill="none" class="stroke-foreground" stroke-width="2" />
		<polyline points={poly(r)} fill="none" class="stroke-muted-foreground" stroke-width="2" stroke-dasharray="5 4" />
		<circle cx={cx(ring.current)} cy={cy(at(h, ring.current))} r="5" fill="none" class="stroke-foreground" stroke-width="2" />
		<circle cx={cx(ring.current)} cy={cy(at(r, ring.current))} r="5" fill="none" class="stroke-foreground" stroke-width="2" />
	</svg>
{/snippet}

<div class="overflow-hidden rounded-lg border lg:grid lg:min-h-80 lg:grid-cols-[1.3fr_1fr_1fr]">
	<div class="border-b px-4 py-3.5 lg:border-r lg:border-b-0">
		<h3 class="text-xs font-medium">What the search hands to the model</h3>
		<div class="mt-3 rounded-md border px-3 py-2 text-center text-sm">{asked}</div>
		{#if results}
			<div class="mt-3 space-y-1.5">
				{#each top as r (r.page)}
					<div class="grid grid-cols-[1.25rem_9.5rem_1fr_2.5rem] items-center gap-2 text-sm {r.handed ? '' : 'opacity-45'}">
						<span class="text-xs text-muted-foreground tabular-nums">{r.rank + 1}</span>
						<span class="truncate {r.page === question.page ? 'font-semibold' : ''}"
							>{PAGES[r.page].title}{r.page === question.page ? ' ✓' : ''}{PAGES[r.page].old ? ' (old)' : ''}</span
						>
						<div class="h-3 rounded-sm bg-muted/60">
							<div class="h-full rounded-sm bg-foreground/80 transition-[width] duration-500 ease-out" style="width: {(r.score / most) * 100}%"></div>
						</div>
						<span class="text-right text-xs text-muted-foreground tabular-nums">{r.score.toFixed(1)}</span>
					</div>
				{/each}
			</div>
			<div class="mt-1.5 text-xs text-muted-foreground">Bars: search score. Faded: left out. The top {k} {k === 1 ? 'page goes' : 'pages go'} to the model.</div>

			<div class="mt-3.5 rounded-md bg-muted/60 px-3 py-2 text-sm">
				{#if said.text}
					"{said.text}" <span class="text-xs text-muted-foreground">from {PAGES[said.page].title}</span>
				{:else if said.page !== null}
					A guess. <span class="text-xs text-muted-foreground">{PAGES[said.page].title} does not answer it.</span>
				{:else}
					No page matched, so it answers without one.
				{/if}
			</div>
			<div class="mt-1.5 flex items-baseline justify-between gap-2 text-sm">
				<b class="font-semibold {said.right ? '' : 'text-muted-foreground'}">{said.right ? '✓ right' : `✗ the answer is ${question.answers[question.page]}`}</b>
				<span class="text-xs text-muted-foreground">chance of a right answer: {percent(right ? right.share : 0)}</span>
			</div>
		{/if}
	</div>

	<div class="border-b px-4 py-3.5 lg:border-r lg:border-b-0">
		<h3 class="text-xs font-medium">All five questions, asked this way</h3>
		{#if rows}
			<div class="mt-3.5 space-y-2.5">
				{#each rows as r, i (i)}
					{@render meter(QUESTIONS[i].short, r.right, r.handed ? 1 : undefined, QUESTIONS[i] === question)}
				{/each}
			</div>
			<div class="mt-2 text-xs text-muted-foreground">Outline: its page was handed over. Solid: chance of a right answer.</div>

			<h3 class="mt-4 border-t pt-3.5 text-xs font-medium">On average</h3>
			<div class="mt-3 space-y-2.5">
				{@render meter('Page handed over', totals.handed, undefined, false)}
				{@render meter('Answer right', totals.right, totals.handed, true)}
			</div>
			<p class="mt-2.5 text-sm">
				{#if totals.handed - totals.right > 0.05}The search finds more than the model uses: <b class="font-semibold"
						>{Math.round((totals.handed - totals.right) * 100)} points</b
					> lost to other pages.{:else}When the page is found, the model uses it.{/if}
			</p>
		{/if}
	</div>

	<div class="px-4 py-3.5">
		{#if curves.current}
			{@const c = curves.current}
			{@render chart("Asked with the page's words", c.sh, c.sr)}
			<div class="mt-3">{@render chart('Asked with other words', c.oh, c.or)}</div>
			<div class="text-center text-xs text-muted-foreground">pages handed to the model</div>
			<div class="mt-1 text-xs text-muted-foreground">Solid: right page handed over. Dashed: right answer. The rings mark your setting.</div>
		{/if}
	</div>
</div>
