const typography = require('@tailwindcss/typography');

/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: 'class',
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				brand: 'hsl(var(--brand))',
				surface: 'hsl(var(--surface))',
				muted: 'hsl(var(--muted))',
				'critical-accent': 'hsl(var(--accent-critical))',
				primary: '#2563eb',
				secondary: '#7c3aed',
				accent: '#0ea5e9',
				success: '#16a34a',
				warning: '#f59e0b',
				error: '#dc2626',
				// Enhanced neon colors for immersive dashboard
				neonPink: '#ff2aad',
				neonCyan: '#00fff7',
				neonLime: '#aaff00',
				neonPurple: '#6c00ff',
				neonOrange: '#ff6b00',
				neonBlue: '#0099ff',
				neonYellow: '#ffff00',
				neonMagenta: '#ff00ff',
				retroPurple: '#8a2be2',
				darkBg: '#f5f7ff',
				surfaceBase: '#ffffff',
				card: '#f8fafc',
				midnight: '#e6efff'
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
				neon: '1.75rem'
			},
			boxShadow: {
				soft: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
				medium: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
				card: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
				// Legacy neon shadows (now subtle)
				'neon-pink': '0 4px 14px 0 rgba(236, 72, 153, 0.15)',
				'neon-cyan': '0 4px 14px 0 rgba(6, 182, 212, 0.15)',
				'neon-lime': '0 4px 14px 0 rgba(132, 204, 22, 0.15)'
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
