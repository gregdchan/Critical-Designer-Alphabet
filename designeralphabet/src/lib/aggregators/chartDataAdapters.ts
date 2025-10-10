import type { Question } from '$lib/types/workshop';

/**
 * Adapters to transform question responses into chart-compatible data formats
 */

type Response = {
	id: string;
	text: string;
	votes?: number;
	question_id?: string;
	participant_id?: string;
	created_at?: string;
	[key: string]: any;
};

/**
 * Risk Impact Matrix Adapter
 * Expects responses with impact (1-5) and likelihood (1-5) scores
 */
export function adaptRiskAssessmentData(responses: Response[], question: Question) {
	if (question.response_type !== 'riskAssessment') {
		console.warn('Question is not riskAssessment type');
		return [];
	}

	const riskMatrix = question.config?.riskMatrix as any;

	return responses
		.filter(r => r.question_id === question.id)
		.map(response => {
			// Use metadata if available
			const metadata = response.metadata;
			const hasRiskMetadata = metadata && metadata.type === 'riskAssessment';

			const impact = hasRiskMetadata ? metadata.impact : 3;
			const likelihood = hasRiskMetadata ? metadata.likelihood : 3;

			return {
				id: response.id,
				risk: response.text,
				text: response.text,
				impact: Math.max(1, Math.min(5, impact)),
				likelihood: Math.max(1, Math.min(5, likelihood)),
				votes: response.votes || 0,
				participant: response.participant_id || 'Unknown'
			};
		});
}

/**
 * Maturity Dial Adapter
 * Expects responses with maturity level (1-5)
 */
export function adaptMaturityData(responses: Response[], question: Question) {
	if (question.response_type !== 'maturityDial') {
		console.warn('Question is not maturityDial type');
		return { maturityLevel: 3, progress: 0.5 };
	}

	const maturityDialConfig = question.config?.maturityDial as any;
	const stages = maturityDialConfig?.stages || [
		{ level: 1, name: 'Foundational', description: 'Basic awareness' },
		{ level: 2, name: 'Developing', description: 'Early adoption' },
		{ level: 3, name: 'Proficient', description: 'Regular use' },
		{ level: 4, name: 'Advanced', description: 'Strategic integration' },
		{ level: 5, name: 'Aspirational', description: 'Innovation leadership' }
	];

	const questionResponses = responses.filter(r => r.question_id === question.id);

	if (questionResponses.length === 0) {
		return { maturityLevel: 3, progress: 0.5, stages };
	}

	// Parse maturity levels from responses (use metadata if available)
	const levels = questionResponses
		.map(r => {
			const metadata = r.metadata;
			const hasMaturityMetadata = metadata && metadata.type === 'maturityDial';

			if (hasMaturityMetadata) {
				return metadata.level;
			}

			// Fallback: try to parse from text
			const levelMatch = r.text?.match(/\d+/);
			return levelMatch ? parseInt(levelMatch[0]) : 3;
		})
		.filter(l => l >= 1 && l <= 5);

	const avgLevel = levels.length > 0 ? levels.reduce((a, b) => a + b, 0) / levels.length : 3;
	const maturityLevel = Math.round(avgLevel);
	const progress = avgLevel - maturityLevel + 0.5; // Progress within level

	return {
		maturityLevel: Math.max(1, Math.min(5, maturityLevel)),
		progress: Math.max(0, Math.min(1, progress)),
		stages,
		dimension: maturityDialConfig?.dimension || 'Maturity'
	};
}

/**
 * Inclusivity Meter Adapter
 * Expects responses with inclusivity score (0-100)
 */
export function adaptInclusivityData(responses: Response[], question: Question) {
	if (question.response_type !== 'inclusivityMeter') {
		console.warn('Question is not inclusivityMeter type');
		return { score: 50, targetScore: 75 };
	}

	const meterConfig = question.config?.inclusivityMeter as any;
	const questionResponses = responses.filter(r => r.question_id === question.id);

	if (questionResponses.length === 0) {
		return {
			score: 50,
			targetScore: meterConfig?.targetScore || 75,
			lowLabel: meterConfig?.lowLabel || 'Needs Improvement',
			highLabel: meterConfig?.highLabel || 'Highly Inclusive',
			dimension: meterConfig?.dimension || 'Inclusivity'
		};
	}

	// Parse scores from responses (0-100, use metadata if available)
	const scores = questionResponses
		.map(r => {
			const metadata = r.metadata;
			const hasInclusivityMetadata = metadata && metadata.type === 'inclusivityMeter';

			if (hasInclusivityMetadata) {
				return metadata.score;
			}

			// Fallback: try to parse from text
			const scoreMatch = r.text?.match(/\d+/);
			return scoreMatch ? parseInt(scoreMatch[0]) : 50;
		})
		.filter(s => s >= 0 && s <= 100);

	const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 50;

	return {
		score: Math.round(avgScore),
		targetScore: meterConfig?.targetScore || 75,
		lowLabel: meterConfig?.lowLabel || 'Needs Improvement',
		highLabel: meterConfig?.highLabel || 'Highly Inclusive',
		dimension: meterConfig?.dimension || 'Inclusivity'
	};
}

/**
 * Landscape (2D positioning) Adapter
 * Expects responses with x,y coordinates
 */
export function adaptLandscapeData(responses: Response[], question: Question) {
	if (question.response_type !== 'landscape') {
		console.warn('Question is not landscape type');
		return [];
	}

	const landscapeConfig = question.config?.landscape as any;

	return responses
		.filter(r => r.question_id === question.id)
		.map(response => {
			// Use metadata if available
			const metadata = response.metadata;
			const hasLandscapeMetadata = metadata && metadata.type === 'landscape';

			const label = response.text;
			const x = hasLandscapeMetadata ? metadata.x : 5;
			const y = hasLandscapeMetadata ? metadata.y : 5;

			return {
				id: response.id,
				label,
				x: Math.max(landscapeConfig?.minX || 0, Math.min(landscapeConfig?.maxX || 10, x)),
				y: Math.max(landscapeConfig?.minY || 0, Math.min(landscapeConfig?.maxY || 10, y)),
				votes: response.votes || 0,
				participant: response.participant_id || 'Unknown'
			};
		});
}

/**
 * Heatmap Adapter
 * Groups responses by lens and calculates intensity
 */
export function adaptHeatmapData(responses: Response[], questions: Question[]) {
	// Get questions with lens assigned
	const lensQuestions = questions.filter(q => q.lens);

	const heatmapData: Record<string, Record<string, number>> = {};

	lensQuestions.forEach(question => {
		const questionResponses = responses.filter(r => r.question_id === question.id);
		const lens = question.lens || 'General';

		if (!heatmapData[lens]) {
			heatmapData[lens] = {};
		}

		// Count responses by category/type
		const responseType = question.response_type || 'written';
		heatmapData[lens][responseType] = (heatmapData[lens][responseType] || 0) + questionResponses.length;
	});

	return heatmapData;
}
