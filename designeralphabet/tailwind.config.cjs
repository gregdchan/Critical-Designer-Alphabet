const typography = require('@tailwindcss/typography');

/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: 'class',
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				/* Brand & surfaces from CSS vars */
				brand: 'hsl(var(--brand))',
				'brand-soft': 'hsl(var(--brand-soft))',

				surface: 'hsl(var(--surface))',
				'surface-elevated': 'hsl(var(--surface-elevated))',
				'surface-muted': 'hsl(var(--surface-muted))',

				ink: 'hsl(var(--text-primary))',
				'ink-2': 'hsl(var(--text-secondary))',
				'ink-muted': 'hsl(var(--text-muted))',

				line: 'hsl(var(--border-subtle))',
				'line-strong': 'hsl(var(--border-strong))',
				ring: 'hsl(var(--ring))',

				'accent-warm': 'hsl(var(--accent-warm))',
				'accent-critical': 'hsl(var(--accent-critical))',

				/* Override cyan colors for high contrast */
				cyan: {
					50: '#1a2332',
					100: '#1a2332',
					200: '#1a2332',
					300: '#1a2332',
					400: '#025259',
					500: '#007172',
					600: '#007172',
					700: '#025259',
					800: '#025259',
					900: '#013840',
				},

				chart: {
					1: 'var(--chart-1)',
					2: 'var(--chart-2)',
					3: 'var(--chart-3)',
					4: 'var(--chart-4)',
					5: 'var(--chart-5)',
					6: 'var(--chart-6)',
					7: 'var(--chart-7)',
					8: 'var(--chart-8)',
				},

				/* Legacy aliases to avoid breakage */
				'teal-dark': '#025259',
				teal: '#007172',
				'teal-light': '#00a0a3',
				orange: '#F29325',
				'orange-dark': '#D94F04',
				cream: '#F4E2DE',

				'neon-cyan': 'hsl(var(--brand))',

				primary: 'hsl(var(--brand))',
				secondary: 'hsl(var(--accent-warm))',
				accent: 'hsl(var(--accent-critical))',
				success: 'hsl(var(--teal-lite))',
				warning: 'hsl(var(--accent-warm))',
				error: 'hsl(var(--accent-critical))',

				darkBg: 'hsl(var(--surface-muted))',
				surfaceBase: 'hsl(var(--surface-elevated))',
				card: 'hsl(var(--surface-elevated))',
				midnight: 'hsl(var(--brand-soft))',
			},
			fontFamily: {
				sans: ['Poppins', 'system-ui', '-apple-system', 'sans-serif'],
				mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
				retro: ['"Press Start 2P"', 'cursive'],
				techno: ['Orbitron', 'sans-serif'],
				heading: ['Orbitron', 'sans-serif']
			},
			borderRadius: {
				xl: '1rem',
				'2xl': '1.5rem',
				neon: '1.75rem',
				playful: '2.5rem',
			},
			boxShadow: {
				soft: '0 4px 6px -1px rgba(2, 82, 89, 0.08), 0 2px 4px -1px rgba(2, 82, 89, 0.04)',
				medium: '0 10px 15px -3px rgba(2, 82, 89, 0.10), 0 4px 6px -2px rgba(2, 82, 89, 0.06)',
				card: '0 1px 3px 0 rgba(2, 82, 89, 0.10), 0 1px 2px 0 rgba(2, 82, 89, 0.04)',
				brand: '0 4px 14px 0 hsl(var(--brand) / 0.25)',
				'teal': '0 4px 14px 0 rgba(0, 113, 114, 0.25)',
				'orange': '0 4px 14px 0 rgba(242, 147, 37, 0.25)',
				'playful': '0 8px 32px 0 rgba(0, 113, 114, 0.12), 0 1.5px 8px 0 rgba(242, 147, 37, 0.12)',
			},
			keyframes: {
				'fade-in': {
					'0%': { opacity: '0', transform: 'translateY(10px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'slide-up': {
					'0%': { transform: 'translateY(100%)' },
					'100%': { transform: 'translateY(0)' }
				}
			},
			animation: {
				'fade-in': 'fade-in 0.5s ease-out',
				'slide-up': 'slide-up 0.3s ease-out'
			}
		}
	},
	plugins: [typography]
};
