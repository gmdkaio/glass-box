<script>
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { tracks, inTrack } from '$lib/modules.js';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { t, local } from '$lib/i18n.svelte.js';
	import LangToggle from '$lib/components/LangToggle.svelte';
</script>

<Sidebar.Root>
	<Sidebar.Header class="px-4 py-4">
		<a href={resolve('/')} class="text-sm font-semibold tracking-tight">Glass Box</a>
		<span class="text-xs text-muted-foreground">{t('How AI works, with the math shown', 'Como a IA funciona, com a matemática à mostra')}</span>
		<LangToggle />
	</Sidebar.Header>
	<Sidebar.Content>
		{#each tracks as track (track.id)}
			<Sidebar.Group>
				<Sidebar.GroupLabel>{local(track, 'title')}</Sidebar.GroupLabel>
				<Sidebar.GroupContent>
					<Sidebar.Menu>
						{#each inTrack(track.id) as m, i (m.slug)}
							<Sidebar.MenuItem>
								<!-- a module with ready: true needs a route named after its slug -->
								{#if m.ready}
									<Sidebar.MenuButton isActive={page.url.pathname.replace(/\/$/, '').endsWith('/' + m.slug)}>
										{#snippet child({ props })}
											<a href={resolve(`/${m.slug}`)} {...props}>
												<span class="w-4 text-muted-foreground">{i + 1}</span>
												<span>{local(m, 'title')}</span>
											</a>
										{/snippet}
									</Sidebar.MenuButton>
								{:else}
									<Sidebar.MenuButton aria-disabled="true">
										<span class="w-4 text-muted-foreground">{i + 1}</span>
										<span>{local(m, 'title')}</span>
										<span class="ml-auto text-xs text-muted-foreground">{t('soon', 'em breve')}</span>
									</Sidebar.MenuButton>
								{/if}
							</Sidebar.MenuItem>
						{/each}
					</Sidebar.Menu>
				</Sidebar.GroupContent>
			</Sidebar.Group>
		{/each}
	</Sidebar.Content>
</Sidebar.Root>
