<script>
	import { onMount } from 'svelte';
	import ModulePage from '$lib/components/ModulePage.svelte';
	import SettingsStage from '$lib/components/SettingsStage.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Slider } from '$lib/components/ui/slider/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { getEngine } from '$lib/engine-loader.js';
	import { Sweep, range } from '$lib/motion.svelte.js';
	import {
		SPOTS,
		DEFAULTS,
		DRAWS,
		CUT_NAMES,
		IDS,
		VOCAB,
		START,
		REPLY,
		LAST_N,
		BASE,
		UNLIKELY,
		RUNS,
		PENALTIES,
		isBad,
		keptCurves,
		percent
	} from '$lib/settings-sim.js';
	import { where } from '$lib/modules.js';
	import * as copy from '$lib/settings-copy.js';

	let gb = $state.raw(null);
	let spotAt = $state(1);
	let temperature = $state(DEFAULTS.temperature);
	let topK = $state(DEFAULTS.topK);
	let topP = $state(DEFAULTS.topP);
	let minP = $state(DEFAULTS.minP);
	let penalty = $state(DEFAULTS.penalty);
	let seed = $state(1);
	let shown = $state(REPLY);
	const sweep = new Sweep();

	const spot = $derived(SPOTS[spotAt]);
	// the filters and temperature on their own, so the penalty curve does not redo itself when the penalty moves
	const filters = $derived({ temperature, topK, topP, minP });
	const s = $derived({ ...filters, penalty });
	const result = $derived(gb ? gb.sampleOdds(spot.scores, filters) : null);
	const plain = $derived(gb ? gb.softmax(spot.scores, temperature) : null);
	const counts = $derived(result ? gb.sample(result.odds, DRAWS, 7) : null);
	const curves = $derived(gb ? keptCurves(gb) : null);
	const pairs = $derived(gb ? gb.pairCounts(IDS, VOCAB.length).counts : null);
	const reply = $derived(pairs ? gb.generate(pairs, VOCAB.length, START, REPLY, filters, penalty, LAST_N, BASE, seed) : null);
	const penCurve = $derived(pairs ? gb.penaltyCurve(pairs, VOCAB.length, START, REPLY, filters, LAST_N, BASE, PENALTIES, RUNS, 11, UNLIKELY) : null);

	// the numbers the cards and the summary read
	const sum = $derived.by(() => {
		if (!result) return null;
		const goodCut = spot.words.filter((_, i) => !isBad(spot, i) && result.cutBy[i]).length;
		return { kept: result.kept, badChance: gb.oddsFrom(result.odds, spot.bad), goodCut, bad: spot.words.length - spot.bad };
	});
	const here = where('sampling-settings');

	onMount(() => {
		getEngine().then((engine) => (gb = engine));
		return () => sweep.stop();
	});

	// the reply, written out one word at a time
	const playSweep = () => sweep.toggle(range(START.length, REPLY, REPLY - START.length + 1), 140, (n) => (shown = n));
	function stopSweep() {
		sweep.stop();
		shown = REPLY;
	}

	function choose(i) {
		stopSweep();
		if (i < 2) return (spotAt = i);
		// stuck in a loop: a low temperature and no penalty, then watch it write
		temperature = 0.3;
		penalty = 1;
		playSweep();
	}
	const isPreset = (i) => (i < 2 ? spotAt === i && !(temperature === 0.3 && penalty === 1) : temperature === 0.3 && penalty === 1);

	function reset() {
		stopSweep();
		({ temperature, topK, topP, minP, penalty } = DEFAULTS);
	}

	const off = (v, isOff) => (isOff ? 'off' : v);
</script>

<svelte:head><title>Sampling settings · Glass Box</title></svelte:head>

<ModulePage
	track={here.track.title}
	n={here.n}
	total={here.total}
	tag={here.tag}
	title="What do top-k, top-p and min-p do?"
	lead="Before a model picks its next word, the program running it can drop the unlikely ones from the list, and lower the odds of words it has already written. These are the settings a local runner shows you. Move them and watch which words stay in the draw."
	whyLead={copy.whyLead}
