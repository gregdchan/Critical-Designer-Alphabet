<script lang="ts">
	import { fly } from 'svelte/transition';
	import type { CardRecommendation } from '$lib/services/ai';

	export let recommendations: CardRecommendation[] = [];
	export let isLoading = false;
	export let onSelectCard: (cardId: string) => void = () => {};

	function getRelevanceColor(relevance: number): string {
		if (relevance >= 0.8) return 'text-green-500';
		if (relevance >= 0.6) return 'text-blue-500';
		if (relevance >= 0.4) return 'text-yellow-500';
		return 'text-gray-500';
	}

	function getRelevanceLabel(relevance: number): string {
		if (relevance >= 0.8) return 'Highly Relevant';
		if (relevance >= 0.6) return 'Relevant';
		if (relevance >= 0.4) return 'Somewhat Relevant';
		return 'May Be Relevant';
	}
</script>

<div class="ai-card-recommendations">
	{#if isLoading}
		<div class="rounded-lg border border-line bg-surface-muted p-6 text-center">
			<div class="mb-3 text-3xl">🤖</div>
			<div class="font-semibold text-ink">AI is analyzing your response...</div>
			<div class="mt-2 text-sm text-ink-muted">Finding relevant cards</div>
			<div class="mt-4 flex justify-center">
				<div class="h-2 w-32 overflow-hidden rounded-full bg-surface">
					<div class="h-full w-1/2 animate-pulse bg-brand" />
				</div>
			</div>
		</div>
	{:else if recommendations.length > 0}
		<div class="space-y-3">
			<div class="flex items-center gap-2">
				<div class="text-lg font-semibold text-ink">🎯 AI Recommendations</div>
				<div class="rounded-full bg-brand/20 px-2 py-0.5 text-xs font-medium text-brand">
					{recommendations.length} cards
				</div>
			</div>

			{#each recommendations as rec, index (rec.cardId)}
				<button
					on:click={() => onSelectCard(rec.cardId)}
					class="group w-full overflow-hidden rounded-lg border border-line bg-surface-muted p-4 text-left transition hover:border-brand hover:bg-brand/5 hover:shadow-lg"
					transition:fly={{ y: 20, delay: index * 100 }}
				>
					<div class="flex items-start justify-between gap-3">
						<div class="flex-1">
							<div class="mb-1 flex items-center gap-2">
								<div class="font-bold text-ink">{rec.cardTitle}</div>
								<div
									class="text-xs font-medium {getRelevanceColor(rec.relevance)}"
									title="Relevance: {Math.round(rec.relevance * 100)}%"
								>
									{getRelevanceLabel(rec.relevance)}
								</div>
							</div>
							<div class="text-sm text-ink-muted">{rec.reasoning}</div>
						</div>

						<!-- Relevance bar -->
						<div class="flex flex-col items-end gap-1">
							<div class="text-xs font-semibold {getRelevanceColor(rec.relevance)}">
								{Math.round(rec.relevance * 100)}%
							</div>
							<div class="h-16 w-2 overflow-hidden rounded-full bg-surface">
								<div
									class="w-full bg-gradient-to-t from-brand to-brand/50 transition-all duration-300"
									style="height: {rec.relevance * 100}%"
								/>
							</div>
						</div>
					</div>

					<!-- Action hint -->
					<div class="mt-3 text-xs text-ink-muted opacity-0 transition-opacity group-hover:opacity-100">
						Click to add this card to your response
					</div>
				</button>
			{/each}

			<!-- Disclaimer -->
			<div class="rounded-lg border border-line bg-surface p-3 text-xs text-ink-muted">
				<span class="font-semibold">Note:</span> These are AI-generated suggestions. Use your
				judgment to select cards that genuinely resonate with your thinking.
			</div>
		</div>
	{:else}
		<div class="rounded-lg border border-line bg-surface-muted p-6 text-center">
			<div class="mb-2 text-3xl">🤖</div>
			<div class="font-semibold text-ink">No recommendations yet</div>
			<div class="text-sm text-ink-muted">
				Start typing your response to get AI-powered card suggestions
			</div>
		</div>
	{/if}
</div>

<style>
	@keyframes pulse {
		0%,
		100% {
			transform: translateX(0);
		}
		50% {
			transform: translateX(100%);
		}
	}

	.animate-pulse {
		animation: pulse 1.5s ease-in-out infinite;
	}
</style>
