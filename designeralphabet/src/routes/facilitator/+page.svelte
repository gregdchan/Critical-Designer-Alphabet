<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import sanityClient from '$lib/sanity';
  import { browser } from '$app/environment';
  import { currentUser } from '$lib/stores/user';
  import { IconPlayerPlay as Play, IconSettings as Settings, IconUsers as Users } from '@tabler/icons-svelte';

  type TemplateRound = {
    key?: string;
    name?: string;
    minutes?: number;
    questions?: string[];
  };

  interface WorkshopTemplate {
    _id: string;
    title: string;
    slug?: { current?: string } | string;
    description?: string;
    lenses?: string[];
    sections?: {
      onboarding?: {
        title?: string;
        introCopy?: string;
        whatToBring?: string[];
        rules?: string[];
        quickStart?: string[];
      };
      breakout?: {
        rounds?: TemplateRound[];
      };
      synthesis?: {
        methods?: string[];
        instructions?: string;
      };
      commitments?: {
        instructions?: string;
        exportFields?: string[];
      };
    };
    facilitation?: {
      roles?: string[];
      fairnessThreshold?: number;
      scoring?: {
        idea?: number;
        vote?: number;
        linkCards?: number;
        reflection?: number;
        justice?: number;
      };
      badges?: string[];
    };
    visuals?: {
      charts?: string[];
      theme?: {
        _id?: string;
        name?: string;
        palette?: Record<string, string>;
        fonts?: Record<string, string>;
        cardStyle?: Record<string, unknown>;
      };
    };
    aiAssist?: {
      enabled?: boolean;
      maxAlternates?: number;
      guidance?: string;
    };
    resources?: Array<{ title?: string; url?: string }>;
    steps?: Array<{
      key?: string;
      name?: string;
      minutes?: number;
      instructions?: string;
    }>;
  }

  let facilitatorName = '';
  let sessionCode = '';
  let sessionTitle = '';
  let selectedTemplate: WorkshopTemplate | null = null;
  let templates: WorkshopTemplate[] = [];
  let loading = false;
  let loadingTemplates = true;

  const templateQuery = `*[_type == "workshopTemplate"]{
    _id,
    title,
    slug,
    description,
    lenses,
    sections,
    facilitation,
    visuals{
      charts,
      theme->{
        _id,
        name,
        palette,
        fonts,
        cardStyle
      }
    },
    aiAssist,
    resources
  }` as const;

  async function fetchTemplates() {
    try {
      templates = await sanityClient.fetch(templateQuery);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      loadingTemplates = false;
    }
  }

  function generateSessionCode() {
    sessionCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  async function seedQuestions(code: string, rounds: TemplateRound[] = []) {
    if (!rounds.length) return;
    const payloads = rounds
      .flatMap((round) =>
        (round?.questions ?? []).map((text) => ({
          code,
          section: round?.name ?? round?.key ?? 'Breakout',
          text: text.trim()
        }))
      )
      .filter((entry) => entry.text.length);

    await Promise.all(
      payloads.map((payload) =>
        fetch('/api/questions/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch((error) => {
          console.error('Failed to seed question', error);
        })
      )
    );
  }

  async function createSession() {
    if (!facilitatorName || !sessionCode || !sessionTitle || !selectedTemplate) {
      alert('Please fill in all fields and select a template');
      return;
    }

    loading = true;
    try {
      const templateSlug =
        typeof selectedTemplate.slug === 'string'
          ? selectedTemplate.slug
          : selectedTemplate.slug?.current;

      const sessionResponse = await fetch('/api/session/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: sessionCode,
          title: sessionTitle,
          templateSlug
        })
      });

      const sessionData = await sessionResponse.json();
      if (!sessionData.success) {
        throw new Error(sessionData.error);
      }

      const facilitatorColor =
        selectedTemplate.visuals?.theme?.palette?.neonPink ?? '#ff00ff';

      const participantResponse = await fetch('/api/participants/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: sessionCode,
          name: facilitatorName,
          role: 'facilitator',
          color: facilitatorColor
        })
      });

      const participantData = await participantResponse.json();
      if (!participantData.success) {
        throw new Error(participantData.error);
      }

      await seedQuestions(
        sessionCode,
        selectedTemplate.sections?.breakout?.rounds ?? []
      );

      if (browser && participantData.participant) {
        const profile = {
          participantId: participantData.participant.id as string,
          sessionCode,
          name: facilitatorName,
          role: 'facilitator' as const,
          color: facilitatorColor
        };
        currentUser.set(profile);
        const serialized = JSON.stringify(profile);
        document.cookie = `cda-session=${encodeURIComponent(
          serialized
        )}; path=/; SameSite=Lax`;
        sessionStorage.setItem('cda-session', serialized);
      }

      if (browser) {
        window.open(`/presentation?code=${sessionCode}`, '_blank');
      }

      goto(`/session/${sessionCode}?role=facilitator`);
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Failed to create session. Please try again.');
    } finally {
      loading = false;
    }
  }

  onMount(async () => {
    generateSessionCode();
    await fetchTemplates();
  });

  $: if (!sessionTitle && selectedTemplate) {
    sessionTitle = `${selectedTemplate.title} — ${new Date()
      .toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      .toUpperCase()}`;
  }

  $: if (!selectedTemplate && templates.length) {
    selectedTemplate = templates[0];
  }
