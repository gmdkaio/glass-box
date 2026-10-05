<script>
	import { onMount } from 'svelte';
	import ModulePage from '$lib/components/ModulePage.svelte';
	import Stage from '$lib/components/Stage.svelte';
	import TradeoffChart from '$lib/components/TradeoffChart.svelte';
	import AnswerExample from '$lib/components/AnswerExample.svelte';
	import WordExample from '$lib/components/WordExample.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Slider } from '$lib/components/ui/slider/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { getEngine } from '$lib/engine-loader.js';
	import {
		STOPS,
		formatCount,
		makeWeights,
		makePoint,
		errorSeries,
		compute
	} from '$lib/quantization-sim.js';
	import { where } from '$lib/modules.js';
	import * as copy from '$lib/quantization-copy.js';

	let gb = $state.raw(null);
	let w = $state.raw(null);
	let series = $state.raw(null);
	let t = $state.raw(Float64Array.from([0.55, -0.35, 0.8, -0.6]));
	// the slider moves over the stops, so bits follows the stop index
	let stop = $state(STOPS.indexOf(4));
	const bits = $derived(STOPS[stop]);
	let sweeping = $state(false);
	let seed = 10;
	let timer;

	const data = $derived(gb && w ? compute(gb, w, t, bits) : null);

	onMount(() => {
		getEngine().then((engine) => {
			gb = engine;
			w = makeWeights(engine);
			series = errorSeries(engine, w);
		});
		return () => clearInterval(timer);
	});

	function stopSweep() {
		clearInterval(timer);
		sweeping = false;
	}

	// walks the stops from the original size down to 1 bit, one second each
	function toggleSweep() {
		if (sweeping) return stopSweep();
		stop = STOPS.length - 1;
		sweeping = true;
		timer = setInterval(() => {
			if (stop === 0) stopSweep();
			else stop -= 1;
		}, 1000);
	}

	function shuffle() {
		seed += 1;
		t = makePoint(gb, seed);
	}

	const plural = (n) => (n === 1 ? '' : 's');
	const here = where('quantization');
</script>

<svelte:head><title>Shrinking a model · Glass Box</title></svelte:head>

<ModulePage
	track={here.track.title}
	n={here.n}
	total={here.total}
	tag={here.tag}
	title="What happens when an AI model is shrunk?"
	lead="A model is a huge pile of numbers. To make it small enough for a laptop or a phone, each number is rounded to fewer allowed values. Pick a size and watch what rounding does."
	whyLead={copy.whyNote}
