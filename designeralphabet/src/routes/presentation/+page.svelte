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
	let qrSrc = '';
	let activeCode = '';
	let ready = false;
	let userCustomizedBoards = false;

	type BoardId =
		| 'phase'
		| 'responses'
		| 'heatmap'
		| 'roadmap'
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

	$: responsesForViz = responsesList.map((entry) => {
		const question = questionsList.find((q) => q.id === entry.question_id);
		const author = participantsList.find((p) => p.id === entry.participant_id);
		return {
			...entry,
			lens: question?.section ?? 'Unknown',
			participantName: author?.name ?? 'Anonymous'
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

	$: recommendedBoards = normalizeBoards(activePhase?.dashboards ?? []);
	$: fallbackBoards = normalizeBoards(DEFAULT_ACTIVE_BOARDS);

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
		await stopRealtimeSession();
		await startRealtimeSession(code);
		activeCode = code;
		userCustomizedBoards = false;
		activeBoards = [];
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
			<div class="max-w-xl space-y-4 text-center">
				<h2 class="text-2xl font-semibold text-white">Begin a presentation</h2>
				<p class="text-slate-400">
					Enter the session code shared by your facilitator. Once connected, curate the boards you
					want to project and the system will live-stream responses, votes, and engagement metrics.
				</p>
			</div>
		</div>
	{:else}
		<main class="px-10 py-8">
			{#if activeBoards.length === 0}
				<div class="rounded-2xl border border-slate-700 bg-slate-900/60 p-10 text-center text-sm text-slate-300">
					Choose at least one board from the controls above to start the broadcast layout.
				</div>
			{:else}
				<div class="grid gap-8 lg:grid-cols-[3fr_1.3fr]">
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
									<QuadBubbleChart responses={responsesForViz} width={960} height={540} />
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
									<HeatmapChart responses={responsesForViz} width={960} height={480} />
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
									<RoadmapChart responses={responsesForViz} width={960} height={500} />
								</div>
								{:else if boardId === 'quadBubbles' || boardId === 'participationPulse' || boardId === 'riskImpactMatrix'}
									{#if activeCode}
										{@const component = boardChartComponents[boardId]}
										{@const dimensions =
											boardChartDimensions[boardId] ?? { width: 960, height: 540 }}
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
												<svelte:component
													this={component}
													roomCode={activeCode}
													width={dimensions.width}
													height={dimensions.height}
												/>
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
												<svelte:component
													this={component}
													roomCode={activeCode}
													width={dimensions.width}
													height={dimensions.height}
												/>
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
							<h3 class="text-lg font-semibold text-white">Join the Session</h3>
							<p class="text-sm text-slate-400">
								Scan the QR code or visit <span class="font-mono text-cyan-200">/join</span> and enter the
								code.
							</p>
							{#if qrSrc}
								<div class="mt-6 flex justify-center">
									<img
										class="h-48 w-48 rounded-2xl border border-slate-700 bg-white p-3"
										alt="Join session QR"
										src={qrSrc}
									/>
								</div>
							{/if}
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
												<svelte:component
													this={component}
													roomCode={activeCode}
													width={dimensions.width}
													height={dimensions.height}
												/>
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
