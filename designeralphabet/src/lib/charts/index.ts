// Chart component exports
export { default as BaseChart } from './BaseChart.svelte';
export { default as QuadBubbles } from './QuadBubbles.svelte';
export { default as MaturityDial } from './MaturityDial.svelte';
export { default as ParticipationPulse } from './ParticipationPulse.svelte';
export { default as InclusivityMeter } from './InclusivityMeter.svelte';
export { default as RiskImpactMatrix } from './RiskImpactMatrix.svelte';

// Chart component registry for dynamic rendering
export const CHART_COMPONENTS = {
	quadBubbles: () => import('./QuadBubbles.svelte'),
	maturityDial: () => import('./MaturityDial.svelte'),
	participationPulse: () => import('./ParticipationPulse.svelte'),
	inclusivityMeter: () => import('./InclusivityMeter.svelte'),
	riskImpactMatrix: () => import('./RiskImpactMatrix.svelte'),
	// Placeholder for additional charts
	aiReadinessHeatmap: () => import('./QuadBubbles.svelte'), // Fallback for now
	ethicsCompass: () => import('./QuadBubbles.svelte'),       // Fallback for now
	culturalInsightWheel: () => import('./QuadBubbles.svelte'), // Fallback for now
	storyPath: () => import('./QuadBubbles.svelte'),           // Fallback for now
	wordConstellation: () => import('./QuadBubbles.svelte')     // Fallback for now
} as const;

export type ChartType = keyof typeof CHART_COMPONENTS;

// Chart configuration interface
export interface ChartConfig {
	id: ChartType;
	title: string;
	description: string;
	defaultWidth: number;
	defaultHeight: number;
	category: 'engagement' | 'analysis' | 'insights' | 'progress';
	realtime: boolean;
}

// Chart registry with metadata
export const CHART_REGISTRY: Record<ChartType, ChartConfig> = {
	quadBubbles: {
		id: 'quadBubbles',
		title: 'Response Bubbles',
		description: 'Visualize responses grouped by critical design lens',
		defaultWidth: 800,
		defaultHeight: 600,
		category: 'analysis',
		realtime: true
	},
	maturityDial: {
		id: 'maturityDial',
		title: 'AI Maturity Level',
		description: 'Radial gauge showing overall AI maturity progression',
		defaultWidth: 400,
		defaultHeight: 400,
		category: 'insights',
		realtime: false
	},
	participationPulse: {
		id: 'participationPulse',
		title: 'Participation Pulse',
		description: 'Real-time engagement activity over time',
		defaultWidth: 600,
		defaultHeight: 300,
		category: 'engagement',
		realtime: true
	},
	inclusivityMeter: {
		id: 'inclusivityMeter',
		title: 'Inclusivity Meter',
		description: 'Gauge showing participation fairness and balance',
		defaultWidth: 300,
		defaultHeight: 300,
		category: 'engagement',
		realtime: true
	},
	riskImpactMatrix: {
		id: 'riskImpactMatrix',
		title: 'Risk Impact Matrix',
		description: 'Plot identified risks by likelihood and impact',
		defaultWidth: 600,
		defaultHeight: 500,
		category: 'analysis',
		realtime: true
	},
	aiReadinessHeatmap: {
		id: 'aiReadinessHeatmap',
		title: 'AI Readiness Heatmap',
		description: 'Team readiness across different dimensions',
		defaultWidth: 700,
		defaultHeight: 400,
		category: 'insights',
		realtime: true
	},
	ethicsCompass: {
		id: 'ethicsCompass',
		title: 'Ethics Compass',
		description: 'Four-axis radar showing ethical priorities',
		defaultWidth: 400,
		defaultHeight: 400,
		category: 'insights',
		realtime: true
	},
	culturalInsightWheel: {
		id: 'culturalInsightWheel',
		title: 'Cultural Insight Wheel',
		description: 'Radial visualization of cultural themes',
		defaultWidth: 400,
		defaultHeight: 400,
		category: 'insights',
		realtime: true
	},
	storyPath: {
		id: 'storyPath',
		title: 'Workshop Story Path',
		description: 'Animated timeline of workshop progress',
		defaultWidth: 800,
		defaultHeight: 200,
		category: 'progress',
		realtime: true
	},
	wordConstellation: {
		id: 'wordConstellation',
		title: 'Word Constellation',
		description: 'Network visualization of keyword relationships',
		defaultWidth: 600,
		defaultHeight: 500,
		category: 'analysis',
		realtime: true
	}
};

// Utility functions
export function getChartsByCategory(category: ChartConfig['category']): ChartConfig[] {
	return Object.values(CHART_REGISTRY).filter(chart => chart.category === category);
}

export function getRealtimeCharts(): ChartConfig[] {
	return Object.values(CHART_REGISTRY).filter(chart => chart.realtime);
}

export async function loadChartComponent(chartType: ChartType) {
	try {
		const componentModule = await CHART_COMPONENTS[chartType]();
		return componentModule.default;
	} catch (error) {
		console.error(`Failed to load chart component: ${chartType}`, error);
		return null;
	}
}