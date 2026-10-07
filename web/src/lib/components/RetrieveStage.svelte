<script>
	import { PAGES, QUESTIONS, MAX_K, percent } from '$lib/retrieval-sim.js';
	import { eased } from '$lib/motion.svelte.js';
	import { t, local } from '$lib/i18n.svelte.js';

	// question: the question being asked, and its text as asked. results: every
	// page's score, rank and share. said: the most likely answer. rows: each
	// question's outcome at your settings. same, other: the curves over pages
	// handed, for both ways of asking. k: pages handed over. pace: easing time.
	let { question, asked, results, said, rows, totals, same, other, k, pace = 450 } = $props();

	const SHOWN = 6;
	const top = $derived(results ? results.slice(0, SHOWN) : []);
	const most = $derived(results ? Math.max(results[0]?.score ?? 0, 1e-9) : 1);
	const right = $derived(results ? results.find((r) => r.page === question.page) : null);
	// the answer a page gives, in the reader's language (the page text itself stays English)
	const answerOf = (q, p) => t(q.answers[p], q.pt?.answers?.[p] ?? q.answers[p]);

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
	<svg viewBox="0 0 300 108" class="mt-1.5 w-full" role="img" aria-label={t(
			`${title}: chance the right page is handed over and chance of a right answer, by pages handed over.`,
			`${title}: chance de a página certa ser entregue e chance de uma resposta certa, pelo número de páginas entregues.`
		)}>
		<g class="stroke-border" stroke-width="1">
			<line x1={L} y1={B} x2={R} y2={B} />
			<line x1={L} y1={T} x2={R} y2={T} />
			{#each [1, 4, 8] as tk (tk)}
				<line x1={cx(tk)} y1={T} x2={cx(tk)} y2={B} />
			{/each}
		</g>
		<g class="fill-muted-foreground" font-size="10">
			<text x={L - 4} y={T + 4} text-anchor="end">100%</text>
			<text x={L - 4} y={B + 3} text-anchor="end">0%</text>
			{#each [1, 4, 8] as tk (tk)}
				<text x={cx(tk)} y={B + 14} text-anchor="middle">{tk}</text>
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
		<h3 class="text-xs font-medium">{t('What the search hands to the model', 'O que a busca entrega ao modelo')}</h3>
		<div class="mt-3 rounded-md border px-3 py-2 text-center text-sm">{asked}</div>
		{#if results}
			<div class="mt-3 space-y-1.5">
				{#each top as r (r.page)}
					<div class="grid grid-cols-[1.25rem_9.5rem_1fr_2.5rem] items-center gap-2 text-sm {r.handed ? '' : 'opacity-45'}">
						<span class="text-xs text-muted-foreground tabular-nums">{r.rank + 1}</span>
						<span class="truncate {r.page === question.page ? 'font-semibold' : ''}"
							>{PAGES[r.page].title}{r.page === question.page ? ' ✓' : ''}{PAGES[r.page].old ? t(' (old)', ' (antiga)') : ''}</span
						>
						<div class="h-3 rounded-sm bg-muted/60">
							<div class="h-full rounded-sm bg-foreground/80 transition-[width] duration-500 ease-out" style="width: {(r.score / most) * 100}%"></div>
						</div>
						<span class="text-right text-xs text-muted-foreground tabular-nums">{r.score.toFixed(1)}</span>
					</div>
				{/each}
			</div>
			<div class="mt-1.5 text-xs text-muted-foreground">
				{t(
					`Bars: search score. Faded: left out. The top ${k} ${k === 1 ? 'page goes' : 'pages go'} to the model.`,
					`Barras: nota da busca. Apagadas: deixadas de fora. ${k === 1 ? 'A primeira página vai' : `As ${k} primeiras páginas vão`} para o modelo.`
				)}
			</div>

			<div class="mt-3.5 rounded-md bg-muted/60 px-3 py-2 text-sm">
				{#if said.text}
					"{answerOf(question, said.page) ?? said.text}" <span class="text-xs text-muted-foreground">{t('from', 'de')} {PAGES[said.page].title}</span>
				{:else if said.page !== null}
					{t('A guess.', 'Um chute.')}
					<span class="text-xs text-muted-foreground">{t(`${PAGES[said.page].title} does not answer it.`, `${PAGES[said.page].title} não responde a pergunta.`)}</span>
				{:else}
					{t('No page matched, so it answers without one.', 'Nenhuma página combinou, então ele responde sem nenhuma.')}
				{/if}
			</div>
			<div class="mt-1.5 flex items-baseline justify-between gap-2 text-sm">
				<b class="font-semibold {said.right ? '' : 'text-muted-foreground'}">{said.right ? t('✓ right', '✓ certa') : t(`✗ the answer is ${question.answers[question.page]}`, `✗ a resposta é ${answerOf(question, question.page)}`)}</b>
				<span class="text-xs text-muted-foreground">{t('chance of a right answer', 'chance de resposta certa')}: {percent(right ? right.share : 0)}</span>
			</div>
		{/if}
	</div>

	<div class="border-b px-4 py-3.5 lg:border-r lg:border-b-0">
		<h3 class="text-xs font-medium">{t('All five questions, asked this way', 'As cinco perguntas, feitas deste jeito')}</h3>
		{#if rows}
			<div class="mt-3.5 space-y-2.5">
				{#each rows as r, i (i)}
					{@render meter(local(QUESTIONS[i], 'short'), r.right, r.handed ? 1 : undefined, QUESTIONS[i] === question)}
				{/each}
			</div>
			<div class="mt-2 text-xs text-muted-foreground">
				{t('Outline: its page was handed over. Solid: chance of a right answer.', 'Contorno: a página dela foi entregue. Cheia: chance de resposta certa.')}
			</div>

			<h3 class="mt-4 border-t pt-3.5 text-xs font-medium">{t('On average', 'Na média')}</h3>
			<div class="mt-3 space-y-2.5">
				{@render meter(t('Page handed over', 'Página entregue'), totals.handed, undefined, false)}
				{@render meter(t('Answer right', 'Resposta certa'), totals.right, totals.handed, true)}
			</div>
			<p class="mt-2.5 text-sm">
				{#if totals.handed - totals.right > 0.05}{t('The search finds more than the model uses:', 'A busca encontra mais do que o modelo usa:')}
					<b class="font-semibold">{Math.round((totals.handed - totals.right) * 100)} {t('points', 'pontos')}</b>
					{t('lost to other pages.', 'perdidos para outras páginas.')}{:else}{t('When the page is found, the model uses it.', 'Quando a página é encontrada, o modelo a usa.')}{/if}
			</p>
		{/if}
	</div>

	<div class="px-4 py-3.5">
		{#if curves.current}
			{@const c = curves.current}
			{@render chart(t("Asked with the page's words", 'Perguntando com as palavras da página'), c.sh, c.sr)}
			<div class="mt-3">{@render chart(t('Asked with other words', 'Perguntando com outras palavras'), c.oh, c.or)}</div>
			<div class="text-center text-xs text-muted-foreground">{t('pages handed to the model', 'páginas entregues ao modelo')}</div>
			<div class="mt-1 text-xs text-muted-foreground">
				{t(
					'Solid: right page handed over. Dashed: right answer. The rings mark your setting.',
					'Cheia: página certa entregue. Tracejada: resposta certa. Os anéis marcam a sua configuração.'
				)}
			</div>
		{/if}
	</div>
</div>
