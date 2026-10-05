<script>
	import { untrack } from 'svelte';
	import * as copy from '$lib/quantization-copy.js';

	// A made-up example. The model has learned to add and keeps that rule as one
	// number, 1.0. At fewer bits the stored number is rounded to the nearest
	// notch, and the answer follows the rounded number.
	let { gb, bits } = $props();

	const RULE = 1;
	const LIMIT = 1.5; // the stored number can be anything from -1.5 to 1.5
	const VIEW_LOW = 0.5; // the zoomed ruler shows 0.5 to 1.5
	const VIEW_HIGH = 1.5;
	const MOVE_MS = 900;

	const sums = [
		[5, 5],
		[12, 30],
		[47, 38]
	];

	let pick = $state(0);
	let replays = $state(0);

	const total = $derived(sums[pick][0] + sums[pick][1]);
	const stored = $derived(gb.snap(RULE, bits, -LIMIT, LIMIT));
	const answer = $derived(stored * total);
	const count = $derived(gb.latticeCount(bits, 1));
	const gap = $derived(gb.quantStep(LIMIT, bits));
	const off = $derived(Math.abs(answer - total));
	const notches = $derived(
		bits <= 8 ? gb.snapLevels(bits, -LIMIT, LIMIT, 256).filter((v) => v >= VIEW_LOW && v <= VIEW_HIGH) : []
	);

	// what is drawn: it glides to the new values when the bits change
	let shownStored = $state(RULE);
	let shownAnswer = $state(RULE * 10);

	$effect(() => {
		const toStored = stored;
		const toAnswer = answer;
		replays;
		const fromStored = untrack(() => shownStored);
		const fromAnswer = untrack(() => shownAnswer);

		if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
			shownStored = toStored;
			shownAnswer = toAnswer;
			return;
		}

		const start = performance.now();
		let frame;
		const step = (now) => {
			const t = Math.min(1, (now - start) / MOVE_MS);
			const ease = 1 - (1 - t) ** 3;
			shownStored = fromStored + (toStored - fromStored) * ease;
			shownAnswer = fromAnswer + (toAnswer - fromAnswer) * ease;
			if (t < 1) frame = requestAnimationFrame(step);
		};
		frame = requestAnimationFrame(step);
		return () => cancelAnimationFrame(frame);
	});

	// back to the right values, then glide to the rounded ones again
	function restart(index) {
		pick = index;
		shownStored = RULE;
		shownAnswer = RULE * (sums[index][0] + sums[index][1]);
		replays += 1;
	}

	const pos = (v) => ((v - VIEW_LOW) / (VIEW_HIGH - VIEW_LOW)) * 100;
	const plural = (n) => (n === 1 ? '' : 's');
</script>

