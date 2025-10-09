<script lang="ts">
	/**
	 * PhaseCharts Component
	 * Displays charts for all questions in a given phase
	 * Each question gets its own chart based on Sanity configuration
	 */
	import { browser } from '$app/environment';
	import { responses, questions, phases } from '$lib/realtime';
	import { getPhaseCharts, getChartType } from '$lib/stores/charts';
	import BarChart from '$lib/components/charts/BarChart.svelte';
	import WordCloudChart from '$lib/components/charts/WordCloudChart.svelte';
	import LandscapeChart from '$lib/components/charts/LandscapeChart.svelte';
	import RoadmapChart from '$lib/components/charts/RoadmapChart.svelte';

	export let phaseKey: string;
	export let width = 900;
	export let height = 520;

	// Get charts for this phase
	$: phaseCharts = browser && $responses && $questions
		? getPhaseCharts(phaseKey, $responses, $questions)
		: new Map();

	$: chartEntries = Array.from(phaseCharts.values());

	// Get phase info
	$: phase = $phases.find(p => p.phase_key === phaseKey || p.id === phaseKey);
</script>

{#if browser}
	<div class="phase-charts">
		{#if phase}
			<div class="phase-header mb-6">
				<h2 class="text-xl font-semibold text-primary">{phase.title || 'Phase'}</h2>
				{#if phase.description}
					<p class="text-sm text-secondary mt-1">{phase.description}</p>
				{/if}
			</div>
		{/if}

		{#if chartEntries.length === 0}
			<div class="empty-state panel p-8 text-center">
				<p class="text-secondary">No questions or responses for this phase yet.</p>
			</div>
		{:else}
			<div class="charts-list space-y-8">
				{#each chartEntries as { question, chartData, chartType }}
					<div class="chart-card panel p-6">
						<!-- Question Title -->
						<div class="mb-4">
							<h3 class="text-base font-semibold text-primary">
								{question.text || question.section || 'Question'}
							</h3>
							{#if question.section && question.section !== question.text}
								<p class="text-xs text-secondary mt-1">{question.section}</p>
							{/if}
						</div>

						<!-- Chart Visualization -->
						{#if chartData}
							{#if chartType === 'bar' || chartType === 'pie'}
								<BarChart {chartData} {width} {height} />

							{:else if chartType === 'wordcloud'}
								<WordCloudChart
									responses={$responses.filter(r => r.question_id === question.id)}
									{width}
									{height}
								/>

							{:else if chartType === 'landscape'}
								<LandscapeChart
									responses={$responses.filter(r => r.question_id === question.id)}
									{width}
									{height}
								/>

							{:else if chartType === 'roadmap' || chartType === 'timeline'}
								<RoadmapChart
									responses={$responses.filter(r => r.question_id === question.id)}
									{width}
									{height}
								/>

							{:else}
								<!-- Fallback to bar chart -->
								<BarChart {chartData} {width} {height} />
							{/if}
						{:else}
							<div class="no-data panel p-8 text-center">
								<p class="text-xs text-secondary">No responses yet</p>
							</div>
						{/if}

						<!-- Chart Type Badge -->
						<div class="mt-3 flex items-center justify-between">
							<span class="px-2 py-1 bg-brand/10 text-brand text-xs rounded font-medium">
								{chartType}
							</span>
							<span class="text-xs text-secondary">
								{chartData?.meta?.totalResponses || 0} responses
							</span>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
{:else}
	<p class="text-secondary">Loading charts...</p>
{/if}

<style>
	.phase-charts {
		width: 100%;
	}

	.charts-list {
		width: 100%;
	}

	.chart-card {
		min-height: 450px;
		display: flex;
		flex-direction: column;
	}

	.no-data {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 300px;
		border: 2px dashed hsl(var(--border-subtle));
		background: hsl(var(--surface-muted));
	}

	.empty-state {
		margin: 2rem auto;
		max-width: 500px;
	}
</style>
