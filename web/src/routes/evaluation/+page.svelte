<script>
	import { onMount } from 'svelte';
	import ModulePage from '$lib/components/ModulePage.svelte';
	import EvalStage from '$lib/components/EvalStage.svelte';
	import { Slider } from '$lib/components/ui/slider/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { getEngine } from '$lib/engine-loader.js';
	import { Sweep, range } from '$lib/motion.svelte.js';
	import { QUESTIONS, PUBLIC, MODELS, PRESETS, COPIES, PASSES, RATE, trainBase, sit } from '$lib/eval-sim.js';
	import { where } from '$lib/modules.js';
	import * as en from '$lib/eval-copy.js';
	import * as pt from '$lib/eval-copy.pt.js';
	import { t, local, toyNote } from '$lib/i18n.svelte.js';

	let byLeak = $state.raw(Array.from({ length: PUBLIC + 1 }, () => null));
	let models = $state.raw(MODELS.map(() => null));
	let leak = $state(6);
	const sweep = new Sweep();
	const here = where('evaluation');
	const copy = $derived(t(en, pt));

	const exam = $derived(byLeak[leak]);
	const pub = $derived(exam ? Math.round((exam.publicRight / PUBLIC) * 100) : 0);
	const fresh = $derived(exam ? Math.round((exam.freshRight / (QUESTIONS.length - PUBLIC)) * 100) : 0);

	// Each exam needs a short fine-tune: your setting first, then the rest, then the five models.
	onMount(() => {
		let stop = false;
		getEngine().then((gb) => {
			const base = trainBase(gb);
			const jobs = [
				...[leak, ...byLeak.keys()].filter((k, i, all) => all.indexOf(k) === i).map((k) => () => {
					const done = sit(gb, base, { leak: k, passes: PASSES, extra: false });
					byLeak = byLeak.map((x, j) => (j === k ? done : x));
				}),
				...MODELS.map((m, i) => () => {
					const done = sit(gb, base, m);
					models = models.map((x, j) => (j === i ? done : x));
				})
			];
			const next = () => {
				if (stop || !jobs.length) return;
				jobs.shift()();
				setTimeout(next, 0);
			};
			next();
		});
		return () => {
			stop = true;
			sweep.stop();
		};
	});

	const playSweep = () => sweep.toggle(range(0, PUBLIC, PUBLIC + 1), 450, (k) => (leak = k));
	function preset(p) {
		sweep.stop();
		leak = p.leak;
	}
</script>

<svelte:head><title>Evaluating a model · Glass Box</title></svelte:head>

<ModulePage
	track={local(here.track, 'title')}
	n={here.n}
	total={here.total}
	title={t('Can you trust a benchmark score?', 'Dá para confiar na nota de um benchmark?')}
	lead={t(
		"Models are compared on tests with known answers, called benchmarks. Those tests are public, and when their questions end up in a model's training text, the model can score well by remembering answers. Leak some questions and compare the public test with fresh ones.",
		'Os modelos são comparados em testes com respostas conhecidas, chamados benchmarks. Esses testes são públicos, e quando as perguntas deles acabam no texto de treino de um modelo, ele pode tirar nota alta lembrando as respostas. Vaze algumas perguntas e compare o teste público com perguntas novas.'
	)}
	whyLead={copy.whyLead}
