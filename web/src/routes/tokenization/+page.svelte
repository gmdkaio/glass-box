<script>
	import { onMount } from 'svelte';
	import ModulePage from '$lib/components/ModulePage.svelte';
	import TokenStage from '$lib/components/TokenStage.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Slider } from '$lib/components/ui/slider/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { getEngine } from '$lib/engine-loader.js';
	import { Sweep, range } from '$lib/motion.svelte.js';
	import {
		SAMPLES,
		MAX_TEXT,
		CORPUS,
		train,
		pieces as cut,
		languageCurves,
		buildUp,
		firstMerges,
		traits,
		byteLength,
		charLength
	} from '$lib/tokenization-sim.js';
	import { where } from '$lib/modules.js';
	import * as copy from '$lib/tokenization-copy.js';

	let gb = $state.raw(null);
	let pairs = $state.raw(null);
	let text = $state(SAMPLES[1].text);
	let merges = $state(0);

	const learned = $derived(pairs ? pairs.length / 2 : 0);
	const pieces = $derived(gb && pairs ? cut(gb, pairs, text, merges) : null);
	const curve = $derived(gb && pairs ? gb.bpeCurve(text, pairs, learned) : null);
	const langs = $derived(gb && pairs ? languageCurves(gb, pairs) : null);
	const chars = $derived(charLength(text));
	const bytes = $derived(byteLength(text));
	const perToken = $derived(pieces && pieces.length ? chars / pieces.length : 0);

	// the longest word in the text, built up merge by merge
	const word = $derived((text.match(/ ?[\p{L}\p{N}']+/gu) ?? []).reduce((a, b) => (b.trim().length > a.trim().length ? b : a), ''));
	const steps = $derived(gb && pairs && word ? buildUp(gb, pairs, word, merges) : []);
	const merged = $derived(gb && pairs ? firstMerges(gb, pairs, 24) : []);
	const here = where('tokenization');
	const sweep = new Sweep();

	// learns the merges in front of you, from bytes to whole words. Most of the
	// visible change comes from the early merges, so the steps start small.
	function playSweep() {
		const steps = [...new Set(range(0, 1, 70).map((t) => Math.round(learned * t * t)))];
		sweep.toggle(steps, 110, (v) => (merges = v));
	}

	onMount(() => {
		getEngine().then((engine) => {
			pairs = train(engine);
			merges = pairs.length / 2;
			gb = engine;
		});
		return () => sweep.stop();
	});

	const sample = $derived(SAMPLES.find((s) => s.text === text));
</script>

<svelte:head><title>Tokenization · Glass Box</title></svelte:head>

<ModulePage
	track={here.track.title}
	n={here.n}
	total={here.total}
	tag={here.tag}
	title="Why can't the model count the r's in strawberry?"
	lead="Before a model reads anything, your text is cut into tokens, common chunks learned from lots of text, and each token is swapped for a number. Familiar words stay whole; rare words, long numbers and other languages come apart into many small pieces."
	whyLead={copy.whyLead}
>
	{#snippet presets()}
		<p class="mb-2 text-xs text-muted-foreground">Pick a text, or write your own below:</p>
		<div class="mb-3.5 grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
			{#each SAMPLES as s (s.label)}
				<button
					type="button"
					onclick={() => (sweep.stop(), (text = s.text))}
					class="rounded-lg border bg-sidebar px-3.5 py-3 text-left text-sm text-muted-foreground transition-colors hover:border-foreground/40 {sample === s
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
		<TokenStage
			{pieces}
			{curve}
			{langs}
			{merges}
			{learned}
			play={{ playing: sweep.playing, label: 'Train the tokenizer', onclick: playSweep, disabled: !gb }}
			pace={sweep.playing ? 140 : 450}
		/>
	{/snippet}

	{#snippet legend()}
		<div class="flex flex-wrap gap-x-5 gap-y-1">
			<span><span class="mr-1.5 inline-block h-3 w-4 rounded-sm border bg-sidebar align-middle"></span>One token</span>
			<span><span class="mr-1.5 inline-block h-3 w-4 rounded-sm border bg-muted align-middle"></span>The next token</span>
			<span><span class="mr-1.5 inline-block h-3 w-4 rounded-sm border border-dashed align-middle"></span>Part of a letter</span>
		</div>
	{/snippet}

	{#snippet controls()}
		<div class="grid gap-x-8 gap-y-5 md:grid-cols-2">
			<div>
				<div class="mb-2 flex justify-between text-xs text-muted-foreground">
					<span>Your text</span>
					<span>{chars} / {MAX_TEXT} characters</span>
				</div>
				<Textarea bind:value={text} rows={3} maxlength={MAX_TEXT} placeholder="Type anything: a name, a sum, a sentence in your language." />
			</div>
			<div>
				<div class="mb-2 flex justify-between text-xs text-muted-foreground">
					<span>Merges the tokenizer has learned: {merges}</span>
					<span>0 to {learned}</span>
				</div>
				<Slider type="single" bind:value={merges} min={0} max={Math.max(learned, 1)} step={1} disabled={!gb} onValueChange={() => sweep.stop()} />
				<div class="mt-3 flex flex-wrap gap-1.5">
					<Button size="sm" variant="outline" onclick={() => (sweep.stop(), (merges = 0))} disabled={!gb}>No merges</Button>
					<Button size="sm" variant="outline" onclick={() => (sweep.stop(), (merges = learned))} disabled={!gb}>All merges</Button>
				</div>
			</div>
		</div>
	{/snippet}

	{#snippet say()}
		{#if pieces}
			<p class="leading-relaxed">
				<b class="font-medium">
					{chars} {chars === 1 ? 'character' : 'characters'} became {pieces.length} {pieces.length === 1 ? 'token' : 'tokens'}, about {perToken.toFixed(1)} characters per token.
				</b>
				{copy.say(perToken)}
			</p>
			<p class="mt-1 text-sm text-muted-foreground">{copy.trap(traits(text))}</p>
		{:else}
			<p class="text-muted-foreground">Loading the engine…</p>
		{/if}
	{/snippet}

	{#snippet cards()}
		<div class="mb-4 grid gap-3.5 md:grid-cols-3">
			<div class="rounded-lg border px-4 py-3.5">
				<h3 class="text-xs font-medium">What you wrote</h3>
				<div class="mt-1 text-3xl font-semibold tracking-tight tabular-nums">{chars}</div>
				<p class="text-xs text-muted-foreground">characters, stored as {bytes} bytes</p>
			</div>
			<div class="rounded-lg border px-4 py-3.5">
				<h3 class="text-xs font-medium">What the model reads</h3>
				<div class="mt-1 text-3xl font-semibold tracking-tight tabular-nums">{pieces ? pieces.length : '–'}</div>
				<p class="text-xs text-muted-foreground">tokens, each one a number</p>
			</div>
			<div class="rounded-lg border px-4 py-3.5">
				<h3 class="text-xs font-medium">The tokenizer's list</h3>
				<div class="mt-1 text-3xl font-semibold tracking-tight tabular-nums">{pairs ? 256 + merges : '–'}</div>
				<p class="text-xs text-muted-foreground">tokens: 256 single bytes plus {merges} merges</p>
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
					Open Under the hood to see the merges this tokenizer learned and how your longest word is built from them.
				</p>
			</Tabs.Content>
			<Tabs.Content value="hood">
				<div class="space-y-3 rounded-lg border px-4 py-3.5 text-sm">
					<div class="text-muted-foreground">
						The tokenizer learned from {byteLength(CORPUS).toLocaleString('en')} bytes of everyday English. It started from the 256 possible bytes and,
						{learned} times, merged the pair that sat side by side most often. It stopped when no pair came up twice. The first merges it found:
					</div>
					<ol class="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-xs sm:grid-cols-3 lg:grid-cols-4">
						{#each merged as m (m.k)}
							<li class="tabular-nums">
								<span class="text-muted-foreground">{m.k + 1}.</span>
								{m.a} + {m.b} → <b class="font-medium">{m.made}</b>
							</li>
						{/each}
					</ol>
					{#if steps.length}
						<div class="pt-1 text-muted-foreground">
							To cut a word, apply the merges in the order they were learned. "{word.trim()}", step by step, using the first {merges}:
						</div>
						<ol class="space-y-1 font-mono text-xs">
							{#each steps as s (s.k)}
								<li class="flex flex-wrap items-center gap-1">
									<span class="w-24 text-muted-foreground">{s.k === 0 ? 'bytes' : `merge ${s.k}`}</span>
									{#each s.pieces as p (p.i)}
										<span class="rounded border px-1 whitespace-pre {p.part ? 'border-dashed text-muted-foreground' : ''}">{p.text}</span>
									{/each}
								</li>
							{/each}
						</ol>
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
		Every merge, token and count on this page comes from a C engine compiled to WebAssembly. The tokenizer is trained in your browser on a few
		pages of English, so its list is tiny next to a real model's.
	{/snippet}
</ModulePage>
