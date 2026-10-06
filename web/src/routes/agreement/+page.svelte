<script>
	import { onMount } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import ModulePage from '$lib/components/ModulePage.svelte';
	import AgreeStage from '$lib/components/AgreeStage.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { getEngine } from '$lib/engine-loader.js';
	import { QUESTIONS, NUDGES, TRUTH, YOURS, PUSH, chat, leanOf, map, percent } from '$lib/agree-sim.js';
	import { where } from '$lib/modules.js';
	import * as copy from '$lib/agree-copy.js';

	let gb = $state.raw(null);
	let qi = $state(1);
	const on = new SvelteSet(['pushback']);
	const here = where('agreement');

	onMount(() => {
		getEngine().then((engine) => (gb = engine));
	});

	const q = $derived(QUESTIONS[qi]);
	// read on.size so the chat redoes itself when a nudge changes
	const turns = $derived(gb && on.size >= 0 ? chat(gb, q, on) : null);
	const neutral = $derived(gb ? leanOf(gb, q.scores, 0).odds : null);
	const grid = $derived(gb ? map(gb) : null);
	const curves = $derived(gb ? QUESTIONS.map((x) => Array.from({ length: NUDGES.length + 1 }, (_, n) => leanOf(gb, x.scores, n).share)) : null);
	const last = $derived(turns ? turns.at(-1).odds : null);
	const settings = $derived(NUDGES.filter((n) => n.where === 'settings' && on.has(n.key)).length);

	function toggle(key) {
		if (on.has(key)) on.delete(key);
		else on.add(key);
	}
	function preset(i) {
		qi = i;
	}
</script>

<svelte:head><title>What you want to hear · Glass Box</title></svelte:head>

<ModulePage
	track={here.track.title}
	n={here.n}
	total={here.total}
	title="Does it just tell you what you want to hear?"
	lead="Chat models lean toward agreeing with you. Saying what you think, pushing back, and settings like custom instructions, memory and skills all tilt the answer your way, most of all when the model is unsure. Add nudges and watch whose side it takes."
	whyLead={copy.whyLead}
>
	{#snippet presets()}
		<p class="mb-2 text-xs text-muted-foreground">Three questions, from one it knows to one with no clear answer:</p>
		<div class="mb-3.5 grid gap-2.5 md:grid-cols-3">
			{#each QUESTIONS as x, i (x.label)}
				<button
					type="button"
					onclick={() => preset(i)}
					class="rounded-lg border bg-sidebar px-3.5 py-3 text-left text-sm text-muted-foreground transition-colors hover:border-foreground/40 {qi === i ? 'border-foreground bg-muted' : ''}"
				>
					<b class="block font-medium text-foreground">{x.label}</b>
					<span class="mt-0.5 block text-xs">{x.ask}</span>
				</button>
			{/each}
		</div>
	{/snippet}

	{#snippet stage()}
		<AgreeStage {qi} {on} {turns} {neutral} {grid} {curves} />
	{/snippet}

	{#snippet legend()}
		<div class="flex flex-wrap gap-x-5 gap-y-1">
			<span>✓ = the right answer</span>
			<span>yours = the answer you lean toward</span>
			<span><span class="mr-1.5 inline-block h-2 w-4 rounded-sm bg-foreground/80 align-middle"></span>With your nudges</span>
			<span><span class="mr-1.5 inline-block h-2 w-4 rounded-sm border border-muted-foreground align-middle"></span>Asked plainly</span>
		</div>
	{/snippet}

	{#snippet controls()}
		<div class="grid gap-x-8 gap-y-4 md:grid-cols-3">
			{#each [['message', 'In your message'], ['turn', 'In the next turn'], ['settings', 'In your settings']] as [where, title] (where)}
				<div>
					<div class="mb-2 text-xs text-muted-foreground">{title}</div>
					<div class="flex flex-wrap gap-1.5">
						{#each NUDGES.filter((n) => n.where === where) as n (n.key)}
							<Button size="sm" variant={on.has(n.key) ? 'default' : 'outline'} onclick={() => toggle(n.key)} title={n.example(q)}>{n.label}</Button>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{/snippet}

	{#snippet say()}
		{#if last && neutral}
			<p class="leading-relaxed">
				<b class="font-medium">
					With {on.size} {on.size === 1 ? 'nudge' : 'nudges'}, it gives your answer, {q.answers[YOURS]}, {percent(last[YOURS])} of the time, against {percent(neutral[YOURS])} when asked plainly.
				</b>
				{copy.say({ share: last[YOURS], neutral: neutral[YOURS], gap: q.gap })}
			</p>
			<p class="mt-1 text-sm text-muted-foreground">{copy.trap(settings, on.has('pushback'))}</p>
		{:else}
			<p class="text-muted-foreground">Loading the engine…</p>
		{/if}
	{/snippet}

	{#snippet cards()}
		<div class="mb-4 grid gap-3.5 md:grid-cols-3">
			{#each [{ title: 'Takes your side', value: last ? percent(last[YOURS]) : '–', share: last ? last[YOURS] : 0, text: `How often it answers ${q.answers[YOURS]}.` }, { title: 'Asked plainly', value: neutral ? percent(neutral[YOURS]) : '–', share: neutral ? neutral[YOURS] : 0, text: 'The same, with no nudges at all.' }, { title: 'Gives the right answer', value: last ? percent(last[TRUTH]) : '–', share: last ? last[TRUTH] : 0, text: `${q.answers[TRUTH]}, with your nudges.` }] as c (c.title)}
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
				<p class="max-w-3xl text-sm text-muted-foreground">Open Under the hood for the formula, with your numbers.</p>
			</Tabs.Content>
			<Tabs.Content value="hood">
				{#if last}
					<div class="space-y-2 rounded-lg border px-4 py-3.5 text-sm text-muted-foreground">
						<div>Each answer has a score; the odds are e^score divided by the sum over all answers, as on the Why answers vary page.</div>
						<div>Each nudge adds {PUSH} to the score of your answer. With {on.size}, that is {(on.size * PUSH).toFixed(1)} added to {q.answers[YOURS]}.</div>
						<div class="font-mono text-xs tabular-nums">
							scores: {q.answers.map((a, i) => `${a} ${(q.scores[i] + (i === YOURS ? on.size * PUSH : 0)).toFixed(1)}`).join(' · ')}
						</div>
						<div>The right answer starts {q.gap} ahead of yours. The map's rows are that lead, from 5 (knows it cold) to 0 (no answer it prefers).</div>
						<p class="pt-2 text-xs">{copy.hoodNote}</p>
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
		Every number on this page comes from a C engine compiled to WebAssembly. The scores and the size of each nudge are made up, and a real model scores tens of
		thousands of tokens.
	{/snippet}
</ModulePage>
