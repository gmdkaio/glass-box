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
	import * as copy from '$lib/compounding-copy.js';

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

	onMount(() => {
		getEngine().then((engine) => (gb = engine));
		return () => clearInterval(timer);
	});

	// a run belongs to the settings it was made with, so changing them clears it
	$effect(() => {
		p;
		steps;
		every;
		catchRate;
		clearInterval(timer);
		run = null;
		shown = 0;
	});

	// plays the run back one event at a time, in about two and a half seconds
	function runOne() {
		clearInterval(timer);
		seed += 1;
		run = gb.chainTrace(p, steps, every, catchRate, RETRIES, seed);
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
	track={here.track.title}
	n={here.n}
	total={here.total}
	tag={here.tag}
	title="Why do long tasks go wrong more often?"
	lead="Every step a model takes is a small chance to slip, and one wrong step spoils everything built on it. The chances multiply, so a model that is right 95% of the time per step finishes a 20-step task cleanly about a third of the time. Checks between steps win most of that back."
	whyLead={copy.whyLead}
>
	{#snippet presets()}
		<p class="mb-2 text-xs text-muted-foreground">Pick a task size. {copy.stepNote}</p>
		<div class="mb-3.5 grid gap-2.5 md:grid-cols-3">
			{#each TASKS as t (t.label)}
				<button
					type="button"
					onclick={() => (steps = t.steps)}
					class="rounded-lg border bg-sidebar px-3.5 py-3 text-left text-sm text-muted-foreground transition-colors hover:border-foreground/40 {steps ===
					t.steps
						? 'border-foreground bg-muted'
						: ''}"
				>
					<b class="block font-medium text-foreground">{t.label}</b>
					<span class="mt-0.5 block text-xs">{t.hint}, about {t.steps} steps</span>
				</button>
			{/each}
		</div>
	{/snippet}

	{#snippet stage()}
		<ChainStage {steps} {every} {run} {shown} {trials} {odds} {points} />
	{/snippet}

	{#snippet legend()}
		<div class="flex flex-wrap gap-x-5 gap-y-1">
			<span><span class="mr-1.5 inline-block h-2.5 w-2.5 rounded-[2px] bg-foreground/80 align-middle"></span>Right</span>
			<span><span class="mr-1.5 inline-block h-2.5 w-2.5 rounded-[2px] border-2 border-foreground align-middle"></span>Wrong</span>
			<span><span class="mr-1.5 inline-block h-2.5 w-2.5 rounded-[2px] border border-dashed border-foreground/70 align-middle"></span>Being redone</span>
			<span><span class="mr-1.5 inline-block h-2.5 w-2.5 rounded-[2px] bg-foreground/25 align-middle"></span>Built on a mistake</span>
			<span>✓ check passed · ↺ check caught a mistake · ✗ check missed one</span>
		</div>
	{/snippet}

	{#snippet controls()}
		<div class="grid gap-x-8 gap-y-5 md:grid-cols-2">
			<div>
				<div class="mb-2 flex justify-between text-xs text-muted-foreground">
					<span>Right per step: {accuracy.toFixed(1)}%</span>
					<span>80% to 99.9%</span>
				</div>
				<Slider type="single" bind:value={accuracy} min={80} max={99.9} step={0.1} />
			</div>
			<div>
				<div class="mb-2 flex justify-between text-xs text-muted-foreground">
					<span>Steps in the task: {steps}</span>
					<span>1 to {MAX_STEPS}</span>
				</div>
				<Slider type="single" bind:value={steps} min={1} max={MAX_STEPS} step={1} />
			</div>
			<div>
				<div class="mb-2 text-xs text-muted-foreground">Checks between steps</div>
				<div class="flex flex-wrap gap-1.5">
					{#each CHECKS as c, i (c.label)}
						<Button size="sm" variant={checkIndex === i ? 'default' : 'outline'} onclick={() => (checkIndex = i)}>{c.label}</Button>
					{/each}
				</div>
			</div>
			<div class={every === 0 ? 'opacity-50' : ''}>
				<div class="mb-2 flex justify-between text-xs text-muted-foreground">
					<span>A check catches {catchPercent}% of mistakes</span>
					<span>redoes a section up to {RETRIES} times</span>
				</div>
				<Slider type="single" bind:value={catchPercent} min={0} max={100} step={5} disabled={every === 0} />
			</div>
		</div>
		<div class="mt-5 flex flex-wrap gap-2.5">
			<Button onclick={runOne} disabled={!gb}>Run one task</Button>
		</div>
	{/snippet}

	{#snippet say()}
		{#if odds !== null}
			<p class="leading-relaxed">
				<b class="font-medium">
					At {accuracy.toFixed(1)}% per step, a {steps}-step task finishes without a mistake {percent(odds)} of the time{every > 0
						? `, or ${percent(plain)} without the checks`
						: ''}.
				</b>
				{copy.say(odds)}
			</p>
			<p class="mt-1 text-sm text-muted-foreground">{copy.trap(every, plain, odds)}</p>
		{:else}
			<p class="text-muted-foreground">Loading the engine…</p>
		{/if}
	{/snippet}

	{#snippet cards()}
		<div class="mb-4 grid gap-3.5 md:grid-cols-3">
			<div class="rounded-lg border px-4 py-3.5">
				<h3 class="text-xs font-medium">Chance of a clean finish</h3>
				<div class="mt-1 text-3xl font-semibold tracking-tight">{odds !== null ? percent(odds) : '–'}</div>
				<p class="text-xs text-muted-foreground">Every step right, or every mistake caught and redone.</p>
				<div class="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
					<div class="h-full bg-foreground transition-[width]" style="width: {(odds ?? 0) * 100}%"></div>
				</div>
			</div>
			<div class="rounded-lg border px-4 py-3.5">
				<h3 class="text-xs font-medium">The same task with no checks</h3>
				<div class="mt-1 text-3xl font-semibold tracking-tight">{plain !== null ? percent(plain) : '–'}</div>
				<p class="text-xs text-muted-foreground">{accuracy.toFixed(1)}% multiplied by itself {steps} times.</p>
				<div class="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
					<div class="h-full bg-foreground transition-[width]" style="width: {(plain ?? 0) * 100}%"></div>
				</div>
			</div>
			<div class="rounded-lg border px-4 py-3.5">
				<h3 class="text-xs font-medium">What the checks cost</h3>
				<div class="mt-1 text-3xl font-semibold tracking-tight">
					{trials && every > 0 ? `+${percent(trials.redone / steps)}` : '–'}
				</div>
				<p class="text-xs text-muted-foreground">
					{every > 0
						? `Steps thrown away and done again, about ${trials ? trials.redone.toFixed(1) : '–'} per run.`
						: 'Nothing, and nothing is caught. Turn on checks to compare.'}
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
			<h3 class="mb-1.5 text-xs font-medium">The trap</h3>
			<p class="text-sm leading-relaxed text-muted-foreground">{copy.trapCard}</p>
		</div>

		<Tabs.Root value="simple">
			<Tabs.List>
				<Tabs.Trigger value="simple">Simple</Tabs.Trigger>
				<Tabs.Trigger value="hood">Under the hood</Tabs.Trigger>
			</Tabs.List>
			<Tabs.Content value="simple">
				<p class="max-w-3xl text-sm text-muted-foreground">
					Open Under the hood to see the formula with the numbers from your current setting.
				</p>
			</Tabs.Content>
			<Tabs.Content value="hood">
				<div class="space-y-2 rounded-lg border px-4 py-3.5 text-sm">
					<div class="text-muted-foreground">No checks: chance of a clean finish = p<sup>n</sup>, p right per step, n steps.</div>
					{#if plain !== null}
						<div class="tabular-nums">{p.toFixed(3)}<sup>{steps}</sup> = {plain.toFixed(4)}</div>
					{/if}
					<div class="pt-2 text-muted-foreground">
						With checks: split the task into sections of k steps. A section is right first time with q = p<sup>k</sup>. A wrong one is caught with chance c and redone, up to r times, so it passes with
						q × (1 + m + m<sup>2</sup> + … + m<sup>r</sup>), where m = (1 − q) × c. The task passes if every section does.
					</div>
					{#if every > 0 && odds !== null}
						{@const q = p ** every}
						{@const m = (1 - q) * catchRate}
						<div class="tabular-nums">
							k = {every}, q = {q.toFixed(4)}, c = {catchRate.toFixed(2)}, m = {m.toFixed(4)}, r = {RETRIES} → the task passes {odds.toFixed(4)}
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
		Every chance and every run on this page comes from a C engine compiled to WebAssembly. The steps are independent and equally reliable, which real tasks are not.
	{/snippet}
</ModulePage>
