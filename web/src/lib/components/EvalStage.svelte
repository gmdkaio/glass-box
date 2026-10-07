<script>
	import { QUESTIONS, PUBLIC, MODELS, PASSES, leakedSet } from '$lib/eval-sim.js';
	import { eased } from '$lib/motion.svelte.js';
	import PlayButton from '$lib/components/PlayButton.svelte';
	import { t, local } from '$lib/i18n.svelte.js';

	// leak: public questions in the training text. byLeak: the exam at every leak
	// level, 0..12 (null while it trains). models: the five models' exams. play: the sweep.
	let { leak, byLeak, models, play } = $props();

	const exam = $derived(byLeak[leak]);
	const leaked = $derived(leakedSet(leak));
	const pct = (right, of) => Math.round((right / of) * 100);
	const score = eased(() => (exam ? { pub: pct(exam.publicRight, PUBLIC), fresh: pct(exam.freshRight, QUESTIONS.length - PUBLIC) } : null), 400);

	// the model matching your setting, if one does
	const mine = $derived(MODELS.findIndex((m) => !m.extra && m.passes === PASSES && m.leak === leak));

	// ranked twice: public score on the left, fresh score on the right
	let slopeWidth = $state(0);
	const SH = 230,
		ST = 26,
		SB = SH - 12;
	const sy = (v) => SB - (v / 100) * (SB - ST);
	// spread labels that would sit on top of each other
	function spread(values) {
		const order = values.map((v, i) => [sy(v), i]).sort((a, b) => a[0] - b[0]);
		const out = new Array(values.length);
		let last = -Infinity;
		for (const [y, i] of order) {
			const placed = Math.max(y, last + 13);
			out[i] = placed;
			last = placed;
		}
		return out;
	}

	// scores against how many questions leaked
	let chartWidth = $state(0);
	const H = 230,
		L = 38,
		T = 12,
		B = H - 30;
	const cx = (k) => L + (k / PUBLIC) * (chartWidth - 10 - L);
	const cy = (v) => B - (v / 100) * (B - T);
	const lines = eased(() => (byLeak.every(Boolean) ? { pub: byLeak.map((e) => pct(e.publicRight, PUBLIC)), fresh: byLeak.map((e) => pct(e.freshRight, QUESTIONS.length - PUBLIC)) } : null));
	const ring = eased(() => leak, 300);
	const at = (ys, k) => {
		const i = Math.max(0, Math.min(ys.length - 2, Math.floor(k)));
		return ys[i] + (ys[i + 1] - ys[i]) * (k - i);
	};
</script>

