<script lang="ts">
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  import { IconUserPlus as UserPlus, IconPalette as Palette, IconArrowLeft as ArrowLeft } from '@tabler/icons-svelte';
  import { currentUser } from '$lib/stores/user';

  export let data: { code: string };

  let participantName = '';
  let sessionCode = '';
  let selectedColor = '#00ffff'; // Default to neon cyan
  let loading = false;

  const avatarColors = [
    { name: 'Neon Cyan', value: '#00ffff' },
    { name: 'Neon Pink', value: '#ff00ff' },
    { name: 'Neon Lime', value: '#39ff14' },
    { name: 'Electric Blue', value: '#0080ff' },
    { name: 'Hot Pink', value: '#ff1493' },
    { name: 'Lime Green', value: '#32cd32' },
    { name: 'Orange Red', value: '#ff4500' },
    { name: 'Purple', value: '#8a2be2' },
    { name: 'Gold', value: '#ffd700' },
    { name: 'Spring Green', value: '#00ff7f' }
  ];

  onMount(() => {
    if (data.code) {
      sessionCode = data.code.toUpperCase();
    }
  });

  function goHome() {
    goto('/');
  }

  async function joinSession() {
    if (!participantName || !sessionCode) {
      alert('Please enter your name and session code');
      return;
    }

    loading = true;
    try {
      const response = await fetch('/api/participants/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: sessionCode.toUpperCase(),
          name: participantName,
          role: 'participant',
          color: selectedColor
        })
      });

      const data = await response.json();
      if (data.success) {
        if (browser && data.participant) {
          const code = sessionCode.toUpperCase();
          const profile = {
            participantId: data.participant.id as string,
            sessionCode: code,
            name: participantName,
            role: 'participant' as const,
            color: selectedColor
          };
          currentUser.set(profile);
          const serialized = JSON.stringify(profile);
          document.cookie = `cda-session=${encodeURIComponent(serialized)}; path=/; SameSite=Lax`;
          sessionStorage.setItem('cda-session', serialized);
        }

        goto(`/session/${sessionCode.toUpperCase()}`);
      } else {
        alert(data.error || 'Failed to join session');
      }
    } catch (error) {
      console.error('Error joining session:', error);
      alert('Failed to join session. Please try again.');
    } finally {
      loading = false;
    }
  }
</script>

<div class="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-cyan-900 flex items-center justify-center p-6">
  <div class="w-full max-w-md">
    <!-- Back Navigation -->
    <button
      on:click={goHome}
      class="mb-4 flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
    >
      <ArrowLeft class="w-4 h-4" />
      Back to Home
    </button>

    <div class="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-cyan-400/20 shadow-2xl">
      <header class="text-center mb-8">
        <div class="w-16 h-16 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full flex items-center justify-center mx-auto mb-4">
          <UserPlus class="w-8 h-8 text-white" />
        </div>
        <h1 class="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-2">
          Join Workshop
        </h1>
        <p class="text-slate-300">
          Enter your details to join the session
        </p>
      </header>

      <form on:submit|preventDefault={joinSession} class="space-y-6">
        <div>
          <label for="participantName" class="block text-sm font-medium text-slate-300 mb-2">
            Your Name
          </label>
          <input
            id="participantName"
            type="text"
            bind:value={participantName}
            placeholder="Enter your name"
            class="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all"
            required
          />
        </div>

        <div>
          <label for="sessionCode" class="block text-sm font-medium text-slate-300 mb-2">
            Session Code
          </label>
          <input
            id="sessionCode"
            type="text"
            bind:value={sessionCode}
            placeholder="Enter 6-character code"
            class="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent font-mono text-lg tracking-wider uppercase transition-all"
            maxlength="6"
            required
          />
        </div>

        <div role="group" aria-labelledby="avatar-color-label">
          <p id="avatar-color-label" class="mb-3 flex items-center gap-2 text-sm font-medium text-slate-300">
            <Palette class="w-4 h-4" />
            Choose Your Avatar Color
          </p>
          <div class="grid grid-cols-5 gap-3">
            {#each avatarColors as color}
              <button
                type="button"
                on:click={() => selectedColor = color.value}
                class="w-12 h-12 rounded-full border-2 transition-all hover:scale-110 {selectedColor === color.value ? 'border-white ring-2 ring-cyan-400' : 'border-slate-600'}"
                style="background-color: {color.value}"
                title={color.name}
              >
                {#if selectedColor === color.value}
                  <div class="w-full h-full rounded-full flex items-center justify-center">
                    <div class="w-3 h-3 bg-white rounded-full"></div>
                  </div>
                {/if}
              </button>
            {/each}
          </div>
          <p class="text-xs text-slate-400 mt-2 text-center">
            Selected: {avatarColors.find(c => c.value === selectedColor)?.name}
          </p>
        </div>

        <div class="pt-4">
          <button
            type="submit"
            disabled={loading}
            class="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            {#if loading}
              <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Joining...
            {:else}
              <UserPlus class="w-5 h-5" />
              Join Session
            {/if}
          </button>
        </div>
      </form>

      <div class="mt-8 pt-6 border-t border-slate-700">
        <p class="text-xs text-slate-400 text-center">
          Don't have a session code? Contact your workshop facilitator.
        </p>
      </div>
    </div>

    <!-- Preview Avatar -->
    <div class="mt-6 bg-slate-800/30 backdrop-blur-sm rounded-xl p-4 border border-slate-600">
      <p class="text-sm text-slate-300 text-center mb-3">Preview:</p>
      <div class="flex items-center justify-center gap-3">
        <div
          class="w-10 h-10 rounded-full border-2 border-white/20 flex items-center justify-center text-white font-semibold text-sm"
          style="background-color: {selectedColor}"
        >
          {participantName ? participantName.charAt(0).toUpperCase() : '?'}
        </div>
        <span class="text-white font-medium">
          {participantName || 'Your Name'}
        </span>
      </div>
    </div>
  </div>
</div>
