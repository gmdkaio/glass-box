<script>
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { t } from '$lib/i18n.svelte.js';

	// Every module page fills the same slots, in this order.
	let {
		track,
		n,
		total,
		tag,
		title,
		lead,
		presets,
		stage,
		legend,
		controls,
		say,
		example,
		cards,
		explain,
		why,
		whyLead,
		next,
		foot
	} = $props();
</script>

<div class="w-full max-w-[1600px] px-6 pb-16 lg:px-8">
	<section class="pt-6 pb-4">
		<Badge variant="outline">{track} · {n} {t('of', 'de')} {total}</Badge>
		{#if tag}<Badge variant="secondary" class="ml-2">{tag}</Badge>{/if}
		<h1 class="mt-3 text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
		<p class="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">{lead}</p>
	</section>

	{@render presets?.()}
	{@render stage?.()}
	<div class="mt-2.5 text-xs text-muted-foreground">{@render legend?.()}</div>
	<div class="my-4">{@render controls?.()}</div>
	<div class="mb-4 rounded-lg border border-foreground/30 bg-sidebar px-4 py-3.5">{@render say?.()}</div>
	{@render cards?.()}
	{@render example?.()}
	{@render explain?.()}

	<h2 class="mt-10 text-xl font-semibold tracking-tight">{t('Why knowing this helps you', 'Por que saber isso ajuda você')}</h2>
	<p class="mt-1 mb-4 max-w-3xl text-sm text-muted-foreground">{whyLead}</p>
	{@render why?.()}

	<h2 class="mt-10 text-xl font-semibold tracking-tight">{t('Where this goes next', 'Para onde isso leva')}</h2>
	<div class="mt-3">{@render next?.()}</div>

	<p class="mt-8 max-w-3xl border-t pt-4 text-xs text-muted-foreground">
		{@render foot?.()}
	</p>
</div>
