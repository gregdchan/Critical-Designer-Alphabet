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

	// Real data from API
	let sessions: any[] = [];
	let selectedSession: any = null;
	let participants: any[] = [];
	let responses: any[] = [];
	let timeline: any[] = [];
	let questions: any[] = [];
	let chat: any[] = [];
	let loading = true;
	let loadingSession = false;
	let error = '';

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
		await loadDashboardData();
		loading = false;
	});

	async function loadDashboardData() {
		try {
			const response = await fetch('/api/dashboard');
			const data = await response.json();

			if (!data.success) {
				throw new Error(data.error || 'Failed to load dashboard data');
			}

			sessions = data.sessions;
			dashboardMetrics = data.metrics;

			// Load first session details if available
			if (sessions.length > 0) {
				await loadSessionDetails(sessions[0]);
			}
		} catch (err: any) {
			console.error('Failed to load dashboard data:', err);
			error = err.message || 'Failed to load dashboard data';
		}
	}

	async function loadSessionDetails(session: any) {
		selectedSession = session;
		loadingSession = true;

		try {
			const response = await fetch(`/api/dashboard/${session.code}`);
			const data = await response.json();

			if (!data.success) {
				throw new Error(data.error || 'Failed to load session details');
			}

			participants = data.participants || [];
			responses = data.responses || [];
			timeline = data.timeline || [];
			questions = data.questions || [];
			chat = data.chat || [];

			// Use participants array directly as leaderboard since it's already calculated and sorted
			leaderboard = participants;
		} catch (err: any) {
			console.error('Failed to load session details:', err);
			error = err.message || 'Failed to load session details';
		} finally {
			loadingSession = false;
		}
	}

	function getStatusColor(status: string): string {
		switch (status) {
			case 'live':
				return 'text-green-400 bg-green-400/10';
			case 'done':
				return 'text-blue-400 bg-blue-400/10';
			case 'planned':
				return 'text-yellow-400 bg-yellow-400/10';
			default:
				return 'text-slate-400 bg-slate-400/10';
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

	async function exportSessionData(sessionCode: string) {
		try {
			window.open(`/api/export/${sessionCode}`, '_blank');
		} catch (err) {
			console.error('Failed to export session data:', err);
			alert('Failed to export session data');
		}
	}
</script>

<svelte:head>
	<title>Planning Dashboard - Critical Designer Alphabet</title>
	<meta
		name="description"
		content="Comprehensive dashboard for workshop planning and data analysis."
	/>
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
			on:click={() => (window.location.href = '/facilitator')}
		>
			<Target class="h-4 w-4" />
			New Session
		</button>
	</div>

	{#if error}
		<div class="flex items-center justify-center py-12">
			<div class="text-center">
				<div class="text-red-400 mb-2">⚠️ Error loading dashboard</div>
				<div class="text-slate-400 text-sm">{error}</div>
				<button
					class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
					on:click={() => { error = ''; loading = true; loadDashboardData().finally(() => loading = false); }}
				>
					Retry
				</button>
			</div>
		</div>
	{:else if loading}
		<div class="flex items-center justify-center py-12">
			<div class="text-slate-400">Loading dashboard data...</div>
		</div>
	{:else}
		<!-- Key Metrics -->
		<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
			<div class="bg-slate-800 rounded-lg border border-slate-600 p-6">
				<div class="flex items-center gap-3">
					<div
						class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400"
					>
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
					<div
						class="flex h-10 w-10 items-center justify-center rounded-lg bg-green-600/20 text-green-400"
					>
						<Users class="h-5 w-5" />
					</div>
					<div>
						<p class="text-sm text-slate-400">Participants</p>
						<p class="text-2xl font-semibold text-slate-100">
							{dashboardMetrics.totalParticipants}
						</p>
					</div>
				</div>
			</div>

			<div class="bg-slate-800 rounded-lg border border-slate-600 p-6">
				<div class="flex items-center gap-3">
					<div
						class="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-600/20 text-purple-400"
					>
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
					<div
						class="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-600/20 text-orange-400"
					>
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
					<div
						class="flex h-10 w-10 items-center justify-center rounded-lg bg-red-600/20 text-red-400"
					>
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
								class="w-full text-left p-4 rounded-lg border border-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 {selectedSession?.code ===
								session.code
									? 'bg-blue-600/20 border-blue-500/50'
									: 'hover:bg-slate-700'}"
								on:click={() => loadSessionDetails(session)}
								disabled={loadingSession}
							>
								<div class="flex items-center justify-between mb-2">
									<h3 class="font-medium text-slate-100">{session.name}</h3>
									<span
										class="px-2 py-1 text-xs font-medium rounded-full {getStatusColor(
											session.status
										)}"
									>
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
				{#if loadingSession}
					<div class="bg-slate-800 rounded-lg border border-slate-600 p-12 text-center">
						<div class="text-slate-400">Loading session details...</div>
					</div>
				{:else if selectedSession}
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
										on:click={() => (window.location.href = `/session/${selectedSession.code}`)}
									>
										<Eye class="h-4 w-4" />
										View Live
									</button>
									<button
										class="inline-flex items-center gap-2 rounded-lg bg-slate-700 px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-600 transition-colors"
										on:click={() => exportSessionData(selectedSession.code)}
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
										{Math.round(
											(responses.reduce((sum, r) => sum + (r.votes?.length || 0), 0) /
												responses.length) *
												10
										) / 10 || 0}
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
											<span class="text-lg font-semibold text-slate-300 w-6 text-center"
												>#{index + 1}</span
											>
											<div
												class="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
												style="background-color: {participant.avatarColor || '#6b7280'}"
											>
												{participant.name.charAt(0)}
											</div>
											<div>
												<p class="text-sm font-medium text-slate-100">{participant.name}</p>
												<p class="text-xs text-slate-400">
													{participant.contributionCount} ideas • {participant.votesReceived} votes received
												</p>
											</div>
										</div>
										<div class="ml-auto flex items-center gap-2">
											{#if participant.badges && participant.badges.length > 0}
												<div class="flex -space-x-1">
													{#each participant.badges.slice(0, 3) as badge}
														<span class="inline-block text-sm" title={badge.name || badge}>{badge.icon || badge}</span>
													{/each}
													{#if participant.badges.length > 3}
														<span class="text-xs text-slate-400"
															>+{participant.badges.length - 3}</span
														>
													{/if}
												</div>
											{/if}
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