{#snippet wall(from, to, showLeaks)}
	<div class="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
		{#each QUESTIONS.slice(from, to) as q, j (q.prompt)}
			{@const i = from + j}
			{@const ok = exam?.right[i]}
			<div
				class="relative rounded-md border px-2 py-1.5 text-xs transition-colors duration-300 {ok
					? 'border-foreground/70 bg-foreground text-background'
					: 'text-muted-foreground'}"
			>
				{#if showLeaks && leaked.has(i)}
					<span class="absolute top-1 right-1.5 text-[10px] opacity-70">{t('leaked', 'vazada')}</span>
				{/if}
				<div class="pr-9 leading-snug">{q.prompt} …</div>
				<div class="truncate text-sm font-medium {ok ? '' : 'text-foreground'}">{q.answer}</div>
				{#if exam && !ok}
					<div class="truncate text-[10px]">{t('it said:', 'ele disse:')} {exam.guess[i] === '.' ? t('a full stop', 'um ponto final') : exam.guess[i]}</div>
				{:else}
					<div class="text-[10px] opacity-70">{t('right', 'certa')}</div>
				{/if}
			</div>
		{/each}
	</div>
{/snippet}

<div class="overflow-hidden rounded-lg border">
	<div class="lg:grid lg:grid-cols-2">
		<div class="border-b px-4 py-3.5 lg:border-r">
			<div class="flex items-baseline justify-between gap-3">
				<h3 class="text-xs font-medium">{t('Public benchmark', 'Benchmark público')}</h3>
				<span class="text-xs text-muted-foreground">{t('published, so it can leak', 'publicado, então pode vazar')}</span>
			</div>
			<div class="mt-1 text-3xl font-semibold tracking-tight tabular-nums">{score.current ? Math.round(score.current.pub) : '–'}%</div>
			<p class="text-xs text-muted-foreground">
				{t(
					`Filled: the model's top guess is the right word. "leaked": the question was in its training text.`,
					'Preenchido: o primeiro palpite do modelo é a palavra certa. "vazada": a pergunta estava no texto de treino dele.'
				)}
			</p>
			{@render wall(0, PUBLIC, true)}
		</div>
		<div class="border-b px-4 py-3.5">
			<div class="flex items-baseline justify-between gap-3">
				<h3 class="text-xs font-medium">{t('Fresh questions', 'Perguntas novas')}</h3>
				<span class="text-xs text-muted-foreground">{t('written after training', 'escritas depois do treino')}</span>
			</div>
			<div class="mt-1 text-3xl font-semibold tracking-tight tabular-nums">{score.current ? Math.round(score.current.fresh) : '–'}%</div>
			<p class="text-xs text-muted-foreground">
				{t("The same kind of question, never published. This is the model's real level.", 'O mesmo tipo de pergunta, nunca publicado. Este é o nível real do modelo.')}
			</p>
			{@render wall(PUBLIC, QUESTIONS.length, false)}
		</div>
	</div>

	<div class="lg:grid lg:grid-cols-[1.2fr_1fr]">
		<div class="border-b px-4 py-3.5 lg:border-r lg:border-b-0">
			<h3 class="text-xs font-medium">{t('Five models, ranked twice', 'Cinco modelos, ordenados duas vezes')}</h3>
			<p class="mt-1 text-xs text-muted-foreground">
				{t(
					'Left: the public benchmark. Right: fresh questions. Models that saw the test top one list and drop in the other.',
					'Esquerda: o benchmark público. Direita: perguntas novas. Os modelos que viram o teste lideram uma lista e caem na outra.'
				)}
			</p>
			<div class="mt-2" bind:clientWidth={slopeWidth}>
				{#if models.every(Boolean) && slopeWidth > 0}
					{@const lx = Math.min(200, slopeWidth * 0.3)}
					{@const rx = slopeWidth - lx}
					{@const pubs = models.map((r) => pct(r.publicRight, PUBLIC))}
					{@const fresh = models.map((r) => pct(r.freshRight, QUESTIONS.length - PUBLIC))}
					{@const ly = spread(pubs)}
					{@const ry = spread(fresh)}
					<svg width={slopeWidth} height={SH} viewBox="0 0 {slopeWidth} {SH}" class="block" role="img" aria-label={t('Five models ranked by the public benchmark and by fresh questions.', 'Cinco modelos ordenados pelo benchmark público e pelas perguntas novas.')}>
						<g class="fill-muted-foreground" font-size="10">
							<text x={lx} y="10" text-anchor="middle">{t('public benchmark', 'benchmark público')}</text>
							<text x={rx} y="10" text-anchor="middle">{t('fresh questions', 'perguntas novas')}</text>
						</g>
						<line x1={lx} y1={ST} x2={lx} y2={SB} class="stroke-border" />
						<line x1={rx} y1={ST} x2={rx} y2={SB} class="stroke-border" />
						{#each MODELS as m, i (m.name)}
							{@const hot = i === mine}
							<line x1={lx} y1={sy(pubs[i])} x2={rx} y2={sy(fresh[i])} class={hot ? 'stroke-foreground' : 'stroke-muted-foreground'} stroke-width={hot ? 2.5 : 1.5} />
							<circle cx={lx} cy={sy(pubs[i])} r="4" class={hot ? 'fill-foreground' : 'fill-muted-foreground'} />
							<circle cx={rx} cy={sy(fresh[i])} r="4" class={hot ? 'fill-foreground' : 'fill-muted-foreground'} />
							<text x={lx - 10} y={ly[i] + 4} font-size="11" text-anchor="end" class={hot ? 'fill-foreground' : 'fill-muted-foreground'}>{local(m, 'label')} {pubs[i]}%</text>
							<text x={rx + 10} y={ry[i] + 4} font-size="11" class={hot ? 'fill-foreground' : 'fill-muted-foreground'}>{fresh[i]}% {m.name}</text>
						{/each}
					</svg>
					<p class="text-xs text-muted-foreground">
						{MODELS.map((m) => `${m.name}: ${local(m, 'hint')}`).join(' · ')}
					</p>
				{:else}
					<p class="text-sm text-muted-foreground">{t('Training five models…', 'Treinando cinco modelos…')}</p>
				{/if}
			</div>
		</div>

		<div class="px-4 py-3.5">
			<div class="flex items-start justify-between gap-3">
				<div>
					<h3 class="text-xs font-medium">{t('Leaks inflate the public score', 'Vazamentos inflam a nota pública')}</h3>
					<p class="mt-1 text-xs text-muted-foreground">
						{t('Solid: the public benchmark. Dashed: fresh questions. Rings: your setting.', 'Sólida: o benchmark público. Tracejada: perguntas novas. Anéis: a sua configuração.')}
					</p>
				</div>
				<PlayButton {play} />
			</div>
			<div class="mt-2" bind:clientWidth={chartWidth}>
				{#if lines.current && chartWidth > 0}
					{@const c = lines.current}
					<svg width={chartWidth} height={H} viewBox="0 0 {chartWidth} {H}" class="block" role="img" aria-label={t(
							'The public score rises with every leaked question while the fresh score stays flat.',
							'A nota pública sobe a cada pergunta vazada, enquanto a nota nas perguntas novas fica estável.'
						)}>
						<g class="stroke-border" stroke-width="1">
							{#each [0, 50, 100] as v (v)}
								<line x1={L} y1={cy(v)} x2={chartWidth - 10} y2={cy(v)} />
							{/each}
						</g>
						<g class="fill-muted-foreground" font-size="10">
							{#each [0, 50, 100] as v (v)}
								<text x={L - 5} y={cy(v) + 3} text-anchor="end">{v}%</text>
							{/each}
							{#each [0, 3, 6, 9, 12] as k (k)}
								<text x={cx(k)} y={B + 13} text-anchor={k === PUBLIC ? 'end' : 'middle'}>{k}</text>
							{/each}
							<text x={(L + chartWidth) / 2} y={H - 3} text-anchor="middle">{t(`public questions in the training text, of ${PUBLIC}`, `perguntas públicas no texto de treino, de ${PUBLIC}`)}</text>
						</g>
						<polyline points={c.pub.map((v, k) => `${cx(k)},${cy(v)}`).join(' ')} fill="none" class="stroke-foreground" stroke-width="2" />
						<polyline points={c.fresh.map((v, k) => `${cx(k)},${cy(v)}`).join(' ')} fill="none" class="stroke-muted-foreground" stroke-width="2" stroke-dasharray="5 4" />
						<circle cx={cx(ring.current)} cy={cy(at(c.pub, ring.current))} r="5" class="fill-background stroke-foreground" stroke-width="2" />
						<circle cx={cx(ring.current)} cy={cy(at(c.fresh, ring.current))} r="5" class="fill-background stroke-muted-foreground" stroke-width="2" />
					</svg>
				{/if}
			</div>
		</div>
	</div>
</div>
