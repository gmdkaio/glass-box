<script>
	import { resolve } from '$app/paths';
	import { modules } from '$lib/modules.js';
</script>

<svelte:head><title>Glass Box</title></svelte:head>

<div class="mx-auto w-full max-w-3xl px-5 py-12">
	<h1 class="text-3xl font-semibold tracking-tight">Glass Box</h1>
	<p class="mt-3 leading-relaxed text-muted-foreground">
		Interactive simulations of how AI systems work, with the math behind each one and where the toy
		models stop matching real LLMs. Move a slider, watch it happen, then read why it matters when
		you use AI.
	</p>
	<ul class="mt-8 divide-y border-y">
		{#each modules as m (m.slug)}
			<li class="flex items-center gap-4 py-3 text-sm">
				<span class="w-4 text-muted-foreground">{m.n}</span>
				{#if m.ready}
					<a href={resolve('/quantization')} class="underline underline-offset-4">{m.title}</a>
				{:else}
					<span class="text-muted-foreground">{m.title}</span>
					<span class="ml-auto text-xs text-muted-foreground">soon</span>
				{/if}
			</li>
		{/each}
	</ul>
</div>
