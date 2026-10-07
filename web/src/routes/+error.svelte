<script>
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button/index.js';
	import { tracks, inTrack } from '$lib/modules.js';
	import { t, local } from '$lib/i18n.svelte.js';

	const missing = $derived(page.status === 404);
</script>

<svelte:head><title>{missing ? 'Page not found' : 'Something went wrong'} · Glass Box</title></svelte:head>

<div class="w-full max-w-3xl px-6 py-10 lg:px-8">
	<p class="text-sm text-muted-foreground">{page.status}</p>
	<h1 class="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
		{missing ? t('Page not found', 'Página não encontrada') : t('Something went wrong', 'Algo deu errado')}
	</h1>
	<p class="mt-2 text-sm leading-relaxed text-muted-foreground">
		{missing
			? t(
					'There is no page at this address. It may have moved, or the link has a typo. Every module is listed below.',
					'Não há nenhuma página neste endereço. Ela pode ter mudado de lugar, ou o link tem um erro de digitação. Todos os módulos estão listados abaixo.'
				)
			: page.error?.message}
	</p>
	<div class="mt-6"><Button href={resolve('/')}>{t('Go to the start', 'Ir para o início')}</Button></div>

	{#if missing}
		<div class="mt-8 grid gap-6 sm:grid-cols-2">
			{#each tracks as track (track.id)}
				<div>
					<h2 class="text-sm font-semibold">{local(track, 'title')}</h2>
					<ul class="mt-2 space-y-1.5 text-sm">
						{#each inTrack(track.id).filter((m) => m.ready) as m (m.slug)}
							<li><a href={resolve(`/${m.slug}`)} class="underline underline-offset-4">{local(m, 'title')}</a></li>
						{/each}
					</ul>
				</div>
			{/each}
		</div>
	{/if}
</div>
