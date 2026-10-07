<script>
	import { WORDS, WANTED, PROMPTS, GOAL, GOAL_PT, percent } from '$lib/sampling-sim.js';
	import { t, local, locale } from '$lib/i18n.svelte.js';

	// prompt: the question being asked. odds: the odds for it at the current variety.
	// picks: recent single draws, newest first. counts: a big run, or null.
	// compare: the chance of the wanted word for each question style, at the current variety.
	let { prompt, promptIndex, odds, picks, counts, compare } = $props();

	const total = $derived(counts ? counts.reduce((a, b) => a + b, 0) : 0);
</script>

<div class="overflow-hidden rounded-lg border lg:grid lg:min-h-80 lg:grid-cols-[1.3fr_1fr_1fr]">
	<div class="border-b px-4 py-3.5 lg:border-r lg:border-b-0">
		<h3 class="text-xs font-medium">{t("The model's odds for the first word of its answer", 'As chances do modelo para a primeira palavra da resposta')}</h3>
		<div class="mt-3 rounded-md border px-3 py-2 text-center text-sm">{local(prompt, 'text')}</div>
		<div class="mt-1.5 text-center text-xs text-muted-foreground">{t('You want', 'Você quer')}: {t(GOAL, GOAL_PT)}</div>
		{#if odds}
			<div class="mt-3.5 space-y-2.5">
				{#each WORDS as word, i (word)}
					<div class="grid grid-cols-[5.5rem_1fr_3rem] items-center gap-2.5 text-sm">
						<div class={i === WANTED ? 'font-semibold' : 'text-muted-foreground'}>
							{word}{i === WANTED ? ' ✓' : ''}
						</div>
						<div class="h-4 rounded-sm bg-muted/60">
							<div
								class="h-full rounded-sm bg-foreground/80 transition-[width] duration-500 ease-out"
								style="width: {odds[i] * 100}%"
							></div>
						</div>
						<div class="text-xs text-muted-foreground tabular-nums">{percent(odds[i])}</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<div class="border-b px-4 py-3.5 lg:border-r lg:border-b-0">
		<h3 class="text-xs font-medium">{t('What it picked', 'O que ele escolheu')}</h3>
		{#if picks.length === 0 && !counts}
			<p class="mt-3 text-sm text-muted-foreground">
				{t(
					'Press Draw one to see a single answer, or Run 1,000 times to see how often each one comes up.',
					'Aperte Sortear uma para ver uma única resposta, ou Rodar 1,000 vezes para ver com que frequência cada uma aparece.'
				)}
			</p>
		{/if}
		{#if picks.length > 0}
			<div class="mt-3 flex flex-wrap gap-1.5">
				{#each picks as p, i (i)}
					<span
						class="rounded-md border px-2 py-0.5 text-xs {i === 0 ? 'border-foreground' : 'text-muted-foreground'} {p ===
						WANTED
							? ''
							: 'border-dashed'}"
					>
						{WORDS[p]}
					</span>
				{/each}
			</div>
			<div class="mt-1.5 text-xs text-muted-foreground">{t('Dashed: not what you wanted.', 'Tracejado: não é o que você queria.')}</div>
		{/if}
		{#if counts}
			<div class="mt-4 text-xs text-muted-foreground">{total.toLocaleString(locale())} {t('draws', 'sorteios')}</div>
			<div class="mt-2 space-y-2">
				{#each WORDS as word, i (word)}
					<div class="grid grid-cols-[5.5rem_1fr_3rem] items-center gap-2.5 text-sm">
						<div class={i === WANTED ? 'font-semibold' : 'text-muted-foreground'}>{word}</div>
						<div class="relative h-4 rounded-sm bg-muted/60">
							<div
								class="absolute inset-y-0 left-0 rounded-sm bg-foreground/80 transition-[width] duration-700 ease-out"
								style="width: {(counts[i] / total) * 100}%"
							></div>
							<div
								class="absolute inset-y-0 left-0 rounded-sm border border-muted-foreground"
								style="width: {odds[i] * 100}%"
							></div>
						</div>
						<div class="text-xs text-muted-foreground tabular-nums">{percent(counts[i] / total)}</div>
					</div>
				{/each}
			</div>
			<div class="mt-2 text-xs text-muted-foreground">{t('Outline: the odds. Solid: what came up.', 'Contorno: as chances. Sólido: o que saiu.')}</div>
		{/if}
	</div>

	<div class="px-4 py-3.5">
		<h3 class="text-xs font-medium">{t('How your wording changes the odds', 'Como o seu jeito de perguntar muda as chances')}</h3>
		<p class="mt-3 text-xs text-muted-foreground">
			{t(`Chance of getting ${GOAL}, for three ways of asking.`, `Chance de receber ${GOAL_PT}, em três jeitos de perguntar.`)}
		</p>
		{#if compare}
			<div class="mt-3 space-y-3">
				{#each PROMPTS as p, i (p.label)}
					<div class="text-sm">
						<div class="mb-1 flex justify-between {i === promptIndex ? 'font-semibold' : 'text-muted-foreground'}">
							<span>{local(p, 'label')}</span>
							<span class="tabular-nums">{percent(compare[i])}</span>
						</div>
						<div class="h-4 rounded-sm bg-muted/60">
							<div
								class="h-full rounded-sm transition-[width] duration-500 ease-out {i === promptIndex
									? 'bg-foreground/80'
									: 'bg-muted-foreground/50'}"
								style="width: {compare[i] * 100}%"
							></div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
		<p class="mt-3 text-xs text-muted-foreground">{local(prompt, 'effect')}</p>
	</div>
</div>
