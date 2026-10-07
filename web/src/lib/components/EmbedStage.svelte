<script>
	import { VOCAB, LABELS, TOPIC_NAMES, TOPIC_PT, PICKS, DIMS, QUESTIONS, percent } from '$lib/embeddings-sim.js';
	import { t } from '$lib/i18n.svelte.js';
	import { eased } from '$lib/motion.svelte.js';
	import PlayButton from '$lib/components/PlayButton.svelte';

	// s: the vectors and the map at the current number of dimensions. word, question:
	// the word and question picked (bindable). near: the word's closest words.
	// results: the notices scored both ways. points: topics and search by dimensions.
	// play: the sweep's button. pace: easing time.
	let { s, word = $bindable(), question = $bindable(), near, results, points, play, pace = 450 } = $props();

	const wi = $derived(VOCAB.indexOf(word));
	const vec = $derived(s && wi >= 0 ? Array.from(s.rows.slice(wi * s.k, (wi + 1) * s.k)) : []);
	const nearSet = $derived(new Set(near ? near.map((x) => x.word) : []));

	// --- the map, at real pixel size, easing as the dimensions change
	let mapW = $state(0);
	const MH = 320,
		PAD = 30,
		CHAR = 6.1; // width of one letter at 10px
	const pts = eased(() => (s ? Array.from(s.map) : null), () => pace);

	// a scale from the 4th to the 96th percentile, widened, so a few stray words
	// are pulled to the edge instead of squashing every group into a corner
	function axis(vals, lo, hi) {
		const sorted = [...vals].sort((a, b) => a - b);
		const q = (f) => sorted[Math.min(sorted.length - 1, Math.max(0, Math.round(f * (sorted.length - 1))))];
		let a = q(0.04),
			b = q(0.96);
		const span = b - a || 1;
		a -= span * 0.18;
		b += span * 0.18;
		return (v) => lo + ((Math.min(Math.max(v, a), b) - a) / (b - a)) * (hi - lo);
	}

	// the outline round a set of points (monotone chain)
	function hull(points) {
		const p = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
		if (p.length < 3) return p;
		const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
		const lo = [],
			hi = [];
		for (const q of p) {
			while (lo.length >= 2 && cross(lo.at(-2), lo.at(-1), q) <= 0) lo.pop();
			lo.push(q);
		}
		for (const q of [...p].reverse()) {
			while (hi.length >= 2 && cross(hi.at(-2), hi.at(-1), q) <= 0) hi.pop();
			hi.push(q);
		}
		return lo.slice(0, -1).concat(hi.slice(0, -1));
	}

	// puts each label at the first spot around its dot that overlaps nothing, or skips it
	function place(items, boxes) {
		const out = [];
		for (const it of items) {
			const tw = it.text.length * (it.wide ?? CHAR);
			const spots = it.spots
				? it.spots
				: [
						[6, 3.5, 'start'],
						[-6, 3.5, 'end'],
						[0, -7, 'middle'],
						[0, 13, 'middle']
					];
			for (const [dx, dy, anchor] of spots) {
				const x0 = anchor === 'start' ? it.x + dx : anchor === 'end' ? it.x + dx - tw : it.x - tw / 2;
				const b = [x0 - 2, it.y + dy - 10, x0 + tw + 2, it.y + dy + 3];
				if (b[0] < 0 || b[2] > mapW || b[1] < 0 || b[3] > MH) continue;
				if (boxes.some((c) => !(b[2] < c[0] || b[0] > c[2] || b[3] < c[1] || b[1] > c[3]))) continue;
				boxes.push(b);
				out.push({ ...it, x: it.x + dx, y: it.y + dy, anchor });
				break;
			}
		}
		return out;
	}

	const layout = $derived.by(() => {
		const p = pts.current;
		if (!p || mapW <= 0) return null;
		const xs = VOCAB.map((_, i) => p[i * 2]);
		const ys = VOCAB.map((_, i) => p[i * 2 + 1]);
		const fx = axis(xs, PAD, mapW - PAD);
		const fy = axis(ys, MH - PAD, PAD);
		const P = VOCAB.map((_, i) => [fx(xs[i]), fy(ys[i])]);
		const boxes = P.map(([x, y]) => [x - 3, y - 3, x + 3, y + 3]);

		// each topic's island, drawn round its core: the 70% of its words nearest
		// its middle, so a few stray words do not stretch it across the map
		const islands = [];
		TOPIC_NAMES.forEach((name, ti) => {
			const own = P.filter((_, i) => LABELS[i] === ti);
			if (own.length < 3) return;
			const mid = [0, 1].map((d) => [...own.map((q) => q[d])].sort((a, b) => a - b)[Math.floor(own.length / 2)]);
			const dist = own.map((q) => Math.hypot(q[0] - mid[0], q[1] - mid[1]));
			const cut = [...dist].sort((a, b) => a - b)[Math.floor(0.7 * (dist.length - 1))];
			const core = own.filter((_, i) => dist[i] <= cut);
			const h = hull(core);
			if (h.length < 3) return;
			const c = [0, 1].map((d) => core.reduce((a, q) => a + q[d], 0) / core.length);
			const grown = h.map(([x, y]) => {
				const n = Math.hypot(x - c[0], y - c[1]) || 1;
				return [x + ((x - c[0]) / n) * 12, y + ((y - c[1]) / n) * 12];
			});
			islands.push({
				name,
				points: grown.map((q) => q.join(',')).join(' '),
				x: c[0],
				top: Math.min(...grown.map((q) => q[1])),
				bottom: Math.max(...grown.map((q) => q[1]))
			});
		});
		const topicLabels = place(
			// above the island, or below it when there is no room
			islands.map((g) => ({
				text: t(g.name, TOPIC_PT[g.name]).toUpperCase(),
				x: g.x,
				y: g.top,
				wide: 6.4,
				spots: [
					[0, -5, 'middle'],
					[0, g.bottom - g.top + 13, 'middle']
				]
			})),
			boxes
		);

		// your word first, then its closest words, then everything else from your word outwards
		const from = wi >= 0 ? P[wi] : [mapW / 2, MH / 2];
		const order = [wi, ...(near ?? []).map((n) => VOCAB.indexOf(n.word))];
		const rest = VOCAB.map((_, i) => i)
			.filter((i) => !order.includes(i))
			.sort((a, b) => Math.hypot(P[a][0] - from[0], P[a][1] - from[1]) - Math.hypot(P[b][0] - from[0], P[b][1] - from[1]));
		const labels = place(
			[...order, ...rest].filter((i) => i >= 0).map((i) => ({ i, text: VOCAB[i], x: P[i][0], y: P[i][1] })),
			boxes
		);
		return { P, islands, topicLabels, labels };
	});

	// --- the dimensions chart, at real pixel size
	let curveW = $state(0);
	const CH = 170,
		L = 34,
		T = 10,
		B = CH - 30;
	const cx = (i) => L + (i / (DIMS.length - 1)) * (curveW - 8 - L);
	const cy = (v) => B - v * (B - T);
	const line = (key) => (points ? points.map((p, i) => `${cx(i)},${cy(p[key])}`).join(' ') : '');
	const at = eased(() => (s ? DIMS.indexOf(s.k) : 0), () => pace);
	function read(key) {
		const k = at.current;
		const lo = Math.max(0, Math.min(points.length - 2, Math.floor(k)));
		return points[lo][key] + (points[lo + 1][key] - points[lo][key]) * (k - lo);
	}

	const kwMost = $derived(results ? Math.max(...results.map((r) => r.keyword), 1e-9) : 1);
	const right = $derived(QUESTIONS[question].right);
