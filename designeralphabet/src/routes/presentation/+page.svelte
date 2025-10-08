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
		// startRealtimeSession,
		// stopRealtimeSession
	} from '$lib/realtime';
	import { CHART_REGISTRY } from '$lib/charts';
	import QuadBubbleChart from '$lib/components/charts/QuadBubbleChart.svelte';
	import HeatmapChart from '$lib/components/charts/HeatmapChart.svelte';
	import RoadmapChart from '$lib/components/charts/RoadmapChart.svelte';
	import BarChart from '$lib/components/charts/BarChart.svelte';
	import PieChart from '$lib/components/charts/PieChart.svelte';
	import LineChart from '$lib/components/charts/LineChart.svelte';
	import QuadBubbles from '$lib/charts/QuadBubbles.svelte';
	import MaturityDial from '$lib/charts/MaturityDial.svelte';
	import ParticipationPulse from '$lib/charts/ParticipationPulse.svelte';
	import InclusivityMeter from '$lib/charts/InclusivityMeter.svelte';
	import RiskImpactMatrix from '$lib/charts/RiskImpactMatrix.svelte';
	import { IconUsers, IconClock, IconAdjustments, IconSparkles, IconStar } from '@tabler/icons-svelte';
	import type { ComponentType } from 'svelte';

	export let data: { sessionCode: string };

	let sessionCode = data.sessionCode ?? '';
	let joinCode = sessionCode;
	let activeCode = '';
	let ready = false;
	let userCustomizedBoards = false;
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
		'leaderboard',
		'timeline',
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
	$: leaderboardList = $leaderboard ?? [];
	$: phasesList = $phasesStore ?? [];

	$: activePhase = (() => {
		const keyed = sessionInfo?.active_phase_key
			? phasesList.find((phase) => phase.phase_key === sessionInfo.active_phase_key)
			: null;
		return keyed ?? phasesList.find((phase) => phase.status === 'active');
	})();

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

	function arraysEqual(a: BoardId[], b: BoardId[]): boolean {
		return a.length === b.length && a.every((value, index) => value === b[index]);
	}

	// Dynamically determine available dashboards based on questions in active phase
	$: recommendedBoards = (() => {
		if (!activePhase) return normalizeBoards([]);

		const phaseQuestions = questionsList.filter(
			(q) => q.phase_key === activePhase.phase_key || (activePhase.status === 'active' && !q.phase_key)
		);

		const dashboards: string[] = ['phase'];

		// Collect dashboards ONLY from manually selected dashboards in Sanity
		phaseQuestions.forEach((q) => {
			// Check for field (supports both snake_case from DB and camelCase from Sanity)
			const selectedDashboards = q.recommendedDashboards || q.recommended_dashboards;
			
			if (Array.isArray(selectedDashboards) && selectedDashboards.length > 0) {
				selectedDashboards.forEach((d: string) => {
					// Validate that the dashboard has required data before adding
					if (!dashboards.includes(d) && isDashboardValid(d, q, responsesList, phaseQuestions)) {
						dashboards.push(d);
					}
				});
			}
		});

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
	
	// Filter fallback boards to only show those with valid data
	$: fallbackBoards = (() => {
		if (!activePhase) return normalizeBoards(['phase']); // Only show phase when no active phase
		
		const phaseQuestions = questionsList.filter(
			(q) => q.phase_key === activePhase.phase_key || (activePhase.status === 'active' && !q.phase_key)
		);
		
		// Filter default boards to only include those with valid data
		const validBoards = DEFAULT_ACTIVE_BOARDS.filter((boardId) => {
			// Always show phase, timeline, and chat
			if (['phase', 'timeline', 'chat'].includes(boardId)) return true;
			
			// For data-dependent boards, check if ANY question validates this board
			return phaseQuestions.some(q => isDashboardValid(boardId, q, responsesList, phaseQuestions));
		});
		
		return normalizeBoards(validBoards);
	})();

	$: if (!userCustomizedBoards) {
		const combined = normalizeBoards([...recommendedBoards, ...fallbackBoards]);
		if (!arraysEqual(combined, activeBoards)) {
			activeBoards = combined;
		}
	}

	$: mainBoards = activeBoards.filter((id) => BOARD_DEFINITIONS[id].layout === 'main');
	$: sideBoards = activeBoards.filter((id) => BOARD_DEFINITIONS[id].layout === 'side');

	function toggleBoard(boardId: BoardId) {
		userCustomizedBoards = true;
		if (activeBoards.includes(boardId)) {
			activeBoards = activeBoards.filter((id) => id !== boardId);
		} else {
			activeBoards = normalizeBoards([...activeBoards, boardId]);
		}
	}

	function boardIsRecommended(boardId: BoardId) {
		return recommendedBoards.includes(boardId);
	}

	function formatTimestamp(value: string | null) {
		if (!value) return '';
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return value;
		return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	}

	async function loadSession(code: string) {
		if (!code) return;
		// await stopRealtimeSession();
		// await startRealtimeSession(code);
		activeCode = code;
		userCustomizedBoards = false;
		activeBoards = [];
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
		ready = true;
		if (sessionCode) {
			await loadSession(sessionCode);
		} else {
			await fetchAvailableSessions();
		}
	});

	onDestroy(() => {
		// stopRealtimeSession();
	});

	async function handleStartPresentation(event: Event) {
		event.preventDefault();
		if (!joinCode.trim()) return;
		sessionCode = joinCode.trim().toUpperCase();
		await loadSession(sessionCode);
	}
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
	<header class="border-b border-cyan-400/20 bg-slate-950/80 px-10 py-6 backdrop-blur">
		<div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
			<div class="space-y-2">
				<p class="text-xs uppercase tracking-[0.4em] text-cyan-300">Session Broadcast</p>
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
				<p class="text-sm text-slate-300">
					Curated presentation boards that adapt to the active phase and facilitator preferences.
				</p>
				{#if activePhase}
					<div class="flex flex-wrap items-center gap-3 text-xs text-slate-400">
						<span class="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 px-3 py-1">
							<IconSparkles class="h-3.5 w-3.5 text-cyan-300" />
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
					class="w-48 rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
					placeholder="Enter session code"
					bind:value={joinCode}
					maxlength="16"
				/>
				<button
					type="submit"
					class="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-900 transition-colors hover:bg-cyan-400"
				>
					{activeCode ? 'Switch session' : 'Start presentation'}
				</button>
			</form>
			<div class="flex items-center gap-6 text-sm text-slate-300">
				<span class="inline-flex items-center gap-2"
					><IconUsers class="h-5 w-5" /> {participantsList.length} participants</span
				>
				<span class="inline-flex items-center gap-2"
					><IconClock class="h-5 w-5" /> {sessionInfo?.status ?? 'waiting'}</span
				>
			</div>
		</div>

		<div class="mt-6 rounded-2xl border border-cyan-400/20 bg-slate-900/70 p-4">
			<div class="flex flex-wrap items-center justify-between gap-4">
				<div class="flex items-center gap-2 text-sm font-semibold text-cyan-200 uppercase tracking-[0.25em]">
					<IconAdjustments class="h-4 w-4" />
					Live Layout Controls
				</div>
				<div class="flex flex-wrap gap-2">
					{#each BOARD_SEQUENCE as boardId}
						{#if BOARD_DEFINITIONS[boardId]}
							<button
								type="button"
								class={`rounded-full border px-3 py-1 text-xs transition ${
									activeBoards.includes(boardId)
										? 'border-cyan-300 bg-cyan-500/20 text-cyan-100'
										: 'border-slate-700 text-slate-400 hover:border-cyan-400/40 hover:text-cyan-200'
								} ${boardIsRecommended(boardId) ? 'shadow-[0_0_20px_rgba(45,212,191,0.25)]' : ''}`}
								on:click={() => toggleBoard(boardId)}
							>
								{BOARD_DEFINITIONS[boardId].label}
								{#if boardIsRecommended(boardId)}
									<span class="ml-2 rounded bg-cyan-400/20 px-1.5 py-0.5 text-[10px] text-cyan-100"
										>phase</span
									>
								{/if}
							</button>
						{/if}
					{/each}
				</div>
			</div>
		</div>
	</header>

	{#if !activeCode && ready}
		<div class="flex min-h-[60vh] items-center justify-center px-6">
			<div class="max-w-4xl w-full space-y-6">
				<div class="text-center space-y-4">
					<h2 class="text-2xl font-semibold text-white">Select a Session</h2>
					<p class="text-slate-400">
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
								class="group rounded-2xl border border-cyan-400/20 bg-slate-900/70 p-6 text-left transition hover:border-cyan-400/60 hover:bg-slate-900"
							>
								<div class="flex items-center justify-between mb-3">
									<span class="font-mono text-lg font-semibold text-cyan-300">{session.code}</span>
									<span class="rounded-full border border-slate-700 px-2 py-1 text-xs uppercase text-slate-400">
										{session.status}
									</span>
								</div>
								<h3 class="text-lg font-semibold text-white mb-2 line-clamp-2">
									{session.title || 'Untitled Session'}
								</h3>
								{#if session.focus}
									<p class="text-sm text-slate-400 line-clamp-2 mb-3">
										{session.focus}
									</p>
								{/if}
								<div class="flex items-center gap-2 text-xs text-slate-500">
									<IconUsers class="h-4 w-4" />
									<span>{session.participant_count || 0} participants</span>
								</div>
							</button>
						{/each}
					</div>
				{:else}
					<div class="rounded-2xl border border-slate-700 bg-slate-900/60 p-8 text-center">
						<p class="text-slate-400">No active sessions found. Enter a code manually below.</p>
					</div>
				{/if}

				<div class="pt-6 border-t border-slate-700">
					<p class="text-center text-sm text-slate-400 mb-4">Or enter a session code manually:</p>
					<form
						class="flex items-center justify-center gap-3"
						on:submit|preventDefault={handleStartPresentation}
					>
						<input
							class="w-64 rounded-lg border border-slate-700 bg-slate-900/80 px-4 py-2 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
							placeholder="Enter session code"
							bind:value={joinCode}
							maxlength="16"
						/>
						<button
							type="submit"
							class="rounded-lg bg-cyan-500 px-6 py-2 font-semibold text-slate-900 transition-colors hover:bg-cyan-400"
						>
							Start
						</button>
					</form>
				</div>
			</div>
		</div>
	{:else}
		<main class="mx-auto px-4 md:px-6 py-8" style="max-width: 95vw;">
			{#if activeBoards.length === 0}
				<div class="rounded-2xl border border-slate-700 bg-slate-900/60 p-10 text-center text-sm text-slate-300">
					Choose at least one board from the controls above to start the broadcast layout.
				</div>
			{:else}
				<div class="grid gap-6 lg:grid-cols-[2.5fr_1fr]">
					<section class="space-y-8">
						{#each mainBoards as boardId}
							{#if boardId === 'responses'}
								<div
									class="rounded-2xl border border-cyan-400/20 bg-slate-900/70 p-6 shadow-[0_0_40px_rgba(6,182,212,0.2)]"
								>
									<header class="mb-4 flex items-center justify-between">
										<div>
											<h2 class="text-xl font-semibold text-slate-100">
												{BOARD_DEFINITIONS[boardId].label}
											</h2>
											<p class="text-sm text-slate-400">
												{BOARD_DEFINITIONS[boardId].description}
											</p>
										</div>
										<span class="rounded-full border border-cyan-400/30 px-3 py-1 text-xs text-cyan-200">
											{responsesList.length} responses
										</span>
									</header>
									<div class="w-full h-[600px] overflow-hidden">
										<QuadBubbleChart responses={responsesForViz} width={1200} height={600} />
									</div>
								</div>
							{:else if boardId === 'heatmap'}
								<div
									class="rounded-2xl border border-purple-400/20 bg-slate-900/70 p-6 shadow-[0_0_40px_rgba(168,85,247,0.2)]"
								>
									<header class="mb-4">
										<h2 class="text-xl font-semibold text-slate-100">
											{BOARD_DEFINITIONS[boardId].label}
										</h2>
										<p class="text-sm text-slate-400">
											{BOARD_DEFINITIONS[boardId].description}
										</p>
									</header>
									<div class="w-full h-[560px] overflow-hidden">
										<HeatmapChart responses={responsesForViz} width={1200} height={560} />
									</div>
								</div>
							{:else if boardId === 'roadmap'}
								<div
									class="rounded-2xl border border-emerald-400/20 bg-slate-900/70 p-6 shadow-[0_0_40px_rgba(16,185,129,0.2)]"
								>
									<header class="mb-4">
										<h2 class="text-xl font-semibold text-slate-100">
											{BOARD_DEFINITIONS[boardId].label}
										</h2>
										<p class="text-sm text-slate-400">
											{BOARD_DEFINITIONS[boardId].description}
										</p>
									</header>
									<div class="w-full h-[580px] overflow-hidden">
										<RoadmapChart responses={responsesForViz} width={1200} height={580} />
									</div>
								</div>
							{:else if boardId === 'barChart'}
								{@const choiceQuestions = phaseQuestions.filter(q => ['singleChoice', 'multiSelect'].includes(q.response_type || ''))}
								{#if choiceQuestions.length > 0}
									<div
										class="rounded-2xl border border-blue-400/20 bg-slate-900/70 p-6 shadow-[0_0_40px_rgba(59,130,246,0.2)]"
									>
										<header class="mb-4">
											<h2 class="text-xl font-semibold text-slate-100">
												{BOARD_DEFINITIONS[boardId].label}
											</h2>
											<p class="text-sm text-slate-400">
												{BOARD_DEFINITIONS[boardId].description}
											</p>
										</header>
										<div class="space-y-8">
											{#each choiceQuestions as question}
												{@const questionResponses = responsesList.filter(r => r.question_id === question.id)}
												{@const options = question.options || []}
												{@const responseCounts = options.map(option => ({
													option,
													count: questionResponses.filter(r => {
														try {
															const value = typeof r.value === 'string' ? JSON.parse(r.value) : r.value;
															return Array.isArray(value) ? value.includes(option) : value === option;
														} catch {
															return r.value === option;
														}
													}).length
												}))}
												{@const totalResponses = responseCounts.reduce((sum, rc) => sum + rc.count, 0)}
												{@const chartData = responseCounts.map(({option, count}) => ({
													label: option,
													value: count,
													percentage: totalResponses > 0 ? (count / totalResponses) * 100 : 0
												}))}

												<div class="space-y-3">
													<div class="flex items-center justify-between mb-2">
														<h3 class="text-sm font-medium text-slate-200">{question.text}</h3>
														<div class="text-xs text-slate-400">
															<span class="font-semibold text-cyan-300">{totalResponses}</span> total responses
														</div>
													</div>
													<BarChart
														data={chartData}
														question={question.text}
														totalResponses={totalResponses}
														width={1200}
														height={Math.max(200, chartData.length * 60)}
													/>
												</div>
											{/each}
										</div>
									</div>
								{:else}
									<div class="rounded-2xl border border-slate-700 bg-slate-900/60 p-6 text-sm text-slate-400">
										No choice-based questions in this phase.
									</div>
								{/if}
							{:else if boardId === 'pieChart'}
								{@const choiceQuestions = phaseQuestions.filter(q => ['singleChoice', 'multiSelect'].includes(q.response_type || ''))}
								{#if choiceQuestions.length > 0}
									<div
										class="rounded-2xl border border-purple-400/20 bg-slate-900/70 p-6 shadow-[0_0_40px_rgba(168,85,247,0.2)]"
									>
										<header class="mb-4">
											<h2 class="text-xl font-semibold text-slate-100">
												{BOARD_DEFINITIONS[boardId].label}
											</h2>
											<p class="text-sm text-slate-400">
												{BOARD_DEFINITIONS[boardId].description}
											</p>
										</header>
										<div class="space-y-8">
											{#each choiceQuestions as question}
												{@const questionResponses = responsesList.filter(r => r.question_id === question.id)}
												{@const options = question.options || []}
												{@const responseCounts = options.map(option => ({
													option,
													count: questionResponses.filter(r => {
														try {
															const value = typeof r.value === 'string' ? JSON.parse(r.value) : r.value;
															return Array.isArray(value) ? value.includes(option) : value === option;
														} catch {
															return r.value === option;
														}
													}).length
												})).filter(rc => rc.count > 0)}
												{@const totalCount = responseCounts.reduce((sum, rc) => sum + rc.count, 0)}
												{@const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#6366f1', '#f43f5e']}
												{@const radius = 90}
												{@const centerX = 100}
												{@const centerY = 100}
												
												<div class="space-y-4">
													<div class="flex items-center justify-between">
														<h3 class="text-sm font-medium text-slate-200">{question.text}</h3>
														<div class="text-xs text-slate-400">
															<span class="font-semibold text-purple-300">{totalCount}</span> total responses
														</div>
													</div>
													{#if totalCount > 0}
														<div class="flex items-start gap-8">
															<!-- Pie Chart SVG -->
															<div class="flex-shrink-0">
																<svg viewBox="0 0 200 200" class="w-52 h-52">
																	{#each responseCounts as {option, count}, i}
																		{@const percentage = (count / totalCount) * 100}
																		{@const startAngle = responseCounts.slice(0, i).reduce((sum, rc) => sum + (rc.count / totalCount) * 360, 0)}
																		{@const endAngle = startAngle + (count / totalCount) * 360}
																		{@const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0}
																		{@const startX = centerX + radius * Math.cos((startAngle - 90) * Math.PI / 180)}
																		{@const startY = centerY + radius * Math.sin((startAngle - 90) * Math.PI / 180)}
																		{@const endX = centerX + radius * Math.cos((endAngle - 90) * Math.PI / 180)}
																		{@const endY = centerY + radius * Math.sin((endAngle - 90) * Math.PI / 180)}
																		
																		<path
																			d="M {centerX} {centerY} L {startX} {startY} A {radius} {radius} 0 {largeArcFlag} 1 {endX} {endY} Z"
																			fill={colors[i % colors.length]}
																			stroke="#1e293b"
																			stroke-width="2"
																			class="transition-all duration-300 hover:opacity-80"
																		>
																			<title>{option}: {count} ({percentage.toFixed(1)}%)</title>
																		</path>
																	{/each}
																	<!-- Center circle for donut effect -->
																	<circle cx={centerX} cy={centerY} r="50" fill="#0f172a" />
																	<text x={centerX} y={centerY - 5} text-anchor="middle" class="text-2xl font-bold fill-slate-100">
																		{totalCount}
																	</text>
																	<text x={centerX} y={centerY + 15} text-anchor="middle" class="text-xs fill-slate-400">
																		responses
																	</text>
																</svg>
															</div>
															
															<!-- Legend -->
															<div class="flex-1 space-y-1">
																<div class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
																	Distribution
																</div>
																{#each responseCounts as {option, count}, i}
																	{@const percentage = ((count / totalCount) * 100).toFixed(1)}
																	<div class="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/50 transition-colors">
																		<div class="w-3 h-3 rounded-sm flex-shrink-0" style="background-color: {colors[i % colors.length]}"></div>
																		<div class="flex-1 text-sm text-slate-300 truncate" title={option}>{option}</div>
																		<div class="text-sm font-semibold text-slate-200 tabular-nums">
																			{count}
																		</div>
																		<div class="w-14 text-right text-xs text-slate-400 tabular-nums">
																			{percentage}%
																		</div>
																	</div>
																{/each}
															</div>
														</div>
													{:else}
														<p class="text-sm text-slate-400">No responses yet</p>
													{/if}
												</div>
											{/each}
										</div>
									</div>
								{:else}
									<div class="rounded-2xl border border-slate-700 bg-slate-900/60 p-6 text-sm text-slate-400">
										No choice-based questions in this phase.
									</div>
								{/if}
							{:else if boardId === 'lineChart'}
								{@const scaleQuestions = phaseQuestions.filter(q => q.response_type === 'scale')}
								{#if scaleQuestions.length > 0}
									<div
										class="rounded-2xl border border-emerald-400/20 bg-slate-900/70 p-6 shadow-[0_0_40px_rgba(16,185,129,0.2)]"
									>
										<header class="mb-4">
											<h2 class="text-xl font-semibold text-slate-100">
												{BOARD_DEFINITIONS[boardId].label}
											</h2>
											<p class="text-sm text-slate-400">
												{BOARD_DEFINITIONS[boardId].description}
											</p>
										</header>
										<div class="space-y-8">
											{#each scaleQuestions as question}
												{@const questionResponses = responsesList.filter(r => r.question_id === question.id)}
												{@const scaleSettings = question.scale || { min: 0, max: 10, minLabel: 'Min', maxLabel: 'Max' }}
												{@const minValue = scaleSettings.min || 0}
												{@const maxValue = scaleSettings.max || 10}
												{@const range = maxValue - minValue}
												
												<!-- Create data points: for each unique value, count occurrences -->
												{@const valueCounts = new Map()}
												{#each questionResponses as response}
													{@const value = typeof response.value === 'string' ? parseFloat(response.value) : response.value}
													{#if !isNaN(value)}
														{@const count = valueCounts.get(value) || 0}
														{#each [valueCounts.set(value, count + 1)] as _}<!-- side effect -->{/each}
													{/if}
												{/each}
												
												{@const dataPoints = Array.from(valueCounts.entries()).map(([value, count]) => ({ value, count })).sort((a, b) => a.value - b.value)}
												{@const maxCount = Math.max(...dataPoints.map(d => d.count), 1)}
												{@const totalResponses = dataPoints.reduce((sum, d) => sum + d.count, 0)}
												
												<div class="space-y-4">
													<div class="flex items-center justify-between">
														<h3 class="text-sm font-medium text-slate-200">{question.text}</h3>
														<div class="text-xs text-slate-400">
															<span class="font-semibold text-emerald-300">{totalResponses}</span> responses
														</div>
													</div>
													
													{#if dataPoints.length > 0}
														{@const pathData = dataPoints.map((point, i) => {
															const x = range > 0 ? ((point.value - minValue) / range) * 100 : 0;
															const y = 100 - ((point.count / maxCount) * 100);
															return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
														}).join(' ')}
														
														<!-- Chart container -->
														<div class="relative w-full h-64 bg-slate-800/30 rounded-xl p-4">
															<!-- Y-axis labels -->
															<div class="absolute left-0 top-0 bottom-8 w-8 flex flex-col justify-between text-xs text-slate-400 text-right pr-2">
																<span>{maxCount}</span>
																<span>{Math.floor(maxCount / 2)}</span>
																<span>0</span>
															</div>
															
															<!-- Chart area -->
															<div class="ml-10 mr-4 h-full relative">
																<svg viewBox="0 0 100 100" preserveAspectRatio="none" class="w-full h-full absolute inset-0">
																	<!-- Grid lines -->
																	<line x1="0" y1="0" x2="100" y2="0" stroke="#334155" stroke-width="0.5" />
																	<line x1="0" y1="50" x2="100" y2="50" stroke="#334155" stroke-width="0.5" />
																	<line x1="0" y1="100" x2="100" y2="100" stroke="#334155" stroke-width="0.5" />
																	
																	<!-- Line path -->
																	<path
																		d={pathData}
																		fill="none"
																		stroke="#10b981"
																		stroke-width="2"
																		class="transition-all duration-300"
																	/>
																	
																	<!-- Data points -->
																	{#each dataPoints as point}
																		{@const x = range > 0 ? ((point.value - minValue) / range) * 100 : 0}
																		{@const y = 100 - ((point.count / maxCount) * 100)}
																		<circle
																			cx={x}
																			cy={y}
																			r="3"
																			fill="#10b981"
																			stroke="#0f172a"
																			stroke-width="1.5"
																			class="transition-all duration-300 hover:r-4"
																		>
																			<title>{point.value}: {point.count} response{point.count !== 1 ? 's' : ''}</title>
																		</circle>
																	{/each}
																</svg>
															</div>
															
															<!-- X-axis labels -->
															<div class="ml-10 mr-4 mt-2 flex justify-between text-xs text-slate-400">
																<div class="flex flex-col items-start">
																	<span class="font-semibold">{minValue}</span>
																	{#if scaleSettings.minLabel}
																		<span class="text-[10px] text-slate-500">{scaleSettings.minLabel}</span>
																	{/if}
																</div>
																<div class="flex flex-col items-center">
																	<span class="font-semibold">{Math.floor((minValue + maxValue) / 2)}</span>
																</div>
																<div class="flex flex-col items-end">
																	<span class="font-semibold">{maxValue}</span>
																	{#if scaleSettings.maxLabel}
																		<span class="text-[10px] text-slate-500">{scaleSettings.maxLabel}</span>
																	{/if}
																</div>
															</div>
														</div>
														
														<!-- Data summary -->
														<div class="flex flex-wrap gap-2 text-xs">
															{#each dataPoints as point}
																<div class="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full">
																	<span class="font-semibold text-emerald-300">{point.value}</span>
																	<span class="text-slate-400">→</span>
																	<span class="text-slate-300">{point.count} response{point.count !== 1 ? 's' : ''}</span>
																</div>
															{/each}
														</div>
													{:else}
														<p class="text-sm text-slate-400">No responses yet</p>
													{/if}
												</div>
											{/each}
										</div>
									</div>
								{:else}
									<div class="rounded-2xl border border-slate-700 bg-slate-900/60 p-6 text-sm text-slate-400">
										No scale questions in this phase.
									</div>
								{/if}
								{:else if boardId === 'quadBubbles' || boardId === 'participationPulse' || boardId === 'riskImpactMatrix'}
									{#if activeCode}
										{@const component = boardChartComponents[boardId]}
										{@const dimensions =
											boardChartDimensions[boardId] ?? { width: 1200, height: 600 }}
										<div class="rounded-2xl border border-cyan-400/20 bg-slate-900/70 p-6">
											<header class="mb-4">
												<h2 class="text-xl font-semibold text-slate-100">
													{BOARD_DEFINITIONS[boardId].label}
												</h2>
												<p class="text-sm text-slate-400">
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
												<p class="text-sm text-slate-400">
													This chart is unavailable for the current session.
												</p>
											{/if}
										</div>
									{:else}
										<div class="rounded-2xl border border-slate-700 bg-slate-900/60 p-6 text-sm text-slate-300">
											Connect to a session to stream the {BOARD_DEFINITIONS[boardId].label}.
										</div>
									{/if}
								{:else if boardId === 'maturityDial' || boardId === 'inclusivityMeter'}
									<!-- Render compact realtime charts in the main column when promoted -->
									{#if activeCode}
										{@const component = boardChartComponents[boardId]}
										{@const dimensions =
											boardChartDimensions[boardId] ?? { width: 420, height: 420 }}
										<div class="rounded-2xl border border-slate-700 bg-slate-900/70 p-6">
											<header class="mb-4">
												<h2 class="text-xl font-semibold text-slate-100">
													{BOARD_DEFINITIONS[boardId].label}
												</h2>
												<p class="text-sm text-slate-400">
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
												<p class="text-sm text-slate-400">
													This chart is unavailable for the current session.
												</p>
											{/if}
										</div>
									{:else}
										<div class="rounded-2xl border border-slate-700 bg-slate-900/60 p-6 text-sm text-slate-300">
											Connect to a session to stream the {BOARD_DEFINITIONS[boardId].label}.
										</div>
								{/if}
							{/if}
						{/each}
					</section>

					<aside class="space-y-8">
						<div class="rounded-2xl border border-cyan-400/20 bg-slate-900/70 p-6">
							<h3 class="text-lg font-semibold text-white">Session Dashboard</h3>
							<p class="text-sm text-slate-400">
								View detailed analytics and controls for this session.
							</p>
							<div class="mt-6 flex justify-center">
								<a
									href="/dashboard"
									class="w-full rounded-lg bg-cyan-500 px-6 py-3 text-center text-sm font-semibold text-slate-900 transition-colors hover:bg-cyan-400"
								>
									Go to Dashboard
								</a>
							</div>
							<p class="mt-3 text-center text-sm font-semibold text-cyan-200">Code: {activeCode}</p>
						</div>

						{#each sideBoards as boardId}
							{#if boardId === 'phase'}
								<div class="rounded-2xl border border-cyan-400/20 bg-slate-900/70 p-6 space-y-4">
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
										<div class="space-y-3 text-sm text-slate-300">
											{#if activePhase.description}
												<p class="leading-relaxed">{activePhase.description}</p>
											{/if}
											<div class="flex flex-wrap gap-2 text-xs text-slate-400">
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
																	<p class="mt-1 text-xs text-slate-400 line-clamp-2">
																		{card.description}
																	</p>
																{/if}
															</li>
														{/each}
													</ul>
													{#if activePhase.cards.length > 3}
														<p class="mt-2 text-xs text-slate-500">
															+{activePhase.cards.length - 3} more cards in this phase
														</p>
													{/if}
												</div>
											{/if}
											{#if upcomingPhases.length}
												<div>
													<p class="text-xs uppercase tracking-[0.3em] text-slate-400">
														Coming up
													</p>
													<ul class="mt-2 space-y-2">
														{#each upcomingPhases as phase}
															<li class="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
																<p class="text-sm font-semibold text-white">
																	{phase.title ?? phase.phase_key ?? 'Phase'}
																</p>
																{#if phase.duration_minutes}
																	<p class="text-xs text-slate-400">
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
										<p class="text-sm text-slate-400">
											No phase is active yet. Activate a phase from the facilitator console to surface
											context here.
										</p>
									{/if}
								</div>
							{:else if boardId === 'leaderboard'}
								<div class="rounded-2xl border border-cyan-400/20 bg-slate-900/70 p-6">
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
														<span class="text-xs font-bold text-cyan-300">#{index + 1}</span>
														<span class="text-sm text-white truncate max-w-[140px]"
															>{participant.name ?? 'Participant'}</span
														>
													</div>
													<span class="text-xs text-cyan-200">{participant.points ?? 0} pts</span>
												</div>
											{/each}
										</div>
									{:else}
										<p class="text-sm text-slate-400">Waiting for the first contributions.</p>
									{/if}
								</div>
							{:else if boardId === 'timeline'}
								<div class="rounded-2xl border border-slate-700 bg-slate-900/70 p-6">
									<h3 class="text-lg font-semibold text-white">
										{BOARD_DEFINITIONS[boardId].label}
									</h3>
									<p class="text-xs text-slate-500">
										{BOARD_DEFINITIONS[boardId].description}
									</p>
									<div class="mt-4 max-h-64 space-y-3 overflow-y-auto pr-1">
										{#if timelineList.length}
											{#each timelineList.slice().reverse() as item}
												<div class="rounded-lg border border-slate-800 bg-slate-900/80 p-3">
													<div class="flex items-center justify-between text-xs text-slate-400">
														<span>{item.label}</span>
														<span>{formatTimestamp(item.created_at)}</span>
													</div>
													<p class="mt-2 text-sm text-slate-200">{item.item_text}</p>
													{#if item.owner}
														<p class="mt-1 text-xs text-slate-500">Owner: {item.owner}</p>
													{/if}
												</div>
											{/each}
										{:else}
											<p class="text-sm text-slate-400">No timeline entries yet.</p>
										{/if}
									</div>
								</div>
							{:else if boardId === 'chat'}
								<div class="rounded-2xl border border-slate-700 bg-slate-900/70 p-6">
									<h3 class="text-lg font-semibold text-white">
										{BOARD_DEFINITIONS[boardId].label}
									</h3>
									<p class="text-xs text-slate-500">
										{BOARD_DEFINITIONS[boardId].description}
									</p>
									<div class="mt-4 max-h-64 space-y-3 overflow-y-auto pr-1">
										{#if chatList.length}
											{#each chatList.slice().reverse() as entry}
												<div class="rounded-lg border border-slate-800 bg-slate-900/80 p-3">
													<p class="text-xs text-slate-400">
														{participantsList.find((p) => p.id === entry.participant_id)?.name ??
														'Anonymous'} · {formatTimestamp(entry.created_at)}
													</p>
													<p class="mt-1 text-sm text-slate-200">{entry.message}</p>
												</div>
											{/each}
										{:else}
											<p class="text-sm text-slate-400">The chat feed will appear here live.</p>
										{/if}
									</div>
								</div>
								{:else if boardId === 'maturityDial' || boardId === 'inclusivityMeter'}
									{#if activeCode}
										{@const component = boardChartComponents[boardId]}
										{@const dimensions =
											boardChartDimensions[boardId] ?? { width: 360, height: 360 }}
										<div class="rounded-2xl border border-slate-700 bg-slate-900/70 p-6">
											<header class="mb-4">
												<h3 class="text-lg font-semibold text-white">
													{BOARD_DEFINITIONS[boardId].label}
												</h3>
												<p class="text-xs text-slate-500">
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
												<p class="text-sm text-slate-400">
													This chart is unavailable for the current session.
												</p>
											{/if}
										</div>
									{:else}
										<div class="rounded-2xl border border-slate-700 bg-slate-900/60 p-6 text-sm text-slate-300">
											Connect to a session to stream the {BOARD_DEFINITIONS[boardId].label}.
										</div>
									{/if}
								{/if}
							{/each}
						</aside>
				</div>
			{/if}
		</main>
	{/if}
</div>
