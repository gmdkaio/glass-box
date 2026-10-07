<script>
	import { onMount } from 'svelte';
	import ModulePage from '$lib/components/ModulePage.svelte';
	import CalibStage from '$lib/components/CalibStage.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Slider } from '$lib/components/ui/slider/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { getEngine } from '$lib/engine-loader.js';
	import { Sweep, range } from '$lib/motion.svelte.js';
	import { SETUPS, HARD, SURE, QUESTIONS, CHECKED, BINS, SPREAD, quiz, CARDS, cardAnswer, byHard, byBold, percent } from '$lib/calibration-sim.js';
	import { where } from '$lib/modules.js';
	import * as en from '$lib/calibration-copy.js';
	import * as pt from '$lib/calibration-copy.pt.js';
	import { t, local, locale } from '$lib/i18n.svelte.js';

	let gb = $state.raw(null);
	let hard = $state(SETUPS[1].mean);
	let shift = $state(SETUPS[1].shift);
	let fixed = $state(false);
	let seed = $state(1);
	const sweep = new Sweep();

	const q = $derived(gb ? quiz(gb, hard, shift, seed, fixed) : null);
	const answers = $derived(gb ? CARDS.map((c, i) => cardAnswer(gb, c, i, shift, seed, fixed)) : null);
	const hardCurve = $derived(gb ? byHard(gb, shift, seed, fixed) : null);
	const boldCurve = $derived(gb ? byBold(gb, hard, seed, fixed) : null);
	const here = where('calibration');
	const copy = $derived(t(en, pt));

	onMount(() => {
		getEngine().then((engine) => {
			gb = engine;
		});
		return () => sweep.stop();
	});

	// plays the same questions from an honest model to a very bold one
	function playSweep() {
		fixed = false;
		sweep.toggle(range(SURE.min, SURE.max, 31), 120, (v) => (shift = v));
	}

	function setup(s) {
		sweep.stop();
		hard = s.mean;
		shift = s.shift;
		fixed = false;
	}

	const hardName = (v) =>
		v >= 2
			? t('mostly easy', 'quase todas fáceis')
			: v >= 1
				? t('fairly easy', 'bem fáceis')
				: v >= 0
					? t('mixed', 'misturadas')
					: v >= -0.8
						? t('hard', 'difíceis')
						: t('very hard', 'muito difíceis');
	const sureName = (v) =>
		v < 0.2
			? t('honest', 'honesto')
			: v < 1
				? t('a little surer than it is', 'um pouco mais seguro do que é')
				: v < 2
					? t('much surer than it is', 'muito mais seguro do que é')
					: t('far surer than it is', 'seguro demais para o que é');
</script>

<svelte:head><title>Calibration · Glass Box</title></svelte:head>

<ModulePage
	track={local(here.track, 'title')}
	n={here.n}
	total={here.total}
	tag={local(here.module, 'tag')}
	title={t('When the model says it is sure, how often is it right?', 'Quando o modelo diz que tem certeza, quantas vezes ele acerta?')}
	lead={t(
		'A model can tell you how confident it is, in words or as a number. Calibration is how well that matches its record: of all the answers it gives at 80%, about 80% should be right. Give the same model easier or harder questions and see where the gap opens.',
		'Um modelo pode dizer o quanto está confiante, em palavras ou como um número. Calibração é o quanto isso bate com o histórico dele: de todas as respostas que ele dá com 80%, cerca de 80% devem estar certas. Dê ao mesmo modelo perguntas mais fáceis ou mais difíceis e veja onde a diferença aparece.'
	)}
	whyLead={copy.whyLead}
