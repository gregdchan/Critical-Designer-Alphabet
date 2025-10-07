<script lang="ts">
	export let value: any;
	export let styleClass: string = '';

	// Helper to convert portable text blocks to HTML
	function blockToText(block: any): string {
		if (!block) return '';

		if (block._type === 'block') {
			const children = block.children || [];
			let text = children
				.map((child: any) => {
					if (child._type === 'span') {
						let content = child.text || '';
						// Apply marks
						if (child.marks && child.marks.length > 0) {
							child.marks.forEach((mark: string) => {
								if (mark === 'strong') {
									content = `<strong class="font-semibold">${content}</strong>`;
								} else if (mark === 'em') {
									content = `<em class="italic">${content}</em>`;
								} else if (mark === 'code') {
									content = `<code class="bg-slate-800 px-1.5 py-0.5 rounded text-sm font-mono">${content}</code>`;
								}
							});
						}
						return content;
					}
					return '';
				})
				.join('');

			// Wrap in appropriate tag based on style
			const style = block.style || 'normal';
			switch (style) {
				case 'h1':
					return `<h1 class="text-2xl font-bold mb-4">${text}</h1>`;
				case 'h2':
					return `<h2 class="text-xl font-semibold mb-3">${text}</h2>`;
				case 'h3':
					return `<h3 class="text-lg font-semibold mb-2">${text}</h3>`;
				case 'h4':
					return `<h4 class="text-base font-semibold mb-2">${text}</h4>`;
				case 'blockquote':
					return `<blockquote class="border-l-4 border-cyan-400 pl-4 italic my-4">${text}</blockquote>`;
				default:
					return text ? `<p class="mb-3">${text}</p>` : '';
			}
		}

		return '';
	}

	// Convert portable text array to HTML
	function portableTextToHTML(blocks: any[]): string {
		if (!Array.isArray(blocks)) return '';
		return blocks.map(blockToText).filter(Boolean).join('');
	}

	// Convert to plain text if it's a string
	$: isPlainText = typeof value === 'string';
	$: isPortableText = Array.isArray(value) && value.length > 0;
	$: htmlContent = isPortableText ? portableTextToHTML(value) : '';
</script>

{#if isPlainText}
	<div class={styleClass}>
		{value}
	</div>
{:else if isPortableText}
	<div class={styleClass}>
		{@html htmlContent}
	</div>
{:else if value}
	<!-- Fallback for unexpected format -->
	<div class={styleClass}>
		{typeof value === 'object' ? JSON.stringify(value) : String(value)}
	</div>
{/if}
