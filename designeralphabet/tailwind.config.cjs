const typography = require('@tailwindcss/typography');

/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: 'class',
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
					colors: {
						brand: 'hsl(var(--brand))',
						'brand-soft': 'hsl(var(--brand-soft))',
						surface: 'hsl(var(--surface))',
						'surface-elevated': 'hsl(var(--surface-elevated))',
						'surface-muted': 'hsl(var(--surface-muted))',
						muted: 'hsl(var(--surface-muted))',
						'critical-accent': 'hsl(var(--accent-critical))',
						'neon-pink': '#ec4899',
						'neon-cyan': '#06b6d4',
						'neon-lime': '#84cc16',
						'retro-purple': '#a78bfa',
						'pastel-orange': '#fdba74',
						'pastel-green': '#bbf7d0',
						primary: '#4c6ef5',
						secondary: '#9b5de5',
						accent: '#38bdf8',
						success: '#22a06b',
						warning: '#f59e0b',
						error: '#f2645c',
						chart: {
							blue: '#4c6ef5',
							sky: '#38bdf8',
							teal: '#14b8a6',
							green: '#22a06b',
							gold: '#f6b042',
							coral: '#f7745e',
							plum: '#9b5de5',
							rose: '#f472b6',
						},
						darkBg: '#eef1f5',
						surfaceBase: '#ffffff',
						card: '#f1f5f9',
						midnight: '#dde3ef',
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
				soft: '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04)',
				medium: '0 10px 15px -3px rgba(0, 0, 0, 0.10), 0 4px 6px -2px rgba(0, 0, 0, 0.06)',
				card: '0 1px 3px 0 rgba(0, 0, 0, 0.10), 0 1px 2px 0 rgba(0, 0, 0, 0.04)',
				'neon-pink': '0 4px 14px 0 rgba(236, 72, 153, 0.18)',
				'neon-cyan': '0 4px 14px 0 rgba(6, 182, 212, 0.18)',
				'neon-lime': '0 4px 14px 0 rgba(132, 204, 22, 0.18)',
				'playful': '0 8px 32px 0 rgba(76, 110, 245, 0.10), 0 1.5px 8px 0 rgba(236, 72, 153, 0.10)',
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
