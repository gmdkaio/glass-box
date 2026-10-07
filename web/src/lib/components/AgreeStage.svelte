<script>
	import { QUESTIONS, NUDGES, LEVELS, TRUTH, YOURS, rowOf, message, messagePt, percent } from '$lib/agree-sim.js';
	import { t, local } from '$lib/i18n.svelte.js';
	import { eased } from '$lib/motion.svelte.js';

	// qi: which question. on: the nudges switched on. turns: the odds behind each reply.
	// neutral: the odds asked plainly. grid: agreement for every level and nudge count.
	// curves: agreement by nudge count for the three questions.
	let { qi, on, turns, neutral, grid, curves } = $props();

	const q = $derived(QUESTIONS[qi]);
	// the answers as the page shows them, in the reader's language
	const answers = $derived(t(q.answers, q.pt.answers));
	const settings = $derived(NUDGES.filter((n) => n.where === 'settings' && on.has(n.key)));
	const top = (odds) => Array.from(odds.keys()).reduce((a, b) => (odds[b] > odds[a] ? b : a), 0);
	const last = $derived(turns ? turns.at(-1).odds : null);
	const bars = eased(() => (last && neutral ? { now: Array.from(last), was: Array.from(neutral) } : null));

	function replyText(turn) {
		const pick = top(turns[turn].odds);
		const reply = t(q.reply(q.answers[pick]), q.pt.reply(q.pt.answers[pick]));
		if (turn === 0) return reply;
		const before = top(turns[0].odds);
		if (pick === YOURS && before !== YOURS) return `${t("You're right, my apologies.", 'Você tem razão, me desculpe.')} ${reply}`;
		if (pick === YOURS) return `${t('Yes.', 'Sim.')} ${reply}`;
		if (pick === before) return `${t("I'm confident in my answer.", 'Estou confiante na minha resposta.')} ${reply}`;
		return reply;
	}

	// agreement against the number of nudges, for the three questions
	let chartWidth = $state(0);
	const H = 160,
		L = 38,
		T = 12,
		B = H - 30;
	const cx = (k) => L + (k / NUDGES.length) * (chartWidth - 10 - L);
	const cy = (v) => B - v * (B - T);
	const ring = eased(() => on.size, 300);
	const at = (ys, k) => {
		const i = Math.max(0, Math.min(ys.length - 2, Math.floor(k)));
		return ys[i] + (ys[i + 1] - ys[i]) * (k - i);
	};
	const DASH = [undefined, '6 4', '2 3'];
</script>

