<script>
	import { SIZES, EPOCHS, NEVER_SEEN, TRAINED, NEVER_WORDS, TRAINED_WORDS, sentences } from '$lib/overfit-sim.js';
	import { eased } from '$lib/motion.svelte.js';
	import PlayButton from '$lib/components/PlayButton.svelte';

	// size, pass: your settings. runs: a watched fine-tune per size (null while it
	// trains). best: the pass with the lowest held-out loss, per size. play: the sweep's button.
	let { size, pass, runs, best, play } = $props();

	const run = $derived(runs[size]);
	const at = $derived(best[size]);
	const CAP = 8; // surprise and loss past this run off the bars and the chart
	const w = (v) => (Math.min(v, CAP) / CAP) * 100;

	const now = eased(() => (run ? sentences(run.words[pass]) : null), 300);
	const then = $derived(run ? sentences(run.words[at]) : null);

	// the losses over passes, on a log scale so the early passes have room
	let wide = $state(0);
	const H = 250,
		L = 34,
		T = 16,
		B = H - 30;
	const top = Math.log10(EPOCHS + 1);
	const cx = (p) => L + (Math.log10(p + 1) / top) * (wide - 10 - L);
	const cy = (v) => B - (Math.min(v, CAP) / CAP) * (B - T);
	const ring = eased(() => pass, 300);
	const lineOf = (ys) => ys.map((v, p) => `${cx(p)},${cy(v)}`).join(' ');
	const yAt = (ys, p) => {
		const i = Math.max(0, Math.min(ys.length - 2, Math.floor(p)));
		return ys[i] + (ys[i + 1] - ys[i]) * (p - i);
	};
	const LINES = [
		{ key: 'train', label: 'training text', cls: 'stroke-foreground', dash: undefined },
		{ key: 'held', label: 'held-out sentences', cls: 'stroke-foreground/60', dash: '6 4' },
		{ key: 'old', label: 'Millbrook text it knew', cls: 'stroke-muted-foreground', dash: '2 3' }
	];
</script>

