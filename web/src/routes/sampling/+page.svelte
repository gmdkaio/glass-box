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
		PROMPTS,
		T_MAX,
		DRAWS,
		curve,
		pickWord,
		percent
	} from '$lib/sampling-sim.js';
	import { where } from '$lib/modules.js';
	import * as copy from '$lib/sampling-copy.js';

	let gb = $state.raw(null);
	let promptIndex = $state(1);
	let variety = $state(1);
	let picks = $state.raw([]);
	let counts = $state.raw(null);
	let seed = 0;

	const prompt = $derived(PROMPTS[promptIndex]);
	const odds = $derived(gb ? gb.softmax(prompt.scores, variety) : null);
	const compare = $derived(gb ? PROMPTS.map((p) => gb.softmax(p.scores, variety)[WANTED]) : null);
	const points = $derived(gb ? curve(gb, prompt.scores) : null);
	const here = where('sampling');

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
	track={here.track.title}
	n={here.n}
	total={here.total}
	tag={here.tag}
	title="Why does the same question give different answers?"
	lead="A language model does not look up one answer. For every possible next word it works out how well that word fits, turns that into odds, and picks one like weighted dice. Change how you ask, and watch the odds move."
	whyLead={copy.whyLead}
>
	{#snippet presets()}
		<p class="mb-2 text-xs text-muted-foreground">Three ways of asking for the same thing, {GOAL}:</p>
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
					<b class="block font-medium text-foreground">{p.label}</b>
					<span class="mt-0.5 block text-xs">"{p.text}"</span>
				</button>
			{/each}
		</div>
	{/snippet}

	{#snippet stage()}
		<SamplingStage {prompt} {promptIndex} {odds} {picks} {counts} {compare} />
	{/snippet}

	{#snippet legend()}
		<div class="flex flex-wrap gap-x-5 gap-y-1">
			<span>✓ = the answer you wanted</span>
			<span><span class="mr-1.5 inline-block h-2 w-4 rounded-sm bg-foreground/80"></span>Odds now, or what came up</span>
			<span><span class="mr-1.5 inline-block h-2 w-4 rounded-sm border border-muted-foreground"></span>The odds, for comparison</span>
		</div>
	{/snippet}

	{#snippet controls()}
		<div class="flex flex-wrap items-center gap-4">
			<div class="min-w-64 flex-1">
				<div class="mb-2 flex justify-between text-xs text-muted-foreground">
					<span>Always the top pick</span>
					<span>Variety: {variety.toFixed(1)}</span>
					<span>More surprising</span>
				</div>
				<Slider type="single" bind:value={variety} min={0} max={T_MAX} step={0.1} />
				<div class="relative mt-2 h-4 text-xs text-muted-foreground">
					{#each [0, 1, 2, 3] as tick (tick)}
						<span class="absolute -translate-x-1/2" style="left: calc(8px + (100% - 16px) * {tick / T_MAX})">{tick}</span>
					{/each}
				</div>
				<p class="mt-1 text-xs text-muted-foreground">{copy.varietyNote}</p>
			</div>
			<Button onclick={drawOne} disabled={!gb}>Draw one</Button>
			<Button onclick={runMany} disabled={!gb}>Run {DRAWS.toLocaleString('en-US')} times</Button>
			<Button variant="outline" onclick={clear} disabled={!gb || (picks.length === 0 && !counts)}>Clear</Button>
		</div>
	{/snippet}

	{#snippet say()}
		{#if odds}
			<p class="leading-relaxed">
				<b class="font-medium">With this question the model gives you {GOAL} about {percent(odds[WANTED])} of the time.</b>
				{copy.say(variety, odds[WANTED])}
			</p>
			<p class="mt-1 text-sm text-muted-foreground">{copy.trap(variety)}</p>
		{:else}
			<p class="text-muted-foreground">Loading the engine…</p>
		{/if}
	{/snippet}

	{#snippet cards()}
		<div class="mb-4 grid gap-3.5 md:grid-cols-3">
			<div class="rounded-lg border px-4 py-3.5">
				<h3 class="text-xs font-medium">Chance of the answer you wanted</h3>
				<div class="mt-1 text-3xl font-semibold tracking-tight">{odds ? percent(odds[WANTED]) : '–'}</div>
				<p class="text-xs text-muted-foreground">How often {WORDS[WANTED]} comes up, over many tries.</p>
				<div class="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
					<div class="h-full bg-foreground transition-[width]" style="width: {odds ? odds[WANTED] * 100 : 0}%"></div>
				</div>
			</div>
			<div class="rounded-lg border px-4 py-3.5">
				<h3 class="text-xs font-medium">Chance of a different answer</h3>
				<div class="mt-1 text-3xl font-semibold tracking-tight">{odds ? percent(1 - odds[WANTED]) : '–'}</div>
				<p class="text-xs text-muted-foreground">Any other word, including near misses.</p>
				<div class="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
					<div class="h-full bg-foreground transition-[width]" style="width: {odds ? (1 - odds[WANTED]) * 100 : 0}%"></div>
				</div>
			</div>
			<div class="rounded-lg border px-4 py-3.5">
				<h3 class="text-xs font-medium">Chance of nonsense</h3>
				<div class="mt-1 text-3xl font-semibold tracking-tight">{odds ? percent(odds[SILLY]) : '–'}</div>
				<p class="text-xs text-muted-foreground">The chance of picking {WORDS[SILLY]}.</p>
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
				<h3 class="mb-2 text-xs font-medium">What shapes the odds</h3>
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
				<h3 class="mb-1.5 text-xs font-medium">What the variety dial does</h3>
				<OddsCurve {points} {variety} {odds} />
			</div>
			<div class="rounded-lg border px-4 py-3.5">
				<h3 class="mb-1.5 text-xs font-medium">The trap</h3>
				<p class="text-sm leading-relaxed text-muted-foreground">
					Variety 0 gives the same answer every time, which feels trustworthy. But it is the model repeating its top pick. If that pick is wrong, it is wrong every time. What helps is the question you ask, and checking the answer.
				</p>
			</div>
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
				<div class="rounded-lg border px-4 py-3.5 text-sm">
					<div class="text-muted-foreground">
						odds = e^(score / T), divided by the sum of that over all the words. T is the variety setting, called temperature.
					</div>
					{#if odds}
						<div class="mt-3 grid grid-cols-[7rem_1fr_1fr_1fr] gap-y-1.5 leading-6">
							<span class="text-xs text-muted-foreground">word</span>
							<span class="text-xs text-muted-foreground">score</span>
							<span class="text-xs text-muted-foreground">score / T</span>
							<span class="text-xs text-muted-foreground">odds</span>
							{#each WORDS as word, i (word)}
								<span>{word}</span>
								<span class="tabular-nums">{prompt.scores[i].toFixed(1)}</span>
								<span class="tabular-nums">{variety === 0 ? '–' : (prompt.scores[i] / variety).toFixed(2)}</span>
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
		Every number on this page comes from a C engine compiled to WebAssembly. The scores are made up for three questions, and a real model scores tens of thousands of words.
	{/snippet}
</ModulePage>
