/**
 * Unified chart store for consistent data across facilitator and presentation pages
 * Combines Supabase realtime data with Sanity static metadata
 */

import { derived, writable, get, type Readable } from 'svelte/store';
import {responses, questions as realtimeQuestions, sessionDetails } from '$lib/realtime';
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
import type { Question } from '$lib/realtime';
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
 * Response tally chart - shows count of responses per option
 */
export const responseTallyChart: Readable<ChartData | null> = derived(
	[responses, realtimeQuestions, throttledUpdates],
	([$responses, $questions, _]) => {
		if (!$responses || !$questions || $questions.length === 0) {
			return null;
		}

		// Aggregate responses by question and option
		const tallies = new Map<string, Map<string, number>>();

		$responses.forEach(r => {
			if (!r.option_id) return;

			if (!tallies.has(r.question_id)) {
				tallies.set(r.question_id, new Map());
			}

			const questionTally = tallies.get(r.question_id)!;
			const currentCount = questionTally.get(r.option_id) || 0;
			questionTally.set(r.option_id, currentCount + 1);
		});

		// Build series for each question
		const series: ChartSeries[] = [];

		$questions.forEach((q, qIndex) => {
			const questionTally = tallies.get(q.id);
			if (!questionTally || questionTally.size === 0) return;

			const points: ChartPoint[] = Array.from(questionTally.entries()).map(
				([optionId, count], index) => ({
					label: optionId,
					value: count,
					color: getChartColor(index)
				})
			);

			series.push({
				id: q.id,
				label: q.text || q.section || `Question ${qIndex + 1}`,
				points
			});
		});

		return {
			title: 'Response Distribution',
			series,
			meta: {
				totalResponses: $responses.length,
				totalQuestions: $questions.length
			}
		};
	}
);

/**
 * Word cloud data - extracts text responses for visualization
 */
export const wordCloudData: Readable<WordCloudData | null> = derived(
	[responses, throttledUpdates],
	([$responses, _]) => {
		if (!$responses) return null;

		const textResponses = $responses.filter(r => r.response_text);
		if (textResponses.length === 0) return null;

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

		// Convert to array and sort by frequency
		return Array.from(wordCounts.entries())
			.map(([text, value], index) => ({
				text,
				value,
				color: getChartColor(index)
			}))
			.sort((a, b) => b.value - a.value)
			.slice(0, 50); // Top 50 words
	}
);

/**
 * Landscape chart data - for 2D scatter plot responses
 */
export const landscapeData: Readable<LandscapePoint[] | null> = derived(
	[responses, throttledUpdates],
	([$responses, _]) => {
		if (!$responses) return null;

		const landscapeResponses = $responses.filter(
			r => r.landscape_x !== null && r.landscape_x !== undefined &&
			     r.landscape_y !== null && r.landscape_y !== undefined
		);

		if (landscapeResponses.length === 0) return null;

		return landscapeResponses.map((r, index) => ({
			x: r.landscape_x!,
			y: r.landscape_y!,
			label: r.response_text || `Response ${index + 1}`,
			color: getChartColor(index),
			metadata: {
				participantId: r.participant_id,
				questionId: r.question_id,
				votes: r.votes || 0
			}
		}));
	}
);

/**
 * Theme heatmap - aggregates responses by topic/category
 */
export const themeHeatmap: Readable<ChartData | null> = derived(
	[responses, realtimeQuestions, throttledUpdates],
	([$responses, $questions, _]) => {
		if (!$responses || !$questions) return null;

		// Group by section (topic/theme)
		const themeCounts = new Map<string, number>();

		$responses.forEach(r => {
			const question = $questions.find(q => q.id === r.question_id);
			if (!question || !question.section) return;

			const section = question.section;
			themeCounts.set(section, (themeCounts.get(section) || 0) + 1);
		});

		if (themeCounts.size === 0) return null;

		const points: ChartPoint[] = Array.from(themeCounts.entries()).map(
			([label, value], index) => ({
				label,
				value,
				color: getChartColor(index)
			})
		);

		return {
			title: 'Theme Engagement',
			series: [{ id: 'themes', label: 'Themes', points }],
			meta: {
				totalThemes: themeCounts.size
			}
		};
	}
);

/**
 * Scale responses chart - for numeric scale questions
 */
export const scaleChart: Readable<ChartData | null> = derived(
	[responses, realtimeQuestions, throttledUpdates],
	([$responses, $questions, _]) => {
		if (!$responses || !$questions) return null;

		const scaleResponses = $responses.filter(r => r.scale_value !== null);
		if (scaleResponses.length === 0) return null;

		// Group by question
		const scaleData = new Map<string, number[]>();

		scaleResponses.forEach(r => {
			if (!scaleData.has(r.question_id)) {
				scaleData.set(r.question_id, []);
			}
			scaleData.get(r.question_id)!.push(r.scale_value!);
		});

		// Calculate averages
		const series: ChartSeries[] = Array.from(scaleData.entries()).map(
			([questionId, values], index) => {
				const question = $questions.find(q => q.id === questionId);
				const avg = values.reduce((sum, v) => sum + v, 0) / values.length;

				return {
					id: questionId,
					label: question?.text || question?.section || `Scale ${index + 1}`,
					points: [
						{
							label: 'Average',
							value: avg,
							color: getChartColor(index)
						}
					]
				};
			}
		);

		return {
			title: 'Scale Responses',
			series,
			meta: {
				totalScaleQuestions: scaleData.size
			}
		};
	}
);

/**
 * Voting leaderboard - shows most voted responses
 */
export const votingLeaderboard: Readable<ChartData | null> = derived(
	[responses, throttledUpdates],
	([$responses, _]) => {
		if (!$responses) return null;

		const votedResponses = $responses
			.filter(r => r.votes && r.votes > 0)
			.sort((a, b) => (b.votes || 0) - (a.votes || 0))
			.slice(0, 10); // Top 10

		if (votedResponses.length === 0) return null;

		const points: ChartPoint[] = votedResponses.map((r, index) => ({
			label: r.response_text?.substring(0, 30) || `Response ${r.id.substring(0, 8)}`,
			value: r.votes || 0,
			color: getChartColor(index),
			metadata: {
				responseId: r.id,
				fullText: r.response_text
			}
		}));

		return {
			title: 'Top Voted Responses',
			series: [{ id: 'votes', label: 'Votes', points }],
			meta: {
				totalVotedResponses: $responses.filter(r => r.votes && r.votes > 0).length
			}
		};
	}
);

/**
 * Session status summary for display
 */
export const sessionSummary = derived(
	[sessionDetails, responses, realtimeQuestions],
	([$session, $responses, $questions]) => {
		return {
			code: $session?.code || '',
			title: $session?.title || 'Untitled Session',
			status: $session?.status || 'planned',
			totalResponses: $responses?.length || 0,
			totalQuestions: $questions?.length || 0,
			activePhase: $session?.active_phase_key || null
		};
	}
);

// Export all chart stores
export const charts = {
	responseTally: responseTallyChart,
	wordCloud: wordCloudData,
	landscape: landscapeData,
	themes: themeHeatmap,
	scale: scaleChart,
	votingLeaderboard: votingLeaderboard,
	summary: sessionSummary
};
