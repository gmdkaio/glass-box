<script>
	import { onMount } from 'svelte';
	import ModulePage from '$lib/components/ModulePage.svelte';
	import MemoryStage from '$lib/components/MemoryStage.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Slider } from '$lib/components/ui/slider/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { getEngine } from '$lib/engine-loader.js';
	import { Sweep } from '$lib/motion.svelte.js';
	import { MODELS, BITS, CONTEXTS, CARDS, SETUPS, NATIVE, budget, byBits, byContext, perToken, gbOf, kbOf, tokens } from '$lib/memory-sim.js';
	import { where } from '$lib/modules.js';
	import * as copy from '$lib/memory-copy.js';

	let gb = $state.raw(null);
	let model = $state(SETUPS[1].model);
	let bitsAt = $state(BITS.indexOf(SETUPS[1].bits));
	let contextAt = $state(CONTEXTS.indexOf(SETUPS[1].context));
	let cardAt = $state(CARDS.indexOf(SETUPS[1].card));
	let cacheBits = $state(16);
	const sweep = new Sweep();

	// the sliders move over fixed stops, so each setting follows its stop
	const bits = $derived(BITS[bitsAt]);
	const context = $derived(CONTEXTS[contextAt]);
	const card = $derived(CARDS[cardAt]);

	const b = $derived(gb ? budget(gb, model, bits, context, card, cacheBits) : null);
	const bitsRows = $derived(gb ? byBits(gb, model, card, cacheBits) : null);
	const modelRows = $derived(gb ? MODELS.map((_, i) => budget(gb, i, bits, 1, card, cacheBits)) : null);
	const curve = $derived(gb ? byContext(gb, model, bits) : null);
	const per = $derived(gb ? perToken(gb, cacheBits) : null);
	const weightsOnly = $derived(!!b && b.weights + b.overhead > b.card);
	const here = where('memory');

	onMount(() => {
		getEngine().then((engine) => (gb = engine));
		return () => sweep.stop();
	});

	function setup(s) {
		sweep.stop();
		model = s.model;
		bitsAt = BITS.indexOf(s.bits);
		contextAt = CONTEXTS.indexOf(s.context);
		cardAt = CARDS.indexOf(s.card);
		cacheBits = 16;
	}
	const isSetup = (s) => model === s.model && bits === s.bits && context === s.context && card === s.card && cacheBits === 16;

	// a conversation growing from a short question to the longest the model can take
	const playSweep = () => sweep.toggle(CONTEXTS.map((_, i) => i), 700, (i) => (contextAt = i));
</script>

<svelte:head><title>Fitting in memory · Glass Box</title></svelte:head>

<ModulePage
	track={here.track.title}
	n={here.n}
	total={here.total}
	tag={here.tag}
	title="Will this model run on my machine?"
	lead="To run, a model has to fit in your graphics card's memory: all of its numbers, plus a cache that grows with every token of the conversation. Pick a model, its precision and how long you chat, and see what fills the card."
	whyLead={copy.whyLead}
