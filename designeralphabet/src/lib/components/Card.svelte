<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { Card } from '$lib/Cards';

	const dispatch = createEventDispatcher();

	export let card: Card;
	export let selectable = false;
	export let selected = false;
	export let disabled = false;

	$: categoryLabel = card.category ?? 'Legacy';
	$: cardIdLabel = card.cardID ?? card.slug;
	$: titleLabel = card.title ?? cardIdLabel ?? 'Untitled card';

	function handleToggle() {
		if (disabled) return;
		dispatch('toggle', { card });
	}
</script>

<article
	style={`--card-accent: ${card.color ?? 'hsl(var(--brand))'}`}
	class={`group flex h-full flex-col gap-4 rounded-3xl border border-line bg-surface-elevated/80 p-6 shadow-sm transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-lg focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-slate-500 ${
		selected ? 'ring-2 ring-slate-900 ring-offset-2' : ''
	} ${disabled ? 'grayscale text-ink-muted cursor-not-allowed' : ''}`}
>
	<header class="flex items-start gap-3">
		<span
			class="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white shadow"
			style="background: var(--card-accent)"
		>
			{card.letter ?? '?'}
		</span>
		<div class="flex flex-1 flex-col">
			<span class="text-xs font-semibold uppercase tracking-wide text-ink-2">{categoryLabel}</span>
			<h3 class="text-lg font-semibold text-ink">{titleLabel}</h3>
		</div>
		<span class="rounded-full bg-surface-muted px-3 py-1 text-xs font-medium text-ink-2">
			{cardIdLabel}
		</span>
	</header>
	<div class="prose prose-sm max-w-none text-ink-2">
		{#if card.description}
			<p>{card.description}</p>
		{/if}
		{#if card.prompt}
			<p class="font-medium text-ink">Prompt: {card.prompt}</p>
		{/if}
	</div>
	{#if card.tags?.length}
		<ul class="flex flex-wrap gap-2 text-xs text-ink-2">
			{#each card.tags as tag}
				<li class="rounded-full bg-surface-muted px-3 py-1">{tag}</li>
			{/each}
		</ul>
	{/if}
	{#if selectable}
		<div class="mt-auto">
			<button
				class={`w-full rounded-full border border-line px-4 py-2 text-sm font-medium transition hover:-translate-y-0.5 hover:border-line hover:bg-slate-900 hover:text-white focus-outline ${
					selected ? 'bg-slate-900 text-white hover:bg-slate-700' : 'bg-surface-elevated'
				}`}
				type="button"
				on:click={handleToggle}
				aria-pressed={selected}
				{disabled}
			>
				{selected ? 'Selected' : 'Add to session'}
			</button>
		</div>
	{/if}
</article>
