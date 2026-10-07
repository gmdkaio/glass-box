<script>
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import AppSidebar from '$lib/components/AppSidebar.svelte';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { initLang } from '$lib/i18n.svelte.js';
	import { modules } from '$lib/modules.js';
	import { SITE, NAME, DESCRIPTION } from '$lib/site.js';

	let { children } = $props();

	onMount(initLang);

	// what a shared link shows: the module's own title and blurb, or the site's.
	// The route id (such as /agreement) is the same wherever the site is served from.
	const path = $derived(page.route.id === '/' ? '' : (page.route.id ?? ''));
	const module = $derived(modules.find((m) => path === '/' + m.slug));
	const shareTitle = $derived(module ? `${module.title} · ${NAME}` : NAME);
	const shareText = $derived(module?.blurb ?? DESCRIPTION);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="description" content={shareText} />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content={NAME} />
	<meta property="og:title" content={shareTitle} />
	<meta property="og:description" content={shareText} />
	<meta property="og:url" content={SITE + path} />
	<meta property="og:image" content="{SITE}/og.png" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content={NAME} />
	<meta name="twitter:card" content="summary_large_image" />
</svelte:head>

<Sidebar.Provider>
	<AppSidebar />
	<Sidebar.Inset>
		<header class="flex h-12 items-center gap-2 border-b px-4">
			<Sidebar.Trigger />
		</header>
		{@render children()}
	</Sidebar.Inset>
</Sidebar.Provider>
