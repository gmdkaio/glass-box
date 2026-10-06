<script>
	import { onMount } from 'svelte';
	import ModulePage from '$lib/components/ModulePage.svelte';
	import LrStage from '$lib/components/LrStage.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Slider } from '$lib/components/ui/slider/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { getEngine } from '$lib/engine-loader.js';
	import { Sweep, range } from '$lib/motion.svelte.js';
	import { RATES, PRESETS, SCHEDULES, EPOCHS, TUNE, CAP, trainBase, train, start, percent } from '$lib/lr-sim.js';
	import { where } from '$lib/modules.js';
	import * as copy from '$lib/lr-copy.js';

	let gb = $state.raw(null);
	let base = $state.raw(null);
	let begin = $state.raw(null);
	let rateAt = $state(RATES.indexOf(0.1));
	let schedule = $state('constant');
	// runs[schedule] is one fine-tune per rate, filled in as they train
	let runs = $state.raw({ constant: RATES.map(() => null), linear: RATES.map(() => null), cosine: RATES.map(() => null) });
	let shown = $state(EPOCHS);
	const sweep = new Sweep();

	const rate = $derived(RATES[rateAt]);
	const set = $derived(runs[schedule]);
	const mine = $derived(set[rateAt]);
	const best = $derived(set.every(Boolean) ? Math.min(...set.map((x) => (Number.isFinite(x.loss) ? x.loss : Infinity))) : null);
	const here = where('learning-rate');

	// Each run takes a moment, so they train one per turn: your rate first, then the
	// rest of this schedule, then the other schedules.
	let queue = [];
	let busy = false;
	function enqueue(s, first) {
		const order = [first, ...RATES.keys()].filter((i, k, all) => all.indexOf(i) === k);
		queue = [...order.map((i) => [s, i]), ...queue.filter(([qs]) => qs !== s)];
		if (!busy) pump();
	}
	function pump() {
		busy = true;
		const job = queue.find(([s, i]) => !runs[s][i]);
		if (!job || !gb) return (busy = false);
		queue = queue.filter((j) => j !== job);
		const [s, i] = job;
		const done = train(gb, base, RATES[i], s);
		runs = { ...runs, [s]: runs[s].map((x, j) => (j === i ? done : x)) };
		setTimeout(pump, 0);
	}

	onMount(() => {
		getEngine().then((engine) => {
			gb = engine;
			base = trainBase(engine);
			begin = start(engine, base);
			enqueue('constant', rateAt);
			for (const s of SCHEDULES) if (s !== 'constant') queue.push(...RATES.map((_, i) => [s, i]));
		});
		return () => sweep.stop();
	});

	// a new rate or schedule trains its own run first
	$effect(() => {
		if (gb && base && !runs[schedule][rateAt]) enqueue(schedule, rateAt);
	});

	// training, pass by pass
	const playSweep = () => sweep.toggle(range(0, EPOCHS, EPOCHS + 1), 70, (n) => (shown = n));
	function settle() {
		sweep.stop();
		shown = EPOCHS;
	}
	const preset = (p) => (settle(), (rateAt = RATES.indexOf(p.rate)));
	const falling = $derived(mine ? mine.curve[EPOCHS - 10] - mine.loss > 0.1 : false);
	const show = (v) => (Number.isFinite(v) && v <= CAP ? v.toFixed(2) : `more than ${CAP}`);
</script>

<svelte:head><title>Learning rate · Glass Box</title></svelte:head>

<ModulePage
	track={here.track.title}
	n={here.n}
	total={here.total}
	tag={here.tag}
	title="How big a step should training take?"
	lead="Training nudges a model's numbers a little after every example, and the learning rate sets how big each nudge is. Too small and the model barely learns; too big and it overshoots. Pick a rate and a schedule and watch the model learn the new text."
	whyLead={copy.whyLead}
