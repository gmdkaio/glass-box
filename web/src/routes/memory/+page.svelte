<script>
	import { onMount } from 'svelte';
	import ModulePage from '$lib/components/ModulePage.svelte';
	import MemoryStage from '$lib/components/MemoryStage.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Slider } from '$lib/components/ui/slider/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { getEngine } from '$lib/engine-loader.js';
	import { Sweep } from '$lib/motion.svelte.js';
	import { MODELS, BITS, CONTEXTS, CARDS, SETUPS, NATIVE, budget, byBits, byContext, perToken, gbOf, kbOf, tokens } from '$lib/memory-sim.js';
	import { where } from '$lib/modules.js';
	import * as en from '$lib/memory-copy.js';
	import * as pt from '$lib/memory-copy.pt.js';
	import { t, local, locale } from '$lib/i18n.svelte.js';

	let gb = $state.raw(null);
	let model = $state(SETUPS[1].model);
	let bitsAt = $state(BITS.indexOf(SETUPS[1].bits));
	let contextAt = $state(CONTEXTS.indexOf(SETUPS[1].context));
	let cardAt = $state(CARDS.indexOf(SETUPS[1].card));
	let cacheBits = $state(16);
	const sweep = new Sweep();

	// the sliders move over fixed stops, so each setting follows its stop
	const bits = $derived(BITS[bitsAt]);
	const context = $derived(CONTEXTS[contextAt]);
	const card = $derived(CARDS[cardAt]);

	const b = $derived(gb ? budget(gb, model, bits, context, card, cacheBits) : null);
	const bitsRows = $derived(gb ? byBits(gb, model, card, cacheBits) : null);
	const modelRows = $derived(gb ? MODELS.map((_, i) => budget(gb, i, bits, 1, card, cacheBits)) : null);
	const curve = $derived(gb ? byContext(gb, model, bits) : null);
	const per = $derived(gb ? perToken(gb, cacheBits) : null);
	const weightsOnly = $derived(!!b && b.weights + b.overhead > b.card);
	const here = where('memory');
	const copy = $derived(t(en, pt));

	onMount(() => {
		getEngine().then((engine) => (gb = engine));
		return () => sweep.stop();
	});

	function setup(s) {
		sweep.stop();
		model = s.model;
		bitsAt = BITS.indexOf(s.bits);
		contextAt = CONTEXTS.indexOf(s.context);
		cardAt = CARDS.indexOf(s.card);
		cacheBits = 16;
	}
	const isSetup = (s) => model === s.model && bits === s.bits && context === s.context && card === s.card && cacheBits === 16;

	// a conversation growing from a short question to the longest the model can take
	const playSweep = () => sweep.toggle(CONTEXTS.map((_, i) => i), 700, (i) => (contextAt = i));
</script>

<svelte:head><title>Fitting in memory · Glass Box</title></svelte:head>

<ModulePage
	track={local(here.track, 'title')}
	n={here.n}
	total={here.total}
	tag={local(here.module, 'tag')}
	title={t('Will this model run on my machine?', 'Este modelo roda na minha máquina?')}
	lead={t(
		"To run, a model has to fit in your graphics card's memory: all of its numbers, plus a cache that grows with every token of the conversation. Pick a model, its precision and how long you chat, and see what fills the card.",
		'Para rodar, um modelo precisa caber na memória da sua placa de vídeo: todos os números dele, mais um cache que cresce a cada token da conversa. Escolha um modelo, a precisão dele e o tamanho da conversa, e veja o que enche a placa.'
	)}
	whyLead={copy.whyLead}
