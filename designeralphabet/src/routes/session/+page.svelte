<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { get, writable } from 'svelte/store';
  import { IconUsers, IconPresentationAnalytics, IconSparkles } from '@tabler/icons-svelte';

  // Store for session info
  const sessionInfo = writable<{ code: string } | null>(null);

  // Check for session persistence and auto-redirect
  onMount(() => {
    let sessionData: string | null = null;
    if (typeof sessionStorage !== 'undefined') {
      sessionData = sessionStorage.getItem('critical-alphabet:session');
    }
    if (!sessionData && typeof document !== 'undefined') {
      const match = document.cookie.match(/critical-alphabet:session=([^;]+)/);
      if (match) sessionData = decodeURIComponent(match[1]);
    }
    if (sessionData) {
      try {
        const session = JSON.parse(sessionData);
        if (session && session.code) {
          sessionInfo.set({ code: session.code });
          // If not already on the session page, redirect
          if (!window.location.pathname.startsWith(`/session/${session.code}`)) {
            goto(`/session/${session.code}`);
          }
        }
      } catch (e) {
        sessionInfo.set(null);
      }
    } else {
      sessionInfo.set(null);
    }
  });

  function leaveSession() {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('critical-alphabet:session');
    }
    if (typeof document !== 'undefined') {
      document.cookie = 'critical-alphabet:session=; Max-Age=0; path=/';
    }
    sessionInfo.set(null);
    // Optionally, reload or redirect to clear state
    goto('/session');
  }

  function openFacilitator() {
    goto('/facilitator');
  }

  function openJoin() {
    goto('/join');
  }

  function openPresentation() {
    const info = get(sessionInfo);
    if (info?.code) {
      if (typeof window !== 'undefined') {
        window.open(`/presentation?code=${info.code}`, '_blank');
      }
    } else {
      goto('/facilitator');
    }
  }
</script>

{#if $sessionInfo}
  <div class="fixed top-0 left-0 right-0 z-50 flex items-center justify-between bg-cyan-900/90 px-4 py-2 text-white shadow">
    <div class="flex items-center gap-2">
      <span class="inline-block h-3 w-3 rounded-full bg-emerald-400 animate-pulse"></span>
      <span class="font-semibold">Session Active:</span>
      <span class="ml-1 font-mono text-cyan-200">{$sessionInfo.code}</span>
    </div>
    <button class="rounded-full border border-white/20 bg-cyan-800/60 px-4 py-1 text-xs uppercase tracking-wider text-white hover:bg-cyan-700 transition" on:click={leaveSession}>
      Leave Session
    </button>
  </div>
{/if}

<div class="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-cyan-900 flex items-center justify-center p-6">
  <div class="max-w-4xl w-full space-y-10 text-center">
    <div class="space-y-4">
      <h1 class="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
        Live Workshop Arcade
      </h1>
      <p class="text-lg text-slate-300">
        Choose how you want to join the Critical Designer Alphabet experience. Facilitators launch sessions,
        participants jump straight into collaborative play, and the presentation view keeps the whole room in sync.
      </p>
    </div>

    <div class="grid gap-6 md:grid-cols-3">
      <button
        class="group flex flex-col items-center gap-3 rounded-2xl border border-cyan-400/30 bg-slate-900/70 px-6 py-8 text-left text-slate-200 transition hover:border-cyan-300 hover:text-white"
        on:click={openFacilitator}
      >
        <IconSparkles class="h-10 w-10 text-cyan-300" />
        <h2 class="text-lg font-semibold">Facilitator Console</h2>
        <p class="text-sm text-slate-400 group-hover:text-slate-200">
          Create a session, pick templates, and drive the justice-centered agenda.
        </p>
      </button>

      <button
        class="group flex flex-col items-center gap-3 rounded-2xl border border-purple-400/30 bg-slate-900/70 px-6 py-8 text-left text-slate-200 transition hover:border-purple-300 hover:text-white"
        on:click={openPresentation}
      >
        <IconPresentationAnalytics class="h-10 w-10 text-purple-300" />
        <h2 class="text-lg font-semibold">Presentation View</h2>
        <p class="text-sm text-slate-400 group-hover:text-slate-200">
          Broadcast live stats, heatmaps, and QR join codes on the big screen.
        </p>
      </button>

      <button
        class="group flex flex-col items-center gap-3 rounded-2xl border border-emerald-400/30 bg-slate-900/70 px-6 py-8 text-left text-slate-200 transition hover:border-emerald-300 hover:text-white"
        on:click={openJoin}
      >
        <IconUsers class="h-10 w-10 text-emerald-300" />
        <h2 class="text-lg font-semibold">Participant Join</h2>
        <p class="text-sm text-slate-400 group-hover:text-slate-200">
          Enter a code, pick a neon avatar, and start sharing inclusive insights.
        </p>
      </button>
    </div>
  </div>
</div>
