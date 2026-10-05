<script>
	import { onMount } from 'svelte';
	import ModulePage from '$lib/components/ModulePage.svelte';
	import CalibStage from '$lib/components/CalibStage.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Slider } from '$lib/components/ui/slider/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { getEngine } from '$lib/engine-loader.js';
	import { Sweep, range } from '$lib/motion.svelte.js';
	import { SETUPS, HARD, SURE, QUESTIONS, CHECKED, BINS, SPREAD, quiz, CARDS, cardAnswer, byHard, byBold, percent } from '$lib/calibration-sim.js';
	import { where } from '$lib/modules.js';
	import * as copy from '$lib/calibration-copy.js';

	let gb = $state.raw(null);
	let hard = $state(SETUPS[1].mean);
	let shift = $state(SETUPS[1].shift);
	let fixed = $state(false);
	let seed = $state(1);
	const sweep = new Sweep();

	const q = $derived(gb ? quiz(gb, hard, shift, seed, fixed) : null);
	const answers = $derived(gb ? CARDS.map((c, i) => cardAnswer(gb, c, i, shift, seed, fixed)) : null);
	const hardCurve = $derived(gb ? byHard(gb, shift, seed, fixed) : null);
	const boldCurve = $derived(gb ? byBold(gb, hard, seed, fixed) : null);
	const here = where('calibration');

	onMount(() => {
		getEngine().then((engine) => {
			gb = engine;
		});
		return () => sweep.stop();
	});

	// plays the same questions from an honest model to a very bold one
	function playSweep() {
		fixed = false;
		sweep.toggle(range(SURE.min, SURE.max, 31), 120, (v) => (shift = v));
	}

	function setup(s) {
		sweep.stop();
		hard = s.mean;
		shift = s.shift;
		fixed = false;
	}

	const hardName = (v) => (v >= 2 ? 'mostly easy' : v >= 1 ? 'fairly easy' : v >= 0 ? 'mixed' : v >= -0.8 ? 'hard' : 'very hard');
	const sureName = (v) => (v < 0.2 ? 'honest' : v < 1 ? 'a little surer than it is' : v < 2 ? 'much surer than it is' : 'far surer than it is');
</script>

<svelte:head><title>Calibration · Glass Box</title></svelte:head>

<ModulePage
	track={here.track.title}
	n={here.n}
	total={here.total}
	tag={here.tag}
	title="When the model says it is sure, how often is it right?"
	lead="A model can tell you how confident it is, in words or as a number. Calibration is how well that matches its record: of all the answers it gives at 80%, about 80% should be right. Give the same model easier or harder questions and see where the gap opens."
	whyLead={copy.whyLead}
