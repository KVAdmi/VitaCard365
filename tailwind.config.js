/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ['class'],
	content: [
		'./pages/**/*.{js,jsx}',
		'./components/**/*.{js,jsx}',
		'./app/**/*.{js,jsx}',
		'./src/**/*.{js,jsx}',
	],
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px',
			},
		},
		extend: {
			colors: {
        'vita-blue': '#0d203f',
        'vita-orange': '#f15b31',
        'vita-white': '#ffffff',
        'vita-background': 'var(--background)',
        'vita-foreground': 'var(--foreground)',
        'vita-card': 'var(--card)',
        'vita-card-foreground': 'var(--card-foreground)',
        'vita-popover': 'var(--popover)',
        'vita-popover-foreground': 'var(--popover-foreground)',
        'vita-primary': 'var(--primary)',
        'vita-primary-foreground': 'var(--primary-foreground)',
        'vita-secondary': 'var(--secondary)',
        'vita-secondary-foreground': 'var(--secondary-foreground)',
        'vita-muted': 'var(--muted)',
        'vita-muted-foreground': 'var(--muted-foreground)',
        'vita-accent': 'var(--accent)',
        'vita-accent-foreground': 'var(--accent-foreground)',
        'vita-destructive': 'var(--destructive)',
        'vita-destructive-foreground': 'var(--destructive-foreground)',
        'vita-border': 'var(--border)',
        'vita-input': 'var(--input)',
        'vita-ring': 'var(--ring)',
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
			},
			keyframes: {
				'accordion-down': {
					from: { height: 0 },
					to: { height: 'var(--radix-accordion-content-height)' },
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: 0 },
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
			},
		},
	},
	plugins: [require('tailwindcss-animate')],
};