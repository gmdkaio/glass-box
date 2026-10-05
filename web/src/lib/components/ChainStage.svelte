<script>
	import { MAX_STEPS, TRIALS, OUTCOME, replay, percent } from '$lib/compounding-sim.js';
	import { runSay } from '$lib/compounding-copy.js';
	import { eased } from '$lib/motion.svelte.js';

	// steps, every: the task length and how often a check runs (0 is never).
	// run: one run from the engine, or null. shown: how many of its events have played.
	// trials: the 1,000 runs. odds: the exact chance of finishing clean.
	// points: the chance of finishing clean at every length, for the curve.
	// pace: how long each change eases, shorter while a sweep plays.
	let { steps, every, run, shown, trials, odds, points, pace = 450 } = $props();

	// the curves, the rings and the spoil counts ease to new values
	const curves = eased(() => (points ? { plain: points.map((p) => p.plain), checked: points.map((p) => p.checked) } : null), () => pace);
	const at = eased(() => steps, () => pace);
	const spoilBars = eased(() => (trials ? Array.from(trials.brokenAt) : null), () => pace);

	const done = $derived(run && shown >= run.events.length);
	const state = $derived(run ? replay(run.events, steps, every, shown) : replay([], steps, every, 0));
	const section = $derived(every > 0 ? every : steps);
	// once a broken run has played out, show where the mistake was and what it spoiled
	const spoiled = $derived(done && run.outcome !== OUTCOME.CLEAN ? run.brokenAt : -1);
	const spoiledSection = $derived(spoiled >= 0 ? Math.floor(spoiled / section) : -1);
	const redos = $derived(state.checks.reduce((a, c) => a + c.redos, 0));

	// the cells in sections, so a check can sit after each one
	const sections = $derived(
		Array.from({ length: Math.ceil(steps / section) }, (_, s) =>
			state.cells.slice(s * section, Math.min((s + 1) * section, steps)).map((cell, i) => ({ cell, at: s * section + i }))
		)
	);

	function look(cell, at) {
		if (spoiled >= 0 && at > spoiled && cell !== 'todo') return 'bg-foreground/25';
		if (spoiled >= 0 && at > spoiled) return 'border border-dashed border-muted-foreground/40';
		if (cell === 'right') return 'bg-foreground/80';
		if (cell === 'wrong') return 'border-2 border-foreground';
		if (cell === 'redo') return 'border border-dashed border-foreground/70';
		return 'border border-muted-foreground/40';
	}

	function mark(check, s) {
		if (done && s === spoiledSection && run.outcome === OUTCOME.BROKEN) return { text: '✗', title: 'Passed, but missed a mistake' };
		if (check.state === 'passed') return { text: check.redos ? `✓${check.redos}` : '✓', title: check.redos ? `Passed after ${check.redos} redo(s)` : 'Passed' };
		if (check.state === 'caught') return { text: `↺${check.redos}`, title: 'Caught a mistake, section redone' };
		return { text: '·', title: 'Not reached yet' };
	}

	const total = $derived(trials ? trials.outcomes[0] + trials.outcomes[1] + trials.outcomes[2] : 0);
	const rows = $derived(
		trials
			? [
					{ label: 'Finished clean', n: trials.outcomes[0], exact: odds },
					{ label: 'Spoiled', n: trials.outcomes[1] },
					{ label: 'Gave up', n: trials.outcomes[2] }
				]
			: []
	);
	const most = $derived(spoilBars.current ? Math.max(1, ...spoilBars.current) : 1);

	const cx = (n) => 30 + ((n - 1) / (MAX_STEPS - 1)) * 260;
	const cy = (p) => 140 - p * 130;
	const line = (key) => (points && curves.current ? points.map((p, i) => `${cx(p.n)},${cy(curves.current[key][i])}`).join(' ') : '');
	// the rings ride the curves at the eased length, read between whole steps
	function on(key) {
		const c = curves.current;
		if (!c) return 0;
		const k = Math.min(Math.max(at.current - 1, 0), c[key].length - 1);
		const lo = Math.floor(k);
		return lo + 1 < c[key].length ? c[key][lo] + (c[key][lo + 1] - c[key][lo]) * (k - lo) : c[key][lo];
	}
</script>

