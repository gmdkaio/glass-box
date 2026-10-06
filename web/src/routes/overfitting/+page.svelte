<script>
	import { onMount } from 'svelte';
	import ModulePage from '$lib/components/ModulePage.svelte';
	import OverfitStage from '$lib/components/OverfitStage.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Slider } from '$lib/components/ui/slider/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { getEngine } from '$lib/engine-loader.js';
	import { Sweep } from '$lib/motion.svelte.js';
	import { SIZES, PRESETS, PASSES, EPOCHS, RATE, HELD, MIX, trainBase, watch } from '$lib/overfit-sim.js';
	import { where } from '$lib/modules.js';
	import * as copy from '$lib/overfit-copy.js';

	let gb = $state.raw(null);
	let runs = $state.raw(SIZES.map(() => null));
	let size = $state(1);
	let pass = $state(150);
	const sweep = new Sweep();
	const here = where('overfitting');

	const run = $derived(runs[size]);
	// the pass with the lowest held-out loss, per run
	const best = $derived(runs.map((r) => (r ? r.held.indexOf(Math.min(...r.held)) : 0)));
	const at = $derived(best[size]);

	// Training takes a moment: the chosen size first, the rest one per turn after it.
	onMount(() => {
		let stop = false;
		getEngine().then((engine) => {
			gb = engine;
			const base = trainBase(engine);
			const order = [size, ...SIZES.keys()].filter((i, k, all) => all.indexOf(i) === k);
			const next = () => {
				if (stop || !order.length) return;
				const i = order.shift();
				const done = watch(engine, base, i);
				runs = runs.map((x, j) => (j === i ? done : x));
				setTimeout(next, 0);
			};
			setTimeout(next, 0);
		});
		return () => {
			stop = true;
			sweep.stop();
		};
	});

	// keep training: every pass early on, then bigger strides, on the log scale of the chart
	const STEPS = [...new Set(Array.from({ length: 61 }, (_, i) => Math.round(10 ** ((i / 60) * Math.log10(EPOCHS + 1)) - 1)))];
	const playSweep = () => sweep.toggle(STEPS, 110, (p) => (pass = p));
	const passAt = $derived(PASSES.reduce((k, p, i) => (Math.abs(p - pass) < Math.abs(PASSES[k] - pass) ? i : k), 0));
	function setPassAt(i) {
		sweep.stop();
		pass = PASSES[i];
	}
	function preset(p) {
		sweep.stop();
		size = p.size;
		pass = p.pass;
	}
	const gap = $derived(run ? run.held[pass] - run.train[pass] : 0);
</script>

<svelte:head><title>Overfitting · Glass Box</title></svelte:head>

<ModulePage
	track={here.track.title}
	n={here.n}
	total={here.total}
	tag={here.tag}
	title="When does more training make a model worse?"
	lead="A model trained on a few examples for too long learns them by heart. It gets better and better at those exact sentences and worse at new ones, and it forgets what it knew before. Train it and watch a sentence it never saw."
	whyLead={copy.whyLead}
