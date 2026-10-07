<script>
	import { i18n, setLang } from '$lib/i18n.svelte.js';

	// EN | PT, two small buttons; the pressed one is the reader's language
	const LANGS = [
		{ id: 'en', label: 'EN', name: 'English' },
		{ id: 'pt', label: 'PT', name: 'Português (Brasil)' }
	];
</script>

<div class="inline-flex w-fit rounded-md border p-0.5 text-xs" role="group" aria-label="Language / Idioma">
	{#each LANGS as l (l.id)}
		<button
			type="button"
			lang={l.id === 'pt' ? 'pt-BR' : 'en'}
			title={l.name}
			aria-label={l.name}
			aria-pressed={i18n.lang === l.id}
			onclick={() => setLang(l.id)}
			class="rounded px-2 py-0.5 transition-colors {i18n.lang === l.id ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}"
		>
			{l.label}
		</button>
	{/each}
</div>
