<script lang="ts">
	/**
	 * PhaseCharts Component
	 * Displays charts for all questions in a given phase
	 * Each question gets its own chart based on Sanity configuration
	 */
	import { browser } from '$app/environment';
    import { responses, questions, phases } from '$lib/realtime';
    import { buildChartForQuestion, type InferredQuestionType } from '$lib/aggregators/questionCharts';
    import BarChart from '$lib/components/charts/BarChart.svelte';
    import PieChart from '$lib/components/charts/PieChart.svelte';
    import LineChart from '$lib/components/charts/LineChart.svelte';
    import WordCloudChart from '$lib/components/charts/WordCloudChart.svelte';
    import LandscapeChart from '$lib/components/charts/LandscapeChart.svelte';
    import RoadmapChart from '$lib/components/charts/RoadmapChart.svelte';

export let phaseKey: string;
export let width = 900;
export let height = 520;

// Map inferred types to components
const componentMap: Record<InferredQuestionType, any> = {
    multipleChoice: BarChart,
    rating: LineChart,
    boolean: PieChart,
    voting: WordCloudChart,
    openText: WordCloudChart
};

type ChartEntry = {
    question: any;
    type: InferredQuestionType | 'landscape' | 'roadmap' | 'timeline';
    data: import('$lib/types/charts').ChartData | null;
};

// Compute charts for this phase using inference, with graceful fallbacks
$: chartEntries = ((): ChartEntry[] => {
    if (!browser || !$responses || !$questions) return [];
    const result: ChartEntry[] = [];
    const phaseQs = $questions.filter(q => q.phase_key === phaseKey || q.id === phaseKey);
    for (const question of phaseQs) {
        const qResponses = $responses.filter(r => r.question_id === question.id);

        // Honor explicit spatial/timeline kinds from Sanity when present
        if (question?.map_type === 'landscape') {
            result.push({ question, type: 'landscape', data: null });
            continue;
        }
        const rec = (question as any)?.recommended_dashboards ?? (question as any)?.recommendedDashboards;
        if (Array.isArray(rec) && rec.includes('roadmap')) {
            result.push({ question, type: 'roadmap', data: null });
            continue;
        }
        if (Array.isArray(rec) && rec.includes('timeline')) {
            result.push({ question, type: 'timeline', data: null });
            continue;
        }

        const built = buildChartForQuestion(question, qResponses);
        result.push({ question, type: built.type, data: built.data });
    }
    return result;
})();

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
				{#each chartEntries as { question, type, data }}
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
            {#if type === 'landscape'}
                <LandscapeChart
                    responses={$responses.filter(r => r.question_id === question.id)}
                    {width}
                    {height}
                    question={question.text || ''}
                />
            {:else if type === 'roadmap' || type === 'timeline'}
                <RoadmapChart
                    responses={$responses.filter(r => r.question_id === question.id)}
                    {width}
                    {height}
                    question={question.text || ''}
                />
            {:else if type === 'voting' || type === 'openText'}
                <WordCloudChart
                    responses={$responses.filter(r => r.question_id === question.id)}
                    {width}
                    {height}
                    question={question.text || ''}
                />
            {:else if type === 'multipleChoice' && data}
                <BarChart data={data} {width} {height} />
            {:else if (type === 'rating' || type === 'boolean') && data}
                <PieChart data={data} {width} {height} />
            {:else}
                <div class="no-data panel p-8 text-center">
                    <p class="text-xs text-secondary">No responses yet</p>
                </div>
            {/if}

						<!-- Chart Type Badge -->
						<div class="mt-3 flex items-center justify-between">
                    <span class="px-2 py-1 bg-brand/10 text-brand text-xs rounded font-medium">
                        {type}
                    </span>
                    <span class="text-xs text-secondary">
                        {data?.meta?.totalResponses || 0} responses
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
