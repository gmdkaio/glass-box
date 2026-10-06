<script>
	import { RATES, REFS, CAP, EPOCHS, TUNE, VOCAB, percent } from '$lib/lr-sim.js';
	import { eased } from '$lib/motion.svelte.js';
	import PlayButton from '$lib/components/PlayButton.svelte';

	// rate, schedule: your settings. runs: a fine-tune per rate in RATES at this schedule
	// (null while it trains). begin: the model before. shown: passes drawn on the
	// training chart. play: the Train sweep's button.
	let { rate, schedule, runs, begin, shown, play } = $props();

	const mine = $derived(runs[RATES.indexOf(rate)]);
	const clip = (v) => (Number.isFinite(v) ? Math.min(v, CAP) : CAP);

	// the probe word: the five words that matter most before or after
	const words = $derived.by(() => {
		if (!mine || !begin) return null;
		const pick = Array.from(VOCAB.keys())
			.sort((a, b) => Math.max(begin.odds[b], mine.odds[b]) - Math.max(begin.odds[a], mine.odds[a]))
			.slice(0, 5);
		return pick.map((i) => ({ word: VOCAB[i], before: begin.odds[i], after: Number.isFinite(mine.odds[i]) ? mine.odds[i] : 0 }));
	});

	// Charts are drawn at their real pixel width.
	let wide = $state(0);
	const H = 260,
		L = 34,
		T = 14,
		B = H - 30;
	const ex = (e) => L + (e / EPOCHS) * (wide - 10 - L);
	const ey = (v) => B - (clip(v) / CAP) * (B - T);
	const lines = $derived(
		[...REFS.filter((r) => r !== rate), rate]
			.map((r) => ({ r, run: runs[RATES.indexOf(r)] }))
			.filter((x) => x.run)
			.map((x) => ({ r: x.r, mine: x.r === rate, ys: [begin ? begin.loss : x.run.curve[0], ...Array.from(x.run.curve)] }))
	);
	const path = (ys) => ys.slice(0, shown + 1).map((v, e) => `${ex(e)},${ey(v)}`).join(' ');

	let uWidth = $state(0);
	const UH = 230,
		UB = UH - 30;
	const lo = Math.log10(RATES[0]),
		hi = Math.log10(RATES.at(-1));
	const ux = (r) => L + ((Math.log10(r) - lo) / (hi - lo)) * (uWidth - 10 - L);
	const uy = (v) => UB - (clip(v) / CAP) * (UB - T);
	const ends = eased(() => (runs.every(Boolean) ? { loss: runs.map((x) => clip(x.loss)), old: runs.map((x) => clip(x.old)) } : null));
	const ring = eased(() => Math.log10(rate));
	const uAt = (ys, k) => {
		const ks = RATES.map(Math.log10);
		const i = Math.max(0, Math.min(ks.length - 2, ks.findLastIndex((x) => x <= k)));
		return ys[i] + (ys[i + 1] - ys[i]) * ((k - ks[i]) / (ks[i + 1] - ks[i]));
	};
	const show = (v) => (Number.isFinite(v) && v <= CAP ? v.toFixed(2) : `>${CAP}`);
</script>