>
	{#snippet presets()}
		<p class="mb-2 text-xs text-muted-foreground">Two places in a sentence, and a reply that goes round in circles:</p>
		<div class="mb-3.5 grid gap-2.5 md:grid-cols-3">
			{#each [...SPOTS.map((x) => ({ label: x.label, hint: `"…${x.text.split(' ').slice(-3).join(' ')}" · ${x.hint}` })), { label: 'Stuck in a loop', hint: 'temperature 0.3, no repeat penalty' }] as p, i (p.label)}
				<button
					type="button"
					onclick={() => choose(i)}
					class="rounded-lg border bg-sidebar px-3.5 py-3 text-left text-sm text-muted-foreground transition-colors hover:border-foreground/40 {isPreset(i)
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
		<SettingsStage
			{spotAt}
			{s}
			{result}
			{plain}
			{counts}
			{curves}
			{reply}
			{shown}
			{penCurve}
			play={{ playing: sweep.playing, label: 'Keep writing', onclick: playSweep, disabled: !gb }}
		/>
	{/snippet}

	{#snippet legend()}
		<div class="flex flex-wrap gap-x-5 gap-y-1">
			<span><span class="mr-1.5 inline-block h-2 w-4 rounded-sm bg-foreground/80 align-middle"></span>After your settings, or what came up</span>
			<span><span class="mr-1.5 inline-block h-2 w-4 rounded-sm border border-muted-foreground align-middle"></span>The odds with no filter</span>
			<span><span class="line-through">word</span> = cut from the draw</span>
			<span>✗ = makes no sense here</span>
		</div>
	{/snippet}

	{#snippet controls()}
		<div class="grid gap-x-8 gap-y-5 md:grid-cols-3">
			<div>
				<div class="mb-2 flex justify-between text-xs text-muted-foreground">
					<span>top-k: {off(topK, topK === 0)}</span><span>keep this many words</span>
				</div>
				<Slider type="single" bind:value={topK} min={0} max={16} step={1} />
			</div>
			<div>
				<div class="mb-2 flex justify-between text-xs text-muted-foreground">
					<span>top-p: {off(topP.toFixed(2), topP >= 1)}</span><span>keep this share of the odds</span>
				</div>
				<Slider type="single" bind:value={topP} min={0.5} max={1} step={0.01} />
			</div>
			<div>
				<div class="mb-2 flex justify-between text-xs text-muted-foreground">
					<span>min-p: {off(minP.toFixed(2), minP <= 0)}</span><span>share of the top word's odds</span>
				</div>
				<Slider type="single" bind:value={minP} min={0} max={0.3} step={0.01} />
			</div>
			<div>
				<div class="mb-2 flex justify-between text-xs text-muted-foreground">
					<span>temperature: {temperature.toFixed(2)}</span><span>how bold the pick is</span>
				</div>
				<Slider type="single" bind:value={temperature} min={0} max={2} step={0.05} onValueChange={stopSweep} />
			</div>
			<div>
				<div class="mb-2 flex justify-between text-xs text-muted-foreground">
					<span>repeat_penalty: {penalty === 1 ? 'off' : penalty.toFixed(2)}</span><span>lower words already used</span>
				</div>
				<Slider type="single" bind:value={penalty} min={1} max={2} step={0.05} onValueChange={stopSweep} />
			</div>
			<div class="flex flex-wrap items-end gap-2">
				<Button variant="outline" onclick={() => (stopSweep(), (seed += 1))} disabled={!gb}>Another reply</Button>
				<Button variant="outline" onclick={reset}>Reset</Button>
			</div>
		</div>
	{/snippet}

	{#snippet say()}
		{#if sum}
			<p class="leading-relaxed">
				<b class="font-medium">
					At this spot your settings keep {sum.kept} of {spot.words.length} words, and a word that makes no sense comes up {percent(sum.badChance)} of the time.
				</b>
				{copy.say({ spot: spot.label, ...sum })}
			</p>
			<p class="mt-1 text-sm text-muted-foreground">{copy.trap({ topK, minP, spot: spot.label })}</p>
			<p class="mt-1 text-sm text-muted-foreground">{copy.penaltyNote(penalty)}</p>
		{:else}
			<p class="text-muted-foreground">Loading the engine…</p>
		{/if}
	{/snippet}

	{#snippet cards()}
		<div class="mb-4 grid gap-3.5 md:grid-cols-3">
			{#each [{ title: 'Words kept', value: sum ? `${sum.kept} of ${spot.words.length}` : '–', share: sum ? sum.kept / spot.words.length : 0, text: 'Left in the draw at this spot.' }, { title: 'A word that makes no sense', value: sum ? percent(sum.badChance) : '–', share: sum ? Math.min(1, sum.badChance * 10) : 0, text: `The chance of one of the ${sum ? sum.bad : ''} ✗ words.` }, { title: 'Good words cut', value: sum ? String(sum.goodCut) : '–', share: sum ? sum.goodCut / spot.bad : 0, text: `Of the ${spot.bad} words that fit here.` }] as c (c.title)}
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
				<p class="max-w-3xl text-sm text-muted-foreground">Open Under the hood for each word's numbers at every step, with your settings.</p>
			</Tabs.Content>
			<Tabs.Content value="hood">
				<div class="rounded-lg border px-4 py-3.5 text-sm">
					<div class="space-y-1 text-muted-foreground">
						<div>1. odds = e^score, divided by the sum over all words (temperature 1).</div>
						<div>2. top-k keeps the k highest. top-p keeps the top words until their odds reach p. min-p keeps odds ≥ min-p × the top word's.</div>
						<div>3. final odds = e^(score / temperature) over the words left, divided by their sum.</div>
						<div>repeat_penalty, before all of this: a used word's score is divided by the penalty if above 0, and multiplied by it if below.</div>
					</div>
					{#if result && gb}
						{@const p1 = gb.softmax(spot.scores, 1)}
						<div class="mt-3 grid grid-cols-[6rem_1fr_1fr_1fr_1fr] gap-y-1 leading-6">
							<span class="text-xs text-muted-foreground">word</span>
							<span class="text-xs text-muted-foreground">score</span>
							<span class="text-xs text-muted-foreground">odds at 1</span>
							<span class="text-xs text-muted-foreground">cut by</span>
							<span class="text-xs text-muted-foreground">final odds</span>
							{#each spot.words as word, i (word)}
								<span>{word}</span>
								<span class="tabular-nums">{spot.scores[i].toFixed(1)}</span>
								<span class="tabular-nums">{percent(p1[i])}</span>
								<span>{CUT_NAMES[result.cutBy[i]] || '–'}</span>
								<span class="tabular-nums">{percent(result.odds[i])}</span>
							{/each}
						</div>
					{/if}
					<p class="mt-3 text-xs text-muted-foreground">
						The reply model scores a word as {BASE} + ln(times it followed the last word in the text), and the penalty looks back {LAST_N} words (repeat_last_n). {copy.hoodNote}
					</p>
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
		Every number on this page comes from a C engine compiled to WebAssembly. The scores of the two spots are made up, and the reply comes from a model counted
		from twenty sentences about a made-up town.
	{/snippet}
</ModulePage>