</script>

<div class="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-cyan-900 p-6">
  <div class="max-w-4xl mx-auto">
    <header class="text-center mb-12">
      <h1 class="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-4">
        Workshop Facilitator Console
      </h1>
      <p class="text-slate-300 text-lg">
        Create and manage your AI confidence workshop session
      </p>
    </header>

    <div class="grid lg:grid-cols-2 gap-8">
      <!-- Setup Form -->
      <div class="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-cyan-400/20">
        <h2 class="text-2xl font-semibold text-white mb-6 flex items-center gap-2">
          <Settings class="w-6 h-6 text-cyan-400" />
          Session Setup
        </h2>

        <form on:submit|preventDefault={createSession} class="space-y-6">
          <div>
            <label for="facilitatorName" class="block text-sm font-medium text-slate-300 mb-2">
              Your Name
            </label>
            <input
              id="facilitatorName"
              type="text"
              bind:value={facilitatorName}
              placeholder="Enter your name"
              class="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label for="sessionTitle" class="block text-sm font-medium text-slate-300 mb-2">
              Workshop Title
            </label>
            <input
              id="sessionTitle"
              type="text"
              bind:value={sessionTitle}
              placeholder="e.g., AI Confidence Workshop - Team Alpha"
              class="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label for="sessionCode" class="block text-sm font-medium text-slate-300 mb-2">
              Session Code
            </label>
            <div class="flex gap-2">
              <input
                id="sessionCode"
                type="text"
                bind:value={sessionCode}
                class="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent font-mono text-lg"
                required
              />
              <button
                type="button"
                on:click={generateSessionCode}
                class="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                New Code
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !selectedTemplate}
            class="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {#if loading}
              <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Creating Session...
            {:else}
              <Play class="w-5 h-5" />
              Launch Workshop
            {/if}
          </button>
        </form>
      </div>

      <!-- Template Selection -->
      <div class="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-purple-400/20">
        <h2 class="text-2xl font-semibold text-white mb-6 flex items-center gap-2">
          <Users class="w-6 h-6 text-purple-400" />
          Workshop Template
        </h2>

        {#if loadingTemplates}
          <div class="flex items-center justify-center py-12">
            <div class="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        {:else if templates.length === 0}
          <p class="text-slate-400 text-center py-8">
            No templates found. Add workshop templates in Sanity Studio.
          </p>
        {:else}
          <div class="space-y-4">
            {#each templates as template}
              <button
                type="button"
                on:click={() => selectedTemplate = template}
                class="w-full text-left p-4 rounded-lg border-2 transition-all duration-200 {selectedTemplate?._id === template._id
                  ? 'border-purple-400 bg-purple-400/10'
                  : 'border-slate-600 hover:border-purple-400/50 bg-slate-700/50'}"
              >
                <h3 class="font-semibold text-white mb-2">{template.title}</h3>
                <p class="text-sm text-slate-300 mb-3">{template.description || 'No description available'}</p>

                <div class="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span class="text-slate-400">Lenses:</span>
                    <div class="flex flex-wrap gap-1 mt-1">
                      {#each template.lenses ?? [] as lens}
                        <span class="px-2 py-1 bg-cyan-400/20 text-cyan-300 rounded">{lens}</span>
                      {/each}
                    </div>
                  </div>
                  <div>
                    <span class="text-slate-400">Steps:</span>
                    <span class="text-white ml-2">{template.steps?.length || 0}</span>
                  </div>
                </div>
              </button>
            {/each}
          </div>
        {/if}
      </div>
    </div>

    {#if selectedTemplate}
      <div class="mt-8 bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 border border-slate-600">
        <h3 class="text-xl font-semibold text-white mb-4">Template Preview: {selectedTemplate.title}</h3>

        {#if selectedTemplate.steps && selectedTemplate.steps.length > 0}
          <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {#each selectedTemplate.steps as step, index}
              <div class="bg-slate-700/50 rounded-lg p-4">
                <div class="flex items-center gap-2 mb-2">
                  <span class="w-6 h-6 bg-cyan-400 text-slate-900 rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </span>
                  <span class="font-medium text-white">{step.name}</span>
                  <span class="text-xs text-slate-400">{step.minutes}min</span>
                </div>
                <p class="text-sm text-slate-300">{step.instructions}</p>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>
