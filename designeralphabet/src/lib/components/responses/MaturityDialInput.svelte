<script lang="ts">
	import { createMaturityDialMetadata } from '$lib/types/responseMetadata';
	import type { Question } from '$lib/types/workshop';
	import { createEventDispatcher } from 'svelte';

	export let question: Question;

	const dispatch = createEventDispatcher<{
		submit: { text: string; metadata: any };
	}>();

	const maturityDialConfig = question.config?.maturityDial as any;
	const dimension = maturityDialConfig?.dimension || 'Maturity';
	const stages = maturityDialConfig?.stages || [
		{ level: 1, name: 'Foundational', description: 'Basic awareness' },
		{ level: 2, name: 'Developing', description: 'Early adoption' },
		{ level: 3, name: 'Proficient', description: 'Regular practice' },
		{ level: 4, name: 'Advanced', description: 'Strategic integration' },
		{ level: 5, name: 'Aspirational', description: 'Innovation leadership' }
	];

	let selectedLevel = 3;
	let additionalNotes = '';

	$: selectedStage = stages.find((s: any) => s.level === selectedLevel);

	function handleSubmit() {
		const metadata = createMaturityDialMetadata(selectedLevel, selectedStage?.name);

		const responseText = additionalNotes.trim()
			? `${selectedStage?.name}: ${additionalNotes}`
			: selectedStage?.name || `Level ${selectedLevel}`;

		dispatch('submit', {
			text: responseText,
			metadata
		});

		// Reset form
		selectedLevel = 3;
		additionalNotes = '';
	}

	// Calculate rotation for dial visualization
	$: rotation = ((selectedLevel - 1) / 4) * 180 - 90; // -90deg to 90deg
</script>

<div class="maturity-dial-input space-y-6">
	<div class="text-center">
		<h3 class="text-lg font-bold text-gray-800 mb-1">{dimension} Level</h3>
		<p class="text-sm text-gray-600">Select your current maturity stage</p>
	</div>

	<!-- Visual Dial -->
	<div class="relative w-64 h-32 mx-auto mb-8">
		<!-- Arc background -->
		<svg viewBox="0 0 200 100" class="w-full h-full">
			<!-- Background arc -->
			<path
				d="M 10 90 A 90 90 0 0 1 190 90"
				fill="none"
				stroke="hsl(var(--border-subtle))"
				stroke-width="20"
				stroke-linecap="round"
			/>
			<!-- Colored segments -->
			{#each stages as stage, i}
				{@const startAngle = -90 + (i * 180) / 4}
				{@const endAngle = -90 + ((i + 1) * 180) / 4}
				{@const largeArc = 0}
				{@const x1 = 100 + 90 * Math.cos((startAngle * Math.PI) / 180)}
				{@const y1 = 90 + 90 * Math.sin((startAngle * Math.PI) / 180)}
				{@const x2 = 100 + 90 * Math.cos((endAngle * Math.PI) / 180)}
				{@const y2 = 90 + 90 * Math.sin((endAngle * Math.PI) / 180)}

				<path
					d="M {x1} {y1} A 90 90 0 {largeArc} 1 {x2} {y2}"
					fill="none"
					stroke={selectedLevel === stage.level ? 'hsl(var(--brand))' : `hsl(var(--chart-${(i % 5) + 1}))`}
					stroke-width="20"
					stroke-linecap="round"
					opacity={selectedLevel === stage.level ? 1 : 0.4}
					class="transition-all duration-300"
				/>
			{/each}

			<!-- Needle -->
			<g transform="translate(100, 90)">
				<line
					x1="0"
					y1="0"
					x2="0"
					y2="-75"
					stroke="hsl(var(--brand))"
					stroke-width="4"
					stroke-linecap="round"
					transform="rotate({rotation})"
					class="transition-transform duration-500 ease-out"
				/>
				<circle cx="0" cy="0" r="8" fill="hsl(var(--brand))" />
			</g>
		</svg>
	</div>

	<!-- Stage Selection -->
	<div class="space-y-3">
		{#each stages as stage}
			<button
				type="button"
				on:click={() => (selectedLevel = stage.level)}
				class="w-full text-left p-4 rounded-lg border-2 transition-all"
				class:border-blue-500={selectedLevel === stage.level}
				class:bg-blue-50={selectedLevel === stage.level}
				class:border-gray-200={selectedLevel !== stage.level}
				class:hover:border-gray-300={selectedLevel !== stage.level}
			>
				<div class="flex items-center gap-3">
					<div
						class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white transition-all"
						style="background-color: hsl(var(--chart-{(stage.level - 1) % 5 + 1}))"
						class:scale-110={selectedLevel === stage.level}
					>
						{stage.level}
					</div>
					<div class="flex-1">
						<div class="font-semibold text-gray-800">{stage.name}</div>
						<div class="text-sm text-gray-600">{stage.description}</div>
					</div>
					{#if selectedLevel === stage.level}
						<div class="text-blue-500">
							<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
							</svg>
						</div>
					{/if}
				</div>
			</button>
		{/each}
	</div>

	<!-- Additional Notes (Optional) -->
	<div>
		<label for="notes" class="block text-sm font-semibold text-gray-700 mb-2">
			Additional Context (Optional)
		</label>
		<textarea
			id="notes"
			bind:value={additionalNotes}
			placeholder="Add any additional context or notes..."
			class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none"
			rows="2"
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
