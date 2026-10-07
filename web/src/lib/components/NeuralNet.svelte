<script>
	import { label } from '$lib/text-model.js';
	import { t } from '$lib/i18n.svelte.js';
	import { HIDDEN, w1, w2, inputWords, outputWords } from '$lib/network.js';
	import { percent } from '$lib/sampling-sim.js';

	// model, net: the text model and the network's learned numbers.
	// current: the word going in. data: the hidden values and odds for it.
	// step: which step of the loop is showing (-1 when idle). picked: the word chosen.
	let { model, net, current, data, step, picked } = $props();

	const IN_X = 130;
	const HID_X = 360;
	const OUT_X = 560;
	const BAR_X = 654;
	const BAR_W = 120;

	const inputs = $derived(inputWords(model, current));
	const outputs = $derived(outputWords(data.odds, picked));

	const inY = (i) => 54 + i * (300 / (inputs.length - 1 || 1));
	const hidY = (j) => 62 + j * 40;
	const outY = (k) => 62 + k * 40;

	// idle shows everything. While a pick runs, the picture fills in step by step.
	const showHidden = $derived(step === -1 || step >= 1);
	const showOut = $derived(step === -1 || step >= 2);
	const showPick = $derived(step === 2 && picked != null);

	// first connections: the input word to each hidden unit
	const inWeights = $derived(Array.from({ length: HIDDEN }, (_, j) => w1(net, model, current, j)));
	const inMax = $derived(Math.max(...inWeights.map(Math.abs), 1e-9));

	// second connections: what each hidden unit pushes into each shown output
	const pushes = $derived(
		Array.from({ length: HIDDEN }, (_, j) => outputs.map((k) => data.hidden[j] * w2(net, model, j, k)))
	);
	const pushMax = $derived(Math.max(...pushes.flat().map(Math.abs), 1e-9));
	const oddsMax = $derived(Math.max(...outputs.map((k) => data.odds[k]), 1e-9));
</script>

<div
	role="img"
	aria-label={t(
		'A neural network. A word goes in on the left, a hidden layer of numbers works on it in the middle, and odds for the next word come out on the right.',
		'Uma rede neural. Uma palavra entra à esquerda, uma camada oculta de números trabalha nela no meio, e as chances da próxima palavra saem à direita.'
	)}
>
	<svg viewBox="0 0 800 380" class="w-full">
		<g class="fill-muted-foreground" font-size="11" text-anchor="middle">
			<text x={IN_X} y="22">{t('Word in', 'Palavra que entra')}</text>
			<text x={HID_X} y="22">{t('Numbers inside', 'Números internos')}</text>
			<text x={OUT_X + 110} y="22">{t('Odds for the next word', 'Chances da próxima palavra')}</text>
		</g>

		<g class="stroke-foreground" fill="none">
			{#each inWeights as w, j (j)}
				<line
					x1={IN_X}
					y1={inY(0)}
					x2={HID_X}
					y2={hidY(j)}
					stroke-dasharray={w < 0 ? '4 3' : 'none'}
					style="stroke-width: {0.4 + (3.2 * Math.abs(w)) / inMax}px; stroke-opacity: {showHidden || step === 0
						? 0.15 + (0.6 * Math.abs(w)) / inMax
						: 0}; transition: stroke-width 0.5s, stroke-opacity 0.4s"
				/>
			{/each}

			{#each pushes as row, j (j)}
				{#each row as c, ki (ki)}
					<line
						x1={HID_X}
						y1={hidY(j)}
						x2={OUT_X}
						y2={outY(ki)}
						stroke-dasharray={c < 0 ? '4 3' : 'none'}
						style="stroke-width: {0.3 + (3 * Math.abs(c)) / pushMax}px; stroke-opacity: {showOut
							? 0.1 + (0.55 * Math.abs(c)) / pushMax
							: 0}; transition: stroke-width 0.5s, stroke-opacity 0.4s"
					/>
				{/each}
			{/each}
		</g>

		{#each inputs as id, i (id)}
			<circle
				cx={IN_X}
				cy={inY(i)}
				r={i === 0 ? 8 : 6}
				class={i === 0 ? 'fill-foreground stroke-foreground' : 'fill-none stroke-muted-foreground'}
				style="transition: r 0.3s"
			/>
			<text
				x={IN_X - 14}
				y={inY(i) + 4}
				text-anchor="end"
				font-size="11"
				class={i === 0 ? 'fill-foreground font-semibold' : 'fill-muted-foreground'}
			>
				{label(model, id, t('full stop', 'ponto final'))}
			</text>
		{/each}
		<text x={IN_X} y="372" text-anchor="middle" font-size="10" class="fill-muted-foreground">
			{t('only the word it is on is active', 'só a palavra atual fica ativa')}
		</text>

		{#each data.hidden as h, j (j)}
			<circle
				cx={HID_X}
				cy={hidY(j)}
				r="10"
				class="fill-foreground stroke-foreground"
				stroke-dasharray={h < 0 ? '3 2' : 'none'}
				style="fill-opacity: {showHidden ? Math.max(0.05, Math.abs(h)) : 0.05}; stroke-opacity: {showHidden
					? 0.8
					: 0.25}; transition: fill-opacity 0.5s, stroke-opacity 0.4s"
			>
				<title>{t('hidden unit', 'unidade oculta')} {j + 1}: {h.toFixed(2)}</title>
			</circle>
		{/each}
		<text x={HID_X} y="372" text-anchor="middle" font-size="10" class="fill-muted-foreground">
			{t('brighter means a stronger value', 'mais intenso significa um valor mais forte')}
		</text>

		{#each outputs as id, k (id)}
			{@const p = data.odds[id]}
			<circle
				cx={OUT_X}
				cy={outY(k)}
				r="7"
				class="fill-foreground stroke-foreground"
				style="fill-opacity: {showOut ? 0.12 + 0.88 * (p / oddsMax) : 0.05}; stroke-opacity: {showOut ? 0.8 : 0.25}; transition: fill-opacity 0.5s"
			/>
			{#if showPick && picked === id}
				<circle cx={OUT_X} cy={outY(k)} r="13" fill="none" class="stroke-foreground" stroke-width="2" />
			{/if}
			<text
				x={OUT_X + 15}
				y={outY(k) + 4}
				font-size="11"
				class={showPick && picked === id ? 'fill-foreground font-semibold' : 'fill-muted-foreground'}
			>
				{label(model, id, t('full stop', 'ponto final'))}
			</text>
			<rect x={BAR_X} y={outY(k) - 5} width={BAR_W} height="10" rx="2" class="fill-muted" />
			<rect
				x={BAR_X}
				y={outY(k) - 5}
				height="10"
				rx="2"
				class="fill-foreground"
				fill-opacity="0.8"
				style="width: {showOut ? p * BAR_W : 0}px; transition: width 0.5s"
			/>
			<text x="796" y={outY(k) + 4} text-anchor="end" font-size="10" class="fill-muted-foreground">
				{showOut ? percent(p) : ''}
			</text>
		{/each}
		<text x={OUT_X + 110} y="372" text-anchor="middle" font-size="10" class="fill-muted-foreground">
			{t('the likeliest words, and the one it picks', 'as palavras mais prováveis, e a escolhida')}
		</text>
	</svg>
</div>