>
	{#snippet presets()}
		<div class="mb-3.5 grid grid-cols-2 gap-2.5 md:grid-cols-5">
			{#each copy.sizes as size (size.bits)}
				<button
					type="button"
					onclick={() => {
						stopSweep();
						stop = STOPS.indexOf(size.bits);
					}}
					class="rounded-lg border bg-sidebar px-3.5 py-3 text-left text-sm text-muted-foreground transition-colors hover:border-foreground/40 {bits ===
					size.bits
						? 'border-foreground bg-muted'
						: ''}"
				>
					<b class="block font-medium text-foreground">{size.label}</b>
					{size.detail}
					{#if size.note}<span class="mt-1 block text-xs">{size.note}</span>{/if}
				</button>
			{/each}
		</div>
	{/snippet}

	{#snippet stage()}
		<Stage {w} {t} {data} />
	{/snippet}

	{#snippet legend()}
		<div class="flex flex-wrap gap-x-5 gap-y-1">
			<span><span class="mr-1.5 inline-block size-2 rounded-full border border-muted-foreground"></span>Original value</span>
			<span><span class="mr-1.5 inline-block size-2 rounded-full bg-foreground"></span>After rounding</span>
			<span><span class="mr-1.5 inline-block size-2 rounded-full bg-muted-foreground"></span>Allowed results</span>
		</div>
	{/snippet}

	{#snippet controls()}
		<div class="flex flex-wrap items-center gap-4">
			<div class="min-w-64 flex-1">
				<div class="mb-2 flex justify-between text-xs text-muted-foreground">
					<span>Tiny model</span>
					<span>Precision: {bits} bit{plural(bits)}</span>
					<span>Original size</span>
				</div>
				<Slider type="single" bind:value={stop} min={0} max={STOPS.length - 1} step={1} onValueChange={stopSweep} />
				<div class="relative mt-2 h-4 text-xs text-muted-foreground">
					{#each STOPS as s, i (s)}
						<span
							class="absolute -translate-x-1/2 {i === stop ? 'text-foreground' : ''}"
							style="left: calc(8px + (100% - 16px) * {i / (STOPS.length - 1)})"
						>
							{s}
						</span>
					{/each}
				</div>
			</div>
			<Button onclick={toggleSweep}>{sweeping ? 'Stop' : 'Shrink it step by step'}</Button>
			<Button variant="outline" onclick={shuffle} disabled={!gb}>New random numbers</Button>
		</div>
	{/snippet}

	{#snippet say()}
		{#if data}
			<p class="leading-relaxed">
				<b class="font-medium">At {bits} bit{plural(bits)}, each number can take {formatCount(data.levels)} values.</b>
				{copy.say(bits)}
			</p>
			<p class="mt-1 text-sm text-muted-foreground">{copy.trap(bits)}</p>
		{:else}
			<p class="text-muted-foreground">Loading the engine…</p>
		{/if}
	{/snippet}

	{#snippet example()}
		{#if gb}
			<div class="mb-4">
				<Tabs.Root value="numbers">
					<Tabs.List>
						<Tabs.Trigger value="numbers">Example with numbers</Tabs.Trigger>
						<Tabs.Trigger value="words">Example with words</Tabs.Trigger>
					</Tabs.List>
					<Tabs.Content value="numbers"><AnswerExample {gb} {bits} /></Tabs.Content>
					<Tabs.Content value="words"><WordExample {gb} {bits} /></Tabs.Content>
				</Tabs.Root>
			</div>
		{/if}
	{/snippet}

	{#snippet cards()}
		<div class="mb-4 grid gap-3.5 md:grid-cols-3">
			<div class="rounded-lg border px-4 py-3.5">
				<h3 class="text-xs font-medium">Original quality kept</h3>
				<div class="mt-1 text-3xl font-semibold tracking-tight">{data ? (data.kept * 100).toFixed(1) : '–'}%</div>
				<p class="text-xs text-muted-foreground">How much of the original numbers survive rounding.</p>
				<div class="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
					<div class="h-full bg-foreground transition-[width]" style="width: {data ? data.kept * 100 : 0}%"></div>
				</div>
			</div>
			<div class="rounded-lg border px-4 py-3.5">
				<h3 class="text-xs font-medium">Memory needed</h3>
				<div class="mt-1 text-3xl font-semibold tracking-tight">{data ? Math.round(data.memory * 100) : '–'}%</div>
				<p class="text-xs text-muted-foreground">Compared with 16 bits, a common size for the original.</p>
				<div class="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
					<div class="h-full bg-foreground transition-[width]" style="width: {data ? data.memory * 100 : 0}%"></div>
				</div>
			</div>
			<div class="rounded-lg border px-4 py-3.5">
				<h3 class="text-xs font-medium">Distance to the nearest allowed point</h3>
				<div class="mt-1 text-3xl font-semibold tracking-tight">{data ? data.dist.toFixed(2) : '–'}</div>
				<p class="text-xs text-muted-foreground">
					{data ? `At 1 bit the same four numbers are ${data.dist1.toFixed(2)} away.` : ''}
				</p>
				<div class="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
					<div
						class="h-full bg-foreground transition-[width]"
						style="width: {data ? Math.min(100, (data.dist / data.dist1) * 100) : 0}%"
					></div>
				</div>
			</div>
		</div>
	{/snippet}

	{#snippet explain()}
		<div class="mb-4 grid gap-3.5 md:grid-cols-3">
			<div class="rounded-lg border px-4 py-3.5">
				<h3 class="mb-1.5 text-xs font-medium">How to read the picture</h3>
				<p class="text-sm leading-relaxed text-muted-foreground">
					Left: every dot moves to the closest allowed value, and the line shows how far. Middle and right: the same idea for four numbers, shown as one point inside a four-dimensional box. The ring is your four numbers and the solid dot is where rounding sends them.
				</p>
			</div>
			<div class="rounded-lg border px-4 py-3.5">
				<h3 class="mb-1.5 text-xs font-medium">Size against error</h3>
				{#if series}<TradeoffChart {series} {bits} />{/if}
				<p class="text-xs text-muted-foreground">Solid: memory. Dashed: rounding error. The rings mark your setting.</p>
			</div>
			<div class="rounded-lg border px-4 py-3.5">
				<h3 class="mb-1.5 text-xs font-medium">The trap</h3>
				<p class="text-sm leading-relaxed text-muted-foreground">
					Fewer bits means fewer values to choose from, so each number lands further from where it should be, and the model's answers depend on those exact values.
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
					Open Under the hood to see the formulas with the numbers from your current setting.
				</p>
			</Tabs.Content>
			<Tabs.Content value="hood">
				<div class="rounded-lg border px-4 py-3.5 text-sm leading-8">
					{#if data}
						<div><span class="text-muted-foreground">allowed values</span> 2^b = 2^{bits} = {formatCount(data.levels)}</div>
						<div>
							<span class="text-muted-foreground">step size</span> d = 2m / 2^b, with m = {data.maxAbs.toFixed(3)} the largest weight, so d = {data.delta.toFixed(4)}
						</div>
						<div>
							<span class="text-muted-foreground">average error</span> d² / 12 = {data.theory.toExponential(2)} (measured {data.mse.toExponential(2)})
						</div>
						<div>
							<span class="text-muted-foreground">results for 4 numbers</span> (2^b)^4 = {formatCount(data.count)}
						</div>
						<div><span class="text-muted-foreground">each bit removed</span> error about 4 times bigger, memory half</div>
					{/if}
					<p class="mt-2 text-xs text-muted-foreground">
						This is the simplest uniform quantizer. The d² / 12 rule assumes weights spread evenly over the range, and an outlier breaks it. Real LLM schemes are more careful. {copy.floatNote}
					</p>
				</div>
			</Tabs.Content>
		</Tabs.Root>
	{/snippet}

	{#snippet why()}
		<div class="grid gap-3.5 md:grid-cols-3">
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
		Every number on this page comes from a C engine compiled to WebAssembly. The toy model has 90 numbers, real models have billions.
	{/snippet}
</ModulePage>
