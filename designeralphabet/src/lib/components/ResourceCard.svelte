<script lang="ts">
	import { IconExternalLink as ExternalLink } from '@tabler/icons-svelte';

	export let title: string;
	export let desc: string;
	export let url: string;
	export let border: string;
</script>

<div class={`border-l-4 ${border} pl-4`}>
	<h3 class="font-semibold text-primary mb-1">{title}</h3>
	<p class="text-sm text-secondary mb-2">{desc}</p>
	<a
		href={url}
		target="_blank"
		rel="noopener noreferrer"
		class="inline-flex items-center gap-1 text-brand hover:text-neon-pink text-sm font-medium"
	>
		{url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
		<ExternalLink class="h-3 w-3" />
	</a>
</div>
