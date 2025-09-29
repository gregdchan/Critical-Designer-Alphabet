<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { startRealTimePolling, stopRealTimePolling, participants, responses, timeline } from '$lib/realtime';
  import QuadBubbleChart from '$lib/components/charts/QuadBubbleChart.svelte';
  import HeatmapChart from '$lib/components/charts/HeatmapChart.svelte';
  import RoadmapChart from '$lib/components/charts/RoadmapChart.svelte';
  import {
    IconChartBar as BarChart3,
    IconUsers as Users,
    IconClock as Clock,
    IconTrophy as Trophy,
    IconMessage as MessageSquare,
    IconMap as Map,
    IconTrendingUp as TrendingUp,
    IconSettings as Settings,
    IconDownload as Download,
    IconPlus as Plus,
    IconThumbUp as Vote
  } from '@tabler/icons-svelte';

  // Get session code from URL
  const sessionCode = $page.params.code || '';
  const isUserFacilitator = $page.url.searchParams.get('role') === 'facilitator';

  // Tab management
  let activeTab = 'overview';
  const tabs = [
    { id: 'overview', label: 'Quad Bubble', icon: BarChart3 },
    { id: 'heatmap', label: 'Heatmap', icon: TrendingUp },
    { id: 'roadmap', label: 'Roadmap', icon: Map },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy }
  ];

  // Session state
  let currentUser: any = null;
  let sessionTitle = '';
  let timeRemaining = 0;
  let currentStep = 'Welcome';

  // Form states
  let showAddResponse = false;
  let newResponse = {
    lens: 'Risk',
    type: 'usecase',
    text: '',
    cards: []
  };

  onMount(() => {
    // Start real-time polling
    startRealTimePolling(sessionCode);

    // Get current user from participants
    participants.subscribe(users => {
      if (users.length > 0) {
        // Try to find current user (in a real app, this would come from auth)
        currentUser = users.find(u => u.role === (isUserFacilitator ? 'facilitator' : 'participant')) || users[0];
      }
    });
  });

  onDestroy(() => {
    stopRealTimePolling();
  });

  async function addResponse() {
    if (!newResponse.text.trim()) return;

    try {
      const response = await fetch('/api/responses/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: sessionCode,
          ...newResponse,
          author: currentUser?.name || 'Anonymous'
        })
      });

      const data = await response.json();
      if (data.success) {
        newResponse = { lens: 'Risk', type: 'usecase', text: '', cards: [] };
        showAddResponse = false;
      }
    } catch (error) {
      console.error('Error adding response:', error);
    }
  }

  async function voteResponse(responseId: number) {
    try {
      await fetch('/api/responses/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responseId })
      });
    } catch (error) {
      console.error('Error voting:', error);
    }
  }

  function exportSession() {
    window.open(`/api/export/${sessionCode}`, '_blank');
  }

  $: participantsSorted = $participants.sort((a, b) => b.points - a.points);
</script>

