<script>
	import { onMount } from 'svelte';
	import ModulePage from '$lib/components/ModulePage.svelte';
	import ContextStage from '$lib/components/ContextStage.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Slider } from '$lib/components/ui/slider/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { getEngine } from '$lib/engine-loader.js';
	import { Sweep } from '$lib/motion.svelte.js';
	import {
		SETUPS,
		SCORE,
		MAX_SENTENCES,
		MAX_LOOKALIKES,
		sampleContext,
		averageShares,
		lengthCurve,
		placeCurve,
		percent
	} from '$lib/context-sim.js';
	import { where } from '$lib/modules.js';
	import * as en from '$lib/context-copy.js';
	import * as pt from '$lib/context-copy.pt.js';
	import { t, local } from '$lib/i18n.svelte.js';

	let gb = $state.raw(null);
	let n = $state(SETUPS[1].n);
	let place = $state(SETUPS[1].place);
	let lookalikes = $state(SETUPS[1].lookalikes);
	let middle = $state(true);
	let seed = $state(1);

	// every look-alike needs a sentence of its own besides the answer; the slider shows
	// what fits and keeps your setting for when the text grows again
	const mostAlike = $derived(Math.min(MAX_LOOKALIKES, n - 1));
	const alike = $derived(Math.min(lookalikes, mostAlike));
	const keyAt = $derived(gb ? gb.contextPlace(n, place) : 0);
	const sentences = $derived(gb ? sampleContext(gb, n, keyAt, alike, middle, seed) : null);
	const shares = $derived(gb ? averageShares(gb, n, keyAt, alike, middle) : null);
	const lengths = $derived(gb ? lengthCurve(gb, place, alike, middle) : null);
	const places = $derived(gb ? placeCurve(gb, n, alike, middle) : null);
	const here = where('context');
	const copy = $derived(t(en, pt));
	const sweep = new Sweep();
	// lengths for the sweep, closer together where the share changes fastest
	const SWEEP_LENGTHS = [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50, 60, 80, 100, 120, 150, 175, 200];

	onMount(() => {
		getEngine().then((engine) => (gb = engine));
		return () => sweep.stop();
	});

	function setup(s) {
		sweep.stop();
		n = s.n;
		place = s.place;
		lookalikes = s.lookalikes;
	}

	const placeName = (v) =>
		v <= 0.1
			? t('at the start', 'no começo')
			: v >= 0.9
				? t('at the end', 'no fim')
				: v > 0.3 && v < 0.7
					? t('in the middle', 'no meio')
					: v < 0.5
						? t('near the start', 'perto do começo')
						: t('near the end', 'perto do fim');
</script>

<svelte:head><title>Context · Glass Box</title></svelte:head>

<ModulePage
	track={local(here.track, 'title')}
	n={here.n}
	total={here.total}
	tag={local(here.module, 'tag')}
	title={t('Why can more text make the answer count for less?', 'Por que mais texto pode fazer a resposta contar menos?')}
	lead={t(
		'Before it answers, a model weighs every part of what you gave it against the question, and those weights are shares of one whole. Paste more, and the sentence that holds the answer gets a smaller slice, especially when other sentences look like it or it sits in the middle.',
		'Antes de responder, o modelo pesa cada parte do que você deu em relação à pergunta, e esses pesos são partes de um mesmo todo. Cole mais, e a frase que tem a resposta fica com uma fatia menor, principalmente quando outras frases se parecem com ela ou quando ela está no meio.'
	)}
	whyLead={copy.whyLead}
