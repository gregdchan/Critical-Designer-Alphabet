// Insightful color palette constants tuned for the lighter theme
export const INSIGHT_COLORS = {
	ocean: '#4c6ef5',
	sky: '#38bdf8',
	teal: '#2ab3bf',
	mint: '#22a06b',
	gold: '#f6b042',
	coral: '#f7745e',
	plum: '#9b5de5',
	rose: '#f472b6'
} as const;

export const BACKGROUND_COLORS = {
	base: '#eef1f5',
	surface: '#f8fafc',
	card: '#ffffff',
	strong: '#e2e7f0'
} as const;

// Lens color mapping
export const LENS_COLORS = {
	Risk: INSIGHT_COLORS.coral,
	Work: INSIGHT_COLORS.sky,
	Sustainability: INSIGHT_COLORS.mint,
	Ethics: INSIGHT_COLORS.plum,
	Justice: INSIGHT_COLORS.gold,
	Culture: INSIGHT_COLORS.ocean,
	Innovation: INSIGHT_COLORS.teal,
	Governance: INSIGHT_COLORS.rose
} as const;

// Risk matrix colors
export const RISK_COLORS = {
	low: '#22a06b', // Meadow
	medium: '#f6b042', // Amber
	high: '#f7745e', // Coral
	critical: '#d63f5c' // Deep rose
} as const;

// Maturity stage colors
export const MATURITY_COLORS = [
	'#94a3b8', // Slate - Foundational
	INSIGHT_COLORS.ocean, // Developing
	INSIGHT_COLORS.mint, // Proficient
	INSIGHT_COLORS.gold, // Advanced
	INSIGHT_COLORS.plum // Aspirational
] as const;

// Color scales for heatmaps
export const HEATMAP_SCALE = [
	'#e7f0ff', // Very low
	'#c5e1f7', // Low
	'#7ec9d9', // Medium
	'#3a94c2', // High
	'#1d4ed8' // Very high
] as const;

// Backwards compatibility export for existing imports
export const NEON_COLORS = INSIGHT_COLORS;

// Utility functions
export function getLensColor(lens: string): string {
	return LENS_COLORS[lens as keyof typeof LENS_COLORS] || INSIGHT_COLORS.sky;
}

export function getRiskColor(impact: number, likelihood: number): string {
	const score = impact * likelihood;
	if (score <= 4) return RISK_COLORS.low;
	if (score <= 9) return RISK_COLORS.medium;
	if (score <= 16) return RISK_COLORS.high;
	return RISK_COLORS.critical;
}

export function getMaturityColor(level: number): string {
	return MATURITY_COLORS[Math.max(0, Math.min(4, level - 1))];
}

export function interpolateNeonGradient(t: number): string {
	// Create gradient from ocean blue to warm coral
	const start = [76, 110, 245]; // ocean
	const end = [247, 116, 94]; // coral
	const r = Math.round(start[0] + t * (end[0] - start[0]));
	const g = Math.round(start[1] + t * (end[1] - start[1]));
	const b = Math.round(start[2] + t * (end[2] - start[2]));
	return `rgb(${r}, ${g}, ${b})`;
}

// Generate accessible color palette
export function generateAccessiblePalette(count: number): string[] {
	const colors = Object.values(INSIGHT_COLORS);
	const result: string[] = [];

	for (let i = 0; i < count; i++) {
		result.push(colors[i % colors.length]);
	}

	return result;
}
