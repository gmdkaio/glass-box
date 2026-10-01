<script>
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button/index.js';
	import TesseractHero from '$lib/components/TesseractHero.svelte';
	import { tracks, modules, inTrack } from '$lib/modules.js';

	const start = modules.find((m) => m.ready);
</script>

<svelte:head><title>Glass Box</title></svelte:head>

<div class="w-full px-6 py-6 lg:px-8">
	<section class="grid gap-4 lg:grid-cols-2">
		<div class="flex flex-col justify-center py-2 lg:py-6">
			<h1 class="text-4xl font-semibold tracking-tight">Glass Box</h1>
			<p class="mt-4 max-w-xl leading-relaxed text-muted-foreground">
				Interactive simulations of how AI systems work, with the math behind each one and where the toy models stop matching real LLMs. Move a slider, watch it happen, then read why it matters when you use AI.
			</p>
			<ul class="mt-5 space-y-1.5 text-sm text-muted-foreground">
				<li>Every number comes from a C engine compiled to WebAssembly.</li>
				<li>It runs in your browser, with nothing to install.</li>
				<li>Each module says where the toy model stops matching a real one.</li>
			</ul>
			{#if start}
				<div class="mt-6">
					<Button href={resolve(`/${start.slug}`)}>Start with {start.title.toLowerCase()}</Button>
				</div>
			{/if}
		</div>
		<div class="h-72 lg:h-auto lg:min-h-96">
			<TesseractHero />
		</div>
	</section>

	<!-- each card spans 3 rows and shares them, so titles, text and lists line up across cards -->
	<section class="mt-6 grid gap-4 lg:grid-cols-2 lg:gap-y-0">
		{#each tracks as track (track.id)}
			<div class="rounded-lg border px-4 py-4 lg:row-span-3 lg:grid lg:grid-rows-subgrid">
				<h2 class="text-lg font-semibold tracking-tight">{track.title}</h2>
				<p class="mt-1 text-sm text-muted-foreground">{track.blurb}</p>
				<ul class="mt-3 divide-y border-y self-start w-full">
					{#each inTrack(track.id) as m, i (m.slug)}
						<li class="flex items-center gap-4 py-2.5 text-sm">
							<span class="w-4 text-muted-foreground">{i + 1}</span>
							{#if m.ready}
								<a href={resolve(`/${m.slug}`)} class="underline underline-offset-4">{m.title}</a>
							{:else}
								<span class="text-muted-foreground">{m.title}</span>
							{/if}
							{#if m.tag}<span class="text-xs text-muted-foreground">· {m.tag}</span>{/if}
							<span class="ml-auto text-xs text-muted-foreground">{m.ready ? 'open' : 'soon'}</span>
						</li>
					{/each}
				</ul>
			</div>
		{/each}
	</section>
</div>