>
	{#snippet presets()}
		<p class="mb-2 text-xs text-muted-foreground">{t('Three Qwen3 models, each on a common card:', 'Três modelos Qwen3, cada um numa placa comum:')}</p>
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
		<MemoryStage
			{b}
			{model}
			{bits}
			{context}
			{cacheBits}
			{bitsRows}
			{modelRows}
			{curve}
			{per}
			play={{ playing: sweep.playing, label: t('Keep the chat going', 'Continuar a conversa'), onclick: playSweep, disabled: !gb }}
			pace={sweep.playing ? 600 : 450}
		/>
	{/snippet}

	{#snippet legend()}
		<div class="flex flex-wrap gap-x-5 gap-y-1">
			<span><span class="mr-1.5 inline-block h-2 w-4 rounded-sm bg-foreground/80 align-middle"></span>{t("The model's numbers", 'Os números do modelo')}</span>
			<span><span class="mr-1.5 inline-block h-2 w-4 rounded-sm bg-muted-foreground align-middle"></span>{t('The context cache', 'O cache do contexto')}</span>
			<span><span class="mr-1.5 inline-block h-2 w-4 rounded-sm bg-muted-foreground/40 align-middle"></span>{t('The runtime', 'O programa')}</span>
			<span><span class="mr-1.5 inline-block h-3 w-0.5 bg-foreground align-middle"></span>{t('Your card', 'A sua placa')}</span>
		</div>
	{/snippet}

	{#snippet controls()}
		<div class="grid gap-x-8 gap-y-5 md:grid-cols-2">
			<div>
				<div class="mb-2 text-xs text-muted-foreground">{t('Model', 'Modelo')}</div>
				<div class="flex flex-wrap gap-1.5">
					{#each MODELS as m, i (m.name)}
						<Button size="sm" variant={model === i ? 'default' : 'outline'} onclick={() => (model = i)}>{m.name}</Button>
					{/each}
				</div>
			</div>
			<div>
				<div class="mb-2 flex justify-between text-xs text-muted-foreground">
					<span>{t('Graphics card memory', 'Memória da placa de vídeo')}: {card} GB</span>
					<span>{CARDS[0]} {t('to', 'a')} {CARDS.at(-1)} GB</span>
				</div>
				<Slider type="single" bind:value={cardAt} min={0} max={CARDS.length - 1} step={1} />
			</div>
			<div>
				<div class="mb-2 flex justify-between text-xs text-muted-foreground">
					<span>{t('Bits per number', 'Bits por número')}: {bits}</span>
					<span>{BITS[0]} {t('to', 'a')} {BITS.at(-1)}</span>
				</div>
				<Slider type="single" bind:value={bitsAt} min={0} max={BITS.length - 1} step={1} />
			</div>
			<div>
				<div class="mb-2 flex justify-between text-xs text-muted-foreground">
					<span>{t('Context', 'Contexto')}: {context.toLocaleString(locale())} tokens (num_ctx)</span>
					<span>{tokens(CONTEXTS[0])} {t('to', 'a')} {tokens(CONTEXTS.at(-1))}</span>
				</div>
				<Slider type="single" bind:value={contextAt} min={0} max={CONTEXTS.length - 1} step={1} onValueChange={() => sweep.stop()} />
			</div>
			<div>
				<div class="mb-2 text-xs text-muted-foreground">{t('Cache stored in', 'Cache guardado em')}</div>
				<div class="flex flex-wrap gap-1.5">
					<Button size="sm" variant={cacheBits === 16 ? 'default' : 'outline'} onclick={() => (cacheBits = 16)}>16 bits</Button>
					<Button size="sm" variant={cacheBits === 8 ? 'default' : 'outline'} onclick={() => (cacheBits = 8)}>8 bits</Button>
				</div>
			</div>
		</div>
	{/snippet}

	{#snippet say()}
		{#if b}
			<p class="leading-relaxed">
				<b class="font-medium">
					{t(
						`${MODELS[model].name} at ${bits} bits with ${context.toLocaleString(locale())} tokens of context needs ${gbOf(b.total)}${b.fits ? `, leaving ${gbOf(b.card - b.total)} free on a ${card} GB card` : `, ${gbOf(b.total - b.card)} more than a ${card} GB card holds`}.`,
						`${MODELS[model].name} com ${bits} bits e ${context.toLocaleString(locale())} tokens de contexto precisa de ${gbOf(b.total)}${b.fits ? `, deixando ${gbOf(b.card - b.total)} livres numa placa de ${card} GB` : `, ${gbOf(b.total - b.card)} a mais do que cabe numa placa de ${card} GB`}.`
					)}
				</b>
				{copy.say(b.fits, b.card - b.total, b.card)}
			</p>
			<p class="mt-1 text-sm text-muted-foreground">{copy.trap({ fits: b.fits, weightsOnly, cacheShare: b.cache / b.total })}</p>
		{:else}
			<p class="text-muted-foreground">{t('Loading the engine…', 'Carregando o motor…')}</p>
		{/if}
	{/snippet}

	{#snippet cards()}
		<div class="mb-4 grid gap-3.5 md:grid-cols-3">
			{#each [{ key: 'weights', title: t("The model's numbers", 'Os números do modelo'), value: b ? gbOf(b.weights) : '–', share: b ? b.weights / b.card : 0, text: t('Set once, when the model loads.', 'Definidos uma vez, quando o modelo carrega.') }, { key: 'cache', title: t('The context cache', 'O cache do contexto'), value: b ? gbOf(b.cache) : '–', share: b ? b.cache / b.card : 0, text: t(`${b ? kbOf(b.perToken) : ''} for every token of the chat.`, `${b ? kbOf(b.perToken) : ''} para cada token da conversa.`) }, { key: 'longest', title: t('Longest chat that fits', 'Maior conversa que cabe'), value: b ? (b.maxTokens ? tokens(b.maxTokens) + ' tokens' : t('none', 'nenhuma')) : '–', share: b ? Math.min(1, b.maxTokens / CONTEXTS.at(-1)) : 0, text: t('On this card, with these settings.', 'Nesta placa, com estas configurações.') }] as c (c.key)}
				<div class="rounded-lg border px-4 py-3.5">
					<h3 class="text-xs font-medium">{c.title}</h3>
					<div class="mt-1 text-3xl font-semibold tracking-tight tabular-nums">{c.value}</div>
					<p class="text-xs text-muted-foreground">{c.text}</p>
					<div class="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
						<div class="h-full bg-foreground transition-[width]" style="width: {Math.min(1, c.share) * 100}%"></div>
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
					{t('Open Under the hood for the two formulas, with your numbers in them.', 'Abra Por dentro para ver as duas fórmulas, com os seus números nelas.')}
				</p>
			</Tabs.Content>
			<Tabs.Content value="hood">
				{#if b}
					{@const m = MODELS[model]}
					<div class="space-y-2 rounded-lg border px-4 py-3.5 text-sm">
						<div class="text-muted-foreground">
							{t(
								"The model's numbers: parameters × bits per number ÷ 8, plus about half a bit per number for the scale factors quantized formats store.",
								'Os números do modelo: parâmetros × bits por número ÷ 8, mais cerca de meio bit por número para os fatores de escala que os formatos quantizados guardam.'
							)}
						</div>
						<div class="font-mono text-xs tabular-nums">
							{(m.params / 1e9).toFixed(1)}B × {bits}{bits < 16 ? ' + 0.5' : ''} bits ÷ 8 = {gbOf(b.weights)}
						</div>
						<div class="pt-1 text-muted-foreground">
							{t(
								'The context cache: for every token, every layer keeps a key and a value for each key-value head. 2 × layers × key-value heads × head size × tokens × bytes.',
								'O cache do contexto: para cada token, cada camada guarda uma chave e um valor para cada cabeça de chave-valor. 2 × camadas × cabeças de chave-valor × tamanho da cabeça × tokens × bytes.'
							)}
						</div>
						<div class="font-mono text-xs tabular-nums">
							2 × {m.layers} × {m.kvHeads} × {m.headDim} × {context.toLocaleString(locale())} × {cacheBits / 8} = {gbOf(b.cache)}
						</div>
						<div class="pt-1 text-muted-foreground">
							{t(
								`The runtime adds about ${gbOf(b.overhead)} of working buffers. Native context for Qwen3 is ${NATIVE.toLocaleString(locale())} tokens; longer needs YaRN, which the runner turns on.`,
								`O programa soma cerca de ${gbOf(b.overhead)} de buffers de trabalho. O contexto nativo do Qwen3 é de ${NATIVE.toLocaleString(locale())} tokens; mais que isso precisa de YaRN, que o programa liga.`
							)}
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
		{t(
			"Every size on this page comes from a C engine compiled to WebAssembly. The model shapes are Qwen3's published configs; the runtime overhead is a rough figure, and real runners vary.",
			'Cada tamanho nesta página vem de um motor em C compilado para WebAssembly. Os formatos dos modelos são as configurações publicadas do Qwen3; a sobrecarga do programa é um valor aproximado, e os programas de verdade variam.'
		)}
	{/snippet}
</ModulePage>
