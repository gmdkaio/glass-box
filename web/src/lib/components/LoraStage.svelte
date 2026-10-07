<script>
	import { TEXTS, RANKS, W2, QWEN, percent } from '$lib/lora-sim.js';
	import { eased } from '$lib/motion.svelte.js';
	import { t, local, locale } from '$lib/i18n.svelte.js';

	// t: which text. r: the rank. runs: a fine-tune of each text, or null while it trains.
	// odds: { words, before, lora, full } for the probe word. patch: B2, A2 and their
	// product at this rank. qwen: { count, share } for the real model. every: every weight or attention.
	let { t: textAt, r, runs, odds, patch, qwen, every } = $props();

	const run = $derived(runs[textAt]);
	const text = $derived(TEXTS[textAt]);
	const at = $derived(run ? run.ranks.find((x) => x.r === r) : null);

	const bars = eased(() => (odds ? { before: Array.from(odds.before), lora: Array.from(odds.lora), full: Array.from(odds.full) } : null));
	const gains = eased(() => (run ? run.ranks.map((x) => x.gain) : null));
	const curves = eased(() => runs.map((x) => (x ? x.ranks.map((y) => y.gain) : null)));
	const ring = eased(() => Math.log2(r));

	// The heatmaps and the curve are drawn at their real pixel width.
	let wide = $state(0);
	const GAP = 18;
	const cell = $derived(Math.max(3, Math.min(9, Math.floor((wide - GAP - 4) / (16 + W2.cols)))));
	const x0 = $derived(16 * cell + GAP); // where the layer's columns start
	const scale = $derived(run ? Math.max(1e-9, ...Array.from(run.change, Math.abs)) : 1);
	const stripScale = (v) => Math.max(1e-9, ...Array.from(v, Math.abs));

	let chartWidth = $state(0);
	const H = 210,
		L = 36,
		T = 12,
		B = H - 30;
	const cx = (k) => L + (k / 4) * (chartWidth - 10 - L);
	// from 50%: every text gets at least that far at rank 1
	const cy = (v) => B - Math.max(0, Math.min(1, (v - 0.5) / 0.5)) * (B - T);
	const yAt = (ys, k) => {
		// ranks are not evenly spaced, so find the two around log2 r
		const ks = RANKS.map(Math.log2);
		const i = Math.max(0, Math.min(ks.length - 2, ks.findLastIndex((x) => x <= k)));
		return ys[i] + (ys[i + 1] - ys[i]) * ((k - ks[i]) / (ks[i + 1] - ks[i]));
	};
</script>

