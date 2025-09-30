<script lang="ts">
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { onDestroy, onMount } from 'svelte';
  import {
    sessionDetails,
    participants,
    questions,
    responses,
    timeline,
    chat,
    leaderboard,
    startRealtimeSession,
    stopRealtimeSession,
    addResponse as apiAddResponse,
    voteResponse as apiVoteResponse,
    addTimelineEntry as apiAddTimelineEntry,
    sendChatMessage as apiSendChatMessage,
    getParticipantProfile,
    storeParticipantProfile,
    clearParticipantProfile,
    refreshSession
  } from '$lib/realtime';
  import sanityClient from '$lib/sanity';
  import { currentUser } from '$lib/stores/user';
  import QuadBubbleChart from '$lib/components/charts/QuadBubbleChart.svelte';
  import HeatmapChart from '$lib/components/charts/HeatmapChart.svelte';
  import RoadmapChart from '$lib/components/charts/RoadmapChart.svelte';
  import {
    IconUsers,
    IconClock,
    IconDownload,
    IconMessage,
    IconHome,
    IconMap,
    IconChartBubble,
    IconFlame,
    IconSend,
    IconPlus,
    IconThumbUp,
    IconGridDots
  } from '@tabler/icons-svelte';

  export let data: { sessionCode: string; role: string };

  const sessionCode = data.sessionCode ?? '';
  let currentParticipant: any = null;
  const activeRole = data.role ?? 'participant';

  let activeTab: 'overview' | 'heatmap' | 'roadmap' | 'timeline' | 'chat' = 'overview';
  let responseModalOpen = false;
  let selectedQuestionId: string | null = null;
  let responseText = '';
  let linkedCardsText = '';

  let timelineModalOpen = false;
  let timelineLabel: 'Now' | 'Next' | 'Later' = 'Now';
  let timelineText = '';
  let timelineOwner = '';
  let timelineMetric = '';
  let timelineRisk = '';

  let chatMessage = '';

  type TemplateRound = {
    key?: string;
    name?: string;
    minutes?: number;
    questions?: string[];
  };

  type SessionStatus = 'planned' | 'live' | 'done';

  const sessionStatuses: SessionStatus[] = ['planned', 'live', 'done'];
  const statusLabels: Record<SessionStatus, string> = {
    planned: 'Planned',
    live: 'In Session',
    done: 'Completed'
  };

  let templateRounds: TemplateRound[] = [];
  let templateLoading = false;
  let templateError = '';
  let templateTitle = '';
  let statusUpdating = false;
  let roundUpdating = false;
  let customMinutes = 10;
  let customLabel = 'Custom Breakout';
  let countdownTimer: ReturnType<typeof setInterval> | null = null;
  let roundCountdownLabel = '';
  let roundRemainingMs = 0;
  let lastTemplateSlug: string | null = null;

  $: sessionInfo = $sessionDetails;
  $: participantsList = $participants ?? [];
  $: questionsList = $questions ?? [];
  $: responsesList = $responses ?? [];
  $: timelineList = $timeline ?? [];
  $: chatList = $chat ?? [];
  $: leaderboardList = $leaderboard ?? [];

  $: responsesForViz = responsesList.map((entry) => {
    const question = questionsList.find((q) => q.id === entry.question_id);
    const author = participantsList.find((p) => p.id === entry.participant_id);
    return {
      ...entry,
      lens: question?.section ?? 'Unknown',
      participantName: author?.name ?? 'Anonymous'
    };
  });

  $: if (browser) {
    const slug = sessionInfo?.template_slug ?? null;
    if (slug && slug !== lastTemplateSlug) {
      lastTemplateSlug = slug;
      loadTemplateBlueprint(slug);
    }
  }

  $: if (sessionInfo?.round_expires_at) {
    updateRoundCountdown();
    if (!countdownTimer) {
      countdownTimer = setInterval(updateRoundCountdown, 1000);
    }
  } else {
    roundCountdownLabel = '';
    roundRemainingMs = 0;
    if (countdownTimer) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
  }

  const isFacilitator = () => currentParticipant?.role === 'facilitator' || activeRole === 'facilitator';

  function ensureProfile() {
    if (!browser) return;
    const stored = getParticipantProfile(sessionCode);
    if (!stored) {
      goto(`/join?code=${sessionCode}`);
      return;
    }
    currentParticipant = {
      ...stored,
      sessionCode: stored.sessionCode ?? sessionCode
    };
    currentUser.set(currentParticipant);
    storeParticipantProfile(sessionCode, currentParticipant);
  }

  const templateQuery = `*[_type == "workshopTemplate" && slug.current == $slug][0]{
    title,
    sections{
      breakout{
        rounds[]{
          key,
          name,
          minutes,
          questions
        }
      }
    }
  }` as const;

  async function loadTemplateBlueprint(slug: string) {
    if (!browser || !slug) return;
    templateLoading = true;
    templateError = '';
    try {
      const blueprint = await sanityClient.fetch(templateQuery, { slug });
      templateRounds = blueprint?.sections?.breakout?.rounds ?? [];
      templateTitle = blueprint?.title ?? '';
    } catch (error) {
      console.error('Failed to load template', error);
      templateError = 'Unable to load template details right now.';
      templateRounds = [];
    } finally {
      templateLoading = false;
    }
  }

  function updateRoundCountdown() {
    if (!browser || !sessionInfo?.round_expires_at) {
      roundCountdownLabel = '';
      roundRemainingMs = 0;
      return;
    }
    const diff = new Date(sessionInfo.round_expires_at).getTime() - Date.now();
    roundRemainingMs = Math.max(0, diff);
    const minutes = Math.floor(roundRemainingMs / 60000);
    const seconds = Math.floor((roundRemainingMs % 60000) / 1000);
    roundCountdownLabel = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    if (roundRemainingMs <= 0 && countdownTimer) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
  }

  async function changeStatus(nextStatus: SessionStatus) {
    if (!sessionCode || sessionInfo?.status === nextStatus) return;
    statusUpdating = true;
    try {
      const res = await fetch('/api/session/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: sessionCode, status: nextStatus })
      });
      const payload = await res.json();
      if (!payload.success) {
        throw new Error(payload.error ?? 'Unable to update session status.');
      }
      await refreshSession(sessionCode);
    } catch (error) {
      console.error('Failed to update session status', error);
      alert((error as Error).message ?? 'Failed to update session status.');
    } finally {
      statusUpdating = false;
    }
  }

  async function startRoundTimer(roundName: string, minutes: number | null) {
    if (!sessionCode) return;
    roundUpdating = true;
    try {
      const body: Record<string, unknown> = {
        code: sessionCode,
        action: 'start',
        roundName
      };
      const duration = minutes && minutes > 0 ? Math.round(minutes) : null;
      if (duration) {
        body.durationMinutes = duration;
      }
      const res = await fetch('/api/session/round', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const payload = await res.json();
      if (!payload.success) {
        throw new Error(payload.error ?? 'Unable to start breakout round.');
      }
      await refreshSession(sessionCode);
    } catch (error) {
      console.error('Failed to start breakout round', error);
      alert((error as Error).message ?? 'Failed to start breakout round.');
    } finally {
      roundUpdating = false;
    }
  }

  async function clearActiveRound() {
    if (!sessionCode) return;
    roundUpdating = true;
    try {
      const res = await fetch('/api/session/round', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: sessionCode, action: 'clear' })
      });
      const payload = await res.json();
      if (!payload.success) {
        throw new Error(payload.error ?? 'Unable to end the current round.');
      }
      await refreshSession(sessionCode);
    } catch (error) {
      console.error('Failed to end breakout round', error);
      alert((error as Error).message ?? 'Failed to end the current round.');
    } finally {
      roundUpdating = false;
    }
  }

  async function startTemplateRound(round: TemplateRound) {
    const label = round.name ?? round.key ?? 'Breakout';
    const minutes = round.minutes ?? null;
    await startRoundTimer(label, minutes);
  }

  async function startCustomRound() {
    const minutes = Number(customMinutes);
    if (!minutes || minutes <= 0) {
      alert('Enter a duration in minutes greater than zero.');
      return;
    }
    const label = customLabel.trim() || 'Custom Breakout';
    await startRoundTimer(label, minutes);
  }

  let qrSrc = '';

  onMount(async () => {
    ensureProfile();
    await startRealtimeSession(sessionCode);
    if (browser) {
      const base = window.location.origin;
      qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${base}/join?code=${sessionCode}`)}`;
      if (currentParticipant) {
        storeParticipantProfile(sessionCode, {
          ...currentParticipant,
          sessionCode
        });
      }

      // Add keyboard shortcut for emergency exit (Ctrl/Cmd + Shift + E)
      function handleKeydown(event: KeyboardEvent) {
        if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'E') {
          event.preventDefault();
          leaveSession();
        }
      }

      document.addEventListener('keydown', handleKeydown);

      return () => {
        document.removeEventListener('keydown', handleKeydown);
      };
    }
  });

  onDestroy(() => {
    stopRealtimeSession();
    if (countdownTimer) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
  });

  async function submitResponse() {
    if (!selectedQuestionId || !responseText.trim()) return;
    await apiAddResponse(sessionCode, {
      questionId: selectedQuestionId,
      participantId: currentParticipant?.id ?? null,
      text: responseText.trim(),
      cards: linkedCardsText
        .split(',')
        .map((card) => card.trim())
        .filter(Boolean)
    });
    responseModalOpen = false;
    responseText = '';
    linkedCardsText = '';
    selectedQuestionId = null;
  }

  async function toggleVote(responseId: string) {
    await apiVoteResponse(responseId, 1);
  }

  async function submitTimelineItem() {
    if (!timelineText.trim()) return;
    await apiAddTimelineEntry(sessionCode, {
      label: timelineLabel,
      itemText: timelineText.trim(),
      owner: timelineOwner.trim() || undefined,
      metric: timelineMetric.trim() || undefined,
      riskNote: timelineRisk.trim() || undefined
    });
    timelineModalOpen = false;
    timelineLabel = 'Now';
    timelineText = '';
    timelineOwner = '';
    timelineMetric = '';
    timelineRisk = '';
  }

  async function submitChatMessage() {
    if (!chatMessage.trim()) return;
    await apiSendChatMessage(sessionCode, {
      participantId: currentParticipant?.id ?? null,
      message: chatMessage.trim()
    });
    chatMessage = '';
  }

  function openResponseModal(questionId: string | null) {
    selectedQuestionId = questionId;
    responseModalOpen = true;
  }

  function exportSession() {
    window.open(`/api/export/${sessionCode}`, '_blank');
  }

  function leaveSession() {
    if (confirm('Are you sure you want to leave this session?')) {
      // Clear session data
      if (browser) {
        clearParticipantProfile(sessionCode);
        currentUser.set(null);
      }
      stopRealtimeSession();
      goto('/');
    }
  }
