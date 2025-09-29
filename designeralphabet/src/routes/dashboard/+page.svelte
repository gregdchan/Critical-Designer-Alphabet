<script lang="ts">
  import { onMount } from 'svelte';
  import {
    IconChartBar as BarChart,
    IconUsers as Users,
    IconClock as Clock,
    IconTrophy as Trophy,
    IconDownload as Download,
    IconEye as Eye,
    IconTarget as Target,
    IconBulb as Lightbulb,
    IconHeart as Heart,
    IconTrendingUp as TrendingUp
  } from '@tabler/icons-svelte';
  import { getLeaderboard, BADGES, type Badge } from '$lib/gamification';
  import QuadBubbleChart from '$lib/components/charts/QuadBubbleChart.svelte';
  import HeatmapChart from '$lib/components/charts/HeatmapChart.svelte';
  import RoadmapChart from '$lib/components/charts/RoadmapChart.svelte';

  // Mock data - in real implementation, this would come from API
  let sessions: any[] = [];
  let selectedSession: any = null;
  let participants: any[] = [];
  let responses: any[] = [];
  let timeline: any[] = [];
  let loading = true;

  // Dashboard metrics
  let dashboardMetrics = {
    totalSessions: 0,
    totalParticipants: 0,
    totalIdeas: 0,
    avgEngagement: 0,
    activeSessions: 0
  };

  let leaderboard: any[] = [];

  onMount(async () => {
    // Simulate loading data
    await loadDashboardData();
    loading = false;
  });

  async function loadDashboardData() {
    // In real implementation, these would be API calls
    sessions = [
      {
        id: '1',
        code: 'DESIGN2024',
        name: 'AI Ethics Workshop',
        status: 'active',
        createdAt: '2024-01-15T10:00:00Z',
        participantCount: 12,
        responseCount: 45,
        template: 'AI Policy Design',
        facilitator: 'Dr. Sarah Chen'
      },
      {
        id: '2',
        code: 'POLICY23',
        name: 'Urban Planning Session',
        status: 'completed',
        createdAt: '2024-01-10T14:00:00Z',
        participantCount: 8,
        responseCount: 32,
        template: 'Community Design',
        facilitator: 'Marcus Rodriguez'
      },
      {
        id: '3',
        code: 'FUTURE24',
        name: 'Sustainable Design Thinking',
        status: 'completed',
        createdAt: '2024-01-08T09:00:00Z',
        participantCount: 15,
        responseCount: 67,
        template: 'Environmental Policy',
        facilitator: 'Dr. Lisa Park'
      }
    ];

    // Calculate dashboard metrics
    dashboardMetrics = {
      totalSessions: sessions.length,
      totalParticipants: sessions.reduce((sum, s) => sum + s.participantCount, 0),
      totalIdeas: sessions.reduce((sum, s) => sum + s.responseCount, 0),
      avgEngagement: sessions.length > 0 ?
        Math.round(sessions.reduce((sum, s) => sum + (s.responseCount / s.participantCount), 0) / sessions.length * 10) / 10 : 0,
      activeSessions: sessions.filter(s => s.status === 'active').length
    };

    // Load first session details
    if (sessions.length > 0) {
      await loadSessionDetails(sessions[0]);
    }
  }

  async function loadSessionDetails(session: any) {
    selectedSession = session;

    // Mock participant data
    participants = [
      { id: '1', name: 'Alice Johnson', role: 'participant', joinedAt: '2024-01-15T10:05:00Z', avatarColor: 'bg-blue-500' },
      { id: '2', name: 'Bob Smith', role: 'participant', joinedAt: '2024-01-15T10:07:00Z', avatarColor: 'bg-green-500' },
      { id: '3', name: 'Carol Davis', role: 'participant', joinedAt: '2024-01-15T10:12:00Z', avatarColor: 'bg-purple-500' },
      { id: '4', name: 'David Wilson', role: 'participant', joinedAt: '2024-01-15T10:15:00Z', avatarColor: 'bg-pink-500' },
      { id: '5', name: 'Emma Thompson', role: 'participant', joinedAt: '2024-01-15T10:18:00Z', avatarColor: 'bg-yellow-500' }
    ];

    // Mock response data
    responses = [
      { id: '1', participantId: '1', text: 'AI bias in hiring processes needs transparent algorithms', lens: 'Justice', type: 'concern', votes: ['2', '3', '4'], createdAt: '2024-01-15T10:20:00Z' },
      { id: '2', participantId: '2', text: 'Automated decision-making should include human oversight', lens: 'Ethics', type: 'goal', votes: ['1', '3', '5'], createdAt: '2024-01-15T10:25:00Z' },
      { id: '3', participantId: '3', text: 'Community input essential for AI policy development', lens: 'Community', type: 'usecase', votes: ['1', '2', '4', '5'], createdAt: '2024-01-15T10:30:00Z' },
      { id: '4', participantId: '1', text: 'Regular audits of AI systems for fairness metrics', lens: 'Agency', type: 'metric', votes: ['2', '5'], createdAt: '2024-01-15T10:35:00Z' },
      { id: '5', participantId: '4', text: 'Environmental impact assessment for large AI models', lens: 'Sustainability', type: 'concern', votes: ['1', '3'], createdAt: '2024-01-15T10:40:00Z' }
    ];

    // Mock timeline data
    timeline = [
      { id: '1', type: 'session_started', timestamp: '2024-01-15T10:00:00Z', description: 'Session started' },
      { id: '2', type: 'participant_joined', timestamp: '2024-01-15T10:05:00Z', description: 'Alice Johnson joined' },
      { id: '3', type: 'first_response', timestamp: '2024-01-15T10:20:00Z', description: 'First response submitted' }
    ];

    // Calculate leaderboard
    leaderboard = getLeaderboard(participants, responses, timeline);
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-400/10';
      case 'completed': return 'text-blue-400 bg-blue-400/10';
      case 'paused': return 'text-yellow-400 bg-yellow-400/10';
      default: return 'text-slate-400 bg-slate-400/10';
    }
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  async function exportSessionData(sessionId: string) {
    // Implementation for exporting session data
    console.log(`Exporting data for session ${sessionId}`);
  }
