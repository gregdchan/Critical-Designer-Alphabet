<script lang="ts">
  import { onMount } from 'svelte';
  import PieChart from '$lib/components/charts/PieChart.svelte';
  import ParticipantJourneyChart from '$lib/components/charts/ParticipantJourneyChart.svelte';
  import type { ChartData } from '$lib/types/charts';
  import LandscapeChart from '$lib/components/charts/LandscapeChart.svelte';
  import RatingsBeeswarm from '$lib/components/charts/RatingsBeeswarm.svelte';
  import { page } from '$app/stores';

  type ApiResponse = {
    success: boolean;
    session?: any;
    participants?: Array<{ id: string; name: string; color?: string }>;
    responses?: Array<{
      id: string;
      participant_id: string | null;
      question_id: string;
      text: string;
      votes: number;
      createdAt?: string;
      created_at?: string;
      questions?: { text?: string; section?: string } | null;
    }>;
    questions?: any[];
    error?: string;
  };

  let sessionCode = '';
  let loading = false;
  let error = '';
  let participants: Array<{ id: string; name: string; color?: string }> = [];
  let responses: ApiResponse['responses'] = [];
  let selectedParticipantId: string | null = null;
  let questions: any[] = [];

  $: selectedParticipant = participants.find((p) => p.id === selectedParticipantId) || null;

  async function loadSession() {
    error = '';
    if (!sessionCode || sessionCode.trim().length < 3) {
      error = 'Enter a valid session code';
      return;
    }
    loading = true;
    try {
      const res = await fetch(`/api/dashboard/${encodeURIComponent(sessionCode.trim())}`);
      const data: ApiResponse = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to load session');
      }
      participants = data.participants || [];
      responses = data.responses || [];
      questions = data.questions || [];
      // Preselect first participant if available
      selectedParticipantId = participants[0]?.id ?? null;
    } catch (e: any) {
      error = e?.message || 'Failed to load session';
    } finally {
      loading = false;
    }
  }

  // Derived data for charts
  $: participantResponses = (responses || []).filter((r) => r.participant_id === selectedParticipantId);

  // Pull query params to prefill
  $: {
    const url = $page?.url;
    if (url) {
      const code = url.searchParams.get('code');
      const pid = url.searchParams.get('participant');
      if (code && code !== sessionCode) {
        sessionCode = code;
        // load session automatically
        loadSession();
      }
      if (pid && pid !== selectedParticipantId) {
        selectedParticipantId = pid;
      }
    }
  }

  // Lens donut data (PieChart)
  $: lensDonut: ChartData = {
    title: 'Lens Profile',
    series: [
      {
        id: 'lenses',
        points: Object.entries(
          participantResponses.reduce((acc: Record<string, number>, r) => {
            const lens = (r.questions?.section || 'General') as string;
            acc[lens] = (acc[lens] || 0) + 1;
            return acc;
          }, {})
        )
          .map(([label, value]) => ({ id: label, label, value }))
          .sort((a, b) => b.value - a.value)
      }
    ]
  };

  // Journey points
  const qPhaseMap = () => {
    const map = new Map<string, string>();
    for (const q of questions || []) {
      if (q?.id && q?.phase_key) map.set(q.id, q.phase_key);
    }
    return map;
  };

  $: journeyPoints = participantResponses
    .map((r) => ({
      t: new Date(r.createdAt || r.created_at || Date.now()),
      lens: (r.questions?.section || 'General') as string,
      text: r.questions?.text || r.text,
      votes: r.votes || 0,
      phase: qPhaseMap().get(r.question_id) || undefined
    }))
    .sort((a, b) => a.t.getTime() - b.t.getTime());

  // Ratings beeswarm points
  $: ratingPoints = participantResponses
    .filter((r) => (r as any)?.questions?.response_type === 'scale')
    .map((r) => ({
      value: parseFloat(r.text),
      lens: (r.questions?.section || 'General') as string,
      question: r.questions?.text || '',
      t: new Date(r.createdAt || r.created_at || Date.now())
    }))
    .filter((p) => Number.isFinite(p.value));

  // Landscape responses with participant spotlight
  $: landscapeAll = (responses || []).map((r) => ({
    id: r.id,
    text: r.text,
    participantName: participants.find((p) => p.id === r.participant_id)?.name || 'Anonymous',
    participantId: r.participant_id || undefined,
    lens: r.questions?.section || undefined,
    votes: r.votes || 0,
    // metadata may already be JSON; pass-through
    metadata: null
  }));
