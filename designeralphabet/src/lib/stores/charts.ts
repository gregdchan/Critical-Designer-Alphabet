/**
 * Unified chart store for consistent data across facilitator and presentation pages
 * PHASE-BASED & QUESTION-SPECIFIC architecture
 *
 * Key concepts:
 * - Each PHASE has multiple QUESTIONS
 * - Each QUESTION has a specific chart type (from Sanity: response_type, map_type, recommended_dashboards)
 * - Charts show data ONLY for their specific question (not aggregated)
 * - Phases determine which questions/charts to display
 */

import { derived, writable, get, type Readable } from 'svelte/store';
import { responses, questions as realtimeQuestions, sessionDetails, phases } from '$lib/realtime';
import type {
	ChartData,
	ChartSeries,
	ChartPoint,
	WordCloudData,
	LandscapePoint,
	RoadmapItem,
	HeatmapData
} from '$lib/types/charts';
import type { Response } from '$lib/gamification';
import type { Question, Phase } from '$lib/realtime';
import { getChartColor } from '$lib/utils/sanity';

// Throttle chart updates to ~10fps for performance
const CHART_UPDATE_THROTTLE = 100; // ms

let lastUpdate = 0;
const throttledUpdates = writable(0);

// Trigger throttled updates
function triggerChartUpdate() {
	const now = Date.now();
	if (now - lastUpdate > CHART_UPDATE_THROTTLE) {
		lastUpdate = now;
		throttledUpdates.update(n => n + 1);
	}
}

// Subscribe to responses and trigger updates
responses.subscribe(() => triggerChartUpdate());

/**
 * Map response_type and map_type to chart component names
 */
function getChartType(question: Question): string {
	// Priority 1: recommended_dashboards (explicitly set in Sanity)
	if (question.recommended_dashboards && question.recommended_dashboards.length > 0) {
		return question.recommended_dashboards[0]; // Use first recommendation
	}

	// Priority 2: map_type (for spatial/landscape charts)
	if (question.map_type) {
		return question.map_type; // e.g., 'landscape', 'roadmap'
	}

	// Priority 3: response_type (fallback)
	const responseType = question.response_type || 'written';

	switch (responseType) {
		case 'multiple_choice':
		case 'multiselect':
			return 'bar'; // Bar chart for options
		case 'scale':
			return 'line'; // Line chart for scale distribution
		case 'written':
		case 'text':
			return 'wordcloud'; // Word cloud for text
		case 'landscape':
		case 'positioning':
			return 'landscape'; // 2D scatter plot
		default:
			return 'bar'; // Default fallback
	}
}

/**
 * Get chart data for a SPECIFIC QUESTION
 * This is the core function - one question = one chart
 */
export function getQuestionChartData(
	questionId: string,
	$responses: Response[],
	$questions: Question[]
): ChartData | null {
	const question = $questions.find(q => q.id === questionId);
	if (!question) return null;

	// Filter responses for THIS question only
	const questionResponses = $responses.filter(r => r.question_id === questionId);
	if (questionResponses.length === 0) return null;

	const chartType = getChartType(question);

	// Build chart data based on response type
	switch (chartType) {
		case 'bar':
		case 'pie':
			return buildOptionChart(question, questionResponses);

		case 'wordcloud':
			return buildWordCloudChart(question, questionResponses);

		case 'landscape':
			return buildLandscapeChart(question, questionResponses);

		case 'roadmap':
		case 'timeline':
			return buildRoadmapChart(question, questionResponses);

		default:
			return buildOptionChart(question, questionResponses); // Fallback
	}
}

/**
 * Build bar/pie chart data for multiple choice questions
 */
function buildOptionChart(question: Question, questionResponses: Response[]): ChartData {
	const tallies = new Map<string, number>();

	questionResponses.forEach(r => {
		if (r.option_id) {
			tallies.set(r.option_id, (tallies.get(r.option_id) || 0) + 1);
		} else if (r.scale_value !== null && r.scale_value !== undefined) {
			// For scale questions, group by value
			const scaleKey = `${r.scale_value}`;
			tallies.set(scaleKey, (tallies.get(scaleKey) || 0) + 1);
		}
	});

	const points: ChartPoint[] = Array.from(tallies.entries()).map(
		([label, value], index) => ({
			label,
			value,
			color: getChartColor(index)
		})
	);

	return {
		title: question.text || question.section || 'Responses',
		series: [{ id: question.id, label: question.section || 'Options', points }],
		meta: {
			questionId: question.id,
			totalResponses: questionResponses.length,
			chartType: 'bar'
		}
	};
}

/**
 * Build word cloud data for text responses
 */