<div class="rounded-lg border px-4 py-3.5">
	<div class="flex flex-wrap items-center justify-between gap-2">
		<h3 class="text-xs font-medium">A made-up example with numbers</h3>
		<div class="flex flex-wrap gap-1.5">
			{#each sums as s, i (i)}
				<button
					type="button"
					onclick={() => restart(i)}
					class="rounded-md border px-2.5 py-1 text-xs transition-colors hover:border-foreground/40 {pick === i
						? 'border-foreground bg-muted text-foreground'
						: 'text-muted-foreground'}"
				>
					{s[0]} + {s[1]}
				</button>
			{/each}
			<button
				type="button"
				onclick={() => restart(pick)}
				class="rounded-md border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-foreground/40"
			>
				Ask again
			</button>
		</div>
	</div>

	<p class="mt-3 text-sm leading-relaxed text-muted-foreground">
		The model has learned how to add. It keeps that rule as one stored number, 1.0, and answers by multiplying the sum by it.
	</p>

	<div class="mt-4 grid items-center gap-2 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
		<div class="rounded-md border px-3 py-2.5 text-center">
			<div class="text-xs text-muted-foreground">The question</div>
			<div class="text-xl font-semibold">{sums[pick][0]} + {sums[pick][1]}</div>
			<div class="text-xs text-muted-foreground">= {total}</div>
		</div>
		<div class="text-center text-lg text-muted-foreground">×</div>
		<div class="rounded-md border px-3 py-2.5 text-center">
			<div class="text-xs text-muted-foreground">The stored number</div>
			<div class="text-xl font-semibold tabular-nums">{shownStored.toFixed(3)}</div>
			<div class="text-xs text-muted-foreground">it should be {RULE.toFixed(3)}</div>
		</div>
		<div class="text-center text-lg text-muted-foreground">=</div>
		<div class="rounded-md border border-foreground/40 px-3 py-2.5 text-center">
			<div class="text-xs text-muted-foreground">The model answers</div>
			<div class="text-xl font-semibold tabular-nums">{shownAnswer.toFixed(2)}</div>
			<div class="text-xs text-muted-foreground">
				right answer: {total}{off < 0.005 ? ' · spot on' : ` · off by ${off.toFixed(2)}`}
			</div>
		</div>
	</div>

	<div class="mt-6 text-xs text-muted-foreground">
		Why it changes: the stored number can only sit on a notch. This is a zoomed-in ruler from {VIEW_LOW} to {VIEW_HIGH}, and each tick is a notch.
	</div>
	<div class="relative mt-8 mb-9 h-8">
		<div class="absolute inset-x-0 top-4 h-px bg-border"></div>
		{#each notches as v (v)}
			<span class="absolute top-2.5 h-3 w-px bg-muted-foreground" style="left: {pos(v)}%"></span>
		{/each}
		{#if bits > 8}
			<div class="absolute inset-x-0 top-3 h-2 rounded-sm bg-muted-foreground/40"></div>
		{/if}
		<span
			class="absolute top-1.5 size-5 -translate-x-1/2 rounded-full border-2 border-foreground"
			style="left: {pos(RULE)}%"
		></span>
		<span class="absolute -top-5 -translate-x-1/2 text-xs whitespace-nowrap text-muted-foreground" style="left: {pos(RULE)}%">
			should be {RULE.toFixed(1)}
		</span>
		<span
			class="absolute top-2.5 size-3 -translate-x-1/2 rounded-full bg-foreground"
			style="left: {pos(shownStored)}%"
		></span>
		<span class="absolute top-9 -translate-x-1/2 text-xs whitespace-nowrap" style="left: {pos(shownStored)}%">
			stores {shownStored.toFixed(3)}
		</span>
		<span class="absolute top-9 left-0 text-xs text-muted-foreground">{VIEW_LOW}</span>
		<span class="absolute top-9 right-0 text-xs text-muted-foreground">{VIEW_HIGH}</span>
	</div>

	<p class="text-sm leading-relaxed">
		At {bits} bit{plural(bits)} there are {count.toLocaleString('en-US')} notches between {-LIMIT} and {LIMIT}, about
		{gap < 0.001 ? gap.toExponential(1) : gap.toFixed(4)} apart. {copy.ruleNote(bits)}
	</p>
	<p class="mt-2 text-sm leading-relaxed">
		{#if Math.abs(stored - RULE) < 0.0005}
			So it stores <b class="font-medium">{stored.toFixed(3)}</b>, the same as {RULE.toFixed(3)} to three decimals, and {sums[pick][0]} + {sums[pick][1]}
			comes out as <b class="font-medium">{answer.toFixed(2)}</b>.
		{:else}
			So it stores <b class="font-medium">{stored.toFixed(3)}</b> instead of {RULE.toFixed(3)}, and {sums[pick][0]} + {sums[pick][1]}
			comes out as <b class="font-medium">{answer.toFixed(2)}</b>.
		{/if}
	</p>
	<p class="mt-2 text-xs text-muted-foreground">
		A real model stores billions of numbers, and some of the errors cancel out. Rounding still changes what is stored, and the answers follow it.
	</p>
</div>
