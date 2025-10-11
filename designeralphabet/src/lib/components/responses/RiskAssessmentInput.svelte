<script lang="ts">
	import { createRiskAssessmentMetadata } from '$lib/types/responseMetadata';
	import type { Question } from '$lib/types/workshop';
	import { createEventDispatcher } from 'svelte';

	export let question: Question;

	const dispatch = createEventDispatcher<{
		submit: { text: string; metadata: any };
	}>();

	const riskMatrix = question.config?.riskMatrix as any;
	const impactLabel = riskMatrix?.impactLabel || 'Impact';
	const likelihoodLabel = riskMatrix?.likelihoodLabel || 'Likelihood';
	const impactPrompt = riskMatrix?.impactPrompt || 'How severe would the impact be?';
	const likelihoodPrompt = riskMatrix?.likelihoodPrompt || 'How likely is this to occur?';

	let riskText = '';
	let impact = 3;
	let likelihood = 3;

	const impactDescriptions = ['Minimal', 'Low', 'Moderate', 'High', 'Critical'];
	const likelihoodDescriptions = ['Rare', 'Unlikely', 'Possible', 'Likely', 'Certain'];

	function handleSubmit() {
		if (!riskText.trim()) return;

		const metadata = createRiskAssessmentMetadata(impact, likelihood);
		metadata.impactLabel = impactLabel;
		metadata.likelihoodLabel = likelihoodLabel;

		dispatch('submit', {
			text: riskText,
			metadata
		});

		// Reset form
		riskText = '';
		impact = 3;
		likelihood = 3;
	}
</script>

<div class="risk-assessment-input space-y-6">
	<!-- Risk Description -->
	<div>
		<label for="risk-text" class="block text-sm font-semibold text-gray-700 mb-2">
			Describe the Risk
		</label>
		<textarea
			id="risk-text"
			bind:value={riskText}
			placeholder="Enter your risk description..."
			class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none"
			rows="3"
		/>
	</div>

	<!-- Impact Slider -->
	<div class="space-y-2">
		<label for="impact-slider" class="block text-sm font-semibold text-gray-700">
			{impactLabel}
		</label>
		<p class="text-xs text-gray-500 mb-3">{impactPrompt}</p>

		<div class="relative">
			<input
				id="impact-slider"
				type="range"
				min="1"
				max="5"
				bind:value={impact}
				class="w-full h-3 bg-gradient-to-r from-green-200 via-yellow-200 to-red-400 rounded-lg appearance-none cursor-pointer slider"
			/>
			<div class="flex justify-between mt-2 text-xs text-gray-600">
				{#each impactDescriptions as desc, i}
					<span class="text-center flex-1" class:font-bold={impact === i + 1}>
						{desc}
					</span>
				{/each}
			</div>
		</div>

		<div class="text-center mt-3">
			<span
				class="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full font-semibold text-sm"
			>
				{impactDescriptions[impact - 1]} ({impact}/5)
			</span>
		</div>
	</div>

	<!-- Likelihood Slider -->
	<div class="space-y-2">
		<label for="likelihood-slider" class="block text-sm font-semibold text-gray-700">
			{likelihoodLabel}
		</label>
		<p class="text-xs text-gray-500 mb-3">{likelihoodPrompt}</p>

		<div class="relative">
			<input
				id="likelihood-slider"
				type="range"
				min="1"
				max="5"
				bind:value={likelihood}
				class="w-full h-3 bg-gradient-to-r from-blue-200 via-purple-200 to-pink-400 rounded-lg appearance-none cursor-pointer slider"
			/>
			<div class="flex justify-between mt-2 text-xs text-gray-600">
				{#each likelihoodDescriptions as desc, i}
					<span class="text-center flex-1" class:font-bold={likelihood === i + 1}>
						{desc}
					</span>
				{/each}
			</div>
		</div>

		<div class="text-center mt-3">
			<span
				class="inline-flex items-center px-4 py-2 bg-purple-100 text-purple-800 rounded-full font-semibold text-sm"
			>
				{likelihoodDescriptions[likelihood - 1]} ({likelihood}/5)
			</span>
		</div>
	</div>

	<!-- Submit Button -->
	<button
		on:click={handleSubmit}
		disabled={!riskText.trim()}
		class="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
	>
		Submit Risk Assessment
	</button>
</div>

<style>
	.slider::-webkit-slider-thumb {
		appearance: none;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: white;
		border: 3px solid hsl(var(--brand));
		cursor: pointer;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
		transition: all 0.2s;
	}

	.slider::-webkit-slider-thumb:hover {
		transform: scale(1.2);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	}

	.slider::-moz-range-thumb {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: white;
		border: 3px solid hsl(var(--brand));
		cursor: pointer;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
		transition: all 0.2s;
	}

	.slider::-moz-range-thumb:hover {
		transform: scale(1.2);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	}
</style>