>
	{#snippet presets()}
		<p class="mb-2 text-xs text-muted-foreground">The Millbrook model, fine-tuned on short sentences about a fair:</p>
		<div class="mb-3.5 grid gap-2.5 md:grid-cols-3">
			{#each PRESETS as p (p.label)}
				<button
					type="button"
					onclick={() => preset(p)}
					class="rounded-lg border bg-sidebar px-3.5 py-3 text-left text-sm text-muted-foreground transition-colors hover:border-foreground/40 {size === p.size && pass === p.pass
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
		<OverfitStage {size} {pass} {runs} {best} play={{ playing: sweep.playing, label: 'Keep training', onclick: playSweep, disabled: !run }} />
	{/snippet}

	{#snippet legend()}
		<div class="flex flex-wrap gap-x-5 gap-y-1">
			<span><span class="mr-1.5 inline-block h-2 w-4 rounded-sm bg-foreground/80 align-middle"></span>At your pass</span>
			<span><span class="mr-1.5 inline-block h-2 w-4 rounded-sm border border-muted-foreground align-middle"></span>At the best pass</span>
			<span>Surprise and loss: how unexpected a word or text is to the model. Lower is better.</span>
		</div>
	{/snippet}

	{#snippet controls()}
		<div class="grid gap-x-8 gap-y-5 md:grid-cols-2">
			<div>
				<div class="mb-2 flex justify-between text-xs text-muted-foreground">
					<span>num_train_epochs: {pass}</span><span>passes over the training text</span>
				</div>
				<Slider type="single" value={passAt} onValueChange={setPassAt} min={0} max={PASSES.length - 1} step={1} />
				<div class="relative mt-2 h-4 text-xs text-muted-foreground">
					{#each PASSES as p, i (p)}
						{#if [1, 10, 50, 200].includes(p)}
							<span class="absolute -translate-x-1/2" style="left: calc(8px + (100% - 16px) * {i / (PASSES.length - 1)})">{p}</span>
						{/if}
					{/each}
				</div>
			</div>
			<div>
				<div class="mb-2 text-xs text-muted-foreground">Training text</div>
				<div class="flex flex-wrap gap-1.5">
					{#each SIZES as s, i (s.label)}
						<Button size="sm" variant={size === i ? 'default' : 'outline'} onclick={() => (size = i)}>{s.label}</Button>
					{/each}
				</div>
			</div>
		</div>
	{/snippet}

	{#snippet say()}
		{#if run}
			<p class="leading-relaxed">
				<b class="font-medium">
					After {pass} passes the training loss is {run.train[pass].toFixed(2)} and the held-out loss is {run.held[pass].toFixed(2)}; it was lowest, {run.held[at].toFixed(2)}, at pass {at}.
				</b>
				{copy.say({ pass, best: at, heldNow: run.held[pass], heldBest: run.held[at] })}
			</p>
			<p class="mt-1 text-sm text-muted-foreground">{copy.trap(size, pass)}</p>
		{:else}
			<p class="text-muted-foreground">Training the model…</p>
		{/if}
	{/snippet}

	{#snippet cards()}
		<div class="mb-4 grid gap-3.5 md:grid-cols-3">
			{#each [{ title: 'Held-out loss', value: run ? run.held[pass].toFixed(2) : '–', share: run ? Math.min(1, run.held[pass] / 8) : 0, text: run ? `Lowest at pass ${at}: ${run.held[at].toFixed(2)}.` : '' }, { title: 'The gap', value: run ? gap.toFixed(2) : '–', share: run ? Math.min(1, Math.max(0, gap) / 8) : 0, text: 'Held-out loss minus training loss. It grows as the model learns by heart.' }, { title: 'What it knew', value: run ? run.old[pass].toFixed(2) : '–', share: run ? Math.min(1, run.old[pass] / 8) : 0, text: run ? `Loss on the Millbrook text, from ${run.old[0].toFixed(2)} before.` : '' }] as c (c.title)}
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
				<p class="max-w-3xl text-sm text-muted-foreground">Open Under the hood for how each number is measured.</p>
			</Tabs.Content>
			<Tabs.Content value="hood">
				<div class="space-y-2 rounded-lg border px-4 py-3.5 text-sm text-muted-foreground">
					<div>Surprise at a word: −ln(the odds the model gave it after the word before). Loss: the average surprise over a text.</div>
					<div>
						Training text: the first {SIZES[size].n} fair sentences{SIZES[size].mix ? `, plus ${MIX} old Millbrook sentences` : ''}. Held-out: {HELD.length} more fair sentences the model never
						trains on. Each pass is one round over the training text at learning rate {RATE}.
					</div>
					<div>The best pass is where the held-out loss is lowest, the point a trainer that keeps the best checkpoint would stop at.</div>
					<p class="pt-2 text-xs">{copy.hoodNote}</p>
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
		Every number on this page comes from a C engine compiled to WebAssembly, which trains the network in your browser. It is the same tiny word-pair network as on
		the LoRA and learning rate pages, and the fair sentences are made up.
	{/snippet}
</ModulePage>
