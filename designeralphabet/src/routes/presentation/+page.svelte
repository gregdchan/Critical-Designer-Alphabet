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
		leaderboard,
		phases as phasesStore,
		startRealtimeSession,
		stopRealtimeSession
	} from '$lib/realtime';
	import { CHART_REGISTRY } from '$lib/charts';
	import QuadBubbleChart from '$lib/components/charts/QuadBubbleChart.svelte';
	import HeatmapChart from '$lib/components/charts/HeatmapChart.svelte';
	import RoadmapChart from '$lib/components/charts/RoadmapChart.svelte';
	import BarChart from '$lib/components/charts/BarChart.svelte';
	import PieChart from '$lib/components/charts/PieChart.svelte';
	import LineChart from '$lib/components/charts/LineChart.svelte';
	import RealtimeBarChart from '$lib/components/charts/RealtimeBarChart.svelte';
	import RealtimePieChart from '$lib/components/charts/RealtimePieChart.svelte';
	import RealtimeLineChart from '$lib/components/charts/RealtimeLineChart.svelte';
	import QuadBubbles from '$lib/charts/QuadBubbles.svelte';
	import MaturityDial from '$lib/charts/MaturityDial.svelte';
	import ParticipationPulse from '$lib/charts/ParticipationPulse.svelte';
	import InclusivityMeter from '$lib/charts/InclusivityMeter.svelte';
	import RiskImpactMatrix from '$lib/charts/RiskImpactMatrix.svelte';
	import PhaseCharts from '$lib/components/PhaseCharts.svelte';
	import { IconUsers, IconClock, IconSparkles, IconStar } from '@tabler/icons-svelte';
	import type { ComponentType } from 'svelte';
	import { getLeaderboard } from '$lib/gamification';

	export let data: { sessionCode: string };

	let selectedPhaseKey: string | null = null;

	let sessionCode = data.sessionCode ?? '';
	let joinCode = sessionCode;
	let activeCode = '';
	let ready = false;
	let availableSessions: any[] = [];
	let loadingSessions = false;

	type BoardId =
		| 'phase'
		| 'responses'
		| 'heatmap'
		| 'roadmap'
		| 'barChart'
		| 'pieChart'
		| 'lineChart'
		| 'quadBubbles'
		| 'maturityDial'
		| 'participationPulse'
		| 'inclusivityMeter'
		| 'riskImpactMatrix'
		| 'leaderboard'
		| 'timeline'
		| 'chat';

	interface BoardDefinition {
		id: BoardId;
		label: string;
		description: string;
		layout: 'main' | 'side';
	}

	const BOARD_DEFINITIONS: Record<BoardId, BoardDefinition> = {
		phase: {
			id: 'phase',
			label: 'Phase Snapshot',
			description: 'Current focus, guidance, and what is coming up next.',
			layout: 'side'
		},
		responses: {
			id: 'responses',
			label: 'Response Landscape',
			description: 'Cluster and vote view of the collective ideas.',
			layout: 'main'
		},
		heatmap: {
			id: 'heatmap',
			label: 'Insight Heatmap',
			description: 'Lens × maturity intensity for the latest responses.',
			layout: 'main'
		},
		roadmap: {
			id: 'roadmap',
			label: 'Roadmap Swimlanes',
			description: 'Now / Next / Later commitments shaped in session.',
			layout: 'main'
		},
		barChart: {
			id: 'barChart',
			label: 'Bar Chart',
			description: 'Choice distribution visualization for single/multi-select questions.',
			layout: 'main'
		},
		pieChart: {
			id: 'pieChart',
			label: 'Pie Chart',
			description: 'Proportional distribution of choice responses.',
			layout: 'main'
		},
		lineChart: {
			id: 'lineChart',
			label: 'Line Chart',
			description: 'Distribution plot for scale/slider responses.',
			layout: 'main'
		},
		quadBubbles: {
			id: 'quadBubbles',
			label: CHART_REGISTRY.quadBubbles.title,
			description: CHART_REGISTRY.quadBubbles.description,
			layout: 'main'
		},
		maturityDial: {
			id: 'maturityDial',
			label: CHART_REGISTRY.maturityDial.title,
			description: CHART_REGISTRY.maturityDial.description,
			layout: 'side'
		},
		participationPulse: {
			id: 'participationPulse',
			label: CHART_REGISTRY.participationPulse.title,
			description: CHART_REGISTRY.participationPulse.description,
			layout: 'main'
		},
		inclusivityMeter: {
			id: 'inclusivityMeter',
			label: CHART_REGISTRY.inclusivityMeter.title,
			description: CHART_REGISTRY.inclusivityMeter.description,
			layout: 'side'
		},
		riskImpactMatrix: {
			id: 'riskImpactMatrix',
			label: CHART_REGISTRY.riskImpactMatrix.title,
			description: CHART_REGISTRY.riskImpactMatrix.description,
			layout: 'main'
		},
		leaderboard: {
			id: 'leaderboard',
			label: 'Leaderboard',
			description: 'Top contributors and their current points.',
			layout: 'side'
		},
		timeline: {
			id: 'timeline',
			label: 'Timeline Highlights',
			description: 'Milestones and decisions captured in real time.',
			layout: 'side'
		},
		chat: {
			id: 'chat',
			label: 'Arcade Chat',
			description: 'Latest shouts from the room.',
			layout: 'side'
		}
	};

	const BOARD_SEQUENCE: BoardId[] = [
		'phase',
		'responses',
		'timeline',
		'leaderboard',
		'barChart',
		'pieChart',
		'lineChart',
		'quadBubbles',
		'participationPulse',
		'heatmap',
		'roadmap',
		'riskImpactMatrix',
		'maturityDial',
		'inclusivityMeter',
		'chat'
	];

	const DEFAULT_ACTIVE_BOARDS: BoardId[] = [
		'phase',
		'responses',
		'quadBubbles',
		'heatmap',
		'leaderboard',
		'timeline',
		'chat'
	];

	const boardChartComponents: Partial<Record<BoardId, ComponentType>> = {
		quadBubbles: QuadBubbles,
		participationPulse: ParticipationPulse,
		riskImpactMatrix: RiskImpactMatrix,
		maturityDial: MaturityDial,
		inclusivityMeter: InclusivityMeter
	};

	const boardChartDimensions: Partial<Record<BoardId, { width: number; height: number }>> = {
		quadBubbles: {
			width: CHART_REGISTRY.quadBubbles.defaultWidth,
			height: CHART_REGISTRY.quadBubbles.defaultHeight
		},
		participationPulse: {
			width: CHART_REGISTRY.participationPulse.defaultWidth,
			height: CHART_REGISTRY.participationPulse.defaultHeight
		},
		riskImpactMatrix: {
			width: CHART_REGISTRY.riskImpactMatrix.defaultWidth,
			height: CHART_REGISTRY.riskImpactMatrix.defaultHeight
		},
		maturityDial: {
			width: CHART_REGISTRY.maturityDial.defaultWidth,
			height: CHART_REGISTRY.maturityDial.defaultHeight
		},
		inclusivityMeter: {
			width: CHART_REGISTRY.inclusivityMeter.defaultWidth,
			height: CHART_REGISTRY.inclusivityMeter.defaultHeight
		}
	};

	let activeBoards: BoardId[] = [];

	$: sessionInfo = $sessionDetails;
	$: participantsList = $participants ?? [];
	$: questionsList = $questions ?? [];
	$: responsesList = $responses ?? [];
	$: timelineList = $timeline ?? [];
	$: chatList = $chat ?? [];
	// Calculate leaderboard with actual points from responses
	$: leaderboardList = getLeaderboard(participantsList, responsesList, timelineList);
	$: phasesList = $phasesStore ?? [];
	$: isSessionLive = sessionInfo?.status === 'live';
	$: isSessionEnded = sessionInfo?.status === 'done';
	$: isSessionPlanned = sessionInfo?.status === 'planned';

	// Debug logging
	$: if (browser && activeCode) {
		console.log('[Presentation Data]', {
			sessionInfo,
			participants: participantsList.length,
			questions: questionsList.length,
			responses: responsesList.length,
			phases: phasesList.length,
			activePhase: activePhase?.phase_key || activePhase?.id,
			selectedPhaseKey,
			activeBoards: activeBoards.length,
			activeBoardsList: activeBoards
		});
	}

	$: activePhase = (() => {
		const keyed = sessionInfo?.active_phase_key
			? phasesList.find((phase) => phase.phase_key === sessionInfo.active_phase_key)
			: null;
		return keyed ?? phasesList.find((phase) => phase.status === 'active');
	})();

	// Auto-select active phase or first phase
	$: if (!selectedPhaseKey && (activePhase || phasesList.length > 0)) {
		selectedPhaseKey = activePhase?.phase_key || activePhase?.id || phasesList[0]?.phase_key || phasesList[0]?.id || null;
	}

	const phaseStatusLabels: Record<'pending' | 'active' | 'completed', string> = {
		pending: 'Pending',
		active: 'In Progress',
		completed: 'Completed'
	};

	$: responsesForViz = responsesList
		.filter((entry) => {
			// Filter responses by active phase
			if (!activePhase) return true;
			const question = questionsList.find((q) => q.id === entry.question_id);
			return question?.phase_key === activePhase.phase_key || (activePhase.status === 'active' && !question?.phase_key);
		})
		.map((entry) => {
			const question = questionsList.find((q) => q.id === entry.question_id);
			const author = participantsList.find((p) => p.id === entry.participant_id);
			return {
				...entry,
				lens: question?.lens || question?.section || 'Uncategorized',
				section: question?.section || 'General',
				participantName: author?.name ?? 'Anonymous',
				questionText: question?.text || ''
			};
		});

	$: phaseQuestions = activePhase
		? questionsList.filter(
				(q) =>
					q.phase_key === activePhase.phase_key ||
					(activePhase.status === 'active' && !q.phase_key)
			)
		: [];

	$: phaseResponses = phaseQuestions.length
		? responsesList.filter((r) => phaseQuestions.some((q) => q.id === r.question_id))
		: [];

	$: upcomingPhases = phasesList
		.filter((phase) => phase.status === 'pending' && phase.phase_key !== activePhase?.phase_key)
		.slice(0, 2);

	const isBoardId = (value: string): value is BoardId => value in BOARD_DEFINITIONS;

	function normalizeBoards(ids: string[]): BoardId[] {
		const unique = Array.from(new Set(ids.filter(isBoardId)));
		return BOARD_SEQUENCE.filter((id) => unique.includes(id));
	}

	// Dynamically determine available dashboards based on questions in active phase
	// This is the ONLY source of truth for what charts to display
	$: activeBoards = (() => {
		// Always show default boards if no active phase
		if (!activePhase) {
			return normalizeBoards(['phase', 'responses', 'timeline', 'leaderboard']);
		}

		const phaseQuestions = questionsList.filter(
			(q) => q.phase_key === activePhase.phase_key || (activePhase.status === 'active' && !q.phase_key)
		);

		const dashboards: string[] = [];

		// Collect dashboards from manually selected dashboards in Sanity
		phaseQuestions.forEach((q) => {
			// Check for field (supports both snake_case from DB and camelCase from Sanity)
			const selectedDashboards = q.recommendedDashboards || q.recommended_dashboards;
			
			if (Array.isArray(selectedDashboards) && selectedDashboards.length > 0) {
				selectedDashboards.forEach((d: string) => {
					if (!dashboards.includes(d)) {
						dashboards.push(d);
					}
				});
			}
		});

		// If no dashboards explicitly configured, auto-detect based on question types
		if (dashboards.length === 0 && phaseQuestions.length > 0) {
			// Always add phase info board
			dashboards.push('phase');
			
			// Add chart types based on response types
			phaseQuestions.forEach((q) => {
				const responseType = q.response_type || 'written';
				
				if (['singleChoice', 'multiSelect', 'multiple_choice', 'multiselect'].includes(responseType)) {
					if (!dashboards.includes('barChart')) dashboards.push('barChart');
					if (!dashboards.includes('pieChart')) dashboards.push('pieChart');
				} else if (responseType === 'scale') {
					if (!dashboards.includes('lineChart')) dashboards.push('lineChart');
				} else if (responseType === 'written' || responseType === 'text') {
					if (!dashboards.includes('heatmap')) dashboards.push('heatmap');
					if (!dashboards.includes('quadBubbles')) dashboards.push('quadBubbles');
				} else if (responseType === 'landscape' || q.map_type === 'landscape') {
					// Landscape charts will be in PhaseCharts
				}
			});
			
			// Always add engagement boards
			if (!dashboards.includes('leaderboard')) dashboards.push('leaderboard');
			if (!dashboards.includes('timeline')) dashboards.push('timeline');
		}

		// Absolute fallback if still empty
		if (dashboards.length === 0) {
			dashboards.push('phase', 'timeline', 'leaderboard');
		}

		return normalizeBoards(dashboards);
	})();

	// Helper function to validate if a dashboard should be shown based on available data
	function isDashboardValid(dashboardId: string, question: any, responses: any[], questions: any[]): boolean {
		const hasResponses = responses.some(r => r.question_id === question.id);
		const responseType = question.response_type || 'written';
		
		// Always valid dashboards
		if (['overview', 'timeline', 'chat', 'phase'].includes(dashboardId)) return true;
		
		// Participation/leaderboard need responses
		if (['leaderboard', 'participationPulse'].includes(dashboardId)) return hasResponses;
		
		// Bar chart for choice-based responses
		if (dashboardId === 'barChart') {
			return ['singleChoice', 'multiSelect'].includes(responseType) && hasResponses;
		}
		
		// Pie chart for choice-based responses
		if (dashboardId === 'pieChart') {
			return ['singleChoice', 'multiSelect'].includes(responseType) && hasResponses;
		}
		
		// Line chart for scale responses
		if (dashboardId === 'lineChart') {
			return responseType === 'scale' && hasResponses;
		}
		
		// Written response visualizations
		if (['heatmap', 'roadmap', 'quadBubbles'].includes(dashboardId)) {
			return responseType === 'written' && hasResponses;
		}
		
		// Landscape needs landscape response type
		if (dashboardId === 'response-landscape') {
			return responseType === 'landscape' && hasResponses;
		}
		
		// Scale visualizations
		if (['maturityDial'].includes(dashboardId)) {
			return responseType === 'scale' && hasResponses;
		}
		
		return true; // Default to showing if unknown type
	}

	$: mainBoards = activeBoards.filter((id) => BOARD_DEFINITIONS[id].layout === 'main');
	$: sideBoards = activeBoards.filter((id) => BOARD_DEFINITIONS[id].layout === 'side');

	function formatTimestamp(value: string | null) {
		if (!value) return '';
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return value;
		return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	}

	async function loadSession(code: string) {
		if (!code) return;
		console.log('[Presentation] loadSession called with code:', code);
		activeCode = code;
		console.log('[Presentation] activeCode set to:', activeCode);
		console.log('[Presentation] Starting realtime session...');
		await startRealtimeSession(code);
		console.log('[Presentation] Realtime session started');
		// Charts will automatically update via reactive statements
	}

	async function fetchAvailableSessions() {
		loadingSessions = true;
		try {
			const response = await fetch('/api/session/list?status=live,planned');
			const result = await response.json();
			if (result.success) {
				availableSessions = result.sessions;
			}
		} catch (error) {
			console.error('Failed to fetch sessions:', error);
		} finally {
			loadingSessions = false;
		}
	}

	function selectSession(code: string) {
		joinCode = code;
		sessionCode = code;
		loadSession(code);
	}

	onMount(async () => {
		console.log('[Presentation] Mounting with sessionCode:', sessionCode);
		ready = true;
		if (sessionCode) {
			console.log('[Presentation] Loading session:', sessionCode);
			await loadSession(sessionCode);
		} else {
			console.log('[Presentation] No session code, fetching available sessions');
			await fetchAvailableSessions();
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

<div class="presentation-shell min-h-screen text-ink">
	<header class="presentation-header border-b px-10 py-6 backdrop-blur">
		<div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
			<div class="space-y-2">
				<p class="text-xs uppercase tracking-[0.4em] text-brand">Session Broadcast</p>
				<h1 class="text-3xl font-semibold text-white">
					{sessionInfo?.title ?? 'Presentation Dashboard'}
					{#if activeCode}
						<span
							class="ml-3 rounded-full border border-cyan-400/40 px-3 py-1 text-xs uppercase tracking-[0.25em] text-cyan-200"
						>
							{activeCode}
						</span>
					{/if}
				</h1>
				<p class="text-sm text-ink-muted">
					Curated presentation boards that adapt to the active phase and facilitator preferences.
				</p>
				{#if activePhase}
					<div class="flex flex-wrap items-center gap-3 text-xs text-ink-muted">
						<span class="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 px-3 py-1">
							<IconSparkles class="h-3.5 w-3.5 text-brand" />
							<span>{phaseStatusLabels[activePhase.status]}</span>
						</span>
						{#if activePhase.title}
							<span class="rounded-full border border-slate-700 px-3 py-1">
								{activePhase.title}
							</span>
						{/if}
						{#if activePhase.duration_minutes}
							<span class="rounded-full border border-slate-700 px-3 py-1">
								{activePhase.duration_minutes} min focus
							</span>
						{/if}
					</div>
				{/if}
			</div>
			<form
				class="flex flex-wrap items-center gap-3"
				on:submit|preventDefault={handleStartPresentation}
			>
				<input
					class="w-48 rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-white placeholder:text-ink-2 focus:border-cyan-400 focus:outline-none"
					placeholder="Enter session code"
					bind:value={joinCode}
					maxlength="16"
				/>
				<button
					type="submit"
					class="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand"
				>
					{activeCode ? 'Switch session' : 'Start presentation'}
				</button>
			</form>
			<div class="flex items-center gap-6 text-sm text-ink-muted">
				<span class="inline-flex items-center gap-2"
					><IconUsers class="h-5 w-5" /> {participantsList.length} participants</span
				>
				<span class="inline-flex items-center gap-2">
					<IconClock class="h-5 w-5" />
					{#if isSessionLive}
						<span class="inline-flex items-center gap-2">
							<span class="h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
							<span class="text-green-400 font-semibold">Live</span>
						</span>
					{:else if isSessionEnded}
						<span class="text-slate-400">Session Ended</span>
					{:else if isSessionPlanned}
						<span class="text-cyan-400">Planned</span>
					{:else}
						<span>{sessionInfo?.status ?? 'waiting'}</span>
					{/if}
				</span>
			</div>
		</div>
	</header>

{#if !activeCode && ready}
		<div class="flex min-h-[60vh] items-center justify-center px-6">
			<div class="max-w-4xl w-full space-y-6">
				<div class="text-center space-y-4">
					<h2 class="text-2xl font-semibold text-white">Select a Session</h2>
					<p class="text-ink-muted">
						Choose from available sessions or enter a session code manually to begin the presentation.
					</p>
				</div>

				{#if loadingSessions}
					<div class="flex items-center justify-center py-12">
						<div class="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
					</div>
				{:else if availableSessions.length > 0}
					<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{#each availableSessions as session}
							<button
								type="button"
								on:click={() => selectSession(session.code)}
								class="group presentation-panel rounded-2xl border border-cyan-400/20 bg-slate-900/70 p-6 text-left transition hover:border-cyan-400/60 hover:bg-slate-900"
							>
								<div class="flex items-center justify-between mb-3">
									<span class="font-mono text-lg font-semibold text-brand">{session.code}</span>
									<span class="rounded-full border border-slate-700 px-2 py-1 text-xs uppercase text-ink-muted">
										{session.status}
									</span>
								</div>
								<h3 class="text-lg font-semibold text-white mb-2 line-clamp-2">
									{session.title || 'Untitled Session'}
								</h3>
								{#if session.focus}
									<p class="text-sm text-ink-muted line-clamp-2 mb-3">
										{session.focus}
									</p>
								{/if}
								<div class="flex items-center gap-2 text-xs text-ink-2">
									<IconUsers class="h-4 w-4" />
									<span>{session.participant_count || 0} participants</span>
								</div>
							</button>
						{/each}
					</div>
				{:else}
					<div class="presentation-panel rounded-2xl border border-slate-700 bg-slate-900/60 p-8 text-center">
						<p class="text-ink-muted">No active sessions found. Enter a code manually below.</p>
					</div>
				{/if}

				<div class="pt-6 border-t border-slate-700">
					<p class="text-center text-sm text-ink-muted mb-4">Or enter a session code manually:</p>
					<form
						class="flex items-center justify-center gap-3"
						on:submit|preventDefault={handleStartPresentation}
					>
						<input
							class="w-64 rounded-lg border border-slate-700 bg-slate-900/80 px-4 py-2 text-white placeholder:text-ink-2 focus:border-cyan-400 focus:outline-none"
							placeholder="Enter session code"
							bind:value={joinCode}
							maxlength="16"
						/>
						<button
							type="submit"
							class="rounded-lg bg-brand px-6 py-2 font-semibold text-ink transition-colors hover:bg-brand"
						>
							Start
						</button>
					</form>
				</div>
			</div>
		</div>
	{:else}
		<main class="mx-auto px-4 md:px-6 py-8" style="max-width: 95vw;">
			<!-- Session Status Notice -->
			{#if isSessionEnded}
				<div class="mb-6 rounded-xl border border-slate-700 bg-slate-900/80 p-4 shadow-lg">
					<div class="flex items-center gap-3">
						<div class="rounded-full bg-slate-800 p-2">
							<IconClock class="h-5 w-5 text-slate-400" />
						</div>
						<div>
							<h3 class="text-sm font-semibold text-slate-200">Session Ended</h3>
							<p class="text-xs text-slate-400">Showing final results from Supabase. Data is no longer updating in real-time.</p>
						</div>
					</div>
				</div>
			{:else if isSessionPlanned}
				<div class="mb-6 rounded-xl border border-cyan-400/30 bg-slate-900/80 p-4 shadow-lg">
					<div class="flex items-center gap-3">
						<div class="rounded-full bg-cyan-900/30 p-2">
							<IconClock class="h-5 w-5 text-cyan-400" />
						</div>
						<div>
							<h3 class="text-sm font-semibold text-cyan-200">Planned Session</h3>
							<p class="text-xs text-cyan-300/80">This session hasn't started yet. Data will update in real-time once the session goes live.</p>
						</div>
					</div>
				</div>
			{:else if isSessionLive}
				<div class="mb-6 rounded-xl border border-green-400/30 bg-slate-900/80 p-4 shadow-lg">
					<div class="flex items-center gap-3">
						<div class="rounded-full bg-green-900/30 p-2">
							<span class="h-2 w-2 rounded-full bg-green-400 animate-pulse inline-block"></span>
						</div>
						<div>
							<h3 class="text-sm font-semibold text-green-200">Live Session</h3>
							<p class="text-xs text-green-300/80">Data is updating in real-time as participants engage.</p>
						</div>
					</div>
				</div>
			{/if}

			<!-- Phase Navigation -->
			{#if phasesList.length > 0}
				<nav class="mb-6 flex flex-wrap gap-2">
					{#each phasesList as phase}
						<button
							on:click={() => (selectedPhaseKey = phase.phase_key || phase.id)}
							class="rounded-lg px-4 py-2 text-sm font-medium transition-colors {selectedPhaseKey === (phase.phase_key || phase.id)
								? 'bg-brand text-white'
								: 'bg-surface-muted text-secondary hover:bg-surface-elevated'}"
						>
							{phase.title || phase.phase_key || 'Phase'}
							{#if phase.status === 'active'}
								<span class="ml-2 inline-block h-2 w-2 rounded-full bg-green-400"></span>
							{/if}
						</button>
					{/each}
				</nav>
			{/if}

			{#if activeBoards.length === 0}
				<div class="presentation-panel rounded-2xl border border-slate-700 bg-slate-900/60 p-10 text-center">
					<div class="space-y-4">
						<h3 class="text-lg font-semibold text-slate-200">Waiting for content...</h3>
						<div class="space-y-2 text-sm text-ink-muted">
							<p>
								Charts will appear when:
							</p>
							<ul class="list-disc list-inside space-y-1 text-left max-w-md mx-auto">
								<li>Questions are added to the session</li>
								<li>Phases are created and activated</li>
								<li>Participants submit responses</li>
							</ul>
							<p class="mt-4 text-xs">
								Debug: {questionsList.length} questions, {responsesList.length} responses, 
								{phasesList.length} phases, activePhase: {activePhase?.title || 'none'}
							</p>
						</div>
					</div>
				</div>
			{:else}
				<!-- Single column layout for better visibility -->
				<div class="space-y-6">
					<!-- Phase-based charts for selected phase -->
					{#if selectedPhaseKey && browser}
						<div class="presentation-panel rounded-2xl border border-cyan-400/20 bg-slate-900/70 p-6 shadow-[0_0_40px_rgba(6,182,212,0.2)]">
							<PhaseCharts phaseKey={selectedPhaseKey} width={1400} height={600} />
						</div>
					{/if}

					<!-- Legacy board types removed - using PhaseCharts instead -->
					{#each mainBoards as boardId}
							{#if boardId === 'heatmap'}
								<div
									class="presentation-panel rounded-2xl border border-purple-400/20 bg-slate-900/70 p-6 shadow-[0_0_40px_rgba(168,85,247,0.2)]"
								>
									<header class="mb-4">
										<h2 class="text-xl font-semibold text-slate-100">
											{BOARD_DEFINITIONS[boardId].label}
										</h2>
										<p class="text-sm text-ink-muted">
											{BOARD_DEFINITIONS[boardId].description}
										</p>
									</header>
									<div class="w-full h-[600px] overflow-hidden">
										<HeatmapChart responses={responsesForViz} width={1400} height={600} />
									</div>
								</div>
							{:else if boardId === 'roadmap'}
								<div
									class="presentation-panel rounded-2xl border border-emerald-400/20 bg-slate-900/70 p-6 shadow-[0_0_40px_rgba(16,185,129,0.2)]"
								>
									<header class="mb-4">
										<h2 class="text-xl font-semibold text-slate-100">
											{BOARD_DEFINITIONS[boardId].label}
										</h2>
										<p class="text-sm text-ink-muted">
											{BOARD_DEFINITIONS[boardId].description}
										</p>
									</header>
									<div class="w-full h-[600px] overflow-hidden">
										<RoadmapChart responses={responsesForViz} width={1400} height={600} />
									</div>
								</div>
							{:else if boardId === 'barChart'}
								{@const choiceQuestions = phaseQuestions.filter(q => ['singleChoice', 'multiSelect'].includes(q.response_type || ''))}
								{#if choiceQuestions.length > 0}
									<div
										class="presentation-panel rounded-2xl border border-blue-400/20 bg-slate-900/70 p-6 shadow-[0_0_40px_rgba(59,130,246,0.2)]"
									>
										<header class="mb-4">
											<h2 class="text-xl font-semibold text-slate-100">
												{BOARD_DEFINITIONS[boardId].label}
											</h2>
											<p class="text-sm text-ink-muted">
												{BOARD_DEFINITIONS[boardId].description}
											</p>
										</header>
										<div class="space-y-8">
											{#each choiceQuestions as question}
												<div class="space-y-3">
													<div class="flex items-center justify-between mb-2">
														<h3 class="text-sm font-medium text-slate-200">{question.text}</h3>
													</div>
													<RealtimeBarChart
														roomCode={activeCode}
														questionId={question.id}
														width={1400}
														height={Math.max(250, (question.options?.length || 3) * 70)}
													/>
												</div>
											{/each}
										</div>
									</div>
								{:else}
									<div class="presentation-panel rounded-2xl border border-slate-700 bg-slate-900/60 p-6 text-sm text-ink-muted">
										No choice-based questions in this phase.
									</div>
								{/if}
							{:else if boardId === 'pieChart'}
								{@const choiceQuestions = phaseQuestions.filter(q => ['singleChoice', 'multiSelect'].includes(q.response_type || ''))}
								{#if choiceQuestions.length > 0}
									<div
										class="presentation-panel rounded-2xl border border-purple-400/20 bg-slate-900/70 p-6 shadow-[0_0_40px_rgba(168,85,247,0.2)]"
									>
										<header class="mb-4">
											<h2 class="text-xl font-semibold text-slate-100">
												{BOARD_DEFINITIONS[boardId].label}
											</h2>
											<p class="text-sm text-ink-muted">
												{BOARD_DEFINITIONS[boardId].description}
											</p>
										</header>
										<div class="space-y-6">
											{#each choiceQuestions as question}
												<div class="space-y-4">
													<div class="flex items-center justify-between">
														<h3 class="text-sm font-medium text-slate-200">{question.text}</h3>
													</div>
													<RealtimePieChart
														roomCode={activeCode}
														questionId={question.id}
														width={1200}
														height={500}
														showLegend={true}
													/>
												</div>
											{/each}
										</div>
									</div>
								{:else}
									<div class="presentation-panel rounded-2xl border border-slate-700 bg-slate-900/60 p-6 text-sm text-ink-muted">
										No choice-based questions in this phase.
									</div>
								{/if}
							{:else if boardId === 'lineChart'}
								{@const scaleQuestions = phaseQuestions.filter(q => q.response_type === 'scale')}
								{#if scaleQuestions.length > 0}
									<div
										class="presentation-panel rounded-2xl border border-emerald-400/20 bg-slate-900/70 p-6 shadow-[0_0_40px_rgba(16,185,129,0.2)]"
									>
										<header class="mb-4">
											<h2 class="text-xl font-semibold text-slate-100">
												{BOARD_DEFINITIONS[boardId].label}
											</h2>
											<p class="text-sm text-ink-muted">
												{BOARD_DEFINITIONS[boardId].description}
											</p>
										</header>
										<div class="space-y-6">
											{#each scaleQuestions as question}
												<div class="space-y-4">
													<div class="flex items-center justify-between">
														<h3 class="text-sm font-medium text-slate-200">{question.text}</h3>
													</div>
													<RealtimeLineChart
														roomCode={activeCode}
														questionId={question.id}
														width={1400}
														height={450}
													/>
												</div>
											{/each}
										</div>
									</div>
								{:else}
									<div class="presentation-panel rounded-2xl border border-slate-700 bg-slate-900/60 p-6 text-sm text-ink-muted">
										No scale questions in this phase.
									</div>
								{/if}
								{:else if boardId === 'quadBubbles' || boardId === 'participationPulse' || boardId === 'riskImpactMatrix'}
									{#if activeCode}
										{@const component = boardChartComponents[boardId]}
										{@const dimensions =
											boardChartDimensions[boardId] ?? { width: 1400, height: 700 }}
										<div class="presentation-panel rounded-2xl border border-cyan-400/20 bg-slate-900/70 p-6">
											<header class="mb-4">
												<h2 class="text-xl font-semibold text-slate-100">
													{BOARD_DEFINITIONS[boardId].label}
												</h2>
												<p class="text-sm text-ink-muted">
													{BOARD_DEFINITIONS[boardId].description}
												</p>
											</header>
											{#if component}
												<div class="w-full overflow-hidden" style="height: {dimensions.height}px">
													<svelte:component
														this={component}
														roomCode={activeCode}
														width={dimensions.width}
														height={dimensions.height}
													/>
												</div>
											{:else}
												<p class="text-sm text-ink-muted">
													This chart is unavailable for the current session.
												</p>
											{/if}
										</div>
									{:else}
										<div class="presentation-panel rounded-2xl border border-slate-700 bg-slate-900/60 p-6 text-sm text-ink-muted">
											Connect to a session to stream the {BOARD_DEFINITIONS[boardId].label}.
										</div>
									{/if}
								{:else if boardId === 'maturityDial' || boardId === 'inclusivityMeter'}
									<!-- Render compact realtime charts in the main column when promoted -->
									{#if activeCode}
										{@const component = boardChartComponents[boardId]}
										{@const dimensions =
											boardChartDimensions[boardId] ?? { width: 420, height: 420 }}
										<div class="presentation-panel rounded-2xl border border-slate-700 bg-slate-900/70 p-6">
											<header class="mb-4">
												<h2 class="text-xl font-semibold text-slate-100">
													{BOARD_DEFINITIONS[boardId].label}
												</h2>
												<p class="text-sm text-ink-muted">
													{BOARD_DEFINITIONS[boardId].description}
												</p>
											</header>
											{#if component}
												<div class="w-full overflow-hidden" style="height: {dimensions.height}px">
													<svelte:component
														this={component}
														roomCode={activeCode}
														width={dimensions.width}
														height={dimensions.height}
													/>
												</div>
											{:else}
												<p class="text-sm text-ink-muted">
													This chart is unavailable for the current session.
												</p>
											{/if}
										</div>
									{:else}
										<div class="presentation-panel rounded-2xl border border-slate-700 bg-slate-900/60 p-6 text-sm text-ink-muted">
											Connect to a session to stream the {BOARD_DEFINITIONS[boardId].label}.
										</div>
								{/if}
							{/if}
					{/each}

					<!-- Engagement boards (previously in sidebar) -->
					{#each sideBoards as boardId}
							{#if boardId === 'phase'}
								<div class="presentation-panel rounded-2xl border border-cyan-400/20 bg-slate-900/70 p-6 space-y-4">
									<header class="flex items-center justify-between">
										<h3 class="text-lg font-semibold text-white">
											{BOARD_DEFINITIONS[boardId].label}
										</h3>
										{#if activePhase}
											<span class="rounded-full border border-cyan-400/30 px-3 py-1 text-xs text-cyan-200">
												{phaseStatusLabels[activePhase.status]}
											</span>
										{/if}
									</header>
									{#if activePhase}
										<div class="space-y-3 text-sm text-ink-muted">
											{#if activePhase.description}
												<p class="leading-relaxed">{activePhase.description}</p>
											{/if}
											<div class="flex flex-wrap gap-2 text-xs text-ink-muted">
												<span class="rounded border border-slate-700 px-2 py-0.5">
													{phaseQuestions.length} focus questions
												</span>
												<span class="rounded border border-slate-700 px-2 py-0.5">
													{phaseResponses.length} responses linked
												</span>
												{#if phaseResponses.length}
													<span class="rounded border border-slate-700 px-2 py-0.5">
														{phaseResponses.reduce((sum, r) => sum + (r.votes || 0), 0)} total votes
													</span>
												{/if}
											</div>
											{#if activePhase.cards?.length}
												<div>
													<p class="text-xs uppercase tracking-[0.3em] text-cyan-200">
														Anchoring cards
													</p>
													<ul class="mt-2 space-y-2">
														{#each activePhase.cards.slice(0, 3) as card}
															<li class="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
																<p class="text-sm font-medium text-white">{card.title}</p>
																{#if card.description}
																	<p class="mt-1 text-xs text-ink-muted line-clamp-2">
																		{card.description}
																	</p>
																{/if}
															</li>
														{/each}
													</ul>
													{#if activePhase.cards.length > 3}
														<p class="mt-2 text-xs text-ink-2">
															+{activePhase.cards.length - 3} more cards in this phase
														</p>
													{/if}
												</div>
											{/if}
											{#if upcomingPhases.length}
												<div>
													<p class="text-xs uppercase tracking-[0.3em] text-ink-muted">
														Coming up
													</p>
													<ul class="mt-2 space-y-2">
														{#each upcomingPhases as phase}
															<li class="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
																<p class="text-sm font-semibold text-white">
																	{phase.title ?? phase.phase_key ?? 'Phase'}
																</p>
																{#if phase.duration_minutes}
																	<p class="text-xs text-ink-muted">
																		{phase.duration_minutes} minute block
																	</p>
																{/if}
															</li>
														{/each}
													</ul>
												</div>
											{/if}
										</div>
									{:else}
										<p class="text-sm text-ink-muted">
											No phase is active yet. Activate a phase from the facilitator console to surface
											context here.
										</p>
									{/if}
								</div>
							{:else if boardId === 'leaderboard'}
								<div class="presentation-panel rounded-2xl border border-cyan-400/20 bg-slate-900/70 p-6">
									<header class="mb-4 flex items-center justify-between">
										<h3 class="text-lg font-semibold text-white">
											{BOARD_DEFINITIONS[boardId].label}
										</h3>
										<IconStar class="h-4 w-4 text-amber-400" />
									</header>
									{#if leaderboardList.length > 0}
										<div class="space-y-3">
											{#each leaderboardList.slice(0, 6) as participant, index}
												<div class="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2">
													<div class="flex items-center gap-2">
														<span class="text-xs font-bold text-brand">#{index + 1}</span>
														<span class="text-sm text-white truncate max-w-[140px]"
															>{participant.name ?? 'Participant'}</span
														>
													</div>
													<span class="text-xs text-cyan-200">{participant.points ?? 0} pts</span>
												</div>
											{/each}
										</div>
									{:else}
										<p class="text-sm text-ink-muted">Waiting for the first contributions.</p>
									{/if}
								</div>
							{:else if boardId === 'timeline'}
								<div class="presentation-panel rounded-2xl border border-slate-700 bg-slate-900/70 p-6">
									<h3 class="text-lg font-semibold text-white">
										{BOARD_DEFINITIONS[boardId].label}
									</h3>
									<p class="text-xs text-ink-2">
										{BOARD_DEFINITIONS[boardId].description}
									</p>
									<div class="mt-4 max-h-64 space-y-3 overflow-y-auto pr-1">
										{#if timelineList.length}
											{#each timelineList.slice().reverse() as item}
												<div class="rounded-lg border border-slate-800 bg-slate-900/80 p-3">
													<div class="flex items-center justify-between text-xs text-ink-muted">
														<span>{item.label}</span>
														<span>{formatTimestamp(item.created_at)}</span>
													</div>
													<p class="mt-2 text-sm text-slate-200">{item.item_text}</p>
													{#if item.owner}
														<p class="mt-1 text-xs text-ink-2">Owner: {item.owner}</p>
													{/if}
												</div>
											{/each}
										{:else}
											<p class="text-sm text-ink-muted">No timeline entries yet.</p>
										{/if}
									</div>
								</div>
							{:else if boardId === 'chat'}
								<div class="presentation-panel rounded-2xl border border-slate-700 bg-slate-900/70 p-6">
									<h3 class="text-lg font-semibold text-white">
										{BOARD_DEFINITIONS[boardId].label}
									</h3>
									<p class="text-xs text-ink-2">
										{BOARD_DEFINITIONS[boardId].description}
									</p>
									<div class="mt-4 max-h-64 space-y-3 overflow-y-auto pr-1">
										{#if chatList.length}
											{#each chatList.slice().reverse() as entry}
												<div class="rounded-lg border border-slate-800 bg-slate-900/80 p-3">
													<p class="text-xs text-ink-muted">
														{participantsList.find((p) => p.id === entry.participant_id)?.name ??
														'Anonymous'} · {formatTimestamp(entry.created_at)}
													</p>
													<p class="mt-1 text-sm text-slate-200">{entry.message}</p>
												</div>
											{/each}
										{:else}
											<p class="text-sm text-ink-muted">The chat feed will appear here live.</p>
										{/if}
									</div>
								</div>
								{:else if boardId === 'maturityDial' || boardId === 'inclusivityMeter'}
									{#if activeCode}
										{@const component = boardChartComponents[boardId]}
										{@const dimensions =
											boardChartDimensions[boardId] ?? { width: 360, height: 360 }}
										<div class="presentation-panel rounded-2xl border border-slate-700 bg-slate-900/70 p-6">
											<header class="mb-4">
												<h3 class="text-lg font-semibold text-white">
													{BOARD_DEFINITIONS[boardId].label}
												</h3>
												<p class="text-xs text-ink-2">
													{BOARD_DEFINITIONS[boardId].description}
												</p>
											</header>
											{#if component}
												<div class="w-full overflow-hidden" style="height: {dimensions.height}px">
													<svelte:component
														this={component}
														roomCode={activeCode}
														width={dimensions.width}
														height={dimensions.height}
													/>
												</div>
											{:else}
												<p class="text-sm text-ink-muted">
													This chart is unavailable for the current session.
												</p>
											{/if}
										</div>
									{:else}
										<div class="presentation-panel rounded-2xl border border-slate-700 bg-slate-900/60 p-6 text-sm text-ink-muted">
											Connect to a session to stream the {BOARD_DEFINITIONS[boardId].label}.
										</div>
									{/if}
								{/if}
							{/if}
						{/each}
				</div>
			{/if}
		</main>
	{/if}
	</div>

<style>
	.presentation-shell {
		background: linear-gradient(180deg, hsl(var(--surface)) 0%, hsl(var(--surface-elevated)) 50%, #ffffff 100%);
		color: hsl(var(--text-secondary));
	}

	.presentation-header {
		background: hsl(var(--surface-elevated) / 0.92);
		border-color: hsl(var(--border-subtle));
		box-shadow: 0 12px 45px rgba(15, 23, 42, 0.08);
		color: inherit;
	}

	.presentation-header h1,
	.presentation-header p,
	.presentation-header span {
		color: hsl(var(--text-primary));
	}

	.presentation-shell :global(.presentation-panel) {
		background: hsl(var(--surface-elevated));
		border-color: hsl(var(--border-subtle));
		box-shadow: 0 18px 55px rgba(15, 23, 42, 0.08);
		color: hsl(var(--text-secondary));
	}

	.presentation-shell :global(.presentation-panel h2),
	.presentation-shell :global(.presentation-panel h3),
	.presentation-shell :global(.presentation-panel h4) {
		color: hsl(var(--text-primary));
	}

	.presentation-shell :global(.presentation-panel p),
	.presentation-shell :global(.presentation-panel span),
	.presentation-shell :global(.presentation-panel li) {
		color: hsl(var(--text-secondary));
	}

	.presentation-shell input,
	.presentation-shell textarea,
	.presentation-shell select {
		background: hsl(var(--surface-elevated));
		border: 1px solid hsl(var(--border-subtle));
		box-shadow: 0 12px 32px rgba(15, 23, 42, 0.07);
		color: hsl(var(--text-primary));
	}

	.presentation-shell input::placeholder,
	.presentation-shell textarea::placeholder {
		color: hsl(var(--text-muted));
	}

	.presentation-shell :global(.bg-slate-900\/80),
	.presentation-shell :global(.bg-slate-900\/70),
	.presentation-shell :global(.bg-slate-900\/60),
	.presentation-shell :global(.bg-slate-900\/50),
	.presentation-shell :global(.bg-slate-900\/40) {
		background: hsl(var(--surface-elevated) / 0.95) !important;
		color: hsl(var(--text-secondary)) !important;
	}

	.presentation-shell :global(.bg-slate-800\/60),
	.presentation-shell :global(.bg-slate-800\/50) {
		background: hsl(var(--surface-muted) / 0.9) !important;
		color: hsl(var(--text-secondary)) !important;
	}

	.presentation-shell :global(.border-slate-800),
	.presentation-shell :global(.border-slate-700),
	.presentation-shell :global(.border-slate-600) {
		border-color: hsl(var(--border-subtle)) !important;
	}
</style>