>
	{#snippet presets()}
		<p class="mb-2 text-xs text-muted-foreground">Three Qwen3 models, each on a common card:</p>
		<div class="mb-3.5 grid gap-2.5 md:grid-cols-3">
			{#each SETUPS as s (s.label)}
				<button
					type="button"
					onclick={() => setup(s)}
					class="rounded-lg border bg-sidebar px-3.5 py-3 text-left text-sm text-muted-foreground transition-colors hover:border-foreground/40 {isSetup(s)
						? 'border-foreground bg-muted'
						: ''}"
				>
					<b class="block font-medium text-foreground">{s.label}</b>
					<span class="mt-0.5 block text-xs">{s.hint}</span>
				</button>
			{/each}
		</div>
	{/snippet}

	{#snippet stage()}
		<MemoryStage
			{b}
			{model}
			{bits}
			{context}
			{cacheBits}
			{bitsRows}
			{modelRows}
			{curve}
			{per}
			play={{ playing: sweep.playing, label: 'Keep the chat going', onclick: playSweep, disabled: !gb }}
			pace={sweep.playing ? 600 : 450}
		/>
	{/snippet}

	{#snippet legend()}
		<div class="flex flex-wrap gap-x-5 gap-y-1">
			<span><span class="mr-1.5 inline-block h-2 w-4 rounded-sm bg-foreground/80 align-middle"></span>The model's numbers</span>
			<span><span class="mr-1.5 inline-block h-2 w-4 rounded-sm bg-muted-foreground align-middle"></span>The context cache</span>
			<span><span class="mr-1.5 inline-block h-2 w-4 rounded-sm bg-muted-foreground/40 align-middle"></span>The runtime</span>
			<span><span class="mr-1.5 inline-block h-3 w-0.5 bg-foreground align-middle"></span>Your card</span>
		</div>
	{/snippet}

	{#snippet controls()}
		<div class="grid gap-x-8 gap-y-5 md:grid-cols-2">
			<div>
				<div class="mb-2 text-xs text-muted-foreground">Model</div>
				<div class="flex flex-wrap gap-1.5">
					{#each MODELS as m, i (m.name)}
						<Button size="sm" variant={model === i ? 'default' : 'outline'} onclick={() => (model = i)}>{m.name}</Button>
					{/each}
				</div>
			</div>
			<div>
				<div class="mb-2 flex justify-between text-xs text-muted-foreground">
					<span>Graphics card memory: {card} GB</span>
					<span>{CARDS[0]} to {CARDS.at(-1)} GB</span>
				</div>
				<Slider type="single" bind:value={cardAt} min={0} max={CARDS.length - 1} step={1} />
			</div>
			<div>
				<div class="mb-2 flex justify-between text-xs text-muted-foreground">
					<span>Bits per number: {bits}</span>
					<span>{BITS[0]} to {BITS.at(-1)}</span>
				</div>
				<Slider type="single" bind:value={bitsAt} min={0} max={BITS.length - 1} step={1} />
			</div>
			<div>
				<div class="mb-2 flex justify-between text-xs text-muted-foreground">
					<span>Context: {context.toLocaleString('en')} tokens (num_ctx)</span>
					<span>{tokens(CONTEXTS[0])} to {tokens(CONTEXTS.at(-1))}</span>
				</div>
				<Slider type="single" bind:value={contextAt} min={0} max={CONTEXTS.length - 1} step={1} onValueChange={() => sweep.stop()} />
			</div>
			<div>
				<div class="mb-2 text-xs text-muted-foreground">Cache stored in</div>
				<div class="flex flex-wrap gap-1.5">
					<Button size="sm" variant={cacheBits === 16 ? 'default' : 'outline'} onclick={() => (cacheBits = 16)}>16 bits</Button>
					<Button size="sm" variant={cacheBits === 8 ? 'default' : 'outline'} onclick={() => (cacheBits = 8)}>8 bits</Button>
				</div>
			</div>
		</div>
	{/snippet}

	{#snippet say()}
		{#if b}
			<p class="leading-relaxed">
				<b class="font-medium">
					{MODELS[model].name} at {bits} bits with {context.toLocaleString('en')} tokens of context needs {gbOf(b.total)}{b.fits
						? `, leaving ${gbOf(b.card - b.total)} free on a ${card} GB card`
						: `, ${gbOf(b.total - b.card)} more than a ${card} GB card holds`}.
				</b>
				{copy.say(b.fits, b.card - b.total, b.card)}
			</p>
			<p class="mt-1 text-sm text-muted-foreground">{copy.trap({ fits: b.fits, weightsOnly, cacheShare: b.cache / b.total })}</p>
		{:else}
			<p class="text-muted-foreground">Loading the engine…</p>
		{/if}
	{/snippet}

	{#snippet cards()}
		<div class="mb-4 grid gap-3.5 md:grid-cols-3">
			{#each [{ title: "The model's numbers", value: b ? gbOf(b.weights) : '–', share: b ? b.weights / b.card : 0, text: 'Set once, when the model loads.' }, { title: 'The context cache', value: b ? gbOf(b.cache) : '–', share: b ? b.cache / b.card : 0, text: `${b ? kbOf(b.perToken) : ''} for every token of the chat.` }, { title: 'Longest chat that fits', value: b ? (b.maxTokens ? tokens(b.maxTokens) + ' tokens' : 'none') : '–', share: b ? Math.min(1, b.maxTokens / CONTEXTS.at(-1)) : 0, text: 'On this card, with these settings.' }] as c (c.title)}
				<div class="rounded-lg border px-4 py-3.5">
					<h3 class="text-xs font-medium">{c.title}</h3>
					<div class="mt-1 text-3xl font-semibold tracking-tight tabular-nums">{c.value}</div>
					<p class="text-xs text-muted-foreground">{c.text}</p>
					<div class="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
						<div class="h-full bg-foreground transition-[width]" style="width: {Math.min(1, c.share) * 100}%"></div>
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
				<p class="max-w-3xl text-sm text-muted-foreground">Open Under the hood for the two formulas, with your numbers in them.</p>
			</Tabs.Content>
			<Tabs.Content value="hood">
				{#if b}
					{@const m = MODELS[model]}
					<div class="space-y-2 rounded-lg border px-4 py-3.5 text-sm">
						<div class="text-muted-foreground">The model's numbers: parameters × bits per number ÷ 8, plus about half a bit per number for the scale factors quantized formats store.</div>
						<div class="font-mono text-xs tabular-nums">
							{(m.params / 1e9).toFixed(1)}B × {bits}{bits < 16 ? ' + 0.5' : ''} bits ÷ 8 = {gbOf(b.weights)}
						</div>
						<div class="pt-1 text-muted-foreground">
							The context cache: for every token, every layer keeps a key and a value for each key-value head. 2 × layers × key-value heads × head size × tokens × bytes.
						</div>
						<div class="font-mono text-xs tabular-nums">
							2 × {m.layers} × {m.kvHeads} × {m.headDim} × {context.toLocaleString('en')} × {cacheBits / 8} = {gbOf(b.cache)}
						</div>
						<div class="pt-1 text-muted-foreground">
							The runtime adds about {gbOf(b.overhead)} of working buffers. Native context for Qwen3 is {NATIVE.toLocaleString('en')} tokens; longer needs YaRN, which the runner turns on.
						</div>
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
		Every size on this page comes from a C engine compiled to WebAssembly. The model shapes are Qwen3's published configs; the runtime overhead is a rough
		figure, and real runners vary.
	{/snippet}
</ModulePage>
