<script>
	import { SPOTS, FILTERS, CUT_NAMES, PENALTIES, RUNS, isBad, words, repeats, percent } from '$lib/settings-sim.js';
	import { eased } from '$lib/motion.svelte.js';
	import PlayButton from '$lib/components/PlayButton.svelte';
	import { t, local, locale } from '$lib/i18n.svelte.js';

	// spotAt: which spot. s: the settings. result: the engine's odds after the
	// settings, with who cut what. plain: the odds with no filters. counts: a
	// run of draws. curves: words kept by each filter alone, per spot.
	// reply: a reply with these settings, of which `shown` words are visible.
	// penCurve: loops and odd picks by penalty. play: the reply's sweep button.
	let { spotAt, s, result, plain, counts, curves, reply, shown, penCurve, play } = $props();

	const spot = $derived(SPOTS[spotAt]);
	const order = $derived(Array.from(spot.scores.keys()).sort((a, b) => plain[b] - plain[a]));
	const total = $derived(counts ? counts.reduce((a, b) => a + b, 0) : 0);

	// bars share one scale so the top word of the Sure spot fits
	const odds = eased(() => (result ? { after: result.odds, before: plain } : null));
	const scale = $derived(odds.current ? Math.max(...odds.current.after, ...odds.current.before) : 1);
	const w = (v) => (v / scale) * 100;

	// The charts are drawn at their real pixel width, so text and lines keep their size.
	let wide = $state(0);
	const GAP = 18,
		H = 380,
		L = 28,
		T = 12,
		B = H - 28;
	const panel = $derived(Math.max(0, (wide - 2 * GAP) / 3));
	const lines = eased(() => curves);
	const isOff = (f) => (f.key === 'topK' ? s.topK === 0 : f.key === 'topP' ? s.topP >= 1 : s.minP <= 0);
	const at = (f) => {
		const v = s[f.key];
		if (f.key === 'topK') return v === 0 ? f.off : Math.min(v, 16);
		return v;
	};
	const rings = eased(() => FILTERS.map(at));

	function curveAt(f, ys, x) {
		const lo = f.xs[0],
			hi = f.xs.at(-1);
		const k = ((x - lo) / (hi - lo)) * (ys.length - 1);
		const i = Math.max(0, Math.min(ys.length - 2, Math.floor(k)));
		return ys[i] + (ys[i + 1] - ys[i]) * (k - i);
	}

	// the reply's chart over repeat_penalty
	let replyWidth = $state(0);
	const PH = 190,
		PL = 34,
		PT = 10,
		PB = PH - 28;
	const pen = eased(() => (penCurve ? { loops: Array.from(penCurve.loops), odd: Array.from(penCurve.odd) } : null));
	const penRing = eased(() => s.penalty);
	const px = (v) => PL + ((v - 1) / 1) * (replyWidth - 8 - PL);
	// up to 50%, or further in steps of 25% when a reply loops more
	const ptop = $derived(pen.current ? Math.max(0.5, Math.ceil(Math.max(...pen.current.loops, ...pen.current.odd) * 4) / 4) : 0.5);
	const pticks = $derived(Array.from({ length: Math.round(ptop * 4) + 1 }, (_, i) => i / 4));
	const py = (v) => PB - (v / ptop) * (PB - PT);
	const penAt = (ys, v) => {
		const k = (v - 1) * (PENALTIES.length - 1);
		const i = Math.max(0, Math.min(ys.length - 2, Math.floor(k)));
		return ys[i] + (ys[i + 1] - ys[i]) * (k - i);
	};

	const text = $derived(reply ? words(reply.ids) : []);
	const marks = $derived(reply ? repeats(reply.ids) : []);
</script>

