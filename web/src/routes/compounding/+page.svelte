<script>
	import { onMount } from 'svelte';
	import ModulePage from '$lib/components/ModulePage.svelte';
	import ChainStage from '$lib/components/ChainStage.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Slider } from '$lib/components/ui/slider/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { getEngine } from '$lib/engine-loader.js';
	import { TASKS, CHECKS, MAX_STEPS, RETRIES, TRIALS, curve, percent } from '$lib/compounding-sim.js';
	import { where } from '$lib/modules.js';
	import * as en from '$lib/compounding-copy.js';
	import * as pt from '$lib/compounding-copy.pt.js';
	import { t, local } from '$lib/i18n.svelte.js';

	let gb = $state.raw(null);
	let accuracy = $state(95); // percent right per step
	let steps = $state(TASKS[1].steps);
	let checkIndex = $state(0);
	let catchPercent = $state(90);
	let run = $state.raw(null);
	let shown = $state(0);
	let seed = 0;
	let timer;

	const p = $derived(accuracy / 100);
	const every = $derived(CHECKS[checkIndex].every);
	const catchRate = $derived(catchPercent / 100);
	const plain = $derived(gb ? gb.chainOdds(p, steps, 0, catchRate, RETRIES) : null);
	const odds = $derived(gb ? gb.chainOdds(p, steps, every, catchRate, RETRIES) : null);
	const trials = $derived(gb ? gb.chainTrials(p, steps, every, catchRate, RETRIES, TRIALS, 1) : null);
	const points = $derived(gb ? curve(gb, p, every, catchRate) : null);
	const here = where('compounding');
	const copy = $derived(t(en, pt));

	onMount(() => {
		getEngine().then((engine) => (gb = engine));
		return () => clearInterval(timer);
	});

	// A run belongs to the settings it was made with, so it is only shown while they
	// still hold. Checking here, not in an effect, keeps an old run from being drawn
	// against new settings for even one frame.
	const settings = $derived(`${p} ${steps} ${every} ${catchRate}`);
	const current = $derived(run && run.settings === settings ? run : null);
	$effect(() => {
		if (!current) clearInterval(timer);
	});

	// plays the run back one event at a time, in about two and a half seconds
	function runOne() {
		clearInterval(timer);
		seed += 1;
		run = { ...gb.chainTrace(p, steps, every, catchRate, RETRIES, seed), settings };
		shown = 0;
		const pace = Math.min(120, Math.max(20, 2500 / run.events.length));
		timer = setInterval(() => {
			shown += 1;
			if (shown >= run.events.length) clearInterval(timer);
		}, pace);
	}
</script>

<svelte:head><title>Long tasks · Glass Box</title></svelte:head>

<ModulePage
	track={local(here.track, 'title')}
	n={here.n}
	total={here.total}
	tag={local(here.module, 'tag')}
	title={t('Why do long tasks go wrong more often?', 'Por que tarefas longas dão errado com mais frequência?')}
	lead={t(
		'Every step a model takes is a small chance to slip, and one wrong step spoils everything built on it. The chances multiply, so a model that is right 95% of the time per step finishes a 20-step task cleanly about a third of the time. Checks between steps win most of that back.',
		'Cada passo que um modelo dá é uma pequena chance de escorregar, e um passo errado estraga tudo o que é construído sobre ele. As chances se multiplicam, então um modelo que acerta 95% das vezes em cada passo termina uma tarefa de 20 passos sem erro em cerca de um terço das vezes. Verificações entre os passos recuperam a maior parte disso.'
	)}
	whyLead={copy.whyLead}
