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
	import * as copy from '$lib/context-copy.js';

	let gb = $state.raw(null);
	let n = $state(SETUPS[1].n);
	let place = $state(SETUPS[1].place);
	let lookalikes = $state(SETUPS[1].lookalikes);
	let middle = $state(true);
	let seed = $state(1);

	const alike = $derived(Math.min(lookalikes, n - 1));
	const keyAt = $derived(gb ? gb.contextPlace(n, place) : 0);
	const sentences = $derived(gb ? sampleContext(gb, n, keyAt, alike, middle, seed) : null);
	const shares = $derived(gb ? averageShares(gb, n, keyAt, alike, middle) : null);
	const lengths = $derived(gb ? lengthCurve(gb, place, alike, middle) : null);
	const places = $derived(gb ? placeCurve(gb, n, alike, middle) : null);
	const here = where('context');
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

	const placeName = (v) => (v <= 0.1 ? 'at the start' : v >= 0.9 ? 'at the end' : v > 0.3 && v < 0.7 ? 'in the middle' : v < 0.5 ? 'near the start' : 'near the end');
</script>

<svelte:head><title>Context · Glass Box</title></svelte:head>

<ModulePage
	track={here.track.title}
	n={here.n}
	total={here.total}
	tag={here.tag}
	title="Why can more text make the answer count for less?"
	lead="Before it answers, a model weighs every part of what you gave it against the question, and those weights are shares of one whole. Paste more, and the sentence that holds the answer gets a smaller slice, especially when other sentences look like it or it sits in the middle."
	whyLead={copy.whyLead}
>
	{#snippet presets()}
		<p class="mb-2 text-xs text-muted-foreground">Three ways of giving the model the store's policy along with your question:</p>
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
					<b class="block font-medium text-foreground">{s.label}</b>
					<span class="mt-0.5 block text-xs">{s.hint}, {s.n} sentences</span>
				</button>
			{/each}
		</div>
	{/snippet}

	{#snippet stage()}
		<ContextStage {sentences} {lengths} {places} {n} {place} pace={sweep.playing ? 260 : 450} />
	{/snippet}

	{#snippet legend()}
		<div class="flex flex-wrap gap-x-5 gap-y-1">
			<span><span class="mr-1.5 inline-block h-2 w-4 rounded-sm bg-foreground align-middle"></span>The answer ✓</span>
			<span><span class="mr-1.5 inline-block h-2 w-4 rounded-sm bg-muted-foreground align-middle"></span>Look-alikes</span>
			<span><span class="mr-1.5 inline-block h-2 w-4 rounded-sm bg-muted-foreground/35 align-middle"></span>Everything else</span>
		</div>
	{/snippet}

	{#snippet controls()}
		<div class="grid gap-x-8 gap-y-5 md:grid-cols-2">
			<div>
				<div class="mb-2 flex justify-between text-xs text-muted-foreground">
					<span>Sentences in the context: {n}</span>
					<span>1 to {MAX_SENTENCES}</span>
				</div>
				<Slider type="single" bind:value={n} min={1} max={MAX_SENTENCES} step={1} onValueChange={() => sweep.stop()} />
			</div>
			<div>
				<div class="mb-2 flex justify-between text-xs text-muted-foreground">
					<span>The answer sits {placeName(place)}</span>
					<span>start to end</span>
				</div>
				<Slider type="single" bind:value={place} min={0} max={1} step={0.05} onValueChange={() => sweep.stop()} />
			</div>
			<div>
				<div class="mb-2 flex justify-between text-xs text-muted-foreground">
					<span>Look-alike sentences: {alike}</span>
					<span>0 to {MAX_LOOKALIKES}</span>
				</div>
				<Slider type="single" bind:value={lookalikes} min={0} max={MAX_LOOKALIKES} step={1} onValueChange={() => sweep.stop()} />
			</div>
			<div>
				<div class="mb-2 text-xs text-muted-foreground">The middle gets less attention</div>
				<div class="flex flex-wrap gap-1.5">
					<Button size="sm" variant={middle ? 'default' : 'outline'} onclick={() => (middle = true)}>On</Button>
					<Button size="sm" variant={middle ? 'outline' : 'default'} onclick={() => (middle = false)}>Off</Button>
					<span class="w-3"></span>
					<Button size="sm" onclick={() => sweep.toggle(SWEEP_LENGTHS, 240, (v) => (n = v))} disabled={!gb}>{sweep.playing ? 'Stop' : 'Keep pasting'}</Button>
					<Button size="sm" variant="outline" onclick={() => (seed += 1)} disabled={!gb} title="Shuffle the other sentences">Shuffle</Button>
				</div>
			</div>
		</div>
	{/snippet}

	{#snippet say()}
		{#if shares}
			<p class="leading-relaxed">
				<b class="font-medium">
					With {n} {n === 1 ? 'sentence' : 'sentences'} and the answer {placeName(place)}, the answer gets about {percent(shares.key)} of the attention.
				</b>
				{copy.say(shares.key)}
			</p>
			<p class="mt-1 text-sm text-muted-foreground">{copy.trap(alike, middle, place)}</p>
		{:else}
			<p class="text-muted-foreground">Loading the engine…</p>
		{/if}
	{/snippet}

	{#snippet cards()}
		<div class="mb-4 grid gap-3.5 md:grid-cols-3">
			{#each [{ title: 'Attention on the answer', key: 'key', text: 'The one sentence that says when the store closes on Sundays.' }, { title: 'Attention on look-alikes', key: 'lookalike', text: 'Sentences about other days, other shops and other closing times.' }, { title: 'Attention on everything else', key: 'filler', text: 'Returns, gift cards, delivery: each takes a sliver.' }] as card (card.key)}
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
					Open Under the hood to see how the scores are made and turned into shares.
				</p>
			</Tabs.Content>
			<Tabs.Content value="hood">
				<div class="space-y-2 rounded-lg border px-4 py-3.5 text-sm">
					<div class="text-muted-foreground">Each sentence gets a score for how well it matches the question:</div>
					<ul class="list-inside list-disc text-muted-foreground">
						<li>the answer: {SCORE.key}</li>
						<li>a look-alike: {SCORE.lookalike}</li>
						<li>anything else: random, around 0, give or take {SCORE.spread}</li>
						<li>
							{middle
								? `then every sentence loses up to ${SCORE.dip} for sitting in the middle: ${SCORE.dip} × 4x(1 − x), x from 0 (first) to 1 (last)`
								: 'the middle dip is off, so place does not matter'}
						</li>
					</ul>
					<div class="pt-1 text-muted-foreground">
						share = e<sup>score</sup>, divided by the sum of that over every sentence (softmax, the same formula as in Why answers vary).
					</div>
					{#if sentences}
						{@const key = sentences.find((s) => s.kind === 'key')}
						{@const sum = sentences.reduce((a, s) => a + Math.exp(s.score), 0)}
						<div class="tabular-nums">
							In the context above the answer scores {key.score.toFixed(2)}, so e<sup>{key.score.toFixed(2)}</sup> = {Math.exp(key.score).toFixed(1)}. The sum over all
							{sentences.length} sentences is {sum.toFixed(1)}, and {Math.exp(key.score).toFixed(1)} / {sum.toFixed(1)} = {percent(key.share)}.
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
		Every score and share on this page comes from a C engine compiled to WebAssembly. The scores are made up to stand for how well each sentence matches the question; a real model works them out word by word.
	{/snippet}
</ModulePage>