<div class="overflow-hidden rounded-lg border lg:grid lg:min-h-80 lg:grid-cols-[1.3fr_1fr_1fr]">
	<div class="border-b px-4 py-3.5 lg:border-r lg:border-b-0">
		<h3 class="text-xs font-medium">One task, step by step</h3>
		<div class="mt-3 flex flex-wrap items-center gap-1" aria-label="Steps of one run">
			{#each sections as cells, s (s)}
				{#each cells as { cell, at } (at)}
					<span class="grid h-4 w-4 place-items-center rounded-[3px] text-[10px] leading-none {look(cell, at)}">
						{cell === 'wrong' && !(spoiled >= 0 && at > spoiled) ? '×' : ''}
					</span>
				{/each}
				{#if every > 0}
					{@const m = mark(state.checks[s], s)}
					<span
						title={m.title}
						class="mx-0.5 rounded-sm border px-1 text-[10px] leading-4 tabular-nums {state.checks[s].state === 'todo'
							? 'text-muted-foreground'
							: 'border-foreground'}">{m.text}</span
					>
				{/if}
			{/each}
		</div>
		{#if run}
			{#if done}
				<p class="mt-3 text-sm leading-relaxed">{runSay(run.outcome, run.brokenAt, every, redos)}</p>
			{:else}
				<p class="mt-3 text-sm text-muted-foreground">Running…</p>
			{/if}
		{:else}
			<p class="mt-3 text-sm text-muted-foreground">Press Run one task to watch a single run, one step at a time.</p>
		{/if}
	</div>

	<div class="border-b px-4 py-3.5 lg:border-r lg:border-b-0">
		<h3 class="text-xs font-medium">{TRIALS.toLocaleString('en-US')} runs of the same task</h3>
		{#if trials}
			<div class="mt-3.5 space-y-2.5">
				{#each rows as r (r.label)}
					<div class="grid grid-cols-[7.5rem_1fr_3rem] items-center gap-2.5 text-sm">
						<div class={r.exact !== undefined ? 'font-semibold' : 'text-muted-foreground'}>{r.label}</div>
						<div class="relative h-4 rounded-sm bg-muted/60">
							<div
								class="absolute inset-y-0 left-0 rounded-sm bg-foreground/80 transition-[width] duration-500 ease-out"
								style="width: {(r.n / total) * 100}%"
							></div>
							{#if r.exact !== undefined}
								<div class="absolute inset-y-0 left-0 rounded-sm border border-muted-foreground" style="width: {r.exact * 100}%"></div>
							{/if}
						</div>
						<div class="text-xs text-muted-foreground tabular-nums">{percent(r.n / total)}</div>
					</div>
				{/each}
			</div>
			<div class="mt-2 text-xs text-muted-foreground">Outline: the exact chance. Solid: what happened.</div>

			<h4 class="mt-4 text-xs font-medium">Where the spoiling mistake happened</h4>
			<svg viewBox="0 0 300 70" class="mt-1.5 w-full" role="img" aria-label="Runs spoiled at each step">
				<line x1="0" y1="56" x2="300" y2="56" class="stroke-border" />
				{#each spoilBars.current ?? trials.brokenAt as c, i (i)}
					<rect
						x={(i / steps) * 300 + 0.5}
						y={56 - (c / most) * 52}
						width={Math.max(300 / steps - 1, 1)}
						height={(c / most) * 52}
						class="fill-foreground/70"
					/>
				{/each}
				<text x="0" y="68" font-size="9" class="fill-muted-foreground">step 1</text>
				<text x="300" y="68" font-size="9" text-anchor="end" class="fill-muted-foreground">step {steps}</text>
			</svg>
		{/if}
	</div>

	<div class="px-4 py-3.5">
		<h3 class="text-xs font-medium">Longer tasks, lower odds</h3>
		<p class="mt-3 text-xs text-muted-foreground">Chance of finishing clean, by the number of steps.</p>
		<div role="img" aria-label="The chance of finishing clean falls as the task gets longer, and falls more slowly with checks.">
			<svg viewBox="0 0 300 175" class="w-full">
				<g class="stroke-border" stroke-width="1">
					{#each [1, 25, 50, 75, 100] as n (n)}
						<line x1={cx(n)} y1="10" x2={cx(n)} y2="140" />
					{/each}
					<line x1="30" y1="140" x2="290" y2="140" />
					<line x1="30" y1="10" x2="290" y2="10" />
				</g>
				<g class="fill-muted-foreground" font-size="10">
					{#each [1, 25, 50, 75, 100] as n (n)}
						<text x={cx(n)} y="156" text-anchor="middle">{n}</text>
					{/each}
					<text x="26" y="14" text-anchor="end">100%</text>
					<text x="26" y="143" text-anchor="end">0%</text>
					<text x="160" y="171" text-anchor="middle">steps</text>
				</g>
				{#if points}
					<polyline points={line('plain')} fill="none" class="stroke-foreground" stroke-width="2" />
					{#if every > 0}
						<polyline points={line('checked')} fill="none" class="stroke-muted-foreground" stroke-width="2" stroke-dasharray="5 4" />
					{/if}
					{#if curves.current}
						<circle cx={cx(at.current)} cy={cy(on('plain'))} r="5" fill="none" class="stroke-foreground" stroke-width="2" />
						{#if every > 0}
							<circle cx={cx(at.current)} cy={cy(on('checked'))} r="5" fill="none" class="stroke-foreground" stroke-width="2" />
						{/if}
					{/if}
				{/if}
			</svg>
		</div>
		<div class="text-xs text-muted-foreground">
			Solid: no checks.{every > 0 ? ' Dashed: with your checks.' : ''} The rings mark your task.
		</div>
	</div>
</div>
