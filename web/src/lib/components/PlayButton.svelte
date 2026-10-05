<script>
	import PlayIcon from '@lucide/svelte/icons/play';
	import SquareIcon from '@lucide/svelte/icons/square';

	// A small play/stop button that sits in a chart's header, so a sweep can be
	// started while watching the chart it moves. play: { playing, label, onclick, disabled }.
	let { play, class: extra = '' } = $props();
</script>

{#if play}
	<button
		type="button"
		onclick={play.onclick}
		disabled={play.disabled}
		class="inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs transition-colors hover:border-foreground/40 disabled:opacity-50 {play.playing
			? 'border-foreground bg-foreground text-background'
			: 'text-foreground'} {extra}"
	>
		{#if play.playing}<SquareIcon class="size-3" />Stop{:else}<PlayIcon class="size-3" />{play.label}{/if}
	</button>
{/if}
