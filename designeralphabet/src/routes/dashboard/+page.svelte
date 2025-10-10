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
		IconTrendingUp as TrendingUp
	} from '@tabler/icons-svelte';
	import { getLeaderboard, BADGES, type Badge } from '$lib/gamification';

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

			// Compute leaderboard with scores from responses + timeline
			leaderboard = getLeaderboard(participants, responses, timeline);
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
				return 'bg-green-600 text-white border border-green-700 shadow-[0_0_20px_rgba(34,197,94,0.25)]';
			case 'done':
				return 'bg-rose-600 text-white border border-rose-700 shadow-[0_0_20px_rgba(244,63,94,0.25)]';
			case 'planned':
				return 'bg-amber-500 text-white border border-amber-700 shadow-[0_0_20px_rgba(245,158,11,0.25)]';
			default:
				return 'surface-muted text-secondary border border-line';
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

<div class="min-h-screen surface">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
		<div class="space-y-8">
			<!-- Header -->
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-3xl font-bold text-primary">Planning Dashboard</h1>
					<p class="text-secondary mt-1">Comprehensive workshop analytics and session management</p>
				</div>
				<button
					class="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-sm"
					on:click={() => (window.location.href = '/facilitator')}
				>
					<Target class="h-4 w-4" />
					New Session
				</button>
			</div>

			{#if error}
				<div class="flex items-center justify-center py-12">
					<div class="text-center surface rounded-xl border border-line p-8 shadow-sm">
						<div class="text-accent-critical mb-2 font-semibold">⚠️ Error loading dashboard</div>
						<div class="text-secondary text-sm">{error}</div>
						<button
							class="mt-4 px-4 py-2 bg-brand text-white rounded-lg hover:bg-blue-700 transition shadow-sm"
							on:click={() => {
								error = '';
								loading = true;
								loadDashboardData().finally(() => (loading = false));
							}}
						>
							Retry
						</button>
					</div>
				</div>
			{:else if loading}
				<div class="flex items-center justify-center py-12">
					<div class="text-secondary">Loading dashboard data...</div>
				</div>
			{:else}
				<!-- Key Metrics -->
				<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
					<div class="surface rounded-xl border border-line p-6 shadow-sm hover:shadow-md transition-shadow">
						<div class="flex items-center gap-3">
							<div
								class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-brand"
							>
								<BarChart class="h-5 w-5" />
							</div>
							<div>
								<p class="text-sm text-secondary">Total Sessions</p>
								<p class="text-2xl font-semibold text-primary">{dashboardMetrics.totalSessions}</p>
							</div>
						</div>
					</div>

					<div class="surface rounded-xl border border-line p-6 shadow-sm hover:shadow-md transition-shadow">
						<div class="flex items-center gap-3">
							<div
								class="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600"
							>
								<Users class="h-5 w-5" />
							</div>
							<div>
								<p class="text-sm text-secondary">Participants</p>
								<p class="text-2xl font-semibold text-primary">
									{dashboardMetrics.totalParticipants}
								</p>
							</div>
						</div>
					</div>

					<div class="surface rounded-xl border border-line p-6 shadow-sm hover:shadow-md transition-shadow">
						<div class="flex items-center gap-3">
							<div
								class="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600"
							>
								<Lightbulb class="h-5 w-5" />
							</div>
							<div>
								<p class="text-sm text-secondary">Ideas Generated</p>
								<p class="text-2xl font-semibold text-primary">{dashboardMetrics.totalIdeas}</p>
							</div>
						</div>
					</div>

					<div class="surface rounded-xl border border-line p-6 shadow-sm hover:shadow-md transition-shadow">
						<div class="flex items-center gap-3">
							<div
								class="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10 text-brand"
							>
								<TrendingUp class="h-5 w-5" />
							</div>
							<div>
								<p class="text-sm text-secondary">Avg Engagement</p>
								<p class="text-2xl font-semibold text-primary">{dashboardMetrics.avgEngagement}</p>
							</div>
						</div>
					</div>

					<div class="surface rounded-xl border border-line p-6 shadow-sm hover:shadow-md transition-shadow">
						<div class="flex items-center gap-3">
							<div
								class="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-accent-critical"
							>
								<Clock class="h-5 w-5" />
							</div>
							<div>
								<p class="text-sm text-secondary">Active Sessions</p>
								<p class="text-2xl font-semibold text-primary">{dashboardMetrics.activeSessions}</p>
							</div>
						</div>
					</div>
				</div>

				<!-- Sessions Overview -->
				<div class="grid gap-8 lg:grid-cols-3">
					<!-- Session List -->
					<div class="lg:col-span-1">
						<div class="surface rounded-xl border border-line p-6 shadow-sm">
							<h2 class="text-lg font-semibold text-primary mb-6">Recent Sessions</h2>
							<div class="space-y-4">
								{#each sessions as session}
									<button
										type="button"
										class="w-full text-left p-4 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-ring {selectedSession?.code ===
										session.code
											? 'bg-blue-50 border-blue-200'
											: 'border-line hover:bg-surface-muted'}"
										on:click={() => loadSessionDetails(session)}
										disabled={loadingSession}
									>
										<div class="flex items-center justify-between mb-2">
											<h3 class="font-medium text-primary">{session.name}</h3>
											<span
												class="px-2 py-1 text-xs font-medium rounded-full {getStatusColor(
													session.status
												)}"
											>
												{session.status}
											</span>
										</div>
										<div class="text-sm text-secondary space-y-1">
											<p>Code: <span class="font-mono text-primary">{session.code}</span></p>
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
							<div class="surface rounded-xl border border-line p-12 text-center shadow-sm">
								<div class="text-secondary">Loading session details...</div>
							</div>
						{:else if selectedSession}
							<div class="space-y-6">
								<!-- Session Header -->
								<div class="surface rounded-xl border border-line p-6 shadow-sm">
									<div class="flex items-center justify-between mb-4">
										<div>
											<h2 class="text-xl font-semibold text-primary">{selectedSession.name}</h2>
											<p class="text-secondary">Template: {selectedSession.template}</p>
										</div>
										<div class="flex items-center gap-2">
											<button
												class="inline-flex items-center gap-2 rounded-lg border border-line surface px-3 py-2 text-sm font-medium text-primary hover:bg-surface-muted transition-colors shadow-sm"
												on:click={() => (window.location.href = `/session/${selectedSession.code}`)}
											>
												<Eye class="h-4 w-4" />
												View Live
											</button>
											<button
												class="inline-flex items-center gap-2 rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-sm"
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
											<p class="text-2xl font-semibold text-primary">{participants.length}</p>
											<p class="text-sm text-secondary">Participants</p>
										</div>
										<div class="text-center">
											<p class="text-2xl font-semibold text-primary">{responses.length}</p>
											<p class="text-sm text-secondary">Ideas</p>
										</div>
										<div class="text-center">
											<p class="text-2xl font-semibold text-primary">
												{responses.reduce((sum, r) => sum + (Number(r.votes) || 0), 0)}
											</p>
											<p class="text-sm text-secondary">Total Votes</p>
										</div>
										<div class="text-center">
											<p class="text-2xl font-semibold text-primary">
												{Math.round(
													(responses.reduce((sum, r) => sum + (Number(r.votes) || 0), 0) /
														responses.length) *
														10
												) / 10 || 0}
											</p>
											<p class="text-sm text-secondary">Avg Votes/Idea</p>
										</div>
									</div>
								</div>

								<!-- Leaderboard -->
								<div class="surface rounded-xl border border-line p-6 shadow-sm">
									<h3 class="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
										<Trophy class="h-5 w-5 text-yellow-500" />
										Leaderboard
									</h3>
									<div class="space-y-3">
										{#each leaderboard as participant, index}
											<div class="flex items-center gap-4 p-3 rounded-lg border border-line hover:bg-surface-muted transition-colors">
												<div class="flex items-center gap-3">
													<span class="text-lg font-semibold text-primary w-6 text-center"
														>#{index + 1}</span
													>
													<div
														class="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
														style="background-color: {participant.avatarColor || '#6b7280'}"
													>
														{participant.name.charAt(0)}
													</div>
													<div>
														<p class="text-sm font-medium text-primary">{participant.name}</p>
														<p class="text-xs text-secondary">
															{participant.contributionCount} ideas • {participant.votesReceived} votes received
														</p>
													</div>
												</div>
												<div class="ml-auto flex items-center gap-2">
													{#if participant.badges && participant.badges.length > 0}
														<div class="flex -space-x-1">
															{#each participant.badges.slice(0, 3) as badge}
																<span class="inline-block text-sm" title={badge.name || badge}
																	>{badge.icon || badge}</span
																>
															{/each}
															{#if participant.badges.length > 3}
																<span class="text-xs text-secondary"
																	>+{participant.badges.length - 3}</span
																>
															{/if}
														</div>
													{/if}
													<span class="text-lg font-semibold text-brand">{participant.score}</span>
												</div>
											</div>
										{/each}
									</div>
								</div>
							</div>
						{:else}
							<div class="surface rounded-xl border border-line p-12 text-center shadow-sm">
								<div class="text-secondary">
									<BarChart class="h-12 w-12 mx-auto mb-4 opacity-50" />
									<p>Select a session to view detailed analytics</p>
								</div>
							</div>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