{#snippet heat(values, rows, cols, x, y, top)}
	{#each Array.from({ length: rows }) as _, i (i)}
		{#each Array.from({ length: cols }) as _, k (k)}
			{@const v = values[i * cols + k]}
			<rect
				x={x + k * cell}
				y={y + i * cell}
				width={cell - 1}
				height={cell - 1}
				class={v >= 0 ? 'fill-foreground' : 'fill-muted-foreground'}
				fill-opacity={0.05 + 0.95 * Math.min(1, Math.abs(v) / top)}
			/>
		{/each}
	{/each}
{/snippet}

<div class="overflow-hidden rounded-lg border">
	<div class="lg:grid lg:grid-cols-[1fr_1.7fr]">
		<div class="border-b px-4 py-3.5 lg:border-r">
			<h3 class="text-xs font-medium">{t(`The next word after "${text.probe}", before and after`, `A próxima palavra depois de "${text.probe}", antes e depois`)}</h3>
			<div class="mt-3 rounded-md border px-3 py-2 text-center text-sm">{text.prompt} …</div>
			{#if odds && bars.current}
				{@const top = Math.max(...bars.current.before, ...bars.current.lora, ...bars.current.full)}
				<div class="mt-3 space-y-1.5">
					{#each odds.words as word, i (word)}
						<div class="grid grid-cols-[5.5rem_1fr_3rem] items-center gap-2.5 text-sm">
							<div class="truncate">{word}</div>
							<div class="relative h-3.5 rounded-sm bg-muted/60">
								<div class="absolute inset-y-0 left-0 rounded-sm bg-foreground/80" style="width: {(bars.current.lora[i] / top) * 100}%"></div>
								<div class="absolute inset-y-0 left-0 rounded-sm border border-muted-foreground" style="width: {(bars.current.before[i] / top) * 100}%"></div>
								<div class="absolute -inset-y-0.5 w-0.5 bg-foreground" style="left: calc({(bars.current.full[i] / top) * 100}% - 1px)"></div>
							</div>
							<div class="text-right text-xs text-muted-foreground tabular-nums">{percent(odds.lora[i])}</div>
						</div>
					{/each}
				</div>
				<div class="mt-2 text-xs text-muted-foreground">
					{t(
						`Outline: the model before. Solid: after LoRA rank ${r}. Line: after a full fine-tune.`,
						`Contorno: o modelo antes. Cheio: depois da LoRA com rank ${r}. Linha: depois de um fine-tuning completo.`
					)}
				</div>
			{:else}
				<p class="mt-3 text-sm text-muted-foreground">{t('Training…', 'Treinando…')}</p>
			{/if}
		</div>

		<div class="border-b px-4 py-3.5">
			<h3 class="text-xs font-medium">{t('The patch for the last layer', 'O remendo da última camada')}: {W2.rows} × {W2.cols} {t('numbers', 'números')}</h3>
			<p class="mt-1 text-xs text-muted-foreground">
				{t(
					`Light: a number went up. Grey: it went down. Each map is shaded to its own largest change. A full fine-tune changes all ${(16 * W2.cols).toLocaleString(locale())}. LoRA trains B and A, and adds B × A to the frozen layer.`,
					`Claro: um número subiu. Cinza: ele desceu. Cada mapa é sombreado pela própria maior mudança. Um fine-tuning completo muda todos os ${(16 * W2.cols).toLocaleString(locale())}. A LoRA treina B e A, e soma B × A à camada congelada.`
				)}
			</p>
			<div class="mt-2" bind:clientWidth={wide}>
				{#if run && patch && wide > 0}
					{@const y1 = 16}
					{@const y2 = y1 + 16 * cell + 26}
					{@const y3 = y2 + r * cell + 6}
					<svg width={wide} height={y3 + 16 * cell + 6} viewBox="0 0 {wide} {y3 + 16 * cell + 6}" class="block" role="img" aria-label={t("The change a full fine-tune makes to the last layer, and LoRA's patch built from two thin strips.", 'A mudança que um fine-tuning completo faz na última camada, e o remendo da LoRA feito de duas tiras finas.')}>
						<text x={x0} y={y1 - 5} font-size="10" class="fill-muted-foreground">{t('full fine-tune: what changed', 'fine-tuning completo: o que mudou')}</text>
						{@render heat(run.change, 16, W2.cols, x0, y1, scale)}
						<text x={x0} y={y2 - 5} font-size="10" class="fill-muted-foreground">A: {r} × {W2.cols}</text>
						{@render heat(patch.a, r, W2.cols, x0, y2, stripScale(patch.a))}
						<text x={x0 - GAP / 2 - r * cell} y={y3 - 5} font-size="10" text-anchor="end" class="fill-muted-foreground">B: 16 × {r}</text>
						{@render heat(patch.b, 16, r, x0 - GAP / 2 - r * cell, y3, stripScale(patch.b))}
						{@render heat(patch.product, 16, W2.cols, x0, y3, stripScale(patch.product))}
						<text x={x0 - 4} y={y1 + 8 * cell} font-size="10" text-anchor="end" class="fill-muted-foreground">{t('full', 'completo')}</text>
					</svg>
					<p class="text-xs text-muted-foreground">
						{t(
							`Bottom: B × A, the change LoRA rank ${r} makes. It trains ${at?.trained.toLocaleString(locale())} numbers here, against ${run.fullCount.toLocaleString(locale())} for a full fine-tune of the whole network.`,
							`Embaixo: B × A, a mudança que a LoRA com rank ${r} faz. Ela treina ${at?.trained.toLocaleString(locale())} números aqui, contra ${run.fullCount.toLocaleString(locale())} de um fine-tuning completo da rede inteira.`
						)}
					</p>
				{/if}
			</div>
		</div>
	</div>

	<div class="lg:grid lg:grid-cols-2">
		<div class="border-b px-4 py-3.5 lg:border-r lg:border-b-0">
			<h3 class="text-xs font-medium">{t('The same fine-tune, at each rank', 'O mesmo fine-tuning, em cada rank')}</h3>
			<p class="mt-1 text-xs text-muted-foreground">
				{t("Solid: share of the full fine-tune's gain. Outline: numbers trained, against a full fine-tune.", 'Cheio: parte do ganho do fine-tuning completo. Contorno: números treinados, comparados a um fine-tuning completo.')}
			</p>
			{#if run && gains.current}
				<div class="mt-3 space-y-1.5">
					{#each run.ranks as x, i (x.r)}
						<div class="grid grid-cols-[5.5rem_1fr_3rem] items-center gap-2.5 text-sm">
							<div class={x.r === r ? 'font-semibold' : 'text-muted-foreground'}>rank {x.r}</div>
							<div class="relative h-3.5 rounded-sm bg-muted/60">
								<div class="absolute inset-y-0 left-0 rounded-sm bg-foreground/80" style="width: {Math.max(0, Math.min(1, gains.current[i])) * 100}%"></div>
								<div class="absolute inset-y-0 left-0 rounded-sm border border-muted-foreground" style="width: {Math.min(1, x.trained / run.fullCount) * 100}%"></div>
							</div>
							<div class="text-right text-xs text-muted-foreground tabular-nums">{percent(Math.max(0, x.gain))}</div>
						</div>
					{/each}
				</div>
			{/if}
			{#if qwen}
				<div class="mt-3 rounded-md bg-muted/60 px-3 py-2 text-sm">
					<b class="font-semibold">{t('On', 'No')} {QWEN.name}</b>{t(
						`, rank ${r} on ${every ? 'every weight' : 'the attention weights'} trains ${(qwen.count / 1e6).toFixed(1)}M of ${(QWEN.params / 1e9).toFixed(1)}B numbers: ${percent(qwen.share)}.`,
						`, rank ${r} em ${every ? 'todos os pesos' : 'só os pesos de atenção'} treina ${(qwen.count / 1e6).toFixed(1)}M de ${(QWEN.params / 1e9).toFixed(1)}B números: ${percent(qwen.share)}.`
					)}
				</div>
			{/if}
		</div>

		<div class="px-4 py-3.5">
			<h3 class="text-xs font-medium">{t('Rank against the gain it reaches', 'O rank e o ganho que ele alcança')}</h3>
			<p class="mt-1 text-xs text-muted-foreground">
				{t(
					`Solid: ${text.label.toLowerCase()}. Dashed: the other two texts. Rings: your rank.`,
					`Cheia: ${local(text, 'label').toLowerCase()}. Tracejadas: os outros dois textos. Anéis: o seu rank.`
				)}
			</p>
			<div class="mt-2" bind:clientWidth={chartWidth}>
				{#if curves.current && chartWidth > 0}
					<svg width={chartWidth} height={H} viewBox="0 0 {chartWidth} {H}" class="block" role="img" aria-label={t("Share of a full fine-tune's gain against LoRA rank, for three texts.", 'Parte do ganho de um fine-tuning completo por rank da LoRA, para três textos.')}>
						<g class="stroke-border" stroke-width="1">
							{#each [0.5, 0.75, 1] as v (v)}
								<line x1={L} y1={cy(v)} x2={chartWidth - 10} y2={cy(v)} />
							{/each}
						</g>
						<g class="fill-muted-foreground" font-size="10">
							{#each [0.5, 0.75, 1] as v (v)}
								<text x={L - 5} y={cy(v) + 3} text-anchor="end">{v * 100}%</text>
							{/each}
							{#each RANKS as k (k)}
								<text x={cx(Math.log2(k))} y={B + 13} text-anchor={k === 16 ? 'end' : 'middle'}>{k}</text>
							{/each}
							<text x={(L + chartWidth) / 2} y={H - 3} text-anchor="middle">{t("rank · share of a full fine-tune's gain", 'rank · parte do ganho de um fine-tuning completo')}</text>
						</g>
						{#each curves.current as ys, i (i)}
							{#if ys}
								<polyline
									points={ys.map((v, j) => `${cx(Math.log2(RANKS[j]))},${cy(v)}`).join(' ')}
									fill="none"
									class={i === textAt ? 'stroke-foreground' : 'stroke-muted-foreground'}
									stroke-width="2"
									stroke-dasharray={i === textAt ? undefined : '5 4'}
								/>
								<circle cx={cx(ring.current)} cy={cy(yAt(ys, ring.current))} r="5" class="fill-background {i === textAt ? 'stroke-foreground' : 'stroke-muted-foreground'}" stroke-width="2" />
							{/if}
						{/each}
					</svg>
				{/if}
			</div>
		</div>
	</div>
</div>
