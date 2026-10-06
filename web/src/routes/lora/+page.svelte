<script>
	import { onMount } from 'svelte';
	import ModulePage from '$lib/components/ModulePage.svelte';
	import LoraStage from '$lib/components/LoraStage.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Slider } from '$lib/components/ui/slider/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { getEngine } from '$lib/engine-loader.js';
	import { TEXTS, RANKS, HIDDEN, EPOCHS, RATE, V, VOCAB, PROBES, QWEN, W2, strips, trainBase, fineTune, patchOf, percent } from '$lib/lora-sim.js';
	import { where } from '$lib/modules.js';
	import * as copy from '$lib/lora-copy.js';

	let gb = $state.raw(null);
	let base = $state.raw(null);
	let runs = $state.raw([null, null, null]);
	let t = $state(2);
	let rankAt = $state(1);
	let every = $state(true);

	const r = $derived(RANKS[rankAt]);
	const run = $derived(runs[t]);
	const at = $derived(run ? run.ranks.find((x) => x.r === r) : null);
	const here = where('lora');

	// Training takes a moment, so each text trains in its own turn: the chosen one first.
	onMount(() => {
		let stop = false;
		getEngine().then((engine) => {
			gb = engine;
			base = trainBase(engine);
			const order = [t, ...[0, 1, 2].filter((i) => i !== t)];
			const next = () => {
				if (stop || !order.length) return;
				const i = order.shift();
				const done = fineTune(engine, base, i);
				runs = runs.map((x, j) => (j === i ? done : x));
				setTimeout(next, 30);
			};
			setTimeout(next, 30);
		});
		return () => (stop = true);
	});

	// the probe word's odds: before, after LoRA at this rank, after a full fine-tune
	const odds = $derived.by(() => {
		if (!gb || !base || !run || !at) return null;
		const word = PROBES[t];
		const before = gb.nnForward(base, V, HIDDEN, word).odds;
		const full = gb.nnForward(run.full.params, V, HIDDEN, word).odds;
		const lora = gb.nnForward(gb.loraMerge(base, at.lora, V, HIDDEN, r), V, HIDDEN, word).odds;
		// the six words that matter most before or after
		const pick = Array.from(VOCAB.keys())
			.sort((a, b) => Math.max(before[b], full[b]) - Math.max(before[a], full[a]))
			.slice(0, 6);
		return { words: pick.map((i) => VOCAB[i]), before: pick.map((i) => before[i]), lora: pick.map((i) => lora[i]), full: pick.map((i) => full[i]) };
	});

	const patch = $derived.by(() => {
		if (!gb || !at) return null;
		const s = strips(r);
		return { b: at.lora.slice(s.b2, s.b2 + HIDDEN * r), a: at.lora.slice(s.a2, s.a2 + r * V), product: patchOf(gb, at.lora, r) };
	});

	const qwen = $derived.by(() => {
		if (!gb) return null;
		const count = gb.loraCount(QWEN.layers, QWEN.hidden, QWEN.qOut, QWEN.kvOut, QWEN.inter, r, every);
		return { count, share: count / QWEN.params };
	});
</script>

<svelte:head><title>LoRA · Glass Box</title></svelte:head>

<ModulePage
	track={here.track.title}
	n={here.n}
	total={here.total}
	tag={here.tag}
	title="How can a small patch change a big model?"
	lead="Fine-tuning teaches a model something new by changing its numbers. LoRA keeps the model as it is and trains a thin patch next to each layer instead. Pick how wide the patch is, its rank, and see how much of a full fine-tune it gets."
	whyLead={copy.whyLead}
