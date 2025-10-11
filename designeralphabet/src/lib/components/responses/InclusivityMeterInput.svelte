<script lang="ts">
	import { createInclusivityMeterMetadata } from '$lib/types/responseMetadata';
	import type { Question } from '$lib/types/workshop';
	import { createEventDispatcher } from 'svelte';

	export let question: Question;

	const dispatch = createEventDispatcher<{
		submit: { text: string; metadata: any };
	}>();

	const meterConfig = question.config?.inclusivityMeter as any;
	const dimension = meterConfig?.dimension || 'Inclusivity';
	const lowLabel = meterConfig?.lowLabel || 'Needs Improvement';
	const highLabel = meterConfig?.highLabel || 'Highly Inclusive';
	const targetScore = meterConfig?.targetScore || 75;

	let score = 50;
	let reasoning = '';

	$: scoreColor = score < 40 ? 'red' : score < 70 ? 'yellow' : 'green';
	$: fillPercentage = score;
	$: meetsTarget = score >= targetScore;

	function handleSubmit() {
		const metadata = createInclusivityMeterMetadata(score, dimension);

		const responseText = reasoning.trim()
			? `Score: ${score}/100 - ${reasoning}`
			: `Score: ${score}/100`;

		dispatch('submit', {
			text: responseText,
			metadata
		});

		// Reset form
		score = 50;
		reasoning = '';
	}
</script>

<div class="inclusivity-meter-input space-y-6">
	<div class="text-center">
		<h3 class="text-lg font-bold text-gray-800 mb-1">{dimension} Assessment</h3>
		<p class="text-sm text-gray-600">Rate from 0 (low) to 100 (high)</p>
	</div>

	<!-- Visual Meter -->
	<div class="relative w-full max-w-md mx-auto">
		<!-- Thermometer/Meter visualization -->
		<div
			class="relative h-48 bg-gray-100 rounded-full w-24 mx-auto border-4 border-gray-300 overflow-hidden"
		>
			<!-- Fill -->
			<div
				class="absolute bottom-0 w-full transition-all duration-500 ease-out"
				style="height: {fillPercentage}%"
			>
				<div
					class="w-full h-full"
					class:bg-red-400={scoreColor === 'red'}
					class:bg-yellow-400={scoreColor === 'yellow'}
					class:bg-green-400={scoreColor === 'green'}
				/>
			</div>

			<!-- Score label inside meter -->
			<div class="absolute inset-0 flex items-center justify-center">
				<span class="text-2xl font-bold text-gray-800 bg-white/80 px-2 py-1 rounded">
					{score}
				</span>
			</div>
		</div>

		<!-- Target indicator -->
		{#if targetScore}
			<div class="relative mt-4">
				<div class="text-center text-xs text-gray-500 mb-1">
					Target: {targetScore}
				</div>
				<div class="relative w-full h-2 bg-gray-200 rounded-full">
					<div
						class="absolute h-full bg-blue-500 rounded-full transition-all"
						style="width: {Math.min(score, 100)}%"
					/>
					<div
						class="absolute top-1/2 -translate-y-1/2 w-1 h-4 bg-blue-700 border-2 border-white"
						style="left: {targetScore}%"
					/>
				</div>
				{#if meetsTarget}
					<p class="text-center text-sm font-semibold text-green-600 mt-2">✓ Meets target</p>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Score Slider -->
	<div class="space-y-2">
		<label for="score-slider" class="block text-sm font-semibold text-gray-700">
			{dimension} Score
		</label>

		<input
			id="score-slider"
			type="range"
			min="0"
			max="100"
			step="5"
			bind:value={score}
			class="w-full h-4 rounded-lg appearance-none cursor-pointer slider"
			style="background: linear-gradient(to right,
				#f87171 0%,
				#fbbf24 40%,
				#34d399 70%,
				#10b981 100%
			)"
		/>

		<div class="flex justify-between text-xs text-gray-600 mt-1">
			<span class="text-left max-w-[45%]">{lowLabel}</span>
			<span class="text-right max-w-[45%]">{highLabel}</span>
		</div>
	</div>

	<!-- Score breakdown indicators -->
	<div class="grid grid-cols-3 gap-2 text-center text-xs">
		<div class="p-2 rounded" class:bg-red-100={score < 40} class:font-semibold={score < 40}>
			<div class="text-red-600">0-39</div>
			<div class="text-gray-600">Low</div>
		</div>
		<div
			class="p-2 rounded"
			class:bg-yellow-100={score >= 40 && score < 70}
			class:font-semibold={score >= 40 && score < 70}
		>
			<div class="text-yellow-600">40-69</div>
			<div class="text-gray-600">Moderate</div>
		</div>
		<div class="p-2 rounded" class:bg-green-100={score >= 70} class:font-semibold={score >= 70}>
			<div class="text-green-600">70-100</div>
			<div class="text-gray-600">High</div>
		</div>
	</div>

	<!-- Reasoning (Optional) -->
	<div>
		<label for="reasoning" class="block text-sm font-semibold text-gray-700 mb-2">
			Reasoning (Optional)
		</label>
		<textarea
			id="reasoning"
			bind:value={reasoning}
			placeholder="Explain your score..."
			class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none"
			rows="3"
		/>
	</div>

	<!-- Submit Button -->
	<button
		on:click={handleSubmit}
		class="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all"
	>
		Submit Assessment
	</button>
</div>

<style>
	.slider::-webkit-slider-thumb {
		appearance: none;
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background: white;
		border: 4px solid hsl(var(--brand));
		cursor: pointer;
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.25);
		transition: all 0.2s;
	}

	.slider::-webkit-slider-thumb:hover {
		transform: scale(1.15);
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
	}

	.slider::-moz-range-thumb {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background: white;
		border: 4px solid hsl(var(--brand));
		cursor: pointer;
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.25);
		transition: all 0.2s;
	}

	.slider::-moz-range-thumb:hover {
		transform: scale(1.15);
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
	}
</style>
