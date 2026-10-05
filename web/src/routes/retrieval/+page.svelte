<script>
	import { onMount } from 'svelte';
	import ModulePage from '$lib/components/ModulePage.svelte';
	import RetrieveStage from '$lib/components/RetrieveStage.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Slider } from '$lib/components/ui/slider/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { getEngine } from '$lib/engine-loader.js';
	import { PAGES, QUESTIONS, SETUPS, MAX_K, TEMPERATURE, queryOf, words, search, answer, outcome, curve, percent } from '$lib/retrieval-sim.js';
	import { where } from '$lib/modules.js';
	import * as copy from '$lib/retrieval-copy.js';

	let gb = $state.raw(null);
	let qi = $state(SETUPS[2].question);
	let wording = $state(SETUPS[2].wording);
	let meaning = $state(SETUPS[2].meaning);
	let old = $state(SETUPS[2].old);
	let k = $state(SETUPS[2].k);

	const question = $derived(QUESTIONS[qi]);
	const asked = $derived(question[wording]);
	const results = $derived(gb ? search(gb, asked, meaning, old, k) : null);
	const said = $derived(results ? answer(results, question) : null);
	const right = $derived(results ? results.find((r) => r.page === question.page) : null);
	const rows = $derived(gb ? QUESTIONS.map((q) => outcome(gb, q, wording, meaning, old, k)) : null);
	const same = $derived(gb ? curve(gb, 'same', meaning, old) : null);
	const other = $derived(gb ? curve(gb, 'other', meaning, old) : null);
	const totals = $derived(
		rows ? { handed: rows.filter((r) => r.handed).length / rows.length, right: rows.reduce((s, r) => s + r.right, 0) / rows.length } : null
	);
	const oldWins = $derived(!!results && !!said && said.page !== null && PAGES[said.page].old);
	const here = where('retrieval');

	onMount(() => {
		getEngine().then((engine) => (gb = engine));
	});

	function setup(s) {
		qi = s.question;
		wording = s.wording;
		meaning = s.meaning;
		old = s.old;
		k = s.k;
	}
	const isSetup = (s) => qi === s.question && wording === s.wording && meaning === s.meaning && old === s.old && k === s.k;
	const ordinal = (n) => n + (n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th');
	const query = $derived(queryOf(asked, meaning));
</script>

<svelte:head><title>Retrieval · Glass Box</title></svelte:head>

<ModulePage
	track={here.track.title}
	n={here.n}
	total={here.total}
	tag={here.tag}
	title="When a model looks things up, what does it find?"
	lead="Before an assistant answers from your documents or the web, a search picks a few pages and hands them over. The model answers from those pages. A page that uses other words can be missed, and an old page that looks the same can be handed over instead."
	whyLead={copy.whyLead}
>
	{#snippet presets()}
		<p class="mb-2 text-xs text-muted-foreground">A question about a made-up town, answered from its handbook of {PAGES.length} pages:</p>
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
		<RetrieveStage {question} {asked} {results} {said} {rows} {same} {other} {k} />
	{/snippet}

	{#snippet legend()}
		<div class="flex flex-wrap gap-x-5 gap-y-1">
			<span
				><span class="mr-1 inline-block h-2 w-4 rounded-sm border border-muted-foreground align-middle"></span><span
					class="mr-1.5 inline-block h-0 w-4 border-t-2 border-foreground align-middle"
				></span>Right page handed over</span
			>
			<span
				><span class="mr-1 inline-block h-2 w-4 rounded-sm bg-foreground/80 align-middle"></span><span
					class="mr-1.5 inline-block h-0 w-4 border-t-2 border-dashed border-muted-foreground align-middle"
				></span>Right answer</span
			>
		</div>
	{/snippet}

	{#snippet controls()}
		<div class="grid gap-x-8 gap-y-5 md:grid-cols-2">
			<div>
				<div class="mb-2 text-xs text-muted-foreground">Question</div>
				<div class="flex flex-wrap gap-1.5">
					{#each QUESTIONS as q, i (q.short)}
						<Button size="sm" variant={qi === i ? 'default' : 'outline'} onclick={() => (qi = i)}>{q.short}</Button>
					{/each}
				</div>
			</div>
			<div>
				<div class="mb-2 flex justify-between text-xs text-muted-foreground">
					<span>Pages handed to the model: {k}</span>
					<span>1 to {MAX_K}</span>
				</div>
				<Slider type="single" bind:value={k} min={1} max={MAX_K} step={1} />
			</div>
			<div>
				<div class="mb-2 text-xs text-muted-foreground">Ask it with</div>
				<div class="flex flex-wrap gap-1.5">
					<Button size="sm" variant={wording === 'same' ? 'default' : 'outline'} onclick={() => (wording = 'same')}>The page's words</Button>
					<Button size="sm" variant={wording === 'other' ? 'default' : 'outline'} onclick={() => (wording = 'other')}>Other words</Button>
				</div>
			</div>
			<div class="flex flex-wrap gap-x-8 gap-y-5">
				<div>
					<div class="mb-2 text-xs text-muted-foreground">Search by</div>
					<div class="flex flex-wrap gap-1.5">
						<Button size="sm" variant={meaning ? 'outline' : 'default'} onclick={() => (meaning = false)}>Exact words</Button>
						<Button size="sm" variant={meaning ? 'default' : 'outline'} onclick={() => (meaning = true)}>Meaning too</Button>
					</div>
				</div>
				<div>
					<div class="mb-2 text-xs text-muted-foreground">Old pages</div>
					<div class="flex flex-wrap gap-1.5">
						<Button size="sm" variant={old ? 'default' : 'outline'} onclick={() => (old = true)}>Keep</Button>
						<Button size="sm" variant={old ? 'outline' : 'default'} onclick={() => (old = false)}>Remove</Button>
					</div>
				</div>
			</div>
		</div>
	{/snippet}

	{#snippet say()}
		{#if results && said}
			<p class="leading-relaxed">
				<b class="font-medium">
					{#if right && right.handed}The right page ranks {ordinal(right.rank + 1)} and is handed over, with a {percent(right.share)} chance the model answers from it.{:else if right && right.score > 0}The right
						page ranks {ordinal(right.rank + 1)}, below the {k} handed over.{:else}The search never matches the right page.{/if}
				</b>
				{copy.say(!!right && right.handed, right ? right.share : 0)}
			</p>
			<p class="mt-1 text-sm text-muted-foreground">{copy.trap({ found: !!right && right.handed, oldWins, wording, meaning, k })}</p>
		{:else}
			<p class="text-muted-foreground">Loading the engine…</p>
		{/if}
	{/snippet}

	{#snippet cards()}
		<div class="mb-4 grid gap-3.5 md:grid-cols-3">
			{#each [{ title: 'Right page handed over', value: totals?.handed, text: 'Out of the five questions, asked this way.' }, { title: 'Right answer', value: totals?.right, text: 'The chance, averaged over the five questions.' }, { title: 'Found, then outvoted', value: totals ? Math.max(0, totals.handed - totals.right) : undefined, text: 'Handed over, but the model answered from another page.' }] as card (card.title)}
				<div class="rounded-lg border px-4 py-3.5">
					<h3 class="text-xs font-medium">{card.title}</h3>
					<div class="mt-1 text-3xl font-semibold tracking-tight">{card.value !== undefined ? percent(card.value) : '–'}</div>
					<p class="text-xs text-muted-foreground">{card.text}</p>
					<div class="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
						<div class="h-full bg-foreground transition-[width]" style="width: {(card.value ?? 0) * 100}%"></div>
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
				<p class="max-w-3xl text-sm text-muted-foreground">Open Under the hood to see how each page is scored and how the model picks among the pages it gets.</p>
			</Tabs.Content>
			<Tabs.Content value="hood">
				<div class="space-y-2 rounded-lg border px-4 py-3.5 text-sm">
					<div class="text-muted-foreground">
						The search keeps the question's useful words: <span class="font-mono text-foreground">{words(asked).join(' · ')}</span>{meaning
							? ', plus the page words they mean'
							: ''}. It then scores every page with BM25:
					</div>
					<ul class="list-inside list-disc text-muted-foreground">
						<li>a word counts for more when few pages use it (rare words point to the right page)</li>
						<li>a word repeated in a page counts more, but less than twice as much</li>
						<li>a long page is marked down a little, so a short page matching the same words wins</li>
					</ul>
					<div class="pt-1 text-muted-foreground">
						The top {k} pages go to the model. It reads each with a weight of e<sup>score / {TEMPERATURE}</sup>, divided by the sum over the pages it got (softmax, as in Why
						answers vary), and answers from the page it reads most.
					</div>
					{#if right}
						<div class="tabular-nums">
							Here the right page scores {right.score.toFixed(2)} and ranks {ordinal(right.rank + 1)} of {results.length}{right.handed
								? `, so its share is ${percent(right.share)}`
								: `, below the cut of ${k}`}. The search used {query.ids.length} words.
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
		Every score, rank and chance on this page comes from a C engine compiled to WebAssembly. The handbook and its town are made up; the search is real BM25, run in
		your browser over {PAGES.length} short pages.
	{/snippet}
</ModulePage>
