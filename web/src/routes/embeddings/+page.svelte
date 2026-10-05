<script>
	import { onMount } from 'svelte';
	import ModulePage from '$lib/components/ModulePage.svelte';
	import EmbedStage from '$lib/components/EmbedStage.svelte';
	import { Slider } from '$lib/components/ui/slider/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { getEngine } from '$lib/engine-loader.js';
	import { Sweep } from '$lib/motion.svelte.js';
	import { VOCAB, DIMS, QUESTIONS, SETUPS, CORPUS, learn, space, nearest, search, curve, unknownIn, idsOf, percent } from '$lib/embeddings-sim.js';
	import { where } from '$lib/modules.js';
	import * as copy from '$lib/embeddings-copy.js';

	let gb = $state.raw(null);
	let learned = $state.raw(null);
	let word = $state(SETUPS[0].word);
	let question = $state(SETUPS[0].question);
	let dimsAt = $state(SETUPS[0].dimsAt);
	const sweep = new Sweep();

	const k = $derived(DIMS[dimsAt]);
	const s = $derived(gb && learned ? space(gb, learned, k) : null);
	const near = $derived(s ? nearest(gb, s, word) : null);
	const results = $derived(s ? search(gb, s, QUESTIONS[question].text) : null);
	const points = $derived(gb && learned ? curve(gb, learned) : null);
	const here = where('embeddings');

	const best = (key) => (results ? results.reduce((a, b) => (b[key] > a[key] ? b : a)) : null);
	const keywordFound = $derived(!!results && best('keyword').keyword > 0 && best('keyword').i === QUESTIONS[question].right);
	const meaningFound = $derived(!!results && best('meaning').i === QUESTIONS[question].right);
	const topics = $derived(points ? points[dimsAt].topics : 0);

	onMount(() => {
		getEngine().then((engine) => {
			learned = learn(engine);
			gb = engine;
		});
		return () => sweep.stop();
	});

	function setup(p) {
		sweep.stop();
		word = p.word;
		question = p.question;
		dimsAt = p.dimsAt;
	}
	const isSetup = (p) => word === p.word && question === p.question && dimsAt === p.dimsAt;
	// adds numbers to every word, from one to the most, so the groups can be watched forming
	const playSweep = () => sweep.toggle(DIMS.map((_, i) => i), 700, (i) => (dimsAt = i));
	const sentences = CORPUS.split('\n').length;
</script>

<svelte:head><title>Embeddings · Glass Box</title></svelte:head>

<ModulePage
	track={here.track.title}
	n={here.n}
	total={here.total}
	tag={here.tag}
	title="How does a model know a coach is like a bus?"
	lead="A model keeps every word piece as a list of numbers, and words used in similar places get similar lists. Here those lists are learned in your browser from {sentences} short sentences: count which words appear near which, then squeeze the counts into a few numbers per word."
	whyLead={copy.whyLead}