>
	{#snippet presets()}
		<p class="mb-2 text-xs text-muted-foreground">
			{t('The same model in three quizzes. It sounds about equally sure in all of them:', 'O mesmo modelo em três quizzes. Ele parece mais ou menos igualmente seguro em todos:')}
		</p>
		<div class="mb-3.5 grid gap-2.5 md:grid-cols-3">
			{#each SETUPS as s (s.label)}
				<button
					type="button"
					onclick={() => setup(s)}
					class="rounded-lg border bg-sidebar px-3.5 py-3 text-left text-sm text-muted-foreground transition-colors hover:border-foreground/40 {hard === s.mean &&
					shift === s.shift
						? 'border-foreground bg-muted'
						: ''}"
				>
					<b class="block font-medium text-foreground">{local(s, 'label')}</b>
					<span class="mt-0.5 block text-xs">{local(s, 'hint')}</span>
				</button>
			{/each}
		</div>
	{/snippet}

	{#snippet stage()}
		<CalibStage
			{answers}
			{q}
			{hard}
			{shift}
			{hardCurve}
			{boldCurve}
			play={{ playing: sweep.playing, label: t('Make it bolder', 'Deixar mais ousado'), onclick: playSweep, disabled: !gb }}
			pace={sweep.playing ? 160 : 450}
		/>
	{/snippet}

	{#snippet legend()}
		<div class="flex flex-wrap gap-x-5 gap-y-1">
			<span
				><span class="mr-1 inline-block h-2 w-4 rounded-sm border border-muted-foreground align-middle"></span><span
					class="mr-1.5 inline-block h-0 w-4 border-t-2 border-foreground align-middle"
				></span>{t('How sure it sounds', 'O quanto parece seguro')}</span
			>
			<span
				><span class="mr-1 inline-block h-2 w-4 rounded-sm bg-foreground/80 align-middle"></span><span
					class="mr-1.5 inline-block h-0 w-4 border-t-2 border-dashed border-muted-foreground align-middle"
				></span>{t('How often it is right', 'Quantas vezes acerta')}</span
			>
		</div>
	{/snippet}

	{#snippet controls()}
		<div class="grid gap-x-8 gap-y-5 md:grid-cols-2">
			<div>
				<div class="mb-2 flex justify-between text-xs text-muted-foreground">
					<span>{t('The questions are', 'As perguntas são')} {hardName(hard)}</span>
					<span>{t('very hard to easy', 'de muito difíceis a fáceis')}</span>
				</div>
				<Slider type="single" bind:value={hard} min={HARD.min} max={HARD.max} step={0.1} onValueChange={() => sweep.stop()} />
			</div>
			<div>
				<div class="mb-2 flex justify-between text-xs text-muted-foreground">
					<span>{t('It sounds', 'Ele parece')} {sureName(shift)}</span>
					<span>{t('honest to bold', 'de honesto a ousado')}</span>
				</div>
				<Slider type="single" bind:value={shift} min={SURE.min} max={SURE.max} step={0.1} onValueChange={() => sweep.stop()} />
			</div>
			<div>
				<div class="mb-2 text-xs text-muted-foreground">
					{t(`Correct it with a track record of ${CHECKED} checked questions`, `Corrigir com o histórico de ${CHECKED} perguntas verificadas`)}
				</div>
				<div class="flex flex-wrap gap-1.5">
					<Button size="sm" variant={fixed ? 'outline' : 'default'} onclick={() => (fixed = false)}>{t('As it speaks', 'Como ele fala')}</Button>
					<Button size="sm" variant={fixed ? 'default' : 'outline'} onclick={() => (sweep.stop(), (fixed = true))}>{t('Corrected', 'Corrigido')}</Button>
				</div>
			</div>
			<div>
				<div class="mb-2 text-xs text-muted-foreground">{t('Questions', 'Perguntas')}</div>
				<div class="flex flex-wrap gap-1.5">
					<Button size="sm" variant="outline" onclick={() => (seed += 1)} disabled={!gb}>{t('New set of questions', 'Novo conjunto de perguntas')}</Button>
				</div>
			</div>
		</div>
	{/snippet}

	{#snippet say()}
		{#if q}
			<p class="leading-relaxed">
				<b class="font-medium">
					{t(
						`On average it says it is ${percent(q.says)} sure, and ${percent(q.right)} of its answers are right.`,
						`Em média ele diz ter ${percent(q.says)} de certeza, e ${percent(q.right)} das respostas dele estão certas.`
					)}
				</b>
				{copy.say(q.gap)}
			</p>
			<p class="mt-1 text-sm text-muted-foreground">{copy.trap(hard, shift, fixed)}</p>
		{:else}
			<p class="text-muted-foreground">{t('Loading the engine…', 'Carregando o motor…')}</p>
		{/if}
	{/snippet}

	{#snippet cards()}
		<div class="mb-4 grid gap-3.5 md:grid-cols-3">
			{#each [
				{ key: 'says', title: t('How sure it sounds', 'O quanto parece seguro'), value: q?.says, text: t('The average confidence it states.', 'A confiança média que ele declara.') },
				{ key: 'right', title: t('How often it is right', 'Quantas vezes acerta'), value: q?.right, text: t(`Out of ${QUESTIONS.toLocaleString(locale())} answers.`, `De ${QUESTIONS.toLocaleString(locale())} respostas.`) },
				{ key: 'gap', title: t('The gap', 'A diferença'), value: q?.gap, text: t('Average distance between what it says and its record, band by band.', 'Distância média entre o que ele diz e o histórico dele, faixa por faixa.') }
			] as card (card.key)}
				<div class="rounded-lg border px-4 py-3.5">
					<h3 class="text-xs font-medium">{card.title}</h3>
					<div class="mt-1 text-3xl font-semibold tracking-tight tabular-nums">{q ? percent(card.value) : '–'}</div>
					<p class="text-xs text-muted-foreground">{card.text}</p>
					<div class="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
						<div class="h-full bg-foreground transition-[width]" style="width: {q ? card.value * 100 : 0}%"></div>
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
					{t(
						'Open Under the hood to see how the answers are made and how the gap and the correction are worked out.',
						'Abra Por dentro para ver como as respostas são feitas e como a diferença e a correção são calculadas.'
					)}
				</p>
			</Tabs.Content>
			<Tabs.Content value="hood">
				<div class="space-y-2 rounded-lg border px-4 py-3.5 text-sm">
					<div class="text-muted-foreground">
						{t(
							`Each of the ${QUESTIONS.toLocaleString(locale())} questions gets a number z, how well the model knows it, in log-odds:`,
							`Cada uma das ${QUESTIONS.toLocaleString(locale())} perguntas recebe um número z, o quanto o modelo a conhece, em log-odds:`
						)}
					</div>
					<ul class="list-inside list-disc text-muted-foreground">
						<li>z = {hard.toFixed(1)} + {SPREAD} × {t('a random draw from N(0, 1)', 'um sorteio aleatório de N(0, 1)')}</li>
						<li>{t('the model is right with chance', 'o modelo acerta com chance')} sigmoid(z) = 1 / (1 + e<sup>−z</sup>)</li>
						<li>
							{t(`it says it is sigmoid(z + ${shift.toFixed(1)}) sure`, `ele diz ter sigmoid(z + ${shift.toFixed(1)}) de certeza`)}{shift < 0.05 ? t(', which is honest', ', o que é honesto') : ''}
						</li>
					</ul>
					<div class="pt-1 text-muted-foreground">
						{t(
							`The gap (expected calibration error): sort the answers into ${BINS} bands of stated confidence, take the distance between average confidence and share right in each band, and average those distances weighted by how many answers each band holds.`,
							`A diferença (expected calibration error): separe as respostas em ${BINS} faixas de confiança declarada, pegue a distância entre a confiança média e a fração de acertos em cada faixa, e tire a média dessas distâncias, ponderada pelo número de respostas em cada faixa.`
						)}
					</div>
					{#if q}
						<div class="tabular-nums">
							{t(
								`Here the gap is ${percent(q.gap)}. The Brier score, the average of (confidence − outcome)², is ${q.brier.toFixed(3)}; lower is better.`,
								`Aqui a diferença é ${percent(q.gap)}. O Brier score, a média de (confiança − resultado)², é ${q.brier.toFixed(3)}; quanto menor, melhor.`
							)}
						</div>
						{#if fixed}
							<div class="tabular-nums">
								{t(
									`Correction: on ${CHECKED} separate questions with known answers, the shift that fits best is ${q.fix.toFixed(2)} in log-odds. Every stated confidence c becomes`,
									`Correção: em ${CHECKED} perguntas separadas com respostas conhecidas, o deslocamento que melhor se ajusta é ${q.fix.toFixed(2)} em log-odds. Cada confiança declarada c vira`
								)}
								sigmoid(logit(c) {q.fix < 0 ? '−' : '+'} {Math.abs(q.fix).toFixed(2)}).
							</div>
						{/if}
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
			'Every answer, band and score on this page comes from a C engine compiled to WebAssembly. The questions are simulated: each one is a chance of being right and a stated confidence, with no real text behind it.',
			'Cada resposta, faixa e nota nesta página vem de um motor em C compilado para WebAssembly. As perguntas são simuladas: cada uma é uma chance de acertar e uma confiança declarada, sem nenhum texto de verdade por trás.'
		)}
	{/snippet}
</ModulePage>
