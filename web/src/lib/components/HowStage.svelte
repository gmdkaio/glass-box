<script>
	import NeuralNet from '$lib/components/NeuralNet.svelte';
	import LoopDiagram from '$lib/components/LoopDiagram.svelte';
	import { label } from '$lib/text-model.js';
	import { TEACH_STEPS } from '$lib/network.js';
	import { percent } from '$lib/sampling-sim.js';
	import { t } from '$lib/i18n.svelte.js';

	// model, net: the text model and the network. current: the word going in.
	// data: the network's hidden values and odds for it. info: what the text says came next.
	// sentence: words written so far. step: the loop step showing. picked: the word chosen.
	let { model, net, current, data, info, sentence, step, picked } = $props();

	const COMPARED = 5;
	const compared = $derived(info.list.slice(0, COMPARED));

	// the loss chart: teaching goes left to right, a lower line is better
	const LEFT = 8;
	const WIDTH = 244;
	const HEIGHT = 96;
	const top = $derived(Math.max(...net.losses, model.bestLoss));
	const x = (i) => LEFT + (i / TEACH_STEPS) * WIDTH;
	const y = (v) => 6 + (1 - v / top) * (HEIGHT - 12);
	const line = $derived(net.losses.map((v, i) => `${x(i)},${y(v)}`).join(' '));
</script>

<div class="overflow-hidden rounded-lg border lg:grid lg:min-h-96 lg:grid-cols-[1.9fr_1fr_1fr]">
	<div class="border-b px-4 py-3.5 lg:border-r lg:border-b-0">
		<h3 class="text-xs font-medium">{t('The network, reading one word and giving odds for the next', 'A rede, lendo uma palavra e dando as chances da próxima')}</h3>
		<NeuralNet {model} {net} {current} {data} {step} {picked} />
	</div>

	<div class="border-b px-4 py-3.5 lg:border-r lg:border-b-0">
		<h3 class="text-xs font-medium">{t('The sentence so far', 'A frase até agora')}</h3>
		{#if sentence.length === 0}
			<p class="mt-3 text-sm text-muted-foreground">{t('Press Pick next word to start.', 'Aperte Escolher a próxima palavra para começar.')}</p>
		{:else}
			<div class="mt-3 flex flex-wrap gap-1.5 text-sm">
				{#each sentence as id, i (i)}
					<span
						class="rounded-md border px-2 py-0.5 {i === sentence.length - 1 ? 'border-foreground' : 'text-muted-foreground'}"
					>
						{model.words[id] === '.' ? '.' : model.words[id]}
					</span>
				{/each}
			</div>
		{/if}
		<h3 class="mt-4 mb-2 text-xs font-medium">{t('The loop for each word', 'O ciclo de cada palavra')}</h3>
		<LoopDiagram {step} />
	</div>

	<div class="px-4 py-3.5">
		<h3 class="text-xs font-medium">{t('Is it learning?', 'Ela está aprendendo?')}</h3>
		<div role="img" aria-label={t('How surprised the network is by the text, falling as it is taught.', 'O quanto o texto surpreende a rede, caindo conforme ela é ensinada.')}>
			<svg viewBox="0 0 260 110" class="mt-2 w-full">
				<line x1={LEFT} y1={HEIGHT - 6} x2={LEFT + WIDTH} y2={HEIGHT - 6} class="stroke-border" />
				<line
					x1={LEFT}
					y1={y(model.bestLoss)}
					x2={LEFT + WIDTH}
					y2={y(model.bestLoss)}
					class="stroke-muted-foreground"
					stroke-dasharray="4 3"
				/>
				<polyline points={line} fill="none" class="stroke-foreground" stroke-width="2" />
				<text x={LEFT} y="108" font-size="9" class="fill-muted-foreground">{t('teaching', 'ensino')}</text>
				<text x={LEFT + WIDTH} y="108" font-size="9" text-anchor="end" class="fill-muted-foreground">{t('more →', 'mais →')}</text>
			</svg>
		</div>
		<p class="text-xs text-muted-foreground">
			{t(
				'How surprised the network is by the text. Lower is better. Dashed: the best a plain count of the text can do.',
				'O quanto o texto surpreende a rede. Menor é melhor. Tracejado: o melhor que uma simples contagem do texto consegue.'
			)}
		</p>

		<h3 class="mt-4 text-xs font-medium">{t('After', 'Depois de')} "{label(model, current, t('full stop', 'ponto final'))}"</h3>
		<div class="mt-2 space-y-2">
			{#each compared as f (f.id)}
				<div class="grid grid-cols-[4.5rem_1fr_2.5rem] items-center gap-2 text-xs">
					<span class="truncate">{label(model, f.id, t('full stop', 'ponto final'))}</span>
					<div class="relative h-3 rounded-sm bg-muted/60">
						<div
							class="absolute inset-y-0 left-0 rounded-sm bg-foreground/80 transition-[width] duration-500"
							style="width: {data.odds[f.id] * 100}%"
						></div>
						<div
							class="absolute inset-y-0 left-0 rounded-sm border border-muted-foreground"
							style="width: {f.p * 100}%"
						></div>
					</div>
					<span class="text-muted-foreground tabular-nums">{percent(data.odds[f.id])}</span>
				</div>
			{/each}
		</div>
		<p class="mt-2 text-xs text-muted-foreground">{t('Outline: what the text says. Solid: what the network says.', 'Contorno: o que o texto diz. Sólido: o que a rede diz.')}</p>
	</div>
</div>
