// Phase 8: Analytics & Monitoring Service
// Tracks usage metrics for platform improvement

import { browser } from '$app/environment';

export interface AnalyticsEvent {
	eventName: string;
	eventCategory: 'engagement' | 'feature' | 'error' | 'performance' | 'conversion';
	properties: Record<string, any>;
	timestamp: string;
	sessionId?: string;
	participantId?: string;
}

export interface SessionMetrics {
	sessionCode: string;
	duration: number; // seconds
	participantCount: number;
	responseCount: number;
	voteCount: number;
	chatMessageCount: number;
	timelineItemCount: number;
	cardUsageCount: number;
	badgesEarned: number;
	avgResponseLength: number;
	equityScore: number;
	aiEnabled: boolean;
	completionRate: number; // % of participants who submitted responses
}

// Event tracking
const eventQueue: AnalyticsEvent[] = [];

export function trackEvent(
	eventName: string,
	eventCategory: AnalyticsEvent['eventCategory'],
	properties: Record<string, any> = {}
) {
	if (!browser) return;

	const event: AnalyticsEvent = {
		eventName,
		eventCategory,
		properties: {
			...properties,
			userAgent: navigator.userAgent,
			viewport: {
				width: window.innerWidth,
				height: window.innerHeight
			}
		},
		timestamp: new Date().toISOString()
	};

	// Add to queue
	eventQueue.push(event);

	// Store in localStorage
	try {
		const stored = JSON.parse(localStorage.getItem('cda:analytics-queue') || '[]');
		stored.push(event);
		// Keep last 100 events
		if (stored.length > 100) {
			stored.shift();
		}
		localStorage.setItem('cda:analytics-queue', JSON.stringify(stored));
	} catch (error) {
		console.error('Failed to store analytics event:', error);
	}

	// In production, send to analytics service (e.g., PostHog, Mixpanel, Google Analytics)
	// sendToAnalyticsService(event);
}

// Engagement tracking
export const trackEngagement = {
	joinSession: (sessionCode: string, role: string) => {
		trackEvent('session_joined', 'conversion', { sessionCode, role });
	},

	submitResponse: (sessionCode: string, questionId: string, cardCount: number, charCount: number) => {
		trackEvent('response_submitted', 'engagement', {
			sessionCode,
			questionId,
			cardCount,
			charCount
		});
	},

	vote: (sessionCode: string, responseId: string) => {
		trackEvent('vote_cast', 'engagement', { sessionCode, responseId });
	},

	selectCard: (sessionCode: string, cardId: string) => {
		trackEvent('card_selected', 'engagement', { sessionCode, cardId });
	},

	sendChat: (sessionCode: string) => {
		trackEvent('chat_sent', 'engagement', { sessionCode });
	},

	earnBadge: (sessionCode: string, badgeId: string, points: number) => {
		trackEvent('badge_earned', 'engagement', { sessionCode, badgeId, points });
	},

	viewAnalytics: (sessionCode: string, chartType: string) => {
		trackEvent('analytics_viewed', 'feature', { sessionCode, chartType });
	}
};

// Feature usage tracking
export const trackFeature = {
	openCardPanel: (sessionCode: string) => {
		trackEvent('card_panel_opened', 'feature', { sessionCode });
	},

	toggleAnonymousVoting: (sessionCode: string, enabled: boolean) => {
		trackEvent('anonymous_voting_toggled', 'feature', { sessionCode, enabled });
	},

	exportData: (sessionCode: string, format: 'json' | 'csv') => {
		trackEvent('data_exported', 'feature', { sessionCode, format });
	},

	enableAI: (sessionCode: string, model: string) => {
		trackEvent('ai_enabled', 'feature', { sessionCode, model });
	},

	useAIRecommendations: (sessionCode: string, acceptedCount: number, totalCount: number) => {
		trackEvent('ai_recommendations_used', 'feature', {
			sessionCode,
			acceptedCount,
			totalCount,
			acceptanceRate: acceptedCount / totalCount
		});
	},

	awardFacilitatorBadge: (sessionCode: string, awardType: string) => {
		trackEvent('facilitator_award_granted', 'feature', { sessionCode, awardType });
	}
};

