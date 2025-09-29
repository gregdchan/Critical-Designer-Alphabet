<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import {
    sessionDetails,
    participants,
    questions,
    responses,
    timeline,
    chat,
    startRealtimeSession,
    stopRealtimeSession
  } from '$lib/realtime';
  import QuadBubbleChart from '$lib/components/charts/QuadBubbleChart.svelte';
  import HeatmapChart from '$lib/components/charts/HeatmapChart.svelte';
  import RoadmapChart from '$lib/components/charts/RoadmapChart.svelte';
  import { IconUsers, IconClock } from '@tabler/icons-svelte';

  export let data: { sessionCode: string };

  let sessionCode = data.sessionCode ?? '';
  let joinCode = sessionCode;
  let qrSrc = '';
  let activeCode = '';
  let ready = false;

  $: sessionInfo = $sessionDetails;
  $: participantsList = $participants ?? [];
  $: questionsList = $questions ?? [];
  $: responsesList = $responses ?? [];
  $: timelineList = $timeline ?? [];
  $: chatList = $chat ?? [];

  $: responsesForViz = responsesList.map((entry) => {
    const question = questionsList.find((q) => q.id === entry.question_id);
    const author = participantsList.find((p) => p.id === entry.participant_id);
    return {
      ...entry,
      lens: question?.section ?? 'Unknown',
      participantName: author?.name ?? 'Anonymous'
    };
  });

  async function loadSession(code: string) {
    if (!code) return;
    await stopRealtimeSession();
    await startRealtimeSession(code);
    activeCode = code;
    if (browser) {
      const base = window.location.origin;
      qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(`${base}/join?code=${code}`)}`;
    }
  }

  onMount(async () => {
    ready = true;
    if (sessionCode) {
      await loadSession(sessionCode);
    }
  });

  onDestroy(() => {
    stopRealtimeSession();
  });

  async function handleStartPresentation(event: Event) {
    event.preventDefault();
    if (!joinCode.trim()) return;
    sessionCode = joinCode.trim().toUpperCase();
    await loadSession(sessionCode);
  }
</script>

<div class="min-h-screen bg-slate-950 text-slate-100">
  <header class="border-b border-cyan-400/30 bg-slate-950/90 px-10 py-6">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p class="text-xs uppercase tracking-[0.4em] text-cyan-300">Workshop Broadcast</p>
        <h1 class="mt-2 text-3xl font-semibold text-white">
          {sessionInfo?.title ?? 'Presentation Dashboard'}
          {#if activeCode}
            <span class="ml-3 rounded-full border border-cyan-400/40 px-3 py-1 text-xs uppercase tracking-[0.25em] text-cyan-200">
              {activeCode}
            </span>
          {/if}
        </h1>
        <p class="mt-2 text-sm text-slate-300">Immersive view of live cards, votes, and roadmap progress for everyone in the room.</p>
      </div>
      <form class="flex flex-wrap items-center gap-3" on:submit|preventDefault={handleStartPresentation}>
        <input
          class="w-48 rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
          placeholder="Enter session code"
          bind:value={joinCode}
          maxlength="16"
        />
        <button
          type="submit"
          class="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-cyan-400 transition-colors"
        >
          {activeCode ? 'Switch session' : 'Start presentation'}
        </button>
      </form>
      <div class="flex items-center gap-6 text-sm text-slate-300">
        <span class="inline-flex items-center gap-2"><IconUsers class="h-5 w-5" /> {participantsList.length} participants</span>
        <span class="inline-flex items-center gap-2"><IconClock class="h-5 w-5" /> {sessionInfo?.status ?? 'waiting'}</span>
      </div>
    </div>
  </header>

  {#if !activeCode && ready}
    <div class="flex min-h-[60vh] items-center justify-center px-6">
      <div class="max-w-xl text-center space-y-4">
        <h2 class="text-2xl font-semibold text-white">Begin a presentation</h2>
        <p class="text-slate-400">
          Enter the session code shared by your facilitator. Once connected, the dashboard will live-stream collective
          responses, votes, and roadmap highlights.
        </p>
      </div>
    </div>
  {:else}
    <main class="grid gap-8 px-10 py-8 lg:grid-cols-[3fr_1fr]">
      <section class="space-y-8">
        <div class="rounded-2xl border border-cyan-400/20 bg-slate-900/70 p-6 shadow-[0_0_40px_rgba(6,182,212,0.2)]">
          <h2 class="text-xl font-semibold text-slate-100">Response Landscape</h2>
          <p class="text-sm text-slate-400">Bubble size reflects votes, colors represent the lens for each story.</p>
          <QuadBubbleChart responses={responsesForViz} width={900} height={540} />
        </div>

        <div class="rounded-2xl border border-purple-400/20 bg-slate-900/70 p-6 shadow-[0_0_40px_rgba(168,85,247,0.2)]">
          <h2 class="text-xl font-semibold text-slate-100">Insight Heatmap</h2>
          <p class="text-sm text-slate-400">Intensity indicates the number of responses captured across lenses and maturity levels.</p>
          <HeatmapChart responses={responsesForViz} width={900} height={480} />
        </div>

        <div class="rounded-2xl border border-emerald-400/20 bg-slate-900/70 p-6 shadow-[0_0_40px_rgba(16,185,129,0.2)]">
          <h2 class="text-xl font-semibold text-slate-100">Roadmap Swimlanes</h2>
          <p class="text-sm text-slate-400">Facilitator-curated commitments organized into Now / Next / Later horizons.</p>
          <RoadmapChart responses={responsesForViz} width={900} height={500} />
        </div>
      </section>

      <aside class="space-y-8">
        <div class="rounded-2xl border border-cyan-400/30 bg-slate-900/70 p-6">
          <h3 class="text-lg font-semibold text-white">Join the Session</h3>
          <p class="text-sm text-slate-400">Scan the QR code or visit <span class="font-mono text-cyan-200">/join</span> and enter the code.</p>
          {#if qrSrc}
            <div class="mt-6 flex justify-center">
              <img class="h-48 w-48 rounded-2xl border border-slate-700 bg-white p-3" alt="Join session QR" src={qrSrc} />
            </div>
          {/if}
          <p class="mt-3 text-center text-sm font-semibold text-cyan-200">Code: {activeCode}</p>
        </div>

        <div class="rounded-2xl border border-slate-700 bg-slate-900/70 p-6">
          <h3 class="text-lg font-semibold text-white">Timeline Highlights</h3>
          <div class="mt-4 max-h-64 space-y-3 overflow-y-auto pr-1">
            {#each timelineList.slice().reverse() as item}
              <div class="rounded-lg border border-slate-800 bg-slate-900/80 p-3">
                <div class="flex items-center justify-between text-xs text-slate-400">
                  <span>{item.label}</span>
                  <span>{item.created_at}</span>
                </div>
                <p class="mt-2 text-sm text-slate-200">{item.item_text}</p>
              </div>
            {/each}
          </div>
        </div>

        <div class="rounded-2xl border border-slate-700 bg-slate-900/70 p-6">
          <h3 class="text-lg font-semibold text-white">Arcade Chat</h3>
          <div class="mt-4 max-h-64 space-y-3 overflow-y-auto pr-1">
            {#each chatList.slice().reverse() as entry}
              <div class="rounded-lg border border-slate-800 bg-slate-900/80 p-3">
                <p class="text-xs text-slate-400">{participantsList.find((p) => p.id === entry.participant_id)?.name ?? 'Anonymous'} · {entry.created_at}</p>
                <p class="mt-1 text-sm text-slate-200">{entry.message}</p>
              </div>
            {/each}
          </div>
        </div>
      </aside>
    </main>
  {/if}
</div>
