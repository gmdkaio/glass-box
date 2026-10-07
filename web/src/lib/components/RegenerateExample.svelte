<script>
	import { WORDS, WANTED, pickWord } from '$lib/sampling-sim.js';
	import { t, local } from '$lib/i18n.svelte.js';

	// A made-up example: the same question asked 10 times at the current settings.
	let { gb, prompt, odds } = $props();

	const ASKS = 10;

	let round = $state(1);

	// the same seeds are used every time, so changing the question or the dial changes the answers smoothly
	const answers = $derived(Array.from({ length: ASKS }, (_, i) => pickWord(gb, odds, round * 100 + i)));
	const wrong = $derived(answers.filter((a) => a !== WANTED).length);
	const distinct = $derived(new Set(answers).size);
</script>

<div class="rounded-lg border px-4 py-3.5">
	<div class="flex flex-wrap items-center justify-between gap-2">
		<h3 class="text-xs font-medium">{t(`A made-up example: the same question, asked ${ASKS} times`, `Um exemplo inventado: a mesma pergunta, feita ${ASKS} vezes`)}</h3>
		<button
			type="button"
			onclick={() => (round += 1)}
			class="rounded-md border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-foreground/40"
		>
			{t('Ask again', 'Perguntar de novo')}
		</button>
	</div>

	<p class="mt-3 text-sm leading-relaxed text-muted-foreground">
		{t(
			`This is what pressing regenerate ${ASKS} times looks like. Every answer is a fresh draw from the same odds. The question is`,
			`É isto que acontece quando você aperta para gerar de novo ${ASKS} vezes. Cada resposta é um novo sorteio das mesmas chances. A pergunta é`
		)}
		<span class="text-foreground">"{local(prompt, 'text')}"</span>
	</p>

	<ol class="mt-3 grid gap-x-6 gap-y-1.5 text-sm md:grid-cols-2">
		{#each answers as a, i (i)}
			<li class="flex gap-3">
				<span class="w-5 text-right text-xs text-muted-foreground tabular-nums">{i + 1}</span>
				<span>
					<b class="font-medium {a === WANTED ? '' : 'underline decoration-dashed underline-offset-4'}">{WORDS[a]}</b>
					{#if a !== WANTED}<span class="text-xs text-muted-foreground"> · {t('not what you wanted', 'não é o que você queria')}</span>{/if}
				</span>
			</li>
		{/each}
	</ol>

	<p class="mt-3 text-sm leading-relaxed">
		{#if distinct === 1}
			{t(`All ${ASKS} answers were`, `As ${ASKS} respostas foram`)} <b class="font-medium">{WORDS[answers[0]]}</b>.
			{#if answers[0] === WANTED}
				{t('They agree and they are right, which is what you hope for.', 'Elas concordam e estão certas, que é o que você espera.')}
			{:else}
				{t(
					'They agree, and they are all wrong. Asking again shows what the model tends to say, which can be a mistake.',
					'Elas concordam, e estão todas erradas. Perguntar de novo mostra o que o modelo tende a dizer, e isso pode ser um erro.'
				)}
			{/if}
		{:else}
			{t(
				`${wrong} of ${ASKS} answers were not what you wanted, and there were ${distinct} different answers. If two asks disagree like this, that is your warning to check.`,
				`${wrong} de ${ASKS} respostas não foram o que você queria, e houve ${distinct} respostas diferentes. Quando duas perguntas discordam assim, é o seu sinal para conferir.`
			)}
		{/if}
	</p>
	<p class="mt-2 text-xs text-muted-foreground">
		{t(
			'The scores are made up. A real model scores tens of thousands to a few hundred thousand tokens, but it draws in the same way.',
			'As notas são inventadas. Um modelo de verdade dá notas para dezenas de milhares a algumas centenas de milhares de tokens, e sorteia do mesmo jeito.'
		)}
	</p>
</div>
