<script>
	import { onMount } from 'svelte';
	import ModulePage from '$lib/components/ModulePage.svelte';
	import HowStage from '$lib/components/HowStage.svelte';
	import SentencesExample from '$lib/components/SentencesExample.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { getEngine } from '$lib/engine-loader.js';
	import { TEXTS, MAX_TEXT, MAX_WORDS_IN_SENTENCE, buildModel, followers, label } from '$lib/text-model.js';
	import { HIDDEN, TEACH_STEPS, newNet, teachStep, view, paramCount } from '$lib/network.js';
	import { percent } from '$lib/sampling-sim.js';
	import { where } from '$lib/modules.js';
	import * as copy from '$lib/how-it-works-copy.js';

	const OWN = TEXTS.length; // the "your own text" choice

	let gb = $state.raw(null);
	let model = $state.raw(null);
	let net = $state.raw(null);
	let choice = $state(0);
	let ownText = $state(TEXTS[0].text);
	let sentence = $state.raw([]);
	let step = $state(-1);
	let picked = $state(null);
	let busy = $state(false);
	let teaching = $state(false);
	let seed = 0;
	let run = 0; // changes on a reset, so anything running stops

	const current = $derived(model ? (sentence.length ? sentence[sentence.length - 1] : model.start) : null);
	const data = $derived(model && net ? view(gb, model, net, current) : null);
	const info = $derived(model ? followers(gb, model, current) : null);
	const ended = $derived(model && sentence.length > 0 && sentence[sentence.length - 1] === model.start);
	const isStart = $derived(model && current === model.start);
	const taught = $derived(net ? net.losses.length - 1 >= TEACH_STEPS : false);
	const favourite = $derived(data ? data.odds.indexOf(Math.max(...data.odds)) : null);
	const here = where('how-it-works');

	onMount(() => {
		getEngine().then((engine) => {
			gb = engine;
			load(TEXTS[0].text);
		});
	});

	const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
	const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

	function load(text) {
		startOver();
		model = buildModel(gb, text.slice(0, MAX_TEXT));
		net = newNet(gb, model);
	}

	function choose(i) {
		choice = i;
		load(i === OWN ? ownText : TEXTS[i].text);
	}

	function startOver() {
		run += 1;
		sentence = [];
		step = -1;
		picked = null;
		busy = false;
		teaching = false;
	}

	// forgets what it learned, so you can teach it again
	function forget() {
		startOver();
		net = newNet(gb, model);
	}

	async function teach() {
		if (teaching) {
			teaching = false;
			return;
		}
		teaching = true;
		const mine = run;
		while (teaching && mine === run && net.losses.length - 1 < TEACH_STEPS) {
			net = teachStep(gb, model, net);
			if (!still()) await sleep(70);
		}
		if (mine === run) teaching = false;
	}

	// one trip around the loop. Returns true if the sentence can keep going.
	async function advance(pause) {
		const mine = run;
		const next = gb.sample(data.odds, 1, ++seed).findIndex((c) => c === 1);
		picked = next;
		for (const i of [0, 1, 2]) {
			step = i;
			if (!still()) await sleep(i === 2 ? pause * 2 : pause);
			if (mine !== run) return false;
		}
		sentence = [...sentence, next];
		step = 3;
		if (!still()) await sleep(pause);
		if (mine !== run) return false;
		step = -1;
		picked = null;
		return next !== model.start && sentence.length < MAX_WORDS_IN_SENTENCE;
	}

	async function pickOnce() {
		if (busy || ended || teaching) return;
		busy = true;
		await advance(380);
		busy = false;
	}

	async function writeSentence() {
		if (busy || teaching) return;
		if (ended) startOver();
		busy = true;
		const mine = run;
		let more = true;
		while (more && mine === run) more = await advance(240);
		if (mine === run) busy = false;
	}
</script>

<svelte:head><title>How it works · Glass Box</title></svelte:head>

<ModulePage
	track={here.track.title}
	n={here.n}
	total={here.total}
	tag={here.tag}
	title="What is an AI actually doing when it answers?"
	lead="A chat assistant runs one loop: a neural network turns the words so far into odds for the next word, one word is picked, and the loop starts again. This is a tiny network you can teach and watch."
	whyLead={copy.whyLead}