</script>

<section class="mx-auto max-w-[1200px] px-4 py-8 space-y-6">
  <header class="flex items-end justify-between gap-4">
    <div>
      <h1 class="text-2xl font-semibold text-ink">Participant Story (beta)</h1>
      <p class="text-sm text-ink-2">Explore one person’s journey across lenses and questions.</p>
    </div>
    <form class="flex items-center gap-2" on:submit|preventDefault={loadSession}>
      <input
        class="rounded-md border border-line bg-surface-elevated px-3 py-2 text-sm text-ink placeholder:text-ink-2 focus:border-brand focus:outline-none"
        placeholder="Session code (e.g., ABC123)"
        bind:value={sessionCode}
      />
      <button class="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Load</button>
    </form>
  </header>

  {#if error}
    <div class="rounded-lg border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800">{error}</div>
  {/if}

  {#if loading}
    <div class="rounded-lg border border-line bg-surface-elevated p-6 text-ink-2">Loading…</div>
  {/if}

  {#if !loading && participants.length > 0}
    <div class="flex flex-wrap items-center gap-3">
      <label class="text-sm text-ink-2">Participant</label>
      <select
        class="rounded-md border border-line bg-surface-elevated px-3 py-2 text-sm"
        bind:value={selectedParticipantId}
      >
        {#each participants as p}
          <option value={p.id}>{p.name || 'Anonymous'}</option>
        {/each}
      </select>
    </div>

    <div class="mt-6 grid gap-6 md:grid-cols-2">
      <div class="rounded-2xl border border-line bg-surface-elevated p-4">
        <h2 class="mb-3 text-sm font-semibold text-ink">Lens Profile</h2>
        <div class="h-[320px]">
          <PieChart data={lensDonut} title="Lens Profile" />
        </div>
      </div>

      <div class="rounded-2xl border border-line bg-surface-elevated p-4">
        <h2 class="mb-3 text-sm font-semibold text-ink">Journey</h2>
        <div class="h-[320px]">
          <ParticipantJourneyChart title="Journey" points={journeyPoints} />
        </div>
      </div>
    </div>

    <!-- Ratings Beeswarm (if any rating answers exist) -->
    {#if ratingPoints.length > 0}
      <div class="rounded-2xl border border-line bg-surface-elevated p-4 mt-6">
        <h2 class="mb-3 text-sm font-semibold text-ink">Ratings Beeswarm</h2>
        <div class="h-[280px]">
          <RatingsBeeswarm title="Ratings" points={ratingPoints} min={0} max={10} />
        </div>
      </div>
    {/if}

    <!-- Landscape spotlight overlay -->
    <div class="rounded-2xl border border-line bg-surface-elevated p-4 mt-6">
      <h2 class="mb-3 text-sm font-semibold text-ink">Landscape (spotlight)</h2>
      <div class="h-[380px]">
        <LandscapeChart
          responses={landscapeAll}
          width={1000}
          height={360}
          xLabel="X"
          yLabel="Y"
          minX={0}
          maxX={10}
          minY={0}
          maxY={10}
          highlightParticipantId={selectedParticipantId}
        />
      </div>
    </div>

    {#if selectedParticipant}
      <div class="mt-4 text-xs text-ink-2">Showing responses for <span class="text-ink font-medium">{selectedParticipant.name}</span></div>
    {/if}
  {/if}
</section>

<style>
  .text-ink { color: hsl(var(--text-primary)); }
  .text-ink-2 { color: hsl(var(--text-muted)); }
  .bg-surface-elevated { background: hsl(var(--surface-elevated)); }
  .border-line { border-color: hsl(var(--border-subtle)); }
</style>