>
	{#snippet presets()}
		<p class="mb-2 text-xs text-muted-foreground">{t('Pick a task size.', 'Escolha o tamanho da tarefa.')} {copy.stepNote}</p>
		<div class="mb-3.5 grid gap-2.5 md:grid-cols-3">
			{#each TASKS as task (task.label)}
				<button
					type="button"
					onclick={() => (steps = task.steps)}
					class="rounded-lg border bg-sidebar px-3.5 py-3 text-left text-sm text-muted-foreground transition-colors hover:border-foreground/40 {steps ===
					task.steps
						? 'border-foreground bg-muted'
						: ''}"
				>
					<b class="block font-medium text-foreground">{local(task, 'label')}</b>
					<span class="mt-0.5 block text-xs">{local(task, 'hint')}, {t(`about ${task.steps} steps`, `cerca de ${task.steps} passos`)}</span>
				</button>
			{/each}
		</div>
	{/snippet}

	{#snippet stage()}
		<ChainStage {steps} {every} run={current} {shown} {trials} {odds} {points} />
	{/snippet}

	{#snippet legend()}
		<div class="flex flex-wrap gap-x-5 gap-y-1">
			<span><span class="mr-1.5 inline-block h-2.5 w-2.5 rounded-[2px] bg-foreground/80 align-middle"></span>{t('Right', 'Certo')}</span>
			<span><span class="mr-1.5 inline-block h-2.5 w-2.5 rounded-[2px] border-2 border-foreground align-middle"></span>{t('Wrong', 'Errado')}</span>
			<span><span class="mr-1.5 inline-block h-2.5 w-2.5 rounded-[2px] border border-dashed border-foreground/70 align-middle"></span>{t('Being redone', 'Sendo refeito')}</span>
			<span><span class="mr-1.5 inline-block h-2.5 w-2.5 rounded-[2px] bg-foreground/25 align-middle"></span>{t('Built on a mistake', 'Construído sobre um erro')}</span>
			<span>{t('✓ check passed · ↺ check caught a mistake · ✗ check missed one', '✓ verificação aprovou · ↺ verificação pegou um erro · ✗ verificação deixou passar um')}</span>
		</div>
	{/snippet}

	{#snippet controls()}
		<div class="grid gap-x-8 gap-y-5 md:grid-cols-2">
			<div>
				<div class="mb-2 flex justify-between text-xs text-muted-foreground">
					<span>{t('Right per step', 'Acerto por passo')}: {accuracy.toFixed(1)}%</span>
					<span>80% {t('to', 'a')} 99.9%</span>
				</div>
				<Slider type="single" bind:value={accuracy} min={80} max={99.9} step={0.1} />
			</div>
			<div>
				<div class="mb-2 flex justify-between text-xs text-muted-foreground">
					<span>{t('Steps in the task', 'Passos na tarefa')}: {steps}</span>
					<span>1 {t('to', 'a')} {MAX_STEPS}</span>
				</div>
				<Slider type="single" bind:value={steps} min={1} max={MAX_STEPS} step={1} />
			</div>
			<div>
				<div class="mb-2 text-xs text-muted-foreground">{t('Checks between steps', 'Verificações entre os passos')}</div>
				<div class="flex flex-wrap gap-1.5">
					{#each CHECKS as c, i (c.label)}
						<Button size="sm" variant={checkIndex === i ? 'default' : 'outline'} onclick={() => (checkIndex = i)}>{local(c, 'label')}</Button>
					{/each}
				</div>
			</div>
			<div class={every === 0 ? 'opacity-50' : ''}>
				<div class="mb-2 flex justify-between text-xs text-muted-foreground">
					<span>{t(`A check catches ${catchPercent}% of mistakes`, `Uma verificação pega ${catchPercent}% dos erros`)}</span>
					<span>{t(`redoes a section up to ${RETRIES} times`, `refaz um trecho até ${RETRIES} vezes`)}</span>
				</div>
				<Slider type="single" bind:value={catchPercent} min={0} max={100} step={5} disabled={every === 0} />
			</div>
		</div>
		<div class="mt-5 flex flex-wrap gap-2.5">
			<Button onclick={runOne} disabled={!gb}>{t('Run one task', 'Rodar uma tarefa')}</Button>
		</div>
	{/snippet}

	{#snippet say()}
		{#if odds !== null}
			<p class="leading-relaxed">
				<b class="font-medium">
					{t(
						`At ${accuracy.toFixed(1)}% per step, a ${steps}-step task finishes without a mistake ${percent(odds)} of the time${every > 0 ? `, or ${percent(plain)} without the checks` : ''}.`,
						`Com ${accuracy.toFixed(1)}% por passo, uma tarefa de ${steps} passos termina sem erro em ${percent(odds)} das vezes${every > 0 ? `, ou ${percent(plain)} sem as verificações` : ''}.`
					)}
				</b>
				{copy.say(odds)}
			</p>
			<p class="mt-1 text-sm text-muted-foreground">{copy.trap(every, plain, odds)}</p>
		{:else}
			<p class="text-muted-foreground">{t('Loading the engine…', 'Carregando o motor…')}</p>
		{/if}
	{/snippet}

	{#snippet cards()}
		<div class="mb-4 grid gap-3.5 md:grid-cols-3">
			<div class="rounded-lg border px-4 py-3.5">
				<h3 class="text-xs font-medium">{t('Chance of a clean finish', 'Chance de terminar sem erro')}</h3>
				<div class="mt-1 text-3xl font-semibold tracking-tight">{odds !== null ? percent(odds) : '–'}</div>
				<p class="text-xs text-muted-foreground">{t('Every step right, or every mistake caught and redone.', 'Todos os passos certos, ou todos os erros pegos e refeitos.')}</p>
				<div class="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
					<div class="h-full bg-foreground transition-[width]" style="width: {(odds ?? 0) * 100}%"></div>
				</div>
			</div>
			<div class="rounded-lg border px-4 py-3.5">
				<h3 class="text-xs font-medium">{t('The same task with no checks', 'A mesma tarefa sem verificações')}</h3>
				<div class="mt-1 text-3xl font-semibold tracking-tight">{plain !== null ? percent(plain) : '–'}</div>
				<p class="text-xs text-muted-foreground">
					{t(`${accuracy.toFixed(1)}% multiplied by itself ${steps} times.`, `${accuracy.toFixed(1)}% multiplicado por ele mesmo ${steps} vezes.`)}
				</p>
				<div class="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
					<div class="h-full bg-foreground transition-[width]" style="width: {(plain ?? 0) * 100}%"></div>
				</div>
			</div>
			<div class="rounded-lg border px-4 py-3.5">
				<h3 class="text-xs font-medium">{t('What the checks cost', 'O custo das verificações')}</h3>
				<div class="mt-1 text-3xl font-semibold tracking-tight">
					{trials && every > 0 ? `+${percent(trials.redone / steps)}` : '–'}
				</div>
				<p class="text-xs text-muted-foreground">
					{every > 0
						? t(
								`Steps thrown away and done again, about ${trials ? trials.redone.toFixed(1) : '–'} per run.`,
								`Passos jogados fora e refeitos, cerca de ${trials ? trials.redone.toFixed(1) : '–'} por rodada.`
							)
						: t('Nothing, and nothing is caught. Turn on checks to compare.', 'Nenhum, e nada é pego. Ligue as verificações para comparar.')}
				</p>
				<div class="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
					<div class="h-full bg-foreground transition-[width]" style="width: {trials && every > 0 ? Math.min(100, (trials.redone / steps) * 100) : 0}%"></div>
				</div>
			</div>
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
						'Open Under the hood to see the formula with the numbers from your current setting.',
						'Abra Por dentro para ver a fórmula com os números do seu ajuste atual.'
					)}
				</p>
			</Tabs.Content>
			<Tabs.Content value="hood">
				<div class="space-y-2 rounded-lg border px-4 py-3.5 text-sm">
					<div class="text-muted-foreground">
						{t('No checks: chance of a clean finish = p', 'Sem verificações: chance de terminar sem erro = p')}<sup>n</sup>{t(
							', p right per step, n steps.',
							', com p de acerto por passo e n passos.'
						)}
					</div>
					{#if plain !== null}
						<div class="tabular-nums">{p.toFixed(3)}<sup>{steps}</sup> = {plain.toFixed(4)}</div>
					{/if}
					<div class="pt-2 text-muted-foreground">
						{t(
							'With checks: split the task into sections of k steps. A section is right first time with q = p',
							'Com verificações: divida a tarefa em trechos de k passos. Um trecho sai certo na primeira vez com q = p'
						)}<sup>k</sup>{t(
							'. A wrong one is caught with chance c and redone, up to r times, so it passes with',
							'. Um trecho errado é pego com chance c e refeito, até r vezes, então ele passa com'
						)}
						q × (1 + m + m<sup>2</sup> + … + m<sup>r</sup>), {t('where', 'onde')} m = (1 − q) × c. {t(
							'The task passes if every section does.',
							'A tarefa passa se todos os trechos passarem.'
						)}
					</div>
					{#if every > 0 && odds !== null}
						{@const section = gb.chainSection(p, every, catchRate)}
						<div class="tabular-nums">
							k = {every}, q = {section.q.toFixed(4)}, c = {catchRate.toFixed(2)}, m = {section.m.toFixed(4)}, r = {RETRIES} → {t('the task passes', 'a tarefa passa com')} {odds.toFixed(4)}
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
			'Every chance and every run on this page comes from a C engine compiled to WebAssembly. The steps are independent and equally reliable, which real tasks are not.',
			'Cada chance e cada rodada nesta página vêm de um motor em C compilado para WebAssembly. Os passos são independentes e igualmente confiáveis, o que não acontece em tarefas de verdade.'
		)}
	{/snippet}
</ModulePage>