</script>

{#if sessionInfo}
  <div class="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-cyan-900 text-slate-100">
    <header class="sticky top-0 z-40 border-b border-cyan-400/20 bg-slate-900/70 backdrop-blur">
      <div class="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div>
          <p class="text-xs uppercase tracking-[0.35em] text-cyan-300">Inclusive Planning Session</p>
          <h1 class="text-2xl font-semibold text-white">
            {sessionInfo.title ?? 'Untitled Session'}
            <span class="ml-2 rounded-full border border-cyan-400/30 px-3 py-1 text-xs uppercase tracking-[0.2em] text-cyan-200">
              {sessionCode}
            </span>
          </h1>
          {#if sessionInfo.challenge}
            <p class="mt-2 text-sm text-cyan-200 max-w-2xl">
              Focus: {sessionInfo.challenge}
            </p>
          {/if}
          <p class="mt-1 text-sm text-slate-300">
            {#if isFacilitator()}
              Facilitator console · Sequence activities, capture insights, and steward alignment.
            {:else}
              Participant area · Share perspectives, upvote priorities, and follow the session flow.
            {/if}
          </p>
        </div>
        <div class="flex items-center gap-6">
          <div class="flex items-center gap-2 text-sm text-slate-300">
            <IconUsers class="h-5 w-5" />
            <span>{participantsList.length} joined</span>
          </div>
          <div class="flex items-center gap-3">
            <button
              class="hidden sm:flex items-center gap-2 rounded-lg border border-slate-600 px-4 py-2 text-sm hover:border-cyan-400/60 hover:text-cyan-200 transition-colors"
              on:click={() => goto('/facilitator')}
            >
              <IconHome class="h-4 w-4" />Facilitator Console
            </button>
            <button
              class="hidden sm:flex items-center gap-2 rounded-lg border border-slate-600 px-4 py-2 text-sm hover:border-cyan-400/60 hover:text-cyan-200 transition-colors"
              on:click={() => window.open(`/presentation?code=${sessionCode}`, '_blank')}
            >
              <IconChartBubble class="h-4 w-4" />Presentation View
            </button>
            {#if isFacilitator()}
              <button
                class="hidden sm:flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium hover:bg-purple-500 transition-colors"
                on:click={exportSession}
              >
                <IconDownload class="h-4 w-4" /> Export
              </button>
            {/if}
            <button
              class="flex items-center gap-2 rounded-lg bg-red-600/80 px-4 py-2 text-sm font-medium hover:bg-red-500 transition-colors"
              on:click={leaveSession}
              title="Leave session and return to home (Ctrl+Shift+E)"
            >
              <IconHome class="h-4 w-4" />
              <span class="hidden sm:inline">Leave Session</span>
            </button>
          </div>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-7xl px-6 py-8 space-y-10">
      {#if isFacilitator()}
        <section class="rounded-2xl border border-cyan-400/30 bg-slate-900/70 p-6 space-y-6">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 class="text-lg font-semibold text-white">Session Controls</h2>
              <p class="text-sm text-slate-400">Manage session flow, breakout timers, and wrap-up state.</p>
              {#if templateTitle}
                <p class="mt-1 text-xs text-slate-500">Template: {templateTitle}</p>
              {/if}
            </div>
            <div class="flex flex-wrap items-center gap-2">
              {#each sessionStatuses as status}
                <button
                  class={`rounded-lg px-3 py-2 text-sm font-medium transition ${sessionInfo?.status === status ? 'bg-cyan-500 text-slate-900 shadow' : 'border border-cyan-400/40 text-cyan-200 hover:border-cyan-300'}`}
                  on:click={() => changeStatus(status)}
                  disabled={statusUpdating || sessionInfo?.status === status}
                >
                  {statusLabels[status]}
                </button>
              {/each}
              <button
                class="rounded-lg bg-red-600/80 px-3 py-2 text-sm font-semibold text-white hover:bg-red-500 transition"
                on:click={() => changeStatus('done')}
                disabled={statusUpdating || sessionInfo?.status === 'done'}
              >
                End Session
              </button>
            </div>
          </div>

          <div class="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
            <div class="rounded-xl border border-cyan-400/20 bg-slate-900/60 p-4 space-y-4">
              <div class="flex items-center justify-between">
                <h3 class="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">Breakout Rounds</h3>
                {#if sessionInfo?.active_round}
                  <button
                    class="text-xs rounded-lg border border-cyan-400/40 px-3 py-1 text-cyan-200 hover:border-cyan-300 transition"
                    on:click={clearActiveRound}
                    disabled={roundUpdating}
                  >
                    End current round
                  </button>
                {/if}
              </div>
              {#if sessionInfo?.active_round}
                <div class="rounded-lg border border-cyan-400/30 bg-cyan-400/10 p-3">
                  <p class="text-xs uppercase tracking-[0.3em] text-cyan-200">Active Round</p>
                  <p class="mt-2 text-sm font-semibold text-slate-100">{sessionInfo.active_round}</p>
                  {#if roundCountdownLabel}
                    <p class="mt-1 text-xs text-cyan-100/80">Time remaining: {roundCountdownLabel}</p>
                  {/if}
                </div>
              {:else}
                <p class="text-sm text-slate-400">No active breakout round.</p>
              {/if}
              <div class="max-h-48 space-y-2 overflow-y-auto pr-1">
                {#if templateLoading}
                  <p class="text-sm text-slate-400">Loading template rounds…</p>
                {:else if templateError}
                  <p class="text-sm text-rose-300">{templateError}</p>
                {:else if templateRounds.length}
                  {#each templateRounds as round}
                    <button
                      class="w-full rounded-lg border border-cyan-400/30 px-3 py-2 text-left text-sm text-cyan-100 hover:border-cyan-300 transition"
                      on:click={() => startTemplateRound(round)}
                      disabled={roundUpdating || sessionInfo?.active_round === (round.name ?? round.key)}
                    >
                      <span class="font-semibold text-slate-100">{round.name ?? round.key ?? 'Round'}</span>
                      <span class="ml-2 text-xs text-cyan-200">{round.minutes ?? '?'} min</span>
                    </button>
                  {/each}
                {:else}
                  <p class="text-sm text-slate-400">This template does not define breakout rounds.</p>
                {/if}
              </div>
            </div>

            <div class="rounded-xl border border-purple-400/20 bg-slate-900/60 p-4 space-y-3">
              <h3 class="text-sm font-semibold uppercase tracking-[0.2em] text-purple-200">Custom Timer</h3>
              <label class="flex flex-col gap-2 text-xs text-slate-300">
                Label
                <input
                  class="rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-white focus:border-purple-400 focus:outline-none"
                  placeholder="e.g., Reflection Sprint"
                  bind:value={customLabel}
                />
              </label>
              <label class="flex flex-col gap-2 text-xs text-slate-300">
                Minutes
                <input
                  class="rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-white focus:border-purple-400 focus:outline-none"
                  type="number"
                  min="1"
                  step="1"
                  bind:value={customMinutes}
                  on:input={(event) => (customMinutes = Number(event.currentTarget.value) || 0)}
                />
              </label>
              <button
                class="w-full rounded-lg bg-gradient-to-r from-purple-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-white hover:from-purple-400 hover:to-cyan-400 transition"
                on:click={startCustomRound}
                disabled={roundUpdating}
              >
                Start Custom Timer
              </button>
            </div>
          </div>
        </section>
      {/if}

      <section class="grid gap-6 md:grid-cols-3">
        {#if sessionInfo.challenge}
          <div class="md:col-span-3 rounded-xl border border-cyan-400/30 bg-cyan-400/10 p-4">
            <p class="text-xs uppercase tracking-[0.3em] text-cyan-100">Challenge Focus</p>
            <p class="mt-2 text-base font-semibold text-slate-100">
              {sessionInfo.challenge}
            </p>
            <p class="mt-1 text-xs text-cyan-100/80">
              Ground your ideas in this shared challenge as you move through the session.
            </p>
          </div>
        {/if}
        {#if sessionInfo.active_round}
          <div class="md:col-span-3 rounded-xl border border-purple-400/30 bg-purple-500/10 p-4">
            <p class="text-xs uppercase tracking-[0.3em] text-purple-200">Active Round</p>
            <div class="mt-2 flex flex-wrap items-center gap-3">
              <span class="text-sm font-semibold text-white">{sessionInfo.active_round}</span>
              {#if roundCountdownLabel}
                <span class="rounded-full border border-purple-300/40 px-3 py-1 text-xs text-purple-100">
                  Time remaining: {roundCountdownLabel}
                </span>
              {/if}
            </div>
            <p class="mt-1 text-xs text-purple-100/80">Stay with the prompt until the facilitator advances the agenda.</p>
          </div>
        {/if}
        <div class="rounded-xl border border-slate-700 bg-slate-900/70 p-4">
          <p class="text-xs uppercase tracking-[0.3em] text-slate-400">Current Step</p>
          <p class="mt-2 text-lg font-semibold text-white">{sessionInfo.status ?? 'planned'}</p>
          <p class="text-sm text-slate-400 mt-1">The facilitator will cue the next collaborative activity for the group.</p>
        </div>
        <div class="rounded-xl border border-slate-700 bg-slate-900/70 p-4">
          <p class="text-xs uppercase tracking-[0.3em] text-slate-400">Active Questions</p>
          <p class="mt-2 text-lg font-semibold text-white">{questionsList.length}</p>
          <p class="text-sm text-slate-400 mt-1">Reflect across the lenses defined in your session blueprint.</p>
        </div>
        <div class="rounded-xl border border-slate-700 bg-slate-900/70 p-4">
          <p class="text-xs uppercase tracking-[0.3em] text-slate-400">Ideas Shared</p>
          <p class="mt-2 text-lg font-semibold text-white">{responsesList.length}</p>
          <p class="text-sm text-slate-400 mt-1">Vote on responses that advance equity-centered planning.</p>
        </div>
      </section>

      <section class="rounded-2xl border border-slate-700 bg-slate-900/70 p-6">
        <nav class="flex flex-wrap gap-3">
          <button
            class={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors ${activeTab === 'overview' ? 'bg-cyan-500 text-slate-900 font-semibold' : 'border border-slate-700 text-slate-300 hover:border-cyan-400/40 hover:text-cyan-200'}`}
            on:click={() => (activeTab = 'overview')}
          >
            <IconChartBubble class="h-4 w-4" />
            Quad Bubble
          </button>
          <button
            class={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors ${activeTab === 'heatmap' ? 'bg-cyan-500 text-slate-900 font-semibold' : 'border border-slate-700 text-slate-300 hover:border-cyan-400/40 hover:text-cyan-200'}`}
            on:click={() => (activeTab = 'heatmap')}
          >
            <IconGridDots class="h-4 w-4" />
            Heatmap
          </button>
          <button
            class={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors ${activeTab === 'roadmap' ? 'bg-cyan-500 text-slate-900 font-semibold' : 'border border-slate-700 text-slate-300 hover:border-cyan-400/40 hover:text-cyan-200'}`}
            on:click={() => (activeTab = 'roadmap')}
          >
            <IconMap class="h-4 w-4" />
            Roadmap
          </button>
          <button
            class={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors ${activeTab === 'timeline' ? 'bg-cyan-500 text-slate-900 font-semibold' : 'border border-slate-700 text-slate-300 hover:border-cyan-400/40 hover:text-cyan-200'}`}
            on:click={() => (activeTab = 'timeline')}
          >
            <IconFlame class="h-4 w-4" />
            Timeline
          </button>
          <button
            class={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors ${activeTab === 'chat' ? 'bg-cyan-500 text-slate-900 font-semibold' : 'border border-slate-700 text-slate-300 hover:border-cyan-400/40 hover:text-cyan-200'}`}
            on:click={() => (activeTab = 'chat')}
          >
            <IconMessage class="h-4 w-4" />
            Arcade Chat
          </button>
        </nav>

        <div class="mt-6 rounded-xl border border-slate-700 bg-slate-900/80 p-4">
          {#if activeTab === 'overview'}
            <QuadBubbleChart responses={responsesForViz} width={900} height={520} />
          {:else if activeTab === 'heatmap'}
            <HeatmapChart responses={responsesForViz} width={900} height={520} />
          {:else if activeTab === 'roadmap'}
            <RoadmapChart responses={responsesForViz} width={900} height={520} />
          {:else if activeTab === 'timeline'}
            <div class="space-y-4">
              {#each timelineList as item}
                <div class="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
                  <div class="flex items-center justify-between">
                    <span class="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 px-3 py-1 text-xs uppercase tracking-[0.2em] text-cyan-200">{item.label}</span>
                    <span class="text-xs text-slate-400">{item.created_at}</span>
                  </div>
                  <p class="mt-3 text-sm text-slate-200">{item.item_text}</p>
                  <div class="mt-2 text-xs text-slate-400 flex flex-wrap gap-4">
                    {#if item.owner}<span>Owner: {item.owner}</span>{/if}
                    {#if item.metric}<span>Metric: {item.metric}</span>{/if}
                    {#if item.risk_note}<span>Risk: {item.risk_note}</span>{/if}
                  </div>
                </div>
              {/each}
              {#if isFacilitator()}
                <button
                  class="mt-2 inline-flex items-center gap-2 rounded-lg border border-cyan-400/40 px-4 py-2 text-sm text-cyan-200 hover:border-cyan-300 transition-colors"
                  on:click={() => (timelineModalOpen = true)}
                >
                  <IconPlus class="h-4 w-4" />
                  Add timeline item
                </button>
              {/if}
            </div>
          {:else if activeTab === 'chat'}
            <div class="flex flex-col gap-4">
              <div class="max-h-80 space-y-3 overflow-y-auto pr-2">
                {#each chatList as entry}
                  <div class="rounded-lg border border-slate-700 bg-slate-900/60 p-3">
                    <div class="flex items-center justify-between text-xs text-slate-400">
                      <span>{participantsList.find((p) => p.id === entry.participant_id)?.name ?? 'Anonymous'}</span>
                      <span>{entry.created_at}</span>
                    </div>
                    <p class="mt-2 text-sm text-slate-200">{entry.message}</p>
                  </div>
                {/each}
              </div>
              <form
                class="flex gap-3"
                on:submit|preventDefault={submitChatMessage}
              >
                <input
                  class="flex-1 rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                  placeholder="Share a quick note for the room"
                  bind:value={chatMessage}
                />
                <button
                  type="submit"
                  class="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-cyan-400 transition-colors"
                >
                  <IconSend class="h-4 w-4" />
                  Send
                </button>
              </form>
            </div>
          {/if}
        </div>
      </section>

      <section class="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <div class="rounded-2xl border border-slate-700 bg-slate-900/70 p-6 space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg font-semibold text-white">Questions & Responses</h2>
              <p class="text-sm text-slate-400">Select a prompt and share your perspective.</p>
            </div>
            <button
              class="flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 px-4 py-2 text-sm font-medium text-white hover:from-cyan-400 hover:to-purple-500 transition-colors"
              on:click={() => openResponseModal(null)}
            >
              <IconPlus class="h-4 w-4" /> Respond
            </button>
          </div>

          <div class="space-y-6">
            {#each questionsList as question}
              <article class="rounded-xl border border-slate-700 bg-slate-900/60 p-4 space-y-3">
                <header class="flex items-center justify-between">
                  <div>
                    <p class="text-xs uppercase tracking-[0.3em] text-cyan-200">{question.section}</p>
                    <h3 class="text-sm font-semibold text-white mt-1">{question.text}</h3>
                  </div>
                  <button
                    class="rounded-lg border border-cyan-400/40 px-3 py-1 text-xs text-cyan-200 hover:border-cyan-300 transition-colors"
                    on:click={() => openResponseModal(question.id)}
                  >
                    Share response
                  </button>
                </header>
                <div class="space-y-3">
                  {#each responsesList.filter((r) => r.question_id === question.id) as response}
                    <div class="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
                      <div class="flex items-center justify-between text-xs text-slate-400">
                        <span>{participantsList.find((p) => p.id === response.participant_id)?.name ?? 'Anonymous'}</span>
                        <span>{response.created_at}</span>
                      </div>
                      <p class="mt-2 text-sm text-slate-200">{response.text}</p>
                      {#if response.cards?.length}
                        <div class="mt-2 flex flex-wrap gap-2 text-xs text-cyan-200">
                          {#each response.cards as card}
                            <span class="rounded-full border border-cyan-400/40 px-2 py-1">{card}</span>
                          {/each}
                        </div>
                      {/if}
                      <div class="mt-3 flex items-center gap-3 text-xs text-slate-400">
                        <button
                          class="inline-flex items-center gap-1 rounded border border-cyan-400/40 px-2 py-1 text-cyan-200 hover:border-cyan-300 transition-colors"
                          on:click={() => toggleVote(response.id)}
                        >
                          <IconThumbUp class="h-4 w-4" />
                          {response.votes ?? 0}
                        </button>
                      </div>
                    </div>
                  {/each}
                </div>
              </article>
            {/each}
          </div>
        </div>

        <aside class="space-y-6">
          <div class="rounded-2xl border border-slate-700 bg-slate-900/70 p-6">
            <h2 class="text-lg font-semibold text-white">Leaderboard</h2>
            <p class="text-sm text-slate-400">Points reflect contributions, votes earned, and justice prompts.</p>
            <ul class="mt-4 space-y-3">
              {#each leaderboardList as player, index}
                <li class="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2">
                  <div class="flex items-center gap-3">
                    <span class="text-xs text-slate-400">#{index + 1}</span>
                    <span class="h-8 w-8 rounded-full border border-slate-600 flex items-center justify-center font-semibold" style={`background:${player.color}`}>{player.name?.charAt(0)?.toUpperCase() ?? '?'}</span>
                    <div>
                      <p class="text-sm text-white">{player.name}</p>
                      <p class="text-xs text-slate-400">{player.badges?.length ?? 0} badges</p>
                    </div>
                  </div>
                  <span class="font-mono text-cyan-200">{player.points ?? 0} pts</span>
                </li>
              {/each}
            </ul>
          </div>

          <div class="rounded-2xl border border-slate-700 bg-slate-900/70 p-6">
            <h2 class="text-lg font-semibold text-white">QR Code</h2>
            <p class="text-sm text-slate-400">New participants can scan to join instantly.</p>
            <div class="mt-4 flex justify-center">
              {#if qrSrc}
                <img
                  class="h-40 w-40 rounded-lg border border-slate-700 bg-white p-2"
                  alt="Join session QR code"
                  src={qrSrc}
                />
              {/if}
            </div>
            <p class="mt-3 text-center text-xs text-slate-500">/join?code={sessionCode}</p>
          </div>
        </aside>
      </section>
    </main>
  </div>
{:else}
  <div class="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-cyan-900 flex items-center justify-center">
    <div class="rounded-2xl border border-slate-700 bg-slate-900/80 px-6 py-10 text-center">
      <p class="text-sm text-slate-300">Loading session…</p>
    </div>
  </div>
{/if}

{#if responseModalOpen}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur">
    <div class="w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900/90 p-6">
      <h2 class="text-lg font-semibold text-white">Share your response</h2>
      <p class="mt-1 text-sm text-slate-400">Link cards (comma separated) to earn bonus points.</p>
      <div class="mt-4 space-y-4">
        <label class="flex flex-col gap-2 text-sm text-slate-300">
          Prompt
          <select
            class="rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-white focus:border-cyan-400 focus:outline-none"
            bind:value={selectedQuestionId}
          >
            <option value={null}>Select a question…</option>
            {#each questionsList as question}
              <option value={question.id}>{question.section}: {question.text}</option>
            {/each}
          </select>
        </label>
        <label class="flex flex-col gap-2 text-sm text-slate-300">
          Your idea or insight
          <textarea
            class="min-h-[120px] rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
            placeholder="Describe your thought, story, or challenge…"
            bind:value={responseText}
          />
        </label>
        <label class="flex flex-col gap-2 text-sm text-slate-300">
          Link cards
          <input
            class="rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
            placeholder="e.g., justice, power, empathy"
            bind:value={linkedCardsText}
          />
        </label>
      </div>
      <div class="mt-6 flex items-center justify-end gap-3">
        <button
          class="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-slate-500"
          on:click={() => (responseModalOpen = false)}
        >
          Cancel
        </button>
        <button
          class="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-cyan-400"
          on:click={submitResponse}
        >
          Share idea
        </button>
      </div>
    </div>
  </div>
{/if}

{#if timelineModalOpen}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur">
    <div class="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900/90 p-6">
      <h2 class="text-lg font-semibold text-white">Add roadmap entry</h2>
      <div class="mt-4 space-y-4">
        <label class="flex flex-col gap-2 text-sm text-slate-300">
          Phase
          <select
            class="rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-white focus:border-cyan-400 focus:outline-none"
            bind:value={timelineLabel}
          >
            <option value="Now">Now</option>
            <option value="Next">Next</option>
            <option value="Later">Later</option>
          </select>
        </label>
        <label class="flex flex-col gap-2 text-sm text-slate-300">
          Item description
          <textarea
            class="min-h-[100px] rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
            placeholder="What should we take forward?"
            bind:value={timelineText}
          />
        </label>
        <div class="grid gap-3 md:grid-cols-2">
          <label class="flex flex-col gap-2 text-sm text-slate-300">
            Owner
            <input
              class="rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
              placeholder="Optional"
              bind:value={timelineOwner}
            />
          </label>
          <label class="flex flex-col gap-2 text-sm text-slate-300">
            Metric
            <input
              class="rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
              placeholder="Optional"
              bind:value={timelineMetric}
            />
          </label>
        </div>
        <label class="flex flex-col gap-2 text-sm text-slate-300">
          Risk note
          <input
            class="rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
            placeholder="Optional"
            bind:value={timelineRisk}
          />
        </label>
      </div>
      <div class="mt-6 flex items-center justify-end gap-3">
        <button
          class="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-slate-500"
          on:click={() => (timelineModalOpen = false)}
        >
          Cancel
        </button>
        <button
          class="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-cyan-400"
          on:click={submitTimelineItem}
        >
          Add to roadmap
        </button>
      </div>
    </div>
  </div>
{/if}
