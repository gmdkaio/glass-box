<script>
	import { scale } from 'svelte/transition';
	import { eased } from '$lib/motion.svelte.js';
	import PlayButton from '$lib/components/PlayButton.svelte';
	import { t, local } from '$lib/i18n.svelte.js';

	const still = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

	// pieces: the current text as tokens. curve: its token count after 0, 1, ...
	// merges. langs: the same sentence in each language, with its own curve.
	// merges: how many merges are in use. learned: how many there are.
	// pace: how long each change eases, shorter while a sweep plays.
	// play: the sweep's button, shown in the merges chart's header.
	let { pieces, curve, langs, merges, learned, play, pace = 450 } = $props();

	const line = eased(() => (curve ? Array.from(curve) : null), () => pace);
	const at = eased(() => merges, () => pace);

	const x = (k) => 30 + (k / Math.max(learned, 1)) * 260;
	const top = $derived(curve ? Math.max(curve[0], 1) : 1);
	const y = (v) => 140 - (v / top) * 130;
	// the ring rides the curve, read between whole merges while it moves
	const nowTokens = $derived.by(() => {
		const c = line.current;
		if (!c) return 0;
		const k = Math.min(Math.max(at.current, 0), c.length - 1);
		const lo = Math.floor(k);
		return lo + 1 < c.length ? c[lo] + (c[lo + 1] - c[lo]) * (k - lo) : c[lo];
	});

	const bills = $derived(langs ? langs.map((l) => ({ name: l.name, pt: l.pt, tokens: l.curve[Math.min(merges, l.curve.length - 1)] })) : []);
	const english = $derived(bills.length ? bills[0].tokens : 1);
	const most = $derived(bills.length ? Math.max(...bills.map((b) => b.tokens)) : 1);

	const tip = (p) => (p.part ? t(`byte ${p.part.byte} of ${p.part.of} of “${p.part.char}”`, `byte ${p.part.byte} de ${p.part.of} de “${p.part.char}”`) : `token ${p.id}`);
</script>

<div class="overflow-hidden rounded-lg border lg:grid lg:min-h-80 lg:grid-cols-[1.3fr_1fr_1fr]">
	<div class="border-b px-4 py-3.5 lg:border-r lg:border-b-0">
		<h3 class="text-xs font-medium">{t('What the model reads', 'O que o modelo lê')}</h3>
		{#if pieces}
			<div class="mt-3 flex flex-wrap gap-1 font-mono text-sm" aria-label={t('The text cut into tokens', 'O texto cortado em tokens')}>
				{#each pieces as p (`${p.start}:${p.size}`)}
					<span
						in:scale={{ start: 0.6, duration: still ? 0 : 220 }}
						title={tip(p)}
						class="rounded border px-1 py-0.5 whitespace-pre {p.part
							? 'border-dashed text-muted-foreground'
							: p.i % 2
								? 'bg-muted'
								: 'bg-sidebar'}">{p.text}</span
					>
				{/each}
			</div>
			<h4 class="mt-4 text-xs font-medium">{t('What it actually gets', 'O que ele recebe de fato')}</h4>
			<p class="mt-1.5 font-mono text-xs leading-relaxed break-words text-muted-foreground">
				{Array.from(pieces, (p) => p.id).join(' ')}
			</p>
			<p class="mt-3 text-xs text-muted-foreground">
				{t(
					'· is a space. A dashed piece is part of a letter that takes more than one byte; point at it to see which.',
					'· é um espaço. Um pedaço tracejado é parte de uma letra que ocupa mais de um byte; aponte para ele para ver qual.'
				)}
			</p>
		{/if}
	</div>

	<div class="border-b px-4 py-3.5 lg:border-r lg:border-b-0">
		<div class="flex items-start justify-between gap-2">
			<h3 class="text-xs font-medium">{t('More merges, fewer pieces', 'Mais junções, menos pedaços')}</h3>
			<PlayButton {play} />
		</div>
		<p class="mt-3 text-xs text-muted-foreground">{t('Tokens in your text, by how many merges the tokenizer has learned.', 'Tokens no seu texto, pelo número de junções que o tokenizador aprendeu.')}</p>
		<div role="img" aria-label={t('The token count falls as the tokenizer learns more merges.', 'O número de tokens cai conforme o tokenizador aprende mais junções.')}>
			<svg viewBox="0 0 300 175" class="w-full">
				<g class="stroke-border" stroke-width="1">
					<line x1="30" y1="140" x2="290" y2="140" />
					<line x1="30" y1="10" x2="290" y2="10" />
					<line x1={x(learned / 2)} y1="10" x2={x(learned / 2)} y2="140" />
				</g>
				<g class="fill-muted-foreground" font-size="10">
					<text x={x(0)} y="156" text-anchor="middle">0</text>
					<text x={x(learned / 2)} y="156" text-anchor="middle">{Math.round(learned / 2)}</text>
					<text x={x(learned)} y="156" text-anchor="middle">{learned}</text>
					<text x="26" y="14" text-anchor="end">{top}</text>
					<text x="26" y="143" text-anchor="end">0</text>
					<text x="160" y="171" text-anchor="middle">{t('merges learned', 'junções aprendidas')}</text>
				</g>
				{#if curve}
					<polyline points={Array.from(line.current ?? curve, (v, k) => `${x(k)},${y(v)}`).join(' ')} fill="none" class="stroke-foreground" stroke-width="2" />
					<circle cx={x(at.current)} cy={y(nowTokens)} r="5" fill="none" class="stroke-foreground" stroke-width="2" />
				{/if}
			</svg>
		</div>
		<div class="text-xs text-muted-foreground">{t('With no merges, every byte is a token. The ring marks your setting.', 'Sem junções, cada byte é um token. O anel marca a sua escolha.')}</div>
	</div>

	<div class="px-4 py-3.5">
		<h3 class="text-xs font-medium">{t('Same sentence, different bill', 'A mesma frase, contas diferentes')}</h3>
		<p class="mt-3 text-xs text-muted-foreground">{t('One weather forecast in seven languages, with the merges learned from English.', 'Uma previsão do tempo em sete línguas, com as junções aprendidas do inglês.')}</p>
		<div class="mt-3 space-y-2">
			{#each bills as b (b.name)}
				<div class="grid grid-cols-[5.5rem_1fr_auto] items-center gap-2 text-xs">
					<span class={b.name === 'English' ? 'font-medium' : 'text-muted-foreground'}>{local(b, 'name')}</span>
					<div class="h-2 overflow-hidden rounded-full bg-muted">
						<div class="h-full transition-[width] {b.name === 'English' ? 'bg-foreground' : 'bg-muted-foreground'}" style="width: {(b.tokens / most) * 100}%"></div>
					</div>
					<span class="text-right whitespace-nowrap text-muted-foreground tabular-nums">{b.tokens} · {(b.tokens / english).toFixed(1)}×</span>
				</div>
			{/each}
		</div>
		<div class="mt-3 text-xs text-muted-foreground">{t('Tokens, and how many times the English count.', 'Tokens, e quantas vezes a contagem do inglês.')}</div>
	</div>
</div>