function buildWordCloudChart(question: Question, questionResponses: Response[]): ChartData {
	const textResponses = questionResponses.filter(r => r.response_text);

	// Count word frequency
	const wordCounts = new Map<string, number>();

	textResponses.forEach(r => {
		if (!r.response_text) return;

		const words = r.response_text
			.toLowerCase()
			.split(/\W+/)
			.filter(w => w.length > 3); // Filter short words

		words.forEach(word => {
			wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
		});
	});

	const points: ChartPoint[] = Array.from(wordCounts.entries())
		.map(([label, value], index) => ({
			label,
			value,
			color: getChartColor(index)
		}))
		.sort((a, b) => b.value - a.value)
		.slice(0, 50); // Top 50 words

	return {
		title: question.text || 'Word Cloud',
		series: [{ id: question.id, label: 'Words', points }],
		meta: {
			questionId: question.id,
			totalResponses: textResponses.length,
			chartType: 'wordcloud'
		}
	};
}

/**
 * Build landscape/scatter plot data
 */
function buildLandscapeChart(question: Question, questionResponses: Response[]): ChartData {
	const landscapeResponses = questionResponses.filter(
		r => r.landscape_x !== null && r.landscape_x !== undefined &&
			r.landscape_y !== null && r.landscape_y !== undefined
	);

	const points: ChartPoint[] = landscapeResponses.map((r, index) => ({
		label: r.response_text || `Response ${index + 1}`,
		value: r.votes || 0,
		color: getChartColor(index),
		metadata: {
			x: r.landscape_x!,
			y: r.landscape_y!,
			participantId: r.participant_id,
			votes: r.votes || 0
		}
	}));

	return {
		title: question.text || 'Landscape View',
		series: [{ id: question.id, label: 'Responses', points }],
		meta: {
			questionId: question.id,
			totalResponses: landscapeResponses.length,
			chartType: 'landscape',
			config: question.config || {}
		}
	};
}

/**
 * Build roadmap/timeline chart
 */
function buildRoadmapChart(question: Question, questionResponses: Response[]): ChartData {
	const textResponses = questionResponses.filter(r => r.response_text);

	const points: ChartPoint[] = textResponses.map((r, index) => ({
		label: r.response_text || `Item ${index + 1}`,
		value: r.votes || 0,
		color: getChartColor(index),
		metadata: {
			responseId: r.id,
			participantId: r.participant_id,
			createdAt: r.created_at
		}
	}));

	return {
		title: question.text || 'Roadmap',
		series: [{ id: question.id, label: 'Items', points }],
		meta: {
			questionId: question.id,
			totalResponses: textResponses.length,
			chartType: 'roadmap'
		}
	};
}

/**
 * PHASE-BASED STORES
 * These are the main exports - organized by phase and question
 */

/**
 * Get all questions for a specific phase
 */
export const phaseQuestions = derived(
	[phases, realtimeQuestions],
	([$phases, $questions]) => {
		const phaseMap = new Map<string, Question[]>();

		$phases.forEach(phase => {
			const phaseKey = phase.phase_key || phase.id;
			const phaseQs = $questions.filter(q => q.phase_key === phaseKey);
			phaseMap.set(phaseKey, phaseQs);
		});

		return phaseMap;
	}
);

/**
 * Get chart data for all questions in a phase
 */
export function getPhaseCharts(
	phaseKey: string,
	$responses: Response[],
	$questions: Question[]
): Map<string, { question: Question; chartData: ChartData | null; chartType: string }> {
	const phaseQs = $questions.filter(q => q.phase_key === phaseKey);
	const chartMap = new Map();

	phaseQs.forEach(question => {
		const chartData = getQuestionChartData(question.id, $responses, $questions);
		const chartType = getChartType(question);

		chartMap.set(question.id, {
			question,
			chartData,
			chartType
		});
	});

	return chartMap;
}

/**
 * Reactive store: Charts for current active phase
 */
export const activePhaseCharts = derived(
	[sessionDetails, phases, responses, realtimeQuestions, throttledUpdates],
	([$session, $phases, $responses, $questions, _]) => {
		if (!$session?.active_phase_key || !$phases || !$questions || !$responses) {
			return new Map();
		}

		const activePhaseKey = $session.active_phase_key;
		return getPhaseCharts(activePhaseKey, $responses, $questions);
	}
);

/**
 * Session summary for display
 */
export const sessionSummary = derived(
	[sessionDetails, responses, realtimeQuestions, phases],
	([$session, $responses, $questions, $phases]) => {
		const activePhase = $phases.find(p =>
			p.phase_key === $session?.active_phase_key || p.id === $session?.active_phase_key
		);

		return {
			code: $session?.code || '',
			title: $session?.title || 'Untitled Session',
			status: $session?.status || 'planned',
			totalResponses: $responses?.length || 0,
			totalQuestions: $questions?.length || 0,
			totalPhases: $phases?.length || 0,
			activePhase: activePhase || null,
			activePhaseKey: $session?.active_phase_key || null
		};
	}
);

/**
 * Export helper to get chart component name from chart type
 */
export { getChartType };
