<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { onDestroy, onMount } from 'svelte';
	import {
		sessionDetails,
		participants,
		questions,
		responses,
		timeline,
		chat,
		// leaderboard, // use computed leaderboard for accurate scores
		startRealtimeSession,
		stopRealtimeSession,
		addResponse as apiAddResponse,
		voteResponse as apiVoteResponse,
		addTimelineEntry as apiAddTimelineEntry,
		sendChatMessage as apiSendChatMessage,
		getParticipantProfile,
		storeParticipantProfile,
		clearParticipantProfile,
		refreshSession,
		phases as phasesStore,
		startPhase as startPhaseRequest,
		completePhase as completePhaseRequest
	} from '$lib/realtime';
	import { currentUser } from '$lib/stores/user';
	import RoadmapChart from '$lib/components/charts/RoadmapChart.svelte';
	import LandscapeChart from '$lib/components/charts/LandscapeChart.svelte';
	import WordCloudChart from '$lib/components/charts/WordCloudChart.svelte';
	// New immersive chart components
	import { loadChartComponent, CHART_REGISTRY, type ChartType } from '$lib/charts';
	import QuadBubbles from '$lib/charts/QuadBubbles.svelte';
	import MaturityDial from '$lib/charts/MaturityDial.svelte';
	import ParticipationPulse from '$lib/charts/ParticipationPulse.svelte';
	import InclusivityMeter from '$lib/charts/InclusivityMeter.svelte';
	// Response input components
	import RiskAssessmentInput from '$lib/components/responses/RiskAssessmentInput.svelte';
	import MaturityDialInput from '$lib/components/responses/MaturityDialInput.svelte';
	import InclusivityMeterInput from '$lib/components/responses/InclusivityMeterInput.svelte';
	import LandscapeInput from '$lib/components/responses/LandscapeInput.svelte';
	import RiskImpactMatrix from '$lib/charts/RiskImpactMatrix.svelte';
	import {
		IconUsers,
		IconClock,
		IconDownload,
		IconMessage,
		IconHome,
		IconMap,
		IconChartBubble,
		IconFlame,
		IconSend,
		IconPlus,
		IconThumbUp,
		IconGridDots,
		// IconCards, // Temporarily hidden - not usable with current exercise
		IconChartDots3,
		IconCloud
	} from '@tabler/icons-svelte';
	// import CardPanel from '$lib/components/session/CardPanel.svelte'; // Temporarily hidden - not usable with current exercise
	// import { createSessionCardStore } from '$lib/stores/sessionCards'; // Temporarily hidden - not usable with current exercise
	// import type { Card } from '$lib/Cards'; // Temporarily hidden - not usable with current exercise
	import PortableText from '$lib/components/PortableText.svelte';
	import { getLeaderboard } from '$lib/gamification';

	export let data: { sessionCode: string; role: string };

	const sessionCode = data.sessionCode ?? '';
	let currentParticipant: any = null;
	const activeRole = data.role ?? 'participant';
	let sessionLoading = true;
	let sessionError = '';

	let activeTab: 'overview' | 'heatmap' | 'roadmap' | 'wordcloud' | 'barChart' | 'pieChart' | 'lineChart' | 'response-landscape' | 'timeline' | 'chat' | 'participants' =
		'overview';
	let responseModalOpen = false;
	let selectedQuestionId: string | null = null;
	let responseText = '';
	let responseMetadata: any = null;
	// let linkedCardsText = ''; // Temporarily hidden - not usable with current exercise
	let currentQuestion: any = null;
	let currentQuestionConfig: Record<string, unknown> = {};
	let modalResponseType = 'written';
	let modalOptions: string[] = [];
	let scaleMin = 0;
	let scaleMax = 10;
	let scaleMinLabel = 'Min';
	let scaleMaxLabel = 'Max';
	let landscapeXLabel = 'X Axis';
	let landscapeYLabel = 'Y Axis';
	let landscapeMinX = 0;
	let landscapeMaxX = 10;
	let landscapeMinY = 0;
	let landscapeMaxY = 10;
	let landscapeLabel = '';
	let landscapeX = 5;
	let landscapeY = 5;

	let timelineModalOpen = false;
	let timelineLabel: 'Now' | 'Next' | 'Later' = 'Now';
	let timelineText = '';
	let timelineOwner = '';
	let timelineMetric = '';
	let timelineRisk = '';

	let chatMessage = '';

	// Round management variables
	let countdownTimer: ReturnType<typeof setInterval> | null = null;
	let roundUpdating = false;
	let roundCountdownLabel = '';
	let templateLoading = false;
	let templateError = '';
	let templateRounds: any[] = [];
	let customLabel = '';
	let customMinutes = 0;

	// New immersive dashboard variables
	let dashboardMode: 'classic' | 'immersive' = 'immersive';
	let activeCharts: ChartType[] = ['quadBubbles', 'participationPulse', 'inclusivityMeter'];
	let primaryChart: ChartType = 'quadBubbles';
	let sidebarCharts: ChartType[] = ['participationPulse', 'inclusivityMeter'];

	// Card integration - Temporarily hidden - not usable with current exercise
	// const cardStore = createSessionCardStore(sessionCode);
	// let selectedCards: Card[] = [];
	// let isCardPanelOpen = false;
	let isMobile = false;

	// Track user votes (stored in localStorage)
	let userVotes: Set<string> = new Set();

	// Subscribe to card store - Temporarily hidden - not usable with current exercise
	// $: selectedCards = $cardStore.selectedCards;
	// $: isCardPanelOpen = $cardStore.isCardPanelOpen;

	// Load user votes from localStorage
	$: if (browser && sessionCode) {
		const storedVotes = localStorage.getItem(`cda:votes:${sessionCode}`);
		if (storedVotes) {
			userVotes = new Set(JSON.parse(storedVotes));
		}
	}

	type SessionStatus = 'planned' | 'live' | 'done';

	const sessionStatuses: SessionStatus[] = ['planned', 'live', 'done'];
	const statusLabels: Record<SessionStatus, string> = {
		planned: 'Planned',
		live: 'In Session',
		done: 'Completed'
	};
	const phaseStatusLabels: Record<'pending' | 'active' | 'completed', string> = {
		pending: 'Pending',
		active: 'In Progress',
		completed: 'Completed'
	};
	const dashboardLabels: Record<string, string> = {
		responses: 'Responses Board',
		heatmap: 'Heatmap',
		roadmap: 'Roadmap',
		timeline: 'Timeline',
		leaderboard: 'Leaderboard',
		chat: 'Chat Feed'
	};

	let statusUpdating = false;
	let phaseUpdating = false;
	let phaseCountdownLabel = '';
	let phaseRemainingMs = 0;
	let phaseTimer: ReturnType<typeof setInterval> | null = null;

	$: sessionInfo = $sessionDetails;
	$: participantsList = $participants ?? [];
	$: questionsList = $questions ?? [];
	$: responsesList = $responses ?? [];
	$: timelineList = $timeline ?? [];
	$: chatList = $chat ?? [];
	// Compute leaderboard with actual points from responses
	$: leaderboardList = getLeaderboard(participantsList, responsesList, timelineList);
	$: isSessionLive = sessionInfo?.status === 'live';
	$: isSessionEnded = sessionInfo?.status === 'done';
	$: isSessionPlanned = sessionInfo?.status === 'planned';
	$: currentQuestion = questionsList.find((q) => q.id === selectedQuestionId) ?? null;
	$: currentQuestionConfig =
		(currentQuestion?.config as Record<string, unknown>) ?? {};
	$: modalResponseType = (currentQuestion?.response_type as string) ?? 'written';
	$: modalOptions = Array.isArray(
		(currentQuestionConfig as { options?: unknown[] }).options
	)
		? ((currentQuestionConfig as { options?: unknown[] }).options ?? []).filter(
				(option): option is string => typeof option === 'string' && option.trim().length > 0
			)
		: [];

	const numberOr = (value: unknown, fallback: number) =>
		typeof value === 'number'
			? value
			: typeof value === 'string' && value.trim() !== ''
				? Number(value)
				: fallback;

	const stringOr = (value: unknown, fallback: string) =>
		typeof value === 'string' && value.trim().length > 0 ? value : fallback;

	const parseLandscapeResponse = (value: string) => {
		if (!value) {
			return { x: 5, y: 5, label: '' };
		}

		try {
			const parsed = JSON.parse(value);
			return {
				x: numberOr(parsed?.x, 5),
				y: numberOr(parsed?.y, 5),
				label: stringOr(parsed?.label, '')
			};
		} catch {
			return { x: 5, y: 5, label: '' };
		}
	};

	const updateLandscapeResponse = () => {
		responseText = JSON.stringify({
			x: landscapeX,
			y: landscapeY,
			label: landscapeLabel
		});
	};

	const handleLandscapeLabelInput = (event: Event) => {
		const target = event.currentTarget;
		if (!(target instanceof HTMLInputElement)) return;
		landscapeLabel = target.value;
		updateLandscapeResponse();
	};

	const handleLandscapeAxisChange = (axis: 'x' | 'y', event: Event) => {
		const target = event.currentTarget;
		if (!(target instanceof HTMLInputElement)) return;
		const value = Number(target.value);
		if (Number.isNaN(value)) return;

		if (axis === 'x') {
			landscapeX = value;
		} else {
			landscapeY = value;
		}
		updateLandscapeResponse();
	};

	// Handler for advanced response components (riskAssessment, maturityDial, inclusivityMeter, landscape)
	function handleAdvancedResponseSubmit(event: CustomEvent<{ text: string; metadata: any }>) {
		responseText = event.detail.text;
		responseMetadata = event.detail.metadata;
		submitResponse();
	}

	$: {
		scaleMin = numberOr((currentQuestionConfig as { min?: unknown }).min, 0);
		scaleMax = numberOr((currentQuestionConfig as { max?: unknown }).max, 10);
		scaleMinLabel = stringOr(
			(currentQuestionConfig as { minLabel?: unknown }).minLabel,
			'Min'
		);
		scaleMaxLabel = stringOr(
			(currentQuestionConfig as { maxLabel?: unknown }).maxLabel,
			'Max'
		);
		landscapeXLabel = stringOr(
			(currentQuestionConfig as { xLabel?: unknown }).xLabel,
			'X Axis'
		);
		landscapeYLabel = stringOr(
			(currentQuestionConfig as { yLabel?: unknown }).yLabel,
			'Y Axis'
		);
		landscapeMinX = numberOr((currentQuestionConfig as { minX?: unknown }).minX, 0);
		landscapeMaxX = numberOr((currentQuestionConfig as { maxX?: unknown }).maxX, 10);
		landscapeMinY = numberOr((currentQuestionConfig as { minY?: unknown }).minY, 0);
		landscapeMaxY = numberOr((currentQuestionConfig as { maxY?: unknown }).maxY, 10);
		if (modalResponseType === 'landscape') {
			const coords = parseLandscapeResponse(responseText);
			landscapeLabel = coords.label;
			landscapeX = coords.x;
			landscapeY = coords.y;
			const serialized = JSON.stringify({
				x: landscapeX,
				y: landscapeY,
				label: landscapeLabel
			});
			if (responseText !== serialized) {
				responseText = serialized;
			}
		} else {
			landscapeLabel = '';
			landscapeX = 5;
			landscapeY = 5;
		}
	}

	// Turn off loading once session data arrives
	$: if ($sessionDetails && sessionLoading) {
		sessionLoading = false;
	}

	$: responsesForViz = responsesList
		.filter((entry) => {
			// Filter responses by active phase
			if (!activePhase) return true;
			const question = questionsList.find((q) => q.id === entry.question_id);
			return question?.phase_key === activePhase.phase_key || (activePhase.status === 'active' && !question?.phase_key);
		})
			.flatMap((entry) => {
				const question = questionsList.find((q) => q.id === entry.question_id);
				const author = participantsList.find((p) => p.id === entry.participant_id);

				// If this is a landscape/2d question, ensure metadata.x/y/label are present
				let metadata = entry.metadata ? { ...entry.metadata } : {};
				const isLandscape = (question?.type === 'landscape' || question?.type === '2d' || question?.chart === 'landscape');
				if (isLandscape) {
					// Try to parse from entry.text if not present
					if (typeof metadata.x !== 'number' || typeof metadata.y !== 'number') {
						try {
							const parsed = JSON.parse(entry.text);
							if (typeof parsed.x === 'number') metadata.x = parsed.x;
							if (typeof parsed.y === 'number') metadata.y = parsed.y;
							if (typeof parsed.label === 'string') metadata.label = parsed.label;
						} catch {}
					}
					// Fallback defaults
					if (typeof metadata.x !== 'number') metadata.x = 5;
					if (typeof metadata.y !== 'number') metadata.y = 5;
					if (typeof metadata.label !== 'string') metadata.label = entry.text?.slice(0, 30) || '';
				}

				const baseData = {
					...entry,
					metadata,
					lens: question?.lens || question?.section || 'Uncategorized',
					section: question?.section || 'General',
					participantName: author?.name ?? 'Anonymous',
					questionText: question?.text || ''
				};

				// Split multiple choice responses into separate entries
				const responseType = question?.response_type;
				if (['singleChoice', 'multiSelect', 'multiple_choice', 'multiselect'].includes(responseType || '')) {
					const choices = (entry.text || '').split(',').map(s => s.trim()).filter(s => s.length > 0);
					if (choices.length > 1) {
						// Multiple choices - create separate bubbles for each
						return choices.map((choice, idx) => ({
							...baseData,
							id: `${entry.id}-${idx}`,
							text: choice,
							// Distribute votes evenly across choices (or use 0 if no votes)
							votes: entry.votes ? Math.floor(entry.votes / choices.length) : 0
						}));
					}
				}

				// Single choice or non-choice question - keep as is
				return [baseData];
			});

	$: participantActivity = participantsList
		.map((participant) => {
			const participantResponses = responsesList.filter((r) => r.participant_id === participant.id);
			const totalVotes = participantResponses.reduce((sum, r) => sum + (r.votes || 0), 0);
			const participantChats = chatList.filter((c) => c.participant_id === participant.id);
			const participantTimeline = timelineList.filter((t) => t.owner === participant.name);

			// Calculate activity score based on various actions
			const activityScore =
				participantResponses.length * 10 +
				totalVotes * 2 +
				participantChats.length * 5 +
				participantTimeline.length * 15 +
				(participant.points || 0);

			// Determine last activity
			const allActivities = [
				...participantResponses.map((r) => ({ type: 'response', time: r.created_at })),
				...participantChats.map((c) => ({ type: 'chat', time: c.created_at })),
				...participantTimeline.map((t) => ({ type: 'timeline', time: t.created_at }))
			].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

			const lastActivity = allActivities[0];
			const timeSinceLastActivity = lastActivity
				? Date.now() - new Date(lastActivity.time).getTime()
				: Date.now() - new Date(participant.created_at).getTime();

			return {
				...participant,
				responseCount: participantResponses.length,
				totalVotes,
				chatCount: participantChats.length,
				timelineCount: participantTimeline.length,
				activityScore,
				lastActivity: lastActivity?.type || 'joined',
				lastActivityTime: lastActivity?.time || participant.created_at,
				minutesSinceActivity: Math.floor(timeSinceLastActivity / 60000),
				isRecent: timeSinceLastActivity < 300000 // 5 minutes
			};
		})
		.sort((a, b) => b.activityScore - a.activityScore);

	$: phasesList = $phasesStore ?? [];
	$: activePhase = (() => {
		const keyed = sessionInfo?.active_phase_key
			? phasesList.find((phase) => phase.phase_key === sessionInfo.active_phase_key)
			: null;
		return keyed ?? phasesList.find((phase) => phase.status === 'active');
	})();
	// Dynamically determine available dashboards based on questions in active phase
	$: availableDashboards = (() => {
		if (!activePhase) return ['roadmap', 'wordcloud', 'timeline', 'chat', 'participants'];

		const phaseQuestions = questionsList.filter(
			(q) => q.phase_key === activePhase.phase_key || (activePhase.status === 'active' && !q.phase_key)
		);

		const dashboards = new Set<string>(['timeline', 'chat', 'participants']);

		// Collect dashboards from question recommendations
		phaseQuestions.forEach((q) => {
			// Use recommended_dashboards if available
			if (Array.isArray(q.recommended_dashboards) && q.recommended_dashboards.length > 0) {
				q.recommended_dashboards.forEach((d: string) => dashboards.add(d));
			} else {
				// Fallback: infer from response type
				const responseType = q.response_type || 'written';
				if (responseType === 'written') {
					dashboards.add('roadmap');
					dashboards.add('wordcloud');
				} else if (responseType === 'landscape') {
					dashboards.add('response-landscape');
				}
			}
		});

		// Always available if there are responses
		if (responsesList.length > 0) {
			dashboards.add('leaderboard');
		}

		return Array.from(dashboards);
	})();

	$: recommendedDashboards = availableDashboards;

	function updatePhaseCountdown() {
		if (!browser) return;
		if (!activePhase || !activePhase.started_at || !activePhase.duration_minutes) {
			phaseCountdownLabel = '';
			phaseRemainingMs = 0;
			return;
		}
		const end = new Date(activePhase.started_at).getTime() + activePhase.duration_minutes * 60000;
		const diff = end - Date.now();
		phaseRemainingMs = Math.max(0, diff);
		const minutes = Math.floor(phaseRemainingMs / 60000);
		const seconds = Math.floor((phaseRemainingMs % 60000) / 1000);
		phaseCountdownLabel = `${minutes}:${seconds.toString().padStart(2, '0')}`;
		if (phaseRemainingMs <= 0 && phaseTimer) {
			clearInterval(phaseTimer);
			phaseTimer = null;
		}
	}

	$: if (browser) {
		if (phaseTimer) {
			clearInterval(phaseTimer);
			phaseTimer = null;
		}
		if (activePhase && activePhase.started_at && activePhase.duration_minutes) {
			updatePhaseCountdown();
			phaseTimer = setInterval(updatePhaseCountdown, 1000);
		} else {
			phaseCountdownLabel = '';
			phaseRemainingMs = 0;
		}
	}

	const isFacilitator = () =>
		currentParticipant?.role === 'facilitator' || activeRole === 'facilitator';

	const getPhaseStatusLabel = (status: string) => {
		return phaseStatusLabels[status as keyof typeof phaseStatusLabels] || status;
	};

	async function ensureProfile(): Promise<boolean> {
		if (!browser) return false;
		sessionLoading = true;
		sessionError = '';

		try {
			// Check for stored profile first
			const stored = getParticipantProfile(sessionCode);

			if (stored && stored.id) {
				// Profile exists locally - use it
				currentParticipant = {
					...stored,
					sessionCode: stored.sessionCode ?? sessionCode,
					id: stored.id ?? stored.participantId ?? stored.id
				};
				if (!currentParticipant.participantId && currentParticipant.id) {
					currentParticipant.participantId = currentParticipant.id;
				}
				currentUser.set(currentParticipant);
				storeParticipantProfile(sessionCode, currentParticipant);

				console.log('[Ensure Profile] Loaded participant from storage:', {
					id: currentParticipant.id,
					name: currentParticipant.name,
					role: currentParticipant.role
				});

				sessionLoading = false;
				return true;
			}

			// No local profile - check if user is already a participant in the database
			const response = await fetch(`/api/participants/${sessionCode}`);
			const data = await response.json();

			if (data.success && data.participants && data.participants.length > 0) {
				// User might be returning - show rejoin modal or redirect to join page
				console.log('[Ensure Profile] Found existing participants in DB, redirecting to join page');
				await goto(`/join?code=${sessionCode}`);
				return false;
			}

			// No profile found anywhere - redirect to join
			console.log('[Ensure Profile] No profile found, redirecting to join page');
			if (activeRole !== 'facilitator') {
				await goto(`/join?code=${sessionCode}`);
				return false;
			}
			sessionLoading = false;
			return true;
		} catch (error) {
			console.error('[Ensure Profile] Error checking participant profile:', error);
			sessionError = 'Failed to load session. Please try refreshing.';
			sessionLoading = false;
			return false;
		}
	}

	async function changeStatus(nextStatus: SessionStatus) {
		if (!sessionCode || sessionInfo?.status === nextStatus) return;
		statusUpdating = true;
		try {
			const res = await fetch('/api/session/status', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ code: sessionCode, status: nextStatus })
			});
			const payload = await res.json();
			if (!payload.success) {
				throw new Error(payload.error ?? 'Unable to update session status.');
			}
			await refreshSession(sessionCode);
		} catch (error) {
			console.error('Failed to update session status', error);
			alert((error as Error).message ?? 'Failed to update session status.');
		} finally {
			statusUpdating = false;
		}
	}

	async function activatePhase(phase: any) {
		if (!phase?.phase_key || phaseUpdating) return;
		phaseUpdating = true;
		try {
			const result = await startPhaseRequest(sessionCode, phase.phase_key);
			if (!result.success) {
				throw new Error(result.error ?? 'Unable to start phase');
			}
			await refreshSession(sessionCode);
		} catch (error) {
			console.error('Failed to start phase', error);
			alert((error as Error).message ?? 'Failed to start phase.');
		} finally {
			phaseUpdating = false;
		}
	}

	async function finishPhase(phase: any) {
		if (!phase?.phase_key || phaseUpdating) return;
		phaseUpdating = true;
		try {
			const result = await completePhaseRequest(sessionCode, phase.phase_key);
			if (!result.success) {
				throw new Error(result.error ?? 'Unable to complete phase');
			}
			await refreshSession(sessionCode);
		} catch (error) {
			console.error('Failed to complete phase', error);
			alert((error as Error).message ?? 'Failed to complete phase.');
		} finally {
			phaseUpdating = false;
		}
	}

	async function resetPhaseTimer(phase: any) {
		if (!phase?.phase_key) return;
		try {
			const res = await fetch('/api/session/phase', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					code: sessionCode,
					phaseKey: phase.phase_key,
					action: 'restart'
				})
			});
			const payload = await res.json();
			if (!payload.success) {
				throw new Error(payload.error ?? 'Unable to reset timer');
			}
			await refreshSession(sessionCode);
		} catch (error) {
			console.error('Failed to reset phase timer', error);
			alert((error as Error).message ?? 'Failed to reset phase timer.');
		}
	}

	let qrSrc = '';

	onMount(() => {
		let cleanup: (() => void) | undefined;

		(async () => {
			const ready = await ensureProfile();
			if (ready) {
				await startRealtimeSession(sessionCode);
			}
		})();

		if (browser) {
			const base = window.location.origin;
			qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${base}/join?code=${sessionCode}`)}`;
			if (currentParticipant) {
				storeParticipantProfile(sessionCode, {
					...currentParticipant,
					sessionCode
				});
			}

			// Detect mobile
			isMobile = window.innerWidth < 768;
			function handleResize() {
				isMobile = window.innerWidth < 768;
			}
			window.addEventListener('resize', handleResize);

			// Add keyboard shortcut for emergency exit (Ctrl/Cmd + Shift + E)
			function handleKeydown(event: KeyboardEvent) {
				if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'E') {
					event.preventDefault();
					leaveSession();
				}
			}

			document.addEventListener('keydown', handleKeydown);

			cleanup = () => {
				window.removeEventListener('resize', handleResize);
				document.removeEventListener('keydown', handleKeydown);
			};
		}

		return () => {
			cleanup?.();
		};
	});

	onDestroy(() => {
		stopRealtimeSession();
		if (phaseTimer) {
			clearInterval(phaseTimer);
			phaseTimer = null;
		}
		if (countdownTimer) {
			clearInterval(countdownTimer);
			countdownTimer = null;
		}
	});

	async function submitResponse() {
		const normalizedResponseText =
			typeof responseText === 'string'
				? responseText.trim()
				: responseText
					? JSON.stringify(responseText)
					: '';

		if (!selectedQuestionId || !normalizedResponseText) return;

		// CRITICAL: Validate participant exists before submission
		if (!currentParticipant || !currentParticipant.id) {
			console.error('[Submit Response] No participant ID found!', {
				currentParticipant,
				sessionCode,
				activeRole
			});
			alert('Error: You must join the session with a name before submitting responses. Please refresh and enter your name.');
			responseModalOpen = false;
			await goto(`/join?code=${sessionCode}`);
			return;
		}

		// Check if we're in an active phase with remaining time
		if (activePhase && !phaseRemainingMs) {
			alert('Time is up for this phase. Responses are no longer accepted.');
			return;
		}

		console.log('[Submit Response] Submitting with participant:', {
			participantId: currentParticipant.id,
			participantName: currentParticipant.name,
			questionId: selectedQuestionId
		});

		// Combine selected cards from panel with additional cards from text input - Temporarily hidden - not usable with current exercise
		// const selectedCardTitles = selectedCards.map((card) => card.title);
		// const additionalCards = linkedCardsText
		// 	.split(',')
		// 	.map((card) => card.trim())
		// 	.filter(Boolean);
		// const allCards = [...selectedCardTitles, ...additionalCards];

		await apiAddResponse(sessionCode, {
			questionId: selectedQuestionId,
			participantId: currentParticipant.id,
			text: normalizedResponseText,
			cards: [], // Temporarily empty - cards feature hidden
			metadata: responseMetadata
		});
		responseModalOpen = false;
		responseText = '';
		responseMetadata = null;
		// linkedCardsText = ''; // Temporarily commented out
		selectedQuestionId = null;
	}

	async function toggleVote(responseId: string) {
		const hasVoted = userVotes.has(responseId);
		const delta = hasVoted ? -1 : 1;

		await apiVoteResponse(responseId, delta);

		// Update local vote tracking
		if (hasVoted) {
			userVotes.delete(responseId);
		} else {
			userVotes.add(responseId);
		}
		userVotes = userVotes; // Trigger reactivity

		// Save to localStorage
		if (browser) {
			localStorage.setItem(`cda:votes:${sessionCode}`, JSON.stringify([...userVotes]));
		}
	}

	async function submitTimelineItem() {
		if (!timelineText.trim()) return;
		await apiAddTimelineEntry(sessionCode, {
			label: timelineLabel,
			itemText: timelineText.trim(),
			owner: timelineOwner.trim() || undefined,
			metric: timelineMetric.trim() || undefined,
			riskNote: timelineRisk.trim() || undefined
		});
		timelineModalOpen = false;
		timelineLabel = 'Now';
		timelineText = '';
		timelineOwner = '';
		timelineMetric = '';
		timelineRisk = '';
	}

	async function submitChatMessage() {
		if (!chatMessage.trim()) return;

		// Validate participant before sending chat
		if (!currentParticipant || !currentParticipant.id) {
			console.error('[Chat] No participant ID found');
			alert('Please join the session with a name before chatting.');
			return;
		}

		await apiSendChatMessage(sessionCode, {
			participantId: currentParticipant.id,
			message: chatMessage.trim()
		});
		chatMessage = '';
	}

	function openResponseModal(questionId: string | null) {
		selectedQuestionId = questionId;
		responseModalOpen = true;
	}

	function exportSession() {
		window.open(`/api/export/${sessionCode}`, '_blank');
	}

	async function clearActiveRound() {
		if (!sessionCode || roundUpdating) return;
		roundUpdating = true;
		try {
			const res = await fetch('/api/session/round', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ code: sessionCode })
			});
			const payload = await res.json();
			if (!payload.success) {
				throw new Error(payload.error ?? 'Unable to clear active round.');
			}
			await refreshSession(sessionCode);
		} catch (error) {
			console.error('Failed to clear active round', error);
			alert((error as Error).message ?? 'Failed to clear active round.');
		} finally {
			roundUpdating = false;
		}
	}

	async function startTemplateRound(round: any) {
		// Placeholder function for template rounds
		console.log('Starting template round:', round);
	}

	async function startCustomRound() {
		if (!customLabel.trim() || customMinutes <= 0 || roundUpdating) return;
		roundUpdating = true;
		try {
			const res = await fetch('/api/session/round', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					code: sessionCode,
					label: customLabel.trim(),
					minutes: customMinutes
				})
			});
			const payload = await res.json();
			if (!payload.success) {
				throw new Error(payload.error ?? 'Unable to start custom round.');
			}
			await refreshSession(sessionCode);
			customLabel = '';
			customMinutes = 0;
		} catch (error) {
			console.error('Failed to start custom round', error);
			alert((error as Error).message ?? 'Failed to start custom round.');
		} finally {
			roundUpdating = false;
		}
	}

	function leaveSession() {
		if (confirm('Are you sure you want to leave this session?')) {
			// Clear session data
			if (browser) {
				clearParticipantProfile(sessionCode);
				currentUser.set(null);
			}
			// stopRealtimeSession();
			goto('/');
		}
	}
