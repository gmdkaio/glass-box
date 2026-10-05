<script>
	import { QUESTIONS, HARD, SURE, HARD_STEPS, SURE_STEPS, phrase, percent } from '$lib/calibration-sim.js';
	import { eased } from '$lib/motion.svelte.js';
	import PlayButton from '$lib/components/PlayButton.svelte';

	// answers: one typical answer each from an easy, a middling and a hard quiz.
	// q: the quiz set by the sliders. hard, shift: the two settings, for the rings.
	// hardCurve, boldCurve: says and right along each setting. pace: easing time.
	// play: the sweep's button, shown in the boldness chart's header.
	let { answers, q, hard, shift, hardCurve, boldCurve, play, pace = 450 } = $props();

	// the bands from 50% up, where a confident answer sits
	const bands = $derived(
		q ? [5, 6, 7, 8, 9].map((b) => ({ label: `${b * 10}–${b * 10 + 10}%`, n: q.bins.count[b], said: q.bins.stated[b], right: q.bins.right[b] })) : []
	);

	// the two small charts ease between settings, rings included
	const curves = eased(
		() =>
			hardCurve && boldCurve
				? { hs: hardCurve.map((p) => p.says), hr: hardCurve.map((p) => p.right), bs: boldCurve.map((p) => p.says), br: boldCurve.map((p) => p.right) }
				: null,
		() => pace
	);
	const rings = eased(() => ({ hard, shift }), () => pace);

	const W = 300,
		L = 30,
		R = 290,
		T = 8,
		B = 84;
	const cy = (p) => B - p * (B - T);
	const along = (steps, lo, hi) => (i) => L + ((steps[i] - lo) / (hi - lo)) * (R - L);
	const hx = along(HARD_STEPS, HARD.min, HARD.max);
	const sx = along(SURE_STEPS, SURE.min, SURE.max);
	const poly = (xf, ys) => ys.map((v, i) => `${xf(i)},${cy(v)}`).join(' ');
	// a curve read at a setting between its points
	function at(steps, ys, v) {
		const k = ((v - steps[0]) / (steps.at(-1) - steps[0])) * (steps.length - 1);
		const lo = Math.max(0, Math.min(steps.length - 2, Math.floor(k)));
		return ys[lo] + (ys[lo + 1] - ys[lo]) * (k - lo);
	}
	const toX = (v, lo, hi) => L + ((v - lo) / (hi - lo)) * (R - L);
</script>