{#snippet odds(o)}
	<div class="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
		{#each [TRUTH, YOURS] as i (i)}
			<div>
				<div class="flex justify-between"><span class={i === YOURS ? '' : 'text-foreground'}>{answers[i]}{i === TRUTH ? ' ✓' : t(' · yours', ' · sua')}</span><span class="tabular-nums">{percent(o[i])}</span></div>
				<div class="mt-0.5 h-1.5 rounded-full bg-muted"><div class="h-full rounded-full bg-foreground/80 transition-[width] duration-300" style="width: {o[i] * 100}%"></div></div>
			</div>
		{/each}
	</div>
{/snippet}

<div class="overflow-hidden rounded-lg border">
	<div class="lg:grid lg:grid-cols-[1fr_1.35fr]">
		<div class="border-b px-4 py-3.5 lg:border-r">
			<h3 class="text-xs font-medium">{t('The conversation', 'A conversa')}</h3>
			<div class="mt-3 rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
				<div class="mb-1 text-[10px] tracking-wide uppercase">{t('Your settings, added to every chat', 'Suas configurações, acrescentadas a todo chat')}</div>
				{#if settings.length}
					{#each settings as s (s.key)}
						<div><span class="text-foreground">{local(s, 'label')}:</span> {local(s, 'example')(q)}</div>
					{/each}
				{:else}
					<div>{t('None.', 'Nenhuma.')}</div>
				{/if}
			</div>
			{#if turns}
				<div class="mt-3 ml-auto w-fit max-w-[85%] rounded-lg border bg-muted px-3 py-2 text-sm">{t(message, messagePt)(q, on)}</div>
				<div class="mt-2 max-w-[90%] rounded-lg border px-3 py-2 text-sm">
					{replyText(0)}
					{@render odds(turns[0].odds)}
				</div>
				{#if turns.length > 1}
					<div class="mt-2 ml-auto w-fit max-w-[85%] rounded-lg border bg-muted px-3 py-2 text-sm">
						{t(`Are you sure? I think it's ${q.mine}.`, `Tem certeza? Acho que é ${q.pt.mine}.`)}
					</div>
					<div class="mt-2 max-w-[90%] rounded-lg border px-3 py-2 text-sm">
						{replyText(1)}
						{@render odds(turns[1].odds)}
					</div>
				{/if}
				<p class="mt-2 text-xs text-muted-foreground">
					{t(
						'The text shows its most likely reply. The bars: how often it would give each answer.',
						'O texto mostra a resposta mais provável. As barras: quantas vezes ele daria cada resposta.'
					)}
				</p>
			{/if}
		</div>

		<div class="border-b px-4 py-3.5">
			<h3 class="text-xs font-medium">{t('Where it gives in', 'Onde ele cede')}</h3>
			<p class="mt-1 text-xs text-muted-foreground">
				{t(
					'How often it takes your side, by how sure it is (down) and how many nudges push it (across). Outlined: your question and your nudges.',
					'Quantas vezes ele fica do seu lado, pelo quanto ele tem certeza (para baixo) e por quantos empurrões o pressionam (para o lado). Contornada: a sua pergunta e os seus empurrões.'
				)}
			</p>
			{#if grid}
				<div class="mt-3 grid grid-cols-[6.5rem_repeat(7,1fr)] gap-1 text-[11px]">
					<div></div>
					{#each Array.from({ length: NUDGES.length + 1 }) as _, n (n)}
						<div class="text-center text-muted-foreground">{n === 0 ? t('none', 'zero') : n}</div>
					{/each}
					{#each LEVELS as level, r (level.label)}
						<div class="self-center text-muted-foreground {r === rowOf(q) ? 'font-semibold text-foreground' : ''}">{local(level, 'label')}</div>
						{#each grid[r] as v, n (n)}
							{@const mine = r === rowOf(q) && n === on.size}
							<div
								class="flex h-9 items-center justify-center rounded-sm tabular-nums transition-colors {v > 0.45 ? 'text-background' : 'text-foreground'} {mine
									? 'outline-2 outline-offset-1 outline-foreground'
									: ''}"
								style="background: color-mix(in oklab, var(--foreground) {Math.round((0.05 + v * 0.9) * 100)}%, transparent)"
							>
								{Math.round(v * 100)}%
							</div>
						{/each}
					{/each}
				</div>
				<p class="mt-2 text-xs text-muted-foreground">
					{t('Nudges across, in order', 'Empurrões na horizontal, em ordem')}: {NUDGES.map((n) => local(n, 'label').toLowerCase()).join(', ')}.
				</p>
			{/if}
		</div>
	</div>

	<div class="lg:grid lg:grid-cols-2">
		<div class="border-b px-4 py-3.5 lg:border-r lg:border-b-0">
			<h3 class="text-xs font-medium">{t('The odds it answers with', 'As chances de cada resposta')}</h3>
			<p class="mt-1 text-xs text-muted-foreground">{t('Outline: asked plainly. Solid: with your nudges.', 'Contorno: pergunta simples. Cheio: com os seus empurrões.')}</p>
			{#if bars.current}
				<div class="mt-3 space-y-2">
					{#each answers as a, i (a)}
						<div class="grid grid-cols-[8rem_1fr_3rem] items-center gap-2.5 text-sm">
							<div class="truncate {i === TRUTH ? 'font-semibold' : 'text-muted-foreground'}">{a}{i === TRUTH ? ' ✓' : i === YOURS ? t(' · yours', ' · sua') : ''}</div>
							<div class="relative h-3.5 rounded-sm bg-muted/60">
								<div class="absolute inset-y-0 left-0 rounded-sm bg-foreground/80" style="width: {bars.current.now[i] * 100}%"></div>
								<div class="absolute inset-y-0 left-0 rounded-sm border border-muted-foreground" style="width: {bars.current.was[i] * 100}%"></div>
							</div>
							<div class="text-right text-xs text-muted-foreground tabular-nums">{percent(last[i])}</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<div class="px-4 py-3.5">
			<h3 class="text-xs font-medium">{t('More nudges, more agreement', 'Mais empurrões, mais concordância')}</h3>
			<p class="mt-1 text-xs text-muted-foreground">
				{t('How often it takes your side. Solid', 'Quantas vezes ele fica do seu lado. Contínua')}: {local(QUESTIONS[0], 'label').toLowerCase()}. {t('Dashed', 'Tracejada')}:
				{local(QUESTIONS[1], 'label').toLowerCase()}. {t('Dotted', 'Pontilhada')}: {local(QUESTIONS[2], 'label').toLowerCase()}. {t('Rings: your nudges.', 'Anéis: os seus empurrões.')}
			</p>
			<div class="mt-2" bind:clientWidth={chartWidth}>
				{#if curves && chartWidth > 0}
					<svg width={chartWidth} height={H} viewBox="0 0 {chartWidth} {H}" class="block" role="img" aria-label={t(
						'Agreement with you rises with every nudge, fastest on questions the model is unsure about.',
						'A concordância com você sobe a cada empurrão, mais rápido nas perguntas em que o modelo está inseguro.'
					)}>
						<g class="stroke-border" stroke-width="1">
							{#each [0, 0.5, 1] as v (v)}
								<line x1={L} y1={cy(v)} x2={chartWidth - 10} y2={cy(v)} />
							{/each}
						</g>
						<g class="fill-muted-foreground" font-size="10">
							{#each [0, 0.5, 1] as v (v)}
								<text x={L - 5} y={cy(v) + 3} text-anchor="end">{v * 100}%</text>
							{/each}
							{#each Array.from({ length: NUDGES.length + 1 }) as _, k (k)}
								<text x={cx(k)} y={B + 13} text-anchor={k === NUDGES.length ? 'end' : 'middle'}>{k}</text>
							{/each}
							<text x={(L + chartWidth) / 2} y={H - 3} text-anchor="middle">{t('nudges toward your answer', 'empurrões na direção da sua resposta')}</text>
						</g>
						{#each curves as ys, i (i)}
							<polyline points={ys.map((v, k) => `${cx(k)},${cy(v)}`).join(' ')} fill="none" class={i === qi ? 'stroke-foreground' : 'stroke-muted-foreground'} stroke-width="2" stroke-dasharray={DASH[i]} />
							<circle cx={cx(ring.current)} cy={cy(at(ys, ring.current))} r="5" class="fill-background {i === qi ? 'stroke-foreground' : 'stroke-muted-foreground'}" stroke-width="2" />
						{/each}
					</svg>
				{/if}
			</div>
		</div>
	</div>
</div>