>
	{#snippet presets()}
		<p class="mb-2 text-xs text-muted-foreground">Pick a text for the network to learn from, or write your own:</p>
		<div class="mb-3.5 grid grid-cols-2 gap-2.5 md:grid-cols-4">
			{#each TEXTS as t, i (t.label)}
				<button
					type="button"
					onclick={() => choose(i)}
					disabled={!gb}
					class="rounded-lg border bg-sidebar px-3.5 py-3 text-left text-sm text-muted-foreground transition-colors hover:border-foreground/40 {choice ===
					i
						? 'border-foreground bg-muted'
						: ''}"
				>
					<b class="block font-medium text-foreground">{t.label}</b>
					<span class="mt-0.5 block text-xs">{t.hint}</span>
				</button>
			{/each}
			<button
				type="button"
				onclick={() => choose(OWN)}
				disabled={!gb}
				class="rounded-lg border bg-sidebar px-3.5 py-3 text-left text-sm text-muted-foreground transition-colors hover:border-foreground/40 {choice ===
				OWN
					? 'border-foreground bg-muted'
					: ''}"
			>
				<b class="block font-medium text-foreground">Your own text</b>
				<span class="mt-0.5 block text-xs">type anything</span>
			</button>
		</div>
		{#if choice === OWN}
			<div class="mb-3.5">
				<Textarea bind:value={ownText} rows={4} maxlength={MAX_TEXT} placeholder="Write a few sentences. The more it reads, the more it can say." />
				<div class="mt-2 flex items-center gap-3">
					<Button variant="outline" onclick={() => load(ownText)} disabled={!gb}>Use this text</Button>
					<span class="text-xs text-muted-foreground">Up to {MAX_TEXT.toLocaleString('en-US')} characters. Use full stops between sentences.</span>
				</div>
			</div>
		{/if}
	{/snippet}

	{#snippet stage()}
		{#if model && net && data && info}
			<HowStage {model} {net} {current} {data} {info} {sentence} {step} {picked} />
		{:else}
			<div class="rounded-lg border px-4 py-12 text-center text-sm text-muted-foreground lg:min-h-96">Loading the engine…</div>
		{/if}
	{/snippet}

	{#snippet legend()}
		<div class="flex flex-wrap gap-x-5 gap-y-1">
			<span>Thicker connection: it matters more</span>
			<span>Dashed connection: it pushes the other way</span>
			<span>Brighter circle: a stronger value</span>
		</div>
	{/snippet}

	{#snippet controls()}
		<div class="flex flex-wrap items-center gap-3">
			<Button onclick={teach} disabled={!model || (taught && !teaching)} variant={net && net.epochs === 0 ? 'default' : 'outline'}>
				{teaching ? 'Stop teaching' : taught ? 'Taught' : 'Teach the network'}
			</Button>
			<Button onclick={pickOnce} disabled={!model || busy || ended || teaching}>Pick next word</Button>
			<Button onclick={writeSentence} disabled={!model || busy || teaching}>Write a sentence</Button>
			<Button variant="outline" onclick={startOver} disabled={!model || (sentence.length === 0 && !busy)}>Start over</Button>
			<Button variant="outline" onclick={forget} disabled={!net || net.epochs === 0}>Forget what it learned</Button>
			{#if ended}<span class="text-xs text-muted-foreground">The sentence ended with a full stop.</span>{/if}
		</div>
	{/snippet}

	{#snippet say()}
		{#if model && net && data && info}
			{#if net.epochs === 0}
				<p class="leading-relaxed">{copy.untrained}</p>
			{:else}
				<p class="leading-relaxed">
					<b class="font-medium">{teaching ? `Teaching… ${net.epochs} passes so far.` : `Taught for ${net.epochs} passes over the text.`}</b>
					{copy.say(
						label(model, current),
						isStart,
						label(model, favourite),
						percent(data.odds[favourite]),
						percent(info.list.find((f) => f.id === favourite)?.p ?? 0)
					)}
				</p>
			{/if}
			<p class="mt-1 text-sm text-muted-foreground">
				It decides one word at a time, from the word before it.
			</p>
		{:else}
			<p class="text-muted-foreground">Loading the engine…</p>
		{/if}
	{/snippet}

	{#snippet cards()}
		<div class="mb-4 grid gap-3.5 md:grid-cols-2 xl:grid-cols-4">
			<div class="rounded-lg border px-4 py-3.5">
				<h3 class="text-xs font-medium">Teaching so far</h3>
				<div class="mt-1 text-3xl font-semibold tracking-tight">{net ? net.epochs : '–'}</div>
				<p class="text-xs text-muted-foreground">Passes over the text. Each pass nudges every number a little.</p>
			</div>
			<div class="rounded-lg border px-4 py-3.5">
				<h3 class="text-xs font-medium">How surprised it is</h3>
				<div class="mt-1 text-3xl font-semibold tracking-tight">{net ? net.losses[net.losses.length - 1].toFixed(2) : '–'}</div>
				<p class="text-xs text-muted-foreground">
					Lower is better. The best a plain count can reach here: {model ? model.bestLoss.toFixed(2) : '–'}.
				</p>
			</div>
			<div class="rounded-lg border px-4 py-3.5">
				<h3 class="text-xs font-medium">Words it knows</h3>
				<div class="mt-1 text-3xl font-semibold tracking-tight">{model ? model.vocab - 1 : '–'}</div>
				<p class="text-xs text-muted-foreground">Different words in the text it learned from.</p>
			</div>
			<div class="rounded-lg border px-4 py-3.5">
				<h3 class="text-xs font-medium">Numbers it learned</h3>
				<div class="mt-1 text-3xl font-semibold tracking-tight">{model ? paramCount(model).toLocaleString('en-US') : '–'}</div>
				<p class="text-xs text-muted-foreground">All its knowledge is these numbers. A real model has billions.</p>
			</div>
		</div>
	{/snippet}

	{#snippet example()}
		{#if gb && model && net}
			<div class="mb-4"><SentencesExample {gb} {model} {net} /></div>
		{/if}
	{/snippet}

	{#snippet explain()}
		<div class="mb-4 grid gap-3.5 md:grid-cols-3">
			<div class="rounded-lg border px-4 py-3.5">
				<h3 class="mb-1.5 text-xs font-medium">How to read the picture</h3>
				<p class="text-sm leading-relaxed text-muted-foreground">
					A word goes in on the left. The circles in the middle are numbers the network works out from it. On the right come the odds for each next word. The lines are the connections, and what the network learned is how strong each one is.
				</p>
			</div>
			<div class="rounded-lg border px-4 py-3.5">
				<h3 class="mb-1.5 text-xs font-medium">What a neural network is</h3>
				<p class="text-sm leading-relaxed text-muted-foreground">
					A pile of numbers on connections, plus a way to combine them. Teaching it means nudging the numbers until the odds match the text. Nothing is stored as sentences: the knowledge is spread across the numbers.
				</p>
			</div>
			<div class="rounded-lg border px-4 py-3.5">
				<h3 class="mb-1.5 text-xs font-medium">The trap</h3>
				<p class="text-sm leading-relaxed text-muted-foreground">{copy.trap}</p>
			</div>
		</div>

		<Tabs.Root value="simple">
			<Tabs.List>
				<Tabs.Trigger value="simple">Simple</Tabs.Trigger>
				<Tabs.Trigger value="hood">Under the hood</Tabs.Trigger>
			</Tabs.List>
			<Tabs.Content value="simple">
				<p class="max-w-3xl text-sm text-muted-foreground">
					Open Under the hood to see the steps inside the network, with the numbers for the word it is on.
				</p>
			</Tabs.Content>
			<Tabs.Content value="hood">
				<div class="rounded-lg border px-4 py-3.5 text-sm">
					<ol class="space-y-1 text-muted-foreground">
						{#each copy.hoodSteps as s, i (s)}
							<li>{i + 1}. {s}</li>
						{/each}
					</ol>
					{#if data && model}
						<div class="mt-3 text-xs text-muted-foreground">
							The {HIDDEN} hidden values for "{label(model, current)}" right now:
						</div>
						<div class="mt-1.5 flex flex-wrap gap-2">
							{#each data.hidden as h, j (j)}
								<span class="rounded-md border px-2 py-0.5 text-xs tabular-nums">{h.toFixed(2)}</span>
							{/each}
						</div>
					{/if}
					<p class="mt-3 text-xs text-muted-foreground">{copy.teachingNote}</p>
					<p class="mt-2 text-xs text-muted-foreground">{copy.hoodNote}</p>
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
		The network and its teaching run in a C engine compiled to WebAssembly. This one reads a single word and has a few hundred numbers, while a real model reads far more and has billions.
	{/snippet}
</ModulePage>
