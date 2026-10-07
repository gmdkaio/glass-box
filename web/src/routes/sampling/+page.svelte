<script>
	import { onMount } from 'svelte';
	import ModulePage from '$lib/components/ModulePage.svelte';
	import SamplingStage from '$lib/components/SamplingStage.svelte';
	import RegenerateExample from '$lib/components/RegenerateExample.svelte';
	import OddsCurve from '$lib/components/OddsCurve.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Slider } from '$lib/components/ui/slider/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { getEngine } from '$lib/engine-loader.js';
	import {
		WORDS,
		WANTED,
		SILLY,
		GOAL,
		GOAL_PT,
		PROMPTS,
		T_MAX,
		DRAWS,
		curve,
		pickWord,
		percent
	} from '$lib/sampling-sim.js';
	import { where } from '$lib/modules.js';
	import * as en from '$lib/sampling-copy.js';
	import * as pt from '$lib/sampling-copy.pt.js';
	import { t, local, locale } from '$lib/i18n.svelte.js';

	let gb = $state.raw(null);
	let promptIndex = $state(1);
	let variety = $state(1);
	let picks = $state.raw([]);
	let counts = $state.raw(null);
	let seed = 0;

	const prompt = $derived(PROMPTS[promptIndex]);
	const odds = $derived(gb ? gb.softmax(prompt.scores, variety) : null);
	// the scores after dividing by the variety, the step before softmax
	const scaled = $derived(gb ? gb.scaleScores(prompt.scores, variety) : null);
	const compare = $derived(gb ? PROMPTS.map((p) => gb.softmax(p.scores, variety)[WANTED]) : null);
	const points = $derived(gb ? curve(gb, prompt.scores) : null);
	const here = where('sampling');
	const copy = $derived(t(en, pt));
	const goal = $derived(t(GOAL, GOAL_PT));

	onMount(() => {
		getEngine().then((engine) => (gb = engine));
	});

	// picks belong to the odds they were drawn from, so a new question or setting clears them
	$effect(() => {
		promptIndex;
		variety;
		picks = [];
		counts = null;
	});

	function drawOne() {
		seed += 1;
		picks = [pickWord(gb, odds, seed), ...picks].slice(0, 12);
	}

	function runMany() {
		seed += 1;
		counts = gb.sample(odds, DRAWS, seed + 1000);
	}

	function clear() {
		picks = [];
		counts = null;
	}
</script>

<svelte:head><title>Why answers vary · Glass Box</title></svelte:head>

<ModulePage
	track={local(here.track, 'title')}
	n={here.n}
	total={here.total}
	tag={local(here.module, 'tag')}
	title={t('Why does the same question give different answers?', 'Por que a mesma pergunta dá respostas diferentes?')}
	lead={t(
		'For every possible next word, a language model works out how well that word fits, turns that into odds, and picks one like weighted dice. Change how you ask, and watch the odds move.',
		'Para cada próxima palavra possível, um modelo de linguagem calcula o quanto ela se encaixa, transforma isso em chances e escolhe uma, como num dado viciado. Mude o jeito de perguntar e veja as chances se moverem.'
	)}
	whyLead={copy.whyLead}