<div class="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-cyan-900">
  <!-- Header -->
  <header class="bg-slate-800/50 backdrop-blur-sm border-b border-cyan-400/20 sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <h1 class="text-2xl font-bold text-white">Session {sessionCode}</h1>
          {#if sessionTitle}
            <span class="text-slate-300">• {sessionTitle}</span>
          {/if}
        </div>

        <div class="flex items-center gap-6">
          <!-- Timer -->
          <div class="flex items-center gap-2 text-slate-300">
            <Clock class="w-5 h-5" />
            <span>{currentStep}</span>
            {#if timeRemaining > 0}
              <span class="text-cyan-400 font-mono">
                {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
              </span>
            {/if}
          </div>

          <!-- Participants count -->
          <div class="flex items-center gap-2 text-slate-300">
            <Users class="w-5 h-5" />
            <span>{$participants.length}</span>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-2">
            {#if isUserFacilitator}
              <button
                on:click={exportSession}
                class="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                title="Export Session"
              >
                <Download class="w-5 h-5" />
              </button>
              <button
                class="p-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors"
                title="Settings"
              >
                <Settings class="w-5 h-5" />
              </button>
            {/if}
            <button
              on:click={() => showAddResponse = true}
              class="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white rounded-lg transition-all flex items-center gap-2"
            >
              <Plus class="w-4 h-4" />
              Add Response
            </button>
          </div>
        </div>
      </div>

      <!-- Participant Avatars -->
      {#if $participants.length > 0}
        <div class="mt-4 flex items-center gap-2 overflow-x-auto pb-2">
          {#each $participants as participant}
            <div
              class="flex-shrink-0 relative group"
              title="{participant.name} ({participant.points} pts)"
            >
              <div
                class="w-10 h-10 rounded-full border-2 border-white/20 flex items-center justify-center text-white font-semibold text-sm"
                style="background-color: {participant.color}"
              >
                {participant.name.charAt(0).toUpperCase()}
              </div>
              {#if participant.role === 'facilitator'}
                <div class="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-slate-800"></div>
              {/if}
              <div class="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                {participant.name} ({participant.points} pts)
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </header>

  <!-- Tab Navigation -->
  <nav class="bg-slate-800 border-b border-slate-700">
    <div class="max-w-6xl mx-auto px-6">
      <div class="flex overflow-x-auto">
        {#each tabs as tab}
          <button
            on:click={() => activeTab = tab.id}
            class="flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap border-b-2 {activeTab === tab.id
              ? 'text-blue-400 border-blue-400'
              : 'text-slate-400 border-transparent hover:text-slate-100 hover:border-slate-500'}"
          >
            <svelte:component this={tab.icon} class="w-5 h-5" />
            {tab.label}
          </button>
        {/each}
      </div>
    </div>
  </nav>

  <!-- Main Content -->
  <main class="max-w-6xl mx-auto px-6 py-8">
    <!-- Overview Tab - Quad Bubble -->
    {#if activeTab === 'overview'}
      <div class="bg-slate-800 rounded-lg p-8 border border-slate-600">
        <h2 class="text-2xl font-semibold text-slate-100 mb-8">Impact vs Effort Analysis</h2>
        <QuadBubbleChart responses={$responses} width={800} height={480} />
      </div>
    {/if}

    <!-- Heatmap Tab -->
    {#if activeTab === 'heatmap'}
      <div class="bg-slate-800 rounded-lg p-8 border border-slate-600">
        <h2 class="text-2xl font-semibold text-slate-100 mb-8">Maturity Assessment</h2>
        <HeatmapChart responses={$responses} width={800} height={500} />
      </div>
    {/if}

    <!-- Roadmap Tab -->
    {#if activeTab === 'roadmap'}
      <div class="bg-slate-800 rounded-lg p-8 border border-slate-600">
        <h2 class="text-2xl font-semibold text-slate-100 mb-8">Development Roadmap</h2>
        <RoadmapChart responses={$responses} width={900} height={600} />
      </div>
    {/if}

    <!-- Leaderboard Tab -->
    {#if activeTab === 'leaderboard'}
      <div class="bg-slate-800 rounded-lg p-8 border border-slate-600">
        <h2 class="text-2xl font-semibold text-slate-100 mb-8 flex items-center gap-2">
          <Trophy class="w-6 h-6 text-yellow-500" />
          Participant Leaderboard
        </h2>

        {#if participantsSorted.length > 0}
          <div class="space-y-4">
            {#each participantsSorted as participant, index}
              <div class="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                <div class="flex items-center gap-4">
                  <span class="text-2xl font-bold text-slate-400">#{index + 1}</span>
                  <div
                    class="w-12 h-12 rounded-full border-2 border-white/20 flex items-center justify-center text-white font-semibold"
                    style="background-color: {participant.color}"
                  >
                    {participant.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 class="font-semibold text-white">{participant.name}</h3>
                    <p class="text-sm text-slate-400">{participant.role}</p>
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-2xl font-bold text-cyan-400">{participant.points}</div>
                  <div class="text-sm text-slate-400">points</div>
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <p class="text-slate-400 text-center py-8">No participants yet</p>
        {/if}
      </div>
    {/if}

    <!-- Recent Responses -->
    <div class="mt-8 bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 border border-slate-600">
      <h3 class="text-xl font-semibold text-white mb-4 flex items-center gap-2">
        <MessageSquare class="w-5 h-5" />
        Recent Responses
      </h3>

      {#if $responses.length > 0}
        <div class="space-y-4 max-h-64 overflow-y-auto">
          {#each $responses.slice(0, 10) as response}
            <div class="bg-slate-700/50 rounded-lg p-4">
              <div class="flex items-start justify-between mb-2">
                <div class="flex items-center gap-2">
                  <span class="px-2 py-1 bg-cyan-400/20 text-cyan-300 rounded text-xs">{response.lens}</span>
                  <span class="px-2 py-1 bg-purple-400/20 text-purple-300 rounded text-xs">{response.type}</span>
                </div>
                <button
                  on:click={() => voteResponse(response.id)}
                  class="flex items-center gap-1 px-2 py-1 bg-slate-600 hover:bg-slate-500 text-white rounded text-xs transition-colors"
                >
                  <Vote class="w-3 h-3" />
                  {response.votes}
                </button>
              </div>
              <p class="text-white mb-2">{response.text}</p>
              <p class="text-sm text-slate-400">by {response.author}</p>
            </div>
          {/each}
        </div>
      {:else}
        <p class="text-slate-400 text-center py-8">No responses yet. Be the first to contribute!</p>
      {/if}
    </div>
  </main>
</div>

<!-- Add Response Modal -->
{#if showAddResponse}
  <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 z-50">
    <div class="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-cyan-400/20">
      <h3 class="text-xl font-semibold text-white mb-4">Add Response</h3>

      <form on:submit|preventDefault={addResponse} class="space-y-4">
        <div>
          <label for="new-response-lens" class="block text-sm font-medium text-slate-300 mb-2">Lens</label>
          <select
            id="new-response-lens"
            bind:value={newResponse.lens}
            class="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
          >
            <option value="Risk">Risk</option>
            <option value="Work">Work</option>
            <option value="Sustainability">Sustainability</option>
            <option value="Ethics">Ethics</option>
          </select>
        </div>

        <div>
          <label for="new-response-type" class="block text-sm font-medium text-slate-300 mb-2">Type</label>
          <select
            id="new-response-type"
            bind:value={newResponse.type}
            class="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
          >
            <option value="usecase">Use Case</option>
            <option value="concern">Concern</option>
            <option value="goal">Goal</option>
            <option value="metric">Metric</option>
          </select>
        </div>

        <div>
          <label for="new-response-text" class="block text-sm font-medium text-slate-300 mb-2">Response</label>
          <textarea
            id="new-response-text"
            bind:value={newResponse.text}
            placeholder="Enter your response..."
            class="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 h-24 resize-none"
            required
          ></textarea>
        </div>

        <div class="flex gap-3 pt-4">
          <button
            type="button"
            on:click={() => showAddResponse = false}
            class="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white rounded-lg transition-all"
          >
            Add Response
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