{#snippet words(list, nowV, thenV, caption)}
	<div class="mt-3 space-y-1">
		{#each list as word, i (i)}
			<div class="grid grid-cols-[5.5rem_1fr_2.5rem] items-center gap-2.5 text-sm">
				<div class="truncate">{word}</div>
				<div class="relative h-3 rounded-sm bg-muted/60">
					<div class="absolute inset-y-0 left-0 rounded-sm bg-foreground/80" style="width: {w(nowV[i])}%"></div>
					<div class="absolute inset-y-0 left-0 rounded-sm border border-muted-foreground" style="width: {w(thenV[i])}%"></div>
				</div>
				<div class="text-right text-xs text-muted-foreground tabular-nums">{nowV[i].toFixed(1)}</div>
			</div>
		{/each}
	</div>
	<div class="mt-2 text-xs text-muted-foreground">{caption}</div>
{/snippet}

<div class="overflow-hidden rounded-lg border">
	<div class="lg:grid lg:grid-cols-[1fr_1.8fr]">
		<div class="border-b px-4 py-3.5 lg:border-r">
			<h3 class="text-xs font-medium">A sentence it never trained on</h3>
			<div class="mt-3 rounded-md border px-3 py-2 text-center text-sm">{NEVER_SEEN}</div>
			{#if now.current && then}
				{@render words(NEVER_WORDS, now.current.never, then.never, `How surprised the model is by each word, after the word before. Solid: at pass ${pass}. Outline: at pass ${at}, its best. Longer is worse.`)}
			{:else}
				<p class="mt-3 text-sm text-muted-foreground">Training…</p>
			{/if}
		</div>

		<div class="border-b px-4 py-3.5">
			<div class="flex items-start justify-between gap-3">
				<div>
					<h3 class="text-xs font-medium">Three losses, pass by pass</h3>
					<p class="mt-1 text-xs text-muted-foreground">
						Solid: the training text. Dashed: the held-out sentences. Dotted: the Millbrook text it knew. Rings: your num_train_epochs.
					</p>
				</div>
				<PlayButton {play} />
			</div>
			<div class="mt-2" bind:clientWidth={wide}>
				{#if run && wide > 0}
					<svg width={wide} height={H} viewBox="0 0 {wide} {H}" class="block" role="img" aria-label="Loss on the training text keeps falling, while loss on held-out sentences falls and then rises.">
						<g class="stroke-border" stroke-width="1">
							{#each [0, 2, 4, 6, 8] as v (v)}
								<line x1={L} y1={cy(v)} x2={wide - 10} y2={cy(v)} />
							{/each}
						</g>
						<g class="fill-muted-foreground" font-size="10">
							{#each [0, 2, 4, 6, 8] as v (v)}
								<text x={L - 5} y={cy(v) + 3} text-anchor="end">{v}</text>
							{/each}
							{#each [0, 1, 5, 20, 50, 200] as p (p)}
								<text x={cx(p)} y={B + 13} text-anchor={p === EPOCHS ? 'end' : 'middle'}>{p}</text>
							{/each}
							<text x={L + 4} y={T - 5}>loss</text>
							<text x={(L + wide) / 2} y={H - 3} text-anchor="middle">passes over the training text, on a log scale</text>
						</g>
						<line x1={cx(at)} y1={T} x2={cx(at)} y2={B} class="stroke-foreground/40" stroke-width="2" />
						<text x={cx(at) + 5} y={T + 10} font-size="10" class="fill-foreground">best for held-out: pass {at}</text>
						{#each LINES as l (l.key)}
							<polyline points={lineOf(run[l.key])} fill="none" class={l.cls} stroke-width="2" stroke-dasharray={l.dash} />
							<circle cx={cx(ring.current)} cy={cy(yAt(run[l.key], ring.current))} r="5" class="fill-background {l.cls}" stroke-width="2" />
						{/each}
					</svg>
				{/if}
			</div>
		</div>
	</div>

	<div class="lg:grid lg:grid-cols-2">
		<div class="border-b px-4 py-3.5 lg:border-r lg:border-b-0">
			<h3 class="text-xs font-medium">Held-out loss, by how much it trains on</h3>
			<p class="mt-1 text-xs text-muted-foreground">Solid: at pass {pass}. Outline: at each run's best pass. Shorter is better.</p>
			<div class="mt-3 space-y-1.5">
				{#each SIZES as s, i (s.label)}
					{@const r = runs[i]}
					<div class="grid grid-cols-[7rem_1fr_3rem] items-center gap-2.5 text-sm">
						<div class={i === size ? 'font-semibold' : 'text-muted-foreground'}>{s.label}</div>
						<div class="relative h-3.5 rounded-sm bg-muted/60">
							{#if r}
								<div class="absolute inset-y-0 left-0 rounded-sm bg-foreground/80 transition-[width] duration-300 ease-out" style="width: {w(r.held[pass])}%"></div>
								<div class="absolute inset-y-0 left-0 rounded-sm border border-muted-foreground" style="width: {w(r.held[best[i]])}%"></div>
							{/if}
						</div>
						<div class="text-right text-xs text-muted-foreground tabular-nums">{r ? r.held[pass].toFixed(2) : '…'}</div>
					</div>
				{/each}
			</div>
			<h3 class="mt-5 text-xs font-medium">What it knew: loss on the Millbrook text</h3>
			<p class="mt-1 text-xs text-muted-foreground">Solid: at pass {pass}. Outline: before fine-tuning. Mixing old text in keeps more of it.</p>
			<div class="mt-3 space-y-1.5">
				{#each SIZES as s, i (s.label)}
					{@const r = runs[i]}
					<div class="grid grid-cols-[7rem_1fr_3rem] items-center gap-2.5 text-sm">
						<div class={i === size ? 'font-semibold' : 'text-muted-foreground'}>{s.label}</div>
						<div class="relative h-3.5 rounded-sm bg-muted/60">
							{#if r}
								<div class="absolute inset-y-0 left-0 rounded-sm bg-foreground/80 transition-[width] duration-300 ease-out" style="width: {w(r.old[pass])}%"></div>
								<div class="absolute inset-y-0 left-0 rounded-sm border border-muted-foreground" style="width: {w(r.old[0])}%"></div>
							{/if}
						</div>
						<div class="text-right text-xs text-muted-foreground tabular-nums">{r ? r.old[pass].toFixed(2) : '…'}</div>
					</div>
				{/each}
			</div>
		</div>

		<div class="px-4 py-3.5">
			<h3 class="text-xs font-medium">A sentence it trained on</h3>
			<div class="mt-3 rounded-md border px-3 py-2 text-center text-sm">{TRAINED}</div>
			{#if now.current && then}
				{@render words(TRAINED_WORDS, now.current.trained, then.trained, 'Solid: now. Outline: at the best pass. It keeps getting surer of the words it has seen.')}
			{/if}
		</div>
	</div>
</div>