>
	{#snippet presets()}
		<p class="mb-2 text-xs text-muted-foreground">{t('Three ways of asking for the same thing,', 'Três jeitos de pedir a mesma coisa,')} {goal}:</p>
		<div class="mb-3.5 grid gap-2.5 md:grid-cols-3">
			{#each PROMPTS as p, i (p.label)}
				<button
					type="button"
					onclick={() => (promptIndex = i)}
					class="rounded-lg border bg-sidebar px-3.5 py-3 text-left text-sm text-muted-foreground transition-colors hover:border-foreground/40 {promptIndex ===
					i
						? 'border-foreground bg-muted'
						: ''}"
				>
					<b class="block font-medium text-foreground">{local(p, 'label')}</b>
					<span class="mt-0.5 block text-xs">"{local(p, 'text')}"</span>
				</button>
			{/each}
		</div>
	{/snippet}

	{#snippet stage()}
		<SamplingStage {prompt} {promptIndex} {odds} {picks} {counts} {compare} />
	{/snippet}

	{#snippet legend()}
		<div class="flex flex-wrap gap-x-5 gap-y-1">
			<span>✓ = {t('the answer you wanted', 'a resposta que você queria')}</span>
			<span><span class="mr-1.5 inline-block h-2 w-4 rounded-sm bg-foreground/80"></span>{t('Odds now, or what came up', 'Chances agora, ou o que saiu')}</span>
			<span><span class="mr-1.5 inline-block h-2 w-4 rounded-sm border border-muted-foreground"></span>{t('The odds, for comparison', 'As chances, para comparar')}</span>
		</div>
	{/snippet}

	{#snippet controls()}
		<div class="flex flex-wrap items-center gap-4">
			<div class="min-w-64 flex-1">
				<div class="mb-2 flex justify-between text-xs text-muted-foreground">
					<span>{t('Always the top pick', 'Sempre a primeira opção')}</span>
					<span>{t('Variety', 'Variedade')}: {variety.toFixed(1)}</span>
					<span>{t('More surprising', 'Mais surpreendente')}</span>
				</div>
				<Slider type="single" bind:value={variety} min={0} max={T_MAX} step={0.1} />
				<div class="relative mt-2 h-4 text-xs text-muted-foreground">
					{#each [0, 1, 2, 3] as tick (tick)}
						<span class="absolute -translate-x-1/2" style="left: calc(8px + (100% - 16px) * {tick / T_MAX})">{tick}</span>
					{/each}
				</div>
				<p class="mt-1 text-xs text-muted-foreground">{copy.varietyNote}</p>
			</div>
			<Button onclick={drawOne} disabled={!gb}>{t('Draw one', 'Sortear uma')}</Button>
			<Button onclick={runMany} disabled={!gb}>{t('Run', 'Rodar')} {DRAWS.toLocaleString(locale())} {t('times', 'vezes')}</Button>
			<Button variant="outline" onclick={clear} disabled={!gb || (picks.length === 0 && !counts)}>{t('Clear', 'Limpar')}</Button>
		</div>
	{/snippet}

	{#snippet say()}
		{#if odds}
			<p class="leading-relaxed">
				<b class="font-medium"
					>{t(
						`With this question the model gives you ${GOAL} about ${percent(odds[WANTED])} of the time.`,
						`Com esta pergunta o modelo dá ${GOAL_PT} em cerca de ${percent(odds[WANTED])} das vezes.`
					)}</b
				>
				{copy.say(variety, odds[WANTED])}
			</p>
			<p class="mt-1 text-sm text-muted-foreground">{copy.trap(variety)}</p>
		{:else}
			<p class="text-muted-foreground">{t('Loading the engine…', 'Carregando o motor…')}</p>
		{/if}
	{/snippet}

	{#snippet cards()}
		<div class="mb-4 grid gap-3.5 md:grid-cols-3">
			<div class="rounded-lg border px-4 py-3.5">
				<h3 class="text-xs font-medium">{t('Chance of the answer you wanted', 'Chance da resposta que você queria')}</h3>
				<div class="mt-1 text-3xl font-semibold tracking-tight">{odds ? percent(odds[WANTED]) : '–'}</div>
				<p class="text-xs text-muted-foreground">{t(`How often ${WORDS[WANTED]} comes up, over many tries.`, `Com que frequência ${WORDS[WANTED]} aparece, em muitas tentativas.`)}</p>
				<div class="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
					<div class="h-full bg-foreground transition-[width]" style="width: {odds ? odds[WANTED] * 100 : 0}%"></div>
				</div>
			</div>
			<div class="rounded-lg border px-4 py-3.5">
				<h3 class="text-xs font-medium">{t('Chance of a different answer', 'Chance de outra resposta')}</h3>
				<div class="mt-1 text-3xl font-semibold tracking-tight">{odds ? percent(1 - odds[WANTED]) : '–'}</div>
				<p class="text-xs text-muted-foreground">{t('Any other word, including near misses.', 'Qualquer outra palavra, inclusive as quase certas.')}</p>
				<div class="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
					<div class="h-full bg-foreground transition-[width]" style="width: {odds ? (1 - odds[WANTED]) * 100 : 0}%"></div>
				</div>
			</div>
			<div class="rounded-lg border px-4 py-3.5">
				<h3 class="text-xs font-medium">{t('Chance of nonsense', 'Chance de absurdo')}</h3>
				<div class="mt-1 text-3xl font-semibold tracking-tight">{odds ? percent(odds[SILLY]) : '–'}</div>
				<p class="text-xs text-muted-foreground">{t(`The chance of picking ${WORDS[SILLY]}.`, `A chance de escolher ${WORDS[SILLY]}.`)}</p>
				<div class="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
					<div class="h-full bg-foreground transition-[width]" style="width: {odds ? odds[SILLY] * 100 : 0}%"></div>
				</div>
			</div>
		</div>
	{/snippet}

	{#snippet example()}
		{#if gb && odds}
			<div class="mb-4"><RegenerateExample {gb} {prompt} {odds} /></div>
		{/if}
	{/snippet}

	{#snippet explain()}
		<div class="mb-4 grid gap-3.5 md:grid-cols-3">
			<div class="rounded-lg border px-4 py-3.5">
				<h3 class="mb-2 text-xs font-medium">{t('What shapes the odds', 'O que molda as chances')}</h3>
				<ol class="space-y-2.5 text-sm leading-relaxed">
					{#each copy.shapes as s, i (s.title)}
						<li class="flex gap-2.5">
							<span class="text-muted-foreground">{i + 1}</span>
							<span>
								<b class="font-medium">{s.title}</b>
								<span class="text-xs text-muted-foreground"> · {s.who}</span>
								<span class="block text-muted-foreground">{s.text}</span>
							</span>
						</li>
					{/each}
				</ol>
			</div>
			<div class="rounded-lg border px-4 py-3.5">
				<h3 class="mb-1.5 text-xs font-medium">{t('What the variety dial does', 'O que o controle de variedade faz')}</h3>
				<OddsCurve {points} {variety} {odds} />
			</div>
			<div class="rounded-lg border px-4 py-3.5">
				<h3 class="mb-1.5 text-xs font-medium">{t('The trap', 'A armadilha')}</h3>
				<p class="text-sm leading-relaxed text-muted-foreground">
					{copy.trapCard}
				</p>
			</div>
		</div>

		<Tabs.Root value="simple">
			<Tabs.List>
				<Tabs.Trigger value="simple">{t('Simple', 'Simples')}</Tabs.Trigger>
				<Tabs.Trigger value="hood">{t('Under the hood', 'Por dentro')}</Tabs.Trigger>
			</Tabs.List>
			<Tabs.Content value="simple">
				<p class="max-w-3xl text-sm text-muted-foreground">
					{t(
						'Open Under the hood to see the formula with the numbers from your current setting.',
						'Abra Por dentro para ver a fórmula com os números do seu ajuste atual.'
					)}
				</p>
			</Tabs.Content>
			<Tabs.Content value="hood">
				<div class="rounded-lg border px-4 py-3.5 text-sm">
					<div class="text-muted-foreground">
						{t(
							'odds = e^(score / T), divided by the sum of that over all the words. T is the variety setting, called temperature.',
							'chances = e^(nota / T), dividido pela soma disso em todas as palavras. T é o ajuste de variedade, chamado temperatura.'
						)}
					</div>
					{#if odds}
						<div class="mt-3 grid grid-cols-[7rem_1fr_1fr_1fr] gap-y-1.5 leading-6">
							<span class="text-xs text-muted-foreground">{t('word', 'palavra')}</span>
							<span class="text-xs text-muted-foreground">{t('score', 'nota')}</span>
							<span class="text-xs text-muted-foreground">{t('score', 'nota')} / T</span>
							<span class="text-xs text-muted-foreground">{t('odds', 'chances')}</span>
							{#each WORDS as word, i (word)}
								<span>{word}</span>
								<span class="tabular-nums">{prompt.scores[i].toFixed(1)}</span>
								<span class="tabular-nums">{variety === 0 ? '–' : scaled[i].toFixed(2)}</span>
								<span class="tabular-nums">{percent(odds[i])}</span>
							{/each}
						</div>
					{/if}
					<p class="mt-3 text-xs text-muted-foreground">{copy.hoodNote}</p>
				</div>
			</Tabs.Content>
		</Tabs.Root>
	{/snippet}

	{#snippet why()}
		<div class="grid gap-3.5 md:grid-cols-2 xl:grid-cols-4">
			{#each copy.why as item (item.title)}
				<div class="rounded-lg border px-4 py-3.5">
					<h3 class="mb-1.5 text-xs font-medium">{item.title}</h3>
					<p class="text-sm leading-relaxed text-muted-foreground">{item.text}</p>
				</div>
			{/each}
		</div>
		<p class="mt-3 text-xs text-muted-foreground">{copy.whyDraft}</p>
	{/snippet}

	{#snippet next()}
		<div class="grid gap-3.5 md:grid-cols-2">
			{#each copy.next as item (item.title)}
				<div class="rounded-lg border border-dashed px-4 py-3.5">
					<h3 class="mb-1.5 text-xs font-medium">{item.title}</h3>
					<p class="text-sm leading-relaxed text-muted-foreground">{item.text}</p>
				</div>
			{/each}
		</div>
	{/snippet}

	{#snippet foot()}
		{t(
			'Every number on this page comes from a C engine compiled to WebAssembly. The scores are made up for three questions, and a real model scores tens of thousands to a few hundred thousand tokens.',
			'Cada número nesta página vem de um motor em C compilado para WebAssembly. As notas são inventadas para três perguntas, e um modelo de verdade dá notas para dezenas de milhares a algumas centenas de milhares de tokens.'
		)}
	{/snippet}
</ModulePage>