<div class="overflow-hidden rounded-lg border">
	<div class="lg:grid lg:grid-cols-[1fr_1.9fr]">
		<div class="border-b px-4 py-3.5 lg:border-r">
			<h3 class="text-xs font-medium">{t('The odds for the next word, after your settings', 'As chances da próxima palavra, depois das suas configurações')}</h3>
			<div class="mt-3 rounded-md border px-3 py-2 text-center text-sm">{spot.text} …</div>
			{#if result && odds.current}
				<div class="mt-3 space-y-0.5">
					{#each order as i (spot.words[i])}
						{@const cut = result.cutBy[i]}
						<div class="grid grid-cols-[5.5rem_1fr_3.5rem] items-center gap-2.5 text-sm">
							<div class="truncate {cut ? 'text-muted-foreground/60 line-through' : ''}">
								{spot.words[i]}{isBad(spot, i) ? ' ✗' : ''}
							</div>
							<div class="relative h-3 rounded-sm bg-muted/60">
								<div class="absolute inset-y-0 left-0 rounded-sm bg-foreground/80" style="width: {w(odds.current.after[i])}%"></div>
								<div
									class="absolute inset-y-0 left-0 rounded-sm border {cut ? 'border-dashed border-muted-foreground/50' : 'border-muted-foreground'}"
									style="width: {w(odds.current.before[i])}%"
								></div>
							</div>
							<div class="text-right text-xs text-muted-foreground tabular-nums">{cut ? CUT_NAMES[cut] : percent(result.odds[i])}</div>
						</div>
					{/each}
				</div>
				<div class="mt-2 text-xs text-muted-foreground">
					{t(
						'Outline: the odds with no filter. Solid: after the cut, shared out among the words kept. ✗ = makes no sense here.',
						'Contorno: as chances sem filtro. Cheio: depois do corte, divididas entre as palavras mantidas. ✗ = não faz sentido aqui.'
					)}
				</div>
			{/if}
		</div>

		<div class="border-b px-4 py-3.5">
			<h3 class="text-xs font-medium">{t('How many words each filter keeps, on its own', 'Quantas palavras cada filtro mantém, sozinho')}</h3>
			<p class="mt-1 text-xs text-muted-foreground">
				{t(
					'Solid: the Open spot. Dashed: the Sure spot. Rings: your settings. top-k keeps the same number at both spots; min-p follows how sure the model is.',
					`Cheia: o lugar ${local(SPOTS[1], 'label')}. Tracejada: o lugar ${local(SPOTS[0], 'label')}. Anéis: as suas configurações. top-k mantém o mesmo número nos dois lugares; min-p acompanha o quanto o modelo está seguro.`
				)}
			</p>
			<div class="mt-2" bind:clientWidth={wide}>
				{#if lines.current && panel > 0}
					<svg width={wide} height={H} viewBox="0 0 {wide} {H}" class="block" role="img" aria-label={t('Words kept by top-k, top-p and min-p as each setting changes, at a sure spot and an open spot.', 'Palavras mantidas por top-k, top-p e min-p conforme cada configuração muda, num lugar seguro e num lugar aberto.')}>
						{#each FILTERS as f, fi (f.key)}
							{@const x0 = fi * (panel + GAP)}
							{@const R = x0 + panel - 4}
							{@const cx = (x) => x0 + L + ((x - f.xs[0]) / (f.xs.at(-1) - f.xs[0])) * (R - x0 - L)}
							{@const cy = (v) => B - (v / 16) * (B - T)}
							<g class="stroke-border" stroke-width="1">
								{#each [0, 4, 8, 12, 16] as v (v)}
									<line x1={x0 + L} y1={cy(v)} x2={R} y2={cy(v)} />
								{/each}
							</g>
							<g class="fill-muted-foreground" font-size="10">
								{#each [0, 8, 16] as v (v)}
									<text x={x0 + L - 5} y={cy(v) + 3} text-anchor="end">{v}</text>
								{/each}
								{#each f.ticks as tick (tick)}
									<text x={cx(tick)} y={B + 13} text-anchor={tick === f.xs.at(-1) ? 'end' : tick === f.xs[0] ? 'start' : 'middle'}>{f.fmt(tick)}</text>
								{/each}
							</g>
							<text x={(x0 + L + R) / 2} y={H - 3} font-size="10" text-anchor="middle" class={isOff(f) ? 'fill-muted-foreground' : 'fill-foreground'}>
								{f.name}{isOff(f) ? t(' (off)', ' (desligado)') : ''}
							</text>
							{#each [1, 0] as si (si)}
								{@const ys = lines.current[fi][si]}
								<polyline
									points={ys.map((v, i) => `${cx(f.xs[i])},${cy(v)}`).join(' ')}
									fill="none"
									class={si === spotAt ? 'stroke-foreground' : 'stroke-muted-foreground'}
									stroke-width="2"
									stroke-dasharray={si === 0 ? '5 4' : undefined}
								/>
								<circle
									cx={cx(rings.current[fi])}
									cy={cy(curveAt(f, ys, rings.current[fi]))}
									r="5"
									class="fill-background {si === spotAt ? 'stroke-foreground' : 'stroke-muted-foreground'}"
									stroke-width="2"
								/>
							{/each}
							{#if fi === 0}
								<text x={x0 + L + 4} y={T + 8} font-size="10" class="fill-muted-foreground">{t('words kept', 'palavras mantidas')}</text>
							{/if}
						{/each}
					</svg>
				{/if}
			</div>
		</div>
	</div>

	<div class="lg:grid lg:grid-cols-2">
		<div class="border-b px-4 py-3.5 lg:border-r lg:border-b-0">
			<h3 class="text-xs font-medium">{t(`What came up in ${total.toLocaleString(locale())} replies`, `O que saiu em ${total.toLocaleString(locale())} respostas`)}</h3>
			<p class="mt-1 text-xs text-muted-foreground">{t('Solid: how often each word came up. Outline: its odds with no filter.', 'Cheio: quantas vezes cada palavra saiu. Contorno: as chances dela sem filtro.')}</p>
			{#if counts}
				<div class="mt-3 space-y-0.5">
					{#each order as i (spot.words[i])}
						<div class="grid grid-cols-[5.5rem_1fr_3rem] items-center gap-2.5 text-sm">
							<div class="truncate {counts[i] ? '' : 'text-muted-foreground/60'}">{spot.words[i]}</div>
							<div class="relative h-3 rounded-sm bg-muted/60">
								<div class="absolute inset-y-0 left-0 rounded-sm bg-foreground/80 transition-[width] duration-500 ease-out" style="width: {w(counts[i] / total)}%"></div>
								<div class="absolute inset-y-0 left-0 rounded-sm border border-muted-foreground transition-[width] duration-500 ease-out" style="width: {w(plain[i])}%"></div>
							</div>
							<div class="text-right text-xs text-muted-foreground tabular-nums">{counts[i]}</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<div class="px-4 py-3.5">
			<div class="flex items-start justify-between gap-3">
				<div>
					<h3 class="text-xs font-medium">{t('A longer reply', 'Uma resposta mais longa')}, repeat_penalty {s.penalty.toFixed(2)}</h3>
					<p class="mt-1 text-xs text-muted-foreground">{t('Underlined: a run of three words the reply already wrote.', 'Sublinhado: uma sequência de três palavras que a resposta já tinha escrito.')}</p>
				</div>
				<PlayButton {play} />
			</div>
			{#if reply}
				<p class="mt-2.5 min-h-[7.5rem] text-sm leading-relaxed">
					{#each text.slice(0, shown) as word, i (i)}{#if i > 0 && word !== '.'}{' '}{/if}<span
							class={marks[i] ? 'underline decoration-muted-foreground underline-offset-4' : i < 4 ? 'text-muted-foreground' : ''}>{word}</span
						>{/each}{shown < text.length ? ' …' : ''}
				</p>
			{/if}
			<div class="mt-2" bind:clientWidth={replyWidth}>
				{#if pen.current && replyWidth > 0}
					{@const c = pen.current}
					<svg width={replyWidth} height={PH} viewBox="0 0 {replyWidth} {PH}" class="block" role="img" aria-label={t('As the repeat penalty grows, loops fall and unlikely words rise.', 'Conforme a penalidade de repetição cresce, os loops caem e as palavras improváveis sobem.')}>
						<g class="stroke-border" stroke-width="1">
							{#each pticks as v (v)}
								<line x1={PL} y1={py(v)} x2={replyWidth - 8} y2={py(v)} />
							{/each}
						</g>
						<g class="fill-muted-foreground" font-size="10">
							{#each pticks as v (v)}
								<text x={PL - 5} y={py(v) + 3} text-anchor="end">{Math.round(v * 100)}%</text>
							{/each}
							{#each [1, 1.25, 1.5, 1.75, 2] as v (v)}
								<text x={px(v)} y={PB + 13} text-anchor={v === 2 ? 'end' : 'middle'}>{v}</text>
							{/each}
							<text x={(PL + replyWidth) / 2} y={PH - 3} text-anchor="middle">{t(`repeat_penalty · share of the reply, averaged over ${RUNS} replies`, `repeat_penalty · parte da resposta, média de ${RUNS} respostas`)}</text>
						</g>
						<polyline points={c.loops.map((v, i) => `${px(PENALTIES[i])},${py(v)}`).join(' ')} fill="none" class="stroke-foreground" stroke-width="2" />
						<polyline
							points={c.odd.map((v, i) => `${px(PENALTIES[i])},${py(v)}`).join(' ')}
							fill="none"
							class="stroke-muted-foreground"
							stroke-width="2"
							stroke-dasharray="5 4"
						/>
						<circle cx={px(penRing.current)} cy={py(penAt(c.loops, penRing.current))} r="5" class="fill-background stroke-foreground" stroke-width="2" />
						<circle cx={px(penRing.current)} cy={py(penAt(c.odd, penRing.current))} r="5" class="fill-background stroke-muted-foreground" stroke-width="2" />
						<text x={px(1) + 6} y={py(c.loops[0]) - 7} font-size="10" class="fill-foreground">{t('repeats an earlier run', 'repete uma sequência anterior')}</text>
						<text x={replyWidth - 10} y={py(c.odd.at(-1)) - 7} font-size="10" text-anchor="end" class="fill-muted-foreground">{t('words the model rated under 10%', 'palavras com chance abaixo de 10% para o modelo')}</text>
					</svg>
				{/if}
			</div>
		</div>
	</div>
</div>
