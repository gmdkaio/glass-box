<script>
	import { WORDS, WANTED, SILLY, T_MAX } from '$lib/sampling-sim.js';
	import { eased } from '$lib/motion.svelte.js';
	import { t } from '$lib/i18n.svelte.js';

	// points: the odds of the wanted and the silliest word at each variety setting.
	// variety and odds: the current setting and the odds at it, for the rings.
	let { points, variety, odds } = $props();

	// the rings slide along the curves instead of jumping
	const ring = eased(() => (odds ? { t: variety, wanted: odds[WANTED], silly: odds[SILLY] } : null), 300);
	const r = $derived(ring.current);

	const x = (t) => 30 + (t / T_MAX) * 260;
	const y = (p) => 140 - p * 130;
	const line = (key) => (points ? points.map((p) => `${x(p.t)},${y(p[key])}`).join(' ') : '');
</script>

<div role="img" aria-label={t('As the variety goes up, the odds of Paris fall and the odds of banana rise.', 'Conforme a variedade sobe, as chances de Paris caem e as de banana sobem.')}>
	<svg viewBox="0 0 300 175" class="w-full">
		<g class="stroke-border" stroke-width="1">
			{#each [0, 1, 2, 3] as v (v)}
				<line x1={x(v)} y1="10" x2={x(v)} y2="140" />
			{/each}
			<line x1="30" y1="140" x2="290" y2="140" />
			<line x1="30" y1="10" x2="290" y2="10" />
		</g>
		<g class="fill-muted-foreground" font-size="10">
			{#each [0, 1, 2, 3] as v (v)}
				<text x={x(v)} y="156" text-anchor="middle">{v}</text>
			{/each}
			<text x="26" y="14" text-anchor="end">100%</text>
			<text x="26" y="143" text-anchor="end">0%</text>
			<text x="160" y="171" text-anchor="middle">{t('variety', 'variedade')}</text>
		</g>
		{#if points}
			<polyline points={line('wanted')} fill="none" class="stroke-foreground" stroke-width="2" />
			<polyline points={line('silly')} fill="none" class="stroke-muted-foreground" stroke-width="2" stroke-dasharray="5 4" />
			{#if r}
				<circle cx={x(r.t)} cy={y(r.wanted)} r="5" fill="none" class="stroke-foreground" stroke-width="2" />
				<circle cx={x(r.t)} cy={y(r.silly)} r="5" fill="none" class="stroke-foreground" stroke-width="2" />
			{/if}
		{/if}
	</svg>
</div>
<div class="text-xs text-muted-foreground">
	{t(
		`Solid: ${WORDS[WANTED]}. Dashed: ${WORDS[SILLY]}. The rings mark your setting.`,
		`Sólido: ${WORDS[WANTED]}. Tracejado: ${WORDS[SILLY]}. Os anéis marcam o seu ajuste.`
	)}
</div>