</script>

<div class="session-shell">
{#if sessionLoading}
	<div
		class="min-h-screen bg-gradient-to-br from-surface-muted via-surface to-white flex items-center justify-center"
	>
		<div class="text-center space-y-4">
			<div
				class="w-16 h-16 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto"
			></div>
			<p class="text-xl text-brand">Loading session...</p>
			<p class="text-sm text-secondary">Code: {sessionCode.toUpperCase()}</p>
		</div>
	</div>
{:else if sessionError}
	<div
		class="min-h-screen bg-gradient-to-br from-surface-muted via-surface to-white flex items-center justify-center p-6"
	>
		<div class="max-w-md text-center space-y-6">
			<div class="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
				<svg class="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			</div>
			<div>
				<h2 class="text-2xl font-bold text-primary mb-2">Session Error</h2>
				<p class="text-secondary">{sessionError}</p>
			</div>
			<div class="flex gap-3 justify-center">
				<button
					class="px-6 py-3 bg-brand hover:bg-brand text-primary rounded-lg transition"
					on:click={() => window.location.reload()}
				>
					Retry
				</button>
				<button
					class="px-6 py-3 surface-input hover:bg-surface-muted text-primary rounded-lg transition"
					on:click={() => goto('/join?code=' + sessionCode)}
				>
					Join Session
				</button>
			</div>
		</div>
	</div>
{:else if sessionInfo}
	<div
		class="min-h-screen bg-gradient-to-br from-surface-muted via-surface to-white text-primary {isMobile
			? ''
			: 'flex'}"
	>
		<!-- Main Content Area -->
		<div class={isMobile ? 'w-full' : 'flex-1 overflow-auto'}>
			<header class="sticky top-0 z-40 border-b border-brand/20 panel backdrop-blur">
				<div class="mx-auto max-w-7xl px-4 md:px-6 py-3 md:py-4">
					<div class="flex flex-col gap-2">
						<div class="flex items-start justify-between gap-4">
							<div class="flex-1 min-w-0">
								<p class="text-[10px] md:text-xs uppercase tracking-[0.35em] text-brand">
									Inclusive Planning
								</p>
								<h1 class="text-lg md:text-2xl font-semibold text-primary flex flex-wrap items-center gap-2">
									<span class="truncate">{sessionInfo.title ?? 'Untitled Session'}</span>
									<span
										class="rounded-full border border-brand/30 px-2 md:px-3 py-0.5 md:py-1 text-[10px] md:text-xs uppercase tracking-[0.2em] text-cyan-200 whitespace-nowrap"
									>
										{sessionCode}
									</span>
								</h1>
								{#if sessionInfo.challenge && !isMobile}
									<div class="mt-2 text-sm text-secondary max-w-2xl line-clamp-3">
										<PortableText value={sessionInfo.challenge} styleClass="prose-sm prose-slate" />
									</div>
								{/if}
								<p class="mt-1 text-xs md:text-sm text-secondary truncate">
									{currentParticipant?.name ?? 'Anonymous'} · {currentParticipant?.role ?? activeRole}
								</p>
							</div>
						</div>
					</div>
				</div>
			</header>

			<main class="mx-auto max-w-full space-y-6 md:space-y-8 px-4 md:px-6 py-6 md:py-8">
				<!-- Session Status Notice -->
				{#if isSessionEnded}
					<div class="rounded-xl border border-slate-700 bg-slate-900/80 p-4 shadow-lg">
						<div class="flex items-center gap-3">
							<div class="rounded-full bg-slate-800 p-2">
								<IconClock class="h-5 w-5 text-slate-400" />
							</div>
							<div>
								<h3 class="text-sm font-semibold text-slate-200">Session Ended</h3>
								<p class="text-xs text-slate-400">This session has concluded. You can review the final results below.</p>
							</div>
						</div>
					</div>
				{:else if isSessionPlanned}
					<div class="rounded-xl border border-cyan-400/30 bg-slate-900/80 p-4 shadow-lg">
						<div class="flex items-center gap-3">
							<div class="rounded-full bg-cyan-900/30 p-2">
								<IconClock class="h-5 w-5 text-cyan-400" />
							</div>
							<div>
								<h3 class="text-sm font-semibold text-cyan-200">Session Not Started</h3>
								<p class="text-xs text-cyan-300/80">This session is scheduled but hasn't started yet. Please wait for the facilitator to begin.</p>
							</div>
						</div>
					</div>
				{:else if isSessionLive}
					<div class="rounded-xl border border-green-400/30 bg-slate-900/80 p-4 shadow-lg">
						<div class="flex items-center gap-3">
							<div class="rounded-full bg-green-900/30 p-2 flex items-center justify-center">
								<span class="h-2 w-2 rounded-full bg-green-400 animate-pulse inline-block"></span>
							</div>
							<div>
								<h3 class="text-sm font-semibold text-green-200">Session In Progress</h3>
								<p class="text-xs text-green-300/80">This session is live. Your responses will be visible in real-time.</p>
							</div>
						</div>
					</div>
				{/if}

				<!-- Participant View: Show active phase info only -->
				{#if !isFacilitator() && activePhase}
					<section class="rounded-2xl border border-brand/30 panel p-4 md:p-6">
						<div class="flex items-center justify-between mb-4">
							<div>
								<p class="text-xs uppercase tracking-[0.3em] text-cyan-200">Current Phase</p>
								<h3 class="text-lg md:text-xl font-semibold text-primary">
									{activePhase.title ?? activePhase.phase_key ?? 'Active Phase'}
								</h3>
								{#if activePhase.description}
									<p class="text-sm text-secondary mt-1">{activePhase.description}</p>
								{/if}
							</div>
							{#if phaseCountdownLabel}
								<div class="text-right">
									<p class="text-xs uppercase tracking-[0.3em] text-cyan-200">Time Left</p>
									<p class="text-2xl md:text-3xl font-mono text-cyan-100">{phaseCountdownLabel}</p>
								</div>
							{/if}
						</div>

						<!-- Phase Questions for Participants -->
						{#if questionsList.filter((q) => q.phase_key === activePhase.phase_key || (!q.phase_key && activePhase.status === 'active')).length > 0}
							{@const phaseQuestions = questionsList.filter(
								(q) => q.phase_key === activePhase.phase_key || (!q.phase_key && activePhase.status === 'active')
							)}
							<div class="mt-6">
								<div class="flex items-center justify-between mb-4">
									<h4 class="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">
										Questions
									</h4>
									<button
										class="flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 px-4 py-2 text-sm font-medium text-primary hover:from-brand hover:to-purple-500 transition-colors"
										on:click={() => openResponseModal(null)}
										disabled={!phaseRemainingMs}
									>
										<IconPlus class="h-4 w-4" /> {phaseRemainingMs ? 'Respond' : 'Time Up'}
									</button>
								</div>

								<div class="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
									{#each phaseQuestions as question}
										<div class="rounded-lg border border-line panel p-4">
											<div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
												<div class="flex-1 min-w-0">
													<span class="text-xs uppercase tracking-[0.3em] text-cyan-200">
														{question.section}
													</span>
													<h5 class="text-sm font-semibold text-primary mt-1 break-words">{question.text}</h5>
												</div>
												<button
													class="rounded-lg border border-brand/40 px-3 py-1.5 text-xs text-cyan-200 hover:border-cyan-300 transition-colors whitespace-nowrap flex-shrink-0 self-start"
													on:click={() => openResponseModal(question.id)}
													disabled={!phaseRemainingMs}
												>
													{phaseRemainingMs ? 'Respond' : 'Time up'}
												</button>
											</div>

											<!-- Show responses with voting -->
											{#if responsesList.filter((r) => r.question_id === question.id).length > 0}
												{@const questionResponses = responsesList
													.filter((r) => r.question_id === question.id)
													.sort((a, b) => (b.votes || 0) - (a.votes || 0))}
												<div class="space-y-2 max-h-60 overflow-y-auto">
													{#each questionResponses as response}
														{@const hasVoted = userVotes.has(response.id)}
														{@const isOwnResponse = response.participant_id === currentParticipant?.id}
														{@const votingEnabled = question.enable_voting ?? true}
														<div class="rounded border border-line panel p-3 text-xs">
															<div class="flex items-center justify-between text-secondary mb-1">
																<div class="flex items-center gap-2">
																	<span
																		>{participantsList.find((p) => p.id === response.participant_id)
																			?.name ?? 'Anonymous'}</span
																	>
																	{#if isOwnResponse}
																		<span class="px-1.5 py-0.5 text-[10px] rounded bg-purple-500/20 text-purple-300">You</span>
																	{/if}
																</div>
																{#if votingEnabled}
																	<button
								class={`inline-flex items-center gap-1 rounded border px-2 py-1 transition-colors disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
									hasVoted
										? 'border-brand bg-brand/20 text-[hsl(var(--text-on-teal))]'
										: 'border-line text-ink-2 hover:text-brand hover:border-brand'
									}`}
																		on:click={() => toggleVote(response.id)}
																		disabled={!phaseRemainingMs || isOwnResponse}
																		title={isOwnResponse ? "Can't vote on your own response" : hasVoted ? 'Remove vote' : 'Vote for this response'}
																	>
																		<IconThumbUp class="h-3 w-3" />
																		{response.votes ?? 0}
																	</button>
																{:else}
																	<span class="inline-flex items-center gap-1 text-ink-2 text-xs">
																		<IconThumbUp class="h-3 w-3" />
																		{response.votes ?? 0}
																	</span>
																{/if}
															</div>
															<p class="text-secondary">{response.text}</p>
															<!-- Temporarily hidden - not usable with current exercise -->
															<!-- {#if response.cards?.length}
																<div class="mt-2 flex flex-wrap gap-1">
																	{#each response.cards as card}
																		<span class="px-1.5 py-0.5 text-xs rounded bg-brand/20 text-brand"
																			>{card}</span
																		>
																	{/each}
																</div>
															{/if} -->
														</div>
													{/each}
												</div>
											{:else}
												<p class="text-xs text-secondary italic mt-2">No responses yet. Be the first!</p>
											{/if}
										</div>
									{/each}
								</div>
							</div>
						{:else}
							<div class="mt-6 rounded-lg border border-line surface-muted p-6 text-center">
								<p class="text-sm text-secondary">
									No questions available for this phase yet. The facilitator will add questions soon.
								</p>
							</div>
						{/if}
					</section>
				{:else if !isFacilitator()}
					<!-- No active phase message for participants -->
					<section class="rounded-2xl border border-line panel p-8 text-center">
						<h3 class="text-lg font-semibold text-primary mb-2">Session Starting Soon</h3>
						<p class="text-sm text-secondary">
							The facilitator hasn't started a phase yet. Please wait while they set up the session.
						</p>
					</section>
				{/if}

				<!-- Facilitator View: Full controls -->
				{#if isFacilitator()}
					<section class="rounded-2xl border border-brand/30 panel p-6 space-y-6">
						<div class="flex flex-wrap items-center justify-between gap-4">
							<div>
								<h2 class="text-lg font-semibold text-primary">Session Progress</h2>
								<p class="text-sm text-secondary">
									Activate phases, manage timers, and advance the agenda.
								</p>
							</div>
							<div class="flex flex-wrap items-center gap-2">
								{#each sessionStatuses as status}
									<button
										class={`rounded-lg px-3 py-2 text-sm font-medium transition ${sessionInfo?.status === status ? 'bg-brand text-white shadow' : 'border border-brand/40 text-cyan-200 hover:border-cyan-300'}`}
										on:click={() => changeStatus(status)}
										disabled={statusUpdating || sessionInfo?.status === status}
									>
										{statusLabels[status]}
									</button>
								{/each}
								<button
									class="rounded-lg bg-accent-critical/80 px-3 py-2 text-sm font-semibold text-primary hover:bg-red-500 transition"
									on:click={() => changeStatus('done')}
									disabled={statusUpdating || sessionInfo?.status === 'done'}
								>
									End Session
								</button>
							</div>
						</div>

						<div class="rounded-xl border border-brand/20 panel p-4">
							{#if activePhase}
								<div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
									<div class="space-y-1">
										<p class="text-xs uppercase tracking-[0.3em] text-cyan-200">Current Phase</p>
										<h3 class="text-base font-semibold text-primary">
											{activePhase.title ?? activePhase.phase_key ?? 'Phase'}
										</h3>
										{#if activePhase.description}
											<p class="text-sm text-secondary leading-relaxed">
												{activePhase.description}
											</p>
										{/if}
									</div>
									<div class="text-right space-y-1">
										{#if phaseCountdownLabel}
											<p class="text-xs uppercase tracking-[0.3em] text-cyan-200">Time Remaining</p>
											<p class="text-lg font-mono text-cyan-100">{phaseCountdownLabel}</p>
										{:else if activePhase.duration_minutes}
											<p class="text-xs text-secondary">
												Duration: {activePhase.duration_minutes} min
											</p>
										{/if}
										<p class="text-xs text-secondary">
											{getPhaseStatusLabel(activePhase.status)}{#if activePhase.started_at}
												• Started {new Date(activePhase.started_at).toLocaleTimeString()}{/if}
										</p>
									</div>
								</div>
							{:else}
								<p class="text-sm text-secondary">
									No active phase. Start the first phase to begin the journey.
								</p>
							{/if}
						</div>

						<div class="space-y-4">
							{#if phasesList.length === 0}
								<p class="text-sm text-secondary">
									This session was created without phases. Update the Sanity template to design a
									structured flow.
								</p>
							{:else}
								{#each phasesList as phase}
									<article
										class={`rounded-xl border px-6 py-6 transition ${
											phase.status === 'completed'
												? 'border-emerald-400/30 bg-emerald-500/10'
												: phase.status === 'active'
													? 'border-brand/40 bg-brand/10'
													: 'border-line panel hover:border-brand/30'
										}`}
									>
										<!-- Phase Header -->
										<div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
											<div class="flex-1">
												<div class="flex items-center gap-3 mb-2">
													<p class="text-xs uppercase tracking-[0.3em] text-secondary">
														{getPhaseStatusLabel(phase.status)}
													</p>
													{#if phase.duration_minutes}
														<span class="text-xs font-medium text-cyan-200"
															>{phase.duration_minutes} min</span
														>
													{/if}
												</div>
												<h3 class="text-lg font-semibold text-primary mb-2">
													{phase.title ?? phase.phase_key ?? 'Phase'}
												</h3>
												{#if phase.description}
													<p class="text-sm text-secondary leading-relaxed">{phase.description}</p>
												{/if}
											</div>

											<!-- Timer Controls -->
											{#if phase.status === 'active' && isFacilitator()}
												<div class="flex items-center gap-2">
													{#if phaseCountdownLabel}
														<div class="text-right">
															<p class="text-xs uppercase tracking-[0.3em] text-cyan-200">
																Time Remaining
															</p>
															<p class="text-lg font-mono text-cyan-100">{phaseCountdownLabel}</p>
														</div>
													{/if}
													<button
													class="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand transition"
														on:click={() => resetPhaseTimer(phase)}
													>
														Reset Timer
													</button>
												</div>
											{/if}
										</div>

										<!-- Phase Controls for Facilitators -->
										{#if isFacilitator()}
											<div class="mt-4 flex flex-wrap items-center gap-2">
												{#if phase.status === 'pending'}
													<button
														class="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand transition disabled:opacity-50"
														on:click={() => activatePhase(phase)}
														disabled={phaseUpdating}
													>
														Start Phase
													</button>
												{:else if phase.status === 'active'}
													<button
														class="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-400 transition disabled:opacity-50"
														on:click={() => finishPhase(phase)}
														disabled={phaseUpdating}
													>
														Complete Phase
													</button>
												{:else}
													<button
														class="rounded-lg border border-line px-3 py-1.5 text-xs text-secondary hover:border-brand/40 transition"
														on:click={() => activatePhase(phase)}
														disabled={phaseUpdating}
													>
														Revisit
													</button>
												{/if}
											</div>
										{/if}

										<!-- Phase Cards (if associated with this phase) -->
										{#if phase.cards?.length}
											<div class="mt-6">
												<p class="text-xs uppercase tracking-[0.3em] text-secondary mb-3">
													Phase Cards
												</p>
												<div class="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
													{#each phase.cards as card}
														<div class="rounded-lg border border-line panel p-3">
															<div class="flex items-center gap-2 mb-2">
																{#if card.letter}
																	<span
																		class="flex h-6 w-6 items-center justify-center rounded border border-brand/40 text-xs font-bold text-brand"
																	>
																		{card.letter}
																	</span>
																{/if}
																<h4 class="text-sm font-semibold text-cyan-200">
																	{card.title || 'Untitled'}
																</h4>
															</div>
															{#if card.description}
																<p class="text-xs text-secondary mt-1">{card.description}</p>
															{/if}
														</div>
													{/each}
												</div>
											</div>
										{/if}

										<!-- Phase Questions -->
										{#if questionsList.filter((q) => q.phase_key === phase.phase_key || (phase.status === 'active' && !q.phase_key)).length > 0}
											{@const phaseQuestions = questionsList.filter(
												(q) =>
													q.phase_key === phase.phase_key ||
													(phase.status === 'active' && !q.phase_key)
											)}
											<div class="mt-6">
												<div class="flex items-center justify-between mb-4">
													<h4
														class="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200"
													>
														Phase Questions
													</h4>
													{#if phase.status === 'active' && !isFacilitator()}
														<button
															class="flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 px-3 py-1.5 text-xs font-medium text-primary hover:from-brand hover:to-purple-500 transition-colors"
															on:click={() => openResponseModal(null)}
															disabled={!phaseRemainingMs}
														>
															<IconPlus class="h-3 w-3" /> Respond
														</button>
													{/if}
												</div>

												<div class="space-y-4">
													{#each phaseQuestions as question}
														<div
															class="rounded-lg border border-line panel p-4 space-y-3"
														>
															<div class="flex items-start justify-between gap-3">
																<div class="flex-1">
																	<div class="flex items-center gap-2 mb-2">
																		<span class="text-xs uppercase tracking-[0.3em] text-cyan-200">
																			{question.section}
																		</span>
																		{#if question.response_type && question.response_type !== 'written'}
																			<span
																				class="px-2 py-1 bg-brand/20 text-brand rounded text-xs"
																			>
																				{question.response_type}
																			</span>
																		{/if}
																	</div>
																	<h5 class="text-sm font-semibold text-primary">{question.text}</h5>
																</div>
																{#if phase.status === 'active' && !isFacilitator()}
																	<button
																		class="rounded-lg border border-brand/40 px-3 py-1 text-xs text-cyan-200 hover:border-cyan-300 transition-colors"
																		on:click={() => openResponseModal(question.id)}
																		disabled={!phaseRemainingMs}
																	>
																		{phaseRemainingMs ? 'Respond' : 'Time up'}
																	</button>
																{/if}
															</div>

															<!-- Question Responses -->
															{#if responsesList.filter((r) => r.question_id === question.id).length > 0}
																{@const questionResponses = responsesList.filter(
																	(r) => r.question_id === question.id
																)}
																{@const totalVotes = questionResponses.reduce(
																	(sum, r) => sum + (r.votes || 0),
																	0
																)}
																{@const sortedByVotes = questionResponses.sort(
																	(a, b) => (b.votes || 0) - (a.votes || 0)
																)}
																{@const votingEnabled = question.enable_voting ?? true}

																<!-- Vote Summary -->
																{#if totalVotes > 0 && votingEnabled}
																	<div
																		class="mb-3 p-2 rounded bg-brand/10 border border-brand/30"
																	>
																		<p class="text-xs font-medium text-cyan-200 mb-2">
																			Community Insights (Total votes: {totalVotes})
																		</p>
																		<div class="space-y-1">
																			{#each sortedByVotes.slice(0, 3) as topResponse}
																				{#if topResponse.votes && topResponse.votes > 0}
																					<div class="flex items-center justify-between text-xs">
																						<span class="text-secondary flex-1 pr-2"
																							>{topResponse.text.slice(0, 50)}...</span
																						>
																						<div class="flex items-center gap-1 text-cyan-200">
																							<IconThumbUp class="h-3 w-3" />
																							<span class="font-medium">{topResponse.votes}</span>
																						</div>
																					</div>
																				{/if}
																			{/each}
																		</div>
																	</div>
																{/if}

																<!-- Individual Responses -->
																<div class="space-y-2 max-h-40 overflow-y-auto">
																	{#each sortedByVotes as response}
																		<div
																			class="rounded border border-line panel p-2 text-xs"
																		>
																			<div
																				class="flex items-center justify-between text-secondary mb-1"
																			>
																				<span
																					>{participantsList.find(
																						(p) => p.id === response.participant_id
																					)?.name ?? 'Anonymous'}</span
																				>
																				{#if votingEnabled}
																					<button
																						class="inline-flex items-center gap-1 rounded border border-brand/40 px-1.5 py-0.5 text-cyan-200 hover:border-cyan-300 transition-colors"
																						on:click={() => toggleVote(response.id)}
																						disabled={activePhase && !phaseRemainingMs}
																					>
																						<IconThumbUp class="h-3 w-3" />
																						{response.votes ?? 0}
																					</button>
																				{:else}
																					<span class="inline-flex items-center gap-1 text-secondary text-xs">
																						<IconThumbUp class="h-3 w-3" />
																						{response.votes ?? 0}
																					</span>
																				{/if}
																			</div>
																			<p class="text-secondary">{response.text}</p>
																			{#if response.cards?.length}
																				<div class="mt-1 flex flex-wrap gap-1">
																					{#each response.cards as card}
																						<span
																							class="px-1 py-0.5 text-xs rounded bg-brand/20 text-brand"
																							>{card}</span
																						>
																					{/each}
																				</div>
																			{/if}
																		</div>
																	{/each}
																</div>
															{/if}
														</div>
													{/each}
												</div>
											</div>
										{/if}

										{#if Array.isArray(phase.dashboards) && phase.dashboards.length}
											<div class="mt-6">
												<p class="text-xs uppercase tracking-[0.3em] text-secondary mb-2">
													Recommended dashboards
												</p>
												<div class="flex flex-wrap gap-2">
													{#each phase.dashboards as dashboard}
														<span
															class="rounded-full border border-brand/30 px-3 py-1 text-xs text-cyan-200"
															>{dashboardLabels[dashboard] ?? dashboard}</span
														>
													{/each}
												</div>
											</div>
										{/if}
									</article>
								{/each}
							{/if}
						</div>

						<div class="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
							<div class="rounded-xl border border-brand/20 panel p-4 space-y-4">
								<div class="flex items-center justify-between">
									<h3 class="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">
										Breakout Rounds
									</h3>
									{#if sessionInfo?.active_round}
										<button
											class="text-xs rounded-lg border border-brand/40 px-3 py-1 text-cyan-200 hover:border-cyan-300 transition"
											on:click={clearActiveRound}
											disabled={roundUpdating}
										>
											End current round
										</button>
									{/if}
								</div>
								{#if sessionInfo?.active_round}
									<div class="rounded-lg border border-brand/30 bg-brand/10 p-3">
										<p class="text-xs uppercase tracking-[0.3em] text-cyan-200">Active Round</p>
										<p class="mt-2 text-sm font-semibold text-primary">
											{sessionInfo.active_round}
										</p>
										{#if roundCountdownLabel}
											<p class="mt-1 text-xs text-cyan-100/80">
												Time remaining: {roundCountdownLabel}
											</p>
										{/if}
									</div>
								{:else}
									<p class="text-sm text-secondary">No active breakout round.</p>
								{/if}
								<div class="max-h-48 space-y-2 overflow-y-auto pr-1">
									{#if templateLoading}
										<p class="text-sm text-secondary">Loading template rounds…</p>
									{:else if templateError}
										<p class="text-sm text-rose-300">{templateError}</p>
									{:else if templateRounds.length}
										{#each templateRounds as round}
											<button
												class="w-full rounded-lg border border-brand/30 px-3 py-2 text-left text-sm text-cyan-100 hover:border-cyan-300 transition"
												on:click={() => startTemplateRound(round)}
												disabled={roundUpdating ||
													sessionInfo?.active_round === (round.name ?? round.key)}
											>
												<span class="font-semibold text-primary"
													>{round.name ?? round.key ?? 'Round'}</span
												>
												<span class="ml-2 text-xs text-cyan-200">{round.minutes ?? '?'} min</span>
											</button>
										{/each}
									{:else}
										<p class="text-sm text-secondary">
											This template does not define breakout rounds.
										</p>
									{/if}
								</div>
							</div>

							<div class="rounded-xl border border-retro-purple/20 panel p-4 space-y-3">
								<h3 class="text-sm font-semibold uppercase tracking-[0.2em] text-purple-200">
									Custom Timer
								</h3>
								<label class="flex flex-col gap-2 text-xs text-secondary">
									Label
									<input
										class="rounded-lg border border-line bg-surface-muted px-3 py-2 text-sm text-primary focus:border-retro-purple focus:outline-none"
										placeholder="e.g., Reflection Sprint"
										bind:value={customLabel}
									/>
								</label>
								<label class="flex flex-col gap-2 text-xs text-secondary">
									Minutes
									<input
										class="rounded-lg border border-line bg-surface-muted px-3 py-2 text-sm text-primary focus:border-retro-purple focus:outline-none"
										type="number"
										min="1"
										step="1"
										bind:value={customMinutes}
										on:input={(event) => (customMinutes = Number(event.currentTarget.value) || 0)}
									/>
								</label>
								<button
									class="w-full rounded-lg bg-gradient-to-r from-purple-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-primary hover:from-retro-purple hover:to-brand transition"
									on:click={startCustomRound}
									disabled={roundUpdating}
								>
									Start Custom Timer
								</button>
							</div>
						</div>
					</section>
				{/if}

				<section class="grid gap-6 md:grid-cols-3">
					{#if sessionInfo.challenge}
						<div class="md:col-span-3 rounded-xl border border-brand/30 bg-brand/10 p-4">
							<p class="text-xs uppercase tracking-[0.3em] text-cyan-100 mb-2">Challenge Focus</p>
							<div class="text-base text-primary">
								<PortableText value={sessionInfo.challenge} styleClass="prose prose-slate" />
							</div>
							<p class="mt-3 text-xs text-cyan-100/80">
								Ground your ideas in this shared challenge as you move through the session.
							</p>
						</div>
					{/if}
					{#if sessionInfo.active_round}
						<div class="md:col-span-3 rounded-xl border border-retro-purple/30 bg-purple-500/10 p-4">
							<p class="text-xs uppercase tracking-[0.3em] text-purple-200">Active Round</p>
							<div class="mt-2 flex flex-wrap items-center gap-3">
								<span class="text-sm font-semibold text-primary">{sessionInfo.active_round}</span>
								{#if roundCountdownLabel}
									<span
										class="rounded-full border border-purple-300/40 px-3 py-1 text-xs text-purple-100"
									>
										Time remaining: {roundCountdownLabel}
									</span>
								{/if}
							</div>
							<p class="mt-1 text-xs text-purple-100/80">
								Stay with the prompt until the facilitator advances the agenda.
							</p>
						</div>
					{/if}
					<div class="rounded-xl border border-line panel p-4">
						<p class="text-xs uppercase tracking-[0.3em] text-secondary">Current Step</p>
						<p class="mt-2 text-lg font-semibold text-primary">{sessionInfo.status ?? 'planned'}</p>
						<p class="text-sm text-secondary mt-1">
							The facilitator will cue the next collaborative activity for the group.
						</p>
					</div>
					<div class="rounded-xl border border-line panel p-4">
						<p class="text-xs uppercase tracking-[0.3em] text-secondary">Active Questions</p>
						<p class="mt-2 text-lg font-semibold text-primary">{questionsList.length}</p>
						<p class="text-sm text-secondary mt-1">
							Reflect across the lenses defined in your session blueprint.
						</p>
					</div>
					<div class="rounded-xl border border-line panel p-4">
						<p class="text-xs uppercase tracking-[0.3em] text-secondary">Ideas Shared</p>
						<p class="mt-2 text-lg font-semibold text-primary">{responsesList.length}</p>
						<p class="text-sm text-secondary mt-1">
							Vote on responses that advance equity-centered planning.
						</p>
					</div>
				</section>

				<!-- Dashboard Section: Facilitator Only -->
				{#if isFacilitator()}
					<section class="rounded-2xl border border-line panel p-4 md:p-6">
						<nav class="flex gap-2 md:gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
						{#if availableDashboards.includes('roadmap')}
							<button
								class={`flex items-center gap-2 rounded-lg px-3 md:px-4 py-2 text-xs md:text-sm transition-colors whitespace-nowrap ${activeTab === 'roadmap' ? 'bg-brand text-white font-semibold' : 'border border-line text-secondary hover:border-brand/40 hover:text-cyan-200'}`}
								on:click={() => (activeTab = 'roadmap')}
							>
								<IconMap class="h-4 w-4 flex-shrink-0" />
								Roadmap
							</button>
						{/if}
						{#if availableDashboards.includes('wordcloud')}
							<button
								class={`flex items-center gap-2 rounded-lg px-3 md:px-4 py-2 text-xs md:text-sm transition-colors whitespace-nowrap ${activeTab === 'wordcloud' ? 'bg-brand text-white font-semibold' : 'border border-line text-secondary hover:border-brand/40 hover:text-cyan-200'}`}
								on:click={() => (activeTab = 'wordcloud')}
							>
								<IconCloud class="h-4 w-4 flex-shrink-0" />
								<span class="hidden sm:inline">Word Cloud</span>
								<span class="sm:hidden">Cloud</span>
							</button>
						{/if}
						{#if availableDashboards.includes('response-landscape')}
							<button
								class={`flex items-center gap-2 rounded-lg px-3 md:px-4 py-2 text-xs md:text-sm transition-colors whitespace-nowrap ${activeTab === 'response-landscape' ? 'bg-brand text-white font-semibold' : 'border border-line text-secondary hover:border-brand/40 hover:text-cyan-200'}`}
								on:click={() => (activeTab = 'response-landscape')}
							>
								<IconChartDots3 class="h-4 w-4 flex-shrink-0" />
								<span class="hidden sm:inline">Landscape</span>
							</button>
						{/if}
						<button
							class={`flex items-center gap-2 rounded-lg px-3 md:px-4 py-2 text-xs md:text-sm transition-colors whitespace-nowrap ${activeTab === 'timeline' ? 'bg-brand text-white font-semibold' : 'border border-line text-secondary hover:border-brand/40 hover:text-cyan-200'}`}
							on:click={() => (activeTab = 'timeline')}
						>
							<IconFlame class="h-4 w-4 flex-shrink-0" />
							Timeline
						</button>
						<button
							class={`flex items-center gap-2 rounded-lg px-3 md:px-4 py-2 text-xs md:text-sm transition-colors whitespace-nowrap ${activeTab === 'chat' ? 'bg-brand text-white font-semibold' : 'border border-line text-secondary hover:border-brand/40 hover:text-cyan-200'}`}
							on:click={() => (activeTab = 'chat')}
						>
							<IconMessage class="h-4 w-4 flex-shrink-0" />
							<span class="hidden sm:inline">Arcade Chat</span>
							<span class="sm:hidden">Chat</span>
						</button>
						{#if isFacilitator()}
							<button
								class={`flex items-center gap-2 rounded-lg px-3 md:px-4 py-2 text-xs md:text-sm transition-colors whitespace-nowrap ${activeTab === 'participants' ? 'bg-brand text-white font-semibold' : 'border border-line text-secondary hover:border-brand/40 hover:text-cyan-200'}`}
								on:click={() => (activeTab = 'participants')}
							>
								<IconUsers class="h-4 w-4 flex-shrink-0" />
								<span class="hidden md:inline">Participant Activity</span>
								<span class="md:hidden">Activity</span>
							</button>
						{/if}
					</nav>

					<div class="mt-6">
						{#if dashboardMode === 'immersive'}
							<!-- Immersive Dashboard Layout -->
							<div class="space-y-6">
								<!-- Top Row: Two Smaller Charts Side by Side -->
								<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div class="bg-surface-muted rounded-xl border border-brand/20 p-4 h-80">
										<h3 class="text-sm font-semibold text-cyan-200 mb-3">Participation Pulse</h3>
										<div class="w-full h-60">
											<ParticipationPulse roomCode={sessionCode} width={isMobile ? 320 : 380} height={240} />
										</div>
									</div>
									<div class="bg-surface-muted rounded-xl border border-brand/20 p-4 h-80">
										<h3 class="text-sm font-semibold text-cyan-200 mb-3">Inclusivity Meter</h3>
										<div class="w-full h-60">
											<InclusivityMeter roomCode={sessionCode} width={isMobile ? 320 : 380} height={240} />
										</div>
									</div>
								</div>

								<!-- Main Chart Area: Full Width Below -->
								<div class="bg-surface-muted rounded-xl border border-brand/20 p-6">
									{#if activeTab === 'roadmap'}
										<h3 class="text-lg font-semibold text-primary mb-4">Roadmap Timeline</h3>
									<div class="w-full md:h-[520px] h-[70dvh] overflow-hidden">
										<RoadmapChart responses={responsesForViz} width={isMobile ? 350 : 900} height={isMobile ? 400 : 520} />
									</div>
									{:else if activeTab === 'wordcloud'}
										<h3 class="text-lg font-semibold text-primary mb-4">Response Word Cloud</h3>
									<div class="w-full md:h-[520px] h-[70dvh] overflow-hidden">
										<WordCloudChart responses={responsesForViz} width={isMobile ? 350 : 900} height={isMobile ? 400 : 520} />
									</div>
									{:else if activeTab === 'response-landscape'}
										<h3 class="text-lg font-semibold text-primary mb-4">Response Landscape</h3>
									<div class="w-full md:h-[520px] h-[70dvh] overflow-hidden">
										<LandscapeChart
												responses={responsesForViz}
												width={isMobile ? 350 : 900}
												height={isMobile ? 400 : 520}
												xLabel={landscapeXLabel}
												yLabel={landscapeYLabel}
												minX={landscapeMinX}
												maxX={landscapeMaxX}
												minY={landscapeMinY}
												maxY={landscapeMaxY}
											/>
										</div>
									{:else if activeTab === 'participants'}
										<h3 class="text-lg font-semibold text-primary mb-4">Advanced Analytics</h3>
										<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
											<div class="h-[400px] overflow-hidden">
												<h4 class="text-sm font-semibold text-cyan-200 mb-3">Quad Bubbles</h4>
												<div class="w-full h-80">
													<QuadBubbles roomCode={sessionCode} width={isMobile ? 350 : 420} height={320} />
												</div>
											</div>
											<div class="h-[400px] overflow-hidden">
												<h4 class="text-sm font-semibold text-cyan-200 mb-3">Maturity Dial</h4>
												<div class="w-full h-80">
													<MaturityDial roomCode={sessionCode} width={isMobile ? 350 : 420} height={320} />
												</div>
											</div>
											<div class="lg:col-span-2 h-[500px] overflow-hidden">
												<h4 class="text-sm font-semibold text-cyan-200 mb-3">Risk Impact Matrix</h4>
												<div class="w-full h-[450px]">
													<RiskImpactMatrix roomCode={sessionCode} width={isMobile ? 350 : 900} height={450} />
												</div>
											</div>
										</div>
									{/if}
								</div>

								<!-- Bottom Row: Leaderboard and Chat Side by Side -->
								<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div class="bg-surface-muted rounded-xl border border-brand/20 p-4">
										<h3 class="text-sm font-semibold text-cyan-200 mb-3">Live Leaderboard</h3>
										<div class="space-y-2 max-h-64 overflow-y-auto">
											{#if leaderboardList.length > 0}
												{#each leaderboardList.slice(0, 8) as participant, index}
													<div class="flex items-center justify-between py-2 border-b border-line/50 last:border-0">
														<div class="flex items-center gap-2">
															<span class="text-xs font-bold text-brand">#{index + 1}</span>
															<span class="text-sm text-primary truncate">{participant.name}</span>
														</div>
													<span class="text-xs text-cyan-200 flex-shrink-0 ml-auto">{participant.score ?? participant.points ?? 0} pts</span>
													</div>
												{/each}
											{:else}
												<p class="text-xs text-secondary">No participants yet</p>
											{/if}
										</div>
									</div>
									<div class="bg-surface-muted rounded-xl border border-brand/20 p-4">
										<h3 class="text-sm font-semibold text-cyan-200 mb-3">Quick Chat</h3>
										<div class="h-48 overflow-y-auto mb-3 space-y-2">
											{#if chatList.length > 0}
												{#each chatList.slice(-8) as message}
													{@const participantName = participantsList.find((p) => p.id === message.participant_id)?.name ?? 'Guest'}
													<div class="text-xs">
														<span class="text-brand font-semibold">{participantName}:</span>
														<span class="text-secondary">{message.message}</span>
													</div>
												{/each}
											{:else}
												<p class="text-xs text-secondary">No messages yet</p>
											{/if}
										</div>
										<div class="flex gap-2">
											<input
												bind:value={chatMessage}
												on:keydown={(e) => e.key === 'Enter' && submitChatMessage()}
												placeholder="Type message..."
												class="flex-1 surface-muted border border-line rounded px-3 py-2 text-sm text-primary placeholder:text-secondary"
											/>
											<button
												on:click={submitChatMessage}
												class="px-3 py-2 bg-brand text-white rounded hover:bg-brand transition"
											>
												<IconSend class="h-4 w-4" />
											</button>
										</div>
									</div>
								</div>
							</div>

							<!-- Dashboard mode toggle -->
							<div class="mt-6 flex justify-center">
								<button
									on:click={() => (dashboardMode = 'classic')}
									class="px-4 py-2 surface-input text-secondary rounded-lg hover:bg-surface-muted text-sm transition"
								>
									Switch to Classic View
								</button>
							</div>
						{:else}
							<!-- Classic Dashboard Layout -->
							<div class="rounded-xl border border-line bg-slate-900/80 p-4 overflow-x-auto">
								{#if activeTab === 'roadmap'}
									<div class="min-w-[350px]">
										<RoadmapChart responses={responsesForViz} width={isMobile ? 350 : 900} height={isMobile ? 400 : 520} />
									</div>
								{:else if activeTab === 'response-landscape'}
									<div class="min-w-[350px]">
										<LandscapeChart
											responses={responsesForViz}
											width={isMobile ? 350 : 900}
											height={isMobile ? 400 : 520}
											xLabel={landscapeXLabel}
											yLabel={landscapeYLabel}
											minX={landscapeMinX}
											maxX={landscapeMaxX}
											minY={landscapeMinY}
											maxY={landscapeMaxY}
										/>
									</div>
								{:else if activeTab === 'timeline'}
									<div class="space-y-4">
										{#each timelineList as item}
											<div class="rounded-lg border border-line panel p-4">
												<div class="flex items-center justify-between">
													<span
														class="inline-flex items-center gap-2 rounded-full border border-brand/40 px-3 py-1 text-xs uppercase tracking-[0.2em] text-cyan-200"
														>{item.label}</span
													>
													<span class="text-xs text-secondary">{item.created_at}</span>
												</div>
												<p class="mt-3 text-sm text-secondary">{item.item_text}</p>
												<div class="mt-2 text-xs text-secondary flex flex-wrap gap-4">
													{#if item.owner}<span>Owner: {item.owner}</span>{/if}
													{#if item.metric}<span>Metric: {item.metric}</span>{/if}
													{#if item.risk_note}<span>Risk: {item.risk_note}</span>{/if}
												</div>
											</div>
										{/each}
										{#if isFacilitator()}
											<button
												class="mt-2 inline-flex items-center gap-2 rounded-lg border border-brand/40 px-4 py-2 text-sm text-cyan-200 hover:border-cyan-300 transition-colors"
												on:click={() => (timelineModalOpen = true)}
											>
												<IconPlus class="h-4 w-4" />
												Add timeline item
											</button>
										{/if}
									</div>
								{:else if activeTab === 'chat'}
									<div class="flex flex-col gap-4">
										<div class="max-h-80 space-y-3 overflow-y-auto pr-2">
											{#each chatList as entry}
												<div class="rounded-lg border border-line panel p-3">
													<div class="flex items-center justify-between text-xs text-secondary">
														<span
															>{participantsList.find((p) => p.id === entry.participant_id)?.name ??
																'Anonymous'}</span
														>
														<span>{entry.created_at}</span>
													</div>
													<p class="mt-2 text-sm text-secondary">{entry.message}</p>
												</div>
											{/each}
										</div>
										<form class="flex gap-3" on:submit|preventDefault={submitChatMessage}>
											<input
												class="flex-1 rounded-lg border border-line bg-surface-muted px-3 py-2 text-sm text-primary placeholder:text-secondary focus:border-brand focus:outline-none"
												placeholder="Share a quick note for the room"
												bind:value={chatMessage}
											/>
											<button
												type="submit"
												class="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand transition-colors"
											>
												<IconSend class="h-4 w-4" />
												Send
											</button>
										</form>
									</div>
								{:else if activeTab === 'participants'}
									<div class="space-y-4">
										<div class="flex items-center justify-between">
											<h3 class="text-lg font-semibold text-primary">
												Participant Activity Dashboard
											</h3>
											<span class="text-sm text-secondary"
												>{participantActivity.length} participants</span
											>
										</div>

										<!-- Activity Summary -->
										<div class="grid gap-4 lg:grid-cols-4">
											<div class="rounded-lg border border-green-400/30 bg-green-400/10 p-3">
												<p class="text-xs uppercase tracking-wide text-green-200">
													Recently Active
												</p>
												<p class="text-xl font-semibold text-primary">
													{participantActivity.filter((p) => p.isRecent).length}
												</p>
												<p class="text-xs text-green-100/80">Last 5 minutes</p>
											</div>
											<div class="rounded-lg border border-brand/30 bg-brand/10 p-3">
												<p class="text-xs uppercase tracking-wide text-cyan-200">Total Responses</p>
												<p class="text-xl font-semibold text-primary">
													{participantActivity.reduce((sum, p) => sum + p.responseCount, 0)}
												</p>
												<p class="text-xs text-cyan-100/80">Ideas shared</p>
											</div>
											<div class="rounded-lg border border-retro-purple/30 bg-retro-purple/10 p-3">
												<p class="text-xs uppercase tracking-wide text-purple-200">Total Votes</p>
												<p class="text-xl font-semibold text-primary">
													{participantActivity.reduce((sum, p) => sum + p.totalVotes, 0)}
												</p>
												<p class="text-xs text-purple-100/80">Votes cast</p>
											</div>
											<div class="rounded-lg border border-yellow-400/30 bg-yellow-400/10 p-3">
												<p class="text-xs uppercase tracking-wide text-yellow-200">Chat Messages</p>
												<p class="text-xl font-semibold text-primary">
													{participantActivity.reduce((sum, p) => sum + p.chatCount, 0)}
												</p>
												<p class="text-xs text-yellow-100/80">Messages sent</p>
											</div>
										</div>

										<!-- Participant List -->
										<div class="space-y-3">
											{#each participantActivity as participant}
												<div class="rounded-lg border border-line panel p-4">
													<div class="flex items-center justify-between">
														<div class="flex items-center gap-3">
															<div
																class="w-10 h-10 rounded-full flex items-center justify-center text-primary font-semibold"
																style="background-color: {participant.color}"
															>
																{participant.name.charAt(0).toUpperCase()}
															</div>
															<div>
																<div class="flex items-center gap-2">
																	<span class="font-medium text-primary">{participant.name}</span>
																	<span
																		class="px-2 py-1 text-xs rounded-full surface-input text-secondary"
																	>
																		{participant.role}
																	</span>
																	{#if participant.isRecent}
																		<span
																			class="w-2 h-2 bg-green-400 rounded-full"
																			title="Active recently"
																		></span>
																	{/if}
																</div>
																<div class="flex items-center gap-4 text-xs text-secondary mt-1">
																	<span>Last: {participant.lastActivity}</span>
																	{#if participant.minutesSinceActivity < 60}
																		<span>{participant.minutesSinceActivity}m ago</span>
																	{:else if participant.minutesSinceActivity < 1440}
																		<span
																			>{Math.floor(participant.minutesSinceActivity / 60)}h ago</span
																		>
																	{:else}
																		<span
																			>{Math.floor(participant.minutesSinceActivity / 1440)}d ago</span
																		>
																	{/if}
																</div>
															</div>
														</div>
														<div class="text-right">
															<div class="text-lg font-semibold text-cyan-200">
																{participant.activityScore}
															</div>
															<div class="text-xs text-secondary">activity score</div>
														</div>
													</div>

													<div class="mt-3 grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
														<div class="text-center p-2 rounded surface-muted/60">
															<div class="font-medium text-primary">{participant.responseCount}</div>
															<div class="text-xs text-secondary">responses</div>
														</div>
														<div class="text-center p-2 rounded surface-muted/60">
															<div class="font-medium text-primary">{participant.totalVotes}</div>
															<div class="text-xs text-secondary">votes</div>
														</div>
														<div class="text-center p-2 rounded surface-muted/60">
															<div class="font-medium text-primary">{participant.chatCount}</div>
															<div class="text-xs text-secondary">chats</div>
														</div>
														<div class="text-center p-2 rounded surface-muted/60">
															<div class="font-medium text-primary truncate px-1">{participant.score ?? participant.points ?? 0}</div>
															<div class="text-xs text-secondary">points</div>
														</div>
													</div>

													{#if participant.badges && participant.badges.length > 0}
														<div class="mt-3 flex flex-wrap gap-2">
															{#each participant.badges as badge}
																<span
																	class="px-2 py-1 text-xs rounded-full bg-yellow-400/20 text-yellow-300"
																>
																	{badge}
																</span>
															{/each}
														</div>
													{/if}
												</div>
											{/each}
										</div>
									</div>
								{/if}

								<!-- Classic view toggle back to immersive -->
								<div class="mt-4 flex justify-center">
									<button
										on:click={() => (dashboardMode = 'immersive')}
										class="px-4 py-2 bg-brand text-primary rounded-lg hover:bg-brand text-sm"
									>
										Switch to Immersive Dashboard
									</button>
								</div>
							</div>
						{/if}
					</div>
					</section>
				{/if}

				<!-- Leaderboard and QR Code Section: Facilitator Only -->
				{#if isFacilitator()}
					<section class="grid gap-6 lg:grid-cols-2">
					<div class="rounded-2xl border border-line panel p-6">
						<h2 class="text-lg font-semibold text-primary">Leaderboard</h2>
						<p class="text-sm text-secondary">
							Points reflect contributions, votes earned, and justice prompts.
						</p>
						<ul class="mt-4 space-y-3">
							{#each leaderboardList as player, index}
								<li
									class="flex items-center justify-between rounded-lg border border-line panel px-3 py-2"
								>
									<div class="flex items-center gap-3">
										<span class="text-xs text-secondary">#{index + 1}</span>
										<span
											class="h-8 w-8 rounded-full border border-line flex items-center justify-center font-semibold"
											style={`background:${player.color}`}
											>{player.name?.charAt(0)?.toUpperCase() ?? '?'}</span
										>
										<div>
											<p class="text-sm text-primary">{player.name}</p>
											<p class="text-xs text-secondary">{player.badges?.length ?? 0} badges</p>
										</div>
									</div>
									<span class="font-mono text-cyan-200">{player.score ?? player.points ?? 0} pts</span>
								</li>
							{/each}
						</ul>
					</div>

					<div class="rounded-2xl border border-line panel p-6">
						<h2 class="text-lg font-semibold text-primary">QR Code</h2>
						<p class="text-sm text-secondary">New participants can scan to join instantly.</p>
						<div class="mt-4 flex justify-center">
							{#if qrSrc}
								<img
									class="h-40 w-40 rounded-lg border border-line surface p-2"
									alt="Join session QR code"
									src={qrSrc}
								/>
							{/if}
						</div>
						<p class="mt-3 text-center text-xs text-secondary">/join?code={sessionCode}</p>
					</div>
					</section>
				{/if}
			</main>
		</div>
		<!-- End Main Content Area -->

		<!-- Mobile Floating Action Button - Temporarily hidden - not usable with current exercise -->
		<!-- {#if isMobile}
			<button
				on:click={() => cardStore.toggleCardPanel()}
				class="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-primary shadow-lg shadow-cyan-500/50 transition hover:bg-brand active:scale-95"
				aria-label="Open card panel"
			>
				<IconCards class="h-6 w-6" />
				{#if selectedCards.length > 0}
					<span
						class="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-purple-500 text-xs font-bold text-primary"
					>
						{selectedCards.length}
					</span>
				{/if}
			</button>
		{/if} -->

		<!-- Desktop Card Panel - Temporarily hidden - not usable with current exercise -->
		<!-- {#if !isMobile}
			<aside class="w-80 h-screen sticky top-0 overflow-hidden">
				<CardPanel
					selectedCards={selectedCards}
					maxSelection={5}
					onCardToggle={(card) => cardStore.toggleCard(card)}
					isOpen={true}
					isMobile={false}
				/>
			</aside>
		{/if} -->

		<!-- Mobile Card Panel (Bottom Drawer) - Temporarily hidden - not usable with current exercise -->
		<!-- {#if isMobile}
			<CardPanel
				selectedCards={selectedCards}
				maxSelection={5}
				onCardToggle={(card) => cardStore.toggleCard(card)}
				isOpen={isCardPanelOpen}
				isMobile={true}
			/>
		{/if} -->
	</div>
{:else}
	<div
		class="min-h-screen bg-gradient-to-br from-surface-muted via-surface to-white flex items-center justify-center"
	>
		<div class="rounded-2xl border border-line bg-surface-elevated px-6 py-10 text-center">
			<p class="text-sm text-secondary">Loading session…</p>
		</div>
	</div>
{/if}
</div>

<style>
	.session-shell {
		background: linear-gradient(180deg, hsl(var(--surface)) 0%, hsl(var(--surface-elevated)) 60%, #ffffff 100%);
		color: hsl(var(--text-secondary));
	}

	.session-shell :global(.bg-slate-900\/80),
	.session-shell :global(.bg-slate-900\/70),
	.session-shell :global(.bg-slate-900\/60),
	.session-shell :global(.bg-slate-900\/50),
	.session-shell :global(.bg-slate-900\/40),
	.session-shell :global(.bg-slate-900\/30) {
		background: hsl(var(--surface-elevated) / 0.95) !important;
		color: hsl(var(--text-secondary)) !important;
		box-shadow: 0 18px 55px rgba(15, 23, 42, 0.08);
	}

	.session-shell :global(.surface-muted\/60),
	.session-shell :global(.surface-muted\/50),
	.session-shell :global(.surface-muted\/40),
	.session-shell :global(.surface-muted\/30),
	.session-shell :global(.surface-input) {
		background: hsl(var(--surface-elevated)) !important;
		color: hsl(var(--text-secondary)) !important;
	}

	.session-shell :global(.border-line),
	.session-shell :global(.border-line),
	.session-shell :global(.border-line) {
		border-color: hsl(var(--border-subtle)) !important;
	}

	.session-shell input,
	.session-shell textarea,
	.session-shell select {
		background: hsl(var(--surface-elevated));
		border: 1px solid hsl(var(--border-subtle));
		color: hsl(var(--text-primary));
		box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
	}

	.session-shell input::placeholder,
	.session-shell textarea::placeholder {
		color: hsl(var(--text-muted));
	}

	.session-shell :global(.text-secondary),
	.session-shell :global(.text-secondary),
	.session-shell :global(.text-secondary) {
		color: hsl(var(--text-secondary)) !important;
	}

	.session-shell :global(.text-primary),
	.session-shell :global(.text-primary) {
		color: hsl(var(--text-primary)) !important;
	}
</style>
{#if responseModalOpen}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur">
		<div class="w-full max-w-xl rounded-2xl border border-line bg-surface-elevated p-6 shadow-2xl">
			<h2 class="text-lg font-semibold text-primary">Share your response</h2>
			<p class="mt-1 text-sm text-secondary">
				Link cards to earn bonus points and center your thinking.
			</p>
			<div class="mt-4 space-y-4">
				<div class="flex flex-col gap-2 text-sm text-secondary">
					Prompt
					<div class="rounded-lg border border-line bg-surface-muted px-3 py-2">
						<p class="text-sm text-primary leading-relaxed">
							{#if currentQuestion}
								{#if currentQuestion.section}
									<strong class="text-brand mr-1">{currentQuestion.section}:</strong>
								{/if}
								{currentQuestion.text}
							{:else}
								Select a question to respond to.
							{/if}
						</p>
					</div>
				</div>
				{#if modalResponseType === 'scale'}
					<!-- Scale / Slider Input -->
					<label class="flex flex-col gap-2 text-sm text-secondary">
						Your rating ({scaleMin}-{scaleMax})
						<div class="space-y-2">
							<input
								type="range"
								min={scaleMin}
								max={scaleMax}
								step="1"
								class="w-full h-2 surface-input rounded-lg appearance-none cursor-pointer accent-brand"
								bind:value={responseText}
							/>
							<div class="flex justify-between text-xs">
								<span class="text-secondary">{scaleMinLabel}</span>
								<span class="text-brand font-bold text-lg">{responseText || scaleMin}</span>
								<span class="text-secondary">{scaleMaxLabel}</span>
							</div>
						</div>
					</label>

				{:else if modalResponseType === 'singleChoice'}
					<!-- Single Choice Radio Buttons -->
					<label class="flex flex-col gap-2 text-sm text-secondary">
						Select one option
						<div class="space-y-2">
							{#each modalOptions as option}
								<label class="flex items-center gap-2 p-2 rounded border border-line bg-surface-muted hover:border-brand/50 cursor-pointer">
									<input
										type="radio"
										name="response-choice"
										value={option}
										bind:group={responseText}
										class="accent-brand"
									/>
									<span class="text-sm text-primary">{option}</span>
								</label>
							{/each}
						</div>
					</label>

				{:else if modalResponseType === 'multiSelect'}
					<!-- Multi-Select Checkboxes -->
					{@const selections = responseText ? responseText.split(',').map(s => s.trim()) : []}
					<label class="flex flex-col gap-2 text-sm text-secondary">
						Select all that apply
						<div class="space-y-2 max-h-64 overflow-y-auto">
							{#each modalOptions as option}
								<label class="flex items-center gap-2 p-2 rounded border border-line bg-surface-muted hover:border-brand/50 cursor-pointer">
									<input
										type="checkbox"
										value={option}
										checked={selections.includes(option)}
										on:change={(e) => {
											const target = e.currentTarget;
											if (target instanceof HTMLInputElement && target.checked) {
												responseText = [...selections, option].join(', ');
											} else {
												responseText = selections.filter(s => s !== option).join(', ');
											}
										}}
										class="accent-brand"
									/>
									<span class="text-sm text-primary">{option}</span>
								</label>
							{/each}
						</div>
					</label>

				{:else if modalResponseType === 'landscape'}
					<!-- 2D Landscape Positioning -->
					<div class="space-y-4">
						<label class="flex flex-col gap-2 text-sm text-secondary">
							Label your position (optional)
							<input
								type="text"
								class="rounded-lg border border-line bg-surface-muted px-3 py-2 text-sm text-primary focus:border-brand focus:outline-none"
								placeholder="Brief description..."
								value={landscapeLabel}
								on:input={handleLandscapeLabelInput}
							/>
						</label>
						<div class="flex flex-col gap-2">
							<label class="text-sm text-secondary">
								{landscapeXLabel}: <span class="text-brand font-bold">{landscapeX}</span>
								<input
									type="range"
									min={landscapeMinX}
									max={landscapeMaxX}
									step="0.1"
									class="w-full h-2 surface-input rounded-lg appearance-none cursor-pointer accent-brand mt-2"
									value={landscapeX}
									on:input={(event) => handleLandscapeAxisChange('x', event)}
								/>
							</label>
							<label class="text-sm text-secondary">
								{landscapeYLabel}: <span class="text-brand font-bold">{landscapeY}</span>
								<input
									type="range"
									min={landscapeMinY}
									max={landscapeMaxY}
									step="0.1"
									class="w-full h-2 surface-input rounded-lg appearance-none cursor-pointer accent-brand mt-2"
									value={landscapeY}
									on:input={(event) => handleLandscapeAxisChange('y', event)}
								/>
							</label>
						</div>
					</div>

				{:else if modalResponseType === 'riskAssessment'}
					<!-- Risk Assessment Response -->
					<RiskAssessmentInput
						question={currentQuestion}
						on:submit={handleAdvancedResponseSubmit}
					/>

				{:else if modalResponseType === 'maturityDial'}
					<!-- Maturity Dial Response -->
					<MaturityDialInput
						question={currentQuestion}
						on:submit={handleAdvancedResponseSubmit}
					/>

				{:else if modalResponseType === 'inclusivityMeter'}
					<!-- Inclusivity Meter Response -->
					<InclusivityMeterInput
						question={currentQuestion}
						on:submit={handleAdvancedResponseSubmit}
					/>

				{:else}
					<!-- Written / Text Response (default) -->
					<label class="flex flex-col gap-2 text-sm text-secondary">
						Your idea or insight
						<textarea
							class="min-h-[120px] rounded-lg border border-line bg-surface-muted px-3 py-2 text-sm text-primary focus:border-brand focus:outline-none"
							placeholder="Describe your thought, story, or challenge…"
							bind:value={responseText}
						/>
					</label>
				{/if}

				<!-- Selected Cards Display - Temporarily hidden - not usable with current exercise -->
				<!-- {#if selectedCards.length > 0}
					<div class="flex flex-col gap-2">
						<div class="flex items-center justify-between">
							<p class="text-sm text-secondary">Your selected cards</p>
							<button
								type="button"
								on:click={() => (isMobile ? cardStore.setCardPanelOpen(true) : null)}
								class="text-xs text-brand hover:text-brand"
							>
								{isMobile ? 'View all cards' : 'See panel →'}
							</button>
						</div>
						<div class="flex flex-wrap gap-2">
							{#each selectedCards as card}
								<div
									class="flex items-center gap-2 rounded-full border border-brand/40 bg-brand/10 px-3 py-1.5"
								>
									<span class="text-xs font-bold text-brand">{card.letter}</span>
									<span class="text-xs text-cyan-200">{card.title}</span>
								</div>
							{/each}
						</div>
						<p class="text-xs text-secondary">
							These cards will be automatically linked to your response
						</p>
					</div>
				{/if} -->
			</div>
			<!-- Submit buttons (hidden for advanced response types which have their own) -->
			{#if !['riskAssessment', 'maturityDial', 'inclusivityMeter'].includes(modalResponseType)}
				<div class="mt-6 flex items-center justify-end gap-3">
					<button
						class="rounded-lg border border-line px-4 py-2 text-sm text-secondary hover:border-slate-500"
						on:click={() => (responseModalOpen = false)}
					>
						Cancel
					</button>
					<button
						class="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-primary hover:bg-brand disabled:opacity-50 disabled:cursor-not-allowed"
						on:click={submitResponse}
						disabled={activePhase && !phaseRemainingMs}
					>
						{activePhase && !phaseRemainingMs ? 'Time Up' : 'Share idea'}
					</button>
				</div>
			{:else}
				<div class="mt-6 flex items-center justify-end">
					<button
						class="rounded-lg border border-line px-4 py-2 text-sm text-secondary hover:border-slate-500"
						on:click={() => (responseModalOpen = false)}
					>
						Cancel
					</button>
				</div>
			{/if}
		</div>
	</div>
{/if}

{#if timelineModalOpen}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur">
		<div class="w-full max-w-lg rounded-2xl border border-line bg-surface-elevated p-6 shadow-2xl">
			<h2 class="text-lg font-semibold text-primary">Add roadmap entry</h2>
			<div class="mt-4 space-y-4">
				<label class="flex flex-col gap-2 text-sm text-secondary">
					Phase
					<select
						class="rounded-lg border border-line bg-surface-muted px-3 py-2 text-primary focus:border-brand focus:outline-none"
						bind:value={timelineLabel}
					>
						<option value="Now">Now</option>
						<option value="Next">Next</option>
						<option value="Later">Later</option>
					</select>
				</label>
				<label class="flex flex-col gap-2 text-sm text-secondary">
					Item description
					<textarea
						class="min-h-[100px] rounded-lg border border-line bg-surface-muted px-3 py-2 text-sm text-primary focus:border-brand focus:outline-none"
						placeholder="What should we take forward?"
						bind:value={timelineText}
					/>
				</label>
				<div class="grid gap-3 md:grid-cols-2">
					<label class="flex flex-col gap-2 text-sm text-secondary">
						Owner
						<input
							class="rounded-lg border border-line bg-surface-muted px-3 py-2 text-sm text-primary focus:border-brand focus:outline-none"
							placeholder="Optional"
							bind:value={timelineOwner}
						/>
					</label>
					<label class="flex flex-col gap-2 text-sm text-secondary">
						Metric
						<input
							class="rounded-lg border border-line bg-surface-muted px-3 py-2 text-sm text-primary focus:border-brand focus:outline-none"
							placeholder="Optional"
							bind:value={timelineMetric}
						/>
					</label>
				</div>
				<label class="flex flex-col gap-2 text-sm text-secondary">
					Risk note
					<input
						class="rounded-lg border border-line bg-surface-muted px-3 py-2 text-sm text-primary focus:border-brand focus:outline-none"
						placeholder="Optional"
						bind:value={timelineRisk}
					/>
				</label>
			</div>
			<div class="mt-6 flex items-center justify-end gap-3">
				<button
					class="rounded-lg border border-line px-4 py-2 text-sm text-secondary hover:border-slate-500"
					on:click={() => (timelineModalOpen = false)}
				>
					Cancel
				</button>
				<button
					class="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-primary hover:bg-brand"
					on:click={submitTimelineItem}
				>
					Add to roadmap
				</button>
			</div>
		</div>
	</div>
{/if}
