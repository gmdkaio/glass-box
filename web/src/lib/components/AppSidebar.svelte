<script>
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { modules } from '$lib/modules.js';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
</script>

<Sidebar.Root>
	<Sidebar.Header class="px-4 py-4">
		<a href={resolve('/')} class="text-sm font-semibold tracking-tight">Glass Box</a>
		<span class="text-xs text-muted-foreground">How AI works, with the math shown</span>
	</Sidebar.Header>
	<Sidebar.Content>
		<Sidebar.Group>
			<Sidebar.GroupLabel>Modules</Sidebar.GroupLabel>
			<Sidebar.GroupContent>
				<Sidebar.Menu>
					{#each modules as m (m.slug)}
						<Sidebar.MenuItem>
							<!-- a module with ready: true needs its own route and link -->
							{#if m.ready}
								<Sidebar.MenuButton isActive={page.url.pathname.includes('/' + m.slug)}>
									{#snippet child({ props })}
										<a href={resolve('/quantization')} {...props}>
											<span class="w-4 text-muted-foreground">{m.n}</span>
											<span>{m.title}</span>
										</a>
									{/snippet}
								</Sidebar.MenuButton>
							{:else}
								<Sidebar.MenuButton aria-disabled="true">
									<span class="w-4 text-muted-foreground">{m.n}</span>
									<span>{m.title}</span>
									<span class="ml-auto text-xs text-muted-foreground">soon</span>
								</Sidebar.MenuButton>
							{/if}
						</Sidebar.MenuItem>
					{/each}
				</Sidebar.Menu>
			</Sidebar.GroupContent>
		</Sidebar.Group>
	</Sidebar.Content>
</Sidebar.Root>
