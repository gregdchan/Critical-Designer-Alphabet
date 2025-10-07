// Neon color palette constants
export const NEON_COLORS = {
	pink: '#ff2aad',
	cyan: '#00fff7',
	lime: '#aaff00',
	purple: '#6c00ff',
	orange: '#ff6b00',
	blue: '#0099ff',
	yellow: '#ffff00',
	magenta: '#ff00ff'
} as const;

export const BACKGROUND_COLORS = {
	dark: '#0d0d0d',
	surface: '#1a1a1a',
	card: '#2a2a2a'
} as const;

// Lens color mapping
export const LENS_COLORS = {
	Risk: NEON_COLORS.pink,
	Work: NEON_COLORS.cyan,
	Sustainability: NEON_COLORS.lime,
	Ethics: NEON_COLORS.purple,
	Justice: NEON_COLORS.orange,
	Culture: NEON_COLORS.blue,
	Innovation: NEON_COLORS.yellow,
	Governance: NEON_COLORS.magenta
} as const;

// Risk matrix colors
export const RISK_COLORS = {
	low: '#10b981', // Green
	medium: '#f59e0b', // Yellow
	high: '#ef4444', // Red
	critical: '#dc2626' // Dark red
} as const;

// Maturity stage colors
export const MATURITY_COLORS = [
	'#6b7280', // Gray - Foundational
	'#3b82f6', // Blue - Developing
	'#10b981', // Green - Proficient
	'#f59e0b', // Yellow - Advanced
	'#8b5cf6' // Purple - Aspirational
] as const;

// Color scales for heatmaps
export const HEATMAP_SCALE = [
	'#1e293b', // Very low
	'#0f766e', // Low
	'#059669', // Medium
	'#fbbf24', // High
	'#f59e0b' // Very high
] as const;

// Utility functions
export function getLensColor(lens: string): string {
	return LENS_COLORS[lens as keyof typeof LENS_COLORS] || NEON_COLORS.cyan;
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
	// Create gradient from cyan to pink
	const r = Math.round(0 + t * 255);
	const g = Math.round(255 - t * 213);
	const b = Math.round(247 - t * 74);
	return `rgb(${r}, ${g}, ${b})`;
}

// Generate accessible color palette
export function generateAccessiblePalette(count: number): string[] {
	const colors = Object.values(NEON_COLORS);
	const result: string[] = [];

	for (let i = 0; i < count; i++) {
		result.push(colors[i % colors.length]);
	}

	return result;
}