>
	{#snippet presets()}
		<p class="mb-2 text-xs text-muted-foreground">The same model in three quizzes. It sounds about equally sure in all of them:</p>
		<div class="mb-3.5 grid gap-2.5 md:grid-cols-3">
			{#each SETUPS as s (s.label)}
				<button
					type="button"
					onclick={() => setup(s)}
					class="rounded-lg border bg-sidebar px-3.5 py-3 text-left text-sm text-muted-foreground transition-colors hover:border-foreground/40 {hard === s.mean &&
					shift === s.shift
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
		<CalibStage
			{answers}
			{q}
			{hard}
			{shift}
			{hardCurve}
			{boldCurve}
			play={{ playing: sweep.playing, label: 'Make it bolder', onclick: playSweep, disabled: !gb }}
			pace={sweep.playing ? 160 : 450}
		/>
	{/snippet}

	{#snippet legend()}
		<div class="flex flex-wrap gap-x-5 gap-y-1">
			<span
				><span class="mr-1 inline-block h-2 w-4 rounded-sm border border-muted-foreground align-middle"></span><span
					class="mr-1.5 inline-block h-0 w-4 border-t-2 border-foreground align-middle"
				></span>How sure it sounds</span
			>
			<span
				><span class="mr-1 inline-block h-2 w-4 rounded-sm bg-foreground/80 align-middle"></span><span
					class="mr-1.5 inline-block h-0 w-4 border-t-2 border-dashed border-muted-foreground align-middle"
				></span>How often it is right</span
			>
		</div>
	{/snippet}

	{#snippet controls()}
		<div class="grid gap-x-8 gap-y-5 md:grid-cols-2">
			<div>
				<div class="mb-2 flex justify-between text-xs text-muted-foreground">
					<span>The questions are {hardName(hard)}</span>
					<span>very hard to easy</span>
				</div>
				<Slider type="single" bind:value={hard} min={HARD.min} max={HARD.max} step={0.1} onValueChange={() => sweep.stop()} />
			</div>
			<div>
				<div class="mb-2 flex justify-between text-xs text-muted-foreground">
					<span>It sounds {sureName(shift)}</span>
					<span>honest to bold</span>
				</div>
				<Slider type="single" bind:value={shift} min={SURE.min} max={SURE.max} step={0.1} onValueChange={() => sweep.stop()} />
			</div>
			<div>
				<div class="mb-2 text-xs text-muted-foreground">Correct it with a track record of {CHECKED} checked questions</div>
				<div class="flex flex-wrap gap-1.5">
					<Button size="sm" variant={fixed ? 'outline' : 'default'} onclick={() => (fixed = false)}>As it speaks</Button>
					<Button size="sm" variant={fixed ? 'default' : 'outline'} onclick={() => (sweep.stop(), (fixed = true))}>Corrected</Button>
				</div>
			</div>
			<div>
				<div class="mb-2 text-xs text-muted-foreground">Questions</div>
				<div class="flex flex-wrap gap-1.5">
					<Button size="sm" variant="outline" onclick={() => (seed += 1)} disabled={!gb}>New set of questions</Button>
				</div>
			</div>
		</div>
	{/snippet}

	{#snippet say()}
		{#if q}
			<p class="leading-relaxed">
				<b class="font-medium">
					On average it says it is {percent(q.says)} sure, and {percent(q.right)} of its answers are right.
				</b>
				{copy.say(q.gap)}
			</p>
			<p class="mt-1 text-sm text-muted-foreground">{copy.trap(hard, shift, fixed)}</p>
		{:else}
			<p class="text-muted-foreground">Loading the engine…</p>
		{/if}
	{/snippet}

	{#snippet cards()}
		<div class="mb-4 grid gap-3.5 md:grid-cols-3">
			{#each [{ title: 'How sure it sounds', value: q?.says, text: 'The average confidence it states.' }, { title: 'How often it is right', value: q?.right, text: `Out of ${QUESTIONS.toLocaleString('en')} answers.` }, { title: 'The gap', value: q?.gap, text: 'Average distance between what it says and its record, band by band.' }] as card (card.title)}
				<div class="rounded-lg border px-4 py-3.5">
					<h3 class="text-xs font-medium">{card.title}</h3>
					<div class="mt-1 text-3xl font-semibold tracking-tight tabular-nums">{q ? percent(card.value) : '–'}</div>
					<p class="text-xs text-muted-foreground">{card.text}</p>
					<div class="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
						<div class="h-full bg-foreground transition-[width]" style="width: {q ? card.value * 100 : 0}%"></div>
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
				<p class="max-w-3xl text-sm text-muted-foreground">Open Under the hood to see how the answers are made and how the gap and the correction are worked out.</p>
			</Tabs.Content>
			<Tabs.Content value="hood">
				<div class="space-y-2 rounded-lg border px-4 py-3.5 text-sm">
					<div class="text-muted-foreground">Each of the {QUESTIONS.toLocaleString('en')} questions gets a number z, how well the model knows it, in log-odds:</div>
					<ul class="list-inside list-disc text-muted-foreground">
						<li>z = {hard.toFixed(1)} + {SPREAD} × a random draw from N(0, 1)</li>
						<li>the model is right with chance sigmoid(z) = 1 / (1 + e<sup>−z</sup>)</li>
						<li>it says it is sigmoid(z + {shift.toFixed(1)}) sure{shift < 0.05 ? ', which is honest' : ''}</li>
					</ul>
					<div class="pt-1 text-muted-foreground">
						The gap (expected calibration error): sort the answers into {BINS} bands of stated confidence, take the distance between average confidence and share
						right in each band, and average those distances weighted by how many answers each band holds.
					</div>
					{#if q}
						<div class="tabular-nums">
							Here the gap is {percent(q.gap)}. The Brier score, the average of (confidence − outcome)², is {q.brier.toFixed(3)}; lower is better.
						</div>
						{#if fixed}
							<div class="tabular-nums">
								Correction: on {CHECKED} separate questions with known answers, the shift that fits best is {q.fix.toFixed(2)} in log-odds. Every stated
								confidence c becomes sigmoid(logit(c) {q.fix < 0 ? '−' : '+'} {Math.abs(q.fix).toFixed(2)}).
							</div>
						{/if}
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
		Every answer, band and score on this page comes from a C engine compiled to WebAssembly. The questions are simulated: each one is a chance of being
		right and a stated confidence, with no real text behind it.
	{/snippet}
</ModulePage>
