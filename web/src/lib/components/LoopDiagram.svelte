<script>
	import { steps } from '$lib/how-it-works-copy.js';

	// step: the step being shown right now, or -1 when nothing is running
	let { step } = $props();
</script>

<ol class="space-y-1.5">
	{#each steps as s, i (s.title)}
		<li
			class="rounded-md border px-3 py-2 transition-colors duration-300 {step === i
				? 'border-foreground bg-muted'
				: 'text-muted-foreground'}"
		>
			<div class="flex items-center gap-2 text-sm {step === i ? 'text-foreground' : ''}">
				<span class="w-3 text-xs tabular-nums">{i + 1}</span>
				<b class="font-medium">{s.title}</b>
			</div>
			<div class="pl-5 text-xs text-muted-foreground">{s.text}</div>
		</li>
	{/each}
</ol>
<div class="mt-1.5 text-center text-xs text-muted-foreground">then back to 1 for the next word</div>
