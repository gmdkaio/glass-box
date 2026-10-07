<script>
	import { onMount } from 'svelte';
	import ModulePage from '$lib/components/ModulePage.svelte';
	import RetrieveStage from '$lib/components/RetrieveStage.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Slider } from '$lib/components/ui/slider/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { getEngine } from '$lib/engine-loader.js';
	import { PAGES, QUESTIONS, SETUPS, MAX_K, TEMPERATURE, queryOf, words, search, answer, outcome, curve, totals as average, percent } from '$lib/retrieval-sim.js';
	import { where } from '$lib/modules.js';
	import * as en from '$lib/retrieval-copy.js';
	import * as pt from '$lib/retrieval-copy.pt.js';
	import { t, local, toyNote } from '$lib/i18n.svelte.js';

	let gb = $state.raw(null);
	let qi = $state(SETUPS[2].question);
	let wording = $state(SETUPS[2].wording);
	let meaning = $state(SETUPS[2].meaning);
	let old = $state(SETUPS[2].old);
	let k = $state(SETUPS[2].k);

	const question = $derived(QUESTIONS[qi]);
	const asked = $derived(question[wording]);
	const results = $derived(gb ? search(gb, asked, meaning, old, k) : null);
	const said = $derived(results ? answer(results, question) : null);
	const right = $derived(results ? results.find((r) => r.page === question.page) : null);
	const rows = $derived(gb ? QUESTIONS.map((q) => outcome(gb, q, wording, meaning, old, k)) : null);
	const same = $derived(gb ? curve(gb, 'same', meaning, old) : null);
	const other = $derived(gb ? curve(gb, 'other', meaning, old) : null);
	const totals = $derived(rows ? average(gb, rows) : null);
	const oldWins = $derived(!!results && !!said && said.page !== null && PAGES[said.page].old);
	const here = where('retrieval');
	const copy = $derived(t(en, pt));

	onMount(() => {
		getEngine().then((engine) => (gb = engine));
	});

	function setup(s) {
		qi = s.question;
		wording = s.wording;
		meaning = s.meaning;
		old = s.old;
		k = s.k;
	}
	const isSetup = (s) => qi === s.question && wording === s.wording && meaning === s.meaning && old === s.old && k === s.k;
	const ordinal = (n) => t(n + (n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'), n + 'º');
	const query = $derived(queryOf(asked, meaning));
</script>

<svelte:head><title>Retrieval · Glass Box</title></svelte:head>

<ModulePage
	track={local(here.track, 'title')}
	n={here.n}
	total={here.total}
	tag={local(here.module, 'tag')}
	title={t('When a model looks things up, what does it find?', 'Quando um modelo pesquisa, o que ele encontra?')}
	lead={t(
		'Before an assistant answers from your documents or the web, a search picks a few pages and hands them over. The model answers from those pages. A page that uses other words can be missed, and an old page that looks the same can be handed over instead.',
		'Antes de um assistente responder a partir dos seus documentos ou da web, uma busca escolhe algumas páginas e as entrega. O modelo responde a partir dessas páginas. Uma página que usa outras palavras pode ficar de fora, e uma página antiga parecida pode ser entregue no lugar.'
	)}
	whyLead={copy.whyLead}
>
	{#snippet presets()}
		<p class="mb-2 text-xs text-muted-foreground">
			{t(
				`A question about a made-up town, answered from its handbook of ${PAGES.length} pages:`,
				`Uma pergunta sobre uma cidade inventada, respondida a partir do manual dela, de ${PAGES.length} páginas:`
			)}
		</p>
		<div class="mb-3.5 grid gap-2.5 md:grid-cols-3">
			{#each SETUPS as s (s.label)}
				<button
					type="button"
					onclick={() => setup(s)}
					class="rounded-lg border bg-sidebar px-3.5 py-3 text-left text-sm text-muted-foreground transition-colors hover:border-foreground/40 {isSetup(s)
						? 'border-foreground bg-muted'
						: ''}"
				>
					<b class="block font-medium text-foreground">{local(s, 'label')}</b>
					<span class="mt-0.5 block text-xs">{local(s, 'hint')}</span>
				</button>
			{/each}
		</div>
	{/snippet}

	{#snippet stage()}
		<RetrieveStage {question} {asked} {results} {said} {rows} {totals} {same} {other} {k} />
	{/snippet}

	{#snippet legend()}
		<div class="flex flex-wrap gap-x-5 gap-y-1">
			<span
				><span class="mr-1 inline-block h-2 w-4 rounded-sm border border-muted-foreground align-middle"></span><span
					class="mr-1.5 inline-block h-0 w-4 border-t-2 border-foreground align-middle"
				></span>{t('Right page handed over', 'Página certa entregue')}</span
			>
			<span
				><span class="mr-1 inline-block h-2 w-4 rounded-sm bg-foreground/80 align-middle"></span><span
					class="mr-1.5 inline-block h-0 w-4 border-t-2 border-dashed border-muted-foreground align-middle"
				></span>{t('Right answer', 'Resposta certa')}</span
			>
		</div>
	{/snippet}

	{#snippet controls()}
		<div class="grid gap-x-8 gap-y-5 md:grid-cols-2">
			<div>
				<div class="mb-2 text-xs text-muted-foreground">{t('Question', 'Pergunta')}</div>
				<div class="flex flex-wrap gap-1.5">
					{#each QUESTIONS as q, i (q.short)}
						<Button size="sm" variant={qi === i ? 'default' : 'outline'} onclick={() => (qi = i)}>{local(q, 'short')}</Button>
					{/each}
				</div>
			</div>
			<div>
				<div class="mb-2 flex justify-between text-xs text-muted-foreground">
					<span>{t('Pages handed to the model', 'Páginas entregues ao modelo')}: {k}</span>
					<span>1 {t('to', 'a')} {MAX_K}</span>
				</div>
				<Slider type="single" bind:value={k} min={1} max={MAX_K} step={1} />
			</div>
			<div>
				<div class="mb-2 text-xs text-muted-foreground">{t('Ask it with', 'Pergunte com')}</div>
				<div class="flex flex-wrap gap-1.5">
					<Button size="sm" variant={wording === 'same' ? 'default' : 'outline'} onclick={() => (wording = 'same')}>{t("The page's words", 'As palavras da página')}</Button>
					<Button size="sm" variant={wording === 'other' ? 'default' : 'outline'} onclick={() => (wording = 'other')}>{t('Other words', 'Outras palavras')}</Button>
				</div>
			</div>
			<div class="flex flex-wrap gap-x-8 gap-y-5">
				<div>
					<div class="mb-2 text-xs text-muted-foreground">{t('Search by', 'Buscar por')}</div>
					<div class="flex flex-wrap gap-1.5">
						<Button size="sm" variant={meaning ? 'outline' : 'default'} onclick={() => (meaning = false)}>{t('Exact words', 'Palavras exatas')}</Button>
						<Button size="sm" variant={meaning ? 'default' : 'outline'} onclick={() => (meaning = true)}>{t('Meaning too', 'Significado também')}</Button>
					</div>
				</div>
				<div>
					<div class="mb-2 text-xs text-muted-foreground">{t('Old pages', 'Páginas antigas')}</div>
					<div class="flex flex-wrap gap-1.5">
						<Button size="sm" variant={old ? 'default' : 'outline'} onclick={() => (old = true)}>{t('Keep', 'Manter')}</Button>
						<Button size="sm" variant={old ? 'outline' : 'default'} onclick={() => (old = false)}>{t('Remove', 'Remover')}</Button>
					</div>
				</div>
			</div>
		</div>
	{/snippet}

	{#snippet say()}
		{#if results && said}
			<p class="leading-relaxed">
				<b class="font-medium">
					{#if right && right.handed}{t(
							`The right page ranks ${ordinal(right.rank + 1)} and is handed over, with a ${percent(right.share)} chance the model answers from it.`,
							`A página certa fica em ${ordinal(right.rank + 1)} lugar e é entregue, com ${percent(right.share)} de chance de o modelo responder a partir dela.`
						)}{:else if right && right.score > 0}{t(
							`The right page ranks ${ordinal(right.rank + 1)}, below the ${k} handed over.`,
							`A página certa fica em ${ordinal(right.rank + 1)} lugar, abaixo das ${k} entregues.`
						)}{:else}{t('The search never matches the right page.', 'A busca nunca encontra a página certa.')}{/if}
				</b>
				{copy.say(!!right && right.handed, right ? right.share : 0)}
			</p>
			<p class="mt-1 text-sm text-muted-foreground">{copy.trap({ found: !!right && right.handed, oldWins, wording, meaning, k })}</p>
		{:else}
			<p class="text-muted-foreground">{t('Loading the engine…', 'Carregando o motor…')}</p>
		{/if}
	{/snippet}

	{#snippet cards()}
		<div class="mb-4 grid gap-3.5 md:grid-cols-3">
			{#each [{ key: 'handed', title: t('Right page handed over', 'Página certa entregue'), value: totals?.handed, text: t('Out of the five questions, asked this way.', 'Entre as cinco perguntas, feitas deste jeito.') }, { key: 'right', title: t('Right answer', 'Resposta certa'), value: totals?.right, text: t('The chance, averaged over the five questions.', 'A chance, na média das cinco perguntas.') }, { key: 'outvoted', title: t('Found, then outvoted', 'Encontrada, depois vencida'), value: totals ? Math.max(0, totals.handed - totals.right) : undefined, text: t('Handed over, but the model answered from another page.', 'Entregue, mas o modelo respondeu a partir de outra página.') }] as card (card.key)}
				<div class="rounded-lg border px-4 py-3.5">
					<h3 class="text-xs font-medium">{card.title}</h3>
					<div class="mt-1 text-3xl font-semibold tracking-tight">{card.value !== undefined ? percent(card.value) : '–'}</div>
					<p class="text-xs text-muted-foreground">{card.text}</p>
					<div class="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
						<div class="h-full bg-foreground transition-[width]" style="width: {(card.value ?? 0) * 100}%"></div>
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
				<p class="max-w-3xl text-sm text-muted-foreground">
					{t(
						'Open Under the hood to see how each page is scored and how the model picks among the pages it gets.',
						'Abra Por dentro para ver como cada página recebe a nota e como o modelo escolhe entre as páginas que recebe.'
					)}
				</p>
			</Tabs.Content>
			<Tabs.Content value="hood">
				<div class="space-y-2 rounded-lg border px-4 py-3.5 text-sm">
					<div class="text-muted-foreground">
						{t("The search keeps the question's useful words:", 'A busca guarda as palavras úteis da pergunta:')}
						<span class="font-mono text-foreground">{words(asked).join(' · ')}</span>{meaning
							? t(', plus the page words they mean', ', mais as palavras da página que significam o mesmo')
							: ''}. {t('It then scores every page with BM25:', 'Depois dá uma nota a cada página com o BM25:')}
					</div>
					<ul class="list-inside list-disc text-muted-foreground">
						<li>{t('a word counts for more when few pages use it (rare words point to the right page)', 'uma palavra vale mais quando poucas páginas a usam (palavras raras apontam para a página certa)')}</li>
						<li>{t('a word repeated in a page counts more, but less than twice as much', 'uma palavra repetida numa página vale mais, só que menos que o dobro')}</li>
						<li>{t('a long page is marked down a little, so a short page matching the same words wins', 'uma página longa perde um pouco de nota, então uma página curta com as mesmas palavras vence')}</li>
					</ul>
					<div class="pt-1 text-muted-foreground">
						{t(`The top ${k} pages go to the model. It reads each with a weight of e`, `As ${k} primeiras páginas vão para o modelo. Ele lê cada uma com um peso de e`)}<sup
							>{t('score', 'nota')} / {TEMPERATURE}</sup
						>{t(
							', divided by the sum over the pages it got (softmax, as in Why answers vary), and answers from the page it reads most.',
							', dividido pela soma nas páginas que recebeu (softmax, como em Respostas que variam), e responde a partir da página que mais lê.'
						)}
					</div>
					{#if right}
						<div class="tabular-nums">
							{t(
								`Here the right page scores ${right.score.toFixed(2)} and ranks ${ordinal(right.rank + 1)} of ${results.length}${right.handed ? `, so its share is ${percent(right.share)}` : `, below the cut of ${k}`}. The search used ${query.ids.length} words.`,
								`Aqui a página certa tem nota ${right.score.toFixed(2)} e fica em ${ordinal(right.rank + 1)} lugar de ${results.length}${right.handed ? `, então a parte dela é ${percent(right.share)}` : `, abaixo do corte de ${k}`}. A busca usou ${query.ids.length} palavras.`
							)}
						</div>
					{/if}
					<p class="pt-2 text-xs text-muted-foreground">{copy.hoodNote}</p>
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
		{t(
			`Every score, rank and chance on this page comes from a C engine compiled to WebAssembly. The handbook and its town are made up; the search is real BM25, run in your browser over ${PAGES.length} short pages.`,
			`Cada nota, posição e chance nesta página vem de um motor em C compilado para WebAssembly. O manual e a cidade são inventados; a busca é BM25 de verdade, rodando no seu navegador sobre ${PAGES.length} páginas curtas.`
		)}{t('', ' ' + toyNote)}
	{/snippet}
</ModulePage>
