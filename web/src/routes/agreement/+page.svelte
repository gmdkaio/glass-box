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
	import * as en from '$lib/agree-copy.js';
	import * as pt from '$lib/agree-copy.pt.js';
	import { t, local } from '$lib/i18n.svelte.js';

	let gb = $state.raw(null);
	let qi = $state(1);
	const on = new SvelteSet(['pushback']);
	const here = where('agreement');
	const copy = $derived(t(en, pt));

	onMount(() => {
		getEngine().then((engine) => (gb = engine));
	});

	const q = $derived(QUESTIONS[qi]);
	// the answers as the page shows them, in the reader's language
	const answers = $derived(t(q.answers, q.pt.answers));
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
	track={local(here.track, 'title')}
	n={here.n}
	total={here.total}
	title={t('Does it just tell you what you want to hear?', 'Ele só diz o que você quer ouvir?')}
	lead={t(
		'Chat models lean toward agreeing with you. Saying what you think, pushing back, and settings like custom instructions, memory and skills all tilt the answer your way, most of all when the model is unsure. Add nudges and watch whose side it takes.',
		'Modelos de chat tendem a concordar com você. Dizer o que você acha, insistir e configurações como instruções personalizadas, memória e skills inclinam a resposta para o seu lado, principalmente quando o modelo está inseguro. Acrescente empurrões e veja de que lado ele fica.'
	)}
	whyLead={copy.whyLead}