>
	{#snippet presets()}
		<p class="mb-2 text-xs text-muted-foreground">Three new texts for a model that knows Millbrook, from a small change to a big one:</p>
		<div class="mb-3.5 grid gap-2.5 md:grid-cols-3">
			{#each TEXTS as x, i (x.label)}
				<button
					type="button"
					onclick={() => (t = i)}
					class="rounded-lg border bg-sidebar px-3.5 py-3 text-left text-sm text-muted-foreground transition-colors hover:border-foreground/40 {t === i ? 'border-foreground bg-muted' : ''}"
				>
					<b class="block font-medium text-foreground">{x.label}</b>
					<span class="mt-0.5 block text-xs">{x.hint}</span>
				</button>
			{/each}
		</div>
	{/snippet}

	{#snippet stage()}
		<LoraStage {t} {r} {runs} {odds} {patch} {qwen} {every} />
	{/snippet}

	{#snippet legend()}
		<div class="flex flex-wrap gap-x-5 gap-y-1">
			<span><span class="mr-1.5 inline-block h-2 w-4 rounded-sm bg-foreground/80 align-middle"></span>After LoRA, or the gain it reaches</span>
			<span><span class="mr-1.5 inline-block h-2 w-4 rounded-sm border border-muted-foreground align-middle"></span>Before, or the numbers it trains</span>
			<span><span class="mr-1.5 inline-block h-3 w-0.5 bg-foreground align-middle"></span>A full fine-tune</span>
		</div>
	{/snippet}

	{#snippet controls()}
		<div class="grid gap-x-8 gap-y-5 md:grid-cols-2">
			<div>
				<div class="mb-2 flex justify-between text-xs text-muted-foreground">
					<span>rank: {r}</span><span>how many directions the patch can change</span>
				</div>
				<Slider type="single" bind:value={rankAt} min={0} max={RANKS.length - 1} step={1} />
				<div class="relative mt-2 h-4 text-xs text-muted-foreground">
					{#each RANKS as k, i (k)}
						<span class="absolute -translate-x-1/2" style="left: calc(8px + (100% - 16px) * {i / (RANKS.length - 1)})">{k}</span>
					{/each}
				</div>
			</div>
			<div>
				<div class="mb-2 text-xs text-muted-foreground">target_modules on {QWEN.name}</div>
				<div class="flex flex-wrap gap-1.5">
					<Button size="sm" variant={every ? 'outline' : 'default'} onclick={() => (every = false)}>Attention only</Button>
					<Button size="sm" variant={every ? 'default' : 'outline'} onclick={() => (every = true)}>Every weight</Button>
				</div>
			</div>
		</div>
	{/snippet}

	{#snippet say()}
		{#if run && at}
			<p class="leading-relaxed">
				<b class="font-medium">
					Rank {r} trains {at.trained.toLocaleString('en-US')} numbers, {percent(at.trained / run.fullCount)} of a full fine-tune here, and reaches {percent(Math.max(0, at.gain))} of its gain.
				</b>
				{copy.say(at.gain, TEXTS[t].label)}
			</p>
			<p class="mt-1 text-sm text-muted-foreground">{copy.trap(r, t)}</p>
		{:else}
			<p class="text-muted-foreground">Training the model…</p>
		{/if}
	{/snippet}

	{#snippet cards()}
		<div class="mb-4 grid gap-3.5 md:grid-cols-3">
			{#each [{ title: 'Gain reached', value: at ? percent(Math.max(0, at.gain)) : '–', share: at ? Math.max(0, Math.min(1, at.gain)) : 0, text: "Of what a full fine-tune gets on this text." }, { title: 'Numbers trained here', value: at ? at.trained.toLocaleString('en-US') : '–', share: at && run ? Math.min(1, at.trained / run.fullCount) : 0, text: `Of ${run ? run.fullCount.toLocaleString('en-US') : '–'} in this tiny network.` }, { title: `Numbers trained on ${QWEN.name}`, value: qwen ? percent(qwen.share) : '–', share: qwen ? Math.min(1, qwen.share * 20) : 0, text: qwen ? `${(qwen.count / 1e6).toFixed(1)}M of ${(QWEN.params / 1e9).toFixed(1)}B, ${every ? 'every weight' : 'attention only'}.` : '' }] as c (c.title)}
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
				<p class="max-w-3xl text-sm text-muted-foreground">Open Under the hood for the formulas, with the numbers from this fine-tune.</p>
			</Tabs.Content>
			<Tabs.Content value="hood">
				{#if run && at}
					<div class="space-y-2 rounded-lg border px-4 py-3.5 text-sm">
						<div class="text-muted-foreground">A layer with LoRA: W + B × A. W stays frozen; B starts at zero, so the patch starts as no change.</div>
						<div class="font-mono text-xs tabular-nums">
							numbers trained = 2 × rank × (words + hidden) = 2 × {r} × ({V} + {HIDDEN}) = {at.trained.toLocaleString('en-US')}
						</div>
						<div class="text-muted-foreground">
							Gain reached = (loss before − loss after LoRA) ÷ (loss before − loss after a full fine-tune). Loss is how surprised the model is by the new text.
						</div>
						<div class="font-mono text-xs tabular-nums">
							({run.before.toFixed(2)} − {at.loss.toFixed(2)}) ÷ ({run.before.toFixed(2)} − {run.full.loss.toFixed(2)}) = {percent(Math.max(0, at.gain))}
						</div>
						<div class="text-muted-foreground">
							Each fine-tune takes {EPOCHS} passes over the new text at learning rate {RATE}. The closest rank-{r} copy of the full fine-tune's change to the last layer keeps
							{percent(at.kept)} of it, yet LoRA reaches {percent(Math.max(0, at.gain))} of the gain: it finds its own small change.
						</div>
						<div class="text-muted-foreground">
							{QWEN.name}: per layer, rank × (in + out) for each weight patched. Attention: query {QWEN.hidden}→{QWEN.qOut}, key and value {QWEN.hidden}→{QWEN.kvOut},
							output {QWEN.qOut}→{QWEN.hidden}. Every weight adds gate and up {QWEN.hidden}→{QWEN.inter} and down {QWEN.inter}→{QWEN.hidden}. × {QWEN.layers} layers.
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
		Every number on this page comes from a C engine compiled to WebAssembly, which trains the network and every patch in your browser. The texts are made up; the
		{QWEN.name} shapes are from its published config.
	{/snippet}
</ModulePage>