// Error tracking
export const trackError = {
	apiError: (endpoint: string, statusCode: number, message: string) => {
		trackEvent('api_error', 'error', { endpoint, statusCode, message });
	},

	clientError: (errorName: string, errorMessage: string, stack?: string) => {
		trackEvent('client_error', 'error', { errorName, errorMessage, stack });
	},

	validationError: (field: string, errorMessage: string) => {
		trackEvent('validation_error', 'error', { field, errorMessage });
	}
};

// Performance tracking
export const trackPerformance = {
	pageLoad: (pageName: string, loadTime: number) => {
		trackEvent('page_loaded', 'performance', { pageName, loadTime });
	},

	chartRender: (chartType: string, renderTime: number, dataPoints: number) => {
		trackEvent('chart_rendered', 'performance', { chartType, renderTime, dataPoints });
	},

	realtimeLatency: (sessionCode: string, latency: number) => {
		trackEvent('realtime_latency', 'performance', { sessionCode, latency });
	}
};

// Session metrics calculation
export function calculateSessionMetrics(
	sessionCode: string,
	participants: any[],
	responses: any[],
	timeline: any[],
	chat: any[],
	startTime: Date,
	endTime?: Date
): SessionMetrics {
	const duration = endTime
		? (endTime.getTime() - startTime.getTime()) / 1000
		: (Date.now() - startTime.getTime()) / 1000;

	const participantCount = participants.length;
	const responseCount = responses.length;
	const voteCount = responses.reduce((sum, r) => sum + (r.votes || 0), 0);
	const chatMessageCount = chat.length;
	const timelineItemCount = timeline.length;

	const cardUsageCount = responses.reduce((sum, r) => sum + (r.cards?.length || 0), 0);
	const badgesEarned = participants.reduce((sum, p) => sum + (p.badges?.length || 0), 0);

	const avgResponseLength =
		responseCount > 0
			? responses.reduce((sum, r) => sum + r.text.length, 0) / responseCount
			: 0;

	// Calculate equity (simplified Gini coefficient)
	const responseCounts = participants.map(
		(p) => responses.filter((r) => r.participant_id === p.id).length
	);
	const gini = calculateGini(responseCounts);
	const equityScore = Math.round((1 - gini) * 100);

	const participantsWithResponses = participants.filter(
		(p) => responses.some((r) => r.participant_id === p.id)
	).length;
	const completionRate =
		participantCount > 0 ? (participantsWithResponses / participantCount) * 100 : 0;

	const aiEnabled = browser ? localStorage.getItem('cda:ai-config')?.includes('"enabled":true') || false : false;

	return {
		sessionCode,
		duration,
		participantCount,
		responseCount,
		voteCount,
		chatMessageCount,
		timelineItemCount,
		cardUsageCount,
		badgesEarned,
		avgResponseLength: Math.round(avgResponseLength),
		equityScore,
		aiEnabled,
		completionRate: Math.round(completionRate)
	};
}

function calculateGini(values: number[]): number {
	if (values.length === 0) return 0;

	const sorted = [...values].sort((a, b) => a - b);
	const n = sorted.length;
	const total = sorted.reduce((sum, v) => sum + v, 0);

	if (total === 0) return 0;

	let sum = 0;
	for (let i = 0; i < n; i++) {
		sum += ((i + 1) * sorted[i]) / total;
	}

	return (2 * sum) / n - (n + 1) / n;
}

// Export analytics data
export function exportAnalytics(): void {
	if (!browser) return;

	const events = JSON.parse(localStorage.getItem('cda:analytics-queue') || '[]');
	const blob = new Blob([JSON.stringify(events, null, 2)], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = `cda-analytics-${Date.now()}.json`;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}

// Clear analytics data
export function clearAnalytics(): void {
	if (!browser) return;
	localStorage.removeItem('cda:analytics-queue');
	eventQueue.length = 0;
}

// Setup global error tracking
if (browser) {
	window.addEventListener('error', (event) => {
		trackError.clientError(
			event.error?.name || 'Error',
			event.error?.message || event.message,
			event.error?.stack
		);
	});

	window.addEventListener('unhandledrejection', (event) => {
		trackError.clientError(
			'UnhandledPromiseRejection',
			event.reason?.message || String(event.reason),
			event.reason?.stack
		);
	});
}