>
	{#snippet presets()}
		<p class="mb-2 text-xs text-muted-foreground">
			{t("Three ways of giving the model the store's policy along with your question:", 'Três jeitos de passar ao modelo as regras da loja junto com a sua pergunta:')}
		</p>
		<div class="mb-3.5 grid gap-2.5 md:grid-cols-3">
			{#each SETUPS as s (s.label)}
				<button
					type="button"
					onclick={() => setup(s)}
					class="rounded-lg border bg-sidebar px-3.5 py-3 text-left text-sm text-muted-foreground transition-colors hover:border-foreground/40 {n ===
						s.n &&
					place === s.place &&
					lookalikes === s.lookalikes
						? 'border-foreground bg-muted'
						: ''}"
				>
					<b class="block font-medium text-foreground">{local(s, 'label')}</b>
					<span class="mt-0.5 block text-xs">{local(s, 'hint')}, {s.n} {t('sentences', 'frases')}</span>
				</button>
			{/each}
		</div>
	{/snippet}

	{#snippet stage()}
		<ContextStage
			{sentences}
			{lengths}
			{places}
			{n}
			{place}
			play={{ playing: sweep.playing, label: t('Keep pasting', 'Continuar colando'), onclick: () => sweep.toggle(SWEEP_LENGTHS, 240, (v) => (n = v)), disabled: !gb }}
			pace={sweep.playing ? 260 : 450}
		/>
	{/snippet}

	{#snippet legend()}
		<div class="flex flex-wrap gap-x-5 gap-y-1">
			<span><span class="mr-1.5 inline-block h-2 w-4 rounded-sm bg-foreground align-middle"></span>{t('The answer', 'A resposta')} ✓</span>
			<span><span class="mr-1.5 inline-block h-2 w-4 rounded-sm bg-muted-foreground align-middle"></span>{t('Look-alikes', 'Parecidas')}</span>
			<span><span class="mr-1.5 inline-block h-2 w-4 rounded-sm bg-muted-foreground/35 align-middle"></span>{t('Everything else', 'Todo o resto')}</span>
		</div>
	{/snippet}

	{#snippet controls()}
		<div class="grid gap-x-8 gap-y-5 md:grid-cols-2">
			<div>
				<div class="mb-2 flex justify-between text-xs text-muted-foreground">
					<span>{t('Sentences in the context', 'Frases no contexto')}: {n}</span>
					<span>1 {t('to', 'a')} {MAX_SENTENCES}</span>
				</div>
				<Slider type="single" bind:value={n} min={1} max={MAX_SENTENCES} step={1} onValueChange={() => sweep.stop()} />
			</div>
			<div>
				<div class="mb-2 flex justify-between text-xs text-muted-foreground">
					<span>{t('The answer sits', 'A resposta fica')} {placeName(place)}</span>
					<span>{t('start to end', 'do começo ao fim')}</span>
				</div>
				<Slider type="single" bind:value={place} min={0} max={1} step={0.05} onValueChange={() => sweep.stop()} />
			</div>
			<div>
				<div class="mb-2 flex justify-between text-xs text-muted-foreground">
					<span>{t('Look-alike sentences', 'Frases parecidas')}: {alike}</span>
					<span>0 {t('to', 'a')} {mostAlike}</span>
				</div>
				<Slider type="single" bind:value={() => alike, (v) => (lookalikes = v)} min={0} max={Math.max(1, mostAlike)} disabled={mostAlike === 0} step={1} onValueChange={() => sweep.stop()} />
			</div>
			<div>
				<div class="mb-2 text-xs text-muted-foreground">{t('The middle gets less attention', 'O meio recebe menos atenção')}</div>
				<div class="flex flex-wrap gap-1.5">
					<Button size="sm" variant={middle ? 'default' : 'outline'} onclick={() => (middle = true)}>{t('On', 'Ligado')}</Button>
					<Button size="sm" variant={middle ? 'outline' : 'default'} onclick={() => (middle = false)}>{t('Off', 'Desligado')}</Button>
					<span class="w-3"></span>
					<Button size="sm" variant="outline" onclick={() => (seed += 1)} disabled={!gb}>{t('Shuffle the other sentences', 'Embaralhar as outras frases')}</Button>
				</div>
			</div>
		</div>
	{/snippet}

	{#snippet say()}
		{#if shares}
			<p class="leading-relaxed">
				<b class="font-medium">
					{t(
						`With ${n} ${n === 1 ? 'sentence' : 'sentences'} and the answer ${placeName(place)}, the answer gets about ${percent(shares.key)} of the attention.`,
						`Com ${n} ${n === 1 ? 'frase' : 'frases'} e a resposta ${placeName(place)}, a resposta recebe cerca de ${percent(shares.key)} da atenção.`
					)}
				</b>
				{copy.say(shares.key)}
			</p>
			<p class="mt-1 text-sm text-muted-foreground">{copy.trap(alike, middle, place)}</p>
		{:else}
			<p class="text-muted-foreground">{t('Loading the engine…', 'Carregando o motor…')}</p>
		{/if}
	{/snippet}

	{#snippet cards()}
		<div class="mb-4 grid gap-3.5 md:grid-cols-3">
			{#each [{ title: t('Attention on the answer', 'Atenção na resposta'), key: 'key', text: t('The one sentence that says when the store closes on Sundays.', 'A única frase que diz quando a loja fecha aos domingos.') }, { title: t('Attention on look-alikes', 'Atenção nas parecidas'), key: 'lookalike', text: t('Sentences about other days, other shops and other closing times.', 'Frases sobre outros dias, outras lojas e outros horários.') }, { title: t('Attention on everything else', 'Atenção em todo o resto'), key: 'filler', text: t('Returns, gift cards, delivery: each takes a sliver.', 'Devoluções, vales-presente, entrega: cada uma leva uma lasca.') }] as card (card.key)}
				<div class="rounded-lg border px-4 py-3.5">
					<h3 class="text-xs font-medium">{card.title}</h3>
					<div class="mt-1 text-3xl font-semibold tracking-tight">{shares ? percent(shares[card.key]) : '–'}</div>
					<p class="text-xs text-muted-foreground">{card.text}</p>
					<div class="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
						<div class="h-full bg-foreground transition-[width]" style="width: {shares ? shares[card.key] * 100 : 0}%"></div>
					</div>
				</div>
			{/each}
		</div>
	{/snippet}

	{#snippet explain()}
		<div class="mb-4 grid gap-3.5 md:grid-cols-3">
			{#each copy.parts as part (part.title)}
				<div class="rounded-lg border px-4 py-3.5">
					<h3 class="mb-1.5 text-xs font-medium">{part.title}</h3>
					<p class="text-sm leading-relaxed text-muted-foreground">{part.text}</p>
				</div>
			{/each}
		</div>
		<div class="mb-4 rounded-lg border px-4 py-3.5">
			<h3 class="mb-1.5 text-xs font-medium">{t('The trap', 'A armadilha')}</h3>
			<p class="text-sm leading-relaxed text-muted-foreground">{copy.trapCard}</p>
		</div>

		<Tabs.Root value="simple">
			<Tabs.List>
				<Tabs.Trigger value="simple">{t('Simple', 'Simples')}</Tabs.Trigger>
				<Tabs.Trigger value="hood">{t('Under the hood', 'Por dentro')}</Tabs.Trigger>
			</Tabs.List>
			<Tabs.Content value="simple">
				<p class="max-w-3xl text-sm text-muted-foreground">
					{t('Open Under the hood to see how the scores are made and turned into shares.', 'Abra Por dentro para ver como as notas são feitas e viram partes.')}
				</p>
			</Tabs.Content>
			<Tabs.Content value="hood">
				<div class="space-y-2 rounded-lg border px-4 py-3.5 text-sm">
					<div class="text-muted-foreground">{t('Each sentence gets a score for how well it matches the question:', 'Cada frase recebe uma nota pelo quanto combina com a pergunta:')}</div>
					<ul class="list-inside list-disc text-muted-foreground">
						<li>{t('the answer', 'a resposta')}: {SCORE.key}</li>
						<li>{t('a look-alike', 'uma parecida')}: {SCORE.lookalike}</li>
						<li>{t('anything else: random, around 0, give or take', 'qualquer outra: aleatória, perto de 0, mais ou menos')} {SCORE.spread}</li>
						<li>
							{middle
								? t(
										`then every sentence loses up to ${SCORE.dip} for sitting in the middle: ${SCORE.dip} × 4x(1 − x), x from 0 (first) to 1 (last)`,
										`depois cada frase perde até ${SCORE.dip} por estar no meio: ${SCORE.dip} × 4x(1 − x), com x de 0 (primeira) a 1 (última)`
									)
								: t('the middle dip is off, so place does not matter', 'a queda no meio está desligada, então o lugar não importa')}
						</li>
					</ul>
					<div class="pt-1 text-muted-foreground">
						{t('share = e', 'parte = e')}<sup>{t('score', 'nota')}</sup>{t(
							', divided by the sum of that over every sentence (softmax, the same formula as in Why answers vary).',
							', dividido pela soma disso em todas as frases (softmax, a mesma fórmula de Respostas que variam).'
						)}
					</div>
					{#if sentences}
						{@const key = sentences.find((s) => s.kind === 'key')}
						{@const sum = gb.expSum(sentences.map((s) => s.score))}
						{@const top = gb.expSum([key.score])}
						<div class="tabular-nums">
							{t('In the context above the answer scores', 'No contexto acima a resposta tem nota')} {key.score.toFixed(2)}, {t('so', 'então')} e<sup>{key.score.toFixed(2)}</sup> = {top.toFixed(1)}.
							{t(`The sum over all ${sentences.length} sentences is`, `A soma em todas as ${sentences.length} frases é`)} {sum.toFixed(1)}, {t('and', 'e')} {top.toFixed(1)} / {sum.toFixed(1)} = {percent(key.share)}.
						</div>
					{/if}
					<p class="pt-2 text-xs text-muted-foreground">{copy.hoodNote}</p>
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
			'Every score and share on this page comes from a C engine compiled to WebAssembly. The scores are made up to stand for how well each sentence matches the question; a real model works them out word by word.',
			'Cada nota e cada parte nesta página vêm de um motor em C compilado para WebAssembly. As notas são inventadas para representar o quanto cada frase combina com a pergunta; um modelo de verdade as calcula palavra por palavra.'
		)}
	{/snippet}
</ModulePage>