>
	{#snippet presets()}
		<p class="mb-2 text-xs text-muted-foreground">
			{t(
				'The fair model sits a 24-question exam. Choose how much of the public half it saw in training:',
				'O modelo da feira faz uma prova de 24 perguntas. Escolha quanto da metade pública ele viu no treino:'
			)}
		</p>
		<div class="mb-3.5 grid gap-2.5 md:grid-cols-3">
			{#each PRESETS as p (p.label)}
				<button
					type="button"
					onclick={() => preset(p)}
					class="rounded-lg border bg-sidebar px-3.5 py-3 text-left text-sm text-muted-foreground transition-colors hover:border-foreground/40 {leak === p.leak ? 'border-foreground bg-muted' : ''}"
				>
					<b class="block font-medium text-foreground">{local(p, 'label')}</b>
					<span class="mt-0.5 block text-xs">{local(p, 'hint')}</span>
				</button>
			{/each}
		</div>
	{/snippet}

	{#snippet stage()}
		<EvalStage {leak} {byLeak} {models} play={{ playing: sweep.playing, label: t('Leak more', 'Vazar mais'), onclick: playSweep, disabled: !byLeak.every(Boolean) }} />
	{/snippet}

	{#snippet legend()}
		<div class="flex flex-wrap gap-x-5 gap-y-1">
			<span><span class="mr-1.5 inline-block h-2.5 w-4 rounded-sm bg-foreground align-middle"></span>{t('The model got it right', 'O modelo acertou')}</span>
			<span><span class="mr-1.5 inline-block h-2.5 w-4 rounded-sm border border-muted-foreground align-middle"></span>{t('Wrong, with its guess', 'Errou, com o palpite dele')}</span>
			<span>{t(`Leaked: in the training text, ${COPIES} times each`, `Vazada: no texto de treino, ${COPIES} vezes cada uma`)}</span>
		</div>
	{/snippet}

	{#snippet controls()}
		<div class="max-w-xl">
			<div class="mb-2 flex justify-between text-xs text-muted-foreground">
				<span>{t(`Public questions in the training text: ${leak} of ${PUBLIC}`, `Perguntas públicas no texto de treino: ${leak} de ${PUBLIC}`)}</span>
				<span>{t('how much of the test leaked', 'quanto do teste vazou')}</span>
			</div>
			<Slider type="single" bind:value={leak} min={0} max={PUBLIC} step={1} onValueChange={() => sweep.stop()} />
		</div>
	{/snippet}

	{#snippet say()}
		{#if exam}
			<p class="leading-relaxed">
				<b class="font-medium">
					{t(
						`With ${leak} of ${PUBLIC} public questions leaked, the model scores ${pub}% on the public benchmark and ${fresh}% on fresh questions.`,
						`Com ${leak} de ${PUBLIC} perguntas públicas vazadas, o modelo tira ${pub}% no benchmark público e ${fresh}% nas perguntas novas.`
					)}
				</b>
				{copy.say({ leak, gap: pub - fresh })}
			</p>
			<p class="mt-1 text-sm text-muted-foreground">{copy.trap(leak)}</p>
		{:else}
			<p class="text-muted-foreground">{t('Training the model…', 'Treinando o modelo…')}</p>
		{/if}
	{/snippet}

	{#snippet cards()}
		<div class="mb-4 grid gap-3.5 md:grid-cols-3">
			{#each [{ title: t('Public benchmark', 'Benchmark público'), value: exam ? `${pub}%` : '–', share: pub / 100, text: t(`${exam ? exam.publicRight : '–'} of ${PUBLIC} right. What a leaderboard would show.`, `${exam ? exam.publicRight : '–'} de ${PUBLIC} certas. O que um ranking mostraria.`) }, { title: t('Fresh questions', 'Perguntas novas'), value: exam ? `${fresh}%` : '–', share: fresh / 100, text: t(`${exam ? exam.freshRight : '–'} of ${QUESTIONS.length - PUBLIC} right. The model's real level.`, `${exam ? exam.freshRight : '–'} de ${QUESTIONS.length - PUBLIC} certas. O nível real do modelo.`) }, { title: t('The leak', 'O vazamento'), value: exam ? `${pub - fresh > 0 ? '+' : ''}${pub - fresh} pts` : '–', share: Math.max(0, pub - fresh) / 100, text: t('Public score minus fresh score.', 'Nota pública menos a nota nas perguntas novas.') }] as c (c.title)}
				<div class="rounded-lg border px-4 py-3.5">
					<h3 class="text-xs font-medium">{c.title}</h3>
					<div class="mt-1 text-3xl font-semibold tracking-tight tabular-nums">{c.value}</div>
					<p class="text-xs text-muted-foreground">{c.text}</p>
					<div class="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
						<div class="h-full bg-foreground transition-[width]" style="width: {c.share * 100}%"></div>
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
				<p class="max-w-3xl text-sm text-muted-foreground">{t('Open Under the hood for how the exam is set and scored.', 'Abra Por dentro para ver como a prova é montada e corrigida.')}</p>
			</Tabs.Content>
			<Tabs.Content value="hood">
				<div class="space-y-2 rounded-lg border px-4 py-3.5 text-sm text-muted-foreground">
					<div>
						{t(
							`The model learns the fair sentences for ${PASSES} passes at learning rate ${RATE}, with each leaked question added ${COPIES} times. Then it reads the word before each blank, and a question counts as right when its top guess is the missing word.`,
							`O modelo aprende as frases da feira por ${PASSES} passadas com taxa de aprendizado ${RATE}, com cada pergunta vazada acrescentada ${COPIES} vezes. Depois ele lê a palavra antes de cada lacuna, e uma pergunta conta como certa quando o primeiro palpite dele é a palavra que falta.`
						)}
					</div>
					<div>
						{t(
							`In each set of ${PUBLIC}, five answers follow from what the fair text teaches, and seven can only come from seeing the question. The leaked questions are taken in a fixed order, so each step leaks one the model could not answer.`,
							`Em cada conjunto de ${PUBLIC}, cinco respostas saem do que o texto da feira ensina, e sete só podem vir de ter visto a pergunta. As perguntas vazam numa ordem fixa, então cada passo vaza uma que o modelo não sabia responder.`
						)}
					</div>
					<div>
						{t(
							`Score = right answers ÷ questions. One question is ${Math.round(100 / PUBLIC)} points here, so small tests swing a lot.`,
							`Nota = respostas certas ÷ perguntas. Aqui uma pergunta vale ${Math.round(100 / PUBLIC)} pontos, então testes pequenos oscilam muito.`
						)}
					</div>
					<p class="pt-2 text-xs">{copy.hoodNote}</p>
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
			'Every number on this page comes from a C engine compiled to WebAssembly, which trains each model and sits each exam in your browser. It is the tiny word-pair network from the fine-tuning pages, and the exam is made up.',
			'Cada número nesta página vem de um motor em C compilado para WebAssembly, que treina cada modelo e aplica cada prova no seu navegador. É a pequena rede de pares de palavras das páginas de fine-tuning, e a prova é inventada.'
		)}{t('', ' ' + toyNote)}
	{/snippet}
</ModulePage>
