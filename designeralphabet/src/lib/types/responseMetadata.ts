/**
 * Response Metadata Structure
 *
 * The responses.metadata JSON field stores structured data for advanced question types.
 * This file documents the expected structure for each response type.
 */

/**
 * Risk Assessment Response Metadata
 * Used with responseType: 'riskAssessment'
 */
export type RiskAssessmentMetadata = {
	type: 'riskAssessment';
	impact: number; // 1-5 scale
	likelihood: number; // 1-5 scale
	impactLabel?: string; // Optional custom label
	likelihoodLabel?: string; // Optional custom label
};

/**
 * Maturity Dial Response Metadata
 * Used with responseType: 'maturityDial'
 */
export type MaturityDialMetadata = {
	type: 'maturityDial';
	level: number; // 1-5 scale
	stageName?: string; // Optional stage name (e.g., "Proficient")
};

/**
 * Inclusivity Meter Response Metadata
 * Used with responseType: 'inclusivityMeter'
 */
export type InclusivityMeterMetadata = {
	type: 'inclusivityMeter';
	score: number; // 0-100 scale
	dimension?: string; // What aspect of inclusivity
};

/**
 * Landscape (2D Positioning) Response Metadata
 * Used with responseType: 'landscape'
 */
export type LandscapeMetadata = {
	type: 'landscape';
	x: number; // X-axis position
	y: number; // Y-axis position
	xLabel?: string; // Optional axis labels
	yLabel?: string;
};

/**
 * Scale/Slider Response Metadata
 * Used with responseType: 'scale'
 */
export type ScaleMetadata = {
	type: 'scale';
	value: number; // Numeric value on scale
	min?: number;
	max?: number;
};

/**
 * Single/Multi Choice Response Metadata
 * Used with responseType: 'singleChoice' or 'multiSelect'
 */
export type ChoiceMetadata = {
	type: 'choice';
	selectedOptions: string[]; // Array of selected option texts
};

/**
 * Union type of all response metadata
 */
export type ResponseMetadata =
	| RiskAssessmentMetadata
	| MaturityDialMetadata
	| InclusivityMeterMetadata
	| LandscapeMetadata
	| ScaleMetadata
	| ChoiceMetadata
	| null; // For simple text responses

/**
 * Helper to create risk assessment metadata
 */
export function createRiskAssessmentMetadata(
	impact: number,
	likelihood: number
): RiskAssessmentMetadata {
	return {
		type: 'riskAssessment',
		impact: Math.max(1, Math.min(5, impact)),
		likelihood: Math.max(1, Math.min(5, likelihood))
	};
}

/**
 * Helper to create maturity dial metadata
 */
export function createMaturityDialMetadata(
	level: number,
	stageName?: string
): MaturityDialMetadata {
	return {
		type: 'maturityDial',
		level: Math.max(1, Math.min(5, level)),
		stageName
	};
}

/**
 * Helper to create inclusivity meter metadata
 */
export function createInclusivityMeterMetadata(
	score: number,
	dimension?: string
): InclusivityMeterMetadata {
	return {
		type: 'inclusivityMeter',
		score: Math.max(0, Math.min(100, score)),
		dimension
	};
}

/**
 * Helper to create landscape metadata
 */
export function createLandscapeMetadata(
	x: number,
	y: number,
	xLabel?: string,
	yLabel?: string
): LandscapeMetadata {
	return {
		type: 'landscape',
		x,
		y,
		xLabel,
		yLabel
	};
}

/**
 * Type guard to check if metadata is risk assessment
 */
export function isRiskAssessmentMetadata(metadata: any): metadata is RiskAssessmentMetadata {
	return metadata?.type === 'riskAssessment';
}

/**
 * Type guard to check if metadata is maturity dial
 */
export function isMaturityDialMetadata(metadata: any): metadata is MaturityDialMetadata {
	return metadata?.type === 'maturityDial';
}

/**
 * Type guard to check if metadata is inclusivity meter
 */
export function isInclusivityMeterMetadata(metadata: any): metadata is InclusivityMeterMetadata {
	return metadata?.type === 'inclusivityMeter';
}

/**
 * Type guard to check if metadata is landscape
 */
export function isLandscapeMetadata(metadata: any): metadata is LandscapeMetadata {
	return metadata?.type === 'landscape';
}
