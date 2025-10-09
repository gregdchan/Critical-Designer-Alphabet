<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { page } from '$app/stores';
  import { browser } from '$app/environment';
  import BarChart from '$lib/components/charts/BarChart.svelte';
  import PieChart from '$lib/components/charts/PieChart.svelte';
  import WordCloudChart from '$lib/components/charts/WordCloudChart.svelte';
  import { buildChartForQuestion, inferQuestionType } from '$lib/aggregators/questionCharts';
  import { sessionDetails, questions, responses, startRealtimeSession, stopRealtimeSession } from '$lib/realtime';
  import type { ChartData } from '$lib/types/charts';

  const chartMap = {
    multipleChoice: BarChart,
    rating: PieChart,
    boolean: PieChart,
    voting: WordCloudChart,
    openText: WordCloudChart
  } as const;

  type OverrideType = keyof typeof chartMap;
  let overrides: Record<string, OverrideType> = {}; // question_id → override type

  let roomCode = '';

  function handleOverride(qid: string, type: string) {
    overrides = { ...overrides, [qid]: type as OverrideType };
  }

  onMount(async () => {
    if (!browser) return;
    roomCode = $page.params.code || '';
    if (roomCode) {
      await startRealtimeSession(roomCode);
    }
  });

  onDestroy(() => stopRealtimeSession());
</script>

{#if $sessionDetails}
  <div class="mx-auto max-w-[1400px] space-y-8 py-6">
    <header class="flex items-baseline justify-between">
      <h1 class="text-2xl font-semibold text-primary">Facilitator Panel · {$sessionDetails.title || $sessionDetails.code}</h1>
      <p class="text-sm text-secondary">Questions: {$questions.length} · Responses: {$responses.length}</p>
    </header>

    <div class="space-y-6">
      {#each $questions as q}
        {#if q}
          {@const qResponses = $responses.filter(r => r.question_id === q.id)}
          {@const inferred = inferQuestionType(q, qResponses)}
          {@const chartType: OverrideType = overrides[q.id] || inferred}
          {@const ChartComp = chartMap[chartType]}
          {@const built = buildChartForQuestion(q, qResponses)}

          <section class="rounded-2xl border border-line panel p-5">
            <div class="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 class="text-lg font-semibold text-primary">{q.text || q.section || 'Question'}</h2>
                {#if q.section && q.section !== q.text}
                  <p class="text-xs text-secondary mt-0.5">{q.section}</p>
                {/if}
              </div>
              <div class="flex items-center gap-2">
                <label class="text-xs text-secondary">Chart</label>
                <select
                  class="text-sm surface-input border border-line rounded px-2 py-1"
                  on:change={(e) => handleOverride(q.id, (e.target as HTMLSelectElement).value)}
                >
                  {#each Object.keys(chartMap) as key}
                    <option value={key} selected={chartType === key}>{key}</option>
                  {/each}
                </select>
              </div>
            </div>

            {#if chartType === 'voting' || chartType === 'openText'}
              <div class="w-full" style="height:520px">
                <WordCloudChart
                  responses={qResponses}
                  width={1300}
                  height={520}
                  question={q.text || ''}
                />
              </div>
            {:else if built?.data}
              <div class="w-full" style="height:520px">
                <ChartComp data={built.data as ChartData} title={q.text || ''} />
              </div>
            {:else}
              <div class="p-6 text-sm text-secondary">No responses yet</div>
            {/if}
          </section>
        {/if}
      {/each}
    </div>
  </div>
{:else}
  <div class="p-6 text-secondary">Loading session…</div>
{/if}

<style>
  .panel {
    background: hsl(var(--surface-elevated));
    box-shadow: 0 12px 32px rgba(15, 23, 42, 0.07);
  }
</style>