>
	{#snippet presets()}
		<p class="mb-2 text-xs text-muted-foreground">Learned from {sentences} sentences about buses, food, animals, weather and places:</p>
		<div class="mb-3.5 grid gap-2.5 md:grid-cols-3">
			{#each SETUPS as p (p.label)}
				<button
					type="button"
					onclick={() => setup(p)}
					class="rounded-lg border bg-sidebar px-3.5 py-3 text-left text-sm text-muted-foreground transition-colors hover:border-foreground/40 {isSetup(p)
						? 'border-foreground bg-muted'
						: ''}"
				>
					<b class="block font-medium text-foreground">{p.label}</b>
					<span class="mt-0.5 block text-xs">{p.hint}</span>
				</button>
			{/each}
		</div>
	{/snippet}

	{#snippet stage()}
		<EmbedStage
			{s}
			bind:word
			bind:question
			{near}
			{results}
			{points}
			play={{ playing: sweep.playing, label: 'Add dimensions', onclick: playSweep, disabled: !gb }}
			pace={sweep.playing ? 600 : 450}
		/>
	{/snippet}

	{#snippet legend()}
		<div class="flex flex-wrap gap-x-5 gap-y-1">
			<span><span class="mr-1.5 inline-block h-2 w-4 rounded-sm bg-foreground/80 align-middle"></span>By meaning</span>
			<span><span class="mr-1.5 inline-block h-2 w-4 rounded-sm border border-muted-foreground align-middle"></span>By shared words</span>
			<span><span class="mr-1.5 inline-block h-2.5 w-2.5 rounded-full bg-foreground align-middle"></span>Your word and its closest</span>
		</div>
	{/snippet}

	{#snippet controls()}
		<div class="grid gap-x-8 gap-y-5 md:grid-cols-2">
			<div>
				<div class="mb-2 flex justify-between text-xs text-muted-foreground">
					<span>Numbers per word (dimensions): {k}</span>
					<span>{DIMS[0]} to {DIMS.at(-1)}</span>
				</div>
				<Slider type="single" bind:value={dimsAt} min={0} max={DIMS.length - 1} step={1} onValueChange={() => sweep.stop()} />
			</div>
			<div class="text-xs leading-relaxed text-muted-foreground">
				Pick a word in the first panel or on the map, and a question in the search. Words the {VOCAB.length}-word vocabulary never saw are skipped{unknownIn(
					QUESTIONS[question].text
				).length
					? ` (here: ${unknownIn(QUESTIONS[question].text).join(', ')})`
					: ''}.
			</div>
		</div>
	{/snippet}

	{#snippet say()}
		{#if near && results}
			<p class="leading-relaxed">
				<b class="font-medium">
					With {k} {k === 1 ? 'number' : 'numbers'} per word, the closest words to "{word}" are {near
						.slice(0, 3)
						.map((n) => `"${n.word}"`)
						.join(', ')}, and {percent(topics)} of all words have neighbours on their own topic.
				</b>
				{copy.say(topics)}
			</p>
			<p class="mt-1 text-sm text-muted-foreground">{copy.trap({ k, keywordFound, meaningFound })}</p>
		{:else}
			<p class="text-muted-foreground">Loading the engine…</p>
		{/if}
	{/snippet}

	{#snippet cards()}
		<div class="mb-4 grid gap-3.5 md:grid-cols-3">
			{#each [{ title: 'Numbers per word', value: k, share: dimsAt / (DIMS.length - 1), text: `Out of ${VOCAB.length} directions the counts could keep.` }, { title: 'Neighbours on topic', value: percent(topics), share: topics, text: 'A word\'s 3 closest words share its topic.' }, { title: 'Meaning search', value: points ? `${Math.round(points[dimsAt].search * QUESTIONS.length)} of ${QUESTIONS.length}` : '–', share: points ? points[dimsAt].search : 0, text: 'Questions whose right notice comes first.' }] as c (c.title)}
				<div class="rounded-lg border px-4 py-3.5">
					<h3 class="text-xs font-medium">{c.title}</h3>
					<div class="mt-1 text-3xl font-semibold tracking-tight tabular-nums">{gb ? c.value : '–'}</div>
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
				<p class="max-w-3xl text-sm text-muted-foreground">Open Under the hood for the three steps that turn sentences into numbers.</p>
			</Tabs.Content>
			<Tabs.Content value="hood">
				<div class="space-y-2 rounded-lg border px-4 py-3.5 text-sm">
					<ol class="list-inside list-decimal space-y-1.5 text-muted-foreground">
						<li>
							Count: for every pair of the {VOCAB.length} words, how often they appear within 3 words of each other in the same sentence. A {VOCAB.length} × {VOCAB.length} table.
						</li>
						<li>
							Weight (PPMI): turn each count into log(how often the pair appears ÷ how often it would by chance), and set anything below zero to zero. Common words like "the" were
							already dropped.
						</li>
						<li>
							Squeeze: break the table into its main directions (eigenvectors), strongest first. A word's embedding is its position along the first {k}, each scaled by the square root
							of how strong that direction is, then set to length 1.
						</li>
					</ol>
					<div class="pt-1 text-muted-foreground">
						Similarity is the cosine of the angle between two embeddings: 1 when they point the same way, 0 when they are unrelated. A sentence's embedding is the average of
						its words'. The map flattens the {k} numbers onto the two directions they spread along most (principal components).
					</div>
					{#if near}
						<div class="tabular-nums">
							Here "{word}" and "{near[0].word}" have cosine {near[0].sim.toFixed(2)}. The question's words found in the vocabulary: {idsOf(QUESTIONS[question].text)
								.map((i) => VOCAB[i])
								.join(', ')}.
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
		Every count, vector, similarity and map position on this page comes from a C engine compiled to WebAssembly, learned in your browser from the {sentences}
		sentences above. Real models learn far richer spaces from far more text.
	{/snippet}
</ModulePage>
