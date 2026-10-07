<script>
	import { MAX_WORDS_IN_SENTENCE, show } from '$lib/text-model.js';
	import { writeSentenceNet } from '$lib/network.js';
	import { t } from '$lib/i18n.svelte.js';

	// An example: five sentences written by the network in its current state.
	let { gb, model, net } = $props();

	const COUNT = 5;

	let round = $state(1);

	const sentences = $derived(
		Array.from({ length: COUNT }, (_, i) => writeSentenceNet(gb, model, net, round * 10 + i, MAX_WORDS_IN_SENTENCE))
	);
</script>

<div class="rounded-lg border px-4 py-3.5">
	<div class="flex flex-wrap items-center justify-between gap-2">
		<h3 class="text-xs font-medium">{t('An example: five sentences from this network, as it is now', 'Um exemplo: cinco frases desta rede, do jeito que ela está agora')}</h3>
		<button
			type="button"
			onclick={() => (round += 1)}
			class="rounded-md border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-foreground/40"
		>
			{t('Write five more', 'Escrever mais cinco')}
		</button>
	</div>

	<p class="mt-3 text-sm leading-relaxed text-muted-foreground">
		{#if net.epochs === 0}
			{t(
				'The network has not been taught, so these are nearly random words. Teach it above and write five more.',
				'A rede ainda não foi ensinada, então estas são palavras quase aleatórias. Ensine a rede acima e escreva mais cinco.'
			)}
		{:else}
			{t('Each sentence is built one pick at a time, with no plan for how it will end.', 'Cada frase é montada uma escolha por vez, sem plano de como vai terminar.')}
		{/if}
	</p>

	<ol class="mt-3 space-y-1.5 text-sm">
		{#each sentences as s, i (i)}
			<li class="flex gap-3">
				<span class="w-4 text-right text-xs text-muted-foreground tabular-nums">{i + 1}</span>
				<span>{show(model, s)}</span>
			</li>
		{/each}
	</ol>

	{#if net.epochs > 0}
		<p class="mt-3 text-sm leading-relaxed">
			{t(
				'Look for a sentence that is not in the training text. The network can write things nobody wrote, built from pieces that fit together, and some of them describe things that never happened.',
				'Procure uma frase que não está no texto de treino. A rede pode escrever coisas que ninguém escreveu, montadas com pedaços que se encaixam, e algumas delas descrevem coisas que nunca aconteceram.'
			)}
		</p>
	{/if}
</div>