>
	{#snippet presets()}
		<p class="mb-2 text-xs text-muted-foreground">The Millbrook model again, learning "{TUNE.label.toLowerCase()}" with three step sizes:</p>
		<div class="mb-3.5 grid gap-2.5 md:grid-cols-3">
			{#each PRESETS as p (p.label)}
				<button
					type="button"
					onclick={() => preset(p)}
					class="rounded-lg border bg-sidebar px-3.5 py-3 text-left text-sm text-muted-foreground transition-colors hover:border-foreground/40 {rate === p.rate ? 'border-foreground bg-muted' : ''}"
				>
					<b class="block font-medium text-foreground">{p.label}</b>
					<span class="mt-0.5 block text-xs">learning_rate {p.rate}</span>
				</button>
			{/each}
		</div>
	{/snippet}

	{#snippet stage()}
		<LrStage {rate} {schedule} runs={set} {begin} {shown} play={{ playing: sweep.playing, label: 'Train', onclick: playSweep, disabled: !mine }} />
	{/snippet}

	{#snippet legend()}
		<div class="flex flex-wrap gap-x-5 gap-y-1">
			<span><span class="mr-1.5 inline-block h-2 w-4 rounded-sm bg-foreground/80 align-middle"></span>After training, or the new text</span>
			<span><span class="mr-1.5 inline-block h-2 w-4 rounded-sm border border-muted-foreground align-middle"></span>Before, or the Millbrook text it knew</span>
			<span>Loss: how surprised the model is by a text. Lower is better.</span>
		</div>
	{/snippet}

	{#snippet controls()}
		<div class="grid gap-x-8 gap-y-5 md:grid-cols-2">
			<div>
				<div class="mb-2 flex justify-between text-xs text-muted-foreground">
					<span>learning_rate: {rate}</span><span>how big each step is</span>
				</div>
				<Slider type="single" bind:value={rateAt} min={0} max={RATES.length - 1} step={1} onValueChange={settle} />
				<div class="relative mt-2 h-4 text-xs text-muted-foreground">
					{#each RATES as r, i (r)}
						{#if [0.001, 0.01, 0.1, 1].includes(r) || i === RATES.length - 1}
							<span class="absolute -translate-x-1/2" style="left: calc(8px + (100% - 16px) * {i / (RATES.length - 1)})">{r}</span>
						{/if}
					{/each}
				</div>
			</div>
			<div>
				<div class="mb-2 text-xs text-muted-foreground">lr_scheduler_type: how the step changes over training</div>
				<div class="flex flex-wrap gap-1.5">
					{#each SCHEDULES as s (s)}
						<Button size="sm" variant={schedule === s ? 'default' : 'outline'} onclick={() => (settle(), (schedule = s))}>{s}</Button>
					{/each}
				</div>
			</div>
		</div>
	{/snippet}

	{#snippet say()}
		{#if mine && begin}
			<p class="leading-relaxed">
				<b class="font-medium">
					After {EPOCHS} passes at learning_rate {rate} ({schedule}), the loss on the new text went from {begin.loss.toFixed(2)} to {show(mine.loss)}.
				</b>
				{copy.say({ loss: mine.loss, best: best ?? mine.loss, rate, falling })}
			</p>
			<p class="mt-1 text-sm text-muted-foreground">{copy.trap(schedule, rate)}</p>
		{:else}
			<p class="text-muted-foreground">Training the model…</p>
		{/if}
	{/snippet}

	{#snippet cards()}
		<div class="mb-4 grid gap-3.5 md:grid-cols-3">
			{#each [{ title: 'Loss on the new text', value: mine ? show(mine.loss) : '–', share: mine && begin ? Math.min(1, (Number.isFinite(mine.loss) ? mine.loss : CAP) / begin.loss) : 0, text: `From ${begin ? begin.loss.toFixed(2) : '–'} before training. Lower is better.` }, { title: 'Loss on the Millbrook text', value: mine ? show(mine.old) : '–', share: mine ? Math.min(1, (Number.isFinite(mine.old) ? mine.old : CAP) / CAP) : 0, text: `What it knew, from ${begin ? begin.old.toFixed(2) : '–'}. Higher means it forgot more.` }, { title: 'Step at the last pass', value: gb ? String(+gb.lrAt(rate, schedule, EPOCHS - 1, EPOCHS).toPrecision(2)) : '–', share: gb ? gb.lrAt(rate, schedule, EPOCHS - 1, EPOCHS) / rate : 0, text: schedule === 'constant' ? 'Constant: the same step to the end.' : `Down from ${rate}: ${schedule} decay.` }] as c (c.title)}
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
				<p class="max-w-3xl text-sm text-muted-foreground">Open Under the hood for the step formula and the schedules, with your numbers.</p>
			</Tabs.Content>
			<Tabs.Content value="hood">
				{#if gb}
					<div class="space-y-2 rounded-lg border px-4 py-3.5 text-sm">
						<div class="text-muted-foreground">Each step: every number −= step × how much the loss changes when that number grows (its gradient).</div>
						<div class="text-muted-foreground">The step at pass e of {EPOCHS}: constant keeps the learning rate; linear multiplies it by (1 − e ÷ {EPOCHS}); cosine by (1 + cos(π × e ÷ {EPOCHS})) ÷ 2.</div>
						<div class="font-mono text-xs tabular-nums">
							{schedule}, learning_rate {rate}: pass 1 → {+gb.lrAt(rate, schedule, 0, EPOCHS).toPrecision(3)}, pass 30 → {+gb.lrAt(rate, schedule, 29, EPOCHS).toPrecision(3)}, pass 60 → {+gb.lrAt(rate, schedule, 59, EPOCHS).toPrecision(3)}
						</div>
						<div class="text-muted-foreground">Loss: the average of −ln(the odds the model gave the word that really came next). 0 means it was always sure and right.</div>
						<p class="pt-2 text-xs text-muted-foreground">{copy.hoodNote}</p>
					</div>
				{/if}
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
		Every number on this page comes from a C engine compiled to WebAssembly, which trains the network in your browser. It is the LoRA page's tiny word-pair
		network, trained on twenty made-up sentences, so its learning rates are far larger than a real model's.
	{/snippet}
</ModulePage>