</script>

<svelte:head>
  <title>Planning Dashboard - Critical Designer Alphabet</title>
  <meta name="description" content="Comprehensive dashboard for workshop planning and data analysis." />
</svelte:head>

<div class="space-y-8">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-bold text-slate-100">Planning Dashboard</h1>
      <p class="text-slate-400 mt-1">Comprehensive workshop analytics and session management</p>
    </div>
    <button
      class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
      on:click={() => window.location.href = '/facilitator'}
    >
      <Target class="h-4 w-4" />
      New Session
    </button>
  </div>

  {#if loading}
    <div class="flex items-center justify-center py-12">
      <div class="text-slate-400">Loading dashboard data...</div>
    </div>
  {:else}
    <!-- Key Metrics -->
    <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
      <div class="bg-slate-800 rounded-lg border border-slate-600 p-6">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400">
            <BarChart class="h-5 w-5" />
          </div>
          <div>
            <p class="text-sm text-slate-400">Total Sessions</p>
            <p class="text-2xl font-semibold text-slate-100">{dashboardMetrics.totalSessions}</p>
          </div>
        </div>
      </div>

      <div class="bg-slate-800 rounded-lg border border-slate-600 p-6">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-green-600/20 text-green-400">
            <Users class="h-5 w-5" />
          </div>
          <div>
            <p class="text-sm text-slate-400">Participants</p>
            <p class="text-2xl font-semibold text-slate-100">{dashboardMetrics.totalParticipants}</p>
          </div>
        </div>
      </div>

      <div class="bg-slate-800 rounded-lg border border-slate-600 p-6">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-600/20 text-purple-400">
            <Lightbulb class="h-5 w-5" />
          </div>
          <div>
            <p class="text-sm text-slate-400">Ideas Generated</p>
            <p class="text-2xl font-semibold text-slate-100">{dashboardMetrics.totalIdeas}</p>
          </div>
        </div>
      </div>

      <div class="bg-slate-800 rounded-lg border border-slate-600 p-6">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-600/20 text-orange-400">
            <TrendingUp class="h-5 w-5" />
          </div>
          <div>
            <p class="text-sm text-slate-400">Avg Engagement</p>
            <p class="text-2xl font-semibold text-slate-100">{dashboardMetrics.avgEngagement}</p>
          </div>
        </div>
      </div>

      <div class="bg-slate-800 rounded-lg border border-slate-600 p-6">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-red-600/20 text-red-400">
            <Clock class="h-5 w-5" />
          </div>
          <div>
            <p class="text-sm text-slate-400">Active Sessions</p>
            <p class="text-2xl font-semibold text-slate-100">{dashboardMetrics.activeSessions}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Sessions Overview -->
    <div class="grid gap-8 lg:grid-cols-3">
      <!-- Session List -->
      <div class="lg:col-span-1">
        <div class="bg-slate-800 rounded-lg border border-slate-600 p-6">
          <h2 class="text-lg font-semibold text-slate-100 mb-6">Recent Sessions</h2>
          <div class="space-y-4">
            {#each sessions as session}
              <button
                type="button"
                class="w-full text-left p-4 rounded-lg border border-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 {selectedSession?.id === session.id ? 'bg-blue-600/20 border-blue-500/50' : 'hover:bg-slate-700'}"
                on:click={() => loadSessionDetails(session)}
              >
                <div class="flex items-center justify-between mb-2">
                  <h3 class="font-medium text-slate-100">{session.name}</h3>
                  <span class="px-2 py-1 text-xs font-medium rounded-full {getStatusColor(session.status)}">
                    {session.status}
                  </span>
                </div>
                <div class="text-sm text-slate-400 space-y-1">
                  <p>Code: <span class="font-mono text-slate-300">{session.code}</span></p>
                  <p>Facilitator: {session.facilitator}</p>
                  <p>{session.participantCount} participants • {session.responseCount} ideas</p>
                  <p class="text-xs">{formatDate(session.createdAt)}</p>
                </div>
              </button>
            {/each}
          </div>
        </div>
      </div>

      <!-- Session Details -->
      <div class="lg:col-span-2">
        {#if selectedSession}
          <div class="space-y-6">
            <!-- Session Header -->
            <div class="bg-slate-800 rounded-lg border border-slate-600 p-6">
              <div class="flex items-center justify-between mb-4">
                <div>
                  <h2 class="text-xl font-semibold text-slate-100">{selectedSession.name}</h2>
                  <p class="text-slate-400">Template: {selectedSession.template}</p>
                </div>
                <div class="flex items-center gap-2">
                  <button
                    class="inline-flex items-center gap-2 rounded-lg bg-slate-700 px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-600 transition-colors"
                    on:click={() => window.location.href = `/session/${selectedSession.code}`}
                  >
                    <Eye class="h-4 w-4" />
                    View Live
                  </button>
                  <button
                    class="inline-flex items-center gap-2 rounded-lg bg-slate-700 px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-600 transition-colors"
                    on:click={() => exportSessionData(selectedSession.id)}
                  >
                    <Download class="h-4 w-4" />
                    Export
                  </button>
                </div>
              </div>

              <!-- Quick Stats -->
              <div class="grid grid-cols-4 gap-4">
                <div class="text-center">
                  <p class="text-2xl font-semibold text-slate-100">{participants.length}</p>
                  <p class="text-sm text-slate-400">Participants</p>
                </div>
                <div class="text-center">
                  <p class="text-2xl font-semibold text-slate-100">{responses.length}</p>
                  <p class="text-sm text-slate-400">Ideas</p>
                </div>
                <div class="text-center">
                  <p class="text-2xl font-semibold text-slate-100">
                    {responses.reduce((sum, r) => sum + (r.votes?.length || 0), 0)}
                  </p>
                  <p class="text-sm text-slate-400">Total Votes</p>
                </div>
                <div class="text-center">
                  <p class="text-2xl font-semibold text-slate-100">
                    {Math.round((responses.reduce((sum, r) => sum + (r.votes?.length || 0), 0) / responses.length) * 10) / 10 || 0}
                  </p>
                  <p class="text-sm text-slate-400">Avg Votes/Idea</p>
                </div>
              </div>
            </div>

            <!-- Leaderboard -->
            <div class="bg-slate-800 rounded-lg border border-slate-600 p-6">
              <h3 class="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                <Trophy class="h-5 w-5 text-yellow-400" />
                Leaderboard
              </h3>
              <div class="space-y-3">
                {#each leaderboard.slice(0, 5) as participant, index}
                  <div class="flex items-center gap-4 p-3 rounded-lg bg-slate-700">
                    <div class="flex items-center gap-3">
                      <span class="text-lg font-semibold text-slate-300 w-6 text-center">#{index + 1}</span>
                      <div class="w-8 h-8 rounded-full {participant.avatarColor} flex items-center justify-center text-white text-sm font-medium">
                        {participant.name.charAt(0)}
                      </div>
                      <div>
                        <p class="text-sm font-medium text-slate-100">{participant.name}</p>
                        <p class="text-xs text-slate-400">{participant.contributionCount} ideas • {participant.votesReceived} votes received</p>
                      </div>
                    </div>
                    <div class="ml-auto flex items-center gap-2">
                      <div class="flex -space-x-1">
                        {#each participant.badges.slice(0, 3) as badge}
                          <span class="inline-block text-sm" title={badge.name}>{badge.icon}</span>
                        {/each}
                        {#if participant.badges.length > 3}
                          <span class="text-xs text-slate-400">+{participant.badges.length - 3}</span>
                        {/if}
                      </div>
                      <span class="text-lg font-semibold text-blue-400">{participant.score}</span>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          </div>
        {:else}
          <div class="bg-slate-800 rounded-lg border border-slate-600 p-12 text-center">
            <div class="text-slate-400">
              <BarChart class="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select a session to view detailed analytics</p>
            </div>
          </div>
        {/if}
      </div>
    </div>

    <!-- Data Visualizations -->
    {#if selectedSession && responses.length > 0}
      <div class="space-y-8">
        <div class="flex items-center gap-2">
          <h2 class="text-2xl font-semibold text-slate-100">Session Analytics</h2>
          <span class="text-slate-400">— {selectedSession.name}</span>
        </div>

        <!-- Charts Grid -->
        <div class="space-y-8">
          <!-- Impact vs Effort Analysis -->
          <div class="bg-slate-800 rounded-lg border border-slate-600 p-8">
            <h3 class="text-xl font-semibold text-slate-100 mb-6">Impact vs Effort Analysis</h3>
            <QuadBubbleChart {responses} width={800} height={480} />
          </div>

          <!-- Maturity Assessment -->
          <div class="bg-slate-800 rounded-lg border border-slate-600 p-8">
            <h3 class="text-xl font-semibold text-slate-100 mb-6">Maturity Assessment</h3>
            <HeatmapChart {responses} width={800} height={500} />
          </div>

          <!-- Development Roadmap -->
          <div class="bg-slate-800 rounded-lg border border-slate-600 p-8">
            <h3 class="text-xl font-semibold text-slate-100 mb-6">Development Roadmap</h3>
            <RoadmapChart {responses} width={900} height={600} />
          </div>
        </div>
      </div>
    {/if}
  {/if}
</div>