<div class="overflow-hidden rounded-lg border">
	<div class="lg:grid lg:grid-cols-[1fr_1.8fr]">
		<div class="border-b px-4 py-3.5 lg:border-r">
			<h3 class="text-xs font-medium">The next word after "{TUNE.probe}", after training</h3>
			<div class="mt-3 rounded-md border px-3 py-2 text-center text-sm">{TUNE.prompt} …</div>
			{#if words}
				<div class="mt-3 space-y-1.5">
					{#each words as w (w.word)}
						<div class="grid grid-cols-[5.5rem_1fr_3rem] items-center gap-2.5 text-sm">
							<div class="truncate">{w.word}</div>
							<div class="relative h-3.5 rounded-sm bg-muted/60">
								<div class="absolute inset-y-0 left-0 rounded-sm bg-foreground/80 transition-[width] duration-500 ease-out" style="width: {w.after * 100}%"></div>
								<div class="absolute inset-y-0 left-0 rounded-sm border border-muted-foreground" style="width: {w.before * 100}%"></div>
							</div>
							<div class="text-right text-xs text-muted-foreground tabular-nums">{percent(w.after)}</div>
						</div>
					{/each}
				</div>
				<div class="mt-2 text-xs text-muted-foreground">Outline: before. Solid: after {EPOCHS} passes at learning_rate {rate}, {schedule}.</div>
				<div class="mt-3 rounded-md bg-muted/60 px-3 py-2 text-sm">
					<b class="font-semibold">What it knew:</b> its loss on the Millbrook text went from {begin.old.toFixed(2)} to {show(mine.old)}.
				</div>
			{:else}
				<p class="mt-3 text-sm text-muted-foreground">Training…</p>
			{/if}
		</div>

		<div class="border-b px-4 py-3.5">
			<div class="flex items-start justify-between gap-3">
				<div>
					<h3 class="text-xs font-medium">Learning the new text</h3>
					<p class="mt-1 text-xs text-muted-foreground">Solid: your learning_rate. Dashed: other rates, same schedule. Lower is better.</p>
				</div>
				<PlayButton {play} />
			</div>
			<div class="mt-2" bind:clientWidth={wide}>
				{#if lines.length && wide > 0}
					<svg width={wide} height={H} viewBox="0 0 {wide} {H}" class="block" role="img" aria-label="Loss on the new text after each pass of training, for your learning rate and a few others.">
						<g class="stroke-border" stroke-width="1">
							{#each [0, 2, 4, 6, 8] as v (v)}
								<line x1={L} y1={ey(v)} x2={wide - 10} y2={ey(v)} />
							{/each}
						</g>
						<g class="fill-muted-foreground" font-size="10">
							{#each [0, 2, 4, 6, 8] as v (v)}
								<text x={L - 5} y={ey(v) + 3} text-anchor="end">{v}</text>
							{/each}
							{#each [0, 20, 40, 60] as e (e)}
								<text x={ex(e)} y={B + 13} text-anchor={e === EPOCHS ? 'end' : 'middle'}>{e}</text>
							{/each}
							<text x={L + 4} y={T - 4}>loss on the new text</text>
							<text x={(L + wide) / 2} y={H - 3} text-anchor="middle">passes over the new text</text>
						</g>
						{#each lines as l (l.r)}
							{@const end = l.ys[Math.min(shown, EPOCHS)]}
							<polyline
								points={path(l.ys)}
								fill="none"
								class={l.mine ? 'stroke-foreground' : 'stroke-muted-foreground'}
								stroke-width="2"
								stroke-dasharray={l.mine ? undefined : '5 4'}
							/>
							<text x={ex(Math.min(shown, EPOCHS)) - 4} y={ey(end) - 6} font-size="10" text-anchor="end" class={l.mine ? 'fill-foreground' : 'fill-muted-foreground'}>
								{l.r}{!Number.isFinite(end) || end > CAP ? ' ↑ off the chart' : ''}
							</text>
						{/each}
					</svg>
				{/if}
			</div>
		</div>
	</div>

	<div class="lg:grid lg:grid-cols-2">
		<div class="border-b px-4 py-3.5 lg:border-r lg:border-b-0">
			<h3 class="text-xs font-medium">Every learning rate, after {EPOCHS} passes</h3>
			<p class="mt-1 text-xs text-muted-foreground">Solid: loss on the new text. Outline: loss on the Millbrook text it knew. Shorter is better.</p>
			<div class="mt-3 space-y-1.5">
				{#each RATES as r, i (r)}
					{@const x = runs[i]}
					<div class="grid grid-cols-[5.5rem_1fr_3rem] items-center gap-2.5 text-sm">
						<div class={r === rate ? 'font-semibold' : 'text-muted-foreground'}>{r}</div>
						<div class="relative h-3 rounded-sm bg-muted/60">
							{#if x}
								<div class="absolute inset-y-0 left-0 rounded-sm bg-foreground/80 transition-[width] duration-500 ease-out" style="width: {(clip(x.loss) / CAP) * 100}%"></div>
								<div class="absolute inset-y-0 left-0 rounded-sm border border-muted-foreground transition-[width] duration-500 ease-out" style="width: {(clip(x.old) / CAP) * 100}%"></div>
							{/if}
						</div>
						<div class="text-right text-xs text-muted-foreground tabular-nums">{x ? show(x.loss) : '…'}</div>
					</div>
				{/each}
			</div>
		</div>

		<div class="px-4 py-3.5">
			<h3 class="text-xs font-medium">Too small, about right, too big</h3>
			<p class="mt-1 text-xs text-muted-foreground">Solid: the new text. Dashed: the Millbrook text it knew. Rings: your rate.</p>
			<div class="mt-2" bind:clientWidth={uWidth}>
				{#if ends.current && uWidth > 0}
					{@const c = ends.current}
					<svg width={uWidth} height={UH} viewBox="0 0 {uWidth} {UH}" class="block" role="img" aria-label="Loss after training against the learning rate: high for tiny and huge rates, lowest in between.">
						<g class="stroke-border" stroke-width="1">
							{#each [0, 2, 4, 6, 8] as v (v)}
								<line x1={L} y1={uy(v)} x2={uWidth - 10} y2={uy(v)} />
							{/each}
						</g>
						<g class="fill-muted-foreground" font-size="10">
							{#each [0, 2, 4, 6, 8] as v (v)}
								<text x={L - 5} y={uy(v) + 3} text-anchor="end">{v}</text>
							{/each}
							{#each [0.001, 0.01, 0.1, 1] as r (r)}
								<text x={ux(r)} y={UB + 13} text-anchor="middle">{r}</text>
							{/each}
							<text x={L + 4} y={T - 4}>loss after {EPOCHS} passes</text>
							<text x={(L + uWidth) / 2} y={UH - 3} text-anchor="middle">learning_rate, on a log scale</text>
						</g>
						<polyline points={c.loss.map((v, i) => `${ux(RATES[i])},${uy(v)}`).join(' ')} fill="none" class="stroke-foreground" stroke-width="2" />
						<polyline points={c.old.map((v, i) => `${ux(RATES[i])},${uy(v)}`).join(' ')} fill="none" class="stroke-muted-foreground" stroke-width="2" stroke-dasharray="5 4" />
						<circle cx={L + ((ring.current - lo) / (hi - lo)) * (uWidth - 10 - L)} cy={uy(uAt(c.loss, ring.current))} r="5" class="fill-background stroke-foreground" stroke-width="2" />
						<circle cx={L + ((ring.current - lo) / (hi - lo)) * (uWidth - 10 - L)} cy={uy(uAt(c.old, ring.current))} r="5" class="fill-background stroke-muted-foreground" stroke-width="2" />
					</svg>
				{:else}
					<p class="text-sm text-muted-foreground">Training every rate…</p>
				{/if}
			</div>
		</div>
	</div>
</div>
