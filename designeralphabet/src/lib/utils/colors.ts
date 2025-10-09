// Unified theme colors driven by CSS variables for accessibility + brand consistency.
type ThemeColors = {
  brand: string;
  brandSoft: string;
  surface: string;
  surfaceElevated: string;
  surfaceMuted: string;
  ink: string;
  ink2: string;
  inkMuted: string;
  accentCritical: string;
  accentWarm: string;
  chart: string[];
  risk: { low: string; medium: string; high: string; critical: string };
  maturity: string[];
};

function cssVar(name: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

export function getThemeColors(): ThemeColors {
  return {
    brand: `hsl(${cssVar('--brand', '180 100% 22%')})`,
    brandSoft: `hsl(${cssVar('--brand-soft', '184 95% 17%')})`,
    surface: `hsl(${cssVar('--surface', '10 40% 98%')})`,
    surfaceElevated: `hsl(${cssVar('--surface-elevated', '0 0% 100%')})`,
    surfaceMuted: `hsl(${cssVar('--surface-muted', '10 30% 95%')})`,
    ink: `hsl(${cssVar('--text-primary', '0 0% 10%')})`,
    ink2: `hsl(${cssVar('--text-secondary', '0 0% 30%')})`,
    inkMuted: `hsl(${cssVar('--text-muted', '0 0% 50%')})`,
    accentCritical: `hsl(${cssVar('--accent-critical', '21 96% 43%')})`,
    accentWarm: `hsl(${cssVar('--accent-warm', '32 88% 54%')})`,
    chart: [
      cssVar('--chart-1', '#007172'),
      cssVar('--chart-2', '#F29325'),
      cssVar('--chart-3', '#025259'),
      cssVar('--chart-4', '#D94F04'),
      cssVar('--chart-5', '#F4E2DE'),
      cssVar('--chart-6', '#00a0a3'),
      cssVar('--chart-7', '#ff9f1c'),
      cssVar('--chart-8', '#013840'),
    ],
    risk: {
      low: cssVar('--risk-low', '#22a06b'),
      medium: cssVar('--risk-medium', '#f6b042'),
      high: cssVar('--risk-high', '#f7745e'),
      critical: cssVar('--risk-critical', '#d63f5c'),
    },
    maturity: [
      cssVar('--maturity-1', '#94a3b8'),
      cssVar('--maturity-2', '#4c6ef5'),
      cssVar('--maturity-3', '#22a06b'),
      cssVar('--maturity-4', '#f6b042'),
      cssVar('--maturity-5', '#9b5de5'),
    ],
  };
}

// Backwards-compat exports kept for now
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
  base: 'var(--surface, #eef1f5)',
  surface: 'var(--surface-elevated, #ffffff)',
  card: 'var(--surface-elevated, #ffffff)',
  muted: 'var(--surface-muted, #f8fafc)'
} as const;

export function getRiskColor(impact: number, likelihood: number): string {
  const score = impact * likelihood;
  const t = getThemeColors();
  if (score <= 4) return t.risk.low;
  if (score <= 9) return t.risk.medium;
  if (score <= 16) return t.risk.high;
  return t.risk.critical;
}

export function getMaturityColor(level: number): string {
  const t = getThemeColors();
  const idx = Math.max(0, Math.min(4, level - 1));
  return t.maturity[idx];
}

export function interpolateNeonGradient(t: number): string {
  const theme = getThemeColors();
  const tt = Math.max(0, Math.min(1, t));
  return `linear-gradient(90deg, ${theme.brandSoft} 0%, ${theme.brand} 100%)`;
}