{#snippet meter(label, value, outline, strong)}
	<div class="grid grid-cols-[5.5rem_1fr_3rem] items-center gap-2.5 text-sm">
		<div class={strong ? 'font-semibold' : 'text-muted-foreground'}>{label}</div>
		<div class="relative h-4 rounded-sm bg-muted/60">
			<div class="absolute inset-y-0 left-0 rounded-sm bg-foreground/80 transition-[width] duration-500 ease-out" style="width: {value * 100}%"></div>
			{#if outline !== undefined}
				<div class="absolute inset-y-0 left-0 rounded-sm border border-muted-foreground transition-[width] duration-500 ease-out" style="width: {outline * 100}%"></div>
			{/if}
		</div>
		<div class="text-xs text-muted-foreground tabular-nums">{percent(value)}</div>
	</div>
{/snippet}

{#snippet chart(title, xf, says, right, ringX, ringSays, ringRight, ticks, xlabel, aria, button)}
	<div class="flex items-start justify-between gap-2">
		<h3 class="text-xs font-medium">{title}</h3>
		<PlayButton play={button} />
	</div>
	<div role="img" aria-label={aria}>
		<svg viewBox="0 0 {W} 116" class="mt-1.5 w-full">
			<g class="stroke-border" stroke-width="1">
				<line x1={L} y1={B} x2={R} y2={B} />
				<line x1={L} y1={T} x2={R} y2={T} />
				{#each ticks as t (t.x)}
					<line x1={t.x} y1={T} x2={t.x} y2={B} />
				{/each}
			</g>
			<g class="fill-muted-foreground" font-size="10">
				<text x={L - 4} y={T + 4} text-anchor="end">100%</text>
				<text x={L - 4} y={B + 3} text-anchor="end">0%</text>
				{#each ticks as t (t.x)}
					<text x={t.x} y={B + 14} text-anchor={t.anchor ?? 'middle'}>{t.label}</text>
				{/each}
				<text x={(L + R) / 2} y={B + 28} text-anchor="middle">{xlabel}</text>
			</g>
			<polyline points={poly(xf, says)} fill="none" class="stroke-foreground" stroke-width="2" />
			<polyline points={poly(xf, right)} fill="none" class="stroke-muted-foreground" stroke-width="2" stroke-dasharray="5 4" />
			<circle cx={ringX} cy={cy(ringSays)} r="5" fill="none" class="stroke-foreground" stroke-width="2" />
			<circle cx={ringX} cy={cy(ringRight)} r="5" fill="none" class="stroke-foreground" stroke-width="2" />
		</svg>
	</div>
{/snippet}

<div class="overflow-hidden rounded-lg border lg:grid lg:min-h-80 lg:grid-cols-[1.3fr_1fr_1fr]">
	<div class="border-b px-4 py-3.5 lg:border-r lg:border-b-0">
		<h3 class="text-xs font-medium">Easy, middling and hard, at your settings</h3>
		{#if answers}
			<div class="mt-3 space-y-2.5">
				{#each answers as a (a.label)}
					<div class="rounded-md border px-3 py-2 text-sm">
						<div class="text-xs text-muted-foreground">{a.label}</div>
						<div class="mt-1">{a.q}</div>
						<div class="mt-1.5 flex items-baseline justify-between gap-3">
							<span class="text-muted-foreground">"{a.said}. {phrase(a.conf)}" <span class="text-xs tabular-nums">({percent(a.conf)})</span></span>
							<b class="font-semibold whitespace-nowrap {a.right ? '' : 'text-muted-foreground'}">{a.right ? '✓ right' : `✗ it was ${a.truth}`}</b>
						</div>
					</div>
				{/each}
			</div>
			<div class="mt-2 text-xs text-muted-foreground">Typical answers. The wording follows the confidence it states, and on harder questions that confidence drops more slowly than its record.</div>
		{/if}
	</div>

	<div class="border-b px-4 py-3.5 lg:border-r lg:border-b-0">
		<h3 class="text-xs font-medium">{QUESTIONS.toLocaleString('en')} answers, by how sure it said it was</h3>
		<div class="mt-3.5 space-y-2.5">
			{#each bands as b (b.label)}
				{@render meter(b.label, b.n ? b.right : 0, b.n ? b.said : undefined, false)}
			{/each}
		</div>
		<div class="mt-2 text-xs text-muted-foreground">Outline: what it said. Solid: how often it was right. An honest model fills its outlines.</div>

		<h3 class="mt-4 border-t pt-3.5 text-xs font-medium">All of them together</h3>
		{#if q}
			<div class="mt-3 space-y-2.5">
				{@render meter('It says', q.says, undefined, false)}
				{@render meter("It's right", q.right, q.says, true)}
			</div>
			<p class="mt-2.5 text-sm">
				{#if q.says - q.right > 0.01}<b class="font-semibold">{Math.round((q.says - q.right) * 100)} points</b> more than it delivers.{:else}What it says
					matches its record.{/if}
			</p>
		{/if}
	</div>

	<div class="px-4 py-3.5">
		{#if curves.current}
			{@const c = curves.current}
			{@render chart(
				'Harder questions, wider gap',
				hx,
				c.hs,
				c.hr,
				toX(rings.current.hard, HARD.min, HARD.max),
				at(HARD_STEPS, c.hs, rings.current.hard),
				at(HARD_STEPS, c.hr, rings.current.hard),
				[
					{ x: L, label: 'very hard', anchor: 'start' },
					{ x: (L + R) / 2, label: 'mixed' },
					{ x: R, label: 'easy', anchor: 'end' }
				],
				'how hard the questions are',
				'How sure it sounds stays high while how often it is right falls on harder questions.'
			)}
			<div class="mt-3">
				{@render chart(
					'Bolder, further off',
					sx,
					c.bs,
					c.br,
					toX(rings.current.shift, SURE.min, SURE.max),
					at(SURE_STEPS, c.bs, rings.current.shift),
					at(SURE_STEPS, c.br, rings.current.shift),
					[0, 1, 2, 3].map((t) => ({ x: toX(t, SURE.min, SURE.max), label: t === 0 ? 'honest' : `+${t}`, anchor: t === 0 ? 'start' : t === 3 ? 'end' : 'middle' })),
					'how much surer than its record it sounds',
					'As the model gets bolder, how sure it sounds rises while how often it is right stays the same.',
					play
				)}
			</div>
			<div class="mt-1 text-xs text-muted-foreground">Solid: how sure it sounds. Dashed: how often it is right. The rings mark your settings.</div>
		{/if}
	</div>
</div>