>
	{#snippet presets()}
		<p class="mb-2 text-xs text-muted-foreground">
			{t('Three questions, from one it knows to one with no clear answer:', 'Três perguntas, de uma que ele sabe a uma sem resposta clara:')}
		</p>
		<div class="mb-3.5 grid gap-2.5 md:grid-cols-3">
			{#each QUESTIONS as x, i (x.label)}
				<button
					type="button"
					onclick={() => preset(i)}
					class="rounded-lg border bg-sidebar px-3.5 py-3 text-left text-sm text-muted-foreground transition-colors hover:border-foreground/40 {qi === i ? 'border-foreground bg-muted' : ''}"
				>
					<b class="block font-medium text-foreground">{local(x, 'label')}</b>
					<span class="mt-0.5 block text-xs">{local(x, 'ask')}</span>
				</button>
			{/each}
		</div>
	{/snippet}

	{#snippet stage()}
		<AgreeStage {qi} {on} {turns} {neutral} {grid} {curves} />
	{/snippet}

	{#snippet legend()}
		<div class="flex flex-wrap gap-x-5 gap-y-1">
			<span>✓ = {t('the right answer', 'a resposta certa')}</span>
			<span>{t('yours = the answer you lean toward', 'sua = a resposta para a qual você pende')}</span>
			<span><span class="mr-1.5 inline-block h-2 w-4 rounded-sm bg-foreground/80 align-middle"></span>{t('With your nudges', 'Com os seus empurrões')}</span>
			<span><span class="mr-1.5 inline-block h-2 w-4 rounded-sm border border-muted-foreground align-middle"></span>{t('Asked plainly', 'Pergunta simples')}</span>
		</div>
	{/snippet}

	{#snippet controls()}
		<div class="grid gap-x-8 gap-y-4 md:grid-cols-3">
			{#each [['message', t('In your message', 'Na sua mensagem')], ['turn', t('In the next turn', 'Na próxima mensagem')], ['settings', t('In your settings', 'Nas suas configurações')]] as [where, title] (where)}
				<div>
					<div class="mb-2 text-xs text-muted-foreground">{title}</div>
					<div class="flex flex-wrap gap-1.5">
						{#each NUDGES.filter((n) => n.where === where) as n (n.key)}
							<Button size="sm" variant={on.has(n.key) ? 'default' : 'outline'} onclick={() => toggle(n.key)} title={local(n, 'example')(q)}>{local(n, 'label')}</Button>
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
					{t(
						`With ${on.size} ${on.size === 1 ? 'nudge' : 'nudges'}, it gives your answer, ${q.answers[YOURS]}, ${percent(last[YOURS])} of the time, against ${percent(neutral[YOURS])} when asked plainly.`,
						`Com ${on.size} ${on.size === 1 ? 'empurrão' : 'empurrões'}, ele dá a sua resposta, ${answers[YOURS]}, em ${percent(last[YOURS])} das vezes, contra ${percent(neutral[YOURS])} com a pergunta simples.`
					)}
				</b>
				{copy.say({ share: last[YOURS], neutral: neutral[YOURS], gap: q.gap })}
			</p>
			<p class="mt-1 text-sm text-muted-foreground">{copy.trap(settings, on.has('pushback'))}</p>
		{:else}
			<p class="text-muted-foreground">{t('Loading the engine…', 'Carregando o motor…')}</p>
		{/if}
	{/snippet}

	{#snippet cards()}
		<div class="mb-4 grid gap-3.5 md:grid-cols-3">
			{#each [
				{ key: 'yours', title: t('Takes your side', 'Fica do seu lado'), value: last ? percent(last[YOURS]) : '–', share: last ? last[YOURS] : 0, text: t(`How often it answers ${answers[YOURS]}.`, `Quantas vezes ele responde ${answers[YOURS]}.`) },
				{ key: 'plain', title: t('Asked plainly', 'Pergunta simples'), value: neutral ? percent(neutral[YOURS]) : '–', share: neutral ? neutral[YOURS] : 0, text: t('The same, with no nudges at all.', 'O mesmo, sem nenhum empurrão.') },
				{ key: 'truth', title: t('Gives the right answer', 'Dá a resposta certa'), value: last ? percent(last[TRUTH]) : '–', share: last ? last[TRUTH] : 0, text: t(`${answers[TRUTH]}, with your nudges.`, `${answers[TRUTH]}, com os seus empurrões.`) }
			] as c (c.key)}
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
			<h3 class="mb-1.5 text-xs font-medium">{t('The trap', 'A armadilha')}</h3>
			<p class="text-sm leading-relaxed text-muted-foreground">{copy.trapCard}</p>
		</div>

		<Tabs.Root value="simple">
			<Tabs.List>
				<Tabs.Trigger value="simple">{t('Simple', 'Simples')}</Tabs.Trigger>
				<Tabs.Trigger value="hood">{t('Under the hood', 'Por dentro')}</Tabs.Trigger>
			</Tabs.List>
			<Tabs.Content value="simple">
				<p class="max-w-3xl text-sm text-muted-foreground">{t('Open Under the hood for the formula, with your numbers.', 'Abra Por dentro para ver a fórmula, com os seus números.')}</p>
			</Tabs.Content>
			<Tabs.Content value="hood">
				{#if last}
					<div class="space-y-2 rounded-lg border px-4 py-3.5 text-sm text-muted-foreground">
						<div>
							{t(
								'Each answer has a score; the odds are e^score divided by the sum over all answers, as on the Why answers vary page.',
								'Cada resposta tem uma nota; as chances são e^nota dividido pela soma de todas as respostas, como na página Respostas que variam.'
							)}
						</div>
						<div>
							{t(
								`Each nudge adds ${PUSH} to the score of your answer. With ${on.size}, that is ${(on.size * PUSH).toFixed(1)} added to ${answers[YOURS]}.`,
								`Cada empurrão soma ${PUSH} à nota da sua resposta. Com ${on.size}, são ${(on.size * PUSH).toFixed(1)} somados a ${answers[YOURS]}.`
							)}
						</div>
						<div class="font-mono text-xs tabular-nums">
							{t('scores', 'notas')}: {answers.map((a, i) => `${a} ${(q.scores[i] + (i === YOURS ? on.size * PUSH : 0)).toFixed(1)}`).join(' · ')}
						</div>
						<div>
							{t(
								`The right answer starts ${q.gap} ahead of yours. The map's rows are that lead, from 5 (knows it cold) to 0 (no answer it prefers).`,
								`A resposta certa começa ${q.gap} à frente da sua. As linhas do mapa são essa vantagem, de 5 (sabe de cor) a 0 (nenhuma resposta preferida).`
							)}
						</div>
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
		{t(
			'Every number on this page comes from a C engine compiled to WebAssembly. The scores and the size of each nudge are made up, and a real model scores tens of thousands to a few hundred thousand tokens.',
			'Cada número nesta página vem de um motor em C compilado para WebAssembly. As notas e o tamanho de cada empurrão são inventados, e um modelo de verdade dá nota a dezenas de milhares até algumas centenas de milhares de tokens.'
		)}
	{/snippet}
</ModulePage>