</script>

{#snippet meter(label, value, shown, outline, strong)}
	<div class="grid grid-cols-[6.5rem_1fr_3rem] items-center gap-2.5 text-sm">
		<div class="truncate {strong ? 'font-semibold' : 'text-muted-foreground'}">{label}</div>
		<div class="relative h-4 rounded-sm bg-muted/60">
			<div class="absolute inset-y-0 left-0 rounded-sm bg-foreground/80 transition-[width] duration-500 ease-out" style="width: {Math.max(0, value) * 100}%"></div>
			{#if outline !== undefined}
				<div class="absolute inset-y-0 left-0 rounded-sm border border-muted-foreground transition-[width] duration-500 ease-out" style="width: {outline * 100}%"></div>
			{/if}
		</div>
		<div class="text-right text-xs text-muted-foreground tabular-nums">{shown}</div>
	</div>
{/snippet}

<div class="overflow-hidden rounded-lg border">
	<div class="lg:grid lg:grid-cols-[1fr_1.7fr]">
		<div class="border-b px-4 py-3.5 lg:border-r">
			<h3 class="text-xs font-medium">{t('One word, as numbers', 'Uma palavra, em números')}</h3>
			<div class="mt-2.5 flex flex-wrap gap-1">
				{#each PICKS as w (w)}
					<button
						type="button"
						onclick={() => (word = w)}
						class="rounded-md border px-2 py-0.5 text-xs transition-colors hover:border-foreground/40 {word === w ? 'border-foreground bg-foreground text-background' : ''}"
						>{w}</button
					>
				{/each}
			</div>
			{#if s}
				<div class="mt-3.5 text-xs text-muted-foreground">
					{t(`The ${s.k} ${s.k === 1 ? 'number' : 'numbers'} for "${word}":`, s.k === 1 ? `O número de "${word}":` : `Os ${s.k} números de "${word}":`)}
				</div>
				<div class="mt-1.5 flex gap-0.5" role="img" aria-label={t("The word's numbers, brighter for larger values.", 'Os números da palavra, mais claros para valores maiores.')}>
					{#each vec as v, j (j)}
						<div
							title={v.toFixed(2)}
							class="h-6 flex-1 rounded-sm {v >= 0 ? 'bg-foreground' : 'bg-muted-foreground'}"
							style="opacity: {0.15 + Math.min(1, Math.abs(v) * 1.6) * 0.85}"
						></div>
					{/each}
				</div>
				<div class="mt-1 text-xs text-muted-foreground">{t('White: above zero. Grey: below. Brighter: further from zero.', 'Branco: acima de zero. Cinza: abaixo. Mais claro: mais longe de zero.')}</div>

				<h4 class="mt-4 text-xs font-medium">{t('Closest words', 'Palavras mais próximas')}</h4>
				<div class="mt-2 space-y-2">
					{#each near as n (n.word)}
						{@render meter(n.word, n.sim, n.sim.toFixed(2), undefined, false)}
					{/each}
				</div>
				<div class="mt-2 text-xs text-muted-foreground">
					{t('Bars: how alike the numbers point (cosine similarity, 1 is the same direction).', 'Barras: o quanto os números apontam para o mesmo lado (similaridade de cosseno, 1 é a mesma direção).')}
				</div>
			{/if}
		</div>

		<div class="border-b px-4 py-3.5">
			<div class="flex items-start justify-between gap-3">
				<div>
					<h3 class="text-xs font-medium">{t(`A map of all ${VOCAB.length} words`, `Um mapa das ${VOCAB.length} palavras`)}</h3>
					<p class="mt-1 text-xs text-muted-foreground">
						{t(
							`Their ${s ? s.k : ''} numbers flattened to two directions. Words that sit close are used alike; shaded islands are the five topics. Click a word, or point at a dot.`,
							`Os ${s ? s.k : ''} números delas achatados em duas direções. Palavras que ficam perto são usadas do mesmo jeito; as ilhas sombreadas são os cinco temas. Clique numa palavra, ou aponte para um ponto.`
						)}
					</p>
				</div>
				<PlayButton {play} />
			</div>
			<div class="relative mt-1" bind:clientWidth={mapW}>
				{#if s && s.k === 1}
					<div class="absolute inset-x-6 top-24 z-10 rounded-md bg-muted/90 px-3 py-2 text-center text-sm">
						{t(
							'With one number per word, every word scales to +1 or −1, so they all sit on two spots. Add dimensions to pull them apart.',
							'Com um número por palavra, toda palavra vira +1 ou −1, então todas ficam em dois pontos. Acrescente dimensões para separá-las.'
						)}
					</div>
				{/if}
				{#if layout}
					{@const P = layout.P}
					<svg width={mapW} height={MH} viewBox="0 0 {mapW} {MH}" class="block" role="img" aria-label={t('A map of the words, grouped by topic, with words used alike close together.', 'Um mapa das palavras, agrupadas por tema, com palavras usadas do mesmo jeito perto umas das outras.')}>
						{#each layout.islands as g (g.name)}
							<polygon points={g.points} class="fill-foreground/[0.045] stroke-foreground/15" stroke-width="1" stroke-linejoin="round" />
						{/each}
						{#each layout.topicLabels as t (t.text)}
							<text x={t.x} y={t.y} font-size="9.5" text-anchor="middle" letter-spacing="0.5" class="fill-muted-foreground font-semibold">{t.text}</text>
						{/each}
						{#if wi >= 0}
							{#each near as n (n.word)}
								{@const j = VOCAB.indexOf(n.word)}
								<line x1={P[wi][0]} y1={P[wi][1]} x2={P[j][0]} y2={P[j][1]} class="stroke-foreground/35" stroke-width="1" />
							{/each}
						{/if}
						{#each VOCAB as w, i (w)}
							{@const on = w === word}
							{@const close = nearSet.has(w)}
							<circle
								cx={P[i][0]}
								cy={P[i][1]}
								r={on ? 4.5 : 2.5}
								role="button"
								tabindex="-1"
								onclick={() => (word = w)}
								onkeydown={() => {}}
								class="cursor-pointer {on || close ? 'fill-foreground' : 'fill-muted-foreground/60'}"
							><title>{w}</title></circle>
						{/each}
						{#each layout.labels as l (l.i)}
							{@const on = l.i === wi}
							{@const close = nearSet.has(l.text)}
							<text
								x={l.x}
								y={l.y}
								text-anchor={l.anchor}
								font-size="10"
								role="button"
								tabindex="-1"
								onclick={() => (word = l.text)}
								onkeydown={() => {}}
								class="cursor-pointer {on ? 'fill-foreground font-semibold' : close ? 'fill-foreground' : 'fill-muted-foreground/75'}">{l.text}</text
							>
						{/each}
					</svg>
				{/if}
			</div>
		</div>
	</div>

	<div class="lg:grid lg:grid-cols-2">
		<div class="border-b px-4 py-3.5 lg:border-r lg:border-b-0">
			<h3 class="text-xs font-medium">{t('Search six notices, two ways', 'Busque em seis avisos, de dois jeitos')}</h3>
			<div class="mt-2.5 flex flex-wrap gap-1">
				{#each QUESTIONS as q, i (q.text)}
					<button
						type="button"
						onclick={() => (question = i)}
						class="rounded-md border px-2 py-0.5 text-xs transition-colors hover:border-foreground/40 {question === i ? 'border-foreground bg-foreground text-background' : ''}"
						>{q.text}</button
					>
				{/each}
			</div>
			{#if results}
				<div class="mt-3 space-y-2">
					{#each results as r (r.i)}
						<div>
							<div class="truncate text-xs {r.i === right ? 'font-semibold text-foreground' : 'text-muted-foreground'}">{r.text}{r.i === right ? ' ✓' : ''}</div>
							<div class="relative mt-0.5 h-3 rounded-sm bg-muted/60">
								<div class="absolute inset-y-0 left-0 rounded-sm bg-foreground/80 transition-[width] duration-500 ease-out" style="width: {Math.max(0, r.meaning) * 100}%"></div>
								<div class="absolute inset-y-0 left-0 rounded-sm border border-muted-foreground transition-[width] duration-500 ease-out" style="width: {(r.keyword / kwMost) * 100}%"></div>
							</div>
						</div>
					{/each}
				</div>
				<div class="mt-2 text-xs text-muted-foreground">
					{t(
						'Solid: match by meaning. Outline: match by shared words (keyword search). An empty outline means no words in common.',
						'Cheio: combina pelo significado. Contorno: combina por palavras em comum (busca por palavras-chave). Sem contorno quer dizer nenhuma palavra em comum.'
					)}
				</div>
			{/if}
		</div>
		<div class="px-4 py-3.5">
			<h3 class="text-xs font-medium">{t('More numbers per word, until it stops helping', 'Mais números por palavra, até parar de ajudar')}</h3>
			<p class="mt-1 text-xs text-muted-foreground">
				{t(
					"Solid: a word's 3 closest share its topic. Dashed: meaning search puts the right notice first.",
					'Cheia: as 3 mais próximas de uma palavra são do mesmo tema. Tracejada: a busca por significado põe o aviso certo em primeiro.'
				)}
			</p>
			<div class="mt-1" bind:clientWidth={curveW}>
				{#if points && curveW > 0}
					<svg width={curveW} height={CH} viewBox="0 0 {curveW} {CH}" class="block" role="img" aria-label={t('Both scores rise quickly with the first few dimensions and level off.', 'As duas medidas sobem rápido nas primeiras dimensões e depois se estabilizam.')}>
						<g class="stroke-border" stroke-width="1">
							<line x1={L} y1={cy(0)} x2={curveW - 8} y2={cy(0)} />
							<line x1={L} y1={cy(0.5)} x2={curveW - 8} y2={cy(0.5)} />
							<line x1={L} y1={cy(1)} x2={curveW - 8} y2={cy(1)} />
						</g>
						<g class="fill-muted-foreground" font-size="10">
							<text x={L - 5} y={cy(1) + 3} text-anchor="end">100%</text>
							<text x={L - 5} y={cy(0.5) + 3} text-anchor="end">50%</text>
							<text x={L - 5} y={cy(0) + 3} text-anchor="end">0%</text>
							{#each DIMS as d, i (d)}
								<text x={cx(i)} y={B + 13} text-anchor="middle">{d}</text>
							{/each}
							<text x={(L + curveW - 8) / 2} y={CH - 3} text-anchor="middle">{t('numbers per word', 'números por palavra')}</text>
						</g>
						<polyline points={line('topics')} fill="none" class="stroke-foreground" stroke-width="2" />
						<polyline points={line('search')} fill="none" class="stroke-muted-foreground" stroke-width="2" stroke-dasharray="5 4" />
						<circle cx={cx(at.current)} cy={cy(read('topics'))} r="5" fill="none" class="stroke-foreground" stroke-width="2" />
						<circle cx={cx(at.current)} cy={cy(read('search'))} r="5" fill="none" class="stroke-foreground" stroke-width="2" />
					</svg>
				{/if}
			</div>
			{#if points && s}
				{@const here = points[DIMS.indexOf(s.k)]}
				<div class="text-xs text-muted-foreground">
					{t(
						`At ${s.k}: ${percent(here.topics)} of neighbours share a topic, and ${Math.round(here.search * QUESTIONS.length)} of ${QUESTIONS.length} searches find the right notice.`,
						`Com ${s.k}: ${percent(here.topics)} das vizinhas são do mesmo tema, e ${Math.round(here.search * QUESTIONS.length)} de ${QUESTIONS.length} buscas acham o aviso certo.`
					)}
				</div>
			{/if}
		</div>
	</div>
</div>
