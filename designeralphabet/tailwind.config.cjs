const typography = require('@tailwindcss/typography');

/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: 'class',
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
					colors: {
						// Orange-Teal Theme
						'teal-dark': '#025259',
						'teal': '#007172',
						'teal-light': '#00a0a3',
						'orange': '#F29325',
						'orange-dark': '#D94F04',
						'cream': '#F4E2DE',
						
						// Semantic tokens
						brand: 'hsl(var(--brand))',
						'brand-soft': 'hsl(var(--brand-soft))',
						surface: 'hsl(var(--surface))',
						'surface-elevated': 'hsl(var(--surface-elevated))',
						'surface-muted': 'hsl(var(--surface-muted))',
						muted: 'hsl(var(--surface-muted))',
						'critical-accent': 'hsl(var(--accent-critical))',
						
						// Legacy compat (mapped to new theme)
						primary: '#007172',
						secondary: '#F29325',
						accent: '#D94F04',
						success: '#007172',
						warning: '#F29325',
						error: '#D94F04',
						
						// Chart colors (orange-teal palette)
						chart: {
							teal: '#007172',
							orange: '#F29325',
							'teal-dark': '#025259',
							'orange-dark': '#D94F04',
							cream: '#F4E2DE',
							'teal-light': '#00a0a3',
							'orange-light': '#ff9f1c',
							'teal-darker': '#013840',
						},
						
						// Surface colors
						darkBg: '#F4E2DE',
						surfaceBase: '#ffffff',
						card: '#F4E2DE',
						midnight: '#025259',
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
