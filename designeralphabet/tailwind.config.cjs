const typography = require('@tailwindcss/typography');

/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: 'class',
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				/* ===== SEMANTIC COLOR SCALES ===== */

				/* Brand (Teal) - Full scale */
				brand: {
					50: 'hsl(var(--brand-50))',
					100: 'hsl(var(--brand-100))',
					200: 'hsl(var(--brand-200))',
					300: 'hsl(var(--brand-300))',
					400: 'hsl(var(--brand-400))',
					500: 'hsl(var(--brand-500))', // Main brand
					600: 'hsl(var(--brand-600))',
					700: 'hsl(var(--brand-700))',
					800: 'hsl(var(--brand-800))',
					900: 'hsl(var(--brand-900))',
					DEFAULT: 'hsl(var(--brand))',
					hover: 'hsl(var(--brand-hover))',
					active: 'hsl(var(--brand-active))',
					subtle: 'hsl(var(--brand-subtle))',
					muted: 'hsl(var(--brand-muted))'
				},

				/* Accent (Coral/Peach) - Full scale */
				accent: {
					50: 'hsl(var(--accent-50))',
					100: 'hsl(var(--accent-100))',
					200: 'hsl(var(--accent-200))',
					300: 'hsl(var(--accent-300))',
					400: 'hsl(var(--accent-400))',
					500: 'hsl(var(--accent-500))', // Main accent
					600: 'hsl(var(--accent-600))',
					700: 'hsl(var(--accent-700))',
					800: 'hsl(var(--accent-800))',
					900: 'hsl(var(--accent-900))',
					DEFAULT: 'hsl(var(--accent))',
					hover: 'hsl(var(--accent-hover))',
					subtle: 'hsl(var(--accent-subtle))'
				},

				/* Secondary (Purple) - Full scale */
				secondary: {
					50: 'hsl(var(--secondary-50))',
					100: 'hsl(var(--secondary-100))',
					200: 'hsl(var(--secondary-200))',
					300: 'hsl(var(--secondary-300))',
					400: 'hsl(var(--secondary-400))',
					500: 'hsl(var(--secondary-500))',
					600: 'hsl(var(--secondary-600))',
					700: 'hsl(var(--secondary-700))',
					800: 'hsl(var(--secondary-800))',
					900: 'hsl(var(--secondary-900))',
					DEFAULT: 'hsl(var(--secondary))'
				},

				/* Tertiary (Sage) - Full scale */
				tertiary: {
					50: 'hsl(var(--tertiary-50))',
					100: 'hsl(var(--tertiary-100))',
					200: 'hsl(var(--tertiary-200))',
					300: 'hsl(var(--tertiary-300))',
					400: 'hsl(var(--tertiary-400))',
					500: 'hsl(var(--tertiary-500))',
					600: 'hsl(var(--tertiary-600))',
					700: 'hsl(var(--tertiary-700))',
					800: 'hsl(var(--tertiary-800))',
					900: 'hsl(var(--tertiary-900))',
					DEFAULT: 'hsl(var(--tertiary))'
				},

				/* Neutral (Warm Gray) - Full scale */
				neutral: {
					50: 'hsl(var(--neutral-50))',
					100: 'hsl(var(--neutral-100))',
					200: 'hsl(var(--neutral-200))',
					300: 'hsl(var(--neutral-300))',
					400: 'hsl(var(--neutral-400))',
					500: 'hsl(var(--neutral-500))',
					600: 'hsl(var(--neutral-600))',
					700: 'hsl(var(--neutral-700))',
					800: 'hsl(var(--neutral-800))',
					900: 'hsl(var(--neutral-900))',
					DEFAULT: 'hsl(var(--neutral-500))'
				},

				/* ===== SEMANTIC TOKENS ===== */

				/* Surfaces */
				surface: {
					DEFAULT: 'hsl(var(--surface))',
					base: 'hsl(var(--surface-base))',
					raised: 'hsl(var(--surface-raised))',
					overlay: 'hsl(var(--surface-overlay))',
					sunken: 'hsl(var(--surface-sunken))',
					elevated: 'hsl(var(--surface-elevated))',
					muted: 'hsl(var(--surface-muted))'
				},

				/* Text */
				text: {
					primary: 'hsl(var(--text-primary))',
					secondary: 'hsl(var(--text-secondary))',
					tertiary: 'hsl(var(--text-tertiary))',
					disabled: 'hsl(var(--text-disabled))',
					brand: 'hsl(var(--text-brand))',
					inverse: 'hsl(var(--text-inverse))',
					muted: 'hsl(var(--text-muted))' // Legacy alias
				},

				/* Borders */
				border: {
					DEFAULT: 'hsl(var(--border-default))',
					subtle: 'hsl(var(--border-subtle))',
					strong: 'hsl(var(--border-strong))',
					brand: 'hsl(var(--border-brand))',
					focus: 'hsl(var(--border-focus))'
				},

				/* Interactive States */
				interactive: {
					DEFAULT: 'hsl(var(--interactive-default))',
					hover: 'hsl(var(--interactive-hover))',
					active: 'hsl(var(--interactive-active))',
					disabled: 'hsl(var(--interactive-disabled))'
				},

				/* Status Colors - Success */
				success: {
					DEFAULT: 'hsl(var(--success))',
					hover: 'hsl(var(--success-hover))',
					subtle: 'hsl(var(--success-subtle))',
					muted: 'hsl(var(--success-muted))'
				},

				/* Status Colors - Warning */
				warning: {
					DEFAULT: 'hsl(var(--warning))',
					hover: 'hsl(var(--warning-hover))',
					subtle: 'hsl(var(--warning-subtle))',
					muted: 'hsl(var(--warning-muted))'
				},

				/* Status Colors - Error */
				error: {
					DEFAULT: 'hsl(var(--error))',
					hover: 'hsl(var(--error-hover))',
					subtle: 'hsl(var(--error-subtle))',
					muted: 'hsl(var(--error-muted))'
				},

				/* Status Colors - Info */
				info: {
					DEFAULT: 'hsl(var(--info))',
					hover: 'hsl(var(--info-hover))',
					subtle: 'hsl(var(--info-subtle))',
					muted: 'hsl(var(--info-muted))'
				},

				/* Chart Colors */
				chart: {
					1: 'hsl(var(--chart-1))',
					2: 'hsl(var(--chart-2))',
					3: 'hsl(var(--chart-3))',
					4: 'hsl(var(--chart-4))',
					5: 'hsl(var(--chart-5))',
					6: 'hsl(var(--chart-6))',
					7: 'hsl(var(--chart-7))',
					8: 'hsl(var(--chart-8))',
					9: 'hsl(var(--chart-9))',
					10: 'hsl(var(--chart-10))'
				},

				/* ===== LEGACY COMPATIBILITY ===== */

				/* Legacy semantic names */
				ink: 'hsl(var(--text-primary))',
				'ink-2': 'hsl(var(--text-secondary))',
				'ink-muted': 'hsl(var(--text-muted))',

				line: 'hsl(var(--border-subtle))',
				'line-strong': 'hsl(var(--border-strong))',
				ring: 'hsl(var(--ring))',

				'accent-warm': 'hsl(var(--accent))',
				'accent-critical': 'hsl(var(--error))',

				/* Legacy brand aliases */
				'brand-soft': 'hsl(var(--brand-subtle))',
				'neon-cyan': 'hsl(var(--brand))',

				/* Legacy specific colors */
				'teal-dark': '#025259',
				teal: '#007172',
				'teal-light': '#00a0a3',
				orange: '#F29325',
				'orange-dark': '#D94F04',
				cream: '#F4E2DE',

				/* Override cyan for high contrast (legacy) */
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
					900: '#013840'
				},

				/* Legacy utility aliases */
				primary: 'hsl(var(--brand))',
				darkBg: 'hsl(var(--surface-muted))',
				surfaceBase: 'hsl(var(--surface-elevated))',
				card: 'hsl(var(--surface-elevated))',
				midnight: 'hsl(var(--brand-subtle))'
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
				playful: '2.5rem'
			},
			boxShadow: {
				soft: '0 4px 6px -1px rgba(2, 82, 89, 0.08), 0 2px 4px -1px rgba(2, 82, 89, 0.04)',
				medium: '0 10px 15px -3px rgba(2, 82, 89, 0.10), 0 4px 6px -2px rgba(2, 82, 89, 0.06)',
				card: '0 1px 3px 0 rgba(2, 82, 89, 0.10), 0 1px 2px 0 rgba(2, 82, 89, 0.04)',
				brand: '0 4px 14px 0 hsl(var(--brand) / 0.25)',
				teal: '0 4px 14px 0 rgba(0, 113, 114, 0.25)',
				orange: '0 4px 14px 0 rgba(242, 147, 37, 0.25)',
				playful: '0 8px 32px 0 rgba(0, 113, 114, 0.12), 0 1.5px 8px 0 rgba(242, 147, 37, 0.12)'
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
