<script>
	import { WORDS, WANTED, SILLY, T_MAX } from '$lib/sampling-sim.js';

	// points: the odds of the wanted and the silliest word at each variety setting.
	// variety and odds: the current setting and the odds at it, for the rings.
	let { points, variety, odds } = $props();

	const x = (t) => 30 + (t / T_MAX) * 260;
	const y = (p) => 140 - p * 130;
	const line = (key) => (points ? points.map((p) => `${x(p.t)},${y(p[key])}`).join(' ') : '');
</script>

<div role="img" aria-label="As the variety goes up, the odds of Paris fall and the odds of banana rise.">
	<svg viewBox="0 0 300 175" class="w-full">
		<g class="stroke-border" stroke-width="1">
			{#each [0, 1, 2, 3] as t (t)}
				<line x1={x(t)} y1="10" x2={x(t)} y2="140" />
			{/each}
			<line x1="30" y1="140" x2="290" y2="140" />
			<line x1="30" y1="10" x2="290" y2="10" />
		</g>
		<g class="fill-muted-foreground" font-size="10">
			{#each [0, 1, 2, 3] as t (t)}
				<text x={x(t)} y="156" text-anchor="middle">{t}</text>
			{/each}
			<text x="26" y="14" text-anchor="end">100%</text>
			<text x="26" y="143" text-anchor="end">0%</text>
			<text x="160" y="171" text-anchor="middle">variety</text>
		</g>
		{#if points}
			<polyline points={line('wanted')} fill="none" class="stroke-foreground" stroke-width="2" />
			<polyline points={line('silly')} fill="none" class="stroke-muted-foreground" stroke-width="2" stroke-dasharray="5 4" />
			{#if odds}
				<circle cx={x(variety)} cy={y(odds[WANTED])} r="5" fill="none" class="stroke-foreground" stroke-width="2" />
				<circle cx={x(variety)} cy={y(odds[SILLY])} r="5" fill="none" class="stroke-foreground" stroke-width="2" />
			{/if}
		{/if}
	</svg>
</div>
<div class="text-xs text-muted-foreground">Solid: {WORDS[WANTED]}. Dashed: {WORDS[SILLY]}. The rings mark your setting.</div>
