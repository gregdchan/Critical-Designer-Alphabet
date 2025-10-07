<script lang="ts">
	import { PortableText as SanityPortableText } from '@portabletext/svelte';

	export let value: any;
	export let styleClass: string = '';

	// Custom components for different block types
	const components = {
		block: {
			normal: ({ children }: any) => `<p class="mb-3">${children}</p>`,
			h1: ({ children }: any) => `<h1 class="text-2xl font-bold mb-4">${children}</h1>`,
			h2: ({ children }: any) => `<h2 class="text-xl font-semibold mb-3">${children}</h2>`,
			h3: ({ children }: any) => `<h3 class="text-lg font-semibold mb-2">${children}</h3>`,
			h4: ({ children }: any) => `<h4 class="text-base font-semibold mb-2">${children}</h4>`,
			blockquote: ({ children }: any) =>
				`<blockquote class="border-l-4 border-cyan-400 pl-4 italic my-4">${children}</blockquote>`
		},
		marks: {
			strong: ({ children }: any) => `<strong class="font-semibold">${children}</strong>`,
			em: ({ children }: any) => `<em class="italic">${children}</em>`,
			code: ({ children }: any) =>
				`<code class="bg-slate-800 px-1.5 py-0.5 rounded text-sm font-mono">${children}</code>`,
			link: ({ value, children }: any) =>
				`<a href="${value.href}" class="text-cyan-400 hover:text-cyan-300 underline" target="_blank" rel="noopener noreferrer">${children}</a>`
		},
		list: {
			bullet: ({ children }: any) => `<ul class="list-disc list-inside mb-3 space-y-1">${children}</ul>`,
			number: ({ children }: any) => `<ol class="list-decimal list-inside mb-3 space-y-1">${children}</ol>`
		},
		listItem: {
			bullet: ({ children }: any) => `<li class="ml-4">${children}</li>`,
			number: ({ children }: any) => `<li class="ml-4">${children}</li>`
		}
	};

	// Convert to plain text if it's a string
	$: isPlainText = typeof value === 'string';
	$: plainText = isPlainText ? value : '';
</script>

{#if isPlainText}
	<div class={styleClass}>
		{plainText}
	</div>
{:else if Array.isArray(value) && value.length > 0}
	<div class={styleClass}>
		<SanityPortableText {value} {components} />
	</div>
{:else}
	<!-- Fallback for empty or invalid content -->
	<div class={styleClass}>
		{value ? JSON.stringify(value) : ''}
	</div>
{/if}
