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
	import * as copy from '$lib/eval-copy.js';

	let byLeak = $state.raw(Array.from({ length: PUBLIC + 1 }, () => null));
	let models = $state.raw(MODELS.map(() => null));
	let leak = $state(6);
	const sweep = new Sweep();
	const here = where('evaluation');

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
	track={here.track.title}
	n={here.n}
	total={here.total}
	title="Can you trust a benchmark score?"
	lead="Models are compared on tests with known answers, called benchmarks. Those tests are public, and when their questions end up in a model's training text, the model can score well by remembering answers. Leak some questions and compare the public test with fresh ones."
	whyLead={copy.whyLead}
>
	{#snippet presets()}
		<p class="mb-2 text-xs text-muted-foreground">The fair model sits a 24-question exam. Choose how much of the public half it saw in training:</p>
		<div class="mb-3.5 grid gap-2.5 md:grid-cols-3">
			{#each PRESETS as p (p.label)}
				<button
					type="button"
					onclick={() => preset(p)}
					class="rounded-lg border bg-sidebar px-3.5 py-3 text-left text-sm text-muted-foreground transition-colors hover:border-foreground/40 {leak === p.leak ? 'border-foreground bg-muted' : ''}"
				>
					<b class="block font-medium text-foreground">{p.label}</b>
					<span class="mt-0.5 block text-xs">{p.hint}</span>
				</button>
			{/each}
		</div>
	{/snippet}

	{#snippet stage()}
		<EvalStage {leak} {byLeak} {models} play={{ playing: sweep.playing, label: 'Leak more', onclick: playSweep, disabled: !byLeak.every(Boolean) }} />
	{/snippet}

	{#snippet legend()}
		<div class="flex flex-wrap gap-x-5 gap-y-1">
			<span><span class="mr-1.5 inline-block h-2.5 w-4 rounded-sm bg-foreground align-middle"></span>The model got it right</span>
			<span><span class="mr-1.5 inline-block h-2.5 w-4 rounded-sm border border-muted-foreground align-middle"></span>Wrong, with its guess</span>
			<span>Leaked: in the training text, {COPIES} times each</span>
		</div>
	{/snippet}

	{#snippet controls()}
		<div class="max-w-xl">
			<div class="mb-2 flex justify-between text-xs text-muted-foreground">
				<span>Public questions in the training text: {leak} of {PUBLIC}</span><span>how much of the test leaked</span>
			</div>
			<Slider type="single" bind:value={leak} min={0} max={PUBLIC} step={1} onValueChange={() => sweep.stop()} />
		</div>
	{/snippet}

	{#snippet say()}
		{#if exam}
			<p class="leading-relaxed">
				<b class="font-medium">With {leak} of {PUBLIC} public questions leaked, the model scores {pub}% on the public benchmark and {fresh}% on fresh questions.</b>
				{copy.say({ leak, gap: pub - fresh })}
			</p>
			<p class="mt-1 text-sm text-muted-foreground">{copy.trap(leak)}</p>
		{:else}
			<p class="text-muted-foreground">Training the model…</p>
		{/if}
	{/snippet}

	{#snippet cards()}
		<div class="mb-4 grid gap-3.5 md:grid-cols-3">
			{#each [{ title: 'Public benchmark', value: exam ? `${pub}%` : '–', share: pub / 100, text: `${exam ? exam.publicRight : '–'} of ${PUBLIC} right. What a leaderboard would show.` }, { title: 'Fresh questions', value: exam ? `${fresh}%` : '–', share: fresh / 100, text: `${exam ? exam.freshRight : '–'} of ${QUESTIONS.length - PUBLIC} right. The model's real level.` }, { title: 'The leak', value: exam ? `${pub - fresh > 0 ? '+' : ''}${pub - fresh} pts` : '–', share: Math.max(0, pub - fresh) / 100, text: 'Public score minus fresh score.' }] as c (c.title)}
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
			<h3 class="mb-1.5 text-xs font-medium">The trap</h3>
			<p class="text-sm leading-relaxed text-muted-foreground">{copy.trapCard}</p>
		</div>

		<Tabs.Root value="simple">
			<Tabs.List>
				<Tabs.Trigger value="simple">Simple</Tabs.Trigger>
				<Tabs.Trigger value="hood">Under the hood</Tabs.Trigger>
			</Tabs.List>
			<Tabs.Content value="simple">
				<p class="max-w-3xl text-sm text-muted-foreground">Open Under the hood for how the exam is set and scored.</p>
			</Tabs.Content>
			<Tabs.Content value="hood">
				<div class="space-y-2 rounded-lg border px-4 py-3.5 text-sm text-muted-foreground">
					<div>
						The model learns the fair sentences for {PASSES} passes at learning rate {RATE}, with each leaked question added {COPIES} times. Then it reads the word before each blank,
						and a question counts as right when its top guess is the missing word.
					</div>
					<div>
						In each set of {PUBLIC}, five answers follow from what the fair text teaches, and seven can only come from seeing the question. The leaked questions are taken in a
						fixed order, so each step leaks one the model could not answer.
					</div>
					<div>Score = right answers ÷ questions. One question is {Math.round(100 / PUBLIC)} points here, so small tests swing a lot.</div>
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
		Every number on this page comes from a C engine compiled to WebAssembly, which trains each model and sits each exam in your browser. It is the tiny word-pair
		network from the fine-tuning pages, and the exam is made up.
	{/snippet}
</ModulePage>
